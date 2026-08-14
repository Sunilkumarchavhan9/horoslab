export type ProductAgent = {
  id: string;
  name: string;
  description: string;
  allowedTools: string[];
  defaultProjectScope?: boolean;
};

export const PRODUCT_AGENTS: ProductAgent[] = [
  {
    id: "memory-engineer",
    name: "Memory Engineer",
    description: "Ingest, extract, and contract-normalize team memory.",
    allowedTools: [
      "POST /api/memory/ingest",
      "POST /api/memory/extract",
      "GET /api/memory/contract-categories",
      "memory.after_model",
    ],
    defaultProjectScope: true,
  },
  {
    id: "engineering-continuity",
    name: "Engineering Continuity",
    description: "Resume, handoff, operational loops, and drift detection.",
    allowedTools: [
      "POST /api/memory/resume",
      "POST /api/memory/handoff",
      "GET /api/memory/resume/brief",
      "GET /api/company-brain/loops",
      "GET /api/company-brain/loops/:id/drift",
      "memory.handoff",
      "memory.before_model",
      "memoryos.preflight",
    ],
    defaultProjectScope: true,
  },
  {
    id: "ide-context",
    name: "AI IDE Context",
    description: "Agent-ready prompts, risky files, and trace guardrails.",
    allowedTools: [
      "GET /api/memory/resume/prompt",
      "POST /api/memory/resume/prompt",
      "memoryos.preflight",
    ],
    defaultProjectScope: true,
  },
];

const AGENT_BY_ID = new Map(PRODUCT_AGENTS.map((agent) => [agent.id, agent]));

export function listProductAgents(): ProductAgent[] {
  return [...PRODUCT_AGENTS];
}

export function getProductAgent(agentId: string): ProductAgent | undefined {
  return AGENT_BY_ID.get(agentId.trim());
}

export function isKnownProductAgent(agentId: string): boolean {
  return AGENT_BY_ID.has(agentId.trim());
}
