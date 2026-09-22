// Guided steps, checkpoints, validation rules and NCERT references
// for the 3 Class 11 Plant Physiology Virtual Lab Modules

export const LAB_MODULES = [
  {
    id: 'plasmolysis',
    name: 'Module 1: Plasmolysis in Epidermal Peel',
    shortName: 'Plasmolysis',
    specimen: 'Rhoeo discolor (Tradescantia)',
    ncertRef: 'NCERT Class 11 Biology · Chapter 11 (Plant Physiology: Osmosis & Plasmolysis)',
    desc: 'Demonstrate osmotic shrinkage of protoplast (plasmolysis) under hypertonic solution and subsequent deplasmolysis in hypotonic water.',
  },
  {
    id: 'stomata',
    name: 'Module 2: Stomatal Distribution & Index',
    shortName: 'Stomatal Index',
    specimen: 'Dicot (Hibiscus) vs Monocot (Maize/Grass)',
    ncertRef: 'NCERT Class 11 Biology · Chapter 6 & Practical Syllabus (Anatomy of Flowering Plants)',
    desc: 'Compare stomatal frequency, guard cell morphology (kidney vs dumbbell), and compute Stomatal Index on upper and lower surfaces.',
  },
  {
    id: 'transpiration',
    name: 'Module 3: Differential Transpiration Rate',
    shortName: 'Transpiration',
    specimen: 'Cobalt Chloride Paper (CoCl₂)',
    ncertRef: 'NCERT Class 11 Biology · Chapter 11 (Transport in Plants: Transpiration)',
    desc: 'Demonstrate unequal transpiration rates between adaxial (upper) and abaxial (lower) leaf surfaces using moisture-sensitive cobalt chloride strips.',
  },
];

export const PLASMOLYSIS_STEPS = [
  {
    id: 'plasmolysis_step_1',
    stepNumber: 1,
    title: 'Epidermal Peel Preparation',
    instruction:
      'Grip the purple lower epidermis of the Rhoeo leaf with forceps. Gently peel a thin, transparent epidermal strip and transfer it into a clean drop of water on a glass slide.',
    ncertNote:
      'The lower epidermis of Rhoeo contains vivid anthocyanin pigment within its central vacuoles, making osmotic cell volume changes easily observable under the microscope without artificial staining.',
    checkpointQuestion: {
      question: 'Where is the purple anthocyanin pigment localized inside Rhoeo leaf epidermal cells?',
      options: [
        'Dissolved in the aqueous cell sap inside the central vacuole (tonoplast-enclosed)',
        'Suspended in the chloroplasts within the cytoplasm',
        'Impregnated into the cellulosic cell wall',
        'Inside the cell nucleus',
      ],
      correctIndex: 0,
      explanation:
        'Anthocyanin is a water-soluble flavonoid pigment stored in the large central vacuole of plant cells, bounded by the semi-permeable tonoplast.',
    },
  },
  {
    id: 'plasmolysis_step_2',
    stepNumber: 2,
    title: 'Hypertonic Chemical Application',
    instruction:
      'Use the chemical dropper to add 2–3 drops of 10% Hypertonic Sodium Chloride (NaCl) solution to the mounted peel, then mount the coverslip with a needle at 45° to avoid bubbles.',
    ncertNote:
      'When the external medium has a higher solute concentration than the cell sap (hypertonic, Ψs is highly negative), water exits the cell by exosmosis along the chemical water potential gradient.',
    checkpointQuestion: {
      question: 'What happens during "Incipient Plasmolysis"?',
      options: [
        'Turgor pressure (Ψp) drops to exactly zero and the protoplast just starts to pull away from cell wall corners',
        'The cell wall bursts due to extreme endosmosis',
        'The vacuole doubles in volume',
        'Anthocyanin pigment leaks irreversibly out into the external medium',
      ],
      correctIndex: 0,
      explanation:
        'Incipient plasmolysis is the boundary osmotic state where turgor pressure (Ψp) becomes zero and the osmotic potential of the cell (Ψs) equals the external water potential.',
    },
  },
  {
    id: 'plasmolysis_step_3',
    stepNumber: 3,
    title: 'Microscopic Observation of Plasmolysis',
    instruction:
      'Examine the cellular grid under 400× magnification. Observe the colored vacuole shrinking from concave to convex shape, pulling the plasma membrane away from the rigid cell wall.',
    ncertNote:
      'The space created between the retracted plasma membrane and the outer cell wall is occupied by the hypertonic external solution, because the cell wall is freely permeable to solutes and water.',
    checkpointQuestion: {
      question: 'What fills the space between the shrunken plasma membrane and the cell wall in a fully plasmolysed cell?',
      options: [
        'Hypertonic external solution',
        'Air / vacuum',
        'Pure distilled water',
        'Cell cytoplasm',
      ],
      correctIndex: 0,
      explanation:
        'The primary cell wall is completely permeable to small solute molecules, so the external hypertonic solution freely penetrates through the cell wall and occupies the space surrounding the contracted protoplast.',
    },
  },
  {
    id: 'plasmolysis_step_4',
    stepNumber: 4,
    title: 'Deplasmolysis in Distilled Water',
    instruction:
      'Remove excess salt solution with filter paper, then apply pure Hypotonic Distilled Water via dropper to induce rapid endosmosis and observe deplasmolysis.',
    ncertNote:
      'Pure water has the highest water potential (Ψw = 0). Water diffuses rapidly into the hypertonic cell sap, expanding the vacuole and restoring full turgor pressure against the cell wall.',
    checkpointQuestion: {
      question: 'Why does a plant cell not burst upon deplasmolysis, unlike an animal red blood cell in hypotonic water?',
      options: [
        'Rigid cellulosic cell wall exerts an equal and opposite wall pressure against expanding turgor pressure',
        'Tonoplast membrane prevents water entry',
        'Plant cells actively pump out all incoming water via contractile vacuoles',
        'Plant plasma membrane is impermeable to water',
      ],
      correctIndex: 0,
      explanation:
        'The rigid, inextensible cellulosic cell wall prevents lysis by exerting inward mechanical wall pressure (W.P.) equal to the outward turgor pressure (T.P.).',
    },
  },
];

export const STOMATA_STEPS = [
  {
    id: 'stomata_step_1',
    stepNumber: 1,
    title: 'Leaf Selection & Epidermal Peeling',
    instruction:
      'Select a Dicot Leaf (Hibiscus) or Monocot Leaf (Maize/Grass). Peel both the Upper (Adaxial) and Lower (Abaxial) surfaces with forceps and place on separate slides.',
    ncertNote:
      'Dorsiventral (dicot) leaves typically have hypostomatic condition (abundant stomata on lower surface, sparse/absent on upper surface). Isobilateral (monocot) leaves have amphistomatic condition (nearly equal stomata on both surfaces).',
    checkpointQuestion: {
      question: 'How do guard cells differ between Dicot and Monocot leaves?',
      options: [
        'Dicots have kidney-shaped (reniform) guard cells; Monocots have dumbbell-shaped guard cells',
        'Dicots have dumbbell-shaped guard cells; Monocots lack guard cells',
        'Dicots have no chloroplasts in guard cells; Monocots have chloroplasts',
        'Dicots have equal wall thickness; Monocots have thick outer walls',
      ],
      correctIndex: 0,
      explanation:
        'In dicots, guard cells are reniform (kidney-shaped) with thick inner walls facing the pore. In monocots (grasses), guard cells are dumbbell-shaped with bulbous ends.',
    },
  },
  {
    id: 'stomata_step_2',
    stepNumber: 2,
    title: 'Staining & Microscope Mounting',
    instruction:
      'Add 1 drop of 1% Safranin stain, wash excess stain with water, add a drop of glycerin, and place the coverslip without bubbles.',
    ncertNote:
      'Glycerin prevents the delicate epidermal tissue peel from dehydrating during prolonged microscopic examination.',
    checkpointQuestion: {
      question: 'What is the function of the subsidiary (accessory) cells surrounding the guard cells?',
      options: [
        'Specialized epidermal cells that provide water and ion exchange (K⁺/Cl⁻) support to guard cells during stomatal opening/closing',
        'Produce wax cuticle over the stomatal aperture',
        'Absorb sunlight for primary dark reactions',
        'Act as physical barriers preventing any gas exchange',
      ],
      correctIndex: 0,
      explanation:
        'Subsidiary cells act as reservoirs for water and inorganic ions (especially Potassium K⁺ and Malate) exchanged with guard cells to regulate turgor changes for stomatal movements.',
    },
  },
  {
    id: 'stomata_step_3',
    stepNumber: 3,
    title: 'Field of View (FOV) Grid Counting',
    instruction:
      'Align the calibrated 10×10 FOV reticle grid over the microscopic image. Count the number of Stomata (S) and Epidermal Cells (E) to compute the Stomatal Index.',
    ncertNote:
      'Stomatal Index (I) = [S / (S + E)] × 100. This dimensionless ratio remains relatively constant for a given species, independent of leaf size or environmental growth variations.',
    checkpointQuestion: {
      question: 'If a microscopic field of view shows 30 stomata and 120 epidermal cells, what is the Stomatal Index (I)?',
      options: ['20.0%', '25.0%', '15.0%', '30.0%'],
      correctIndex: 0,
      explanation:
        'Stomatal Index I = [S / (S + E)] × 100 = [30 / (30 + 120)] × 100 = [30 / 150] × 100 = 20.0%.',
    },
  },
];

export const TRANSPIRATION_STEPS = [
  {
    id: 'transpiration_step_1',
    stepNumber: 1,
    title: 'Cobalt Chloride Paper Preparation & Clamping',
    instruction:
      'Take two dry, anhydrous blue Cobalt Chloride (CoCl₂) paper strips. Clamp one strip onto the Upper (adaxial) surface and one onto the Lower (abaxial) surface of a healthy potted dorsiventral plant leaf using glass slides and clips.',
    ncertNote:
      'Anhydrous CoCl₂ is intense azure blue. In the presence of transpired water vapor, it chemically forms Cobalt Chloride Hexahydrate (CoCl₂·6H₂O), which is distinctly pink.',
    checkpointQuestion: {
      question: 'What chemical transformation causes the cobalt chloride strip to turn pink during transpiration?',
      options: [
        'Anhydrous Blue CoCl₂ hydrates into Pink CoCl₂·6H₂O (Hexahydrate)',
        'Cobalt metal oxidizes into brown Cobalt Oxide',
        'CoCl₂ reacts with carbon dioxide to form cobalt carbonate',
        'Chlorophyll from leaf diffuses into the paper',
      ],
      correctIndex: 0,
      explanation:
        'CoCl₂ (blue) + 6H₂O (transpired water vapor) ⇄ CoCl₂·6H₂O (pink). This reversible color reaction provides a direct colorimetric indicator of transpiration rate.',
    },
  },
  {
    id: 'transpiration_step_2',
    stepNumber: 2,
    title: 'Time-Lapse Observation & Colorimetric Analysis',
    instruction:
      'Start the time-lapse timer (1×, 5×, 10×). Observe and record the time taken for the upper and lower cobalt strips to transition from 100% blue to uniform hydrated pink.',
    ncertNote:
      'The lower surface turns pink significantly faster (typically within 3–8 minutes) compared to the upper surface (18–30 minutes) due to higher stomatal density on the abaxial side of dorsiventral leaves.',
    checkpointQuestion: {
      question: 'Why does the cobalt chloride paper on the lower surface of a dorsiventral leaf turn pink much faster than on the upper surface?',
      options: [
        'Lower epidermis possesses a vastly higher density of stomata through which the bulk of foliar transpiration occurs',
        'Upper surface is completely impermeable to all molecules including gases',
        'Lower surface is shaded and therefore absorbs more atmospheric water',
        'Upper surface produces chemical inhibitors that destroy cobalt paper',
      ],
      correctIndex: 0,
      explanation:
        'In dorsiventral (dicot) leaves, the majority of stomatal pores are located on the lower abaxial epidermis (hypostomatic), leading to much higher transpiration flux on the lower surface.',
    },
  },
];
