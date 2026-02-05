package com.waketube.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray

/**
 * BroadcastReceiver that re-schedules all alarms after device reboot.
 * This is necessary because AlarmManager alarms are cleared on reboot.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
        private const val PREFS_NAME = "waketube_alarms"
        private const val ALARMS_KEY = "scheduled_alarms"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        Log.d(TAG, "Device booted, re-scheduling alarms")

        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = prefs.getString(ALARMS_KEY, "[]") ?: "[]"
            val alarms = JSONArray(json)

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val now = System.currentTimeMillis()
            var rescheduledCount = 0

            for (i in 0 until alarms.length()) {
                val alarm = alarms.getJSONObject(i)
                val id = alarm.getString("id")
                val timestampMs = alarm.getLong("timestampMs")
                val label = alarm.optString("label", "")
                val youtubeUrl = alarm.optString("youtubeUrl", "")

                // Only reschedule future alarms
                if (timestampMs > now) {
                    val alarmIntent = Intent(context, AlarmReceiver::class.java).apply {
                        putExtra("alarm_id", id)
                        putExtra("alarm_label", label)
                        putExtra("alarm_youtube_url", youtubeUrl)
                    }

                    val pendingIntent = PendingIntent.getBroadcast(
                        context,
                        id.hashCode(),
                        alarmIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            timestampMs,
                            pendingIntent
                        )
                    } else {
                        alarmManager.setExact(
                            AlarmManager.RTC_WAKEUP,
                            timestampMs,
                            pendingIntent
                        )
                    }

                    rescheduledCount++
                    Log.d(TAG, "Re-scheduled alarm: $id at $timestampMs")
                }
            }

            Log.d(TAG, "Re-scheduled $rescheduledCount alarms after boot")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to re-schedule alarms after boot", e)
        }
    }
}
