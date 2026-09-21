import { color } from '../theme';

export const SUBJECTS = [
  {
    key: 'physics',
    totalLabs: 22,
    name: 'Physics',
    mark: 'Ph',
    accent: color.physics,
    blurb: 'Optics, motion and electricity on a measured bench.',
    meta: 'NCERT aligned',
  },
  {
    key: 'chemistry',
    totalLabs: 20,
    name: 'Chemistry',
    mark: 'Ch',
    accent: color.chemistry,
    blurb: 'Titrate, react and observe — without the spillage.',
    meta: 'NCERT aligned',
  },
  {
    key: 'biology',
    totalLabs: 16,
    name: 'Biology',
    mark: 'Bi',
    accent: color.biology,
    blurb: 'Dissect, stain and magnify living systems.',
    meta: 'NCERT aligned',
  },
  {
    key: 'space',
    totalLabs: 13,
    name: 'Space Exploration',
    mark: 'Sp',
    accent: color.space,
    blurb: 'Walk the solar system; weigh a cart on Mars.',
    meta: 'Beyond syllabus',
  },
];

export const CLASSES = [
  { num: '8', blurb: 'Foundations — force, microbes, and the first look at matter.', labs: 38 },
  { num: '9', blurb: 'Motion, atoms and cells get a proper workbench.', labs: 46 },
  { num: '10', blurb: 'Board year. Every prescribed experiment, simulated.', labs: 62 },
  { num: '11', blurb: 'Mechanics, thermodynamics and organic chemistry, deeper.', labs: 58 },
  { num: '12', blurb: 'Optics, electrostatics and genetics, built for JEE and NEET.', labs: 71 },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV'];

function chapters(titles) {
  return titles.map((t, i) => ({
    no: ROMAN[i],
    title: typeof t === 'string' ? t : t.title,
    labs: typeof t === 'string' ? 3 : t.labs,
    blurb: typeof t === 'string' ? undefined : t.blurb,
  }));
}

// NCERT 2025–26 chapter lists. Only the chapters carrying a built lab are
// fully fleshed out; the rest are listed so the syllabus tree is honest.
export const CHAPTERS = {
  '11|physics': chapters([
    'Units and Measurements',
    'Motion in a Straight Line',
    'Motion in a Plane',
    'Laws of Motion',
    {
      title: 'Work, Energy and Power',
      labs: 4,
      blurb:
        'Measure the work a force actually does, follow the energy into kinetic form and into heat, and test the work–energy theorem against your own readings.',
    },
    'System of Particles and Rotational Motion',
    'Gravitation',
    'Mechanical Properties of Solids',
    'Mechanical Properties of Fluids',
    'Thermal Properties of Matter',
    'Thermodynamics',
    'Kinetic Theory',
    'Oscillations',
    'Waves',
  ]),
  '11|chemistry': chapters([
    'Some Basic Concepts of Chemistry',
    'Structure of Atom',
    'Classification of Elements and Periodicity',
    'Chemical Bonding and Molecular Structure',
    'Thermodynamics',
    {
      title: 'Equilibrium',
      labs: 3,
      blurb:
        'Shift chemical equilibrium with Le Chatelier’s principle, study acid–base indicator transitions, and measure pH with test strips and digital probes.',
      virtualLabs: [
        {
          id: 'fe-scn-equilibrium',
          title: 'Effect of Concentration on Chemical Equilibrium',
          description:
            'Shift the Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺ equilibrium by perturbing reagent concentrations and measure color intensity.',
          duration: '15 mins',
          difficulty: 'Intermediate',
          ncertCode: 'EXP-11-CH-6.1',
        },
        {
          id: 'acid-base-indicators',
          title: 'Study of Acid-Base Indicators',
          description:
            'Observe color changes and determine transition ranges of Phenolphthalein, Methyl Orange, and Litmus across pH scales.',
          duration: '12 mins',
          difficulty: 'Beginner',
          ncertCode: 'EXP-11-CH-6.2',
        },
        {
          id: 'ph-determination',
          title: 'Determination of the pH of Different Solutions',
          description:
            'Measure pH of household and laboratory solutions using universal indicator strips and a digital pH probe.',
          duration: '15 mins',
          difficulty: 'Beginner',
          ncertCode: 'EXP-11-CH-6.3',
        },
      ],
    },
    'Redox Reactions',
    'Organic Chemistry — Some Basic Principles',
    'Hydrocarbons',
  ]),
  '11|biology': chapters([
    'The Living World',
    'Biological Classification',
    'Plant Kingdom',
    'Animal Kingdom',
    'Morphology of Flowering Plants',
    'Anatomy of Flowering Plants',
    'Cell — The Unit of Life',
    'Biomolecules',
    'Cell Cycle and Cell Division',
    'Photosynthesis in Higher Plants',
    'Respiration in Plants',
    'Plant Growth and Development',
  ]),
  '11|space': chapters([
    'Orbits and Escape Velocity',
    'Launch Windows and Transfer Orbits',
    'Life Support and Microgravity',
    'Telescopes and the Deep Field',
  ]),
  '10|physics': chapters([
    { title: 'Light — Reflection and Refraction', labs: 6 },
    'The Human Eye and the Colourful World',
    'Electricity',
    'Magnetic Effects of Electric Current',
  ]),
};

const GENERIC_CHAPTERS = chapters([
  'Matter in Our Surroundings',
  'Motion',
  'Force and Laws of Motion',
  'Gravitation',
  'Work and Energy',
  'Sound',
]);

export function getChapters(cls, subjectKey) {
  return CHAPTERS[`${cls}|${subjectKey}`] || GENERIC_CHAPTERS;
}

// ---------------------------------------------------------------------------
// Labs
// ---------------------------------------------------------------------------

const ART = {
  slate: ['#DCE1EC', '#B9C2D6'],
  stone: ['#E0E2E8', '#BFC4CF'],
  sea: ['#D6E4E6', '#B0C6CA'],
  lilac: ['#E0DCEC', '#C1BAD6'],
  sand: ['#EFE6D6', '#D3C3A6'],
};

export const LABS = {
  '11|physics|V': [
    {
      id: 'incline-work-energy',
      title: 'Box on an inclined plane',
      mins: 18,
      desc:
        'Release a block down a ramp, time it yourself, and test whether the work done really does equal the change in kinetic energy.',
      tag1: 'Work–energy theorem',
      tag2: 'Graph + best fit',
      art: ART.sand,
      built: true,
    },
    {
      id: 'spring-pe',
      title: 'Potential energy of a spring',
      mins: 12,
      desc: 'Load a spring in steps and integrate the force–extension graph.',
      tag1: 'Hooke’s law',
      tag2: 'Area under graph',
      art: ART.slate,
    },
    {
      id: 'collisions',
      title: 'Elastic and inelastic collisions',
      mins: 15,
      desc: 'Collide two gliders and audit momentum against kinetic energy.',
      tag1: 'Collisions',
      tag2: 'Coefficient of restitution',
      art: ART.stone,
    },
    {
      id: 'power-stairs',
      title: 'Power output climbing stairs',
      mins: 9,
      desc: 'Time a climb, weigh the climber, and work out the useful power.',
      tag1: 'Power',
      tag2: 'Stopwatch',
      art: ART.sea,
    },
  ],
  '11|chemistry|VI': [
    {
      id: 'fe-scn-equilibrium',
      title: 'Effect of Concentration on Chemical Equilibrium',
      mins: 15,
      desc:
        'Shift the Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺ equilibrium by altering reagent concentrations and measure color optical intensity.',
      tag1: 'Le Chatelier’s Principle',
      tag2: 'Colorimetry + Kc',
      art: ART.sand,
      built: true,
      difficulty: 'Intermediate',
      ncertCode: 'EXP-11-CH-6.1',
    },
    {
      id: 'acid-base-indicators',
      title: 'Study of Acid-Base Indicators',
      mins: 12,
      desc:
        'Observe sharp color transformations and transition ranges of Phenolphthalein, Methyl Orange, and Litmus across pH scales.',
      tag1: 'Acid–Base Indicators',
      tag2: 'Transition Range',
      art: ART.lilac,
      built: true,
      difficulty: 'Beginner',
      ncertCode: 'EXP-11-CH-6.2',
    },
    {
      id: 'ph-determination',
      title: 'Determination of the pH of Different Solutions',
      mins: 15,
      desc:
        'Measure pH of acids, bases, and salts using universal indicator paper color-matching and high-precision digital pH meter.',
      tag1: 'pH Measurement',
      tag2: 'pH Strips & Digital Probe',
      art: ART.sea,
      built: true,
      difficulty: 'Beginner',
      ncertCode: 'EXP-11-CH-6.3',
    },
  ],
};

export function getLabs(cls, subjectKey, chapterNo) {
  const built = LABS[`${cls}|${subjectKey}|${chapterNo}`];
  if (built) return built;
  return [
    {
      id: 'placeholder-1',
      title: 'Lab bench coming soon',
      mins: 10,
      desc: 'This chapter’s 3D benches are still being built. Class 11 Physics · Work, Energy and Power is live today.',
      tag1: 'In progress',
      tag2: 'NCERT',
      art: ART.lilac,
    },
  ];
}

export const SEARCH_INDEX = [
  {
    id: 'incline-work-energy',
    title: 'Box on an inclined plane',
    crumb: 'Class 11 · Physics · V',
    cls: '11',
    subject: 'physics',
    chapterNo: 'V',
    art: ART.sand,
    built: true,
    keywords:
      'work energy power incline inclined plane friction kinetic theorem ramp block box slope',
  },
  {
    id: 'spring-pe',
    title: 'Potential energy of a spring',
    crumb: 'Class 11 · Physics · V',
    cls: '11',
    subject: 'physics',
    chapterNo: 'V',
    art: ART.slate,
    keywords: 'spring hooke potential energy extension work',
  },
  {
    id: 'collisions',
    title: 'Elastic and inelastic collisions',
    crumb: 'Class 11 · Physics · V',
    cls: '11',
    subject: 'physics',
    chapterNo: 'V',
    art: ART.stone,
    keywords: 'collision momentum restitution elastic inelastic energy',
  },
  {
    id: 'power-stairs',
    title: 'Power output climbing stairs',
    crumb: 'Class 11 · Physics · V',
    cls: '11',
    subject: 'physics',
    chapterNo: 'V',
    art: ART.sea,
    keywords: 'power watt stairs climb stopwatch energy',
  },
  {
    id: 'mirror',
    title: 'Image formation by a concave mirror',
    crumb: 'Class 10 · Physics · I',
    cls: '10',
    subject: 'physics',
    chapterNo: 'I',
    art: ART.slate,
    keywords: 'light reflection mirror concave image ray optics',
  },
  {
    id: 'refraction',
    title: 'Refraction through a glass slab',
    crumb: 'Class 10 · Physics · I',
    cls: '10',
    subject: 'physics',
    chapterNo: 'I',
    art: ART.sea,
    keywords: 'refraction snell glass slab lateral displacement light',
  },
  {
    id: 'fe-scn-equilibrium',
    title: 'Effect of Concentration on Chemical Equilibrium',
    crumb: 'Class 11 · Chemistry · VI',
    cls: '11',
    subject: 'chemistry',
    chapterNo: 'VI',
    art: ART.sand,
    built: true,
    keywords:
      'equilibrium le chatelier fe scn iron thiocyanate blood red concentration shift kc colorimeter test tube',
  },
  {
    id: 'acid-base-indicators',
    title: 'Study of Acid-Base Indicators',
    crumb: 'Class 11 · Chemistry · VI',
    cls: '11',
    subject: 'chemistry',
    chapterNo: 'VI',
    art: ART.lilac,
    built: true,
    keywords:
      'acid base indicator phenolphthalein methyl orange litmus ph transition range color change buffer',
  },
  {
    id: 'ph-determination',
    title: 'Determination of the pH of Different Solutions',
    crumb: 'Class 11 · Chemistry · VI',
    cls: '11',
    subject: 'chemistry',
    chapterNo: 'VI',
    art: ART.sea,
    built: true,
    keywords:
      'ph determination universal indicator paper strip digital ph meter probe h+ oh- hydronium acid base',
  },
];

export function searchLabs(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEARCH_INDEX.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.keywords.includes(q) ||
      q.split(/\s+/).every((w) => r.keywords.includes(w) || r.title.toLowerCase().includes(w))
  );
}

/** Catalogue metadata for a lab id — used when rendering saved progress. */
export function findLabMeta(id) {
  return SEARCH_INDEX.find((r) => r.id === id) || null;
}
