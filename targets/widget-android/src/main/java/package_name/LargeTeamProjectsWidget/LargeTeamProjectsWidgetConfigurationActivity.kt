package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import WidgetIntentState
import appGroupName
import connectionsKey
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
import isSubscribedKey
import savedWidgetStateKey
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class LargeTeamProjectsWidgetConfigurationActivity: AppCompatActivity() {
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
            var selectedProjects by remember { mutableStateOf(listOf<ProjectListItem>()) }

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
                selectedProjects,
                options,
                appWidgetId,
                onProjectToggle = { project ->
                    selectedProjects = if (selectedProjects.any { it.id == project.id }) {
                        selectedProjects.filter { it.id != project.id }
                    } else {
                        (selectedProjects + project).take(6)
                    }
                }
            )
        }
    }

    @Composable
    private fun setupUI(
        isAuthorized: Boolean,
        state: WidgetIntentState,
        selectedProjects: List<ProjectListItem>,
        projects: List<ProjectListItem>,
        appWidgetId: Int,
        onProjectToggle: (selectedProject: ProjectListItem) -> Unit
    ) {
        RevcelMaterialTheme {
            ProjectMultiSelectConfigurationView(
                isAuthorized,
                state,
                selectedProjects,
                projects,
                onProjectToggle,
                onDone = {
                    // Fetch deployment data for all selected projects in background
                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            val items = coroutineScope {
                                selectedProjects.mapIndexed { index, project ->
                                    async {
                                        try {
                                            val response = fetchProductionDeployment(
                                                project.connection,
                                                project.connectionTeam,
                                                project.id
                                            )
                                            val deployment = response.deployment
                                            
                                            // Fetch favicon
                                            val faviconPath = try {
                                                val latestDeployment = fetchLatestDeployment(project.connection, project.id)
                                                if (latestDeployment.deployments.isNotEmpty()) {
                                                    val imageUrl = "https://vercel.com/api/v0/deployments/${latestDeployment.deployments.first().uid}/favicon?teamId=${project.connectionTeam.id}"
                                                    val file = downloadImageToFile(applicationContext, imageUrl, "${project.id}-${index}")
                                                    file.path
                                                } else {
                                                    null
                                                }
                                            } catch (e: Exception) {
                                                null
                                            }
                                            
                                            TeamProjectItem(
                                                id = "${project.id}-${index}",
                                                projectId = project.id,
                                                name = project.projectName,
                                                commitMessage = deployment.meta?.githubCommitMessage,
                                                createdAt = deployment.createdAt,
                                                status = deployment.readyState,
                                                faviconPath = faviconPath
                                            )
                                        } catch (e: Exception) {
                                            // Fallback to project with no deployment data
                                            TeamProjectItem(
                                                id = "${project.id}-${index}",
                                                projectId = project.id,
                                                name = project.projectName,
                                                commitMessage = null,
                                                createdAt = null,
                                                status = null,
                                                faviconPath = null
                                            )
                                        }
                                    }
                                }.awaitAll().toTypedArray()
                            }

                            val glanceId = GlanceAppWidgetManager(applicationContext).getGlanceIdBy(appWidgetId)
                            LargeTeamProjectsWidgetReceiver().onDataFetched(
                                applicationContext,
                                glanceId,
                                items
                            )

                            val resultValue = Intent().apply {
                                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                            }

                            setResult(RESULT_OK, resultValue)
                            finish()
                        } catch (e: Exception) {
                            // Handle error - still finish activity
                            finish()
                        }
                    }
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
