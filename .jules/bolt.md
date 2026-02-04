## 2025-02-04 - [High-Frequency Updates in Root]
**Learning:** The root `App` component contained a 1Hz state update for the clock, causing the entire React tree to re-render every second. This negated any potential benefit of memoization in child components.
**Action:** Isolate high-frequency timers (like clocks or progress bars) into dedicated leaf components (`ClockDisplay`) to keep the render tree stable.
