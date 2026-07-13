package com.poppang.rn

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

internal class PopPangHostActionModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = NAME

    @ReactMethod
    fun emit(eventName: String) {
        if (eventName != PopPangRnSdk.NativeEvent.POPUP_REQUEST_SUBMITTED) return

        val activity = reactApplicationContext.currentActivity ?: return
        activity.runOnUiThread {
            (activity as? PopPangRnActivity)?.completeWithEvent(eventName)
        }
    }

    internal companion object {
        const val NAME = "PopPangHostAction"
    }
}
