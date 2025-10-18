package com.revcel.mobile

import ConnectionTeam
import FirewallWidgetData
import ProjectListItem
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import androidx.datastore.preferences.core.Preferences
import androidx.glance.action.clickable
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxWidth
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.google.gson.Gson

class MediumFirewallWidget: GlanceAppWidget() {
	override val sizeMode = SizeMode.Single

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
    val state = currentState<Preferences>()
    val isSubscribed = state[MediumFirewallWidgetReceiver.isSubscribedValueKey] ?: false
    val rawProject = state[MediumFirewallWidgetReceiver.selectedProjectKey]
    val faviconPath = state[MediumFirewallWidgetReceiver.faviconPathKey]
    val rawFirewallData = state[MediumFirewallWidgetReceiver.firewallWidgetDataKey]
    val project = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: null
    val firewallData = Gson().fromJson(rawFirewallData, FirewallWidgetData::class.java) ?: null
    
    MediumFirewallWidgetUI(
        project = project,
        firewallData = firewallData,
        faviconPath = faviconPath,
        isSubscribed = isSubscribed
    )
}

@Composable
fun MediumFirewallWidgetUI(
    project: ProjectListItem?,
    firewallData: FirewallWidgetData?,
    faviconPath: String?,
    isSubscribed: Boolean
) {
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
            ProjectFavicon(faviconPath)
            
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
@Preview(widthDp = 500, heightDp = 200)
@Composable
fun MediumFirewallWidgetContentPreview1() {
    RevcelGlanceTheme {
        // Create mock data for preview
        val mockConnection = expo.modules.widgetkit.Connection().apply {
            id = "preview-connection-id"
            apiToken = "preview-token"
        }
        
        val mockConnectionTeam = ConnectionTeam(
            id = "preview-team-id",
            name = "My Team"
        )
        
        val mockProject = ProjectListItem(
            id = "preview-project-id",
            projectName = "My Project",
            connection = mockConnection,
            connectionTeam = mockConnectionTeam
        )
        
        val mockFirewallData = FirewallWidgetData(
            allowed = 1234,
            denied = 56,
            challenged = 78
        )
        
        MediumFirewallWidgetUI(
            project = mockProject,
            firewallData = mockFirewallData,
            faviconPath = null,
            isSubscribed = true
        )
    }
}
