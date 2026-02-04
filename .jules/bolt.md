## 2024-05-22 - High Frequency Updates
**Learning:** High-frequency state updates (e.g., the 1Hz clock) must be isolated in leaf components (like `ClockDisplay`) to prevent unnecessary root-level re-renders.
**Action:** Always check `setInterval` or frequent event listeners in root components and extract them to dedicated child components.
