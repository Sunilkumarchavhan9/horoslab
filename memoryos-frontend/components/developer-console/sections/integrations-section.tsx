"use client";

import { useMemo, useState } from "react";

const SETUP_CATEGORIES = [
  "All",
  "Packages",
  "AI Workflow",
  "Agents",
  "Voice",
  "Automation",
] as const;

type SetupCategoryFilter = (typeof SETUP_CATEGORIES)[number];
type SetupCategory = Exclude<SetupCategoryFilter, "All">;

type IntegrationCard = {
  id: string;
  name: string;
  subtitle: string;
  category: SetupCategory;
  badge?: string;
  logoText: string;
  logoTone: string;
  docsUrl: string;
  installCommand: string;
  envLines: string[];
  verifySnippet: string;
};

type SetupStep = 1 | 2 | 3;

const INTEGRATION_CARDS: IntegrationCard[] = [
  {
    id: "javascript-sdk",
    name: "JavaScript SDK",    
    subtitle: "npm / yarn / pnpm",
    category: "Packages",
    badge: "TypeScript",
    logoText: "npm",
    logoTone: "#cc3534",
    docsUrl: "https://www.npmjs.com/package/@memoryostm/sdk",
    installCommand: "npm install @memoryostm/sdk",
    envLines: [
      "MEMORYOS_API_KEY=your_api_key",
      "MEMORYOS_BASE_URL=http://localhost:3001",
    ],
    verifySnippet: `import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY!,
  baseUrl: process.env.MEMORYOS_BASE_URL,
});

await memoryos.afterModel({
  threadId: "setup-guide-js-1",
  message: "MemoryOS JavaScript SDK integration is live.",
});

const resume = await memoryos.resume({
  project: "acm-continuity-workspace",
  question: "What should I work on next?",
});

console.log(resume.summary);`,
  },
  {
    id: "python-sdk",
    name: "Python SDK",
    subtitle: "HTTP client",
    category: "Packages",
    badge: "Python",
    logoText: "py",
    logoTone: "#356fa5",
    docsUrl: "https://docs.memoryos.dev/memory-api",
    installCommand: "pip install httpx",
    envLines: [
      "MEMORYOS_API_KEY=your_api_key",
      "MEMORYOS_BASE_URL=http://localhost:3001",
    ],
    verifySnippet: `import os
import httpx

base_url = os.environ["MEMORYOS_BASE_URL"]
token = os.environ["MEMORYOS_API_KEY"]

response = httpx.post(
    f"{base_url}/api/memory/process",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "threadId": "setup-guide-py-1",
        "message": "MemoryOS Python integration is live.",
    },
)
response.raise_for_status()
print(response.json())`,
  },
  {
    id: "vercel-ai-sdk",
    name: "Vercel AI SDK",
    subtitle: "AI SDK integration",
    category: "AI Workflow",
    logoText: "ai",
    logoTone: "#f4f4f4",
    docsUrl: "https://docs.memoryos.dev/integrations/vercel-ai-sdk",
    installCommand: "npm install @memoryostm/sdk ai",
    envLines: [
      "MEMORYOS_API_KEY=your_api_key",
      "OPENAI_API_KEY=your_openai_key",
    ],
    verifySnippet: `import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({ apiKey: process.env.MEMORYOS_API_KEY! });

const result = await streamText({
  model: openai("gpt-4o-mini"),
  prompt: "Summarize sprint blockers",
});

await memoryos.afterModel({
  threadId: "setup-vercel-ai-1",
  message: await result.text,
});`,
  },
  {
    id: "openai",
    name: "OpenAI",
    subtitle: "OpenAI SDK wrapper",
    category: "AI Workflow",
    logoText: "oa",
    logoTone: "#e8e8e8",
    docsUrl: "https://docs.memoryos.dev/integrations/openai",
    installCommand: "npm install openai @memoryostm/sdk",
    envLines: [
      "OPENAI_API_KEY=your_openai_key",
      "MEMORYOS_API_KEY=your_api_key",
    ],
    verifySnippet: `import OpenAI from "openai";
import { createMemoryOSClient } from "@memoryostm/sdk";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const memoryos = createMemoryOSClient({ apiKey: process.env.MEMORYOS_API_KEY! });

const completion = await openai.responses.create({
  model: "gpt-4.1-mini",
  input: "Write sprint handoff bullets.",
});

await memoryos.afterModel({
  threadId: "setup-openai-1",
  message: completion.output_text,
});`,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    subtitle: "Claude memory tool",
    category: "AI Workflow",
    logoText: "an",
    logoTone: "#d9d9d9",
    docsUrl: "https://docs.memoryos.dev/integrations/anthropic",
    installCommand: "npm install @anthropic-ai/sdk @memoryostm/sdk",
    envLines: [
      "ANTHROPIC_API_KEY=your_anthropic_key",
      "MEMORYOS_API_KEY=your_api_key",
    ],
    verifySnippet: `import Anthropic from "@anthropic-ai/sdk";
import { createMemoryOSClient } from "@memoryostm/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const memoryos = createMemoryOSClient({ apiKey: process.env.MEMORYOS_API_KEY! });

const reply = await anthropic.messages.create({
  model: "claude-3-7-sonnet-latest",
  max_tokens: 300,
  messages: [{ role: "user", content: "Summarize current project status." }],
});

await memoryos.afterModel({
  threadId: "setup-anthropic-1",
  message: JSON.stringify(reply.content),
});`,
  },
  {
    id: "langchain",
    name: "LangChain",
    subtitle: "LangChain + MemoryOS",
    category: "AI Workflow",
    logoText: "lc",
    logoTone: "#89bda6",
    docsUrl: "https://docs.memoryos.dev/integrations/langchain",
    installCommand: "npm install @langchain/core @memoryostm/sdk",
    envLines: [
      "MEMORYOS_API_KEY=your_api_key",
      "OPENAI_API_KEY=your_openai_key",
    ],
    verifySnippet: `import { ChatOpenAI } from "@langchain/openai";
import { createMemoryOSClient } from "@memoryostm/sdk";

const llm = new ChatOpenAI({ model: "gpt-4o-mini" });
const memoryos = createMemoryOSClient({ apiKey: process.env.MEMORYOS_API_KEY! });

const output = await llm.invoke("What should this project prioritize this week?");

await memoryos.afterModel({
  threadId: "setup-langchain-1",
  message: output.content.toString(),
});`,
  },
  {
    id: "mastra",
    name: "Mastra",
    subtitle: "Mastra agent framework",
    category: "Agents",
    logoText: "ms",
    logoTone: "#f2f2f2",
    docsUrl: "https://docs.memoryos.dev/integrations/mastra",
    installCommand: "npm install @memoryostm/sdk @mastra/core",
    envLines: [
      "MEMORYOS_API_KEY=your_api_key",
      "MEMORYOS_WORKSPACE=acm",
    ],
    verifySnippet: `import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({ apiKey: process.env.MEMORYOS_API_KEY! });

await memoryos.beforeModel({
  threadId: "setup-mastra-1",
  question: "resume previous task",
});

await memoryos.afterModel({
  threadId: "setup-mastra-1",
  message: "Agent generated migration plan and next actions.",
});`,
  },
  {
    id: "langgraph",
    name: "LangGraph",
    subtitle: "LangGraph state graphs",
    category: "Agents",
    logoText: "lg",
    logoTone: "#c8b9c6",
    docsUrl: "https://docs.memoryos.dev/integrations/langgraph",
    installCommand: "npm install @langchain/langgraph @memoryostm/sdk",
    envLines: [
      "MEMORYOS_API_KEY=your_api_key",
      "MEMORYOS_WORKSPACE=acm",
    ],
    verifySnippet: `import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({ apiKey: process.env.MEMORYOS_API_KEY! });

const resume = await memoryos.resume({
  workspace: process.env.MEMORYOS_WORKSPACE,
  project: "acm-continuity-workspace",
  question: "what context should this node start with?",
});

console.log(resume.lastKnownState);`,
  },
  {
    id: "openai-agents",
    name: "OpenAI Agents",
    subtitle: "OpenAI Agents SDK",
    category: "Agents",
    logoText: "oa",
    logoTone: "#e8e8e8",
    docsUrl: "https://docs.memoryos.dev/integrations/openai-agents",
    installCommand: "npm install @memoryostm/sdk @openai/agents",
    envLines: [
      "OPENAI_API_KEY=your_openai_key",
      "MEMORYOS_API_KEY=your_api_key",
    ],
    verifySnippet: `import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({ apiKey: process.env.MEMORYOS_API_KEY! });

await memoryos.handoff({
  project: "acm-continuity-workspace",
  question: "Generate handoff for the next coding agent.",
});
`,
  },
  {
    id: "crewai",
    name: "CrewAI",
    subtitle: "CrewAI multi-agent",
    category: "Agents",
    logoText: "cw",
    logoTone: "#dcdcdc",
    docsUrl: "https://docs.memoryos.dev/integrations/crewai",
    installCommand: "pip install crewai httpx",
    envLines: [
      "MEMORYOS_API_KEY=your_api_key",
      "OPENAI_API_KEY=your_openai_key",
    ],
    verifySnippet: `import os
import httpx

base_url = os.environ.get("MEMORYOS_BASE_URL", "http://localhost:3001")
token = os.environ["MEMORYOS_API_KEY"]

httpx.post(
    f"{base_url}/api/memory/process",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "threadId": "setup-crewai-1",
        "message": "Crew completed planning and implementation split.",
    },
).raise_for_status()`,
  },
  {
    id: "pipecat",
    name: "Pipecat",
    subtitle: "Voice AI pipelines",
    category: "Voice",
    logoText: "vc",
    logoTone: "#d2c1c8",
    docsUrl: "https://docs.memoryos.dev/integrations/pipecat",
    installCommand: "pip install pipecat-ai httpx",
    envLines: [
      "MEMORYOS_API_KEY=your_api_key",
      "MEMORYOS_WORKSPACE=voice-team",
    ],
    verifySnippet: `import os
import httpx

base_url = os.environ.get("MEMORYOS_BASE_URL", "http://localhost:3001")
token = os.environ["MEMORYOS_API_KEY"]

httpx.post(
    f"{base_url}/api/memory/process",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "threadId": "voice-session-1",
        "message": "Customer support voice session summary stored.",
    },
).raise_for_status()`,
  },
  {
    id: "zapier",
    name: "Zapier",
    subtitle: "Trigger continuity automations",
    category: "Automation",
    logoText: "zp",
    logoTone: "#ff5a19",
    docsUrl: "https://docs.memoryos.dev/integrations/zapier",
    installCommand: "Use Webhooks by Zapier + MemoryOS API endpoint",
    envLines: [
      "MEMORYOS_API_TOKEN=your_jwt_token",
      "MEMORYOS_BASE_URL=http://localhost:3001",
    ],
    verifySnippet: `POST /api/memory/process
Authorization: Bearer {{MEMORYOS_API_TOKEN}}
Content-Type: application/json

{
  "threadId": "zapier-sync-1",
  "message": "Automation pushed CRM update into MemoryOS."
}`,
  },
  {
    id: "n8n",
    name: "n8n",
    subtitle: "Workflow automation",
    category: "Automation",
    logoText: "n8",
    logoTone: "#e2467a",
    docsUrl: "https://docs.memoryos.dev/integrations/n8n",
    installCommand: "Create HTTP Request node to MemoryOS API",
    envLines: [
      "MEMORYOS_API_TOKEN=your_jwt_token",
      "MEMORYOS_BASE_URL=http://localhost:3001",
    ],
    verifySnippet: `POST {{$env.MEMORYOS_BASE_URL}}/api/memory/process
Authorization: Bearer {{$env.MEMORYOS_API_TOKEN}}
Content-Type: application/json

{
  "threadId": "n8n-sync-1",
  "message": "n8n workflow posted product updates to MemoryOS."
}`,
  },
];

function classForActive(active: boolean): string {
  return active
    ? "border-[#3f84ff]/50 bg-[#0f1f38] text-[#8db6ff]"
    : "border-white/10 bg-[#101010] text-white/54 hover:border-white/20 hover:text-white";
}

function stepTone(step: SetupStep, openStep: SetupStep): {
  container: string;
  text: string;
} {
  if (step < openStep) {
    return {
      container: "border-[#3dcc84]/40 bg-[#1f7e4a] text-white",
      text: "text-white",
    };
  }

  if (step === openStep) {
    return {
      container: "border-[#2f3643] bg-[#262b33] text-[#d9e1ee]",
      text: "text-white",
    };
  }

  return {
    container: "border-[#2f3643] bg-[#1f2329] text-[#8b93a1]",
    text: "text-[#8b93a1]",
  };
}

function CopyButton({
  onClick,
  copied,
}: {
  onClick: () => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[8px] border border-white/10 bg-[#191919] px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-white/70 transition hover:border-white/20"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function IntegrationsSection() {
  const [category, setCategory] = useState<SetupCategoryFilter>("All");
  const [search, setSearch] = useState("");
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<SetupStep>(1);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const selectedIntegration = useMemo(
    () => INTEGRATION_CARDS.find((item) => item.id === selectedIntegrationId) ?? null,
    [selectedIntegrationId],
  );

  const filteredIntegrations = useMemo(() => {
    return INTEGRATION_CARDS.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const haystack = `${item.name} ${item.subtitle} ${item.category}`.toLowerCase();
      const matchesSearch =
        search.trim().length === 0 || haystack.includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  async function copyText(text: string, blockId: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBlockId(blockId);
      window.setTimeout(() => {
        setCopiedBlockId((current) => (current === blockId ? null : current));
      }, 1200);
    } catch {
      setCopiedBlockId(null);
    }
  }

  if (!selectedIntegration) {
    return (
      <div className="mx-auto w-full max-w-[860px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.05em]">Setup Guide</h1>
            <p className="mt-1 text-[13px] text-white/60">
              Get started by connecting your first integration.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[3px] border border-white/10 bg-[#131313] px-3 py-2">
          <div className="flex items-center gap-2.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/35"
            >
              <circle cx="7" cy="7" r="5" />
              <path d="M10.5 10.5L14 14" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search integrations..."
              className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {SETUP_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-[7px] border px-2.5 py-1 text-[12px] transition ${classForActive(
                category === item,
              )}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filteredIntegrations.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedIntegrationId(item.id);
                setOpenStep(1);
              }}
              className="rounded-[3px] border border-white/10 bg-[#161616] p-4 text-left transition hover:border-white/25 hover:bg-[#1c1c1c]"
            >
              <div
                className="grid h-8 w-8 place-items-center rounded-[7px] text-[11px] font-semibold uppercase"
                style={{
                  background: `${item.logoTone}22`,
                  color: item.logoTone,
                }}
              >
                {item.logoText}
              </div>
              <p className="mt-4 text-[15px] font-semibold tracking-[-0.03em] text-white/98">
                {item.name}
              </p>
              <p className="mt-1 text-[12px] leading-[1.3] text-white/45">
                {item.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const stepToneOne = stepTone(1, openStep);
  const stepToneTwo = stepTone(2, openStep);
  const stepToneThree = stepTone(3, openStep);

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <div className="flex flex-wrap items-end justify-between gap-3 ">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.05em]">Setup Guide</h1>
          <p className="mt-1 text-[13px] text-white/60">
            Get started by connecting your first integration.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSelectedIntegrationId(null)}
        className="mt-5 flex items-center gap-1.5 text-[13px] text-white/48 transition hover:text-white/78"
      >
        <span aria-hidden>←</span>
        <span>Back to integrations</span>
      </button>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-9 w-9 place-items-center rounded-[7px] text-[11px] font-semibold uppercase"
            style={{
              background: `${selectedIntegration.logoTone}22`,
              color: selectedIntegration.logoTone,
            }}
          >
            {selectedIntegration.logoText}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[20px] font-semibold tracking-[-0.03em]">
                {selectedIntegration.name}
              </p>
              {selectedIntegration.badge ? (
                <span className="rounded-[6px] border border-[#2d7a4d] bg-[#133926] px-2 py-0.5 text-[11px] text-[#6be493]">
                  {selectedIntegration.badge}
                </span>
              ) : null}
            </div>
            <p className="text-[13px] text-white/45">{selectedIntegration.subtitle}</p>
          </div>
        </div>

        <a
          href={selectedIntegration.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] text-white/55 transition hover:text-white/82"
        >
          Docs ↗
        </a>
      </div>

      <div className="mt-5 space-y-2">
        <section className="overflow-hidden rounded-[10px] border border-white/10 bg-[#161616]">
          <button
            type="button"
            onClick={() => setOpenStep(1)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full border text-[12px] font-semibold ${stepToneOne.container}`}
              >
                {openStep > 1 ? "✓" : "1"}
              </div>
              <div>
                <p className={`text-[14px] font-semibold tracking-[-0.02em] ${stepToneOne.text}`}>
                  Install the package
                </p>
                {openStep !== 1 ? (
                  <p className="text-[12px] text-white/42">{selectedIntegration.installCommand}</p>
                ) : null}
              </div>
            </div>
            <span className="text-[14px] text-white/40">{openStep === 1 ? "⌃" : "⌄"}</span>
          </button>

          {openStep === 1 ? (
            <div className="border-t border-white/10 px-4 py-4">
              <p className="text-[13px] text-white/70">Run this command in your project directory:</p>
              <div className="mt-3 rounded-[8px] border border-white/10 bg-[#121212] px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-[12px] text-white">{selectedIntegration.installCommand}</code>
                  <CopyButton
                    onClick={() => void copyText(selectedIntegration.installCommand, "step1")}
                    copied={copiedBlockId === "step1"}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[10px] border border-white/10 bg-[#161616]">
          <button
            type="button"
            onClick={() => setOpenStep(2)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full border text-[12px] font-semibold ${stepToneTwo.container}`}
              >
                {openStep === 3 ? "✓" : "2"}
              </div>
              <div>
                <p className={`text-[14px] font-semibold tracking-[-0.02em] ${stepToneTwo.text}`}>
                  Add your API key
                </p>
                <p className="text-[12px] text-white/42">Set environment variables</p>
              </div>
            </div>
            <span className="text-[14px] text-white/40">{openStep === 2 ? "⌃" : "⌄"}</span>
          </button>

          {openStep === 2 ? (
            <div className="border-t border-white/10 px-4 py-4">
              <p className="text-[13px] text-white/70">Add these environment variables to your project:</p>
              <div className="mt-3 rounded-[8px] border border-white/10 bg-[#121212] px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <code className="whitespace-pre-wrap text-[12px] text-white">
                    {selectedIntegration.envLines.join("\n")}
                  </code>
                  <CopyButton
                    onClick={() => void copyText(selectedIntegration.envLines.join("\n"), "step2")}
                    copied={copiedBlockId === "step2"}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[10px] border border-white/10 bg-[#161616]">
          <button
            type="button"
            onClick={() => setOpenStep(3)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full border text-[12px] font-semibold ${stepToneThree.container}`}
              >
                3
              </div>
              <div>
                <p className={`text-[14px] font-semibold tracking-[-0.02em] ${stepToneThree.text}`}>
                  Verify installation
                </p>
                <p className="text-[12px] text-white/42">Run a test to confirm setup</p>
              </div>
            </div>
            <span className="text-[14px] text-white/40">{openStep === 3 ? "⌃" : "⌄"}</span>
          </button>

          {openStep === 3 ? (
            <div className="border-t border-white/10 px-4 py-4">
              <p className="text-[13px] text-white/70">Use this code snippet to test the integration:</p>
              <div className="mt-3 rounded-[8px] border border-white/10 bg-[#121212] px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <pre className="w-full overflow-x-auto text-[12px] leading-[1.6] text-white">
                    <code>{selectedIntegration.verifySnippet}</code>
                  </pre>
                  <CopyButton
                    onClick={() => void copyText(selectedIntegration.verifySnippet, "step3")}
                    copied={copiedBlockId === "step3"}
                  />
                </div>
              </div>
              <button
                type="button"
                className="mt-3 h-9 w-full rounded-[8px] bg-[#2b7bff] text-[12px] font-medium uppercase tracking-[0.08em] text-white transition hover:bg-[#438cff]"
              >
                Verify Installation
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
