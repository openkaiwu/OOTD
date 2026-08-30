import { computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import type { ThemeId } from "@/domain/types";
import { useSettingsStore } from "@/stores/settings";

export const THEME_OPTIONS: Array<{ id: ThemeId; name: string; description: string; accent: string; surface: string }> = [
  { id: "dream", name: "梦幻少女", description: "粉色轻柔", accent: "#D98CAF", surface: "#FFF0F5" },
  { id: "ins", name: "极简 INS", description: "黑白克制", accent: "#171717", surface: "#F5F5F3" },
  { id: "forest", name: "森系自然", description: "清新温和", accent: "#6F8A70", surface: "#F2F4EC" },
];

export function currentThemeOption(themeId: ThemeId) {
  return THEME_OPTIONS.find((item) => item.id === themeId) || THEME_OPTIONS[0];
}

const CHROME: Record<ThemeId, { background: string; foreground: string; selected: string; muted: string }> = {
  dream: { background: "#FFFCFD", foreground: "#1A1A1A", selected: "#C77A9A", muted: "#8F878B" },
  ins: { background: "#FFFFFF", foreground: "#111111", selected: "#111111", muted: "#777777" },
  forest: { background: "#FDFCF8", foreground: "#243128", selected: "#6F8A70", muted: "#788078" },
};

export function applyThemeChrome(themeId: ThemeId): void {
  const item = CHROME[themeId];
  uni.setTabBarStyle({ color: item.muted, selectedColor: item.selected, backgroundColor: item.background, borderStyle: "white", fail: () => undefined });
  uni.setNavigationBarColor({ frontColor: "#000000", backgroundColor: item.background, fail: () => undefined });
}

export function useAppTheme() {
  const settings = useSettingsStore();
  const themeClass = computed(() => `theme-${settings.appMeta.themeId}`);
  onShow(() => { settings.hydrate(); applyThemeChrome(settings.appMeta.themeId); });
  function setTheme(themeId: ThemeId): void { settings.setTheme(themeId); applyThemeChrome(themeId); }
  return { themeClass, themeId: computed(() => settings.appMeta.themeId), setTheme };
}
