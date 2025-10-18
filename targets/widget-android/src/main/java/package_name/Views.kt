package com.revcel.mobile

import WidgetIntentState
import androidx.compose.runtime.Composable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.fillMaxSize
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import ProjectListItem

@Composable
fun SubscriptionRequiredView() {
    Box(
        contentAlignment = Alignment.Center,
        modifier = GlanceModifier
            .fillMaxSize()
    ) {
        Text(
            text = "Subscription missing, tap here to enable",
            style = TextStyle(
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = GlanceTheme.colors.onSurface
            )
        )
    }
}

@Composable
fun ProjectMultiSelectConfigurationView(
    isAuthorized: Boolean,
    state: WidgetIntentState,
    selectedProjects: List<ProjectListItem>,
    projects: List<ProjectListItem>,
    onProjectToggle: (ProjectListItem) -> Unit,
    onDone: () -> Unit,
    openApp: () -> Unit
) {
    Column(modifier = androidx.compose.ui.Modifier.fillMaxSize().padding(16.dp)) {
        if (!isAuthorized) {
            SettingsView("Unauthorized", "Open the app to connect your account", openApp)
            return@Column
        }

        if (state == WidgetIntentState.LOADING) {
            SettingsView("Loading...", "We're fetching your projects")
            return@Column
        }

        if (state == WidgetIntentState.API_FAILED) {
            SettingsView("Error", "We couldn't fetch data from Vercel", openApp)
            return@Column
        }

        if (state == WidgetIntentState.NO_PROJECTS) {
            SettingsView("No Projects", "Create a project first", openApp)
            return@Column
        }

        Text("Select up to 3 projects", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = androidx.compose.ui.Modifier.height(16.dp))
        LazyColumn(modifier = androidx.compose.ui.Modifier.weight(1f)) {
            items(projects) { project ->
                val isSelected = selectedProjects.any { it.id == project.id }
                ProjectItem(
                    project = project,
                    isSelected = isSelected,
                    onSelect = { onProjectToggle(project) }
                )
            }
        }

        Spacer(modifier = androidx.compose.ui.Modifier.height(16.dp))

        Button(
            onClick = onDone,
            enabled = selectedProjects.isNotEmpty(),
            modifier = androidx.compose.ui.Modifier.fillMaxWidth(),
            colors = ButtonColors(
                containerColor = buttonColor,
                contentColor = whiteColor,
                disabledContainerColor = buttonInactiveColor,
                disabledContentColor = whiteColor
            )
        ) {
            Text(
                text = "Done",
                color = whiteColor
            )
        }
    }
}

@Composable
fun LoadingView() {
    Box(
        contentAlignment = Alignment.Center,
        modifier = GlanceModifier
            .fillMaxSize()
    ) {
        Text(
            text = "Loading data...",
            style = TextStyle(
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = GlanceTheme.colors.onSurface
            )
        )
    }
}