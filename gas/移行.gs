// --------------------------------------------------
// 手作業分の移行（運用開始時に1回だけ実行する）
// --------------------------------------------------
// 手作業で「yyyy年MM月」シートのV列以降に入力してきた提出日を、提出履歴のレコードとして作成する。
// 移行しておかないと、集計で手作業の日付が上書きされて消え、回数・上限判定も0回から数え直しになる。
// ・同じ日付が続けて並んでいる場合は「1回の提出で並んだ数だけ回数を使った」とみなし、1行（J列 = 並んだ数）にまとめる
// ・背景が黄色（#ffff00）のセルは返送済みとして、H列に「返送済（手作業）」を入れる
// ・移行した行は G列（出力日時）を「手作業移行」にして、新システムの行と区別する
// 移行が済んだら、onOpen のメニュー項目とこのファイルは削除してよい。

const MIGRATION_MONTH = "202610";            // 移行する対象月（yyyyMM）
const MIGRATION_MARK = "手作業移行";          // 移行した行の G列（出力日時）に入れる目印
const MIGRATION_RETURNED = "返送済（手作業）"; // 返送済みの行の H列（生徒返送日）に入れる値
const RETURNED_COLOR = "#ffff00";            // 集計で返送済みに付ける背景色

function migrateManualHistory() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const month = MIGRATION_MONTH;
  const year = month.substring(0, 4);
  const monthNo = Number(month.substring(4, 6));
  const sheetName = monthToSheetName(month);

  const summarySheet = ss.getSheetByName(sheetName);
  if (!summarySheet) {
    ui.alert(`「${sheetName}」シートが見つかりません。`);
    return;
  }
  const historySheet = ss.getSheetByName("提出履歴");
  if (!historySheet) {
    ui.alert("「提出履歴」シートが見つかりません。");
    return;
  }
  const masterSs = openMasterSpreadsheet(ss);
  if (!masterSs) return;
  const master = loadMasterForMonth(masterSs, month, {});
  if (master.error) {
    ui.alert(master.error);
    return;
  }

  // 1. 二重移行の防止：移行済みなら中止。新システムの履歴がある管理番号は移行せずに一覧で知らせる
  const historyData = historySheet.getDataRange().getValues();
  const kanriNosInHistory = {};
  for (let i = 1; i < historyData.length; i++) {
    if (String(historyData[i][COL_HIST.MONTH - 1]).trim() !== month) continue;
    if (String(historyData[i][COL_HIST.OUTPUT_AT - 1]).trim() === MIGRATION_MARK) {
      ui.alert(`${sheetName}分はすでに移行済みです（提出履歴 ${i + 1}行目）。処理を中止します。`);
      return;
    }
    kanriNosInHistory[String(historyData[i][COL_HIST.KANRI_NO - 1]).trim()] = true;
  }

  const summaryLastRow = summarySheet.getLastRow();
  const dataCols = summarySheet.getLastColumn() - 21;
  if (summaryLastRow < 2 || dataCols < 1) {
    ui.alert(`「${sheetName}」シートのV列以降にデータがありません。`);
    return;
  }

  // 2. V列以降の提出日を読み取り、提出履歴の行を作る
  const kanriNos = summarySheet.getRange(2, 2, summaryLastRow - 1, 1).getValues(); // B列の管理番号
  const dateRange = summarySheet.getRange(2, 22, summaryLastRow - 1, dataCols);
  const dateValues = dateRange.getValues();
  const dateBackgrounds = dateRange.getBackgrounds();

  const newRows = [];
  const errors = [];          // 日付として読めないセル（1件でもあれば書き込まない）
  const skipped = [];         // 新システムの履歴があるため移行しなかった管理番号
  const notInMaster = [];     // マスタに管理番号がない行
  const otherColors = [];     // 黄色以外の色が付いたセル（返送済みかどうか要確認）
  const notReturned = [];     // 未返送の行（返送メールのため E列のファイル名入力が必要）

  for (let i = 0; i < kanriNos.length; i++) {
    const rowNo = i + 2;
    const kanriNo = String(kanriNos[i][0]).trim();
    if (kanriNo === "") continue;

    // セルを「日付・返送済み」のリストにする
    const cells = [];
    for (let j = 0; j < dataCols; j++) {
      const value = dateValues[i][j];
      if (String(value).trim() === "") continue;
      const cellName = columnToLetter(22 + j) + rowNo;

      let mon, day;
      if (value instanceof Date) {
        mon = Number(Utilities.formatDate(value, tz, "M"));
        day = Number(Utilities.formatDate(value, tz, "d"));
      } else {
        const m = String(value).trim().match(/^(\d{1,2})\/(\d{1,2})/);
        if (m) {
          mon = Number(m[1]);
          day = Number(m[2]);
        }
      }
      if (mon !== monthNo || !(day >= 1 && day <= 31)) {
        errors.push(`${cellName}：「${value}」を${monthNo}月の日付として読めません`);
        continue;
      }

      const color = String(dateBackgrounds[i][j] || "").toLowerCase();
      if (color !== RETURNED_COLOR && color !== "#ffffff" && color !== "") {
        otherColors.push(`${cellName}（${color}）`);
      }
      cells.push({ day: day, isReturned: color === RETURNED_COLOR });
    }
    if (cells.length === 0) continue;

    if (kanriNosInHistory[kanriNo]) {
      skipped.push(`${rowNo}行目（管理番号 ${kanriNo}）`);
      continue;
    }

    const info = master.byKanriNo[kanriNo];
    if (!info) notInMaster.push(`${rowNo}行目（管理番号 ${kanriNo}）`);

    // 同じ日付・同じ返送状態が続くセルを1回の提出にまとめる
    for (let c = 0; c < cells.length; c++) {
      const last = newRows.length > 0 ? newRows[newRows.length - 1] : null;
      if (last && last.rowNo === rowNo && last.day === cells[c].day && last.isReturned === cells[c].isReturned) {
        last.units++;
      } else {
        newRows.push({ kanriNo: kanriNo, info: info, day: cells[c].day, isReturned: cells[c].isReturned, units: 1, rowNo: rowNo });
      }
    }
  }

  if (errors.length > 0) {
    ui.alert(`日付として読めないセルがあるため、移行を中止しました。修正してから再度実行してください。\n\n` + errors.join('\n'));
    return;
  }
  if (newRows.length === 0) {
    ui.alert("移行する提出日がありません。" + (skipped.length > 0 ? `\n\n■ 新システムの履歴があるため対象外\n` + skipped.join('\n') : ""));
    return;
  }

  // 3. 書き込み前に内容を確認してもらう
  const totalUnits = newRows.reduce((sum, r) => sum + r.units, 0);
  let summary = `「${sheetName}」の手作業分を提出履歴に追加します。\n`
    + `・追加する行：${newRows.length}行（回数分の合計 ${totalUnits}回）\n`
    + `・うち未返送：${newRows.filter(r => !r.isReturned).length}行\n`
    + `・実行前に「${sheetName}」シートの控えを作成します\n`;
  if (skipped.length > 0) summary += `\n■ 新システムの履歴があるため移行しない（手で確認してください）\n` + skipped.join('\n') + '\n';
  if (notInMaster.length > 0) summary += `\n■ マスタに管理番号がない（氏名・ID・メールアドレスは空欄で追加）\n` + notInMaster.join('\n') + '\n';
  if (otherColors.length > 0) summary += `\n■ 黄色以外の色が付いたセル（未返送として扱います）\n` + otherColors.join('\n') + '\n';
  summary += `\n実行してよろしいですか？`;
  if (ui.alert("手作業分の移行", summary, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  // 4. 控えを作成してから提出履歴に追加
  const backupName = `${sheetName}_移行前控え_` + Utilities.formatDate(new Date(), tz, "yyyyMMddHHmmss");
  summarySheet.copyTo(ss).setName(backupName);

  ensureHeader(historySheet, COL_HIST.CONTENT, "本文");
  ensureHeader(historySheet, COL_HIST.UNITS, "回数分");
  ensureHeader(historySheet, COL_HIST.SUBMITTED_AT, "提出日時");

  const values = newRows.map(r => {
    const submittedAt = Utilities.parseDate(`${year}/${monthNo}/${r.day}`, tz, "yyyy/M/d");
    if (!r.isReturned) notReturned.push(`${r.rowNo}行目（管理番号 ${r.kanriNo}）${monthNo}/${r.day}${r.units >= 2 ? `×${r.units}` : ""}`);
    return [
      r.kanriNo,
      r.info ? r.info.id : "",
      r.info ? r.info.name : "",
      r.info ? r.info.email : "",
      "",                                         // E列：ファイル名（未返送分は手で入力）
      month,
      MIGRATION_MARK,                             // G列：出力日時の代わりに目印
      r.isReturned ? MIGRATION_RETURNED : "",     // H列：生徒返送日
      "",                                         // I列：本文（手作業分はなし）
      r.units,                                    // J列：回数分
      submittedAt                                 // K列：提出日時
    ];
  });

  const startRow = historySheet.getLastRow() + 1;
  historySheet.getRange(startRow, COL_HIST.ID, values.length, 1).setNumberFormat('@');
  historySheet.getRange(startRow, COL_HIST.MONTH, values.length, 1).setNumberFormat('@');
  historySheet.getRange(startRow, 1, values.length, values[0].length).setValues(values);

  let message = `提出履歴に${values.length}行（提出履歴 ${startRow}〜${startRow + values.length - 1}行目）を追加しました。\n`
    + `控え：「${backupName}」シート\n\n`
    + `次に【集計】→「集計」を実行し、「${sheetName}」と控えのV列以降が一致するか確認してください。`;
  if (notReturned.length > 0) {
    message += `\n\n■ 未返送の行（返送メールを送るには、提出履歴E列にファイル名を入力してください）\n` + notReturned.join('\n');
  }
  ui.alert(message);
}

/**
 * 列番号を A1 表記の列名（1 → A、22 → V、27 → AA）にする
 */
function columnToLetter(col) {
  let letter = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}
