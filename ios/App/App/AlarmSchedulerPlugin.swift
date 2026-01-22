import Foundation
import Capacitor
import UserNotifications

@objc(AlarmSchedulerPlugin)
public class AlarmSchedulerPlugin: CAPPlugin, CAPBridgedPlugin {
    
    public let identifier = "AlarmSchedulerPlugin"
    public let jsName = "AlarmScheduler"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "scheduleAlarm", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelAlarm", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelAllAlarms", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkNotificationPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestNotificationPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkExactAlarmPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestExactAlarmPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkBatteryOptimization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestIgnoreBatteryOptimization", returnType: CAPPluginReturnPromise)
    ]
    
    private let notificationCenter = UNUserNotificationCenter.current()
    private let alarmsKey = "waketube_scheduled_alarms"
    
    @objc func scheduleAlarm(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing id")
            return
        }
        guard let timestampMs = call.getDouble("timestampMs") else {
            call.reject("Missing timestampMs")
            return
        }
        let label = call.getString("label") ?? ""
        let youtubeUrl = call.getString("youtubeUrl") ?? ""
        
        // Convert milliseconds to Date
        let triggerDate = Date(timeIntervalSince1970: timestampMs / 1000.0)
        
        // Create notification content
        let content = UNMutableNotificationContent()
        content.title = "WakeTube Alarm"
        content.body = label.isEmpty ? "Time to wake up!" : label
        content.sound = UNNotificationSound.defaultCritical
        content.categoryIdentifier = "WAKETUBE_ALARM"
        content.userInfo = [
            "alarmId": id,
            "label": label,
            "youtubeUrl": youtubeUrl
        ]
        
        // Create trigger based on date
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: triggerDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        
        // Create request
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        
        notificationCenter.add(request) { [weak self] error in
            if let error = error {
                call.reject("Failed to schedule alarm: \(error.localizedDescription)")
                return
            }
            
            // Store alarm for reference
            self?.storeAlarm(id: id, timestampMs: timestampMs, label: label, youtubeUrl: youtubeUrl)
            
            call.resolve([
                "success": true
            ])
        }
    }
    
    @objc func cancelAlarm(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing id")
            return
        }
        
        notificationCenter.removePendingNotificationRequests(withIdentifiers: [id])
        removeStoredAlarm(id: id)
        
        call.resolve()
    }
    
    @objc func cancelAllAlarms(_ call: CAPPluginCall) {
        notificationCenter.removeAllPendingNotificationRequests()
        clearStoredAlarms()
        
        call.resolve()
    }
    
    @objc func checkNotificationPermission(_ call: CAPPluginCall) {
        notificationCenter.getNotificationSettings { settings in
            call.resolve([
                "granted": settings.authorizationStatus == .authorized
            ])
        }
    }
    
    @objc func requestNotificationPermission(_ call: CAPPluginCall) {
        notificationCenter.requestAuthorization(options: [.alert, .sound, .badge, .criticalAlert]) { granted, error in
            if let error = error {
                call.reject("Failed to request permission: \(error.localizedDescription)")
                return
            }
            call.resolve([
                "granted": granted
            ])
        }
    }
    
    // These methods are Android-specific, but we provide no-ops for cross-platform compatibility
    @objc func checkExactAlarmPermission(_ call: CAPPluginCall) {
        // iOS doesn't have exact alarm restrictions like Android 12+
        call.resolve(["granted": true])
    }
    
    @objc func requestExactAlarmPermission(_ call: CAPPluginCall) {
        // No-op on iOS
        call.resolve()
    }
    
    @objc func checkBatteryOptimization(_ call: CAPPluginCall) {
        // iOS handles this automatically, always return true
        call.resolve(["isIgnoringOptimizations": true])
    }
    
    @objc func requestIgnoreBatteryOptimization(_ call: CAPPluginCall) {
        // No-op on iOS
        call.resolve()
    }
    
    // MARK: - Persistence helpers
    
    private func storeAlarm(id: String, timestampMs: Double, label: String, youtubeUrl: String) {
        var alarms = getStoredAlarms()
        
        // Remove existing entry
        alarms.removeAll { ($0["id"] as? String) == id }
        
        // Add new entry
        alarms.append([
            "id": id,
            "timestampMs": timestampMs,
            "label": label,
            "youtubeUrl": youtubeUrl
        ])
        
        UserDefaults.standard.set(alarms, forKey: alarmsKey)
    }
    
    private func removeStoredAlarm(id: String) {
        var alarms = getStoredAlarms()
        alarms.removeAll { ($0["id"] as? String) == id }
        UserDefaults.standard.set(alarms, forKey: alarmsKey)
    }
    
    private func getStoredAlarms() -> [[String: Any]] {
        return UserDefaults.standard.array(forKey: alarmsKey) as? [[String: Any]] ?? []
    }
    
    private func clearStoredAlarms() {
        UserDefaults.standard.removeObject(forKey: alarmsKey)
    }
}
