import { CATEGORIES, COLORS, MATERIALS, SCENES, SEASONS, STYLES, STYLE_NAMES } from "./constants";
import type { CategoryId, Garment, SeasonId } from "./types";

// 大模型交互的纯函数层：提示词构造与响应解析。
// 传输在 infrastructure/llm.ts，这里保证解析防御性与取值范围校验。

export function buildRecognizePrompt(): string {
  const lines = [
    "识别图片中的女士衣物，只输出一个 JSON 对象，禁止输出 JSON 以外的任何文字或代码块标记。",
    "字段规则：",
    "name：衣物中文名，不超过 12 个字，描述要具体（如“裸粉尖头细高跟”）；",
    "categoryId：从 " + CATEGORIES.map((item) => item.id + "(" + item.name + ")").join("、") + " 中选一个；",
    "colorName：衣物主色，从 " + COLORS.map((item) => item.name).join("、") + " 中选最接近的；",
    "materialId：面料，从 " + MATERIALS.join("、") + " 中选，不确定就填“未知”；",
    "seasonIds：适合季节的数组，从 [" + SEASONS.map((item) => item.id).join(", ") + "] 中选 1-3 个；",
    "styleIds：穿搭风格数组，从 [" + STYLES.join(", ") + "] 中最多选 2 个；",
    "tags：不超过 3 个短标签数组，描述款式细节（如“泡泡袖”“高腰”“镂空”）。",
  ];
  return lines.join("\n");
}

export function extractJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const stripped = text.replace(/```/g, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(stripped.slice(start, end + 1));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

export function parseRecognitionResponse(text: string): Partial<Garment> | null {
  const parsed = extractJsonObject(text);
  if (!parsed) return null;
  const result: Partial<Garment> = {};
  if (typeof parsed.name === "string" && parsed.name.trim()) result.name = parsed.name.trim().slice(0, 20);
  if (typeof parsed.categoryId === "string" && CATEGORIES.some((item) => item.id === parsed.categoryId)) {
    result.categoryId = parsed.categoryId as CategoryId;
  }
  if (typeof parsed.colorName === "string") {
    const hit = COLORS.find((color) => color.name === parsed.colorName);
    if (hit) {
      result.colorName = hit.name;
      result.colorHex = hit.hex;
    }
  }
  if (typeof parsed.materialId === "string" && MATERIALS.includes(parsed.materialId)) result.materialId = parsed.materialId;
  if (Array.isArray(parsed.seasonIds)) {
    const seasons = parsed.seasonIds.filter((item): item is SeasonId =>
      typeof item === "string" && SEASONS.some((season) => season.id === item));
    if (seasons.length) result.seasonIds = seasons.slice(0, 3);
  }
  if (Array.isArray(parsed.styleIds)) {
    const styles = parsed.styleIds.filter((item): item is string =>
      typeof item === "string" && (STYLES as readonly string[]).includes(item));
    if (styles.length) result.styleIds = styles.slice(0, 2);
  }
  if (Array.isArray(parsed.tags)) {
    const tags = parsed.tags
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim().slice(0, 8))
      .slice(0, 3);
    if (tags.length) result.tags = tags;
  }
  return Object.keys(result).length ? result : null;
}

export interface OutfitCommentPayload {
  sceneName: string;
  weatherText: string;
  items: Array<{ name: string; categoryName: string; colorName: string; materialId?: string }>;
  styleNames: string[];
}

export function buildOutfitCommentPrompt(payload: OutfitCommentPayload): string {
  const itemLine = payload.items
    .map((item) => item.name + "（" + item.categoryName + "，" + item.colorName + "）")
    .join("、");
  const styleLine = payload.styleNames.length ? payload.styleNames.join("、") : "自然随性";
  return [
    "场景：" + payload.sceneName + "；天气：" + payload.weatherText + "；整体风格：" + styleLine,
    "单品：" + itemLine,
    "请用一句不超过 40 个字的中文点评这套搭配，先肯定亮点，再给一个具体的小建议，像懂穿搭的闺蜜的口吻，直接输出这句话，不要任何前后缀。",
  ].join("\n");
}

export function parseCommentResponse(text: string | null): string | null {
  if (!text) return null;
  const clean = text
    .replace(/```/g, "")
    .trim()
    .replace(/^["“']+|["”']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length < 4 || clean.length > 120) return null;
  return clean.slice(0, 60);
}

// ---- AI 精排：对规则生成的候选搭配批量打分重排 ----

export interface OutfitRankItem {
  name: string;
  categoryName: string;
  colorName: string;
  materialId?: string;
  styleNames: string[];
}

export interface OutfitRankCandidate {
  index: number;
  name: string;
  items: OutfitRankItem[];
  /** 本地规则分（0-100 量级），给模型作参考 */
  score: number;
}

export interface OutfitRankContext {
  sceneName: string;
  weatherText: string;
}

export interface OutfitRankResult {
  index: number;
  score: number; // 0-10
  reason: string;
}

export function buildOutfitRankPrompt(candidates: OutfitRankCandidate[], context: OutfitRankContext): string {
  const lines = [
    "你是资深穿搭造型师。请结合场景与天气，从“场景适配度、天气适配度、配色和谐度、整体协调度”四个维度，为下面的每套候选搭配打分。",
    "场景：" + context.sceneName + "；天气：" + context.weatherText,
    "候选搭配：",
  ];
  candidates.forEach((candidate) => {
    const itemLine = candidate.items
      .map((item) =>
        item.name +
        "（" + item.categoryName + "，" + item.colorName +
        (item.materialId ? "，" + item.materialId : "") +
        (item.styleNames.length ? "，" + item.styleNames.join("/") : "") + "）")
      .join("、");
    lines.push(candidate.index + ". " + candidate.name + "（规则评分 " + candidate.score + "）：" + itemLine);
  });
  lines.push(
    "只输出一个 JSON 数组，形如 [{\"index\":0,\"score\":8.5,\"reason\":\"不超过35字的中文理由\"}]，" +
      "index 必须与上面候选的编号一致，score 为 0-10 的数字。禁止输出 JSON 以外的任何文字。",
  );
  return lines.join("\n");
}

function extractJsonArray(text: string | null): unknown {
  if (!text) return null;
  const stripped = text.replace(/```/g, "");
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseOutfitRankResponse(text: string | null): OutfitRankResult[] | null {
  const parsed = extractJsonArray(text);
  if (!Array.isArray(parsed)) return null;
  const results: OutfitRankResult[] = [];
  const seen = new Set<number>();
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.index !== "number" || !Number.isFinite(item.index) || seen.has(item.index)) continue;
    if (typeof item.score !== "number" || !Number.isFinite(item.score)) continue;
    const reason = typeof item.reason === "string" ? item.reason.trim().slice(0, 60) : "";
    if (!reason) continue;
    seen.add(item.index);
    results.push({ index: Math.floor(item.index), score: Math.max(0, Math.min(10, item.score)), reason });
  }
  return results.length ? results : null;
}

export function styleNameOf(styleId: string): string {
  return STYLE_NAMES[styleId] || styleId;
}

export const SCENE_NAMES = SCENES.map((item) => item.name);
