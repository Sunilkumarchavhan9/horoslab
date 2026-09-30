import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, Search, Bell, Plus, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DhyraLogo } from "@/components/dhyra/primitives/dhyra-logo";
import React from "react";

export function MetricCard({ 
    title, 
    value, 
    icon: Icon, 
    trend,
    trendUp,
    valueColor = "text-foreground"
}: { 
    title: string, 
    value: React.ReactNode, 
    icon?: LucideIcon,
    trend?: string,
    trendUp?: boolean,
    valueColor?: string
}) {
    return (
        <Card className="p-5 flex flex-col gap-2 bg-card/60 border border-border/40 backdrop-blur-sm shadow-sm rounded-xl hover:bg-card/80 transition-colors">
            <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
                {Icon && <Icon className="size-4 opacity-70" />}
            </div>
            <div className="flex items-end gap-3 mt-1">
                <span className={cn("text-3xl font-bold tracking-tight leading-none", valueColor)}>{value}</span>
                {trend && (
                    <span className={cn(
                        "text-[11px] font-medium px-1.5 py-0.5 rounded-full mb-1",
                        trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
        </Card>
    );
}

export function StatusBadge({ 
    status, 
    type 
}: { 
    status: string, 
    type: "success" | "warning" | "error" | "info" | "neutral" | "running"
}) {
    const styles = {
        success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        error: "bg-red-500/10 text-red-500 border-red-500/20",
        info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        neutral: "bg-muted text-muted-foreground border-border/50",
    };
    
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider shrink-0", styles[type])}>
            {status}
        </span>
    );
}

export function SectionHeader({ title, action, className }: { title: string, action?: React.ReactNode, className?: string }) {
    return (
        <div className={cn("flex items-center justify-between w-full", className)}>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

export function CommandHeader() {
    return (
        <div className="flex items-center justify-between w-full pb-6 border-b border-border/40 mb-6">
            <div className="flex items-center gap-6">
                <div className="flex items-center">
                    <DhyraLogo size="md" className="text-foreground" />
                </div>
                
                <div className="h-4 w-px bg-border" />
                
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    <span>Acme Corp Workspace</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Global Search... (⌘K)" 
                        className="h-8 w-64 bg-muted/30 border border-border/50 rounded-md pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border/80 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button className="h-8 flex items-center gap-2 bg-foreground text-background px-3 rounded-md text-xs font-medium hover:bg-foreground/90 transition-colors">
                        <Plus className="size-3.5" />
                        Create Mission
                    </button>
                    
                    <button className="size-8 flex items-center justify-center bg-card border border-border/40 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <RefreshCw className="size-3.5" />
                    </button>
                    
                    <button className="size-8 flex items-center justify-center bg-card border border-border/40 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative">
                        <Bell className="size-3.5" />
                        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-blue-500" />
                    </button>

                    <div className="ml-2 pl-4 border-l border-border/40">
                        <Avatar className="size-8 cursor-pointer hover:ring-2 ring-border transition-all">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-muted text-xs font-semibold">SK</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ActionLink({ children, color }: { children: React.ReactNode, color: string }) {
    return (
        <button className={cn("flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4 transition-all", color)}>
            {children}
            <span className="opacity-50 text-[10px]">→</span>
        </button>
    );
}
