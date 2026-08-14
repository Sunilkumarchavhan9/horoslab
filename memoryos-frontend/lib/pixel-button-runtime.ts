import type { PixelLoadTone } from "@/components/ui/pixel-load-overlay";

export const PIXEL_CLICK_AUTO_CLEAR_MS = 0;
export const PIXEL_CLICK_MIN_MS = 0;
export const PIXEL_PERSIST_MAX_MS = 0;

export function inferPixelToneFromClassName(_className: string): PixelLoadTone {
  return "dark";
}

export function inferPixelTone(_button: HTMLButtonElement): PixelLoadTone {
  return "dark";
}

export function injectPixelOverlay(_button: HTMLButtonElement) {
  // Disabled
}

export function clearPixelLoading(_button: HTMLButtonElement) {
  // Disabled
}

export function beginPixelLoadingFromClick(_button: HTMLButtonElement) {
  // Disabled
}

export function beginPixelLoading(_button: HTMLButtonElement, _options?: { maxMs?: number; minMs?: number; autoClearMs?: number }) {
  // Disabled
}

export function shouldSkipPixelButton(_button: HTMLButtonElement): boolean {
  return true;
}
