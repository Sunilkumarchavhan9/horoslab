"use client";

import { useEffect } from "react";

export function GlobalScrollbar() {
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      document.documentElement.classList.add("is-scrolling");
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.documentElement.classList.remove("is-scrolling");
      }, 800);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // If mouse is within 24px of the right edge, consider it hovering the scrollbar area
      if (window.innerWidth - e.clientX <= 24) {
        document.documentElement.classList.add("is-scrollbar-hover");
      } else {
        document.documentElement.classList.remove("is-scrollbar-hover");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return null;
}
