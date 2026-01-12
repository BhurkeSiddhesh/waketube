import { describe, it, expect } from 'vitest';
import { DayOfWeek, DAYS_LABELS, FULL_DAYS_LABELS } from './types';

describe('types', () => {
    describe('DayOfWeek enum', () => {
        it('should have correct values for all days', () => {
            expect(DayOfWeek.Sunday).toBe(0);
            expect(DayOfWeek.Monday).toBe(1);
            expect(DayOfWeek.Tuesday).toBe(2);
            expect(DayOfWeek.Wednesday).toBe(3);
            expect(DayOfWeek.Thursday).toBe(4);
            expect(DayOfWeek.Friday).toBe(5);
            expect(DayOfWeek.Saturday).toBe(6);
        });

        it('should have 7 days', () => {
            const dayCount = Object.keys(DayOfWeek).filter(k => isNaN(Number(k))).length;
            expect(dayCount).toBe(7);
        });
    });

    describe('DAYS_LABELS', () => {
        it('should have 7 short labels', () => {
            expect(DAYS_LABELS).toHaveLength(7);
        });

        it('should have correct short labels', () => {
            expect(DAYS_LABELS).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
        });
    });

    describe('FULL_DAYS_LABELS', () => {
        it('should have 7 full labels', () => {
            expect(FULL_DAYS_LABELS).toHaveLength(7);
        });

        it('should have correct full day names', () => {
            expect(FULL_DAYS_LABELS).toEqual([
                'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
            ]);
        });

        it('should match DayOfWeek enum indices', () => {
            expect(FULL_DAYS_LABELS[DayOfWeek.Sunday]).toBe('Sunday');
            expect(FULL_DAYS_LABELS[DayOfWeek.Monday]).toBe('Monday');
            expect(FULL_DAYS_LABELS[DayOfWeek.Saturday]).toBe('Saturday');
        });
    });
});
