"use client";

import { ProvidersView } from "../perspectives/providers/ProvidersView";
import { ModelsView } from "../perspectives/models/ModelsView";
import { WorkersView } from "../perspectives/workers/WorkersView";
import { RoutingView } from "../perspectives/routing/RoutingView";
import { GpuStatusView } from "../perspectives/gpu/GpuStatusView";
import { ProviderHealthView } from "../perspectives/provider-health/ProviderHealthView";
import { CostsView } from "../perspectives/costs/CostsView";
import { FailoversView } from "../perspectives/failovers/FailoversView";
import { CapabilityMatrixView } from "../perspectives/capability/CapabilityMatrixView";

export function AiExecutionWorkspace({ activeSection, workspaceId }: { activeSection: string; workspaceId?: string | null }) {
  const view = activeSection.replace("ai-execution-", "");

  if (view === "providers") return <ProvidersView workspaceId={workspaceId} />;
  if (view === "models") return <ModelsView workspaceId={workspaceId} />;
  if (view === "workers") return <WorkersView workspaceId={workspaceId} />;
  if (view === "routing") return <RoutingView workspaceId={workspaceId} />;
  if (view === "gpu") return <GpuStatusView workspaceId={workspaceId} />;
  if (view === "health") return <ProviderHealthView workspaceId={workspaceId} />;
  if (view === "costs") return <CostsView workspaceId={workspaceId} />;
  if (view === "failovers") return <FailoversView workspaceId={workspaceId} />;
  if (view === "capabilities") return <CapabilityMatrixView workspaceId={workspaceId} />;

  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
      <p>AI Execution view not found: {view}</p>
    </div>
  );
}
