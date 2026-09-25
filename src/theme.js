// Design tokens for the gamified ACEout
// (design/ACEout Gamified v2.dc.html — "playful path").
//
// White paper, chunky bevelled tiles, one saturated colour per meaning:
// blue = go, green = correct, red = wrong / energy, gold = XP, purple = prompt.
// Depth is a hard bottom edge (borderBottomWidth), never a soft blur — that is
// what makes a tile read as a pressable block.

export const color = {
  // surfaces
  screen: '#FFFFFF',
  paper: '#FBF7F0',
  sand: '#F3EFE6',
  sunk: '#F7F4EE',
  canvas: '#EEE8DC',

  // ink
  ink: '#1B1713',
  inkStrong: '#2A241E',
  inkBody: '#4E473E',
  inkSoft: '#5C554B',
  inkMuted: '#8A8274',
  inkFaint: '#A39B8D',

  // XP gold — the old brass, brightened
  brass: '#C98A1E',
  gold: '#E8A83A',
  goldTop: '#F7C95C',
  goldBottom: '#E8A83A',
  goldDeep: '#B77E1E',
  onGold: '#FFFFFF',

  // go / primary
  blue: '#4B7BE5',
  blueDeep: '#3257B0',
  blueSoft: '#EAF0FD',
  blueEdge: '#9DB8F2',

  // correct
  green: '#2FA87A',
  greenDeep: '#1F7A58',
  greenSoft: '#E6F7EF',
  greenEdge: '#8FD9B8',

  // wrong / energy
  red: '#E0543F',
  redDeep: '#A83A2B',
  redSoft: '#FDECE9',
  redEdge: '#F2A194',

  // prompt / quests
  purple: '#7B5BD6',
  purpleDeep: '#5638A8',
  purpleSoft: '#F1ECFC',
  purpleEdge: '#C3B2F0',

  amber: '#E8A83A',
  amberDeep: '#B77E1E',

  // worlds
  physics: '#4B7BE5',
  chemistry: '#2FA87A',
  biology: '#F07A2E',
  space: '#7B5BD6',

  // locked / not started
  locked: '#E5E1D8',
  lockedDeep: '#C8C1B3',
  lockedInk: '#A39B8D',

  // lines
  hairline: '#EFEAE0',
  hairlineSoft: '#F5F1E9',
  edge: '#E5E1D8',
};

/** Deep-shadow twin for every accent, so a tile can be bevelled from its fill. */
export const deepen = {
  [color.blue]: color.blueDeep,
  [color.green]: color.greenDeep,
  [color.red]: color.redDeep,
  [color.purple]: color.purpleDeep,
  [color.gold]: color.goldDeep,
  [color.biology]: '#B8531A',
  [color.locked]: color.lockedDeep,
  [color.ink]: '#000000',
};

/** The soft/edge pair used for selected and result states. */
export const soften = {
  [color.blue]: { soft: color.blueSoft, edge: color.blueEdge, ink: color.blueDeep },
  [color.green]: { soft: color.greenSoft, edge: color.greenEdge, ink: color.greenDeep },
  [color.red]: { soft: color.redSoft, edge: color.redEdge, ink: color.redDeep },
  [color.purple]: { soft: color.purpleSoft, edge: color.purpleEdge, ink: color.purpleDeep },
  [color.gold]: { soft: '#FDF3DD', edge: '#F3D48F', ink: color.brass },
};

export const font = {
  // Fredoka carries every number, title and button label — the playful voice.
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  displayMed: 'Fredoka_500Medium',

  // Jakarta carries body copy and the small uppercase labels.
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extra: 'PlusJakartaSans_800ExtraBold',
};

export const radius = { card: 20, panel: 18, tile: 16, chip: 12, node: 999, pill: 999 };

export const space = { gutter: 20, labGutter: 18 };

/** Depth: a hard bottom edge. `bevel('#3257B0')` under a blue fill. */
export function bevel(deep, size = 4) {
  return { borderBottomWidth: size, borderBottomColor: deep };
}

// React Native takes letterSpacing in px, so the design's em values are
// pre-multiplied by their font size here.
export const type = {
  eyebrow: {
    fontFamily: font.extra,
    fontSize: 10.5,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  eyebrowTight: {
    fontFamily: font.extra,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.inkMuted,
  },
  display: {
    fontFamily: font.displayBold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: color.ink,
  },
  title: {
    fontFamily: font.display,
    fontSize: 23,
    lineHeight: 27,
    color: color.ink,
  },
  heading: {
    fontFamily: font.display,
    fontSize: 18,
    lineHeight: 22,
    color: color.inkStrong,
  },
  body: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: color.inkSoft,
  },
  bodySoft: {
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: color.inkMuted,
  },
  numeral: {
    fontFamily: font.displayBold,
    fontSize: 19,
    color: color.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  /** Uppercase button lettering. */
  action: {
    fontFamily: font.displayBold,
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};

export const shadow = {
  panel: {
    shadowColor: '#4A3C28',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  raised: {
    shadowColor: '#4A3C28',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
};
