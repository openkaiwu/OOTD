import { COLORS, SEASONS, STYLE_NAMES } from "./constants";
import type { InspirationPreset, SeasonId } from "./types";

export type InspirationFilterType = "all" | "season" | "scene" | "style" | "color";
export type InspirationOptionType = Exclude<InspirationFilterType, "all">;

export const INSPIRATION_PRESETS: InspirationPreset[] = [
  { id: "shopping", sceneId: "shopping", name: "逛街", icon: "🛍", description: "时尚舒适", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["casual", "street"], colorIds: ["pink", "white", "black"], group: "日常" },
  { id: "daily", sceneId: "weekend", name: "日常", icon: "🏠", description: "简约随性", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["minimal", "casual"], colorIds: ["white", "beige", "gray"], group: "日常" },
  { id: "interview", sceneId: "interview", name: "面试", icon: "🤝", description: "专业得体", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["formal", "business", "minimal"], colorIds: ["white", "black", "navy"], group: "职场" },
  { id: "commute", sceneId: "commute", name: "通勤", icon: "💼", description: "舒适利落", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["business", "minimal", "elegant"], colorIds: ["white", "black", "beige"], group: "职场" },
  { id: "date", sceneId: "date", name: "约会", icon: "💞", description: "温柔精致", seasonIds: ["spring", "summer", "autumn"], styleIds: ["sweet", "elegant", "fairy"], colorIds: ["pink", "white", "beige"], group: "社交" },
  { id: "gathering", sceneId: "party", name: "聚会", icon: "🥂", description: "亮眼出彩", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["street", "retro", "sweet"], colorIds: ["red", "black", "multi"], group: "社交" },
  { id: "sport", sceneId: "sport", name: "运动", icon: "⚽", description: "透气有活力", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["sporty", "casual"], colorIds: ["white", "gray", "blue"], group: "运动" },
  { id: "vacation", sceneId: "beach", name: "度假", icon: "✈️", description: "轻松明快", seasonIds: ["spring", "summer", "autumn"], styleIds: ["resort", "sweet"], colorIds: ["white", "blue", "yellow"], group: "旅行" },
  { id: "outdoor", sceneId: "hiking", name: "户外", icon: "🌲", description: "实用舒适", seasonIds: ["spring", "summer", "autumn"], styleIds: ["sporty", "casual"], colorIds: ["green", "brown", "gray"], group: "运动" },
  { id: "wedding", sceneId: "wedding", name: "婚礼", icon: "💒", description: "喜庆得体", seasonIds: ["spring", "summer", "autumn"], styleIds: ["elegant", "sweet", "formal"], colorIds: ["pink", "beige", "blue"], group: "仪式" },
  { id: "night-party", sceneId: "festival", name: "派对", icon: "🎉", description: "精致闪耀", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["street", "retro", "sweet"], colorIds: ["black", "red", "multi"], group: "社交" },
  { id: "ceremony", sceneId: "ceremony", name: "典礼", icon: "🎓", description: "庄重优雅", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["formal", "elegant"], colorIds: ["black", "navy", "white"], group: "仪式" },
  { id: "performance", sceneId: "performance", name: "演出", icon: "🎤", description: "醒目有个性", seasonIds: ["spring", "summer", "autumn", "winter"], styleIds: ["street", "retro"], colorIds: ["black", "red", "multi"], group: "仪式" },
];

export const INSPIRATION_FILTERS: Array<{ id: InspirationFilterType; name: string; icon: string }> = [
  { id: "all", name: "全部", icon: "✦" },
  { id: "season", name: "季节", icon: "☁" },
  { id: "scene", name: "场景", icon: "🎭" },
  { id: "style", name: "风格", icon: "🎨" },
  { id: "color", name: "色系", icon: "🌈" },
];

/** 灵感选项卡片：顶部分类决定网格里出现哪个维度的选项，各维度互不混入。 */
export interface InspirationOption {
  key: string;
  type: InspirationOptionType;
  id: string;
  name: string;
  icon: string;
  hint: string;
  hex?: string;
}

const SEASON_META: Record<SeasonId, { icon: string; hint: string }> = {
  spring: { icon: "🌸", hint: "轻薄明亮的春装" },
  summer: { icon: "☀️", hint: "清凉透气的夏装" },
  autumn: { icon: "🍂", hint: "温暖有层次的秋装" },
  winter: { icon: "❄️", hint: "保暖厚实的冬装" },
};

const STYLE_META: Record<string, { icon: string; hint: string }> = {
  casual: { icon: "☕", hint: "舒适随性不费力" },
  formal: { icon: "👔", hint: "正式得体有气场" },
  minimal: { icon: "◻️", hint: "少即是多的美学" },
  elegant: { icon: "🦢", hint: "优雅知性的气质" },
  sweet: { icon: "🍰", hint: "甜美可爱的少女感" },
  sporty: { icon: "🏃", hint: "活力四射的运动风" },
  resort: { icon: "🌴", hint: "轻松惬意的度假风" },
  street: { icon: "🔥", hint: "潮酷有型的街头范" },
  retro: { icon: "🌆", hint: "复古摩登的怀旧感" },
  fairy: { icon: "🧚", hint: "轻盈浪漫的仙气" },
  business: { icon: "📊", hint: "干练专业的职场感" },
};

const COLOR_ICONS: Record<string, string> = {
  white: "🤍", black: "🖤", gray: "🩶", red: "❤️", pink: "💗", orange: "🧡",
  yellow: "💛", green: "💚", blue: "💙", purple: "💜", brown: "🟤", beige: "🟡",
  navy: "📘", multi: "🌈",
};

function seasonOptions(): InspirationOption[] {
  return SEASONS.map((season) => ({
    key: `season:${season.id}`, type: "season", id: season.id, name: `${season.name}季`,
    icon: SEASON_META[season.id].icon, hint: SEASON_META[season.id].hint,
  }));
}

function sceneOptions(): InspirationOption[] {
  return INSPIRATION_PRESETS.map((preset) => ({
    key: `scene:${preset.id}`, type: "scene", id: preset.id, name: preset.name,
    icon: preset.icon, hint: preset.description,
  }));
}

function styleOptions(): InspirationOption[] {
  return Object.entries(STYLE_NAMES).map(([id, name]) => ({
    key: "style:" + id, type: "style", id, name,
    icon: STYLE_META[id]?.icon ?? "✦", hint: STYLE_META[id]?.hint ?? "",
  }));
}

function colorOptions(): InspirationOption[] {
  return COLORS.map((color) => ({
    key: `color:${color.id}`, type: "color", id: color.id, name: color.name,
    icon: COLOR_ICONS[color.id] ?? "✨", hint: "", hex: color.hex,
  }));
}

const DIMENSION_OPTIONS: Record<InspirationOptionType, () => InspirationOption[]> = {
  season: seasonOptions,
  scene: sceneOptions,
  style: styleOptions,
  color: colorOptions,
};

/** 按顶部分类列出灵感选项：all 合并四个维度，其余分类只返回本维度的选项， keyword 命中名称或提示。 */
export function listInspirationOptions(type: InspirationFilterType, query = ""): InspirationOption[] {
  const options = type === "all"
    ? [...seasonOptions(), ...sceneOptions(), ...styleOptions(), ...colorOptions()]
    : DIMENSION_OPTIONS[type]();
  const keyword = query.trim().toLowerCase();
  if (!keyword) return options;
  return options.filter((item) => `${item.name} ${item.hint}`.toLowerCase().includes(keyword));
}

/** 季节灵感落到代表场景：春日常、夏度假、秋约会、冬户外。 */
const SEASON_PRESET_IDS: Record<SeasonId, string> = { spring: "daily", summer: "vacation", autumn: "date", winter: "outdoor" };

export interface InspirationTarget {
  preset: InspirationPreset;
  /** 选中色系时优先推荐该颜色。 */
  preferredColorId?: string;
}

/** 把任一维度的灵感选择折算成推荐上下文：场景直接命中预设，季节/风格/色系映射到最贴合的预设。 */
export function resolveInspirationPreset(type: InspirationOptionType, id: string): InspirationTarget {
  const fallback = INSPIRATION_PRESETS.find((preset) => preset.id === "daily") ?? INSPIRATION_PRESETS[0];
  if (type === "scene") {
    return { preset: INSPIRATION_PRESETS.find((preset) => preset.id === id) ?? fallback };
  }
  if (type === "season") {
    return { preset: INSPIRATION_PRESETS.find((preset) => preset.id === SEASON_PRESET_IDS[id as SeasonId]) ?? fallback };
  }
  if (type === "style") {
    return { preset: INSPIRATION_PRESETS.find((preset) => preset.styleIds.includes(id)) ?? fallback };
  }
  return {
    preset: INSPIRATION_PRESETS.find((preset) => preset.colorIds.includes(id)) ?? fallback,
    preferredColorId: id,
  };
}
