import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { color, font, radius, type } from '../../theme';
import { Text, useLanguage } from '../../i18n';
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
  const { t } = useLanguage();

  const byKey = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.stationKey, r])),
    [rows]
  );

  const sf = useMemo(
    () => combineSigFigs(...rows.map((r) => r.sf)) || 3,
    [rows]
  );

  const columns = [
    { key: 'eye', label: t('eye.report.col.eye'), width: 136 },
    { key: 'limit', label: t('eye.report.col.limit'), width: 104 },
    { key: 'reading', label: t('eye.report.col.reading'), unit: 'cm', width: 78 },
    { key: 'defect', label: t('eye.report.col.defect'), width: 124, derived: true, divider: true },
    { key: 'lens', label: t('eye.report.col.lens'), width: 138, derived: true },
    {
      key: 'power',
      label: t('eye.report.col.power'),
      unit: t('eye.report.unit.dioptres'),
      width: 92,
      derived: true,
    },
  ];

  // The row's own station key drives every translated cell, so the table reads
  // in today's language even though the record was banked in another one.
  const tableRows = rows.map((r) => ({
    eye: t(`eye.${r.stationKey}.name`),
    limit: t(`eye.${r.stationKey}.readingLabel`),
    reading: r.readingCm.toFixed(1),
    defect: t(`eye.defect.${r.stationKey === 'normal' ? 'none' : r.stationKey}`),
    lens: t(r.correction.lensKey),
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
        <Eyebrow tone={color.brass}>{t('eye.report.eyebrow')}</Eyebrow>
        <Text style={type.title}>{t('eye.report.title')}</Text>
        <Text style={styles.lede}>{t('eye.report.lede')}</Text>
      </View>

      <DataTable
        columns={columns}
        rows={tableRows}
        title={t('eye.report.tableTitle')}
        caption={t('eye.report.tableCaption', { lc: BENCH.leastCount })}
      />

      {/* The one formula both prescriptions below run on. Everything else the
          eye does was shown on the bench and does not need restating here. */}
      <View style={styles.formulaStrip}>
        <Text style={styles.formula}>1/v − 1/u = 1/f</Text>
        <Text style={styles.formulaDot}>·</Text>
        <Text style={styles.formula}>P = 1/f</Text>
        <Text style={styles.formulaNote}>{t('eye.report.formulaNote')}</Text>
      </View>

      <View style={{ gap: 14 }}>
        <Eyebrow>{t('eye.report.workedThrough')}</Eyebrow>

        {myopia ? (
          <Working
            tone={color.physics}
            title={t('eye.report.myopia.title')}
            setup={t('eye.report.myopia.setup', { reading: myopia.readingCm.toFixed(1) })}
            lines={[
              `f = −${myopia.readingCm.toFixed(1)} cm = −${(myopia.readingCm / 100).toFixed(3)} m`,
              `P = 1/f = ${fmtSigned(myopia.correction.powerD)} D`,
            ]}
            verdict={t('eye.report.myopia.verdict', {
              power: fmtSigned(myopia.correction.powerD),
            })}
          />
        ) : null}

        {hyper ? (
          <Working
            tone={color.biology}
            title={t('eye.report.hyper.title')}
            setup={t('eye.report.hyper.setup', {
              normal: NORMAL_NEAR_CM,
              reading: hyper.readingCm.toFixed(1),
            })}
            lines={[
              `u = −${NORMAL_NEAR_CM} cm,  v = −${hyper.readingCm.toFixed(1)} cm`,
              `1/f = 1/${NORMAL_NEAR_CM} − 1/${hyper.readingCm.toFixed(1)}`,
              `f = ${fmt(hyper.correction.fCm)} cm,  P = ${fmtSigned(hyper.correction.powerD)} D`,
            ]}
            verdict={t('eye.report.hyper.verdict', {
              power: fmtSigned(hyper.correction.powerD),
            })}
          />
        ) : null}
      </View>

      <Annotation label={t('eye.report.noteLabel')} tone={color.brass}>
        <Text style={styles.noteBody}>
          {t('eye.report.note', { lc: BENCH.leastCount, sf }) +
            (normal
              ? t('eye.report.noteNormal', {
                  reading: normal.readingCm.toFixed(1),
                  normal: NORMAL_NEAR_CM,
                })
              : '')}
        </Text>
      </Annotation>

      <GoldButton
        label={t('eye.report.finish')}
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
