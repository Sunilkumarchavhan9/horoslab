"use client";

import { useState } from "react";

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

function badgeTone(role: MemberRole) {
  if (role === "owner") return "#4f93ff";
  if (role === "admin") return "#9b7bff";
  return "#14c38e";
}

function accessTone(access: AccessLevel) {
  if (access === "Full") return "#4f93ff";
  if (access === "Scoped") return "#f0b429";
  return "#8ce6c7";
}

function inviteTone(state: TeamInvite["state"]) {
  if (state === "accepted") return "#14c38e";
  if (state === "pending") return "#f0b429";
  return "#ff6d6d";
}

export function TeamSection({ workspaceName, ownerName, ownerEmail, plan = "Free" }: TeamSectionProps) {
  const [members] = useState<TeamMember[]>([
    {
      id: "owner",
      name: ownerName,
      email: ownerEmail,
      role: "owner",
      access: "Full",
      joined: "Apr 6, 2026",
      status: "active",
    },
  ]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [inviteAccess, setInviteAccess] = useState<AccessLevel>("Scoped");

  const canInvite = plan !== "Free";
  const activeMembers = members.filter((member) => member.status === "active").length;
  const pendingInvites = invites.filter((invite) => invite.state === "pending").length;
  const fullAccessMembers = members.filter((member) => member.access === "Full").length;
  const scopedMembers = members.filter((member) => member.access === "Scoped").length;

  function openInvite() {
    if (!canInvite) {
      setShowUpgradeHint(true);
      return;
    }
    setShowInviteModal(true);
  }

  function createInvite() {
    const email = inviteEmail.trim();
    if (!email) return;

    const record: TeamInvite = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      role: inviteRole,
      access: inviteAccess,
      sentAt: "Just now",
      state: "pending",
    };
    setInvites((current) => [record, ...current]);
    setInviteEmail("");
    setInviteRole("member");
    setInviteAccess("Scoped");
    setShowInviteModal(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Team</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Manage team members, invitation flow, and workspace access controls for {workspaceName}.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={openInvite}
            className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff]"
          >
            + INVITE MEMBER
          </button>

          {showUpgradeHint ? (
            <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[290px] rounded-[8px] border border-white/12 bg-[#1a1a1a] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
              <p className="text-[13px] font-semibold text-white/86">Team invites need Scale or Enterprise</p>
              <p className="mt-1 text-[12px] leading-6 text-white/54">
                You are currently on Free. Upgrade in Billing to enable workspace invites.
              </p>
              <button
                type="button"
                onClick={() => setShowUpgradeHint(false)}
                className="mt-2 rounded-[7px] border border-white/10 bg-[#111111] px-2.5 py-1 text-[11px] text-white/60"
              >
                CLOSE
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#14c38e", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Active members</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{activeMembers}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#f0b429", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Pending invites</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{pendingInvites}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#4f93ff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Full-access members</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{fullAccessMembers}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#9b7bff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Scoped members</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{scopedMembers}</p>
        </div>
      </div>

      <div className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="4" cy="3.5" r="2" /><path d="M1 10a3 3 0 016 0" /><circle cx="8.5" cy="3.5" r="1.5" /><path d="M7 10a2.5 2.5 0 014 0" />
            </svg>
            Members
          </p>

          <div className="mt-3 overflow-x-auto rounded-[10px] border border-white/10 bg-[#121212]">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-white/34">
                  <th className="px-3 py-2.5">Member</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Access</th>
                  <th className="px-3 py-2.5">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {members.map((member) => (
                  <tr key={member.id} className="text-[12px]">
                    <td className="px-3 py-3">
                      <p className="font-semibold tracking-[-0.02em] text-white/84">{member.name}</p>
                      <p className="mt-0.5 text-white/42">{member.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: `${badgeTone(member.role)}55`,
                          color: badgeTone(member.role),
                          background: `${badgeTone(member.role)}12`,
                        }}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: `${accessTone(member.access)}55`,
                          color: accessTone(member.access),
                          background: `${accessTone(member.access)}12`,
                        }}
                      >
                        {member.access}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-white/62">{member.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.5 1L2 3v3c0 2.5 1.5 4 3.5 4.5C7.5 10 9 8.5 9 6V3L5.5 1z" />
              </svg>
              Access Snapshot
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {[
                ["Workspace", workspaceName],
                ["Plan", plan],
                ["Owner", ownerName],
                ["Invite policy", canInvite ? "Enabled" : "Upgrade required"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-white/34">{label}</p>
                  <p className="mt-1 text-[14px] font-semibold tracking-[-0.02em]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="2.5" width="9" height="6.5" rx="1" /><path d="M1 4l4.5 3L10 4" />
              </svg>
              Invitations
            </p>
            {invites.length === 0 ? (
              <div className="mt-2.5 rounded-[8px] border border-dashed border-white/12 bg-[#101010] px-5 py-5 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/28">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="6.5" r="3.5" />
                    <path d="M2 18a6 6 0 0112 0" />
                    <path d="M15.5 8.5v5M13 11h5" />
                  </svg>
                </div>
                <p className="mt-2.5 text-[12px] font-medium text-white/56">No invites yet</p>
                <p className="mt-1 text-[11px] text-white/34">Use Invite Member to add collaborators.</p>
              </div>
            ) : (
              <div className="mt-2.5 space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold tracking-[-0.02em]">{invite.email}</p>
                      <span
                        className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: `${inviteTone(invite.state)}55`,
                          color: inviteTone(invite.state),
                          background: `${inviteTone(invite.state)}12`,
                        }}
                      >
                        {invite.state}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/44">
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
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-[12px] border border-white/12 bg-[#1c1c1c] shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div>
                <h2 className="text-[24px] font-semibold tracking-[-0.04em]">Invite Team Member</h2>
                <p className="mt-1 text-[13px] text-white/48">Grant role and access scope for workspace collaboration.</p>
              </div>
              <button type="button" onClick={() => setShowInviteModal(false)} className="text-[18px] text-white/38">
                ×
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/38">Email</p>
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="teammate@company.com"
                  className="mt-1.5 w-full rounded-[8px] border border-white/12 bg-[#111111] px-3 py-2.5 text-[13px] outline-none ring-[#4f93ff]/45 focus:ring-1"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/38">Role</p>
                  <div className="mt-1.5 flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#101010]">
                    {(["owner", "admin", "member"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`flex-1 px-2.5 py-2 text-[11px] font-medium transition ${
                          inviteRole === role ? "bg-[#1f1f1f] text-white" : "text-white/42"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/38">Access</p>
                  <div className="mt-1.5 flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#101010]">
                    {(["Full", "Scoped", "Read"] as const).map((access) => (
                      <button
                        key={access}
                        type="button"
                        onClick={() => setInviteAccess(access)}
                        className={`flex-1 px-2.5 py-2 text-[11px] font-medium transition ${
                          inviteAccess === access ? "bg-[#1f1f1f] text-white" : "text-white/42"
                        }`}
                      >
                        {access}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/62"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={createInvite}
                disabled={!inviteEmail.trim()}
                className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff] disabled:cursor-not-allowed disabled:opacity-45"
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
