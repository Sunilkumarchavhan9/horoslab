"use client";

import { useMemo, useState } from "react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { GitHubBrandIcon } from "@/components/continuity-lab/connector-brand-icons";
import { MemoryosLogoMark } from "@/components/continuity-lab/memoryos-logo-mark";
import { resolveGitHubInstallationUrl } from "@/lib/continuity-lab/github-installation-url";
import { cn } from "@/lib/utils";

type WorkspaceStep = "join" | "create" | "manage";

export function ContinuityLabWorkspaceOnboarding() {
  const { connector, refresh } = useContinuityLab();
  const github = connector.payload.github;
  const [step, setStep] = useState<WorkspaceStep>(github.connected ? "create" : "join");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = github.profile;
  const displayName = profile?.login ?? "Sunilkumarchavhan9";
  const connectedName = profile?.name ?? "Sunil Kumar Chavhan";
  const avatarUrl = profile?.avatarUrl;
  const githubManageUrl = useMemo(
    () => resolveGitHubInstallationUrl(),
    [],
  );

  async function connectGithub() {
    setError(null);
    setLoading(true);
    try {
      window.open(githubManageUrl, "_blank", "noopener,noreferrer");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect GitHub.");
      setLoading(false);
    }
  }

  async function refreshAndCreate() {
    await refresh().catch(() => undefined);
    setStep("create");
  }

  if (step === "join") {
    return (
      <WorkspaceFrame>
        <div className="flex w-full max-w-[500px] flex-col items-center text-center">
          <MemoryosLogoMark className="mb-9 text-[#F0EFE2]/12" size={58} variant="mark" />
          <h1 className="text-[20px] font-semibold leading-7 text-[#F0EFE2]">Join MemoryOS workspace</h1>
          <p className="mt-3 max-w-[430px] text-[14px] font-medium leading-6 text-[#F0EFE2]/50">
            There are no workspaces connected to a GitHub organization you have access to
          </p>
          <button
            type="button"
            onClick={() => void refreshAndCreate()}
            className="mt-8 h-[35px] w-full rounded-md border border-white/[0.1] bg-white/[0.07] px-4 text-[14px] font-semibold text-[#F0EFE2] transition hover:bg-white/[0.11]"
          >
            Create workspace
          </button>
        </div>
      </WorkspaceFrame>
    );
  }

  if (step === "manage") {
    return (
      <WorkspaceFrame>
        <div className="flex w-full max-w-[436px] flex-col items-center text-center">
          <MemoryosLogoMark className="mb-9 text-[#F0EFE2]/12" size={58} variant="mark" />
          <h1 className="text-[20px] font-semibold text-[#F0EFE2]">Manage on GitHub</h1>
          <OrgRow className="mt-8" avatarUrl={avatarUrl} title={displayName} subtitle={`Connected to ${connectedName}`} />
          <p className="mt-6 text-left text-base leading-6 text-[#F0EFE2]/55">
            You&apos;ll be taken to GitHub to manage the MemoryOS app installation for this
            organization.
          </p>
          <p className="mt-5 text-left text-base leading-6 text-[#F0EFE2]/55">
            From there you can disconnect the app to unlink it from its current MemoryOS workspace.{" "}
            <span className="text-sky-400">Learn more</span>
          </p>
          <div className="mt-6 w-full overflow-hidden rounded-md border border-red-500/30 bg-[#121820] text-left">
            <div className="border-b border-red-500/30 px-3 py-2 text-[10px] font-semibold text-red-400">
              Danger zone
            </div>
            <div className="space-y-2 px-3 py-2 text-[9px] text-[#F0EFE2]/55">
              <p>Suspend your installation <span className="float-right rounded bg-red-500/20 px-2 py-0.5 text-red-300">Suspend</span></p>
              <p>Uninstall MemoryOS Integration <span className="float-right rounded bg-red-500/20 px-2 py-0.5 text-red-300">Uninstall</span></p>
            </div>
          </div>
          <p className="mt-4 text-base font-semibold text-[#F0EFE2]">Note: make sure to Uninstall, not Suspend</p>
          <a
            href={githubManageUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-11 inline-flex h-9 w-full items-center justify-center gap-3 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <GitHubBrandIcon className="size-4 text-black" />
            Open GitHub
          </a>
          <button type="button" onClick={() => setStep("create")} className={secondaryButtonClass}>
            Back
          </button>
        </div>
      </WorkspaceFrame>
    );
  }

  return (
    <WorkspaceFrame>
      <div className="flex w-full max-w-[448px] flex-col items-center text-center">
          <MemoryosLogoMark className="mb-9 text-[#F0EFE2]/12" size={58} variant="mark" />
        <h1 className="text-[20px] font-semibold text-[#F0EFE2]">Create workspace</h1>
        <p className="mt-3 text-[14px] text-[#F0EFE2]/50">
          Connect a GitHub org to your new MemoryOS workspace
        </p>

        {github.connected ? (
          <>
            <OrgRow
              className="mt-8"
              avatarUrl={avatarUrl}
              title={displayName}
              action={
                <button
                  type="button"
                  onClick={() => setStep("manage")}
                  className="text-sm font-medium text-[#F0EFE2]/60 hover:text-[#F0EFE2]"
                >
                  Manage
                </button>
              }
            />
            <p className="mt-5 text-left text-sm leading-5 text-[#F0EFE2]/50">
              These GitHub organizations are already connected to a MemoryOS workspace.
              Disconnect from GitHub before linking them to a new workspace.{" "}
              <span className="text-sky-400">Learn more</span>
            </p>
          </>
        ) : null}

        <div className="mt-10 flex w-full items-center gap-4 text-xs font-semibold text-[#F0EFE2]/45">
          <span className="h-px flex-1 bg-white/[0.08]" />
          OR
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void connectGithub()}
          className="mt-8 inline-flex h-9 w-full items-center justify-center gap-3 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
        >
          <GitHubBrandIcon className="size-4 text-black" />
          {loading ? "Redirecting..." : "Connect GitHub organization"}
        </button>
        <button type="button" onClick={() => setStep("join")} className={secondaryButtonClass}>
          Back
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-5 text-sm font-semibold text-[#F0EFE2]/45 hover:text-[#F0EFE2]/70"
        >
          Skip for now
        </button>
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-[500px] rounded-md border border-white/[0.08] bg-[#202020] p-7 shadow-2xl">
            <h2 className="text-2xl font-semibold text-[#F0EFE2]">Are you sure?</h2>
            <p className="mt-3 text-base font-medium text-[#F0EFE2]/50">
              To try MemoryOS for free, you&apos;ll need to connect GitHub.
            </p>
            <div className="mt-7 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="h-9 rounded-md border border-white/[0.12] bg-white/[0.06] px-4 text-sm font-semibold text-[#F0EFE2] hover:bg-white/[0.1]"
              >
                I&apos;ll do it later
              </button>
              <button
                type="button"
                onClick={() => void connectGithub()}
                className="h-9 rounded-md bg-white px-4 text-sm font-semibold text-black hover:bg-white/90"
              >
                Connect GitHub
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </WorkspaceFrame>
  );
}

function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-48px)] w-full items-center justify-center px-5 py-16">
      {children}
    </div>
  );
}

function OrgRow({
  avatarUrl,
  title,
  subtitle,
  action,
  className,
}: {
  avatarUrl?: string | null;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[58px] w-full items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.06] px-5 text-left",
        className,
      )}
    >
      <span className="relative flex size-6 shrink-0 overflow-hidden rounded-full bg-white/10">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="m-auto text-[10px] font-semibold text-[#F0EFE2]/60">
            {title.slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#F0EFE2]">{title}</span>
        {subtitle ? <span className="block truncate text-sm text-[#F0EFE2]/50">{subtitle}</span> : null}
      </span>
      {action ? <span className="shrink-0">{action}</span> : null}
      {action ? <span className="text-sm text-[#F0EFE2]/45">?</span> : null}
    </div>
  );
}

const secondaryButtonClass =
  "mt-3 h-9 w-full rounded-md border border-white/[0.1] bg-white/[0.06] px-4 text-sm font-semibold text-[#F0EFE2] transition hover:bg-white/[0.1]";
