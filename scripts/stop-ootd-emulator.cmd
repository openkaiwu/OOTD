@echo off
setlocal
if defined ANDROID_SDK_ROOT (
  set "ADB=%ANDROID_SDK_ROOT%\platform-tools\adb.exe"
) else (
  set "ADB=%~dp0..\.android-sdk\platform-tools\adb.exe"
)
if not exist "%ADB%" (
  echo ADB not found. Set ANDROID_SDK_ROOT or place the SDK in .android-sdk.
  exit /b 1
)
"%ADB%" -s emulator-5554 emu kill
