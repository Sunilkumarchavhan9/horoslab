"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function CommandBar({ children, className }: { children?: React.ReactNode; className?: string }) {
 return (
 <div className={cn("flex items-center justify-between px-6 py-3 border-b border-border dark:border-white/10 bg-card/70 dark:bg-[#050505]/70 backdrop-blur-xl shrink-0 sticky top-0 z-50", className)}>
 {children}
 </div>
 );
}

export function SectionHeader({ title, description, action, className }: { title: string, description?: string, action?: React.ReactNode, className?: string }) {
 return (
 <div className={cn("flex items-start justify-between mb-8 shrink-0 relative", className)}>
 <div className="absolute -inset-8 bg-gradient-to-b from-[#0f52ff]/5 to-transparent opacity-50 pointer-events-none" />
 <div className="flex flex-col gap-1.5 relative z-10">
 <h2 className="text-[24px] font-bold text-foreground dark:text-[#F0EFE2] tracking-tight leading-none">{title}</h2>
 {description && <p className="text-[14px] text-foreground/50 dark:text-[#F0EFE2]/50 max-w-2xl">{description}</p>}
 </div>
 {action && <div className="relative z-10">{action}</div>}
 </div>
 );
}

export function KPICard({ title, value, subtext, trend, trendValue, index = 0 }: { title: string, value: string | React.ReactNode, subtext?: string, trend?: "up" | "down" | "neutral", trendValue?: string, index?: number }) {
 return (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
 className="bg-card/60 dark:bg-[#121212]/60 backdrop-blur-md border border-border dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 rounded-md p-6 flex flex-col gap-2 relative overflow-hidden group hover:"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
 <span className="text-[12px] font-bold uppercase tracking-widest text-foreground/50 dark:text-[#F0EFE2]/50 z-10">{title}</span>
 <div className="flex items-end justify-between mt-2 z-10">
 <span className="text-[32px] font-mono font-bold text-foreground dark:text-[#F0EFE2] leading-none tracking-tight">{value}</span>
 {trend && (
 <div className={cn(
 "text-[12px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm",
 trend === "up" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
 trend === "down" ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" :
 "text-foreground/60 dark:text-[#F0EFE2]/60 bg-muted dark:bg-white/5 border-border dark:border-white/10"
 )}>
 {trend === "up" ? "↑" : trend === "down" ? "↓" : "-"} {trendValue}
 </div>
 )}
 </div>
 {subtext && <span className="text-[12px] text-foreground/40 dark:text-[#F0EFE2]/40 mt-1 z-10">{subtext}</span>}
 </motion.div>
 );
}

// Optional Inspector Modal Overlay layout wrapper
export function InspectorModal({ isOpen, onClose, title, subtitle, children }: { isOpen: boolean, onClose: () => void, title: string, subtitle?: string, children: React.ReactNode }) {
 return (
 <AnimatePresence>
 {isOpen && (
 <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-10">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md pointer-events-auto"
 onClick={onClose}
 />
 
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ type: "spring", damping: 25, stiffness: 300 }}
 className="relative w-full max-w-3xl bg-card/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]"
 >
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0f52ff] to-transparent opacity-50" />
 
 <div className="flex items-center justify-between p-8 border-b border-border dark:border-white/10 shrink-0">
 <div className="flex flex-col gap-1">
 <h3 className="text-[20px] font-bold tracking-tight">{title}</h3>
 {subtitle && <p className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50 mt-1">{subtitle}</p>}
 </div>
 <button 
 onClick={onClose}
 className="size-10 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-card/10 transition-colors"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
 {children}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
