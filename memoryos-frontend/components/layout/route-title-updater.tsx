"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RouteTitleUpdater() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === "/") {
      document.title = "HOROS";
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment) {
      document.title = `HOROS | ${lastSegment}`;
    }
  }, [pathname]);

  return null;
}
