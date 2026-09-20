/**
 * Least-count and significant-figure discipline.
 *
 * The rule the app enforces: an instrument can never justify more precision
 * than its least count, and a derived quantity can never be quoted to more
 * significant figures than the weakest measurement it was built from.
 * A metre scale reading of "23.4167 cm" is a physics error, not a typo.
 */

/** Decimal places justified by a least count, e.g. 0.1 -> 1, 0.01 -> 2. */
export function decimalsFor(leastCount) {
  if (!(leastCount > 0)) return 0;
  const s = leastCount.toExponential(10);
  const exp = Number(s.slice(s.indexOf('e') + 1));
  // 0.05 -> exponent -2, needs 2 dp. 0.1 -> -1, needs 1 dp.
  const mantissa = Number(s.slice(0, s.indexOf('e')));
  const mantissaDecimals = String(mantissa).includes('.')
    ? String(mantissa).split('.')[1].replace(/0+$/, '').length
    : 0;
  return Math.max(0, -exp + mantissaDecimals);
}

/** Decimal places actually typed by the student ("12.50" -> 2). */
export function typedDecimals(raw) {
  const s = String(raw).trim();
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

/** Significant figures in a written value, respecting trailing zeros after a point. */
export function sigFigs(raw) {
  let s = String(raw).trim().replace(/^[+-]/, '');
  if (!s || Number.isNaN(Number(s))) return 0;
  if (s.includes('e') || s.includes('E')) s = Number(s).toString();
  if (s.includes('.')) {
    // strip leading zeros (and the point); trailing zeros count
    const stripped = s.replace('.', '').replace(/^0+/, '');
    return stripped.length || 1;
  }
  // integer: trailing zeros are ambiguous, we count them as not significant
  const stripped = s.replace(/^0+/, '').replace(/0+$/, '');
  return stripped.length || 1;
}

/**
 * Significant figures in an instrument reading.
 *
 * Plain `sigFigs` has to treat the trailing zeros of "500" as ambiguous,
 * because in isolation they are. On a balance with a least count of 1 g they
 * are not ambiguous at all — the instrument resolved that final gram — so the
 * count runs from the leading digit down to the least-count place.
 */
export function sigFigsForReading(raw, leastCount) {
  const v = Math.abs(Number(raw));
  if (!Number.isFinite(v) || v === 0 || !(leastCount > 0)) return 1;
  const msd = Math.floor(Math.log10(v) + 1e-9);
  const lsd = Math.floor(Math.log10(leastCount) + 1e-9);
  return Math.max(1, msd - lsd + 1);
}

export function roundToSigFigs(x, n) {
  if (!Number.isFinite(x) || x === 0) return 0;
  const mag = Math.ceil(Math.log10(Math.abs(x)));
  const factor = Math.pow(10, n - mag);
  return Math.round(x * factor) / factor;
}

/** Format a derived value to n significant figures, keeping trailing zeros. */
export function formatSigFigs(x, n) {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return (0).toFixed(Math.max(0, n - 1));
  const rounded = roundToSigFigs(x, n);
  const mag = Math.ceil(Math.log10(Math.abs(rounded)));
  const decimals = Math.max(0, n - mag);
  if (decimals > 6 || Math.abs(rounded) >= 1e6) return rounded.toExponential(n - 1);
  return rounded.toFixed(decimals);
}

/** A derived quantity from products/quotients carries the weakest input's sig figs. */
export function combineSigFigs(...counts) {
  const valid = counts.filter((c) => c > 0);
  return valid.length ? Math.min(...valid) : 0;
}

const EPS = 1e-9;

/**
 * Validate one instrument reading typed by a student.
 *
 * @returns {{ok:boolean, value:number|null, errors:string[], warnings:string[], sf:number}}
 */
export function validateReading(raw, instrument) {
  const {
    leastCount,
    unit = '',
    min = -Infinity,
    max = Infinity,
    name = 'instrument',
  } = instrument;

  const errors = [];
  const warnings = [];
  const text = String(raw ?? '').trim();

  if (!text) {
    return { ok: false, value: null, errors: ['Enter a reading.'], warnings, sf: 0 };
  }
  if (!/^-?\d*\.?\d+$/.test(text)) {
    return {
      ok: false,
      value: null,
      errors: ['That is not a number a scale can show.'],
      warnings,
      sf: 0,
    };
  }

  const value = Number(text);
  const lcDecimals = decimalsFor(leastCount);
  const given = typedDecimals(text);

  if (value < min - EPS || value > max + EPS) {
    errors.push(
      `Off scale. The ${name} only reads ${min}${unit} to ${max}${unit}.`
    );
  }

  if (given > lcDecimals) {
    errors.push(
      `Too many decimal places. Your ${name} has a least count of ${leastCount}${unit}, ` +
        `which justifies ${lcDecimals} decimal place${lcDecimals === 1 ? '' : 's'}, not ${given}. ` +
        `You cannot read a digit the instrument does not have.`
    );
  }

  // must land on a graduation
  const steps = value / leastCount;
  if (Math.abs(steps - Math.round(steps)) > 1e-6) {
    errors.push(
      `${text}${unit} is not a multiple of the least count (${leastCount}${unit}). ` +
        `Every reading must fall on a graduation.`
    );
  }

  if (given < lcDecimals && errors.length === 0) {
    warnings.push(
      `You dropped precision. This ${name} resolves to ${leastCount}${unit}, so quote ` +
        `${lcDecimals} decimal place${lcDecimals === 1 ? '' : 's'} — write ${value.toFixed(
          lcDecimals
        )}${unit}, not ${text}${unit}.`
    );
  }

  return {
    ok: errors.length === 0,
    value: errors.length === 0 ? value : null,
    errors,
    warnings,
    sf: sigFigs(text),
  };
}

/**
 * Check a student's stated answer for a derived quantity against the value the
 * data actually supports, at the sig figs their measurements justify.
 */
export function checkDerived(raw, { expected, sf, unit = '', tolerance = 0.05 }) {
  const errors = [];
  const text = String(raw ?? '').trim();
  if (!/^-?\d*\.?\d+$/.test(text)) {
    return { ok: false, errors: ['Enter a number.'], warnings: [] };
  }
  const value = Number(text);
  const warnings = [];
  const given = sigFigs(text);

  if (given > sf) {
    errors.push(
      `${given} significant figures from measurements that justify only ${sf}. ` +
        `Round your answer to ${formatSigFigs(value, sf)}${unit}.`
    );
  } else if (given < sf) {
    warnings.push(
      `You have thrown away precision — your readings support ${sf} significant figures.`
    );
  }

  const rel = Math.abs(value - expected) / (Math.abs(expected) || 1);
  if (rel > tolerance) {
    errors.push(
      `That does not follow from your own table. Recompute from the readings you recorded.`
    );
  }

  return { ok: errors.length === 0, value, errors, warnings };
}

/** Instrument definitions used across the incline lab. */
export const INSTRUMENTS = {
  metreScale: {
    name: 'metre scale',
    leastCount: 0.1,
    unit: ' cm',
    min: 0,
    max: 100,
  },
  vernier: {
    name: 'vernier callipers',
    leastCount: 0.01,
    unit: ' cm',
    min: 0,
    max: 15,
  },
  stopwatch: {
    name: 'stopwatch',
    leastCount: 0.01,
    unit: ' s',
    min: 0,
    max: 600,
  },
  balance: {
    name: 'electronic balance',
    leastCount: 1,
    unit: ' g',
    min: 0,
    max: 2000,
  },
  protractor: {
    name: 'protractor',
    leastCount: 0.5,
    unit: '°',
    min: 0,
    max: 180,
  },
  colorimeter: {
    name: 'colorimeter / absorbance',
    leastCount: 0.01,
    unit: ' A',
    min: 0.0,
    max: 2.5,
  },
  phPaper: {
    name: 'universal pH paper',
    leastCount: 1,
    unit: ' pH',
    min: 0,
    max: 14,
  },
  phMeter: {
    name: 'digital pH meter',
    leastCount: 0.01,
    unit: ' pH',
    min: 0.0,
    max: 14.0,
  },
  dropper: {
    name: 'dropper pipette',
    leastCount: 1,
    unit: ' drops',
    min: 0,
    max: 50,
  },
  graduatedCylinder: {
    name: 'measuring cylinder',
    leastCount: 0.1,
    unit: ' mL',
    min: 0,
    max: 50,
  },
};
