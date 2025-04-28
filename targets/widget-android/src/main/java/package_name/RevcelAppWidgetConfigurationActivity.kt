package com.revcel.mobile

import ProjectListItem
import appGroupName
import connectionsKey
import WidgetIntentState
import com.google.gson.Gson
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.core.content.edit
import androidx.glance.appwidget.GlanceAppWidgetManager
import expo.modules.widgetkit.Connection
import savedWidgetStateKey

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

        val prefs = getSharedPreferences(appGroupName, Context.MODE_PRIVATE)
        val rawInstances = prefs.getString(connectionsKey, "[]")
        val instances = Gson().fromJson(rawInstances, Array<Connection>::class.java) ?: emptyArray()

        setWidgetState(WidgetIntentState.LOADING)

        setContent {
            var widgetState = remember { mutableStateOf(WidgetIntentState.LOADING) }
            val options = remember { mutableStateListOf<ProjectListItem>() }
            var selectedContainer by remember { mutableStateOf<ProjectListItem?>(null) }

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
            ProjectWidgetConfigurationView(
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

    private fun setWidgetState(state: WidgetIntentState) {
        val prefs = getSharedPreferences(appGroupName, Context.MODE_PRIVATE)

        prefs.edit {
            putInt(savedWidgetStateKey, state.value)
            apply()
        }
    }
}
