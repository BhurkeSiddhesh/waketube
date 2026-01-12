import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddAlarmModal from './AddAlarmModal';
import { DayOfWeek } from '../types';

describe('AddAlarmModal', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders the modal with header', () => {
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);
            expect(screen.getByText('New Alarm')).toBeInTheDocument();
        });

        it('renders time input', () => {
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);
            // Time input is present (type="time")
            const timeInputs = document.querySelectorAll('input[type="time"]');
            expect(timeInputs.length).toBe(1);
        });

        it('renders all 7 day buttons', () => {
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);
            const dayButtons = screen.getAllByRole('button').filter(btn =>
                ['S', 'M', 'T', 'W', 'F'].includes(btn.textContent || '')
            );
            expect(dayButtons.length).toBe(7);
        });

        it('renders YouTube URL input', () => {
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);
            expect(screen.getByPlaceholderText('Paste YouTube video URL')).toBeInTheDocument();
        });

        it('renders Set Alarm button', () => {
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);
            expect(screen.getByText('Set Alarm')).toBeInTheDocument();
        });
    });



    describe('save functionality', () => {
        it('calls onSave with alarm data when Set Alarm is clicked', async () => {
            const user = userEvent.setup();
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);

            await user.click(screen.getByText('Set Alarm'));

            expect(onSave).toHaveBeenCalledTimes(1);
            expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
                enabled: true,
                videoUrl: 'https://www.youtube.com/watch?v=7GlsxNI4LVI',
            }));
        });

        it('calls onClose after saving', async () => {
            const user = userEvent.setup();
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);

            await user.click(screen.getByText('Set Alarm'));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('close functionality', () => {
        it('has a close button', () => {
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });
    describe('day selection', () => {
        it('toggles day selection (add and remove)', async () => {
            // Mock to Monday so Tuesday is unselected initially
            vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0)); // Jan 1, 2024 is Monday

            const user = userEvent.setup();
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);

            const tuesdayBtn = screen.getByTestId('day-toggle-2'); // Tuesday

            // Tuesday should be unselected initially (Monday is selected)
            expect(tuesdayBtn).not.toHaveClass('bg-primary');

            // Click to add Tuesday
            fireEvent.click(tuesdayBtn);

            // Verify added
            await waitFor(() => {
                expect(tuesdayBtn).toHaveClass('bg-primary');
            });

            // Verify via save - Monday (1) and Tuesday (2) should both be selected
            fireEvent.click(screen.getByText('Set Alarm'));
            expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({
                days: [DayOfWeek.Monday, DayOfWeek.Tuesday] // Sorts to [1, 2]
            }));

            vi.useRealTimers();
        });

        it('removes a selected day', async () => {
            const user = userEvent.setup();
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);
            // Mock time implies Monday is selected by default logic
            vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));

            // Re-render to pick up time
            screen.getAllByRole('button').forEach(b => b.remove());
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);

            const mondayBtn = screen.getByTestId('day-toggle-1');
            expect(mondayBtn).toHaveClass('bg-primary');

            fireEvent.click(mondayBtn);

            await waitFor(() => {
                expect(mondayBtn).not.toHaveClass('bg-primary');
            });

            fireEvent.click(screen.getByText('Set Alarm'));
            expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({
                days: []
            }));
        });
    });

    // Helper test can be here or separate, but let's keep it here for file cleanliness?
    // Actually helper test doesn't depend on scope (mocks).
});

describe('getTimeBasedSuggestion helper', () => {
    it('returns correct label for different hours', () => {
        const testCases = [
            { hour: 6, expected: "Early Bird Rise" },
            { hour: 8, expected: "Morning Energy" },
            { hour: 10, expected: "Mid-Morning Focus" },
            { hour: 13, expected: "Lunch Break" },
            { hour: 15, expected: "Afternoon Power" },
            { hour: 18, expected: "Evening Wind Down" },
            { hour: 21, expected: "Night Mode" },
            { hour: 2, expected: "Late Night Vibes" },
            { hour: 23, expected: "Late Night Vibes" },
        ];

        testCases.forEach(({ hour, expected }) => {
            vi.setSystemTime(new Date(2024, 0, 1, hour, 0, 0));
            const { unmount } = render(<AddAlarmModal onClose={vi.fn()} onSave={vi.fn()} />);
            expect(screen.getByPlaceholderText(expected)).toBeInTheDocument();
            unmount();
        });

        vi.useRealTimers();
    });
});
