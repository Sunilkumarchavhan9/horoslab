"use client";

import "@/lib/suppress-three-clock-warning";
import { useMachine } from '@xstate/react';
import { simulationMachine, ViewMode } from './SimulationMachine';
import { Canvas } from '@react-three/fiber';
import { MissionPhase } from './MissionPhase';
import { OrganizationPhase } from './OrganizationPhase';
import { ExecutionPhase } from './ExecutionPhase';
import { SettlementPhase } from './SettlementPhase';
import React, { useEffect, useRef } from 'react';

import { SimulationCanvas } from './SimulationCanvas';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function SimulationMaster() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, send] = useMachine(simulationMachine);
  const { progress, viewMode, isPlaying } = state.context;

  // Animation loop - increment progress when playing, loop back to 0 when complete
  useEffect(() => {
    if (!isPlaying) return;

    const animationFrame = requestAnimationFrame(() => {
      const newProgress = progress + 0.01; // Increment by 0.01 per frame
      send({ type: 'SET_PROGRESS', value: newProgress > 1 ? 0 : newProgress });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [progress, isPlaying, send]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    send({ type: 'SET_PROGRESS', value: parseFloat(e.target.value) });
  };

  const setViewMode = (mode: ViewMode) => {
    send({ type: 'SET_VIEW_MODE', mode });
  };

  const togglePlay = () => {
    send({ type: isPlaying ? 'PAUSE' : 'PLAY' });
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[1400px] mx-auto min-h-[700px] bg-slate-50 overflow-hidden border border-slate-200 rounded-md shadow-sm mb-24 font-mono select-none">
      
      {/* Background WebGL Effects Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <ErrorBoundary>
          <Canvas eventSource={containerRef as unknown as React.RefObject<HTMLElement>}>
            <ambientLight intensity={0.5} />
            <SimulationCanvas progress={progress} />
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sim-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sim-grid)" />
        </svg>
      </div>

      {/* Top View Mode Selector */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-sans">
        {(['institution', 'authority', 'causality', 'evidence', 'counterfactual', 'lineage'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-full capitalize transition-colors ${viewMode === mode ? 'bg-slate-900 text-[#F0EFE2] font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Content Layers */}
      <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
        {/* State Debugging (temporary) */}
        <div className="absolute top-4 right-4 bg-white/90 p-2 text-[10px] text-slate-500 rounded border border-slate-200">
          State: {state.value as string}
        </div>

        <MissionPhase state={state} />
        <OrganizationPhase state={state} />
        <ExecutionPhase state={state} />
        <SettlementPhase state={state} />
      </div>

      {/* Bottom Timeline Scrubber */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl bg-white/90 backdrop-blur-md p-3 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
        <button 
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 text-[#F0EFE2] hover:bg-slate-800 transition-colors"
        >
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-medium">MISSION</span>
          <input 
            type="range" 
            min="0" max="1" step="0.001" 
            value={progress}
            onChange={handleScrub}
            className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 font-medium">SETTLEMENT</span>
        </div>
      </div>
    </div>
  );
}


