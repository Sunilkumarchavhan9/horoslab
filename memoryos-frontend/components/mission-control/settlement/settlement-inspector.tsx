"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, FileJson, Link as LinkIcon, 
    Copy, Download, ExternalLink, Network,
    Database, Settings, BrainCircuit, Play, History,
    CheckCircle2, XCircle, Share, ArchiveRestore, Clock, Gavel
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SettlementInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Clock className="size-3.5 mr-2" />
                        Timeline
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <History className="size-3.5 mr-2" />
                        History
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
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Decision</span>
                                <span className="text-sm font-medium text-foreground">{entityData.decision}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Status</span>
                                <span className="text-sm font-medium text-foreground">{entityData.status}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Reviewer</span>
                                <span className="text-sm font-medium text-foreground">{entityData.reviewer || "System Default"}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Completed</span>
                                <span className="text-sm font-medium text-foreground font-mono">{entityData.completed}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settlement Decision</span>
                            <div className="bg-card border border-border rounded-md p-4">
                                <span className="text-sm text-foreground leading-relaxed">
                                    The execution has been evaluated against all governance policies and verified for safety. 
                                    The settlement layer approves this mission. All generated outcomes and learnings have been committed.
                                </span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outcome</span>
                                <div className="bg-card border border-border rounded-md p-3">
                                    <span className="text-sm text-foreground leading-relaxed">
                                        Mission completed successfully. 2 new learnings generated and committed to vector store.
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Policy Result</span>
                                <div className="bg-card border border-border rounded-md p-3">
                                    <span className="text-sm text-emerald-500 font-medium">Passed: 14/14 Policies</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Trail & Relations</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Related Mission</span>
                                        <span className="text-sm font-medium text-foreground">{entityData.mission}</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Related Verification</span>
                                        <span className="text-sm font-medium text-foreground">View policy compliance report</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left group">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Related Recovery</span>
                                        <span className="text-sm font-medium text-foreground">None</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col space-y-4 py-4">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <div className="w-px h-full bg-border my-1" />
                                </div>
                                <div className="pb-4">
                                    <span className="text-xs font-mono text-muted-foreground">{entityData.completed}</span>
                                    <div className="text-sm font-medium mt-1">Settlement Finalized</div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <div className="w-px h-full bg-border my-1" />
                                </div>
                                <div className="pb-4">
                                    <span className="text-xs font-mono text-muted-foreground">{entityData.completed}</span>
                                    <div className="text-sm font-medium mt-1">Learnings Handed Off</div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                <div>
                                    <span className="text-xs font-mono text-muted-foreground">{entityData.completed}</span>
                                    <div className="text-sm font-medium mt-1">Mission Completed</div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Database className="size-4 text-emerald-500" />
                                    <span className="text-sm text-foreground">Settlement Created</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{entityData.completed}</span>
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
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm">
                    <CheckCircle2 className="size-3.5" />
                    Finalize
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <ArchiveRestore className="size-3.5" />
                    Reopen
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Gavel className="size-3.5" />
                    View Audit
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    <Download className="size-3.5" />
                    Export
                </button>
            </div>
        </Tabs>
    );
}
