# Google Play update VR34: steps for the PC session

Thread "Ship the next Reborn store update", 21 Nov 2026. M approved in his own words at 4:28 pm Eastern:
"Okay, let's ship the new updates on both Google Store and App Store." (message cmsg_017HbDph7xS7prxZ1wbDeRLpX9QCsYNbryHe2RSEiFTLBH)
Same web app as the iPhone build going to Apple (public repo ios-shell/www at fb9e5bc).
Save files only in `Claude Playground\Reborn App\play-build\` (and the Drive copy). Keep older AABs. Delete nothing.
**Never touch the update feed (update/ or update/store/) and never press Send for review / Publish: those are M's.**

## 1. Get the web app
- Public repo branch `vr34-play`, file `VR34-store-www.zip` (also project Library reborn-app/vr34-build/) (15,589,534 bytes),
  SHA-256 `bc284382d78e9fb06f1e6e4abbe20d37b58af0075d91dec04e8cfb3031dff328`. Any other hash: stop and report.
- Save as `play-build\VR34-store-www.zip`, unzip to `play-build\www-vr34\` (index.html at the top).

## 2. Build the AAB
- Same Android project and signing as the VR30 / VR32.2 store AABs (reborn-release.jks).
- versionCode: one higher than the highest code Play has ever received (VR30 = 10; the prepared VR32.2 used 11). Use 12 unless Play Console > App bundle explorer shows 12 or higher already, then highest + 1.
- versionName `"VR34"`. Copy www-vr34 into the project's web assets, `.\gradlew bundleRelease`.
- Check: package com.rebornrising.app, signer CN=Reborn Rising (SHA-1 starts 55f038d1), targetSdk 36, Health permissions READ only and the same list as VR30 (no new permission).
- Save as `play-build\RebornRising-VR34.aab` and copy to `G:\My Drive\Reborn App\play-build\`.

## 3. Play Console (app "Reborn Rising Health")
- Production > Create new release, upload RebornRising-VR34.aab, release name `VR34`.
- Release notes:
  - en-US: Fair records: a lighter set no longer gets a personal record badge. Fewer, smarter reminders: 1 to 2 a day, none for what you do not track. 14 ready-made programs and a new Progress page. Barcode number entry in Add food. Slimmer workout screen and rest timer. Start routine and exercise reordering fixes. Privacy policy link in Me.
  - es-419: Récords justos: una serie más ligera ya no recibe insignia de récord personal. Menos recordatorios y más inteligentes: 1 a 2 al día, ninguno para lo que no registra. 14 programas listos y una nueva página de Progreso. Ingreso del número de código de barras en Agregar comida. Pantalla de entrenamiento y temporizador de descanso más delgados. Correcciones al iniciar rutinas y al reordenar ejercicios. Enlace a la política de privacidad en Yo.
- If the safety check refuses the upload (over 10 MB), stop and tell M in one line where the AAB is and which button to press. Then stop at the review page; the final "Send changes for review" is M's tap.

## Report
AAB size, SHA-256, signer line, versionCode/versionName, permission list, and what Play Console still shows as missing.
