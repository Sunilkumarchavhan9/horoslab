"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// --- GLSL Shaders ---

const OrbMaterial = shaderMaterial(
  {
    uTime: 0,
    uSpeed: 0.15,
    uDistortion: 0.15,
    uGlow: 0.5,
    uColor1: new THREE.Color("#439775"), // green
    uColor2: new THREE.Color("#264653"), // dark blue
    uColor3: new THREE.Color("#a2d2ff"), // light cyan
    uColor4: new THREE.Color("#b3c25b")  // yellowish green
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uDistortion;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    varying float vNoise;

    // Simplex 3D Noise
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 1.0/7.0;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      
      // Calculate noise for vertex displacement
      float noise = snoise(position * 1.5 + uTime * uSpeed);
      vNoise = noise;
      
      // Displace vertex along normal
      vec3 displacedPosition = position + normal * noise * uDistortion;
      
      vPosition = displacedPosition;
      
      vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform float uGlow;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uColor4;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    varying float vNoise;

    void main() {
      // Base fluid color mixing based on position and noise
      float mix1 = smoothstep(-1.0, 1.0, vPosition.y + vNoise);
      float mix2 = smoothstep(-1.0, 1.0, vPosition.x + vNoise);
      
      vec3 colorA = mix(uColor1, uColor2, mix1);
      vec3 colorB = mix(uColor3, uColor4, mix2);
      
      vec3 baseColor = mix(colorA, colorB, smoothstep(-0.5, 0.5, vNoise));

      // Re-normalize varying normal
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Simple directional lighting
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      float diffuse = max(dot(normal, lightDir), 0.0);
      
      // Ambient + Diffuse
      vec3 litColor = baseColor * (0.3 + 0.7 * diffuse);

      // Fresnel effect for glowing rim
      float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
      vec3 rimColor = vec3(1.0, 1.0, 1.0) * fresnel * uGlow;

      // Specular highlight (fake gloss)
      vec3 halfVector = normalize(lightDir + viewDir);
      float specular = pow(max(dot(normal, halfVector), 0.0), 30.0);
      
      vec3 finalColor = litColor + rimColor + (specular * 0.3 * uGlow);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ OrbMaterial });

// --- R3F Components ---

function OrbMesh({ orbState }: { orbState: "idle" | "listening" | "thinking" | "speaking" }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Target values for uniforms based on state
  const targetParams = useMemo(() => {
    switch (orbState) {
      case "idle":
        return { speed: 0.15, distortion: 0.02, glow: 0.2 };
      case "listening":
        return { speed: 0.25, distortion: 0.04, glow: 0.3 };
      case "thinking":
        return { speed: 0.40, distortion: 0.08, glow: 0.4 };
      case "speaking":
        return { speed: 0.60, distortion: 0.15, glow: 0.6 };
      default:
        return { speed: 0.15, distortion: 0.02, glow: 0.2 };
    }
  }, [orbState]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Smoothly interpolate uniform values
      materialRef.current.uSpeed += (targetParams.speed - materialRef.current.uSpeed) * 0.05;
      materialRef.current.uDistortion += (targetParams.distortion - materialRef.current.uDistortion) * 0.05;
      materialRef.current.uGlow += (targetParams.glow - materialRef.current.uGlow) * 0.05;
      
      materialRef.current.uTime = state.clock.elapsedTime;
    }
    
    // Slow rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, 128, 128]} />
      {/* @ts-expect-error custom material */}
      <orbMaterial ref={materialRef} toneMapped={false} />
    </mesh>
  );
}

// --- Main Exported Component ---

export function VoiceOrb({ orbState = "idle" }: { orbState?: "idle" | "listening" | "thinking" | "speaking" }) {
  return (
    <div className="relative w-[200px] h-[200px] md:w-[250px] md:h-[250px] flex items-center justify-center z-10">
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Canvas renderer for the WebGL Sphere */}
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          
          <OrbMesh orbState={orbState} />
          
          {/* Post-processing: Bloom is essential for the glowing effect */}
          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.9} 
              mipmapBlur 
              intensity={0.5} 
            />
          </EffectComposer>
        </Canvas>

      </div>
    </div>
  );
}
