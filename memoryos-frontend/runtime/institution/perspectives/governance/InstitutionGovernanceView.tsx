"use client";

import { Activity, AlertTriangle, ArrowRight, FileText, History, RefreshCw, Scale, ShieldCheck, Target, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstitutionStore } from "../../store";
import { useInstitutionRuntimeData } from "../../runtime/institution-runtime-data";

export function InstitutionGovernanceView() {
  const { selectEntity, selectedEntity } = useInstitutionStore();
  const { governance, loading, error, refresh } = useInstitutionRuntimeData();

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
            <Scale className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Institution Governance</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Live authority policies loaded from the backend.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border"
        >
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-[13px] text-muted-foreground">Loading live governance policies...</div>
      ) : error ? (
        <div className="flex items-start gap-3 px-8 py-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <h3 className="text-[13px] font-bold uppercase tracking-wider">Backend unavailable</h3>
            <p className="text-[13px] mt-1 font-medium">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col w-full h-full overflow-hidden bg-background">
        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="flex-[1.5] flex items-center gap-2">
            <Scale className="size-3.5" /> Policy
          </div>
          <div className="flex-1 flex items-center gap-2">
            <Target className="size-3.5" /> Scope
          </div>
          <div className="flex-[2] flex items-center gap-2">
            <FileText className="size-3.5" /> Rules
          </div>
          <div className="flex-1 flex items-center gap-2">
            <ShieldCheck className="size-3.5" /> Verification
          </div>
          <div className="w-[100px] flex items-center gap-2">
            <Box className="size-3.5" /> Agents
          </div>
          <div className="w-[100px] flex items-center gap-2">
            <Activity className="size-3.5" /> Evidence
          </div>
        </div>

        <div className="flex flex-col overflow-y-auto divide-y divide-border">
          {governance.length === 0 ? (
            <div className="p-8 text-[13px] text-muted-foreground">No authority policies were returned for the current institution.</div>
          ) : (
            governance.map((policy) => (
              <div
                key={policy.id}
                onClick={() => selectEntity(policy.id)}
                className={cn(
                  "flex items-stretch transition-all relative overflow-hidden group w-full cursor-pointer",
                  selectedEntity === policy.id ? "bg-muted/30" : "bg-card hover:bg-muted/20",
                )}
              >
                <div className="flex-[1.5] p-6 pr-8 border-r border-border/50 flex flex-col justify-center gap-2">
                  <span className="text-[15px] font-bold text-foreground group-hover:text-blue-500 transition-colors">{policy.name}</span>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-sm w-fit border border-border">{policy.id}</span>
                  <button className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 mt-2 hover:text-foreground transition-colors">
                    <History className="size-3" /> View History
                  </button>
                </div>

                <div className="flex-1 p-6 pr-8 border-r border-border/50 flex flex-col justify-center">
                  <span className="text-[13px] font-medium text-foreground">{policy.scope}</span>
                </div>

                <div className="flex-[2] p-6 pr-8 border-r border-border/50 flex flex-col justify-center">
                  <ul className="text-[12px] list-disc pl-4 flex flex-col gap-1.5 text-muted-foreground">
                    {policy.rules.length > 0 ? policy.rules.map((rule, index) => <li key={index}>{rule}</li>) : <li>No rule text was provided by the backend.</li>}
                  </ul>
                </div>

                <div className="flex-1 p-6 pr-8 border-r border-border/50 flex flex-col justify-center">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-500 font-bold font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 w-fit rounded-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {policy.verification}
                  </span>
                </div>

                <div className="w-[100px] p-6 border-r border-border/50 flex flex-col justify-center items-center">
                  <span className="text-[20px] font-bold font-mono text-foreground leading-none">{policy.affectedAgents}</span>
                </div>

                <div className="w-[100px] p-6 flex flex-col justify-center items-center relative">
                  <span className="text-[20px] font-bold font-mono text-foreground leading-none">{policy.evidenceCount}</span>
                  <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="size-4 text-blue-500" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
