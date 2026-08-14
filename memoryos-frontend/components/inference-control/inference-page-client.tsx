"use client";

import { useEffect, useState } from "react";
import { resolveActiveEpochWorkspaceId } from "@/lib/epoch-api";
import { EpochInferenceControlPlane } from "./epoch-inference-control-plane";

export function InferencePageClient() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void resolveActiveEpochWorkspaceId()
      .then((resolvedWorkspaceId) => {
        if (!cancelled) {
          if (resolvedWorkspaceId) setWorkspaceId(resolvedWorkspaceId);
          else setError("Unable to resolve an Epoch workspace for this account.");
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Failed to resolve the Epoch workspace.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className="flex min-h-screen items-center justify-center p-8 text-sm text-red-600">{error}</div>;
  }

  if (!workspaceId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbfa] text-xs font-mono text-[#788274]">
        Loading Epoch Control Plane...
      </div>
    );
  }

  return <EpochInferenceControlPlane workspaceId={workspaceId} />;
}
