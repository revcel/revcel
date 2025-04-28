package com.revcel.mobile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ProjectWidgetConfigurationView(
    enabled: Boolean,
    onDone: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Select project", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn(modifier = Modifier.weight(1f)) {
            // show projects
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = onDone,
            enabled = enabled,
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
