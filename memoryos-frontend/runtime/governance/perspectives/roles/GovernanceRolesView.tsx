import React from "react";
import { Briefcase, Zap, Scale, Banknote, PenTool, Users, Shield, BookOpen } from "lucide-react";

export function GovernanceRolesView() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full">
        
        <div className="flex flex-col border-b border-border pb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Institutional Roles</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Roles are not just access groups; they are pre-configured bundles of operational capability, authority, and constraints.
          </p>
        </div>

        {/* Role Bundle Context */}
        <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-6 gap-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Briefcase className="size-5 text-muted-foreground" />
                 <div className="flex flex-col">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Active Role Bundle</span>
                    <span className="text-[18px] font-bold text-foreground">Platform Engineer (L3)</span>
                 </div>
              </div>
              <span className="text-[11px] font-mono uppercase bg-muted/50 border border-border px-2 py-1 rounded-sm text-foreground">id: role-plat-eng-l3</span>
           </div>

           <div className="flex flex-col gap-2">
              <p className="text-[13px] text-foreground leading-relaxed text-muted-foreground">
                 This role grants the authority to provision, modify, and teardown infrastructure across non-production environments, and includes dual-approval authorities for production secret management.
              </p>
           </div>
        </div>

        {/* Bundle Components */}
        <div className="flex flex-col gap-4">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Role Configuration Bundle</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-5 gap-4">
                 <div className="flex items-center gap-2">
                    <Zap className="size-4 text-foreground" />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">Core Capabilities</span>
                 </div>
                 <ul className="flex flex-col gap-2 text-[13px] font-mono text-muted-foreground border-t border-border/50 pt-4">
                    <li>infra.provision.*</li>
                    <li>infra.modify.nonprod</li>
                    <li>secrets.read.all</li>
                 </ul>
              </div>

              <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-5 gap-4">
                 <div className="flex items-center gap-2">
                    <Scale className="size-4 text-foreground" />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">Delegated Authority</span>
                 </div>
                 <ul className="flex flex-col gap-2 text-[13px] font-mono text-muted-foreground border-t border-border/50 pt-4">
                    <li>auth.destructive.approve</li>
                    <li>auth.deploy.prod (Conditional)</li>
                 </ul>
              </div>

              <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-5 gap-4">
                 <div className="flex items-center gap-2">
                    <Banknote className="size-4 text-foreground" />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">Attached Budgets</span>
                 </div>
                 <div className="flex flex-col gap-2 border-t border-border/50 pt-4 text-[13px]">
                    <div className="flex items-center justify-between">
                       <span className="text-muted-foreground">Compute</span>
                       <span className="font-mono text-foreground">$5,000 / mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-muted-foreground">Risk Appetite</span>
                       <span className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded-sm">Moderate</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm p-5 gap-4">
                 <div className="flex items-center gap-2">
                    <PenTool className="size-4 text-foreground" />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">Approval Limits</span>
                 </div>
                 <div className="flex flex-col gap-2 border-t border-border/50 pt-4 text-[13px]">
                    <div className="flex items-center justify-between">
                       <span className="text-muted-foreground">Purchase Approvals</span>
                       <span className="font-mono text-foreground">Up to $500</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-muted-foreground">Access Approvals</span>
                       <span className="font-mono text-foreground">L1 & L2 Only</span>
                    </div>
                 </div>
              </div>

           </div>
        </div>

        <div className="flex flex-col gap-4 mt-2">
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm divide-y divide-border/50">
              
              <div className="flex flex-col md:flex-row items-start md:items-center p-5 justify-between gap-4 md:gap-0">
                 <div className="flex items-center gap-3">
                    <Users className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Workers</span>
                       <span className="text-[13px] font-medium text-foreground">12 Active Engineers, 4 Autonomous Agents</span>
                    </div>
                 </div>
                 <span className="text-[12px] font-mono text-muted-foreground border border-border px-2 py-1 bg-muted/30 rounded-sm hover:bg-muted/50 cursor-pointer transition-colors">
                    View Registry
                 </span>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center p-5 justify-between gap-4 md:gap-0">
                 <div className="flex items-center gap-3">
                    <Shield className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bound Policies</span>
                       <span className="text-[13px] font-medium text-foreground">pol-sec-99, pol-iam-01, pol-infra-04</span>
                    </div>
                 </div>
                 <span className="text-[12px] font-mono text-muted-foreground border border-border px-2 py-1 bg-muted/30 rounded-sm hover:bg-muted/50 cursor-pointer transition-colors">
                    Audit Policies
                 </span>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center p-5 justify-between gap-4 md:gap-0 bg-muted/20">
                 <div className="flex items-center gap-3">
                    <BookOpen className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Required Playbooks</span>
                       <span className="text-[13px] font-medium text-foreground">plb-sec-01 (Incident Response), plb-eng-02 (Deploy)</span>
                    </div>
                 </div>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}
