"use client";

import React, { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, PieChart, Activity, Briefcase, Network, Cpu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CommandBar, SectionHeader, KPICard } from "./governance-shared-components";

export function GovernanceBudgets() {
 const [modalOpen, setModalOpen] = useState(false);

 const containerVariants = {
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.15 } }
 };

 const itemVariants: any = {
 hidden: { opacity: 0, scale: 0.9, y: 10 },
 show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, type: "spring", bounce: 0.4 } }
 };

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#030303] text-foreground dark:text-white font-sans overflow-hidden relative">
 <CommandBar>
 <div className="flex items-center gap-2 w-1/2">
 <DollarSign className="size-4 text-emerald-500" />
 <span className="text-[13px] font-bold text-foreground dark:text-white tracking-wide">AI Cost Governance</span>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
 <div className="flex flex-col h-full p-10 max-w-7xl mx-auto">
 <div className="flex items-center justify-between mb-8">
 <SectionHeader 
 title="Budget Allocation Graph" 
 description="Live telemetry on token usage and cost flowing through the enterprise."
 className="mb-0"
 />
 <button 
 onClick={() => setModalOpen(true)}
 className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold tracking-wide shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all hover:scale-105 flex items-center gap-2"
 >
 <PieChart className="size-4" /> Cost Explorer
 </button>
 </div>

 <div className="grid grid-cols-4 gap-6 mb-12">
 <KPICard title="Total Spend" value="$10,420" trend="up" trendValue="$450" index={0} />
 <KPICard title="Forecast" value="$19,400" subtext="Based on 30d usage" index={1} />
 <KPICard title="Budget Alert" value={
 <span className="flex items-center gap-2 text-red-500">
 <Activity className="size-6" /> Eng (92%)
 </span>
 } index={2} />
 <KPICard title="Tokens Used" value="42.5M" index={3} />
 </div>

 {/* Allocation Graph */}
 <div className="relative w-full rounded-[2rem] bg-[#050505] border border-border dark:border-white/10 p-20 flex flex-col items-center justify-center min-h-[500px] overflow-hidden shadow-2xl">
 {/* Space background effect */}
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none" />
 
 <motion.div 
 variants={containerVariants}
 initial="hidden"
 animate="show"
 className="flex items-center justify-between w-full max-w-6xl relative z-10 gap-6"
 >
 
 {/* Organization */}
 <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 flex-1">
 <div 
 onClick={() => setModalOpen(true)}
 className="size-24 rounded-[1.5rem] bg-card/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-white group hover:scale-110 transition-transform cursor-pointer hover:border-white/30"
 >
 <Briefcase className="size-10 opacity-70 group-hover:opacity-100 transition-opacity" />
 </div>
 <span className="text-[14px] font-bold uppercase tracking-widest text-white/70">Acme Corp</span>
 <span className="text-[18px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-6 py-1.5 rounded-md border border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">$25,000 Limit</span>
 </motion.div>

 {/* Flow Line */}
 <motion.div variants={itemVariants} className="flex-1 h-1.5 bg-card/10 relative rounded-full overflow-hidden">
 <motion.div 
 className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent blur-[2px]"
 animate={{ x: ["-100%", "300%"] }}
 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
 />
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[#121212] border border-emerald-500/30 rounded-md text-[11px] font-mono text-emerald-400 font-bold tracking-widest whitespace-nowrap">
 Allocates
 </div>
 </motion.div>

 {/* Institution */}
 <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 flex-1">
 <div 
 onClick={() => setModalOpen(true)}
 className="size-24 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)] relative overflow-hidden backdrop-blur-md cursor-pointer group hover:scale-110 transition-transform hover:border-emerald-500/60"
 >
 <div className="absolute bottom-0 left-0 w-full bg-emerald-500/30 transition-all duration-1000 ease-in-out group-hover:h-[50%]" style={{ height: '41%' }} />
 <Network className="size-10 relative z-10 opacity-90 transition-transform" />
 </div>
 <span className="text-[14px] font-bold uppercase tracking-widest text-white/70">Engineering</span>
 <span className="text-[14px] bg-emerald-500/20 text-emerald-400 px-6 py-1.5 rounded-md border border-emerald-500/30 font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(52,211,153,0.1)]">41% Used</span>
 </motion.div>

 {/* Flow Line */}
 <motion.div variants={itemVariants} className="flex-1 h-1.5 bg-card/10 relative rounded-full overflow-hidden">
 <motion.div 
 className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#0f52ff] to-transparent blur-[2px]"
 animate={{ x: ["-100%", "300%"] }}
 transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
 />
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[#121212] border border-[#0f52ff]/30 rounded-md text-[11px] font-mono font-bold tracking-widest text-[#0f52ff] whitespace-nowrap">
 Funds
 </div>
 </motion.div>

 {/* Mission */}
 <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 flex-1">
 <div 
 onClick={() => setModalOpen(true)}
 className="size-24 rounded-[1.5rem] bg-[#0f52ff]/10 border border-[#0f52ff]/40 text-[#0f52ff] flex items-center justify-center shadow-[0_0_40px_rgba(15,82,255,0.2)] backdrop-blur-md cursor-pointer group hover:scale-110 transition-transform hover:border-[#0f52ff]/60"
 >
 <Activity className="size-10 opacity-90 group-hover:animate-pulse" />
 </div>
 <span className="text-[14px] font-bold uppercase tracking-widest text-white/70">Mission #193</span>
 <span className="text-[18px] font-mono font-bold text-[#0f52ff] bg-[#0f52ff]/10 px-6 py-1.5 rounded-md border border-[#0f52ff]/20 shadow-[0_0_15px_rgba(15,82,255,0.1)]">$45.20</span>
 </motion.div>

 {/* Flow Line */}
 <motion.div variants={itemVariants} className="flex-1 h-1.5 bg-card/10 relative rounded-full overflow-hidden">
 <motion.div 
 className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px]"
 animate={{ x: ["-100%", "300%"] }}
 transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: 1 }}
 />
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[#121212] border border-amber-500/30 rounded-md text-[11px] font-mono font-bold tracking-widest text-amber-500 whitespace-nowrap">
 Executes
 </div>
 </motion.div>

 {/* Worker */}
 <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 flex-1">
 <div 
 onClick={() => setModalOpen(true)}
 className="size-24 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/40 text-amber-500 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.2)] backdrop-blur-md cursor-pointer group hover:scale-110 transition-transform hover:border-amber-500/60"
 >
 <Cpu className="size-10 opacity-90 group-hover:rotate-12 transition-transform" />
 </div>
 <span className="text-[14px] font-bold uppercase tracking-widest text-white/70">Claude 3.5</span>
 <span className="text-[14px] bg-amber-500/20 text-amber-400 px-6 py-1.5 rounded-md border border-amber-500/30 font-bold font-mono tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">1.2M tkns</span>
 </motion.div>

 </motion.div>
 </div>
 </div>
 </div>

 {/* Center Modal Overlay */}
 <AnimatePresence>
 {modalOpen && (
 <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-10">
 {/* Backdrop */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md pointer-events-auto"
 onClick={() => setModalOpen(false)}
 />
 
 {/* Modal Content */}
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ type: "spring", damping: 25, stiffness: 300 }}
 className="relative w-full max-w-xl bg-card/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
 >
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
 
 <div className="flex items-center justify-between p-8 border-b border-border dark:border-white/10 shrink-0">
 <div className="flex flex-col gap-1">
 <h3 className="text-[20px] font-bold tracking-tight">Cost Explorer</h3>
 <p className="text-[13px] text-foreground/50 dark:text-white/50 mt-1">Real-time breakdown by AI model</p>
 </div>
 <button 
 onClick={() => setModalOpen(false)}
 className="size-10 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-card/10 transition-colors"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
 {/* Cost Breakdown */}
 <div>
 <h4 className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-white/40 mb-6">Model Usage (MTD)</h4>
 <div className="space-y-6">
 <div className="flex flex-col gap-3 group">
 <div className="flex items-center justify-between text-[15px] font-bold">
 <span className="text-[#0f52ff]">Claude 3.5 Sonnet</span>
 <span className="font-mono">$4,200</span>
 </div>
 <div className="w-full h-4 rounded-full bg-muted dark:bg-white/5 overflow-hidden shadow-inner">
 <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gradient-to-r from-[#0f52ff]/50 to-[#0f52ff] rounded-full shadow-[0_0_10px_rgba(15,82,255,0.5)]" />
 </div>
 </div>
 
 <div className="flex flex-col gap-3 group">
 <div className="flex items-center justify-between text-[15px] font-bold">
 <span className="text-emerald-500">GPT-4o</span>
 <span className="font-mono">$1,850</span>
 </div>
 <div className="w-full h-4 rounded-full bg-muted dark:bg-white/5 overflow-hidden shadow-inner">
 <motion.div initial={{ width: 0 }} animate={{ width: '25%' }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 </div>
 </div>

 <div className="flex flex-col gap-3 group">
 <div className="flex items-center justify-between text-[15px] font-bold">
 <span className="text-amber-500">Claude 3 Haiku</span>
 <span className="font-mono">$450</span>
 </div>
 <div className="w-full h-4 rounded-full bg-muted dark:bg-white/5 overflow-hidden shadow-inner">
 <motion.div initial={{ width: 0 }} animate={{ width: '10%' }} transition={{ duration: 1, delay: 0.6 }} className="h-full bg-gradient-to-r from-amber-500/50 to-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
 </div>
 </div>
 </div>
 </div>

 <div className="h-px bg-black/10 dark:bg-white/10" />

 {/* Policies Triggered */}
 <div>
 <h4 className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-white/40 mb-4">Finance Policies</h4>
 <div className="flex flex-col gap-6">
 <div className="p-6 rounded-md border border-red-500/30 bg-card/80 dark:bg-white/5 flex items-center justify-between hover: transition-shadow">
 <span className="text-[15px] font-bold text-red-500">Eng Limit Alert (92%)</span>
 <span className="text-[12px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 px-3 py-1.5 rounded-md shadow-inner animate-pulse">Triggered</span>
 </div>
 <div className="p-6 rounded-md border border-emerald-500/30 bg-card/80 dark:bg-white/5 flex items-center justify-between hover: transition-shadow">
 <span className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">Model Fallback</span>
 <span className="text-[12px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-md shadow-inner">Active</span>
 </div>
 </div>
 </div>

 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
