import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { DayOfWeek } from './types';

// Mock uuid
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
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

            // Find delete button
            const deleteBtns = screen.getAllByTestId('delete-alarm');
            const deleteBtn = deleteBtns[0];

            if (deleteBtn) {
                // First click (confirmation)
                await user.click(deleteBtn);
                // Second click (delete)
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
    });
});
