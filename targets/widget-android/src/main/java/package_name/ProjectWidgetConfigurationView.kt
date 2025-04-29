package com.revcel.mobile

import ProjectListItem
import WidgetIntentState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ProjectWidgetConfigurationView(
    isAuthorized: Boolean,
    state: WidgetIntentState,
    selectedProject: ProjectListItem?,
    projects: List<ProjectListItem>,
    onProjectSelected: (ProjectListItem) -> Unit,
    onDone: () -> Unit,
    openApp: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        if (!isAuthorized) {
            SettingsView("Unauthorized", "Sign in with Revcel app", openApp)
            return@Column
        }

        if (state == WidgetIntentState.LOADING) {
            SettingsView("Loading...", "We're fetching your projects")
            return@Column
        }

        if (state == WidgetIntentState.API_FAILED) {
            SettingsView("Api error", "We couldn't fetch data from api", openApp)
            return@Column
        }

        if (state == WidgetIntentState.NO_PROJECTS) {
            SettingsView("No projects", "Add your first project in Revcel app", openApp)
            return@Column
        }

        Text("Select project", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(projects) { project ->
                ProjectItem(
                    project = project,
                    isSelected = project == selectedProject,
                    onSelect = {
                        onProjectSelected(project)
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = onDone,
            enabled = selectedProject != null,
            modifier = Modifier.fillMaxWidth(),
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
fun ProjectItem(
    project: ProjectListItem,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onSelect() },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) buttonInactiveColor else MaterialTheme.colorScheme.surface
        )
    ) {
        Text(
            text = project.projectName,
            modifier = Modifier.padding(16.dp),
            style = MaterialTheme.typography.bodyLarge,
            color = if (isSelected) whiteColor else MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
fun SettingsView(title: String, description: String, openApp: (() -> Unit)? = null) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Text(
            text = description,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        if (openApp != null) {
            Button(
                onClick = openApp,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonColors(
                    containerColor = buttonColor,
                    contentColor = whiteColor,
                    disabledContainerColor = buttonInactiveColor,
                    disabledContentColor = whiteColor
                )
            ) {
                Text(
                    text = "Open Revcel App",
                    color = whiteColor
                )
            }
        }
    }
}