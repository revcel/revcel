package com.revcel.mobile

import ProjectListItem
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.google.gson.Gson

class SmallShortcutWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val appWidgetId = inputData.getString(glanceIdKey)?.toIntOrNull() ?: return Result.failure()
        val glanceId = findGlanceId(applicationContext, SmallShortcutWidget::class.java, appWidgetId)

        if (glanceId == null) {
            // the widget is gone, stop the periodic work that outlived it
            WorkManager.getInstance(applicationContext)
                .cancelUniqueWork(RevcelWidgetReceiver.periodicWorkName(appWidgetId))
            return Result.failure()
        }

        val receiver = SmallShortcutWidgetReceiver()

        return try {
            val project = selectedProject()
            val faviconPath = fetchProjectFavicon(applicationContext, project) ?: ""

            receiver.onFaviconFetched(applicationContext, glanceId, faviconPath)
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

    companion object {
        const val projectKey = "project"
        const val glanceIdKey = "glance_id"
    }
}
