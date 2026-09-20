import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable, Platform } from 'react-native';
import { Canvas, useFrame, useThree } from '../../three/fiber';
import * as THREE from 'three';
import { color, font } from '../../theme';
import { step, initialState, surfaceOf } from './physics';

const DEG = Math.PI / 180;

/**
 * Anything three.js throws inside the canvas is rethrown by r3f into the React
 * tree. Without a boundary that takes down the whole lab screen; with one we
 * can put the actual message on the bench where it can be read off a phone.
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
 * The bench. A wooden wedge, a block, a release mark and a finish gate.
 *
 * The simulation is integrated here inside the render loop and written into a
 * shared ref, so the block moves in real time and the student can time it with
 * a stopwatch like they would in a school lab. Nothing about the motion is
 * scripted or eased — it is the equation of motion, stepped.
 */
export default function InclineScene({
  params,
  simRef,
  onCrossGate,
  onSettle,
  showTrajectory,
  height = 280,
}) {
  /**
   * r3f builds its renderer only once it has measured a non-zero container,
   * and if that measurement never arrives the canvas stays blank with nothing
   * in the logs. Rather than depend on r3f discovering its own size, we wait
   * for RN's own onLayout and hand the Canvas explicit pixel dimensions.
   */
  const [box, setBox] = useState(null);
  const onLayout = useCallback((e) => {
    const { width, height: h } = e.nativeEvent.layout;
    if (width < 1 || h < 1) return;
    setBox((prev) =>
      prev && Math.abs(prev.width - width) < 1 && Math.abs(prev.height - h) < 1
        ? prev
        : { width, height: h }
    );
  }, []);

  // Belt and braces: if onLayout never reports, mount anyway and let r3f
  // measure for itself. Waiting for our own measurement must never be able to
  // leave the bench emptier than it would have been without it.
  const [layoutTimedOut, setLayoutTimedOut] = useState(false);
  useEffect(() => {
    if (box) return undefined;
    const t = setTimeout(() => setLayoutTimedOut(true), 1500);
    return () => clearTimeout(t);
  }, [box]);
  const mountCanvas = !!box || layoutTimedOut;

  // Diagnostics: the GL context is created asynchronously by expo-gl, and if
  // it never arrives the canvas is simply blank with nothing in the logs.
  const [gl, setGl] = useState(null);
  const [stalled, setStalled] = useState(false);
  // Remounting the canvas forces expo-gl to ask for a fresh surface. Whether
  // that recovers a stalled bench is itself diagnostic.
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setGl(null);
    setStalled(false);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (gl || !mountCanvas) return undefined;
    const t = setTimeout(() => setStalled(true), 5000);
    return () => clearTimeout(t);
  }, [gl, mountCanvas]);
  const [orbit, setOrbit] = useState({ az: -0.62, el: 0.28, dist: 2.45 });
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
        setOrbit((o) => ({
          ...o,
          az: startRef.current.az - g.dx * 0.006,
          el: clamp(startRef.current.el + g.dy * 0.005, -0.12, 1.15),
        }));
      },
    })
  ).current;

  const zoom = useCallback((delta) => {
    setOrbit((o) => ({ ...o, dist: clamp(o.dist + delta, 1.3, 4.6) }));
  }, []);

  const reset = useCallback(() => setOrbit({ az: -0.62, el: 0.28, dist: 2.45 }), []);

  return (
    <View style={[styles.stage, { height }]} onLayout={onLayout}>
      {mountCanvas ? (
      <SceneBoundary
        key={attempt}
        fallback={(error) => (
          <SceneError
            title="The bench failed to draw"
            detail={String(error?.message || error)}
          />
        )}
      >
        <Canvas
          style={box ? { width: box.width, height: box.height } : undefined}
          gl={{ antialias: true }}
          camera={{ fov: 42, near: 0.05, far: 60 }}
          onCreated={(state) => {
            state.gl.setClearColor('#F3EBDC');
            setGl({
              w: Math.round(state.size?.width || 0),
              h: Math.round(state.size?.height || 0),
            });
          }}
        >
          <CameraRig orbit={orbit} params={params} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[2.4, 3.6, 2.2]} intensity={2.1} />
          <directionalLight position={[-3, 1.6, -2]} intensity={0.6} color="#BFD0F0" />

          <Bench />
          <Wedge params={params} />
          <Marks params={params} />
          <Block params={params} simRef={simRef} onCrossGate={onCrossGate} onSettle={onSettle} />
          {showTrajectory ? <ForceArrows params={params} simRef={simRef} /> : null}
        </Canvas>
      </SceneBoundary>
      ) : null}

      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} pointerEvents="box-only" />

      {!gl && stalled ? (
        <SceneError
          title="No GL context"
          detail={
            'expo-gl never handed back a drawing surface. If JS debugging is switched on in the ' +
            'dev menu, turn it off — GLView needs synchronous native calls and cannot run under ' +
            'a remote debugger.'
          }
          onRetry={retry}
        />
      ) : null}

      <View style={styles.hudTopLeft} pointerEvents="none">
        <Text style={styles.hudTitle}>
          INCLINED PLANE · θ = {params.thetaDeg.toFixed(1)}°
        </Text>
        <Text style={styles.hudSub}>
          {gl
            ? `${surfaceOf(params).label.toUpperCase()} · DRAG TO ORBIT`
            : 'STARTING THE RENDERER…'}
        </Text>
      </View>

      <View style={styles.hudButtons}>
        <Pressable style={styles.hudBtn} onPress={() => zoom(-0.35)}>
          <Text style={styles.hudGlyph}>＋</Text>
        </Pressable>
        <Pressable style={styles.hudBtn} onPress={() => zoom(0.35)}>
          <Text style={styles.hudGlyph}>－</Text>
        </Pressable>
        <Pressable style={styles.hudBtn} onPress={reset}>
          <Text style={styles.hudGlyph}>⟲</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** A readable failure, drawn over the bench instead of a silent blank box. */
function SceneError({ title, detail, onRetry }) {
  return (
    <View style={styles.errorWrap} pointerEvents={onRetry ? 'box-none' : 'none'}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorDetail}>{detail}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// --- scene pieces ----------------------------------------------------------

function CameraRig({ orbit, params }) {
  const { camera } = useThree();
  const target = useMemo(() => {
    const L = params.rampLengthM;
    const th = params.thetaDeg * DEG;
    return new THREE.Vector3((-L * Math.cos(th)) / 2, (L * Math.sin(th)) / 2 + 0.05, 0);
  }, [params.rampLengthM, params.thetaDeg]);

  useFrame(() => {
    const { az, el, dist } = orbit;
    camera.position.set(
      target.x + dist * Math.cos(el) * Math.sin(az),
      target.y + dist * Math.sin(el) + 0.25,
      target.z + dist * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(target);
  });
  return null;
}

function Bench() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, -0.002, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#E7DDCB" roughness={0.95} />
      </mesh>
      <gridHelper args={[7, 28, '#C9BCA4', '#DACFBB']} position={[-0.3, 0.001, 0]} />
    </group>
  );
}

/** The classic wooden wedge: right angle at the back, hypotenuse is the ramp. */
function Wedge({ params }) {
  const { rampLengthM: L, thetaDeg } = params;
  const th = thetaDeg * DEG;
  const width = 0.34;

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(-L * Math.cos(th), 0);
    shape.lineTo(-L * Math.cos(th), L * Math.sin(th));
    shape.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    geo.translate(0, 0, -width / 2);
    geo.computeVertexNormals();
    return geo;
  }, [L, th, width]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#C9A876" roughness={0.75} metalness={0.02} />
      </mesh>
      {/* the running surface, slightly proud so it reads as a separate face */}
      <mesh
        position={[
          (-L * Math.cos(th)) / 2 + Math.sin(th) * 0.004,
          (L * Math.sin(th)) / 2 + Math.cos(th) * 0.004,
          0,
        ]}
        rotation={[0, 0, -th]}
      >
        <boxGeometry args={[L, 0.008, width * 0.98]} />
        <meshStandardMaterial color={surfaceColor(params)} roughness={surfaceRoughness(params)} />
      </mesh>
    </group>
  );
}

function Marks({ params }) {
  const { rampLengthM: L, thetaDeg, trackM } = params;
  const th = thetaDeg * DEG;
  const width = 0.34;

  const at = (d) => {
    const top = new THREE.Vector3(-L * Math.cos(th), L * Math.sin(th), 0);
    return top.add(new THREE.Vector3(Math.cos(th) * d, -Math.sin(th) * d, 0));
  };

  const release = at(0.02);
  const gate = at(Math.min(trackM, L - 0.02));

  return (
    <group>
      <mesh position={[release.x, release.y + 0.006, 0]} rotation={[0, 0, -th]}>
        <boxGeometry args={[0.012, 0.006, width * 0.98]} />
        <meshStandardMaterial color={color.brass} />
      </mesh>
      {/* finish gate: two uprights the block runs between */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[gate.x, gate.y + 0.055, s * (width / 2 - 0.01)]}
          rotation={[0, 0, -th]}
        >
          <boxGeometry args={[0.012, 0.11, 0.016]} />
          <meshStandardMaterial color={color.green} />
        </mesh>
      ))}
      <mesh position={[gate.x, gate.y + 0.005, 0]} rotation={[0, 0, -th]}>
        <boxGeometry args={[0.01, 0.005, width * 0.98]} />
        <meshStandardMaterial color={color.green} />
      </mesh>
    </group>
  );
}

function Block({ params, simRef, onCrossGate, onSettle }) {
  const ref = useRef();
  const crossedRef = useRef(false);
  const settledRef = useRef(false);
  const size = useMemo(() => blockSize(params.massKg), [params.massKg]);

  useFrame((_, rawDelta) => {
    const sim = simRef.current;
    if (!ref.current || !sim) return;

    // A fresh release rewinds the clock to zero; clear the per-run latches
    // here rather than in the parent, so the gate can fire again.
    if (sim.state.t === 0) {
      crossedRef.current = false;
      settledRef.current = false;
    }

    if (sim.running) {
      // Fixed sub-steps keep the integration stable no matter the frame rate.
      const delta = Math.min(rawDelta, 0.05);
      const h = 1 / 240;
      let remaining = delta;
      while (remaining > 1e-6) {
        const dt = Math.min(h, remaining);
        sim.state = step(sim.state, params, dt);
        remaining -= dt;

        if (!crossedRef.current && sim.state.x >= params.trackM) {
          crossedRef.current = true;
          // linear interpolation back to the exact crossing instant
          const over = sim.state.x - params.trackM;
          const tExact = sim.state.t - (sim.state.v > 0 ? over / sim.state.v : 0);
          sim.trueGateT = tExact;
          onCrossGate?.(tExact);
        }
        if (sim.state.done || (sim.state.v === 0 && sim.state.t > 0.35)) {
          if (!settledRef.current) {
            settledRef.current = true;
            sim.running = false;
            onSettle?.(sim.state);
          }
          break;
        }
      }
    }

    const th = params.thetaDeg * DEG;
    const L = params.rampLengthM;
    const d = sim.state.x;
    const px = -L * Math.cos(th) + Math.cos(th) * d + Math.sin(th) * (size[1] / 2);
    const py = L * Math.sin(th) - Math.sin(th) * d + Math.cos(th) * (size[1] / 2) + 0.008;
    ref.current.position.set(px, py, 0);
    ref.current.rotation.z = -th;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#A6672A" roughness={0.6} metalness={0.05} />
    </mesh>
  );
}

/** Free-play only: the weight components that make the whole thing tick. */
function ForceArrows({ params, simRef }) {
  const group = useRef();
  const th = params.thetaDeg * DEG;
  const size = useMemo(() => blockSize(params.massKg), [params.massKg]);

  useFrame(() => {
    const sim = simRef.current;
    if (!group.current || !sim) return;
    const L = params.rampLengthM;
    const d = sim.state.x;
    group.current.position.set(
      -L * Math.cos(th) + Math.cos(th) * d + Math.sin(th) * (size[1] / 2),
      L * Math.sin(th) - Math.sin(th) * d + Math.cos(th) * (size[1] / 2) + 0.008,
      0
    );
  });

  const wLen = clamp(params.massKg * 0.24, 0.12, 0.42);
  const alongLen = wLen * Math.sin(th);
  const normalLen = wLen * Math.cos(th);

  return (
    <group ref={group}>
      {/* full weight, straight down */}
      <Arrow dir={[0, -1, 0]} length={wLen} colour="#3E372F" />
      {/* mg sinθ, down the slope */}
      <Arrow dir={[Math.cos(th), -Math.sin(th), 0]} length={alongLen} colour={color.gold} />
      {/* normal reaction */}
      <Arrow dir={[Math.sin(th), Math.cos(th), 0]} length={normalLen} colour={color.physics} />
    </group>
  );
}

function Arrow({ dir, length, colour }) {
  const quaternion = useMemo(() => {
    const v = new THREE.Vector3(...dir).normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    return q;
  }, [dir[0], dir[1], dir[2]]);

  return (
    <group quaternion={quaternion}>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[0.005, 0.005, length, 10]} />
        <meshStandardMaterial color={colour} />
      </mesh>
      <mesh position={[0, length, 0]}>
        <coneGeometry args={[0.016, 0.04, 12]} />
        <meshStandardMaterial color={colour} />
      </mesh>
    </group>
  );
}

// --- helpers ---------------------------------------------------------------

export function blockSize(massKg) {
  // Keep the density constant so a heavier block genuinely looks bigger —
  // and so the student can see that size is irrelevant to the acceleration.
  const side = Math.cbrt(massKg / 700) * 1.9;
  return [clamp(side, 0.07, 0.2), clamp(side * 0.72, 0.05, 0.15), clamp(side * 0.85, 0.06, 0.18)];
}

function surfaceColor(params) {
  const s = params.surface;
  if (s === 'glass') return '#CFE0E4';
  if (s === 'felt') return '#9C6B62';
  if (s === 'ice') return '#DCEAF4';
  if (s === 'frictionless') return '#E8E4F2';
  return '#B9905A';
}

function surfaceRoughness(params) {
  const s = params.surface;
  if (s === 'glass' || s === 'ice') return 0.12;
  if (s === 'felt') return 1;
  return 0.65;
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

export function makeSimRef() {
  return { state: initialState(), running: false, trueGateT: null };
}

const styles = StyleSheet.create({
  stage: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: '#F3EBDC',
    // expo-gl's GLView is a TextureView, and a TextureView cannot draw inside a
    // software-rendered layer. On Android a rounded, overflow-clipped parent can
    // push React Native into exactly that, and the symptom is a GL surface that
    // never arrives — no error, just an empty bench. Square corners on Android
    // are a cheap price for a renderer that starts.
    ...Platform.select({
      android: {},
      default: { borderRadius: 24, overflow: 'hidden' },
    }),
  },
  errorWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 8,
    backgroundColor: 'rgba(243,235,220,0.97)',
  },
  errorTitle: {
    fontFamily: font.bold,
    fontSize: 13,
    letterSpacing: 0.6,
    color: color.red,
    textAlign: 'center',
  },
  errorDetail: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkSoft,
    textAlign: 'center',
  },
  retry: {
    marginTop: 6,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.edge,
  },
  retryLabel: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
  hudTopLeft: { position: 'absolute', left: 14, top: 13, gap: 4 },
  hudTitle: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.9,
    color: color.inkSoft,
  },
  hudSub: {
    fontFamily: font.semibold,
    fontSize: 8.5,
    letterSpacing: 1.3,
    color: 'rgba(28,24,21,0.42)',
  },
  hudButtons: { position: 'absolute', right: 11, bottom: 11, gap: 7 },
  hudBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,253,248,0.9)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.edge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudGlyph: { fontSize: 12, color: color.inkMuted },
});
