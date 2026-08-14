"use client";

import React, { useRef, useEffect } from "react";

export function HeroInteractiveDither() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    
    // Grid settings
    const CELL_SIZE = 24;
    const SQUARE_SIZE = 4;
    
    // Mouse state
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    // Grid data
    interface Cell {
      x: number;
      y: number;
      baseOpacity: number;
      phase: number;
      speed: number;
      isBlue: boolean;
      currentOpacity: number;
      targetOpacity: number;
    }
    let cells: Cell[] = [];

    const initGrid = () => {
      cells = [];
      const cols = Math.ceil(width / CELL_SIZE);
      const rows = Math.ceil(height / CELL_SIZE);
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const isVisible = Math.random() > 0.6;
          const baseOpacity = isVisible ? Math.random() * 0.2 + 0.05 : 0;
          
          cells.push({
            x: i * CELL_SIZE + (CELL_SIZE / 2),
            y: j * CELL_SIZE + (CELL_SIZE / 2),
            baseOpacity,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.005 + 0.002, // Significantly faster twinkle
            isBlue: Math.random() > 0.5, // 50% chance to be blue or black
            currentOpacity: baseOpacity,
            targetOpacity: baseOpacity,
          });
        }
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
      initGrid();
    };

    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;

      ctx.clearRect(0, 0, width, height);

      const hoverRadius = 150;
      const time = Date.now();

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        
        let animatedBase = cell.baseOpacity;
        if (cell.baseOpacity > 0) {
          // Continuous twinkling noise animation
          const fluctuation = Math.sin(time * cell.speed + cell.phase) * 0.5 + 0.5;
          animatedBase = cell.baseOpacity * (0.2 + fluctuation * 1.8);
        }

        const dx = mouseX - cell.x;
        const dy = mouseY - cell.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < hoverRadius) {
          const intensity = 1 - (dist / hoverRadius);
          cell.targetOpacity = animatedBase + (intensity * 0.6);
        } else {
          cell.targetOpacity = animatedBase;
        }

        cell.currentOpacity += (cell.targetOpacity - cell.currentOpacity) * 0.15;

        if (cell.currentOpacity > 0.01) {
          if (cell.isBlue) {
            ctx.fillStyle = `rgba(0, 21, 255, ${cell.currentOpacity})`; // MemoryOS Blue
          } else {
            ctx.fillStyle = `rgba(0, 0, 0, ${cell.currentOpacity})`; // Black
          }
          
          const sizeOffset = (cell.currentOpacity - cell.baseOpacity) * 4;
          const drawSize = SQUARE_SIZE + sizeOffset;
          
          ctx.fillRect(
            cell.x - drawSize / 2, 
            cell.y - drawSize / 2, 
            drawSize, 
            drawSize
          );
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden bg-white pointer-events-none">
      {/* Radial fade mask so it blends into the center text */}
      <div 
        className="absolute inset-0"
        style={{
          maskImage: 'radial-gradient(ellipse at 50% 40%, transparent 20%, black 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, transparent 20%, black 80%)'
        }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />
      </div>
    </div>
  );
}


