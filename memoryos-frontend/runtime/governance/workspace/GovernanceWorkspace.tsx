"use client";

import React, { useEffect } from "react";
import { useGovernanceStore } from "../store";
import { 
  Building, 
  Scale, 
  ShieldAlert, 
  FileSignature, 
  Users, 
  Banknote,
  Database,
  History,
  Lock,
  BadgeCheck,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

// Perspectives
import { GovernanceAuthorityView } from "../perspectives/authority/GovernanceAuthorityView";
import { GovernancePoliciesView } from "../perspectives/policies/GovernancePoliciesView";
import { GovernanceRolesView } from "../perspectives/roles/GovernanceRolesView";
import { GovernanceBudgetsView } from "../perspectives/budgets/GovernanceBudgetsView";
import { GovernanceLedgerView } from "../perspectives/ledger/GovernanceLedgerView";
import { GovernanceApprovalsView } from "../perspectives/approvals/GovernanceApprovalsView";
import { GovernanceRecoveryView } from "../perspectives/recovery/GovernanceRecoveryView";
import { LiveGovernanceView } from "./LiveGovernanceView";

export function GovernanceWorkspace({ activeSection, workspaceId }: { activeSection: string; workspaceId: string }) {
  const { currentView, setCurrentView, selectedContextId } = useGovernanceStore();

  useEffect(() => {
    if (activeSection.startsWith("governance-")) {
      const viewName = activeSection.replace("governance-", "") as any;
      if (viewName === 'audit') setCurrentView('ledger'); // handle legacy mapping
      else setCurrentView(viewName);
    } else if (activeSection === 'authority') {
      setCurrentView('authority');
    }
  }, [activeSection, setCurrentView]);

  return (
    <div className="flex flex-col w-full h-full bg-background font-sans overflow-hidden border border-border rounded-sm shadow-sm">


      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]">
          {currentView === 'authority' && <GovernanceAuthorityView />}
          {currentView === 'policies' && <LiveGovernanceView workspaceId={workspaceId} view="policies" />}
          {currentView === 'roles' && <GovernanceRolesView />}
          {currentView === 'budgets' && <LiveGovernanceView workspaceId={workspaceId} view="budgets" />}
          {currentView === 'ledger' && <LiveGovernanceView workspaceId={workspaceId} view="ledger" />}
          {currentView === 'approvals' && <LiveGovernanceView workspaceId={workspaceId} view="approvals" />}
          {currentView === 'recovery' && <LiveGovernanceView workspaceId={workspaceId} view="recovery" />}
        </div>
      </div>
      
    </div>
  );
}
