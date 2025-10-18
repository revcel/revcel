package com.revcel.mobile

import TeamProjectItem
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import androidx.datastore.preferences.core.Preferences
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.provideContent
import androidx.glance.action.clickable
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Column
import androidx.glance.layout.Alignment
import androidx.glance.layout.Row
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.compose.ui.unit.sp
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import com.google.gson.Gson

class LargeTeamProjectsWidget: GlanceAppWidget() {
	override val sizeMode = SizeMode.Single

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            RevcelGlanceTheme {
                LargeTeamProjectsWidgetContent()
            }
        }
    }
}

@Composable
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
    // createdAt is in milliseconds, no conversion needed for Java Date
    val date = java.util.Date(createdAt)
    val sdf = java.text.SimpleDateFormat("dd/MM/yyyy", java.util.Locale.getDefault())
    return sdf.format(date)
}

@Composable
fun TeamProjectRow(item: TeamProjectItem) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = GlanceModifier
            .fillMaxWidth()
            .padding(vertical = 10.dp)
    ) {
        ProjectFavicon(item.faviconPath, imageSize = 48.dp)
        
        Column(
            modifier = GlanceModifier
                .defaultWeight()
                .padding(start = 12.dp)
        ) {
            Text(
                text = item.name,
                style = TextStyle(
                    color = GlanceTheme.colors.onSurface,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                ),
                maxLines = 1
            )
            Row {
                Text(
                    text = formatDate(item.createdAt),
                    style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 18.sp),
                    maxLines = 1
                )
                Text(text = " • ", style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 18.sp))
                Text(
                    text = item.commitMessage ?: "Manual deploy",
                    style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 18.sp),
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

@Composable
fun LargeTeamProjectsWidgetContent() {
    val state = currentState<Preferences>()
    val isSubscribed = state[LargeTeamProjectsWidgetReceiver.isSubscribedValueKey] ?: false
    val rawItems = state[LargeTeamProjectsWidgetReceiver.itemsKey] ?: "[]"
    val items = Gson().fromJson(rawItems, Array<TeamProjectItem>::class.java) ?: emptyArray()
    
    LargeTeamProjectsWidgetUI(
        items = items.toList(),
        isSubscribed = isSubscribed
    )
}

@Composable
fun LargeTeamProjectsWidgetUI(
    items: List<TeamProjectItem>,
    isSubscribed: Boolean
) {
    val intent = Intent(Intent.ACTION_VIEW, getAppUrl(null, isSubscribed).toUri())

    if (!isSubscribed) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .padding(horizontal = 12.dp, vertical = 8.dp)
                .background(GlanceTheme.colors.background)
                .clickable(actionStartActivity(intent)),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            SubscriptionRequiredView()
        }
        return
    }

    LazyColumn(
        modifier = GlanceModifier
            .fillMaxSize()
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .background(GlanceTheme.colors.background)
    ) {
        items(items.take(6).size) { index ->
            val item = items[index]
            TeamProjectRow(item)
        }
    }
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 500, heightDp = 350)
@Composable
fun LargeTeamProjectsWidgetContentPreview1() {
    RevcelGlanceTheme {
        // Create mock data for preview
        val mockProjects = listOf(
            TeamProjectItem(
                id = "deployment-1",
                projectId = "project-1",
                name = "My Website",
                commitMessage = "Fix navigation bug",
                createdAt = System.currentTimeMillis() - 86400000, // 1 day ago
                status = "READY",
                faviconPath = null
            ),
            TeamProjectItem(
                id = "deployment-2",
                projectId = "project-2",
                name = "API Server",
                commitMessage = "Add new endpoint",
                createdAt = System.currentTimeMillis() - 172800000, // 2 days ago
                status = "BUILDING",
                faviconPath = null
            ),
            TeamProjectItem(
                id = "deployment-3",
                projectId = "project-3",
                name = "Dashboard",
                commitMessage = "Update dependencies",
                createdAt = System.currentTimeMillis() - 259200000, // 3 days ago
                status = "READY",
                faviconPath = null
            ),
            TeamProjectItem(
                id = "deployment-4",
                projectId = "project-4",
                name = "Mobile App",
                commitMessage = null,
                createdAt = System.currentTimeMillis() - 345600000, // 4 days ago
                status = "ERROR",
                faviconPath = null
            )
        )
        
        LargeTeamProjectsWidgetUI(
            items = mockProjects,
            isSubscribed = true
        )
    }
}
