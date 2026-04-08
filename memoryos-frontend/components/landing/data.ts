export const NAV_LINKS = [
  { label: "What We Do", href: "#what-we-do" },
  { label: "Context Stack", href: "#context-stack" },
  { label: "Under The Hood", href: "#under-the-hood" },
  { label: "Benchmarks", href: "#benchmarks" },
  { label: "Developer Experience", href: "#developer-experience" },
];

export const CONTEXT_LAYERS = [
  {
    id: "01",
    title: "Developer Profile",
    desc: "Turns developer messages into memory candidates with rule-based extraction and importance scoring.",
    active: true,
  },
  {
    id: "02",
    title: "Memory Graph",
    desc: "Compares candidate memories against stored memories to detect overlap before writing new state.",
  },
  {
    id: "03",
    title: "Continuity Retrieval",
    desc: "Retrieves relevant context and reranks by semantic score, type relevance, importance, and recency.",
  },
  {
    id: "04",
    title: "Memory Evolution",
    desc: "Merges duplicates and evolves memories when stronger follow-up evidence is processed.",
  },
  {
    id: "05",
    title: "Trust Timeline",
    desc: "Explains why a memory exists using timeline events, revision diffs, and explain endpoints.",
  },
];

export const BENCHMARK_ROWS = [
  ["Ingest pipeline", "Included", "Extract + score + merge/evolve", "Turns raw messages into durable developer memory"],
  ["Retrieval layer", "Included", "Semantic + type + importance + recency", "Reranks memories before continuation or resume"],
  ["Continuity routes", "Included", "/continue + /resume", "Helps agents pick up work with usable next-step context"],
  ["Trust layer", "Included", "/timeline + /revisions + /explain", "Shows why memory exists and how it changed"],
  ["Storage options", "Included", "Unified memory + local persistence", "Keeps developer context accessible across tools and sessions"],
  ["Auth + validation", "Included", "JWT + schema validation", "Keeps the API predictable for real integrations"],
  ["Observability", "Included", "Metrics + health checks", "Makes the memory layer measurable in production"],
  ["Developer integrations", "Included", "SDKs + REST + agent workflow hooks", "Fits directly into existing coding and agent loops"],
];

export const INTEGRATIONS = [
  "TypeScript SDK",
  "Python SDK",
  "REST API",
  "npm registry",
  "MCP server",
  "Claude",
  "ChatGPT",
  "Cursor",
  "VS Code",
  "Custom agents",
  "LangChain",
  "LangGraph",
  "Dashboard",
  "Team workspaces",
  "Timeline + revisions",
  "Continue + resume",
];
