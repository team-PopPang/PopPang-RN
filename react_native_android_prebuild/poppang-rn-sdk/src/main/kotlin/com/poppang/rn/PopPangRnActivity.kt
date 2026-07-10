package com.poppang.rn

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactHost

// 클라이언트 앱이 실행할 PopPang RN 전용 화면이다.
class PopPangRnActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // ReactActivity가 New Architecture feature flag를 읽기 전에 SoLoader를 준비한다.
        PopPangReactRuntime.initialize(applicationContext)
        super.onCreate(savedInstanceState)
    }

    override fun getMainComponentName(): String = MODULE_NAME

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return object : ReactActivityDelegate(this, MODULE_NAME) {
            override fun getReactHost(): ReactHost {
                return PopPangReactRuntime.getReactHost(
                    this@PopPangRnActivity.applicationContext
                )
            }

            override fun getLaunchOptions(): Bundle? {
                val feature = intent?.getStringExtra(PopPangRnSdk.EXTRA_FEATURE) ?: return null
                return Bundle().apply {
                    putString("feature", feature)
                }
            }
        }
    }

    private companion object {
        const val MODULE_NAME = "PopPangRNRoot"
    }
}
