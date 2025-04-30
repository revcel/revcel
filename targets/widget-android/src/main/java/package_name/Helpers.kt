package com.revcel.mobile

import java.util.Date
import java.util.concurrent.TimeUnit
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

enum class Granularity(val millis: Long) {
    FIVE_MINUTES(TimeUnit.MINUTES.toMillis(5)),
    ONE_HOUR(TimeUnit.HOURS.toMillis(1))
}

enum class RoundMode {
    UP,
    DOWN
}

fun roundToGranularity(date: Date, granularity: Granularity, mode: RoundMode = RoundMode.UP): Date {
    val timeMs = date.time
    val granularityMs = granularity.millis
    val rounded = (timeMs / granularityMs) * granularityMs

    val resultMs = if (mode == RoundMode.UP) rounded else (rounded - granularityMs)
    return Date(resultMs)
}

fun convertDateToIso(date: Date): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
    sdf.timeZone = TimeZone.getTimeZone("UTC")
    return sdf.format(date)
}