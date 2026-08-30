<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useOutfitStore } from "@/stores/outfits";
import { useSettingsStore } from "@/stores/settings";
import { logEvent } from "@/infrastructure/events";
import { applyThemeChrome } from "@/composables/useAppTheme";
import { installLocalization } from "@/i18n";

onLaunch(() => {
  useWardrobeStore().hydrate();
  useOutfitStore().hydrate();
  const settings = useSettingsStore();
  settings.hydrate();
  applyThemeChrome(settings.appMeta.themeId);
  installLocalization();
  logEvent("app_launch", { version: "0.1.0" });
});
</script>
<style lang="scss">
@use "@/styles/theme.scss" as *;

@font-face {
  font-family: "OOTD Inter";
  src: url("/static/fonts/InterVariable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

page {
  min-height: 100%;
  background: $pearl;
  color: $ink;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Noto Sans SC", "PingFang SC", "Microsoft YaHei UI", sans-serif;
  font-size: 28rpx;
  font-weight: 400;
  line-height: 1.5;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  letter-spacing: 0.1rpx;
}

body[data-app-language="en"] page,
body[data-app-language="en"] view,
body[data-app-language="en"] text,
body[data-app-language="en"] button,
body[data-app-language="en"] input {
  font-family: "OOTD Inter", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  letter-spacing: 0;
  font-variation-settings: "opsz" 20;
}

body[data-app-language="en"] .menu-card button view text:first-child,
body[data-app-language="en"] .category-chip,
body[data-app-language="en"] .filter-chip {
  font-size: 24rpx;
}

.theme-dream {
  /* Airy editorial: light colour is an accent, never the whole canvas. */
  --theme-bg:#fff9fb; --theme-surface:#ffffff; --theme-surface-alpha:rgba(255,255,255,.94); --theme-surface-soft:#fff4f8; --theme-surface-elevated:#ffffff;
  --theme-ink:#1a1a1a; --theme-ink-soft:#4f484c; --theme-muted:#71696d; --theme-muted-light:#aaa2a6;
  --theme-line:#ece6e9; --theme-line-strong:#ddd3d8; --theme-accent:#c77a9a; --theme-accent-soft:#e8a0bf;
  --theme-accent-deep:#a65076; --theme-accent-pressed:#d98aaa; --theme-tint:#fff0f5; --theme-secondary:#e6e0f8;
  --theme-secondary-soft:#f4f0fc; --theme-focus:#914064; --theme-mint:#d4f1e6;
  --theme-button-start:#edabc7; --theme-button-end:#d98caf; --theme-focus-ring-soft:rgba(166,80,118,.12);
  --theme-shadow:0 14rpx 36rpx rgba(103,62,83,.09); --theme-button-shadow:0 14rpx 28rpx rgba(199,122,154,.22);
  --theme-image-surface:#fff7fa; --theme-hero-start:#fff0f6; --theme-hero-mid:#fff9fc; --theme-hero-end:#f1edff;
  --theme-feature-start:#f5efff; --theme-feature-end:#fff5fa; --theme-icon-warm:#fff1d8; --theme-icon-warm-ink:#a8741f;
  --theme-icon-mint:#e0f3e8; --theme-icon-mint-ink:#3f7c65; --theme-icon-secondary:#f1ecff; --theme-icon-secondary-ink:#7663a5;
  --theme-radius-card:28rpx; --theme-radius-control:22rpx; --theme-display-letter-spacing:-1rpx;
}

.theme-ins {
  /* Quiet fashion magazine: warm neutrals, crisp edges, image-led composition. */
  --theme-bg:#f6f5f2; --theme-surface:#ffffff; --theme-surface-alpha:rgba(255,255,255,.96); --theme-surface-soft:#efeeea; --theme-surface-elevated:#ffffff;
  --theme-ink:#111; --theme-ink-soft:#383838; --theme-muted:#707070; --theme-muted-light:#a5a5a5;
  --theme-line:#e4e4e1; --theme-line-strong:#cfcfcb; --theme-accent:#171717; --theme-accent-soft:#666;
  --theme-accent-deep:#171717; --theme-accent-pressed:#000; --theme-tint:#f0f0ee; --theme-secondary:#deded9;
  --theme-secondary-soft:#f3f3f0; --theme-focus:#111; --theme-mint:#e7e7e2;
  --theme-button-start:#292929; --theme-button-end:#111; --theme-focus-ring-soft:rgba(17,17,17,.15);
  --theme-shadow:0 8rpx 20rpx rgba(0,0,0,.055); --theme-button-shadow:0 12rpx 24rpx rgba(0,0,0,.16);
  --theme-image-surface:#f2f1ee; --theme-hero-start:#efeeea; --theme-hero-mid:#fafaf8; --theme-hero-end:#e7e6e1;
  --theme-feature-start:#e9e8e4; --theme-feature-end:#f8f8f6; --theme-icon-warm:#f0eee7; --theme-icon-warm-ink:#36342f;
  --theme-icon-mint:#e8e8e3; --theme-icon-mint-ink:#30302d; --theme-icon-secondary:#e6e5e0; --theme-icon-secondary-ink:#242424;
  --theme-radius-card:14rpx; --theme-radius-control:10rpx; --theme-display-letter-spacing:-.5rpx;
}

.theme-forest {
  /* Natural journal: muted botanical colour and tactile, relaxed surfaces. */
  --theme-bg:#f4f5ef; --theme-surface:#fffdf8; --theme-surface-alpha:rgba(255,253,248,.95); --theme-surface-soft:#f4f2e9; --theme-surface-elevated:#fffefa;
  --theme-ink:#243128; --theme-ink-soft:#465148; --theme-muted:#788078; --theme-muted-light:#a7ada5;
  --theme-line:#dfe5da; --theme-line-strong:#cad4c5; --theme-accent:#6f8a70; --theme-accent-soft:#a8bca1;
  --theme-accent-deep:#56705a; --theme-accent-pressed:#536a55; --theme-tint:#edf3e9; --theme-secondary:#d9c3a7;
  --theme-secondary-soft:#f4ede3; --theme-focus:#4d6752; --theme-mint:#dcebd9;
  --theme-button-start:#8ca184; --theme-button-end:#627c66; --theme-focus-ring-soft:rgba(86,112,90,.15);
  --theme-shadow:0 12rpx 30rpx rgba(58,77,61,.085); --theme-button-shadow:0 14rpx 28rpx rgba(86,112,90,.2);
  --theme-image-surface:#f0f3ea; --theme-hero-start:#e8f0e3; --theme-hero-mid:#f8f7f0; --theme-hero-end:#f1e7d9;
  --theme-feature-start:#e3ece0; --theme-feature-end:#f7efe5; --theme-icon-warm:#f4eadb; --theme-icon-warm-ink:#806548;
  --theme-icon-mint:#ddebd9; --theme-icon-mint-ink:#4e6f55; --theme-icon-secondary:#efe6d8; --theme-icon-secondary-ink:#7b6548;
  --theme-radius-card:30rpx; --theme-radius-control:24rpx; --theme-display-letter-spacing:-.5rpx;
}

view,
text,
button,
input,
textarea,
picker {
  font-family: inherit;
  font-synthesis: none;
}

button::after {
  border: none;
}

/* uni-button 默认为块级 + 2.55 倍行高，min-height 控件里的单行文字会贴在顶部；
   统一改为弹性布局居中，左对齐或纵向堆叠的按钮在各页面内自行覆盖。 */
button {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

button,
input,
switch {
  -webkit-tap-highlight-color: transparent;
}

button:focus-visible,
input:focus-visible {
  outline: 4rpx solid var(--theme-focus, #914064);
  outline-offset: 3rpx;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* H5 预览保持与 App 原生滚动视图一致，不显示浏览器滚动条。 */
uni-scroll-view::-webkit-scrollbar,
.uni-scroll-view::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* #ifdef H5 */
* {
  scrollbar-width: none;
}

*::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
/* #endif */
</style>
