import React, { useState, useEffect, useRef } from "react";

export function IsometricStack() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveLayer(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const layers = [
    { 
      id: 1, leftText: "baseline", rightText: "baseline", z: 150,
      title: "BASELINE MODEL",
      desc: "The current production model serving live traffic. Represents the established benchmark."
    },
    { 
      id: 2, leftText: "candidate", rightText: "candidate", z: 100,
      title: "CANDIDATE MODEL",
      desc: "The new proposed model version seeking deployment approval. Must outperform the baseline."
    },
    { 
      id: 3, leftText: "evidence", rightText: "evidence", z: 50,
      title: "HELD-OUT EVIDENCE",
      desc: "The pristine evaluation datasets and ground-truth metrics used to rigorously test the candidate."
    },
    { 
      id: 4, leftText: "PASS", rightText: "FAIL", z: 0,
      title: "DETERMINISTIC OUTCOME",
      desc: "The final cryptographic verdict deciding if the candidate is mathematically safe to merge."
    },
  ];

  return (
    <div className="relative w-full flex flex-col items-center justify-center font-sans bg-transparent py-12 overflow-visible">
      <style>{`
        /* Expansion Animations (4s loop) */
        @keyframes expand1 {
          0% { transform: translateZ(150px); animation-timing-function: ease-in-out; }
          10%, 50% { transform: translateZ(270px); animation-timing-function: ease-in-out; }
          60%, 100% { transform: translateZ(150px); animation-timing-function: linear; }
        }
        @keyframes expand2 {
          0% { transform: translateZ(100px); animation-timing-function: ease-in-out; }
          10%, 50% { transform: translateZ(180px); animation-timing-function: ease-in-out; }
          60%, 100% { transform: translateZ(100px); animation-timing-function: linear; }
        }
        @keyframes expand3 {
          0% { transform: translateZ(50px); animation-timing-function: ease-in-out; }
          10%, 50% { transform: translateZ(90px); animation-timing-function: ease-in-out; }
          60%, 100% { transform: translateZ(50px); animation-timing-function: linear; }
        }

        /* Spin Animations (16s loop) - STAGGERED 90-degree turns */
        @keyframes spin1 {
          0%, 2.5% { transform: rotateZ(0deg); animation-timing-function: ease-in-out; }
          5%, 27.5% { transform: rotateZ(90deg); animation-timing-function: ease-in-out; }
          30%, 52.5% { transform: rotateZ(180deg); animation-timing-function: ease-in-out; }
          55%, 77.5% { transform: rotateZ(270deg); animation-timing-function: ease-in-out; }
          80%, 100% { transform: rotateZ(360deg); animation-timing-function: linear; }
        }
        @keyframes spin2 {
          0%, 5% { transform: rotateZ(0deg); animation-timing-function: ease-in-out; }
          7.5%, 30% { transform: rotateZ(90deg); animation-timing-function: ease-in-out; }
          32.5%, 55% { transform: rotateZ(180deg); animation-timing-function: ease-in-out; }
          57.5%, 80% { transform: rotateZ(270deg); animation-timing-function: ease-in-out; }
          82.5%, 100% { transform: rotateZ(360deg); animation-timing-function: linear; }
        }
        @keyframes spin3 {
          0%, 7.5% { transform: rotateZ(0deg); animation-timing-function: ease-in-out; }
          10%, 32.5% { transform: rotateZ(90deg); animation-timing-function: ease-in-out; }
          35%, 57.5% { transform: rotateZ(180deg); animation-timing-function: ease-in-out; }
          60%, 82.5% { transform: rotateZ(270deg); animation-timing-function: ease-in-out; }
          85%, 100% { transform: rotateZ(360deg); animation-timing-function: linear; }
        }
        @keyframes spin4 {
          0%, 10% { transform: rotateZ(0deg); animation-timing-function: ease-in-out; }
          12.5%, 35% { transform: rotateZ(90deg); animation-timing-function: ease-in-out; }
          37.5%, 60% { transform: rotateZ(180deg); animation-timing-function: ease-in-out; }
          62.5%, 85% { transform: rotateZ(270deg); animation-timing-function: ease-in-out; }
          87.5%, 100% { transform: rotateZ(360deg); animation-timing-function: linear; }
        }

        .anim-expand-1 { animation: expand1 4s infinite; }
        .anim-expand-2 { animation: expand2 4s infinite; }
        .anim-expand-3 { animation: expand3 4s infinite; }

        .anim-spin-1 { animation: spin1 16s infinite; }
        .anim-spin-2 { animation: spin2 16s infinite; }
        .anim-spin-3 { animation: spin3 16s infinite; }
        .anim-spin-4 { animation: spin4 16s infinite; }

        .is-paused {
          animation-play-state: paused !important;
        }
      `}</style>
      
      <div ref={containerRef} className="w-full h-[400px] flex items-center justify-center mt-16 relative">
        <div 
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: "scale(0.75) rotateX(60deg) rotateZ(45deg)",
            width: "280px",
            height: "280px",
          }}
        >
          {layers.map((layer) => (
            <div 
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`absolute inset-0 cursor-pointer transition-transform hover:scale-105 ${layer.id !== 4 ? `anim-expand-${layer.id}` : ''} ${activeLayer !== null ? 'is-paused' : ''}`}
              style={{
                transformStyle: "preserve-3d",
                transform: layer.id === 4 ? `translateZ(0px)` : undefined,
              }}
            >
              <div
                className={`absolute inset-0 anim-spin-${layer.id} ${activeLayer !== null ? 'is-paused' : ''}`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Top Face */}
                <div 
                  className="absolute inset-0 bg-white flex items-center justify-center"
                  style={{
                    borderTop: "2px solid #0055ff", // back-right
                    borderLeft: "2px solid #00ff66", // back-left
                    borderRight: "2px solid #ff0000", // front-right
                    borderBottom: "2px solid #0055ff", // front-left
                  }}
                >
                </div>
                
                {/* 1. Front-Left Face (Y = H edge) */}
                <div
                  className="absolute flex items-center justify-start px-6"
                  style={{
                    top: 0,
                    left: 0,
                    width: "280px",
                    height: "40px",
                    transformOrigin: "top left",
                    transform: `translateY(280px) rotateX(-90deg)`,
                    background: "#0a45ce", // rich blue
                    borderBottom: "1px solid #0735a3",
                  }}
                >
                  <span className="text-[#F0EFE2] font-bold text-2xl tracking-wide drop-shadow-md">
                    {layer.leftText}
                  </span>
                </div>

                {/* 2. Front-Right Face (X = W edge) */}
                <div
                  className="absolute flex items-center justify-start px-6"
                  style={{
                    top: 0,
                    left: 0,
                    width: "280px",
                    height: "40px",
                    transformOrigin: "top left",
                    transform: `translateY(280px) translateX(280px) rotateZ(-90deg) rotateX(-90deg)`,
                    background: "#073399", // darker blue
                    borderBottom: "1px solid #052470",
                  }}
                >
                  <span className="text-[#F0EFE2] font-bold text-2xl tracking-wide drop-shadow-md whitespace-nowrap">
                    {layer.rightText}
                  </span>
                </div>

                {/* 3. Back-Right Face (Y = 0 edge) */}
                <div
                  className="absolute flex items-center justify-start px-6"
                  style={{
                    top: 0,
                    left: 0,
                    width: "280px",
                    height: "40px",
                    transformOrigin: "top left",
                    transform: `translateX(280px) rotateZ(180deg) rotateX(-90deg)`,
                    background: "#0a45ce", // rich blue (matches opposite side)
                    borderBottom: "1px solid #0735a3",
                  }}
                >
                  <span className="text-[#F0EFE2] font-bold text-2xl tracking-wide drop-shadow-md">
                    {layer.leftText}
                  </span>
                </div>

                {/* 4. Back-Left Face (X = 0 edge) */}
                <div
                  className="absolute flex items-center justify-start px-6"
                  style={{
                    top: 0,
                    left: 0,
                    width: "280px",
                    height: "40px",
                    transformOrigin: "top left",
                    transform: `rotateZ(90deg) rotateX(-90deg)`,
                    background: "#073399", // darker blue (matches opposite side)
                    borderBottom: "1px solid #052470",
                  }}
                >
                  <span className="text-[#F0EFE2] font-bold text-2xl tracking-wide drop-shadow-md whitespace-nowrap">
                    {layer.rightText}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Panel Overlay */}
        {activeLayer !== null && (
          <>
            {/* Dashed line connecting stack to panel */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
              <path 
                d={`M ${containerRef.current ? containerRef.current.clientWidth / 2 : 200} ${containerRef.current ? containerRef.current.clientHeight / 2 - (4 - activeLayer) * 20 : 150} L ${containerRef.current ? containerRef.current.clientWidth - 40 : 350} 320`}
                stroke="#0a45ce" 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
                fill="none" 
                className="animate-pulse"
              />
              <circle 
                cx={containerRef.current ? containerRef.current.clientWidth / 2 : 200} 
                cy={containerRef.current ? containerRef.current.clientHeight / 2 - (4 - activeLayer) * 20 : 150} 
                r="4" 
                fill="#0a45ce" 
              />
            </svg>

            {/* Glassmorphic Panel */}
            <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-[280px] bg-white/95 backdrop-blur-md border border-[#0a45ce]/20 p-5 rounded-md shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-[#0a45ce] font-bold tracking-widest bg-blue-50 px-2 py-1 rounded">
                  LAYER 0{activeLayer}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveLayer(null); }}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"
                >
                  &times;
                </button>
              </div>
              <h4 className="font-bold text-[#0b162c] mb-2 leading-tight">
                {layers.find(l => l.id === activeLayer)?.title}
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                {layers.find(l => l.id === activeLayer)?.desc}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


