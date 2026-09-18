//共通追加用js

//スクロールが100に達したらボタン表示
var topBtnFunc = function(FLAG_){
    var topBtn = $('#tpbtn');    
    if(FLAG_ == true){topBtn.hide();}

    if ($(window).scrollTop() > 100) {
        topBtn.fadeIn();
    } else {
        topBtn.fadeOut();
    }
}

//スクロールが800に達したらフッター部分にある画像を裏側で表示しておく。
var bkImgFixedFunc = function(FLAG_){
    var $fixedBox = $('.FixedBox');
    var addClass = 'bkImgON';

    if ($(window).scrollTop() > 800) {
        $fixedBox.eq(0).addClass(addClass);
    } else {
        $fixedBox.eq(0).removeClass(addClass);
    }
}

//スクロールが150に達したら上部からメニュー一覧を表示（PCのみ）
function slideTxtFunc(THIS_){
    var bt=150;
    var ds = 0;
    var fls =true;
    ds = $(THIS_).scrollTop();
    if (bt < ds && fls == true) {
        $("#slideTxt").slideToggle("500");
        fls=false;
    }
    if (bt >= ds && fls == false) {
        $("#slideTxt").slideToggle("500");
        fls=true;
    }
}

//スムーススクロール
$(function(){
    var $this = this;
//   $('a[href^="#"]').click(function() {
    $('a[href^="#"]').on('click', function() {
        //SP版の時、横からのスライドメニューがオープンしていたらメニューボタンを発火させる。
        if($('#sideBox').hasClass('open') == true){
            $('#menuBtnBox .menuBtn').trigger('MyClick');
            console.log('開いています');
        }
        
       var $heder = $('#headerArea.spMode');
//       console.log($heder);
       var $hederH = ($heder.length !== 0) ? parseFloat( $heder.css("height") ) : 0;
       var speed = 500;
       var href= $(this).attr("href");
       var target = $(href == "#" || href == "" ? 'html' : href);
       var position = target.offset().top-$hederH;
       $('body,html').animate({scrollTop:position}, speed, 'swing');
//       return false;
   });
    
    //スクロールが100に達したらボタン表示
    topBtnFunc(true);
    //スクロールが800に達したらフッター部分にある画像を裏側で表示しておく。
    bkImgFixedFunc();
    //スクロールが150に達したら上部からメニュー一覧を表示（PCのみ）
    slideTxtFunc($this);
});

//縦横変化で切り替えチェック
$(window).on({
    scroll : function(){
        var $this = this;
        //スクロールが100に達したらボタン表示
        //topBtnFunc();
        //スクロールが800に達したらフッター部分にある画像を裏側で表示しておく。
        //bkImgFixedFunc();
        //スクロールが150に達したら上部からメニュー一覧を表示（PCのみ）
        //slideTxtFunc($this);
        //下部にある固定背景のところまでスクロールしたら、固定を解除する。
        //fixedOffFunc();
    },
});


//別ウィンドウ
function externalLinks() {  
if (!document.getElementsByTagName) return;  
var anchors = document.getElementsByTagName("a");
for (var i=0; i<anchors.length; i++) {  
var anchor = anchors[i];  
if (anchor.getAttribute("href") &&  
anchor.getAttribute("rel") == "external")  
anchor.target = "_blank";  
}  
}  
window.onload=externalLinks;  

/*スライド部分*/
var slideNumFunc = function(NUM_){
    $('#txtSlideBox ul li').removeClass('Active');
    $('#txtSlideBox ul .slide'+NUM_).addClass('Active');

    //#mainSlideBoxからslideを含むクラスを全て削除して、新しいスライドのクラスを付与する。
//    $('#mainSlideBox').removeClass(function(INDEX_, CLASS_NAME_){
//        return (CLASS_NAME_.match(/\bslide\S+/g) || []).join(' ');
//    }).addClass('slide'+NUM_);
};

var digitFunc = function(NUM_){
    //10未満なら数値の前に0を付与して返す。10以上ならそのまま返す。
    return NUM_ = (NUM_ >= 10 ) ? NUM_ : '0'+NUM_;
};

//
//
//var fixedOffFunc = function(){
//    //下部にある固定背景のところまでスクロールしたら、固定を解除する。
//    var $FixedBox = $('#FixedArea');
//    var $window = $(window);
//    var classTxt = 'fixedOff';
//
//    if($FixedBox.offset().top <= $window.scrollTop()){
//        $FixedBox.addClass(classTxt);
//    }
//    else{
//        $FixedBox.removeClass(classTxt);
//    }
//
//};
//
//

































//共通追加用js

//縦横切り替え
//var isLandscape = function(MODE_){
//    var $body = $('body');
//    var $sideBox = $('#sideBox');
//
//    if(MODE_ == true){//MODE_引数をtrueにする事で強制的にmode_Aにする。
//        $body.addClass('mode_A');
//    }
//
//    $('#mainArea').removeClass();
//    if (window.innerHeight > window.innerWidth) {//縦長　mode_Aにする
//
//        if( $body.hasClass('mode_B') ){
//            $body.removeClass('mode_B').addClass('mode_A');
//            //closeFunc();//イベントを強制発火させて閉じる関数。
//            //            $sideBox.removeClass('open');
//        }
//
//        $sideBox.css({
//            //top : parseInt( $('#headerArea').css('height') ),
//            top : 0,
//        });
//    }else{//横長 mode_Bにする
//        if( $body.hasClass('mode_A') ){
//            $body.removeClass('mode_A').addClass('mode_B');
//            closeFunc();//イベントを強制発火させて閉じる関数。
//            //$sideBox.removeClass('open');
//        }
//
//        $sideBox.css({
//            top : 0,
//        });
//    }
//};

//#sideBoxが開いていたら、イベントを強制発火させて閉じる関数。
//var closeFunc = function(){
//    if($('#sideBox').hasClass('open') == true){
//        $('#menuBtnBox .menuBtn').trigger('MyClick');
//    }
//};

var elementMoveFunc = function(ELEME_FROM_, ELEME_TO_, NUM_){//FROMの要素からTOの要素内へ移動する。
    ELEME_FROM_ += '';//文字列型
    ELEME_TO_ += '';//文字列型
    NUM_ += 0;//数値型
    if(typeof NUM_ === 'number'){
        for(var i=0;i<NUM_;i++){
            $(ELEME_FROM_).appendTo(ELEME_TO_);
        }
    }
    else{
        $(ELEME_FROM_).appendTo(ELEME_TO_);
    }
}


//$(function(){
//    //hoverONクラスの削除
////    $('.hoverON').removeClass('hoverON');
//
//    //MENUを動作させる処理
//    var scrollPos=0;
//    $('#menuBtnBox .menuBtn, #sideBox .menuBtn').on('click MyClick', function(){
//        event.stopPropagation();
//        var $sideBox = $('#sideBox');
//        var $menuElem = $('#menuBtnBox .menuBtn');
//        var $body = $('body');
//        var $window = $(window);
//        var class_open = 'open';
//        var positionCss='',topCss='';
//
//
//        if($sideBox.hasClass(class_open) == true){//openしている時は、閉じる
//            $sideBox.removeClass(class_open);
//            $menuElem.removeClass(class_open);
//
//            //スクロール固定を解除
//            //            $body.css({
//            //                position    : 'static',
//            //                top         : 0
//            //            });
//            //$window.scrollTop(scrollPos);//記憶したスクロール位置へ移動
//        }
//        else{//openが付いてない時は閉じているので、開く
//            $sideBox.addClass(class_open);
//            $menuElem.addClass(class_open);
//
//            //scrollPos = $window.scrollTop();//現在のスクロール位置を記憶
//            //スクロールしている箇所で固定
//            //            $body.css({
//            //                position    : 'fixed',
//            //                top         : -scrollPos
//            //            });
//        }        
//    });
//
//    //MENUの中以外をクリックした時の処理
//    $(document).on('click', function(e){
//        var $this = $(this);
//        var $target = $(e.target);
//
//        //console.log($target);
//        if($target.parents('#sideBox').length >= 1){
//            //console.log($target.parents('#sideBox'));
//            event.stopPropagation();
//            //event.preventDefault();
//        }
//        else{
//            //            closeFunc();//イベントを強制発火させて閉じる関数。
//        }
//    });
//
//    //1度縦横チェック
//    //    isLandscape(true);
//});


//縦横変化で切り替えチェック
$(window).on({
    resize : function(){
        //        isLandscape();
    },
    load : function(){
        //        isLandscape(true);
    },
    scroll : function(){
        //$('#sideBox').removeClass('open');
    }
});