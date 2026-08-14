import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SimulationCanvas({ progress }: { progress: number }) {
  const particlesRef = useRef<THREE.Points>(null);

  // Simple particle system that responds to progress
  const particleCount = 1000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

    // Greenish/Blueish tech particles
    colors[i * 3] = 0.0;
    colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
    colors[i * 3 + 2] = 0.5 + Math.random() * 0.5;
  }

  useFrame((state, delta) => {
    if (particlesRef.current) {
      // Flow particles rightwards based on progress
      particlesRef.current.position.x = progress * 10 - 5;
      particlesRef.current.rotation.y += delta * 0.1;
      
      // Shockwave effect around execution phase (progress ~0.5 - 0.6)
      if (progress > 0.45 && progress < 0.6) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
        particlesRef.current.scale.set(scale, scale, scale);
      } else {
        particlesRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
