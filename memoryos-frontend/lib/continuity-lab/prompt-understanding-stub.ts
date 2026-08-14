/**
 * Client-side understanding summary for confirm-before-work (no LLM).
 * Full LLM paraphrase can replace summarizePromptForUnderstanding later.
 */

export type PromptUnderstandingSummary = {
  headline: string;
  bullets: string[];
};

function splitIntoSentences(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const line of lines) {
    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      chunks.push(line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim());
      continue;
    }
    const parts = line
      .split(/(?<=[.!?])\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 8);
    chunks.push(...(parts.length ? parts : [line]));
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const chunk of chunks) {
    const key = chunk.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(chunk);
  }
  return unique.slice(0, 8);
}

export function summarizePromptForUnderstanding(prompt: string): PromptUnderstandingSummary {
  const trimmed = prompt.trim();
  const bullets = splitIntoSentences(trimmed);
  const headline =
    bullets[0]?.length > 120 ? `${bullets[0].slice(0, 117)}…` : bullets[0] || trimmed.slice(0, 120);

  return {
    headline: headline || "Your request",
    bullets: bullets.length > 0 ? bullets : [trimmed || "No prompt text"],
  };
}

export function formatUnderstandingForSystemSuffix(summary: PromptUnderstandingSummary): string {
  const lines = summary.bullets.map((b) => `- ${b}`).join("\n");
  return [
    "The user enabled MemoryOS confirm-before-work and approved this understanding summary before the session started:",
    lines,
    "Proceed with their goal; do not repeat the full confirmation gate unless they change direction.",
  ].join("\n");
}
