"use client";

import { useEffect, useState } from "react";
import { resolveActiveDhyraWorkspaceId } from "@/lib/dhyra-api";
import { DhyraInferenceControlPlane } from "./dhyra-inference-control-plane";

export function InferencePageClient() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void resolveActiveDhyraWorkspaceId()
      .then((resolvedWorkspaceId) => {
        if (!cancelled) {
          if (resolvedWorkspaceId) setWorkspaceId(resolvedWorkspaceId);
          else setError("Unable to resolve an Dhyra workspace for this account.");
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Failed to resolve the Dhyra workspace.");
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
        Loading Dhyra Control Plane...
      </div>
    );
  }

  return <DhyraInferenceControlPlane workspaceId={workspaceId} />;
}
