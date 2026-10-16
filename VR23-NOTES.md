# VR23 build (versionCode 7, versionName "VR23")

Built in the cloud from source /mnt/project-files/reborn-app-web-vr23 (project files), 2026-10-16.

- `android/` = the Android bundle (copy into the Capacitor app's web folder; index.html at the root).
- `web/` = the iPhone web app (goes to main / GitHub Pages only after M has tested).
- `firestore.rules` = rules with the new `feedback` collection (create only).

IMPORTANT for the PC APK build: this bundle ALREADY CONTAINS
- the in-app feedback (Me > Feedback, floating button, shake to report, 3-day prompt; writes Firestore `feedback/{id}`), and
- the self-update JS (src/updater.js: notifyAppReady, then update/latest.json on GitHub Pages, download + next).
Do NOT inject feedback.js / updater.js from vr23-build on top of it, or they run twice.
Android project: set versionCode 7, versionName "VR23"; @capgo/capacitor-updater with autoUpdate false.

Stack card icons follow the item's FORM (M approved "B with icons that match the item", 04:10 UTC, artifact Y3wrcQpjB6fJ3LpuuAeaGr), not the icon Set 1/2.
