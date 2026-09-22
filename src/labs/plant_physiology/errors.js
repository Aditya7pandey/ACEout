// Error injection models for Plant Physiology experiments
// Conforming to ACEout Lab Contract (Section 5: Error injection)

export const ERROR_KINDS = {
  air_bubbles: {
    key: 'air_bubbles',
    label: 'Coverslip Air Bubble Entrapment',
    blurb:
      'Lowering the coverslip too quickly traps circular air bubbles on the slide, creating dark refractive rings that obscure stomata and cell margins.',
  },
  overstaining: {
    key: 'overstaining',
    label: 'Safranin Stain Precipitation',
    blurb:
      'Excessive Safranin concentration causes dye aggregation, making it difficult to distinguish guard cell inner thick walls from subsidiary cells.',
  },
  ambient_humidity: {
    key: 'ambient_humidity',
    label: 'High Ambient Lab Humidity',
    blurb:
      'Elevated atmospheric moisture (85% RH) reduces the transpiration vapor pressure gradient, doubling the cobalt chloride color transition time.',
  },
  peel_folding: {
    key: 'peel_folding',
    label: 'Epidermal Peel Folding Artifact',
    blurb:
      'Curling of the delicate Rhoeo/Hibiscus peel during mounting creates overlapping cell layers that distort the true stomatal index count.',
  },
};

export function defaultErrorConfig() {
  return {
    air_bubbles: false,
    overstaining: false,
    ambient_humidity: false,
    peel_folding: false,
  };
}

export function makeErrorProfile(seed = Math.random()) {
  return {
    humidityFactor: 0.55 + 0.15 * (seed % 1), // slow down transpiration rate
    bubbleOffsets: [
      { x: -0.25, y: 0.18, r: 0.18 },
      { x: 0.32, y: -0.15, r: 0.22 },
    ],
    stainIntensity: 1.45,
  };
}
