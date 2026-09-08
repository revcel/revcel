package com.revcel.mobile

import java.util.Date
import FirewallMetricsGranularity
import FirewallMetricsRequest
import FirewallMetricsRollups
import FirewallMetricsScope
import FirewallMetricsValue
import FirewallWidgetData
import ProjectListItem
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.google.gson.Gson

class MediumFirewallWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val appWidgetId = inputData.getString(glanceIdKey)?.toIntOrNull() ?: return Result.failure()
        val glanceId = findGlanceId(applicationContext, MediumFirewallWidget::class.java, appWidgetId)

        if (glanceId == null) {
            // the widget is gone, stop the periodic work that outlived it
            WorkManager.getInstance(applicationContext)
                .cancelUniqueWork(RevcelWidgetReceiver.periodicWorkName(appWidgetId))
            return Result.failure()
        }

        val receiver = MediumFirewallWidgetReceiver()

        return try {
            val project = selectedProject()
            val firewallData = fetchFirewallData(project)
            // best effort, never fails the data fetch
            val faviconPath = fetchProjectFavicon(applicationContext, project) ?: ""

            receiver.onDataFetched(applicationContext, glanceId, faviconPath, firewallData)
            Result.success()
        } catch (e: Exception) {
            receiver.onFetchError(applicationContext, glanceId)
            workerResultFor(e)
        }
    }

    private fun selectedProject(): ProjectListItem {
        val rawProject = inputData.getString(projectKey) ?: "null"
        return Gson().fromJson(rawProject, ProjectListItem::class.java) ?: throw Exception("Missing selected project")
    }

    private suspend fun fetchFirewallData(selectedProject: ProjectListItem): FirewallWidgetData {
        val now = Date()
        val endTime = roundToGranularity(
            date = now,
            granularity = Granularity.FIVE_MINUTES,
            mode = RoundMode.DOWN
        )
        val startTime = roundToGranularity(
            date = Date(now.time - 24 * 60 * 60 * 1000),
            granularity = Granularity.FIVE_MINUTES,
            mode = RoundMode.UP
        )
        val firewallData = FirewallWidgetData(
            allowed = null,
            denied = null,
            challenged = null
        )
        val payloadData = FirewallMetricsRequest(
            event = "firewallAction",
            reason = "firewall_tab",
            rollups = FirewallMetricsRollups(
                value = FirewallMetricsValue(
                    measure = "count",
                    aggregation = "sum"
                )
            ),
            granularity = FirewallMetricsGranularity(
                minutes = 5
                ),
            groupBy = arrayOf("wafRuleId", "wafAction"),
            limit = 500,
            tailRollup = "truncate",
            // only the summary is read; the full 24h timeseries was ~80 KB per refresh
            summaryOnly = true,
            startTime = convertDateToIso(startTime),
            endTime = convertDateToIso(endTime),
            scope = FirewallMetricsScope(
                type = "project",
                ownerId = selectedProject.connectionTeam.id,
                projectIds = arrayOf(selectedProject.id)
            )
        )
        val firewallResponseData = fetchProjectFirewallMetrics(selectedProject.connection, selectedProject.connectionTeam, payloadData)

        if (firewallResponseData.summary.isEmpty()) {
            return firewallData
        }

        // groupBy ["wafRuleId", "wafAction"] returns one row per (rule, action),
        // so each action can span multiple rows — sum them, don't take the first.
        var allowed = firewallResponseData.summary.filter { it.wafAction == "allow" }
            .takeIf { it.isNotEmpty() }?.sumOf { it.value }
        if (allowed == null) {
            allowed = firewallResponseData.summary.filter { it.wafAction == "" }
                .takeIf { it.isNotEmpty() }?.sumOf { it.value }
        }
        val denied = firewallResponseData.summary.filter { it.wafAction == "deny" }
            .takeIf { it.isNotEmpty() }?.sumOf { it.value }
        val challenged = firewallResponseData.summary.filter { it.wafAction == "challenge" }
            .takeIf { it.isNotEmpty() }?.sumOf { it.value }

        return FirewallWidgetData(
            allowed = allowed,
            challenged = challenged,
            denied = denied
        )
    }

    companion object {
        const val projectKey = "project"
        const val glanceIdKey = "glance_id"
    }
}
