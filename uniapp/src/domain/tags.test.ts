import { describe, expect, it } from "vitest";
import { mergeTags, parseTagInput, TAG_LIMIT } from "./tags";

describe("tag input parsing", () => {
  it("splits on both comma styles, trims and dedupes", () => {
    expect(parseTagInput(" 通勤，显瘦 ,通勤, ")).toEqual(["通勤", "显瘦"]);
  });

  it("drops empty segments and caps each tag length", () => {
    const tags = parseTagInput(",,aaaaaabbbbbbcccccc,,");
    expect(tags).toEqual(["aaaaaabbbbbb"]);
    expect(tags[0].length).toBe(12);
  });
});

describe("tag merging", () => {
  it("appends new tags and skips duplicates", () => {
    expect(mergeTags(["通勤"], ["通勤", "显瘦"])).toEqual({ tags: ["通勤", "显瘦"], added: 1, rejected: 0 });
  });

  it("stops at the limit and reports rejected extras", () => {
    const base = Array.from({ length: TAG_LIMIT - 1 }, (_, index) => `标签${index}`);
    const result = mergeTags(base, ["新标签", "另一个"]);
    expect(result.tags.length).toBe(TAG_LIMIT);
    expect(result.added).toBe(1);
    expect(result.rejected).toBe(1);
  });
});
