"use client";

import {
  Bell,
  Check,
  ChevronRight,
  CircleUserRound,
  Cloud,
  Code2,
  FileCheck2,
  GitPullRequest,
  KeyRound,
  Link2,
  RadioTower,
  ShieldCheck,
  Triangle,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { DeveloperBrandMark, type DeveloperBrand } from "./developer-brand-mark";
import { MemoryStarLogo } from "./memory-star-logo";
import type { McpSourceCard } from "./mcp-source-network";

type DeveloperSurfaceRun = {
  id: string;
  title: string;
  detail: string;
  time: string;
  brand: DeveloperBrand;
  needsReview: boolean;
};

const RUNS: DeveloperSurfaceRun[] = [
  { id: "API-1041", title: "REST API", detail: "Institution run accepted · 202 queued", time: "22s", brand: "openapi", needsReview: false },
  { id: "SDK-1040", title: "SDK", detail: "Institution context attached", time: "48s", brand: "typescript", needsReview: false },
  { id: "CLI-1039", title: "CLI", detail: "epoch verify deploy.yaml", time: "1m", brand: "cli", needsReview: true },
  { id: "MCP-1038", title: "MCP", detail: "Tool authority lease active", time: "2m", brand: "mcp", needsReview: false },
  { id: "WHK-1037", title: "Signed webhooks", detail: "Outcome delivered · verified", time: "3m", brand: "webhook", needsReview: false },
  { id: "ART-1036", title: "Artifact export", detail: "Proof bundle ready to download", time: "5m", brand: "artifact", needsReview: false },
];

function McpExchangePanel({ source, reducedMotion }: { source: McpSourceCard; reducedMotion: boolean | null }) {
  const resourcePath = `mcp://${source.name.toLowerCase().replaceAll(" ", "-")}/${source.signal.replaceAll(" ", "-")}`;

  return (
    <motion.div key={source.id} className="h-full py-1" initial={reducedMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
      <div className="relative border-l border-[#dce5ee] pb-7 pl-7">
        <span className="absolute -left-1 top-0.5 h-2 w-2 border border-[#8fa4bd] bg-white" />
        <div className="flex items-center gap-2">
          <strong className="text-[11px] font-semibold">Source processed</strong>
          <span className="text-[9px] text-[#78899d]">Now</span>
        </div>

        <div className="mt-3 flex items-center justify-between border border-white/75 bg-white/55 px-3.5 py-3 text-[9px] backdrop-blur-md" style={{ borderRadius: 9 }}>
          <span className="flex min-w-0 items-center gap-2.5 font-medium"><Image src={`/connector-icons/${source.asset}`} alt="" width={16} height={16} unoptimized className="h-4 w-4 shrink-0 object-contain" /><span className="truncate">{source.name} · {source.signal}</span></span>
          <span className="shrink-0 font-mono text-[#55708f]">{source.record}</span>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-[8px] text-[#5d7592]">
          <span className="flex h-5 w-5 items-center justify-center bg-[#eef4fb]"><Image src={`/connector-icons/${source.asset}`} alt="" width={12} height={12} unoptimized className="h-3 w-3 object-contain" /></span>
          <span className="flex h-5 w-5 items-center justify-center bg-[#eef4fb]"><DeveloperBrandMark brand="mcp" className="h-3 w-3" /></span>
          <span className="flex h-5 w-5 items-center justify-center bg-[#eef4fb] text-[#356acc]"><ShieldCheck className="h-3 w-3" /></span>
          <span className="ml-1">Show evidence</span>
        </div>
      </div>

      <div className="relative pl-7">
        <span className="absolute -left-[3px] top-0.5 h-1.5 w-1.5 bg-[#356acc]" />
        <div className="flex items-center gap-2">
          <strong className="text-[11px] font-semibold">Institution context queued for agent</strong>
          <span className="text-[9px] text-[#356acc]">6s ago</span>
        </div>
        <p className="mt-3 max-w-[560px] text-[9.5px] leading-[1.7] text-[#5b6f88]">
          Epoch pulled {source.signal} from {source.name}, resolved entities and timestamps, removed duplicates, then applied tenant isolation, capability limits, and the active mission lease.
        </p>

        <div className="mt-4 border border-white/75 bg-white/55 backdrop-blur-md" style={{ borderRadius: 10 }}>
          <div className="flex items-center gap-3 border-b border-[#e2e8ef] px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center border border-[#ccd8e7] bg-[#f3f7fc]" style={{ borderRadius: 7 }}><DeveloperBrandMark brand="mcp" className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold">MCP context agent</p><p className="truncate font-mono text-[7.5px] text-[#7b8999]">{resourcePath}</p></div>
            <span className="flex items-center gap-1.5 font-mono text-[8px] font-semibold text-[#3d7b50]"><span className="h-1.5 w-1.5 bg-[#42a467]" />READY</span>
          </div>
          <div className="flex items-center gap-2 border-b border-[#e8edf2] px-4 py-2.5 text-[8px] text-[#728399]">
            <span>To:</span><span className="border border-[#d5e0ec] bg-[#f9fbfe] px-2 py-1 text-[#4a6f9e]" style={{ borderRadius: 999 }}>mission/context</span>
            <span className="ml-auto">resources/read · tools/call · evidence/write</span>
          </div>
          <div className="px-4 py-3 text-[9px] font-semibold text-[#263b55]">{source.name} context is ready — authority scoped to the active mission</div>
        </div>
      </div>
    </motion.div>
  );
}

function SdkPanel({ reducedMotion }: { reducedMotion: boolean | null }) {
  const [copied, setCopied] = useState(false);
  const install = "npm install @memoryostm/sdk";

  async function copyInstall() {
    await navigator.clipboard?.writeText(install);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <motion.div className="flex h-full flex-col" initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between border-b border-[#e0e6ed] pb-4">
        <div className="flex items-center gap-3"><MemoryStarLogo tone="black" className="!h-[22px]" /><span className="h-5 w-px bg-[#d9e0e8]" /><div><h4 className="text-[11px] font-semibold">Epoch SDK runtime</h4><p className="mt-1 text-[8px] text-[#7e8ea0]">Give every agent mission, authority, evidence duties, and settlement after work.</p></div></div>
        <span className="border border-[#cfd9e4] px-2 py-1 font-mono text-[7px] text-[#58708b]" style={{ borderRadius: 999 }}>NODE SDK</span>
      </div>

      <div className="relative mt-4 border-l border-[#d8e1ea] pb-4 pl-5">
        <span className="absolute -left-1 top-0.5 h-2 w-2 border border-[#8fa4bd] bg-white" style={{ borderRadius: 999 }} />
        <div className="mb-2 flex items-center gap-2"><strong className="text-[9px]">SDK installed</strong><span className="text-[7.5px] text-[#7f90a3]">Now</span></div>
        <div className="flex items-center border border-white/75 bg-white/55 backdrop-blur-md" style={{ borderRadius: 9 }}>
          <span className="border-r border-[#e3e9ef] px-3 py-3 text-[8.5px] font-semibold text-[#344a63]">Install</span>
          <code className="min-w-0 flex-1 truncate px-3 font-mono text-[8px] text-[#466382]">$ {install}</code>
          <button type="button" onClick={() => void copyInstall()} className="self-stretch border-l border-[#e3e9ef] px-4 font-mono text-[7px] text-[#356acc] hover:bg-white/70">{copied ? "COPIED" : "COPY"}</button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 border-l border-[#d8e1ea] pl-5">
        <span className="absolute -left-1 top-0.5 h-2 w-2 bg-[#356acc]" style={{ borderRadius: 999 }} />
        <div className="mb-2 flex items-center gap-2"><strong className="text-[9px]">Agent lifecycle registered</strong><span className="text-[7.5px] text-[#356acc]">4s ago</span></div>
        <div className="grid h-[calc(100%-24px)] min-h-0 grid-cols-[1.15fr_0.85fr] gap-3">
        <div className="overflow-hidden border border-[#263445] bg-[#111923]/95 backdrop-blur-md" style={{ borderRadius: 10 }}>
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-mono text-[7px] text-[#90a2b7]"><span>agent-runtime.ts</span><span className="text-[#70b687]">CONNECTED</span></div>
          <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-[7.5px] leading-[1.8] text-[#cad5e1]"><code>{`import { createMemoryOSClient } from "@memoryostm/sdk";

const epoch = createMemoryOSClient({
  workspace: "epoch-prod"
});

const context = await epoch.beforeModel({
  mission: "deploy inference-api",
  sources: ["github", "sentry", "datadog"]
});

const result = await agent.run(context);

await epoch.afterModel({
  result,
  evidence: result.artifacts
});`}</code></pre>
        </div>

        <div className="flex flex-col border border-white/75 bg-white/55 p-3 backdrop-blur-md" style={{ borderRadius: 10 }}>
          <h5 className="text-[8.5px] font-semibold">How the SDK works</h5>
          <div className="mt-3 space-y-2">
            {[
              ["01", "beforeModel", "Retrieve mission, policy, authority, and source context."],
              ["02", "agent.run", "Execute with mission-scoped capabilities."],
              ["03", "afterModel", "Write outcome, evidence, cost, and learning."],
            ].map(([step, hook, detail]) => (
              <div key={hook} className="grid grid-cols-[24px_1fr] border border-white/80 bg-white/45 px-2.5 py-2.5" style={{ borderRadius: 7 }}><span className="font-mono text-[7px] text-[#8092a6]">{step}</span><span><code className="font-mono text-[8px] font-semibold text-[#356acc]">{hook}</code><span className="mt-1 block text-[7.5px] leading-3.5 text-[#78899c]">{detail}</span></span></div>
            ))}
          </div>
          <div className="mt-auto grid grid-cols-3 divide-x divide-[#e1e7ee] border border-[#d8e1ea] py-2 text-center font-mono text-[7px] text-[#55708e]"><span>24 facts</span><span>3 policies</span><span>7 proofs</span></div>
        </div>
        </div>
      </div>
    </motion.div>
  );
}

function RestApiPanel({ reducedMotion }: { reducedMotion: boolean | null }) {
  const endpoint = "POST /api/memory/memoryignition/brief";
  return (
    <motion.div className="flex h-full flex-col" initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between border-b border-[#e0e6ed] pb-4"><div className="flex items-center gap-3"><DeveloperBrandMark brand="openapi" className="h-5 w-5" /><div><h4 className="text-[11px] font-semibold">REST API institution contract</h4><p className="mt-1 text-[8px] text-[#7e8ea0]">Request mission context, execute work, then settle the outcome.</p></div></div><span className="border border-[#cfd9e4] px-2 py-1 font-mono text-[7px] text-[#58708b]" style={{ borderRadius: 999 }}>HTTPS · JSON</span></div>

      <div className="relative mt-4 border-l border-[#d8e1ea] pb-4 pl-5">
        <span className="absolute -left-1 top-0.5 h-2 w-2 border border-[#8fa4bd] bg-white" style={{ borderRadius: 999 }} />
        <div className="mb-2 flex items-center gap-2"><strong className="text-[9px]">Request received</strong><span className="text-[7.5px] text-[#7f90a3]">Now</span></div>
        <div className="flex items-center border border-white/75 bg-white/55 px-3 py-3 backdrop-blur-md" style={{ borderRadius: 9 }}><span className="mr-3 bg-[#eaf2ff] px-2 py-1 font-mono text-[7px] font-semibold text-[#356acc]" style={{ borderRadius: 5 }}>POST</span><code className="font-mono text-[8px] text-[#466382]">{endpoint.replace("POST ", "")}</code><span className="ml-auto font-mono text-[7px] text-[#3d7b50]">200 OK · 84ms</span></div>
      </div>

      <div className="relative min-h-0 flex-1 border-l border-[#d8e1ea] pl-5">
        <span className="absolute -left-1 top-0.5 h-2 w-2 bg-[#356acc]" style={{ borderRadius: 999 }} />
        <div className="mb-2 flex items-center gap-2"><strong className="text-[9px]">Institution brief compiled</strong><span className="text-[7.5px] text-[#356acc]">84ms</span></div>
        <div className="grid h-[calc(100%-24px)] min-h-0 grid-cols-2 gap-3">
        <div className="overflow-hidden border border-[#273547] bg-[#111923]/95 backdrop-blur-md" style={{ borderRadius: 10 }}><div className="border-b border-white/10 px-3 py-2 font-mono text-[7px] uppercase text-[#91a3b8]">Request</div><pre className="whitespace-pre-wrap px-3 py-3 font-mono text-[7.5px] leading-[1.8] text-[#cbd6e3]"><code>{`{
  "agent_id": "deploy-agent",
  "workspace": "epoch-prod",
  "mission": "deploy inference-api",
  "sources": ["github", "sentry"],
  "risk": "medium"
}`}</code></pre></div>
        <div className="overflow-hidden border border-[#273547] bg-[#111923]/95 backdrop-blur-md" style={{ borderRadius: 10 }}><div className="border-b border-white/10 px-3 py-2 font-mono text-[7px] uppercase text-[#91a3b8]">Response</div><pre className="whitespace-pre-wrap px-3 py-3 font-mono text-[7.5px] leading-[1.8] text-[#cbd6e3]"><code>{`{
  "brief_id": "brf_9f2a",
  "context": { "facts": 24 },
  "authority": { "tools": 3 },
  "required_checks": 18,
  "trace_proof": "epoch://trace/7d2"
}`}</code></pre></div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-[#dce4ec] border border-white/75 bg-white/50 text-[7.5px] backdrop-blur-md" style={{ borderRadius: 9 }}><div className="px-3 py-2"><code className="font-mono text-[#356acc]">/brief</code><span className="ml-2 text-[#7d8da0]">inherit context</span></div><div className="px-3 py-2"><code className="font-mono text-[#356acc]">/outcome</code><span className="ml-2 text-[#7d8da0]">settle proof</span></div><div className="px-3 py-2"><code className="font-mono text-[#356acc]">/timeline</code><span className="ml-2 text-[#7d8da0]">inspect trace</span></div></div>
    </motion.div>
  );
}

const CLI_COMMANDS = [
  { step: "01", label: "Install CLI", command: "npm install -g @memoryos/cli" },
  { step: "02", label: "Authenticate workspace", command: "memoryos auth login --workspace epoch-prod" },
  { step: "03", label: "Connect a source", command: "memoryos sources connect github --scope repo,issues,pulls" },
] as const;

function CliSetupPanel({ reducedMotion }: { reducedMotion: boolean | null }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyCommand(command: string) {
    await navigator.clipboard?.writeText(command);
    setCopied(command);
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <motion.div className="flex h-full flex-col" initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between border-b border-[#e0e6ed] pb-4">
        <div className="flex items-center gap-3">
          <MemoryStarLogo tone="black" className="!h-[22px]" />
          <span className="h-5 w-px bg-[#d9e0e8]" />
          <div><h4 className="text-[11px] font-semibold">Epoch CLI setup</h4><p className="mt-1 text-[8px] text-[#7e8ea0]">Install once. Connect every approved company source.</p></div>
        </div>
        <span className="border border-[#cfe0d2] bg-[#f4faf5] px-2 py-1 font-mono text-[7px] text-[#3d7b50]" style={{ borderRadius: 999 }}>CLI READY</span>
      </div>

      <div className="relative mt-4 space-y-2 border-l border-[#d8e1ea] pb-4 pl-5">
        <span className="absolute -left-1 top-0.5 h-2 w-2 border border-[#8fa4bd] bg-white" style={{ borderRadius: 999 }} />
        <div className="mb-2 flex items-center gap-2"><strong className="text-[9px]">CLI onboarding started</strong><span className="text-[7.5px] text-[#7f90a3]">Now</span></div>
        {CLI_COMMANDS.map(({ step, label, command }, index) => (
          <motion.div key={command} className="grid grid-cols-[28px_132px_1fr_54px] items-center border border-white/75 bg-white/55 backdrop-blur-md" style={{ borderRadius: 8 }} initial={reducedMotion ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}>
            <span className="px-2 font-mono text-[7px] text-[#8b9bad]">{step}</span>
            <span className="border-x border-[#e3e9ef] px-3 py-3 text-[8.5px] font-semibold text-[#344a63]">{label}</span>
            <code className="truncate px-3 font-mono text-[7.5px] text-[#466382]">$ {command}</code>
            <button type="button" onClick={() => void copyCommand(command)} className="h-full border-l border-[#e3e9ef] font-mono text-[7px] text-[#356acc] hover:bg-[#f3f7fc]">{copied === command ? "COPIED" : "COPY"}</button>
          </motion.div>
        ))}
      </div>

      <div className="relative min-h-0 flex-1 border-l border-[#d8e1ea] pl-5">
        <span className="absolute -left-1 top-0.5 h-2 w-2 bg-[#356acc]" style={{ borderRadius: 999 }} />
        <div className="mb-2 flex items-center gap-2"><strong className="text-[9px]">Workspace authenticated and sources connected</strong><span className="text-[7.5px] text-[#356acc]">8s ago</span></div>
        <div className="grid h-[calc(100%-24px)] min-h-0 grid-cols-[1fr_1.15fr] gap-3">
        <div className="border border-white/75 bg-white/55 p-3 backdrop-blur-md" style={{ borderRadius: 10 }}>
          <div className="flex items-center justify-between"><h5 className="text-[8.5px] font-semibold">Source commands</h5><span className="font-mono text-[7px] text-[#7d8da0]">200 available</span></div>
          <div className="mt-3 space-y-2 font-mono text-[7px] text-[#55708e]">
            <button type="button" onClick={() => void copyCommand("memoryos sources connect datadog --scope traces,metrics")} className="block w-full border border-white/80 bg-white/40 px-2 py-2 text-left hover:bg-white/70" style={{ borderRadius: 6 }}>connect datadog --scope traces,metrics</button>
            <button type="button" onClick={() => void copyCommand("memoryos sources connect aws --role epoch-readonly")} className="block w-full border border-white/80 bg-white/40 px-2 py-2 text-left hover:bg-white/70" style={{ borderRadius: 6 }}>connect aws --role epoch-readonly</button>
            <button type="button" onClick={() => void copyCommand("memoryos sources connect sentry --scope issues,releases")} className="block w-full border border-white/80 bg-white/40 px-2 py-2 text-left hover:bg-white/70" style={{ borderRadius: 6 }}>connect sentry --scope issues,releases</button>
            <button type="button" onClick={() => void copyCommand("memoryos sources list --health")} className="block w-full border border-white/80 bg-white/40 px-2 py-2 text-left hover:bg-white/70" style={{ borderRadius: 6 }}>sources list --health</button>
          </div>
        </div>

        <div className="overflow-hidden border border-[#273547] bg-[#101722]/95 text-[#cbd6e3] backdrop-blur-md" style={{ borderRadius: 10 }}>
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2"><span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#91a3b8]">epoch-cli.log</span><span className="font-mono text-[7px] text-[#68b780]">connected</span></div>
          <div className="space-y-2 px-3 py-3 font-mono text-[7px] leading-4">
            <p><span className="text-[#6f8196]">12:04:18</span> authenticated workspace <span className="text-[#8bb7ef]">epoch-prod</span></p>
            <p><span className="text-[#6f8196]">12:04:21</span> github permissions resolved <span className="text-[#73bd8b]">PASS</span></p>
            <p><span className="text-[#6f8196]">12:04:23</span> source contract created <span className="text-[#8bb7ef]">src_github_842</span></p>
            <p><span className="text-[#6f8196]">12:04:24</span> indexed 18 repositories · 342 decisions</p>
            <p><span className="text-[#6f8196]">12:04:26</span> MCP resource published <span className="text-[#8bb7ef]">mcp://github/context</span></p>
            <p className="text-[#73bd8b]">✓ source ready for governed missions</p>
          </div>
        </div>
        </div>
      </div>
    </motion.div>
  );
}

export function WatchtowerModal({ mcpSource }: { mcpSource: McpSourceCard }) {
  const reducedMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState(3);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const selected = RUNS[selectedIndex];
  const visibleRuns = RUNS.map((run, index) => ({ run, index })).filter(({ run }) => !reviewOnly || run.needsReview);
  const inspector = selected.brand === "mcp"
    ? { title: "MCP session", labels: ["Client", "Tenant", "Authority", "Lease"], values: ["Claude Code", "epoch-prod", "3 tools", "14m · revocable"], links: "Live sources" }
    : selected.brand === "cli"
      ? { title: "CLI workspace", labels: ["Version", "Workspace", "Authority", "Sources"], values: ["v2.18.4", "epoch-prod", "source:write", "3 connected"], links: "Connected sources" }
      : selected.brand === "typescript"
        ? { title: "SDK runtime", labels: ["Package", "Workspace", "Hooks", "Sources"], values: ["@memoryostm/sdk", "epoch-prod", "before + after", "3 inherited"], links: "Runtime context" }
        : selected.brand === "openapi"
          ? { title: "API request", labels: ["Protocol", "Workspace", "Auth", "Latency"], values: ["HTTPS · JSON", "epoch-prod", "Bearer token", "84ms"], links: "API resources" }
          : { title: "Mission context", labels: ["Service", "Owner", "Authority", "Budget"], values: ["inference-api", "Platform team", "deploy:prod", "$500 · 14m"], links: "Links" };

  return (
    <motion.div
      className="watchtower-glass flex h-[540px] min-w-[1050px] overflow-hidden border border-[#c9d8ee] bg-white/70 font-sans text-[#172234] backdrop-blur-2xl lg:h-[600px] lg:min-w-0"
      initial={reducedMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      style={{ borderRadius: 18 }}
    >
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-white/70 bg-white/55 backdrop-blur-xl">
        <div className="border-b border-[#d8e1eb] px-4 pb-3 pt-3.5">
          <div className="flex items-center text-[12px] font-semibold text-[#27364a]">
            Watchtower
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[7px] font-medium uppercase tracking-[0.12em] text-[#3c7d55]"><span className="h-1.5 w-1.5 bg-[#44a36a]" />Live</span>
          </div>
          <div className="mt-3 grid grid-cols-2 bg-[#eef2f6] p-0.5 text-center text-[10px] font-medium text-[#6e7d91]" style={{ borderRadius: 7 }}>
            <button type="button" onClick={() => setReviewOnly(false)} className={`py-1.5 transition ${!reviewOnly ? "border border-[#cbd7e4] bg-white text-[#233147] shadow-sm" : "hover:text-[#233147]"}`} style={{ borderRadius: 6 }}>All</button>
            <button type="button" onClick={() => setReviewOnly(true)} className={`py-1.5 transition ${reviewOnly ? "border border-[#cbd7e4] bg-white text-[#233147] shadow-sm" : "hover:text-[#233147]"}`} style={{ borderRadius: 6 }}>Needs review</button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-2 py-2">
          <AnimatePresence initial={false}>
          {visibleRuns.map(({ run: { title, detail, time, brand }, index }) => {
            const active = selectedIndex === index;
            return (
            <motion.button
              layout
              type="button"
              key={title}
              onClick={() => { setSelectedIndex(index); setReviewed(false); setSnoozed(false); }}
              className={`relative flex w-full gap-3 border px-3.5 py-3 text-left transition-colors ${active ? "border-[#aeb9c6] bg-[#f7f8fa]" : "border-transparent text-[#56667b] hover:bg-white/70"}`}
              style={{ borderRadius: 9 }}
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${active ? "bg-[#eef3ff] text-[#536fd3]" : "text-[#8795a7]"}`} style={{ borderRadius: 5 }}>
                <DeveloperBrandMark brand={brand} className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <span className={`min-w-0 flex-1 truncate text-[11px] ${active ? "font-semibold text-[#172234]" : "font-medium"}`}>{title}</span>
                  <span className="shrink-0 text-[9px] text-[#96a1ae]">{time}</span>
                </div>
                <p className="mt-1.5 truncate text-[10px] text-[#8491a1]">{detail}</p>
              </div>
            </motion.button>
          );})}
          </AnimatePresence>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-white/45 backdrop-blur-xl">
        <header className="relative flex h-[52px] shrink-0 items-center justify-between border-b border-white/70 bg-white/55 px-5 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2.5 text-[10px]">
            <span className="flex h-5 w-5 items-center justify-center border border-[#c4d0dd] bg-[#f3f7fb]">
              <DeveloperBrandMark brand={selected.brand} className="h-3 w-3" />
            </span>
            <span className="font-mono text-[#66809e]">{selected.id}</span>
            <strong className="truncate text-[12px] font-semibold text-[#172234]">{selected.title}</strong>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setSnoozed((value) => !value)} className={`border px-4 py-2 text-[9px] font-medium transition ${snoozed ? "border-[#d3a95e] bg-[#fff8e8] text-[#8c641c]" : "border-[#c7d3df] text-[#53657a] hover:bg-[#f5f8fb]"}`} style={{ borderRadius: 999 }}>{snoozed ? "Snoozed 1h" : "Snooze"}</button>
            <button type="button" onClick={() => setReviewed((value) => !value)} className={`px-4 py-2 text-[9px] font-semibold text-[#F0EFE2] transition ${reviewed ? "bg-[#39724e]" : "bg-[#0015FF] hover:bg-[#0015FF]/90"}`} style={{ borderRadius: 999 }}>{reviewed ? "Reviewed" : "Review reminder"}</button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <section className="min-w-0 flex-1 bg-white/35 px-6 py-5 backdrop-blur-lg">
            {selected.brand === "mcp" ? (
              <McpExchangePanel source={mcpSource} reducedMotion={reducedMotion} />
            ) : selected.brand === "cli" ? (
              <CliSetupPanel reducedMotion={reducedMotion} />
            ) : selected.brand === "typescript" ? (
              <SdkPanel reducedMotion={reducedMotion} />
            ) : selected.brand === "openapi" ? (
              <RestApiPanel reducedMotion={reducedMotion} />
            ) : (
            <>
            <div className="relative border-l border-[#dfe5ec] pb-5 pl-6">
              <span className="absolute -left-1 top-0.5 h-2 w-2 border border-[#9fb0c3] bg-white" />
              <div className="flex items-center gap-2">
                <strong className="text-[11px] font-semibold">Execution reviewed</strong>
                <span className="text-[9px] text-[#78899d]">3 May</span>
              </div>
              <div className="mt-4 flex items-center justify-between border border-white/75 bg-white/55 px-3.5 py-3 text-[10px] backdrop-blur-md" style={{ borderRadius: 9 }}>
                <span className="flex items-center gap-2.5 font-medium"><DeveloperBrandMark brand={selected.brand} className="h-3.5 w-3.5" /> {selected.title}</span>
                <span className="font-mono text-[#55708f]">v2.18.4</span>
              </div>
              <button type="button" onClick={() => setEvidenceOpen((value) => !value)} className="mt-4 flex items-center gap-1.5 text-[9px] text-[#4d6f98] hover:text-[#356acc]">
                {[GitPullRequest, Code2, ShieldCheck, Cloud].map((Icon, index) => (
                  <span key={index} className="flex h-5 w-5 items-center justify-center border border-white bg-[#e9f0fa] text-[#356acc]"><Icon className="h-3 w-3" /></span>
                ))}
                <span className="ml-1">{evidenceOpen ? "Hide evidence" : "Show evidence"}</span>
              </button>
              <AnimatePresence>
                {evidenceOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden">
                    <div className="grid grid-cols-4 divide-x divide-[#dce5ee] border border-[#dce5ee] bg-[#f8fbff] text-center text-[8px] text-[#637991]">
                      {['PR #842', 'Policy v12', 'Trace 7d2', 'AWS plan'].map((item) => <span key={item} className="px-2 py-2">{item}</span>)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative pl-6">
              <span className="absolute -left-[3px] top-0.5 h-1.5 w-1.5 bg-[#356acc]" />
              <div className="flex items-center gap-2">
                <strong className="text-[11px] font-semibold">Proof ready for review</strong>
                <span className="text-[9px] text-[#356acc]">18s ago</span>
              </div>
              <p className="mt-3 max-w-[540px] text-[10px] leading-[1.7] text-[#5b6f88]">
                Epoch evaluated policy, authority, budget, security, and rollback readiness. No unresolved risk was found above the execution threshold.
              </p>
              <div className="mt-4 border border-white/75 bg-white/55 backdrop-blur-md" style={{ borderRadius: 10 }}>
                <div className="flex items-center gap-3 border-b border-[#e2e8ef] px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center border border-[#c7d8c8] bg-[#f1f8f1] text-[#34734a]"><FileCheck2 className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold">Epoch verification agent</p>
                    <p className="text-[8.5px] text-[#7b8999]">verify@epoch.ai · certificate 9F2A</p>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-semibold text-[#34734a]"><Check className="h-3.5 w-3.5" /> PASS</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[#e2e8ef] px-4 py-2.5 text-[8.5px] text-[#748398]">
                  <span>18 checks passed</span><span className="pl-4">Rollback ready</span><span className="pl-4">Risk: low</span>
                </div>
              </div>
            </div>
            </>
            )}
          </section>

          <aside className="hidden w-[280px] shrink-0 border-l border-white/70 bg-white/45 px-5 py-5 text-[9.5px] text-[#61738a] backdrop-blur-xl md:block">
            <h4 className="text-[10px] font-semibold text-[#26364c]">{inspector.title}</h4>
            <dl className="mt-4 grid grid-cols-[72px_1fr] gap-x-2 gap-y-4">
              <dt className="text-[#8795a5]">{inspector.labels[0]}</dt><dd className="flex items-center gap-1.5 font-medium text-[#26364c]"><Triangle className="h-2.5 w-2.5 fill-[#26364c]" /> {inspector.values[0]}</dd>
              <dt className="text-[#8795a5]">{inspector.labels[1]}</dt><dd className="flex items-center gap-1.5"><CircleUserRound className="h-2.5 w-2.5" /> {inspector.values[1]}</dd>
              <dt className="text-[#8795a5]">{inspector.labels[2]}</dt><dd className="flex items-center gap-1.5"><KeyRound className="h-2.5 w-2.5" /> {inspector.values[2]}</dd>
              <dt className="text-[#8795a5]">{inspector.labels[3]}</dt><dd>{inspector.values[3]}</dd>
            </dl>

            <div className="mt-5 border-t border-[#edf0f4] pt-4">
              <h4 className="text-[10px] font-semibold text-[#26364c]">{inspector.links}</h4>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between"><span className="flex min-w-0 items-center gap-1.5"><Image src={`/connector-icons/${mcpSource.asset}`} alt="" width={10} height={10} unoptimized className="h-2.5 w-2.5 shrink-0 object-contain" /><span className="truncate">{mcpSource.signal}</span></span><span className="ml-2 shrink-0">{mcpSource.name}</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Link2 className="h-2.5 w-2.5" /> INC-391</span><span>Linear</span></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><RadioTower className="h-2.5 w-2.5" /> trace-7d2</span><span>Datadog</span></div>
              </div>
            </div>

            <div className="mt-5 border-t border-[#edf0f4] pt-4">
              <h4 className="text-[10px] font-semibold text-[#26364c]">Automation</h4>
              <div className="mt-3 flex items-center justify-between"><span className="flex items-center gap-1.5"><Bell className="h-2.5 w-2.5" /> Release institution</span><ChevronRight className="h-3 w-3" /></div>
            </div>

            <div className="mt-5 border-t border-[#edf0f4] pt-4">
              <h4 className="text-[10px] font-semibold text-[#26364c]">Notes</h4>
              <p className="mt-3 leading-5 text-[#8a98a8]">No operator notes. Click to add execution context.</p>
            </div>
          </aside>
        </div>
      </main>
    </motion.div>
  );
}
