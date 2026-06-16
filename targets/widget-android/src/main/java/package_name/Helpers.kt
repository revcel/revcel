package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import android.content.Context
import android.content.SharedPreferences
import appGroupName
import isSubscribedKey
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
        return "revcel://projects/${project.id}/(tabs)/home"
    }

    return "revcel://?showPaywall=1"
}

fun formatNumber(value: Int?): String {
    if (value == null) return "-"
    val number = value.toLong()
    if (number < 1000) return number.toString()
    if (number < 1_000_000) return String.format(Locale.US, "%.1fK", number / 1000.0)
    return String.format(Locale.US, "%.1fM", number / 1_000_000.0)
}}

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
                val deployment = fetchProductionDeployment(
                    project.connection,
                    project.connectionTeam,
                    project.id
                ).deployment

                val faviconPath = try {
                    val latestDeployment = fetchLatestDeployment(project.connection, project.id)
                    if (latestDeployment.deployments.isNotEmpty()) {
                        val imageUrl =
                            "https://vercel.com/api/v0/deployments/${latestDeployment.deployments.first().uid}/favicon?teamId=${project.connectionTeam.id}"
                        downloadImageToFile(context, imageUrl, "${project.id}-${index}").path
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
