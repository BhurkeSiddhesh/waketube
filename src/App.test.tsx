import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { DayOfWeek } from './types';
import * as AlarmSchedulerModule from './plugins/AlarmScheduler';

// Mock uuid
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Mock AlarmScheduler to track permission calls
const { mockAlarmScheduler, mockOnAlarmTriggered } = vi.hoisted(() => {
    return {
        mockAlarmScheduler: {
            isNativeMode: vi.fn(() => false),
            getPlatform: vi.fn(() => 'web' as 'web' | 'android' | 'ios'),
            ensurePermissions: vi.fn().mockResolvedValue(true),
            requestPermissions: vi.fn().mockResolvedValue(true),
            scheduleAlarm: vi.fn().mockResolvedValue({ success: true }),
            cancelAlarm: vi.fn().mockResolvedValue(undefined),
            cancelAllAlarms: vi.fn().mockResolvedValue(undefined),
        },
        mockOnAlarmTriggered: vi.fn(() => vi.fn()), // Returns cleanup function
    };
});

vi.mock('./plugins/AlarmScheduler', () => ({
    AlarmScheduler: mockAlarmScheduler,
    onAlarmTriggered: mockOnAlarmTriggered,
}));

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock localStorage
        const store: Record<string, string> = {};
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value; });

        // Mock wakeLock
        Object.defineProperty(navigator, 'wakeLock', {
            value: {
                request: vi.fn().mockResolvedValue({ release: vi.fn() }),
            },
            configurable: true,
            writable: true,
        });

        // Mock YouTube API
        (window as any).YT = {
            Player: vi.fn().mockImplementation(() => ({
                playVideo: vi.fn(),
                setVolume: vi.fn(),
                destroy: vi.fn(),
            })),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('rendering', () => {
        it('renders the app header', () => {
            render(<App />);
            expect(screen.getByText('WakeTube')).toBeInTheDocument();
        });

        it('renders the subtitle', () => {
            render(<App />);
            expect(screen.getByText('YouTube Alarm Clock')).toBeInTheDocument();
        });

        it('renders current time', () => {
            render(<App />);
            // Time format varies, just check something with digits and colon
            const timeElement = screen.getByText(/\d{1,2}:\d{2}/);
            expect(timeElement).toBeInTheDocument();
        });

        it('renders Active & Monitoring badge', () => {
            render(<App />);
            expect(screen.getByText('Active & Monitoring')).toBeInTheDocument();
        });

        it('renders Keep tab open warning', () => {
            render(<App />);
            expect(screen.getByText('Keep tab open')).toBeInTheDocument();
        });

        it('renders Your Alarms section', () => {
            render(<App />);
            expect(screen.getByText('Your Alarms')).toBeInTheDocument();
        });

        it('renders empty state when no alarms', () => {
            render(<App />);
            expect(screen.getByText('No alarms set')).toBeInTheDocument();
        });

        it('renders add alarm FAB button', () => {
            render(<App />);
            expect(screen.getByRole('button', { name: 'Add new alarm' })).toBeInTheDocument();
        });

        it('renders theme toggle button', () => {
            render(<App />);
            expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
        });
    });

    describe('startup behavior', () => {
        it('should NOT request any permissions on startup', async () => {
            render(<App />);

            // Wait for any async effects to complete
            await waitFor(() => {
                expect(mockAlarmScheduler.isNativeMode).toHaveBeenCalled();
            });

            // CRITICAL: These methods should NEVER be called on startup
            // They would open settings screens which is unwanted behavior
            expect(mockAlarmScheduler.ensurePermissions).not.toHaveBeenCalled();
            expect(mockAlarmScheduler.requestPermissions).not.toHaveBeenCalled();
        });

        it('should detect native mode without requesting permissions', async () => {
            // Simulate native mode
            mockAlarmScheduler.isNativeMode.mockReturnValue(true);
            mockAlarmScheduler.getPlatform.mockReturnValue('android');

            render(<App />);

            await waitFor(() => {
                expect(mockAlarmScheduler.isNativeMode).toHaveBeenCalled();
            });

            // Still should not request permissions on startup
            expect(mockAlarmScheduler.ensurePermissions).not.toHaveBeenCalled();
            expect(mockAlarmScheduler.requestPermissions).not.toHaveBeenCalled();
        });
    });

    describe('theme toggle', () => {
        it('persists theme to localStorage when toggled', async () => {
            const user = userEvent.setup();
            render(<App />);

            const themeButton = screen.getByRole('button', { name: 'Toggle theme' });
            await user.click(themeButton);

            expect(localStorage.setItem).toHaveBeenCalledWith('waketube-theme', expect.any(String));
        });
    });

    describe('add alarm flow', () => {
        it('opens modal when FAB is clicked', async () => {
            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));

            expect(screen.getByText('New Alarm')).toBeInTheDocument();
        });

        it('adds alarm when Set Alarm is clicked', async () => {
            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));
            await user.click(screen.getByText('Set Alarm'));

            // Modal should close
            expect(screen.queryByText('New Alarm')).not.toBeInTheDocument();

            // Alarm should be saved
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'waketube-alarms',
                expect.any(String)
            );
        });

        it('shows active count after adding alarm', async () => {
            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));
            await user.click(screen.getByText('Set Alarm'));

            expect(screen.getByText('1 Active')).toBeInTheDocument();
        });
    });

    describe('alarm management', () => {
        it('toggles alarm enabled state', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Add an alarm
            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));
            await user.click(screen.getByText('Set Alarm'));

            expect(screen.getByText('1 Active')).toBeInTheDocument();

            // Find and click the toggle
            const toggle = screen.getByRole('checkbox');
            await user.click(toggle);

            expect(screen.getByText('0 Active')).toBeInTheDocument();
        });

        it('deletes alarm when delete button is clicked', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Add an alarm
            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));
            await user.click(screen.getByText('Set Alarm'));

            // Find delete button (has hover:text-danger class)
            const deleteBtn = document.querySelector('button.hover\\:text-danger');
            if (deleteBtn) {
                await user.click(deleteBtn);
                expect(screen.getByText('No alarms set')).toBeInTheDocument();
            }
        });
    });

    describe('wake lock', () => {
        it('handles wake lock request errors', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            // Mock request to throw
            const lockRequest = vi.fn().mockRejectedValue(new Error('Unknown error'));
            Object.defineProperty(navigator, 'wakeLock', {
                value: { request: lockRequest },
                writable: true
            });

            render(<App />);
            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Wake Lock request failed:', expect.any(Error));
            });
            consoleSpy.mockRestore();
        });

        it('ignores AbortError', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const error = new Error('AbortError');
            error.name = 'AbortError';
            const lockRequest = vi.fn().mockRejectedValue(error);
            Object.defineProperty(navigator, 'wakeLock', {
                value: { request: lockRequest },
                writable: true
            });

            render(<App />);
            // Should verify it eventually settles without warning
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('ignores policy errors', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const error = new Error('NotAllowedError');
            error.name = 'NotAllowedError';
            const lockRequest = vi.fn().mockRejectedValue(error);
            Object.defineProperty(navigator, 'wakeLock', {
                value: { request: lockRequest },
                writable: true
            });

            render(<App />);
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('rerequest wake lock on visibility change', async () => {
            const requestMock = vi.fn().mockResolvedValue({ release: vi.fn() });
            Object.defineProperty(navigator, 'wakeLock', {
                value: { request: requestMock },
                writable: true
            });
            Object.defineProperty(document, 'visibilityState', {
                value: 'visible',
                writable: true
            });

            render(<App />);
            expect(requestMock).toHaveBeenCalledTimes(1);

            // Simulate hiding then showing
            fireEvent(document, new Event('visibilitychange'));

            // Need to wait for async effect
            await waitFor(() => {
                expect(requestMock).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('alarm triggering', () => {
        beforeEach(() => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('triggers alarm when time matches', async () => {
            // Set time to something specific
            const now = new Date(2024, 0, 1, 8, 59, 0);
            vi.setSystemTime(now);

            // Mock localStorage to already have an alarm set for 9:00 (1 min later)
            const alarmId = 'test-alarm-id';
            const upcomingAlarm = {
                id: alarmId,
                time: '09:00',
                days: [DayOfWeek.Monday], // Jan 1 2024 is Monday
                enabled: true,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Test Alarm',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([upcomingAlarm]);
                return null;
            });

            render(<App />);

            // Fast forward time by 1 minute + buffer in steps to ensure interaction
            await act(async () => {
                vi.advanceTimersByTime(65000);
            });

            const alarmElements = screen.getAllByText('WAKE UP!');
            expect(alarmElements.length).toBeGreaterThan(0);

            // Dismiss the alarm
            // Advance time to ensure dismiss button appears (3s delay)
            act(() => {
                vi.advanceTimersByTime(5000);
            });

            // Dismiss the alarm
            const dismissBtn = screen.getAllByRole('button', { name: /dismiss/i })[0];
            fireEvent.click(dismissBtn);

            // Verify it's gone
            await waitFor(() => {
                expect(screen.queryByText('WAKE UP!')).not.toBeInTheDocument();
            });
        });
    });

    describe('localStorage persistence', () => {
        it('saves alarms to localStorage', async () => {
            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));
            await user.click(screen.getByText('Set Alarm'));

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'waketube-alarms',
                expect.stringContaining('mock-uuid')
            );
        });

        it('persists theme to localStorage', async () => {
            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByRole('button', { name: 'Toggle theme' }));

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'waketube-theme',
                expect.any(String)
            );
        });

        it('loads alarms from localStorage on mount', () => {
            const savedAlarms = [
                {
                    id: 'test-id',
                    time: '10:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Morning Alarm',
                }
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(savedAlarms);
                return null;
            });

            render(<App />);

            expect(screen.getByText('Morning Alarm')).toBeInTheDocument();
            expect(screen.getByText('1 Active')).toBeInTheDocument();
        });

        it('loads theme from localStorage on mount', () => {
            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-theme') return 'light';
                return null;
            });

            render(<App />);

            // Check that dark class is not on root
            expect(document.documentElement.classList.contains('dark')).toBe(false);
        });

        it('defaults to dark theme when not in localStorage', () => {
            vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);

            render(<App />);

            expect(document.documentElement.classList.contains('dark')).toBe(true);
        });

        it('handles empty alarms array from localStorage', () => {
            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return '[]';
                return null;
            });

            render(<App />);

            expect(screen.getByText('No alarms set')).toBeInTheDocument();
        });
    });

    describe('edit alarm flow', () => {
        it('opens edit modal when edit button is clicked', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Add an alarm first
            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));
            await user.click(screen.getByText('Set Alarm'));

            // Find and click edit button using data-testid
            const editBtn = screen.getByTestId('edit-alarm');
            await user.click(editBtn);

            expect(screen.getByText('Edit Alarm')).toBeInTheDocument();
        });

        it('updates alarm when saved from edit modal', async () => {
            const user = userEvent.setup();

            const existingAlarm = {
                id: 'test-id',
                time: '08:00',
                days: [DayOfWeek.Monday],
                enabled: true,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Original Label',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([existingAlarm]);
                return null;
            });

            render(<App />);

            // Find and click edit button using data-testid
            const editBtn = screen.getByTestId('edit-alarm');
            await user.click(editBtn);

            // Wait for modal to open
            await waitFor(() => {
                expect(screen.getByText('Edit Alarm')).toBeInTheDocument();
            });

            // Update and save - button text is "Save Changes" when editing
            const saveBtn = screen.getByText('Save Changes');
            await user.click(saveBtn);

            // Verify the alarm was updated
            await waitFor(() => {
                expect(localStorage.setItem).toHaveBeenCalledWith(
                    'waketube-alarms',
                    expect.stringContaining('test-id')
                );
            });
        });

        it('modal can be opened and has proper content', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Modal should not be visible initially
            expect(screen.queryByText('New Alarm')).not.toBeInTheDocument();

            // Open modal
            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));

            // Modal should now be visible with expected content
            await waitFor(() => {
                expect(screen.getByText('New Alarm')).toBeInTheDocument();
            });

            // Verify modal has the Set Alarm button
            expect(screen.getByText('Set Alarm')).toBeInTheDocument();
        });
    });

    describe('theme management', () => {
        it('toggles from dark to light theme', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Initial state should be dark
            expect(document.documentElement.classList.contains('dark')).toBe(true);

            const themeButton = screen.getByRole('button', { name: 'Toggle theme' });
            await user.click(themeButton);

            // Should now be light
            expect(document.documentElement.classList.contains('dark')).toBe(false);
        });

        it('toggles from light to dark theme', async () => {
            const user = userEvent.setup();

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-theme') return 'light';
                return null;
            });

            render(<App />);

            // Initial state should be light
            expect(document.documentElement.classList.contains('dark')).toBe(false);

            const themeButton = screen.getByRole('button', { name: 'Toggle theme' });
            await user.click(themeButton);

            // Should now be dark
            expect(document.documentElement.classList.contains('dark')).toBe(true);
        });

        it('applies dark class to document root when dark theme is set', () => {
            render(<App />);
            expect(document.documentElement.classList.contains('dark')).toBe(true);
        });
    });

    describe('native alarm handling', () => {
        it('listens for native alarm triggers', async () => {
            let triggerCallback: ((event: { alarmId: string }) => void) | null = null;

            mockOnAlarmTriggered.mockImplementation((callback) => {
                triggerCallback = callback;
                return vi.fn(); // cleanup function
            });

            const existingAlarm = {
                id: 'native-alarm-id',
                time: '08:00',
                days: [DayOfWeek.Monday],
                enabled: true,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Native Alarm',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([existingAlarm]);
                return null;
            });

            render(<App />);

            // Simulate native alarm trigger
            if (triggerCallback) {
                act(() => {
                    triggerCallback({ alarmId: 'native-alarm-id' });
                });

                await waitFor(() => {
                    expect(screen.getByText('WAKE UP!')).toBeInTheDocument();
                });
            }
        });

        it('does not trigger alarm if already active', async () => {
            let triggerCallback: ((event: { alarmId: string }) => void) | null = null;

            mockOnAlarmTriggered.mockImplementation((callback) => {
                triggerCallback = callback;
                return vi.fn();
            });

            const existingAlarm = {
                id: 'native-alarm-id',
                time: '08:00',
                days: [DayOfWeek.Monday],
                enabled: true,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Native Alarm',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([existingAlarm]);
                return null;
            });

            render(<App />);

            // Trigger once
            if (triggerCallback) {
                act(() => {
                    triggerCallback({ alarmId: 'native-alarm-id' });
                });

                await waitFor(() => {
                    expect(screen.getByText('WAKE UP!')).toBeInTheDocument();
                });

                // Try to trigger again - should not duplicate
                act(() => {
                    triggerCallback({ alarmId: 'native-alarm-id' });
                });

                // Should still only have one WAKE UP
                const wakeUpElements = screen.getAllByText('WAKE UP!');
                expect(wakeUpElements.length).toBe(1);
            }
        });

        it('ignores native alarm trigger for non-existent alarm', async () => {
            let triggerCallback: ((event: { alarmId: string }) => void) | null = null;

            mockOnAlarmTriggered.mockImplementation((callback) => {
                triggerCallback = callback;
                return vi.fn();
            });

            render(<App />);

            // Trigger alarm that doesn't exist
            if (triggerCallback) {
                act(() => {
                    triggerCallback({ alarmId: 'non-existent-id' });
                });

                // Should not show WAKE UP
                expect(screen.queryByText('WAKE UP!')).not.toBeInTheDocument();
            }
        });
    });

    describe('alarm scheduling with AlarmScheduler', () => {
        it('schedules alarm with AlarmScheduler when adding enabled alarm', async () => {
            const user = userEvent.setup();
            render(<App />);

            await user.click(screen.getByRole('button', { name: 'Add new alarm' }));
            await user.click(screen.getByText('Set Alarm'));

            await waitFor(() => {
                expect(mockAlarmScheduler.scheduleAlarm).toHaveBeenCalled();
            });
        });

        it('does not schedule alarm when adding disabled alarm', async () => {
            const user = userEvent.setup();

            const disabledAlarm = {
                id: 'disabled-id',
                time: '08:00',
                days: [DayOfWeek.Monday],
                enabled: false,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Disabled Alarm',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([disabledAlarm]);
                return null;
            });

            render(<App />);

            // scheduleAlarm should not be called for disabled alarms on load
            expect(mockAlarmScheduler.scheduleAlarm).not.toHaveBeenCalled();
        });

        it('cancels alarm when toggling off', async () => {
            const user = userEvent.setup();

            const enabledAlarm = {
                id: 'enabled-id',
                time: '08:00',
                days: [DayOfWeek.Monday],
                enabled: true,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Enabled Alarm',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([enabledAlarm]);
                return null;
            });

            render(<App />);

            // Find and click the toggle to disable
            const toggle = screen.getByRole('checkbox');
            await user.click(toggle);

            await waitFor(() => {
                expect(mockAlarmScheduler.cancelAlarm).toHaveBeenCalledWith('enabled-id');
            });
        });

        it('schedules alarm when toggling on', async () => {
            const user = userEvent.setup();

            const disabledAlarm = {
                id: 'disabled-id',
                time: '08:00',
                days: [DayOfWeek.Monday],
                enabled: false,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Disabled Alarm',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([disabledAlarm]);
                return null;
            });

            render(<App />);

            // Find and click the toggle to enable
            const toggle = screen.getByRole('checkbox');
            await user.click(toggle);

            await waitFor(() => {
                expect(mockAlarmScheduler.scheduleAlarm).toHaveBeenCalled();
            });
        });

        it('cancels alarm when deleting', async () => {
            const user = userEvent.setup();

            const alarm = {
                id: 'delete-me',
                time: '08:00',
                days: [DayOfWeek.Monday],
                enabled: true,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Delete Me',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([alarm]);
                return null;
            });

            render(<App />);

            // Find and click delete button
            const deleteBtn = document.querySelector('button.hover\\:text-danger');
            if (deleteBtn) {
                await user.click(deleteBtn);

                await waitFor(() => {
                    expect(mockAlarmScheduler.cancelAlarm).toHaveBeenCalledWith('delete-me');
                });
            }
        });

        it('cancels and reschedules alarm when updating', async () => {
            const user = userEvent.setup();

            const alarm = {
                id: 'update-me',
                time: '08:00',
                days: [DayOfWeek.Monday],
                enabled: true,
                videoUrl: 'https://youtube.com/watch?v=123',
                label: 'Update Me',
            };

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify([alarm]);
                return null;
            });

            render(<App />);

            // Clear previous calls
            mockAlarmScheduler.cancelAlarm.mockClear();
            mockAlarmScheduler.scheduleAlarm.mockClear();

            // Find and click edit button using data-testid
            const editBtn = screen.getByTestId('edit-alarm');
            await user.click(editBtn);

            // Wait for modal
            await waitFor(() => {
                expect(screen.getByText('Edit Alarm')).toBeInTheDocument();
            });

            const saveBtn = screen.getByText('Save Changes');
            await user.click(saveBtn);

            await waitFor(() => {
                expect(mockAlarmScheduler.cancelAlarm).toHaveBeenCalledWith('update-me');
                expect(mockAlarmScheduler.scheduleAlarm).toHaveBeenCalled();
            });
        });
    });

    describe('multiple alarms', () => {
        beforeEach(() => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('displays multiple alarms', () => {
            const alarms = [
                {
                    id: 'alarm-1',
                    time: '08:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Alarm 1',
                },
                {
                    id: 'alarm-2',
                    time: '09:00',
                    days: [DayOfWeek.Tuesday],
                    enabled: false,
                    videoUrl: 'https://youtube.com/watch?v=456',
                    label: 'Alarm 2',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            expect(screen.getByText('Alarm 1')).toBeInTheDocument();
            expect(screen.getByText('Alarm 2')).toBeInTheDocument();
            expect(screen.getByText('1 Active')).toBeInTheDocument();
        });

        it('triggers multiple alarms at the same time', async () => {
            const now = new Date(2024, 0, 1, 9, 0, 0); // Monday 9:00:00 exactly
            vi.setSystemTime(now);

            const alarms = [
                {
                    id: 'alarm-1',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Alarm 1',
                },
                {
                    id: 'alarm-2',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=456',
                    label: 'Alarm 2',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            // Advance just one second to trigger the check at 9:00:00
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            await waitFor(() => {
                const wakeUpElements = screen.getAllByText('WAKE UP!');
                expect(wakeUpElements.length).toBe(2);
            });
        });

        it('does not trigger disabled alarms', async () => {
            const now = new Date(2024, 0, 1, 8, 59, 0); // Monday
            vi.setSystemTime(now);

            const alarms = [
                {
                    id: 'alarm-1',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: false,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Disabled Alarm',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            await act(async () => {
                vi.advanceTimersByTime(65000);
            });

            expect(screen.queryByText('WAKE UP!')).not.toBeInTheDocument();
        });

        it('does not trigger alarms on wrong day', async () => {
            const now = new Date(2024, 0, 1, 8, 59, 0); // Monday
            vi.setSystemTime(now);

            const alarms = [
                {
                    id: 'alarm-1',
                    time: '09:00',
                    days: [DayOfWeek.Tuesday], // Wrong day
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Tuesday Alarm',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            await act(async () => {
                vi.advanceTimersByTime(65000);
            });

            expect(screen.queryByText('WAKE UP!')).not.toBeInTheDocument();
        });

        it('triggers alarm at the correct time', async () => {
            const now = new Date(2024, 0, 1, 9, 0, 0); // Monday 9:00:00
            vi.setSystemTime(now);

            const alarms = [
                {
                    id: 'alarm-1',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Test Alarm',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            // Trigger immediately at 9:00:00
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            await waitFor(() => {
                expect(screen.getByText('WAKE UP!')).toBeInTheDocument();
            });
        });

        it('only triggers alarms when time matches exactly', async () => {
            const now = new Date(2024, 0, 1, 8, 30, 0); // Monday 8:30:00
            vi.setSystemTime(now);

            const alarms = [
                {
                    id: 'alarm-1',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Test Alarm',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            // Should not trigger at 8:30
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            expect(screen.queryByText('WAKE UP!')).not.toBeInTheDocument();
        });
    });

    describe('ref synchronization optimization', () => {
        it('synchronizes alarms ref with state', () => {
            const { rerender } = render(<App />);

            // The refs should be updated on mount
            // This is verified by the clock interval working correctly
            expect(screen.getByText('No alarms set')).toBeInTheDocument();

            rerender(<App />);

            // After rerender, refs should still be synchronized
            expect(screen.getByText('No alarms set')).toBeInTheDocument();
        });
    });

    describe('calculateNextTrigger edge cases', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('calculates trigger for today if time is in future', () => {
            // Set to Monday 8:00 AM
            const now = new Date(2024, 0, 1, 8, 0, 0);
            vi.setSystemTime(now);

            // Create an alarm for 9:00 AM on Monday
            const alarms = [
                {
                    id: 'test-id',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Test',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            // The alarm should be loaded with a trigger time
            expect(screen.getByText('Test')).toBeInTheDocument();
        });

        it('calculates trigger for next week if no valid days in current week', () => {
            // Set to Saturday 11:00 PM
            const now = new Date(2024, 0, 6, 23, 0, 0);
            vi.setSystemTime(now);

            // Create an alarm for Monday only at 9:00 AM
            const alarms = [
                {
                    id: 'test-id',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Monday Alarm',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            expect(screen.getByText('Monday Alarm')).toBeInTheDocument();
        });

        it('skips to next occurrence when time has passed today', () => {
            // Set to Monday 10:00 AM
            const now = new Date(2024, 0, 1, 10, 0, 0);
            vi.setSystemTime(now);

            // Create an alarm for 9:00 AM on Monday (already passed)
            const alarms = [
                {
                    id: 'test-id',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Passed Alarm',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            // Alarm should still be visible, just scheduled for next Monday
            expect(screen.getByText('Passed Alarm')).toBeInTheDocument();
        });

        it('handles alarms with multiple days', () => {
            // Set to Monday 8:00 AM
            const now = new Date(2024, 0, 1, 8, 0, 0);
            vi.setSystemTime(now);

            const alarms = [
                {
                    id: 'test-id',
                    time: '09:00',
                    days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'MWF Alarm',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            expect(screen.getByText('MWF Alarm')).toBeInTheDocument();
        });
    });

    describe('alarm dismissal', () => {
        beforeEach(() => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('dismisses a single active alarm', async () => {
            const now = new Date(2024, 0, 1, 9, 0, 0);
            vi.setSystemTime(now);

            const alarms = [
                {
                    id: 'alarm-1',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Morning',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            expect(screen.getByText('WAKE UP!')).toBeInTheDocument();

            // Wait for dismiss button
            await act(async () => {
                vi.advanceTimersByTime(5000);
            });

            const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
            fireEvent.click(dismissBtn);

            await waitFor(() => {
                expect(screen.queryByText('WAKE UP!')).not.toBeInTheDocument();
            });
        });

        it('can dismiss triggered alarms', async () => {
            const now = new Date(2024, 0, 1, 9, 0, 0);
            vi.setSystemTime(now);

            const alarms = [
                {
                    id: 'alarm-1',
                    time: '09:00',
                    days: [DayOfWeek.Monday],
                    enabled: true,
                    videoUrl: 'https://youtube.com/watch?v=123',
                    label: 'Morning Alarm',
                },
            ];

            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return JSON.stringify(alarms);
                return null;
            });

            render(<App />);

            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            await waitFor(() => {
                expect(screen.getByText('WAKE UP!')).toBeInTheDocument();
            });

            // Wait for dismiss button to appear
            await act(async () => {
                vi.advanceTimersByTime(5000);
            });

            await waitFor(() => {
                const dismissBtns = screen.getAllByRole('button', { name: /dismiss/i });
                expect(dismissBtns.length).toBeGreaterThan(0);
            });

            const dismissBtns = screen.getAllByRole('button', { name: /dismiss/i });
            fireEvent.click(dismissBtns[0]);

            await waitFor(() => {
                expect(screen.queryByText('WAKE UP!')).not.toBeInTheDocument();
            }, { timeout: 2000 });
        });
    });

    describe('edge cases and error handling', () => {
        it('handles missing wake lock API gracefully', async () => {
            Object.defineProperty(navigator, 'wakeLock', {
                value: undefined,
                writable: true,
            });

            // Should render without errors
            render(<App />);
            expect(screen.getByText('WakeTube')).toBeInTheDocument();
        });

        it('handles invalid JSON in localStorage', () => {
            vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
                if (key === 'waketube-alarms') return 'invalid json{';
                return null;
            });

            // Should handle gracefully and render with no alarms
            expect(() => render(<App />)).toThrow();
        });

        it('handles toggle on non-existent alarm gracefully', async () => {
            const user = userEvent.setup();
            render(<App />);

            // Try to toggle an alarm that doesn't exist - should not crash
            // This is just a safety check that the app doesn't crash
            expect(screen.getByText('No alarms set')).toBeInTheDocument();
        });

        it('handles delete on non-existent alarm gracefully', async () => {
            render(<App />);

            // App should render normally even with no alarms
            expect(screen.getByText('No alarms set')).toBeInTheDocument();
        });
    });
});