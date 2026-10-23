// src/pages/statistics/hw3/view.js
// Logica di presentazione dell'Homework #3, condivisa fra la pagina del sito
// (React) e il programma scaricabile (DOM puro): le sezioni, la lettura dei
// campi, le righe delle tabelle e i dati dei grafici. Tenerla qui impedisce
// che le due versioni dicano cose diverse sugli stessi numeri.
import * as hw from './homework3.js';

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
export const SECTIONS = [
  { id: 'hw3-assignment', key: 'assignment', level: 0 },
  { id: 'hw3-model', key: 'model', level: 0 },
  { id: 'hw3-models', key: 'models', level: 1 },
  { id: 'hw3-quantities', key: 'quantities', level: 1 },
  { id: 'hw3-input', key: 'input', level: 1 },
  { id: 'hw3-trajectories', key: 'trajectories', level: 1 },
  { id: 'hw3-verify', key: 'verify', level: 1 },
  { id: 'hw3-distributions', key: 'distributions', level: 0 },
  { id: 'hw3-sweep', key: 'sweep', level: 1 },
  { id: 'hw3-moments', key: 'moments', level: 1 },
  { id: 'hw3-lln', key: 'lln', level: 0 },
  { id: 'hw3-convergence', key: 'convergence', level: 1 },
  { id: 'hw3-bounds', key: 'bounds', level: 1 },
  { id: 'hw3-strong', key: 'strong', level: 1 },
  { id: 'hw3-variance', key: 'variance', level: 0 },
  { id: 'hw3-clt', key: 'clt', level: 0 },
  { id: 'hw3-normal', key: 'normal', level: 1 },
  { id: 'hw3-speed', key: 'speed', level: 1 },
  { id: 'hw3-bernoulli', key: 'bernoulli', level: 1 },
  { id: 'hw3-interpretation', key: 'interpretation', level: 0 },
  { id: 'hw3-size', key: 'size', level: 1 },
  { id: 'hw3-attackers', key: 'attackers', level: 1 },
  { id: 'hw3-aggregate', key: 'aggregate', level: 1 },
  { id: 'hw3-limits', key: 'limits', level: 1 },
  { id: 'hw3-tests', key: 'tests', level: 0 },
  { id: 'hw3-history', key: 'history', level: 0 },
  { id: 'hw3-conclusion', key: 'conclusion', level: 0 },
];

/** The entries of the index: the sections with their titles in the current language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

// ---------------------------------------------------------------------------
// I campi
// ---------------------------------------------------------------------------

/** How many characters each field accepts. */
export const FIELD_LENGTH = Object.freeze({ p: 8, n: 6, m: 6, seed: 10 });

export const DEFAULT_PARAMS = Object.freeze({ p: hw.DEFAULT_P, n: hw.DEFAULT_N, m: hw.DEFAULT_M, seed: hw.DEFAULT_SEED });

/** The text of the fields for some parameters. */
export const fieldsOf = (params) => ({ pText: String(params.p), nText: String(params.n), mText: String(params.m), seedText: String(params.seed) });

export const DEFAULT_INPUTS = Object.freeze(fieldsOf(DEFAULT_PARAMS));

/** The four fields, read and checked. */
export const readInputs = ({ pText, nText, mText, seedText }) => ({
  p: hw.parseProbability(pText),
  n: hw.parseInteger(nText, hw.LIMITS.n),
  m: hw.parseInteger(mText, hw.LIMITS.m),
  seed: hw.parseInteger(seedText, hw.LIMITS.seed),
});

export const sameParams = (a, b) => a.p === b.p && a.n === b.n && a.m === b.m && a.seed === b.seed;

/** The parameters to use: the value of every valid field, the last valid value of the others (the same object if nothing changes). */
export function applyInputs(read, previous) {
  const next = {};
  for (const key of ['p', 'n', 'm', 'seed']) next[key] = read[key].ok ? read[key].value : previous[key];
  return sameParams(next, previous) ? previous : next;
}

export const allValid = (read) => read.p.ok && read.n.ok && read.m.ok && read.seed.ok;

/** The key of a computation in the cache and in the worker: one per set of parameters. */
export const paramsKey = (params) => `${params.p}|${params.n}|${params.m}|${params.seed}`;
export function parseParamsKey(key) {
  const [p, n, m, seed] = key.split('|').map(Number);
  return { p, n, m, seed };
}

/** The line under the fields: the initial values, or different ones with the button that restores them. */
export function inputBadge(params, I) {
  return sameParams(params, DEFAULT_PARAMS) ? { known: true, text: I.defaultBadge, restore: false } : { known: false, text: I.customBadge, restore: true };
}

// ---------------------------------------------------------------------------
// L'animazione
// ---------------------------------------------------------------------------

/** The animation: attackers drawn, attackers in the histogram, the speeds (1 = a run in about 15 seconds). */
export const ANIMATION = Object.freeze({ shown: 50, sample: 500, speeds: Object.freeze([0.25, 1, 4]) });

/** The options of the animation for some parameters and a model: it draws and counts at most m attackers. */
export const animationOptions = (params, model) => ({
  model,
  p: params.p,
  n: params.n,
  m: params.m,
  seed: params.seed,
  shown: Math.min(ANIMATION.shown, params.m),
  sample: Math.min(ANIMATION.sample, params.m),
});

// ---------------------------------------------------------------------------
// Istogrammi
// ---------------------------------------------------------------------------

/**
 * How a checkpoint is displayed: the value of atom k and the distance
 * between atoms, for S_n, S_n/n, S_n/sqrt(n) or the standardized
 * (S_n - n mu)/(sigma sqrt(n)), with the mean and standard deviation of the
 * quantity.
 */
export function displayOf(point, mom, kind) {
  const n = point.n;
  if (kind === 'standardized') {
    const scale = mom.sigma * Math.sqrt(n);
    return { valueOf: (k) => (point.low + point.step * k - n * mom.mu) / scale, spacing: point.step / scale, mean: 0, sd: 1 };
  }
  const c = hw.quantityScale(kind, n);
  const q = hw.quantityMoments(mom, n, kind);
  return { valueOf: (k) => (point.low + point.step * k) * c, spacing: point.step * c, mean: q.mean, sd: q.sd };
}

/**
 * A histogram whose bins follow the lattice of the values: every bin holds
 * a whole number of atoms, so that no bin gets one atom more than its
 * neighbour (with bins of any width a lattice gives a comb of tall and short
 * bars). Heights are densities, share divided by width, so that they can be
 * compared with a density curve; `expected` is the same for the exact law.
 */
export function latticeHistogram({ counts, pmf = null, valueOf, spacing, range, target = 44 }) {
  const [x0, x1] = range;
  const per = Math.max(1, Math.round((x1 - x0) / target / spacing));
  let total = 0;
  for (const c of counts) total += c;
  const bars = [];
  const expected = [];
  let k0 = 0;
  while (k0 < counts.length) {
    let k1 = Math.min(counts.length, k0 + per);
    // the atoms left at the end, fewer than half a bar, join the last bar: a
    // bar of a single atom would be very narrow and, as a density, very tall
    if (counts.length - k1 > 0 && counts.length - k1 < per / 2) k1 = counts.length;
    const from = valueOf(k0) - spacing / 2;
    const to = valueOf(k1 - 1) + spacing / 2;
    if (to > x0 && from < x1) {
      let count = 0;
      let prob = 0;
      for (let k = k0; k < k1; k++) {
        count += counts[k];
        if (pmf) prob += pmf[k];
      }
      const width = to - from;
      bars.push({ from, to, value: count / total / width, share: count / total, prob });
      expected.push(prob / width);
    }
    k0 = k1;
  }
  return { x0, x1, bars, expected: pmf ? expected : null, width: per * spacing, total };
}

/**
 * The normal density N(mean, sd^2) averaged over windows as wide as the
 * bins: the height a bar centred at x would have under the normal law. With
 * narrow bins it is the density itself; with wide ones it stays comparable
 * with the bars instead of rising above them.
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

/**
 * The axis of the histograms of section 2. S_n/n and S_n/sqrt(n) keep the
 * same axis for every n, wide enough for all of them, so that the
 * concentration of the first and the stability (or the drift) of the second
 * can be seen; S_n, whose centre and width grow with n, gets the axis of its
 * own n, otherwise for small n it would be a single bar at the edge.
 */
export function sweepRange(M, quantity, g) {
  const { mom } = M;
  if (quantity === 'mean') return [mom.low - 0.04 * (1 - mom.low), 1 + 0.04 * (1 - mom.low)];
  let lo = Infinity;
  let hi = -Infinity;
  for (const pt of quantity === 'sum' ? [M.points[g]] : M.points) {
    const q = hw.quantityMoments(mom, pt.n, quantity);
    lo = Math.min(lo, q.mean - 4.2 * q.sd);
    hi = Math.max(hi, q.mean + 4.2 * q.sd);
  }
  // a Bernoulli score is never negative
  if (mom.low === 0) lo = Math.max(lo, -0.6);
  return [lo, hi];
}

/** The histogram of a quantity at checkpoint g, on the axis of section 2. */
export function sweepChart(M, g, quantity, decimal = '.') {
  const point = M.points[g];
  const d = displayOf(point, M.mom, quantity);
  const range = sweepRange(M, quantity, g);
  const h = latticeHistogram({ counts: point.counts, pmf: point.pmf, valueOf: d.valueOf, spacing: d.spacing, range });
  return { ...h, curve: normalCurve(d.mean, d.sd, h.width, range), normal: { mean: d.mean, sd: d.sd }, xTicks: hw.niceTicks(range[0], range[1], 5), decimal };
}

/** Mean and standard deviation of a quantity at checkpoint g, simulated and exact. */
export function quantityStats(M, g, quantity) {
  const pt = M.points[g];
  const c = hw.quantityScale(quantity, pt.n);
  const q = hw.quantityMoments(M.mom, pt.n, quantity);
  return { n: pt.n, mean: pt.sample.mean * c, sd: Math.sqrt(pt.sample.variance) * c, theoryMean: q.mean, theorySd: q.sd };
}

/** The index of the checkpoint n in the grid, or the last. */
export const pointIndex = (M, n) => {
  const g = M.points.findIndex((pt) => pt.n === n);
  return g < 0 ? M.points.length - 1 : g;
};

/** The rows of the table of section 2.2: the mean of S_n/n and the variance of S_n/sqrt(n) of both models. */
export function momentRows(s) {
  const B = s.models.bernoulli.points;
  const R = s.models.rademacher.points;
  return B.map((pt, g) => ({ n: pt.n, bMean: pt.sample.mean / pt.n, bVar: pt.sample.variance / pt.n, rMean: R[g].sample.mean / R[g].n, rVar: R[g].sample.variance / R[g].n }));
}

/** How far the sample moments of section 2.2 go from the exact ones: the largest |mean - mu| in standard errors, the largest relative error of the variance, and √(2/m). */
export function momentFacts(s) {
  let meanZ = 0;
  let varRel = 0;
  for (const model of hw.MODELS) {
    const M = s.models[model];
    for (const pt of M.points) {
      const se = M.mom.sigma / Math.sqrt(pt.n * pt.sample.m);
      meanZ = Math.max(meanZ, Math.abs(pt.sample.mean / pt.n - M.mom.mu) / se);
      varRel = Math.max(varRel, Math.abs(pt.sample.variance / (pt.n * M.mom.variance) - 1));
    }
  }
  return { meanZ, varRel, expectedRel: Math.sqrt(2 / s.params.m) };
}

// ---------------------------------------------------------------------------
// La legge dei grandi numeri
// ---------------------------------------------------------------------------

/** The ticks of a logarithmic n axis: the powers of 10 up to n. */
export const powerTicks = (nMax) => [1, 10, 100, 1000, 10000, 100000].filter((v) => v <= nMax);

/** P(|S_n/n - mu| > epsilon) at checkpoint g: simulated with its Wilson interval, exact, and the bounds. */
export function exceedance(M, g, epsilon) {
  const pt = M.points[g];
  let beyond = 0;
  for (let k = 0; k < pt.counts.length; k++) {
    if (pt.counts[k] && hw.beyondEpsilon(pt.low + pt.step * k, pt.n, M.mom.mu, epsilon)) beyond += pt.counts[k];
  }
  const rate = beyond / pt.sample.m;
  return {
    n: pt.n,
    beyond,
    rate,
    interval: hw.wilsonInterval(rate, pt.sample.m),
    exact: hw.exactExceedance({ n: pt.n, low: pt.low, step: pt.step, pmf: pt.pmf }, M.mom.mu, epsilon),
    chebyshev: hw.chebyshevBound(M.mom, pt.n, epsilon),
    hoeffding: hw.hoeffdingBound(M.mom, pt.n, epsilon),
    normal: hw.normalExceedance(M.mom, pt.n, epsilon),
  };
}

export const llnRows = (s, epsilon) => ({
  bernoulli: s.models.bernoulli.points.map((_, g) => exceedance(s.models.bernoulli, g, epsilon)),
  rademacher: s.models.rademacher.points.map((_, g) => exceedance(s.models.rademacher, g, epsilon)),
});

export function llnChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.n),
    logX: true,
    yMin: 0,
    yMax: 1,
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    xTicks: powerTicks(rows[rows.length - 1].n),
    decimal,
    series: [
      { values: rows.map((r) => r.rate), band: rows.map((r) => r.interval), colorIndex: 0 },
      { values: rows.map((r) => r.exact), colorIndex: 2, dots: false },
      { values: rows.map((r) => r.chebyshev), colorIndex: 3, dashed: true },
      { values: rows.map((r) => r.hoeffding), colorIndex: 4, dotted: true },
    ],
  };
}

/** What the text of section 3 says about the rows of one model: from which n the exact probability stays below 1%, whether it ever grows with n, the last row. */
export function llnFacts(rows) {
  let below = null;
  for (let i = rows.length - 1; i >= 0 && rows[i].exact < 0.01; i--) below = rows[i].n;
  let rises = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].exact > rows[i - 1].exact + 1e-9 && rows[i - 1].exact < 1) {
      rises = { from: rows[i - 1], to: rows[i] };
      break;
    }
  }
  return { below, rises, last: rows[rows.length - 1], chebyshevUseful: rows.find((r) => r.chebyshev < 1) || null };
}

// ---------------------------------------------------------------------------
// La varianza
// ---------------------------------------------------------------------------

const decade = (v, up) => 10 ** (up ? Math.ceil(Math.log10(v)) : Math.floor(Math.log10(v)));

/** The variances of S_n, S_n/n and S_n/sqrt(n) on logarithmic axes: simulated (dots) and exact (dashed). */
export function varianceChart(M, decimal = '.') {
  const x = M.points.map((pt) => pt.n);
  const series = [];
  let lo = Infinity;
  let hi = -Infinity;
  hw.QUANTITIES.forEach((q, i) => {
    const sample = M.points.map((pt) => pt.sample.variance * hw.quantityScale(q, pt.n) ** 2);
    const exact = M.points.map((pt) => hw.quantityMoments(M.mom, pt.n, q).variance);
    for (const v of [...sample, ...exact]) {
      if (v > 0) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    series.push({ values: sample, colorIndex: i, dotsOnly: true }, { values: exact, colorIndex: i, dashed: true });
  });
  const yMin = decade(lo, false);
  const yMax = decade(hi, true);
  const yTicks = [];
  for (let v = yMin; v <= yMax * 1.0001; v *= 100) yTicks.push(v);
  return { x, logX: true, logY: true, yMin, yMax, yTicks, xTicks: powerTicks(x[x.length - 1]), decimal, series };
}

/** The slopes of log Var against log n, for the three quantities of each model: the same fit, moved by -2 and -1. */
export function varianceFits(s) {
  const out = {};
  for (const model of hw.MODELS) {
    const M = s.models[model];
    const fit = hw.fitLine(M.points.map((pt) => Math.log10(pt.n)), M.points.map((pt) => Math.log10(pt.sample.variance)));
    out[model] = { sum: fit.slope, mean: fit.slope - 2, normalized: fit.slope - 1, error: fit.slopeError };
  }
  return out;
}

export const VARIANCE_SLOPES = Object.freeze({ sum: 1, mean: -1, normalized: 0 });

// ---------------------------------------------------------------------------
// Il teorema del limite centrale
// ---------------------------------------------------------------------------

/** The histogram of the standardized S_n at checkpoint g, against N(0, 1). */
export function cltHistogram(M, g, decimal = '.') {
  const pt = M.points[g];
  const d = displayOf(pt, M.mom, 'standardized');
  const range = [-4.2, 4.2];
  const h = latticeHistogram({ counts: pt.counts, pmf: pt.pmf, valueOf: d.valueOf, spacing: d.spacing, range, target: 40 });
  return { ...h, curve: normalCurve(0, 1, h.width, range), normal: { mean: 0, sd: 1 }, xTicks: [-4, -2, 0, 2, 4], decimal };
}

/** The normal quantile plot at checkpoint g: 199 quantiles of the standardized S_n against those of N(0, 1). */
export function qqData(M, g, decimal = '.') {
  const pt = M.points[g];
  const d = displayOf(pt, M.mom, 'standardized');
  const m = pt.sample.m;
  const Q = Math.min(199, m);
  const points = [];
  let k = 0;
  let cumulative = pt.counts[0];
  for (let i = 1; i <= Q; i++) {
    const prob = (i - 0.5) / Q;
    while (cumulative < prob * m && k < pt.counts.length - 1) {
      k++;
      cumulative += pt.counts[k];
    }
    points.push([hw.normalQuantile(prob), d.valueOf(k)]);
  }
  return { points, lo: -3.6, hi: 3.6, ticks: [-3, -2, -1, 0, 1, 2, 3], decimal };
}

/** Skewness and excess kurtosis of S_n: exact (cumulants: kappa3 / sigma^3 sqrt(n), kappa4 / sigma^4 n) and simulated. */
export function shapeAt(M, g) {
  const pt = M.points[g];
  return {
    n: pt.n,
    skewness: pt.sample.skewness,
    excess: pt.sample.kurtosis - 3,
    theorySkewness: M.mom.skewness / Math.sqrt(pt.n),
    theoryExcess: M.mom.kappa4 / (M.mom.variance ** 2 * pt.n),
    ks: pt.ks,
    ksCorrected: pt.ksCorrected,
    distance: pt.distance,
    distanceCorrected: pt.distanceCorrected,
  };
}

/** The exact Kolmogorov distance from the normal along n, the Berry-Esseen bound, the simulated distances and the noise of the simulation. */
export function distanceChart(M, m, decimal = '.') {
  const { ns, distance, corrected, bound } = M.curve;
  const at = new Map(M.points.map((pt) => [pt.n, pt]));
  const noise = hw.KS_MEAN / Math.sqrt(m);
  return {
    x: ns,
    logX: true,
    logY: true,
    yMin: 1e-6,
    yMax: 1,
    yTicks: [1e-6, 1e-4, 1e-2, 1],
    xTicks: powerTicks(ns[ns.length - 1]),
    decimal,
    series: [
      { values: distance, colorIndex: 1, dots: false },
      { values: corrected, colorIndex: 2, dots: false },
      { values: bound, colorIndex: 3, dashed: true },
      { values: ns.map((n) => (at.has(n) ? at.get(n).ks : null)), colorIndex: 0, dotsOnly: true },
      { values: ns.map(() => noise), colorIndex: 6, dotted: true },
    ],
  };
}

/** The distances at n along the exact curve. */
export function curveAt(M, n) {
  const i = M.curve.ns.indexOf(n);
  return i < 0 ? null : { distance: M.curve.distance[i], corrected: M.curve.corrected[i], bound: M.curve.bound[i] };
}

/** The table of section 5.3: the drift of S_n/sqrt(n) in the Bernoulli model and the skewness that fades. */
export const driftRows = (M) =>
  M.points.map((pt) => ({
    n: pt.n,
    mean: M.mom.mu * Math.sqrt(pt.n),
    sampleMean: pt.sample.mean / Math.sqrt(pt.n),
    skewness: M.mom.skewness / Math.sqrt(pt.n),
    sampleSkewness: pt.sample.skewness,
    distance: pt.distance,
  }));

/** The smallest n with n p (1 - p) >= 10, the usual rule for the normal approximation of the binomial. */
export const normalRule = (mom) => Math.ceil(10 / mom.variance - 1e-9);

/** How many observations a Kolmogorov-Smirnov test needs to see a distance d: about (1/d)^2. */
export const neededFor = (d) => Math.ceil(1 / (d * d));

// ---------------------------------------------------------------------------
// Sistemi e attaccanti
// ---------------------------------------------------------------------------

/** The share of the first `even` systems spent ahead, over the attackers, against Feller's law and the arcsine density. */
export function arcsineChart(W, decimal = '.') {
  const N = W.even / 2;
  const h = latticeHistogram({ counts: W.arcsine, pmf: W.arcsineLaw, valueOf: (k) => k / N, spacing: 1 / N, range: [0, 1], target: 40 });
  // the density is infinite at 0 and 1: averaged over windows as wide as the bars, inside [0, 1]
  const curve = [];
  const w = h.width;
  for (let i = 0; i <= 400; i++) {
    const x = w / 2 + (i * (1 - w)) / 400;
    curve.push([x, (hw.arcsineCdf(x + w / 2) - hw.arcsineCdf(x - w / 2)) / w]);
  }
  return { ...h, curve, xTicks: [0, 0.25, 0.5, 0.75, 1], decimal };
}

/** The best of b attackers, standardized: simulated with its 95% interval, exact, the normal maximum and sqrt(2 ln b). */
export function bestChart(G, decimal = '.') {
  const rows = G.rows;
  const values = rows.flatMap((r) => [r.mean - 1.96 * r.error, r.mean + 1.96 * r.error, r.exact, r.asymptote]);
  const lo = Math.min(-0.3, ...values);
  const hi = Math.max(...values) + 0.3;
  return {
    x: rows.map((r) => r.b),
    logX: true,
    yMin: Math.floor(lo * 2) / 2,
    yMax: Math.ceil(hi * 2) / 2,
    yTicks: hw.niceTicks(Math.floor(lo * 2) / 2, Math.ceil(hi * 2) / 2, 6),
    xTicks: powerTicks(rows[rows.length - 1].b),
    decimal,
    series: [
      { values: rows.map((r) => r.mean), band: rows.map((r) => [r.mean - 1.96 * r.error, r.mean + 1.96 * r.error]), colorIndex: 0 },
      { values: rows.map((r) => r.exact), colorIndex: 1, dots: false },
      { values: rows.map((r) => r.normal), colorIndex: 2, dashed: true },
      { values: rows.map((r) => r.asymptote), colorIndex: 3, dotted: true },
    ],
  };
}

/** At least one of b attackers beyond mean + 3 sd, and the systems hit by at least one of the first b: simulated and exact. */
export function probabilityChart(G, decimal = '.') {
  const rows = G.rows;
  return {
    x: rows.map((r) => r.b),
    logX: true,
    yMin: 0,
    yMax: 1,
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    xTicks: powerTicks(rows[rows.length - 1].b),
    decimal,
    series: [
      { values: rows.map((r) => r.beyond), colorIndex: 0, dotsOnly: true },
      { values: rows.map((r) => r.beyondExact), colorIndex: 0, dashed: true },
      { values: rows.map((r) => r.coverage), colorIndex: 2, dotsOnly: true },
      { values: rows.map((r) => r.coverageExact), colorIndex: 2, dashed: true },
    ],
  };
}

/** The row of a group size b, if the run has it. */
export const groupRow = (G, b) => G.rows.find((r) => r.b === b) || null;

/** How many attackers have hit each system (Bernoulli), against Bin(m, p). */
export function systemsChart(M, decimal = '.') {
  const A = M.aggregate;
  const m = M.params.m;
  const mean = m * M.mom.hit;
  const sd = Math.sqrt(m * M.mom.hit * (1 - M.mom.hit));
  const range = [Math.max(-0.5, mean - 4.5 * sd), Math.min(m + 0.5, mean + 4.5 * sd)];
  const h = latticeHistogram({ counts: A.perSystem, pmf: A.systemLaw, valueOf: (k) => k, spacing: 1, range, target: 40 });
  return { ...h, curve: normalCurve(mean, sd, h.width, range), normal: { mean, sd }, xTicks: hw.niceTicks(range[0], range[1], 5), decimal };
}

/** The aggregate score of all attackers on all systems, with its z-score. */
export function aggregateFacts(M) {
  const A = M.aggregate;
  return { total: A.total, expected: A.expected, sd: A.sd, z: (A.total - A.expected) / A.sd, perSystemMean: A.systemSample.mean, perSystemVariance: A.systemSample.variance, systemMean: M.params.m * M.mom.hit, systemVariance: M.params.m * M.mom.hit * (1 - M.mom.hit) };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

export const TEST_GROUPS = ['sim', 'lln', 'clt', 'walk'];

export const statTests = hw.statisticalTests;

/**
 * The verdict each test should give. Most null hypotheses are true by
 * construction, and must not be rejected; the tests at n = 10 and some
 * normality tests have a false null hypothesis, and reject when the test
 * sees the difference: for Kolmogorov-Smirnov when sqrt(m) times the exact
 * distance is well above the critical value, for Jarque-Bera when
 * m (g1^2/6 + g2^2/24), the expected excess of the statistic, is large. In
 * between the outcome depends on the sample: "either".
 */
export function expectedVerdicts(s) {
  const B = s.models.bernoulli;
  const R = s.models.rademacher;
  const m = s.params.m;
  const n = s.params.n;
  const last = (M) => M.points[M.points.length - 1];
  const small = (M) => M.points[pointIndex(M, hw.SMALL_N)];
  const ks = (d) => {
    const lambda = Math.sqrt(m) * d;
    if (lambda > 2.2) return 'reject';
    return lambda < 0.6 ? 'notReject' : 'either';
  };
  const jb = (mom, size) => {
    const g1 = mom.skewness / Math.sqrt(size);
    const g2 = mom.kappa4 / (mom.variance ** 2 * size);
    const excess = m * ((g1 * g1) / 6 + (g2 * g2) / 24);
    if (excess > 25) return 'reject';
    return excess < 1 ? 'notReject' : 'either';
  };
  return {
    sim: { bernoulliPairs: 'notReject', rademacherPairs: 'notReject', bernoulliSystems: 'notReject' },
    lln: { bernoulliMean: 'notReject', rademacherMean: 'notReject', bernoulliVariance: 'notReject', rademacherVariance: 'notReject' },
    clt: {
      bernoulliExact: 'notReject',
      rademacherExact: 'notReject',
      rademacherNormal: ks(last(R).distanceCorrected),
      rademacherSmall: ks(small(R).distance),
      rademacherJb: jb(R.mom, n),
      bernoulliJb: jb(B.mom, n),
      bernoulliSmall: jb(B.mom, hw.SMALL_N),
    },
    walk: { arcsine: 'notReject' },
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
  histogram: (h, T) => (hit) => {
    const b = h.bars[hit.index];
    return b ? T.bin(b.from, b.to, b.share, h.expected ? b.prob : null, normalShare(h.normal, b.from, b.to)) : null;
  },
  arcsine: (h, T) => (hit) => {
    const b = h.bars[hit.index];
    return b ? T.share(Math.max(0, b.from), Math.min(1, b.to), b.share, b.prob, hw.arcsineCdf(b.to) - hw.arcsineCdf(b.from)) : null;
  },
  lln: (rows, T) => (hit) => T.lln(rows[hit.index]),
  variance: (M, T) => (hit) => {
    const pt = M.points[hit.index];
    return T.variance(pt.n, hw.QUANTITIES.map((q) => [pt.sample.variance * hw.quantityScale(q, pt.n) ** 2, hw.quantityMoments(M.mom, pt.n, q).variance]));
  },
  distance: (M, T) => (hit) => {
    const n = M.curve.ns[hit.index];
    const pt = M.points.find((x) => x.n === n);
    return T.distance(n, M.curve.distance[hit.index], M.curve.corrected[hit.index], M.curve.bound[hit.index], pt ? pt.ks : null);
  },
  qq: (q, T) => (hit) => {
    const [a, b] = q.points[hit.index];
    return T.qq(a, b);
  },
  best: (G, T) => (hit) => T.best(G.rows[hit.index]),
  probability: (G, T) => (hit) => T.probability(G.rows[hit.index]),
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
