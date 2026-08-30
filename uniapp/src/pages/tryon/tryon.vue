<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { renderTryOn } from "@/infrastructure/tryon";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useAppTheme } from "@/composables/useAppTheme";
import type { Garment } from "@/domain/types";

const store = useWardrobeStore();
const { themeClass } = useAppTheme();
const rendered = ref("");
const rendering = ref(true);
const saving = ref(false);
const errorText = ref("");
const itemsText = ref("");

onLoad((options) => {
  store.hydrate();
  const ids = String(options?.ids || "").split(",").map((id) => id.trim()).filter(Boolean);
  const garments = ids
    .map((id) => store.garments.find((garment) => garment.id === id))
    .filter((garment): garment is Garment => Boolean(garment));
  if (!garments.length) {
    errorText.value = "没有找到这套穿搭的衣物，请返回重试";
    rendering.value = false;
    return;
  }
  itemsText.value = garments.map((garment) => garment.name).join("、");
  void (async () => {
    try {
      const url = await renderTryOn(garments);
      if (url) rendered.value = url;
      else errorText.value = "生成失败，请检查衣物图片是否完整";
    } catch {
      errorText.value = "生成失败，请重试";
    } finally {
      rendering.value = false;
    }
  })();
});

function goBack(): void { uni.navigateBack(); }

function save(): void {
  if (!rendered.value || saving.value) return;
  saving.value = true;
  try {
    const base64 = rendered.value.includes(",") ? rendered.value.slice(rendered.value.indexOf(",") + 1) : rendered.value;
    const bridge = (window as unknown as { OOTDNative?: { saveImageToGallery?: (base64: string) => boolean } }).OOTDNative;
    if (bridge && typeof bridge.saveImageToGallery === "function") {
      const ok = bridge.saveImageToGallery(base64);
      uni.showToast({ title: ok ? "已保存到相册" : "保存失败，请重试", icon: "none" });
    } else {
      uni.showToast({ title: "当前环境不支持保存到相册", icon: "none" });
    }
  } catch {
    uni.showToast({ title: "保存失败，请重试", icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view :class="['inner-page','tryon-page',themeClass]">
    <view class="head">
      <text class="eyebrow">VIRTUAL TRY-ON</text>
      <text class="title">虚拟试穿</text>
      <text class="subtitle">{{ itemsText }}</text>
    </view>
    <view class="stage">
      <image v-if="rendered" class="tryon-image" :src="rendered" mode="aspectFit" />
      <view v-else class="placeholder">
        <text v-if="rendering">正在生成试穿效果…</text>
        <text v-else>{{ errorText || '暂无试穿效果' }}</text>
      </view>
    </view>
    <view class="actions">
      <button class="primary-button" :disabled="!rendered || saving" @tap="save">保存到相册</button>
      <button class="secondary-button" @tap="goBack">返回</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;
.tryon-page { padding-bottom:calc(40rpx + env(safe-area-inset-bottom)); }
.head { margin-bottom:20rpx; }
.eyebrow { display:block; margin-bottom:6rpx; color:$lilac-deep; font-size:19rpx; font-weight:800; letter-spacing:2rpx; }
.title { display:block; color:$ink; font-size:38rpx; font-weight:850; }
.subtitle { display:block; margin-top:8rpx; color:$muted; font-size:22rpx; line-height:1.5; }
.stage { position:relative; display:flex; align-items:center; justify-content:center; min-height:760rpx; overflow:hidden; border-radius:32rpx; background:linear-gradient(180deg,#fdf9fb,#f2eaf3); }
.tryon-image { width:100%; height:760rpx; }
.placeholder { display:flex; align-items:center; justify-content:center; min-height:760rpx; padding:0 40rpx; color:$muted; font-size:24rpx; text-align:center; }
.actions { display:grid; grid-template-columns:1.4fr 1fr; gap:14rpx; margin-top:22rpx; }
.actions button { width:100%; margin:0; }
</style>
