"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, LayoutTemplate, ShieldCheck, Scale, FileText, Workflow, Layers, Sparkles, Search } from "lucide-react";
import {
 createDhyraInstitution,
 createDhyraTemplate,
 getDhyraTemplate,
 listDhyraTemplates,
 readActiveDhyraWorkspaceId,
 type DhyraTemplate,
} from "@/lib/dhyra-api";

type TemplatesProps = {
 onViewInstitution?: (id: string) => void;
};

function defaultTemplateSummary(template: DhyraTemplate): string {
 return template.description?.trim() || "Reusable blueprint for instantiating a new institution.";
}

function missionsCount(template: DhyraTemplate): number {
 const definition = template.definition as { missions?: unknown } | undefined;
 const missions = definition?.missions;
 return Array.isArray(missions) ? missions.length : 0;
}

function authorityLabel(template: DhyraTemplate): string {
 const definition = template.definition as { authority?: { level?: unknown } } | undefined;
 const level = definition?.authority?.level;
 if (typeof level === "string" && level.trim()) return level;
 return template.category?.trim() || "General";
}

function policiesLabel(template: DhyraTemplate): string {
 const definition = template.definition as { policies?: unknown } | undefined;
 const policies = definition?.policies;
 if (Array.isArray(policies) && policies.length > 0) return String(policies[0]);
 return "Standard";
}

function evidenceLabel(template: DhyraTemplate): string {
 const definition = template.definition as { evidence?: unknown } | undefined;
 const evidence = definition?.evidence;
 if (typeof evidence === "string" && evidence.trim()) return evidence;
 return "Evidence Trail";
}

function approvalLabel(template: DhyraTemplate): string {
 const definition = template.definition as { approval?: unknown } | undefined;
 const approval = definition?.approval;
 if (typeof approval === "string" && approval.trim()) return approval;
 return "Automatic";
}

export function InstitutionsTemplates({ onViewInstitution }: TemplatesProps) {
 const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId());
 const [templates, setTemplates] = useState<DhyraTemplate[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [creating, setCreating] = useState(false);
 const [instantiatingId, setInstantiatingId] = useState<string | null>(null);
 const [blueprintTemplate, setBlueprintTemplate] = useState<DhyraTemplate | null>(null);
 const [blueprintLoading, setBlueprintLoading] = useState(false);
 const [query, setQuery] = useState("");
 const [searchInput, setSearchInput] = useState("");

 useEffect(() => {
 const syncWorkspace = () => setWorkspaceId(readActiveDhyraWorkspaceId());
 syncWorkspace();
 window.addEventListener("focus", syncWorkspace);
 window.addEventListener("storage", syncWorkspace);
 return () => {
 window.removeEventListener("focus", syncWorkspace);
 window.removeEventListener("storage", syncWorkspace);
 };
 }, []);

 const refresh = useCallback(async () => {
 if (!workspaceId) {
 setTemplates([]);
 setError("Select a workspace to load templates.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const liveTemplates = await listDhyraTemplates(workspaceId, {
 search: query.trim() || undefined,
 });
 setTemplates(liveTemplates);
 } catch (loadError) {
 setError(loadError instanceof Error ? loadError.message : "Failed to load templates.");
 setTemplates([]);
 } finally {
 setLoading(false);
 }
 }, [query, workspaceId]);

 useEffect(() => {
 void refresh();
 }, [refresh]);

 const sortedTemplates = useMemo(
 () => [...templates].sort((a, b) => (b.updatedAt ?? b.createdAt ?? "").localeCompare(a.updatedAt ?? a.createdAt ?? "")),
 [templates],
 );

 const handleCreateTemplate = useCallback(async () => {
 if (!workspaceId) return;
 setCreating(true);
 setError(null);
 try {
 await createDhyraTemplate(workspaceId, {
 name: "New Template",
 category: "general",
 description: "New reusable template for an institution.",
 version: "1.0.0",
 definition: {
 missions: ["Mission planning", "Execution", "Verification"],
 authority: { level: "Medium" },
 policies: ["Standard governance"],
 evidence: "Audit trail",
 approval: "Automatic",
 },
 });
 await refresh();
 } catch (createError) {
 setError(createError instanceof Error ? createError.message : "Failed to create template.");
 } finally {
 setCreating(false);
 }
 }, [refresh, workspaceId]);

 const handleInstantiate = useCallback(
 async (template: DhyraTemplate) => {
 if (!workspaceId) return;
 setInstantiatingId(template.id);
 setError(null);
 try {
 const created = await createDhyraInstitution(workspaceId, {
 name: `${template.name} Institution`,
 category: template.category ?? "general",
 version: template.version ?? "1.0.0",
 summary: defaultTemplateSummary(template),
 templateId: template.id,
 metadata: {
 sourceTemplateId: template.id,
 sourceTemplateName: template.name,
 },
 proof: {
 instantiatedFromTemplate: template.id,
 },
 });
 onViewInstitution?.(created.id);
 } catch (instantiateError) {
 setError(instantiateError instanceof Error ? instantiateError.message : "Failed to instantiate template.");
 } finally {
 setInstantiatingId(null);
 }
 },
 [onViewInstitution, workspaceId],
 );

 const handleViewBlueprint = useCallback(
 async (template: DhyraTemplate) => {
 if (!workspaceId) return;
 setBlueprintLoading(true);
 setError(null);
 try {
 const liveTemplate = await getDhyraTemplate(workspaceId, template.id);
 setBlueprintTemplate(liveTemplate);
 } catch (viewError) {
 setError(viewError instanceof Error ? viewError.message : "Failed to load blueprint.");
 } finally {
 setBlueprintLoading(false);
 }
 },
 [workspaceId],
 );

 const handleSearch = useCallback(() => {
 setQuery(searchInput.trim());
 }, [searchInput]);

 return (
 <div className="w-full flex flex-col pt-2 pb-12 font-sans">
 <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
 <div>
 <div className="flex items-center gap-2.5 mb-1">
 <Layers className="size-6 text-foreground" strokeWidth={1.5} />
 <h1 className="text-[28px] font-medium text-foreground tracking-tight">Templates</h1>
 </div>
 <p className="text-[15px] text-muted-foreground">Reusable blueprints for creating institutions in the active workspace.</p>
 </div>
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={handleCreateTemplate}
 disabled={!workspaceId || creating}
 className="btn-glossy-blue h-9 px-6 text-[13.5px] font-medium gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
 >
 <Plus className="size-4" />
 {creating ? "Creating..." : "Create template"}
 </button>
 </div>
 </div>

 <div className="flex items-center justify-between gap-6 mb-5">
 <div className="text-[13px] text-muted-foreground">
 {workspaceId ? `Workspace ${workspaceId}` : "No workspace selected"}
 </div>
 <form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); handleSearch(); }}>
 <div className="relative w-[320px] max-w-full">
 <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={searchInput}
 onChange={(event) => setSearchInput(event.target.value)}
 placeholder="Search templates..."
 className="w-full pl-9 pr-4 py-1.5 bg-card border border-[#ccc] rounded-l text-[14px] text-foreground/90 outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff] transition-all h-[36px]"
 />
 </div>
 <button
 type="submit"
 className="bg-card border border-[#ccc] text-[#0f52ff] px-6 h-[36px] rounded-r text-[14px] font-medium hover:bg-card transition-colors disabled:opacity-50"
 disabled={loading}
 >
 {loading ? "Refreshing..." : "Search"}
 </button>
 </form>
 </div>

 {error ? (
 <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-6 py-3 text-[14px] text-red-700">
 {error}
 </div>
 ) : null}

 {loading ? (
 <div className="rounded-md border border-border bg-card p-10 text-center text-[14px] text-muted-foreground ">
 Loading live templates...
 </div>
 ) : sortedTemplates.length === 0 ? (
 <div className="rounded-md border border-border bg-card p-10 text-center text-[14px] text-muted-foreground ">
 No templates exist yet for this workspace.
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {sortedTemplates.map((template) => (
 <div key={template.id} className="bg-card rounded-md flex flex-col overflow-hidden group transition-all duration-300">
 <div className="p-6 flex-1">
 <div className="flex items-center gap-3 mb-4">
 <div className="size-10 rounded bg-card flex items-center justify-center">
 <LayoutTemplate className="size-5 text-muted-foreground" strokeWidth={1.5} />
 </div>
 <div>
 <h3 className="font-semibold text-[15px] text-foreground leading-tight">{template.name}</h3>
 <p className="text-[12px] text-muted-foreground font-medium">{missionsCount(template)} Mission Types</p>
 </div>
 </div>
 <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
 {defaultTemplateSummary(template)}
 </p>

 <div className="flex flex-col gap-3">
 <div className="flex items-center gap-2.5">
 <ShieldCheck className="size-4 text-muted-foreground" strokeWidth={1.5} />
 <span className="text-[13px] font-medium text-muted-foreground w-24">Authority:</span>
 <span className="text-[13px] font-semibold text-foreground">{authorityLabel(template)}</span>
 </div>
 <div className="flex items-center gap-2.5">
 <Scale className="size-4 text-muted-foreground" strokeWidth={1.5} />
 <span className="text-[13px] font-medium text-muted-foreground w-24">Policies:</span>
 <span className="text-[13px] font-semibold text-foreground">{policiesLabel(template)}</span>
 </div>
 <div className="flex items-center gap-2.5">
 <FileText className="size-4 text-muted-foreground" strokeWidth={1.5} />
 <span className="text-[13px] font-medium text-muted-foreground w-24">Evidence:</span>
 <span className="text-[13px] font-semibold text-foreground">{evidenceLabel(template)}</span>
 </div>
 <div className="flex items-center gap-2.5">
 <Workflow className="size-4 text-muted-foreground" strokeWidth={1.5} />
 <span className="text-[13px] font-medium text-muted-foreground w-24">Approval:</span>
 <span className="text-[13px] font-semibold text-foreground">{approvalLabel(template)}</span>
 </div>
 </div>
 </div>

 <div className="p-6 bg-card flex items-center justify-between">
 <button
 type="button"
 onClick={() => void handleViewBlueprint(template)}
 className="text-[13px] font-medium text-[#0f52ff] flex items-center gap-1 cursor-pointer hover:underline"
 >
 <Sparkles className="size-4" />
 View Blueprint
 </button>
 <button
 type="button"
 onClick={() => void handleInstantiate(template)}
 disabled={!workspaceId || instantiatingId === template.id}
 className="bg-card border border-[#ccc] text-foreground/90 px-3 py-1.5 rounded text-[13px] font-medium hover:bg-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
 >
 {instantiatingId === template.id ? "Instantiating..." : "Instantiate"}
 </button>
 </div>
 </div>
 ))}
 </div>
 )}

 {blueprintTemplate ? (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-8">
 <div className="w-full max-w-3xl overflow-hidden rounded-md border border-border bg-card shadow-2xl">
 <div className="flex items-center justify-between border-b border-border px-6 py-6">
 <div>
 <h2 className="text-[18px] font-semibold text-foreground">{blueprintTemplate.name}</h2>
 <p className="text-[13px] text-muted-foreground">
 {blueprintTemplate.category ?? "general"} · {blueprintTemplate.version ?? "1.0.0"}
 </p>
 </div>
 <button
 type="button"
 onClick={() => setBlueprintTemplate(null)}
 className="text-[13px] font-medium text-[#0f52ff] hover:underline"
 >
 Close
 </button>
 </div>

 <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
 <div>
 <h3 className="mb-2 text-[13px] font-semibold text-foreground">Blueprint definition</h3>
 <pre className="max-h-[420px] overflow-auto rounded-md border border-border bg-[#0f0f10] p-6 text-[12px] leading-5 text-[#d8e6ff]">
 {JSON.stringify(blueprintTemplate.definition ?? {}, null, 2)}
 </pre>
 </div>

 <div className="space-y-3">
 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Summary</div>
 <div className="text-[13px] leading-6 text-foreground">{defaultTemplateSummary(blueprintTemplate)}</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mission types</div>
 <div className="text-[13px] text-foreground">{missionsCount(blueprintTemplate)} configured</div>
 </div>
 <div className="rounded-md border border-border bg-muted/50 p-6">
 <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Authority</div>
 <div className="text-[13px] text-foreground">{authorityLabel(blueprintTemplate)}</div>
 </div>
 </div>
 </div>

 {blueprintLoading ? (
 <div className="px-6 pb-5 text-[13px] text-muted-foreground">Loading blueprint...</div>
 ) : null}
 </div>
 </div>
 ) : null}
 </div>
 );
}
