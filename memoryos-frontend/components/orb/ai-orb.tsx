"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { OrbVertexShader, OrbFragmentShader } from "./shaders";

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "executing" | "error";

interface OrbProps {
  state?: OrbState;
  color?: string; // Hex color for the base theme
}

// Map states to shader parameters
const stateConfig = {
  idle: { energy: 0.2, fractureActivity: 0.1, lightSpeed: 0.5 },
  listening: { energy: 0.4, fractureActivity: 0.3, lightSpeed: 1.0 },
  thinking: { energy: 0.8, fractureActivity: 0.8, lightSpeed: 2.5 },
  speaking: { energy: 0.6, fractureActivity: 0.5, lightSpeed: 1.5 },
  executing: { energy: 1.0, fractureActivity: 1.2, lightSpeed: 3.5 },
  error: { energy: 0.9, fractureActivity: 2.0, lightSpeed: 5.0 },
};

function OrbMesh({ state = "idle", color = "#ffffff" }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  
  // Set up uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uEnergy: { value: stateConfig[state].energy },
    uFractureActivity: { value: stateConfig[state].fractureActivity },
    uLightSpeed: { value: stateConfig[state].lightSpeed },
    uMovingLight: { value: new THREE.Vector3(0, 0, 0) },
  }), []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value.set(color);
    }
  }, [color]);

  const targetConfig = stateConfig[state];

  useFrame((stateObj, delta) => {
    if (materialRef.current) {
      // Lerp uniforms towards target config
      materialRef.current.uniforms.uEnergy.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uEnergy.value, targetConfig.energy, delta * 3);
      materialRef.current.uniforms.uFractureActivity.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uFractureActivity.value, targetConfig.fractureActivity, delta * 3);
      
      const currentLightSpeed = materialRef.current.uniforms.uLightSpeed.value;
      materialRef.current.uniforms.uLightSpeed.value = THREE.MathUtils.lerp(currentLightSpeed, targetConfig.lightSpeed, delta * 3);
      
      // Advance custom time for noise animation
      timeRef.current += delta * materialRef.current.uniforms.uLightSpeed.value;
      materialRef.current.uniforms.uTime.value = timeRef.current;
      
      // Move internal light source
      const t = timeRef.current;
      const lx = Math.sin(t * 0.4) * 1.5;
      const ly = Math.cos(t * 0.7) * 1.5;
      const lz = Math.sin(t * 0.25) * 1.5;
      materialRef.current.uniforms.uMovingLight.value.set(lx, ly, lz);
      
      if (meshRef.current) {
        // Dynamic rotation based on state energy/speed
        meshRef.current.rotation.y += delta * 0.15 * currentLightSpeed;
        meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
        meshRef.current.rotation.z = Math.cos(t * 0.15) * 0.1;
        
        // Gentle hovering effect based on energy
        meshRef.current.position.y = Math.sin(t * 1.2) * (targetConfig.energy * 0.05);
      }
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 128, 128]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={OrbVertexShader}
        fragmentShader={OrbFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </Sphere>
  );
}

export function AiOrb({ state = "thinking" }: { state?: OrbState }) {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }} gl={{ antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true }}>
        <ambientLight intensity={0.5} />
        <OrbMesh state={state} color="#ffffff" />
        <EffectComposer>
          <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.1} height={300} intensity={2.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
