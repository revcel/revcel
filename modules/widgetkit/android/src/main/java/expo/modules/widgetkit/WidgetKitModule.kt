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

    private fun getConnections(): List<Connection> {
        val rawConnections = appContext.reactContext
            ?.getSharedPreferences(groupName, Context.MODE_PRIVATE)
            ?.getString(instancesKey, "[]")

        return rawConnections?.let {
            Gson().fromJson(it, Array<Connection>::class.java).toList()
        } ?: emptyList()
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
            appContext.reactContext?.getSharedPreferences(groupName, Context.MODE_PRIVATE)?.let { prefs ->
                prefs.edit() {
                    putBoolean(isSubscribedKey, isSubscribed)
                    apply()
                }

                notifyAllWidgets()
            }
        }

        Function("addConnection") { connection: Connection ->
            appContext.reactContext?.getSharedPreferences(groupName, Context.MODE_PRIVATE)?.let { prefs ->
                val connections = this@WidgetKitModule.getConnections().toMutableList()

                val index = connections.indexOfFirst { it.id == connection.id }

                if (index != -1) {
                    connections[index] = connection
                } else {
                    connections.add(connection)
                }

                prefs.edit() {
                    putString(instancesKey, Gson().toJson(connections))
                    apply()
                }

                notifyAllWidgets()
            }
        }

        Function("removeConnection") { id: String ->
            appContext.reactContext?.getSharedPreferences(groupName, Context.MODE_PRIVATE)?.let { prefs ->
                val connections = this@WidgetKitModule.getConnections().toMutableList().filter { it.id != id}

                prefs.edit() {
                    putString(instancesKey, Gson().toJson(connections))
                    apply()
                }

                notifyAllWidgets()
            }
        }

        Function("clearAllConnections") {
            appContext.reactContext?.getSharedPreferences(groupName, Context.MODE_PRIVATE)?.let { prefs ->
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