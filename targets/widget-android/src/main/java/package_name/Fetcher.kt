package com.revcel.mobile

import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import com.google.gson.Gson
import expo.modules.widgetkit.Connection

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
    val connection: Connection
)

suspend fun fetch(params: FetchParams): ByteArray = withContext(Dispatchers.IO) {
    if (!params.url.startsWith("/")) {
        throw Exception("URL should start with /")
    }

    val fullUrlString = "https://api.vercel.com" + params.url
    val url = URL(fullUrlString)

    val connection = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = params.method.value
        setRequestProperty("Accept", "application/json")
        setRequestProperty("Bearer " + params.connection.apiToken, "Authorization")
        connectTimeout = 15000
        readTimeout = 15000
    }

    try {
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
