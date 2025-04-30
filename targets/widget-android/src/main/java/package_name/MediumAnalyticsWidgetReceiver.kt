package com.revcel.mobile

import AnalyticsWidgetData
import ProjectListItem
import android.content.Context
import android.content.Intent
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

class MediumAnalyticsWidgetReceiver: GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = MediumAnalyticsWidget()

    companion object {
        val widgetStateKey = stringPreferencesKey("state")
        val selectedProjectKey = stringPreferencesKey("selectedProject")
        val faviconPathKey = stringPreferencesKey("faviconPath")
        val analyticsDataKey = stringPreferencesKey("analyticsData")
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "android.appwidget.action.APPWIDGET_UPDATE") {
            CoroutineScope(Dispatchers.IO).launch {
                val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumAnalyticsWidget::class.java)

                glanceIds.forEach { glanceId ->
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        val rawProject = prefs[selectedProjectKey] ?: "null"
                        val project = Gson().fromJson(rawProject, ProjectListItem::class.java)

                        if (project != null) {
                            schedulePeriodicWork(context, glanceId, project)
                        }

                        prefs.toMutablePreferences().apply {}
                    }

                    glanceAppWidget.update(context, glanceId)
                }
            }
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)

        appWidgetIds.forEach { appWidgetId ->
            val glanceId = GlanceAppWidgetManager(context).getGlanceIdBy(appWidgetId)
            val workManager = WorkManager.getInstance(context)

            // widget should no longer get periodic updates
            workManager.cancelUniqueWork("widget_update_${glanceId.hashCode()}")
        }
    }

    fun onProjectSelected(context: Context, glanceId: GlanceId, project: ProjectListItem?) {
        if (project == null) {
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumAnalyticsWidget::class.java)

            glanceIds.forEach { runningGlanceId ->
                if (runningGlanceId == glanceId) {
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        prefs.toMutablePreferences().apply {
                            this[selectedProjectKey] = Gson().toJson(project)
                        }
                    }

                    glanceAppWidget.update(context, glanceId)
                    schedulePeriodicWork(context, glanceId, project)
                }
            }
        }
    }

    fun onDataFetched(context: Context, glanceId: GlanceId, faviconPath: String, analyticsWidgetData: AnalyticsWidgetData) {
        CoroutineScope(Dispatchers.IO).launch {
            val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumAnalyticsWidget::class.java)

            glanceIds.forEach { runningGlanceId ->
                if (runningGlanceId == glanceId) {
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        prefs.toMutablePreferences().apply {
                            this[faviconPathKey] = faviconPath
                            this[analyticsDataKey] = Gson().toJson(analyticsWidgetData)
                        }
                    }

                    glanceAppWidget.update(context, glanceId)
                }
            }
        }
    }

    fun onFetchError(context: Context, glanceId: GlanceId) {
        CoroutineScope(Dispatchers.IO).launch {
            val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumAnalyticsWidget::class.java)

            glanceIds.forEach { runningGlanceId ->
                if (runningGlanceId == glanceId) {
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        prefs.toMutablePreferences().apply {
                            this[widgetStateKey] = WidgetIntentState.API_FAILED.toString()
                        }
                    }

                    glanceAppWidget.update(context, glanceId)
                }
            }
        }
    }

    /**
     * Schedules periodic work to update the widget with container data
     * Initial schedule with 15-minute interval
     */
    private fun schedulePeriodicWork(context: Context, glanceId: GlanceId, project: ProjectListItem) {
        val workManager = WorkManager.getInstance(context)

        // cancel previous jobs if present
        workManager.cancelUniqueWork("widget_update_${glanceId.hashCode()}")

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val work = PeriodicWorkRequestBuilder<MediumAnalyticsWidgetDataWorker>(15, TimeUnit.MINUTES)
            .setInputData(
                workDataOf(
                    MediumAnalyticsWidgetDataWorker.projectKey to Gson().toJson(project),
                    MediumAnalyticsWidgetDataWorker.glanceIdKey to glanceId.hashCode().toString()
                )
            )
            .setConstraints(constraints)
            .build()

        workManager.enqueueUniquePeriodicWork(
            "widget_update_${glanceId.hashCode()}",
            ExistingPeriodicWorkPolicy.UPDATE,
            work
        )
    }
}
