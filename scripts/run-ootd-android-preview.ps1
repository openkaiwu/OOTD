[CmdletBinding()]
param(
    [string]$ApkPath,
    [string]$SdkRoot = $env:ANDROID_SDK_ROOT,
    [string]$AvdHome = $env:ANDROID_AVD_HOME,
    [string]$AvdName = "OOTD_API34"
)

$ErrorActionPreference = "Stop"
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $ApkPath) {
    $ApkPath = Join-Path $workspaceRoot "app-shell\output\ootd-preview-0.1.10.apk"
}

if (-not $SdkRoot) { $SdkRoot = Join-Path $workspaceRoot ".android-sdk" }
if (-not $AvdHome) { $AvdHome = Join-Path $workspaceRoot ".android-avd" }
$sdkRoot = $SdkRoot
$avdHome = $AvdHome

$adb = Join-Path $sdkRoot "platform-tools\adb.exe"
$emulator = Join-Path $sdkRoot "emulator\emulator.exe"
$packageName = "com.wearing.ootd.preview"
$activityName = ".MainActivity"

foreach ($required in @($adb, $emulator, $ApkPath)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Missing required file: $required"
    }
}

$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_AVD_HOME = $avdHome
$env:VK_LOADER_LAYERS_DISABLE = "*"
$env:Path = "$(Join-Path $sdkRoot 'platform-tools');$env:Path"

function Get-RunningEmulator {
    $line = & $adb devices | Select-String '^emulator-\d+\s+device$' | Select-Object -First 1
    if ($line) { return ($line.Line -split '\s+')[0] }
    return $null
}

$serial = Get-RunningEmulator
if (-not $serial) {
    Write-Host "Starting Android 14 emulator $avdName..."
    Start-Process -FilePath $emulator `
        -ArgumentList @(
            '-avd', $avdName,
            '-no-boot-anim', '-no-snapshot', '-no-audio', '-no-metrics',
            '-cores', '2', '-memory', '2560',
            '-gpu', 'swiftshader_indirect',
            '-feature', '-Vulkan',
            '-feature', '-GLDirectMem',
            '-netdelay', 'none', '-netspeed', 'full'
        ) `
        -WindowStyle Normal | Out-Null

    for ($attempt = 0; $attempt -lt 48; $attempt++) {
        Start-Sleep -Seconds 5
        $serial = Get-RunningEmulator
        if ($serial) { break }
    }
}

if (-not $serial) {
    throw "The emulator did not connect to ADB within 4 minutes."
}

Write-Host "Waiting for Android to finish booting ($serial)..."
for ($attempt = 0; $attempt -lt 48; $attempt++) {
    $booted = ((& $adb -s $serial shell getprop sys.boot_completed 2>$null) | Out-String).Trim()
    if ($booted -eq '1') { break }
    Start-Sleep -Seconds 5
}

if ($booted -ne '1') {
    throw "Android did not finish booting within 4 minutes."
}

Write-Host "Installing $ApkPath..."
& $adb -s $serial install -r $ApkPath
if ($LASTEXITCODE -ne 0) { throw "APK installation failed." }

& $adb -s $serial shell am force-stop $packageName | Out-Null
& $adb -s $serial shell am start -W -n "$packageName/$activityName" | Out-Null

$appProcessId = ((& $adb -s $serial shell pidof $packageName) | Out-String).Trim()
if (-not $appProcessId) {
    throw "The APK was installed, but the app process did not remain running."
}

Write-Host ""
Write-Host "Ready: OOTD preview is running on $serial (PID $appProcessId, Android $(& $adb -s $serial shell getprop ro.build.version.release))."
Write-Host "Keep the emulator window open while testing."
