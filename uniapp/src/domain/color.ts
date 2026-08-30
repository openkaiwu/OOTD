import { COLORS } from "./constants";
import { rgbToHsl } from "./recognition";

export interface GarmentColorInput {
  colorName: string;
  colorHex?: string;
}

export interface ColorHarmony {
  score: number;
  label: string;
}

const NEUTRAL_NAMES = new Set(["白色", "黑色", "灰色", "米色"]);

export function isNeutralColorName(name: string): boolean {
  return NEUTRAL_NAMES.has(name);
}

export function hexToRgb(hex: string): [number, number, number] {
  const compact = (hex || "").replace("#", "");
  const full = compact.length === 3 ? compact.split("").map((char) => char + char).join("") : compact;
  if (!/^[0-9a-fA-F]{6}$/.test(full.slice(0, 6))) return [138, 138, 138];
  const num = parseInt(full.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export interface ColorChannelInfo {
  name: string;
  hex: string;
  h: number;
  s: number;
  l: number;
  neutral: boolean;
}

export function colorInfoOf(item: GarmentColorInput): ColorChannelInfo {
  const known = COLORS.find((color) => color.name === item.colorName);
  const hex = item.colorHex && /^#[0-9a-fA-F]{3,8}$/.test(item.colorHex) ? item.colorHex : known?.hex || "#8A8A8A";
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return { name: item.colorName, hex, h, s, l, neutral: NEUTRAL_NAMES.has(item.colorName) };
}

export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function countHueClusters(chromatic: ColorChannelInfo[]): number {
  if (chromatic.length <= 1) return chromatic.length;
  const hues = chromatic.map((color) => color.h).sort((a, b) => a - b);
  let clusters = 1;
  for (let index = 1; index < hues.length; index += 1) {
    const gap = hues[index] - hues[index - 1];
    if (gap > 40 && hueDistance(hues[index], hues[index - 1]) > 40) clusters += 1;
  }
  return clusters;
}

// 基于色相环的配色协调评分（0-20）：
// 中性色百搭；单一有彩色稳定；两个有彩色看邻近（±30°）/对比（≥150°）/冲突；
// 三个以上有彩色按色相簇数量惩罚。低饱和会被宽容处理。
export function colorHarmonyOf(items: GarmentColorInput[]): ColorHarmony {
  if (!items.length) return { score: 20, label: "配色干净" };
  const infos = items.map((item) => colorInfoOf(item));
  const chromatic = infos.filter((info) => !info.neutral && info.s >= 15);
  const neutralCount = infos.length - chromatic.length;
  const neutralBonus = neutralCount > 0 ? 1 : 0;

  if (chromatic.length <= 1) {
    const label = chromatic.length === 0 ? "中性色百搭" : neutralCount > 0 ? "中性色衬托" : "同色系";
    return { score: Math.min(20, 19 + neutralBonus), label };
  }

  if (chromatic.length === 2) {
    const distance = hueDistance(chromatic[0].h, chromatic[1].h);
    if (distance <= 30) return { score: Math.min(20, 19 + neutralBonus), label: "邻近色" };
    if (distance >= 150) return { score: Math.min(20, 16 + neutralBonus), label: "对比撞色" };
    if (chromatic[0].s < 35 || chromatic[1].s < 35) return { score: Math.min(20, 16 + neutralBonus), label: "低饱和过渡" };
    return { score: 12, label: "色彩冲突" };
  }

  const clusters = countHueClusters(chromatic);
  if (clusters <= 1) return { score: Math.min(20, 17 + neutralBonus), label: "同色系层次" };
  if (clusters === 2) return { score: Math.min(20, 14 + neutralBonus), label: "双色搭配" };
  return { score: Math.max(8, 13 - (clusters - 3) * 3), label: "花色较多" };
}
