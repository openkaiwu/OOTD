import type { Garment, Outfit } from "./types";

export interface ProductStats {
  total: number;
  favorites: number;
  categories: number;
  generatedOutfits: number;
  savedOutfits: number;
  wornOutfits: number;
  wearEvents: number;
  feedbackCount: number;
  weeklyWorn: number;
  utilization: number | null;
  satisfaction: number | null;
}

export function calculateStats(garments: Garment[], outfits: Outfit[], now = Date.now()): ProductStats {
  const active = garments.filter((item) => item.availability === "active" && !item.deletedAt);
  const thirtyDaysAgo = now - 30 * 86400000;
  const sevenDaysAgo = now - 7 * 86400000;
  const wornIds = new Set(active.filter((item) => (item.lastWornAt || 0) >= thirtyDaysAgo).map((item) => item.id));
  const rated = outfits.filter((item) => item.feedback !== "none" && item.updatedAt >= thirtyDaysAgo);
  const liked = rated.filter((item) => item.feedback === "liked").length;
  const weeklyWorn = outfits.reduce((sum, item) => sum + item.wornAtList.filter((date) => date >= sevenDaysAgo).length, 0);
  const wornOutfits = outfits.filter((item) => item.wornAtList.length).length;
  return {
    total: active.length,
    favorites: active.filter((item) => item.favorite).length,
    categories: new Set(active.map((item) => item.categoryId)).size,
    generatedOutfits: outfits.length,
    savedOutfits: outfits.filter((item) => item.saved).length,
    wornOutfits,
    wearEvents: outfits.reduce((sum, item) => sum + item.wornAtList.length, 0),
    feedbackCount: rated.length,
    weeklyWorn,
    utilization: active.length ? Math.round((wornIds.size / active.length) * 100) : null,
    satisfaction: rated.length >= 3 ? Math.round((liked / rated.length) * 100) : null,
  };
}
