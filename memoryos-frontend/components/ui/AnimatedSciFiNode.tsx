"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export interface AnimatedSciFiNodeProps {
  text?: string;
  className?: string;
}

export function AnimatedSciFiNode({ text = "BITCOIN", className = "" }: AnimatedSciFiNodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrambledText, setScrambledText] = useState("");

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Phase 1: Boot & Assemble
      // 1. Blueprint guides draw
      tl.from(".blueprint-guide", {
        strokeDasharray: "0 1000",
        strokeDashoffset: 1000,
        opacity: 0,
        duration: 1.2,
        ease: "power2.inOut",
        stagger: 0.1
      })
      // 2. Corners lock
      .fromTo(".sci-fi-corner", 
        { scale: 0, opacity: 0, rotation: -90 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: "back.out(1.5)", stagger: 0.1 },
        "-=0.5"
      )
      // 3. Dashed construction boxes fade and scale in
      .from(".sci-fi-dashed-border", {
        scale: 0.8,
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut",
        transformOrigin: "center center"
      }, "-=0.2")
      // 4. Inner square fills
      .from(".sci-fi-box", {
        scaleX: 0,
        opacity: 0,
        duration: 0.8,
        ease: "expo.out"
      }, "-=0.5")
      // 5. Pixel blocks
      .fromTo(".sci-fi-dot", 
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: 0.05, stagger: { amount: 0.8, from: "random" } },
        "-=0.5"
      )
      // 6. Text scrambles in
      .add(() => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
        let iterations = 0;
        const interval = setInterval(() => {
          setScrambledText(text.split("").map((letter, index) => {
            if (index < iterations) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join(""));
          if (iterations >= text.length) clearInterval(interval);
          iterations += 1/3;
        }, 30);
      }, "-=0.2");

      // Phase 2: Core Loop (Breathing, Rotation, Flickers, Scan)
      
      // Breathing Scale
      gsap.to(containerRef.current, {
        scale: 1.01,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2 // Start after boot
      });

      // Blueprint Guide Rotation
      gsap.to(".blueprint-guide-group", {
        rotation: 0.5,
        transformOrigin: "center center",
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Pixel Flickers
      gsap.to(".sci-fi-dot", {
        opacity: "random(0.1, 1)",
        duration: "random(0.2, 0.8)",
        repeat: -1,
        yoyo: true,
        stagger: { amount: 2, from: "random" },
        ease: "none"
      });

      // Corner Brightening
      gsap.to(".sci-fi-corner", {
        filter: "brightness(1.5) drop-shadow(0px 0px 4px rgba(59,130,246,0.8))",
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        repeatDelay: Math.random() * 4 + 2,
        stagger: { amount: 1, from: "random" },
      });

      // Computational Scan
      const scanTl = gsap.timeline({ repeat: -1, repeatDelay: 10 });
      scanTl.fromTo(".sci-fi-scan", 
        { y: -20, opacity: 0 },
        { opacity: 0.5, duration: 0.2 }
      )
      .to(".sci-fi-scan", {
        y: 270,
        duration: 1.5,
        ease: "power1.inOut"
      })
      .to(".sci-fi-scan", {
        opacity: 0,
        duration: 0.2
      }, "-=0.2");

    }, containerRef);

    return () => ctx.revert();
  }, [text]);

  // Generate dot matrix
  const dots = [];
  const rows = 4;
  const cols = 15;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Top grid
      dots.push(
        <rect
          key={`top-${r}-${c}`}
          x={65 + c * 8}
          y={40 + r * 8}
          width="4"
          height="4"
          fill="#1023caff"
          className="sci-fi-dot opacity-0"
        />
      );
      // Bottom grid
      dots.push(
        <rect
          key={`bottom-${r}-${c}`}
          x={65 + c * 8}
          y={150 + r * 8}
          width="4"
          height="4"
          fill="#0b1cb2ff"
          className="sci-fi-dot opacity-0"
        />
      );
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className} w-full aspect-square`}>
      <svg
        ref={svgRef}
        viewBox="0 0 250 250"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]"
      >
        <g className="blueprint-guide-group">
          {/* Blueprint Guides (Outer thin lines) */}
          <path d="M 125 0 L 125 250 M 0 125 L 250 125" stroke="#cbd5e1" strokeWidth="0.5" fill="none" className="blueprint-guide opacity-30" strokeDasharray="4 4" />
          <circle cx="125" cy="125" r="115" stroke="#cbd5e1" strokeWidth="0.5" fill="none" className="blueprint-guide opacity-20" />
        </g>

        {/* Outer Tech Border (Corners) */}
        <path d="M 20 40 L 20 20 L 40 20" stroke="#78787aff" strokeWidth="3" fill="none" className="sci-fi-corner transform-origin-top-left" style={{ transformOrigin: "20px 20px" }} />
        <path d="M 210 20 L 230 20 L 230 40" stroke="#78787aff" strokeWidth="3" fill="none" className="sci-fi-corner transform-origin-top-right" style={{ transformOrigin: "230px 20px" }} />
        <path d="M 230 210 L 230 230 L 210 230" stroke="#78787aff" strokeWidth="3" fill="none" className="sci-fi-corner transform-origin-bottom-right" style={{ transformOrigin: "230px 230px" }} />
        <path d="M 40 230 L 20 230 L 20 210" stroke="#78787aff" strokeWidth="3" fill="none" className="sci-fi-corner transform-origin-bottom-left" style={{ transformOrigin: "20px 230px" }} />

        {/* Dashed construction boxes */}
        <rect x="15" y="15" width="220" height="220" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6 6" fill="none" className="sci-fi-dashed-border opacity-80" />
        <rect x="35" y="35" width="180" height="180" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" fill="none" className="sci-fi-dashed-border opacity-60" />

        {/* Dot Matrix Grids */}
        <g>{dots}</g>

        {/* Center Text Box */}
        <rect
          x="50"
          y="95"
          width="150"
          height="45"
          fill="#ffffff"
          stroke="#4f46e5"
          strokeWidth="1.5"
          className="sci-fi-box opacity-0 origin-center"
          style={{ transformOrigin: "125px 117.5px" }}
        />

        {/* Center Text */}
        <text
          x="125"
          y="120"
          fill="#002de0ff"
          fontSize="22"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
          dominantBaseline="central"
          letterSpacing="2"
          className="sci-fi-text"
        >
          {scrambledText || "..."}
        </text>

        {/* Computational Scan Line */}
        <rect x="0" y="-20" width="250" height="2" fill="#3b82f6" className="sci-fi-scan opacity-0" style={{ filter: "drop-shadow(0 0 8px #3b82f6)" }} />
        
        {/* Decorative Side Elements (Also corners technically) */}
        <rect x="5" y="100" width="4" height="40" fill="#0a00cfff" className="sci-fi-corner" style={{ transformOrigin: "7px 120px" }} />
        <rect x="241" y="100" width="4" height="40" fill="#4f46e5" className="sci-fi-corner" style={{ transformOrigin: "243px 120px" }} />
      </svg>
    </div>
  );
}
