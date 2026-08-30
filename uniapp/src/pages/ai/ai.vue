<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { llmPingDetailed, type LlmPingResult, type LlmSettings } from "@/infrastructure/llm";
import { useSettingsStore } from "@/stores/settings";
import { useAppTheme } from "@/composables/useAppTheme";
import { useI18n } from "@/i18n";

const settings = useSettingsStore();
const { themeClass } = useAppTheme();
const { t } = useI18n();
const aiTesting = ref(false);
const aiDraft = ref<LlmSettings>({ enabled: false, apiKey: "", baseUrl: "https://api.xiaomimimo.com/v1", model: "mimo-v2.5-pro", visionModel: "mimo-v2.5" });

onShow(() => { settings.hydrate(); aiDraft.value = { ...settings.llm }; });

function onAiToggle(event: unknown): void {
  const detail = (event as { detail?: { value?: boolean } } | null)?.detail;
  aiDraft.value.enabled = Boolean(detail?.value);
}
function saveAi(): void {
  settings.saveLlmSettings({ ...aiDraft.value });
  uni.showToast({ title: t(aiDraft.value.enabled ? "AI 助手已开启" : "已保存，AI 助手未开启"), icon: "none" });
}
async function testAi(): Promise<void> {
  if (aiTesting.value) return;
  if (!aiDraft.value.apiKey.trim()) { uni.showToast({ title: t("请先填写 API Key"), icon: "none" }); return; }
  aiTesting.value = true;
  const result = await llmPingDetailed({ ...aiDraft.value, enabled: true });
  aiTesting.value = false;
  uni.showToast({ title: result.ok ? t("连接成功") : pingFailureText(result), icon: "none", duration: 3200 });
}

function pingFailureText(result: LlmPingResult): string {
  if (result.status === 401 || result.status === 403) return t("API Key 无效或没有模型权限");
  if (result.status === 404) return t("接口地址或模型不可用");
  if (result.status === 429) return t("请求过于频繁或账户额度不足");
  if (result.status === 0) {
    if (result.message.includes("NETWORK_DNS_FAILURE")) return t("无法解析接口域名，请检查网络或 DNS");
    if (result.message.includes("NETWORK_TLS_FAILURE")) return t("安全连接失败，请检查系统时间或网络");
    if (result.message.includes("NETWORK_TIMEOUT")) return t("请求超时，请检查网络或稍后重试");
    return t("网络连接失败，请检查网络后重试");
  }
  return `${t("连接失败")}（HTTP ${result.status}）`;
}
</script>

<template>
  <scroll-view :class="['inner-page', 'ai-page', themeClass]" scroll-y>
    <text class="eyebrow">AI 设置</text>
    <text class="section-title block">AI 助手</text>
    <text class="lead">配置后可用于衣物识别和穿搭点评</text>

    <view class="ai-card">
      <view class="ai-toggle"><view><text>识图与搭配点评</text><text>开启后才会调用已配置的服务</text></view><switch :checked="aiDraft.enabled" aria-label="开关大模型识别" @change="onAiToggle" /></view>
      <view class="ai-field"><text>API Key</text><input v-model="aiDraft.apiKey" class="ai-input" password placeholder="sk-..." aria-label="大模型 API Key" /></view>
      <view class="ai-field"><text>接口地址</text><input v-model="aiDraft.baseUrl" class="ai-input" placeholder="https://api.xiaomimimo.com/v1" aria-label="大模型接口地址" /></view>
      <view class="ai-field"><text>文本模型（搭配点评）</text><input v-model="aiDraft.model" class="ai-input" placeholder="mimo-v2.5-pro" aria-label="文本大模型名称" /></view>
      <view class="ai-field"><text>识图模型（识别衣物）</text><input v-model="aiDraft.visionModel" class="ai-input" placeholder="mimo-v2.5" aria-label="识图大模型名称" /></view>
    </view>

    <view class="privacy-note"><text>本地优先</text><text>密钥只保存在当前设备；关闭开关后不会请求 AI 服务。</text></view>
    <view class="ai-actions"><button class="primary-button" @tap="saveAi">保存</button><button class="ai-test" :disabled="aiTesting" @tap="testAi">{{ aiTesting ? '测试中…' : '测试连接' }}</button></view>
  </scroll-view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;
.ai-page { height:100vh; box-sizing:border-box; padding-bottom:60rpx; background:$pearl; }
.block { display:block; margin-bottom:8rpx; }
.lead { display:block; margin-bottom:26rpx; color:$muted; font-size:$text-body; }
.ai-card { padding:24rpx; border:1rpx solid $line; border-radius:var(--theme-radius-card,28rpx); background:$surface-elevated; box-shadow:$shadow; }
.ai-toggle { display:flex; align-items:center; justify-content:space-between; gap:20rpx; min-height:96rpx; padding-bottom:22rpx; border-bottom:1rpx solid $line; }
.ai-toggle view { min-width:0; }.ai-toggle text { display:block; }.ai-toggle text:first-child { color:$ink; font-size:$text-body-large; font-weight:760; }.ai-toggle text:last-child { margin-top:5rpx; color:$muted; font-size:$text-caption; }.ai-toggle switch { flex:0 0 auto; transform:scale(.86); }
.ai-field { display:flex; flex-direction:column; gap:10rpx; margin-top:22rpx; }.ai-field>text { color:$muted; font-size:$text-label; font-weight:720; }.ai-input { box-sizing:border-box; width:100%; height:92rpx; padding:0 22rpx; border:1rpx solid $line; border-radius:var(--theme-radius-control,18rpx); background:#fff; color:$ink; font-size:$text-body; }
.privacy-note { margin-top:20rpx; padding:22rpx 24rpx; border-radius:var(--theme-radius-control,22rpx); background:var(--theme-tint); }.privacy-note text { display:block; }.privacy-note text:first-child { color:var(--theme-accent-deep); font-size:$text-label; font-weight:800; }.privacy-note text:last-child { margin-top:7rpx; color:$muted; font-size:$text-caption; line-height:1.55; }
.ai-actions { display:grid; grid-template-columns:1.25fr 1fr; gap:14rpx; margin-top:24rpx; }.ai-actions .primary-button { width:100%; margin:0; }.ai-test { min-height:92rpx; margin:0; border:1rpx solid $line; border-radius:999rpx; background:$surface-elevated; color:var(--theme-accent-deep); font-size:$text-body; font-weight:750; }.ai-test[disabled] { opacity:.5; }
</style>
