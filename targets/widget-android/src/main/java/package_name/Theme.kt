package com.revcel.mobile
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.glance.GlanceComposable
import androidx.glance.GlanceTheme
import androidx.glance.material3.ColorProviders

// shared colors
val errorColor = Color(0xFFEF4444)
var warningColor = Color(0xFFF59E0B)
val successColor = Color(0xFF4ADE80)
val buttonColor = Color(0xFF1A98FF)
val whiteColor = Color(0xFFFFFFFF)
val buttonInactiveColor = Color(0xFF73B8F8)

// light colors
private val LightColorPalette = lightColorScheme(
    background = Color(0xFF0A0A0A),
    onSurface = Color(0xFFEDEDED)
)

// dark colors
private val DarkColorPalette = darkColorScheme(
    background = Color(0xFF0A0A0A),
    onSurface = Color(0xFFEDEDED)
)

private val GlanceColors = ColorProviders(
    light = LightColorPalette,
    dark = DarkColorPalette
)

private val LightTypography = Typography(
    titleLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        color = LightColorPalette.onSurface
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 20.sp,
        color = LightColorPalette.onSurface
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        color = LightColorPalette.onSurface
    )
)

private val DarkTypography = Typography(
    titleLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        color = DarkColorPalette.onSurface
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 20.sp,
        color = DarkColorPalette.onSurface
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        color = DarkColorPalette.onSurface
    )
)


@Composable
fun RevcelMaterialTheme(
    // TODO: If we need support for light theme
    // darkTheme: Boolean = isSystemInDarkTheme(),
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColorPalette else LightColorPalette
    val typography = if (darkTheme) DarkTypography else LightTypography

    MaterialTheme(
        colorScheme = colors,
        typography = typography,
        content = content
    )
}

@Composable
@GlanceComposable
fun RevcelGlanceTheme(
    content: @Composable () -> Unit
) {
    GlanceTheme(
        colors = GlanceColors,
        content = content
    )
}
