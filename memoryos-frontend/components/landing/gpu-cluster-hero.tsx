"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./gpu-cluster-hero.css";

export function GpuClusterHero() {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFocus = (labelId: string) => setActiveLabel(labelId);
  const handleBlur = () => setActiveLabel(null);

  const getOpacity = (labelId: string, defaultOpacity: number) => {
    if (!activeLabel) return defaultOpacity;
    return activeLabel === labelId ? 1 : Math.max(0.1, defaultOpacity * 0.3);
  };

  // GPU positions (x, y, scale, baseOpacity) for 7 cards (back to front)
  const gpuNodes = [
    { id: "node-7", x: 600, y: 150, scale: 0.6, opacity: 0.2, delay: 0.2 },
    { id: "node-6", x: 530, y: 200, scale: 0.65, opacity: 0.3, delay: 0.5 },
    { id: "node-5", x: 460, y: 250, scale: 0.7, opacity: 0.4, delay: 0.8 },
    { id: "node-4", x: 390, y: 300, scale: 0.75, opacity: 0.5, delay: 1.1 },
    { id: "node-3", x: 320, y: 350, scale: 0.8, opacity: 0.6, delay: 1.4 },
    { id: "node-2", x: 250, y: 400, scale: 0.9, opacity: 0.75, delay: 1.7 },
    { id: "node-1", x: 150, y: 480, scale: 1.2, opacity: 1, delay: 2.0 } // Front dominant card
  ];

  return (
    <div className="w-full bg-[#101210] relative overflow-hidden font-sans">
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full min-h-[600px]"
        role="img"
        aria-labelledby="gpu-cluster-title"
      >
        <title id="gpu-cluster-title">MemoryOS GPU Cluster Visualization</title>
        
        <defs>
          <pattern id="dot-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#414641" opacity="0.3" />
          </pattern>
          <radialGradient id="fade-bottom" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
            <stop offset="60%" stopColor="#FFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
          </radialGradient>

          {/* Reusable GPU Card Symbol */}
          <g id="memoryos-gpu-card">
            <g className={!shouldReduceMotion ? "draw-line" : ""} style={{ stroke: "#636863", strokeWidth: 1.4, fill: "none", strokeLinejoin: "round", strokeLinecap: "round" }}>
              {/* Outer Enclosure */}
              <polygon points="50,200 100,50 400,100 350,250" fill="#101210" opacity="0.8" />
              <polygon points="100,50 400,100 450,150 150,100" />
              <polygon points="400,100 350,250 400,300 450,150" fill="#101210" opacity="0.9" />
              
              {/* Fan Housing */}
              <ellipse cx="250" cy="175" rx="80" ry="40" stroke="#949B94" strokeWidth="1.2" transform="rotate(-15 250 175)" />
              <ellipse cx="250" cy="175" rx="20" ry="10" stroke="#414641" transform="rotate(-15 250 175)" />
              
              {/* Heatsink Fins */}
              <path d="M 150,100 L 160,110 M 170,103 L 180,113 M 190,106 L 200,116 M 210,109 L 220,119" stroke="#414641" strokeWidth="1" />
              
              {/* Vents */}
              <line x1="380" y1="130" x2="420" y2="180" stroke="#414641" />
              <line x1="390" y1="132" x2="430" y2="182" stroke="#414641" />
              
              {/* Label */}
              <text x="70" y="190" fill="#414641" fontSize="10" fontFamily="monospace" stroke="none" transform="rotate(-20) skewX(20)">ACCELERATOR NODE</text>
            </g>
          </g>
        </defs>

        {/* Background */}
        <rect width="1600" height="900" fill="#101210" />
        
        {/* Dotted Grid with Radial Fade */}
        <g mask="url(#grid-mask)">
          <mask id="grid-mask">
            <rect width="1600" height="900" fill="url(#fade-bottom)" />
          </mask>
          <rect width="1600" height="900" fill="url(#dot-grid)" className={!shouldReduceMotion ? "fade-in" : ""} />
        </g>

        {/* GPU Cluster Rendered Back-to-Front */}
        {isMounted && gpuNodes.map((node) => (
          <g 
            key={node.id} 
            transform={`translate(${node.x}, ${node.y}) scale(${node.scale})`} 
            opacity={getOpacity('cluster', node.opacity)}
            className="gpu-node-group"
          >
            {/* Animating the draw using CSS stroke-dashoffset */}
            <use 
              href="#memoryos-gpu-card" 
              style={{ 
                animationDelay: `${node.delay}s`,
                strokeWidth: node.scale === 1.2 ? 1.4 : 0.8
              }} 
            />
            {/* Fan Blades (Separated for rotation animation) */}
            <g className={!shouldReduceMotion ? "fan-spin" : ""} style={{ transformOrigin: '250px 175px', animationDelay: '2.6s' }}>
              <path d="M 250,175 Q 300,150 320,180" stroke="#414641" fill="none" />
              <path d="M 250,175 Q 230,210 200,200" stroke="#414641" fill="none" />
              <path d="M 250,175 Q 180,160 210,130" stroke="#414641" fill="none" />
              <path d="M 250,175 Q 280,130 300,140" stroke="#414641" fill="none" />
            </g>
          </g>
        ))}

        {/* Data Packets (Entering Rear) */}
        <g opacity={getOpacity('storage', 0.8)}>
          <path id="data-in-1" d="M 1200,100 L 900,250" stroke="#414641" strokeWidth="2" strokeDasharray="8 16" fill="none" className={!shouldReduceMotion ? "packet-flow" : ""} />
        </g>
        
        {/* Data Packets (Network Fabric) */}
        <g opacity={getOpacity('fabric', 0.8)}>
          <path id="data-fabric" d="M 900,300 L 600,450" stroke="#76B900" strokeWidth="2" strokeDasharray="4 12" fill="none" className={!shouldReduceMotion ? "packet-flow" : ""} />
        </g>

        {/* Data Packets (Token Generation to MemoryOS) */}
        <g opacity={getOpacity('tokens', 0.9)}>
          <path id="token-stream" d="M 500,650 L 1200,650 L 1300,750" stroke="#949B94" strokeWidth="3" strokeDasharray="12 24" fill="none" className={!shouldReduceMotion ? "packet-flow" : ""} />
        </g>

        {/* Technical Labels */}
        {/* Workers */}
        <g 
          transform="translate(150, 150)" 
          className="cursor-pointer label-group"
          onMouseEnter={() => handleFocus('cluster')}
          onMouseLeave={handleBlur}
          tabIndex={0}
          opacity={getOpacity('cluster', 1)}
        >
          <rect x="-4" y="-12" width="6" height="6" fill="#636863" />
          <text x="12" y="-2" fill="#F4F7F4" fontSize="14" fontFamily="monospace" letterSpacing="1">1–2048 GPU WORKERS</text>
          <path d="M 6,-9 L 200,-9 L 450,250" stroke="#414641" strokeWidth="1" fill="none" />
        </g>

        {/* Storage */}
        <g 
          transform="translate(1200, 150)" 
          className="cursor-pointer label-group"
          onMouseEnter={() => handleFocus('storage')}
          onMouseLeave={handleBlur}
          tabIndex={0}
          opacity={getOpacity('storage', 1)}
        >
          <rect x="-4" y="-12" width="6" height="6" fill="#636863" />
          <text x="12" y="-2" fill="#F4F7F4" fontSize="14" fontFamily="monospace">HIGH-PERFORMANCE</text>
          <text x="12" y="16" fill="#F4F7F4" fontSize="14" fontFamily="monospace">STORAGE</text>
          <path d="M -8,-9 L -100,-9 L -200,50" stroke="#414641" strokeWidth="1" fill="none" />
        </g>

        {/* Fabric */}
        <g 
          transform="translate(1250, 350)" 
          className="cursor-pointer label-group"
          onMouseEnter={() => handleFocus('fabric')}
          onMouseLeave={handleBlur}
          tabIndex={0}
          opacity={getOpacity('fabric', 1)}
        >
          <rect x="-4" y="-12" width="6" height="6" fill="#76B900" />
          <text x="12" y="-2" fill="#76B900" fontSize="14" fontFamily="monospace">HIGH-BANDWIDTH</text>
          <text x="12" y="16" fill="#76B900" fontSize="14" fontFamily="monospace">FABRIC</text>
          <path d="M -8,-9 L -150,-9 L -350,150" stroke="#76B900" strokeWidth="1" fill="none" opacity="0.6" />
        </g>

        {/* Tokens & Telemetry */}
        <g 
          transform="translate(1100, 580)" 
          className="cursor-pointer label-group"
          onMouseEnter={() => handleFocus('tokens')}
          onMouseLeave={handleBlur}
          tabIndex={0}
          opacity={getOpacity('tokens', 1)}
        >
          <rect x="-4" y="-12" width="6" height="6" fill="#949B94" />
          <text x="12" y="-2" fill="#F4F7F4" fontSize="14" fontFamily="monospace">TOKENS +</text>
          <text x="12" y="16" fill="#F4F7F4" fontSize="14" fontFamily="monospace">TELEMETRY</text>
        </g>

        {/* MemoryOS Accountability Plane */}
        <g 
          transform="translate(1300, 750)" 
          className="cursor-pointer label-group"
          onMouseEnter={() => handleFocus('memoryos')}
          onMouseLeave={handleBlur}
          tabIndex={0}
          opacity={getOpacity('memoryos', 1)}
        >
          <rect x="-10" y="-30" width="260" height="70" fill="#101210" stroke="#636863" strokeWidth="1" />
          <text x="10" y="-5" fill="#F4F7F4" fontSize="18" fontWeight="bold">MEMORYOS</text>
          <text x="10" y="15" fill="#949B94" fontSize="12" fontFamily="monospace">ACCOUNTABILITY PLANE</text>
        </g>
      </svg>
    </div>
  );
}
