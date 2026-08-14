"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export interface DataPathProps {
  d: string;
  delay?: number;
  duration?: number;
  reverse?: boolean;
}

export function DataPath({ d, delay = 0, duration = 2, reverse = false }: DataPathProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const packetRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current || !packetRef.current) return;

    const length = pathRef.current.getTotalLength();
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: Math.random() * 5 + 4, delay });
      
      // We need a packet moving along the path. 
      gsap.set(packetRef.current, {
        strokeDasharray: `40 ${length}`, // longer packet length for beam effect
        strokeDashoffset: length,
        opacity: 0,
      });

      tl.to(packetRef.current, {
        opacity: 1,
        duration: 0.2,
      })
      .fromTo(packetRef.current,
        { strokeDashoffset: reverse ? -length : length },
        { strokeDashoffset: reverse ? length : -length, duration: duration, ease: "none" }, // Linear ease for smooth traveling
        "<"
      )
      .to(packetRef.current, {
        opacity: 0,
        duration: 0.2,
      });

    });

    return () => ctx.revert();
  }, [delay, duration, reverse]);

  return (
    <>
      {/* Base path (gray dashed) */}
      <path ref={pathRef} d={d} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" fill="none" className="transition-all duration-500" />
      
      {/* Moving packet (short bright line segment acting like a packet) */}
      <path ref={packetRef} d={d} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" style={{ filter: "drop-shadow(0 0 6px rgba(59,130,246,1))" }} />
    </>
  );
}
