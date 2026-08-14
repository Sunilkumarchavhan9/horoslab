"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
    Cpu, BookOpen, ShieldCheck, Target, Link, 
    History, Activity, BarChart, FileCode2, Terminal,
    Play, Pause, RefreshCw, PowerOff, BatteryMedium, Power
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock detailed data
const MOCK_WORKER_DETAILS = {
    overview: {
        capabilities: ["Text Generation", "Vision Analysis", "Code Execution", "Filesystem Read", "Network Access (Restricted)"],
        permissions: [
            { resource: "S3 Bucket (us-east-1)", level: "Read Only", grantedBy: "Sarah Jenkins" },
            { resource: "Postgres Analytics", level: "Read Only", grantedBy: "Sarah Jenkins" },
            { resource: "VPC Subnet A", level: "Execute", grantedBy: "System" }
        ],
        scope: "Restricted to data analysis and reporting generation for Q3 financials. Explicitly blocked from writing to production databases.",
        leases: [
            { mission: "MSN-8991", state: "Active", duration: "1h 45m" },
            { mission: "MSN-8984", state: "Active", duration: "30m" }
        ]
    },
    executionHistory: {
        telemetry: {
            cpu: "84%",
            memory: "14.2 GB",
            networkIn: "1.2 MB/s",
            networkOut: "450 KB/s"
        },
        logs: [
            { time: "10:15:22.041", level: "INFO", message: "Successfully connected to Postgres Analytics." },
            { time: "10:15:23.902", level: "INFO", message: "Executing query: SELECT * FROM q3_revenue_summary..." },
            { time: "10:15:45.110", level: "WARN", message: "Query execution time exceeded 20s. Continuing to wait." },
            { time: "10:15:48.005", level: "INFO", message: "Query returned 14,500 rows. Processing..." },
            { time: "10:16:01.334", level: "INFO", message: "Generated summary report. Writing to memory cache." }
        ]
    },
    evaluation: {
        reliability: "99.9%",
        uptime: "45 days, 12 hours",
        totalCost: "$145.50",
        costPerMission: "$3.45 avg",
        version: "Claude-3.5-Sonnet (2024-06-20)",
        engine: "Anthropic API"
    }
};

export function WorkerInspector({ entityData }: { entityData: any }) {
    return (
        <div className="flex-1 overflow-hidden flex flex-col h-full bg-background/50">
            
            {/* Header Actions */}
            <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-2 overflow-x-auto">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <Pause className="size-3.5" /> Pause
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <Play className="size-3.5" /> Resume
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <RefreshCw className="size-3.5" /> Restart
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors shrink-0">
                    <FileCode2 className="size-3.5" /> Update Runtime
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-orange-500/30 text-orange-500 hover:bg-orange-500/10 text-xs font-semibold transition-colors shrink-0 ml-auto">
                    <BatteryMedium className="size-3.5" /> Drain
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors shrink-0">
                    <PowerOff className="size-3.5" /> Retire
                </button>
            </div>

            <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
                <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                    <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <BookOpen className="size-3.5 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="execution" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Activity className="size-3.5 mr-2" />
                            Execution History
                        </TabsTrigger>
                        <TabsTrigger value="evaluation" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <BarChart className="size-3.5 mr-2" />
                            Evaluation
                        </TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1 w-full">
                    <div className="p-6">
                        
                        {/* 1. OVERVIEW TAB */}
                        <TabsContent value="overview" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Cpu className="size-3.5" /> Identity & Capabilities</h3>
                                <div className="flex flex-col gap-2 bg-card/40 border border-border/30 p-3 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-foreground">Claude-3.5-Sonnet</span>
                                        <Badge variant="outline" className="text-[10px]">WRK-9001</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {MOCK_WORKER_DETAILS.overview.capabilities.map((c, i) => (
                                            <Badge key={i} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">{c}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Target className="size-3.5" /> Project Scope</h3>
                                <p className="text-sm text-foreground bg-card/40 border border-border/30 p-3 rounded-md">{MOCK_WORKER_DETAILS.overview.scope}</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Active Permissions</h3>
                                <div className="bg-card/40 border border-border/30 rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Resource</th>
                                                <th className="px-4 py-2 font-medium">Level</th>
                                                <th className="px-4 py-2 font-medium">Granted By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {MOCK_WORKER_DETAILS.overview.permissions.map((p, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-3 font-medium text-foreground">{p.resource}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{p.level}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{p.grantedBy}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Link className="size-3.5" /> Assignments & Leases</h3>
                                <div className="flex flex-col gap-3">
                                    <div className="text-xs text-muted-foreground mb-1">Currently assigned to 12 execution queues with {MOCK_WORKER_DETAILS.overview.leases.length} active leases.</div>
                                    {MOCK_WORKER_DETAILS.overview.leases.map((l, i) => (
                                        <Card key={i} className="bg-card/40 border-border/30 p-3 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm font-semibold text-foreground">{l.mission}</span>
                                                <span className="text-xs text-muted-foreground">Duration: {l.duration}</span>
                                            </div>
                                            <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10">
                                                {l.state}
                                            </Badge>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                        </TabsContent>

                        {/* 2. EXECUTION HISTORY TAB */}
                        <TabsContent value="execution" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Activity className="size-3.5" /> Live Telemetry</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">CPU</span>
                                        <span className="text-xl font-bold text-foreground">{MOCK_WORKER_DETAILS.executionHistory.telemetry.cpu}</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Memory</span>
                                        <span className="text-xl font-bold text-foreground">{MOCK_WORKER_DETAILS.executionHistory.telemetry.memory}</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Net In</span>
                                        <span className="text-xl font-bold text-foreground">{MOCK_WORKER_DETAILS.executionHistory.telemetry.networkIn}</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Net Out</span>
                                        <span className="text-xl font-bold text-foreground">{MOCK_WORKER_DETAILS.executionHistory.telemetry.networkOut}</span>
                                    </Card>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Terminal className="size-3.5" /> Execution Logs</h3>
                                <div className="bg-[#0c0c0c] border border-border/30 rounded-md p-4 overflow-x-auto text-xs font-mono">
                                    <div className="flex flex-col gap-1.5">
                                        {MOCK_WORKER_DETAILS.executionHistory.logs.map((log, i) => (
                                            <div key={i} className="flex gap-4">
                                                <span className="text-muted-foreground/70 shrink-0">{log.time}</span>
                                                <span className={cn(
                                                    "shrink-0 w-12",
                                                    log.level === "INFO" ? "text-blue-400" :
                                                    log.level === "WARN" ? "text-yellow-400" :
                                                    "text-red-400"
                                                )}>{log.level}</span>
                                                <span className="text-zinc-300 break-all">{log.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </TabsContent>

                        {/* 3. EVALUATION TAB */}
                        <TabsContent value="evaluation" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><BarChart className="size-3.5" /> Health, Performance & Cost</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Health Status</span>
                                        <span className="text-2xl font-bold text-emerald-500">Healthy</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Reliability Score</span>
                                        <span className="text-2xl font-bold text-emerald-500">{MOCK_WORKER_DETAILS.evaluation.reliability}</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Failure Rate</span>
                                        <span className="text-2xl font-bold text-emerald-500">0.1%</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Total Uptime</span>
                                        <span className="text-2xl font-bold text-foreground">{MOCK_WORKER_DETAILS.evaluation.uptime}</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Total Accrued Cost</span>
                                        <span className="text-2xl font-bold text-foreground">{MOCK_WORKER_DETAILS.evaluation.totalCost}</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Avg Cost / Mission</span>
                                        <span className="text-2xl font-bold text-foreground">{MOCK_WORKER_DETAILS.evaluation.costPerMission}</span>
                                    </Card>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><FileCode2 className="size-3.5" /> Engine Details</h3>
                                <div className="bg-card/40 border border-border/30 rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <tbody className="divide-y divide-border/30">
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-muted-foreground w-1/3">Runtime Version</td>
                                                <td className="px-4 py-3 font-mono text-foreground">{MOCK_WORKER_DETAILS.evaluation.version}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-muted-foreground">Engine Provider</td>
                                                <td className="px-4 py-3 font-mono text-foreground">{MOCK_WORKER_DETAILS.evaluation.engine}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </TabsContent>

                    </div>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
