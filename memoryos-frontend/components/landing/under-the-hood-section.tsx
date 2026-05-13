"use client";

import { useState } from "react";
import { Reveal } from "./motion";

type GraphNodeKind = "session" | "operation" | "memory" | "agent";

type GraphNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  kind: GraphNodeKind;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  color: string;
};

type SelectedGraphItem =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | null;

const memoryGraph: {
  nodes: GraphNode[];
  edges: GraphEdge[];
} = {
  nodes: [
    // Live Sessions
    { id: "s1", label: "", x: 100, y: 110, color: "#4f93ff", kind: "session" },
    { id: "s2", label: "", x: 100, y: 190, color: "#4f93ff", kind: "session" },
    { id: "s3", label: "", x: 100, y: 270, color: "#4f93ff", kind: "session" },
    { id: "s4", label: "", x: 100, y: 350, color: "#4f93ff", kind: "session" },
    { id: "s5", label: "", x: 100, y: 430, color: "#4f93ff", kind: "session" },
    { id: "s6", label: "", x: 100, y: 510, color: "#4f93ff", kind: "session" },

    { id: "s1b", label: "", x: 190, y: 110, color: "#4f93ff", kind: "session" },
    { id: "s2b", label: "", x: 190, y: 190, color: "#4f93ff", kind: "session" },
    { id: "s3b", label: "", x: 190, y: 270, color: "#4f93ff", kind: "session" },
    { id: "s4b", label: "", x: 190, y: 350, color: "#4f93ff", kind: "session" },
    { id: "s5b", label: "", x: 190, y: 430, color: "#4f93ff", kind: "session" },
    { id: "s6b", label: "", x: 190, y: 510, color: "#4f93ff", kind: "session" },

    // Memory Operations
    { id: "resume", label: "resume", x: 390, y: 130, color: "#8b5cf6", kind: "operation" },
    { id: "handoff", label: "handoff", x: 390, y: 210, color: "#fbbf24", kind: "operation" },
    { id: "insights", label: "insights", x: 390, y: 290, color: "#f472b6", kind: "operation" },
    { id: "timeline", label: "timeline", x: 390, y: 370, color: "#64748b", kind: "operation" },
    { id: "other", label: "other", x: 390, y: 450, color: "#a8a29e", kind: "operation" },
    { id: "process", label: "process", x: 390, y: 530, color: "#14c38e", kind: "operation" },

    // Stored Knowledge
    { id: "m0", label: "Building MemoryOS", x: 620, y: 90, color: "#ef6b45", kind: "memory" },
    { id: "m1", label: "agent-a chat turn stored fo...", x: 620, y: 140, color: "#ef6b45", kind: "memory" },
    { id: "m2", label: "agent-a chat turn stored fo...", x: 620, y: 190, color: "#ef6b45", kind: "memory" },
    { id: "m3", label: "agent-b handoff turn stored...", x: 620, y: 240, color: "#ef6b45", kind: "memory" },
    { id: "m4", label: "agent-a chat turn stored fo...", x: 620, y: 290, color: "#ef6b45", kind: "memory" },
    { id: "m5", label: "agent-a chat turn stored fo...", x: 620, y: 340, color: "#ef6b45", kind: "memory" },
    { id: "m6", label: "agent-a chat turn stored fo...", x: 620, y: 390, color: "#ef6b45", kind: "memory" },
    { id: "m7", label: "agent-a chat turn stored fo...", x: 620, y: 440, color: "#ef6b45", kind: "memory" },
    { id: "m8", label: "agent-b handoff turn stored...", x: 620, y: 490, color: "#ef6b45", kind: "memory" },
    { id: "m9", label: "agent-b chat turn stored fo...", x: 620, y: 540, color: "#ef6b45", kind: "memory" },

    // Live Agents
    { id: "ide", label: "IDE Copilot", x: 880, y: 200, color: "#e11d48", kind: "agent" },
    { id: "auto", label: "Autopilot", x: 880, y: 320, color: "#e11d48", kind: "agent" },
    { id: "cli", label: "CLI Agent", x: 880, y: 440, color: "#e11d48", kind: "agent" },
  ],

  edges: [
    // Session internal links
    { id: "s-e1", from: "s1", to: "s1b", color: "#4f93ff" },
    { id: "s-e2", from: "s2", to: "s2b", color: "#4f93ff" },
    { id: "s-e3", from: "s3", to: "s3b", color: "#4f93ff" },
    { id: "s-e4", from: "s4", to: "s4b", color: "#4f93ff" },
    { id: "s-e5", from: "s5", to: "s5b", color: "#4f93ff" },
    { id: "s-e6", from: "s6", to: "s6b", color: "#4f93ff" },

    // Sessions to operations
    { id: "o-e1", from: "s1b", to: "resume", color: "#4f93ff" },
    { id: "o-e2", from: "s3b", to: "resume", color: "#4f93ff" },
    { id: "o-e3", from: "s2b", to: "handoff", color: "#4f93ff" },
    { id: "o-e4", from: "s5b", to: "insights", color: "#4f93ff" },
    { id: "o-e5", from: "s4b", to: "timeline", color: "#4f93ff" },
    { id: "o-e6", from: "s6b", to: "timeline", color: "#4f93ff" },
    { id: "o-e7", from: "s1b", to: "other", color: "#4f93ff" },
    { id: "o-e8", from: "s6b", to: "other", color: "#4f93ff" },

    // Operations to memories
    { id: "m-e1", from: "resume", to: "m0", color: "#ef6b45" },
    { id: "m-e2", from: "resume", to: "m1", color: "#ef6b45" },
    { id: "m-e3", from: "resume", to: "m3", color: "#ef6b45" },
    { id: "m-e4", from: "resume", to: "m6", color: "#ef6b45" },

    { id: "m-e5", from: "handoff", to: "m2", color: "#ef6b45" },
    { id: "m-e6", from: "handoff", to: "m3", color: "#ef6b45" },
    { id: "m-e7", from: "handoff", to: "m5", color: "#ef6b45" },
    { id: "m-e8", from: "handoff", to: "m8", color: "#ef6b45" },

    { id: "m-e9", from: "insights", to: "m0", color: "#ef6b45" },
    { id: "m-e10", from: "insights", to: "m2", color: "#ef6b45" },
    { id: "m-e11", from: "insights", to: "m4", color: "#ef6b45" },
    { id: "m-e12", from: "insights", to: "m6", color: "#ef6b45" },
    { id: "m-e13", from: "insights", to: "m9", color: "#ef6b45" },

    { id: "m-e14", from: "timeline", to: "m1", color: "#ef6b45" },
    { id: "m-e15", from: "timeline", to: "m4", color: "#ef6b45" },
    { id: "m-e16", from: "timeline", to: "m7", color: "#ef6b45" },
    { id: "m-e17", from: "timeline", to: "m9", color: "#ef6b45" },

    { id: "m-e18", from: "other", to: "m0", color: "#ef6b45" },
    { id: "m-e19", from: "other", to: "m5", color: "#ef6b45" },
    { id: "m-e20", from: "other", to: "m8", color: "#ef6b45" },

    { id: "m-e21", from: "process", to: "m0", color: "#ef6b45" },
    { id: "m-e22", from: "process", to: "m1", color: "#ef6b45" },
    { id: "m-e23", from: "process", to: "m2", color: "#ef6b45" },
    { id: "m-e24", from: "process", to: "m3", color: "#ef6b45" },
    { id: "m-e25", from: "process", to: "m4", color: "#ef6b45" },
    { id: "m-e26", from: "process", to: "m5", color: "#ef6b45" },
    { id: "m-e27", from: "process", to: "m6", color: "#ef6b45" },
    { id: "m-e28", from: "process", to: "m7", color: "#ef6b45" },
    { id: "m-e29", from: "process", to: "m8", color: "#ef6b45" },
    { id: "m-e30", from: "process", to: "m9", color: "#ef6b45" },

    // Memories to agents
    { id: "a-e1", from: "m0", to: "ide", color: "#e11d48" },
    { id: "a-e2", from: "m2", to: "ide", color: "#e11d48" },
    { id: "a-e3", from: "m5", to: "ide", color: "#e11d48" },

    { id: "a-e4", from: "m3", to: "auto", color: "#e11d48" },
    { id: "a-e5", from: "m4", to: "auto", color: "#e11d48" },
    { id: "a-e6", from: "m8", to: "auto", color: "#e11d48" },

    { id: "a-e7", from: "m1", to: "cli", color: "#e11d48" },
    { id: "a-e8", from: "m6", to: "cli", color: "#e11d48" },
    { id: "a-e9", from: "m9", to: "cli", color: "#e11d48" },
  ],
};

export function UnderTheHoodSection() {
  const [selectedGraphItem, setSelectedGraphItem] = useState<SelectedGraphItem>(null);

  const hasGraphData = memoryGraph.nodes.length > 0 && memoryGraph.edges.length > 0;

  const selectedGraphNode =
    selectedGraphItem?.kind === "node"
      ? memoryGraph.nodes.find((node) => node.id === selectedGraphItem.id) ?? null
      : null;

  const selectedGraphEdge =
    selectedGraphItem?.kind === "edge"
      ? memoryGraph.edges.find((edge) => edge.id === selectedGraphItem.id) ?? null
      : null;

  return (
    <section className="border-b border-[#c9d8ee] px-5 pt-7">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-5xl">
          Production memory lifecycle, end to end
        </h2>

        <p className="mx-auto mt-3 max-w-3xl text-center text-base text-slate-600 md:text-lg">
          MemoryOS implements extraction, contract scoring, merge/evolve logic, retrieval reranking,
          revision history, and explainable injection in one continuity flow.
        </p>
      </Reveal>

      <Reveal className="mt-6">
        <div className="overflow-hidden bg-white">
          <div className="flex items-center justify-between bg-white px-5 py-4">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950">
              Live Brain Map
            </h2>

            {selectedGraphItem ? (
              <button
                type="button"
                onClick={() => setSelectedGraphItem(null)}
                className="text-[11px] font-bold uppercase tracking-widest text-slate-500 transition hover:text-slate-950"
              >
                Clear Focus
              </button>
            ) : null}
          </div>

          <div className="group relative min-h-[640px] overflow-hidden bg-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,147,255,0.08),transparent_70%)]" />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_100%)]" />

            {hasGraphData ? (
              <svg
                viewBox="0 0 1020 640"
                className="absolute inset-0 h-full w-full"
                role="img"
                aria-label="MemoryOS live brain map"
              >
                <defs>
                  <filter id="memory-graph-soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow
                      dx="0"
                      dy="8"
                      stdDeviation="8"
                      floodColor="#0f172a"
                      floodOpacity="0.18"
                    />
                    <feDropShadow
                      dx="0"
                      dy="3"
                      stdDeviation="4"
                      floodColor="#4f93ff"
                      floodOpacity="0.18"
                    />
                  </filter>

                  <filter id="beam-glow-blue" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <filter id="beam-glow-orange" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="3.4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <filter id="beam-glow-red" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="2.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect width="1020" height="640" fill="transparent" />

                <g opacity="0.8">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <line
                      key={`v-${index}`}
                      x1={70 + index * 80}
                      y1="65"
                      x2={70 + index * 80}
                      y2="600"
                      stroke="#cbd5e1"
                      strokeWidth="0.7"
                    />
                  ))}

                  {Array.from({ length: 8 }).map((_, index) => (
                    <line
                      key={`h-${index}`}
                      x1="50"
                      y1={80 + index * 70}
                      x2="970"
                      y2={80 + index * 70}
                      stroke="#cbd5e1"
                      strokeWidth="0.7"
                    />
                  ))}
                </g>

                {[
                  { label: "Live Sessions", x: 90, y: 36, color: "#4f93ff", width: 185 },
                  { label: "Memory Operations", x: 315, y: 36, color: "#14c38e", width: 200 },
                  { label: "Stored Knowledge", x: 600, y: 36, color: "#ef6b45", width: 200 },
                  { label: "Live Agents", x: 810, y: 36, color: "#e11d48", width: 190 },
                ].map((heading) => (
                  <g key={heading.label}>
                    <rect
                      x={heading.x - 25}
                      y="14"
                      width={heading.width}
                      height="34"
                      rx="8"
                      fill={heading.color}
                      opacity="0.12"
                    />
                    <circle cx={heading.x - 12} cy="31" r="4" fill={heading.color} />
                    <text
                      x={heading.x}
                      y="36"
                      fill="#0f172a"
                      fontSize="12"
                      fontWeight="900"
                      letterSpacing="2"
                    >
                      {heading.label.toUpperCase()}
                    </text>
                  </g>
                ))}

                {memoryGraph.edges.map((edge) => {
                  const from = memoryGraph.nodes.find((node) => node.id === edge.from);
                  const to = memoryGraph.nodes.find((node) => node.id === edge.to);

                  if (!from || !to) return null;

                  const selected = selectedGraphEdge?.id === edge.id;

                  const isConnectedToSelectedNode = selectedGraphNode
                    ? from.id === selectedGraphNode.id || to.id === selectedGraphNode.id
                    : true;

                  const isFaint = selectedGraphNode ? !isConnectedToSelectedNode : false;

                  const isOrangeMesh = edge.color === "#ef6b45";
                  const isAgentEdge = edge.color === "#e11d48";
                  const isBlueEdge = edge.color === "#4f93ff";

                  const strokeWidth = selected
                    ? 9
                    : isOrangeMesh
                      ? 1.75
                      : isAgentEdge
                        ? 1.55
                        : 1.45;

                  const strokeOpacity = selected
                    ? 1
                    : isFaint
                      ? 0.04
                      : isOrangeMesh
                        ? 0.7
                        : isAgentEdge
                          ? 0.68
                          : 0.62;

                  const controlOffset = Math.max(70, Math.abs(to.x - from.x) * 0.52);

                  const control1X = from.x + controlOffset;
                  const control1Y = from.y;
                  const control2X = to.x - controlOffset;
                  const control2Y = to.y;

                  const path = `M ${from.x} ${from.y} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${to.x} ${to.y}`;

                  const animDuration = isOrangeMesh
                    ? 1.25 + ((from.y + to.y) % 5) * 0.12
                    : 1.75 + ((from.y + to.y) % 4) * 0.18;

                  const beamStroke = isOrangeMesh
                    ? "#fb6b2f"
                    : isAgentEdge
                      ? "#e11d48"
                      : "#2563eb";

                  const beamWidth = selected
                    ? 3
                    : isOrangeMesh
                      ? 2.1
                      : 1.8;

                  const beamOpacity = selected
                    ? 1
                    : isFaint
                      ? 0
                      : isOrangeMesh
                        ? 0.55
                        : isAgentEdge
                          ? 0.48
                          : 0.42;

                  const beamFilter = isOrangeMesh
                    ? "url(#beam-glow-orange)"
                    : isAgentEdge
                      ? "url(#beam-glow-red)"
                      : isBlueEdge
                        ? "url(#beam-glow-blue)"
                        : undefined;

                  return (
                    <g
                      key={edge.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedGraphItem({ kind: "edge", id: edge.id })}
                    >
                      <path
                        d={path}
                        fill="none"
                        stroke={edge.color}
                        strokeOpacity={strokeOpacity}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                      />

                      {!isFaint && (
                        <path
                          d={path}
                          fill="none"
                          stroke={beamStroke}
                          strokeWidth={beamWidth}
                          strokeLinecap="round"
                          strokeDasharray="10 1500"
                          opacity={beamOpacity}
                          filter={beamFilter}
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="1500"
                            to="0"
                            dur={`${animDuration}s`}
                            repeatCount="indefinite"
                          />
                        </path>
                      )}

                      <path d={path} fill="none" stroke="transparent" strokeWidth="18" />
                    </g>
                  );
                })}

                {memoryGraph.nodes.map((node) => {
                  const selected = selectedGraphNode?.id === node.id;

                  const rectHeight =
                    node.kind === "memory"
                      ? 22
                      : node.kind === "operation"
                        ? 42
                        : node.kind === "agent"
                          ? 22
                          : 20;

                  const rectWidth = 6;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer transition-opacity duration-300"
                      onClick={() => setSelectedGraphItem({ kind: "node", id: node.id })}
                      style={{ opacity: selectedGraphNode && !selected ? 0.3 : 1 }}
                    >
                      {selected && (
                        <rect
                          x={node.x - rectWidth / 2 - 6}
                          y={node.y - rectHeight / 2 - 6}
                          width={rectWidth + 12}
                          height={rectHeight + 12}
                          fill={node.color}
                          opacity={0.3}
                          rx={5}
                        />
                      )}

                      <rect
                        x={node.x - rectWidth / 2}
                        y={node.y - rectHeight / 2}
                        width={rectWidth}
                        height={rectHeight}
                        fill={selected ? "#111827" : node.color}
                        rx={2}
                        filter="url(#memory-graph-soft-shadow)"
                      />

                      {node.label ? (
                        <text
                          x={node.x + 14}
                          y={node.y + 4}
                          fill={selected ? "#0f172a" : "#111827"}
                          fontSize={node.kind === "memory" ? "10.5" : "12"}
                          fontWeight="800"
                        >
                          {node.label}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <p className="text-[13px] font-medium text-slate-400">No graph data yet.</p>
              </div>
            )}
          </div>
        </div>
      </Reveal>

 
    </section>
  );
}
