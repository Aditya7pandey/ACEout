import React, { useRef } from 'react';
import { useFrame } from '../../three/fiber';
import * as THREE from 'three';

/**
 * 3D Bunsen Burner Apparatus with animated dual-cone flame and thermal heating.
 */
export default function BunsenBurner3D({
  active = false,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  onToggle,
}) {
  const innerFlameRef = useRef();
  const outerFlameRef = useRef();
  const flameLightRef = useRef();

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.getElapsedTime();

    // Natural flame flicker animation
    const flicker = 1.0 + Math.sin(t * 18) * 0.08 + Math.cos(t * 27) * 0.05;
    const waveX = Math.sin(t * 12) * 0.015;
    const waveZ = Math.cos(t * 14) * 0.015;

    if (innerFlameRef.current) {
      innerFlameRef.current.scale.set(1.0 + waveX, flicker, 1.0 + waveZ);
    }
    if (outerFlameRef.current) {
      outerFlameRef.current.scale.set(1.0 + waveX * 1.5, flicker * 1.05, 1.0 + waveZ * 1.5);
    }
    if (flameLightRef.current) {
      flameLightRef.current.intensity = 1.4 * flicker;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Heavy Cast Iron Base */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.08, 24]} />
        <meshStandardMaterial color="#2B2D2F" roughness={0.7} metalness={0.8} />
      </mesh>

      {/* Gas inlet horizontal nozzle */}
      <mesh position={[0.18, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.16, 12]} />
        <meshStandardMaterial color="#96662F" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Air Control Collar */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.06, 16]} />
        <meshStandardMaterial color="#C5A880" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Vertical Brass / Chrome Chimney Barrel */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.34, 16]} />
        <meshStandardMaterial color="#A0A5AA" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Animated Dual-Cone Flame */}
      {active && (
        <group position={[0, 0.5, 0]}>
          {/* Outer Warm Flame Mantle */}
          <mesh ref={outerFlameRef} position={[0, 0.18, 0]}>
            <coneGeometry args={[0.08, 0.36, 16, 1, true]} />
            <meshBasicMaterial
              color="#4A90E2"
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Inner Hot Blue Cone Core */}
          <mesh ref={innerFlameRef} position={[0, 0.09, 0]}>
            <coneGeometry args={[0.045, 0.18, 16, 1, true]} />
            <meshBasicMaterial
              color="#00D2FF"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Flame Light Emission */}
          <pointLight
            ref={flameLightRef}
            color="#64B5F6"
            intensity={1.4}
            distance={2.5}
            position={[0, 0.2, 0]}
          />
        </group>
      )}
    </group>
  );
}
