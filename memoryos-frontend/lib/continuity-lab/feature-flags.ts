export type ContinuitySessionUiVariant = "mythic" | "classic";

type ContinuitySessionUiMode = "mythic" | "classic" | "rollout";

const FALLBACK_VARIANT: ContinuitySessionUiVariant = "mythic";

function parseMode(value: string | undefined): ContinuitySessionUiMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "classic") return "classic";
  if (normalized === "rollout") return "rollout";
  return "mythic";
}

function parsePercent(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function hashToBucket(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 1000;
  }
  return hash % 100;
}

function normalizeOverride(
  value: string | null | undefined,
): ContinuitySessionUiVariant | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "classic") return "classic";
  if (normalized === "mythic") return "mythic";
  return null;
}

export function resolveContinuitySessionUiVariant(input: {
  conversationId: string;
  override?: string | null;
}): ContinuitySessionUiVariant {
  const manualOverride = normalizeOverride(input.override);
  if (manualOverride) return manualOverride;

  const mode = parseMode(process.env.NEXT_PUBLIC_CONTINUITY_SESSION_UI);
  if (mode === "classic") return "classic";
  if (mode === "mythic") return "mythic";

  const rolloutPercent = parsePercent(
    process.env.NEXT_PUBLIC_CONTINUITY_SESSION_UI_ROLLOUT_PERCENT,
  );
  const bucket = hashToBucket(input.conversationId || "session");
  return bucket < rolloutPercent ? "mythic" : "classic";
}

export function continuityUiFlagSnapshot(): {
  mode: ContinuitySessionUiMode;
  rolloutPercent: number;
  fallback: ContinuitySessionUiVariant;
} {
  return {
    mode: parseMode(process.env.NEXT_PUBLIC_CONTINUITY_SESSION_UI),
    rolloutPercent: parsePercent(
      process.env.NEXT_PUBLIC_CONTINUITY_SESSION_UI_ROLLOUT_PERCENT,
    ),
    fallback: FALLBACK_VARIANT,
  };
}
