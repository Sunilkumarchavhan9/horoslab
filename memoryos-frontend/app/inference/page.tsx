import React, { Suspense } from "react";
import type { Metadata } from "next";
import { InferencePageClient } from "@/components/inference-control/inference-page-client";

export const metadata: Metadata = {
  title: "HOROS — AI Infrastructure Control Plane",
  description:
    "An intelligent runtime for discovering, optimizing, deploying, observing, and governing AI capabilities.",
};

export default function InferencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fbfbfa] text-xs font-mono text-[#788274]">
          Loading HOROS Control Plane...
        </div>
      }
    >
      <InferencePageClient />
    </Suspense>
  );
}
