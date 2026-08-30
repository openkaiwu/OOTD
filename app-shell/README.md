# Android 原生壳

该目录是“明天穿什么”Android 预览壳。它以 Android WebView 加载 `../uniapp` 构建出的本地 H5 资源，并提供：

- 应用图标、启动配置、网络安全配置与 Android 权限声明。
- 相机、定位、系统分享等原生桥接。
- 不依赖云打包的本地 APK 资源编译、Java 编译、Dex、对齐与签名流程。

## 构建

构建前请在仓库根目录完成 `BUILD_AND_RUN.md` 中的环境变量与开发签名配置，然后执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-preview.ps1
```

生成物位于 `output/`，它不应提交到 GitHub。构建脚本使用环境变量获取 Node、JDK、Android SDK 和签名信息，不会读取或提交任何固定本机路径或密钥。
