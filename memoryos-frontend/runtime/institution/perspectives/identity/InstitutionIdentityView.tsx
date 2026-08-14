"use client";

import { Building, GitBranch, Target, Zap, Activity, CheckCircle2, Shield, Settings2, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstitutionStore } from "../../store";
import { useInstitutionRuntimeData } from "../../runtime/institution-runtime-data";

export function InstitutionIdentityView() {
  const { selectEntity, selectedEntity } = useInstitutionStore();
  const { identity, loading, error, refresh } = useInstitutionRuntimeData();

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center justify-between px-8 py-8 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-6">
          <div className="size-16 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
            <Building className="size-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[24px] font-bold leading-none tracking-tight">{identity.name}</h1>
            <div className="flex items-center gap-4 text-[13px] text-muted-foreground font-mono flex-wrap">
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-sm">
                <GitBranch className="size-3.5" /> {identity.version}
              </span>
              <span className={cn("uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1.5", error ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500")}>
                {error ? <Shield className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                {error ? "backend issue" : "live backend"}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3.5" />
                {identity.owners.length} Owners
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex items-center gap-2 bg-muted/50 border border-border text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted transition-colors"
          >
            <RefreshCw className="size-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 bg-muted/50 border border-border text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted transition-colors">
            <Settings2 className="size-4" /> Edit Identity
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-[13px] text-muted-foreground">Loading live institution identity...</div>
      ) : error ? (
        <div className="flex items-start gap-3 px-8 py-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <h3 className="text-[13px] font-bold uppercase tracking-wider">Backend unavailable</h3>
            <p className="text-[13px] mt-1 font-medium">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col w-full overflow-y-auto">
        <div className="flex w-full divide-x divide-border border-b border-border">
          <div className="flex flex-col gap-4 p-8 flex-1 bg-muted/10">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="size-4" /> Core Mission
            </h2>
            <p className="text-[15px] leading-relaxed font-medium text-foreground">{identity.mission}</p>
          </div>
          <div className="flex flex-col gap-4 p-8 flex-1 bg-muted/10">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap className="size-4" /> Purpose
            </h2>
            <p className="text-[15px] leading-relaxed font-medium text-foreground">{identity.purpose}</p>
          </div>
        </div>

        <div className="flex w-full divide-x divide-border border-b border-border">
          {[
            { label: "Live Missions", value: `${identity.capabilities.find((cap) => cap.id === "cap-missions")?.description?.match(/\d+/)?.[0] ?? "0"}`, trend: "Backend", icon: Activity },
            { label: "Connected Integrations", value: `${identity.capabilities.find((cap) => cap.id === "cap-integrations")?.description?.match(/\d+/)?.[0] ?? "0"}`, trend: "Live", icon: CheckCircle2 },
            { label: "Memory Records", value: `${identity.capabilities.find((cap) => cap.id === "cap-memory")?.description?.match(/\d+/)?.[0] ?? "0"}`, trend: "Traceable", icon: GitBranch },
          ].map((metric) => (
            <div key={metric.label} className="flex flex-col gap-3 p-8 flex-1 group bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground">
                <metric.icon className="size-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{metric.label}</span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-[32px] font-bold font-mono leading-none tracking-tight text-foreground">{metric.value}</span>
                <span className="text-[13px] text-muted-foreground font-medium font-mono">{metric.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex w-full min-h-[400px] divide-x divide-border">
          <div className="flex flex-col flex-1 bg-background">
            <div className="px-8 py-4 bg-muted/30 border-b border-border sticky top-0">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Declared Capabilities</h2>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {identity.capabilities.map((cap) => (
                <div
                  key={cap.id}
                  onClick={() => selectEntity(cap.id)}
                  className={cn(
                    "flex items-center justify-between px-8 py-5 text-left transition-all group w-full cursor-pointer",
                    selectedEntity === cap.id ? "bg-muted/30" : "bg-card hover:bg-muted/20",
                  )}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[14px] font-bold text-foreground group-hover:text-blue-500 transition-colors">{cap.name}</span>
                    <span className="text-[13px] text-muted-foreground">{cap.description}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border">{cap.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col flex-1 bg-background">
            <div className="px-8 py-4 bg-muted/30 border-b border-border sticky top-0">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">System Dependencies</h2>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {identity.dependencies.map((dep) => (
                <div key={dep.id} className="flex flex-col gap-2 px-8 py-5 bg-card hover:bg-muted/20 transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-foreground group-hover:text-blue-500 transition-colors">{dep.name}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                        dep.status === "healthy"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20",
                      )}
                    >
                      {dep.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-muted-foreground">Type: {dep.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
