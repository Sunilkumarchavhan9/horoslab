"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getOrCreateMemoryToken,
  readMemoryTokenFromStorage,
} from "@/lib/memory-token";

type SetupSurface = "sdk" | "mcp" | "http";
type InstallationVerificationStatus = "idle" | "waiting" | "connected" | "error";

type SetupStep = {
  title: string;
  action: string;
  requiredBecause: string;
  liveProof: string;
};

type SetupCard = {
  id: SetupSurface;
  title: string;
  subtitle: string;
  badge: string;
  logoText: string;
  logoTone: string;
  install: string;
  docsUrl: string;
  summary: string;
  steps: SetupStep[];
  code: (token: string, baseUrl: string) => string;
};

type IntegrationCatalogCard = {
  id: string;
  title: string;
  subtitle: string;
  category: "All" | "Packages" | "AI Workflow" | "Agents" | "Voice" | "Automation";
  accent: string;
  surface: SetupSurface;
};

type IntegrationsSectionProps = {
  installationVerification?: {
    status: InstallationVerificationStatus;
    message: string;
    onVerify: () => void;
  };
  liveSignals?: {
    memoryCount: number;
    requestCount: number;
    timelineCount: number;
    lastRequestRoute?: string | null;
    lastRequestAt?: string | null;
  };
};

const DEFAULT_API_BASE_URL = (
  process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() ||
  process.env.NEXT_PUBLIC_MEMORYOS_API_BASE_URL?.trim() ||
  "http://localhost:3001"
).replace(/\/+$/, "");

const TOKEN_PLACEHOLDER = "YOUR_MEMORYOS_TOKEN";
const LOGO_URLS = {
  mastra: "https://mastra.ai/brand/logo.svg",
  langgraph: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/langgraph.png",
  agno: "https://www.google.com/s2/favicons?domain=agno.com&sz=64",
  pipecat: "https://raw.githubusercontent.com/pipecat-ai/pipecat/main/pipecat.png",
  zapier: "https://cdn.simpleicons.org/zapier/ff4f00",
  n8n: "https://cdn.simpleicons.org/n8n/ffffff",
} as const;

const SETUP_CARDS: SetupCard[] = [
  {
    id: "sdk",
    title: "TypeScript SDK",
    subtitle: "@memoryostm/sdk",
    badge: "Node agents",
    logoText: "SDK",
    logoTone: "var(--color-primary)",
    install: "npm install @memoryostm/sdk",
    docsUrl: "https://www.npmjs.com/package/@memoryostm/sdk",
    summary: "Agent runtime SDK path.",
    steps: [
      {
        title: "Install the SDK",
        action: "Install the package in the agent or backend process that owns the model call.",
        requiredBecause: "The SDK wraps MemoryOS HTTP calls so your app can load context and save useful work without hand-writing every request.",
        liveProof: "Your app can import createMemoryOSClient without build errors.",
      },
      {
        title: "Set live environment",
        action: "Set MEMORYOS_API_KEY and MEMORYOS_BASE_URL for the running process.",
        requiredBecause: "The API key scopes writes and reads to the signed-in workspace, and the base URL points the SDK at your live backend.",
        liveProof: "Requests appear in the Requests page under the same signed-in workspace.",
      },
      {
        title: "Wrap the model turn",
        action: "Call beforeModel() before generation and afterModel() after useful work.",
        requiredBecause: "beforeModel() retrieves continuity; afterModel() stores new facts so the next run can resume from live data.",
        liveProof: "Memories page shows stored memories, and a resume call returns non-empty context.",
      },
    ],
    code: (token, baseUrl) => `import { createMemoryOSClient } from "@memoryostm/sdk";

const memoryos = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY ?? "${token}",
  baseUrl: process.env.MEMORYOS_BASE_URL ?? "${baseUrl}",
});

const context = await memoryos.beforeModel({
  userId: "developer-console",
  threadId: "demo-agent-thread",
  project: "MemoryOS",
  question: "What should this agent remember before continuing?",
  topK: 5,
});

await memoryos.afterModel({
  userId: "developer-console",
  threadId: "demo-agent-thread",
  message: "I am building MemoryOS and testing the live SDK setup.",
  modelResponse: "Next step is to confirm the memory appears in the console.",
});

// .env
MEMORYOS_API_KEY=${token}
MEMORYOS_BASE_URL=${baseUrl}`,
  },
  {
    id: "mcp",
    title: "Universal MCP",
    subtitle: "@memoryostm/mcp",
    badge: "Any MCP runtime",
    logoText: "MCP",
    logoTone: "var(--color-chart-2)",
    install: "npx -y @memoryostm/mcp",
    docsUrl: "https://www.npmjs.com/package/@memoryostm/mcp",
    summary: "MCP runtime path.",
    steps: [
      {
        title: "Add the MCP server",
        action: "Register the MemoryOS MCP server in your agent runtime config.",
        requiredBecause: "MCP is the bridge that lets external agents call MemoryOS tools without custom integration code.",
        liveProof: "The agent lists memory.before_model, memory.after_model, and memory.handoff as available tools.",
      },
      {
        title: "Pass live env vars",
        action: "Pass MEMORYOS_API_KEY and MEMORYOS_BASE_URL into the MCP server environment.",
        requiredBecause: "The MCP process runs separately from the console, so it needs its own token and backend URL.",
        liveProof: "Tool calls create rows in Requests with the same workspace token.",
      },
      {
        title: "Call memory tools",
        action: "Use memory.before_model before work, memory.after_model after work, and memory.handoff for transfer.",
        requiredBecause: "These calls are what turn agent activity into durable MemoryOS continuity.",
        liveProof: "Memories and Requests update after the agent performs a tool call.",
      },
    ],
    code: (token, baseUrl) => `{
  "mcpServers": {
    "memoryos": {
      "command": "npx",
      "args": ["-y", "@memoryostm/mcp"],
      "env": {
        "MEMORYOS_API_KEY": "${token}",
        "MEMORYOS_BASE_URL": "${baseUrl}"
      }
    }
  }
}`,
  },
  {
    id: "http",
    title: "HTTP API",
    subtitle: "/api/memory/*",
    badge: "Any language",
    logoText: "API",
    logoTone: "var(--color-chart-5)",
    install: "No package required",
    docsUrl: "/docs/memory-api",
    summary: "Direct HTTP path.",
    steps: [
      {
        title: "Send bearer auth",
        action: "Send Authorization: Bearer with every MemoryOS request.",
        requiredBecause: "The backend uses the token to identify which workspace owns the memory and request history.",
        liveProof: "Unauthenticated calls fail; authenticated calls show up in Requests.",
      },
      {
        title: "Store useful work",
        action: "POST /api/memory/process after a meaningful user, agent, or workflow update.",
        requiredBecause: "MemoryOS can only retrieve continuity after real work has been persisted.",
        liveProof: "A successful process call returns accepted memories or visible request history.",
      },
      {
        title: "Retrieve before continuing",
        action: "POST /api/memory/retrieve before the next model response or workflow step.",
        requiredBecause: "Retrieval injects the saved live context back into the next turn.",
        liveProof: "The response includes ranked memories, and the Requests page logs the retrieve call.",
      },
    ],
    code: (token, baseUrl) => `curl -X POST "${baseUrl}/api/memory/process" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "threadId": "demo-agent-thread",
    "message": "The agent finished the integration setup and needs this remembered."
  }'

curl -X POST "${baseUrl}/api/memory/retrieve" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What should the agent remember before continuing?",
    "topK": 5
  }'`,
  },
];

const CATALOG_TABS = ["All", "Packages", "AI Workflow", "Agents", "Voice", "Automation"] as const;

const INTEGRATION_CATALOG: IntegrationCatalogCard[] = [
  { id: "javascript-sdk", title: "JavaScript SDK", subtitle: "npm / yarn / pnpm", category: "Packages", accent: "npm", surface: "sdk" },
  { id: "python-sdk", title: "Python SDK", subtitle: "pip install", category: "Packages", accent: "Py", surface: "http" },
  { id: "vercel-ai-sdk", title: "Vercel AI SDK", subtitle: "AI SDK integration", category: "AI Workflow", accent: "▲", surface: "sdk" },
  { id: "openai", title: "OpenAI", subtitle: "OpenAI SDK wrapper", category: "Agents", accent: "AI", surface: "sdk" },
  { id: "anthropic", title: "Anthropic", subtitle: "Claude memory tool", category: "Agents", accent: "AI", surface: "mcp" },
  { id: "langchain", title: "LangChain", subtitle: "Agent memory adapter", category: "AI Workflow", accent: "LC", surface: "sdk" },
  { id: "mastra", title: "Mastra", subtitle: "Mastra agent framework", category: "Agents", accent: "M", surface: "sdk" },
  { id: "langgraph", title: "LangGraph", subtitle: "State graph continuity", category: "AI Workflow", accent: "LG", surface: "sdk" },
  { id: "crewai", title: "CrewAI", subtitle: "Multi-agent handoffs", category: "Agents", accent: "CA", surface: "http" },
  { id: "openai-agents", title: "OpenAI Agents", subtitle: "OpenAI Agents SDK", category: "Agents", accent: "OA", surface: "http" },
  { id: "agno", title: "Agno", subtitle: "Agent framework", category: "Agents", accent: "AG", surface: "http" },
  { id: "pipecat", title: "Pipecat", subtitle: "Voice AI pipelines", category: "Voice", accent: "PC", surface: "http" },
  { id: "zapier", title: "Zapier", subtitle: "Automation workflows", category: "Automation", accent: "Z", surface: "http" },
  { id: "n8n", title: "n8n", subtitle: "Workflow automation", category: "Automation", accent: "n8n", surface: "http" },
];

function CatalogIcon({ card }: { card: IntegrationCatalogCard }) {
  if (card.id === "javascript-sdk") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="h-10 w-10"
        aria-hidden
      >
        <path fill="#ffd600" d="M6,42V6h36v36H6z" />
        <path
          fill="#000001"
          d="M29.538 32.947c.692 1.124 1.444 2.201 3.037 2.201 1.338 0 2.04-.665 2.04-1.585 0-1.101-.726-1.492-2.198-2.133l-.807-.344c-2.329-.988-3.878-2.226-3.878-4.841 0-2.41 1.845-4.244 4.728-4.244 2.053 0 3.528.711 4.592 2.573l-2.514 1.607c-.553-.988-1.151-1.377-2.078-1.377-.946 0-1.545.597-1.545 1.377 0 .964.6 1.354 1.985 1.951l.807.344C36.452 29.645 38 30.839 38 33.523 38 36.415 35.716 38 32.65 38c-2.999 0-4.702-1.505-5.65-3.368L29.538 32.947zM17.952 33.029c.506.906 1.275 1.603 2.381 1.603 1.058 0 1.667-.418 1.667-2.043V22h3.333v11.101c0 3.367-1.953 4.899-4.805 4.899-2.577 0-4.437-1.746-5.195-3.368L17.952 33.029z"
        />
      </svg>
    );
  }

  if (card.id === "python-sdk") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="h-10 w-10"
        aria-hidden
      >
        <path
          fill="#0277BD"
          d="M24.047,5c-1.555,0.005-2.633,0.142-3.936,0.367c-3.848,0.67-4.549,2.077-4.549,4.67V14h9v2H15.22h-4.35c-2.636,0-4.943,1.242-5.674,4.219c-0.826,3.417-0.863,5.557,0,9.125C5.851,32.005,7.294,34,9.931,34h3.632v-5.104c0-2.966,2.686-5.896,5.764-5.896h7.236c2.523,0,5-1.862,5-4.377v-8.586c0-2.439-1.759-4.263-4.218-4.672C27.406,5.359,25.589,4.994,24.047,5z M19.063,9c0.821,0,1.5,0.677,1.5,1.502c0,0.833-0.679,1.498-1.5,1.498c-0.837,0-1.5-0.664-1.5-1.498C17.563,9.68,18.226,9,19.063,9z"
        />
        <path
          fill="#FFC107"
          d="M23.078,43c1.555-0.005,2.633-0.142,3.936-0.367c3.848-0.67,4.549-2.077,4.549-4.67V34h-9v-2h9.343h4.35c2.636,0,4.943-1.242,5.674-4.219c0.826-3.417,0.863-5.557,0-9.125C41.274,15.995,39.831,14,37.194,14h-3.632v5.104c0,2.966-2.686,5.896-5.764,5.896h-7.236c-2.523,0-5,1.862-5,4.377v8.586c0,2.439,1.759,4.263,4.218,4.672C19.719,42.641,21.536,43.006,23.078,43z M28.063,39c-0.821,0-1.5-0.677-1.5-1.502c0-0.833,0.679-1.498,1.5-1.498c0.837,0,1.5,0.664,1.5,1.498C29.563,38.32,28.899,39,28.063,39z"
        />
      </svg>
    );
  }

  if (card.id === "openai") {
    return (
      <img src="/openai-logo.svg" alt="OpenAI logo" className="h-10 w-10 text-foreground" />
    );
  }

  if (card.id === "openai-agents") {
    return (
      <img src="/openai-logo.svg" alt="OpenAI Agents logo" className="h-10 w-10 text-foreground" />
    );
  }

  if (card.id === "anthropic") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        className="h-10 w-10"
        aria-hidden
      >
        <g
          fill="#c67811"
          fillRule="nonzero"
          stroke="none"
          strokeWidth="1"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit="10"
          strokeDasharray="none"
          strokeDashoffset="0"
        >
          <g transform="scale(5.12,5.12)">
            <path d="M5,5v40h40v-40zM20.03125,16.96875h3.69141l6.0957,16.0625h-3.51172l-1.05273,-3.0957h-6.60547l-1.08594,3.0332h-3.53125zM26.77734,16.97852c.024,-.024 3.25586,0 3.25586,0l5.93555,16.03711h-3.32617zM21.9668,20.96875l-2.20117,5.67969h4.27539z" />
          </g>
        </g>
      </svg>
    );
  }

  if (card.id === "langchain") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        className="h-102 w-102"
        aria-hidden
      >
        <g clipPath="url(#clip1_4783_495)">
          <path
            d="M6.64803 14.103C7.89438 12.8566 8.595 11.1643 8.595 9.40177C8.595 7.63928 7.89378 5.94697 6.64803 4.70058L1.94697 0C0.701225 1.24639 0 2.9387 0 4.70119C0 6.46368 0.701225 8.15599 1.94697 9.40238L6.64742 14.103H6.64803Z"
            fill="currentColor"
          />
          <path
            d="M16.4845 14.5379C15.2388 13.2921 13.5459 12.5908 11.7841 12.5908C10.0222 12.5908 8.32936 13.2921 7.08301 14.5379L11.7841 19.239C13.0298 20.4848 14.7227 21.1861 16.4851 21.1861C18.2476 21.1861 19.9398 20.4848 21.1862 19.239L16.4845 14.5379H16.4845Z"
            fill="currentColor"
          />
          <path
            d="M1.95832 19.228C3.20468 20.4738 4.89693 21.1751 6.65938 21.1751V14.5269H0.0107422C0.0113472 16.2893 0.711968 17.9817 1.95832 19.228Z"
            fill="currentColor"
          />
          <path
            d="M18.2997 7.5871C17.0533 6.34138 15.3611 5.63953 13.598 5.64014C11.8356 5.64014 10.1433 6.34138 8.89697 7.5877L13.598 12.289L18.2997 7.5871Z"
            fill="currentColor"
          />
        </g>

        <defs>
          <clipPath id="clip1_4783_495">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  }

  if( card.id === "mistral") {
      return(
        <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        className="h-102 w-102"
        aria-hidden
        >
  <path  d="M4.5 11.7a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9M10.4 0a4.5 4.5 0 0 1 4.4 5.5c-.3 1.4-.6 3 .2 4.2l1.3 1.8.3.2q.2 0 .3-.2l1.3-1.9c.8-1.1.5-2.7.2-4a4.5 4.5 0 1 1 8.8 0c-.3 1.3-.6 2.8 0 4l1.3 2a4.5 4.5 0 1 1-4.3 3.5c.3-1.3.6-2.8 0-4l-1.2-2h-.2L21.5 11c-.8 1.2-.5 2.8-.2 4.2a4.5 4.5 0 1 1-8.8.2q.5-2-.4-3.8l-.9-1.3q-.9-1.1-2.4-1.6A4.5 4.5 0 0 1 10.4 0"/>
</svg>
      )
  }

  if (card.id === "langgraph") {
    return (
      <img
        src={LOGO_URLS.langgraph}
        alt="LangGraph logo"
        className="h-10 w-10"
        onError={(event) => {
          event.currentTarget.src = "/langgraph-logo.svg";
        }}
      />
    );
  }

  if (card.id === "mastra") {
    return (
      <img
        src={LOGO_URLS.mastra}
        alt="Mastra logo"
        className="h-10 w-10"
      />
    );
  }

  if (card.id === "agno") {
    return (
      <img
        src={LOGO_URLS.agno}
        alt="Agno logo"
        className="h-10 w-10"
        onError={(event) => {
          event.currentTarget.src = "/agno-logo.svg";
        }}
      />
    );
  }

  if (card.id === "pipecat") {
    return (
      <img
        src={LOGO_URLS.pipecat}
        alt="Pipecat logo"
        className="h-10 w-10 rounded-[6px] object-cover"
        onError={(event) => {
          event.currentTarget.src = "/pipecat.png";
        }}
      />
    );
  }

  if (card.id === "zapier") {
    return (
      <img
        src={LOGO_URLS.zapier}
        alt="Zapier logo"
        className="h-10 w-10"
        onError={(event) => {
          event.currentTarget.src = "/zapier-logo.svg";
        }}
      />
    );
  }

  if (card.id === "n8n") {
    return (
      <img
        src={LOGO_URLS.n8n}
        alt="n8n logo"
        className="h-10 w-10"
        onError={(event) => {
          event.currentTarget.src = "/n8n-logo.svg";
        }}
      />
    );
  }


  if(card.id == "crewai") {
    return(
      <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className="h-15 w-15"
      aria-hidden
      ><path d="M153.996 109.469C153.553 107.465 152.342 105.714 150.624 104.592C148.933 103.53 146.562 103.045 144.386 106.118C139.427 113.108 138.86 113.737 138.86 113.737C138.86 113.737 132.787 122.048 128.281 125.78C123.97 129.505 119.454 132.985 114.753 136.204C102.43 143.972 87.9932 147.709 73.4488 146.896C69.6583 146.731 66.0401 145.267 63.2 142.751C60.3577 140.237 58.4649 136.823 57.8384 133.08C56.7072 127.191 56.5158 121.16 57.2714 115.212C58.0314 107.465 60.2716 99.9358 63.8703 93.0335C69.597 81.0233 76.6895 69.7134 85.0071 59.328C89.1416 54.3892 93.4617 49.6154 98.0396 45.089C100.625 42.2748 103.999 40.3057 107.721 39.4388C108.234 39.709 108.687 40.0809 109.051 40.5317C109.413 40.9863 109.679 41.5086 109.835 42.068C109.986 42.6288 110.025 43.214 109.948 43.7899C109.867 44.3628 109.671 44.9134 109.371 45.4086C106.123 52.8116 102.762 60.1838 99.8338 67.7312C97.0064 73.8339 95.9181 80.5986 96.689 87.2802C97.7412 91.9434 99.9988 96.2489 103.236 99.7663C106.469 103.287 110.568 105.9 115.124 107.345C116.66 107.872 118.341 107.776 119.806 107.077C121.269 106.369 122.395 105.113 122.94 103.581C126.208 96.5185 129.384 89.4454 132.58 82.362C136.065 75.5252 138.747 68.3078 140.571 60.854C142.355 54.0251 141.447 46.7718 138.035 40.5936C134.31 34.5377 129.341 29.3432 123.455 25.3544C115.001 19.498 105.907 15.8583 95.3589 17.8276C87.2102 19.3764 79.4421 22.5005 72.4899 27.0247C63.0837 33.0976 54.6767 40.5932 47.5691 49.2442C40.7137 57.6015 34.7333 66.6396 29.7214 76.2168C23.4013 87.6381 19.1859 100.103 17.2764 113.016C16.0511 121.261 16.285 129.658 17.9672 137.823C20.071 148.873 25.9858 158.835 34.6808 165.971C43.5168 173.006 54.3768 177.021 65.6643 177.426C71.7488 177.597 77.8372 177.287 83.8728 176.498C92.753 175.366 101.372 172.711 109.35 168.652C114.454 166.239 119.3 163.218 124.198 160.486C124.198 160.486 145.654 145.422 151.469 129.121C155.119 118.903 154.769 112.686 153.996 109.469Z" fill="#F75A36"></path>
        <path d="M170.038 105.641C168.617 99.423 164.791 94.0215 159.397 90.6179C156.147 88.5436 152.395 87.3892 148.54 87.2773C151.978 80.1083 154.666 72.6036 156.562 64.8825C159.393 53.9986 157.927 42.4427 152.468 32.6102L152.283 32.27L152.077 31.94C147.156 23.9086 140.575 17.0218 132.775 11.7415C122.114 4.36934 111.752 0.78125 101.091 0.78125C98.1325 0.785523 95.1811 1.06511 92.2749 1.61641C82.0313 3.54811 72.2654 7.46777 63.5288 13.154C52.689 20.1613 42.9991 28.8043 34.8034 38.776C27.2786 47.9579 20.7045 57.8794 15.1822 68.3881C7.95182 81.4867 3.13251 95.7772 0.953555 110.579C-0.552048 120.695 -0.272949 130.997 1.77833 141.016C4.63507 155.81 12.5666 169.142 24.204 178.712L24.4 178.877C36.0191 188.078 50.265 193.343 65.0754 193.91H65.1785C66.4261 193.941 67.6633 193.962 68.9109 193.962C74.6099 193.959 80.3028 193.59 85.9545 192.858C96.6347 191.499 107.003 188.318 116.608 183.455C120.722 181.496 124.465 179.341 128.084 177.248C129.465 176.454 130.847 175.66 132.229 174.887L132.971 174.474L133.672 173.979C136.312 172.134 159.634 155.307 166.996 134.665C170.976 123.54 171.987 113.765 170.038 105.641ZM151.468 129.118C145.653 145.419 124.197 160.483 124.197 160.483C119.299 163.215 114.453 166.236 109.349 168.649C101.371 172.708 92.7519 175.363 83.8717 176.495C77.8361 177.284 71.7477 177.594 65.6632 177.423C54.3757 177.019 43.5157 173.003 34.6796 165.968C25.9847 158.832 20.0699 148.87 17.9661 137.82C16.2838 129.655 16.05 121.258 17.2753 113.013C19.1847 100.1 23.4002 87.6352 29.7203 76.2139C34.7321 66.6367 40.7126 57.5986 47.5679 49.2413C54.6755 40.5903 63.0825 33.0947 72.4888 27.0218C79.4409 22.4976 87.209 19.3735 95.3578 17.8247C105.906 15.8554 115 19.4951 123.454 25.3515C129.339 29.3403 134.309 34.5348 138.034 40.5907C141.446 46.7689 142.354 54.0222 140.57 60.8511C138.746 68.3049 136.064 75.5223 132.579 82.3591C129.383 89.4425 126.207 96.5156 122.939 103.578C122.394 105.11 121.268 106.366 119.804 107.074C118.339 107.773 116.658 107.869 115.123 107.342C110.567 105.897 106.468 103.284 103.235 99.7634C99.9977 96.246 97.7401 91.9405 96.6879 87.2773C95.917 80.5957 97.0053 73.831 99.8327 67.7283C102.761 60.1809 106.122 52.8087 109.37 45.4057C109.67 44.9105 109.866 44.3599 109.947 43.787C110.024 43.2111 109.985 42.6259 109.834 42.0651C109.678 41.5057 109.412 40.9834 109.05 40.5288L109.04 40.5185C108.978 40.4463 108.927 40.3844 108.865 40.3226C108.571 40.0383 108.209 39.8348 107.813 39.7318C107.417 39.6288 107.002 39.6299 106.607 39.7349C106.575 39.7367 106.544 39.7437 106.514 39.7555C106.462 39.7761 106.4 39.7864 106.349 39.807C106.112 39.8792 105.885 39.9514 105.668 40.0339C105.225 40.1988 104.782 40.3741 104.349 40.5597C104.194 40.6216 104.06 40.6937 103.916 40.7659C103.792 40.8278 103.679 40.8897 103.555 40.9515C102.632 41.469 101.755 42.0658 100.936 42.7353C99.3176 43.9895 97.7816 45.3464 96.3373 46.7976C96.2239 46.9111 96.1104 47.0142 96.0073 47.1276C95.3475 47.7978 94.6979 48.4783 94.0586 49.1691C93.6874 49.5403 93.337 49.9115 92.9967 50.2826C92.0378 51.3034 91.0995 52.3242 90.1613 53.3655C89.4808 54.1182 88.8105 54.8812 88.1403 55.6545L88.1095 55.6854C87.7692 56.0772 87.4187 56.4793 87.0784 56.8815C86.3773 57.6857 85.6865 58.5002 85.006 59.3251C76.6883 69.7105 69.5959 81.0204 63.8691 93.0306C60.2704 99.9329 58.0303 107.462 57.2703 115.209C56.5147 121.157 56.706 127.188 57.8373 133.077C58.4638 136.82 60.3566 140.234 63.1989 142.749C66.0389 145.264 69.6572 146.728 73.4476 146.893C87.9921 147.706 102.429 143.969 114.752 136.201C119.453 132.983 123.969 129.502 128.28 125.777C132.785 122.045 138.858 113.734 138.858 113.734C138.858 113.734 139.425 113.105 144.385 106.115C146.56 103.042 148.932 103.527 150.623 104.589C152.341 105.711 153.552 107.462 153.994 109.466C154.768 112.683 155.118 118.9 151.468 129.118Z" fill="#262626"></path>
      </svg>
    )
  }

  return <>{card.accent}</>;
}

function tokenForCode(token: string | null) {
  return TOKEN_PLACEHOLDER;
}

function CopyButton({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className="rounded-[8px] border border-border bg-card px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition hover:border-border"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function IntegrationsSection({ installationVerification, liveSignals }: IntegrationsSectionProps = {}) {
  const [selectedSurface, setSelectedSurface] = useState<SetupSurface>("sdk");
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [catalogTab, setCatalogTab] = useState<(typeof CATALOG_TABS)[number]>("All");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [memoryToken, setMemoryToken] = useState<string | null>(() => readMemoryTokenFromStorage());
  const [tokenStatus, setTokenStatus] = useState<"checking" | "ready" | "missing">("checking");
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const selectedCard =
    SETUP_CARDS.find((card) => card.id === selectedSurface) ?? SETUP_CARDS[0];
  const selectedCatalogCard =
    INTEGRATION_CATALOG.find((card) => card.id === selectedCatalogId) ?? null;
  const filteredCatalog = INTEGRATION_CATALOG.filter((card) => {
    const matchesTab = catalogTab === "All" || card.category === catalogTab;
    const haystack = `${card.title} ${card.subtitle} ${card.category}`.toLowerCase();
    return matchesTab && haystack.includes(catalogQuery.trim().toLowerCase());
  });
  const verificationStatus = installationVerification?.status ?? "idle";
  const hasLiveSignals =
    (liveSignals?.memoryCount ?? 0) > 0 ||
    (liveSignals?.requestCount ?? 0) > 0 ||
    (liveSignals?.timelineCount ?? 0) > 0;
  const verificationMessage =
    installationVerification?.message ??
    (hasLiveSignals
      ? "Live backend activity detected for this workspace."
      : "Run a test after copying the setup snippet.");
  const verificationBadgeClass =
    verificationStatus === "connected"
      ? "bg-chart-2/20 text-chart-2"
      : verificationStatus === "waiting"
        ? "bg-chart-5/20 text-chart-5"
        : verificationStatus === "error"
          ? "bg-destructive/20 text-destructive"
          : "bg-primary/20 text-primary";
  const runtimeConnected = verificationStatus === "connected" || hasLiveSignals;
  const runtimeStatusLabel =
    verificationStatus === "waiting"
      ? "Waiting for live event"
      : runtimeConnected
        ? "Connected"
        : "Not connected";
  const runtimeStatusDotClass =
    verificationStatus === "waiting"
      ? "bg-chart-5"
      : runtimeConnected
        ? "bg-chart-2"
        : "bg-destructive";

  const apiBaseUrl = DEFAULT_API_BASE_URL;
  const displayToken = tokenForCode(memoryToken);

  const envBlock = useMemo(
    () => `MEMORYOS_API_KEY=${displayToken}
MEMORYOS_BASE_URL=${apiBaseUrl}`,
    [apiBaseUrl, displayToken],
  );

  const codeBlock = selectedCard.code(displayToken, apiBaseUrl);

  useEffect(() => {
    let cancelled = false;

    async function loadToken() {
      setTokenStatus("checking");
      const token = await getOrCreateMemoryToken();
      if (cancelled) return;
      setMemoryToken(token);
      setTokenStatus(token ? "ready" : "missing");
    }

    void loadToken();

    return () => {
      cancelled = true;
    };
  }, []);

  async function copyText(value: string, blockId: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedBlockId(blockId);
      window.setTimeout(() => {
        setCopiedBlockId((current) => (current === blockId ? null : current));
      }, 1200);
    } catch {
      setCopiedBlockId(null);
    }
  }

  async function refreshToken() {
    setTokenStatus("checking");
    const token = await getOrCreateMemoryToken();
    setMemoryToken(token);
    setTokenStatus(token ? "ready" : "missing");
  }

  return (
    <div className="mx-auto w-full max-w-[1040px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.05em]">Setup Guide</h1>
          <p className="mt-1 max-w-[640px] text-[13px] leading-6 text-muted-foreground">
            Connect MemoryOS through the SDK, MCP adapter, or HTTP API. Each setup path explains when to use it,
            why the step is required, and what live console signal proves it is working.
          </p>
        </div>
        <div className="rounded-[10px] border border-border bg-muted/50 px-3 py-2 text-right">
          
          <div className="mt-1 flex items-center justify-end gap-2">
            <span className={`h-2 w-2 rounded-full ${runtimeStatusDotClass}`} />
            <span className="text-[11px] text-muted-foreground">
              {runtimeStatusLabel}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Token: {tokenStatus === "ready" ? "ready" : tokenStatus === "checking" ? "checking" : "missing"}
          </p>
        </div>
      </div>

      {tokenStatus === "missing" ? (
        <div className="mt-4 rounded-[10px] border border-chart-5/25 bg-muted px-4 py-3 text-[13px] leading-6 text-chart-5">
          The console could not load a MemoryOS token yet. Sign in again or open API Keys to create a token before
          copying production config.
        </div>
      ) : null}

      {!selectedCatalogCard ? (
        <>
          <div className="mt-5">
            <input
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Search integrations..."
              className="h-11 w-full rounded-[8px] border border-border bg-muted/50 px-4 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/70"
            />
            <div className="mt-4 flex gap-6 overflow-x-auto border-b border-border text-[13px]">
              {CATALOG_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCatalogTab(tab)}
                  className={`shrink-0 border-b pb-3 transition ${
                    catalogTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCatalog.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setSelectedCatalogId(card.id);
                  setSelectedSurface(card.surface);
                }}
                className="min-h-[160px] rounded-[8px] border border-border bg-muted/40 p-5 text-left transition hover:border-ring hover:bg-muted"
              >
                <div className="grid h-10 w-10 place-items-center rounded-[7px]  text-[12px] font-bold text-foreground">
                  <CatalogIcon card={card} />
                </div>
                <p className="mt-8 text-[15px] font-semibold text-foreground">{card.title}</p>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{card.subtitle}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setSelectedCatalogId(null)}
          className="mt-5 text-[13px] text-muted-foreground transition hover:text-foreground"
        >
          ← Back to integrations
        </button>
      )}

      {selectedCatalogCard ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-muted text-[13px] font-bold text-foreground">
              <CatalogIcon card={selectedCatalogCard} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-semibold">{selectedCatalogCard.title}</h2>
                <span className="rounded-[6px] bg-primary/20 px-2 py-1 text-[11px] text-primary">
                  {selectedCatalogCard.category}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{selectedCatalogCard.subtitle}</p>
            </div>
          </div>
          <a
            href={selectedCard.docsUrl}
            target={selectedCard.docsUrl.startsWith("http") ? "_blank" : undefined}
            rel={selectedCard.docsUrl.startsWith("http") ? "noreferrer" : undefined}
            className="text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
          >
            Open
          </a>
        </div>
      ) : null}

      {selectedCatalogCard ? (
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {SETUP_CARDS.map((card) => {
          const active = card.id === selectedSurface;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedSurface(card.id)}
              className={`rounded-[10px] border p-4 text-left transition ${
                active
                  ? "border-primary/45 bg-primary/10"
                  : "border-border bg-muted/50 hover:border-ring"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-[8px] text-[11px] font-semibold"
                  style={{ background: `${card.logoTone}22`, color: card.logoTone }}
                >
                  {card.logoText}
                </div>
                <span className="rounded-[7px] border border-border bg-muted/50 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  {card.badge}
                </span>
              </div>
              <p className="mt-4 text-[16px] font-semibold tracking-[-0.03em] text-foreground">
                {card.title}
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{card.subtitle}</p>
              <p className="mt-3 text-[12px] leading-5 text-muted-foreground">{card.summary}</p>
              {active ? (
                <p className="mt-3 rounded-[7px] border border-primary/20 bg-primary/10 px-2.5 py-2 text-[11px] leading-5 text-primary">
                  Selected
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
      ) : null}

      {selectedCatalogCard ? (
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[12px] border border-border bg-card px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {selectedCard.badge}
              </p>
              <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.04em]">
                {selectedCard.title}
              </h2>
              <p className="mt-1 max-w-[560px] text-[13px] leading-6 text-muted-foreground">
                {selectedCard.summary}
              </p>
              <p className="mt-2 max-w-[560px] text-[12px] leading-5 text-muted-foreground">
                Required for live data: MemoryOS needs one authenticated write path and one retrieval path so the console can show real memories, requests, and continuity output.
              </p>
            </div>
            <a
              href={selectedCard.docsUrl}
              target={selectedCard.docsUrl.startsWith("http") ? "_blank" : undefined}
              rel={selectedCard.docsUrl.startsWith("http") ? "noreferrer" : undefined}
              className="rounded-[8px] border border-border bg-muted/50 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-muted-foreground transition hover:border-border"
            >
              DOCS
            </a>
          </div>

          <div className="mt-4 rounded-[10px] border border-border bg-muted px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Install</p>
              <CopyButton
                value={selectedCard.install}
                copied={copiedBlockId === "install"}
                onCopy={(value) => void copyText(value, "install")}
              />
            </div>
            <code className="mt-2 block overflow-x-auto whitespace-pre text-[12px] text-muted-foreground">
              {selectedCard.install}
            </code>
          </div>

          <div className="mt-3 rounded-[10px] border border-border bg-muted px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Environment</p>
              <CopyButton
                value={envBlock}
                copied={copiedBlockId === "env"}
                onCopy={(value) => void copyText(value, "env")}
              />
            </div>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[12px] leading-6 text-muted-foreground">
              <code>{envBlock}</code>
            </pre>
          </div>

          <div className="mt-3 rounded-[10px] border border-border bg-muted px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {selectedCard.id === "mcp" ? "MCP config" : "Verify"}
              </p>
              <CopyButton
                value={codeBlock}
                copied={copiedBlockId === "code"}
                onCopy={(value) => void copyText(value, "code")}
              />
            </div>
            <pre className="mt-2 max-h-[420px] overflow-x-auto whitespace-pre-wrap text-[12px] leading-6 text-muted-foreground">
              <code>{codeBlock}</code>
            </pre>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-[12px] border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Live setup checklist
            </p>
            <div className="mt-3 space-y-3">
              {selectedCard.steps.map((step, index) => (
                <div key={step.title} className="flex gap-3 rounded-[9px] border border-border bg-muted/50 px-3 py-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/35 bg-primary/10 text-[12px] font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{step.action}</p>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                      <span className="text-muted-foreground">Why required:</span> {step.requiredBecause}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-primary">
                      Live proof: {step.liveProof}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[12px] border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Verify installation
            </p>
            <div className="mt-3 flex items-start gap-3 rounded-[9px] border border-border bg-muted/50 px-3 py-3">
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold ${verificationBadgeClass}`}
              >
                {verificationStatus === "connected" ? "✓" : verificationStatus === "waiting" ? "…" : "3"}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  {verificationStatus === "connected" ? "Connected" : verificationStatus === "waiting" ? "Waiting for events" : "Run a live test"}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{verificationMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={installationVerification?.onVerify}
              disabled={verificationStatus === "waiting"}
              className="mt-3 w-full rounded-[8px] bg-primary px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
            >
              {verificationStatus === "connected" ? "Verified" : verificationStatus === "waiting" ? "Waiting..." : "Verify installation"}
            </button>
          </div>

          <div className="rounded-[12px] border border-border bg-card px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Live metrics
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-[8px] border border-border bg-muted/50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Memories</p>
                <p className="mt-1 text-[15px] font-semibold text-foreground">{liveSignals?.memoryCount ?? 0}</p>
              </div>
              <div className="rounded-[8px] border border-border bg-muted/50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Requests</p>
                <p className="mt-1 text-[15px] font-semibold text-foreground">{liveSignals?.requestCount ?? 0}</p>
              </div>
              <div className="rounded-[8px] border border-border bg-muted/50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Timeline</p>
                <p className="mt-1 text-[15px] font-semibold text-foreground">{liveSignals?.timelineCount ?? 0}</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Last route: {liveSignals?.lastRequestRoute ?? "No request yet"}
            </p>
          </div>
        </aside>
      </div>
      ) : null}
    </div>
  );
}
