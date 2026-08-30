<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { CATEGORIES, COLORS, MATERIALS, SEASONS, STYLES, STYLE_NAMES } from "@/domain/constants";
import { parseTagInput, TAG_LIMIT } from "@/domain/tags";
import type { CategoryId, Garment, ProcessingDraftItem, SeasonId } from "@/domain/types";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useAppTheme } from "@/composables/useAppTheme";
import { cropImageDataUrl, type NormalizedCrop } from "@/infrastructure/crop";
import { appLanguage, translate } from "@/i18n";

interface EditableItem extends ProcessingDraftItem {
  form: { name: string; categoryId: CategoryId; colorHex: string; colorName: string; materialId: string; seasonIds: SeasonId[]; styleIds: string[]; tagsText: string; autoName: boolean };
  matteEnabled: boolean;
}

interface CropTouchLike { clientX?: number; clientY?: number; pageX?: number; pageY?: number }
// H5 上 touches 是 TouchList（类数组），小程序上则是普通数组，统一按类数组读取
interface CropTouchEventLike { touches?: ArrayLike<CropTouchLike>; currentTarget?: EventTarget | null; target?: EventTarget | null }

const store = useWardrobeStore();
const { themeClass } = useAppTheme();
const items = ref<EditableItem[]>([]);
const current = ref(0);
const item = computed(() => items.value[current.value]);
const allValid = computed(() => items.value.length > 0 && items.value.every((value) => value.form.name.trim() && value.form.categoryId && value.form.colorName));

function baseName(colorName: string, categoryId: CategoryId): string {
  const category = CATEGORIES.find((entry) => entry.id === categoryId)?.name || "单品";
  return `${translate(colorName)}${appLanguage.value === "zh-CN" ? "" : " "}${translate(category)}`;
}
function uniqueName(base: string, occupied: Set<string>): string {
  let candidate = base;
  let suffix = 2;
  while (occupied.has(candidate.toLocaleLowerCase())) candidate = `${base} ${suffix++}`;
  occupied.add(candidate.toLocaleLowerCase());
  return candidate;
}

onLoad(() => {
  store.hydrate();
  const ready = (store.draft?.items || []).filter((value) => value.status === "review");
  items.value = ready.map((value) => {
    const categoryId = value.suggestion?.categoryId || "top-short";
    const colorName = value.suggestion?.colorName || "米色";
    const suggestedName = value.suggestion?.name?.trim() || "";
    const autoName = !suggestedName || suggestedName.startsWith("未命名");
    return {
      ...value,
      form: {
        name: autoName ? baseName(colorName, categoryId) : suggestedName,
        categoryId,
        colorHex: value.suggestion?.colorHex || "#D8C9A8",
        colorName,
        materialId: value.suggestion?.materialId || "未知",
        seasonIds: value.suggestion?.seasonIds || [],
        styleIds: value.suggestion?.styleIds || [],
        tagsText: "",
        autoName,
      },
      matteEnabled: Boolean(value.matted && value.mattePath),
    };
  });
});

// 显示优先级：手动裁剪 > 去背景抠图图 > 原图
function imageOf(value: EditableItem): string {
  if (value.cropPath) return value.cropPath;
  if (value.matteEnabled && value.mattePath) return value.mattePath;
  return value.originalPath || value.persistedPath;
}
function thumbOf(value: EditableItem): string {
  if (value.cropThumbnailPath) return value.cropThumbnailPath;
  if (value.matteEnabled && value.matteThumbnailPath) return value.matteThumbnailPath;
  return value.originalThumbnailPath || value.thumbnailPath || value.persistedPath;
}
// 裁剪编辑始终基于源图（去背景开=抠图图，关=原图），避免在已裁剪图上二次裁剪损失画质
function cropSourceOf(value: EditableItem): string {
  if (value.matteEnabled && value.mattePath) return value.mattePath;
  return value.originalPath || value.persistedPath;
}
function toggleMatte(): void { if (item.value?.matted) item.value.matteEnabled = !item.value.matteEnabled; }

function toggleSeason(id: SeasonId): void { const list = item.value.form.seasonIds; item.value.form.seasonIds = list.includes(id) ? list.filter((value) => value !== id) : [...list, id]; }
function toggleStyle(id: string): void { const list = item.value.form.styleIds; item.value.form.styleIds = list.includes(id) ? list.filter((value) => value !== id) : [...list, id]; }
function refreshAutoName(value: EditableItem): void { if (value.form.autoName) value.form.name = baseName(value.form.colorName, value.form.categoryId); }
function chooseColor(color: typeof COLORS[number]): void { item.value.form.colorName = color.name; item.value.form.colorHex = color.hex; refreshAutoName(item.value); }
function chooseCategory(categoryId: CategoryId): void { item.value.form.categoryId = categoryId; refreshAutoName(item.value); }
function markCustomName(): void { if (item.value) item.value.form.autoName = false; }

function saveAll(): void {
  if (!allValid.value) { const invalid = items.value.findIndex((value) => !value.form.name.trim() || !value.form.categoryId || !value.form.colorName); current.value = Math.max(0, invalid); uni.showToast({ title: "请先补全必填信息", icon: "none" }); return; }
  const now = Date.now();
  const occupiedNames = new Set(store.activeGarments.map((garment) => garment.name.trim().toLocaleLowerCase()));
  const garments: Garment[] = items.value.map((value, index) => ({
    id: `garment_${now}_${index}`,
    name: value.form.autoName ? uniqueName(baseName(value.form.colorName, value.form.categoryId), occupiedNames) : value.form.name.trim(),
    imagePath: imageOf(value),
    thumbnailPath: thumbOf(value),
    categoryId: value.form.categoryId,
    colorHex: value.form.colorHex,
    colorName: value.form.colorName,
    materialId: value.form.materialId,
    seasonIds: value.form.seasonIds,
    styleIds: value.form.styleIds,
    sceneIds: [],
    tags: parseTagInput(value.form.tagsText).slice(0, TAG_LIMIT),
    favorite: false,
    availability: "active",
    wearCount: 0,
    createdAt: now + index,
    updatedAt: now + index,
    schemaVersion: 2,
  }));
  store.addBatch(garments);
  uni.showToast({ title: `已加入 ${garments.length} 件`, icon: "success" });
  setTimeout(() => uni.switchTab({ url: "/pages/wardrobe/wardrobe" }), 450);
}

// ---- 手动裁剪 ----
const CROP_MIN = 0.06;
const HANDLE_HIT = 40;
const cropOpen = ref(false);
const cropNatural = ref({ w: 0, h: 0 });
const cropContainer = ref({ w: 0, h: 0 });
const crop = ref<NormalizedCrop>({ left: 0.06, top: 0.06, width: 0.88, height: 0.88 });
const handleSize = ref(28);
const cropStageEl = ref<unknown>(null);
type CropGesture = { mode: "move" | "nw" | "ne" | "sw" | "se"; startX: number; startY: number; left: number; top: number; width: number; height: number; originX: number; originY: number };
const cropGesture = ref<CropGesture | null>(null);

function clamp(value: number, lo: number, hi: number): number { return Math.min(hi, Math.max(lo, value)); }

// 图片在舞台内 aspectFit 后的实际显示区域（像素）
const cropImageRect = computed(() => {
  const cw = cropContainer.value.w, ch = cropContainer.value.h;
  const iw = cropNatural.value.w, ih = cropNatural.value.h;
  if (!cw || !ch || !iw || !ih) return { x: 0, y: 0, w: cw, h: ch };
  const scale = Math.min(cw / iw, ch / ih);
  const w = iw * scale, h = ih * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
});
// 裁剪框在舞台内的像素矩形
const cropBox = computed(() => {
  const r = cropImageRect.value;
  const c = crop.value;
  return { x: r.x + c.left * r.w, y: r.y + c.top * r.h, w: c.width * r.w, h: c.height * r.h };
});

function getNaturalSize(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    uni.getImageInfo({ src, success: (info) => resolve({ width: info.width, height: info.height }), fail: () => resolve(null) });
  });
}

async function openCrop(): Promise<void> {
  if (!item.value) return;
  const src = cropSourceOf(item.value);
  if (!src) return;
  const size = await getNaturalSize(src);
  if (!size || size.width < 1 || size.height < 1) { uni.showToast({ title: "无法读取图片，请重试", icon: "none" }); return; }
  const sys = uni.getSystemInfoSync();
  const width = Math.max(220, (sys.windowWidth || 360) - 40);
  const height = Math.max(240, (sys.windowHeight || 640) - 260);
  cropNatural.value = { w: size.width, h: size.height };
  cropContainer.value = { w: width, h: height };
  handleSize.value = Math.max(24, Math.round(width / 750 * 40));
  crop.value = { left: 0.06, top: 0.06, width: 0.88, height: 0.88 };
  cropOpen.value = true;
}
function resetCropBox(): void { crop.value = { left: 0.06, top: 0.06, width: 0.88, height: 0.88 }; }
function closeCrop(): void { cropOpen.value = false; cropGesture.value = null; }

async function confirmCrop(): Promise<void> {
  if (!item.value) return;
  const src = cropSourceOf(item.value);
  const dataUrl = await cropImageDataUrl(src, crop.value);
  if (!dataUrl) { uni.showToast({ title: "裁剪失败，请重试", icon: "none" }); return; }
  const thumb = (await cropImageDataUrl(src, crop.value, { maxEdge: 320 })) || dataUrl;
  item.value.cropPath = dataUrl;
  item.value.cropThumbnailPath = thumb;
  cropOpen.value = false;
  store.saveDraftItems(items.value, store.draft?.entry || "unknown");
  uni.showToast({ title: "已应用裁剪", icon: "success" });
}
function resetCropResult(): void {
  if (!item.value) return;
  item.value.cropPath = undefined;
  item.value.cropThumbnailPath = undefined;
  store.saveDraftItems(items.value, store.draft?.entry || "unknown");
}

function hitCropHandle(px: number, py: number, box: { x: number; y: number; w: number; h: number }): "nw" | "ne" | "sw" | "se" | "move" | null {
  const corners: Array<["nw" | "ne" | "sw" | "se", number, number]> = [
    ["nw", box.x, box.y],
    ["ne", box.x + box.w, box.y],
    ["sw", box.x, box.y + box.h],
    ["se", box.x + box.w, box.y + box.h],
  ];
  for (const [name, cx, cy] of corners) {
    if (Math.abs(px - cx) <= HANDLE_HIT && Math.abs(py - cy) <= HANDLE_HIT) return name;
  }
  if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) return "move";
  return null;
}

// uni-h5 归一化触摸事件时会把 clientY/pageY 减去窗口顶部偏移（导航栏+safeArea，见 uni-h5 的
// normalizeTouchEvent），X 轴不偏移。这里按同一来源（--window-top CSS 变量）把偏移加回，
// 还原成视口坐标后再减舞台左上角，得到舞台内相对坐标。
function uniWindowTopOffset(): number {
  const style = document.documentElement ? document.documentElement.style : null;
  const raw = style ? style.getPropertyValue('--window-top') : '';
  const m = raw.match(/\d+/);
  return m ? (parseInt(m[0], 10) || 0) : 0;
}

function onCropTouchStart(event: CropTouchEventLike): void {
  const touch = event.touches?.[0];
  if (!touch) return;
  // clientX 不受偏移；clientY 需先加回窗口顶部偏移（见 uniWindowTopOffset）。
  // uni-h5 会把触摸事件 currentTarget 归一化成组件对象，真实 DOM 元素从模板 ref 的 $el 取。
  const refVal = cropStageEl.value as { $el?: HTMLElement } | null;
  const stageEl = (refVal?.$el ?? (refVal as HTMLElement | null)) as HTMLElement | null;
  const stageRect = stageEl?.getBoundingClientRect();
  if (!stageRect) return;
  const topOff = uniWindowTopOffset();
  const px = (touch.clientX ?? touch.pageX ?? 0) - stageRect.left;
  const py = (touch.clientY ?? touch.pageY ?? 0) - (stageRect.top - topOff);
  const mode = hitCropHandle(px, py, cropBox.value);
  if (!mode) return;
  cropGesture.value = { mode, startX: px, startY: py, left: crop.value.left, top: crop.value.top, width: crop.value.width, height: crop.value.height, originX: stageRect.left, originY: stageRect.top - topOff };
}

function onCropTouchMove(event: CropTouchEventLike): void {
  const gesture = cropGesture.value;
  if (!gesture) return;
  const touch = event.touches?.[0];
  if (!touch) return;
  const px = (touch.clientX ?? touch.pageX ?? 0) - gesture.originX;
  const py = (touch.clientY ?? touch.pageY ?? 0) - gesture.originY;
  const ir = cropImageRect.value;
  const dx = (px - gesture.startX) / ir.w;
  const dy = (py - gesture.startY) / ir.h;
  const min = CROP_MIN;
  const g = gesture;
  if (g.mode === "move") {
    crop.value = {
      left: clamp(g.left + dx, 0, 1 - g.width),
      top: clamp(g.top + dy, 0, 1 - g.height),
      width: g.width,
      height: g.height,
    };
    return;
  }
  if (g.mode === "se") {
    crop.value = { left: g.left, top: g.top, width: clamp(g.width + dx, min, 1 - g.left), height: clamp(g.height + dy, min, 1 - g.top) };
    return;
  }
  const right = g.left + g.width;
  const bottom = g.top + g.height;
  if (g.mode === "nw") {
    const left = clamp(g.left + dx, 0, right - min);
    const top = clamp(g.top + dy, 0, bottom - min);
    crop.value = { left, top, width: right - left, height: bottom - top };
    return;
  }
  if (g.mode === "ne") {
    const top = clamp(g.top + dy, 0, bottom - min);
    const newRight = clamp(g.left + g.width + dx, g.left + min, 1);
    crop.value = { left: g.left, top, width: newRight - g.left, height: bottom - top };
    return;
  }
  const left = clamp(g.left + dx, 0, right - min);
  const newBottom = clamp(g.top + g.height + dy, g.top + min, 1);
  crop.value = { left, top: g.top, width: right - left, height: newBottom - g.top };
}

function onCropTouchEnd(): void { cropGesture.value = null; }
</script>

<template>
  <view v-if="item" :class="['inner-page','review-page',themeClass]">
    <view class="progress"><text>{{ current + 1 }} / {{ items.length }}</text><text>识别结果仅供参考，请确认后保存</text></view>
    <scroll-view class="thumbs" scroll-x><view class="thumb-row"><button v-for="(value, index) in items" :key="value.id" :class="{ active: index === current }" @tap="current = index"><image :src="thumbOf(value)" mode="aspectFill" /></button></view></scroll-view>
    <image class="preview" :src="imageOf(item)" mode="aspectFit" />
    <view class="matte-row">
      <view class="matte-info"><text class="matte-title">{{ item.cropPath ? '已手动裁剪' : '图片工具' }}</text><text class="matte-desc">{{ item.cropPath ? '保存时会使用裁剪后的图片' : '可自动去背景并手动裁切多余部分' }}</text></view>
      <view class="matte-actions">
        <button v-if="item.matted" class="matte-toggle" :class="{ active: item.matteEnabled }" :aria-pressed="item.matteEnabled" @tap="toggleMatte">{{ item.matteEnabled ? '去背景 · 开' : '去背景 · 关' }}</button>
        <button class="matte-toggle" :class="{ active: !!item.cropPath }" @tap="openCrop">{{ item.cropPath ? '重新裁剪' : '手动裁剪' }}</button>
        <button v-if="item.cropPath" class="matte-toggle" @tap="resetCropResult">重置裁剪</button>
      </view>
    </view>
    <text class="field-label">名称 *</text><input v-model="item.form.name" class="text-field" maxlength="30" placeholder="输入名称" @input="markCustomName" />
    <text class="field-label">品类 *</text><view class="option-grid"><button v-for="category in CATEGORIES" :key="category.id" :class="{ active: item.form.categoryId === category.id }" :aria-pressed="item.form.categoryId === category.id" @tap="chooseCategory(category.id)">{{ category.name }}</button></view>
    <text class="field-label">主色 *</text><scroll-view class="color-scroll" scroll-x><view class="color-row"><button v-for="color in COLORS" :key="color.id" :class="{ active: item.form.colorName === color.name }" :aria-pressed="item.form.colorName === color.name" @tap="chooseColor(color)"><text class="swatch" :style="{ backgroundColor: color.hex }" />{{ color.name }}</button></view></scroll-view>
    <text class="field-label">材质</text><picker :range="MATERIALS" :value="Math.max(0, MATERIALS.indexOf(item.form.materialId))" @change="item.form.materialId = MATERIALS[Number($event.detail.value)]"><view class="picker-value">{{ item.form.materialId || '请选择材质' }}</view></picker>
    <text class="field-label">适合季节</text><view class="chip-row"><button v-for="season in SEASONS" :key="season.id" class="chip" :class="{ active: item.form.seasonIds.includes(season.id) }" :aria-pressed="item.form.seasonIds.includes(season.id)" @tap="toggleSeason(season.id)">{{ season.name }}</button></view>
    <text class="field-label">风格</text><view class="option-grid"><button v-for="style in STYLES" :key="style" :class="{ active: item.form.styleIds.includes(style) }" :aria-pressed="item.form.styleIds.includes(style)" @tap="toggleStyle(style)">{{ STYLE_NAMES[style] }}</button></view>
    <text class="field-label">标签</text><input v-model="item.form.tagsText" class="text-field" placeholder="用逗号分隔，最多 10 个" />
    <view class="bottom-actions"><button v-if="current > 0" class="secondary-button" @tap="current -= 1">上一件</button><button v-if="current < items.length - 1" class="primary-button" @tap="current += 1">保存并看下一件</button><button v-else class="primary-button" @tap="saveAll">全部加入衣橱</button></view>
  </view>

  <view v-if="cropOpen" class="crop-mask">
    <view class="crop-sheet">
      <view class="crop-header">
        <text class="crop-title">手动裁剪</text>
        <button class="crop-close" @tap="closeCrop">取消</button>
      </view>
      <view class="crop-stage-wrap">
        <view ref="cropStageEl" class="crop-stage" :style="{ width: cropContainer.w + 'px', height: cropContainer.h + 'px' }"
          @touchstart.stop="onCropTouchStart" @touchmove.stop.prevent="onCropTouchMove" @touchend.stop="onCropTouchEnd" @touchcancel.stop="onCropTouchEnd">
          <image class="crop-image" :src="cropSourceOf(item)" mode="aspectFit" />
          <view class="crop-dim" :style="{ top: '0px', left: '0px', width: cropContainer.w + 'px', height: cropBox.y + 'px' }" />
          <view class="crop-dim" :style="{ top: cropBox.y + 'px', left: '0px', width: cropBox.x + 'px', height: cropBox.h + 'px' }" />
          <view class="crop-dim" :style="{ top: cropBox.y + 'px', left: (cropBox.x + cropBox.w) + 'px', width: (cropContainer.w - cropBox.x - cropBox.w) + 'px', height: cropBox.h + 'px' }" />
          <view class="crop-dim" :style="{ top: (cropBox.y + cropBox.h) + 'px', left: '0px', width: cropContainer.w + 'px', height: (cropContainer.h - cropBox.y - cropBox.h) + 'px' }" />
          <view class="crop-box" :style="{ left: cropBox.x + 'px', top: cropBox.y + 'px', width: cropBox.w + 'px', height: cropBox.h + 'px' }">
            <view class="crop-handle h-nw" :style="{ width: handleSize + 'px', height: handleSize + 'px' }" />
            <view class="crop-handle h-ne" :style="{ width: handleSize + 'px', height: handleSize + 'px' }" />
            <view class="crop-handle h-sw" :style="{ width: handleSize + 'px', height: handleSize + 'px' }" />
            <view class="crop-handle h-se" :style="{ width: handleSize + 'px', height: handleSize + 'px' }" />
          </view>
        </view>
      </view>
      <view class="crop-actions">
        <button class="crop-action secondary-button" @tap="resetCropBox">重置</button>
        <button class="crop-action primary-button" @tap="confirmCrop">确认裁剪</button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;
.review-page { padding-bottom:180rpx; }
.progress { display:flex; justify-content:space-between; margin-bottom:18rpx; color:$lilac-deep; font-size:23rpx; font-weight:700; }
.progress text:last-child { color:$muted; font-size:20rpx; font-weight:400; }
.thumbs { width:100%; margin-bottom:18rpx; }
.thumb-row { display:flex; gap:12rpx; }
.thumb-row button { width:92rpx; height:92rpx; flex:0 0 92rpx; margin:0; padding:4rpx; border:2rpx solid transparent; border-radius:20rpx; background:#fff; }
.thumb-row button.active { border-color:$lilac; }
.thumb-row image { width:100%; height:100%; border-radius:14rpx; }
.preview { width:100%; height:480rpx; border-radius:32rpx; background:#f7f2f9; }
.matte-row { display:flex; align-items:center; justify-content:space-between; gap:16rpx; margin:16rpx 0 4rpx; padding:18rpx 22rpx; border:1rpx solid $line; border-radius:22rpx; background:#fff; }
.matte-info { display:flex; flex-direction:column; gap:3rpx; min-width:0; }
.matte-title { color:$ink; font-size:25rpx; font-weight:700; }
.matte-desc { overflow:hidden; color:$muted; font-size:20rpx; text-overflow:ellipsis; white-space:nowrap; }
.matte-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8rpx; }
.matte-toggle { min-height:60rpx; margin:0; padding:0 20rpx; border:1rpx solid $line; border-radius:999rpx; background:#fff; color:$muted; font-size:22rpx; line-height:60rpx; }
.matte-toggle.active { border-color:$lilac-deep; background:$lilac-soft; color:$lilac-deep; }
.option-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12rpx; }
.option-grid button { min-height:88rpx; margin:0; padding:0 8rpx; border:1rpx solid $line; border-radius:18rpx; background:#fff; color:$muted; font-size:21rpx; line-height:1.25; }
.option-grid button.active { @include selected-control; }
.color-scroll { width:100%; }
.color-row { display:flex; gap:12rpx; }
.color-row button { display:flex; align-items:center; flex:0 0 auto; min-height:88rpx; margin:0; padding:0 18rpx; border:1rpx solid $line; border-radius:999rpx; background:#fff; color:$muted; font-size:22rpx; line-height:88rpx; }
.color-row button.active { @include selected-control; }
.swatch { width:26rpx; height:26rpx; margin-right:9rpx; border:1rpx solid rgba(0,0,0,.08); border-radius:999rpx; }
.picker-value { height:88rpx; padding:0 26rpx; border:1rpx solid $line; border-radius:24rpx; background:#fff; color:$ink; font-size:27rpx; line-height:88rpx; }
.bottom-actions { position:fixed; right:0; bottom:0; left:0; display:grid; grid-template-columns:auto 1fr; gap:16rpx; padding:20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom)); border-top:1rpx solid $line; background:rgba(255,252,253,.97); }
.bottom-actions button { width:100%; margin:0; }

.crop-mask { position:fixed; inset:0; z-index:100; background:rgba(18,14,22,.72); }
.crop-sheet { display:flex; flex-direction:column; width:100%; height:100%; background:#161119; }
.crop-header { display:flex; align-items:center; justify-content:space-between; flex:0 0 auto; padding:20rpx 28rpx; }
.crop-title { color:#fff; font-size:30rpx; font-weight:800; }
.crop-close { min-width:120rpx; margin:0; padding:0; border:0; background:transparent; color:#d8d2e6; font-size:24rpx; text-align:right; }
.crop-stage-wrap { display:flex; flex:1 1 auto; align-items:center; justify-content:center; min-height:0; }
.crop-stage { position:relative; overflow:hidden; border-radius:12rpx; background:rgba(0,0,0,.4); }
.crop-image { position:absolute; inset:0; width:100%; height:100%; }
.crop-dim { position:absolute; background:rgba(8,6,12,.55); }
.crop-box { position:absolute; box-sizing:border-box; border:2rpx solid #fff; }
.crop-handle { position:absolute; box-sizing:border-box; border:3px solid #fff; border-radius:5px; background:rgba(0,0,0,.3); }
.h-nw { left:0; top:0; transform:translate(-50%,-50%); }
.h-ne { right:0; top:0; transform:translate(50%,-50%); }
.h-sw { left:0; bottom:0; transform:translate(-50%,50%); }
.h-se { right:0; bottom:0; transform:translate(50%,50%); }
.crop-actions { display:grid; grid-template-columns:1fr 1.6fr; gap:16rpx; flex:0 0 auto; padding:20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom)); background:#161119; }
.crop-action { margin:0; }
</style>
