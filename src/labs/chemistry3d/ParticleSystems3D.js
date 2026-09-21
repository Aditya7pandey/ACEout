import React, { useRef, useMemo } from 'react';
import { useFrame } from '../../three/fiber';
import * as THREE from 'three';

/**
 * High-performance 3D Particle Systems for real-time chemistry simulations:
 * Fixed buffer allocations to guarantee 60 FPS and prevent WebGL context loss.
 */

export function PouringStream3D({
  active = false,
  startPos = [0, 1.2, 0],
  endPos = [0, 0.4, 0],
  color = '#4A90E2',
  count = 24,
  flowSpeed = 2.4,
}) {
  const pointsRef = useRef();

  const [positions, offsets, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offs = new Float32Array(count);
    const spds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      offs[i] = i / count;
      spds[i] = flowSpeed * (0.85 + Math.random() * 0.3);
      pos[i * 3] = startPos[0];
      pos[i * 3 + 1] = startPos[1];
      pos[i * 3 + 2] = startPos[2];
    }
    return [pos, offs, spds];
  }, [count, flowSpeed]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const arr = posAttr.array;

    for (let i = 0; i < count; i++) {
      offsets[i] = (offsets[i] + delta * speeds[i]) % 1.0;
      const t = offsets[i];

      const x = startPos[0] + (endPos[0] - startPos[0]) * t;
      const z = startPos[2] + (endPos[2] - startPos[2]) * t;
      const y =
        startPos[1] + (endPos[1] - startPos[1]) * t - 0.22 * Math.sin(t * Math.PI);

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.85}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export function EffervescenceBubbles3D({
  active = true,
  intensity = 1.0,
  liquidBase = [0, 0, 0],
  liquidRadius = 0.35,
  liquidHeight = 0.55,
  color = '#FFFFFF',
}) {
  const pointsRef = useRef();
  const count = 30; // Fixed count for rock-solid memory stability
  const timeRef = useRef(0);

  const [positions, offsets, speeds, radii, phs] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offs = new Float32Array(count);
    const spds = new Float32Array(count);
    const rads = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      offs[i] = Math.random();
      spds[i] = 0.35 + Math.random() * 0.45;
      rads[i] = Math.sqrt(Math.random()) * liquidRadius * 0.85;
      phases[i] = Math.random() * Math.PI * 2;

      pos[i * 3] = liquidBase[0];
      pos[i * 3 + 1] = liquidBase[1];
      pos[i * 3 + 2] = liquidBase[2];
    }
    return [pos, offs, spds, rads, phases];
  }, [liquidRadius, liquidBase]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !active || intensity <= 0) return;
    timeRef.current += delta;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const arr = posAttr.array;
    const t = timeRef.current;

    for (let i = 0; i < count; i++) {
      offsets[i] = (offsets[i] + delta * speeds[i] * intensity) % 1.0;
      const progress = offsets[i];
      const r = radii[i];
      const theta = phs[i] + Math.sin(t * 3 + i) * 0.2;

      arr[i * 3] = liquidBase[0] + r * Math.cos(theta);
      arr[i * 3 + 1] = liquidBase[1] + progress * liquidHeight;
      arr[i * 3 + 2] = liquidBase[2] + r * Math.sin(theta);
    }
    posAttr.needsUpdate = true;
  });

  if (!active || intensity <= 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={color}
        transparent
        opacity={0.7}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export function ThermalVaporSmoke3D({
  active = false,
  origin = [0, 0.6, 0],
  radius = 0.3,
  temperature = 25,
}) {
  const pointsRef = useRef();
  const count = 18;
  const timeRef = useRef(0);

  const isSteamVisible = active && temperature > 35;
  const tempScale = Math.min(2.0, Math.max(0.2, (temperature - 30) / 30));

  const [positions, offsets, speeds, spread] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offs = new Float32Array(count);
    const spds = new Float32Array(count);
    const sprd = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      offs[i] = Math.random();
      spds[i] = 0.2 + Math.random() * 0.3;
      sprd[i * 2] = (Math.random() - 0.5) * radius * 1.4;
      sprd[i * 2 + 1] = (Math.random() - 0.5) * radius * 1.4;

      pos[i * 3] = origin[0];
      pos[i * 3 + 1] = origin[1];
      pos[i * 3 + 2] = origin[2];
    }
    return [pos, offs, spds, sprd];
  }, [radius, origin]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !isSteamVisible) return;
    timeRef.current += delta;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const arr = posAttr.array;
    const t = timeRef.current;

    for (let i = 0; i < count; i++) {
      offsets[i] = (offsets[i] + delta * speeds[i] * tempScale) % 1.0;
      const progress = offsets[i];
      const expansion = 1.0 + progress * 2.0;

      arr[i * 3] = origin[0] + spread[i * 2] * expansion + Math.sin(t * 2 + i) * 0.03;
      arr[i * 3 + 1] = origin[1] + progress * 0.85;
      arr[i * 3 + 2] = origin[2] + spread[i * 2 + 1] * expansion + Math.cos(t * 2 + i) * 0.03;
    }
    posAttr.needsUpdate = true;
  });

  if (!isSteamVisible) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#FFFFFF"
        transparent
        opacity={0.4 * Math.min(1.0, tempScale)}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
