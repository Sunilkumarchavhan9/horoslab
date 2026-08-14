"use client";

import React, { useEffect, useRef } from "react";

export function BrainWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    window.addEventListener("resize", resize);
    resize();

    const particles: { x: number; y: number; speed: number; offset: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 3,
        offset: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      time += 0.05;
      
      // Trail effect
      ctx.fillStyle = "rgba(12, 24, 117, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;

      // Draw parametric waves
      const waves = [
        { amplitude: 40, frequency: 0.03, speed: 2.5, color: "rgba(16, 185, 129, 0.7)" }, // Gamma
        { amplitude: 25, frequency: 0.05, speed: 3.5, color: "rgba(52, 211, 153, 0.9)" }, // Gamma fast
        { amplitude: 60, frequency: 0.015, speed: 1.5, color: "rgba(94, 234, 212, 0.4)" }, // Beta
      ];

      waves.forEach((wave, i) => {
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < canvas.width; x++) {
          const y = centerY + Math.sin(x * wave.frequency + time * wave.speed + i) * wave.amplitude;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw particles
      ctx.fillStyle = "rgba(167, 243, 208, 0.9)";
      particles.forEach((p) => {
        p.x -= p.speed;
        if (p.x < 0) {
          p.x = canvas.width;
          p.y = Math.random() * canvas.height;
        }
        
        // Make them bob with the wave
        const yOffset = Math.sin(p.x * 0.02 + time * 2 + p.offset) * 15;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y + yOffset, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Canvas dither noise
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let i = 0; i < 300; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block mix-blend-screen opacity-80" />
      {/* SVG Dither Filter overlay */}
      <div 
        className="absolute inset-0 opacity-[0.25] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>
      {/* Gradient fade from top so it blends nicely if the image is above it */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1875] via-transparent to-transparent h-24"></div>
    </div>
  );
}
