package com.waketube.app

import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    
    companion object {
        private const val TAG = "MainActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Register the alarm scheduler plugin
        registerPlugin(AlarmSchedulerPlugin::class.java)
        
        super.onCreate(savedInstanceState)
        
        // Handle showing over lock screen and turning screen on
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        // Clear WebView cache to ensure fresh web assets load
        bridge?.webView?.clearCache(true)
        
        // Critical settings for Video and LocalStorage
         bridge?.webView?.settings?.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
        }

        // Handle alarm trigger intent
        handleAlarmIntent(intent)
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle alarm trigger when app is already running
        handleAlarmIntent(intent)
    }
    
    private fun handleAlarmIntent(intent: Intent?) {
        if (intent?.action == "com.waketube.app.ALARM_TRIGGERED") {
            val alarmId = intent.getStringExtra("triggered_alarm_id")
            val alarmLabel = intent.getStringExtra("triggered_alarm_label")
            val youtubeUrl = intent.getStringExtra("triggered_alarm_youtube_url")
            
            Log.d(TAG, "Received alarm intent: $alarmId - $alarmLabel")
            
            // Notify the web app about the triggered alarm
            alarmId?.let {
                bridge?.let { b ->
                    val data = com.getcapacitor.JSObject().apply {
                        put("alarmId", alarmId)
                        put("label", alarmLabel ?: "")
                        put("youtubeUrl", youtubeUrl ?: "")
                    }
                    b.triggerWindowJSEvent("alarmTriggered", data.toString())
                }
            }
        }
    }
}
