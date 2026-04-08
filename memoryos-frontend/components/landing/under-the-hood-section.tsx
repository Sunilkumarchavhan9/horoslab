import { Reveal } from "./motion";

function hexPoints(cx: number, cy: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ");
}

function LeftMemoryDiagram() {
  const leftNodes = [
    { x: 42, y: 78, r: 23 },
    { x: 70, y: 166, r: 30 },
    { x: 162, y: 124, r: 18 },
    { x: 194, y: 216, r: 18 },
    { x: 232, y: 308, r: 30 },
    { x: 62, y: 372, r: 24 },
    { x: 212, y: 396, r: 20 },
  ];
  const rightNodes = [
    { x: 352, y: 170, r: 31 },
    { x: 390, y: 112, r: 19 },
    { x: 458, y: 84, r: 30 },
    { x: 430, y: 228, r: 24 },
    { x: 498, y: 286, r: 22 },
    { x: 554, y: 358, r: 16 },
    { x: 394, y: 336, r: 24 },
  ];

  return (
    <svg viewBox="0 0 608 401" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="leftHexFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c9dbf4" />
          <stop offset="100%" stopColor="#aec4e5" />
        </linearGradient>
        <filter id="leftSoftShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.8" floodColor="#5a7fbc" floodOpacity="0.22" />
        </filter>
      </defs>

      <rect x="0" y="228" width="52" height="90" rx="16" fill="#a9c0e7" stroke="#5e7fb7" strokeWidth="1.7" />
      <text x="26" y="278" textAnchor="middle" fontSize="12.5" fill="#4f6f9f" fontFamily="Inter, sans-serif">
        Doc
      </text>

      <rect x="552" y="146" width="52" height="86" rx="16" fill="#a9c0e7" stroke="#5e7fb7" strokeWidth="1.7" />
      <text x="578" y="193" textAnchor="middle" fontSize="12.5" fill="#4f6f9f" fontFamily="Inter, sans-serif">
        Doc
      </text>

      <line x1="44" y1="261" x2="42" y2="78" stroke="#32589a" strokeWidth="2" />
      <line x1="44" y1="261" x2="70" y2="166" stroke="#32589a" strokeWidth="2" />
      <line x1="44" y1="261" x2="162" y2="124" stroke="#32589a" strokeWidth="2" />
      <line x1="44" y1="261" x2="194" y2="216" stroke="#32589a" strokeWidth="2" />
      <line x1="44" y1="261" x2="232" y2="308" stroke="#32589a" strokeWidth="2" />
      <line x1="44" y1="261" x2="62" y2="372" stroke="#32589a" strokeWidth="2" />
      <line x1="44" y1="261" x2="212" y2="396" stroke="#32589a" strokeWidth="2" />

      <line x1="44" y1="261" x2="552" y2="188" stroke="#32589a" strokeWidth="2.1" />
      <line x1="552" y1="188" x2="352" y2="170" stroke="#32589a" strokeWidth="2.1" />
      <line x1="552" y1="188" x2="390" y2="112" stroke="#32589a" strokeWidth="2.1" />
      <line x1="552" y1="188" x2="458" y2="84" stroke="#32589a" strokeWidth="2.1" />
      <line x1="552" y1="188" x2="430" y2="228" stroke="#32589a" strokeWidth="2.1" />
      <line x1="552" y1="188" x2="498" y2="286" stroke="#32589a" strokeWidth="2.1" />
      <line x1="552" y1="188" x2="554" y2="358" stroke="#32589a" strokeWidth="2.1" />
      <line x1="552" y1="188" x2="394" y2="336" stroke="#32589a" strokeWidth="2.1" />

      {leftNodes.map((node, index) => (
        <polygon
          key={`left-${index + 1}`}
          points={hexPoints(node.x, node.y, node.r)}
          fill="url(#leftHexFill)"
          stroke="#365f9f"
          strokeWidth="2"
          filter="url(#leftSoftShadow)"
        />
      ))}
      {rightNodes.map((node, index) => (
        <polygon
          key={`right-${index + 1}`}
          points={hexPoints(node.x, node.y, node.r)}
          fill="url(#leftHexFill)"
          stroke="#365f9f"
          strokeWidth="2"
          filter="url(#leftSoftShadow)"
        />
      ))}

      <line x1="200" y1="126" x2="332" y2="126" stroke="#f09500" strokeWidth="2.2" />
      <line x1="332" y1="126" x2="352" y2="106" stroke="#f09500" strokeWidth="2.2" />
      <circle cx="354" cy="98" r="3.5" fill="#f09500" />
      <polygon points={hexPoints(372, 96, 18)} fill="none" stroke="#f09500" strokeWidth="3" />
      <rect x="194" y="104" width="104" height="20" rx="5" fill="#eaf1fb" />
      <text x="198" y="118" fill="#f09500" fontSize="14" fontFamily="Inter, sans-serif">
        Expiring Soon
      </text>

      <line x1="314" y1="46" x2="434" y2="46" stroke="#ff5b6a" strokeWidth="2.2" />
      <line x1="434" y1="46" x2="456" y2="24" stroke="#ff5b6a" strokeWidth="2.2" />
      <circle cx="458" cy="28" r="3.5" fill="#ff5b6a" />
      <polygon points={hexPoints(478, 26, 20)} fill="none" stroke="#ff5b6a" strokeWidth="2.8" />
      <line x1="466" y1="15" x2="492" y2="37" stroke="#ff5b6a" strokeWidth="2" />
      <line x1="466" y1="37" x2="492" y2="15" stroke="#ff5b6a" strokeWidth="2" />
      <rect x="308" y="48" width="76" height="18" rx="5" fill="#eaf1fb" />
      <text x="312" y="61" fill="#ff5b6a" fontSize="14" fontFamily="Inter, sans-serif">
        Forgotten
      </text>

      <polygon points={hexPoints(168, 318, 21)} fill="#506b9a" stroke="#365f9f" strokeWidth="2" />
      <path d="M152 308L165 298L182 308L186 323L174 334L158 329Z" fill="#3c5383" />
      <circle cx="186" cy="334" r="4" fill="#365f9f" />
      <line x1="186" y1="334" x2="224" y2="360" stroke="#365f9f" strokeWidth="2" />
      <line x1="224" y1="360" x2="360" y2="360" stroke="#365f9f" strokeWidth="2" />
      <text x="368" y="364" fill="#4f6383" fontSize="14" fontFamily="Inter, sans-serif">
        New Memory
      </text>

      <line x1="184" y1="318" x2="308" y2="270" stroke="#7a98cd" strokeWidth="2" />
      <line x1="182" y1="320" x2="322" y2="313" stroke="#7a98cd" strokeWidth="2" />

      <g transform="rotate(-20 318 279)">
        <rect x="276" y="267" width="84" height="24" rx="4" fill="#244aa6" />
        <text x="318" y="283" textAnchor="middle" fill="#eef4ff" fontSize="12" fontFamily="Inter, sans-serif">
          Update
        </text>
      </g>

      <rect x="262" y="302" width="84" height="24" rx="4" fill="#244aa6" />
      <text x="304" y="318" textAnchor="middle" fill="#eef4ff" fontSize="12" fontFamily="Inter, sans-serif">
        Update
      </text>

      <text x="16" y="389" fontSize="12" fontFamily="monospace" fill="#5e7aa5">
        extract → score → merge/evolve → timeline + revisions
      </text>
    </svg>
  );
}

function RightGraphDiagram() {
  const center = { x: 324, y: 186 };
  const nodes = [
    { x: 324, y: 42, r: 17, muted: false },
    { x: 226, y: 84, r: 15, muted: false },
    { x: 438, y: 84, r: 15, muted: true },
    { x: 182, y: 148, r: 19, muted: false },
    { x: 250, y: 234, r: 15, muted: false },
    { x: 344, y: 238, r: 15, muted: false },
    { x: 482, y: 146, r: 18, muted: false },
    { x: 516, y: 226, r: 18, muted: false },
    { x: 424, y: 300, r: 19, muted: true },
    { x: 296, y: 318, r: 18, muted: false },
    { x: 192, y: 292, r: 20, muted: false },
    { x: 108, y: 224, r: 14, muted: false },
    { x: 106, y: 138, r: 15, muted: false },
    { x: 390, y: 112, r: 13, muted: false },
    { x: 460, y: 178, r: 17, muted: false },
    { x: 564, y: 152, r: 20, muted: false },
  ];

  const focusEdges = [
    { x1: 182, y1: 148, x2: 482, y2: 146, color: "#20b2ae" },
    { x1: 250, y1: 234, x2: 390, y2: 112, color: "#20b2ae" },
    { x1: 192, y1: 292, x2: 460, y2: 178, color: "#20b2ae" },
    { x1: 108, y1: 224, x2: 192, y2: 292, color: "#20b2ae" },
    { x1: 344, y1: 238, x2: 516, y2: 226, color: "#20b2ae" },
    { x1: 296, y1: 318, x2: 106, y2: 138, color: "#20b2ae" },
    { x1: 516, y1: 226, x2: 424, y2: 300, color: "#e1a2e1" },
  ];

  return (
    <svg viewBox="0 0 640 400" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowTealR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10Z" fill="#20b2ae" />
        </marker>
        <marker id="arrowPinkR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10Z" fill="#e1a2e1" />
        </marker>
      </defs>

      <text x="20" y="26" fontSize="12" fontFamily="monospace" fill="#4f6f9f" letterSpacing="1.2">
        RETRIEVE + RERANK
      </text>

      {nodes.map((node, index) => (
        <line
          key={`spoke-${index + 1}`}
          x1={center.x}
          y1={center.y}
          x2={node.x}
          y2={node.y}
          stroke={node.muted ? "#bfcee5" : "#95b5e8"}
          strokeWidth="2"
          opacity={node.muted ? 0.58 : 0.9}
        />
      ))}

      {focusEdges.map((edge, index) => (
        <line
          key={`focus-${index + 1}`}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          stroke={edge.color}
          strokeWidth="2.4"
          markerEnd={edge.color === "#e1a2e1" ? "url(#arrowPinkR)" : "url(#arrowTealR)"}
        />
      ))}

      <rect x="298" y="160" width="52" height="52" rx="14" fill="#d5dde8" stroke="#aab9cd" strokeWidth="2.2" />
      <circle cx="324" cy="186" r="10" fill="none" stroke="#889ab2" strokeWidth="2.2" />
      <path d="M318.5 186H329.5M324 180.5V191.5" stroke="#889ab2" strokeWidth="2.2" strokeLinecap="round" />
      <text x="324" y="230" textAnchor="middle" fill="#4f6383" fontSize="12" fontFamily="Inter, sans-serif">
        Dev profile
      </text>

      <circle cx="256" cy="207" r="11.5" fill="#a8cae6" stroke="#8db7d9" strokeWidth="2" />

      {nodes.map((node, index) => (
        <polygon
          key={`node-${index + 1}`}
          points={hexPoints(node.x, node.y, node.r)}
          fill={node.muted ? "#c5d5e8" : "#b5d8f8"}
          stroke={node.muted ? "#9eb2ca" : "#5d9ff0"}
          strokeWidth="2.2"
          opacity={node.muted ? 0.74 : 1}
        />
      ))}

      <text x="22" y="364" fontSize="12" fontFamily="monospace" fill="#5e7aa5">
        semantic + type + importance + recency → explain → resume
      </text>
    </svg>
  );
}

export function UnderTheHoodSection() {
  return (
    <section className="border-b border-[#c9d8ee] px-5 pt-7">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-5xl">
          Knowledge that can evolve, not just accumulate
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-center text-base text-slate-600 md:text-lg">
          The engine combines ingest, scoring, merge/evolve decisions, graph-style retrieval,
          and trust signals so developer memory stays usable instead of becoming stale storage.
        </p>
      </Reveal>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <Reveal className="h-[420px] overflow-hidden border border-[#c9d8ee] bg-[radial-gradient(circle_at_30%_30%,#ffffff,#ffffff_45%,#ffffff_100%)]">
          <LeftMemoryDiagram />
        </Reveal>
        <Reveal
          delay={0.08}
          className="h-[420px] overflow-hidden border border-[#c9d8ee] bg-[radial-gradient(circle_at_50%_50%,#ffffff,#ffffff_52%,#ffffff_100%)]"
        >
          <RightGraphDiagram />
        </Reveal>
      </div>

      <div className="mt-3 grid border border-[#c9d8ee] border-b-0 lg:grid-cols-2">
        <Reveal className="border-b border-[#c9d8ee] px-5 py-4 lg:border-b-0 lg:border-r">
          <h3 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">Merge + Evolve Engine</h3>
          <p className="mt-2 text-sm text-[#5d6e86]">
            Detects overlap, upgrades stale memories, and preserves a cleaner memory state when new evidence arrives.
          </p>
        </Reveal>
        <Reveal delay={0.06} className="px-5 py-4">
          <h3 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">Trust + Explainability</h3>
          <p className="mt-2 text-sm text-[#5d6e86]">
            Timeline events, revision history, and explain routes expose why each memory exists and how it changed.
          </p>
        </Reveal>
      </div>

      <Reveal className="mb-5 border border-[#c9d8ee] px-4 py-2.5 text-center text-sm text-[#3d72cd] md:text-base">
        /process → /retrieve → /continue → /resume → /timeline → /revisions → /explain
      </Reveal>
    </section>
  );
}
