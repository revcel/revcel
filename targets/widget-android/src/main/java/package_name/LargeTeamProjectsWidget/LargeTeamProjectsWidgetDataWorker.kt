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
        val glanceId = GlanceAppWidgetManager(context = applicationContext)
            .getGlanceIds(LargeTeamProjectsWidget::class.java).firstOrNull()

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
        val rawProject = inputData.getString(projectKey) ?: "null"
        val project = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: throw Exception("Missing selected project")

        val deployment = fetchProductionDeployment(project.connection, project.connectionTeam, project.id).deployment
        
        // Fetch favicon
        val faviconPath = try {
            val latestDeployment = fetchLatestDeployment(project.connection, project.id)
            if (latestDeployment.deployments.isNotEmpty()) {
                val imageUrl = "https://vercel.com/api/v0/deployments/${latestDeployment.deployments.first().uid}/favicon?teamId=${project.connectionTeam.id}"
                val file = downloadImageToFile(applicationContext, imageUrl, project.id)
                file.path
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }

        val item = TeamProjectItem(
            id = "${project.id}-0",
            projectId = project.id,
            name = project.projectName,
            commitMessage = deployment.meta?.githubCommitMessage,
            createdAt = deployment.createdAt,
            status = deployment.readyState,
            faviconPath = faviconPath
        )

        // In a complete implementation, multiple projects would be combined; we keep 1 for MVP
        return arrayOf(item)
    }

    private fun updateWidget(context: Context, glanceId: GlanceId, items: Array<TeamProjectItem>) {
        LargeTeamProjectsWidgetReceiver().onDataFetched(context, glanceId, items)
    }

    private fun onFetchError(context: Context, glanceId: GlanceId) {
        LargeTeamProjectsWidgetReceiver().onFetchError(context, glanceId)
    }

    companion object {
        const val projectKey = "project"
        const val glanceIdKey = "glance_id"
    }
}


