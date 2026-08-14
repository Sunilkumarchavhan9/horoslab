"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useSpring, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

// 1. Hover Lift (Smooth scaling and shadow addition)
export function HoverLift({ children, className, scale = 1.02 }: { children: React.ReactNode, className?: string, scale?: number }) {
 return (
 <motion.div
 whileHover={{ y: -2, scale, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.12)" }}
 whileTap={{ scale: 0.98 }}
 transition={{ type: "spring", stiffness: 400, damping: 25 }}
 className={cn("transition-all duration-200", className)}
 >
 {children}
 </motion.div>
 );
}

// 2. Glow Pulse (For active states, running nodes, etc.)
export function GlowPulse({ children, className, active = true, color = "rgba(15, 82, 255, 0.4)" }: { children: React.ReactNode, className?: string, active?: boolean, color?: string }) {
 return (
 <div className={cn("relative", className)}>
 <AnimatePresence>
 {active && (
 <motion.div
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.8 }}
 className="absolute inset-0 rounded-[inherit] z-0 pointer-events-none"
 style={{ boxShadow: `0 0 15px 2px ${color}` }}
 >
 <motion.div
 animate={{ opacity: [0.4, 0.8, 0.4] }}
 transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
 className="absolute inset-0 rounded-[inherit]"
 style={{ boxShadow: `0 0 25px 4px ${color}` }}
 />
 </motion.div>
 )}
 </AnimatePresence>
 <div className="relative z-10 h-full">{children}</div>
 </div>
 );
}

// 3. Number Ticker (Animated Counters)
export function NumberTicker({ value, formatter = (v) => v.toFixed(0) }: { value: number, formatter?: (v: number) => string }) {
 const [display, setDisplay] = useState(formatter(value));
 const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });

 useEffect(() => {
 spring.set(value);
 }, [value, spring]);

 useEffect(() => {
 return spring.on("change", (v) => {
 setDisplay(formatter(v));
 });
 }, [spring, formatter]);

 return <motion.span>{display}</motion.span>;
}

// 4. Slide-in Event (For feeds and logs)
export function SlideInEvent({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
 return (
 <motion.div
 initial={{ opacity: 0, x: -20, y: 0 }}
 animate={{ opacity: 1, x: 0, y: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ type: "spring", stiffness: 350, damping: 25, delay }}
 className={className}
 >
 {children}
 </motion.div>
 );
}

// 5. Node Pulse (For graph nodes)
export function NodePulse({ active, children, color = "#0f52ff" }: { active: boolean, children: React.ReactNode, color?: string }) {
 return (
 <div className="relative inline-block">
 {active && (
 <motion.div 
 className="absolute inset-[-4px] rounded-full z-0"
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 1.4] }}
 transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
 style={{ backgroundColor: color }}
 />
 )}
 <div className="relative z-10">
 {children}
 </div>
 </div>
 );
}

// 6. Progress Ring (SVG Circle Animation)
export function ProgressRing({ progress, size = 40, strokeWidth = 4, color = "#0f52ff" }: { progress: number, size?: number, strokeWidth?: number, color?: string }) {
 const radius = (size - strokeWidth) / 2;
 const circumference = radius * 2 * Math.PI;
 const offset = circumference - (progress / 100) * circumference;

 return (
 <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
 <svg width={size} height={size} className="transform -rotate-90">
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="transparent"
 stroke="rgba(0,0,0,0.1)"
 strokeWidth={strokeWidth}
 />
 <motion.circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="transparent"
 stroke={color}
 strokeWidth={strokeWidth}
 strokeDasharray={circumference}
 initial={{ strokeDashoffset: circumference }}
 animate={{ strokeDashoffset: offset }}
 transition={{ duration: 1.5, ease: "easeOut" }}
 strokeLinecap="round"
 />
 </svg>
 <div className="absolute flex items-center justify-center text-[10px] font-semibold text-foreground">
 <NumberTicker value={progress} />%
 </div>
 </div>
 );
}

// 7. Timeline Drawing (SVG Line Animation)
export function TimelineDrawing({ height = 100, color = "#0f52ff" }: { height?: number, color?: string }) {
 const ref = useRef(null);
 const isInView = useInView(ref, { once: true, margin: "-20%" });

 return (
 <div ref={ref} style={{ height }} className="w-0.5 relative">
 <div className="absolute inset-0 bg-black/10 w-full" />
 <motion.div 
 className="absolute top-0 left-0 w-full bg-[#0f52ff]"
 initial={{ height: 0 }}
 animate={isInView ? { height: "100%" } : { height: 0 }}
 transition={{ duration: 1.5, ease: "easeOut" }}
 />
 </div>
 );
}
