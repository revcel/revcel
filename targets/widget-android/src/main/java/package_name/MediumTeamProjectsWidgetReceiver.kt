package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import android.content.Context
import android.content.Intent
import androidx.datastore.preferences.core.booleanPreferencesKey
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
import appGroupName
import com.google.gson.Gson
import isSubscribedKey
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

class MediumTeamProjectsWidgetReceiver: GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = MediumTeamProjectsWidget()

    companion object {
        val widgetStateKey = stringPreferencesKey("state")
        val itemsKey = stringPreferencesKey("teamProjectItems")
        val isSubscribedValueKey = booleanPreferencesKey("isSubscribed")
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "android.appwidget.action.APPWIDGET_UPDATE") {
            CoroutineScope(Dispatchers.IO).launch {
                val sharedPrefs = context.getSharedPreferences(appGroupName, Context.MODE_PRIVATE)
                val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumTeamProjectsWidget::class.java)

                glanceIds.forEach { glanceId ->
                    updateAppWidgetState(
                        context = context,
                        definition = PreferencesGlanceStateDefinition,
                        glanceId = glanceId
                    ) { prefs ->
                        prefs.toMutablePreferences().apply {
                            this[isSubscribedValueKey] = sharedPrefs.getBoolean(isSubscribedKey, false)
                        }
                    }

                    glanceAppWidget.update(context, glanceId)
                }
            }
        }
    }

    fun onDataFetched(context: Context, glanceId: GlanceId, items: Array<TeamProjectItem>) {
        CoroutineScope(Dispatchers.IO).launch {
            val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumTeamProjectsWidget::class.java)

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
            val glanceIds = GlanceAppWidgetManager(context).getGlanceIds(MediumTeamProjectsWidget::class.java)

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


