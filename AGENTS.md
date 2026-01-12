# Project Overview: WakeTube

## Architecture
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (via CDN) with CSS Variables for theming.
- **State Management**: Centralized in `App.tsx` using `useState` and `useEffect`.
- **Persistence**: `localStorage` for alarms and theme settings.
- **Entry Point**: `src/index.tsx` (Vite-based).

## Key Features (Observed)
1. **Glassmorphic UI**: High-end design with mesh gradients, translucent cards, and smooth animations.
2. **YouTube Alarm Trigger**: Integrated with native YouTube IFrame API for full-screen video playback when alarms go off.
3. **No-Snooze Philosophy**: The "Dismiss" button is locked for the first 2 seconds of the alarm.
4. **Wake Lock**: Uses browser `navigator.wakeLock` to prevent the screen from turning off.
5. **Theme Support**: Dark and Light modes with system persistence.
6. **Smart Suggestions**: Adaptive alarm labels based on the time of day.
7. **Comprehensive Testing**: Vitest + React Testing Library with high coverage for $App$, $AddAlarmModal$, $AlarmCard$, and $AlarmTrigger$.

## Tech Stack Detail
- **Icons**: `lucide-react`
- **Player**: Native YouTube IFrame API (previously `react-player` mentioned in README but native API observed in `AlarmTrigger.tsx`).
- **Testing**: Vitest, `@testing-library/react`, `jsdom`.

## Observed Implementation Patterns
- **Glassmorphism**: Use of `.glass`, `.glass-strong`, and `.glass-subtle` classes defined in `index.html`.
- **Mesh Gradients**: Subtle background effects using radial gradients.
- **Atomic Components**: Components separated into functional units (`AlarmCard`, `AddAlarmModal`, etc.).
- **Mocking**: Extensive use of `vi.fn()` and `vi.setSystemTime()` in tests.

## Discrepancies with old README
- **AI Discovery**: Removed or disabled in the current codebase (previously used Gemini).
- **Video Player**: Switched from `react-player` to native YouTube IFrame API in `AlarmTrigger.tsx`.
