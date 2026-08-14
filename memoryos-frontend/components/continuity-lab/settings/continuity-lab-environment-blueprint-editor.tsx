"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelLeft,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsFlatPanel,
  SettingsPrimaryButton,
  SettingsSearchInput,
  SettingsSecondaryButton,
  SettingsSelect,
  SettingsTabPills,
  SettingsToggle,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addLabEnvironmentBlueprintSecretToApi,
  deleteLabEnvironmentBlueprintFromApi,
  importLabEnvironmentBlueprintSecretsToApi,
  loadLabEnvironmentSettingsHybrid,
  loadLabEnvironmentSettingsLocalFallback,
  saveLabEnvironmentBlueprintToApi,
  uploadLabEnvironmentBlueprintFileToApi,
} from "@/lib/continuity-lab/lab-environment-settings-api";
import {
  LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT,
  type LabEnvironmentSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-environment-settings-events";
import {
  DEFAULT_BLUEPRINT_YAML,
  buildGenerateWithDevinAskUrl,
  normalizeLabEnvironmentSettings,
  saveLabEnvironmentSettings,
  type LabEnvironmentBlueprintFile,
  type LabEnvironmentBlueprintSecret,
  type LabEnvironmentBlueprintVersion,
  type LabEnvironmentSettings,
} from "@/lib/continuity-lab/lab-environment-settings-storage";
import { SETTINGS_INDEX_PATH, settingsSectionPath } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";
import {
  BlueprintToast,
  ContinuityLabBlueprintYamlIde,
} from "@/components/continuity-lab/settings/continuity-lab-blueprint-yaml-ide";

type BlueprintTab = "editor" | "history" | "files" | "secrets";

const ENVIRONMENT_LEARN_MORE_URL =
  "https://docs.memoryos.dev/continuity-lab/environment";

const ENVIRONMENT_PAGE = settingsSectionPath("environment");

const ORG_GENERATE_PROMPT =
  "Set up the organization environment from scratch: Configure shared dependencies, global CLIs, and one-time setup steps. Then capture the working setup steps in the .yaml environment configuration.";

const MAX_FILE_BYTES = 512 * 1024;

const saveButtonClass =
  "inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-white transition hover:bg-[#3B82F6] disabled:opacity-40";

const modalInputClass =
  "h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none";

const dropdownItemClass =
  "gap-2.5 rounded-none px-3 py-2 text-xs text-white/85 focus:bg-[#141414] focus:text-white";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
    return date.toLocaleString();
  } catch {
    return iso;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type DiffLine = { type: "same" | "removed" | "added"; line: string };

function simpleLineDiff(before: string, after: string): DiffLine[] {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const maxLen = Math.max(beforeLines.length, afterLines.length);
  const rows: DiffLine[] = [];
  for (let i = 0; i < maxLen; i++) {
    const b = beforeLines[i];
    const a = afterLines[i];
    if (b === a) {
      rows.push({ type: "same", line: b ?? "" });
    } else {
      if (b !== undefined) rows.push({ type: "removed", line: b });
      if (a !== undefined) rows.push({ type: "added", line: a });
    }
  }
  return rows;
}

function userDisplayName(user: ReturnType<typeof useUser>["user"]): string | null {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  const username = user.username?.trim();
  if (username) return username;
  const email = user.primaryEmailAddress?.emailAddress?.trim();
  return email || null;
}

function LineDiffView({ before, after }: { before: string; after: string }) {
  const rows = useMemo(() => simpleLineDiff(before, after), [before, after]);
  return (
    <pre className="min-h-[320px] overflow-auto rounded-md border border-white/[0.06] bg-[#0a0a0a] p-3 font-mono text-[11px] leading-relaxed">
      {rows.map((row, index) => (
        <div
          key={`${row.type}-${index}`}
          className={cn(
            "whitespace-pre-wrap break-all px-1",
            row.type === "removed" && "bg-red-500/15 text-red-200/90",
            row.type === "added" && "bg-emerald-500/15 text-emerald-200/90",
            row.type === "same" && "text-white/55",
          )}
        >
          {row.type === "removed" ? "- " : row.type === "added" ? "+ " : "  "}
          {row.line || " "}
        </div>
      ))}
    </pre>
  );
}

function AddSecretModal({
  open,
  onClose,
  onStore,
  storing,
}: {
  open: boolean;
  onClose: () => void;
  onStore: (input: {
    name: string;
    value: string;
    note: string;
    redacted: boolean;
  }) => Promise<void>;
  storing: boolean;
}) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [redacted, setRedacted] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName("");
    setValue("");
    setNote("");
    setRedacted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canStore = name.trim().length > 0 && value.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close add secret dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-secret-title"
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden border border-[#2F2F2F] bg-[#0A0A0A] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#2F2F2F] px-5 py-4">
          <div>
            <h2 id="add-secret-title" className="text-lg font-semibold text-white">
              New organization secret
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Secrets are available to MemoryOS sessions started with this organization blueprint.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center border border-[#3A3A3A] text-white/70 hover:bg-[#141414]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-md border border-indigo-500/25 bg-indigo-500/10 px-3 py-2.5 text-xs text-indigo-100/90">
            Stored secrets are injected into agent sandboxes for this organization. Never commit
            secret values into your blueprint YAML.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/70">Type</label>
            <SettingsSelect
              value="key-value"
              onChange={() => {}}
              options={[{ value: "key-value", label: "Key-value" }]}
              disabled
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="secret-name" className="text-xs font-medium text-white/70">
              Name
            </label>
            <input
              id="secret-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="API_KEY"
              className={modalInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="secret-value" className="text-xs font-medium text-white/70">
              Value
            </label>
            <input
              id="secret-value"
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="••••••••"
              className={modalInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="secret-note" className="text-xs font-medium text-white/70">
              Note
            </label>
            <input
              id="secret-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional description"
              className={modalInputClass}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-white">Redact value</p>
              <p className="mt-0.5 text-xs text-white/45">
                Hide the value from session logs and UI after storing.
              </p>
            </div>
            <SettingsToggle
              checked={redacted}
              onChange={setRedacted}
              label="Redact value"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#2F2F2F] px-5 py-4">
          <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
          <button
            type="button"
            disabled={!canStore || storing}
            onClick={() =>
              void onStore({
                name: name.trim(),
                value,
                note: note.trim(),
                redacted,
              })
            }
            className={saveButtonClass}
          >
            {storing ? "Storing…" : "Store secret"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportSecretsModal({
  open,
  onClose,
  onStore,
  storing,
}: {
  open: boolean;
  onClose: () => void;
  onStore: (input: { text: string; redacted: boolean }) => Promise<void>;
  storing: boolean;
}) {
  const [text, setText] = useState("");
  const [redacted, setRedacted] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setText("");
    setRedacted(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canStore = text.trim().length > 0;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      window.alert("File must be 512 KB or smaller.");
      return;
    }
    try {
      const content = await file.text();
      setText((prev) => (prev.trim() ? `${prev.trim()}\n${content}` : content));
    } catch {
      window.alert("Could not read file.");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close import secrets dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-secrets-title"
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden border border-[#2F2F2F] bg-[#0A0A0A] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#2F2F2F] px-5 py-4">
          <div>
            <h2 id="import-secrets-title" className="text-lg font-semibold text-white">
              Import secrets
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Paste or upload secrets in KEY=VALUE format, one per line.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center border border-[#3A3A3A] text-white/70 hover:bg-[#141414]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".env,.txt,text/plain"
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-white/[0.12] bg-[#111111] px-4 py-8 text-center transition hover:border-white/20 hover:bg-[#141414]"
          >
            <Upload className="size-5 text-white/40" aria-hidden />
            <span className="text-sm font-medium text-white/75">Upload .env or text file</span>
            <span className="text-xs text-white/40">Optional — max 512 KB</span>
          </button>

          <div className="space-y-1.5">
            <label htmlFor="import-secrets-text" className="text-xs font-medium text-white/70">
              Paste secrets
            </label>
            <textarea
              id="import-secrets-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={"API_KEY=abc123\nDATABASE_URL=postgres://..."}
              className="w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 py-2 font-mono text-xs leading-relaxed text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
            />
            <p className="text-[11px] text-white/40">
              Use KEY=VALUE per line. Lines starting with # are ignored. Quotes around values are
              stripped.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-white">Sensitive / Redacted</p>
              <p className="mt-0.5 text-xs text-white/45">
                Mark imported secrets as redacted in the UI.
              </p>
            </div>
            <SettingsToggle
              checked={redacted}
              onChange={setRedacted}
              label="Sensitive / Redacted"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#2F2F2F] px-5 py-4">
          <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
          <button
            type="button"
            disabled={!canStore || storing}
            onClick={() => void onStore({ text: text.trim(), redacted })}
            className={saveButtonClass}
          >
            {storing ? "Storing…" : "Store"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContinuityLabEnvironmentBlueprintEditor() {
  const router = useRouter();
  const { organization } = useOrganization();
  const { user } = useUser();

  const [settings, setSettings] = useState<LabEnvironmentSettings>(() =>
    normalizeLabEnvironmentSettings(undefined),
  );
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<BlueprintTab>("editor");
  const [draftContent, setDraftContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [initializedDraft, setInitializedDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fileSearch, setFileSearch] = useState("");
  const [secretSearch, setSecretSearch] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [addSecretOpen, setAddSecretOpen] = useState(false);
  const [importSecretsOpen, setImportSecretsOpen] = useState(false);
  const [storingSecret, setStoringSecret] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [fileDragActive, setFileDragActive] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const applyRemote = useCallback((next: LabEnvironmentSettings) => {
    const normalized = normalizeLabEnvironmentSettings(next);
    const saved = normalized.blueprintMarkdown ?? "";
    setSettings(normalized);
    setSavedContent(saved);
    saveLabEnvironmentSettings(normalized, { broadcast: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const orgId = organization?.id?.trim() ?? "";
    void (async () => {
      setLoadError(null);
      const remote = await loadLabEnvironmentSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        applyRemote(remote.settings);
      } else {
        const local = loadLabEnvironmentSettingsLocalFallback(orgId).settings;
        applyRemote(local);
        setLoadError("Could not load settings from the server.");
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [organization?.id, applyRemote]);

  useEffect(() => {
    if (!loaded || initializedDraft) return;
    const saved = settings.blueprintMarkdown ?? "";
    setSavedContent(saved);
    setDraftContent(saved.trim() ? saved : DEFAULT_BLUEPRINT_YAML);
    setInitializedDraft(true);
  }, [loaded, initializedDraft, settings.blueprintMarkdown]);

  useEffect(() => {
    function onSettingsChanged(event: Event) {
      const detail = (event as CustomEvent<LabEnvironmentSettingsChangedDetail>).detail;
      if (detail?.settings) {
        const normalized = normalizeLabEnvironmentSettings(detail.settings);
        const saved = normalized.blueprintMarkdown ?? "";
        setSettings(normalized);
        setSavedContent(saved);
      }
    }
    window.addEventListener(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, onSettingsChanged);
    return () =>
      window.removeEventListener(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, onSettingsChanged);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!panelExpanded) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPanelExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [panelExpanded]);

  const blueprintFiles = settings.blueprintFiles ?? [];
  const blueprintSecrets = settings.blueprintSecrets ?? [];
  const panelBodyClass = panelExpanded
    ? "flex min-h-0 flex-1 flex-col"
    : "min-h-[520px]";
  const panelContentMinClass = panelExpanded ? "min-h-0 flex-1" : "min-h-[460px]";

  const isDirty = draftContent !== savedContent;

  const versions = settings.blueprintVersions ?? [];
  const selectedVersion: LabEnvironmentBlueprintVersion | null = useMemo(() => {
    if (!versions.length) return null;
    return versions.find((v) => v.id === selectedVersionId) ?? versions[0];
  }, [versions, selectedVersionId]);

  useEffect(() => {
    if (tab !== "history" || versions.length === 0) return;
    if (!selectedVersionId || !versions.some((v) => v.id === selectedVersionId)) {
      setSelectedVersionId(versions[0].id);
    }
  }, [tab, versions, selectedVersionId]);

  const diffBefore = useMemo(() => {
    if (!selectedVersion) return "";
    const index = versions.findIndex((v) => v.id === selectedVersion.id);
    return index >= 0 && index < versions.length - 1
      ? versions[index + 1].content
      : "";
  }, [selectedVersion, versions]);

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase();
    if (!q) return settings.blueprintFiles ?? [];
    return (settings.blueprintFiles ?? []).filter((file) => file.name.toLowerCase().includes(q));
  }, [settings.blueprintFiles, fileSearch]);

  const filteredSecrets = useMemo(() => {
    const q = secretSearch.trim().toLowerCase();
    if (!q) return settings.blueprintSecrets ?? [];
    return (settings.blueprintSecrets ?? []).filter(
      (secret) =>
        secret.name.toLowerCase().includes(q) ||
        (secret.note?.toLowerCase().includes(q) ?? false),
    );
  }, [settings.blueprintSecrets, secretSearch]);

  function handleDiscard() {
    setDraftContent(savedContent);
    setSaveError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const saved = await saveLabEnvironmentBlueprintToApi({
      content: draftContent,
      savedBy: userDisplayName(user),
    });
    if (!saved) {
      setSaveError("Could not save blueprint. Check server connection and try again.");
      setSaving(false);
      return;
    }
    const content = saved.settings.blueprintMarkdown ?? "";
    setSettings(saved.settings);
    setSavedContent(content);
    setDraftContent(content);
    setSaving(false);
    setToast("Organization setup created");
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this organization blueprint? Version history, files, and secrets will be removed.",
      )
    ) {
      return;
    }
    setDeleting(true);
    const result = await deleteLabEnvironmentBlueprintFromApi();
    setDeleting(false);
    if (!result) {
      setSaveError("Could not delete blueprint.");
      return;
    }
    router.push(ENVIRONMENT_PAGE);
  }

  async function uploadBlueprintFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      window.alert("File must be 512 KB or smaller.");
      return;
    }
    setUploadingFile(true);
    try {
      const content = await file.text();
      const result = await uploadLabEnvironmentBlueprintFileToApi({
        name: file.name,
        content,
      });
      if (!result) {
        setSaveError("Could not upload file.");
      } else {
        setSettings(normalizeLabEnvironmentSettings(result.settings));
      }
    } catch {
      setSaveError("Could not read file.");
    }
    setUploadingFile(false);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadBlueprintFile(file);
  }

  function handleFileDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setFileDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadBlueprintFile(file);
  }

  async function handleAddSecret(input: {
    name: string;
    value: string;
    note: string;
    redacted: boolean;
  }) {
    setStoringSecret(true);
    const result = await addLabEnvironmentBlueprintSecretToApi({
      name: input.name,
      value: input.value,
      note: input.note || null,
      redacted: input.redacted,
    });
    setStoringSecret(false);
    if (!result) {
      setSaveError("Could not store secret.");
      return;
    }
    setSettings(result.settings);
    setAddSecretOpen(false);
  }

  async function handleImportSecrets(input: { text: string; redacted: boolean }) {
    setStoringSecret(true);
    const result = await importLabEnvironmentBlueprintSecretsToApi(input);
    setStoringSecret(false);
    if (!result) {
      setSaveError("Could not import secrets.");
      return;
    }
    setSettings(result.settings);
    setImportSecretsOpen(false);
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="environment"
      titleOverride="Organization blueprint"
      descriptionOverride="Commands and context that run before per-repository setup in agent sandboxes."
      docHref={ENVIRONMENT_LEARN_MORE_URL}
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Environment", href: ENVIRONMENT_PAGE },
        { label: "Organization blueprint" },
      ]}
      contentClassName={panelExpanded ? "max-w-none" : "max-w-6xl"}
    >
      {!panelExpanded ? (
        <Link
          href={ENVIRONMENT_PAGE}
          className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white/80"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to blueprints
        </Link>
      ) : null}

      {!panelExpanded && loadError ? (
        <p className="mb-2 text-xs text-amber-200/90">{loadError}</p>
      ) : null}
      {!panelExpanded && !loaded ? (
        <p className="mb-2 text-xs text-white/40">Loading blueprint…</p>
      ) : null}
      {!panelExpanded && saveError ? (
        <p className="mb-2 text-xs text-amber-200/90">{saveError}</p>
      ) : null}

      <div
        className={cn(
          panelExpanded &&
            "fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A]",
        )}
      >
        {panelExpanded ? (
          <div className="shrink-0 border-b border-white/[0.06] px-8 py-5">
            <Link
              href={ENVIRONMENT_PAGE}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white/80"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back to blueprints
            </Link>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
              Organization blueprint
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Commands that apply to all sessions and run before repo-specific setup.{" "}
              <a
                href={ENVIRONMENT_LEARN_MORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#60A5FA] hover:underline"
              >
                Learn more
              </a>
            </p>
            {saveError ? <p className="mt-2 text-xs text-amber-200/90">{saveError}</p> : null}
          </div>
        ) : null}

        <div
          className={cn(
            panelExpanded && "flex min-h-0 flex-1 flex-col px-8 pb-8 pt-4",
          )}
        >
      <SettingsFlatPanel
        className={cn(
          "!px-0 flex flex-col",
          panelExpanded ? "min-h-0 flex-1" : "min-h-[520px]",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {tab === "editor" ? (
              <button
                type="button"
                onClick={() => setGuideOpen((prev) => !prev)}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-md transition",
                  guideOpen
                    ? "bg-white/[0.08] text-white/85"
                    : "text-white/45 hover:bg-white/[0.06] hover:text-white/80",
                )}
                aria-label={guideOpen ? "Hide guide" : "Show guide"}
              >
                <PanelLeft className="size-4" />
              </button>
            ) : null}
            <SettingsTabPills
            tabs={[
              { id: "editor" as const, label: "Editor" },
              { id: "history" as const, label: "History", count: versions.length || undefined },
              { id: "files" as const, label: "Files", count: blueprintFiles.length || undefined },
              {
                id: "secrets" as const,
                label: "Secrets",
                count: blueprintSecrets.length || undefined,
              },
            ]}
            active={tab}
            onChange={setTab}
          />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPanelExpanded((prev) => !prev)}
              className="inline-flex size-9 items-center justify-center rounded-md text-white/45 transition hover:bg-white/[0.06] hover:text-white/80"
              aria-label={panelExpanded ? "Collapse panel" : "Expand panel"}
            >
              {panelExpanded ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={deleting}
                  className="inline-flex size-9 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                  aria-label="More options"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-50 min-w-[200px] border border-[#2F2F2F] bg-[#0A0A0A] p-1 text-white shadow-2xl"
              >
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <a
                    href={buildGenerateWithDevinAskUrl(ORG_GENERATE_PROMPT)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5 shrink-0 text-white/45" />
                    Generate with Devin
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <a
                    href={ENVIRONMENT_LEARN_MORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5 shrink-0 text-white/45" />
                    Documentation
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  className={cn(dropdownItemClass, "text-red-300/90 focus:text-red-200")}
                  onSelect={() => void handleDelete()}
                >
                  <Trash2 className="size-3.5 shrink-0" />
                  Delete blueprint
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <SettingsSecondaryButton onClick={handleDiscard} disabled={!isDirty || saving}>
              Discard
            </SettingsSecondaryButton>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!isDirty || saving || !loaded}
              className={saveButtonClass}
            >
              {saving ? "Saving…" : "Save blueprint"}
            </button>
          </div>
        </div>

        {tab === "editor" ? (
          <div className={cn("flex min-h-[520px] flex-col", panelBodyClass)}>
            <ContinuityLabBlueprintYamlIde
              value={draftContent}
              onChange={setDraftContent}
              guideOpen={guideOpen}
              fillHeight={panelExpanded}
              repoFullName="your organization"
              placeholder={DEFAULT_BLUEPRINT_YAML}
              className={panelContentMinClass}
            />
          </div>
        ) : null}

        {tab === "history" ? (
          <div
            className={cn(
              "grid min-h-0 grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]",
              panelBodyClass,
            )}
          >
            <aside className="border-b border-white/[0.06] p-3 md:border-b-0 md:border-r">
              {versions.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-white/45">
                  No version history yet. Save the blueprint to create the first version.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {versions.map((version) => {
                    const active = selectedVersion?.id === version.id;
                    return (
                      <li key={version.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedVersionId(version.id)}
                          className={cn(
                            "w-full rounded-md px-3 py-2.5 text-left transition",
                            active
                              ? "bg-white/[0.08] text-white"
                              : "text-white/70 hover:bg-white/[0.04] hover:text-white",
                          )}
                        >
                          <span className="block text-xs font-medium">
                            {formatWhen(version.savedAt)}
                          </span>
                          {version.savedBy ? (
                            <span className="mt-0.5 block truncate text-[11px] text-white/40">
                              {version.savedBy}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>
            <div className={cn("flex min-h-0 flex-col p-4", panelContentMinClass)}>
              {versions.length === 0 || !selectedVersion ? (
                <div className="flex flex-1 items-center justify-center bg-black text-center">
                  <p className="text-sm text-white/45">
                    No version history yet. Save the blueprint to record the first version.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-white/45">
                      Comparing previous version to{" "}
                      <span className="text-white/75">{formatWhen(selectedVersion.savedAt)}</span>
                    </p>
                  </div>
                  <LineDiffView before={diffBefore} after={selectedVersion.content} />
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "files" ? (
          <div className={cn("flex flex-col", panelBodyClass)}>
            <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
              <SettingsToolbar className="gap-3">
                <SettingsSearchInput
                  value={fileSearch}
                  onChange={setFileSearch}
                  placeholder="Search files"
                  className="min-w-[200px] flex-1"
                />
                <input
                  ref={fileUploadRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => void handleFileUpload(e)}
                />
                {uploadingFile ? (
                  <span className="inline-flex h-9 shrink-0 cursor-not-allowed items-center rounded-md border border-white/[0.12] px-3.5 text-sm font-medium text-white/40">
                    Uploading…
                  </span>
                ) : (
                  <SettingsSecondaryButton onClick={() => fileUploadRef.current?.click()}>
                    Upload file
                  </SettingsSecondaryButton>
                )}
              </SettingsToolbar>
            </div>

            <div
              className={cn(
                "relative flex flex-1 flex-col bg-black",
                panelContentMinClass,
                fileDragActive && "ring-2 ring-inset ring-[#2563EB]/40",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setFileDragActive(true);
              }}
              onDragLeave={() => setFileDragActive(false)}
              onDrop={handleFileDrop}
            >
              {blueprintFiles.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm font-semibold text-white">No files attached</p>
                  <p className="mt-2 max-w-md text-sm text-white/45">
                    Drag and drop or click &apos;Upload file&apos; to add one.
                  </p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-6">
                  <p className="text-sm text-white/50">No files match your search.</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.06] overflow-y-auto">
                  {filteredFiles.map((file: LabEnvironmentBlueprintFile) => (
                    <li
                      key={file.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3"
                    >
                      <FileText className="size-4 shrink-0 text-white/35" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{file.name}</p>
                        <p className="mt-0.5 text-[11px] text-white/40">
                          {formatFileSize(file.size)} · {formatWhen(file.uploadedAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {tab === "secrets" ? (
          <div className={cn("flex flex-col", panelBodyClass)}>
            <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
              <SettingsToolbar className="gap-3">
                <SettingsSearchInput
                  value={secretSearch}
                  onChange={setSecretSearch}
                  placeholder="Search secrets"
                  className="min-w-[200px] flex-1"
                />
                <SettingsSecondaryButton onClick={() => setImportSecretsOpen(true)}>
                  Import secrets
                </SettingsSecondaryButton>
                <SettingsSecondaryButton onClick={() => setAddSecretOpen(true)}>
                  Add secret
                </SettingsSecondaryButton>
              </SettingsToolbar>
            </div>

            <div className={cn("flex flex-1 flex-col bg-black", panelContentMinClass)}>
              {blueprintSecrets.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm font-semibold text-white">No secrets found</p>
                  <p className="mt-2 text-sm text-white/45">Add your first secret to get started.</p>
                </div>
              ) : filteredSecrets.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-6">
                  <p className="text-sm text-white/50">No secrets match your search.</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.06] overflow-y-auto">
                  {filteredSecrets.map((secret: LabEnvironmentBlueprintSecret) => (
                    <li
                      key={secret.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm font-medium text-white">
                          {secret.name}
                        </p>
                        {secret.note ? (
                          <p className="mt-0.5 truncate text-xs text-white/45">{secret.note}</p>
                        ) : null}
                      </div>
                      {secret.redacted ? (
                        <span className="shrink-0 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                          Redacted
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </SettingsFlatPanel>
        </div>
      </div>

      <AddSecretModal
        open={addSecretOpen}
        onClose={() => setAddSecretOpen(false)}
        onStore={handleAddSecret}
        storing={storingSecret}
      />

      <ImportSecretsModal
        open={importSecretsOpen}
        onClose={() => setImportSecretsOpen(false)}
        onStore={handleImportSecrets}
        storing={storingSecret}
      />

      {toast ? <BlueprintToast message={toast} onDismiss={() => setToast(null)} /> : null}
    </ContinuityLabSettingsSectionFrame>
  );
}
