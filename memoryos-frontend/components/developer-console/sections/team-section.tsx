"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type TeamPlan = "Free" | "Scale" | "Enterprise";
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
};

function roleBadgeClass(role: MemberRole) {
  if (role === "owner") return "border-primary/40 bg-primary/10 text-primary";
  if (role === "admin") return "border-chart-4/40 bg-chart-4/10 text-chart-4";
  return "border-chart-2/40 bg-chart-2/10 text-chart-2";
}

function accessBadgeClass(access: AccessLevel) {
  if (access === "Full") return "border-primary/40 bg-primary/10 text-primary";
  if (access === "Scoped") return "border-chart-5/40 bg-chart-5/10 text-chart-5";
  return "border-chart-2/40 bg-chart-2/10 text-chart-2";
}

function inviteBadgeClass(state: TeamInvite["state"]) {
  if (state === "accepted") return "border-chart-2/40 bg-chart-2/10 text-chart-2";
  if (state === "pending") return "border-chart-5/40 bg-chart-5/10 text-chart-5";
  return "border-destructive/40 bg-destructive/10 text-destructive";
}

export function TeamSection({ workspaceName, ownerName, ownerEmail, plan = "Free" }: TeamSectionProps) {
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

  const canInvite = planLabel !== "Free";
  const activeMembers = members.filter((member) => member.status === "active").length;
  const pendingInvites = invites.filter((invite) => invite.state === "pending").length;
  const fullAccessMembers = members.filter((member) => member.access === "Full").length;
  const scopedMembers = members.filter((member) => member.access === "Scoped").length;

  async function loadTeam(): Promise<void> {
    const token = await getOrCreateMemoryToken();
    if (!token) {
      setErrorMessage("Missing auth token. Sign in again.");
      setLoading(false);
      return;
    }
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
    const dedupedMembers = Array.from(new Map((payload?.members ?? []).map((member) => [member.id, member])).values());
    const dedupedInvites = Array.from(new Map((payload?.invites ?? []).map((invite) => [invite.id, invite])).values());
    setMembers(dedupedMembers);
    setInvites(dedupedInvites);
    setWorkspaceLabel(payload?.workspaceName ?? workspaceName);
    setPlanLabel(payload?.plan ?? plan);
    setLastUpdated(new Date().toISOString());
    setErrorMessage(null);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadTeam();
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load team.");
          setLoading(false);
        }
      }
    })();
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          await loadTeam();
        } catch (error) {
          if (!cancelled) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to refresh team.");
          }
        }
      })();
    }, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

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

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold tracking-tighter sm:text-lg">Team</h1>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={openInvite}
            className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium tracking-wider text-primary"
          >
            + INVITE MEMBER
          </button>

          {showUpgradeHint ? (
            <div className="absolute right-0 top-full mt-2 z-20 w-72 rounded-md border border-border bg-card p-3">
              <p className="text-sm font-semibold text-foreground">Team invites need Scale or Enterprise</p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                You are currently on Free. Upgrade in Billing to enable workspace invites.
              </p>
              <button
                type="button"
                onClick={() => setShowUpgradeHint(false)}
                className="mt-2 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
              >
                CLOSE
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border border-t-2 border-t-chart-2 bg-card px-3.5 py-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Active members</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{activeMembers}</p>
        </div>
        <div className="rounded-lg border border-border border-t-2 border-t-chart-5 bg-card px-3.5 py-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Pending invites</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{pendingInvites}</p>
        </div>
        <div className="rounded-lg border border-border border-t-2 border-t-primary bg-card px-3.5 py-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Full-access members</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{fullAccessMembers}</p>
        </div>
        <div className="rounded-lg border border-border border-t-2 border-t-chart-4 bg-card px-3.5 py-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Scoped members</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{scopedMembers}</p>
        </div>
      </div>

      <div className="mt-2.5 grid gap-3 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-card px-4 py-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="4" cy="3.5" r="2" /><path d="M1 10a3 3 0 016 0" /><circle cx="8.5" cy="3.5" r="1.5" /><path d="M7 10a2.5 2.5 0 014 0" />
            </svg>
            Members
          </p>

          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted/40">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2.5">Member</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Access</th>
                  <th className="px-3 py-2.5">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.id} className="text-xs">
                    <td className="px-3 py-3">
                      <p className="font-semibold tracking-tight text-foreground">{member.name}</p>
                      <p className="mt-0.5 text-muted-foreground">{member.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs uppercase tracking-widest ${roleBadgeClass(member.role)}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs uppercase tracking-widest ${accessBadgeClass(member.access)}`}
                      >
                        {member.access}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{member.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.5 1L2 3v3c0 2.5 1.5 4 3.5 4.5C7.5 10 9 8.5 9 6V3L5.5 1z" />
              </svg>
              Access Snapshot
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {[
                ["Workspace", workspaceLabel],
                ["Plan", planLabel],
                ["Owner", ownerName],
                ["Invite policy", canInvite ? "Enabled" : "Upgrade required"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-muted/50 px-3 py-2.5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold tracking-tight">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="2.5" width="9" height="6.5" rx="1" /><path d="M1 4l4.5 3L10 4" />
              </svg>
              Invitations
            </p>
            {invites.length === 0 ? (
              <div className="mt-2.5 rounded-md border border-dashed border-border bg-muted px-5 py-5 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="6.5" r="3.5" />
                    <path d="M2 18a6 6 0 0112 0" />
                    <path d="M15.5 8.5v5M13 11h5" />
                  </svg>
                </div>
                <p className="mt-2.5 text-xs font-medium text-muted-foreground">No invites yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Use Invite Member to add collaborators.</p>
              </div>
            ) : (
              <div className="mt-2.5 space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded-md border border-border bg-muted/50 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold tracking-tight">{invite.email}</p>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs uppercase tracking-widest ${inviteBadgeClass(invite.state)}`}
                      >
                        {invite.state}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {invite.role} · {invite.access} · {invite.sentAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInviteModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-popover">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tighter">Invite Team Member</h2>
                <p className="mt-1 text-sm text-muted-foreground">Grant role and access scope for workspace collaboration.</p>
              </div>
              <button type="button" onClick={() => setShowInviteModal(false)} className="text-lg text-muted-foreground">
                ×
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Email</p>
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="teammate@company.com"
                  className="mt-1.5 w-full rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm outline-none ring-primary/45 focus:ring-1"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Role</p>
                  <div className="mt-1.5 flex items-center overflow-hidden rounded-md border border-border bg-muted">
                    {(["owner", "admin", "member"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`flex-1 px-2.5 py-2 text-xs font-medium transition ${
                          inviteRole === role ? "bg-muted text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Access</p>
                  <div className="mt-1.5 flex items-center overflow-hidden rounded-md border border-border bg-muted">
                    {(["Full", "Scoped", "Read"] as const).map((access) => (
                      <button
                        key={access}
                        type="button"
                        onClick={() => setInviteAccess(access)}
                        className={`flex-1 px-2.5 py-2 text-xs font-medium transition ${
                          inviteAccess === access ? "bg-muted text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {access}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium tracking-wider text-muted-foreground"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={createInvite}
                disabled={!inviteEmail.trim()}
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium tracking-wider text-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                SEND INVITE
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
