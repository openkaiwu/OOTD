import { describe, expect, it } from "vitest";
import { toLocationFailure } from "./weather";

describe("location failures", () => {
  it("maps platform messages into actionable states", () => {
    expect(toLocationFailure({ errMsg: "getLocation:fail auth deny" }).code).toBe("denied");
    expect(toLocationFailure({ message: "location service disabled" }).code).toBe("disabled");
    expect(toLocationFailure(new Error("request timeout")).code).toBe("timeout");
    expect(toLocationFailure({ message: "location unavailable" }).code).toBe("unavailable");
  });
});
