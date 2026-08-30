import type { DislikeReason, Garment, UserPreference } from "./types";

export interface FeedbackSignal {
  liked: boolean;
  reason?: DislikeReason;
}

const clampWeight = (value: number): number => Math.max(-6, Math.min(8, Math.round(value * 10) / 10));

// 反馈闭环：点赞整体正强化（风格/颜色/单品亲和度），点踩按原因分流降权。
// 所有权重都会由 decayFeedback 随时间半衰，避免早期反馈永久绑架推荐。
export function applyFeedback(preference: UserPreference, items: Garment[], signal: FeedbackSignal, now = Date.now()): UserPreference {
  if (!items.length) return preference;
  const styleWeights: Record<string, number> = { ...preference.styleWeights };
  const colorWeights: Record<string, number> = { ...preference.colorWeights };
  const positiveWeights: Record<string, number> = { ...preference.positiveWeights };
  const negativeWeights: Record<string, number> = { ...preference.negativeWeights };

  if (signal.liked) {
    items.forEach((item) => {
      item.styleIds.forEach((style) => {
        styleWeights[style] = clampWeight((styleWeights[style] || 0) + 1);
      });
      colorWeights[item.colorName] = clampWeight((colorWeights[item.colorName] || 0) + 0.5);
      positiveWeights[item.id] = Math.min(5, (positiveWeights[item.id] || 0) + 1);
    });
  } else if (signal.reason === "style") {
    const styles = new Set(items.flatMap((item) => item.styleIds));
    styles.forEach((style) => {
      styleWeights[style] = clampWeight((styleWeights[style] || 0) - 1.5);
    });
  } else if (signal.reason === "color") {
    const colors = new Set(items.map((item) => item.colorName));
    colors.forEach((name) => {
      colorWeights[name] = clampWeight((colorWeights[name] || 0) - 2);
    });
  } else if (signal.reason === "item") {
    items.forEach((item) => {
      negativeWeights[item.id] = Math.min(8, (negativeWeights[item.id] || 0) + 1);
    });
  }
  // "weather" 不沉淀长期偏好：天气是即时条件，降权没有跨天意义

  return { ...preference, styleWeights, colorWeights, positiveWeights, negativeWeights, lastFeedbackAt: now };
}

export function decayFeedback(preference: UserPreference, now = Date.now(), halfLifeDays = 30): UserPreference {
  const anchor = preference.lastFeedbackAt;
  if (!anchor || now <= anchor) return preference;
  const maps = [preference.styleWeights, preference.colorWeights, preference.positiveWeights, preference.negativeWeights];
  if (!maps.some((map) => map && Object.keys(map).length)) return preference;

  const factor = Math.pow(0.5, (now - anchor) / (halfLifeDays * 86400000));
  const decayMap = (source?: Record<string, number>): Record<string, number> => {
    const next: Record<string, number> = {};
    Object.entries(source || {}).forEach(([key, value]) => {
      const weight = Math.round(value * factor * 10) / 10;
      if (Math.abs(weight) >= 0.1) next[key] = weight;
    });
    return next;
  };
  const styleWeights = decayMap(preference.styleWeights);
  const colorWeights = decayMap(preference.colorWeights);
  const positiveWeights = decayMap(preference.positiveWeights);
  const negativeWeights = decayMap(preference.negativeWeights);
  const hasAny = [styleWeights, colorWeights, positiveWeights, negativeWeights].some((map) => Object.keys(map).length);
  return { ...preference, styleWeights, colorWeights, positiveWeights, negativeWeights, lastFeedbackAt: hasAny ? now : undefined };
}
