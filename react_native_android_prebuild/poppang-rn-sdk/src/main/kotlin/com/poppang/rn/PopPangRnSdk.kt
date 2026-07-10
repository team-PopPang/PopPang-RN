package com.poppang.rn

import android.content.Context
import android.content.Intent

object PopPangRnSdk {
    object Feature {
        const val ADMIN = "admin"
        const val ROOT = "root"
    }

    internal const val EXTRA_FEATURE = "com.poppang.rn.extra.FEATURE"

    @JvmStatic
    val version: String
        get() = BuildConfig.POPPANG_RN_VERSION

    @JvmStatic
    fun createIntent(context: Context): Intent {
        return createIntent(context, null)
    }

    @JvmStatic
    fun createIntent(context: Context, feature: String?): Intent {
        return Intent(context, PopPangRnActivity::class.java).apply {
            if (feature != null) {
                putExtra(EXTRA_FEATURE, feature)
            }
        }
    }
}
