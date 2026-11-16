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
        return when (name) {
            PopPangHostActionModule.NAME -> PopPangHostActionModule(reactContext)
            PopPangHostAuthModule.NAME -> PopPangHostAuthModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
        ReactModuleInfoProvider {
            listOf(PopPangHostActionModule.NAME, PopPangHostAuthModule.NAME).associateWith { name ->
                ReactModuleInfo(
                    name,
                    name,
                    false,
                    false,
                    false,
                    false,
                )
            }
        }
}
