"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function ComputationalBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const resize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const dotSpacing = 24;
    let time = 0;
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      const cols = Math.floor(width / dotSpacing) + 1;
      const rows = Math.floor(height / dotSpacing) + 1;
      
      const offsetX = (width - (cols - 1) * dotSpacing) / 2;
      const offsetY = (height - (rows - 1) * dotSpacing) / 2;
      
      // Draw dots
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const px = offsetX + x * dotSpacing;
          const py = offsetY + y * dotSpacing;
          
          // Very slow, subtle wave
          const wave = Math.sin((px * 0.003) + time * 0.4) * Math.cos((py * 0.003) + time * 0.2);
          
          // Pseudo-random noise based on position to occasionally highlight a dot (invisible packet)
          const noise = Math.sin(px * 12.9898 + py * 78.233 + time * 2);
          const isHighlight = noise > 0.98; // Rare occurrence
          
          let currentRadius = isHighlight ? 1.5 : 1;
          let alpha = 0.15 + (wave + 1) * 0.1; // Base opacity fluctuates between 0.15 and 0.35
          
          if (isHighlight) {
             alpha = 0.6; // Brighter when highlighted
             ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`; // Blueish highlight
          } else {
             ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`; // Slate
          }
          
          ctx.beginPath();
          ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Horizontal scanning lines
      const scanY = (time * 60) % (height * 2) - height; // Moves down
      const scanGradientY = ctx.createLinearGradient(0, scanY, 0, scanY + 100);
      scanGradientY.addColorStop(0, "rgba(96, 165, 250, 0)");
      scanGradientY.addColorStop(0.5, "rgba(96, 165, 250, 0.03)");
      scanGradientY.addColorStop(1, "rgba(96, 165, 250, 0)");
      ctx.fillStyle = scanGradientY;
      ctx.fillRect(0, scanY, width, 100);
      
      // Vertical scanning lines
      const scanX = (time * 40) % (width * 2) - width; // Moves right
      const scanGradientX = ctx.createLinearGradient(scanX, 0, scanX + 100, 0);
      scanGradientX.addColorStop(0, "rgba(96, 165, 250, 0)");
      scanGradientX.addColorStop(0.5, "rgba(96, 165, 250, 0.02)");
      scanGradientX.addColorStop(1, "rgba(96, 165, 250, 0)");
      ctx.fillStyle = scanGradientX;
      ctx.fillRect(scanX, 0, 100, height);
      
      time += 0.016; // Approx 60fps
      animationId = requestAnimationFrame(render);
    };

    let animationId = requestAnimationFrame(render);

    // Boot Phase Intro: Fade in the canvas
    gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 4, ease: "power2.inOut" });

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`} 
    />
  );
}
