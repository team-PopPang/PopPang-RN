package com.poppang.rn

import android.content.Context
import android.content.Intent

object PopPangRnSdk {
    @JvmStatic
    val version: String
        get() = BuildConfig.POPPANG_RN_VERSION

    @JvmStatic
    fun createIntent(context: Context): Intent {
        return Intent(context, PopPangRnActivity::class.java)
    }
}
