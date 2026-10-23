/*
 * Homework #3 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Interface and texts (Italian and English). Needs homework3.js, loaded first.
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-3
 */

(function () {
'use strict';

var view$ = (function () {
'use strict';

// src/pages/statistics/hw3/view.js
// Logica di presentazione dell'Homework #3, condivisa fra la pagina del sito
// (React) e il programma scaricabile (DOM puro): le sezioni, la lettura dei
// campi, le righe delle tabelle e i dati dei grafici. Tenerla qui impedisce
// che le due versioni dicano cose diverse sugli stessi numeri.
const hw = Homework3;

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
const SECTIONS = [
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
const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

// ---------------------------------------------------------------------------
// I campi
// ---------------------------------------------------------------------------

/** How many characters each field accepts. */
const FIELD_LENGTH = Object.freeze({ p: 8, n: 6, m: 6, seed: 10 });

const DEFAULT_PARAMS = Object.freeze({ p: hw.DEFAULT_P, n: hw.DEFAULT_N, m: hw.DEFAULT_M, seed: hw.DEFAULT_SEED });

/** The text of the fields for some parameters. */
const fieldsOf = (params) => ({ pText: String(params.p), nText: String(params.n), mText: String(params.m), seedText: String(params.seed) });

const DEFAULT_INPUTS = Object.freeze(fieldsOf(DEFAULT_PARAMS));

/** The four fields, read and checked. */
const readInputs = ({ pText, nText, mText, seedText }) => ({
  p: hw.parseProbability(pText),
  n: hw.parseInteger(nText, hw.LIMITS.n),
  m: hw.parseInteger(mText, hw.LIMITS.m),
  seed: hw.parseInteger(seedText, hw.LIMITS.seed),
});

const sameParams = (a, b) => a.p === b.p && a.n === b.n && a.m === b.m && a.seed === b.seed;

/** The parameters to use: the value of every valid field, the last valid value of the others (the same object if nothing changes). */
function applyInputs(read, previous) {
  const next = {};
  for (const key of ['p', 'n', 'm', 'seed']) next[key] = read[key].ok ? read[key].value : previous[key];
  return sameParams(next, previous) ? previous : next;
}

const allValid = (read) => read.p.ok && read.n.ok && read.m.ok && read.seed.ok;

/** The key of a computation in the cache and in the worker: one per set of parameters. */
const paramsKey = (params) => `${params.p}|${params.n}|${params.m}|${params.seed}`;
function parseParamsKey(key) {
  const [p, n, m, seed] = key.split('|').map(Number);
  return { p, n, m, seed };
}

/** The line under the fields: the initial values, or different ones with the button that restores them. */
function inputBadge(params, I) {
  return sameParams(params, DEFAULT_PARAMS) ? { known: true, text: I.defaultBadge, restore: false } : { known: false, text: I.customBadge, restore: true };
}

// ---------------------------------------------------------------------------
// L'animazione
// ---------------------------------------------------------------------------

/** The animation: attackers drawn, attackers in the histogram, the speeds (1 = a run in about 15 seconds). */
const ANIMATION = Object.freeze({ shown: 50, sample: 500, speeds: Object.freeze([0.25, 1, 4]) });

/** The options of the animation for some parameters and a model: it draws and counts at most m attackers. */
const animationOptions = (params, model) => ({
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
function displayOf(point, mom, kind) {
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
function latticeHistogram({ counts, pmf = null, valueOf, spacing, range, target = 44 }) {
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
function normalCurve(mean, sd, width, [x0, x1]) {
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
function sweepRange(M, quantity, g) {
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
function sweepChart(M, g, quantity, decimal = '.') {
  const point = M.points[g];
  const d = displayOf(point, M.mom, quantity);
  const range = sweepRange(M, quantity, g);
  const h = latticeHistogram({ counts: point.counts, pmf: point.pmf, valueOf: d.valueOf, spacing: d.spacing, range });
  return { ...h, curve: normalCurve(d.mean, d.sd, h.width, range), normal: { mean: d.mean, sd: d.sd }, xTicks: hw.niceTicks(range[0], range[1], 5), decimal };
}

/** Mean and standard deviation of a quantity at checkpoint g, simulated and exact. */
function quantityStats(M, g, quantity) {
  const pt = M.points[g];
  const c = hw.quantityScale(quantity, pt.n);
  const q = hw.quantityMoments(M.mom, pt.n, quantity);
  return { n: pt.n, mean: pt.sample.mean * c, sd: Math.sqrt(pt.sample.variance) * c, theoryMean: q.mean, theorySd: q.sd };
}

/** The index of the checkpoint n in the grid, or the last. */
const pointIndex = (M, n) => {
  const g = M.points.findIndex((pt) => pt.n === n);
  return g < 0 ? M.points.length - 1 : g;
};

/** The rows of the table of section 2.2: the mean of S_n/n and the variance of S_n/sqrt(n) of both models. */
function momentRows(s) {
  const B = s.models.bernoulli.points;
  const R = s.models.rademacher.points;
  return B.map((pt, g) => ({ n: pt.n, bMean: pt.sample.mean / pt.n, bVar: pt.sample.variance / pt.n, rMean: R[g].sample.mean / R[g].n, rVar: R[g].sample.variance / R[g].n }));
}

/** How far the sample moments of section 2.2 go from the exact ones: the largest |mean - mu| in standard errors, the largest relative error of the variance, and √(2/m). */
function momentFacts(s) {
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
const powerTicks = (nMax) => [1, 10, 100, 1000, 10000, 100000].filter((v) => v <= nMax);

/** P(|S_n/n - mu| > epsilon) at checkpoint g: simulated with its Wilson interval, exact, and the bounds. */
function exceedance(M, g, epsilon) {
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

const llnRows = (s, epsilon) => ({
  bernoulli: s.models.bernoulli.points.map((_, g) => exceedance(s.models.bernoulli, g, epsilon)),
  rademacher: s.models.rademacher.points.map((_, g) => exceedance(s.models.rademacher, g, epsilon)),
});

function llnChart(rows, decimal = '.') {
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
function llnFacts(rows) {
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
function varianceChart(M, decimal = '.') {
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
function varianceFits(s) {
  const out = {};
  for (const model of hw.MODELS) {
    const M = s.models[model];
    const fit = hw.fitLine(M.points.map((pt) => Math.log10(pt.n)), M.points.map((pt) => Math.log10(pt.sample.variance)));
    out[model] = { sum: fit.slope, mean: fit.slope - 2, normalized: fit.slope - 1, error: fit.slopeError };
  }
  return out;
}

const VARIANCE_SLOPES = Object.freeze({ sum: 1, mean: -1, normalized: 0 });

// ---------------------------------------------------------------------------
// Il teorema del limite centrale
// ---------------------------------------------------------------------------

/** The histogram of the standardized S_n at checkpoint g, against N(0, 1). */
function cltHistogram(M, g, decimal = '.') {
  const pt = M.points[g];
  const d = displayOf(pt, M.mom, 'standardized');
  const range = [-4.2, 4.2];
  const h = latticeHistogram({ counts: pt.counts, pmf: pt.pmf, valueOf: d.valueOf, spacing: d.spacing, range, target: 40 });
  return { ...h, curve: normalCurve(0, 1, h.width, range), normal: { mean: 0, sd: 1 }, xTicks: [-4, -2, 0, 2, 4], decimal };
}

/** The normal quantile plot at checkpoint g: 199 quantiles of the standardized S_n against those of N(0, 1). */
function qqData(M, g, decimal = '.') {
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
function shapeAt(M, g) {
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
function distanceChart(M, m, decimal = '.') {
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
function curveAt(M, n) {
  const i = M.curve.ns.indexOf(n);
  return i < 0 ? null : { distance: M.curve.distance[i], corrected: M.curve.corrected[i], bound: M.curve.bound[i] };
}

/** The table of section 5.3: the drift of S_n/sqrt(n) in the Bernoulli model and the skewness that fades. */
const driftRows = (M) =>
  M.points.map((pt) => ({
    n: pt.n,
    mean: M.mom.mu * Math.sqrt(pt.n),
    sampleMean: pt.sample.mean / Math.sqrt(pt.n),
    skewness: M.mom.skewness / Math.sqrt(pt.n),
    sampleSkewness: pt.sample.skewness,
    distance: pt.distance,
  }));

/** The smallest n with n p (1 - p) >= 10, the usual rule for the normal approximation of the binomial. */
const normalRule = (mom) => Math.ceil(10 / mom.variance - 1e-9);

/** How many observations a Kolmogorov-Smirnov test needs to see a distance d: about (1/d)^2. */
const neededFor = (d) => Math.ceil(1 / (d * d));

// ---------------------------------------------------------------------------
// Sistemi e attaccanti
// ---------------------------------------------------------------------------

/** The share of the first `even` systems spent ahead, over the attackers, against Feller's law and the arcsine density. */
function arcsineChart(W, decimal = '.') {
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
function bestChart(G, decimal = '.') {
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
function probabilityChart(G, decimal = '.') {
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
const groupRow = (G, b) => G.rows.find((r) => r.b === b) || null;

/** How many attackers have hit each system (Bernoulli), against Bin(m, p). */
function systemsChart(M, decimal = '.') {
  const A = M.aggregate;
  const m = M.params.m;
  const mean = m * M.mom.hit;
  const sd = Math.sqrt(m * M.mom.hit * (1 - M.mom.hit));
  const range = [Math.max(-0.5, mean - 4.5 * sd), Math.min(m + 0.5, mean + 4.5 * sd)];
  const h = latticeHistogram({ counts: A.perSystem, pmf: A.systemLaw, valueOf: (k) => k, spacing: 1, range, target: 40 });
  return { ...h, curve: normalCurve(mean, sd, h.width, range), normal: { mean, sd }, xTicks: hw.niceTicks(range[0], range[1], 5), decimal };
}

/** The aggregate score of all attackers on all systems, with its z-score. */
function aggregateFacts(M) {
  const A = M.aggregate;
  return { total: A.total, expected: A.expected, sd: A.sd, z: (A.total - A.expected) / A.sd, perSystemMean: A.systemSample.mean, perSystemVariance: A.systemSample.variance, systemMean: M.params.m * M.mom.hit, systemVariance: M.params.m * M.mom.hit * (1 - M.mom.hit) };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

const TEST_GROUPS = ['sim', 'lln', 'clt', 'walk'];

const statTests = hw.statisticalTests;

/**
 * The verdict each test should give. Most null hypotheses are true by
 * construction, and must not be rejected; the tests at n = 10 and some
 * normality tests have a false null hypothesis, and reject when the test
 * sees the difference: for Kolmogorov-Smirnov when sqrt(m) times the exact
 * distance is well above the critical value, for Jarque-Bera when
 * m (g1^2/6 + g2^2/24), the expected excess of the statistic, is large. In
 * between the outcome depends on the sample: "either".
 */
function expectedVerdicts(s) {
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
function testSummary(s) {
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
const tips = {
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
function scheduleFrameJob(job) {
  frameJobs.push(job);
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(runFrameJobs);
  }
}

return { SECTIONS, tocEntries, FIELD_LENGTH, DEFAULT_PARAMS, fieldsOf, DEFAULT_INPUTS, readInputs, sameParams, applyInputs, allValid, paramsKey, parseParamsKey, inputBadge, ANIMATION, animationOptions, displayOf, latticeHistogram, normalCurve, sweepRange, sweepChart, quantityStats, pointIndex, momentRows, momentFacts, powerTicks, exceedance, llnRows, llnChart, llnFacts, varianceChart, varianceFits, VARIANCE_SLOPES, cltHistogram, qqData, shapeAt, distanceChart, curveAt, driftRows, normalRule, neededFor, arcsineChart, bestChart, probabilityChart, groupRow, systemsChart, aggregateFacts, TEST_GROUPS, statTests, expectedVerdicts, testSummary, tips, scheduleFrameJob };
})();

var texts$ = (function () {
'use strict';

// src/pages/statistics/hw3/texts.js
// I testi dell'Homework #3 in italiano e in inglese. Li usano sia la pagina
// del sito sia il programma scaricabile, cosi' le due versioni dicono le
// stesse cose con le stesse parole. Ogni numero arriva dagli argomenti (i
// risultati della simulazione, la tolleranza scelta) o dalle costanti della
// libreria: nessuna frase contiene un risultato scritto a mano.
const { BERRY_ESSEEN_C, DEFAULT_M, DEFAULT_N, DEFAULT_P, DEFAULT_SEED, KS_MEAN, LIMITS, SIGNIFICANCE, SMALL_N, expectedMaxDiscrete } = Homework3;
const { aggregateFacts, curveAt, groupRow, llnFacts, llnRows, momentFacts, neededFor, normalRule, varianceFits } = view$;

/** Number formatting of one language: decimal and thousands separators, the "not available" marker, the multiplication sign. */
function formatters(decimal, thousands, na, times) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const sci = (v, digits = 1) => {
    if (missing(v)) return na;
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    let mant = v / 10 ** e;
    let exp = e;
    if (Number(Math.abs(mant).toFixed(digits)) >= 10) {
      mant /= 10;
      exp += 1;
    }
    return `${local(mant.toFixed(digits))} ${times} 10^${exp}`;
  };
  // fixed decimals, with the thousands grouped: 2828.4 -> 2.828,4 in Italian
  const num = (v, digits = 3) => {
    if (missing(v)) return na;
    const [whole, part] = Math.abs(v).toFixed(digits).split('.');
    const negative = v < 0 && Math.abs(v) >= 0.5 * 10 ** -digits;
    return `${negative ? '-' : ''}${group(whole)}${part ? `${decimal}${part}` : ''}`;
  };
  return {
    na,
    decimal,
    int: (v) => (missing(v) ? na : `${v < 0 ? '-' : ''}${group(String(Math.round(Math.abs(Number(v)))))}`),
    num,
    // a number with as many decimals as typed (a parameter): 0.2 -> 0,2
    plain: (v) => (missing(v) ? na : local(String(v))),
    pval: (v) => (missing(v) ? na : v === 0 ? `< ${local('1e-300')}` : v < 0.001 ? sci(v) : local(v.toFixed(3))),
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
    // a probability with four decimals, or "< 0.0001"
    prob: (v) => (missing(v) ? na : v < 1e-4 && v > 0 ? `< ${local('0.0001')}` : local(v.toFixed(4))),
    // a small positive number: four decimals, or powers of ten below 10^-4
    small: (v, digits = 4) => (missing(v) ? na : v === 0 ? '0' : Math.abs(v) < 10 ** -digits ? sci(v) : local(v.toFixed(digits))),
    sci,
    ms: (v) => (missing(v) ? na : v >= 1000 ? `${local((v / 1000).toFixed(2))} s` : `${Math.max(1, Math.round(v))} ms`),
  };
}

/**
 * The assignment as the professor wrote it, block by block. The only
 * change is the minus sign, written "-" as everywhere on this site.
 */
const originalAssignment = () => [
  { type: 'p', text: 'HMWK ==> Consider n systems and m attackers. Model the penetration process using a stochastic process with independent and identically distributed increments X₁, X₂, …, representing the penetration score at each step. Consider two possible models for the score:' },
  { type: 'p', text: 'Bernoulli model: Xᵢ ∈ {0,1}, with P(Xᵢ = 1) = p.' },
  { type: 'p', text: 'Rademacher model: Xᵢ ∈ {-1,+1}, with P(Xᵢ = +1) = P(Xᵢ = -1) = 1/2. This second model is introduced to study the symmetric, zero-mean case.' },
  { type: 'p', text: 'For increasing values of n and suitable choices of m, simulate multiple sample trajectories and study the distributions of the following three quantities:' },
  { type: 'p', text: 'Total score: Sₙ = ∑ᵢ₌₁ⁿ Xᵢ' },
  { type: 'p', text: 'Average score: Sₙ/n = (1/n)∑ᵢ₌₁ⁿ Xᵢ' },
  { type: 'p', text: 'Normalized total score: Sₙ/√n = (1/√n)∑ᵢ₌₁ⁿ Xᵢ' },
  {
    type: 'p',
    text: 'Compare the behavior of these quantities as n increases. In particular, investigate the convergence in probability of Sₙ/n according to the Law of Large Numbers, the behavior of the variance under the different normalizations, and the convergence in distribution of Sₙ/√n to a standard normal distribution in the Rademacher case, according to the Central Limit Theorem. Interpret the simulated trajectories in the context of the n systems and m attackers, discussing how the system size and number of attackers affect the aggregate penetration score.',
  },
];

// ---------------------------------------------------------------------------
// I numeri che i testi citano, calcolati una volta dai risultati
// ---------------------------------------------------------------------------

const lastOf = (M) => M.points[M.points.length - 1];
const lawOf = (pt) => ({ n: pt.n, low: pt.low, step: pt.step, pmf: pt.pmf });

/** Section 5.2: the exact distances at n = 100 and at the last n, and how close Berry-Esseen is. */
function speedFacts(s) {
  const B = s.models.bernoulli;
  const R = s.models.rademacher;
  const N = s.params.n;
  const n100 = N >= 100 ? 100 : N;
  const r100 = curveAt(R, n100);
  const rN = curveAt(R, N);
  const b100 = curveAt(B, n100);
  const bN = curveAt(B, N);
  const noise = KS_MEAN / Math.sqrt(s.params.m);
  return { N, n100, r100, rN, b100, bN, noise, ratio: rN.bound / rN.distance - 1, need: neededFor(rN.distance), symmetric: Math.abs(1 - 2 * s.params.p) < 1e-9 };
}

/** Section 6: the Bernoulli score at n, the walk, the best of b attackers and the coverage. */
function interpretationFacts(s) {
  const B = s.models.bernoulli;
  const R = s.models.rademacher;
  const N = s.params.n;
  const mom = B.mom;
  const law = lawOf(lastOf(B));
  const scale = mom.sigma * Math.sqrt(N);
  const best = (b) => (expectedMaxDiscrete(law, b) - N * mom.mu) / scale;
  const tail = B.groups.tail;
  const atLeast = (b) => 1 - (1 - tail) ** b;
  const sd100 = Math.sqrt(Math.min(100, N) * mom.variance);
  return {
    N,
    m: s.params.m,
    p: s.params.p,
    np: N * mom.mu,
    sd: scale,
    n100: Math.min(100, N),
    sd100,
    rel100: sd100 / (Math.min(100, N) * mom.mu),
    relN: scale / (N * mom.mu),
    walk: R.walk,
    typical: Math.sqrt((2 * N) / Math.PI),
    best10: best(10),
    best100: best(100),
    best1000: best(1000),
    tail,
    atLeast100: atLeast(100),
    atLeast1000: atLeast(1000),
    cover5: 1 - (1 - mom.hit) ** 5,
    cover20: 1 - (1 - mom.hit) ** 20,
    row5: groupRow(B.groups, 5),
    row20: groupRow(B.groups, 20),
    b95: Math.ceil(Math.log(0.05) / Math.log(1 - mom.hit) - 1e-9),
    aggregate: aggregateFacts(B),
    systems: B.tests.systems,
  };
}

/** The digits of a value of each quantity: S_n with one decimal, S_n/n with four, S_n/sqrt(n) with three. */
const DIGITS = { sum: 1, mean: 4, normalized: 3 };

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', '×');

/** The line of numbers under a hypothesis test, whatever its kind. */
function testLineIt(t) {
  const F = IT;
  switch (t.kind) {
    case 'chi2':
      return `χ² = ${F.num(t.chi2, 1)} su ${F.int(t.classes)} classi (${F.int(t.df)} gradi di libertà), p = ${F.pval(t.pValue)}`;
    case 'independence':
      return `χ² = ${F.num(t.chi2, 2)} su una tabella 2 × 2 di ${F.int(t.N)} coppie (1 grado di libertà), V di Cramér = ${F.num(t.cramerV, 5)}, p = ${F.pval(t.pValue)}`;
    case 'mean':
      return `media ${F.num(t.mean, 5)} contro ${F.num(t.expected, 5)}, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'variance':
      return `varianza ${F.num(t.variance, 1)} contro ${F.num(t.expected, 1)} (rapporto ${F.num(t.ratio, 4)}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'ks':
      return `D = ${F.num(t.D, 4)} su ${F.int(t.m)} attaccanti, √m D = ${F.num(t.lambda, 2)}, p = ${F.pval(t.pValue)}${t.corrected ? ' (con la correzione di continuità; contro una legge discreta il test è conservativo)' : ''}`;
    case 'jb':
      return `asimmetria ${F.num(t.skewness, 3)}, curtosi in eccesso ${F.num(t.excessKurtosis, 3)}, JB = ${F.num(t.statistic, 2)} (χ² con 2 gradi di libertà), p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

/** A value of a quantity, with the digits of that quantity. */
const valueIt = (v, quantity) => IT.num(v, DIGITS[quantity]);

/** A width in the units of an axis, with the decimals it needs. */
const edgeDigits = (from, to) => {
  const w = Math.abs(to - from);
  if (w >= 10) return 0;
  if (w >= 1) return 1;
  if (w >= 0.1) return 2;
  return w >= 0.01 ? 3 : 4;
};

const it = {
  fmt: IT,
  ui: {
    index: 'Indice',
    indexTitle: 'Indice dell’homework',
    close: 'Chiudi',
    backToTop: 'Torna su',
    computing: 'Simulazione in corso...',
    language: 'Lingua',
    error: (m) => `Errore: ${m}`,
  },
  sections: {
    assignment: '0. La consegna',
    model: '1. TASK: sistemi, attaccanti e il processo di penetrazione',
    models: '1.1 I due modelli del punteggio',
    quantities: '1.2 Le tre grandezze',
    input: '1.3 Sistemi, attaccanti e seme',
    trajectories: '1.4 Le traiettorie, sistema dopo sistema',
    verify: '1.5 Verifiche',
    distributions: '2. Le distribuzioni con sempre più sistemi',
    sweep: '2.1 Gli istogrammi, punto per punto',
    moments: '2.2 Medie e varianze',
    lln: '3. La legge dei grandi numeri',
    convergence: '3.1 La convergenza in probabilità del punteggio medio',
    bounds: '3.2 Chebyshev, Hoeffding e la normale',
    strong: '3.3 Legge debole e legge forte',
    variance: '4. La varianza sotto le tre normalizzazioni',
    clt: '5. Il teorema del limite centrale',
    normal: '5.1 Rademacher: la somma normalizzata verso la normale',
    speed: '5.2 Quanto è veloce la convergenza',
    bernoulli: '5.3 Bernoulli: cosa converge e cosa no',
    interpretation: '6. Sistemi e attaccanti: l’interpretazione',
    size: '6.1 Più sistemi',
    attackers: '6.2 Più attaccanti',
    aggregate: '6.3 Il punteggio aggregato',
    limits: '6.4 I limiti del modello',
    tests: '7. Riepilogo dei test statistici',
    history: '8. Contesto storico',
    conclusion: '9. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna chiede di modellare con un processo stocastico la penetrazione di m attaccanti su n sistemi: a ogni passo un attaccante ottiene un punteggio X_i, e i punteggi X_1, X_2, ... sono indipendenti e identicamente distribuiti. I modelli sono due: Bernoulli, in cui X_i vale 1 con probabilità p e 0 altrimenti, e Rademacher, in cui vale +1 o -1 con probabilità 1/2, il caso simmetrico a media nulla. Per n crescenti e m scelti in modo adatto si simulano molte traiettorie e si studiano le distribuzioni del punteggio totale S_n, del punteggio medio S_n/n e del punteggio totale normalizzato S_n/√n: la convergenza in probabilità di S_n/n (legge dei grandi numeri), la varianza sotto le tre normalizzazioni e la convergenza in distribuzione di S_n/√n alla normale standard nel caso di Rademacher (teorema del limite centrale). Infine si interpretano le traiettorie nel contesto dei sistemi e degli attaccanti, discutendo come la dimensione del sistema e il numero di attaccanti influenzano il punteggio aggregato.',
      'La sezione 1 precisa il modello, ne anima le traiettorie e verifica il simulatore; la 2 mostra le distribuzioni delle tre grandezze al crescere di n; la 3 è dedicata alla legge dei grandi numeri, la 4 alla varianza, la 5 al teorema del limite centrale e alla velocità della convergenza; la 6 interpreta i risultati per sistemi e attaccanti. La 7 riassume i test statistici, la 8 colloca le idee nel tempo e la 9 trae le conclusioni. Tutti i numeri sono calcolati nel browser, e il programma scaricabile stampa gli stessi.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese. L’unica modifica è il segno meno, scritto "-" come in tutto il sito.',
  },
  model: {
    intro: [
      'Ogni attaccante affronta i sistemi uno dopo l’altro: sul sistema i ottiene il punteggio X_i, e dopo k sistemi il suo punteggio è S_k = X_1 + ... + X_k. La traiettoria k ↦ S_k è un cammino aleatorio, e gli m attaccanti sono m copie indipendenti dello stesso cammino. In questa lettura n è la lunghezza delle traiettorie, cioè quanti sistemi affronta ogni attaccante, e m è la dimensione del campione, cioè quante traiettorie si osservano per stimare le distribuzioni.',
      'L’ipotesi i.i.d. dice due cose: i sistemi sono ugualmente difficili, perché ogni X_i ha la stessa legge, e l’esito su un sistema non dice nulla sugli altri, perché gli X_i sono indipendenti. In altre parole l’attaccante non impara e i sistemi non condividono vulnerabilità: la sezione 6.4 discute quanto sia realistico e cosa cambia senza.',
    ],
    formulasTitle: 'Il modello in formule',
    formulas: [
      'Incrementi    X_1, X_2, ... i.i.d.,  E[X] = μ,  Var(X) = σ²',
      'Bernoulli     X ∈ {0, 1},    P(X = 1) = p          μ = p,  σ² = p(1 - p)',
      'Rademacher    X ∈ {-1, +1},  P(X = +1) = 1/2       μ = 0,  σ² = 1',
      'Traiettoria   S_0 = 0,  S_k = S_(k-1) + X_k,  k = 1, ..., n',
      'Grandezze     S_n,  S_n/n,  S_n/√n',
    ].join('\n'),
  },
  models: {
    intro: [
      'Nel modello di Bernoulli X_i vale 1 se l’attaccante penetra il sistema i e 0 se fallisce: S_n conta i sistemi penetrati e segue la legge binomiale Bin(n, p), e S_n/n è la frazione di sistemi penetrati. Nel modello di Rademacher X_i vale +1 o -1: l’attaccante guadagna o perde terreno con la stessa probabilità, come in una partita alla pari con chi difende (un accesso ottenuto o revocato, un privilegio guadagnato o perso). Se K è il numero di passi in avanti, S_n = K - (n - K) = 2K - n con K ~ Bin(n, 1/2): è il cammino aleatorio semplice simmetrico.',
      'I due modelli sono parenti stretti: se B vale 1 con probabilità 1/2, allora 2B - 1 è Rademacher. Più in generale la standardizzazione (X - μ)/σ porta qualunque incremento a media 0 e varianza 1. Il modello di Rademacher è il caso in cui l’incremento è già standardizzato, ed è per questo che la consegna lo usa per il teorema del limite centrale.',
    ],
    tableTitle: (p) => `I momenti di un incremento, con p = ${IT.plain(p)}`,
    cols: { model: 'Modello', values: 'Valori', mu: 'Media μ', variance: 'Varianza σ²', rho: 'E|X - μ|³', skewness: 'Asimmetria' },
    after: [
      'La media e la varianza bastano alla legge dei grandi numeri e al teorema del limite centrale; il momento E|X - μ|³ entra nel limite di Berry-Esseen sulla velocità della convergenza (sezione 5.2); l’asimmetria, (1 - 2p)/√(p(1 - p)) per Bernoulli, spiega perché con p lontano da 1/2 la convergenza alla normale è più lenta.',
    ],
  },
  quantities: {
    intro: [
      'Per somme di variabili indipendenti le medie e le varianze si sommano: E[S_n] = nμ e Var(S_n) = nσ². Dividere per una costante c divide la media e la deviazione standard per c, e la varianza per c². La tabella dà i valori esatti delle tre grandezze: la variabile è sempre la stessa, cambia l’unità di misura con cui la si guarda.',
    ],
    tableTitle: 'Media, varianza e deviazione standard esatte',
    cols: { quantity: 'Grandezza', mean: 'Media', variance: 'Varianza', sd: 'Deviazione standard', trend: 'Al crescere di n' },
    rows: [
      ['S_n', 'nμ', 'nσ²', 'σ√n', 'cresce: per Bernoulli la media come n e la deviazione standard come √n, per Rademacher solo la deviazione standard'],
      ['S_n/n', 'μ', 'σ²/n', 'σ/√n', 'si concentra su μ: la varianza tende a 0'],
      ['S_n/√n', 'μ√n', 'σ²', 'σ', 'la varianza resta σ²: per Rademacher la legge si stabilizza, per Bernoulli la media μ√n cresce senza limite'],
    ],
    after: [
      'La seconda riga è la legge dei grandi numeri, la terza il teorema del limite centrale. Dividere per n schiaccia la variabilità, non dividere la lascia crescere, e √n è l’unica scala intermedia che la mantiene finita e diversa da zero: è il motivo per cui la consegna chiede proprio queste tre normalizzazioni.',
    ],
  },
  input: {
    intro: `I valori iniziali sono p = ${IT.plain(DEFAULT_P)} (in media un attaccante penetra un sistema su ${Math.round(1 / DEFAULT_P)}), n = ${IT.int(DEFAULT_N)} sistemi, m = ${IT.int(DEFAULT_M)} attaccanti e il seme ${DEFAULT_SEED}. Ogni attaccante ha un generatore suo, xoshiro128**, con lo stato ricavato da SplitMix64 a partire dal seme, dal modello e dal numero dell’attaccante: con lo stesso seme la pagina, l’animazione e node homework3.js vedono gli stessi attaccanti e stampano gli stessi numeri. Più sistemi allungano le traiettorie già simulate, più attaccanti si aggiungono ai primi senza cambiarli. Ogni modifica ripete la simulazione, che con i valori iniziali conta ${IT.int(2 * DEFAULT_N * DEFAULT_M)} incrementi; il tempo impiegato compare sotto i campi.`,
    pLabel: `Probabilità di penetrazione p, modello di Bernoulli (da ${IT.plain(LIMITS.p[0])} a ${IT.plain(LIMITS.p[1])})`,
    pHint: 'Con la virgola o con il punto: 0,2 e 0.2 sono lo stesso valore. Il modello di Rademacher non dipende da p.',
    nLabel: `Sistemi n (da ${IT.int(LIMITS.n[0])} a ${IT.int(LIMITS.n[1])})`,
    nHint: 'La lunghezza delle traiettorie. Le grandezze si osservano a n = 1, 2, 5, 10, 20, 50, ... e all’ultimo sistema.',
    mLabel: `Attaccanti m (da ${IT.int(LIMITS.m[0])} a ${IT.int(LIMITS.m[1])})`,
    mHint: 'Le traiettorie simulate per ogni modello. Una probabilità si stima con un errore di circa 1/√m, e una distanza fra leggi sotto 0,87/√m non si distingue dal rumore.',
    seedLabel: `Seme (da 0 a ${IT.int(LIMITS.seed[1])})`,
    seedHint: 'Lo stesso seme dà gli stessi attaccanti, qui e nel terminale (node homework3.js --seed ...).',
    randomSeed: 'Seme casuale',
    errors: {
      empty: () => 'Scrivi un valore.',
      notInteger: (t) => `"${t}" non è un intero scritto in cifre decimali.`,
      notNumber: (t) => `"${t}" non è un numero.`,
      range: (lo, hi) => `Il valore va da ${lo} a ${hi}.`,
    },
    limits: {
      p: [IT.plain(LIMITS.p[0]), IT.plain(LIMITS.p[1])],
      n: [IT.int(LIMITS.n[0]), IT.int(LIMITS.n[1])],
      m: [IT.int(LIMITS.m[0]), IT.int(LIMITS.m[1])],
      seed: [IT.int(LIMITS.seed[0]), IT.int(LIMITS.seed[1])],
    },
    defaultBadge: `Valori iniziali: p = ${IT.plain(DEFAULT_P)}, n = ${IT.int(DEFAULT_N)} sistemi, m = ${IT.int(DEFAULT_M)} attaccanti, seme ${DEFAULT_SEED}.`,
    customBadge: 'Valori diversi da quelli iniziali.',
    restore: 'Ripristina i valori iniziali',
    stale: 'Finché un campo contiene un errore, la pagina usa il suo ultimo valore valido.',
    pending: 'Simulazione in corso con i nuovi valori: le sezioni seguenti si aggiornano appena finisce.',
    run: (s) => `Simulati ${IT.int(2 * s.params.m * s.params.n)} incrementi (${IT.int(s.params.m)} attaccanti, ${IT.int(s.params.n)} sistemi, 2 modelli) e calcolate le leggi esatte in ${IT.ms(s.ms)}.`,
  },
  trajectories: {
    intro: (shown, sample) => [
      `L’animazione mostra il processo mentre accade. A sinistra le traiettorie dei primi ${IT.int(shown)} attaccanti, sistema dopo sistema, con il primo in rosso; a destra l’istogramma dei valori di ${IT.int(sample)} attaccanti al sistema corrente, con la curva della legge normale che ha la stessa media e la stessa deviazione standard. La fascia verde è media ± 2 deviazioni standard, la linea tratteggiata verde la media e quella punteggiata gialla l’inviluppo della legge del logaritmo iterato, kμ ± σ√(2k ln ln k), nelle unità della grandezza scelta.`,
      'Si possono scegliere il modello e la grandezza. Con S_k la fascia si allarga come √k; con S_k/k si stringe attorno a μ, ed è la legge dei grandi numeri; con S_k/√k ha larghezza costante, ed è la scala del teorema del limite centrale. L’animazione si apre sull’ultimo sistema: Avvia la fa ripartire dal primo, Un sistema avanza di un passo.',
    ],
    modelLabel: 'Modello',
    quantityLabel: 'Grandezza',
    speedLabel: 'Velocità',
    speeds: ['lenta', 'normale', 'veloce'],
    play: 'Avvia',
    pause: 'Pausa',
    resume: 'Riprendi',
    step: 'Un sistema',
    reset: 'Dall’inizio',
    end: 'Alla fine',
    legend: ['traiettorie e istogramma dei valori', 'attaccante 1', 'media (tratteggio), media ± 2σ (fascia), legge normale (curva)', 'inviluppo del logaritmo iterato'],
    caption: (st, quantityName) =>
      st.k === 0
        ? `Sistema 0 di ${IT.int(st.n)}: nessun sistema ancora attaccato.`
        : `Sistema ${IT.int(st.k)} di ${IT.int(st.n)}. ${quantityName}: media sui ${IT.int(st.sample)} attaccanti ${valueIt(st.mean, st.quantity)} (esatta ${valueIt(st.theoryMean, st.quantity)}), deviazione standard ${valueIt(st.sd, st.quantity)} (esatta ${valueIt(st.theorySd, st.quantity)}); fuori dalla fascia il ${IT.pct(st.outside)}, contro circa il 4,6% di una normale. Attaccante 1: ${valueIt(st.first, st.quantity)}.`,
    after: [
      'Guardata con S_k, la nuvola delle traiettorie è un ventaglio che si apre come √k: per Rademacher attorno allo zero, per Bernoulli attorno alla retta kp, che alla scala di n fa sembrare il ventaglio una sola linea. Con S_k/k lo stesso ventaglio, diviso per k, si chiude su μ: ogni attaccante finisce per penetrare una frazione dei sistemi vicina a p. Con S_k/√k le traiettorie restano in una fascia di larghezza costante e l’istogramma a destra smette di cambiare forma: è la campana del teorema del limite centrale.',
      'Le singole traiettorie però non si calmano mai. Escono e rientrano dalla fascia, e continuano a farlo: la legge del logaritmo iterato (Khinchin, 1924) dice che i loro massimi crescono un po’ più di √k, come √(2k ln ln k), e che quasi ogni traiettoria si avvicina al suo inviluppo infinite volte. La fascia descrive gli attaccanti a un sistema fissato, l’inviluppo il percorso di ciascuno.',
    ],
  },
  verify: {
    intro: 'Prima di fidarsi della simulazione, le sue parti vengono confrontate con valori calcolati altrove. Le uscite di xoshiro128** e SplitMix64 e i punteggi di due attaccanti dopo 10.000 sistemi vengono dal codice C di riferimento dei due generatori, compilato con gcc; le leggi e le funzioni speciali (normale, binomiale, χ², Kolmogorov, arcoseno, massimo di normali, Jarque-Bera) da SciPy 1.17.1.',
    summary: (ok, total) => `${ok} verifiche su ${total} superate.`,
    details: (n) => `Mostra le ${n} verifiche`,
    groups: { generator: 'Generatore (codice C di riferimento)', functions: 'Leggi e funzioni speciali (SciPy 1.17.1)' },
    cols: { check: 'Verifica', expected: 'Atteso', result: 'Esito' },
    ok: 'superata',
    failed: 'fallita',
  },
  distributions: {
    intro: [
      'A n fissato le tre grandezze hanno la stessa forma: un istogramma di S_n/n è un istogramma di S_n con un altro asse. Le distingue il modo in cui cambiano al crescere di n. Per vederlo l’asse di S_n/n e quello di S_n/√n restano gli stessi per ogni n; quello di S_n segue la distribuzione, che altrimenti per n piccoli sarebbe una sola barra al margine.',
    ],
  },
  sweep: {
    intro: [
      'Il cursore sceglie n fra i punti in cui le traiettorie vengono osservate; Avvia li scorre in ordine. Le barre sono le frazioni degli m attaccanti divise per la larghezza della barra, cioè densità; il tratteggio rosso è la legge esatta di S_n sulle stesse barre e la curva verde la normale con la stessa media e la stessa varianza. Ogni barra contiene un numero intero di valori possibili di S_n: per n piccoli i valori sono pochi e si vedono uno per uno.',
    ],
    quantityLabel: 'Grandezza',
    nLabel: (n) => `n = ${IT.int(n)}`,
    play: 'Avvia',
    pause: 'Pausa',
    chart: (model, quantity, n, m) => `${model}: istogramma di ${quantity} con n = ${IT.int(n)}, sui ${IT.int(m)} attaccanti`,
    legend: ['simulazione', 'legge esatta di S_n', 'normale con la stessa media e la stessa varianza'],
    stats: (model, st, quantity) => `${model}, n = ${IT.int(st.n)}: media ${valueIt(st.mean, quantity)} (esatta ${valueIt(st.theoryMean, quantity)}), deviazione standard ${valueIt(st.sd, quantity)} (esatta ${valueIt(st.theorySd, quantity)}).`,
    after: [
      'Con S_n le campane si spostano e si allargano: per Bernoulli la media np cresce come n e la deviazione standard solo come √n, per Rademacher la media resta 0 e la larghezza cresce come √n. Con S_n/n le stesse campane si stringono fino a una sola barra sopra μ: è la convergenza in probabilità della sezione 3. Con S_n/√n la larghezza resta la stessa: per Rademacher la campana smette di muoversi e coincide con N(0, 1), per Bernoulli trasla verso destra, perché la media p√n cresce senza limite.',
      'Per n piccoli nessuna delle tre somiglia a una normale: con n = 1 la legge ha due soli valori, e per Bernoulli con p lontano da 1/2 è anche asimmetrica. La legge esatta e la simulazione invece coincidono sempre, entro le fluttuazioni di un campione di m attaccanti: è la prima verifica che il simulatore realizza il modello.',
    ],
  },
  moments: {
    intro: 'Le medie e le varianze campionarie sugli m attaccanti, accanto ai valori esatti. Bastano la media di S_n/n e la varianza di S_n/√n: le altre si ottengono moltiplicando o dividendo per n.',
    tableTitle: 'Media campionaria di S_n/n e varianza campionaria di S_n/√n, valori esatti fra parentesi',
    cols: { n: 'n', bMean: 'Bernoulli: media di S_n/n', bVar: 'Bernoulli: varianza di S_n/√n', rMean: 'Rademacher: media di S_n/n', rVar: 'Rademacher: varianza di S_n/√n' },
    after: (s) => {
      const f = momentFacts(s);
      return [
        `Le medie campionarie di S_n/n distano da μ al più ${IT.num(f.meanZ, 1)} errori standard, dove l’errore standard è σ/√(nm); le varianze campionarie di S_n/√n distano da σ² al più il ${IT.pct(f.varRel)}, contro un errore relativo tipico di √(2/m) = ${IT.pct(f.expectedRel)}. Sono le differenze che ci si aspetta da ${IT.int(s.params.m)} attaccanti, e i test della sezione 3 lo verificano a n = ${IT.int(s.params.n)}.`,
        'Le colonne mostrano già i due teoremi: la media di S_n/n resta su μ per ogni n mentre la sua varianza, σ²/n, scende verso zero; la varianza di S_n/√n resta σ² per ogni n.',
      ];
    },
  },
  lln: {
    intro: [
      'La legge (debole) dei grandi numeri dice che per ogni ε > 0 la probabilità P(|S_n/n - μ| > ε) tende a 0 quando n cresce: il punteggio medio converge in probabilità a μ. Qui quella probabilità si stima con la frazione di attaccanti che dopo n sistemi distano da μ più di ε, la si confronta con il valore esatto, calcolato dalla legge binomiale, e con due disuguaglianze che la limitano dall’alto senza conoscere la legge.',
    ],
  },
  convergence: {
    intro: 'Il cursore cambia ε, e grafici e tabella lo seguono. Le bande attorno ai punti sono intervalli di Wilson al 95%, che restano dentro [0, 1] anche quando la frazione osservata è 0.',
    epsilonLabel: (eps) => `Tolleranza ε = ${IT.num(eps, 2)}`,
    chart: (model, eps) => `${model}: P(|S_n/n - μ| > ${IT.num(eps, 2)}) al crescere di n (asse di n logaritmico)`,
    legend: ['simulazione, con intervallo di Wilson al 95%', 'valore esatto', 'limite di Chebyshev', 'limite di Hoeffding'],
    tableTitle: (eps) => `P(|S_n/n - μ| > ${IT.num(eps, 2)}): frazione di attaccanti (intervallo al 95%) e valore esatto`,
    cols: { n: 'n', simulated: 'simulata (95%)', exact: 'esatta' },
    after: (s, eps) => {
      const rows = llnRows(s, eps);
      const fB = llnFacts(rows.bernoulli);
      const fR = llnFacts(rows.rademacher);
      const N = IT.int(s.params.n);
      const from = (f, model) => `da n = ${IT.int(f.below)} per ${model}`;
      let below;
      if (fB.below !== null && fR.below !== null) below = `scende sotto l’1% ${from(fB, 'Bernoulli')} e ${from(fR, 'Rademacher')}`;
      else if (fB.below !== null) below = `scende sotto l’1% ${from(fB, 'Bernoulli')}, mentre per Rademacher non ci scende entro n = ${N}`;
      else if (fR.below !== null) below = `scende sotto l’1% ${from(fR, 'Rademacher')}, mentre per Bernoulli non ci scende entro n = ${N}`;
      else below = `non scende sotto l’1% entro n = ${N} in nessuno dei due modelli`;
      const rise = fB.rises ? ['Bernoulli', fB.rises] : fR.rises ? ['Rademacher', fR.rises] : null;
      const sB = s.models.bernoulli.mom.sigma;
      const out = [
        `Con ε = ${IT.num(eps, 2)} la probabilità esatta ${below}. Conta il rapporto fra ε e la deviazione standard di un incremento: la probabilità dipende da n attraverso ε√n/σ, e σ vale ${IT.num(sB, 3)} per Bernoulli e 1 per Rademacher.`,
      ];
      if (rise) {
        out.push(`Per n piccoli la discesa non è regolare: per ${rise[0]} la probabilità passa da ${IT.num(rise[1].from.exact, 4)} a n = ${IT.int(rise[1].from.n)} a ${IT.num(rise[1].to.exact, 4)} a n = ${IT.int(rise[1].to.n)}. S_n/n assume solo valori distanti ${rise[0] === 'Bernoulli' ? '1/n' : '2/n'} l’uno dall’altro, e finché questo passo è più largo di ε conta quanti valori cadono vicino a μ, non quanto è grande n.`);
      }
      out.push(`La simulazione segue il valore esatto finché la probabilità è più grande di 1/m = ${IT.small(1 / s.params.m)}; sotto, quasi sempre nessun attaccante supera ε, la frazione osservata è 0 e resta solo il limite superiore dell’intervallo di Wilson, ${IT.num(fB.last.interval[1], 4)}. È il primo senso in cui m va scelto in modo adatto: per stimare una probabilità P servono molti più di 1/P attaccanti, e per n grandi restano il calcolo esatto e i limiti della sezione 3.2.`);
      return out;
    },
  },
  bounds: {
    paras: (s, eps) => {
      const rows = llnRows(s, eps);
      const lb = rows.bernoulli[rows.bernoulli.length - 1];
      const lr = rows.rademacher[rows.rademacher.length - 1];
      const n0 = (M) => IT.int(Math.ceil(M.mom.variance / (eps * eps) - 1e-9));
      return [
        `Disuguaglianza di Chebyshev: P(|S_n/n - μ| > ε) ≤ σ²/(nε²). È la legge debole dimostrata in una riga, perché Var(S_n/n) = σ²/n; vale per qualunque legge con varianza finita, ma decresce solo come 1/n, e finché n < σ²/ε² supera 1 e non dice nulla: con ε = ${IT.num(eps, 2)} fino a n = ${n0(s.models.bernoulli)} per Bernoulli e ${n0(s.models.rademacher)} per Rademacher.`,
        `Disuguaglianza di Hoeffding (1963): se gli incrementi stanno in un intervallo di ampiezza b - a, P(|S_n/n - μ| > ε) ≤ 2 exp(-2nε²/(b - a)²), con b - a = 1 per Bernoulli e 2 per Rademacher. Decresce in modo esponenziale, come la probabilità vera: a n = ${IT.int(lb.n)} Chebyshev dà ${IT.small(lb.chebyshev)} e Hoeffding ${IT.small(lb.hoeffding)} per Bernoulli, contro un valore esatto di ${IT.small(lb.exact)}; per Rademacher ${IT.small(lr.chebyshev)}, ${IT.small(lr.hoeffding)} e ${IT.small(lr.exact)}.`,
        'La normale approssima la stessa probabilità con 2(1 - Φ(ε√n/σ)): è il teorema del limite centrale usato per la legge dei grandi numeri. Al centro della distribuzione è precisa, ma nelle code il suo errore relativo cresce, e lì servono le stime di grandi deviazioni (Cramér, Chernoff), che danno il tasso esponenziale esatto. I due limiti valgono sempre e la normale no: è il prezzo della generalità.',
      ];
    },
  },
  strong: {
    paras: [
      'La legge forte dei grandi numeri, di Borel (1909) per le prove di Bernoulli e di Kolmogorov (1933) in generale, dice di più: con probabilità 1 la traiettoria S_k/k di ogni attaccante converge a μ. La legge debole è un’affermazione sulla distribuzione di S_n/n a n fissato, quella degli istogrammi della sezione 2; la forte è un’affermazione su ogni traiettoria, quella dell’animazione della sezione 1.4 con S_k/k: ogni attaccante, prima o poi, entra nella fascia μ ± ε e non ne esce più.',
      'La differenza non è solo formale. La convergenza in probabilità permetterebbe a ogni traiettoria di uscire dalla fascia infinite volte, purché sempre più di rado; quella quasi certa lo esclude. Per un difensore la prima dice che a un istante fissato quasi tutti gli attaccanti hanno una frazione di successi vicina a p, la seconda che ognuno di loro, da un certo sistema in poi, resterà vicino a p per sempre.',
    ],
  },
  variance: {
    intro: 'La varianza delle tre grandezze, campionaria (punti) ed esatta (tratteggio), su scale logaritmiche in entrambi gli assi: una legge di potenza n^a diventa una retta di pendenza a.',
    chart: (model) => `${model}: varianza di S_n, S_n/n e S_n/√n al crescere di n (scale logaritmiche)`,
    legend: ['S_n', 'S_n/n', 'S_n/√n', 'valori esatti (tratteggio)'],
    fitTitle: 'Pendenza di log Var contro log n, stimata con i minimi quadrati',
    fitCols: { quantity: 'Grandezza', bernoulli: 'Bernoulli', rademacher: 'Rademacher', theory: 'Teoria' },
    after: (s) => {
      const fits = varianceFits(s);
      const slopes = (f) => `${IT.num(f.sum, 3)}, ${IT.num(f.mean, 3)} e ${IT.num(f.normalized, 3)} (± ${IT.num(f.error, 3)})`;
      return [
        `Var(S_n) = nσ² cresce, Var(S_n/n) = σ²/n tende a zero, Var(S_n/√n) = σ² resta costante: è la regola Var(cX) = c² Var(X) con c = 1, 1/n e 1/√n. Le rette hanno pendenze 1, -1 e 0; le pendenze stimate sono ${slopes(fits.bernoulli)} per Bernoulli e ${slopes(fits.rademacher)} per Rademacher.`,
        'Le tre stime però non sono tre prove indipendenti: la varianza campionaria di S_n/n è esattamente quella di S_n divisa per n², quindi le tre pendenze differiscono esattamente di 2 e di 1, e l’informazione è una sola, Var(S_n) proporzionale a n. L’errore della pendenza è quello dei minimi quadrati, che tratta i punti come indipendenti; qui non lo sono, perché a ogni n gli attaccanti sono gli stessi, e l’incertezza vera è un po’ più grande.',
        'Con una normalizzazione qualsiasi n^α, Var(S_n/n^α) = σ² n^(1 - 2α): tende a infinito per α < 1/2, a zero per α > 1/2, e resta finita e positiva solo per α = 1/2. √n è l’unica scala a cui la variabilità di S_n resta visibile, ed è la scala del teorema del limite centrale.',
      ];
    },
  },
  clt: {
    intro: [
      'Il teorema del limite centrale (Lindeberg e Lévy, per incrementi i.i.d. con varianza finita) dice che (S_n - nμ)/(σ√n) converge in distribuzione a N(0, 1): per ogni x, P((S_n - nμ)/(σ√n) ≤ x) → Φ(x). Nel modello di Rademacher μ = 0 e σ = 1, quindi la grandezza standardizzata è proprio S_n/√n, il caso che la consegna chiede di studiare. Nel modello di Bernoulli S_n/√n non converge (sezione 5.3): converge la versione centrata e scalata, (S_n - np)/√(np(1 - p)).',
    ],
  },
  normal: {
    intro: 'Istogramma e grafico quantile-quantile della grandezza standardizzata, per ogni n. Nel grafico quantile-quantile ogni punto confronta un quantile della simulazione con lo stesso quantile di N(0, 1): se le due leggi coincidono, i punti stanno sulla diagonale. Per n piccoli i punti formano gradini, perché S_n ha pochi valori.',
    modelLabel: 'Grandezza',
    models: { rademacher: 'Rademacher: S_n/√n', bernoulli: 'Bernoulli: (S_n - np)/√(np(1 - p))' },
    nLabel: (n) => `n = ${IT.int(n)}`,
    histChart: (label, n) => `${label} con n = ${IT.int(n)}: istogramma e densità di N(0, 1)`,
    qqChart: (label, n) => `${label} con n = ${IT.int(n)}: quantili simulati contro quantili di N(0, 1)`,
    legend: ['simulazione', 'legge esatta', 'N(0, 1)'],
    qqLegend: ['quantili simulati', 'diagonale: le due leggi coincidono'],
    stats: (sh) => `n = ${IT.int(sh.n)}: asimmetria ${IT.num(sh.skewness, 3)} (esatta ${IT.num(sh.theorySkewness, 3)}), curtosi in eccesso ${IT.num(sh.excess, 3)} (esatta ${IT.num(sh.theoryExcess, 3)}); distanza di Kolmogorov dalla normale: simulata ${IT.num(sh.ks, 4)}, esatta ${IT.num(sh.distance, 4)}, esatta con la correzione di continuità ${IT.small(sh.distanceCorrected)}.`,
    after: [
      'Si vedono due cose. La prima: anche per Rademacher, che è simmetrico, la legge di S_n/√n per n piccoli è a gradini, perché S_n ha solo n + 1 valori, distanti 2/√n dopo la standardizzazione. Per n pari la funzione di ripartizione salta di P(S_n = 0) ≈ √(2/(πn)) nello zero, e nessuna funzione continua può starle più vicina di metà del salto, circa 1/√(2πn).',
      'La seconda: la convergenza non dipende dalla forma della legge degli incrementi. Due valori soli, discreti, in un caso asimmetrici: basta che la varianza sia finita, e la somma standardizzata diventa normale. È ciò che rende la normale la legge di riferimento per ogni punteggio aggregato.',
    ],
  },
  speed: {
    intro: `Quanto è vicina alla normale la somma standardizzata, per ogni n? La distanza di Kolmogorov sup_x |F_n(x) - Φ(x)| si calcola esattamente dalla legge binomiale (linee) e si stima dalla simulazione (punti). Il teorema di Berry-Esseen la limita con C E|X - μ|³/(σ³√n), dove C ≤ ${IT.num(BERRY_ESSEEN_C, 4)} (Shevtsova, 2011).`,
    chart: (model) => `${model}: distanza di Kolmogorov dalla normale al crescere di n (scale logaritmiche)`,
    legend: ['esatta', 'esatta, con la correzione di continuità', 'limite di Berry-Esseen', 'simulata (Kolmogorov-Smirnov)', 'rumore della simulazione, 0,87/√m'],
    after: (s) => {
      const f = speedFacts(s);
      const p = IT.plain(s.params.p);
      return [
        `Per Rademacher la distanza esatta vale ${IT.num(f.r100.distance, 4)} a n = ${IT.int(f.n100)} e ${IT.small(f.rN.distance)} a n = ${IT.int(f.N)}: decresce come 1/√n, e quasi esattamente come 1/√(2πn) ≈ 0,399/√n, metà del salto nello zero. Il limite di Berry-Esseen, ${IT.num(BERRY_ESSEEN_C, 4)}/√n, le sta sopra di appena il ${IT.pct(f.ratio, 0)}: per una legge a due valori il teorema è quasi ottimale. Con la correzione di continuità, cioè confrontando la normale a metà strada fra due valori possibili, la distanza scende a ${IT.small(f.rN.corrected)}, un ordine 1/n: per somme di Rademacher l’errore della normale è quasi tutto dovuto al reticolo.`,
        f.symmetric
          ? `Con p = ${p} anche la binomiale di Bernoulli è simmetrica: la distanza vale ${IT.num(f.b100.distance, 4)} a n = ${IT.int(f.n100)}, e con la correzione di continuità scende a ${IT.small(f.b100.corrected)}, come per Rademacher.`
          : `Per Bernoulli con p = ${p} la distanza è più grande (${IT.num(f.b100.distance, 4)} a n = ${IT.int(f.n100)}), perché al reticolo si aggiunge l’asimmetria della binomiale, (1 - 2p)/√(np(1 - p)), che la correzione di continuità non elimina: corretta, la distanza vale ${IT.num(f.b100.corrected, 4)}, ancora di ordine 1/√n.`,
        `La distanza simulata segue quella esatta finché questa supera il rumore della simulazione, circa 0,87/√m = ${IT.num(f.noise, 4)} con m = ${IT.int(s.params.m)}; sotto, i punti si appiattiscono sul rumore. È il secondo senso in cui m va scelto in modo adatto: per vedere una differenza d fra due leggi servono almeno (1/d)² attaccanti, circa ${IT.int(f.need)} per la distanza esatta a n = ${IT.int(f.N)}.`,
      ];
    },
  },
  bernoulli: {
    intro: 'Per Bernoulli S_n/√n ha media p√n e varianza p(1 - p): la varianza resta finita, come per Rademacher, ma la media cresce senza limite, e la legge scivola verso destra senza fermarsi (sezione 2.1). Il teorema del limite centrale si applica alla grandezza centrata: (S_n - np)/√n converge a N(0, p(1 - p)), e (S_n - np)/√(np(1 - p)) a N(0, 1), il teorema di de Moivre e Laplace.',
    tableTitle: 'Bernoulli: la deriva di S_n/√n e l’asimmetria che si attenua',
    cols: { n: 'n', mean: 'E[S_n/√n] = p√n', sampleMean: 'Media simulata', skewness: 'Asimmetria esatta', sampleSkewness: 'Asimmetria simulata', distance: 'Distanza esatta dalla normale' },
    after: (s) => {
      const M = s.models.bernoulli;
      const N = s.params.n;
      return [
        `L’asimmetria della binomiale, (1 - 2p)/√(np(1 - p)), tende a zero come 1/√n: con p = ${IT.plain(s.params.p)} vale ${IT.num(M.mom.skewness / Math.sqrt(SMALL_N), 3)} a n = ${SMALL_N} e ${IT.num(M.mom.skewness / Math.sqrt(N), 4)} a n = ${IT.int(N)}. Quando p è piccolo e np resta moderato la normale approssima male, e la binomiale somiglia piuttosto alla legge di Poisson di media np (Poisson, 1837): con sistemi molto difficili da penetrare il numero di successi di un attaccante resta piccolo e asimmetrico anche per n grandi. La regola pratica np(1 - p) ≥ 10, per usare la normale, qui chiede n ≥ ${IT.int(normalRule(M.mom))}.`,
        'Per l’interpretazione la differenza fra i due modelli è importante: nel modello di Bernoulli lo spostamento p√n di S_n/√n è il punteggio che l’attaccante accumula in media, ed è quello che conta; le fluttuazioni attorno, di ordine 1, sono il rumore. Nel modello di Rademacher non c’è spostamento, e le fluttuazioni sono tutto.',
      ];
    },
  },
  interpretation: {
    intro: ['Tornando agli attaccanti e ai sistemi: cosa cambia con più sistemi, cosa con più attaccanti, e come si comporta il punteggio aggregato di tutti.'],
  },
  size: {
    paras: (s) => {
      const f = interpretationFacts(s);
      const W = f.walk;
      return [
        `Più sistemi rendono prevedibile la frazione, non il totale. Nel modello di Bernoulli un attaccante penetra in media np sistemi, con una deviazione standard di √(np(1 - p)): con n = ${IT.int(f.N)} sono ${IT.num(f.np, 0)} ± ${IT.num(f.sd, 1)}. In valore assoluto l’incertezza cresce (da ${IT.num(f.sd100, 1)} sistemi a n = ${IT.int(f.n100)} a ${IT.num(f.sd, 1)} a n = ${IT.int(f.N)}), in proporzione cala (dal ${IT.pct(f.rel100)} al ${IT.pct(f.relN)} della media). Per chi difende un’infrastruttura grande è una buona notizia a metà: la quota di sistemi compromessi è quasi certa, il loro numero no.`,
        `Nel modello di Rademacher la media è zero, ma le traiettorie non restano vicine allo zero. Il valore tipico di |S_n| è √(2n/π) ≈ ${IT.num(f.typical, 1)}, e il massimo raggiunto lungo la strada ha in media lo stesso ordine: ${IT.num(W.maximumExact, 1)} esatto, dal principio di riflessione, e ${IT.num(W.maximum, 1)} nella simulazione. Il cammino torna in zero in media solo ${IT.num(W.zerosExact, 1)} volte in ${IT.int(f.N)} passi (${IT.num(W.zeros, 1)} nella simulazione): i pareggi sono rari, e in proporzione lo diventano sempre di più, come √n su n.`,
        `La legge dell’arcoseno (Lévy, 1939) dice quanto tempo un attaccante passa in vantaggio. L’intuizione direbbe circa la metà; invece la quota di tempo in vantaggio ha densità 1/(π√(x(1 - x))), alta vicino a 0 e a 1 e bassa nel mezzo: chi passa in vantaggio tende a restarci a lungo. Fra gli attaccanti simulati, il ${IT.pct(W.extreme)} è stato dalla stessa parte per più del 90% dei primi ${IT.int(W.even)} sistemi (esatto ${IT.pct(W.extremeExact)}, legge limite ${IT.pct(W.extremeLimit)}), contro il 20% che darebbe una quota uniforme.`,
      ];
    },
    arcsineChart: (even, m) => `Rademacher: quota dei primi ${IT.int(even)} sistemi in cui l’attaccante è in vantaggio, sui ${IT.int(m)} attaccanti`,
    arcsineLegend: ['simulazione', 'legge esatta (Feller)', 'densità dell’arcoseno'],
    after: ['È la lezione più controintuitiva di questa sezione: in un confronto alla pari, un attaccante in vantaggio per migliaia di sistemi di fila non è un indizio di bravura, è il comportamento normale del caso. Lo stesso vale per un difensore che "vince" a lungo.'],
  },
  attackers: {
    intro: 'Il numero di attaccanti non cambia la legge del punteggio di ognuno: cambia quanto bene la si stima (sezioni 3 e 5) e, soprattutto, cosa fa il migliore. Per vederlo gli m attaccanti del modello di Bernoulli vengono divisi in gruppi di b, e in ogni gruppo si guarda il massimo dei punteggi finali standardizzati, (S_n - np)/√(np(1 - p)).',
    bestChart: (n) => `Bernoulli, n = ${IT.int(n)}: il miglior punteggio standardizzato in un gruppo di b attaccanti (asse di b logaritmico)`,
    bestLegend: ['simulazione: media sui gruppi, intervallo al 95%', 'valore esatto (binomiale)', 'massimo di b normali standard', '√(2 ln b)'],
    probabilityChart: (n) => `Bernoulli, n = ${IT.int(n)}: almeno uno di b attaccanti oltre la media di 3 deviazioni standard, e sistemi penetrati da almeno uno dei primi b`,
    probabilityLegend: ['almeno uno oltre +3σ: simulazione', 'almeno uno oltre +3σ: esatta', 'sistemi penetrati: simulazione', 'sistemi penetrati: esatta'],
    after: (s) => {
      const f = interpretationFacts(s);
      const simulated = f.row5 && f.row20 ? ` (simulati: ${IT.pct(f.row5.coverage)} e ${IT.pct(f.row20.coverage)})` : '';
      return [
        `Il migliore di b attaccanti si allontana dalla media lentamente, come √(2 ln b): ${IT.num(f.best10, 2)} deviazioni standard con 10 attaccanti, ${IT.num(f.best100, 2)} con 100 e ${IT.num(f.best1000, 2)} con 1.000, secondo la legge esatta. Per ogni fattore 10 di attaccanti in più il primo guadagna circa ${IT.num((f.best1000 - f.best10) / 2, 2)} deviazioni standard: raddoppiare gli attaccanti non raddoppia nulla.`,
        `Gli eventi rari per un attaccante diventano probabili per molti. Superare la media di 3 deviazioni standard succede a un singolo attaccante con probabilità ${IT.num(f.tail, 4)}, ma ad almeno uno su 100 con probabilità ${IT.num(f.atLeast100, 3)} e ad almeno uno su 1.000 con ${IT.num(f.atLeast1000, 3)}. Per chi difende conta il caso peggiore, e il caso peggiore cresce con m anche se nessun attaccante è più bravo degli altri.`,
        `La stessa formula vale per la copertura dei sistemi: un sistema resiste a un attaccante con probabilità 1 - p e a b attaccanti indipendenti con probabilità (1 - p)^b, quindi la quota di sistemi penetrati da almeno uno dei primi b è 1 - (1 - p)^b: ${IT.pct(f.cover5)} con 5 attaccanti e ${IT.pct(f.cover20)} con 20${simulated}. Con p = ${IT.plain(f.p)} bastano ${IT.int(f.b95)} attaccanti indipendenti per raggiungere il 95% dei sistemi.`,
      ];
    },
  },
  aggregate: {
    paras: (s) => {
      const f = interpretationFacts(s);
      const A = f.aggregate;
      return [
        `Il punteggio aggregato di tutti gli attaccanti su tutti i sistemi, T, la somma di tutti gli X, è una somma di mn incrementi i.i.d., e valgono gli stessi teoremi con mn al posto di n. Per Bernoulli T ha media mnp = ${IT.int(A.expected)} e deviazione standard √(mnp(1 - p)) = ${IT.num(A.sd, 1)}; la simulazione dà ${IT.int(A.total)} (z = ${IT.num(A.z, 2)}). Media e varianza dipendono da n e m solo attraverso il prodotto: 10 attaccanti su 1.000 sistemi e 1.000 attaccanti su 10 sistemi producono in media lo stesso punteggio aggregato.`,
        `Il prodotto però non dice tutto: la stessa tabella m × n di esiti si legge per righe o per colonne. Per riga, cioè per attaccante, la somma è S_n; per colonna, cioè per sistema, è il numero di attaccanti che lo hanno penetrato, K_i ~ Bin(m, p). I teoremi valgono anche lungo le colonne, con m al posto di n: per sistema la media è mp = ${IT.num(A.systemMean, 1)} e la varianza mp(1 - p) = ${IT.num(A.systemVariance, 1)}; sui ${IT.int(f.N)} sistemi simulati sono ${IT.num(A.perSystemMean, 1)} e ${IT.num(A.perSystemVariance, 1)}, e il test χ² ${f.systems.verdict === 'reject' ? 'rifiuta' : 'non rifiuta'} la legge binomiale (p = ${IT.pval(f.systems.pValue)}).`,
      ];
    },
    systemsChart: (n, m) => `Bernoulli: numero di attaccanti, sui ${IT.int(m)}, che hanno penetrato ciascuno degli ${IT.int(n)} sistemi`,
    systemsLegend: ['simulazione', 'legge esatta Bin(m, p)', 'normale con la stessa media e la stessa varianza'],
    after: ['In sintesi, n e m hanno ruoli simmetrici nel punteggio totale e ruoli diversi nelle domande che contano: n decide quanto è prevedibile la quota di successi di ciascun attaccante, m quanto è estremo il migliore e quanti sistemi vengono raggiunti da qualcuno.'],
  },
  limits: {
    paras: [
      'Il modello i.i.d. è una prima approssimazione, utile proprio perché permette di calcolare tutto. Nella realtà le sue ipotesi cadono in almeno quattro modi, e ognuno cambia una conclusione diversa.',
      'Sistemi diversi. Se la probabilità di penetrazione dipende dal sistema, p_i, gli incrementi restano indipendenti ma non sono più identicamente distribuiti. La legge dei grandi numeri vale ancora, per la media delle p_i, e il teorema del limite centrale nelle versioni di Lyapunov (1901) e di Lindeberg (1922), purché nessun sistema domini la varianza: le conclusioni delle sezioni 3, 4 e 5 restano, con μ e σ² medie sui sistemi.',
      'Vulnerabilità comuni. Se molti sistemi condividono una vulnerabilità (lo stesso software, la stessa configurazione), gli esiti sono correlati. Con una correlazione ρ fra gli incrementi, Var(S_n) = nσ²(1 + (n - 1)ρ), che cresce come n², e S_n/n non si concentra più su μ: la legge dei grandi numeri cade. È il caso peggiore per chi difende, perché la diversificazione smette di ridurre il rischio.',
      'Attaccanti che imparano. Se ogni successo rende più facile il successivo, per esempio perché un accesso ottenuto apre la strada al movimento laterale, gli incrementi sono dipendenti e il processo somiglia a un’urna di Pólya: S_n/n converge ancora, ma a un limite casuale che dipende dai primi passi, e due attaccanti identici possono finire con frazioni di successo molto diverse.',
      'Punteggi a coda pesante. Se un singolo sistema può valere un punteggio enorme (un controller di dominio rispetto a una stampante) e la varianza è infinita, il teorema del limite centrale classico non vale: la somma è dominata dai valori più grandi e tende a una legge stabile, non normale. In tutti questi casi la simulazione resta lo strumento giusto: cambia il modello, non il metodo.',
    ],
  },
  stats: {
    verdict: { reject: 'H₀ rifiutata', notReject: 'H₀ non rifiutata' },
    expected: { reject: 'atteso: rifiuto', notReject: 'atteso: nessun rifiuto', either: 'dipende dalla potenza del test' },
    testLine: testLineIt,
    groups: { sim: 'Generatore', lln: 'Grandi numeri', clt: 'Limite centrale', walk: 'Cammino aleatorio' },
    labels: {
      sim: {
        bernoulliPairs: 'Bernoulli: incrementi consecutivi indipendenti (χ², 2 × 2)',
        rademacherPairs: 'Rademacher: incrementi consecutivi indipendenti (χ², 2 × 2)',
        bernoulliSystems: 'Bernoulli: i colpi per sistema seguono Bin(m, p) (χ²)',
      },
      lln: {
        bernoulliMean: 'Bernoulli: la media di S_n/n è p (z)',
        rademacherMean: 'Rademacher: la media di S_n/n è 0 (z)',
        bernoulliVariance: 'Bernoulli: la varianza di S_n è np(1 - p) (z, grandi campioni)',
        rademacherVariance: 'Rademacher: la varianza di S_n è n (z, grandi campioni)',
      },
      clt: {
        bernoulliExact: 'Bernoulli: S_n segue la sua legge esatta Bin(n, p) (χ²)',
        rademacherExact: 'Rademacher: S_n segue la sua legge esatta 2 Bin(n, 1/2) - n (χ²)',
        rademacherNormal: 'Rademacher: S_n/√n è N(0, 1), con la correzione di continuità (Kolmogorov-Smirnov)',
        rademacherSmall: `Rademacher: S_${SMALL_N}/√${SMALL_N} è N(0, 1), senza correzione (Kolmogorov-Smirnov)`,
        rademacherJb: 'Rademacher: S_n/√n ha asimmetria e curtosi di una normale (Jarque-Bera)',
        bernoulliJb: 'Bernoulli: S_n standardizzata ha asimmetria e curtosi di una normale (Jarque-Bera)',
        bernoulliSmall: `Bernoulli: S_${SMALL_N} standardizzata ha asimmetria e curtosi di una normale (Jarque-Bera)`,
      },
      walk: { arcsine: 'Rademacher: il tempo in vantaggio segue la legge dell’arcoseno di Feller (χ²)' },
    },
  },
  tests: {
    intro: (s) => `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. Il generatore si controlla con gli incrementi consecutivi e con i colpi per sistema; la legge dei grandi numeri con la media e la varianza a n = ${IT.int(s.params.n)}; il teorema del limite centrale con la legge esatta, la normale e i momenti; il cammino con la legge dell’arcoseno. Due test, a n = ${SMALL_N}, hanno un’ipotesi nulla falsa di proposito: la normale non è ancora una buona approssimazione, e il loro rifiuto è atteso.`,
    cols: { subject: 'Oggetto', hypothesis: 'Ipotesi nulla H₀', p: 'p-value', verdict: 'Esito', expected: 'Lettura' },
    after: (sum, s) => {
      const out = [`${sum.rejected} test su ${sum.count} rifiutano l’ipotesi nulla, ${sum.asExpected === sum.count ? 'tutti come atteso' : `${sum.asExpected} su ${sum.count} come atteso`}.`];
      const expectedFalse = IT.num(sum.nulls * SIGNIFICANCE, 2);
      const which = sum.falseRejections.map((t) => IT.pval(t.result.pValue)).join(', ');
      out.push(
        `Fra i ${sum.nulls} test con un’ipotesi nulla vera (o falsa per differenze troppo piccole perché m attaccanti le vedano), al livello ${IT.num(SIGNIFICANCE, 2)} ci si aspettano in media ${expectedFalse} rifiuti per puro caso: ${sum.falseRejections.length === 0 ? 'qui non ce ne sono' : `qui ${sum.falseRejections.length === 1 ? 'ce n’è uno' : `ce ne sono ${sum.falseRejections.length}`} (p = ${which})`}. La correzione di Holm per i test multipli, che tiene sotto il 5% la probabilità anche di un solo rifiuto sbagliato, confronta il p-value più piccolo con ${IT.num(SIGNIFICANCE, 2)}/${sum.nulls} = ${IT.num(sum.holmThreshold, 4)}, il successivo con ${IT.num(SIGNIFICANCE, 2)}/${sum.nulls - 1} e così via: ${sum.holm === 0 ? 'nessun rifiuto sopravvive' : `${sum.holm === 1 ? 'sopravvive un rifiuto' : `sopravvivono ${sum.holm} rifiuti`}, da guardare come un possibile difetto`}.`,
      );
      const small = s.models.rademacher.tests.smallKs;
      out.push(`Un’osservazione vale per tutti: a parità di differenza, il p-value dipende da m. Con ${IT.int(s.params.m)} attaccanti il test di Kolmogorov-Smirnov vede distanze dalla normale di qualche centesimo e rifiuta la normalità di S_${SMALL_N}/√${SMALL_N} con p = ${IT.pval(small.pValue)}; con cinquanta attaccanti la stessa distanza, ${IT.num(small.D, 3)}, passerebbe inosservata. Significatività ed entità di una differenza sono due domande diverse.`);
      return out;
    },
  },
  history: {
    intro: 'Dalle prove di Bernoulli al generatore di questa pagina, le idee usate nell’homework in ordine cronologico.',
    legend: { task: 'usato in questa pagina', context: 'contesto' },
    events: [
      { year: '1654', task: false, title: 'Pascal e Fermat', text: 'Il problema delle parti, come dividere la posta di una partita interrotta: la corrispondenza fra Pascal e Fermat fonda il calcolo delle probabilità.' },
      { year: '1713', task: true, title: 'Jakob Bernoulli', text: 'Nell’Ars Conjectandi, pubblicata postuma, il "teorema d’oro": la frequenza dei successi in prove indipendenti si avvicina alla loro probabilità. È la prima legge dei grandi numeri, e le prove con due esiti portano il suo nome.' },
      { year: '1733', task: true, title: 'de Moivre', text: 'Approssima la binomiale con p = 1/2 con la curva che oggi si chiama normale, poi la ripubblica in The Doctrine of Chances (1738): il primo teorema del limite centrale, proprio per somme di incrementi ±1.' },
      { year: '1812', task: true, title: 'Laplace', text: 'Nella Théorie analytique des probabilités estende il risultato a p qualunque, il teorema di de Moivre e Laplace della sezione 5.3, e a somme più generali.' },
      { year: '1837', task: true, title: 'Poisson', text: 'Nelle Recherches sur la probabilité des jugements dà il nome alla legge dei grandi numeri e ricava la legge degli eventi rari, l’approssimazione della binomiale quando p è piccolo.' },
      { year: '1853-1867', task: true, title: 'Bienaymé e Chebyshev', text: 'La disuguaglianza P(|X - μ| ≥ kσ) ≤ 1/k² e la dimostrazione della legge debole per variabili indipendenti con varianze limitate: il limite della sezione 3.2.' },
      { year: '1889', task: true, title: 'Galton', text: 'In Natural Inheritance descrive il quincunx, la tavola di chiodi che aveva costruito anni prima: a ogni fila una pallina rimbalza a destra o a sinistra, quindi ogni pallina compie un cammino di Rademacher, e il mucchio in fondo è la campana.' },
      { year: '1900-1901', task: true, title: 'Lyapunov', text: 'Dimostra il teorema del limite centrale per variabili indipendenti non identiche, con una condizione sui momenti, usando le funzioni caratteristiche.' },
      { year: '1905', task: false, title: 'Pearson', text: 'In una lettera a Nature chiede la legge della distanza percorsa da chi fa n passi in direzioni casuali: nasce il nome random walk.' },
      { year: '1909', task: true, title: 'Borel', text: 'La legge forte dei grandi numeri per le prove di Bernoulli: quasi ogni numero reale ha cifre binarie con frequenza 1/2.' },
      { year: '1920-1921', task: true, title: 'Pólya', text: 'Chiama "teorema del limite centrale" il risultato di de Moivre e Laplace (1920), e dimostra che il cammino aleatorio semplice torna all’origine con probabilità 1 in una e due dimensioni, non in tre (1921).' },
      { year: '1922', task: false, title: 'Lindeberg', text: 'La condizione più generale per il teorema del limite centrale con incrementi indipendenti non identici, che Feller (1935) mostrerà essere anche necessaria.' },
      { year: '1924', task: true, title: 'Khinchin', text: 'La legge del logaritmo iterato per le prove di Bernoulli: le oscillazioni di S_n - np arrivano a √(2np(1 - p) ln ln n), e non oltre. È l’inviluppo dell’animazione.' },
      { year: '1929-1933', task: true, title: 'Kolmogorov', text: 'Estende la legge del logaritmo iterato (1929); nel 1933 fonda la probabilità sugli assiomi, dimostra la legge forte in generale e introduce la distanza fra funzioni di ripartizione su cui si basa il test di Kolmogorov-Smirnov.' },
      { year: '1939', task: true, title: 'Lévy', text: 'Le leggi dell’arcoseno per il moto browniano. La versione per il cammino di Rademacher, con la legge esatta della sezione 6.1, è nel libro di Feller (1950).' },
      { year: '1941-1942', task: true, title: 'Berry ed Esseen', text: 'Indipendentemente, il limite C ρ/(σ³√n) alla distanza fra la somma standardizzata e la normale: la velocità del teorema del limite centrale.' },
      { year: '1949', task: true, title: 'Metropolis e Ulam', text: 'The Monte Carlo Method: stimare probabilità e valori attesi simulando molti campioni, il metodo di questa pagina.' },
      { year: '1963', task: true, title: 'Hoeffding', text: 'La disuguaglianza esponenziale per somme di variabili limitate.' },
      { year: '1980', task: true, title: 'Jarque e Bera', text: 'Il test di normalità basato sull’asimmetria e sulla curtosi.' },
      { year: '1997', task: false, title: 'Jonsson e Olovsson', text: 'Un modello quantitativo del processo di intrusione costruito sul comportamento di attaccanti reali: il processo di penetrazione come oggetto statistico.' },
      { year: '2011', task: true, title: 'Shevtsova', text: `Abbassa la costante di Berry-Esseen per addendi identicamente distribuiti a ${IT.num(BERRY_ESSEEN_C, 4)}, il valore della sezione 5.2.` },
      { year: '2014-2018', task: true, title: 'SplitMix e xoshiro', text: 'Steele, Lea e Flood pubblicano SplitMix (2014), Blackman e Vigna i generatori xoshiro (2018): sono i numeri casuali di questa pagina.' },
    ],
    after: 'Letta in ordine, la storia di questi teoremi è la struttura di questa pagina: prima la legge dei grandi numeri per le prove di Bernoulli (1713), poi la normale per le somme di ±1 (1733), poi la generalità (Laplace, Chebyshev, Lyapunov, Lindeberg), le traiettorie (Borel, Khinchin, Lévy) e la velocità (Berry ed Esseen). La simulazione è arrivata per ultima e ha cambiato il modo di usarli: i teoremi dicono che cosa aspettarsi, la simulazione controlla se il modello è quello giusto.',
  },
  conclusion: (s) => {
    if (!s) {
      return [
        'Le tre grandezze della consegna sono la stessa variabile su tre scale, e le tre scale raccontano tre storie: S_n cresce, S_n/n si concentra su μ (legge dei grandi numeri), S_n/√n si stabilizza e, per Rademacher, diventa normale (teorema del limite centrale).',
      ];
    }
    const rows = llnRows(s, 0.05);
    const R = s.models.rademacher;
    const f = interpretationFacts(s);
    const first = rows.rademacher.find((r) => r.n >= 100) || rows.rademacher[0];
    const lastRow = rows.rademacher[rows.rademacher.length - 1];
    const d = lastOf(R).distance;
    return [
      `Le tre grandezze della consegna sono la stessa variabile su tre scale, e le tre scale raccontano tre storie. S_n cresce: per Bernoulli come np, con fluttuazioni di ordine √n, per Rademacher resta centrata sullo zero ma si allarga come √n. S_n/n si concentra: per Rademacher la probabilità di stare lontano da μ più di 0,05 scende da ${IT.num(first.exact, 3)} a n = ${IT.int(first.n)} a ${IT.small(lastRow.exact)} a n = ${IT.int(lastRow.n)}, la legge dei grandi numeri. S_n/√n si stabilizza: la sua varianza resta σ², e per Rademacher la sua legge converge a N(0, 1), con una distanza di Kolmogorov di ${IT.small(d)} a n = ${IT.int(s.params.n)}, il teorema del limite centrale.`,
      'La simulazione concorda con la teoria entro il suo errore: medie, varianze e leggi esatte non vengono rifiutate, e i rifiuti attesi sono quelli a n = 10, dove la normale non è ancora una buona approssimazione. Due cose però la simulazione non vede da sola, e servono i calcoli esatti: le probabilità più piccole di 1/m e le distanze più piccole di 1/√m. È il senso preciso in cui m va scelto in modo adatto.',
      `Per attaccanti e sistemi la lezione è doppia. Con più sistemi la quota di successi di ciascun attaccante diventa prevedibile, mentre il numero assoluto di sistemi compromessi resta incerto di √n. Con più attaccanti nessuno diventa più bravo, ma il migliore si allontana dalla media come √(2 ln m), gli eventi rari diventano probabili e quasi tutti i sistemi vengono raggiunti da qualcuno: il ${IT.pct(f.cover20)} dei sistemi già con 20 attaccanti indipendenti.`,
      'Il modello è volutamente semplice: sistemi uguali, esiti indipendenti, attaccanti che non imparano. Le sue conclusioni più robuste, la concentrazione delle frequenze, la scala √n e la crescita del caso peggiore con m, sopravvivono a sistemi diversi; cadono con vulnerabilità comuni e attaccanti che imparano, e lì la simulazione resta lo strumento per scoprire che cosa cambia.',
    ];
  },
  modelNames: { bernoulli: 'Bernoulli', rademacher: 'Rademacher' },
  quantityNames: { sum: 'S_n', mean: 'S_n/n', normalized: 'S_n/√n' },
  trajectoryNames: { sum: 'S_k', mean: 'S_k/k', normalized: 'S_k/√k' },
  tips: {
    bin: (from, to, share, prob, normal) => {
      const d = edgeDigits(from, to);
      return `Da ${IT.num(from, d)} a ${IT.num(to, d)}: simulazione ${IT.pct(share, 2)}${prob === null ? '' : `, legge esatta ${IT.pct(prob, 2)}`}${normal === null ? '' : `, normale ${IT.pct(normal, 2)}`}`;
    },
    share: (from, to, share, prob, limit) => `In vantaggio fra il ${IT.pct(from, 1)} e il ${IT.pct(to, 1)} del tempo: simulazione ${IT.pct(share, 2)}, legge esatta ${IT.pct(prob, 2)}, arcoseno ${IT.pct(limit, 2)}`,
    lln: (r) => `n = ${IT.int(r.n)}: simulata ${IT.num(r.rate, 4)} (95%: ${IT.num(r.interval[0], 4)}-${IT.num(r.interval[1], 4)}), esatta ${IT.small(r.exact)}, Chebyshev ${IT.small(r.chebyshev)}, Hoeffding ${IT.small(r.hoeffding)}`,
    variance: (n, pairs) => `n = ${IT.int(n)}: ${['S_n', 'S_n/n', 'S_n/√n'].map((q, i) => `Var(${q}) ${IT.small(pairs[i][0])} (esatta ${IT.small(pairs[i][1])})`).join(', ')}`,
    distance: (n, d, dc, bound, ks) => `n = ${IT.int(n)}: esatta ${IT.small(d)}, con correzione ${IT.small(dc)}, Berry-Esseen ${IT.small(bound)}${ks === null ? '' : `, simulata ${IT.num(ks, 4)}`}`,
    qq: (a, b) => `Quantile di N(0, 1) ${IT.num(a, 2)}: simulato ${IT.num(b, 2)}`,
    best: (r) => `b = ${IT.int(r.b)} (${IT.int(r.groups)} gruppi): simulato ${IT.num(r.mean, 2)} ± ${IT.num(1.96 * r.error, 2)}, esatto ${IT.num(r.exact, 2)}, normale ${IT.num(r.normal, 2)}`,
    probability: (r) => `b = ${IT.int(r.b)}: almeno uno oltre +3σ ${IT.pct(r.beyond)} (esatta ${IT.pct(r.beyondExact)}); sistemi penetrati ${IT.pct(r.coverage)} (esatta ${IT.pct(r.coverageExact)})`,
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline, con le stesse simulazioni e animazioni. Con node homework3.js stampa nel terminale le tabelle, i test e un istogramma; --p, --n, --m, --seed ed --epsilon cambiano i parametri.',
    contents: 'Contenuto: index.html, style.css, homework3.js (generatore, simulazione, statistica, grafici e animazione), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework3',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Il punteggio di penetrazione di m attaccanti su n sistemi: legge dei grandi numeri e teorema del limite centrale.',
    course: 'Statistics, laurea magistrale in Cybersecurity, Sapienza Università di Roma',
    online: 'Versione online',
    noscript: 'Questo programma ha bisogno di JavaScript.',
  },
};

// ---------------------------------------------------------------------------
// ENGLISH
// ---------------------------------------------------------------------------

const EN = formatters('.', ',', 'n/a', '×');

function testLineEn(t) {
  const F = EN;
  switch (t.kind) {
    case 'chi2':
      return `χ² = ${F.num(t.chi2, 1)} over ${F.int(t.classes)} classes (${F.int(t.df)} degrees of freedom), p = ${F.pval(t.pValue)}`;
    case 'independence':
      return `χ² = ${F.num(t.chi2, 2)} on a 2 × 2 table of ${F.int(t.N)} pairs (1 degree of freedom), Cramér’s V = ${F.num(t.cramerV, 5)}, p = ${F.pval(t.pValue)}`;
    case 'mean':
      return `mean ${F.num(t.mean, 5)} against ${F.num(t.expected, 5)}, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'variance':
      return `variance ${F.num(t.variance, 1)} against ${F.num(t.expected, 1)} (ratio ${F.num(t.ratio, 4)}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'ks':
      return `D = ${F.num(t.D, 4)} over ${F.int(t.m)} attackers, √m D = ${F.num(t.lambda, 2)}, p = ${F.pval(t.pValue)}${t.corrected ? ' (with the continuity correction; against a discrete law the test is conservative)' : ''}`;
    case 'jb':
      return `skewness ${F.num(t.skewness, 3)}, excess kurtosis ${F.num(t.excessKurtosis, 3)}, JB = ${F.num(t.statistic, 2)} (χ² with 2 degrees of freedom), p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

const valueEn = (v, quantity) => EN.num(v, DIGITS[quantity]);

const en = {
  fmt: EN,
  ui: {
    index: 'Contents',
    indexTitle: 'Homework contents',
    close: 'Close',
    backToTop: 'Back to top',
    computing: 'Simulating...',
    language: 'Language',
    error: (m) => `Error: ${m}`,
  },
  sections: {
    assignment: '0. The assignment',
    model: '1. TASK: systems, attackers and the penetration process',
    models: '1.1 The two models of the score',
    quantities: '1.2 The three quantities',
    input: '1.3 Systems, attackers and seed',
    trajectories: '1.4 The trajectories, system after system',
    verify: '1.5 Checks',
    distributions: '2. The distributions with more and more systems',
    sweep: '2.1 The histograms, point by point',
    moments: '2.2 Means and variances',
    lln: '3. The law of large numbers',
    convergence: '3.1 The convergence in probability of the average score',
    bounds: '3.2 Chebyshev, Hoeffding and the normal',
    strong: '3.3 Weak law and strong law',
    variance: '4. The variance under the three normalizations',
    clt: '5. The central limit theorem',
    normal: '5.1 Rademacher: the normalized sum towards the normal',
    speed: '5.2 How fast the convergence is',
    bernoulli: '5.3 Bernoulli: what converges and what does not',
    interpretation: '6. Systems and attackers: the interpretation',
    size: '6.1 More systems',
    attackers: '6.2 More attackers',
    aggregate: '6.3 The aggregate score',
    limits: '6.4 The limits of the model',
    tests: '7. Summary of the statistical tests',
    history: '8. Historical context',
    conclusion: '9. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment asks to model the penetration of m attackers on n systems with a stochastic process: at every step an attacker gets a score X_i, and the scores X_1, X_2, ... are independent and identically distributed. There are two models: Bernoulli, where X_i is 1 with probability p and 0 otherwise, and Rademacher, where it is +1 or -1 with probability 1/2, the symmetric zero-mean case. For growing n and suitable m, many trajectories are simulated and the distributions of the total score S_n, the average score S_n/n and the normalized total score S_n/√n are studied: the convergence in probability of S_n/n (law of large numbers), the variance under the three normalizations, and the convergence in distribution of S_n/√n to the standard normal in the Rademacher case (central limit theorem). Finally the trajectories are interpreted in terms of systems and attackers, discussing how the system size and the number of attackers affect the aggregate score.',
      'Section 1 makes the model precise, animates its trajectories and checks the simulator; section 2 shows the distributions of the three quantities as n grows; section 3 is devoted to the law of large numbers, section 4 to the variance, section 5 to the central limit theorem and the speed of the convergence; section 6 interprets the results for systems and attackers. Section 7 sums up the statistical tests, section 8 places the ideas in time and section 9 draws the conclusions. Every number is computed in the browser, and the downloadable program prints the same ones.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned. The only change is the minus sign, written "-" as everywhere on this site.',
  },
  model: {
    intro: [
      'Every attacker faces the systems one after the other: on system i it gets the score X_i, and after k systems its score is S_k = X_1 + ... + X_k. The trajectory k ↦ S_k is a random walk, and the m attackers are m independent copies of the same walk. In this reading n is the length of the trajectories, that is how many systems every attacker faces, and m is the size of the sample, that is how many trajectories are observed to estimate the distributions.',
      'The i.i.d. assumption says two things: the systems are equally hard, because every X_i has the same law, and the outcome on one system says nothing about the others, because the X_i are independent. In other words the attacker does not learn and the systems share no vulnerabilities: section 6.4 discusses how realistic that is and what changes without it.',
    ],
    formulasTitle: 'The model in formulas',
    formulas: [
      'Increments    X_1, X_2, ... i.i.d.,  E[X] = μ,  Var(X) = σ²',
      'Bernoulli     X ∈ {0, 1},    P(X = 1) = p          μ = p,  σ² = p(1 - p)',
      'Rademacher    X ∈ {-1, +1},  P(X = +1) = 1/2       μ = 0,  σ² = 1',
      'Trajectory    S_0 = 0,  S_k = S_(k-1) + X_k,  k = 1, ..., n',
      'Quantities    S_n,  S_n/n,  S_n/√n',
    ].join('\n'),
  },
  models: {
    intro: [
      'In the Bernoulli model X_i is 1 when the attacker penetrates system i and 0 when it fails: S_n counts the penetrated systems and follows the binomial law Bin(n, p), and S_n/n is the share of penetrated systems. In the Rademacher model X_i is +1 or -1: the attacker gains or loses ground with the same probability, as in an even match with the defender (access obtained or revoked, a privilege gained or lost). If K is the number of steps forward, S_n = K - (n - K) = 2K - n with K ~ Bin(n, 1/2): it is the simple symmetric random walk.',
      'The two models are close relatives: if B is 1 with probability 1/2, then 2B - 1 is Rademacher. More generally the standardization (X - μ)/σ brings any increment to mean 0 and variance 1. The Rademacher model is the case where the increment is already standardized, and this is why the assignment uses it for the central limit theorem.',
    ],
    tableTitle: (p) => `The moments of one increment, with p = ${EN.plain(p)}`,
    cols: { model: 'Model', values: 'Values', mu: 'Mean μ', variance: 'Variance σ²', rho: 'E|X - μ|³', skewness: 'Skewness' },
    after: [
      'Mean and variance are all the law of large numbers and the central limit theorem need; the moment E|X - μ|³ enters the Berry-Esseen bound on the speed of the convergence (section 5.2); the skewness, (1 - 2p)/√(p(1 - p)) for Bernoulli, explains why with p far from 1/2 the convergence to the normal is slower.',
    ],
  },
  quantities: {
    intro: [
      'For sums of independent variables means and variances add up: E[S_n] = nμ and Var(S_n) = nσ². Dividing by a constant c divides the mean and the standard deviation by c, and the variance by c². The table gives the exact values of the three quantities: the variable is always the same, only the unit in which it is measured changes.',
    ],
    tableTitle: 'Exact mean, variance and standard deviation',
    cols: { quantity: 'Quantity', mean: 'Mean', variance: 'Variance', sd: 'Standard deviation', trend: 'As n grows' },
    rows: [
      ['S_n', 'nμ', 'nσ²', 'σ√n', 'grows: for Bernoulli the mean like n and the standard deviation like √n, for Rademacher only the standard deviation'],
      ['S_n/n', 'μ', 'σ²/n', 'σ/√n', 'concentrates on μ: the variance goes to 0'],
      ['S_n/√n', 'μ√n', 'σ²', 'σ', 'the variance stays σ²: for Rademacher the law settles, for Bernoulli the mean μ√n grows without limit'],
    ],
    after: [
      'The second row is the law of large numbers, the third the central limit theorem. Dividing by n squeezes the variability, not dividing lets it grow, and √n is the only scale in between that keeps it finite and nonzero: this is why the assignment asks for exactly these three normalizations.',
    ],
  },
  input: {
    intro: `The initial values are p = ${EN.plain(DEFAULT_P)} (on average an attacker penetrates one system in ${Math.round(1 / DEFAULT_P)}), n = ${EN.int(DEFAULT_N)} systems, m = ${EN.int(DEFAULT_M)} attackers and the seed ${DEFAULT_SEED}. Every attacker has a generator of its own, xoshiro128**, whose state comes from SplitMix64 applied to the seed, the model and the number of the attacker: with the same seed the page, the animation and node homework3.js see the same attackers and print the same numbers. More systems extend the trajectories already simulated, more attackers join the first ones without changing them. Every change repeats the simulation, which with the initial values draws ${EN.int(2 * DEFAULT_N * DEFAULT_M)} increments; the time it took appears under the fields.`,
    pLabel: `Penetration probability p, Bernoulli model (from ${EN.plain(LIMITS.p[0])} to ${EN.plain(LIMITS.p[1])})`,
    pHint: 'With a decimal point or a decimal comma: 0.2 and 0,2 are the same value. The Rademacher model does not depend on p.',
    nLabel: `Systems n (from ${EN.int(LIMITS.n[0])} to ${EN.int(LIMITS.n[1])})`,
    nHint: 'The length of the trajectories. The quantities are observed at n = 1, 2, 5, 10, 20, 50, ... and at the last system.',
    mLabel: `Attackers m (from ${EN.int(LIMITS.m[0])} to ${EN.int(LIMITS.m[1])})`,
    mHint: 'The trajectories simulated for each model. A probability is estimated with an error of about 1/√m, and a distance between laws below 0.87/√m cannot be told from noise.',
    seedLabel: `Seed (from 0 to ${EN.int(LIMITS.seed[1])})`,
    seedHint: 'The same seed gives the same attackers, here and in the terminal (node homework3.js --seed ...).',
    randomSeed: 'Random seed',
    errors: {
      empty: () => 'Write a value.',
      notInteger: (t) => `"${t}" is not an integer written in decimal digits.`,
      notNumber: (t) => `"${t}" is not a number.`,
      range: (lo, hi) => `The value goes from ${lo} to ${hi}.`,
    },
    limits: {
      p: [EN.plain(LIMITS.p[0]), EN.plain(LIMITS.p[1])],
      n: [EN.int(LIMITS.n[0]), EN.int(LIMITS.n[1])],
      m: [EN.int(LIMITS.m[0]), EN.int(LIMITS.m[1])],
      seed: [EN.int(LIMITS.seed[0]), EN.int(LIMITS.seed[1])],
    },
    defaultBadge: `Initial values: p = ${EN.plain(DEFAULT_P)}, n = ${EN.int(DEFAULT_N)} systems, m = ${EN.int(DEFAULT_M)} attackers, seed ${DEFAULT_SEED}.`,
    customBadge: 'Values different from the initial ones.',
    restore: 'Restore the initial values',
    stale: 'While a field contains an error, the page uses its last valid value.',
    pending: 'Simulating with the new values: the following sections update as soon as it ends.',
    run: (s) => `Simulated ${EN.int(2 * s.params.m * s.params.n)} increments (${EN.int(s.params.m)} attackers, ${EN.int(s.params.n)} systems, 2 models) and computed the exact laws in ${EN.ms(s.ms)}.`,
  },
  trajectories: {
    intro: (shown, sample) => [
      `The animation shows the process while it happens. On the left the trajectories of the first ${EN.int(shown)} attackers, system after system, the first one in red; on the right the histogram of the values of ${EN.int(sample)} attackers at the current system, with the curve of the normal law of the same mean and standard deviation. The green band is mean ± 2 standard deviations, the dashed green line the mean and the dotted yellow lines the envelope of the law of the iterated logarithm, kμ ± σ√(2k ln ln k), in the units of the chosen quantity.`,
      'The model and the quantity can be chosen. With S_k the band widens like √k; with S_k/k it narrows around μ, and that is the law of large numbers; with S_k/√k its width stays constant, and that is the scale of the central limit theorem. The animation opens on the last system: Play starts it again from the first, One system moves one step.',
    ],
    modelLabel: 'Model',
    quantityLabel: 'Quantity',
    speedLabel: 'Speed',
    speeds: ['slow', 'normal', 'fast'],
    play: 'Play',
    pause: 'Pause',
    resume: 'Resume',
    step: 'One system',
    reset: 'From the start',
    end: 'To the end',
    legend: ['trajectories and histogram of the values', 'attacker 1', 'mean (dashed), mean ± 2σ (band), normal law (curve)', 'envelope of the iterated logarithm'],
    caption: (st, quantityName) =>
      st.k === 0
        ? `System 0 of ${EN.int(st.n)}: no system attacked yet.`
        : `System ${EN.int(st.k)} of ${EN.int(st.n)}. ${quantityName}: mean over the ${EN.int(st.sample)} attackers ${valueEn(st.mean, st.quantity)} (exact ${valueEn(st.theoryMean, st.quantity)}), standard deviation ${valueEn(st.sd, st.quantity)} (exact ${valueEn(st.theorySd, st.quantity)}); outside the band ${EN.pct(st.outside)}, against about 4.6% for a normal. Attacker 1: ${valueEn(st.first, st.quantity)}.`,
    after: [
      'Seen through S_k, the cloud of trajectories is a fan that opens like √k: for Rademacher around zero, for Bernoulli around the line kp, which at the scale of n makes the fan look like a single line. With S_k/k the same fan, divided by k, closes on μ: every attacker ends up penetrating a share of the systems close to p. With S_k/√k the trajectories stay in a band of constant width and the histogram on the right stops changing shape: it is the bell of the central limit theorem.',
      'The single trajectories, however, never calm down. They leave the band and come back, and keep doing so: the law of the iterated logarithm (Khinchin, 1924) says that their maxima grow a little faster than √k, like √(2k ln ln k), and that almost every trajectory comes close to its envelope infinitely often. The band describes the attackers at a fixed system, the envelope the path of each one.',
    ],
  },
  verify: {
    intro: 'Before trusting the simulation, its parts are compared with values computed elsewhere. The outputs of xoshiro128** and SplitMix64 and the scores of two attackers after 10,000 systems come from the reference C code of the two generators, compiled with gcc; the laws and special functions (normal, binomial, χ², Kolmogorov, arcsine, maximum of normals, Jarque-Bera) from SciPy 1.17.1.',
    summary: (ok, total) => `${ok} of ${total} checks passed.`,
    details: (n) => `Show the ${n} checks`,
    groups: { generator: 'Generator (reference C code)', functions: 'Laws and special functions (SciPy 1.17.1)' },
    cols: { check: 'Check', expected: 'Expected', result: 'Result' },
    ok: 'passed',
    failed: 'failed',
  },
  distributions: {
    intro: [
      'At fixed n the three quantities have the same shape: a histogram of S_n/n is a histogram of S_n with another axis. What sets them apart is how they change as n grows. To see it, the axis of S_n/n and that of S_n/√n stay the same for every n; the axis of S_n follows the distribution, which otherwise for small n would be a single bar at the edge.',
    ],
  },
  sweep: {
    intro: [
      'The slider chooses n among the points where the trajectories are observed; Play runs through them in order. The bars are the shares of the m attackers divided by the width of the bar, that is densities; the dashed red line is the exact law of S_n on the same bars and the green curve the normal with the same mean and variance. Every bar holds a whole number of possible values of S_n: for small n the values are few and can be seen one by one.',
    ],
    quantityLabel: 'Quantity',
    nLabel: (n) => `n = ${EN.int(n)}`,
    play: 'Play',
    pause: 'Pause',
    chart: (model, quantity, n, m) => `${model}: histogram of ${quantity} with n = ${EN.int(n)}, over the ${EN.int(m)} attackers`,
    legend: ['simulation', 'exact law of S_n', 'normal with the same mean and variance'],
    stats: (model, st, quantity) => `${model}, n = ${EN.int(st.n)}: mean ${valueEn(st.mean, quantity)} (exact ${valueEn(st.theoryMean, quantity)}), standard deviation ${valueEn(st.sd, quantity)} (exact ${valueEn(st.theorySd, quantity)}).`,
    after: [
      'With S_n the bells move and widen: for Bernoulli the mean np grows like n and the standard deviation only like √n, for Rademacher the mean stays 0 and the width grows like √n. With S_n/n the same bells narrow down to a single bar above μ: it is the convergence in probability of section 3. With S_n/√n the width stays the same: for Rademacher the bell stops moving and coincides with N(0, 1), for Bernoulli it slides to the right, because the mean p√n grows without limit.',
      'For small n none of the three looks normal: with n = 1 the law has only two values, and for Bernoulli with p far from 1/2 it is also skewed. The exact law and the simulation, instead, always agree, within the fluctuations of a sample of m attackers: it is the first check that the simulator implements the model.',
    ],
  },
  moments: {
    intro: 'The sample means and variances over the m attackers, next to the exact values. The mean of S_n/n and the variance of S_n/√n are enough: the others follow by multiplying or dividing by n.',
    tableTitle: 'Sample mean of S_n/n and sample variance of S_n/√n, exact values in brackets',
    cols: { n: 'n', bMean: 'Bernoulli: mean of S_n/n', bVar: 'Bernoulli: variance of S_n/√n', rMean: 'Rademacher: mean of S_n/n', rVar: 'Rademacher: variance of S_n/√n' },
    after: (s) => {
      const f = momentFacts(s);
      return [
        `The sample means of S_n/n are at most ${EN.num(f.meanZ, 1)} standard errors from μ, the standard error being σ/√(nm); the sample variances of S_n/√n differ from σ² by at most ${EN.pct(f.varRel)}, against a typical relative error of √(2/m) = ${EN.pct(f.expectedRel)}. These are the differences to expect from ${EN.int(s.params.m)} attackers, and the tests of section 3 check it at n = ${EN.int(s.params.n)}.`,
        'The columns already show the two theorems: the mean of S_n/n stays on μ for every n while its variance, σ²/n, falls towards zero; the variance of S_n/√n stays σ² for every n.',
      ];
    },
  },
  lln: {
    intro: [
      'The (weak) law of large numbers says that for every ε > 0 the probability P(|S_n/n - μ| > ε) goes to 0 as n grows: the average score converges in probability to μ. Here that probability is estimated by the share of attackers that after n systems are farther than ε from μ, and compared with the exact value, computed from the binomial law, and with two inequalities that bound it from above without knowing the law.',
    ],
  },
  convergence: {
    intro: 'The slider changes ε, and charts and table follow. The bands around the points are 95% Wilson intervals, which stay inside [0, 1] even when the observed share is 0.',
    epsilonLabel: (eps) => `Tolerance ε = ${EN.num(eps, 2)}`,
    chart: (model, eps) => `${model}: P(|S_n/n - μ| > ${EN.num(eps, 2)}) as n grows (logarithmic n axis)`,
    legend: ['simulation, with 95% Wilson interval', 'exact value', 'Chebyshev bound', 'Hoeffding bound'],
    tableTitle: (eps) => `P(|S_n/n - μ| > ${EN.num(eps, 2)}): share of attackers (95% interval) and exact value`,
    cols: { n: 'n', simulated: 'simulated (95%)', exact: 'exact' },
    after: (s, eps) => {
      const rows = llnRows(s, eps);
      const fB = llnFacts(rows.bernoulli);
      const fR = llnFacts(rows.rademacher);
      const N = EN.int(s.params.n);
      const from = (f, model) => `from n = ${EN.int(f.below)} on for ${model}`;
      let below;
      if (fB.below !== null && fR.below !== null) below = `falls below 1% ${from(fB, 'Bernoulli')} and ${from(fR, 'Rademacher')}`;
      else if (fB.below !== null) below = `falls below 1% ${from(fB, 'Bernoulli')}, while for Rademacher it does not within n = ${N}`;
      else if (fR.below !== null) below = `falls below 1% ${from(fR, 'Rademacher')}, while for Bernoulli it does not within n = ${N}`;
      else below = `does not fall below 1% within n = ${N} in either model`;
      const rise = fB.rises ? ['Bernoulli', fB.rises] : fR.rises ? ['Rademacher', fR.rises] : null;
      const sB = s.models.bernoulli.mom.sigma;
      const out = [
        `With ε = ${EN.num(eps, 2)} the exact probability ${below}. What matters is the ratio between ε and the standard deviation of one increment: the probability depends on n through ε√n/σ, and σ is ${EN.num(sB, 3)} for Bernoulli and 1 for Rademacher.`,
      ];
      if (rise) {
        out.push(`For small n the fall is not regular: for ${rise[0]} the probability goes from ${EN.num(rise[1].from.exact, 4)} at n = ${EN.int(rise[1].from.n)} to ${EN.num(rise[1].to.exact, 4)} at n = ${EN.int(rise[1].to.n)}. S_n/n only takes values ${rise[0] === 'Bernoulli' ? '1/n' : '2/n'} apart, and as long as this step is wider than ε what counts is how many values fall close to μ, not how large n is.`);
      }
      out.push(`The simulation follows the exact value as long as the probability is larger than 1/m = ${EN.small(1 / s.params.m)}; below it, almost always no attacker goes beyond ε, the observed share is 0 and only the upper end of the Wilson interval is left, ${EN.num(fB.last.interval[1], 4)}. This is the first sense in which m must be chosen suitably: estimating a probability P takes many more than 1/P attackers, and for large n what remains are the exact computation and the bounds of section 3.2.`);
      return out;
    },
  },
  bounds: {
    paras: (s, eps) => {
      const rows = llnRows(s, eps);
      const lb = rows.bernoulli[rows.bernoulli.length - 1];
      const lr = rows.rademacher[rows.rademacher.length - 1];
      const n0 = (M) => EN.int(Math.ceil(M.mom.variance / (eps * eps) - 1e-9));
      return [
        `Chebyshev’s inequality: P(|S_n/n - μ| > ε) ≤ σ²/(nε²). It is the weak law proved in one line, because Var(S_n/n) = σ²/n; it holds for any law with finite variance, but it decreases only like 1/n, and as long as n < σ²/ε² it exceeds 1 and says nothing: with ε = ${EN.num(eps, 2)} up to n = ${n0(s.models.bernoulli)} for Bernoulli and ${n0(s.models.rademacher)} for Rademacher.`,
        `Hoeffding’s inequality (1963): if the increments lie in an interval of width b - a, P(|S_n/n - μ| > ε) ≤ 2 exp(-2nε²/(b - a)²), with b - a = 1 for Bernoulli and 2 for Rademacher. It decreases exponentially, like the true probability: at n = ${EN.int(lb.n)} Chebyshev gives ${EN.small(lb.chebyshev)} and Hoeffding ${EN.small(lb.hoeffding)} for Bernoulli, against an exact value of ${EN.small(lb.exact)}; for Rademacher ${EN.small(lr.chebyshev)}, ${EN.small(lr.hoeffding)} and ${EN.small(lr.exact)}.`,
        'The normal approximates the same probability with 2(1 - Φ(ε√n/σ)): it is the central limit theorem used for the law of large numbers. At the centre of the distribution it is accurate, but in the tails its relative error grows, and there one needs the large deviation estimates (Cramér, Chernoff), which give the exact exponential rate. The two bounds always hold and the normal does not: that is the price of generality.',
      ];
    },
  },
  strong: {
    paras: [
      'The strong law of large numbers, by Borel (1909) for Bernoulli trials and by Kolmogorov (1933) in general, says more: with probability 1 the trajectory S_k/k of every attacker converges to μ. The weak law is a statement about the distribution of S_n/n at fixed n, the one of the histograms of section 2; the strong law is a statement about every trajectory, the one of the animation of section 1.4 with S_k/k: every attacker, sooner or later, enters the band μ ± ε and never leaves it again.',
      'The difference is not only formal. Convergence in probability would allow every trajectory to leave the band infinitely often, as long as more and more rarely; almost sure convergence rules that out. For a defender the first says that at a fixed time almost all attackers have a share of successes close to p, the second that each of them, from some system on, will stay close to p forever.',
    ],
  },
  variance: {
    intro: 'The variance of the three quantities, sample (dots) and exact (dashed), on logarithmic scales on both axes: a power law n^a becomes a line of slope a.',
    chart: (model) => `${model}: variance of S_n, S_n/n and S_n/√n as n grows (logarithmic scales)`,
    legend: ['S_n', 'S_n/n', 'S_n/√n', 'exact values (dashed)'],
    fitTitle: 'Slope of log Var against log n, by least squares',
    fitCols: { quantity: 'Quantity', bernoulli: 'Bernoulli', rademacher: 'Rademacher', theory: 'Theory' },
    after: (s) => {
      const fits = varianceFits(s);
      const slopes = (f) => `${EN.num(f.sum, 3)}, ${EN.num(f.mean, 3)} and ${EN.num(f.normalized, 3)} (± ${EN.num(f.error, 3)})`;
      return [
        `Var(S_n) = nσ² grows, Var(S_n/n) = σ²/n goes to zero, Var(S_n/√n) = σ² stays constant: it is the rule Var(cX) = c² Var(X) with c = 1, 1/n and 1/√n. The lines have slopes 1, -1 and 0; the estimated slopes are ${slopes(fits.bernoulli)} for Bernoulli and ${slopes(fits.rademacher)} for Rademacher.`,
        'The three estimates, however, are not three independent pieces of evidence: the sample variance of S_n/n is exactly that of S_n divided by n², so the three slopes differ by exactly 2 and 1, and the information is a single one, Var(S_n) proportional to n. The error of the slope is the least squares one, which treats the points as independent; here they are not, because at every n the attackers are the same, and the true uncertainty is somewhat larger.',
        'With any normalization n^α, Var(S_n/n^α) = σ² n^(1 - 2α): it goes to infinity for α < 1/2, to zero for α > 1/2, and stays finite and positive only for α = 1/2. √n is the only scale at which the variability of S_n stays visible, and it is the scale of the central limit theorem.',
      ];
    },
  },
  clt: {
    intro: [
      'The central limit theorem (Lindeberg and Lévy, for i.i.d. increments with finite variance) says that (S_n - nμ)/(σ√n) converges in distribution to N(0, 1): for every x, P((S_n - nμ)/(σ√n) ≤ x) → Φ(x). In the Rademacher model μ = 0 and σ = 1, so the standardized quantity is exactly S_n/√n, the case the assignment asks to study. In the Bernoulli model S_n/√n does not converge (section 5.3): what converges is the centred and scaled version, (S_n - np)/√(np(1 - p)).',
    ],
  },
  normal: {
    intro: 'Histogram and quantile-quantile plot of the standardized quantity, for every n. In the quantile-quantile plot every point compares a quantile of the simulation with the same quantile of N(0, 1): if the two laws coincide, the points lie on the diagonal. For small n the points form steps, because S_n has few values.',
    modelLabel: 'Quantity',
    models: { rademacher: 'Rademacher: S_n/√n', bernoulli: 'Bernoulli: (S_n - np)/√(np(1 - p))' },
    nLabel: (n) => `n = ${EN.int(n)}`,
    histChart: (label, n) => `${label} with n = ${EN.int(n)}: histogram and density of N(0, 1)`,
    qqChart: (label, n) => `${label} with n = ${EN.int(n)}: simulated quantiles against quantiles of N(0, 1)`,
    legend: ['simulation', 'exact law', 'N(0, 1)'],
    qqLegend: ['simulated quantiles', 'diagonal: the two laws coincide'],
    stats: (sh) => `n = ${EN.int(sh.n)}: skewness ${EN.num(sh.skewness, 3)} (exact ${EN.num(sh.theorySkewness, 3)}), excess kurtosis ${EN.num(sh.excess, 3)} (exact ${EN.num(sh.theoryExcess, 3)}); Kolmogorov distance from the normal: simulated ${EN.num(sh.ks, 4)}, exact ${EN.num(sh.distance, 4)}, exact with the continuity correction ${EN.small(sh.distanceCorrected)}.`,
    after: [
      'Two things can be seen. First: even for Rademacher, which is symmetric, the law of S_n/√n for small n is a staircase, because S_n has only n + 1 values, 2/√n apart after standardization. For even n the distribution function jumps by P(S_n = 0) ≈ √(2/(πn)) at zero, and no continuous function can stay closer to it than half the jump, about 1/√(2πn).',
      'Second: the convergence does not depend on the shape of the law of the increments. Only two values, discrete, in one case skewed: it is enough that the variance is finite, and the standardized sum becomes normal. This is what makes the normal the reference law for any aggregate score.',
    ],
  },
  speed: {
    intro: `How close to the normal is the standardized sum, for every n? The Kolmogorov distance sup_x |F_n(x) - Φ(x)| is computed exactly from the binomial law (lines) and estimated from the simulation (dots). The Berry-Esseen theorem bounds it by C E|X - μ|³/(σ³√n), with C ≤ ${EN.num(BERRY_ESSEEN_C, 4)} (Shevtsova, 2011).`,
    chart: (model) => `${model}: Kolmogorov distance from the normal as n grows (logarithmic scales)`,
    legend: ['exact', 'exact, with the continuity correction', 'Berry-Esseen bound', 'simulated (Kolmogorov-Smirnov)', 'noise of the simulation, 0.87/√m'],
    after: (s) => {
      const f = speedFacts(s);
      const p = EN.plain(s.params.p);
      return [
        `For Rademacher the exact distance is ${EN.num(f.r100.distance, 4)} at n = ${EN.int(f.n100)} and ${EN.small(f.rN.distance)} at n = ${EN.int(f.N)}: it decreases like 1/√n, and almost exactly like 1/√(2πn) ≈ 0.399/√n, half the jump at zero. The Berry-Esseen bound, ${EN.num(BERRY_ESSEEN_C, 4)}/√n, lies above it by only ${EN.pct(f.ratio, 0)}: for a two-valued law the theorem is nearly optimal. With the continuity correction, that is comparing the normal halfway between two possible values, the distance falls to ${EN.small(f.rN.corrected)}, an order 1/n: for sums of Rademacher increments the error of the normal is almost entirely due to the lattice.`,
        f.symmetric
          ? `With p = ${p} the Bernoulli binomial is symmetric too: the distance is ${EN.num(f.b100.distance, 4)} at n = ${EN.int(f.n100)}, and with the continuity correction it falls to ${EN.small(f.b100.corrected)}, as for Rademacher.`
          : `For Bernoulli with p = ${p} the distance is larger (${EN.num(f.b100.distance, 4)} at n = ${EN.int(f.n100)}), because to the lattice it adds the skewness of the binomial, (1 - 2p)/√(np(1 - p)), which the continuity correction does not remove: corrected, the distance is ${EN.num(f.b100.corrected, 4)}, still of order 1/√n.`,
        `The simulated distance follows the exact one as long as the latter exceeds the noise of the simulation, about 0.87/√m = ${EN.num(f.noise, 4)} with m = ${EN.int(s.params.m)}; below it, the dots flatten on the noise. This is the second sense in which m must be chosen suitably: seeing a difference d between two laws takes at least (1/d)² attackers, about ${EN.int(f.need)} for the exact distance at n = ${EN.int(f.N)}.`,
      ];
    },
  },
  bernoulli: {
    intro: 'For Bernoulli S_n/√n has mean p√n and variance p(1 - p): the variance stays finite, as for Rademacher, but the mean grows without limit, and the law keeps sliding to the right (section 2.1). The central limit theorem applies to the centred quantity: (S_n - np)/√n converges to N(0, p(1 - p)), and (S_n - np)/√(np(1 - p)) to N(0, 1), the de Moivre-Laplace theorem.',
    tableTitle: 'Bernoulli: the drift of S_n/√n and the fading skewness',
    cols: { n: 'n', mean: 'E[S_n/√n] = p√n', sampleMean: 'Simulated mean', skewness: 'Exact skewness', sampleSkewness: 'Simulated skewness', distance: 'Exact distance from the normal' },
    after: (s) => {
      const M = s.models.bernoulli;
      const N = s.params.n;
      return [
        `The skewness of the binomial, (1 - 2p)/√(np(1 - p)), goes to zero like 1/√n: with p = ${EN.plain(s.params.p)} it is ${EN.num(M.mom.skewness / Math.sqrt(SMALL_N), 3)} at n = ${SMALL_N} and ${EN.num(M.mom.skewness / Math.sqrt(N), 4)} at n = ${EN.int(N)}. When p is small and np stays moderate the normal approximates badly, and the binomial rather resembles the Poisson law of mean np (Poisson, 1837): with systems very hard to penetrate, the number of successes of an attacker stays small and skewed even for large n. The rule of thumb np(1 - p) ≥ 10, for using the normal, here asks for n ≥ ${EN.int(normalRule(M.mom))}.`,
        'For the interpretation the difference between the two models matters: in the Bernoulli model the drift p√n of S_n/√n is the score the attacker accumulates on average, and it is what counts; the fluctuations around it, of order 1, are the noise. In the Rademacher model there is no drift, and the fluctuations are everything.',
      ];
    },
  },
  interpretation: {
    intro: ['Back to the attackers and the systems: what changes with more systems, what with more attackers, and how the aggregate score of all of them behaves.'],
  },
  size: {
    paras: (s) => {
      const f = interpretationFacts(s);
      const W = f.walk;
      return [
        `More systems make the share predictable, not the total. In the Bernoulli model an attacker penetrates np systems on average, with a standard deviation of √(np(1 - p)): with n = ${EN.int(f.N)} they are ${EN.num(f.np, 0)} ± ${EN.num(f.sd, 1)}. In absolute terms the uncertainty grows (from ${EN.num(f.sd100, 1)} systems at n = ${EN.int(f.n100)} to ${EN.num(f.sd, 1)} at n = ${EN.int(f.N)}), in proportion it shrinks (from ${EN.pct(f.rel100)} to ${EN.pct(f.relN)} of the mean). For whoever defends a large infrastructure this is half good news: the share of compromised systems is almost certain, their number is not.`,
        `In the Rademacher model the mean is zero, but the trajectories do not stay close to zero. The typical value of |S_n| is √(2n/π) ≈ ${EN.num(f.typical, 1)}, and the maximum reached along the way has on average the same order: ${EN.num(W.maximumExact, 1)} exactly, by the reflection principle, and ${EN.num(W.maximum, 1)} in the simulation. The walk returns to zero on average only ${EN.num(W.zerosExact, 1)} times in ${EN.int(f.N)} steps (${EN.num(W.zeros, 1)} in the simulation): ties are rare, and in proportion they become rarer and rarer, like √n over n.`,
        `The arcsine law (Lévy, 1939) says how much time an attacker spends ahead. Intuition would say about half; instead the share of time ahead has density 1/(π√(x(1 - x))), high near 0 and 1 and low in the middle: whoever gets ahead tends to stay ahead for long. Among the simulated attackers, ${EN.pct(W.extreme)} stayed on the same side for more than 90% of the first ${EN.int(W.even)} systems (exact ${EN.pct(W.extremeExact)}, limit law ${EN.pct(W.extremeLimit)}), against the 20% a uniform share would give.`,
      ];
    },
    arcsineChart: (even, m) => `Rademacher: share of the first ${EN.int(even)} systems in which the attacker is ahead, over the ${EN.int(m)} attackers`,
    arcsineLegend: ['simulation', 'exact law (Feller)', 'arcsine density'],
    after: ['It is the least intuitive lesson of this section: in an even contest, an attacker ahead for thousands of systems in a row is no sign of skill, it is the normal behaviour of chance. The same holds for a defender who keeps "winning".'],
  },
  attackers: {
    intro: 'The number of attackers does not change the law of the score of each one: it changes how well that law is estimated (sections 3 and 5) and, above all, what the best one does. To see it, the m attackers of the Bernoulli model are split into groups of b, and in every group the maximum of the standardized final scores, (S_n - np)/√(np(1 - p)), is taken.',
    bestChart: (n) => `Bernoulli, n = ${EN.int(n)}: the best standardized score in a group of b attackers (logarithmic b axis)`,
    bestLegend: ['simulation: mean over the groups, 95% interval', 'exact value (binomial)', 'maximum of b standard normals', '√(2 ln b)'],
    probabilityChart: (n) => `Bernoulli, n = ${EN.int(n)}: at least one of b attackers more than 3 standard deviations above the mean, and systems penetrated by at least one of the first b`,
    probabilityLegend: ['at least one beyond +3σ: simulation', 'at least one beyond +3σ: exact', 'systems penetrated: simulation', 'systems penetrated: exact'],
    after: (s) => {
      const f = interpretationFacts(s);
      const simulated = f.row5 && f.row20 ? ` (simulated: ${EN.pct(f.row5.coverage)} and ${EN.pct(f.row20.coverage)})` : '';
      return [
        `The best of b attackers moves away from the mean slowly, like √(2 ln b): ${EN.num(f.best10, 2)} standard deviations with 10 attackers, ${EN.num(f.best100, 2)} with 100 and ${EN.num(f.best1000, 2)} with 1,000, by the exact law. For every factor 10 of extra attackers the first gains about ${EN.num((f.best1000 - f.best10) / 2, 2)} standard deviations: doubling the attackers doubles nothing.`,
        `Events that are rare for one attacker become likely for many. Going 3 standard deviations above the mean happens to a single attacker with probability ${EN.num(f.tail, 4)}, but to at least one in 100 with probability ${EN.num(f.atLeast100, 3)} and to at least one in 1,000 with ${EN.num(f.atLeast1000, 3)}. For a defender the worst case is what counts, and the worst case grows with m even though no attacker is better than the others.`,
        `The same formula gives the coverage of the systems: a system resists one attacker with probability 1 - p and b independent attackers with probability (1 - p)^b, so the share of systems penetrated by at least one of the first b is 1 - (1 - p)^b: ${EN.pct(f.cover5)} with 5 attackers and ${EN.pct(f.cover20)} with 20${simulated}. With p = ${EN.plain(f.p)}, ${EN.int(f.b95)} independent attackers are enough to reach 95% of the systems.`,
      ];
    },
  },
  aggregate: {
    paras: (s) => {
      const f = interpretationFacts(s);
      const A = f.aggregate;
      return [
        `The aggregate score of all attackers on all systems, T, the sum of all the X, is a sum of mn i.i.d. increments, and the same theorems hold with mn in place of n. For Bernoulli T has mean mnp = ${EN.int(A.expected)} and standard deviation √(mnp(1 - p)) = ${EN.num(A.sd, 1)}; the simulation gives ${EN.int(A.total)} (z = ${EN.num(A.z, 2)}). Mean and variance depend on n and m only through their product: 10 attackers on 1,000 systems and 1,000 attackers on 10 systems produce on average the same aggregate score.`,
        `The product, however, does not tell everything: the same m × n table of outcomes can be read by rows or by columns. By row, that is by attacker, the sum is S_n; by column, that is by system, it is the number of attackers that penetrated it, K_i ~ Bin(m, p). The theorems hold along the columns too, with m in place of n: per system the mean is mp = ${EN.num(A.systemMean, 1)} and the variance mp(1 - p) = ${EN.num(A.systemVariance, 1)}; over the ${EN.int(f.N)} simulated systems they are ${EN.num(A.perSystemMean, 1)} and ${EN.num(A.perSystemVariance, 1)}, and the χ² test ${f.systems.verdict === 'reject' ? 'rejects' : 'does not reject'} the binomial law (p = ${EN.pval(f.systems.pValue)}).`,
      ];
    },
    systemsChart: (n, m) => `Bernoulli: number of attackers, out of ${EN.int(m)}, that penetrated each of the ${EN.int(n)} systems`,
    systemsLegend: ['simulation', 'exact law Bin(m, p)', 'normal with the same mean and variance'],
    after: ['In short, n and m play symmetric roles in the total score and different roles in the questions that matter: n decides how predictable the share of successes of each attacker is, m how extreme the best one is and how many systems are reached by somebody.'],
  },
  limits: {
    paras: [
      'The i.i.d. model is a first approximation, useful precisely because it lets us compute everything. In reality its assumptions fail in at least four ways, and each one changes a different conclusion.',
      'Different systems. If the penetration probability depends on the system, p_i, the increments stay independent but are no longer identically distributed. The law of large numbers still holds, for the mean of the p_i, and so does the central limit theorem in the versions of Lyapunov (1901) and Lindeberg (1922), as long as no system dominates the variance: the conclusions of sections 3, 4 and 5 remain, with μ and σ² averaged over the systems.',
      'Shared vulnerabilities. If many systems share a vulnerability (the same software, the same configuration), the outcomes are correlated. With a correlation ρ between the increments, Var(S_n) = nσ²(1 + (n - 1)ρ), which grows like n², and S_n/n no longer concentrates on μ: the law of large numbers fails. It is the worst case for a defender, because diversification stops reducing the risk.',
      'Attackers that learn. If every success makes the next one easier, for example because access already obtained opens the way to lateral movement, the increments are dependent and the process resembles a Pólya urn: S_n/n still converges, but to a random limit that depends on the first steps, and two identical attackers can end with very different shares of success.',
      'Heavy-tailed scores. If a single system can be worth a huge score (a domain controller compared with a printer) and the variance is infinite, the classical central limit theorem fails: the sum is dominated by the largest values and tends to a stable law, not a normal one. In all these cases simulation remains the right tool: the model changes, not the method.',
    ],
  },
  stats: {
    verdict: { reject: 'H₀ rejected', notReject: 'H₀ not rejected' },
    expected: { reject: 'expected: rejection', notReject: 'expected: no rejection', either: 'depends on the power of the test' },
    testLine: testLineEn,
    groups: { sim: 'Generator', lln: 'Large numbers', clt: 'Central limit', walk: 'Random walk' },
    labels: {
      sim: {
        bernoulliPairs: 'Bernoulli: consecutive increments are independent (χ², 2 × 2)',
        rademacherPairs: 'Rademacher: consecutive increments are independent (χ², 2 × 2)',
        bernoulliSystems: 'Bernoulli: the hits per system follow Bin(m, p) (χ²)',
      },
      lln: {
        bernoulliMean: 'Bernoulli: the mean of S_n/n is p (z)',
        rademacherMean: 'Rademacher: the mean of S_n/n is 0 (z)',
        bernoulliVariance: 'Bernoulli: the variance of S_n is np(1 - p) (z, large samples)',
        rademacherVariance: 'Rademacher: the variance of S_n is n (z, large samples)',
      },
      clt: {
        bernoulliExact: 'Bernoulli: S_n follows its exact law Bin(n, p) (χ²)',
        rademacherExact: 'Rademacher: S_n follows its exact law 2 Bin(n, 1/2) - n (χ²)',
        rademacherNormal: 'Rademacher: S_n/√n is N(0, 1), with continuity correction (Kolmogorov-Smirnov)',
        rademacherSmall: `Rademacher: S_${SMALL_N}/√${SMALL_N} is N(0, 1), without correction (Kolmogorov-Smirnov)`,
        rademacherJb: 'Rademacher: S_n/√n has the skewness and kurtosis of a normal (Jarque-Bera)',
        bernoulliJb: 'Bernoulli: the standardized S_n has the skewness and kurtosis of a normal (Jarque-Bera)',
        bernoulliSmall: `Bernoulli: the standardized S_${SMALL_N} has the skewness and kurtosis of a normal (Jarque-Bera)`,
      },
      walk: { arcsine: 'Rademacher: the time ahead follows Feller’s arcsine law (χ²)' },
    },
  },
  tests: {
    intro: (s) => `The hypothesis tests of the page, at significance level α = ${EN.num(SIGNIFICANCE, 2)}. The generator is checked through consecutive increments and hits per system; the law of large numbers through the mean and variance at n = ${EN.int(s.params.n)}; the central limit theorem through the exact law, the normal and the moments; the walk through the arcsine law. Two tests, at n = ${SMALL_N}, have a false null hypothesis on purpose: the normal is not yet a good approximation, and their rejection is expected.`,
    cols: { subject: 'Subject', hypothesis: 'Null hypothesis H₀', p: 'p-value', verdict: 'Outcome', expected: 'Reading' },
    after: (sum, s) => {
      const out = [`${sum.rejected} of ${sum.count} tests reject the null hypothesis, ${sum.asExpected === sum.count ? 'all as expected' : `${sum.asExpected} of ${sum.count} as expected`}.`];
      const expectedFalse = EN.num(sum.nulls * SIGNIFICANCE, 2);
      const which = sum.falseRejections.map((t) => EN.pval(t.result.pValue)).join(', ');
      out.push(
        `Among the ${sum.nulls} tests with a true null hypothesis (or false by differences too small for m attackers to see), at level ${EN.num(SIGNIFICANCE, 2)} one expects on average ${expectedFalse} rejections by pure chance: ${sum.falseRejections.length === 0 ? 'here there are none' : `here there ${sum.falseRejections.length === 1 ? 'is one' : `are ${sum.falseRejections.length}`} (p = ${which})`}. Holm’s correction for multiple testing, which keeps below 5% the probability of even a single wrong rejection, compares the smallest p-value with ${EN.num(SIGNIFICANCE, 2)}/${sum.nulls} = ${EN.num(sum.holmThreshold, 4)}, the next with ${EN.num(SIGNIFICANCE, 2)}/${sum.nulls - 1} and so on: ${sum.holm === 0 ? 'no rejection survives' : `${sum.holm === 1 ? 'one rejection survives' : `${sum.holm} rejections survive`}, to be looked at as a possible flaw`}.`,
      );
      const small = s.models.rademacher.tests.smallKs;
      out.push(`One remark holds for all of them: for the same difference, the p-value depends on m. With ${EN.int(s.params.m)} attackers the Kolmogorov-Smirnov test sees distances from the normal of a few hundredths, and rejects the normality of S_${SMALL_N}/√${SMALL_N} with p = ${EN.pval(small.pValue)}; with fifty attackers the same distance, ${EN.num(small.D, 3)}, would go unnoticed. Significance and size of a difference are two different questions.`);
      return out;
    },
  },
  history: {
    intro: 'From Bernoulli trials to the generator of this page, the ideas used in the homework in chronological order.',
    legend: { task: 'used in this page', context: 'context' },
    events: [
      { year: '1654', task: false, title: 'Pascal and Fermat', text: 'The problem of points, how to divide the stakes of an interrupted game: the correspondence between Pascal and Fermat founds the calculus of probability.' },
      { year: '1713', task: true, title: 'Jacob Bernoulli', text: 'In the Ars Conjectandi, published after his death, the "golden theorem": the frequency of successes in independent trials approaches their probability. It is the first law of large numbers, and trials with two outcomes bear his name.' },
      { year: '1733', task: true, title: 'de Moivre', text: 'Approximates the binomial with p = 1/2 by the curve now called normal, then publishes it again in The Doctrine of Chances (1738): the first central limit theorem, precisely for sums of ±1 increments.' },
      { year: '1812', task: true, title: 'Laplace', text: 'In the Théorie analytique des probabilités extends the result to any p, the de Moivre-Laplace theorem of section 5.3, and to more general sums.' },
      { year: '1837', task: true, title: 'Poisson', text: 'In the Recherches sur la probabilité des jugements names the law of large numbers and derives the law of rare events, the approximation of the binomial when p is small.' },
      { year: '1853-1867', task: true, title: 'Bienaymé and Chebyshev', text: 'The inequality P(|X - μ| ≥ kσ) ≤ 1/k² and the proof of the weak law for independent variables with bounded variances: the bound of section 3.2.' },
      { year: '1889', task: true, title: 'Galton', text: 'In Natural Inheritance describes the quincunx, the board of pins he had built years before: at every row a ball bounces right or left, so every ball performs a Rademacher walk, and the heap at the bottom is the bell.' },
      { year: '1900-1901', task: true, title: 'Lyapunov', text: 'Proves the central limit theorem for independent non-identical variables, under a condition on the moments, with characteristic functions.' },
      { year: '1905', task: false, title: 'Pearson', text: 'In a letter to Nature asks for the law of the distance covered by someone taking n steps in random directions: the name random walk is born.' },
      { year: '1909', task: true, title: 'Borel', text: 'The strong law of large numbers for Bernoulli trials: almost every real number has binary digits with frequency 1/2.' },
      { year: '1920-1921', task: true, title: 'Pólya', text: 'Calls the result of de Moivre and Laplace the "central limit theorem" (1920), and proves that the simple random walk returns to the origin with probability 1 in one and two dimensions, not in three (1921).' },
      { year: '1922', task: false, title: 'Lindeberg', text: 'The most general condition for the central limit theorem with independent non-identical increments, which Feller (1935) will show to be also necessary.' },
      { year: '1924', task: true, title: 'Khinchin', text: 'The law of the iterated logarithm for Bernoulli trials: the oscillations of S_n - np reach √(2np(1 - p) ln ln n), and no further. It is the envelope of the animation.' },
      { year: '1929-1933', task: true, title: 'Kolmogorov', text: 'Extends the law of the iterated logarithm (1929); in 1933 founds probability on axioms, proves the strong law in general and introduces the distance between distribution functions on which the Kolmogorov-Smirnov test rests.' },
      { year: '1939', task: true, title: 'Lévy', text: 'The arcsine laws for Brownian motion. The version for the Rademacher walk, with the exact law of section 6.1, is in Feller’s book (1950).' },
      { year: '1941-1942', task: true, title: 'Berry and Esseen', text: 'Independently, the bound C ρ/(σ³√n) on the distance between the standardized sum and the normal: the speed of the central limit theorem.' },
      { year: '1949', task: true, title: 'Metropolis and Ulam', text: 'The Monte Carlo Method: estimating probabilities and expected values by simulating many samples, the method of this page.' },
      { year: '1963', task: true, title: 'Hoeffding', text: 'The exponential inequality for sums of bounded variables.' },
      { year: '1980', task: true, title: 'Jarque and Bera', text: 'The normality test based on skewness and kurtosis.' },
      { year: '1997', task: false, title: 'Jonsson and Olovsson', text: 'A quantitative model of the intrusion process built on the behaviour of real attackers: the penetration process as a statistical object.' },
      { year: '2011', task: true, title: 'Shevtsova', text: `Lowers the Berry-Esseen constant for identically distributed summands to ${EN.num(BERRY_ESSEEN_C, 4)}, the value of section 5.2.` },
      { year: '2014-2018', task: true, title: 'SplitMix and xoshiro', text: 'Steele, Lea and Flood publish SplitMix (2014), Blackman and Vigna the xoshiro generators (2018): they are the random numbers of this page.' },
    ],
    after: 'Read in order, the history of these theorems is the structure of this page: first the law of large numbers for Bernoulli trials (1713), then the normal for sums of ±1 (1733), then generality (Laplace, Chebyshev, Lyapunov, Lindeberg), the trajectories (Borel, Khinchin, Lévy) and the speed (Berry and Esseen). Simulation came last and changed the way they are used: the theorems say what to expect, the simulation checks whether the model is the right one.',
  },
  conclusion: (s) => {
    if (!s) {
      return [
        'The three quantities of the assignment are the same variable on three scales, and the three scales tell three stories: S_n grows, S_n/n concentrates on μ (law of large numbers), S_n/√n settles and, for Rademacher, becomes normal (central limit theorem).',
      ];
    }
    const rows = llnRows(s, 0.05);
    const R = s.models.rademacher;
    const f = interpretationFacts(s);
    const first = rows.rademacher.find((r) => r.n >= 100) || rows.rademacher[0];
    const lastRow = rows.rademacher[rows.rademacher.length - 1];
    const d = lastOf(R).distance;
    return [
      `The three quantities of the assignment are the same variable on three scales, and the three scales tell three stories. S_n grows: for Bernoulli like np, with fluctuations of order √n, for Rademacher it stays centred on zero but widens like √n. S_n/n concentrates: for Rademacher the probability of being farther than 0.05 from μ falls from ${EN.num(first.exact, 3)} at n = ${EN.int(first.n)} to ${EN.small(lastRow.exact)} at n = ${EN.int(lastRow.n)}, the law of large numbers. S_n/√n settles: its variance stays σ², and for Rademacher its law converges to N(0, 1), with a Kolmogorov distance of ${EN.small(d)} at n = ${EN.int(s.params.n)}, the central limit theorem.`,
      'The simulation agrees with the theory within its error: means, variances and exact laws are not rejected, and the expected rejections are those at n = 10, where the normal is not yet a good approximation. Two things, however, the simulation cannot see on its own, and the exact computations are needed: probabilities smaller than 1/m and distances smaller than 1/√m. That is the precise sense in which m must be chosen suitably.',
      `For attackers and systems the lesson is twofold. With more systems the share of successes of each attacker becomes predictable, while the absolute number of compromised systems stays uncertain by √n. With more attackers nobody becomes better, but the best one moves away from the mean like √(2 ln m), rare events become likely and almost all systems are reached by somebody: ${EN.pct(f.cover20)} of the systems already with 20 independent attackers.`,
      'The model is deliberately simple: equal systems, independent outcomes, attackers that do not learn. Its most robust conclusions, the concentration of the frequencies, the √n scale and the growth of the worst case with m, survive different systems; they fail with shared vulnerabilities and attackers that learn, and there simulation remains the tool to find out what changes.',
    ];
  },
  modelNames: { bernoulli: 'Bernoulli', rademacher: 'Rademacher' },
  quantityNames: { sum: 'S_n', mean: 'S_n/n', normalized: 'S_n/√n' },
  trajectoryNames: { sum: 'S_k', mean: 'S_k/k', normalized: 'S_k/√k' },
  tips: {
    bin: (from, to, share, prob, normal) => {
      const d = edgeDigits(from, to);
      return `From ${EN.num(from, d)} to ${EN.num(to, d)}: simulation ${EN.pct(share, 2)}${prob === null ? '' : `, exact law ${EN.pct(prob, 2)}`}${normal === null ? '' : `, normal ${EN.pct(normal, 2)}`}`;
    },
    share: (from, to, share, prob, limit) => `Ahead between ${EN.pct(from, 1)} and ${EN.pct(to, 1)} of the time: simulation ${EN.pct(share, 2)}, exact law ${EN.pct(prob, 2)}, arcsine ${EN.pct(limit, 2)}`,
    lln: (r) => `n = ${EN.int(r.n)}: simulated ${EN.num(r.rate, 4)} (95%: ${EN.num(r.interval[0], 4)}-${EN.num(r.interval[1], 4)}), exact ${EN.small(r.exact)}, Chebyshev ${EN.small(r.chebyshev)}, Hoeffding ${EN.small(r.hoeffding)}`,
    variance: (n, pairs) => `n = ${EN.int(n)}: ${['S_n', 'S_n/n', 'S_n/√n'].map((q, i) => `Var(${q}) ${EN.small(pairs[i][0])} (exact ${EN.small(pairs[i][1])})`).join(', ')}`,
    distance: (n, d, dc, bound, ks) => `n = ${EN.int(n)}: exact ${EN.small(d)}, corrected ${EN.small(dc)}, Berry-Esseen ${EN.small(bound)}${ks === null ? '' : `, simulated ${EN.num(ks, 4)}`}`,
    qq: (a, b) => `Quantile of N(0, 1) ${EN.num(a, 2)}: simulated ${EN.num(b, 2)}`,
    best: (r) => `b = ${EN.int(r.b)} (${EN.int(r.groups)} groups): simulated ${EN.num(r.mean, 2)} ± ${EN.num(1.96 * r.error, 2)}, exact ${EN.num(r.exact, 2)}, normal ${EN.num(r.normal, 2)}`,
    probability: (r) => `b = ${EN.int(r.b)}: at least one beyond +3σ ${EN.pct(r.beyond)} (exact ${EN.pct(r.beyondExact)}); systems penetrated ${EN.pct(r.coverage)} (exact ${EN.pct(r.coverageExact)})`,
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: after extracting the archive it opens with a double click on index.html, even offline, with the same simulations and animations. With node homework3.js it prints the tables, the tests and a histogram in the terminal; --p, --n, --m, --seed and --epsilon change the parameters.',
    contents: 'Contents: index.html, style.css, homework3.js (generator, simulation, statistics, charts and animation), app.js (interface and texts), README.txt.',
    zip: 'Download homework3',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'The penetration score of m attackers on n systems: the law of large numbers and the central limit theorem.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
    noscript: 'This program needs JavaScript.',
  },
};

const HW3_TEXTS = { it, en };

return { originalAssignment, HW3_TEXTS };
})();

(function () {
'use strict';

// src/pages/statistics/hw3/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework3.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Da file:// i worker non partono: la simulazione gira qui, a fette di pochi
// millisecondi, e la pagina resta reattiva mentre i numeri arrivano; intanto
// l'animazione delle traiettorie, che non ne ha bisogno, funziona gia'.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
const hw = Homework3;
const view = view$;
const { HW3_TEXTS, originalAssignment } = texts$;

const HEADINGS = ['h2', 'h3', 'h4'];
const LANGUAGES = ['it', 'en'];

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#161616',
    text: '#d6d6d6',
    grid: '#262626',
    bars: '#7986cb',
    reference: '#ff6b81',
    highlight: '#ff6b81',
    series: ['#7986cb', '#ff6b81', '#4fb39c', '#ffca28', '#ba68c8', '#4dd0e1', '#9e9e9e'],
  },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const palette = () => (darkQuery.matches ? PALETTES.dark : PALETTES.light);

// I campi non devono passare per correttori o completamenti.
const PRIVATE_FIELD = {
  autocomplete: 'off',
  autocorrect: 'off',
  autocapitalize: 'none',
  spellcheck: 'false',
  'data-gramm': 'false',
  'data-lpignore': 'true',
};

// ---------------------------------------------------------------------------
// Stato
// ---------------------------------------------------------------------------

// Si apre sempre in inglese, come la pagina sul sito; IT / EN cambia lingua
// finche' la pagina resta aperta, senza salvare la scelta. Il sito, aprendo
// la versione online, passa nell'indirizzo la lingua che si stava leggendo.
function initialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  return LANGUAGES.includes(fromUrl) ? fromUrl : 'en';
}

const state = {
  lang: initialLanguage(),
  fields: { ...view.DEFAULT_INPUTS },
  // l'ultimo valore valido di ogni campo, e quelli dell'ultima simulazione partita
  params: { ...view.DEFAULT_PARAMS },
  target: { ...view.DEFAULT_PARAMS },
  epsilon: hw.DEFAULT_EPSILON,
  sweep: { quantity: 'mean', g: null, playing: false },
  normal: { model: 'rademacher', g: null, playing: false },
  anim: { model: 'rademacher', quantity: 'sum', speed: 1 },
};
let text = HW3_TEXTS[state.lang];
const regions = {};
const controls = { fields: {} };
const timers = { compute: null, sweep: null, normal: null };

// I risultati gia' calcolati (gli ultimi), quelli mostrati e la simulazione in corso
const results = new Map();
const computation = { shown: null, error: null, running: null };
let animation = null;

// ---------------------------------------------------------------------------
// DOM: un aiutante minimo, i grafici e il loro ridisegno
// ---------------------------------------------------------------------------

/** h('p', { class: 'note', text: '...' }, child, ...): text always via textContent. */
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'style') Object.assign(el.style, value);
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

const paras = (list) => list.filter(Boolean).map((t) => h('p', { text: t }));
const title = (id, level, label) => h(HEADINGS[level], { id, tabindex: -1, class: 'anchor', text: label });
const subtitle = (label) => h('p', { class: 'table-title' }, h('strong', { text: label }));
const pending = () => (computation.error ? h('p', { class: 'note', text: text.ui.error(computation.error) }) : h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad' }, h('strong', { text: label }));
const formulas = (content, label = null) => [label && subtitle(label), h('pre', { text: content })];

// The width of every chart comes from the ResizeObserver, measured after
// layout; the height is set at once, the drawing happens a few
// milliseconds per frame.
const charts = new Map(); // canvas -> { draw, data, width, detach }
const resizer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const canvas = entry.target;
    const chart = charts.get(canvas);
    const width = Math.round(entry.contentRect.width);
    if (!chart || width <= 0 || width === chart.width) continue;
    chart.width = width;
    canvas.style.height = `${hw.chartHeight(chart.draw, chart.data, width)}px`;
    view.scheduleFrameJob(() => {
      if (charts.get(canvas) === chart && chart.width === width) chart.draw(canvas, { ...chart.data, width }, palette());
    });
  }
});

/** The legend of a chart, in the page: { label, color?, dashed? }. */
function legend(items) {
  const pal = palette();
  return h(
    'ul',
    { class: 'series-legend' },
    items.map((item, i) => {
      const color = pal.series[item.color ?? i];
      return h('li', null, h('span', { class: item.dashed ? 'is-dashed' : null, 'aria-hidden': 'true', style: { borderColor: color, backgroundColor: item.dashed ? 'transparent' : color } }), item.label);
    }),
  );
}

function figure(caption, draw, data, { wide = false, tip = null, items = null, note = null } = {}) {
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': caption });
  const fig = h('figure', { class: wide ? 'figure wide' : 'figure' }, canvas, items && legend(items), note && h('p', { class: 'figure-note', text: note }), h('figcaption', { text: caption }));
  const detach = tip ? hw.attachChartTooltip(canvas, { draw, data, describe: tip }) : null;
  charts.set(canvas, { draw, data, width: -1, detach });
  resizer.observe(canvas);
  return fig;
}

/** Replaces the content of a region, releasing the charts it contained and their labels. */
function fill(region, ...nodes) {
  for (const canvas of region.querySelectorAll('canvas.chart')) {
    resizer.unobserve(canvas);
    const chart = charts.get(canvas);
    if (chart && chart.detach) chart.detach();
    charts.delete(canvas);
  }
  region.replaceChildren(...nodes.flat(Infinity).filter((n) => n !== null && n !== undefined && n !== false));
}

/** A table: column headers, then rows of cells, each { text | node, class?, head? } (head: a row header, th). */
function table(className, headers, rows) {
  return h(
    'table',
    { class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x) => h('th', { text: x })))),
    h(
      'tbody',
      null,
      rows.map((row) => h(
        'tr',
        { class: row.class || null },
        row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { 'data-label': cell.head ? null : headers[i], class: cell.class || null }, cell.node || cell.text)),
      )),
    ),
  );
}

/** The hypothesis tests of one group, with what each should say. */
function tests(group, s) {
  const expected = view.expectedVerdicts(s);
  return h(
    'div',
    { class: 'tests' },
    view.statTests(s)[group].map(([key, t]) => {
      const rejected = t.verdict === 'reject';
      return h(
        'div',
        { class: `test ${rejected ? 'is-invalid' : 'is-valid'}` },
        h(
          'p',
          { class: 'test-head' },
          h('strong', { text: text.stats.labels[group][key] }),
          ' ',
          h('span', { class: `badge ${rejected ? 'is-invalid' : 'is-valid'}`, text: text.stats.verdict[rejected ? 'reject' : 'notReject'] }),
          h('span', { class: 'note', text: ` (${text.stats.expected[expected[group][key]]})` }),
        ),
        h('p', { text: text.stats.testLine(t) }),
      );
    }),
  );
}

/** A choice among a few values (model, quantity): the pressed button is the active one. */
function choices(label, options, value, onChange) {
  const buttons = options.map(([key, name]) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(key === value), text: name, onclick: () => select(key) }));
  function select(key) {
    options.forEach(([k], i) => buttons[i].setAttribute('aria-pressed', String(k === key)));
    onChange(key);
  }
  return h('div', { class: 'choices', role: 'group', 'aria-label': label }, h('span', { class: 'choices-label', text: label }), buttons);
}

/** A slider on the indices of the checkpoints; set() moves it when the results or the language change. */
function slider(id, onChange) {
  const label = h('label', { for: id });
  const input = h('input', { id, type: 'range', min: 0, max: 0, step: 1, value: 0, oninput: (e) => onChange(Number(e.target.value)) });
  return {
    el: h('div', { class: 'slider' }, label, input),
    set(max, value, labelText) {
      input.max = String(max);
      input.value = String(value);
      input.disabled = max === 0 && !computation.shown;
      label.textContent = labelText;
      input.setAttribute('aria-valuetext', labelText);
    },
  };
}

const modelOptions = () => hw.MODELS.map((m) => [m, text.modelNames[m]]);

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw3-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      h('p', { class: 'note', text: text.assignment.originalNote }),
      h('blockquote', { lang: 'en' }, originalAssignment().map((block) => h('p', { text: block.text }))),
    ),
  );
}

// ---------------------------------------------------------------------------
// 1. Il modello, i campi, l'animazione e le verifiche
// ---------------------------------------------------------------------------

function modelSection() {
  const S = text.sections;
  const I = text.input;
  const Q = text.quantities;
  regions.models = h('div');
  regions.status = h('div');
  regions.verify = h('div');
  regions.simTests = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw3-model', 0, S.model),
    paras(text.model.intro),
    formulas(text.model.formulas, text.model.formulasTitle),
    title('hw3-models', 1, S.models),
    regions.models,
    title('hw3-quantities', 1, S.quantities),
    paras(Q.intro),
    subtitle(Q.tableTitle),
    table('discussion quantities', [Q.cols.quantity, Q.cols.mean, Q.cols.variance, Q.cols.sd, Q.cols.trend], Q.rows.map((row) => ({ cells: [{ text: row[0], head: true }, { text: row[1] }, { text: row[2] }, { text: row[3] }, { text: row[4] }] }))),
    paras(Q.after),
    title('hw3-input', 1, S.input),
    h('p', { text: I.intro }),
    inputsBlock(),
    regions.status,
    title('hw3-trajectories', 1, S.trajectories),
    trajectoriesBlock(),
    title('hw3-verify', 1, S.verify),
    regions.verify,
    regions.simTests,
  );
}

function updateModels() {
  const M = text.models;
  const F = text.fmt;
  const p = state.params.p;
  fill(
    regions.models,
    paras(M.intro),
    subtitle(M.tableTitle(p)),
    table(
      'discussion models',
      [M.cols.model, M.cols.values, M.cols.mu, M.cols.variance, M.cols.rho, M.cols.skewness],
      hw.MODELS.map((model) => {
        const mom = hw.modelMoments(model, p);
        return { cells: [{ text: text.modelNames[model], head: true }, { text: model === 'bernoulli' ? '{0, 1}' : '{-1, +1}' }, { text: F.num(mom.mu, 4) }, { text: F.num(mom.variance, 4) }, { text: F.num(mom.rho, 4) }, { text: F.num(mom.skewness, 4) }] };
      }),
    ),
    paras(M.after),
  );
}

// --- 1.3 I campi ----------------------------------------------------------------

const FIELDS = [
  ['p', 'pText', 'hw3-p', 'decimal'],
  ['n', 'nText', 'hw3-n', 'numeric'],
  ['m', 'mText', 'hw3-m', 'numeric'],
  ['seed', 'seedText', 'hw3-seed', 'numeric'],
];

function inputsBlock() {
  const I = text.input;
  const labels = { p: [I.pLabel, I.pHint], n: [I.nLabel, I.nHint], m: [I.mLabel, I.mHint], seed: [I.seedLabel, I.seedHint] };
  return h(
    'div',
    { class: 'params' },
    FIELDS.map(([key, name, id, mode]) => {
      const input = h('input', { id, type: 'text', inputmode: mode, ...PRIVATE_FIELD, maxlength: view.FIELD_LENGTH[key], 'aria-describedby': `${id}-help`, oninput: (e) => changeFields({ [name]: e.target.value.slice(0, view.FIELD_LENGTH[key]) }) });
      input.value = state.fields[name];
      const help = h('p', { id: `${id}-help`, class: 'note', text: labels[key][1] });
      controls.fields[key] = { input, help, hint: labels[key][1] };
      const extra = key === 'seed' ? h('button', { type: 'button', class: 'btn alt', text: I.randomSeed, onclick: () => changeFields({ seedText: String(hw.randomSeed()) }, true) }) : null;
      return h('div', { class: 'param' }, h('label', { for: id, text: labels[key][0] }), h('span', { class: 'param-row' }, input, extra), help);
    }),
  );
}

function changeFields(patch, fromButton = false) {
  Object.assign(state.fields, patch);
  if (fromButton) syncFields();
  updateInputs();
}

function syncFields() {
  for (const [key, name] of FIELDS) {
    const field = controls.fields[key];
    if (field && field.input.value !== state.fields[name]) field.input.value = state.fields[name];
  }
}

function restore() {
  state.fields = { ...view.DEFAULT_INPUTS };
  syncFields();
  updateInputs();
}

function fieldError(r, key) {
  const I = text.input;
  if (r.ok) return null;
  if (r.error === 'range') return I.errors.range(...I.limits[key]);
  return I.errors[r.error](r.text);
}

/** The fields read again: errors, the last valid value of each, and a new simulation when they settle. */
function updateInputs() {
  const read = view.readInputs(state.fields);
  for (const [key] of FIELDS) {
    const field = controls.fields[key];
    const error = fieldError(read[key], key);
    field.input.setAttribute('aria-invalid', String(Boolean(error)));
    field.help.className = error ? 'field-error' : 'note';
    field.help.textContent = error || field.hint;
    if (error) field.help.setAttribute('role', 'alert');
    else field.help.removeAttribute('role');
  }
  const next = view.applyInputs(read, state.params);
  if (next !== state.params) {
    state.params = next;
    updateModels();
    clearTimeout(timers.compute);
    timers.compute = setTimeout(() => {
      state.target = { ...state.params };
      startComputation();
      createAnimation();
    }, 400);
  }
  updateStatus();
}

/** Under the fields: the errors, the values in use, the simulation running or the time it took. */
function updateStatus() {
  const I = text.input;
  const read = view.readInputs(state.fields);
  const badge = view.inputBadge(state.params, I);
  const waiting = computation.running || view.paramsKey(state.params) !== view.paramsKey(state.target);
  const s = computation.shown;
  fill(
    regions.status,
    !view.allValid(read) && h('p', { class: 'stale', role: 'status', text: I.stale }),
    h('p', { class: badge.known ? 'badge-line is-task' : 'badge-line is-custom' }, h('span', { text: badge.text }), badge.restore && h('button', { type: 'button', class: 'btn alt', text: I.restore, onclick: restore })),
    waiting && s && h('p', { class: 'stale', role: 'status', text: I.pending }),
    computation.error && h('p', { class: 'note', text: text.ui.error(computation.error) }),
    s && !waiting && h('p', { class: 'note', role: 'status', text: I.run(s) }),
  );
}

// --- 1.4 Le traiettorie -----------------------------------------------------------

function trajectoriesBlock() {
  const T = text.trajectories;
  regions.trajectoriesIntro = h('div');
  const button = (label, action) => h('button', { type: 'button', class: 'btn alt', text: label, onclick: () => animation && animation[action]() });
  controls.play = h('button', {
    type: 'button',
    class: 'btn',
    text: T.play,
    onclick: () => {
      if (!animation) return;
      if (animation.status().playing) animation.pause();
      else animation.play();
    },
  });
  const speed = h(
    'select',
    {
      onchange: (e) => {
        state.anim.speed = Number(e.target.value);
        if (animation) animation.setSpeed(view.ANIMATION.speeds[state.anim.speed]);
      },
    },
    T.speeds.map((name, i) => h('option', { value: i, text: name, selected: i === state.anim.speed })),
  );
  controls.canvas = h('canvas', { class: 'anim', role: 'img', 'aria-label': text.sections.trajectories });
  controls.caption = h('p', { class: 'caption', 'aria-live': 'polite' });
  return [
    regions.trajectoriesIntro,
    choices(T.modelLabel, modelOptions(), state.anim.model, (model) => {
      state.anim.model = model;
      createAnimation();
    }),
    choices(T.quantityLabel, hw.QUANTITIES.map((q) => [q, text.trajectoryNames[q]]), state.anim.quantity, (quantity) => {
      state.anim.quantity = quantity;
      if (animation) animation.setQuantity(quantity);
    }),
    h('div', { class: 'controls' }, h('label', null, T.speedLabel, speed), h('span', { class: 'buttons' }, controls.play, button(T.step, 'step'), button(T.reset, 'reset'), button(T.end, 'toEnd'))),
    controls.canvas,
    legend([{ label: T.legend[0], color: 0 }, { label: T.legend[1], color: 1 }, { label: T.legend[2], color: 2, dashed: true }, { label: T.legend[3], color: 3, dashed: true }]),
    controls.caption,
    paras(T.after),
  ];
}

function updateCaption(st) {
  const T = text.trajectories;
  controls.caption.textContent = T.caption(st, text.trajectoryNames[st.quantity]);
  controls.caption.setAttribute('aria-live', st.playing ? 'off' : 'polite');
  let label = T.play;
  if (st.playing) label = T.pause;
  else if (st.k > 0 && !st.done) label = T.resume;
  controls.play.textContent = label;
}

let canvasWidth = 0;
const canvasResizer = new ResizeObserver(() => {
  const canvas = controls.canvas;
  if (!animation || !canvas || canvas.clientWidth === canvasWidth) return;
  canvasWidth = canvas.clientWidth;
  animation.redraw();
});

/** The animation of the attackers of the last simulation started, for the chosen model. */
function createAnimation() {
  if (animation) animation.destroy();
  animation = null;
  const canvas = controls.canvas;
  if (!canvas || !canvas.isConnected) return;
  const options = view.animationOptions(state.target, state.anim.model);
  fill(regions.trajectoriesIntro, paras(text.trajectories.intro(options.shown, options.sample)));
  animation = hw.createTrajectoryAnimation(canvas, {
    ...options,
    quantity: state.anim.quantity,
    speed: view.ANIMATION.speeds[state.anim.speed],
    palette: palette(),
    decimal: text.fmt.decimal,
    onUpdate: updateCaption,
  });
  canvasWidth = canvas.clientWidth;
  canvasResizer.disconnect();
  canvasResizer.observe(canvas);
}

// --- 1.5 Verifiche -----------------------------------------------------------------

let checkRows = null;

function updateVerify() {
  const V = text.verify;
  if (!checkRows) {
    fill(regions.verify, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const ok = checkRows.filter((r) => r.ok).length;
  const groups = ['generator', 'functions'].map((group) => ({ group, rows: checkRows.filter((r) => r.group === group) }));
  fill(
    regions.verify,
    h('p', { text: V.intro }),
    check(ok === checkRows.length, V.summary(ok, checkRows.length)),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: V.details(checkRows.length) }),
      groups.map((g) => [
        subtitle(V.groups[g.group]),
        table(
          'discussion vectors',
          [V.cols.check, V.cols.expected, V.cols.result],
          g.rows.map((r) => ({ cells: [{ text: r.name, head: true }, { node: h('code', { text: r.expected }) }, { node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }), class: r.ok ? 'is-ok' : 'is-bad' }] })),
        ),
      ]),
    ),
  );
}

function updateSimTests() {
  const s = computation.shown;
  fill(regions.simTests, s && tests('sim', s));
}

// ---------------------------------------------------------------------------
// 2. Le distribuzioni
// ---------------------------------------------------------------------------

function distributionsSection() {
  const S = text.sections;
  const W = text.sweep;
  regions.sweep = h('div');
  regions.moments = h('div');
  controls.sweepSlider = slider('hw3-sweep-n', (g) => {
    stopPlayer('sweep');
    state.sweep.g = g;
    updateSweep();
  });
  controls.sweepPlay = h('button', { type: 'button', class: 'btn alt', text: W.play, onclick: () => togglePlayer('sweep', updateSweep) });
  return h(
    'section',
    { class: 'section' },
    title('hw3-distributions', 0, S.distributions),
    paras(text.distributions.intro),
    title('hw3-sweep', 1, S.sweep),
    paras(W.intro),
    choices(W.quantityLabel, hw.QUANTITIES.map((q) => [q, text.quantityNames[q]]), state.sweep.quantity, (quantity) => {
      state.sweep.quantity = quantity;
      updateSweep();
    }),
    h('div', { class: 'slider-row' }, controls.sweepSlider.el, controls.sweepPlay),
    regions.sweep,
    legend([{ label: W.legend[0], color: 0 }, { label: W.legend[1], color: 1, dashed: true }, { label: W.legend[2], color: 2 }]),
    paras(W.after),
    title('hw3-moments', 1, S.moments),
    regions.moments,
  );
}

/** The index shown by a player (sweep or normal): the chosen one, or its default, within the checkpoints. */
function playerIndex(name, last) {
  const fallback = name === 'normal' && computation.shown ? view.pointIndex(computation.shown.models.rademacher, 100) : last;
  const g = state[name].g === null ? fallback : state[name].g;
  return Math.min(g, last);
}

const lastIndex = () => (computation.shown ? computation.shown.models.bernoulli.points.length - 1 : 0);

function stopPlayer(name) {
  state[name].playing = false;
  clearTimeout(timers[name]);
}

function togglePlayer(name, update) {
  if (state[name].playing) {
    stopPlayer(name);
    update();
    return;
  }
  const last = lastIndex();
  if (playerIndex(name, last) >= last) state[name].g = 0;
  state[name].playing = true;
  update();
  const tick = () => {
    timers[name] = setTimeout(() => {
      if (!state[name].playing) return;
      const end = lastIndex();
      const g = Math.min(playerIndex(name, end) + 1, end);
      state[name].g = g;
      if (g >= end) state[name].playing = false;
      update();
      if (state[name].playing) tick();
    }, 1100);
  };
  tick();
}

function updateSweep() {
  const W = text.sweep;
  const s = computation.shown;
  controls.sweepPlay.textContent = state.sweep.playing ? W.pause : W.play;
  if (!s) {
    controls.sweepSlider.set(0, 0, W.nLabel(0));
    fill(regions.sweep, pending());
    return;
  }
  const last = lastIndex();
  const g = playerIndex('sweep', last);
  const q = state.sweep.quantity;
  const n = s.models.bernoulli.points[g].n;
  controls.sweepSlider.set(last, g, W.nLabel(n));
  fill(
    regions.sweep,
    h(
      'div',
      { class: 'charts' },
      hw.MODELS.map((model) => {
        const M = s.models[model];
        const data = view.sweepChart(M, g, q, text.fmt.decimal);
        return figure(W.chart(text.modelNames[model], text.quantityNames[q], n, s.params.m), hw.drawHistogram, data, { tip: view.tips.histogram(data, text.tips), note: W.stats(text.modelNames[model], view.quantityStats(M, g, q), q) });
      }),
    ),
  );
}

function updateMoments() {
  const M = text.moments;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.moments, pending());
    return;
  }
  const B = s.models.bernoulli.mom;
  const R = s.models.rademacher.mom;
  fill(
    regions.moments,
    h('p', { text: M.intro }),
    subtitle(M.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact moments',
        [M.cols.n, `${M.cols.bMean} (${F.num(B.mu, 4)})`, `${M.cols.bVar} (${F.num(B.variance, 4)})`, `${M.cols.rMean} (${F.num(R.mu, 4)})`, `${M.cols.rVar} (${F.num(R.variance, 4)})`],
        view.momentRows(s).map((r) => ({ cells: [{ text: F.int(r.n) }, { text: F.num(r.bMean, 4) }, { text: F.num(r.bVar, 4) }, { text: F.num(r.rMean, 4) }, { text: F.num(r.rVar, 4) }] })),
      ),
    ),
    paras(M.after(s)),
  );
}

// ---------------------------------------------------------------------------
// 3. La legge dei grandi numeri
// ---------------------------------------------------------------------------

function llnSection() {
  const S = text.sections;
  const C = text.convergence;
  const [lo, hi] = hw.EPSILON_RANGE;
  regions.convergence = h('div');
  regions.bounds = h('div');
  const label = h('label', { for: 'hw3-epsilon', text: C.epsilonLabel(state.epsilon) });
  const input = h('input', {
    id: 'hw3-epsilon',
    type: 'range',
    min: Math.round(lo * 100),
    max: Math.round(hi * 100),
    step: 1,
    'aria-valuetext': C.epsilonLabel(state.epsilon),
    oninput: (e) => {
      state.epsilon = Number(e.target.value) / 100;
      label.textContent = C.epsilonLabel(state.epsilon);
      input.setAttribute('aria-valuetext', label.textContent);
      updateConvergence();
      updateBounds();
    },
  });
  input.value = String(Math.round(state.epsilon * 100));
  return h(
    'section',
    { class: 'section' },
    title('hw3-lln', 0, S.lln),
    paras(text.lln.intro),
    title('hw3-convergence', 1, S.convergence),
    h('p', { text: C.intro }),
    h('div', { class: 'slider-row' }, h('div', { class: 'slider' }, label, input)),
    regions.convergence,
    title('hw3-bounds', 1, S.bounds),
    regions.bounds,
    title('hw3-strong', 1, S.strong),
    paras(text.strong.paras),
  );
}

function updateConvergence() {
  const C = text.convergence;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.convergence, pending());
    return;
  }
  const eps = state.epsilon;
  const rows = view.llnRows(s, eps);
  // la frazione, e sotto il suo intervallo al 95%
  const cell = (x) => h('span', null, F.num(x.rate, 4), h('span', { class: 'interval', text: `${F.num(x.interval[0], 4)}-${F.num(x.interval[1], 4)}` }));
  const B = text.modelNames.bernoulli;
  const R = text.modelNames.rademacher;
  fill(
    regions.convergence,
    h('div', { class: 'charts' }, hw.MODELS.map((model) => figure(C.chart(text.modelNames[model], eps), hw.drawLineChart, view.llnChart(rows[model], F.decimal), { tip: view.tips.lln(rows[model], text.tips) }))),
    legend([{ label: C.legend[0], color: 0 }, { label: C.legend[1], color: 2 }, { label: C.legend[2], color: 3, dashed: true }, { label: C.legend[3], color: 4, dashed: true }]),
    subtitle(C.tableTitle(eps)),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact lln',
        [C.cols.n, `${B}: ${C.cols.simulated}`, `${B}: ${C.cols.exact}`, `${R}: ${C.cols.simulated}`, `${R}: ${C.cols.exact}`],
        rows.bernoulli.map((b, i) => ({ cells: [{ text: F.int(b.n) }, { node: cell(b) }, { text: F.small(b.exact) }, { node: cell(rows.rademacher[i]) }, { text: F.small(rows.rademacher[i].exact) }] })),
      ),
    ),
    paras(C.after(s, eps)),
    tests('lln', s),
  );
}

function updateBounds() {
  const s = computation.shown;
  fill(regions.bounds, s ? paras(text.bounds.paras(s, state.epsilon)) : pending());
}

// ---------------------------------------------------------------------------
// 4. La varianza
// ---------------------------------------------------------------------------

function varianceSection() {
  regions.variance = h('div');
  return h('section', { class: 'section' }, title('hw3-variance', 0, text.sections.variance), regions.variance);
}

function updateVariance() {
  const V = text.variance;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.variance, pending());
    return;
  }
  const fits = view.varianceFits(s);
  fill(
    regions.variance,
    h('p', { text: V.intro }),
    h('div', { class: 'charts' }, hw.MODELS.map((model) => figure(V.chart(text.modelNames[model]), hw.drawLineChart, view.varianceChart(s.models[model], F.decimal), { tip: view.tips.variance(s.models[model], text.tips) }))),
    legend([{ label: V.legend[0], color: 0 }, { label: V.legend[1], color: 1 }, { label: V.legend[2], color: 2 }, { label: V.legend[3], color: 6, dashed: true }]),
    subtitle(V.fitTitle),
    table(
      'discussion fits',
      [V.fitCols.quantity, V.fitCols.bernoulli, V.fitCols.rademacher, V.fitCols.theory],
      hw.QUANTITIES.map((q) => ({
        cells: [
          { text: text.quantityNames[q], head: true },
          { text: `${F.num(fits.bernoulli[q], 4)} ± ${F.num(fits.bernoulli.error, 4)}` },
          { text: `${F.num(fits.rademacher[q], 4)} ± ${F.num(fits.rademacher.error, 4)}` },
          { text: F.int(view.VARIANCE_SLOPES[q]) },
        ],
      })),
    ),
    paras(V.after(s)),
  );
}

// ---------------------------------------------------------------------------
// 5. Il teorema del limite centrale
// ---------------------------------------------------------------------------

function cltSection() {
  const S = text.sections;
  const N = text.normal;
  regions.normal = h('div');
  regions.speed = h('div');
  regions.drift = h('div');
  controls.normalSlider = slider('hw3-clt-n', (g) => {
    stopPlayer('normal');
    state.normal.g = g;
    updateNormal();
  });
  controls.normalPlay = h('button', { type: 'button', class: 'btn alt', text: text.sweep.play, onclick: () => togglePlayer('normal', updateNormal) });
  return h(
    'section',
    { class: 'section' },
    title('hw3-clt', 0, S.clt),
    paras(text.clt.intro),
    title('hw3-normal', 1, S.normal),
    h('p', { text: N.intro }),
    choices(N.modelLabel, ['rademacher', 'bernoulli'].map((m) => [m, N.models[m]]), state.normal.model, (model) => {
      state.normal.model = model;
      updateNormal();
    }),
    h('div', { class: 'slider-row' }, controls.normalSlider.el, controls.normalPlay),
    regions.normal,
    title('hw3-speed', 1, S.speed),
    regions.speed,
    title('hw3-bernoulli', 1, S.bernoulli),
    regions.drift,
  );
}

function updateNormal() {
  const N = text.normal;
  const F = text.fmt;
  const s = computation.shown;
  controls.normalPlay.textContent = state.normal.playing ? text.sweep.pause : text.sweep.play;
  if (!s) {
    controls.normalSlider.set(0, 0, N.nLabel(0));
    fill(regions.normal, pending());
    return;
  }
  const M = s.models[state.normal.model];
  const last = lastIndex();
  const g = playerIndex('normal', last);
  const n = M.points[g].n;
  const label = N.models[state.normal.model];
  controls.normalSlider.set(last, g, N.nLabel(n));
  const hist = view.cltHistogram(M, g, F.decimal);
  const qq = view.qqData(M, g, F.decimal);
  fill(
    regions.normal,
    h(
      'div',
      { class: 'charts' },
      figure(N.histChart(label, n), hw.drawHistogram, hist, { tip: view.tips.histogram(hist, text.tips), items: [{ label: N.legend[0], color: 0 }, { label: N.legend[1], color: 1, dashed: true }, { label: N.legend[2], color: 2 }] }),
      figure(N.qqChart(label, n), hw.drawQQ, qq, { tip: view.tips.qq(qq, text.tips), items: [{ label: N.qqLegend[0], color: 0 }, { label: N.qqLegend[1], color: 1, dashed: true }] }),
    ),
    h('p', { class: 'stats', text: N.stats(view.shapeAt(M, g)) }),
    paras(N.after),
    tests('clt', s),
  );
}

function updateSpeed() {
  const P = text.speed;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.speed, pending());
    return;
  }
  fill(
    regions.speed,
    h('p', { text: P.intro }),
    h('div', { class: 'charts' }, ['rademacher', 'bernoulli'].map((model) => figure(P.chart(text.modelNames[model]), hw.drawLineChart, view.distanceChart(s.models[model], s.params.m, F.decimal), { tip: view.tips.distance(s.models[model], text.tips) }))),
    legend([{ label: P.legend[0], color: 1 }, { label: P.legend[1], color: 2 }, { label: P.legend[2], color: 3, dashed: true }, { label: P.legend[3], color: 0 }, { label: P.legend[4], color: 6, dashed: true }]),
    paras(P.after(s)),
  );
}

function updateDrift() {
  const D = text.bernoulli;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.drift, pending());
    return;
  }
  fill(
    regions.drift,
    h('p', { text: D.intro }),
    subtitle(D.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact drift',
        ['n', 'mean', 'sampleMean', 'skewness', 'sampleSkewness', 'distance'].map((k) => D.cols[k]),
        view.driftRows(s.models.bernoulli).map((r) => ({ cells: [{ text: F.int(r.n) }, { text: F.num(r.mean, 3) }, { text: F.num(r.sampleMean, 3) }, { text: F.num(r.skewness, 4) }, { text: F.num(r.sampleSkewness, 4) }, { text: F.num(r.distance, 4) }] })),
      ),
    ),
    paras(D.after(s)),
  );
}

// ---------------------------------------------------------------------------
// 6. Sistemi e attaccanti
// ---------------------------------------------------------------------------

function interpretationSection() {
  const S = text.sections;
  regions.size = h('div');
  regions.attackers = h('div');
  regions.aggregate = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw3-interpretation', 0, S.interpretation),
    paras(text.interpretation.intro),
    title('hw3-size', 1, S.size),
    regions.size,
    title('hw3-attackers', 1, S.attackers),
    regions.attackers,
    title('hw3-aggregate', 1, S.aggregate),
    regions.aggregate,
    title('hw3-limits', 1, S.limits),
    paras(text.limits.paras),
  );
}

function updateSize() {
  const Z = text.size;
  const s = computation.shown;
  if (!s) {
    fill(regions.size, pending());
    return;
  }
  const W = s.models.rademacher.walk;
  const data = view.arcsineChart(W, text.fmt.decimal);
  fill(
    regions.size,
    paras(Z.paras(s)),
    figure(Z.arcsineChart(W.even, s.params.m), hw.drawHistogram, data, { wide: true, tip: view.tips.arcsine(data, text.tips), items: [{ label: Z.arcsineLegend[0], color: 0 }, { label: Z.arcsineLegend[1], color: 1, dashed: true }, { label: Z.arcsineLegend[2], color: 2 }] }),
    paras(Z.after),
    tests('walk', s),
  );
}

function updateAttackers() {
  const A = text.attackers;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.attackers, pending());
    return;
  }
  const G = s.models.bernoulli.groups;
  const n = s.params.n;
  fill(
    regions.attackers,
    h('p', { text: A.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(A.bestChart(n), hw.drawLineChart, view.bestChart(G, F.decimal), { tip: view.tips.best(G, text.tips), items: [{ label: A.bestLegend[0], color: 0 }, { label: A.bestLegend[1], color: 1 }, { label: A.bestLegend[2], color: 2, dashed: true }, { label: A.bestLegend[3], color: 3, dashed: true }] }),
      figure(A.probabilityChart(n), hw.drawLineChart, view.probabilityChart(G, F.decimal), { tip: view.tips.probability(G, text.tips), items: [{ label: A.probabilityLegend[0], color: 0 }, { label: A.probabilityLegend[1], color: 0, dashed: true }, { label: A.probabilityLegend[2], color: 2 }, { label: A.probabilityLegend[3], color: 2, dashed: true }] }),
    ),
    paras(A.after(s)),
  );
}

function updateAggregate() {
  const G = text.aggregate;
  const s = computation.shown;
  if (!s) {
    fill(regions.aggregate, pending());
    return;
  }
  const data = view.systemsChart(s.models.bernoulli, text.fmt.decimal);
  fill(
    regions.aggregate,
    paras(G.paras(s)),
    figure(G.systemsChart(s.params.n, s.params.m), hw.drawHistogram, data, { wide: true, tip: view.tips.histogram(data, text.tips), items: [{ label: G.systemsLegend[0], color: 0 }, { label: G.systemsLegend[1], color: 1, dashed: true }, { label: G.systemsLegend[2], color: 2 }] }),
    paras(G.after),
  );
}

// ---------------------------------------------------------------------------
// 7, 8 e 9
// ---------------------------------------------------------------------------

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section' }, title('hw3-tests', 0, text.sections.tests), regions.tests);
}

function updateTests() {
  const T = text.tests;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.tests, pending());
    return;
  }
  const summary = view.testSummary(s);
  fill(
    regions.tests,
    h('p', { text: T.intro(s) }),
    table(
      'discussion summary-tests',
      [T.cols.subject, T.cols.hypothesis, T.cols.p, T.cols.verdict, T.cols.expected],
      summary.all.map((t) => {
        const rejected = t.result.verdict === 'reject';
        return {
          class: rejected ? 'is-rejected' : null,
          cells: [{ text: text.stats.groups[t.group], head: true }, { text: text.stats.labels[t.group][t.key] }, { text: F.pval(t.result.pValue) }, { text: text.stats.verdict[rejected ? 'reject' : 'notReject'] }, { text: text.stats.expected[t.expected] }],
        };
      }),
    ),
    paras(T.after(summary, s)),
  );
}

function historySection() {
  const H = text.history;
  return h(
    'section',
    { class: 'section' },
    title('hw3-history', 0, text.sections.history),
    h('p', { text: H.intro }),
    h('p', { class: 'legend' }, h('span', { class: 'legend-task', text: H.legend.task }), h('span', { class: 'legend-context', text: H.legend.context })),
    h(
      'ol',
      { class: 'timeline' },
      H.events.map((e) => h('li', { class: e.task ? 'is-task' : 'is-context' }, h('span', { class: 'year', text: e.year }), h('div', null, h('strong', { text: e.title }), h('p', { text: e.text })))),
    ),
    h('p', { text: H.after }),
  );
}

function conclusionSection() {
  regions.conclusion = h('div');
  return h('section', { class: 'section' }, title('hw3-conclusion', 0, text.sections.conclusion), regions.conclusion);
}

function updateConclusion() {
  fill(regions.conclusion, paras(text.conclusion(computation.shown)));
}

// ---------------------------------------------------------------------------
// La simulazione
// ---------------------------------------------------------------------------

const message = (error) => (error instanceof Error ? error.message : String(error));

/** A generator that stops early, returning null, once its token is cancelled. */
function* cancellable(steps, token) {
  let step = steps.next();
  while (!step.done) {
    if (token.cancelled) return null;
    yield;
    step = steps.next();
  }
  return step.value;
}

// gli ultimi risultati restano in memoria (ognuno pesa circa un megabyte)
function remember(key, value) {
  results.delete(key);
  results.set(key, value);
  while (results.size > 4) results.delete(results.keys().next().value);
}

/** Simulates the parameters of state.target; the one still running for other parameters stops at its next slice. */
function startComputation() {
  const params = state.target;
  const key = view.paramsKey(params);
  if (computation.running) computation.running.token.cancelled = true;
  computation.running = null;
  if (results.has(key)) {
    computation.shown = results.get(key);
    computation.error = null;
    updateResults();
    return;
  }
  const token = { cancelled: false };
  computation.running = { key, token };
  updateStatus();
  hw.runStepsAsync(() => cancellable(hw.exploreSteps(params), token)).then(
    (value) => {
      if (token.cancelled || value === null) return;
      remember(key, value);
      computation.running = null;
      computation.shown = value;
      computation.error = null;
      updateResults();
    },
    (error) => {
      if (token.cancelled) return;
      computation.running = null;
      computation.error = message(error);
      updateResults();
    },
  );
}

function updateResults() {
  updateStatus();
  updateSimTests();
  updateSweep();
  updateMoments();
  updateConvergence();
  updateBounds();
  updateVariance();
  updateNormal();
  updateSpeed();
  updateDrift();
  updateSize();
  updateAttackers();
  updateAggregate();
  updateTests();
  updateConclusion();
}

// ---------------------------------------------------------------------------
// Indice, lingua e avvio
// ---------------------------------------------------------------------------

const dialog = document.getElementById('index-dialog');
const FOLLOW_MS = 2500;

// Porta il titolo in cima e lo segue per un paio di secondi: se nel
// frattempo qualcosa sopra cambia altezza (una sezione che finisce di
// calcolarsi), lo scorrimento riparte verso la nuova posizione. Se l'utente
// scorre da se', si smette subito di inseguire.
function scrollToSection(target) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  const started = performance.now();
  let stopped = false;
  let lastTop = target.getBoundingClientRect().top + window.scrollY;
  const stop = () => {
    stopped = true;
    userEvents.forEach((type) => window.removeEventListener(type, stop));
  };
  userEvents.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  target.scrollIntoView({ behavior, block: 'start' });
  const follow = () => {
    if (stopped) return;
    if (performance.now() - started > FOLLOW_MS) {
      stop();
      return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(top - lastTop) > 1) {
      lastTop = top;
      target.scrollIntoView({ behavior, block: 'start' });
    }
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

function closeIndex() {
  document.documentElement.classList.remove('index-open');
  if (dialog.open) dialog.close();
}

function goTo(id) {
  closeIndex();
  const target = document.getElementById(id);
  if (!target) return;
  target.focus({ preventScroll: true });
  scrollToSection(target);
  target.classList.remove('flash');
  void target.offsetWidth;
  target.classList.add('flash');
  target.addEventListener('animationend', () => target.classList.remove('flash'), { once: true });
}

// In cima alla pagina, con il focus sul titolo: chi usa la tastiera riparte
// da li', non dal pulsante in fondo
function backToTop() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  document.getElementById('page-title').focus({ preventScroll: true });
}

const toTopButton = () => h('p', { class: 'to-top' }, h('button', { type: 'button', class: 'btn alt', text: text.ui.backToTop, onclick: backToTop }));

function renderChrome() {
  const t = text;
  document.documentElement.lang = state.lang;
  document.title = 'Homework #3 - Statistics';
  document.getElementById('subtitle').textContent = t.standalone.subtitle;
  document.getElementById('course').textContent = t.standalone.course;
  document.getElementById('open-index').textContent = t.ui.index;
  document.getElementById('index-title').textContent = t.ui.indexTitle;
  document.querySelector('.index-close').setAttribute('aria-label', t.ui.close);
  document.getElementById('language').setAttribute('aria-label', t.ui.language);
  document.getElementById('online-label').textContent = t.standalone.online;
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === state.lang));
  }
  document.getElementById('index-list').replaceChildren(
    ...view.tocEntries(t.sections).map((entry) => h('li', { class: `level-${entry.level}` }, h('button', { type: 'button', text: entry.title, onclick: () => goTo(entry.id) }))),
  );
}

function render() {
  text = HW3_TEXTS[state.lang];
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), modelSection(), distributionsSection(), llnSection(), varianceSection(), cltSection(), interpretationSection(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateModels();
  updateInputs();
  updateVerify();
  updateResults();
  createAnimation();
}

function boot() {
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.addEventListener('click', () => {
      if (button.dataset.lang === state.lang) return;
      state.lang = LANGUAGES.includes(button.dataset.lang) ? button.dataset.lang : 'en';
      render();
    });
  }
  document.getElementById('open-index').addEventListener('click', () => {
    document.documentElement.classList.add('index-open');
    dialog.showModal();
  });
  document.querySelector('.index-close').addEventListener('click', closeIndex);
  dialog.addEventListener('close', () => document.documentElement.classList.remove('index-open'));
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeIndex();
  });
  // i colori dei grafici, delle legende e dell'animazione seguono il tema del sistema
  darkQuery.addEventListener('change', render);
  render();
  // le verifiche e la simulazione partono dopo il primo disegno della pagina
  setTimeout(() => {
    try {
      checkRows = hw.verifyAll();
    } catch (error) {
      checkRows = [{ group: 'functions', name: text.ui.error(message(error)), expected: '', actual: '', ok: false }];
    }
    updateVerify();
    startComputation();
  }, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
})();
