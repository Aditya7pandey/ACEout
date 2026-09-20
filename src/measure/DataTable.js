import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { color, font, radius } from '../theme';
import { Eyebrow } from '../components/ui';

/**
 * The observation table. Raw readings on the left, derived columns on the
 * right, separated by a rule so it is always obvious which numbers were
 * measured and which were calculated.
 */
export default function DataTable({ columns, rows, title = 'Observation table', caption }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Eyebrow>{title}</Eyebrow>
        <Text style={styles.count}>
          {rows.length} {rows.length === 1 ? 'reading' : 'readings'}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.headerRow}>
            {columns.map((c) => (
              <View
                key={c.key}
                style={[
                  styles.cell,
                  { width: c.width || 74 },
                  c.derived && styles.derivedCell,
                  c.divider && styles.divider,
                ]}
              >
                <Text style={[styles.colLabel, c.derived && { color: color.physics }]}>
                  {c.label}
                </Text>
                {c.unit ? <Text style={styles.colUnit}>{c.unit}</Text> : null}
              </View>
            ))}
          </View>

          {rows.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.empty}>No readings recorded yet.</Text>
            </View>
          ) : (
            rows.map((r, i) => (
              <View key={i} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
                {columns.map((c) => (
                  <View
                    key={c.key}
                    style={[
                      styles.cell,
                      { width: c.width || 74 },
                      c.derived && styles.derivedCell,
                      c.divider && styles.divider,
                    ]}
                  >
                    <Text style={[styles.value, c.derived && { color: color.inkBody }]}>
                      {r[c.key] ?? '—'}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    padding: 14,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28,24,21,0.25)',
    paddingBottom: 7,
  },
  row: { flexDirection: 'row', paddingVertical: 8 },
  rowAlt: { backgroundColor: 'rgba(28,24,21,0.022)' },
  emptyRow: { paddingVertical: 16 },
  cell: { paddingHorizontal: 7, gap: 2 },
  derivedCell: { backgroundColor: 'rgba(70,104,174,0.035)' },
  divider: { borderLeftWidth: 1, borderLeftColor: 'rgba(28,24,21,0.18)' },
  colLabel: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: color.inkStrong,
  },
  colUnit: {
    fontFamily: font.medium,
    fontSize: 8.5,
    color: color.inkMuted,
  },
  value: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  empty: { fontFamily: font.regular, fontSize: 11.5, color: color.inkMuted },
  caption: {
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 16,
    color: color.inkMuted,
  },
});
