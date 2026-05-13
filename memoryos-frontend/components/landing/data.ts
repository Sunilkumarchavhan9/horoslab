export const NAV_LINKS = [
  { label: "What We Do", href: "#what-we-do" },
  { label: "Context Stack", href: "#context-stack" },
  { label: "Under The Hood", href: "#under-the-hood" },
  { label: "Proof", href: "#benchmarks" },
  { label: "Integrate", href: "#developer-experience" },
];

export const CONTEXT_LAYERS = [
  {
    id: "01",
    title: "Memory Contract",
    desc: "Turns conversations into structured memory candidates with extraction and contract scoring.",
    active: true,
  },
  {
    id: "02",
    title: "Memory Graph",
    desc: "Compares candidate memories against stored memories to detect overlap before writing new state.",
  },
  {
    id: "03",
    title: "Context Injection",
    desc: "Retrieves relevant context and reranks by semantic score, type relevance, importance, and recency before model runs.",
  },
  {
    id: "04",
    title: "Memory Evolution",
    desc: "Merges duplicates and evolves memories when stronger follow-up evidence is processed.",
  },
  {
    id: "05",
    title: "Audit Timeline",
    desc: "Explains why memory exists using timeline events, revision diffs, and explain endpoints.",
  },
];

export const BENCHMARK_ROWS = [
  ["Ingest pipeline", "Included", "Extract + score + merge/evolve", "Turns raw messages into durable company memory"],
  ["Retrieval layer", "Included", "Semantic + type + importance + recency", "Reranks memory before continuity injection"],
  ["Continuity routes", "Included", "/continue + /resume", "Helps agents pick up work with usable next-step context"],
  ["Audit layer", "Included", "/timeline + /revisions + /explain", "Shows why memory exists and how it changed"],
  ["Storage options", "Included", "Unified memory + local persistence", "Keeps context accessible across tools and sessions"],
  ["Auth + validation", "Included", "JWT + schema validation", "Keeps the API predictable for real integrations"],
  ["Observability", "Included", "Metrics + health checks", "Makes continuity quality measurable in production"],
  ["Integrations", "Included", "SDK + MCP + HTTP workflow hooks", "Fits directly into existing coding and agent loops"],
];

export const INTEGRATIONS = [
  "TypeScript SDK",
  "MCP adapter",
  "HTTP API",
  "npm registry",
  "OpenAI / GPT",
  "Claude",
  "Gemini",
  "Ollama",
  "Qwen",
  "DeepSeek",
  "Mistral",
  "Llama",
  "LangGraph",
  "LangChain",
  "CrewAI",
  "Custom agents",
  "Control plane",
  "Team workspaces",
  "Timeline + revisions",
  "Continuity routes",
];
