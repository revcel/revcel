package com.revcel.mobile

import WidgetDataState
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import androidx.datastore.preferences.core.MutablePreferences
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.ListenableWorker
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkManager
import appGroupName
import isSubscribedKey
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * Shared lifecycle of the four widgets: subscription refresh on system updates, background
 * refresh scheduling, error / disconnected state, and cleanup on removal.
 */
abstract class RevcelWidgetReceiver : GlanceAppWidgetReceiver() {
    protected abstract val widgetClass: Class<out GlanceAppWidget>
    protected abstract val workerClass: Class<out ListenableWorker>

    /** Written by the worker; cleared on reconfigure so a new project never shows the old one's data. */
    protected abstract val dataKeys: List<Preferences.Key<*>>

    /** Hold the selection; cleared when the selection's account was removed in the app. */
    protected abstract val selectionKeys: List<Preferences.Key<*>>

    /**
     * Worker input built from the stored selection. Null when the widget is not configured, or
     * when its account is no longer among [connectionIds] (the token must not be used anymore).
     */
    protected abstract fun workerInput(prefs: Preferences, connectionIds: Set<String>, appWidgetId: Int): Data?

    companion object {
        val widgetStateKey = stringPreferencesKey("state")
        val isSubscribedValueKey = booleanPreferencesKey("isSubscribed")

        fun periodicWorkName(appWidgetId: Int) = "widget_update_$appWidgetId"
        fun refreshWorkName(appWidgetId: Int) = "widget_refresh_$appWidgetId"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            // let the framework dispatch onDeleted / onEnabled / onDisabled / onAppWidgetOptionsChanged
            super.onReceive(context, intent)
            return
        }

        // without goAsync the receiver returns at once and the process may be killed before the
        // state is written, leaving the widgets on their initial layout
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                refreshAll(context)
            } finally {
                pendingResult.finish()
            }
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)

        // the ids are already unbound here, resolving a GlanceId for them throws
        appWidgetIds.forEach { cancelWork(context, it) }
    }

    private suspend fun refreshAll(context: Context) {
        val manager = GlanceAppWidgetManager(context)
        val isSubscribed = context.getSharedPreferences(appGroupName, Context.MODE_PRIVATE)
            .getBoolean(isSubscribedKey, false)
        val connectionIds = currentConnections(context).mapNotNull { it.id }.toSet()

        for (glanceId in manager.getGlanceIds(widgetClass)) {
            val appWidgetId = manager.getAppWidgetId(glanceId)
            var input: Data? = null

            updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) { prefs ->
                input = workerInput(prefs, connectionIds, appWidgetId)
                val isConfigured = selectionKeys.any { prefs.asMap().containsKey(it) }

                prefs.toMutablePreferences().apply {
                    this[isSubscribedValueKey] = isSubscribed

                    if (isConfigured && input == null) {
                        // the account was removed in the app: drop the token and the stale data
                        clear(selectionKeys)
                        clear(dataKeys)
                        this[widgetStateKey] = WidgetDataState.DISCONNECTED.name
                    }
                }
            }

            val workerInput = input
            if (workerInput != null) {
                schedulePeriodicWork(context, appWidgetId, workerInput)
            } else {
                cancelWork(context, appWidgetId)
            }

            glanceAppWidget.update(context, glanceId)
        }
    }

    /** From the configuration activity: persist the selection, drop stale data, fetch right away. */
    protected fun applySelection(
        context: Context,
        appWidgetId: Int,
        isSubscribed: Boolean,
        write: MutablePreferences.() -> Unit
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            val glanceId = findGlanceId(context, widgetClass, appWidgetId) ?: return@launch
            val connectionIds = currentConnections(context).mapNotNull { it.id }.toSet()
            var input: Data? = null

            updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) { prefs ->
                prefs.toMutablePreferences().apply {
                    clear(dataKeys)
                    write()
                    this[isSubscribedValueKey] = isSubscribed
                    this[widgetStateKey] = WidgetDataState.LOADING.name
                    input = workerInput(this, connectionIds, appWidgetId)
                }
            }

            glanceAppWidget.update(context, glanceId)

            input?.let {
                schedulePeriodicWork(context, appWidgetId, it)
                enqueueImmediateRefresh(context, appWidgetId, it)
            }
        }
    }

    /** From the worker, on its own coroutine so the write completes before the worker returns. */
    protected suspend fun writeData(context: Context, glanceId: GlanceId, write: MutablePreferences.() -> Unit) {
        updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) { prefs ->
            prefs.toMutablePreferences().apply {
                write()
                this[widgetStateKey] = WidgetDataState.OK.name
            }
        }

        glanceAppWidget.update(context, glanceId)
    }

    suspend fun onFetchError(context: Context, glanceId: GlanceId) {
        updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) { prefs ->
            prefs.toMutablePreferences().apply {
                this[widgetStateKey] = WidgetDataState.FAILED.name
            }
        }

        glanceAppWidget.update(context, glanceId)
    }

    private fun MutablePreferences.clear(keys: List<Preferences.Key<*>>) {
        keys.forEach { this -= it }
    }

    private fun constraints() = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /**
     * `UPDATE` keeps the existing period. The previous cancel-then-enqueue restarted the worker on
     * every system update, doubling the network traffic.
     */
    private fun schedulePeriodicWork(context: Context, appWidgetId: Int, input: Data) {
        val work = PeriodicWorkRequest.Builder(workerClass, 15, TimeUnit.MINUTES)
            .setInputData(input)
            .setConstraints(constraints())
            .build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(periodicWorkName(appWidgetId), ExistingPeriodicWorkPolicy.UPDATE, work)
    }

    private fun enqueueImmediateRefresh(context: Context, appWidgetId: Int, input: Data) {
        val work = OneTimeWorkRequest.Builder(workerClass)
            .setInputData(input)
            .setConstraints(constraints())
            .build()

        WorkManager.getInstance(context)
            .enqueueUniqueWork(refreshWorkName(appWidgetId), ExistingWorkPolicy.REPLACE, work)
    }

    private fun cancelWork(context: Context, appWidgetId: Int) {
        WorkManager.getInstance(context).apply {
            cancelUniqueWork(periodicWorkName(appWidgetId))
            cancelUniqueWork(refreshWorkName(appWidgetId))
        }
    }
}
