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
import androidx.core.content.edit
import androidx.glance.appwidget.GlanceAppWidgetManager
import expo.modules.widgetkit.Connection
import savedWidgetStateKey

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

        setWidgetState(WidgetIntentState.LOADING)

        setContent {
            var widgetState = remember { mutableStateOf(WidgetIntentState.LOADING) }
            val options = remember { mutableStateListOf<ProjectListItem>() }
            var selectedProject by remember { mutableStateOf<ProjectListItem?>(null) }

            LaunchedEffect(Unit) {
                for (connection in connections) {
                    try {
                        val connectionTeams = fetchConnectionTeams(connection)

                        for (connectionTeam in connectionTeams.teams) {
                            val teamProjects = fetchTeamProjects(connection, connectionTeam)

                            options.addAll(teamProjects.map { project ->
                                ProjectListItem(
                                    id = project.id,
                                    projectName = project.name,
                                    connection = connection,
                                    connectionTeam = connectionTeam
                                )
                            })
                        }

                        val nextState = if (connections.isEmpty()) WidgetIntentState.NO_PROJECTS else WidgetIntentState.HAS_PROJECTS

                        setWidgetState(nextState)
                        widgetState.value = nextState

                    } catch (e: Exception) {
                        setWidgetState(WidgetIntentState.API_FAILED)
                        widgetState.value = WidgetIntentState.API_FAILED
                    }
                }
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
                    val glanceId = GlanceAppWidgetManager(applicationContext).getGlanceIdBy(appWidgetId)
                    SmallShortcutWidgetReceiver().onProjectSelected(applicationContext, glanceId, selectedProject)

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

    private fun setWidgetState(state: WidgetIntentState) {
        val prefs = getSharedPreferences(appGroupName, Context.MODE_PRIVATE)

        prefs.edit {
            putInt(savedWidgetStateKey, state.value)
            apply()
        }
    }
}
