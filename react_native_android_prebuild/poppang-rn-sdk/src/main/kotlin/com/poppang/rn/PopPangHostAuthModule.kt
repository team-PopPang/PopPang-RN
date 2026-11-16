package com.poppang.rn

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** V2 API 인증 토큰을 호스트 앱에서 받아 React Native에 넘긴다. 토큰 저장과 갱신은 호스트 앱이 맡는다. */
internal class PopPangHostAuthModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = NAME

    @ReactMethod
    fun getAccessToken(forceRefresh: Boolean, promise: Promise) {
        val provider = PopPangRnSdk.accessTokenProvider
        if (provider == null) {
            promise.reject("no_provider", "호스트 앱이 Access Token 제공자를 설정하지 않았습니다.")
            return
        }

        provider.getAccessToken(forceRefresh) { accessToken ->
            if (accessToken.isNullOrEmpty()) {
                promise.reject("login_required", "로그인 정보가 없습니다. 다시 로그인해 주세요.")
            } else {
                promise.resolve(accessToken)
            }
        }
    }

    internal companion object {
        const val NAME = "PopPangHostAuth"
    }
}
