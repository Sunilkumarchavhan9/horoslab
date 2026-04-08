"use client";

import { useState } from "react";
import { INTEGRATIONS } from "./data";
import { Reveal } from "./motion";

type SetupTab = "typescript" | "python" | "rest";

const TAB_COPY: Record<
  SetupTab,
  {
    label: string;
    intro: string;
    code: string;
  }
> = {
  typescript: {
    label: "TypeScript",
    intro:
      "Use the MemoryOS SDK from a TypeScript app, agent wrapper, IDE extension, or internal service.",
    code: `import { MemoryOS } from "@memoryos/sdk";

const memory = new MemoryOS({
  apiKey: process.env.MEMORYOS_API_KEY!,
});

await memory.process({
  threadId: "cursor-session-14",
  message: "Using Cursor with Claude on the retrieval refactor.",
});

const context = await memory.resume({
  project: "MemoryOS",
  question: "Where did I leave off on retrieval ranking?",
  topK: 5,
});`,
  },
  python: {
    label: "Python",
    intro:
      "The Python SDK plugs into notebooks, services, and Python-based agents with the same memory model.",
    code: `from memoryos import MemoryOS

memory = MemoryOS(api_key="MEMORYOS_API_KEY")

memory.process(
    thread_id="agent-run-21",
    message="I fixed the merge threshold issue in MemoryOS.",
)

context = memory.resume(
    project="MemoryOS",
    question="What should I continue next?",
    top_k=5,
)`,
  },
  rest: {
    label: "REST API",
    intro:
      "The REST API gives the same lifecycle directly over HTTP for internal platforms and custom agents.",
    code: `curl -X POST "https://api.memoryos.dev/v1/memory/process" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer MEMORYOS_API_KEY" \\
  -d '{
    "threadId": "cursor-session-14",
    "message": "I am building MemoryOS and testing retrieval quality."
  }'

curl -X POST "https://api.memoryos.dev/v1/memory/retrieve" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer MEMORYOS_API_KEY" \\
  -d '{
    "question": "what matters before I continue MemoryOS work?",
    "topK": 5
  }'`,
  },
};

const SETUP_STEPS = [
  "Install the MemoryOS SDK or call the REST API.",
  "Initialize the client with your API key.",
  "Send work updates to `process()` during the session.",
  "Call `retrieve()`, `continue()`, or `resume()` before generation.",
];

const USAGE_FLOW = [
  {
    title: "Install once",
    body:
      "Add MemoryOS from the npm registry or Python package index, then connect your workspace with one API key.",
    meta: "npm · pip · REST",
  },
  {
    title: "Work normally",
    body:
      "Keep using Cursor, VS Code, Claude, ChatGPT, or internal agents. MemoryOS sits behind the workflow instead of replacing it.",
    meta: "IDE + agent compatible",
  },
  {
    title: "Store decisions automatically",
    body:
      "Project milestones, bug fixes, stack choices, preferences, and recurring patterns become durable memory for the next session.",
    meta: "process() + memory graph",
  },
  {
    title: "Retrieve before every response",
    body:
      "Agents load the right project context before they answer, so they can resume work with less repetition and less drift.",
    meta: "retrieve() + resume()",
  },
  {
    title: "Review in the dashboard",
    body:
      "Timeline, revisions, and explanations make it clear what was stored, why it surfaced, and how memory changed over time.",
    meta: "dashboard + trust layer",
  },
  {
    title: "Share team memory",
    body:
      "Workspace memory can be used by multiple developers and agents so project knowledge survives handoffs, pauses, and tool switches.",
    meta: "shared workspaces",
  },
];

const PRODUCT_SURFACE = [
  ["Package", "@memoryos/sdk"],
  ["Python", "memoryos"],
  ["API", "api.memoryos.dev"],
  ["Control plane", "MemoryOS dashboard"],
  ["Trust", "timeline + revisions + explain"],
  ["Agent layer", "MCP + IDE integrations"],
];

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-r border-[#c9d8ee] px-5 py-3 font-mono text-[13px] tracking-[0.12em] transition ${
        active
          ? "bg-white text-[#2166f3] shadow-[inset_0_-2px_0_0_#2166f3]"
          : "bg-white text-[#1f2937] hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}

export function DeveloperExperienceSection() {
  const [activeTab, setActiveTab] = useState<SetupTab>("typescript");
  const tab = TAB_COPY[activeTab];

  return (
    <section className="px-5 py-7">
      <Reveal>
        <h2 className="text-center text-[40px] font-semibold tracking-[-0.04em] text-slate-900 md:text-[64px]">
          Setup in 5 minutes
        </h2>
        <p className="mx-auto mt-3 max-w-4xl text-center text-[18px] leading-[1.55] text-slate-500 md:text-[20px]">
          The simplest setup for developer memory. Use TypeScript, Python, or REST,
          then drop MemoryOS into your agent loop with one write step and one retrieval step.
        </p>
      </Reveal>

      <Reveal delay={0.04} className="mx-auto mt-6 flex max-w-[760px] flex-wrap items-center justify-center gap-3 border border-[#c9d8ee] bg-white px-4 py-3 font-mono text-[13px] text-[#4f6383]">
        <span className="text-[#7d90ab]">$</span>
        <span>npm install @memoryos/sdk</span>
        <span className="text-[#b2c0d4]">|</span>
        <span>pip install memoryos</span>
        <span className="text-[#b2c0d4]">|</span>
        <span>api.memoryos.dev</span>
      </Reveal>

      <Reveal delay={0.06} className="mx-auto mt-6 grid max-w-[980px] gap-3 md:grid-cols-4">
        {SETUP_STEPS.map((step, index) => (
          <div key={step} className="border border-[#c9d8ee] bg-white p-4">
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#3367cd]">{`0${index + 1}`}</p>
            <p className="mt-2 text-sm leading-6 text-[#536883]">{step}</p>
          </div>
        ))}
      </Reveal>

      <div className="mx-auto mt-6 grid max-w-[980px] gap-3 md:grid-cols-3">
        {PRODUCT_SURFACE.map(([label, value], index) => (
          <Reveal
            key={label}
            delay={0.03 * index}
            className="border border-[#c9d8ee] bg-white px-4 py-3"
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#7a8dab]">{label}</p>
            <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-slate-900">{value}</p>
          </Reveal>
        ))}
      </div>

      <Reveal
        delay={0.1}
        className="mx-auto mt-7 w-full max-w-[820px] overflow-hidden border border-[#b9cfef] bg-white"
      >
        <div className="flex flex-wrap border-b border-[#c9d8ee] bg-white">
          {(Object.keys(TAB_COPY) as SetupTab[]).map((key) => (
            <TabButton
              key={key}
              label={TAB_COPY[key].label}
              active={activeTab === key}
              onClick={() => setActiveTab(key)}
            />
          ))}
        </div>

        <div className="border-b border-[#c9d8ee] bg-[#0b1017] px-6 py-5">
          <p className="mb-4 text-sm leading-6 text-[#a8b6cc]">{tab.intro}</p>
          <pre className="overflow-x-auto font-mono text-[13px] leading-7 text-[#8df0ac]">
            {tab.code}
          </pre>
        </div>
      </Reveal>

      <div className="mx-auto mt-5 grid max-w-[980px] gap-3 md:grid-cols-3">
        {[
          [
            "PRE MODEL",
            "Call retrieve, continue, or resume before the next model response so the agent starts with relevant memory.",
          ],
          [
            "POST MODEL",
            "Call process after messages, decisions, bug fixes, or milestones so MemoryOS keeps the developer context up to date.",
          ],
          [
            "IN PRODUCT",
            "Render timeline, revisions, and explain views in the dashboard so memory stays visible, reviewable, and trusted.",
          ],
        ].map(([title, body], index) => (
          <Reveal
            key={title}
            delay={0.04 * index}
            className="border border-[#c9d8ee] bg-white p-4"
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#3367cd]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[#556983]">{body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.12} className="mx-auto mt-8 max-w-[1100px]">
        <div className="border border-[#c9d8ee] bg-white p-5 md:p-6">
          <div className="max-w-[720px]">
            <p className="font-mono text-[12px] tracking-[0.2em] text-[#3367cd]">HOW DEVELOPERS USE MEMORYOS</p>
            <h3 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[40px]">
              Install it once. Keep coding the same way.
            </h3>
            <p className="mt-3 text-[15px] leading-7 text-[#556983] md:text-[17px]">
              Developers install MemoryOS from the npm registry, connect an API key, and add it to their
              app, agent runtime, IDE extension, or internal platform. From that point on, MemoryOS handles
              developer memory behind the scenes: it stores useful context, retrieves it before the next model
              call, and exposes a dashboard where teams can inspect, search, and control shared memory.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {USAGE_FLOW.map((item, index) => (
              <Reveal
                key={item.title}
                delay={0.03 * index}
                className="border border-[#cadef5] bg-[rgba(255,255,255,0.7)] p-4 backdrop-blur-sm"
              >
                <p className="font-mono text-[11px] tracking-[0.18em] text-[#3367cd]">{`0${index + 1}`}</p>
                <h4 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-slate-900">
                  {item.title}
                </h4>
                <p className="mt-2 text-[14px] leading-6 text-[#556983]">{item.body}</p>
                <p className="mt-3 font-mono text-[11px] tracking-[0.08em] text-[#4770ab]">{item.meta}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.14} className="mt-8 text-center">
        <p className="font-mono text-[14px] tracking-[0.22em] text-[#1f2937]">
          WORKS WITH EVERYTHING
        </p>
      </Reveal>

      <Reveal delay={0.16} className="mx-auto mt-5 flex max-w-[900px] flex-wrap justify-center gap-3">
        {INTEGRATIONS.map((item) => (
          <span
            key={item}
            className="border border-[#bfd1ee] bg-white px-4 py-2 text-[15px] text-[#334b71]"
          >
            {item}
          </span>
        ))}
      </Reveal>

      <Reveal delay={0.18} className="mt-8 text-center">
        <a href="#what-we-do" className="text-[20px] text-[#2166f3]">
          See how the memory lifecycle works →
        </a>
      </Reveal>
    </section>
  );
}
