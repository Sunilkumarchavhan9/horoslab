/**
 * Lightweight prompt expansion stub (no LLM) for Ask "Improve prompt".
 */

export function improvePromptStub(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return [
      "Goal: ",
      "Context: (repo, recent PRs, incidents)",
      "Constraints: (governance, no prod writes without approval)",
      "Done when: ",
    ].join("\n");
  }

  if (trimmed.includes("Goal:") || trimmed.includes("Done when:")) {
    return trimmed;
  }

  return [
    `Goal: ${trimmed}`,
    "",
    "Context: Use MemoryOS company memory, resume brief, and connected repo scope.",
    "Constraints: Follow governance for external writes; cite risky files when proposing edits.",
    "Done when: The outcome is verified (tests, review, or documented handoff).",
  ].join("\n");
}
