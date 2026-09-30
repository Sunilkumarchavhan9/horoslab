"use client";

import React, { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, FileJson, Link as LinkIcon, 
    Copy, Download, ExternalLink, Network,
    Database, Settings, BrainCircuit, Play, History,
    Terminal, Code, BookOpen, Key
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ApiInspector({ entityData }: { entityData: any }) {
    const [requestOpen, setRequestOpen] = useState(false);
    const [requestBody, setRequestBody] = useState("{}");
    const [requestResult, setRequestResult] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const operation = entityData.operation && typeof entityData.operation === "object" ? entityData.operation : {};
    const schema = useMemo(() => JSON.stringify({ parameters: operation.parameters ?? [], requestBody: operation.requestBody ?? null, responses: operation.responses ?? {} }, null, 2), [operation]);
    const copy = async (value: string, label: string) => {
        await navigator.clipboard?.writeText(value);
        setCopied(label);
        window.setTimeout(() => setCopied(null), 1500);
    };
    const apiEndpoint = String(entityData.endpoint ?? "");
    const browserEndpoint = apiEndpoint.replace(/^\/api\/dhyra/, "/api/v1/dhyra");
    const runRequest = async () => {
        setRequestResult(null);
        try {
            const response = await fetch(browserEndpoint, {
                method: String(entityData.method ?? "GET"),
                headers: { "Content-Type": "application/json" },
                body: entityData.method === "GET" || entityData.method === "DELETE" ? undefined : requestBody,
            });
            const text = await response.text();
            setRequestResult(`${response.status} ${response.statusText}\n${text.slice(0, 4000)}`);
        } catch (error) {
            setRequestResult(error instanceof Error ? error.message : "Request failed.");
        }
    };
    return (
            <Tabs defaultValue="overview" className="relative flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="schema" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <FileJson className="size-3.5 mr-2" />
                        Schema
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <History className="size-3.5 mr-2" />
                        Change History
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Method</span>
                                <span className={cn(
                                    "text-sm font-bold",
                                    entityData.method === "POST" ? "text-emerald-500" :
                                    entityData.method === "GET" ? "text-blue-500" :
                                    entityData.method === "DELETE" ? "text-red-500" :
                                    "text-amber-500"
                                )}>{entityData.method}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Version</span>
                                <span className="text-sm font-medium text-foreground font-mono">{entityData.version}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Authentication</span>
                                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                    <Key className="size-3.5 text-amber-500" />
                                    {entityData.authentication}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Rate Limit</span>
                                <span className="text-sm font-medium text-foreground font-mono">100 req / min</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endpoint Details</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border border-border/50">
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                        entityData.method === "POST" ? "bg-emerald-500/10 text-emerald-500" :
                                        entityData.method === "GET" ? "bg-blue-500/10 text-blue-500" :
                                        entityData.method === "DELETE" ? "bg-red-500/10 text-red-500" :
                                        "bg-amber-500/10 text-amber-500"
                                    )}>{entityData.method}</span>
                                    <span className="text-xs font-mono text-foreground">{entityData.endpoint}</span>
                                    <button type="button" onClick={() => void copy(apiEndpoint, "endpoint")} className="ml-auto text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy endpoint">
                                        <Copy className="size-3.5" />
                                    </button>
                                </div>
                                <span className="text-sm text-foreground leading-relaxed">{entityData.description}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Integration Resources</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <button type="button" onClick={() => window.open("/api/openapi", "_blank", "noopener,noreferrer")} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">OpenAPI Specification</span>
                                        <span className="text-sm font-medium text-foreground">View OpenAPI v3 schema definition</span>
                                    </div>
                                    <BookOpen className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button type="button" onClick={() => void copy(`dhyra.missions.${String(entityData.method).toLowerCase()}()`, "sdk")} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Related SDK Method</span>
                                        <span className="text-sm font-medium text-foreground font-mono">dhyra.missions.create()</span>
                                    </div>
                                    <Code className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button type="button" onClick={() => void copy(`dhyra-v12 missions ${String(entityData.method).toLowerCase()} ${apiEndpoint}`, "cli")} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Related CLI Command</span>
                                        <span className="text-sm font-medium text-foreground font-mono">dhyra run [mission]</span>
                                    </div>
                                    <Terminal className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="schema" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request Body</span>
                                <div className="bg-[#0d1117] border border-border/50 rounded-md p-4 overflow-x-auto text-[13px]">
                                    <pre className="text-[#c9d1d9] font-mono leading-relaxed">
{schema}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response (200 OK)</span>
                                <div className="bg-[#0d1117] border border-border/50 rounded-md p-4 overflow-x-auto text-[13px]">
                                    <pre className="text-[#c9d1d9] font-mono leading-relaxed">
{JSON.stringify(operation.responses ?? {}, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="m-0 focus-visible:outline-none">
                        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">Change history is not included in the live OpenAPI contract for this endpoint.</div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button type="button" onClick={() => setRequestOpen((open) => !open)} className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm">
                    <Play className="size-3.5" />
                    Try Request
                </button>
                <button type="button" onClick={() => void copy(apiEndpoint, "endpoint")} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Copy className="size-3.5" />
                    Copy Endpoint
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button type="button" onClick={() => window.open("/api/openapi", "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <Download className="size-3.5" />
                    OpenAPI
                </button>
            </div>
            {requestOpen && <div className="absolute inset-x-4 bottom-16 z-20 rounded-md border border-border bg-card p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-foreground">Try live request: {entityData.method} {apiEndpoint}</span><span className="text-[11px] text-muted-foreground">{copied === "endpoint" ? "Copied" : "Uses the authenticated frontend session"}</span></div>
                {entityData.method !== "GET" && entityData.method !== "DELETE" && <textarea value={requestBody} onChange={(event) => setRequestBody(event.target.value)} className="mb-2 h-20 w-full rounded border border-border bg-background p-2 font-mono text-xs text-foreground" aria-label="Request body" />}
                <button type="button" onClick={() => void runRequest()} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Send request</button>
                {requestResult && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-[11px] text-foreground">{requestResult}</pre>}
            </div>}
        </Tabs>
    );
}
