<?php
/**
 * スプレッドシート連携の事前確認用ファイル（確認が済んだらすぐに削除してください）
 *
 * フォームを設置している Web サーバーから Google Apps Script（GAS）へ送信できるかを確認する。
 * GAS に GET でアクセスするだけで、スプレッドシートへの書き込みやメール送信は行わない。
 *
 * 使い方（どちらか一方）
 *   A. ブラウザ：このファイルをフォームと同じサーバーにアップロードし、URL を開く
 *   B. コマンド：サーバーにログインし、php check_gas.php を実行する
 *
 * 確認項目
 *   確認項目①：PHP の curl 拡張が使えるか
 *   確認項目②：Web サーバーから外部（script.google.com / script.googleusercontent.com）へ HTTPS で接続できるか
 *   確認項目③：HTTPS の証明書を検証できるか
 */

header('Content-Type: text/plain; charset=utf-8');

$gasUrl = 'https://script.google.com/macros/s/AKfycbwMUEX8ac_-0rQ_zZg1he8EVLjHMxdEx4Q81bUtbJuJ7jepN0uZaZb9Hk_gku2Kxyxg/exec';
$redirectHostUrl = 'https://script.googleusercontent.com/';

$results = array();

echo "スプレッドシート連携 事前確認結果\n";
echo "実行日時：" . date('Y-m-d H:i:s') . "\n";
echo "実行方法：" . (PHP_SAPI === 'cli' ? 'コマンド' : 'ブラウザ（' . PHP_SAPI . '）') . "\n";
echo "PHP バージョン：" . PHP_VERSION . "\n";
echo "==================================================\n\n";

// 確認項目①：curl 拡張
$disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));
$needed = array('curl_init', 'curl_setopt_array', 'curl_exec', 'curl_getinfo', 'curl_error', 'curl_close');
$missing = array();
foreach ($needed as $fn) {
    if (!function_exists($fn) || in_array($fn, $disabled, true)) {
        $missing[] = $fn;
    }
}
if (!extension_loaded('curl')) {
    $results[1] = array('NG', 'curl 拡張が読み込まれていません。');
} elseif ($missing) {
    $results[1] = array('NG', '次の関数が使えません（disable_functions など）：' . implode(', ', $missing));
} else {
    $v = curl_version();
    $results[1] = array('OK', 'curl ' . $v['version'] . ' / ' . $v['ssl_version']);
}
printResult('確認項目①：PHP の curl 拡張が使えるか', $results[1]);

if ($results[1][0] !== 'OK') {
    echo "確認項目①が NG のため、確認項目②・③は確認できません。\n";
    exit;
}

// 確認項目②・③：外部への HTTPS 接続と証明書の検証
$targets = array(
    'script.google.com（GAS の送信先）'                  => $gasUrl,
    'script.googleusercontent.com（GAS の結果の転送先）' => $redirectHostUrl,
);
$sslErrors = array(35, 51, 53, 54, 58, 59, 60, 64, 66, 77, 80, 82, 83, 90, 91); // 証明書・SSL 関連の curl エラー番号
$connectOk = true;
$sslOk = true;
$details = array();
foreach ($targets as $label => $url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ));
    curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno === 0) {
        $details[] = "  {$label}：接続できました（HTTP {$code}）";
    } elseif (in_array($errno, $sslErrors, true)) {
        $sslOk = false;
        $details[] = "  {$label}：証明書・SSL のエラー（curl {$errno}: {$error}）";
    } else {
        $connectOk = false;
        $details[] = "  {$label}：接続できません（curl {$errno}: {$error}）";
    }
}
$results[2] = $connectOk ? array('OK', '') : array('NG', 'ファイアウォールやプロキシで外向きの通信が止められている可能性があります。');
$results[3] = $sslOk ? array('OK', '') : array('NG', 'サーバーの CA 証明書が古いなどの理由で、証明書を検証できていません。');
if (!$connectOk && $sslOk) {
    $results[3] = array('未確認', '確認項目②が NG のため、証明書の検証まで進めませんでした。');
}

printResult('確認項目②：外部へ HTTPS で接続できるか', $results[2]);
printResult('確認項目③：HTTPS の証明書を検証できるか', $results[3]);
echo "接続先ごとの結果\n" . implode("\n", $details) . "\n\n";

echo "==================================================\n";
$allOk = $results[1][0] === 'OK' && $results[2][0] === 'OK' && $results[3][0] === 'OK';
echo $allOk ? "総合結果：OK（確認項目①〜③すべて問題ありません）\n" : "総合結果：NG（上記の NG の項目をご確認ください）\n";
echo "\nこの画面の内容をそのまま返信してください。確認後、このファイルは削除してください。\n";

function printResult($title, $result)
{
    echo $title . "\n";
    echo "  結果：" . $result[0] . "\n";
    if ($result[1] !== '') {
        echo "  内容：" . $result[1] . "\n";
    }
    echo "\n";
}
