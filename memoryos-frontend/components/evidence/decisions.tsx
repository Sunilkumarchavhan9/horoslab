"use client"

import { useState } from "react"
import { Search, Filter, GitCommit, FileText, CheckCircle2, ShieldCheck, HelpCircle, ArrowRight, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_DECISIONS = [
  { id: "dec-1", title: "Deploy SDK v4", reason: "Security Fix required in auth module.", evidenceCount: 12, approver: "Engineering", result: "PASS", mission: "MISSION-241", date: "Today, 14:32" },
  { id: "dec-2", title: "Bypass Rate Limiting", reason: "Critical system backup required extended API limits.", evidenceCount: 3, approver: "Platform Team", result: "PASS", mission: "MISSION-240", date: "Yesterday, 09:15" },
  { id: "dec-3", title: "Revert PR #402", reason: "Integration test failures in staging.", evidenceCount: 8, approver: "CI/CD Pipeline", result: "FAIL", mission: "MISSION-239", date: "Oct 24, 11:20" },
  { id: "dec-4", title: "Update Database Schema", reason: "Adding support for custom claims metadata.", evidenceCount: 15, approver: "Architecture Board", result: "PASS", mission: "MISSION-238", date: "Oct 22, 16:45" },
]

export function EvidenceDecisions({ onOpenWorkspace }: { onOpenWorkspace?: (id: string) => void }) {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  
  const selectedDecision = MOCK_DECISIONS.find(d => d.id === selectedDecisionId)

  return (
    <div className="flex h-full w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">Decisions</h1>
            <p className="text-sm text-black/50 mt-1">Architecture Decision Records & Execution rationale.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
              <input 
                type="text"
                placeholder="Search decisions..."
                className="w-64 pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
              />
            </div>
            <Button variant="outline" className="rounded-full px-4 text-sm h-9 border-black/10 text-black/70 hover:bg-black/5">
              <Filter className="size-3.5 mr-2" /> Filter
            </Button>
          </div>
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="relative pl-8 space-y-10 before:absolute before:inset-y-2 before:left-[15px] before:w-px before:bg-gradient-to-b before:from-black/10 before:via-black/10 before:to-transparent">
              {MOCK_DECISIONS.map((decision) => (
                <div key={decision.id} className="relative">
                  <div className="absolute -left-12 top-1.5 size-6 rounded-full bg-white border-2 border-black/10 flex items-center justify-center">
                    <div className="size-2 rounded-full bg-black/20" />
                  </div>
                  
                  <div className="text-sm font-semibold text-black/40 mb-3">{decision.date}</div>
                  
                  <DecisionCard 
                    decision={decision} 
                    isSelected={selectedDecisionId === decision.id}
                    onClick={() => setSelectedDecisionId(decision.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inspector */}
      {selectedDecision && (
        <div className="w-[450px] border-l border-black/10 bg-[#fafafa] flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.02)] relative z-10 hidden xl:flex">
          <div className="p-6 border-b border-black/5 bg-white flex justify-between items-start sticky top-0 z-10">
            <div>
              <div className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-2">Decision Record</div>
              <h3 className="text-xl font-semibold text-black leading-snug">{selectedDecision.title}</h3>
            </div>
            <button className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors" onClick={() => setSelectedDecisionId(null)}>
              <X className="size-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div>
              <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Reason</h4>
              <p className="text-sm text-black leading-relaxed">{selectedDecision.reason}</p>
            </div>
            
            <div>
              <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Alternatives Considered</h4>
              <ul className="text-sm text-black/60 list-disc pl-4 space-y-2">
                <li>Delay patch to next sprint (Rejected due to high severity CVSS score).</li>
                <li>Rollback entire module (Rejected due to user impact).</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Evidence relied upon</h4>
              <div className="bg-white border border-black/10 rounded-md p-4 flex items-center justify-between hover:border-black/20 cursor-pointer transition-colors" onClick={() => onOpenWorkspace?.(selectedDecision.id)}>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-md bg-[#0f52ff]/5 flex items-center justify-center text-[#0f52ff]">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-black">{selectedDecision.evidenceCount} Evidences</div>
                    <div className="text-xs text-black/50">View all connected artifacts and logs</div>
                  </div>
                </div>
                <ChevronRight className="size-5 text-black/30" />
              </div>
            </div>
            
            <div>
              <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Approval</h4>
              <div className="flex items-center gap-3 bg-white border border-black/10 rounded-md p-4">
                <div className="size-8 rounded-full bg-black/5 flex items-center justify-center">
                  <ShieldCheck className="size-4 text-black/60" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-black">{selectedDecision.approver}</div>
                  <div className="text-xs text-black/50">Policy matched: Auto-approve routine</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Outcome</h4>
              <div className={`flex items-center gap-3 border rounded-md p-4 ${selectedDecision.result === 'PASS' ? 'bg-[#eef3ff] border-[#0f52ff]/20' : 'bg-red-50 border-red-200'}`}>
                {selectedDecision.result === 'PASS' ? <CheckCircle2 className="size-5 text-[#0f52ff]" /> : <X className="size-5 text-red-500" />}
                <div>
                  <div className={`text-sm font-semibold ${selectedDecision.result === 'PASS' ? 'text-[#0f52ff]' : 'text-red-600'}`}>
                    Execution {selectedDecision.result}
                  </div>
                  <div className={`text-xs ${selectedDecision.result === 'PASS' ? 'text-[#0f52ff]/70' : 'text-red-600/70'}`}>
                    Changes successfully applied to runtime.
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Learning</h4>
              <p className="text-sm text-black/60 leading-relaxed italic">
                "Automated patching of auth components should include secondary validation from staging logs before main promotion."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DecisionCard({ decision, isSelected, onClick }: { decision: any, isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`group rounded-md border bg-white p-5 cursor-pointer transition-all ${isSelected ? 'border-[#0f52ff] shadow-[0_12px_40px_rgba(15,82,255,0.08)] ring-1 ring-[#0f52ff]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-black mb-1">{decision.title}</h3>
          <p className="text-sm text-black/60">{decision.reason}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest shrink-0 border ${decision.result === 'PASS' ? 'bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9]' : 'bg-[#ffebee] text-[#c62828] border-[#ffcdd2]'}`}>
          {decision.result}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm mt-5 pt-4 border-t border-black/5">
        <div className="flex items-center gap-2 text-black/60">
          <FileText className="size-4" />
          <span><strong className="text-black">{decision.evidenceCount}</strong> evidence records</span>
        </div>
        <div className="flex items-center gap-2 text-black/60">
          <ShieldCheck className="size-4" />
          <span>Approved By: <strong className="text-black">{decision.approver}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-black/60">
          <GitCommit className="size-4" />
          <span>Mission: <strong className="text-black">{decision.mission}</strong></span>
        </div>
      </div>
    </div>
  )
}
