"use client";

import { useState } from "react";
import { MCP_SOURCE_CARDS, McpSourceNetwork } from "./mcp-source-network";
import { Reveal } from "./motion";
import { WatchtowerModal } from "./watchtower-modal";

export function DeveloperExperienceSection() {
  const [activeMcpSource, setActiveMcpSource] = useState(MCP_SOURCE_CARDS[0]);

  return (
    <section id="developer-experience" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-t border-[#e5e7eb] bg-white pb-8 pt-24 lg:pb-12 lg:pt-32">
      <div className="relative z-10 mx-auto max-w-[1720px] px-4 sm:px-8 lg:px-12 xl:px-16">
        <Reveal>
          <div className="mx-auto mb-16 max-w-4xl text-center lg:mb-20">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#356acc]">Agent-native integrations</p>
            <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1]">
              Built above identity, inboxes, wallets, MCP, and <span className="text-[#0015FF]">tools.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-[#5a6f89] md:text-[17px] md:leading-8">
              Invoke governed institutions from the tools agents and humans already use. Every surface connects to the same mission context, authority system, evidence graph, and settlement trail.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="relative mx-auto max-w-[1600px]">
            <McpSourceNetwork selectedSourceId={activeMcpSource.id} onSourceSelect={setActiveMcpSource} />
            <div className="relative z-30 mx-auto -mt-[390px] w-[min(1240px,calc(100%-32px))] overflow-x-auto sm:-mt-[440px] lg:-mt-[500px] lg:overflow-visible">
              <WatchtowerModal mcpSource={activeMcpSource} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
