"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  FolderGit2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelLeft,
  Trash2,
  X,
} from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsFlatPanel,
  SettingsSearchInput,
  SettingsSecondaryButton,
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
  loadLabEnvironmentSettingsHybrid,
  loadLabEnvironmentSettingsLocalFallback,
  patchLabEnvironmentSettingsToApi,
  removeEnrolledRepoFromApi,
  saveLabEnvironmentRepoBlueprintToApi,
  uploadLabEnvironmentRepoBlueprintFileToApi,
} from "@/lib/continuity-lab/lab-environment-settings-api";
import {
  LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT,
  type LabEnvironmentSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-environment-settings-events";
import {
  DEFAULT_REPO_BLUEPRINT_YAML,
  buildGenerateWithDevinAskUrl,
  buildRepoGeneratePrompt,
  getRepoBlueprintFromSettings,
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
const MAX_FILE_BYTES = 512 * 1024;

const saveButtonClass =
  "inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-[#F0EFE2] transition hover:bg-[#3B82F6] disabled:opacity-40";

const dropdownItemClass =
  "gap-2.5 rounded-none px-3 py-2 text-xs text-[#F0EFE2]/85 focus:bg-[#141414] focus:text-[#F0EFE2]";

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

function userDisplayName(user: ReturnType<typeof useUser>["user"]): string | null {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  const username = user.username?.trim();
  if (username) return username;
  const email = user.primaryEmailAddress?.emailAddress?.trim();
  return email || null;
}

export function ContinuityLabRepoEnvironmentBlueprintEditor({
  repo,
  embedded = false,
  onClose,
}: {
  repo: string;
  embedded?: boolean;
  onClose?: () => void;
}) {
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const enrolled = settings.enrolledRepos.find((row) => row.repo === repo);
  const included = enrolled?.included ?? false;
  const repoBlueprint = getRepoBlueprintFromSettings(settings, repo);

  const applyRemote = useCallback(
    (next: LabEnvironmentSettings) => {
      const normalized = normalizeLabEnvironmentSettings(next);
      const saved = getRepoBlueprintFromSettings(normalized, repo).content ?? "";
      setSettings(normalized);
      setSavedContent(saved);
      saveLabEnvironmentSettings(normalized, { broadcast: false });
    },
    [repo],
  );

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
        applyRemote(loadLabEnvironmentSettingsLocalFallback(orgId).settings);
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
    const saved = getRepoBlueprintFromSettings(settings, repo).content ?? "";
    setSavedContent(saved);
    setDraftContent(saved.trim() ? saved : DEFAULT_REPO_BLUEPRINT_YAML);
    setInitializedDraft(true);
  }, [loaded, initializedDraft, settings, repo]);

  useEffect(() => {
    function onSettingsChanged(event: Event) {
      const detail = (event as CustomEvent<LabEnvironmentSettingsChangedDetail>).detail;
      if (detail?.settings) {
        const normalized = normalizeLabEnvironmentSettings(detail.settings);
        const saved = getRepoBlueprintFromSettings(normalized, repo).content ?? "";
        setSettings(normalized);
        setSavedContent(saved);
      }
    }
    window.addEventListener(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, onSettingsChanged);
    return () =>
      window.removeEventListener(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, onSettingsChanged);
  }, [repo]);

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

  const isDirty = draftContent !== savedContent;
  const versions = repoBlueprint.versions ?? [];
  const blueprintFiles = repoBlueprint.files ?? [];
  const blueprintSecrets = repoBlueprint.secrets ?? [];

  const selectedVersion: LabEnvironmentBlueprintVersion | null = useMemo(() => {
    if (!versions.length) return null;
    return versions.find((v) => v.id === selectedVersionId) ?? versions[0];
  }, [versions, selectedVersionId]);

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase();
    if (!q) return blueprintFiles;
    return blueprintFiles.filter((file) => file.name.toLowerCase().includes(q));
  }, [blueprintFiles, fileSearch]);

  const filteredSecrets = useMemo(() => {
    const q = secretSearch.trim().toLowerCase();
    if (!q) return blueprintSecrets;
    return blueprintSecrets.filter(
      (secret) =>
        secret.name.toLowerCase().includes(q) ||
        (secret.note?.toLowerCase().includes(q) ?? false),
    );
  }, [blueprintSecrets, secretSearch]);

  async function handleIncludedChange(checked: boolean) {
    const prevIncluded = included;
    const nextRepos = settings.enrolledRepos.map((row) =>
      row.repo === repo ? { ...row, included: checked } : row,
    );
    setSettings((prev) => normalizeLabEnvironmentSettings({ ...prev, enrolledRepos: nextRepos }));
    const saved = await patchLabEnvironmentSettingsToApi({ enrolledRepos: nextRepos });
    if (saved) {
      applyRemote(saved.settings);
      if (checked && !prevIncluded) {
        setToast("Repository added to environment");
      }
    } else {
      setSaveError("Could not update repository inclusion.");
    }
  }

  function handleDiscard() {
    setDraftContent(savedContent);
    setSaveError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const saved = await saveLabEnvironmentRepoBlueprintToApi({
      repo,
      content: draftContent,
      savedBy: userDisplayName(user),
    });
    if (!saved) {
      setSaveError("Could not save blueprint. Check server connection and try again.");
      setSaving(false);
      return;
    }
    const content = getRepoBlueprintFromSettings(saved.settings, repo).content ?? "";
    setSettings(saved.settings);
    setSavedContent(content);
    setDraftContent(content);
    setSaving(false);
    setToast("Blueprint saved");
  }

  async function handleDeleteRepo() {
    if (
      !window.confirm(
        `Remove ${repo} from the environment? This removes the repository from your enrolled list.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    const result = await removeEnrolledRepoFromApi(repo);
    setDeleting(false);
    if (!result) {
      setSaveError("Could not remove repository.");
      return;
    }
    router.push(embedded && onClose ? ENVIRONMENT_PAGE : ENVIRONMENT_PAGE);
    if (embedded && onClose) onClose();
  }

  async function uploadBlueprintFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      window.alert("File must be 512 KB or smaller.");
      return;
    }
    setUploadingFile(true);
    try {
      const content = await file.text();
      const result = await uploadLabEnvironmentRepoBlueprintFileToApi({
        repo,
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

  if (!enrolled && loaded) {
    return (
      <ContinuityLabSettingsSectionFrame
        sectionId="environment"
        titleOverride={repo}
        breadcrumb={[
          { label: "Settings", href: SETTINGS_INDEX_PATH },
          { label: "Environment", href: ENVIRONMENT_PAGE },
          { label: repo },
        ]}
      >
        <Link
          href={ENVIRONMENT_PAGE}
          className="-mt-2 mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to blueprints
        </Link>
        <p className="text-sm text-[#F0EFE2]/55">Repository not found in your environment list.</p>
      </ContinuityLabSettingsSectionFrame>
    );
  }

  const repoPanel = (
    <>
      {!embedded && !panelExpanded ? (
        <Link
          href={ENVIRONMENT_PAGE}
          className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to blueprints
        </Link>
      ) : null}

      {loadError ? <p className="mb-2 text-xs text-amber-200/90">{loadError}</p> : null}
      {!loaded ? <p className="mb-2 text-xs text-[#F0EFE2]/40">Loading blueprint…</p> : null}
      {saveError ? <p className="mb-2 text-xs text-amber-200/90">{saveError}</p> : null}

      <SettingsFlatPanel className="!px-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4">
          <div className="flex items-start gap-3">
            <FolderGit2 className="mt-0.5 size-5 shrink-0 text-[#F0EFE2]/40" aria-hidden />
            <div>
              <p className="text-sm font-medium text-[#F0EFE2]">Include in environment</p>
              <p className="mt-1 text-xs text-[#F0EFE2]/45">
                {included
                  ? "This repository is pre-cloned and set up for new Devin sessions."
                  : "Turn on to pre-clone and set up this repository for new Devin sessions."}
              </p>
            </div>
          </div>
          <SettingsToggle
            checked={included}
            onChange={(checked) => void handleIncludedChange(checked)}
            label="Include in environment"
          />
        </div>

      <div
        className={cn(
          panelExpanded &&
            "fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A]",
        )}
      >
        {panelExpanded ? (
          <div className="shrink-0 border-b border-white/[0.06] px-6 py-4">
            <button
              type="button"
              onClick={() => setPanelExpanded(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back to editor
            </button>
            <h2 className="mt-2 text-lg font-semibold text-[#F0EFE2]">{repo}</h2>
            <p className="mt-1 text-sm text-[#F0EFE2]/45">Runs for sessions on this repository.</p>
          </div>
        ) : null}
        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-md border border-white/[0.08]",
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
                      ? "bg-white/[0.08] text-[#F0EFE2]/85"
                      : "text-[#F0EFE2]/45 hover:bg-white/[0.06] hover:text-[#F0EFE2]/80",
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
                className="inline-flex size-9 items-center justify-center rounded-md text-[#F0EFE2]/45 transition hover:bg-white/[0.06] hover:text-[#F0EFE2]/80"
                aria-label={panelExpanded ? "Collapse panel" : "Expand panel"}
              >
                {panelExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={deleting}
                    className="inline-flex size-9 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] text-[#F0EFE2]/70 transition hover:bg-white/[0.08] hover:text-[#F0EFE2] disabled:opacity-50"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-50 min-w-[200px] border border-[#2F2F2F] bg-[#0A0A0A] p-1 text-[#F0EFE2] shadow-2xl"
                >
                  <DropdownMenuItem asChild className={dropdownItemClass}>
                    <a
                      href={buildGenerateWithDevinAskUrl(buildRepoGeneratePrompt(repo))}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
                      Generate with Devin
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className={dropdownItemClass}>
                    <a
                      href={ENVIRONMENT_LEARN_MORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-3.5 shrink-0 text-[#F0EFE2]/45" />
                      Documentation
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.08]" />
                  <DropdownMenuItem
                    className={cn(dropdownItemClass, "text-red-300/90 focus:text-red-200")}
                    onSelect={() => void handleDeleteRepo()}
                  >
                    <Trash2 className="size-3.5 shrink-0" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <SettingsSecondaryButton onClick={handleDiscard} disabled={!isDirty || saving || !included}>
                Discard
              </SettingsSecondaryButton>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!isDirty || saving || !loaded || !included}
                className={saveButtonClass}
              >
                {saving ? "Saving…" : "Save blueprint"}
              </button>
            </div>
          </div>

          {tab === "editor" ? (
            <ContinuityLabBlueprintYamlIde
              value={draftContent}
              onChange={setDraftContent}
              disabled={!included}
              setupOverlayMessage={
                !included ? "Include this repository to configure setup" : null
              }
              guideOpen={guideOpen}
              fillHeight={panelExpanded}
              repoFullName={repo}
              placeholder={DEFAULT_REPO_BLUEPRINT_YAML}
              className={cn("min-h-[460px]", panelExpanded && "min-h-0 flex-1")}
            />
          ) : null}

          {tab === "history" ? (
            <div className="grid min-h-[460px] grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="border-b border-white/[0.06] p-3 md:border-b-0 md:border-r">
                {versions.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-[#F0EFE2]/45">
                    No version history yet. Save the blueprint to create the first version.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {versions.map((version) => (
                      <li key={version.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedVersionId(version.id)}
                          className={cn(
                            "w-full rounded-md px-3 py-2.5 text-left transition",
                            selectedVersion?.id === version.id
                              ? "bg-white/[0.08] text-[#F0EFE2]"
                              : "text-[#F0EFE2]/70 hover:bg-white/[0.04] hover:text-[#F0EFE2]",
                          )}
                        >
                          <span className="block text-xs font-medium">
                            {formatWhen(version.savedAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
              <div className="p-4">
                {selectedVersion ? (
                  <pre className="min-h-[320px] overflow-auto rounded-md border border-white/[0.06] bg-[#0a0a0a] p-3 font-mono text-[11px] leading-relaxed text-[#F0EFE2]/70">
                    {selectedVersion.content}
                  </pre>
                ) : (
                  <p className="text-sm text-[#F0EFE2]/45">No version history yet.</p>
                )}
              </div>
            </div>
          ) : null}

          {tab === "files" ? (
            <div className="flex min-h-[460px] flex-col">
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void uploadBlueprintFile(file);
                    }}
                  />
                  <SettingsSecondaryButton
                    onClick={() => fileUploadRef.current?.click()}
                    disabled={!included || uploadingFile}
                  >
                    {uploadingFile ? "Uploading…" : "Upload file"}
                  </SettingsSecondaryButton>
                </SettingsToolbar>
              </div>
              <div className="flex flex-1 flex-col bg-black">
                {blueprintFiles.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    <p className="text-sm font-semibold text-[#F0EFE2]">No files attached</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.06] overflow-y-auto">
                    {filteredFiles.map((file: LabEnvironmentBlueprintFile) => (
                      <li key={file.id} className="flex items-center gap-3 px-4 py-3">
                        <FileText className="size-4 shrink-0 text-[#F0EFE2]/35" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#F0EFE2]">{file.name}</p>
                          <p className="mt-0.5 text-[11px] text-[#F0EFE2]/40">
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
            <div className="flex min-h-[460px] flex-col">
              <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
                <SettingsToolbar className="gap-3">
                  <SettingsSearchInput
                    value={secretSearch}
                    onChange={setSecretSearch}
                    placeholder="Search secrets"
                    className="min-w-[200px] flex-1"
                  />
                </SettingsToolbar>
              </div>
              <div className="flex flex-1 flex-col bg-black">
                {blueprintSecrets.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    <p className="text-sm font-semibold text-[#F0EFE2]">No secrets found</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.06] overflow-y-auto">
                    {filteredSecrets.map((secret: LabEnvironmentBlueprintSecret) => (
                      <li key={secret.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-sm font-medium text-[#F0EFE2]">
                            {secret.name}
                          </p>
                        </div>
                        {secret.redacted ? (
                          <span className="shrink-0 rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">
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
        </div>
      </div>
      </SettingsFlatPanel>

      {toast ? <BlueprintToast message={toast} onDismiss={() => setToast(null)} /> : null}
    </>
  );

  if (embedded) {
    return (
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#F0EFE2]">{repo}</p>
            <p className="mt-0.5 text-xs text-[#F0EFE2]/45">
              Runs for sessions on this repository.{" "}
              <a
                href={ENVIRONMENT_LEARN_MORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F0EFE2]/55 underline-offset-2 hover:text-[#F0EFE2]/75 hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-md text-[#F0EFE2]/45 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
              aria-label="Close repository editor"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        {repoPanel}
      </div>
    );
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="environment"
      titleOverride={repo}
      descriptionOverride="Runs for sessions on this repository."
      docHref={ENVIRONMENT_LEARN_MORE_URL}
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Environment", href: ENVIRONMENT_PAGE },
        { label: repo },
      ]}
      contentClassName={panelExpanded ? "max-w-none" : "max-w-6xl"}
    >
      {repoPanel}
    </ContinuityLabSettingsSectionFrame>
  );
}
