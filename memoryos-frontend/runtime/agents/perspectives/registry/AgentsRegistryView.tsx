"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, ShieldCheck, Box, Fingerprint, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentStore } from "../../store";
import { listProductAgents, type ProductAgent } from "@/lib/product-agent-api";

export function AgentsRegistryView() {
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
      setError(err instanceof Error ? err.message : "Failed to load the live agent registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  const totalTools = useMemo(() => agents.reduce((sum, agent) => sum + agent.allowedTools.length, 0), [agents]);

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border dark:border-[#333]">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
            <Brain className="size-4" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold leading-none">Agent Registry</h1>
            <p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">
              Live product agents exposed by the backend registry.
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

      <div className="flex items-center gap-6 px-8 py-4 border-b border-border dark:border-[#333] bg-muted/50 dark:bg-[#1a1a1a] text-[12px]">
        <span className="font-mono text-muted-foreground dark:text-muted-foreground">{agents.length} agents</span>
        <span className="font-mono text-muted-foreground dark:text-muted-foreground">{totalTools} allowed tools</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Backend wired</span>
      </div>

      <div className="flex flex-col w-full overflow-y-auto divide-y divide-[#eee] dark:divide-[#333]">
        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">Loading live agents...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500">{error}</div>
        ) : agents.length === 0 ? (
          <div className="p-8 text-[13px] text-muted-foreground dark:text-muted-foreground">No product agents are registered yet.</div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => selectEntity(agent.id)}
              className={cn(
                "flex flex-col p-8 transition-all cursor-pointer group hover:bg-muted/50 dark:hover:bg-[#1a1a1a]",
                selectedEntity === agent.id ? "bg-muted/50 dark:bg-[#1a1a1a]" : "bg-card dark:bg-[#111]",
              )}
            >
              <div className="flex items-center justify-between border-b border-border dark:border-[#333] pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-[#eee] dark:bg-[#222] flex items-center justify-center shrink-0">
                    <Box className="size-5 text-foreground dark:text-[#eee]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[18px] font-bold">{agent.name}</span>
                    <span className="text-[12px] text-muted-foreground dark:text-muted-foreground flex items-center gap-2 font-mono">
                      <Fingerprint className="size-3" /> {agent.id}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="size-3" /> Live Registry
                </span>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Description</span>
                  <p className="text-[14px] font-medium leading-relaxed text-foreground/90 dark:text-[#eee]">
                    {agent.description}
                  </p>
                </div>

                <div className="flex flex-col gap-4 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Allowed Tools</span>
                  <div className="flex flex-wrap gap-2">
                    {agent.allowedTools.map((tool) => (
                      <div key={tool} className="flex items-center gap-2 bg-[#eee] dark:bg-[#222] px-3 py-1.5 text-[12px]">
                        <span className="font-bold">{tool}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[12px] text-muted-foreground dark:text-muted-foreground bg-muted/50 dark:bg-[#1a1a1a] p-4 mt-6 border border-border dark:border-[#333]">
                <Clock className="size-4" /> {agent.defaultProjectScope ? "Default project scope enabled" : "Scoped access only"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
