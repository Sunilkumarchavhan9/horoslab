"use client";

import { useState } from "react";
import {
  computeLineDiff,
  proposeFileCommit,
  type LabFileChange,
  type RepoRef,
} from "@/lib/continuity-lab-editor";
import { desktopWriteFile } from "@/lib/memoryos-desktop";

export function ContinuityLabFileChanges({
  changes,
  repo,
  githubConnected,
  localWorkspaceRoot,
  onProposed,
  onSavedToDisk,
}: {
  changes: LabFileChange[];
  repo: RepoRef | null;
  githubConnected: boolean;
  localWorkspaceRoot?: string | null;
  onProposed?: () => void;
  onSavedToDisk?: (path: string, content: string) => void;
}) {
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (changes.length === 0) return null;

  async function saveToDisk(change: LabFileChange): Promise<void> {
    if (!localWorkspaceRoot) {
      setMessage("Open a local folder in the IDE first.");
      return;
    }
    setBusyPath(change.path);
    setMessage(null);
    try {
      await desktopWriteFile(localWorkspaceRoot, change.path, change.current);
      setMessage(`Saved ${change.path.split("/").pop()} to disk.`);
      onSavedToDisk?.(change.path, change.current);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save file");
    } finally {
      setBusyPath(null);
    }
  }

  async function proposeOne(change: LabFileChange): Promise<void> {
    if (!repo || !githubConnected) {
      setMessage("Connect GitHub and select a repository to propose commits.");
      return;
    }
    setBusyPath(change.path);
    setMessage(null);
    try {
      const { id } = await proposeFileCommit({
        owner: repo.owner,
        repo: repo.name,
        path: change.path,
        content: change.current,
        branch: repo.defaultBranch,
      });
      setMessage(`Proposal ${id.slice(0, 8)}… created — approve in GitHub write-back below.`);
      onProposed?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not propose commit");
    } finally {
      setBusyPath(null);
    }
  }

  return (
    <div className="border-b border-white/[0.08] p-3">
      <p className="mb-2 text-xs font-medium text-[#8e8e8e]">Local edits</p>
      <ul className="space-y-2">
        {changes.map((c) => {
          const { added, removed } = computeLineDiff(c.original, c.current);
          return (
            <li
              key={c.path}
              className="rounded-md border border-white/[0.06] bg-[#252525] px-3 py-2"
            >
              <p className="truncate font-mono text-[11px] text-[#ececec]">{c.path}</p>
              <p className="mt-1 text-[11px] text-[#8e8e8e]">
                <span className="text-[#10b981]">+{added}</span>{" "}
                <span className="text-[#f87171]">−{removed}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {localWorkspaceRoot ? (
                  <button
                    type="button"
                    disabled={busyPath === c.path}
                    onClick={() => void saveToDisk(c)}
                    className="rounded bg-[#10b981] px-2.5 py-1 text-[10px] font-medium text-[#042f1a] disabled:opacity-40"
                  >
                    {busyPath === c.path ? "Saving…" : "Save to disk"}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={!githubConnected || busyPath === c.path}
                  onClick={() => void proposeOne(c)}
                  className="rounded bg-[#ececec] px-2.5 py-1 text-[10px] font-medium text-[#1a1a1a] disabled:opacity-40"
                >
                  {busyPath === c.path ? "Proposing…" : "Propose commit"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {message ? <p className="mt-2 text-[11px] text-[#8e8e8e]">{message}</p> : null}
    </div>
  );
}
