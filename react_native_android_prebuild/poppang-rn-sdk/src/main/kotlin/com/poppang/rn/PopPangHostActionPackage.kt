package com.poppang.rn

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

internal class PopPangHostActionPackage : BaseReactPackage() {
    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext,
    ): NativeModule? {
        if (name != PopPangHostActionModule.NAME) return null

        return PopPangHostActionModule(reactContext)
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
        ReactModuleInfoProvider {
            mapOf(
                PopPangHostActionModule.NAME to ReactModuleInfo(
                    PopPangHostActionModule.NAME,
                    PopPangHostActionModule.NAME,
                    false,
                    false,
                    false,
                    false,
                ),
            )
        }
}
