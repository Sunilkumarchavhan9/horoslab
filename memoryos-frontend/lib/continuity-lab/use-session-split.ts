"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

export const SESSION_SPLIT_STORAGE_KEY =
  "memoryos.continuity-lab.session.splitRatio.v2";

const DEFAULT_CHAT_RATIO = 0.46;
const MIN_CHAT_PX = 300;
const MIN_RAIL_PX = 280;
const MAX_RAIL_RATIO = 0.7;

function readStoredChatRatio(): number {
  if (typeof window === "undefined") return DEFAULT_CHAT_RATIO;
  try {
    const raw = sessionStorage.getItem(SESSION_SPLIT_STORAGE_KEY);
    if (raw == null) return DEFAULT_CHAT_RATIO;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_CHAT_RATIO;
    return parsed;
  } catch {
    return DEFAULT_CHAT_RATIO;
  }
}

function persistChatRatio(ratio: number) {
  try {
    sessionStorage.setItem(SESSION_SPLIT_STORAGE_KEY, String(ratio));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clampChatRatio(ratio: number, containerWidth: number): number {
  if (containerWidth <= 0) return DEFAULT_CHAT_RATIO;

  const minByChatPx = MIN_CHAT_PX / containerWidth;
  const maxByRailPx = 1 - MIN_RAIL_PX / containerWidth;
  const minByRailCap = 1 - MAX_RAIL_RATIO;

  const lower = Math.max(minByChatPx, minByRailCap);
  const upper = Math.min(maxByRailPx, 1);

  if (lower > upper) {
    return Math.min(Math.max(ratio, minByRailCap), maxByRailPx);
  }

  return Math.min(Math.max(ratio, lower), upper);
}

export function useSessionSplit() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Use a deterministic default for SSR + first client render.
  // Stored user preference is applied after mount to avoid hydration mismatch.
  const [chatRatio, setChatRatio] = useState(DEFAULT_CHAT_RATIO);
  const [hydrated, setHydrated] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const preExpandRatioRef = useRef(DEFAULT_CHAT_RATIO);
  const draggingRef = useRef(false);

  useEffect(() => {
    // Apply stored split ratio only after hydration to keep SSR/CSR markup equal.
    const id = requestAnimationFrame(() => {
      setChatRatio(readStoredChatRatio());
      setHydrated(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const applyChatRatio = useCallback((next: number, persist = true) => {
    const container = containerRef.current;
    const width = container?.getBoundingClientRect().width ?? 0;
    const clamped = width > 0 ? clampChatRatio(next, width) : next;
    setChatRatio(clamped);
    if (persist) persistChatRatio(clamped);
    return clamped;
  }, []);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = (clientX - rect.left) / rect.width;
      applyChatRatio(ratio);
    },
    [applyChatRatio],
  );

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (railExpanded) return;
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      updateFromPointer(event.clientX);
    },
    [railExpanded, updateFromPointer],
  );

  const handleDragMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!draggingRef.current || railExpanded) return;
      updateFromPointer(event.clientX);
    },
    [railExpanded, updateFromPointer],
  );

  const handleDragEnd = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    [],
  );

  const toggleRailExpanded = useCallback(() => {
    if (!railExpanded) {
      preExpandRatioRef.current = chatRatio;
      const container = containerRef.current;
      const width = container?.getBoundingClientRect().width ?? 0;
      const maxRail = clampChatRatio(1 - MAX_RAIL_RATIO, width);
      applyChatRatio(maxRail, false);
      setRailExpanded(true);
      return;
    }
    applyChatRatio(preExpandRatioRef.current);
    setRailExpanded(false);
  }, [applyChatRatio, chatRatio, railExpanded]);

  useEffect(() => {
    if (!hydrated) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      setChatRatio((current) => {
        const width = container.getBoundingClientRect().width;
        const clamped = clampChatRatio(current, width);
        if (clamped !== current) persistChatRatio(clamped);
        return clamped;
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [hydrated]);

  const splitStyle = {
    "--session-chat-pane": `${chatRatio * 100}%`,
    "--session-rail-pane": `${(1 - chatRatio) * 100}%`,
  } as CSSProperties;

  return {
    containerRef,
    chatRatio,
    splitStyle,
    railExpanded,
    toggleRailExpanded,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
