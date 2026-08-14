"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Activity, ShieldCheck, Download, Code2, Network, ShieldAlert,
    FileJson, Play, XCircle, Database, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export function EvidenceInspector({ entityData }: { entityData: any }) {
    return (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col w-full h-full">
            <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0 overflow-x-auto custom-scrollbar">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <FileText className="size-3.5 mr-2" />
                        Preview
                    </TabsTrigger>
                    <TabsTrigger value="provenance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <Network className="size-3.5 mr-2" />
                        Provenance
                    </TabsTrigger>
                    <TabsTrigger value="verification" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <ShieldCheck className="size-3.5 mr-2" />
                        Verification
                    </TabsTrigger>
                    <TabsTrigger value="metadata" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider shrink-0">
                        <Database className="size-3.5 mr-2" />
                        Metadata
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1 w-full bg-background/50">
                <div className="p-6">
                    <TabsContent value="overview" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">Cryptographic Signature</span>
                            <div className="flex items-center gap-2 mt-1">
                                <ShieldCheck className="size-4 text-emerald-500" />
                                <span className="text-sm font-mono text-foreground font-medium">{entityData.hash}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Artifact Content</span>
                                <span className="text-[10px] text-muted-foreground">{entityData.size}</span>
                            </div>
                            
                            {entityData.artifactType === "Code" || entityData.artifactType === "JSON" ? (
                                <div className="bg-[#0d1117] border border-border/50 rounded-md p-4 gap-2 font-mono text-[11px] overflow-x-auto text-[#c9d1d9]">
                                    <pre>
                                        <code>{`{
  "request_id": "req_88291a",
  "status": "success",
  "data": {
    "records_synced": 1042,
    "anomalies_detected": 0
  }
}`}</code>
                                    </pre>
                                </div>
                            ) : entityData.artifactType === "Screenshot" ? (
                                <div className="w-full aspect-video rounded-md bg-muted/50 border border-border flex items-center justify-center">
                                    <span className="text-muted-foreground text-xs font-mono">IMAGE PREVIEW UNAVAILABLE IN TERMINAL</span>
                                </div>
                            ) : (
                                <div className="w-full h-32 rounded-md bg-muted/50 border border-border flex items-center justify-center">
                                    <span className="text-muted-foreground text-xs font-mono">BINARY PREVIEW UNAVAILABLE</span>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="provenance" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Origin Chain</span>
                            <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <Play className="size-4 text-blue-500" />
                                        </div>
                                        <div className="w-px h-8 bg-border" />
                                    </div>
                                    <div className="flex flex-col gap-1 pt-1">
                                        <span className="text-xs font-bold text-foreground">Mission Trigger</span>
                                        <span className="text-[11px] text-muted-foreground">{entityData.mission} started by System Schedule</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="size-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <Code2 className="size-4 text-purple-500" />
                                        </div>
                                        <div className="w-px h-8 bg-border" />
                                    </div>
                                    <div className="flex flex-col gap-1 pt-1">
                                        <span className="text-xs font-bold text-foreground">Execution Step</span>
                                        <span className="text-[11px] text-muted-foreground">Step: {entityData.step} handled by {entityData.worker}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <FileJson className="size-4 text-emerald-500" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 pt-1">
                                        <span className="text-xs font-bold text-foreground">Evidence Generated</span>
                                        <span className="text-[11px] text-muted-foreground">{entityData.id} successfully written to immutable ledger</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="verification" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                {entityData.verificationStatus === "Verified" ? (
                                    <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <ShieldCheck className="size-5 text-emerald-500" />
                                    </div>
                                ) : entityData.verificationStatus === "Tampered" ? (
                                    <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                                        <ShieldAlert className="size-5 text-red-500" />
                                    </div>
                                ) : (
                                    <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Activity className="size-5 text-blue-500" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-bold text-foreground">Status: {entityData.verificationStatus}</span>
                                    <span className="text-[11px] text-muted-foreground">Checked against Policy Rule: `SEC-POL-991`</span>
                                </div>
                            </div>

                            <div className="flex flex-col divide-y divide-border/50 border border-border bg-card rounded-md text-sm mt-4">
                                <div className="flex items-center justify-between p-3">
                                    <span className="text-sm font-medium">Cryptographic Hash Check</span>
                                    {entityData.verificationStatus === "Tampered" ? <XCircle className="size-4 text-red-500" /> : <ShieldCheck className="size-4 text-emerald-500" />}
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <span className="text-sm font-medium">Worker Identity Signed</span>
                                    <ShieldCheck className="size-4 text-emerald-500" />
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <span className="text-sm font-medium">Data Sanitization (PII)</span>
                                    <ShieldCheck className="size-4 text-emerald-500" />
                                </div>
                            </div>

                            {entityData.verificationStatus === "Tampered" && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-md">
                                    <span className="text-xs font-bold text-red-500 flex items-center gap-2"><ShieldAlert className="size-4" /> VERIFICATION FAILED</span>
                                    <p className="text-[11px] text-red-500/80 mt-1">The cryptographic signature of this artifact does not match the ledger state. It may have been altered outside the runtime environment.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="metadata" className="m-0 focus-visible:outline-none flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access & Retention</span>
                            <div className="flex flex-col border border-border bg-card rounded-md text-sm">
                                <div className="flex items-center justify-between border-b border-border/50 p-3">
                                    <span className="text-muted-foreground">Retention Policy</span>
                                    <span className="font-mono text-xs text-foreground">{entityData.retention || "Standard (30 Days)"}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border/50 p-3">
                                    <span className="text-muted-foreground">Access Level</span>
                                    <span className="font-mono text-xs text-foreground">Restricted (Mission Owners)</span>
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <span className="text-muted-foreground">Bundle Size</span>
                                    <span className="font-mono text-xs text-foreground">{entityData.size}</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 p-4 border-t border-border bg-muted/10 shrink-0 overflow-x-auto custom-scrollbar">
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md text-xs font-medium whitespace-nowrap shadow-sm">
                    <Download className="size-3.5" />
                    Download File
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Database className="size-3.5" />
                    View Bundle
                </button>
                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Code2 className="size-3.5" />
                    Copy Hash
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Download className="size-3.5" />
                    Export
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <FileText className="size-3.5" />
                    Open Mission
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-muted transition-colors rounded-md text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                    <Activity className="size-3.5" />
                    Open Execution
                </button>
            </div>
        </Tabs>
    );
}
