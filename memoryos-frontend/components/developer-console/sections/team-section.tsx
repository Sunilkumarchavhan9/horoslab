"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import {
  INTEL_LINE_CELL,
  IntelLineGridFrame,
  IntelPageStack,
  IntelSectionGutter,
  IntelTileGrid,
  intelPanelBleed,
  intelSectionRootClass,
  IntelSectionScroll,
  OverviewChartRow,
} from "@/components/developer-console/intel-line-grid";
import {
  IntelligenceBreadcrumb,
  IntelligenceDataTable,
  IntelligenceEntityHeader,
  IntelligenceFlowChart,
  IntelligenceGhostButton,
  IntelligenceStatusBadge,
  IntelligenceWorkspace,
  type IntelChartPoint,
  type IntelTableRow,
} from "@/components/developer-console/os-intelligence-shell";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import { cn } from "@/lib/utils";

type TeamPlan = "Free" | "Pro" | "Scale" | "Enterprise";
type MemberRole = "owner" | "admin" | "member";
type AccessLevel = "Full" | "Scoped" | "Read";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  access: AccessLevel;
  joined: string;
  status: "active" | "invited";
};

type TeamInvite = {
  id: string;
  email: string;
  role: MemberRole;
  access: AccessLevel;
  sentAt: string;
  state: "pending" | "accepted" | "expired";
};

type TeamSectionProps = {
  workspaceName: string;
  ownerName: string;
  ownerEmail: string;
  plan?: TeamPlan;
  realtimeVersion?: number;
};

function buildTeamChartSeries(activeMembers: number, pendingInvites: number): IntelChartPoint[] {
  const labels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "Now"];
  return labels.map((label, index) => ({
    label,
    retrieval: Math.max(0, Math.round((pendingInvites * (index + 1)) / labels.length)),
    memory: Math.max(1, activeMembers),
  }));
}

function formatJoined(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function accessTone(access: AccessLevel): IntelTableRow["sourceTone"] {
  if (access === "Full") return "cyan";
  if (access === "Scoped") return "amber";
  return "slate";
}

function inviteStateTone(state: TeamInvite["state"]): IntelTableRow["sourceTone"] {
  if (state === "pending") return "amber";
  if (state === "accepted") return "cyan";
  return "rose";
}

export function TeamSection({
  workspaceName,
  ownerName,
  ownerEmail,
  plan = "Free",
  realtimeVersion = 0,
}: TeamSectionProps) {
  const didLoadRef = useRef(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [workspaceLabel, setWorkspaceLabel] = useState(workspaceName);
  const [planLabel, setPlanLabel] = useState<TeamPlan>(plan);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [inviteAccess, setInviteAccess] = useState<AccessLevel>("Scoped");
  const [chartRange, setChartRange] = useState("All");

  const canInvite = planLabel !== "Free";
  const activeMembers = members.filter((member) => member.status === "active").length;
  const pendingInvites = invites.filter((invite) => invite.state === "pending").length;
  const fullAccessMembers = members.filter((member) => member.access === "Full").length;
  const scopedMembers = members.filter((member) => member.access === "Scoped").length;

  const loadTeam = useCallback(async (): Promise<void> => {
    const token = await getOrCreateMemoryToken();
    if (!token) {
      setErrorMessage("Missing auth token. Sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const response = await fetch("/api/memory/team", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          workspaceName?: string;
          plan?: TeamPlan;
          members?: TeamMember[];
          invites?: TeamInvite[];
          error?: string;
        }
      | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? `Failed to load team (${response.status})`);
    }
    const dedupedMembers = Array.from(
      new Map((payload?.members ?? []).map((member) => [member.id, member])).values(),
    );
    const dedupedInvites = Array.from(
      new Map((payload?.invites ?? []).map((invite) => [invite.id, invite])).values(),
    );
    setMembers(dedupedMembers);
    setInvites(dedupedInvites);
    setWorkspaceLabel(payload?.workspaceName ?? workspaceName);
    setPlanLabel(payload?.plan ?? plan);
    setLastUpdated(new Date().toISOString());
    setErrorMessage(null);
    setLoading(false);
  }, [workspaceName, plan]);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    void loadTeam().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load team.");
      setLoading(false);
    });
  }, [loadTeam]);

  useEffect(() => {
    if (realtimeVersion <= 0) return;
    void loadTeam().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load team.");
    });
  }, [realtimeVersion, loadTeam]);

  function openInvite() {
    if (!canInvite) {
      setShowUpgradeHint(true);
      return;
    }
    setShowInviteModal(true);
  }

  async function createInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    try {
      const token = await getOrCreateMemoryToken();
      if (!token) throw new Error("Missing auth token.");
      const response = await fetch("/api/memory/team/invites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role: inviteRole,
          access: inviteAccess,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { invite?: TeamInvite; invites?: TeamInvite[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Failed to create invite (${response.status})`);
      }
      const nextInvites = payload?.invites ?? (payload?.invite ? [payload.invite, ...invites] : invites);
      setInvites(Array.from(new Map(nextInvites.map((invite) => [invite.id, invite])).values()));
      setInviteEmail("");
      setInviteRole("member");
      setInviteAccess("Scoped");
      setShowInviteModal(false);
      setLastUpdated(new Date().toISOString());
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create invite.");
    }
  }

  const chartData = useMemo(
    () => buildTeamChartSeries(activeMembers, pendingInvites),
    [activeMembers, pendingInvites],
  );

  const memberRows: IntelTableRow[] = useMemo(
    () =>
      members.map((member, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: member.name,
        operator: member.role,
        detail: member.email,
        value: formatJoined(member.joined),
        source: member.access,
        sourceTone: accessTone(member.access),
      })),
    [members],
  );

  const inviteRows: IntelTableRow[] = useMemo(
    () =>
      invites.map((invite, index) => ({
        id: `#${String(index + 1).padStart(4, "0")}`,
        title: invite.email,
        operator: invite.role,
        detail: `${invite.access} access`,
        value: formatJoined(invite.sentAt),
        source: invite.state,
        sourceTone: inviteStateTone(invite.state),
      })),
    [invites],
  );

  const teamLive = activeMembers > 0 || !loading;

  return (
    <div className={intelSectionRootClass}>
      <IntelligenceWorkspace>
        <IntelligenceBreadcrumb
          items={["Dashboard", workspaceLabel, "Team"]}
          actions={
            <>
              <IntelligenceGhostButton loading={loading} onClick={() => void loadTeam()}>
                Refresh
              </IntelligenceGhostButton>
              <button
                type="button"
                onClick={openInvite}
                className="h-10 rounded-none bg-[#111827] px-4 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-45"
              >
                + Invite member
              </button>
            </>
          }
        />
        <IntelligenceEntityHeader
          icon={Users}
          title="Team"
          badge={
            <IntelligenceStatusBadge live={teamLive}>
              {activeMembers} active · {planLabel} plan
            </IntelligenceStatusBadge>
          }
          meta={
            <span className="max-w-3xl text-[#9CA3AF]">
              Workspace members, roles, and invites for {workspaceLabel} — owner {ownerName}
              {ownerEmail ? ` (${ownerEmail})` : ""}
            </span>
          }
        />

        <IntelSectionScroll>
        <div className={intelPanelBleed}>
          <IntelPageStack>
            {(errorMessage || showUpgradeHint) && (
              <>
                <div className={cn(INTEL_LINE_CELL, "space-y-2 py-4")}>
                  {errorMessage ? (
                    <p className="text-sm text-[#B91C1C]">{errorMessage}</p>
                  ) : null}
                  {showUpgradeHint ? (
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        Team invites need Scale or Enterprise
                      </p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        You are on {planLabel}. Upgrade in Billing to enable workspace invites.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowUpgradeHint(false)}
                        className="mt-2 h-9 rounded-none border border-[#E5E7EB] px-3 text-xs font-medium text-[#6B7280]"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : null}
                </div>
                <IntelSectionGutter />
              </>
            )}

            <IntelLineGridFrame flush>
              <IntelTileGrid variant="kpi">
                {[
                  ["Active members", activeMembers.toString(), "Signed-in workspace users"],
                  ["Pending invites", pendingInvites.toString(), "Awaiting acceptance"],
                  ["Full-access members", fullAccessMembers.toString(), "Unrestricted memory scope"],
                  ["Scoped members", scopedMembers.toString(), "Limited project scope"],
                ].map(([label, value, detail]) => (
                  <div key={label} className={INTEL_LINE_CELL}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                      {label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#111827]">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">{detail}</p>
                  </div>
                ))}
              </IntelTileGrid>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <OverviewChartRow>
                <div className={cn(INTEL_LINE_CELL, "overview-chart-cell min-w-0 p-0")}>
                  <IntelligenceFlowChart
                    embedded
                    title="Team growth signal"
                    subtitle={`Active members (${activeMembers}) vs pending invites (${pendingInvites}).`}
                    data={chartData}
                    range={chartRange}
                    onRangeChange={setChartRange}
                    emptyTitle="No team activity"
                    emptyDescription="Invite collaborators or add members to populate this chart."
                  />
                </div>
                <TeamAccessInsight
                  workspaceLabel={workspaceLabel}
                  planLabel={planLabel}
                  ownerName={ownerName}
                  canInvite={canInvite}
                  lastUpdated={lastUpdated}
                />
              </OverviewChartRow>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Members</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Roles and access scopes for this workspace.
                    </p>
                  </div>
                  <span className="border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
                    {members.length} listed
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <IntelligenceDataTable
                    lineGrid
                    rows={memberRows}
                    emptyMessage={
                      loading
                        ? "Loading members…"
                        : "No members returned from the backend."
                    }
                  />
                </div>
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />

            <IntelLineGridFrame flush>
              <div className={cn(INTEL_LINE_CELL, "space-y-0 p-0")}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Invitations</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Pending and historical invites sent from this workspace.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openInvite}
                    className="h-9 rounded-none border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#374151]"
                  >
                    {canInvite ? "Invite member" : "Upgrade to invite"}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <IntelligenceDataTable
                    lineGrid
                    rows={inviteRows}
                    emptyMessage={
                      loading
                        ? "Loading invitations…"
                        : "No invites yet. Use Invite member to add collaborators."
                    }
                  />
                </div>
              </div>
            </IntelLineGridFrame>

            <IntelSectionGutter />
          </IntelPageStack>
        </div>
        </IntelSectionScroll>
      </IntelligenceWorkspace>

      {showInviteModal ? <TeamInviteModal
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        inviteAccess={inviteAccess}
        setInviteAccess={setInviteAccess}
        onClose={() => setShowInviteModal(false)}
        onSubmit={() => void createInvite()}
      /> : null}
    </div>
  );
}

function TeamAccessInsight({
  workspaceLabel,
  planLabel,
  ownerName,
  canInvite,
  lastUpdated,
}: {
  workspaceLabel: string;
  planLabel: TeamPlan;
  ownerName: string;
  canInvite: boolean;
  lastUpdated: string;
}) {
  const cells = [
    ["Workspace", workspaceLabel],
    ["Plan", planLabel],
    ["Owner", ownerName],
    ["Invite policy", canInvite ? "Enabled" : "Upgrade required"],
  ] as const;

  return (
    <div className="overview-flow-insight flex min-h-[320px] min-w-0 flex-col bg-[#F3F4F6] text-[#111827]">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
          Access snapshot
        </p>
        <p className="mt-1 text-sm text-[#6B7280]">Workspace policy and ownership.</p>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-px bg-[#E5E7EB]">
        {cells.map(([label, value]) => (
          <div key={label} className="bg-white px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
              {label}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111827]">{value}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-[#E5E7EB] px-5 py-2.5 text-[11px] text-[#9CA3AF]">
        Last sync ·{" "}
        {lastUpdated === "-"
          ? "—"
          : new Date(lastUpdated).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
      </div>
    </div>
  );
}

function TeamInviteModal({
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteAccess,
  setInviteAccess,
  onClose,
  onSubmit,
}: {
  inviteEmail: string;
  setInviteEmail: (value: string) => void;
  inviteRole: MemberRole;
  setInviteRole: (value: MemberRole) => void;
  inviteAccess: AccessLevel;
  setInviteAccess: (value: AccessLevel) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xl overflow-hidden border border-[#E5E7EB] bg-white shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">Invite team member</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Grant role and access scope for workspace collaboration.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center border border-[#E5E7EB] text-[#6B7280]"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="block text-sm text-[#6B7280]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
              Email
            </span>
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="teammate@company.com"
              className="prody-input mt-2 h-11 w-full px-3 text-sm"
            />
          </label>

          <div className="grid gap-px bg-[#E5E7EB] sm:grid-cols-2">
            <RoleAccessPicker
              label="Role"
              options={["owner", "admin", "member"] as const}
              value={inviteRole}
              onChange={setInviteRole}
            />
            <RoleAccessPicker
              label="Access"
              options={["Full", "Scoped", "Read"] as const}
              value={inviteAccess}
              onChange={setInviteAccess}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-none border border-[#E5E7EB] px-4 text-xs font-medium text-[#6B7280]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!inviteEmail.trim()}
            className="h-10 rounded-none bg-[#111827] px-4 text-xs font-semibold text-white disabled:opacity-45"
          >
            Send invite
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleAccessPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={cn(INTEL_LINE_CELL, "py-4")}>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">{label}</p>
      <div className="mt-2 flex border border-[#E5E7EB]">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "flex-1 px-2 py-2 text-xs font-medium uppercase tracking-wide",
              value === option
                ? "bg-[#111827] text-white"
                : "bg-[#F9FAFB] text-[#6B7280] hover:text-[#111827]",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
