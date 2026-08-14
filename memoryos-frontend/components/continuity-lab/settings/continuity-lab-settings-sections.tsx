"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Info, MoreHorizontal, UploadCloud, X } from "lucide-react";
import {
  ContinuityLabSettingsSectionFrame,
} from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsEmptyTable,
  SettingsFlatPanel,
  SettingsPrimaryButton,
  SettingsSearchInput,
  SettingsSecondaryButton,
  SettingsSelectDropdown,
  SettingsTabPills,
  SettingsToolbar,
  SettingsToggle,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import { consoleApiFetch } from "@/lib/console-api";
import { usagePercent } from "@/lib/billing-usage";
import {
  addLabEnvironmentBlueprintSecretToApi,
  fetchLabEnvironmentSettingsFromApi,
  importLabEnvironmentBlueprintSecretsToApi,
  type LabEnvironmentSettingsResponse,
} from "@/lib/continuity-lab/lab-environment-settings-api";
import {
  repoBlueprintSettingsPath,
  type LabEnvironmentBlueprintSecret,
  type LabEnvironmentBlueprintSecretType,
} from "@/lib/continuity-lab/lab-environment-settings-storage";
import {
  fetchLabPlaybooks,
  type LabPlaybook,
  type LabPlaybookScope,
} from "@/lib/continuity-lab/lab-playbooks-api";
import {
  fetchRepoIndexStatuses,
  type RepoIndexStatus,
} from "@/lib/continuity-lab/wiki-api";
import {
  findSettingsNavItem,
  settingsSectionDescription,
  settingsSectionTitle,
  type SettingsSectionId,
} from "@/lib/continuity-lab/settings-nav";
import { PLAN_CATALOG, formatLimit, type BillingPlan } from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

const ConnectionsSettingsSection = dynamic(
  () =>
    import("@/components/continuity-lab/settings/connections-settings-ui").then(
      (m) => m.ConnectionsSettingsSection,
    ),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgGeneralSection = dynamic(
  () =>
    import("@/components/continuity-lab/settings/continuity-lab-org-general-section").then(
      (m) => m.ContinuityLabOrgGeneralSection,
    ),
  { ssr: false, loading: () => null },
);

const ContinuityLabPersonalConnectionsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-personal-connections-section"
    ).then((m) => m.ContinuityLabPersonalConnectionsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabPreferencesSection = dynamic(
  () =>
    import("@/components/continuity-lab/settings/continuity-lab-preferences-section").then(
      (m) => m.ContinuityLabPreferencesSection,
    ),
  { ssr: false, loading: () => null },
);

const ContinuityLabSettingsSessionsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-settings-sessions-section"
    ).then((m) => m.ContinuityLabSettingsSessionsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgAgentSettingsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-agent-settings-section"
    ).then((m) => m.ContinuityLabOrgAgentSettingsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgReviewSettingsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-review-settings-section"
    ).then((m) => m.ContinuityLabOrgReviewSettingsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgWikiSettingsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-wiki-settings-section"
    ).then((m) => m.ContinuityLabOrgWikiSettingsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgSchedulesSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-schedules-section"
    ).then((m) => m.ContinuityLabOrgSchedulesSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgDesktopSettingsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-desktop-settings-section"
    ).then((m) => m.ContinuityLabOrgDesktopSettingsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgShellIntegrationSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-shell-integration-section"
    ).then((m) => m.ContinuityLabOrgShellIntegrationSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgSkillsRulesSettingsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-skills-rules-settings-section"
    ).then((m) => m.ContinuityLabOrgSkillsRulesSettingsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgEnvironmentSettingsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-environment-settings-section"
    ).then((m) => m.ContinuityLabOrgEnvironmentSettingsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabOrgKnowledgeSettingsSection = dynamic(
  () =>
    import(
      "@/components/continuity-lab/settings/continuity-lab-org-knowledge-settings-section"
    ).then((m) => m.ContinuityLabOrgKnowledgeSettingsSection),
  { ssr: false, loading: () => null },
);

const ContinuityLabMembershipSection = dynamic(
  () =>
    import("@/components/continuity-lab/settings/continuity-lab-membership-section").then(
      (m) => m.ContinuityLabMembershipSection,
    ),
  { ssr: false, loading: () => null },
);

const ContinuityLabMemoryOSApiSection = dynamic(
  () =>
    import("@/components/continuity-lab/settings/continuity-lab-memoryos-api-section").then(
      (m) => m.ContinuityLabMemoryOSApiSection,
    ),
  { ssr: false, loading: () => null },
);

const ContinuityLabAnalyticsSection = dynamic(
  () =>
    import("@/components/continuity-lab/settings/continuity-lab-analytics-section").then(
      (m) => m.ContinuityLabAnalyticsSection,
    ),
  { ssr: false, loading: () => null },
);

type BillingInvoice = {
  id: string;
  amountCents: number;
  currency: string;
  status: "paid" | "open" | "void";
  issuedAt: string;
  hostedInvoiceUrl: string | null;
};

type BillingEvent = {
  id: string;
  provider: "polar" | "custom";
  type: string;
  status: "processed" | "skipped" | "failed";
  summary: string;
  createdAt: string;
};

type BillingSnapshot = {
  workspaceName: string;
  currentPlan: BillingPlan;
  usage: {
    tokenLimit: number;
    tokenUsed: number;
    searchLimit: number;
    searchUsed: number;
    resetInDays: number;
  };
  seats?: {
    activeMembers: number;
    pendingInvites: number;
    seatLimit: number | null;
  };
  connectorSyncUsage?: {
    used: number;
    limit: number | null;
  };
  invoices: BillingInvoice[];
  events?: BillingEvent[];
  checkout?: {
    configured: boolean;
    provider: "polar" | "custom";
    portalUrl?: string | null;
  };
};

type LoadState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: string };

function loadingState<T>(): LoadState<T> {
  return { status: "loading", data: null, error: null };
}

async function fetchBackendJson<T>(path: string): Promise<T> {
  const res = await consoleApiFetch(path);
  const payload = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Backend request failed (${res.status})`;
    throw new Error(message);
  }
  return payload as T;
}

function formatBackendDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

function StatRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/85">{label}</p>
        {detail ? <p className="mt-0.5 text-xs text-white/40">{detail}</p> : null}
      </div>
      <p className="shrink-0 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function BackendStatus({
  loading,
  error,
}: {
  loading: boolean;
  error?: string | null;
}) {
  if (loading) return <p className="text-sm text-white/45">Loading from backend...</p>;
  if (error) return <p className="text-sm text-red-300">{error}</p>;
  return null;
}

function SimpleTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-white/[0.08] bg-[#171717]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.04]">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2.5 text-xs font-semibold text-white/80">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function SimpleCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("border-t border-white/[0.06] px-4 py-3 text-white/65", className)}>{children}</td>;
}

export function ContinuityLabSettingsSection({ sectionId }: { sectionId: SettingsSectionId }) {
  switch (sectionId) {
    case "general":
      return <ContinuityLabOrgGeneralSection />;
    case "personal-connections":
      return <ContinuityLabPersonalConnectionsSection />;
    case "connections":
      return <ConnectionsSettingsSection />;
    case "sessions":
      return <ContinuityLabSettingsSessionsSection />;
    case "continuity-lab":
      return <ContinuityLabOrgAgentSettingsSection />;
    case "review":
      return <ContinuityLabOrgReviewSettingsSection />;
    case "wiki":
      return <ContinuityLabOrgWikiSettingsSection />;
    case "schedules":
      return <ContinuityLabOrgSchedulesSection />;
    case "memoryos-desktop":
      return <ContinuityLabOrgDesktopSettingsSection />;
    case "shell-integration":
      return <ContinuityLabOrgShellIntegrationSection />;
    case "automations":
      return <ProductLinkSection sectionId={sectionId} />;
    case "knowledge":
      return <ContinuityLabOrgKnowledgeSettingsSection />;
    case "playbooks":
      return <PlaybooksSection />;
    case "environment":
      return <ContinuityLabOrgEnvironmentSettingsSection />;
    case "secrets":
      return <SecretsSection />;
    case "memoryos-api":
      return <ContinuityLabMemoryOSApiSection />;
    case "repositories":
      return <RepositoriesSection />;
    case "analytics":
      return <ContinuityLabAnalyticsSection />;
    case "plans":
    case "invoices":
    case "usage":
      return <BillingBackendSection sectionId={sectionId} />;
    case "preferences":
      return <ContinuityLabPreferencesSection />;
    case "skills-rules":
      return <ContinuityLabOrgSkillsRulesSettingsSection />;
    case "membership":
      return <ContinuityLabMembershipSection />;
    default:
      return <BackendUnavailableSection sectionId={sectionId} />;
  }
}

function ProductLinkSection({
  sectionId,
}: {
  sectionId: "automations";
}) {
  const copy = {
    automations: {
      title: "Automations",
      description: "Workflow templates and scheduled agent runs (beta).",
      href: "/continuity-lab/automations",
      cta: "Open Automations",
    },
  }[sectionId];

  return (
    <ContinuityLabSettingsSectionFrame sectionId={sectionId}>
      <SettingsCard title={copy.title} description={copy.description}>
        <Link
          href={copy.href}
          className="inline-flex border border-[#4338CA] bg-[#4338CA]/20 px-3 py-1.5 text-sm font-semibold text-indigo-100 hover:bg-[#4338CA]/30"
        >
          {copy.cta}
        </Link>
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}

function PlaybooksSection() {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<LabPlaybookScope>("organization");
  const [state, setState] = useState<LoadState<{
    organization: LabPlaybook[];
    system: LabPlaybook[];
  }>>(loadingState);

  useEffect(() => {
    let cancelled = false;
    void fetchLabPlaybooks().then((response) => {
      if (cancelled) return;
      if (!response) {
        setState({
          status: "error",
          data: null,
          error: "Could not load playbooks from backend.",
        });
        return;
      }
      setState({ status: "ready", data: response.playbooks, error: null });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state.data?.[scope] ?? []).filter((row) => {
      const haystack = [row.name, row.macro ?? "", row.content, row.createdBy].join(" ").toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [state.data, scope, search]);

  const orgCount = state.data?.organization.length ?? 0;
  const systemCount = state.data?.system.length ?? 0;

  return (
    <ContinuityLabSettingsSectionFrame sectionId="playbooks" contentClassName="max-w-5xl">
      <SettingsToolbar className="mb-4 justify-between">
        <SettingsTabPills
          tabs={[
            { id: "organization" as const, label: "Organization", count: orgCount },
            { id: "system" as const, label: "System", count: systemCount },
          ]}
          active={scope}
          onChange={setScope}
        />
        <SettingsPrimaryButton href="/continuity-lab/settings/playbooks/create" variant="blue">
          Create playbook
        </SettingsPrimaryButton>
      </SettingsToolbar>
      <SettingsToolbar className="mb-4">
        <SettingsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search playbooks..."
          className="max-w-md"
        />
      </SettingsToolbar>
      <BackendStatus loading={state.status === "loading"} error={state.error} />
      {state.status === "ready" && rows.length > 0 ? (
        <SimpleTable columns={["Name", "Macro", "Created by", "Last updated"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <SimpleCell className="font-medium text-white">
                <Link
                  href={`/continuity-lab/settings/playbooks/${encodeURIComponent(row.id)}`}
                  className="hover:text-[#93C5FD]"
                >
                  {row.name}
                </Link>
              </SimpleCell>
              <SimpleCell className="font-mono text-xs">{row.macro ?? "—"}</SimpleCell>
              <SimpleCell>{row.createdBy}</SimpleCell>
              <SimpleCell>{formatBackendDate(row.updatedAt)}</SimpleCell>
            </tr>
          ))}
        </SimpleTable>
      ) : state.status === "ready" ? (
        <SettingsEmptyTable
          columns={["Name", "Macro", "Created by", "Last updated"]}
          message={
            search.trim()
              ? `No playbooks match "${search.trim()}".`
              : scope === "organization"
                ? "No playbooks yet. Create a playbook to get started."
                : "No system playbooks returned by backend."
          }
          action={
            scope === "organization" ? (
              <SettingsPrimaryButton href="/continuity-lab/settings/playbooks/create" variant="blue">
                Create playbook
              </SettingsPrimaryButton>
            ) : null
          }
        />
      ) : null}
    </ContinuityLabSettingsSectionFrame>
  );
}

type SecretRow = LabEnvironmentBlueprintSecret & {
  scope: "organization";
  repo: null;
};

type SecretDrawerMode = "add" | "bulk" | null;

const secretNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
const secretInputClass =
  "h-9 w-full rounded-md border border-white/[0.08] bg-[#1F1F1F] px-3 text-sm text-white placeholder:text-white/35 focus:border-[#3B82F6] focus:outline-none";
const secretTextareaClass =
  "w-full resize-y rounded-md border border-white/[0.08] bg-[#1F1F1F] px-3 py-2 text-sm leading-relaxed text-white placeholder:text-white/35 focus:border-[#3B82F6] focus:outline-none";
const SECRET_TYPE_OPTIONS: { value: LabEnvironmentBlueprintSecretType; label: string }[] = [
  { value: "key-value", label: "Raw secret" },
  { value: "cookie", label: "Cookie" },
  { value: "totp", label: "One-Time Password (TOTP)" },
];

function isValidSecretName(name: string): boolean {
  return secretNamePattern.test(name.trim());
}

function formatSecretType(type: LabEnvironmentBlueprintSecretType): string {
  return SECRET_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Raw secret";
}

function secretRowsFromResponse(response: LabEnvironmentSettingsResponse): SecretRow[] {
  return response.settings.blueprintSecrets.map((secret) => ({
    ...secret,
    scope: "organization",
    repo: null,
  }));
}

function SecretsSection() {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"organization" | "personal">("organization");
  const [drawer, setDrawer] = useState<SecretDrawerMode>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [state, setState] = useState<LoadState<SecretRow[]>>(loadingState);

  useEffect(() => {
    let cancelled = false;
    void fetchLabEnvironmentSettingsFromApi().then((response) => {
      if (cancelled) return;
      if (!response) {
        setState({
          status: "error",
          data: null,
          error: "Could not load secrets from backend.",
        });
        return;
      }
      setState({ status: "ready", data: secretRowsFromResponse(response), error: null });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state.data ?? []).filter((row) => {
      if (scope === "personal") return false;
      const haystack = [row.name, row.note ?? "", row.scope, row.repo ?? ""].join(" ").toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [state.data, search, scope]);

  async function handleSingleSave(input: {
    type: LabEnvironmentBlueprintSecretType;
    name: string;
    value: string;
    note: string | null;
    redacted: boolean;
  }) {
    setActionError(null);
    const response = await addLabEnvironmentBlueprintSecretToApi(input);
    if (!response) {
      setActionError("Could not store secret.");
      return false;
    }
    setState({ status: "ready", data: secretRowsFromResponse(response), error: null });
    setDrawer(null);
    return true;
  }

  async function handleBulkSave(input: { text: string; redacted: boolean }) {
    setActionError(null);
    const response = await importLabEnvironmentBlueprintSecretsToApi(input);
    if (!response) {
      setActionError("Could not import secrets.");
      return false;
    }
    setState({ status: "ready", data: secretRowsFromResponse(response), error: null });
    setDrawer(null);
    return true;
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="secrets"
      descriptionOverride="Reference a secret with a dollar sign, e.g. $SERVICE_USERNAME."
      contentClassName="max-w-5xl"
    >
      <SettingsToolbar className="mb-4 justify-between">
        <SettingsTabPills
          tabs={[
            {
              id: "organization" as const,
              label: "Organization",
              count: state.data?.length ?? 0,
            },
            { id: "personal" as const, label: "Personal", count: 0 },
          ]}
          active={scope}
          onChange={setScope}
        />
        <div className="flex items-center gap-2">
          <SettingsSecondaryButton onClick={() => setDrawer("bulk")}>
            Bulk add secrets
          </SettingsSecondaryButton>
          <button
            type="button"
            onClick={() => setDrawer("add")}
            className="inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-white transition hover:bg-[#3B82F6]"
          >
            Add secret
          </button>
        </div>
      </SettingsToolbar>
      <SettingsToolbar className="mb-4">
        <SettingsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search secrets"
          className="max-w-md"
        />
      </SettingsToolbar>
      <BackendStatus loading={state.status === "loading"} error={state.error} />
      {actionError ? <p className="mb-3 text-sm text-red-300">{actionError}</p> : null}
      {state.status === "ready" && rows.length > 0 ? (
        <SimpleTable columns={["Name", "Type", "Note", "Updated by", "Updated at"]}>
          {rows.map((row) => (
            <tr key={`${row.scope}-${row.repo ?? "org"}-${row.id}`}>
              <SimpleCell className="font-mono text-xs text-white">{row.name}</SimpleCell>
              <SimpleCell>{formatSecretType(row.type)}</SimpleCell>
              <SimpleCell>{row.note ?? "—"}</SimpleCell>
              <SimpleCell>—</SimpleCell>
              <SimpleCell>{formatBackendDate(row.createdAt)}</SimpleCell>
            </tr>
          ))}
        </SimpleTable>
      ) : state.status === "ready" ? (
        <SettingsEmptyTable
          columns={["Name", "Type", "Note", "Updated by", "Updated at"]}
          message={
            search.trim()
              ? `No secrets match "${search.trim()}".`
              : scope === "organization"
                ? "No secrets found. Add your first secret to get started."
                : "No personal secrets found."
          }
        />
      ) : null}
      {drawer === "bulk" ? (
        <BulkSecretsDrawer
          onClose={() => setDrawer(null)}
          onSave={handleBulkSave}
        />
      ) : null}
      {drawer === "add" ? (
        <SingleSecretDrawer
          onClose={() => setDrawer(null)}
          onSave={handleSingleSave}
        />
      ) : null}
    </ContinuityLabSettingsSectionFrame>
  );
}

function SettingsSideDrawer({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-black/55"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <aside
        className="flex h-full w-full max-w-[620px] flex-col border-l border-white/[0.08] bg-[#101010] text-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-white/45">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white/45 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>
  );
}

function SingleSecretDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: {
    type: LabEnvironmentBlueprintSecretType;
    name: string;
    value: string;
    note: string | null;
    redacted: boolean;
  }) => Promise<boolean>;
}) {
  const [type, setType] = useState<LabEnvironmentBlueprintSecretType>("key-value");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [redacted, setRedacted] = useState(true);
  const [saving, setSaving] = useState(false);
  const nameValid = !name.trim() || isValidSecretName(name);
  const canSave = isValidSecretName(name) && value.trim() && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    const saved = await onSave({
      type,
      name: name.trim(),
      value,
      note: note.trim() || null,
      redacted,
    });
    if (!saved) setSaving(false);
  }

  return (
    <SettingsSideDrawer
      title="New organization secret"
      description="Available to all MemoryOS sessions in this organization."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="border-l-4 border-[#3B82F6] bg-white/[0.04] px-4 py-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-[#3B82F6]" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-white">Notice</p>
              <p className="mt-1 text-sm text-white/45">
                This secret applies to sessions started after it is created.
              </p>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white/85">Secret type</span>
          <SettingsSelectDropdown<LabEnvironmentBlueprintSecretType>
            value={type}
            onChange={setType}
            options={SECRET_TYPE_OPTIONS}
            className="max-w-[260px]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white/85">Secret name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="SERVICE_USERNAME"
            className={cn(secretInputClass, !nameValid && "border-red-400/60")}
          />
          {!nameValid ? (
            <p className="mt-1 text-xs text-red-300">Use letters, numbers, and underscores. Start with a letter or underscore.</p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white/85">Secret value</span>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={8}
            placeholder={
              type === "cookie"
                ? "Paste cookie value"
                : type === "totp"
                  ? "Paste TOTP secret"
                  : "Paste secret value"
            }
            className={secretTextareaClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white/85">Note</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Optional note"
            className={secretTextareaClass}
          />
        </label>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/85">Redact value</p>
            <p className="text-xs text-white/45">Hide the secret value in the control plane.</p>
          </div>
          <SettingsToggle checked={redacted} onChange={setRedacted} label="Redact value" />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void save()}
            className="inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-white transition hover:bg-[#3B82F6] disabled:opacity-40"
          >
            {saving ? "Storing..." : "Store secret"}
          </button>
        </div>
      </div>
    </SettingsSideDrawer>
  );
}

function parseBulkSecretCount(text: string): { valid: number; invalid: number } {
  let valid = 0;
  let invalid = 0;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const hash = line.indexOf("#");
    const main = hash >= 0 ? line.slice(0, hash).trim() : line;
    const eq = main.indexOf("=");
    if (eq <= 0) {
      invalid += 1;
      continue;
    }
    const name = main.slice(0, eq).trim();
    const value = main.slice(eq + 1).trim();
    if (!isValidSecretName(name) || !value) {
      invalid += 1;
      continue;
    }
    valid += 1;
  }
  return { valid, invalid };
}

function BulkSecretsDrawer({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: { text: string; redacted: boolean }) => Promise<boolean>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [redacted, setRedacted] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const parsed = useMemo(() => parseBulkSecretCount(text), [text]);
  const canSave = parsed.valid > 0 && parsed.invalid === 0 && !saving;

  async function handleFile(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFileError("File must be 2MB or smaller.");
      return;
    }
    setText(await file.text());
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    const saved = await onSave({ text, redacted });
    if (!saved) setSaving(false);
  }

  return (
    <SettingsSideDrawer
      title="Import organization secrets"
      description="Add multiple secrets from a file or by pasting directly."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-white/85">Upload file</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void handleFile(event.dataTransfer.files[0]);
            }}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-md border border-dashed border-white/[0.12] bg-white/[0.02] px-4 text-sm font-medium text-white/75 transition hover:border-white/25"
          >
            <UploadCloud className="size-5 text-white/45" aria-hidden />
            Choose a file or drag and drop
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          {fileError ? <p className="mt-2 text-xs text-red-300">{fileError}</p> : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-white/85">Paste secrets</p>
          <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-white/45">
            <li>Use one KEY=value secret per line.</li>
            <li>Keys can use letters, numbers, and underscores.</li>
            <li>Add notes after # on the same line.</li>
          </ul>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            placeholder={"API_KEY=value # note\nDATABASE_URL=value"}
            className={cn(secretTextareaClass, "font-mono text-xs")}
          />
          <p className={cn("mt-2 text-xs", parsed.invalid ? "text-red-300" : "text-white/40")}>
            {parsed.valid} valid{parsed.invalid ? `, ${parsed.invalid} invalid` : ""}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/85">Sensitive</p>
            <p className="text-xs text-white/45">Secrets marked sensitive are redacted from the UI.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/55">Redacted</span>
            <SettingsToggle checked={redacted} onChange={setRedacted} label="Redact imported secrets" />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void save()}
            className="inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-white transition hover:bg-[#3B82F6] disabled:opacity-40"
          >
            {saving ? "Storing..." : "Store"}
          </button>
        </div>
      </div>
    </SettingsSideDrawer>
  );
}

function wikiRepoIndexingPath(fullName: string): string {
  const [owner, ...repoParts] = fullName.split("/");
  const repo = repoParts.join("/");
  return `/continuity-lab/settings/wiki/repositories/${[owner, repo]
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/")}`;
}

function repoDisplayParts(fullName: string): { owner: string; name: string } {
  const [owner, ...repoParts] = fullName.split("/");
  return {
    owner: owner || "Repository",
    name: repoParts.join("/") || fullName,
  };
}

function formatRepoIndexLabel(repo: RepoIndexStatus): string {
  if (repo.status === "generating") return "Indexing...";
  if (!repo.indexed) return "Not indexed";
  return `Last indexed ${formatBackendDate(repo.updatedAt)}`;
}

function RepositoriesSection() {
  const [state, setState] = useState<LoadState<RepoIndexStatus[]>>(loadingState);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchRepoIndexStatuses()
      .then((repos) => {
        if (!cancelled) setState({ status: "ready", data: repos, error: null });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "Could not load repositories.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    function close() {
      setOpenMenu(null);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state.data ?? []).filter((repo) => {
      const haystack = [repo.fullName, repo.status, repo.goal ?? ""].join(" ").toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [state.data, search]);

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="repositories"
      titleOverride="Repositories"
      descriptionOverride="Missing a repository? Configure your Git integrations."
      contentClassName="max-w-5xl"
    >
      <SettingsCard>
        <SettingsToolbar className="mb-4">
          <SettingsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search repositories..."
            className="max-w-md"
          />
          <Link
            href="/continuity-lab/settings/connections"
            className="text-sm font-medium text-[#38BDF8] underline decoration-[#38BDF8]/30 underline-offset-2 hover:text-[#7DD3FC]"
          >
            Configure your Git integrations
          </Link>
        </SettingsToolbar>
        <BackendStatus loading={state.status === "loading"} error={state.error} />
        {state.status === "ready" && rows.length > 0 ? (
          <div className="overflow-visible rounded-md border border-white/[0.08] bg-[#171717]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.04]">
                  {["Name", "Wiki", "Environment", ""].map((col) => (
                    <th key={col} className="px-4 py-2.5 text-xs font-semibold text-white/80">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((repo) => {
                  const parts = repoDisplayParts(repo.fullName);
                  const menuOpen = openMenu === repo.fullName;
                  return (
                    <tr key={repo.projectId || repo.fullName}>
                      <SimpleCell className="font-medium text-white">
                        <span className="block">{parts.name}</span>
                        <span className="mt-0.5 block text-xs font-normal text-white/45">
                          {parts.owner}
                        </span>
                      </SimpleCell>
                      <SimpleCell>{formatRepoIndexLabel(repo)}</SimpleCell>
                      <SimpleCell>—</SimpleCell>
                      <SimpleCell className="relative w-14 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenu((current) =>
                              current === repo.fullName ? null : repo.fullName,
                            );
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white"
                          aria-label={`Configure ${repo.fullName}`}
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </button>
                        {menuOpen ? (
                          <div
                            className="absolute right-4 top-10 z-40 w-48 overflow-hidden rounded-md border border-white/[0.08] bg-[#181818] py-1 text-left shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Link
                              href={wikiRepoIndexingPath(repo.fullName)}
                              className="block px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/[0.05]"
                            >
                              Configure indexing
                            </Link>
                            <Link
                              href={repoBlueprintSettingsPath(repo.fullName)}
                              className="block px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/[0.05]"
                            >
                              Configure blueprint
                            </Link>
                          </div>
                        ) : null}
                      </SimpleCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : state.status === "ready" ? (
          <SettingsEmptyTable
            columns={["Name", "Wiki", "Environment", ""]}
            message={
              search.trim()
                ? `No repositories match "${search.trim()}".`
                : "No repositories returned by backend."
            }
          />
        ) : null}
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}

function BillingBackendSection({
  sectionId,
}: {
  sectionId: "plans" | "invoices" | "usage";
}) {
  const [state, setState] = useState<LoadState<BillingSnapshot>>(loadingState);

  useEffect(() => {
    let cancelled = false;
    void fetchBackendJson<BillingSnapshot>("/api/memory/billing")
      .then((billing) => {
        if (!cancelled) setState({ status: "ready", data: billing, error: null });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: "error",
            data: null,
            error: error instanceof Error ? error.message : "Could not load billing.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const titles = { plans: "Plans", invoices: "Invoices", usage: "Usage & limits" } as const;
  const billing = state.data;

  return (
    <ContinuityLabSettingsSectionFrame sectionId={sectionId}>
      <SettingsCard title={titles[sectionId]} description="Loaded from MemoryOS billing backend.">
        <BackendStatus loading={state.status === "loading"} error={state.error} />
        {billing && state.status === "ready" && sectionId === "plans" ? (
          <SettingsFlatPanel>
            <StatRow
              label="Current plan"
              value={billing.currentPlan}
              detail={billing.checkout?.configured ? `Checkout: ${billing.checkout.provider}` : "Checkout not configured"}
            />
            <StatRow
              label="Token limit"
              value={formatLimit(PLAN_CATALOG[billing.currentPlan].tokenLimit ?? billing.usage.tokenLimit)}
            />
            <StatRow
              label="Search limit"
              value={formatLimit(PLAN_CATALOG[billing.currentPlan].searchLimit ?? billing.usage.searchLimit)}
            />
            <StatRow
              label="Seat limit"
              value={
                billing.seats?.seatLimit === null
                  ? "Unlimited"
                  : String(billing.seats?.seatLimit ?? PLAN_CATALOG[billing.currentPlan].seatLimit ?? "—")
              }
            />
          </SettingsFlatPanel>
        ) : null}
        {billing && state.status === "ready" && sectionId === "usage" ? (
          <div className="space-y-4">
            <UsageMeterRow
              label="Tokens"
              used={billing.usage.tokenUsed}
              limit={billing.usage.tokenLimit}
            />
            <UsageMeterRow
              label="Searches"
              used={billing.usage.searchUsed}
              limit={billing.usage.searchLimit}
            />
            {billing.connectorSyncUsage ? (
              <UsageMeterRow
                label="Connector sync records"
                used={billing.connectorSyncUsage.used}
                limit={billing.connectorSyncUsage.limit ?? 0}
              />
            ) : null}
            <p className="text-xs text-white/40">
              Reset in {billing.usage.resetInDays} days.
            </p>
          </div>
        ) : null}
        {billing && state.status === "ready" && sectionId === "invoices" ? (
          billing.invoices.length > 0 ? (
            <SimpleTable columns={["Invoice", "Amount", "Status", "Issued"]}>
              {billing.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <SimpleCell className="font-mono text-xs text-white">{invoice.id}</SimpleCell>
                  <SimpleCell>{formatMoney(invoice.amountCents, invoice.currency)}</SimpleCell>
                  <SimpleCell>{invoice.status}</SimpleCell>
                  <SimpleCell>{formatBackendDate(invoice.issuedAt)}</SimpleCell>
                </tr>
              ))}
            </SimpleTable>
          ) : (
            <SettingsEmptyTable
              columns={["Invoice", "Amount", "Status", "Issued"]}
              message="No invoices returned by backend."
            />
          )
        ) : null}
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}

function UsageMeterRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const percent = usagePercent(used, limit);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-white">{label}</p>
        <p className="text-white/55">
          {used.toLocaleString()} / {limit > 0 ? limit.toLocaleString() : "unlimited"}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function BackendUnavailableSection({ sectionId }: { sectionId: SettingsSectionId }) {
  const item = findSettingsNavItem(sectionId);
  const title = item?.label ?? settingsSectionTitle(sectionId);
  const description =
    settingsSectionDescription(sectionId) ?? `${title} settings for your organization.`;

  return (
    <ContinuityLabSettingsSectionFrame sectionId={sectionId}>
      <SettingsCard title={title} description={description}>
        <SettingsEmptyTable
          columns={["Backend status"]}
          message="No backend route is configured for this settings section."
        />
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}
