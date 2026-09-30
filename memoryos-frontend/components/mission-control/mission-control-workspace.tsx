"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useClerk } from "@clerk/nextjs"
import { useThemePreferenceContext } from "@/components/memoryos/theme-preference-provider"
import {
    CheckCircle2,
    Loader2,
    Home,
    ArrowRight,
    Check,
    AlertTriangle,
    HelpCircle,
    Sparkles,
    ChevronDown,
    Search,
    MoreHorizontal,
    RefreshCw,
    Plus,
    Bell,
    Settings,
    Rocket,
    PanelLeftClose,
    PanelLeftOpen,
    Building,
    Archive,
    Play,
    ShieldCheck,
    Scale,
    Brain,
    Blocks,
    Terminal,
    Pin,
    LayoutDashboard,
    FileText,
    ScrollText,
    History,
    Activity,
    Compass,
    Cloud,
    LogOut,
    User,
    Database,
    ChevronRight,
} from "lucide-react"


import { DateRangePicker } from "./date-range-picker"
import { CommandPalette } from "./command-palette"
import { AccountHomeDashboard } from "./account-home-dashboard"
import { CommandCenterDashboard } from "./workspace/workspace-command-center"
import { WorkspaceMissions } from "./workspace/workspace-missions"
import { WorkspaceInstitutions } from "./workspace/workspace-institutions"
import { WorkspaceWorkers } from "./workspace/workspace-workers"
import { WorkspaceActivity } from "./workspace/workspace-activity"
import { InspectorProvider } from "./universal-inspector"
import { InstitutionRecords } from './institution/institution-records';
import { InstitutionTemplates } from './institution/institution-templates';
import { InstitutionVersions } from './institution/institution-versions';
import { InstitutionPolicies } from './institution/institution-policies';
import { InstitutionGenome } from './institution/institution-genome';
import { InstitutionChangeProposals } from './institution/institution-change-proposals';
import { InstitutionEvolution } from './institution/institution-evolution';
import { InstitutionDetails } from './institution/institution-details';
import { GovernanceWorkspace } from '../../runtime/governance/workspace/GovernanceWorkspace';
import { MissionWorkspace } from '../../runtime/missions/workspace/MissionWorkspace';
import { InstitutionWorkspace } from '../../runtime/institution/workspace/InstitutionWorkspace';
import { AgentWorkspace } from "../../runtime/agents/workspace/AgentWorkspace";
import { ExecutionWorkspace } from "../../runtime/execution/workspace/ExecutionWorkspace";
import { AgentsRegistry } from './agent/agents-registry';
import { AgentsRunning } from './agent/agents-running';
import { AgentsCapabilityLeases } from './agent/agents-capability-leases';
import { AgentsActivity } from './agent/agents-activity';
import { AgentInspector } from './agent/agent-inspector';
import { AiExecutionWorkspace } from "../../runtime/ai-execution/workspace/AiExecutionWorkspace";

import { VerificationWorkspace } from '../../runtime/verification/workspace/VerificationWorkspace';
import { SettlementWorkspace } from '../../runtime/settlement/workspace/SettlementWorkspace';
import { ExecutionInspector } from './execution/execution-inspector';
import { RealityWorkspace } from '../../runtime/reality/workspace/RealityWorkspace';

import { IntegrationsConnections } from './integrations-connections';
import { IntegrationsConnectionDetail } from './integrations-connection-detail';
import { IntegrationsDataSources } from './integrations-data-sources';

import { IntegrationsDataSourceDetail } from './integrations-data-source-detail';
import { MemoryRecords } from './memory-records';
import { MemoryRecordDetail } from './memory-record-detail';
import { MemoryLessons } from './memory-lessons';
import { MemoryLessonDetail } from './memory-lesson-detail';
import { DeveloperWorkspace } from '../../runtime/developer/workspace/DeveloperWorkspace';
import { AccountMembers } from './account-members';
import { AccountProfile } from './account-profile';
import { AccountRecents, type RecentItem } from './account-recents';

import { OrganizationProfile } from './organization/organization-profile';
import { OrganizationMembers } from './organization/organization-members';
import { OrganizationTeams } from './organization/organization-teams';
import { OrganizationRoles } from './organization/organization-roles';
import { OrganizationBilling } from './organization/organization-billing';
import { OrganizationSettings } from './organization/organization-settings';


import { ObserveWorkspace } from '../../runtime/observe/workspace/ObserveWorkspace';

import { EvidenceWorkspace } from '../../runtime/evidence/workspace/EvidenceWorkspace';

const SECTION_INFO: Record<string, { title: string, sub: string }> = {
    // WORKSPACE
    "workspace-command-center": { title: "Command Center", sub: "Overview" },
    "workspace-missions": { title: "Missions", sub: "Operations" },
    "workspace-institutions": { title: "Institutions", sub: "Organizations" },
    "workspace-workers": { title: "Workers", sub: "Agents" },
    "workspace-activity": { title: "Activity", sub: "Timeline" },
    // OPERATIONS
    "operations-executions": { title: "Executions", sub: "Running" },
    "operations-evidence": { title: "Evidence", sub: "Artifacts" },
    "operations-verification": { title: "Verification", sub: "Checks" },
    "operations-approvals": { title: "Approvals", sub: "Pending" },
    "operations-recovery": { title: "Recovery", sub: "Errors" },
    // INTELLIGENCE
    "intelligence-production": { title: "Production Intelligence", sub: "Insights" },
    "intelligence-failures": { title: "Failure Clusters", sub: "Patterns" },
    "intelligence-root-causes": { title: "Root Causes", sub: "Analysis" },
    "intelligence-evaluations": { title: "Evaluations", sub: "Metrics" },
    "intelligence-replays": { title: "Replays", sub: "Sessions" },
    "intelligence-fix-proposals": { title: "Fix Proposals", sub: "Suggested" },
    "intelligence-reliability": { title: "Reliability", sub: "Health" },
    "intelligence-improvements": { title: "Improvements", sub: "Suggestions" },
    // AI EXECUTION RUNTIME
    "ai-execution-providers": { title: "Providers", sub: "Infrastructure" },
    "ai-execution-models": { title: "Models", sub: "Capabilities" },
    "ai-execution-workers": { title: "AI Workers", sub: "Execution" },
    "ai-execution-routing": { title: "Routing", sub: "Explorer" },
    "ai-execution-gpu": { title: "GPU Status", sub: "Telemetry" },
    "ai-execution-health": { title: "Provider Health", sub: "Uptime" },
    "ai-execution-costs": { title: "Costs", sub: "Billing" },
    "ai-execution-failovers": { title: "Failover History", sub: "Resilience" },
    "ai-execution-capabilities": { title: "Capability Matrix", sub: "Support" },
    // RUNTIME ACCESS
    "runtime-api": { title: "API", sub: "Explorer" },
    "runtime-api-keys": { title: "API Keys", sub: "Access" },
    "runtime-sdk": { title: "SDK", sub: "Libraries" },
    "runtime-mcp": { title: "MCP", sub: "Protocol" },
    "runtime-integrations": { title: "Integrations", sub: "GitHub, Slack, Jira" },
    "runtime-cli": { title: "CLI", sub: "Tools" },
    "runtime-webhooks": { title: "Webhooks", sub: "Delivery" },
    "runtime-edge-runtime": { title: "Edge Runtime", sub: "Workers" },
    // GOVERNANCE
    "governance-policies": { title: "Policies", sub: "Rules" },
    "governance-budgets": { title: "Budgets", sub: "Allocation" },
    "governance-audit": { title: "Audit", sub: "Logs" },
    // MEMORY & SETTLEMENT
    "settlement-memory-preflight": { title: "Memory Preflight", sub: "Context" },
    "settlement-mission-outcomes": { title: "Mission Outcomes", sub: "Results" },
    "settlement-learning-handoff": { title: "Learning Handoff", sub: "Transfer" },
    "settlement-settlement": { title: "Settlement", sub: "Closure" },
    "settlement-certificates": { title: "Certificates", sub: "Verified" },
    "governance-organization": { title: "Organization", sub: "Structure" },
    // ACCOUNT
    "home": { title: "Account home", sub: "" },
    "account-settings": { title: "Organization Settings", sub: "Preferences" },
    "recents": { title: "Recents", sub: "History" },
};

export type SidebarSection = keyof typeof SECTION_INFO | "missions-active-dropdown";

const ACTIVE_MISSION_CONTROL_SECTION_KEY = "memoryos.mission-control.active-section";

function readActiveMissionControlSection(): SidebarSection {
    if (typeof window === "undefined") return "home";
    try {
        const requestedTab = new URLSearchParams(window.location.search).get("tab")?.trim().toLowerCase();
        const tabSection: Record<string, SidebarSection> = {
            "data sources": "integrations-data-sources",
            "integrations": "integrations-connections",
            "command center": "workspace-command-center",
            "missions": "workspace-missions",
            "institutions": "workspace-institutions",
            "workers": "workspace-workers",
            "activity": "workspace-activity",
        };
        if (requestedTab && tabSection[requestedTab]) return tabSection[requestedTab];

        const stored = window.sessionStorage.getItem(ACTIVE_MISSION_CONTROL_SECTION_KEY);
        return stored ? stored as SidebarSection : "home";
    } catch {
        return "home";
    }
}
import { MemoryOSIcon } from "@/components/landing/memoryos-icon"
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context"
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference"
import { useProfilePreferences } from "@/lib/continuity-lab/use-profile-preferences"
import type { ProfilePreferences } from "@/lib/continuity-lab/profile-preferences-storage"
import { profileText } from "@/lib/continuity-lab/profile-preferences-formatting"
import { OperationsExecutions } from "./operations/operations-executions"
import { OperationsEvidence } from "./operations/operations-evidence"
import { OperationsVerification } from "./operations/operations-verification"
import { OperationsApprovals } from "./operations/operations-approvals"
import { OperationsRecovery } from "./operations/operations-recovery"
import { IntelligenceProduction } from "./dashboards/intelligence-production"
import { IntelligenceClusters } from "./dashboards/intelligence-clusters"
import { IntelligenceRootCauses } from "./dashboards/intelligence-root-causes"
import { IntelligenceEvaluations } from "./dashboards/intelligence-evaluations"
import { IntelligenceReplays } from "./dashboards/intelligence-replays"
import { IntelligenceFixProposals } from "./dashboards/intelligence-fix-proposals"
import { IntelligenceReliability } from "./dashboards/intelligence-reliability"
import { IntelligenceImprovements } from "./dashboards/intelligence-improvements"
import { consoleApiFetch } from "@/lib/console-api"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { authorizeConnector } from "@/lib/continuity-lab/connector-actions"
import {
    fetchGitHubPullRequest,
    parseRepoFullName,
    type GitHubPullRequestDetail,
} from "@/lib/continuity-lab/wiki-api"
import {
    createDhyraMission,
    createDhyraMissionEvidence,
    listDhyraInstitutions,
    listDhyraVerificationRuns,
    readActiveDhyraWorkspaceId,
    resolveActiveDhyraWorkspaceId,
    verifyDhyraMission,
    type DhyraVerificationRunHistoryItem,
} from "@/lib/dhyra-api"
import type { MemoryOsConnectorState } from "@/lib/continuity-lab/runtime"
import { cn } from "@/lib/utils"

type Phase = "idle" | "connected" | "verifying" | "result"
type Verdict = "PASS" | "FAIL" | "UNKNOWN"

type PullRequest = {
    id: string
    number: string
    title: string
    branch: string
    verdict: Verdict
    confidence: number
    summary: string
    risks: string[]
    recommended: string
    evidence: string[]
}

type VerificationTimelineStep = {
    id: string
    label: string
    detail: string
    status: "complete" | "active" | "pending"
}

type VerificationRecord = {
    id: string
    createdAt: string
    repository: string
    pullRequestNumber: number
    pullRequestTitle: string
    pullRequestUrl: string | null
    verdict: Verdict
    confidence: number
    evidenceReport: {
        summary: string
        findings: string[]
        files: Array<{
            path: string
            status: string
            additions: number
            deletions: number
            changes: number
            patchAvailable: boolean
        }>
        reviewSignals: {
            statusState: string | null
            statusCount: number | null
            reviews: number
            reviewComments: number
            comments: number
        }
    }
    risks: string[]
    recommendedAction: string
    timeline: VerificationTimelineStep[]
}

const VERIFICATION_STEPS = ["Repo scan", "Evidence collection", "Policy checks", "Decision"]

function clampConfidence(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)))
}

function summarizeVerdict(detail: GitHubPullRequestDetail): Verdict {
    const status = (detail.statusState ?? "").toLowerCase()
    if (status === "failure" || status === "error") return "FAIL"
    if (detail.merged || status === "success") return "PASS"
    if (detail.draft) return "UNKNOWN"
    return "UNKNOWN"
}

function buildVerificationRecord(
    repository: string,
    detail: GitHubPullRequestDetail,
): VerificationRecord {
    const verdict = summarizeVerdict(detail)
    const confidenceBase =

        48 +
        (detail.statusState?.toLowerCase() === "success" ? 20 : 0) +
        (detail.reviews.length > 0 ? 8 : 0) +
        (detail.reviewComments > 0 ? -8 : 0) +
        (detail.comments > 0 ? 4 : 0) +
        (detail.merged ? 10 : 0) +
        (detail.draft ? -12 : 0)

    const files = detail.files.map((file) => ({
        path: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patchAvailable: Boolean(file.patch),
    }))

    const findings = [
        `${detail.changedFiles} changed files, ${detail.additions} additions, and ${detail.deletions} deletions captured from GitHub.`,
        detail.statusState
            ? `GitHub status checks report ${detail.statusState}${detail.statusCount ? ` across ${detail.statusCount} checks` : ""}.`
            : "No GitHub status check summary was returned for this pull request.",
        detail.reviews.length > 0
            ? `${detail.reviews.length} review${detail.reviews.length === 1 ? "" : "s"} were returned by GitHub.`
            : "No review records were returned by GitHub.",
        detail.reviewComments > 0
            ? `${detail.reviewComments} review comments are attached to the pull request.`
            : "No review comments are attached to the pull request.",
    ]

    const risks: string[] = []
    if (detail.draft) risks.push("The pull request is still marked as a draft.")
    if ((detail.statusState ?? "").toLowerCase() === "failure" || (detail.statusState ?? "").toLowerCase() === "error") {
        risks.push("GitHub status checks are not passing.")
    }
    if (detail.reviewComments > 0) risks.push("Open review comments still need attention.")
    if (detail.changedFiles >= 20) risks.push("Large surface area increases verification risk.")

    const recommendedAction =
        verdict === "PASS"
            ? "Ship this change or merge it after your usual release checklist."
            : verdict === "FAIL"
                ? "Address the failing checks and review comments before merging."
                : "Review the open feedback and status checks before deciding."

    const confidence = clampConfidence(confidenceBase)

    return {
        id: `github-pr-${detail.number}`,
        createdAt: detail.updatedAt ?? detail.createdAt ?? new Date().toISOString(),
        repository,
        pullRequestNumber: detail.number,
        pullRequestTitle: detail.title,
        pullRequestUrl: detail.htmlUrl,
        verdict,
        confidence,
        evidenceReport: {
            summary: `${detail.title} was evaluated from live GitHub pull request data.`,
            findings,
            files,
            reviewSignals: {
                statusState: detail.statusState,
                statusCount: detail.statusCount,
                reviews: detail.reviews.length,
                reviewComments: detail.reviewComments,
                comments: detail.comments,
            },
        },
        risks,
        recommendedAction,
        timeline: [
            {
                id: "scan",
                label: "Repository scan",
                detail: `Loaded live pull request #${detail.number} from ${repository}.`,
                status: "complete",
            },
            {
                id: "evidence",
                label: "Evidence collection",
                detail: `${detail.changedFiles} files and related GitHub review data were collected.`,
                status: "complete",
            },
            {
                id: "policy",
                label: "Policy checks",
                detail:
                    detail.statusState?.toLowerCase() === "success"
                        ? "GitHub checks are green."
                        : detail.statusState
                            ? `GitHub checks reported ${detail.statusState}.`
                            : "No status summary was available.",
                status: detail.statusState?.toLowerCase() === "success" ? "complete" : "active",
            },
            {
                id: "decision",
                label: "Decision",
                detail: `Verification completed with ${verdict}.`,
                status: verdict === "UNKNOWN" ? "active" : "complete",
            },
        ],
    }
}

type Repo = {
    id: string
    name: string
    fullName: string
    owner: string | null
    repoName: string | null
    defaultBranch: string | null
    isPrivate?: boolean
}

function connectorRepoToRepo(
    repo: MemoryOsConnectorState["payload"]["github"]["repos"][number],
    index: number,
): Repo {
    const fullName = repo.fullName?.trim() || `repo-${index + 1}`;
    const parsed = parseRepoFullName(fullName);
    return {
        id: fullName,
        name: parsed?.repo ?? fullName.split("/").pop() ?? fullName,
        fullName,
        owner: parsed?.owner ?? null,
        repoName: parsed?.repo ?? null,
        defaultBranch: repo.defaultBranch ?? null,
        isPrivate: repo.private,
    };
}

export function MissionControlWorkspace() {
    const { signOut } = useClerk()
    const themeContext = useThemePreferenceContext()
    const theme = themeContext?.preference || "system"
    const setTheme = themeContext?.setThemePreference || (() => {})
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isSidebarLocked, setIsSidebarLocked] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const isSidebarExpanded = isSidebarLocked || isSidebarHovered;
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
    const [selectedAuthorityId, setSelectedAuthorityId] = useState<string | null>(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(null);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<SidebarSection>(readActiveMissionControlSection)
    const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null)
    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)
    const [selectedExecutionNodeId, setSelectedExecutionNodeId] = useState<string | null>(null)
    const [activeMissionTab, setActiveMissionTab] = useState('Overview')

    const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null)
    const [selectedDashboardMode, setSelectedDashboardMode] = useState<"view" | "edit">("view")
    const [createdAnalyticsDashboards, setCreatedAnalyticsDashboards] = useState<any[]>([])

    const handleCreateAnalyticsDashboard = useCallback((dashboard: any) => {
        setCreatedAnalyticsDashboards(prev => [...prev, dashboard])
        setSelectedDashboardId(dashboard.id)
        setSelectedDashboardMode("view")
    }, [])

    const handleEditAnalyticsDashboard = useCallback((id: string) => {
        setSelectedDashboardId(id)
        setSelectedDashboardMode("edit")
    }, [])

    const handleDuplicateAnalyticsDashboard = useCallback((dashboard: any) => {
        const newDashboard = {
            ...dashboard,
            id: `dashboard-${Date.now()}`,
            title: `${dashboard.title} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        setCreatedAnalyticsDashboards(prev => [...prev, newDashboard])
    }, [])

    const handleDeleteAnalyticsDashboard = useCallback((id: string) => {
        setCreatedAnalyticsDashboards(prev => prev.filter(d => d.id !== id))
        if (selectedDashboardId === id) {
            setSelectedDashboardId(null)
        }
    }, [selectedDashboardId])

    const { connector } = useContinuityLab()
    const { preference, setThemePreference } = useThemePreference()
    const { preferences: profilePreferences, setProfilePreferences: handleProfilePreferenceChange } = useProfilePreferences()
    const profileLabel = (key: string) => profileText(profilePreferences.language, key)

    const [phase, setPhase] = useState<Phase>("idle")
    const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveDhyraWorkspaceId())
    const [refreshTick, setRefreshTick] = useState(0)
    const sidebarSectionRefs = useRef<Record<SidebarSection, HTMLDivElement | null>>({} as any)
    const [connectStatus, setConnectStatus] = useState<any>(null)
    const [connectError, setConnectError] = useState<string | null>(null)
    const [githubConnected, setGithubConnected] = useState(false)
    const [githubNeedsReconnect, setGithubNeedsReconnect] = useState(false)
    const [githubLoadingRepos, setGithubLoadingRepos] = useState(false)
    const [launchStatus, setLaunchStatus] = useState<any>(null)
    const [selectedPr, setSelectedPr] = useState<PullRequest | null>(null)
    const [liveRepos, setLiveRepos] = useState<Repo[]>([])
    const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>(undefined)
    const [repoLoadError, setRepoLoadError] = useState<string | null>(null)
    const [selectedPrId, setSelectedPrId] = useState<string | undefined>(undefined)
    const [selectedRepoPullRequests, setSelectedRepoPullRequests] = useState<PullRequest[]>([])
    const [repoLoadingId, setRepoLoadingId] = useState<string | null>(null)
    const [pullRequestLoadError, setPullRequestLoadError] = useState<string | null>(null)
    const [launchError, setLaunchError] = useState<string | null>(null)
    const [activeStep, setActiveStep] = useState<number>(0)
    const [verificationResult, setVerificationResult] = useState<VerificationRecord | null>(null)
    const [verificationHistory, setVerificationHistory] = useState<DhyraVerificationRunHistoryItem[]>([])
    const [verificationHistoryLoading, setVerificationHistoryLoading] = useState(false)
    const [verificationHistoryError, setVerificationHistoryError] = useState<string | null>(null)
    const [isSectionLoading, setIsSectionLoading] = useState(false)

    const selectedRepo = liveRepos.find((r) => r.id === selectedRepoId)

    const connectGithub = useCallback(async () => {
        setConnectError(null)
        setConnectStatus("connecting")
        try {
            await authorizeConnector("github")
        } catch (error) {
            setConnectStatus(null)
            setConnectError(error instanceof Error ? error.message : "Could not start GitHub authorization.")
        }
    }, [])

    const renderVerdictColor = (verdict: string) => {
        if (verdict === "PASS") return "bg-[#e8f5e9] text-[#1b5e20]"
        if (verdict === "FAIL") return "bg-[#ffebee] text-[#c62828]"
        return "bg-[#fff8e1] text-[#f57f17]"
    }

    const renderVerificationHistory = (limit?: number) => {
        const history = limit ? verificationHistory.slice(0, limit) : verificationHistory;
        if (verificationHistoryLoading) return <p className="text-sm text-foreground/55">Loading verification history...</p>
        if (verificationHistoryError) return <p className="text-sm text-[#8a6d1d]">{verificationHistoryError}</p>
        if (history.length === 0) return <p className="text-sm text-foreground/55">No recent verification history.</p>

        return (
            <div className="space-y-3">
                {history.map((run: any) => (
                    <div key={run.id} className="p-3 border border-border rounded-md bg-card flex justify-between items-center">
                        <div>
                            <div className="font-semibold text-sm">{run.title}</div>
                            <div className="text-xs text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</div>
                        </div>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider", renderVerdictColor(run.metadata?.verdict || "UNKNOWN"))}>
                            {run.metadata?.verdict || "UNKNOWN"}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    const startVerification = useCallback(async () => {
        if (!selectedRepo || !selectedPr) {
            setLaunchError("Select a repository and pull request before starting verification.")
            return
        }

        if (!workspaceId) {
            setLaunchError("No active workspace selected yet.")
            return
        }

        const repoParts =
            selectedRepo.owner && selectedRepo.repoName
                ? { owner: selectedRepo.owner, repo: selectedRepo.repoName }
                : parseRepoFullName(selectedRepo.fullName)

        if (!repoParts) {
            setLaunchError("The selected repository is missing owner or repo metadata.")
            return
        }

        setLaunchError(null)
        setLaunchStatus("launching")
        setPhase("verifying")
        setActiveStep(0)

        try {
            const institutions = await listDhyraInstitutions(workspaceId)
            const institution = institutions[0]
            if (!institution) {
                throw new Error("Create an institution first so verification has a place to write back.")
            }

            const detail = await fetchGitHubPullRequest(repoParts.owner, repoParts.repo, Number(selectedPr.number))

            if (!detail) {
                throw new Error("Could not fetch pull request details.")
            }

            const record = buildVerificationRecord(selectedRepo.fullName, detail)

            await createDhyraMission(workspaceId, {
                institutionId: institution.id,
                title: "Code verification: " + record.pullRequestTitle,
                objective: record.evidenceReport.summary,

                proof: {
                    pullRequestUrl: record.pullRequestUrl,
                    verdict: record.verdict,
                },
            })

            setVerificationResult(record)
            setLaunchStatus(null)
            setPhase("result")
        } catch (error) {
            setLaunchStatus(null)
            setPhase("idle")
            setLaunchError(error instanceof Error ? error.message : "Verification failed to launch.")
        }
    }, [selectedRepo, selectedPr, workspaceId])

    const [recentItems, setRecentItems] = useState<RecentItem[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = window.localStorage.getItem("memoryos-recent-items");
                if (stored) return JSON.parse(stored);
            } catch { }
        }
        return [];
    });

    const addToRecents = useCallback((section: string) => {
        const info = SECTION_INFO[section];
        if (!info) return;
        setRecentItems(prev => {
            const filtered = prev.filter(item => item.id !== section);
            const updated = [{ id: section, title: info.title, sub: info.sub, timestamp: Date.now() }, ...filtered].slice(0, 10);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem("memoryos-recent-items", JSON.stringify(updated));
            }
            return updated;
        });
    }, []);

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        workspace: true,
        operations: false,
        intelligence: false,
        ai_execution: false,
        runtime_access: false,
        governance: false,
        account: false,
        recents: true
    })

    const [pinnedItems, setPinnedItems] = useState<string[]>([])

    const togglePin = (title: string) => {
        setPinnedItems(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title])
    }

    const renderSectionItems = (items: { id: string, title: string, sub: string }[]) => {
        const sorted = [...items].sort((a, b) => {
            const aPinned = pinnedItems.includes(a.title);
            const bPinned = pinnedItems.includes(b.title);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0;
        });
        return (
            <div className="pl-9 pr-3 py-1 flex flex-col gap-1 relative">
                <div className="absolute left-[21px] top-2 bottom-2 w-[1px] bg-border" />
                {sorted.map(item => {
                    const isPinned = pinnedItems.includes(item.title);
                    return (
                        <button
                            key={item.id}
                            onClick={() => goToSidebarSection(item.id as SidebarSection)}
                            className={cn("flex items-center justify-between group/item px-2 py-1.5 rounded-md transition-colors w-full text-left -ml-2", activeSection === item.id ? 'bg-muted text-foreground font-semibold' : 'hover:bg-muted/50 text-muted-foreground')}
                        >
                            <div className="flex flex-col w-full min-w-0">
                                <span className={cn("text-[13px] leading-snug truncate", activeSection === item.id ? "text-foreground" : "text-muted-foreground font-medium")}>{item.title}</span>
                                <span className="text-[11px] text-muted-foreground/70 font-normal leading-none truncate mt-[2px]">{item.sub}</span>
                            </div>
                            <div
                                role="button"
                                onClick={(e) => { e.stopPropagation(); togglePin(item.title); }}
                                className={cn("p-1 rounded hover:bg-muted transition-colors ml-2 shrink-0 opacity-0 group-hover/item:opacity-100 focus:opacity-100", isPinned ? "opacity-100 text-foreground" : "text-muted-foreground")}
                            >
                                <Pin className={cn("size-3.5", isPinned && "fill-current")} />
                            </div>
                        </button>
                    )
                })}
            </div>
        )
    }

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const goToSidebarSection = (section: SidebarSection) => {
        setActiveSection(section)
        addToRecents(section)
    }

    useEffect(() => {
        try {
            window.sessionStorage.setItem(ACTIVE_MISSION_CONTROL_SECTION_KEY, activeSection)
        } catch {
            // Session storage can be unavailable in privacy-restricted browsers.
        }
    }, [activeSection])

    return (
        <InspectorProvider>
            <style>{`
 .custom-sidebar-scrollbar::-webkit-scrollbar { width: 6px; }
 .custom-sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
 .custom-sidebar-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(100, 100, 100, 0.2); border-radius: 10px; }
 .dark .custom-sidebar-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(200, 200, 200, 0.2); }
 .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(100, 100, 100, 0.4); }
 `}</style>
            <div className="mission-control-root flex h-screen bg-background text-foreground font-sans overflow-hidden">
                <aside className={cn("bg-background border-r border-border flex flex-col transition-all duration-300 relative z-20 ", isSidebarExpanded ? "w-[260px]" : "w-[64px]")}
                    onMouseEnter={() => !isSidebarLocked && setIsSidebarHovered(true)}
                    onMouseLeave={() => !isSidebarLocked && setIsSidebarHovered(false)}
                >
                    <div className="h-14 flex flex-col justify-center shrink-0 border-b border-border">
                        <div className={cn("flex items-center gap-3 px-6", isSidebarExpanded ? "justify-start" : "justify-center")}>
                            <div className="size-8 flex items-center justify-center shrink-0 ml-1">
                                <svg width="64" height="40" viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[32px] h-[20px] text-foreground">
                                    <path d="M53.6688 3.16846H59.9748C60.473 3.16846 60.9508 3.46054 61.3031 3.98044C61.6553 4.50034 61.8532 5.20548 61.8532 5.94073V15.2477C61.8532 15.9829 61.6553 16.6881 61.3031 17.208C60.9508 17.7279 60.473 18.0199 59.9748 18.0199H53.6688C53.1706 18.0199 52.6928 17.7279 52.3405 17.208C51.9882 16.6881 51.7903 15.9829 51.7903 15.2477V5.94073C51.7903 5.20548 51.9882 4.50034 52.3405 3.98044C52.6928 3.46054 53.1706 3.16846 53.6688 3.16846Z" fill="currentColor" />
                                    <path d="M22.2725 20.9902H32.3354V33.0694C32.3354 33.8047 32.1375 34.5098 31.7852 35.0297C31.433 35.5496 30.9552 35.8417 30.457 35.8417H24.1509C23.6527 35.8417 23.175 35.5496 22.8227 35.0297C22.4704 34.5098 22.2725 33.8047 22.2725 33.0694V20.9902Z" fill="currentColor" />
                                    <path d="M14.7589 6.13867H21.065C21.5632 6.13867 22.0409 6.43075 22.3932 6.95065C22.7455 7.47056 22.9434 8.1757 22.9434 8.91095V20.9902H14.7589C14.2607 20.9902 13.7829 20.6981 13.4307 20.1782C13.0784 19.6583 12.8805 18.9531 12.8805 18.2179V8.91095C12.8805 8.1757 13.0784 7.47056 13.4307 6.95065C13.7829 6.43075 14.2607 6.13867 14.7589 6.13867Z" fill="currentColor" />
                                    <path d="M41.7274 20H49.9119C50.4101 20 50.8879 20.2921 51.2401 20.812C51.5924 21.3319 51.7903 22.037 51.7903 22.7723V32.0792C51.7903 32.8145 51.5924 33.5196 51.2401 34.0395C50.8879 34.5594 50.4101 34.8515 49.9119 34.8515H43.6058C43.1076 34.8515 42.6299 34.5594 42.2776 34.0395C41.9253 33.5196 41.7274 32.8145 41.7274 32.0792V20Z" fill="currentColor" />
                                    <path d="M4.02514 21.9805H10.3312C10.8294 21.9805 11.3072 22.2725 11.6594 22.7924C12.0117 23.3124 12.2096 24.0175 12.2096 24.7527V34.0597C12.2096 34.7949 12.0117 35.5001 11.6594 36.02C11.3072 36.5399 10.8294 36.832 10.3312 36.832H4.02514C3.52695 36.832 3.04917 36.5399 2.6969 36.02C2.34463 35.5001 2.14673 34.7949 2.14673 34.0597V24.7527C2.14673 24.0175 2.34463 23.3124 2.6969 22.7924C3.04917 22.2725 3.52695 21.9805 4.02514 21.9805Z" fill="currentColor" />
                                    <path d="M33.543 6.13867H39.849C40.3472 6.13867 40.825 6.43075 41.1773 6.95065C41.5295 7.47056 41.7274 8.1757 41.7274 8.91095V20.9902H31.6646V8.91095C31.6646 8.1757 31.8625 7.47056 32.2147 6.95065C32.567 6.43075 33.0448 6.13867 33.543 6.13867Z" fill="currentColor" />
                                    <path d="M22.9434 18.2178C22.9434 20.297 23.319 20.9901 24.8218 20.9901H22.9434V18.2178Z" fill="currentColor" />
                                    <path d="M31.6645 18.2178C31.6645 20.297 31.2889 20.9901 29.7861 20.9901H31.6645V18.2178Z" fill="currentColor" />
                                    <path d="M22.2725 23.7625C22.2725 21.6833 21.8968 20.9902 20.3941 20.9902H22.2725V23.7625Z" fill="currentColor" />
                                    <path d="M41.7275 23.7625C41.7275 21.6833 41.3518 20.9902 39.8491 20.9902H41.7275V23.7625Z" fill="currentColor" />
                                    <path d="M32.3354 23.7625C32.3354 21.6833 32.7111 20.9902 34.2138 20.9902H32.3354V23.7625Z" fill="currentColor" />
                                    <path d="M41.7274 17.228C41.7274 19.3072 42.1031 20.0003 43.6058 20.0003H41.7274V17.228Z" fill="currentColor" />
                                </svg>
                            </div>
                            <span className={cn("font-medium text-[14px] text-[#0f172a] dark:text-[#F0EFE2] transition-all duration-300", isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
                                Memoryostm@gmail.com
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-sidebar-scrollbar py-3 flex flex-col gap-0.5 px-3">
                        {isSidebarExpanded && (
                            <div className="relative mb-4 mt-2 px-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Quick search... Ctrl K"
                                    className="w-full h-8 pl-8 pr-3 text-[13px] bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground "
                                />
                            </div>
                        )}
                        <div className="flex flex-col mt-1">
                            <button
                                onClick={() => goToSidebarSection('home')}
                                className={cn("flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 w-full group",
                                    activeSection === 'home' ? 'bg-muted font-bold text-foreground' : 'hover:bg-muted/50 font-medium text-muted-foreground',
                                    isSidebarExpanded ? "px-3 py-2 text-[13.5px] text-left" : "px-0 py-2.5 justify-center"
                                )}
                            >
                                <Home className={cn("size-[18px] shrink-0", activeSection === 'home' ? "text-muted-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                <span className={cn("transition-all duration-300 truncate", isSidebarExpanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0 hidden")}>
                                    Account home
                                </span>
                            </button>
                        </div>

                        <div className="flex flex-col mt-1">
                            <button
                                onClick={() => goToSidebarSection('recents')}
                                className={cn("flex items-center rounded-md transition-all duration-300 w-full group",
                                    activeSection === 'recents' ? 'bg-muted font-bold text-foreground' : 'hover:bg-muted/50 font-medium text-muted-foreground',
                                    isSidebarExpanded ? "px-3 py-2 text-[13.5px] text-left" : "px-0 py-2.5 justify-center"
                                )}
                            >
                                <History className={cn("size-[18px] shrink-0", activeSection === 'recents' ? "text-muted-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                <span className={cn("transition-all duration-300 truncate", isSidebarExpanded ? "opacity-100 max-w-[200px] ml-3" : "opacity-0 max-w-0 ml-0")}>
                                    Recents
                                </span>
                                <div
                                    role="button"
                                    onClick={(e) => { e.stopPropagation(); toggleSection('recents'); }}
                                    className={cn("p-1 rounded hover:bg-border text-muted-foreground transition-all duration-300 ml-auto", isSidebarExpanded ? "opacity-100" : "opacity-0 w-0 hidden")}
                                >
                                    <ChevronDown className={cn("size-3.5 transition-transform", expandedSections.recents ? "" : "-rotate-90")} />
                                </div>
                            </button>
                            <div className={cn("transition-all duration-300 overflow-hidden", isSidebarExpanded && expandedSections.recents ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                <div className="pl-9 pr-3 py-1 flex flex-col gap-1 relative">
                                    <div className="absolute left-[21px] top-1 bottom-1 w-[1px] bg-border" />
                                    {recentItems.slice(0, 5).map(item => (
                                        <button
                                            key={`${item.id}-${item.timestamp}`}
                                            onClick={() => goToSidebarSection(item.id as SidebarSection)}
                                            className={cn("flex items-center justify-between group/item px-2 py-1.5 rounded-md transition-colors w-full text-left -ml-2 hover:bg-muted")}
                                        >
                                            <div className="flex flex-col w-full min-w-0">
                                                <span className="text-[13.5px] font-medium leading-snug text-foreground/90 truncate">{item.title}</span>
                                                <div className="flex items-center justify-between mt-[2px] w-full">
                                                    <span className="text-[11.5px] text-muted-foreground font-normal leading-none truncate">{item.sub}</span>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 shrink-0">
                                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    {recentItems.length === 0 && (
                                        <div className="px-2 py-2 text-[12px] text-muted-foreground -ml-2">No recent items</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* WORKSPACE */}
                        <div className="px-6 mt-6 mb-2">
                            <span className="text-[12px] font-medium text-muted-foreground">WORKSPACE</span>
                        </div>
                        <div className="flex flex-col mt-1">
                            <button
                                onClick={() => toggleSection('workspace')}
                                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-muted/50 font-medium text-muted-foreground")}
                            >
                                <LayoutDashboard className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                                Workspace
                                <ChevronDown className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", expandedSections.workspace ? "" : "-rotate-90")} />
                            </button>
                            <div className={cn("transition-all duration-300 overflow-hidden", isSidebarExpanded && expandedSections.workspace ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                {renderSectionItems([
                                    { id: "workspace-command-center", title: "Command Center", sub: "Overview" },
                                    { id: "workspace-missions", title: "Missions", sub: "Operations" },
                                    { id: "workspace-institutions", title: "Institutions", sub: "Organizations" },
                                    { id: "workspace-workers", title: "Workers", sub: "Agents" },
                                    { id: "workspace-activity", title: "Activity", sub: "Timeline" }
                                ])}
                            </div>
                        </div>

                        {/* OPERATIONS */}
                        <div className="px-6 mt-6 mb-2">
                            <span className="text-[12px] font-medium text-muted-foreground">OPERATIONS</span>
                        </div>
                        <div className="flex flex-col mt-1">
                            <button
                                onClick={() => toggleSection('operations')}
                                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-muted/50 font-medium text-muted-foreground")}
                            >
                                <Play className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                                Operations
                                <ChevronDown className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", expandedSections.operations ? "" : "-rotate-90")} />
                            </button>
                            <div className={cn("transition-all duration-300 overflow-hidden", isSidebarExpanded && expandedSections.operations ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                {renderSectionItems([
                                    { id: "operations-executions", title: "Executions", sub: "Running" },
                                    { id: "operations-evidence", title: "Evidence", sub: "Artifacts" },
                                    { id: "operations-verification", title: "Verification", sub: "Checks" },
                                    { id: "operations-approvals", title: "Approvals", sub: "Pending" },
                                    { id: "operations-recovery", title: "Recovery", sub: "Errors" }
                                ])}
                            </div>
                        </div>

                        {/* INTELLIGENCE */}
                        <div className="px-6 mt-6 mb-2">
                            <span className="text-[12px] font-medium text-muted-foreground">INTELLIGENCE</span>
                        </div>
                        <div className="flex flex-col mt-1">
                            <button
                                onClick={() => toggleSection('intelligence')}
                                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-muted/50 font-medium text-muted-foreground")}
                            >
                                <Brain className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                                Intelligence
                                <ChevronDown className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", expandedSections.intelligence ? "" : "-rotate-90")} />
                            </button>
                            <div className={cn("transition-all duration-300 overflow-hidden", isSidebarExpanded && expandedSections.intelligence ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                {renderSectionItems([
                                    { id: "intelligence-production", title: "Production Intelligence", sub: "Insights" },
                                    { id: "intelligence-failures", title: "Failure Clusters", sub: "Patterns" },
                                    { id: "intelligence-root-causes", title: "Root Causes", sub: "Analysis" },
                                    { id: "intelligence-evaluations", title: "Evaluations", sub: "Metrics" },
                                    { id: "intelligence-replays", title: "Replays", sub: "Sessions" },
                                    { id: "intelligence-fix-proposals", title: "Fix Proposals", sub: "Governance" },
                                    { id: "intelligence-reliability", title: "Reliability", sub: "Quality" },
                                    { id: "intelligence-improvements", title: "Improvements", sub: "Verified" }
                                ])}
                            </div>
                        </div>

                        {/* AI EXECUTION */}
                        <div className="px-6 mt-6 mb-2">
                            <span className="text-[12px] font-medium text-muted-foreground">AI EXECUTION RUNTIME</span>
                        </div>
                        <div className="flex flex-col mt-1">
                            <button
                                onClick={() => toggleSection('ai_execution')}
                                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-muted/50 font-medium text-muted-foreground")}
                            >
                                <Database className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                                AI Execution
                                <ChevronDown className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", expandedSections.ai_execution ? "" : "-rotate-90")} />
                            </button>
                            <div className={cn("transition-all duration-300 overflow-hidden", isSidebarExpanded && expandedSections.ai_execution ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                {renderSectionItems([
                                    { id: "ai-execution-providers", title: "Providers", sub: "Infrastructure" },
                                    { id: "ai-execution-models", title: "Models", sub: "Capabilities" },
                                    { id: "ai-execution-workers", title: "AI Workers", sub: "Execution" },
                                    { id: "ai-execution-routing", title: "Routing", sub: "Explorer" },
                                    { id: "ai-execution-gpu", title: "GPU Status", sub: "Telemetry" },
                                    { id: "ai-execution-health", title: "Provider Health", sub: "Uptime" },
                                    { id: "ai-execution-costs", title: "Costs", sub: "Billing" },
                                    { id: "ai-execution-failovers", title: "Failover History", sub: "Resilience" },
                                    { id: "ai-execution-capabilities", title: "Capability Matrix", sub: "Support" }
                                ])}
                            </div>
                        </div>

                        {/* RUNTIME ACCESS */}
                        <div className="px-6 mt-6 mb-2">
                            <span className="text-[12px] font-medium text-muted-foreground">RUNTIME ACCESS</span>
                        </div>
                        <div className="flex flex-col mt-1">
                            <button
                                onClick={() => toggleSection('runtime_access')}
                                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-muted/50 font-medium text-muted-foreground")}
                            >
                                <Terminal className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                                Runtime Access
                                <ChevronDown className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", expandedSections.runtime_access ? "" : "-rotate-90")} />
                            </button>
                            <div className={cn("transition-all duration-300 overflow-hidden", isSidebarExpanded && expandedSections.runtime_access ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                {renderSectionItems([
                                    { id: "runtime-api", title: "API", sub: "Explorer" },
                                    { id: "runtime-api-keys", title: "API Keys", sub: "Access" },
                                    { id: "runtime-sdk", title: "SDK", sub: "Libraries" },
                                    { id: "runtime-mcp", title: "MCP", sub: "Protocol" },
                                    { id: "runtime-integrations", title: "Integrations", sub: "GitHub, Slack, Jira" },
                                    { id: "runtime-cli", title: "CLI", sub: "Tools" },
                                    { id: "runtime-webhooks", title: "Webhooks", sub: "Delivery" },
                                    { id: "runtime-edge-runtime", title: "Edge Runtime", sub: "Workers" }
                                ])}
                            </div>
                        </div>

                        {/* GOVERNANCE */}
                        <div className="px-6 mt-6 mb-2">
                            <span className="text-[12px] font-medium text-muted-foreground">GOVERNANCE</span>
                        </div>
                        <div className="flex flex-col mt-1">
                            <button
                                onClick={() => toggleSection('governance')}
                                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-muted/50 font-medium text-muted-foreground")}
                            >
                                <Scale className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                                Governance
                                <ChevronDown className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", expandedSections.governance ? "" : "-rotate-90")} />
                            </button>
                            <div className={cn("transition-all duration-300 overflow-hidden", isSidebarExpanded && expandedSections.governance ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                {renderSectionItems([
                                    { id: "governance-policies", title: "Policies", sub: "Rules" },
                                    { id: "governance-budgets", title: "Budgets", sub: "Allocation" },
                                    { id: "governance-audit", title: "Audit", sub: "Logs" }
                                ])}
                            </div>
                        </div>

                        {/* ACCOUNT */}
                        <div className="px-6 mt-6 mb-2">
                            <span className="text-[12px] font-medium text-muted-foreground">ACCOUNT</span>
                        </div>
                        <div className="flex flex-col mt-1 mb-4">
                            <button
                                onClick={() => toggleSection('account')}
                                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] transition-colors w-full text-left group hover:bg-muted/50 font-medium text-muted-foreground")}
                            >
                                <Settings className="size-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                                Account
                                <ChevronDown className={cn("size-3.5 ml-auto text-muted-foreground transition-transform", expandedSections.account ? "" : "-rotate-90")} />
                            </button>
                            <div className={cn("transition-all duration-300 overflow-hidden", isSidebarExpanded && expandedSections.account ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                {renderSectionItems([
                                    { id: "account-home", title: "Account Home", sub: "Overview" },
                                    { id: "account-organization", title: "Organization", sub: "Settings" }
                                ])}
                            </div>
                        </div> </div>
                    <div className={cn("h-[46px] border-t border-border flex items-center shrink-0 bg-muted/30 transition-all duration-300 w-full", isSidebarExpanded ? "px-6 justify-start" : "px-0 justify-center")}>
                        <button
                            onClick={() => setIsSidebarLocked(!isSidebarLocked)}
                            className="flex items-center justify-center p-1.5 rounded-[8px] hover:bg-muted text-muted-foreground hover:text-foreground/90 transition-colors border-2 border-transparent hover:border-border"
                        >
                            {isSidebarLocked ? <PanelLeftClose className="size-[18px]" /> : <PanelLeftOpen className="size-[18px]" />}
                        </button>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
                    <header className="h-14 border-b border-border bg-background flex items-center justify-end px-6 lg:px-6 z-10 shrink-0 gap-4">
                        <button className="flex items-center  text-sm text-foreground hover:text-foreground/80 transition-colors">
                            <Plus className="size-4 text-muted-foreground" />
                            New Mission
                        </button>
                        <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
                            <Sparkles className="size-4 text-muted-foreground" />
                            Ask AI
                        </button>
                        <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
                            <HelpCircle className="size-4 text-muted-foreground" />
                            Support
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center justify-center size-8 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors outline-none focus:ring-2 focus:ring-ring">
                                    <User className="size-[18px]" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 font-medium text-sm">
                                <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setActiveSection("account-profile")}>{profileLabel("Profile")}</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setActiveSection("account-billing")}>{profileLabel("Billing")}</DropdownMenuItem>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="cursor-pointer py-2">
                                        {profileLabel("Appearance")}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-40">
                                        <DropdownMenuRadioGroup value={theme || "system"} onValueChange={(val: any) => setTheme(val)}>
                                            <DropdownMenuRadioItem value="light" className="cursor-pointer py-2">Light mode</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="dark" className="cursor-pointer py-2">Dark mode</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="system" className="cursor-pointer py-2">System</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="cursor-pointer py-2">
                                        {profileLabel("Language")}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-40">
                                        <DropdownMenuRadioGroup value={profilePreferences.language} onValueChange={(value) => handleProfilePreferenceChange({ language: value as "en" | "es" | "fr" })}>
                                            <DropdownMenuRadioItem value="en" className="cursor-pointer py-2">English</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="es" className="cursor-pointer py-2">Español</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="fr" className="cursor-pointer py-2">Français</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="cursor-pointer py-2">
                                        {profileLabel("Timezone")}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-48">
                                        <DropdownMenuRadioGroup value={profilePreferences.timezone} onValueChange={(value) => handleProfilePreferenceChange({ timezone: value as "UTC" | "America/New_York" | "Asia/Kolkata" })}>
                                            <DropdownMenuRadioItem value="UTC" className="cursor-pointer py-2">Standard (UTC)</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="America/New_York" className="cursor-pointer py-2">New York (ET)</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="Asia/Kolkata" className="cursor-pointer py-2">India (GMT+5:30)</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => void signOut({ redirectUrl: "/" })}>{profileLabel("Log out")}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>
                    <div className={`flex-1 flex flex-col overflow-y-auto relative ${(activeSection.startsWith("observe-") && selectedDashboardId) || activeSection.startsWith("institutions-") || activeSection.startsWith("agents-") || activeSection.startsWith("execution-") || activeSection.startsWith("verification-") || activeSection.startsWith("settlement-") || activeSection.startsWith("governance-") || activeSection === "authority" || activeSection.startsWith("observe-") || activeSection.startsWith("developer") || activeSection.startsWith("runtime-") || activeSection.startsWith("account-") || activeSection.startsWith("evidence-") || activeSection.startsWith("workspace-") || activeSection.startsWith("operations-") || activeSection.startsWith("intelligence-") || activeSection.startsWith("ai-execution-") ||
                        ["integrations-connections", "integrations-data-sources", "event-stream", "impact-analysis", "reality-api-watcher", "reality-graph", "decision-graph"].includes(activeSection) || activeSection.startsWith("missions-")
                        ? ""
                        : "px-6 lg:px-6"
                        }`}>
                        <div className={`w-full flex-1 flex flex-col ${activeSection.startsWith("observe-") || activeSection.startsWith("institutions-") || activeSection.startsWith("agents-") || activeSection.startsWith("execution-") || activeSection.startsWith("evidence-") || activeSection.startsWith("verification-") || activeSection.startsWith("settlement-") || activeSection.startsWith("governance-") || activeSection === "authority" || activeSection.startsWith("developer") || activeSection.startsWith("runtime-") || activeSection.startsWith("account-") || activeSection.startsWith("workspace-") || activeSection.startsWith("operations-") || activeSection.startsWith("intelligence-") || activeSection.startsWith("ai-execution-") ||
                            ["integrations-connections", "integrations-data-sources", "event-stream", "impact-analysis", "reality-api-watcher", "reality-graph", "decision-graph"].includes(activeSection) || activeSection.startsWith("missions-")
                            ? ""
                            : "max-w-[1000px] mx-auto pb-12"
                            }`}>
                            {activeSection === "home" ? (
                                <AccountHomeDashboard onNavigate={(s) => setActiveSection(s as any)} />
                            ) : activeSection === "workspace-command-center" ? (
                                <CommandCenterDashboard workspaceId={workspaceId} onCreateMission={() => setActiveSection("workspace-missions")} />
                            ) : activeSection === "workspace-missions" ? (
                                <WorkspaceMissions workspaceId={workspaceId} />
                            ) : activeSection === "workspace-institutions" ? (
                                <WorkspaceInstitutions workspaceId={workspaceId} />
                            ) : activeSection === "workspace-workers" ? (
                                <WorkspaceWorkers workspaceId={workspaceId} />
                            ) : activeSection === "workspace-activity" ? (
                                <WorkspaceActivity workspaceId={workspaceId} />
                            ) : activeSection === "operations-executions" ? (
                                <OperationsExecutions workspaceId={workspaceId} />
                            ) : activeSection === "operations-evidence" ? (
                                <OperationsEvidence workspaceId={workspaceId} />
                            ) : activeSection === "operations-verification" ? (
                                <OperationsVerification workspaceId={workspaceId} />
                            ) : activeSection === "operations-approvals" ? (
                                <OperationsApprovals workspaceId={workspaceId} />
                            ) : activeSection === "operations-recovery" ? (
                                <OperationsRecovery workspaceId={workspaceId} />
                            ) : activeSection === "intelligence-production" ? (
                                <IntelligenceProduction workspaceId={workspaceId} />
                            ) : activeSection === "intelligence-failures" ? (
                                <IntelligenceClusters workspaceId={workspaceId} />
                            ) : activeSection === "intelligence-root-causes" ? (
                                <IntelligenceRootCauses workspaceId={workspaceId} />
                            ) : activeSection === "intelligence-evaluations" ? (
                                <IntelligenceEvaluations workspaceId={workspaceId} />
                            ) : activeSection === "intelligence-replays" ? (
                                <IntelligenceReplays workspaceId={workspaceId} />
                            ) : activeSection === "intelligence-reliability" ? (
                                <IntelligenceReliability workspaceId={workspaceId} />
                            ) : activeSection === "intelligence-fix-proposals" ? (
                                <IntelligenceFixProposals workspaceId={workspaceId} />
                            ) : activeSection === "intelligence-improvements" ? (
                                <IntelligenceImprovements workspaceId={workspaceId} />
                            ) : activeSection === "recents" ? (
                                <AccountRecents items={recentItems} />
                            ) : ["reality-overview", "reality-graph", "integrations-connections", "integrations-data-sources", "event-stream", "impact-analysis", "reality-api-watcher", "decision-graph"].includes(activeSection) ? (
                                <RealityWorkspace activeSection={activeSection} />
                            ) : activeSection.startsWith("missions-") ? (
                                <MissionWorkspace id={activeSection} />
                            ) : activeSection.startsWith("institutions-") ? (
                                <InstitutionWorkspace activeSection={activeSection} />
                            ) : activeSection.startsWith("agents-") ? (
                                <AgentWorkspace activeSection={activeSection} />
                            ) : activeSection.startsWith("execution-") ? (
                                <ExecutionWorkspace activeSection={activeSection} />
                            ) : activeSection.startsWith("verification-") ? (
                                <VerificationWorkspace activeSection={activeSection} />
                            ) : activeSection.startsWith("settlement-") ? (
                                <SettlementWorkspace activeSection={activeSection} workspaceId={workspaceId ?? ""} />
                            ) : activeSection.startsWith("ai-execution-") ? (
                                <AiExecutionWorkspace activeSection={activeSection} workspaceId={workspaceId} />
                            ) : activeSection.startsWith("evidence-") ? (
                                <EvidenceWorkspace activeSection={activeSection} />
                            ) : activeSection === "authority" || activeSection.startsWith("governance-") ? (
            <GovernanceWorkspace activeSection={activeSection} workspaceId={workspaceId ?? ""} />
                            ) : activeSection === "memory-records" ? (
                                selectedRecordId ? <MemoryRecordDetail id={selectedRecordId} onBack={() => setSelectedRecordId(null)} /> : <MemoryRecords onViewDetail={setSelectedRecordId} />
                            ) : activeSection === "memory-lessons" ? (
                                selectedLessonId ? <MemoryLessonDetail id={selectedLessonId} onBack={() => setSelectedLessonId(null)} /> : <MemoryLessons onViewDetail={setSelectedLessonId} />
                            ) : activeSection.startsWith("developer") || activeSection.startsWith("runtime-") ? (
                                <DeveloperWorkspace activeSection={activeSection} workspaceId={workspaceId} />
                            ) : activeSection.startsWith("observe-") ? (
                                <ObserveWorkspace activeSection={activeSection} />
                            ) : activeSection === "account-profile" ? (
                                <OrganizationProfile />
                            ) : activeSection === "account-members" ? (
                                <OrganizationMembers />
                            ) : activeSection === "account-teams" ? (
                                <OrganizationTeams />
                            ) : activeSection === "account-roles" ? (
                                <OrganizationRoles />
                            ) : activeSection === "account-billing" ? (
                                <OrganizationBilling />
                            ) : activeSection === "account-settings" ? (
                                <OrganizationSettings />
                            ) : activeSection.startsWith("account-") || activeSection.startsWith("workspace-") || activeSection.startsWith("operations-") || activeSection.startsWith("intelligence-") ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <p>This section is under construction.</p>
                                </div>
                            ) : phase === "idle" ? (
                                <div ref={(node) => { sidebarSectionRefs.current.home = node }} className="pt-2">
                                    <h1 className="text-[32px] font-bold text-center text-foreground tracking-tight mb-8">
                                        Time to build something great.
                                    </h1>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                        <div className="col-span-1 md:col-span-1 flex" onClick={connectGithub}>
                                            <div className="flex items-center justify-between w-full p-2 pr-5 bg-card hover:bg-muted border border-border rounded-md cursor-pointer transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative flex items-center justify-center size-11 bg-card border border-border rounded-[12px] shrink-0">
                                                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                                                            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                                            <path d="M9 18c-4.51 2-5-2-7-2" />
                                                        </svg>
                                                        <div className="absolute -top-1 -right-1 size-2.5 bg-card rounded-full border-2 border-white" />
                                                    </div>
                                                    <span className="text-[15px] font-medium text-foreground">
                                                        {connectStatus === "connecting" ? "Connecting..." : "Connect GitHub"}
                                                    </span>
                                                </div>
                                                {connectStatus === "connecting" ? (
                                                    <Loader2 className="size-4 animate-spin text-foreground/40" />
                                                ) : (
                                                    <ArrowRight className="size-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            {connectError && <p className="text-xs text-red-500 text-center w-full mt-2 absolute -bottom-6">{connectError}</p>}
                                        </div>

                                        <div className="col-span-2 border border-border rounded-md p-6 bg-card flex flex-col justify-center items-center text-foreground/40 border-dashed">
                                            <p className="text-sm font-medium">
                                                {githubNeedsReconnect
                                                    ? "GitHub needs attention before repositories can load."
                                                    : githubLoadingRepos
                                                        ? "GitHub is connected. Loading repositories..."
                                                        : "Connect a repository to view recent missions."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : phase === "connected" && (
                                <div ref={(node) => { sidebarSectionRefs.current.verification = node }} className="pt-2">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold tracking-tight">Verification</h2>
                                        <Button
                                            size="sm"
                                            className="btn-glossy-blue font-medium px-6 h-9"
                                            onClick={startVerification}
                                            disabled={launchStatus === "launching" || !selectedPr}
                                        >
                                            {launchStatus === "launching" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                                            Start Verification
                                        </Button>
                                    </div>

                                    {githubNeedsReconnect ? (
                                        <div className="mb-8 rounded-md border border-border bg-[#fff7e1] px-6 py-6 text-sm text-foreground flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <div className="font-semibold">GitHub connection needs attention</div>
                                                <div className="text-muted-foreground">
                                                    The GitHub connector reported an error. Reconnect GitHub to restore repository and PR access.
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="bg-[#d4af37] hover:bg-[#c39f2e] text-foreground font-medium rounded-md px-6 h-9 border-none"
                                                onClick={connectGithub}
                                                disabled={connectStatus === "connecting"}
                                            >
                                                {connectStatus === "connecting" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                                                Reconnect GitHub
                                            </Button>
                                        </div>
                                    ) : githubConnected && liveRepos.length === 0 ? (
                                        <div className="mb-8 rounded-md border border-border bg-muted/50 px-6 py-6 text-sm text-muted-foreground">
                                            GitHub is connected, but no repositories have been synced into the workspace yet.
                                            Open Settings → Connections and refresh GitHub if this does not update in a few moments.
                                        </div>
                                    ) : null}

                                    <div ref={(node) => { sidebarSectionRefs.current.repositories = node }} className="grid md:grid-cols-2 gap-6 mb-8">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-sm font-semibold text-foreground">Select Repository</label>
                                                <span className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest">Required</span>
                                            </div>
                                            <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
                                                <SelectTrigger className="w-full h-11 bg-card border border-border rounded-md px-3 hover:border-border focus:ring-1 focus:ring-[#0f52ff] focus:border-[#0f52ff] transition-all text-[14px] text-foreground">
                                                    <SelectValue placeholder="Select a repository" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border border-border rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden max-h-[300px] !text-foreground">
                                                    {liveRepos.map((repo) => (
                                                        <SelectItem
                                                            key={repo.id}
                                                            value={repo.id}
                                                            className="px-3 py-2.5 cursor-pointer rounded-md mx-1 my-0.5 text-[14px] font-medium transition-colors focus:bg-[#0f52ff] focus:!text-[#F0EFE2] hover:bg-[#0f52ff] hover:!text-[#F0EFE2] data-[highlighted]:bg-[#0f52ff] data-[highlighted]:!text-[#F0EFE2]"
                                                        >
                                                            {repo.fullName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {repoLoadError ? (
                                                <p className="mt-1 text-sm text-[#8a6d1d]">{repoLoadError}</p>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-sm font-semibold text-foreground">Select Pull Request</label>
                                                <span className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest">Required</span>
                                            </div>
                                            <Select value={selectedPrId} onValueChange={setSelectedPrId} disabled={!selectedRepoId || selectedRepoPullRequests.length === 0}>
                                                <SelectTrigger className="w-full h-11 bg-card border border-border rounded-md px-3 hover:border-border focus:ring-1 focus:ring-[#0f52ff] focus:border-[#0f52ff] transition-all text-[14px] text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                                                    <SelectValue placeholder="Select a pull request" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border border-border rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden max-h-[300px] !text-foreground">
                                                    {selectedRepoPullRequests.map((pr) => (
                                                        <SelectItem
                                                            key={pr.id}
                                                            value={pr.id}
                                                            className="px-3 py-2.5 cursor-pointer rounded-md mx-1 my-0.5 text-[14px] font-medium transition-colors focus:bg-[#0f52ff] focus:!text-[#F0EFE2] hover:bg-[#0f52ff] hover:!text-[#F0EFE2] data-[highlighted]:bg-[#0f52ff] data-[highlighted]:!text-[#F0EFE2]"
                                                        >
                                                            {pr.number} - {pr.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {repoLoadingId === selectedRepo?.id ? (
                                                <p className="mt-1 text-sm text-foreground/55">Loading pull requests...</p>
                                            ) : pullRequestLoadError ? (
                                                <p className="mt-1 text-sm text-[#8a6d1d]">{pullRequestLoadError}</p>
                                            ) : selectedRepo && selectedRepoPullRequests.length === 0 ? (
                                                <p className="mt-1 text-sm text-foreground/55">No pull requests found for this repository yet.</p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div ref={(node) => { sidebarSectionRefs.current.recents = node }} className="mb-8">
                                        {renderVerificationHistory(4)}
                                    </div>

                                    {launchError && (
                                        <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-3 mb-6">
                                            <AlertTriangle className="size-4 shrink-0" />
                                            <p>{launchError}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {phase === "verifying" && (
                                <div ref={(node) => { sidebarSectionRefs.current.investigate = node }} className="pt-10 max-w-4xl mx-auto">
                                    {launchStatus === "idle" ? (
                                        <div className="flex flex-col items-center justify-center h-[50vh] text-center w-full">
                                            <div className="size-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/40"><path d="M2 12h4l2-9 5 18 2-9h5" /></svg>
                                            </div>
                                            <h2 className="text-xl font-semibold text-foreground mb-2">No Active Investigation</h2>
                                            <p className="text-sm text-foreground/50 max-w-sm">Select a pull request and start a verification from the dashboard to monitor the live investigation process.</p>
                                            <Button className="mt-6 btn-glossy-blue h-9 px-6" onClick={() => goToSidebarSection("missions")}>Go to Dashboard</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-[#0f52ff] via-[#0f52ff] to-[#d4af37]/20 p-[1px] shadow-[0_24px_80px_rgba(15,82,255,0.18)]">
                                                <div className="rounded-[27px] bg-card/92 backdrop-blur-xl px-6 py-6 md:px-8 md:py-8">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
                                                        <div>
                                                            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9d7ff] bg-[#eef3ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0f52ff]">
                                                                <span className="size-1.5 rounded-full bg-[#0f52ff] animate-pulse" />
                                                                Live verification
                                                            </div>
                                                            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                                                                Analyzing <span className="text-[#0f52ff]">{selectedPr?.number}</span>
                                                            </h2>
                                                            <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/55">
                                                                Dhyra is scanning the repo, collecting evidence, and running policy checks before it writes the final report.
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-6 py-2 text-sm text-foreground ">
                                                            <Loader2 className="size-4 animate-spin text-[#d4af37]" />
                                                            <span className="font-medium">Backend worker active</span>
                                                        </div>
                                                    </div>

                                                    <div className="relative pl-6 space-y-8 before:absolute before:inset-y-2 before:left-8 before:w-px before:bg-gradient-to-b before:from-[#0f52ff]/10 before:via-[#0f52ff]/20 before:to-transparent">
                                                        {VERIFICATION_STEPS.map((step, idx) => {
                                                            const isComplete = idx < activeStep;
                                                            const isActive = idx === activeStep;
                                                            return (
                                                                <div key={step} className="relative flex items-center justify-between gap-6 md:justify-normal md:odd:flex-row-reverse group is-active">

                                                                    <div className={cn(
                                                                        "relative flex items-center justify-center size-9 rounded-full border-4 border-white shadow-[0_10px_22px_rgba(0,0,0,0.08)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2",
                                                                        isComplete
                                                                            ? "bg-[#0f52ff] text-[#F0EFE2] ring-4 ring-[#0f52ff]/10"
                                                                            : isActive
                                                                                ? "bg-[#d4af37] text-[#F0EFE2] ring-4 ring-[#d4af37]/15 animate-pulse"
                                                                                : "bg-muted text-foreground/25"
                                                                    )}>
                                                                        {isComplete ? <Check className="size-4" /> : isActive ? <Loader2 className="size-4 animate-spin" /> : <div className="size-2.5 rounded-full bg-black/20" />}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 md:p-6 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.04)] border backdrop-blur-sm transition-all duration-200",
                                                                        isComplete
                                                                            ? "border-[#c9d7ff] bg-gradient-to-br from-[#f7f9ff] to-white"
                                                                            : isActive
                                                                                ? "border-border bg-gradient-to-br from-[#fff8dd] to-[#fffdf4]"
                                                                                : "border-border bg-card"
                                                                    )}>
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div>
                                                                                <div className={cn(
                                                                                    "text-[11px] font-semibold uppercase tracking-[0.18em] mb-1",
                                                                                    isComplete ? "text-[#0f52ff]" : isActive ? "text-[#8a6d1d]" : "text-foreground/35"
                                                                                )}>
                                                                                    Step {String(idx + 1).padStart(2, "0")}
                                                                                </div>
                                                                                <h3 className={cn("font-semibold text-sm md:text-[15px]", isActive ? "text-foreground" : "text-foreground/60")}>{step}</h3>
                                                                            </div>
                                                                            <div className={cn(
                                                                                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] shrink-0",
                                                                                isComplete
                                                                                    ? "bg-[#eef3ff] text-[#0f52ff]"
                                                                                    : isActive
                                                                                        ? "bg-[#fff1c9] text-[#8a6d1d]"
                                                                                        : "bg-muted text-foreground/35"
                                                                            )}>
                                                                                {isComplete ? "Done" : isActive ? "Now" : "Queued"}
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-xs md:text-[13px] leading-6 text-foreground/55 mt-3">
                                                                            {isActive ? "Processing via backend worker..." : isComplete ? "Completed in this verification run." : "Waiting for the active stage to complete."}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {phase === "result" && (
                                <div ref={(node) => { sidebarSectionRefs.current.analytics = node }} className="pt-4 max-w-[1200px] mx-auto w-full">
                                    {!(selectedPr && verificationResult) ? (
                                        <div className="flex flex-col items-center justify-center h-[50vh] text-center w-full">
                                            <div className="size-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/40"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                                            </div>
                                            <h2 className="text-xl font-semibold text-foreground mb-2">No Analytics Data</h2>
                                            <p className="text-sm text-foreground/50 max-w-sm">Start a verification from the Mission Control dashboard to view analytics for a pull request.</p>
                                            <Button className="mt-6 btn-glossy-blue h-9 px-6" onClick={() => goToSidebarSection("missions")}>Go to Dashboard</Button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Header */}
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6 border-b border-border pb-4">
                                                <h1 className="text-xl font-semibold text-foreground tracking-tight">Analytics</h1>
                                                <div className="flex items-center gap-2">
                                                    <DateRangePicker />
                                                    <button className="flex items-center justify-center size-[34px] rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ">
                                                        <RefreshCw className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-6 flex flex-col gap-1">
                                                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">{verificationResult.pullRequestTitle}</h2>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider", renderVerdictColor(verificationResult.verdict))}>
                                                        {verificationResult.verdict}
                                                    </span>
                                                    <p className="text-sm text-foreground/55">
                                                        {verificationResult.repository} · PR #{verificationResult.pullRequestNumber}
                                                    </p>
                                                    <span className="mx-2 text-foreground/20">|</span>
                                                    <button className="text-[#0f52ff] hover:underline text-sm font-medium inline-flex items-center" onClick={() => {
                                                        setPhase("connected")
                                                        setVerificationResult(null)
                                                        setActiveStep(0)
                                                    }}>
                                                        <ArrowRight className="size-3.5 mr-1.5 rotate-180" /> Verify another PR
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid gap-6 lg:grid-cols-2 mb-4">
                                                <div className="rounded-md border border-border bg-card p-6 flex flex-col">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <span className="text-[13px] font-medium text-foreground/60">Evidence Report</span>
                                                        <button className="text-foreground/40 hover:text-foreground"><MoreHorizontal className="size-4" /></button>
                                                    </div>
                                                    <div className="space-y-4 mb-8 flex-1">
                                                        {verificationResult.evidenceReport.findings.map((item, i) => (
                                                            <div key={i} className="flex gap-2.5 text-[13px] text-foreground/80 items-start">
                                                                <CheckCircle2 className="size-4 shrink-0 text-foreground/40 mt-0.5" />
                                                                <span className="leading-5">{item}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-[11px] uppercase tracking-[0.15em] text-foreground/40 font-semibold mb-3">
                                                        CHANGED FILES
                                                    </div>
                                                    <div className="space-y-1">
                                                        {verificationResult.evidenceReport.files.slice(0, 5).map((file) => (
                                                            <div key={`${file.path}-${file.status}`} className="px-1 py-1.5 flex items-center justify-between gap-6 border-b border-border last:border-0">
                                                                <div>
                                                                    <div className="text-[13px] text-foreground mb-0.5 truncate">{file.path}</div>
                                                                    <div className="text-[11px] text-foreground/40">
                                                                        {file.status} · {file.additions} additions · {file.deletions} deletions
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/40 bg-muted px-1.5 py-0.5 rounded-sm">
                                                                    {file.patchAvailable ? "PATCH" : "NO PATCH"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="rounded-md border border-border bg-card p-6 flex flex-col">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <span className="text-[13px] font-medium text-foreground/60">Risks and Recommendation</span>
                                                        <button className="text-foreground/40 hover:text-foreground"><MoreHorizontal className="size-4" /></button>
                                                    </div>
                                                    <div className="space-y-4 mb-8 flex-1">
                                                        {verificationResult.risks.length === 0 ? (
                                                            <div className="text-[13px] text-foreground/50">No high-risk effects detected.</div>
                                                        ) : (
                                                            verificationResult.risks.map((risk, i) => (
                                                                <div key={i} className="flex gap-2.5 text-[13px] text-foreground/80 items-start">
                                                                    <AlertTriangle className="size-4 shrink-0 text-foreground/40 mt-0.5" />
                                                                    <span className="leading-5">{risk}</span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                    <div className="rounded border border-border bg-muted/50 p-6 mt-auto">
                                                        <div className="text-[11px] uppercase tracking-[0.15em] text-foreground/50 font-semibold mb-2">
                                                            RECOMMENDED NEXT ACTION
                                                        </div>
                                                        <p className="text-[13px] leading-5 text-foreground">
                                                            {verificationResult.recommendedAction}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                                                <div className="rounded-md border border-border bg-card p-6 flex flex-col min-h-[140px]">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[13px] font-medium text-foreground/60 flex items-center gap-1.5">
                                                            Confidence <HelpCircle className="size-3.5 text-foreground/30" />
                                                        </span>
                                                        <button className="text-foreground/30 hover:text-foreground"><MoreHorizontal className="size-4" /></button>
                                                    </div>
                                                    <div className="text-[28px] font-medium tracking-tight text-foreground flex items-baseline gap-2">
                                                        70.5%
                                                        <span className="text-[10px] font-semibold text-red-500 tracking-normal flex items-center">
                                                            <ArrowRight className="size-2.5 mr-0.5 rotate-45" /> 3.6%
                                                        </span>
                                                    </div>
                                                    <div className="mt-auto h-[70px] w-[calc(100%+32px)] -ml-4 flex items-end">
                                                        <svg viewBox="0 0 100 40" className="w-full h-full overflow-hidden rounded-b-lg" preserveAspectRatio="none">
                                                            <path d="M0 40 L0 10 L10 10 L20 30 L30 40 L40 20 L50 30 L60 10 L70 30 L80 10 L90 25 L100 40 L0 40 Z" fill="#0f52ff" fillOpacity="0.1" />
                                                            <path d="M0 10 L10 10 L20 30 L30 40 L40 20 L50 30 L60 10 L70 30 L80 10 L90 25 L100 40" fill="none" stroke="#0f52ff" strokeWidth="1.5" />
                                                            <path d="M0 10 L100 10" fill="none" stroke="#000000" strokeOpacity="0.03" strokeWidth="0.5" />
                                                            <path d="M0 20 L100 20" fill="none" stroke="#000000" strokeOpacity="0.03" strokeWidth="0.5" />
                                                            <path d="M0 30 L100 30" fill="none" stroke="#000000" strokeOpacity="0.03" strokeWidth="0.5" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <DropdownMenu key={i}>
                                                        <DropdownMenuTrigger className="rounded-md border border-border bg-muted/50 hover:bg-muted/50 transition-colors p-6 flex flex-col min-h-[140px] items-center justify-center outline-none">
                                                            <div className="text-foreground/20 font-light text-4xl leading-none">+</div>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="w-56 bg-card border border-border rounded-md p-0">
                                                            <div className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-foreground/50 border-b border-border">
                                                                Add metric <button className="text-foreground/40 hover:text-foreground"><Plus className="size-3.5 rotate-45" /></button>
                                                            </div>
                                                            <DropdownMenuItem className="text-[13px] text-foreground px-3 py-2.5 rounded-none cursor-pointer hover:bg-muted">Encrypted Requests Rate</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-[13px] text-foreground px-3 py-2.5 rounded-none cursor-pointer bg-muted">Encrypted Bandwidth</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-[13px] text-foreground px-3 py-2.5 rounded-none cursor-pointer hover:bg-muted">Cache Rate</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-[13px] text-foreground px-3 py-2.5 rounded-none cursor-pointer hover:bg-muted">Total Bandwidth</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ))}
                                            </div>

                                            <div className="mb-8">
                                                <h2 className="text-lg font-semibold tracking-tight text-foreground mb-6">Verification Timeline</h2>
                                                <div className="relative pl-6 space-y-8 before:absolute before:inset-y-2 before:left-8 before:w-px before:bg-gradient-to-b before:from-[#0f52ff]/20 before:via-[#0f52ff]/10 before:to-transparent">
                                                    {(verificationResult.timeline.length > 0 ? verificationResult.timeline : VERIFICATION_STEPS.map((label, index) => ({
                                                        id: `fallback-${index}`,
                                                        label,
                                                        detail: index === VERIFICATION_STEPS.length - 1 ? `Verification completed with ${verificationResult.verdict}.` : "Completed in this verification run.",
                                                        status: index === VERIFICATION_STEPS.length - 1 ? "active" : "complete",
                                                    }))).map((step, idx) => {
                                                        const isComplete = step.status === "complete"
                                                        const isActive = step.status === "active"
                                                        return (
                                                            <div key={step.id} className="relative flex items-center justify-between gap-6 md:justify-normal md:odd:flex-row-reverse group is-active">
                                                                <div className={cn(
                                                                    "relative flex items-center justify-center size-9 rounded-full border-4 border-white shadow-[0_10px_22px_rgba(0,0,0,0.08)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2",
                                                                    isComplete
                                                                        ? "bg-[#0f52ff] text-[#F0EFE2] ring-4 ring-[#0f52ff]/10"
                                                                        : isActive
                                                                            ? "bg-[#d4af37] text-[#F0EFE2] ring-4 ring-[#d4af37]/15"
                                                                            : "bg-muted text-foreground/25"
                                                                )}>
                                                                    {isComplete ? <Check className="size-4" /> : isActive ? <CheckCircle2 className="size-4" /> : <div className="size-2.5 rounded-full bg-black/20" />}
                                                                </div>
                                                                <div className={cn(
                                                                    "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 md:p-6 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.04)] border backdrop-blur-sm transition-all duration-200",
                                                                    isComplete
                                                                        ? "border-[#c9d7ff] bg-gradient-to-br from-[#f7f9ff] to-white"
                                                                        : isActive
                                                                            ? "border-border bg-gradient-to-br from-[#fff8dd] to-[#fffdf4]"
                                                                            : "border-border bg-card"
                                                                )}>
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div>
                                                                            <div className={cn(
                                                                                "text-[11px] font-semibold uppercase tracking-[0.18em] mb-1",
                                                                                isComplete ? "text-[#0f52ff]" : isActive ? "text-[#8a6d1d]" : "text-foreground/35"
                                                                            )}>
                                                                                Step {String(idx + 1).padStart(2, "0")}
                                                                            </div>
                                                                            <h3 className={cn("font-semibold text-sm md:text-[15px]", isActive || isComplete ? "text-foreground" : "text-foreground/60")}>{step.label}</h3>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] shrink-0",
                                                                            isComplete
                                                                                ? "bg-[#eef3ff] text-[#0f52ff]"
                                                                                : isActive
                                                                                    ? "bg-[#fff1c9] text-[#8a6d1d]"
                                                                                    : "bg-muted text-foreground/35"
                                                                        )}>
                                                                            {isComplete ? "Done" : isActive ? "Now" : "Queued"}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs md:text-[13px] leading-6 text-foreground/55 mt-3">
                                                                        {step.detail}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                    {selectedAgentId && (
                        <AgentInspector id={selectedAgentId} onClose={() => setSelectedAgentId(null)} />
                    )}
                    {selectedExecutionNodeId && (
                        <ExecutionInspector id={selectedExecutionNodeId} onClose={() => setSelectedExecutionNodeId(null)} />
                    )}
                    <CommandPalette open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} />
                </main>
            </div>
        </InspectorProvider>
    )
}
