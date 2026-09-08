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
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson

class MediumFirewallWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val boxedGlanceId = inputData.getString(glanceIdKey) ?: throw Exception("Missing glance id")
        val glanceId = GlanceAppWidgetManager(context = applicationContext)
            .getGlanceIds(MediumFirewallWidget::class.java).firstOrNull { id -> id.hashCode() == boxedGlanceId.toInt()}

        if (glanceId == null) {
            return Result.failure()
        }

        return try {
            val response = resolveFaviconPath(applicationContext)
            val firewallData = fetchFirewallData()

            updateWidget(applicationContext, glanceId, response, firewallData)
            Result.success()
        } catch (e: Exception) {
            this.onFetchError(applicationContext, glanceId)
            Result.retry()
        }
    }

    private suspend fun resolveFaviconPath(context: Context): String {
        val rawProject = inputData.getString(projectKey) ?: "null"
        val selectedProject = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: throw Exception("Missing selected project")

        return fetchProjectFavicon(context, selectedProject) ?: ""
    }

    private suspend fun fetchFirewallData(): FirewallWidgetData {
        val rawProject = inputData.getString(projectKey) ?: "null"
        val selectedProject = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: throw Exception("Missing selected project")
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

    private fun updateWidget(context: Context, glanceId: GlanceId, faviconPath: String, firewallData: FirewallWidgetData) {
        MediumFirewallWidgetReceiver().onDataFetched(context, glanceId, faviconPath, firewallData)
    }

    private fun onFetchError(context: Context, glanceId: GlanceId) {
        MediumFirewallWidgetReceiver().onFetchError(context, glanceId)
    }

    companion object {
        const val projectKey = "project"
        const val glanceIdKey = "glance_id"
    }
}
