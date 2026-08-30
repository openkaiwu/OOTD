import { CATEGORIES, SCENES, STYLE_NAMES } from "./constants";
import { colorHarmonyOf, isNeutralColorName } from "./color";
import type {
  CategoryId,
  Garment,
  LayerPlan,
  Outfit,
  OutfitScoreDetail,
  RecommendationContext,
  SeasonId,
  UserPreference,
  WeatherSnapshot,
} from "./types";

const groupOf = (category: CategoryId): string => CATEGORIES.find((item) => item.id === category)?.group || category;
const WARM_MATERIALS = new Set(["羊毛", "针织"]);
const isWarmMaterial = (item: Garment): boolean => WARM_MATERIALS.has(item.materialId || "");

export function outfitSignature(itemIds: string[]): string {
  return [...itemIds].sort().join("|");
}

export function wardrobeReadiness(items: Garment[]): "empty" | "insufficient" | "partial" | "complete" {
  const active = items.filter((item) => item.availability === "active" && !item.deletedAt);
  if (!active.length) return "empty";
  const groups = new Set(active.map((item) => groupOf(item.categoryId)));
  const hasBase = groups.has("dress") || (groups.has("top") && groups.has("bottom"));
  if (!hasBase) return "insufficient";
  return groups.has("shoes") ? "complete" : "partial";
}

// 体感温度：优先用接口给的 feelsLike，否则用湿度/风做简单修正
export function apparentTemperature(weather: WeatherSnapshot): number {
  if (typeof weather.feelsLike === "number") return Math.round(weather.feelsLike);
  let temp = weather.temp;
  if (temp >= 26 && weather.humidity >= 70) temp += 2;
  if (temp <= 10 && weather.humidity >= 80) temp -= 1;
  if (weather.wind >= 30) temp -= 3;
  else if (weather.wind >= 15) temp -= 1.5;
  return Math.round(temp);
}

// 分层穿法：≥26 无外套 / 20-26 轻外套 / 12-20 必外套 / <12 厚外套
export function layerFor(feels: number): LayerPlan {
  if (feels >= 26) return "hot";
  if (feels >= 20) return "warm";
  if (feels >= 12) return "mild";
  return "cold";
}

export function seasonForContext(context: RecommendationContext): SeasonId {
  if (context.seasonId) return context.seasonId;
  const month = new Date(context.generatedAt).getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function weatherScore(items: Garment[], context: RecommendationContext): number {
  const weather = context.weatherSnapshot;
  if (!weather) return 22;
  const layer = layerFor(apparentTemperature(weather));
  const groups = new Set(items.map((item) => groupOf(item.categoryId)));
  const categories = new Set(items.map((item) => item.categoryId));
  let score = 20;
  if (layer === "hot") {
    if (groups.has("outerwear")) score -= 10;
    else score += 8;
    if (categories.has("top-short") || categories.has("dress")) score += 3;
    if (!categories.has("top-short") && !categories.has("dress") && categories.has("top-long")) score -= 3;
  } else if (layer === "warm") {
    if (groups.has("outerwear")) score += 4;
    if (categories.has("top-short")) score += 2;
  } else if (layer === "mild") {
    if (groups.has("outerwear")) score += 8;
    else score -= 7;
    if (categories.has("top-short")) score -= 3;
    if (categories.has("top-long") || categories.has("dress")) score += 1;
  } else {
    if (groups.has("outerwear")) {
      score += 8;
      if (items.some(isWarmMaterial)) score += 2;
    } else score -= 12;
    if (categories.has("top-short")) score -= 8;
    if (categories.has("top-long")) score += 2;
  }
  if (weather.wind >= 20 && groups.has("outerwear")) score += 1;
  return Math.max(0, Math.min(30, score));
}

function sceneScore(items: Garment[], context: RecommendationContext): number {
  const scene = SCENES.find((item) => item.id === context.sceneId);
  if (!scene) return 18;
  const matched = items.flatMap((item) => item.styleIds).filter((style) => scene.styles.includes(style)).length;
  const groups = new Set(items.map((item) => groupOf(item.categoryId)));
  let score = 14 + Math.min(8, matched * 3);
  if (["interview", "commute", "office"].includes(scene.id) && groups.has("top") && groups.has("bottom")) score += 3;
  if (["sport", "hiking"].includes(scene.id) && items.some((item) => item.styleIds.includes("sporty"))) score += 3;
  return Math.min(25, score);
}

function preferenceScore(items: Garment[], context: RecommendationContext, preference: UserPreference): number {
  const wantedStyles = new Set([...preference.styleIds, ...context.preferredStyleIds]);
  const wantedColors = new Set([...preference.preferredColorIds, ...context.preferredColorIds]);
  const avoided = new Set([...preference.avoidedColorIds, ...context.avoidedColorIds]);
  let score = 8;
  items.forEach((item) => {
    if (item.styleIds.some((style) => wantedStyles.has(style))) score += 2;
    if (wantedColors.has(item.colorName) || wantedColors.has(item.colorHex)) score += 1;
    if (avoided.has(item.colorName) || avoided.has(item.colorHex)) score -= 5;
    const styleSignal = item.styleIds.reduce((sum, style) => sum + (preference.styleWeights?.[style] || 0), 0);
    score += Math.max(-4, Math.min(4, styleSignal));
    score += Math.max(-3, Math.min(3, preference.colorWeights?.[item.colorName] || 0));
    score += Math.min(3, preference.positiveWeights?.[item.id] || 0);
    score -= preference.negativeWeights[item.id] || 0;
  });
  return Math.max(0, Math.min(15, score));
}

function rotationScore(items: Garment[], preference: UserPreference, now: number): number {
  if (!preference.rotateUnderused) return 6;
  const avg = items.reduce((sum, item) => {
    if (!item.lastWornAt) return sum + 10;
    const days = (now - item.lastWornAt) / 86400000;
    return sum + Math.min(10, Math.max(0, days / 3));
  }, 0) / Math.max(1, items.length);
  return Math.round(avg);
}

const styleOverlap = (source: string[], target: string[]): number => {
  const set = new Set(target);
  return source.filter((style) => set.has(style)).length;
};

const colorInputsOf = (items: Garment[]): Array<{ colorName: string; colorHex?: string }> =>
  items.map((item) => ({ colorName: item.colorName, colorHex: item.colorHex }));

// 外套智能选取：与内搭的风格交集 + 加入后的配色和谐度 + 季节/材质适配
function pickOuterwear(base: Garment[], coats: Garment[], layer: LayerPlan | null, season: SeasonId): Garment | null {
  if (!coats.length || layer === "hot") return null;
  const baseStyles = base.flatMap((item) => item.styleIds);
  const baseColors = colorInputsOf(base);
  let best: { coat: Garment; score: number } | null = null;
  for (const coat of coats) {
    let score = styleOverlap(coat.styleIds, baseStyles) * 2.5;
    score += colorHarmonyOf([...baseColors, { colorName: coat.colorName, colorHex: coat.colorHex }]).score / 5;
    if (coat.seasonIds.length && !coat.seasonIds.includes(season)) score -= 3;
    if (layer === "cold" && isWarmMaterial(coat)) score += 1.5;
    if (coat.favorite) score += 0.5;
    if (!best || score > best.score) best = { coat, score };
  }
  return best ? best.coat : null;
}

// 配饰只在真的搭得上时才加（风格呼应或配色加分），不再机械轮询
function pickAccessory(parts: Garment[], accessories: Garment[]): Garment | null {
  if (!accessories.length) return null;
  const styles = parts.flatMap((item) => item.styleIds);
  const colors = colorInputsOf(parts);
  let best: { accessory: Garment; score: number } | null = null;
  for (const accessory of accessories) {
    let score = styleOverlap(accessory.styleIds, styles) * 2;
    score += colorHarmonyOf([...colors, { colorName: accessory.colorName, colorHex: accessory.colorHex }]).score / 6;
    if (accessory.favorite) score += 0.5;
    if (!best || score > best.score) best = { accessory, score };
  }
  return best && best.score >= 1 ? best.accessory : null;
}

function buildCandidates(items: Garment[], context: RecommendationContext, pinnedId?: string): Garment[][] {
  const season = seasonForContext(context);
  const layer = context.weatherSnapshot ? layerFor(apparentTemperature(context.weatherSnapshot)) : null;
  let active = items.filter((item) => item.availability === "active" && !item.deletedAt);

  // 季节硬约束：过季单品不进候选池；若过滤后凑不齐基础组合则回退放宽
  const seasonal = active.filter((item) => !item.seasonIds.length || item.seasonIds.includes(season));
  const hasBase = (pool: Garment[]): boolean => {
    const groups = new Set(pool.map((item) => groupOf(item.categoryId)));
    return groups.has("dress") || (groups.has("top") && groups.has("bottom"));
  };
  if (hasBase(seasonal)) active = seasonal;

  const pool = (group: string): Garment[] => active.filter((item) => groupOf(item.categoryId) === group);
  const tops = pool("top");
  const bottoms = pool("bottom");
  const dresses = pool("dress");
  const shoes = pool("shoes");
  const outerwear = pool("outerwear");
  const accessories = pool("accessory");
  const pinned = pinnedId ? active.find((item) => item.id === pinnedId) : undefined;
  const pinnedOuter = pinned && groupOf(pinned.categoryId) === "outerwear" ? pinned : null;
  const pinnedAccessory = pinned && groupOf(pinned.categoryId) === "accessory" ? pinned : null;

  const bases: Garment[][] = [];
  dresses.forEach((dress) => {
    if (shoes.length) shoes.forEach((shoe) => bases.push([dress, shoe]));
    else bases.push([dress]);
  });
  tops.forEach((top) => bottoms.forEach((bottom) => {
    if (shoes.length) shoes.forEach((shoe) => bases.push([top, bottom, shoe]));
    else bases.push([top, bottom]);
  }));

  return bases.map((base) => {
    const parts = [...base];
    const coat = pinnedOuter || pickOuterwear(base, outerwear, layer, season);
    if (coat) parts.push(coat);
    const accessory = pinnedAccessory || pickAccessory(parts, accessories);
    if (accessory) parts.push(accessory);
    return parts;
  }).filter((candidate) => !pinnedId || candidate.some((item) => item.id === pinnedId));
}

function reasonFor(items: Garment[], context: RecommendationContext, layer: LayerPlan | null, harmonyLabel: string): string {
  const weather = context.weatherSnapshot;
  const scene = SCENES.find((item) => item.id === context.sceneId);
  const parts: string[] = [];
  if (weather && layer) {
    const feels = apparentTemperature(weather);
    if (layer === "hot") parts.push(feels + "°C 偏热，轻薄透气最舒服");
    else if (layer === "warm") parts.push(feels + "°C 温暖，轻搭外套刚刚好");
    else if (layer === "mild") parts.push(feels + "°C 偏凉，加件外套应对温差");
    else parts.push(feels + "°C 寒冷，厚外套锁住温度");
  }
  if (scene) parts.push(harmonyLabel + "配色，适合" + scene.name);
  else parts.push(harmonyLabel + "配色保持整体协调");
  const colorNames = [...new Set(items.map((item) => item.colorName))].slice(0, 2);
  if (colorNames.length) parts.push(colorNames.join("与") + "的组合耐看");
  return parts.join("；") || "品类完整、配色克制，适合作为今天的基础穿搭";
}

const colorFamilyOf = (items: Garment[]): string => {
  const chromatic = items.map((item) => item.colorName).filter((name) => !isNeutralColorName(name));
  return chromatic[0] || items[0]?.colorName || "无";
};

const primaryStyleOf = (items: Garment[]): string => {
  const count = new Map<string, number>();
  items.forEach((item) => item.styleIds.forEach((style) => count.set(style, (count.get(style) || 0) + 1)));
  const sorted = [...count.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "none";
};

export function generateOutfits(
  garments: Garment[],
  context: RecommendationContext,
  preference: UserPreference,
  limit = 3,
): Outfit[] {
  const excluded = new Set(context.excludedOutfitSignatures);
  const layer = context.weatherSnapshot ? layerFor(apparentTemperature(context.weatherSnapshot)) : null;
  const seen = new Set<string>();
  const scored = buildCandidates(garments, context, context.pinnedItemId).map((items) => {
    const signature = outfitSignature(items.map((item) => item.id));
    const harmony = colorHarmonyOf(colorInputsOf(items));
    const detail: OutfitScoreDetail = {
      weather: weatherScore(items, context),
      scene: sceneScore(items, context),
      color: harmony.score,
      preference: preferenceScore(items, context, preference),
      rotation: rotationScore(items, preference, context.generatedAt),
    };
    const score = detail.weather + detail.scene + detail.color + detail.preference + detail.rotation;
    return { items, signature, score, detail, harmonyLabel: harmony.label };
  }).filter(({ signature }) => !excluded.has(signature) && !seen.has(signature) && Boolean(seen.add(signature)))
    .sort((a, b) => b.score - a.score);

  // 多样性：优先挑主风格或主色系不同的组合，保证三套之间有真实差异
  const chosen: typeof scored = [];
  const usedProfiles = new Set<string>();
  const profileKey = (items: Garment[]): string => primaryStyleOf(items) + "|" + colorFamilyOf(items);
  for (const candidate of scored) {
    const core = candidate.items.find((item) => ["top", "dress"].includes(groupOf(item.categoryId)))?.id;
    if (chosen.some((item) => item.items.find((part) => ["top", "dress"].includes(groupOf(part.categoryId)))?.id === core) && scored.length > limit) continue;
    const profile = profileKey(candidate.items);
    if (usedProfiles.has(profile) && scored.length > limit * 2) continue;
    usedProfiles.add(profile);
    chosen.push(candidate);
    if (chosen.length === limit) break;
  }
  for (const candidate of scored) {
    if (chosen.length === limit) break;
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }

  return chosen.map(({ items, score, detail, harmonyLabel }, index) => {
    const styles = [...new Set(items.flatMap((item) => item.styleIds))].slice(0, 2);
    const styleName = styles[0] ? STYLE_NAMES[styles[0]] : "清爽";
    return {
      id: "outfit_" + context.generatedAt + "_" + index,
      name: styleName + "穿搭 " + (index + 1),
      itemIds: items.map((item) => item.id),
      sceneId: context.sceneId,
      contextSnapshot: context,
      score,
      reason: reasonFor(items, context, layer, harmonyLabel),
      scoreDetail: detail,
      styleTags: styles,
      feedback: "none",
      dislikeReasons: [],
      saved: false,
      wornAtList: [],
      createdAt: context.generatedAt,
      updatedAt: context.generatedAt,
      schemaVersion: 2,
    };
  });
}
