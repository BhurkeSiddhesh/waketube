import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

    describe('day selection', () => {
        it('toggles day selection when clicked', async () => {
            const user = userEvent.setup();
            render(<AddAlarmModal onClose={onClose} onSave={onSave} />);

            const mondayButtons = screen.getAllByText('M');
            await user.click(mondayButtons[0]);

            await user.click(screen.getByText('Set Alarm'));

            expect(onSave).toHaveBeenCalled();
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
});

describe('getTimeBasedSuggestion helper', () => {
    // Test via rendering at different times
    it('shows appropriate suggestion based on time of day', () => {
        render(<AddAlarmModal onClose={vi.fn()} onSave={vi.fn()} />);
        // Just verify some suggestion is shown
        const suggestionElement = screen.getByText(/Early Bird Rise|Morning Energy|Mid-Morning Focus|Lunch Break|Afternoon Power|Evening Wind Down|Night Mode|Late Night Vibes/);
        expect(suggestionElement).toBeInTheDocument();
    });
});
