import { EpochMissionDetail } from "@/lib/epoch-api";

export type MissionRow = {
 id: string;
 name: string;
 institution: string;
 planner: string;
 status: string;
 risk: string;
 progress: number;
 started: string;
 workers: number;
 evidence: number;
 executionStatus: string;
 verificationDecision: string;
};

export function formatRelativeTime(value?: string): string {
 if (!value) return "Unknown";
 const timestamp = new Date(value).getTime();
 if (!Number.isFinite(timestamp)) return "Unknown";
 const deltaMs = Date.now() - timestamp;
 const absMinutes = Math.abs(Math.round(deltaMs / 60000));
 if (absMinutes < 1) return "Just now";
 if (absMinutes < 60) return `${absMinutes}m ago`;
 const absHours = Math.abs(Math.round(deltaMs / 3600000));
 if (absHours < 24) return `${absHours}h ago`;
 const absDays = Math.abs(Math.round(deltaMs / 86400000));
 return `${absDays}d ago`;
}

export function missionRisk(mission: EpochMissionDetail): string {
 const policy = mission.authorityPolicies?.[0];
 if (policy?.blocked) return "High";
 if (policy?.needsApproval) return "Medium";
 return "Low";
}

export function missionPlanner(mission: EpochMissionDetail): string {
 const planner = mission.executionRun?.planner as { planner?: unknown; model?: unknown; stage?: unknown } | undefined;
 return typeof planner?.planner === "string" ? planner.planner : "Epoch Planner";
}

export function missionProgress(mission: EpochMissionDetail): number {
 switch ((mission.state ?? "").toLowerCase()) {
 case "completed": return 100;
 case "waiting_review": return 85;
 case "running": return 60;
 case "failed": return 100;
 default: return 10;
 }
}
