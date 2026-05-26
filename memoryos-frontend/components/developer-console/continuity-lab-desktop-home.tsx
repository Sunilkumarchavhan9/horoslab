"use client";

import { FolderOpen } from "lucide-react";
import { isMemoryOsDesktop } from "@/lib/memoryos-desktop";

export function ContinuityLabDesktopHome({
  onOpenFolder,
  githubConnected,
  onConnectGithub,
}: {
  onOpenFolder: () => void;
  githubConnected: boolean;
  onConnectGithub: () => void;
}) {
  if (!isMemoryOsDesktop()) return null;

  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#1e1e1e] px-8">
      <p className="text-2xl font-medium text-[#ececec]">MemoryOS IDE</p>
      <p className="mt-2 max-w-md text-center text-sm text-[#8e8e8e]">
        Open a local project folder. Company Brain loads your plan from memory API
        (Slack, Jira, GitHub) before you code.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={onOpenFolder}
          className="flex w-[200px] flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#252526] px-6 py-8 transition hover:bg-[#2d2d2d]"
        >
          <FolderOpen className="h-10 w-10 text-[#ececec]" />
          <span className="text-sm font-medium text-[#ececec]">Open folder</span>
        </button>
        <button
          type="button"
          onClick={onConnectGithub}
          className="flex w-[200px] flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#252526] px-6 py-8 transition hover:bg-[#2d2d2d]"
        >
          <span className="text-3xl text-[#ececec]" aria-hidden>
            ⌁
          </span>
          <span className="text-sm font-medium text-[#ececec]">
            {githubConnected ? "GitHub connected" : "Connect GitHub"}
          </span>
        </button>
      </div>
      <p className="mt-8 text-xs text-[#6b6b6b]">
        Same workbench as the web app — wired to MemoryOS Cloud APIs.
      </p>
    </div>
  );
}
