package com.revcel.mobile

import ProjectListItem
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.google.gson.Gson

class LargeTeamProjectsWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val appWidgetId = inputData.getString(glanceIdKey)?.toIntOrNull() ?: return Result.failure()
        val glanceId = findGlanceId(applicationContext, LargeTeamProjectsWidget::class.java, appWidgetId)

        if (glanceId == null) {
            // the widget is gone, stop the periodic work that outlived it
            WorkManager.getInstance(applicationContext)
                .cancelUniqueWork(RevcelWidgetReceiver.periodicWorkName(appWidgetId))
            return Result.failure()
        }

        val receiver = LargeTeamProjectsWidgetReceiver()

        return try {
            val rawProjects = inputData.getString(projectsKey) ?: "[]"
            val projects = Gson()
                .fromJson(rawProjects, Array<ProjectListItem>::class.java)
                ?.toList() ?: emptyList()

            val items = fetchTeamProjectItems(applicationContext, projects)

            receiver.onDataFetched(applicationContext, glanceId, items)
            Result.success()
        } catch (e: Exception) {
            receiver.onFetchError(applicationContext, glanceId)
            workerResultFor(e)
        }
    }

    companion object {
        const val projectsKey = "projects"
        const val glanceIdKey = "glance_id"
    }
}
