// ===== スプレッドシート保存処理（追加） ここから =====
var SPREADSHEET_GAS_URL = "https://script.google.com/macros/s/AKfycbwMUEX8ac_-0rQ_zZg1he8EVLjHMxdEx4Q81bUtbJuJ7jepN0uZaZb9Hk_gku2Kxyxg/exec";
var SPREADSHEET_TIMEOUT_MS = 15000;          // 最大待ち時間（これを過ぎたら既存処理へ進む）
var SPREADSHEET_MAX_FILE = 2 * 1024 * 1024;  // 添付ファイルの上限（2MB）

// 送信名 : 本番フォームの入力欄の name（違う場合は右側だけ書き換える）
var FIELD_MAP = {
  nameA: "nameA",
  school_number: "school_number",
  tel: "tel",
  mail: "mail",
  submit_text: "submit_text"
};

function readFileAsBase64(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () { resolve(String(reader.result).split(",")[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 入力内容をGASへ送る。成功・失敗・タイムアウトのどれでも resolve する（既存処理を止めない）
function sendToSpreadsheet(form) {
  var params = new URLSearchParams();
  Object.keys(FIELD_MAP).forEach(function (key) {
    var el = form.elements[FIELD_MAP[key]];
    params.append(key, el ? el.value : "");
  });

  var fileInput = form.querySelector('input[type="file"]');
  var file = fileInput && fileInput.files && fileInput.files[0];
  var ready = (file && file.size <= SPREADSHEET_MAX_FILE)
    ? readFileAsBase64(file).then(function (data) {
        params.append("fileName", file.name);
        params.append("mimeType", file.type || "application/octet-stream");
        params.append("fileData", data);
      })
    : Promise.resolve();

  var send = ready.then(function () {
    return fetch(SPREADSHEET_GAS_URL, { method: "POST", mode: "no-cors", body: params });
  });
  var timeout = new Promise(function (resolve) { setTimeout(resolve, SPREADSHEET_TIMEOUT_MS); });

  return Promise.race([send, timeout]).catch(function (err) {
    console.error("[spreadsheet] 送信に失敗しました", err);
  });
}
// ===== スプレッドシート保存処理（追加） ここまで =====
