"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, FileJson, Link as LinkIcon, 
    Copy, Download, ExternalLink, ShieldCheck,
    Network, Database, HardDrive, FileText, FileSearch
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AuditInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="json" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <FileJson className="size-3.5 mr-2" />
                        Raw Payload
                    </TabsTrigger>
                    <TabsTrigger value="metadata" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Database className="size-3.5 mr-2" />
                        Metadata
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Event Type</span>
                                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-emerald-500" />
                                    {entityData.event}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Result / Status</span>
                                <span className="text-sm font-medium text-foreground">{entityData.result}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border col-span-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest flex items-center justify-between">
                                    Correlation Chain
                                    <button className="text-xs text-primary hover:underline flex items-center gap-1">
                                        <Copy className="size-3" /> Copy ID
                                    </button>
                                </span>
                                <span className="text-sm font-mono bg-muted/50 p-2 rounded-sm mt-1 text-foreground border border-border/50">
                                    {entityData.correlationId}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Categories</span>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    <Activity className="size-3.5" />
                                    Audit Event
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <ShieldCheck className="size-3.5" />
                                    Policy Decision
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                                    <FileText className="size-3.5" />
                                    Approval Record
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                                    <Network className="size-3.5" />
                                    Runtime Event
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related Entities</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Mission</span>
                                        <span className="text-sm font-medium text-foreground">{entityData.missionId}</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Worker / Actor</span>
                                        <span className="text-sm font-medium text-foreground">{entityData.worker} - {entityData.actor}</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Evidence Record</span>
                                        <span className="text-sm font-medium text-foreground">View attached evidence</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
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
                    
                    <TabsContent value="metadata" className="m-0 focus-visible:outline-none">
                        <div className="bg-[#0d1117] border border-border/50 rounded-md p-4 overflow-x-auto text-[13px]">
                            <pre className="text-[#c9d1d9] font-mono leading-relaxed">
                                {JSON.stringify({
                                    "archived": false,
                                    "retention_policy": "7_years",
                                    "compliance_flags": ["SOC2", "HIPAA_ELIGIBLE"],
                                    "audit_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                                }, null, 2)}
                            </pre>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Download className="size-3.5" />
                    Export
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Copy className="size-3.5" />
                    Copy Correlation ID
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Network className="size-3.5" />
                    Open Mission
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <HardDrive className="size-3.5" />
                    Open Worker
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <FileSearch className="size-3.5" />
                    Open Evidence
                </button>
            </div>
        </Tabs>
    );
}
