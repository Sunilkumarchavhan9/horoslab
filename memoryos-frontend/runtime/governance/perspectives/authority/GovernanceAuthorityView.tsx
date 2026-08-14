import React from "react";
import { Building, Users, Bot, Network, Key, ShieldAlert, ArrowDown, Ban, CheckCircle2, Clock, Scale } from "lucide-react";

export function GovernanceAuthorityView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full">
        
        <div className="flex flex-col border-b border-border pb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Institutional Authority Graph</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            The active delegation of power across the institution. Maps exactly who is allowed to act, under what constraints, and through what leases.
          </p>
        </div>

        {/* Delegation Graph */}
        <div className="flex flex-col gap-6">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Authority Delegation Chain</h2>
           
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-8 pb-10">
              
              <div className="flex flex-col items-center">
                 <div className="flex items-center gap-3 px-6 py-3 border border-border bg-muted/20 rounded-sm">
                    <Building className="size-5 text-muted-foreground" />
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Root Authority</span>
                       <span className="text-[14px] font-medium text-foreground">MemoryOS Institution</span>
                    </div>
                 </div>

                 <ArrowDown className="size-5 text-muted-foreground my-4" />

                 <div className="flex items-center gap-3 px-6 py-3 border border-border bg-card shadow-sm rounded-sm">
                    <Users className="size-5 text-muted-foreground" />
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Granted To / Granted By</span>
                       <span className="text-[14px] font-medium text-foreground">Platform Engineering Team</span>
                       <span className="text-[12px] text-muted-foreground mt-0.5">Granted By: Root Institution</span>
                    </div>
                 </div>

                 <ArrowDown className="size-5 text-muted-foreground my-4" />

                 <div className="flex items-center gap-3 px-6 py-3 border border-border bg-card shadow-sm rounded-sm">
                    <Bot className="size-5 text-muted-foreground" />
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Delegated Agent Pool</span>
                       <span className="text-[14px] font-medium text-foreground">Security Agents (L3)</span>
                       <span className="text-[12px] text-muted-foreground mt-0.5">Granted By: Platform Engineering</span>
                    </div>
                 </div>

                 <ArrowDown className="size-5 text-muted-foreground my-4" />

                 <div className="flex items-center gap-3 px-6 py-3 border border-border bg-muted/20 rounded-sm relative w-full max-w-md">
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-foreground rounded-r-sm" />
                    <Key className="size-5 text-foreground" />
                    <div className="flex flex-col w-full">
                       <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Active Lease</span>
                          <span className="text-[10px] font-mono bg-muted/50 border border-border px-1.5 py-0.5 rounded-sm text-muted-foreground">lse-8821a</span>
                       </div>
                       <span className="text-[14px] font-medium text-foreground">Infrastructure Provisioning Lease</span>
                       <span className="text-[12px] text-muted-foreground mt-0.5">Duration: 4 Hours (Expires in 2h 11m)</span>
                    </div>
                 </div>

                 <ArrowDown className="size-5 text-muted-foreground my-4" />

                 <div className="flex items-center gap-3 px-6 py-3 border border-border bg-card shadow-sm rounded-sm w-full max-w-md">
                    <Network className="size-5 text-muted-foreground" />
                    <div className="flex flex-col w-full">
                       <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Mission</span>
                          <span className="text-[10px] font-bold uppercase bg-muted/50 border border-border px-1.5 py-0.5 rounded-sm text-foreground">Executing</span>
                       </div>
                       <span className="text-[14px] font-medium text-foreground">GitHub Token Rotation</span>
                    </div>
                 </div>

              </div>

           </div>
        </div>

        {/* Constraints */}
        <div className="flex flex-col gap-6">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Lease Constraints & Scope</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-3">
                 <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-5 gap-4">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="size-4 text-muted-foreground" />
                       <span className="text-[13px] font-bold uppercase tracking-wider text-foreground">Allowed Actions</span>
                    </div>
                    <ul className="flex flex-col gap-2 text-[13px] font-mono text-muted-foreground">
                       <li>secrets.read</li>
                       <li>secrets.write</li>
                       <li>github.tokens.rotate</li>
                    </ul>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-5 gap-4">
                    <div className="flex items-center gap-2">
                       <Ban className="size-4 text-muted-foreground" />
                       <span className="text-[13px] font-bold uppercase tracking-wider text-foreground">Denied Actions</span>
                    </div>
                    <ul className="flex flex-col gap-2 text-[13px] font-mono text-muted-foreground">
                       <li>iam.users.delete</li>
                       <li>secrets.delete (Permanent)</li>
                       <li>network.routes.modify</li>
                    </ul>
                 </div>
              </div>

           </div>

           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
                
                <div className="flex flex-col p-5 gap-2">
                   <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="size-3.5"/> Requires Approval</span>
                   <span className="text-[13px] font-medium text-foreground mt-1">Cross-Region Secret Sync</span>
                </div>

                <div className="flex flex-col p-5 gap-2">
                   <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Scale className="size-3.5"/> Enforced Policies</span>
                   <span className="text-[13px] font-medium text-foreground mt-1">pol-iam-01, pol-sec-99</span>
                </div>

                <div className="flex flex-col p-5 gap-2">
                   <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Network className="size-3.5"/> Budget Constraints</span>
                   <span className="text-[13px] font-medium text-foreground mt-1">10k Tokens / 4 Workers</span>
                </div>

                <div className="flex flex-col p-5 gap-2">
                   <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5"/> Time Limit</span>
                   <span className="text-[13px] font-medium text-foreground mt-1">Max 4 Hours TTL</span>
                </div>

             </div>
           </div>

        </div>

      </div>
    </div>
  );
}
