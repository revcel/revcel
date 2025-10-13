package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson

class MediumTeamProjectsWidgetDataWorker(context: Context, workerParams: WorkerParameters): CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result {
        val glanceId = GlanceAppWidgetManager(context = applicationContext)
            .getGlanceIds(MediumTeamProjectsWidget::class.java).firstOrNull()

        if (glanceId == null) {
            return Result.failure()
        }

        return try {
            val items = fetchItems()
            updateWidget(applicationContext, glanceId, items)
            Result.success()
        } catch (e: Exception) {
            this.onFetchError(applicationContext, glanceId)
            Result.retry()
        }
    }

    private suspend fun fetchItems(): Array<TeamProjectItem> {
        // For simplicity, read last selected project from inputs (3 projects could be added via configuration UI enhancement)
        val rawProject = inputData.getString(projectKey) ?: "null"
        val project = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: throw Exception("Missing selected project")

        val deployment = fetchProductionDeployment(project.connection, project.connectionTeam, project.id).deployment

        val item = TeamProjectItem(
            id = "${project.id}-0",
            projectId = project.id,
            name = project.projectName,
            commitMessage = deployment.meta?.githubCommitMessage,
            createdAt = deployment.createdAt,
            status = deployment.readyState
        )

        return arrayOf(item)
    }

    private fun updateWidget(context: Context, glanceId: GlanceId, items: Array<TeamProjectItem>) {
        MediumTeamProjectsWidgetReceiver().onDataFetched(context, glanceId, items)
    }

    private fun onFetchError(context: Context, glanceId: GlanceId) {
        MediumTeamProjectsWidgetReceiver().onFetchError(context, glanceId)
    }

    companion object {
        const val projectKey = "project"
        const val glanceIdKey = "glance_id"
    }
}


