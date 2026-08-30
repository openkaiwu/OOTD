<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import {
  chooseImages,
  isMediaPermissionDenied,
  isMediaSelectionCancelled,
  prepareDraftItem,
  removeSavedFile,
  type DraftProgressUpdate,
} from "@/infrastructure/media";
import type { MediaSource } from "@/domain/ports";
import { useWardrobeStore } from "@/stores/wardrobe";
import type { CategoryId, ProcessingDraftItem } from "@/domain/types";
import { CATEGORIES } from "@/domain/constants";
import { useAppTheme } from "@/composables/useAppTheme";

const store = useWardrobeStore();
const { themeClass } = useAppTheme();
const queue = ref<ProcessingDraftItem[]>([]);
const entry = ref("unknown");
const presetCategoryId = ref<CategoryId | "">("");
const busy = ref(false);
// 用户中途退出（返回键/导航离开）后置位：后台仍在跑的扫描 worker 立即停止，
// 不再触碰队列、也不再向 localStorage 写草稿，避免退出后主线程被持续的大体积同步写入卡死。
let aborted = false;
const remaining = computed(() => 9 - queue.value.length);
const readyCount = computed(() => queue.value.filter((item) => item.status === "review").length);
const failedCount = computed(() => queue.value.filter((item) => item.status === "failed").length);
const batchProgress = computed(() => queue.value.length ? Math.round(queue.value.reduce((total, item) => total + item.progress, 0) / queue.value.length) : 0);
const processingLabel = computed(() => {
  const current = queue.value.find((item) => ["queued", "compressing", "persisting", "recognizing"].includes(item.status));
  return current ? statusText(current) : "";
});

onLoad((options) => {
  entry.value = String(options?.entry || "unknown");
  const requestedCategory = String(options?.categoryId || "");
  presetCategoryId.value = CATEGORIES.some((item) => item.id === requestedCategory) ? requestedCategory as CategoryId : "";
  store.hydrate();
  if (store.draft?.items.length) {
    queue.value = store.draft.items.map((item) => {
      if (!["queued", "compressing", "persisting", "recognizing"].includes(item.status)) return item;
      return { ...item, status: "failed", progress: 0, error: "上次扫描中断，请重试" };
    });
    store.saveDraftItems(queue.value, entry.value);
  }
});

// 页面被卸载（返回键/导航离开）时中止批量扫描，防止后台 worker 继续写大草稿卡死主线程。
onUnload(() => {
  aborted = true;
  // TEMP-DEBUG: 验证 onUnload 是否触发（验证后移除）
  try { (window as unknown as { __ootdAbortedAt?: number }).__ootdAbortedAt = Date.now(); } catch { /* noop */ }
});

function statusText(item: ProcessingDraftItem): string {
  if (item.status === "queued") return "等待扫描";
  if (item.status === "compressing") return "正在压缩";
  if (item.status === "persisting") return "正在保存";
  if (item.status === "recognizing") return "正在扫描";
  if (item.status === "review") return "扫描完成";
  return "扫描失败";
}

function patchItem(id: string, patch: Partial<ProcessingDraftItem>): void {
  if (aborted) return;
  const index = queue.value.findIndex((item) => item.id === id);
  if (index < 0) return;
  const next = { ...queue.value[index], ...patch };
  queue.value[index] = next;
  // 进行中的进度（压缩/保存/扫描）只更新内存队列供 UI 显示，不落盘：
  // 每个进度回调都同步序列化并重写整份大草稿（含多张大图 data URL），既拖慢主线程
  // 也容易撞到 localStorage 单键容量上限。只在"完成/失败"等稳定状态写一次草稿。
  if (next.status === "review" || next.status === "failed") {
    store.saveDraftItems(queue.value, entry.value);
  }
}

async function processItem(id: string): Promise<void> {
  if (aborted) return;
  const target = queue.value.find((item) => item.id === id);
  if (!target) return;
  patchItem(id, { status: "compressing", progress: 5, error: undefined });
  const prepared = await prepareDraftItem(target.sourcePath, (update: DraftProgressUpdate) => patchItem(id, update), id);
  if (aborted) return;
  patchItem(id, presetCategoryId.value ? { ...prepared, suggestion: { ...prepared.suggestion, categoryId: presetCategoryId.value } } : prepared);
}

async function processBatch(ids: string[], concurrency = 2): Promise<void> {
  let cursor = 0;
  async function worker(): Promise<void> {
    while (!aborted && cursor < ids.length) {
      const id = ids[cursor];
      cursor += 1;
      await processItem(id);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, () => worker()));
}

function openPermissionSettings(): void {
  const api = uni as typeof uni & {
    openAppAuthorizeSetting?: (options?: { fail?: () => void }) => void;
  };
  if (typeof api.openAppAuthorizeSetting === "function") {
    api.openAppAuthorizeSetting({ fail: () => uni.showToast({ title: "请在系统设置中允许相机权限", icon: "none" }) });
    return;
  }
  if (typeof uni.openSetting === "function") {
    uni.openSetting({ fail: () => uni.showToast({ title: "请在系统设置中允许相机权限", icon: "none" }) });
  }
}

function showPermissionGuide(): void {
  uni.showModal({
    title: "需要相机权限",
    content: "允许相机权限后即可拍照扫描。你也可以先从系统相册导入。",
    confirmText: "去设置",
    cancelText: "暂不",
    success: (result) => { if (result.confirm) openPermissionSettings(); },
  });
}

async function select(source: MediaSource): Promise<void> {
  if (remaining.value <= 0 || busy.value) return;
  busy.value = true;
  try {
    const paths = await chooseImages(source, source === "camera" ? 1 : remaining.value);
    if (!paths.length) return;
    const createdAt = Date.now();
    const placeholders: ProcessingDraftItem[] = paths.map((path, index) => ({
      id: `pending_${createdAt}_${index}`,
      sourcePath: path,
      persistedPath: "",
      thumbnailPath: "",
      status: "queued",
      progress: 0,
      confirmed: false,
    }));
    queue.value.push(...placeholders);
    store.saveDraftItems(queue.value, entry.value);
    await processBatch(placeholders.map((item) => item.id), source === "camera" ? 1 : 2);
    if (aborted) return;
    const completed = placeholders.filter((placeholder) => queue.value.find((item) => item.id === placeholder.id)?.status === "review").length;
    if (completed) uni.showToast({ title: `已扫描 ${completed} 件`, icon: "success" });
  } catch (error) {
    if (isMediaSelectionCancelled(error)) return;
    if (source === "camera" && isMediaPermissionDenied(error)) showPermissionGuide();
    else uni.showToast({ title: source === "camera" ? "拍照失败，请重试" : "导入失败，请重试", icon: "none" });
  } finally {
    busy.value = false;
  }
}

async function retry(id: string): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  try { await processItem(id); }
  finally { busy.value = false; }
}

async function remove(index: number): Promise<void> {
  if (busy.value) return;
  const [item] = queue.value.splice(index, 1);
  store.saveDraftItems(queue.value, entry.value);
  if (!item) return;
  await removeSavedFile(item.persistedPath);
  if (item.thumbnailPath && item.thumbnailPath !== item.persistedPath) await removeSavedFile(item.thumbnailPath);
}

function preview(index: number): void {
  const urls = queue.value.map((item) => item.persistedPath || item.sourcePath).filter(Boolean);
  const current = queue.value[index]?.persistedPath || queue.value[index]?.sourcePath;
  if (current && urls.length) uni.previewImage({ current, urls });
}

function review(): void {
  if (!readyCount.value) { uni.showToast({ title: "还没有可校对的衣物", icon: "none" }); return; }
  store.saveDraftItems(queue.value, entry.value);
  uni.navigateTo({ url: "/pages/review/review" });
}
</script>

<template>
  <scroll-view :class="['inner-page','add-page',themeClass]" scroll-y>
    <text class="eyebrow">ADD GARMENTS</text>
    <text class="section-title">添加衣物</text>
    <text class="lead">拍照或从相册导入，图片仅在本机处理。</text>

    <view class="source-grid">
      <button :disabled="busy || remaining <= 0" aria-label="打开相机拍照并扫描衣物" @tap="select('camera')">
        <text>拍照扫描</text>
        <text>每次拍摄 1 件</text>
      </button>
      <button :disabled="busy || remaining <= 0" aria-label="从系统相册批量导入衣物" @tap="select('album')">
        <text>相册导入</text>
        <text>还可选择 {{ remaining }} 张</text>
      </button>
    </view>

    <view class="shoot-tip"><text>拍摄建议</text><text>衣物平铺 · 背景干净 · 光线均匀</text></view>

    <view v-if="busy" class="scan-banner" aria-live="polite">
      <view><text>{{ processingLabel || '正在打开媒体选择器' }}</text><text>{{ batchProgress }}%</text></view>
      <view class="progress-track"><view :style="{ width: `${batchProgress}%` }" /></view>
    </view>

    <view v-if="queue.length" class="queue-head">
      <text>本批 {{ queue.length }}/9</text>
      <text>{{ readyCount }} 件完成{{ failedCount ? ` · ${failedCount} 件失败` : '' }}</text>
    </view>

    <view class="queue">
      <view v-for="(item, index) in queue" :key="item.id" class="queue-item" :class="`status-${item.status}`">
        <button class="preview-button" :aria-label="`预览第 ${index + 1} 张图片`" @tap="preview(index)">
          <image :src="item.persistedPath || item.sourcePath" mode="aspectFill" />
        </button>
        <view class="item-copy">
          <view class="item-title"><text>{{ statusText(item) }}</text><text>{{ item.progress }}%</text></view>
          <view class="item-progress"><view :style="{ width: `${item.progress}%` }" /></view>
          <text class="item-detail">{{ item.error || (item.status === 'review' ? '请在下一步确认品类和颜色' : '正在本地处理图片') }}</text>
        </view>
        <view class="item-actions">
          <button v-if="item.status === 'failed'" :disabled="busy" @tap="retry(item.id)">重试</button>
          <button :disabled="busy" :aria-label="`从本批移除第 ${index + 1} 张图片`" @tap="remove(index)">移除</button>
        </view>
      </view>
    </view>

    <view class="bottom-actions">
      <button class="primary-button" :disabled="!readyCount || busy" @tap="review">校对 {{ readyCount }} 件衣物</button>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.add-page { height:100vh; box-sizing:border-box; padding-bottom:180rpx; }
.eyebrow,.section-title,.lead { display:block; }
.lead { margin:14rpx 0 28rpx; color:$muted; font-size:23rpx; line-height:1.55; }
.source-grid { display:grid; grid-template-columns:1fr 1fr; gap:14rpx; }
.source-grid button { display:flex; flex-direction:column; align-items:flex-start; justify-content:center; min-height:148rpx; margin:0; padding:24rpx; border:1rpx solid $line-strong; border-radius:14rpx; background:$surface-solid; text-align:left; }
.source-grid button:first-child { border-color:$ink; }
.source-grid button[disabled] { opacity:.45; }
.source-grid text:first-child { color:$ink; font-size:28rpx; font-weight:900; }
.source-grid text:last-child { margin-top:10rpx; color:$muted; font-size:20rpx; }
.shoot-tip { display:flex; justify-content:space-between; gap:18rpx; margin:18rpx 2rpx 0; color:$muted; font-size:19rpx; }
.shoot-tip text:first-child { color:$ink; font-weight:800; }

.scan-banner { margin-top:24rpx; padding:20rpx 22rpx; border-left:7rpx solid $lilac; background:$surface-solid; }
.scan-banner>view:first-child { display:flex; align-items:center; justify-content:space-between; color:$ink; font-size:22rpx; font-weight:800; }
.scan-banner>view:first-child text:last-child { color:$muted; font-size:19rpx; font-variant-numeric:tabular-nums; }
.progress-track,.item-progress { overflow:hidden; background:$line; }
.progress-track { height:8rpx; margin-top:16rpx; }
.progress-track view,.item-progress view { height:100%; background:$lilac; transition:width .2s ease; }

.queue-head { display:flex; justify-content:space-between; margin:32rpx 2rpx 16rpx; color:$ink; font-size:23rpx; font-weight:850; }
.queue-head text:last-child { color:$muted; font-size:20rpx; font-weight:500; }
.queue { display:flex; flex-direction:column; gap:12rpx; }
.queue-item { display:grid; grid-template-columns:110rpx minmax(0,1fr) auto; align-items:center; gap:18rpx; padding:14rpx; border:1rpx solid $line; border-radius:14rpx; background:$surface-solid; }
.queue-item.status-failed { border-color:rgba(199,72,94,.38); }
.preview-button { width:110rpx; height:110rpx; min-height:110rpx; margin:0; padding:0; border:0; border-radius:10rpx; background:$surface-soft; }
.preview-button image { display:block; width:100%; height:100%; border-radius:10rpx; }
.item-copy { min-width:0; }
.item-title { display:flex; align-items:center; justify-content:space-between; gap:10rpx; }
.item-title text:first-child { color:$ink; font-size:23rpx; font-weight:850; }
.item-title text:last-child { color:$muted; font-size:18rpx; font-variant-numeric:tabular-nums; }
.item-progress { height:6rpx; margin-top:12rpx; }
.item-detail { display:block; margin-top:10rpx; overflow:hidden; color:$muted; font-size:18rpx; line-height:1.35; text-overflow:ellipsis; white-space:nowrap; }
.item-actions { display:flex; flex-direction:column; gap:6rpx; }
.item-actions button { min-width:88rpx; min-height:58rpx; margin:0; padding:0 10rpx; border:0; border-radius:10rpx; background:transparent; color:$muted; font-size:19rpx; line-height:58rpx; }
.item-actions button:first-child:not(:last-child) { color:$lilac-deep; font-weight:800; }
.item-actions button[disabled] { opacity:.35; }
.bottom-actions { position:fixed; z-index:10; right:0; bottom:0; left:0; padding:20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom)); border-top:1rpx solid $line; background:rgba(247,249,252,.96); }
.bottom-actions .primary-button { width:100%; margin:0; }
</style>
