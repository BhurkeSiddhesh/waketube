# ⏰ WakeTube - Premium Video Alarm

**WakeTube** is a high-performance, strictly "no-snooze" alarm clock application designed to wake you up with intent. Built with a premium glassmorphic aesthetic and Google Material Design 3 principles, it replaces jarring audio beeps with full-screen YouTube videos.

## 💡 The Philosophy

The core idea behind WakeTube is simple: **The first few seconds of your day define the rest of it.**

1.  **Visual Motivation:** Audio alarms are easily ignored or annoying; video alarms are engaging and cinematic. Waking up to high-energy visuals or serene landscapes engages the brain faster.
2.  **No Snooze Button:** The "Dismiss" button is intentionally locked for the first few seconds of the alarm (No-Snooze Enforcement). This prevents muscle-memory snoozing while half-asleep.
3.  **Modern Aesthetic:** A premium, distraction-free interface that feels like a native OS feature, optimized for both light and dark environments.

---

## 🏗️ Project Architecture & Components

The application is built using **React 19**, **Vite 6**, and **Tailwind CSS**. It leverages native browser APIs for maximum reliability.

### 1. Core Application Logic
*   **`App.tsx`**
    *   **Role:** Central state manager and event coordinator.
    *   **Functionality:** Manages global alarm state, system time synchronization, theme switching (Light/Dark), and browser Wake Lock integration.
*   **`index.html` & `index.tsx`**
    *   **Role:** Shell and entry point.
    *   **Functionality:** Configures the Design System (Glassmorphism, Custom Animations) and the import map for lightweight dependency loading.

### 2. UI Components (`/components`)
*   **`AlarmTrigger.tsx`** (The "Wake Up" Screen)
    *   Uses the native **YouTube IFrame API** for high-performance background video playback.
    *   Features a translucent glass overlay and high-contrast typography ("WAKE UP!").
    *   Includes dynamic volume controls and a time-locked dismissal mechanism.
*   **`AddAlarmModal.tsx`**
    *   Provides an intuitive form for creating alarms.
    *   Includes **Smart Time Suggestions** that generate contextual labels (e.g., "Early Bird Rise", "Morning Energy") based on the selected hour.
*   **`AlarmCard.tsx`**
    *   A high-density card for managing existing alarms with smooth toggle transitions and status indicators.
*   **`WakeTubeIcon.tsx`**
    *   A custom, animated SVG component representing the brand identity.

### 3. Engineering Excellence
*   **Comprehensive Testing**: Built with a "Safety First" approach using **Vitest** and **React Testing Library**.
*   **100% Coverage Target**: Core components are thoroughly tested for rendering, user interaction, and edge cases.
*   **Wake Lock API**: Implements `navigator.wakeLock` to ensure the device screen stays on while the alarm is active.
*   **Persistence**: Alarms and preferences are stored in `localStorage` for cross-session continuity.

---

## 🎨 Design System

WakeTube features a custom-built design system:
*   **Glassmorphism**: Pure CSS backdrop-filters for a premium "frosted glass" look.
*   **Mesh Gradients**: Subtle, animated radial gradients that make the background feel alive.
*   **Material Colors**: Integrated with Google Material Design 3 color palettes (Google Blue, Green, Red, Yellow).
*   **Typography**: Uses **Google Sans** for a modern, geometric feel.

## 🚀 Getting Started

1.  **Run Development Server**:
    ```bash
    npm run dev
    ```
2.  **Run Tests**:
    ```bash
    npm test
    ```
3.  **Check Coverage**:
    ```bash
    npm run test:coverage
    ```

## 📱 Android Readiness

WakeTube already ships with a Capacitor 7 Android project, native alarm plugin (AlarmScheduler, AlarmReceiver, BootReceiver), full-screen intents, wake locks, exact alarm permissions, and bundled launcher/splash assets. The Vite `base` is set to `./` and Tailwind is installed locally to keep the web bundle working offline on Android.

What’s still needed before a Play Store-ready APK/AAB:
* Provide a release signing config/keystore plus Play Store metadata (privacy policy, feature graphic, content rating) — only unsigned debug signing is present.
* Add native validation (Android emulator/device build step or instrumentation smoke test) to catch regressions in the Capacitor bridge; the repo currently tests only the web layer.
* Perform device QA and Play Console setup (notification disclosure, Data Safety form) ahead of publishing.

---

*Built with ❤️ for a more intentional morning.*
