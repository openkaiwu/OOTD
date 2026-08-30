<script setup lang="ts">
import { ref } from "vue";
import type { FeedbackCategory } from "@/domain/types";
import { useAppTheme } from "@/composables/useAppTheme";
import { systemShareText } from "@/infrastructure/share";
import { translate } from "@/i18n";

const { themeClass } = useAppTheme();
const categories: FeedbackCategory[] = ["功能建议", "体验问题", "其他"];
const category = ref<FeedbackCategory>("功能建议");
const content = ref("");
async function send(): Promise<void> {
  const value = content.value.trim();
  if (!value) { uni.showToast({ title: "请填写内容", icon: "none" }); return; }
  const message = `OOTD · ${translate("开发者反馈")}\n${translate("反馈类型")}：${translate(category.value)}\n\n${value.slice(0, 500)}`;
  try {
    await systemShareText(message, false);
    content.value = "";
    uni.showToast({ title: "已打开系统分享", icon: "success" });
  } catch { uni.showToast({ title: "发送失败，请重试", icon: "none" }); }
}
</script>

<template>
  <view :class="['inner-page','feedback-page',themeClass]">
    <text class="section-title block">意见反馈</text><text class="tip">将通过系统分享发送给开发者</text>
    <view class="chips"><button v-for="item in categories" :key="item" :class="{active:category===item}" :aria-pressed="category===item" @tap="category=item">{{ item }}<text v-if="category===item">✓</text></button></view>
    <textarea v-model="content" maxlength="500" aria-label="反馈内容" placeholder="写下你的建议或遇到的问题" />
    <view class="count"><text>{{ content.length }}/500</text></view><button class="primary-button save" @tap="send">发送给开发者</button>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;.feedback-page{background:$pearl}.block{display:block}.tip{display:block;margin:6rpx 0 24rpx;color:$muted;font-size:21rpx}.chips{display:flex;flex-wrap:wrap;gap:12rpx}.chips button{min-height:88rpx;margin:0;padding:0 24rpx;border:1rpx solid $line;border-radius:999rpx;background:$surface-solid;color:$muted;font-size:22rpx}.chips button.active{border-color:$lilac-deep;background:$lilac-soft;color:$focus;font-weight:700}.chips button text{margin-left:8rpx}textarea{box-sizing:border-box;width:100%;height:280rpx;margin-top:20rpx;padding:24rpx;border:1rpx solid $line;border-radius:26rpx;background:$surface-solid;color:$ink;font-size:25rpx;line-height:1.6}.count{text-align:right;color:$muted;font-size:19rpx}.save{width:100%;margin:18rpx 0}.history{margin-top:34rpx}.history>text{display:block;margin-bottom:14rpx;color:$ink;font-size:26rpx;font-weight:800}.feedback-item{display:grid;grid-template-columns:1fr auto;align-items:start;gap:16rpx;margin-bottom:12rpx;padding:22rpx;border:1rpx solid $line;border-radius:22rpx;background:$surface-solid}.feedback-item view text{display:block}.feedback-item view text:first-child{color:$lilac-deep;font-size:19rpx;font-weight:700}.feedback-item view text:last-child{margin-top:8rpx;color:$ink;font-size:22rpx;line-height:1.5}.feedback-item button{min-width:88rpx;min-height:88rpx;margin:0;border:0;background:transparent;color:$danger;font-size:20rpx}
</style>
