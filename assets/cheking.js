//ポスト
function onClickNext(){
    if(InputCheck()==false){return false;}
    with(document.inpost){
        formSaveFunc();//⇒cookie設定
//        action = '/biz/common/mail_v2.0/mail.php';
        action = '/correct/common/mail_v4.0.0/mail.php';
        //action = './mail/mail.php';
        method = "post";
        submit();
    }
}

function onClickSend(){
    with(document.inpost){
        removeAllCookies();//⇒cookie設定
//        action = '/biz/common/mail_v2.0/mail.php';
        action = '/correct/common/mail_v4.0.0/mail.php';
        //action = './mail/mail.php';
        method = "post";
        submit();
    }
}


function checkNumTF(txt){
    flg = true;
    for(i=0;i<txt.length;i++){
        c = txt.charAt(i);
        if("0123456789".indexOf(c,0)<0){
            flg = false;
            break;
        }
    }
    return flg;
}
function checkMailTF(txt){
    data=txt.match(/^\S+@\S+\.\S+$/);
    if(!data || !txt){
        return false;
    }else{
        return true;
    }
}

function getByteCount(value) {
    var count = 0;
    for ( var i = 0; i < value.length; ++i ) {
        var sub = value.substring(i, i + 1);
        if( checkIsZenkaku(sub) ){
            count += 2;
        }else{
            count += 1;
        }
    }
    return count;
}
function checkIsZenkaku(value) {
    for (var i = 0; i < value.length; ++i) {
        var c = value.charCodeAt(i);
        if (c < 256 || (c >= 0xff61 && c <= 0xff9f)) {
            return false;
        }
    }
    return true;
}
function checkNumAzTF(txt) { 
    data=txt.match(/[^a-z0-9\\._-]/gi);
    if(data){
        return false;
    }else{
        return true;
    }

}
function compareDays( datestr ){
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    var vYear = parseInt( datestr.substr( 0, 4  ),10);
    var vMonth = parseInt( datestr.substr( 5, 2 ),10 ) -1;
    var vDay = parseInt( datestr.substr( 8, 2 ),10 );
    var adate = new Date( vYear, vMonth, vDay );
    if( adate.getTime() < today.getTime() ){
        //過去の日付
        alert("来校希望日時が過去の日付です");
        return false;
    }else if( adate.getTime() < (today.getTime()+172800000) ){
        //未来だけれど4日345600000　2日172800000
        alert("来校希望日時は本日より2日以降の日付をご選択ください");
        return false;
    }else{
        //+4日以上未来
        return true;
    }
}



function InputCheck() {

    // 入力チェック
    with(document.inpost){
        
//        if (selectSubmitType.value == "") {
//            alert("提出方法を選択してください。");
//            return false;
//        }
//        
//        if (selectSubmitType.value == "A" && document.getElementById('selectFile').value == "") {
//            alert("ファイルを選択してください。");
//            return false;
//        }
//        
//        if (selectSubmitType.value == "B" && counter_input.value > 200) {
//            if( window.confirm('200単語を超えていますがよろしいですか？') ){
//            }
//            else{
//                return false;
//            }
//        }
        
        if (document.getElementById('selectFile').value == "" && (submit_text.value.trim() == "" || Number(counter_input.value) === 0)) {
            alert("提出する文章を入力、またはファイルを選択してください。");
            return false;
        }
      
        if (document.getElementById('selectFile').value !== "" && submit_text.value !== "") {
            alert("提出方法AまたはBのどちらかのみで提出してください。");
            return false;
        }
        
        
        //\u0020-\u007F：半角英数字、一部記号
        //\uFF62\uFF63\uFF65：｢｣･
        //\u00C0-\u00FF：À～ÿ（アクセント付き文字）
        //\u2018-\u201F：‘’‚‛“”„‟
        //\r\n|\n|\r：改行
        
        if (/[^\u0020-\u007F\uFF62\uFF63\uFF65\u00C0-\u00FF\u2018-\u201F\r\n|\n|\r]/.test(submit_text.value)){
            alert("提出方法Aの記入欄は、すべて半角の英数字または記号で入力してください。\n使用できる記号：\!\"\#\$\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\|\}\~｢｣･\'‚‛\"\„ ‟");
            return false;
        }

        if (counter_input.value > 200) {
            //以下は確認のみでOKの場合提出可能
            //if( window.confirm('200単語を超えていますがよろしいですか？') ){
            //}
            //else{
            //    return false;
            //}
            alert("200単語を超えています。");
            return false;
        }
        
        if (nameA.value == "") {
            alert("お名前が未入力です。");
            return false;
        }
        
        if (mail.value == "") {
            alert("Eメールアドレスが未入力です。");
            return false;
        }
        if (mail2.value == "") {
            alert("確認用のEメールアドレスが未入力です。");
            return false;
        }
        if (mail.value.match(/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/)){
        }else{
            alert("Eメールアドレスがエラー、もしくはご半角で入力ください。");
            return false;
        }if (mail.value != mail2.value) {
            alert("Eメールアドレスが間違っています。");
            return false;
        }
        /*if(checkboxDoui.checked === false){
          alert("プライバシーポリシーへの同意が未選択です。")
          return false;
        }*/
        return true;
    }
}



//cookie設定
$(function () {
    var divArray = ['autosave','restore','removecookies'];
    for(var i=0; i<divArray.length;i++){
        $('<div>').attr({
            'id':divArray[i],
            'style':'visibility:hidden;'
        }).appendTo('body');
    }

    if(typeof(cookieUnique) == 'undefined'){//cookieUnique変数をformのあるhtmlにで設定しておく。
        cookieUnique = '';
    }
    if(typeof(restorationCount) == 'undefined'){//フォーム内の復元させる回数。（selectなどの連動している部分を正しく復元させるため）
        restorationCount = 0;
    }
    if(typeof(currentPage) == 'undefined'){//
        currentPage = '';
    }

    var date = new Date();
    date.setTime( date.getTime() + ( 30 * 60 * 1000 ));//30分
    $('form *').autosave({
        'autosave': '#autosave',
        'restore': '#restore',
        'removeCookies': '#removecookies',
        'unique': cookieUnique,
        'interval': 86400000,
        'cookieExpiryLength': date,
    });

    $(window).on('load', function(){
        if(history.pushState && history.state !== undefined && currentPage == "form"){
            if(formBackCheckFunc(currentPage) == true && cookieCheckFunc(cookieUnique) !== null){
                formRestoreFunc();
                formEventFunc(restorationCount);
                //                formRemoveFunc();
            }else{
//                formRemoveFunc();
            }
        }
    });

});
function cookieCheckFunc(u){
    return $.cookie('autosave_' + u + '0_0');
}

function formSaveFunc(){
    $('#autosave').trigger('click');
}

function formRestoreFunc(){
    $('#restore').trigger('click');
}

function formRemoveFunc(){
    $('#removecookies').trigger('click');
}

function formEventFunc(n){
    if(n == 0){
        $('form select, form textarea, form input[type="radio"], form input[type="checkbox"]').trigger('change');
    }else{
        for(var i=0;i<n;i++){
            $('form select, form textarea, form input[type="radio"], form input[type="checkbox"]').trigger('change');
            formRestoreFunc();
        }
    }
}

function removeAllCookies() {
    var u = cookieUnique;

    for (var i = 0; i < 200; i++)
    {
        var j = 0;
        while ($.cookie('autosave_' + u + i + '_' + j) !== null && j < 20)
        {
            $.cookie('autosave_' + u + i + '_' + j, null);
        }
    }

    $.cookie('autosave_' + u + '_check', null);
    $.cookie('autosave_' + u + '_radio', null);
};

function formBackCheckFunc(PAGE_){
    var flag = false;
    if(history.state && history.state.page !== undefined && history.state.page == 'form'){
        flag = true;
    }
    // 現在の state を取得して、page を追加または更新
    var currentState = history.state || {};
    currentState.page = PAGE_;
    history.replaceState(currentState, null, null);

    return flag;
}

