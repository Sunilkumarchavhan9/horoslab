"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const fragmentShader = `
uniform float uTime;
uniform sampler2D uTexture;
varying vec2 vUv;

// Simple 2D noise for the organic distortion
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 uv = vUv;
    
    // Smooth organic distortion flowing upwards
    float n = noise(uv * 12.0 - vec2(0.0, uTime * 0.4));
    
    // Apply displacement to UVs
    vec2 distortedUv = uv + vec2((n - 0.5) * 0.015, (n - 0.5) * 0.015);
    
    vec4 tex = texture2D(uTexture, distortedUv);
    
    // Calculate luminance to find bright spots (glowing parts)
    float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    
    // Create a pulsing glow effect that targets bright areas
    float pulse = (sin(uTime * 1.5) * 0.5 + 0.5);
    
    // Enhance the glowing regions
    vec3 glow = tex.rgb * (1.0 + (pulse * 0.5 * smoothstep(0.4, 0.9, luma)));
    
    gl_FragColor = vec4(glow, tex.a);
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function AnimatedMaterial() {
    const texture = useTexture('/images/generative-video-bg.png');
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uTexture: { value: texture },
        }),
        [texture]
    );

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <shaderMaterial
            ref={materialRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            transparent={true}
        />
    );
}

export function GenerativeVideoBgAnimation() {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 1], fov: 100 }}
                style={{ width: '100%', height: '100%' }}
                gl={{ alpha: true, antialias: false }}
            >
                {/* Full screen quad matching the UV space */}
                <mesh scale={[2.5, 2.5, 1]}>
                    <planeGeometry args={[1, 1]} />
                    <React.Suspense fallback={null}>
                        <AnimatedMaterial />
                    </React.Suspense>
                </mesh>
            </Canvas>
        </div>
    );
}
