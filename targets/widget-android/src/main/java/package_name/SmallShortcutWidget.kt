package com.revcel.mobile

import ProjectListItem
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import android.graphics.BitmapFactory
import androidx.glance.Image
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.action.clickable
import androidx.glance.layout.Column
import androidx.glance.layout.Box
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import androidx.glance.appwidget.SizeMode
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.datastore.preferences.core.Preferences
import androidx.glance.ImageProvider
import androidx.glance.appwidget.cornerRadius
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.size
import androidx.glance.text.TextAlign
import com.google.gson.Gson

class SmallShortcutWidget: GlanceAppWidget() {
	companion object {
        private val SMALL = DpSize(100.dp, 56.dp)
    }

    override val sizeMode = SizeMode.Responsive(
        setOf(
            SMALL
        )
    )
	
    override var stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

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
    val imageSize = 42.dp
    val state = currentState<Preferences>()
    val rawProject = state[SmallShortcutWidgetReceiver.selectedProjectKey]
    val faviconPath = state[SmallShortcutWidgetReceiver.faviconPathKey]
    val project = Gson().fromJson(rawProject, ProjectListItem::class.java)
    val customUri = "revcel://projects/${project.id}/(tabs)/home"
    val intent = Intent(Intent.ACTION_VIEW, customUri.toUri())

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = GlanceModifier
            .fillMaxSize()
            .padding(16.dp)
            .background(GlanceTheme.colors.background)
            .clickable(actionStartActivity(intent))
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
                fontSize = 16.sp,
                color = GlanceTheme.colors.onSurface
            ),
            modifier = GlanceModifier
                .padding(top = 8.dp),
            maxLines = 1
        )
    }
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 200, heightDp = 160)
@Composable
fun SmallShortcutWidgetContentPreview1() {
    SmallShortcutWidgetContent()
}
