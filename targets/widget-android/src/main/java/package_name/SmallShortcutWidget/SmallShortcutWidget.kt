package com.revcel.mobile

import ConnectionTeam
import ProjectListItem
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.action.clickable
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import androidx.glance.appwidget.SizeMode
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.datastore.preferences.core.Preferences
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.text.TextAlign
import com.google.gson.Gson

class SmallShortcutWidget: GlanceAppWidget() {
	override val sizeMode = SizeMode.Single

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            RevcelGlanceTheme {
                SmallShortcutWidgetContent()
            }
        }
    }
}

@Composable
fun SmallShortcutWidgetContent() {
    val state = currentState<Preferences>()
    val rawProject = state[SmallShortcutWidgetReceiver.selectedProjectKey]
    val isSubscribed = state[SmallShortcutWidgetReceiver.isSubscribedValueKey] ?: false
    val faviconPath = state[SmallShortcutWidgetReceiver.faviconPathKey]
    val project = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: null
    
    SmallShortcutWidgetUI(
        project = project,
        faviconPath = faviconPath,
        isSubscribed = isSubscribed
    )
}

@Composable
fun SmallShortcutWidgetUI(
    project: ProjectListItem?,
    faviconPath: String?,
    isSubscribed: Boolean
) {
    val customUri = getAppUrl(project, isSubscribed)
    val intent = Intent(Intent.ACTION_VIEW, customUri.toUri())

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
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

        ProjectFavicon(faviconPath)
        
        if (project != null) {
            Text(
                text = project.projectName,
                style = TextStyle(
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = GlanceTheme.colors.onSurface
                ),
                modifier = GlanceModifier
                    .padding(top = 8.dp),
                maxLines = 1
            )
        }
    }
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 150, heightDp = 120)
@Composable
fun SmallShortcutWidgetContentPreview1() {
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
        
        SmallShortcutWidgetUI(
            project = mockProject,
            faviconPath = null,
            isSubscribed = true
        )
    }
}
