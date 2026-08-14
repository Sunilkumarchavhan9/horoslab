"use client";

import { useEffect, useState } from "react";
import { resolveActiveEpochWorkspaceId } from "@/lib/epoch-api";
import { EpochInferenceControlPlane } from "@/components/inference-control/epoch-inference-control-plane";

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
      <div className="flex min-h-screen items-center justify-center bg-white text-[14px] text-[#555]">
        Loading Mission Control...
      </div>
    );
  }

  if (workspaceError || !workspaceId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8 text-[14px] text-red-600">
        {workspaceError || "No active Epoch workspace is available."}
      </div>
    );
  }

  return <EpochInferenceControlPlane workspaceId={workspaceId} />;
}
