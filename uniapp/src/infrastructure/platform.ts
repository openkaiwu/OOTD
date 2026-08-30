import type { ClockPort, HapticsPort, IdGeneratorPort } from "@/domain/ports";

export const clockPort: ClockPort = { now: () => Date.now() };

export const idGeneratorPort: IdGeneratorPort = {
  create(prefix: string): string {
    return `${prefix}_${clockPort.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },
};

export const hapticsPort: HapticsPort = {
  tap(): void {
    try { uni.vibrateShort({ type: "light" }); } catch { /* Haptics are optional. */ }
  },
};
