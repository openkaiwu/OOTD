import type { CategoryId, SeasonId } from "./types";

export const CATEGORIES: Array<{ id: CategoryId; name: string; group: string }> = [
  { id: "top-short", name: "短袖上衣", group: "top" },
  { id: "top-long", name: "长袖上衣", group: "top" },
  { id: "outerwear", name: "外套", group: "outerwear" },
  { id: "pants", name: "裤子", group: "bottom" },
  { id: "skirt", name: "半身裙", group: "bottom" },
  { id: "dress", name: "连衣裙", group: "dress" },
  { id: "shoes", name: "鞋子", group: "shoes" },
  { id: "accessory", name: "配饰", group: "accessory" },
];

export const SEASONS: Array<{ id: SeasonId; name: string }> = [
  { id: "spring", name: "春" },
  { id: "summer", name: "夏" },
  { id: "autumn", name: "秋" },
  { id: "winter", name: "冬" },
];

export const STYLES = ["casual", "formal", "sporty", "street", "retro", "minimal", "elegant", "sweet", "fairy", "business", "resort"] as const;
export const STYLE_NAMES: Record<string, string> = {
  casual: "休闲", formal: "正式", sporty: "运动", street: "街头", retro: "复古",
  minimal: "简约", elegant: "优雅", sweet: "甜美", fairy: "仙女风", business: "商务", resort: "度假",
};

export const MATERIALS = ["棉", "麻", "丝绸", "雪纺", "牛仔", "羊毛", "针织", "皮革", "聚酯纤维", "其他", "未知"];

export const COLORS = [
  { id: "white", name: "白色", hex: "#F5F5F5" }, { id: "black", name: "黑色", hex: "#1A1A1A" },
  { id: "gray", name: "灰色", hex: "#8A8A8A" }, { id: "red", name: "红色", hex: "#D64545" },
  { id: "pink", name: "粉色", hex: "#E89AB8" }, { id: "orange", name: "橙色", hex: "#E88A3D" },
  { id: "yellow", name: "黄色", hex: "#E8C44A" }, { id: "green", name: "绿色", hex: "#5FA86A" },
  { id: "blue", name: "蓝色", hex: "#3D7AD6" }, { id: "purple", name: "紫色", hex: "#7A4AD6" },
  { id: "brown", name: "棕色", hex: "#7A5230" }, { id: "beige", name: "米色", hex: "#D8C9A8" },
  { id: "navy", name: "藏青", hex: "#1F3A6E" }, { id: "multi", name: "多色", hex: "#C18ACB" },
];

export const SCENES = [
  { id: "commute", name: "通勤", hint: "舒适得体", styles: ["minimal", "business", "elegant"] },
  { id: "weekend", name: "日常", hint: "简约随性", styles: ["casual", "street", "minimal"] },
  { id: "date", name: "约会", hint: "温柔精致", styles: ["sweet", "elegant", "fairy"] },
  { id: "interview", name: "面试", hint: "干练自信", styles: ["formal", "business", "minimal"] },
  { id: "party", name: "聚会", hint: "亮眼出彩", styles: ["street", "retro", "sweet"] },
  { id: "sport", name: "运动", hint: "轻快实用", styles: ["sporty", "casual"] },
  { id: "beach", name: "度假", hint: "轻松愉快", styles: ["resort", "sweet"] },
  { id: "coffee", name: "咖啡探店", hint: "文艺松弛", styles: ["retro", "minimal", "elegant"] },
  { id: "hiking", name: "户外", hint: "实用舒适", styles: ["sporty", "casual"] },
  { id: "shopping", name: "逛街", hint: "时尚百搭", styles: ["casual", "street"] },
  { id: "office", name: "办公室", hint: "专业亲和", styles: ["business", "minimal"] },
  { id: "festival", name: "派对", hint: "精致闪耀", styles: ["retro", "sweet", "street"] },
  { id: "wedding", name: "婚礼", hint: "喜庆得体", styles: ["elegant", "sweet", "formal"] },
  { id: "ceremony", name: "典礼", hint: "庄重优雅", styles: ["formal", "elegant", "business"] },
  { id: "performance", name: "演出", hint: "醒目有个性", styles: ["street", "retro", "sweet"] },
];

export const STORAGE_KEYS = {
  garments: "wardrobe_v2",
  outfits: "outfits_v2",
  profile: "user_profile_v2",
  preferences: "preferences_v1",
  wearRecords: "wear_records_v1",
  weather: "weather_cache_v1",
  drafts: "drafts_v1",
  meta: "app_meta_v1",
  events: "event_log_v1",
} as const;
