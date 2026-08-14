"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, Copy, ExternalLink, ScrollText, Code, FileJson, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MissionInspector } from "./workspace/mission-inspector";
import { InstitutionInspector } from "./workspace/institution-inspector";
import { WorkerInspector } from "./workspace/worker-inspector";
import { EventInspector } from "./workspace/event-inspector";
import { ExecutionInspector } from "./operations/execution-inspector";
import { EvidenceInspector } from "./operations/evidence-inspector";
import { VerificationInspector } from "./operations/verification-inspector";
import { ApprovalInspector } from "./operations/approval-inspector";
import { RecoveryInspector } from "./operations/recovery-inspector";
import { IntelligenceInspector } from "./dashboards/intelligence-inspector";
import { GovernanceInspector } from "./governance/governance-inspector";
import { BudgetInspector } from "./governance/budget-inspector";
import { RecoveryPolicyInspector } from "./governance/recovery-policy-inspector";
import { AuditInspector } from "./governance/audit-inspector";
import { MemoryPreflightInspector } from "./settlement/memory-preflight-inspector";
import { MissionOutcomeInspector } from "./settlement/mission-outcome-inspector";
import { LearningHandoffInspector } from "./settlement/learning-handoff-inspector";
import { SettlementInspector } from "./settlement/settlement-inspector";
import { CertificateInspector } from "./settlement/certificate-inspector";
import { ApiInspector } from "./developer/api-inspector";
import { ApiKeysInspector } from "./developer/api-keys-inspector";
import { SdkInspector } from "./developer/sdk-inspector";
import { McpInspector } from "./developer/mcp-inspector";
import { CliInspector } from "./developer/cli-inspector";
import { WebhookInspector } from "./developer/webhook-inspector";
import { EdgeRuntimeInspector } from "./developer/edge-runtime-inspector";
import { LiveEntityInspector } from "./live-entity-inspector";

type EntityType = "mission" | "worker" | "institution" | "event" | "evidence" | "execution" | "verification" | "approval" | "recovery" | "intelligence" | "governance" | "budget" | "recovery_policy" | "audit" | "memory_preflight" | "mission_outcome" | "learning_handoff" | "settlement" | "certificate" | "api" | "api_key" | "sdk" | "mcp" | "cli" | "webhook" | "edge_runtime" | null;

interface InspectorState {
    isOpen: boolean;
    entityType: EntityType;
    entityData: any;
}

interface InspectorContextType extends InspectorState {
    openInspector: (type: EntityType, data: any) => void;
    closeInspector: () => void;
}

const InspectorContext = createContext<InspectorContextType | undefined>(undefined);

export function useInspector() {
    const context = useContext(InspectorContext);
    if (!context) {
        throw new Error("useInspector must be used within an InspectorProvider");
    }
    return context;
}

export function InspectorProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<InspectorState>({
        isOpen: false,
        entityType: null,
        entityData: null,
    });

    const openInspector = (type: EntityType, data: any) => {
        setState({ isOpen: true, entityType: type, entityData: data });
    };

    const closeInspector = () => {
        setState({ isOpen: false, entityType: null, entityData: null });
    };

    return (
        <InspectorContext.Provider value={{ ...state, openInspector, closeInspector }}>
            {children}
            <UniversalInspectorDrawer />
        </InspectorContext.Provider>
    );
}

function UniversalInspectorDrawer() {
    const { isOpen, entityType, entityData, closeInspector } = useInspector();
    const [drawerWidth, setDrawerWidth] = useState(600);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newWidth = window.innerWidth - e.clientX;
            const maxWidth = window.innerWidth;
            const minWidth = 400;
            setDrawerWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            document.body.style.cursor = 'col-resize';
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.body.style.cursor = '';
        }

        return () => {
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isOpen || !entityData) return null;

    const title = entityData?.name || entityData?.title || entityData?.id || "Inspector Detail";
    const status = entityData?.status || entityData?.state || "Unknown";

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeInspector()}>
            <SheetContent 
                side="right" 
                className={cn("p-0 flex flex-col border-l border-border bg-card/95 backdrop-blur-md", isDragging ? "transition-none duration-0" : "")}
                style={{ maxWidth: '100vw', width: `${drawerWidth}px` }}
            >
                <SheetTitle className="sr-only">{title}</SheetTitle>
                {/* Resize Handle */}
                <div 
                    className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 z-50 group flex items-center justify-center"
                    onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
                >
                    <div className="h-10 w-1.5 rounded-full bg-border/50 group-hover:bg-primary/50 transition-colors flex flex-col items-center justify-center gap-1">
                        <div className="size-0.5 rounded-full bg-white/70 group-hover:bg-white" />
                        <div className="size-0.5 rounded-full bg-white/70 group-hover:bg-white" />
                        <div className="size-0.5 rounded-full bg-white/70 group-hover:bg-white" />
                    </div>
                </div>

                <div className="flex flex-col h-full overflow-hidden pl-1">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border bg-muted/20 flex flex-col gap-4 shrink-0">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                        {entityType}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-foreground truncate">{title}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="size-8" title="Copy Metadata JSON">
                                    <Copy className="size-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="size-8" title="Open Full Page">
                                    <ExternalLink className="size-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs uppercase px-2 py-0.5 rounded-full font-medium">
                                {status}
                            </Badge>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {entityType === "mission" ? (
                            <MissionInspector entityData={entityData} />
                        ) : entityType === "institution" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "worker" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "event" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "execution" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "evidence" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "verification" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "approval" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "recovery" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "intelligence" ? (
                            <LiveEntityInspector entityData={entityData} />
                        ) : entityType === "governance" ? (
                            <GovernanceInspector entityData={entityData} />
                        ) : entityType === "budget" ? (
                            <BudgetInspector entityData={entityData} />
                        ) : entityType === "recovery_policy" ? (
                            <RecoveryPolicyInspector entityData={entityData} />
                        ) : entityType === "audit" ? (
                            <AuditInspector entityData={entityData} />
                        ) : entityType === "memory_preflight" ? (
                            <MemoryPreflightInspector entityData={entityData} />
                        ) : entityType === "mission_outcome" ? (
                            <MissionOutcomeInspector entityData={entityData} />
                        ) : entityType === "learning_handoff" ? (
                            <LearningHandoffInspector entityData={entityData} />
                        ) : entityType === "settlement" ? (
                            <SettlementInspector entityData={entityData} />
                        ) : entityType === "certificate" ? (
                            <CertificateInspector entityData={entityData} />
                        ) : entityType === "api" ? (
                            <ApiInspector entityData={entityData} />
                        ) : entityType === "api_key" ? (
                            <ApiKeysInspector entityData={entityData} />
                        ) : entityType === "sdk" ? (
                            <SdkInspector entityData={entityData} />
                        ) : entityType === "mcp" ? (
                            <McpInspector entityData={entityData} />
                        ) : entityType === "cli" ? (
                            <CliInspector entityData={entityData} />
                        ) : entityType === "webhook" ? (
                            <WebhookInspector entityData={entityData} />
                        ) : entityType === "edge_runtime" ? (
                            <EdgeRuntimeInspector entityData={entityData} />
                        ) : (
                            <Tabs defaultValue="summary" className="flex-1 flex flex-col w-full h-full">
                                <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                                    <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                                        <TabsTrigger value="summary" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                            <Activity className="size-3.5 mr-2" />
                                            Summary
                                        </TabsTrigger>
                                        <TabsTrigger value="json" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                            <FileJson className="size-3.5 mr-2" />
                                            Metadata
                                        </TabsTrigger>
                                        <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-medium uppercase tracking-wider">
                                            <ScrollText className="size-3.5 mr-2" />
                                            Logs
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <ScrollArea className="flex-1 w-full bg-background/50">
                                    <div className="p-6">
                                        <TabsContent value="summary" className="m-0 focus-visible:outline-none">
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(entityData).slice(0, 6).map(([key, value]) => {
                                                        if (typeof value === "object" || Array.isArray(value)) return null;
                                                        return (
                                                            <div key={key} className="flex flex-col gap-1">
                                                                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">{key}</span>
                                                                <span className="text-sm font-medium text-foreground">{String(value)}</span>
                                                            </div>
                                                        );
                                                    })}
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
                                        <TabsContent value="logs" className="m-0 focus-visible:outline-none">
                                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                                                <Code className="size-8 mb-4 opacity-50" />
                                                <p>No recent log events found for this {entityType}.</p>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </ScrollArea>
                            </Tabs>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
