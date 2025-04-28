package com.revcel.mobile

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class ContainerWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val boxedGlanceId = inputData.getString(glanceIdKey) ?: throw Exception("Missing glance id")
        val glanceId = GlanceAppWidgetManager(context = applicationContext)
            .getGlanceIds(SmallShortcutWidget::class.java).firstOrNull { id -> id.hashCode() == boxedGlanceId.toInt()}

        if (glanceId == null) {
            return Result.failure()
        }

        return try {
            // fetch project data
            
            // Update widget with container and logs
            updateWidget(applicationContext, glanceId)
            Result.success()
        } catch (e: Exception) {
            this.onFetchError(applicationContext, glanceId)
            Result.retry()
        }
    }

    private fun updateWidget(context: Context, glanceId: GlanceId) {
        ContainerWidgetReceiver().onStatusUpdated(context, glanceId)
    }

    private fun onFetchError(context: Context, glanceId: GlanceId) {
        ContainerWidgetReceiver().onFetchError(context, glanceId)
    }

    companion object {
        const val glanceIdKey = "glance_id"
    }
}
