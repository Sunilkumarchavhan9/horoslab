"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ShieldCheck, Activity, Brain, ArrowRight, X, ChevronRight, FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_CLAIMS = [
  { id: "claim-1", text: "The API migration completed successfully.", status: "SUPPORTED", evidenceCount: 8, verifier: "Security Core", confidence: 98, mission: "MISSION-241" },
  { id: "claim-2", text: "No PII data was logged during execution.", status: "SUPPORTED", evidenceCount: 12, verifier: "Privacy Bot", confidence: 100, mission: "MISSION-241" },
  { id: "claim-3", text: "Code coverage increased by 4.2%.", status: "UNVERIFIED", evidenceCount: 2, verifier: "CI/CD Pipeline", confidence: 65, mission: "MISSION-240" },
  { id: "claim-4", text: "Database query optimization reduced latency by 15ms.", status: "SUPPORTED", evidenceCount: 24, verifier: "Performance Monitor", confidence: 94, mission: "MISSION-238" },
]

export function EvidenceClaims({ onOpenWorkspace }: { onOpenWorkspace?: (id: string) => void }) {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  
  const selectedClaim = MOCK_CLAIMS.find(c => c.id === selectedClaimId)

  return (
    <div className="flex h-full w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-black/5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">Claims</h1>
            <p className="text-sm text-black/50 mt-1">What did the system assert and prove?</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
              <input 
                type="text"
                placeholder="Search claims..."
                className="w-64 pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
              />
            </div>
            <Button variant="outline" className="rounded-full px-4 text-sm h-9 border-black/10 text-black/70 hover:bg-black/5 bg-white">
              <Filter className="size-3.5 mr-2" /> Filter
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {MOCK_CLAIMS.map((claim) => (
              <ClaimCard 
                key={claim.id} 
                claim={claim} 
                isSelected={selectedClaimId === claim.id}
                onClick={() => setSelectedClaimId(claim.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Graph Inspector */}
      <AnimatePresence>
        {selectedClaim && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[500px] border-l border-black/10 bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.04)] relative z-20"
          >
            <div className="p-6 border-b border-black/5 bg-white flex justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#c9d7ff] bg-[#eef3ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0f52ff] mb-4">
                  <span className="size-1.5 rounded-full bg-[#0f52ff]" />
                  Claim Visualization
                </div>
                <h3 className="text-xl font-semibold text-black leading-snug pr-4">{selectedClaim.text}</h3>
              </div>
              <button className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors" onClick={() => setSelectedClaimId(null)}>
                <X className="size-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa]">
              <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-6">Evidence Trace</div>
              
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[27px] top-4 bottom-8 w-px bg-gradient-to-b from-[#0f52ff]/40 via-black/10 to-black/10" />
                
                {/* Nodes */}
                <div className="space-y-8">
                  <TraceNode 
                    icon={<Brain className="size-4" />}
                    title="Claim Asserted"
                    subtitle={`by ${selectedClaim.mission}`}
                    active
                  />
                  
                  <TraceNode 
                    icon={<FileText className="size-4" />}
                    title={`${selectedClaim.evidenceCount} Evidence Records`}
                    subtitle="Collected during runtime"
                    active
                    onClick={() => onOpenWorkspace?.(selectedClaim.id)}
                    action="View Records"
                  />
                  
                  <TraceNode 
                    icon={<ShieldCheck className="size-4" />}
                    title="Verification"
                    subtitle={`Checked by ${selectedClaim.verifier}`}
                    active
                    status={selectedClaim.status}
                  />
                  
                  <TraceNode 
                    icon={<CheckCircle2 className="size-4" />}
                    title="Certificate Issued"
                    subtitle="Cryptographic proof generated"
                    active={selectedClaim.status === "SUPPORTED"}
                    faded={selectedClaim.status !== "SUPPORTED"}
                  />
                </div>
              </div>
              
              <div className="mt-12 bg-white rounded-md border border-black/5 p-5 shadow-sm">
                 <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Confidence Score</div>
                 <div className="flex items-end gap-3 mb-2">
                    <span className="text-4xl font-semibold tracking-tight text-black">{selectedClaim.confidence}%</span>
                 </div>
                 <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0f52ff] to-[#0f52ff]" style={{ width: `${selectedClaim.confidence}%` }} />
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ClaimCard({ claim, isSelected, onClick }: { claim: any, isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`group rounded-md border bg-white p-5 cursor-pointer transition-all ${isSelected ? 'border-[#0f52ff] shadow-[0_12px_40px_rgba(15,82,255,0.08)] ring-1 ring-[#0f52ff]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-medium text-black leading-snug flex-1">{claim.text}</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${claim.status === 'SUPPORTED' ? 'bg-[#eef3ff] text-[#0f52ff]' : 'bg-black/5 text-black/60'}`}>
          {claim.status}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-black/60">
          <FileText className="size-4" />
          <span><strong className="text-black">{claim.evidenceCount}</strong> evidence records</span>
        </div>
        <div className="flex items-center gap-2 text-black/60">
          <ShieldCheck className="size-4" />
          <span>Verifier: <strong className="text-black">{claim.verifier}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-black/60">
          <Activity className="size-4" />
          <span>Confidence: <strong className="text-black">{claim.confidence}%</strong></span>
        </div>
        
        <div className={`ml-auto flex items-center text-xs font-semibold ${isSelected ? 'text-[#0f52ff]' : 'text-black/40 group-hover:text-black/70'} transition-colors`}>
          View Trace <ChevronRight className="size-3.5 ml-1" />
        </div>
      </div>
    </div>
  )
}

function TraceNode({ icon, title, subtitle, active, faded, status, action, onClick }: any) {
  return (
    <div className={`flex items-start gap-4 relative z-10 ${faded ? 'opacity-40' : ''}`}>
      <div className={`size-14 rounded-full flex items-center justify-center shrink-0 border-4 border-[#fafafa] shadow-sm ${active ? 'bg-[#0f52ff] text-white' : 'bg-white border-black/10 text-black/40'}`}>
        {icon}
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-black text-[15px]">{title}</h4>
          {status && (
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${status === 'SUPPORTED' ? 'bg-[#eef3ff] text-[#0f52ff]' : 'bg-black/5 text-black/50'}`}>
              {status}
            </span>
          )}
        </div>
        <p className="text-sm text-black/50 mt-1">{subtitle}</p>
        
        {action && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onClick?.(); }} className="mt-3 text-xs h-7 rounded-full px-3">
            {action} <ArrowRight className="size-3 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
