package com.revcel.mobile

import AnalyticsTimeseries
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.view.View
import com.github.mikephil.charting.charts.LineChart
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet
import java.io.File
import java.io.FileOutputStream
import androidx.core.graphics.createBitmap

object ChartGenerator {
    fun generateBitmap(context: Context, data: Array<AnalyticsTimeseries>): Bitmap {
        val entries = data.mapIndexed { index, stat ->
            Entry(index.toFloat(), stat.devices.toFloat())
        }

        val dataSet = LineDataSet(entries, "Devices").apply {
            color = Color.BLUE
            setDrawValues(false)
            setDrawCircles(false)
            lineWidth = 2f
        }

        val chart = LineChart(context).apply {
            layout(0, 0, 800, 400)
            this.data = LineData(dataSet)
            axisRight.isEnabled = false
            xAxis.position = XAxis.XAxisPosition.BOTTOM
            legend.isEnabled = false
            description = null
        }

        chart.measure(
            View.MeasureSpec.makeMeasureSpec(800, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(400, View.MeasureSpec.EXACTLY)
        )
        chart.layout(0, 0, 800, 400)

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