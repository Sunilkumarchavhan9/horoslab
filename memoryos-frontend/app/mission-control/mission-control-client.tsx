"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { resolveActiveEpochWorkspaceId } from "@/lib/epoch-api";

const EpochInferenceControlPlane = dynamic(
  () =>
    import("@/components/inference-control/epoch-inference-control-plane").then(
      (mod) => mod.EpochInferenceControlPlane
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#151515] text-xs font-mono text-[#788274]">
        Loading Epoch Control Plane...
      </div>
    ),
  }
);

export function MissionControlClient() {
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrapWorkspace = async () => {
      try {
        const workspaceId = await resolveActiveEpochWorkspaceId();
        if (workspaceId && !cancelled) setWorkspaceId(workspaceId);
        if (!workspaceId && !cancelled) {
          setWorkspaceError("Unable to resolve an Epoch workspace for this account.");
        }
      } catch (error) {
        if (!cancelled) {
          setWorkspaceError(error instanceof Error ? error.message : "Failed to resolve the Epoch workspace.");
        }
      } finally {
        if (!cancelled) {
          setWorkspaceReady(true);
        }
      }
    };

    void bootstrapWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!workspaceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#151515] text-xs font-mono text-[#788274]">
        Loading Mission Control...
      </div>
    );
  }

  if (workspaceError || !workspaceId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#151515] p-8 text-xs font-mono text-red-500">
        {workspaceError || "No active Epoch workspace is available."}
      </div>
    );
  }

  return <EpochInferenceControlPlane workspaceId={workspaceId} />;
}
