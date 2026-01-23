---
description: Complete clean Android build workflow
---
# Android Clean Build Workflow
// turbo-all

Follow these steps to completely rebuild the Android app:

## Step 1: Build Web Assets
```bash
npm run build
```

## Step 2: Sync to Android
```bash
npx cap sync android
```

## Step 3: Clean Gradle Build (from android folder)
```bash
cd android && gradlew clean && cd ..
```

## Step 4: In Android Studio
1. Open the `android` folder in Android Studio
2. Go to **Build** menu
3. Select **Clean and Assemble Project with Tests** (or just **Clean Project** if that's not available)
4. Wait for it to complete
5. Go to **Run** menu → **Run 'app'**

## Alternative: If still not working
1. On the emulator/device: Settings → Apps → WakeTube → Storage → **Clear Cache** and **Clear Data**
2. Re-run the app from Android Studio

## Troubleshooting
- If Build menu shows only "Sync Project with Gradle Files", click that first
- Check Logcat (View → Tool Windows → Logcat) for any errors
- Filter Logcat by "WakeTube" or "WebView"
