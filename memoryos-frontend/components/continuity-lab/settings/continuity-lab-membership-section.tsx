"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import {
  ContinuityLabSettingsSectionFrame,
} from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsSearchInput,
  SettingsSelectDropdown,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import { consoleApiFetch } from "@/lib/console-api";
import type { BillingPlan } from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

type TeamRole = "owner" | "admin" | "member";
type TeamAccess = "Full" | "Scoped" | "Read";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  access: TeamAccess;
  joined: string;
  status: "active" | "invited";
};

type TeamInvite = {
  id: string;
  email: string;
  role: TeamRole;
  access: TeamAccess;
  sentAt: string;
  state: "pending" | "accepted" | "expired";
};

type TeamSnapshot = {
  workspaceName: string;
  plan: BillingPlan;
  members: TeamMember[];
  invites: TeamInvite[];
};

type LoadState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: string };

type MembershipTab = "users" | "join-requests";

const roleOptions: { value: TeamRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

const inviteRoleOptions: { value: Exclude<TeamRole, "owner">; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

const accessOptions: { value: TeamAccess; label: string }[] = [
  { value: "Full", label: "Full access" },
  { value: "Scoped", label: "Scoped access" },
  { value: "Read", label: "Read only" },
];

function loadingState<T>(): LoadState<T> {
  return { status: "loading", data: null, error: null };
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Backend request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

async function fetchTeamSnapshot(): Promise<TeamSnapshot> {
  return readJsonResponse<TeamSnapshot>(await consoleApiFetch("/api/memory/team"));
}

async function createTeamInvite(input: {
  email: string;
  role: Exclude<TeamRole, "owner">;
  access: TeamAccess;
}): Promise<{ invite: TeamInvite; invites: TeamInvite[] }> {
  return readJsonResponse<{ invite: TeamInvite; invites: TeamInvite[] }>(
    await consoleApiFetch("/api/memory/team/invites", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatRole(role: TeamRole): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

function formatStatus(status: TeamMember["status"]): string {
  return status === "active" ? "Active" : "Invited";
}

function formatInviteState(state: TeamInvite["state"]): string {
  if (state === "pending") return "Pending";
  if (state === "accepted") return "Accepted";
  return "Expired";
}

function isGeneratedOwner(member: TeamMember): boolean {
  return (
    member.id === "owner" &&
    member.name === "Workspace Owner" &&
    member.email.endsWith("@memoryos.local")
  );
}

function useDisplayedMembers(members: TeamMember[]): TeamMember[] {
  const { user } = useUser();

  return useMemo(() => {
    const name =
      user?.fullName?.trim() ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.username ||
      "Workspace Owner";
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      null;

    return members.map((member) => {
      if (!isGeneratedOwner(member)) return member;
      return {
        ...member,
        name,
        email: email ?? member.email,
        role: "admin",
      };
    });
  }, [members, user]);
}

function memberMatchesQuery(member: TeamMember, query: string): boolean {
  if (!query) return true;
  const haystack = [
    member.name,
    member.email,
    member.role,
    member.access,
    member.status,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function inviteMatchesQuery(invite: TeamInvite, query: string): boolean {
  if (!query) return true;
  const haystack = [invite.email, invite.role, invite.access, invite.state]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function MembershipTabs({
  active,
  users,
  joinRequests,
  onChange,
}: {
  active: MembershipTab;
  users: number;
  joinRequests: number;
  onChange: (tab: MembershipTab) => void;
}) {
  const tabs: { id: MembershipTab; label: string; count: number }[] = [
    { id: "users", label: "Users", count: users },
    { id: "join-requests", label: "Join requests", count: joinRequests },
  ];

  return (
    <div className="inline-flex items-center gap-1">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold transition",
              selected
                ? "bg-white/[0.08] text-white"
                : "text-white/48 hover:bg-white/[0.04] hover:text-white/75",
            )}
          >
            <span>{tab.label}</span>
            <span className="ml-1.5 tabular-nums text-white/42">{tab.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="overflow-hidden rounded-md border border-white/[0.08] bg-[#171717]">
      <div className="grid grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_180px_64px] border-b border-white/[0.08] bg-white/[0.04] text-sm">
        {["Name", "Email", "Role", ""].map((column) => (
          <div key={column} className="px-4 py-3 font-semibold text-white/80">
            {column}
          </div>
        ))}
      </div>
      <div className="px-4 py-8 text-sm text-white/45">Loading membership...</div>
    </div>
  );
}

function MemberAvatar({ name }: { name: string }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "M";
  return (
    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-[10px] font-bold text-white">
      {initial}
    </span>
  );
}

function EmptyMembershipTable({
  activeTab,
  search,
}: {
  activeTab: MembershipTab;
  search: string;
}) {
  const columns =
    activeTab === "users" ? ["Name", "Email", "Role", ""] : ["Email", "Role", "Access", "Status", "Sent"];
  const message = search.trim()
    ? `No ${activeTab === "users" ? "members" : "join requests"} match "${search.trim()}".`
    : activeTab === "users"
      ? "No members returned by backend."
      : "No join requests yet.";

  return (
    <div className="overflow-hidden rounded-md border border-white/[0.08] bg-[#171717]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.04]">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold text-white/80">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="px-4 py-10 text-center text-white/45">
              {message}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function MembersTable({ members }: { members: TeamMember[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-white/[0.08] bg-[#171717]">
      <table className="w-full min-w-[760px] table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.04]">
            <th className="w-[34%] px-4 py-3 font-semibold text-white">
              <span className="inline-flex items-center gap-1">
                Name <ArrowUp className="size-3 text-white/65" aria-hidden />
              </span>
            </th>
            <th className="w-[34%] px-4 py-3 font-semibold text-white">Email</th>
            <th className="w-[22%] px-4 py-3 font-semibold text-white">Role</th>
            <th className="w-[10%] px-4 py-3 text-right font-semibold text-white" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-t border-white/[0.06]">
              <td className="px-4 py-4">
                <div className="flex min-w-0 items-center gap-2">
                  <MemberAvatar name={member.name} />
                  <span className="min-w-0 truncate font-medium text-white/68">
                    {member.name}
                  </span>
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      member.status === "active" ? "bg-teal-400" : "bg-white/30",
                    )}
                    title={formatStatus(member.status)}
                  />
                </div>
              </td>
              <td className="min-w-0 px-4 py-4 text-white/68">
                <span className="block truncate">{member.email}</span>
              </td>
              <td className="px-4 py-4">
                <SettingsSelectDropdown
                  value={member.role}
                  onChange={() => undefined}
                  options={roleOptions}
                  disabled
                  className="max-w-[180px]"
                />
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  type="button"
                  disabled
                  className="inline-flex size-8 items-center justify-center rounded-md text-white/25"
                  aria-label={`Remove ${member.name}`}
                  title="Member removal is not available yet"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JoinRequestsTable({ invites }: { invites: TeamInvite[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-white/[0.08] bg-[#171717]">
      <table className="w-full min-w-[760px] table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.04]">
            <th className="w-[34%] px-4 py-3 font-semibold text-white">Email</th>
            <th className="w-[18%] px-4 py-3 font-semibold text-white">Role</th>
            <th className="w-[18%] px-4 py-3 font-semibold text-white">Access</th>
            <th className="w-[16%] px-4 py-3 font-semibold text-white">Status</th>
            <th className="w-[14%] px-4 py-3 font-semibold text-white">Sent</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr key={invite.id} className="border-t border-white/[0.06]">
              <td className="min-w-0 px-4 py-4 text-white/72">
                <span className="block truncate">{invite.email}</span>
              </td>
              <td className="px-4 py-4 text-white/60">{formatRole(invite.role)}</td>
              <td className="px-4 py-4 text-white/60">{invite.access}</td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "inline-flex rounded-md px-2 py-1 text-xs font-medium",
                    invite.state === "pending"
                      ? "bg-amber-500/10 text-amber-200"
                      : invite.state === "accepted"
                        ? "bg-emerald-500/10 text-emerald-200"
                        : "bg-white/[0.06] text-white/45",
                  )}
                >
                  {formatInviteState(invite.state)}
                </span>
              </td>
              <td className="px-4 py-4 text-white/50">{formatDate(invite.sentAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvitePanel({
  onCancel,
  onInviteCreated,
}: {
  onCancel: () => void;
  onInviteCreated: (invites: TeamInvite[]) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<TeamRole, "owner">>("member");
  const [access, setAccess] = useState<TeamAccess>("Full");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = email.trim().includes("@") && !saving;

  async function submitInvite() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const result = await createTeamInvite({
        email: email.trim().toLowerCase(),
        role,
        access,
      });
      onInviteCreated(result.invites);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-white/[0.08] bg-[#171717] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Add member</h2>
          <p className="mt-1 text-xs text-white/45">Invite a teammate to this organization.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white"
          aria-label="Close invite form"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto] md:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/55">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@company.com"
            className="h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/55">Role</span>
          <SettingsSelectDropdown
            value={role}
            onChange={setRole}
            options={inviteRoleOptions}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/55">Access</span>
          <SettingsSelectDropdown value={access} onChange={setAccess} options={accessOptions} />
        </label>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void submitInvite()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-3.5 text-sm font-semibold text-[#0A0A0A] transition hover:bg-white/90 disabled:opacity-40"
        >
          <Check className="size-4" aria-hidden />
          {saving ? "Sending" : "Send"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

export function ContinuityLabMembershipSection() {
  const [state, setState] = useState<LoadState<TeamSnapshot>>(loadingState);
  const [activeTab, setActiveTab] = useState<MembershipTab>("users");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const loadTeamSnapshot = useCallback(async () => fetchTeamSnapshot(), []);

  useEffect(() => {
    let cancelled = false;
    void loadTeamSnapshot()
      .then((team) => {
        if (!cancelled) setState({ status: "ready", data: team, error: null });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "Could not load membership.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadTeamSnapshot]);

  const members = useDisplayedMembers(state.data?.members ?? []);
  const pendingInvites = (state.data?.invites ?? []).filter((invite) => invite.state === "pending");
  const query = search.trim().toLowerCase();
  const filteredMembers = useMemo(
    () => members.filter((member) => memberMatchesQuery(member, query)),
    [members, query],
  );
  const filteredInvites = useMemo(
    () => pendingInvites.filter((invite) => inviteMatchesQuery(invite, query)),
    [pendingInvites, query],
  );

  const addMemberDisabled = state.status !== "ready";

  async function updateInvites(invites: TeamInvite[]) {
    if (state.status !== "ready") return;
    setState({
      status: "ready",
      data: {
        ...state.data,
        invites,
      },
      error: null,
    });
    setActiveTab("join-requests");
    try {
      const team = await loadTeamSnapshot();
      setState({ status: "ready", data: team, error: null });
    } catch {
      // Keep the optimistic update if the refetch fails.
    }
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="membership"
      breadcrumb={[
        { label: "Settings", href: "/continuity-lab/settings" },
        { label: "Membership" },
      ]}
      descriptionOverride="Organization members and join requests."
      contentClassName="max-w-6xl"
    >
      <Link
        href="/continuity-lab/settings/general"
        className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white/75"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to organization
      </Link>

      <div className="space-y-4 pt-2">
        <SettingsToolbar className="justify-between">
          <MembershipTabs
            active={activeTab}
            users={members.length}
            joinRequests={pendingInvites.length}
            onChange={setActiveTab}
          />
        </SettingsToolbar>

        <SettingsToolbar className="justify-between">
          <SettingsSearchInput
            value={search}
            onChange={setSearch}
            placeholder={activeTab === "users" ? "Search for a member" : "Search join requests"}
            className="max-w-xl"
          />
          <button
            type="button"
            disabled={addMemberDisabled}
            onClick={() => setInviteOpen(true)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-semibold transition",
              addMemberDisabled
                ? "cursor-not-allowed bg-white/55 text-[#0A0A0A]/70"
                : "bg-white text-[#0A0A0A] hover:bg-white/90",
            )}
            title="Invite a member"
          >
            <UserPlus className="size-4" aria-hidden />
            Add member
          </button>
        </SettingsToolbar>

      {inviteOpen && !addMemberDisabled ? (
        <InvitePanel onCancel={() => setInviteOpen(false)} onInviteCreated={updateInvites} />
      ) : null}

        {state.status === "loading" ? <LoadingTable /> : null}
        {state.status === "error" ? (
          <div className="rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </div>
        ) : null}
        {state.status === "ready" && activeTab === "users" && filteredMembers.length > 0 ? (
          <MembersTable members={filteredMembers} />
        ) : null}
        {state.status === "ready" && activeTab === "join-requests" && filteredInvites.length > 0 ? (
          <JoinRequestsTable invites={filteredInvites} />
        ) : null}
        {state.status === "ready" &&
        ((activeTab === "users" && filteredMembers.length === 0) ||
          (activeTab === "join-requests" && filteredInvites.length === 0)) ? (
          <EmptyMembershipTable activeTab={activeTab} search={search} />
        ) : null}
      </div>
    </ContinuityLabSettingsSectionFrame>
  );
}
