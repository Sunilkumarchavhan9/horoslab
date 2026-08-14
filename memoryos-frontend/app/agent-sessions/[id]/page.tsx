"use client";

import { useParams } from "next/navigation";
import { ContinuityLabSessionNative } from "@/components/continuity-lab/continuity-lab-session-native";

export default function AgentSessionPage() {
  const params = useParams();
  const raw = params?.id;
  const sessionId = typeof raw === "string" ? decodeURIComponent(raw) : "new";

  return <ContinuityLabSessionNative conversationId={sessionId} />;
}
