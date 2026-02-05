## 2024-05-22 - High Frequency Updates
**Learning:** High-frequency state updates (e.g., the 1Hz clock) must be isolated in leaf components (like `ClockDisplay`) to prevent unnecessary root-level re-renders.
**Action:** Always check `setInterval` or frequent event listeners in root components and extract them to dedicated child components.

## 2025-02-04 - [High-Frequency Updates in Root]
**Learning:** The root `App` component contained a 1Hz state update for the clock, causing the entire React tree to re-render every second. This negated any potential benefit of memoization in child components.
**Action:** Isolate high-frequency timers (like clocks or progress bars) into dedicated leaf components (`ClockDisplay`) to keep the render tree stable.
