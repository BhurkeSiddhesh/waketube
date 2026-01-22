import { registerPlugin } from '@capacitor/core';

export interface AlarmData {
    id: string;
    timestampMs: number;
    label: string;
    youtubeUrl: string;
}

export interface ScheduleResult {
    success: boolean;
    needsPermission?: boolean;
}

export interface PermissionResult {
    granted: boolean;
}

export interface BatteryOptimizationResult {
    isIgnoringOptimizations: boolean;
}

export interface AlarmSchedulerPlugin {
    /**
     * Schedule an alarm to trigger at the specified time
     */
    scheduleAlarm(options: AlarmData): Promise<ScheduleResult>;

    /**
     * Cancel a scheduled alarm by ID
     */
    cancelAlarm(options: { id: string }): Promise<void>;

    /**
     * Cancel all scheduled alarms
     */
    cancelAllAlarms(): Promise<void>;

    /**
     * Check if exact alarm permission is granted (Android 12+)
     */
    checkExactAlarmPermission(): Promise<PermissionResult>;

    /**
     * Request exact alarm permission (opens settings on Android 12+)
     */
    requestExactAlarmPermission(): Promise<void>;

    /**
     * Check if app is ignoring battery optimizations (Android)
     */
    checkBatteryOptimization(): Promise<BatteryOptimizationResult>;

    /**
     * Request to ignore battery optimizations (opens settings on Android)
     */
    requestIgnoreBatteryOptimization(): Promise<void>;

    /**
     * Check notification permission (iOS)
     */
    checkNotificationPermission?(): Promise<PermissionResult>;

    /**
     * Request notification permission (iOS)
     */
    requestNotificationPermission?(): Promise<PermissionResult>;
}

// Register the native plugin
const AlarmSchedulerNative = registerPlugin<AlarmSchedulerPlugin>('AlarmScheduler');

// Detect if we're running in a native context or web
const isNative = (): boolean => {
    return typeof (window as any).Capacitor !== 'undefined' &&
        (window as any).Capacitor.isNativePlatform?.() === true;
};

// Check if running on Android
const isAndroid = (): boolean => {
    return isNative() && (window as any).Capacitor.getPlatform?.() === 'android';
};

// Check if running on iOS
const isIOS = (): boolean => {
    return isNative() && (window as any).Capacitor.getPlatform?.() === 'ios';
};

/**
 * AlarmScheduler - Cross-platform alarm scheduling
 * 
 * On Android: Uses AlarmManager for exact alarms
 * On iOS: Uses UNUserNotificationCenter for local notifications
 * On Web: Falls back to in-app timer (requires app to stay open)
 */
export const AlarmScheduler = {
    /**
     * Schedule an alarm
     */
    async scheduleAlarm(data: AlarmData): Promise<ScheduleResult> {
        if (!isNative()) {
            // Web fallback - just store in localStorage, timer handled in App.tsx
            console.log('[AlarmScheduler] Web mode - alarm will only trigger if app is open');
            return { success: true };
        }

        return AlarmSchedulerNative.scheduleAlarm(data);
    },

    /**
     * Cancel a scheduled alarm
     */
    async cancelAlarm(id: string): Promise<void> {
        if (!isNative()) {
            return; // No-op on web
        }

        return AlarmSchedulerNative.cancelAlarm({ id });
    },

    /**
     * Cancel all scheduled alarms
     */
    async cancelAllAlarms(): Promise<void> {
        if (!isNative()) {
            return; // No-op on web
        }

        return AlarmSchedulerNative.cancelAllAlarms();
    },

    /**
     * Check and request necessary permissions
     * Returns true if all needed permissions are granted
     */
    async ensurePermissions(): Promise<boolean> {
        if (!isNative()) {
            return true; // No permissions needed on web
        }

        try {
            if (isAndroid()) {
                // Check exact alarm permission (Android 12+)
                const alarmPerm = await AlarmSchedulerNative.checkExactAlarmPermission();
                if (!alarmPerm.granted) {
                    await AlarmSchedulerNative.requestExactAlarmPermission();
                    // User needs to manually enable, check again after
                    const recheckAlarm = await AlarmSchedulerNative.checkExactAlarmPermission();
                    if (!recheckAlarm.granted) {
                        return false;
                    }
                }

                // Check battery optimization
                const batteryPerm = await AlarmSchedulerNative.checkBatteryOptimization();
                if (!batteryPerm.isIgnoringOptimizations) {
                    // Prompt user but don't block
                    await AlarmSchedulerNative.requestIgnoreBatteryOptimization();
                }

                return true;
            }

            if (isIOS()) {
                // Check notification permission
                if (AlarmSchedulerNative.checkNotificationPermission) {
                    const notifPerm = await AlarmSchedulerNative.checkNotificationPermission();
                    if (!notifPerm.granted && AlarmSchedulerNative.requestNotificationPermission) {
                        const result = await AlarmSchedulerNative.requestNotificationPermission();
                        return result.granted;
                    }
                    return notifPerm.granted;
                }
            }

            return true;
        } catch (error) {
            console.error('[AlarmScheduler] Permission check failed:', error);
            return false;
        }
    },

    /**
     * Check if running in native mode (can schedule background alarms)
     */
    isNativeMode(): boolean {
        return isNative();
    },

    /**
     * Get the current platform
     */
    getPlatform(): 'android' | 'ios' | 'web' {
        if (isAndroid()) return 'android';
        if (isIOS()) return 'ios';
        return 'web';
    }
};

// Export type for alarm triggered event
export interface AlarmTriggeredEvent {
    alarmId: string;
    label: string;
    youtubeUrl: string;
}

/**
 * Listen for alarm triggered events from native layer
 */
export const onAlarmTriggered = (callback: (event: AlarmTriggeredEvent) => void): (() => void) => {
    const handler = (event: Event) => {
        const customEvent = event as CustomEvent;
        try {
            const data = typeof customEvent.detail === 'string'
                ? JSON.parse(customEvent.detail)
                : customEvent.detail;
            callback(data);
        } catch (e) {
            console.error('[AlarmScheduler] Failed to parse alarm event:', e);
        }
    };

    window.addEventListener('alarmTriggered', handler);

    // Return cleanup function
    return () => {
        window.removeEventListener('alarmTriggered', handler);
    };
};
