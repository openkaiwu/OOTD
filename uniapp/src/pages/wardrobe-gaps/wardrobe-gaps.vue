<script setup lang="ts">
import { useAppTheme } from "@/composables/useAppTheme";
const { themeClass } = useAppTheme();
</script>
<template>
  <view :class="['inner-page','gaps-page',themeClass]"><text class="section-title block">穿搭好物</text><text class="intro">发现适合你的穿搭好物</text>
    <view class="coming-soon"><text>✦</text><text>敬请期待</text><text>我们正在完善基于衣橱和个人风格的好物推荐，未来会在这里为你呈现。</text></view>
  </view>
</template>
<style scoped lang="scss">
@use "@/styles/theme.scss" as *;.gaps-page{background:$pearl}.block{display:block}.intro{display:block;margin:8rpx 0 24rpx;color:$muted;font-size:21rpx}.coming-soon{display:flex;flex-direction:column;align-items:center;margin:140rpx 26rpx 0;padding:50rpx 34rpx;border:1rpx solid $line;border-radius:32rpx;background:$surface-solid;box-shadow:$shadow;text-align:center}.coming-soon text{display:block}.coming-soon text:first-child{display:flex;align-items:center;justify-content:center;width:100rpx;height:100rpx;border-radius:999rpx;background:$lilac-soft;color:$lilac-deep;font-size:46rpx}.coming-soon text:nth-child(2){margin-top:24rpx;color:$ink;font-size:31rpx;font-weight:800}.coming-soon text:last-child{margin-top:12rpx;color:$muted;font-size:22rpx;line-height:1.7}
</style>
