import type { Garment } from "@/domain/types";
import {
  buildOutfitCommentPrompt,
  buildOutfitRankPrompt,
  buildRecognizePrompt,
  parseCommentResponse,
  parseOutfitRankResponse,
  parseRecognitionResponse,
  type OutfitCommentPayload,
  type OutfitRankCandidate,
  type OutfitRankContext,
  type OutfitRankResult,
} from "@/domain/ai";

// 小米 MiMo 大模型客户端（OpenAI 兼容 /v1/chat/completions）。
// 配置保存在本地存储，未启用或未配置时所有调用直接返回 null，由调用方回退本地逻辑。
// Android WebView 页面源是 appassets.androidplatform.net，直连外部 API 受 CORS 限制，
// 因此优先走注入的 OOTDNative.llmChat 原生桥；其余环境回退 uni.request。

export interface LlmSettings {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  visionModel: string;
}

// MiMo 模型矩阵：mimo-v2.5-pro 仅文本；图片理解只支持 mimo-v2.5（全模态）。
export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  enabled: false,
  apiKey: "",
  baseUrl: "https://api.xiaomimimo.com/v1",
  model: "mimo-v2.5-pro",
  visionModel: "mimo-v2.5",
};

const STORAGE_KEY = "llm_settings_v1";

// 纯函数：把任意存储值规整成合法配置，坏值回退默认，便于单测。
export function parseLlmSettings(raw: unknown): LlmSettings {
  const source = raw && typeof raw === "object" ? (raw as Partial<LlmSettings>) : null;
  if (!source) return { ...DEFAULT_LLM_SETTINGS };
  const text = (value: unknown, fallback: string): string =>
    typeof value === "string" && value.trim() ? value.trim() : fallback;
  return {
    enabled: Boolean(source.enabled),
    apiKey: typeof source.apiKey === "string" ? source.apiKey.trim() : "",
    baseUrl: text(source.baseUrl, DEFAULT_LLM_SETTINGS.baseUrl),
    model: text(source.model, DEFAULT_LLM_SETTINGS.model),
    visionModel: text(source.visionModel, DEFAULT_LLM_SETTINGS.visionModel),
  };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// uni H5 会把对象包成 {"type":"object","data":...} 存进 localStorage；
// 通过 uni.getStorageSync 读取时已自动解包，这里再兜底处理手工写入的原始字符串。
function unwrapStorageValue(raw: unknown): unknown {
  let value = raw;
  if (typeof value === "string") value = safeJsonParse(value);
  if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
    value = (value as { data: unknown }).data;
  }
  return value;
}

export function getLlmSettings(): LlmSettings {
  try {
    const raw: unknown = uni.getStorageSync(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LLM_SETTINGS };
    return parseLlmSettings(unwrapStorageValue(raw));
  } catch {
    return { ...DEFAULT_LLM_SETTINGS };
  }
}

export function saveLlmSettings(value: LlmSettings): void {
  try {
    uni.setStorageSync(STORAGE_KEY, { ...DEFAULT_LLM_SETTINGS, ...value });
  } catch {
    // 存储失败时静默，下一次读取会回退默认配置
  }
}

export function llmReady(settings: LlmSettings = getLlmSettings()): boolean {
  return Boolean(settings.enabled && settings.apiKey);
}

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type ChatContent = string | Array<TextPart | ImagePart>;
type ChatMessage = { role: "system" | "user" | "assistant"; content: ChatContent };

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export function chatEndpoint(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  if (/\/v1\/chat\/completions$/i.test(normalized)) return normalized;
  if (/\/v1$/i.test(normalized)) return normalized + "/chat/completions";
  return normalized + "/v1/chat/completions";
}

function extractContent(bodyText: string): string | null {
  const body = safeJsonParse(bodyText);
  if (!body || typeof body !== "object") return null;
  const content = (body as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const joined = content
      .map((part) => (part && typeof part === "object" && "text" in part ? String((part as TextPart).text || "") : ""))
      .join("");
    return joined.trim() || null;
  }
  return null;
}

// ---- 原生 HTTP 桥（Android WebView）----

type BridgeListener = (status: number, body: string) => void;

export interface LlmPingResult {
  ok: boolean;
  status: number;
  message: string;
}

let lastRequestFailure: { status: number; body: string } | null = null;
let lastRequestSucceeded = false;

function getLastRequestFailure(): { status: number; body: string } | null {
  // Requests settle asynchronously through either the WebView bridge or
  // uni.request, so keep this read outside TypeScript's local narrowing.
  return lastRequestFailure;
}

interface NativeLlmBridge {
  llmChat(requestId: string, url: string, apiKey: string, bodyJson: string): void;
}

const bridgePending = new Map<string, BridgeListener>();

function nativeBridge(): NativeLlmBridge | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { OOTDNative?: { llmChat?: unknown } }).OOTDNative;
  return candidate && typeof candidate.llmChat === "function" ? (candidate as NativeLlmBridge) : null;
}

function ensureBridgeCallback(): void {
  if (typeof window === "undefined") return;
  const holder = window as unknown as { __ootdLlmResult?: (id: string, status: number, body: string) => void };
  if (typeof holder.__ootdLlmResult === "function") return;
  holder.__ootdLlmResult = (id, status, body) => {
    const listener = bridgePending.get(id);
    if (!listener) return;
    bridgePending.delete(id);
    listener(status, body);
  };
}

function requestViaBridge(
  bridge: NativeLlmBridge,
  url: string,
  apiKey: string,
  payload: string,
  timeout: number,
): Promise<string | null> {
  ensureBridgeCallback();
  return new Promise((resolve) => {
    const requestId = "llm_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    const timer = setTimeout(() => {
      bridgePending.delete(requestId);
      lastRequestFailure = { status: 0, body: "Request timed out" };
      resolve(null);
    }, timeout);
    bridgePending.set(requestId, (status, body) => {
      clearTimeout(timer);
      if (status >= 200 && status < 300) lastRequestSucceeded = true;
      else lastRequestFailure = { status, body };
      resolve(status >= 200 && status < 300 ? extractContent(body) : null);
    });
    try {
      bridge.llmChat(requestId, url, apiKey, payload);
    } catch {
      clearTimeout(timer);
      bridgePending.delete(requestId);
      lastRequestFailure = { status: 0, body: "Native bridge call failed" };
      resolve(null);
    }
  });
}

// ---- 直连回退（浏览器预览 / 小程序 / App）----

function requestViaXhr(url: string, apiKey: string, payload: string, timeout: number): Promise<string | null> {
  return new Promise((resolve) => {
    uni.request({
      url,
      method: "POST",
      timeout,
      header: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      data: payload,
      success: (result) => {
        if (result.statusCode < 200 || result.statusCode >= 300) {
          lastRequestFailure = {
            status: result.statusCode,
            body: typeof result.data === "string" ? result.data : JSON.stringify(result.data),
          };
          return resolve(null);
        }
        const text = typeof result.data === "string" ? result.data : JSON.stringify(result.data);
        lastRequestSucceeded = true;
        resolve(extractContent(text));
      },
      fail: (failure) => {
        lastRequestFailure = { status: 0, body: String(failure.errMsg || "Network request failed") };
        resolve(null);
      },
    });
  });
}

function requestChat(
  messages: ChatMessage[],
  options: ChatOptions,
  override?: LlmSettings,
  vision = false,
): Promise<string | null> {
  const config = override || getLlmSettings();
  if (!config.apiKey) return Promise.resolve(null);
  if (!override && !config.enabled) return Promise.resolve(null);
  const model = vision && config.visionModel ? config.visionModel : config.model;
  const payload = JSON.stringify({
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    // MiMo's OpenAI-compatible Chat Completions endpoint currently expects
    // max_tokens. max_completion_tokens is rejected as an invalid parameter.
    max_tokens: options.maxTokens ?? 800,
    stream: false,
  });
  const url = chatEndpoint(config.baseUrl);
  const timeout = options.timeout ?? 45000;
  const bridge = nativeBridge();
  if (bridge) return requestViaBridge(bridge, url, config.apiKey, payload, timeout);
  return requestViaXhr(url, config.apiKey, payload, timeout);
}

export function llmPing(override?: LlmSettings): Promise<boolean> {
  return llmPingDetailed(override).then((result) => result.ok);
}

function responseErrorMessage(body: string): string {
  const parsed = safeJsonParse(body) as { error?: { message?: unknown }; message?: unknown } | null;
  const value = parsed?.error?.message ?? parsed?.message;
  return typeof value === "string" ? value.trim() : "";
}

export async function llmPingDetailed(override?: LlmSettings): Promise<LlmPingResult> {
  lastRequestFailure = null;
  lastRequestSucceeded = false;
  const text = await requestChat(
    [{ role: "user", content: "请只回复两个字：正常" }],
    // First-time DNS/TLS on Android emulators can exceed 12 seconds. Match
    // the native bridge budget so JavaScript does not discard a valid reply.
    { maxTokens: 64, temperature: 0, timeout: 45000 },
    override ? { ...override, enabled: true } : undefined,
  );
  // A connectivity check validates transport and authentication. MiMo may
  // spend a short response budget in reasoning_content before emitting final
  // content, so an otherwise valid 2xx response must still count as success.
  if (text || lastRequestSucceeded) return { ok: true, status: 200, message: "" };
  const failure = getLastRequestFailure();
  if (!failure) return { ok: false, status: 0, message: "请求超时或响应内容为空" };
  return {
    ok: false,
    status: failure.status,
    message: responseErrorMessage(failure.body) || (failure.status ? `HTTP ${failure.status}` : failure.body),
  };
}

export async function llmRecognize(base64Jpeg: string): Promise<Partial<Garment> | null> {
  if (!base64Jpeg) return null;
  const messages: ChatMessage[] = [
    { role: "system", content: "你是衣物识别助手，只输出严格的 JSON 对象，不输出任何多余文字。" },
    {
      role: "user",
      content: [
        { type: "text", text: buildRecognizePrompt() },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64," + base64Jpeg } },
      ],
    },
  ];
  const text = await requestChat(messages, { temperature: 0.2, maxTokens: 600, timeout: 30000 }, undefined, true);
  return text ? parseRecognitionResponse(text) : null;
}

export async function llmOutfitComment(payload: OutfitCommentPayload): Promise<string | null> {
  const text = await requestChat(
    [{ role: "user", content: buildOutfitCommentPrompt(payload) }],
    { temperature: 0.7, maxTokens: 160, timeout: 20000 },
  );
  return parseCommentResponse(text);
}

// AI 精排：一次性把候选搭配发给文本模型打分重排，失败/未启用返回 null。
export async function llmRankOutfits(
  candidates: OutfitRankCandidate[],
  context: OutfitRankContext,
): Promise<OutfitRankResult[] | null> {
  if (!candidates.length) return null;
  const text = await requestChat(
    [{ role: "user", content: buildOutfitRankPrompt(candidates, context) }],
    { temperature: 0.3, maxTokens: 1200, timeout: 30000 },
  );
  return parseOutfitRankResponse(text);
}
