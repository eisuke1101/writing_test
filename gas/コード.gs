// メニューの追加処理
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('【添削依頼】')
    .addItem('１．回答インポート', 'importAnswers')
    .addItem('２．提出者チェック', 'checkSubmitter')
    .addItem('３．ファイル出力実行', 'exportToGoogleDocs')
    .addItem('４．添削依頼メール送信', 'sendBatchEmailWithAttachments')
    .addToUi();
  ui.createMenu('【受講者に返送】')
    .addItem('１．ファイルチェック', 'compareFolders')
    .addItem('２．添削結果返送メール送信', 'sendEmailByFileNameMatch')
    .addToUi();
  ui.createMenu('【集計】')
    .addItem('集計', 'aggregateHistory') // ★新規追加
    .addToUi();
}

// --------------------------------------------------
// HTMLフォームからの受信（Webアプリ）
// --------------------------------------------------
function doPost(e) {
  try {
    // 1. HTML側からテキストデータを受け取る
    const name  = e.parameter.nameA;
    const stnum = e.parameter.school_number;
    const tel   = e.parameter.tel;
    const email = e.parameter.mail;
    const body  = e.parameter.submit_text;

    // 2. HTML側からファイルデータを受け取る
    const fileName = e.parameter.fileName;
    const mimeType = e.parameter.mimeType;
    const fileData = e.parameter.fileData;

    let fileUrl = "添付なし";

    // ファイルデータが存在する場合はGoogleドライブの指定フォルダに保存する
    if (fileData && fileName) {
      try {
        const decodedData = Utilities.base64Decode(fileData);
        const blob = Utilities.newBlob(decodedData, mimeType, fileName);

        // ★保存先フォルダのIDを指定してください
        const folderId = "1L7Qoo3I0cnzR5kcKSVj6zVW893WHljWc";
        const folder = DriveApp.getFolderById(folderId);

        // 指定したフォルダ内にファイルを作成
        const savedFile = folder.createFile(blob);
        fileUrl = savedFile.getUrl();
      } catch (error) {
        fileUrl = "ファイルの保存エラー: " + error.message;
      }
    }

    // 3. スプレッドシートへの記録（末尾にファイルのURLを追加）
    // ★修正：getActiveSheet()はWebアプリから呼ぶと左端のシートになるため、シート名で指定
    const sheetName = "フォームの回答_英語日記";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`「${sheetName}」シートが見つかりません。`);
    }
    // A:日時 B:メール C:氏名 D:本文 E:生徒番号 F:電話番号 G:ファイルURL（H:インポート状況は空欄）
    sheet.appendRow([new Date(), email, name, body, stnum, tel, fileUrl]);

    // 4. 指定の宛先へのメール送信処理
    const targetEmail = "admin@example.com"; // ★宛先のメールアドレスに変更してください
    const subject = "【英語日記】フォームから新しい提出がありました";

    const mailBody = `英語日記のフォームから新しい提出がありました。\n\n`
                   + `----------------------------------\n`
                   + `【お名前】 ${name}\n`
                   + `【生徒番号】 ${stnum}\n`
                   + `【お電話番号】 ${tel}\n`
                   + `【Eメール】 ${email}\n\n`
                   + `【提出内容（テキスト）】\n${body}\n\n`
                   + `【添付ファイルURL】\n${fileUrl}\n`
                   + `----------------------------------\n`;

    MailApp.sendEmail(targetEmail, subject, mailBody);

    return ContentService.createTextOutput("success");

  } catch (err) {
    // ★追加：エラー内容をGASエディタの「実行数」ログに残す
    console.error(err);
    return ContentService.createTextOutput("error: " + err.message);
  }
}

// --------------------------------------------------
// 回答インポート
// --------------------------------------------------
function importAnswers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();

  // 対象シートを「提出作業シート」に固定
  const targetSheet = ss.getSheetByName("提出作業シート");

  if (!targetSheet) {
    SpreadsheetApp.getUi().alert("「提出作業シート」が見つかりません。シート名を確認してください。");
    return;
  }

  const sourceSheetName = "フォームの回答_英語日記";
  const sourceSheet = ss.getSheetByName(sourceSheetName);

  if (!sourceSheet) {
    SpreadsheetApp.getUi().alert(`「${sourceSheetName}」シートが見つかりません。シート名を確認してください。`);
    return;
  }

  const sourceStartRow = 2; // 1行目はヘッダーと想定
  const sourceLastRow = sourceSheet.getLastRow();

  if (sourceLastRow < sourceStartRow) {
    SpreadsheetApp.getUi().alert("インポートするデータがありません。");
    return;
  }

  // ★追加：M列の見出しが空なら設定
  ensureHeader(targetSheet, COL_WORK.SUBMITTED_AT, "提出日時");

  // 処理対象シートの最終行を取得し、その次の行から追記開始
  let targetCurrentRow = targetSheet.getLastRow() + 1;

  // フォーム回答シートのデータを一括取得（A列〜H列 = 8列分）
  const sourceRange = sourceSheet.getRange(sourceStartRow, 1, sourceLastRow - sourceStartRow + 1, 8);
  const sourceData = sourceRange.getValues();

  let importCount = 0;

  for (let i = 0; i < sourceData.length; i++) {
    const row = sourceData[i];
    const submittedAt = row[0];                 // A列：提出日時
    const email = String(row[1]).trim();        // B列：メールアドレス
    const name = String(row[2]).trim();         // C列：氏名
    let content = String(row[3]).trim();        // D列：本文 (※再代入のためlet)
    const docUrl = String(row[6]).trim();       // G列：ドキュメントURL
    const importStatus = String(row[7]).trim(); // H列：インポート状況

    // H列が空欄の場合のみインポート処理を実行
    if (importStatus === "") {

      // D列(本文)が空欄 かつ G列(URL)に入力がある場合
      if (content === "" && docUrl !== "") {
        const match = docUrl.match(/[-\w]{25,}/); // URLからID部分を抽出

        if (match) {
          const docId = match[0];
          try {
            const file = DriveApp.getFileById(docId);
            const mimeType = file.getMimeType();

            // ① Googleドキュメントの場合
            if (mimeType === MimeType.GOOGLE_DOCS) {
              const doc = DocumentApp.openById(docId);
              content = doc.getBody().getText();
            }
            // ② Wordファイルの場合（.doc または .docx）
            else if (mimeType === MimeType.MICROSOFT_WORD || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
              // Drive APIが追加されているかチェック
              if (typeof Drive === 'undefined') {
                content = `【エラー】Wordファイルを読み込むには、GASエディタ左側の「サービス」から「Drive API」を追加してください。\nURL: ${docUrl}`;
              } else {
                try {
                  // Wordを一時的なGoogleドキュメントに変換
                  let tempFile;
                  if (Drive.Files.create) { // Drive API v3用
                    tempFile = Drive.Files.create({ name: 'Temp_Convert', mimeType: MimeType.GOOGLE_DOCS }, file.getBlob());
                  } else { // Drive API v2用
                    tempFile = Drive.Files.insert({ title: 'Temp_Convert', mimeType: MimeType.GOOGLE_DOCS }, file.getBlob());
                  }

                  // 変換したドキュメントからテキストを取得
                  const tempDoc = DocumentApp.openById(tempFile.id);
                  content = tempDoc.getBody().getText();

                  // 用済みの変換ファイルをゴミ箱へ移動
                  DriveApp.getFileById(tempFile.id).setTrashed(true);

                } catch (convErr) {
                  content = `【エラー】Wordファイルのテキスト抽出に失敗しました。\n詳細: ${convErr.message}\nURL: ${docUrl}`;
                }
              }
            }
            // ③ それ以外のファイルの場合
            else {
              content = `【エラー】GoogleドキュメントまたはWordファイル以外の形式(${mimeType})です。\nURL: ${docUrl}`;
            }
          } catch (e) {
            content = `【エラー】ファイルへのアクセス権限がないか、ファイルが存在しません。\n詳細: ${e.message}\nURL: ${docUrl}`;
          }
        } else {
          content = `【エラー】不正なURLです。ドキュメントIDを抽出できませんでした。\nURL: ${docUrl}`;
        }
      }

      // 処理対象シートへの書き込み
      targetSheet.getRange(targetCurrentRow, COL_WORK.NAME).setValue(name);       // C列：氏名
      targetSheet.getRange(targetCurrentRow, COL_WORK.EMAIL).setValue(email);     // D列：メールアドレス
      targetSheet.getRange(targetCurrentRow, COL_WORK.CONTENT).setValue(content); // E列：本文

      // ★追加：提出日時（M列）と、提出日時の月から求めた対象月（F列）を書き込む
      // 例：10/31 23:00 の提出を 11/1 に処理しても対象月は「202610」になる
      if (submittedAt instanceof Date) {
        targetSheet.getRange(targetCurrentRow, COL_WORK.SUBMITTED_AT).setValue(submittedAt);
        targetSheet.getRange(targetCurrentRow, COL_WORK.MONTH).setNumberFormat('@')
          .setValue(Utilities.formatDate(submittedAt, tz, "yyyyMM"));
      }

      // フォームの回答シートのH列に「済」を入力
      sourceSheet.getRange(sourceStartRow + i, 8).setValue("済");

      targetCurrentRow++;
      importCount++;
    }
  }

  SpreadsheetApp.getUi().alert(`${importCount}件の回答をインポートしました。`);
}


// --------------------------------------------------
// 共通設定・共通関数（提出者チェック／ファイル出力／集計で使用）
// --------------------------------------------------

// 提出作業シートの列番号
const COL_WORK = {
  KANRI_NO: 1,      // A：管理番号
  ID: 2,            // B：ID
  NAME: 3,          // C：氏名
  EMAIL: 4,         // D：メールアドレス
  CONTENT: 5,       // E：本文
  MONTH: 6,         // F：対象月（yyyyMM）
  COUNT: 7,         // G：回数（開始回）
  WORDS: 8,         // H：単語数
  FILE_NAME: 9,     // I：ファイル名
  OUTPUT: 10,       // J：出力（済）
  UNITS: 11,        // K：回数分
  LIMIT_STATUS: 12, // L：上限判定
  SUBMITTED_AT: 13  // M：提出日時
};
const WORK_COLS = 13;

// 提出履歴の列番号
const COL_HIST = {
  KANRI_NO: 1,      // A：管理番号
  ID: 2,            // B：ID
  NAME: 3,          // C：氏名
  EMAIL: 4,         // D：メールアドレス
  FILE_NAME: 5,     // E：ファイル名
  MONTH: 6,         // F：対象月
  OUTPUT_AT: 7,     // G：出力日時
  RETURNED_AT: 8,   // H：生徒返送日
  CONTENT: 9,       // I：本文
  UNITS: 10,        // J：回数分
  SUBMITTED_AT: 11  // K：提出日時
};

// 上限判定の値
const LIMIT_OK = "OK";

/**
 * ★追加：単語数から「何回分の提出か」を算出する
 * 1〜215語:1回分 / 216〜415語:2回分 / 416〜615語:3回分 / 以降200語ごとに+1回分
 */
function calcSubmitUnits(wordCount) {
  const wc = Number(wordCount) || 0;
  return Math.max(1, Math.ceil((wc - 15) / 200));
}

/**
 * ★追加：「回数分」の値を数値で返す（空欄・不正値は1回分として扱う）
 */
function toSubmitUnits(value) {
  const n = parseInt(value, 10);
  return n >= 1 ? n : 1;
}

/**
 * ★追加：対象月（yyyyMM）から月別シート名（yyyy年MM月）を作る
 */
function monthToSheetName(month) {
  const m = String(month).trim();
  return `${m.substring(0, 4)}年${m.substring(4, 6)}月`;
}

/**
 * ★追加：マスタO列の値と対象月から、月の上限回数を返す（判定できない場合は null）
 * 「4-」:4回 / 「8-」:8回 / 「E-」:対象月の日数 / 「T」:1回
 */
function getMonthlyLimit(planCode, month) {
  const code = String(planCode || "").trim().toUpperCase();
  if (code.indexOf("4") === 0) return 4;
  if (code.indexOf("8") === 0) return 8;
  if (code.indexOf("T") === 0) return 1;
  if (code.indexOf("E") === 0) {
    const m = String(month).trim();
    const year = Number(m.substring(0, 4));
    const mon = Number(m.substring(4, 6));
    if (!year || !mon) return null;
    return new Date(year, mon, 0).getDate(); // 対象月の末日 = 日数
  }
  return null;
}

/**
 * ★追加：見出しセルが空なら設定する
 */
function ensureHeader(sheet, col, label) {
  if (sheet.getRange(1, col).getValue() === "") {
    sheet.getRange(1, col).setValue(label);
  }
}

/**
 * ★追加：マスタの対象月シートを読み込み、メールアドレス・管理番号で引ける形にする（月ごとにキャッシュ）
 * 戻り値：{ byEmail, byKanriNo, error }
 */
function loadMasterForMonth(masterSs, month, cache) {
  if (cache[month]) return cache[month];

  const sheetName = monthToSheetName(month);
  const result = { byEmail: {}, byKanriNo: {}, error: "" };
  const masterSheet = masterSs.getSheetByName(sheetName);

  if (!masterSheet) {
    result.error = `参照先ファイルに「${sheetName}」シートがありません`;
  } else {
    const masterData = masterSheet.getDataRange().getValues();
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const info = {
        kanriNo: String(row[1]).trim(),       // B列
        name: row[2],                         // C列
        id: String(row[4]).padStart(8, '0'),  // E列 (8桁0埋め)
        planCode: String(row[14]).trim(),     // O列：月の上限（4- / 8- / E- / T）
        fileName: row[20]                     // U列
      };
      // G・H・I列のいずれかのメールアドレスで一致すればよいよう、3列すべてをキーとして登録
      for (let c = 6; c <= 8; c++) {
        const email = String(row[c]).trim();
        if (email !== "" && !result.byEmail[email]) {
          result.byEmail[email] = info;
        }
      }
      if (info.kanriNo !== "" && !result.byKanriNo[info.kanriNo]) {
        result.byKanriNo[info.kanriNo] = info;
      }
    }
  }

  cache[month] = result;
  return result;
}

/**
 * ★追加：「参照先」シートA2のマスタースプレッドシートを開く（失敗時はアラートを出して null）
 */
function openMasterSpreadsheet(ss) {
  const refSheet = ss.getSheetByName("参照先");
  if (!refSheet) {
    SpreadsheetApp.getUi().alert("「参照先」シートが見つかりません。");
    return null;
  }
  const masterSpreadsheetId = String(refSheet.getRange("A2").getValue()).trim();
  try {
    return SpreadsheetApp.openById(masterSpreadsheetId);
  } catch (e) {
    SpreadsheetApp.getUi().alert("参照先ファイルを開けませんでした。「参照先」シートA2のIDを確認してください。");
    return null;
  }
}

/**
 * ★追加：提出履歴から「管理番号_対象月」ごとの使用済み回数分を集計する
 */
function sumUsedUnits(historyData) {
  const used = {};
  for (let i = 1; i < historyData.length; i++) {
    const kanriNo = String(historyData[i][COL_HIST.KANRI_NO - 1]).trim();
    const month = String(historyData[i][COL_HIST.MONTH - 1]).trim();
    if (kanriNo === "" || month === "") continue;
    const key = `${kanriNo}_${month}`;
    used[key] = (used[key] || 0) + toSubmitUnits(historyData[i][COL_HIST.UNITS - 1]);
  }
  return used;
}


// --------------------------------------------------
// 提出者チェック
// --------------------------------------------------
function checkSubmitter() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const sheet = ss.getSheetByName("提出作業シート");

  if (!sheet) {
    SpreadsheetApp.getUi().alert("「提出作業シート」が見つかりません。シート名を確認してください。");
    return;
  }
  const startRow = 2;
  const lastRow = sheet.getLastRow();

  if (lastRow < startRow) return;

  // ★変更：マスタは対象月ごとに「yyyy年MM月」シートを参照する（参照先B2は使用しない）
  const masterSs = openMasterSpreadsheet(ss);
  if (!masterSs) return;
  const masterCache = {};

  const historySheet = ss.getSheetByName("提出履歴");
  if (!historySheet) {
    SpreadsheetApp.getUi().alert("「提出履歴」シートが見つかりません。");
    return;
  }

  const historyData = historySheet.getDataRange().getValues();

  // ★変更：回数は「管理番号＋対象月」単位で、提出履歴J列「回数分」を合計して判定
  const usedMap = sumUsedUnits(historyData);

  // 重複チェック用（正規化した本文 → 最初に見つかった場所）
  const processedContentMap = {};
  for (let i = 1; i < historyData.length; i++) {
    const hContent = normalizeText(String(historyData[i][COL_HIST.CONTENT - 1] || ""));
    if (hContent && !processedContentMap[hContent]) {
      processedContentMap[hContent] = `提出履歴 ${i + 1}行目`;
    }
  }

  const today = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYearMonth = Utilities.formatDate(today, tz, "yyyyMM");

  const targetRange = sheet.getRange(startRow, 1, lastRow - startRow + 1, WORK_COLS);
  const targetData = targetRange.getValues();

  // 見出しが空なら設定
  ensureHeader(sheet, COL_WORK.UNITS, "回数分");
  ensureHeader(sheet, COL_WORK.LIMIT_STATUS, "上限判定");
  ensureHeader(sheet, COL_WORK.SUBMITTED_AT, "提出日時");

  // 色の定義
  const LIMIT_NG_COLOR = "#f4cccc"; // 上限超過・判定不可：行全体を薄い赤
  const ALERT_COLOR = "#ff0000";    // 本文重複：E列を赤
  const MULTI_COLOR = "#ff00ff";    // 複数回分：H・I・K列をマゼンタ

  // 提出作業シートの処理済（J列が空欄でない）行の本文も重複チェック用に登録
  for (let i = 0; i < targetData.length; i++) {
    const status = String(targetData[i][COL_WORK.OUTPUT - 1] || "").trim();
    const normContent = normalizeText(String(targetData[i][COL_WORK.CONTENT - 1]));
    if (status !== "" && normContent && !processedContentMap[normContent]) {
      processedContentMap[normContent] = `提出作業シート ${startRow + i}行目`;
    }
  }

  const limitNgRows = [];    // 上限超過・判定不可の行
  const multiUnitRows = [];  // 複数回分の提出の行
  const duplicateRows = [];  // 本文重複の行

  let processCount = 0;

  for (let i = 0; i < targetData.length; i++) {
    const rowNo = startRow + i;
    const rowData = targetData[i];

    // J列（出力）が空欄でない（すでに「済」「対象外」などが入っている）場合は処理をスキップ
    const outputStatus = String(rowData[COL_WORK.OUTPUT - 1] || "").trim();
    if (outputStatus !== "") {
      continue;
    }

    const email = String(rowData[COL_WORK.EMAIL - 1]).trim();
    const content = String(rowData[COL_WORK.CONTENT - 1]).trim();
    const submittedAt = rowData[COL_WORK.SUBMITTED_AT - 1];

    // ★変更：対象月はインポート時に提出日時から設定済み。空欄の場合のみ、提出日時→実行日の順で補完
    let targetMonth = String(rowData[COL_WORK.MONTH - 1] || "").trim();
    if (targetMonth === "") {
      targetMonth = (submittedAt instanceof Date) ? Utilities.formatDate(submittedAt, tz, "yyyyMM") : currentYearMonth;
      sheet.getRange(rowNo, COL_WORK.MONTH).setNumberFormat('@').setValue(targetMonth);
    }

    // ★変更：ファイル名の日付は提出日（提出日時が無い場合のみ実行日）
    const baseDate = (submittedAt instanceof Date) ? submittedAt : today;
    const dateStr = Utilities.formatDate(baseDate, tz, "d")
      + months[Number(Utilities.formatDate(baseDate, tz, "M")) - 1]
      + Utilities.formatDate(baseDate, tz, "yyyy");

    // 単語数と回数分
    const wordCount = content === "" ? 0 : content.split(/\s+/).length;
    const units = calcSubmitUnits(wordCount);
    sheet.getRange(rowNo, COL_WORK.WORDS).setValue(wordCount);
    sheet.getRange(rowNo, COL_WORK.UNITS).setValue(units);

    // 行の色・太字を一旦リセット（再実行時に解消済みの色を戻すため）
    sheet.getRange(rowNo, 1, 1, WORK_COLS).setBackground(null).setFontWeight("normal");

    // ★追加：マスタ照合と上限判定
    let limitStatus = "";
    let currentCount = "";
    const master = loadMasterForMonth(masterSs, targetMonth, masterCache);
    const info = master.byEmail[email];

    if (master.error) {
      limitStatus = `判定不可（${master.error}）`;
    } else if (email === "" || !info) {
      limitStatus = "判定不可（メールアドレス未登録）";
    } else {
      sheet.getRange(rowNo, COL_WORK.KANRI_NO).setValue(info.kanriNo);
      sheet.getRange(rowNo, COL_WORK.ID).setNumberFormat('@').setValue(info.id);
      sheet.getRange(rowNo, COL_WORK.NAME).setValue(info.name);

      const key = `${info.kanriNo}_${targetMonth}`;
      const previousCount = usedMap[key] || 0;
      currentCount = previousCount + 1; // G列は開始回（例：3回目〜4回目なら3）

      const limit = getMonthlyLimit(info.planCode, targetMonth);
      if (limit === null) {
        limitStatus = `判定不可（受講プランが不明：O列「${info.planCode}」）`;
      } else if (previousCount + units > limit) {
        limitStatus = `上限超過（月${limit}回まで／今月提出済${previousCount}回／今回${units}回分）`;
      } else {
        limitStatus = LIMIT_OK;
        // 上限内の提出のみ使用済み回数に加算（超過分は出力しないため加算しない）
        usedMap[key] = previousCount + units;
      }

      // 2回分以上なら末尾に「×N」を付与
      const unitSuffix = units >= 2 ? `×${units}` : "";
      const finalFileName = `${info.fileName}${currentCount} ${dateStr}${unitSuffix}`;
      sheet.getRange(rowNo, COL_WORK.FILE_NAME).setValue(finalFileName);
    }

    sheet.getRange(rowNo, COL_WORK.COUNT).setValue(currentCount);
    sheet.getRange(rowNo, COL_WORK.LIMIT_STATUS).setValue(limitStatus);

    // 上限超過・判定不可：行全体を薄い赤にし、L列を太字に
    if (limitStatus !== LIMIT_OK) {
      sheet.getRange(rowNo, 1, 1, WORK_COLS).setBackground(LIMIT_NG_COLOR);
      sheet.getRange(rowNo, COL_WORK.LIMIT_STATUS).setFontWeight("bold");
      limitNgRows.push(`${rowNo}行目：${limitStatus}`);
    }

    // 本文が処理済の行と同一なら E列を赤色に
    const normContent = normalizeText(content);
    if (normContent && processedContentMap[normContent]) {
      sheet.getRange(rowNo, COL_WORK.CONTENT).setBackground(ALERT_COLOR);
      duplicateRows.push(`${rowNo}行目（${processedContentMap[normContent]}と同一）`);
    }

    // 複数回分の提出は H列（単語数）・I列（ファイル名）・K列（回数分）をマゼンタ＋太字にして見落とし防止
    if (units >= 2) {
      sheet.getRangeList([`H${rowNo}`, `I${rowNo}`, `K${rowNo}`])
        .setBackground(MULTI_COLOR).setFontWeight("bold");
      const label = currentCount !== "" ? `${currentCount}〜${currentCount + units - 1}回目` : "回数不明";
      multiUnitRows.push(`${rowNo}行目：${wordCount}語 → ×${units}（${label}）`);
    }

    processCount++;
  }

  // 要確認・エラーの行を先頭に表示し、見落としを防ぐ
  const notices = [];
  if (limitNgRows.length > 0) {
    notices.push(`■ エラー：上限超過・判定不可（行を薄い赤）※ファイル出力されません ${limitNgRows.length}件\n` + limitNgRows.join('\n'));
  }
  if (duplicateRows.length > 0) {
    notices.push(`■ エラー：処理済の本文と同一（E列を赤） ${duplicateRows.length}件\n` + duplicateRows.join('\n'));
  }
  if (multiUnitRows.length > 0) {
    notices.push(`■ 要確認：複数回分の提出（マゼンタ） ${multiUnitRows.length}件\n` + multiUnitRows.join('\n'));
  }

  const ui = SpreadsheetApp.getUi();
  const summary = `提出者チェックおよび各種自動入力が完了しました（対象: ${processCount}件）。`;
  if (notices.length > 0) {
    ui.alert('提出者チェック：確認が必要な行があります', notices.join('\n\n') + '\n\n' + summary, ui.ButtonSet.OK);
  } else {
    ui.alert(summary);
  }
}

// --------------------------------------------------
// 出力実行
// --------------------------------------------------
function exportToGoogleDocs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("提出作業シート");

  if (!sheet) {
    SpreadsheetApp.getUi().alert("「提出作業シート」が見つかりません。シート名を確認してください。");
    return;
  }
  const startRow = 2;
  const lastRow = sheet.getLastRow();

  if (lastRow < startRow) return;

  const historySheet = ss.getSheetByName("提出履歴");
  if (!historySheet) {
    SpreadsheetApp.getUi().alert("「提出履歴」シートが見つかりません。");
    return;
  }

  // ★追加：出力直前の上限再判定のためにマスタを開く
  const masterSs = openMasterSpreadsheet(ss);
  if (!masterSs) return;
  const masterCache = {};

  // ★変更：M列（提出日時）まで取得
  const dataRange = sheet.getRange(startRow, 1, lastRow - startRow + 1, WORK_COLS);
  const data = dataRange.getValues();

  // 提出履歴の見出しが空なら設定
  ensureHeader(historySheet, COL_HIST.CONTENT, "本文");
  ensureHeader(historySheet, COL_HIST.UNITS, "回数分");
  ensureHeader(historySheet, COL_HIST.SUBMITTED_AT, "提出日時");

  // ★追加：提出履歴から使用済み回数分を集計（出力するたびに加算していく）
  const usedMap = sumUsedUnits(historySheet.getDataRange().getValues());

  const folderId = "1fKDisMbD2IE4wUIp4rIlEM5ysgTJyzvw"; // ここにフォルダIDを入力している場合
  let folder = DriveApp.getRootFolder();
  if (folderId !== "") {
    try {
      const match = folderId.match(/[-\w]{25,}/);
      const actualId = match ? match[0] : folderId;
      folder = DriveApp.getFolderById(actualId);
    } catch (e) {
      SpreadsheetApp.getUi().alert("エラー：出力先フォルダのIDが正しくありません。\n詳細: " + e.message);
      return;
    }
  }

  const today = new Date();
  // 日付フォーマットを「yyyy/MM/dd HH:mm:ss」に変更（HHは24時間表記）
  const sysDateTime = Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), "yyyy/MM/dd HH:mm:ss");

  let processCount = 0;
  const skippedRows = []; // 上限判定により出力しなかった行

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNo = startRow + i;

    const kanriNo = String(row[COL_WORK.KANRI_NO - 1]).trim();
    const id = row[COL_WORK.ID - 1];
    const name = row[COL_WORK.NAME - 1];
    const email = row[COL_WORK.EMAIL - 1];
    const content = row[COL_WORK.CONTENT - 1];
    const targetMonth = String(row[COL_WORK.MONTH - 1]).trim();
    const count = row[COL_WORK.COUNT - 1];
    const wordCount = row[COL_WORK.WORDS - 1];
    const specifiedName = row[COL_WORK.FILE_NAME - 1];
    const outputStatus = String(row[COL_WORK.OUTPUT - 1]).trim();
    const unitsCell = row[COL_WORK.UNITS - 1];
    const units = unitsCell === "" ? calcSubmitUnits(wordCount) : toSubmitUnits(unitsCell); // K列：回数分
    const limitStatus = String(row[COL_WORK.LIMIT_STATUS - 1]).trim();
    const submittedAt = row[COL_WORK.SUBMITTED_AT - 1];

    if (outputStatus !== "") continue; // 「済」「対象外」などは対象外
    if (id === "" || content === "" || targetMonth === "" || count === "") continue;
    // 単語数の上限は撤廃（複数回分の提出として出力する）
    if (wordCount === "" || isNaN(wordCount) || Number(wordCount) <= 0) continue;

    // ★追加：提出者チェックで上限判定が OK になっていない行は出力しない
    if (limitStatus !== LIMIT_OK) {
      skippedRows.push(`${rowNo}行目：${limitStatus || "上限判定が未実施（提出者チェックを実行してください）"}`);
      continue;
    }

    // ★追加：出力直前に提出履歴とマスタから上限を再判定（チェック後の変更・同時処理への備え）
    const key = `${kanriNo}_${targetMonth}`;
    const previousCount = usedMap[key] || 0;
    const master = loadMasterForMonth(masterSs, targetMonth, masterCache);
    const info = master.byKanriNo[kanriNo];
    const limit = info ? getMonthlyLimit(info.planCode, targetMonth) : null;

    if (master.error || !info || limit === null || previousCount + units > limit) {
      const reason = master.error ? `判定不可（${master.error}）`
        : !info ? "判定不可（管理番号未登録）"
        : limit === null ? `判定不可（受講プランが不明：O列「${info.planCode}」）`
        : `上限超過（月${limit}回まで／今月提出済${previousCount}回／今回${units}回分）`;
      sheet.getRange(rowNo, COL_WORK.LIMIT_STATUS).setValue(reason + "（ファイル出力時に判定）");
      sheet.getRange(rowNo, 1, 1, WORK_COLS).setBackground("#f4cccc");
      skippedRows.push(`${rowNo}行目：${reason}`);
      continue;
    }

    let fileName = specifiedName;
    if (!fileName || fileName === "") {
      fileName = `${id}_${targetMonth}_${count}`;
    }

    const existingFiles = folder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      sheet.getRange(rowNo, COL_WORK.OUTPUT).setValue("済");
      continue;
    }

    try {
      const doc = DocumentApp.create(fileName);
      doc.getBody().setText(content);

      const docFile = DriveApp.getFileById(doc.getId());
      if (folderId !== "") {
        docFile.moveTo(folder);
      }
    } catch (e) {
      SpreadsheetApp.getUi().alert("ドキュメントの作成中にエラーが発生しました: " + e.message);
      return;
    }

    sheet.getRange(rowNo, COL_WORK.OUTPUT).setValue("済");
    usedMap[key] = previousCount + units;

    // 提出履歴シートへの保存処理
    historySheet.appendRow([
      kanriNo,
      id,
      name,
      email,
      fileName,
      targetMonth,
      sysDateTime,  // G列：出力日時
      "",           // H列：生徒返送日（返送メール送信時に記入）
      content,      // I列：本文（提出者チェックの重複判定に使用）
      units,        // J列：回数分（次回の回数判定・上限判定・集計に使用）
      submittedAt   // ★追加：K列：提出日時（集計の表示に使用）
    ]);

    const lastRowHistory = historySheet.getLastRow();
    historySheet.getRange(lastRowHistory, COL_HIST.ID).setNumberFormat('@').setValue(id);
    historySheet.getRange(lastRowHistory, COL_HIST.MONTH).setNumberFormat('@').setValue(targetMonth);

    processCount++;
  }

  let message = `ドキュメントの出力および提出履歴の保存が完了しました（${processCount}件）。`;
  if (skippedRows.length > 0) {
    message = `■ 上限判定により出力しなかった行 ${skippedRows.length}件\n` + skippedRows.join('\n') + '\n\n' + message;
  }
  SpreadsheetApp.getUi().alert(message);
}

// --------------------------------------------------
// 集計処理
// --------------------------------------------------
// ★変更：対象月ごとに、このスプレッドシート内の「yyyy年MM月」シートへ反映する（参照先B2は使用しない）
function aggregateHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const historySheet = ss.getSheetByName("提出履歴");

  if (!historySheet) {
    SpreadsheetApp.getUi().alert("「提出履歴」シートが見つかりません。");
    return;
  }

  // 1. 提出履歴を「対象月 → 管理番号 → 日付リスト」にグループ化
  const historyData = historySheet.getDataRange().getValues();
  const monthMap = {};

  for (let i = 1; i < historyData.length; i++) {
    const row = historyData[i];
    const kanriNo = String(row[COL_HIST.KANRI_NO - 1]).trim();
    const month = String(row[COL_HIST.MONTH - 1]).trim();
    const returnDate = String(row[COL_HIST.RETURNED_AT - 1] || "").trim();

    if (kanriNo === "" || month === "") continue;

    // ★変更：表示する日付は提出日（K列）。空欄の場合のみ出力日時（G列）を使用
    let dateValue = row[COL_HIST.SUBMITTED_AT - 1];
    if (!(dateValue instanceof Date)) dateValue = row[COL_HIST.OUTPUT_AT - 1];

    let dateStr = "";
    let sortKey = 0; // 日付順に並べるためのキー
    if (dateValue instanceof Date) {
      dateStr = Utilities.formatDate(dateValue, tz, "M/d");
      sortKey = dateValue.getTime();
    } else if (String(dateValue).trim() !== "") {
      // 文字列（yyyy/MM/dd HH:mm:ss など）の場合は日付部分を M/d に整形
      const m = String(dateValue).trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
      dateStr = m ? `${Number(m[2])}/${Number(m[3])}` : String(dateValue).trim();
      if (m) sortKey = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
    }
    if (dateStr === "") continue;

    if (!monthMap[month]) monthMap[month] = {};
    if (!monthMap[month][kanriNo]) monthMap[month][kanriNo] = [];

    // J列「回数分」の数だけ同じ日付を並べる（空欄は1回分）
    const units = toSubmitUnits(row[COL_HIST.UNITS - 1]);
    for (let u = 0; u < units; u++) {
      monthMap[month][kanriNo].push({
        date: dateStr,
        sortKey: sortKey,
        isReturned: returnDate !== ""
      });
    }
  }

  // 提出日の古い順に並べる（同日は提出履歴の順を維持）
  for (const month in monthMap) {
    for (const kanriNo in monthMap[month]) {
      monthMap[month][kanriNo].sort((a, b) => a.sortKey - b.sortKey);
    }
  }

  const monthKeys = Object.keys(monthMap).sort();
  if (monthKeys.length === 0) {
    SpreadsheetApp.getUi().alert("反映する履歴データがありません。");
    return;
  }

  const updatedSheets = [];
  const missingSheets = [];

  // 2. 対象月ごとに集計シートへ反映
  for (const month of monthKeys) {
    const sheetName = monthToSheetName(month);
    const summarySheet = ss.getSheetByName(sheetName);
    if (!summarySheet) {
      missingSheets.push(sheetName);
      continue;
    }

    const historyMap = monthMap[month];
    const summaryLastRow = summarySheet.getLastRow();
    if (summaryLastRow < 2) {
      missingSheets.push(`${sheetName}（シートにデータがありません）`);
      continue;
    }

    // 最大で何回分の履歴があるかを取得
    let maxRecords = 0;
    for (const key in historyMap) {
      if (historyMap[key].length > maxRecords) {
        maxRecords = historyMap[key].length;
      }
    }

    // 集計シートの列数が足りない場合は自動で列を追加する（A〜U列の21列 + 履歴回数分）
    let summaryMaxCol = summarySheet.getMaxColumns();
    if (21 + maxRecords > summaryMaxCol) {
      summarySheet.insertColumnsAfter(summaryMaxCol, (21 + maxRecords) - summaryMaxCol);
      summaryMaxCol = summarySheet.getMaxColumns();
    }

    const summaryKanriNos = summarySheet.getRange(2, 2, summaryLastRow - 1, 1).getValues(); // B列の管理番号

    // V列以降の既存データ・背景色を配列として一度丸ごと取得
    const dataCols = summaryMaxCol - 21;
    const updateRange = summarySheet.getRange(2, 22, summaryLastRow - 1, dataCols);
    const updateValues = updateRange.getValues();
    const updateBackgrounds = updateRange.getBackgrounds();

    for (let i = 0; i < summaryKanriNos.length; i++) {
      const kanriNo = String(summaryKanriNos[i][0]).trim();

      // 履歴に対象の管理番号が存在する場合のみ上書きする（存在しない行は既存のまま維持）
      if (historyMap[kanriNo]) {
        const records = historyMap[kanriNo];
        for (let j = 0; j < dataCols; j++) {
          if (j < records.length) {
            updateValues[i][j] = records[j].date;
            updateBackgrounds[i][j] = records[j].isReturned ? "#ffff00" : null;
          } else {
            // 履歴件数を超えた右側の余剰列はクリアする
            updateValues[i][j] = "";
            updateBackgrounds[i][j] = null;
          }
        }
      }
    }

    updateRange.setValues(updateValues);
    updateRange.setBackgrounds(updateBackgrounds);
    updatedSheets.push(sheetName);
  }

  let message = `集計が完了しました。\n反映したシート: ${updatedSheets.length > 0 ? updatedSheets.join('、') : 'なし'}`;
  if (missingSheets.length > 0) {
    message += `\n\n■ シートが見つからず反映できなかった月\n` + missingSheets.join('\n');
  }
  SpreadsheetApp.getUi().alert(message);
}

// ★修正：同名関数が2つ定義されていたため、古い方（件名に日付なし）を削除し、こちらに一本化
function sendBatchEmailWithAttachments() {
  const ui = SpreadsheetApp.getUi(); // ★追加：UIオブジェクトの取得
  const logMessages = []; // ★追加：ログメッセージを蓄積する配列

  // ==========================================
  // 1. 設定項目
  // ==========================================

  const SPREADSHEET_ID = '16P2gg95DMgpTnvNJ3mUsOwBafb73DNQw_guvtKcnANY';
  const SHEET_NAME = 'adress';

  const SOURCE_FOLDER_ID = '1fKDisMbD2IE4wUIp4rIlEM5ysgTJyzvw';
  const DEST_FOLDER_ID = '1vRza9ZTJBnncWez3k3UChjSIjIEpUXPq';

  // ★変更箇所：件名のベースとなる文字列を定義（例に合わせて「【自動送信】」を削除）
  const MAIL_SUBJECT_BASE = 'NOVA英語日記添削サービス ファイルのご送付';
  const MAIL_BODY = '関係者各位\n\n自動送信メールです。\nNOVA英語ライティングコースの提出ファイルを送付いたします。\n添付ファイルをご確認ください。\n\nよろしくお願いいたします。';

  // 送信元の表示名称
  const SENDER_NAME = 'NOVA英語日記添削サービス';
  // 添付ファイルの上限サイズ（安全マージンを取り 24MB = 25,165,824 bytes とする）
  const MAX_ATTACHMENT_SIZE = 24 * 1024 * 1024;

  // ==========================================
  // 2. 宛先リストの取得処理
  // ==========================================

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  // データが入っている範囲をすべて取得 (A1:B〇)
  const dataList = sheet.getDataRange().getValues();

  const toList = [];
  const ccList = [];

  for (let i = 0; i < dataList.length; i++) {
    const emailAddress = dataList[i][0];
    const sendType = dataList[i][1];

    if (emailAddress) {
      if (sendType === 'TO') {
        toList.push(emailAddress);
      } else if (sendType === 'CC') {
        ccList.push(emailAddress);
      }
    }
  }

  const toAddressStr = toList.join(',');
  const ccAddressStr = ccList.join(',');

  if (!toAddressStr) {
    ui.alert('エラー', 'TOアドレスが設定されていないため処理を終了します。', ui.ButtonSet.OK);
    return;
  }

  // ==========================================
  // 3. ファイルの取得・ソート・.docx変換処理
  // ==========================================

  const sourceFolder = DriveApp.getFolderById(SOURCE_FOLDER_ID);
  const destFolder = DriveApp.getFolderById(DEST_FOLDER_ID);

  // Googleドキュメントのみを抽出
  const fileIterator = sourceFolder.getFilesByType(MimeType.GOOGLE_DOCS);
  const fileDataList = [];

  while (fileIterator.hasNext()) {
    const currentFile = fileIterator.next();
    fileDataList.push({
      fileObj: currentFile,
      createdTime: currentFile.getDateCreated().getTime()
    });
  }

  if (fileDataList.length === 0) {
    ui.alert('お知らせ', '指定フォルダにGoogleドキュメントが存在しないためスキップしました。', ui.ButtonSet.OK);
    return;
  }

  // 作成日時が古い順（昇順）にソート
  fileDataList.sort((a, b) => a.createdTime - b.createdTime);

  const attachments = [];
  const processedFiles = [];
  let currentTotalSize = 0;
  const oauthToken = ScriptApp.getOAuthToken(); // .docxエクスポートAPIを叩くためのトークン

  for (let j = 0; j < fileDataList.length; j++) {
    const targetFile = fileDataList[j].fileObj;
    const fileId = targetFile.getId();
    const fileName = targetFile.getName();

    // Google Docs APIのエクスポートURLを使用して.docxを取得
    const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=docx`;
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: { 'Authorization': 'Bearer ' + oauthToken },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      logMessages.push(`・${fileName} の.docx変換に失敗しました。スキップします。`);
      continue;
    }

    const docxBlob = response.getBlob().setName(fileName + '.docx');
    const blobSize = docxBlob.getBytes().length;

    // 25MB制限のチェック
    if (currentTotalSize + blobSize > MAX_ATTACHMENT_SIZE) {
      logMessages.push(`・添付サイズ上限に達したため、${fileName} 以降の処理は次回に持ち越します。`);
      break;
    }

    attachments.push(docxBlob);
    processedFiles.push(targetFile);
    currentTotalSize += blobSize;
  }

  if (attachments.length === 0) {
    ui.alert('お知らせ', '添付可能なファイルが存在しなかったため処理を終了します。\n\n' + logMessages.join('\n'), ui.ButtonSet.OK);
    return;
  }

  // ==========================================
  // 4. メール送信・移動処理
  // ==========================================

  try {
    const mailOptions = {
      attachments: attachments,
      name: SENDER_NAME
    };
    if (ccAddressStr) {
      mailOptions.cc = ccAddressStr;
    }

    // ★追加・変更：実行日の取得と件名の組み立て
    const today = new Date();
    const dateStr = Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), "yyyy/MM/dd");
    const mailSubject = `${dateStr} ${MAIL_SUBJECT_BASE}（${attachments.length}回分）`;

    // 生成したカスタム件名(mailSubject)をセットして送信
    MailApp.sendEmail(toAddressStr, mailSubject, MAIL_BODY, mailOptions);
    logMessages.push(`・メール送信完了. 添付ファイル数: ${attachments.length} 件`);

    // 送信済みのファイルのみ移動
    for (let k = 0; k < processedFiles.length; k++) {
      processedFiles[k].moveTo(destFolder);
    }
    logMessages.push('・ファイルの移動が完了しました。');

  } catch (error) {
    logMessages.push('・送信処理中にエラーが発生しました: ' + error.message);
  }

  // ★最後にまとめてポップアップを表示
  ui.alert('一括添付メール送信 実行結果', logMessages.join('\n'), ui.ButtonSet.OK);
}

// --------------------------------------------------
// 添削結果返送メール送信
// --------------------------------------------------
// ★統合：別ファイルにあった関数をこちらに移動
function sendEmailByFileNameMatch() {
  const ui = SpreadsheetApp.getUi();
  const logMessages = [];

  // ==========================================
  // 1. 設定項目
  // ==========================================
  const SPREADSHEET_ID = '16P2gg95DMgpTnvNJ3mUsOwBafb73DNQw_guvtKcnANY';
  const SHEET_NAME = '提出履歴'; // 検索対象のシート名
  const SOURCE_FOLDER_ID = '1xykPgEPaVtAqe45H7jL07U9m31IykcA5'; // 添削済ファイルの返却フォルダ
  const DEST_FOLDER_ID = '1WUrQEmc1KLx7Sps74b_a1y3qDkJkErqL';   // 返送後の移動先フォルダ

  const MAIL_SUBJECT = '【自動送信】NOVA英語日記添削サービス　添削結果のご送付';
  const MAIL_BODY_BASE = '自動送信メールです。\nNOVA英語ライティングコースの添削結果を送付いたします。\n添付ファイルをご確認ください。\n\nよろしくお願いいたします。';
  const SENDER_NAME = 'NOVA英語日記添削サービス';

  // ==========================================
  // 2. スプレッドシートデータの取得
  // ==========================================
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    ui.alert(`「${SHEET_NAME}」シートが見つかりません。`);
    return;
  }
  const dataList = sheet.getDataRange().getValues();
  // dataList[i][2] -> C列 (氏名)
  // dataList[i][3] -> D列 (メールアドレス)
  // dataList[i][4] -> E列 (ファイル名)
  // dataList[i][7] -> H列 (生徒返送日)

  // ==========================================
  // 3. フォルダ内のファイル取得と送信処理
  // ==========================================
  const sourceFolder = DriveApp.getFolderById(SOURCE_FOLDER_ID);
  const destFolder = DriveApp.getFolderById(DEST_FOLDER_ID);
  const files = sourceFolder.getFiles();

  if (!files.hasNext()) {
    ui.alert('お知らせ', '返却フォルダにファイルが存在しません。', ui.ButtonSet.OK);
    return;
  }

  // Googleドキュメントの.docx変換APIを叩くためのトークンを取得
  const oauthToken = ScriptApp.getOAuthToken();
  let sentCount = 0;

  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    // ★修正：返却ファイルは「〇〇.docx」の場合があるため、拡張子を除いた名前で照合する
    const baseName = getBaseName(fileName);
    let matchedRowIndex = -1;

    // スプレッドシートのE列（インデックス4）を検索（1行目はヘッダー）
    for (let i = 1; i < dataList.length; i++) {
      if (String(dataList[i][4]).trim() === baseName) {
        matchedRowIndex = i;
        break; // 最初に見つかった行を対象とする
      }
    }

    if (matchedRowIndex === -1) {
      logMessages.push(`・スキップ: [${fileName}] と一致するファイル名が提出履歴E列にありません。`);
      continue;
    }

    const recipientName = dataList[matchedRowIndex][2]; // C列
    const emailAddress = String(dataList[matchedRowIndex][3]).trim(); // D列

    if (!emailAddress) {
      logMessages.push(`・スキップ: [${fileName}] は見つかりましたが、D列(メールアドレス)が空欄です。`);
      continue;
    }

    try {
      let attachment;

      // 対象ファイルがGoogleドキュメントの場合は.docxに変換して添付
      if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
        const exportUrl = `https://docs.google.com/document/d/${file.getId()}/export?format=docx`;
        const response = UrlFetchApp.fetch(exportUrl, {
          headers: { 'Authorization': 'Bearer ' + oauthToken },
          muteHttpExceptions: true
        });

        if (response.getResponseCode() !== 200) {
          throw new Error('.docx変換APIの呼び出しに失敗しました。');
        }

        attachment = response.getBlob().setName(baseName + '.docx');
      } else {
        attachment = file.getBlob();
      }

      // 宛名とベース本文を結合して、メール本文を作成
      const namePrefix = recipientName ? String(recipientName) + ' 様\n\n' : '関係者各位\n\n';
      const mailBody = namePrefix + MAIL_BODY_BASE;

      MailApp.sendEmail(emailAddress, MAIL_SUBJECT, mailBody, {
        attachments: [attachment],
        name: SENDER_NAME
      });

      // 送信日時をH列（生徒返送日）に書き込み → 集計で黄色表示に使用
      sheet.getRange(matchedRowIndex + 1, 8).setValue(new Date());

      // 送信完了後、ファイルを別フォルダに移動
      file.moveTo(destFolder);

      sentCount++;
      logMessages.push(`・送信完了: [${fileName}] → ${emailAddress}`);

    } catch (error) {
      logMessages.push(`・送信エラー: [${fileName}] ${error.message}`);
    }
  }

  ui.alert('添削結果返送メール送信 実行結果', `送信件数: ${sentCount} 件\n\n` + logMessages.join('\n'), ui.ButtonSet.OK);
}

/**
 * 2つのフォルダを比較するメイン処理
 */
/*
  var folder1Id = '1vRza9ZTJBnncWez3k3UChjSIjIEpUXPq';
  var folder2Id = '1xykPgEPaVtAqe45H7jL07U9m31IykcA5';
*/

function compareFolders() {
  var folder1Id = '1vRza9ZTJBnncWez3k3UChjSIjIEpUXPq';
  var folder2Id = '1xykPgEPaVtAqe45H7jL07U9m31IykcA5';

  var folder1 = DriveApp.getFolderById(folder1Id);
  var folder2 = DriveApp.getFolderById(folder2Id);

  var files1 = folder1.getFiles();
  var folder2Files = [];
  var f2Iterator = folder2.getFiles();

  while (f2Iterator.hasNext()) {
    folder2Files.push(f2Iterator.next());
  }

  var matchedFiles = [];
  var errorMessages = [];
  var debugLog = []; // 一致しなかった場合の理由調査用

  var ui = SpreadsheetApp.getUi();
  SpreadsheetApp.getActiveSpreadsheet().toast('ファイル比較を開始しました。しばらくお待ちください...', '処理中');

  while (files1.hasNext()) {
    var file1 = files1.next();

    // MimeTypeに頼らず、拡張子ベースで判定
    if (!isTargetFile(file1)) continue;

    var baseName1 = getBaseName(file1.getName());

    for (var i = 0; i < folder2Files.length; i++) {
      var file2 = folder2Files[i];
      if (!isTargetFile(file2)) continue;

      var baseName2 = getBaseName(file2.getName());

      // 拡張子を除いたファイル名が完全に一致するか
      if (baseName1 === baseName2) {

        var text1 = extractTextFromDocument(file1, errorMessages);
        var text2 = extractTextFromDocument(file2, errorMessages);

        var norm1 = normalizeText(text1);
        var norm2 = normalizeText(text2);

        if (norm1 !== null && norm2 !== null) {
          if (norm1 === norm2) {
            matchedFiles.push(file1.getName() + " (内容一致)");
          } else {
            // 名前は同じだが内容が異なった場合、何が抽出されたかを記録
            debugLog.push("【" + file1.getName() + "】\n フォルダ1: [" + norm1 + "]\n フォルダ2: [" + norm2 + "]");
          }
        }
      }
    }
  }

  showPopupResult(matchedFiles, errorMessages, debugLog);
}

/**
 * MIMEタイプに依存せず、拡張子またはGoogleドキュメントかを判定する
 */
function isTargetFile(file) {
  var mime = file.getMimeType();
  var name = file.getName().toLowerCase();

  if (mime === MimeType.GOOGLE_DOCS) return true;
  if (name.indexOf('.doc') !== -1) return true; // .doc や .docx が含まれていれば対象とする

  return false;
}

/**
 * ファイル名から拡張子を取り除く関数
 */
function getBaseName(fileName) {
  return fileName.replace(/\.(docx?)$/i, '').trim();
}

/**
 * 空白、改行、見えない制御文字をすべて削除する関数
 */
function normalizeText(text) {
  if (!text) return null;
  // \s, 全角スペースの他、見えない文字（ゼロ幅スペースなど）も除去
  return text.replace(/[\s\u3000\u200B-\u200D\uFEFF]+/g, "");
}

/**
 * テキスト抽出処理
 */
function extractTextFromDocument(file, errorMessages) {
  if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
    try {
      return DocumentApp.openById(file.getId()).getBody().getText();
    } catch (e) {
      errorMessages.push("読込エラー (" + file.getName() + "): " + e.message);
      return null;
    }
  } else {
    try {
      // WordファイルをGoogleドキュメントに変換して読み取る
      var tempDoc = Drive.Files.copy({ mimeType: MimeType.GOOGLE_DOCS }, file.getId());
      var text = DocumentApp.openById(tempDoc.id).getBody().getText();
      DriveApp.getFileById(tempDoc.id).setTrashed(true);
      return text;
    } catch (e) {
      errorMessages.push("Word変換エラー (" + file.getName() + "): " + e.message);
      return null;
    }
  }
}

/**
 * 結果をポップアップ表示
 */
function showPopupResult(matchedFiles, errorMessages, debugLog) {
  var ui = SpreadsheetApp.getUi();

  // エラーがあれば表示して終了
  if (errorMessages.length > 0) {
    ui.alert('エラー発生', 'ファイルの読み込み時にエラーが発生しました。\nDrive APIがサービスに追加されているか確認してください。\n\n' + errorMessages.join('\n'), ui.ButtonSet.OK);
    return;
  }

  if (matchedFiles.length > 0) {
    ui.alert('未添削の可能性があるファイル（送付時と内容が同じ）', matchedFiles.join('\n'), ui.ButtonSet.OK);
  } else {
    var msg = '送付時と内容が同じままのファイルはありませんでした。';

    // 同名ファイルは見つかったが、テキスト内容の判定で弾かれた場合の理由を表示
    if (debugLog.length > 0) {
      msg += '\n\n【原因調査用データ】\n同名ファイルは見つかりましたが、以下の通り抽出されたテキストが異なっていました。\n\n' + debugLog.join('\n\n');
    } else {
      msg += '\n\n（比較対象となる同名のファイル自体が認識されていません）';
    }

    ui.alert('未添削の疑いがあるファイルはありません', msg, ui.ButtonSet.OK);
  }
}
