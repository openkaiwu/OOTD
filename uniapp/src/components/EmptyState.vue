<script setup lang="ts">
defineProps<{ title: string; description: string; action?: string }>();
defineEmits<{ (event: "action"): void }>();
</script>
<template>
  <view class="empty-state">
    <view class="empty-visual"><image class="empty-image" src="/static/reference/orb-new.png" mode="aspectFit" /></view>
    <text class="empty-title">{{ title }}</text>
    <text class="empty-description">{{ description }}</text>
    <button v-if="action" class="empty-action" @tap="$emit('action')">{{ action }}</button>
  </view>
</template>
<style scoped lang="scss">
@use "@/styles/theme.scss" as *;
.empty-state { @include card; display:flex; flex-direction:column; align-items:center; padding:44rpx 30rpx; text-align:center; }
.empty-visual { display:flex; align-items:center; justify-content:center; width:220rpx; height:200rpx; margin-bottom:20rpx; border-radius:42rpx; background:$blush-soft; }
.empty-image { width:170rpx; height:180rpx; }
.empty-title { color:$ink; font-size:31rpx; font-weight:800; }
.empty-description { max-width:520rpx; margin:14rpx 0 28rpx; color:$muted; font-size:24rpx; line-height:1.65; }
.empty-action { min-height:88rpx; padding:0 32rpx; border:0; border-radius:22rpx; background:$lilac; color:#fff; font-size:26rpx; font-weight:750; }
</style>
