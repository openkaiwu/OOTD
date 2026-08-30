import { describe, expect, it } from "vitest";
import { createDemoGarments } from "@/domain/demo";
import type { BackupManifest, Outfit } from "@/domain/types";
import { inspectBackupImport, mergeBackupItems, validateBackup } from "./backup";

const outfit = (id: string): Outfit => ({
  id,
  name: id,
  itemIds: [],
  contextSnapshot: { source: "scene", sceneId: "commute", preferredStyleIds: [], preferredColorIds: [], avoidedColorIds: [], excludedOutfitSignatures: [], generatedAt: 1 },
  score: 80,
  reason: "test",
  styleTags: [],
  feedback: "none",
  dislikeReasons: [],
  saved: false,
  wornAtList: [],
  createdAt: 1,
  updatedAt: 1,
  schemaVersion: 2,
});

describe("backup merge", () => {
  it("validates v2 manifests and reports stable-id conflicts", () => {
    const garments = createDemoGarments(1).slice(0, 2);
    const backup: BackupManifest = {
      product: "ootd-uniapp",
      version: 2,
      exportedAt: 1,
      garments,
      outfits: [outfit("one")],
      profile: { nickname: "test", avatarPath: "", description: "", schemaVersion: 2 },
      preferences: { styleIds: [], sceneIds: [], preferredColorIds: [], avoidedColorIds: [], rotateUnderused: true, allowIncomplete: true, negativeWeights: {}, schemaVersion: 1 },
      appMeta: { themeId: "forest", tutorialSeen: true, localFeedback: [], schemaVersion: 1 },
      assets: [{ garmentId: garments[0].id, kind: "image", archivePath: "images/a.jpg" }],
    };
    expect(validateBackup(backup)).toBe(true);
    expect(inspectBackupImport([garments[0]], [outfit("one")], backup)).toEqual({ newGarments: 1, garmentConflicts: 1, newOutfits: 0, outfitConflicts: 1 });
  });

  it("can keep current records or replace same-id records", () => {
    const current = [{ id: "same", value: "current" }, { id: "local", value: "local" }];
    const incoming = [{ id: "same", value: "backup" }, { id: "new", value: "new" }];
    expect(mergeBackupItems(current, incoming, false).find((item) => item.id === "same")?.value).toBe("current");
    expect(mergeBackupItems(current, incoming, true).find((item) => item.id === "same")?.value).toBe("backup");
  });
});
