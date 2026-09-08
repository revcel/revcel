package com.revcel.mobile

import ProjectListItem
import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.work.Data
import androidx.work.workDataOf
import com.google.gson.Gson

class SmallShortcutWidgetReceiver : RevcelWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SmallShortcutWidget()
    override val widgetClass = SmallShortcutWidget::class.java
    override val workerClass = SmallShortcutWidgetDataWorker::class.java
    override val dataKeys: List<Preferences.Key<*>> = listOf(faviconPathKey)
    override val selectionKeys: List<Preferences.Key<*>> = listOf(selectedProjectKey)

    companion object {
        val widgetStateKey = RevcelWidgetReceiver.widgetStateKey
        val isSubscribedValueKey = RevcelWidgetReceiver.isSubscribedValueKey
        val selectedProjectKey = stringPreferencesKey("selectedProject")
        val faviconPathKey = stringPreferencesKey("faviconPath")
    }

    override fun workerInput(prefs: Preferences, connectionIds: Set<String>, appWidgetId: Int): Data? {
        val project = Gson().fromJson(prefs[selectedProjectKey], ProjectListItem::class.java) ?: return null
        val connectionId = project.connection?.id

        if (connectionId == null || connectionId !in connectionIds) return null

        return workDataOf(
            SmallShortcutWidgetDataWorker.projectKey to Gson().toJson(project),
            SmallShortcutWidgetDataWorker.glanceIdKey to appWidgetId.toString()
        )
    }

    fun onProjectSelected(context: Context, appWidgetId: Int, project: ProjectListItem?, isSubscribed: Boolean) {
        if (project == null) return

        applySelection(context, appWidgetId, isSubscribed) {
            this[selectedProjectKey] = Gson().toJson(project)
        }
    }

    suspend fun onFaviconFetched(context: Context, glanceId: GlanceId, faviconPath: String) {
        writeData(context, glanceId) {
            this[faviconPathKey] = faviconPath
        }
    }
}
