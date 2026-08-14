"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
    PlayCircle, Wrench, ShieldAlert, FileText, User, 
    Network, Clock, AlertTriangle, Link2, CheckCircle2, Terminal, Cpu, Database, BrainCircuit,
    GitBranch, Settings, XCircle, LayoutTemplate, GitCompare, Box, ListPlus, Undo2, ArrowUpRight,
    Activity, TrendingUp, Sparkles, Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const MOCK_INTELLIGENCE_DETAILS = {
    overview: {
        interaction: "INT-8493",
        mission: "Checkout Flow",
        worker: "GPT-4",
        user: "u_2241",
        status: "Abandoned"
    },
    conversation: [
        { role: "user", content: "I want to buy the premium tier.", time: "10:16:10" },
        { role: "assistant", content: "Great! I can help you with that. The premium tier is $49/mo. Would you like to proceed to payment?", time: "10:16:12" },
        { role: "user", content: "Yes please.", time: "10:16:20" },
        { role: "assistant", content: "[SYSTEM: Executing Payment Intent...] I'm setting up your payment now. Please wait.", time: "10:16:21" },
        { role: "assistant", content: "I'm sorry, there seems to be a delay with our payment processor. Please hold on.", time: "10:16:35" },
        { role: "user", content: "Nevermind, it's taking too long.", time: "10:16:45" },
        { role: "assistant", content: "I apologize for the inconvenience. The payment process has been cancelled.", time: "10:16:46" },
    ],
    rootCause: {
        summary: "Payment Gateway returned HTTP 504 Gateway Timeout during the Payment Intent creation phase.",
        category: "Network Timeout",
        impact: "Caused a 35s delay, leading the user to abandon the checkout flow.",
        suggestedFix: "Implement a circuit breaker for the Payment Intent API and provide an immediate fallback response to the user."
    },
    timeline: [
        { time: "10:16:10", event: "Interaction Started", type: "system" },
        { time: "10:16:21", event: "Tool Call: createPaymentIntent", type: "system" },
        { time: "10:16:31", event: "Latency Warning (>10s)", type: "warning" },
        { time: "10:16:45", event: "User abandoned flow (Browser Closed/Navigation)", type: "error" },
    ],
    relatedFailures: [
        { id: "SIG-102", type: "Payment Declined Spike", detected: "22m ago" }
    ]
};

const MOCK_CLUSTER_DETAILS = {
    overview: {
        title: "Auth Gateway Timeouts",
        category: "Network",
        frequency: "High (412/hr)",
        score: "0.85",
        status: "Investigating"
    },
    pattern: "A sudden 400% increase in latency specifically during the createPaymentIntent phase, causing HTTP 504 Gateway Timeouts across multiple workers attempting to use the checkout tools.",
    affectedMissions: [
        { mission: "User Login", impact: "High", count: 215 },
        { mission: "Checkout Flow", impact: "Critical", count: 180 },
        { mission: "Data Sync", impact: "Low", count: 17 }
    ],
    affectedWorkers: [
        { worker: "GPT-4", impact: "High", count: 350 },
        { worker: "Claude-3", impact: "Medium", count: 62 }
    ],
    relatedFixes: [
        { id: "FIX-812", desc: "Scale Auth Workers", status: "Proposed" },
        { id: "FIX-813", desc: "Implement API Circuit Breaker", status: "Approved" }
    ]
};

const MOCK_ROOT_CAUSE_DETAILS = {
    overview: {
        id: "RC-4091",
        cluster: "CLUS-901",
        confidence: "92%",
        status: "Confirmed",
        reviewer: "Alice System"
    },
    hypothesis: "API Gateway rate limit is too strict for concurrent agent requests.",
    reasoning: "The failures cluster heavily around the createPaymentIntent API call. The logs show that when >3 workers attempt this call within a 1s window, the gateway drops connections. This indicates a strict rate limit threshold is being hit rather than a processing timeout.",
    decision: "Confirmed by reproducing the load in staging. The gateway config allows 2 req/s per client IP, which is insufficient for concurrent agent bursts.",
    history: [
        { time: "2026-08-01 08:30", action: "Hypothesis Proposed", user: "System Monitor" },
        { time: "2026-08-01 08:35", action: "Evidence Attached", user: "System Monitor" },
        { time: "2026-08-01 09:12", action: "Reviewed & Confirmed", user: "Alice System" },
        { time: "2026-08-01 09:15", action: "Fix Proposal Created (FIX-813)", user: "Alice System" },
    ]
};

const MOCK_EVALUATION_DETAILS = {
    overview: {
        id: "EVAL-7721",
        mission: "Checkout Flow",
        dataset: "Staging Latency Set (v2)",
        scenario: "API Gateway 504 Simulation",
        status: "Passed",
        coverage: "98%"
    },
    results: {
        totalChecks: 145,
        passedChecks: 142,
        failedChecks: 3,
        latency: "1.2s avg",
        cost: "$0.45"
    },
    logs: [
        "[INFO] Initiating API Gateway 504 Simulation...",
        "[INFO] Injected 400% latency spike to createPaymentIntent.",
        "[WARN] Worker-1 timed out after 3000ms.",
        "[INFO] Circuit Breaker tripped successfully.",
        "[INFO] Fallback UI triggered for user.",
        "[SUCCESS] Verification Check: Circuit Breaker Activated (PASS)"
    ],
    history: [
        { time: "2026-08-01 09:20", action: "Evaluation Started", user: "CI/CD Pipeline" },
        { time: "2026-08-01 09:21", action: "Dataset Loaded", user: "System" },
        { time: "2026-08-01 09:24", action: "Scenario Completed", user: "System" },
        { time: "2026-08-01 09:25", action: "Verification Passed", user: "System" },
    ]
};

const MOCK_REPLAY_DETAILS = {
    overview: {
        id: "RPL-1049",
        mission: "Monthly Payroll",
        baseline: "v1.2.4 Worker",
        candidate: "v1.3.0 Worker (Beta)",
        result: "Diverged"
    },
    comparison: {
        baselineTime: "1m 12s",
        candidateTime: "45s",
        baselineCost: "$0.12",
        candidateCost: "$0.14",
        diffCount: 2
    },
    baselineLogs: [
        "[INFO] Baseline Worker started execution...",
        "[INFO] Processing 45 payroll records.",
        "[INFO] Total calculation complete: $145,000.",
        "[SUCCESS] Payroll verified."
    ],
    candidateLogs: [
        "[INFO] Candidate Worker started execution...",
        "[INFO] Processing 45 payroll records.",
        "[WARN] Missing tax identifier for record #12, using default.",
        "[INFO] Total calculation complete: $146,200.",
        "[FAILED] Validation mismatch detected."
    ],
    history: [
        { time: "2026-08-01 10:15", action: "Replay Initiated", user: "System Engineer" },
        { time: "2026-08-01 10:16", action: "Baseline Run Complete", user: "System" },
        { time: "2026-08-01 10:17", action: "Candidate Run Complete", user: "System" },
        { time: "2026-08-01 10:18", action: "Comparison Failed", user: "System" },
    ]
};

const MOCK_FIX_PROPOSAL_DETAILS = {
    overview: {
        id: "FIX-813",
        type: "Tool Change",
        target: "API Circuit Breaker",
        risk: "High",
        status: "Approved",
    },
    description: "Modify the API Gateway Circuit Breaker tool to automatically trip after 3 consecutive timeouts instead of 5, to prevent cascading failures.",
    artifacts: {
        affectedTool: "Gateway API Invoker",
        affectedPolicy: "P-442: Service Resiliency",
    },
    rollbackPlan: "Revert the threshold variable back to 5 in the global config. No schema migrations needed.",
    history: [
        { time: "2026-08-01 09:30", action: "Proposal Created", user: "Alice System" },
        { time: "2026-08-01 09:35", action: "Risk Assessed as High", user: "System Monitor" },
        { time: "2026-08-01 10:15", action: "Approved by Reviewer", user: "Sarah Chen" },
    ]
};

const MOCK_RELIABILITY_DETAILS = {
    overview: {
        id: "REL-M01",
        targetType: "Mission",
        target: "Monthly Payroll",
        success: "98.2%",
        failure: "1.8%",
        recovery: "1.5%",
        humanReview: "0.3%",
        confidence: "High",
        sampleSize: "1,245"
    },
    trend: [
        { date: "Jul 25", success: 97.5 },
        { date: "Jul 26", success: 97.8 },
        { date: "Jul 27", success: 98.0 },
        { date: "Jul 28", success: 97.9 },
        { date: "Jul 29", success: 98.1 },
        { date: "Jul 30", success: 98.1 },
        { date: "Jul 31", success: 98.2 },
    ],
    relatedFailures: [
        { id: "ERR-921", error: "Missing Employee Tax ID", impact: "High" },
        { id: "ERR-918", error: "Timeout to ADP API", impact: "Medium" }
    ]
};

const MOCK_IMPROVEMENT_DETAILS = {
    overview: {
        id: "IMP-492",
        proposal: "FIX-813",
        verification: "A/B Replay",
        status: "Verified",
        version: "v1.2.5"
    },
    impact: {
        metric: "Mission Success Rate",
        before: "94.5%",
        after: "98.2%",
        delta: "+3.7%"
    },
    deployment: {
        environment: "Production",
        rollout: "100%",
        verifiedBy: "Sarah Chen",
    },
    history: [
        { time: "2026-08-01 10:15", action: "Proposal FIX-813 Approved", user: "Sarah Chen" },
        { time: "2026-08-01 10:20", action: "A/B Replay Verification Started", user: "System" },
        { time: "2026-08-01 10:25", action: "Improvement Verified (+3.7%)", user: "System" },
        { time: "2026-08-01 10:30", action: "Deployed to Production", user: "System Monitor" },
    ]
};

export function IntelligenceInspector({ entityData }: { entityData: any }) {
    if (!entityData) return null;
    const rowType = entityData.type || "record";
    const rowData = entityData.data || entityData;

    return (
        <div className="flex h-full flex-col bg-background p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
                <Activity className="size-5 text-blue-500" />
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{rowType} record</h2>
                    <p className="text-xs text-muted-foreground">Live intelligence record from the Epoch API</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(rowData).filter(([, value]) => typeof value !== "object").map(([key, value]) => (
                    <div key={key} className="rounded-md border border-border bg-card p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{key}</div>
                        <div className="mt-1 break-words text-sm text-foreground">{value == null || value === "" ? "-" : String(value)}</div>
                    </div>
                ))}
            </div>
            <pre className="mt-4 flex-1 overflow-auto rounded-md border border-border bg-muted/20 p-4 text-xs text-muted-foreground">{JSON.stringify(rowData, null, 2)}</pre>
        </div>
    );

    return (
        <div className="flex-1 overflow-hidden flex flex-col h-full bg-background/50">
            
            {/* Header Actions */}
            <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-2 overflow-x-auto">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shrink-0">
                    <PlayCircle className="size-3.5" /> Replay Session
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold transition-colors shrink-0">
                    <Wrench className="size-3.5" /> Apply Fixes
                </button>
                
                <div className="w-px h-4 bg-border mx-2 shrink-0" />
                
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-background hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors shrink-0">
                    <ShieldAlert className="size-3.5" /> Escalate Incident
                </button>
            </div>

            <Tabs defaultValue={rowType === "cluster" ? "pattern" : rowType === "root-cause" ? "analysis" : rowType === "evaluation" ? "results" : rowType === "replay" ? "comparison" : rowType === "fix-proposal" ? "details" : rowType === "reliability" ? "metrics" : rowType === "improvement" ? "impact" : "conversation"} className="flex-1 flex flex-col w-full h-full">
                <div className="px-6 border-b border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                    <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                        {rowType !== "cluster" && rowType !== "root-cause" && rowType !== "evaluation" && rowType !== "replay" && rowType !== "fix-proposal" && rowType !== "reliability" && rowType !== "improvement" && (
                            <TabsTrigger value="conversation" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <Terminal className="size-3.5 mr-2" />
                                Conversation
                            </TabsTrigger>
                        )}
                        {rowType === "cluster" && (
                            <TabsTrigger value="pattern" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <Network className="size-3.5 mr-2" />
                                Failure Pattern
                            </TabsTrigger>
                        )}
                        {rowType === "root-cause" && (
                            <TabsTrigger value="analysis" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <FileText className="size-3.5 mr-2" />
                                Analysis
                            </TabsTrigger>
                        )}
                        {rowType === "evaluation" && (
                            <TabsTrigger value="results" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <LayoutTemplate className="size-3.5 mr-2" />
                                Results
                            </TabsTrigger>
                        )}
                        {rowType === "replay" && (
                            <TabsTrigger value="comparison" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <GitCompare className="size-3.5 mr-2" />
                                Comparison
                            </TabsTrigger>
                        )}
                        {rowType === "replay" && (
                            <TabsTrigger value="diff" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <FileText className="size-3.5 mr-2" />
                                Difference
                            </TabsTrigger>
                        )}
                        {rowType === "fix-proposal" && (
                            <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <FileText className="size-3.5 mr-2" />
                                Details
                            </TabsTrigger>
                        )}
                        {rowType === "fix-proposal" && (
                            <TabsTrigger value="artifacts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <ListPlus className="size-3.5 mr-2" />
                                Affected Artifacts
                            </TabsTrigger>
                        )}
                        {rowType === "fix-proposal" && (
                            <TabsTrigger value="rollback" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <Undo2 className="size-3.5 mr-2" />
                                Rollback Plan
                            </TabsTrigger>
                        )}
                        {rowType === "reliability" && (
                            <TabsTrigger value="metrics" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <Activity className="size-3.5 mr-2" />
                                Metrics
                            </TabsTrigger>
                        )}
                        {rowType === "reliability" && (
                            <TabsTrigger value="trend" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <TrendingUp className="size-3.5 mr-2" />
                                Trend
                            </TabsTrigger>
                        )}
                        {rowType === "reliability" && (
                            <TabsTrigger value="related-failures" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <XCircle className="size-3.5 mr-2" />
                                Related Failures
                            </TabsTrigger>
                        )}
                        {rowType === "improvement" && (
                            <TabsTrigger value="impact" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <TrendingUp className="size-3.5 mr-2" />
                                Impact
                            </TabsTrigger>
                        )}
                        {rowType === "improvement" && (
                            <TabsTrigger value="deployment" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <Rocket className="size-3.5 mr-2" />
                                Deployment
                            </TabsTrigger>
                        )}
                        {(rowType === "evaluation" || rowType === "replay") && (
                            <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <Terminal className="size-3.5 mr-2" />
                                Logs & Evidence
                            </TabsTrigger>
                        )}
                        {rowType !== "evaluation" && rowType !== "replay" && rowType !== "fix-proposal" && rowType !== "reliability" && rowType !== "improvement" && (
                            <TabsTrigger value="rootcause" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <AlertTriangle className="size-3.5 mr-2" />
                                {rowType === "cluster" ? "Resolution & Fixes" : rowType === "root-cause" ? "Evidence" : "Root Cause & Fixes"}
                            </TabsTrigger>
                        )}
                        {rowType !== "reliability" && (
                            <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                <Clock className="size-3.5 mr-2" />
                                {rowType === "root-cause" ? "History" : "Timeline"}
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <ScrollArea className="flex-1 w-full">
                    <div className="p-6">
                        
                        {/* 1. CONVERSATION TAB */}
                        <TabsContent value="conversation" className="m-0 focus-visible:outline-none space-y-6">
                            
                            {/* Context Card */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Interaction</span>
                                    <span className="text-sm font-mono font-semibold text-blue-400">{rowData.id || rowData.interaction || MOCK_INTELLIGENCE_DETAILS.overview.interaction}</span>
                                </Card>
                                <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Mission</span>
                                    <span className="text-sm font-semibold">{rowData.mission || MOCK_INTELLIGENCE_DETAILS.overview.mission}</span>
                                </Card>
                                <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Worker</span>
                                    <span className="text-sm font-semibold">{rowData.worker || MOCK_INTELLIGENCE_DETAILS.overview.worker}</span>
                                </Card>
                                <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">User</span>
                                    <span className="text-sm font-mono font-semibold">{rowData.user || MOCK_INTELLIGENCE_DETAILS.overview.user}</span>
                                </Card>
                            </div>

                            <div className="flex flex-col gap-4 bg-muted/5 border border-border/30 rounded-lg p-6 min-h-[400px]">
                                {MOCK_INTELLIGENCE_DETAILS.conversation.map((msg, i) => (
                                    <div key={i} className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "self-end items-end" : "self-start items-start")}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-mono text-muted-foreground">{msg.time}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{msg.role}</span>
                                        </div>
                                        <div className={cn(
                                            "p-3 rounded-lg text-sm",
                                            msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none border border-border/50",
                                            msg.content.startsWith("[SYSTEM") && "bg-blue-500/10 border-blue-500/20 text-blue-400 font-mono text-xs"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* 2. ROOT CAUSE TAB */}
                        <TabsContent value="rootcause" className="m-0 focus-visible:outline-none space-y-6">
                            
                            <div className="flex flex-col gap-4 bg-red-500/5 border border-red-500/20 rounded-md p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> Incident Root Cause</h3>
                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 font-mono">
                                        {MOCK_INTELLIGENCE_DETAILS.rootCause.category}
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-4 mt-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Summary</span>
                                        <p className="text-sm font-semibold text-foreground">{MOCK_INTELLIGENCE_DETAILS.rootCause.summary}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Impact</span>
                                        <p className="text-sm text-foreground">{MOCK_INTELLIGENCE_DETAILS.rootCause.impact}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Wrench className="size-3.5" /> Suggested Fixes</h3>
                                <Card className="bg-emerald-500/5 border border-emerald-500/20 p-4 flex gap-4 items-start">
                                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-medium text-emerald-500">{MOCK_INTELLIGENCE_DETAILS.rootCause.suggestedFix}</span>
                                        <button className="self-start px-3 py-1.5 bg-emerald-500 text-white rounded text-xs font-semibold hover:bg-emerald-600 transition-colors mt-2">Apply Configuration Change</button>
                                    </div>
                                </Card>
                            </div>

                            <div className="flex flex-col gap-2 mt-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Link2 className="size-3.5" /> Related Failures</h3>
                                <div className="flex flex-col gap-2">
                                    {MOCK_INTELLIGENCE_DETAILS.relatedFailures.map((rf, i) => (
                                        <Card key={i} className="bg-card/40 border border-border/30 p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Network className="size-4 text-muted-foreground" />
                                                <span className="text-sm font-medium text-foreground">{rf.type}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-mono">
                                                <span className="text-red-400">{rf.id}</span>
                                                <span className="text-muted-foreground">{rf.detected}</span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                        </TabsContent>

                        {/* 3. TIMELINE TAB */}
                        <TabsContent value="timeline" className="m-0 focus-visible:outline-none space-y-6">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Interaction Timeline</h3>
                                <div className="flex flex-col gap-4 relative before:absolute before:inset-y-6 before:left-4 before:w-px before:bg-border/50 mt-4">
                                    {MOCK_INTELLIGENCE_DETAILS.timeline.map((event, i) => (
                                        <Card key={i} className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                            <div className={cn(
                                                "absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full ring-4 ring-background",
                                                event.type === "error" ? "bg-red-500" :
                                                event.type === "warning" ? "bg-orange-500" :
                                                "bg-blue-500"
                                            )} />
                                            <div className="flex flex-col flex-1">
                                                <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                                                <span className={cn(
                                                    "text-sm font-medium mt-1",
                                                    event.type === "error" ? "text-red-500" :
                                                    event.type === "warning" ? "text-orange-500" :
                                                    "text-foreground"
                                                )}>{event.event}</span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* 4. CLUSTER PATTERN TAB */}
                        {rowType === "cluster" && (
                            <TabsContent value="pattern" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Cluster</span>
                                        <span className="text-sm font-mono font-semibold text-blue-400">{rowData.id || "CLUS-901"}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Category</span>
                                        <span className="text-sm font-semibold">{rowData.category || MOCK_CLUSTER_DETAILS.overview.category}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Frequency</span>
                                        <span className="text-sm font-semibold">{rowData.frequency || MOCK_CLUSTER_DETAILS.overview.frequency}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Avg Score</span>
                                        <span className="text-sm font-mono font-semibold text-red-500">{rowData.score || MOCK_CLUSTER_DETAILS.overview.score}</span>
                                    </Card>
                                </div>

                                <div className="flex flex-col gap-4 bg-muted/5 border border-border/30 rounded-lg p-6">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Network className="size-3.5" /> Identified Pattern</h3>
                                    <p className="text-sm text-foreground leading-relaxed">{MOCK_CLUSTER_DETAILS.pattern}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Affected Missions</h3>
                                        <div className="flex flex-col gap-2">
                                            {MOCK_CLUSTER_DETAILS.affectedMissions.map((m, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-md bg-card border border-border/50">
                                                    <span className="text-xs font-semibold">{m.mission}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn("text-[10px] uppercase tracking-wider font-bold", m.impact === "Critical" ? "text-red-500" : m.impact === "High" ? "text-orange-500" : "text-blue-500")}>{m.impact}</span>
                                                        <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border border-border">{m.count} hits</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Affected Workers</h3>
                                        <div className="flex flex-col gap-2">
                                            {MOCK_CLUSTER_DETAILS.affectedWorkers.map((w, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-md bg-card border border-border/50">
                                                    <span className="text-xs font-semibold">{w.worker}</span>
                                                    <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border border-border">{w.count} hits</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {/* 5. ROOT CAUSE ANALYSIS TAB */}
                        {rowType === "root-cause" && (
                            <TabsContent value="analysis" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Root Cause ID</span>
                                        <span className="text-sm font-mono font-semibold text-blue-400">{rowData.id || MOCK_ROOT_CAUSE_DETAILS.overview.id}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Related Cluster</span>
                                        <span className="text-sm font-mono font-semibold text-muted-foreground">{rowData.cluster || MOCK_ROOT_CAUSE_DETAILS.overview.cluster}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Confidence</span>
                                        <span className="text-sm font-mono font-semibold text-emerald-500">{MOCK_ROOT_CAUSE_DETAILS.overview.confidence}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</span>
                                        <span className="text-sm font-semibold">{rowData.status || MOCK_ROOT_CAUSE_DETAILS.overview.status}</span>
                                    </Card>
                                </div>

                                <div className="flex flex-col gap-4 bg-muted/5 border border-border/30 rounded-lg p-6">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><FileText className="size-3.5" /> Hypothesis</h3>
                                    <p className="text-sm font-semibold text-foreground leading-relaxed">{rowData.hypothesis || MOCK_ROOT_CAUSE_DETAILS.hypothesis}</p>
                                </div>

                                <div className="flex flex-col gap-4 bg-muted/5 border border-border/30 rounded-lg p-6 mt-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><BrainCircuit className="size-3.5" /> Reasoning</h3>
                                    <p className="text-sm text-foreground leading-relaxed">{MOCK_ROOT_CAUSE_DETAILS.reasoning}</p>
                                </div>

                                <div className="flex flex-col gap-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-6 mt-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="size-3.5" /> Decision</h3>
                                    <p className="text-sm text-foreground leading-relaxed font-medium">{MOCK_ROOT_CAUSE_DETAILS.decision}</p>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "root-cause" && (
                            <TabsContent value="timeline" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Review History</h3>
                                    <div className="flex flex-col gap-4 relative before:absolute before:inset-y-6 before:left-4 before:w-px before:bg-border/50 mt-4">
                                        {MOCK_ROOT_CAUSE_DETAILS.history.map((event, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                                <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full ring-4 ring-background bg-blue-500" />
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                                                    <span className="text-sm font-medium mt-1 text-foreground">{event.action}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><User className="size-3" /> {event.user}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {/* 6. EVALUATION RESULTS TAB */}
                        {rowType === "evaluation" && (
                            <TabsContent value="results" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Evaluation ID</span>
                                        <span className="text-sm font-mono font-semibold text-blue-400">{rowData.id || MOCK_EVALUATION_DETAILS.overview.id}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Mission</span>
                                        <span className="text-sm font-semibold">{rowData.mission || MOCK_EVALUATION_DETAILS.overview.mission}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Dataset</span>
                                        <span className="text-sm font-semibold">{rowData.dataset || MOCK_EVALUATION_DETAILS.overview.dataset}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</span>
                                        <span className={cn("text-sm font-semibold", 
                                            (rowData.status || MOCK_EVALUATION_DETAILS.overview.status) === "Passed" ? "text-emerald-500" : 
                                            (rowData.status || MOCK_EVALUATION_DETAILS.overview.status) === "Failed" ? "text-red-500" : "text-blue-500"
                                        )}>
                                            {rowData.status || MOCK_EVALUATION_DETAILS.overview.status}
                                        </span>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 flex flex-col gap-4">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><LayoutTemplate className="size-3.5" /> High-Level Results</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="bg-emerald-500/5 border border-emerald-500/20 p-4 flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-muted-foreground">Passed Checks</span>
                                                <span className="text-2xl font-bold text-emerald-500">{MOCK_EVALUATION_DETAILS.results.passedChecks}</span>
                                            </Card>
                                            <Card className="bg-red-500/5 border border-red-500/20 p-4 flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-muted-foreground">Failed Checks</span>
                                                <span className="text-2xl font-bold text-red-500">{MOCK_EVALUATION_DETAILS.results.failedChecks}</span>
                                            </Card>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Settings className="size-3.5" /> Configuration</h3>
                                        <div className="flex flex-col gap-3 p-4 bg-muted/5 border border-border/50 rounded-lg">
                                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                                <span className="text-xs text-muted-foreground">Scenario</span>
                                                <span className="text-xs font-semibold text-right">{rowData.scenario || MOCK_EVALUATION_DETAILS.overview.scenario}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                                <span className="text-xs text-muted-foreground">Total Checks</span>
                                                <span className="text-xs font-semibold">{MOCK_EVALUATION_DETAILS.results.totalChecks}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                                <span className="text-xs text-muted-foreground">Avg Latency</span>
                                                <span className="text-xs font-mono">{MOCK_EVALUATION_DETAILS.results.latency}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Compute Cost</span>
                                                <span className="text-xs font-mono text-orange-400">{MOCK_EVALUATION_DETAILS.results.cost}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "evaluation" && (
                            <TabsContent value="logs" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Terminal className="size-3.5" /> Execution Logs</h3>
                                    <div className="bg-[#0D1117] border border-[#30363D] rounded-md p-4 font-mono text-xs overflow-x-auto mt-2 space-y-1">
                                        {MOCK_EVALUATION_DETAILS.logs.map((log, i) => (
                                            <div key={i} className="flex gap-3">
                                                <span className="text-muted-foreground/50 shrink-0 w-6 text-right select-none">{i + 1}</span>
                                                <span className={cn(
                                                    log.includes("[WARN]") ? "text-orange-300" : 
                                                    log.includes("[SUCCESS]") ? "text-emerald-400 font-semibold" : 
                                                    "text-gray-300"
                                                )}>{log}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "evaluation" && (
                            <TabsContent value="timeline" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Timeline</h3>
                                    <div className="flex flex-col gap-4 relative before:absolute before:inset-y-6 before:left-4 before:w-px before:bg-border/50 mt-4">
                                        {MOCK_EVALUATION_DETAILS.history.map((event, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                                <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full ring-4 ring-background bg-blue-500" />
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                                                    <span className="text-sm font-medium mt-1 text-foreground">{event.action}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><User className="size-3" /> {event.user}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {/* 7. REPLAY TABS */}
                        {rowType === "replay" && (
                            <TabsContent value="comparison" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Replay ID</span>
                                        <span className="text-sm font-mono font-semibold text-indigo-400">{rowData.id || MOCK_REPLAY_DETAILS.overview.id}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Baseline</span>
                                        <span className="text-sm font-semibold">{rowData.baseline || MOCK_REPLAY_DETAILS.overview.baseline}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Candidate</span>
                                        <span className="text-sm font-semibold">{rowData.candidate || MOCK_REPLAY_DETAILS.overview.candidate}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Result</span>
                                        <span className={cn("text-sm font-semibold", 
                                            (rowData.result || MOCK_REPLAY_DETAILS.overview.result) === "Matched" ? "text-emerald-500" : 
                                            (rowData.result || MOCK_REPLAY_DETAILS.overview.result) === "Diverged" ? "text-orange-500" : "text-red-500"
                                        )}>
                                            {rowData.result || MOCK_REPLAY_DETAILS.overview.result}
                                        </span>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Box className="size-3.5" /> Baseline Stats</h3>
                                        <div className="flex flex-col gap-3 p-4 bg-muted/5 border border-border/50 rounded-lg">
                                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                                <span className="text-xs text-muted-foreground">Execution Time</span>
                                                <span className="text-xs font-mono text-muted-foreground">{MOCK_REPLAY_DETAILS.comparison.baselineTime}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Compute Cost</span>
                                                <span className="text-xs font-mono text-muted-foreground">{MOCK_REPLAY_DETAILS.comparison.baselineCost}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><User className="size-3.5" /> Candidate Stats</h3>
                                        <div className="flex flex-col gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                                <span className="text-xs text-muted-foreground">Execution Time</span>
                                                <span className="text-xs font-mono text-emerald-500 font-bold">{MOCK_REPLAY_DETAILS.comparison.candidateTime} <span className="text-xs text-emerald-500/70 ml-1">(-27s)</span></span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Compute Cost</span>
                                                <span className="text-xs font-mono text-orange-400 font-bold">{MOCK_REPLAY_DETAILS.comparison.candidateCost} <span className="text-xs text-orange-400/70 ml-1">(+$0.02)</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}
                        
                        {rowType === "replay" && (
                            <TabsContent value="diff" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><FileText className="size-3.5" /> Data Differences</h3>
                                    <div className="bg-[#0D1117] border border-[#30363D] rounded-md overflow-hidden mt-2 font-mono text-xs">
                                        <div className="grid grid-cols-2 bg-[#161B22] border-b border-[#30363D] divide-x divide-[#30363D]">
                                            <div className="p-2 text-[#8B949E] text-center font-semibold">Baseline Output</div>
                                            <div className="p-2 text-[#8B949E] text-center font-semibold">Candidate Output</div>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-[#30363D]">
                                            <div className="p-4 bg-[#FFEBE9]/5 text-[#FF7B72] whitespace-pre-wrap leading-relaxed">
                                                {`{\n  "total_calculated": 145000,\n  "record_12": {\n    "tax_id": "XX-190"\n  }\n}`}
                                            </div>
                                            <div className="p-4 bg-[#AFF5B4]/5 text-[#7EE787] whitespace-pre-wrap leading-relaxed">
                                                {`{\n  "total_calculated": 146200,\n  "record_12": {\n    "tax_id": "DEFAULT"\n  }\n}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "replay" && (
                            <TabsContent value="logs" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Terminal className="size-3.5" /> Baseline Logs</h3>
                                        <div className="bg-[#0D1117] border border-[#30363D] rounded-md p-4 font-mono text-[11px] overflow-x-auto mt-2 space-y-1 h-[300px]">
                                            {MOCK_REPLAY_DETAILS.baselineLogs.map((log, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <span className="text-muted-foreground/50 shrink-0 w-6 text-right select-none">{i + 1}</span>
                                                    <span className={cn(
                                                        log.includes("[WARN]") ? "text-orange-300" : 
                                                        log.includes("[SUCCESS]") ? "text-emerald-400 font-semibold" : 
                                                        "text-gray-300"
                                                    )}>{log}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Terminal className="size-3.5" /> Candidate Logs</h3>
                                        <div className="bg-[#0D1117] border border-[#30363D] rounded-md p-4 font-mono text-[11px] overflow-x-auto mt-2 space-y-1 h-[300px]">
                                            {MOCK_REPLAY_DETAILS.candidateLogs.map((log, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <span className="text-muted-foreground/50 shrink-0 w-6 text-right select-none">{i + 1}</span>
                                                    <span className={cn(
                                                        log.includes("[WARN]") ? "text-orange-300" : 
                                                        log.includes("[FAILED]") ? "text-red-400 font-semibold" : 
                                                        "text-gray-300"
                                                    )}>{log}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "replay" && (
                            <TabsContent value="timeline" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Timeline</h3>
                                    <div className="flex flex-col gap-4 relative before:absolute before:inset-y-6 before:left-4 before:w-px before:bg-border/50 mt-4">
                                        {MOCK_REPLAY_DETAILS.history.map((event, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                                <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full ring-4 ring-background bg-indigo-500" />
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                                                    <span className="text-sm font-medium mt-1 text-foreground">{event.action}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><User className="size-3" /> {event.user}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {/* 8. FIX PROPOSAL TABS */}
                        {rowType === "fix-proposal" && (
                            <TabsContent value="details" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Proposal ID</span>
                                        <span className="text-sm font-mono font-semibold text-blue-400">{rowData.id || MOCK_FIX_PROPOSAL_DETAILS.overview.id}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Type</span>
                                        <span className="text-sm font-semibold">{rowData.type || MOCK_FIX_PROPOSAL_DETAILS.overview.type}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Risk Level</span>
                                        <span className={cn("text-sm font-semibold", 
                                            (rowData.risk || MOCK_FIX_PROPOSAL_DETAILS.overview.risk) === "Low" ? "text-emerald-500" : 
                                            (rowData.risk || MOCK_FIX_PROPOSAL_DETAILS.overview.risk) === "Medium" ? "text-orange-500" : "text-red-500"
                                        )}>
                                            {rowData.risk || MOCK_FIX_PROPOSAL_DETAILS.overview.risk}
                                        </span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</span>
                                        <span className={cn("text-sm font-semibold", 
                                            (rowData.status || MOCK_FIX_PROPOSAL_DETAILS.overview.status) === "Approved" ? "text-emerald-500" : "text-blue-500"
                                        )}>
                                            {rowData.status || MOCK_FIX_PROPOSAL_DETAILS.overview.status}
                                        </span>
                                    </Card>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><FileText className="size-3.5" /> Description</h3>
                                    <div className="bg-muted/5 border border-border/30 rounded-lg p-5">
                                        <p className="text-sm leading-relaxed text-foreground/90 font-medium">{MOCK_FIX_PROPOSAL_DETAILS.description}</p>
                                    </div>
                                </div>
                            </TabsContent>
                        )}
                        
                        {rowType === "fix-proposal" && (
                            <TabsContent value="artifacts" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><ListPlus className="size-3.5" /> Affected Artifacts</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                                <Wrench className="size-4" /> Affected Tool
                                            </div>
                                            <div className="font-mono text-sm text-blue-400 mt-2">{MOCK_FIX_PROPOSAL_DETAILS.artifacts.affectedTool}</div>
                                            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2 w-fit transition-colors">
                                                View Diff <ArrowUpRight className="size-3" />
                                            </button>
                                        </Card>
                                        <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                                <ShieldAlert className="size-4" /> Affected Policy
                                            </div>
                                            <div className="font-mono text-sm text-indigo-400 mt-2">{MOCK_FIX_PROPOSAL_DETAILS.artifacts.affectedPolicy}</div>
                                            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2 w-fit transition-colors">
                                                View Diff <ArrowUpRight className="size-3" />
                                            </button>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "fix-proposal" && (
                            <TabsContent value="rollback" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Undo2 className="size-3.5" /> Rollback Plan</h3>
                                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-5">
                                        <p className="text-sm leading-relaxed text-foreground/90 font-medium">{MOCK_FIX_PROPOSAL_DETAILS.rollbackPlan}</p>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "fix-proposal" && (
                            <TabsContent value="timeline" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Lifecycle Timeline</h3>
                                    <div className="flex flex-col gap-4 relative before:absolute before:inset-y-6 before:left-4 before:w-px before:bg-border/50 mt-4">
                                        {MOCK_FIX_PROPOSAL_DETAILS.history.map((event, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                                <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full ring-4 ring-background bg-emerald-500" />
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                                                    <span className="text-sm font-medium mt-1 text-foreground">{event.action}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><User className="size-3" /> {event.user}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {/* 9. RELIABILITY TABS */}
                        {rowType === "reliability" && (
                            <TabsContent value="metrics" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="p-4 bg-card/40 border-border/30 flex flex-col gap-2">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Success Rate</span>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-mono font-semibold text-emerald-500">{rowData.success || MOCK_RELIABILITY_DETAILS.overview.success}</span>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-card/40 border-border/30 flex flex-col gap-2">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Failure Rate</span>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-mono font-semibold text-red-500">{rowData.failure || MOCK_RELIABILITY_DETAILS.overview.failure}</span>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-card/40 border-border/30 flex flex-col gap-2">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Recovery Rate</span>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-mono font-semibold text-blue-500">{rowData.recovery || MOCK_RELIABILITY_DETAILS.overview.recovery}</span>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-card/40 border-border/30 flex flex-col gap-2">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Human Review Rate</span>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-mono font-semibold text-orange-500">{rowData.humanReview || MOCK_RELIABILITY_DETAILS.overview.humanReview}</span>
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "reliability" && (
                            <TabsContent value="trend" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><TrendingUp className="size-3.5" /> Reliability Trend</h3>
                                    <Card className="bg-card/40 border-border/30 p-6 flex flex-col gap-4 h-64 justify-end relative">
                                        <div className="absolute inset-x-6 top-6 bottom-12 border-b border-l border-border/30" />
                                        <div className="flex items-end justify-between gap-2 h-full z-10 px-2 pb-2">
                                            {MOCK_RELIABILITY_DETAILS.trend.map((point, i) => (
                                                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                                    <div 
                                                        className="w-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors rounded-t-sm"
                                                        style={{ height: `${(point.success - 90) * 10}%` }}
                                                        title={`${point.success}%`}
                                                    />
                                                    <span className="text-[10px] font-mono text-muted-foreground">{point.date}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "reliability" && (
                            <TabsContent value="related-failures" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><XCircle className="size-3.5" /> Recent Failures</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {MOCK_RELIABILITY_DETAILS.relatedFailures.map((failure, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-4 flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-mono font-semibold text-red-400">{failure.id}</span>
                                                    <span className="text-sm font-medium">{failure.error}</span>
                                                </div>
                                                <Badge variant="outline" className={cn(
                                                    "font-mono text-[10px] tracking-wide",
                                                    failure.impact === "High" ? "text-red-500 border-red-500/30 bg-red-500/5" : "text-orange-500 border-orange-500/30 bg-orange-500/5"
                                                )}>
                                                    {failure.impact} Impact
                                                </Badge>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {/* 10. IMPROVEMENT TABS */}
                        {rowType === "improvement" && (
                            <TabsContent value="impact" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Proposal</span>
                                        <span className="text-sm font-mono font-semibold text-blue-400 cursor-pointer hover:underline">{rowData.proposal || MOCK_IMPROVEMENT_DETAILS.overview.proposal}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Verification</span>
                                        <span className="text-sm font-semibold">{rowData.verification || MOCK_IMPROVEMENT_DETAILS.overview.verification}</span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</span>
                                        <span className={cn("text-sm font-semibold", 
                                            (rowData.status || MOCK_IMPROVEMENT_DETAILS.overview.status) === "Verified" ? "text-emerald-500" : "text-blue-500"
                                        )}>
                                            <CheckCircle2 className="size-3.5 inline mr-1" />
                                            {rowData.status || MOCK_IMPROVEMENT_DETAILS.overview.status}
                                        </span>
                                    </Card>
                                    <Card className="p-3 bg-card/40 border-border/30 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Version</span>
                                        <span className="text-sm font-mono font-semibold text-muted-foreground">
                                            {rowData.version || MOCK_IMPROVEMENT_DETAILS.overview.version}
                                        </span>
                                    </Card>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><TrendingUp className="size-3.5" /> Measured Impact</h3>
                                    <div className="grid grid-cols-3 gap-0 border border-border/30 rounded-lg overflow-hidden bg-card/20 divide-x divide-border/30">
                                        <div className="flex flex-col gap-2 p-6 items-center justify-center">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Before</span>
                                            <span className="text-2xl font-mono text-muted-foreground line-through decoration-red-500/50">{rowData.before || MOCK_IMPROVEMENT_DETAILS.impact.before}</span>
                                        </div>
                                        <div className="flex flex-col gap-2 p-6 items-center justify-center bg-emerald-500/5">
                                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">After</span>
                                            <span className="text-2xl font-mono text-emerald-500 font-bold">{rowData.after || MOCK_IMPROVEMENT_DETAILS.impact.after}</span>
                                        </div>
                                        <div className="flex flex-col gap-2 p-6 items-center justify-center bg-blue-500/5">
                                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Delta</span>
                                            <span className="text-2xl font-mono text-blue-500 font-bold">{rowData.delta || MOCK_IMPROVEMENT_DETAILS.impact.delta}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}
                        
                        {rowType === "improvement" && (
                            <TabsContent value="deployment" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Rocket className="size-3.5" /> Deployment Details</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Card className="bg-card/40 border-border/30 p-4 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                                <Settings className="size-4" /> Environment Rollout
                                            </div>
                                            <div className="font-mono text-sm text-foreground mt-2">{MOCK_IMPROVEMENT_DETAILS.deployment.environment} ({MOCK_IMPROVEMENT_DETAILS.deployment.rollout})</div>
                                            <div className="text-xs text-muted-foreground mt-1">Verified by {MOCK_IMPROVEMENT_DETAILS.deployment.verifiedBy}</div>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        {rowType === "improvement" && (
                            <TabsContent value="timeline" className="m-0 focus-visible:outline-none space-y-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> Improvement Lifecycle</h3>
                                    <div className="flex flex-col gap-4 relative before:absolute before:inset-y-6 before:left-4 before:w-px before:bg-border/50 mt-4">
                                        {MOCK_IMPROVEMENT_DETAILS.history.map((event, i) => (
                                            <Card key={i} className="bg-card/40 border-border/30 p-4 flex gap-4 items-center z-10 relative ml-8">
                                                <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 size-2 rounded-full ring-4 ring-background bg-amber-500" />
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[10px] font-mono text-muted-foreground">{event.time}</span>
                                                    <span className="text-sm font-medium mt-1 text-foreground">{event.action}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><User className="size-3" /> {event.user}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                    </div>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
