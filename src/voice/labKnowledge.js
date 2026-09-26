/**
 * RAG Knowledge Base for ACEout Virtual Labs.
 * Contains domain knowledge chunks for voice AI assistant.
 */

export const LAB_KNOWLEDGE = {
  'incline-work-energy': [
    {
      id: 'iwe-overview',
      title: 'Lab Overview',
      content: 'In this Class 11 Physics lab from the Work Energy & Power chapter, you study a block sliding down an inclined plane. The experiment involves two runs: one with a wood surface and one with a glass surface. You can adjust the angle of the incline between 20° and 40°, the mass of the block between 0.2 and 1.0 kg, and the distance between photogates (20-70 cm).',
      keywords: ['overview', 'incline', 'inclined', 'plane', 'class 11', 'physics', 'work energy and power', 'angle', 'mass', 'distance', 'photogates', 'wood', 'glass'],
      category: 'theory'
    },
    {
      id: 'iwe-theory',
      title: 'Physics Theory',
      content: 'The acceleration of a block sliding down an inclined plane is given by a = g(sin θ − μk cos θ). The work-energy theorem states that the work done by all forces equals the change in kinetic energy. Kinetic friction is the resistance to motion once the block is sliding, which is usually less than static friction (the force needed to start moving). Notice that mass appears in both the gravitational force and frictional force equations, which is why it cancels out in the acceleration equation.',
      keywords: ['acceleration', 'equation', 'formula', 'work-energy theorem', 'kinetic friction', 'static friction', 'mass cancels out', 'gravity', 'theory', 'concept'],
      category: 'theory'
    },
    {
      id: 'iwe-formulas',
      title: 'Key Formulas',
      content: 'Important formulas for this lab: 1) Displacement: s = ½at². 2) Acceleration from time and distance: a = 2s/t². 3) Coefficient of kinetic friction: μ = (g sin θ − a)/(g cos θ). 4) Work: W = Fd. 5) Kinetic Energy: KE = ½mv².',
      keywords: ['formula', 'equation', 'calculate', 'displacement', 'acceleration', 'coefficient of friction', 'work', 'kinetic energy', 'math'],
      category: 'formula'
    },
    {
      id: 'iwe-surfaces',
      title: 'Surface Materials',
      content: 'Different materials have different coefficients of friction. For Wood: static friction μs=0.32, kinetic μk=0.26. For Glass: μs=0.18, μk=0.14. For Felt: μs=0.52, μk=0.45. For Ice: μs=0.06, μk=0.04. Notice that glass is smoother than wood, so it will have lower friction and a faster sliding time.',
      keywords: ['surface', 'material', 'wood', 'glass', 'felt', 'ice', 'coefficient of friction', 'smooth', 'rough', 'mu'],
      category: 'theory'
    },
    {
      id: 'iwe-procedure',
      title: 'Experiment Procedure',
      content: 'To run the experiment: First, set the desired angle for the inclined plane. Second, choose the mass of the block. Third, set the distance between the two photogates. Then, release the block and record the time it takes to travel between the gates. Use this time to calculate acceleration and then the coefficient of kinetic friction.',
      keywords: ['procedure', 'steps', 'how to', 'run', 'set angle', 'set mass', 'set distance', 'release block', 'record time'],
      category: 'procedure'
    },
    {
      id: 'iwe-report',
      title: 'Lab Report',
      content: 'Your final lab report requires two timings which will give you two different coefficients of friction (one for wood, one for glass). A key takeaway to note in your report is that the mass of the block does not affect the acceleration or the coefficient of friction, so it won\'t appear in the final answer for μ.',
      keywords: ['report', 'timings', 'two coefficients', 'mass', 'conclusion', 'result'],
      category: 'concept'
    },
    {
      id: 'iwe-errors',
      title: 'Error Concepts',
      content: 'Common sources of error in this real-world experiment include zero error on the scale (if measuring mass manually), parallax error when reading the distance on the ruler, and stopwatch lag if timing manually instead of using photogates.',
      keywords: ['error', 'mistake', 'troubleshooting', 'zero error', 'parallax', 'stopwatch lag', 'accuracy'],
      category: 'troubleshooting'
    },
    {
      id: 'iwe-realworld',
      title: 'Real World Applications',
      content: 'Understanding friction on an inclined plane applies to real-world scenarios like ramps for wheelchair access or loading cargo, lorries parking or driving on steep hills, the safety of wet roads, and parcel chutes in delivery warehouses.',
      keywords: ['real world', 'application', 'ramps', 'lorries', 'hills', 'wet roads', 'parcel chutes'],
      category: 'concept'
    },
    {
      id: 'iwe-guided',
      title: 'Guided Mode Steps',
      content: 'The guided mode follows this sequence: Briefing (learning the goals) → Setup (configuring the apparatus) → Running (doing the experiment) → Recording (logging the data) → Done.',
      keywords: ['guided mode', 'steps', 'brief', 'setup', 'running', 'record', 'done'],
      category: 'procedure'
    }
  ],
  'eye-defects': [
    {
      id: 'eye-overview',
      title: 'Lab Overview',
      content: 'In this Class 12 Physics lab from the Ray Optics chapter, you study the human eye, its near point, far point, and how to correct defects with spectacles. The lab features three stations: a normal eye, a myopic (short-sighted) eye, and a hypermetropic (long-sighted) eye.',
      keywords: ['overview', 'human eye', 'near point', 'far point', 'spectacles', 'class 12', 'physics', 'ray optics', 'myopic', 'hypermetropic', 'normal'],
      category: 'theory'
    },
    {
      id: 'eye-anatomy',
      title: 'Eye Anatomy',
      content: 'The retina is located at a fixed distance of 2.5 cm from the eye lens. The cornea provides about 2/3 of the eye\'s total refracting power. The crystalline lens is responsible for the remaining power and does the fine adjusting (accommodation) to focus on objects at different distances.',
      keywords: ['anatomy', 'retina', 'cornea', 'refracting power', 'crystalline lens', 'accommodation', 'focus', 'distance'],
      category: 'theory'
    },
    {
      id: 'eye-optics',
      title: 'Optics Theory',
      content: 'Using a thin lens model, a normal relaxed eye has a power of about 40 Dioptres. The eye can accommodate (increase its power) by about 4D to focus on closer objects. The relationship between focal length and power is Power = 100/f where f is in centimeters.',
      keywords: ['optics', 'theory', 'thin lens model', 'relaxed power', '40D', 'accommodate', '4D', 'power', 'focal length', 'dioptres'],
      category: 'concept'
    },
    {
      id: 'eye-three-eyes',
      title: 'The Three Eyes',
      content: '1) Normal Eye: Has a near point of 25 cm and a far point at infinity. 2) Myopic Eye (short-sighted): The eyeball is too long (e.g., 26.67mm), causing distant objects to blur. Its far point is closer than infinity (e.g., at 40cm). 3) Hypermetropic Eye (long-sighted): The eyeball is too short (e.g., 23.62mm), causing near objects to blur. Its near point is further away (e.g., at 60cm).',
      keywords: ['normal eye', 'myopic', 'short-sighted', 'hypermetropic', 'long-sighted', 'eyeball length', 'near point', 'far point', 'infinity', 'blur'],
      category: 'theory'
    },
    {
      id: 'eye-spectacles',
      title: 'Spectacle Corrections',
      content: 'Myopia is corrected with a concave (diverging) lens. The required power is P = -100/farPoint(cm). Hypermetropia is corrected with a convex (converging) lens. The required focal length is found using 1/f = 1/25 - 1/nearPoint(cm).',
      keywords: ['spectacles', 'correction', 'myopia', 'concave lens', 'diverging', 'hypermetropia', 'convex lens', 'converging', 'power formula', 'focal length'],
      category: 'formula'
    },
    {
      id: 'eye-formulas',
      title: 'Key Formulas',
      content: 'Key formulas for Ray Optics: Lens maker\'s formula: 1/v - 1/u = 1/f. Power in dioptres: P = 1/f (where f is in meters), or P = 100/f (where f is in centimeters).',
      keywords: ['formula', 'equation', 'lens maker', 'v', 'u', 'f', 'power', 'dioptres'],
      category: 'formula'
    },
    {
      id: 'eye-procedure',
      title: 'Experiment Procedure',
      content: 'To find the near or far point: Slide the target object (arrow) along the optical bench towards or away from the eye. Observe the simulated retinal image. Find the exact point where the image breaks up into a blur circle (this marks the near point or far point) and bank the reading.',
      keywords: ['procedure', 'steps', 'how to', 'slide arrow', 'optical bench', 'retinal image', 'breaks up', 'near point', 'far point', 'bank reading'],
      category: 'procedure'
    },
    {
      id: 'eye-focus',
      title: 'Focus and Blur',
      content: 'When an object is out of focus, a point of light forms a "blur circle" on the retina instead of a sharp point. The sharpness metric decreases as the blur circle grows. The eye adjusts its lens thickness to minimize this blur circle and maximize sharpness.',
      keywords: ['focus', 'blur', 'blur circle', 'sharpness metric', 'adjust', 'lens thickness'],
      category: 'concept'
    },
    {
      id: 'eye-tolerance',
      title: 'Measurement Tolerance',
      content: 'In the simulation, a tolerance of ±1.5 cm is accepted for your readings of near and far points, accounting for human judgment of when the blur becomes unacceptable.',
      keywords: ['tolerance', 'error', 'accepted', 'reading', '±1.5 cm', 'judgment', 'troubleshooting'],
      category: 'troubleshooting'
    },
    {
      id: 'eye-realworld',
      title: 'Real World Applications',
      content: 'This explains why glasses prescriptions are given in Dioptres (e.g., -2.00 D for myopia). Spectacles don\'t change the eye\'s accommodation ability; instead, they shift the entire accommodation band so that the user\'s near and far points align with a normal person\'s range.',
      keywords: ['real world', 'application', 'prescriptions', 'dioptres', 'glasses', 'accommodation band', 'shift'],
      category: 'concept'
    }
  ],
  'ph-determination': [
    {
      id: 'ph-overview',
      title: 'Lab Overview',
      content: 'In this Class 11 Chemistry lab, you determine the pH of various solutions using universal indicator paper and a digital pH meter. You study the logarithmic relationship of [H+] and [OH-] concentrations governed by Kw = 1.0 × 10^-14.',
      keywords: ['ph', 'determination', 'universal indicator', 'digital ph meter', 'hydrogen ion', 'kw', 'class 11', 'chemistry'],
      category: 'theory'
    },
    {
      id: 'ph-theory',
      title: 'pH Theory',
      content: 'pH is defined as the negative logarithm to the base 10 of the hydrogen ion concentration in mol/L: pH = -log10[H+]. Similarly, pOH = -log10[OH-]. At 298 K, pH + pOH = 14.00.',
      keywords: ['ph formula', 'poh', 'logarithm', 'hydrogen', 'hydroxide', 'equation', 'theory'],
      category: 'theory'
    }
  ],
  'acid-base-indicators': [
    {
      id: 'ind-overview',
      title: 'Lab Overview',
      content: 'In this Class 11 Chemistry lab, you investigate the color changes of different acid-base indicators (Phenolphthalein, Methyl Orange, Litmus, and Bromothymol Blue) across varying pH levels to deduce their transition ranges.',
      keywords: ['indicator', 'acid-base', 'phenolphthalein', 'methyl orange', 'litmus', 'bromothymol blue', 'transition range', 'class 11', 'chemistry'],
      category: 'theory'
    },
    {
      id: 'ind-theory',
      title: 'Indicator Theory',
      content: 'An acid-base indicator is a weak organic acid (HIn) or weak organic base that changes color depending on the pH. The equilibrium is HIn ⇌ H+ + In-. The color depends on the ratio [In-]/[HIn]. The transition occurs around pH = pK_In ± 1.',
      keywords: ['equilibrium', 'hin', 'in-', 'pkin', 'color change', 'transition', 'ratio'],
      category: 'theory'
    }
  ],
  'gravity-launch': [
    {
      id: 'gl-overview',
      title: 'Lab Overview',
      content: 'In this Physics lab, a rover is horizontally launched off a deck. By measuring the horizontal range and the deck height across various worlds with different gravity, you plot R² versus 1/g to find the launch speed and determine the mystery world\'s gravity.',
      keywords: ['gravity', 'launch', 'horizontal projectile', 'rover', 'deck', 'range', 'launch speed', 'mystery world'],
      category: 'theory'
    },
    {
      id: 'gl-theory',
      title: 'Projectile Theory',
      content: 'For a horizontal launch with speed u from height h, the time of fall is t = √(2h/g) and horizontal range is R = u·t = u·√(2h/g). Squaring gives R² = (2u²h)/g. A plot of R² vs 1/g gives a straight line through origin with gradient 2u²h.',
      keywords: ['projectile', 'horizontal', 'range formula', 'time of flight', 'gradient', 'straight line', 'plot'],
      category: 'formula'
    }
  ],
  'plant-physiology': [
    {
      id: 'pp-overview',
      title: 'Lab Overview',
      content: 'In this Class 11 Biology lab, you study three core plant physiology concepts: Plasmolysis in epidermal peels (like Rhoeo), Stomatal distribution in dicot vs monocot leaves, and Transpiration rates using the cobalt chloride paper method.',
      keywords: ['plant physiology', 'plasmolysis', 'stomata', 'transpiration', 'rhoeo', 'cobalt chloride', 'class 11', 'biology'],
      category: 'theory'
    },
    {
      id: 'pp-theory',
      title: 'Physiology Theory',
      content: 'Plasmolysis occurs when a plant cell loses water in a hypertonic solution (e.g. strong salt solution), causing the protoplast to shrink away from the cell wall. Stomata are more numerous on the lower epidermis of dicot leaves (dorsiventral). Transpiration turns blue cobalt chloride paper pink due to moisture.',
      keywords: ['plasmolysis', 'hypertonic', 'shrink', 'stomata density', 'lower epidermis', 'dicot', 'cobalt chloride', 'blue to pink', 'moisture'],
      category: 'theory'
    }
  ]
};

/**
 * Retrieves the most relevant knowledge chunks for a given query.
 * 
 * @param {string} labId - The ID of the lab (e.g., 'incline-work-energy' or 'eye-defects').
 * @param {string} query - The user's query string.
 * @param {number} [topK=3] - The maximum number of chunks to return.
 * @returns {Array} Array of top-K relevant knowledge chunks.
 */
export function retrieveChunks(labId, query, topK = 3) {
  const chunks = LAB_KNOWLEDGE[labId];
  if (!chunks) return [];

  // Tokenize query into lowercase words (alphanumeric only)
  const queryTokens = query.toLowerCase().split(/\W+/).filter(token => token.length > 0);

  if (queryTokens.length === 0) return chunks.slice(0, topK);

  // Score chunks
  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    
    // Check against each query token
    for (const token of queryTokens) {
      for (const keyword of chunk.keywords) {
        const lowerKeyword = keyword.toLowerCase();
        // Exact match
        if (lowerKeyword === token) {
          score += 2;
        } 
        // Partial match (keyword contains token or token contains keyword)
        else if (lowerKeyword.includes(token) || token.includes(lowerKeyword)) {
          score += 1;
        }
      }
    }
    
    return { ...chunk, score };
  });

  // Sort by score descending and return top-K
  return scoredChunks
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ score, ...chunk }) => chunk);
}
