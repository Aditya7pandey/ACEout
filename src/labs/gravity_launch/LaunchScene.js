import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable, Platform } from 'react-native';
import { Canvas, useFrame, useThree } from '../../three/fiber';
import * as THREE from 'three';
import { color, font } from '../../theme';
import { step, initialState, worldOf, rangeOf, TAPE_LENGTH_M } from './physics';

const MAX_TRAIL = 320;

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
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}

/**
 * The launch bench, viewed side-on.
 *
 * Everything that matters here happens in a vertical plane, so the default
 * camera looks straight down the z axis: the deck on the left, the floor tape
 * running away to the right, and the parabola drawn between them at full
 * width. You can orbit off that axis, but square-on is where the physics is
 * legible, which is why it is where the reset button puts you.
 *
 * The simulation is integrated inside the render loop and written into a
 * shared ref, so the rover really is moving while the student holds a
 * stopwatch. Nothing about the flight is scripted or eased — it is ẍ = 0,
 * ÿ = −g, stepped.
 */
export default function LaunchScene({
  params,
  simRef,
  onLand,
  showTrail = true,
  showGhosts = false,
  // The sealed world of the last guided step. The bench still stands on a real
  // planet with a real g — the HUD simply refuses to name it, because the
  // student is about to measure it.
  sealed = false,
  height = 270,
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
  // measure for itself.
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

  // How far back the camera has to sit to contain this world's flight. A short
  // Jovian hop and a long Plutonian glide are not drawn at the same scale, but
  // the frame is always honest about what it is showing.
  const autoDist = useMemo(() => {
    const span = Math.max(0.8, rangeOf(params) + params.deckRunM + 0.35);
    return clamp(span * 1.15, 1.25, 3.4);
  }, [params.speedMS, params.heightM, params.g, params.deckRunM]);

  const [orbit, setOrbit] = useState({ az: 0, el: 0.14, dist: autoDist });
  const orbitRef = useRef(orbit);
  orbitRef.current = orbit;
  const startRef = useRef({ az: 0, el: 0 });

  // Re-frame when the world changes, keeping whatever angle the student chose.
  useEffect(() => {
    setOrbit((o) => (Math.abs(o.dist - autoDist) < 0.01 ? o : { ...o, dist: autoDist }));
  }, [autoDist]);

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
          az: clamp(startRef.current.az - g.dx * 0.005, -1.1, 1.1),
          el: clamp(startRef.current.el + g.dy * 0.004, -0.1, 1.0),
        }));
      },
    })
  ).current;

  const zoom = useCallback((delta) => {
    setOrbit((o) => ({ ...o, dist: clamp(o.dist + delta, 0.9, 5.2) }));
  }, []);

  const reset = useCallback(
    () => setOrbit({ az: 0, el: 0.14, dist: autoDist }),
    [autoDist]
  );

  const world = worldOf(params);

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
              state.gl.setClearColor(skyOf(world));
              setGl({
                w: Math.round(state.size?.width || 0),
                h: Math.round(state.size?.height || 0),
              });
            }}
          >
            <Sky world={world} />
            <CameraRig orbit={orbit} params={params} />
            <ambientLight intensity={1.45} />
            <directionalLight position={[1.6, 3.2, 2.6]} intensity={2.0} />
            <directionalLight position={[-2.4, 1.2, -2]} intensity={0.55} color="#BFD0F0" />

            <Ground world={world} />
            <Tape params={params} />
            <Deck params={params} />
            <Rover params={params} simRef={simRef} onLand={onLand} />
            {showTrail ? <Trail simRef={simRef} /> : null}
            {showGhosts ? <Ghosts simRef={simRef} /> : null}
            <LandingFlag simRef={simRef} />
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
          {sealed
            ? 'SEALED WORLD · g = ?'
            : `${world.label.toUpperCase()} · g = ${params.g.toFixed(2)} M S⁻²`}
        </Text>
        <Text style={styles.hudSub}>
          {gl
            ? `DECK ${(params.heightM * 100).toFixed(0)} CM · DRAG TO ORBIT`
            : 'STARTING THE RENDERER…'}
        </Text>
      </View>

      <View style={styles.hudButtons}>
        <Pressable style={styles.hudBtn} onPress={() => zoom(-0.3)}>
          <Text style={styles.hudGlyph}>＋</Text>
        </Pressable>
        <Pressable style={styles.hudBtn} onPress={() => zoom(0.3)}>
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

/** The horizon takes the world's colour, so switching gravity is visible. */
function Sky({ world }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor(skyOf(world));
  }, [gl, world]);
  return null;
}

function CameraRig({ orbit, params }) {
  const { camera } = useThree();
  const target = useMemo(
    () =>
      new THREE.Vector3(
        Math.min(0.55, rangeOf(params) / 2),
        params.heightM * 0.55,
        0
      ),
    [params.speedMS, params.heightM, params.g]
  );

  useFrame(() => {
    const { az, el, dist } = orbit;
    camera.position.set(
      target.x + dist * Math.cos(el) * Math.sin(az),
      target.y + dist * Math.sin(el) + 0.12,
      target.z + dist * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(target);
  });
  return null;
}

function Ground({ world }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, -0.003, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color={regolithOf(world)} roughness={0.98} />
      </mesh>
      <gridHelper args={[9, 36, '#C9BCA4', '#D7CCB8']} position={[0.3, 0.0005, 0]} />
    </group>
  );
}

/**
 * The measuring tape on the floor. Decimetre posts only — the graduations the
 * student actually reads are on the metre scale instrument, not in here.
 * A 3D ruler you can zoom into would hand them the answer.
 */
function Tape({ params }) {
  const posts = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 10; i += 1) out.push(i / 10);
    return out;
  }, []);

  return (
    <group position={[-params.originM, 0, 0]}>
      <mesh position={[TAPE_LENGTH_M / 2, 0.0012, 0.14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TAPE_LENGTH_M, 0.05]} />
        <meshStandardMaterial color="#F0E6D2" roughness={0.9} />
      </mesh>
      {posts.map((p) => (
        <mesh key={p} position={[p, 0.012, 0.14]}>
          <boxGeometry args={[0.004, 0.022, 0.05]} />
          <meshStandardMaterial color={p === 0 ? color.red : '#6E675E'} />
        </mesh>
      ))}
    </group>
  );
}

/** The launch deck: a rail on a pillar, with the spring stop at the back. */
function Deck({ params }) {
  const L = params.deckRunM + 0.14;
  const h = params.heightM;
  return (
    <group>
      {/* the running rail, its lip exactly at x = 0 */}
      <mesh position={[-L / 2, h - 0.011, 0]}>
        <boxGeometry args={[L, 0.022, 0.17]} />
        <meshStandardMaterial color="#C9A876" roughness={0.72} />
      </mesh>
      {/* pillar */}
      <mesh position={[-L + 0.07, h / 2 - 0.011, 0]}>
        <boxGeometry args={[0.09, h, 0.13]} />
        <meshStandardMaterial color="#B08F63" roughness={0.85} />
      </mesh>
      {/* the spring stop the rover starts against */}
      <mesh position={[-L + 0.02, h + 0.03, 0]}>
        <boxGeometry args={[0.02, 0.06, 0.15]} />
        <meshStandardMaterial color={color.brass} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* brass lip marker — the origin of every range measured today */}
      <mesh position={[-0.004, h + 0.004, 0]}>
        <boxGeometry args={[0.008, 0.012, 0.17]} />
        <meshStandardMaterial color={color.brass} />
      </mesh>
    </group>
  );
}

function Rover({ params, simRef, onLand }) {
  const ref = useRef();
  const landedRef = useRef(false);

  useFrame((_, rawDelta) => {
    const sim = simRef.current;
    if (!ref.current || !sim) return;

    if (sim.state.phase === 'deck' && sim.state.deckX === 0) landedRef.current = false;

    if (sim.running) {
      const delta = Math.min(rawDelta, 0.05);
      const step$ = 1 / 240;
      let remaining = delta;
      while (remaining > 1e-6) {
        const dt = Math.min(step$, remaining);
        sim.state = step(sim.state, params, dt);
        remaining -= dt;
        if (sim.state.phase === 'landed') {
          if (!landedRef.current) {
            landedRef.current = true;
            sim.running = false;
            sim.ghosts = [...(sim.ghosts || []).slice(-3), sim.state.trail];
            onLand?.({ t: sim.state.landedT, x: sim.state.landedX });
          }
          break;
        }
      }
    }

    const s = sim.state;
    if (s.phase === 'deck') {
      ref.current.position.set(-(params.deckRunM + 0.1) + s.deckX, params.heightM, 0);
      ref.current.rotation.z = 0;
    } else {
      ref.current.position.set(s.x, s.y, 0);
      // nose follows the velocity, which is what makes a parabola look like a fall
      ref.current.rotation.z = Math.atan2(s.vy, Math.max(1e-6, s.vx));
    }
  });

  return (
    <group ref={ref}>
      <group position={[0, 0.018, 0]}>
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[0.105, 0.03, 0.072]} />
          <meshStandardMaterial color="#B6482F" roughness={0.55} metalness={0.08} />
        </mesh>
        <mesh position={[-0.012, 0.045, 0]}>
          <boxGeometry args={[0.05, 0.026, 0.058]} />
          <meshStandardMaterial color="#8E8A84" roughness={0.4} metalness={0.25} />
        </mesh>
        {/* solar panel */}
        <mesh position={[0.026, 0.038, 0]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.04, 0.004, 0.064]} />
          <meshStandardMaterial color="#2C3E6B" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* antenna */}
        <mesh position={[-0.03, 0.068, 0.018]}>
          <cylinderGeometry args={[0.0015, 0.0015, 0.03, 6]} />
          <meshStandardMaterial color={color.brass} />
        </mesh>
        {[-0.034, 0.034].map((x) =>
          [-0.039, 0.039].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.011, 14]} />
              <meshStandardMaterial color="#2E2A26" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

/**
 * The flight path, drawn as a single line whose vertices are rewritten each
 * frame. One mesh per trail point would be ~300 draw calls on a phone.
 */
function Trail({ simRef }) {
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(MAX_TRAIL * 3), 3)
    );
    geo.setDrawRange(0, 0);
    const obj = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: color.gold }));
    obj.frustumCulled = false;
    return obj;
  }, []);

  useEffect(() => () => line.geometry.dispose(), [line]);

  useFrame(() => {
    const trail = simRef.current?.state?.trail || [];
    const attr = line.geometry.getAttribute('position');
    const n = Math.min(trail.length, MAX_TRAIL);
    for (let i = 0; i < n; i += 1) {
      attr.array[i * 3] = trail[i][0];
      attr.array[i * 3 + 1] = trail[i][1];
      attr.array[i * 3 + 2] = 0;
    }
    attr.needsUpdate = true;
    line.geometry.setDrawRange(0, n);
  });

  return <primitive object={line} />;
}

/**
 * Free play only: the last few flights, kept on the bench. Switching from
 * Jupiter to Pluto and seeing four parabolas stacked against each other is the
 * single most useful picture in this lab.
 */
function Ghosts({ simRef }) {
  const [version, setVersion] = useState(0);
  const seen = useRef(0);

  useFrame(() => {
    const n = (simRef.current?.ghosts || []).length;
    if (n !== seen.current) {
      seen.current = n;
      setVersion((v) => v + 1);
    }
  });

  const ghosts = simRef.current?.ghosts || [];
  return (
    <group key={version}>
      {ghosts.slice(0, Math.max(0, ghosts.length - 1)).map((points, i) => (
        <GhostLine key={i} points={points} fade={(i + 1) / ghosts.length} />
      ))}
    </group>
  );
}

function GhostLine({ points, fade }) {
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(
      points.map(([x, y]) => new THREE.Vector3(x, y, 0))
    );
    const obj = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color: color.physics,
        transparent: true,
        opacity: 0.2 + 0.4 * fade,
      })
    );
    obj.frustumCulled = false;
    return obj;
  }, [points, fade]);

  useEffect(() => () => line.geometry.dispose(), [line]);
  return <primitive object={line} />;
}

/** A post dropped where the rover touched down, so the tape can be read. */
function LandingFlag({ simRef }) {
  const ref = useRef();
  useFrame(() => {
    const s = simRef.current?.state;
    if (!ref.current) return;
    const landed = s?.phase === 'landed' && Number.isFinite(s.landedX);
    ref.current.visible = !!landed;
    if (landed) ref.current.position.set(s.landedX, 0, 0);
  });

  return (
    <group ref={ref} visible={false}>
      <mesh position={[0, 0.05, 0.1]}>
        <cylinderGeometry args={[0.0018, 0.0018, 0.1, 6]} />
        <meshStandardMaterial color={color.green} />
      </mesh>
      <mesh position={[0.014, 0.088, 0.1]}>
        <boxGeometry args={[0.026, 0.018, 0.001]} />
        <meshStandardMaterial color={color.green} />
      </mesh>
    </group>
  );
}

// --- helpers ---------------------------------------------------------------

function skyOf(world) {
  // Keep the paper palette and let the world tint it, rather than painting a
  // photographic sky that would fight the rest of the app.
  return mix('#F3EBDC', world.tint, 0.16);
}

function regolithOf(world) {
  return mix('#E7DDCB', world.tint, 0.3);
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round((((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t));
  const g = Math.round((((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t));
  const bl = Math.round(((pa & 255) * (1 - t) + (pb & 255) * t));
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

export function makeSimRef() {
  return { state: initialState(), running: false, ghosts: [], shot: 0 };
}

const styles = StyleSheet.create({
  stage: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    backgroundColor: '#F3EBDC',
    // expo-gl's GLView is a TextureView, and a TextureView cannot draw inside a
    // software-rendered layer. On Android a rounded, overflow-clipped parent can
    // push React Native into exactly that, and the symptom is a GL surface that
    // never arrives — no error, just an empty bench.
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
  hudTitle: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.9, color: color.inkSoft },
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
