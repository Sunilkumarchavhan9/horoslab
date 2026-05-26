import type { PixelLoadTone } from "@/components/ui/pixel-load-overlay";

const PIXEL_COLS = 24;
const PIXEL_ROWS = 5;
const CLICK_FLASH_CLASS = "pixel-load-btn--click-flash";

/** Brief pixel flash on any button click (global handler). */
export const PIXEL_CLICK_AUTO_CLEAR_MS = 1_100;
/** Minimum time the overlay stays visible so the animation reads. */
export const PIXEL_CLICK_MIN_MS = 360;
/** Max time for explicit async loading (connect, verify, etc.). */
export const PIXEL_PERSIST_MAX_MS = 45_000;

type ActiveLoad = {
  attrObserver: MutationObserver;
  disabledObserver: MutationObserver;
  maxTimer: number;
  autoTimer?: number;
  startedAt: number;
  reposition?: () => void;
};

const activeLoads = new WeakMap<HTMLButtonElement, ActiveLoad>();
const overlayHosts = new WeakMap<HTMLButtonElement, HTMLDivElement>();
const clickFlashTimers = new WeakMap<HTMLButtonElement, number>();

export function inferPixelToneFromClassName(className: string): PixelLoadTone {
  if (
    /bg-\[#111827\]|bg-primary|text-primary-foreground|text-white|connector-action-btn--disconnect/.test(
      className,
    )
  ) {
    return "dark";
  }
  if (/bg-white|bg-\[#F9FAFB\]|bg-\[#F3F4F6\]|bg-background|text-\[#374151\]/.test(className)) {
    return "light";
  }
  return "muted";
}

export function inferPixelTone(button: HTMLButtonElement): PixelLoadTone {
  const className = button.className;
  if (
    /bg-\[#111827\]|bg-primary|text-primary-foreground|text-white|connector-action-btn--disconnect/.test(
      className,
    )
  ) {
    return "dark";
  }
  if (/bg-white|bg-\[#F9FAFB\]|bg-\[#F3F4F6\]|bg-background|text-\[#374151\]/.test(className)) {
    return "light";
  }

  const bg = getComputedStyle(button).backgroundColor;
  const match = bg.match(/[\d.]+/g);
  if (match && match.length >= 3) {
    const lum = 0.299 * Number(match[0]) + 0.587 * Number(match[1]) + 0.114 * Number(match[2]);
    return lum < 145 ? "dark" : "light";
  }
  return "muted";
}

function createPixelOverlayElement(tone: PixelLoadTone): HTMLSpanElement {
  const overlay = document.createElement("span");
  overlay.className = `pixel-load-overlay pixel-load-overlay--${tone}`;
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("data-pixel-overlay", "true");

  for (let index = 0; index < PIXEL_COLS * PIXEL_ROWS; index += 1) {
    const cell = document.createElement("span");
    cell.className = "pixel-load-overlay__cell";
    cell.style.animationDelay = `${(index % PIXEL_COLS) * 42 + Math.floor(index / PIXEL_COLS) * 76}ms`;
    overlay.appendChild(cell);
  }

  return overlay;
}

function syncOverlayHostPosition(button: HTMLButtonElement, host: HTMLDivElement) {
  if (!button.isConnected) return;
  const rect = button.getBoundingClientRect();
  host.style.left = `${rect.left}px`;
  host.style.top = `${rect.top}px`;
  host.style.width = `${rect.width}px`;
  host.style.height = `${rect.height}px`;
}

/** Portal overlay on document.body — never mutates button children (avoids React removeChild errors). */
function removePixelOverlay(button: HTMLButtonElement) {
  const host = overlayHosts.get(button);
  if (host?.isConnected) {
    host.remove();
  }
  overlayHosts.delete(button);

  button.querySelectorAll(":scope > .pixel-load-overlay").forEach((node) => {
    if (node.isConnected) node.remove();
  });
}

function attachOverlayReposition(button: HTMLButtonElement, host: HTMLDivElement) {
  const reposition = () => syncOverlayHostPosition(button, host);
  reposition();
  window.addEventListener("scroll", reposition, true);
  window.addEventListener("resize", reposition);
  return () => {
    window.removeEventListener("scroll", reposition, true);
    window.removeEventListener("resize", reposition);
  };
}

export function injectPixelOverlay(button: HTMLButtonElement) {
  if (shouldSkipPixelButton(button)) return;
  if (!button.isConnected) return;
  removePixelOverlay(button);

  const tone = inferPixelTone(button);
  const host = document.createElement("div");
  host.className = "pixel-load-overlay-host";
  host.setAttribute("data-pixel-overlay-host", "true");
  host.style.position = "fixed";
  host.style.pointerEvents = "none";
  host.style.zIndex = "9999";
  host.style.overflow = "hidden";
  host.appendChild(createPixelOverlayElement(tone));
  syncOverlayHostPosition(button, host);
  document.body.appendChild(host);
  overlayHosts.set(button, host);
}

function clearClickFlash(button: HTMLButtonElement) {
  const timer = clickFlashTimers.get(button);
  if (timer) {
    window.clearTimeout(timer);
    clickFlashTimers.delete(button);
  }
  button.classList.remove(CLICK_FLASH_CLASS);
  if (button.dataset.pixelPersist !== "true" && !button.hasAttribute("data-pixel-loading")) {
    removePixelOverlay(button);
  }
}

export function clearPixelLoading(button: HTMLButtonElement) {
  clearClickFlash(button);

  const active = activeLoads.get(button);
  if (active) {
    active.attrObserver.disconnect();
    active.disabledObserver.disconnect();
    active.reposition?.();
    window.clearTimeout(active.maxTimer);
    if (active.autoTimer) window.clearTimeout(active.autoTimer);
    activeLoads.delete(button);
  }

  button.classList.remove("pixel-load-btn--loading");
  button.removeAttribute("data-pixel-loading");
  button.removeAttribute("data-pixel-persist");
  button.removeAttribute("aria-busy");
  removePixelOverlay(button);
}

function scheduleActiveLoad(
  button: HTMLButtonElement,
  options: { maxMs: number; minMs: number; autoClearMs?: number },
) {
  const { maxMs, minMs, autoClearMs } = options;
  const startedAt = Date.now();
  let wasDisabled = button.disabled;
  let detachReposition: (() => void) | undefined;

  const host = overlayHosts.get(button);
  if (host) {
    detachReposition = attachOverlayReposition(button, host);
  }

  const tryStop = () => {
    if (!document.body.contains(button)) {
      clearPixelLoading(button);
      return;
    }
    if (Date.now() - startedAt < minMs) return;
    if (button.dataset.pixelPersist === "true") return;
    clearPixelLoading(button);
  };

  const attrObserver = new MutationObserver(() => {
    if (!button.hasAttribute("data-pixel-loading") && !button.hasAttribute("aria-busy")) {
      tryStop();
    }
  });

  const disabledObserver = new MutationObserver(() => {
    if (wasDisabled && !button.disabled) {
      window.setTimeout(tryStop, 120);
    }
    wasDisabled = button.disabled;
  });

  const maxTimer = window.setTimeout(() => {
    if (button.dataset.pixelPersist !== "true") clearPixelLoading(button);
  }, maxMs);

  const autoTimer =
    autoClearMs !== undefined
      ? window.setTimeout(() => {
          if (button.dataset.pixelPersist !== "true") clearPixelLoading(button);
        }, autoClearMs)
      : undefined;

  const previous = activeLoads.get(button);
  if (previous) {
    previous.attrObserver.disconnect();
    previous.disabledObserver.disconnect();
    previous.reposition?.();
    window.clearTimeout(previous.maxTimer);
    if (previous.autoTimer) window.clearTimeout(previous.autoTimer);
  }

  activeLoads.set(button, {
    attrObserver,
    disabledObserver,
    maxTimer,
    autoTimer,
    startedAt,
    reposition: detachReposition,
  });

  attrObserver.observe(button, {
    attributes: true,
    attributeFilter: ["data-pixel-loading", "aria-busy", "disabled", "data-pixel-persist"],
  });
  disabledObserver.observe(button, { attributes: true, attributeFilter: ["disabled"] });
}

/** Short visual flash only — never sets aria-busy (that blocked real clicks). */
export function beginPixelLoadingFromClick(button: HTMLButtonElement) {
  if (shouldSkipPixelButton(button)) return;
  if (button.disabled) return;
  if (button.dataset.pixelPersist === "true") return;
  if (button.hasAttribute("data-pixel-loading")) return;

  clearClickFlash(button);
  button.classList.add("pixel-load-btn", CLICK_FLASH_CLASS);
  injectPixelOverlay(button);

  const timer = window.setTimeout(() => {
    clearClickFlash(button);
  }, PIXEL_CLICK_AUTO_CLEAR_MS);
  clickFlashTimers.set(button, timer);
}

/** Async work — keep animation until cleared or loading=false. */
export function beginPixelLoading(
  button: HTMLButtonElement,
  options?: { maxMs?: number; minMs?: number; autoClearMs?: number },
) {
  if (shouldSkipPixelButton(button)) return;
  clearClickFlash(button);
  button.dataset.pixelPersist = "true";
  button.classList.add("pixel-load-btn", "pixel-load-btn--loading");
  button.setAttribute("data-pixel-loading", "true");
  button.setAttribute("aria-busy", "true");
  injectPixelOverlay(button);

  scheduleActiveLoad(button, {
    maxMs: options?.maxMs ?? PIXEL_PERSIST_MAX_MS,
    minMs: options?.minMs ?? PIXEL_CLICK_MIN_MS,
    autoClearMs: options?.autoClearMs,
  });
}

/** Max button height (px) for pixel animation — skips tall dropdowns / panels. */
const PIXEL_MAX_BUTTON_HEIGHT = 44;

function isProperActionButton(button: HTMLButtonElement): boolean {
  if (button.classList.contains("connector-action-btn")) return true;
  if (button.dataset.pixelAction !== undefined) return true;
  if (button.hasAttribute("data-pixel-action")) return true;
  if (button.closest("[data-pixel-actions]")) return true;
  if (button.matches("[data-slot='button']")) return true;

  const rect = button.getBoundingClientRect();
  if (rect.height > PIXEL_MAX_BUTTON_HEIGHT || rect.width < 8) return false;

  const label = button.textContent?.trim() ?? "";
  if (!label) return false;

  if (/\bh-10\b|\bh-9\b/.test(button.className)) return true;
  if (
    button.className.includes("bg-[#111827]")
    || button.className.includes("bg-[#EF4444]")
    || button.className.includes("bg-primary")
  ) {
    return true;
  }

  return false;
}

export function shouldSkipPixelButton(button: HTMLButtonElement): boolean {
  if (button.disabled) return true;
  if (button.dataset.noPixelLoad !== undefined) return true;
  if (
    button.closest(
      "[data-no-pixel-load], [data-console-sidebar], [data-console-toolbar], [data-console-header-chrome]",
    )
  ) {
    return true;
  }
  if (button.getAttribute("role") === "tab") return true;
  if (button.type === "reset") return true;
  if (button.hasAttribute("aria-expanded") || button.getAttribute("aria-haspopup") === "true") {
    return true;
  }
  if (button.querySelector("svg[class*='rotate-90'], svg[class*='rotate-180']")) {
    return true;
  }
  if (button.closest("nav, aside")) return true;

  return !isProperActionButton(button);
}
