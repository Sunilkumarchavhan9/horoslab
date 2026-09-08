"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Info,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  ContinuityLabSettingsSectionFrame,
} from "./continuity-lab-settings-shell";
import {
  SettingsSearchInput,
  SettingsToolbar,
} from "./continuity-lab-settings-ui";
import { consoleApiFetch } from "../../../lib/console-api";
import { fetchLabEnvironmentSettingsFromApi } from "../../../lib/continuity-lab/lab-environment-settings-api";
import {
  readLabEnvironmentSettings,
  type LabEnvironmentSnapshot,
} from "../../../lib/continuity-lab/lab-environment-settings-storage";
import { fetchLabPlaybooks, type LabPlaybook } from "../../../lib/continuity-lab/lab-playbooks-api";
import {
  readActiveOrganizationId,
} from "../../../lib/continuity-lab/settings-org";
import { cn } from "../../../lib/utils";

type MemoryOSApiTab = "service-users" | "api-keys";
type ServiceUserRole = "Admin" | "Member" | "DeepWiki Only";
type RoleFilter = "All roles" | ServiceUserRole;
type ServiceUserExpiration = "7 days" | "30 days" | "90 days" | "Never";
type ApiKeyExpiration = "30 days" | "90 days" | "1 year" | "Never";
type ApiKeyMode = "full" | "scoped";
type LegacyKeyType = "Personal key";
type QuickTestOption = {
  value: string;
  label: string;
  description?: string;
};

type ServiceUserRecord = {
  id: string;
  name: string;
  scope: "Organization";
  role: ServiceUserRole;
  createdAt: string;
  expiresAt: string | null;
};

type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  mode: ApiKeyMode;
  status: "active" | "revoked";
  endpoints: string[];
  contentTag: string;
  requests24h: number;
};

type ApiKeysState =
  | { status: "loading"; keys: ApiKeyRecord[]; error: null }
  | { status: "ready"; keys: ApiKeyRecord[]; error: null }
  | { status: "error"; keys: ApiKeyRecord[]; error: string };

type ServiceUsersState =
  | { status: "loading"; rows: ServiceUserRecord[]; error: null }
  | { status: "ready"; rows: ServiceUserRecord[]; error: null }
  | { status: "error"; rows: ServiceUserRecord[]; error: string };

const serviceUserRoles: ServiceUserRole[] = ["Admin", "Member", "DeepWiki Only"];
const roleFilters: RoleFilter[] = ["All roles", ...serviceUserRoles];
const serviceUserExpirations: ServiceUserExpiration[] = ["7 days", "30 days", "90 days", "Never"];
const legacyKeyTypes: LegacyKeyType[] = ["Personal key"];
const apiKeyExpirationOptions: ApiKeyExpiration[] = ["30 days", "90 days", "1 year", "Never"];
const apiKeyResetOptions = ["N/A", "1 hour", "1 day", "7 days", "30 days", "90 days", "180 days", "1 year"] as const;
const noSnapshotOption: QuickTestOption = { value: "", label: "No snapshot" };
const noPlaybookOption: QuickTestOption = { value: "", label: "No playbook" };

function tabFromParam(value: string | null): MemoryOSApiTab {
  return value === "api-keys" || value === "legacy" ? "api-keys" : "service-users";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return date.toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function sortByNewest<T extends { builtAt?: string; createdAt?: string; updatedAt?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aRaw = a.builtAt ?? a.updatedAt ?? a.createdAt ?? "";
    const bRaw = b.builtAt ?? b.updatedAt ?? b.createdAt ?? "";
    const aTime = new Date(aRaw).getTime();
    const bTime = new Date(bRaw).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

function snapshotToOption(snapshot: LabEnvironmentSnapshot): QuickTestOption {
  return {
    value: snapshot.id,
    label: `Build ${snapshot.id}`,
    description: snapshot.blueprintSummary?.trim() || "No description",
  };
}

function playbookToOption(playbook: LabPlaybook): QuickTestOption {
  return {
    value: playbook.id,
    label: playbook.name,
  };
}

function buildMemoryOsCurlExample(snapshotId: string, playbookId: string): string {
  const bodyLines = [
    `    "prompt": "Your task description here"`,
    ...(snapshotId ? [`    "snapshot_id": "${snapshotId}"`] : []),
    ...(playbookId ? [`    "playbook_id": "${playbookId}"`] : []),
  ];

  return `curl -X POST "https://api.memoryos.dev/v1/sessions" \\
  -H "Authorization: Bearer $MEMORYOS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
${bodyLines.join(",\n")}
  }'`;
}

function formatOrgIdFromSettings(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = "data" in payload ? (payload as { data?: unknown }).data : payload;
  if (!data || typeof data !== "object") return null;
  const organization = (data as { organization?: unknown }).organization;
  if (!organization || typeof organization !== "object") return null;
  const id = (organization as { organizationId?: unknown }).organizationId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function apiErrorMessage(payload: unknown, status: number, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return `${fallback} (${status})`;
}

async function fetchServiceUsers(): Promise<ServiceUserRecord[]> {
  const response = await consoleApiFetch("/api/memory/service-users");
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, response.status, "Could not load service users"));
  }
  const rows =
    payload && typeof payload === "object"
      ? (payload as { serviceUsers?: unknown }).serviceUsers
      : null;
  return Array.isArray(rows) ? (rows as ServiceUserRecord[]) : [];
}

async function createServiceUser(input: {
  name: string;
  role: ServiceUserRole;
  expiration: ServiceUserExpiration;
}): Promise<{ serviceUser: ServiceUserRecord; serviceUsers: ServiceUserRecord[] }> {
  const response = await consoleApiFetch("/api/memory/service-users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, response.status, "Could not provision service user"));
  }
  return payload as { serviceUser: ServiceUserRecord; serviceUsers: ServiceUserRecord[] };
}

async function deleteServiceUser(serviceUserId: string): Promise<ServiceUserRecord[]> {
  const response = await consoleApiFetch(`/api/memory/service-users/${encodeURIComponent(serviceUserId)}`, {
    method: "DELETE",
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, response.status, "Could not remove service user"));
  }
  const rows =
    payload && typeof payload === "object"
      ? (payload as { serviceUsers?: unknown }).serviceUsers
      : null;
  return Array.isArray(rows) ? (rows as ServiceUserRecord[]) : [];
}

async function fetchApiKeys(): Promise<ApiKeyRecord[]> {
  const response = await consoleApiFetch("/api/memory/api-keys");
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Could not load API keys (${response.status})`;
    throw new Error(message);
  }
  const keys = payload && typeof payload === "object" ? (payload as { keys?: unknown }).keys : null;
  return Array.isArray(keys) ? (keys as ApiKeyRecord[]) : [];
}

async function createApiKey(input: {
  name: string;
  expires: ApiKeyExpiration;
  mode: ApiKeyMode;
  creditLimit?: number | null;
  resetLimitEvery?: string | null;
}): Promise<{ token: string; key: ApiKeyRecord }> {
  const response = await consoleApiFetch("/api/memory/api-keys", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      expires: input.expires,
      mode: input.mode,
      endpoints: input.mode === "full" ? [] : ["retrieve", "resume", "continue", "handoff"],
      contentTag: "all",
      creditLimit: input.creditLimit ?? null,
      resetLimitEvery: input.resetLimitEvery ?? null,
    }),
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Could not create API key (${response.status})`;
    throw new Error(message);
  }
  return payload as { token: string; key: ApiKeyRecord };
}

function useClickOutside<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!active) return;
    function onMouseDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [active, onClose]);
  return ref;
}

function CompactSelect<T extends string>({
  value,
  options,
  onChange,
  className,
  menuClassName,
  label,
  groupLabel,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
  className?: string;
  menuClassName?: string;
  label?: ReactNode;
  groupLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(open, close);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label ? <p className="mb-1.5 text-xs font-semibold text-[#F0EFE2]/80">{label}</p> : null}
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-[#171717] px-3 text-left text-sm font-medium text-[#F0EFE2]/82 hover:border-white/14"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#F0EFE2]/35" aria-hidden />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1 w-full min-w-[160px] overflow-hidden rounded-md border border-white/[0.1] bg-[#1B1B1B] py-1 shadow-2xl",
            menuClassName,
          )}
        >
          {options.map((option, index) => (
            <div key={option}>
              {groupLabel && index === 1 ? (
                <p className="px-3 py-2 text-xs font-semibold text-[#F0EFE2]/35">{groupLabel}</p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onChange(option);
                  close();
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium hover:bg-white/[0.05]",
                  value === option ? "text-[#F0EFE2]" : "text-[#F0EFE2]/74",
                )}
              >
                <span>{option}</span>
                {value === option ? <Check className="size-3.5 text-[#F0EFE2]/70" aria-hidden /> : null}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchableQuickTestSelect({
  value,
  options,
  onChange,
  searchPlaceholder,
  className,
}: {
  value: string;
  options: QuickTestOption[];
  onChange: (value: string) => void;
  searchPlaceholder: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);
  const ref = useClickOutside<HTMLDivElement>(open, close);
  const selected = options.find((option) => option.value === value) ?? options[0] ?? noSnapshotOption;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      [option.label, option.description ?? ""].join(" ").toLowerCase().includes(query),
    );
  }, [options, search]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-[#171717] px-3 text-left text-sm font-semibold text-[#F0EFE2] transition hover:border-white/15"
      >
        <span className="min-w-0 truncate">{selected.label}</span>
        <ChevronDown className="size-3.5 shrink-0 text-[#F0EFE2]/35" aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-[340px] w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-md border border-white/[0.1] bg-[#1B1B1B] shadow-2xl">
          <div className="border-b border-white/[0.06] p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#F0EFE2]/30" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded-md border border-transparent bg-transparent pl-8 pr-2 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/45 focus:border-white/[0.08] focus:bg-[#111111] focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[288px] overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((option) => (
                <button
                  key={option.value || option.label}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    close();
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/[0.05]",
                    value === option.value ? "bg-white/[0.04] text-[#F0EFE2]" : "text-[#F0EFE2]/78",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{option.label}</span>
                    {option.description ? (
                      <span className="mt-0.5 block truncate text-xs font-medium text-[#F0EFE2]/45">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {value === option.value ? (
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#F0EFE2]/65" aria-hidden />
                  ) : null}
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-[#F0EFE2]/45">No matches</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SettingsTabs({
  active,
  onChange,
}: {
  active: MemoryOSApiTab;
  onChange: (tab: MemoryOSApiTab) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {[
        { id: "service-users" as const, label: "Service users" },
        { id: "api-keys" as const, label: "API keys (legacy)" },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold transition",
            active === tab.id
              ? "bg-white/[0.08] text-[#F0EFE2]"
              : "text-[#F0EFE2]/48 hover:bg-white/[0.04] hover:text-[#F0EFE2]/75",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ServiceUsersTable({
  rows,
  query,
  status,
  error,
  removingId,
  onRemove,
}: {
  rows: ServiceUserRecord[];
  query: string;
  status: ServiceUsersState["status"];
  error: string | null;
  removingId: string | null;
  onRemove: (id: string) => void;
}) {
  const emptyTitle =
    status === "loading"
      ? "Loading service users"
      : error
        ? "Could not load service users"
        : query
          ? "No matching service users"
          : "No service users yet";
  const emptyDescription =
    status === "loading"
      ? "Fetching service users from the backend."
      : error
        ? error
        : query
          ? "Try a different service-user name or role."
          : "Provision a service user to see them listed here.";

  return (
    <div className="overflow-x-auto rounded-md border border-white/[0.08] bg-[#171717]">
      <table className="w-full min-w-[860px] table-fixed text-left text-sm">
        <thead>
          <tr className="bg-white/[0.05]">
            <th className="w-[22%] px-4 py-3 font-semibold text-[#F0EFE2]">Name</th>
            <th className="w-[18%] px-4 py-3 font-semibold text-[#F0EFE2]">Scope</th>
            <th className="w-[22%] px-4 py-3 font-semibold text-[#F0EFE2]">Role name</th>
            <th className="w-[18%] px-4 py-3 font-semibold text-[#F0EFE2]">Created at</th>
            <th className="w-[16%] px-4 py-3 font-semibold text-[#F0EFE2]">Expires at</th>
            <th className="w-[4%] px-3 py-3 text-right font-semibold text-[#F0EFE2]" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.id} className="border-t border-white/[0.06]">
                <td className="min-w-0 px-4 py-4 font-medium text-[#F0EFE2]/80">
                  <span className="block truncate">{row.name}</span>
                </td>
                <td className="px-4 py-4 text-[#F0EFE2]/55">{row.scope}</td>
                <td className="px-4 py-4 text-[#F0EFE2]/65">{row.role}</td>
                <td className="px-4 py-4 text-[#F0EFE2]/55">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-4 text-[#F0EFE2]/55">{formatDate(row.expiresAt)}</td>
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    disabled={removingId === row.id}
                    className="inline-flex size-8 items-center justify-center rounded-md text-[#F0EFE2]/35 hover:bg-white/[0.06] hover:text-[#F0EFE2]/70"
                    aria-label={`Remove ${row.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center">
                <p className="text-base font-semibold text-[#F0EFE2]">{emptyTitle}</p>
                <p className="mx-auto mt-3 max-w-md text-sm text-[#F0EFE2]/55">{emptyDescription}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ProvisionServiceUserModal({
  onClose,
  onProvision,
  busy,
  error,
}: {
  onClose: () => void;
  onProvision: (input: {
    name: string;
    role: ServiceUserRole;
    expiration: ServiceUserExpiration;
  }) => void | Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<ServiceUserRole | "Select role">("Select role");
  const [expiration, setExpiration] = useState<ServiceUserExpiration>("30 days");
  const canProvision = !busy && name.trim().length > 0 && role !== "Select role";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-[448px] rounded-md border border-white/[0.1] bg-[#1B1B1B] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#F0EFE2]">Provision organization service user</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#F0EFE2]/50">
              Create an organization-level service user. The service user will need to be assigned
              appropriate roles within the selected organization.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-[#F0EFE2]/45 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
            aria-label="Close service user modal"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#F0EFE2]/84">
              Display name <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter display name"
              autoFocus
              className="h-9 w-full rounded-md border border-white/[0.1] bg-[#242424] px-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-[#3B82F6] focus:outline-none"
            />
          </label>

          <CompactSelect
            value={role}
            onChange={(value) => setRole(value)}
            options={serviceUserRoles}
            label={
              <>
                Organization role <span className="text-red-400">*</span>
              </>
            }
            className="w-full"
            menuClassName="left-0 right-auto min-w-full"
          />

          <CompactSelect
            value={expiration}
            onChange={setExpiration}
            options={serviceUserExpirations}
            label={
              <>
                Expiration <span className="text-red-400">*</span>
              </>
            }
            className="w-32"
            menuClassName="left-0 right-auto min-w-[128px]"
          />

          <p className="text-sm font-medium text-[#F0EFE2]/45">
            {error
              ? error
              : name.trim().length === 0
              ? "Please enter a display name to continue"
              : role === "Select role"
                ? "Please select an organization role to continue"
                : busy
                  ? "Provisioning service user"
                  : "Ready to provision service user"}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-white/[0.1] bg-white/[0.06] px-3.5 text-sm font-semibold text-[#F0EFE2]/86 hover:bg-white/[0.1]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canProvision}
            onClick={() => {
              if (role === "Select role") return;
              void onProvision({
                name: name.trim(),
                role,
                expiration,
              });
            }}
            className="inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-semibold text-[#F0EFE2] hover:bg-[#3B82F6] disabled:opacity-45"
          >
            {busy ? "Provisioning..." : "Provision service user"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateApiKeyModal({
  onClose,
  onCreate,
  busy,
  error,
}: {
  onClose: () => void;
  onCreate: (input: {
    name: string;
    creditLimit: number | null;
    resetLimitEvery: string | null;
    expires: ApiKeyExpiration;
  }) => void | Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("Personal API key");
  const [creditLimit, setCreditLimit] = useState("");
  const [resetLimitEvery, setResetLimitEvery] = useState<(typeof apiKeyResetOptions)[number]>("N/A");
  const [expires, setExpires] = useState<ApiKeyExpiration>("Never");
  const canCreate = !busy && name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[560px] rounded-md border border-white/[0.1] bg-[#121212] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#F0EFE2]">Create API key</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#F0EFE2]/50">
              Set the key name, credit cap, reset cadence, and expiration before we mint the key.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-[#F0EFE2]/45 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
            aria-label="Close API key modal"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canCreate) return;
            const parsedCreditLimit = creditLimit.trim().length > 0 && Number.isFinite(Number(creditLimit))
              ? Math.max(0, Math.trunc(Number(creditLimit)))
              : null;
            void (async () => {
              try {
                await onCreate({
                  name: name.trim(),
                  creditLimit: parsedCreditLimit,
                  resetLimitEvery: resetLimitEvery === "N/A" ? null : resetLimitEvery,
                  expires,
                });
              } catch {
                // Parent surface keeps the error visible.
              }
            })();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#F0EFE2]/84">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder='e.g. "Chatbot Key"'
              autoFocus
              className="h-10 w-full rounded-md border border-white/[0.1] bg-[#1c1c1c] px-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-[#3B82F6] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#F0EFE2]/84">
              Credit limit (optional)
            </span>
            <input
              type="number"
              min="0"
              value={creditLimit}
              onChange={(event) => setCreditLimit(event.target.value)}
              placeholder="Leave blank for unlimited"
              className="h-10 w-full rounded-md border border-white/[0.1] bg-[#1c1c1c] px-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-[#3B82F6] focus:outline-none"
            />
          </label>

          <CompactSelect
            value={resetLimitEvery}
            onChange={setResetLimitEvery}
            options={[...apiKeyResetOptions]}
            label="Reset limit every..."
            className="w-full"
            menuClassName="left-0 right-auto min-w-full"
          />

          <CompactSelect
            value={expires}
            onChange={setExpires}
            options={[...apiKeyExpirationOptions]}
            label="Expiration"
            className="w-full"
            menuClassName="left-0 right-auto min-w-full"
          />

          <p className="text-sm font-medium text-[#F0EFE2]/45">
            {error
              ? error
              : name.trim().length === 0
                ? "Please enter a key name to continue"
                : busy
                  ? "Creating API key"
                  : "Ready to create API key"}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-white/[0.1] bg-white/[0.06] px-3.5 text-sm font-semibold text-[#F0EFE2]/86 hover:bg-white/[0.1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canCreate}
              className="inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-semibold text-[#F0EFE2] hover:bg-[#3B82F6] disabled:opacity-45"
            >
              {busy ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickTestStep({
  number,
  title,
  description,
  children,
  compact,
}: {
  number: string;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-white/[0.06] py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between",
        compact && "sm:items-start",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-[#F0EFE2]/80">
          {number}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#F0EFE2]">{title}</p>
          <p className="mt-1 text-sm text-[#F0EFE2]/50">{description}</p>
        </div>
      </div>
      {children ? <div className="shrink-0 sm:min-w-[128px]">{children}</div> : null}
    </div>
  );
}

function LegacyApiKeysSection({
  apiKeys,
  keyType,
  snapshotId,
  playbookId,
  snapshotOptions,
  playbookOptions,
  curlExample,
  generatedToken,
  copiedToken,
  copiedCurl,
  generating,
  generateError,
  onKeyTypeChange,
  onSnapshotChange,
  onPlaybookChange,
  onGenerate,
  onCreateStart,
  onCopyToken,
  onCopyCurl,
}: {
  apiKeys: ApiKeysState;
  keyType: LegacyKeyType;
  snapshotId: string;
  playbookId: string;
  snapshotOptions: QuickTestOption[];
  playbookOptions: QuickTestOption[];
  curlExample: string;
  generatedToken: string | null;
  copiedToken: boolean;
  copiedCurl: boolean;
  generating: boolean;
  generateError: string | null;
  onKeyTypeChange: (value: LegacyKeyType) => void;
  onSnapshotChange: (value: string) => void;
  onPlaybookChange: (value: string) => void;
  onGenerate: (input: {
    name: string;
    creditLimit: number | null;
    resetLimitEvery: string | null;
    expires: ApiKeyExpiration;
  }) => void | Promise<void>;
  onCreateStart: () => void;
  onCopyToken: (value: string) => void;
  onCopyCurl: () => void;
}) {
  const [keyVisible, setKeyVisible] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const activePersonalKey = useMemo(() => {
    return [...apiKeys.keys]
      .filter((key) => key.status === "active")
      .sort((a, b) => {
        const bTime = new Date(b.createdAt).getTime();
        const aTime = new Date(a.createdAt).getTime();
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
      })[0] ?? null;
  }, [apiKeys.keys]);

  const loading = apiKeys.status === "loading";
  const error = generateError ?? apiKeys.error;
  const canGenerate = !generating && apiKeys.status !== "loading";
  const keyValue = generatedToken ?? activePersonalKey?.prefix ?? null;
  const displayedKeyValue = keyValue
    ? keyVisible
      ? keyValue
      : `${keyValue.slice(0, 9)}${"*".repeat(10)}`
    : null;

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-white/[0.08] border-l-[#3B82F6] bg-[#1A1A1A] px-4 py-3 [border-left-width:4px]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/20 text-[#60A5FA]">
            <Info className="size-3" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#F0EFE2]">Tip</p>
            <p className="mt-2 text-sm text-[#F0EFE2]/55">
              To give MemoryOS access to third-party credentials, use{" "}
              <Link
                href="/continuity-lab/settings/secrets"
                className="font-medium text-[#8AB4FF] underline decoration-[#8AB4FF]/35 underline-offset-2 hover:text-[#A8C7FF]"
              >
                secrets
              </Link>{" "}
              instead.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#F0EFE2]">API keys</h2>
          <p className="mt-1 text-sm text-[#F0EFE2]/55">Tied to your account - do not share</p>
        </div>

        <div className="rounded-md border border-white/[0.08] bg-[#1A1A1A] px-4">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F0EFE2]">
              <span>Key type</span>
              <Info className="size-3.5 text-[#F0EFE2]/35" aria-label="Personal keys are tied to your user account." />
            </div>
            <CompactSelect
              value={keyType}
              onChange={onKeyTypeChange}
              options={legacyKeyTypes}
              className="w-full sm:w-36"
              menuClassName="min-w-[144px]"
            />
          </div>

          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {loading && !activePersonalKey ? (
                <p className="text-sm font-semibold text-[#F0EFE2]">Loading API keys...</p>
              ) : keyValue ? (
                <>
                  <p className="text-sm font-semibold text-[#F0EFE2]">Personal API key</p>
                  <p className="mt-1 text-sm text-[#F0EFE2]/55">Keep this key secure</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#F0EFE2]">No personal API key</p>
                  <p className="mt-1 text-sm text-[#F0EFE2]/55">Create a key to start using the API</p>
                </>
              )}
            </div>
            {keyValue ? (
              <div className="flex min-w-0 items-center gap-2 sm:max-w-[340px]">
                <code className="min-w-0 truncate rounded-md border border-white/[0.08] bg-[#242424] px-3 py-2 font-mono text-xs font-semibold text-[#F0EFE2]">
                  {displayedKeyValue}
                </code>
                <button
                  type="button"
                  onClick={() => onCopyToken(keyValue)}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[#F0EFE2]/45 transition hover:bg-white/[0.06] hover:text-[#F0EFE2]"
                  aria-label="Copy personal API key"
                  title={copiedToken ? "Copied" : "Copy API key"}
                >
                  {copiedToken ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setKeyVisible((next) => !next)}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[#F0EFE2]/35 transition hover:bg-white/[0.06] hover:text-[#F0EFE2]"
                  aria-label={keyVisible ? "Hide personal API key" : "Show personal API key"}
                  title={keyVisible ? "Hide key" : "Show key"}
                >
                  {keyVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!canGenerate}
                onClick={() => {
                  onCreateStart();
                  setCreateOpen(true);
                }}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-[#3B82F6] px-3.5 text-sm font-semibold text-[#F0EFE2] transition hover:bg-[#60A5FA] disabled:opacity-45"
              >
                {generating ? "Generating..." : "Generate API Key"}
              </button>
            )}
          </div>

          {error ? (
            <div className="border-t border-white/[0.06] py-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          ) : null}
        </div>
      </section>

      {createOpen ? (
        <CreateApiKeyModal
          busy={generating}
          error={generateError}
          onClose={() => setCreateOpen(false)}
          onCreate={async (input) => {
            await onGenerate(input);
            setCreateOpen(false);
          }}
        />
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#F0EFE2]">Quick test</h2>
          <p className="mt-1 text-sm text-[#F0EFE2]/55">
            Try creating a session with the MemoryOS API. Optionally select a snapshot and playbook.
          </p>
        </div>

        <div className="rounded-md border border-white/[0.08] bg-[#1A1A1A] px-4">
          <QuickTestStep
            number="1"
            title="Snapshot (optional)"
            description="Select a machine snapshot to use"
          >
            <SearchableQuickTestSelect
              value={snapshotId}
              onChange={onSnapshotChange}
              options={snapshotOptions}
              searchPlaceholder="Search snapshots..."
              className="w-full sm:w-80"
            />
          </QuickTestStep>

          <QuickTestStep
            number="2"
            title="Playbook (optional)"
            description="Select a playbook to use"
          >
            <SearchableQuickTestSelect
              value={playbookId}
              onChange={onPlaybookChange}
              options={playbookOptions}
              searchPlaceholder="Search playbooks..."
              className="w-full sm:w-80"
            />
          </QuickTestStep>

          <QuickTestStep
            number="3"
            title="Example request"
            description="Copy this curl command to create a session"
            compact
          />

          <div className="pb-4 pl-0 sm:pl-9">
            <div className="relative rounded-md border border-white/[0.06] bg-[#111111]">
              <button
                type="button"
                onClick={onCopyCurl}
                className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md border border-white/[0.08] bg-[#171717] text-[#F0EFE2]/60 transition hover:bg-white/[0.06] hover:text-[#F0EFE2]"
                aria-label="Copy curl command"
                title={copiedCurl ? "Copied" : "Copy curl command"}
              >
                {copiedCurl ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
              </button>
              <pre className="overflow-x-auto p-5 pr-14 text-xs leading-6 text-[#F0EFE2]/82">
                <code>{curlExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ContinuityLabMemoryOSApiSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const [tab, setTab] = useState<MemoryOSApiTab>(() => tabFromParam(searchParams.get("tab")));
  const [orgId, setOrgId] = useState("");
  const [copiedOrg, setCopiedOrg] = useState(false);
  const [serviceUsers, setServiceUsers] = useState<ServiceUsersState>({
    status: "loading",
    rows: [],
    error: null,
  });
  const [serviceSearch, setServiceSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All roles");
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisioningServiceUser, setProvisioningServiceUser] = useState(false);
  const [removingServiceUserId, setRemovingServiceUserId] = useState<string | null>(null);
  const [serviceActionError, setServiceActionError] = useState<string | null>(null);
  const [keyType, setKeyType] = useState<LegacyKeyType>("Personal key");
  const [snapshotId, setSnapshotId] = useState("");
  const [playbookId, setPlaybookId] = useState("");
  const [snapshotOptions, setSnapshotOptions] = useState<QuickTestOption[]>([noSnapshotOption]);
  const [playbookOptions, setPlaybookOptions] = useState<QuickTestOption[]>([noPlaybookOption]);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeysState>({
    status: "loading",
    keys: [],
    error: null,
  });

  const resolvedOrgId = orgId || organization?.id?.trim() || readActiveOrganizationId() || "org-local";

  const loadServiceUsers = useCallback(() => {
    setServiceUsers((current) => ({ status: "loading", rows: current.rows, error: null }));
    void fetchServiceUsers()
      .then((rows) => setServiceUsers({ status: "ready", rows, error: null }))
      .catch((error) =>
        setServiceUsers((current) => ({
          status: "error",
          rows: current.rows,
          error: error instanceof Error ? error.message : "Could not load service users.",
        })),
      );
  }, []);

  const loadApiKeys = useCallback(() => {
    setApiKeys((current) => ({ status: "loading", keys: current.keys, error: null }));
    void fetchApiKeys()
      .then((keys) => setApiKeys({ status: "ready", keys, error: null }))
      .catch((error) =>
        setApiKeys({
          status: "error",
          keys: [],
          error: error instanceof Error ? error.message : "Could not load API keys.",
        }),
      );
  }, []);

  useEffect(() => {
    const nextTab = tabFromParam(searchParams.get("tab"));
    setTab(nextTab);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const clerkOrgId = organization?.id?.trim();
    if (clerkOrgId) {
      setOrgId(clerkOrgId);
      return;
    }
    void consoleApiFetch("/api/memory/settings")
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        setOrgId(formatOrgIdFromSettings(payload) ?? readActiveOrganizationId() ?? "org-local");
      })
      .catch(() => {
        if (!cancelled) setOrgId(readActiveOrganizationId() ?? "org-local");
      });
    return () => {
      cancelled = true;
    };
  }, [organization?.id]);

  useEffect(() => {
    loadServiceUsers();
  }, [loadServiceUsers, resolvedOrgId]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const stream = new EventSource("/api/memory/events");
    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { kind?: unknown };
        if (payload.kind === "service_users_changed") {
          loadServiceUsers();
        }
        if (payload.kind === "api_keys_changed") {
          loadApiKeys();
        }
      } catch {
        // Ignore heartbeat and malformed event payloads.
      }
    };
    return () => {
      stream.close();
    };
  }, [loadApiKeys, loadServiceUsers]);

  useEffect(() => {
    let cancelled = false;
    void fetchLabEnvironmentSettingsFromApi().then((remote) => {
      if (cancelled) return;
      const settings = remote?.settings ?? readLabEnvironmentSettings();
      const nextOptions = [
        noSnapshotOption,
        ...sortByNewest(settings.snapshots).map(snapshotToOption),
      ];
      setSnapshotOptions(nextOptions);
      setSnapshotId((current) =>
        nextOptions.some((option) => option.value === current) ? current : "",
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchLabPlaybooks().then((response) => {
      if (cancelled) return;
      const rows = response
        ? [...response.playbooks.organization, ...response.playbooks.system]
        : [];
      const nextOptions = [
        noPlaybookOption,
        ...sortByNewest(rows).map(playbookToOption),
      ];
      setPlaybookOptions(nextOptions);
      setPlaybookId((current) =>
        nextOptions.some((option) => option.value === current) ? current : "",
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function setActiveTab(next: MemoryOSApiTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function copyOrgId() {
    await navigator.clipboard.writeText(resolvedOrgId);
    setCopiedOrg(true);
    window.setTimeout(() => setCopiedOrg(false), 1500);
  }

  async function provisionServiceUser(input: {
    name: string;
    role: ServiceUserRole;
    expiration: ServiceUserExpiration;
  }) {
    setProvisioningServiceUser(true);
    setServiceActionError(null);
    try {
      const result = await createServiceUser(input);
      setServiceUsers({ status: "ready", rows: result.serviceUsers, error: null });
      setProvisionOpen(false);
    } catch (error) {
      setServiceActionError(
        error instanceof Error ? error.message : "Could not provision service user.",
      );
    } finally {
      setProvisioningServiceUser(false);
    }
  }

  async function removeServiceUser(serviceUserId: string) {
    setRemovingServiceUserId(serviceUserId);
    setServiceActionError(null);
    try {
      const rows = await deleteServiceUser(serviceUserId);
      setServiceUsers({ status: "ready", rows, error: null });
    } catch (error) {
      setServiceActionError(error instanceof Error ? error.message : "Could not remove service user.");
    } finally {
      setRemovingServiceUserId(null);
    }
  }

  async function handleGeneratePersonalKey(input: {
    name: string;
    creditLimit: number | null;
    resetLimitEvery: string | null;
    expires: ApiKeyExpiration;
  }) {
    setGeneratingKey(true);
    setGenerateError(null);
    setCreatedToken(null);
    setCopiedToken(false);
    try {
      const result = await createApiKey({
        name: input.name,
        expires: input.expires,
        mode: "full",
        creditLimit: input.creditLimit,
        resetLimitEvery: input.resetLimitEvery,
      });
      setCreatedToken(result.token);
      setApiKeys((current) => ({
        status: "ready",
        keys: [result.key, ...current.keys.filter((key) => key.id !== result.key.id)],
        error: null,
      }));
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Could not generate API key.");
      throw error;
    } finally {
      setGeneratingKey(false);
    }
  }

  function handleApiKeyCreateStart() {
    setGenerateError(null);
    setCreatedToken(null);
    setCopiedToken(false);
  }

  async function copyKeyValue(value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedToken(true);
    window.setTimeout(() => setCopiedToken(false), 1500);
  }

  async function copyCurlExample() {
    await navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    window.setTimeout(() => setCopiedCurl(false), 1500);
  }

  const filteredServiceUsers = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    return serviceUsers.rows.filter((row) => {
      const roleOk = roleFilter === "All roles" || row.role === roleFilter;
      const queryOk =
        !query ||
        [row.name, row.scope, row.role].join(" ").toLowerCase().includes(query);
      return roleOk && queryOk;
    });
  }, [serviceUsers.rows, roleFilter, serviceSearch]);

  const curlExample = useMemo(
    () => buildMemoryOsCurlExample(snapshotId, playbookId),
    [snapshotId, playbookId],
  );

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="memoryos-api"
      breadcrumb={[
        { label: "Settings", href: "/continuity-lab/settings" },
        { label: "MemoryOS API" },
      ]}
      titleOverride="MemoryOS API"
      descriptionOverride="Organization service users and legacy API keys."
      contentClassName="max-w-5xl"
    >
      <Link
        href="/continuity-lab/settings/general"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#F0EFE2]/50 hover:text-[#F0EFE2]/75"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to organization
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-[#F0EFE2]">MemoryOS API</h1>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-[#F0EFE2]/55">
          <span className="min-w-0 truncate">Organization ID: {resolvedOrgId}</span>
          <button
            type="button"
            onClick={() => void copyOrgId()}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-[#F0EFE2]/45 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
            aria-label="Copy organization ID"
            title={copiedOrg ? "Copied" : "Copy organization ID"}
          >
            {copiedOrg ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <SettingsTabs active={tab} onChange={setActiveTab} />

        {tab === "service-users" ? (
          <>
            <SettingsToolbar className="justify-between">
              <SettingsSearchInput
                value={serviceSearch}
                onChange={setServiceSearch}
                placeholder="Search for a service user"
                className="max-w-md"
              />
              <div className="flex flex-wrap items-center gap-2">
                <CompactSelect
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roleFilters}
                  groupLabel="Organization roles"
                  className="w-36"
                  menuClassName="min-w-[160px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setServiceActionError(null);
                    setProvisionOpen(true);
                  }}
                  className="inline-flex h-9 items-center rounded-md bg-[#3B82F6] px-3.5 text-sm font-semibold text-[#F0EFE2] hover:bg-[#60A5FA]"
                >
                  Provision service user
                </button>
              </div>
            </SettingsToolbar>

            {serviceActionError && !provisionOpen ? (
              <p className="mb-3 text-sm font-medium text-red-300">{serviceActionError}</p>
            ) : null}

            <ServiceUsersTable
              rows={filteredServiceUsers}
              query={serviceSearch.trim()}
              status={serviceUsers.status}
              error={serviceUsers.error}
              removingId={removingServiceUserId}
              onRemove={(id) => void removeServiceUser(id)}
            />
          </>
        ) : (
          <LegacyApiKeysSection
            apiKeys={apiKeys}
            keyType={keyType}
            snapshotId={snapshotId}
            playbookId={playbookId}
            snapshotOptions={snapshotOptions}
            playbookOptions={playbookOptions}
            curlExample={curlExample}
            generatedToken={createdToken}
            copiedToken={copiedToken}
            copiedCurl={copiedCurl}
            generating={generatingKey}
            generateError={generateError}
            onKeyTypeChange={setKeyType}
            onSnapshotChange={setSnapshotId}
            onPlaybookChange={setPlaybookId}
            onGenerate={(input) => void handleGeneratePersonalKey(input)}
            onCreateStart={handleApiKeyCreateStart}
            onCopyToken={(value) => void copyKeyValue(value)}
            onCopyCurl={() => void copyCurlExample()}
          />
        )}
      </div>

      {provisionOpen ? (
        <ProvisionServiceUserModal
          onClose={() => setProvisionOpen(false)}
          busy={provisioningServiceUser}
          error={serviceActionError}
          onProvision={provisionServiceUser}
        />
      ) : null}
    </ContinuityLabSettingsSectionFrame>
  );
}
