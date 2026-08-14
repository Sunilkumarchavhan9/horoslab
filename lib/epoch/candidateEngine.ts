export type EpochCompatibilityStatus = "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN";

export type EpochCandidate = {
  id: string;
  model: Record<string, unknown>;
  runtime: Record<string, unknown>;
  hardware: Record<string, unknown>;
  workload: Record<string, unknown>;
  compatibility: {
    status: EpochCompatibilityStatus;
    reasons: string[];
    checkedAt: string;
    evidence?: string[];
  };
};

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase()) : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function compatibility(model: Record<string, unknown>, runtime: Record<string, unknown>, hardware: Record<string, unknown>, probes?: Record<string, { reachable: boolean; models?: string[]; version?: string | null; evidenceSha256?: string }>): { status: EpochCompatibilityStatus; reasons: string[]; evidence: string[] } {
  const reasons: string[] = [];
  const evidence: string[] = [];
  const requiredVram = Number(model.requiredVramGb);
  const availableVram = Number(hardware.vramGb);
  if (Number.isFinite(requiredVram) && Number.isFinite(availableVram) && availableVram < requiredVram) reasons.push("hardware VRAM is below the model requirement");
  if (hardware.available === false) reasons.push("hardware is not currently available");
  const reserved = Number(hardware.reservedVramGb);
  const capacity = Number(hardware.availableVramGb);
  if (Number.isFinite(capacity) && Number.isFinite(requiredVram) && capacity < requiredVram) reasons.push("available GPU capacity is below the model requirement");
  if (Number.isFinite(reserved) && reserved > 0) evidence.push(`gpu_reserved_vram_gb:${reserved}`);

  const modelRuntimes = strings(model.supportedRuntimes);
  const runtimeName = text(runtime.name).toLowerCase();
  if (modelRuntimes.length > 0 && runtimeName && !modelRuntimes.includes(runtimeName)) reasons.push("runtime is not listed as supported by the model");
  if (modelRuntimes.length > 0 && !runtimeName) reasons.push("runtime identity is missing");

  const modelPrecisions = strings(model.supportedPrecisions);
  const runtimePrecisions = strings(runtime.supportedPrecisions);
  if (modelPrecisions.length > 0 && runtimePrecisions.length > 0 && !modelPrecisions.some((precision) => runtimePrecisions.includes(precision))) reasons.push("model and runtime have no declared precision intersection");

  const probe = runtimeName && probes ? probes[runtimeName] : undefined;
  if (probe) {
    if (probe.evidenceSha256) evidence.push(`runtime_probe:${probe.evidenceSha256}`);
    if (!probe.reachable) reasons.push("runtime health probe failed");
    const requestedModel = text(model.repositoryId || model.model || model.name);
    if (requestedModel && probe.models?.length && !probe.models.includes(requestedModel)) reasons.push("runtime probe did not advertise the requested model");
  }

  if (reasons.length > 0) return { status: "INCOMPATIBLE", reasons, evidence };
  const unknown = [requiredVram, availableVram].some((value) => !Number.isFinite(value)) || !runtimeName || !text(hardware.name) || Boolean(probes && !probe);
  return { status: unknown ? "UNKNOWN" : "COMPATIBLE", reasons: unknown ? ["one or more compatibility facts are unknown"] : [], evidence };
}

export function generateEpochCandidates(input: {
  model?: Record<string, unknown>;
  runtimeOptions?: Array<Record<string, unknown>>;
  hardwareOptions?: Array<Record<string, unknown>>;
  workload?: Record<string, unknown>;
  allowedRuntimes?: string[];
  allowedHardware?: string[];
  maxCandidates?: number;
  capabilityProbes?: Record<string, { reachable: boolean; models?: string[]; version?: string | null; evidenceSha256?: string }>;
}, now = new Date()): EpochCandidate[] {
  const model = input.model ?? {};
  const runtimes = input.runtimeOptions ?? [];
  const hardware = input.hardwareOptions ?? [];
  const allowedRuntimes = new Set((input.allowedRuntimes ?? []).map((item) => item.toLowerCase()));
  const allowedHardware = new Set((input.allowedHardware ?? []).map((item) => item.toLowerCase()));
  const maxCandidates = Math.max(1, Math.min(500, Math.floor(input.maxCandidates ?? 100)));
  const candidates: EpochCandidate[] = [];
  for (const runtime of runtimes) {
    const runtimeName = text(runtime.name).toLowerCase();
    if (allowedRuntimes.size > 0 && !allowedRuntimes.has(runtimeName)) continue;
    for (const machine of hardware) {
      const hardwareName = text(machine.name).toLowerCase();
      if (allowedHardware.size > 0 && !allowedHardware.has(hardwareName)) continue;
      const id = `candidate_${candidates.length + 1}`;
      candidates.push({
        id,
        model: { ...model },
        runtime: { ...runtime },
        hardware: { ...machine },
        workload: { ...(input.workload ?? {}) },
        compatibility: { ...compatibility(model, runtime, machine, input.capabilityProbes), checkedAt: now.toISOString() },
      });
      if (candidates.length >= maxCandidates) return candidates;
    }
  }
  return candidates;
}
