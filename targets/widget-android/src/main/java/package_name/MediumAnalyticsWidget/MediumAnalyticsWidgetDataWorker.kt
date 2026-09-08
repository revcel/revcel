package com.revcel.mobile

import AnalyticsTimeseries
import AnalyticsWidgetData
import ProjectListItem
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.google.gson.Gson
import java.util.Date

class MediumAnalyticsWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val appWidgetId = inputData.getString(glanceIdKey)?.toIntOrNull() ?: return Result.failure()
        val glanceId = findGlanceId(applicationContext, MediumAnalyticsWidget::class.java, appWidgetId)

        if (glanceId == null) {
            // the widget is gone, stop the periodic work that outlived it
            WorkManager.getInstance(applicationContext)
                .cancelUniqueWork(RevcelWidgetReceiver.periodicWorkName(appWidgetId))
            return Result.failure()
        }

        val receiver = MediumAnalyticsWidgetReceiver()

        return try {
            val project = selectedProject()
            val analyticsData = fetchAnalyticsData(project)
            // best effort, never fails the data fetch
            val faviconPath = fetchProjectFavicon(applicationContext, project) ?: ""

            receiver.onDataFetched(applicationContext, glanceId, faviconPath, analyticsData)
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

    private suspend fun fetchAnalyticsData(selectedProject: ProjectListItem): AnalyticsWidgetData {
        val now = Date()
        val quickStatsEndTime = roundToGranularity(
            date = now,
            granularity = Granularity.FIVE_MINUTES,
            mode = RoundMode.DOWN
        )
        val quickStatsStartTime = roundToGranularity(
            date = Date(now.time - 24 * 60 * 60 * 1000),
            granularity = Granularity.FIVE_MINUTES,
            mode = RoundMode.UP
        )

        val analyticsEndTime = roundToGranularity(
            date = now,
            granularity = Granularity.ONE_HOUR,
            mode = RoundMode.UP
        )
        val analyticsStartTime = roundToGranularity(
            date = Date(now.time - 7 * 24 * 60 * 60 * 1000),
            granularity = Granularity.ONE_HOUR,
            mode = RoundMode.DOWN
        )

        val availability = fetchProjectAnalyticsAvailability(selectedProject.connection, selectedProject.connectionTeam, selectedProject.id)
        var visitorsNumber = 0
        var data = emptyArray<AnalyticsTimeseries>()
        if (availability.hasData && availability.isEnabled) {
            visitorsNumber = fetchProjectTotalVisitors(selectedProject.connection, selectedProject.connectionTeam, selectedProject.id, convertDateToIso(quickStatsStartTime), convertDateToIso(quickStatsEndTime)).devices
            data = fetchProjectAnalyticsTimeseries(selectedProject.connection, selectedProject.connectionTeam, selectedProject.id, convertDateToIso(analyticsStartTime), convertDateToIso(analyticsEndTime)).data?.groups?.all ?: emptyArray()
        }
        return AnalyticsWidgetData(
            visitorsNumber = visitorsNumber,
            isEnabled = availability.isEnabled,
            hasData = availability.hasData,
            data = data
        )
    }

    companion object {
        const val projectKey = "project"
        const val glanceIdKey = "glance_id"
    }
}
