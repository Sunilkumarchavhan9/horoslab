"use client";

import { useEffect } from "react";
import { beginPixelLoadingFromClick, shouldSkipPixelButton } from "@/lib/pixel-button-runtime";

/** App-wide: pixel grid flash after button click (runs after handlers, does not block them). */
export function GlobalPixelButtonLoader() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;
      if (shouldSkipPixelButton(button)) return;

      beginPixelLoadingFromClick(button);
    };

    document.addEventListener("click", onClick, false);
    return () => document.removeEventListener("click", onClick, false);
  }, []);

  return null;
}
