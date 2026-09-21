import React, { useRef } from 'react';
import { useFrame } from '../../three/fiber';
import * as THREE from 'three';
import { GlassMaterial } from './Glassware3D';

/**
 * 3D pH paper test strip with capillary wetted color change and
 * 3D glass pH/temperature electrode probe.
 */

export function PhPaperStrip3D({
  position = [-0.65, 0.45, 0],
  isDipped = false,
  dipColor = '#B23428', // Color corresponding to pH
  length = 0.7,
  width = 0.12,
  thickness = 0.01,
}) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Smooth dipping motion downward when dipped
    const targetY = isDipped ? position[1] - 0.28 : position[1];
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * Math.min(1.0, delta * 7);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Upper dry straw-colored paper handle */}
      <mesh position={[0, length * 0.28, 0]}>
        <boxGeometry args={[width, length * 0.55, thickness]} />
        <meshStandardMaterial color="#EFE8D3" roughness={0.9} />
      </mesh>

      {/* Lower wetted tip that reacts and changes color */}
      <mesh position={[0, -length * 0.22, 0]}>
        <boxGeometry args={[width, length * 0.45, thickness]} />
        <meshStandardMaterial
          color={isDipped ? dipColor : '#EFE8D3'}
          roughness={isDipped ? 0.4 : 0.9}
        />
      </mesh>
    </group>
  );
}

export function PhProbe3D({
  position = [0.65, 0.55, 0],
  isImmersed = true,
  bulbColor = '#2F8E6C',
}) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Smooth immersion motion
    const targetY = isImmersed ? position[1] - 0.32 : position[1];
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * Math.min(1.0, delta * 7);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Top Black Cable */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.35, 12]} />
        <meshStandardMaterial color="#1B1713" roughness={0.8} />
      </mesh>

      {/* Probe Handle Collar */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 16]} />
        <meshStandardMaterial color="#4A6572" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Glass Electrode Body Shaft */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.38, 16]} />
        <GlassMaterial opacity={0.45} color="#D8EEF8" />
      </mesh>

      {/* Internal Silver/AgCl Reference Wire */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.36, 8]} />
        <meshStandardMaterial color="#A9875A" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Glass Sensing Bulb Tip */}
      <mesh position={[0, -0.07, 0]}>
        <sphereGeometry args={[0.048, 20, 16]} />
        <meshStandardMaterial
          color={isImmersed ? bulbColor : '#5C9EAD'}
          roughness={0.2}
          metalness={0.1}
          emissive={isImmersed ? bulbColor : '#000000'}
          emissiveIntensity={isImmersed ? 0.35 : 0}
        />
      </mesh>
    </group>
  );
}
