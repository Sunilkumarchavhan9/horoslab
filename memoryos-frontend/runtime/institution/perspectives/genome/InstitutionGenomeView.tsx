"use client";

import { Dna, Fingerprint, Activity, BrainCircuit, ShieldAlert, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstitutionStore } from "../../store";
import { useInstitutionRuntimeData } from "../../runtime/institution-runtime-data";

export function InstitutionGenomeView() {
  const { selectEntity, selectedEntity } = useInstitutionStore();
  const { genome, loading, error, refresh } = useInstitutionRuntimeData();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Core":
        return Fingerprint;
      case "Behavior":
        return Activity;
      case "Operations":
        return Dna;
      case "Cognition":
        return BrainCircuit;
      default:
        return Dna;
    }
  };

  const categories = Array.from(new Set(genome.map((trait) => trait.category)));

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
            <Dna className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Institution Genome</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Live institutional traits derived from the backend.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col w-full overflow-y-auto bg-background">
        <div className="flex items-start gap-4 px-8 py-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500">
          <ShieldAlert className="size-5 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <h3 className="text-[13px] font-bold uppercase tracking-wider">Backend-derived traits</h3>
            <p className="text-[13px] mt-1 font-medium">These genome traits are composed from live institution, mission, integration, and memory data.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground">Loading live genome traits...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {categories.map((category) => {
              const traits = genome.filter((trait) => trait.category === category);
              const Icon = getCategoryIcon(category);

              return (
                <div key={category} className="flex flex-col w-full">
                  <div className="px-8 py-3 bg-muted/30 border-b border-border flex items-center gap-2 sticky top-0 z-10">
                    <Icon className="size-4 text-muted-foreground" />
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{category} Traits</h2>
                  </div>

                  <div className="flex flex-col divide-y divide-border">
                    {traits.map((trait) => (
                      <div
                        key={trait.id}
                        onClick={() => selectEntity(trait.id)}
                        className={cn(
                          "flex items-stretch text-left transition-all group w-full cursor-pointer",
                          selectedEntity === trait.id ? "bg-muted/30" : "bg-card hover:bg-muted/20",
                        )}
                      >
                        <div className="flex flex-col justify-center px-8 py-5 w-[300px] shrink-0 border-r border-border/50">
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="text-[14px] font-bold group-hover:text-blue-500 transition-colors tracking-tight">{trait.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-sm border border-border">{trait.id}</span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center px-8 py-5 w-[250px] shrink-0 border-r border-border/50 bg-muted/5">
                          <span className="text-[16px] text-foreground font-bold font-mono tracking-tight">{trait.value}</span>
                        </div>

                        <div className="flex items-center justify-between px-8 py-5 flex-1 relative">
                          <p className="text-[13px] text-muted-foreground leading-relaxed pr-8">{trait.description}</p>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="size-4 text-blue-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
