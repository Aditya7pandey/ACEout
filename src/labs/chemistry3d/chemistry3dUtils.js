import * as THREE from 'three';

/**
 * Spatial, mathematical, and color utilities for 3D Chemistry Laboratories.
 */

// Clamping utility
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Linearly interpolates two RGB hex colors or Three.Color objects smoothly.
 */
export function lerpHexColor(fromHex, toHex, alpha) {
  const c1 = new THREE.Color(fromHex);
  const c2 = new THREE.Color(toHex);
  c1.lerp(c2, clamp(alpha, 0, 1));
  return '#' + c1.getHexString();
}

/**
 * Calculates liquid cylinder height from volume in mL and container radius.
 * e.g., 250mL beaker has radius ~0.035m (3.5cm) in world units.
 */
export function computeLiquidHeight({
  volumeMl,
  maxVolumeMl = 250,
  maxHeight = 0.8,
  minHeight = 0.05,
}) {
  if (!volumeMl || volumeMl <= 0) return 0;
  const ratio = clamp(volumeMl / maxVolumeMl, 0, 1);
  return minHeight + (maxHeight - minHeight) * ratio;
}

/**
 * Checks if container tilt angle exceeds pouring threshold (> 45° or > 0.785 rad).
 */
export function isPouringAngle(rotationEuler, thresholdRad = Math.PI / 4) {
  if (!rotationEuler) return false;
  const tilt = Math.sqrt(
    (rotationEuler.x || 0) ** 2 + (rotationEuler.z || 0) ** 2
  );
  return tilt >= thresholdRad;
}

/**
 * Simple 3D AABB bounding collision check between dipping object (strip/probe)
 * and liquid surface.
 */
export function checkLiquidCollision(probePos, liquidPos, liquidRadius, liquidTopY) {
  if (!probePos || !liquidPos) return { isColliding: false, immersionDepth: 0 };
  
  const dx = probePos.x - liquidPos.x;
  const dz = probePos.z - liquidPos.z;
  const horizDistSq = dx * dx + dz * dz;

  const isInsideRadius = horizDistSq <= liquidRadius * liquidRadius;
  const isSubmerged = probePos.y <= liquidTopY;
  const immersionDepth = isSubmerged ? Math.max(0, liquidTopY - probePos.y) : 0;

  return {
    isColliding: isInsideRadius && isSubmerged,
    immersionDepth,
  };
}

/**
 * Standard studio lighting configuration for realistic lab glassware.
 */
export const STUDIO_LIGHTS = {
  ambientIntensity: 1.35,
  sunlightIntensity: 2.2,
  sunlightPosition: [2.5, 4.2, 2.0],
  sunlightColor: '#FFF8EE',
  fillIntensity: 0.75,
  fillPosition: [-3.0, 2.0, -1.8],
  fillColor: '#D2E3F8',
  rimIntensity: 0.9,
  rimPosition: [0, -1.5, -3.0],
  rimColor: '#E8DED1',
};
