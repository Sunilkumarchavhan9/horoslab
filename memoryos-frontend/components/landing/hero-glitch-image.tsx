"use client";

import React, { useEffect, useRef, useState } from "react";

interface HeroGlitchImageProps {
  src: string;
  className?: string;
  alt?: string;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    v_uv.y = 1.0 - v_uv.y; // Flip Y for WebGL texture
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_image;
  uniform float u_time;

  // Simple pseudo-random hash
  float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
  }

  // 2D Value Noise
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Fractional Brownian Motion (FBM) for turbulence
  float fbm(vec2 st) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      // Rotate to reduce axial bias
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
      for (int i = 0; i < 4; ++i) {
          v += a * noise(st);
          st = rot * st * 2.0 + shift;
          a *= 0.5;
      }
      return v;
  }

  void main() {
      vec2 uv = v_uv;
      float t = u_time * 0.8; // Animation speed
      
      // 1. Temperature Field (Mask)
      // Heat source is the GPU exhaust (approx y = 0.65). 
      // Heat rises upwards towards y = 0.0
      float heatBaseY = 0.65;
      
      // Calculate height above the exhaust (0.0 at exhaust, increasing upwards)
      float rise = max(0.0, heatBaseY - uv.y);
      
      // Plume expands horizontally as it rises and disperses
      float expansion = 1.0 + rise * 2.5;
      
      // X bounds: center is ~0.5. Width at base is ~0.16.
      float xDist = abs(uv.x - 0.5);
      float maskX = 1.0 - smoothstep(0.04 * expansion, 0.12 * expansion, xDist);
      
      // Y bounds & Dissipation
      // Fades completely as it hits the top (y=0.1)
      float dissipation = smoothstep(0.1, 0.65, uv.y);
      // Hard cut-off at the bottom so heat doesn't flow down
      float maskY = smoothstep(0.75, 0.65, uv.y);
      
      // Structural field dictating where heat exists
      float temperatureField = maskX * maskY * dissipation;

      // 2. Noise-driven Velocity & Volumetric Density
      // Heat flows UP (decreasing Y), so we animate noise UV downwards
      vec2 noiseUV = uv * vec2(12.0, 8.0);
      noiseUV.y += t * 2.5;
      
      // Add curl/turbulence by offsetting the lookup with another noise
      vec2 curlOffset = vec2(noise(noiseUV + vec2(100.0)), noise(noiseUV + vec2(200.0))) * 0.4;
      float n = fbm(noiseUV + curlOffset);
      
      // Map noise to -1 to 1 and mask it with the temperature field
      float density = (n * 2.0 - 1.0) * temperatureField;

      // 3. Heat Distortion (Screen-space Refraction)
      // Distortion strength fades naturally with dissipation
      float distortionStrength = 0.02 * dissipation;
      
      vec2 distortedUV = uv + vec2(density, density * 0.5) * distortionStrength;
      distortedUV = clamp(distortedUV, 0.0, 1.0);
      
      // Render the physically distorted background
      vec4 color = texture2D(u_image, distortedUV);

      // 4. Subtle Thermal Glow in the Plume
      // Glow is strongest at the exhaust and fades as it rises
      float glowIntensity = smoothstep(0.1, heatBaseY, uv.y); 
      float glowMask = maskX * maskY * glowIntensity;
      
      // Deep orange/red heat color driven by the same turbulence noise
      vec3 glowColor = vec3(1.2, 0.35, 0.0) * (n * 0.6 + 0.4) * 0.7;
      
      float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      
      // Additive blending for the heat glow
      color.rgb += glowColor * glowMask * smoothstep(0.05, 0.9, luma) * 1.8;

      gl_FragColor = vec4(color.rgb, color.a);
  }
`;

export function HeroGlitchImage({ src, className, alt }: HeroGlitchImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) {
      console.warn("WebGL not supported");
      return;
    }

    let animationFrameId: number;
    let texture: WebGLTexture | null = null;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Set canvas internal resolution to match image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      setIsLoaded(true);

      // Compile Shaders
      const compileShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error("Shader compile error:", gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      const program = gl.createProgram();
      if (!program || !vs || !fs) return;

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Setup Geometry (Fullscreen Quad)
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1.0, -1.0,
           1.0, -1.0,
          -1.0,  1.0,
          -1.0,  1.0,
           1.0, -1.0,
           1.0,  1.0,
        ]),
        gl.STATIC_DRAW
      );

      const positionLocation = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Setup Texture
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      // Uniforms
      const timeLoc = gl.getUniformLocation(program, "u_time");
      const resLoc = gl.getUniformLocation(program, "u_resolution");
      
      const startTime = performance.now();

      const render = (time: number) => {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform1f(timeLoc, (time - startTime) / 1000.0);
        gl.uniform2f(resLoc, gl.drawingBufferWidth, gl.drawingBufferHeight);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationFrameId = requestAnimationFrame(render);
      };
      
      render(performance.now());
    };

    img.src = src;

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (texture) gl.deleteTexture(texture);
    };
  }, [src]);

  return (
    <div className={`relative ${className || ""}`}>
      {/* Fallback image provides intrinsic aspect ratio until canvas takes over or if canvas fails */}
      <img
        src={src}
        alt={alt || ""}
        className={`w-full h-auto max-h-[85vh] object-cover object-center block transition-opacity duration-500 ${isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100 relative z-10'}`}
      />
      <canvas
        ref={canvasRef}
        aria-label={alt}
        className={`w-full h-auto max-h-[85vh] object-cover object-center block transition-opacity duration-500 ${isLoaded ? 'opacity-100 relative z-20' : 'opacity-0 absolute inset-0'}`}
      />
    </div>
  );
}
