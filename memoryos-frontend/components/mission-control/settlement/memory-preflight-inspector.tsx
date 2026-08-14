"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, FileJson, Link as LinkIcon, 
    Copy, Download, ExternalLink, Network,
    Database, Search, RotateCcw, BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MemoryPreflightInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <RotateCcw className="size-3.5 mr-2" />
                        Audit History
                    </TabsTrigger>
                    <TabsTrigger value="json" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <FileJson className="size-3.5 mr-2" />
                        Raw Payload
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Memory Type</span>
                                <span className="text-sm font-medium text-foreground">{entityData.memoryType}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Relevance Ranking</span>
                                <span className="text-sm font-medium text-foreground">{entityData.relevance} Priority</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Origin Source</span>
                                <span className="text-sm font-medium text-foreground">{entityData.source}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Institution</span>
                                <span className="text-sm font-medium text-foreground">{entityData.institution}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context Preparation</span>
                            <div className="bg-card border border-border rounded-md p-4">
                                <span className="text-sm text-foreground leading-relaxed">
                                    Memory preflight successfully retrieved and ranked 14 related organizational context nodes. 
                                    This memory ensures that the agent will not repeat the network timeout failure recorded during MSN-8977.
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related Entities</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Target Mission</span>
                                        <span className="text-sm font-medium text-foreground">{entityData.mission}</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Related Outcomes</span>
                                        <span className="text-sm font-medium text-foreground">View settlement outcomes linked to this memory</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Database className="size-4 text-emerald-500" />
                                    <span className="text-sm text-foreground">Memory successfully injected into Preflight payload</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{entityData.updated}</span>
                            </div>
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Network className="size-4 text-indigo-500" />
                                    <span className="text-sm text-foreground">Memory recorded from Settlement Outcome</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{entityData.created}</span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="json" className="m-0 focus-visible:outline-none">
                        <div className="bg-[#0d1117] border border-border/50 rounded-md p-4 overflow-x-auto text-[13px]">
                            <pre className="text-[#c9d1d9] font-mono leading-relaxed">
                                {JSON.stringify(entityData, null, 2)}
                            </pre>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Search className="size-3.5" />
                    Preview Context
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <BrainCircuit className="size-3.5" />
                    View Memory
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <RotateCcw className="size-3.5" />
                    Re-run Preflight
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <Download className="size-3.5" />
                    Export
                </button>
            </div>
        </Tabs>
    );
}
