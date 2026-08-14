import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    Activity, AlertCircle, Database, Server, Timer, Zap,
    Clock, XCircle, PlayCircle, AlertTriangle, Check, Search, ShieldAlert, XOctagon, FileWarning,
    RefreshCw, Loader2, CheckCircle2, ShieldCheck, Box, Workflow
} from "lucide-react";
import React from "react";

// --- Mission Primitives ---

export function MissionStageBadge({ stage }: { stage: "pending" | "running" | "verifying" | "success" | "failed" | "recovering" }) {
    const config = {
        pending: { icon: Clock, className: "text-muted-foreground bg-muted", label: "Pending" },
        running: { icon: Loader2, className: "text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse", label: "Running" },
        verifying: { icon: ShieldCheck, className: "text-purple-500 bg-purple-500/10 border-purple-500/20", label: "Verifying" },
        success: { icon: CheckCircle2, className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "Success" },
        failed: { icon: XOctagon, className: "text-red-500 bg-red-500/10 border-red-500/20", label: "Failed" },
        recovering: { icon: RefreshCw, className: "text-orange-500 bg-orange-500/10 border-orange-500/20", label: "Recovering" },
    };

    const { icon: Icon, className, label } = config[stage] || config["pending"];

    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider", className)}>
            <Icon className={cn("size-3", stage === "running" && "animate-spin")} />
            {label}
        </span>
    );
}

export function MissionProgress({ progress, eta, currentStep }: { progress: number, eta?: string, currentStep?: string }) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="truncate max-w-[120px] font-medium text-foreground">{currentStep || "Executing..."}</span>
                <span className="font-mono">{eta ? eta : `${progress}%`}</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-muted" />
        </div>
    );
}

// --- Worker Primitives ---

export function WorkerHealthCard({ 
    name, 
    status, 
    latency, 
    reliability, 
    activeLeases,
    onClick
}: { 
    name: string, 
    status: "Healthy" | "Degraded" | "Offline",
    latency: string,
    reliability: string,
    activeLeases: number,
    onClick?: () => void
}) {
    const isHealthy = status === "Healthy";
    const statusColor = status === "Healthy" ? "text-emerald-500" : status === "Degraded" ? "text-orange-500" : "text-red-500";
    
    return (
        <Card onClick={onClick} className="p-4 bg-card/60 backdrop-blur-sm border-border/40 hover:border-border/80 transition-all shadow-sm flex flex-col gap-3 group cursor-pointer">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center border border-border/50 group-hover:border-foreground/20 transition-colors">
                        <Server className="size-4 text-foreground/70" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-tight">{name}</span>
                        <span className={cn("text-[10px] font-medium uppercase tracking-wider", statusColor)}>{status}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground uppercase">Leases</span>
                    <span className="text-sm font-mono font-medium text-foreground">{activeLeases}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded-md p-2 border border-border/20">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-muted-foreground font-medium">Latency</span>
                    <span className="font-mono font-medium text-foreground">{latency}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-muted-foreground font-medium">Reliability</span>
                    <span className="font-mono font-medium text-foreground">{reliability}</span>
                </div>
            </div>
        </Card>
    );
}

// --- Evidence Primitives ---

export function EvidenceCounter({ count, label = "Proofs" }: { count: number, label?: string }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/50 border border-border/50">
            <Box className="size-3 text-muted-foreground" />
            <span className="text-xs font-mono font-medium">{count}</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
    );
}
