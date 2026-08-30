import { describe, expect, it } from "vitest";
import { buildOutfitCommentPrompt, buildOutfitRankPrompt, extractJsonObject, parseCommentResponse, parseOutfitRankResponse, parseRecognitionResponse } from "./ai";

describe("ai prompt and parsing", () => {
  it("parses a clean recognition response", () => {
    const result = parseRecognitionResponse(JSON.stringify({
      name: "裸粉色尖头细跟高跟鞋",
      categoryId: "shoes",
      colorName: "粉色",
      materialId: "皮革",
      seasonIds: ["spring", "summer"],
      styleIds: ["elegant", "sweet"],
      tags: ["尖头", "细跟"],
    }));
    expect(result).toEqual({
      name: "裸粉色尖头细跟高跟鞋",
      categoryId: "shoes",
      colorName: "粉色",
      colorHex: "#E89AB8",
      materialId: "皮革",
      seasonIds: ["spring", "summer"],
      styleIds: ["elegant", "sweet"],
      tags: ["尖头", "细跟"],
    });
  });

  it("extracts JSON from markdown fences and drops invalid values", () => {
    const wrapped = "以下是识别结果：\n```json\n{\"name\":\"白色泡泡袖衬衫\",\"categoryId\":\"coat\",\"colorName\":\"珍珠白\",\"seasonIds\":[\"summer\",\"winter\",\"spring\"],\"styleIds\":[\"sweet\",\"formal\",\"street\"],\"tags\":[]}\n```";
    const result = parseRecognitionResponse(wrapped);
    expect(result?.name).toBe("白色泡泡袖衬衫");
    expect(result?.categoryId).toBeUndefined();
    expect(result?.colorName).toBeUndefined();
    expect(result?.seasonIds).toEqual(["summer", "winter", "spring"]);
    expect(result?.styleIds).toEqual(["sweet", "formal"]);
    expect(result?.tags).toBeUndefined();
  });

  it("returns null for unusable output", () => {
    expect(parseRecognitionResponse("")).toBeNull();
    expect(parseRecognitionResponse("这件衣服很好看")).toBeNull();
    expect(parseRecognitionResponse("{\"name\":\"   \"}")).toBeNull();
    expect(extractJsonObject("no braces here")).toBeNull();
  });

  it("builds outfit comment prompts and cleans responses", () => {
    const prompt = buildOutfitCommentPrompt({
      sceneName: "约会",
      weatherText: "上海 24°C",
      items: [
        { name: "雾蓝雪纺连衣裙", categoryName: "连衣裙", colorName: "蓝色", materialId: "雪纺" },
        { name: "裸粉高跟凉鞋", categoryName: "鞋子", colorName: "粉色" },
      ],
      styleNames: ["甜美", "优雅"],
    });
    expect(prompt).toContain("约会");
    expect(prompt).toContain("雾蓝雪纺连衣裙");
    expect(prompt).toContain("40 个字");

    expect(parseCommentResponse("  “蓝粉配色很温柔，加一条细项链会更精致。”  ")).toBe("蓝粉配色很温柔，加一条细项链会更精致。");
    expect(parseCommentResponse(null)).toBeNull();
    expect(parseCommentResponse("好")).toBeNull();
    const long = "长".repeat(150);
    expect(parseCommentResponse(long)).toBeNull();
  });

  it("builds outfit rank prompts with scene, weather and per-candidate details", () => {
    const prompt = buildOutfitRankPrompt([
      {
        index: 0,
        name: "简约穿搭 1",
        score: 88,
        items: [
          { name: "白色衬衫", categoryName: "长袖上衣", colorName: "白色", materialId: "棉", styleNames: ["简约", "商务"] },
        ],
      },
    ], { sceneName: "通勤", weatherText: "上海 24°C" });
    expect(prompt).toContain("通勤");
    expect(prompt).toContain("上海 24°C");
    expect(prompt).toContain("白色衬衫（长袖上衣，白色，棉，简约/商务）");
    expect(prompt).toContain("规则评分 88");
    expect(prompt).toContain("0-10");
  });

  it("parses rank responses and drops invalid entries", () => {
    const wrapped = "好的，这是评分：\n```json\n[{\"index\":0,\"score\":8.5,\"reason\":\"蓝白配色干净，适合通勤\"},{\"index\":1,\"score\":3,\"reason\":\"配色偏花\"},{\"index\":\"x\",\"score\":9,\"reason\":\"非法编号\"},{\"index\":0,\"score\":10,\"reason\":\"重复编号\"}]\n```";
    const result = parseOutfitRankResponse(wrapped);
    expect(result).toEqual([
      { index: 0, score: 8.5, reason: "蓝白配色干净，适合通勤" },
      { index: 1, score: 3, reason: "配色偏花" },
    ]);
    expect(parseOutfitRankResponse(null)).toBeNull();
    expect(parseOutfitRankResponse("没输出数组")).toBeNull();
    expect(parseOutfitRankResponse("[{\"index\":0,\"score\":12,\"reason\":\"超出范围\"}]")![0].score).toBe(10);
    expect(parseOutfitRankResponse("[{\"index\":0,\"score\":8,\"reason\":\"   \"}]")).toBeNull();
  });
});
