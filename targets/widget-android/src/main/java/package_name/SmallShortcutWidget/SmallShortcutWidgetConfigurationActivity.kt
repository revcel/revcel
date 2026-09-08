package com.revcel.mobile

import ProjectListItem
import appGroupName
import connectionsKey
import WidgetIntentState
import com.google.gson.Gson
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.getValue
import android.os.Bundle
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import expo.modules.widgetkit.Connection
import isSubscribedKey

class SmallShortcutWidgetConfigurationActivity: AppCompatActivity() {
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
        val rawConnections = prefs.getString(connectionsKey, "[]")
        val connections = Gson().fromJson(rawConnections, Array<Connection>::class.java) ?: emptyArray()

        setContent {
            var widgetState = remember { mutableStateOf(WidgetIntentState.LOADING) }
            val options = remember { mutableStateListOf<ProjectListItem>() }
            var selectedProject by remember { mutableStateOf<ProjectListItem?>(null) }

            LaunchedEffect(Unit) {
                val (loaded, state) = loadProjectOptions(connections.toList())
                options.clear()
                options.addAll(loaded)
                widgetState.value = state
            }

            setupUI(
                connections.isNotEmpty(),
                widgetState.value,
                selectedProject,
                options,
                appWidgetId,
                { project ->
                    selectedProject = project
                }
            )
        }
    }

    @Composable
    private fun setupUI(
        isAuthorized: Boolean,
        state: WidgetIntentState,
        selectedProject: ProjectListItem?,
        projects: List<ProjectListItem>,
        appWidgetId: Int,
        onProjectSelected: (selectedProject: ProjectListItem?) -> Unit
    ) {
        RevcelMaterialTheme {
            ProjectWidgetConfigurationView(
                isAuthorized,
                state,
                selectedProject,
                projects,
                onProjectSelected,
                onDone = {
                    val prefs = getSharedPreferences(appGroupName, Context.MODE_PRIVATE)
                    val isSubscribed = prefs.getBoolean(isSubscribedKey, false)

                    SmallShortcutWidgetReceiver().onProjectSelected(applicationContext, appWidgetId, selectedProject, isSubscribed)

                    val resultValue = Intent().apply {
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                    }

                    setResult(RESULT_OK, resultValue)
                    finish()
                },
                openApp = {
                    packageManager.getLaunchIntentForPackage(packageName)?.let { startActivity(it) }
                }
            )
        }
    }

}
