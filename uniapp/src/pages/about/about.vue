<script setup lang="ts">
import { useAppTheme } from "@/composables/useAppTheme";
const { themeClass } = useAppTheme();
</script>
<template>
  <view :class="['inner-page','about-page',themeClass]">
    <view class="brand"><image src="/static/avatar.png" mode="aspectFit" /><text>明天穿什么</text><text>v0.1.0</text></view>
    <view class="card"><text>本地优先</text><text>衣物照片、穿搭和反馈默认只保存在当前设备。</text></view>
    <view class="card"><text>权限用途</text><text>相机与相册用于添加衣物；定位仅在点击后用于获取当前位置天气。</text></view>
  </view>
</template>
<style scoped lang="scss">
@use "@/styles/theme.scss" as *;.about-page{background:$pearl}.brand{display:flex;flex-direction:column;align-items:center;padding:60rpx 0 40rpx}.brand image{width:140rpx;height:140rpx}.brand text{display:block}.brand text:nth-child(2){margin-top:16rpx;color:$ink;font-size:34rpx;font-weight:800}.brand text:last-child{margin-top:5rpx;color:$muted;font-size:21rpx}.card{margin-bottom:18rpx;padding:28rpx;border:1rpx solid $line;border-radius:26rpx;background:$surface-solid}.card text{display:block}.card text:first-child{color:$ink;font-size:26rpx;font-weight:750}.card text:last-child{margin-top:9rpx;color:$muted;font-size:22rpx;line-height:1.6}
</style>
