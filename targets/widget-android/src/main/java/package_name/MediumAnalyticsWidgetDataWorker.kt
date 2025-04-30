package com.revcel.mobile

import ProjectListItem
import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson

class MediumAnalyticsWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val boxedGlanceId = inputData.getString(glanceIdKey) ?: throw Exception("Missing glance id")
        val glanceId = GlanceAppWidgetManager(context = applicationContext)
            .getGlanceIds(MediumAnalyticsWidget::class.java).firstOrNull { id -> id.hashCode() == boxedGlanceId.toInt()}

        if (glanceId == null) {
            return Result.failure()
        }

        return try {
            val response = fetchProjectFavicon(applicationContext)

            updateWidget(applicationContext, glanceId, response)
            Result.success()
        } catch (e: Exception) {
            this.onFetchError(applicationContext, glanceId)
            Result.retry()
        }
    }

    private suspend fun fetchProjectFavicon(context: Context): String {
        val rawContainer = inputData.getString(projectKey) ?: "null"
        val selectedProject = Gson().fromJson(rawContainer, ProjectListItem::class.java) ?: throw Exception("Missing selected container")

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

    private fun updateWidget(context: Context, glanceId: GlanceId, faviconPath: String) {
        MediumAnalyticsWidgetReceiver().onFaviconFetched(context, glanceId, faviconPath)
    }

    private fun onFetchError(context: Context, glanceId: GlanceId) {
        MediumAnalyticsWidgetReceiver().onFetchError(context, glanceId)
    }

    companion object {
        const val projectKey = "project"
        const val glanceIdKey = "glance_id"
    }
}
