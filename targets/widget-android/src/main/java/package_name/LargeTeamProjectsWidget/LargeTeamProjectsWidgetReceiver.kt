package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.work.Data
import androidx.work.workDataOf
import com.google.gson.Gson

class LargeTeamProjectsWidgetReceiver : RevcelWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = LargeTeamProjectsWidget()
    override val widgetClass = LargeTeamProjectsWidget::class.java
    override val workerClass = LargeTeamProjectsWidgetDataWorker::class.java
    override val dataKeys: List<Preferences.Key<*>> = listOf(itemsKey)
    override val selectionKeys: List<Preferences.Key<*>> = listOf(selectedProjectsKey)

    companion object {
        val widgetStateKey = RevcelWidgetReceiver.widgetStateKey
        val isSubscribedValueKey = RevcelWidgetReceiver.isSubscribedValueKey
        val itemsKey = stringPreferencesKey("teamProjectItems")
        val selectedProjectsKey = stringPreferencesKey("selectedProjects")
    }

    override fun workerInput(prefs: Preferences, connectionIds: Set<String>, appWidgetId: Int): Data? {
        val projects = Gson().fromJson(prefs[selectedProjectsKey], Array<ProjectListItem>::class.java)
            ?.filter { it.connection?.id?.let { id -> id in connectionIds } == true }
            ?: emptyList()

        if (projects.isEmpty()) return null

        return workDataOf(
            LargeTeamProjectsWidgetDataWorker.projectsKey to Gson().toJson(projects),
            LargeTeamProjectsWidgetDataWorker.glanceIdKey to appWidgetId.toString()
        )
    }

    fun onProjectsSelected(context: Context, appWidgetId: Int, projects: List<ProjectListItem>, isSubscribed: Boolean) {
        if (projects.isEmpty()) return

        applySelection(context, appWidgetId, isSubscribed) {
            this[selectedProjectsKey] = Gson().toJson(projects)
        }
    }

    suspend fun onDataFetched(context: Context, glanceId: GlanceId, items: Array<TeamProjectItem>) {
        writeData(context, glanceId) {
            this[itemsKey] = Gson().toJson(items)
        }
    }
}
