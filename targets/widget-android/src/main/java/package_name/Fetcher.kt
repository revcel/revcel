package com.revcel.mobile

import ProjectListItem
import android.content.Context
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import com.google.gson.Gson
import expo.modules.widgetkit.Connection
import java.io.File
import java.io.OutputStreamWriter

enum class HTTPMethod(val value: String) {
    GET("GET"),
    POST("POST"),
    PUT("PUT"),
    PATCH("PATCH"),
    DELETE("DELETE")
}

data class FetchParams(
    val method: HTTPMethod,
    val url: String,
    val connection: Connection,
    val body: String? = null,
    val baseUrl: String? = null
)

// MARK: favicons
//
// Vercel removed `vercel.com/api/v0/deployments/<id>/favicon`, and raw deployment URLs sit behind
// Deployment Protection (every path answers with a 200 HTML login page). The icon is therefore
// resolved from the production domain: the page's declared icon first, then the conventional
// paths, accepting only image responses. Mirrors `lib/favicon.ts` in the app.

private const val FAVICON_CACHE_MAX_AGE_MS = 24L * 60 * 60 * 1000
private val FAVICON_FALLBACK_PATHS = listOf("/favicon.ico", "/favicon.png", "/apple-touch-icon.png")
// Deployment Protection redirects to vercel.com/sso-api and then to vercel.com/login
private const val PROTECTION_HOST = "vercel.com"
private val PROTECTION_MARKERS = listOf("/sso-api", "_vercel_sso")
private val LINK_TAG_REGEX = Regex("<link\\b[^>]*>", RegexOption.IGNORE_CASE)
private val REL_ATTR_REGEX = Regex("\\brel=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)
private val HREF_ATTR_REGEX = Regex("\\bhref=[\"']([^\"']+)[\"']", RegexOption.IGNORE_CASE)

private fun openWebsiteConnection(url: String): HttpURLConnection =
    (URL(url).openConnection() as HttpURLConnection).apply {
        requestMethod = HTTPMethod.GET.value
        instanceFollowRedirects = true
        connectTimeout = 15000
        readTimeout = 15000
        // arbitrary websites, some of which reject an empty user agent
        setRequestProperty("User-Agent", "Mozilla/5.0 (compatible; RevcelWidget)")
    }

private fun faviconFile(context: Context, projectId: String) = File(context.filesDir, "favicon-$projectId")

/** Path of the cached icon when it is younger than a day. */
private fun cachedFaviconPath(context: Context, projectId: String): String? {
    val file = faviconFile(context, projectId)
    val isFresh = file.exists() && file.length() > 0 &&
        System.currentTimeMillis() - file.lastModified() < FAVICON_CACHE_MAX_AGE_MS
    return if (isFresh) file.path else null
}

// BitmapFactory cannot render SVG, and a protection page is text/html
private fun isRenderableImage(connection: HttpURLConnection): Boolean {
    val type = connection.contentType?.lowercase() ?: return false
    return connection.responseCode in 200..299 && type.startsWith("image/") && !type.contains("svg")
}

/** Downloads `url` into `target` when it is an image, atomically via a temp file. */
private fun downloadImage(url: String, target: File): Boolean {
    val connection = try { openWebsiteConnection(url) } catch (e: Exception) { return false }
    var temp: File? = null
    try {
        connection.connect()
        if (!isRenderableImage(connection)) return false

        // several widgets may refresh the same project at once, never write the target directly
        val tempFile = File.createTempFile(target.name, null, target.parentFile)
        temp = tempFile
        connection.inputStream.use { input -> tempFile.outputStream().use { output -> input.copyTo(output) } }

        return tempFile.length() > 0 && tempFile.renameTo(target)
    } catch (e: Exception) {
        return false
    } finally {
        temp?.takeIf { it.exists() }?.delete()
        connection.disconnect()
    }
}

/** The page html and the host that finally served it (after redirects). */
private fun fetchHtml(url: String): Pair<String, String>? {
    val connection = try { openWebsiteConnection(url) } catch (e: Exception) { return null }
    try {
        connection.connect()
        val type = connection.contentType?.lowercase() ?: ""
        if (connection.responseCode !in 200..299 || !type.contains("text/html")) return null
        val html = connection.inputStream.bufferedReader().use { it.readText() }
        return html to (connection.url.host?.lowercase() ?: "")
    } catch (e: Exception) {
        return null
    } finally {
        connection.disconnect()
    }
}

private fun isProtectionPage(finalHost: String, html: String): Boolean =
    finalHost == PROTECTION_HOST ||
        finalHost.endsWith(".$PROTECTION_HOST") ||
        PROTECTION_MARKERS.any { html.contains(it) }

/** Icon hrefs declared in the page head, SVGs skipped. Touch icons last: they are often 1 MB PNGs. */
fun extractIconHrefs(html: String): List<String> {
    val touchIcons = mutableListOf<String>()
    val icons = mutableListOf<String>()

    for (tag in LINK_TAG_REGEX.findAll(html)) {
        val rel = REL_ATTR_REGEX.find(tag.value)?.groupValues?.get(1)?.lowercase() ?: continue
        val href = HREF_ATTR_REGEX.find(tag.value)?.groupValues?.get(1) ?: continue

        if (!rel.contains("icon") || rel.contains("mask-icon")) continue
        if (href.lowercase().substringBefore('?').endsWith(".svg")) continue

        if (rel.contains("apple-touch-icon")) touchIcons.add(href) else icons.add(href)
    }

    return icons + touchIcons
}

private fun resolveHref(base: String, href: String): String = when {
    href.startsWith("http://") || href.startsWith("https://") -> href
    href.startsWith("//") -> "https:$href"
    href.startsWith("/") -> "$base$href"
    else -> "$base/$href"
}

/** Downloads the favicon of `host` and returns the file path. Refuses Vercel's protection page. */
private suspend fun downloadWebsiteFavicon(context: Context, host: String, projectId: String): String? =
    withContext(Dispatchers.IO) {
        val base = "https://$host"
        val candidates = mutableListOf<String>()

        val page = fetchHtml(base)
        if (page != null) {
            val (html, finalHost) = page
            if (isProtectionPage(finalHost, html)) return@withContext null
            candidates += extractIconHrefs(html).take(3).map { resolveHref(base, it) }
        }
        candidates += FAVICON_FALLBACK_PATHS.map { "$base$it" }

        val target = faviconFile(context, projectId)
        for (candidate in candidates) {
            if (downloadImage(candidate, target)) return@withContext target.path
        }

        null
    }

/**
 * Favicon path for a project, cached for a day. Pass the production domain when the caller
 * already has it (from `production-deployment`), otherwise it is fetched.
 */
suspend fun fetchProjectFavicon(context: Context, project: ProjectListItem, productionDomain: String? = null): String? {
    cachedFaviconPath(context, project.id)?.let { return it }

    val host = productionDomain ?: try {
        fetchProductionDeployment(project.connection, project.connectionTeam, project.id).domain?.name
    } catch (e: Exception) {
        null
    }
    if (host.isNullOrEmpty()) return null

    return downloadWebsiteFavicon(context, host, project.id)
}

suspend fun fetch(params: FetchParams): ByteArray = withContext(Dispatchers.IO) {
    val isPOSTRequest = params.body !== null && params.method === HTTPMethod.POST

    if (!params.url.startsWith("/")) {
        throw Exception("URL should start with /")
    }

    val fullUrlString = if (params.baseUrl !== null) "${params.baseUrl}${params.url}" else "https://api.vercel.com${params.url}"
    val url = URL(fullUrlString)

    val connection = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = params.method.value
        setRequestProperty("User-Agent", "")
        setRequestProperty("Accept", "application/json")
        setRequestProperty("Authorization", "Bearer ${params.connection.apiToken}")
        connectTimeout = 15000
        readTimeout = 15000
    }

    try {
        if (isPOSTRequest) {
            connection.doOutput = true
            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(params.body)
                writer.flush()
            }
        }

        connection.connect()
        val responseCode = connection.responseCode

        if (responseCode !in 200..299) {
            val errorMsg = connection.errorStream?.bufferedReader()?.use { it.readText() }
                ?: "HTTP Error: $responseCode"

            throw Exception("HTTP Error: $responseCode. $errorMsg")
        }

        connection.inputStream.use { input ->
            val buffer = ByteArrayOutputStream()
            val data = ByteArray(1024)
            var nRead: Int
            while (input.read(data, 0, data.size).also { nRead = it } != -1) {
                buffer.write(data, 0, nRead)
            }
            buffer.toByteArray()
        }
    } finally {
        connection.disconnect()
    }
}

suspend inline fun <reified T> httpRequest(params: FetchParams): T {
    val data = fetch(params)
    val json = String(data, Charsets.UTF_8)

    return Gson().fromJson(json, T::class.java)
}
