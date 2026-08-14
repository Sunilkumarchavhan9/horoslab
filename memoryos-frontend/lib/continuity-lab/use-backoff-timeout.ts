"use client";

import { useCallback, useEffect, useRef } from "react";

export type BackoffPollOptions = {
  enabled: boolean;
  initialMs: number;
  maxMs: number;
  factor?: number;
  runImmediately?: boolean;
};

/**
 * Runs `tick` on a growing delay while `enabled`. Clears on disable/unmount.
 */
export function useBackoffTimeout(
  tick: () => void | Promise<void>,
  options: BackoffPollOptions,
): void {
  const {
    enabled,
    initialMs,
    maxMs,
    factor = 1.4,
    runImmediately = true,
  } = options;

  const tickRef = useRef(tick);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const clearScheduled = useCallback((timerRef: { current: ReturnType<typeof setTimeout> | null }) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const timerRef = { current: null as ReturnType<typeof setTimeout> | null };
    let delayMs = initialMs;
    let cancelled = false;

    const schedule = () => {
      clearScheduled(timerRef);
      timerRef.current = setTimeout(() => {
        void (async () => {
          if (cancelled || !enabled) return;
          await tickRef.current();
          if (cancelled || !enabled) return;
          delayMs = Math.min(Math.round(delayMs * factor), maxMs);
          schedule();
        })();
      }, delayMs);
    };

    if (!enabled) {
      return () => {
        cancelled = true;
        clearScheduled(timerRef);
      };
    }

    delayMs = initialMs;
    if (runImmediately) {
      queueMicrotask(() => {
        void Promise.resolve(tickRef.current()).finally(() => {
          if (!cancelled && enabled) schedule();
        });
      });
    } else {
      schedule();
    }

    return () => {
      cancelled = true;
      clearScheduled(timerRef);
    };
  }, [clearScheduled, enabled, factor, initialMs, maxMs, runImmediately]);
}
