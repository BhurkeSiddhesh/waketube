package com.waketube.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.util.Log

/**
 * BroadcastReceiver that fires when a scheduled alarm triggers.
 * Wakes the device and launches MainActivity with alarm data.
 */
class AlarmReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "AlarmReceiver"
        private const val WAKE_LOCK_TIMEOUT = 10000L // 10 seconds
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("alarm_id") ?: return
        val alarmLabel = intent.getStringExtra("alarm_label") ?: ""
        val youtubeUrl = intent.getStringExtra("alarm_youtube_url") ?: ""

        Log.d(TAG, "Alarm triggered: $alarmId - $alarmLabel")

        // Acquire a wake lock to ensure the device stays awake
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "WakeTube::AlarmWakeLock"
        )
        wakeLock.acquire(WAKE_LOCK_TIMEOUT)

        try {
            // Create intent to launch MainActivity with alarm data
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("triggered_alarm_id", alarmId)
                putExtra("triggered_alarm_label", alarmLabel)
                putExtra("triggered_alarm_youtube_url", youtubeUrl)
                action = "com.waketube.app.ALARM_TRIGGERED"
            }

            // For Android 10+, we need special handling for background starts
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Use full-screen intent for time-critical alarms
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            }

            context.startActivity(launchIntent)

            Log.d(TAG, "Launched MainActivity for alarm: $alarmId")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch activity for alarm", e)
        } finally {
            // Wake lock will be released after timeout or explicitly if needed
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
        }
    }
}
