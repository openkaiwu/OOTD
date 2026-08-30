<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import AppHeader from "@/components/AppHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import OutfitCard from "@/components/OutfitCard.vue";
import { calculateStats } from "@/domain/stats";
import { COLORS } from "@/domain/constants";
import { wardrobeReadiness } from "@/domain/recommendation";
import { INSPIRATION_FILTERS, listInspirationOptions, resolveInspirationPreset, type InspirationFilterType, type InspirationOption } from "@/domain/inspirations";
import { useAppTheme } from "@/composables/useAppTheme";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useOutfitStore } from "@/stores/outfits";
import { useWeatherStore } from "@/stores/weather";

const wardrobe=useWardrobeStore();const outfits=useOutfitStore();const weather=useWeatherStore();const{themeClass}=useAppTheme();
const viewMode=ref<"inspiration"|"history">("inspiration");const historySegment=ref<"recent"|"saved"|"worn">("recent");
const historyManage=ref(false);const selectedHistoryIds=ref<string[]>([]);
const query=ref("");const filterType=ref<InspirationFilterType>("all");const selected=ref<InspirationOption | null>(null);const useWeatherRecommendation=ref(false);
onShow(()=>{
  wardrobe.hydrate();outfits.hydrate();
  const requested=uni.getStorageSync("outfit_view_mode_v1");if(requested==="inspiration"||requested==="history")viewMode.value=requested;uni.removeStorageSync("outfit_view_mode_v1");
  const requestedSegment=uni.getStorageSync("outfit_history_segment_v1");if(requestedSegment==="recent"||requestedSegment==="saved"||requestedSegment==="worn")historySegment.value=requestedSegment;uni.removeStorageSync("outfit_history_segment_v1");
  const draft=uni.getStorageSync("ootd_inspiration_draft_v1") as Partial<{sceneId:string;useWeather:boolean}> | null;
  if(draft?.sceneId){
    filterType.value="scene";
    selected.value=listInspirationOptions("scene").find((item)=>resolveInspirationPreset(item.type,item.id).preset.sceneId===draft.sceneId) || null;
    useWeatherRecommendation.value=Boolean(draft.useWeather);
    viewMode.value="inspiration";
    uni.removeStorageSync("ootd_inspiration_draft_v1");
  }else if(!selected.value){ useWeatherRecommendation.value=Boolean(weather.weather)&&!weather.stale; }
});
const stats=computed(()=>calculateStats(wardrobe.garments,outfits.outfits));
const options=computed(()=>listInspirationOptions(filterType.value,query.value));
const historyList=computed(()=>historySegment.value==="saved"?outfits.saved:historySegment.value==="worn"?outfits.outfits.filter((item)=>item.wornAtList.length).sort((a,b)=>Math.max(...b.wornAtList)-Math.max(...a.wornAtList)):outfits.outfits.slice(0,8));
function chooseFilter(id:InspirationFilterType):void{filterType.value=id;}
function generate():void{
  const option=selected.value;if(!option){uni.showToast({title:"先选择一个灵感",icon:"none"});return;}
  const target=resolveInspirationPreset(option.type,option.id);
  const readiness=wardrobeReadiness(wardrobe.activeGarments);if(readiness==="empty"||readiness==="insufficient"){uni.showModal({title:"衣橱还不完整",content:"先添加上装和下装，或一件连衣裙。",confirmText:"去添加",success:(result)=>result.confirm&&uni.navigateTo({url:"/pages/add/add?entry=inspiration"})});return;}
  const useWeather=useWeatherRecommendation.value&&Boolean(weather.weather)&&!weather.stale;
  const colorIds=target.preferredColorId?[target.preferredColorId]:target.preset.colorIds;
  const preferredColors=colorIds.map((id)=>COLORS.find((item)=>item.id===id)?.name).filter((item):item is string=>Boolean(item));
  const context=encodeURIComponent(JSON.stringify({sceneId:target.preset.sceneId,inspirationPresetId:target.preset.id,styleIds:target.preset.styleIds,preferredColors,avoidedColors:[],pinnedItemId:"",useWeather}));
  uni.navigateTo({url:`/pages/result/result?context=${context}`});
}
function toggleWeather(event: Event):void{useWeatherRecommendation.value=Boolean((event as unknown as {detail:{value:boolean}}).detail.value);}
function openWeather():void{uni.navigateTo({url:"/pages/weather/weather"});}
function setHistorySegment(id:string):void{if(id==="recent"||id==="saved"||id==="worn"){historySegment.value=id;selectedHistoryIds.value=[];}}
function toggleHistoryManage():void{historyManage.value=!historyManage.value;selectedHistoryIds.value=[];}
function toggleHistorySelection(id:string):void{selectedHistoryIds.value=selectedHistoryIds.value.includes(id)?selectedHistoryIds.value.filter((value)=>value!==id):[...selectedHistoryIds.value,id];}
function confirmRemoveSelected():void{
  const count=selectedHistoryIds.value.length;if(!count)return;
  uni.showModal({
    title:`删除 ${count} 条记录？`,
    content:"删除后无法恢复，请确认。",
    cancelText:"否",
    confirmText:"是",
    confirmColor:"#BF4058",
    success:(result)=>{
      if(!result.confirm)return;
      selectedHistoryIds.value.forEach((id)=>outfits.remove(id));
      selectedHistoryIds.value=[];historyManage.value=false;
      uni.showToast({title:"已删除",icon:"none"});
    },
  });
}
</script>

<template>
  <scroll-view :class="['page-shell','outfits-page',themeClass]" scroll-y>
    <AppHeader title="穿搭灵感" />
    <view class="mode-tabs" role="tablist"><button :class="{active:viewMode==='inspiration'}" :aria-selected="viewMode==='inspiration'" @tap="viewMode='inspiration'">找灵感</button><button :class="{active:viewMode==='history'}" :aria-selected="viewMode==='history'" @tap="viewMode='history'">穿搭记录</button></view>

    <template v-if="viewMode==='inspiration'">
      <view class="search"><text>⌕</text><input v-model="query" aria-label="搜索穿搭灵感" placeholder="输入灵感，如逛街、日常、简约…" /></view>
      <scroll-view class="filter-scroll" scroll-x><view class="filters"><button v-for="item in INSPIRATION_FILTERS" :key="item.id" :class="{active:filterType===item.id}" :aria-pressed="filterType===item.id" @tap="chooseFilter(item.id)"><text>{{ item.icon }}</text>{{ item.name }}</button></view></scroll-view>
      <view class="weather-recommendation">
        <view><text>结合天气推荐</text><text>{{ weather.weather && !weather.stale ? `${weather.weather.city} · ${weather.weather.temp}°` : '暂无可用天气' }}</text></view>
        <button class="weather-link" @tap="openWeather">查看天气</button>
        <switch :checked="useWeatherRecommendation" color="#8C6BE8" @change="toggleWeather" />
      </view>
      <view v-if="options.length" class="inspiration-grid">
        <button v-for="item in options" :key="item.key" :class="{active:selected&&selected.key===item.key}" :aria-label="`${item.name}，${item.hint}${selected&&selected.key===item.key?'，已选择':''}`" :aria-pressed="Boolean(selected&&selected.key===item.key)" @tap="selected=selected&&selected.key===item.key?null:item"><text class="scene-icon">{{ item.icon }}</text><text>{{ item.name }}</text><text v-if="item.hint">{{ item.hint }}</text><view v-if="item.hex" class="color-strip" :style="{background:item.hex}" /><text v-if="selected&&selected.key===item.key" class="selected">✓ 已选</text></button>
      </view>
      <EmptyState v-else title="没有找到匹配的灵感" description="换个关键词试试。" />
      <view class="sticky-generate"><button class="primary-button" :disabled="!selected" @tap="generate">{{ selected ? `按${selected.name}开始推荐` : '选择灵感后开始推荐' }}</button></view>
    </template>

    <template v-else>
      <view class="stats" aria-label="穿搭统计"><view><text>{{ stats.weeklyWorn }}</text><text>本周已穿</text></view><view><text>{{ stats.utilization===null?'—':`${stats.utilization}%` }}</text><text>利用率</text></view><view><text>{{ stats.satisfaction===null?'—':`${stats.satisfaction}%` }}</text><text>满意度</text></view></view>
      <view class="segments" role="tablist"><button v-for="item in [{id:'recent',name:`最近 ${stats.generatedOutfits}`},{id:'saved',name:`保存 ${stats.savedOutfits}`},{id:'worn',name:`已穿 ${stats.wornOutfits}`}]" :key="item.id" :class="{active:historySegment===item.id}" :aria-selected="historySegment===item.id" @tap="setHistorySegment(item.id)">{{ item.name }}</button></view>
      <view class="history-toolbar"><text>{{ historyManage ? `已选 ${selectedHistoryIds.length} 条` : '按分类查看历史穿搭' }}</text><button :class="{ active: historyManage }" @tap="toggleHistoryManage">{{ historyManage ? '完成' : '管理记录' }}</button></view>
      <EmptyState v-if="!historyList.length" title="暂无记录" description="选择场景生成穿搭。" action="找灵感" @action="viewMode='inspiration'" />
      <view v-else class="outfit-list"><OutfitCard v-for="(outfit,index) in historyList" :key="outfit.id" :outfit="outfit" :garments="wardrobe.garments" :index="index" :selectable="historyManage" :selected="selectedHistoryIds.includes(outfit.id)" @select="toggleHistorySelection(outfit.id)" /></view>
      <view v-if="historyManage && selectedHistoryIds.length" class="history-batch"><text>已选择 {{ selectedHistoryIds.length }} 条记录</text><button @tap="confirmRemoveSelected">批量删除</button></view>
    </template>
  </scroll-view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;.outfits-page{height:100vh;box-sizing:border-box;background:$pearl;padding-bottom:190rpx}.mode-tabs{display:grid;grid-template-columns:1fr 1fr;margin-bottom:22rpx;padding:6rpx;border-radius:22rpx;background:$line}.mode-tabs button{min-height:88rpx;margin:0;border:0;border-radius:18rpx;background:transparent;color:$muted;font-size:24rpx}.mode-tabs button.active{background:$surface-solid;color:$ink;font-weight:800;box-shadow:$shadow}.search{display:grid;grid-template-columns:48rpx 1fr;align-items:center;height:92rpx;padding:0 22rpx;border-radius:999rpx;background:$surface-solid;color:$muted}.search>text{font-size:34rpx}.search input{height:92rpx;color:$ink;font-size:25rpx}.filter-scroll{width:100%;margin:20rpx 0 8rpx;white-space:nowrap}.filters,.subfilters{display:flex;gap:12rpx}.filters button,.subfilters button{flex:0 0 auto;min-height:88rpx;margin:0;padding:0 24rpx;border:1rpx solid $line;border-radius:999rpx;background:$surface-solid;color:$muted;font-size:22rpx}.filters button text{margin-right:7rpx}.filters button.active,.subfilters button.active{border-color:$lilac;background:$lilac-soft;color:$focus;font-weight:750;box-shadow:inset 0 0 0 2rpx var(--theme-focus-ring-soft)}.inspiration-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16rpx;margin-top:18rpx}.inspiration-grid button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:214rpx;margin:0;padding:22rpx 12rpx;border:2rpx solid transparent;border-radius:27rpx;background:$surface-solid;box-shadow:$shadow;text-align:center}.inspiration-grid button.active{border-color:$lilac-deep;background:$lilac-soft}.scene-icon{font-size:52rpx}.inspiration-grid button>text:nth-child(2){margin-top:12rpx;color:$ink;font-size:27rpx;font-weight:800}.inspiration-grid button>text:nth-child(3){margin-top:5rpx;color:$muted;font-size:20rpx}.color-strip{width:84rpx;height:8rpx;border-radius:999rpx;margin-top:12rpx}.selected{position:absolute;top:12rpx;right:12rpx;min-height:40rpx;padding:0 12rpx;border-radius:999rpx;background:$lilac-deep;color:#fff;font-size:17rpx;line-height:40rpx}.sticky-generate{position:fixed;z-index:8;right:0;bottom:calc(100rpx + env(safe-area-inset-bottom));left:0;padding:14rpx 28rpx;border-top:1rpx solid $line;background:$surface-alpha;box-shadow:0 -10rpx 28rpx rgba(0,0,0,.06)}.sticky-generate button{width:100%;margin:0}.sticky-generate button[disabled]{box-shadow:none;opacity:.55}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx;margin:16rpx 0 22rpx}.stats view{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:120rpx;border:1rpx solid $line;border-radius:22rpx;background:$surface-solid}.stats text:first-child{color:$ink;font-size:30rpx;font-weight:850}.stats text:last-child{margin-top:6rpx;color:$muted;font-size:19rpx}.segments{display:grid;grid-template-columns:repeat(3,1fr);padding:6rpx;border-radius:22rpx;background:$line}.segments button{min-height:88rpx;margin:0;border:0;border-radius:18rpx;background:transparent;color:$muted;font-size:21rpx}.segments button.active{background:$surface-solid;color:$focus;font-weight:750}.outfit-list{display:flex;flex-direction:column;gap:20rpx;padding-bottom:36rpx}@media(max-width:370px){.inspiration-grid button{min-height:194rpx}.filters button{padding:0 19rpx}}
/* Typography and spacing pass: a readable hierarchy on compact Android phones. */
.mode-tabs { margin-bottom:$space-4; padding:$space-1; }
.mode-tabs button { min-height:92rpx; font-size:$text-label; }
.search { height:96rpx; padding:0 $space-4; }
.search input { height:96rpx; font-size:$text-body; }
.filter-scroll { margin:$space-4 0 $space-1; }
.filters,.subfilters { gap:$space-2; }
.filters button,.subfilters button { min-height:92rpx; padding:0 $space-4; font-size:$text-caption; }
.inspiration-grid { gap:$space-3; margin-top:$space-4; }
.inspiration-grid button { min-height:232rpx; padding:$space-4 $space-2; }
.inspiration-grid button>text:nth-child(2) { margin-top:$space-2; font-size:$text-body-large; }
.inspiration-grid button>text:nth-child(3) { margin-top:$space-1; font-size:$text-caption; }
.selected { top:$space-2; right:$space-2; min-height:44rpx; font-size:20rpx; line-height:44rpx; }
.sticky-generate { padding:$space-3 $space-5; }
.stats { gap:$space-2; margin:$space-3 0 $space-4; }
.stats view { min-height:128rpx; }
.stats text:first-child { font-size:32rpx; }
.stats text:last-child { font-size:$text-caption; }
.segments button { min-height:92rpx; font-size:$text-caption; }
.outfit-list { gap:$space-4; padding-bottom:$space-6; }
/* Compact discovery controls: keep the page task-focused like the wardrobe. */
.outfits-page { padding-top:calc(var(--status-bar-height) + 20rpx); }
.outfits-page :deep(.app-header) { min-height:64rpx; margin-bottom:16rpx; }
.outfits-page :deep(.page-title) { font-size:34rpx; }
.mode-tabs { margin-bottom:12rpx; padding:4rpx; }
.mode-tabs button { min-height:64rpx; font-size:22rpx; }
.search { height:80rpx; padding:0 20rpx; }
.search input { height:80rpx; font-size:$text-label; }
.filter-scroll { margin:12rpx 0 2rpx; }
.filters,.subfilters { gap:10rpx; }
.filters button,.subfilters button { min-height:68rpx; padding:0 18rpx; font-size:22rpx; }
.weather-recommendation{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:16rpx;margin:14rpx 0 4rpx;padding:18rpx 20rpx;border:1rpx solid $line;border-radius:20rpx;background:$surface-solid}.weather-recommendation>view{display:flex;flex-direction:column;min-width:0}.weather-recommendation text:first-child{color:$ink;font-size:24rpx;font-weight:750}.weather-recommendation text:last-child{margin-top:3rpx;color:$muted;font-size:19rpx}.weather-link{min-height:52rpx;margin:0;padding:0 12rpx;border:0;background:transparent;color:$focus;font-size:19rpx;white-space:nowrap}.weather-recommendation switch{transform:scale(.82);transform-origin:right center}
.history-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16rpx;margin:14rpx 0 18rpx}.history-toolbar>text{color:$muted;font-size:20rpx}.history-toolbar button{min-height:64rpx;margin:0;padding:0 20rpx;border:1rpx solid $line;border-radius:999rpx;background:$surface-solid;color:$focus;font-size:21rpx;line-height:64rpx}.history-toolbar button.active{border-color:$lilac-deep;background:$lilac-soft}.history-batch{position:fixed;z-index:12;right:0;bottom:calc(100rpx + env(safe-area-inset-bottom));left:0;display:flex;align-items:center;justify-content:space-between;gap:18rpx;padding:16rpx 28rpx;border-top:1rpx solid $line;background:rgba(255,255,255,.97);box-shadow:0 -12rpx 30rpx rgba(90,60,75,.09)}.history-batch text{color:$muted;font-size:21rpx}.history-batch button{min-width:188rpx;min-height:80rpx;margin:0;border:0;border-radius:22rpx;background:$danger;color:#fff;font-size:24rpx;font-weight:750}
</style>
