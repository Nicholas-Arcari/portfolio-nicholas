// src/pages/statistics/hw4/view.js
// Logica di presentazione dell'Homework #4, condivisa fra la pagina del sito
// (React) e il programma scaricabile (DOM puro): le sezioni, la lettura dei
// campi, le righe delle tabelle, i dati dei grafici e i fatti che i testi
// citano. Tenerla qui impedisce che le due versioni dicano cose diverse
// sugli stessi numeri.
import * as hw from './homework4.js';

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
export const SECTIONS = [
  { id: 'hw4-assignment', key: 'assignment', level: 0 },
  { id: 'hw4-part1', key: 'part1', level: 0 },
  { id: 'hw4-knuth', key: 'knuth', level: 1 },
  { id: 'hw4-ss', key: 'ss', level: 1 },
  { id: 'hw4-try-drag', key: 'tryDrag', level: 2 },
  { id: 'hw4-variance', key: 'variance', level: 1 },
  { id: 'hw4-steps', key: 'steps', level: 1 },
  { id: 'hw4-stability', key: 'stability', level: 1 },
  { id: 'hw4-try-digits', key: 'tryDigits', level: 2 },
  { id: 'hw4-checks', key: 'checks', level: 1 },
  { id: 'hw4-part2', key: 'part2', level: 0 },
  { id: 'hw4-scores', key: 'scores', level: 1 },
  { id: 'hw4-input', key: 'input', level: 1 },
  { id: 'hw4-trajectories', key: 'trajectories', level: 1 },
  { id: 'hw4-averages', key: 'averages', level: 1 },
  { id: 'hw4-comparison', key: 'comparison', level: 1 },
  { id: 'hw4-try-bessel', key: 'tryBessel', level: 2 },
  { id: 'hw4-spread', key: 'spread', level: 1 },
  { id: 'hw4-inference', key: 'inference', level: 1 },
  { id: 'hw4-try-intervals', key: 'tryIntervals', level: 2 },
  { id: 'hw4-tests', key: 'tests', level: 0 },
  { id: 'hw4-history', key: 'history', level: 0 },
  { id: 'hw4-conclusion', key: 'conclusion', level: 0 },
];

/** The entries of the index: the sections with their titles in the current language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

// ---------------------------------------------------------------------------
// Part 1: i dati
// ---------------------------------------------------------------------------

/** The data of section 1.4 as the page opens with them. */
export const DEFAULT_DATA_TEXT = hw.DEFAULT_DATA.join(' ');
export const DATA_LENGTH = 600;

/** The y axis of the chart of section 1.4: every value and every band M_k +- s_k, with a margin. */
export function stepsChart(rows, k, decimal = '.') {
  let lo = Infinity;
  let hi = -Infinity;
  for (const r of rows) {
    const s = r.k > 1 ? Math.sqrt(r.variance) : 0;
    lo = Math.min(lo, r.x, r.mean - s);
    hi = Math.max(hi, r.x, r.mean + s);
  }
  const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.01 || 1;
  const yTicks = hw.niceTicks(lo - pad, hi + pad, 5);
  return { rows, k, yMin: Math.min(lo - pad, yTicks[0]), yMax: Math.max(hi + pad, yTicks[yTicks.length - 1]), yTicks, decimal };
}

/** The three formulas on the data of section 1.4, and the largest relative difference among them. */
export function stepsCheck(values) {
  const w = hw.welford(values);
  const twoPass = hw.twoPassVariance(values);
  const naive = hw.naiveVariance(values);
  const rel = (v) => (twoPass === 0 ? Math.abs(v) : Math.abs(v - twoPass) / Math.abs(twoPass));
  return { welford: w.variance, mean: w.mean, twoPass, naive, welfordError: rel(w.variance), naiveError: rel(naive) };
}

/** The stability curve of section 1.5 on logarithmic axes: the relative error of the three formulas against log10 c. */
export const ERROR_FLOOR = 1e-17;
export const ERROR_CEILING = 10;

export function stabilityChart(curve, decimal = '.') {
  const clamp = (v) => Math.min(ERROR_CEILING, Math.max(ERROR_FLOOR, v));
  return {
    x: curve.rows.map((r) => r.power),
    logY: true,
    yMin: ERROR_FLOOR,
    yMax: ERROR_CEILING,
    yTicks: [1e-16, 1e-12, 1e-8, 1e-4, 1],
    xTicks: [0, 2, 4, 6, 8, 10, 12, 14],
    decimal,
    series: hw.FORMULAS.map((f, i) => ({ values: curve.rows.map((r) => clamp(r.errors[f])), colorIndex: [1, 3, 0][i] })),
  };
}

/** Where every formula of section 1.5 breaks: the first offset with a relative error above 10^-6 and above 100%, and the error at the largest offset. */
export function stabilityFacts(curve) {
  const out = {};
  for (const f of hw.FORMULAS) {
    const first = (limit) => {
      const r = curve.rows.find((row) => row.errors[f] > limit);
      return r ? r.power : null;
    };
    out[f] = { micro: first(1e-6), total: first(1), last: curve.rows[curve.rows.length - 1].errors[f] };
  }
  return { ...out, exact: curve.exact, size: curve.size, maxPower: curve.rows[curve.rows.length - 1].power, negative: curve.rows.some((r) => r.values.naive < 0) };
}

// ---------------------------------------------------------------------------
// I campi
// ---------------------------------------------------------------------------

/** How many characters each field accepts. */
export const FIELD_LENGTH = Object.freeze({ p: 8, n: 6, m: 6, seed: 10 });

export const DEFAULT_PARAMS = Object.freeze({ dist: hw.DEFAULT_DIST, p: hw.DEFAULT_P, n: hw.DEFAULT_N, m: hw.DEFAULT_M, seed: hw.DEFAULT_SEED });

/** The text of the fields for some parameters (the distribution is chosen with buttons). */
export const fieldsOf = (params) => ({ pText: String(params.p), nText: String(params.n), mText: String(params.m), seedText: String(params.seed) });

export const DEFAULT_INPUTS = Object.freeze(fieldsOf(DEFAULT_PARAMS));

/** The four fields, read and checked. */
export const readInputs = ({ pText, nText, mText, seedText }) => ({
  p: hw.parseProbability(pText),
  n: hw.parseInteger(nText, hw.LIMITS.n),
  m: hw.parseInteger(mText, hw.LIMITS.m),
  seed: hw.parseInteger(seedText, hw.LIMITS.seed),
});

export const sameParams = (a, b) => a.dist === b.dist && a.p === b.p && a.n === b.n && a.m === b.m && a.seed === b.seed;

/** The parameters to use: the value of every valid field, the last valid value of the others (the same object if nothing changes). */
export function applyInputs(read, previous, dist = previous.dist) {
  const next = { dist };
  for (const key of ['p', 'n', 'm', 'seed']) next[key] = read[key].ok ? read[key].value : previous[key];
  return sameParams(next, previous) ? previous : next;
}

export const allValid = (read) => read.p.ok && read.n.ok && read.m.ok && read.seed.ok;

/** The key of a computation in the cache and in the worker: one per set of parameters. */
export const paramsKey = (params) => `${params.dist}|${params.p}|${params.n}|${params.m}|${params.seed}`;
export function parseParamsKey(key) {
  const [dist, p, n, m, seed] = key.split('|');
  return { dist, p: Number(p), n: Number(n), m: Number(m), seed: Number(seed) };
}

/** The line under the fields: the initial values, or different ones with the button that restores them. */
export function inputBadge(params, I) {
  return sameParams(params, DEFAULT_PARAMS) ? { known: true, text: I.defaultBadge, restore: false } : { known: false, text: I.customBadge, restore: true };
}

// ---------------------------------------------------------------------------
// 2.1 Le distribuzioni dei punteggi
// ---------------------------------------------------------------------------

/** The moments of the four laws, for the table of section 2.1 (the outcome law with the p in use). */
export const lawRows = (p) => hw.DISTRIBUTIONS.map((dist) => hw.scoreLaw(dist, p));

/**
 * The scores of section 2.1: for the discrete laws one bar per integer, its
 * share among all the simulated scores, against the probability of the law
 * (dashed); for the Beta law the density of the scores per unit interval,
 * against the probability of the interval and the density curve. Before the
 * simulation, the law alone.
 */
export function scoresChart(law, s, decimal = '.') {
  const sim = s && s.law.dist === law.dist && s.law.p === law.p ? s.pooled : null;
  const total = sim ? sim.total : 1;
  const xTicks = [0, 2, 4, 6, 8, 10];
  if (law.discrete) {
    const bars = Array.from(law.pmf, (pr, k) => ({ from: k - 0.4, to: k + 0.4, value: sim ? sim.counts[k] / total : pr, share: sim ? sim.counts[k] / total : null, prob: pr, k }));
    return { x0: -0.7, x1: 10.7, bars, expected: sim ? Array.from(law.pmf) : null, xTicks, decimal };
  }
  const bars = law.classes.map((pr, i) => ({ from: i, to: i + 1, value: sim ? sim.counts[i] / total : pr, share: sim ? sim.counts[i] / total : null, prob: pr, k: i }));
  const curve = [];
  for (let i = 0; i <= 200; i++) curve.push([i / 20, law.density(i / 20)]);
  return { x0: 0, x1: 10, bars, expected: sim ? [...law.classes] : null, curve, xTicks, decimal };
}

// ---------------------------------------------------------------------------
// L'animazione
// ---------------------------------------------------------------------------

/** The animation: hackers drawn, hackers in the histogram, the speeds (1 = a run in about 15 seconds). */
export const ANIMATION = Object.freeze({ shown: 50, sample: 500, speeds: Object.freeze([0.25, 1, 4]) });

/** The options of the animation for some parameters: it draws and counts at most m hackers. */
export const animationOptions = (params) => ({
  dist: params.dist,
  p: params.p,
  n: params.n,
  m: params.m,
  seed: params.seed,
  shown: Math.min(ANIMATION.shown, params.m),
  sample: Math.min(ANIMATION.sample, params.m),
});

// ---------------------------------------------------------------------------
// 2.4 e 2.5 Le medie fra gli hacker
// ---------------------------------------------------------------------------

const Z95 = 1.959963984540054;

/**
 * The rows of section 2.4, one per n: the average of the sampling means and
 * of the sampling variances over the m hackers, with how many standard
 * errors each lies from mu and sigma^2 (the standard error of an average of
 * m independent values is the standard deviation of one over sqrt(m)),
 * and the average of the biased SS/n against sigma^2 (n - 1)/n.
 */
export function averageRows(s) {
  const m = s.m;
  return s.points.map((pt) => {
    const T = pt.theory;
    return {
      n: pt.n,
      mean: pt.meanStats.mean,
      meanZ: (pt.meanStats.mean - T.mean) / (T.sdMean / Math.sqrt(m)),
      variance: pt.varStats.mean,
      varianceZ: (pt.varStats.mean - T.variance) / (T.sdVariance / Math.sqrt(m)),
      biased: pt.biased,
      biasedTheory: T.biased,
      bias: pt.biased - T.variance,
    };
  });
}

/** How many averages fall outside their 95% band, and the farthest one. */
export function averageFacts(s) {
  const rows = averageRows(s);
  const outside = (key) => rows.filter((r) => Math.abs(r[key]) > Z95);
  const farthest = (key) => rows.reduce((best, r) => (Math.abs(r[key]) > Math.abs(best[key]) ? r : best), rows[0]);
  const last = rows[rows.length - 1];
  const small = rows.find((r) => r.n === hw.SMALL_N) || rows[0];
  return {
    rows,
    count: rows.length,
    expectedOutside: rows.length * (1 - hw.CONFIDENCE),
    meansOutside: outside('meanZ'),
    variancesOutside: outside('varianceZ'),
    farthestMean: farthest('meanZ'),
    farthestVariance: farthest('varianceZ'),
    first: rows[0],
    small,
    last,
  };
}

/** Section 2.5: how far a single hacker's estimates go at n = SMALL_N, although their average is right. */
export function comparisonFacts(s) {
  const pt = hw.pointAt(s.points, hw.SMALL_N);
  const { law } = s;
  const sortedMeans = Float64Array.from(pt.means).sort();
  const sortedVariances = Float64Array.from(pt.variances).sort();
  const within = (values, center) => {
    let inside = 0;
    for (const v of values) if (Math.abs(v - center) <= 0.1 * center) inside++;
    return inside / values.length;
  };
  return {
    n: pt.n,
    mean5: quantile(sortedMeans, 0.05),
    mean95: quantile(sortedMeans, 0.95),
    variance5: quantile(sortedVariances, 0.05),
    variance95: quantile(sortedVariances, 0.95),
    withinMean: within(pt.means, law.mu),
    withinVariance: within(pt.variances, law.variance),
  };
}

const logTicks = (nMax) => [1, 10, 100, 1000, 10000, 100000].filter((v) => v <= nMax);

/** The x axis of the charts against n: the checkpoints, on a logarithmic axis. */
const nAxis = (s) => {
  const x = s.points.map((pt) => pt.n);
  return { x, logX: true, xTicks: [2, ...logTicks(x[x.length - 1]).filter((v) => v > 2)] };
};

/** A y range with round ticks around some values. */
function rangeOf(values, spare = 0.08) {
  const finite = values.filter((v) => Number.isFinite(v));
  let lo = Math.min(...finite);
  let hi = Math.max(...finite);
  const pad = (hi - lo) * spare || Math.abs(hi) * 0.05 || 1;
  lo -= pad;
  hi += pad;
  const yTicks = hw.niceTicks(lo, hi, 5);
  return { yMin: Math.min(lo, yTicks[0]), yMax: Math.max(hi, yTicks[yTicks.length - 1]), yTicks };
}

/** Section 2.4: the average of the sampling means against mu, with the 95% band in which it falls if M_n is unbiased. */
export function meansChart(s, decimal = '.') {
  const { law, m } = s;
  const half = s.points.map((pt) => Z95 * pt.theory.sdMean / Math.sqrt(m));
  const values = s.points.map((pt) => pt.meanStats.mean);
  return {
    ...nAxis(s),
    ...rangeOf([...values, ...half.map((h) => law.mu + h), ...half.map((h) => law.mu - h)]),
    decimal,
    series: [
      { values: s.points.map(() => law.mu), band: half.map((h) => [law.mu - h, law.mu + h]), colorIndex: 2, dashed: true },
      { values, colorIndex: 0 },
    ],
  };
}

/** Section 2.4: the average of s_n^2 against sigma^2 (with its 95% band), and the average of SS_n/n against sigma^2 (n - 1)/n. */
export function variancesChart(s, decimal = '.') {
  const { law, m } = s;
  const half = s.points.map((pt) => Z95 * pt.theory.sdVariance / Math.sqrt(m));
  const unbiased = s.points.map((pt) => pt.varStats.mean);
  const biased = s.points.map((pt) => pt.biased);
  const theory = s.points.map((pt) => pt.theory.biased);
  return {
    ...nAxis(s),
    ...rangeOf([...unbiased, ...biased, ...theory, ...half.map((h) => law.variance + h), ...half.map((h) => law.variance - h)], 0.05),
    decimal,
    series: [
      { values: s.points.map(() => law.variance), band: half.map((h) => [law.variance - h, law.variance + h]), colorIndex: 2, dashed: true },
      { values: unbiased, colorIndex: 0 },
      { values: theory, colorIndex: 1, dashed: true },
      { values: biased, colorIndex: 1, dotsOnly: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// 2.6 La variabilita' al crescere di n
// ---------------------------------------------------------------------------

/** The rows of section 2.6: the variance of the m sampling means and of the m sampling variances, against the theory. */
export const spreadRows = (s) =>
  s.points.map((pt) => ({
    n: pt.n,
    varMean: pt.meanStats.variance,
    varMeanTheory: pt.theory.varMean,
    sdRatioMean: Math.sqrt(pt.meanStats.variance / pt.theory.varMean),
    varVariance: pt.varStats.variance,
    varVarianceTheory: pt.theory.varVariance,
    normalVariance: pt.theory.normalVariance,
    sdRatioVariance: Math.sqrt(pt.varStats.variance / pt.theory.varVariance),
    skewMean: pt.meanStats.skewness,
    skewMeanTheory: pt.theory.skewMean,
    skewVariance: pt.varStats.skewness,
  }));

const decade = (v, up) => 10 ** (up ? Math.ceil(Math.log10(v)) : Math.floor(Math.log10(v)));

/** The spread against n on logarithmic axes: simulated (dots) and exact (dashed); for s^2 also the value of normal scores (dotted). */
export function spreadChart(s, decimal = '.') {
  const rows = spreadRows(s);
  const all = rows.flatMap((r) => [r.varMean, r.varMeanTheory, r.varVariance, r.varVarianceTheory, r.normalVariance]).filter((v) => v > 0);
  const yMin = decade(Math.min(...all), false);
  const yMax = decade(Math.max(...all), true);
  const yTicks = [];
  for (let v = yMin; v <= yMax * 1.0001; v *= 10) yTicks.push(v);
  return {
    ...nAxis(s),
    logY: true,
    yMin,
    yMax,
    yTicks: yTicks.length > 6 ? yTicks.filter((_, i) => i % 2 === 0) : yTicks,
    decimal,
    series: [
      { values: rows.map((r) => r.varMean), colorIndex: 0, dotsOnly: true },
      { values: rows.map((r) => r.varMeanTheory), colorIndex: 0, dashed: true },
      { values: rows.map((r) => r.varVariance), colorIndex: 1, dotsOnly: true },
      { values: rows.map((r) => r.varVarianceTheory), colorIndex: 1, dashed: true },
      { values: rows.map((r) => r.normalVariance), colorIndex: 3, dotted: true },
    ],
  };
}

/** The slopes of log Var against log n: -1 for both, the mean at every n, the variance once n is not tiny. */
export function spreadFacts(s) {
  const rows = spreadRows(s);
  const fit = (list, key) => hw.fitLine(list.map((r) => Math.log10(r.n)), list.map((r) => Math.log10(r[key])));
  const tail = rows.filter((r) => r.n >= hw.SMALL_N);
  const last = rows[rows.length - 1];
  const first = rows[0];
  const small = rows.find((r) => r.n === hw.SMALL_N) || rows[0];
  return {
    rows,
    meanSlope: fit(rows, 'varMean'),
    varianceSlope: fit(tail.length >= 3 ? tail : rows, 'varVariance'),
    first,
    small,
    last,
    shrinkMean: Math.sqrt(first.varMean / last.varMean),
    shrinkVariance: Math.sqrt(first.varVariance / last.varVariance),
    normalRatioSmall: small.varVarianceTheory / small.normalVariance,
  };
}

/**
 * A histogram whose bins follow the lattice of the values (spacing h, 0 for
 * a continuous law): every bin holds a whole number of lattice points,
 * centred on them, so that no bin gets one point more than its neighbour.
 * Heights are densities, share divided by width, comparable with a density
 * curve.
 */
export function latticeBins(values, [x0, x1], spacing, target = 44) {
  let width = (x1 - x0) / target;
  let start = x0;
  if (spacing > 0) {
    width = spacing * Math.max(1, Math.round(width / spacing));
    start = Math.floor((x0 + spacing / 2) / width) * width - spacing / 2;
  }
  const count = Math.max(1, Math.ceil((x1 - start) / width));
  const counts = new Array(count).fill(0);
  for (const v of values) {
    const b = Math.floor((v - start) / width);
    if (b >= 0 && b < count) counts[b]++;
  }
  const total = values.length;
  const bars = counts.map((c, b) => ({ from: start + b * width, to: start + (b + 1) * width, value: c / total / width, share: c / total })).filter((b) => b.to > x0 && b.from < x1);
  return { bars, width };
}

/**
 * The normal density N(mean, sd^2) averaged over windows as wide as the
 * bins: the height a bar centred at x would have under the normal law. With
 * narrow bins it is the density itself; with wide ones it stays comparable
 * with the bars.
 */
export function normalCurve(mean, sd, width, [x0, x1]) {
  const points = Math.min(1200, Math.max(160, Math.ceil((x1 - x0) / (Math.min(width, sd) / 2))));
  const out = [];
  for (let i = 0; i <= points; i++) {
    const x = x0 + (i * (x1 - x0)) / points;
    out.push([x, (hw.normalCdf((x + width / 2 - mean) / sd) - hw.normalCdf((x - width / 2 - mean) / sd)) / width]);
  }
  return out;
}

/** The axis modes of the histograms of section 2.6: the same axis for every n, or the axis of the chosen n. */
export const AXIS_MODES = Object.freeze(['fixed', 'own']);

const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))];

// the fixed axis of the variances: wide enough for 99.5% of the hackers at the smallest n
const fixedVarianceAxis = new WeakMap();
function varianceAxis(s) {
  if (!fixedVarianceAxis.has(s)) {
    const sorted = Float64Array.from(s.points[0].variances).sort();
    fixedVarianceAxis.set(s, [0, Math.max(quantile(sorted, 0.995), s.law.variance * 2)]);
  }
  return fixedVarianceAxis.get(s);
}

/**
 * The histogram of the m sampling means (quantity 'mean') or variances
 * ('variance') at checkpoint g, with the normal law of the theory: N(mu,
 * sigma^2/n) or N(sigma^2, Var(s_n^2)). For discrete scores the means lie
 * on a lattice of step 1/n and the variances of step 1/(n (n - 1)), since
 * n SS_n = n sum x^2 - (sum x)^2 is an integer.
 */
export function spreadHistogram(s, g, quantity, mode, decimal = '.') {
  const pt = s.points[g];
  const { law } = s;
  const T = pt.theory;
  const isMean = quantity === 'mean';
  const center = isMean ? T.mean : T.variance;
  const sd = isMean ? T.sdMean : T.sdVariance;
  let range;
  if (mode === 'fixed') range = isMean ? [0, hw.SCORE_MAX] : varianceAxis(s);
  else range = isMean ? [Math.max(0, center - 4.5 * sd), Math.min(hw.SCORE_MAX, center + 4.5 * sd)] : [Math.max(0, center - 4.5 * sd), center + 4.5 * sd];
  const spacing = law.discrete ? (isMean ? 1 / pt.n : 1 / (pt.n * (pt.n - 1))) : 0;
  const { bars, width } = latticeBins(isMean ? pt.means : pt.variances, range, spacing);
  const normal = { mean: center, sd };
  return { x0: range[0], x1: range[1], bars, curve: normalCurve(center, sd, width, range), normal, xTicks: hw.niceTicks(range[0], range[1], 6), decimal };
}

// ---------------------------------------------------------------------------
// 2.7 Statistica inferenziale
// ---------------------------------------------------------------------------

/** The rows of section 2.7: coverage of the two intervals and the correlation of mean and variance, against the theory. */
export const inferenceRows = (s) =>
  s.points.map((pt) => ({
    n: pt.n,
    t: pt.coverage.t,
    tQuantile: pt.coverage.tQuantile,
    chi2: pt.coverage.chi2,
    corr: pt.corr,
    corrTheory: pt.theory.corr,
    halfWidth: pt.coverage.tQuantile * Math.sqrt(pt.varStats.mean / pt.n),
  }));

/** The coverage of the two 95% intervals against n, with 95% and the limit of the chi-square interval. */
export function coverageChart(s, decimal = '.') {
  const rows = inferenceRows(s);
  const limit = hw.chiSquareCoverageLimit(s.law);
  const low = Math.min(0.8, ...rows.map((r) => r.t), ...rows.map((r) => r.chi2), limit);
  const yMin = Math.floor(low * 20) / 20;
  return {
    ...nAxis(s),
    yMin,
    yMax: 1,
    yTicks: hw.niceTicks(yMin, 1, 5),
    decimal,
    series: [
      { values: rows.map(() => hw.CONFIDENCE), colorIndex: 2, dashed: true },
      { values: rows.map(() => limit), colorIndex: 1, dotted: true },
      { values: rows.map((r) => r.t), colorIndex: 0 },
      { values: rows.map((r) => r.chi2), colorIndex: 1 },
    ],
  };
}

/** Coverage and correlation facts for the texts of section 2.7. */
export function inferenceFacts(s) {
  const rows = inferenceRows(s);
  return {
    rows,
    first: rows[0],
    small: rows.find((r) => r.n === hw.SMALL_N) || rows[0],
    last: rows[rows.length - 1],
    limit: hw.chiSquareCoverageLimit(s.law),
    slope: s.law.mu3 / s.law.variance,
    ties: s.law.discrete ? s.law.pmf.reduce((t, pr) => t + pr * pr, 0) : 0,
  };
}

/** The scatter plot of section 2.7: every hacker as (M_n, s_n^2) at checkpoint g, with the theoretical regression line of slope mu3/sigma^2. */
export function scatterData(s, g, decimal = '.') {
  const pt = s.points[g];
  const { law } = s;
  const xs = Float64Array.from(pt.means).sort();
  const ys = Float64Array.from(pt.variances).sort();
  const span = (sorted, center) => {
    let lo = Math.min(quantile(sorted, 0.002), center);
    let hi = Math.max(quantile(sorted, 0.998), center);
    const pad = (hi - lo) * 0.06 || 1;
    lo -= pad;
    hi += pad;
    return [lo, hi];
  };
  const [x0, x1] = span(xs, law.mu);
  const [y0, y1] = span(ys, law.variance);
  return {
    xs: pt.means,
    ys: pt.variances,
    x0,
    x1,
    y0: Math.max(y0, -0.02 * (y1 - y0)),
    y1,
    xTicks: hw.niceTicks(x0, x1, 6),
    yTicks: hw.niceTicks(Math.max(y0, 0), y1, 5),
    center: [law.mu, law.variance],
    slope: law.mu3 / law.variance,
    decimal,
  };
}

// ---------------------------------------------------------------------------
// Gli esempi interattivi ("Prova")
// ---------------------------------------------------------------------------

/** The draggable data of section 1.2 as the page opens with them, and their range. */
export const DRAG = Object.freeze({ values: hw.DEFAULT_DATA, lo: 0, hi: hw.SCORE_MAX });

/** The two data sets of the live cancellation of section 1.5: the classic example and the first 1000 scores of hacker 1. */
export const DIGIT_DATASETS = Object.freeze(['classic', 'scores']);
export const DIGIT_POWERS = Object.freeze([0, 15]);

let scoreSample = null;
function digitBase(dataset) {
  if (dataset === 'classic') return { values: [...hw.CANCELLATION_DATA], exact: 30 };
  if (!scoreSample) {
    const draw = hw.hackerScores(hw.DEFAULT_SEED, hw.scoreLaw(hw.DEFAULT_DIST, hw.DEFAULT_P), 0);
    const y = Array.from({ length: hw.STABILITY_SIZE }, draw);
    let s1 = 0;
    let s2 = 0;
    for (const v of y) {
      s1 += v;
      s2 += v * v;
    }
    const N = y.length;
    scoreSample = { values: y, exact: (N * s2 - s1 * s1) / (N * (N - 1)) };
  }
  return scoreSample;
}

/**
 * A number split into digits, each marked as right ('ok') or wrong ('bad')
 * against the exact value at the same decimal position: the digits of the
 * live cancellation. Values far from the exact one (another order of
 * magnitude, or negative) are all wrong and shown in scientific notation.
 */
export function digitMarks(value, exact) {
  const decimals = Math.max(0, 16 - Math.floor(Math.log10(Math.abs(exact))));
  if (!Number.isFinite(value) || value <= 0 || Math.abs(value) >= 1e6 * Math.abs(exact) || Math.abs(value) < Math.abs(exact) / 1e6) {
    return { parts: [{ text: Number.isFinite(value) ? value.toPrecision(6) : String(value), ok: false }], right: 0 };
  }
  const shown = value.toFixed(decimals).replace(/\.?0+$/, '') || '0';
  const reference = exact.toFixed(decimals);
  const [vi, vf = ''] = shown.split('.');
  const [ei, ef = ''] = reference.split('.');
  const parts = [];
  let right = 0;
  let wrongSeen = false;
  // another number of integer digits: another order of magnitude, every digit is wrong
  if (vi.length !== ei.length) wrongSeen = true;
  const width = Math.max(vi.length, ei.length);
  const vInt = vi.padStart(width, ' ');
  const eInt = ei.padStart(width, ' ');
  const mark = (ch, ref) => {
    const ok = !wrongSeen && ch === ref;
    if (!ok) wrongSeen = true;
    else if (/\d/.test(ch)) right++;
    parts.push({ text: ch, ok });
  };
  for (let i = 0; i < width; i++) if (vInt[i] !== ' ') mark(vInt[i], eInt[i]);
  if (vf) {
    parts.push({ text: '.', ok: !wrongSeen, point: true });
    for (let i = 0; i < vf.length; i++) mark(vf[i], ef[i] || '0');
  }
  // the zeros that the exact value has and the shown one omits are right as well
  if (!wrongSeen) right = Math.max(right, 16);
  return { parts, right: Math.min(16, right) };
}

/** The common leading characters of two numbers written with 17 significant digits: what the subtraction cancels. */
function commonPrefix(a, b) {
  // the mantissas are compared digit by digit; the exponent, the same for both, is shown apart
  const [x, ex = ''] = a.toPrecision(17).split('e');
  const [y, ey = ''] = b.toPrecision(17).split('e');
  let i = 0;
  while (i < x.length && x[i] === y[i] && ex === ey) i++;
  const digits = (t) => t.replace(/[^0-9]/g, '').length;
  return { a: x, b: y, exponents: [ex ? `e${ex}` : '', ey ? `e${ey}` : ''], common: i, commonDigits: digits(x.slice(0, i)), total: digits(x) };
}

/**
 * The live cancellation: the data of a set shifted by c = 10^power, the
 * variance with the three formulas, each with its right and wrong digits,
 * and, for the textbook formula, the two huge sums it subtracts.
 */
export function digitsReport(power, dataset) {
  const base = digitBase(dataset);
  const c = 10 ** power;
  const x = base.values.map((v) => c + v);
  let s1 = 0;
  let s2 = 0;
  for (const v of x) {
    s1 += v;
    s2 += v * v;
  }
  const n = x.length;
  const values = { naive: hw.naiveVariance(x), twoPass: hw.twoPassVariance(x), welford: hw.welford(x).variance };
  const rows = hw.FORMULAS.map((f) => ({ formula: f, value: values[f], error: Math.abs(values[f] - base.exact) / base.exact, ...digitMarks(values[f], base.exact) }));
  return { power, dataset, n, exact: base.exact, rows, sums: commonPrefix(s2, (s1 * s1) / n) };
}

/** The values of n of the live examples of sections 2.5 and 2.7, and the levels of the intervals. */
export const BESSEL_N = Object.freeze([2, 50]);
export const BESSEL_MAX = 20000;
export const INTERVAL_NS = Object.freeze([2, 3, 5, 10, 20, 30, 50, 100, 200]);
export const LEVELS = Object.freeze([0.8, 0.9, 0.95, 0.99]);
export const INTERVAL_SIZE = 100;

/** A new live Bessel experiment: no samples yet. */
export const besselStart = (params, n) => ({ seed: params.seed, dist: params.dist, p: params.p, n, count: 0, sumVariance: 0, sumBiased: 0, history: [], last: null });

/**
 * Draws `count` more samples of the live Bessel experiment: sample j is
 * hacker j of the simulation, its first n scores. Returns the new state; the
 * running averages are recorded at every sample at first, then every 4%.
 */
export function besselAdvance(state, count) {
  const law = hw.scoreLaw(state.dist, state.p);
  const next = { ...state, history: [...state.history] };
  const target = Math.min(BESSEL_MAX, state.count + count);
  while (next.count < target) {
    const sample = hw.sampleStats(state.seed, law, next.count, state.n);
    next.count += 1;
    next.sumVariance += sample.variance;
    next.sumBiased += sample.biased;
    next.last = sample;
    const lastRecorded = next.history.length ? next.history[next.history.length - 1][0] : 0;
    if (next.count <= 20 || next.count >= lastRecorded * 1.04 || next.count === target) next.history.push([next.count, next.sumVariance / next.count, next.sumBiased / next.count]);
  }
  return next;
}

/** The chart of the live Bessel experiment: the two running averages against sigma^2 (with its 95% band) and sigma^2 (n - 1)/n. */
export function besselChart(state, decimal = '.') {
  const law = hw.scoreLaw(state.dist, state.p);
  const T = hw.samplingTheory(law, state.n);
  const counts = state.history.map((h) => h[0]);
  const end = Math.max(10, ...counts);
  const x = [...counts];
  if (x.length === 0 || x[x.length - 1] < end) x.push(end);
  if (x[0] > 1) x.unshift(1);
  const at = (count) => state.history.find((h) => h[0] === count);
  const pick = (i) => x.map((c) => (at(c) ? at(c)[i] : null));
  const half = (c) => (Z95 * T.sdVariance) / Math.sqrt(c);
  const averages = [...pick(1), ...pick(2)].filter((v) => v !== null);
  const visibleBand = x.filter((c) => c >= 30).flatMap((c) => [law.variance - half(c), law.variance + half(c)]);
  const range = rangeOf([...averages, law.variance, T.biased, ...visibleBand]);
  return {
    x,
    logX: true,
    xTicks: logTicks(end),
    ...range,
    decimal,
    series: [
      { values: x.map(() => law.variance), band: x.map((c) => [law.variance - half(c), law.variance + half(c)]), colorIndex: 2, dashed: true },
      { values: x.map(() => T.biased), colorIndex: 1, dashed: true },
      { values: pick(1), colorIndex: 0, dots: false },
      { values: pick(2), colorIndex: 1, dots: false },
    ],
  };
}

/**
 * One batch of the live intervals of section 2.7: the first n scores of
 * hackers batch x 100, ..., batch x 100 + 99, and for each the interval at
 * the chosen level for mu (Student's t) or sigma^2 (chi-square), green if it
 * contains the true value.
 */
export function intervalBatch({ seed, dist, p, n, level, param, batch }) {
  const law = hw.scoreLaw(dist, p);
  const q = (1 + level) / 2;
  const t = hw.studentQuantile(q, n - 1);
  const chiLow = hw.chiSquareQuantile(1 - q, n - 1);
  const chiHigh = hw.chiSquareQuantile(q, n - 1);
  const truth = param === 'mean' ? law.mu : law.variance;
  const rows = [];
  for (let i = 0; i < INTERVAL_SIZE; i++) {
    const s = hw.sampleStats(seed, law, batch * INTERVAL_SIZE + i, n);
    let lo;
    let hi;
    let est;
    if (param === 'mean') {
      const half = t * Math.sqrt(s.variance / n);
      lo = s.mean - half;
      hi = s.mean + half;
      est = s.mean;
    } else {
      lo = ((n - 1) * s.variance) / chiHigh;
      hi = ((n - 1) * s.variance) / chiLow;
      est = s.variance;
    }
    rows.push({ hacker: s.j + 1, mean: s.mean, variance: s.variance, lo, hi, est, ok: lo <= truth && truth <= hi });
  }
  return { rows, truth, misses: rows.filter((r) => !r.ok).length, law, param, n, level };
}

/** The chart of a batch: the axis holds most intervals, the longest ones end with an arrow. */
export function intervalChart(batch, decimal = '.') {
  const { rows, truth, param } = batch;
  const sortedLo = rows.map((r) => r.lo).sort((a, b) => a - b);
  const sortedHi = rows.map((r) => r.hi).sort((a, b) => a - b);
  let x0 = Math.min(truth, sortedLo[Math.floor(0.05 * (rows.length - 1))]);
  let x1 = Math.max(truth, sortedHi[Math.ceil(0.9 * (rows.length - 1))]);
  if (param === 'mean') {
    x0 = Math.max(0, x0);
    x1 = Math.min(hw.SCORE_MAX, x1);
  } else {
    x0 = 0;
    x1 = Math.max(x1, 2 * truth);
  }
  const pad = (x1 - x0) * 0.04 || 1;
  x0 = param === 'mean' ? Math.max(0, x0 - pad) : x0;
  x1 += pad;
  return { rows, x0, x1, truth, xTicks: hw.niceTicks(x0, x1, 6), decimal };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

export const TEST_GROUPS = ['sim', 'averages', 'spread', 'inference'];

export const statTests = hw.statisticalTests;

/**
 * The verdict each test should give. Most null hypotheses are true by
 * construction and must not be rejected. Some are false on purpose (SS/n
 * is biased; for scores that are not normal the variance of s^2 is not
 * 2 sigma^4/(n - 1), and mean and variance are correlated when mu3 is not
 * 0); for the normality tests at n = 10 the answer depends on how far the
 * law of M_n still is from the normal. A test rejects when the difference
 * it looks for is several standard errors wide: about the expected z, or for
 * Jarque-Bera m (g1^2/6 + g2^2/24), the expected excess of the statistic.
 * In between the outcome depends on the sample: "either".
 */
export function expectedVerdicts(s) {
  const { law, m } = s;
  const small = hw.pointAt(s.points, hw.SMALL_N).theory;
  const last = s.points[s.points.length - 1].theory;
  const byZ = (z) => {
    const a = Math.abs(z);
    if (a > 4) return 'reject';
    return a < 1 ? 'notReject' : 'either';
  };
  const jb = (g1, g2) => {
    const excess = m * ((g1 * g1) / 6 + (g2 * g2) / 24);
    if (excess > 25) return 'reject';
    return excess < 1 ? 'notReject' : 'either';
  };
  // the standard error of the variance of m values of s^2, with the kurtosis of s^2 about 3 + 1.5 g1^2 (as for a gamma law)
  const spreadSe = (T) => T.varVariance * Math.sqrt((2 + 1.5 * T.skewVariance ** 2) / m);
  return {
    sim: { scores: 'notReject', lag: 'notReject' },
    averages: {
      meanSmall: 'notReject',
      meanLarge: 'notReject',
      varianceSmall: 'notReject',
      varianceLarge: 'notReject',
      biased: byZ((small.biased - law.variance) / (Math.sqrt(small.varBiased) / Math.sqrt(m))),
    },
    spread: {
      spreadMean: 'notReject',
      spreadVariance: 'notReject',
      normalTheory: byZ((small.varVariance - small.normalVariance) / spreadSe(small)),
      normalSmall: jb(small.skewMean, small.kurtMean),
      normalLarge: jb(last.skewMean, last.kurtMean),
      varianceNormal: jb(last.skewVariance, 1.5 * last.skewVariance ** 2),
    },
    inference: {
      coverage: 'notReject',
      correlation: 'notReject',
      independence: byZ(Math.atanh(last.corr) * Math.sqrt(m - 3)),
    },
  };
}

/**
 * Every test with its expected verdict, and the counts of the summary:
 * rejections, outcomes as expected, and Holm's correction on the tests whose
 * null hypothesis holds (the p-values in increasing order against alpha/K,
 * alpha/(K - 1), ...: rejections that survive it are unlikely to be chance).
 */
export function testSummary(s) {
  const expected = expectedVerdicts(s);
  const tests = hw.statisticalTests(s);
  const all = TEST_GROUPS.flatMap((group) => tests[group].map(([key, result]) => ({ group, key, result, expected: expected[group][key] })));
  const rejected = all.filter((t) => t.result.verdict === 'reject').length;
  const asExpected = all.filter((t) => t.expected === 'either' || t.expected === t.result.verdict).length;
  const nulls = all.filter((t) => t.expected === 'notReject');
  const sorted = nulls.map((t) => t.result.pValue).sort((a, b) => a - b);
  let holm = 0;
  while (holm < sorted.length && sorted[holm] <= hw.SIGNIFICANCE / (sorted.length - holm)) holm++;
  const falseRejections = nulls.filter((t) => t.result.verdict === 'reject');
  return { all, count: all.length, rejected, asExpected, nulls: nulls.length, falseRejections, holm, holmThreshold: hw.SIGNIFICANCE / Math.max(1, sorted.length) };
}

// ---------------------------------------------------------------------------
// Etichette dei grafici
// ---------------------------------------------------------------------------

const normalShare = (normal, from, to) => (normal ? hw.normalCdf((to - normal.mean) / normal.sd) - hw.normalCdf((from - normal.mean) / normal.sd) : null);

/** The texts under the pointer: functions of the hit, built from the data of a chart and the words of a language (T = text.tips). */
export const tips = {
  // the animation: the words for a bar of its histogram or a score of its trajectories
  trajectory: (text) => (hit) => text.tips.trajectory(hit, text.quantityNames[hit.quantity]),
  steps: (rows, T) => (hit) => T.step(rows[hit.index]),
  stability: (curve, T) => (hit) => T.stability(curve.rows[hit.index]),
  scores: (data, discrete, T) => (hit) => {
    const b = data.bars[hit.index];
    return b ? T.score(b, discrete) : null;
  },
  means: (s, T) => (hit) => {
    const pt = s.points[hit.index];
    return T.mean(pt, s.law, s.m);
  },
  variances: (s, T) => (hit) => {
    const pt = s.points[hit.index];
    return T.variance(pt, s.law, s.m);
  },
  spread: (s, T) => (hit) => T.spread(spreadRows(s)[hit.index]),
  histogram: (h, T) => (hit) => {
    const b = h.bars[hit.index];
    return b ? T.bin(b.from, b.to, b.share, normalShare(h.normal, b.from, b.to)) : null;
  },
  coverage: (s, T) => (hit) => T.coverage(inferenceRows(s)[hit.index]),
  scatter: (data, T) => (hit) => T.hacker(hit.index + 1, data.xs[hit.index], data.ys[hit.index]),
  bessel: (state, data, T) => (hit) => {
    const c = data.x[hit.index];
    const h = state.history.find((row) => row[0] === c);
    return h ? T.bessel(h[0], h[1], h[2]) : null;
  },
  intervals: (batch, T) => (hit) => T.interval(batch.rows[hit.index], batch.param),
};

// ---------------------------------------------------------------------------
// Tabelle legate ai grafici
// ---------------------------------------------------------------------------

/** The id of every table tied to a chart: the page and the program find it by id. */
export const LINKED_TABLES = Object.freeze({
  steps: 'hw4-steps-table',
  cancellation: 'hw4-cancellation-table',
  averages: 'hw4-averages-table',
  spread: 'hw4-spread-table',
  inference: 'hw4-inference-table',
});

const tableById = (id) => () => document.getElementById(id);

// one row per point of the chart, in the same order
const rowPerPoint = (id) => Object.freeze({ table: tableById(id), row: (hit) => hit.index, point: (row) => row });

// the cancellation table has five offsets, the stability curve every power from 10^0 to 10^14: a
// row stands at its power (the offset 0 at 10^0, exact for both), a point marks the nearest row
const CANCELLATION_POWERS = hw.CANCELLATION_OFFSETS.map((c) => (c > 0 ? Math.round(Math.log10(c)) : 0));

/**
 * The links of hw.attachChartTooltip, { table, row, point }: the point
 * under the pointer marks its row of the table, and a row under the
 * pointer outlines its point.
 */
export const links = {
  steps: rowPerPoint(LINKED_TABLES.steps),
  cancellation: Object.freeze({
    table: tableById(LINKED_TABLES.cancellation),
    row: (hit) => {
      const power = hw.STABILITY_POWERS[hit.index];
      let best = 0;
      CANCELLATION_POWERS.forEach((p, i) => {
        if (Math.abs(p - power) < Math.abs(CANCELLATION_POWERS[best] - power)) best = i;
      });
      return best;
    },
    point: (row) => hw.STABILITY_POWERS.indexOf(CANCELLATION_POWERS[row]),
  }),
  averages: rowPerPoint(LINKED_TABLES.averages),
  spread: rowPerPoint(LINKED_TABLES.spread),
  inference: rowPerPoint(LINKED_TABLES.inference),
};

// ---------------------------------------------------------------------------
// Disegno a fette
// ---------------------------------------------------------------------------

// Quando arrivano i risultati molti grafici vanno disegnati insieme: si
// disegnano qualcuno per fotogramma, entro pochi millisecondi, cosi' la
// pagina continua a rispondere.
const frameJobs = [];
let frameRequested = false;

function runFrameJobs() {
  const start = Date.now();
  while (frameJobs.length && Date.now() - start < 8) frameJobs.shift()();
  frameRequested = frameJobs.length > 0;
  if (frameRequested) requestAnimationFrame(runFrameJobs);
}

/** Draws a chart at the next free moment: a few per frame, within 8 milliseconds. */
export function scheduleFrameJob(job) {
  frameJobs.push(job);
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(runFrameJobs);
  }
}
