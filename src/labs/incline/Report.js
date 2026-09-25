import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { color, font, radius, type } from '../../theme';
import { Text } from '../../i18n';
import { Eyebrow, GoldButton, Annotation, withAlpha } from '../../components/ui';
import DataTable from '../../measure/DataTable';
import { useLabLayout } from '../useLabLayout';
import { STATIONS } from './steps';
import { G_EARTH } from './physics';
import { INSTRUMENTS, combineSigFigs } from '../../measure/leastCount';

const CLOCK = INSTRUMENTS.stopwatch;

/**
 * What the two timings were actually for.
 *
 * Deliberately short — the bench is where the learning happens, and this page
 * only has to show the student what their own two numbers bought. Every value
 * here is derived from their table; the simulation's true coefficients are
 * never printed. Time a run at 0.94 s and the friction on this page is the
 * friction for 0.94 s.
 */
export default function Report({ rows, onComplete }) {
  const layout = useLabLayout();

  const sf = useMemo(() => combineSigFigs(...rows.map((r) => r.sf)) || 3, [rows]);

  const columns = [
    { key: 'surface', label: 'Running surface', width: 132 },
    { key: 'angle', label: 'Angle', unit: 'degrees', width: 74 },
    { key: 'mass', label: 'Mass', unit: 'kg', width: 70 },
    { key: 'track', label: 'Track', unit: 'cm', width: 70 },
    { key: 'time', label: 'Time', unit: 's', width: 68 },
    { key: 'accel', label: 'a = 2s/t²', unit: 'm/s²', width: 92, derived: true, divider: true },
    { key: 'mu', label: 'μ', unit: 'no units', width: 82, derived: true },
  ];

  const tableRows = rows.map((r) => ({
    surface: r.surface,
    angle: `${r.thetaDeg}`,
    mass: r.massKg.toFixed(2),
    track: `${r.trackCm}`,
    time: r.timeS.toFixed(2),
    accel: r.a.toFixed(2),
    mu: r.mu.toFixed(2),
  }));

  const byKey = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.stationKey, r])),
    [rows]
  );
  const wood = byKey.wood;
  const glass = byKey.glass;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.page, layout.contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 10 }}>
        <Eyebrow tone={color.brass}>What you just measured</Eyebrow>
        <Text style={type.title}>Two timings, two coefficients of friction</Text>
        <Text style={styles.lede}>
          You never measured a force on that bench — you set a slope and timed a block to a
          gate. That is enough: the clock alone gives the acceleration, and the acceleration
          gives the friction.
        </Text>
      </View>

      <DataTable
        columns={columns}
        rows={tableRows}
        title="Your observations"
        caption={`Gate clock least count ${CLOCK.leastCount} s, so every time is quoted to two decimal places. The two columns on the right are calculated from the five on the left — nothing here was measured for you.`}
      />

      {/* The two formulae the table's right-hand columns run on. Everything
          else this experiment shows was shown on the bench itself. */}
      <View style={styles.formulaStrip}>
        <Text style={styles.formula}>s = ½at²</Text>
        <Text style={styles.formulaDot}>→</Text>
        <Text style={styles.formula}>a = 2s/t²</Text>
        <Text style={styles.formulaNote}>from rest, so there is no ut term</Text>
      </View>

      <View style={styles.formulaStrip}>
        <Text style={styles.formula}>a = g(sin θ − μ cos θ)</Text>
        <Text style={styles.formulaDot}>→</Text>
        <Text style={styles.formula}>μ = (g sin θ − a) / (g cos θ)</Text>
      </View>

      <View style={{ gap: 14 }}>
        <Eyebrow>Your numbers, worked through</Eyebrow>
        {rows.map((r) => (
          <Working key={r.stationKey} row={r} />
        ))}
      </View>

      {/* ---------------- what it is for ---------------- */}
      <Annotation label="Where this turns up outside the lab" tone={color.brass}>
        <View style={{ gap: 11 }}>
          <Text style={styles.noteBody}>
            <Text style={styles.term}>Mass is not in the answer.</Text> Look at the μ column
            against the mass column — the block's weight cancels out of
            a = g(sin θ − μ cos θ) entirely. A loaded lorry and an empty one slide down the
            same hill at the same rate, which is why a hill's warning sign quotes a gradient
            and never a weight.
          </Text>
          <Text style={styles.noteBody}>
            <Text style={styles.term}>Ramps, chutes and conveyors.</Text> A parcel chute is
            designed backwards from this: pick the μ of the surface you can afford, then set
            the angle that gets the parcel moving without it arriving too fast to catch.
          </Text>
          <Text style={styles.noteBody}>
            <Text style={styles.term}>Why a wet road is the dangerous one.</Text> Water drops
            μ between tyre and tarmac much the way glass dropped it under your block. Same
            slope, same car, less friction — and a stopping distance that grows in the same
            proportion your two runs differ by.
          </Text>
        </View>
      </Annotation>

      <Annotation label="What your readings are worth">
        <Text style={styles.noteBody}>
          {`The gate resolves ${CLOCK.leastCount} s, so each time carries ${sf} significant figures and no coefficient above is quoted to more.` +
            (wood && glass
              ? ` Your glass came out at μ = ${glass.mu.toFixed(2)} against wood's ${wood.mu.toFixed(
                  2
                )} — a smoother surface, and the clock saw it.`
              : '')}
        </Text>
      </Annotation>

      <GoldButton
        label="Finish and log this lab"
        onPress={() =>
          onComplete({
            data: rows.map((r) => ({
              surface: r.surface,
              thetaDeg: r.thetaDeg,
              massKg: r.massKg,
              trackCm: r.trackCm,
              timeS: r.timeS,
            })),
            analysis: {
              g: G_EARTH,
              runs: rows.map((r) => ({
                surface: r.surface,
                aMeasured: Number(r.a.toFixed(3)),
                muMeasured: Number(r.mu.toFixed(3)),
              })),
            },
            sf,
          })
        }
      />
    </ScrollView>
  );
}

function Working({ row }) {
  const station = STATIONS.find((s) => s.key === row.stationKey);
  const tone = station?.tone || color.physics;
  const sM = (row.trackCm / 100).toFixed(2);

  return (
    <View style={[styles.working, { borderLeftColor: withAlpha(tone, 0.5) }]}>
      <Text style={[styles.workingTitle, { color: tone }]}>{row.surface}</Text>
      <View style={styles.workingLines}>
        <Text style={styles.workingLine}>
          {`a = 2 × ${sM} / ${row.timeS.toFixed(2)}² = ${row.a.toFixed(2)} m/s²`}
        </Text>
        <Text style={styles.workingLine}>
          {`μ = (9.8 sin ${row.thetaDeg}° − ${row.a.toFixed(2)}) / (9.8 cos ${row.thetaDeg}°) = ${row.mu.toFixed(2)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 44, gap: 24 },

  term: { fontFamily: font.bold, color: color.inkStrong },
  lede: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: color.inkSoft },
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
    fontFamily: font.displayBold,
    fontSize: 16,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  formulaDot: { fontFamily: font.displayBold, fontSize: 16, color: color.inkMuted },
  formulaNote: { fontFamily: font.regular, fontSize: 13, color: color.inkMuted },

  working: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 4, gap: 8 },
  workingTitle: { fontFamily: font.displayBold, fontSize: 15.5 },
  workingLines: {
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    backgroundColor: color.sunk,
  },
  workingLine: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
});
