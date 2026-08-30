[CmdletBinding()]
param(
    [switch]$SkipWebBuild
)

$ErrorActionPreference = "Stop"

$previewRoot = (Resolve-Path $PSScriptRoot).Path
$workspaceRoot = (Resolve-Path (Join-Path $previewRoot "..")).Path
$uniProject = Join-Path $workspaceRoot "uniapp"
$jdkRoot = $env:OOTD_JDK_HOME
$nodeRoot = $env:OOTD_NODE_HOME
$androidSdk = $env:ANDROID_SDK_ROOT
$keystore = $env:OOTD_KEYSTORE_PATH
$keystoreAlias = $env:OOTD_KEYSTORE_ALIAS
$keystoreStorePassword = $env:OOTD_KEYSTORE_STORE_PASSWORD
$keystoreKeyPassword = $env:OOTD_KEYSTORE_KEY_PASSWORD
$h5Output = Join-Path $uniProject "dist\build\h5"
$assetsRoot = Join-Path $previewRoot "assets\www"
$buildRoot = Join-Path $previewRoot "build"
$outputRoot = Join-Path $previewRoot "output"

foreach ($variable in @("OOTD_JDK_HOME", "OOTD_NODE_HOME", "ANDROID_SDK_ROOT", "OOTD_KEYSTORE_PATH", "OOTD_KEYSTORE_ALIAS", "OOTD_KEYSTORE_STORE_PASSWORD", "OOTD_KEYSTORE_KEY_PASSWORD")) {
    if (-not (Get-Item "Env:$variable" -ErrorAction SilentlyContinue).Value) {
        throw "Missing environment variable: $variable. See ..\\BUILD_AND_RUN.md"
    }
}

$buildTools = Join-Path $androidSdk "build-tools\35.0.0"
$androidJar = Join-Path $androidSdk "platforms\android-35\android.jar"
$env:JAVA_HOME = $jdkRoot
$env:Path = $nodeRoot + ";" + (Join-Path $jdkRoot "bin") + ";" + $env:Path

$requiredFiles = @(
    (Join-Path $jdkRoot "bin\javac.exe"),
    (Join-Path $jdkRoot "bin\jar.exe"),
    (Join-Path $nodeRoot "node.exe"),
    (Join-Path $nodeRoot "npm.cmd"),
    (Join-Path $buildTools "aapt2.exe"),
    (Join-Path $buildTools "d8.bat"),
    (Join-Path $buildTools "zipalign.exe"),
    (Join-Path $buildTools "apksigner.bat"),
    $androidJar,
    $keystore,
    (Join-Path $previewRoot "AndroidManifest.xml"),
    (Join-Path $previewRoot "src\com\wearing\ootd\preview\MainActivity.java"),
    (Join-Path $previewRoot "src\com\wearing\ootd\preview\ShareProvider.java")
)

foreach ($path in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing required file: $path"
    }
}

if (-not $SkipWebBuild) {
    $env:OOTD_APK_PREVIEW = "1"
    Push-Location $uniProject
    try {
        & (Join-Path $nodeRoot "npm.cmd") run build:h5
        if ($LASTEXITCODE -ne 0) {
            throw "uni-app H5 build failed."
        }
    } finally {
        Pop-Location
        Remove-Item Env:\OOTD_APK_PREVIEW -ErrorAction SilentlyContinue
    }
}

foreach ($target in @($assetsRoot, $buildRoot)) {
    $fullTarget = [System.IO.Path]::GetFullPath($target)
    if (-not $fullTarget.StartsWith($previewRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to clean path outside preview project: $fullTarget"
    }
    if (Test-Path -LiteralPath $fullTarget) {
        Remove-Item -LiteralPath $fullTarget -Recurse -Force
    }
}

New-Item -ItemType Directory -Path $assetsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
Copy-Item -Path (Join-Path $h5Output "*") -Destination $assetsRoot -Recurse -Force

$compiledResources = Join-Path $buildRoot "compiled-resources.zip"
$generatedRoot = Join-Path $buildRoot "generated"
$classesRoot = Join-Path $buildRoot "classes"
$dexRoot = Join-Path $buildRoot "dex"
$unsignedApk = Join-Path $buildRoot "preview-unsigned.apk"
$alignedApk = Join-Path $buildRoot "preview-aligned.apk"
$finalApk = Join-Path $outputRoot "ootd-preview-0.1.10.apk"

New-Item -ItemType Directory -Path $generatedRoot,$classesRoot,$dexRoot -Force | Out-Null

$aapt2 = Join-Path $buildTools "aapt2.exe"
& $aapt2 compile --dir (Join-Path $previewRoot "res") -o $compiledResources
if ($LASTEXITCODE -ne 0) { throw "aapt2 resource compilation failed." }

& $aapt2 link `
    -o $unsignedApk `
    --manifest (Join-Path $previewRoot "AndroidManifest.xml") `
    -I $androidJar `
    --min-sdk-version 26 `
    --target-sdk-version 35 `
    --version-code 11 `
    --version-name "0.1.10-preview" `
    --java $generatedRoot `
    --auto-add-overlay `
    $compiledResources
if ($LASTEXITCODE -ne 0) { throw "aapt2 APK linking failed." }

$javaSources = @(
    (Join-Path $previewRoot "src\com\wearing\ootd\preview\MainActivity.java"),
    (Join-Path $previewRoot "src\com\wearing\ootd\preview\ShareProvider.java"),
    (Join-Path $generatedRoot "com\wearing\ootd\preview\R.java")
)

& (Join-Path $jdkRoot "bin\javac.exe") `
    -encoding UTF-8 `
    -source 8 `
    -target 8 `
    -bootclasspath $androidJar `
    -d $classesRoot `
    $javaSources
if ($LASTEXITCODE -ne 0) { throw "Java compilation failed." }

$classFiles = Get-ChildItem -LiteralPath $classesRoot -Recurse -Filter *.class | ForEach-Object FullName
& (Join-Path $buildTools "d8.bat") --min-api 26 --output $dexRoot $classFiles
if ($LASTEXITCODE -ne 0) { throw "D8 conversion failed." }

& (Join-Path $jdkRoot "bin\jar.exe") uf $unsignedApk -C $previewRoot assets
if ($LASTEXITCODE -ne 0) { throw "Adding normalized web assets to APK failed." }

& (Join-Path $jdkRoot "bin\jar.exe") uf $unsignedApk -C $dexRoot classes.dex
if ($LASTEXITCODE -ne 0) { throw "Adding classes.dex to APK failed." }

& (Join-Path $buildTools "zipalign.exe") -f -p 4 $unsignedApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "APK alignment failed." }

& (Join-Path $buildTools "apksigner.bat") sign `
    --ks $keystore `
    --ks-key-alias $keystoreAlias `
    --ks-pass "pass:$keystoreStorePassword" `
    --key-pass "pass:$keystoreKeyPassword" `
    --out $finalApk `
    $alignedApk
if ($LASTEXITCODE -ne 0) { throw "APK signing failed." }

& (Join-Path $buildTools "apksigner.bat") verify --verbose --print-certs $finalApk
if ($LASTEXITCODE -ne 0) { throw "APK signature verification failed." }

$apk = Get-Item -LiteralPath $finalApk
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $finalApk).Hash
Write-Host ""
Write-Host "Preview APK: $($apk.FullName)"
Write-Host "Size: $($apk.Length) bytes"
Write-Host "SHA256: $hash"
