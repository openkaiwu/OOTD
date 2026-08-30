<script setup lang="ts">
import { computed, ref } from "vue";
import { onBackPress, onShow } from "@dcloudio/uni-app";
import AppHeader from "@/components/AppHeader.vue";
import { calculateStats } from "@/domain/stats";
import { clearAllLocalData } from "@/infrastructure/clear-data";
import { THEME_OPTIONS, currentThemeOption, useAppTheme } from "@/composables/useAppTheme";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useOutfitStore } from "@/stores/outfits";
import { useSettingsStore } from "@/stores/settings";
import { formatMessage, useI18n, type AppLanguage } from "@/i18n";

const wardrobe = useWardrobeStore();
const outfits = useOutfitStore();
const settings = useSettingsStore();
const { themeClass, themeId, setTheme } = useAppTheme();
const { language, languageOption, languages, setLanguage, t } = useI18n();
const themeOpen = ref(false);
const languageOpen = ref(false);
const tutorialOpen = ref(false);
const tutorialIndex = ref(0);

onShow(() => { wardrobe.hydrate(); outfits.hydrate(); settings.hydrate(); });
onBackPress(() => {
  if (themeOpen.value) { themeOpen.value = false; return true; }
  if (languageOpen.value) { languageOpen.value = false; return true; }
  if (tutorialOpen.value) { tutorialOpen.value = false; return true; }
  return false;
});

const stats = computed(() => calculateStats(wardrobe.garments, outfits.outfits));
const themeOption = computed(() => currentThemeOption(themeId.value));
const tutorialSteps = [
  { icon: "📷", title: "添加衣物", text: "拍照或从相册导入" },
  { icon: "✦", title: "选择场景", text: "快速生成三套搭配" },
  { icon: "♡", title: "记录反馈", text: "保存、已穿与喜好" },
];

function go(path: string): void { uni.navigateTo({ url: path }); }
function openTab(path: string, mode?: "inspiration" | "history"): void {
  if (mode) uni.setStorageSync("outfit_view_mode_v1", mode);
  uni.switchTab({ url: path });
}
function openCloset(favoritesOnly = false): void {
  if (favoritesOnly) uni.setStorageSync("wardrobe_filter_favorites_v1", true);
  uni.switchTab({ url: "/pages/wardrobe/wardrobe" });
}
function openSavedOutfits(): void {
  uni.setStorageSync("outfit_view_mode_v1", "history");
  uni.setStorageSync("outfit_history_segment_v1", "saved");
  uni.switchTab({ url: "/pages/outfits/outfits" });
}
function openTutorial(): void { tutorialIndex.value = 0; tutorialOpen.value = true; }
function finishTutorial(): void { settings.markTutorialSeen(); tutorialOpen.value = false; }
function chooseTheme(id: (typeof THEME_OPTIONS)[number]["id"]): void { setTheme(id); }
function chooseLanguage(id: AppLanguage): void {
  setLanguage(id);
  setTimeout(() => { languageOpen.value = false; }, 120);
}

function clearAll(): void {
  uni.showModal({
    title: t("确认清空"),
    content: formatMessage("将删除 {items} 件衣物和 {outfits} 套穿搭。", { items: stats.value.total, outfits: stats.value.generatedOutfits }),
    cancelText: t("否"),
    confirmText: t("是"),
    confirmColor: "#BF4058",
    success: (result) => {
      if (!result.confirm) return;
      clearAllLocalData(); wardrobe.hydrate(); outfits.hydrate(); settings.hydrate();
      uni.showToast({ title: t("已清空"), icon: "none" });
    },
  });
}
</script>

<template>
  <scroll-view :class="['page-shell', 'profile-page', themeClass]" scroll-y>
    <AppHeader title="个人中心" />
    <view class="identity"><view class="avatar"><image src="/static/avatar.png" mode="aspectFit" /></view><text>OOTD 明天穿什么</text></view>
    <view class="stats-grid" aria-label="衣橱概览">
      <button aria-label="查看全部单品" @tap="openCloset()"><text>{{ stats.total }}</text><text>总单品</text></button>
      <button aria-label="查看收藏单品" @tap="openCloset(true)"><text>{{ stats.favorites }}</text><text>收藏单品</text></button>
      <button aria-label="查看保存穿搭" @tap="openSavedOutfits"><text>{{ stats.savedOutfits }}</text><text>保存穿搭</text></button>
    </view>

    <view class="menu-card">
      <button aria-label="查看使用教程" @tap="openTutorial"><text class="menu-icon mint">✨</text><view><text>动画演示</text></view><text class="arrow">›</text></button>
      <button aria-label="添加单品" @tap="go('/pages/add/add?entry=profile')"><text class="menu-icon warm">📷</text><view><text>添加单品</text></view><text class="arrow">›</text></button>
      <button aria-label="打开我的衣橱" @tap="openTab('/pages/wardrobe/wardrobe')"><text class="menu-icon pink">👗</text><view><text>我的衣橱</text></view><text class="arrow">›</text></button>
      <button aria-label="打开穿搭灵感" @tap="openTab('/pages/outfits/outfits','inspiration')"><text class="menu-icon lilac">✦</text><view><text>穿搭灵感</text></view><text class="arrow">›</text></button>
      <button aria-label="查看衣橱缺口建议" @tap="go('/pages/wardrobe-gaps/wardrobe-gaps')"><text class="menu-icon peach">🛍</text><view><text>穿搭好物</text></view><text class="arrow">›</text></button>
      <button aria-label="查看穿搭记录" @tap="openTab('/pages/outfits/outfits','history')"><text class="menu-icon blue">♡</text><view><text>穿搭记录</text></view><text class="arrow">›</text></button>
    </view>

    <view class="menu-card secondary">
      <button aria-label="打开数据存储" @tap="go('/pages/data/data')"><text class="menu-icon blue">▣</text><view><text>数据存储</text></view><text class="menu-value">{{ wardrobe.activeGarments.length }}件</text><text class="arrow">›</text></button>
      <button aria-label="打开主题设置" @tap="themeOpen = true"><text class="menu-icon lilac">🎨</text><view><text>主题设置</text></view><text class="menu-value">{{ themeOption.name }}</text><text class="arrow">›</text></button>
      <button aria-label="打开语言设置" @tap="languageOpen = true"><text class="menu-icon mint">文</text><view><text>语言设置</text></view><text class="menu-value" data-no-i18n>{{ languageOption.nativeName }}</text><text class="arrow">›</text></button>
      <button aria-label="配置 AI 助手" @tap="go('/pages/ai/ai')"><text class="menu-icon blue">✦</text><view><text>AI 助手</text></view><text class="menu-value">{{ settings.llm.enabled ? '已开启' : '未开启' }}</text><text class="arrow">›</text></button>
      <button aria-label="打开意见反馈" @tap="go('/pages/feedback/feedback')"><text class="menu-icon mint">💬</text><view><text>意见反馈</text></view><text class="arrow">›</text></button>
      <button aria-label="查看关于" @tap="go('/pages/about/about')"><text class="menu-icon warm">i</text><view><text>关于</text></view><text class="arrow">›</text></button>
    </view>

    <view v-if="languageOpen" class="overlay" @tap="languageOpen = false" />
    <view v-if="languageOpen" class="bottom-sheet settings-sheet language-sheet" role="dialog" aria-label="语言设置">
      <view class="sheet-handle" />
      <view class="sheet-head"><view><text>语言设置</text><text class="sheet-subtitle">切换后立即应用到整个应用</text></view><button aria-label="关闭语言设置" @tap="languageOpen = false">×</button></view>
      <scroll-view class="language-scroll" scroll-y :enhanced="true" :show-scrollbar="false"><view>
        <button v-for="item in languages" :key="item.id" class="language-option" :class="{ active: language === item.id }" :aria-pressed="language === item.id" @tap="chooseLanguage(item.id)">
          <text class="language-mark" data-no-i18n>{{ item.shortName }}</text>
          <text class="language-name" data-no-i18n>{{ item.nativeName }}</text>
          <text class="language-check">{{ language === item.id ? '✓' : '' }}</text>
        </button>
      </view></scroll-view>
    </view>
    <button class="clear-row" aria-label="清空全部本地数据" @tap="clearAll"><text>⌫</text><text>清空数据</text><text>›</text></button>

    <view v-if="themeOpen" class="overlay" @tap="themeOpen = false" />
    <view v-if="themeOpen" class="bottom-sheet settings-sheet theme-sheet" role="dialog" aria-label="主题设置">
      <view class="sheet-handle" /><view class="sheet-head"><text>主题设置</text><button aria-label="关闭主题设置" @tap="themeOpen = false">×</button></view>
      <scroll-view class="theme-scroll" scroll-y :enhanced="true" :show-scrollbar="false"><view>
        <button v-for="item in THEME_OPTIONS" :key="item.id" class="theme-option" :class="{ active: themeId === item.id }" :aria-pressed="themeId === item.id" @tap="chooseTheme(item.id)">
          <view class="theme-preview" :style="{ background: item.surface }"><text :style="{ background: item.accent }" /><text /></view><view><text>{{ item.name }}</text><text>{{ item.description }}</text></view><text class="check">{{ themeId === item.id ? '✓' : '' }}</text>
        </button>
      </view></scroll-view>
    </view>

    <view v-if="tutorialOpen" class="overlay tutorial-overlay" @tap="finishTutorial" />
    <view v-if="tutorialOpen" class="tutorial" role="dialog" aria-label="使用教程">
      <button class="tutorial-close" aria-label="关闭教程" @tap="finishTutorial">×</button><text class="tutorial-icon">{{ tutorialSteps[tutorialIndex].icon }}</text><text>{{ tutorialSteps[tutorialIndex].title }}</text><text>{{ tutorialSteps[tutorialIndex].text }}</text>
      <view class="dots"><text v-for="(_, index) in tutorialSteps" :key="index" :class="{ active: index === tutorialIndex }" /></view>
      <button class="primary-button" @tap="tutorialIndex < tutorialSteps.length - 1 ? tutorialIndex++ : finishTutorial()">{{ tutorialIndex < tutorialSteps.length - 1 ? '下一步' : '完成' }}</button>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;
.profile-page{height:100vh;box-sizing:border-box;background:$pearl}.identity{display:flex;flex-direction:column;align-items:center;margin:0 -28rpx;padding:24rpx 28rpx 32rpx;background:linear-gradient(145deg,$lilac-soft,$blush-soft);text-align:center}.avatar{display:flex;align-items:center;justify-content:center;width:124rpx;height:124rpx;border-radius:999rpx;background:linear-gradient(145deg,#fffde8,$blush);box-shadow:$shadow}.avatar image{width:86rpx;height:86rpx}.identity>text:nth-child(2){margin-top:20rpx;color:$ink;font-size:34rpx;font-weight:800}.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);margin:18rpx 0 22rpx;overflow:hidden;border:1rpx solid $line;border-radius:26rpx;background:$surface-solid;box-shadow:$shadow}.stats-grid button{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:126rpx;margin:0;padding:0;border:0;border-right:1rpx solid $line;border-radius:0;background:transparent}.stats-grid button:last-child{border-right:0}.stats-grid text:first-child{color:$lilac-strong;font-size:37rpx;font-weight:800}.stats-grid text:last-child{margin-top:4rpx;color:$muted;font-size:20rpx}.menu-card{overflow:hidden;border:1rpx solid $line;border-radius:28rpx;background:$surface-solid;box-shadow:$shadow}.menu-card.secondary{margin-top:20rpx}.menu-card button{display:grid;grid-template-columns:68rpx minmax(0,1fr) auto 24rpx;align-items:center;gap:13rpx;width:100%;min-height:104rpx;margin:0;padding:14rpx 20rpx;border-bottom:1rpx solid $line;border-radius:0;background:transparent;text-align:left}.menu-card button:last-child{border-bottom:0}.menu-icon{display:flex;align-items:center;justify-content:center;width:62rpx;height:62rpx;border-radius:17rpx;background:$lilac-soft;font-size:28rpx;font-weight:800;line-height:62rpx;text-align:center}.menu-icon.mint{background:$mint}.menu-icon.warm{background:#fff0dc}.menu-icon.pink{background:#ffe7ed}.menu-icon.lilac{background:$blush-soft}.menu-icon.peach{background:#ffebe1}.menu-icon.blue{background:#e5f4fb}.menu-card button view{min-width:0}.menu-card button view text{display:block}.menu-card button view text:first-child{color:$ink;font-size:26rpx;font-weight:720}.menu-value{color:$muted;font-size:21rpx}.arrow{color:$muted-light;font-size:34rpx}.clear-row{display:grid;grid-template-columns:54rpx 1fr 24rpx;align-items:center;width:100%;min-height:96rpx;margin:20rpx 0 42rpx;padding:0 22rpx;border:1rpx solid #f1d9df;border-radius:26rpx;background:$surface-solid;color:$danger;font-size:24rpx;text-align:left}.clear-row text:first-child,.clear-row text:last-child{text-align:center}.overlay{position:fixed;z-index:30;inset:0;background:rgba(20,17,19,.38)}.bottom-sheet{position:fixed;z-index:31;right:0;bottom:0;left:0;box-sizing:border-box;padding:10rpx 28rpx calc(30rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:$surface-solid;box-shadow:0 -20rpx 60rpx rgba(0,0,0,.12)}.sheet-handle{width:76rpx;height:8rpx;margin:0 auto 10rpx;border-radius:999rpx;background:$line-strong}.sheet-head{display:flex;align-items:center;justify-content:space-between;min-height:90rpx}.sheet-head>text{color:$ink;font-size:31rpx;font-weight:800}.sheet-head button,.tutorial-close{width:88rpx;min-height:88rpx;margin:0;border:0;border-radius:999rpx;background:transparent;color:$muted;font-size:42rpx;line-height:88rpx}.theme-option{display:grid;grid-template-columns:116rpx minmax(0,1fr) 54rpx;align-items:center;gap:18rpx;width:100%;min-height:136rpx;margin:8rpx 0;padding:16rpx;border:2rpx solid transparent;border-radius:26rpx;background:transparent;text-align:left}.theme-option.active{border-color:$lilac;background:$lilac-soft}.theme-preview{position:relative;width:108rpx;height:92rpx;overflow:hidden;border:1rpx solid $line;border-radius:20rpx}.theme-preview text:first-child{position:absolute;top:14rpx;right:14rpx;width:22rpx;height:22rpx;border-radius:999rpx}.theme-preview text:last-child{position:absolute;right:12rpx;bottom:12rpx;left:12rpx;height:34rpx;border:1rpx solid $line;border-radius:8rpx;background:#fff}.theme-option>view:nth-child(2) text{display:block}.theme-option>view:nth-child(2) text:first-child{color:$ink;font-size:27rpx;font-weight:750}.theme-option>view:nth-child(2) text:last-child{margin-top:5rpx;color:$muted;font-size:20rpx}.check{display:flex;align-items:center;justify-content:center;width:50rpx;height:50rpx;border-radius:999rpx;background:$lilac;color:#fff;font-size:28rpx}.theme-option:not(.active) .check{background:transparent}.ai-form{display:flex;flex-direction:column;gap:18rpx;padding:6rpx 0 10rpx}.ai-toggle{display:flex;align-items:center;justify-content:space-between;min-height:76rpx}.ai-toggle text{color:$ink;font-size:26rpx;font-weight:750}.ai-toggle switch{transform:scale(.86);margin:0}.ai-field{display:flex;flex-direction:column;gap:8rpx}.ai-field>text{color:$muted;font-size:21rpx;font-weight:700}.ai-input{box-sizing:border-box;width:100%;height:82rpx;padding:0 20rpx;border:1rpx solid $line;border-radius:16rpx;background:#fff;color:$ink;font-size:24rpx}.ai-actions{display:grid;grid-template-columns:1.3fr 1fr;gap:14rpx;margin-top:6rpx}.ai-actions .primary-button{width:100%;margin:0;font-size:25rpx}.ai-test{min-height:88rpx;margin:0;border:1rpx solid $line;border-radius:999rpx;background:#fff;color:$lilac-deep;font-size:25rpx;font-weight:750;line-height:88rpx}.ai-test[disabled]{opacity:.5}.tutorial-overlay{z-index:40}.tutorial{position:fixed;z-index:41;top:50%;right:48rpx;left:48rpx;padding:34rpx;transform:translateY(-50%);border-radius:32rpx;background:$surface-solid;box-shadow:0 28rpx 80rpx rgba(0,0,0,.18);text-align:center}.tutorial-close{position:absolute;top:8rpx;right:8rpx}.tutorial>text{display:block}.tutorial-icon{margin:22rpx 0;font-size:76rpx}.tutorial>text:nth-child(3){color:$ink;font-size:32rpx;font-weight:800}.tutorial>text:nth-child(4){margin-top:9rpx;color:$muted;font-size:23rpx}.dots{display:flex;justify-content:center;gap:10rpx;margin:28rpx 0}.dots text{width:12rpx;height:12rpx;border-radius:999rpx;background:$line-strong}.dots text.active{width:30rpx;background:$lilac-strong}.tutorial .primary-button{width:100%;margin:0}
/* Theme overrides live here so the profile keeps its compact component structure. */
.identity { background:linear-gradient(145deg,var(--theme-hero-start),var(--theme-hero-end)); }
.avatar {
  background:transparent;
  box-shadow:none;
  overflow:visible;
}
.avatar image {
  width:124rpx;
  height:124rpx;
  filter:drop-shadow(0 12rpx 22rpx var(--theme-focus-ring-soft));
}
.menu-icon.warm { background:var(--theme-icon-warm); color:var(--theme-icon-warm-ink); }
.menu-icon.mint { background:var(--theme-icon-mint); color:var(--theme-icon-mint-ink); }
.menu-icon.lilac { background:var(--theme-icon-secondary); color:var(--theme-icon-secondary-ink); }
/* Typography and spacing pass: make labels readable without changing navigation. */
.identity { padding-top:32rpx; padding-bottom:40rpx; }
.identity>text:nth-child(2) { margin-top:$space-4; font-size:$text-section; line-height:1.2; }
.stats-grid { margin:$space-4 0 $space-5; }
.stats-grid text:first-child { font-size:40rpx; }
.stats-grid button { gap:0; line-height:1; }
.stats-grid text:last-child { margin-top:8rpx; font-size:$text-caption; line-height:1.15; }
.menu-card.secondary { margin-top:$space-4; }
.menu-card button { min-height:112rpx; gap:$space-3; padding:$space-3 $space-4; }
.menu-card button view text:first-child { font-size:$text-body-large; }
.menu-value { font-size:$text-caption; }
.clear-row { min-height:104rpx; margin:$space-4 0 48rpx; font-size:$text-label; }
.settings-sheet { bottom:0; display:flex; flex-direction:column; height:850rpx; max-height:calc(100vh - var(--status-bar-height) - 40rpx); padding-bottom:calc(30rpx + env(safe-area-inset-bottom)); overflow:hidden; overscroll-behavior:contain; }
.theme-scroll,.language-scroll { flex:1; height:0; min-height:0; padding-bottom:14rpx; }
.language-sheet { height:720rpx; }
.language-sheet .sheet-head > view { display:flex; flex-direction:column; gap:2rpx; }
.language-sheet .sheet-head > view > text:first-child { color:$ink; font-size:31rpx; font-weight:800; }
.sheet-subtitle { color:$muted; font-size:$text-caption; font-weight:500; }
.language-option { display:grid; grid-template-columns:64rpx minmax(0,1fr) 52rpx; align-items:center; gap:$space-3; width:100%; min-height:104rpx; margin:6rpx 0; padding:12rpx 16rpx; border:2rpx solid transparent; border-radius:var(--theme-radius-control); background:transparent; text-align:left; }
.language-option.active { border-color:var(--theme-accent-soft); background:var(--theme-tint); }
.language-mark { display:flex; align-items:center; justify-content:center; width:60rpx; height:60rpx; border-radius:18rpx; background:var(--theme-secondary-soft); color:var(--theme-accent-deep); font-size:21rpx; font-weight:800; }
.language-name { color:$ink; font-size:$text-body-large; font-weight:720; }
.language-check { color:var(--theme-accent-deep); font-size:30rpx; font-weight:800; text-align:center; }
</style>
