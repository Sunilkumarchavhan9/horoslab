"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
    Building, BookOpen, Network, ShieldCheck, 
    History, Users, Activity, FileText, LayoutTemplate,
    GitMerge, Database, Archive, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock detailed data
const MOCK_INSTITUTION_DETAILS = {
    overview: {
        description: "Core operations unit responsible for maintaining high-availability financial transaction processing systems and related infrastructure.",
        templates: ["Enterprise Base", "High Security Compute", "FinOps Strict"],
        policies: [
            { id: "POL-100", name: "Zero Trust Network Access", status: "Active", level: "Critical" },
            { id: "POL-104", name: "PII Data Scrubbing", status: "Active", level: "High" },
            { id: "POL-112", name: "Budget Cap $500/mo", status: "Active", level: "Medium" },
            { id: "POL-089", name: "Human-in-loop Deployment", status: "Deprecated", level: "Low" },
        ]
    },
    structure: {
        versions: [
            { version: "v2.4.1", status: "Current", activeSince: "Oct 24, 2024" },
            { version: "v2.4.0", status: "Rollback Ready", activeSince: "Sep 15, 2024" },
            { version: "v2.3.5", status: "Archived", activeSince: "Aug 02, 2024" }
        ],
        workers: [
            { id: "WRK-001", model: "Claude-3.5", role: "Code Reviewer", status: "Idle" },
            { id: "WRK-002", model: "GPT-4o", role: "Security Auditor", status: "Running" },
            { id: "WRK-003", model: "Gemini 1.5 Pro", role: "Data Analyst", status: "Idle" },
        ],
        missions: [
            { id: "MSN-8991", name: "Payment Gateway Upgrade", state: "Running" },
            { id: "MSN-8984", name: "Quarterly Report", state: "Running" },
            { id: "MSN-8950", name: "Log Rotation", state: "Success" }
        ]
    },
    governance: {
        history: [
            { date: "Oct 24, 2024 10:15 AM", event: "Version v2.4.1 Released", actor: "System" },
            { date: "Oct 23, 2024 04:30 PM", event: "Policy POL-112 Updated (Budget increased to $500)", actor: "Sarah Jenkins" },
            { date: "Oct 20, 2024 09:00 AM", event: "Worker WRK-002 provisioned", actor: "Auto-Scale" },
            { date: "Oct 15, 2024 11:22 AM", event: "New Template Applied (FinOps Strict)", actor: "Sarah Jenkins" }
        ],
        proposals: [
            { id: "PR-452", title: "Update Data Scrubbing Rules for GDPR", author: "Legal Team", status: "Under Review" },
            { id: "PR-450", title: "Add local Llama-3 worker for fast inferences", author: "R&D", status: "Approved" },
            { id: "PR-448", title: "Remove legacy database permissions", author: "Security Team", status: "Merged" }
        ]
    },
    records: {
        memoryStats: {
            nodes: "14,520",
            edges: "45,102",
            lastIndex: "5 mins ago"
        },
        archive: [
            { type: "Configuration Snapshot", name: "config_v2.3.5.json", date: "Aug 02, 2024" },
            { type: "Audit Report", name: "Q3_Security_Audit.pdf", date: "Oct 01, 2024" },
            { type: "Policy Backup", name: "policies_legacy.yaml", date: "Jan 15, 2024" }
        ]
    }
};

export function InstitutionInspector({ entityData }: { entityData: any }) {
    return (
        <div className="flex-1 overflow-hidden flex flex-col h-full bg-background/50">
            <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
                <div className="px-6 border-b border-border bg-muted/10 shrink-0 flex items-center justify-between">
                    <TabsList className="bg-transparent h-12 justify-start gap-6 rounded-none p-0">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <BookOpen className="size-3.5 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="structure" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Network className="size-3.5 mr-2" />
                            Structure
                        </TabsTrigger>
                        <TabsTrigger value="governance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <ShieldCheck className="size-3.5 mr-2" />
                            Governance
                        </TabsTrigger>
                        <TabsTrigger value="records" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                            <Database className="size-3.5 mr-2" />
                            Records
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-1.5 ml-4 pb-2 pt-3">
                        <button className="px-2 py-1 bg-background border border-border rounded text-[10px] font-semibold hover:bg-muted transition-colors shadow-sm">Edit</button>
                        <button className="px-2 py-1 bg-background border border-border rounded text-[10px] font-semibold hover:bg-muted transition-colors shadow-sm">Clone</button>
                        <button className="px-2 py-1 bg-background border border-border rounded text-[10px] font-semibold hover:bg-muted transition-colors shadow-sm">Compare Versions</button>
                        <button className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/30 rounded text-[10px] font-semibold hover:bg-red-500 hover:text-white transition-colors shadow-sm">Archive</button>
                    </div>
                </div>

                <ScrollArea className="flex-1 w-full">
                    <div className="p-6">
                        
                        {/* 1. OVERVIEW TAB */}
                        <TabsContent value="overview" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Building className="size-3.5" /> Identity & Purpose</h3>
                                <p className="text-sm text-foreground bg-card/40 border border-border/30 p-3 rounded-md">{MOCK_INSTITUTION_DETAILS.overview.description}</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><LayoutTemplate className="size-3.5" /> Applied Templates</h3>
                                <div className="flex flex-wrap gap-2">
                                    {MOCK_INSTITUTION_DETAILS.overview.templates.map((t, i) => (
                                        <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground">{t}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Active Policies</h3>
                                <div className="bg-card/40 border border-border/30 rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Policy ID</th>
                                                <th className="px-4 py-2 font-medium">Name</th>
                                                <th className="px-4 py-2 font-medium">Level</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {MOCK_INSTITUTION_DETAILS.overview.policies.map((p, i) => (
                                                <tr key={i} className={p.status === "Deprecated" ? "opacity-50" : ""}>
                                                    <td className="px-4 py-3 font-mono text-muted-foreground">{p.id}</td>
                                                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className={cn(
                                                            p.level === "Critical" ? "text-red-500 border-red-500/30" : 
                                                            p.level === "High" ? "text-orange-500 border-orange-500/30" : 
                                                            "text-yellow-500 border-yellow-500/30"
                                                        )}>
                                                            {p.level}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </TabsContent>

                        {/* 2. STRUCTURE TAB */}
                        <TabsContent value="structure" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Layers className="size-3.5" /> Versions</h3>
                                    <div className="flex flex-col gap-3">
                                        {MOCK_INSTITUTION_DETAILS.structure.versions.map((v, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-3 flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm font-semibold text-foreground">{v.version}</span>
                                                    <span className="text-xs text-muted-foreground">{v.activeSince}</span>
                                                </div>
                                                <Badge className={v.status === "Current" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-muted text-muted-foreground"}>
                                                    {v.status}
                                                </Badge>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Users className="size-3.5" /> Workers</h3>
                                    <div className="flex flex-col gap-3">
                                        {MOCK_INSTITUTION_DETAILS.structure.workers.map((w, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-3 flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm text-foreground">{w.role}</span>
                                                    <span className="text-xs font-mono text-muted-foreground">{w.model}</span>
                                                </div>
                                                <Badge variant="outline" className={w.status === "Running" ? "text-blue-500 border-blue-500/30 bg-blue-500/10" : "text-muted-foreground"}>
                                                    {w.status}
                                                </Badge>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Activity className="size-3.5" /> Active Missions</h3>
                                <div className="bg-card/40 border border-border/30 rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Mission ID</th>
                                                <th className="px-4 py-2 font-medium">Name</th>
                                                <th className="px-4 py-2 font-medium">State</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {MOCK_INSTITUTION_DETAILS.structure.missions.map((m, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-3 font-mono text-muted-foreground">{m.id}</td>
                                                    <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={cn(
                                                            "text-xs font-semibold uppercase tracking-wider",
                                                            m.state === "Running" ? "text-blue-500" : "text-emerald-500"
                                                        )}>
                                                            {m.state}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </TabsContent>

                        {/* 3. GOVERNANCE TAB */}
                        <TabsContent value="governance" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><GitMerge className="size-3.5" /> Change Proposals</h3>
                                <div className="flex flex-col gap-3">
                                    {MOCK_INSTITUTION_DETAILS.governance.proposals.map((p, i) => (
                                        <Card key={i} className="bg-card/40 border-border/30 p-4 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-sm text-foreground">{p.title}</span>
                                                <Badge variant="outline" className={cn(
                                                    p.status === "Merged" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" :
                                                    p.status === "Approved" ? "text-blue-500 border-blue-500/30 bg-blue-500/10" : "text-yellow-500 border-yellow-500/30 bg-yellow-500/10"
                                                )}>
                                                    {p.status}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2 items-center text-xs text-muted-foreground">
                                                <span className="font-mono">{p.id}</span>
                                                <span>•</span>
                                                <span>Proposed by {p.author}</span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><History className="size-3.5" /> Evolution History</h3>
                                <div className="bg-card/40 border border-border/30 p-4 rounded-md">
                                    <div className="flex flex-col gap-4 relative before:absolute before:inset-y-1 before:left-[5px] before:w-px before:bg-border/50">
                                        {MOCK_INSTITUTION_DETAILS.governance.history.map((h, i) => (
                                            <div key={i} className="flex gap-4 relative z-10">
                                                <div className="size-3 rounded-full mt-1 shrink-0 ring-4 ring-background bg-border" />
                                                <div className="flex flex-col w-full">
                                                    <span className="font-semibold text-sm text-foreground">{h.event}</span>
                                                    <div className="flex gap-2 items-center text-xs text-muted-foreground">
                                                        <span>{h.date}</span>
                                                        <span>•</span>
                                                        <span>{h.actor}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </TabsContent>

                        {/* 4. RECORDS TAB */}
                        <TabsContent value="records" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Database className="size-3.5" /> Institutional Memory</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Knowledge Nodes</span>
                                        <span className="text-xl font-bold text-foreground">{MOCK_INSTITUTION_DETAILS.records.memoryStats.nodes}</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Relational Edges</span>
                                        <span className="text-xl font-bold text-foreground">{MOCK_INSTITUTION_DETAILS.records.memoryStats.edges}</span>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Last Indexed</span>
                                        <span className="text-xl font-bold text-foreground">{MOCK_INSTITUTION_DETAILS.records.memoryStats.lastIndex}</span>
                                    </Card>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Archive className="size-3.5" /> Archive Vault</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {MOCK_INSTITUTION_DETAILS.records.archive.map((a, i) => (
                                        <Card key={i} className="bg-card/40 border-border/30 p-3 flex flex-col gap-1 cursor-pointer hover:bg-muted/30 transition-colors">
                                            <span className="text-[10px] font-semibold text-primary">{a.type}</span>
                                            <span className="text-sm font-medium text-foreground truncate">{a.name}</span>
                                            <span className="text-xs text-muted-foreground">{a.date}</span>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><BookOpen className="size-3.5" /> Learning Records</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm text-foreground">API Deprecation Handling</span>
                                            <Badge variant="outline" className="text-[10px]">Verified</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Learned standard rollback procedure when v1 APIs return 410 Gone.</p>
                                    </Card>
                                    <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm text-foreground">Peak Load Throttling</span>
                                            <Badge variant="outline" className="text-[10px]">Active</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Adjusted connection pool limits dynamically based on previous Black Friday traffic patterns.</p>
                                    </Card>
                                </div>
                            </div>

                        </TabsContent>

                    </div>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
