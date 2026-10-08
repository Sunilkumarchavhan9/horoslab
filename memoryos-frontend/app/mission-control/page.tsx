import React, { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { isClerkEnabled } from "@/lib/clerk"
import { redirect } from "next/navigation"
import { MissionControlClient } from "./mission-control-client"

export const metadata: Metadata = {
  title: "HOROS Mission Control",
  description: "Launch software-change missions, verify outcomes, and review the evidence trail in one workspace.",
}

export default async function MissionControlPage() {
  if (isClerkEnabled()) {
    const { userId } = await auth()
    if (!userId) {
      redirect("/auth/sign-in?next=/mission-control")
    }
  }

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
