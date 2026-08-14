import React from "react";
import { Link, Hash, FileSignature, Clock, Database, ShieldCheck, Building, DatabaseZap, Network } from "lucide-react";

export function SettlementAuditView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full">
        
        <div className="flex flex-col">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Immutable Ledger</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            The permanent, cryptographically verifiable record of this settlement. Allows exact reconstruction of the mission at any point in the future.
          </p>
        </div>

        {/* Chain Verification */}
        <div className="flex flex-col bg-card border border-border rounded-sm shadow-sm p-8">
           <div className="flex items-center gap-3 mb-6">
              <Network className="size-5 text-foreground" />
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-foreground">Provenance Chain</h2>
           </div>

           <div className="flex items-center justify-between px-4 py-6 bg-muted/20 border border-border rounded-sm relative">
              <div className="absolute top-1/2 left-8 right-8 h-px bg-border -translate-y-1/2 z-0 hidden md:block" />
              
              {["Mission", "Execution", "Evidence", "Claims", "Verification", "Settlement", "Ledger"].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 z-10 bg-muted/20 px-2">
                   <div className="size-3 rounded-full bg-foreground border-[3px] border-card box-content" />
                   <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{step}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Ledger Details */}
        <div className="flex flex-col gap-4">
           <h2 className="text-[14px] font-bold uppercase tracking-wider text-muted-foreground">Settlement Record Metadata</h2>
           <div className="flex flex-col bg-card border border-border rounded-sm shadow-sm divide-y divide-border/50">
              
              <div className="grid grid-cols-3 p-5">
                 <div className="col-span-1 flex items-center gap-2 text-muted-foreground">
                    <Hash className="size-4" />
                    <span className="text-[13px] font-medium">Record Hash</span>
                 </div>
                 <div className="col-span-2">
                    <span className="text-[13px] font-mono font-bold text-foreground bg-muted/50 px-2 py-1 rounded-sm w-full block break-all">
                       0x9e12b7a4c901f44d712e0987a32c65f90e1ab4c883492e71d332aa6622b100f5
                    </span>
                 </div>
              </div>

              <div className="grid grid-cols-3 p-5">
                 <div className="col-span-1 flex items-center gap-2 text-muted-foreground">
                    <FileSignature className="size-4" />
                    <span className="text-[13px] font-medium">Signature</span>
                 </div>
                 <div className="col-span-2">
                    <span className="text-[13px] font-mono text-foreground break-all">
                       SIG_K1_Kbx...42A1
                    </span>
                 </div>
              </div>

              <div className="grid grid-cols-3 p-5">
                 <div className="col-span-1 flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4" />
                    <span className="text-[13px] font-medium">Timestamp</span>
                 </div>
                 <div className="col-span-2">
                    <span className="text-[13px] font-mono text-foreground">
                       2026-07-26T14:42:11.902Z (UTC)
                    </span>
                 </div>
              </div>

              <div className="grid grid-cols-3 p-5">
                 <div className="col-span-1 flex items-center gap-2 text-muted-foreground">
                    <Database className="size-4" />
                    <span className="text-[13px] font-medium">Evidence Package</span>
                 </div>
                 <div className="col-span-2 flex items-center gap-3">
                    <span className="text-[13px] font-mono text-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm">
                       pkg-evd-4091a
                    </span>
                    <span className="text-[12px] text-muted-foreground">18 Artifacts Included</span>
                 </div>
              </div>

              <div className="grid grid-cols-3 p-5">
                 <div className="col-span-1 flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="size-4" />
                    <span className="text-[13px] font-medium">Verifier Identity</span>
                 </div>
                 <div className="col-span-2">
                    <span className="text-[13px] font-mono text-foreground">
                       sys-policy-engine-v4.1.2
                    </span>
                 </div>
              </div>

              <div className="grid grid-cols-3 p-5">
                 <div className="col-span-1 flex items-center gap-2 text-muted-foreground">
                    <Building className="size-4" />
                    <span className="text-[13px] font-medium">Institution Context</span>
                 </div>
                 <div className="col-span-2">
                    <span className="text-[13px] font-medium text-foreground">
                       MemoryOS Core (ID: org-memoryos-main)
                    </span>
                 </div>
              </div>

              <div className="grid grid-cols-3 p-5">
                 <div className="col-span-1 flex items-center gap-2 text-muted-foreground">
                    <Link className="size-4" />
                    <span className="text-[13px] font-medium">Previous Chain Link</span>
                 </div>
                 <div className="col-span-2">
                    <span className="text-[13px] font-mono text-foreground break-all text-muted-foreground">
                       0x7d90a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0
                    </span>
                 </div>
              </div>

           </div>
        </div>
        
      </div>
    </div>
  );
}
