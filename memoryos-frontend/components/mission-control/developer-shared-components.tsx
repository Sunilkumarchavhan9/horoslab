import React from "react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Shared Developer UI Layouts
// ----------------------------------------------------------------------

export function SplitViewLayout({
 sidebar,
 children,
 inspector,
}: {
 sidebar?: React.ReactNode;
 children: React.ReactNode;
 inspector?: React.ReactNode;
}) {
 return (
 <div className="flex h-full w-full bg-muted/50 dark:bg-[#030303] text-foreground dark:text-[#eee] font-sans">
 {/* Optional Left Navigation/Sidebar */}
 {sidebar && (
 <div className="w-[280px] shrink-0 border-r border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303] flex flex-col h-full overflow-y-auto">
 {sidebar}
 </div>
 )}

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col h-full overflow-y-auto">
 <div className="p-8 max-w-[1000px] w-full mx-auto pb-32">
 {children}
 </div>
 </div>

 {/* Optional Right Inspector/Code Panel */}
 {inspector && (
 <div className="w-[450px] shrink-0 border-l border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303] flex flex-col h-full overflow-y-auto shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
 {inspector}
 </div>
 )}
 </div>
 );
}

export function DeveloperHeader({ title, description, badge }: { title: string, description: string, badge?: string }) {
 return (
 <div className="mb-10">
 <div className="flex items-center gap-3 mb-2">
 <h1 className="text-[28px] font-semibold tracking-tight text-foreground dark:text-[#fff]">{title}</h1>
 {badge && (
 <span className="px-2 py-0.5 rounded-md bg-muted dark:bg-white/10 text-[11px] font-mono font-medium text-foreground/60 dark:text-[#F0EFE2]/60">
 {badge}
 </span>
 )}
 </div>
 <p className="text-[15px] text-muted-foreground dark:text-muted-foreground max-w-2xl">{description}</p>
 </div>
 );
}

// ----------------------------------------------------------------------
// Shared Developer UI Components
// ----------------------------------------------------------------------

export function CodeBlock({ code, language = "json", className }: { code: string, language?: string, className?: string }) {
 return (
 <div className={cn("rounded-md bg-[#111] dark:bg-[#000] border border-border dark:border-white/10 overflow-hidden", className)}>
 <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 bg-[#1a1a1a]">
 <span className="text-[11px] font-mono font-medium text-[#F0EFE2]/50 lowercase">{language}</span>
 <button className="text-[11px] font-medium text-[#F0EFE2]/50 hover:text-[#F0EFE2] transition-colors">Copy</button>
 </div>
 <pre className="p-6 text-[13px] font-mono text-[#e4e4e4] overflow-x-auto whitespace-pre-wrap leading-relaxed">
 {code}
 </pre>
 </div>
 );
}

export function ParameterTable({ parameters }: { parameters: Array<{ name: string, type: string, required?: boolean, description: string }> }) {
 return (
 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted/50 dark:bg-[#050505] border-b border-border dark:border-white/10">
 <th className="px-6 py-2.5 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground w-[140px]">Parameter</th>
 <th className="px-6 py-2.5 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Description</th>
 </tr>
 </thead>
 <tbody>
 {parameters.map((param, idx) => (
 <tr key={idx} className="border-b border-border dark:border-white/5 last:border-0 hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50">
 <td className="px-6 py-3 align-top">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2">
 <span className="text-[13px] font-mono font-medium text-foreground dark:text-[#F0EFE2]">{param.name}</span>
 {param.required && <span className="text-[10px] text-red-500 font-medium tracking-wide uppercase">Req</span>}
 </div>
 <span className="text-[12px] font-mono text-muted-foreground dark:text-muted-foreground">{param.type}</span>
 </div>
 </td>
 <td className="px-6 py-3 align-top text-[13px] text-foreground/80 dark:text-[#C8C7BA] leading-relaxed">
 {param.description}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}

export function StatusBadge({ status }: { status: "healthy" | "warning" | "error" | "neutral" | string }) {
 const getStyles = () => {
 switch (status.toLowerCase()) {
 case "healthy":
 case "active":
 case "pass":
 case "200 ok":
 return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
 case "warning":
 case "retrying":
 return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
 case "error":
 case "fail":
 case "critical":
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
