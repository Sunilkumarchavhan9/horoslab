"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, FileSignature, GitPullRequest, Scale, Search, Settings, ShieldAlert, Sparkles, Activity, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { useMissionStore } from "../../runtime/store";
import { buildMissionTemplateCard, useMissionRuntimeData } from "../../runtime/mission-runtime-data";

export function MissionTemplatesView() {
  const { setView, setSelection } = useMissionStore();
  const { templates, institutions, loading, error, createMission } = useMissionRuntimeData();
  const [query, setQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState("Genome");
  const [instantiatingId, setInstantiatingId] = useState<string | null>(null);

  const { resolved } = useThemePreference();
  const isDark = resolved === "dark";
  const bgCard = isDark ? "bg-[#121212] border-white/10" : "bg-card border-border";
  const textMuted = isDark ? "text-white/50" : "text-foreground/50";

  const visibleTemplates = useMemo(
    () =>
      templates
        .map(buildMissionTemplateCard)
        .filter((template) => `${template.title} ${template.category} ${template.objective}`.toLowerCase().includes(query.toLowerCase())),
    [query, templates],
  );

  const selectedTemplate = visibleTemplates.find((template) => template.id === selectedTemplateId) ?? null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Security":
        return <ShieldAlert className="size-4 text-red-500" />;
      case "Operations":
        return <Activity className="size-4 text-blue-500" />;
      case "Compliance":
        return <Scale className="size-4 text-amber-500" />;
      case "Engineering":
        return <Zap className="size-4 text-purple-500" />;
      default:
        return <BookOpen className="size-4 text-slate-500" />;
    }
  };

  const handleInstantiate = async () => {
    if (!selectedTemplate || institutions.length === 0) return;
    setInstantiatingId(selectedTemplate.id);
    try {
      const mission = await createMission({
        institutionId: institutions[0].id,
        title: selectedTemplate.title,
        objective: selectedTemplate.objective || selectedTemplate.title,
        plan: selectedTemplate.template.definition && typeof selectedTemplate.template.definition === "object" && Array.isArray((selectedTemplate.template.definition as Record<string, unknown>).plan)
          ? ((selectedTemplate.template.definition as Record<string, unknown>).plan as string[])
          : undefined,
        authority: {
          name: selectedTemplate.authority,
          category: selectedTemplate.category,
          templateId: selectedTemplate.id,
        },
        proof: {
          templateId: selectedTemplate.id,
          category: selectedTemplate.category,
        },
      });
      setSelection({ id: mission.id, type: "mission" });
      setView("execution");
    } finally {
      setInstantiatingId(null);
    }
  };

  return (
    <div className={cn("flex flex-col h-full w-full relative", isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]")}>
      <header className={cn("px-6 py-6 border-b shrink-0 z-10 flex flex-col gap-6", isDark ? "border-white/5 bg-[#0a0a0a]" : "border-border bg-[#F9F9F9]")}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className={cn("text-xl font-semibold tracking-tight", isDark ? "text-white" : "text-foreground")}>Mission Templates</h1>
            </div>
            <p className={cn("text-[13px] mt-1", textMuted)}>Standardized workflows and operational contracts backed by live backend templates.</p>
          </div>

          <button
            onClick={() => void handleInstantiate()}
            disabled={!selectedTemplate || institutions.length === 0 || instantiatingId !== null}
            className="flex items-center gap-2 px-6 py-1.5 bg-[#0f52ff] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f52ff]/90 transition-colors disabled:opacity-60"
          >
            <GitPullRequest className="size-4" /> {instantiatingId ? "Instantiating..." : "Instantiate Mission"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 bg-card dark:bg-[#121212] border rounded-md text-[13px] flex-1 max-w-sm transition-colors cursor-text", isDark ? "border-white/10 text-white" : "border-border text-foreground")}>
              <Search className="size-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder="Search templates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full placeholder:opacity-50"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[320px] text-sm text-muted-foreground">Loading live templates...</div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[320px] text-sm text-red-500">{error}</div>
          ) : visibleTemplates.length === 0 ? (
            <div className="flex items-center justify-center min-h-[320px] text-sm text-muted-foreground">No templates are available in this workspace yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max pb-10 pr-2">
              {visibleTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setInspectorTab("Genome");
                  }}
                  className={cn("group rounded-md border p-6 flex flex-col transition-all relative overflow-hidden cursor-pointer", bgCard, selectedTemplate?.id === template.id ? "ring-2 ring-[#0f52ff] ring-offset-2 dark:ring-offset-[#0a0a0a]" : "")}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-md bg-muted dark:bg-white/10">
                      {getCategoryIcon(template.category)}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-[15px]">{template.title}</h3>
                      <span className={cn("text-[12px]", textMuted)}>{template.category}</span>
                    </div>
                  </div>

                  <p className={cn("text-[13px] mb-4 flex-1", textMuted)}>{template.objective || template.title}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(template.roles.length > 0 ? template.roles : ["Planner"]).map((role) => (
                      <span key={role} className={cn("px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border", isDark ? "bg-card/5 border-white/10 text-white/70" : "bg-muted border-border text-foreground/70")}>
                        {role}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-[12px] font-medium opacity-70">
                      <Activity className="size-3.5" /> {template.runtime}
                    </div>
                    <div className="flex items-center gap-1 text-[12px] font-medium text-[#0f52ff] opacity-0 group-hover:opacity-100 transition-opacity">
                      View Genome <ArrowRight className="size-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
            <div className={cn("w-[450px] h-full shadow-2xl border-l flex flex-col animate-in slide-in-from-right-10 duration-200", isDark ? "bg-[#121212] border-white/10" : "bg-card border-border")}>
              <div className={cn("px-6 py-6 border-b shrink-0 flex items-start justify-between", isDark ? "border-white/10" : "border-border")}>
                <div>
                  <h2 className={cn("text-[15px] font-semibold tracking-tight", isDark ? "text-white" : "text-foreground")}>{selectedTemplate.title}</h2>
                  <p className={cn("text-[12px] mt-0.5", textMuted)}>{selectedTemplate.category}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplateId(null)}
                  className={cn("p-1.5 rounded-md transition-colors", isDark ? "hover:bg-card/10 text-white/50 hover:text-white" : "hover:bg-black/10 text-foreground/50 hover:text-foreground")}
                >
                  <Settings className="size-4 opacity-0" />
                  <span className="absolute top-4 right-4">✕</span>
                </button>
              </div>

              <div className={cn("flex px-6 gap-6 border-b shrink-0 overflow-x-auto custom-scrollbar", isDark ? "border-white/10" : "border-border")}>
                {["Genome", "Policies", "Contract", "Roles"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInspectorTab(tab)}
                    className={cn(
                      "py-3 text-[12.5px] font-medium transition-all relative whitespace-nowrap",
                      inspectorTab === tab ? (isDark ? "text-white" : "text-foreground") : cn(textMuted, isDark ? "hover:text-white/70" : "hover:text-foreground/70"),
                    )}
                  >
                    {tab}
                    {inspectorTab === tab && <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", isDark ? "bg-card" : "bg-black")} />}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {inspectorTab === "Genome" && (
                  <div className="space-y-4">
                    <div className={cn("p-3 rounded-md border text-[13px]", isDark ? "bg-card/[0.02] border-white/10" : "bg-muted/50 border-border")}>
                      <div className="flex justify-between mb-2">
                        <span className={textMuted}>Authority</span>
                        <span className={cn("font-semibold", isDark ? "text-white" : "text-foreground")}>{selectedTemplate.authority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={textMuted}>Est. Runtime</span>
                        <span className={cn("font-semibold", isDark ? "text-white" : "text-foreground")}>{selectedTemplate.runtime}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className={cn("text-[12px] font-semibold uppercase tracking-wider", textMuted)}>Required Roles</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.roles.length > 0 ? selectedTemplate.roles.map((role) => (
                          <div key={role} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] border font-medium", isDark ? "bg-card/5 border-white/10" : "bg-muted border-border")}>
                            <Users className="size-3.5 opacity-70" /> {role}
                          </div>
                        )) : <div className={cn("text-[13px]", textMuted)}>No roles defined in the backend template.</div>}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className={cn("text-[12px] font-semibold uppercase tracking-wider", textMuted)}>Governing Policies</div>
                      <div className="flex flex-col gap-1.5">
                        {selectedTemplate.policies.length > 0 ? selectedTemplate.policies.map((policy) => (
                          <div key={policy} className={cn("flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-md border", isDark ? "bg-card/5 border-white/10 text-white" : "bg-muted border-border text-foreground")}>
                            <FileSignature className="size-3.5 text-amber-500" />
                            <span className="font-medium">{policy}</span>
                          </div>
                        )) : <div className={cn("text-[13px]", textMuted)}>No policies defined in the backend template.</div>}
                      </div>
                    </div>

                    <button
                      onClick={() => void handleInstantiate()}
                      disabled={institutions.length === 0 || instantiatingId !== null}
                      className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#0f52ff] text-white text-[13px] font-medium hover:bg-[#0f52ff]/90 transition-colors disabled:opacity-60"
                    >
                      <Sparkles className="size-4" /> {instantiatingId ? "Instantiating..." : "Instantiate Mission"}
                    </button>
                  </div>
                )}

                {inspectorTab !== "Genome" && (
                  <div className={cn("flex flex-col items-center justify-center py-10 text-center opacity-50", textMuted)}>
                    <Settings className="size-8 mb-2 opacity-50" />
                    <p className="text-[13px] font-medium">{inspectorTab} configuration viewing is not implemented yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
