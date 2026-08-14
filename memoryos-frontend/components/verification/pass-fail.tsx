"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Target, Activity, FileText, FileCheck, Search, CheckCircle2, XCircle, Fingerprint, Database, AlertTriangle, ArrowRight, ShieldAlert, Cpu, X } from "lucide-react"

const MOCK_MISSIONS = [
  { id: "m-241", title: "Deploy API", type: "Software", status: "PASS", confidence: "99.4%", evidence: 42, verifier: "Security AI", certificate: "Ready" },
  { id: "m-242", title: "Warehouse Thermal Scan", type: "Physical", status: "PASS", confidence: "98.1%", evidence: 15, verifier: "Physical Env Engine", certificate: "Ready" },
  { id: "m-240", title: "Database Migration", type: "Software", status: "FAIL", confidence: "12.0%", evidence: 4, verifier: "Policy Engine", certificate: "None" },
  { id: "m-243", title: "SOC2 Compliance Audit", type: "Compliance", status: "FAIL", confidence: "45.0%", evidence: 89, verifier: "Compliance Engine", certificate: "None" },
  { id: "m-239", title: "Review Module", type: "Software", status: "UNKNOWN", confidence: "45.2%", evidence: 12, verifier: "Human Review", certificate: "Pending" },
]

export function VerificationPassFail() {
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)
  
  const selectedMission = MOCK_MISSIONS.find(m => m.id === selectedMissionId)

  return (
    <div className="flex h-full w-full bg-[#fafafa]">
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${selectedMission ? 'lg:w-[500px] lg:flex-none border-r border-black/10' : 'w-full'}`}>
        
        {/* Massive Counters Section */}
        <div className="p-8 border-b border-black/5 bg-white">
           <h1 className="text-3xl font-bold tracking-tight text-black flex items-center gap-3 mb-8">
              Mission Quality Center
           </h1>
           
           <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="col-span-2 bg-[#2da44e] rounded-md p-6 text-white shadow-[0_12px_40px_rgba(45,164,78,0.2)] flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-20"><CheckCircle2 className="size-24" /></div>
                 <div className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-90">Total Passed</div>
                 <div className="text-6xl font-bold tracking-tighter">1,204</div>
              </div>
              
              <div className="bg-[#cf222e] rounded-md p-6 text-white shadow-sm flex flex-col justify-between">
                 <div className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-90">Failed</div>
                 <div className="text-4xl font-bold tracking-tighter">23</div>
              </div>
              
              <div className="bg-[#6e7781] rounded-md p-6 text-white shadow-sm flex flex-col justify-between">
                 <div className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-90">Unknown</div>
                 <div className="text-4xl font-bold tracking-tighter">14</div>
              </div>
              
              <div className="bg-[#0f52ff] rounded-md p-6 text-white shadow-sm flex flex-col justify-between">
                 <div className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-90">Running</div>
                 <div className="text-4xl font-bold tracking-tighter animate-pulse">2</div>
              </div>
           </div>
           
           {/* Visual Ratio Bar */}
           <div className="flex h-3 rounded-full overflow-hidden mt-6 bg-black/5">
              <div className="bg-[#2da44e]" style={{ width: '85%' }} />
              <div className="bg-[#0f52ff] animate-pulse" style={{ width: '5%' }} />
              <div className="bg-[#cf222e]" style={{ width: '8%' }} />
              <div className="bg-[#6e7781]" style={{ width: '2%' }} />
           </div>
        </div>

        {/* Mission Cards Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#fafafa]">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MOCK_MISSIONS.map(mission => (
                 <div 
                    key={mission.id}
                    onClick={() => setSelectedMissionId(mission.id)}
                    className={`group cursor-pointer rounded-md border bg-white overflow-hidden transition-all flex flex-col relative ${selectedMissionId === mission.id ? 'border-[#0f52ff] ring-2 ring-[#0f52ff]/20 shadow-lg scale-[1.02] z-10' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md hover:-translate-y-1'}`}
                 >
                    {/* Top Status Bar */}
                    <div className={`h-1.5 w-full ${mission.status === 'PASS' ? 'bg-[#2da44e]' : mission.status === 'FAIL' ? 'bg-[#cf222e]' : 'bg-[#6e7781]'}`} />
                    
                    <div className="p-6">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <div className="text-xs text-black/40 font-mono mb-1">{mission.id} &bull; <span className="font-semibold text-black/60">{mission.type} Verification</span></div>
                             <h3 className="text-xl font-bold text-black">{mission.title}</h3>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${mission.status === 'PASS' ? 'bg-[#e6ffec] text-[#2da44e]' : mission.status === 'FAIL' ? 'bg-[#ffebe9] text-[#cf222e]' : 'bg-black/5 text-black/60'}`}>
                             {mission.status === 'PASS' ? <CheckCircle2 className="size-3.5" /> : mission.status === 'FAIL' ? <XCircle className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                             {mission.status}
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-md bg-[#fafafa] border border-black/5">
                             <div className="text-xs font-semibold text-black/50 uppercase tracking-wider">Confidence</div>
                             <div className={`text-xl font-bold font-mono ${mission.status === 'PASS' ? 'text-[#2da44e]' : mission.status === 'FAIL' ? 'text-[#cf222e]' : 'text-black'}`}>
                                {mission.confidence}
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                             <div className="p-2 border border-black/5 rounded-md">
                                <div className="text-black/40 mb-1">Evidence</div>
                                <div className="font-semibold text-black">{mission.evidence}</div>
                             </div>
                             <div className="p-2 border border-black/5 rounded-md">
                                <div className="text-black/40 mb-1">Verifier</div>
                                <div className="font-semibold text-black truncate" title={mission.verifier}>{mission.verifier}</div>
                             </div>
                             <div className="p-2 border border-black/5 rounded-md">
                                <div className="text-black/40 mb-1">Certificate</div>
                                <div className={`font-semibold ${mission.certificate === 'Ready' ? 'text-[#0f52ff]' : 'text-black'}`}>{mission.certificate}</div>
                             </div>
                          </div>
                          
                          {/* Mini Reason Trail */}
                          {mission.status === 'FAIL' && (
                             <div className="mt-4 pt-4 border-t border-black/5">
                                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1"><ShieldAlert className="size-3"/> Failure Trace</div>
                                <div className="text-xs text-black/70 flex flex-col gap-1.5">
                                   <div className="flex items-center gap-2"><ArrowRight className="size-3 text-black/30"/> Evidence Missing</div>
                                   <div className="flex items-center gap-2"><ArrowRight className="size-3 text-black/30"/> Human Approval Missing</div>
                                   <div className="flex items-center gap-2 font-medium text-red-600"><ArrowRight className="size-3 text-red-400"/> Policy Violation (P-104)</div>
                                </div>
                             </div>
                          )}
                          {mission.status === 'UNKNOWN' && (
                             <div className="mt-4 pt-4 border-t border-black/5">
                                <div className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="size-3"/> Unknown Trace</div>
                                <div className="text-xs text-black/70 flex flex-col gap-1.5">
                                   <div className="flex items-center gap-2"><ArrowRight className="size-3 text-black/30"/> Human Review</div>
                                   <div className="flex items-center gap-2 font-medium"><ArrowRight className="size-3 text-black/30"/> Need More Evidence</div>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Deep Dive Inspector (The Chain of Trust) */}
      <AnimatePresence>
        {selectedMission && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex-1 bg-[#1e1e1e] flex flex-col relative z-20 text-white overflow-hidden shadow-2xl"
          >
             {/* Inspector Header */}
             <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/20">
               <div>
                  <div className="text-[#0f52ff] font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Fingerprint className="size-4" /> Chain of Trust Analysis
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">{selectedMission.title}</h2>
               </div>
               <button className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors" onClick={() => setSelectedMissionId(null)}>
                 <X className="size-6" />
               </button>
             </div>
             
             {/* The Trust Graph */}
             <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center custom-scrollbar relative">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                   
                   {/* Node 1: Mission */}
                   <TrustNode icon={<Target/>} title="Mission Executed" detail={selectedMission.title} status="COMPLETED" delay={0.1} />
                   <TrustEdge delay={0.3} status={selectedMission.status} />
                   
                   {/* Node 2: Evidence */}
                   <TrustNode icon={<Database/>} title="Evidence Gathered" detail={`${selectedMission.evidence} Immutable Artifacts`} status={selectedMission.status === 'UNKNOWN' ? 'WARNING' : 'COMPLETED'} delay={0.5} />
                   <TrustEdge delay={0.7} status={selectedMission.status} />
                   
                   {/* Node 3: Claims */}
                   <TrustNode icon={<FileCheck/>} title="Claims Extracted" detail="12 Assertions" status="COMPLETED" delay={0.9} />
                   <TrustEdge delay={1.1} status={selectedMission.status} />
                   
                   {/* Node 4: Verifier */}
                   <TrustNode icon={<Cpu/>} title="Independent Verifier" detail={selectedMission.verifier} status="COMPLETED" delay={1.3} />
                   <TrustEdge delay={1.5} status={selectedMission.status} />
                   
                   {/* Node 5: Verdict */}
                   <TrustNode 
                      icon={selectedMission.status === 'PASS' ? <CheckCircle2/> : selectedMission.status === 'FAIL' ? <XCircle/> : <AlertTriangle/>} 
                      title="Verdict Reached" 
                      detail={`Confidence: ${selectedMission.confidence}`} 
                      status={selectedMission.status} 
                      delay={1.7} 
                      giant
                   />
                   
                   {/* Node 6: Certificate (If PASS) */}
                   {selectedMission.status === 'PASS' && (
                      <>
                         <TrustEdge delay={1.9} status="PASS" />
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.8 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: 2.1, type: "spring" }}
                           className="mt-4 bg-gradient-to-br from-[#0f52ff] to-[#0a38b5] p-6 rounded-md border border-white/20 shadow-[0_0_50px_rgba(15,82,255,0.3)] w-full text-center relative overflow-hidden"
                         >
                            <div className="absolute -right-6 -top-6 opacity-10"><Fingerprint className="size-32" /></div>
                            <ShieldCheck className="size-10 text-white mx-auto mb-3" />
                            <h4 className="text-white font-bold text-lg mb-1">Cryptographic Certificate</h4>
                            <div className="text-white/70 text-sm mb-4">Issued and signed by Epoch Network</div>
                            <button className="bg-white text-[#0f52ff] px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-white/90 transition-colors">
                               View Certificate
                            </button>
                         </motion.div>
                      </>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TrustNode({ icon, title, detail, status, delay, giant }: any) {
   
   let bg = 'bg-[#2a2a2a] border-white/10'
   let text = 'text-white'
   let iconColor = 'text-white/50'
   
   if (status === 'PASS' || status === 'COMPLETED') {
      iconColor = 'text-[#2da44e]'
   } else if (status === 'FAIL') {
      bg = 'bg-[#cf222e]/10 border-[#cf222e]/30'
      iconColor = 'text-[#cf222e]'
   } else if (status === 'WARNING' || status === 'UNKNOWN') {
      bg = 'bg-yellow-500/10 border-yellow-500/30'
      iconColor = 'text-yellow-500'
   }

   if (giant) {
      bg = status === 'PASS' ? 'bg-[#2da44e] border-[#2da44e]' : status === 'FAIL' ? 'bg-[#cf222e] border-[#cf222e]' : 'bg-[#6e7781] border-[#6e7781]'
      iconColor = 'text-white'
   }

   return (
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay, duration: 0.5 }}
         className={`w-full p-4 rounded-md border flex items-center gap-4 relative z-10 shadow-lg ${bg} ${giant ? 'p-6 scale-105' : ''}`}
      >
         <div className={`size-12 rounded-full flex items-center justify-center shrink-0 bg-black/20 ${iconColor} ${giant ? 'size-16' : ''}`}>
            {icon}
         </div>
         <div>
            <div className={`font-bold ${giant ? 'text-2xl text-white' : 'text-lg text-white'}`}>{title}</div>
            <div className={`text-sm ${giant ? 'text-white/80' : 'text-white/50'}`}>{detail}</div>
         </div>
      </motion.div>
   )
}

function TrustEdge({ delay, status }: { delay: number, status: string }) {
   let color = 'bg-white/20'
   if (status === 'FAIL') color = 'bg-[#cf222e]/40'
   if (status === 'UNKNOWN') color = 'bg-yellow-500/40'

   return (
      <motion.div 
         initial={{ height: 0, opacity: 0 }}
         animate={{ height: 32, opacity: 1 }}
         transition={{ delay, duration: 0.4 }}
         className={`w-0.5 my-0 relative flex justify-center ${color}`}
      >
         {(status === 'PASS' || status === 'COMPLETED') && (
            <motion.div 
               initial={{ y: -10, opacity: 0 }}
               animate={{ y: 32, opacity: 1 }}
               transition={{ delay: delay + 0.2, duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
               className="absolute top-0 size-2 rounded-full bg-[#2da44e] shadow-[0_0_10px_#2da44e]"
            />
         )}
      </motion.div>
   )
}
