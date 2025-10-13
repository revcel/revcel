package com.revcel.mobile

import FirewallWidgetData
import ProjectListItem
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import androidx.datastore.preferences.core.Preferences
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.size
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.google.gson.Gson

class MediumFirewallWidget: GlanceAppWidget() {
	companion object {
        private val MEDIUM = DpSize(100.dp, 115.dp)
    }

    override val sizeMode = SizeMode.Responsive(
        setOf(
            MEDIUM
        )
    )
	
    override var stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            RevcelGlanceTheme {
                MediumFirewallWidgetContent()
            }
        }
    }
}

@Composable
fun MediumFirewallWidgetContent() {
    val imageSize = 42.dp
    val state = currentState<Preferences>()
    val isSubscribed = state[MediumFirewallWidgetReceiver.isSubscribedValueKey] ?: false
    val rawProject = state[MediumFirewallWidgetReceiver.selectedProjectKey]
    val faviconPath = state[MediumFirewallWidgetReceiver.faviconPathKey]
    val rawFirewallData = state[MediumFirewallWidgetReceiver.firewallWidgetDataKey]
    val project = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: null
    val firewallData = Gson().fromJson(rawFirewallData, FirewallWidgetData::class.java) ?: null
    val customUri = getAppUrl(project, isSubscribed)
    val intent = Intent(Intent.ACTION_VIEW, customUri.toUri())

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .padding(16.dp)
            .background(GlanceTheme.colors.background)
            .clickable(actionStartActivity(intent))
    ) {
        if (!isSubscribed) {
            SubscriptionRequiredView()

            return@Column
        }
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (faviconPath != null && faviconPath !== "") {
                Image(
                    provider = ImageProvider(BitmapFactory.decodeFile(faviconPath)),
                    contentDescription = null,
                    modifier = GlanceModifier.size(imageSize, imageSize)
                        .cornerRadius(imageSize / 2)
                )
            } else {
                Box(
                    modifier = GlanceModifier
                        .size(imageSize)
                        .cornerRadius(imageSize / 2)
                        .background(backgroundSecondary)
                ) {}
            }
            if (project != null) {
                Text(
                    text = project.projectName,
                    style = TextStyle(
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = GlanceTheme.colors.onSurface
                    ),
                    modifier = GlanceModifier
                        .padding(start = 8.dp),
                    maxLines = 1
                )
            }
        }
        Row(
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            verticalAlignment = Alignment.Vertical.CenterVertically,
            modifier = GlanceModifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            if (firewallData != null) {
                StatColumn(firewallData.allowed, "Allowed", GlanceTheme.colors.primary)
                StatColumn(firewallData.denied, "Denied", GlanceTheme.colors.error)
                StatColumn(firewallData.challenged, "Challenged", GlanceTheme.colors.outline)
            } else {
                LoadingView()
            }
        }
    }
}

@Composable
fun StatColumn(value: Int?, label: String, color: ColorProvider) {
    Column(
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
        modifier = GlanceModifier
            .padding(horizontal = 10.dp),
    ) {
        Text(
            text = formatNumber(value),
            style = TextStyle(
                color = GlanceTheme.colors.onSurface,
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold
            )
        )
        Text(
            text = label,
            style = TextStyle(
                color = color,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 200, heightDp = 160)
@Composable
fun MediumFirewallWidgetContentPreview1() {
    MediumFirewallWidgetContent()
}
