"use client";

import React, { useRef, useMemo } from 'react';
import "@/lib/suppress-three-clock-warning";
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Line, Html, Sphere, Plane, TorusKnot } from '@react-three/drei';
import * as THREE from 'three';

// --------------------------------------------------------------------------------
// DATA FIELD
// --------------------------------------------------------------------------------
export function DataField() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const [positions, colors] = useMemo(() => {
    const count = 12481;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const baseColor = new THREE.Color(0x333333);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      col[i * 3] = baseColor.r;
      col[i * 3 + 1] = baseColor.g;
      col[i * 3 + 2] = baseColor.b;
    }
    return [pos, col];
  }, []);

  // Simple ambient rotation
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group position={[-5, -2, -10]} scale={0}>
      <Points ref={pointsRef} positions={positions} colors={colors}>
        <PointMaterial vertexColors size={0.05} sizeAttenuation transparent opacity={0.6} />
      </Points>
      <Html position={[0, -6, 0]} center className="pointer-events-none">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest bg-[#050505]/80 px-2 border border-[#333]">
          Data Records (12,481)
        </div>
      </Html>
    </group>
  );
}

// --------------------------------------------------------------------------------
// RUNTIME LOOPS
// --------------------------------------------------------------------------------
export function RuntimeLoops() {
  const knotRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (knotRef.current) {
      knotRef.current.rotation.x = state.clock.getElapsedTime() * 0.5;
      knotRef.current.rotation.y = state.clock.getElapsedTime() * 0.8;
    }
  });
  return (
    <group position={[4, -4, -8]} scale={0}>
      <TorusKnot ref={knotRef} args={[2, 0.4, 100, 16]}>
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.3} />
      </TorusKnot>
      <Html position={[0, -3, 0]} center className="pointer-events-none">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest bg-[#050505]/80 px-2 border border-[#333]">
          Runtime Vortices
        </div>
      </Html>
    </group>
  );
}

// --------------------------------------------------------------------------------
// ROLLOUT BANDS
// --------------------------------------------------------------------------------
export function RolloutBands() {
  return (
    <group position={[6, 2, -12]} scale={0}>
      <Plane args={[4, 4]} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
        <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.2} />
      </Plane>
      <Plane args={[4, 4]} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 1, 0]}>
        <meshBasicMaterial color="#f43f5e" wireframe transparent opacity={0.2} />
      </Plane>
      <Html position={[0, -2, 0]} center className="pointer-events-none">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest bg-[#050505]/80 px-2 border border-[#333]">
          Temporal Planes
        </div>
      </Html>
    </group>
  );
}

// --------------------------------------------------------------------------------
// HISTORY ECHO
// --------------------------------------------------------------------------------
export function HistoryEcho() {
  return (
    <group position={[-6, 4, -15]} scale={0}>
      <Line 
        points={[[-2,-2,0], [0,1,0], [2,-1,0], [4,2,0]]} 
        color="#888888" 
        lineWidth={2} 
        transparent 
        opacity={0.3}
      />
      <Html position={[0, -3, 0]} center className="pointer-events-none">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest bg-[#050505]/80 px-2 border border-[#333]">
          Incident INC-184
        </div>
      </Html>
    </group>
  );
}

// --------------------------------------------------------------------------------
// POLICY BOUNDARY
// --------------------------------------------------------------------------------
export function PolicyBoundary() {
  return (
    <group position={[0, 5, -10]} scale={0}>
      <Sphere args={[2, 4, 4]} scale={[2, 0.5, 2]}>
        <meshBasicMaterial color="#cbd5e1" wireframe transparent opacity={0.2} />
      </Sphere>
      <Html position={[0, -2, 0]} center className="pointer-events-none">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest bg-[#050505]/80 px-2 border border-[#333]">
          Policy FIN-07
        </div>
      </Html>
    </group>
  );
}

// --------------------------------------------------------------------------------
// EXTERNAL PROVIDER FIELD
// --------------------------------------------------------------------------------
export function ExternalProviderField() {
  return (
    <group position={[8, 0, -20]} scale={0}>
      <Sphere args={[3, 16, 16]}>
        <meshBasicMaterial color="#64748b" wireframe transparent opacity={0.1} />
      </Sphere>
      <Html position={[0, -4, 0]} center className="pointer-events-none">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest bg-[#050505]/80 px-2 border border-[#333]">
          Provider Field
        </div>
      </Html>
    </group>
  );
}
