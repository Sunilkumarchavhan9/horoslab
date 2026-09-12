"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * ----------------------------------------------------
 * HARDWARE COMPONENTS
 * ----------------------------------------------------
 */
const Screw = ({ x, y, className = "" }: { x: number; y: number; className?: string }) => (
  <div
    className={`absolute rounded-full flex items-center justify-center pointer-events-none ${className}`}
    style={{
      left: x,
      top: y,
      width: 14,
      height: 14,
      background: "radial-gradient(circle at 35% 30%, #ddd 0 8%, #777 35%, #333 70%, #111 100%)",
      boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.5), 1px 2px 4px rgba(0,0,0,0.6)",
      transform: `rotate(${Math.random() * 360}deg)`
    }}
  >
    <div className="w-[8px] h-[1.5px] bg-[#222]" />
  </div>
);

const Led = ({ x, y, color = "green", on = true }: { x: number; y: number; color?: "green" | "yellow" | "red"; on?: boolean }) => {
  const colorMap = {
    green: "#72ff42",
    yellow: "#ffe342",
    red: "#ff4242"
  };
  const bg = colorMap[color];
  return (
    <div
      className="absolute rounded-full transition-opacity duration-300"
      style={{
        left: x,
        top: y,
        width: 8,
        height: 8,
        backgroundColor: bg,
        boxShadow: on ? `0 0 6px ${bg}, inset 0 0 2px #fff` : "none",
        opacity: on ? 1 : 0.3
      }}
    />
  );
};

const Dial = ({ x, y }: { x: number; y: number }) => {
  const [rotation, setRotation] = useState(0);

  return (
    <motion.div
      className="absolute rounded-full cursor-grab active:cursor-grabbing z-50 flex items-center justify-center"
      style={{
        left: x,
        top: y,
        width: 48,
        height: 48,
        background: "radial-gradient(circle at 30% 30%, #ffd700 0%, #b8860b 40%, #553a00 100%)", // Gold/brass look
        boxShadow: "0 6px 12px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.5)",
        border: "1px solid #332200"
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDrag={(_, info) => setRotation((prev) => prev + info.delta.x * 2)}
      animate={{ rotate: rotation }}
    >
      <div className="w-8 h-8 rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] flex items-center justify-center">
        <div className="w-1 h-3 bg-[#fff] opacity-50 rounded-sm absolute top-1" />
      </div>
    </motion.div>
  );
};


/**
 * ----------------------------------------------------
 * PANELS & ASSEMBLIES
 * ----------------------------------------------------
 */

const Chassis = () => (
  <div className="absolute inset-0 pointer-events-none z-10 rounded-xl"
       style={{
         background: "linear-gradient(135deg, #777 0%, #a5a5a5 20%, #777 45%, #9b9b9b 70%, #686868 100%)",
         border: "2px solid #222",
         boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18), inset 0 12px 25px rgba(255,255,255,0.08), inset 0 -14px 30px rgba(0,0,0,0.25), 0 20px 40px rgba(0,0,0,0.7)"
       }}>
    {/* Noise Texture */}
    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
         
    {/* Inner Bevel Detail - Fake border cutout shapes could go here */}
  </div>
);

const ControlPanel = ({ onToggle }: { onToggle: () => void }) => {
  return (
    <div className="absolute z-40"
         style={{
           left: -4, // Overhang left
           top: 50,
           width: 320,
           height: 120,
           borderRadius: "4px 12px 24px 4px",
           background: "linear-gradient(145deg, #7f1522, #b32132 35%, #6e101c)",
           boxShadow: "inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -10px 20px rgba(0,0,0,0.25), 6px 8px 16px rgba(0,0,0,0.7)",
           border: "1px solid #4a0b12"
         }}>
      
      {/* Vert Text */}
      <div className="absolute left-2 top-0 bottom-0 flex items-center justify-center opacity-40 text-black text-[10px] tracking-widest uppercase font-mono" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
        PlayStation ©2024
      </div>

      {/* Screen Frame */}
      <div className="absolute left-[30px] top-[15px] w-[90px] h-[90px] bg-[#111] rounded-md shadow-[inset_0_4px_8px_rgba(0,0,0,0.9),_0_1px_1px_rgba(255,255,255,0.2)] border border-[#222] flex items-center justify-center overflow-hidden cursor-pointer" onClick={onToggle}>
        <div className="w-[90%] h-[90%] bg-[#0a0a0a] rounded flex items-center justify-center relative shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
          {/* Logo Placeholder */}
          <div className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
            <svg width="40" height="30" viewBox="0 0 100 100" fill="#75bf00">
               <path d="M20,80 L20,20 L40,20 L40,40 L60,40 C70,40 80,50 80,60 C80,70 70,80 60,80 Z" />
            </svg>
            <span className="text-[#75bf00] text-[8px] tracking-wider">PlayStation</span>
          </div>
          {/* CRT scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
        </div>
      </div>

      {/* Buttons */}
      <div className="absolute left-[135px] top-[20px] flex flex-col gap-4">
         <div className="w-8 h-10 bg-[#222] rounded shadow-[0_2px_4px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.1)] active:translate-y-[2px] active:shadow-[0_0px_0px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all cursor-pointer border-t border-[#444]" onClick={onToggle} />
         <div className="w-8 h-6 bg-[#222] rounded shadow-[0_2px_4px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.1)] active:translate-y-[2px] active:shadow-[0_0px_0px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all cursor-pointer border-t border-[#444]" />
      </div>

      {/* Vent grille */}
      <div className="absolute right-[80px] top-[20px] bottom-[20px] w-8 bg-[#111] rounded-sm shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col gap-1 p-1">
        {Array.from({length: 12}).map((_, i) => (
          <div key={i} className="w-full h-1 bg-[#000] rounded-full opacity-80" />
        ))}
      </div>

      {/* LEDs */}
      <Led x={270} y={80} color="yellow" on={true} />
      <Led x={270} y={95} color="green" on={false} />

    </div>
  );
};

const Masks = () => (
  <svg width="0" height="0" className="absolute pointer-events-none">
    <defs>
      {/* 
        Using userSpaceOnUse to precisely map to the 486x489 coordinate system.
        The lower disc is roughly centered at x:243, y:300 with a radius of ~170.
        The opening spans from x=40 to x=446, y=180 to y=460 with mechanical notches.
      */}
      <clipPath id="disc-mask" clipPathUnits="userSpaceOnUse">
        <path d="M 40,300 C 40,180 446,180 446,300 C 446,380 400,450 320,465 L 300,475 L 186,475 L 166,465 C 86,450 40,380 40,300 Z" />
      </clipPath>
      
      {/* 
        Upper Right Drive Window. 
        Top-left cut to make room for red panel, bottom-left angled cut.
        Spans roughly x:300->450, y:30->220
      */}
      <clipPath id="drive-mask" clipPathUnits="userSpaceOnUse">
         <polygon points="320,30 450,30 450,220 370,220 350,200 320,200" />
      </clipPath>
    </defs>
  </svg>
);

const ProceduralDisc = () => {
  return (
    <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-[#111]"
         style={{
           // Metallic CD grooves background
           background: "repeating-radial-gradient(circle at 50% 50%, #555 0%, #333 1%, #222 2%, #444 3%)"
         }}>
         
      {/* Center Hole */}
      <div className="absolute inset-0 m-auto w-[12%] h-[12%] rounded-full bg-[#050505] border-[3px] border-[#444] shadow-[0_0_10px_rgba(0,0,0,0.8)] z-50" />
      <div className="absolute inset-0 m-auto w-[25%] h-[25%] rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] z-40 backdrop-blur-sm" />

      {/* Cyberpunk Disc Artwork (Replaces Anime image) */}
      <div className="absolute inset-0 bg-[conic-gradient(from_45deg,#ff4242_0%,#111_15%,#111_35%,#ff4242_50%,#111_65%,#111_85%,#ff4242_100%)] opacity-80 mix-blend-overlay" />
      <div className="absolute inset-0 opacity-40"
           style={{
             backgroundImage: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(255,255,255,0.2) 42%, transparent 44%, rgba(255,60,60,0.3) 60%, transparent 65%)"
           }} />
      
      {/* Fake text / mechanical labels on the disc */}
      <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] border-[2px] border-dashed border-[rgba(255,255,255,0.2)] rounded-full animate-[spin_10s_linear_infinite_reverse]" />
      
      {/* Glare/Iridescence effect locked to the disc rotation */}
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(100,200,255,0.4)_10%,transparent_20%,transparent_180%,rgba(100,200,255,0.4)_190%,transparent_200%)] mix-blend-screen" />
    </div>
  );
};

const DiscAssembly = ({ active }: { active: boolean }) => {
  return (
    <div className="absolute z-20 pointer-events-none" style={{ left: 0, top: 0, width: "100%", height: "100%", clipPath: "url(#disc-mask)" }}>
      {/* Inner shadow frame of the cutout */}
      <div className="absolute inset-0 shadow-[inset_0_15px_30px_rgba(0,0,0,0.9),_inset_0_4px_8px_rgba(0,0,0,0.8)] z-30 pointer-events-none" />
      
      {/* Green internal ambient lighting from lasers */}
      <div className="absolute inset-[-20%] bg-[radial-gradient(circle_at_40%_80%,_rgba(40,220,120,0.25),_transparent_40%)] pointer-events-none z-10 mix-blend-screen" />
      <div className="absolute inset-[-20%] bg-[radial-gradient(circle_at_70%_20%,_rgba(40,220,120,0.15),_transparent_50%)] pointer-events-none z-10 mix-blend-screen" />

      {/* The Disc Itself */}
      {/* Positioning the disc exactly inside the 486x489 coordinate space */}
      <div className="absolute left-[60px] top-[120px] w-[366px] h-[366px]">
        <motion.div 
          className="w-full h-full"
          animate={{ rotate: active ? 360 : 0 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        >
          <ProceduralDisc />
        </motion.div>
      </div>

      {/* Environmental Lighting / Laser Highlights (Static over the rotating disc) */}
      <div className="absolute left-[60px] top-[120px] w-[366px] h-[366px] rounded-full z-20 mix-blend-screen">
         <motion.div 
           className="absolute inset-0"
           style={{ background: "linear-gradient(115deg, transparent 40%, rgba(40,220,120,0.3) 48%, rgba(255,255,255,0.6) 50%, rgba(40,220,120,0.3) 52%, transparent 60%)" }}
           animate={{ 
             opacity: active ? [0.4, 0.8, 0.4] : 0,
             rotate: active ? [0, 5, -5, 0] : 0 
           }}
           transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
         />
      </div>

      {/* Glass Reflection */}
      <div className="absolute inset-0 z-40 pointer-events-none"
           style={{
             background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01) 35%, rgba(255,255,255,0.03) 70%, rgba(255,255,255,0.08))",
             backdropFilter: "blur(0.5px)"
           }}>
         <motion.div 
           className="absolute inset-0"
           style={{ background: "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.12) 45%, transparent 55%)" }}
           animate={{ x: ["-100%", "200%"] }}
           transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", repeatDelay: 1 }}
         />
      </div>
    </div>
  );
};

const ProceduralScanner = ({ active }: { active: boolean }) => {
  return (
    <div className="absolute inset-0 bg-[#080808] overflow-hidden">
       {/* Background Server Ribs */}
       <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, #111 0px, #111 4px, #222 4px, #222 8px)" }} />
            
       {/* Data blocks / Processing indicators */}
       <div className="absolute inset-0 p-4 flex flex-wrap gap-1 content-start opacity-60">
          {Array.from({length: 40}).map((_, i) => (
            <motion.div 
              key={i} 
              className="w-3 h-3 bg-[#28dc78]"
              animate={active ? {
                opacity: [0.1, 1, 0.1],
              } : { opacity: 0.1 }}
              transition={{
                repeat: Infinity,
                duration: 0.2 + Math.random() * 2,
                delay: Math.random() * 2,
              }}
            />
          ))}
       </div>

       {/* Laser Scanner Line */}
       {active && (
         <motion.div 
           className="absolute left-0 right-0 h-1 bg-[#28dc78] shadow-[0_0_15px_5px_rgba(40,220,120,0.6)] mix-blend-screen"
           animate={{ top: ["0%", "100%", "0%"] }}
           transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
         />
       )}
    </div>
  );
};

const DriveAssembly = ({ active }: { active: boolean }) => {
  return (
    <div className="absolute z-20 pointer-events-none" style={{ left: 0, top: 0, width: "100%", height: "100%", clipPath: "url(#drive-mask)" }}>
      {/* Frame Shadow */}
      <div className="absolute inset-0 shadow-[inset_0_15px_30px_rgba(0,0,0,0.9),_inset_0_4px_8px_rgba(0,0,0,0.8)] z-30 pointer-events-none" />
      
      {/* Green Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,_rgba(40,220,120,0.4),_transparent_70%)] pointer-events-none z-10 mix-blend-screen" />

      {/* Internal Content (Procedural Scanner) */}
      <div className="absolute inset-0 z-0">
         <ProceduralScanner active={active} />
      </div>

      {/* Glass */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.1),transparent_40%)]" />
    </div>
  );
};

export const SciFiConsole = () => {
  const [active, setActive] = useState(true);

  // Parallax setup
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], [8, -8]);
  const rotateY = useTransform(smoothX, [0, 1], [-8, 8]);
  const lightingX = useTransform(smoothX, [0, 1], ["0%", "100%"]);
  const lightingY = useTransform(smoothY, [0, 1], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div className="w-full flex items-center justify-center p-8 perspective-[1200px]" 
         onMouseMove={handleMouseMove} 
         onMouseLeave={handleMouseLeave}>
      
      {/* Wrapper to handle responsive scaling */}
      <div className="relative w-full max-w-[500px] aspect-[486/489] flex items-center justify-center overflow-visible">
        
        {/* The 486x489 coordinate system chassis */}
        <motion.div 
          className="absolute w-[486px] h-[489px]"
          style={{ 
            rotateX, 
            rotateY,
            transformStyle: "preserve-3d",
            // Responsive scale based on wrapper (scale down if screen is smaller)
            scale: "clamp(0.4, 100vw / 550, 1)"
          }}
        >
          <Masks />
          <Chassis />
          
          {/* Dynamic Global Lighting overlay based on parallax */}
          <motion.div 
            className="absolute inset-0 pointer-events-none z-50 rounded-xl opacity-30 mix-blend-overlay"
            style={{
              background: useTransform(
                [lightingX, lightingY],
                ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.8) 0%, transparent 50%)`
              )
            }}
          />
          
          <DiscAssembly active={active} />
          <DriveAssembly active={active} />
          
          <ControlPanel onToggle={() => setActive(!active)} />

          <Dial x={219} y={220} />

          {/* Top/Bottom Red Bumper Bars */}
          <div className="absolute left-[100px] top-[-10px] w-[200px] h-[20px] bg-[#8a1a25] rounded shadow-[0_4px_10px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.2)] border border-[#4a0b12] z-0 flex items-center justify-center">
             <span className="text-[6px] text-black opacity-50 tracking-[0.2em] uppercase font-mono">Scanner Device Concept ©2024</span>
          </div>
          <div className="absolute left-[120px] bottom-[-10px] w-[160px] h-[15px] bg-[#8a1a25] rounded shadow-[0_4px_10px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.2)] border border-[#4a0b12] z-0 flex items-center justify-center">
            <span className="text-[5px] text-black opacity-50 tracking-[0.2em] uppercase font-mono">PlayStation PLAYER</span>
          </div>
          
          {/* Hardware Screws Layered at Z-50 */}
          <div className="absolute inset-0 z-50 pointer-events-none">
             <Screw x={15} y={15} />
             <Screw x={455} y={15} />
             <Screw x={15} y={455} />
             <Screw x={455} y={455} />
             
             {/* Middle right/left screws */}
             <Screw x={15} y={320} />
             <Screw x={455} y={320} />
             
             {/* Center dial surrounding screws */}
             <Screw x={210} y={200} />
             <Screw x={260} y={200} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
