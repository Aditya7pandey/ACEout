import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { color, font, radius, type } from '../../theme';
import { Eyebrow, GoldButton, Annotation, withAlpha } from '../../components/ui';
import DataTable from '../../measure/DataTable';
import { useLabLayout } from '../useLabLayout';
import { NORMAL_NEAR_CM, fmt, fmtSigned } from './optics';
import { INSTRUMENTS, combineSigFigs } from '../../measure/leastCount';

const BENCH = INSTRUMENTS.metreScale;

/**
 * What the three readings were actually for.
 *
 * Deliberately short. The bench is where the learning happens; this page only
 * has to show them the two prescriptions their own three distances just bought.
 * Every number here is derived from the student's table — the simulation's true
 * near and far points are never printed. Record a far point of 38.6 cm and the
 * prescription on this page is the prescription for 38.6 cm.
 */
export default function TheoryReport({ rows, onComplete }) {
  const layout = useLabLayout();

  const byKey = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.stationKey, r])),
    [rows]
  );

  const sf = useMemo(
    () => combineSigFigs(...rows.map((r) => r.sf)) || 3,
    [rows]
  );

  const columns = [
    { key: 'eye', label: 'Eye', width: 136 },
    { key: 'limit', label: 'Limit measured', width: 104 },
    { key: 'reading', label: 'Reading', unit: 'cm', width: 78 },
    { key: 'defect', label: 'Defect', width: 124, derived: true, divider: true },
    { key: 'lens', label: 'Corrective lens', width: 138, derived: true },
    { key: 'power', label: 'Power', unit: 'dioptres (D)', width: 92, derived: true },
  ];

  const tableRows = rows.map((r) => ({
    eye: r.eyeName,
    limit: r.limit,
    reading: r.readingCm.toFixed(1),
    defect:
      r.stationKey === 'normal'
        ? 'None'
        : r.stationKey === 'myopia'
        ? 'Myopia'
        : 'Hypermetropia',
    lens: r.correction.lens,
    power: r.stationKey === 'normal' ? '—' : fmtSigned(r.correction.powerD),
  }));

  const myopia = byKey.myopia;
  const hyper = byKey.hypermetropia;
  const normal = byKey.normal;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.page, layout.contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 10 }}>
        <Eyebrow tone={color.brass}>What you just measured</Eyebrow>
        <Text style={type.title}>Three distances, two prescriptions</Text>
        <Text style={styles.lede}>
          You never touched a lens on that bench — you moved an arrow and watched a point turn
          into a smear. Those three numbers are enough to grind both pairs of glasses.
        </Text>
      </View>

      <DataTable
        columns={columns}
        rows={tableRows}
        title="Your observations"
        caption={`Bench least count ${BENCH.leastCount} cm, so every reading is quoted to one decimal place. The three columns on the right are calculated from your readings — nothing here was measured for you.`}
      />

      {/* The one formula both prescriptions below run on. Everything else the
          eye does was shown on the bench and does not need restating here. */}
      <View style={styles.formulaStrip}>
        <Text style={styles.formula}>1/v − 1/u = 1/f</Text>
        <Text style={styles.formulaDot}>·</Text>
        <Text style={styles.formula}>P = 1/f</Text>
        <Text style={styles.formulaNote}>f in metres, P in dioptres</Text>
      </View>

      <View style={{ gap: 14 }}>
        <Eyebrow>Your numbers, worked through</Eyebrow>

        {myopia ? (
          <Working
            tone={color.physics}
            title="Short sight — the concave lens"
            setup={`Take an object at infinity and land its image on the far point you found, ${myopia.readingCm.toFixed(1)} cm out. With u = ∞, f is simply the far point — negative, because that image is virtual.`}
            lines={[
              `f = −${myopia.readingCm.toFixed(1)} cm = −${(myopia.readingCm / 100).toFixed(3)} m`,
              `P = 1/f = ${fmtSigned(myopia.correction.powerD)} D`,
            ]}
            verdict={`${fmtSigned(myopia.correction.powerD)} D. A negative number on a prescription always means short sight.`}
          />
        ) : null}

        {hyper ? (
          <Working
            tone={color.biology}
            title="Long sight — the convex lens"
            setup={`Take a page at a comfortable ${NORMAL_NEAR_CM} cm and throw its image out to the near point you found, ${hyper.readingCm.toFixed(1)} cm, where this eye can reach it.`}
            lines={[
              `u = −${NORMAL_NEAR_CM} cm,  v = −${hyper.readingCm.toFixed(1)} cm`,
              `1/f = 1/${NORMAL_NEAR_CM} − 1/${hyper.readingCm.toFixed(1)}`,
              `f = ${fmt(hyper.correction.fCm)} cm,  P = ${fmtSigned(hyper.correction.powerD)} D`,
            ]}
            verdict={`${fmtSigned(hyper.correction.powerD)} D. A positive number always means long sight.`}
          />
        ) : null}
      </View>

      <Annotation label="What your readings are worth" tone={color.brass}>
        <Text style={styles.noteBody}>
          {`The bench resolves ${BENCH.leastCount} cm, so each reading carries ${sf} significant figures and no power above is quoted to more.${
            normal
              ? ` Your healthy eye came out at ${normal.readingCm.toFixed(1)} cm against the textbook ${NORMAL_NEAR_CM} cm — a blur that has only just appeared is a judgement call, and always will be.`
              : ''
          }`}
        </Text>
      </Annotation>

      <GoldButton
        label="Finish and log this lab"
        onPress={() =>
          onComplete({
            data: rows.map((r) => ({
              station: r.stationKey,
              limit: r.limit,
              readingCm: r.readingCm,
            })),
            analysis: {
              nearPointCm: normal ? normal.readingCm : null,
              farPointMyopicCm: myopia ? myopia.readingCm : null,
              nearPointHyperCm: hyper ? hyper.readingCm : null,
              myopiaPowerD: myopia ? Number(myopia.correction.powerD.toFixed(2)) : null,
              hypermetropiaPowerD: hyper ? Number(hyper.correction.powerD.toFixed(2)) : null,
            },
            sf,
          })
        }
      />
    </ScrollView>
  );
}

function Working({ tone, title, setup, lines, verdict }) {
  return (
    <View style={[styles.working, { borderLeftColor: withAlpha(tone, 0.5) }]}>
      <Text style={[styles.workingTitle, { color: tone }]}>{title}</Text>
      <Text style={styles.rowBody}>{setup}</Text>
      <View style={styles.workingLines}>
        {lines.map((l, i) => (
          <Text key={i} style={styles.workingLine}>
            {l}
          </Text>
        ))}
      </View>
      <Text style={[styles.verdict, { color: tone }]}>{verdict}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 44, gap: 24 },

  lede: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: color.inkSoft },
  rowBody: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: color.inkSoft },
  noteBody: { fontFamily: font.regular, fontSize: 14, lineHeight: 21.5, color: color.inkSoft },

  formulaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.chip,
    backgroundColor: color.sunk,
  },
  formula: {
    fontFamily: font.bold,
    fontSize: 17,
    letterSpacing: 0.3,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  formulaDot: { fontFamily: font.bold, fontSize: 17, color: color.inkMuted },
  formulaNote: { fontFamily: font.regular, fontSize: 13, color: color.inkMuted },

  working: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 4,
    gap: 9,
  },
  workingTitle: { fontFamily: font.bold, fontSize: 15.5, letterSpacing: -0.15 },
  workingLines: {
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    backgroundColor: color.sunk,
  },
  workingLine: {
    fontFamily: font.semibold,
    fontSize: 14.5,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  verdict: { fontFamily: font.semibold, fontSize: 14, lineHeight: 21 },
});
