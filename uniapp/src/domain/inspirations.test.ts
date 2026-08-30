import { describe, expect, it } from "vitest";
import { SCENES } from "./constants";
import {
  INSPIRATION_PRESETS,
  listInspirationOptions,
  resolveInspirationPreset,
} from "./inspirations";

describe("inspiration presets", () => {
  it("contains the 13 requested scenes with valid stable scene ids", () => {
    expect(INSPIRATION_PRESETS).toHaveLength(13);
    expect(new Set(INSPIRATION_PRESETS.map((item) => item.id)).size).toBe(13);
    const sceneIds = new Set(SCENES.map((item) => item.id));
    expect(INSPIRATION_PRESETS.every((item) => sceneIds.has(item.sceneId))).toBe(true);
  });
});

describe("listInspirationOptions", () => {
  it("每个分类只返回本维度的选项，不混入其他维度", () => {
    const season = listInspirationOptions("season");
    expect(season.map((item) => item.type)).toEqual(Array(4).fill("season"));
    expect(season.map((item) => item.name)).toEqual(["春季", "夏季", "秋季", "冬季"]);

    const scene = listInspirationOptions("scene");
    expect(scene.map((item) => item.type)).toEqual(Array(13).fill("scene"));
    expect(scene.map((item) => item.name)).toEqual(INSPIRATION_PRESETS.map((item) => item.name));

    const style = listInspirationOptions("style");
    expect(style.every((item) => item.type === "style")).toBe(true);
    expect(style.map((item) => item.name)).toContain("休闲");
    expect(style.some((item) => item.type !== "style")).toBe(false);

    const color = listInspirationOptions("color");
    expect(color.every((item) => item.type === "color" && item.hex)).toBe(true);
    expect(color.map((item) => item.name)).toContain("粉色");
  });

  it("全部分类合并四个维度的所有内容", () => {
    const all = listInspirationOptions("all");
    expect(all).toHaveLength(
      listInspirationOptions("season").length
      + listInspirationOptions("scene").length
      + listInspirationOptions("style").length
      + listInspirationOptions("color").length,
    );
    const byType = new Map(all.map((item) => [item.type, (all.filter((entry) => entry.type === item.type).length)]));
    expect(byType.get("season")).toBe(4);
    expect(byType.get("scene")).toBe(13);
    expect(byType.get("style")).toBeGreaterThan(0);
    expect(byType.get("color")).toBe(14);
    expect(new Set(all.map((item) => item.key)).size).toBe(all.length);
  });

  it("关键词命中选项名称或提示文字", () => {
    expect(listInspirationOptions("season", "清凉").map((item) => item.name)).toEqual(["夏季"]);
    expect(listInspirationOptions("all", "面试").map((item) => item.name)).toEqual(["面试"]);
    expect(listInspirationOptions("color", "粉").map((item) => item.name)).toEqual(["粉色"]);
    expect(listInspirationOptions("style", "不存在的风格")).toEqual([]);
  });
});

describe("resolveInspirationPreset", () => {
  it("场景选择直接命中对应预设", () => {
    expect(resolveInspirationPreset("scene", "date").preset.name).toBe("约会");
    expect(resolveInspirationPreset("scene", "performance").preset.sceneId).toBe("performance");
  });

  it("季节选择映射到代表场景", () => {
    expect(resolveInspirationPreset("season", "spring").preset.name).toBe("日常");
    expect(resolveInspirationPreset("season", "summer").preset.name).toBe("度假");
    expect(resolveInspirationPreset("season", "winter").preset.name).toBe("户外");
  });

  it("风格选择命中包含该风格的预设", () => {
    expect(resolveInspirationPreset("style", "sporty").preset.name).toBe("运动");
    expect(resolveInspirationPreset("style", "formal").preset.name).toBe("面试");
  });

  it("色系选择带出首选颜色并回退到贴合预设", () => {
    const pink = resolveInspirationPreset("color", "pink");
    expect(pink.preferredColorId).toBe("pink");
    expect(pink.preset.name).toBe("逛街");
    const orange = resolveInspirationPreset("color", "orange");
    expect(orange.preferredColorId).toBe("orange");
    expect(orange.preset.name).toBe("日常");
  });
});
