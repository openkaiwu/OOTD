# Android 构建与运行指南

## 运行环境

当前构建脚本面向 Windows 10/11 与 PowerShell 7。建议使用以下版本：

| 组件 | 要求 |
| --- | --- |
| Node.js | 20.x（项目约束：`>=20 <21`） |
| JDK | JDK 17 |
| Android SDK Platform | android-35 |
| Android Build Tools | 35.0.0 |
| Android Platform Tools / Emulator | 当前稳定版 |
| npm | 随 Node.js 20 提供 |

SDK 可安装在任意目录；不要把 SDK、AVD、签名文件或 npm 依赖提交到仓库。

## 首次配置

在 PowerShell 会话中设置以下变量。路径示例需要按自己的电脑修改：

```powershell
$env:OOTD_NODE_HOME = 'C:\Program Files\nodejs'
$env:OOTD_JDK_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17'
$env:ANDROID_SDK_ROOT = 'C:\Android\Sdk'
$env:OOTD_KEYSTORE_PATH = "$PWD\.android-local\keys\ootd-preview.keystore"
$env:OOTD_KEYSTORE_ALIAS = 'ootd-preview'
$env:OOTD_KEYSTORE_STORE_PASSWORD = '请使用你自己的安全密码'
$env:OOTD_KEYSTORE_KEY_PASSWORD = '请使用你自己的安全密码'
```

`ANDROID_SDK_ROOT` 目录中需要包含：

```text
platforms/android-35/android.jar
build-tools/35.0.0/aapt2.exe
build-tools/35.0.0/d8.bat
build-tools/35.0.0/zipalign.exe
build-tools/35.0.0/apksigner.bat
platform-tools/adb.exe
emulator/emulator.exe
```

## 创建本地开发签名

首次构建可用 JDK 自带的 `keytool` 创建只用于开发测试的签名。密码不要写进脚本、Markdown 或 Git 配置。

```powershell
New-Item -ItemType Directory -Force .\.android-local\keys
& "$env:OOTD_JDK_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore $env:OOTD_KEYSTORE_PATH `
  -alias $env:OOTD_KEYSTORE_ALIAS `
  -keyalg RSA -keysize 2048 -validity 10000
```

命令执行时输入的 store/key 密码应分别写入 `OOTD_KEYSTORE_STORE_PASSWORD` 与 `OOTD_KEYSTORE_KEY_PASSWORD`。正式发布请使用独立、受管控的生产签名。

## 安装依赖与检查

```powershell
cd uniapp
npm ci
npm run type-check
npm test -- --run
```

## 构建 APK

从仓库根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\app-shell\build-preview.ps1
```

脚本会先构建 UniApp 的 H5 资源，再编译 Android 资源与 Java 壳，最后签名、对齐并校验 APK。产物为：

```text
app-shell/output/ootd-preview-0.1.10.apk
```

仅在已手动构建 H5 且确认其仍是最新版本时，才可使用 `-SkipWebBuild`。

## 模拟器安装与运行

创建一个 API 34 或更高的 AVD，并指定其目录：

```powershell
$env:ANDROID_AVD_HOME = 'C:\Android\avd'
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-ootd-android-preview.ps1 -AvdName OOTD_API34
```

若模拟器已运行，脚本会直接安装并启动 APK。停止模拟器可执行：

```powershell
.\scripts\stop-ootd-emulator.cmd
```

## GitHub 提交前检查

```powershell
git status --ignored
```

确认没有签名文件、APK、构建目录、SDK、AVD、`node_modules`、本地数据或 `.env` 被加入暂存区。建议通过 GitHub Releases 分发 APK，而不是提交到 Git 历史中。
