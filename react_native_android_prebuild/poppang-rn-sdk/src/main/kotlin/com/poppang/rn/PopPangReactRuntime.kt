package com.poppang.rn

import android.app.Application
import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import java.io.IOException

// SDK가 사용하는 React Native 런타임을 앱 프로세스에서 한 번만 생성한다.
internal object PopPangReactRuntime {
    private const val BUNDLE_ASSET_PATH = "index.android.bundle"

    private var reactHost: ReactHost? = null
    private var initialized = false

    @Synchronized
    fun initialize(context: Context) {
        if (initialized) return

        val appContext = context.applicationContext

        try {
            SoLoader.init(appContext, OpenSourceMergedSoMapping)
        } catch (error: IOException) {
            throw IllegalStateException("React Native 네이티브 라이브러리를 초기화하지 못했습니다.", error)
        }

        // RN 0.86의 New Architecture와 Bridgeless 런타임을 활성화한다.
        DefaultNewArchitectureEntryPoint.load()
        initialized = true
    }

    @Synchronized
    fun getReactHost(context: Context): ReactHost {
        reactHost?.let { return it }

        val appContext = context.applicationContext
        initialize(appContext)

        val application = appContext as? Application
            ?: throw IllegalStateException("Application context를 찾을 수 없습니다.")

        return DefaultReactHost.getDefaultReactHost(
            context = appContext,
            packageList = PopPangPackageList(application).packages.apply {
                add(PopPangHostActionPackage())
            },
            jsBundleAssetPath = BUNDLE_ASSET_PATH,
            useDevSupport = false,
        ).also { reactHost = it }
    }
}
