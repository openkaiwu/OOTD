<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import AppHeader from "@/components/AppHeader.vue";
import { createDemoGarments } from "@/domain/demo";
import { generateOutfits, wardrobeReadiness } from "@/domain/recommendation";
import type { RecommendationContext } from "@/domain/types";
import { useOutfitStore } from "@/stores/outfits";
import { useSettingsStore } from "@/stores/settings";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useWeatherStore } from "@/stores/weather";
import { useAppTheme } from "@/composables/useAppTheme";

const wardrobe = useWardrobeStore();
const outfits = useOutfitStore();
const settings = useSettingsStore();
const weatherStore = useWeatherStore();
const { themeClass } = useAppTheme();
const generating = ref(false);
const featuredIndex = ref(0);

const garments = computed(() => wardrobe.activeGarments);
const featuredOutfits = computed(() => outfits.latestRecommendations.length ? outfits.latestRecommendations : outfits.outfits.slice(0, 3));
const currentOutfit = computed(() => featuredOutfits.value[featuredIndex.value] || featuredOutfits.value[0]);
const readiness = computed(() => wardrobeReadiness(garments.value));

onShow(() => {
  wardrobe.hydrate();
  outfits.hydrate();
  settings.hydrate();

  // APK 预览使用查询参数初始化 50 件演示衣物，正式数据不受影响。
  if (typeof location !== "undefined") {
    const params = new URLSearchParams(location.search);
    const demo = ["1", "40", "50", "100"].includes(params.get("demo") || "");
    const reset = params.get("resetDemo") === "1";
    const resetKey = "ootd_demo_wardrobe_reset_v4_womens_100";
    const shouldReset = demo && reset && typeof sessionStorage !== "undefined" && sessionStorage.getItem(resetKey) !== "done";
    if (shouldReset) {
      wardrobe.replaceAll(createDemoGarments());
      outfits.replaceAll([]);
      sessionStorage.setItem(resetKey, "done");
    } else if (demo && !wardrobe.activeGarments.length) {
      wardrobe.addBatch(createDemoGarments());
    }
  }
  chooseFeaturedOutfit();
});

function open(url: string): void { uni.navigateTo({ url }); }
function openWardrobe(): void { uni.switchTab({ url: "/pages/wardrobe/wardrobe" }); }
function openOutfits(): void { uni.switchTab({ url: "/pages/outfits/outfits" }); }
function openCurrentOutfit(): void {
  if (currentOutfit.value) open("/pages/result/result?source=home");
}

function chooseFeaturedOutfit(): void {
  const count = featuredOutfits.value.length;
  if (count < 2) {
    featuredIndex.value = 0;
    return;
  }
  let next = Math.floor(Math.random() * count);
  if (next === featuredIndex.value) next = (next + 1) % count;
  featuredIndex.value = next;
}

function generate(): void {
  if (readiness.value === "empty" || readiness.value === "insufficient") {
    open("/pages/add/add?entry=home");
    return;
  }

  generating.value = true;
  const context: RecommendationContext = {
    source: "home",
    sceneId: "weekend",
    weatherSnapshot: weatherStore.weather || undefined,
    preferredStyleIds: settings.preferences.styleIds,
    preferredColorIds: settings.preferences.preferredColorIds,
    avoidedColorIds: settings.preferences.avoidedColorIds,
    excludedOutfitSignatures: [],
    generatedAt: Date.now(),
  };
  const result = generateOutfits(garments.value, context, settings.preferences);

  setTimeout(() => {
    outfits.setRecommendations(result);
    chooseFeaturedOutfit();
    generating.value = false;
    if (result.length) open("/pages/result/result?source=home");
    else uni.showToast({ title: "还缺少可组合的基础单品", icon: "none" });
  }, 320);
}
</script>

<template>
  <scroll-view :class="['page-shell','home-page',themeClass]" scroll-y>
    <AppHeader />
    <view class="hero-header">
      <view class="brand-lockup" aria-label="你的魔法衣橱">
        <text>你的 <text>魔法衣橱</text></text>
      </view>
    </view>

    <view class="action-grid">
      <button class="action-card weather" @tap="open('/pages/weather/weather')"><text class="action-icon">☀</text><view><text>今日天气</text></view></button>
      <button class="action-card add" @tap="open('/pages/add/add?entry=home')"><text class="action-icon">＋</text><view><text>添加单品</text></view></button>
      <button class="action-card closet" @tap="openWardrobe"><text class="action-icon">♧</text><view><text>我的衣橱</text></view></button>
      <button class="action-card inspire" @tap="openOutfits"><text class="action-icon">✦</text><view><text>穿搭灵感</text></view></button>
    </view>

    <view class="section-head">
      <view><text class="accent-bar" aria-hidden="true" /><text>今日推荐</text></view>
    </view>

    <view
      v-if="garments.length"
      class="outfit-board"
      :class="{ interactive: currentOutfit }"
      :role="currentOutfit ? 'button' : undefined"
      :aria-label="currentOutfit ? '查看当前穿搭方案' : '今日穿搭预览'"
      @tap="openCurrentOutfit"
    >
      <image class="outfit-image" src="/static/reference/orb-new.png" mode="aspectFit" />
      <view class="outfit-copy">
        <text>{{ currentOutfit?.name || '轻盈日常' }}</text>
        <text class="recommendation-note">随机推荐今日穿搭。天气推荐穿搭见「今日天气」模块，个性化场景风格推荐穿搭请到「穿搭灵感」页面。</text>
      </view>
    </view>

    <view v-else class="empty-board">
      <text>先添加衣物</text>
    </view>

    <button class="generate-button" :loading="generating" :disabled="generating" hover-class="generate-button--pressed" @tap="generate">
      {{ generating ? '正在生成…' : readiness === 'empty' ? '添加衣物' : '生成今日穿搭' }}
    </button>

  </scroll-view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.home-page { height:100vh; box-sizing:border-box; background:$pearl; }
.home-page :deep(.app-header) { margin-bottom:18rpx; }
.hero-header { display:flex; align-items:center; justify-content:space-between; gap:$space-4; min-height:232rpx; box-sizing:border-box; padding:36rpx $space-5 64rpx; border:1rpx solid $line; border-radius:var(--theme-radius-card,32rpx) var(--theme-radius-card,32rpx) calc(var(--theme-radius-card,32rpx) + 14rpx) calc(var(--theme-radius-card,32rpx) + 14rpx); background:linear-gradient(135deg,var(--theme-hero-start) 0%,var(--theme-hero-mid) 55%,var(--theme-hero-end) 100%); }
.brand-lockup { min-width:0; }
.brand-lockup text { display:block; }
.brand-lockup>text { color:$ink; font-size:52rpx; font-weight:760; letter-spacing:var(--theme-display-letter-spacing,-1rpx); line-height:1.18; }
.brand-lockup>text text { display:inline; color:$lilac-strong; }
.action-grid { display:grid; position:relative; z-index:2; grid-template-columns:repeat(2,minmax(0,1fr)); gap:$space-3; margin:-32rpx 4rpx 12rpx; }
.action-card { display:flex; align-items:center; justify-content:flex-start; gap:$space-3; min-width:0; min-height:136rpx; margin:0; padding:$space-3; border:1rpx solid $line; border-radius:var(--theme-radius-card,24rpx); background:$surface-elevated; box-shadow:$shadow; color:$ink; text-align:left; }
.action-card:active { transform:scale(.98); }
.action-icon { display:flex; flex:0 0 68rpx; align-items:center; justify-content:center; width:68rpx; height:68rpx; border-radius:19rpx; background:$lilac-soft; color:$lilac-deep; font-size:34rpx; font-weight:800; line-height:68rpx; text-align:center; }
.action-card.weather .action-icon { background:var(--theme-icon-warm); color:var(--theme-icon-warm-ink); }
.action-card.closet .action-icon { background:var(--theme-icon-mint); color:var(--theme-icon-mint-ink); }
.action-card.inspire .action-icon { background:var(--theme-icon-secondary); color:var(--theme-icon-secondary-ink); }
.action-card view { min-width:0; }
.action-card view text { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:$ink; font-size:$text-body; font-weight:680; }
.section-head { display:flex; align-items:center; justify-content:space-between; min-height:108rpx; }
.section-head>view { display:flex; align-items:center; gap:12rpx; }
.section-head>view text:last-child { color:$ink; font-size:32rpx; font-weight:850; }
.section-head>text { color:$muted; font-size:$text-caption; }
.accent-bar { width:7rpx; height:30rpx; border-radius:999rpx; background:$lilac; }
.outfit-board { @include card; position:relative; display:grid; grid-template-columns:minmax(0,45%) minmax(0,55%); height:350rpx; overflow:hidden; background:linear-gradient(145deg,var(--theme-feature-start),var(--theme-feature-end)); }
.outfit-board.interactive:active { opacity:.86; }
.outfit-image { align-self:center; width:100%; height:320rpx; }
.outfit-copy { align-self:center; min-width:0; padding:$space-4 $space-5 $space-4 $space-1; }
.outfit-copy text { display:block; }
.outfit-copy text:first-child { color:$ink; font-size:32rpx; font-weight:700; line-height:1.25; }
.outfit-copy .recommendation-note { margin-top:12rpx; color:$muted; font-size:20rpx; line-height:1.55; }
.empty-board { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:360rpx; box-sizing:border-box; padding:34rpx; border:1rpx solid $line; border-radius:$radius-lg; background:$surface-soft; text-align:center; }
.empty-board text { display:block; color:$ink; font-size:34rpx; font-weight:900; }
.generate-button { @include primary-button; width:100%; margin:$space-4 0; font-size:30rpx; }
.generate-button--pressed { transform:translateY(2rpx); filter:brightness(.96); }
.generate-button[disabled] { opacity:.64; }

@media (max-width:370px) {
  .brand-lockup>text:last-child { font-size:43rpx; }
  .hero-header { padding-right:24rpx; padding-left:24rpx; }
  .action-card { gap:9rpx; padding:12rpx; }
  .action-icon { flex-basis:60rpx; width:60rpx; height:60rpx; line-height:60rpx; }
}
</style>
