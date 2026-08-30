import { describe, expect, it } from "vitest";
import { createDemoGarments } from "@/domain/demo";
import { AppRepositories } from "./repositories";
import { MemoryKeyValueStorage } from "./storage";

describe("repositories", () => {
  it("persists versioned garment metadata without platform APIs", () => {
    const repositories = new AppRepositories(new MemoryKeyValueStorage());
    repositories.saveGarments(createDemoGarments());
    expect(repositories.listGarments()).toHaveLength(100);
    expect(repositories.listGarments()[0].schemaVersion).toBe(2);
  });

  it("clears all namespaced records", () => {
    const repositories = new AppRepositories(new MemoryKeyValueStorage());
    repositories.saveGarments(createDemoGarments());
    repositories.savePreferences({ ...repositories.getPreferences(), rotateUnderused: false });
    repositories.saveAppMeta({ ...repositories.getAppMeta(), themeId: "forest", tutorialSeen: true });
    repositories.clearAll();
    expect(repositories.listGarments()).toEqual([]);
    expect(repositories.getPreferences().rotateUnderused).toBe(true);
    expect(repositories.getAppMeta().themeId).toBe("dream");
  });

  it("normalizes and persists app theme and local feedback", () => {
    const repositories = new AppRepositories(new MemoryKeyValueStorage());
    repositories.saveAppMeta({ themeId: "ins", tutorialSeen: true, localFeedback: [{ id: "one", category: "功能建议", content: "test", createdAt: 1, status: "local" }], schemaVersion: 1 });
    expect(repositories.getAppMeta()).toMatchObject({ themeId: "ins", tutorialSeen: true });
    expect(repositories.getAppMeta().localFeedback).toHaveLength(1);
  });
});
