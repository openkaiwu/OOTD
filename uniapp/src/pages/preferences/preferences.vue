<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { COLORS, SCENES, STYLES, STYLE_NAMES } from "@/domain/constants";
import { useSettingsStore } from "@/stores/settings";
import type { UserPreference } from "@/domain/types";
import { useAppTheme } from "@/composables/useAppTheme";

const store = useSettingsStore(); const form = ref<UserPreference>({} as UserPreference);
const { themeClass } = useAppTheme();
onLoad(() => { store.hydrate(); form.value = JSON.parse(JSON.stringify(store.preferences)); });
function toggle(key: "styleIds" | "sceneIds" | "preferredColorIds" | "avoidedColorIds", value: string, max: number): void { const list = form.value[key]; form.value[key] = list.includes(value) ? list.filter((item) => item !== value) : [...list, value].slice(-max); }
function setBoolean(key: "rotateUnderused" | "allowIncomplete", event: Event): void { form.value[key] = Boolean((event as unknown as { detail: { value: boolean } }).detail.value); }
function save(): void { store.savePreferences(form.value); uni.showToast({ title: "偏好已保存", icon: "success" }); setTimeout(() => uni.navigateBack(), 350); }
</script>

<template>
  <view v-if="form.schemaVersion" :class="['inner-page','preference-page',themeClass]">
    <text class="eyebrow">YOUR PREFERENCES</text><text class="section-title block">让推荐更懂你</text>
    <text class="field-label">喜欢的风格 · 已选 {{ form.styleIds.length }}/5</text><view class="option-grid"><button v-for="style in STYLES" :key="style" :class="{ active: form.styleIds.includes(style) }" :aria-pressed="form.styleIds.includes(style)" @tap="toggle('styleIds',style,5)">{{ STYLE_NAMES[style] }}</button></view>
    <text class="field-label">常用场景 · 已选 {{ form.sceneIds.length }}/5</text><view class="scene-grid"><button v-for="scene in SCENES" :key="scene.id" :class="{ active: form.sceneIds.includes(scene.id) }" :aria-pressed="form.sceneIds.includes(scene.id)" @tap="toggle('sceneIds',scene.id,5)">{{ scene.name }}</button></view>
    <text class="field-label">喜欢的颜色</text><scroll-view scroll-x><view class="chip-row"><button v-for="color in COLORS" :key="color.id" class="chip" :class="{ active: form.preferredColorIds.includes(color.name) }" :aria-pressed="form.preferredColorIds.includes(color.name)" @tap="toggle('preferredColorIds',color.name,5)">{{ color.name }}</button></view></scroll-view>
    <text class="field-label">尽量避开的颜色</text><scroll-view scroll-x><view class="chip-row"><button v-for="color in COLORS" :key="color.id" class="chip" :class="{ active: form.avoidedColorIds.includes(color.name) }" :aria-pressed="form.avoidedColorIds.includes(color.name)" @tap="toggle('avoidedColorIds',color.name,5)">{{ color.name }}</button></view></scroll-view>
    <view class="switch-row"><view><text>优先轮换很久没穿的单品</text><text>帮助提升衣橱利用率</text></view><switch :checked="form.rotateUnderused" color="#7754D6" @change="setBoolean('rotateUnderused', $event)" /></view>
    <view class="switch-row"><view><text>允许生成不完整方案</text><text>缺少鞋或外套时仍给出建议</text></view><switch :checked="form.allowIncomplete" color="#7754D6" @change="setBoolean('allowIncomplete', $event)" /></view>
    <button class="primary-button save" @tap="save">保存偏好</button>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;
.block { display:block; margin-bottom:22rpx; }
.option-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12rpx; }
.option-grid button,.scene-grid button { min-height:88rpx; margin:0; padding:0 8rpx; border:1rpx solid $line; border-radius:18rpx; background:#fff; color:$muted; font-size:21rpx; line-height:1.25; }
.option-grid button.active,.scene-grid button.active { @include selected-control; }
.scene-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12rpx; }
.switch-row { @include card; display:flex; align-items:center; justify-content:space-between; margin-top:18rpx; padding:24rpx; }
.switch-row view { flex:1; padding-right:18rpx; }
.switch-row text { display:block; }
.switch-row text:first-child { color:$ink; font-size:25rpx; font-weight:750; }
.switch-row text:last-child { margin-top:6rpx; color:$muted; font-size:20rpx; }
.save { width:100%; margin:30rpx 0 10rpx; }
</style>
