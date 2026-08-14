"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, BarChart, ShieldCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentStore } from "../../store";
import { listProductAgents, type ProductAgent } from "@/lib/product-agent-api";

type CapabilityGroup = {
  agent: ProductAgent;
  allowedTools: string[];
};

export function AgentsCapabilitiesView() {
  const { selectEntity, selectedEntity } = useAgentStore();
  const [agents, setAgents] = useState<ProductAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      setAgents(await listProductAgents());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load capabilities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  const capabilityGroups = useMemo<CapabilityGroup[]>(
    () => agents.map((agent) => ({ agent, allowedTools: agent.allowedTools })),
    [agents],
  );

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border dark:border-[#333]">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-none">Agent Capabilities</h1>
            <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">
              Live tools and permissions published by the backend agent registry.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadAgents()}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#111] dark:bg-white text-white dark:text-foreground rounded-md text-[12px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col w-full overflow-y-auto">
        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">Loading live capabilities...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500">{error}</div>
        ) : capabilityGroups.length === 0 ? (
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">No product agent capabilities are available yet.</div>
        ) : (
          capabilityGroups.map(({ agent, allowedTools }) => (
            <div key={agent.id} className="flex flex-col w-full">
              <div className="px-8 py-4 bg-muted/50 dark:bg-[#1a1a1a] border-b border-border dark:border-[#333] flex items-center justify-between gap-4">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">
                  {agent.name} Capabilities
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground dark:text-muted-foreground">
                  {allowedTools.length} tools
                </span>
              </div>
              <div className="flex flex-col divide-y divide-[#eee] dark:divide-[#333] border-b border-border dark:border-[#333]">
                {allowedTools.map((tool, index) => (
                  <div
                    key={`${agent.id}-${tool}-${index}`}
                    onClick={() => selectEntity(agent.id)}
                    className={cn(
                      "flex items-center justify-between px-8 py-6 transition-all cursor-pointer group hover:bg-muted/50 dark:hover:bg-[#1a1a1a]",
                      selectedEntity === agent.id ? "bg-muted/50 dark:bg-[#1a1a1a]" : "bg-card dark:bg-[#111]",
                    )}
                  >
                    <div className="flex flex-col gap-1 w-1/2">
                      <span className="text-[15px] font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground dark:text-muted-foreground uppercase bg-[#eee] dark:bg-[#222] px-2 py-0.5 w-fit">
                        {agent.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-12 w-1/2 justify-end">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                          <ShieldCheck className="size-3" /> Scope
                        </span>
                        <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">
                          {agent.defaultProjectScope ? "Default project scope" : "Explicit authorization"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground flex items-center gap-1.5">
                          <BarChart className="size-3" /> Type
                        </span>
                        <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">Allowed tool</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
