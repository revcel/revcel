package com.revcel.mobile

import AnalyticsTimeseries
import AnalyticsWidgetData
import ConnectionTeam
import ProjectListItem
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
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
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import com.google.gson.Gson
import androidx.glance.LocalContext
import androidx.glance.layout.ContentScale

class MediumAnalyticsWidget: GlanceAppWidget() {
    override val sizeMode = SizeMode.Single

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            RevcelGlanceTheme {
                MediumAnalyticsWidgetContent()
            }
        }
    }
}

@Composable
fun MediumAnalyticsWidgetContent() {
    val context = LocalContext.current
    val state = currentState<Preferences>()
    val isSubscribed = state[MediumAnalyticsWidgetReceiver.isSubscribedValueKey] ?: false
    val rawProject = state[MediumAnalyticsWidgetReceiver.selectedProjectKey]
    val faviconPath = state[MediumAnalyticsWidgetReceiver.faviconPathKey]
    val project = Gson().fromJson(rawProject, ProjectListItem::class.java) ?: null
    val rawAnalyticsData = state[MediumAnalyticsWidgetReceiver.analyticsDataKey]
    val analyticsData = Gson().fromJson(rawAnalyticsData, AnalyticsWidgetData::class.java) ?: null
    
    MediumAnalyticsWidgetUI(
        project = project,
        analyticsData = analyticsData,
        faviconPath = faviconPath,
        isSubscribed = isSubscribed
    )
}

@Composable
fun MediumAnalyticsWidgetUI(
    project: ProjectListItem?,
    analyticsData: AnalyticsWidgetData?,
    faviconPath: String?,
    isSubscribed: Boolean
) {
    val context = LocalContext.current
    val customUri = getAppUrl(project, isSubscribed)
    val intent = Intent(Intent.ACTION_VIEW, customUri.toUri())

    if (project == null || analyticsData == null || !isSubscribed) {
        return Column(
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
            LoadingView()

            return@Column
        }
    }

    val chartImagePath = remember {
        val bitmap = ChartGenerator.generateBitmap(context, analyticsData.data)
        ChartGenerator.saveBitmap(context, bitmap)
    }

    if (!analyticsData.isEnabled || !analyticsData.hasData) {
        return Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .padding(16.dp)
                .background(GlanceTheme.colors.background)
                .clickable(actionStartActivity(intent)),
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            Text(
                text = "No analytics data available",
                style = TextStyle(
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = GlanceTheme.colors.onSurface
                ),
            )
        }
    }

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.background)
    ) {
        Column(
            modifier = GlanceModifier
                .padding(top = 40.dp)
        ) {
            Image(
                provider = ImageProvider(BitmapFactory.decodeFile(chartImagePath)),
                contentDescription = "Device chart",
                modifier = GlanceModifier
                    .padding(0.dp)
                    .fillMaxSize(),
                contentScale = ContentScale.FillBounds
            )
        }
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .padding(16.dp)
                .clickable(actionStartActivity(intent))
        ) {
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                ProjectFavicon(faviconPath)
                
                Text(
                    text = project.projectName,
                    style = TextStyle(
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = GlanceTheme.colors.onSurface
                    ),
                    modifier = GlanceModifier
                        .padding(horizontal = 8.dp),
                    maxLines = 1
                )
                Spacer(modifier = GlanceModifier.defaultWeight())
                Text(
                    text = "${analyticsData.visitorsNumber} Visitors",
                    style = TextStyle(
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = GlanceTheme.colors.onSurface
                    )
                )
            }
        }
    }
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 500, heightDp = 200)
@Composable
fun MediumAnalyticsWidgetContentPreview1() {
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
        
        val mockTimeseriesData = arrayOf(
            AnalyticsTimeseries(key = "2024-01-01", total = 10, devices = 5, bounceRate = 20),
            AnalyticsTimeseries(key = "2024-01-02", total = 20, devices = 10, bounceRate = 25),
            AnalyticsTimeseries(key = "2024-01-03", total = 15, devices = 8, bounceRate = 15),
            AnalyticsTimeseries(key = "2024-01-04", total = 30, devices = 15, bounceRate = 30),
            AnalyticsTimeseries(key = "2024-01-05", total = 25, devices = 12, bounceRate = 20),
            AnalyticsTimeseries(key = "2024-01-06", total = 35, devices = 18, bounceRate = 22),
            AnalyticsTimeseries(key = "2024-01-07", total = 40, devices = 20, bounceRate = 18)
        )
        
        val mockAnalyticsData = AnalyticsWidgetData(
            visitorsNumber = 1234,
            isEnabled = true,
            hasData = true,
            data = mockTimeseriesData
        )
        
        MediumAnalyticsWidgetUI(
            project = mockProject,
            analyticsData = mockAnalyticsData,
            faviconPath = null,
            isSubscribed = true
        )
    }
}
