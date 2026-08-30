import type { Garment, Outfit } from "@/domain/types";
import type { SharePort } from "@/domain/ports";
import { translate } from "@/i18n";

declare const plus: { share: { sendWithSystem: (options: { content: string }, success?: () => void, fail?: (error: unknown) => void) => void } };

interface NativeShareBridge { shareText?: (content: string) => boolean; sharePlainText?: (content: string) => boolean }

export function outfitShareText(outfit: Outfit, garments: Garment[]): string {
  const names = outfit.itemIds.map((id) => garments.find((item) => item.id === id)?.name).filter((name): name is string => Boolean(name)).map((name) => translate(name)).join("、");
  return `OOTD · ${translate("穿搭推荐")}\n${translate(outfit.name)}\n${names}\n${translate(outfit.reason)}`;
}

export function systemShareText(content: string, includeInstaller = true): Promise<void> {
  // Android 预览壳是 WebView，而非 uni-app APP-PLUS 运行时；通过原生桥打开
  // ACTION_SEND 系统分享面板。浏览器预览仍退回复制文本。
  const bridge = typeof window === "undefined" ? undefined : (window as unknown as { OOTDNative?: NativeShareBridge }).OOTDNative;
  const send = includeInstaller ? bridge?.shareText : bridge?.sharePlainText;
  if (send) {
    try {
      if (send(content)) return Promise.resolve();
      return Promise.reject(new Error("system share unavailable"));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  // #ifdef APP-PLUS
  return new Promise((resolve, reject) => plus.share.sendWithSystem({ content }, resolve, reject));
  // #endif
  // #ifndef APP-PLUS
  return new Promise((resolve, reject) => uni.setClipboardData({ data: content, success: () => resolve(), fail: reject }));
  // #endif
}

export function shareOutfit(outfit: Outfit, garments: Garment[]): Promise<void> {
  return systemShareText(outfitShareText(outfit, garments));
}

export const sharePort: SharePort = { share: shareOutfit };
