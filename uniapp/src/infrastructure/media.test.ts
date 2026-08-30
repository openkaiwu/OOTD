import { describe, expect, it } from "vitest";
import { isMediaPermissionDenied, isMediaSelectionCancelled } from "./media";

describe("media selection errors", () => {
  it("distinguishes user cancellation from a real failure", () => {
    expect(isMediaSelectionCancelled({ errMsg: "chooseImage:fail cancel" })).toBe(true);
    expect(isMediaSelectionCancelled({ errMsg: "chooseImage:fail file not found" })).toBe(false);
  });

  it("detects camera permission denial", () => {
    expect(isMediaPermissionDenied({ errMsg: "chooseMedia:fail auth deny" })).toBe(true);
    expect(isMediaPermissionDenied(new Error("camera permission denied"))).toBe(true);
    expect(isMediaPermissionDenied(new Error("camera unavailable"))).toBe(false);
  });
});
