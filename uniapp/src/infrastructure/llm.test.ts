import { describe, expect, it } from "vitest";
import { DEFAULT_LLM_SETTINGS, chatEndpoint, parseLlmSettings } from "./llm";

describe("parseLlmSettings", () => {
  it("returns defaults for empty or malformed input", () => {
    expect(parseLlmSettings(null)).toEqual(DEFAULT_LLM_SETTINGS);
    expect(parseLlmSettings(undefined)).toEqual(DEFAULT_LLM_SETTINGS);
    expect(parseLlmSettings("nonsense")).toEqual(DEFAULT_LLM_SETTINGS);
    expect(parseLlmSettings(42)).toEqual(DEFAULT_LLM_SETTINGS);
    expect(parseLlmSettings({})).toEqual(DEFAULT_LLM_SETTINGS);
  });

  it("keeps valid values and trims whitespace", () => {
    const parsed = parseLlmSettings({
      enabled: true,
      apiKey: "  sk-test-123  ",
      baseUrl: " https://api.xiaomimimo.com/ ",
      model: "mimo-v2.5-pro",
      visionModel: "mimo-v2.5",
    });
    expect(parsed).toEqual({
      enabled: true,
      apiKey: "sk-test-123",
      baseUrl: "https://api.xiaomimimo.com/",
      model: "mimo-v2.5-pro",
      visionModel: "mimo-v2.5",
    });
  });

  it("falls back per-field when values are blank or wrong type", () => {
    const parsed = parseLlmSettings({ enabled: 1, apiKey: "", baseUrl: "   ", model: "", visionModel: null });
    expect(parsed).toEqual({
      enabled: true,
      apiKey: "",
      baseUrl: DEFAULT_LLM_SETTINGS.baseUrl,
      model: DEFAULT_LLM_SETTINGS.model,
      visionModel: DEFAULT_LLM_SETTINGS.visionModel,
    });
  });

  it("defaults the vision model so recognition never silently breaks", () => {
    // 旧版本存储里没有 visionModel 字段，读取后必须补上 mimo-v2.5
    const legacy = parseLlmSettings({ enabled: true, apiKey: "sk-x", baseUrl: "https://api.xiaomimimo.com", model: "mimo-v2.5-pro" });
    expect(legacy.visionModel).toBe("mimo-v2.5");
    expect(legacy.model).toBe("mimo-v2.5-pro");
  });

  it("normalizes MiMo base URLs without duplicating /v1", () => {
    expect(chatEndpoint("https://api.xiaomimimo.com")).toBe("https://api.xiaomimimo.com/v1/chat/completions");
    expect(chatEndpoint("https://api.xiaomimimo.com/v1/")).toBe("https://api.xiaomimimo.com/v1/chat/completions");
    expect(chatEndpoint("https://api.xiaomimimo.com/v1/chat/completions")).toBe("https://api.xiaomimimo.com/v1/chat/completions");
    expect(chatEndpoint("https://token-plan-cn.xiaomimimo.com/v1")).toBe("https://token-plan-cn.xiaomimimo.com/v1/chat/completions");
  });
});
