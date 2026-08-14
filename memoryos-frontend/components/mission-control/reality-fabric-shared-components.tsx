import React from "react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Reality Fabric Shared UI Layouts (Minimalist, Sparse, Dense)
// ----------------------------------------------------------------------

export function RealitySplitView({
 children,
 inspector,
}: {
 children: React.ReactNode;
 inspector?: React.ReactNode;
}) {
 return (
 <div className="flex h-full w-full bg-card dark:bg-[#030303] text-foreground dark:text-[#eee] font-sans">
 {/* Main Content Area */}
 <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-6">
 {children}
 </div>

 {/* Optional Right Inspector Panel */}
 {inspector && (
 <div className="w-[380px] shrink-0 border-l border-border dark:border-white/10 bg-card dark:bg-[#030303] flex flex-col h-full overflow-y-auto">
 {inspector}
 </div>
 )}
 </div>
 );
}

export function RealityHeader({ title, description }: { title: string, description?: string }) {
 return (
 <div className="mb-6 flex flex-col gap-1">
 <h1 className="text-[20px] font-medium tracking-tight text-foreground dark:text-[#fff]">{title}</h1>
 {description && <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">{description}</p>}
 </div>
 );
}

export function DenseRow({ 
 icon, 
 title, 
 subtitle, 
 status, 
 meta, 
 active, 
 onClick 
}: { 
 icon?: React.ReactNode;
 title: string;
 subtitle?: string;
 status?: string;
 meta?: string;
 active?: boolean;
 onClick?: () => void;
}) {
 return (
 <div 
 onClick={onClick}
 className={cn(
 "flex items-center justify-between py-2 px-3 -mx-3 rounded-[6px] cursor-pointer transition-colors group",
 active ? "bg-muted dark:bg-white/10" : "hover:bg-accent dark:hover:bg-card/5"
 )}
 >
 <div className="flex items-center gap-3 w-1/3 min-w-0">
 {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
 <span className={cn("text-[13px] font-medium truncate", active ? "text-foreground dark:text-white" : "text-foreground/80 dark:text-[#ccc] group-hover:text-foreground dark:group-hover:text-white")}>
 {title}
 </span>
 </div>
 
 {subtitle && (
 <div className="w-1/4 min-w-0">
 <span className="text-[13px] text-muted-foreground dark:text-muted-foreground truncate">{subtitle}</span>
 </div>
 )}

 {status && (
 <div className="w-1/6">
 <StatusText status={status} />
 </div>
 )}

 {meta && (
 <div className="flex-1 text-right min-w-0">
 <span className="text-[12px] text-muted-foreground truncate">{meta}</span>
 </div>
 )}
 </div>
 );
}

export function StatusText({ status }: { status: string }) {
 const getStyles = () => {
 switch (status.toLowerCase()) {
 case "healthy":
 case "connected":
 case "pass":
 return "text-emerald-600 dark:text-emerald-500";
 case "warning":
 case "pending txt":
 return "text-amber-600 dark:text-amber-500";
 case "critical":
 case "error":
 case "fail":
 return "text-red-600 dark:text-red-500";
 default:
 return "text-muted-foreground dark:text-muted-foreground";
 }
 };

 return (
 <span className={cn("text-[13px] font-medium", getStyles())}>
 {status}
 </span>
 );
}
