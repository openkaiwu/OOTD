<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import OutfitCard from "@/components/OutfitCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import { CATEGORIES, SCENES, STYLE_NAMES } from "@/domain/constants";
import { generateOutfits, outfitSignature } from "@/domain/recommendation";
import { styleNameOf, type OutfitRankCandidate, type OutfitRankContext, type OutfitRankResult } from "@/domain/ai";
import { shareOutfit } from "@/infrastructure/share";
import { llmOutfitComment, llmRankOutfits } from "@/infrastructure/llm";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useOutfitStore } from "@/stores/outfits";
import { useSettingsStore } from "@/stores/settings";
import { useWeatherStore } from "@/stores/weather";
import type { DislikeReason, Outfit, RecommendationContext } from "@/domain/types";
import { useAppTheme } from "@/composables/useAppTheme";
import { formatMessage, translate } from "@/i18n";

const wardrobe = useWardrobeStore();
const store = useOutfitStore();
const settings = useSettingsStore();
const weather = useWeatherStore();
const { themeClass } = useAppTheme();
const loading = ref(true);
const results = ref<Outfit[]>([]);
const context = ref<RecommendationContext | null>(null);
const activeIndex = ref(0);
const selected = computed(() => results.value[activeIndex.value] || results.value[0]);
const aiComments = ref<Record<string, string>>({});
const requestedComments = new Set<string>();
const aiRefining = ref(false);
const aiRefined = ref(false);
const displayOutfit = computed<Outfit>(() => {
  const comment = selected.value ? aiComments.value[selected.value.id] : undefined;
  return comment ? { ...selected.value, reason: comment } : selected.value;
});
const contextLabel = computed(() => {
  const sceneName = SCENES.find((item) => item.id === context.value?.sceneId)?.name;
  const scene = sceneName ? translate(sceneName) : "";
  const weatherLabel = context.value?.weatherSnapshot ? `${context.value.weatherSnapshot.city} ${context.value.weatherSnapshot.temp}°` : translate("未使用天气");
  return [scene, weatherLabel].filter(Boolean).join(" · ");
});
const resultSummary = computed(() => formatMessage("{context} · 共 {count} 套", { context: contextLabel.value, count: results.value.length }));

onLoad((options) => {
  wardrobe.hydrate();
  store.hydrate();
  settings.hydrate();
  const wantAi = shouldRefine();
  if (options?.context) {
    const selectedContext = JSON.parse(decodeURIComponent(String(options.context)));
    context.value = {
      source: "scene",
      inspirationPresetId: selectedContext.inspirationPresetId || undefined,
      sceneId: selectedContext.sceneId,
      weatherSnapshot: selectedContext.useWeather ? weather.weather || undefined : undefined,
      preferredStyleIds: selectedContext.styleIds || [],
      preferredColorIds: selectedContext.preferredColors || [],
      avoidedColorIds: selectedContext.avoidedColors || [],
      pinnedItemId: selectedContext.pinnedItemId || undefined,
      excludedOutfitSignatures: [],
      generatedAt: Date.now(),
    };
    results.value = generateOutfits(wardrobe.activeGarments, context.value, settings.preferences, wantAi ? 6 : 3);
    store.setRecommendations(results.value);
  } else {
    const cached = store.latestRecommendations.length ? store.latestRecommendations : store.outfits.slice(0, 3);
    context.value = cached[0]?.contextSnapshot || null;
    // AI 开启时用更大的候选池重新生成，给精排更大的挑选空间
    results.value = wantAi && context.value
      ? generateOutfits(wardrobe.activeGarments, context.value, settings.preferences, 6)
      : cached;
    store.setRecommendations(results.value);
  }
  setTimeout(() => {
    loading.value = false;
    if (wantAi && context.value) void refineWithAi(results.value, context.value);
  }, 450);
});

watch(selected, (item) => { void requestAiComment(item); });

async function requestAiComment(item: Outfit | undefined): Promise<void> {
  if (!item || requestedComments.has(item.id)) return;
  requestedComments.add(item.id);
  const config = settings.llm;
  if (!config.enabled || !config.apiKey) return;
  const garments = item.itemIds
    .map((id) => wardrobe.garments.find((garment) => garment.id === id))
    .filter((garment): garment is NonNullable<typeof garment> => Boolean(garment));
  if (!garments.length) return;
  const snapshot = item.contextSnapshot?.weatherSnapshot || context.value?.weatherSnapshot;
  const comment = await llmOutfitComment({
    sceneName: SCENES.find((scene) => scene.id === (item.sceneId || context.value?.sceneId))?.name || "日常",
    weatherText: snapshot ? `${snapshot.city} ${snapshot.temp}°C` : "未参考天气",
    items: garments.map((garment) => ({
      name: garment.name,
      categoryName: CATEGORIES.find((category) => category.id === garment.categoryId)?.name || "单品",
      colorName: garment.colorName,
      materialId: garment.materialId,
    })),
    styleNames: item.styleTags.map((style) => styleNameOf(style)),
  });
  if (comment) {
    const next = { ...aiComments.value };
    next[item.id] = comment;
    aiComments.value = next;
  }
}

function shouldRefine(): boolean {
  return Boolean(settings.llm.enabled && settings.llm.apiKey);
}

// AI 精排：把候选搭配一次性发给 MiMo 打分重排，失败/未启用时原地保留本地结果
async function refineWithAi(candidates: Outfit[], ctx: RecommendationContext): Promise<void> {
  if (!candidates.length || !ctx) return;
  aiRefining.value = true;
  try {
    const payloadCandidates: OutfitRankCandidate[] = candidates.map((outfit, index) => ({
      index,
      name: outfit.name,
      score: outfit.score,
      items: outfit.itemIds
        .map((id) => wardrobe.garments.find((garment) => garment.id === id))
        .filter((garment): garment is NonNullable<typeof garment> => Boolean(garment))
        .map((garment) => ({
          name: garment.name,
          categoryName: CATEGORIES.find((category) => category.id === garment.categoryId)?.name || "单品",
          colorName: garment.colorName,
          materialId: garment.materialId,
          styleNames: garment.styleIds.map((style) => styleNameOf(style)),
        })),
    }));
    const snapshot = ctx.weatherSnapshot;
    const rankContext: OutfitRankContext = {
      sceneName: SCENES.find((scene) => scene.id === ctx.sceneId)?.name || "日常",
      weatherText: snapshot ? `${snapshot.city} ${snapshot.temp}°C` : "未参考天气",
    };
    const ratings = await llmRankOutfits(payloadCandidates, rankContext);
    if (!ratings?.length) return;
    const byIndex = new Map(ratings.map((rating) => [rating.index, rating]));
    const ranked = candidates
      .map((outfit, index) => ({ outfit, rating: byIndex.get(index) }))
      .filter((entry): entry is { outfit: Outfit; rating: OutfitRankResult } => Boolean(entry.rating))
      .sort((a, b) => (b.rating.score - a.rating.score) || (b.outfit.score - a.outfit.score))
      .slice(0, 3)
      .map(({ outfit, rating }) => ({
        ...outfit,
        score: Math.max(0, Math.min(100, Math.round(outfit.score * 0.55 + rating.score * 4.5))),
        reason: rating.reason || outfit.reason,
        updatedAt: Date.now(),
      }));
    if (!ranked.length) return;
    results.value = ranked;
    activeIndex.value = 0;
    store.setRecommendations(ranked);
    aiRefined.value = true;
  } finally {
    aiRefining.value = false;
  }
}

function scoreLabel(score: number): string {
  if (score >= 88) return "很适合";
  if (score >= 82) return "值得尝试";
  return "可尝试";
}

function firstGarment(item: Outfit): string {
  const garment = wardrobe.garments.find((entry) => entry.id === item.itemIds[0]);
  return garment?.thumbnailPath || garment?.imagePath || "/static/wardrobe/today-look.png";
}

function planIcon(index: number): string {
  return ["✦", "◌", "♡"][index % 3];
}

function feedback(item: Outfit, value: "liked" | "disliked"): void {
  const next = item.feedback === value ? "none" : value;
  store.setFeedback(item, next);
  if (next === "liked") {
    settings.applyOutfitFeedback(item, wardrobe.garments, true);
    uni.showToast({ title: "已用于优化后续推荐，可再次点击撤销", icon: "none" });
  }
  if (next === "disliked") {
    uni.showActionSheet({
      itemList: ["颜色不喜欢", "风格不合", "不适合天气", "不想穿某件"],
      success: (result) => {
        const reasons: DislikeReason[] = ["color", "style", "weather", "item"];
        const reason = reasons[result.tapIndex];
        store.setFeedback(item, "disliked", [reason]);
        settings.applyOutfitFeedback(item, wardrobe.garments, false, reason);
      },
    });
  }
  uni.vibrateShort({ type: "light" });
}

function save(item: Outfit): void {
  const ok = store.toggleSave(item);
  uni.showToast({ title: ok ? (item.saved ? "已保存到我的穿搭" : "已取消保存") : "相同组合已经保存", icon: "none" });
}

async function share(item: Outfit): Promise<void> {
  try {
    await shareOutfit(item, wardrobe.garments);
  } catch {
    uni.showToast({ title: "分享失败，请重试", icon: "none" });
  }
}

function worn(item: Outfit): void {
  const now = Date.now();
  store.markWorn(item, now);
  wardrobe.markItemsWorn(item.itemIds, now);
  uni.showToast({ title: "已记录今天穿着", icon: "success" });
}

function refresh(): void {
  if (!context.value) return;
  const wantAi = shouldRefine();
  context.value = {
    ...context.value,
    source: "saved_retry",
    excludedOutfitSignatures: results.value.map((item) => outfitSignature(item.itemIds)),
    generatedAt: Date.now(),
  };
  results.value = generateOutfits(wardrobe.activeGarments, context.value, settings.preferences, wantAi ? 6 : 3);
  activeIndex.value = 0;
  store.setRecommendations(results.value);
  if (!results.value.length) uni.showToast({ title: "暂时没有更多不同组合", icon: "none" });
  else {
    void requestAiComment(results.value[0]);
    if (wantAi) void refineWithAi(results.value, context.value);
  }
}

function goAdd(): void { uni.navigateTo({ url: "/pages/add/add?entry=result" }); }
function editConditions(): void {
  if (context.value) {
    uni.setStorageSync("ootd_inspiration_draft_v1", {
      sceneId: context.value.sceneId,
      styleIds: context.value.preferredStyleIds,
      preferredColors: context.value.preferredColorIds,
      avoidedColors: context.value.avoidedColorIds,
      pinnedItemId: context.value.pinnedItemId,
      useWeather: Boolean(context.value.weatherSnapshot),
    });
  }
  // The inspiration tab is the single editing surface for scene, style and
  // weather. Returning there keeps a recommendation flow in one place.
  uni.setStorageSync("outfit_view_mode_v1", "inspiration");
  uni.switchTab({ url: "/pages/outfits/outfits" });
}
function goTryon(item: Outfit): void {
  if (!item.itemIds.length) return;
  uni.navigateTo({ url: "/pages/tryon/tryon?ids=" + item.itemIds.join(",") });
}
</script>

<template>
  <view :class="['inner-page','result-page',themeClass]">
    <view v-if="loading" class="loading"><image src="/static/icons/tab-outfits-active.png" mode="aspectFit" /><text>正在读取条件并检查搭配…</text></view>
    <EmptyState v-else-if="!results.length" title="暂时没有可用组合" description="补充上装、下装或连衣裙后，再回来生成。" action="去添加单品" @action="goAdd" />
    <template v-else>
      <view class="page-title">
        <text class="eyebrow">YOUR EDIT</text>
        <text class="section-title">先比较，再决定</text>
        <text>{{ resultSummary }}</text>
      </view>

      <view class="comparison" role="tablist" aria-label="三套可比较的穿搭方案">
        <button
          v-for="(item,index) in results"
          :key="item.id"
          :class="{ active: activeIndex === index }"
          :aria-selected="activeIndex === index"
          :aria-label="`方案${index + 1}，${item.name}，${item.score}分，${scoreLabel(item.score)}${activeIndex === index ? '，当前查看' : ''}`"
          @tap="activeIndex = index"
        >
          <view class="comparison-image">
            <image :src="firstGarment(item)" mode="aspectFit" />
            <text class="plan-mark" aria-hidden="true">{{ planIcon(index) }}</text>
            <text v-if="activeIndex === index" class="selection-state">当前</text>
          </view>
          <view class="plan-copy"><text>{{ formatMessage('方案 {index}', { index: index + 1 }) }}</text><text>{{ item.score }} 分</text></view>
          <text class="plan-fit">{{ scoreLabel(item.score) }}</text>
        </button>
      </view>

      <view class="compare-hint">
        <text>点选方案，查看单品与推荐理由</text>
        <text>评分结合天气、场景、色彩与衣橱轮换</text>
        <text v-if="aiRefining" class="ai-hint">AI 精排中…</text>
        <text v-else-if="aiRefined" class="ai-hint">AI 已结合天气、场景帮你精排</text>
      </view>
      <OutfitCard v-if="displayOutfit" :key="displayOutfit.id" :outfit="displayOutfit" :garments="wardrobe.garments" :index="activeIndex" interactive @feedback="feedback(selected,$event)" @save="save(selected)" @share="share(selected)" @worn="worn(selected)" @tryon="goTryon(selected)" />

      <view class="next-actions">
        <button class="primary-button refresh" @tap="refresh">换一批推荐</button>
        <button class="secondary-button modify" @tap="editConditions">修改条件</button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.result-page { padding-bottom:calc(72rpx + env(safe-area-inset-bottom)); }
.loading { display:flex; flex-direction:column; align-items:center; padding-top:180rpx; color:$muted; font-size:25rpx; text-align:center; }
.loading image { width:74rpx; height:74rpx; margin-bottom:26rpx; animation:pulse 1.2s infinite; }
@keyframes pulse { 50% { transform:scale(.88); opacity:.55; } }
.page-title { margin-bottom:22rpx; }
.page-title text { display:block; }
.page-title text:last-child { margin-top:12rpx; color:$muted; font-size:23rpx; }
.comparison { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12rpx; }
.comparison button { display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; min-width:0; min-height:238rpx; margin:0; padding:12rpx; border:2rpx solid $line; border-radius:24rpx; background:#fff; text-align:left; box-shadow:0 8rpx 18rpx rgba(86,62,112,.035); }
.comparison button.active { @include selected-control; }
.comparison-image { position:relative; display:flex; align-items:center; justify-content:center; height:130rpx; overflow:hidden; border-radius:18rpx; background:linear-gradient(145deg,$image-surface,$surface-elevated); }
.comparison-image image { width:92%; height:92%; }
.comparison-image .plan-mark { position:absolute; left:10rpx; bottom:7rpx; color:$lilac-deep; font-size:26rpx; font-weight:850; text-shadow:0 1rpx 0 #fff; }
.comparison-image .selection-state { position:absolute; top:8rpx; right:8rpx; color:#fff; }
.plan-copy { display:flex; align-items:baseline; justify-content:space-between; gap:4rpx; margin-top:12rpx; }
.plan-copy text { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.plan-copy text:first-child { color:$ink; font-size:20rpx; font-weight:800; }
.plan-copy text:last-child { flex:0 0 auto; color:$muted; font-size:18rpx; }
.comparison .plan-fit { display:block; margin-top:5rpx; color:$lilac-deep; font-size:19rpx; font-weight:760; }
.compare-hint { display:flex; flex-direction:column; gap:4rpx; margin:16rpx 4rpx 22rpx; }
.compare-hint text { color:$muted; font-size:21rpx; line-height:1.45; }
.compare-hint .ai-hint { color:$lilac-deep; font-size:21rpx; font-weight:700; }
.next-actions { display:grid; grid-template-columns:1.35fr 1fr; gap:14rpx; margin-top:24rpx; }
.refresh,.modify { width:100%; margin:0; padding:0 18rpx; font-size:25rpx; }
</style>
