"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import PixelTransition from "@/components/PixelTransition";
import Dither from "@/components/ui/Dither";

// SVG Wireframe for FIG 0.2 (Isometric Stacked Cube)
const Fig02SVG = () => (
  <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 group-hover:opacity-100 transition-opacity duration-700">
    <g stroke="#ccc" strokeWidth="1" strokeLinejoin="round">
      {/* Bottom Stacked Layers */}
      <path d="M120 190L40 145V135L120 180L200 135V145L120 190Z" fill="#fff"/>
      <path d="M120 175L40 130V120L120 165L200 120V130L120 175Z" fill="#fff"/>
      <path d="M120 160L40 115V105L120 150L200 105V115L120 160Z" fill="#fff"/>
      <path d="M120 145L40 100V90L120 135L200 90V100L120 145Z" fill="#fff"/>
      <path d="M120 130L40 85L120 40L200 85L120 130Z" fill="#f7f7f7"/>
      
      {/* Ghosting connecting lines */}
      <path d="M40 85V70" stroke="#ddd" strokeDasharray="2 2" />
      <path d="M200 85V70" stroke="#ddd" strokeDasharray="2 2" />
      <path d="M120 130V115" stroke="#ddd" strokeDasharray="2 2" />
      
      {/* Top Floating Layer */}
      <g transform="translate(0, -15)">
        <path d="M120 130L40 85V75L120 120L200 75V85L120 130Z" fill="#fff"/>
        <path d="M120 120L40 75L120 30L200 75L120 120Z" fill="#f0f0f0"/>
        {/* MemoryOS Official Logo Etched into Top Layer (Isometric projection) */}
        <g transform="translate(120, 75) scale(1.2, 0.6) rotate(45) translate(-32, -20)">
          <path d="M53.6688 3.16846H59.9748C60.473 3.16846 60.9508 3.46054 61.3031 3.98044C61.6553 4.50034 61.8532 5.20548 61.8532 5.94073V15.2477C61.8532 15.9829 61.6553 16.6881 61.3031 17.208C60.9508 17.7279 60.473 18.0199 59.9748 18.0199H53.6688C53.1706 18.0199 52.6928 17.7279 52.3405 17.208C51.9882 16.6881 51.7903 15.9829 51.7903 15.2477V5.94073C51.7903 5.20548 51.9882 4.50034 52.3405 3.98044C52.6928 3.46054 53.1706 3.16846 53.6688 3.16846Z" fill="#aaa"/>
          <path d="M22.2725 20.9902H32.3354V33.0694C32.3354 33.8047 32.1375 34.5098 31.7852 35.0297C31.433 35.5496 30.9552 35.8417 30.457 35.8417H24.1509C23.6527 35.8417 23.175 35.5496 22.8227 35.0297C22.4704 34.5098 22.2725 33.8047 22.2725 33.0694V20.9902Z" fill="#aaa"/>
          <path d="M14.7589 6.13867H21.065C21.5632 6.13867 22.0409 6.43075 22.3932 6.95065C22.7455 7.47056 22.9434 8.1757 22.9434 8.91095V20.9902H14.7589C14.2607 20.9902 13.7829 20.6981 13.4307 20.1782C13.0784 19.6583 12.8805 18.9531 12.8805 18.2179V8.91095C12.8805 8.1757 13.0784 7.47056 13.4307 6.95065C13.7829 6.43075 14.2607 6.13867 14.7589 6.13867Z" fill="#aaa"/>
          <path d="M41.7274 20H49.9119C50.4101 20 50.8879 20.2921 51.2401 20.812C51.5924 21.3319 51.7903 22.037 51.7903 22.7723V32.0792C51.7903 32.8145 51.5924 33.5196 51.2401 34.0395C50.8879 34.5594 50.4101 34.8515 49.9119 34.8515H43.6058C43.1076 34.8515 42.6299 34.5594 42.2776 34.0395C41.9253 33.5196 41.7274 32.8145 41.7274 32.0792V20Z" fill="#aaa"/>
          <path d="M4.02514 21.9805H10.3312C10.8294 21.9805 11.3072 22.2725 11.6594 22.7924C12.0117 23.3124 12.2096 24.0175 12.2096 24.7527V34.0597C12.2096 34.7949 12.0117 35.5001 11.6594 36.02C11.3072 36.5399 10.8294 36.832 10.3312 36.832H4.02514C3.52695 36.832 3.04917 36.5399 2.6969 36.02C2.34463 35.5001 2.14673 34.7949 2.14673 34.0597V24.7527C2.14673 24.0175 2.34463 23.3124 2.6969 22.7924C3.04917 22.2725 3.52695 21.9805 4.02514 21.9805Z" fill="#aaa"/>
          <path d="M33.543 6.13867H39.849C40.3472 6.13867 40.825 6.43075 41.1773 6.95065C41.5295 7.47056 41.7274 8.1757 41.7274 8.91095V20.9902H31.6646V8.91095C31.6646 8.1757 31.8625 7.47056 32.2147 6.95065C32.567 6.43075 33.0448 6.13867 33.543 6.13867Z" fill="#aaa"/>
          <path d="M22.9434 18.2178C22.9434 20.297 23.319 20.9901 24.8218 20.9901H22.9434V18.2178Z" fill="#aaa"/>
          <path d="M31.6645 18.2178C31.6645 20.297 31.2889 20.9901 29.7861 20.9901H31.6645V18.2178Z" fill="#aaa"/>
          <path d="M22.2725 23.7625C22.2725 21.6833 21.8968 20.9902 20.3941 20.9902H22.2725V23.7625Z" fill="#aaa"/>
          <path d="M41.7275 23.7625C41.7275 21.6833 41.3518 20.9902 39.8491 20.9902H41.7275V23.7625Z" fill="#aaa"/>
          <path d="M32.3354 23.7625C32.3354 21.6833 32.7111 20.9902 34.2138 20.9902H32.3354V23.7625Z" fill="#aaa"/>
          <path d="M41.7274 17.228C41.7274 19.3072 42.1031 20.0003 43.6058 20.0003H41.7274V17.228Z" fill="#aaa"/>
        </g>
      </g>
    </g>
  </svg>
);

const IsoCube = ({ x, y, size, h, floating = false, grid = false, reflection = false }: { x: number, y: number, size: number, h: number, floating?: boolean, grid?: boolean, reflection?: boolean }) => {
  const R = size;
  const H = R / 2;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Reflections */}
      {reflection && (
        <g opacity="0.3">
          <path d={`M 0 ${R + h} L ${-R} ${H + h} L ${-R} ${H + h + 20} L 0 ${R + h + 20} Z`} fill="none" stroke="#ddd" strokeWidth="1" />
          <path d={`M 0 ${R + h} L ${R} ${H + h} L ${R} ${H + h + 20} L 0 ${R + h + 20} Z`} fill="none" stroke="#ddd" strokeWidth="1" />
        </g>
      )}

      {/* Main Base */}
      <path d={`M 0 ${R + (floating ? 15 : 0)} L ${-R} ${H + (floating ? 15 : 0)} L ${-R} ${H + h} L 0 ${R + h} Z`} fill="#fff" stroke="#ccc" strokeWidth="1" strokeLinejoin="round" />
      <path d={`M 0 ${R + (floating ? 15 : 0)} L ${R} ${H + (floating ? 15 : 0)} L ${R} ${H + h} L 0 ${R + h} Z`} fill="#fff" stroke="#ddd" strokeWidth="1" strokeLinejoin="round" />
      
      {/* Floating inner top */}
      {floating && (
        <path d={`M 0 ${R + 15} L ${R} ${H + 15} L 0 15 L ${-R} ${H + 15} Z`} fill="#fafafa" stroke="#ccc" strokeWidth="1" strokeLinejoin="round" />
      )}

      {/* Floating or fixed top face */}
      <g transform={floating ? `translate(0, -8)` : ``}>
        <path d={`M 0 ${R} L ${R} ${H} L 0 0 L ${-R} ${H} Z`} fill="#f5f5f5" stroke="#bbb" strokeWidth="1" strokeLinejoin="round" />
        {floating && (
          <>
            <path d={`M 0 ${R} L ${-R} ${H} L ${-R} ${H + 10} L 0 ${R + 10} Z`} fill="#fff" stroke="#ccc" strokeWidth="1" strokeLinejoin="round" />
            <path d={`M 0 ${R} L ${R} ${H} L ${R} ${H + 10} L 0 ${R + 10} Z`} fill="#fff" stroke="#ddd" strokeWidth="1" strokeLinejoin="round" />
          </>
        )}
        
        {/* Grid on top face */}
        {grid && (
          <g transform={`translate(0, ${H - 2})`} opacity="0.6">
            <path d="M -6 3 L 0 6 L 6 3 L 0 0 Z" stroke="#aaa" fill="none" strokeWidth="0.5"/>
            <path d="M -2 1 L 4 4" stroke="#aaa" strokeWidth="0.5"/>
            <path d="M -4 2 L 2 5" stroke="#aaa" strokeWidth="0.5"/>
            <path d="M 2 1 L -4 4" stroke="#aaa" strokeWidth="0.5"/>
            <path d="M 4 2 L -2 5" stroke="#aaa" strokeWidth="0.5"/>
          </g>
        )}
      </g>
    </g>
  )
}

const Fig03SVG = () => (
  <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 group-hover:opacity-100 transition-opacity duration-700">
    <g transform="translate(0, -5)">
      {/* Top Cube */}
      <IsoCube x={120} y={15} size={35} h={55} grid />
      {/* Left Cube */}
      <IsoCube x={70} y={50} size={42} h={65} grid reflection />
      {/* Right Cube */}
      <IsoCube x={165} y={55} size={38} h={60} floating />
      {/* Bottom Cube */}
      <IsoCube x={120} y={115} size={40} h={40} grid reflection />
    </g>
  </svg>
);

const IsoLShape = ({ x, y, lenX, lenY, th, hTall, isHovered }: { x: number, y: number, lenX: number, lenY: number, th: number, hTall: number, isHovered: boolean }) => {
   const dx = 1;
   const dy = 0.5;

   const getPaths = (h: number) => {
     const toScreen = (px: number, py: number, z: number) => ({
         cx: (px - py) * dx,
         cy: (px + py) * dy - z
     });

     const top_pts = [
       toScreen(x, y + lenY, h),
       toScreen(x + th, y + lenY, h),
       toScreen(x + th, y + th, h),
       toScreen(x + lenX, y + th, h),
       toScreen(x + lenX, y, h),
       toScreen(x, y, h)
     ];
     const top_d = `M ${top_pts[0].cx} ${top_pts[0].cy} ` + top_pts.slice(1).map(p => `L ${p.cx} ${p.cy}`).join(' ') + ' Z';

     const lf_s0_t = toScreen(x, y, h);
     const lf_s1_t = toScreen(x, y + lenY, h);
     const lf_s1_b = toScreen(x, y + lenY, 0);
     const lf_s0_b = toScreen(x, y, 0);

     const rf_s0_t = toScreen(x, y, h);
     const rf_s1_t = toScreen(x + lenX, y, h);
     const rf_s1_b = toScreen(x + lenX, y, 0);
     const rf_s0_b = toScreen(x, y, 0);

     // Single continuous front face (merging Left and Right arms to remove the spine crease)
     const front_d = `M ${lf_s1_b.cx} ${lf_s1_b.cy} L ${lf_s0_b.cx} ${lf_s0_b.cy} L ${rf_s1_b.cx} ${rf_s1_b.cy} L ${rf_s1_t.cx} ${rf_s1_t.cy} L ${rf_s0_t.cx} ${rf_s0_t.cy} L ${lf_s1_t.cx} ${lf_s1_t.cy} Z`;

     const ln_s0_t = toScreen(x, y + lenY, h);
     const ln_s1_t = toScreen(x + th, y + lenY, h);
     const ln_s1_b = toScreen(x + th, y + lenY, 0);
     const ln_s0_b = toScreen(x, y + lenY, 0);
     const ln_d = `M ${ln_s0_t.cx} ${ln_s0_t.cy} L ${ln_s1_t.cx} ${ln_s1_t.cy} L ${ln_s1_b.cx} ${ln_s1_b.cy} L ${ln_s0_b.cx} ${ln_s0_b.cy} Z`;

     const rn_s0_t = toScreen(x + lenX, y, h);
     const rn_s1_t = toScreen(x + lenX, y + th, h);
     const rn_s1_b = toScreen(x + lenX, y + th, 0);
     const rn_s0_b = toScreen(x + lenX, y, 0);
     const rn_d = `M ${rn_s0_t.cx} ${rn_s0_t.cy} L ${rn_s1_t.cx} ${rn_s1_t.cy} L ${rn_s1_b.cx} ${rn_s1_b.cy} L ${rn_s0_b.cx} ${rn_s0_b.cy} Z`;

     return { top_d, front_d, ln_d, rn_d };
   };

   const flat = getPaths(6);
   const tall = getPaths(hTall);
   
   const transition = { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 };

   return (
      <g>
         <motion.path animate={{ d: isHovered ? tall.front_d : flat.front_d }} transition={transition} fill="#fff" stroke="#ccc" strokeWidth="1" strokeLinejoin="round"/>
         <motion.path animate={{ d: isHovered ? tall.ln_d : flat.ln_d }} transition={transition} fill="#fafafa" stroke="#ddd" strokeWidth="1" strokeLinejoin="round"/>
         <motion.path animate={{ d: isHovered ? tall.rn_d : flat.rn_d }} transition={transition} fill="#fafafa" stroke="#ccc" strokeWidth="1" strokeLinejoin="round"/>
         <motion.path animate={{ d: isHovered ? tall.top_d : flat.top_d }} transition={transition} fill="#fcfcfc" stroke="#bbb" strokeWidth="1" strokeLinejoin="round"/>
      </g>
   )
}

const Fig04SVG = ({ isHovered }: { isHovered: boolean }) => {
  const shapes = [];
  for (let i = 0; i < 9; i++) {
    shapes.push(
      <IsoLShape key={i} x={i*9} y={i*9} lenX={65 - i*1.5} lenY={85 - i*2.5} th={4} hTall={130 - i*11} isHovered={isHovered} />
    );
  }
  
  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 group-hover:opacity-100 transition-opacity duration-700">
      <g transform="translate(120, 60)">
        {shapes}
      </g>
    </svg>
  );
};

const Col1Content = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <div className={`pt-8 md:pt-12 pb-12 px-6 lg:pl-12 lg:pr-12 flex flex-col h-full min-h-[450px] ${isOverlay ? 'text-white' : 'text-black'}`}>
    <div className={`font-mono text-[10px] tracking-widest mb-auto ${isOverlay ? 'text-white/70' : 'text-[#999]'}`}>FIG 0.2</div>
    
    <div className="flex-grow flex items-center justify-center my-12">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        className="relative z-10 w-full h-full flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500"
      >
        <Fig02SVG />
      </motion.div>
    </div>

    <div className="mt-auto">
      <h3 className={`text-[15px] font-medium mb-2 ${isOverlay ? 'text-white' : 'text-black'}`}>Institution Primitive</h3>
      <p className={`text-[14px] leading-[1.6] ${isOverlay ? 'text-white/80' : 'text-[#555]'}`}>
        A versioned operating unit for mission, authority, roles, budget, policy, evidence, and termination.
      </p>
    </div>
  </div>
);

const Col2Content = ({ isOverlay = false }: { isOverlay?: boolean }) => (
  <div className={`pt-8 md:pt-12 pb-12 px-6 lg:px-12 flex flex-col h-full min-h-[450px] ${isOverlay ? 'text-white' : 'text-black'}`}>
    <div className={`font-mono text-[10px] tracking-widest mb-auto ${isOverlay ? 'text-white/70' : 'text-[#999]'}`}>FIG 0.3</div>
    
    <div className="flex-grow flex items-center justify-center my-12">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        className="relative z-10 w-full h-full flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500"
      >
        <Fig03SVG />
      </motion.div>
    </div>

    <div className="mt-auto">
      <h3 className={`text-[15px] font-medium mb-2 ${isOverlay ? 'text-white' : 'text-black'}`}>Organization Runtime</h3>
      <p className={`text-[14px] leading-[1.6] ${isOverlay ? 'text-white/80' : 'text-[#555]'}`}>
        Not an agent framework. The runtime that turns many agents, humans, and tools into one accountable institution.
      </p>
    </div>
  </div>
);

const Col3Content = ({ isOverlay = false, isHovered = false }: { isOverlay?: boolean, isHovered?: boolean }) => (
  <div className={`pt-8 md:pt-12 pb-12 px-6 lg:pl-12 lg:pr-12 flex flex-col h-full min-h-[450px] ${isOverlay ? 'text-white' : 'text-black'}`}>
    <div className={`font-mono text-[10px] tracking-widest mb-auto ${isOverlay ? 'text-white/70' : 'text-[#999]'}`}>FIG 0.4</div>
    
    <div className="flex-grow flex items-center justify-center my-12">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
        className="relative z-10 w-full h-full flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500"
      >
        <Fig04SVG isHovered={isHovered} />
      </motion.div>
    </div>

    <div className="mt-auto">
      <h3 className={`text-[15px] font-medium mb-2 ${isOverlay ? 'text-white' : 'text-black'}`}>Verifiable Runtime</h3>
      <p className={`text-[14px] leading-[1.6] ${isOverlay ? 'text-white/80' : 'text-[#555]'}`}>
        Every mission is evidenced, independently checked, settled against reality, and prepared for inheritance.
      </p>
    </div>
  </div>
);

export function ThesisManifestoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [hover4, setHover4] = React.useState(false);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full bg-white text-black font-sans overflow-hidden py-32 md:py-48"
      style={{ fontFamily: 'var(--font-sans, "Inter", sans-serif)' }}
    >
      <div className="w-full relative z-10 flex flex-col gap-32">
        
        {/* Top Header Section */}
        <div className="w-full max-w-[1300px] mx-auto px-6 lg:px-12">
          <PixelTransition
            gridSize={24}
            pixelColor={(row, col, size) => {
              if (row < size * 0.25) return "#D9AB43"; // Gold
              if (row < size * 0.70) return "#0015FF"; // Blue
              return "#000000"; // Black
            }}
            isActive={isInView}
            className="w-full max-w-[1100px]"
            firstContent={<div className="w-full h-full bg-white" />}
            secondContent={
              <motion.div 
                initial="hidden" 
                animate={isInView ? "visible" : "hidden"} 
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                className="w-full py-2"
              >
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1]">
                  <span className="text-slate-900">The missing primitive is not the agent. It is the <span className="text-[#0015FF]">institution.</span> </span>
                  <span className="text-[#666]">Companies already have models, agents, data, software, and humans. They do not have a programmable, versioned, verifiable runtime for mission, authority, budget, policy, execution, verification, settlement, learning, and termination.</span>
                </motion.h2>
              </motion.div>
            }
          />
        </div>

        {/* Bottom Grid Section */}
        <div className="w-full border-t border-b border-[#eaeaea]">
          <div className="w-full max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-3">
             
             {/* Column 1 */}
             <PixelTransition
               gridSize={12}
               pixelColor="#ffffff"
               className="group border-b md:border-b-0 md:border-r border-[#eaeaea] cursor-pointer min-h-[450px]"
               firstContent={
                 <div className="w-full h-full bg-white relative z-10">
                   <Col1Content />
                 </div>
               }
               secondContent={
                 <div className="w-full h-full relative z-0 flex flex-col overflow-hidden bg-black">
                   <div className="absolute inset-0 z-0">
                     <Dither
                        waveColor={[0.9176470588235294,0.7019607843137254,0.03137254901960784]}
                        disableAnimation={false}
                        enableMouseInteraction={false}
                        mouseRadius={0.3}
                        colorNum={4}
                        pixelSize={1}
                        waveAmplitude={0.35}
                        waveFrequency={5.5}
                        waveSpeed={0}
                     />
                   </div>
                   <div className="relative z-10 w-full h-full pointer-events-none">
                     <Col1Content isOverlay={true} />
                   </div>
                 </div>
               }
             />

             {/* Column 2 */}
             <PixelTransition
               gridSize={12}
               pixelColor="#ffffff"
               className="group border-b md:border-b-0 md:border-r border-[#eaeaea] cursor-pointer min-h-[450px]"
               firstContent={
                 <div className="w-full h-full bg-white relative z-10">
                   <Col2Content />
                 </div>
               }
               secondContent={
                 <div className="w-full h-full relative z-0 flex flex-col overflow-hidden bg-black">
                   <div className="absolute inset-0 z-0 opacity-80">
                     <Dither
                        waveColor={[0.08627450980392157,0.03137254901960784,0.9176470588235294]}
                        disableAnimation={false}
                        enableMouseInteraction={false}
                        mouseRadius={0.3}
                        colorNum={4}
                        pixelSize={1}
                        waveAmplitude={0.25}
                        waveFrequency={5.5}
                        waveSpeed={0}
                     />
                   </div>
                   <div className="relative z-10 w-full h-full pointer-events-none">
                     <Col2Content isOverlay={true} />
                   </div>
                 </div>
               }
             />

             {/* Column 3 */}
             <div 
               className="h-full min-h-[450px]"
               onMouseEnter={() => setHover4(true)}
               onMouseLeave={() => setHover4(false)}
             >
               <PixelTransition
                 gridSize={12}
                 pixelColor="#ffffff"
                 className="group cursor-pointer h-full min-h-[450px]"
                 firstContent={
                   <div className="w-full h-full bg-white relative z-10">
                     <Col3Content isHovered={hover4} />
                   </div>
                 }
                 secondContent={
                   <div className="w-full h-full relative z-0 flex flex-col overflow-hidden bg-black">
                     <div className="absolute inset-0 z-0 opacity-80">
                       <Dither
                          waveColor={[1,1,1]}
                          disableAnimation={false}
                          enableMouseInteraction={false}
                          mouseRadius={0.3}
                          colorNum={4}
                          pixelSize={1}
                          waveAmplitude={0.6}
                          waveFrequency={6.5}
                          waveSpeed={0}
                       />
                     </div>
                     <div className="relative z-10 w-full h-full pointer-events-none">
                       <Col3Content isOverlay={true} isHovered={hover4} />
                     </div>
                   </div>
                 }
               />
             </div>

          </div>
        </div>
      </div>
    </section>
  );
}


