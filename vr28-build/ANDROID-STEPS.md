# VR28 Android build (security + Samsung Watch): steps for the PC session

M said "Execute" for the security fixes (18 Oct 00:06 UTC) and picked "Android first" for the watch (02:10 UTC),
both in thread "Store readiness and security audit". One APK carries both, so M installs only once.
This file covers ONLY building and checking the APK. Do not publish anything, do not create a GitHub release,
and do not touch the Firebase, Google Cloud, Play or Apple consoles. Save every file straight into its final folder
under Claude Playground\Reborn App\ (never Downloads, Desktop or temp). Close any Chrome tab you open.

## 1. Get the web bundle
- Download https://raw.githubusercontent.com/bettereverydayai-svg/reborn-app/main/update/VR28.zip
  straight to `Reborn App\vr28-build\VR28-web.zip` (never Downloads).
- Its SHA-256 must be 4400b273970b473022eabc8181e0ea9d4016354dccc6240de16ab970ab4378ce.
- Unzip it to `Reborn App\vr28-build\www\`, with index.html at the top of that folder.
- update/latest.json on GitHub still points at VR27, so this zip reaches no phone until the cloud thread signs and releases it.

## 2. Android project changes (`Reborn App\android-build`)
Back up first: copy `android\app\build.gradle`, `android\variables.gradle`, `android\build.gradle` and
`package.json` to `android-build\_vr27-config-backup\`.
1. Note the Capacitor major version in package.json (@capacitor/core).
2. Install the native App Check plugin that matches that major version:
   `npm i @capacitor-firebase/app-check@^7` for Capacitor 7, or `@^6` for Capacitor 6.
   It uses the existing `android\app\google-services.json`.
3. In `android\variables.gradle`, set `compileSdkVersion = 36` and `targetSdkVersion = 36`.
   If the build then fails because the Android Gradle plugin is too old for 36, raise the
   `com.android.tools.build:gradle` version in `android\build.gradle` to the lowest one that supports
   API 36, and say exactly what you changed. Add SDK platform 36 to the portable SDK if it is missing.
4. Watch (Health Connect): `npm i @capgo/capacitor-health@7.2.15` (the 7.x line; 8.x needs Capacitor 8),
   then `npx cap sync android`. In `android\app\src\main\AndroidManifest.xml`, follow that plugin's README:
   - add the Health Connect READ permissions for steps, active calories burned, heart rate and weight
     (read only, no write permissions);
   - add the `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE` intent filter and the privacy-policy
     activity alias. Health Connect refuses to show its permission screen without them.
   - Point the rationale/privacy link at https://www.rebornrising.com/privacy.
5. Check the `@capgo/capacitor-updater` version in package.json and report it. Do not upgrade it.
6. In `android\app\build.gradle`, set `versionCode 8` and `versionName "VR28"`.
7. Build: `Reborn App\android-build\rebuild-apk.ps1 -From "<full path>\Reborn App\vr28-build\www" -Release`.

## 3. Check the APK
- apksigner: the signer must be CN=Reborn Rising with a SHA-1 starting 55f038d1 (reborn-release.jks). If it is any other key, stop.
- aapt: package com.rebornrising.app, versionCode 8, versionName VR28, targetSdkVersion 36, and the four
  android.permission.health.READ_* permissions listed.
- Copy it to `Reborn App\RebornRising-VR28.apk` and `G:\My Drive\Reborn App\RebornRising-VR28.apk`.

## 4. Report back to the parent thread
Report: the Capacitor version, the App Check and Health plugin versions, the capgo updater version, any Gradle change,
the APK size and SHA-256, and the apksigner and aapt lines. If anything fails, report the exact error and stop.

Do NOT install the APK on M's phone yourself, and do NOT publish it. The cloud thread asks M to install it over
the current app. Because it uses the same key, M's routines, stacks and logs stay. The cloud thread checks the
app before anything is released.
