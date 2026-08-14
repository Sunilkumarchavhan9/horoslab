"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
    Scale, ShieldAlert, FileText, User, 
    Network, Clock, Wrench, Lock, Workflow, Cpu, Database, CheckCircle2, AlertTriangle, ArrowRight, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const MOCK_POLICY_DETAILS = {
    overview: {
        summary: "Prevents any agent or worker from transmitting sensitive data outside of approved subnets.",
        authority: "Strict - Cannot be overridden by local configurations.",
        permissions: [
            "READ: internal-network",
            "DENY: external-network (except *.acmecorp.com)",
            "DENY: file-system (outside /tmp)"
        ]
    },
    execution: {
        gates: [
            { name: "Pre-Flight Security Check", status: "Active", type: "Automated" },
            { name: "Payload Scanning", status: "Active", type: "Automated" }
        ],
        conditions: [
            "IF payload.contains(PII) THEN block()",
            "IF network.destination NOT IN allowed_subnets THEN block()"
        ],
        exceptions: [
            "Allowed for Worker Pool: 'Security-Auditors'"
        ]
    },
    tooling: {
        allowedWorkers: ["GPT-4-Enterprise", "Claude-3-Opus-Secure"],
        allowedModels: ["gpt-4-turbo", "claude-3-opus-20240229"],
        restrictedTools: ["shell-execution", "raw-http-request"]
    },
    history: {
        versions: [
            { version: "v2.1", date: "2026-07-28", author: "Security Team", changes: "Added exception for Security-Auditors pool" },
            { version: "v2.0", date: "2026-02-15", author: "Compliance", changes: "Major rewrite for SOC2 compliance" },
            { version: "v1.0", date: "2025-11-12", author: "System", changes: "Initial creation" }
        ],
        audit: [
            { time: "2026-08-01 09:12", action: "Policy Evaluated: PASSED", mission: "MIS-889" },
            { time: "2026-07-31 14:45", action: "Policy Evaluated: BLOCKED (PII Detected)", mission: "MIS-882" },
        ]
    },
    relations: {
        missions: ["Monthly Payroll", "Vendor Onboarding", "Customer Data Export"],
        institutions: ["Acme Corp Global", "Acme Financial Services"]
    }
};

export function GovernanceInspector({ entityData }: { entityData: any }) {
    const rowType = entityData?.type || "policy";
    const rowData = entityData?.data || {};

    return (
        <div className="flex-1 overflow-hidden flex flex-col h-full bg-background/50">
            {/* Header Actions */}
            <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-2 overflow-x-auto">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shrink-0">
                    <FileText className="size-3.5" /> Edit Policy
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-background hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors shrink-0">
                    <Workflow className="size-3.5" /> Compare Versions
                </button>
            </div>

            <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
                <div className="px-6 border-b border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                    <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Scale className="size-3.5 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="execution" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Lock className="size-3.5 mr-2" />
                            Execution Rules
                        </TabsTrigger>
                        <TabsTrigger value="tooling" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Wrench className="size-3.5 mr-2" />
                            Tool Policies
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Clock className="size-3.5 mr-2" />
                            History & Audit
                        </TabsTrigger>
                        <TabsTrigger value="relations" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Network className="size-3.5 mr-2" />
                            Relations
                        </TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        
                        {/* 1. OVERVIEW */}
                        <TabsContent value="overview" className="m-0 focus-visible:outline-none space-y-6">
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><FileText className="size-3.5" /> Policy Intent</h3>
                                <Card className="p-4 bg-card/40 border-border/30">
                                    <p className="text-sm font-medium text-foreground leading-relaxed">{MOCK_POLICY_DETAILS.overview.summary}</p>
                                </Card>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="size-3.5" /> Authority Model</h3>
                                    <Card className="p-4 bg-card/40 border-border/30 flex items-start gap-3">
                                        <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                            <ShieldAlert className="size-4 text-red-500" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold">{rowData.authority || "Strict"}</span>
                                            <span className="text-xs text-muted-foreground">{MOCK_POLICY_DETAILS.overview.authority}</span>
                                        </div>
                                    </Card>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Lock className="size-3.5" /> Baseline Permissions</h3>
                                    <div className="flex flex-col gap-2">
                                        {MOCK_POLICY_DETAILS.overview.permissions.map((perm, i) => (
                                            <div key={i} className="px-3 py-2 bg-card/40 border border-border/30 rounded font-mono text-xs flex items-center gap-2">
                                                {perm.startsWith("DENY") ? <XCircle className="size-3.5 text-red-500" /> : <CheckCircle2 className="size-3.5 text-emerald-500" />}
                                                <span className={perm.startsWith("DENY") ? "text-red-400" : "text-emerald-400"}>{perm}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 2. EXECUTION */}
                        <TabsContent value="execution" className="m-0 focus-visible:outline-none space-y-6">
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Workflow className="size-3.5" /> Execution Gates</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {MOCK_POLICY_DETAILS.execution.gates.map((gate, i) => (
                                        <Card key={i} className="p-4 bg-card/40 border-border/30 flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold">{gate.name}</span>
                                                <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-500 border-emerald-500/20">{gate.status}</Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{gate.type}</span>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> Enforced Conditions</h3>
                                <div className="flex flex-col gap-2">
                                    {MOCK_POLICY_DETAILS.execution.conditions.map((cond, i) => (
                                        <div key={i} className="px-4 py-3 bg-card/40 border border-border/30 rounded-lg font-mono text-sm text-amber-500/90">
                                            {cond}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ArrowRight className="size-3.5" /> Allowed Exceptions</h3>
                                <div className="flex flex-col gap-2">
                                    {MOCK_POLICY_DETAILS.execution.exceptions.map((exc, i) => (
                                        <div key={i} className="px-4 py-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg text-sm font-medium text-indigo-400">
                                            {exc}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* 3. TOOLING */}
                        <TabsContent value="tooling" className="m-0 focus-visible:outline-none space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Cpu className="size-3.5" /> Allowed Workers & Models</h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-xs font-semibold text-foreground">Workers</span>
                                            <div className="flex flex-wrap gap-2">
                                                {MOCK_POLICY_DETAILS.tooling.allowedWorkers.map(w => (
                                                    <Badge key={w} variant="secondary" className="font-mono text-xs">{w}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-xs font-semibold text-foreground">Models</span>
                                            <div className="flex flex-wrap gap-2">
                                                {MOCK_POLICY_DETAILS.tooling.allowedModels.map(m => (
                                                    <Badge key={m} variant="outline" className="font-mono text-xs border-primary/20 text-primary">{m}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><XCircle className="size-3.5" /> Restricted Tools</h3>
                                    <div className="flex flex-col gap-2">
                                        {MOCK_POLICY_DETAILS.tooling.restrictedTools.map(t => (
                                            <div key={t} className="px-3 py-2 bg-red-500/5 border border-red-500/20 rounded text-red-500 font-mono text-xs flex items-center gap-2">
                                                <XCircle className="size-3.5" /> {t}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 4. HISTORY & AUDIT */}
                        <TabsContent value="history" className="m-0 focus-visible:outline-none space-y-8">
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Version History</h3>
                                <div className="flex flex-col gap-0 border border-border/50 rounded-lg overflow-hidden">
                                    {MOCK_POLICY_DETAILS.history.versions.map((v, i) => (
                                        <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 p-4 bg-card/40 border-b border-border/50 last:border-0">
                                            <span className="font-mono text-sm font-semibold text-primary min-w-[60px]">{v.version}</span>
                                            <span className="font-mono text-xs text-muted-foreground min-w-[100px]">{v.date}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-[120px]"><User className="size-3" /> {v.author}</span>
                                            <span className="text-sm font-medium text-foreground">{v.changes}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="size-3.5" /> Recent Audit Logs</h3>
                                <div className="flex flex-col gap-3">
                                    {MOCK_POLICY_DETAILS.history.audit.map((a, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 bg-card/20 border border-border/30 rounded-md">
                                            <span className="font-mono text-[10px] text-muted-foreground">{a.time}</span>
                                            <span className="font-mono text-xs text-muted-foreground">[{a.mission}]</span>
                                            <span className={cn("text-xs font-semibold font-mono", a.action.includes("PASSED") ? "text-emerald-500" : "text-red-500")}>{a.action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* 5. RELATIONS */}
                        <TabsContent value="relations" className="m-0 focus-visible:outline-none space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Network className="size-3.5" /> Affected Missions</h3>
                                    <div className="flex flex-col gap-2">
                                        {MOCK_POLICY_DETAILS.relations.missions.map(m => (
                                            <Card key={m} className="p-3 bg-card/40 border-border/30 hover:bg-muted/50 transition-colors cursor-pointer text-sm font-medium">
                                                {m}
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Database className="size-3.5" /> Applied Institutions</h3>
                                    <div className="flex flex-col gap-2">
                                        {MOCK_POLICY_DETAILS.relations.institutions.map(inst => (
                                            <Card key={inst} className="p-3 bg-card/40 border-border/30 hover:bg-muted/50 transition-colors cursor-pointer text-sm font-medium">
                                                {inst}
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                    </div>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
