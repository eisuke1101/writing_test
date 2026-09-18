var CATS_CK_CONSTS = {
    // 正規表現用文字生成
    UNIQUE_ID_REG_EXP: new RegExp('uqid=(.*?)(&|$)'),
    BANNER_CODE_REG_EXP: new RegExp('bid=(.*?)(&|$)'),
};

var SID_SESSION_KEY = 'CATS_RECORDING_SID_SESSION_ID';
var TUID_SESSION_KEY = 'CATS_RECORDING_TUID_SESSION_ID';
var LOG_STATUS_KEY = 'CATS_RECORDING_STATUS_SESSION_ID';

// LINE友だち登録タグ書き換え用のデフォルト名
var LINE_DATA_CATS_DEFAULT_NAME = 'lineFriendsFollowLink';

// LINE友だち登録メタタグのNAME
var LINE_DATA_CATS_META_TAG_DEFAULT_NAME = 'l-ad:ad_type';

/**
 * クッキー保存処理を呼び出す
 * @param cid  広告ID
 * @param uqId サービス毎に付与されるユニークID
 */
function CATS_Create(cid, uqId) {
    var can_organic_search = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var can_chatbot = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var cats_options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

    let directMeasurementIsActive = false;
    can_organic_search = can_organic_search.toString().toUpperCase() === 'ON' ? true : false;
    can_chatbot = can_chatbot.toString().toUpperCase() === 'ON' ? true : false;
    var can_api_coordination = cats_options.hasOwnProperty('api_parameter_inheritance') ? cats_options.api_parameter_inheritance : '';
    can_api_coordination = can_api_coordination.toString().toUpperCase() === 'ON' ? true : false;
    var cats_sameDomain = cats_options.hasOwnProperty('cats_sameDomain') ? cats_options.cats_sameDomain : '';
    cats_sameDomain = cats_sameDomain.toString().toUpperCase() === 'ON' ? true : false;

    // ダイレクト計測パラメーターが存在したら
    if (
        location.search.match(CATS_CK_CONSTS.UNIQUE_ID_REG_EXP)
        && location.search.match(CATS_CK_CONSTS.BANNER_CODE_REG_EXP)
    ) {
        directMeasurementIsActive = true;

        // 現在のURLのドメインと、リファラのドメインを取得し、現在のページと照合させる
        // 異なる場合に限り、オーガニック検索として後続処理を継続させる
        var locationDomain = location.href.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
        var refererDomain = "";
        if (document.referrer !== "") {
            refererDomain = document.referrer.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
        }

        var performanceEntries = performance.getEntriesByType("navigation");
        var performanceType = "";
        performanceEntries.forEach(function (pe) {
            /** 読み込みタイプを取得 */
            performanceType = pe.type;
        });

        if (!cats_sameDomain) {
            if (locationDomain == refererDomain) {
                return;
            }
        }
        if (!can_chatbot || (performanceType != "reload" && performanceType != "back_forward")) {
            // ダイレクトクリック処理実行
            CATS_Direct_Click(uqId, can_chatbot, function () {
                var clickRawInfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
                var isConversionApi = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
                CATS_Cookie_Set(cid, 'AD', uqId, clickRawInfo, isConversionApi, cats_options, directMeasurementIsActive);
            });
        }

    } else if (
        can_organic_search
        && !location.search.match(new RegExp('ct_' + uqId + '=(.*?)(&|$)'))
        && !location.search.match(new RegExp('cats_not_organic=(.*?)(&|$)'))
    ) {
        directMeasurementIsActive = true;

        // オーガニック検索として処理
        // 現在のURLのドメインと、リファラのドメインを取得し、現在のページと照合させる
        // 異なる場合に限り、オーガニック検索として後続処理を継続させる
        var locationDomain = location.href.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
        var refererDomain = "";
        if (document.referrer !== "") {
            refererDomain = document.referrer.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
        }

        var performanceEntries = performance.getEntriesByType("navigation");
        var performanceType = "";
        performanceEntries.forEach(function (pe) {
            /** 読み込みタイプを取得 */
            performanceType = pe.type;
        });

        if (!cats_sameDomain) {
            if (locationDomain == refererDomain) {
                return;
            }
        }

        if (performanceType != "reload" && performanceType != "back_forward") {
            CATS_Organic_Search(cid, uqId, 0, function () {
                var clickRawInfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
                var isConversionApi = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
                CATS_Cookie_Set(cid, 'AD', uqId, clickRawInfo, isConversionApi, cats_options, directMeasurementIsActive);
            });
        }
    } else {
        // 通常処理
        var clickRawInfo = '';
        var isConversionApi = false;
        if (location.search.match(new RegExp('catsConversionApi=(.*?)(&|$)'))) {
            isConversionApi = decodeURIComponent(location.search.match(new RegExp('catsConversionApi=(.*?)(&|$)'))[1]);
        }
        CATS_Cookie_Set(cid, 'AD', uqId, clickRawInfo, isConversionApi, cats_options, directMeasurementIsActive);
    }

    // API連携パラメーター引き継ぎ
    if (can_api_coordination) {
        CATS_AddApiCooperationParameter();
    }
}

/**
 * クッキー保存処理をグループ用で呼び出す
 * @param gid  広告グループID
 * @param uqId サービス毎に付与されるユニークID
 */
function CATS_GroupCreate(gid, uqId) {
    var organic_cid = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '0';
    var can_organic_search = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var can_chatbot = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var cats_options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};

    let directMeasurementIsActive = false;
    can_organic_search = can_organic_search == 'on' ? true : false;
    organic_cid = organic_cid ? organic_cid : 0;
    can_chatbot = can_chatbot.toString().toUpperCase() === 'ON' ? true : false;
    var can_api_coordination = cats_options.hasOwnProperty('api_parameter_inheritance') ? cats_options.api_parameter_inheritance : '';
    can_api_coordination = can_api_coordination.toString().toUpperCase() === 'ON' ? true : false;
    var cats_sameDomain = cats_options.hasOwnProperty('cats_sameDomain') ? cats_options.cats_sameDomain : '';
    cats_sameDomain = cats_sameDomain.toString().toUpperCase() === 'ON' ? true : false;

    // ダイレクト計測パラメーターが存在したら
    if (
        location.search.match(CATS_CK_CONSTS.UNIQUE_ID_REG_EXP)
        && location.search.match(CATS_CK_CONSTS.BANNER_CODE_REG_EXP)
    ) {
        directMeasurementIsActive = true;

        // 現在のURLのドメインと、リファラのドメインを取得し、現在のページと照合させる
        // 異なる場合に限り、オーガニック検索として後続処理を継続させる
        var locationDomain = location.href.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
        var refererDomain = "";
        if (document.referrer !== "") {
            refererDomain = document.referrer.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
        }

        var performanceEntries = performance.getEntriesByType("navigation");
        var performanceType = "";
        performanceEntries.forEach(function (pe) {
            /** 読み込みタイプを取得 */
            performanceType = pe.type;
        });

        if (!cats_sameDomain) {
            if (locationDomain == refererDomain) {
                return;
            }
        }
        if (!can_chatbot || (performanceType != "reload" && performanceType != "back_forward")) {
            // ダイレクトクリック処理実行
            CATS_Direct_Click(uqId, can_chatbot, function () {
                var clickRawInfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
                var isConversionApi = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'false';
                CATS_Cookie_Set(gid, 'GROUP', uqId, clickRawInfo, isConversionApi, cats_options, directMeasurementIsActive);
            });
        }

    } else if (
        can_organic_search
        && !location.search.match(new RegExp('ct_' + uqId + '=(.*?)(&|$)'))
        && !location.search.match(new RegExp('cats_not_organic=(.*?)(&|$)'))
    ) {
        directMeasurementIsActive = true;

        // オーガニック検索として処理
        // 現在のURLのドメインと、リファラのドメインを取得し、現在のページと照合させる
        // 異なる場合に限り、オーガニック検索として後続処理を継続させる
        var locationDomain = location.href.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
        var refererDomain = "";
        if (document.referrer !== "") {
            refererDomain = document.referrer.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
        }

        var performanceEntries = performance.getEntriesByType("navigation");
        var performanceType = "";
        performanceEntries.forEach(function (pe) {
            /** 読み込みタイプを取得 */
            performanceType = pe.type;
        });

        if (!cats_sameDomain) {
            if (locationDomain == refererDomain) {
                return;
            }
        }

        if (performanceType != "reload" && performanceType != "back_forward") {
            CATS_Organic_Search(organic_cid, uqId, gid, function () {
                var clickRawInfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
                var isConversionApi = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'false';
                CATS_Cookie_Set(gid, 'GROUP', uqId, clickRawInfo, isConversionApi, cats_options, directMeasurementIsActive);
            });
        }
    } else {
        // 通常処理
        var clickRawInfo = '';
        var isConversionApi = 'false';
        if (location.search.match(new RegExp('catsConversionApi=(.*?)(&|$)'))) {
            isConversionApi = decodeURIComponent(location.search.match(new RegExp('catsConversionApi=(.*?)(&|$)'))[1]);
        }
        CATS_Cookie_Set(gid, 'GROUP', uqId, clickRawInfo, isConversionApi, cats_options);
    }

    // API連携パラメーター引き継ぎ
    if (can_api_coordination) {
        CATS_AddApiCooperationParameter();
    }
}

/**
 * クッキーに保存する
 * @param int id 広告ID又は広告グループID
 * @param string uqId ユニークID
 * @param string mark 広告用、広告グループ用
 * @param string CATS_sessionId  セッションIDを含む.区切りのパラメーター
 * @param String isConversionApi コンバージョンAPIの利用可否
 * @param Boolean directMeasurementIsActive ダイレクト計測のアクティブ状態
 */
function CATS_Cookie_Set(id, mark, uqId) {
    var CATS_sessionId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    var isConversionApi = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'false';
    var catsOption = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    const directMeasurementIsActive = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 'false';

    var CATS_userId = '';
    var CATS_idArray = [];
    var CATS_paramResult = false;

    var expires_date = '';

    var CATS_uqId = uqId != null ? uqId : '';
    var CATS_mark = mark != null ? mark : '';
    var CATS_domain = CATS_GetDomain(CATS_uqId);
    var CATS_cookie = CATS_GetCookie();
    var CATS_localStorage = CATS_GetLocalStorage();

    var CATS_cid = 0;
    var CATS_gid = 0;

    if (CATS_mark === 'AD') {
        CATS_cid = id;
    } else if (CATS_mark === 'GROUP') {
        CATS_gid = id;
    }

    // クッキー・ローカルストレージキー
    const cidParameterKey = 'CATS_C_' + CATS_uqId + '_' + CATS_cid;   // パラメーター取得用（広告ID）
    const gidParameterKey = 'CATS_G_' + CATS_uqId + '_' + CATS_gid;   // パラメーター取得用（グループID）
    const cidExpiresKey = 'CATS_E_C_' + CATS_uqId + '_' + CATS_cid;   // 有効期限取得用（広告ID）
    const gidExpiresKey = 'CATS_E_G_' + CATS_uqId + '_' + CATS_gid;   // 有効期限取得用（グループID）
    const cidUserKey = 'CATS_U_C_' + CATS_uqId + '_' + CATS_cid;   // ユーザーID取得用（広告ID）
    const gidUserKey = 'CATS_U_G_' + CATS_uqId + '_' + CATS_gid;   // ユーザーID取得用（グループID）

    // IE対応（ITP用のURLパラメーター取得）
    var regexp = new RegExp('ct_' + CATS_uqId + '=(.*?)(&|$)');
    if (location.search.match(regexp)) {
        CATS_sessionId = decodeURIComponent(location.search.match(regexp)[1]);
    }

    // ITP用のURLパラメータが付いていなかった場合
    if (CATS_sessionId === '') {
        /**
         * URLパラメータを取得する
         */
        // 【広告ID】で保存されている【クッキー】が存在するか
        if (CATS_cookie.hasItem(cidParameterKey)) {
            CATS_sessionId = CATS_cookie.getItem(cidParameterKey);
        }
        // 【グループID】で保存されている【クッキー】が存在するか
        else if (CATS_cookie.hasItem(gidParameterKey)) {
            CATS_sessionId = CATS_cookie.getItem(gidParameterKey);
        }
        // 【広告ID】で保存されている【ローカルストレージ】が存在するか
        else if (CATS_localStorage.hasItem(cidParameterKey)) {
            CATS_sessionId = CATS_localStorage.getItem(cidParameterKey);
        }
        // 【グループID】で保存されている【ローカルストレージ】が存在するか
        else if (CATS_localStorage.hasItem(gidParameterKey)) {
            CATS_sessionId = CATS_localStorage.getItem(gidParameterKey);
        } else {
            // LINE友だち登録が契約されている且つ、多段階成果の時
            CATS_HandleLineFriendsFollow(catsOption, CATS_cid, CATS_gid, uqId, CATS_domain, LINE_DATA_CATS_DEFAULT_NAME);
            // セッションパラメータ未設定
            return;
        }
    }

    /**
     * 有効期限をCookieまたはローカルストレージから取得する
     */
    // 【広告ID】で保存されている【クッキー】が存在するか
    if (CATS_cookie.hasItem(cidExpiresKey)) {
        expires_date = CATS_cookie.getItem(cidExpiresKey);
    }
    // 【グループID】で保存されている【クッキー】が存在するか
    else if (CATS_cookie.hasItem(gidExpiresKey)) {
        expires_date = CATS_cookie.getItem(gidExpiresKey);
    }
    // 【広告ID】で保存されている【ローカルストレージ】が存在するか
    else if (CATS_localStorage.hasItem(cidExpiresKey)) {
        expires_date = CATS_localStorage.getItem(cidExpiresKey);
    }
    // 【グループID】で保存されている【ローカルストレージ】が存在するか
    else if (CATS_localStorage.hasItem(gidExpiresKey)) {
        expires_date = CATS_localStorage.getItem(gidExpiresKey);
    }

    /**
     * ユーザーIDを取得する
     */
    // 【広告ID】で保存されている【クッキー】が存在するか
    if (CATS_cookie.hasItem(cidUserKey)) {
        CATS_userId = CATS_cookie.getItem(cidUserKey);
    }
    // 【グループID】で保存されている【クッキー】が存在するか
    else if (CATS_cookie.hasItem(gidUserKey)) {
        CATS_userId = CATS_cookie.getItem(gidUserKey);
    }
    // 【広告ID】で保存されている【ローカルストレージ】が存在するか
    else if (CATS_localStorage.hasItem(cidUserKey)) {
        CATS_userId = CATS_localStorage.getItem(cidUserKey);
    }
    // 【グループID】で保存されている【ローカルストレージ】が存在するか
    else if (CATS_localStorage.hasItem(gidUserKey)) {
        CATS_userId = CATS_localStorage.getItem(gidUserKey);
    }

    // パラメーターがある場合はドット区切りで分割データ取得後に処理実行
    CATS_ParameterSplit(CATS_sessionId, CATS_userId, CATS_uqId, CATS_domain, function (CATS_idArray) {
        // バリデーションの実施
        if (CATS_ParamValidate(CATS_idArray) === false) {
            // NOTE: ダイレクト計測の場合、trackingUserIdがCATS_sessionId内に保存されないため、処理を終了する
            //       その為、LINE友だち登録計測に辿り着けず、URLの変更が出来ない
            //       ここでreturnするのは正しい動作な為、returnする前に、LINE友だち登録計測を実施する
            CATS_HandleLineFriendsFollow(catsOption, CATS_cid, CATS_gid, uqId, CATS_domain, LINE_DATA_CATS_DEFAULT_NAME);

            // 不正なパラメータを検知した場合、処理を終了する
            return;
        }
        if (CATS_ArgumentValidator(CATS_uqId, CATS_domain) === false) {
            // 不正な値を検知した場合、処理を終了する
            return;
        }

        // クッキー・ローカルストレージキー
        const cidParameterKey = 'CATS_C_' + CATS_uqId + '_' + CATS_idArray['sessionId']['cid'];   // パラメーター用（広告ID）
        const gidParameterKey = 'CATS_G_' + CATS_uqId + '_' + CATS_idArray['sessionId']['gid'];   // パラメーター用（グループID）
        const cidUserKey = 'CATS_U_C_' + CATS_uqId + '_' + CATS_idArray['sessionId']['cid'];   // ユーザーID用（広告ID）
        const gidUserKey = 'CATS_U_G_' + CATS_uqId + '_' + CATS_idArray['sessionId']['gid'];   // ユーザーID用（グループID）
        const cidExpiresKey = 'CATS_E_C_' + CATS_uqId + '_' + CATS_idArray['sessionId']['cid'];   // 有効期限用（広告ID）
        const gidExpiresKey = 'CATS_E_G_' + CATS_uqId + '_' + CATS_idArray['sessionId']['gid'];   // 有効期限用（グループID）
        const cidSessionKey = 'C_Aff_Val_' + CATS_uqId + '_' + CATS_idArray['sessionId']['cid'];   // セッションID用（広告ID）
        const gidSessionKey = 'G_Aff_Val_' + CATS_uqId + '_' + CATS_idArray['sessionId']['gid'];   // セッションID用（グループID）
        const cidMultiUserKey = 'CATS_M_U_C_' + CATS_uqId + '_' + CATS_idArray['sessionId']['cid'];   // トラッキングユーザーID用（広告ID）
        const gidMultiUserKey = 'CATS_M_U_G_' + CATS_uqId + '_' + CATS_idArray['sessionId']['gid'];   // トラッキングユーザーID用（グループID）

        // セッションIDの有効期限取得
        var expires = '';
        if (expires_date == '') {
            expires = CATS_GetExpires(CATS_idArray['sessionId']['expires']);
            expires_date = CATS_idArray['sessionId']['expires_date'];
        } else {
            expires = CATS_SetUnixExpires(expires_date);
        }

        // クッキーに保存するドメインをサブドメインなしのドメインとして取得する
        var origin = CATS_GetOriginDomain(CATS_cookie);

        if (CATS_idArray['sessionId']['cid'] != 0) {
            // CIDのクッキーを残す
            document.cookie = cidSessionKey + '=' + CATS_idArray['sessionId']['sessionId'] + '; expires=' + expires + '; path=/; domain=.' + origin;
            CATS_localStorage.setItem(cidSessionKey, CATS_idArray['sessionId']['sessionId'], expires);

            // 有効期限を保存する
            document.cookie = cidExpiresKey + '=' + expires_date + '; expires=' + expires + '; path=/; domain=.' + origin;
            CATS_localStorage.setItem(cidExpiresKey, expires_date, expires);

            // 離脱時に再取得出来るように全パラメータ文字列を保存する
            document.cookie = cidParameterKey + '=' + CATS_idArray['sessionId']['raw'] + '; expires=' + expires + '; path=/; domain=.' + origin;
            CATS_localStorage.setItem(cidParameterKey, CATS_idArray['sessionId']['raw'], expires);
        }

        // GIDがある場合クッキーを残す
        if (CATS_idArray['sessionId']['gid'] != 0) {
            document.cookie = gidSessionKey + '=' + CATS_idArray['sessionId']['sessionId'] + '; expires=' + expires + '; path=/; domain=.' + origin;
            CATS_localStorage.setItem(gidSessionKey, CATS_idArray['sessionId']['sessionId'], expires);

            // 有効期限を保存する
            document.cookie = gidExpiresKey + '=' + expires_date + '; expires=' + expires + '; path=/; domain=.' + origin;
            CATS_localStorage.setItem(gidExpiresKey, expires_date, expires);

            // 離脱時に再取得出来るように全パラメータ文字列を保存する
            document.cookie = gidParameterKey + '=' + CATS_idArray['sessionId']['raw'] + '; expires=' + expires + '; path=/; domain=.' + origin;
            CATS_localStorage.setItem(gidParameterKey, CATS_idArray['sessionId']['raw'], expires);
        }

        // UIDがある場合クッキーを残す
        if (CATS_idArray['userId']['userId'] != '') {
            // ユーザーIDの有効期限取得
            var userExpires = CATS_GetExpires(CATS_idArray['userId']['expires']);
            if (CATS_idArray['sessionId']['cid'] != 0) {
                // 離脱時に再取得出来るように全パラメータ文字列を保存する
                document.cookie = cidUserKey + '=' + CATS_idArray['userId']['raw'] + '; expires=' + userExpires + '; path=/; domain=.' + origin;
                CATS_localStorage.setItem(cidUserKey, CATS_idArray['userId']['raw'], userExpires);
            }
            // GIDがある場合クッキーを残す
            if (CATS_idArray['sessionId']['gid'] != 0) {
                // 離脱時に再取得出来るように全パラメータ文字列を保存する
                document.cookie = gidUserKey + '=' + CATS_idArray['userId']['raw'] + '; expires=' + userExpires + '; path=/; domain=.' + origin;
                CATS_localStorage.setItem(gidUserKey, CATS_idArray['userId']['raw'], userExpires);
            }
        }

        // トラッキングユーザーIDがあればクッキーとストレージにIDを保存
        if (CATS_idArray['userId']['trackingUserId'] != '') {
            // ユーザーIDの有効期限取得
            var userExpires = CATS_GetExpires(CATS_idArray['userId']['expires']);
            if (CATS_idArray['sessionId']['cid'] != 0) {
                // 離脱時に再取得出来るように全パラメータ文字列を保存する
                document.cookie = cidMultiUserKey + '=' + CATS_idArray['userId']['trackingUserId'] + '; expires=' + userExpires + '; path=/; domain=.' + origin;
                CATS_localStorage.setItem(cidMultiUserKey, CATS_idArray['userId']['trackingUserId'], userExpires);
            }
            // GIDがある場合クッキーを残す
            if (CATS_idArray['sessionId']['gid'] != 0) {
                // 離脱時に再取得出来るように全パラメータ文字列を保存する
                document.cookie = gidMultiUserKey + '=' + CATS_idArray['userId']['trackingUserId'] + '; expires=' + userExpires + '; path=/; domain=.' + origin;
                CATS_localStorage.setItem(gidMultiUserKey, CATS_idArray['userId']['trackingUserId'], userExpires);
            }
        }

        // 更新フラグがtrueの場合、ユーザーログを更新処理
        if (CATS_idArray['userId']['updateFlg'] === true) {
            CATS_SetUserId(CATS_domain, CATS_uqId, CATS_idArray['userId']['preSetUserId'], CATS_idArray['userId']['userId']);
        }

        // パラメータを付与するスクリプトを読み込ませる
        heatmapCooperation(CATS_uqId, CATS_idArray, CATS_domain);

        // パラメータを付与するスクリプトを読み込ませる
        postFpcSetParam(CATS_uqId, CATS_idArray, CATS_domain, isConversionApi, directMeasurementIsActive);

        // LINE友だち登録URLの書き換え
        CATS_HandleLineFriendsFollow(catsOption, CATS_cid, CATS_gid, uqId, CATS_domain, LINE_DATA_CATS_DEFAULT_NAME);
    });
}

/**
 * パラメーターのバリデーション
 * @param  idArray パラメータ配列
 * @return boolean true エラーなし / false エラーあり
 */
function CATS_ParamValidate(idArray) {

    // パラメータ数の検証
    if ((idArray['count'] == 4 || idArray['count'] == 7 || idArray['count'] == 8) === false) {
        return false;
    }

    /** セッションIDパラメータ **/
    // 広告IDの検証
    if ((typeof (idArray['sessionId']['cid']) === 'undefined' || idArray['sessionId']['cid'] === null)) {
        return false;
    }

    // 広告IDの形式検証
    if (/^([1-9]\d*|0)$/.test(idArray['sessionId']['cid']) != true) {
        return false;
    }

    // 広告グループIDの検証
    if ((typeof (idArray['sessionId']['gid']) === 'undefined' || idArray['sessionId']['gid'] === null)) {
        return false;
    }

    // 広告グループIDの形式検証
    if (/^([1-9]\d*|0)$/.test(idArray['sessionId']['gid']) != true) {
        return false;
    }

    // クッキー保存期間の検証
    if ((typeof (idArray['sessionId']['expires']) === 'undefined' || idArray['sessionId']['expires'] === null)) {
        return false;
    }

    // Cookie有効期限単位追加の為、単位によって処理を分岐
    var unit = idArray['sessionId']['expires'].slice(-1);

    switch (unit) {
        case 'h':
        case 'm':
        case 's':
            var expires = idArray['sessionId']['expires'].slice(0, -1);
            // クッキー保存期間の形式検証
            if (/^([1-9]\d*|0)$/.test(expires) != true) {
                return false;
            }

            // 保存期間の範囲を検証
            if (expires <= 0 || expires >= 8761) {
                return false;
            }
            break;
        default:
            // クッキー保存期間の形式検証
            if (/^([1-9]\d*|0)$/.test(idArray['sessionId']['expires']) != true) {
                return false;
            }

            // 保存期間の範囲を検証
            if (idArray['sessionId']['expires'] <= 0 || idArray['sessionId']['expires'] >= 366) {
                return false;
            }
    }

    // セッションIDの検証
    if ((typeof (idArray['sessionId']['sessionId']) === 'undefined' || idArray['sessionId']['sessionId'] === null)) {
        return false;
    }

    // セッションIDの形式検証
    if (/^[\w-]+$/.test(idArray['sessionId']['sessionId']) === false) {
        return false;
    }

    /** ユーザーIDパラメータ **/
    if (idArray['count'] == 7 || idArray['count'] == 8) {
        // ユーザーIDクッキー保存期間の検証
        if ((typeof (idArray['userId']['expires']) === 'undefined' || idArray['userId']['expires'] === null)) {
            return false;
        }

        // ユーザーIDクッキー保存期間の形式検証
        if (/^([1-9]\d*|0)$/.test(idArray['userId']['expires']) != true) {
            return false;
        }

        // ユーザーIDクッキー保存期間の範囲を検証
        if (idArray['userId']['expires'] <= 0 || idArray['userId']['expires'] >= 366) {
            return false;
        }

        // パラメータで渡されたユーザーIDの検証
        if (/^[\w-]+$/.test(idArray['userId']['preSetUserId']) === false) {
            return false;
        }

        // パラメータで渡されたユーザーIDの形式検証
        if ((typeof (idArray['userId']['preSetUserId']) === 'undefined' || idArray['userId']['preSetUserId'] === null)) {
            return false;
        }

        // ユーザーIDの検証
        if (/^[\w-]+$/.test(idArray['userId']['userId']) === false) {
            return false;
        }

        // ユーザーIDの形式検証
        if ((typeof (idArray['userId']['userId']) === 'undefined' || idArray['userId']['userId'] === null)) {
            return false;
        }

        // ユーザーIDの検証
        if (/^[\w-]+$/.test(idArray['userId']['trackingUserId']) === false) {
            return false;
        }
        // ユーザーIDの形式検証
        if ((typeof (idArray['userId']['trackingUserId']) === 'undefined' || idArray['userId']['trackingUserId'] === null)) {
            return false;
        }
    }

    return true;
}

/**
 * ユニークIDとドメインのバリデーション
 * @param string uqId   ユニークキー
 * @param stirng domain ドメイン
 */
function CATS_ArgumentValidator(uqId, domain) {

    // ユニークキーの検証
    if ((typeof (uqId) === 'undefined' || uqId === null)) {
        return false;
    }

    // ユニークキーの形式検証
    if (/^[0-9a-zA-Z]+$/.test(uqId) === false) {
        return false;
    }

    // ドメインの検証
    //（空の場合scriptのsrcが取れていない事になる、空以外はsrcがあるのでそのままで良い）
    if (domain === '') {
        return false;
    }

    return true;
}

/**
 * スクリプトファイルを動的に読み込み生成する
 *
 * @param src 読み込むソースファイルのURL
 * @param uqId サービス毎に付与されるユニークID
 * @param idArray
 * @param callback コールバック関数
 */
function CATS_LoadScript(src, uqId, idArray, callback) {
    var done = false;
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.async = false;
    script.charset = 'UTF-8';
    head.appendChild(script);
    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function () {
        if (!done && (!this.readyState ||
            this.readyState === 'loaded' || this.readyState === 'complete')) {
            done = true;
            callback(uqId, idArray);
            //Handle memory leak in IE
            // script.onload = script.onreadystatechange = null;
            if (head && script.parentNode) {
                head.removeChild(script);
            }
        }
    };
}

/**
 * idに指定されているscriptタグのドメインを取得する
 * @return string ドメイン(ex http://act.pro-cats.jp)
 */
function CATS_GetDomain(uqId) {
    var parser = document.createElement('a');
    var script = document.getElementById('ck_' + uqId);
    if (script == null) {
        return '';
    }
    parser.href = script.src;

    return parser.protocol + '//' + parser.hostname;
}

/**
 * サブドメインなしのドメインを取得する
 * @param Object cookie クッキーオブジェクト
 * @return string サブドメインなしのドメイン文字列
 */
function CATS_GetOriginDomain(cookie) {
    var origin = '';
    var sessionName = 's';

    // ドメインをピリオドで分割
    var domains = location.hostname.split('.').reverse();
    var length = domains.length;

    // 利用可能かつ一番高いレベルのドメインを探す
    for (var i = 0; i < length; i++) {
        // トップレベルから下位に向かって順に試す
        var bufOrigin = domains.slice(0, i + 1).reverse().join('.');
        document.cookie = sessionName + '=; domain=.' + bufOrigin + '; path=/; Max-age=0';
        document.cookie = sessionName + '=s; domain=.' + bufOrigin + '; path=/';
        // クッキーがセットできればオリジンとして採用する
        if (cookie.getItem(sessionName) === 's') {
            origin = bufOrigin;
        }
        document.cookie = sessionName + '=; domain=.' + bufOrigin + '; path=/; Max-age=0';
        if (origin) {
            break;
        }
    }

    return origin;
}


/**
 * クッキー情報を取得しオブジェクトとして返却する
 * https://developer.mozilla.org/ja/docs/Web/API/Document/cookie
 * @return オブジェクト クッキー情報
 */
function CATS_GetCookie() {
    var docCookies = {
        getItem: function (sKey) {
            if (!sKey || !this.hasItem(sKey)) { return null; }
            return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
        },
        setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
            if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return; }
            var sExpires = "";
            if (vEnd) {
                switch (vEnd.constructor) {
                    case Number:
                        sExpires = vEnd === Infinity ? "; expires=Tue, 19 Jan 2038 03:14:07 GMT" : "; max-age=" + vEnd;
                        break;
                    case String:
                        sExpires = "; expires=" + vEnd;
                        break;
                    case Date:
                        sExpires = "; expires=" + vEnd.toGMTString();
                        break;
                }
            }
            document.cookie = escape(sKey) + "=" + escape(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        },
        removeItem: function (sKey, sPath) {
            if (!sKey || !this.hasItem(sKey)) { return; }
            document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sPath ? "; path=" + sPath : "");
        },
        hasItem: function (sKey) {
            return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
        },
        keys: /* optional method: you can safely remove it! */ function () {
            var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = unescape(aKeys[nIdx]); }
            return aKeys;
        }
    };
    return docCookies;
}


/**
 * ローカルストレージ情報を取得しオブジェクトとして返却する
 * https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage
 *
 * @return オブジェクト ローカルストレージ情報
 */
function CATS_GetLocalStorage() {
    var docLocalStorages = {
        getItem: function (sKey) {
            if (!sKey || !localStorage.getItem(sKey)) { return null; }
            var sessionId = localStorage.getItem(sKey);
            return unescape(sessionId.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
        },
        setItem: function (sKey, sValue, expires) {
            if (!sKey || !expires) { return; }
            localStorage.setItem(sKey, sValue);
            // Web Storage の localStorage は期限が設定できないので項目として登録する
            localStorage.setItem(sKey + '_expires', expires);
        },
        removeItem: function (sKey) {
            if (!sKey) { return; }
            localStorage.removeItem(sKey);
        },
        hasItem: function (sKey) {
            if (!sKey) { return; }
            return Boolean(localStorage.getItem(sKey));
        },
        removeCheck: function (sKey) {
            if (!sKey) { return; }
            var target_expires = localStorage.getItem(sKey + '_expires');
            var nowDate = new Date(Date.now());
            if (target_expires && target_expires < nowDate) {
                this.removeItem(sKey);
                this.removeItem(sKey + '_expires');
            }
        }
    };

    // 期限切れのデータ削除
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        docLocalStorages.removeCheck(key);
    }

    return docLocalStorages;
}

/**
 * 文字列のクエリパラメータを分解して連想配列にして返却する
 * 分割後のパラメータが7個以上ある場合、7個目からのパラメータは保持されません
 * @param returnArray { session : { cid          : 広告ID
 *                                  gid          : 広告グループID
 *                                  expires      : クッキー保存期間
 *                                  sessionId    : セッションID
 *                                  raw          : セッションIDのクエリパラメータ文字列 },
 *                      userId  : { expires      : クッキー保存期間
 *                                  userId       : ユーザーID
 *                                  preSetUserId : 利用中のユーザーID
 *                                  updateFlg    : ユーザーログの更新判定（ 更新が不要の場合 false、更新が必要の場合 true ）
 *                                  raw          : ユーザーIDのクエリパラメータ文字列 },
 *                      result  : 分割結果（ ドット区切りの文字列で無かった場合 false、分割出来た場合 true ）
 *                      count   : 分割した数 }
 */
function CATS_ParameterSplit(parameter, userParameter, uqid, domain, callback) {
    var returnArray = {
        'sessionId': { 'cid': 0, 'gid': 0, 'expires': 0, 'sessionId': '', 'raw': '' },
        'userId': { 'expires': 0, 'userId': '', 'preSetUserId': '', 'updateFlg': false, 'raw': '', 'expires_date': '' },
        'result': false, 'count': 0, 'rid': 0
    };

    // パラメータがない場合は初期値のままで返却する
    if (parameter == '') {
        return returnArray;
    }

    var spliterParameter = parameter.split('.');

    // セッションIDの値を取得
    returnArray['sessionId']['cid'] = (typeof (spliterParameter[0]) !== 'undefined') ? spliterParameter[0] : 0;
    returnArray['sessionId']['gid'] = (typeof (spliterParameter[1]) !== 'undefined') ? spliterParameter[1] : 0;
    returnArray['sessionId']['expires'] = (typeof (spliterParameter[2]) !== 'undefined') ? spliterParameter[2] : 0;
    returnArray['sessionId']['sessionId'] = (typeof (spliterParameter[3]) !== 'undefined') ? spliterParameter[3] : '';
    returnArray['sessionId']['raw'] = spliterParameter.slice(0, 4).join('.');
    returnArray['sessionId']['expires_date'] = CATS_GetUnixExpires(returnArray['sessionId']['expires']);

    // ユーザーIDの値を取得
    returnArray['userId']['expires'] = (typeof (spliterParameter[4]) !== 'undefined') ? spliterParameter[4] : 0;
    returnArray['userId']['userId'] = (typeof (spliterParameter[5]) !== 'undefined') ? spliterParameter[5] : '';
    returnArray['userId']['trackingUserId'] = (typeof (spliterParameter[6]) !== 'undefined') ? spliterParameter[6] : '';
    returnArray['userId']['preSetUserId'] = returnArray['userId']['userId'];
    returnArray['userId']['raw'] = spliterParameter.slice(4, 7).join('.');

    // パラメーター情報取得
    returnArray['result'] = true;
    returnArray['count'] = spliterParameter.length;

    // レコーディングセッションID
    const SESSION_KEY = 'CATS_RECORDING_SESSION_ID';
    returnArray['rid'] = sessionStorage.getItem(SESSION_KEY);

    // ユーザーパラメーターがある場合ユーザーIDの比較処理
    if (userParameter != '') {
        // 区切り文字で配列に分割
        var spliterUserParameter = userParameter.split('.');
        // ユーザーIDの成果判定情報を取得後に処理実行
        CATS_GetActionUserIdCnt(domain, uqid, spliterUserParameter[1], function (actionUserIdCnt) {
            // パラメーターのユーザーIDが未成果かつ、設定したユーザーIDがユーザーパラメーターの値と違う場合ユーザーIDを再設定
            if (actionUserIdCnt == 0 && (typeof (spliterUserParameter[1]) !== 'undefined') && returnArray['userId']['userId'] != spliterUserParameter[1]) {
                // ユーザーIDの値を再設定
                returnArray['userId']['expires'] = (returnArray['userId']['expires'] != '') ? returnArray['userId']['expires'] : spliterUserParameter[0];
                returnArray['userId']['userId'] = spliterUserParameter[1];
                returnArray['userId']['preSetUserId'] = (returnArray['userId']['preSetUserId'] != '') ? returnArray['userId']['preSetUserId'] : returnArray['userId']['userId'];
                returnArray['userId']['raw'] = returnArray['userId']['expires'] + '.' + returnArray['userId']['userId'] + '.' + returnArray['userId']['trackingUserId'];
                returnArray['userId']['updateFlg'] = true;
            }
            // パラメーター数が7以外の場合再取得
            if (returnArray['count'] != 7 && returnArray['count'] != 8) {
                returnArray['count'] = spliterParameter.length + spliterUserParameter.length;
            }
            callback(returnArray);
        });
    } else {
        callback(returnArray);
    }
}

/**
 * ユーザーIDの成果判定情報取得
 * @param string domain   ドメイン
 * @param string uqid     ユニークID
 * @param string userId   ユーザーID
 * @param string callback 返却値
 */
function CATS_GetActionUserIdCnt(domain, uqid, userId, callback) {
    // POST送信用データ
    var postData = {
        'uqid': uqid,
        'userId': userId
    };

    var xhr = new XMLHttpRequest();

    // 読み込みが完了したときの処理
    xhr.onload = function (e) {
        var result = JSON.parse(xhr.responseText);
        if (result.actionUserIdResult == false) {
            // 異常処理
            return;
        }
        callback(result.actionUserIdCnt);
    };

    // 送信要データを加工
    var queryString = createQueryString(postData);

    // 非同期通信を実行する
    xhr.open('POST', domain + '/ck/getActionUserIdCnt.php', true);
    xhr.withCredentials = true;
    // POST 送信の場合は Content-Type は固定.
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    // パラメータを付与して実行
    xhr.send(queryString);
}

/**
 * ユーザーログ更新用データ送信
 * @param string domain       ドメイン
 * @param string uqid         ユニークID
 * @param string preSetUserId パラメータで渡されたユーザーID
 * @param string userId       ユーザーID
 */
function CATS_SetUserId(domain, uqid, preSetUserId, userId) {
    // POST送信用データ
    var postData = {
        'uqid': uqid,
        'preSetUserId': preSetUserId,
        'userId': userId
    };

    var xhr = new XMLHttpRequest();

    // 送信要データを加工
    var queryString = createQueryString(postData);

    // 非同期通信を実行する
    xhr.open('POST', domain + '/ck/setUserId.php', true);
    xhr.withCredentials = true;
    // POST 送信の場合は Content-Type は固定.
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    // パラメータを付与して実行
    xhr.send(queryString);
}

/**
 * サーバーに接続してクリック処理実行
 *
 * @param string   uqId     ユニークID
 * @param boolean  can_chatbot チャットボット(クオルバ対応)
 * @param function callback 計測処理実行
 */
function CATS_Direct_Click(uqId, can_chatbot, callback) {
    const CATS_uqId = uqId || '';
    const CATS_domain = CATS_GetDomain(CATS_uqId);

    // パラメーターデータ取得
    const paramUqId = decodeURIComponent(location.search.match(CATS_CK_CONSTS.UNIQUE_ID_REG_EXP)[1]);

    // 顧客確認（この計測タグの持ち主と、ダイレクト実行広告の顧客が同一か確認）
    if (paramUqId !== CATS_uqId) { return; }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', CATS_domain + '/cl/index.php' + location.search + '&cats_direct=true', true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    const body = new URLSearchParams({
        referer: document.referrer,
    });
    const cookies = CATS_GetCookie();
    for (const k of ['_ly_c', '_ly_su', '_ly_r', '__oppref', '__obref']) {
        const v = cookies.getItem(k);
        if (v == null) continue;
        body.set(k, v);
    }
    xhr.send(body);

    // 応答結果
    xhr.onload = function () {
        if (!can_chatbot) {
            // 再読み込み時はクリック計測禁止
            history.replaceState("", "", location.href.replace(CATS_CK_CONSTS.UNIQUE_ID_REG_EXP, ""));
            history.replaceState("", "", location.href.replace(CATS_CK_CONSTS.BANNER_CODE_REG_EXP, ""));
            if (location.search == '' && location.href.substr(-1) == '?') history.replaceState("", "", location.href.slice(0, -1));
        }
        // 再読み込み時はクリック計測禁止
        $queryParameter = location.search.match(/\?/) ? '&' : '?';
        history.replaceState("", "", location.href + $queryParameter + "cats_not_organic=true" + '&cats_direct=true');

        const result = JSON.parse(xhr.responseText || '{}');
        const clickRawInfo = result.clickRawInfo ? result.clickRawInfo : '';
        const isConversionApi = result.catsConversionApi ? result.catsConversionApi : false;
        const isMatchResultCustomRedirect = result.isMatchResultCustomRedirect ? result.isMatchResultCustomRedirect : false;
        const customRedirectUrl = result.customRedirectUrl ? result.customRedirectUrl : '';
        if (!isMatchResultCustomRedirect && customRedirectUrl) {
            $queryParameter = '?';
            window.location.href = customRedirectUrl + $queryParameter + "cats_not_organic=true" + '&cats_direct=true';
        }

        callback(clickRawInfo, isConversionApi, isMatchResultCustomRedirect, customRedirectUrl);

        CATS_SendDMPClickEvent(clickRawInfo, CATS_uqId);
    };
    xhr.onerror = function () {
        return callback();
    };
}

/**
 * オーガニック検索
 * @param int       cid         広告ID
 * @param String    uqId        顧客ID
 * @param function  callback    コールバック関数
 */
function CATS_Organic_Search(cid, uqId, gid, callback) {
    const CATS_domain = CATS_GetDomain(uqId);

    // パラメータの引き継ぎ
    const paramsStr = location.search;
    let openURL = CATS_domain + '/cl/index.php?uqid=' + uqId + '&cid=' + cid + '&gid=' + gid + '&cats_organic=true';
    if (paramsStr.length > 0) {
        openURL += '&' + paramsStr.slice(1);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', openURL, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    const body = new URLSearchParams({
        referer: document.referrer,
    });
    const cookies = CATS_GetCookie();
    for (const k of ['_ly_c', '_ly_su', '_ly_r', '__oppref', '__obref']) {
        const v = cookies.getItem(k);
        if (v == null) continue;
        body.set(k, v);
    }
    xhr.send(body);

    // 応答結果
    xhr.onload = function () {
        // 再読み込み時はクリック計測禁止
        $queryParameter = location.search.match(/\?/) ? '&' : '?';
        history.replaceState("", "", location.href + $queryParameter + "cats_not_organic=true");

        const result = JSON.parse(xhr.responseText || '{}');
        if (result.clickRawInfo) {
            const clickRawInfo = result.clickRawInfo;
            const isConversionApi = result.catsConversionApi ? result.catsConversionApi : false;
            const isMatchResultCustomRedirect = result.isMatchResultCustomRedirect ? result.isMatchResultCustomRedirect : false;
            const customRedirectUrl = result.customRedirectUrl ? result.customRedirectUrl : '';
            if (!isMatchResultCustomRedirect && customRedirectUrl) {
                $queryParameter = '?';
                window.location.href = customRedirectUrl + $queryParameter + "cats_not_organic=true" + '&cats_direct=true';
            }

            callback(clickRawInfo, isConversionApi, isMatchResultCustomRedirect, customRedirectUrl);

            CATS_SendDMPClickEvent(clickRawInfo, uqId);
        }
    };
    xhr.onerror = function () {
        return callback();
    };
}

/**
 * クエリパラメータを生成
 * @param array postData クエリ文字列にパラメータの連想配列
 * @return クエリパラメータ文字列 (ex. key=val&key=val....)
 */
function createQueryString(postData) {
    var queryString = [];
    Object.keys(postData).forEach(function (key) {
        if (postData[key] != '') {
            queryString.push(key + '=' + postData[key]);
        }
    });
    return queryString.join('&');
}

/**
 * 有効期限の作成
 * @param string expires クッキーの有効期限
 * @return 文字列に変換した日付
 */
function CATS_GetExpires(expires) {
    var nowtime = new Date().getTime();
    var unit = expires.slice(-1);
    var clearTime = new Date().getTime();  // 一旦現時刻を挿入

    switch (unit) {
        case 'h':
            clearTime = new Date(nowtime + (60 * 60 * 1000 * expires.slice(0, -1)));
            break;
        case 'm':
            clearTime = new Date(nowtime + (60 * 1000 * expires.slice(0, -1)));
            break;
        case 's':
            clearTime = new Date(nowtime + (1000 * expires.slice(0, -1)));
            break;
        default:
            clearTime = new Date(nowtime + (60 * 60 * 24 * 1000 * expires));
    }
    return clearTime.toGMTString();
}


/**
 * 有効期限の作成(UNIX
 * @param string expires クッキーの有効期限
 * @return 文字列に変換した日付
 */
function CATS_GetUnixExpires(expires) {
    var nowtime = new Date().getTime();
    var unit = expires.slice(-1);
    var clearTime = new Date().getTime();  // 一旦現時刻を挿入

    switch (unit) {
        case 'h':
            clearTime = new Date(nowtime + (60 * 60 * 1000 * expires.slice(0, -1)));
            break;
        case 'm':
            clearTime = new Date(nowtime + (60 * 1000 * expires.slice(0, -1)));
            break;
        case 's':
            clearTime = new Date(nowtime + (1000 * expires.slice(0, -1)));
            break;
        default:
            clearTime = new Date(nowtime + (60 * 60 * 24 * 1000 * expires));
    }
    return clearTime.getTime();
}

/**
 * 有効期限の変換(UNIX)
 * @param string expires クッキーの有効期限
 * @return 文字列に変換した日付
 */
function CATS_SetUnixExpires(expires) {
    var clearTime = new Date(expires - 0);
    return clearTime.toGMTString();
}

/**
 * 計測パラメータ付与処理
 *
 * @return   void
 */
function postFpcSetParam(CATS_uqId, CATS_idArray, CATS_domain, isConversionApi, directMeasurementIsActive) {
    var xhr = new XMLHttpRequest();
    var postCId = 0;

    const SET_ITP_PARAM_ON = 1; // ITP対策 計測タグ利用（自動付与）
    const SET_ITP_PARAM_ON_MANUAL = 2; // ITP対策 計測タグ利用（手動付与）
    const SET_ITP_STATUS_REDIRECTOR_NUM = 3; // ITP対策 リダイレクタ

    // 読み込みが完了したときの処理
    xhr.onload = function (e) {
        if (this.status === 404) {
            // 404 エラーになったら以降の処理は実施しない
            return;
        }
        // レスポンス内容jsonを配列にパース
        var result = JSON.parse(xhr.responseText);
        if (result.actionUserIdResult == false) {
            return;
        }
        if (
            result['useItpStatus'] == SET_ITP_PARAM_ON
            || result['useItpStatus'] == SET_ITP_PARAM_ON_MANUAL
            || (directMeasurementIsActive && result['useItpStatus'] == SET_ITP_STATUS_REDIRECTOR_NUM)
        ) {
            /* パラメータ書き換え */
            // パラメータを付与するスクリプトを読み込ませる
            // defer付きで読み込むのでコールバックで呼ばれる処理は最後になる
            CATS_LoadScript(CATS_domain + '/ck/param.js', CATS_uqId, CATS_idArray, function (uqId, CATS_idArray) {
                CATS_AddParameter(uqId, CATS_idArray, result['useItpStatus'], isConversionApi, directMeasurementIsActive);
            });
        }
    };
    // 読み込みが失敗したときの処理
    xhr.onerror = function (event) {
    };

    // 送信用データを整形
    try {
        if (CATS_uqId == 0 || typeof (CATS_uqId) == 'undefined') {
            // 必須パラメータ不備
            this.exit('not paramater');
        }
        if (CATS_idArray.sessionId.cid == 0 || typeof (CATS_idArray.sessionId.cid) == 'undefined') {
            // 計測対象外広告IDによる流入
            this.exit('non target cid');
        }

        let postData = {
            'uqid': CATS_uqId,
            'cid': CATS_idArray.sessionId.cid,
        };

        // 成果判定プログラムに非同期通信を実行する
        xhr.open('POST', CATS_domain + '/ck/getUseItpStatus.php', true);
        xhr.withCredentials = true;
        // POST 送信の場合は Content-Type は固定
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        // 送信要データを加工
        var queryString = createQueryString(postData);
        // パラメータを付与して実行
        xhr.send(queryString);
        //xhr.abort();
    } catch (e) {
        //console.log(e);
    }
};

/**
 * ヒートマップ連携パラメータ付与処理
 *
 * @return   void
 */
function heatmapCooperation(CATS_uqId, CATS_idArray, CATS_domain) {

    var xhr = new XMLHttpRequest();

    // 送信用データを整形
    try {
        if (CATS_uqId == 0 || typeof (CATS_uqId) == 'undefined') {
            // 必須パラメータ不備
            this.exit('not paramater');
        }
        if (CATS_idArray.sessionId.cid == 0 || typeof (CATS_idArray.sessionId.cid) == 'undefined') {
            // 計測対象外広告IDによる流入
            this.exit('non target cid');
        }
        if (CATS_idArray.sessionId.cid == 0 || typeof (CATS_idArray.sessionId.cid) == 'undefined') {
            // 計測対象外広告IDによる流入
            this.exit('non target cid');
        }

        let postData = {
            'uqid': CATS_uqId,
            'sessionId': CATS_idArray.sessionId.sessionId,
            'trackingUserId': CATS_idArray.userId.trackingUserId,
        };

        // 成果判定プログラムに非同期通信を実行する
        xhr.open('POST', CATS_domain + '/tr/logAuth.php', true);
        xhr.withCredentials = true;
        // POST 送信の場合は Content-Type は固定
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        // 送信要データを加工
        var queryString = createQueryString(postData);
        // パラメータを付与して実行
        xhr.send(queryString);
        //xhr.abort();
    } catch (e) {
        //console.log(e);
    }

    // 読み込みが完了したときの処理
    xhr.onload = function (e) {
        // 404 エラーになったら以降の処理は実施しない
        if (this.status === 404) { return; }

        // レスポンス内容jsonを配列にパース
        var result = JSON.parse(xhr.responseText);
        if (result.existLog == false) { return; }

        // セッションIDをストレージに保存する
        sessionStorage.setItem(SID_SESSION_KEY, CATS_idArray.sessionId.sessionId);
        sessionStorage.setItem(TUID_SESSION_KEY, CATS_idArray.userId.trackingUserId);
        sessionStorage.setItem(LOG_STATUS_KEY, result.logStatus);
    };
    // 読み込みが失敗したときの処理
    xhr.onerror = function (event) { };
};

/**
 * 現在のURLのクエリからパラメータの値を1つ取り出す
 * クエリ(location.search)だけを対象にするため、ページ内アンカー(#以降)は値に含めない
 * キーの前を先頭か & で区切って探すため、末尾だけが一致する別のキーには反応しない
 *
 * @param  string key パラメータ名
 * @return string|null 値(URLエンコードされたまま)。パラメータが無ければ null
 */
function CATS_GetQueryParam(key) {
    var query = location.search.replace(/^\?/, '');
    var match = query.match(new RegExp('(^|&)' + key + '=([^&#]*)'));
    return match ? match[2] : null;
}

/**
 * aタグとformタグにfbclidを引き継ぐパラメーターを追加する
 * コンバージョンAPIのクリックIDを引き継ぐ
 */
function CATS_AddApiCooperationParameter() {
    try {
        // aタグのURLに対してパラメータを付与する
        var aTag = document.getElementsByTagName('a');
        for (var i = 0; i < aTag.length; i++) {

            // ページ内リンクのハッシュ文字列がある場合は何も行わない
            if (aTag[i].hash != '') { continue; }
            // http/https以外のプロトコル と #しかないURL に対しては何も行わない
            if (!aTag[i].href.match(/https?/) || aTag[i].href.match(/#$/)) { continue; }
            endSymbol = (aTag[i].href.indexOf('?') == -1) ? '?' : '&';

            // コンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('fbclid') !== null) {
                aTag[i].search += endSymbol + "fbclid=" + encodeURIComponent(CATS_GetQueryParam('fbclid'));
                endSymbol = '&';
            }

            // GoogleコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('gclid') !== null) {
                aTag[i].search += endSymbol + "gclid=" + encodeURIComponent(CATS_GetQueryParam('gclid'));
                endSymbol = '&';
            }

            // Yahoo検索広告オフラインコンバージョンAPI / Yahooディスプレイ広告コンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('yclid') !== null) {
                aTag[i].search += endSymbol + "yclid=" + encodeURIComponent(CATS_GetQueryParam('yclid'));
                endSymbol = '&';
            }

            // TikTokコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('ttclid') !== null) {
                aTag[i].search += endSymbol + "ttclid=" + encodeURIComponent(CATS_GetQueryParam('ttclid'));
                endSymbol = '&';
            }

            // LINEコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('ldtag_cl') !== null) {
                aTag[i].search += endSymbol + "ldtag_cl=" + encodeURIComponent(CATS_GetQueryParam('ldtag_cl'));
                endSymbol = '&';
            }

            // Yahooディスプレイ広告コンバージョンAPIのユーザー識別パラメータ引き継ぎ
            if (CATS_GetQueryParam('yj_r') !== null) {
                aTag[i].search += endSymbol + "yj_r=" + encodeURIComponent(CATS_GetQueryParam('yj_r'));
                endSymbol = '&';
            }

            // Google広告クリックコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('gbraid') !== null) {
                aTag[i].search += endSymbol + "gbraid=" + encodeURIComponent(CATS_GetQueryParam('gbraid'));
                endSymbol = '&';
            }
            if (CATS_GetQueryParam('wbraid') !== null) {
                aTag[i].search += endSymbol + "wbraid=" + encodeURIComponent(CATS_GetQueryParam('wbraid'));
                endSymbol = '&';
            }
            // XAdsコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('twclid') !== null) {
                aTag[i].search += endSymbol + "twclid=" + encodeURIComponent(CATS_GetQueryParam('twclid'));
                endSymbol = '&';
            }
        }

        // fromタグのURLに対してパラメータを付与する
        var formTag = document.getElementsByTagName('form');
        for (var i = 0; i < formTag.length; i++) {
            // http/https以外のプロトコル と #しかないURL に対しては何も行わない
            if (!formTag[i].action.match(/https?/) || formTag[i].action.match(/#$/)) { continue; }
            endSymbol = (formTag[i].action.indexOf('?') == -1) ? '?' : '&';

            // コンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('fbclid') !== null) {
                formTag[i].action += endSymbol + "fbclid=" + encodeURIComponent(CATS_GetQueryParam('fbclid'));
                endSymbol = '&';
            }

            // GoogleコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('gclid') !== null) {
                formTag[i].search += endSymbol + "gclid=" + encodeURIComponent(CATS_GetQueryParam('gclid'));
                endSymbol = '&';
            }

            // Yahoo検索広告オフラインコンバージョンAPI / Yahooディスプレイ広告コンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('yclid') !== null) {
                formTag[i].action += endSymbol + "yclid=" + encodeURIComponent(CATS_GetQueryParam('yclid'));
                endSymbol = '&';
            }

            // TikTokコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('ttclid') !== null) {
                formTag[i].action += endSymbol + "ttclid=" + encodeURIComponent(CATS_GetQueryParam('ttclid'));
                endSymbol = '&';
            }

            // LINEコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('ldtag_cl') !== null) {
                formTag[i].action += endSymbol + "ldtag_cl=" + encodeURIComponent(CATS_GetQueryParam('ldtag_cl'));
                endSymbol = '&';
            }

            // Yahooディスプレイ広告コンバージョンAPIのユーザー識別パラメータ引き継ぎ
            if (CATS_GetQueryParam('yj_r') !== null) {
                formTag[i].search += endSymbol + "yj_r=" + encodeURIComponent(CATS_GetQueryParam('yj_r'));
                endSymbol = '&';
            }

            // Google広告クリックコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('gbraid') !== null) {
                formTag[i].search += endSymbol + "gbraid=" + encodeURIComponent(CATS_GetQueryParam('gbraid'));
                endSymbol = '&';
            }
            if (CATS_GetQueryParam('wbraid') !== null) {
                formTag[i].search += endSymbol + "wbraid=" + encodeURIComponent(CATS_GetQueryParam('wbraid'));
                endSymbol = '&';
            }

            // XAdsコンバージョンAPIのクリックID引き継ぎ
            if (CATS_GetQueryParam('twclid') !== null) {
                formTag[i].search += endSymbol + "twclid=" + encodeURIComponent(CATS_GetQueryParam('twclid'));
                endSymbol = '&';
            }
        }

        /** @type HTMLAnchorElement[] */
        const aTargets = [];
        for (const elem of aTag[Symbol.iterator]()) {
            if (elem.hash != '' || !elem.href.match(/https?/) || elem.href.match(/#$/)) {
                continue;
            }
            aTargets.push(elem);
        }
        /** @type HTMLFormElement[] */
        const formTargets = [];
        for (const elem of formTag[Symbol.iterator]()) {
            if (!elem.action.match(/https?/) || elem.action.match(/#$/)) {
                continue;
            }
            formTargets.push(elem);
        }
        const setParam = (key) => {
            const val = (new URLSearchParams(location.search)).get(key);
            if (!val) { return; }
            for (const elem of aTargets) {
                const params = new URLSearchParams(elem.search);
                params.set(key, val);
                elem.search = params.toString();
            }
            for (const elem of formTargets) {
                const url = new URL(elem.action);
                url.searchParams.set(key, val);
                elem.action = url.toString();
            }
        };
        // LINEヤフー
        setParam('_ly_c');
        // ChatGPT広告
        // olref は CAPI 送信には使わないが、調査に必要になった時のために引き継いでおく
        setParam('oppref');
        setParam('olref');
    } catch (errorMsg) {
    }
}

/**
 * LINE友だち登録ログインリンク作成JavaScript
 * @param cid  広告ID
 * @param gid  広告グループID
 * @param uqid ユニークID
 * @param CATS_domain ドメイン
 * @param apiid LINE友だち登録APIID
 * @param apiDomain LINE友だち登録APIドメイン
 * @param crmParams LINE CRMツールのオプションパラメーター

 */
function CATS_LineFriendsFollow(
    cid,
    gid,
    uqid,
    CATS_domain,
    apiid,
    apiDomain,
    crmParams,
    tagName,
    liffId,
    userAgent
) {
    var postData = { 'cid': cid, 'gid': gid, 'uqid': uqid, 'lineFriendsApiId': apiid };
    var CATS_cookie = CATS_GetCookie();
    var CATS_localStorage = CATS_GetLocalStorage();

    if (apiid instanceof Object) {
        function getOriginalParameterNameAsync(postData, CATS_domain, j) {
            return new Promise((resolve, reject) => {
                CATS_GetLineOriginalParameterName(postData, CATS_domain, function (param) {
                    resolve(param);
                });
            });
        }

        function processKey(key) {
            const postData = { 'cid': cid, 'gid': gid, 'uqid': uqid, 'lineFriendsApiId': apiid[key] };
            getOriginalParameterNameAsync(postData, CATS_domain, key).then((param) => {
                postData['uqid'] = uqid;
                postData['sourceUrl'] = location.href;
                postData['lineFriendsFollowLoginAuthUrl'] = param['lineFriendsFollowLoginAuthUrl'];
                postData['lineFriendsChannelId'] = param['lineFriendsChannelId'];
                postData['lineFriendsFollowApiUseId'] = apiid[key];
                postData['lineFriendsFollowApiLoginCallbackUrlDomain'] = apiDomain;
                CATS_GetLineCookieSessionId(uqid, cid, gid, CATS_domain, function (sessionIdForTag, trackingUserIdForTag) {
                    // sessionIdが取得できなかった場合は1stパーティクッキー、ローカルストレージから取得する
                    if (sessionIdForTag == null) {
                        if (cid) {
                            if (CATS_cookie.hasItem('C_Aff_Val_' + uqid + '_' + cid)) {
                                sessionIdForTag = CATS_cookie.getItem('C_Aff_Val_' + uqid + '_' + cid);
                            } else if (CATS_cookie.hasItem('C_Aff_Val_' + cid)) {
                                sessionIdForTag = CATS_cookie.getItem('C_Aff_Val_' + cid);
                            } else if (CATS_localStorage.hasItem('C_Aff_Val_' + uqid + '_' + cid)) {
                                sessionIdForTag = CATS_localStorage.getItem('C_Aff_Val_' + uqid + '_' + cid);
                            }
                        } else if (gid) {
                            if (CATS_cookie.hasItem('G_Aff_Val_' + uqid + '_' + gid)) {
                                sessionIdForTag = CATS_cookie.getItem('G_Aff_Val_' + uqid + '_' + gid);
                            } else if (CATS_cookie.hasItem('G_Aff_Val_' + gid)) {
                                sessionIdForTag = CATS_cookie.getItem('G_Aff_Val_' + gid);
                            } else if (CATS_localStorage.hasItem('G_Aff_Val_' + uqid + '_' + gid)) {
                                sessionIdForTag = CATS_localStorage.getItem('G_Aff_Val_' + uqid + '_' + gid);
                            }
                        }
                    }
                    // trackingUserIdが取得できなかった場合は1stパーティクッキー、ローカルストレージから取得する
                    if (trackingUserIdForTag == null) {
                        if (cid) {
                            if (CATS_cookie.hasItem('CATS_M_U_C_' + uqid + '_' + cid)) {
                                trackingUserIdForTag = CATS_cookie.getItem('CATS_M_U_C_' + uqid + '_' + cid);
                            } else if (CATS_cookie.hasItem('M_U_C_Aff_Val_' + cid)) {
                                trackingUserIdForTag = CATS_cookie.getItem('M_U_C_Aff_Val_' + cid);
                            } else if (CATS_localStorage.hasItem('CATS_M_U_C_' + uqid + '_' + cid)) {
                                trackingUserIdForTag = CATS_localStorage.getItem('CATS_M_U_C_' + uqid + '_' + cid);
                            }
                        } else if (gid) {
                            if (CATS_cookie.hasItem('CATS_M_U_G_' + uqid + '_' + gid)) {
                                trackingUserIdForTag = CATS_cookie.getItem('CATS_M_U_G_' + uqid + '_' + gid);
                            } else if (CATS_cookie.hasItem('M_U_G_Aff_Val_' + gid)) {
                                trackingUserIdForTag = CATS_cookie.getItem('M_U_G_Aff_Val_' + gid);
                            } else if (CATS_localStorage.hasItem('CATS_M_U_G_' + uqid + '_' + gid)) {
                                trackingUserIdForTag = CATS_localStorage.getItem('CATS_M_U_G_' + uqid + '_' + gid);
                            }
                        }
                    }
                    CATS_ChangeLinkLineFriendsUrl(postData, sessionIdForTag, trackingUserIdForTag, crmParams, tagName[key], liffId[key], userAgent);
                });
            });
        }

        for (var key in apiid) {
            processKey(key);
        }
    } else {
        CATS_GetLineOriginalParameterName(postData, CATS_domain, function (param) {
            postData['uqid'] = uqid;
            postData['sourceUrl'] = location.href;
            postData['lineFriendsFollowLoginAuthUrl'] = param['lineFriendsFollowLoginAuthUrl'];
            postData['lineFriendsChannelId'] = param['lineFriendsChannelId'];
            postData['lineFriendsFollowApiUseId'] = apiid;
            postData['lineFriendsFollowApiLoginCallbackUrlDomain'] = apiDomain;
            if (apiid) {
                CATS_GetLineCookieSessionId(uqid, cid, gid, CATS_domain, function (sessionIdForTag, trackingUserIdForTag) {
                    // sessionIdが取得できなかった場合は1stパーティクッキー、ローカルストレージから取得する
                    if (sessionIdForTag == null) {
                        if (cid) {
                            if (CATS_cookie.hasItem('C_Aff_Val_' + uqid + '_' + cid)) {
                                sessionIdForTag = CATS_cookie.getItem('C_Aff_Val_' + uqid + '_' + cid);
                            } else if (CATS_cookie.hasItem('C_Aff_Val_' + cid)) {
                                sessionIdForTag = CATS_cookie.getItem('C_Aff_Val_' + cid);
                            } else if (CATS_localStorage.hasItem('C_Aff_Val_' + uqid + '_' + cid)) {
                                sessionIdForTag = CATS_localStorage.getItem('C_Aff_Val_' + uqid + '_' + cid);
                            }
                        } else if (gid) {
                            if (CATS_cookie.hasItem('G_Aff_Val_' + uqid + '_' + gid)) {
                                sessionIdForTag = CATS_cookie.getItem('G_Aff_Val_' + uqid + '_' + gid);
                            } else if (CATS_cookie.hasItem('G_Aff_Val_' + gid)) {
                                sessionIdForTag = CATS_cookie.getItem('G_Aff_Val_' + gid);
                            } else if (CATS_localStorage.hasItem('G_Aff_Val_' + uqid + '_' + gid)) {
                                sessionIdForTag = CATS_localStorage.getItem('G_Aff_Val_' + uqid + '_' + gid);
                            }
                        }
                    }

                    // trackingUserIdが取得できなかった場合は1stパーティクッキー、ローカルストレージから取得する
                    if (trackingUserIdForTag == null) {
                        if (cid) {
                            if (CATS_cookie.hasItem('CATS_M_U_C_' + uqid + '_' + cid)) {
                                trackingUserIdForTag = CATS_cookie.getItem('CATS_M_U_C_' + uqid + '_' + cid);
                            } else if (CATS_cookie.hasItem('M_U_C_Aff_Val_' + cid)) {
                                trackingUserIdForTag = CATS_cookie.getItem('M_U_C_Aff_Val_' + cid);
                            } else if (CATS_localStorage.hasItem('CATS_M_U_C_' + uqid + '_' + cid)) {
                                trackingUserIdForTag = CATS_localStorage.getItem('CATS_M_U_C_' + uqid + '_' + cid);
                            }
                        } else if (gid) {
                            if (CATS_cookie.hasItem('CATS_M_U_G_' + uqid + '_' + gid)) {
                                trackingUserIdForTag = CATS_cookie.getItem('CATS_M_U_G_' + uqid + '_' + gid);
                            } else if (CATS_cookie.hasItem('M_U_G_Aff_Val_' + gid)) {
                                trackingUserIdForTag = CATS_cookie.getItem('M_U_G_Aff_Val_' + gid);
                            } else if (CATS_localStorage.hasItem('CATS_M_U_G_' + uqid + '_' + gid)) {
                                trackingUserIdForTag = CATS_localStorage.getItem('CATS_M_U_G_' + uqid + '_' + gid);
                            }
                        }
                    }

                    CATS_ChangeLinkLineFriendsUrl(postData, sessionIdForTag, trackingUserIdForTag, crmParams, tagName, liffId, userAgent);
                });
            }
        });
    }

}

/**
 * LINEのAタグのリンクを変更する
 * @param {object} postData クエリ文字列にパラメータの連想配列
 * @param {string} sid セッションID
 * @param {string} trackingUserId
 * @param {string} crmParams LINE CRMツールのオプションパラメーター
 * @param {string|object} tagName URLを書き換えるタグ名
 * @param {string|object} liffId 使用するLIFFID
 * @param {string} userAgent ユーザーのOS
 */
function CATS_ChangeLinkLineFriendsUrl(
    postData,
    sid,
    trackingUserId,
    crmParams,
    tagName,
    liffId,
    userAgent
) {
    if (!sid) return;
    if (postData['lineFriendsFollowApiUseId'] && postData['lineFriendsFollowApiLoginCallbackUrlDomain']) {
        const redirectUri = encodeURIComponent('https://'
            + postData['lineFriendsFollowApiLoginCallbackUrlDomain']
            + '/line/loginCallback.php?apiId=' + postData['lineFriendsFollowApiUseId']
            + '&trackingUserId=' + trackingUserId
            + '&sid=' + sid
            + '&uqid=' + postData['uqid']
            + '&currentUrl=' + encodeURIComponent(location.href));
        let lineFriendsFollowLoginAuthUrl = postData['lineFriendsFollowLoginAuthUrl']
            + '&state=' + sid
            + '&client_id=' + postData['lineFriendsChannelId']
            + '&redirect_uri=' + redirectUri;
        let androidParametor = '';
        let changeUrl = false; // 旧ログインかを判定するフラグ

        if (liffId != '') {
            if (/iPhone|iPad|iPod/i.test(userAgent)) {
                lineFriendsFollowLoginAuthUrl = 'line://app/' + liffId
                    + '?apiId=' + postData['lineFriendsFollowApiUseId']
                    + '&catsDomain=' + postData['lineFriendsFollowApiLoginCallbackUrlDomain']
                    + '&trackingUserId=' + trackingUserId
                    + '&sid=' + sid
                    + '&uqid=' + postData['uqid']
                    + '&liff_id=' + liffId
                    + '&currentUrl=' + encodeURIComponent(location.href);
                changeUrl = true;
            } else if (/Android/i.test(userAgent)) {
                lineFriendsFollowLoginAuthUrl = 'intent://liff.line.me/' + liffId
                    + '?apiId=' + postData['lineFriendsFollowApiUseId']
                    + '&catsDomain=' + postData['lineFriendsFollowApiLoginCallbackUrlDomain']
                    + '&trackingUserId=' + trackingUserId
                    + '&sid=' + sid
                    + '&uqid=' + postData['uqid']
                    + '&liff_id=' + liffId
                    + '&currentUrl=' + encodeURIComponent(location.href);
                androidParametor = '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=jp.naver.line.android;end';
                changeUrl = true;
            } else {
                let catsQrUrl = 'https://line.me/R/app/' + liffId
                    + '?apiId=' + postData['lineFriendsFollowApiUseId']
                    + '&catsDomain=' + postData['lineFriendsFollowApiLoginCallbackUrlDomain']
                    + '&trackingUserId=' + trackingUserId
                    + '&sid=' + sid
                    + '&uqid=' + postData['uqid']
                    + '&liff_id=' + liffId;

                lineFriendsFollowLoginAuthUrl = 'https://' + postData['lineFriendsFollowApiLoginCallbackUrlDomain'] + '/ck/qr.html'
                    + '?catsQrUrl=' + encodeURIComponent(catsQrUrl)
                    + '&currentUrl=' + encodeURIComponent(location.href);

                changeUrl = true;
            }
        }
        const elems = document.querySelectorAll('[data-cats=\"' + tagName + '\"]');
        elems.forEach((elem) => {
            let lineLoginUrl = new URL(elem.getAttribute('href'));
            let lineLoginUrlParams = lineLoginUrl.searchParams;
            const currentUrl = new URL(location.href);
            const currentUrlParams = currentUrl.searchParams;

            for (const param in crmParams) {
                if (lineLoginUrlParams.has(param)) {
                    if (currentUrlParams.has(param)) {
                        const paramValue = currentUrlParams.get(param);
                        lineLoginUrlParams.set(param, paramValue);
                    } else if (crmParams[param]) {
                        lineLoginUrlParams.set(param, crmParams[param]);
                    }
                }
            }
            lineLoginUrl.search = lineLoginUrlParams.toString();
            lineLoginUrl = lineLoginUrl.toString();

            // `?` の有無をチェックして適切に `&` を付与
            lineLoginUrl += (lineLoginUrl.includes('?') ? '&' : '?') + 'ladsid=' + encodeURIComponent(sid);

            // URLの書き換え
            let reWriteLineFriendsFollowLoginAuthUrl = "";
            if (changeUrl) {
                reWriteLineFriendsFollowLoginAuthUrl = lineFriendsFollowLoginAuthUrl + '&loginUrl=' + encodeURIComponent(lineLoginUrl) + androidParametor;
            } else {
                reWriteLineFriendsFollowLoginAuthUrl = lineFriendsFollowLoginAuthUrl + encodeURIComponent('&loginUrl=' + encodeURIComponent(lineLoginUrl));
            }

            // PC版でQRコードの場合、すでに同じドメインのQRコードのURLに書き換えられている場合は書き換えない
            const currentHref = elem.getAttribute('href');
            const isQrCodeUrl = currentHref.includes(postData['lineFriendsFollowApiLoginCallbackUrlDomain'] + '/ck/qr.html');

            if (!isQrCodeUrl) {
                elem.setAttribute('href', reWriteLineFriendsFollowLoginAuthUrl);
            }

            // メタタグの作成
            CATS_CreateLineFriendsMetaTag(reWriteLineFriendsFollowLoginAuthUrl);
        });
    }
}

/**
 * オプションパラメータの独自パラメータ名取得処理
 *
 * @param postData パラメータ {cid, uqid}または{gid,uqid}
 * @param cats_domain CATSドメイン
 * @param callback パラメータ取得完了後のコールバック関数
 */
function CATS_GetLineOriginalParameterName(postData, cats_domain, callback) {
    // 独自パラメータ取得
    var xhr = new XMLHttpRequest();

    xhr.onload = function (e) {
        // 読み込みが完了したときの処理
        var result = JSON.parse(xhr.responseText);
        if (result.actionResult == false) {
            return;
        }
        // 正常処理出来た場合のみコールバックを実行
        callback(result.param);
    };

    xhr.onerror = function (event) {
    };

    // 送信要データを加工
    var queryString = CATS_CreateQueryString(postData);

    // 成果判定プログラムに非同期通信を実行する
    xhr.open('POST', cats_domain + '/ac/getParamName.php', true);
    xhr.withCredentials = true;
    // POST 送信の場合は Content-Type は固定.
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    // パラメータを付与して実行
    xhr.send(queryString);
}

/**
 * cid、gidを基に、ドメインに登録されているsessionIDを取得する
 *
 * @param {string} uqid  ユニークID
 * @param {string} cid   広告ID
 * @param {string} gid   広告グループID
 * @param {string} cats_domain CATSドメイン
 * @param {function(string|null, string|null)} callback
 */
function CATS_GetLineCookieSessionId(uqid, cid, gid, cats_domain, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', cats_domain + '/ac/getLineFriendsFollowSid.php', true);
    xhr.withCredentials = true;
    xhr.onload = function () {
        const res = JSON.parse(xhr.responseText);
        callback(res.sessionId, res.trackingUserId);
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(CATS_CreateQueryString({
        'uqid': uqid,
        'cid': cid,
        'gid': gid,
    }));
}

/**
 * クエリパラメータを生成
 * @param array postData クエリ文字列にパラメータの連想配列
 * @return クエリパラメータ文字列 (ex. key=val&key=val....)
 */
function CATS_CreateQueryString(postData) {
    var queryString = [];
    Object.keys(postData).forEach(function (key) {
        if (postData[key] != '') {
            queryString.push(key + '=' + postData[key]);
        }
    });
    return queryString.join('&');
}

/**
 * LINE友だち登録 チャットボット用のメタタグの作成
 * @param string url LPに設定したURL
 */
function CATS_CreateLineFriendsMetaTag(url) {
    var metaTag = document.createElement('meta');
    metaTag.setAttribute('name', LINE_DATA_CATS_META_TAG_DEFAULT_NAME);
    metaTag.setAttribute('content', url);
    document.head.appendChild(metaTag);
}

/**
 * LINE友だち登録のログインリンク作成
 *
 * @param {object} catsOption                   オプションパラメータ
 * @param {string} CATS_cid                     広告ID
 * @param {string} CATS_gid                     広告グループID
 * @param {string} uqId                         ユニークID
 * @param {string} CATS_domain                  ドメイン
 * @param {string} LINE_DATA_CATS_DEFAULT_NAME  LINE友だち登録のデフォルトタグ名
 *
 * @return void
 *
 */
function CATS_HandleLineFriendsFollow(catsOption, CATS_cid, CATS_gid, uqId, CATS_domain, LINE_DATA_CATS_DEFAULT_NAME) {
    var lineFriendsOptions = catsOption.hasOwnProperty('lineFriendsFollow') ? catsOption.lineFriendsFollow : '';
    if (lineFriendsOptions) {
        var userAgent = navigator.userAgent;
        var lineFriendsFollowApiUseId = lineFriendsOptions.hasOwnProperty('useId') ? lineFriendsOptions.useId : '';
        var lineFriendsFollowApiLoginCallbackUrlDomain = lineFriendsOptions.hasOwnProperty('loginCallbackUrlDomain') ? lineFriendsOptions.loginCallbackUrlDomain : '';
        var lineFriendsFollowApiLineCrm = lineFriendsOptions.hasOwnProperty('line_crm') ? lineFriendsOptions.line_crm : '';
        var lineFriendsFollowApiLineTagName = lineFriendsOptions.hasOwnProperty('tag_name') ? lineFriendsOptions.tag_name : LINE_DATA_CATS_DEFAULT_NAME;
        var liffId = lineFriendsOptions.hasOwnProperty('liffId') ? lineFriendsOptions.liffId : '';
        CATS_LineFriendsFollow(
            CATS_cid,
            CATS_gid,
            uqId,
            CATS_domain,
            lineFriendsFollowApiUseId,
            lineFriendsFollowApiLoginCallbackUrlDomain,
            lineFriendsFollowApiLineCrm,
            lineFriendsFollowApiLineTagName,
            liffId,
            userAgent
        );
    }
}

// DMP_CLICK_EVENTS_S
"use strict";var CATS_dmp_click_events=(function(){var u=Object.defineProperty;var A=Object.getOwnPropertyDescriptor;var P=Object.getOwnPropertyNames;var T=Object.prototype.hasOwnProperty;var f=function(n,i){for(var r in i)u(n,r,{get:i[r],enumerable:!0})},l=function(n,i,r,d){if(i&&typeof i=="object"||typeof i=="function")for(var o=P(i),t=0,w=o.length,e;t<w;t++)e=o[t],!T.call(n,e)&&e!==r&&u(n,e,{get:function(C){return i[C]}.bind(null,e),enumerable:!(d=A(i,e))||d.enumerable});return n};var D=function(n){return l(u({},"__esModule",{value:!0}),n)};var p={};f(p,{CATS_SendDMPClickEvent:function(){return s}});var v="click";var c="cid",_="gid";function a(n){if(!(n===null||n==="")){var i=Number(n);return Number.isNaN(i)?void 0:i}}function M(){var n,i=new URLSearchParams(location.search).get(c),r=a(i);return r!==void 0?r:a((n=window.CATS_DMP)===null||n===void 0||(n=n.config)===null||n===void 0?void 0:n.cid)}function S(){var n,i=new URLSearchParams(location.search).get(_),r=a(i);return r!==void 0?r:a((n=window.CATS_DMP)===null||n===void 0||(n=n.config)===null||n===void 0?void 0:n.gid)}function s(n,i){var r=M(),d=S();window.CATS_DMP=window.CATS_DMP||{},window.CATS_DMP.events=window.CATS_DMP.events||[];var o={type:v,clickRawInfo:n,uqid:i,cid:r,gid:d};window.CATS_DMP.events.push(o)}return D(p);})();
var CATS_SendDMPClickEvent=CATS_dmp_click_events.CATS_SendDMPClickEvent;
// DMP_CLICK_EVENTS_E
