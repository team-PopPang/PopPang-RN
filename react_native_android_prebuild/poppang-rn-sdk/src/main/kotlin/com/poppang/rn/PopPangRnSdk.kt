package com.poppang.rn

import android.content.Context
import android.content.Intent
import java.util.ArrayList

object PopPangRnSdk {
    object Feature {
        const val ADMIN = "admin"
        const val ROOT = "root"
    }

    object NativeEvent {
        const val POPUP_REQUEST_BACK = "popupRequestBack"
        const val POPUP_REQUEST_MANAGEMENT_BACK = "popupRequestManagementBack"
        const val POPUP_REQUEST_SUBMITTED = "popupRequestSubmitted"
    }

    const val EXTRA_EVENT = "com.poppang.rn.extra.EVENT"
    internal const val EXTRA_FEATURE = "com.poppang.rn.extra.FEATURE"
    internal const val EXTRA_NATIVE_EVENTS = "com.poppang.rn.extra.NATIVE_EVENTS"
    internal const val EXTRA_USER_UUID = "com.poppang.rn.extra.USER_UUID"

    /** 호스트 앱이 Access Token 요청에 답하는 결과. */
    sealed interface AccessTokenResult {
        data class Token(val accessToken: String) : AccessTokenResult

        /** 다시 로그인해야 한다. 호스트 앱은 자기 로그아웃 처리도 함께 한다. */
        data object LoginRequired : AccessTokenResult

        /** 네트워크·서버 문제로 지금은 토큰을 주지 못했다. 로그인 정보는 그대로다. */
        data object TemporaryFailure : AccessTokenResult
    }

    /**
     * V2 API 인증 토큰을 돌려주는 호스트 앱 구현.
     *
     * RN은 요청할 때마다 `rejectedAccessToken = null`로 토큰을 받는다.
     * 서버가 401을 주면 그 요청에 담았던 토큰을 `rejectedAccessToken`으로, 서버 코드가 5002(만료)인지를 `expired`로 넘겨 한 번 더 받는다.
     * `expired`면 그 토큰을 만료된 토큰으로 보고 갱신한다(이미 다른 요청이 갱신했으면 새 토큰을 돌려준다).
     * 아니면 그 토큰이 아직 저장돼 있을 때 로그아웃하고, 그사이 바뀌었으면 새 토큰을 돌려준다.
     */
    fun interface AccessTokenProvider {
        fun getAccessToken(
            rejectedAccessToken: String?,
            expired: Boolean,
            completion: (AccessTokenResult) -> Unit,
        )
    }

    @Volatile
    @JvmStatic
    var accessTokenProvider: AccessTokenProvider? = null

    @JvmStatic
    val version: String
        get() = BuildConfig.POPPANG_RN_VERSION

    @JvmStatic
    fun createIntent(context: Context): Intent {
        return createIntent(context, null)
    }

    @JvmStatic
    fun createIntent(context: Context, feature: String?): Intent {
        return createIntent(context, feature, null)
    }

    @JvmStatic
    fun createIntent(context: Context, feature: String?, userUuid: String?): Intent {
        return createIntent(context, feature, userUuid, emptySet())
    }

    @JvmStatic
    fun createIntent(
        context: Context,
        feature: String?,
        userUuid: String?,
        nativeEvents: Set<String>,
    ): Intent {
        return Intent(context, PopPangRnActivity::class.java).apply {
            if (feature != null) {
                putExtra(EXTRA_FEATURE, feature)
            }

            if (userUuid != null) {
                putExtra(EXTRA_USER_UUID, userUuid)
            }

            if (nativeEvents.isNotEmpty()) {
                putStringArrayListExtra(EXTRA_NATIVE_EVENTS, ArrayList(nativeEvents))
            }
        }
    }
}
