"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Info,
  KeyRound,
  Search,
  X,
} from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import { SettingsToggle } from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { addLabEnvironmentBlueprintSecretToApi } from "@/lib/continuity-lab/lab-environment-settings-api";
import {
  createLabKnowledgeFolder as createLabKnowledgeFolderToApi,
  createLabKnowledgeItem as createLabKnowledgeItemToApi,
  fetchLabKnowledgeSettings,
  patchLabKnowledgeItem,
  patchLabKnowledgeSettings,
  type LabKnowledgeSettings,
} from "@/lib/continuity-lab/lab-knowledge-settings-api";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";

type KnowledgeTab = "organization" | "suggestions";
type DetailTab = "details" | "usage";
type KnowledgeRow = {
  id: string;
  name: string;
  author: string;
  createdAt: string;
  folder: boolean;
  enabled: boolean;
  parentId?: string;
  description?: string;
  content?: string;
  trigger?: string;
};

const EMPTY_KNOWLEDGE_SETTINGS: LabKnowledgeSettings = {
  adminOnlySuggestions: false,
  folders: [],
  items: [],
  suggestions: [],
};

function KnowledgeTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white"
          : "px-3 py-2 text-sm font-semibold text-white/45 hover:text-white/70"
      }
    >
      {children}
    </button>
  );
}

function ModalClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white"
      aria-label="Close"
    >
      <X className="size-4" />
    </button>
  );
}

function SecretSidePanel({
  open,
  onClose,
  onStore,
  storing,
  error,
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
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [redacted, setRedacted] = useState(true);

  if (!open) return null;

  const canStore = name.trim().length > 0 && value.length > 0 && !storing;

  return (
    <aside className="fixed bottom-0 right-0 top-0 z-[80] w-full max-w-[480px] border-l border-white/[0.08] bg-[#111111] p-6 text-white shadow-2xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>
      <h2 className="text-lg font-semibold">New organization secret</h2>
      <p className="mt-1 text-sm text-white/45">Available to all MemoryOS sessions.</p>

      <div className="mt-7 rounded-md border border-[#3B82F6]/25 border-l-[#3B82F6] border-l-4 bg-white/[0.04] px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Info className="size-4 text-[#3B82F6]" />
          Notice
        </p>
        <p className="mt-2 text-sm text-white/50">
          This secret is stored through the MemoryOS environment secret API.
        </p>
      </div>

      <label className="mt-5 block text-sm font-semibold text-white/80">Secret type</label>
      <select
        disabled
        className="mt-2 h-9 rounded-md border border-white/[0.08] bg-[#1f1f1f] px-3 text-sm text-white/60"
      >
        <option>key-value</option>
      </select>

      <label className="mt-5 flex items-center gap-1 text-sm font-semibold text-white/80">
        Secret name <Info className="size-3.5 text-white/40" />
      </label>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="EXAMPLE_API_KEY"
        className="mt-2 h-9 w-full rounded-md border border-white/[0.08] bg-[#1f1f1f] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
      />

      <label className="mt-5 block text-sm font-semibold text-white/80">Secret value</label>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="sk-example1234"
        className="mt-2 min-h-[160px] w-full resize-y rounded-md border border-white/[0.08] bg-[#1f1f1f] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
      />

      <label className="mt-5 block text-sm font-semibold text-white/80">Note</label>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional. What additional info would be useful?"
        className="mt-2 min-h-[70px] w-full resize-y rounded-md border border-white/[0.08] bg-[#1f1f1f] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
      />

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white/80">Redact value</p>
          <p className="text-xs text-white/45">Hide this secret&apos;s value in the control plane.</p>
        </div>
        <SettingsToggle checked={redacted} onChange={setRedacted} label="Redact value" />
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={!canStore}
          onClick={() =>
            void onStore({
              name: name.trim(),
              value,
              note: note.trim(),
              redacted,
            })
          }
          className="h-9 rounded-md bg-[#2F6FEA] px-3.5 text-sm font-semibold text-white hover:bg-[#3B82F6] disabled:opacity-45"
        >
          {storing ? "Storing..." : "Store secret"}
        </button>
      </div>
    </aside>
  );
}

export function ContinuityLabOrgKnowledgeSettingsSection() {
  const { connector } = useContinuityLab();
  const repos = connector.payload.github.repos.map((repo) => repo.fullName);
  const [tab, setTab] = useState<KnowledgeTab>("organization");
  const [detailTab, setDetailTab] = useState<DetailTab>("details");
  const [settings, setSettings] = useState<LabKnowledgeSettings>(EMPTY_KNOWLEDGE_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [storingSecret, setStoringSecret] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [knowledgeName, setKnowledgeName] = useState("");
  const [knowledgeBody, setKnowledgeBody] = useState("");
  const [macro, setMacro] = useState("");
  const [folder, setFolder] = useState("root");
  const [repo, setRepo] = useState("None");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      const response = await fetchLabKnowledgeSettings();
      if (cancelled) return;
      if (response?.settings) {
        setSettings(response.settings);
      } else {
        setLoadError("Could not load knowledge settings from backend.");
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allRows = useMemo<KnowledgeRow[]>(
    () => [
      ...settings.folders.map((folderRow) => ({
        id: folderRow.id,
        name: folderRow.name,
        author: folderRow.author ?? "-",
        createdAt: new Date(folderRow.createdAt).toLocaleDateString(),
        folder: true,
        enabled: true,
        description: folderRow.description ?? undefined,
      })),
      ...settings.items.map((item) => ({
        id: item.id,
        name: item.name,
        author: item.author ?? "-",
        createdAt: new Date(item.createdAt).toLocaleDateString(),
        folder: false,
        enabled: item.enabled,
        parentId: item.folderId ?? undefined,
        content: item.content,
        trigger: item.trigger ?? undefined,
      })),
    ],
    [settings.folders, settings.items],
  );
  const selected = allRows.find((row) => row.id === selectedId && !row.folder) ?? null;

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) return allRows.filter((row) => row.name.toLowerCase().includes(q));
    return allRows.filter((row) => !row.parentId || expandedFolders[row.parentId]);
  }, [allRows, expandedFolders, search]);

  function isEnabled(row: KnowledgeRow) {
    return row.enabled;
  }

  async function toggleEnabled(id: string, checked: boolean) {
    setSaveError(null);
    const response = await patchLabKnowledgeItem(id, { enabled: checked });
    if (response?.settings) {
      setSettings(response.settings);
      return;
    }
    setSaveError("Could not update knowledge item.");
  }

  function toggleFolder(id: string) {
    setExpandedFolders((current) => ({ ...current, [id]: !current[id] }));
  }

  async function createFolder() {
    const name = folderName.trim();
    if (!name) return;
    setSaveError(null);
    const response = await createLabKnowledgeFolderToApi({
      name,
      description: folderDescription.trim() || null,
    });
    if (!response?.settings) {
      setSaveError("Could not create folder.");
      return;
    }
    setSettings(response.settings);
    setFolderName("");
    setFolderDescription("");
    setFolderOpen(false);
  }

  async function createKnowledge() {
    const name = knowledgeName.trim();
    if (!name || !knowledgeBody.trim()) return;
    setSaveError(null);
    const response = await createLabKnowledgeItemToApi({
      name,
      content: knowledgeBody.trim(),
      trigger: macro.trim() || null,
      folderId: folder === "root" ? null : folder,
      repo: repo === "None" ? null : repo,
    });
    if (!response?.settings) {
      setSaveError("Could not create knowledge.");
      return;
    }
    setSettings(response.settings);
    setKnowledgeName("");
    setKnowledgeBody("");
    setMacro("");
    setFolder("root");
    setRepo("None");
    setKnowledgeOpen(false);
  }

  async function storeSecret(input: {
    name: string;
    value: string;
    note: string;
    redacted: boolean;
  }) {
    setStoringSecret(true);
    setSecretError(null);
    const result = await addLabEnvironmentBlueprintSecretToApi({
      name: input.name,
      value: input.value,
      note: input.note || null,
      redacted: input.redacted,
    });
    setStoringSecret(false);
    if (!result) {
      setSecretError("Could not store secret. Check backend connection.");
      return;
    }
    setSecretOpen(false);
  }

  async function updateAdminOnly(next: boolean) {
    setSaveError(null);
    const response = await patchLabKnowledgeSettings({ adminOnlySuggestions: next });
    if (response?.settings) {
      setSettings(response.settings);
      return;
    }
    setSaveError("Could not update knowledge settings.");
  }

  if (selected) {
    return (
      <ContinuityLabSettingsSectionFrame
        sectionId="knowledge"
        titleOverride="Knowledge"
        descriptionOverride="MemoryOS recalls relevant knowledge automatically during sessions."
        contentClassName="max-w-[1010px]"
        breadcrumb={[
          { label: "Settings", href: SETTINGS_INDEX_PATH },
          { label: "Knowledge" },
        ]}
      >
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="-mt-2 text-xs font-medium text-white/50 hover:text-white/80"
        >
          Back to knowledge
        </button>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-white/50">
            <span>{selected.author}</span>
            <span>•</span>
            <span>{selected.createdAt}</span>
          <SettingsToggle
            checked={isEnabled(selected)}
            onChange={(checked) => void toggleEnabled(selected.id, checked)}
            label="Enabled in your sessions"
          />
            <span className="text-white">Enabled in your sessions</span>
            <Info className="size-3.5 text-white/40" />
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          <KnowledgeTabButton active={detailTab === "details"} onClick={() => setDetailTab("details")}>
            Details
          </KnowledgeTabButton>
          <KnowledgeTabButton active={detailTab === "usage"} onClick={() => setDetailTab("usage")}>
            Usage
          </KnowledgeTabButton>
        </div>

        {detailTab === "details" ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-md border border-white/[0.08] border-l-[#3B82F6] border-l-4 bg-[#1a1a1a] px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <Info className="size-4 text-[#3B82F6]" />
                Stored knowledge
              </p>
              <p className="mt-2 text-sm text-white/55">
                This knowledge is loaded from the MemoryOS backend for this organization.
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-white">Content</p>
              <div className="relative">
                <pre className="min-h-[420px] whitespace-pre-wrap rounded-md border border-white/[0.08] bg-[#1f1f1f] p-4 pb-10 font-sans text-sm leading-relaxed text-white">
                  {selected.content}
                </pre>
                <button
                  type="button"
                  onClick={() => setSecretOpen(true)}
                  className="absolute bottom-3 left-3 inline-flex size-7 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white"
                  aria-label="Create organization secret"
                >
                  <KeyRound className="size-4" />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-white">Trigger</p>
              <div className="min-h-[104px] rounded-md border border-white/[0.08] bg-[#1f1f1f] p-3 text-sm text-white">
                {selected.trigger}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-7">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Session usage by day</p>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 rounded bg-emerald-300" /> Retrieved <Info className="size-3.5" />
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 rounded bg-indigo-400" /> Used <Info className="size-3.5" />
                </span>
              </div>
            </div>
            <div className="flex min-h-[400px] items-center justify-center rounded-md border border-white/[0.08] bg-[#1f1f1f] text-sm text-white/45">
              No usage data available for the last 30 days
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-white">Sessions</p>
              <div className="flex min-h-[200px] items-center justify-center rounded-md border border-white/[0.08] bg-[#1f1f1f] text-sm text-white/45">
                No sessions found
              </div>
            </div>
          </div>
        )}
        <SecretSidePanel
          open={secretOpen}
          onClose={() => setSecretOpen(false)}
          onStore={storeSecret}
          storing={storingSecret}
          error={secretError}
        />
      </ContinuityLabSettingsSectionFrame>
    );
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="knowledge"
      titleOverride="Knowledge"
      descriptionOverride="MemoryOS recalls relevant knowledge automatically during sessions."
      contentClassName="max-w-[1280px]"
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Knowledge" },
      ]}
      docHref="https://docs.memoryos.dev/continuity-lab/knowledge"
      docLabel="documentation"
    >
      <Link
        href={SETTINGS_INDEX_PATH}
        className="-mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80"
      >
        Back to organization
      </Link>
      {!loaded ? <p className="text-sm text-white/45">Loading knowledge...</p> : null}
      {loadError ? <p className="text-sm text-red-300">{loadError}</p> : null}
      {saveError ? <p className="text-sm text-red-300">{saveError}</p> : null}

      <section className="rounded-md border border-white/[0.07] bg-[#1a1a1a] px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Admin-only knowledge suggestions</p>
            <p className="mt-1 text-sm text-white/50">
              Restrict knowledge suggestion approval to admins
            </p>
          </div>
            <SettingsToggle
              checked={settings.adminOnlySuggestions}
              onChange={(checked) => void updateAdminOnly(checked)}
              label="Admin-only knowledge suggestions"
            />
        </div>
      </section>

      <div className="mt-8 flex items-center gap-2">
        <KnowledgeTabButton active={tab === "organization"} onClick={() => setTab("organization")}>
          Organization <span className="ml-1 text-white/45">{allRows.length}</span>
        </KnowledgeTabButton>
        <KnowledgeTabButton active={tab === "suggestions"} onClick={() => setTab("suggestions")}>
          Suggestions <span className="ml-1 text-white/45">0</span>
        </KnowledgeTabButton>
      </div>

      {tab === "organization" ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[560px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search for knowledge..."
                className="h-9 w-full rounded-md border border-white/[0.08] bg-[#1f1f1f] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFolderOpen(true)}
                className="inline-flex h-9 items-center rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-semibold text-white/90 hover:bg-white/[0.08]"
              >
                New folder
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-[#2F6FEA] px-3.5 text-sm font-semibold text-white hover:bg-[#3B82F6]"
                  >
                    Add knowledge
                    <ChevronDown className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[190px] rounded-md border border-white/[0.08] bg-[#1f1f1f] p-1 text-white"
                >
                  <DropdownMenuItem
                    className="rounded px-2 py-2 text-sm focus:bg-white/[0.06]"
                    onSelect={() => setKnowledgeOpen(true)}
                  >
                    Create knowledge
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded px-2 py-2 text-sm focus:bg-white/[0.06]">
                    Import file
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-md border border-white/[0.07] bg-[#1a1a1a]">
            <div className="grid grid-cols-[minmax(320px,1fr)_150px_180px_220px] bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white">
              <span>Name ↑</span>
              <span>Author</span>
              <span>Created at</span>
              <span className="inline-flex items-center gap-1">
                Enabled in your sessions <Info className="size-3.5 text-white/45" />
              </span>
            </div>
            {visibleRows.map((row) => (
              <div
                key={row.id}
                className={
                  row.folder
                    ? "border-t border-white/[0.06] bg-white/[0.03] text-sm text-white/55"
                    : "grid grid-cols-[minmax(320px,1fr)_150px_180px_220px] items-center border-t border-white/[0.06] px-5 py-3 text-sm text-white/55"
                }
              >
                {row.folder ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleFolder(row.id)}
                      className="grid w-full grid-cols-[minmax(320px,1fr)_150px_180px_220px] items-center px-5 py-4 text-left"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {expandedFolders[row.id] ? (
                          <ChevronDown className="size-4 text-white/45" />
                        ) : (
                          <ChevronRight className="size-4 text-white/45" />
                        )}
                        <Folder className="size-4 text-white/45" />
                        <span className="truncate font-semibold text-white">{row.name}</span>
                      </span>
                      <span>{row.author}</span>
                      <span>{row.createdAt}</span>
                      <span />
                    </button>
                    {expandedFolders[row.id] && row.description ? (
                      <p className="px-[96px] pb-4 text-sm text-white/55">{row.description}</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(row.id);
                        setDetailTab("details");
                      }}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <KeyRound className="size-4 text-white/45" />
                      <span className="truncate font-semibold">{row.name}</span>
                    </button>
                    <span>{row.author}</span>
                    <span>{row.createdAt}</span>
                    <SettingsToggle
                      checked={isEnabled(row)}
                      onChange={(checked) => void toggleEnabled(row.id, checked)}
                      label={`Enable ${row.name}`}
                    />
                  </>
                )}
              </div>
            ))}
            {loaded && visibleRows.length === 0 ? (
              <div className="flex min-h-[120px] items-center justify-center border-t border-white/[0.06] text-sm font-semibold text-white/45">
                {search.trim() ? "No knowledge matches your search." : "No knowledge has been added yet."}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="mt-5 relative w-full max-w-[560px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by user name or email"
              className="h-9 w-full rounded-md border border-white/[0.08] bg-[#1f1f1f] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/20"
            />
          </div>
          <div className="mt-5 overflow-hidden rounded-md border border-white/[0.07] bg-[#1a1a1a]">
            <div className="grid grid-cols-5 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white">
              <span>Trigger</span>
              <span>Content</span>
              <span>User</span>
              <span>Suggested on</span>
              <span>Suggested folder</span>
            </div>
            {settings.suggestions.length === 0 ? (
              <div className="flex min-h-[122px] items-center justify-center border-t border-white/[0.06] text-sm font-semibold text-white/45">
                No suggestions found
              </div>
            ) : (
              settings.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="grid grid-cols-5 border-t border-white/[0.06] px-5 py-3 text-sm text-white/55"
                >
                  <span>{suggestion.trigger}</span>
                  <span className="truncate">{suggestion.content}</span>
                  <span>{suggestion.user ?? "-"}</span>
                  <span>{new Date(suggestion.suggestedOn).toLocaleDateString()}</span>
                  <span>{suggestion.suggestedFolder ?? "-"}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100vw-2rem)] rounded-md border border-white/[0.1] bg-[#1f1f1f] p-6 text-white shadow-2xl shadow-black/50 sm:max-w-[750px]"
        >
          <ModalClose onClick={() => setFolderOpen(false)} />
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Create folder</DialogTitle>
          </DialogHeader>
          <label className="mt-2 block text-sm font-semibold text-white/85">Name</label>
          <input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="Folder name"
            className="mt-2 h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
          />
          <label className="mt-4 block text-sm font-semibold text-white/85">Description</label>
          <textarea
            value={folderDescription}
            onChange={(event) => setFolderDescription(event.target.value)}
            placeholder="Folder description"
            className="mt-2 min-h-[108px] w-full resize-y rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
          />
          <p className="text-sm font-semibold text-white/40">
            Descriptions help MemoryOS automatically organize knowledge
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFolderOpen(false)}
              className="h-9 rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-semibold text-white/85 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createFolder}
              disabled={!folderName.trim()}
              className="h-9 rounded-md bg-[#2F6FEA] px-3.5 text-sm font-semibold text-white hover:bg-[#3B82F6] disabled:opacity-45"
            >
              Create folder
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={knowledgeOpen} onOpenChange={setKnowledgeOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-none border-l border-white/[0.08] bg-[#111111] p-8 text-white shadow-2xl sm:max-w-[720px]"
        >
          <ModalClose onClick={() => setKnowledgeOpen(false)} />
          <DialogHeader className="border-b border-white/[0.08] pb-6">
            <DialogTitle className="text-xl font-semibold text-white">
              Knowledge creation
            </DialogTitle>
          </DialogHeader>
          <label className="mt-5 block text-sm font-semibold text-white/85">Name</label>
          <input
            value={knowledgeName}
            onChange={(event) => setKnowledgeName(event.target.value)}
            placeholder="Name your knowledge"
            className="mt-2 h-9 w-full rounded-md border border-white/[0.12] bg-[#1f1f1f] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#38BDF8]"
          />
          <label className="mt-6 block text-sm font-semibold text-white/85">Contents</label>
          <textarea
            value={knowledgeBody}
            onChange={(event) => setKnowledgeBody(event.target.value)}
            placeholder="Write your knowledge here..."
            className="mt-2 min-h-[320px] w-full resize-y rounded-md border border-white/[0.08] bg-[#1f1f1f] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
          />
          <label className="mt-6 flex items-center gap-1 text-sm font-semibold text-white/85">
            Macro <span className="text-white/40">(optional)</span>
            <Info className="size-3.5 text-white/40" />
          </label>
          <input
            value={macro}
            onChange={(event) => setMacro(event.target.value)}
            placeholder="macro-name"
            className="mt-2 h-9 w-full rounded-md border border-white/[0.08] bg-[#1f1f1f] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
          />
          <label className="mt-6 block text-sm font-semibold text-white/85">Folder</label>
          <select
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            className="mt-2 h-9 rounded-md border border-white/[0.08] bg-[#1f1f1f] px-3 text-sm font-semibold text-white outline-none"
          >
            <option value="root">Root Folder</option>
            {settings.folders.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </select>
          <label className="mt-6 flex items-center gap-1 text-sm font-semibold text-white/85">
            Pin to repository <span className="text-white/40">(optional)</span>
            <Info className="size-3.5 text-white/40" />
          </label>
          <select
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            className="mt-2 h-9 w-full rounded-md border border-white/[0.08] bg-[#1f1f1f] px-3 text-sm font-semibold text-white outline-none"
          >
            <option>None</option>
            <option>All sessions</option>
            {repos.map((repoName) => (
              <option key={repoName}>{repoName}</option>
            ))}
          </select>
          <div className="mt-8 flex gap-2">
            <button
              type="button"
              onClick={createKnowledge}
              disabled={!knowledgeName.trim() || !knowledgeBody.trim()}
              className="h-9 rounded-md bg-[#2F6FEA] px-3.5 text-sm font-semibold text-white hover:bg-[#3B82F6] disabled:opacity-45"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setKnowledgeOpen(false)}
              className="h-9 rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-semibold text-white/85 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </ContinuityLabSettingsSectionFrame>
  );
}
