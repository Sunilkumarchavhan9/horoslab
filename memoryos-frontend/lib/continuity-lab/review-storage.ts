/**
 * Session persistence for Continuity Lab Review (selected repo, recent PRs).
 */

export type RecentPullRequest = {
  url: string;
  fullName: string;
  pr: number;
  title?: string;
  visitedAt: string;
};

export type ReviewStorageState = {
  selectedRepo: string | null;
  recentPrs: RecentPullRequest[];
};

const STORAGE_KEY = "memoryos.continuity-lab.review";

const DEFAULT_STATE: ReviewStorageState = {
  selectedRepo: null,
  recentPrs: [],
};

export function readReviewStorage(): ReviewStorageState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<ReviewStorageState>;
    return {
      selectedRepo:
        typeof parsed.selectedRepo === "string" && parsed.selectedRepo.includes("/")
          ? parsed.selectedRepo
          : null,
      recentPrs: Array.isArray(parsed.recentPrs)
        ? parsed.recentPrs
            .filter(
              (entry): entry is RecentPullRequest =>
                Boolean(entry) &&
                typeof entry === "object" &&
                typeof (entry as RecentPullRequest).url === "string" &&
                typeof (entry as RecentPullRequest).fullName === "string" &&
                typeof (entry as RecentPullRequest).pr === "number" &&
                Number.isFinite((entry as RecentPullRequest).pr),
            )
            .slice(0, 12)
        : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveReviewStorage(partial: Partial<ReviewStorageState>): ReviewStorageState {
  const next = { ...readReviewStorage(), ...partial };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function touchRecentPullRequest(entry: Omit<RecentPullRequest, "visitedAt">): RecentPullRequest[] {
  const normalized: RecentPullRequest = {
    ...entry,
    visitedAt: new Date().toISOString(),
  };
  const prev = readReviewStorage().recentPrs.filter(
    (item) => !(item.fullName === normalized.fullName && item.pr === normalized.pr),
  );
  const next = [normalized, ...prev].slice(0, 12);
  saveReviewStorage({ recentPrs: next, selectedRepo: normalized.fullName });
  return next;
}

export function formatPrLabel(entry: RecentPullRequest): string {
  const title = entry.title?.trim();
  if (title) return `#${entry.pr} · ${title}`;
  return `#${entry.pr}`;
}
