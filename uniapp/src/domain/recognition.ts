import type { CategoryId, SeasonId } from "./types";

export interface NamedColor { name: string; hex: string; h: number | null; s: number | null; l: number; }
export const NAMED_COLORS: NamedColor[] = [
  { name: "黑色", hex: "#1A1A1A", h: null, s: null, l: 10 },
  { name: "白色", hex: "#F5F5F5", h: null, s: null, l: 96 },
  { name: "灰色", hex: "#8A8A8A", h: null, s: null, l: 54 },
  { name: "粉色", hex: "#E89AB8", h: 335, s: 60, l: 75 },
  { name: "红色", hex: "#D64545", h: 0, s: 60, l: 55 },
  { name: "橙色", hex: "#E88A3D", h: 28, s: 75, l: 58 },
  { name: "黄色", hex: "#E8C44A", h: 48, s: 75, l: 60 },
  { name: "绿色", hex: "#5FA86A", h: 130, s: 30, l: 52 },
  { name: "蓝色", hex: "#3D7AD6", h: 217, s: 60, l: 54 },
  { name: "紫色", hex: "#7A4AD6", h: 260, s: 60, l: 56 },
  { name: "棕色", hex: "#7A5230", h: 28, s: 42, l: 33 },
  { name: "米色", hex: "#D8C9A8", h: 40, s: 38, l: 75 },
];

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function nearestNamedColor(h: number, s: number, l: number): NamedColor {
  if (s < 8) {
    if (l > 88) return NAMED_COLORS[1];
    if (l < 18) return NAMED_COLORS[0];
    return NAMED_COLORS[2];
  }
  return NAMED_COLORS.filter((color) => color.h !== null).reduce((best, color) => {
    const hue = color.h as number;
    let dh = Math.abs(h - hue);
    if (dh > 180) dh = 360 - dh;
    const distance = dh * 1.2 + Math.abs(s - (color.s || 0)) * 0.3 + Math.abs(l - color.l) * 0.5;
    return distance < best.distance ? { color, distance } : best;
  }, { color: NAMED_COLORS[2], distance: Number.POSITIVE_INFINITY }).color;
}

export function dominantColorFromPixels(data: ArrayLike<number>): NamedColor {
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const pr = data[i], pg = data[i + 1], pb = data[i + 2], alpha = data[i + 3];
    const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
    if (alpha < 128 || (max > 242 && min > 232) || max < 18) continue;
    r += pr; g += pg; b += pb; count += 1;
  }
  if (!count) return NAMED_COLORS[2];
  return nearestNamedColor(...rgbToHsl(Math.round(r / count), Math.round(g / count), Math.round(b / count)));
}

export function guessCategory(width: number, height: number): CategoryId {
  const ratio = width / Math.max(1, height);
  if (ratio > 1.3) return "shoes";
  if (ratio < 0.6) return "dress";
  if (ratio < 0.85) return "pants";
  return "top-short";
}

export function guessSeasons(category: CategoryId): SeasonId[] {
  if (["dress", "top-short", "skirt"].includes(category)) return ["spring", "summer"];
  if (category === "outerwear") return ["autumn", "winter"];
  return ["spring", "autumn"];
}
