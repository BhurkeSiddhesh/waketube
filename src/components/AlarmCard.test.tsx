import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AlarmCard from './AlarmCard';
import { Alarm, DayOfWeek } from '../types';

const mockAlarm: Alarm = {
    id: 'test-id-1',
    time: '07:30',
    days: [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday],
    enabled: true,
    videoUrl: 'https://www.youtube.com/watch?v=abc123',
    label: 'Morning Workout',
};

const disabledAlarm: Alarm = {
    ...mockAlarm,
    id: 'test-id-2',
    enabled: false,
};

describe('AlarmCard', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders the formatted time correctly', () => {
            render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            expect(screen.getByText('7:30')).toBeInTheDocument();
            expect(screen.getByText('AM')).toBeInTheDocument();
        });

        it('renders PM for afternoon times', () => {
            const pmAlarm = { ...mockAlarm, time: '14:45' };
            render(<AlarmCard alarm={pmAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            expect(screen.getByText('2:45')).toBeInTheDocument();
            expect(screen.getByText('PM')).toBeInTheDocument();
        });

        it('renders 12:00 correctly for noon', () => {
            const noonAlarm = { ...mockAlarm, time: '12:00' };
            render(<AlarmCard alarm={noonAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            expect(screen.getByText('12:00')).toBeInTheDocument();
            expect(screen.getByText('PM')).toBeInTheDocument();
        });

        it('renders 12:00 AM for midnight', () => {
            const midnightAlarm = { ...mockAlarm, time: '00:00' };
            render(<AlarmCard alarm={midnightAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            expect(screen.getByText('12:00')).toBeInTheDocument();
            expect(screen.getByText('AM')).toBeInTheDocument();
        });

        it('renders the label', () => {
            render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            expect(screen.getByText('Morning Workout')).toBeInTheDocument();
        });

        it('renders default label when label is empty', () => {
            const noLabelAlarm = { ...mockAlarm, label: '' };
            render(<AlarmCard alarm={noLabelAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            expect(screen.getByText('Alarm')).toBeInTheDocument();
        });

        it('renders day indicators', () => {
            render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const dayButtons = screen.getAllByText(/^[SMTWF]$/);
            expect(dayButtons.length).toBe(7);
        });

        it('renders preview link when videoUrl exists', () => {
            render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const previewLink = screen.getByRole('link', { name: /preview/i });
            expect(previewLink).toBeInTheDocument();
            expect(previewLink).toHaveAttribute('href', mockAlarm.videoUrl);
        });

        it('does not render preview link when videoUrl is empty', () => {
            const noVideoAlarm = { ...mockAlarm, videoUrl: '' };
            render(<AlarmCard alarm={noVideoAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            expect(screen.queryByRole('link', { name: /preview/i })).not.toBeInTheDocument();
        });
    });

    describe('toggle functionality', () => {
        it('renders checkbox as checked when enabled', () => {
            render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toBeChecked();
        });

        it('renders checkbox as unchecked when disabled', () => {
            render(<AlarmCard alarm={disabledAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).not.toBeChecked();
        });

        it('calls onToggle with alarm id when toggle is clicked', async () => {
            const user = userEvent.setup();
            render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const checkbox = screen.getByRole('checkbox', { name: 'Toggle alarm for 7:30 AM' });
            await user.click(checkbox);
            expect(onToggle).toHaveBeenCalledWith('test-id-1');
        });
    });

    describe('edit functionality', () => {
        it('calls onEdit with alarm object when edit button is clicked', async () => {
            const user = userEvent.setup();
            render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const editButton = screen.getByRole('button', { name: 'Edit alarm for 7:30 AM' });
            await user.click(editButton);
            expect(onEdit).toHaveBeenCalledWith(mockAlarm);
        });
    });

    describe('delete functionality', () => {
        it('calls onDelete with alarm id when delete button is clicked', async () => {
            const user = userEvent.setup();
            render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const deleteButton = screen.getByRole('button', { name: 'Delete alarm for 7:30 AM' });
            await user.click(deleteButton);
            expect(onDelete).toHaveBeenCalledWith('test-id-1');
        });
    });

    describe('styling', () => {
        it('applies reduced opacity when alarm is disabled', () => {
            const { container } = render(<AlarmCard alarm={disabledAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const card = container.firstChild;
            expect(card).toHaveClass('opacity-60');
        });

        it('applies shadow when alarm is enabled', () => {
            const { container } = render(<AlarmCard alarm={mockAlarm} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />);
            const card = container.firstChild;
            expect(card).toHaveClass('shadow-lg');
        });
    });
});
