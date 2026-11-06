# Android app

This project packages the existing web app as **Gorden Malang** for Android using Capacitor.

## Build an installable APK on Windows

Install Node.js 22 or newer and Android Studio with an Android SDK, then run from this folder:

```powershell
npm install
npm run android:apk
```

The installable APK is copied to `Gorden-Malang.apk` in this folder. Copy it to an Android phone and open it to install. Android may ask you to allow installation from that file manager. The Gradle output is also kept at `android/app/build/outputs/apk/debug/app-debug.apk`.

Run `npm run android:apk` again after changing the web app so the Android package includes the latest files.

The app connects to the configured Supabase project and loads Supabase, FullCalendar, and Font Awesome from their existing CDN URLs, so it needs an internet connection. The APK currently uses Android's debug signing key; a Play Store release needs a separately managed signing key and release build.
