"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const fragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uTexture;
varying vec2 vUv;

// Simple 2D noise function for liquid ripples
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
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
    
    // Sample original texture
    vec4 tex = texture2D(uTexture, uv);
    
    // Early exit for fully transparent pixels
    if (tex.a < 0.05) {
        gl_FragColor = tex;
        return;
    }
    
    // Calculate base luminance
    float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    
    // Calculate fake normals by taking gradient of luminance using small offsets
    vec2 offset = vec2(0.003, 0.003);
    float lumaRight = dot(texture2D(uTexture, uv + vec2(offset.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float lumaUp = dot(texture2D(uTexture, uv + vec2(0.0, offset.y)).rgb, vec3(0.299, 0.587, 0.114));
    
    // Create flowing liquid metal ripples using animated noise
    float ripple = noise(uv * 10.0 + vec2(uTime * 0.5, -uTime * 0.3));
    float ripple2 = noise(uv * 25.0 - vec2(uTime * 0.2, uTime * 0.4));
    
    // Construct dynamic normal vector (combining image geometry + flowing ripples)
    vec3 baseNormal = normalize(vec3(luma - lumaRight, luma - lumaUp, 0.05));
    vec3 rippleNormal = normalize(vec3(ripple - 0.5, ripple2 - 0.5, 1.0)) * 0.15;
    vec3 normal = normalize(baseNormal + rippleNormal);
    
    // Smooth mouse position for light direction
    vec3 lightDir = normalize(vec3(uMouse.x * 2.0, uMouse.y * 2.0 + 0.5, 1.0));
    
    // Calculate specular reflection (liquid metal shine)
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVector = normalize(lightDir + viewDir);
    float specPower = 40.0 + (ripple2 * 20.0); // Dynamic shininess
    float specular = pow(max(dot(normal, halfVector), 0.0), specPower);
    
    // Add refractive glass shift (chromatic aberration based on dynamic normal)
    vec2 refractOffset = normal.xy * (0.01 + length(uMouse) * 0.015);
    float r = texture2D(uTexture, uv + refractOffset).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - refractOffset).b;
    vec3 refractiveBase = vec3(r, g, b);
    
    // Blend original base with refractive base to keep some original color
    vec3 finalColor = mix(tex.rgb, refractiveBase, 0.65);
    
    // Create a soft, flowing internal glow with a fast 12 rhythm
    float rhythm = sin(uTime * 12.0) * 0.5 + 0.5;
    vec3 fluidGlowColor = vec3(0.7, 0.7, 0.75) * (0.6 + 0.4 * rhythm); // Soft silver-white pulsing
    
    // Inject the internal glow into the robot
    // It shines through the darker crevices (inverted luma) from the inside out
    float internalDepth = smoothstep(0.3, 0.9, 1.0 - luma);
    finalColor += fluidGlowColor * (internalDepth * 0.3);
    
    // Add metallic environment reflection (fake rim light)
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = smoothstep(0.5, 1.0, rim);
    
    // Combine base color, intense flowing specular highlights, and rim lighting
    vec3 metalHighlight = vec3(1.0, 1.0, 1.0) * specular * 2.5;
    vec3 rimHighlight = vec3(0.7, 0.9, 1.0) * rim * 1.2;
    
    finalColor = finalColor + metalHighlight + rimHighlight;
    
    gl_FragColor = vec4(finalColor, tex.a);
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
    const texture = useTexture('/embodied-humanoid-bg.png');
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uTexture: { value: texture },
        }),
        [texture]
    );

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

            // Smoothly interpolate mouse position for a fluid feel
            const targetX = state.pointer.x;
            const targetY = state.pointer.y;

            materialRef.current.uniforms.uMouse.value.x += (targetX - materialRef.current.uniforms.uMouse.value.x) * 0.05;
            materialRef.current.uniforms.uMouse.value.y += (targetY - materialRef.current.uniforms.uMouse.value.y) * 0.05;
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

export function EmbodiedHumanoidBgAnimation() {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-auto">
            <Canvas
                camera={{ position: [0, 0, 1], fov: 100 }}
                style={{ width: '100%', height: '100%' }}
                gl={{ alpha: true, antialias: false }}
            >
                {/* Scale increased to make the robot larger and more imposing, per request */}
                <mesh scale={[1.6, 2.8, 1]} position={[0, -0.25, 0]}>
                    <planeGeometry args={[1, 1]} />
                    <React.Suspense fallback={null}>
                        <AnimatedMaterial />
                    </React.Suspense>
                </mesh>
            </Canvas>
        </div>
    );
}
