package com.revcel.mobile

import AnalyticsTimeseries
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import com.github.mikephil.charting.charts.LineChart
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet
import java.io.File
import java.io.FileOutputStream
import androidx.core.graphics.createBitmap
import androidx.core.graphics.toColorInt

object ChartGenerator {
    fun generateBitmap(context: Context, data: Array<AnalyticsTimeseries>): Bitmap {
        val entries = data.mapIndexed { index, stat ->
            Entry(index.toFloat(), stat.devices.toFloat())
        }

        val dataSet = LineDataSet(entries, "Devices").apply {
            color = "#006EFE".toColorInt()
            setDrawValues(false)
            setDrawCircles(false)
            lineWidth = 2f

            setDrawFilled(true)
            fillColor = "#06193A".toColorInt()
        }

        val chart = LineChart(context).apply {
            setPadding(0, 0, 0, 0)
            setViewPortOffsets(0f, 0f, 0f, 0f)
            layout(0, 0, 800, 400)
            this.data = LineData(dataSet)

            axisLeft.axisMinimum = 0f
            description.isEnabled = false
            legend.isEnabled = false
            axisLeft.isEnabled = false
            axisRight.isEnabled = false
            xAxis.isEnabled = false
            setDrawGridBackground(false)
            setDrawBorders(false)
            setBackgroundColor(Color.TRANSPARENT)
        }

        return createBitmap(800, 400).apply {
            val canvas = Canvas(this)
            chart.draw(canvas)
        }
    }

    fun saveBitmap(context: Context, bitmap: Bitmap): String {
        val fileName = "chart.png"
        val file = File(context.cacheDir, fileName)
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }

        return file.path
    }
}