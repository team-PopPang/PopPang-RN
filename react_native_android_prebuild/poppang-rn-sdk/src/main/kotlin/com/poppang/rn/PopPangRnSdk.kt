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

    /**
     * V2 API 인증 토큰을 돌려주는 호스트 앱 구현.
     * RN은 요청할 때마다 토큰을 받고, 서버가 401을 주면 `forceRefresh = true`로 다시 받는다.
     */
    fun interface AccessTokenProvider {
        fun getAccessToken(forceRefresh: Boolean, completion: (String?) -> Unit)
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
