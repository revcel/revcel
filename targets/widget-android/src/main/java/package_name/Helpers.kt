package com.revcel.mobile

import java.util.Date
import java.util.concurrent.TimeUnit

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