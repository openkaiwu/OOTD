import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createDemoGarments } from "@/domain/demo";

const mocks = vi.hoisted(() => ({
  garments: [] as ReturnType<typeof createDemoGarments>,
  removeSavedFile: vi.fn(async () => undefined),
}));

vi.mock("@/infrastructure/repositories", () => ({
  repositories: {
    listGarments: () => mocks.garments.map((item) => ({ ...item })),
    saveGarments: (items: ReturnType<typeof createDemoGarments>) => { mocks.garments = items.map((item) => ({ ...item })); },
    getDraft: () => null,
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
    clearAll: vi.fn(),
  },
}));
vi.mock("@/infrastructure/media", () => ({ removeSavedFile: mocks.removeSavedFile }));
vi.mock("@/infrastructure/events", () => ({ logEvent: vi.fn() }));
vi.mock("@/infrastructure/platform", () => ({ hapticsPort: { tap: vi.fn() } }));

import { useWardrobeStore } from "./wardrobe";

describe("wardrobe deletion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    mocks.garments = createDemoGarments(1_722_900_000_000);
    mocks.removeSavedFile.mockClear();
  });

  afterEach(() => vi.useRealTimers());

  it("soft deletes a batch and restores the whole batch during the undo window", () => {
    const store = useWardrobeStore();
    store.hydrate();
    const ids = store.activeGarments.slice(0, 3).map((item) => item.id);

    expect(store.softDeleteMany(ids)).toHaveLength(3);
    expect(store.activeGarments).toHaveLength(97);
    expect(store.pendingDeleteNotice?.ids).toEqual(ids);

    expect(store.restoreMany()).toBe(3);
    expect(store.activeGarments).toHaveLength(100);
    expect(store.pendingDeleteNotice).toBeNull();
  });

  it("permanently removes files after five seconds", async () => {
    const store = useWardrobeStore();
    store.hydrate();
    const target = store.activeGarments[0];

    store.softDelete(target.id);
    await vi.advanceTimersByTimeAsync(5000);

    expect(store.garments.some((item) => item.id === target.id)).toBe(false);
    expect(store.pendingDeleteNotice).toBeNull();
    expect(mocks.removeSavedFile).toHaveBeenCalledWith(target.imagePath);
  });
});
