@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-ootd-android-preview.ps1"
if errorlevel 1 (
  echo.
  echo Failed to start the Android preview. Review the message above.
  pause
)
