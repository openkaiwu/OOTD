<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { COLORS, SCENES, STYLES, STYLE_NAMES } from "@/domain/constants";
import { wardrobeReadiness } from "@/domain/recommendation";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useSettingsStore } from "@/stores/settings";
import { useWeatherStore } from "@/stores/weather";
import { useAppTheme } from "@/composables/useAppTheme";

const wardrobe = useWardrobeStore();
const settings = useSettingsStore();
const weather = useWeatherStore();
const { themeClass } = useAppTheme();
const sceneId = ref("");
const styleIds = ref<string[]>([]);
const preferredColors = ref<string[]>([]);
const avoidedColors = ref<string[]>([]);
const pinnedItemId = ref("");
const useWeather = ref(false);
const showAllScenes = ref(false);
const advancedOpen = ref(false);

onShow(() => {
  wardrobe.hydrate();
  settings.hydrate();
  const draft = uni.getStorageSync("ootd_condition_draft_v1") as Partial<{
    sceneId: string;
    styleIds: string[];
    preferredColors: string[];
    avoidedColors: string[];
    pinnedItemId: string;
    useWeather: boolean;
  }>;
  const hasDraft = Boolean(draft && typeof draft === "object");
  if (hasDraft) {
    sceneId.value = draft.sceneId || "";
    styleIds.value = Array.isArray(draft.styleIds) ? draft.styleIds : [];
    preferredColors.value = Array.isArray(draft.preferredColors) ? draft.preferredColors : [];
    avoidedColors.value = Array.isArray(draft.avoidedColors) ? draft.avoidedColors : [];
    pinnedItemId.value = draft.pinnedItemId || "";
    useWeather.value = Boolean(draft.useWeather && weather.weather);
    if (styleIds.value.length || preferredColors.value.length || avoidedColors.value.length || pinnedItemId.value) advancedOpen.value = true;
    uni.removeStorageSync("ootd_condition_draft_v1");
  }
  if (weather.weather && !hasDraft) useWeather.value = true;
});

const readiness = computed(() => wardrobeReadiness(wardrobe.activeGarments));
const recommendedScenes = computed(() => {
  const preferred = settings.preferences.sceneIds
    .map((id) => SCENES.find((scene) => scene.id === id))
    .filter((scene): scene is (typeof SCENES)[number] => Boolean(scene));
  return [...preferred, ...SCENES.filter((scene) => !preferred.some((item) => item.id === scene.id))].slice(0, 4);
});
const visibleScenes = computed(() => showAllScenes.value ? SCENES : recommendedScenes.value);
const selectedScene = computed(() => SCENES.find((scene) => scene.id === sceneId.value));
const pinnedItem = computed(() => wardrobe.activeGarments.find((item) => item.id === pinnedItemId.value));
const advancedCount = computed(() => styleIds.value.length + preferredColors.value.length + avoidedColors.value.length + (pinnedItemId.value ? 1 : 0));
const summary = computed(() => [
  selectedScene.value?.name,
  useWeather.value && weather.weather ? `${weather.weather.city} ${weather.weather.temp}°` : "",
  ...styleIds.value.map((id) => STYLE_NAMES[id]),
  pinnedItem.value ? `指定 ${pinnedItem.value.name}` : "",
].filter(Boolean).join(" · "));

function toggleStyle(id: string): void {
  styleIds.value = styleIds.value.includes(id) ? styleIds.value.filter((value) => value !== id) : [...styleIds.value, id].slice(-3);
}

function togglePreferredColor(id: string): void {
  preferredColors.value = preferredColors.value.includes(id) ? preferredColors.value.filter((value) => value !== id) : [...preferredColors.value, id].slice(-2);
}

function toggleAvoidedColor(id: string): void {
  avoidedColors.value = avoidedColors.value.includes(id) ? avoidedColors.value.filter((value) => value !== id) : [...avoidedColors.value, id].slice(-2);
}

function onWeatherToggle(event: Event): void {
  useWeather.value = Boolean((event as unknown as { detail: { value: boolean } }).detail.value);
}

function openWeather(): void {
  uni.navigateTo({ url: "/pages/weather/weather" });
}

function submit(): void {
  if (!sceneId.value) {
    uni.showToast({ title: "先选择一个场景", icon: "none" });
    return;
  }
  if (["empty", "insufficient"].includes(readiness.value)) {
    uni.showModal({
      title: "衣橱还不完整",
      content: "至少需要一件连衣裙，或上装和下装。现在去添加吗？",
      success: (result) => result.confirm && uni.navigateTo({ url: "/pages/add/add?entry=conditions" }),
    });
    return;
  }
  const query = encodeURIComponent(JSON.stringify({
    sceneId: sceneId.value,
    styleIds: styleIds.value,
    preferredColors: preferredColors.value,
    avoidedColors: avoidedColors.value,
    pinnedItemId: pinnedItemId.value,
    useWeather: useWeather.value,
  }));
  uni.navigateTo({ url: `/pages/result/result?context=${query}` });
}
</script>

<template>
  <view :class="['inner-page','conditions-page',themeClass]">
    <text class="eyebrow">CREATE A LOOK</text>
    <text class="section-title block">今天准备去哪里？</text>
    <text class="intro">选一个场景就能直接生成；风格、颜色和指定单品都可以稍后再加。</text>

    <view class="section-heading">
      <view><text>推荐场景</text><text>必选 · 选 1 个</text></view>
      <button :aria-label="showAllScenes ? '收起更多场景' : '查看全部场景'" @tap="showAllScenes = !showAllScenes">
        {{ showAllScenes ? '收起' : `全部 ${SCENES.length}` }}
      </button>
    </view>
    <view class="scene-grid">
      <button
        v-for="scene in visibleScenes"
        :key="scene.id"
        :class="{ active: sceneId === scene.id }"
        :aria-label="`${scene.name}，${scene.hint}${sceneId === scene.id ? '，已选择' : ''}`"
        @tap="sceneId = sceneId === scene.id ? '' : scene.id"
      >
        <view><text>{{ scene.name }}</text><text>{{ scene.hint }}</text></view>
        <text v-if="sceneId === scene.id" class="selection-state">已选</text>
      </button>
    </view>

    <view class="weather-card" :class="{ unavailable: !weather.weather }">
      <button class="weather-main" aria-label="设置天气" @tap="openWeather">
        <view>
          <text>结合天气推荐</text>
          <text v-if="weather.weather">{{ weather.weather.city }} · {{ weather.weather.temp }}° · {{ weather.weather.condition }}</text>
          <text v-else>尚未设置，点这里选择城市或定位</text>
        </view>
        <text class="weather-action">{{ weather.weather ? '更新' : '设置' }}</text>
      </button>
      <switch v-if="weather.weather" :checked="useWeather" color="#7754D6" aria-label="是否使用当前天气" @change="onWeatherToggle" />
    </view>

    <button class="advanced-toggle" :aria-expanded="advancedOpen" @tap="advancedOpen = !advancedOpen">
      <view><text>个性化条件</text><text>{{ advancedCount ? `已设置 ${advancedCount} 项` : '可选 · 不设置也能生成' }}</text></view>
      <text>{{ advancedOpen ? '收起' : '展开' }}</text>
    </button>

    <view v-if="advancedOpen" class="advanced-panel">
      <view class="field-heading"><text>偏好风格</text><text>已选 {{ styleIds.length }}/3</text></view>
      <view class="option-grid">
        <button v-for="style in STYLES" :key="style" :class="{ active: styleIds.includes(style) }" :aria-pressed="styleIds.includes(style)" @tap="toggleStyle(style)">
          {{ STYLE_NAMES[style] }}<text v-if="styleIds.includes(style)">已选</text>
        </button>
      </view>

      <view class="field-heading"><text>想穿的颜色</text><text>已选 {{ preferredColors.length }}/2</text></view>
      <scroll-view scroll-x><view class="chip-row"><button v-for="color in COLORS" :key="color.id" class="chip" :class="{ active: preferredColors.includes(color.name) }" :aria-pressed="preferredColors.includes(color.name)" @tap="togglePreferredColor(color.name)">{{ color.name }}</button></view></scroll-view>

      <view class="field-heading"><text>避开的颜色</text><text>已选 {{ avoidedColors.length }}/2</text></view>
      <scroll-view scroll-x><view class="chip-row"><button v-for="color in COLORS" :key="color.id" class="chip" :class="{ active: avoidedColors.includes(color.name) }" :aria-pressed="avoidedColors.includes(color.name)" @tap="toggleAvoidedColor(color.name)">{{ color.name }}</button></view></scroll-view>

      <view class="field-heading"><text>指定一件单品</text><text>{{ pinnedItem ? '已选择' : '可选' }}</text></view>
      <scroll-view scroll-x>
        <view class="garment-row">
          <button v-for="item in wardrobe.activeGarments" :key="item.id" :class="{ active: pinnedItemId === item.id }" :aria-label="`${item.name}${pinnedItemId === item.id ? '，已选择' : ''}`" @tap="pinnedItemId = pinnedItemId === item.id ? '' : item.id">
            <view><image :src="item.thumbnailPath" mode="aspectFit" /></view>
            <text>{{ item.name }}</text>
            <text v-if="pinnedItemId === item.id" class="selection-state">已选</text>
          </button>
        </view>
      </scroll-view>
    </view>

    <view class="sticky-submit">
      <view class="summary">
        <text>{{ summary || '还差一个场景' }}</text>
        <text>{{ readiness === 'partial' ? '缺少鞋履，将生成可补充方案' : '将生成 3 套不同方案' }}</text>
      </view>
      <button class="primary-button submit" :disabled="!sceneId" :aria-label="sceneId ? `为${selectedScene?.name}生成三套穿搭` : '请先选择场景'" @tap="submit">
        {{ sceneId ? '生成 3 套穿搭' : '先选择场景' }}
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.conditions-page { padding-bottom:250rpx; }
.block { display:block; }
.intro { display:block; margin:12rpx 0 32rpx; color:$muted; font-size:24rpx; line-height:1.6; }
.section-heading,.field-heading { display:flex; align-items:center; justify-content:space-between; margin:24rpx 2rpx 16rpx; }
.section-heading view,.field-heading { color:$ink; }
.section-heading view text { display:block; }
.section-heading view text:first-child,.field-heading>text:first-child { font-size:27rpx; font-weight:800; }
.section-heading view text:last-child,.field-heading>text:last-child { margin-top:4rpx; color:$muted; font-size:21rpx; }
.section-heading button { min-width:112rpx; min-height:88rpx; margin:0; padding:0 16rpx; border:0; border-radius:22rpx; background:$lilac-soft; color:$lilac-deep; font-size:22rpx; line-height:88rpx; }
.scene-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14rpx; }
.scene-grid button { position:relative; display:flex; align-items:center; justify-content:space-between; min-height:116rpx; margin:0; padding:20rpx 18rpx 20rpx 22rpx; border:2rpx solid $line; border-radius:24rpx; background:#fff; text-align:left; }
.scene-grid button.active { @include selected-control; }
.scene-grid button view { min-width:0; }
.scene-grid button view text { display:block; }
.scene-grid button view text:first-child { color:$ink; font-size:25rpx; font-weight:750; }
.scene-grid button view text:last-child { margin-top:7rpx; color:$muted; font-size:20rpx; }
.scene-grid .selection-state { flex:0 0 auto; margin-left:8rpx; color:#fff; }
.weather-card { @include card; display:flex; align-items:center; gap:8rpx; margin:24rpx 0 16rpx; padding:8rpx 18rpx 8rpx 8rpx; }
.weather-card.unavailable { border-style:dashed; box-shadow:none; }
.weather-main { display:flex; flex:1; align-items:center; justify-content:space-between; min-height:104rpx; margin:0; padding:16rpx; border:0; background:transparent; text-align:left; }
.weather-main view { flex:1; min-width:0; }
.weather-main view text { display:block; }
.weather-main view text:first-child { color:$ink; font-size:25rpx; font-weight:780; }
.weather-main view text:last-child { margin-top:7rpx; overflow:hidden; color:$muted; font-size:21rpx; text-overflow:ellipsis; white-space:nowrap; }
.weather-action { flex:0 0 auto; margin-left:12rpx; color:$lilac-deep; font-size:22rpx; font-weight:750; }
.advanced-toggle { display:flex; align-items:center; justify-content:space-between; width:100%; min-height:112rpx; margin:0; padding:18rpx 24rpx; border:1rpx solid $line; border-radius:26rpx; background:#fff; text-align:left; }
.advanced-toggle view { flex:1; }
.advanced-toggle view text { display:block; }
.advanced-toggle view text:first-child { color:$ink; font-size:26rpx; font-weight:780; }
.advanced-toggle view text:last-child { margin-top:6rpx; color:$muted; font-size:21rpx; }
.advanced-toggle>text { color:$lilac-deep; font-size:22rpx; font-weight:750; }
.advanced-panel { margin-top:14rpx; padding:6rpx 22rpx 24rpx; border:1rpx solid $line; border-radius:28rpx; background:rgba(255,255,255,.78); }
.option-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12rpx; }
.option-grid button { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:88rpx; margin:0; padding:0 8rpx; border:1rpx solid $line; border-radius:20rpx; background:#fff; color:$muted; font-size:22rpx; line-height:1.2; }
.option-grid button.active { @include selected-control; }
.option-grid button text { display:block; margin-top:3rpx; font-size:17rpx; }
.garment-row { display:flex; gap:14rpx; padding-bottom:4rpx; }
.garment-row button { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; width:170rpx; flex:0 0 170rpx; min-height:230rpx; margin:0; padding:10rpx; border:2rpx solid transparent; border-radius:22rpx; background:#f8f4fa; }
.garment-row button.active { @include selected-control; }
.garment-row button>view { display:flex; align-items:center; justify-content:center; height:146rpx; overflow:hidden; border-radius:17rpx; background:#fff; }
.garment-row image { width:92%; height:92%; }
.garment-row button>text:not(.selection-state) { display:block; margin-top:7rpx; overflow:hidden; color:$ink; font-size:20rpx; text-overflow:ellipsis; white-space:nowrap; }
.garment-row .selection-state { position:absolute; top:16rpx; right:16rpx; color:#fff; }
.sticky-submit { position:fixed; z-index:8; right:0; bottom:0; left:0; padding:16rpx 30rpx calc(18rpx + env(safe-area-inset-bottom)); border-top:1rpx solid rgba(230,219,238,.9); background:rgba(255,252,253,.96); box-shadow:0 -14rpx 34rpx rgba(70,48,96,.08); backdrop-filter:blur(16rpx); }
.summary { display:flex; align-items:center; justify-content:space-between; gap:18rpx; margin-bottom:12rpx; }
.summary text:first-child { flex:1; overflow:hidden; color:$ink; font-size:22rpx; font-weight:750; text-overflow:ellipsis; white-space:nowrap; }
.summary text:last-child { flex:0 0 auto; color:$muted; font-size:19rpx; }
.submit { width:100%; margin:0; }
.submit[disabled] { box-shadow:none; opacity:.5; }
</style>
