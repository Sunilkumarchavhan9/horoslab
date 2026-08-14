import { getOperationalArtifact } from "../operational/artifactStore";

export type TrustGateRunStatus = "pass" | "fail" | "unknown";

export type LastTrustGateRun = {
  status: TrustGateRunStatus;
  profile: string | null;
  ranAt: string | null;
};

type TrustGateReportFile = {
  at?: string;
  profile?: string;
  passed?: boolean;
};

/** Last unified trust:gate result (benchmark + company-brain), if one exists. */
export async function getLastTrustGateRun(): Promise<LastTrustGateRun> {
  const artifact = await getOperationalArtifact<TrustGateReportFile>({
    kind: "trust_gate",
    name: "trust-gate-latest",
  });
  const parsed = artifact?.data;
  if (!parsed || typeof parsed !== "object") {
    return { status: "unknown", profile: null, ranAt: null };
  }
  const status: TrustGateRunStatus =
    typeof parsed.passed === "boolean"
      ? parsed.passed
        ? "pass"
        : "fail"
      : "unknown";
  return {
    status,
    profile: typeof parsed.profile === "string" ? parsed.profile : null,
    ranAt: typeof parsed.at === "string" ? parsed.at : null,
  };
}
