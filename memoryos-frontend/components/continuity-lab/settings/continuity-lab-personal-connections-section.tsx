"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Laptop } from "lucide-react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { SettingsIntegrationIcon } from "@/components/continuity-lab/connector-brand-icons";
import { McpBrandIcon } from "@/components/continuity-lab/brand-icons/mcp-brand-registry";
import {
  ContinuityLabSettingsSectionFrame,
} from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsFlatPanel,
  SettingsSecondaryButton,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import {
  authorizeConnector,
  disconnectConnector,
} from "@/lib/continuity-lab/connector-actions";
import {
  CONNECTIONS_SETTINGS_PATH,
  connectionsSettingsHref,
} from "@/lib/continuity-lab/connections-settings-urls";
import { useMcpCatalog } from "@/lib/continuity-lab/use-mcp-catalog";
import { cn } from "@/lib/utils";

const ORG_CONNECTIONS_HREF = CONNECTIONS_SETTINGS_PATH;
const ORG_MCP_HREF = connectionsSettingsHref({ tab: "mcps" });

export function ContinuityLabPersonalConnectionsSection() {
  const { connector, refresh } = useContinuityLab();
  const github = connector.payload.github;
  const [action, setAction] = useState<"github-connect" | "github-unlink" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [desktopMsg, setDesktopMsg] = useState<string | null>(null);

  const { entries: mcpEntries } = useMcpCatalog();
  const installedMcps = useMemo(
    () => mcpEntries.filter((entry) => entry.installed),
    [mcpEntries],
  );

  const refetchGithub = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refetchGithub();
  }, [refetchGithub]);

  async function connectGitHub() {
    setActionError(null);
    setAction("github-connect");
    try {
      await authorizeConnector("github");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not connect GitHub.");
      setAction(null);
    }
  }

  async function unlinkGitHub() {
    setActionError(null);
    setAction("github-unlink");
    try {
      await disconnectConnector("github");
      await refetchGithub();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not unlink GitHub.");
    } finally {
      setAction(null);
    }
  }

  const githubLogin = github.profile?.login;
  const githubConnected = github.connected;

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="personal-connections"
      breadcrumb={[
        { label: "Settings", href: "/continuity-lab/settings" },
        { label: "Connections" },
      ]}
      titleOverride="Connections"
      descriptionOverride="Connect your personal accounts to use integrations and MCPs established by your team."
    >
      <SettingsCard
        title="Connections"
        description="Connect your personal accounts to use integrations and MCPs established by your team members"
      >
        <SettingsFlatPanel>
          <PersonalConnectionRow
            icon={
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-[#0A0A0A] text-[#F0EFE2]/70">
                <Laptop className="size-4" aria-hidden />
              </span>
            }
            title="MemoryOS Desktop"
            description="Link MemoryOS Desktop with this account"
            action={
              <SettingsSecondaryButton
                onClick={() => {
                  setDesktopMsg(
                    "MemoryOS Desktop pairing is not available in the browser yet. Use Continuity Lab in the web app until the desktop client ships.",
                  );
                }}
              >
                Log in to MemoryOS Desktop
              </SettingsSecondaryButton>
            }
            footer={desktopMsg}
          />
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard
        title="Integrations"
        description="Connect your personal accounts to use team-enabled integrations"
      >
        <SettingsFlatPanel>
          <PersonalConnectionRow
            icon={<SettingsIntegrationIcon id="github" className="size-5" />}
            title="GitHub"
            description={
              githubConnected && githubLogin
                ? `Connected as @${githubLogin}`
                : "Connect your GitHub account for agent sessions and review"
            }
            action={
              githubConnected ? (
                <button
                  type="button"
                  disabled={action !== null}
                  onClick={() => void unlinkGitHub()}
                  className="text-sm font-semibold text-red-400 transition hover:text-red-300 disabled:opacity-50"
                >
                  {action === "github-unlink" ? "Unlinking…" : "Unlink user"}
                </button>
              ) : (
                <SettingsSecondaryButton
                  disabled={action !== null}
                  onClick={() => void connectGitHub()}
                >
                  {action === "github-connect" ? "Redirecting…" : "Connect GitHub"}
                </SettingsSecondaryButton>
              )
            }
            footer={actionError}
          />
        </SettingsFlatPanel>
        <p className="text-xs text-[#F0EFE2]/40">
          <Link
            href={ORG_CONNECTIONS_HREF}
            className="font-medium text-indigo-300/90 hover:text-indigo-200"
          >
            Missing an Integration?
          </Link>
        </p>
      </SettingsCard>

      <SettingsCard
        title="MCP"
        description="Connect your personal accounts to use team-enabled MCPs"
      >
        {installedMcps.length === 0 ? (
          <div className={cn(subtlePanel(), "px-4 py-8 text-center text-sm text-[#F0EFE2]/45")}>
            No MCPs
          </div>
        ) : (
          <SettingsFlatPanel>
            <ul className="divide-y divide-white/[0.06]">
              {installedMcps.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-[#0A0A0A]">
                    <McpBrandIcon
                      id={entry.id}
                      className="size-4"
                      fallbackLabel={entry.iconLabel ?? entry.name.slice(0, 2).toUpperCase()}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#F0EFE2]">{entry.name}</p>
                    <p className="text-xs text-[#F0EFE2]/45">Installed in this browser</p>
                  </div>
                </li>
              ))}
            </ul>
          </SettingsFlatPanel>
        )}
        <p className="text-xs text-[#F0EFE2]/40">
          Personal MCP installs are stored locally until server-side MCP accounts ship.{" "}
          <Link
            href={ORG_MCP_HREF}
            className="font-medium text-indigo-300/90 hover:text-indigo-200"
          >
            Missing an MCP?
          </Link>
        </p>
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}

function PersonalConnectionRow({
  icon,
  title,
  description,
  action,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  footer?: string | null;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#F0EFE2]">{title}</p>
            <p className="mt-0.5 text-xs text-[#F0EFE2]/45">{description}</p>
          </div>
        </div>
        <div className="shrink-0 sm:pl-2">{action}</div>
      </div>
      {footer ? (
        <p className="mt-2 text-xs text-amber-200/80 sm:pl-12">{footer}</p>
      ) : null}
    </div>
  );
}
