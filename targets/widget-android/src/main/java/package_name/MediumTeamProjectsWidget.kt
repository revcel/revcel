package com.revcel.mobile

import ProjectListItem
import TeamProjectItem
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.google.gson.Gson
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.sp
import android.graphics.BitmapFactory

class MediumTeamProjectsWidget: GlanceAppWidget() {
    companion object {
        private val MEDIUM = DpSize(100.dp, 115.dp)
    }

    override val sizeMode = SizeMode.Responsive(setOf(MEDIUM))
    override var stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            RevcelGlanceTheme {
                MediumTeamProjectsWidgetContent()
            }
        }
    }
}

@Composable
fun MediumTeamProjectsWidgetContent() {
    val state = currentState<Preferences>()
    val isSubscribed = state[MediumTeamProjectsWidgetReceiver.isSubscribedValueKey] ?: false
    val rawItems = state[MediumTeamProjectsWidgetReceiver.itemsKey] ?: "[]"
    val items = Gson().fromJson(rawItems, Array<TeamProjectItem>::class.java) ?: emptyArray()
    val intent = Intent(Intent.ACTION_VIEW, getAppUrl(null, isSubscribed).toUri())

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .padding(16.dp)
            .background(GlanceTheme.colors.background)
            .actionStartActivity(intent)
    ) {
        if (!isSubscribed) {
            SubscriptionRequiredView()
            return@Column
        }
        items.take(3).forEach { item ->
            TeamProjectRow(item)
        }
    }
}

@Composable
fun TeamProjectRow(item: TeamProjectItem) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = GlanceModifier.defaultWeight()) {
            Text(
                text = item.name,
                style = TextStyle(
                    color = GlanceTheme.colors.onSurface,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                ),
                maxLines = 1
            )
            Row {
                Text(
                    text = formatDate(item.createdAt),
                    style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 12.sp),
                    maxLines = 1
                )
                Text(text = " • ", style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 12.sp))
                Text(
                    text = item.commitMessage ?: "Manual deploy",
                    style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 12.sp),
                    maxLines = 1
                )
            }
        }
        val status = item.status ?: "-"
        Text(
            text = status,
            style = TextStyle(color = mapStatusToColor(status), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        )
    }
}

fun mapStatusToColor(status: String): ColorProvider {
    return when(status.uppercase()) {
        "READY" -> GlanceTheme.colors.primary
        "ERROR", "CANCELED" -> GlanceTheme.colors.error
        "BUILDING" -> GlanceTheme.colors.outline
        else -> GlanceTheme.colors.onSurface
    }
}

fun formatDate(createdAt: Long?): String {
    if (createdAt == null) return "No deployment"
    val date = java.util.Date(createdAt)
    val sdf = java.text.SimpleDateFormat("dd/MM/yyyy", java.util.Locale.getDefault())
    return sdf.format(date)
}


