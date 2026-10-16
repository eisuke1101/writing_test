// テスト用ダミー：本番の /correct/common/mail_v4.0.0/mail.php（確認画面・メール送信）の代わり。
// メールは送らず、フォームが送信されてきたことだけを表示する。
module.exports = (req, res) => {
  let size = 0;
  req.on('data', (chunk) => { size += chunk.length; });
  req.on('end', () => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>テスト用ダミー</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.7">
<h1 style="font-size:20px">テスト用ダミー画面</h1>
<p>本番ではここで既存の mail.php（確認画面・メール送信）が動きます。テスト環境ではメールは送らず、フォームの送信を受け取ったことだけを表示しています。</p>
<p>受け取った方式：${req.method}　データ量：${size} バイト</p>
<p><a href="/">フォームに戻る</a></p>
</body></html>`);
  });
};
