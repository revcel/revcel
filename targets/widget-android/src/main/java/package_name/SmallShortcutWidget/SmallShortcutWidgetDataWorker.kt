package com.revcel.mobile

import ProjectListItem
import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson

class SmallShortcutWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val boxedGlanceId = inputData.getString(glanceIdKey) ?: throw Exception("Missing glance id")
        val glanceId = GlanceAppWidgetManager(context = applicationContext)
            .getGlanceIds(SmallShortcutWidget::class.java).firstOrNull { id -> id.hashCode() == boxedGlanceId.toInt()}

        if (glanceId == null) {
            return Result.failure()
        }

        return try {
            val response = resolveFaviconPath(applicationContext)

            updateWidget(applicationContext, glanceId, response)
            Result.success()
        } catch (e: Exception) {
            this.onFetchError(applicationContext, glanceId)
            Result.retry()
        }
    }

    private suspend fun resolveFaviconPath(context: Context): String {
        val rawProject = inputData.getString(projectKey) ?: "null"
        val selectedProject = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: throw Exception("Missing selected container")

        return fetchProjectFavicon(context, selectedProject) ?: ""
    }

    private fun updateWidget(context: Context, glanceId: GlanceId, faviconPath: String) {
        SmallShortcutWidgetReceiver().onFaviconFetched(context, glanceId, faviconPath)
    }

    private fun onFetchError(context: Context, glanceId: GlanceId) {
        SmallShortcutWidgetReceiver().onFetchError(context, glanceId)
    }

    companion object {
        const val projectKey = "project"
        const val glanceIdKey = "glance_id"
    }
}
