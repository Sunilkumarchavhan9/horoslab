"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export interface SplitTextProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  stagger?: number;
}

export default function SplitText({
  text,
  delay = 0,
  duration = 0.6,
  className = "",
  stagger = 0.05,
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Select all the character spans we rendered
    const chars = containerRef.current.querySelectorAll(".split-char");

    // Clear any existing animation before re-running
    gsap.killTweensOf(chars);

    // Animate characters in
    gsap.fromTo(
      chars,
      { 
        opacity: 0, 
        y: 20 
      },
      {
        opacity: 1,
        y: 0,
        duration: duration,
        stagger: stagger,
        // Assuming delay prop was passed in milliseconds as in the example `delay={100}`
        delay: delay / 1000, 
        ease: "power2.out",
      }
    );

    return () => {
      gsap.killTweensOf(chars);
    };
  }, [text, delay, duration, stagger]);

  // Split text into an array of characters
  const characters = text.split("");

  return (
    <div ref={containerRef} className={`inline-block ${className}`}>
      {characters.map((char, i) => (
        <span
          key={i}
          className="split-char inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
