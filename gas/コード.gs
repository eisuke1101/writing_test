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
  const lock = LockService.getScriptLock();
  try {
    // ★追加：合言葉のチェック（スクリプトプロパティ FORM_SECRET を設定したときだけ有効）
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("FORM_SECRET");
    if (expectedSecret && e.parameter.secret !== expectedSecret) {
      console.warn("合言葉が一致しない送信を拒否しました");
      return ContentService.createTextOutput("forbidden");
    }

    // 1. 送信元からテキストデータを受け取る
    const name  = e.parameter.nameA;
    const stnum = e.parameter.school_number;
    const tel   = e.parameter.tel;
    const email = e.parameter.mail;
    const body  = e.parameter.submit_text;
    const submissionId = e.parameter.submissionId || ""; // ★追加：重複防止用の送信ID

    // 2. 送信元からファイルデータを受け取る
    const fileName = e.parameter.fileName;
    const mimeType = e.parameter.mimeType;
    const fileData = e.parameter.fileData;

    const sheetName = "フォームの回答_英語日記";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`「${sheetName}」シートが見つかりません。`);
    }

    // ★追加：同時に届いた送信が重ならないよう、記録が終わるまで排他する
    lock.waitLock(30000);

    // ★追加：同じ送信IDの行がすでにあれば、何もせずに終える（I列 = 送信ID）
    if (submissionId) {
      const found = sheet.getRange("I:I").createTextFinder(submissionId).matchEntireCell(true).findNext();
      if (found) {
        return ContentService.createTextOutput("duplicate");
      }
    }

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

    // 3. スプレッドシートへの記録
    // A:日時 B:メール C:氏名 D:本文 E:生徒番号 F:電話番号 G:ファイルURL H:インポート状況（空欄） I:送信ID
    sheet.appendRow([new Date(), email, name, body, stnum, tel, fileUrl, "", submissionId]);
    SpreadsheetApp.flush();
    lock.releaseLock();

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
    // エラー内容をGASエディタの「実行数」ログに残す
    console.error(err);
    return ContentService.createTextOutput("error: " + err.message);
  } finally {
    lock.releaseLock(); // ロックを持っていなければ何もしない
  }
}

// --------------------------------------------------
// 回答インポート
// --------------------------------------------------
function importAnswers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

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

  // 処理対象シートの最終行を取得し、その次の行から追記開始
  let targetCurrentRow = targetSheet.getLastRow() + 1;

  // フォーム回答シートのデータを一括取得（A列〜H列 = 8列分）
  const sourceRange = sourceSheet.getRange(sourceStartRow, 1, sourceLastRow - sourceStartRow + 1, 8);
  const sourceData = sourceRange.getValues();

  let importCount = 0;

  for (let i = 0; i < sourceData.length; i++) {
    const row = sourceData[i];
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
      targetSheet.getRange(targetCurrentRow, 3).setValue(name);    // C列：氏名
      targetSheet.getRange(targetCurrentRow, 4).setValue(email);   // D列：メールアドレス
      targetSheet.getRange(targetCurrentRow, 5).setValue(content); // E列：本文

      // フォームの回答シートのH列に「済」を入力
      sourceSheet.getRange(sourceStartRow + i, 8).setValue("済");

      targetCurrentRow++;
      importCount++;
    }
  }

  SpreadsheetApp.getUi().alert(`${importCount}件の回答をインポートしました。`);
}


// --------------------------------------------------
// 提出者チェック
// --------------------------------------------------
function checkSubmitter() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("提出作業シート");

  if (!sheet) {
    SpreadsheetApp.getUi().alert("「提出作業シート」が見つかりません。シート名を確認してください。");
    return;
  }
  const startRow = 2;
  const lastRow = sheet.getLastRow();

  if (lastRow < startRow) return;

  const refSheet = ss.getSheetByName("参照先");
  if (!refSheet) {
    SpreadsheetApp.getUi().alert("「参照先」シートが見つかりません。");
    return;
  }

  const masterSpreadsheetId = String(refSheet.getRange("A2").getValue()).trim();
  const masterSheetName = String(refSheet.getRange("B2").getDisplayValue()).trim();

  let masterSheet;
  try {
    const targetSpreadsheet = SpreadsheetApp.openById(masterSpreadsheetId);
    masterSheet = targetSpreadsheet.getSheetByName(masterSheetName);
  } catch(e) {
    SpreadsheetApp.getUi().alert("マスタースプレッドシートの読み込みに失敗しました。IDをご確認ください。");
    return;
  }

  if (!masterSheet) {
    SpreadsheetApp.getUi().alert(`参照先ファイル内に「${masterSheetName}」シートが見つかりません。シート名に誤りや不要なスペースがないか確認してください。`);
    return;
  }

  // マスターデータを取得し、メールアドレスをキーに連想配列へ格納
  const masterData = masterSheet.getDataRange().getValues();
  const masterMap = {};
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    const email = String(row[6]).trim(); // G列
    if (email !== "") {
      masterMap[email] = {
        kanriNo: row[1], // B列
        name: row[2],    // C列
        id: String(row[4]).padStart(8, '0'), // E列 (8桁0埋め)
        fileName: row[20]// U列
      };
    }
  }

  // 提出履歴の集計
  const historySheet = ss.getSheetByName("提出履歴");
  const historyMap = {};

  if (historySheet) {
    const historyData = historySheet.getDataRange().getValues();
    for (let i = 1; i < historyData.length; i++) {
      const hEmail = String(historyData[i][3]).trim(); // D列
      const hMonth = String(historyData[i][5]).trim(); // F列

      if (hEmail !== "" && hMonth !== "") {
        const key = `${hEmail}_${hMonth}`;
        if (!historyMap[key]) {
          historyMap[key] = 0;
        }
        historyMap[key]++;
      }
    }
  } else {
    SpreadsheetApp.getUi().alert("「提出履歴」シートが見つかりません。");
    return;
  }

  // 実行日付のフォーマット作成
  const today = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateStr = today.getDate() + months[today.getMonth()] + today.getFullYear();

  const currentYearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

  // ★修正：J列（出力）まで一括で取得するため、列数を9から10に変更
  const targetRange = sheet.getRange(startRow, 1, lastRow - startRow + 1, 10);
  const targetData = targetRange.getValues();

  let processCount = 0;

  for (let i = 0; i < targetData.length; i++) {
    // ★追加：J列（出力）が空欄かどうかを判定
    const outputStatus = String(targetData[i][9] || "").trim(); // インデックス9がJ列

    // 空欄でない（すでに「済」などが入っている）場合は処理をスキップ
    if (outputStatus !== "") {
      continue;
    }

    const email = String(targetData[i][3]).trim();
    const content = String(targetData[i][4]).trim();
    let targetMonth = String(targetData[i][5] || "").trim();

    if (targetMonth === "") {
      targetMonth = currentYearMonth;
      sheet.getRange(startRow + i, 6).setNumberFormat('@').setValue(targetMonth);
    }

    const wordCount = content === "" ? 0 : content.split(/\s+/).length;
    sheet.getRange(startRow + i, 8).setValue(wordCount);

    let currentCount = "";

    if (email !== "" && targetMonth !== "") {
      const key = `${email}_${targetMonth}`;
      const previousCount = historyMap[key] || 0;
      currentCount = previousCount + 1;

      sheet.getRange(startRow + i, 7).setValue(currentCount);

      historyMap[key] = currentCount;
    }

    if (email !== "" && masterMap[email]) {
      const info = masterMap[email];
      sheet.getRange(startRow + i, 1).setValue(info.kanriNo);
      sheet.getRange(startRow + i, 2).setNumberFormat('@').setValue(info.id);
      sheet.getRange(startRow + i, 3).setValue(info.name);

      const finalFileName = `${info.fileName}${currentCount} ${dateStr}`;
      sheet.getRange(startRow + i, 9).setValue(finalFileName);
    }

    processCount++;
  }
  SpreadsheetApp.getUi().alert(`提出者チェックおよび各種自動入力が完了しました（対象: ${processCount}件）。`);
}

// --------------------------------------------------
// 出力実行
// --------------------------------------------------

//  const folderId = "1fKDisMbD2IE4wUIp4rIlEM5ysgTJyzvw"; // ここにフォルダIDを入力している場合

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

  const dataRange = sheet.getRange(startRow, 1, lastRow - startRow + 1, 10);
  const data = dataRange.getValues();

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
  // ★変更箇所：日付フォーマットを「yyyy/MM/dd HH:mm:ss」に変更（HHは24時間表記）
  const sysDateTime = Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), "yyyy/MM/dd HH:mm:ss");

  let processCount = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    const kanriNo = row[0];
    const id = row[1];
    const name = row[2];
    const email = row[3];
    const content = row[4];
    const targetMonth = row[5];
    const count = row[6];
    const wordCount = row[7];
    const specifiedName = row[8];
    const outputStatus = row[9];

    if (outputStatus === "済") continue;
    if (id === "" || content === "" || targetMonth === "" || count === "") continue;
    if (wordCount === "" || isNaN(wordCount) || Number(wordCount) > 200) continue;

    let fileName = specifiedName;
    if (!fileName || fileName === "") {
      fileName = `${id}_${targetMonth}_${count}`;
    }

    const existingFiles = folder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      sheet.getRange(startRow + i, 10).setValue("済");
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

    sheet.getRange(startRow + i, 10).setValue("済");

    // 提出履歴シートへの保存処理
    historySheet.appendRow([
      kanriNo,
      id,
      name,
      email,
      fileName,
      targetMonth,
      sysDateTime  // ★変更箇所：日時（時分秒つき）を書き込み
    ]);

    const lastRowHistory = historySheet.getLastRow();
    historySheet.getRange(lastRowHistory, 2).setNumberFormat('@').setValue(id);
    historySheet.getRange(lastRowHistory, 6).setNumberFormat('@').setValue(targetMonth);

    processCount++;
  }

  SpreadsheetApp.getUi().alert(`ドキュメントの出力および提出履歴の保存が完了しました（${processCount}件）。`);
}

// --------------------------------------------------
// 集計処理
// --------------------------------------------------
function aggregateHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName("提出履歴");

  // 「参照先」シートから書き込み先シート名を取得
  const refSheet = ss.getSheetByName("参照先");
  if (!refSheet) {
    SpreadsheetApp.getUi().alert("「参照先」シートが見つかりません。");
    return;
  }

  const targetSheetName = String(refSheet.getRange("B2").getDisplayValue()).trim();
  const summarySheet = ss.getSheetByName(targetSheetName);

  if (!historySheet) {
    SpreadsheetApp.getUi().alert("「提出履歴」シートが見つかりません。");
    return;
  }
  if (!summarySheet) {
    SpreadsheetApp.getUi().alert(`集計先の「${targetSheetName}」シートが見つかりません。シート名を確認してください。`);
    return;
  }

  // 1. 提出履歴データの取得と管理番号ごとのグループ化
  const historyData = historySheet.getDataRange().getValues();
  const historyMap = {}; // 管理番号をキーにして日付情報を格納する連想配列

  for (let i = 1; i < historyData.length; i++) {
    const kanriNo = String(historyData[i][0]).trim(); // A列：管理番号
    const sendDate = historyData[i][6];               // G列：送信日
    const returnDate = String(historyData[i][7] || "").trim(); // H列：生徒返送日

    if (kanriNo === "") continue;

    if (!historyMap[kanriNo]) {
      historyMap[kanriNo] = [];
    }

    let sendDateStr = "";
    if (sendDate instanceof Date) {
      sendDateStr = Utilities.formatDate(sendDate, ss.getSpreadsheetTimeZone(), "M/d");
    } else {
      sendDateStr = String(sendDate).trim();
    }

    if (sendDateStr !== "") {
      historyMap[kanriNo].push({
        date: sendDateStr,
        isReturned: returnDate !== ""
      });
    }
  }

  // 2. 集計シートの準備
  const summaryLastRow = summarySheet.getLastRow();
  let summaryMaxCol = summarySheet.getMaxColumns(); // 列追加で変動するためletに変更

  if (summaryLastRow < 2) {
    SpreadsheetApp.getUi().alert(`「${targetSheetName}」シートに対象のレコード（管理番号）がありません。`);
    return;
  }

  // 最大で何回分の履歴があるかを取得
  let maxRecords = 0;
  for (const key in historyMap) {
    if (historyMap[key].length > maxRecords) {
      maxRecords = historyMap[key].length;
    }
  }

  if (maxRecords === 0) {
    SpreadsheetApp.getUi().alert("反映する履歴データがありません。");
    return;
  }

  // 集計シートの列数が足りない場合は自動で列を追加する
  if (21 + maxRecords > summaryMaxCol) {
    summarySheet.insertColumnsAfter(summaryMaxCol, (21 + maxRecords) - summaryMaxCol);
    summaryMaxCol = summarySheet.getMaxColumns(); // 追加後の最大列数を再取得
  }

  // 3. 集計シートの書き換え処理
  const summaryKanriNos = summarySheet.getRange(2, 2, summaryLastRow - 1, 1).getValues(); // B列の管理番号

  // ★変更箇所：全クリアを廃止し、V列以降の既存データ・背景色を配列として一度丸ごと取得
  const dataCols = summaryMaxCol - 21; // V列以降の列数
  const updateRange = summarySheet.getRange(2, 22, summaryLastRow - 1, dataCols);
  const updateValues = updateRange.getValues();
  const updateBackgrounds = updateRange.getBackgrounds();

  for (let i = 0; i < summaryKanriNos.length; i++) {
    const kanriNo = String(summaryKanriNos[i][0]).trim();

    // ★変更箇所：履歴に対象の管理番号が存在する場合のみ、配列の中身を上書きする
    if (historyMap[kanriNo]) {
      const records = historyMap[kanriNo];

      for (let j = 0; j < dataCols; j++) {
        if (j < records.length) {
          updateValues[i][j] = records[j].date;
          updateBackgrounds[i][j] = records[j].isReturned ? "#ffff00" : null;
        } else {
          // 履歴件数を超えた右側の余剰列はクリアする（以前のデータが残らないようにする）
          updateValues[i][j] = "";
          updateBackgrounds[i][j] = null;
        }
      }
    }
    // 履歴に管理番号が存在しない行は `updateValues[i]` を一切操作しないため既存のまま維持される
  }

  // 4. 集計シートへ一括書き込み（対象レコードのみ書き換わった状態の配列をシートに戻す）
  updateRange.setValues(updateValues);
  updateRange.setBackgrounds(updateBackgrounds);

  SpreadsheetApp.getUi().alert(`「${targetSheetName}」シートへ履歴の集計・反映が完了しました。`);
}

/*
// --------------------------------------------------
// 集計処理
// --------------------------------------------------
function aggregateHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName("提出履歴");

  // 「参照先」シートから書き込み先シート名を取得
  const refSheet = ss.getSheetByName("参照先");
  if (!refSheet) {
    SpreadsheetApp.getUi().alert("「参照先」シートが見つかりません。");
    return;
  }

  const targetSheetName = String(refSheet.getRange("B2").getDisplayValue()).trim();
  const summarySheet = ss.getSheetByName(targetSheetName);

  if (!historySheet) {
    SpreadsheetApp.getUi().alert("「提出履歴」シートが見つかりません。");
    return;
  }
  if (!summarySheet) {
    SpreadsheetApp.getUi().alert(`集計先の「${targetSheetName}」シートが見つかりません。シート名を確認してください。`);
    return;
  }

  // 1. 提出履歴データの取得と管理番号ごとのグループ化
  const historyData = historySheet.getDataRange().getValues();
  const historyMap = {}; // 管理番号をキーにして日付情報を格納する連想配列

  // 履歴シートは1行目がヘッダーと想定
  for (let i = 1; i < historyData.length; i++) {
    const kanriNo = String(historyData[i][0]).trim(); // A列：管理番号
    const sendDate = historyData[i][6];               // G列：送信日
    const returnDate = String(historyData[i][7] || "").trim(); // H列：生徒返送日

    if (kanriNo === "") continue;

    if (!historyMap[kanriNo]) {
      historyMap[kanriNo] = [];
    }

    // 日付オブジェクトの場合は文字列にフォーマット
    let sendDateStr = "";
    if (sendDate instanceof Date) {
      sendDateStr = Utilities.formatDate(sendDate, ss.getSpreadsheetTimeZone(), "M/d");
    } else {
      sendDateStr = String(sendDate).trim();
    }

    if (sendDateStr !== "") {
      historyMap[kanriNo].push({
        date: sendDateStr,
        isReturned: returnDate !== ""
      });
    }
  }

  // 2. 集計シートの準備
  const summaryLastRow = summarySheet.getLastRow();
  const summaryMaxCol = summarySheet.getMaxColumns();

  if (summaryLastRow < 2) {
    SpreadsheetApp.getUi().alert(`「${targetSheetName}」シートに対象のレコード（管理番号）がありません。`);
    return;
  }

  // ★変更箇所1：集計シートのV列(22列目)以降のデータと背景色を一度クリア
  if (summaryMaxCol >= 22) {
    const clearRange = summarySheet.getRange(2, 22, summaryLastRow - 1, summaryMaxCol - 21);
    clearRange.clearContent();
    clearRange.setBackground(null);
  }

  // 最大で何回分の履歴があるかを取得
  let maxRecords = 0;
  for (const key in historyMap) {
    if (historyMap[key].length > maxRecords) {
      maxRecords = historyMap[key].length;
    }
  }

  if (maxRecords === 0) {
    SpreadsheetApp.getUi().alert("反映する履歴データがありません。");
    return;
  }

  // ★変更箇所2：集計シートの列数が足りない場合は自動で列を追加する (既存の21列 + 履歴回数分)
  if (21 + maxRecords > summaryMaxCol) {
    summarySheet.insertColumnsAfter(summaryMaxCol, (21 + maxRecords) - summaryMaxCol);
  }

  // 3. 集計シートへの書き込み用データの生成
  // ★変更箇所3：管理番号の取得先をA列(1)からB列(2)に変更
  const summaryKanriNos = summarySheet.getRange(2, 2, summaryLastRow - 1, 1).getValues();
  const updateValues = [];
  const updateBackgrounds = [];

  for (let i = 0; i < summaryKanriNos.length; i++) {
    const kanriNo = String(summaryKanriNos[i][0]).trim();
    const records = historyMap[kanriNo] || [];

    const rowValues = [];
    const rowBackgrounds = [];

    for (let j = 0; j < maxRecords; j++) {
      if (j < records.length) {
        rowValues.push(records[j].date);
        rowBackgrounds.push(records[j].isReturned ? "#ffff00" : null);
      } else {
        rowValues.push("");
        rowBackgrounds.push(null);
      }
    }
    updateValues.push(rowValues);
    updateBackgrounds.push(rowBackgrounds);
  }

  // 4. 集計シートへ一括書き込み
  // ★変更箇所4：V列(22列目)から一括書き込み
  const updateRange = summarySheet.getRange(2, 22, summaryLastRow - 1, maxRecords);
  updateRange.setValues(updateValues);
  updateRange.setBackgrounds(updateBackgrounds);

  SpreadsheetApp.getUi().alert(`「${targetSheetName}」シートへ履歴の集計・反映が完了しました。`);
}
*/


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
  return text.replace(/[\s　​-‍﻿]+/g, "");
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
    ui.alert('比較結果: 内容の一致あり', matchedFiles.join('\n'), ui.ButtonSet.OK);
  } else {
    var msg = '内容が一致する同名ファイルは見つかりませんでした。';

    // 同名ファイルは見つかったが、テキスト内容の判定で弾かれた場合の理由を表示
    if (debugLog.length > 0) {
      msg += '\n\n【原因調査用データ】\n同名ファイルは見つかりましたが、以下の通り抽出されたテキストが異なっていました。\n\n' + debugLog.join('\n\n');
    } else {
      msg += '\n\n（比較対象となる同名のファイル自体が認識されていません）';
    }

    ui.alert('比較結果: 一致なし', msg, ui.ButtonSet.OK);
  }
}
