import React, { useRef, useMemo } from 'react';
import { useFrame } from '../../three/fiber';
import * as THREE from 'three';

/**
 * Dynamic 3D fluid mesh with surface meniscus and smooth RGB color interpolation.
 * Optimized for instant frame-0 mounting and 60 FPS performance.
 */
export default function Fluid3D({
  color = '#4A90E2',
  radiusTop = 0.38,
  radiusBottom = 0.38,
  height = 0.6,
  position = [0, 0, 0],
  opacity = 0.85,
  roughness = 0.1,
  metalness = 0.05,
  waveAmplitude = 0.015,
}) {
  const meshRef = useRef();
  const topDiskRef = useRef();
  const materialRef = useRef();
  const currentClr = useRef(new THREE.Color(color));
  const targetClr = useMemo(() => new THREE.Color(color), [color]);
  const timeRef = useRef(0);

  const effectiveHeight = Math.max(0.01, height);
  const posY = position[1] + effectiveHeight / 2;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (materialRef.current) {
      currentClr.current.lerp(targetClr, Math.min(1.0, delta * 5.0));
      materialRef.current.color.copy(currentClr.current);
    }

    if (topDiskRef.current && waveAmplitude > 0) {
      const t = timeRef.current;
      topDiskRef.current.position.y =
        effectiveHeight / 2 + Math.sin(t * 3.2) * waveAmplitude * 0.3;
      topDiskRef.current.rotation.z = Math.sin(t * 2.1) * 0.02;
    }
  });

  return (
    <group position={[position[0], posY, position[2]]}>
      {/* Liquid Column Body */}
      <mesh ref={meshRef}>
        <cylinderGeometry
          args={[radiusTop, radiusBottom, effectiveHeight, 32, 1, false]}
        />
        <meshStandardMaterial
          ref={materialRef}
          color={currentClr.current}
          transparent
          opacity={opacity}
          roughness={roughness}
          metalness={metalness}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Top Surface Meniscus */}
      <group ref={topDiskRef} position={[0, effectiveHeight / 2, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radiusTop, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={Math.min(0.95, opacity + 0.08)}
            roughness={0.08}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <ringGeometry args={[radiusTop * 0.88, radiusTop, 32]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
