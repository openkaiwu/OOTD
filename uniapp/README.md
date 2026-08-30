# 明天穿什么

“明天穿什么”是一个本地优先的智能衣橱与天气穿搭助手。生产工程采用 `uni-app + Vue 3 + TypeScript + Vite + Pinia`，Android 为首发端，同时持续保证微信小程序构建可用。

## 当前实现

- Diamond Glass 四 Tab：主页、衣橱、穿搭、我的。
- 相机/相册最多 9 张批量导入、压缩、草稿恢复、逐件校对与单项失败隔离。
- 衣橱搜索、分类、排序、收藏、编辑、替换图片、软删除和 5 秒撤销。
- Open-Meteo 城市搜索/定位天气、8 秒超时、30 分钟新鲜缓存、2 小时过期提示和示例天气。
- 本地推荐引擎：基础组合硬约束，按天气/场景/色彩/偏好/轮换评分，每轮输出 3 套差异化方案。
- 喜欢、不喜欢原因、保存、分享、已穿、换一批、指定单品、偏好与真实使用统计。
- 版本化本地存储、写入回滚、JSON 备份合并、双重清空确认和最多 300 条本地诊断事件。
- 50 件女士流行款模拟数据，复用现有开放许可图片，覆盖上装、下装、连衣裙、外套、鞋和包。

## 环境

- Node.js 20 LTS（仓库包含 `.nvmrc`）。
- npm 10+。
- Android 本地预览壳使用 JDK 17、Android SDK 35 与 Build Tools 35.0.0。完整配置见仓库根目录的 [`BUILD_AND_RUN.md`](../BUILD_AND_RUN.md)。

Windows 系统盘空间紧张时可把 npm 缓存放到工作盘：

```powershell
npm ci
```

## 常用命令

```powershell
npm.cmd run dev:h5 -- --host 0.0.0.0 --port 4174
npm.cmd run type-check
npm.cmd run test
npm.cmd run build:h5
npm.cmd run build:mp-weixin
npm.cmd run build:app
npm.cmd run android:preflight
npm.cmd run verify:node20
```

H5 演示时，打开 `?demo=50&resetDemo=1` 可重置为完整模拟衣橱；`?demo=1` 只在衣橱为空时注入。演示数据不会自动进入正式 App 或微信小程序数据。

图片作者、来源与许可见 [`DEMO_ASSET_ATTRIBUTION.md`](./DEMO_ASSET_ATTRIBUTION.md)，重新下载素材可运行 `scripts/download-demo-assets.ps1`。

## 目录

- `src/domain`：稳定类型、端口、识别规则、推荐与统计纯函数。
- `src/infrastructure`：Repository、平台适配、媒体、天气、分享、备份和本地日志。
- `src/stores`：Pinia 状态与业务用例编排。
- `src/pages`：Vue SFC 页面，不使用 TSX。
- `src/styles/theme.scss`：Diamond Glass 颜色、字号、间距、圆角、阴影与按钮 Token。
- `scripts/local-android-preflight.ps1`：本地 Android 工具链和签名自检。

## Android 本地打包

本仓库的 Android 预览壳不使用云打包，也不提交签名证书。请从仓库根目录阅读 [`BUILD_AND_RUN.md`](../BUILD_AND_RUN.md)，并使用 `../app-shell/build-preview.ps1` 构建 APK。
