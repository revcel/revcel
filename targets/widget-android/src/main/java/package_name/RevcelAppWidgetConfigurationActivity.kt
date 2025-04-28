package com.revcel.mobile

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.glance.appwidget.GlanceAppWidgetManager

class RevcelAppWidgetConfigurationActivity: AppCompatActivity() {
    override fun onCreate(savedConnectionState: Bundle?) {
        super.onCreate(savedConnectionState)

        setResult(RESULT_CANCELED)

        val appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()

            return
        }

        setContent {
            LaunchedEffect(Unit) {
                // todo
            }

            setupUI(appWidgetId)
        }
    }

    @Composable
    private fun setupUI(
        appWidgetId: Int,
    ) {
        RevcelMaterialTheme {
            ContainerWidgetConfigurationView(
                enabled = true,
                onDone = {
                    val glanceId = GlanceAppWidgetManager(applicationContext).getGlanceIdBy(appWidgetId)

                    // call receiver
                    // ContainerWidgetReceiver().onContainerSelected(applicationContext, glanceId, selectedContainer)

                    val resultValue = Intent().apply {
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                    }

                    setResult(RESULT_OK, resultValue)
                    finish()
                }
            )
        }
    }
}

