import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import {
  Eyebrow,
  GoldButton,
  GhostButton,
  Segmented,
} from '../../components/ui';
import PlantPhysiologyScene3D from './PlantPhysiologyScene3D';
import NCERTKnowledgeCards from './NCERTKnowledgeCards';
import {
  PLASMOLYSIS_STEPS,
  STOMATA_STEPS,
  TRANSPIRATION_STEPS,
} from './steps';
import {
  calculateVacuoleRatio,
  getPlasmolysisStage,
  calculateStomatalIndex,
  calculateCobaltPaperHydration,
  getCobaltPaperHexColor,
} from './physics';

export default function GuidedFlow({ errorConfig, profile, onComplete }) {
  const [activeModule, setActiveModule] = useState('plasmolysis');
  const [stepIndex, setStepIndex] = useState(0);
  const [theoryTopicId, setTheoryTopicId] = useState(null);

  // Module 1 Plasmolysis State
  const [activeSolution, setActiveSolution] = useState(null);
  const [vacuoleRatio, setVacuoleRatio] = useState(1.0);
  const [plasmolysisTimer, setPlasmolysisTimer] = useState(0);

  // Module 2 Stomata State
  const [leafType, setLeafType] = useState('dicot');
  const [surface, setSurface] = useState('lower');
  const [stomataCount, setStomataCount] = useState('');
  const [epidermalCount, setEpidermalCount] = useState('');
  const [userIndexInput, setUserIndexInput] = useState('');
  const [stomatalIndexResult, setStomatalIndexResult] = useState(null);
  const [showFOVGrid, setShowFOVGrid] = useState(true);

  // Module 3 Transpiration State
  const [isRunningTranspiration, setIsRunningTranspiration] = useState(false);
  const [transpirationTime, setTranspirationTime] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(5);
  const [upperHydration, setUpperHydration] = useState(0);
  const [lowerHydration, setLowerHydration] = useState(0);
  const [transpirationViewAngle, setTranspirationViewAngle] = useState('upper');

  // Quiz States
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});

  // Module steps mapping
  const stepsList =
    activeModule === 'plasmolysis'
      ? PLASMOLYSIS_STEPS
      : activeModule === 'stomata'
      ? STOMATA_STEPS
      : TRANSPIRATION_STEPS;

  const currentStep = stepsList[stepIndex] || stepsList[0];

  // Plasmolysis animation ticker
  useEffect(() => {
    let interval = null;
    if (activeModule === 'plasmolysis' && activeSolution) {
      interval = setInterval(() => {
        setPlasmolysisTimer((t) => {
          const next = t + 0.2;
          setVacuoleRatio(calculateVacuoleRatio(activeSolution, next));
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeModule, activeSolution]);

  // Transpiration time-lapse ticker
  useEffect(() => {
    let interval = null;
    if (activeModule === 'transpiration' && isRunningTranspiration) {
      interval = setInterval(() => {
        setTranspirationTime((t) => {
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

  // Handle module switch
  const switchModule = (modId) => {
    setActiveModule(modId);
    setStepIndex(0);
    setActiveSolution(null);
    setVacuoleRatio(1.0);
    setPlasmolysisTimer(0);
    setIsRunningTranspiration(false);
    setTranspirationTime(0);
    setUpperHydration(0);
    setLowerHydration(0);
  };

  // Plasmolysis triggers
  const handleApplyHypertonic = () => {
    setActiveSolution('hypertonic_salt');
    setPlasmolysisTimer(0);
  };

  const handleApplyWater = () => {
    setActiveSolution('hypotonic_water');
    setPlasmolysisTimer(0);
  };

  // Stomatal Index validation
  const handleVerifyStomatalIndex = () => {
    const calc = calculateStomatalIndex(stomataCount, epidermalCount);
    const userVal = parseFloat(userIndexInput);
    const isClose = Math.abs(calc - userVal) <= 1.0;
    setStomatalIndexResult({
      calculated: calc,
      userVal,
      isCorrect: isClose,
    });
  };

  // Submit quiz answer
  const handleAnswerSubmit = () => {
    setSubmittedAnswers((prev) => ({
      ...prev,
      [`${activeModule}_${stepIndex}`]: true,
    }));
  };

  const currentPlasmolysisStage = getPlasmolysisStage(vacuoleRatio);
  const upperHex = getCobaltPaperHexColor(upperHydration);
  const lowerHex = getCobaltPaperHexColor(lowerHydration);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Module Selector Segmented Tabs */}
      <View style={{ gap: 6 }}>
        <Eyebrow tone={color.biology}>NCERT Class 11 Plant Physiology Laboratory</Eyebrow>
        <Segmented
          value={activeModule}
          onChange={switchModule}
          options={[
            { value: 'plasmolysis', label: '1. Plasmolysis' },
            { value: 'stomata', label: '2. Stomata' },
            { value: 'transpiration', label: '3. Transpiration' },
          ]}
        />
      </View>

      {/* Step Progress Tracker */}
      <View style={styles.progressRow}>
        {stepsList.map((s, idx) => (
          <Pressable
            key={s.id}
            style={[
              styles.stepPill,
              idx === stepIndex && styles.stepPillActive,
              idx < stepIndex && styles.stepPillDone,
            ]}
            onPress={() => setStepIndex(idx)}
          >
            <Text
              style={[
                styles.stepPillText,
                idx === stepIndex && styles.stepPillTextActive,
                idx < stepIndex && styles.stepPillTextDone,
              ]}
            >
              {idx + 1}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Step Header */}
      <View style={{ gap: 4 }}>
        <View style={styles.stepTitleRow}>
          <Eyebrow tone={color.brass}>Step {stepIndex + 1} of {stepsList.length}</Eyebrow>
          <Pressable onPress={() => setTheoryTopicId(activeModule)} hitSlop={10}>
            <Text style={styles.theoryLink}>📖 View NCERT Theory</Text>
          </Pressable>
        </View>
        <Text style={type.title}>{currentStep.title}</Text>
        <Text style={[type.body, { color: color.inkSoft }]}>{currentStep.instruction}</Text>
      </View>

      {/* 3D Visual Simulation Viewport */}
      <PlantPhysiologyScene3D
        height={320}
        activeModule={activeModule}
        vacuoleRatio={vacuoleRatio}
        leafType={leafType}
        surface={surface}
        showFOVGrid={showFOVGrid}
        upperHydration={upperHydration}
        lowerHydration={lowerHydration}
        speedMultiplier={speedMultiplier}
        viewAngle={transpirationViewAngle}
        overlay={
          activeModule === 'plasmolysis' ? (
            <View style={styles.telemetryCard}>
              <Text style={styles.telemTitle}>Cellular State</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: currentPlasmolysisStage.badgeColor + '22' },
                ]}
              >
                <Text
                  style={[styles.statusText, { color: currentPlasmolysisStage.badgeColor }]}
                >
                  {currentPlasmolysisStage.stage}
                </Text>
              </View>
              <Text style={styles.telemDetail}>
                Vacuole Volume: {Math.round(vacuoleRatio * 100)}%
              </Text>
            </View>
          ) : activeModule === 'transpiration' ? (
            <View style={styles.telemetryCard}>
              <Text style={styles.telemTitle}>Transpiration Progress</Text>
              <Text style={styles.timerVal}>{Math.round(transpirationTime)} s</Text>
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
                Surface: {surface === 'lower' ? 'Abaxial (Lower)' : 'Adaxial (Upper)'}
              </Text>
            </View>
          )
        }
      />

      {/* Interactive Module Specific Controls */}
      {activeModule === 'plasmolysis' && (
        <View style={styles.controlBox}>
          <Eyebrow tone={color.biology}>Reagent Dropper Interaction</Eyebrow>
          <View style={styles.btnRow}>
            <GoldButton
              label={activeSolution === 'hypertonic_salt' ? 'Plasmolysing...' : '💧 Apply 10% Hypertonic NaCl'}
              onPress={handleApplyHypertonic}
              compact
            />
            <GhostButton
              label={activeSolution === 'hypotonic_water' ? 'Deplasmolysing...' : '💧 Apply Hypotonic Water'}
              onPress={handleApplyWater}
              compact
            />
          </View>
          <Text style={type.bodySoft}>{currentPlasmolysisStage.description}</Text>
        </View>
      )}

      {activeModule === 'stomata' && (
        <View style={styles.controlBox}>
          <Eyebrow tone={color.green}>Stomatal Counting & Index Calculator</Eyebrow>
          <View style={styles.toggleRow}>
            <Segmented
              value={leafType}
              onChange={setLeafType}
              options={[
                { value: 'dicot', label: 'Dicot (Hibiscus)' },
                { value: 'monocot', label: 'Monocot (Maize)' },
              ]}
            />
            <Segmented
              value={surface}
              onChange={setSurface}
              options={[
                { value: 'lower', label: 'Lower (Abaxial)' },
                { value: 'upper', label: 'Upper (Adaxial)' },
              ]}
            />
          </View>

          <View style={styles.calcGrid}>
            <View style={styles.calcCol}>
              <Text style={styles.inputLabel}>Stomata (S)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 24"
                value={stomataCount}
                onChangeText={setStomataCount}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.calcCol}>
              <Text style={styles.inputLabel}>Epidermal Cells (E)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 96"
                value={epidermalCount}
                onChangeText={setEpidermalCount}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.calcCol}>
              <Text style={styles.inputLabel}>Your Index I (%)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.0"
                value={userIndexInput}
                onChangeText={setUserIndexInput}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.btnRow}>
            <GoldButton
              label="Compute & Verify Stomatal Index"
              onPress={handleVerifyStomatalIndex}
              compact
            />
            <GhostButton
              label={showFOVGrid ? 'Hide Graticule Grid' : 'Show Graticule Grid'}
              onPress={() => setShowFOVGrid((g) => !g)}
              compact
            />
          </View>

          {stomatalIndexResult && (
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: stomatalIndexResult.isCorrect
                    ? 'rgba(47, 142, 108, 0.12)'
                    : 'rgba(178, 52, 40, 0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.resultTitle,
                  { color: stomatalIndexResult.isCorrect ? color.green : color.red },
                ]}
              >
                {stomatalIndexResult.isCorrect ? '✓ Correct Stomatal Index' : '✕ Index Mismatch'}
              </Text>
              <Text style={styles.resultText}>
                Calculated Formula I = [S / (S + E)] × 100 = {stomatalIndexResult.calculated}%
              </Text>
            </View>
          )}
        </View>
      )}

      {activeModule === 'transpiration' && (
        <View style={styles.controlBox}>
          <Eyebrow tone={color.chemistry}>Cobalt Chloride Paper Hydration Comparison</Eyebrow>

          {/* Side by side strip color swatches */}
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
              <Text style={styles.swatchSubtext}>Rapid (~25s) · Dense Stomata</Text>
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
                  ? '▶ Restart Time-Lapse'
                  : '▶ Start Time-Lapse'
              }
              onPress={() => {
                if (!isRunningTranspiration && upperHydration >= 0.995 && lowerHydration >= 0.995) {
                  setTranspirationTime(0);
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
                setTranspirationTime(0);
                setUpperHydration(0);
                setLowerHydration(0);
              }}
              compact
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
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

      {/* Checkpoint Question */}
      {currentStep.checkpointQuestion && (
        <View style={styles.quizCard}>
          <Eyebrow tone={color.brass}>NCERT Checkpoint Question</Eyebrow>
          <Text style={styles.quizQuestion}>{currentStep.checkpointQuestion.question}</Text>

          <View style={styles.optionList}>
            {currentStep.checkpointQuestion.options.map((opt, optIdx) => {
              const quizKey = `${activeModule}_${stepIndex}`;
              const isSelected = selectedAnswers[quizKey] === optIdx;
              const isSubmitted = submittedAnswers[quizKey];
              const isCorrect = optIdx === currentStep.checkpointQuestion.correctIndex;

              return (
                <Pressable
                  key={optIdx}
                  disabled={isSubmitted}
                  onPress={() =>
                    setSelectedAnswers((prev) => ({
                      ...prev,
                      [quizKey]: optIdx,
                    }))
                  }
                  style={[
                    styles.optionBtn,
                    isSelected && styles.optionBtnSelected,
                    isSubmitted && isCorrect && styles.optionBtnCorrect,
                    isSubmitted && isSelected && !isCorrect && styles.optionBtnWrong,
                  ]}
                >
                  <View style={styles.radioDot}>
                    {isSelected && <View style={styles.radioFill} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                      isSubmitted && isCorrect && styles.optionTextCorrect,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!submittedAnswers[`${activeModule}_${stepIndex}`] ? (
            <GhostButton
              label="Submit Answer"
              disabled={selectedAnswers[`${activeModule}_${stepIndex}`] === undefined}
              onPress={handleAnswerSubmit}
              compact
              style={{ marginTop: 8 }}
            />
          ) : (
            <View style={styles.expBox}>
              <Text style={styles.expTitle}>
                {selectedAnswers[`${activeModule}_${stepIndex}`] ===
                currentStep.checkpointQuestion.correctIndex
                  ? '✓ Correct Assessment'
                  : '✕ Incorrect'}
              </Text>
              <Text style={styles.expText}>{currentStep.checkpointQuestion.explanation}</Text>
            </View>
          )}
        </View>
      )}

      {/* Step Navigation Bar */}
      <View style={styles.navRow}>
        <GhostButton
          label="← Previous"
          disabled={stepIndex === 0}
          onPress={() => setStepIndex(stepIndex - 1)}
          compact
        />

        {stepIndex < stepsList.length - 1 ? (
          <GoldButton
            label="Next Step →"
            onPress={() => setStepIndex(stepIndex + 1)}
            compact
          />
        ) : (
          <GoldButton
            label="✓ Complete Module"
            onPress={() => {
              if (onComplete) {
                onComplete({
                  module: activeModule,
                  completedAt: new Date().toISOString(),
                });
              }
            }}
            compact
          />
        )}
      </View>

      {/* NCERT Knowledge Drawer Modal */}
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
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 4,
  },
  stepPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(28, 24, 21, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillActive: {
    backgroundColor: color.brass,
  },
  stepPillDone: {
    backgroundColor: color.biology,
  },
  stepPillText: {
    fontFamily: font.bold,
    fontSize: 12,
    color: color.inkMuted,
  },
  stepPillTextActive: {
    color: '#FFFDF8',
  },
  stepPillTextDone: {
    color: '#FFFDF8',
  },
  stepTitleRow: {
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
  toggleRow: {
    gap: 8,
  },
  calcGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  calcCol: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontFamily: font.medium,
    fontSize: 10.5,
    color: color.inkMuted,
  },
  textInput: {
    height: 34,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.18)',
    borderRadius: radius.chip,
    backgroundColor: '#FAF5EE',
    textAlign: 'center',
    fontFamily: font.bold,
    fontSize: 12.5,
    color: color.inkStrong,
  },
  resultCard: {
    padding: 10,
    borderRadius: radius.tile,
    gap: 2,
  },
  resultTitle: {
    fontFamily: font.bold,
    fontSize: 11.5,
  },
  resultText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: color.inkSoft,
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
  quizCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
    gap: 10,
  },
  quizQuestion: {
    fontFamily: font.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: color.inkStrong,
  },
  optionList: {
    gap: 6,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: radius.tile,
    backgroundColor: 'rgba(28, 24, 21, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.08)',
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(150, 102, 47, 0.09)',
    borderColor: color.brass,
  },
  optionBtnCorrect: {
    backgroundColor: 'rgba(47, 142, 108, 0.12)',
    borderColor: color.green,
  },
  optionBtnWrong: {
    backgroundColor: 'rgba(178, 52, 40, 0.1)',
    borderColor: color.red,
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: color.inkMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.brass,
  },
  optionText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: color.inkBody,
  },
  optionTextSelected: {
    fontFamily: font.semibold,
    color: color.inkStrong,
  },
  optionTextCorrect: {
    color: color.green,
    fontFamily: font.bold,
  },
  expBox: {
    backgroundColor: '#F7F3EB',
    borderRadius: radius.tile,
    padding: 10,
    marginTop: 6,
  },
  expTitle: {
    fontFamily: font.bold,
    fontSize: 11,
    color: color.inkStrong,
    marginBottom: 2,
  },
  expText: {
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 16,
    color: color.inkSoft,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
