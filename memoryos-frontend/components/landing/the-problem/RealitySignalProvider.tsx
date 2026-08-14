"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

type DecisionState = "WAITING" | "VERIFY" | "MERGE";

interface RealitySignalContextType {
  time: number;
  setTime: (t: number) => void;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  timelineDuration: number;
  setTimelineDuration: (d: number) => void;
  decision: DecisionState;
  setDecision: (d: DecisionState) => void;
  playCounterfactual: (type: DecisionState) => void;
}

const RealitySignalContext = createContext<RealitySignalContextType | undefined>(undefined);

export function RealitySignalProvider({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState(0);
  const [timelineDuration, setTimelineDuration] = useState(21.0);
  const [decision, setDecision] = useState<DecisionState>("WAITING");
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Expose a helper to trigger the counterfactual branches
  const playCounterfactual = (type: DecisionState) => {
    setDecision(type);
    if (!timelineRef.current) return;
    
    if (type === "VERIFY") {
      // VERIFY FIRST freezes the timeline and prevents catastrophic progression
      timelineRef.current.pause();
    } else if (type === "MERGE") {
      // MERGE ANYWAY plays out the catastrophe simulation (if there is extra animation bound to >20s)
      timelineRef.current.play();
    }
  };

  return (
    <RealitySignalContext.Provider
      value={{
        time,
        setTime,
        timelineRef,
        timelineDuration,
        setTimelineDuration,
        decision,
        setDecision,
        playCounterfactual
      }}
    >
      {children}
    </RealitySignalContext.Provider>
  );
}

export function useRealitySignal() {
  const ctx = useContext(RealitySignalContext);
  if (!ctx) throw new Error("useRealitySignal must be used within RealitySignalProvider");
  return ctx;
}
