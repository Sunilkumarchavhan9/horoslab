"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ShieldAlert, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck, DollarSign, Building2, UserCircle, History, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_APPROVALS = [
  { id: "app-1", title: "Deploy Production", risk: "HIGH RISK", institution: "Engineering", requires: "CTO Approval", budget: "$12,000", status: "WAITING", mission: "MISSION-241" },
  { id: "app-2", title: "Increase Token Limit", risk: "LOW RISK", institution: "AI Ops", requires: "Manager Approval", budget: "$450", status: "APPROVED", mission: "MISSION-240" },
  { id: "app-3", title: "Add External Dependency", risk: "MEDIUM RISK", institution: "Security", requires: "SecOps Approval", budget: "$0", status: "REJECTED", mission: "MISSION-239" },
]

export function ExecutionApprovals() {
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  
  const selectedApproval = MOCK_APPROVALS.find(a => a.id === selectedApprovalId)

  return (
    <div className="flex h-full w-full bg-[#fafafa]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">Human Approvals</h1>
              <p className="text-sm text-black/50 mt-1">High-stakes gatekeeping and policy enforcement.</p>
            </div>
            <div className="flex gap-2">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
                 <input 
                   type="text"
                   placeholder="Search requests..."
                   className="w-64 pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-full text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
                 />
               </div>
            </div>
          </div>
          
          {/* Top Metrics Stripe Style */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <MetricBox label="Waiting" value="14" highlight />
             <MetricBox label="Approved" value="1,204" />
             <MetricBox label="Rejected" value="23" color="red" />
             <MetricBox label="Expired" value="2" color="yellow" />
             <MetricBox label="Avg Approval Time" value="4h 12m" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {MOCK_APPROVALS.map((approval) => (
              <ApprovalCard 
                key={approval.id} 
                approval={approval} 
                isSelected={selectedApprovalId === approval.id}
                onClick={() => setSelectedApprovalId(approval.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Deep Dive Inspector */}
      <AnimatePresence>
        {selectedApproval && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-[450px] border-l border-black/10 bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.04)] relative z-20"
          >
             <div className="p-6 border-b border-black/5 flex justify-between items-start sticky top-0 bg-white z-10">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${selectedApproval.risk === 'HIGH RISK' ? 'bg-red-50 text-red-600 border-red-100' : selectedApproval.risk === 'MEDIUM RISK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                       {selectedApproval.risk}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedApproval.status === 'WAITING' ? 'bg-black/5 text-black/60' : selectedApproval.status === 'APPROVED' ? 'bg-[#eef3ff] text-[#0f52ff]' : 'bg-red-50 text-red-600'}`}>
                       {selectedApproval.status}
                    </span>
                 </div>
                 <h2 className="text-2xl font-semibold text-black leading-tight">{selectedApproval.title}</h2>
               </div>
               <button className="p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors -mr-2" onClick={() => setSelectedApprovalId(null)}>
                 <XCircle className="size-5" />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto bg-[#fafafa]">
                {/* Actions */}
                {selectedApproval.status === 'WAITING' && (
                   <div className="p-6 bg-white border-b border-black/5 flex gap-3">
                      <Button className="flex-1 bg-[#2da44e] hover:bg-[#2c974b] text-white shadow-sm shadow-[#2da44e]/20 h-10">
                         <CheckCircle2 className="size-4 mr-2" /> Approve Request
                      </Button>
                      <Button variant="outline" className="flex-1 bg-white text-red-600 border-red-200 hover:bg-red-50 h-10">
                         <XCircle className="size-4 mr-2" /> Reject
                      </Button>
                   </div>
                )}
                
                <div className="p-6 space-y-8">
                   
                   <div>
                      <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Context</h4>
                      <div className="bg-white border border-black/5 rounded-md overflow-hidden shadow-sm">
                         <div className="flex items-center justify-between p-3 border-b border-black/5">
                            <span className="text-sm text-black/60 flex items-center gap-2"><Building2 className="size-4"/> Institution</span>
                            <span className="text-sm font-medium text-black">{selectedApproval.institution}</span>
                         </div>
                         <div className="flex items-center justify-between p-3 border-b border-black/5">
                            <span className="text-sm text-black/60 flex items-center gap-2"><UserCircle className="size-4"/> Required</span>
                            <span className="text-sm font-medium text-black">{selectedApproval.requires}</span>
                         </div>
                         <div className="flex items-center justify-between p-3 border-b border-black/5">
                            <span className="text-sm text-black/60 flex items-center gap-2"><DollarSign className="size-4"/> Budget Impact</span>
                            <span className="text-sm font-medium text-black">{selectedApproval.budget}</span>
                         </div>
                         <div className="flex items-center justify-between p-3">
                            <span className="text-sm text-black/60 flex items-center gap-2"><ShieldAlert className="size-4"/> Risk Profile</span>
                            <span className="text-sm font-medium text-black">{selectedApproval.risk}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div>
                      <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Reasoning & Evidence</h4>
                      <div className="bg-white border border-black/5 rounded-md p-4 shadow-sm text-sm text-black leading-relaxed">
                         <p className="mb-4">
                            The automated planner requires production deployment rights to resolve the API migration. This will incur a projected cost of {selectedApproval.budget} in compute resources.
                         </p>
                         <div className="border border-black/10 rounded-md p-3 hover:border-black/20 transition-colors cursor-pointer flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className="size-8 rounded bg-[#0f52ff]/10 text-[#0f52ff] flex items-center justify-center">
                                  <FileText className="size-4" />
                               </div>
                               <div>
                                  <div className="font-semibold text-black text-sm">View Evidence Trace</div>
                                  <div className="text-xs text-black/50">14 Artifacts Verified</div>
                               </div>
                            </div>
                            <ArrowRight className="size-4 text-black/30" />
                         </div>
                      </div>
                   </div>

                   <div>
                      <h4 className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mb-3">Authority Chain History</h4>
                      <div className="relative pl-6 space-y-6 before:absolute before:inset-y-1 before:left-2 before:w-px before:bg-black/10">
                         <div className="relative">
                            <div className="absolute -left-[29px] top-1 size-4 rounded-full bg-[#2da44e] border-2 border-white flex items-center justify-center">
                               <CheckCircle2 className="size-2.5 text-white" />
                            </div>
                            <div className="text-sm font-semibold text-black">Security Review Passed</div>
                            <div className="text-xs text-black/50">SecOps Bot • 2 hours ago</div>
                         </div>
                         <div className="relative">
                            <div className="absolute -left-[29px] top-1 size-4 rounded-full bg-[#2da44e] border-2 border-white flex items-center justify-center">
                               <CheckCircle2 className="size-2.5 text-white" />
                            </div>
                            <div className="text-sm font-semibold text-black">Budget Pre-approved</div>
                            <div className="text-xs text-black/50">Finance Policy • 1 hour ago</div>
                         </div>
                         <div className="relative">
                            <div className="absolute -left-[29px] top-1 size-4 rounded-full bg-white border-2 border-[#0f52ff] flex items-center justify-center">
                               <div className="size-1.5 rounded-full bg-[#0f52ff]" />
                            </div>
                            <div className="text-sm font-semibold text-[#0f52ff]">Waiting for CTO</div>
                            <div className="text-xs text-[#0f52ff]/60">Currently pending</div>
                         </div>
                      </div>
                   </div>
                   
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetricBox({ label, value, color, highlight }: any) {
  return (
    <div className={`bg-white rounded-md p-4 border ${highlight ? 'border-[#0f52ff]/40 shadow-[0_4px_20px_rgba(15,82,255,0.06)]' : 'border-black/5 shadow-sm'}`}>
      <div className="text-[11px] font-semibold text-black/50 mb-1">{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${color === 'red' ? 'text-red-600' : color === 'yellow' ? 'text-yellow-600' : highlight ? 'text-[#0f52ff]' : 'text-black'}`}>
         {value}
      </div>
    </div>
  )
}

function ApprovalCard({ approval, isSelected, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`group rounded-md border bg-white p-5 cursor-pointer transition-all ${isSelected ? 'border-[#0f52ff] shadow-[0_8px_30px_rgba(15,82,255,0.08)] ring-1 ring-[#0f52ff]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
           <div className={`size-10 rounded-full flex items-center justify-center shrink-0 border-2 ${approval.status === 'APPROVED' ? 'bg-[#e6ffec] border-[#2da44e] text-[#2da44e]' : approval.status === 'REJECTED' ? 'bg-[#ffebe9] border-[#cf222e] text-[#cf222e]' : 'bg-[#f6f8fa] border-[#d0d7de] text-black/40'}`}>
              {approval.status === 'APPROVED' ? <CheckCircle2 className="size-5" /> : approval.status === 'REJECTED' ? <XCircle className="size-5" /> : <ShieldCheck className="size-5" />}
           </div>
           <div>
              <h3 className="text-lg font-semibold text-black leading-snug">{approval.title}</h3>
              <div className="text-xs text-black/50">Mission: {approval.mission}</div>
           </div>
        </div>
        
        <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${approval.risk === 'HIGH RISK' ? 'bg-red-50 text-red-600 border-red-100' : approval.risk === 'MEDIUM RISK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
           {approval.risk}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-6 text-sm pt-4 border-t border-black/5">
        <div className="flex items-center gap-2 text-black/60">
          <Building2 className="size-4" />
          <span>Institution: <strong className="text-black">{approval.institution}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-black/60">
          <UserCircle className="size-4" />
          <span>Requires: <strong className="text-black">{approval.requires}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-black/60">
          <DollarSign className="size-4" />
          <span>Budget: <strong className="text-black">{approval.budget}</strong></span>
        </div>
        
        {approval.status === 'WAITING' && (
           <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="outline" size="sm" className="h-7 text-xs border-black/10 text-black hover:bg-black/5">Review</Button>
           </div>
        )}
      </div>
    </div>
  )
}
