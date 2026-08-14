"use client";

import React, { useRef, useEffect } from "react";

export function WhiteWavesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      // High DPI support for crisper waves
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", resize);
    resize();

    let time = 0;

    const render = () => {
      time += 0.005; // speed of waves
      ctx.clearRect(0, 0, width, height);

      const drawWave = (
        yBase: number, 
        amplitude: number, 
        frequency: number, 
        color: string, 
        phaseOffset: number
      ) => {
        ctx.beginPath();
        // Start from left-bottom
        ctx.moveTo(0, height);
        // Draw to top-left of wave
        ctx.lineTo(0, yBase + Math.sin(time * phaseOffset) * amplitude);

        // Draw the sine wave across the screen
        for (let x = 0; x <= width; x += 15) {
          const y = yBase + Math.sin(x * frequency + time * phaseOffset) * amplitude;
          ctx.lineTo(x, y);
        }
        
        // Connect to right-bottom, then close
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
      };

      // Draw subtle overlapping fluid waves
      // Using very light slate and a hint of MemoryOS blue
      
      // Back wave (tallest, slowest)
      drawWave(height * 0.4, 150, 0.001, "rgba(241, 245, 249, 0.8)", 1); // slate-100
      
      // Middle wave
      drawWave(height * 0.6, 100, 0.002, "rgba(226, 232, 240, 0.6)", 1.5); // slate-200
      
      // Subtle blue wave
      drawWave(height * 0.7, 80, 0.0015, "rgba(0, 21, 255, 0.03)", 1.2); 
      
      // Front wave (fastest)
      drawWave(height * 0.8, 60, 0.003, "rgba(248, 250, 252, 1)", 2); // slate-50

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden bg-white pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full opacity-60" />
    </div>
  );
}


