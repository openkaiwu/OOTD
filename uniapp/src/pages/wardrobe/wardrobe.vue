<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import EmptyState from "@/components/EmptyState.vue";
import GarmentCard from "@/components/GarmentCard.vue";
import { CATEGORIES } from "@/domain/constants";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useOutfitStore } from "@/stores/outfits";
import { useAppTheme } from "@/composables/useAppTheme";
import { formatMessage } from "@/i18n";

const store = useWardrobeStore();
const outfits = useOutfitStore();
const { themeClass } = useAppTheme();
const search = ref("");
const filter = ref("all");
const sort = ref<"recent" | "frequency" | "favorite">("recent");
const advancedOpen = ref(false);
const favoriteOnly = ref(false);
const batchMode = ref(false);
const selectedIds = ref<string[]>([]);
const filters = [{ id: "all", name: "全部" }, { id: "top", name: "上装" }, { id: "bottom", name: "裤裙" }, { id: "dress", name: "连衣裙" }, { id: "outerwear", name: "外套" }, { id: "shoes", name: "鞋" }, { id: "accessory", name: "配饰" }];

onShow(() => {
  store.hydrate(); outfits.hydrate();
  if (uni.getStorageSync("wardrobe_filter_favorites_v1")) {
    clearFilters();
    favoriteOnly.value = true;
    advancedOpen.value = true;
    uni.removeStorageSync("wardrobe_filter_favorites_v1");
  }
});

const visible = computed(() => {
  let items = [...store.activeGarments];
  if (filter.value !== "all") items = items.filter((item) => CATEGORIES.find((category) => category.id === item.categoryId)?.group === filter.value);
  if (favoriteOnly.value) items = items.filter((item) => item.favorite);
  const keyword = search.value.trim().toLowerCase();
  if (keyword) items = items.filter((item) => [item.name, item.colorName, item.materialId || "", ...item.tags, ...item.styleIds].some((value) => value.toLowerCase().includes(keyword)));
  if (sort.value === "recent") items.sort((a, b) => b.createdAt - a.createdAt);
  if (sort.value === "frequency") items.sort((a, b) => b.wearCount - a.wearCount);
  if (sort.value === "favorite") items.sort((a, b) => Number(b.favorite) - Number(a.favorite));
  return items;
});
const allVisibleSelected = computed(() => visible.value.length > 0 && visible.value.every((item) => selectedIds.value.includes(item.id)));
const activeFilterCount = computed(() => Number(filter.value !== "all") + Number(favoriteOnly.value) + Number(sort.value !== "recent"));
const selectedReferenceCount = computed(() => {
  const ids = new Set(selectedIds.value);
  return outfits.outfits.filter((outfit) => outfit.itemIds.some((id) => ids.has(id))).length;
});
const selectedLabel = computed(() => formatMessage("已选 {count} 件", { count: selectedIds.value.length }));
const resultLabel = computed(() => batchMode.value
  ? formatMessage("{total} 件 · 已选 {selected} 件", { total: visible.value.length, selected: selectedIds.value.length })
  : formatMessage("{total} 件", { total: visible.value.length }));

function open(id: string): void { uni.navigateTo({ url: `/pages/garment/garment?id=${id}` }); }
function add(): void { uni.navigateTo({ url: "/pages/add/add?entry=wardrobe" }); }
function setSort(id: string): void { if (id === "recent" || id === "frequency" || id === "favorite") sort.value = id; }
function clearFilters(): void { search.value = ""; filter.value = "all"; sort.value = "recent"; favoriteOnly.value = false; }
function toggleBatch(): void { batchMode.value = !batchMode.value; selectedIds.value = []; }
function toggleSelected(id: string): void { selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter((item) => item !== id) : [...selectedIds.value, id]; }
function toggleAllVisible(): void {
  if (allVisibleSelected.value) selectedIds.value = selectedIds.value.filter((id) => !visible.value.some((item) => item.id === id));
  else selectedIds.value = [...new Set([...selectedIds.value, ...visible.value.map((item) => item.id)])];
}
function applyFavorite(value: boolean): void {
  if (!selectedIds.value.length) return;
  store.setFavorites(selectedIds.value, value);
  uni.showToast({ title: value ? `已收藏 ${selectedIds.value.length} 件` : `已取消 ${selectedIds.value.length} 件收藏`, icon: "none" });
}
function deleteSelected(): void {
  const count = selectedIds.value.length;
  if (!count) return;
  const referenceCopy = selectedReferenceCount.value ? `将影响 ${selectedReferenceCount.value} 套已有穿搭。` : "";
  uni.showModal({
    title: `删除 ${count} 件单品？`,
    content: `${referenceCopy}删除后 5 秒内可以撤销。`,
    confirmText: "删除",
    cancelText: "取消",
    confirmColor: "#C7485E",
    success: (result) => {
      if (!result.confirm) return;
      store.softDeleteMany(selectedIds.value);
      selectedIds.value = [];
      batchMode.value = false;
    },
  });
}
function undoDelete(): void {
  const restored = store.restoreMany();
  if (restored) uni.showToast({ title: `已恢复 ${restored} 件单品`, icon: "none" });
}
</script>

<template>
  <view :class="['wardrobe-page',themeClass]">
    <scroll-view class="page-shell" :class="{ 'batch-active': batchMode }" scroll-y>
      <view class="title-row">
        <view><text class="section-title">我的衣橱</text><text v-if="batchMode" class="manage-hint">点选需要操作的单品</text></view>
        <view class="title-actions"><button class="manage" :class="{ active: batchMode }" @tap="toggleBatch">{{ batchMode ? '完成' : '管理' }}</button></view>
      </view>
      <view class="search-box"><text aria-hidden="true">⌕</text><input v-model="search" class="search" aria-label="搜索衣橱" placeholder="搜索衣物、颜色或标签" /></view>
      <scroll-view class="filter-scroll" scroll-x><view class="chip-row"><button v-for="item in filters" :key="item.id" class="chip" :class="{ active: filter === item.id }" :aria-pressed="filter === item.id" @tap="filter = item.id">{{ item.name }}</button></view></scroll-view>
      <view class="filter-toolbar">
        <button :class="{ active: advancedOpen || activeFilterCount }" :aria-expanded="advancedOpen" @tap="advancedOpen = !advancedOpen">筛选与排序{{ activeFilterCount ? ` · ${activeFilterCount}` : '' }}</button>
        <button v-if="batchMode" :aria-pressed="allVisibleSelected" @tap="toggleAllVisible">{{ allVisibleSelected ? '取消全选' : '全选结果' }}</button>
      </view>
      <view v-if="advancedOpen" class="filter-panel">
        <view><text>排序方式</text><view><button v-for="item in [{id:'recent',name:'最近添加'},{id:'frequency',name:'最常穿'},{id:'favorite',name:'收藏优先'}]" :key="item.id" :class="{ active: sort === item.id }" :aria-pressed="sort === item.id" @tap="setSort(item.id)">{{ item.name }}</button></view></view>
        <button class="favorite-only" :class="{ active: favoriteOnly }" :aria-pressed="favoriteOnly" @tap="favoriteOnly = !favoriteOnly">{{ favoriteOnly ? '已开启：只看收藏' : '只看收藏' }}</button>
        <button class="clear" @tap="clearFilters">清除全部条件</button>
      </view>
      <view class="result-row"><text>{{ resultLabel }}</text><text>{{ sort === 'recent' ? '最近添加' : sort === 'frequency' ? '最常穿' : '收藏优先' }}</text></view>
      <EmptyState v-if="!store.activeGarments.length" title="衣橱空空如也" description="添加第一件衣物后，就可以按天气和场景生成穿搭。" action="添加第一件衣物" @action="add" />
      <EmptyState v-else-if="!visible.length" title="没有匹配的单品" description="当前搜索和筛选条件没有结果。" action="清除筛选" @action="clearFilters" />
      <view v-else class="grid"><GarmentCard v-for="item in visible" :key="item.id" :item="item" :selectable="batchMode" :selected="selectedIds.includes(item.id)" @open="open" @select="toggleSelected" @favorite="store.toggleFavorite" /></view>
    </scroll-view>

    <button v-if="!batchMode" class="floating-add" aria-label="添加衣物" @tap="add"><text aria-hidden="true">＋</text></button>

    <view v-if="batchMode" class="batch-bar" aria-label="批量操作栏">
      <view class="batch-summary"><text>{{ selectedLabel }}</text><button v-if="selectedIds.length" @tap="selectedIds = []">清除选择</button></view>
      <view class="batch-actions">
        <button :disabled="!selectedIds.length" @tap="applyFavorite(true)">收藏</button>
        <button :disabled="!selectedIds.length" @tap="applyFavorite(false)">取消收藏</button>
        <button class="delete-action" :disabled="!selectedIds.length" @tap="deleteSelected">删除</button>
      </view>
    </view>

    <view v-if="store.pendingDeleteNotice" class="undo-bar" aria-live="assertive">
      <view><text>已删除 {{ store.pendingDeleteNotice.ids.length }} 件单品</text><text>5 秒内可以撤销</text></view>
      <button @tap="undoDelete">撤销</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.wardrobe-page { height:100vh; background:$pearl; }
.page-shell { height:100%; box-sizing:border-box; }
.page-shell.batch-active { padding-bottom:calc(238rpx + var(--window-bottom) + env(safe-area-inset-bottom)); }
.title-row { display:flex; align-items:center; justify-content:space-between; min-height:80rpx; margin-bottom:16rpx; }
.title-row>view:first-child { min-width:0; }
.title-actions { display:flex; gap:10rpx; }
.manage-hint { display:block; margin-top:8rpx; color:$muted; font-size:$text-caption; }
.title-row button { min-width:96rpx; min-height:80rpx; margin:0; padding:0 18rpx; border:0; border-radius:999rpx; font-size:$text-label; font-weight:750; line-height:80rpx; }
.title-row .manage { border:1rpx solid $line; background:$surface-elevated; color:$lilac-deep; }
.title-row .manage.active { @include selected-control; }
.search-box { display:flex; align-items:center; width:100%; height:80rpx; box-sizing:border-box; padding:0 20rpx; border:1rpx solid $line; border-radius:var(--theme-radius-control,24rpx); background:$surface-elevated; box-shadow:$shadow; }
.search-box>text { flex:0 0 auto; margin-right:12rpx; color:$muted; font-size:34rpx; transform:rotate(-15deg); }
.search { flex:1; min-width:0; height:80rpx; color:$ink; font-size:$text-body; }
.filter-scroll { margin:10rpx 0 0; }
.filter-scroll .chip-row { gap:10rpx; padding:2rpx 0 6rpx; }
.filter-scroll .chip { min-height:68rpx; padding:0 18rpx; font-size:22rpx; line-height:68rpx; }
.filter-toolbar { display:flex; align-items:center; justify-content:flex-start; gap:10rpx; margin:0 0 12rpx; }
.filter-toolbar button { min-height:68rpx; margin:0; padding:0 20rpx; border:1rpx solid $line; border-radius:999rpx; background:$surface-elevated; color:$muted; font-size:22rpx; line-height:68rpx; }
.filter-toolbar button.active { @include selected-control; }
.filter-panel { margin-bottom:16rpx; padding:20rpx; border:1rpx solid $line; border-radius:$radius-lg; background:$surface-elevated; box-shadow:$shadow; }
.filter-panel>view>text { display:block; margin:0 2rpx 12rpx; color:$ink; font-size:$text-label; font-weight:780; }
.filter-panel>view>view { display:grid; grid-template-columns:repeat(3,1fr); gap:10rpx; }
.filter-panel button { min-height:92rpx; margin:0; border:1rpx solid $line; border-radius:var(--theme-radius-control,18rpx); background:$surface-elevated; color:$muted; font-size:$text-caption; line-height:1.3; }
.filter-panel button.active { @include selected-control; }
.filter-panel .favorite-only { width:100%; margin-top:12rpx; }
.filter-panel .clear { width:100%; margin-top:10rpx; border:0; background:transparent; color:$lilac-deep; }
.result-row { display:flex; justify-content:space-between; margin:12rpx 4rpx 24rpx; color:$muted; font-size:$text-label; }
.result-row text:last-child { color:$lilac-deep; font-weight:700; }
.grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:$space-3; padding-bottom:140rpx; }
.floating-add { position:fixed; z-index:18; right:32rpx; bottom:calc(var(--window-bottom) + 34rpx + env(safe-area-inset-bottom)); display:flex; align-items:center; justify-content:center; width:104rpx; height:104rpx; min-height:104rpx; margin:0; padding:0; border:0; border-radius:50%; background:linear-gradient(135deg,var(--theme-button-start),var(--theme-button-end)); box-shadow:var(--theme-button-shadow); color:#fff; font-size:52rpx; font-weight:400; line-height:100rpx; }
.batch-bar { position:fixed; z-index:19; right:0; bottom:var(--window-bottom); left:0; padding:14rpx 24rpx calc(18rpx + env(safe-area-inset-bottom)); border-top:1rpx solid $line; background:rgba(255,255,255,.98); box-shadow:0 -14rpx 34rpx rgba(90,60,75,.1); backdrop-filter:blur(18rpx); }
.batch-summary { display:flex; align-items:center; justify-content:space-between; min-height:48rpx; }
.batch-summary text { color:$ink; font-size:23rpx; font-weight:800; }
.batch-summary button { min-height:48rpx; margin:0; padding:0 8rpx; border:0; background:transparent; color:$muted; font-size:19rpx; line-height:48rpx; }
.batch-actions { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10rpx; margin-top:8rpx; }
.batch-actions button { min-width:0; min-height:82rpx; margin:0; padding:0 8rpx; border:1rpx solid $line; border-radius:var(--theme-radius-control,16rpx); background:$surface-elevated; color:$lilac-deep; font-size:20rpx; line-height:82rpx; }
.batch-actions .delete-action { border-color:#efc8d0; background:#fff7f8; color:$danger; }
.batch-bar button[disabled] { color:$muted; opacity:.45; }
.undo-bar { position:fixed; z-index:25; right:24rpx; bottom:calc(var(--window-bottom) + 24rpx + env(safe-area-inset-bottom)); left:24rpx; display:flex; align-items:center; justify-content:space-between; gap:20rpx; min-height:96rpx; padding:14rpx 16rpx 14rpx 24rpx; border:1rpx solid rgba(26,26,26,.12); border-radius:18rpx; background:$ink; box-shadow:0 18rpx 46rpx rgba(70,45,58,.22); color:#fff; }
.undo-bar view { min-width:0; }
.undo-bar text { display:block; font-size:21rpx; font-weight:760; }
.undo-bar text:last-child { margin-top:3rpx; color:rgba(255,255,255,.7); font-size:17rpx; font-weight:500; }
.undo-bar button { flex:0 0 auto; min-width:96rpx; min-height:68rpx; margin:0; padding:0 18rpx; border:1rpx solid rgba(255,255,255,.26); border-radius:12rpx; background:$lilac; color:#fff; font-size:21rpx; font-weight:800; line-height:68rpx; }
</style>
