<script setup lang="ts">
import { computed } from "vue";
import { CATEGORIES } from "@/domain/constants";
import type { Garment } from "@/domain/types";

const props = defineProps<{ item: Garment; compact?: boolean; selectable?: boolean; selected?: boolean }>();
const emit = defineEmits<{
  (event: "open", id: string): void;
  (event: "select", id: string): void;
  (event: "favorite", id: string): void;
}>();
const categoryName = computed(() => CATEGORIES.find((category) => category.id === props.item.categoryId)?.name || "单品");
function activate(): void { props.selectable ? emit("select", props.item.id) : emit("open", props.item.id); }
</script>

<template>
  <view class="garment-card" :class="{ compact, selectable, selected }" :aria-label="`${item.name}，${categoryName}，${item.colorName}${selected ? '，已选择' : ''}`" @tap="activate">
    <view class="image-wrap">
      <image class="garment-image" :src="item.thumbnailPath || item.imagePath" mode="aspectFit" />
      <view v-if="selectable" class="selection-check" :class="{ active: selected }" aria-hidden="true"><text>{{ selected ? '✓' : '' }}</text></view>
      <button v-else-if="!selectable" class="favorite" :class="{ active: item.favorite }" :aria-label="item.favorite ? `取消收藏${item.name}` : `收藏${item.name}`" :aria-pressed="item.favorite" @tap.stop="$emit('favorite', item.id)">
        <text aria-hidden="true">{{ item.favorite ? '♥' : '♡' }}</text>
      </button>
    </view>
    <text class="garment-name" data-no-i18n>{{ item.name }}</text>
    <text class="garment-meta">{{ categoryName }} · {{ item.colorName }}</text>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.garment-card { min-width:0; overflow:hidden; padding:12rpx 12rpx 24rpx; border:1rpx solid $line; border-radius:$radius-lg; background:$surface-elevated; box-shadow:$shadow; }
.garment-card.selectable { cursor:pointer; }
.garment-card.selected { border-color:$lilac-deep; background:$lilac-soft; box-shadow:inset 0 0 0 2rpx rgba(119,84,214,.14); }
.image-wrap { position:relative; display:flex; align-items:center; justify-content:center; width:100%; aspect-ratio:4/5; overflow:hidden; border-radius:calc(var(--theme-radius-card, 24rpx) - 6rpx); background:$image-surface; }
.garment-image { width:92%; height:92%; }
.favorite { position:absolute; top:8rpx; right:8rpx; display:flex; align-items:center; justify-content:center; width:88rpx; min-width:88rpx; height:88rpx; min-height:88rpx; margin:0; padding:0; border:0; border-radius:50%; background:$surface-elevated; color:$muted; font-size:38rpx; line-height:88rpx; }
.favorite.active { background:$lilac-soft; color:$lilac-deep; }
.selection-check { position:absolute; top:14rpx; right:14rpx; display:flex; align-items:center; justify-content:center; width:54rpx; height:54rpx; box-sizing:border-box; border:3rpx solid $line-strong; border-radius:50%; background:$surface-elevated; color:#fff; font-size:28rpx; font-weight:900; line-height:1; }
.selection-check.active { border-color:$lilac-deep; background:$lilac-deep; box-shadow:0 0 0 7rpx rgba(232,160,191,.24); }
.garment-name { display:block; margin:18rpx 8rpx 8rpx; overflow:hidden; color:$ink; font-size:$text-body-large; font-weight:750; text-overflow:ellipsis; white-space:nowrap; }
.garment-meta { display:block; margin:0 8rpx; overflow:hidden; color:$muted; font-size:$text-caption; text-overflow:ellipsis; white-space:nowrap; }
.compact { width:164rpx; flex:0 0 164rpx; padding:8rpx; }
.compact .favorite,.compact .garment-name,.compact .garment-meta { display:none; }
</style>
