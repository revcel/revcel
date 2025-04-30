package com.revcel.mobile

import AnalyticsWidgetData
import ProjectListItem
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
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
import com.google.gson.Gson

class MediumAnalyticsWidget: GlanceAppWidget() {
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
                MediumAnalyticsWidgetContent()
            }
        }
    }
}

@Composable
fun MediumAnalyticsWidgetContent() {
    val imageSize = 42.dp
    val state = currentState<Preferences>()
    val rawProject = state[MediumAnalyticsWidgetReceiver.selectedProjectKey]
    val faviconPath = state[MediumAnalyticsWidgetReceiver.faviconPathKey]
    val project = Gson().fromJson(rawProject, ProjectListItem::class.java)
    val rawAnalyticsData = state[MediumAnalyticsWidgetReceiver.analyticsDataKey]
    val analyticsData = Gson().fromJson(rawAnalyticsData, AnalyticsWidgetData::class.java)
    val customUri = "revcel://projects/${project.id}/(tabs)/home"
    val intent = Intent(Intent.ACTION_VIEW, customUri.toUri())

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .padding(16.dp)
            .background(GlanceTheme.colors.background)
            .clickable(actionStartActivity(intent))
    ) {
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

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 200, heightDp = 160)
@Composable
fun MediumAnalyticsWidgetContentPreview1() {
    MediumAnalyticsWidgetContent()
}
