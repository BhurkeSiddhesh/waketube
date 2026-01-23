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
        private const val WAKE_LOCK_TIMEOUT = 60000L // 1 minute (increased)
        private const val CHANNEL_ID = "waketube_alarm_channel"
        private const val NOTIFICATION_ID = 12345
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("alarm_id") ?: return
        val alarmLabel = intent.getStringExtra("alarm_label") ?: "Alarm"
        val youtubeUrl = intent.getStringExtra("alarm_youtube_url") ?: ""

        Log.d(TAG, "Alarm triggered: $alarmId - $alarmLabel")

        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "WakeTube::AlarmWakeLock"
        )
        wakeLock.acquire(WAKE_LOCK_TIMEOUT)

        try {
            // Create intent to launch MainActivity
            val fullScreenIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("triggered_alarm_id", alarmId)
                putExtra("triggered_alarm_label", alarmLabel)
                putExtra("triggered_alarm_youtube_url", youtubeUrl)
                action = "com.waketube.app.ALARM_TRIGGERED"
            }

            val pendingIntent = android.app.PendingIntent.getActivity(
                context,
                alarmId.hashCode(),
                fullScreenIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )

            // Create notification channel
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = android.app.NotificationChannel(
                    CHANNEL_ID,
                    "Alarm Notifications",
                    android.app.NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Shows when alarm goes off"
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                    setSound(null, null) // Silent because app handles sound
                    enableVibration(true)
                }
                notificationManager.createNotificationChannel(channel)
            }

            // Build high-priority notification
            val builder = androidx.core.app.NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("WakeTube Alarm")
                .setContentText(alarmLabel)
                .setPriority(androidx.core.app.NotificationCompat.PRIORITY_MAX)
                .setCategory(androidx.core.app.NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(pendingIntent, true) // CRITICAL: This launches the activity
                .setAutoCancel(true)
                .setOngoing(true)

            // Post notification
            notificationManager.notify(NOTIFICATION_ID, builder.build())

            Log.d(TAG, "Posted full-screen notification for alarm: $alarmId")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle alarm receive", e)
        } finally {
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
        }
    }
}
