<script setup lang="ts">
defineProps<{ eyebrow?: string; count?: string; weatherText?: string; title?: string }>();
defineEmits<{ (event: "weather"): void }>();
</script>

<template>
  <view class="app-header" :class="{ 'with-weather': weatherText, 'title-only': title }">
    <text v-if="title" class="page-title">{{ title }}</text>
    <view v-else class="brand-row">
      <text class="brand">OOTD</text>
      <text class="brand-cn">明天穿什么</text>
    </view>
    <button v-if="weatherText" class="weather-pill" :aria-label="`天气：${weatherText}，点击查看或更新`" @tap="$emit('weather')">
      <text>{{ weatherText }}</text><text aria-hidden="true">›</text>
    </button>
    <text v-else-if="count" class="header-count">{{ count }}</text>
  </view>
  <text v-if="eyebrow" class="page-eyebrow">{{ eyebrow }}</text>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;
.app-header { display:flex; align-items:center; justify-content:space-between; min-height:80rpx; margin-bottom:32rpx; }
.app-header.title-only { justify-content:center; }
.page-title { color:$ink; font-size:$text-section; font-weight:800; letter-spacing:var(--theme-display-letter-spacing,0); line-height:1.2; text-align:center; }
.brand-row { display:flex; align-items:baseline; gap:10rpx; }
.brand { color:$ink; font-size:30rpx; font-weight:800; letter-spacing:.5rpx; }
.brand-cn { color:$ink; font-size:$text-body; font-weight:600; }
.header-count { max-width:280rpx; overflow:hidden; color:$muted; font-size:$text-caption; text-overflow:ellipsis; white-space:nowrap; }
.page-eyebrow { display:block; margin:-10rpx 0 14rpx; color:$lilac-deep; font-size:18rpx; font-weight:800; letter-spacing:2rpx; }
.weather-pill { display:flex; align-items:center; justify-content:flex-start; gap:10rpx; min-height:80rpx; margin:0; padding:0 20rpx; border:1rpx solid $line; border-radius:999rpx; background:$surface-elevated; color:$ink-soft; font-size:$text-label; line-height:80rpx; }
.weather-pill text:last-child { color:$lilac-deep; font-size:30rpx; }
.weather-pill:active { background:$lilac-soft; }
</style>
