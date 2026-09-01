MÖLKKY COMPANION ANDROID

1. Otevři tuto složku v Android Studio.
2. Nech Android Studio doinstalovat Android SDK / Gradle, pokud o to požádá.
3. Build > Generate Signed App Bundle or APK > APK.
4. Projekt už obsahuje release signing konfiguraci v signing.properties.
5. Výsledná release APK bude v app/build/outputs/apk/release/.

Aktualizace:
- NEMĚNIT applicationId: cz.molkky.companion
- NEMĚNIT molkky-update-key.jks
- pokaždé zvýšit versionCode
- data WebView/localStorage zůstanou při standardní aktualizaci zachována.

Verze 1.1.0 obsahuje Head-to-head a ELO.
