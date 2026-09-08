"use client";

import React, { useState } from "react";
import { FileText, Search, Database, Lock, Hexagon, Fingerprint, History, Play, CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CommandBar, SectionHeader, MOCK_AUDIT_LOGS } from "./governance-shared-components";

export function GovernanceAudit() {
 const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

 const selectedLog = selectedLogId ? MOCK_AUDIT_LOGS.find(l => l.id === selectedLogId) : null;

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#030303] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden relative">
 <CommandBar>
 <div className="flex items-center gap-6 w-1/2">
 <div className="flex items-center gap-2">
 <Database className="size-4 text-foreground/50 dark:text-[#F0EFE2]/50" />
 <span className="text-[13px] font-bold text-foreground dark:text-[#F0EFE2] tracking-wide">Enterprise Ledger</span>
 </div>
 <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[11px] font-bold tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
 <Lock className="size-3.5" /> IMMUTABLE
 </div>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-hidden flex flex-col relative z-0">
 <div className="flex flex-col h-full bg-card dark:bg-[#050505]">
 <div className="p-10 border-b border-border dark:border-white/10 shrink-0 bg-card/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl">
 <div className="flex items-start justify-between">
 <div className="flex flex-col gap-1.5">
 <h2 className="text-[22px] font-bold tracking-tight">Audit Explorer</h2>
 <p className="text-[14px] text-foreground/50 dark:text-[#F0EFE2]/50">Cryptographically verified execution trail across all missions.</p>
 </div>
 <div className="relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-foreground/40 dark:text-[#F0EFE2]/40 group-focus-within:text-[#0f52ff] transition-colors" />
 <input 
 type="text" 
 placeholder="Search hash or actor..." 
 className="w-72 pl-11 pr-4 py-2.5 bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-md text-[14px] outline-none focus:border-[#0f52ff] focus:ring-4 focus:ring-[#0f52ff]/10 transition-all "
 />
 </div>
 </div>
 </div>

 {/* Ledger Table */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
 <div className="bg-card/50 dark:bg-[#0a0a0a]/50 rounded-[2rem] border border-border dark:border-white/5 overflow-hidden backdrop-blur-md">
 <table className="w-full text-left text-[14px]">
 <thead className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 bg-muted dark:bg-white/5 border-b border-border dark:border-white/10">
 <tr>
 <th className="py-6 pl-8 w-[200px]">Timestamp</th>
 <th className="py-6">Actor</th>
 <th className="py-6">Action</th>
 <th className="py-6">Target</th>
 <th className="py-6 text-right pr-8">Signature</th>
 </tr>
 </thead>
 <tbody>
 <AnimatePresence>
 {MOCK_AUDIT_LOGS.map((log, index) => (
 <motion.tr 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.05 }}
 key={log.id}
 onClick={() => setSelectedLogId(log.id)}
 className={cn(
 "border-b border-border dark:border-white/5 cursor-pointer transition-all duration-300 group hover:bg-accent dark:hover:bg-card/5",
 selectedLogId === log.id && "bg-[#0f52ff]/5 border-[#0f52ff]/20"
 )}
 >
 <td className="py-6 pl-8 text-[13px] font-mono text-foreground/50 dark:text-[#F0EFE2]/50 tracking-tight group-hover:text-foreground dark:group-hover:text-[#F0EFE2] transition-colors">{log.timestamp}</td>
 <td className="py-6 font-bold tracking-tight text-[15px]">{log.actor}</td>
 <td className="py-6">
 <span className={cn(
 "px-3 py-1.5 rounded-md text-[13px] font-bold inline-flex items-center gap-2",
 log.action.includes("Approved") ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
 log.action.includes("Denied") ? "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400" :
 "bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-foreground/70 dark:text-[#F0EFE2]/70"
 )}>
 {log.action.includes("Approved") && <CheckCircle2 className="size-4" />}
 {log.action.includes("Denied") && <XCircle className="size-4" />}
 {log.action}
 </span>
 </td>
 <td className="py-6 font-mono text-[14px] text-foreground/70 dark:text-[#F0EFE2]/70">{log.target}</td>
 <td className="py-6 text-right pr-8">
 <span className="font-mono text-[13px] text-[#0f52ff] bg-[#0f52ff]/10 px-3 py-1.5 rounded-md border border-[#0f52ff]/20 shadow-[0_0_10px_rgba(15,82,255,0.1)] inline-block">
 {log.signature}
 </span>
 </td>
 </motion.tr>
 ))}
 </AnimatePresence>
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>

 {/* Center Modal Overlay */}
 <AnimatePresence>
 {selectedLog && (
 <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-10">
 {/* Backdrop */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm pointer-events-auto"
 onClick={() => setSelectedLogId(null)}
 />
 
 {/* Modal Content */}
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ type: "spring", damping: 25, stiffness: 300 }}
 className="relative w-full max-w-2xl bg-card/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]"
 >
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0f52ff] to-transparent opacity-50" />
 
 <div className="flex items-center justify-between p-8 border-b border-border dark:border-white/10 shrink-0">
 <div className="flex flex-col gap-1">
 <h3 className="text-[20px] font-bold tracking-tight">Record Inspector</h3>
 <p className="text-[13px] text-foreground/50 dark:text-[#F0EFE2]/50 mt-1 font-mono flex items-center gap-2">
 ID: <span className="text-foreground dark:text-[#F0EFE2] font-bold">{selectedLog.id}</span>
 </p>
 </div>
 <button 
 onClick={() => setSelectedLogId(null)}
 className="size-10 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-card/10 transition-colors"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
 {/* Hash Viewer */}
 <div>
 <h4 className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 mb-4 flex items-center gap-2">
 <Hexagon className="size-4" /> Immutable Hash
 </h4>
 <div className="bg-[#030303] rounded-md p-6 font-mono text-[14px] text-emerald-400 break-all shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] border border-black/20 dark:border-white/10 relative overflow-hidden group">
 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
 </div>
 </div>

 {/* Signature Viewer */}
 <div>
 <h4 className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 mb-4 flex items-center gap-2">
 <Fingerprint className="size-4" /> Cryptographic Signature
 </h4>
 <div className="flex flex-col gap-3">
 <div className="flex justify-between items-center text-[15px] p-6 rounded-md bg-muted dark:bg-white/5 border border-border dark:border-white/10 ">
 <span className="text-foreground/50 dark:text-[#F0EFE2]/50 font-medium">Key ID</span>
 <span className="font-mono font-bold text-[#0f52ff] bg-[#0f52ff]/10 px-3 py-1 rounded-md border border-[#0f52ff]/20">{selectedLog.signature}</span>
 </div>
 <div className="flex justify-between items-center text-[15px] p-6 rounded-md bg-muted dark:bg-white/5 border border-border dark:border-white/10 ">
 <span className="text-foreground/50 dark:text-[#F0EFE2]/50 font-medium">Algorithm</span>
 <span className="font-mono font-bold">Ed25519</span>
 </div>
 <div className="flex justify-between items-center text-[15px] p-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 relative overflow-hidden group">
 <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
 <span className="text-emerald-600 dark:text-emerald-400 font-bold relative z-10">Verification</span>
 <span className="text-[13px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 relative z-10">
 <Lock className="size-4" /> Valid
 </span>
 </div>
 </div>
 </div>

 <div className="h-px bg-black/10 dark:bg-white/10" />

 {/* Replay Panel */}
 <div className="relative">
 <div className="absolute -inset-4 bg-gradient-to-br from-[#0f52ff]/5 to-transparent rounded-md pointer-events-none" />
 <h4 className="text-[12px] font-bold uppercase tracking-widest text-[#0f52ff] mb-4 flex items-center gap-2 relative z-10">
 <Play className="size-4" /> Execution Replay
 </h4>
 <p className="text-[14px] text-foreground/60 dark:text-[#F0EFE2]/60 mb-6 leading-relaxed relative z-10">
 This action is linked to an executed mission node. You can replay the exact state from this timestamp.
 </p>
 <button className="w-full py-6 rounded-md bg-[#0f52ff] hover:bg-[#0042e6] text-[#F0EFE2] text-[15px] font-bold tracking-wide transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(15,82,255,0.3)] relative z-10">
 <History className="size-5" /> Load Context in Replay
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
