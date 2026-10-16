<?php
/*----------------------------------------------------------------------------------------------------
!!!!これは設定ファイルを分岐させるファイルです。
!!!!通常は使用しませんが、フォームの結果によって設定を出し分けたい時などに使用します。
!!!!フォームが設置してあるフォルダに【mail_config_overwrite.php】のファイル名で個別に設定ファイルを保存・設置してください。

★以下デフォルト値です。
$configPHP = 'mail_config.php';//設定ファイル読み込み。フォームがあるディレクトリに設置する。
$confirmHTML = 'confirm.html';//確認画面用テンプレート
$mailUserTXT = 'mail_user.txt';//ユーザー宛メールテンプレート
$mailAddminTXT = 'mail_addmin.txt';//管理者宛メールテンプレート
$errorHTML = 'error.html';//エラー画面用テンプレート



* ★以下設定時の注意点　
* ・値（=の後）は数字以外の文字列（一部を除く）はダブルクオーテーション「'」、または「'」で囲んでいます。
* ・これをを外したり削除したりしないでください。後ろのセミコロン「;」も削除しないください。
* ・また先頭に「$」が付いた文字列は変更しないでください。数字の1または0で設定しているものは必ず半角数字で設定下さい。
* ・メールアドレスのname属性の値が「Email」ではない場合、以下必須設定箇所の「$Email」の値も変更下さい。
* ・name属性の値に半角スペースは使用できません。
*以上のことを間違えてしまうとプログラムが動作しなくなりますので注意下さい。
----------------------------------------------------------------------------------------------------*/
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//バージョンチェック用
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
$vercheck_func_over = "v4.0.0";

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//上書きするファイルの分岐処理を下記に記述する。
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
//メール系処理の前に上書き処理
function overwrite_mail_before(){
    global $subject, $_POST;

    //提出方法によってメール件名に追記する 
    $submit_A = $_POST['submit_text'];
    $submit_B = $_POST['old_f01'];

    if ($submit_A !== "" && $submit_B === "") {
        $subject .= 'A';
    } elseif ($submit_A === "" && $submit_B !== "") {
        $subject .= 'B';
    } else {
    }
}

//メール系処理の後に上書き処理：最終送信でメールを送った後、同じ内容をスプレッドシート（GAS）へ保存する
function overwrite_mail_after(){
    global $sendmail, $empty_flag;

    //確認画面への遷移時、エラー時は何もしない
    if ($sendmail != 1 || $empty_flag != 0) {
        return;
    }

    require_once dirname(__FILE__) . '/spreadsheet_sender.php';

    //mail.php でエスケープされた値を元に戻す
    $post = sethtmlspecialchars_decode($_POST);

    $fields = array();
    foreach (array('nameA', 'school_number', 'tel', 'mail', 'submit_text') as $key) {
        $fields[$key] = isset($post[$key]) ? $post[$key] : '';
    }

    //添付ファイル（確認画面で mail.php の tmp に保存されたもの）
    $filePath = null;
    $fileName = null;
    $mimeType = null;
    if (!empty($post['file']['f01'])) {
        $tmpPath = dirname($_SERVER['SCRIPT_FILENAME']) . '/tmp/' . basename($post['file']['f01']);
        if (is_file($tmpPath)) {
            $filePath = $tmpPath;
            $fileName = (isset($post['old_f01']) && $post['old_f01'] !== '') ? $post['old_f01'] : basename($tmpPath);
            $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $mimeType = ($ext === 'doc')
                ? 'application/msword'
                : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
    }

    sendToSpreadsheet($fields, $filePath, $fileName, $mimeType);
}
?>