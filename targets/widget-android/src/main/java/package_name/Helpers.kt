package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import WidgetIntentState
import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.work.ListenableWorker
import appGroupName
import com.google.gson.Gson
import com.google.gson.JsonSyntaxException
import connectionsKey
import expo.modules.widgetkit.Connection
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import java.util.Date
import java.util.concurrent.TimeUnit
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

enum class Granularity(val millis: Long) {
    FIVE_MINUTES(TimeUnit.MINUTES.toMillis(5)),
    ONE_HOUR(TimeUnit.HOURS.toMillis(1))
}

enum class RoundMode {
    UP,
    DOWN
}

fun roundToGranularity(date: Date, granularity: Granularity, mode: RoundMode = RoundMode.UP): Date {
    val timeMs = date.time
    val granularityMs = granularity.millis
    val rounded = (timeMs / granularityMs) * granularityMs

    val resultMs = if (mode == RoundMode.UP) rounded else (rounded - granularityMs)
    return Date(resultMs)
}

fun convertDateToIso(date: Date): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
    sdf.timeZone = TimeZone.getTimeZone("UTC")
    return sdf.format(date)
}

fun getAppUrl(project: ProjectListItem?, isSubscribed: Boolean): String {
    if (project == null) {
        return "revcel://"
    }

    if (isSubscribed) {
        // Pass connectionId + teamId so the app re-syncs the active connection/team to THIS project's
        // owner before the tabs load. A widget can point at a project in a team that isn't currently
        // selected; without these params the app stays on the wrong team and the project's API calls
        // 403 (e.g. logs -> "Failed to fetch logs", home -> "Missing project"). The home tab consumes
        // these in its switchConnection effect. Mirrors the push-notification deep link (lib/hooks.ts).
        // connection.id == the persisted connection id (the user uid) that switchConnection expects.
        val connectionId = project.connection.id
        val teamId = project.connectionTeam.id

        return if (connectionId != null) {
            "revcel://projects/${project.id}/(tabs)/home?connectionId=$connectionId&teamId=$teamId"
        } else {
            // connection.id is nullable in the widgetkit Record; fall back to the bare URL rather than
            // emitting a literal "null" param (the switch effect needs BOTH ids to fire anyway).
            "revcel://projects/${project.id}/(tabs)/home"
        }
    }

    return "revcel://?showPaywall=1"
}

/** Connections the app currently has; widgets configured with a removed one must stop calling Vercel. */
fun currentConnections(context: Context): List<Connection> {
    val raw = context.getSharedPreferences(appGroupName, Context.MODE_PRIVATE).getString(connectionsKey, "[]")
    return try {
        Gson().fromJson(raw, Array<Connection>::class.java)?.toList() ?: emptyList()
    } catch (e: JsonSyntaxException) {
        emptyList()
    }
}

/**
 * Projects of every connection for the configuration screens. Connections and teams are fetched
 * in parallel, and one failing connection does not hide the projects of the others.
 */
suspend fun loadProjectOptions(connections: List<Connection>): Pair<List<ProjectListItem>, WidgetIntentState> {
    if (connections.isEmpty()) return emptyList<ProjectListItem>() to WidgetIntentState.NO_PROJECTS

    val perConnection = coroutineScope {
        connections.map { connection ->
            async {
                try {
                    val teams = fetchConnectionTeams(connection).teams.toList()
                    coroutineScope {
                        teams.map { team ->
                            async {
                                try {
                                    fetchTeamProjects(connection, team).map { project ->
                                        ProjectListItem(project.id, project.name, connection, team)
                                    }
                                } catch (e: Exception) {
                                    emptyList()
                                }
                            }
                        }.awaitAll().flatten()
                    }
                } catch (e: Exception) {
                    null
                }
            }
        }.awaitAll()
    }

    val options = perConnection.filterNotNull().flatten()
        .distinctBy { it.id }
        .sortedBy { it.projectName.lowercase() }
    val allFailed = perConnection.all { it == null }

    val state = when {
        options.isNotEmpty() -> WidgetIntentState.HAS_PROJECTS
        allFailed -> WidgetIntentState.API_FAILED
        else -> WidgetIntentState.NO_PROJECTS
    }
    return options to state
}

/** GlanceId of a still-bound widget, null once it was removed. Never use `getGlanceIdBy`, it throws. */
suspend fun findGlanceId(context: Context, widgetClass: Class<out GlanceAppWidget>, appWidgetId: Int): GlanceId? {
    val manager = GlanceAppWidgetManager(context)
    return manager.getGlanceIds(widgetClass).firstOrNull { manager.getAppWidgetId(it) == appWidgetId }
}

/**
 * Retry only what can recover. A 4xx (revoked token, deleted project) or an unparseable body will
 * fail again in 15 minutes just the same, and backoff retries on top of the periodic schedule only
 * burn battery.
 */
fun workerResultFor(error: Exception): ListenableWorker.Result = when {
    error is HttpException && error.code in 400..499 -> ListenableWorker.Result.failure()
    error is JsonSyntaxException -> ListenableWorker.Result.failure()
    error.message?.startsWith("Missing") == true -> ListenableWorker.Result.failure()
    else -> ListenableWorker.Result.retry()
}

fun formatNumber(value: Int?): String {
    if (value == null) return "-"
    val number = value.toLong()
    if (number < 1000) return number.toString()
    if (number < 1_000_000) return String.format(Locale.US, "%.1fK", number / 1000.0)
    return String.format(Locale.US, "%.1fM", number / 1_000_000.0)
}

/**
 * Fetches production-deployment status (and favicon) for each selected project in parallel.
 * Shared by the configuration activity (initial load) and the background worker (refresh).
 */
suspend fun fetchTeamProjectItems(
    context: Context,
    projects: List<ProjectListItem>
): Array<TeamProjectItem> = coroutineScope {
    projects.mapIndexed { index, project ->
        async {
            try {
                val response = fetchProductionDeployment(
                    project.connection,
                    project.connectionTeam,
                    project.id
                )
                val deployment = response.deployment
                val faviconPath = fetchProjectFavicon(context, project, response.domain?.name)

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