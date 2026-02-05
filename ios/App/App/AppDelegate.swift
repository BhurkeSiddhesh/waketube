import UIKit
import Capacitor
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Register alarm notification category with actions
        let dismissAction = UNNotificationAction(
            identifier: "DISMISS_ALARM",
            title: "Dismiss",
            options: [.foreground]
        )
        
        let alarmCategory = UNNotificationCategory(
            identifier: "WAKETUBE_ALARM",
            actions: [dismissAction],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([alarmCategory])
        
        return true
    }
    
    // Handle notification when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
        
        // Also trigger the alarm in the web app
        notifyWebApp(with: notification.request.content.userInfo)
    }
    
    // Handle notification tap
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        // User tapped on notification, trigger alarm in web app
        notifyWebApp(with: response.notification.request.content.userInfo)
        completionHandler()
    }
    
    private func notifyWebApp(with userInfo: [AnyHashable: Any]) {
        guard let alarmId = userInfo["alarmId"] as? String else { return }
        let label = userInfo["label"] as? String ?? ""
        let youtubeUrl = userInfo["youtubeUrl"] as? String ?? ""
        
        // Create JavaScript event data
        let eventData: [String: Any] = [
            "alarmId": alarmId,
            "label": label,
            "youtubeUrl": youtubeUrl
        ]
        
        // Convert to JSON string
        if let jsonData = try? JSONSerialization.data(withJSONObject: eventData),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            // Trigger event in web app
            DispatchQueue.main.async {
                if let bridge = (self.window?.rootViewController as? CAPBridgeViewController)?.bridge {
                    bridge.triggerWindowJSEvent(eventName: "alarmTriggered", data: jsonString)
                }
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
