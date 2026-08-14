"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink, FolderGit2, Plus, Search, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  readAskOsPreference,
  saveAskOsPreference,
  type AskOsId,
} from "@/lib/continuity-lab/ask-os-preference";
import {
  readUserDefaultSandboxOs,
  saveOrgDefaultSandboxOs,
  saveUserDefaultSandboxOs,
} from "@/lib/continuity-lab/sandbox-os-defaults";
import { OsBrandIcon } from "@/components/continuity-lab/os-brand-icons";

type ContinuityLabAskContextBarProps = {
  repoCount: number;
  onOpenRepos: () => void;
  advancedHref?: string;
  selectedRepos?: string[];
};

const OS_OPTIONS: Array<{ id: AskOsId; label: string; badge?: string }> = [
  { id: "ubuntu", label: "Ubuntu" },
  { id: "windows", label: "Windows", badge: "New" },
];

const ORG_DEFAULT_SETTINGS_HREF = "/continuity-lab/settings/environment";

type OsDefaultFlyoutProps = {
  open: boolean;
  osId: AskOsId;
  onSetUserDefault: (os: AskOsId) => void;
  onSetOrgDefault: (os: AskOsId) => void;
  onClose: () => void;
};

function OsDefaultFlyout({
  open,
  osId,
  onSetUserDefault,
  onSetOrgDefault,
  onClose,
}: OsDefaultFlyoutProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute left-[calc(100%+6px)] top-1/2 z-50 min-w-[13.75rem] -translate-y-1/2",
        "rounded-md border border-[#2F2F2F] bg-[#141414] py-1.5 shadow-xl",
      )}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        role="menuitem"
        className="block w-full px-3 py-1.5 text-left text-[11px] text-white/85 hover:bg-[#1F1F1F]"
        onClick={() => {
          onSetUserDefault(osId);
          onClose();
        }}
      >
        Set as your default platform
      </button>
      <Link
        href={ORG_DEFAULT_SETTINGS_HREF}
        role="menuitem"
        title="Saved locally until org-wide sandbox defaults are available via API."
        className="block w-full px-3 py-1.5 text-left text-[11px] text-sky-400/95 hover:bg-[#1F1F1F] hover:text-sky-300"
        onClick={() => {
          onSetOrgDefault(osId);
          onClose();
        }}
      >
        Set org-wide default
      </Link>
    </div>
  );
}

type OsDefaultStarButtonProps = {
  osId: AskOsId;
  isUserDefault: boolean;
  showOnRowHoverOnly: boolean;
  flyoutOpen: boolean;
  onOpenFlyout: () => void;
  onToggleFlyout: () => void;
  onCloseFlyout: () => void;
  onSetUserDefault: (os: AskOsId) => void;
  onSetOrgDefault: (os: AskOsId) => void;
};

function OsDefaultStarButton({
  osId,
  isUserDefault,
  showOnRowHoverOnly,
  flyoutOpen,
  onOpenFlyout,
  onToggleFlyout,
  onCloseFlyout,
  onSetUserDefault,
  onSetOrgDefault,
}: OsDefaultStarButtonProps) {
  return (
    <div
      className="relative shrink-0"
      onMouseEnter={onOpenFlyout}
      onMouseLeave={onCloseFlyout}
    >
      <button
        type="button"
        aria-label={
          isUserDefault
            ? "Your default platform — change default"
            : "Set as default platform"
        }
        aria-expanded={flyoutOpen}
        aria-haspopup="menu"
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md transition-colors",
          "hover:bg-[#1F1F1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500/70",
          showOnRowHoverOnly && !isUserDefault && "opacity-0 group-hover/os-row:opacity-100",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFlyout();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Star
          className={cn(
            "size-3.5",
            isUserDefault
              ? "fill-sky-400/90 text-sky-400/90"
              : "text-sky-400/75 group-hover/os-row:text-sky-300/90",
          )}
          strokeWidth={isUserDefault ? 1.5 : 2}
        />
      </button>
      <OsDefaultFlyout
        open={flyoutOpen}
        osId={osId}
        onSetUserDefault={onSetUserDefault}
        onSetOrgDefault={onSetOrgDefault}
        onClose={onCloseFlyout}
      />
    </div>
  );
}

export function ContinuityLabAskContextBar({
  repoCount,
  onOpenRepos,
  advancedHref = "/continuity-lab/capabilities",
  selectedRepos = [],
}: ContinuityLabAskContextBarProps) {
  const [os, setOs] = useState<AskOsId>(() => readAskOsPreference());
  const [userDefaultOs, setUserDefaultOs] = useState<AskOsId>(() => readUserDefaultSandboxOs());
  const [osOpen, setOsOpen] = useState(false);
  const [repoOpen, setRepoOpen] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [starFlyoutOs, setStarFlyoutOs] = useState<AskOsId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const osRef = useRef<HTMLDivElement>(null);
  const repoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!osRef.current?.contains(e.target as Node)) {
        setOsOpen(false);
        setStarFlyoutOs(null);
      }
      if (!repoRef.current?.contains(e.target as Node)) {
        setRepoOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  function selectOs(next: AskOsId) {
    setOs(next);
    saveAskOsPreference(next);
    setOsOpen(false);
    setStarFlyoutOs(null);
  }

  function setUserDefault(next: AskOsId) {
    saveUserDefaultSandboxOs(next);
    setUserDefaultOs(next);
    setOs(next);
    saveAskOsPreference(next);
    showToast(
      `${OS_OPTIONS.find((o) => o.id === next)?.label ?? next} is now your default platform`,
    );
  }

  function setOrgDefault(next: AskOsId) {
    saveOrgDefaultSandboxOs(next);
    showToast(
      "Org default saved locally — configure org-wide sandbox defaults in Environment settings when API is available.",
    );
  }

  const repoLabel = repoCount === 1 ? "1 repository" : `${repoCount} repositories`;
  const selectedOs = OS_OPTIONS.find((o) => o.id === os) ?? OS_OPTIONS[0];
  const displayRepos = selectedRepos.length > 0 ? selectedRepos : [];
  const filteredRepos = repoSearch.trim()
    ? displayRepos.filter((repo) => repo.toLowerCase().includes(repoSearch.trim().toLowerCase()))
    : displayRepos;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-white/55">
      <div ref={repoRef} className="relative">
        <button
          type="button"
          onClick={() => setRepoOpen((value) => !value)}
          className="inline-flex h-6 items-center gap-1.5 rounded-md bg-white/[0.06] px-2 font-medium text-white/80 hover:bg-white/[0.09] hover:text-white"
          aria-expanded={repoOpen}
          aria-haspopup="listbox"
        >
          <FolderGit2 className="size-3.5 text-white/55" />
          <span>{repoLabel}</span>
        </button>
        {repoOpen ? (
          <div
            className="absolute bottom-[calc(100%+8px)] left-0 z-40 w-[25rem] overflow-hidden rounded-md border border-[#2F2F2F] bg-[#1f1f1f] shadow-2xl"
            role="listbox"
            aria-label="Selected repositories"
          >
            <div className="flex h-12 items-center gap-2 border-b border-[#303030] px-4">
              <Search className="size-4 text-white/42" />
              <input
                value={repoSearch}
                onChange={(event) => setRepoSearch(event.target.value)}
                placeholder="Search for a repository"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/42"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filteredRepos.length > 0 ? (
                filteredRepos.map((repo) => {
                  const [owner, name = repo] = repo.split("/");
                  return (
                    <button
                      key={repo}
                      type="button"
                      className="grid w-full grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04]"
                    >
                      <span className="size-4 rounded border border-white/12 bg-transparent" />
                      <span className="min-w-0">
                        <span className="truncate text-sm font-semibold text-white/88">{name}</span>
                        <span className="ml-2 text-xs font-semibold text-white/38">{owner}</span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="px-4 py-4 text-sm text-white/45">
                  {displayRepos.length === 0 ? "No repositories selected." : "No repositories match."}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setRepoOpen(false);
                onOpenRepos();
              }}
              className="flex h-12 w-full items-center justify-between border-t border-[#303030] px-4 text-left text-sm font-semibold text-white/78 hover:bg-white/[0.04] hover:text-white"
            >
              <span className="inline-flex items-center gap-3">
                <Plus className="size-4 text-white/45" />
                Add repositories
              </span>
              <ExternalLink className="size-4 text-white/38" />
            </button>
          </div>
        ) : null}
      </div>

      <span className="text-white/20">·</span>

      <div ref={osRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setOsOpen((v) => !v);
            setStarFlyoutOs(null);
          }}
          className="inline-flex items-center gap-1.5 hover:text-white/80"
          aria-expanded={osOpen}
          aria-haspopup="listbox"
        >
          <OsBrandIcon os={os} className="size-4" />
          <span className="font-medium text-white/75">{selectedOs.label}</span>
          <ChevronDown className="size-3 text-white/40" />
        </button>
        {osOpen ? (
          <div
            className="absolute bottom-[calc(100%+6px)] left-0 z-30 min-w-[12.5rem] overflow-visible rounded-md border border-[#2F2F2F] bg-[#0A0A0A] py-1 shadow-xl"
            role="listbox"
            aria-label="Sandbox operating system"
          >
            {OS_OPTIONS.map((opt) => {
              const isSelected = os === opt.id;
              const isUserDefault = userDefaultOs === opt.id;
              const flyoutOpen = starFlyoutOs === opt.id;
              return (
                <div key={opt.id} className="group/os-row relative">
                  <div
                    className={cn(
                      "flex w-full items-center gap-0.5 pr-1",
                      isSelected && "bg-[#141414]",
                      "hover:bg-[#141414]",
                    )}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOs(opt.id)}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-xs",
                        isSelected ? "text-white" : "text-white/70",
                      )}
                    >
                      <OsBrandIcon os={opt.id} className="size-4" muted={!isSelected} />
                      <span>{opt.label}</span>
                      {opt.badge ? (
                        <span className="rounded bg-[#4338CA]/30 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-200">
                          {opt.badge}
                        </span>
                      ) : null}
                    </button>
                    <OsDefaultStarButton
                      osId={opt.id}
                      isUserDefault={isUserDefault}
                      showOnRowHoverOnly={opt.id === "windows"}
                      flyoutOpen={flyoutOpen}
                      onOpenFlyout={() => setStarFlyoutOs(opt.id)}
                      onToggleFlyout={() =>
                        setStarFlyoutOs((current) => (current === opt.id ? null : opt.id))
                      }
                      onCloseFlyout={() =>
                        setStarFlyoutOs((current) => (current === opt.id ? null : current))
                      }
                      onSetUserDefault={setUserDefault}
                      onSetOrgDefault={setOrgDefault}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        {toast ? (
          <div
            className="absolute bottom-[calc(100%+6px)] left-0 z-50 max-w-[18rem] rounded-md border border-[#2F2F2F] bg-[#141414] px-3 py-2 text-[11px] text-white/85 shadow-xl"
            role="status"
          >
            {toast}
          </div>
        ) : null}
      </div>

      <span className="text-white/20">·</span>

      <Link
        href="/continuity-lab/settings/plans"
        className="text-indigo-300/90 hover:text-indigo-200"
      >
        Upgrade plan
      </Link>

      <span className="text-white/20">·</span>

      <Link
        href={advancedHref}
        className="inline-flex items-center gap-0.5 font-medium text-white/70 hover:text-white"
      >
        Advanced capabilities
        <ChevronRight className="size-3.5" />
      </Link>
    </div>
  );
}
