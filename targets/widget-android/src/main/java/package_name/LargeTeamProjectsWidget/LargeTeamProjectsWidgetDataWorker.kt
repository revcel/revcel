package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson

class LargeTeamProjectsWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val boxedGlanceId = inputData.getString(glanceIdKey) ?: throw Exception("Missing glance id")
        val glanceId = GlanceAppWidgetManager(context = applicationContext)
            .getGlanceIds(LargeTeamProjectsWidget::class.java).firstOrNull { id -> id.hashCode() == boxedGlanceId.toInt() }

        if (glanceId == null) {
            return Result.failure()
        }

        return try {
            val rawProjects = inputData.getString(projectsKey) ?: "[]"
            val projects = Gson()
                .fromJson(rawProjects, Array<ProjectListItem>::class.java)
                ?.toList() ?: emptyList()

            val items = fetchTeamProjectItems(applicationContext, projects)
            updateWidget(applicationContext, glanceId, items)
            Result.success()
        } catch (e: Exception) {
            onFetchError(applicationContext, glanceId)
            Result.retry()
        }
    }

    private fun updateWidget(context: Context, glanceId: GlanceId, items: Array<TeamProjectItem>) {
        LargeTeamProjectsWidgetReceiver().onDataFetched(context, glanceId, items)
    }

    private fun onFetchError(context: Context, glanceId: GlanceId) {
        LargeTeamProjectsWidgetReceiver().onFetchError(context, glanceId)
    }

    companion object {
        const val projectsKey = "projects"
        const val glanceIdKey = "glance_id"
    }
}
