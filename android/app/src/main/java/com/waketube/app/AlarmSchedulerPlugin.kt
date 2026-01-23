package com.waketube.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray

@CapacitorPlugin(name = "AlarmScheduler")
class AlarmSchedulerPlugin : Plugin() {

    companion object {
        private const val TAG = "AlarmScheduler"
        private const val PREFS_NAME = "waketube_alarms"
        private const val ALARMS_KEY = "scheduled_alarms"
    }

    @PluginMethod
    fun scheduleAlarm(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("Missing id")
        val timestampMs = call.getLong("timestampMs") ?: return call.reject("Missing timestampMs")
        val label = call.getString("label") ?: ""
        val youtubeUrl = call.getString("youtubeUrl") ?: ""

        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Check if we can schedule exact alarms (Android 12+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!alarmManager.canScheduleExactAlarms()) {
                    val ret = JSObject()
                    ret.put("success", false)
                    ret.put("needsPermission", true)
                    call.resolve(ret)
                    return
                }
            }

            val intent = Intent(context, AlarmReceiver::class.java).apply {
                putExtra("alarm_id", id)
                putExtra("alarm_label", label)
                putExtra("alarm_youtube_url", youtubeUrl)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                id.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Use setExactAndAllowWhileIdle for reliability during Doze mode
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

            // Store alarm info for boot recovery
            storeAlarm(id, timestampMs, label, youtubeUrl)

            Log.d(TAG, "Alarm scheduled: $id at $timestampMs")
            
            val ret = JSObject()
            ret.put("success", true)
            call.resolve(ret)

        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule alarm", e)
            call.reject("Failed to schedule alarm: ${e.message}")
        }
    }

    @PluginMethod
    fun cancelAlarm(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("Missing id")

        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, AlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                id.hashCode(),
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )

            pendingIntent?.let {
                alarmManager.cancel(it)
                it.cancel()
            }

            removeStoredAlarm(id)

            Log.d(TAG, "Alarm cancelled: $id")
            call.resolve()

        } catch (e: Exception) {
            Log.e(TAG, "Failed to cancel alarm", e)
            call.reject("Failed to cancel alarm: ${e.message}")
        }
    }

    @PluginMethod
    fun cancelAllAlarms(call: PluginCall) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val alarms = getStoredAlarms()

            for (i in 0 until alarms.length()) {
                val alarm = alarms.getJSONObject(i)
                val id = alarm.getString("id")
                
                val intent = Intent(context, AlarmReceiver::class.java)
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    id.hashCode(),
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                pendingIntent?.let {
                    alarmManager.cancel(it)
                    it.cancel()
                }
            }

            clearStoredAlarms()

            Log.d(TAG, "All alarms cancelled")
            call.resolve()

        } catch (e: Exception) {
            Log.e(TAG, "Failed to cancel all alarms", e)
            call.reject("Failed to cancel all alarms: ${e.message}")
        }
    }

    @PluginMethod
    fun getAlarms(call: PluginCall) {
        try {
            val alarms = getStoredAlarms()
            val ret = JSObject()
            // Convert JSONArray to a format Capacitor can easily return to JS
            val alarmList = mutableListOf<JSObject>()
            for (i in 0 until alarms.length()) {
                val alarm = alarms.getJSONObject(i)
                val jsAlarm = JSObject()
                jsAlarm.put("id", alarm.getString("id"))
                jsAlarm.put("timestampMs", alarm.getLong("timestampMs"))
                jsAlarm.put("label", alarm.getString("label"))
                jsAlarm.put("youtubeUrl", alarm.getString("youtubeUrl"))
                alarmList.add(jsAlarm)
            }
            ret.put("alarms", com.getcapacitor.JSArray(alarmList))
            call.resolve(ret)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get alarms", e)
            call.reject("Failed to get alarms: ${e.message}")
        }
    }

    @PluginMethod
    fun checkExactAlarmPermission(call: PluginCall) {
        val ret = JSObject()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            ret.put("granted", alarmManager.canScheduleExactAlarms())
        } else {
            ret.put("granted", true) // Always granted on older versions
        }
        
        call.resolve(ret)
    }

    @PluginMethod
    fun requestExactAlarmPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to open settings: ${e.message}")
            }
        } else {
            call.resolve() // No action needed on older versions
        }
    }

    @PluginMethod
    fun checkBatteryOptimization(call: PluginCall) {
        val ret = JSObject()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            ret.put("isIgnoringOptimizations", pm.isIgnoringBatteryOptimizations(context.packageName))
        } else {
            ret.put("isIgnoringOptimizations", true)
        }
        
        call.resolve(ret)
    }

    @PluginMethod
    fun requestIgnoreBatteryOptimization(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to open settings: ${e.message}")
            }
        } else {
            call.resolve()
        }
    }

    // Persistence helpers for boot recovery
    private fun storeAlarm(id: String, timestampMs: Long, label: String, youtubeUrl: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val alarms = getStoredAlarms()
        
        // Remove existing entry if present
        val newAlarms = JSONArray()
        for (i in 0 until alarms.length()) {
            val alarm = alarms.getJSONObject(i)
            if (alarm.getString("id") != id) {
                newAlarms.put(alarm)
            }
        }
        
        // Add new entry
        val newAlarm = org.json.JSONObject().apply {
            put("id", id)
            put("timestampMs", timestampMs)
            put("label", label)
            put("youtubeUrl", youtubeUrl)
        }
        newAlarms.put(newAlarm)
        
        prefs.edit().putString(ALARMS_KEY, newAlarms.toString()).apply()
    }

    private fun removeStoredAlarm(id: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val alarms = getStoredAlarms()
        
        val newAlarms = JSONArray()
        for (i in 0 until alarms.length()) {
            val alarm = alarms.getJSONObject(i)
            if (alarm.getString("id") != id) {
                newAlarms.put(alarm)
            }
        }
        
        prefs.edit().putString(ALARMS_KEY, newAlarms.toString()).apply()
    }

    private fun getStoredAlarms(): JSONArray {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(ALARMS_KEY, "[]") ?: "[]"
        return JSONArray(json)
    }

    private fun clearStoredAlarms() {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(ALARMS_KEY).apply()
    }
}
