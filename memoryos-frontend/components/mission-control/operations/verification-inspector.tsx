"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, ShieldCheck, AlertTriangle, Play, FastForward, CheckCircle2, ShieldAlert,
    Network, Scale, FileText, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

export function VerificationInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="verdict" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0 overflow-x-auto custom-scrollbar">
                    <TabsTrigger value="verdict" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <Scale className="size-3.5 mr-2" />
                        Verdict
                    </TabsTrigger>
                    <TabsTrigger value="reasoning" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <Network className="size-3.5 mr-2" />
                        AI Reasoning
                    </TabsTrigger>
                    <TabsTrigger value="contract" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <FileText className="size-3.5 mr-2" />
                        Contract & Checks
                    </TabsTrigger>
                    <TabsTrigger value="assurance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <ShieldCheck className="size-3.5 mr-2" />
                        Certificates & Risks
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="verdict" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        
                        <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-md text-center gap-3">
                            {entityData.status === "Passed" ? (
                                <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <ShieldCheck className="size-8 text-emerald-500" />
                                </div>
                            ) : entityData.status === "Failed" ? (
                                <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                                    <ShieldAlert className="size-8 text-red-500" />
                                </div>
                            ) : entityData.status === "Warning" ? (
                                <div className="size-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <AlertTriangle className="size-8 text-orange-500" />
                                </div>
                            ) : (
                                <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Activity className="size-8 text-blue-500" />
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold text-foreground">Verification {entityData.status}</h3>
                                <p className="text-sm text-muted-foreground max-w-[300px]">
                                    Evaluated <span className="font-mono text-foreground">{entityData.evidenceTarget}</span> against <span className="font-semibold text-foreground">{entityData.policyRule}</span>.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border">
                                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Confidence Score</span>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={cn(
                                        "text-2xl font-bold",
                                        entityData.status === "Failed" ? "text-red-500" : entityData.status === "Warning" ? "text-orange-500" : "text-emerald-500"
                                    )}>{entityData.confidenceScore > 0 ? `${entityData.confidenceScore}%` : '--'}</span>
                                    {entityData.confidenceScore > 0 && (
                                        <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                                            <div className={cn("h-full", entityData.status === "Failed" ? "bg-red-500" : entityData.status === "Warning" ? "bg-orange-500" : "bg-emerald-500")} style={{ width: `${entityData.confidenceScore}%` }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 p-4 rounded-md bg-card border border-border justify-center">
                                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Verifier</span>
                                <span className="text-sm font-mono font-bold text-foreground mt-1 flex items-center gap-2">
                                    <Bot className="size-4 text-muted-foreground" />
                                    {entityData.verifier}
                                </span>
                            </div>
                        </div>

                    </TabsContent>

                    <TabsContent value="reasoning" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evaluation Logs</span>
                            <div className="flex flex-col bg-[#0d1117] border border-border/50 rounded-md p-4 gap-3 font-mono text-[12px] text-[#c9d1d9] leading-relaxed">
                                {entityData.status === "Passed" ? (
                                    <>
                                        <p><span className="text-blue-400 font-bold">[EVAL]</span> Initializing check against policy `{entityData.policyRule}`...</p>
                                        <p><span className="text-blue-400 font-bold">[EVAL]</span> Extracted PII schema requirements: [\"email\", \"credit_card\", \"ssn\"] MUST be redacted.</p>
                                        <p><span className="text-blue-400 font-bold">[SCAN]</span> Deep scanning evidence artifact...</p>
                                        <p><span className="text-emerald-400 font-bold">[RESULT]</span> No plaintext PII detected. All fields conform to redaction masking algorithms.</p>
                                        <p><span className="text-emerald-400 font-bold">[VERDICT]</span> Passed. Confidence: {entityData.confidenceScore}%</p>
                                    </>
                                ) : entityData.status === "Failed" ? (
                                    <>
                                        <p><span className="text-blue-400 font-bold">[EVAL]</span> Initializing check against policy `{entityData.policyRule}`...</p>
                                        <p><span className="text-blue-400 font-bold">[SCAN]</span> Deep scanning evidence artifact...</p>
                                        <p><span className="text-orange-400 font-bold">[WARN]</span> Anomaly detected in row 42. Field `amount` exceeds transaction threshold defined in policy.</p>
                                        <p><span className="text-red-400 font-bold">[ERROR]</span> Hard constraint violated. Maximum limit is $10,000, found $15,000.</p>
                                        <p><span className="text-red-400 font-bold">[VERDICT]</span> Failed. Confidence: {entityData.confidenceScore}%</p>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground italic">Evaluation logs are still generating or not available for this status.</p>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="contract" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verification Checks</span>
                            <div className="flex flex-col border border-border bg-card rounded-md text-sm">
                                <div className="flex items-center justify-between border-b border-border/50 p-3">
                                    <span className="text-muted-foreground">Pass</span>
                                    <span className="font-mono text-xs text-emerald-500 font-bold">{entityData.pass}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 p-3">
                                    <span className="text-muted-foreground">Fail</span>
                                    <span className="font-mono text-xs text-red-500 font-bold">{entityData.fail}</span>
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <span className="text-muted-foreground">Evidence Coverage</span>
                                    <span className="font-mono text-xs text-foreground">{entityData.evidenceCoverage}%</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="assurance" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assurance & Risks</span>
                            <div className="flex flex-col border border-border bg-card rounded-md text-sm">
                                <div className="flex items-center justify-between border-b border-border/50 p-3">
                                    <span className="text-muted-foreground">Certificate</span>
                                    <span className="font-mono text-xs text-emerald-500">{entityData.certificate}</span>
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <span className="text-muted-foreground">Unresolved Risks</span>
                                    <span className="font-mono text-xs text-orange-500">None detected</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors rounded-md text-xs font-semibold whitespace-nowrap shadow-sm border border-emerald-500/20">
                    <CheckCircle2 className="size-3.5" />
                    Approve
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors rounded-md text-xs font-semibold whitespace-nowrap shadow-sm border border-red-500/20">
                    <ShieldAlert className="size-3.5" />
                    Reject
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Activity className="size-3.5" />
                    Replay
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <ShieldCheck className="size-3.5" />
                    Download Certificate
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <FileText className="size-3.5" />
                    Export Report
                </button>
            </div>
        </Tabs>
    );
}
