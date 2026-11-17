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

    /**
     * @param rejectedAccessToken null이면 지금 쓸 토큰을 요청한다. 값이 있으면 그 토큰으로 보낸 요청이 401을 받았다.
     * @param expired 401의 서버 코드가 5002(Access Token 만료)면 true.
     */
    @ReactMethod
    fun getAccessToken(rejectedAccessToken: String?, expired: Boolean, promise: Promise) {
        val provider = PopPangRnSdk.accessTokenProvider
        if (provider == null) {
            promise.reject("no_provider", "호스트 앱이 Access Token 제공자를 설정하지 않았습니다.")
            return
        }

        provider.getAccessToken(rejectedAccessToken?.takeIf { it.isNotEmpty() }, expired) { result ->
            when (result) {
                is PopPangRnSdk.AccessTokenResult.Token ->
                    if (result.accessToken.isEmpty()) {
                        promise.reject("login_required", LOGIN_REQUIRED_MESSAGE)
                    } else {
                        promise.resolve(result.accessToken)
                    }
                PopPangRnSdk.AccessTokenResult.LoginRequired ->
                    promise.reject("login_required", LOGIN_REQUIRED_MESSAGE)
                PopPangRnSdk.AccessTokenResult.TemporaryFailure ->
                    promise.reject("temporary_failure", "로그인 정보를 잠시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.")
            }
        }
    }

    internal companion object {
        const val NAME = "PopPangHostAuth"
        private const val LOGIN_REQUIRED_MESSAGE = "로그인 정보가 만료되었습니다. 다시 로그인해 주세요."
    }
}
