package com.revcel.mobile

import ProjectListItem
import AnalyticsWidgetData
import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.work.Data
import androidx.work.workDataOf
import com.google.gson.Gson

class MediumAnalyticsWidgetReceiver : RevcelWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = MediumAnalyticsWidget()
    override val widgetClass = MediumAnalyticsWidget::class.java
    override val workerClass = MediumAnalyticsWidgetDataWorker::class.java
    override val dataKeys: List<Preferences.Key<*>> = listOf(faviconPathKey, analyticsDataKey)
    override val selectionKeys: List<Preferences.Key<*>> = listOf(selectedProjectKey)

    companion object {
        val widgetStateKey = RevcelWidgetReceiver.widgetStateKey
        val isSubscribedValueKey = RevcelWidgetReceiver.isSubscribedValueKey
        val selectedProjectKey = stringPreferencesKey("selectedProject")
        val faviconPathKey = stringPreferencesKey("faviconPath")
        val analyticsDataKey = stringPreferencesKey("analyticsData")
    }

    override fun workerInput(prefs: Preferences, connectionIds: Set<String>, appWidgetId: Int): Data? {
        val project = Gson().fromJson(prefs[selectedProjectKey], ProjectListItem::class.java) ?: return null
        val connectionId = project.connection?.id

        if (connectionId == null || connectionId !in connectionIds) return null

        return workDataOf(
            MediumAnalyticsWidgetDataWorker.projectKey to Gson().toJson(project),
            MediumAnalyticsWidgetDataWorker.glanceIdKey to appWidgetId.toString()
        )
    }

    fun onProjectSelected(context: Context, appWidgetId: Int, project: ProjectListItem?, isSubscribed: Boolean) {
        if (project == null) return

        applySelection(context, appWidgetId, isSubscribed) {
            this[selectedProjectKey] = Gson().toJson(project)
        }
    }

    suspend fun onDataFetched(context: Context, glanceId: GlanceId, faviconPath: String, analyticsWidgetData: AnalyticsWidgetData) {
        writeData(context, glanceId) {
            this[faviconPathKey] = faviconPath
            this[analyticsDataKey] = Gson().toJson(analyticsWidgetData)
        }
    }
}
