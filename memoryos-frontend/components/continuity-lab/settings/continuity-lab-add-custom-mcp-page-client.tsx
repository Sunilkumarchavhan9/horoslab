"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const ContinuityLabAddCustomMcpPage = dynamic(
  () =>
    import("@/components/continuity-lab/settings/continuity-lab-add-custom-mcp").then(
      (m) => m.ContinuityLabAddCustomMcpPage,
    ),
  { ssr: false, loading: () => null },
);

export function ContinuityLabAddCustomMcpPageClient() {
  return (
    <Suspense fallback={null}>
      <ContinuityLabAddCustomMcpPage />
    </Suspense>
  );
}
