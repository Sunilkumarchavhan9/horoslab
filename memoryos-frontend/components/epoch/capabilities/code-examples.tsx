"use client";

import React, { useState } from "react";
import { Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeExamplesProps {
  capabilityId: string;
}

export function CodeExamples({ capabilityId }: CodeExamplesProps) {
  const [activeTab, setActiveTab] = useState("curl");

  const tabs = [
    "curl",
    "Python",
    "Node",
    "Image input",
    "AI SDK",
    "Anthropic SDK",
    "Claude Code",
  ];

  const tabConfig: Record<string, { badge: string; title: string; hasDocs?: boolean; language: string }> = {
    "curl": { badge: "Shell", title: "Chat completion", language: "bash" },
    "Python": { badge: "Python", title: "OpenAI Python SDK", language: "python" },
    "Node": { badge: "TypeScript", title: "OpenAI Node SDK", language: "typescript" },
    "Image input": { badge: "Python", title: "Image input", language: "python" },
    "AI SDK": { badge: "TypeScript", title: "AI SDK", language: "typescript" },
    "Anthropic SDK": { badge: "Python", title: "Anthropic SDK", hasDocs: true, language: "python" },
    "Claude Code": { badge: "Shell", title: "Claude Code", hasDocs: true, language: "bash" },
  };

  const getCodeSnippet = () => {
    switch (activeTab) {
      case "curl":
        return `CLIENT_REQUEST_ID="$(uuidgen)"

curl -X POST "https://api.epochinfra.com/v1/chat/completions" \\
  -H "Authorization: Bearer $EPOCH_GATEWAY_KEY" \\
  -H "X-Client-Request-Id: $CLIENT_REQUEST_ID" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${capabilityId}","messages":[{"role":"user","content":"Hello"}],"max_tokens":2048}'`;
      case "Python":
        return `import os
import uuid
from openai import OpenAI

api_key = os.environ.get("EPOCH_GATEWAY_KEY")
if not api_key: raise RuntimeError("Set EPOCH_GATEWAY_KEY first.")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.epochinfra.com/v1",
)

response = client.chat.completions.create(
    model="${capabilityId}",
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=2048,
    extra_headers={"X-Client-Request-Id": str(uuid.uuid4())},
)
print(response.choices[0].message.content)`;
      case "Node":
        return `import { randomUUID } from "node:crypto";
import OpenAI from "openai";

const apiKey = process.env.EPOCH_GATEWAY_KEY;
if (!apiKey) throw new Error("Set EPOCH_GATEWAY_KEY first.");

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.epochinfra.com/v1",
});

const response = await client.chat.completions.create(
  {
    model: "${capabilityId}",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 2048,
  },
  { headers: { "X-Client-Request-Id": randomUUID() } },
);

console.log(response.choices[0]?.message.content ?? "");`;
      case "Image input":
        return `import base64
import os
import uuid
from openai import OpenAI

api_key = os.environ.get("EPOCH_GATEWAY_KEY")
if not api_key: raise RuntimeError("Set EPOCH_GATEWAY_KEY first.")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.epochinfra.com/v1",
)

# Images travel inline as base64 data URLs (png, jpeg, webp or gif,
# up to 8 per request). Remote image URLs are not fetched.
with open("photo.jpg", "rb") as image_file:
    image_b64 = base64.b64encode(image_file.read()).decode("ascii")

response = client.chat.completions.create(
    model="${capabilityId}",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this photo?"},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                },
            ],
        }
    ],
    max_tokens=2048,
    extra_headers={"X-Client-Request-Id": str(uuid.uuid4())},
)
print(response.choices[0].message.content)`;
      case "AI SDK":
        return `// Server-side only: never expose EPOCH_GATEWAY_KEY in browser code.
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const apiKey = process.env.EPOCH_GATEWAY_KEY;
if (!apiKey) throw new Error("Set EPOCH_GATEWAY_KEY first.");

const epochinfra = createOpenAICompatible({
  name: "epochinfra",
  baseURL: "https://api.epochinfra.com/v1",
  apiKey,
});

const { text } = await generateText({
  model: epochinfra.chatModel("${capabilityId}"),
  maxOutputTokens: 2048,
  messages: [
    { role: "user", content: "Write a TypeScript retry helper." },
  ],
});

console.log(text);`;
      case "Anthropic SDK":
        return `import os
from anthropic import Anthropic

client = Anthropic(
    # The SDK appends /v1, so use the bare host.
    base_url="https://api.epochinfra.com",
    api_key=os.environ.get("EPOCH_GATEWAY_KEY"),
)

message = client.messages.create(
    model="${capabilityId}",
    max_tokens=2048,
    messages=[{"role": "user", "content": "Hello"}],
)
print(message.content[0].text)`;
      case "Claude Code":
        return `export ANTHROPIC_BASE_URL="https://api.epochinfra.com"
export ANTHROPIC_AUTH_TOKEN=$EPOCH_GATEWAY_KEY
export ANTHROPIC_MODEL="${capabilityId}"
export ANTHROPIC_DEFAULT_SONNET_MODEL="${capabilityId}"
export ANTHROPIC_DEFAULT_OPUS_MODEL="${capabilityId}"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="${capabilityId}"
export CLAUDE_CODE_SUBAGENT_MODEL="${capabilityId}"
claude`;
      default:
        return "";
    }
  };

  const currentConfig = tabConfig[activeTab];

  return (
    <div className="w-full">
      <h2 className="text-[20px] font-semibold text-[#F0EFE2] mb-2">Code examples</h2>
      <p className="text-[12px] text-[#777] mb-6">Set EPOCH_GATEWAY_KEY to your workspace API key before using an example.</p>
      
      <div className="w-full border border-dashed border-[#333] bg-[#202020] flex flex-col rounded-[2px]">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-dashed border-[#333] px-4 py-3 gap-4 md:gap-0">
          
          {/* Left Side: Tabs + Environment Badge + Title */}
          <div className="flex items-center gap-5 text-[13px] overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`transition-colors whitespace-nowrap px-4 py-1.5 ${
                  activeTab === tab
                    ? "text-[#F0EFE2] border border-[#444] bg-[#2B2B28] font-medium"
                    : "text-[#888] hover:text-[#F0EFE2]"
                }`}
              >
                {tab}
              </button>
            ))}

            <div className="flex items-center gap-3 ml-4">
              <span className="text-[#76b900] border border-dashed border-[#444] px-3 py-1 text-[12px] whitespace-nowrap">
                {currentConfig.badge}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[#F0EFE2] text-[13px] whitespace-nowrap">{currentConfig.title}</span>
                {currentConfig.hasDocs && (
                  <a href="#" className="text-[#888] text-[13px] hover:text-[#F0EFE2] underline underline-offset-4 decoration-[#555] transition-colors whitespace-nowrap">
                    Read docs
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Side: Copy Button */}
          <button 
            className="flex items-center gap-2 text-[12px] text-[#F0EFE2] border border-dashed border-[#444] px-4 py-1.5 hover:border-[#666] transition-colors shrink-0 w-fit"
            onClick={() => navigator.clipboard.writeText(getCodeSnippet())}
          >
            <Copy size={14} /> Copy
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 md:p-8 font-mono text-[13px] overflow-x-auto">
          <SyntaxHighlighter
            language={currentConfig.language}
            style={vscDarkPlus}
            customStyle={{
              backgroundColor: "transparent",
              margin: 0,
              padding: 0,
              fontSize: "13px",
              lineHeight: "2",
            }}
            codeTagProps={{ style: { fontFamily: "inherit" } }}
          >
            {getCodeSnippet()}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
