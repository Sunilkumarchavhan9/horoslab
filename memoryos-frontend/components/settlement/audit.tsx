"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ShieldCheck, Download, Fingerprint, Lock, ArrowDown, Database, Cpu, User, CheckCircle2, Link2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_LEDGER = [
  { id: "L-9005", time: "11:45:02", action: "Settlement Complete", actor: "Epoch Network", type: "SYSTEM", hash: "0x7a8b...3e4f", prevHash: "0x2c1d...8a9b", signature: "VALID" },
  { id: "L-9004", time: "11:44:18", action: "Verifier PASS", actor: "Security AI v2", type: "AI", hash: "0x2c1d...8a9b", prevHash: "0x9f8e...7d6c", signature: "VALID" },
  { id: "L-9003", time: "11:32:05", action: "Human Approved", actor: "sarah.connor@eng", type: "HUMAN", hash: "0x9f8e...7d6c", prevHash: "0x5b4a...3c2d", signature: "VALID" },
  { id: "L-9002", time: "11:28:40", action: "Claude Generated PR", actor: "Worker-Claude-3.5", type: "AI", hash: "0x5b4a...3c2d", prevHash: "0x1a2b...3c4d", signature: "VALID" },
  { id: "L-9001", time: "11:20:00", action: "Planner Created", actor: "Planner AI v4", type: "AI", hash: "0x1a2b...3c4d", prevHash: "0x0000...0000", signature: "VALID" },
]

export function SettlementAudit() {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  
  const selectedEntry = MOCK_LEDGER.find(l => l.id === selectedEntryId)

  return (
    <div className="flex h-full w-full bg-[#111111] text-[#F0EFE2] font-mono">
      
      {/* Main Content (The Ledger) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${selectedEntry ? 'lg:w-[550px] lg:flex-none border-r border-white/10' : 'w-full'}`}>
        
        {/* Header */}
        <div className="p-8 border-b border-white/10 bg-black">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <h1 className="text-2xl font-bold tracking-tight text-[#F0EFE2] mb-2 flex items-center gap-3">
                    <Lock className="size-6 text-[#2da44e]" /> Immutable Audit Ledger
                 </h1>
                 <p className="text-sm text-[#F0EFE2]/50">Cryptographically verifiable sequence of all operational events.</p>
              </div>
              <Button variant="outline" className="bg-white/5 border-white/10 text-[#F0EFE2] hover:bg-white/10 h-9 font-sans">
                 <Download className="size-4 mr-2" /> Export Ledger Data
              </Button>
           </div>
           
           <div className="flex items-center gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#F0EFE2]/40" />
               <input 
                 type="text"
                 placeholder="Search by Hash, Actor, or Mission ID..."
                 className="w-full pl-9 pr-4 py-2 bg-white/5 border-transparent focus:bg-white/10 rounded-md text-sm outline-none focus:ring-1 focus:ring-[#0f52ff] transition-all text-[#F0EFE2] font-mono placeholder:text-[#F0EFE2]/30"
               />
             </div>
             <Button variant="outline" className="h-9 px-4 border-white/10 text-[#F0EFE2]/70 bg-white/5 font-sans">
                <Filter className="size-3.5 mr-2" /> Filter Chain
             </Button>
          </div>
        </div>

        {/* Ledger View */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#111111] custom-scrollbar relative">
           <div className="absolute top-0 bottom-0 left-12 w-px bg-white/10 z-0" />
           
           <div className="space-y-0 relative z-10">
              {MOCK_LEDGER.map((entry, idx) => (
                 <div key={entry.id} className="flex flex-col">
                    <div 
                       onClick={() => setSelectedEntryId(entry.id)}
                       className={`group cursor-pointer rounded-md bg-[#1a1a1a] border p-4 transition-all flex items-center gap-6 relative ${selectedEntryId === entry.id ? 'border-[#0f52ff] shadow-[0_0_20px_rgba(15,82,255,0.2)] ml-4 mr-0' : 'border-white/10 hover:border-white/30 hover:bg-[#222222] ml-0 mr-4'}`}
                    >
                       <div className="flex flex-col items-center justify-center shrink-0 w-16 gap-1 border-r border-white/10 pr-4">
                          <span className="text-xs text-[#F0EFE2]/40">{entry.time}</span>
                       </div>
                       
                       <div className="flex-1 min-w-0 grid grid-cols-3 gap-4 items-center">
                          <div>
                             <div className="text-sm font-bold text-[#F0EFE2] mb-1">{entry.action}</div>
                             <div className="text-[10px] text-[#F0EFE2]/50 uppercase flex items-center gap-1">
                                {entry.type === 'AI' ? <Cpu className="size-3"/> : entry.type === 'HUMAN' ? <User className="size-3"/> : <ShieldCheck className="size-3"/>}
                                {entry.actor}
                             </div>
                          </div>
                          <div className="col-span-2 flex items-center justify-between bg-black/40 rounded p-2 border border-white/5">
                             <div className="flex flex-col">
                                <span className="text-[9px] text-[#F0EFE2]/30 uppercase tracking-widest mb-0.5">Hash Record</span>
                                <span className="text-xs text-[#0f52ff]">{entry.hash}</span>
                             </div>
                             <div className="flex items-center gap-1 text-[10px] text-[#2da44e] font-bold bg-[#2da44e]/10 px-2 py-1 rounded">
                                <Fingerprint className="size-3" /> SIGNED
                             </div>
                          </div>
                       </div>
                    </div>
                    {idx < MOCK_LEDGER.length - 1 && (
                       <div className="h-8 flex items-center ml-12 pl-2">
                          <ArrowDown className="size-4 text-[#F0EFE2]/20" />
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Deep Dive Inspector (Blockchain Explorer Style) */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex-1 bg-black flex flex-col relative z-20 overflow-hidden border-l border-white/10 shadow-2xl"
          >
             <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]">
               <div>
                  <div className="text-[#0f52ff] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                     <Link2 className="size-4" /> Block Explorer View
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-[#F0EFE2]">Record {selectedEntry.id}</h2>
               </div>
               <button className="p-2 rounded-full hover:bg-white/10 text-[#F0EFE2]/50 hover:text-[#F0EFE2] transition-colors" onClick={() => setSelectedEntryId(null)}>
                 <X className="size-5" />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                {/* Cryptographic Linkage Visual */}
                <div className="flex justify-center mb-10">
                   <div className="flex items-center gap-4 bg-[#111] p-4 rounded-md border border-white/10">
                      <div className="flex flex-col items-center">
                         <div className="text-[9px] text-[#F0EFE2]/40 mb-1">PREVIOUS BLOCK</div>
                         <div className="text-xs text-[#F0EFE2]/70 bg-black px-2 py-1 rounded border border-white/5">{selectedEntry.prevHash}</div>
                      </div>
                      <Link2 className="size-5 text-[#0f52ff]" />
                      <div className="flex flex-col items-center">
                         <div className="text-[9px] text-[#0f52ff] font-bold mb-1">CURRENT HASH</div>
                         <div className="text-xs text-[#F0EFE2] bg-[#0f52ff]/20 border border-[#0f52ff]/40 px-2 py-1 rounded">{selectedEntry.hash}</div>
                      </div>
                   </div>
                </div>
                
                <h4 className="text-[10px] font-bold text-[#F0EFE2]/40 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Record Payload</h4>
                <div className="space-y-4 mb-8">
                   <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-[#F0EFE2]/50 text-xs">Timestamp</div>
                      <div className="col-span-2 text-[#F0EFE2] text-sm">{selectedEntry.time} UTC</div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-[#F0EFE2]/50 text-xs">Action / Event</div>
                      <div className="col-span-2 text-[#F0EFE2] font-bold text-sm">{selectedEntry.action}</div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-[#F0EFE2]/50 text-xs">Actor Identity</div>
                      <div className="col-span-2 flex items-center gap-2">
                         {selectedEntry.type === 'AI' ? <Cpu className="size-4 text-[#F0EFE2]/40"/> : selectedEntry.type === 'HUMAN' ? <User className="size-4 text-[#F0EFE2]/40"/> : <ShieldCheck className="size-4 text-[#F0EFE2]/40"/>}
                         <span className="text-[#F0EFE2] text-sm">{selectedEntry.actor}</span>
                         <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-[#F0EFE2]/50">{selectedEntry.type}</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-[#F0EFE2]/50 text-xs">Mission ID</div>
                      <div className="col-span-2 text-[#0f52ff] hover:underline cursor-pointer text-sm">sm-241</div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 text-[#F0EFE2]/50 text-xs">Evidence Attached</div>
                      <div className="col-span-2 text-[#F0EFE2] text-sm flex items-center gap-1"><Database className="size-3"/> 3 Artifacts</div>
                   </div>
                </div>
                
                <h4 className="text-[10px] font-bold text-[#F0EFE2]/40 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Cryptographic Proof</h4>
                <div className="bg-[#111] border border-white/10 rounded-md overflow-hidden">
                   <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-[#F0EFE2] font-bold">
                         <Fingerprint className="size-4 text-[#2da44e]" /> Signature Status
                      </div>
                      <div className="text-[10px] bg-[#2da44e]/10 text-[#2da44e] px-2 py-1 rounded font-bold">VERIFIED</div>
                   </div>
                   <div className="p-4 text-[10px] text-[#F0EFE2]/40 leading-relaxed break-all bg-black/50">
                      -----BEGIN EPOCH SIGNATURE-----<br/>
                      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy8DbvCG...<br/>
                      e3T9yHn9Q/bH4W8V4V4V4V4V4V4V4V4V4V4V4V4V4V4V4V4V4V...<br/>
                      w0BAQEFAAOCAQ8AMIIBCgKCAQEAy8DbvCGMIIBIjANBgkqhkiG...<br/>
                      -----END EPOCH SIGNATURE-----
                   </div>
                </div>

             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
