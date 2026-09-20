import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, type, radius, font, space } from '../theme';

export function Eyebrow({ children, tone, style, ...rest }) {
  return (
    <Text style={[type.eyebrow, tone ? { color: tone } : null, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Rule({ style }) {
  return <View style={[styles.rule, style]} />;
}

/** The brass pill button used for every primary action in the design. */
export function GoldButton({ label, onPress, disabled, style, compact }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.gold,
        compact && styles.goldCompact,
        disabled && styles.goldDisabled,
        pressed && !disabled && styles.goldPressed,
        style,
      ]}
    >
      <Text style={[styles.goldLabel, disabled && styles.goldLabelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Outlined pill — the "Reset" counterpart. */
export function GhostButton({ label, onPress, disabled, style, tone }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.ghost,
        tone ? { borderColor: tone } : null,
        disabled && { opacity: 0.4 },
        pressed && !disabled && { backgroundColor: 'rgba(28,24,21,0.05)' },
        style,
      ]}
    >
      <Text style={[styles.ghostLabel, tone ? { color: tone } : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Circular back chevron in the top-left of every inner screen. */
export function BackButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.back,
        pressed && { borderColor: 'rgba(150,102,47,0.5)' },
      ]}
    >
      <Text style={styles.backGlyph}>←</Text>
    </Pressable>
  );
}

/** Screen header: back button + brass eyebrow, then an optional display title. */
export function ScreenHeader({ onBack, eyebrow, title, subtitle, right, children }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        {onBack ? <BackButton onPress={onBack} /> : null}
        {eyebrow ? (
          <Eyebrow style={{ flex: 1 }} numberOfLines={1}>
            {eyebrow}
          </Eyebrow>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {right}
      </View>
      {title ? <Text style={[type.display, styles.headerTitle]}>{title}</Text> : null}
      {subtitle ? <Text style={[type.body, { marginTop: 10 }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

/** Safe-area aware page wrapper that matches the prototype's paper background. */
export function Page({ children, style, background }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.page,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        background ? { backgroundColor: background } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PageScroll({ children, contentStyle, ...rest }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        { paddingHorizontal: space.gutter, paddingBottom: 30 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

/** A hairline-separated list row, the design's dominant list idiom. */
export function ListRow({ onPress, children, first }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        !first && { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: color.hairline },
        pressed && { backgroundColor: 'rgba(28,24,21,0.03)' },
      ]}
    >
      {children}
    </Pressable>
  );
}

/** Bordered surface used for instrument panels and readout groups. */
export function Panel({ children, style, tone }) {
  return (
    <View style={[styles.panel, tone ? { borderColor: tone } : null, style]}>
      {children}
    </View>
  );
}

/** The design's left-rule annotation block ("Observation", "Why"). */
export function Annotation({ label, tone = color.brass, children, style }) {
  return (
    <View style={[styles.annotation, { borderLeftColor: withAlpha(tone, 0.35) }, style]}>
      <Eyebrow tone={tone} style={{ letterSpacing: 2.1, fontSize: 9.5 }}>
        {label}
      </Eyebrow>
      {typeof children === 'string' ? (
        <Text style={[type.body, { color: color.inkSoft, lineHeight: 22 }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

/** Small uppercase status tag. */
export function Tag({ label, tone = color.inkMuted, filled }) {
  return (
    <View
      style={[
        styles.tag,
        { borderColor: withAlpha(tone, 0.45) },
        filled && { backgroundColor: withAlpha(tone, 0.1) },
      ]}
    >
      <Text style={[styles.tagLabel, { color: tone }]}>{label}</Text>
    </View>
  );
}

/** Segmented control — used for Guided / Free play. */
export function Segmented({ options, value, onChange, style }) {
  return (
    <View style={[styles.segmented, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function withAlpha(hex, alpha) {
  if (!hex || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.screen },
  rule: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: color.hairline,
  },
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 14,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  headerTitle: { marginTop: 2 },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.edge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: { fontSize: 15, color: color.inkSoft, marginTop: -1 },
  gold: {
    // flexGrow rather than flex, so the button fills the spare width in a row
    // but keeps its natural height when stacked in a scrolling column.
    flexGrow: 1,
    flexShrink: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: color.goldBottom,
    borderTopWidth: 1.5,
    borderTopColor: color.goldTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldCompact: { paddingVertical: 12, flexGrow: 0 },
  goldPressed: { backgroundColor: '#9C6F2A' },
  goldDisabled: { backgroundColor: 'rgba(28,24,21,0.09)', borderTopColor: 'transparent' },
  goldLabel: {
    fontFamily: font.extra,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.onGold,
  },
  goldLabelDisabled: { color: 'rgba(28,24,21,0.35)' },
  ghost: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(28,24,21,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkSoft,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 19,
    paddingHorizontal: 4,
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    padding: 16,
  },
  annotation: {
    gap: 8,
    paddingLeft: 14,
    borderLeftWidth: 1,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  tagLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28,24,21,0.05)',
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: color.paper,
    ...(Platform.OS === 'android'
      ? { elevation: 1 }
      : {
          shadowColor: '#4A3C28',
          shadowOpacity: 0.12,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 2 },
        }),
  },
  segmentLabel: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  segmentLabelActive: { color: color.brass },
});
