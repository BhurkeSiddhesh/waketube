# ⏰ WakeTube - AI-Powered Video Alarm

**WakeTube** is a strictly "no-snooze" alarm clock application designed to wake you up with intent. Instead of a jarring beep, it wakes you up with full-screen YouTube videos—ranging from Hans Zimmer soundtracks to high-energy motivational clips—discovered via AI.

## 💡 The Philosophy

The core idea behind WakeTube is simple: **The first few seconds of your day define the rest of it.**

1.  **Visual Motivation:** Audio alarms are annoying; video alarms are engaging. Waking up to a visual scene (like the docking scene from *Interstellar*) engages the brain faster.
2.  **No Snooze Button:** The "Dismiss" button is intentionally locked for the first few seconds of the alarm. This prevents the muscle memory of hitting snooze while half-asleep.
3.  **AI Discovery:** You shouldn't have to hunt for alarm music. You can simply ask the AI for "chill lo-fi beats" or "heavy metal for a workout morning," and it finds the perfect video.

---

## 🏗️ Project Architecture & Components

The application is built using **React**, **TypeScript**, and **Tailwind CSS**. Below is a detailed breakdown of every file and component in the system.

### 1. Core Application Logic
*   **`App.tsx`**
    *   **Role:** The "Brain" of the application.
    *   **Functionality:**
        *   Manages the global state: list of alarms, current time, active alarm trigger, and UI theme (Dark/Light).
        *   **The Clock Loop:** Runs a 1-second interval to check if the current time matches any enabled alarm.
        *   **Wake Lock:** Implements the browser's `navigator.wakeLock` API to ensure the screen stays on while the app is open (crucial for a web-based alarm).
        *   **Persistence:** Saves alarms and theme preferences to `localStorage`.
        *   **Theme Management:** Toggles a CSS class on the `<html>` element to switch between dark and light modes.

*   **`index.tsx` & `index.html`**
    *   **Role:** Entry point and Configuration.
    *   **Functionality:**
        *   `index.html` loads the **Outfit** font (a Google Sans alternative) and configures Tailwind CSS with custom color variables for theming.
        *   `index.tsx` mounts the React app to the DOM.

### 2. UI Components (`/components`)

*   **`AlarmTrigger.tsx`** (The "Wake Up" Screen)
    *   **Role:** The component that renders when an alarm goes off.
    *   **Key Features:**
        *   **Full-Screen Video:** Uses `react-player` to render a YouTube video in the background.
        *   **Translucent Overlay:** Applies a semi-transparent black layer (`bg-black/60`) over the video. This ensures the text and buttons are readable while the video plays atmospherically in the background.
        *   **Autoplay Enforcement:** Explicitly configures YouTube player variables to bypass browser autoplay restrictions where possible.
        *   **Locked Dismiss:** The "Dismiss" button is hidden/disabled for the first 2 seconds to force wakefulness.
        *   **Volume Control:** A custom slider allows volume adjustment during the alarm.

*   **`AddAlarmModal.tsx`**
    *   **Role:** The form interface for creating new alarms.
    *   **Key Features:**
        *   **Smart Time Initialization:** Automatically sets the input to the current system time when opened, so you don't have to scroll from 00:00.
        *   **AI Music Finder:** Contains the input field for the Gemini AI integration. Users type a prompt, and the app fetches a video URL.
        *   **Day Selector:** Allows users to select specific days of the week for the alarm to repeat.

*   **`AlarmCard.tsx`**
    *   **Role:** A display card for a single alarm in the main list.
    *   **Key Features:**
        *   **Visual Feedback:** Changes opacity and styling based on whether the alarm is enabled or disabled.
        *   **Dynamic Theming:** Uses CSS variables to adapt text colors (white in dark mode, dark slate in light mode).
        *   **Controls:** Provides the toggle switch (Enable/Disable) and the Delete button.

### 3. Services

*   **`services/geminiService.ts`**
    *   **Role:** The bridge between the app and the Google Gemini API.
    *   **Functionality:**
        *   Uses **Google Search Grounding** (`tools: [{ googleSearch: {} }]`).
        *   Takes a user query (e.g., "Epic movie soundtracks").
        *   Asks Gemini to find a valid YouTube URL.
        *   Parses the response to extract the specific `youtube.com` link and video title to automatically populate the alarm settings.

### 4. Data Models

*   **`types.ts`**
    *   **Role:** TypeScript definitions.
    *   **Content:** Defines the `Alarm` interface (ID, time, days, video URL, label) and the `DayOfWeek` enum to ensure type safety across the application.

---

## 🎨 Design System

The app uses a "Glassmorphism" inspired design system tailored for OLED screens:

*   **Colors:** Deep blacks/slates for the background (saving battery on AMOLED) with vibrant accents (Rose/Indigo).
*   **Typography:** **Outfit** font is used for a clean, geometric look similar to native Android interfaces.
*   **Animation:** Subtle pulses and transitions (via Tailwind `animate-pulse` and transitions) make the UI feel alive.

## 🚀 How to Use

1.  **Open the App:** Keep the browser tab active (due to browser limitations, background tabs may throttle timers).
2.  **Set an Alarm:** Click the **+** button.
3.  **Choose Music:** Either paste a YouTube link or type a mood (e.g., "Morning Jazz") into the AI Finder.
4.  **Wait:** The screen will stay awake. When the time comes, the video will take over the screen.

---

*Built with ❤️ and a need to wake up on time.*
