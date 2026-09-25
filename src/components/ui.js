import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, type, radius, font, space, bevel, deepen } from '../theme';

/**
 * The gamified kit. Everything pressable is a bevelled block: a flat fill with
 * a hard bottom edge that collapses when you press it, so the tile physically
 * moves under the thumb. Nothing here uses a blur shadow.
 */

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

/**
 * The house button. `tone` picks the fill; the bottom edge is derived from it,
 * so a button only ever needs one colour.
 */
export function ChunkyButton({
  label,
  onPress,
  disabled,
  tone = color.green,
  style,
  compact,
  textStyle,
}) {
  const deep = deepen[tone] || color.inkStrong;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.chunky,
        { backgroundColor: tone },
        bevel(deep),
        compact && styles.chunkyCompact,
        disabled && styles.chunkyDisabled,
        pressed && !disabled && styles.chunkyPressed,
        style,
      ]}
    >
      <Text
        style={[styles.chunkyLabel, disabled && { color: color.lockedInk }, textStyle]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Primary action, kept under its old name so every bench keeps working. */
export function GoldButton({ label, onPress, disabled, style, compact, tone }) {
  return (
    <ChunkyButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      style={[{ flexGrow: 1, flexShrink: 1 }, style]}
      compact={compact}
      tone={tone || color.green}
    />
  );
}

/** Outlined twin — the "Reset" counterpart. */
export function GhostButton({ label, onPress, disabled, style, tone }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.ghost,
        tone ? { borderColor: tone, borderBottomColor: tone } : null,
        disabled && { opacity: 0.4 },
        pressed && !disabled && styles.ghostPressed,
        style,
      ]}
    >
      <Text style={[styles.ghostLabel, tone ? { color: tone } : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Circular back chevron in the top-left of every inner screen. */
export function BackButton({ onPress, light }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.back,
        light && { borderColor: 'rgba(255,255,255,0.45)' },
        pressed && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.backGlyph, light && { color: '#FFFFFF' }]}>←</Text>
    </Pressable>
  );
}

/** Screen header: back button + eyebrow, then an optional display title. */
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
      {title ? <Text style={type.display}>{title}</Text> : null}
      {subtitle ? <Text style={[type.body, { marginTop: 4 }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

/** Safe-area aware page wrapper. */
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

/** A list row inside a bordered card. */
export function ListRow({ onPress, children, first }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        !first && { borderTopWidth: 2, borderTopColor: color.hairline },
        pressed && { backgroundColor: color.sunk },
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

/** Left-rule annotation block ("Observation", "Why"). */
export function Annotation({ label, tone = color.purple, children, style }) {
  return (
    <View style={[styles.annotation, { borderLeftColor: withAlpha(tone, 0.4) }, style]}>
      <Eyebrow tone={tone} style={{ letterSpacing: 1.5, fontSize: 10 }}>
        {label}
      </Eyebrow>
      {typeof children === 'string' ? (
        <Text style={[type.body, { color: color.inkSoft, lineHeight: 21 }]}>{children}</Text>
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
        { borderColor: withAlpha(tone, 0.4) },
        filled && { backgroundColor: withAlpha(tone, 0.12), borderColor: 'transparent' },
      ]}
    >
      <Text style={[styles.tagLabel, { color: tone }]}>{label}</Text>
    </View>
  );
}

/** Segmented control — Guided / Free play. */
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

// --- gamified primitives ---------------------------------------------------

/** Rounded progress track. `value` is 0–1. */
export function Bar({ value, tone = color.green, height = 14, track, style }) {
  const pct = `${Math.max(0, Math.min(1, value || 0)) * 100}%`;
  return (
    <View style={[styles.track, { height, backgroundColor: track || color.hairline }, style]}>
      <View style={[styles.fill, { width: pct, backgroundColor: tone }]} />
    </View>
  );
}

/** A counter in the top bar: streak, XP, energy. */
export function Counter({ glyph, value, tone, style }) {
  return (
    <View style={[styles.counter, style]}>
      <Text style={[styles.counterGlyph, { color: tone }]}>{glyph}</Text>
      <Text style={[styles.counterValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

/** Three-up result tile — a coloured frame around a white number. */
export function StatTile({ label, value, tone = color.gold, style }) {
  return (
    <View style={[styles.statTile, { backgroundColor: tone }, style]}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.statWell}>
        <Text style={[styles.statValue, { color: deepen[tone] || color.inkStrong }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/** Row of stars, filled up to `earned`. */
export function Stars({ earned = 0, total = 3, size = 15, style }) {
  return (
    <View style={[{ flexDirection: 'row', gap: 2 }, style]}>
      {Array.from({ length: total }).map((_, i) => (
        <Text
          key={i}
          style={{ fontSize: size, color: i < earned ? color.gold : color.locked }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

/** Hexagon badge — the trophy-shelf shape. */
export function Badge({ glyph, tone = color.locked, size = 56, style }) {
  const h = size * 1.12;
  return (
    <View style={[styles.badge, { width: size, height: h }, style]}>
      <Svg width={size} height={h} viewBox="0 0 100 112">
        <Polygon points="50,0 100,28 100,84 50,112 0,84 0,28" fill={tone} />
      </Svg>
      <Text
        style={[
          styles.badgeGlyph,
          { fontSize: size * 0.3, color: tone === color.locked ? color.lockedInk : '#FFFFFF' },
        ]}
      >
        {glyph}
      </Text>
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
  rule: { height: 2, backgroundColor: color.hairline },
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: { fontSize: 16, color: color.inkMuted, marginTop: -2 },

  chunky: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chunkyCompact: { paddingVertical: 11, flexGrow: 0 },
  chunkyPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 1 },
  chunkyDisabled: { backgroundColor: color.locked, borderBottomColor: color.lockedDeep },
  chunkyLabel: { ...type.action, color: '#FFFFFF' },

  ghost: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: color.hairline,
    borderBottomWidth: 4,
    borderBottomColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  ghostLabel: {
    fontFamily: font.displayBold,
    fontSize: 13.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 4,
  },
  panel: {
    borderWidth: 2,
    borderColor: color.hairline,
    borderRadius: radius.tile,
    backgroundColor: color.paper,
    padding: 16,
  },
  annotation: { gap: 6, paddingLeft: 13, borderLeftWidth: 3 },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  tagLabel: {
    fontFamily: font.extra,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: color.hairline,
    gap: 3,
  },
  segment: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: color.screen },
  segmentLabel: {
    fontFamily: font.displayBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  segmentLabelActive: { color: color.blueDeep },

  track: { borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },

  counter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  counterGlyph: { fontSize: 15 },
  counterValue: { fontFamily: font.displayBold, fontSize: 17, fontVariant: ['tabular-nums'] },

  statTile: { flex: 1, borderRadius: radius.tile, padding: 3 },
  statLabel: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 5,
  },
  statWell: {
    borderRadius: radius.chip,
    backgroundColor: color.screen,
    paddingVertical: 11,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statValue: { fontFamily: font.displayBold, fontSize: 21, fontVariant: ['tabular-nums'] },

  badge: { alignItems: 'center', justifyContent: 'center' },
  badgeGlyph: { position: 'absolute', fontFamily: font.displayBold },
});
