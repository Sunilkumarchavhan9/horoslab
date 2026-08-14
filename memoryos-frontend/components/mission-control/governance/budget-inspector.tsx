"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, FileJson, ScrollText, Play, Square,
    History, Network, Code, RefreshCw, FileText,
    ShieldAlert, PauseCircle, PlayCircle, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BudgetInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <Activity className="size-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <History className="size-3.5 mr-2" />
                        History
                    </TabsTrigger>
                    <TabsTrigger value="json" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                        <FileJson className="size-3.5 mr-2" />
                        Metadata
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Mission Limits</span>
                                <span className="text-sm font-medium text-foreground">{entityData.missionId} Limits Applied</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Cost Checks</span>
                                <span className="text-sm font-medium text-foreground">{entityData.currentCost} / {entityData.costLimit}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Attempt Limits</span>
                                <span className="text-sm font-medium text-foreground">{entityData.attemptsUsed} of {entityData.attemptLimit} Used</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Time Limits</span>
                                <span className="text-sm font-medium text-foreground">{entityData.runtime} / {entityData.timeLimit}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Violations</span>
                            <div className="bg-card border border-border rounded-md p-4">
                                {entityData.status === "Exceeded" ? (
                                    <div className="flex items-center gap-3 text-red-500">
                                        <ShieldAlert className="size-5" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold">Budget Exceeded</span>
                                            <span className="text-xs text-muted-foreground">This mission has surpassed its allocated {entityData.budgetType} budget.</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">No current violations.</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related Entities</span>
                            <div className="flex flex-col divide-y divide-border/50 border border-border rounded-md bg-card">
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Mission</span>
                                        <span className="text-sm font-medium text-foreground">{entityData.missionId}</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground" />
                                </button>
                                <button className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Institution</span>
                                        <span className="text-sm font-medium text-foreground">{entityData.institution}</span>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="m-0 focus-visible:outline-none">
                        <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Activity className="size-4 text-emerald-500" />
                                    <span className="text-sm text-foreground">Budget allocated to {entityData.missionId}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">2 days ago</span>
                            </div>
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Activity className="size-4 text-amber-500" />
                                    <span className="text-sm text-foreground">50% usage warning triggered</span>
                                </div>
                                <span className="text-xs text-muted-foreground">1 day ago</span>
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
                    <FileText className="size-3.5" />
                    Update Limits
                </button>
                {entityData.status === "Paused" ? (
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm">
                        <PlayCircle className="size-3.5" />
                        Resume Mission
                    </button>
                ) : (
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm">
                        <PauseCircle className="size-3.5" />
                        Pause Mission
                    </button>
                )}
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm ml-auto">
                    Export
                </button>
            </div>
        </Tabs>
    );
}
