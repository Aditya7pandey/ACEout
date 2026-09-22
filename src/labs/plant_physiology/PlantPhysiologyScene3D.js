import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable } from 'react-native';
import { Canvas, useFrame, useThree } from '../../three/fiber';
import * as THREE from 'three';
import { color, font, radius } from '../../theme';
import { getCobaltPaperColor } from './physics';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Error boundary
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

// Camera controller with smooth lerp
function CameraRig({ orbit, target = [0, 0, 0] }) {
  const { camera } = useThree();
  const targetVec = useMemo(() => new THREE.Vector3(...target), [target]);

  useFrame(() => {
    const { az, el, dist } = orbit;
    const clampedEl = clamp(el, 0.18, 1.48);
    const clampedDist = clamp(dist, 1.2, 4.8);

    camera.position.set(
      targetVec.x + clampedDist * Math.cos(clampedEl) * Math.sin(az),
      targetVec.y + clampedDist * Math.sin(clampedEl),
      targetVec.z + clampedDist * Math.cos(clampedEl) * Math.cos(az)
    );
    camera.lookAt(targetVec);
  });
  return null;
}

// -------------------------------------------------------------
// LABORATORY WORKBENCH & ENVIRONMENT
// -------------------------------------------------------------
function WorkbenchFloor() {
  return (
    <group position={[0, -0.25, 0]}>
      {/* Heavy Laboratory Tabletop (Matte Warm Birchwood) */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[8.0, 0.1, 8.0]} />
        <meshStandardMaterial color="#E8DEC8" roughness={0.82} metalness={0.05} />
      </mesh>
      {/* Lab Bench Perspective Grid */}
      <gridHelper args={[8.0, 32, '#B8A58D', '#D9CEBD']} position={[0, 0.002, 0]} />
    </group>
  );
}

// -------------------------------------------------------------
// SLEEK, UNOBSTRUCTED MICROSCOPE MECHANICAL STAGE
// -------------------------------------------------------------
function MicroscopeMechanicalStage({ children }) {
  return (
    <group position={[0, 0, 0]}>
      {/* 1. Black Anodized Aluminum Stage Plate */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.08, 3.6]} />
        <meshStandardMaterial color="#1E1C1A" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Stage Bevel Border Frame */}
      <mesh position={[0, -0.015, 0]}>
        <boxGeometry args={[4.4, 0.02, 3.4]} />
        <meshStandardMaterial color="#2B2724" roughness={0.3} metalness={0.75} />
      </mesh>

      {/* Stage Calibration Tick Ruler Marks on Left */}
      <mesh position={[-1.85, 0.002, 0]}>
        <boxGeometry args={[0.08, 0.004, 2.4]} />
        <meshStandardMaterial color="#FAF5EB" roughness={0.9} />
      </mesh>

      {/* 2. Circular Illuminated Substage Condenser Aperture (Glowing Light Source) */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.32, 36]} />
        <meshBasicMaterial color="#FFF9EC" />
      </mesh>
      {/* Amber/Golden Optical Bezel Ring */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.28, 1.4, 36]} />
        <meshBasicMaterial color="#D4A038" />
      </mesh>

      {/* 3. Glass Slide (75x25mm standard proportion with polished edges) */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[3.2, 0.018, 1.35]} />
        <meshStandardMaterial
          color="#D2EBF8"
          roughness={0.04}
          metalness={0.2}
          transparent
          opacity={0.48}
        />
      </mesh>

      {/* Frosted Label Zone on Left End */}
      <mesh position={[-1.25, 0.03, 0]}>
        <boxGeometry args={[0.62, 0.004, 1.32]} />
        <meshStandardMaterial color="#F7F4EC" roughness={0.95} />
      </mesh>

      {/* Square Glass Coverslip in Center */}
      <mesh position={[0, 0.038, 0]}>
        <boxGeometry args={[1.32, 0.006, 1.32]} />
        <meshStandardMaterial
          color="#E6F4FC"
          roughness={0.03}
          metalness={0.25}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Left Chrome Stage Clip Clamping Slide */}
      <group position={[-1.75, 0.038, -0.45]} rotation={[0, 0.16, 0]}>
        <mesh position={[0.45, 0.012, 0]}>
          <boxGeometry args={[0.9, 0.016, 0.13]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* Right Chrome Stage Clip Clamping Slide */}
      <group position={[1.75, 0.038, 0.45]} rotation={[0, -0.16, 0]}>
        <mesh position={[-0.45, 0.012, 0]}>
          <boxGeometry args={[0.9, 0.016, 0.13]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* Biological Specimen Mounted on Slide */}
      <group position={[0, 0.042, 0]}>{children}</group>
    </group>
  );
}

// -------------------------------------------------------------
// MODULE 1: 3D PLASMOLYSIS CELLULAR PEEL (Rhoeo discolor)
// -------------------------------------------------------------
// Realistic 3D single plant cell with primary wall, middle lamella,
// anthocyanin/water vacuole, cytoplasm, nucleus, chloroplasts,
// Hechtian strands, and H2O osmotic flux arrows
function SingleRhoeoCell({
  position,
  vacuoleScale = 1.0,
  isSelected,
  onClick,
  showFlux = true,
  isPlasmolysing = false,
}) {
  const isTurgid = vacuoleScale > 0.85;
  const isFlaccid = vacuoleScale > 0.65 && vacuoleScale <= 0.85;
  const isPlasmolyzed = vacuoleScale <= 0.65;

  // Anthocyanin pigment concentrates and darkens dramatically as water exits
  const vacuoleColor = useMemo(() => {
    if (vacuoleScale > 0.85) return '#C026D3'; // Vibrant magenta-violet (dilute cell sap)
    if (vacuoleScale > 0.65) return '#A21CAF'; // Rich purple
    if (vacuoleScale > 0.48) return '#86198F'; // Concentrated deep violet
    return '#581C87'; // Dense concentrated plum-purple
  }, [vacuoleScale]);

  // Protoplast morphing dimensions
  const protoplastWidth = Math.max(0.24, vacuoleScale * 0.92);
  const protoplastHeight = Math.max(0.24, vacuoleScale * 0.92);

  return (
    <group position={position} onClick={onClick}>
      {/* 1. Rigid Cellulosic Outer Cell Wall (Emerald/Olive border) */}
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.5, 0.026, 0.4]} />
        <meshStandardMaterial color="#65A30D" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* 2. Middle Lamella & Inner Wall Border (Dark Forest Green) */}
      <mesh position={[0, 0.014, 0]}>
        <boxGeometry args={[0.46, 0.028, 0.36]} />
        <meshStandardMaterial color="#3F6212" roughness={0.45} />
      </mesh>

      {/* 3. Periplasmic Space: Clear Hypertonic External Solution pooling inside */}
      {vacuoleScale < 0.92 && (
        <mesh position={[0, 0.016, 0]}>
          <boxGeometry args={[0.44, 0.029, 0.34]} />
          <meshStandardMaterial
            color="#FEF9C3"
            transparent
            opacity={0.6}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* 4. Hechtian Strands: Fine cytoplasmic anchors to wall corners during plasmolysis */}
      {isPlasmolyzed && (
        <group position={[0, 0.018, 0]}>
          {/* Top-Left strand */}
          <mesh position={[-0.14, 0, -0.11]} rotation={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
            <meshStandardMaterial color="#84CC16" transparent opacity={0.8} />
          </mesh>
          {/* Top-Right strand */}
          <mesh position={[0.14, 0, -0.11]} rotation={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
            <meshStandardMaterial color="#84CC16" transparent opacity={0.8} />
          </mesh>
          {/* Bottom-Left strand */}
          <mesh position={[-0.14, 0, 0.11]} rotation={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
            <meshStandardMaterial color="#84CC16" transparent opacity={0.8} />
          </mesh>
          {/* Bottom-Right strand */}
          <mesh position={[0.14, 0, 0.11]} rotation={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
            <meshStandardMaterial color="#84CC16" transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* 5. Cytoplasm Layer (Translucent Green) encasing the vacuole */}
      <mesh
        position={[0, 0.017, 0]}
        scale={[protoplastWidth * 1.05, 0.95, protoplastHeight * 1.05]}
      >
        <boxGeometry args={[0.43, 0.024, 0.32]} />
        <meshStandardMaterial
          color="#84CC16"
          roughness={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 6. Central Vacuole (Rich Anthocyanin Purple/Magenta Sap) */}
      <mesh
        position={[0, 0.019, 0]}
        scale={[protoplastWidth, 0.92, protoplastHeight]}
      >
        <boxGeometry args={[0.41, 0.022, 0.3]} />
        <meshStandardMaterial
          color={vacuoleColor}
          roughness={0.25}
          metalness={0.2}
          emissive={isSelected ? '#C026D3' : '#4A044E'}
          emissiveIntensity={isSelected ? 0.45 : 0.15}
        />
      </mesh>

      {/* 7. Distinct Amber Nucleus with nucleolus highlight */}
      <group
        position={[
          0.13 * (vacuoleScale > 0.6 ? 1 : 0.35),
          0.026,
          0.07 * (vacuoleScale > 0.6 ? 1 : 0.35),
        ]}
      >
        <mesh>
          <sphereGeometry args={[0.032, 14, 14]} />
          <meshStandardMaterial color="#D97706" roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0.008, 0.012, 0.008]}>
          <sphereGeometry args={[0.012, 10, 10]} />
          <meshStandardMaterial color="#FDE68A" roughness={0.2} />
        </mesh>
      </group>

      {/* 8. 3D Chloroplast Granules in Cytoplasm */}
      <mesh position={[-0.14 * protoplastWidth, 0.025, -0.09 * protoplastHeight]}>
        <sphereGeometry args={[0.016, 10, 10]} />
        <meshStandardMaterial color="#15803D" roughness={0.4} />
      </mesh>
      <mesh position={[0.13 * protoplastWidth, 0.025, -0.1 * protoplastHeight]}>
        <sphereGeometry args={[0.016, 10, 10]} />
        <meshStandardMaterial color="#15803D" roughness={0.4} />
      </mesh>
      <mesh position={[-0.12 * protoplastWidth, 0.025, 0.1 * protoplastHeight]}>
        <sphereGeometry args={[0.015, 10, 10]} />
        <meshStandardMaterial color="#16A34A" roughness={0.4} />
      </mesh>
      <mesh position={[0.05 * protoplastWidth, 0.025, 0.11 * protoplastHeight]}>
        <sphereGeometry args={[0.015, 10, 10]} />
        <meshStandardMaterial color="#15803D" roughness={0.4} />
      </mesh>

      {/* 9. H2O Osmotic Flux Visual Vectors (Endosmosis / Exosmosis indicator) */}
      {showFlux && (
        <group position={[0, 0.035, 0]}>
          {isTurgid ? (
            // Hypotonic: Influx Equilibrium (Water entering cell)
            <group>
              <mesh position={[-0.22, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.022, 0.05, 12]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
              <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.022, 0.05, 12]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
            </group>
          ) : isPlasmolyzed ? (
            // Hypertonic: Exosmosis (Water rushing outward)
            <group>
              <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.022, 0.05, 12]} />
                <meshBasicMaterial color="#EF4444" />
              </mesh>
              <mesh position={[0.18, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.022, 0.05, 12]} />
                <meshBasicMaterial color="#EF4444" />
              </mesh>
            </group>
          ) : null}
        </group>
      )}
    </group>
  );
}

function PlasmolysisCellularGrid({ vacuoleRatio = 1.0, onSelectCell }) {
  // 3x3 Array of Epidermal Cells matching high-magnification peel
  const gridPositions = useMemo(() => {
    const arr = [];
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        arr.push({ x: col * 0.52, z: row * 0.42, id: `cell_${row}_${col}` });
      }
    }
    return arr;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {gridPositions.map((p) => (
        <SingleRhoeoCell
          key={p.id}
          position={[p.x, 0, p.z]}
          vacuoleScale={vacuoleRatio}
          onClick={() => onSelectCell && onSelectCell(p.id)}
        />
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// MODULE 2: 3D STOMATAL DISTRIBUTION & APPARATUS
// -------------------------------------------------------------
// Guard cells (Kidney/Dumbbell) with inner/outer wall thickness,
// K+ ion particles, H2O flow vectors, chloroplasts, purple nucleus,
// and open/close aperture animation
function StomatalComplex3D({
  leafType = 'dicot',
  surface = 'lower',
  aperture = 0.5,
  showFOVGrid = true,
}) {
  const isOpen = aperture > 0.35;

  // Stomata distribution positions across peel field
  const stomataNodes = useMemo(() => {
    const list = [];
    const count =
      leafType === 'dicot'
        ? surface === 'lower'
          ? 8
          : 2
        : 6;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.28;
      const radius = 0.22 + (i % 3) * 0.22;
      list.push({
        id: i,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        rot: angle * 0.5,
      });
    }
    return list;
  }, [leafType, surface]);

  // Potassium (K+) Ion Distribution:
  // When OPEN (Swollen): K+ ions concentrate INSIDE guard cells
  // When CLOSED (Shrunken): K+ ions pumped OUT into epidermal cells
  const kIonPositions = useMemo(() => {
    const ions = [];
    if (isOpen) {
      // Packed inside guard cells
      for (let i = 0; i < 24; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const offsetR = 0.08 + (i % 4) * 0.025;
        const angle = (i / 12) * Math.PI - Math.PI / 2;
        ions.push({
          x: side * (0.13 + offsetR * 0.4),
          z: Math.sin(angle) * 0.18,
          id: `k_in_${i}`,
        });
      }
    } else {
      // Pumped into surrounding epidermal cells
      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 0.32 + (i % 3) * 0.06;
        ions.push({
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          id: `k_out_${i}`,
        });
      }
    }
    return ions;
  }, [isOpen]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Epidermal Pavement Tissue Layer (Tessellated mosaic) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.28, 1.28]} />
        <meshStandardMaterial color="#86EFAC" roughness={0.6} />
      </mesh>

      {/* Epidermal Cell Wall Network Grid Lines (Undulating jigsaw boundaries) */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.62, 28]} />
        <meshStandardMaterial color="#22C55E" roughness={0.45} />
      </mesh>

      {/* Stomatal Units */}
      {stomataNodes.map((s) => (
        <group key={s.id} position={[s.x, 0.014, s.z]} rotation={[0, s.rot, 0]}>
          {leafType === 'dicot' ? (
            // Dicot: Reniform (Kidney-shaped) Guard Cells
            <group scale={[0.45, 0.45, 0.45]}>
              {/* Outer Thin Elastic Cell Wall (Light Green, bulges outward) */}
              <mesh position={[-0.14 - aperture * 0.045, 0.005, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
                <torusGeometry args={[0.18, 0.075, 14, 20, Math.PI * 0.95]} />
                <meshStandardMaterial color="#4ADE80" roughness={0.35} />
              </mesh>
              <mesh position={[0.14 + aperture * 0.045, 0.005, 0]} rotation={[Math.PI / 2, 0, -0.2 + Math.PI]}>
                <torusGeometry args={[0.18, 0.075, 14, 20, Math.PI * 0.95]} />
                <meshStandardMaterial color="#4ADE80" roughness={0.35} />
              </mesh>

              {/* Inner Thick Inelastic Cell Wall Facing Pore (Dark Forest Green) */}
              <mesh position={[-0.08 - aperture * 0.03, 0.01, 0]} rotation={[Math.PI / 2, 0, 0.2]}>
                <torusGeometry args={[0.15, 0.04, 14, 18, Math.PI * 0.85]} />
                <meshStandardMaterial color="#14532D" roughness={0.25} />
              </mesh>
              <mesh position={[0.08 + aperture * 0.03, 0.01, 0]} rotation={[Math.PI / 2, 0, -0.2 + Math.PI]}>
                <torusGeometry args={[0.15, 0.04, 14, 18, Math.PI * 0.85]} />
                <meshStandardMaterial color="#14532D" roughness={0.25} />
              </mesh>

              {/* Central Stomatal Pore Aperture (Glowing light path) */}
              <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[Math.max(0.008, 0.025 + aperture * 0.055), 18]} />
                <meshBasicMaterial color={isOpen ? '#FFFDE0' : '#0B1908'} />
              </mesh>

              {/* Guard Cell Vacuoles (Cyan-blue fluid bodies) */}
              <mesh position={[-0.15 - aperture * 0.03, 0.018, 0]}>
                <sphereGeometry args={[0.055 + aperture * 0.02, 10, 10]} />
                <meshStandardMaterial color="#38BDF8" transparent opacity={0.75} roughness={0.2} />
              </mesh>
              <mesh position={[0.15 + aperture * 0.03, 0.018, 0]}>
                <sphereGeometry args={[0.055 + aperture * 0.02, 10, 10]} />
                <meshStandardMaterial color="#38BDF8" transparent opacity={0.75} roughness={0.2} />
              </mesh>

              {/* Purple/Violet Prominent Nuclei */}
              <mesh position={[-0.16, 0.025, 0.07]}>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshStandardMaterial color="#7E22CE" roughness={0.3} />
              </mesh>
              <mesh position={[0.16, 0.025, -0.07]}>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshStandardMaterial color="#7E22CE" roughness={0.3} />
              </mesh>

              {/* Vivid Emerald Chloroplast Granules */}
              <mesh position={[-0.17, 0.025, -0.08]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#15803D" />
              </mesh>
              <mesh position={[-0.12, 0.025, 0.12]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshStandardMaterial color="#16A34A" />
              </mesh>
              <mesh position={[0.17, 0.025, 0.08]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#15803D" />
              </mesh>
              <mesh position={[0.12, 0.025, -0.12]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshStandardMaterial color="#16A34A" />
              </mesh>
            </group>
          ) : (
            // Monocot: Dumbbell-shaped Guard Cells with Subsidiary Cells
            <group scale={[0.42, 0.42, 0.42]}>
              <group position={[-0.1 - aperture * 0.03, 0, 0]}>
                <mesh position={[0, 0.01, 0.15]}>
                  <sphereGeometry args={[0.06, 12, 12]} />
                  <meshStandardMaterial color="#4ADE80" />
                </mesh>
                <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.24, 8]} />
                  <meshStandardMaterial color="#14532D" />
                </mesh>
                <mesh position={[0, 0.01, -0.15]}>
                  <sphereGeometry args={[0.06, 12, 12]} />
                  <meshStandardMaterial color="#4ADE80" />
                </mesh>
              </group>
              <group position={[0.1 + aperture * 0.03, 0, 0]}>
                <mesh position={[0, 0.01, 0.15]}>
                  <sphereGeometry args={[0.06, 12, 12]} />
                  <meshStandardMaterial color="#4ADE80" />
                </mesh>
                <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.24, 8]} />
                  <meshStandardMaterial color="#14532D" />
                </mesh>
                <mesh position={[0, 0.01, -0.15]}>
                  <sphereGeometry args={[0.06, 12, 12]} />
                  <meshStandardMaterial color="#4ADE80" />
                </mesh>
              </group>
            </group>
          )}
        </group>
      ))}

      {/* Potassium (K+) Ion Particles (Glowing Ruby Spheres) */}
      <group position={[0, 0.025, 0]}>
        {kIonPositions.map((k) => (
          <mesh key={k.id} position={[k.x, 0, k.z]}>
            <sphereGeometry args={[0.009, 8, 8]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>
        ))}
      </group>

      {/* H2O Flow Vector Arrows */}
      <group position={[0, 0.038, 0]}>
        {isOpen ? (
          // Water entering guard cells (Endosmosis)
          <group>
            <mesh position={[-0.28, 0, 0.05]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.02, 0.045, 8]} />
              <meshBasicMaterial color="#0284C7" />
            </mesh>
            <mesh position={[0.28, 0, -0.05]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.02, 0.045, 8]} />
              <meshBasicMaterial color="#0284C7" />
            </mesh>
          </group>
        ) : (
          // Water leaving guard cells (Exosmosis)
          <group>
            <mesh position={[-0.24, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.02, 0.045, 8]} />
              <meshBasicMaterial color="#0284C7" />
            </mesh>
            <mesh position={[0.24, 0, -0.05]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.02, 0.045, 8]} />
              <meshBasicMaterial color="#0284C7" />
            </mesh>
          </group>
        )}
      </group>

      {/* Calibrated 10x10 FOV Graticule / Reticle Grid */}
      {showFOVGrid && (
        <group position={[0, 0.02, 0]}>
          <gridHelper args={[1.2, 10, '#DC2626', '#86EFAC']} />
          {/* Reticle Circular Eyepiece Border */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.59, 0.61, 48]} />
            <meshBasicMaterial color="#DC2626" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// -------------------------------------------------------------
// MODULE 3: 3D TRANSPIRATION APPARATUS (Potted Plant & Cobalt Chloride Paper)
// -------------------------------------------------------------
// Model matching user's Reference Image 1:
// Terracotta pot with rich soil, curved plant stem, broad green leaf with veining,
// sandwiched between two transparent glass slides, cobalt chloride test paper
// clamped with wire paperclips / slide clips on both sides!
function TranspirationApparatus3D({
  upperHydration = 0,
  lowerHydration = 0,
  activeSpeed = 1,
  viewAngle = 'upper', // 'upper' | 'lower' | 'dual'
}) {
  const upperColor = useMemo(() => getCobaltPaperColor(upperHydration), [upperHydration]);
  const lowerColor = useMemo(() => getCobaltPaperColor(lowerHydration), [lowerHydration]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Terracotta Plant Pot Standing Firmly on Laboratory Bench */}
      <group position={[-1.05, -0.1, 0]}>
        {/* Main Pot Body */}
        <mesh position={[0, -0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.56, 0.4, 0.68, 28]} />
          <meshStandardMaterial color="#B45309" roughness={0.75} metalness={0.05} />
        </mesh>
        {/* Terracotta Rim Band */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.58, 0.12, 28]} />
          <meshStandardMaterial color="#C2410C" roughness={0.7} metalness={0.05} />
        </mesh>
        {/* Dark Moist Potting Soil */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.04, 28]} />
          <meshStandardMaterial color="#271810" roughness={0.95} />
        </mesh>

        {/* Realistic Plant Stem rising and branching */}
        <mesh position={[0.08, 0.48, 0]} rotation={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.045, 0.065, 0.72, 14]} />
          <meshStandardMaterial color="#3F6212" roughness={0.5} />
        </mesh>
        {/* Secondary branch */}
        <mesh position={[-0.1, 0.42, 0.1]} rotation={[0.4, 0.3, 0.5]}>
          <cylinderGeometry args={[0.03, 0.04, 0.35, 10]} />
          <meshStandardMaterial color="#4D7C0F" roughness={0.5} />
        </mesh>

        {/* Background Foliage Leaves */}
        <mesh position={[-0.38, 0.58, -0.22]} rotation={[0.4, -0.6, -0.5]} scale={[0.85, 0.022, 0.48]}>
          <sphereGeometry args={[0.5, 20, 16]} />
          <meshStandardMaterial color="#166534" roughness={0.4} />
        </mesh>
        <mesh position={[-0.25, 0.68, 0.28]} rotation={[-0.3, 0.8, 0.4]} scale={[0.78, 0.022, 0.42]}>
          <sphereGeometry args={[0.5, 20, 16]} />
          <meshStandardMaterial color="#15803D" roughness={0.4} />
        </mesh>
        <mesh position={[-0.45, 0.35, 0.2]} rotation={[-0.5, 0.2, 0.6]} scale={[0.65, 0.02, 0.38]}>
          <sphereGeometry args={[0.5, 18, 14]} />
          <meshStandardMaterial color="#166534" roughness={0.4} />
        </mesh>
      </group>

      {/* 2. Main Experimental Leaf Clamped with Cobalt Chloride Paper & Slides */}
      <group
        position={[0.3, 0.36, 0]}
        rotation={
          viewAngle === 'lower'
            ? [0.75, Math.PI * 0.92, -0.15]
            : viewAngle === 'dual'
            ? [0.45, 0.65, -0.1]
            : [0.22, 0.32, -0.18]
        }
      >
        {/* Leaf Petiole connecting to stem */}
        <mesh position={[-0.8, -0.1, 0]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.032, 0.042, 0.55, 10]} />
          <meshStandardMaterial color="#4D7C0F" roughness={0.5} />
        </mesh>

        {/* Broad Dorsiventral Leaf Blade (Healthy emerald green with natural curvature) */}
        <mesh position={[0, 0, 0]} scale={[2.1, 0.03, 1.15]}>
          <sphereGeometry args={[0.65, 28, 20]} />
          <meshStandardMaterial
            color={viewAngle === 'lower' ? '#4ADE80' : '#15803D'}
            roughness={0.38}
            metalness={0.08}
          />
        </mesh>

        {/* Prominent Leaf Midrib (Main Central Vein) */}
        <mesh position={[0, 0.018, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.038, 1.25, 10]} />
          <meshStandardMaterial color="#65A30D" roughness={0.45} />
        </mesh>

        {/* Branching Lateral Secondary Veins */}
        <group position={[0, 0.016, 0]}>
          <mesh position={[-0.25, 0, 0.2]} rotation={[0, 0.55, 0]}>
            <boxGeometry args={[0.014, 0.008, 0.35]} />
            <meshStandardMaterial color="#84CC16" />
          </mesh>
          <mesh position={[-0.25, 0, -0.2]} rotation={[0, -0.55, 0]}>
            <boxGeometry args={[0.014, 0.008, 0.35]} />
            <meshStandardMaterial color="#84CC16" />
          </mesh>
          <mesh position={[0.22, 0, 0.22]} rotation={[0, 0.55, 0]}>
            <boxGeometry args={[0.014, 0.008, 0.35]} />
            <meshStandardMaterial color="#84CC16" />
          </mesh>
          <mesh position={[0.22, 0, -0.22]} rotation={[0, -0.55, 0]}>
            <boxGeometry args={[0.014, 0.008, 0.35]} />
            <meshStandardMaterial color="#84CC16" />
          </mesh>
        </group>

        {/* 3. Upper Surface (Adaxial) Cobalt Chloride Paper Strip & Glass Slide */}
        <group position={[0, 0.036, 0]}>
          {/* Cobalt Chloride Test Paper Strip */}
          <mesh>
            <boxGeometry args={[0.92, 0.012, 0.56]} />
            <meshStandardMaterial
              color={upperColor}
              roughness={0.45}
              metalness={0.1}
            />
          </mesh>
          {/* Circular aperture indicator area */}
          <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.18, 24]} />
            <meshBasicMaterial color="#1E3A8A" />
          </mesh>
          {/* Transparent Glass Cover Plate (Slide) */}
          <mesh position={[0, 0.014, 0]}>
            <boxGeometry args={[1.08, 0.008, 0.68]} />
            <meshStandardMaterial
              color="#E0F2FE"
              transparent
              opacity={0.5}
              roughness={0.04}
              metalness={0.25}
            />
          </mesh>
        </group>

        {/* 4. Lower Surface (Abaxial) Cobalt Chloride Paper Strip & Glass Slide */}
        <group position={[0, -0.036, 0]}>
          {/* Cobalt Chloride Test Paper Strip */}
          <mesh>
            <boxGeometry args={[0.92, 0.012, 0.56]} />
            <meshStandardMaterial
              color={lowerColor}
              roughness={0.45}
              metalness={0.1}
            />
          </mesh>
          {/* Circular aperture indicator area */}
          <mesh position={[0, -0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.18, 24]} />
            <meshBasicMaterial color="#1E3A8A" />
          </mesh>
          {/* Transparent Glass Cover Plate (Slide) */}
          <mesh position={[0, -0.014, 0]}>
            <boxGeometry args={[1.08, 0.008, 0.68]} />
            <meshStandardMaterial
              color="#E0F2FE"
              transparent
              opacity={0.5}
              roughness={0.04}
              metalness={0.25}
            />
          </mesh>
        </group>

        {/* 5. Left & Right Metallic Clamping Clips (Paper Clips / Slide Clips) */}
        {/* Left Chrome Wire Slide Clip */}
        <group position={[-0.56, 0, 0]}>
          {/* Main clamp body */}
          <mesh>
            <boxGeometry args={[0.08, 0.13, 0.52]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.12} />
          </mesh>
          {/* Paperclip wire loops */}
          <mesh position={[0.03, 0.065, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.06, 0.012, 10, 16, Math.PI]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0.03, -0.065, 0]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.06, 0.012, 10, 16, Math.PI]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* Right Chrome Wire Slide Clip */}
        <group position={[0.56, 0, 0]}>
          {/* Main clamp body */}
          <mesh>
            <boxGeometry args={[0.08, 0.13, 0.52]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.12} />
          </mesh>
          {/* Paperclip wire loops */}
          <mesh position={[-0.03, 0.065, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.06, 0.012, 10, 16, Math.PI]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[-0.03, -0.065, 0]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.06, 0.012, 10, 16, Math.PI]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* 6. Transpiration Water Vapor Mist Animation rising from lower abaxial surface */}
        {lowerHydration > 0.1 && (
          <group position={[0, -0.1, 0]}>
            <mesh position={[-0.12, -0.04, 0]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.15, -0.05, 0.08]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0, -0.07, -0.06]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// MAIN SCENE CONTAINER
// -------------------------------------------------------------
export default function PlantPhysiologyScene3D({
  height = 360,
  activeModule = 'plasmolysis',
  // Module 1 Props
  vacuoleRatio = 1.0,
  // Module 2 Props
  leafType = 'dicot',
  surface = 'lower',
  stomatalAperture = 0.5,
  showFOVGrid = true,
  // Module 3 Props
  upperHydration = 0,
  lowerHydration = 0,
  speedMultiplier = 1,
  viewAngle = 'upper',
  overlay = null,
}) {
  // Balanced default orbits with grounded perspective
  const defaultOrbit = useMemo(() => {
    if (activeModule === 'transpiration') {
      if (viewAngle === 'lower') {
        return { az: 0.65, el: 0.48, dist: 3.1 };
      }
      return { az: 0.38, el: 0.55, dist: 3.2 };
    }
    // Modules 1 & 2: Microscope Slide Top-Iso View (Downward angle, grounded)
    return { az: 0.15, el: 1.05, dist: 2.3 };
  }, [activeModule, viewAngle]);

  const [orbit, setOrbit] = useState(defaultOrbit);
  const orbitRef = useRef(orbit);
  orbitRef.current = orbit;
  const startRef = useRef({ az: 0, el: 0 });

  useEffect(() => {
    setOrbit(defaultOrbit);
  }, [defaultOrbit]);

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
          el: clamp(startRef.current.el + g.dy * 0.005, 0.18, 1.48),
        }));
      },
    })
  ).current;

  const resetView = useCallback(() => {
    setOrbit(defaultOrbit);
  }, [defaultOrbit]);

  const topView = useCallback(() => {
    setOrbit({ az: 0, el: 1.46, dist: 2.1 });
  }, []);

  const isoView = useCallback(() => {
    setOrbit({ az: -0.45, el: 0.65, dist: 2.5 });
  }, []);

  const zoom = useCallback((delta) => {
    setOrbit((o) => ({ ...o, dist: clamp(o.dist + delta, 1.2, 4.8) }));
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      <SceneBoundary
        fallback={(error) => (
          <View style={styles.errorWrap}>
            <Text style={styles.errorTitle}>3D Plant Physiology Bench Failed</Text>
            <Text style={styles.errorDetail}>{String(error?.message || error)}</Text>
          </View>
        )}
      >
        <Canvas
          style={StyleSheet.absoluteFill}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 42, near: 0.1, far: 80 }}
          onCreated={(state) => {
            state.gl.setClearColor('#F5EFE4');
          }}
        >
          <CameraRig
            orbit={orbit}
            target={activeModule === 'transpiration' ? [0, 0.15, 0] : [0, 0.05, 0]}
          />

          {/* Laboratory Illumination */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 9, 5]} intensity={1.3} color="#FFFDF6" castShadow />
          <directionalLight position={[-4, 7, -3]} intensity={0.65} color="#E8F2FE" />
          <pointLight position={[0, 3, 0]} intensity={0.8} color="#FFF5D8" />

          {/* Grounded Laboratory Tabletop */}
          <WorkbenchFloor />

          {/* Modules 1 & 2: Plasmolysis & Stomata on Microscope Stage */}
          {(activeModule === 'plasmolysis' || activeModule === 'stomata') && (
            <MicroscopeMechanicalStage>
              {activeModule === 'plasmolysis' && (
                <PlasmolysisCellularGrid vacuoleRatio={vacuoleRatio} />
              )}
              {activeModule === 'stomata' && (
                <StomatalComplex3D
                  leafType={leafType}
                  surface={surface}
                  aperture={stomatalAperture}
                  showFOVGrid={showFOVGrid}
                />
              )}
            </MicroscopeMechanicalStage>
          )}

          {/* Module 3: Transpiration Potted Plant Apparatus */}
          {activeModule === 'transpiration' && (
            <TranspirationApparatus3D
              upperHydration={upperHydration}
              lowerHydration={lowerHydration}
              activeSpeed={speedMultiplier}
              viewAngle={viewAngle}
            />
          )}
        </Canvas>
      </SceneBoundary>

      {/* Pan responder for touch & mouse drag rotation */}
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} pointerEvents="box-only" />

      {/* Floating UI Overlay */}
      {overlay ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {overlay}
        </View>
      ) : null}

      {/* Viewport Controls */}
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
          onPress={topView}
        >
          <Text style={styles.hudGlyphSmall}>TOP</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.hudBtn, pressed && { opacity: 0.7 }]}
          onPress={isoView}
        >
          <Text style={styles.hudGlyphSmall}>ISO</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.hudBtn, pressed && { opacity: 0.7 }]}
          onPress={resetView}
        >
          <Text style={styles.hudGlyph}>⟲</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5EFE4',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: color.hairline,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
  },
  hudButtons: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 5,
    alignItems: 'center',
    zIndex: 25,
  },
  hudBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 253, 248, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hudGlyph: {
    fontFamily: font.bold,
    fontSize: 14,
    color: color.inkStrong,
    lineHeight: 16,
  },
  hudGlyphSmall: {
    fontFamily: font.bold,
    fontSize: 8.5,
    color: color.inkStrong,
    letterSpacing: 0.5,
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
