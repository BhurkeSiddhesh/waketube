# Project Overview: WakeTube

## Architecture
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (via CDN) with CSS Variables for theming.
- **State Management**: Centralized in `App.tsx` using `useState` and `useEffect`.
- **Persistence**: `localStorage` for alarms and theme settings.
- **Entry Point**: `src/index.tsx` (Vite-based).
- **Native Platforms**: Capacitor 7 with Android and iOS support.

## Key Features (Observed)
1. **Glassmorphic UI**: High-end design with mesh gradients, translucent cards, and smooth animations.
2. **YouTube Alarm Trigger**: Integrated with native YouTube IFrame API for full-screen video playback when alarms go off.
3. **No-Snooze Philosophy**: The "Dismiss" button is locked for the first 2 seconds of the alarm.
4. **Wake Lock**: Uses browser `navigator.wakeLock` to prevent the screen from turning off.
5. **Theme Support**: Dark and Light modes with system persistence.
6. **Smart Suggestions**: Adaptive alarm labels based on the time of day.
7. **Comprehensive Testing**: Vitest + React Testing Library with high coverage for $App$, $AddAlarmModal$, $AlarmCard$, and $AlarmTrigger$.
8. **Background Alarms**: Native AlarmManager (Android) and UNUserNotificationCenter (iOS) for alarms that work even when app is closed.

## Tech Stack Detail
- **Icons**: `lucide-react`
- **Player**: Native YouTube IFrame API (previously `react-player` mentioned in README but native API observed in `AlarmTrigger.tsx`).
- **Testing**: Vitest, `@testing-library/react`, `jsdom`.
- **Native Alarms**: Custom Capacitor plugin `AlarmScheduler` for Android/iOS.

## Observed Implementation Patterns
- **Glassmorphism**: Use of `.glass`, `.glass-strong`, and `.glass-subtle` classes defined in `index.html`.
- **Mesh Gradients**: Subtle background effects using radial gradients.
- **Atomic Components**: Components separated into functional units (`AlarmCard`, `AddAlarmModal`, etc.).
- **Mocking**: Extensive use of `vi.fn()` and `vi.setSystemTime()` in tests.
- **YouTube Title Fetching**: Using oEmbed API in `src/utils/youtube.ts` to retrieve video titles without API keys.
- **Video History**: `useVideoHistory` hook in `src/hooks/useVideoHistory.ts` for Recently Used videos with localStorage persistence (max 10 items).
- **Native Plugin Bridge**: TypeScript wrapper in `src/plugins/AlarmScheduler.ts` with web fallback.

## Discrepancies with old README
- **AI Discovery**: Removed or disabled in the current codebase (previously used Gemini).
- **Video Player**: Switched from `react-player` to native YouTube IFrame API in `AlarmTrigger.tsx`.

## Change Log (Reverse Chronological)

### 2026-02-06
- **feat**: Merged `android-progress` branch into `main` with UI improvements including glassmorphism, safe area insets, hover effects, and documentation updates.
- **Files**: README.md, src/App.tsx, src/components/AddAlarmModal.tsx, src/components/AlarmCard.tsx, src/index.css
- **Verification**: `npm test` passed.

### 2026-01-23
- **refactor**: Replaced native Android time picker with custom Hour/Minute dropdowns for precise and easy selection (restoring webapp UX).
- **fix**: Enabled `mediaPlaybackRequiresUserGesture = false` in Android WebView to allow video alarms to autoplay without user interaction.
- **fix**: Upgraded Android alarm triggering to use High-Priority Notifications with Full-Screen Intents, ensuring reliability on Android 10+ when the app is closed/locked.
- **refactor**: Migrated from Tailwind CDN to local installation to fix broken UI on Android and enable offline support.
- **fix**: Fixed "Blank Screen" (app icon only) issue on Android by setting `base: './'` in `vite.config.ts` and removing conflicting CDN importmaps.
- **fix**: Fixed Android app opening battery usage settings on startup by removing automatic permission checks.
- **fix**: Fixed Android build errors by adding missing Kotlin Gradle plugin.
- **Files**:
  - `src/plugins/AlarmScheduler.ts`
  - `src/App.tsx`
  - `src/App.test.tsx`
  - `android/build.gradle`
  - `android/app/build.gradle`
- **Verification**: `npm test` - 24 tests passed (including new startup behavior tests), `npx cap sync android` successful.

### 2026-01-23
- **feat**: Added Android native assets, splash screen, and theme configuration
- **Files**:
  - `android/app/src/main/res/drawable/ic_launcher_background.xml`
  - `android/app/src/main/res/drawable/ic_launcher_foreground.xml`
  - `android/app/src/main/res/drawable/splash.xml`
  - `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
  - `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
  - `android/app/src/main/res/values/colors.xml`
  - `android/app/src/main/res/values/strings.xml`
  - `android/app/src/main/res/values/styles.xml`
  - `android/app/src/main/res/xml/file_paths.xml`
- **Verification**: `npm test` - 82 tests passed, Visual inspection of assets planned.

### 2026-01-22
- **feat**: Background Alarm Service - Alarms now trigger even when app is closed
- **Files**: 
  - `android/app/src/main/java/com/waketube/app/AlarmSchedulerPlugin.kt`
  - `android/app/src/main/java/com/waketube/app/AlarmReceiver.kt`
  - `android/app/src/main/java/com/waketube/app/BootReceiver.kt`
  - `android/app/src/main/java/com/waketube/app/MainActivity.kt`
  - `android/app/src/main/AndroidManifest.xml`
  - `ios/App/App/AlarmSchedulerPlugin.swift`
  - `ios/App/App/AppDelegate.swift`
  - `src/plugins/AlarmScheduler.ts`
  - `src/types.ts`
  - `src/App.tsx`
- **Verification**: `npm test` - 82 tests passed
