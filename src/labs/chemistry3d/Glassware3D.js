import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Procedural 3D Laboratory Glassware with high-performance glass material,
 * graduation markings, spouts, and lips.
 */

export function GlassMaterial({ opacity = 0.32, color = '#E6F3FA', roughness = 0.08 }) {
  return (
    <meshStandardMaterial
      color={color}
      transparent
      opacity={opacity}
      roughness={roughness}
      metalness={0.15}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );
}

/**
 * Standard 250 mL Laboratory Glass Beaker
 */
export function Beaker3D({
  radius = 0.42,
  height = 0.95,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  showGraduations = true,
  children,
}) {
  const gradLines = useMemo(() => {
    if (!showGraduations) return [];
    return [0.22, 0.42, 0.62, 0.82];
  }, [showGraduations]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Cylindrical Glass Wall */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 0.98, height, 32, 1, true]} />
        <GlassMaterial opacity={0.28} />
      </mesh>

      {/* Flat Bottom */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.98, 32]} />
        <GlassMaterial opacity={0.45} />
      </mesh>

      {/* Thick Rolled Glass Lip / Rim */}
      <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.018, 10, 32]} />
        <GlassMaterial opacity={0.6} />
      </mesh>

      {/* Pouring Spout protrusion */}
      <mesh position={[-radius * 0.92, height, 0]} rotation={[0, 0, Math.PI / 6]}>
        <coneGeometry args={[0.06, 0.1, 10, 1, true]} />
        <GlassMaterial opacity={0.5} />
      </mesh>

      {/* Graduation Marks on Beaker Wall */}
      {gradLines.map((yMark, idx) => (
        <group key={idx} position={[radius * 0.98, yMark, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.08 + (idx % 2 === 1 ? 0.04 : 0), 0.008]} />
            <meshBasicMaterial
              color="#4A6572"
              transparent
              opacity={0.65}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {children}
    </group>
  );
}

/**
 * Standard Chemistry Test Tube with rounded hemispherical bottom
 */
export function TestTube3D({
  radius = 0.14,
  height = 1.1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  children,
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Cylindrical Wall */}
      <mesh position={[0, height / 2 + radius, 0]}>
        <cylinderGeometry args={[radius, radius, height, 20, 1, true]} />
        <GlassMaterial opacity={0.3} />
      </mesh>

      {/* Hemispherical Bottom */}
      <mesh position={[0, radius, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[radius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <GlassMaterial opacity={0.45} />
      </mesh>

      {/* Rolled Lip Rim */}
      <mesh position={[0, height + radius, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.014, 8, 20]} />
        <GlassMaterial opacity={0.55} />
      </mesh>

      {children}
    </group>
  );
}

/**
 * Conical Erlenmeyer Flask
 */
export function ConicalFlask3D({
  radiusBase = 0.46,
  radiusTop = 0.16,
  bodyHeight = 0.75,
  neckHeight = 0.35,
  position = [0, 0, 0],
  children,
}) {
  const totalHeight = bodyHeight + neckHeight;

  return (
    <group position={position}>
      {/* Conical Lower Body */}
      <mesh position={[0, bodyHeight / 2, 0]}>
        <cylinderGeometry args={[radiusTop, radiusBase, bodyHeight, 28, 1, true]} />
        <GlassMaterial opacity={0.28} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radiusBase, 28]} />
        <GlassMaterial opacity={0.45} />
      </mesh>

      {/* Narrow Cylindrical Neck */}
      <mesh position={[0, bodyHeight + neckHeight / 2, 0]}>
        <cylinderGeometry args={[radiusTop, radiusTop, neckHeight, 24, 1, true]} />
        <GlassMaterial opacity={0.3} />
      </mesh>

      {/* Flared Lip Rim */}
      <mesh position={[0, totalHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radiusTop * 1.1, 0.016, 8, 24]} />
        <GlassMaterial opacity={0.6} />
      </mesh>

      {children}
    </group>
  );
}

/**
 * 3D Dropper Pipette with rubber teat bulb
 */
export function DropperPipette3D({
  position = [0, 1.2, 0],
  rotation = [0, 0, 0],
  bulbColor = '#B23428',
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Glass Pipette Tube */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.56, 14]} />
        <GlassMaterial opacity={0.38} />
      </mesh>

      {/* Narrow Tapered Glass Tip */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.04, 0.015, 0.16, 14]} />
        <GlassMaterial opacity={0.48} />
      </mesh>

      {/* Rubber Bulb / Teat */}
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.09, 16, 14]} />
        <meshStandardMaterial color={bulbColor} roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  );
}

/**
 * Varnished Wooden Test Tube Stand / Rack
 */
export function TestTubeRack3D({
  numSlots = 5,
  slotSpacing = 0.44,
  position = [0, 0, 0],
}) {
  const totalLength = (numSlots + 0.6) * slotSpacing;

  return (
    <group position={position}>
      {/* Base Board */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[totalLength, 0.08, 0.48]} />
        <meshStandardMaterial color="#C5A880" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Upper Support Beam with Holes */}
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[totalLength, 0.06, 0.48]} />
        <meshStandardMaterial color="#BA996E" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Side Wooden Pillars */}
      <mesh position={[-totalLength / 2 + 0.06, 0.36, 0]}>
        <boxGeometry args={[0.08, 0.64, 0.44]} />
        <meshStandardMaterial color="#A9875A" roughness={0.8} />
      </mesh>
      <mesh position={[totalLength / 2 - 0.06, 0.36, 0]}>
        <boxGeometry args={[0.08, 0.64, 0.44]} />
        <meshStandardMaterial color="#A9875A" roughness={0.8} />
      </mesh>
    </group>
  );
}
