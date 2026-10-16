<?php
/**
 * 英語日記フォーム：スプレッドシート保存処理（mail.php から呼び出す）
 *
 * mail.php がメールを送信できた直後に sendToSpreadsheet() を1回呼び出す。
 * 成功・失敗にかかわらず例外は投げないので、既存のメール送信処理は止まらない。
 * 失敗した場合は error_log に記録して false を返す。
 *
 * 必要なもの：PHP 5.6 以上、curl 拡張、script.google.com への HTTPS 接続
 *
 * 呼び出し例（mail.php の、最終送信でメール送信が成功した直後）：
 *
 *   require_once __DIR__ . '/spreadsheet_sender.php';
 *   sendToSpreadsheet(
 *       array(
 *           'nameA'         => $_POST['nameA'],
 *           'school_number' => $_POST['school_number'],
 *           'tel'           => $_POST['tel'],
 *           'mail'          => $_POST['mail'],
 *           'submit_text'   => $_POST['submit_text'],
 *       ),
 *       $attachmentPath,      // 添付ファイルの一時保存先（なければ null）
 *       $attachmentName,      // 利用者がアップロードしたときのファイル名
 *       $attachmentMimeType   // 添付ファイルの MIME タイプ
 *   );
 *
 * 入力値や添付ファイルの変数名は mail.php の作りに合わせて置き換える。
 */

// GAS Webアプリの URL（環境変数 SPREADSHEET_GAS_URL があればそちらを使う）
define('SPREADSHEET_GAS_URL', getenv('SPREADSHEET_GAS_URL') ?: 'https://script.google.com/macros/s/AKfycbwMUEX8ac_-0rQ_zZg1he8EVLjHMxdEx4Q81bUtbJuJ7jepN0uZaZb9Hk_gku2Kxyxg/exec');

// GAS 側と共有する合言葉。ソースに直接書かず、環境変数などから渡す
define('SPREADSHEET_GAS_SECRET', getenv('SPREADSHEET_GAS_SECRET') ?: '');

define('SPREADSHEET_TIMEOUT_SEC', 15);               // 最大待ち時間
define('SPREADSHEET_MAX_FILE_BYTES', 10 * 1024 * 1024); // 添付ファイルの上限（10MB）

/**
 * 入力内容と添付ファイルを GAS に送る。
 *
 * @param array       $fields   送信する入力値。キーは GAS 側の名前
 *                              （nameA, school_number, tel, mail, submit_text）
 * @param string|null $filePath 添付ファイルのサーバー上のパス。なければ null
 * @param string|null $fileName 添付ファイルの元のファイル名
 * @param string|null $mimeType 添付ファイルの MIME タイプ
 * @return bool GAS が保存（または重複として無視）したら true
 */
function sendToSpreadsheet(array $fields, $filePath = null, $fileName = null, $mimeType = null)
{
    try {
        $keys = array('nameA', 'school_number', 'tel', 'mail', 'submit_text');
        $params = array();
        foreach ($keys as $key) {
            $params[$key] = isset($fields[$key]) ? (string) $fields[$key] : '';
        }

        $fileHash = '';
        if ($filePath !== null && $filePath !== '' && is_readable($filePath)) {
            $size = filesize($filePath);
            if ($size !== false && $size <= SPREADSHEET_MAX_FILE_BYTES) {
                $data = file_get_contents($filePath);
                if ($data !== false) {
                    $params['fileName'] = ($fileName !== null && $fileName !== '') ? $fileName : basename($filePath);
                    $params['mimeType'] = ($mimeType !== null && $mimeType !== '') ? $mimeType : 'application/octet-stream';
                    $params['fileData'] = base64_encode($data);
                    $fileHash = sha1($data);
                }
            } else {
                error_log('[spreadsheet] 添付ファイルが上限を超えたため送りません: ' . $filePath);
            }
        }

        // 同じ内容が2回届いても1行にするための送信ID（内容から作る）
        $params['submissionId'] = hash('sha256', implode("\n", array(
            $params['mail'], $params['nameA'], $params['school_number'], $params['submit_text'], $fileHash,
        )));
        $params['secret'] = SPREADSHEET_GAS_SECRET;

        $ch = curl_init(SPREADSHEET_GAS_URL);
        curl_setopt_array($ch, array(
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true, // GAS は結果を 302 で別URLに渡す
            CURLOPT_MAXREDIRS      => 5,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => SPREADSHEET_TIMEOUT_SEC,
        ));
        $body = curl_exec($ch);
        $error = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($body === false) {
            error_log('[spreadsheet] 送信に失敗しました: ' . $error);
            return false;
        }
        $body = trim($body);
        if ($status !== 200 || ($body !== 'success' && $body !== 'duplicate')) {
            error_log('[spreadsheet] GAS がエラーを返しました: HTTP ' . $status . ' ' . substr($body, 0, 200));
            return false;
        }
        return true;
    } catch (Exception $e) {
        error_log('[spreadsheet] 予期しないエラー: ' . $e->getMessage());
        return false;
    } catch (Throwable $e) { // PHP 7 以降の Error も拾う（PHP 5 では使われない）
        error_log('[spreadsheet] 予期しないエラー: ' . $e->getMessage());
        return false;
    }
}
