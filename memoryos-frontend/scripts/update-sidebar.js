const fs = require('fs');

const path = 'c:/projects/MemoryOS/memoryos-frontend/components/mission-control/mission-control-workspace.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const startIndex = 1080;
const endIndex = 1384; // 1383 is the closing </div> for the sidebar list.

const replacement = `          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('reality_fabric')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors flex-1 text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Blocks className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Reality Fabric
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.reality_fabric ? "" : "-rotate-90")} />
            </button>
            {expandedSections.reality_fabric && renderSectionItems([
              { id: "integrations-connections", title: "Connections", sub: "Systems" },
              { id: "integrations-data-sources", title: "Data Sources", sub: "Evidence" },
              { id: "observe-timeline", title: "Event Timeline", sub: "History" },
              { id: "developer-api-watcher", title: "API Watcher", sub: "Hooks" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('missions')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Rocket className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Missions
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.missions ? "" : "-rotate-90")} />
            </button>
            {expandedSections.missions && renderSectionItems([
              { id: "missions-active", title: "Active", sub: "Running" },
              { id: "missions-history", title: "History", sub: "Past" },
              { id: "missions-workspace", title: "Mission Workspace", sub: "Command" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('institutions')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Building className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Institutions
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.institutions ? "" : "-rotate-90")} />
            </button>
            {expandedSections.institutions && renderSectionItems([
              { id: "institutions-overview", title: "Institution Records", sub: "Registry" },
              { id: "institutions-templates", title: "Templates", sub: "Setup" },
              { id: "institutions-versions", title: "Versions", sub: "History" },
              { id: "institutions-policies", title: "Policies", sub: "Directives" },
              { id: "institutions-genome", title: "Genome", sub: "Traits" },
              { id: "institutions-change-proposals", title: "Change Proposals", sub: "Drafts" },
              { id: "institutions-evolution", title: "Evolution", sub: "Growth" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('agents')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Brain className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Agents
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.agents ? "" : "-rotate-90")} />
            </button>
            {expandedSections.agents && renderSectionItems([
              { id: "agents-registry", title: "Registry", sub: "All Agents" },
              { id: "agents-running", title: "Running Agents", sub: "Active" },
              { id: "agents-capability-leases", title: "Capability Leases", sub: "Grants" },
              { id: "agents-activity", title: "Activity", sub: "Metrics" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('execution')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Play className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Execution
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.execution ? "" : "-rotate-90")} />
            </button>
            {expandedSections.execution && renderSectionItems([
              { id: "execution-planner", title: "Planner", sub: "Strategy" },
              { id: "execution-workers", title: "Workers", sub: "Threads" },
              { id: "execution-reviews", title: "Reviews", sub: "Evaluation" },
              { id: "execution-human-approvals", title: "Human Approvals", sub: "Pending" },
              { id: "execution-timeline", title: "Timeline", sub: "Orchestration" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('evidence')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <FileText className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Evidence
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.evidence ? "" : "-rotate-90")} />
            </button>
            {expandedSections.evidence && renderSectionItems([
              { id: "evidence-artifacts", title: "Artifacts", sub: "Outputs" },
              { id: "evidence-logs", title: "Logs", sub: "Execution" },
              { id: "evidence-claims", title: "Claims", sub: "Assertions" },
              { id: "evidence-decisions", title: "Decisions", sub: "Rationale" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('verification')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <ShieldCheck className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Verification
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.verification ? "" : "-rotate-90")} />
            </button>
            {expandedSections.verification && renderSectionItems([
              { id: "verification-runs", title: "Verifier Runs", sub: "Checks" },
              { id: "verification-pass-fail", title: "PASS / FAIL", sub: "Verdicts" },
              { id: "verification-assurance", title: "Assurance", sub: "Levels" },
              { id: "verification-certificates", title: "Certificates", sub: "Issued" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('settlement')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <CheckCircle2 className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Settlement
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.settlement ? "" : "-rotate-90")} />
            </button>
            {expandedSections.settlement && renderSectionItems([
              { id: "settlement-mission-results", title: "Mission Results", sub: "Closing" },
              { id: "settlement-outcomes", title: "Outcomes", sub: "Effects" },
              { id: "settlement-audit", title: "Audit", sub: "Ledger" },
              { id: "settlement-learning", title: "Learning", sub: "Feedback" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('governance')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Scale className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Governance
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.governance ? "" : "-rotate-90")} />
            </button>
            {expandedSections.governance && renderSectionItems([
              { id: "authority", title: "Authority", sub: "Access" },
              { id: "governance-policies", title: "Policies", sub: "Rules" },
              { id: "governance-roles", title: "Roles", sub: "Permissions" },
              { id: "governance-budgets", title: "Budgets", sub: "Allocation" },
              { id: "governance-audit", title: "Audit", sub: "Logs" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('observe')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Activity className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Observe
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.observe ? "" : "-rotate-90")} />
            </button>
            {expandedSections.observe && renderSectionItems([
              { id: "observe-runtime", title: "Runtime", sub: "Metrics" },
              { id: "observe-timeline", title: "Timeline", sub: "Flow" },
              { id: "observe-analytics", title: "Analytics", sub: "Data" },
              { id: "observe-performance", title: "Performance", sub: "Stats" }
            ])}
          </div>

          <div className="flex flex-col mt-1">
            <button 
              onClick={() => toggleSection('developer')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Terminal className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Developer
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.developer ? "" : "-rotate-90")} />
            </button>
            {expandedSections.developer && renderSectionItems([
              { id: "developer-sdk", title: "SDK", sub: "Libraries" },
              { id: "developer-mcp", title: "MCP", sub: "Protocol" },
              { id: "developer-api-keys", title: "API Keys", sub: "Access" },
              { id: "developer-webhooks", title: "Webhooks", sub: "Delivery" },
              { id: "developer-api-watcher", title: "API Watcher", sub: "Hooks" },
              { id: "developer-verifiers", title: "Verifiers", sub: "Custom" },
              { id: "developer-tool-adapters", title: "Tool Adapters", sub: "Plugins" }
            ])}
          </div>

          <div className="flex flex-col mt-1 mb-4">
            <button 
              onClick={() => toggleSection('account')}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-black/5 font-medium text-[#555]")}
            >
              <Settings className="size-[18px] shrink-0 text-[#777] group-hover:text-[#555]" />
              Organization Account
              <ChevronDown className={cn("size-3.5 ml-auto text-black/30 transition-transform", expandedSections.account ? "" : "-rotate-90")} />
            </button>
            {expandedSections.account && renderSectionItems([
              { id: "account-profile", title: "Organization Profile", sub: "Manage account" },
              { id: "account-members", title: "Members", sub: "Team" },
              { id: "account-teams", title: "Teams", sub: "Groups" },
              { id: "account-roles", title: "Roles", sub: "Access" },
              { id: "account-billing", title: "Billing", sub: "Invoices" },
              { id: "account-settings", title: "Settings", sub: "Preferences" }
            ])}
          </div>
`;

const newLines = [
  ...lines.slice(0, startIndex),
  ...replacement.split('\n'),
  ...lines.slice(endIndex)
];

fs.writeFileSync(path, newLines.join('\n'), 'utf8');
console.log('Successfully replaced sidebar layout JSX');
