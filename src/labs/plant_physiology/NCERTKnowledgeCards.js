import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { color, font, type, radius } from '../../theme';
import { Eyebrow, GhostButton } from '../../components/ui';

export const TOPICS = {
  plasmolysis: {
    id: 'plasmolysis',
    title: 'Osmosis & Plasmolysis in Plant Cells',
    chapter: 'NCERT Class 11 Biology · Chapter 11 (Plant Physiology)',
    badge: 'Cell Water Relations',
    badgeColor: color.biology,
    summary:
      'Plasmolysis is the withdrawal of the protoplast of a living plant cell from its cell wall due to excessive exosmosis of water when placed in a hypertonic solution.',
    equations: [
      'Water Potential: Ψw = Ψs + Ψp',
      'Incipient Plasmolysis: Ψp = 0  ⇒  Ψw = Ψs',
      'Full Plasmolysis: Ψp ≤ 0 (negative turgor/protoplast detachment)',
      'Deplasmolysis: Endosmosis in pure water restores Ψp > 0',
    ],
    stages: [
      {
        name: '1. Hypotonic (Turgid)',
        desc: 'Water enters by endosmosis (H₂O influx). Vacuole expands fully, pressing plasma membrane against cell wall (Maximal Turgor Pressure Ψp > 0).',
        badge: 'Ψw = High',
      },
      {
        name: '2. Isotonic (Flaccid)',
        desc: 'Net water flow is in dynamic equilibrium (H₂O in = H₂O out). Turgor pressure is zero (Ψp = 0, Incipient Plasmolysis threshold).',
        badge: 'Ψw = Equal',
      },
      {
        name: '3. Hypertonic (Plasmolyzed)',
        desc: 'Water exits rapidly by exosmosis (H₂O efflux). Protoplast shrinks into concave scallops with Hechtian strands, then rounds off completely. External solution occupies periplasmic space.',
        badge: 'Ψw = Negative',
      },
    ],
    significance:
      'Demonstrates the semi-permeability of the living plasma membrane and tonoplast vs the freely permeable nature of the dead cellulosic cell wall, and determines the osmotic pressure of plant tissue.',
  },
  stomata: {
    id: 'stomata',
    title: 'Stomatal Apparatus & K⁺ Ion Mechanism',
    chapter: 'NCERT Class 11 Biology · Chapter 6 & Chapter 11 (Anatomy & Gas Exchange)',
    badge: 'Epidermal Tissue System',
    badgeColor: color.green,
    summary:
      'Stomata are microscopic foliar pores bounded by two specialized guard cells that regulate transpiration and photosynthetic gas exchange (CO₂, O₂) driven by active K⁺ ion transport and reversible turgor changes.',
    equations: [
      'Stomatal Index: I = [ S / (S + E) ] × 100',
      'Where S = Number of Stomata in field',
      'E = Number of Epidermal Pavement Cells in same area',
      'Active Transport: K⁺ influx into guard cells  ⇒  Ψs drops  ⇒  Endosmosis  ⇒  Stoma Opens',
    ],
    stages: [
      {
        name: 'Stoma Opening (Guard Cells Swollen)',
        desc: 'K⁺ ions are actively pumped into guard cells; water flows in by endosmosis. Outer thin elastic walls bulge outward, pulling inner thick inelastic walls apart to open the aperture.',
        badge: 'Turgid / Open',
      },
      {
        name: 'Stoma Closing (Guard Cells Shrunken)',
        desc: 'K⁺ ions diffuse out into surrounding epidermal cells; water exits by exosmosis. Guard cells lose turgor, inner thick walls straighten and meet, closing the aperture.',
        badge: 'Flaccid / Closed',
      },
      {
        name: 'Dicot vs Monocot Morphology',
        desc: 'Dicots possess kidney-shaped (reniform) guard cells with radial cellulose micellation. Monocots (grasses) possess dumbbell-shaped guard cells flanked by distinct subsidiary cells.',
        badge: 'Anatomy',
      },
      {
        name: 'Dorsiventral Distribution',
        desc: 'In dicot leaves (hypostomatic), stomata are abundant on the lower (abaxial) surface and scarce on the upper (adaxial) surface to minimize evaporative water loss.',
        badge: 'Adaptation',
      },
    ],
    significance:
      'Stomatal Index is a constant diagnostic criterion in botany and pharmacognosy to detect adulteration in crude herbal medicines.',
  },
  transpiration: {
    id: 'transpiration',
    title: 'Transpiration & Cobalt Chloride Colorimetry',
    chapter: 'NCERT Class 11 Biology · Chapter 11 (Transport in Plants: Transpiration)',
    badge: 'Foliar Water Loss',
    badgeColor: color.chemistry,
    summary:
      'Transpiration is the evaporative loss of water vapor from aerial plant organs. The Cobalt Chloride (CoCl₂) paper method quantifies differential transpiration rates between upper and lower leaf surfaces.',
    equations: [
      'Color Reaction: Anhydrous Blue CoCl₂ + 6H₂O (vapor)  ⇄  Hydrated Pink CoCl₂·6H₂O',
      'Lower/Upper Transpiration Ratio: R ≈ (Stomatal Density_lower) / (Stomatal Density_upper) ≈ 4:1 to 7:1 in dicots',
      'Transpiration Flux: J = (Cw - Ca) / (rs + ra)',
    ],
    stages: [
      {
        name: '1. Cobalt Chloride Indicator Strips',
        desc: 'Filter paper strips impregnated with 3% CoCl₂ are completely dried in a desiccator until deep royal blue (anhydrous form).',
        badge: 'Anhydrous Blue',
      },
      {
        name: '2. Clamping with Glass Slides & Clips',
        desc: 'Blue paper strips are placed over both upper and lower leaf surfaces, covered with dry transparent glass slides, and securely clamped with wire clips to prevent ambient moisture interference.',
        badge: 'Apparatus',
      },
      {
        name: '3. Rapid Abaxial Pink Transition',
        desc: 'The paper on the lower (abaxial) surface turns pink much faster (typically in 2–5 mins) than the upper surface due to higher stomatal frequency.',
        badge: 'Hydrated Pink',
      },
    ],
    significance:
      'Directly proves that stomatal transpiration is the predominant pathway of foliar water loss and confirms the dorsiventral adaptation of dicot leaves.',
  },
};

// -------------------------------------------------------------
// TEXTBOOK REFERENCE 2D/3D SCHEMATIC DIAGRAMS
// -------------------------------------------------------------
function PlasmolysisDiagram() {
  return (
    <View style={styles.diagramCard}>
      <Text style={styles.diagramCardTitle}>Anatomical Reference: Plasmolysis Stages</Text>
      <View style={styles.plasmolysisStageRow}>
        {/* Stage 1: Hypotonic (Turgid) */}
        <View style={styles.stageCol}>
          <Text style={styles.stageColTitle}>Hypotonic</Text>
          <View style={[styles.cellGraphicBox, { borderColor: '#84CC16', backgroundColor: '#F7FEE7' }]}>
            {/* Vacuole */}
            <View style={[styles.graphicVacuole, { width: '84%', height: '84%', backgroundColor: '#C026D3' }]} />
            <View style={styles.graphicNucleus} />
            <Text style={styles.fluxArrowText}>H₂O ➔</Text>
          </View>
          <Text style={styles.stageColLabel}>Turgid (Ψp &gt; 0)</Text>
        </View>

        {/* Stage 2: Isotonic (Flaccid) */}
        <View style={styles.stageCol}>
          <Text style={styles.stageColTitle}>Isotonic</Text>
          <View style={[styles.cellGraphicBox, { borderColor: '#A3E635', backgroundColor: '#FCFDF5' }]}>
            {/* Vacuole */}
            <View style={[styles.graphicVacuole, { width: '68%', height: '68%', backgroundColor: '#A21CAF' }]} />
            <View style={styles.graphicNucleus} />
            <Text style={styles.fluxArrowText}>H₂O ⇄</Text>
          </View>
          <Text style={styles.stageColLabel}>Flaccid (Ψp = 0)</Text>
        </View>

        {/* Stage 3: Hypertonic (Plasmolyzed) */}
        <View style={styles.stageCol}>
          <Text style={styles.stageColTitle}>Hypertonic</Text>
          <View style={[styles.cellGraphicBox, { borderColor: '#65A30D', backgroundColor: '#FEF9C3' }]}>
            {/* Vacuole Shrunken with Hechtian Scallops */}
            <View style={[styles.graphicVacuole, { width: '38%', height: '38%', backgroundColor: '#581C87', borderRadius: 16 }]} />
            <View style={[styles.graphicNucleus, { right: 8, top: 8 }]} />
            <Text style={[styles.fluxArrowText, { color: '#EF4444' }]}>➔ H₂O</Text>
          </View>
          <Text style={styles.stageColLabel}>Plasmolyzed</Text>
        </View>
      </View>
    </View>
  );
}

function StomataDiagram() {
  return (
    <View style={styles.diagramCard}>
      <Text style={styles.diagramCardTitle}>Anatomical Reference: Stomatal Regulation</Text>
      <View style={styles.plasmolysisStageRow}>
        {/* Swollen / Open */}
        <View style={[styles.stageCol, { flex: 1 }]}>
          <Text style={[styles.stageColTitle, { color: '#166534' }]}>Guard Cells (Swollen)</Text>
          <View style={[styles.stomaGraphicBox, { backgroundColor: '#DCFCE7' }]}>
            <View style={styles.stomaKidneyPairOpen}>
              <View style={[styles.kidneyCell, { borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }]}>
                <View style={styles.kIonDot} />
                <View style={styles.kIonDot} />
                <View style={styles.chloroplastDot} />
              </View>
              {/* Open Aperture */}
              <View style={styles.openPoreAperture} />
              <View style={[styles.kidneyCell, { borderTopRightRadius: 18, borderBottomRightRadius: 18 }]}>
                <View style={styles.kIonDot} />
                <View style={styles.kIonDot} />
                <View style={styles.chloroplastDot} />
              </View>
            </View>
            <Text style={styles.stomaTag}>K⁺ & H₂O Influx (Open)</Text>
          </View>
        </View>

        {/* Shrunken / Closed */}
        <View style={[styles.stageCol, { flex: 1 }]}>
          <Text style={[styles.stageColTitle, { color: '#991B1B' }]}>Guard Cells (Shrunken)</Text>
          <View style={[styles.stomaGraphicBox, { backgroundColor: '#FEE2E2' }]}>
            <View style={styles.stomaKidneyPairClosed}>
              <View style={[styles.kidneyCellClosed, { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]}>
                <View style={styles.chloroplastDot} />
              </View>
              {/* Closed slit */}
              <View style={styles.closedPoreAperture} />
              <View style={[styles.kidneyCellClosed, { borderTopRightRadius: 10, borderBottomRightRadius: 10 }]}>
                <View style={styles.chloroplastDot} />
              </View>
            </View>
            <Text style={[styles.stomaTag, { color: '#991B1B' }]}>K⁺ & H₂O Efflux (Closed)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function TranspirationDiagram() {
  return (
    <View style={styles.diagramCard}>
      <Text style={styles.diagramCardTitle}>Apparatus Reference: Cobalt Chloride Assembly</Text>
      <View style={styles.transpirationDiagBox}>
        <View style={styles.apparatusRow}>
          <View style={styles.potGraphicMini}>
            <View style={styles.potRimMini} />
            <View style={styles.potBodyMini} />
          </View>
          <View style={styles.leafClampGraphic}>
            {/* Clamped leaf */}
            <View style={styles.leafBladeMini}>
              <View style={styles.leafMidribMini} />
              {/* Glass Slide Top */}
              <View style={styles.glassSlideMini}>
                <View style={[styles.paperStripMini, { backgroundColor: '#2563EB' }]} />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.labelsKeyRow}>
          <View style={styles.keyItem}>
            <View style={[styles.keyColorBox, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.keyText}>Dry Blue (Upper): Slow Transpiration</Text>
          </View>
          <View style={styles.keyItem}>
            <View style={[styles.keyColorBox, { backgroundColor: '#FB7185' }]} />
            <Text style={styles.keyText}>Hydrated Pink (Lower): Rapid Water Loss</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function NCERTKnowledgeCards({ topicId, onClose, onSelectTopic }) {
  const topic = TOPICS[topicId] || TOPICS.plasmolysis;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: topic.badgeColor + '22' }]}>
                <Text style={[styles.badgeText, { color: topic.badgeColor }]}>{topic.badge}</Text>
              </View>
              <Text style={styles.ncertBadge}>NCERT Class 11</Text>
            </View>
            <Text style={styles.title}>{topic.title}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Textbook Reference */}
          <View style={styles.refBox}>
            <Text style={styles.refTitle}>Curriculum Reference</Text>
            <Text style={styles.refText}>{topic.chapter}</Text>
          </View>

          {/* Interactive Visual Diagram Card */}
          {topic.id === 'plasmolysis' && <PlasmolysisDiagram />}
          {topic.id === 'stomata' && <StomataDiagram />}
          {topic.id === 'transpiration' && <TranspirationDiagram />}

          {/* Core Principle */}
          <View style={styles.section}>
            <Eyebrow tone={color.brass}>Core Principle</Eyebrow>
            <Text style={styles.descText}>{topic.summary}</Text>
          </View>

          {/* Mathematical Equations & Formulas */}
          <View style={styles.section}>
            <Eyebrow tone={color.physics}>Equations & Quantitative Relations</Eyebrow>
            <View style={styles.eqBox}>
              {topic.equations.map((eq, i) => (
                <Text key={i} style={styles.eqLine}>• {eq}</Text>
              ))}
            </View>
          </View>

          {/* Stages / Key Anatomical Breakdown */}
          <View style={styles.section}>
            <Eyebrow tone={color.biology}>Key Features & Stages</Eyebrow>
            <View style={styles.stageGrid}>
              {topic.stages.map((stg, i) => (
                <View key={i} style={styles.stageCard}>
                  <View style={styles.stageHead}>
                    <Text style={styles.stageName}>{stg.name}</Text>
                    {stg.badge && <Text style={styles.stagePill}>{stg.badge}</Text>}
                  </View>
                  <Text style={styles.stageDesc}>{stg.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Practical Significance */}
          <View style={styles.section}>
            <Eyebrow tone={color.inkMuted}>Biological & Practical Significance</Eyebrow>
            <Text style={styles.descText}>{topic.significance}</Text>
          </View>

          {/* Related Modules Quick Switcher */}
          <View style={styles.section}>
            <Eyebrow>Switch Theory Module</Eyebrow>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicRow}>
              {Object.values(TOPICS).map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.topicBtn, t.id === topic.id && styles.topicBtnActive]}
                  onPress={() => onSelectTopic && onSelectTopic(t.id)}
                >
                  <Text style={[styles.topicBtnText, t.id === topic.id && styles.topicBtnTextActive]}>
                    {t.title.split('&')[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GhostButton label="Close Theory Card" onPress={onClose} compact />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 23, 19, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: '#FFFDF8',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.14)',
    shadowColor: '#1B1713',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ncertBadge: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: color.brass,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: font.bold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: color.inkStrong,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 24, 21, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    fontFamily: font.bold,
    color: color.inkMuted,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  refBox: {
    backgroundColor: 'rgba(150, 102, 47, 0.08)',
    borderRadius: radius.tile,
    padding: 10,
    marginBottom: 14,
  },
  refTitle: {
    fontFamily: font.bold,
    fontSize: 10,
    color: color.brass,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  refText: {
    fontFamily: font.medium,
    fontSize: 12.5,
    color: color.inkStrong,
  },
  section: {
    marginBottom: 16,
    gap: 6,
  },
  descText: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 19.5,
    color: color.inkSoft,
  },
  eqBox: {
    backgroundColor: '#F7F3EB',
    borderRadius: radius.tile,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.08)',
    gap: 6,
  },
  eqLine: {
    fontFamily: font.medium,
    fontSize: 12,
    color: color.inkStrong,
    letterSpacing: 0.2,
  },
  stageGrid: {
    gap: 8,
  },
  stageCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: radius.tile,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: color.biology,
    gap: 3,
  },
  stageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageName: {
    fontFamily: font.bold,
    fontSize: 12.5,
    color: color.inkStrong,
  },
  stagePill: {
    fontFamily: font.bold,
    fontSize: 9,
    color: color.brass,
    backgroundColor: 'rgba(150, 102, 47, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stageDesc: {
    fontFamily: font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: color.inkMuted,
  },
  topicRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  topicBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28, 24, 21, 0.06)',
    marginRight: 8,
  },
  topicBtnActive: {
    backgroundColor: color.inkStrong,
  },
  topicBtnText: {
    fontFamily: font.medium,
    fontSize: 12,
    color: color.inkMuted,
  },
  topicBtnTextActive: {
    fontFamily: font.bold,
    color: '#FFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
    alignItems: 'flex-end',
  },

  // Diagram Styles
  diagramCard: {
    backgroundColor: '#FDFCFA',
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: 'rgba(28, 24, 21, 0.12)',
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  diagramCardTitle: {
    fontFamily: font.bold,
    fontSize: 11,
    color: color.inkStrong,
    letterSpacing: 0.3,
  },
  plasmolysisStageRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  stageCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stageColTitle: {
    fontFamily: font.bold,
    fontSize: 10,
    color: color.inkSoft,
  },
  cellGraphicBox: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  graphicVacuole: {
    borderRadius: 6,
    opacity: 0.85,
  },
  graphicNucleus: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D97706',
    top: 6,
    right: 6,
  },
  fluxArrowText: {
    position: 'absolute',
    bottom: 3,
    fontSize: 9,
    fontFamily: font.bold,
    color: '#0284C7',
  },
  stageColLabel: {
    fontFamily: font.medium,
    fontSize: 9.5,
    color: color.inkMuted,
    textAlign: 'center',
  },

  // Stoma graphic
  stomaGraphicBox: {
    width: '100%',
    height: 75,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stomaKidneyPairOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stomaKidneyPairClosed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  kidneyCell: {
    width: 26,
    height: 42,
    backgroundColor: '#4ADE80',
    borderWidth: 2,
    borderColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  kidneyCellClosed: {
    width: 24,
    height: 42,
    backgroundColor: '#86EFAC',
    borderWidth: 2,
    borderColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPoreAperture: {
    width: 10,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  closedPoreAperture: {
    width: 2,
    height: 28,
    backgroundColor: '#0F172A',
  },
  kIonDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  chloroplastDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#15803D',
  },
  stomaTag: {
    fontFamily: font.bold,
    fontSize: 8.5,
    color: '#166534',
  },

  // Transpiration graphic
  transpirationDiagBox: {
    gap: 8,
    padding: 4,
  },
  apparatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    height: 60,
  },
  potGraphicMini: {
    alignItems: 'center',
  },
  potRimMini: {
    width: 28,
    height: 6,
    backgroundColor: '#C2410C',
    borderRadius: 2,
  },
  potBodyMini: {
    width: 24,
    height: 28,
    backgroundColor: '#B45309',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  leafClampGraphic: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leafBladeMini: {
    width: 70,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  leafMidribMini: {
    width: 60,
    height: 2,
    backgroundColor: '#84CC16',
  },
  glassSlideMini: {
    position: 'absolute',
    width: 42,
    height: 24,
    borderRadius: 3,
    backgroundColor: 'rgba(224, 242, 254, 0.65)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperStripMini: {
    width: 32,
    height: 14,
    borderRadius: 2,
  },
  labelsKeyRow: {
    gap: 4,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keyColorBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  keyText: {
    fontFamily: font.medium,
    fontSize: 10,
    color: color.inkSoft,
  },
});
