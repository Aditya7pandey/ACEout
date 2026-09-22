import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GhostButton, GoldButton, Segmented } from '../../components/ui';
import PlantPhysiologyScene3D from './PlantPhysiologyScene3D';
import NCERTKnowledgeCards from './NCERTKnowledgeCards';
import {
  calculateVacuoleRatio,
  getPlasmolysisStage,
  calculateCobaltPaperHydration,
  getCobaltPaperHexColor,
} from './physics';

export default function FreePlay({ errorConfig, profile }) {
  const [activeModule, setActiveModule] = useState('plasmolysis');
  const [theoryTopicId, setTheoryTopicId] = useState(null);

  // Module 1 Plasmolysis Sandbox
  const [activeSolution, setActiveSolution] = useState('hypertonic_salt');
  const [vacuoleRatio, setVacuoleRatio] = useState(1.0);
  const [isPlasmolysing, setIsPlasmolysing] = useState(false);
  const [timer1, setTimer1] = useState(0);

  // Module 2 Stomata Sandbox
  const [leafType, setLeafType] = useState('dicot');
  const [surface, setSurface] = useState('lower');
  const [aperture, setAperture] = useState(0.6);
  const [showFOVGrid, setShowFOVGrid] = useState(true);

  // Module 3 Transpiration Sandbox
  const [isRunningTranspiration, setIsRunningTranspiration] = useState(false);
  const [timer3, setTimer3] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(5);
  const [upperHydration, setUpperHydration] = useState(0);
  const [lowerHydration, setLowerHydration] = useState(0);
  const [transpirationViewAngle, setTranspirationViewAngle] = useState('upper');

  // Plasmolysis animation ticker
  useEffect(() => {
    let interval = null;
    if (activeModule === 'plasmolysis' && isPlasmolysing) {
      interval = setInterval(() => {
        setTimer1((t) => {
          const next = t + 0.2;
          setVacuoleRatio(calculateVacuoleRatio(activeSolution, next));
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeModule, isPlasmolysing, activeSolution]);

  // Transpiration time-lapse ticker
  useEffect(() => {
    let interval = null;
    if (activeModule === 'transpiration' && isRunningTranspiration) {
      interval = setInterval(() => {
        setTimer3((t) => {
          const next = t + 1 * speedMultiplier;
          const uHyd = calculateCobaltPaperHydration('upper', next, 1);
          const lHyd = calculateCobaltPaperHydration('lower', next, 1);

          if (uHyd >= 0.995 && lHyd >= 0.995) {
            setUpperHydration(1.0);
            setLowerHydration(1.0);
            setIsRunningTranspiration(false);
            return next;
          }

          setUpperHydration(uHyd);
          setLowerHydration(lHyd);
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeModule, isRunningTranspiration, speedMultiplier]);

  const currentStage = getPlasmolysisStage(vacuoleRatio);
  const upperHex = getCobaltPaperHexColor(upperHydration);
  const lowerHex = getCobaltPaperHexColor(lowerHydration);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Module Selector Segmented Tabs */}
      <View style={{ gap: 6 }}>
        <View style={styles.headerRow}>
          <Eyebrow tone={color.brass}>Plant Physiology Sandbox & Laboratory</Eyebrow>
          <Pressable onPress={() => setTheoryTopicId(activeModule)} hitSlop={10}>
            <Text style={styles.theoryLink}>📖 NCERT Theory</Text>
          </Pressable>
        </View>
        <Segmented
          value={activeModule}
          onChange={(m) => {
            setActiveModule(m);
            setIsPlasmolysing(false);
            setIsRunningTranspiration(false);
          }}
          options={[
            { value: 'plasmolysis', label: '1. Plasmolysis' },
            { value: 'stomata', label: '2. Stomata' },
            { value: 'transpiration', label: '3. Transpiration' },
          ]}
        />
      </View>

      {/* 3D Visual Simulation Viewport */}
      <PlantPhysiologyScene3D
        height={340}
        activeModule={activeModule}
        vacuoleRatio={vacuoleRatio}
        leafType={leafType}
        surface={surface}
        stomatalAperture={aperture}
        showFOVGrid={showFOVGrid}
        upperHydration={upperHydration}
        lowerHydration={lowerHydration}
        speedMultiplier={speedMultiplier}
        viewAngle={transpirationViewAngle}
        overlay={
          activeModule === 'plasmolysis' ? (
            <View style={styles.telemetryCard}>
              <Text style={styles.telemTitle}>Osmotic State</Text>
              <View style={[styles.statusBadge, { backgroundColor: currentStage.badgeColor + '22' }]}>
                <Text style={[styles.statusText, { color: currentStage.badgeColor }]}>
                  {currentStage.stage}
                </Text>
              </View>
              <Text style={styles.telemDetail}>
                Vacuole Volume: {Math.round(vacuoleRatio * 100)}%
              </Text>
            </View>
          ) : activeModule === 'transpiration' ? (
            <View style={styles.telemetryCard}>
              <Text style={styles.telemTitle}>Transpiration Progress</Text>
              <Text style={styles.timerVal}>{Math.round(timer3)} s</Text>
              <View style={styles.swatchMiniRow}>
                <View style={[styles.swatchBoxMini, { backgroundColor: lowerHex }]} />
                <Text style={styles.swatchMiniText}>
                  Lower: {Math.round(lowerHydration * 100)}%
                </Text>
              </View>
              <View style={styles.swatchMiniRow}>
                <View style={[styles.swatchBoxMini, { backgroundColor: upperHex }]} />
                <Text style={styles.swatchMiniText}>
                  Upper: {Math.round(upperHydration * 100)}%
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.telemetryCard}>
              <Text style={styles.telemTitle}>Microscope FOV</Text>
              <Text style={styles.telemDetail}>
                Leaf: {leafType === 'dicot' ? 'Dicot (Hibiscus)' : 'Monocot (Maize)'}
              </Text>
              <Text style={styles.telemDetail}>
                Pore Aperture: {Math.round(aperture * 100)}%
              </Text>
            </View>
          )
        }
      />

      {/* Module 1 Sandbox Controls */}
      {activeModule === 'plasmolysis' && (
        <View style={styles.controlBox}>
          <Eyebrow tone={color.biology}>Plasmolysis Reagent Application</Eyebrow>
          <View style={styles.btnRow}>
            <GoldButton
              label={isPlasmolysing && activeSolution === 'hypertonic_salt' ? 'Plasmolysing...' : '💧 Apply 10% NaCl'}
              onPress={() => {
                setActiveSolution('hypertonic_salt');
                setTimer1(0);
                setIsPlasmolysing(true);
              }}
              compact
            />
            <GoldButton
              label={isPlasmolysing && activeSolution === 'hypertonic_sugar' ? 'Plasmolysing...' : '💧 Apply 20% Sucrose'}
              onPress={() => {
                setActiveSolution('hypertonic_sugar');
                setTimer1(0);
                setIsPlasmolysing(true);
              }}
              compact
            />
            <GhostButton
              label="💧 Pure Water (Deplasmolyse)"
              onPress={() => {
                setActiveSolution('hypotonic_water');
                setTimer1(0);
                setIsPlasmolysing(true);
              }}
              compact
            />
          </View>
          <Text style={type.bodySoft}>{currentStage.description}</Text>
        </View>
      )}

      {/* Module 2 Sandbox Controls */}
      {activeModule === 'stomata' && (
        <View style={styles.controlBox}>
          <Eyebrow tone={color.green}>Stomatal Complex & FOV Calibration</Eyebrow>
          <Segmented
            value={leafType}
            onChange={setLeafType}
            options={[
              { value: 'dicot', label: 'Dicot (Hibiscus rosa-sinensis)' },
              { value: 'monocot', label: 'Monocot (Zea mays / Grass)' },
            ]}
          />
          <Segmented
            value={surface}
            onChange={setSurface}
            options={[
              { value: 'lower', label: 'Lower (Abaxial) Surface' },
              { value: 'upper', label: 'Upper (Adaxial) Surface' },
            ]}
          />
          <View style={styles.btnRow}>
            <GhostButton
              label={showFOVGrid ? 'Hide 10×10 Grid Reticle' : 'Show 10×10 Grid Reticle'}
              onPress={() => setShowFOVGrid((g) => !g)}
              compact
            />
            <GhostButton
              label={aperture > 0.4 ? 'Close Stomatal Pore' : 'Open Stomatal Pore'}
              onPress={() => setAperture((a) => (a > 0.4 ? 0.1 : 0.85))}
              compact
            />
          </View>
        </View>
      )}

      {/* Module 3 Sandbox Controls */}
      {activeModule === 'transpiration' && (
        <View style={styles.controlBox}>
          <Eyebrow tone={color.chemistry}>Cobalt Chloride Paper Color Transition</Eyebrow>

          {/* Real-time Visual Color Swatches for Upper vs Lower */}
          <View style={styles.swatchComparisonCard}>
            <View style={styles.swatchColumn}>
              <Text style={styles.swatchLabel}>Lower (Abaxial) Strip</Text>
              <View style={[styles.swatchIndicator, { backgroundColor: lowerHex }]}>
                <Text style={styles.swatchIndicatorText}>
                  {Math.round(lowerHydration * 100)}%
                </Text>
              </View>
              <Text style={styles.swatchStatus}>
                {lowerHydration < 0.25 ? '🟦 Dry Blue' : lowerHydration < 0.75 ? '🟪 Hydrating Mauve' : '🌸 Hydrated Pink'}
              </Text>
              <Text style={styles.swatchSubtext}>Fast (~25s) · Dense Stomata</Text>
            </View>

            <View style={styles.swatchDivider} />

            <View style={styles.swatchColumn}>
              <Text style={styles.swatchLabel}>Upper (Adaxial) Strip</Text>
              <View style={[styles.swatchIndicator, { backgroundColor: upperHex }]}>
                <Text style={styles.swatchIndicatorText}>
                  {Math.round(upperHydration * 100)}%
                </Text>
              </View>
              <Text style={styles.swatchStatus}>
                {upperHydration < 0.25 ? '🟦 Dry Blue' : upperHydration < 0.75 ? '🟪 Hydrating Mauve' : '🌸 Hydrated Pink'}
              </Text>
              <Text style={styles.swatchSubtext}>Slow (~120s) · Few/No Stomata</Text>
            </View>
          </View>

          {/* View Perspective Selector */}
          <Segmented
            value={transpirationViewAngle}
            onChange={setTranspirationViewAngle}
            options={[
              { value: 'upper', label: 'Upper (Adaxial) View' },
              { value: 'lower', label: 'Lower (Abaxial) View' },
              { value: 'dual', label: 'Apparatus Side View' },
            ]}
          />

          <View style={styles.btnRow}>
            <GoldButton
              label={
                isRunningTranspiration
                  ? '⏸ Pause Time-Lapse'
                  : upperHydration >= 0.995 && lowerHydration >= 0.995
                  ? '▶ Restart Transpiration'
                  : '▶ Start Transpiration'
              }
              onPress={() => {
                if (!isRunningTranspiration && upperHydration >= 0.995 && lowerHydration >= 0.995) {
                  setTimer3(0);
                  setUpperHydration(0);
                  setLowerHydration(0);
                }
                setIsRunningTranspiration((r) => !r);
              }}
              compact
            />
            <GhostButton
              label="Reset Strips"
              onPress={() => {
                setIsRunningTranspiration(false);
                setTimer3(0);
                setUpperHydration(0);
                setLowerHydration(0);
              }}
              compact
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Text style={styles.speedLabel}>Time-Lapse Speed:</Text>
            {[1, 5, 10, 20].map((spd) => (
              <Pressable
                key={spd}
                style={[styles.speedBtn, speedMultiplier === spd && styles.speedBtnActive]}
                onPress={() => setSpeedMultiplier(spd)}
              >
                <Text
                  style={[
                    styles.speedBtnText,
                    speedMultiplier === spd && styles.speedBtnTextActive,
                  ]}
                >
                  {spd}×
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* NCERT Knowledge Cards Modal */}
      {theoryTopicId && (
        <NCERTKnowledgeCards
          topicId={theoryTopicId}
          onClose={() => setTheoryTopicId(null)}
          onSelectTopic={(t) => setTheoryTopicId(t)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  theoryLink: {
    fontFamily: font.bold,
    fontSize: 11,
    color: color.brass,
  },
  telemetryCard: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    borderRadius: radius.tile,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  telemTitle: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.inkMuted,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusText: {
    fontFamily: font.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  telemDetail: {
    fontFamily: font.medium,
    fontSize: 11,
    color: color.inkStrong,
  },
  timerVal: {
    fontFamily: font.bold,
    fontSize: 16,
    color: color.chemistry,
  },
  swatchMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  swatchBoxMini: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  swatchMiniText: {
    fontFamily: font.medium,
    fontSize: 10.5,
    color: color.inkStrong,
  },
  controlBox: {
    backgroundColor: '#FFFDF8',
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
    gap: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  swatchComparisonCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF5EE',
    borderRadius: radius.tile,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.08)',
  },
  swatchColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  swatchDivider: {
    width: 1,
    backgroundColor: 'rgba(28, 24, 21, 0.1)',
    marginHorizontal: 8,
  },
  swatchLabel: {
    fontFamily: font.bold,
    fontSize: 11,
    color: color.inkStrong,
  },
  swatchIndicator: {
    width: 56,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  swatchIndicatorText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: '#FFFDF8',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  swatchStatus: {
    fontFamily: font.semibold,
    fontSize: 10.5,
    color: color.inkBody,
  },
  swatchSubtext: {
    fontFamily: font.regular,
    fontSize: 9.5,
    color: color.inkMuted,
  },
  speedLabel: {
    fontFamily: font.medium,
    fontSize: 11,
    color: color.inkMuted,
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28, 24, 21, 0.05)',
  },
  speedBtnActive: {
    backgroundColor: color.chemistry,
  },
  speedBtnText: {
    fontFamily: font.bold,
    fontSize: 10.5,
    color: color.inkStrong,
  },
  speedBtnTextActive: {
    color: '#FFFDF8',
  },
});
