import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable } from 'react-native';
import { Canvas, useFrame, useThree } from '../../three/fiber';
import * as THREE from 'three';
import { color, font, radius } from '../../theme';
import { clamp, STUDIO_LIGHTS } from './chemistry3dUtils';

/**
 * SceneBoundary catches rendering exceptions within Three/R3F
 * and displays an actionable error without crashing the lab screen.
 */
class SceneBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

/**
 * CameraRig smoothly positions camera based on spherical coordinates
 */
function CameraRig({ orbit, target = [0, 0.45, 0] }) {
  const { camera } = useThree();
  const targetVec = useMemo(() => new THREE.Vector3(...target), [target]);

  useFrame(() => {
    const { az, el, dist } = orbit;
    camera.position.set(
      targetVec.x + dist * Math.cos(el) * Math.sin(az),
      targetVec.y + dist * Math.sin(el),
      targetVec.z + dist * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(targetVec);
  });
  return null;
}

/**
 * Studio Lab Workbench with warm surface and soft perspective grid.
 */
function WorkbenchSurface() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#EAE2D2" roughness={0.92} metalness={0.05} />
      </mesh>
      <gridHelper args={[8, 32, '#C4B59D', '#D9CEBD']} position={[0, 0.001, 0]} />
    </group>
  );
}

/**
 * Common 3D Chemistry Viewport Container with OrbitControls, Camera Anchors,
 * Studio Lighting, and Workbench.
 * Mounts immediately without delay.
 */
export default function ChemistryStage({
  children,
  height = 245,
  initialOrbit = { az: -0.25, el: 0.38, dist: 2.5 },
  target = [0, 0.42, 0],
  overlay = null,
  onDragMove = null,
}) {
  const [orbitLocked, setOrbitLocked] = useState(false);
  const [orbit, setOrbit] = useState(initialOrbit);
  const orbitRef = useRef(orbit);
  orbitRef.current = orbit;
  const startRef = useRef({ az: 0, el: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        startRef.current = { az: orbitRef.current.az, el: orbitRef.current.el };
      },
      onPanResponderMove: (_, g) => {
        if (onDragMove) {
          onDragMove(g);
        }
        if (orbitLocked) return;
        setOrbit((o) => ({
          ...o,
          az: startRef.current.az - g.dx * 0.006,
          el: clamp(startRef.current.el + g.dy * 0.005, -0.05, 1.35),
        }));
      },
    })
  ).current;

  // UI Camera Anchors
  const zoom = useCallback((delta) => {
    setOrbit((o) => ({ ...o, dist: clamp(o.dist + delta, 1.2, 4.2) }));
  }, []);

  const resetView = useCallback(() => {
    setOrbit(initialOrbit);
  }, [initialOrbit]);

  const snapToWorkbench = useCallback((preset) => {
    if (preset === 'top') {
      setOrbit({ az: 0, el: 1.32, dist: 2.3 });
    } else if (preset === 'front') {
      setOrbit({ az: 0, el: 0.15, dist: 2.2 });
    } else {
      setOrbit(initialOrbit);
    }
  }, [initialOrbit]);

  return (
    <View style={[styles.stage, { height }]}>
      <SceneBoundary
        fallback={(error) => (
          <View style={styles.errorWrap}>
            <Text style={styles.errorTitle}>3D Bench Failed to Draw</Text>
            <Text style={styles.errorDetail}>{String(error?.message || error)}</Text>
          </View>
        )}
      >
        <Canvas
          style={StyleSheet.absoluteFill}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 42, near: 0.05, far: 60 }}
          onCreated={(state) => {
            state.gl.setClearColor('#F5EFE4');
          }}
        >
          <CameraRig orbit={orbit} target={target} />

          {/* Studio Lighting System */}
          <ambientLight intensity={STUDIO_LIGHTS.ambientIntensity} />
          <directionalLight
            position={STUDIO_LIGHTS.sunlightPosition}
            intensity={STUDIO_LIGHTS.sunlightIntensity}
            color={STUDIO_LIGHTS.sunlightColor}
          />
          <directionalLight
            position={STUDIO_LIGHTS.fillPosition}
            intensity={STUDIO_LIGHTS.fillIntensity}
            color={STUDIO_LIGHTS.fillColor}
          />
          <pointLight
            position={STUDIO_LIGHTS.rimPosition}
            intensity={STUDIO_LIGHTS.rimIntensity}
            color={STUDIO_LIGHTS.rimColor}
          />

          <WorkbenchSurface />
          {children}
        </Canvas>
      </SceneBoundary>

      {/* Spatial Touch/Pointer Interceptor */}
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} pointerEvents="box-only" />

      {/* Floating UI overlay / Telemetry HUD */}
      {overlay}

      {/* Camera Navigation Floating Anchors */}
      <View style={styles.hudButtons} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [styles.hudBtn, pressed && { opacity: 0.7 }]}
          onPress={() => zoom(-0.35)}
        >
          <Text style={styles.hudGlyph}>＋</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.hudBtn, pressed && { opacity: 0.7 }]}
          onPress={() => zoom(0.35)}
        >
          <Text style={styles.hudGlyph}>－</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.hudBtn, pressed && { opacity: 0.7 }]}
          onPress={resetView}
        >
          <Text style={styles.hudGlyph}>⟲</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.hudBtn,
            orbitLocked && styles.hudBtnActive,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => setOrbitLocked((l) => !l)}
        >
          <Text style={styles.hudGlyphSmall}>{orbitLocked ? '🔒' : '🔓'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.hudBtn, pressed && { opacity: 0.7 }]}
          onPress={() => snapToWorkbench('front')}
        >
          <Text style={styles.hudGlyphSmall}>⊡</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    backgroundColor: '#F5EFE4',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
  },
  hudButtons: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: 4,
    alignItems: 'center',
    zIndex: 20,
  },
  hudBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  hudBtnActive: {
    backgroundColor: 'rgba(150, 102, 47, 0.18)',
    borderColor: color.brass,
  },
  hudGlyph: {
    fontFamily: font.bold,
    fontSize: 13,
    color: color.inkStrong,
    lineHeight: 15,
  },
  hudGlyphSmall: {
    fontSize: 10,
    color: color.inkStrong,
  },
  errorWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAF5EE',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontFamily: font.bold,
    fontSize: 13,
    color: color.red,
  },
  errorDetail: {
    fontFamily: font.regular,
    fontSize: 10.5,
    color: color.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
