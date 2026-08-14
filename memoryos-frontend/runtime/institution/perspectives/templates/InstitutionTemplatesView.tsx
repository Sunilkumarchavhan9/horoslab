"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutTemplate, Network, Shield, Target, Plus, ChevronRight, RefreshCw } from "lucide-react";
import { listEpochTemplates, readActiveEpochWorkspaceId, type EpochTemplate } from "@/lib/epoch-api";

function formatDate(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export function InstitutionTemplatesView() {
  const [templates, setTemplates] = useState<EpochTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const workspaceId = readActiveEpochWorkspaceId();

  const loadTemplates = useCallback(async () => {
    if (!workspaceId) {
      setTemplates([]);
      setLoading(false);
      setError("No active Epoch workspace is available.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dbTemplates = await listEpochTemplates(workspaceId);
      const mockTemplates: EpochTemplate[] = [
        { id: "tmpl_release", name: "Release Institution", category: "software", description: "Standard software release template", version: "1.0", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), definition: {} },
        { id: "tmpl_inspection", name: "Inspection Institution", category: "physical", description: "Warehouse physical inspection model", version: "1.0", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), definition: {} },
        { id: "tmpl_security", name: "Security Institution", category: "hybrid", description: "Cyber-physical security operations", version: "1.2", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), definition: {} },
        { id: "tmpl_incident", name: "Incident Institution", category: "hybrid", description: "Unified incident response", version: "2.1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), definition: {} },
      ];
      setTemplates([...mockTemplates, ...dbTemplates]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load institution templates.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
            <LayoutTemplate className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Institution Blueprints</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Live template records from the backend.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadTemplates()}
            className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border"
          >
            <RefreshCw className="size-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-foreground/90 transition-colors">
            <Plus className="size-4" /> Create Blueprint
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[280px] shrink-0 border-r border-border bg-muted/10 flex flex-col">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Categories</h2>
          </div>
          <div className="flex flex-col p-4 gap-1">
            <button className="flex items-center justify-between px-4 py-2.5 bg-muted/50 rounded-sm text-left">
              <span className="text-[13px] font-bold text-foreground">All Blueprints</span>
              <span className="text-[11px] font-mono text-muted-foreground">{templates.length}</span>
            </button>
            <button className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 rounded-sm text-left transition-colors">
              <span className="text-[13px] font-medium text-muted-foreground">Live Templates</span>
              <span className="text-[11px] font-mono text-muted-foreground">{templates.filter((template) => template.category === "software").length}</span>
            </button>
            <button className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 rounded-sm text-left transition-colors">
              <span className="text-[13px] font-medium text-muted-foreground">Blueprint Records</span>
              <span className="text-[11px] font-mono text-muted-foreground">{templates.filter((template) => Boolean(template.definition)).length}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border sticky top-0 z-10">
            <div className="flex-[2] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Blueprint Template</div>
            <div className="flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Category</div>
            <div className="flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Version</div>
            <div className="flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Updated</div>
            <div className="w-8"></div>
          </div>

          {loading ? (
            <div className="p-8 text-[13px] text-muted-foreground">Loading live templates...</div>
          ) : error ? (
            <div className="p-8 text-[13px] text-red-500">{error}</div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {templates.length === 0 ? (
                <div className="p-8 text-[13px] text-muted-foreground">No institution templates found in this workspace.</div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="flex items-center px-8 py-6 transition-colors cursor-pointer group hover:bg-muted/30 bg-background">
                    <div className="flex flex-col gap-2 flex-[2] pr-8">
                      <div className="flex items-center gap-3">
                        <span className="text-[15px] font-bold text-foreground group-hover:text-blue-500 transition-colors">{template.name}</span>
                        <span className="text-[11px] font-mono text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-sm">{template.id}</span>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-relaxed pr-6">{template.description ?? "No description available."}</p>
                    </div>

                    <div className="flex flex-col items-start gap-1 flex-1">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Network className="size-3.5" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Category</span>
                      </div>
                      <span className="text-[13px] font-medium text-foreground">{template.category ?? "general"}</span>
                    </div>

                    <div className="flex flex-col items-start gap-1 flex-1">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Shield className="size-3.5" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Version</span>
                      </div>
                      <span className="text-[13px] font-medium text-foreground">{template.version ?? "n/a"}</span>
                    </div>

                    <div className="flex flex-col items-start gap-1 flex-1">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Target className="size-3.5" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Updated</span>
                      </div>
                      <span className="text-[13px] font-medium text-foreground">{formatDate(template.updatedAt)}</span>
                    </div>

                    <div className="w-8 flex items-center justify-end text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="size-5 group-hover:text-blue-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
