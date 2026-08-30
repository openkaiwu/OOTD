<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { CATEGORIES, COLORS, MATERIALS, SCENES, SEASONS, STYLES, STYLE_NAMES } from "@/domain/constants";
import { mergeTags, parseTagInput, TAG_LIMIT } from "@/domain/tags";
import { chooseImages, prepareDraftItem, removeSavedFile } from "@/infrastructure/media";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useOutfitStore } from "@/stores/outfits";
import type { CategoryId, Garment, SeasonId } from "@/domain/types";
import { useAppTheme } from "@/composables/useAppTheme";

const wardrobe = useWardrobeStore();
const outfits = useOutfitStore();
const { themeClass } = useAppTheme();
const id = ref("");
const editing = ref<Garment | null>(null);
const originalImage = ref("");
const originalThumbnail = ref("");
const colorOpen = ref(false);
const tagDraft = ref("");
const references = computed(() => outfits.outfits.filter((outfit) => outfit.itemIds.includes(id.value)).length);

const categoryIcons: Record<CategoryId, string> = {
  "top-short": "👕", "top-long": "👚", outerwear: "▣", pants: "▥",
  skirt: "👗", dress: "💃", shoes: "⌁", accessory: "◒",
};

const sceneNames: Record<string, string> = {
  commute: "通勤", weekend: "日常", date: "约会", interview: "面试",
  party: "聚会", sport: "运动", beach: "度假", coffee: "咖啡",
  hiking: "户外", shopping: "逛街", office: "办公", festival: "节日",
};

onLoad((options) => {
  wardrobe.hydrate();
  outfits.hydrate();
  id.value = String(options?.id || "");
  const found = wardrobe.garments.find((item) => item.id === id.value);
  if (found) {
    editing.value = JSON.parse(JSON.stringify(found));
    originalImage.value = found.imagePath;
    originalThumbnail.value = found.thumbnailPath;
  }
});

function close(): void { uni.navigateBack(); }
function toggleSeason(season: SeasonId): void {
  if (!editing.value) return;
  editing.value.seasonIds = editing.value.seasonIds.includes(season)
    ? editing.value.seasonIds.filter((value) => value !== season)
    : [...editing.value.seasonIds, season];
}
function toggleScene(scene: string): void {
  if (!editing.value) return;
  editing.value.sceneIds = editing.value.sceneIds.includes(scene)
    ? editing.value.sceneIds.filter((value) => value !== scene)
    : [...editing.value.sceneIds, scene];
}
function toggleStyle(style: string): void {
  if (!editing.value) return;
  editing.value.styleIds = editing.value.styleIds.includes(style)
    ? editing.value.styleIds.filter((value) => value !== style)
    : [...editing.value.styleIds, style];
}
function selectColor(name: string, hex: string): void {
  if (!editing.value) return;
  editing.value.colorName = name;
  editing.value.colorHex = hex;
  colorOpen.value = false;
}

function addTags(): void {
  if (!editing.value) return;
  const parsed = parseTagInput(tagDraft.value);
  if (!parsed.length) {
    uni.showToast({ title: "先输入标签内容", icon: "none" });
    return;
  }
  const result = mergeTags(editing.value.tags, parsed);
  editing.value.tags = result.tags;
  tagDraft.value = "";
  if (result.rejected) uni.showToast({ title: `最多保留 ${TAG_LIMIT} 个标签`, icon: "none" });
  else if (!result.added) uni.showToast({ title: "标签已存在", icon: "none" });
}

function removeTag(tag: string): void {
  if (!editing.value) return;
  editing.value.tags = editing.value.tags.filter((item) => item !== tag);
}

function chooseImageSource(): void {
  uni.showActionSheet({
    itemList: ["拍照", "从相册选择"],
    success: (result) => replaceImage(result.tapIndex === 0 ? "camera" : "album"),
  });
}
async function replaceImage(source: "camera" | "album"): Promise<void> {
  if (!editing.value) return;
  try {
    const path = (await chooseImages(source, 1))[0];
    const prepared = await prepareDraftItem(path);
    if (prepared.status === "review") {
      editing.value.imagePath = prepared.persistedPath;
      editing.value.thumbnailPath = prepared.thumbnailPath || prepared.persistedPath;
    }
  } catch {
    uni.showToast({ title: "图片替换失败", icon: "none" });
  }
}

async function save(): Promise<void> {
  if (!editing.value?.name.trim()) {
    uni.showToast({ title: "请输入名称", icon: "none" });
    return;
  }
  const nextImage = editing.value.imagePath;
  const nextThumbnail = editing.value.thumbnailPath;
  wardrobe.update({ ...editing.value, name: editing.value.name.trim() });
  if (nextImage !== originalImage.value) await removeSavedFile(originalImage.value);
  if (nextThumbnail !== originalThumbnail.value && originalThumbnail.value !== originalImage.value) await removeSavedFile(originalThumbnail.value);
  uni.showToast({ title: "已保存", icon: "none" });
  setTimeout(close, 260);
}

function remove(): void {
  if (!editing.value) return;
  uni.showModal({
    title: "删除这件单品？",
    content: references.value ? `将影响 ${references.value} 套穿搭，删除后可撤销。` : "删除后可撤销。",
    confirmText: "删除",
    cancelText: "取消",
    confirmColor: "#FA5151",
    success: (result) => {
      if (!result.confirm) return;
      wardrobe.softDelete(editing.value!.id);
      setTimeout(close, 120);
    },
  });
}
</script>

<template>
  <view v-if="editing" :class="['edit-page',themeClass]">
    <view class="edit-header">
      <text>编辑单品</text>
      <button aria-label="关闭编辑" @tap="close">×</button>
    </view>

    <scroll-view class="edit-scroll" scroll-y>
      <view class="edit-content">
        <view class="image-panel" role="button" aria-label="点击更换单品图片" @tap="chooseImageSource">
          <image :src="editing.imagePath" mode="aspectFit" />
          <button class="favorite-button" :class="{ active: editing.favorite }" :aria-label="editing.favorite ? '取消收藏' : '收藏单品'" :aria-pressed="editing.favorite" @tap.stop="editing.favorite = !editing.favorite">
            <text aria-hidden="true">{{ editing.favorite ? '♥' : '♡' }}</text>
          </button>
        </view>

        <view class="field-section">
          <text class="field-name">名称</text>
          <input v-model="editing.name" class="name-input" maxlength="30" placeholder="单品名称" />
        </view>

        <view class="field-section">
          <text class="field-name">类别</text>
          <view class="pill-wrap category-pills">
            <button v-for="category in CATEGORIES" :key="category.id" class="option-pill" :class="{ active: editing.categoryId === category.id }" :aria-pressed="editing.categoryId === category.id" @tap="editing.categoryId = category.id">
              <text aria-hidden="true">{{ categoryIcons[category.id] }}</text><text>{{ category.name }}</text>
            </button>
          </view>
        </view>

        <view class="field-section color-section">
          <view class="field-with-badge"><text class="field-name">颜色</text><text class="ai-badge">AI</text></view>
          <button class="current-color" :aria-label="`当前颜色${editing.colorName}，点击修改`" @tap="colorOpen = !colorOpen">
            <view :style="{ backgroundColor: editing.colorHex }" /><text>{{ editing.colorName }}</text>
          </button>
          <view v-if="colorOpen" class="color-palette">
            <button v-for="color in COLORS" :key="color.id" :class="{ active: editing.colorName === color.name }" :aria-label="color.name" :aria-pressed="editing.colorName === color.name" @tap="selectColor(color.name, color.hex)"><view :style="{ backgroundColor: color.hex }" /></button>
          </view>
        </view>

        <view class="field-section compact-section">
          <text class="field-name">适合季节</text>
          <view class="pill-wrap"><button v-for="season in SEASONS" :key="season.id" class="option-pill" :class="{ active: editing.seasonIds.includes(season.id) }" :aria-pressed="editing.seasonIds.includes(season.id)" @tap="toggleSeason(season.id)">{{ season.name }}</button></view>
        </view>

        <view class="field-section compact-section">
          <text class="field-name">场景</text>
          <view class="pill-wrap"><button v-for="scene in SCENES" :key="scene.id" class="option-pill" :class="{ active: editing.sceneIds.includes(scene.id) }" :aria-pressed="editing.sceneIds.includes(scene.id)" @tap="toggleScene(scene.id)">{{ sceneNames[scene.id] || scene.name }}</button></view>
        </view>

        <view class="field-section compact-section">
          <text class="field-name">风格</text>
          <view class="pill-wrap"><button v-for="style in STYLES" :key="style" class="option-pill" :class="{ active: editing.styleIds.includes(style) }" :aria-pressed="editing.styleIds.includes(style)" @tap="toggleStyle(style)">{{ STYLE_NAMES[style] }}</button></view>
        </view>

        <view class="field-section material-section">
          <text class="field-name">材质</text>
          <picker :range="MATERIALS" :value="Math.max(0, MATERIALS.indexOf(editing.materialId || '未知'))" @change="editing.materialId = MATERIALS[Number($event.detail.value)]">
            <view class="material-value"><text>{{ editing.materialId || '未知' }}</text><text aria-hidden="true">›</text></view>
          </picker>
        </view>

        <view class="field-section tag-section">
          <view class="tag-head">
            <text class="field-name">标签</text>
            <text class="tag-count">{{ editing.tags.length }}/{{ TAG_LIMIT }}</text>
          </view>
          <view v-if="editing.tags.length" class="tag-list">
            <view v-for="tag in editing.tags" :key="tag" class="tag-chip">
              <text class="tag-name">{{ tag }}</text>
              <button class="tag-remove" :aria-label="`删除标签${tag}`" @tap="removeTag(tag)"><text aria-hidden="true">×</text></button>
            </view>
          </view>
          <text v-else class="tag-empty">还没有标签，添加后可在衣橱搜索中使用。</text>
          <view class="tag-add">
            <input v-model="tagDraft" class="tag-input" maxlength="60" aria-label="输入新标签" placeholder="输入标签，可用逗号分隔" confirm-type="done" @confirm="addTags" />
            <button class="tag-add-button" :disabled="editing.tags.length >= TAG_LIMIT" @tap="addTags">添加</button>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-actions">
      <button class="delete-button" @tap="remove">删除</button>
      <button class="save-button" @tap="save">保存</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.edit-page { position:fixed; z-index:1; inset:0; display:flex; flex-direction:column; width:100%; height:auto; overflow:hidden; background:#fff; color:$ink; }
.edit-header { display:flex; flex:0 0 auto; align-items:center; justify-content:space-between; min-height:96rpx; padding:calc(var(--status-bar-height) + 14rpx) 24rpx 12rpx 28rpx; background:#fff; }
.edit-header>text { font-size:32rpx; font-weight:700; line-height:1.3; }
.edit-header button { display:flex; align-items:center; justify-content:center; width:88rpx; height:88rpx; min-height:88rpx; margin:0; padding:0; border:3rpx solid #8f8f8f; border-radius:50%; background:#fff; color:#8f8f8f; font-size:42rpx; font-weight:400; line-height:82rpx; }
.edit-scroll { flex:1; height:0; min-height:0; }
.edit-content { padding:12rpx 24rpx 48rpx; }
.image-panel { position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:700rpx; overflow:hidden; border-radius:20rpx; background:#f6f6f6; }
.image-panel>image { width:88%; height:88%; }
.favorite-button { position:absolute; display:flex; align-items:center; justify-content:center; width:88rpx; height:88rpx; min-height:88rpx; margin:0; padding:0; border:0; border-radius:50%; background:rgba(255,255,255,.9); }
.favorite-button { top:24rpx; right:24rpx; color:$muted-light; font-size:56rpx; line-height:88rpx; }
.favorite-button.active { color:#ff2d55; }
.field-section { margin-top:34rpx; }
.field-name { display:block; margin-bottom:14rpx; color:#5e5a5c; font-size:25rpx; font-weight:650; line-height:1.4; }
.name-input { width:100%; height:84rpx; box-sizing:border-box; padding:0 26rpx; border:1rpx solid #e4e4e4; border-radius:16rpx; background:#f7f7f7; color:$ink; font-size:27rpx; font-weight:400; }
.pill-wrap { display:flex; flex-wrap:wrap; gap:12rpx; }
.option-pill { display:flex; align-items:center; justify-content:center; gap:7rpx; min-width:88rpx; min-height:72rpx; margin:0; padding:0 24rpx; border:1rpx solid #e4e4e4; border-radius:999rpx; background:#f7f7f7; color:#666; font-size:24rpx; font-weight:500; line-height:72rpx; }
.option-pill.active { border-color:#ef9bbd; background:#fff1f6; color:$lilac-deep; box-shadow:none; }
.category-pills .option-pill { padding:0 20rpx; }
.category-pills .option-pill text:first-child { font-size:25rpx; }
.field-with-badge { display:flex; align-items:center; gap:10rpx; margin-bottom:14rpx; }
.field-with-badge .field-name { margin:0; }
.ai-badge { padding:2rpx 10rpx; border-radius:6rpx; background:$lilac-soft; color:$lilac-deep; font-size:18rpx; font-weight:700; }
.current-color { display:flex; flex-direction:column; align-items:flex-start; min-width:112rpx; min-height:126rpx; margin:0; padding:0; border:0; background:transparent; color:$muted; font-size:21rpx; text-align:left; }
.current-color>view { width:68rpx; height:68rpx; box-sizing:border-box; border:4rpx solid #efa0c0; border-radius:18rpx; box-shadow:inset 0 0 0 5rpx #fff; }
.current-color>text { margin-top:10rpx; }
.color-palette { display:grid; grid-template-columns:repeat(6,1fr); gap:12rpx; margin-top:12rpx; padding:18rpx; border-radius:18rpx; background:#f8f8f8; }
.color-palette button { display:flex; align-items:center; justify-content:center; width:88rpx; height:88rpx; min-height:88rpx; margin:0; padding:0; border:3rpx solid transparent; border-radius:18rpx; background:#fff; }
.color-palette button.active { border-color:$lilac-deep; }
.color-palette view { width:46rpx; height:46rpx; border:1rpx solid $line; border-radius:12rpx; }
.compact-section { margin-top:30rpx; }
.material-section { padding-bottom:12rpx; }
.tag-section { padding-bottom:12rpx; }
.tag-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14rpx; }
.tag-head .field-name { margin:0; }
.tag-count { color:#999; font-size:21rpx; }
.tag-list { display:flex; flex-wrap:wrap; gap:12rpx; }
.tag-chip { display:flex; align-items:center; gap:4rpx; min-height:60rpx; padding:0 8rpx 0 18rpx; border:1rpx solid #ef9bbd; border-radius:999rpx; background:#fff1f6; }
.tag-name { color:$lilac-deep; font-size:22rpx; font-weight:500; }
.tag-remove { display:flex; align-items:center; justify-content:center; width:52rpx; min-width:52rpx; min-height:52rpx; margin:0; padding:0; border:0; border-radius:50%; background:transparent; color:#c9b3c0; font-size:30rpx; line-height:52rpx; }
.tag-remove:active { background:rgba(0,0,0,.06); }
.tag-empty { display:block; color:#999; font-size:21rpx; line-height:1.5; }
.tag-add { display:grid; grid-template-columns:1fr auto; gap:12rpx; margin-top:14rpx; }
.tag-input { width:100%; height:84rpx; box-sizing:border-box; padding:0 26rpx; border:1rpx solid #e4e4e4; border-radius:16rpx; background:#f7f7f7; color:$ink; font-size:26rpx; }
.tag-add-button { display:flex; align-items:center; justify-content:center; min-width:128rpx; min-height:84rpx; margin:0; padding:0 24rpx; border:0; border-radius:16rpx; background:#e39ac0; color:#fff; font-size:26rpx; font-weight:700; line-height:84rpx; }
.tag-add-button[disabled] { opacity:.45; }
.material-value { display:flex; align-items:center; justify-content:space-between; min-height:84rpx; padding:0 24rpx; border:1rpx solid #e4e4e4; border-radius:16rpx; background:#f7f7f7; color:$ink; font-size:25rpx; }
.material-value text:last-child { color:$muted; font-size:34rpx; }
.bottom-actions { display:grid; flex:0 0 auto; grid-template-columns:1fr 1fr; gap:16rpx; padding:16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); border-top:1rpx solid $line; background:rgba(255,255,255,.98); }
.bottom-actions button { min-height:92rpx; margin:0; border-radius:14rpx; font-size:28rpx; font-weight:700; line-height:92rpx; }
.delete-button { border:2rpx solid #777; background:#f7f7f7; color:#ff3b30; }
.save-button { border:2rpx solid #8c6d7a; background:#e39ac0; color:#fff; }

@media (max-width:370px) {
  .image-panel { height:640rpx; }
  .option-pill { padding-right:20rpx; padding-left:20rpx; }
  .color-palette { gap:8rpx; padding-right:12rpx; padding-left:12rpx; }
}
</style>
