import React, { Suspense } from "react"
import type { Metadata } from "next"
import { MissionControlClient } from "./mission-control-client"

export const metadata: Metadata = {
  title: "HOROS Mission Control",
  description: "Launch software-change missions, verify outcomes, and review the evidence trail in one workspace.",
}

export default async function MissionControlPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#151515] text-xs font-mono text-[#788274]">
          Loading HOROS Control Plane...
        </div>
      }
    >
      <MissionControlClient />
    </Suspense>
  )
}
