// src/pages/statistics/hw1/view.js
// Logica di presentazione condivisa fra la pagina del sito (React) e il
// programma scaricabile (DOM puro): quali sezioni esistono, come si legge il
// campo k, come si classifica la validita' di un test, quali dati vanno nei
// grafici. Tenerla qui impedisce che le due versioni dicano cose diverse
// sugli stessi numeri.
import * as hw from './homework1.js';

/** The six statistical analyses, in the order the assignment lists them. */
export const ANALYSES = ['distribution', 'frequency', 'bits', 'uniformity', 'correlation', 'avalanche'];

const analysisSections = (prefix) => ANALYSES.map((key) => ({ id: `${prefix}-${key}`, key, level: 2 }));

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
export const SECTIONS = [
  { id: 'hw1-assignment', key: 'assignment', level: 0 },
  { id: 'hw1-task', key: 'task', level: 0 },
  { id: 'hw1-setup', key: 'setup', level: 1 },
  { id: 'hw1-addition', key: 'addition', level: 1 },
  { id: 'hw1-multiples', key: 'multiples', level: 1 },
  { id: 'hw1-fast', key: 'fast', level: 1 },
  { id: 'hw1-public-key', key: 'publicKey', level: 1 },
  { id: 'hw1-guru', key: 'guru', level: 0 },
  { id: 'hw1-stats', key: 'stats', level: 0 },
  { id: 'hw1-stats-task', key: 'statsTask', level: 1 },
  ...analysisSections('hw1-stats-task'),
  { id: 'hw1-stats-ext', key: 'statsExt', level: 1 },
  ...analysisSections('hw1-stats-ext'),
  { id: 'hw1-discussion', key: 'discussion', level: 0 },
  { id: 'hw1-discussion-definitions', key: 'definitions', level: 1 },
  { id: 'hw1-discussion-properties', key: 'properties', level: 1 },
  { id: 'hw1-discussion-inversion', key: 'inversion', level: 1 },
  { id: 'hw1-discussion-conclusion', key: 'conclusion', level: 1 },
];

/** The entries of the index, with their titles in the chosen language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

/** Curves small enough to animate and to list every point of. */
export const VIZ_PRIMES = [17, 97];

/** Rows of the table G, 2G, ..., kG: beyond this the page points to double-and-add. */
export const LIST_LIMIT = 64;

export const K_MAX = 999;

/** Longest text the k field accepts: enough for K_MAX and a few stray characters to complain about. */
export const K_INPUT_MAX_LENGTH = 12;

/**
 * Reads the private key typed by the user. Only plain decimal digits are
 * accepted: "6.9", "1e3", "-5" or "0x1F" are errors to show, never numbers
 * to guess.
 */
export function parseK(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'notInteger' };
  const k = Number(t);
  if (!Number.isSafeInteger(k) || k < 1 || k > K_MAX) return { ok: false, error: 'range' };
  return { ok: true, value: k };
}

/**
 * Status of a chi-square test result:
 *   'na'          not computable (fewer than two observations, or every
 *                 possible value present, so nothing left to test)
 *   'invalid'     computed, but its assumptions fail (too few expected
 *                 observations per class, or repeated, dependent values)
 *   'descriptive' assumptions met except that the data are the whole
 *                 population, not a random sample: the p-value describes
 *   'valid'       a proper test
 */
export function testStatus(test) {
  if (!test || !test.computable) return 'na';
  const r = test.reasons;
  if (r.includes('small-sample') || r.includes('low-expected') || r.includes('duplicates')) return 'invalid';
  if (r.includes('exhaustive')) return 'descriptive';
  return 'valid';
}

/** Prime factorization: 18 -> [[2, 1], [3, 2]]. */
export function factorize(n) {
  const factors = [];
  let m = n;
  for (let d = 2; d * d <= m; d++) {
    let e = 0;
    while (m % d === 0) {
      m /= d;
      e++;
    }
    if (e) factors.push([d, e]);
  }
  if (m > 1) factors.push([m, 1]);
  return factors;
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const superscript = (e) => String(e).split('').map((d) => SUPERSCRIPT[Number(d)]).join('');

/** 18 -> "2 · 3²". */
export const formatFactors = (n) => factorize(n).map(([q, e]) => (e === 1 ? String(q) : `${q}${superscript(e)}`)).join(' · ');

/**
 * What the discussion needs to know about a curve: its number of points and
 * whether it falls in a known weak family. For p > 3 a curve is
 * supersingular exactly when it has p + 1 points (trace 0, which Hasse's
 * bound forces), and anomalous when it has p points.
 */
export function curveFacts(curve) {
  const order = hw.groupOrder(curve);
  return {
    p: curve.p,
    order,
    prime: hw.isPrime(order),
    supersingular: order === curve.p + 1,
    anomalous: order === curve.p,
  };
}

/** Number of observations when every point of the curve is used as base point. */
export const pooledSize = (curve) => hw.curvePoints(curve).reduce((s, P) => s + hw.pointOrder(P, curve) - 1, 0);

/** The options of a base-point selector: every point of a small curve, a sample of a large one. */
export function basePointOptions(curve, { pooled = false, sample = 8 } = {}) {
  const points = hw.curvePoints(curve);
  const first = hw.defaultBasePoint(curve);
  const list = points.length <= 200 ? points : [first, ...points.filter((P) => !hw.samePoint(P, first)).slice(0, sample - 1)];
  const options = list.map((P) => ({
    value: `${P.x},${P.y}`,
    point: P,
    order: hw.pointOrder(P, curve),
    isDefault: hw.samePoint(P, first),
  }));
  return pooled ? [{ value: 'pooled', point: null, order: null, isDefault: false }, ...options] : options;
}

/** "3,7" -> { x: 3, y: 7 }; "pooled" stays as it is. */
export const parseBase = (value) => {
  if (value === 'pooled') return 'pooled';
  const [x, y] = String(value).split(',').map(Number);
  return { x, y };
};

/** Bits of x and of y whose share of ones is more than 3 standard errors from the expected one. */
export const bitsBeyond = (s) => [...s.bits.x, ...s.bits.y].filter((b) => b.z !== null && Math.abs(b.z) > 3).length;

/** The bit with the largest |z| among those of one coordinate. */
export const worstBit = (bits) =>
  bits.reduce((m, b) => (b.z !== null && (m === null || Math.abs(b.z) > Math.abs(m.z)) ? b : m), null);

/** Signed deviation of a SAC matrix from a reference rate per output bit (null cells stay null). */
export const sacDeviation = (sac, reference) => sac.map((row) => row.map((v, j) => (v === null ? null : v - reference[j])));

/** Labels of the histogram classes: the first value of each class. */
export const binLabels = (p, bins) => Array.from({ length: bins }, (_, j) => String(Math.ceil((j * p) / bins)));

const round2 = (v) => Number(v.toPrecision(2));

/**
 * Colour scale of the bit-correlation heatmap: +-4/sqrt(N), so that a cell
 * at the 3-sigma threshold is already clearly coloured and pure noise stays
 * pale, whatever the number of observations.
 */
export const correlationRange = (N) => round2(Math.min(1, 4 / Math.sqrt(Math.max(1, N))));

/** Same idea for the avalanche matrix: 4 standard errors of a flip rate measured on the fewest pairs. */
export function sacRange(pairsPerBit) {
  const fewest = Math.min(...pairsPerBit.filter((m) => m > 0));
  return Number.isFinite(fewest) ? round2(Math.min(0.5, 2 / Math.sqrt(fewest))) : 0.5;
}

/** One row per value of [0, p): how many times it occurs as x and as y. */
export const frequencyRows = (s) => s.freqX.map((x, v) => ({ v, x, y: s.freqY[v] }));

/** Largest p for which the page lists the frequency of every value in a table. */
export const FREQUENCY_TABLE_MAX_P = 97;

/** The data of every chart and heatmap of one statistical exploration. */
export function chartData(s, { kBits = 'k', flipBits = 'k' } = {}) {
  const labels = binLabels(s.p, s.histogram.bins);
  const values = Array.from({ length: s.p }, (_, v) => String(v));
  const bitLabels = Array.from({ length: s.bitLength }, (_, i) => String(i));
  const bits = (list) => ({ values: list.map((b) => b.fraction ?? 0), expected: list.map((b) => b.expected), labels: bitLabels, max: 1 });
  const a = s.avalanche;
  return {
    histX: { values: s.histogram.x, expected: s.histogram.expected, labels },
    histY: { values: s.histogram.y, expected: s.histogram.expected, labels },
    freqX: { values: s.freqX, expected: s.N / s.p, labels: values },
    freqY: { values: s.freqY, expected: s.N / s.p, labels: values },
    bitsX: bits(s.bits.x),
    bitsY: bits(s.bits.y),
    distances: { values: a.distances, expected: a.expectedDistances, labels: a.distances.map((_, d) => String(d)) },
    correlation: {
      values: s.correlation.bits.values,
      range: correlationRange(s.N),
      split: s.bitLength,
      rowLabel: kBits,
      colLabels: ['x', 'y'],
    },
    sac: {
      values: sacDeviation(a.sac, a.ideal),
      range: sacRange(a.pairsPerBit),
      split: s.bitLength,
      rowLabel: flipBits,
      colLabels: ['x', 'y'],
    },
  };
}
