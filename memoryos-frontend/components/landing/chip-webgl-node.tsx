"use client";

import React, { useEffect, useRef, useState } from "react";

interface ChipWebGLNodeProps {
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

  // Ultimate Hash for 3D Noise
  vec3 hash33(vec3 p) {
      p = fract(p * vec3(443.8975, 397.2973, 491.1871));
      p += dot(p, p.yxz + 19.19);
      return fract((p.xxy + p.yxx) * p.zyx);
  }

  // 3D Cellular / Voronoi Noise (Simulates silicon micro-crystalline structures)
  float voronoi(vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      float res = 100.0;
      for (int k = -1; k <= 1; k++) {
          for (int j = -1; j <= 1; j++) {
              for (int i = -1; i <= 1; i++) {
                  vec3 b = vec3(float(i), float(j), float(k));
                  vec3 r = vec3(b) - f + hash33(p + b);
                  float d = dot(r, r);
                  if (d < res) res = d;
              }
          }
      }
      return sqrt(res);
  }

  void main() {
      vec2 uv = v_uv;
      float t = u_time * 0.3; // Slow, majestic volumetric rotation
      
      vec4 baseColor = texture2D(u_image, uv);
      
      // Calculate luminance to isolate the pure dark silicon window
      float luma = dot(baseColor.rgb, vec3(0.299, 0.587, 0.114));
      float siliconMask = smoothstep(0.3, 0.0, luma);
      
      // --- VOLUMETRIC 3D CRYSTAL LATTICE ---
      // We simulate looking "into" the silicon depth using raymarching parallax
      vec3 rayDir = normalize(vec3((uv - 0.5) * 2.0, 1.5)); // Fake 3D camera ray
      vec3 pos = vec3(uv * 5.0, t * 0.8); // Move forward through the crystal time-space
      
      float crystal = 0.0;
      float weight = 0.5;
      
      // 3 Layers of volumetric depth
      for(int i = 0; i < 3; i++) {
          crystal += weight * voronoi(pos);
          pos += rayDir * 2.5; // Step deeper into the physical silicon
          pos.z += t * 0.4;
          weight *= 0.5;
      }
      
      // Invert the voronoi so the crystal edges glow like burning plasma veins
      float plasmaVeins = 1.0 - smoothstep(0.1, 0.6, crystal);
      plasmaVeins = pow(plasmaVeins, 2.5); // Sharpen the immense heat
      
      // Radiant energy colors (HOROS Green converging into Deep Space Azure)
      vec3 veinColor = mix(vec3(0.0, 0.6, 1.0), vec3(0.5, 1.0, 0.0), plasmaVeins * 1.5);
      vec3 godTierEnergy = veinColor * plasmaVeins * 3.0;
      
      // --- CHROMATIC ENERGY SURGE ---
      // Random high-energy bursts that physically split the light spectrum on the lens
      float surge = step(0.96, fract(sin(t * 20.0) * 43758.5453));
      vec2 glitchOffset = vec2(surge * 0.03 * sin(uv.y * 30.0), 0.0);
      
      vec3 surgeColor = vec3(0.0);
      surgeColor.r = texture2D(u_image, uv + glitchOffset).r;
      surgeColor.g = baseColor.g;
      surgeColor.b = texture2D(u_image, uv - glitchOffset).b;
      
      // Intense white/blue quantum heat burst during a surge
      vec3 surgeHeat = vec3(0.8, 0.9, 1.0) * surge * siliconMask * 0.8;
      
      // --- MASTER COMPOSITE ---
      // Apply the glowing 3D crystal lattice deep inside the dark silicon
      vec3 finalColor = surgeColor + (godTierEnergy * siliconMask) + surgeHeat;
      
      // HDR Tonemapping (Reinhard) to gracefully handle ultra-bright glowing pixels
      finalColor = finalColor / (1.0 + finalColor * 0.5); 
      finalColor = pow(finalColor, vec3(1.0 / 1.1)); // Subtle Gamma pop

      gl_FragColor = vec4(finalColor, baseColor.a);
  }
`;

export function ChipWebGLNode({ src, className, alt }: ChipWebGLNodeProps) {
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
      canvas.width = img.width;
      canvas.height = img.height;
      gl.viewport(0, 0, img.width, img.height);

      // Compile Shader
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
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);

      // Set up quad
      const positions = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Set up texture
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // Support non-power-of-2 images
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      const timeLocation = gl.getUniformLocation(program, "u_time");
      const startTime = performance.now();

      setIsLoaded(true);

      const render = (now: number) => {
        const time = (now - startTime) * 0.001;
        gl.uniform1f(timeLocation, time);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);
    };

    img.src = src;

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (texture) gl.deleteTexture(texture);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-1000`}
      style={{ display: "block" }}
      title={alt}
    />
  );
}
