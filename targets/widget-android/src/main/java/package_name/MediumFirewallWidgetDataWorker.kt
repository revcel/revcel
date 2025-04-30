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
            val response = fetchProjectFavicon(applicationContext)
            val firewallData = fetchFirewallData()

            updateWidget(applicationContext, glanceId, response, firewallData)
            Result.success()
        } catch (e: Exception) {
            this.onFetchError(applicationContext, glanceId)
            Result.retry()
        }
    }

    private suspend fun fetchProjectFavicon(context: Context): String {
        val rawProject = inputData.getString(projectKey) ?: "null"
        val selectedProject = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: throw Exception("Missing selected project")

        val latestDeployment = fetchLatestDeployment(selectedProject.connection, selectedProject.id)

        if (latestDeployment.deployments.isEmpty()) {
            return ""
        }

        val imageUrl = "https://vercel.com/api/v0/deployments/${latestDeployment.deployments.first().uid}/favicon?teamId=${selectedProject.connectionTeam.id}"

        try {
            val file = downloadImageToFile(context, imageUrl, selectedProject.id)

            return file.path
        } catch(error: Exception) {
            return ""
        }
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
            summaryOnly = false,
            startTime = startTime.toString(),
            endTime = endTime.toString(),
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

        var allowed = firewallResponseData.summary.firstOrNull { it.wafAction == "allow" }?.value
        if (allowed == null) {
            allowed = firewallResponseData.summary.firstOrNull { it.wafAction == "" }?.value
        }
        val denied = firewallResponseData.summary.firstOrNull { it.wafAction == "deny" }?.value
        val challenged = firewallResponseData.summary.firstOrNull { it.wafAction == "challenge" }?.value

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
