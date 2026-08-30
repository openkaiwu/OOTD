<script setup lang="ts">
import { computed } from "vue";
import type { Garment, Outfit } from "@/domain/types";

const props = defineProps<{ outfit: Outfit; garments: Garment[]; index?: number; interactive?: boolean; selectable?: boolean; selected?: boolean }>();
defineEmits<{
  (event: "feedback", value: "liked" | "disliked"): void;
  (event: "save"): void;
  (event: "share"): void;
  (event: "worn"): void;
  (event: "tryon"): void;
  (event: "select"): void;
}>();

const find = (id: string) => props.garments.find((item) => item.id === id);
const fitLabel = computed(() => props.outfit.score >= 88 ? "很适合" : props.outfit.score >= 82 ? "值得尝试" : "可尝试");
const feedbackText = computed(() => {
  if (props.outfit.feedback === "liked") return "已记住你喜欢这套，后续推荐会更接近它。";
  if (props.outfit.feedback === "disliked") return "已记录不喜欢的原因，可再次点击撤销。";
  if (props.outfit.saved) return "这套已保存，可在“我的穿搭”中找到。";
  return "反馈会保存在本机，并用于调整后续排序。";
});
</script>

<template>
  <view class="outfit-card">
    <view class="outfit-head">
      <view><text class="option">LOOK {{ String((index || 0) + 1).padStart(2, '0') }}</text><text class="title">{{ outfit.name }}</text></view>
      <view class="fit"><text>{{ fitLabel }}</text><text>{{ outfit.score }} 分</text></view>
    </view>
    <view class="outfit-grid">
      <view v-for="id in outfit.itemIds" :key="id" class="outfit-item">
        <view><image v-if="find(id)" :src="find(id)?.thumbnailPath || find(id)?.imagePath" mode="aspectFit" /></view>
        <text>{{ find(id)?.name || '单品已缺失' }}</text>
      </view>
    </view>
    <view class="reason-block"><text>推荐理由</text><text>{{ outfit.reason }}</text></view>
    <button v-if="selectable" class="record-select" :class="{ selected }" :aria-pressed="selected" :aria-label="`选择穿搭记录${outfit.name}`" @tap.stop="$emit('select')"><text>{{ selected ? '✓' : '' }}</text>{{ selected ? '已选中' : '选择此记录' }}</button>
    <view v-if="interactive" class="actions">
      <button class="feedback-action" :class="{ active: outfit.feedback === 'liked' }" :aria-pressed="outfit.feedback === 'liked'" @tap="$emit('feedback', 'liked')"><text class="action-symbol">{{ outfit.feedback === 'liked' ? '♥' : '♡' }}</text><view><text>{{ outfit.feedback === 'liked' ? '已喜欢' : '喜欢' }}</text><text>更接近此风格</text></view></button>
      <button class="feedback-action" :class="{ active: outfit.feedback === 'disliked' }" :aria-pressed="outfit.feedback === 'disliked'" @tap="$emit('feedback', 'disliked')"><text class="action-symbol">{{ outfit.feedback === 'disliked' ? '×' : '⊘' }}</text><view><text>{{ outfit.feedback === 'disliked' ? '已不喜欢' : '不喜欢' }}</text><text>减少类似推荐</text></view></button>
      <button class="feedback-action" :class="{ active: outfit.saved }" :aria-pressed="outfit.saved" @tap="$emit('save')"><text class="action-symbol">{{ outfit.saved ? '✓' : '⌑' }}</text><view><text>{{ outfit.saved ? '已保存' : '保存' }}</text><text>留在我的穿搭</text></view></button>
      <button class="feedback-action" aria-label="通过系统分享这套穿搭" @tap="$emit('share')"><text class="action-symbol">↗</text><view><text>分享</text><text>发给朋友</text></view></button>
      <text class="feedback-note" aria-live="polite">{{ feedbackText }}</text>
      <button class="worn" @tap="$emit('worn')">今天穿这套</button>
      <button class="tryon" aria-label="生成这套穿搭的虚拟试穿效果" @tap="$emit('tryon')">虚拟试穿</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.outfit-card { @include card; padding:28rpx; }
.outfit-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20rpx; }
.outfit-head>view:first-child { min-width:0; }
.option { display:block; margin-bottom:8rpx; color:$lilac-deep; font-size:$text-caption; font-weight:800; letter-spacing:2rpx; }
.title { display:block; overflow:hidden; color:$ink; font-size:$text-section; font-weight:800; line-height:1.2; text-overflow:ellipsis; white-space:nowrap; }
.fit { flex:0 0 auto; padding:9rpx 16rpx; border-radius:999rpx; background:$lilac-soft; text-align:right; }
.fit text { display:block; color:$lilac-deep; }
.fit text:first-child { font-size:$text-caption; font-weight:800; }
.fit text:last-child { margin-top:2rpx; font-size:20rpx; }
.outfit-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12rpx; margin:24rpx 0 20rpx; }
.outfit-item { min-width:0; padding:10rpx; border-radius:var(--theme-radius-control,20rpx); background:$image-surface; }
.outfit-item>view { display:flex; align-items:center; justify-content:center; height:190rpx; overflow:hidden; border-radius:calc(var(--theme-radius-control,20rpx) - 5rpx); background:$surface-elevated; }
.outfit-item image { width:94%; height:94%; }
.outfit-item>text { display:block; width:100%; margin-top:8rpx; overflow:hidden; color:$muted; font-size:$text-caption; text-align:center; text-overflow:ellipsis; white-space:nowrap; }
.reason-block { padding:20rpx 22rpx; border-radius:22rpx; background:$blush-soft; }
.reason-block text { display:block; }
.reason-block text:first-child { color:$ink; font-size:$text-label; font-weight:800; }
.reason-block text:last-child { margin-top:8rpx; color:$ink-soft; font-size:$text-body; line-height:1.6; }
.record-select { display:flex; align-items:center; justify-content:center; gap:9rpx; width:100%; min-height:80rpx; margin:12rpx 0 0; border:1rpx solid $line; border-radius:var(--theme-radius-control,22rpx); background:transparent; color:$muted; font-size:$text-label; font-weight:750; line-height:80rpx; }
.record-select text { display:flex; align-items:center; justify-content:center; width:30rpx; height:30rpx; border:1rpx solid $line-strong; border-radius:999rpx; color:#fff; font-size:18rpx; line-height:1; }
.record-select.selected { border-color:$lilac-deep; background:$lilac-soft; color:$focus; }
.record-select.selected text { border-color:$lilac-deep; background:$lilac-deep; }
.actions { display:grid; grid-template-columns:repeat(2,1fr); gap:12rpx; margin-top:20rpx; }
.actions button { min-height:92rpx; margin:0; padding:0 12rpx; border:1rpx solid $line; border-radius:var(--theme-radius-control,22rpx); background:$surface-elevated; color:$muted; font-size:$text-label; }
.actions button.active { @include selected-control; }
.feedback-action { display:flex; align-items:center; justify-content:flex-start; gap:12rpx; text-align:left; }
.action-symbol { display:flex; flex:0 0 36rpx; align-items:center; justify-content:center; width:36rpx; height:36rpx; border-radius:12rpx; background:$lilac-soft; color:$lilac-deep; font-size:24rpx; font-weight:800; line-height:1; }
.feedback-action view { min-width:0; }
.feedback-action view text { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.feedback-action view text:first-child { color:$ink; font-size:22rpx; font-weight:780; }
.feedback-action view text:last-child { margin-top:3rpx; color:$muted; font-size:18rpx; }
.feedback-action.active .action-symbol { background:$lilac-deep; color:#fff; }
.feedback-note { grid-column:1/-1; display:block; min-height:48rpx; padding:0 4rpx; color:$muted; font-size:$text-caption; line-height:1.5; }
.actions .worn { grid-column:1/-1; border:0; background:linear-gradient(135deg,var(--theme-button-start),var(--theme-button-end)); color:#fff; font-weight:780; box-shadow:var(--theme-button-shadow); }
.actions .tryon { grid-column:1/-1; border-color:rgba(198,122,154,.28); background:$lilac-soft; color:$lilac-deep; font-weight:760; }
</style>
