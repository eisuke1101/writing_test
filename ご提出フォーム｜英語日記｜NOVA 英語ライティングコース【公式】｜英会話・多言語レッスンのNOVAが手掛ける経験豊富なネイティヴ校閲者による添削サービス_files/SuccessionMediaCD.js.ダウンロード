/**
 * 流入元の引継
 */

//var jQuery = jQuery.noConflict();

// cookieを設定する自ドメイン
// ドメイン全体とする場合：     xxx.com
// 特定ホストのみとする場合：   www.xxx.com
var __smc_selfDomain    = "nova.co.jp";

//引継対象とするフォームURL
//前方一致にて判定
var __smc_targetFQDN = [
    "https://www.nova.co.jp/",
    "https://jm-neo.com/",
    "https://sp.jm-neo.com/",
    "https://kids.jm-neo.com/",
    "https://reserve.jm-neo.com/",
    "https://nova-ochanoma.jp/",
    "https://nova-livestation.com/",
    "https://nova-sapuri.jp/",
    "https://app-ryugaku.com/",
    "https://nova-sapuri.com/",
    "https://nova-schoolblog.info/",
    "https://nova-schoolvoice.info/",
];

//流入パラメータ
var __smc_ad_param_name = "ad";
var __smc_ad_param_name2 = "prefix";
var __smc_ad_param_name3 = "yclid";
var __smc_ad_param_name4 = "IA";
var __smc_ad_param_name5 = "ad_mk";
var __smc_ad_param_name6 = "end_user_id";//外部
var __smc_ad_param_name7 = "ct_3aed840a1186Y609";//外部

//cookieへ設定する際のキー
var __smc_cookie_name   = "ad_media_cd";
var __smc_cookie_name2   = "ad_media2_cd";
var __smc_cookie_name3   = "ad_media3_cd";
var __smc_cookie_name4   = "ad_media4_cd";
var __smc_cookie_name5   = "ad_media5_cd";
var __smc_cookie_name6   = "ad_media6_cd";//外部
var __smc_cookie_name7   = "ad_media7_cd";//外部

//cookieの有効期限とする日数 0:ブラウザが閉じられるまで
var __smc_cookie_expired = 0;

/**
 * GETクエリストリングに指定したキーのパラメータが存在する場合
 * その値をクッキーに保存する。
 * @param p_name クエリストリングパラメータ名
 * @param c_name 保存するクッキー名
 */
var setCookieFromQuery = function (p_name,c_name){
    var querystr = new String(location.search.substring(1)); 
    var parms = querystr.split('&'); 
    for (var i=0; i<parms.length; i++) { 
        var pos = parms[i].indexOf('='); 
        if (pos > 0) { 
            var key = parms[i].substring(0,pos); 
            if( key == p_name ){
                var val = parms[i].substring(pos+1); 
                jQuery.cookie(c_name,val,{ expires: __smc_cookie_expired ,path:"/" ,domain:__smc_selfDomain});
            }
        } 
    }
}

/**
 * リファラより検索エンジンからの流入であることを設定
 * @param c_name 保存するクッキー名
 **/
var setCookieFromReferrerForSearchEngine = function (c_name){
    var referrerstr = new String(document.referrer);
    var val = "";

    if(referrerstr.match("google")){
        val = "ggl";
    }else if(referrerstr.match("yahoo")){
        val = "yah";
    }else if(referrerstr.match("msn")){
        val = "msn";
    }else{
        val = "";
    }
    
    if( val != ""){
        jQuery.cookie(c_name,val,{ expires: __smc_cookie_expired ,path:"/" ,domain:__smc_selfDomain});
    }
}

/**
 * 指定したキーを利用しクッキーから値を取得する
 * 存在しない場合は空文字
 * @param c_name クッキー名
 */
var getCookie = function (c_name){
    var c_val = jQuery.cookie(c_name);
    if(c_val){
        return unescape(c_val);
    }else{
        return "";
    }
}

var setAdParamToAhchor = function(){

    //Cookieからメディアコードを取得
    mediaParamCookie = getCookie(__smc_cookie_name);
    mediaParamCookie2 = getCookie(__smc_cookie_name2);
    mediaParamCookie3 = getCookie(__smc_cookie_name3);
    mediaParamCookie4 = getCookie(__smc_cookie_name4);
    mediaParamCookie5 = getCookie(__smc_cookie_name5);
    mediaParamCookie6 = getCookie(__smc_cookie_name6);//外部
    mediaParamCookie7 = getCookie(__smc_cookie_name7);//外部
    
    //Cookieにメディアコードがあるならターゲットとなるドメインへのhrefへ設定
    if(mediaParamCookie != ""){

        var targetAnchorSelector = "";
        $(__smc_targetFQDN).each(function(i,val){
            targetAnchorSelector += 'a[href^="'+val+'"],';
        });
        targetAnchorSelector += "#____dummy____";
        //requestフォームのリンク一覧を取得
        var linkList = $(targetAnchorSelector);
        //
        var hrefstr = "";
        linkList.each(function(){
            //href属性をチェック
            hrefstr = jQuery(this).attr("href");
            //既にパラメータadが含まれる場合は何もしない
            if(!hrefstr.match("ad=[^&]+")){
                //クエリストリングに媒体コードパラメータが入ってなければ追加する。
                if(hrefstr.match("\\?[^\\?]+=")){
                    //他のパラメータがある場合
                    hrefstr = hrefstr + "&ad=" + mediaParamCookie;
                }else{
                    hrefstr = hrefstr + "?ad=" + mediaParamCookie;
                }
            }
            jQuery(this).attr("href",hrefstr);
        });
    }
    if(mediaParamCookie2 != ""){

        var targetAnchorSelector = "";
        $(__smc_targetFQDN).each(function(i,val){
            targetAnchorSelector += 'a[href^="'+val+'"],';
        });
        targetAnchorSelector += "#____dummy____";
        //requestフォームのリンク一覧を取得
        var linkList = $(targetAnchorSelector);
        //
        var hrefstr = "";
        linkList.each(function(){
            //href属性をチェック
            hrefstr = jQuery(this).attr("href");
            //既にパラメータadが含まれる場合は何もしない
            if(!hrefstr.match("prefix=[^&]+")){
                //クエリストリングに媒体コードパラメータが入ってなければ追加する。
                if(hrefstr.match("\\?[^\\?]+=")){
                    //他のパラメータがある場合
                    hrefstr = hrefstr + "&prefix=" + mediaParamCookie2;
                }else{
                    hrefstr = hrefstr + "?prefix=" + mediaParamCookie2;
                }
            }
            jQuery(this).attr("href",hrefstr);
        });
    }
    if(mediaParamCookie3 != ""){

        var targetAnchorSelector = "";
        $(__smc_targetFQDN).each(function(i,val){
            targetAnchorSelector += 'a[href^="'+val+'"],';
        });
        targetAnchorSelector += "#____dummy____";
        //requestフォームのリンク一覧を取得
        var linkList = $(targetAnchorSelector);
        //
        var hrefstr = "";
        linkList.each(function(){
            //href属性をチェック
            hrefstr = jQuery(this).attr("href");
            //既にパラメータadが含まれる場合は何もしない
            if(!hrefstr.match("yclid=[^&]+")){
                //クエリストリングに媒体コードパラメータが入ってなければ追加する。
                if(hrefstr.match("\\?[^\\?]+=")){
                    //他のパラメータがある場合
                    hrefstr = hrefstr + "&yclid=" + mediaParamCookie3;
                }else{
                    hrefstr = hrefstr + "?yclid=" + mediaParamCookie3;
                }
            }
            jQuery(this).attr("href",hrefstr);
        });
    }
    if(mediaParamCookie4 != ""){

        var targetAnchorSelector = "";
        $(__smc_targetFQDN).each(function(i,val){
            targetAnchorSelector += 'a[href^="'+val+'"],';
        });
        targetAnchorSelector += "#____dummy____";
        //requestフォームのリンク一覧を取得
        var linkList = $(targetAnchorSelector);
        //
        var hrefstr = "";
        linkList.each(function(){
            //href属性をチェック
            hrefstr = jQuery(this).attr("href");
            //既にパラメータadが含まれる場合は何もしない
            if(!hrefstr.match("IA=[^&]+")){
                //クエリストリングに媒体コードパラメータが入ってなければ追加する。
                if(hrefstr.match("\\?[^\\?]+=")){
                    //他のパラメータがある場合
                    hrefstr = hrefstr + "&IA=" + mediaParamCookie4;
                }else{
                    hrefstr = hrefstr + "?IA=" + mediaParamCookie4;
                }
            }
            jQuery(this).attr("href",hrefstr);
        });
    }
    if(mediaParamCookie5 != ""){

        var targetAnchorSelector = "";
        $(__smc_targetFQDN).each(function(i,val){
            targetAnchorSelector += 'a[href^="'+val+'"],';
        });
        targetAnchorSelector += "#____dummy____";
        //requestフォームのリンク一覧を取得
        var linkList = $(targetAnchorSelector);
        //
        var hrefstr = "";
        linkList.each(function(){
            //href属性をチェック
            hrefstr = jQuery(this).attr("href");
            //既にパラメータadが含まれる場合は何もしない
            if(!hrefstr.match("ad_mk=[^&]+")){
                //クエリストリングに媒体コードパラメータが入ってなければ追加する。
                if(hrefstr.match("\\?[^\\?]+=")){
                    //他のパラメータがある場合
                    hrefstr = hrefstr + "&ad_mk=" + mediaParamCookie5;
                }else{
                    hrefstr = hrefstr + "?ad_mk=" + mediaParamCookie5;
                }
            }
            jQuery(this).attr("href",hrefstr);
        });
    }
    if(mediaParamCookie6 != ""){

        var targetAnchorSelector = "";
        $(__smc_targetFQDN).each(function(i,val){
            targetAnchorSelector += 'a[href^="'+val+'"],';
        });
        targetAnchorSelector += "#____dummy____";
        //requestフォームのリンク一覧を取得
        var linkList = $(targetAnchorSelector);
        //
        var hrefstr = "";
        linkList.each(function(){
            //href属性をチェック
            hrefstr = jQuery(this).attr("href");
            //既にパラメータadが含まれる場合は何もしない
            if(!hrefstr.match("end_user_id=[^&]+")){
                //クエリストリングに媒体コードパラメータが入ってなければ追加する。
                if(hrefstr.match("\\?[^\\?]+=")){
                    //他のパラメータがある場合
                    hrefstr = hrefstr + "&end_user_id=" + mediaParamCookie6;
                }else{
                    hrefstr = hrefstr + "?end_user_id=" + mediaParamCookie6;
                }
            }
            jQuery(this).attr("href",hrefstr);
        });
    }
    if(mediaParamCookie7 != ""){

        var targetAnchorSelector = "";
        $(__smc_targetFQDN).each(function(i,val){
            targetAnchorSelector += 'a[href^="'+val+'"],';
        });
        targetAnchorSelector += "#____dummy____";
        //requestフォームのリンク一覧を取得
        var linkList = $(targetAnchorSelector);
        //
        var hrefstr = "";
        linkList.each(function(){
            //href属性をチェック
            hrefstr = jQuery(this).attr("href");
            //既にパラメータadが含まれる場合は何もしない
            if(!hrefstr.match("ct_3aed840a1186Y609=[^&]+")){
                //クエリストリングに媒体コードパラメータが入ってなければ追加する。
                if(hrefstr.match("\\?[^\\?]+=")){
                    //他のパラメータがある場合
                    hrefstr = hrefstr + "&ct_3aed840a1186Y609=" + mediaParamCookie7;
                }else{
                    hrefstr = hrefstr + "?ct_3aed840a1186Y609=" + mediaParamCookie7;
                }
            }
            jQuery(this).attr("href",hrefstr);
        });
    }

}

/**
 * リクエストフォームへのリンクを取得し、
 * 引数に指定、もしくはクッキーに保持された
 * メディア媒体コードをパラメータとして
 * クエリストリングに追加する。
 * リクエスト用のフォーム処理内部にてCookieを直接参照するよう方式を変更。
 * アンカーへの設置のみ取りやめ
 */
var addMediaParamToAnchor = function(){

    //検索エンジンからのリファラーよりAdパラムを設定
    //setCookieFromReferrerForSearchEngine(__smc_cookie_name);
    //クエリストリングからクッキーにAdパラムを設定
    setCookieFromQuery(__smc_ad_param_name,__smc_cookie_name);
    setCookieFromQuery(__smc_ad_param_name2,__smc_cookie_name2);
    setCookieFromQuery(__smc_ad_param_name3,__smc_cookie_name3);
    setCookieFromQuery(__smc_ad_param_name4,__smc_cookie_name4);
    setCookieFromQuery(__smc_ad_param_name5,__smc_cookie_name5);
    setCookieFromQuery(__smc_ad_param_name6,__smc_cookie_name6);//外部
    setCookieFromQuery(__smc_ad_param_name7,__smc_cookie_name7);//外部
    //AタグへAdパラムを復元
    setAdParamToAhchor();
}

$(function() {
    addMediaParamToAnchor();
});