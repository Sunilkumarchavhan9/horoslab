import React from "react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Shared Organization UI Layouts
// ----------------------------------------------------------------------

export function OrganizationLayout({
 children,
 inspector,
}: {
 children: React.ReactNode;
 inspector?: React.ReactNode;
}) {
 return (
 <div className="flex h-full w-full bg-muted/50 dark:bg-[#030303] text-foreground dark:text-[#eee] font-sans">
 {/* Main Content Area */}
 <div className="flex-1 flex flex-col h-full overflow-y-auto">
 <div className="p-8 max-w-[1000px] w-full mx-auto pb-32">
 {children}
 </div>
 </div>

 {/* Optional Right Inspector Panel */}
 {inspector && (
 <div className="w-[380px] shrink-0 border-l border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303] flex flex-col h-full overflow-y-auto shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
 {inspector}
 </div>
 )}
 </div>
 );
}

export function OrganizationHeader({ title, description, badge }: { title: string, description: string, badge?: string }) {
 return (
 <div className="mb-10">
 <div className="flex items-center gap-3 mb-2">
 <h1 className="text-[28px] font-semibold tracking-tight text-foreground dark:text-[#fff]">{title}</h1>
 {badge && (
 <span className="px-2 py-0.5 rounded-md bg-muted dark:bg-white/10 text-[11px] font-mono font-medium text-foreground dark:text-[#F0EFE2]">
 {badge}
 </span>
 )}
 </div>
 <p className="text-[15px] text-muted-foreground dark:text-muted-foreground max-w-2xl">{description}</p>
 </div>
 );
}

// ----------------------------------------------------------------------
// Shared Organization UI Primitives
// ----------------------------------------------------------------------

export function SectionTitle({ title, description }: { title: string, description?: string }) {
 return (
 <div className="mb-4">
 <h3 className="text-[15px] font-semibold tracking-tight text-foreground dark:text-[#fff]">{title}</h3>
 {description && <p className="text-[13px] text-muted-foreground dark:text-muted-foreground mt-0.5">{description}</p>}
 </div>
 );
}

export function StatusBadge({ status }: { status: "healthy" | "warning" | "error" | "neutral" | string }) {
 const getStyles = () => {
 switch (status.toLowerCase()) {
 case "healthy":
 case "active":
 case "online":
 case "pass":
 return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
 case "warning":
 case "review":
 case "invited":
 return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
 case "error":
 case "offline":
 case "fail":
 return "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
 default:
 return "bg-muted text-foreground/80 border-border dark:bg-white/5 dark:text-[#C8C7BA] dark:border-white/10";
 }
 };

 return (
 <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium border uppercase tracking-wider", getStyles())}>
 {status}
 </span>
 );
}
