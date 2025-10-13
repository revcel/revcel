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
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.sp

class LargeTeamProjectsWidget: GlanceAppWidget() {
    companion object {
        private val LARGE = DpSize(200.dp, 200.dp)
    }

    override val sizeMode = SizeMode.Responsive(setOf(LARGE))
    override var stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            RevcelGlanceTheme {
                LargeTeamProjectsWidgetContent()
            }
        }
    }
}

@Composable
fun LargeTeamProjectsWidgetContent() {
    val state = currentState<Preferences>()
    val isSubscribed = state[LargeTeamProjectsWidgetReceiver.isSubscribedValueKey] ?: false
    val rawItems = state[LargeTeamProjectsWidgetReceiver.itemsKey] ?: "[]"
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
        items.take(6).forEach { item ->
            TeamProjectRow(item)
        }
    }
}


