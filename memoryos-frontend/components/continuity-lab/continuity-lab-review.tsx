"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  GitPullRequest,
  MoreHorizontal,
  RefreshCw,
  Search,
  UserRoundPlus,
} from "lucide-react";
import { parseGitHubPrUrl } from "@/lib/continuity-lab/company-model";
import {
  fetchReviewEnrolledReposFromApi,
  loadLabReviewSettingsHybrid,
} from "@/lib/continuity-lab/lab-review-settings-api";
import { readOrgReviewSettingsSnapshot } from "@/lib/continuity-lab/lab-review-settings-runtime";
import type { LabReviewSettings } from "@/lib/continuity-lab/lab-review-settings-storage";
import {
  readReviewStorage,
  saveReviewStorage,
  touchRecentPullRequest,
  type RecentPullRequest,
} from "@/lib/continuity-lab/review-storage";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { useLiveConnectors } from "@/lib/continuity-lab/use-live-connectors";
import { cn } from "@/lib/utils";

function reviewHref(fullName: string, pr: number): string {
  const [owner, ...repoParts] = fullName.split("/");
  return `/continuity-lab/review/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(
    repoParts.join("/") || "repo",
  )}/pull/${pr}`;
}

function defaultPrTitle(entry: Pick<RecentPullRequest, "fullName" | "pr" | "title">): string {
  return entry.title?.trim() || `Review ${entry.fullName} pull request #${entry.pr}`;
}

export function ContinuityLabReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const liveConnectors = useLiveConnectors();
  const { refresh } = useContinuityLab();
  const github = liveConnectors.github;

  const [settings, setSettings] = useState<LabReviewSettings>(() => readOrgReviewSettingsSnapshot());
  const [prUrl, setPrUrl] = useState("");
  const [recentPrs, setRecentPrs] = useState<RecentPullRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = prUrl.trim() ? parseGitHubPrUrl(prUrl) : null;

  useEffect(() => {
    setRecentPrs(readReviewStorage().recentPrs);
    const queryPr = searchParams.get("pr")?.trim();
    if (queryPr) setPrUrl(queryPr);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const enrolled = await fetchReviewEnrolledReposFromApi();
      if (!active) return;
      if (enrolled) {
        setSettings(enrolled.settings);
        return;
      }
      const hybrid = await loadLabReviewSettingsHybrid();
      if (active && hybrid) setSettings(hybrid.settings);
    })();
    return () => {
      active = false;
    };
  }, []);

  const enrolledRepos = settings.enrolledRepos.map((repo) => repo.repo);
  const seededReviewItems = useMemo(() => {
    const fromRecent = recentPrs;
    if (fromRecent.length > 0) return fromRecent;
    const firstRepo = enrolledRepos[0] ?? github.repos[0]?.fullName;
    if (!firstRepo) return [];
    return [
      {
        url: `https://github.com/${firstRepo}/pull/1`,
        fullName: firstRepo,
        pr: 1,
        title: "Validate MemoryOS Review on connected repository",
        visitedAt: new Date().toISOString(),
      },
    ];
  }, [enrolledRepos, github.repos, recentPrs]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), liveConnectors.reload()]);
      setRecentPrs(readReviewStorage().recentPrs);
    } finally {
      setRefreshing(false);
    }
  }

  function openParsedPr() {
    if (!parsed) {
      setError("Paste a valid GitHub pull request URL.");
      return;
    }
    setError(null);
    saveReviewStorage({ selectedRepo: parsed.fullName });
    touchRecentPullRequest({
      url: prUrl.trim(),
      fullName: parsed.fullName,
      pr: parsed.pr,
      title: `Review ${parsed.fullName} pull request #${parsed.pr}`,
    });
    router.push(reviewHref(parsed.fullName, parsed.pr));
  }

  return (
    <div className="flex min-h-full flex-col bg-[#0A0A0A] text-[#F0EFE2]">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[#232323] px-6">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#F0EFE2]"
        >
          All repositories
          <span className="text-[#F0EFE2]/40">⌄</span>
        </button>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="ml-auto inline-flex size-9 items-center justify-center text-[#F0EFE2]/55 hover:text-[#F0EFE2] disabled:opacity-50"
          aria-label="Refresh pull requests"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </button>
        <div className="flex min-w-[22rem] max-w-xl flex-1 items-center gap-2">
          <input
            type="url"
            value={prUrl}
            onChange={(event) => {
              setPrUrl(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") openParsedPr();
            }}
            placeholder="Paste pull request URL"
            className="h-9 min-w-0 flex-1 rounded-md border border-[#2B2B2B] bg-[#161616] px-4 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 outline-none focus:border-[#3B82F6]"
          />
          <button
            type="button"
            onClick={openParsedPr}
            disabled={!parsed}
            className="h-9 rounded-md bg-[#2f5faf] px-4 text-sm font-semibold text-[#F0EFE2] transition hover:bg-[#3b6fc6] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Go to pull request
          </button>
        </div>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center text-[#F0EFE2]/55 hover:text-[#F0EFE2]"
          aria-label="Invite reviewers"
        >
          <UserRoundPlus className="size-4" />
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-[#232323] px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-[#F0EFE2]/62">
            <span className="inline-flex size-4 items-center justify-center rounded-full border border-white/35">
              <span className="size-1.5 rounded-full bg-white/45" />
            </span>
            <span>Waiting for reviewers</span>
          </div>
        </section>

        {error ? (
          <div className="mx-6 mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="divide-y divide-[#191919]">
          {seededReviewItems.length > 0 ? (
            seededReviewItems.map((entry) => (
              <Link
                key={`${entry.fullName}-${entry.pr}-${entry.url}`}
                href={reviewHref(entry.fullName, entry.pr)}
                onClick={() => {
                  touchRecentPullRequest(entry);
                }}
                className="group flex items-center gap-4 px-6 py-6 transition hover:bg-[#101010]"
              >
                <GitPullRequest className="size-5 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-[16px] font-semibold text-[#F0EFE2]">
                      {defaultPrTitle(entry)} #{entry.pr}
                    </p>
                    <Check className="size-4 shrink-0 text-emerald-400" />
                  </div>
                  <p className="mt-1 truncate text-[13px] text-[#F0EFE2]/50">
                    22h · memoryos-github-app · {entry.fullName}
                  </p>
                </div>
                <div className="hidden items-center gap-2 font-mono text-sm sm:flex">
                  <span className="text-emerald-400">+64</span>
                  <span className="text-rose-400">-33</span>
                  <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-[#132f25] text-[10px] text-emerald-300">
                    ✣
                  </span>
                  <MoreHorizontal className="size-5 text-[#F0EFE2]/38 group-hover:text-[#F0EFE2]/70" />
                </div>
              </Link>
            ))
          ) : (
            <div className="flex min-h-[32rem] flex-col items-center justify-center px-6 text-center">
              <Search className="size-9 text-[#F0EFE2]/22" />
              <h1 className="mt-5 text-2xl font-semibold text-[#F0EFE2]">No pull requests yet</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#F0EFE2]/50">
                Connect GitHub, enroll repositories in Review settings, or paste a pull request URL
                above to open the MemoryOS Review workspace.
              </p>
              <Link
                href="/continuity-lab/settings/review"
                className="mt-6 rounded-md border border-[#2F2F2F] bg-[#171717] px-4 py-2 text-sm font-semibold text-[#F0EFE2] hover:bg-[#202020]"
              >
                Review settings
              </Link>
            </div>
          )}
        </section>

        {enrolledRepos.length > 0 ? (
          <div className="px-6 py-5 text-xs text-[#F0EFE2]/40">
            {enrolledRepos.length} enrolled repo{enrolledRepos.length === 1 ? "" : "s"} · governed by
            MemoryOS Review settings.
          </div>
        ) : null}
      </main>
    </div>
  );
}
