"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ShieldCheck, Download, Share2, CheckCircle2, Fingerprint, FileText, FileJson, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_CERTIFICATES = [
  { id: "cert-8891", title: "Security Verification", mission: "Deploy SDK", issued: "Today, 11:42 AM", verifier: "Security AI", evidence: 42, status: "VALID" },
  { id: "cert-8890", title: "Data Integrity", mission: "ETL Pipeline", issued: "Yesterday, 4:15 PM", verifier: "Data Validator", evidence: 128, status: "VALID" },
  { id: "cert-8889", title: "Policy Compliance", mission: "Auth Rewrite", issued: "Oct 12, 2026", verifier: "Policy Engine", evidence: 14, status: "REVOKED" },
]

export function VerificationCertificates() {
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null)
  
  const selectedCert = MOCK_CERTIFICATES.find(c => c.id === selectedCertId)

  return (
    <div className="flex h-full w-full bg-[#fafafa]">
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${selectedCert ? 'lg:w-[450px] lg:flex-none border-r border-black/10' : 'w-full'}`}>
        
        {/* Header */}
        <div className="p-8 border-b border-black/5 bg-white">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <h1 className="text-2xl font-bold tracking-tight text-black">Certificates</h1>
                 <p className="text-sm text-black/50 mt-1">Immutable cryptographic proof of mission verification.</p>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" className="h-9 bg-white text-black/70 border-black/10">
                    <Download className="size-4 mr-2" /> Export All
                 </Button>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/40" />
               <input 
                 type="text"
                 placeholder="Search by Mission, ID, or Verifier..."
                 className="w-full pl-9 pr-4 py-2 bg-black/5 border-transparent focus:bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#0f52ff]/20 focus:border-[#0f52ff] transition-all"
               />
             </div>
             <Button variant="outline" className="h-9 px-4 border-black/10 text-black/70 bg-white shadow-sm">
                <Filter className="size-3.5 mr-2" /> Filters
             </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#fafafa] custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MOCK_CERTIFICATES.map(cert => (
                 <div 
                    key={cert.id}
                    onClick={() => setSelectedCertId(cert.id)}
                    className={`group cursor-pointer rounded-md bg-white border overflow-hidden transition-all relative ${selectedCertId === cert.id ? 'border-[#0f52ff] shadow-[0_12px_40px_rgba(15,82,255,0.1)] ring-2 ring-[#0f52ff]/20 z-10 scale-[1.02]' : 'border-black/10 shadow-sm hover:border-black/20 hover:shadow-md hover:-translate-y-1'}`}
                 >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <BadgeCheck className="size-24" />
                    </div>
                    
                    <div className="p-6">
                       <div className="flex items-start justify-between mb-4">
                          <div>
                             <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">{cert.id}</div>
                             <h3 className="text-lg font-bold text-black leading-tight">{cert.title}</h3>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${cert.status === 'VALID' ? 'bg-[#e6ffec] text-[#2da44e]' : 'bg-[#ffebe9] text-[#cf222e]'}`}>
                             {cert.status === 'VALID' ? <CheckCircle2 className="size-3" /> : <ShieldAlert className="size-3" />}
                             {cert.status}
                          </div>
                       </div>
                       
                       <div className="space-y-3 mb-6 relative z-10">
                          <div className="flex justify-between text-sm border-b border-black/5 pb-2">
                             <span className="text-black/50">Mission</span>
                             <span className="font-semibold text-black">{cert.mission}</span>
                          </div>
                          <div className="flex justify-between text-sm border-b border-black/5 pb-2">
                             <span className="text-black/50">Issued</span>
                             <span className="font-medium text-black">{cert.issued}</span>
                          </div>
                          <div className="flex justify-between text-sm border-b border-black/5 pb-2">
                             <span className="text-black/50">Verifier</span>
                             <span className="font-medium text-black">{cert.verifier}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-black/50">Evidence</span>
                             <span className="font-medium text-black">{cert.evidence} Records</span>
                          </div>
                       </div>
                       
                       <div className="text-sm font-semibold text-[#0f52ff] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Open Certificate <ArrowRight className="size-4" />
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Deep Dive Inspector (The High-Fidelity Certificate) */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex-1 bg-[#1e1e1e] border-l border-white/10 flex flex-col relative z-20 overflow-hidden shadow-2xl"
          >
             <div className="flex-1 overflow-y-auto p-12 flex items-center justify-center relative custom-scrollbar">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                {/* The Certificate Object */}
                <motion.div 
                   initial={{ scale: 0.9, y: 20 }}
                   animate={{ scale: 1, y: 0 }}
                   transition={{ type: "spring", bounce: 0.4 }}
                   className="w-full max-w-lg bg-white rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden relative"
                >
                   {/* Cert Header */}
                   <div className="bg-[#0f52ff] p-8 text-[#F0EFE2] relative overflow-hidden">
                      <div className="absolute -right-12 -top-12 opacity-10"><Fingerprint className="size-48" /></div>
                      <div className="relative z-10 flex items-center gap-4 mb-2">
                         <div className="size-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <ShieldCheck className="size-6 text-[#F0EFE2]" />
                         </div>
                         <div>
                            <div className="text-[#F0EFE2]/70 text-xs font-bold uppercase tracking-widest mb-1">HOROS Network</div>
                            <h2 className="text-2xl font-bold tracking-tight">Verification Certificate</h2>
                         </div>
                      </div>
                   </div>
                   
                   {/* Cert Body */}
                   <div className="p-8 pb-12 relative bg-[#fafafa]">
                      
                      {/* Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                         <BadgeCheck className="size-[300px]" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8 relative z-10">
                         <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Mission</div>
                            <div className="text-lg font-bold text-black">{selectedCert.mission}</div>
                         </div>
                         <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Certificate ID</div>
                            <div className="text-sm font-mono text-black font-semibold">{selectedCert.id.toUpperCase()}-E9A4B</div>
                         </div>
                         <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Issued By</div>
                            <div className="text-sm font-bold text-black flex items-center gap-2"><Cpu className="size-4" /> {selectedCert.verifier}</div>
                         </div>
                         <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Issued Date</div>
                            <div className="text-sm font-semibold text-black">{selectedCert.issued}</div>
                         </div>
                         <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Confidence Score</div>
                            <div className="text-xl font-bold text-[#2da44e]">99.4%</div>
                         </div>
                         <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Evidence Analyzed</div>
                            <div className="text-sm font-bold text-black">{selectedCert.evidence} Immutable Records</div>
                         </div>
                      </div>
                      
                      {/* Signatures */}
                      <div className="border-t border-black/10 pt-6 mt-2 relative z-10">
                         <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-3">Cryptographic Signatures</div>
                         <div className="bg-black/5 rounded-md p-3 font-mono text-[10px] text-black/60 break-all">
                            0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b
                            <br/>
                            -----BEGIN HOROS SIGNATURE-----<br/>
                            MIICXAIBAAKBgQC4...<br/>
                            -----END HOROS SIGNATURE-----
                         </div>
                      </div>
                      
                      {/* Seal */}
                      {selectedCert.status === 'VALID' ? (
                         <div className="absolute bottom-6 right-6 size-16 rounded-full border-2 border-[#2da44e] flex items-center justify-center opacity-80 transform rotate-12">
                            <div className="text-center">
                               <div className="text-[8px] font-bold text-[#2da44e] uppercase tracking-widest">HOROS</div>
                               <div className="text-[10px] font-bold text-[#2da44e] uppercase tracking-widest">Valid</div>
                            </div>
                         </div>
                      ) : (
                         <div className="absolute bottom-6 right-6 size-16 rounded-full border-2 border-[#cf222e] flex items-center justify-center opacity-80 transform rotate-12">
                            <div className="text-center">
                               <div className="text-[8px] font-bold text-[#cf222e] uppercase tracking-widest">HOROS</div>
                               <div className="text-[9px] font-bold text-[#cf222e] uppercase tracking-widest">Revoked</div>
                            </div>
                         </div>
                      )}
                   </div>
                </motion.div>
             </div>
             
             {/* Bottom Action Bar */}
             <div className="bg-black p-4 flex justify-center gap-4">
                <Button variant="outline" className="bg-white/10 border-white/20 text-[#F0EFE2] hover:bg-white/20 h-10 px-6">
                   <FileText className="size-4 mr-2" /> Download PDF
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/20 text-[#F0EFE2] hover:bg-white/20 h-10 px-6">
                   <FileJson className="size-4 mr-2" /> Raw JSON
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/20 text-[#F0EFE2] hover:bg-white/20 h-10 px-6">
                   <Share2 className="size-4 mr-2" /> Share API
                </Button>
             </div>
             
             <button className="absolute top-6 right-6 p-2 rounded-full bg-black/40 hover:bg-black/60 text-[#F0EFE2] transition-colors" onClick={() => setSelectedCertId(null)}>
               <X className="size-5" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ArrowRight(props: any) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
}
function Cpu(props: any) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
}
function X(props: any) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}
function ShieldAlert(props: any) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
}
