"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
 ArrowUpDown,
 Loader2,
 MoreHorizontal,
 Plus,
 Search,
 Settings,
 Shield,
 UserPlus,
 X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { consoleApiFetch } from "@/lib/console-api";
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
 role: Exclude<TeamRole, "owner">;
 access: TeamAccess;
 sentAt: string;
 state: "pending" | "accepted" | "expired";
};

type TeamSnapshot = {
 workspaceName: string;
 plan: string;
 members: TeamMember[];
 invites: TeamInvite[];
};

type LoadState<T> =
 | { status: "loading"; data: null; error: null }
 | { status: "ready"; data: T; error: null }
 | { status: "error"; data: null; error: string };

type InviteState = {
 email: string;
 role: Exclude<TeamRole, "owner">;
 access: TeamAccess;
};

const INVITE_ROLE_OPTIONS: { value: Exclude<TeamRole, "owner">; label: string }[] = [
 { value: "admin", label: "Admin" },
 { value: "member", label: "Member" },
];

const ACCESS_OPTIONS: { value: TeamAccess; label: string }[] = [
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
 return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatRole(role: TeamRole): string {
 if (role === "owner") return "Owner";
 if (role === "admin") return "Admin";
 return "Member";
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

function matchMember(member: TeamMember, query: string): boolean {
 if (!query) return true;
 return [member.name, member.email, member.role, member.access, member.status]
 .join(" ")
 .toLowerCase()
 .includes(query);
}

function matchInvite(invite: TeamInvite, query: string): boolean {
 if (!query) return true;
 return [invite.email, invite.role, invite.access, invite.state]
 .join(" ")
 .toLowerCase()
 .includes(query);
}

function MetricCard({
 label,
 value,
 detail,
}: {
 label: string;
 value: string | number;
 detail: string;
}) {
 return (
 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="text-[12px] font-medium text-foreground/45">{label}</div>
 <div className="mt-2 text-[28px] font-semibold tracking-tight text-foreground">{value}</div>
 <div className="mt-1 text-[12.5px] leading-5 text-foreground/50">{detail}</div>
 </div>
 );
}

function InviteComposer({
 onClose,
 onInviteCreated,
}: {
 onClose: () => void;
 onInviteCreated: (invites: TeamInvite[]) => void;
}) {
 const [form, setForm] = useState<InviteState>({
 email: "",
 role: "member",
 access: "Full",
 });
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const canSubmit = form.email.trim().includes("@") && !saving;

 async function submit() {
 if (!canSubmit) return;
 setSaving(true);
 setError(null);
 try {
 const result = await createTeamInvite({
 email: form.email.trim().toLowerCase(),
 role: form.role,
 access: form.access,
 });
 onInviteCreated(result.invites);
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : "Could not create invite.");
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="rounded-md border border-border bg-card p-6 ">
 <div className="flex items-start justify-between gap-3">
 <div>
 <div className="text-sm font-semibold text-foreground">Invite member</div>
 <p className="mt-1 text-sm text-foreground/55">
 Add a teammate to this workspace through the live team backend.
 </p>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="inline-flex size-8 items-center justify-center rounded-md text-foreground/45 hover:bg-accent hover:text-foreground"
 aria-label="Close invite form"
 >
 <X className="size-4" />
 </button>
 </div>

 <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_160px_160px_auto] md:items-end">
 <label className="block">
 <span className="mb-1.5 block text-xs font-medium text-foreground/45">Email</span>
 <Input
 type="email"
 value={form.email}
 onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
 placeholder="teammate@company.com"
 className="h-10 rounded-md border-border bg-card"
 />
 </label>
 <label className="block">
 <span className="mb-1.5 block text-xs font-medium text-foreground/45">Role</span>
 <select
 value={form.role}
 onChange={(event) =>
 setForm((prev) => ({ ...prev, role: event.target.value as InviteState["role"] }))
 }
 className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none"
 >
 {INVITE_ROLE_OPTIONS.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>
 <label className="block">
 <span className="mb-1.5 block text-xs font-medium text-foreground/45">Access</span>
 <select
 value={form.access}
 onChange={(event) =>
 setForm((prev) => ({ ...prev, access: event.target.value as InviteState["access"] }))
 }
 className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none"
 >
 {ACCESS_OPTIONS.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>
 <Button
 type="button"
 disabled={!canSubmit}
 onClick={() => void submit()}
 className="h-10 gap-2 rounded-md bg-[#0f52ff] px-6 font-semibold text-white shadow-[0_10px_24px_rgba(15,82,255,0.18)] hover:bg-[#0a45e0]"
 >
 <UserPlus className="size-4" />
 {saving ? "Sending" : "Send invite"}
 </Button>
 </div>
 {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
 </div>
 );
}

export function AccountMembers() {
 const [state, setState] = useState<LoadState<TeamSnapshot>>(loadingState);
 const [search, setSearch] = useState("");
 const [inviteOpen, setInviteOpen] = useState(false);
 const [activeTab, setActiveTab] = useState<"members" | "invites">("members");

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
 error: error instanceof Error ? error.message : "Could not load members.",
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
 () => members.filter((member) => matchMember(member, query)),
 [members, query],
 );
 const filteredInvites = useMemo(
 () => pendingInvites.filter((invite) => matchInvite(invite, query)),
 [pendingInvites, query],
 );

 const activeMembers = members.filter((member) => member.status === "active").length;

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
 setActiveTab("invites");
 try {
 const team = await loadTeamSnapshot();
 setState({ status: "ready", data: team, error: null });
 } catch {
 // Keep the optimistic update if the refetch fails.
 }
 }

 return (
 <div className="w-full flex flex-col pt-2 font-sans">
 <div className="flex items-center gap-2 mb-5 px-2 text-[14px]">
 <Settings className="size-4 text-muted-foreground" />
 <span className="text-muted-foreground font-medium">Manage account</span>
 <span className="text-[#aaa]">&gt;</span>
 <span className="text-foreground font-semibold">Members</span>
 </div>

 <div className="grid gap-6 px-2 md:grid-cols-3">
 <MetricCard
 label="Workspace"
 value={state.data?.workspaceName ?? "Loading"}
 detail="Live workspace name from the team backend."
 />
 <MetricCard
 label="Members"
 value={activeMembers}
 detail="Active members synced from the live team snapshot."
 />
 <MetricCard
 label="Pending invites"
 value={pendingInvites.length}
 detail="Invite creation is backed by the server."
 />
 </div>

 <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-2">
 <div className="inline-flex items-center rounded-md border border-border bg-muted p-1">
 {[
 { id: "members" as const, label: "All members" },
 { id: "invites" as const, label: "Invites" },
 ].map((tab) => (
 <button
 key={tab.id}
 type="button"
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "rounded-md px-6 py-2 text-[13px] font-medium transition-colors",
 activeTab === tab.id
 ? "bg-card text-foreground "
 : "text-foreground/55 hover:text-foreground",
 )}
 >
 {tab.label}
 </button>
 ))}
 </div>

 <div className="flex items-center gap-3">
 <div className="relative w-[260px] max-w-full">
 <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/35" />
 <Input
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 placeholder={activeTab === "members" ? "Search members..." : "Search invites..."}
 className="h-10 rounded-md border-border bg-card pl-9"
 />
 </div>
 <Button
 type="button"
 onClick={() => setInviteOpen((value) => !value)}
 className="mission-control-invite-button h-10 gap-2 px-6 text-[14px] font-semibold "
 >
 <Plus className="size-4" />
 Invite member
 </Button>
 </div>
 </div>

 {inviteOpen ? (
 <div className="px-2 pt-4">
 <InviteComposer
 onClose={() => setInviteOpen(false)}
 onInviteCreated={updateInvites}
 />
 </div>
 ) : null}

 {state.status === "loading" ? (
 <div className="mx-2 mt-4 rounded-md border border-border bg-card px-6 py-8 text-center text-foreground/45 ">
 <Loader2 className="mx-auto mb-3 size-5 animate-spin text-foreground/35" />
 Loading live team snapshot...
 </div>
 ) : null}

 {state.status === "error" ? (
 <div className="mx-2 mt-4 rounded-md border border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">
 {state.error}
 </div>
 ) : null}

 {state.status === "ready" && activeTab === "members" ? (
 <div className="w-full overflow-hidden border border-border bg-card rounded-md mx-2 mt-4 ">
 <table className="w-full text-left border-collapse min-w-[860px]">
 <thead className="border-b border-border bg-muted/50">
 <tr>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">
 <div className="flex items-center gap-1.5">
 Member <ArrowUpDown className="size-3 opacity-50" />
 </div>
 </th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Role</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Access</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Joined</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Status</th>
 <th className="px-6 py-3 w-10"></th>
 </tr>
 </thead>
 <tbody>
 {filteredMembers.length > 0 ? (
 filteredMembers.map((member) => (
 <tr key={member.id} className="border-b border-border last:border-0 hover:bg-black/[0.015]">
 <td className="px-6 py-6">
 <div className="flex items-center gap-3">
 <div className="size-9 rounded-full bg-black/[0.04] flex items-center justify-center text-[12px] font-semibold text-foreground/70">
 {member.name.slice(0, 1).toUpperCase()}
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <span className="truncate text-[13.5px] font-medium text-foreground">
 {member.name}
 </span>
 {member.role === "owner" ? (
 <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0f52ff]">
 <Shield className="size-3" />
 Owner
 </span>
 ) : null}
 </div>
 <div className="truncate text-[12.5px] text-foreground/45">{member.email}</div>
 </div>
 </div>
 </td>
 <td className="px-6 py-6 text-[13px] text-foreground/80">{formatRole(member.role)}</td>
 <td className="px-6 py-6 text-[13px] text-foreground/80">{member.access}</td>
 <td className="px-6 py-6 text-[13px] text-foreground/55">{formatDate(member.joined)}</td>
 <td className="px-6 py-6">
 <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700">
 <span className="size-1.5 rounded-full bg-emerald-500" />
 {member.status === "active" ? "Active" : "Invited"}
 </div>
 </td>
 <td className="px-6 py-6">
 <Button
 variant="ghost"
 size="sm"
 className="h-8 w-8 p-0 text-foreground/40 hover:text-foreground"
 type="button"
 disabled
 >
 <MoreHorizontal className="size-4" />
 </Button>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-6 py-12 text-center text-foreground/45">
 No members matched &quot;{search.trim()}&quot;.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 ) : null}

 {state.status === "ready" && activeTab === "invites" ? (
 <div className="w-full overflow-hidden border border-border bg-card rounded-md mx-2 mt-4 ">
 <table className="w-full text-left border-collapse min-w-[760px]">
 <thead className="border-b border-border bg-muted/50">
 <tr>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Email</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Role</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Access</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Status</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Sent</th>
 </tr>
 </thead>
 <tbody>
 {filteredInvites.length > 0 ? (
 filteredInvites.map((invite) => (
 <tr key={invite.id} className="border-b border-border last:border-0 hover:bg-black/[0.015]">
 <td className="px-6 py-6 text-[13.5px] text-foreground">{invite.email}</td>
 <td className="px-6 py-6 text-[13px] text-foreground/80">{formatRole(invite.role)}</td>
 <td className="px-6 py-6 text-[13px] text-foreground/80">{invite.access}</td>
 <td className="px-6 py-6">
 <span
 className={cn(
 "inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium",
 invite.state === "pending"
 ? "bg-amber-50 text-amber-700"
 : invite.state === "accepted"
 ? "bg-emerald-50 text-emerald-700"
 : "bg-black/[0.05] text-foreground/45",
 )}
 >
 {formatInviteState(invite.state)}
 </span>
 </td>
 <td className="px-6 py-6 text-[13px] text-foreground/55">{formatDate(invite.sentAt)}</td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-6 py-12 text-center text-foreground/45">
 No invites matched &quot;{search.trim()}&quot;.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 ) : null}
 </div>
 );
}
