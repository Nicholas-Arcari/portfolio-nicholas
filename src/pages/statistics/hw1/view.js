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
 * Status of a test result:
 *   'na'          not computable (fewer than two observations, or every
 *                 possible value present, so nothing left to test)
 *   'invalid'     computed, but its assumptions fail (too few expected
 *                 observations per class, or repeated, dependent values)
 *   'descriptive' exact, but the data are the whole population, not a
 *                 random sample: the p-value describes
 *   'valid'       a proper test
 */
export function testStatus(test) {
  if (!test || !test.computable) return 'na';
  const r = test.reasons;
  if (r.includes('small-sample') || r.includes('duplicates')) return 'invalid';
  if (r.includes('exhaustive')) return 'descriptive';
  return 'valid';
}

/**
 * What the page shows for one uniformity test: its status, the numbers, the
 * reasons behind the status and the reading. U is the uniformity part of
 * the texts in the chosen language.
 */
export function uniformityBlock(test, u, s, label, U) {
  const status = testStatus(test);
  let verdict = null;
  if (test.computable) verdict = status === 'invalid' ? U.noVerdict : U.verdict(test);
  return {
    label,
    status,
    statusLabel: U.status[status],
    help: U.statusHelp[status],
    line: test.computable ? U.line(test) : null,
    reasons: test.reasons.map((r) => U.reasons[r](test, u, s)),
    verdict,
  };
}

/** The two avalanche tests, naive and exact, in the same form; A and U are the avalanche and uniformity texts. */
export function avalancheBlocks(s, A, U) {
  const a = s.avalanche;
  if (!a.measurements) return [];
  const exactStatus = a.exact.pValue === null ? 'na' : 'descriptive';
  return [
    {
      label: A.naiveLabel,
      status: 'invalid',
      statusLabel: U.status.invalid,
      help: U.statusHelp.invalid,
      line: A.naiveLine(a),
      reasons: A.naiveReasons(s),
      verdict: U.noVerdict,
    },
    {
      label: A.exactLabel,
      status: exactStatus,
      statusLabel: U.status[exactStatus],
      help: U.statusHelp[exactStatus],
      line: a.exact.pValue === null ? null : A.exactLine(a),
      reasons: A.exactReasons(s),
      verdict: a.exact.pValue === null ? null : A.exactVerdict(s),
    },
  ];
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

/** Labels of the histogram classes: the first value of each class. */
export const binLabels = (p, bins) => Array.from({ length: bins }, (_, j) => String(Math.ceil((j * p) / bins)));

const round2 = (v) => Number(v.toPrecision(2));

/**
 * Colour scale of the bit-correlation heatmap: +-4/sqrt(N), so that a cell
 * at the 3-sigma threshold is already clearly coloured and pure noise stays
 * pale, whatever the number of observations.
 */
export const correlationRange = (N) => round2(Math.min(1, 4 / Math.sqrt(Math.max(1, N))));

/** One row per value of [0, p): how many times it occurs as x and as y. */
export const frequencyRows = (s) => s.freqX.map((x, v) => ({ v, x, y: s.freqY[v] }));

/** Largest p for which the page lists the frequency of every value in a table. */
export const FREQUENCY_TABLE_MAX_P = 97;

/**
 * The data of every chart and heatmap of one statistical exploration.
 * `decimal` is the decimal separator of the axis labels and legends.
 */
export function chartData(s, { kBits = 'k', flipBits = 'k', decimal = '.' } = {}) {
  const labels = binLabels(s.p, s.histogram.bins);
  const values = Array.from({ length: s.p }, (_, v) => String(v));
  const bitLabels = Array.from({ length: s.bitLength }, (_, i) => String(i));
  const bits = (list) => ({ values: list.map((b) => b.fraction ?? 0), expected: list.map((b) => b.expected), labels: bitLabels, max: 1, decimal });
  const a = s.avalanche;
  return {
    histX: { values: s.histogram.x, expected: s.histogram.expected, labels, decimal },
    histY: { values: s.histogram.y, expected: s.histogram.expected, labels, decimal },
    freqX: { values: s.freqX, expected: s.N / s.p, labels: values, decimal },
    freqY: { values: s.freqY, expected: s.N / s.p, labels: values, decimal },
    bitsX: bits(s.bits.x),
    bitsY: bits(s.bits.y),
    distances: { values: a.distances, expected: a.expectedDistances, labels: a.distances.map((_, d) => String(d)), decimal },
    correlation: {
      values: s.correlation.bits.values,
      range: correlationRange(s.N),
      split: s.bitLength,
      rowLabel: kBits,
      colLabels: ['x', 'y'],
      decimal,
    },
    // the avalanche matrix as z-scores against the reference functions of the exact test
    sac: {
      values: a.exact.z,
      range: 4,
      split: s.bitLength,
      rowLabel: flipBits,
      colLabels: ['x', 'y'],
      decimal,
    },
  };
}

/**
 * What the label over each chart of chartData says for the bar or the cell
 * under the pointer (hw.attachChartTooltip), from the same statistics. P is
 * the `tips` part of the texts. A bar may stand for several values when
 * the chart has more of them than pixels: then the label gives the range.
 */
export function chartTips(s, P) {
  const sum = (list, from, to) => list.slice(from, to).reduce((a, b) => a + b, 0);
  const classStart = (j) => Math.ceil((j * s.p) / s.histogram.bins);
  const hist = (coord, counts) => ({ from, to }) => P.hist(coord, classStart(from), classStart(to) - 1, sum(counts, from, to), sum(s.histogram.expected, from, to));
  const freq = (coord, counts) => ({ from, to }) => {
    const part = counts.slice(from, to);
    return P.freq(coord, from, to - 1, Math.min(...part), Math.max(...part), s.N / s.p);
  };
  const bit = (coord, list) => ({ from }) => P.bit(coord, list[from]);
  const L = s.bitLength;
  // the heatmaps have the bits of x in the first L columns, those of y after
  const cell = (values, describe) => ({ row, col }) => (col < L ? describe(row, 'x', col, values[row][col]) : describe(row, 'y', col - L, values[row][col]));
  const a = s.avalanche;
  return {
    histX: hist('x', s.histogram.x),
    histY: hist('y', s.histogram.y),
    freqX: freq('x', s.freqX),
    freqY: freq('y', s.freqY),
    bitsX: bit('x', s.bits.x),
    bitsY: bit('y', s.bits.y),
    distances: ({ from }) => P.distance(from, a.distances[from], a.expectedDistances[from]),
    correlation: cell(s.correlation.bits.values, P.correlation),
    sac: cell(a.exact.z, P.sac),
  };
}

// --- Drawing many charts without freezing the page ---------------------------

const frameJobs = [];
let frameRequested = false;

function runFrameJobs() {
  const start = Date.now();
  while (frameJobs.length && Date.now() - start < 8) frameJobs.shift()();
  frameRequested = frameJobs.length > 0;
  if (frameRequested) requestAnimationFrame(runFrameJobs);
}

/**
 * Runs drawing work a few milliseconds per frame: a page with twenty charts
 * would otherwise draw them all in one long task, and on a slow phone the
 * page would stop responding for a moment.
 */
export function scheduleFrameJob(job) {
  frameJobs.push(job);
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(runFrameJobs);
  }
}
