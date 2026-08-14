/** Human-readable relative time for Continuity Lab (e.g. "3 days ago"). */
export function formatLabRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Just now";
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(diff / 86_400_000);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}
