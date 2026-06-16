package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import WidgetIntentState
import android.content.Context
import android.content.Intent
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import com.google.gson.Gson
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
import appGroupName
import isSubscribedKey
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

class LargeTeamProjectsWidgetReceiver: GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = LargeTeamProjectsWidget()

    companion object {
        val widgetStateKey = stringPreferencesKey("state")
        val itemsKey = stringPreferencesKey("teamProjectItems")
        val selectedProjectsKey = stringPreferencesKey("selectedProjects")
        val isSubscribedValueKey = booleanPreferencesKey("isSubscribed")
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "android.appwidget.action.APPWIDGET_UPDATE") {
            CoroutineScope(Dispatchers.IO).launch {
                val sharedPrefs = context.getSharedPreferences(appGroupName, Context.MODE_PRIVATE)
                val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(LargeTeamProjectsWidget::class.java)

                glanceIds.forEach { glanceId ->
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        val rawProjects = prefs[selectedProjectsKey] ?: "[]"
                        val projects = Gson()
                            .fromJson(rawProjects, Array<ProjectListItem>::class.java)
                            ?.toList() ?: emptyList()

                        if (projects.isNotEmpty()) {
                            schedulePeriodicWork(context, glanceId, projects)
                        }

                        prefs.toMutablePreferences().apply {
                            this[isSubscribedValueKey] = sharedPrefs.getBoolean(isSubscribedKey, false)
                        }
                    }

                    glanceAppWidget.update(context, glanceId)
                }
            }
        } else {
            // Let the framework dispatch non-update lifecycle events
            // (onDeleted / onEnabled / onDisabled / onAppWidgetOptionsChanged).
            super.onReceive(context, intent)
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

    fun onProjectsSelected(
        context: Context,
        glanceId: GlanceId,
        projects: List<ProjectListItem>,
        isSubscribed: Boolean
    ) {
        if (projects.isEmpty()) {
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(LargeTeamProjectsWidget::class.java)

            glanceIds.forEach { runningGlanceId ->
                if (runningGlanceId == glanceId) {
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        prefs.toMutablePreferences().apply {
                            this[selectedProjectsKey] = Gson().toJson(projects)
                            this[isSubscribedValueKey] = isSubscribed
                        }
                    }

                    glanceAppWidget.update(context, glanceId)
                    schedulePeriodicWork(context, glanceId, projects)
                }
            }
        }
    }

    /**
     * Schedules periodic work to refresh the widget's project data.
     * 15-minute interval, mirroring the other widgets.
     */
    private fun schedulePeriodicWork(context: Context, glanceId: GlanceId, projects: List<ProjectListItem>) {
        val workManager = WorkManager.getInstance(context)

        // cancel previous jobs if present
        workManager.cancelUniqueWork("widget_update_${glanceId.hashCode()}")

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val work = PeriodicWorkRequestBuilder<LargeTeamProjectsWidgetDataWorker>(15, TimeUnit.MINUTES)
            .setInputData(
                workDataOf(
                    LargeTeamProjectsWidgetDataWorker.projectsKey to Gson().toJson(projects),
                    LargeTeamProjectsWidgetDataWorker.glanceIdKey to glanceId.hashCode().toString()
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

    fun onDataFetched(context: Context, glanceId: GlanceId, items: Array<TeamProjectItem>) {
        CoroutineScope(Dispatchers.IO).launch {
            val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(LargeTeamProjectsWidget::class.java)

            glanceIds.forEach { runningGlanceId ->
                if (runningGlanceId == glanceId) {
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        prefs.toMutablePreferences().apply {
                            this[itemsKey] = Gson().toJson(items)
                        }
                    }

                    glanceAppWidget.update(context, glanceId)
                }
            }
        }
    }

    fun onFetchError(context: Context, glanceId: GlanceId) {
        CoroutineScope(Dispatchers.IO).launch {
            val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(LargeTeamProjectsWidget::class.java)

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
}
