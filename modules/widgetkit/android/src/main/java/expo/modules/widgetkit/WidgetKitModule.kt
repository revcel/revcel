package expo.modules.widgetkit

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import com.google.gson.Gson
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import androidx.core.content.edit

class WidgetKitModule : Module() {
    companion object {
        const val groupName = "group.com.revcel.mobile"
        const val instancesKey = "revcel::connections"
        const val isSubscribedKey = "revcel::subscribed"
    }

    private fun prefs() = appContext.reactContext?.getSharedPreferences(groupName, Context.MODE_PRIVATE)

    private fun getConnections(): List<Connection> {
        val rawConnections = prefs()?.getString(instancesKey, "[]")

        return rawConnections?.let {
            runCatching { Gson().fromJson(it, Array<Connection>::class.java).toList() }.getOrNull()
        } ?: emptyList()
    }

    /** Writes the list and notifies the widgets only when the payload changed. */
    private fun saveConnections(connections: List<Connection>) {
        val prefs = prefs() ?: return
        val serialized = Gson().toJson(connections)

        if (prefs.getString(instancesKey, null) == serialized) return

        prefs.edit {
            putString(instancesKey, serialized)
            apply()
        }

        notifyAllWidgets()
    }

    private fun notifyAllWidgets() {
        val context = appContext.reactContext ?: return

        // implicit broadcasts are dropped since API 26; scoping to our package delivers it to the
        // manifest receivers of every widget
        val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
            setPackage(context.packageName)
        }

        context.sendBroadcast(intent)
    }

    override fun definition() = ModuleDefinition {
        Name("RevcelWidgetKit")

        Function("setIsSubscribed") { isSubscribed: Boolean ->
            prefs()?.let { prefs ->
                if (prefs.contains(isSubscribedKey) && prefs.getBoolean(isSubscribedKey, false) == isSubscribed) {
                    return@let
                }

                prefs.edit {
                    putBoolean(isSubscribedKey, isSubscribed)
                    apply()
                }

                notifyAllWidgets()
            }
        }

        Function("addConnection") { connection: Connection ->
            val connections = this@WidgetKitModule.getConnections().toMutableList()

            val index = connections.indexOfFirst { it.id == connection.id }

            if (index != -1) {
                connections[index] = connection
            } else {
                connections.add(connection)
            }

            saveConnections(connections)
        }

        Function("removeConnection") { id: String ->
            saveConnections(this@WidgetKitModule.getConnections().filter { it.id != id })
        }

        Function("clearAllConnections") {
            prefs()?.let { prefs ->
                // only the connections: clearing everything also dropped the subscription flag
                prefs.edit() {
                    remove(instancesKey)
                    apply()
                }

                notifyAllWidgets()
            }
        }
    }
}