// 作業B（GAS の反映）の動作確認用。確認が済んだら、この関数とシートに追加された「テスト（動作確認）」の行を削除する。
// 同じ送信IDで doPost を2回呼び、1回目が success、2回目が duplicate になることを確かめる。
function testDoPost() {
  const e = {
    parameter: {
      nameA: "テスト（動作確認）",
      school_number: "0",
      tel: "0",
      mail: "test@example.com",
      submit_text: "This is a test.",
      submissionId: "test-" + Utilities.getUuid()
    }
  };
  const first = doPost(e).getContent();
  const second = doPost(e).getContent();
  console.log("1回目: " + first + " / 2回目: " + second);
}
