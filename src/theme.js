// Design tokens lifted from the ACEout prototype (design/ACEout.dc.html).
// Warm paper palette, brass accent, hairline rules instead of heavy cards.

export const color = {
  // surfaces
  screen: '#FBF7F0',
  paper: '#FFFDF8',
  sand: '#F1EADE',
  sunk: 'rgba(28,24,21,0.028)',

  // ink
  ink: '#1B1713',
  inkStrong: '#262019',
  inkBody: '#3E372F',
  inkSoft: '#4E473E',
  inkMuted: '#6E675E',

  // brass accent
  brass: '#96662F',
  gold: '#B8862F',
  goldTop: '#D4A458',
  goldBottom: '#B07F32',
  onGold: '#241A09',

  // subject / semantic
  physics: '#4668AE',
  chemistry: '#2F8E6C',
  biology: '#A9701F',
  space: '#6B4BAE',
  green: '#2F8E6C',
  red: '#B23428',
  amber: '#B8862F',

  // lines
  hairline: 'rgba(28,24,21,0.10)',
  hairlineSoft: 'rgba(28,24,21,0.06)',
  edge: 'rgba(28,24,21,0.13)',
};

export const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extra: 'PlusJakartaSans_800ExtraBold',
};

export const radius = { card: 22, panel: 20, tile: 16, chip: 12, pill: 999 };

export const space = { gutter: 26, labGutter: 20 };

// React Native takes letterSpacing in px, so the design's em values are
// pre-multiplied by their font size here.
export const type = {
  // 10px / .3em uppercase — the little brass eyebrows all over the design
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  eyebrowTight: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  display: {
    fontFamily: font.bold,
    fontSize: 29,
    lineHeight: 31,
    letterSpacing: -0.6,
    color: color.ink,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.44,
    color: color.ink,
  },
  heading: {
    fontFamily: font.bold,
    fontSize: 16.5,
    letterSpacing: -0.17,
    color: color.inkStrong,
  },
  body: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 21,
    color: color.inkSoft,
  },
  bodySoft: {
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: color.inkMuted,
  },
  numeral: {
    fontFamily: font.bold,
    fontSize: 18,
    letterSpacing: -0.45,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
};

export const shadow = {
  panel: {
    shadowColor: '#4A3C28',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  raised: {
    shadowColor: '#4A3C28',
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
};
