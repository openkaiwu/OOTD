# OOTD · What to Wear Tomorrow (Android)

**[简体中文](README.zh-CN.md)** | English

The rebuildable Android source of "What to Wear Tomorrow (OOTD)". The UI and business logic are built with UniApp/Vue 3, while a lightweight native Android shell handles the WebView, local assets, camera, location, and system-sharing bridges.

## Screenshots

| Home | Wardrobe | Outfits | Profile |
| --- | --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Wardrobe](docs/screenshots/wardrobe.png) | ![Outfits](docs/screenshots/outfits.png) | ![Profile](docs/screenshots/profile.png) |

## Project Structure

- `uniapp/` — Vue 3 + UniApp pages, state management, domain logic, i18n, image processing, and tests.
- `app-shell/` — Lightweight native Android shell (Java, manifest, resources, launcher icon, and APK build scripts).
- `scripts/` — Helper scripts for installing the APK and starting/stopping the Android emulator.
- `BUILD_AND_RUN.md` — Environment variables, signing, builds, emulator runs, and troubleshooting.

## Features

- Local wardrobe: camera/gallery import, garment-recognition assist, category and favorite management.
- Weather-aware suggestions with geolocation and city search.
- Occasion & style conditions, three recommendations per day, like/dislike, save, worn history, and batch record management.
- Themes, multi-language UI, AI assistant configuration, feedback, data import/export, and local diagnostics.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vue 3, TypeScript, UniApp, Pinia, Vue I18n, Vite |
| Android shell | Java, Android WebView, Android SDK Build Tools |
| Testing | Vitest, vue-tsc |
| Minimum Android | Android 8.0 (API 26) |
| Build target | Android API 35 / Build Tools 35.0.0 |

## Getting Started

Read [BUILD_AND_RUN.md](BUILD_AND_RUN.md) first. After configuring the environment variables and signing keys:

```powershell
cd uniapp
npm ci
npm run type-check
npm test -- --run

cd ..\app-shell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-preview.ps1
```

The resulting APK is written to `app-shell/output/ootd-preview-0.1.10.apk`. That directory and the keystore files are ignored by `.gitignore` by default and will not be pushed to GitHub.

You can also grab a ready-made build from [Releases](https://github.com/openkaiwu/OOTD/releases) — no build environment required (Android 8.0+).

## Security & Release

- Never commit `*.keystore`, `.jks`, SDKs, emulator images, `node_modules`, `.env`, or generated APKs.
- API keys are entered by the user inside the app and stored locally; still check for accidentally committed test keys before pushing.
- The current native shell is a locally signed acceptance build. Before publishing to app stores, replace the package name, app signing, version numbers, privacy policy, API domains, and distribution channel configuration, and complete on-device regression testing.
