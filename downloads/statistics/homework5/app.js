/*
 * Homework #5 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Interface and texts (Italian and English). Needs homework5.js, loaded first.
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-5
 */

(function () {
'use strict';

var view$ = (function () {
'use strict';

// src/pages/statistics/hw5/view.js
// Logica di presentazione dell'Homework #5, condivisa fra la pagina del sito
// (React) e il programma scaricabile (DOM puro): le sezioni, la lettura dei
// campi, le righe delle tabelle, i dati dei grafici e i fatti che i testi
// citano. Tenerla qui impedisce che le due versioni dicano cose diverse
// sugli stessi numeri.
const hw = Homework5;

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
const SECTIONS = [
  { id: 'hw5-assignment', key: 'assignment', level: 0 },
  { id: 'hw5-exercise1', key: 'exercise1', level: 0 },
  { id: 'hw5-idea', key: 'idea', level: 1 },
  { id: 'hw5-try-coins', key: 'tryCoins', level: 2 },
  { id: 'hw5-functions', key: 'functions', level: 1 },
  { id: 'hw5-riemann', key: 'riemann', level: 1 },
  { id: 'hw5-lebesgue', key: 'lebesgue', level: 1 },
  { id: 'hw5-try-slices', key: 'trySlices', level: 2 },
  { id: 'hw5-results', key: 'results', level: 1 },
  { id: 'hw5-compare', key: 'compare', level: 1 },
  { id: 'hw5-efficiency', key: 'efficiency', level: 1 },
  { id: 'hw5-pathological', key: 'pathological', level: 1 },
  { id: 'hw5-traffic', key: 'traffic', level: 1 },
  { id: 'hw5-montecarlo', key: 'montecarlo', level: 1 },
  { id: 'hw5-try-mc', key: 'tryMc', level: 2 },
  { id: 'hw5-exercise2', key: 'exercise2', level: 0 },
  { id: 'hw5-liouville', key: 'liouville', level: 1 },
  { id: 'hw5-erf', key: 'erf', level: 1 },
  { id: 'hw5-area', key: 'area', level: 1 },
  { id: 'hw5-try-area', key: 'tryArea', level: 2 },
  { id: 'hw5-rules', key: 'rules', level: 1 },
  { id: 'hw5-infinity', key: 'infinity', level: 1 },
  { id: 'hw5-convergence', key: 'convergence', level: 1 },
  { id: 'hw5-series', key: 'series', level: 1 },
  { id: 'hw5-approximations', key: 'approximations', level: 1 },
  { id: 'hw5-ours', key: 'ours', level: 1 },
  { id: 'hw5-reference', key: 'reference', level: 1 },
  { id: 'hw5-methods', key: 'methods', level: 1 },
  { id: 'hw5-table', key: 'table', level: 1 },
  { id: 'hw5-quantiles', key: 'quantiles', level: 1 },
  { id: 'hw5-tails', key: 'tails', level: 1 },
  { id: 'hw5-try-alarm', key: 'tryAlarm', level: 2 },
  { id: 'hw5-data', key: 'data', level: 1 },
  { id: 'hw5-checks', key: 'checks', level: 0 },
  { id: 'hw5-tests', key: 'tests', level: 0 },
  { id: 'hw5-history', key: 'history', level: 0 },
  { id: 'hw5-conclusion', key: 'conclusion', level: 0 },
];

/** The entries of the index: the sections with their titles in the current language. */
const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

/** Points [x, f(x)] of a curve, the infinite values cut at the cap. */
function curveOf(f, a, b, count, cap = Infinity) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const x = a + ((b - a) * i) / count;
    const v = f(x);
    if (Number.isNaN(v)) return [x, NaN];
    return [x, Math.max(-cap, Math.min(cap, v))];
  });
}

const clampLog = (v) => Math.min(10, Math.max(1e-17, v));

// ---------------------------------------------------------------------------
// Part 1, sezioni 1.1 e Prova: l'area sotto la campana
// ---------------------------------------------------------------------------

/** The controls of the first example: mu, sigma, z on a grid of 0.01, the rule, n, and two of the three ways around -infinity. */
const AREA = Object.freeze({
  zRange: Object.freeze([-4, 4]),
  zStep: 0.01,
  mus: Object.freeze([-2, -1, 0, 1, 2]),
  sigmas: Object.freeze([0.5, 1, 2]),
  nMax: 32,
  strategies: Object.freeze(['symmetry', 'truncation']),
  defaults: Object.freeze({ mu: 0, sigma: 1, z: 1.96, rule: 'simpson', n: 4, strategy: 'symmetry' }),
});

const Z_STEPS = Math.round((AREA.zRange[1] - AREA.zRange[0]) / AREA.zStep);
const zOfIndex = (i) => Number((AREA.zRange[0] + i * AREA.zStep).toFixed(2));
const indexOfZ = (z) => Math.round((z - AREA.zRange[0]) / AREA.zStep);

/**
 * The first example: F(x) for X ~ N(mu, sigma^2) with one rule and n
 * pieces. With the symmetry the pieces cover [mu, x] and the half to the
 * left of mu counts 1/2 (for x < mu they cover [x, mu] and are taken away
 * from 1/2); with the truncation they cover [mu - 4 sigma, x], and
 * Phi(-4) = 3.2e-5 is left out.
 */
function areaState({ mu, sigma, z, rule, n, strategy }, decimal = '.') {
  const x = mu + sigma * z;
  const x0 = mu - 4 * sigma;
  const x1 = mu + 4 * sigma;
  const f = (t) => hw.normalDensity(t, mu, sigma);
  const k = hw.validN(rule, n);
  let a = x0;
  let b = Math.max(x, x0);
  let base = 0;
  let sign = 1;
  if (strategy === 'symmetry') {
    base = 0.5;
    a = Math.min(mu, x);
    b = Math.max(mu, x);
    sign = x >= mu ? 1 : -1;
  }
  const pieces = b > a ? hw.rulePieces(f, a, b, rule, k) : [];
  const sum = pieces.reduce((s, p) => s + p.area, 0);
  const value = base + sign * sum;
  const exact = hw.normalCdf(z);
  const yMax = (1.15 * hw.phi(0)) / sigma;
  return {
    x,
    n: k,
    value,
    exact,
    error: Math.abs(value - exact),
    evaluations: b > a ? hw.evaluationsOf(rule, k) : 0,
    a,
    b,
    sign,
    base,
    sum,
    chart: { x0, x1, yMin: 0, yMax, curve: curveOf(f, x0, x1, 240), from: x0, to: x, pieces, xTicks: hw.niceTicks(x0, x1, 9), yTicks: hw.niceTicks(0, yMax, 4), decimal },
  };
}

/** The picture of section 1.1: Phi(1.96) = 0.975 as the area under the bell, with no pieces. */
function bellChart(decimal = '.') {
  const s = areaState({ ...AREA.defaults, n: 2 }, decimal);
  return { ...s.chart, pieces: [] };
}

// ---------------------------------------------------------------------------
// 1.2 Le cinque regole
// ---------------------------------------------------------------------------

/** The rules and the n of the table of section 1.2. */
const RULES_N = 16;

/** The five rules on Phi(1.96) with n = 16: value, error, values of phi used. */
const ruleRows = () =>
  hw.RULES.map((rule) => {
    const n = hw.validN(rule, RULES_N);
    const value = hw.cdfStandard(hw.CONVERGENCE_Z, { rule, n });
    return { rule, n, value, error: Math.abs(value - hw.normalCdf(hw.CONVERGENCE_Z)), evaluations: hw.evaluationsOf(rule, n) };
  });

/** The nodes and weights of Gauss-Legendre with 5 points, on [-1, 1]. */
function gaussRows(n = 5) {
  const { nodes, weights } = hw.gaussLegendre(n);
  return nodes.map((t, i) => ({ i: i + 1, node: t, weight: weights[i] }));
}

/** The function of section 1.2 as the page shows it: integrate() of homework5.js, one line per rule. */
const RULE_CODE = [
  'function integrate(f, a, b, rule, n) {',
  '  const h = (b - a) / n;',
  '  let s = 0;',
  '  switch (rule) {',
  "    case 'left':      for (let i = 0; i < n; i++) s += f(a + i * h);  return s * h;",
  "    case 'midpoint':  for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h);  return s * h;",
  "    case 'trapezoid': s = (f(a) + f(b)) / 2;",
  '                      for (let i = 1; i < n; i++) s += f(a + i * h);  return s * h;',
  "    case 'simpson':   s = f(a) + f(b);   // n even",
  '                      for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);  return (s * h) / 3;',
  "    case 'gauss': {   // nodes t_i and weights w_i of gaussLegendre(n)",
  '      const { nodes: t, weights: w } = gaussLegendre(n);',
  '      for (let i = 0; i < n; i++) s += w[i] * f((a + b) / 2 + ((b - a) / 2) * t[i]);',
  '      return (s * (b - a)) / 2;',
  '    }',
  '  }',
  '}',
].join('\n');

// ---------------------------------------------------------------------------
// 1.3 Il problema di -infinito
// ---------------------------------------------------------------------------

/** The columns of the table of section 1.3: the symmetry, the truncation at -4 and at -8, the substitution. */
const STRATEGY_COLUMNS = Object.freeze([
  Object.freeze({ strategy: 'symmetry', lower: null }),
  Object.freeze({ strategy: 'truncation', lower: 4 }),
  Object.freeze({ strategy: 'truncation', lower: 8 }),
  Object.freeze({ strategy: 'substitution', lower: null }),
]);

/** The rows of section 1.3 for one rule: z, Phi(z), and the error of every way around -infinity. */
function strategyTable(rule) {
  return hw.strategyRows().map((row) => ({
    z: row.z,
    reference: row.reference,
    errors: STRATEGY_COLUMNS.map((c) => row.cells.find((cell) => cell.rule === rule && cell.strategy === c.strategy && (c.lower === null || cell.lower === c.lower)).error),
  }));
}

/** What the text of section 1.3 says: the largest error of every column for both rules, and what the truncation at -4 leaves out. */
function strategyFacts() {
  const out = {};
  for (const { rule } of hw.STRATEGY_RULES) out[rule] = STRATEGY_COLUMNS.map((_, c) => Math.max(...strategyTable(rule).map((r) => r.errors[c])));
  return { ...out, leftOut4: hw.normalCdf(-4), leftOut8: hw.normalCdf(-8), n: hw.STRATEGY_RULES[0].n };
}

// ---------------------------------------------------------------------------
// 1.4 Quanti punti servono
// ---------------------------------------------------------------------------

/** The convergence chart: error against n for the five rules, on logarithmic axes. */
function convergenceChart(study, decimal = '.') {
  return {
    x: study.rows.map((r) => r.n),
    logX: true,
    logY: true,
    yMin: 1e-17,
    yMax: 1,
    yTicks: [1e-16, 1e-12, 1e-8, 1e-4, 1],
    xTicks: [2, 16, 128, 1024, 8192],
    decimal,
    series: hw.RULES.map((rule, i) => ({ values: study.rows.map((r) => (r.errors[rule] === null ? null : clampLog(r.errors[rule]))), colorIndex: i })),
  };
}

/** The numbers the text of section 1.4 quotes. */
function convergenceFacts(study) {
  const at = (n) => study.rows.find((r) => r.n === n);
  return { orders: study.orders, enough: study.enough, simpson16: at(16).errors.simpson, gauss8: at(8).errors.gauss, left16384: at(16384).errors.left, midpoint16384: at(16384).errors.midpoint, reference: study.reference, z: study.z };
}

// ---------------------------------------------------------------------------
// 1.5 La tavola, 1.6 i quantili
// ---------------------------------------------------------------------------

/** The cells of the table that the text points at: the z of the most used quantiles. */
const ZTABLE_MARKS = Object.freeze([1.28, 1.64, 1.65, 1.96, 2.33, 2.57, 2.58]);

const isMarkedZ = (z) => ZTABLE_MARKS.some((m) => Math.abs(m - z) < 1e-9);

/** The quantiles of section 1.6, with the difference from the reference (Acklam's approximation and one step of Halley). */
const quantileRows = () =>
  hw.QUANTILE_LEVELS.map((p) => {
    const q = hw.quantileNewton(p);
    return { p, z: q.z, steps: q.steps.length, reference: q.reference, difference: Math.abs(q.z - q.reference) };
  });

/** The level whose Newton steps the page shows one by one: the 1.96 of every 95% interval. */
const NEWTON_P = 0.975;

/** The steps of Newton's method for NEWTON_P, with the error of each against the final value. */
function newtonRows(p = NEWTON_P) {
  const q = hw.quantileNewton(p);
  return q.steps.map((s) => ({ ...s, error: Math.abs(s.z - q.z) }));
}

/** The chart of the Newton steps: the error after each step, on a logarithmic axis. */
function newtonChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.k),
    logY: true,
    yMin: 1e-17,
    yMax: 10,
    yTicks: [1e-16, 1e-12, 1e-8, 1e-4, 1],
    xTicks: rows.map((r) => r.k).filter((k) => k % 2 === 1),
    decimal,
    series: [{ values: rows.map((r) => (r.error === 0 ? 1e-17 : clampLog(r.error))), colorIndex: 0 }],
  };
}

// ---------------------------------------------------------------------------
// 1.7 Le code e le soglie d'allarme
// ---------------------------------------------------------------------------

/** The chart of the tails: the relative error of 1 - Phi(k) and of Phi(-k) integrated directly. */
function tailChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.k),
    logY: true,
    yMin: 1e-17,
    yMax: 1e4,
    yTicks: [1e-16, 1e-12, 1e-8, 1e-4, 1],
    xTicks: rows.map((r) => r.k),
    decimal,
    series: [
      { values: rows.map((r) => clampLog(r.subtractionError || 1e-17)), colorIndex: 1 },
      { values: rows.map((r) => clampLog(r.directError || 1e-17)), colorIndex: 2 },
    ],
  };
}

/** What the text of section 1.7 quotes: where the subtraction loses digits, and the worst error of the direct integral. */
function tailFacts(rows) {
  const first = (limit) => {
    const r = rows.find((row) => row.subtractionError > limit);
    return r ? r.k : null;
  };
  return { micro: first(1e-6), total: first(0.5), worstDirect: Math.max(...rows.map((r) => r.directError)), at8: rows.find((r) => r.k === 8), at9: rows.find((r) => r.k === 9) };
}

/** The events a day and the false alarms the reader accepts, in the example of the alarm threshold. */
const ALARM_EVENTS = Object.freeze([1e4, 1e5, 1e6, 1e7]);
const ALARM_RATES = Object.freeze({ tenDay: 10, day: 1, week: 1 / 7, month: 1 / 30 });
const ALARM_DEFAULT = Object.freeze({ events: 1e6, rate: 'day' });

/** The thresholds of the table of section 1.7, with a million events a day. */
const ALARM_KS = Object.freeze([2, 3, 4, 5, 6]);

const alarmRows = (events = 1e6) =>
  ALARM_KS.map((k) => {
    const normal = hw.tailDirect(k);
    const heavy = hw.heavySf(k);
    return { k, normal, heavy, normalPerDay: events * normal, heavyPerDay: events * heavy, ratio: heavy / normal };
  });

/** The example of the alarm threshold: the k for the accepted rate, and what heavy tails would make of it. */
function alarmState(events, rate) {
  const perDay = ALARM_RATES[rate];
  const target = perDay / events;
  const t = hw.alarmThreshold(target);
  return { events, rate, perDay, target, k: t.k, steps: t.steps, heavyRate: hw.heavySf(t.k), heavyPerDay: events * hw.heavySf(t.k) };
}

/** The chart of the example: the two tails on a logarithmic axis, and the accepted rate as a dashed line. */
function alarmChart(state, decimal = '.') {
  const ks = Array.from({ length: 81 }, (_, i) => i / 10);
  return {
    x: ks,
    logY: true,
    yMin: 1e-16,
    yMax: 1,
    yTicks: [1e-15, 1e-12, 1e-9, 1e-6, 1e-3, 1],
    xTicks: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    decimal,
    series: [
      { values: ks.map((k) => hw.tailDirect(k)), colorIndex: 0, dots: false },
      { values: ks.map((k) => hw.heavySf(k)), colorIndex: 1, dots: false },
      { values: ks.map(() => state.target), colorIndex: 6, dashed: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// 1.8 Il modello alla prova dei dati: i campi e la funzione di ripartizione empirica
// ---------------------------------------------------------------------------

/** How many characters each field accepts. */
const FIELD_LENGTH = Object.freeze({ seed: 10, sample: 6, points: 5, reps: 4 });

const DEFAULT_PARAMS = Object.freeze({ seed: hw.DEFAULT_SEED, sample: hw.DEFAULT_SAMPLE, points: hw.DEFAULT_POINTS, reps: hw.DEFAULT_REPS });

/** The text of the fields for some parameters. */
const fieldsOf = (params) => ({ seedText: String(params.seed), sampleText: String(params.sample), pointsText: String(params.points), repsText: String(params.reps) });

const DEFAULT_INPUTS = Object.freeze(fieldsOf(DEFAULT_PARAMS));

/** The four fields, read and checked. */
const readInputs = ({ seedText, sampleText, pointsText, repsText }) => ({
  seed: hw.parseInteger(seedText, hw.LIMITS.seed),
  sample: hw.parseInteger(sampleText, hw.LIMITS.sample),
  points: hw.parseInteger(pointsText, hw.LIMITS.points),
  reps: hw.parseInteger(repsText, hw.LIMITS.reps),
});

const sameParams = (a, b) => a.seed === b.seed && a.sample === b.sample && a.points === b.points && a.reps === b.reps;

/** The parameters after a change of the fields: every valid field takes its new value, the others keep the last valid one. */
function applyInputs(read, previous) {
  const pick = (r, old) => (r.ok ? r.value : old);
  const next = { seed: pick(read.seed, previous.seed), sample: pick(read.sample, previous.sample), points: pick(read.points, previous.points), reps: pick(read.reps, previous.reps) };
  return sameParams(next, previous) ? previous : next;
}

const allValid = (read) => read.seed.ok && read.sample.ok && read.points.ok && read.reps.ok;

/** The parameters as one string, the key of the cache of results. */
const paramsKey = (params) => `${params.seed}|${params.sample}|${params.points}|${params.reps}`;
function parseParamsKey(key) {
  const [seed, sample, points, reps] = key.split('|').map(Number);
  return { seed, sample, points, reps };
}

/** The line under the fields: the parameters of the page, or the reader's, with the button to go back. */
function inputBadge(params, I) {
  const known = sameParams(params, DEFAULT_PARAMS);
  return { known, restore: !known, text: known ? I.badgeTask : I.badgeCustom(params) };
}

/** The window of the charts of section 1.8: the same for both samples, so that the two curves can be compared; a few extreme values of the heavy tails fall outside. */
const ECDF_WINDOW = Object.freeze([-5, 5]);

/** The empirical distribution function of a sample against the numerical Phi, in ECDF_WINDOW. */
function ecdfChart(report, decimal = '.') {
  const [lo, hi] = ECDF_WINDOW;
  const points = report.ecdf.filter(([v]) => v >= lo && v <= hi);
  const x = points.map(([v]) => v);
  return {
    x,
    points,
    yMin: 0,
    yMax: 1,
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    xTicks: [-4, -2, 0, 2, 4],
    decimal,
    series: [
      { values: points.map(([, F]) => F), colorIndex: 0, dots: false },
      { values: x.map((v) => hw.cdfStandard(v)), colorIndex: 2, dashed: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// Exercise 1: le funzioni, la funzione scritta da chi legge, i grafici di Riemann e di Lebesgue
// ---------------------------------------------------------------------------

/** The functions of the choice of Exercise 1: the nine of the library and the reader's. */
const FUNCTION_KEYS = Object.freeze([...hw.FUNCTIONS, hw.CUSTOM]);

/** The fields of the reader's function, as the page opens. */
const DEFAULT_CUSTOM = Object.freeze({ formula: hw.DEFAULT_FORMULA, aText: String(hw.DEFAULT_RANGE[0]), bText: String(hw.DEFAULT_RANGE[1]) });
const RANGE_LENGTH = 12;

/** The reader's function, read and checked: the two ends and the formula, with the first problem found. */
function readCustom({ formula, aText, bText }) {
  const a = hw.parseNumber(aText, [-hw.RANGE_LIMIT, hw.RANGE_LIMIT]);
  const b = hw.parseNumber(bText, [-hw.RANGE_LIMIT, hw.RANGE_LIMIT]);
  if (!a.ok || !b.ok) return { ok: false, a, b, error: 'range', field: !a.ok ? 'a' : 'b' };
  if (!(a.value < b.value)) return { ok: false, a, b, error: 'order', field: 'b' };
  const result = hw.customFunction(formula, a.value, b.value);
  return result.ok ? { ...result, ok: true } : { ...result, ok: false, field: 'formula' };
}

/** One function of the choice: the library's, or the reader's when it is valid (otherwise the last valid one). */
const specOf = (key, custom) => hw.functionOf(key, custom);

/** The y range of the pictures: the values of f with a margin, an unbounded function cut where most of it is visible. */
function rangeOf(spec) {
  const values = curveOf(spec.f, spec.a, spec.b, 600).map(([, v]) => v).filter(Number.isFinite);
  values.sort((p, q) => p - q);
  let lo = Math.min(0, values[0]);
  let hi = Math.max(0, values[values.length - 1]);
  if (Number.isFinite(spec.cap) || spec.key === hw.CUSTOM) {
    // the top 2% of the values may run to infinity: the picture stops at 1.5 times the 98th percentile
    const p98 = values[Math.floor(0.98 * (values.length - 1))];
    if (hi > 3 * Math.max(1e-12, p98)) hi = 1.5 * p98;
    const p02 = values[Math.floor(0.02 * (values.length - 1))];
    if (lo < 3 * Math.min(-1e-12, p02)) lo = 1.5 * p02;
  }
  const pad = (hi - lo) * 0.06 || 1;
  return [lo < 0 ? lo - pad : 0, hi + pad];
}

/**
 * The picture of a function with Riemann's strips or Lebesgue's layers:
 * n strips with the value at `kind`, or K levels from the smallest value
 * to the largest (or the cap), with their level sets.
 */
function integralChart(spec, mode, { n = 10, K = 10, kind = 'midpoint' } = {}, decimal = '.') {
  const [yMin, yMax] = rangeOf(spec);
  const cap = Number.isFinite(spec.cap) ? spec.cap : Infinity;
  const base = { a: spec.a, b: spec.b, yMin, yMax, curve: curveOf(spec.f, spec.a, spec.b, 800, Math.max(Math.abs(yMin), Math.abs(yMax)) * 4), mode, kind, xTicks: hw.niceTicks(spec.a, spec.b, 6), yTicks: hw.niceTicks(yMin, yMax, 5), decimal };
  if (mode === 'riemann') {
    const r = hw.riemannSums(spec.f, spec.a, spec.b, n);
    return { chart: { ...base, strips: r.strips, levels: [], sets: [] }, sums: r };
  }
  const l = hw.lebesgueSums(spec.f, spec.a, spec.b, K, { cap, collect: true });
  return { chart: { ...base, strips: [], levels: l.levels, sets: l.sets }, sums: l };
}

/** The numbers of strips and levels of the tables of sections 2.3 and 2.4. */
const SUM_SIZES = Object.freeze([10, 100, 1000]);

/** The Riemann sums of a function for n = 10, 100, 1000. */
const riemannRows = (spec) =>
  SUM_SIZES.map((n) => {
    const r = hw.riemannSums(spec.f, spec.a, spec.b, n);
    return { n, left: r.left, right: r.right, midpoint: r.midpoint, lower: r.lower, upper: r.upper, gap: r.upper - r.lower };
  });

/** The Lebesgue sums of a function for K = 10, 100, 1000 levels. */
const lebesgueRows = (spec) =>
  SUM_SIZES.map((K) => {
    const l = hw.lebesgueSums(spec.f, spec.a, spec.b, K, { cap: spec.cap });
    return { K, lower: l.lower, upper: l.upper, midpoint: l.midpoint, gap: l.upper - l.lower, m: l.m, M: l.M, capped: l.capped };
  });

/** The integral the errors are measured against: the exact one, or hw.referenceIntegral for the reader's function. */
function referenceOf(spec) {
  if (spec.exact !== null) return { value: spec.exact, exact: true, method: 'exact', uncertainty: null };
  return { ...hw.referenceIntegral(spec.f, spec.a, spec.b), exact: false };
}

/** The distribution function of the values, y -> mu{f >= y}, at 200 levels: Lebesgue's view of the function. */
function distributionChart(spec, decimal = '.') {
  const l = hw.lebesgueSums(spec.f, spec.a, spec.b, 200, { cap: spec.cap });
  const width = spec.b - spec.a;
  return {
    x: l.levels,
    yMin: 0,
    yMax: width * 1.05,
    yTicks: hw.niceTicks(0, width, 4),
    xTicks: hw.niceTicks(l.levels[0], l.levels[l.levels.length - 1], 6),
    decimal,
    series: [{ values: l.measures.map((m, k) => (k === 0 ? width : m)), colorIndex: 0, dots: false }],
  };
}

/** The function and its decreasing rearrangement f*, on the same axis s from 0 to b - a: same area, values in another order. */
function rearrangementChart(spec, decimal = '.') {
  const count = 400;
  const r = hw.rearrangement(spec.f, spec.a, spec.b, count, spec.cap);
  const [yMin, yMax] = rangeOf(spec);
  const original = r.s.map((s) => {
    const v = spec.f(spec.a + s);
    return Number.isFinite(v) ? v : v > 0 ? spec.cap : -spec.cap;
  });
  return {
    chart: {
      x: r.s,
      yMin,
      yMax,
      yTicks: hw.niceTicks(yMin, yMax, 5),
      xTicks: hw.niceTicks(0, spec.b - spec.a, 6),
      decimal,
      series: [
        { values: original, colorIndex: 4, dots: false },
        { values: r.values, colorIndex: 0, dots: false },
      ],
    },
    area: r.area,
  };
}

/** The comparison of section 2.5: the error of the two midpoint sums and the gap between lower and upper, against n = K. */
function compareChart(study, decimal = '.') {
  const pick = (v) => (Number.isFinite(v) ? Math.max(1e-14, v) : null);
  // the axis follows the data: from the decade of the smallest value to that of the largest
  const values = study.rows.flatMap((r) => [r.errors.riemann, r.errors.lebesgue, r.gaps.riemann, r.gaps.lebesgue]).filter((v) => Number.isFinite(v) && v > 0);
  const lo = Math.floor(Math.log10(Math.max(1e-14, Math.min(...values))));
  const hi = Math.ceil(Math.log10(Math.max(...values)));
  const every = Math.max(1, Math.ceil((hi - lo) / 5));
  const yTicks = [];
  for (let e = hi; e >= lo; e -= every) yTicks.unshift(10 ** e);
  return {
    x: study.rows.map((r) => r.n),
    logX: true,
    logY: true,
    yMin: 10 ** lo,
    yMax: 10 ** hi,
    yTicks,
    xTicks: hw.COMPARE_N,
    decimal,
    series: [
      { values: study.rows.map((r) => pick(r.errors.riemann)), colorIndex: 1 },
      { values: study.rows.map((r) => pick(r.errors.lebesgue)), colorIndex: 0 },
      { values: study.rows.map((r) => pick(r.gaps.riemann)), colorIndex: 1, dashed: true },
      { values: study.rows.map((r) => pick(r.gaps.lebesgue)), colorIndex: 0, dashed: true },
    ],
  };
}

/** The numbers the text of section 2.5 quotes for one function: the winner at the largest n and how the errors fall. */
function compareFacts(study) {
  const rows = study.rows;
  const last = rows[rows.length - 1];
  const slope = (pick) => hw.measuredOrder(rows.map((r) => r.n), rows.map(pick));
  const winner = last.errors.lebesgue < last.errors.riemann ? 'lebesgue' : 'riemann';
  return {
    n: last.n,
    riemann: last.errors.riemann,
    lebesgue: last.errors.lebesgue,
    winner,
    ratio: winner === 'lebesgue' ? last.errors.riemann / last.errors.lebesgue : last.errors.lebesgue / last.errors.riemann,
    riemannOrder: slope((r) => r.errors.riemann),
    lebesgueOrder: slope((r) => r.errors.lebesgue),
    gapOrder: slope((r) => r.gaps.lebesgue),
    riemannInfinite: rows.some((r) => !Number.isFinite(r.gaps.riemann)),
  };
}

/** The second and the last n of the comparison: the overview of section 1.6 shows the errors at these two. */
const SUMMARY_N = Object.freeze([hw.COMPARE_N[1], hw.COMPARE_N[hw.COMPARE_N.length - 1]]);

/** The overview of section 1.6: every function, its two errors at n = K = 9 and 729, the orders measured on all six n, and the winner. */
const summaryRows = (s) =>
  hw.FUNCTIONS.map((key) => {
    const st = s.compare[key];
    const small = st.rows.find((r) => r.n === SUMMARY_N[0]);
    const facts = compareFacts(st);
    return { key, small: small.errors, large: { riemann: facts.riemann, lebesgue: facts.lebesgue }, orders: st.orders, winner: facts.winner, ratio: facts.ratio };
  });

// ---------------------------------------------------------------------------
// Exercise 1, sezione 1.5: i risultati fianco a fianco
// ---------------------------------------------------------------------------

/**
 * The answer of every function to the question of the assignment, do the
 * two approaches reach the same value? Yes for every function Riemann can
 * integrate; for 1/sqrt(x) only as an improper limit; for Dirichlet's
 * function Riemann has no value at all.
 */
const SAME_LIMIT = Object.freeze({ sine: 'yes', square: 'yes', jump: 'yes', vee: 'yes', unbounded: 'improper', indicator: 'yes', sinc: 'yes', oscillating: 'yes', traffic: 'yes', custom: 'unknown', dirichlet: 'noRiemann', thomae: 'yes' });

/**
 * The table of section 1.5: every function with its integral and the two
 * midpoint sums with 729 strips and 729 levels, with their errors and the
 * verdict; the typed function when there is one; then Dirichlet and Thomae
 * from the exact fractions of section 1.8 (their Riemann value is the
 * upper sum with 10,000 strips: the lower one is always 0).
 */
function resultsRows(s, customStudy = null, patho = null) {
  const row = (key, st) => {
    const last = st.rows[st.rows.length - 1];
    return { key, kind: 'regular', n: last.n, reference: st.reference, exact: st.exact !== null, method: st.referenceMethod, uncertainty: st.uncertainty, riemann: last.riemann.midpoint, lebesgue: last.lebesgue.midpoint, errors: last.errors, verdict: SAME_LIMIT[key], capped: st.capped, cap: st.cap };
  };
  const rows = s ? hw.FUNCTIONS.map((key) => row(key, s.compare[key])) : [];
  if (customStudy) rows.push(row(hw.CUSTOM, customStudy));
  if (patho) {
    const d = patho.dirichlet[patho.dirichlet.length - 1];
    const t = patho.thomae[patho.thomae.length - 1];
    rows.push({ key: 'dirichlet', kind: 'dirichlet', n: d.n, reference: 0, exact: true, riemann: null, lower: d.lower, upper: d.upper, lebesgue: 0, errors: { riemann: null, lebesgue: 0 }, verdict: SAME_LIMIT.dirichlet });
    rows.push({ key: 'thomae', kind: 'thomae', n: t.n, reference: 0, exact: true, riemann: t.upper, lower: t.lower, upper: t.upper, lebesgue: 0, errors: { riemann: t.upper, lebesgue: 0 }, verdict: SAME_LIMIT.thomae });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Exercise 1, sezione 1.7: quanto costano
// ---------------------------------------------------------------------------

/** The table of section 1.7: for every function, the first n that brings each approach within each relative accuracy. */
const efficiencyRows = (s) => hw.FUNCTIONS.map((key) => ({ key, reference: s.efficiency[key].reference, targets: s.efficiency[key].targets }));

/**
 * The numbers the text of section 1.7 quotes, for a relative error of 1%:
 * how many times the values of f of Riemann Lebesgue needs, where both get
 * there; where Lebesgue needs fewer levels than Riemann needs strips; where
 * only one of the two gets there with 729.
 */
function efficiencyFacts(s) {
  const rows = hw.FUNCTIONS.map((key) => {
    const t = s.efficiency[key].targets[0];
    return { key, r: t.riemann, l: t.lebesgue };
  });
  const both = rows.filter((x) => x.r && x.l);
  const ratios = both.map((x) => x.l.lebesgue.evaluations / x.r.riemann.evaluations);
  return {
    minRatio: ratios.length ? Math.min(...ratios) : NaN,
    maxRatio: ratios.length ? Math.max(...ratios) : NaN,
    fewerLevels: both.filter((x) => x.l.n < x.r.n).map((x) => x.key),
    onlyLebesgue: rows.filter((x) => !x.r && x.l).map((x) => x.key),
    onlyRiemann: rows.filter((x) => x.r && !x.l).map((x) => x.key),
  };
}

/** The chart of section 1.7: the relative error of the two approaches against the values of f they took, on logarithmic scales. */
function efficiencyChart(study, decimal = '.') {
  const ref = Math.abs(study.reference) || 1;
  const x = [...new Set(study.rows.flatMap((r) => [r.riemann.evaluations, r.lebesgue.evaluations]))].sort((p, q) => p - q);
  const along = (method) =>
    x.map((v) => {
      const row = study.rows.find((r) => r[method].evaluations === v);
      return row && Number.isFinite(row[method].error) ? Math.max(1e-16, row[method].error / ref) : NaN;
    });
  const riemann = along('riemann');
  const lebesgue = along('lebesgue');
  const values = [...riemann, ...lebesgue].filter((v) => Number.isFinite(v));
  const lo = Math.floor(Math.log10(Math.min(...values)));
  const hi = Math.max(lo + 1, Math.ceil(Math.log10(Math.max(...values))));
  const every = Math.max(1, Math.ceil((hi - lo) / 5));
  const yTicks = [];
  for (let e = hi; e >= lo; e -= every) yTicks.unshift(10 ** e);
  const xTicks = [];
  for (let e = 0; 10 ** e <= x[x.length - 1] * 10; e++) xTicks.push(10 ** e);
  return {
    x,
    logX: true,
    logY: true,
    yMin: 10 ** lo,
    yMax: 10 ** hi,
    yTicks,
    xTicks,
    decimal,
    series: [
      { values: riemann, colorIndex: 1 },
      { values: lebesgue, colorIndex: 0 },
    ],
  };
}

// ---------------------------------------------------------------------------
// Exercise 1, sezione 1.8: Dirichlet e Thomae
// ---------------------------------------------------------------------------

/** The fractions in the picture of Thomae's function, and the strips of its upper sum there. */
const THOMAE_Q = 40;
const THOMAE_STRIPS = 10;

let pathologicalCache = null;

/** The sums of section 1.8, computed once: they do not depend on anything the reader changes. */
const pathological = () => {
  if (!pathologicalCache) pathologicalCache = hw.pathologicalStudy();
  return pathologicalCache;
};

/** Thomae's function in a picture: a stem of height 1/q on every p/q with q up to THOMAE_Q, and the staircase of the upper sum with THOMAE_STRIPS strips. */
function thomaeChart(decimal = '.') {
  const bars = [];
  for (let q = 1; q <= THOMAE_Q; q++) {
    for (let p = 0; p <= q; p++) if (hw.gcd(p, q) === 1) bars.push({ from: p / q - 0.0015, to: p / q + 0.0015, value: 1 / q });
  }
  const curve = [];
  for (let i = 0; i < THOMAE_STRIPS; i++) {
    const top = 1 / hw.smallestDenominator(i, THOMAE_STRIPS);
    curve.push([i / THOMAE_STRIPS, top], [(i + 1) / THOMAE_STRIPS, top]);
  }
  return { x0: 0, x1: 1, bars, curve, yMax: 1.05, xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1], decimal };
}

/** The upper sum of the picture: the area under the staircase. */
const thomaeUpper = () => {
  let s = 0;
  for (let i = 0; i < THOMAE_STRIPS; i++) s += 1 / hw.smallestDenominator(i, THOMAE_STRIPS);
  return s / THOMAE_STRIPS;
};

// ---------------------------------------------------------------------------
// 2.6 Il traffico
// ---------------------------------------------------------------------------

/** "21:07" for 21.12 hours. */
function clock(hours) {
  const minutes = Math.round(hours * 60);
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** The traffic of the day in Lebesgue's view: the bands of the thresholds, each over the hours the link stays above it. */
function trafficChart(report, decimal = '.') {
  const d = hw.FUNCTION_DEFS.traffic;
  const levels = [0, ...hw.TRAFFIC_THRESHOLDS];
  return {
    a: d.a,
    b: d.b,
    yMin: 0,
    yMax: 1000,
    curve: curveOf(d.f, d.a, d.b, 24 * 60),
    mode: 'lebesgue',
    strips: [],
    levels,
    sets: report.rows.map((r) => r.intervals),
    xTicks: [0, 3, 6, 9, 12, 15, 18, 21, 24],
    yTicks: [0, 200, 400, 600, 800, 1000],
    decimal,
  };
}

/** The load duration curve: the traffic of the day sorted from the busiest minute, hours on the x axis. */
function durationChart(decimal = '.') {
  const d = hw.FUNCTION_DEFS.traffic;
  const r = hw.rearrangement(d.f, d.a, d.b, 24 * 60);
  const step = 6;
  const x = r.s.filter((_, i) => i % step === 0);
  return {
    x,
    yMin: 0,
    yMax: 1000,
    yTicks: [0, 200, 400, 600, 800, 1000],
    xTicks: [0, 3, 6, 9, 12, 15, 18, 21, 24],
    decimal,
    series: [
      { values: r.values.filter((_, i) => i % step === 0), colorIndex: 0, dots: false },
      ...hw.TRAFFIC_THRESHOLDS.filter((y) => y >= 350).map((y) => ({ values: x.map(() => y), colorIndex: 6, dashed: true })),
    ],
  };
}

// ---------------------------------------------------------------------------
// 2.7 Monte Carlo
// ---------------------------------------------------------------------------

/** The rows of section 2.7: every function, the exact integral, the mean and spread of the estimates, their coverage. */
const mcRows = (s) => hw.FUNCTIONS.map((key) => ({ key, ...s.mc[key] }));

/** The histogram of the estimates of one function, with the normal law of the central limit theorem and the exact value. */
function mcHistogram(s, key, decimal = '.') {
  const m = s.mc[key];
  const lo = m.exact - 4.5 * m.sd;
  const hi = m.exact + 4.5 * m.sd;
  const bins = 36;
  const width = (hi - lo) / bins;
  const counts = new Array(bins).fill(0);
  let outside = 0;
  for (const v of m.estimates) {
    const b = Math.floor((v - lo) / width);
    if (b >= 0 && b < bins) counts[b]++;
    else outside++;
  }
  const total = m.estimates.length;
  const bars = counts.map((c, i) => ({ from: lo + i * width, to: lo + (i + 1) * width, value: c / (total * width), count: c, share: c / total }));
  const curve = Array.from({ length: 121 }, (_, i) => {
    const x = lo + ((hi - lo) * i) / 120;
    return [x, hw.normalDensity(x, m.exact, m.meanSe)];
  });
  return { x0: lo, x1: hi, bars, curve, marker: m.exact, xTicks: hw.niceTicks(lo, hi, 6), decimal, outside };
}

/** The checkpoints of the live example: from 10 to 100000 points, about ten per decade. */
const MC_CHECKPOINTS = Object.freeze(Array.from({ length: 41 }, (_, i) => Math.round(10 ** (1 + i / 10))));

/** A run of the live example: the running estimate of one function, the `run`-th of the seed. */
function mcPath(seed, key, run) {
  const spec = hw.functionOf(key);
  const index = hw.FUNCTIONS.indexOf(key);
  return { key, exact: spec.exact, path: hw.monteCarloPath(spec.f, spec.a, spec.b, MC_CHECKPOINTS, hw.generator(seed, 'mc', 100000 + index * 1000 + run)) };
}

/** The chart of the live example up to the `shown`-th checkpoint: the estimate with its 95% band, and the exact value. The axis covers the whole run from the start, so it stays still while the points arrive. */
function mcPathChart(run, shown, decimal = '.') {
  const { path, exact } = run;
  let lo = exact;
  let hi = exact;
  for (const p of path) {
    if (Number.isFinite(p.se)) {
      lo = Math.min(lo, p.estimate - hw.Z95 * p.se);
      hi = Math.max(hi, p.estimate + hw.Z95 * p.se);
    }
  }
  const pad = (hi - lo) * 0.08 || Math.abs(exact) * 0.1 || 1;
  const yTicks = hw.niceTicks(lo - pad, hi + pad, 5);
  return {
    x: path.map((p) => p.k),
    logX: true,
    yMin: Math.min(lo - pad, yTicks[0]),
    yMax: Math.max(hi + pad, yTicks[yTicks.length - 1]),
    yTicks,
    xTicks: [10, 100, 1000, 10000, 100000],
    decimal,
    series: [
      { values: path.map((p, i) => (i < shown ? p.estimate : null)), band: path.map((p, i) => (i < shown && Number.isFinite(p.se) ? [p.estimate - hw.Z95 * p.se, p.estimate + hw.Z95 * p.se] : null)), colorIndex: 0, dots: false },
      { values: path.map(() => exact), colorIndex: 1, dashed: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// 2.8 Dirichlet
// ---------------------------------------------------------------------------

/** The numbers of the example of section 2.8, as the computer stores them. */
const DIRICHLET_NUMBERS = Object.freeze([
  Object.freeze({ key: 'tenth', value: 0.1 }),
  Object.freeze({ key: 'third', value: 1 / 3 }),
  Object.freeze({ key: 'pi4', value: Math.PI / 4 }),
  Object.freeze({ key: 'sqrt2', value: Math.SQRT2 }),
  Object.freeze({ key: 'e', value: Math.E }),
]);

// ---------------------------------------------------------------------------
// Exercise 2, sezioni 2.1, 2.2 e 2.7 - 2.11: Liouville, erf, le serie, le approssimazioni, il metodo, il confronto
// ---------------------------------------------------------------------------

/** The values of z the chart of the series offers, and how many terms it follows. */
const SERIES_CHOICES = Object.freeze([1, 3, 5, 8]);
const SERIES_TERMS = 120;

/** The chart of section 2.7: the error of the two series against the number of terms at one z, with the bound of the alternating series. */
function seriesChart(z, decimal = '.') {
  const path = hw.seriesPath(z, SERIES_TERMS);
  const pick = (v) => (Number.isFinite(v) ? Math.max(1e-17, v) : NaN);
  const values = path.flatMap((p) => [p.alternating, p.bound, p.positive]).filter((v) => Number.isFinite(v) && v > 0);
  const hi = Math.min(16, Math.max(0, Math.ceil(Math.log10(Math.max(...values)))));
  const lo = -17;
  const every = Math.max(1, Math.ceil((hi - lo) / 6));
  const yTicks = [];
  for (let e = hi; e >= lo; e -= every) yTicks.unshift(10 ** e);
  return {
    x: path.map((p) => p.terms),
    logY: true,
    yMin: 10 ** lo,
    yMax: 10 ** hi,
    yTicks,
    xTicks: [1, 20, 40, 60, 80, 100, 120],
    decimal,
    series: [
      { values: path.map((p) => pick(p.alternating)), colorIndex: 1, dots: false },
      { values: path.map((p) => pick(p.bound)), colorIndex: 1, dashed: true },
      { values: path.map((p) => pick(p.positive)), colorIndex: 0, dots: false },
    ],
  };
}

/** The grid of the chart of the approximations: z from -6 to 6 by 0.02. */
const APPROX_Z = Array.from({ length: 601 }, (_, i) => -6 + i * 0.02);

/** The chart of section 2.8: the signed error of the two formulas of Abramowitz and Stegun along z, with their published bound. */
function approximationChart(decimal = '.') {
  const bound = hw.CDF_ZS.bound;
  return {
    x: APPROX_Z,
    yMin: -1e-7,
    yMax: 1e-7,
    yTicks: [-1e-7, -5e-8, 0, 5e-8, 1e-7],
    xTicks: [-6, -4, -2, 0, 2, 4, 6],
    decimal,
    series: [
      { values: APPROX_Z.map((z) => hw.cdfAS(z) - hw.normalCdf(z)), colorIndex: 0, dots: false },
      { values: APPROX_Z.map((z) => hw.cdfZS(z) - hw.normalCdf(z)), colorIndex: 1, dots: false },
      { values: APPROX_Z.map(() => bound), colorIndex: 6, dashed: true },
      { values: APPROX_Z.map(() => -bound), colorIndex: 6, dashed: true },
    ],
  };
}

/** The largest errors of the two approximations, for the text. */
function approximationFacts() {
  const as = hw.accuracyOf(hw.cdfAS);
  const zs = hw.accuracyOf(hw.cdfZS);
  return { as: as.absolute, asAt: as.absAt, zs: zs.absolute, zsAt: zs.absAt, asBound: hw.ERF_AS.bound / 2, zsBound: hw.CDF_ZS.bound, zsRelative: zs.relative, asTail: hw.cdfAS(-9) };
}

/** The colors and dashes of the methods in the chart of section 2.11. */
const METHOD_STYLE = Object.freeze({
  trapezoid: { colorIndex: 6 },
  simpson: { colorIndex: 3 },
  gauss: { colorIndex: 2 },
  alternating: { colorIndex: 4 },
  positive: { colorIndex: 5 },
  abramowitz: { colorIndex: 0 },
  zelen: { colorIndex: 0, dashed: true },
  ours: { colorIndex: 1 },
});

/** The grid of mpmath: z = -8, -7.9, ..., 8. */
const GRID_Z = Array.from({ length: 161 }, (_, i) => (i - 80) / 10);

/** The chart of section 2.11: the error of every method against mpmath along z, on a logarithmic axis. */
function methodsChart(decimal = '.') {
  const pick = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(1e-17, v)) : 1);
  return {
    x: GRID_Z,
    logY: true,
    yMin: 1e-17,
    yMax: 1,
    yTicks: [1e-16, 1e-12, 1e-8, 1e-4, 1],
    xTicks: [-8, -6, -4, -2, 0, 2, 4, 6, 8],
    decimal,
    series: hw.CDF_METHODS.map((key) => ({ values: GRID_Z.map((z) => pick(Math.abs(hw.cdfBy[key](z) - hw.referencePhi(z)))), dots: false, ...METHOD_STYLE[key] })),
  };
}

let methodsCache = null;

/** The accuracy and the cost of every method, computed once; the times come from the experiments, when they are there. */
function methodsRows(s) {
  if (!methodsCache) methodsCache = hw.CDF_METHODS.map((key) => ({ key, ...hw.accuracyOf(hw.cdfBy[key]), exp: hw.EXP_CALLS[key], terms: hw.termsOf(key) }));
  return methodsCache.map((row) => ({ ...row, time: s ? s.timing[row.key] : null }));
}

/** The numbers the texts of sections 2.9 - 2.11 quote. */
function methodsFacts(s) {
  const rows = methodsRows(s);
  const by = Object.fromEntries(rows.map((r) => [r.key, r]));
  const timed = s ? rows.filter((r) => r.time) : [];
  const fastest = timed.length ? timed.reduce((p, q) => (q.time.median < p.time.median ? q : p)) : null;
  return {
    ours: by.ours,
    gauss: by.gauss,
    abramowitz: by.abramowitz,
    fastest: fastest ? fastest.key : null,
    speedup: s ? by.gauss.time.median / by.ours.time.median : null,
    slowdown: s ? by.ours.time.median / by.abramowitz.time.median : null,
    coverage: s ? by.ours.time.coverage : null,
    switchZ: hw.SWITCH_Z,
    seriesTerms: Math.max(...Array.from({ length: 2 * hw.SWITCH_Z * 10 - 1 }, (_, i) => hw.cdfOursDetail((i + 1 - hw.SWITCH_Z * 10) / 10).terms)),
  };
}

let referenceCache = null;

/** Section 2.10, computed once: the points against NIST and mpmath, and every cell of the NIST table. */
function referenceFacts() {
  if (!referenceCache) referenceCache = { rows: hw.referenceRows(), nist: hw.nistComparison() };
  return referenceCache;
}

// ---------------------------------------------------------------------------
// I test
// ---------------------------------------------------------------------------

const TEST_GROUPS = ['model', 'coverage', 'bias'];

const statTests = hw.statisticalTests;

/**
 * What every test should say, from theory and not from the data: the
 * normal sample fits; the heavy-tailed one does not, when the sample is
 * large enough for the test to see the difference; Monte Carlo is unbiased
 * and its intervals cover 95% for every function with a finite variance,
 * while for 1/sqrt(x) the variance is infinite and the intervals may fall
 * short, depending on how many repetitions there are.
 */
function expectedVerdicts(s) {
  const n = s.params.sample;
  const powerful = (z) => (z > 4 ? 'reject' : 'either');
  // the gap the KS test must see, times sqrt(n), and the excess of the share above 3
  const ksZ = Math.sqrt(n) * s.heavyDistance.distance;
  const p0 = hw.tailDirect(hw.ALARM_K);
  const p1 = hw.heavySf(hw.ALARM_K);
  const tailZ = (p1 - p0) / Math.sqrt((p0 * (1 - p0)) / n);
  const coverage = {};
  const bias = {};
  for (const key of hw.FUNCTIONS) {
    coverage[key] = key === 'unbounded' ? 'either' : 'notReject';
    bias[key] = key === 'unbounded' ? 'either' : 'notReject';
  }
  // KS rejects at 5% above 1.36: with sqrt(n) D a good 2 above that, the rejection is all but certain
  return { model: { ksNormal: 'notReject', tailNormal: 'notReject', ksHeavy: ksZ > 3.4 ? 'reject' : 'either', tailHeavy: powerful(tailZ) }, coverage, bias };
}

/** The overview of section 3: every test, how many reject, how many as expected, and Holm's correction. */
function testSummary(s) {
  const expected = expectedVerdicts(s);
  const all = [];
  for (const [group, list] of Object.entries(statTests(s))) for (const [key, result] of list) all.push({ group, key, result, expected: expected[group][key] });
  const rejected = all.filter((t) => t.result.verdict === 'reject').length;
  const asExpected = all.filter((t) => t.expected === 'either' || (t.expected === 'reject') === (t.result.verdict === 'reject')).length;
  const nullTrue = all.filter((t) => t.expected === 'notReject');
  const falseRejections = nullTrue.filter((t) => t.result.verdict === 'reject');
  // Holm: the smallest p-value against alpha/m, the next against alpha/(m - 1), ...
  const sorted = [...nullTrue].sort((a, b) => a.result.pValue - b.result.pValue);
  let holm = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].result.pValue < hw.SIGNIFICANCE / (sorted.length - i)) holm++;
    else break;
  }
  return { all, count: all.length, rejected, asExpected, nulls: nullTrue.length, falseRejections, holm, holmThreshold: hw.SIGNIFICANCE / Math.max(1, nullTrue.length) };
}

// ---------------------------------------------------------------------------
// Etichette dei grafici
// ---------------------------------------------------------------------------

/** The texts under the pointer: functions of the hit, built from the data of a chart and the words of a language (T = text.tips). */
const tips = {
  area: (state, T) => (hit) => T.piece(state.chart.pieces[hit.index], hit.index, state.sign),
  convergence: (study, T) => (hit) => T.convergence(study.rows[hit.index]),
  newton: (rows, T) => (hit) => T.newton(rows[hit.index]),
  tails: (rows, T) => (hit) => T.tail(rows[hit.index]),
  alarm: (state, chart, T) => (hit) => T.alarm(chart.x[hit.index], state.events),
  ecdf: (chart, T) => (hit) => {
    const [x, F] = chart.points[hit.index];
    return T.ecdf(x, F, hw.cdfStandard(x));
  },
  strip: (chart, T) => (hit) => T.strip(chart.strips[hit.index], chart.kind),
  level: (chart, T) => (hit) => T.level(chart.levels[hit.index - 1], chart.levels[hit.index], (chart.sets[hit.index - 1] || []).reduce((s, [a, b]) => s + b - a, 0), (chart.sets[hit.index - 1] || []).length),
  traffic: (chart, T) => (hit) => T.traffic(chart.levels[hit.index], chart.sets[hit.index - 1] || []),
  distribution: (chart, T) => (hit) => T.distribution(chart.x[hit.index], chart.series[0].values[hit.index]),
  rearrangement: (chart, T) => (hit) => T.rearrangement(chart.x[hit.index], chart.series[1].values[hit.index], chart.series[0].values[hit.index]),
  duration: (chart, T) => (hit) => T.duration(chart.x[hit.index], chart.series[0].values[hit.index]),
  compare: (study, T) => (hit) => T.compare(study.rows[hit.index]),
  histogram: (h, T) => (hit) => {
    const b = h.bars[hit.index];
    return b ? T.estimates(b.from, b.to, b.count, b.share) : null;
  },
  mcPath: (run, T) => (hit) => {
    const p = run.path[hit.index];
    return p ? T.mcPath(p, run.exact) : null;
  },
};

// ---------------------------------------------------------------------------
// Tabelle legate ai grafici
// ---------------------------------------------------------------------------

/** The id of every table tied to a chart: the page and the program find it by id. */
const LINKED_TABLES = Object.freeze({
  convergence: 'hw5-convergence-table',
  newton: 'hw5-newton-table',
  tails: 'hw5-tails-table',
  compare: 'hw5-compare-table',
});

const tableById = (id) => () => document.getElementById(id);

// one row per point of the chart, in the same order
const rowPerPoint = (id) => Object.freeze({ table: tableById(id), row: (hit) => hit.index, point: (row) => row });

/**
 * The links of hw.attachChartTooltip, { table, row, point }: the point
 * under the pointer marks its row of the table, and a row under the
 * pointer outlines its point.
 */
const links = {
  convergence: rowPerPoint(LINKED_TABLES.convergence),
  newton: rowPerPoint(LINKED_TABLES.newton),
  tails: rowPerPoint(LINKED_TABLES.tails),
  compare: rowPerPoint(LINKED_TABLES.compare),
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

return { SECTIONS, tocEntries, AREA, Z_STEPS, zOfIndex, indexOfZ, areaState, bellChart, RULES_N, ruleRows, gaussRows, RULE_CODE, STRATEGY_COLUMNS, strategyTable, strategyFacts, convergenceChart, convergenceFacts, ZTABLE_MARKS, isMarkedZ, quantileRows, NEWTON_P, newtonRows, newtonChart, tailChart, tailFacts, ALARM_EVENTS, ALARM_RATES, ALARM_DEFAULT, ALARM_KS, alarmRows, alarmState, alarmChart, FIELD_LENGTH, DEFAULT_PARAMS, fieldsOf, DEFAULT_INPUTS, readInputs, sameParams, applyInputs, allValid, paramsKey, parseParamsKey, inputBadge, ECDF_WINDOW, ecdfChart, FUNCTION_KEYS, DEFAULT_CUSTOM, RANGE_LENGTH, readCustom, specOf, integralChart, SUM_SIZES, riemannRows, lebesgueRows, referenceOf, distributionChart, rearrangementChart, compareChart, compareFacts, SUMMARY_N, summaryRows, SAME_LIMIT, resultsRows, efficiencyRows, efficiencyFacts, efficiencyChart, THOMAE_Q, THOMAE_STRIPS, pathological, thomaeChart, thomaeUpper, clock, trafficChart, durationChart, mcRows, mcHistogram, MC_CHECKPOINTS, mcPath, mcPathChart, DIRICHLET_NUMBERS, SERIES_CHOICES, SERIES_TERMS, seriesChart, approximationChart, approximationFacts, METHOD_STYLE, methodsChart, methodsRows, methodsFacts, referenceFacts, TEST_GROUPS, statTests, expectedVerdicts, testSummary, tips, LINKED_TABLES, links, scheduleFrameJob };
})();

var texts$ = (function () {
'use strict';

// src/pages/statistics/hw5/texts.js
// I testi dell'Homework #5 in italiano e in inglese. Li usano sia la pagina
// del sito sia il programma scaricabile, cosi' le due versioni dicono le
// stesse cose con le stesse parole. Ogni numero arriva dagli argomenti (i
// risultati dei calcoli e delle simulazioni) o dalle costanti della
// libreria: nessuna frase contiene un risultato scritto a mano.
const { ALARM_K, CONFIDENCE, DARBOUX_SAMPLES, FORMULA_MAX, FORMULA_NAMES, FUNCTIONS, HANDFUL, HEAVY_DF, LEVEL_CELLS, LIMITS, SIGNIFICANCE, TRAFFIC, TRUNCATIONS, heavySf, tailDirect } = Homework5;
const { NEWTON_P, RULES_N, clock } = view$;

/** Number formatting of one language: decimal and thousands separators, the "not available" marker, the multiplication sign. */
function formatters(decimal, thousands, na, times) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const sci = (v, digits = 1) => {
    if (missing(v)) return na;
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '-∞';
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
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '-∞';
    const [whole, part] = Math.abs(v).toFixed(digits).split('.');
    const negative = v < 0 && Math.abs(v) >= 0.5 * 10 ** -digits;
    return `${negative ? '-' : ''}${group(whole)}${part ? `${decimal}${part}` : ''}`;
  };
  // significant digits, for numbers of any size
  const sig = (v, digits = 6) => {
    if (missing(v)) return na;
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '-∞';
    if (v === 0) return '0';
    if (Math.abs(v) >= 1e15 || Math.abs(v) < 1e-5) return sci(v, digits - 1);
    const s = String(Number(v.toPrecision(digits)));
    const [whole, part] = s.replace('-', '').split('.');
    return `${v < 0 ? '-' : ''}${group(whole)}${part ? `${decimal}${part}` : ''}`;
  };
  return {
    na,
    decimal,
    int: (v) => (missing(v) ? na : `${v < 0 ? '-' : ''}${group(String(Math.round(Math.abs(Number(v)))))}`),
    num,
    sig,
    // a number as written in the code or in a field: 0.2 -> 0,2
    plain: (v) => (missing(v) ? na : local(String(v))),
    pval: (v) => (missing(v) ? na : v === 0 ? `< ${local('1e-300')}` : v < 0.001 ? sci(v) : local(v.toFixed(3))),
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
    // an error: 0, or a power of ten
    err: (v) => (missing(v) ? na : v === 0 ? '0' : !Number.isFinite(v) ? '∞' : sci(v)),
    sci,
    ms: (v) => (missing(v) ? na : v >= 1000 ? `${local((v / 1000).toFixed(2))} s` : `${Math.max(1, Math.round(v))} ms`),
    // a short duration: 0,4 µs, 12 µs, 3,1 ms
    dur: (v) => (missing(v) ? na : v < 0.01 ? `${local((v * 1000).toFixed(1))} µs` : v < 1 ? `${Math.round(v * 1000)} µs` : `${local(v.toFixed(1))} ms`),
    pow: (e) => `10^${e}`,
    // a number of events: 10^6 for a million
    events: (v) => `10^${Math.round(Math.log10(v))}`,
    // cents: 1,85 € or € 1.85
    euro: (cents) => (decimal === ',' ? `${local((cents / 100).toFixed(2))} €` : `€ ${(cents / 100).toFixed(2)}`),
  };
}

/** A name inside a sentence: the first letter in lower case ("traffico di un giorno"). */
const inline = (name) => name.charAt(0).toLowerCase() + name.slice(1);

/** The value of a coin, as it is written on it: 1 c, 50 c, 1 €, 2 €. */
const coinLabel = (cents) => (cents >= 100 ? `${cents / 100} €` : `${cents} c`);

/** The notes of the course that the assignment links. */
const NOTES_URL = 'https://faculty.etsu.edu/gardnerr/4047/notes-Hogg-McKean-Craig/Hogg-McKean-Craig-3-4.pdf';

/**
 * The assignment as the professor wrote it, in English. The only changes:
 * the lists are laid out as lists, the long dashes of the two titles are
 * written as hyphens, and the line of dashes between the two exercises is
 * left out.
 */
const originalAssignment = () => [
  { type: 'title', text: 'HOMEWORK' },
  { type: 'title', text: 'Es 1 - Riemann and Lebesgue Integration' },
  { type: 'p', text: 'Choose a collection of interesting functions f1, f2, ... and compute their integrals numerically. Approximate the integrals using approaches inspired by both the Riemann definition (partitioning the domain into subintervals) and the Lebesgue definition (partitioning the range of function values into measurable subsets and considering their preimages in the domain).' },
  { type: 'p', text: 'Compare the two numerical approaches in terms of accuracy, convergence, and computational efficiency.' },
  { type: 'p', text: 'For functions that are Riemann-integrable, compare the numerical results and discuss whether the two approaches converge to the same value.' },
  { type: 'p', text: 'Include examples of functions for which the two approaches behave differently, if possible.' },
  { type: 'p', text: 'Examples:' },
  { type: 'list', items: ['f(x) = sin(x), x in [0, pi]', 'f(x) = x^2, x in [0, 1]', 'f(x) = 1 if x < 0.5, 3 if x >= 0.5, x in [0, 1]', 'f(x) = |x - 0.5|, x in [0, 1]', 'f(x) = 1 / sqrt(x), x in (0, 1]', 'f(x) = 1 if x < 0.5, 0 if x >= 0.5, x in [0, 1]', 'f(x) = sin(x) / x, x in [0, pi]'] },
  { type: 'p', text: '"Pathological" functions:' },
  { type: 'list', items: ['f(x) = 1 if x is rational, 0 if x is irrational, x in [0, 1] (Dirichlet function)', "f(x) = 1/q if x = p/q in lowest terms, 0 if x is irrational, x in [0, 1] (Thomae's function)", '...'] },
  { type: 'title', text: 'Es 2 - Numerical Computation of the Normal CDF' },
  { type: 'p', text: 'Develop an efficient numerical method to compute the cumulative distribution function (CDF) of the standard normal distribution.' },
  { type: 'p', text: "Implement the method and evaluate the CDF at several points, comparing the results with a trusted numerical reference found on the web. Investigate the numerical efficiency and accuracy of your implementation. Explain why the normal CDF cannot be expressed in terms of elementary functions, discussing the mathematical result behind this fact (Liouville's theorem)." },
  { type: 'p', text: 'Explain how the introduction of special functions, such as the error function (erf), provides an exact analytical representation of the CDF, and why numerical methods are still necessary for its practical computation.' },
  { type: 'p', text: 'Explore possible numerical approaches, such as numerical integration, series expansions, or approximations based on the error function.' },
  { type: 'link', text: NOTES_URL, href: NOTES_URL },
  { type: 'p', text: 'examples of approaches:' },
  { type: 'list', items: ["Numerical integration: using the trapezoidal rule or Simpson's rule.", 'Series expansion: using the power series expansion of the error function.', 'Error function (erf): using the mathematical relationship between the normal CDF and the error function.', '...'] },
];


// ---------------------------------------------------------------------------
// Le formule, scritte una volta: le parole cambiano con la lingua
// ---------------------------------------------------------------------------

const CDF_FORMULAS = [
  'F(x) = P(X ≤ x) = ∫_(-∞)^x 1/(σ√(2π)) e^(-(t - μ)²/(2σ²)) dt = Φ((x - μ)/σ)',
  'Φ(z) = ∫_(-∞)^z φ(t) dt,        φ(t) = e^(-t²/2)/√(2π)',
].join('\n');

const ruleFormulas = (w) =>
  [
    'h = (b - a)/n,   x_i = a + i h',
    `${w.left.padEnd(16)} h [f(x_0) + f(x_1) + ... + f(x_(n-1))]                       ${w.error} O(h)`,
    `${w.midpoint.padEnd(16)} h [f(x_(1/2)) + f(x_(3/2)) + ... + f(x_(n-1/2))]             ${w.error} O(h²)`,
    `${w.trapezoid.padEnd(16)} h [f(x_0)/2 + f(x_1) + ... + f(x_(n-1)) + f(x_n)/2]          ${w.error} O(h²)`,
    `${w.simpson.padEnd(16)} h/3 [f(x_0) + 4f(x_1) + 2f(x_2) + ... + 4f(x_(n-1)) + f(x_n)]   ${w.error} O(h⁴), n ${w.even}`,
    `${w.gauss.padEnd(16)} (b - a)/2 Σ w_i f((a + b)/2 + (b - a)/2 t_i)                ${w.exact}`,
  ].join('\n');

const strategyFormulas = (w) =>
  [
    `${w.symmetry.padEnd(14)} Φ(z) = 1/2 + ∫_0^z φ(t) dt                     (z ≥ 0;  z < 0: 1/2 - ∫_z^0 φ(t) dt)`,
    `${w.truncation.padEnd(14)} Φ(z) ≈ ∫_(-L)^z φ(t) dt                      (${w.leftOut} Φ(-L))`,
    `${w.substitution.padEnd(14)} t = z - (1 - u)/u,  dt = du/u²:  Φ(z) = ∫_0^1 φ(z - (1 - u)/u) du/u²`,
  ].join('\n');

const NEWTON_FORMULAS = [
  'Φ(z_p) = p,   Φ′(z) = φ(z)',
  'z_(k+1) = z_k - (Φ(z_k) - p)/φ(z_k)',
  'q = 1 - p:   w_(k+1) = w_k + (P(Z > w_k) - q)/φ(w_k),   z_p = w',
].join('\n');

const RIEMANN_FORMULAS = [
  'a = x_0 < x_1 < ... < x_n = b,   t_i ∈ [x_(i-1), x_i]',
  'S = Σ_(i=1)^n f(t_i) (x_i - x_(i-1))',
  'm_i = inf_[x_(i-1), x_i] f,   M_i = sup_[x_(i-1), x_i] f',
  'L = Σ m_i (x_i - x_(i-1))  ≤  S  ≤  U = Σ M_i (x_i - x_(i-1))',
].join('\n');

const lebesgueFormulas = (w) =>
  [
    `m = y_0 < y_1 < ... < y_K = M,   E_k = {x : f(x) ≥ y_k},   μ = ${w.measure}`,
    'L_K = m (b - a) + Σ_(k=1)^K (y_k - y_(k-1)) μ(E_k)',
    'U_K = m (b - a) + Σ_(k=1)^K (y_k - y_(k-1)) μ(E_(k-1)),      U_K - L_K = (M - m)(b - a)/K',
    `∫ f dμ = ∫_0^∞ μ{f > y} dy      (f ≥ 0: ${w.layer})`,
  ].join('\n');

const MC_FORMULAS = [
  '∫_a^b f(x) dx = (b - a) E[f(U)],   U ~ U(a, b)',
  'Î_N = (b - a)/N Σ_(i=1)^N f(U_i),   SE = (b - a) s_N/√N,   Î_N ± 1,96 SE',
].join('\n');

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', '×');

/** The line of numbers under a hypothesis test, whatever its kind. */
function testLineIt(t) {
  const F = IT;
  switch (t.kind) {
    case 'ks':
      return `D = ${F.num(t.D, 4)} su ${F.int(t.n)} valori (scarto massimo a x = ${F.num(t.at, 2)}), √n D corretto = ${F.num(t.statistic, 3)}, p = ${F.pval(t.pValue)}`;
    case 'proportion':
      return `${F.int(t.count)} su ${F.int(t.m)}, cioè ${F.pct(t.rate, 3)} contro ${F.pct(t.expected, 3)}, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'bias':
      return `media delle stime ${F.sig(t.mean, 7)} contro ${F.sig(t.expected, 7)} su ${F.int(t.m)} ripetizioni, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

/** How the reference integral of a table was obtained: exact, or one of the two estimates of referenceIntegral. */
const refIt = (ref) => (ref.exact ? 'esatto' : ref.method === 'composite' ? `di riferimento (Gauss composta, ± ${IT.err(ref.uncertainty)})` : 'secondo Simpson adattivo');

const ruleNamesIt = { left: 'Rettangoli', midpoint: 'Punti medi', trapezoid: 'Trapezi', simpson: 'Simpson', gauss: 'Gauss-Legendre' };
// i nomi dentro una frase: "con i trapezi", "con Simpson"
const ruleInlineIt = { left: 'i rettangoli', midpoint: 'i punti medi', trapezoid: 'i trapezi', simpson: 'Simpson', gauss: 'Gauss-Legendre' };
const functionNamesIt = { sine: 'sin x su [0, π]', square: 'x² su [0, 1]', jump: 'Gradino da 1 a 3', vee: '|x - 0,5|', unbounded: '1/√x', indicator: 'Gradino da 1 a 0', sinc: 'sin(x)/x su [0, π]', oscillating: 'sin(1/x)', traffic: 'Traffico di un giorno', custom: 'Scritta da voi', dirichlet: 'Dirichlet', thomae: 'Thomae' };
const methodNamesIt = { trapezoid: 'Trapezi, n = 64', simpson: 'Simpson, n = 64', gauss: 'Gauss-Legendre, 64 nodi', alternating: 'Serie degli appunti', positive: 'Serie a termini positivi', abramowitz: 'Abramowitz-Stegun 7.1.26', zelen: 'Zelen-Severo 26.2.17', ours: 'Metodo della pagina' };

const it = {
  fmt: IT,
  formulas: {
    cdf: CDF_FORMULAS,
    rules: ruleFormulas({ left: 'rettangoli', midpoint: 'punti medi', trapezoid: 'trapezi', simpson: 'Simpson', gauss: 'Gauss-Legendre', error: 'errore', even: 'pari', exact: 'esatta fino al grado 2n - 1' }),
    strategies: strategyFormulas({ symmetry: 'simmetria', truncation: 'troncamento', substitution: 'sostituzione', leftOut: 'resta fuori' }),
    newton: NEWTON_FORMULAS,
    riemann: RIEMANN_FORMULAS,
    lebesgue: lebesgueFormulas({ measure: 'lunghezza totale', layer: 'la torta a strati' }),
    montecarlo: MC_FORMULAS,
  },
  ui: {
    index: 'Indice',
    indexTitle: 'Indice dell’homework',
    close: 'Chiudi',
    backToTop: 'Torna su',
    computing: 'Calcolo in corso...',
    language: 'Lingua',
    error: (m) => `Errore: ${m}`,
  },
  sections: {
    assignment: '0. La consegna',
    exercise1: 'Esercizio 1 - Integrale di Riemann e di Lebesgue',
    idea: '1.1 Due modi di contare',
    tryCoins: 'Prova: le monete di Lebesgue',
    functions: '1.2 Le funzioni',
    riemann: '1.3 Riemann: strisce verticali',
    lebesgue: '1.4 Lebesgue: fette orizzontali',
    trySlices: 'Prova: verticale o orizzontale',
    results: '1.5 I risultati, fianco a fianco',
    compare: '1.6 Precisione e convergenza',
    efficiency: '1.7 Quanto costano',
    pathological: '1.8 Dove le due strade si separano: Dirichlet e Thomae',
    traffic: '1.9 Il traffico di un server',
    montecarlo: '1.10 Monte Carlo, il Lebesgue dei dadi',
    tryMc: 'Prova: Monte Carlo dal vivo',
    exercise2: 'Esercizio 2 - La funzione di ripartizione della normale',
    liouville: '2.1 Perché non c’è una formula: Liouville',
    erf: '2.2 erf: una formula esatta che va comunque calcolata',
    area: '2.3 La CDF è un’area',
    tryArea: 'Prova: l’area sotto la campana',
    rules: '2.4 Cinque modi di sommare fette',
    infinity: '2.5 Il problema di -∞',
    convergence: '2.6 Quanti punti servono',
    series: '2.7 Le serie: quella degli appunti e quella a termini positivi',
    approximations: '2.8 Le approssimazioni costruite su erf',
    ours: '2.9 Un metodo efficiente',
    reference: '2.10 Il confronto con un riferimento dal web',
    methods: '2.11 Precisione e velocità di ogni metodo',
    table: '2.12 La tavola della normale, ricostruita',
    quantiles: '2.13 All’indietro: i quantili',
    tails: '2.14 Le code lontane e le soglie d’allarme',
    tryAlarm: 'Prova: la soglia d’allarme',
    data: '2.15 Il modello alla prova dei dati',
    checks: '3. Verifiche',
    tests: '4. I test d’ipotesi',
    history: '5. Il contesto storico',
    conclusion: '6. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna ha due esercizi. Il primo chiede di scegliere una collezione di funzioni interessanti e di integrarle numericamente con due approcci ispirati alle due definizioni: quella di Riemann, che divide il dominio in intervalli, e quella di Lebesgue, che divide l’insieme dei valori e ne misura le controimmagini; poi di confrontarli per precisione, convergenza e costo, di discutere se arrivano allo stesso valore e di mostrare dove si comportano diversamente. Il secondo chiede un metodo efficiente per la funzione di ripartizione della normale standard, da confrontare con un riferimento affidabile trovato sul web, insieme alle ragioni per cui non ha una formula elementare (il teorema di Liouville) e al ruolo della funzione degli errori erf.',
      'La pagina procede per esempi, con ogni numero calcolato qui. L’Esercizio 1 integra le nove funzioni della consegna e due della pagina e ne mette i risultati fianco a fianco (1.5), misura come convergono (1.6) e quanto costano (1.7), e calcola Dirichlet e Thomae con le frazioni esatte (1.8). L’Esercizio 2 parte da Liouville e da erf (2.1, 2.2), prova l’integrazione numerica, le serie e le approssimazioni dei manuali (2.3 - 2.8), ne ricava un metodo efficiente (2.9), lo confronta con la tavola del NIST e con mpmath (2.10) e misura precisione e velocità di tutti i metodi (2.11).',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese: gli elenchi sono impaginati come elenchi, i trattini lunghi dei due titoli sono scritti come trattini corti e la riga di trattini fra i due esercizi è tolta.',
  },
  exercise2: {
    intro: [
      'X ~ N(μ, σ²) ha densità a campana e funzione di ripartizione F(x) = P(X ≤ x), l’area sotto la campana a sinistra di x. Ogni N(μ, σ²) si riporta alla normale standard con z = (x - μ)/σ, quindi basta saper calcolare Φ. Quell’area non ha una formula elementare (2.1), e la funzione erf la scrive in modo esatto senza calcolarla (2.2). Per calcolarla la pagina prova le tre famiglie di metodi della consegna, l’integrazione numerica (2.3 - 2.6), le serie (2.7) e le approssimazioni costruite su erf (2.8), ne ricava un metodo efficiente (2.9), lo confronta con un riferimento trovato sul web (2.10) e misura precisione e velocità di tutti (2.11). Le ultime sezioni la mettono al lavoro: la tavola, i quantili, le soglie d’allarme, un test contro dati simulati.',
    ],
  },
  area: {
    intro: [
      'Il grafico è la densità della normale standard e l’area colorata è Φ(1,96) = 0,975: la probabilità che una normale stia sotto 1,96 deviazioni standard dalla media, il numero dietro a ogni intervallo di confidenza al 95%. Integrare numericamente vuol dire sostituire quell’area con pezzi di cui si sa calcolare l’area: rettangoli, trapezi, archi di parabola.',
    ],
    chartTitle: 'La densità della normale standard e Φ(1,96) = 0,975, l’area colorata',
  },
  tryArea: {
    intro: [
      'Scegliete μ, σ e il punto x, la regola e il numero di pezzi n. Con la simmetria i pezzi coprono [μ, x] e la metà a sinistra di μ vale 1/2 senza calcoli; con il troncamento coprono [μ - 4σ, x], e quello che sta a sinistra di μ - 4σ (3,2 × 10^-5) resta fuori. Passate sopra un pezzo per vederne l’area. Provate Simpson con n = 2, poi Gauss con 2 nodi: con gli stessi due valori della funzione, Gauss sbaglia molto meno.',
    ],
    muLabel: 'μ',
    sigmaLabel: 'σ',
    zLabel: (x, z) => `x = ${IT.num(x, 2)}  (z = ${IT.num(z, 2)})`,
    ruleLabel: 'Regola',
    nLabel: (n, rule) => (rule === 'gauss' ? `n = ${n} nodi` : `n = ${n} pezzi`),
    strategyLabel: '-∞',
    strategies: { symmetry: 'Simmetria', truncation: 'Troncamento a -4σ' },
    result: (st, rule) => {
      const F = IT;
      const how = st.base ? `1/2 ${st.sign > 0 ? '+' : '-'} ${F.num(st.sum, 8)}` : F.num(st.sum, 8);
      return `F(${F.num(st.x, 2)}) ≈ ${how} = ${F.num(st.value, 8)} con ${ruleInlineIt[rule]} e n = ${st.n} (${st.evaluations} valori della densità). Valore esatto ${F.num(st.exact, 8)}, errore ${F.err(st.error)}.`;
    },
    chartTitle: (st, rule) => `F(${IT.num(st.x, 2)}) con ${ruleInlineIt[rule]}, n = ${st.n}`,
  },
  rules: {
    intro: [
      'Cinque regole, dalla più ingenua alla più furba. Le prime quattro usano punti equidistanti: i rettangoli prendono il valore all’estremo sinistro di ogni pezzo, i punti medi quello al centro, i trapezi uniscono i due estremi con un segmento, Simpson tre punti con un arco di parabola. Gauss-Legendre sceglie invece dove valutare la funzione: n nodi e n pesi calcolati perché la regola sia esatta per ogni polinomio di grado fino a 2n - 1.',
    ],
    formulasTitle: 'Le cinque regole su [a, b]',
    codeTitle: 'Il codice: integrate() di homework5.js, una riga per regola',
    tableTitle: (n) => `Φ(1,96) con n = ${n}: valore, errore e valori della densità usati`,
    cols: { rule: 'Regola', n: 'n', evaluations: 'Valori di φ', value: 'Φ(1,96) calcolata', error: 'Errore' },
    gaussTitle: 'Gauss-Legendre con 5 nodi su [-1, 1]: le radici del polinomio di Legendre P_5 e i loro pesi',
    gaussCols: { i: 'i', node: 'Nodo t_i', weight: 'Peso w_i' },
    after: (rows) => {
      const F = IT;
      const g = rows.find((r) => r.rule === 'gauss');
      const s = rows.find((r) => r.rule === 'simpson');
      const l = rows.find((r) => r.rule === 'left');
      return [`Con ${RULES_N} pezzi i rettangoli sbagliano di ${F.err(l.error)}, Simpson di ${F.err(s.error)}, Gauss con ${g.n} nodi ${g.error === 0 ? 'non sbaglia nessuna cifra: il risultato coincide con il riferimento fino all’ultima' : `di ${F.err(g.error)}`}. Non è magia: φ è una funzione liscissima, e Gauss sfrutta tutta la sua regolarità. Nel grafico di Gauss ogni nodo sta dentro un rettangolo largo quanto il suo peso: anche Gauss è una somma di Riemann, con strisce e punti scelti bene.`];
    },
  },
  infinity: {
    intro: [
      'Il limite inferiore di Φ è -∞, e nessuna regola integra su un intervallo infinito. Tre modi per aggirarlo. La simmetria: φ è pari e l’area totale è 1, quindi la metà sinistra vale 1/2 esatto e resta da integrare solo [0, z]. Il troncamento: ci si ferma a -L e si accetta di perdere Φ(-L). La sostituzione: un cambio di variabile porta (-∞, z] su (0, 1], e l’integranda va a zero all’estremo.',
    ],
    formulasTitle: 'Tre modi di evitare -∞',
    chooseLabel: 'Regola',
    tableTitle: (rule, n) => `Errore su Φ(z) con ${rule === 'gauss' ? `Gauss-Legendre, ${n} nodi` : `Simpson, n = ${n}`}`,
    cols: { z: 'z', reference: 'Φ(z)', symmetry: 'Simmetria', trunc4: `Troncamento a -${TRUNCATIONS[0]}`, trunc8: `Troncamento a -${TRUNCATIONS[1]}`, substitution: 'Sostituzione' },
    after: (f) => {
      const F = IT;
      return [
        `Con ${f.n} nodi di Gauss la simmetria sbaglia al massimo di ${F.err(f.gauss[0])}: integra sull’intervallo più corto e la metà sinistra la conosce esatta. Il troncamento a -${TRUNCATIONS[0]} non scende mai sotto ${F.err(f.leftOut4)}, l’area che lascia fuori, qualunque regola si usi; a -${TRUNCATIONS[1]} quell’area è ${F.err(f.leftOut8)}, ma l’intervallo è lungo e servono più punti (errore fino a ${F.err(f.gauss[2])}). La sostituzione non perde niente per strada, ma comprime la campana vicino a u = 1 e con pochi punti fa peggio (fino a ${F.err(f.gauss[3])}).`,
        'La lezione pratica: prima di aumentare i punti conviene sfruttare quello che si sa della funzione. Qui una sola osservazione, la simmetria, vale più di mille punti in più.',
      ];
    },
  },
  convergence: {
    intro: [
      'Quanti punti servono? Il grafico misura l’errore su Φ(1,96) raddoppiando n, su scale logaritmiche: ogni regola diventa una retta, con pendenza pari al suo ordine. I rettangoli dimezzano l’errore quando si raddoppiano i punti, punti medi e trapezi lo dividono per 4, Simpson per 16; Gauss-Legendre scende ancora più in fretta, finché incontra il pavimento degli arrotondamenti dei numeri a 64 bit, intorno a 10^-16.',
    ],
    chartTitle: (z) => `Errore su Φ(${IT.num(z, 2)}) al crescere di n (scale logaritmiche)`,
    tableTitle: 'Errore per n raddoppiato',
    cols: { n: 'n' },
    after: (f) => {
      const F = IT;
      const order = (r) => F.num(f.orders[r], 2);
      return [
        `Gli ordini misurati sulle rette sono ${order('left')} per i rettangoli, ${order('midpoint')} per i punti medi, ${order('trapezoid')} per i trapezi e ${order('simpson')} per Simpson, come dice la teoria (1, 2, 2, 4). Per avere dieci decimali giusti Simpson usa ${F.int(f.enough.simpson)} valori di φ e Gauss ${F.int(f.enough.gauss)}; i rettangoli non ci arrivano nemmeno con 16.384 (errore ${F.err(f.left16384)}), i punti medi neppure (${F.err(f.midpoint16384)}).`,
        'Due avvertenze pratiche. Oltre il pavimento più punti non aiutano: l’errore risale, perché si sommano più arrotondamenti. E l’ordine vale per funzioni lisce: con un salto o un angolo anche Simpson torna al primo ordine, come si vede nell’Esercizio 1.',
      ];
    },
  },
  table: {
    intro: [
      'In fondo a ogni libro di statistica c’è la tavola di Φ(z): righe per la prima cifra decimale di z, colonne per la seconda. Qui la ricostruiamo: Φ(0) = 1/2, poi un arco di parabola di Simpson per ogni passo di 0,01, sommato al precedente. Due valori di φ per cella. Passate sopra le celle evidenziate: sono gli z dei quantili più usati.',
    ],
    title: (zt) => `Φ(z) per z = riga + colonna, ${IT.int(zt.evaluations)} valori di φ in tutto`,
    after: (zt) => {
      const cell = (z) => zt.table[Math.floor(Math.round(z * 100) / 10)].cells[Math.round(z * 100) % 10].value;
      return [`La cella peggiore sbaglia di ${IT.err(zt.maxError)} (a z = ${IT.num(zt.at, 2)}): ben sotto la mezza unità della quarta cifra, l’ultima che la tavola stampa. Il valore ${IT.num(cell(1.96), 4)} nella riga 1,9 e colonna ,06 è l’1,96 degli intervalli al 95%; 0,95 cade fra ${IT.num(cell(1.64), 4)} (1,64) e ${IT.num(cell(1.65), 4)} (1,65), ed è da lì che viene 1,645.`];
    },
  },
  quantiles: {
    intro: [
      'La tavola si usa anche all’indietro: dato p, trovare z_p con Φ(z_p) = p. È un’equazione, e il metodo di Newton la risolve usando la derivata di Φ, che è φ, nota esattamente: ogni passo corregge z dell’errore diviso la pendenza. Per non perdere cifre nella coda conviene lavorare sulla probabilità più piccola, q = 1 - p, integrata direttamente.',
    ],
    formulasTitle: 'Il metodo di Newton per il quantile',
    tableTitle: 'I quantili della normale, trovati all’indietro',
    cols: { p: 'p', z: 'z_p con Newton', steps: 'Passi', reference: 'Riferimento', difference: 'Differenza' },
    newtonTitle: (p) => `Newton passo per passo per p = ${IT.plain(p)}, partendo da z = 0`,
    newtonCols: { k: 'Passo', z: 'z_k', F: 'Φ(z_k)', dz: 'Correzione', error: 'Errore' },
    chartTitle: 'Errore di z_k dopo ogni passo (scala logaritmica)',
    after: (rows) => {
      const last = rows.find((r) => r.p === NEWTON_P);
      return [`z_0,975 = ${IT.num(last.z, 12)} è l’1,96 dell’Homework #4: lo moltiplicavamo per l’errore standard per avere gli intervalli al 95%. Nei primi passi Newton avanza lento, perché la campana si appiattisce; vicino alla radice ogni passo raddoppia le cifre giuste, come mostra la retta sempre più ripida del grafico.`];
    },
  },
  tails: {
    intro: [
      'Lontano nella coda le probabilità diventano minuscole, e il modo di calcolarle conta. Viene naturale calcolare P(Z > k) come 1 - Φ(k), ma Φ(k) è vicinissimo a 1 e la sottrazione cancella le cifre: è la stessa cancellazione della formula da manuale della varianza nell’Homework #4. Integrando direttamente la coda, Φ(-k) con la sostituzione, non si sottrae niente.',
    ],
    tableTitle: 'P(Z > k) nei due modi, con l’errore relativo',
    cols: { k: 'k', reference: 'P(Z > k)', subtraction: '1 - Φ(k)', subtractionError: 'Errore', direct: 'Diretta', directError: 'Errore' },
    chartTitle: 'Errore relativo dei due modi al crescere di k (scala logaritmica)',
    legend: ['1 - Φ(k)', 'coda integrata direttamente'],
    after: (f) => {
      const F = IT;
      return [`La sottrazione perde la sesta cifra da k = ${f.micro} e da k = ${f.total} sbaglia di più del 50%: a k = 8 dà ${F.sci(f.at8.subtraction)} invece di ${F.sci(f.at8.reference)}, a k = 9 ${F.sci(f.at9.subtraction)} invece di ${F.sci(f.at9.reference)}. La coda diretta non sbaglia mai più di ${F.err(f.worstDirect)} in relativo.`];
    },
    alarmIntro: [
      'A cosa serve una coda così lontana? A un sistema che segnala anomalie: un IDS che allarma quando il numero di richieste al minuto, i byte di una sessione o il tempo di risposta di un login superano la media di k deviazioni standard. Se i dati sono normali, la frazione di eventi legittimi segnalati per errore è proprio P(Z > k), e con un milione di eventi al giorno anche 10^-6 vuol dire un falso allarme al giorno.',
    ],
    alarmTitle: 'Soglie a k deviazioni standard, con un milione di eventi al giorno',
    alarmCols: { k: 'k', normal: 'Falsi allarmi, dati normali', normalPerDay: 'Al giorno', heavy: `Code pesanti (t di Student, ${HEAVY_DF} g.d.l.)`, heavyPerDay: 'Al giorno', ratio: 'Rapporto' },
    alarmAfter: (rows) => {
      const r3 = rows.find((r) => r.k === 3);
      const r5 = rows.find((r) => r.k === 5);
      return [`Il guaio è che la soglia giusta dipende dalla coda, e le code dei dati veri raramente sono normali. Con dati a code pesanti (una t di Student con ${HEAVY_DF} gradi di libertà, riscalata per avere la stessa media e la stessa varianza) la regola dei tre sigma segnala ${IT.num(r3.ratio, 1)} volte più eventi del previsto, e a 5 sigma ${IT.int(r5.ratio)} volte: la soglia d’allarme calcolata sulla normale sommerge chi la usa di falsi allarmi. La sezione 1.8 mostra come accorgersene dai dati.`];
    },
  },
  tryAlarm: {
    intro: [
      'Dite quanti eventi passano al giorno e quanti falsi allarmi siete disposti a sopportare: la pagina trova la soglia k con il metodo di Newton sulla coda integrata direttamente, e mostra cosa succederebbe con le stesse soglie se i dati avessero code pesanti.',
    ],
    eventsLabel: 'Eventi al giorno',
    rateLabel: 'Falsi allarmi accettati',
    rates: { tenDay: '10 al giorno', day: '1 al giorno', week: '1 a settimana', month: '1 al mese' },
    result: (st) => {
      const F = IT;
      return `Con ${F.events(st.events)} eventi al giorno, P(Z > k) deve valere ${F.sci(st.target)}: la soglia è k = ${F.num(st.k, 4)} deviazioni standard (${st.steps} passi di Newton). Se i dati hanno code pesanti, la stessa soglia dà ${F.num(st.heavyPerDay, 1)} falsi allarmi al giorno invece di ${F.sig(st.perDay, 3)}.`;
    },
    chartTitle: 'P(Z > k) per la normale e per i dati a code pesanti, con la frequenza accettata tratteggiata (scala logaritmica)',
    legend: ['dati normali', `code pesanti, t con ${HEAVY_DF} g.d.l.`, 'frequenza accettata'],
  },
  data: {
    intro: [
      'Una CDF calcolata si può mettere alla prova contro dei dati. Qui i dati sono simulati con il metodo di Box e Muller, che trasforma coppie di numeri uniformi in coppie di normali indipendenti; il test di Kolmogorov e Smirnov misura lo scarto massimo D fra la funzione di ripartizione empirica dei dati e la nostra Φ numerica. Lo stesso test, sui dati a code pesanti della sezione 1.7, deve accorgersi che non sono normali: è il controllo da fare prima di fidarsi di una soglia.',
    ],
    fieldsIntro: 'Il seme e il numero di valori simulati; gli stessi semi alimentano anche Monte Carlo nella sezione 1.10.',
    seedLabel: 'Seme',
    seedHint: `da 0 a ${IT.int(LIMITS.seed[1])}`,
    sampleLabel: 'Valori simulati n',
    sampleHint: `da ${IT.int(LIMITS.sample[0])} a ${IT.int(LIMITS.sample[1])}`,
    randomSeed: 'Seme a caso',
    restore: 'Valori della pagina',
    stale: 'Un campo non è valido: i risultati restano quelli degli ultimi valori validi.',
    pending: 'Nuova simulazione in corso...',
    badgeTask: 'Valori della pagina: seme 2026, 10.000 valori, Monte Carlo con 1.000 punti e 1.000 ripetizioni.',
    badgeCustom: (p) => `Valori vostri: seme ${p.seed}, ${IT.int(p.sample)} valori, Monte Carlo con ${IT.int(p.points)} punti e ${IT.int(p.reps)} ripetizioni.`,
    run: (s) => `${IT.int(s.draws)} valori generati e ${IT.ms(s.simMs)} di calcolo, nel worker del browser.`,
    errors: {
      empty: 'Il campo è vuoto.',
      notInteger: 'Serve un numero intero, senza segni né decimali.',
      range: (min, max) => `Serve un numero fra ${IT.int(min)} e ${IT.int(max)}.`,
    },
    normalTitle: (n) => `Box-Muller: funzione di ripartizione empirica di ${IT.int(n)} valori contro Φ numerica`,
    heavyTitle: (n) => `Code pesanti: funzione di ripartizione empirica di ${IT.int(n)} valori contro Φ numerica`,
    legend: ['empirica', 'Φ numerica'],
    after: (s) => {
      const F = IT;
      return [
        `Sui dati di Box-Muller lo scarto massimo è D = ${F.num(s.normal.ks.D, 4)} (p = ${F.pval(s.normal.ks.pValue)}), e sopra 3 deviazioni standard cade il ${F.pct(s.normal.tail.rate, 3)} dei valori contro il ${F.pct(s.normal.tail.expected, 3)} teorico. Sui dati a code pesanti D = ${F.num(s.heavy.ks.D, 4)} (p = ${F.pval(s.heavy.ks.pValue)}), e sopra 3 deviazioni standard ne cade il ${F.pct(s.heavy.tail.rate, 3)}: ${F.num(s.heavy.tail.rate / s.heavy.tail.expected, 1)} volte il teorico, proprio i falsi allarmi in più della sezione 1.7.`,
        'Si noti dove la funzione empirica si stacca dalla normale: al centro, non solo nelle code. Una t riscalata ha la stessa varianza della normale ma è più stretta in mezzo e più larga ai lati, e il test lo vede guardando tutta la curva.',
      ];
    },
  },
  checks: {
    intro: 'Ogni regola e ogni costante della pagina è controllata contro un riferimento indipendente: i nodi di Gauss contro la loro formula chiusa e NumPy, le regole contro polinomi che devono integrare esattamente, Φ, le code e i quantili contro mpmath a 40 cifre, gli integrali esatti dell’Esercizio 1 contro mpmath, la t di Student e la legge di Kolmogorov contro SciPy, i generatori contro il codice C di riferimento e contro un’implementazione Python scritta a parte. Il riferimento di Φ usato nelle tabelle (la funzione gamma incompleta) non usa nessuna regola di quadratura: una regola controllata con sé stessa non dimostrerebbe niente. Le serie, le formule dei manuali e il metodo della pagina sono controllati contro mpmath, e la tavola del NIST cella per cella.',
    summary: (ok, total) => `${ok} controlli su ${total} superati.`,
    details: (n) => `Tutti i ${n} controlli`,
    groups: { quadrature: 'Le regole', normal: 'La normale', cdf: 'I metodi per Φ', integrals: 'Gli integrali', generator: 'I generatori' },
    cols: { check: 'Controllo', expected: 'Atteso', result: 'Esito' },
    ok: 'superato',
    failed: 'fallito',
  },
  exercise1: {
    intro: [
      'Un integrale si può approssimare in due modi. Riemann divide il dominio in strisce e somma le aree dei rettangoli; Lebesgue divide l’insieme dei valori in livelli e somma, livello per livello, la misura dell’insieme dove la funzione sta sopra, cioè della sua controimmagine. Sulle funzioni integrabili secondo Riemann le due strade portano allo stesso numero (1.5), con velocità (1.6) e costi (1.7) diversi; sulle funzioni patologiche si separano (1.8). Le sezioni 1.9 e 1.10 mostrano dove l’idea di Lebesgue serve davvero: il tempo passato sopra una soglia, e Monte Carlo.',
    ],
  },
  idea: {
    intro: [
      'Lebesgue spiegava la differenza con le monete. Dovete pagare un debito con le monete che avete in tasca. Potete tirarle fuori una alla volta e sommarle nell’ordine in cui escono: è Riemann, che percorre l’asse x da sinistra a destra. Oppure potete prima dividerle per valore, contare quante sono di ogni tipo e moltiplicare: è Lebesgue, che raggruppa i punti per valore della funzione. Il totale è lo stesso; il secondo modo però non si preoccupa dell’ordine, e per questo funziona anche quando l’ordine è un caos.',
    ],
  },
  tryCoins: {
    intro: [
      `Una manciata di ${HANDFUL} monete. Sopra, nell’ordine in cui escono dalla tasca, con la somma che cresce moneta dopo moneta (Riemann). Sotto, le stesse monete divise per valore: quante ce ne sono di ogni tipo, per il loro valore (Lebesgue). Le somme sono in centesimi interi, quindi nessun arrotondamento può nascondere una differenza.`,
    ],
    orderTitle: 'Riemann: nell’ordine in cui escono',
    groupTitle: 'Lebesgue: raggruppate per valore',
    running: (total) => `Somma progressiva: ${IT.euro(total)}`,
    groupLine: (g) => `${g.count} × ${coinLabel(g.value)} = ${IT.euro(g.subtotal)}`,
    total: (h) => `Riemann ${IT.euro(h.total)}, Lebesgue ${IT.euro(h.byGroups)}: ${h.total === h.byGroups ? 'uguali' : 'diversi'}.`,
    another: 'Un’altra manciata',
    coinLabel,
  },
  functions: {
    intro: [
      'Le sette funzioni della consegna, più due della pagina. sin x e x² sono lisce; i due gradini sono funzioni semplici, il mattone di Lebesgue; |x - 0,5| è continua ma ha un angolo; 1/√x è infinita in 0 ma ha area finita; sin(x)/x è liscia, una volta fissato il suo valore 1 in 0. Le due della pagina: sin(1/x), che oscilla infinite volte vicino a 0 restando limitata, e il traffico di un server in un giorno, con un attacco. Le due funzioni patologiche della consegna, Dirichlet e Thomae, hanno la loro sezione (1.8): nessun numero memorizzato in un computer è irrazionale, quindi vanno calcolate con le frazioni esatte. In fondo, una funzione che scrivete voi.',
    ],
    tableTitle: 'Le funzioni e i loro integrali esatti',
    cols: { name: 'Funzione', interval: 'Intervallo', formula: 'f(x)', integral: 'Integrale esatto', feature: 'Che cosa mostra' },
    features: {
      sine: 'Liscia: entrambi i metodi funzionano',
      square: 'Liscia e monotona, piatta in 0',
      jump: 'Semplice: Lebesgue inferiore è esatto',
      vee: 'Continua, con un angolo',
      unbounded: 'Illimitata, con area finita',
      indicator: 'L’indicatrice di un insieme',
      sinc: 'Liscia; la primitiva Si non è elementare',
      oscillating: 'Infinite oscillazioni vicino a 0',
      traffic: 'Dati di un giorno, con un attacco',
    },
    chooseLabel: 'Funzione',
    customTitle: 'La vostra funzione',
    formulaLabel: 'f(x) =',
    formulaHint: `Numeri, x, ${FORMULA_NAMES.constants.join(', ')}, + - * / ^, parentesi, |...| per il valore assoluto, e ${FORMULA_NAMES.functions.join(', ')}. Al massimo ${FORMULA_MAX} caratteri; 2x vale 2*x.`,
    aLabel: 'da a =',
    bLabel: 'a b =',
    restore: 'Ripristina',
    errors: {
      empty: 'Scrivete una formula.',
      tooLong: `Al massimo ${FORMULA_MAX} caratteri.`,
      character: (e) => `Carattere non ammesso "${e.text}" in posizione ${e.at + 1}.`,
      unknown: (e) => `Nome sconosciuto "${e.text}" in posizione ${e.at + 1}.`,
      call: (e) => `${e.text} vuole le parentesi: ${e.text}(x).`,
      parens: () => 'Parentesi non bilanciate.',
      bars: () => 'Barre del valore assoluto non bilanciate.',
      syntax: (e) => `Formula incompleta o simbolo inatteso in posizione ${e.at + 1}.`,
      end: () => 'La formula finisce troppo presto.',
      deep: () => 'Troppe parentesi annidate.',
      notDefined: (e) => `La funzione non è definita su ${IT.pct(e.share, 0)} dei punti dell’intervallo.`,
      range: () => 'Estremi non validi: servono due numeri fra -1.000.000 e 1.000.000.',
      order: () => 'Serve a < b.',
    },
    stale: 'Formula non valida: le sezioni mostrano l’ultima funzione valida.',
    customNote: (c) => [c.undefinedPoints ? `In ${c.undefinedPoints} punti su 2.001 la formula non è definita: lì vale 0, che non cambia l’integrale finché sono punti isolati.` : null, c.infinite ? `In ${c.infinite} punti è infinita: Riemann lo segnala, Lebesgue la taglia a 1.000.` : null].filter(Boolean).join(' '),
  },
  functionNames: functionNamesIt,
  methodNames: methodNamesIt,
  riemann: {
    intro: [
      'Riemann divide [a, b] in n strisce e in ogni striscia prende il valore della funzione in un punto: l’estremo sinistro, il destro, il centro. La funzione è integrabile secondo Riemann se, stringendo le strisce, ogni scelta dei punti porta allo stesso numero; il test di Darboux lo verifica con la somma inferiore (il valore più basso di ogni striscia) e quella superiore (il più alto), che devono avvicinarsi.',
    ],
    formulasTitle: 'Somme di Riemann e di Darboux',
    kindLabel: 'Altezza della striscia',
    kinds: { left: 'Sinistra', right: 'Destra', midpoint: 'Centro', lower: 'Minimo', upper: 'Massimo' },
    chartTitle: (name, n, kind) => `${name}: ${n} strisce, altezza al ${{ left: 'estremo sinistro', right: 'estremo destro', midpoint: 'centro', lower: 'minimo', upper: 'massimo' }[kind]}`,
    tableTitle: (ref) => `Somme di Riemann (integrale ${refIt(ref)} ${IT.sig(ref.value, 10)})`,
    cols: { n: 'n', left: 'Sinistra', right: 'Destra', midpoint: 'Centro', lower: 'Inferiore', upper: 'Superiore', gap: 'Sup. - inf.' },
    note: `Minimo e massimo di ogni striscia sono stimati su ${DARBOUX_SAMPLES + 1} punti della striscia: esatti per i tratti monotoni, vicini per quelli lisci.`,
    after: (rows, key) => {
      const last = rows[rows.length - 1];
      if (!Number.isFinite(last.gap)) return ['Qui la somma superiore è infinita per ogni n: la prima striscia contiene lo 0, dove la funzione vale infinito. In senso proprio la funzione non è integrabile secondo Riemann, e il suo integrale esiste solo come limite (integrale improprio): le somme al centro si avvicinano a 2, ma lentamente.'];
      if (key === 'jump' || key === 'indicator') return [`Con n = ${IT.int(last.n)} strisce sup. - inf. vale ${IT.err(last.gap)}: la differenza viene solo dalle strisce che toccano il salto, e scende come 1/n.`];
      if (key === 'oscillating') return [`Vicino a 0 ogni striscia contiene infinite onde, e minimo e massimo valgono -1 e 1: sup. - inf. scende lentamente (${IT.err(last.gap)} con n = ${IT.int(last.n)}). La funzione resta integrabile secondo Riemann, perché le strisce cattive occupano uno spazio sempre più piccolo.`];
      return [`Con n = ${IT.int(last.n)} strisce sup. - inf. vale ${IT.err(last.gap)}: inferiore e superiore si stringono intorno all’integrale, ed è la definizione di Riemann vista all’opera.`];
    },
  },
  lebesgue: {
    intro: [
      'Lebesgue divide invece i valori: K livelli fra il valore più basso m e il più alto M. Per ogni livello misura l’insieme dove la funzione sta sopra, qualunque forma abbia: un intervallo, dieci, infiniti. Ogni fascia orizzontale ha altezza (M - m)/K e larghezza pari a quella misura. La somma inferiore e quella superiore differiscono di (M - m)(b - a)/K, qualunque sia la funzione: è questa garanzia, che non dipende da come la funzione si comporta lungo x, a rendere Lebesgue così potente.',
      `Il prezzo è misurare gli insiemi di livello. Qui lo fa una griglia di ${IT.int(LEVEL_CELLS)} celle, raffinata con la bisezione dove la funzione attraversa il livello: gli estremi sono esatti anche in un salto, ma un’onda che nasce e muore dentro una cella non si vede. Le funzioni illimitate si tagliano a un tetto T, e quello che sta sopra resta fuori.`,
    ],
    formulasTitle: 'Somme di Lebesgue con K livelli',
    chartTitle: (name, K) => `${name}: ${K} livelli, ogni fascia sopra l’insieme dove f supera il suo livello`,
    tableTitle: (ref) => `Somme di Lebesgue (integrale ${refIt(ref)} ${IT.sig(ref.value, 10)})`,
    cols: { K: 'K', lower: 'Inferiore', upper: 'Superiore', midpoint: 'Media', gap: 'Sup. - inf.' },
    capNote: (cap, exact) => `Valori tagliati a T = ${IT.int(cap)}: le somme integrano min(f, T), che vale ${IT.sig(exact, 8)}; la parte sopra il tetto, 1/T = ${IT.sig(1 / cap, 3)}, resta fuori.`,
    distributionTitle: 'Lo sguardo di Lebesgue: μ{f ≥ y}, la misura dell’insieme sopra ogni livello y',
    rearrangementTitle: 'La funzione (viola) e la stessa con i valori riordinati dal più alto (blu): stessa area',
    after: (rows, key) => {
      const last = rows[rows.length - 1];
      if (key === 'jump' || key === 'indicator') return [`I due valori della funzione, ${IT.plain(rows[0].m)} e ${IT.plain(rows[0].M)}, sono il livello più basso e il più alto, quindi cadono su un livello per ogni K: con K = ${rows[0].K} la somma inferiore è già esatta, ${IT.sig(rows[0].lower, 10)}. Una funzione semplice è fatta di pochi valori, e Lebesgue li conta: valore per misura dell’insieme dove la funzione lo assume.`];
      return [`Con K = ${IT.int(last.K)} livelli inferiore e superiore distano ${IT.err(last.gap)}, esattamente (M - m)(b - a)/K. Il secondo grafico ordina i valori della funzione dal più alto al più basso: la curva che ne esce (il riordinamento decrescente) ha la stessa area, ed è il grafico a sinistra letto di traverso.`];
    },
  },
  trySlices: {
    intro: [
      'Le stesse strisce e fette dal vivo: muovete n e K e confrontate. Con i gradini la somma inferiore di Lebesgue è esatta per ogni K, mentre Riemann paga il salto; con x² le strisce di Riemann vanno più veloci; con sin(1/x) entrambi faticano vicino a 0. Avvia fa crescere n e K insieme da 1 a 64.',
    ],
    nLabel: (n) => `n = ${n} strisce`,
    kLabel: (K) => `K = ${K} livelli`,
    play: 'Avvia',
    pause: 'Pausa',
    values: (r, l, ref) => {
      const F = IT;
      const e = (v) => (Number.isFinite(v) ? F.err(Math.abs(v - ref.value)) : '∞');
      return `Riemann al centro ${F.sig(r.midpoint, 8)} (errore ${e(r.midpoint)}), fra ${F.sig(r.lower, 6)} e ${F.sig(r.upper, 6)}. Lebesgue ${F.sig(l.midpoint, 8)} (errore ${e(l.midpoint)}), fra ${F.sig(l.lower, 6)} e ${F.sig(l.upper, 6)}. Integrale ${refIt(ref)} ${F.sig(ref.value, 10)}.`;
    },
    riemannTitle: (n) => `Riemann, ${n} strisce`,
    lebesgueTitle: (K) => `Lebesgue, ${K} livelli`,
  },
  results: {
    intro: [
      'La risposta alla consegna in una tabella: ogni funzione con il suo integrale, la somma di Riemann e quella di Lebesgue con 729 strisce e 729 livelli (valutate al centro), i due errori e il verdetto sulla domanda della consegna: i due approcci arrivano allo stesso valore? 729 = 3⁶ è un numero dispari di strisce, quindi il salto in 0,5 dei due gradini cade dentro una striscia, come capita a un salto di cui non si conosce la posizione. Dirichlet e Thomae arrivano dalla sezione 1.8, calcolate con le frazioni esatte.',
    ],
    tableTitle: 'Riemann e Lebesgue su ogni funzione, con 729 strisce e 729 livelli',
    cols: { name: 'Funzione', integral: 'Integrale', riemann: 'Riemann', lebesgue: 'Lebesgue', riemannError: 'Errore R', lebesgueError: 'Errore L', verdict: 'Stesso valore?' },
    verdicts: { yes: 'Sì', improper: 'Sì, come limite improprio', noRiemann: 'No: Riemann non esiste', unknown: 'Sì, se è integrabile' },
    integralCell: (row) => `${IT.sig(row.reference, 10)}${row.exact ? '' : ' (rif.)'}`,
    riemannCell: (row) => (row.kind === 'dirichlet' ? 'nessuno: inf. 0, sup. 1' : row.kind === 'thomae' ? `fra 0 e ${IT.sig(row.upper, 3)}` : IT.sig(row.riemann, 10)),
    lebesgueCell: (row) => (row.kind === 'regular' ? IT.sig(row.lebesgue, 10) : '0'),
    errorCell: (v) => (v === null ? '-' : IT.err(v)),
    pending: 'Le somme delle nove funzioni si calcolano insieme alle simulazioni: qualche secondo. Dirichlet e Thomae sono già qui.',
    after: (rows) => {
      const F = IT;
      const regular = rows.filter((r) => r.kind === 'regular' && r.key !== 'custom');
      const names = (list) => list.map((r) => inline(functionNamesIt[r.key])).join(', ') || 'nessuna';
      const unbounded = rows.find((r) => r.key === 'unbounded');
      const thomae = rows.find((r) => r.key === 'thomae');
      return [
        `Sulle funzioni integrabili secondo Riemann i due numeri arrivano allo stesso valore: con 729 strisce e livelli gli errori sono tutti piccoli, e la sezione 1.6 mostra che scendono ancora al crescere di n e K. Con 729 Riemann è più vicino su ${names(regular.filter((r) => r.errors.riemann <= r.errors.lebesgue))}; Lebesgue su ${names(regular.filter((r) => r.errors.lebesgue < r.errors.riemann))}.`,
        `Le eccezioni sono quelle volute dalla consegna. 1/√x è illimitata: per Riemann ha un integrale solo come limite improprio, e le somme al centro ci arrivano piano (errore ${F.err(unbounded ? unbounded.errors.riemann : null)}); per Lebesgue l’integrale esiste direttamente, ma il calcolo deve tagliare i valori a un tetto. La funzione di Dirichlet non ha integrale di Riemann, perché ogni somma inferiore vale 0 e ogni superiore 1; ha integrale di Lebesgue 0. Thomae ha entrambi gli integrali, uguali a 0: la sua somma superiore con ${F.int(thomae ? thomae.n : 0)} strisce vale ${F.sig(thomae ? thomae.upper : null, 3)} e continua a scendere.`,
      ];
    },
  },
  efficiency: {
    intro: [
      'Il costo si conta in valori di f, che è ciò che pesa quando f è cara da calcolare (una simulazione, una misura). Riemann con n strisce al centro ne chiede n. Lebesgue ne chiede molti di più, perché per misurare un insieme di livello deve sapere dove f attraversa il livello: qui una griglia di 4.097 punti, poi 44 bisezioni per ogni attraversamento di ogni livello. Al computer, insomma, anche Lebesgue divide il dominio: lo fa per misurare le controimmagini. La tabella riporta, per un errore relativo dell’1% e dello 0,01%, il primo n = K che ci arriva, i valori di f che costa e il tempo di una somma nel vostro browser.',
    ],
    chartTitle: (name) => `${name}: errore relativo contro valori di f (scale logaritmiche)`,
    legend: ['Riemann, centro', 'Lebesgue, media'],
    tableTitle: 'Quanto serve per un errore relativo di 10^-2 e di 10^-4',
    cols: { name: 'Funzione', target: 'Errore', riemann: 'Riemann', lebesgue: 'Lebesgue' },
    cell: (hit, method) => (hit ? `n = ${IT.int(hit.n)}: ${IT.int(hit[method].evaluations)} valori, ${IT.dur(hit[method].ms)}` : 'non con 729'),
    pending: 'I costi si misurano insieme alle simulazioni: qualche secondo.',
    after: (f) => {
      const F = IT;
      const names = (keys) => keys.map((k) => inline(functionNamesIt[k])).join(', ');
      const out = [`Per un errore dell’1%, dove ci arrivano entrambi, Lebesgue chiede da ${F.int(f.minRatio)} a ${F.int(f.maxRatio)} volte i valori di f di Riemann. Il motivo non è il numero di livelli, che a volte è più piccolo del numero di strisce${f.fewerLevels.length ? ` (succede con ${names(f.fewerLevels)})` : ''}: è la misura degli insiemi di livello, che costa una griglia e una bisezione per ogni attraversamento.`];
      if (f.onlyLebesgue.length) out.push(`Ci arriva solo Lebesgue su ${names(f.onlyLebesgue)}: è dove le strisce di Riemann soffrono, e ogni livello in più vale la sua spesa.`);
      if (f.onlyRiemann.length) out.push(`Ci arriva solo Riemann su ${names(f.onlyRiemann)}.`);
      out.push('In sintesi: come algoritmo generico Riemann è più economico, e lo è di molto; Lebesgue conviene quando la misura delle controimmagini si conosce già o costa poco: per le funzioni semplici, per una funzione data come elenco di valori (dove contarli è facile), o quando serve sapere per quanto tempo f resta sopra una soglia, come nel traffico della sezione 1.9.');
      return out;
    },
  },
  pathological: {
    intro: [
      'Le due funzioni patologiche della consegna. Quella di Dirichlet vale 1 sui razionali e 0 sugli irrazionali di [0, 1]; quella di Thomae vale 1/q nel razionale p/q ridotto ai minimi termini e 0 sugli irrazionali. Ogni striscia di Riemann contiene razionali e irrazionali, quindi per entrambe la somma inferiore vale sempre 0; la superiore vale sempre 1 per Dirichlet, mentre per Thomae scende verso 0. Così Dirichlet non è integrabile secondo Riemann e Thomae sì, con integrale 0. Per Lebesgue valgono entrambe 0: l’insieme dove Dirichlet supera un livello sono i razionali, un insieme numerabile e quindi di misura 0; quello dove Thomae vale almeno 1/Q è un insieme finito di frazioni.',
      'Al computer però non si calcolano come le altre, e il motivo è pratico: ogni numero che un programma memorizza è razionale. Un double è sempre una frazione m/2^k: l’irrazionale non esiste, nemmeno π. La tabella mostra la frazione esatta di alcuni numeri come li memorizza il browser: per il computer la funzione di Dirichlet vale 1 dappertutto, e il suo “integrale numerico” vale 1, non 0.',
    ],
    numbers: { tenth: '0,1', third: '1/3', pi4: 'π/4', sqrt2: '√2', e: 'e' },
    cols: { number: 'Numero', fraction: 'Frazione esatta memorizzata', value: 'Dirichlet al computer' },
    thomaeIntro: 'Per questo la pagina calcola le due funzioni con l’aritmetica esatta delle frazioni. I punti delle somme sono frazioni i/n, oppure numeri irrazionali scritti come tali, (i + 1/√2)/n; il massimo di Thomae su una striscia è 1/q, con q il più piccolo denominatore di una frazione dentro la striscia, trovato con i soli interi. Il grafico mostra Thomae con le frazioni fino a q = 40 e la scala della sua somma superiore con 10 strisce.',
    chartTitle: (upper) => `La funzione di Thomae (q ≤ 40) e la scala della somma superiore con 10 strisce, ${IT.sig(upper, 4)}`,
    tableTitle: 'Le somme di Thomae, con le frazioni esatte',
    thomaeCols: { n: 'n', rational: 'Punti i/n', irrational: 'Punti irrazionali', lower: 'Inferiore', upper: 'Superiore', doubles: 'Punti i/n come double' },
    after: (p) => {
      const F = IT;
      const first = p.thomae[0];
      const last = p.thomae[p.thomae.length - 1];
      const mid = p.thomae.find((r) => r.n === 1000) || last;
      return [
        `La somma superiore di Thomae scende da ${F.sig(first.upper, 3)} con ${F.int(first.n)} strisce a ${F.sig(last.upper, 3)} con ${F.int(last.n)}, con ordine misurato ${F.num(p.upperOrder, 2)}: quasi 1/√n, perché ogni striscia larga 1/n contiene una frazione con denominatore vicino a √n. L’inferiore vale sempre 0, quindi l’integrale di Riemann esiste e vale 0, e le somme con i punti i/n ci arrivano anche loro. Per Lebesgue l’insieme dove Thomae vale almeno 1/Q contiene ${p.farey.map((r) => `${F.int(r.points)} frazioni per Q = ${F.int(r.Q)}`).join(', ')}: tanti punti, ma un insieme finito di punti ha misura 0, e ogni somma di Lebesgue vale esattamente 0.`,
        `Con i double, invece, un programma vede i/n arrotondato: 0,1 diventa 3602879701896397/2^55, e lì Thomae vale 2^-55. Sopravvivono solo le frazioni diadiche, 1/2, 1/4, 3/8 e così via: con n = ${F.int(mid.n)} la somma vale ${F.sig(mid.doubles, 3)} invece di ${F.sig(mid.rational, 3)}, un numero che non viene né dalla matematica né dall’errore di discretizzazione, ma dalla rappresentazione binaria. Su Dirichlet va peggio: con i double ogni somma vale 1, l’integrale vero è 0. Sono le uniche funzioni della pagina che la matematica integra e il calcolo in virgola mobile no.`,
      ];
    },
  },
  liouville: {
    intro: [
      'Φ(z) è l’integrale di φ(t) = e^(-t²/2)/√(2π) fino a z, e quell’integrale non si scrive con un numero finito di funzioni elementari (polinomi, esponenziali, logaritmi, funzioni trigonometriche, radici e loro composizioni). Gli appunti del corso correggono qui il libro: una primitiva esiste, è Φ stessa, ma non è elementare. Lo dice il teorema di Liouville (1835), nella forma di Rosenlicht che gli appunti citano: se f e g sono razionali e g non è costante, l’integrale di f e^g è elementare solo se vale R e^g, con R razionale e R′ + g′R = f.',
      'Per la campana f = 1 e g = -x²/2, quindi servirebbe una R razionale con R′ - xR = 1. Se R fosse un polinomio di grado d, il termine -xR avrebbe grado d + 1 e niente lo cancellerebbe; se R avesse un polo di ordine m, R′ ne avrebbe uno di ordine m + 1, e anche lì niente lo cancellerebbe. Quindi R non esiste e Φ non è elementare. Lo si vede anche con i numeri: tutte le soluzioni di R′ - xR = 1 sono S(x) + C e^(x²/2), con S(x) = (Φ(x) - 1/2)/φ(x), e S cresce come e^(x²/2), più in fretta di qualunque funzione razionale.',
    ],
    formulas: "R′(x) - x R(x) = 1\nS(x) = (Φ(x) - 1/2)/φ(x) = x + x³/3 + x⁵/(3·5) + x⁷/(3·5·7) + ...,      S′ = 1 + x S",
    tableTitle: 'S(x) = (Φ(x) - 1/2)/φ(x): la candidata, e perché non è razionale',
    cols: { x: 'x', S: 'S(x)', ratio: 'S(x)/e^(x²/2)', degree: 'Grado apparente x S′/S' },
    after: (rows) => {
      const F = IT;
      const last = rows[rows.length - 1];
      return [`Il rapporto S(x)/e^(x²/2) si ferma a √(π/2) = ${F.num(Math.sqrt(Math.PI / 2), 4)}: S cresce come un’esponenziale di x². Il grado apparente x S′(x)/S(x), che per una funzione razionale tende al suo grado, vale ${F.num(rows[0].degree, 2)} per x = ${rows[0].x} e ${F.num(last.degree, 2)} per x = ${last.x}, e continua a crescere come x². Nessuna funzione razionale fa così: è la dimostrazione di Liouville vista nei numeri. La stessa S, scritta come serie, è la serie a termini positivi della sezione 2.7 e il cuore del metodo della sezione 2.9. Lo stesso teorema dice che anche la primitiva di sin(x)/x, una delle funzioni dell’Esercizio 1, non è elementare: per questo il suo integrale esatto viene dalla funzione seno integrale Si(π).`];
    },
  },
  erf: {
    intro: [
      'Con la funzione degli errori, erf(x) = (2/√π) ∫_0^x e^(-t²) dt, la formula diventa esatta: Φ(z) = (1 + erf(z/√2))/2, e P(|Z| < k) = erf(k/√2). Ma erf è solo il nome dato a quell’integrale, e un nome non calcola nulla: è come scrivere √2 o π, simboli esatti le cui cifre vanno comunque ottenute con un algoritmo. Ogni erf di ogni libreria è un programma: le librerie matematiche del C usano approssimazioni razionali su intervalli diversi, gli appunti del corso la serie di Taylor. JavaScript, il linguaggio di questa pagina, non ha nemmeno una erf: Math.erf non esiste, e la pagina se la scrive.',
      'Un esempio pratico è la regola 68-95-99,7, cioè P(|Z| < k) = erf(k/√2) per k = 1, 2, 3. Gli appunti la ricavano da una tavola a 4 decimali, raddoppiando Φ(k) già arrotondata; la tabella la confronta con il metodo della pagina e con mpmath.',
    ],
    formulas: 'erf(x) = (2/√π) ∫_0^x e^(-t²) dt\nΦ(z) = (1 + erf(z/√2))/2,      P(|Z| < k) = erf(k/√2) = 2Φ(k) - 1',
    tableTitle: 'La regola 68-95-99,7: P(|Z| < k) = erf(k/√2)',
    cols: { k: 'k', value: 'Metodo della pagina', reference: 'mpmath', rounded: 'Da una tavola a 4 decimali' },
    after: (rows) => {
      const F = IT;
      return [`Arrotondare Φ(k) a 4 decimali prima di raddoppiarla costa l’ultima cifra: ${rows.map((r) => `per k = ${r.k} la tavola dà ${F.num(r.rounded, 4)} invece di ${F.num(r.reference, 4)}`).join(', ')}. Il metodo della pagina differisce da mpmath al più di un’unità nella sedicesima cifra. Da qui la pagina prova le tre famiglie di metodi che la consegna suggerisce: l’integrazione numerica (2.3 - 2.6), le serie (2.7) e le approssimazioni costruite su erf (2.8).`];
    },
  },
  series: {
    intro: [
      'Gli appunti del corso calcolano Φ integrando termine a termine la serie di Taylor di e^(-t²/2), cioè la serie di potenze di erf. È una serie a segni alterni, e il teorema delle serie alterne garantisce che l’errore non supera il primo termine trascurato. In aritmetica esatta funziona per ogni z; al computer no. Per z grande i termini crescono fino a circa e^(z²/2) prima di calare, e sommare numeri enormi di segno opposto per ottenere un numero vicino a 1 costa cifre: ne perde una per ogni potenza di dieci del termine più grande.',
      'La stessa funzione si scrive anche con tutti i termini positivi (Marsaglia, 2004): la somma è proprio la S di Liouville della sezione 2.1. Niente cancellazione dentro la somma, un solo esponenziale fuori. La tabella confronta le due serie per z da 1 a 8; il grafico segue l’errore al crescere del numero di termini.',
    ],
    formulas: 'Φ(z) = 1/2 + (1/√(2π)) Σ_(k≥0) (-1)^k z^(2k+1)/(2^k (2k+1) k!)          (appunti, serie alterna)\nΦ(z) = 1/2 + φ(z) Σ_(k≥0) z^(2k+1)/(1·3·5···(2k+1))                     (termini positivi)',
    tableTitle: 'Le due serie: termini necessari, cifre perse, errori',
    cols: { z: 'z', altTerms: 'Appunti: termini', largest: 'Termine più grande', lost: 'Cifre perse', altError: 'Errore', posTerms: 'Positiva: termini', posError: 'Errore' },
    chooseLabel: 'z',
    chartTitle: (z) => `Φ(${IT.plain(z)}): errore contro numero di termini (scala logaritmica)`,
    legend: ['Serie degli appunti', 'Primo termine trascurato (il limite delle serie alterne)', 'Serie a termini positivi'],
    after: (rows) => {
      const F = IT;
      const at = (z) => rows.find((r) => r.z === z);
      const five = at(5);
      const eight = at(8);
      return [`Fino a z = 3 le due serie si equivalgono. Poi quella degli appunti perde cifre: a z = 5 il suo termine più grande vale ${F.sci(five.alternating.largest)} e l’errore sale a ${F.err(five.alternating.error)}; a z = 8 il termine più grande vale ${F.sci(eight.alternating.largest)}, le cifre perse sono ${F.num(eight.alternating.lost, 1)} e l’errore è ${F.err(eight.alternating.error)}, mentre la serie positiva resta a ${F.err(eight.positive.error)}. Il limite delle serie alterne vale solo in aritmetica esatta: nel grafico, per z grande, l’errore si ferma molto sopra il primo termine trascurato, al livello degli arrotondamenti dei termini più grandi. I termini necessari crescono come z²: ${eight.positive.terms} per la serie positiva a z = 8.`];
    },
  },
  approximations: {
    intro: [
      'Le approssimazioni costruite su erf sono quelle dei manuali: una formula fissa, un esponenziale e cinque coefficienti trovati una volta per tutte. La 7.1.26 di Abramowitz e Stegun (da Hastings, 1955) scrive erf(x) ≈ 1 - t(a₁ + a₂t + a₃t² + a₄t³ + a₅t⁴) e^(-x²), con t = 1/(1 + 0,3275911 x) e un errore al massimo di 1,5 × 10^-7; per Φ l’errore si dimezza. La 26.2.17 (Zelen e Severo) approssima direttamente la coda P(Z > z) con una formula dello stesso tipo, con errore sotto 7,5 × 10^-8.',
    ],
    chartTitle: 'Errore delle due formule lungo z, con il limite pubblicato ±7,5 × 10^-8',
    legend: ['Abramowitz-Stegun 7.1.26', 'Zelen-Severo 26.2.17', 'Limite pubblicato'],
    after: (f) => {
      const F = IT;
      return [`Gli errori ondeggiano: è la firma delle approssimazioni costruite per rendere uniforme l’errore invece di concentrarlo in un punto. Gli scarti più grandi, ${F.err(f.as)} a z = ${F.num(f.asAt, 1)} e ${F.err(f.zs)} a z = ${F.num(f.zsAt, 1)}, rispettano i limiti pubblicati (${F.sci(f.asBound)} e ${F.sci(f.zsBound)}). Sono le più veloci (2.11) e bastano per una tavola a 5 decimali, ma non danno più di 7 cifre, e lontano nella coda sbagliano in proporzione: a z = -9, dove Φ vale 1,1 × 10^-19, la 7.1.26 restituisce ${F.sig(f.asTail, 3)}, e la 26.2.17 a z = -37 ha un errore relativo del ${F.pct(f.zsRelative, 0)}.`];
    },
  },
  ours: {
    intro: (f) => [
      `Il metodo della pagina mette insieme i due pezzi migliori. Per |z| < ${f.switchZ} usa la serie a termini positivi della sezione 2.7, che non cancella nulla e lì chiede al massimo ${f.seriesTerms} termini. Per |z| ≥ ${f.switchZ} usa la frazione continua di Laplace (1805) per il rapporto di Mills, P(Z > w)/φ(w), calcolata con il metodo di Lentz: converge per ogni w > 0, tanto più in fretta quanto più w è grande, e lavora direttamente sulla coda, quindi tiene tutte le cifre anche di probabilità come 10^-300. In entrambi i casi basta un solo esponenziale.`,
    ],
    formulas: 'Φ(z) = 1/2 + φ(z) Σ_(k≥0) z^(2k+1)/(1·3·5···(2k+1))                  |z| < 2\nP(Z > w) = φ(w) / (w + 1/(w + 2/(w + 3/(w + ...))))                   w = |z| ≥ 2,   Φ(-w) = P(Z > w)',
    after: (f) => {
      const F = IT;
      return [`Contro mpmath, su z da -8 a 8 e nella coda fino a z = -37: errore assoluto massimo ${F.err(f.ours.absolute)}, errore relativo massimo ${F.err(f.ours.relative)} (a z = ${F.num(f.ours.relAt, 1)}, dove la serie sottrae ancora φS da 1/2). Vuol dire circa 15 cifre corrette dappertutto, contro le 7 delle formule dei manuali, con al più ${f.ours.terms} termini. Il prezzo si misura nella sezione 2.11.`];
    },
  },
  reference: {
    intro: [
      'Il riferimento affidabile trovato sul web è doppio. Il primo è la tavola della normale del NIST/SEMATECH e-Handbook of Statistical Methods (sezione 1.3.6.7.1), che dà P(0 ≤ Z ≤ z) con 5 decimali per z da 0 a 4,09: la tavola classica, controllabile da chiunque. Cinque decimali però non vedono errori sotto 5 × 10^-6, quindi il secondo riferimento è mpmath, una libreria Python open source a precisione arbitraria, qui usata con 60 cifre.',
    ],
    link: 'La tavola del NIST',
    tableTitle: 'Φ(z) in alcuni punti: NIST, mpmath e il metodo della pagina',
    cols: { z: 'z', nist: 'NIST, 5 decimali', mpmath: 'mpmath, 60 cifre', ours: 'Metodo della pagina', error: 'Errore', nistError: 'Errore del NIST' },
    nist: (n) => `Tutta la tavola: ${n.agree} celle su ${n.total} coincidono con il metodo della pagina arrotondato a 5 decimali.`,
    mismatch: (m) => `L’unica che non coincide è z = ${IT.num(m.z, 2)}: la tavola stampa ${IT.num(m.table, 5)}, il metodo dà ${IT.num(m.ours, 10)}, che si arrotonda a ${IT.num(m.rounded, 5)}. mpmath dà ragione al metodo: è un errore di un’unità nell’ultima cifra della tavola.`,
    after: (rows) => {
      const F = IT;
      const worst = Math.max(...rows.map((r) => r.error));
      const nistWorst = Math.max(...rows.filter((r) => r.nistError !== null && r.z !== 1.36).map((r) => r.nistError));
      return [`Sui punti della tabella l’errore del metodo contro mpmath non supera ${F.err(worst)}, cioè l’ultima cifra di un double. Quello della tavola del NIST resta sotto 5 × 10^-6, mezza unità del quinto decimale (al massimo ${F.err(nistWorst)}), tranne a z = 1,36. Un riferimento va controllato come un risultato: per questo la pagina ne usa due.`];
    },
  },
  methods: {
    intro: [
      'Tutti i metodi a confronto, contro mpmath: l’errore assoluto più grande per z da -8 a 8, l’errore relativo più grande sotto la media, dove Φ è piccola (fino a z = -37), quanti esponenziali e quanti termini chiede una chiamata, e quanto dura. Il tempo è misurato qui, nel vostro browser: ogni metodo calcola Φ su 1.001 punti fra -8 e 8, ripetendo finché passano almeno 8 millisecondi, e la misura si ripete 11 volte, a turno fra i metodi. La tabella riporta la mediana con il suo intervallo di confidenza dalle statistiche d’ordine, che non suppone nulla sulla forma della distribuzione dei tempi.',
    ],
    tableTitle: 'Precisione, costo e tempo di ogni metodo',
    cols: { method: 'Metodo', absolute: 'Errore assoluto', relative: 'Errore relativo nella coda', exp: 'exp', terms: 'Termini', time: 'ns per chiamata' },
    relativeCell: (v) => (!Number.isFinite(v) ? '∞' : v >= 1 ? '≥ 1' : IT.err(v)),
    timeCell: (t) => (t ? `${IT.int(t.median)} [${IT.int(t.lo)}, ${IT.int(t.hi)}]` : 'in misura'),
    chartTitle: 'Errore di ogni metodo lungo z, contro mpmath (scala logaritmica)',
    after: (f) => {
      const F = IT;
      const out = [`Il metodo della pagina è l’unico che tiene circa 15 cifre sia in senso assoluto sia in senso relativo. Gauss-Legendre con 64 nodi arriva alla stessa precisione assoluta, ma chiede 64 esponenziali e nella coda bassa perde le cifre nella sottrazione da 1/2. Le formule dei manuali sono le più veloci, ma si fermano a 7 cifre. Le serie da sole non bastano: quella degli appunti perde cifre per z grande, quella positiva perde la precisione relativa nella coda bassa.`];
      if (f.speedup) out.push(`Nel vostro browser il metodo della pagina è ${F.num(f.speedup, 1)} volte più veloce di Gauss-Legendre e costa ${F.num(f.slowdown, 1)} volte la 7.1.26 (intervalli al ${F.pct(f.coverage, 1)}). È lo stesso compromesso delle librerie vere: una formula rapida dove basta, una diversa nella coda.`);
      return out;
    },
  },
  compare: {
    intro: [
      'Come convergono? Il grafico segue l’errore delle due somme medie al crescere di n = K = 3, 9, 27, ..., 729, e tratteggiata la distanza fra inferiore e superiore di ciascun metodo, che è la loro garanzia. La tabella in fondo misura su tutte le funzioni l’ordine di convergenza, cioè la pendenza della retta log errore contro log n: ordine 2 vuol dire che triplicando n l’errore si divide per 9.',
    ],
    chartTitle: (name) => `${name}: errore al crescere di n = K (scale logaritmiche)`,
    legend: ['Riemann, centro', 'Lebesgue, media', 'Riemann, sup. - inf.', 'Lebesgue, sup. - inf.'],
    tableTitle: 'Errori e garanzie per n = K triplicato',
    cols: { n: 'n = K', riemann: 'Errore di Riemann', lebesgue: 'Errore di Lebesgue', riemannGap: 'Garanzia di Riemann', lebesgueGap: 'Garanzia di Lebesgue' },
    customPending: 'Il confronto della vostra funzione si calcola qui, nel browser: qualche decimo di secondo.',
    after: (f, name) => {
      const F = IT;
      const winner = f.winner === 'lebesgue' ? 'Lebesgue' : 'Riemann';
      return [`${name}: con n = K = ${F.int(f.n)} vince ${winner}, di ${F.num(f.ratio, 1)} volte (errori ${F.err(f.riemann)} per Riemann e ${F.err(f.lebesgue)} per Lebesgue). L’errore di Riemann scende con ordine ${F.num(f.riemannOrder, 2)}, quello di Lebesgue con ordine ${F.num(f.lebesgueOrder, 2)}${f.riemannInfinite ? '; la garanzia di Riemann è infinita, quella di Lebesgue no' : ''}.`];
    },
    summaryTitle: 'Tutte le funzioni: errori con n = K = 9 e 729, e ordini di convergenza misurati',
    summaryCols: { name: 'Funzione', riemannSmall: 'Riemann, 9', lebesgueSmall: 'Lebesgue, 9', riemannLarge: 'Riemann, 729', lebesgueLarge: 'Lebesgue, 729', orderRiemann: 'Ordine R', orderLebesgue: 'Ordine L', winner: 'Vince' },
    orderCell: (v) => (Number.isFinite(v) ? IT.num(v, 2) : 'esatto'),
    summaryAfter: (rows) => {
      const F = IT;
      const names = (who) => rows.filter((r) => r.winner === who).map((r) => inline(functionNamesIt[r.key])).join(', ') || 'nessuna';
      const order = (key, m) => {
        const r = rows.find((x) => x.key === key);
        return r ? F.num(r.orders[m], 2) : F.na;
      };
      return [
        `Con n = K = 729 Riemann vince su: ${names('riemann')}; Lebesgue su: ${names('lebesgue')}.`,
        `Gli ordini dicono il perché. Sulle funzioni lisce Riemann al centro ha ordine 2 (${order('sine', 'riemann')} su sin x, ${order('square', 'riemann')} su x²), Lebesgue circa 1,5 (${order('sine', 'lebesgue')} e ${order('square', 'lebesgue')}): dove f è piatta, al massimo di sin x o al minimo di x², l’insieme sopra un livello cambia come una radice quadrata, e le fette di Lebesgue lo seguono male. Su |x - 0,5| invece la misura sopra il livello y è 1 - 2y, una retta, e Lebesgue è esatto già con 3 livelli. Sui gradini l’ordine è 1 per entrambi, perché il salto cade dentro una striscia, ma l’errore di Lebesgue è la metà. Su 1/√x l’ordine di Riemann scende a ${order('unbounded', 'riemann')} e quello di Lebesgue resta ${order('unbounded', 'lebesgue')}; su sin(1/x) faticano entrambi (${order('oscillating', 'riemann')} e ${order('oscillating', 'lebesgue')}).`,
        'Il vero vantaggio di Lebesgue non è la velocità: è che la sua garanzia, (M - m)(b - a)/K, non dipende da come la funzione si comporta lungo x, e che i suoi teoremi sui limiti (convergenza monotona e dominata) permettono di scambiare limite e integrale, cosa su cui la probabilità e la statistica sono costruite.',
      ];
    },
  },
  traffic: {
    intro: [
      `Un esempio da sicurezza informatica. Il traffico di un server in un giorno, in Mb/s: ${TRAFFIC.base} di notte, una campana di ${TRAFFIC.day} intorno alle ${TRAFFIC.peak}:00, e alle ${TRAFFIC.at}:00 un attacco che per un quarto d’ora aggiunge fino a ${TRAFFIC.attack} Mb/s. Riemann e Lebesgue rispondono a due domande diverse sulla stessa curva. Riemann somma minuto dopo minuto e dà il totale trasferito, quello che compare in bolletta. Lebesgue chiede, per ogni soglia, quante ore il collegamento ci è rimasto sopra: è la domanda di chi dimensiona la banda o una difesa da DDoS.`,
    ],
    chartTitle: 'Il traffico del giorno (Mb/s): ogni fascia copre le ore in cui il traffico supera la sua soglia',
    tableTitle: 'Le ore sopra ogni soglia (insiemi di livello di Lebesgue)',
    cols: { y: 'Soglia (Mb/s)', hours: 'Ore sopra', minutes: 'Minuti sopra', when: 'Quando' },
    durationTitle: 'La curva di durata del carico: il traffico ordinato dal minuto più carico, con le soglie da 350 Mb/s in su',
    after: (r) => {
      const F = IT;
      const above500 = r.rows.find((row) => row.y === 500);
      return [
        `In tutto il giorno passano ${F.num(r.total, 1)} Mb/s × ore, cioè ${F.int(r.gigabytes)} GB (le somme di Riemann minuto per minuto danno ${F.num(r.riemann, 1)}). L’attacco ne è solo il ${F.pct(r.attackShare, 1)}: nel totale si vede appena. Negli insiemi di livello invece è l’unico protagonista: sopra 500 Mb/s il collegamento resta ${F.num(above500.hours * 60, 1)} minuti, tutti fra le ${clock(above500.intervals[0][0])} e le ${clock(above500.intervals[above500.intervals.length - 1][1])}, e il picco arriva a ${F.int(r.peak)} Mb/s.`,
        'La curva di durata del carico, il traffico riordinato dal minuto più carico al più scarico, è il riordinamento decrescente della sezione 1.4: ingegneri delle reti e dell’energia la usano da decenni senza chiamarla Lebesgue. La sua area è di nuovo il totale.',
      ];
    },
  },
  montecarlo: {
    intro: [
      'Monte Carlo integra estraendo punti a caso: l’integrale di f su [a, b] è (b - a) volte il valore atteso di f(U), con U uniforme, e la media di N valori lo stima. Non guarda mai l’ordine dei punti sull’asse x, solo quanti valori cadono dove: è un parente statistico di Lebesgue. Il suo errore scende come 1/√N qualunque sia la regolarità della funzione, e ogni stima viene con il suo intervallo di confidenza, calcolato con le tre righe di Welford dell’Homework #4.',
    ],
    formulasTitle: 'Monte Carlo',
    fieldsIntro: 'Quanti punti usa ogni stima e quante stime indipendenti si fanno per ogni funzione; il seme è quello della sezione 2.15.',
    pointsLabel: 'Punti per stima N',
    pointsHint: `da ${IT.int(LIMITS.points[0])} a ${IT.int(LIMITS.points[1])}`,
    repsLabel: 'Ripetizioni',
    repsHint: `da ${IT.int(LIMITS.reps[0])} a ${IT.int(LIMITS.reps[1])}`,
    tableTitle: (s) => `${IT.int(s.params.reps)} stime di ${IT.int(s.params.points)} punti per ogni funzione`,
    cols: { name: 'Funzione', exact: 'Integrale esatto', mean: 'Media delle stime', sd: 'Deviazione standard', se: 'Errore standard medio', coverage: `Intervalli al ${IT.pct(CONFIDENCE, 0)} che lo contengono` },
    chooseLabel: 'Istogramma di',
    histogramTitle: (name, s) => `${name}: le ${IT.int(s.params.reps)} stime, con la normale del teorema del limite centrale e il valore esatto`,
    legend: ['stime', 'normale attesa', 'valore esatto'],
    after: (s) => {
      const F = IT;
      const u = s.mc.unbounded;
      const ok = FUNCTIONS.filter((key) => key !== 'unbounded').map((key) => `${inline(functionNamesIt[key])} ${F.pct(s.mc[key].coverage, 1)}`).join(', ');
      return [
        `Per le ${FUNCTIONS.length - 1} funzioni con varianza finita gli intervalli al 95% contengono l’integrale esatto in queste quote: ${ok}. È la promessa dell’intervallo, e i test della sezione 4 dicono se è mantenuta.`,
        `Con 1/√x la quota è ${F.pct(u.coverage, 1)}${u.coverage < 0.94 ? ', sotto la promessa' : ''}. Le stime restano giuste in media (${F.sig(u.mean, 6)} contro 2), ma f(U) = 1/√U ha varianza infinita: ogni tanto U cade vicinissimo a 0 e un solo punto sposta tutta la media. L’istogramma lo mostra: una coda lunga a destra e un picco spostato a sinistra, e la deviazione standard di un campione sottovaluta quasi sempre la vera incertezza. È la stessa funzione che Riemann non integra in senso proprio: anche Monte Carlo, che non guarda l’ordine dei punti, sente l’infinito.`,
      ];
    },
  },
  tryMc: {
    intro: [
      'Monte Carlo dal vivo: Avvia estrae punti da 10 fino a 100.000, e il grafico segue la stima con la sua fascia al 95%, contro il valore esatto tratteggiato. Con le funzioni limitate la fascia si stringe come 1/√N e contiene quasi sempre il valore esatto; con 1/√x guardate i salti: un punto vicinissimo a 0 sposta la stima di colpo. Un’altra estrazione rifà tutto con punti nuovi.',
    ],
    chooseLabel: 'Funzione',
    play: 'Avvia',
    pause: 'Pausa',
    again: 'Un’altra estrazione',
    chartTitle: (name) => `${name}: la stima al crescere dei punti (scala logaritmica), con la fascia al 95%`,
    legend: ['stima e fascia al 95%', 'valore esatto'],
    status: (p, exact) => (p ? `${IT.int(p.k)} punti: stima ${IT.sig(p.estimate, 7)} ± ${IT.sig(1.96 * p.se, 3)}, valore esatto ${IT.sig(exact, 7)}.` : 'Premete Avvia.'),
  },
  stats: {
    verdict: { reject: 'H₀ rifiutata', notReject: 'H₀ non rifiutata' },
    expected: { reject: 'atteso: rifiuto', notReject: 'atteso: nessun rifiuto', either: 'dipende dalla potenza del test' },
    testLine: testLineIt,
    groups: { model: 'Il modello normale', coverage: 'Copertura di Monte Carlo', bias: 'Distorsione di Monte Carlo' },
    labels: {
      model: {
        ksNormal: 'I dati di Box-Muller seguono la Φ numerica (Kolmogorov-Smirnov)',
        tailNormal: `Nei dati di Box-Muller la quota sopra ${ALARM_K} deviazioni standard è P(Z > ${ALARM_K}) (z)`,
        ksHeavy: 'I dati a code pesanti seguono la stessa normale (falsa di proposito)',
        tailHeavy: `Nei dati a code pesanti la quota sopra ${ALARM_K} deviazioni standard è P(Z > ${ALARM_K}) (falsa di proposito)`,
      },
      coverage: Object.fromEntries(Object.entries(functionNamesIt).map(([key, name]) => [key, `${name}: gli intervalli al ${IT.pct(CONFIDENCE, 0)} contengono l’integrale il ${IT.pct(CONFIDENCE, 0)} delle volte (z)`])),
      bias: Object.fromEntries(Object.entries(functionNamesIt).map(([key, name]) => [key, `${name}: le stime hanno in media l’integrale esatto (z)`])),
    },
  },
  tests: {
    intro: (s) => `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. Il modello normale si controlla sui ${IT.int(s.params.sample)} valori di Box-Muller e su altrettanti a code pesanti, con il test di Kolmogorov-Smirnov e con la quota oltre la soglia dei tre sigma; Monte Carlo con la copertura degli intervalli e con la media delle stime, su ${IT.int(s.params.reps)} ripetizioni di ${IT.int(s.params.points)} punti per ogni funzione. Due ipotesi nulle sono false di proposito (i dati a code pesanti non sono normali), e il loro rifiuto è atteso.`,
    cols: { subject: 'Oggetto', hypothesis: 'Ipotesi nulla H₀', p: 'p-value', verdict: 'Esito', expected: 'Lettura' },
    after: (sum) => {
      const out = [`${sum.rejected} test su ${sum.count} rifiutano l’ipotesi nulla, ${sum.asExpected === sum.count ? 'tutti come atteso' : `${sum.asExpected} su ${sum.count} come atteso`}.`];
      const expectedFalse = IT.num(sum.nulls * SIGNIFICANCE, 2);
      const which = sum.falseRejections.map((t) => IT.pval(t.result.pValue)).join(', ');
      out.push(
        `Fra i ${sum.nulls} test con un’ipotesi nulla vera, al livello ${IT.num(SIGNIFICANCE, 2)} ci si aspettano in media ${expectedFalse} rifiuti per puro caso: ${sum.falseRejections.length === 0 ? 'qui non ce ne sono' : `qui ${sum.falseRejections.length === 1 ? 'ce n’è uno' : `ce ne sono ${sum.falseRejections.length}`} (p = ${which})`}. La correzione di Holm per i test multipli confronta il p-value più piccolo con ${IT.num(SIGNIFICANCE, 2)}/${sum.nulls} = ${IT.num(sum.holmThreshold, 4)}, il successivo con ${IT.num(SIGNIFICANCE, 2)}/${sum.nulls - 1} e così via: ${sum.holm === 0 ? 'nessun rifiuto sopravvive' : `${sum.holm === 1 ? 'sopravvive un rifiuto' : `sopravvivono ${sum.holm} rifiuti`}, da guardare come un possibile difetto`}.`,
      );
      out.push('La copertura di Monte Carlo per 1/√x è segnata come “dipende dalla potenza”: la teoria dice che senza varianza finita l’intervallo non mantiene la promessa del 95% per N fissato, e con abbastanza ripetizioni il test se ne accorge; con poche ripetizioni può non vederlo.');
      return out;
    },
  },
  history: {
    intro: 'Dalle botti di Keplero ai generatori di questa pagina, le idee usate nell’homework in ordine cronologico.',
    legend: { task: 'usato in questa pagina', context: 'contesto' },
    events: [
      { year: '1615', task: true, title: 'Keplero', text: 'Nella Nova stereometria doliorum vinariorum calcola il volume delle botti di vino con una regola a tre punti: l’antenata della regola di Simpson.' },
      { year: '1676-1722', task: true, title: 'Newton e Cotes', text: 'Le formule per integrare con punti equidistanti, che oggi portano i loro nomi: i trapezi e Simpson ne sono i primi due casi.' },
      { year: '1733', task: true, title: 'de Moivre', text: 'La curva normale compare come approssimazione della binomiale: è la densità che l’Esercizio 2 integra.' },
      { year: '1743', task: true, title: 'Simpson', text: 'Thomas Simpson pubblica la regola delle parabole che porta il suo nome, già nota a Cavalieri e a James Gregory.' },
      { year: '1799', task: true, title: 'Kramp', text: 'Christian Kramp calcola la prima tavola dell’integrale di e^(-t²), per la rifrazione astronomica: la prima tavola della normale.' },
      { year: '1805', task: true, title: 'Laplace', text: 'Nel quarto volume del Traité de mécanique céleste la frazione continua per la coda della normale: è la seconda metà del metodo della sezione 2.9.' },
      { year: '1809', task: true, title: 'Gauss', text: 'Nella Theoria motus la normale diventa la legge degli errori di osservazione.' },
      { year: '1814', task: true, title: 'Gauss', text: 'Methodus nova integralium valores per approximationem inveniendi: nodi e pesi scelti per integrare esattamente i polinomi del grado più alto possibile, la regola di Gauss della pagina.' },
      { year: '1826', task: true, title: 'Jacobi', text: 'Collega i nodi di Gauss alle radici dei polinomi di Legendre, come li calcola gaussLegendre() con il metodo di Newton.' },
      { year: '1829', task: true, title: 'Dirichlet', text: 'Nell’articolo sulla convergenza delle serie di Fourier propone una funzione che vale una costante sui razionali e un’altra sugli irrazionali, come esempio di funzione che non si sa integrare: la prima patologica della consegna.' },
      { year: '1835', task: true, title: 'Liouville', text: 'Dimostra che certi integrali, fra cui quello di e^(-t²), non si esprimono con un numero finito di funzioni elementari: Φ va calcolata numericamente (sezione 2.1).' },
      { year: '1854', task: true, title: 'Riemann', text: 'Nella tesi di abilitazione sulle serie trigonometriche, pubblicata dopo la sua morte, definisce l’integrale come limite delle somme sulle strisce.' },
      { year: '1871', task: true, title: 'Glaisher', text: 'Dà il nome alla funzione degli errori, erf, con cui oggi si scrive Φ(z) = (1 + erf(z/√2))/2 (sezione 2.2).' },
      { year: '1875', task: true, title: 'Darboux', text: 'Le somme inferiore e superiore: una funzione è integrabile secondo Riemann se e solo se la loro differenza tende a zero.' },
      { year: '1875', task: true, title: 'Thomae', text: 'Nel suo libro sugli integrali definiti la funzione che vale 1/q in p/q: discontinua su ogni razionale, eppure integrabile secondo Riemann. È la seconda patologica della consegna.' },
      { year: '1898', task: false, title: 'Borel', text: 'Costruisce la misura degli insiemi della retta, additiva sulle successioni numerabili: il terreno su cui lavorerà Lebesgue.' },
      { year: '1902', task: true, title: 'Lebesgue', text: 'La tesi Intégrale, longueur, aire, pubblicata negli Annali di Matematica Pura ed Applicata: l’integrale per livelli e la misura degli insiemi di livello.' },
      { year: '1903', task: false, title: 'Sheppard', text: 'Le tavole della normale su Biometrika, il modello delle tavole che ogni libro di statistica riporta ancora.' },
      { year: '1905', task: false, title: 'Vitali', text: 'Giuseppe Vitali costruisce un insieme non misurabile: anche Lebesgue ha un limite, e la misura non si può dare a ogni sottoinsieme della retta.' },
      { year: '1933', task: true, title: 'Kolmogorov', text: 'Nei Grundbegriffe la probabilità diventa una misura e il valore atteso un integrale di Lebesgue; nello stesso anno, sul Giornale dell’Istituto Italiano degli Attuari, il test sullo scarto massimo fra la funzione di ripartizione empirica e quella teorica.' },
      { year: '1949', task: true, title: 'Metropolis e Ulam', text: 'The Monte Carlo Method: integrare e stimare probabilità estraendo numeri a caso.' },
      { year: '1955', task: true, title: 'Hastings', text: 'Approximations for Digital Computers: formule con pochi coefficienti per i primi calcolatori, fra cui quella di erf che Abramowitz e Stegun riporteranno come 7.1.26.' },
      { year: '1958', task: true, title: 'Box e Muller', text: 'La trasformazione di due uniformi in due normali indipendenti, usata per i dati della sezione 2.15.' },
      { year: '1964', task: true, title: 'Abramowitz e Stegun', text: 'Lo Handbook of Mathematical Functions del National Bureau of Standards, con le formule 7.1.26 e 26.2.17 (Zelen e Severo) della sezione 2.8.' },
      { year: '1969', task: false, title: 'Cody', text: 'Le approssimazioni razionali di erf che usano ancora molte librerie numeriche: oggi Φ si calcola così, non con le regole di quadratura.' },
      { year: '1970', task: true, title: 'Stephens', text: 'La correzione del test di Kolmogorov-Smirnov per campioni finiti, (√n + 0,12 + 0,11/√n) D, usata nella pagina.' },
      { year: '1972', task: true, title: 'Rosenlicht', text: 'Integration in Finite Terms, sull’American Mathematical Monthly: la forma del teorema di Liouville citata dagli appunti del corso e usata nella sezione 2.1.' },
      { year: '1976', task: true, title: 'Lentz', text: 'Un modo stabile di calcolare le frazioni continue dall’alto verso il basso, fermandosi quando il risultato non cambia più: è come la pagina calcola quella di Laplace.' },
      { year: '1985', task: true, title: 'IEEE 754', text: 'Lo standard dei numeri in virgola mobile: ogni double è una frazione m/2^k, ed è per questo che al computer la funzione di Dirichlet vale sempre 1 (sezione 1.8).' },
      { year: '2004', task: true, title: 'Marsaglia', text: 'Evaluating the Normal Distribution, sul Journal of Statistical Software: la serie a termini positivi della sezione 2.7, poche righe di codice per 15 cifre.' },
      { year: '2014-2018', task: true, title: 'SplitMix e xoshiro', text: 'I generatori di numeri casuali di questa pagina, come degli Homework #3 e #4.' },
    ],
    after: 'La storia corre su due binari che questo homework mette insieme. Uno è la definizione dell’integrale, da Riemann a Lebesgue a Kolmogorov, che porta alla probabilità moderna e all’Esercizio 1; l’altro è il calcolo dell’area sotto la campana, dalle botti di Keplero a Gauss, Laplace e alle formule dei manuali, che porta all’Esercizio 2.',
  },
  conclusion: (s, facts) => {
    const F = IT;
    const out = [
      'Esercizio 1. Riemann e Lebesgue arrivano allo stesso numero su tutte le funzioni integrabili secondo Riemann, ma ci arrivano in modi diversi. Sulle funzioni lisce le strisce di Riemann al centro scendono come 1/n², mentre Lebesgue rallenta dove la funzione è piatta, perché lì l’insieme di livello cambia in fretta; Lebesgue è esatto su |x - 0,5|, alla pari sui gradini e più veloce dove Riemann soffre, su 1/√x e su sin(1/x). Come algoritmo però costa di più, perché misurare le controimmagini vuol dire comunque dividere il dominio. Il suo vantaggio vero è un altro: integra funzioni che per Riemann non hanno integrale, come quella di Dirichlet, e permette di scambiare limite e integrale, su cui è costruita la probabilità. Al computer Dirichlet e Thomae vanno calcolate con le frazioni esatte, perché ogni double è razionale.',
      `Esercizio 2. Φ non ha una formula elementare (Liouville), ed erf la scrive in modo esatto senza calcolarla. Delle tre famiglie di metodi della consegna l’integrazione numerica converge con gli ordini della teoria (misurati: ${F.num(facts.orders.left, 2)}, ${F.num(facts.orders.midpoint, 2)}, ${F.num(facts.orders.trapezoid, 2)} e ${F.num(facts.orders.simpson, 2)}, contro 1, 2, 2 e 4), la serie degli appunti perde cifre per z grande, e le formule dei manuali si fermano a 7 cifre. Il metodo della pagina, la serie a termini positivi vicino al centro e la frazione continua di Laplace nelle code, tiene circa 15 cifre ovunque con un solo esponenziale, coincide con mpmath e con ${F.int(facts.nist.agree)} celle su ${F.int(facts.nist.total)} della tavola del NIST, e l’unica cella diversa è un errore della tavola.`,
    ];
    if (s) {
      const u = s.mc.unbounded;
      out.push(`Monte Carlo, il cugino statistico di Lebesgue, mantiene la promessa del 95% sulle funzioni con varianza finita; su 1/√x, che ha varianza infinita, gli intervalli contengono l’integrale il ${F.pct(u.coverage, 1)} delle volte: è la stessa funzione che Riemann non integra in senso proprio.`);
    }
    return out;
  },
  ruleNames: ruleNamesIt,
  tips: {
    piece: (p, i, sign) => {
      const F = IT;
      const what = { rect: 'rettangolo', trap: 'trapezio', parab: 'arco di parabola', node: 'nodo di Gauss' }[p.kind];
      return `${what[0].toUpperCase()}${what.slice(1)} ${i + 1}: da ${F.num(p.x0, 3)} a ${F.num(p.x1, 3)}${p.kind === 'node' ? `, nodo in ${F.num(p.tag, 3)}, peso ${F.num(p.weight, 4)}` : ''}, area ${F.num(p.area, 6)}${sign < 0 ? ' (tolta da 1/2)' : ''}`;
    },
    convergence: (r) => `n = ${IT.int(r.n)}: ${Object.entries(r.errors).map(([rule, e]) => `${ruleNamesIt[rule]} ${e === null ? '-' : IT.err(e)}`).join(', ')}`,
    newton: (r) => `Passo ${r.k}: z = ${IT.num(r.z, 12)}, errore ${IT.err(r.error)}`,
    tail: (r) => `k = ${r.k}: P(Z > k) = ${IT.sci(r.reference, 3)}; 1 - Φ(k) sbaglia di ${IT.err(r.subtractionError)}, la coda diretta di ${IT.err(r.directError)}`,
    alarm: (k, events) => `k = ${IT.num(k, 1)}: dati normali ${IT.sci(tailDirect(k))} (${IT.num(events * tailDirect(k), 1)} al giorno), code pesanti ${IT.sci(heavySf(k))} (${IT.num(events * heavySf(k), 1)} al giorno)`,
    ecdf: (x, F, P) => `x = ${IT.num(x, 3)}: empirica ${IT.num(F, 4)}, Φ ${IT.num(P, 4)}, scarto ${IT.num(Math.abs(F - P), 4)}`,
    strip: (s, kind) => `Da ${IT.sig(s.x0, 4)} a ${IT.sig(s.x1, 4)}: altezza ${IT.sig(s[kind], 5)}, minimo ${IT.sig(s.lower, 5)}, massimo ${IT.sig(s.upper, 5)}`,
    level: (y0, y1, measure, pieces) => `Fascia da ${IT.sig(y0, 4)} a ${IT.sig(y1, 4)}: f ≥ ${IT.sig(y1, 4)} su una lunghezza ${IT.sig(measure, 5)} (${pieces} ${pieces === 1 ? 'intervallo' : 'intervalli'}), area ${IT.sig((y1 - y0) * measure, 5)}`,
    traffic: (y, set) => `Sopra ${IT.int(y)} Mb/s: ${IT.num(set.reduce((s, [a, b]) => s + b - a, 0) * 60, 1)} minuti${set.length ? `, ${set.map(([a, b]) => `${clock(a)}-${clock(b)}`).join(', ')}` : ''}`,
    distribution: (y, m) => `y = ${IT.sig(y, 4)}: f ≥ y su una lunghezza ${IT.sig(m, 5)}`,
    rearrangement: (s, sorted, original) => `s = ${IT.sig(s, 4)}: riordinata ${IT.sig(sorted, 5)}, originale ${IT.sig(original, 5)}`,
    duration: (h, v) => `${IT.num(h, 2)} ore al giorno sopra ${IT.int(v)} Mb/s`,
    compare: (r) => `n = K = ${IT.int(r.n)}: Riemann ${IT.err(r.errors.riemann)}, Lebesgue ${IT.err(r.errors.lebesgue)}`,
    estimates: (from, to, count, share) => `Da ${IT.sig(from, 5)} a ${IT.sig(to, 5)}: ${IT.int(count)} stime, ${IT.pct(share, 1)}`,
    mcPath: (p, exact) => `${IT.int(p.k)} punti: stima ${IT.sig(p.estimate, 6)} ± ${IT.sig(1.96 * p.se, 3)}, esatto ${IT.sig(exact, 6)}`,
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline, con gli stessi calcoli, grafici ed esempi interattivi. Con node homework5.js stampa nel terminale le cinque regole, la tavola della normale, i quantili, le code, le somme di Riemann e di Lebesgue di ogni funzione, Monte Carlo e i test; --z, --mu, --sigma, --rule, --n, --function, --formula, --a, --b e --seed cambiano i parametri.',
    contents: 'Contenuto: index.html, style.css, homework5.js (Riemann, Lebesgue, Dirichlet e Thomae con le frazioni esatte, regole di quadratura, serie, frazione continua, la CDF, generatori, statistica e grafici), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework5',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Gli integrali di Riemann e di Lebesgue calcolati numericamente, e la funzione di ripartizione della normale.',
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
    case 'ks':
      return `D = ${F.num(t.D, 4)} over ${F.int(t.n)} values (largest gap at x = ${F.num(t.at, 2)}), corrected √n D = ${F.num(t.statistic, 3)}, p = ${F.pval(t.pValue)}`;
    case 'proportion':
      return `${F.int(t.count)} out of ${F.int(t.m)}, that is ${F.pct(t.rate, 3)} against ${F.pct(t.expected, 3)}, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'bias':
      return `mean of the estimates ${F.sig(t.mean, 7)} against ${F.sig(t.expected, 7)} over ${F.int(t.m)} repetitions, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

const refEn = (ref) => (ref.exact ? 'exact' : ref.method === 'composite' ? `reference (composite Gauss, ± ${EN.err(ref.uncertainty)})` : 'adaptive Simpson');

const ruleNamesEn = { left: 'Rectangles', midpoint: 'Midpoints', trapezoid: 'Trapezoids', simpson: 'Simpson', gauss: 'Gauss-Legendre' };
const ruleInlineEn = { left: 'rectangles', midpoint: 'midpoints', trapezoid: 'trapezoids', simpson: 'Simpson', gauss: 'Gauss-Legendre' };
const functionNamesEn = { sine: 'sin x on [0, π]', square: 'x² on [0, 1]', jump: 'Step from 1 to 3', vee: '|x - 0.5|', unbounded: '1/√x', indicator: 'Step from 1 to 0', sinc: 'sin(x)/x on [0, π]', oscillating: 'sin(1/x)', traffic: 'Traffic of a day', custom: 'Your own', dirichlet: 'Dirichlet', thomae: 'Thomae' };
const methodNamesEn = { trapezoid: 'Trapezoids, n = 64', simpson: 'Simpson, n = 64', gauss: 'Gauss-Legendre, 64 nodes', alternating: 'Series of the notes', positive: 'Positive series', abramowitz: 'Abramowitz-Stegun 7.1.26', zelen: 'Zelen-Severo 26.2.17', ours: 'Method of the page' };

const en = {
  fmt: EN,
  formulas: {
    cdf: CDF_FORMULAS,
    rules: ruleFormulas({ left: 'rectangles', midpoint: 'midpoints', trapezoid: 'trapezoids', simpson: 'Simpson', gauss: 'Gauss-Legendre', error: 'error', even: 'even', exact: 'exact up to degree 2n - 1' }),
    strategies: strategyFormulas({ symmetry: 'symmetry', truncation: 'truncation', substitution: 'substitution', leftOut: 'left out:' }),
    newton: NEWTON_FORMULAS,
    riemann: RIEMANN_FORMULAS,
    lebesgue: lebesgueFormulas({ measure: 'total length', layer: 'the layer cake' }),
    montecarlo: MC_FORMULAS.replace('1,96', '1.96'),
  },
  ui: {
    index: 'Contents',
    indexTitle: 'Homework contents',
    close: 'Close',
    backToTop: 'Back to top',
    computing: 'Computing...',
    language: 'Language',
    error: (m) => `Error: ${m}`,
  },
  sections: {
    assignment: '0. The assignment',
    exercise1: 'Exercise 1 - The Riemann and the Lebesgue integral',
    idea: '1.1 Two ways of counting',
    tryCoins: 'Try it: Lebesgue’s coins',
    functions: '1.2 The functions',
    riemann: '1.3 Riemann: vertical strips',
    lebesgue: '1.4 Lebesgue: horizontal slices',
    trySlices: 'Try it: vertical or horizontal',
    results: '1.5 The results, side by side',
    compare: '1.6 Accuracy and convergence',
    efficiency: '1.7 What they cost',
    pathological: '1.8 Where the two roads part: Dirichlet and Thomae',
    traffic: '1.9 The traffic of a server',
    montecarlo: '1.10 Monte Carlo, Lebesgue with dice',
    tryMc: 'Try it: Monte Carlo live',
    exercise2: 'Exercise 2 - The distribution function of the normal law',
    liouville: '2.1 Why there is no formula: Liouville',
    erf: '2.2 erf: an exact formula that still has to be computed',
    area: '2.3 The CDF is an area',
    tryArea: 'Try it: the area under the bell',
    rules: '2.4 Five ways of adding up slices',
    infinity: '2.5 The problem of -∞',
    convergence: '2.6 How many points are needed',
    series: '2.7 The series: the one of the notes and the one with positive terms',
    approximations: '2.8 The approximations built on erf',
    ours: '2.9 An efficient method',
    reference: '2.10 Against a reference from the web',
    methods: '2.11 Accuracy and speed of every method',
    table: '2.12 The table of the normal, rebuilt',
    quantiles: '2.13 Backwards: the quantiles',
    tails: '2.14 Far tails and alarm thresholds',
    tryAlarm: 'Try it: the alarm threshold',
    data: '2.15 The model against data',
    checks: '3. Checks',
    tests: '4. Hypothesis tests',
    history: '5. Historical context',
    conclusion: '6. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment has two exercises. The first asks to choose a collection of interesting functions and to integrate them numerically with two approaches inspired by the two definitions: Riemann’s, which cuts the domain into intervals, and Lebesgue’s, which cuts the range of values and measures their preimages; then to compare them in accuracy, convergence and cost, to discuss whether they reach the same value and to show where they behave differently. The second asks for an efficient method for the distribution function of the standard normal law, to be compared with a trusted reference found on the web, together with the reasons why it has no elementary formula (Liouville’s theorem) and the role of the error function erf.',
      'The page goes by examples, with every number computed here. Exercise 1 integrates the nine functions of the assignment and two of the page and puts their results side by side (1.5), measures how they converge (1.6) and what they cost (1.7), and computes Dirichlet’s and Thomae’s functions with exact fractions (1.8). Exercise 2 starts from Liouville and erf (2.1, 2.2), tries numerical integration, series and the handbook approximations (2.3 - 2.8), derives an efficient method from them (2.9), compares it with the NIST table and with mpmath (2.10) and measures the accuracy and speed of every method (2.11).',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned: the lists are laid out as lists, the long dashes of the two titles are written as hyphens and the line of dashes between the two exercises is left out.',
  },
  exercise2: {
    intro: [
      'X ~ N(μ, σ²) has a bell-shaped density and distribution function F(x) = P(X ≤ x), the area under the bell to the left of x. Every N(μ, σ²) goes back to the standard normal with z = (x - μ)/σ, so it is enough to compute Φ. That area has no elementary formula (2.1), and the function erf writes it exactly without computing it (2.2). To compute it the page tries the three families of methods of the assignment, numerical integration (2.3 - 2.6), series (2.7) and the approximations built on erf (2.8), derives an efficient method (2.9), compares it with a reference found on the web (2.10) and measures the accuracy and speed of all of them (2.11). The last sections put it to work: the table, the quantiles, alarm thresholds, a test against simulated data.',
    ],
  },
  area: {
    intro: [
      'The chart is the density of the standard normal and the coloured area is Φ(1.96) = 0.975: the probability that a normal falls below 1.96 standard deviations from its mean, the number behind every 95% confidence interval. Integrating numerically means replacing that area with pieces whose area is known: rectangles, trapezoids, arcs of parabola.',
    ],
    chartTitle: 'The density of the standard normal and Φ(1.96) = 0.975, the coloured area',
  },
  tryArea: {
    intro: [
      'Choose μ, σ and the point x, the rule and the number of pieces n. With the symmetry the pieces cover [μ, x] and the half to the left of μ counts 1/2 without computing; with the truncation they cover [μ - 4σ, x], and what lies to the left of μ - 4σ (3.2 × 10^-5) is left out. Hover over a piece to see its area. Try Simpson with n = 2, then Gauss with 2 nodes: with the same two values of the function, Gauss is far more accurate.',
    ],
    muLabel: 'μ',
    sigmaLabel: 'σ',
    zLabel: (x, z) => `x = ${EN.num(x, 2)}  (z = ${EN.num(z, 2)})`,
    ruleLabel: 'Rule',
    nLabel: (n, rule) => (rule === 'gauss' ? `n = ${n} nodes` : `n = ${n} pieces`),
    strategyLabel: '-∞',
    strategies: { symmetry: 'Symmetry', truncation: 'Truncation at -4σ' },
    result: (st, rule) => {
      const F = EN;
      const how = st.base ? `1/2 ${st.sign > 0 ? '+' : '-'} ${F.num(st.sum, 8)}` : F.num(st.sum, 8);
      return `F(${F.num(st.x, 2)}) ≈ ${how} = ${F.num(st.value, 8)} with ${ruleInlineEn[rule]} and n = ${st.n} (${st.evaluations} values of the density). Exact value ${F.num(st.exact, 8)}, error ${F.err(st.error)}.`;
    },
    chartTitle: (st, rule) => `F(${EN.num(st.x, 2)}) with ${ruleInlineEn[rule]}, n = ${st.n}`,
  },
  rules: {
    intro: [
      'Five rules, from the most naive to the smartest. The first four use equally spaced points: rectangles take the value at the left end of every piece, midpoints the one at the centre, trapezoids join the two ends with a segment, Simpson joins three points with an arc of parabola. Gauss-Legendre chooses instead where to evaluate the function: n nodes and n weights computed so that the rule is exact for every polynomial of degree up to 2n - 1.',
    ],
    formulasTitle: 'The five rules on [a, b]',
    codeTitle: 'The code: integrate() of homework5.js, one line per rule',
    tableTitle: (n) => `Φ(1.96) with n = ${n}: value, error and values of the density used`,
    cols: { rule: 'Rule', n: 'n', evaluations: 'Values of φ', value: 'Computed Φ(1.96)', error: 'Error' },
    gaussTitle: 'Gauss-Legendre with 5 nodes on [-1, 1]: the roots of the Legendre polynomial P_5 and their weights',
    gaussCols: { i: 'i', node: 'Node t_i', weight: 'Weight w_i' },
    after: (rows) => {
      const F = EN;
      const g = rows.find((r) => r.rule === 'gauss');
      const s = rows.find((r) => r.rule === 'simpson');
      const l = rows.find((r) => r.rule === 'left');
      return [`With ${RULES_N} pieces the rectangles are off by ${F.err(l.error)}, Simpson by ${F.err(s.error)}, Gauss with ${g.n} nodes ${g.error === 0 ? 'by nothing at all: the result agrees with the reference to the last digit' : `by ${F.err(g.error)}`}. It is not magic: φ is a very smooth function, and Gauss uses all of its smoothness. In the picture of Gauss every node lies inside a rectangle as wide as its weight: Gauss too is a Riemann sum, with well chosen strips and points.`];
    },
  },
  infinity: {
    intro: [
      'The lower limit of Φ is -∞, and no rule integrates over an infinite interval. Three ways around it. The symmetry: φ is even and its total area is 1, so the left half is exactly 1/2 and only [0, z] is left to integrate. The truncation: stop at -L and accept to lose Φ(-L). The substitution: a change of variable maps (-∞, z] onto (0, 1], and the integrand goes to zero at the end.',
    ],
    formulasTitle: 'Three ways of avoiding -∞',
    chooseLabel: 'Rule',
    tableTitle: (rule, n) => `Error on Φ(z) with ${rule === 'gauss' ? `Gauss-Legendre, ${n} nodes` : `Simpson, n = ${n}`}`,
    cols: { z: 'z', reference: 'Φ(z)', symmetry: 'Symmetry', trunc4: `Truncation at -${TRUNCATIONS[0]}`, trunc8: `Truncation at -${TRUNCATIONS[1]}`, substitution: 'Substitution' },
    after: (f) => {
      const F = EN;
      return [
        `With ${f.n} Gauss nodes the symmetry is off by at most ${F.err(f.gauss[0])}: it integrates over the shortest interval and knows the left half exactly. The truncation at -${TRUNCATIONS[0]} never goes below ${F.err(f.leftOut4)}, the area it leaves out, whatever the rule; at -${TRUNCATIONS[1]} that area is ${F.err(f.leftOut8)}, but the interval is long and needs more points (errors up to ${F.err(f.gauss[2])}). The substitution loses nothing on the way, but it squeezes the bell near u = 1 and with few points does worse (up to ${F.err(f.gauss[3])}).`,
        'The practical lesson: before adding points, use what is known about the function. Here a single observation, the symmetry, is worth more than a thousand extra points.',
      ];
    },
  },
  convergence: {
    intro: [
      'How many points are needed? The chart measures the error on Φ(1.96) as n doubles, on logarithmic scales: every rule becomes a straight line, with a slope equal to its order. Rectangles halve the error when the points double, midpoints and trapezoids divide it by 4, Simpson by 16; Gauss-Legendre falls faster still, until it meets the floor of the rounding of 64-bit numbers, around 10^-16.',
    ],
    chartTitle: (z) => `Error on Φ(${EN.num(z, 2)}) as n grows (logarithmic scales)`,
    tableTitle: 'Error for doubling n',
    cols: { n: 'n' },
    after: (f) => {
      const F = EN;
      const order = (r) => F.num(f.orders[r], 2);
      return [
        `The orders measured on the lines are ${order('left')} for rectangles, ${order('midpoint')} for midpoints, ${order('trapezoid')} for trapezoids and ${order('simpson')} for Simpson, as the theory says (1, 2, 2, 4). For ten correct decimals Simpson uses ${F.int(f.enough.simpson)} values of φ and Gauss ${F.int(f.enough.gauss)}; rectangles do not get there even with 16,384 (error ${F.err(f.left16384)}), and neither do midpoints (${F.err(f.midpoint16384)}).`,
        'Two practical warnings. Beyond the floor more points do not help: the error goes back up, because more roundings add up. And the order holds for smooth functions: with a jump or a corner even Simpson falls back to the first order, as Exercise 1 shows.',
      ];
    },
  },
  table: {
    intro: [
      'At the back of every statistics book there is the table of Φ(z): rows for the first decimal of z, columns for the second. Here it is rebuilt: Φ(0) = 1/2, then one Simpson parabola for every step of 0.01, added to the previous cell. Two values of φ per cell. Hover over the highlighted cells: they are the z of the most used quantiles.',
    ],
    title: (zt) => `Φ(z) for z = row + column, ${EN.int(zt.evaluations)} values of φ in all`,
    after: (zt) => {
      const cell = (z) => zt.table[Math.floor(Math.round(z * 100) / 10)].cells[Math.round(z * 100) % 10].value;
      return [`The worst cell is off by ${EN.err(zt.maxError)} (at z = ${EN.num(zt.at, 2)}): far below half a unit of the fourth digit, the last one the table prints. The value ${EN.num(cell(1.96), 4)} in row 1.9 and column .06 is the 1.96 of 95% intervals; 0.95 falls between ${EN.num(cell(1.64), 4)} (1.64) and ${EN.num(cell(1.65), 4)} (1.65), which is where 1.645 comes from.`];
    },
  },
  quantiles: {
    intro: [
      'The table also works backwards: given p, find z_p with Φ(z_p) = p. It is an equation, and Newton’s method solves it using the derivative of Φ, which is φ, known exactly: every step corrects z by the error divided by the slope. Not to lose digits in the tail, it is better to work on the smaller probability, q = 1 - p, integrated directly.',
    ],
    formulasTitle: 'Newton’s method for the quantile',
    tableTitle: 'The quantiles of the normal, found backwards',
    cols: { p: 'p', z: 'z_p with Newton', steps: 'Steps', reference: 'Reference', difference: 'Difference' },
    newtonTitle: (p) => `Newton step by step for p = ${EN.plain(p)}, starting from z = 0`,
    newtonCols: { k: 'Step', z: 'z_k', F: 'Φ(z_k)', dz: 'Correction', error: 'Error' },
    chartTitle: 'Error of z_k after every step (logarithmic scale)',
    after: (rows) => {
      const last = rows.find((r) => r.p === NEWTON_P);
      return [`z_0.975 = ${EN.num(last.z, 12)} is the 1.96 of Homework #4: we multiplied it by the standard error to get 95% intervals. In the first steps Newton advances slowly, because the bell flattens out; near the root every step doubles the correct digits, as the ever steeper line of the chart shows.`];
    },
  },
  tails: {
    intro: [
      'Far in the tail the probabilities become tiny, and the way of computing them matters. It feels natural to compute P(Z > k) as 1 - Φ(k), but Φ(k) is very close to 1 and the subtraction cancels the digits: it is the same cancellation as the textbook formula of the variance in Homework #4. Integrating the tail directly, Φ(-k) with the substitution, subtracts nothing.',
    ],
    tableTitle: 'P(Z > k) in the two ways, with the relative error',
    cols: { k: 'k', reference: 'P(Z > k)', subtraction: '1 - Φ(k)', subtractionError: 'Error', direct: 'Direct', directError: 'Error' },
    chartTitle: 'Relative error of the two ways as k grows (logarithmic scale)',
    legend: ['1 - Φ(k)', 'tail integrated directly'],
    after: (f) => {
      const F = EN;
      return [`The subtraction loses the sixth digit from k = ${f.micro} and from k = ${f.total} it is off by more than 50%: at k = 8 it gives ${F.sci(f.at8.subtraction)} instead of ${F.sci(f.at8.reference)}, at k = 9 ${F.sci(f.at9.subtraction)} instead of ${F.sci(f.at9.reference)}. The direct tail is never off by more than ${F.err(f.worstDirect)} in relative terms.`];
    },
    alarmIntro: [
      'What is such a far tail good for? For a system that flags anomalies: an IDS that raises an alarm when the requests per minute, the bytes of a session or the response time of a login exceed the mean by k standard deviations. If the data are normal, the share of legitimate events flagged by mistake is exactly P(Z > k), and with a million events a day even 10^-6 means a false alarm a day.',
    ],
    alarmTitle: 'Thresholds at k standard deviations, with a million events a day',
    alarmCols: { k: 'k', normal: 'False alarms, normal data', normalPerDay: 'Per day', heavy: `Heavy tails (Student’s t, ${HEAVY_DF} df)`, heavyPerDay: 'Per day', ratio: 'Ratio' },
    alarmAfter: (rows) => {
      const r3 = rows.find((r) => r.k === 3);
      const r5 = rows.find((r) => r.k === 5);
      return [`The trouble is that the right threshold depends on the tail, and the tails of real data are rarely normal. With heavy-tailed data (a Student’s t with ${HEAVY_DF} degrees of freedom, rescaled to the same mean and variance) the three-sigma rule flags ${EN.num(r3.ratio, 1)} times more events than expected, and at 5 sigma ${EN.int(r5.ratio)} times: the alarm threshold computed on the normal law buries its users in false alarms. Section 1.8 shows how to notice it from the data.`];
    },
  },
  tryAlarm: {
    intro: [
      'Say how many events pass every day and how many false alarms you are ready to put up with: the page finds the threshold k with Newton’s method on the tail integrated directly, and shows what the same threshold would do if the data had heavy tails.',
    ],
    eventsLabel: 'Events a day',
    rateLabel: 'False alarms accepted',
    rates: { tenDay: '10 a day', day: '1 a day', week: '1 a week', month: '1 a month' },
    result: (st) => {
      const F = EN;
      return `With ${F.events(st.events)} events a day, P(Z > k) must be ${F.sci(st.target)}: the threshold is k = ${F.num(st.k, 4)} standard deviations (${st.steps} Newton steps). If the data have heavy tails, the same threshold gives ${F.num(st.heavyPerDay, 1)} false alarms a day instead of ${F.sig(st.perDay, 3)}.`;
    },
    chartTitle: 'P(Z > k) for the normal law and for heavy-tailed data, with the accepted rate dashed (logarithmic scale)',
    legend: ['normal data', `heavy tails, t with ${HEAVY_DF} df`, 'accepted rate'],
  },
  data: {
    intro: [
      'A computed CDF can be tested against data. Here the data are simulated with Box and Muller’s method, which turns pairs of uniform numbers into pairs of independent normals; the Kolmogorov-Smirnov test measures the largest gap D between the empirical distribution function of the data and our numerical Φ. The same test, on the heavy-tailed data of section 1.7, must notice that they are not normal: it is the check to make before trusting a threshold.',
    ],
    fieldsIntro: 'The seed and the number of simulated values; the same seeds also feed Monte Carlo in section 1.10.',
    seedLabel: 'Seed',
    seedHint: `from 0 to ${EN.int(LIMITS.seed[1])}`,
    sampleLabel: 'Simulated values n',
    sampleHint: `from ${EN.int(LIMITS.sample[0])} to ${EN.int(LIMITS.sample[1])}`,
    randomSeed: 'Random seed',
    restore: 'Page values',
    stale: 'A field is not valid: the results stay those of the last valid values.',
    pending: 'New simulation running...',
    badgeTask: 'Page values: seed 2026, 10,000 values, Monte Carlo with 1,000 points and 1,000 repetitions.',
    badgeCustom: (p) => `Your values: seed ${p.seed}, ${EN.int(p.sample)} values, Monte Carlo with ${EN.int(p.points)} points and ${EN.int(p.reps)} repetitions.`,
    run: (s) => `${EN.int(s.draws)} values generated and ${EN.ms(s.simMs)} of computation, in the browser’s worker.`,
    errors: {
      empty: 'The field is empty.',
      notInteger: 'An integer is needed, with no sign and no decimals.',
      range: (min, max) => `A number between ${EN.int(min)} and ${EN.int(max)} is needed.`,
    },
    normalTitle: (n) => `Box-Muller: empirical distribution function of ${EN.int(n)} values against the numerical Φ`,
    heavyTitle: (n) => `Heavy tails: empirical distribution function of ${EN.int(n)} values against the numerical Φ`,
    legend: ['empirical', 'numerical Φ'],
    after: (s) => {
      const F = EN;
      return [
        `On the Box-Muller data the largest gap is D = ${F.num(s.normal.ks.D, 4)} (p = ${F.pval(s.normal.ks.pValue)}), and ${F.pct(s.normal.tail.rate, 3)} of the values fall above 3 standard deviations against the theoretical ${F.pct(s.normal.tail.expected, 3)}. On the heavy-tailed data D = ${F.num(s.heavy.ks.D, 4)} (p = ${F.pval(s.heavy.ks.pValue)}), and ${F.pct(s.heavy.tail.rate, 3)} fall above 3 standard deviations: ${F.num(s.heavy.tail.rate / s.heavy.tail.expected, 1)} times the theoretical share, exactly the extra false alarms of section 1.7.`,
        'Notice where the empirical function departs from the normal: in the middle, not only in the tails. A rescaled t has the same variance as the normal but is narrower in the middle and wider at the sides, and the test sees it by looking at the whole curve.',
      ];
    },
  },
  checks: {
    intro: 'Every rule and every constant of the page is checked against an independent reference: the Gauss nodes against their closed form and NumPy, the rules against polynomials they must integrate exactly, Φ, the tails and the quantiles against mpmath at 40 digits, the exact integrals of Exercise 1 against mpmath, Student’s t and Kolmogorov’s law against SciPy, the generators against their reference C code and against a separate Python implementation. The reference Φ used in the tables (the incomplete gamma function) uses no quadrature rule: a rule checked against itself would prove nothing. The series, the handbook formulas and the method of the page are checked against mpmath, and the NIST table cell by cell.',
    summary: (ok, total) => `${ok} checks out of ${total} passed.`,
    details: (n) => `All ${n} checks`,
    groups: { quadrature: 'The rules', normal: 'The normal law', cdf: 'The methods for Φ', integrals: 'The integrals', generator: 'The generators' },
    cols: { check: 'Check', expected: 'Expected', result: 'Result' },
    ok: 'passed',
    failed: 'failed',
  },
  exercise1: {
    intro: [
      'An integral can be approximated in two ways. Riemann cuts the domain into strips and adds up the areas of the rectangles; Lebesgue cuts the range of values into levels and adds up, level by level, the measure of the set where the function is above, its preimage. On the functions that are Riemann-integrable the two roads lead to the same number (1.5), at different speeds (1.6) and costs (1.7); on the pathological functions they part (1.8). Sections 1.9 and 1.10 show where Lebesgue’s idea really pays: the time spent above a threshold, and Monte Carlo.',
    ],
  },
  idea: {
    intro: [
      'Lebesgue explained the difference with coins. You have to pay a debt with the coins in your pocket. You can take them out one at a time and add them up in the order they come: that is Riemann, who walks along the x axis from left to right. Or you can first sort them by value, count how many there are of each kind and multiply: that is Lebesgue, who groups the points by the value of the function. The total is the same; the second way, though, does not care about the order, and that is why it works even when the order is chaos.',
    ],
  },
  tryCoins: {
    intro: [
      `A handful of ${HANDFUL} coins. Above, in the order they come out of the pocket, with the sum growing coin after coin (Riemann). Below, the same coins sorted by value: how many there are of each kind, times their value (Lebesgue). The sums are in whole cents, so no rounding can hide a difference.`,
    ],
    orderTitle: 'Riemann: in the order they come out',
    groupTitle: 'Lebesgue: grouped by value',
    running: (total) => `Running sum: ${EN.euro(total)}`,
    groupLine: (g) => `${g.count} × ${coinLabel(g.value)} = ${EN.euro(g.subtotal)}`,
    total: (h) => `Riemann ${EN.euro(h.total)}, Lebesgue ${EN.euro(h.byGroups)}: ${h.total === h.byGroups ? 'the same' : 'different'}.`,
    another: 'Another handful',
    coinLabel,
  },
  functions: {
    intro: [
      'The seven functions of the assignment, plus two of the page. sin x and x² are smooth; the two step functions are simple functions, Lebesgue’s building block; |x - 0.5| is continuous but has a corner; 1/√x is infinite at 0 but has a finite area; sin(x)/x is smooth, once its value 1 at 0 is set. The two of the page: sin(1/x), which oscillates infinitely often near 0 while staying bounded, and the traffic of a server over a day, with an attack. The two pathological functions of the assignment, Dirichlet’s and Thomae’s, have their own section (1.8): no number stored in a computer is irrational, so they have to be computed with exact fractions. At the bottom, a function you type yourself.',
    ],
    tableTitle: 'The functions and their exact integrals',
    cols: { name: 'Function', interval: 'Interval', formula: 'f(x)', integral: 'Exact integral', feature: 'What it shows' },
    features: {
      sine: 'Smooth: both methods work',
      square: 'Smooth and monotone, flat at 0',
      jump: 'Simple: Lebesgue’s lower sum is exact',
      vee: 'Continuous, with a corner',
      unbounded: 'Unbounded, with a finite area',
      indicator: 'The indicator of a set',
      sinc: 'Smooth; its antiderivative Si is not elementary',
      oscillating: 'Infinitely many oscillations near 0',
      traffic: 'Data of one day, with an attack',
    },
    chooseLabel: 'Function',
    customTitle: 'Your function',
    formulaLabel: 'f(x) =',
    formulaHint: `Numbers, x, ${FORMULA_NAMES.constants.join(', ')}, + - * / ^, parentheses, |...| for the absolute value, and ${FORMULA_NAMES.functions.join(', ')}. At most ${FORMULA_MAX} characters; 2x means 2*x.`,
    aLabel: 'from a =',
    bLabel: 'to b =',
    restore: 'Restore',
    errors: {
      empty: 'Type a formula.',
      tooLong: `At most ${FORMULA_MAX} characters.`,
      character: (e) => `Character "${e.text}" not allowed at position ${e.at + 1}.`,
      unknown: (e) => `Unknown name "${e.text}" at position ${e.at + 1}.`,
      call: (e) => `${e.text} needs parentheses: ${e.text}(x).`,
      parens: () => 'Unbalanced parentheses.',
      bars: () => 'Unbalanced absolute value bars.',
      syntax: (e) => `Incomplete formula or unexpected symbol at position ${e.at + 1}.`,
      end: () => 'The formula ends too early.',
      deep: () => 'Too many nested parentheses.',
      notDefined: (e) => `The function is not defined at ${EN.pct(e.share, 0)} of the points of the interval.`,
      range: () => 'Invalid ends: two numbers between -1,000,000 and 1,000,000 are needed.',
      order: () => 'a < b is needed.',
    },
    stale: 'Invalid formula: the sections show the last valid function.',
    customNote: (c) => [c.undefinedPoints ? `At ${c.undefinedPoints} points out of 2,001 the formula is not defined: there it counts as 0, which does not change the integral as long as they are isolated points.` : null, c.infinite ? `At ${c.infinite} points it is infinite: Riemann reports it, Lebesgue cuts it at 1,000.` : null].filter(Boolean).join(' '),
  },
  functionNames: functionNamesEn,
  methodNames: methodNamesEn,
  riemann: {
    intro: [
      'Riemann divides [a, b] into n strips and in every strip takes the value of the function at one point: the left end, the right end, the centre. The function is Riemann integrable if, as the strips narrow, every choice of points leads to the same number; Darboux’s test checks it with the lower sum (the lowest value of every strip) and the upper sum (the highest), which must come together.',
    ],
    formulasTitle: 'Riemann and Darboux sums',
    kindLabel: 'Height of the strip',
    kinds: { left: 'Left', right: 'Right', midpoint: 'Centre', lower: 'Minimum', upper: 'Maximum' },
    chartTitle: (name, n, kind) => `${name}: ${n} strips, height at the ${{ left: 'left end', right: 'right end', midpoint: 'centre', lower: 'minimum', upper: 'maximum' }[kind]}`,
    tableTitle: (ref) => `Riemann sums (${refEn(ref)} integral ${EN.sig(ref.value, 10)})`,
    cols: { n: 'n', left: 'Left', right: 'Right', midpoint: 'Centre', lower: 'Lower', upper: 'Upper', gap: 'Upper - lower' },
    note: `The minimum and maximum of every strip are estimated on ${DARBOUX_SAMPLES + 1} points of the strip: exact on monotone stretches, close on smooth ones.`,
    after: (rows, key) => {
      const last = rows[rows.length - 1];
      if (!Number.isFinite(last.gap)) return ['Here the upper sum is infinite for every n: the first strip contains 0, where the function is infinite. In the proper sense the function is not Riemann integrable, and its integral exists only as a limit (an improper integral): the sums at the centre approach 2, but slowly.'];
      if (key === 'jump' || key === 'indicator') return [`With n = ${EN.int(last.n)} strips upper - lower is ${EN.err(last.gap)}: the difference comes only from the strips that touch the jump, and it falls like 1/n.`];
      if (key === 'oscillating') return [`Near 0 every strip contains infinitely many waves, and its minimum and maximum are -1 and 1: upper - lower falls slowly (${EN.err(last.gap)} with n = ${EN.int(last.n)}). The function is still Riemann integrable, because the bad strips take less and less room.`];
      return [`With n = ${EN.int(last.n)} strips upper - lower is ${EN.err(last.gap)}: lower and upper close in on the integral, and that is Riemann’s definition at work.`];
    },
  },
  lebesgue: {
    intro: [
      'Lebesgue divides the values instead: K levels between the lowest value m and the highest M. For every level he measures the set where the function lies above it, whatever its shape: one interval, ten, infinitely many. Every horizontal band has height (M - m)/K and a width equal to that measure. The lower and the upper sum differ by (M - m)(b - a)/K, whatever the function: this guarantee, which does not depend on how the function behaves along x, is what makes Lebesgue so powerful.',
      `The price is measuring the level sets. Here a grid of ${EN.int(LEVEL_CELLS)} cells does it, refined with bisection where the function crosses the level: the ends are exact even at a jump, but a wave that starts and ends inside one cell goes unseen. Unbounded functions are cut at a cap T, and what lies above it is left out.`,
    ],
    formulasTitle: 'Lebesgue sums with K levels',
    chartTitle: (name, K) => `${name}: ${K} levels, every band over the set where f exceeds its level`,
    tableTitle: (ref) => `Lebesgue sums (${refEn(ref)} integral ${EN.sig(ref.value, 10)})`,
    cols: { K: 'K', lower: 'Lower', upper: 'Upper', midpoint: 'Mean', gap: 'Upper - lower' },
    capNote: (cap, exact) => `Values cut at T = ${EN.int(cap)}: the sums integrate min(f, T), which is ${EN.sig(exact, 8)}; the part above the cap, 1/T = ${EN.sig(1 / cap, 3)}, is left out.`,
    distributionTitle: 'Lebesgue’s view: μ{f ≥ y}, the measure of the set above every level y',
    rearrangementTitle: 'The function (purple) and the same with its values sorted from the highest (blue): the same area',
    after: (rows, key) => {
      const last = rows[rows.length - 1];
      if (key === 'jump' || key === 'indicator') return [`The two values of the function, ${EN.plain(rows[0].m)} and ${EN.plain(rows[0].M)}, are the lowest and the highest level, so they fall on a level for every K: with K = ${rows[0].K} the lower sum is already exact, ${EN.sig(rows[0].lower, 10)}. A simple function is made of a few values, and Lebesgue counts them: value times the measure of the set where the function takes it.`];
      return [`With K = ${EN.int(last.K)} levels lower and upper are ${EN.err(last.gap)} apart, exactly (M - m)(b - a)/K. The second chart sorts the values of the function from the highest to the lowest: the curve that comes out (the decreasing rearrangement) has the same area, and it is the chart on the left read sideways.`];
    },
  },
  trySlices: {
    intro: [
      'The same strips and slices live: move n and K and compare. With the step functions Lebesgue’s lower sum is exact for every K, while Riemann pays for the jump; with x² Riemann’s strips are faster; with sin(1/x) both struggle near 0. Play grows n and K together from 1 to 64.',
    ],
    nLabel: (n) => `n = ${n} strips`,
    kLabel: (K) => `K = ${K} levels`,
    play: 'Play',
    pause: 'Pause',
    values: (r, l, ref) => {
      const F = EN;
      const e = (v) => (Number.isFinite(v) ? F.err(Math.abs(v - ref.value)) : '∞');
      return `Riemann at the centre ${F.sig(r.midpoint, 8)} (error ${e(r.midpoint)}), between ${F.sig(r.lower, 6)} and ${F.sig(r.upper, 6)}. Lebesgue ${F.sig(l.midpoint, 8)} (error ${e(l.midpoint)}), between ${F.sig(l.lower, 6)} and ${F.sig(l.upper, 6)}. Integral (${refEn(ref)}) ${F.sig(ref.value, 10)}.`;
    },
    riemannTitle: (n) => `Riemann, ${n} strips`,
    lebesgueTitle: (K) => `Lebesgue, ${K} levels`,
  },
  results: {
    intro: [
      'The answer to the assignment in one table: every function with its integral, the Riemann sum and the Lebesgue sum with 729 strips and 729 levels (taken at the midpoints), their two errors and the verdict on the question of the assignment: do the two approaches reach the same value? 729 = 3⁶ is an odd number of strips, so the jump at 0.5 of the two step functions falls inside a strip, as happens to a jump whose position is unknown. Dirichlet and Thomae come from section 1.8, computed with exact fractions.',
    ],
    tableTitle: 'Riemann and Lebesgue on every function, with 729 strips and 729 levels',
    cols: { name: 'Function', integral: 'Integral', riemann: 'Riemann', lebesgue: 'Lebesgue', riemannError: 'Error R', lebesgueError: 'Error L', verdict: 'Same value?' },
    verdicts: { yes: 'Yes', improper: 'Yes, as an improper limit', noRiemann: 'No: Riemann does not exist', unknown: 'Yes, if it is integrable' },
    integralCell: (row) => `${EN.sig(row.reference, 10)}${row.exact ? '' : ' (ref.)'}`,
    riemannCell: (row) => (row.kind === 'dirichlet' ? 'none: lower 0, upper 1' : row.kind === 'thomae' ? `between 0 and ${EN.sig(row.upper, 3)}` : EN.sig(row.riemann, 10)),
    lebesgueCell: (row) => (row.kind === 'regular' ? EN.sig(row.lebesgue, 10) : '0'),
    errorCell: (v) => (v === null ? '-' : EN.err(v)),
    pending: 'The sums of the nine functions are computed with the simulations: a few seconds. Dirichlet and Thomae are already here.',
    after: (rows) => {
      const F = EN;
      const regular = rows.filter((r) => r.kind === 'regular' && r.key !== 'custom');
      const names = (list) => list.map((r) => inline(functionNamesEn[r.key])).join(', ') || 'none';
      const unbounded = rows.find((r) => r.key === 'unbounded');
      const thomae = rows.find((r) => r.key === 'thomae');
      return [
        `On the functions that are Riemann-integrable the two numbers reach the same value: with 729 strips and levels the errors are all small, and section 1.6 shows that they keep falling as n and K grow. With 729 Riemann is closer on ${names(regular.filter((r) => r.errors.riemann <= r.errors.lebesgue))}; Lebesgue on ${names(regular.filter((r) => r.errors.lebesgue < r.errors.riemann))}.`,
        `The exceptions are the ones the assignment asks for. 1/√x is unbounded: for Riemann it has an integral only as an improper limit, and the midpoint sums get there slowly (error ${F.err(unbounded ? unbounded.errors.riemann : null)}); for Lebesgue the integral exists directly, but the computation has to cut the values at a ceiling. Dirichlet’s function has no Riemann integral, because every lower sum is 0 and every upper sum 1; its Lebesgue integral is 0. Thomae’s function has both integrals, equal to 0: its upper sum with ${F.int(thomae ? thomae.n : 0)} strips is ${F.sig(thomae ? thomae.upper : null, 3)} and keeps falling.`,
      ];
    },
  },
  efficiency: {
    intro: [
      'The cost is counted in values of f, which is what matters when f is expensive to compute (a simulation, a measurement). Riemann with n strips at their midpoints needs n of them. Lebesgue needs many more, because to measure a level set it has to know where f crosses the level: here a grid of 4,097 points, then 44 bisections for every crossing of every level. On a computer, in short, Lebesgue cuts the domain too: it does so to measure the preimages. The table gives, for a relative error of 1% and of 0.01%, the first n = K that reaches it, the values of f it costs and the time of one sum in your browser.',
    ],
    chartTitle: (name) => `${name}: relative error against values of f (logarithmic scales)`,
    legend: ['Riemann, midpoints', 'Lebesgue, mean'],
    tableTitle: 'What a relative error of 10^-2 and of 10^-4 takes',
    cols: { name: 'Function', target: 'Error', riemann: 'Riemann', lebesgue: 'Lebesgue' },
    cell: (hit, method) => (hit ? `n = ${EN.int(hit.n)}: ${EN.int(hit[method].evaluations)} values, ${EN.dur(hit[method].ms)}` : 'not with 729'),
    pending: 'The costs are measured with the simulations: a few seconds.',
    after: (f) => {
      const F = EN;
      const names = (keys) => keys.map((k) => inline(functionNamesEn[k])).join(', ');
      const out = [`For an error of 1%, where both get there, Lebesgue needs from ${F.int(f.minRatio)} to ${F.int(f.maxRatio)} times the values of f that Riemann needs. The reason is not the number of levels, which is sometimes smaller than the number of strips${f.fewerLevels.length ? ` (it happens with ${names(f.fewerLevels)})` : ''}: it is measuring the level sets, which costs a grid and a bisection for every crossing.`];
      if (f.onlyLebesgue.length) out.push(`Only Lebesgue gets there on ${names(f.onlyLebesgue)}: this is where Riemann’s strips suffer, and every extra level is worth its cost.`);
      if (f.onlyRiemann.length) out.push(`Only Riemann gets there on ${names(f.onlyRiemann)}.`);
      out.push('In short: as a general algorithm Riemann is cheaper, by far; Lebesgue pays off when the measure of the preimages is already known or cheap: for simple functions, for a function given as a list of values (where counting them is easy), or when the question is how long f stays above a threshold, as in the traffic of section 1.9.');
      return out;
    },
  },
  pathological: {
    intro: [
      'The two pathological functions of the assignment. Dirichlet’s is 1 on the rationals and 0 on the irrationals of [0, 1]; Thomae’s is 1/q at the rational p/q in lowest terms and 0 on the irrationals. Every Riemann strip holds rationals and irrationals, so for both the lower sum is always 0; the upper sum is always 1 for Dirichlet, while for Thomae it falls towards 0. So Dirichlet’s function is not Riemann-integrable and Thomae’s is, with integral 0. For Lebesgue both are 0: the set where Dirichlet’s function is above a level is the set of the rationals, which is countable and so of measure 0; the set where Thomae’s is at least 1/Q is a finite set of fractions.',
      'On a computer, though, they cannot be computed like the others, and the reason is practical: every number a program stores is rational. A double is always a fraction m/2^k: irrational numbers do not exist, not even π. The table shows the exact fraction of a few numbers as the browser stores them: for the computer Dirichlet’s function is 1 everywhere, and its “numerical integral” is 1, not 0.',
    ],
    numbers: { tenth: '0.1', third: '1/3', pi4: 'π/4', sqrt2: '√2', e: 'e' },
    cols: { number: 'Number', fraction: 'Exact fraction stored', value: 'Dirichlet on the computer' },
    thomaeIntro: 'This is why the page computes the two functions with the exact arithmetic of fractions. The points of the sums are fractions i/n, or irrational numbers written down as such, (i + 1/√2)/n; the largest value of Thomae’s function on a strip is 1/q, with q the smallest denominator of a fraction inside the strip, found with integers only. The chart shows Thomae’s function with the fractions up to q = 40 and the staircase of its upper sum with 10 strips.',
    chartTitle: (upper) => `Thomae’s function (q ≤ 40) and the staircase of its upper sum with 10 strips, ${EN.sig(upper, 4)}`,
    tableTitle: 'The sums of Thomae’s function, with exact fractions',
    thomaeCols: { n: 'n', rational: 'Points i/n', irrational: 'Irrational points', lower: 'Lower', upper: 'Upper', doubles: 'Points i/n as doubles' },
    after: (p) => {
      const F = EN;
      const first = p.thomae[0];
      const last = p.thomae[p.thomae.length - 1];
      const mid = p.thomae.find((r) => r.n === 1000) || last;
      return [
        `The upper sum of Thomae’s function falls from ${F.sig(first.upper, 3)} with ${F.int(first.n)} strips to ${F.sig(last.upper, 3)} with ${F.int(last.n)}, with measured order ${F.num(p.upperOrder, 2)}: almost 1/√n, because every strip of width 1/n holds a fraction with a denominator close to √n. The lower sum is always 0, so the Riemann integral exists and is 0, and the sums with the points i/n get there too. For Lebesgue the set where Thomae’s function is at least 1/Q holds ${p.farey.map((r) => `${F.int(r.points)} fractions for Q = ${F.int(r.Q)}`).join(', ')}: many points, but a finite set of points has measure 0, and every Lebesgue sum is exactly 0.`,
        `With doubles, instead, a program sees i/n rounded: 0.1 becomes 3602879701896397/2^55, and there Thomae’s function is 2^-55. Only the dyadic fractions survive, 1/2, 1/4, 3/8 and so on: with n = ${F.int(mid.n)} the sum is ${F.sig(mid.doubles, 3)} instead of ${F.sig(mid.rational, 3)}, a number that comes neither from mathematics nor from the discretization error, but from the binary representation. Dirichlet’s function fares worse: with doubles every sum is 1, the true integral is 0. These are the only functions of the page that mathematics integrates and floating point does not.`,
      ];
    },
  },
  liouville: {
    intro: [
      'Φ(z) is the integral of φ(t) = e^(-t²/2)/√(2π) up to z, and that integral cannot be written with a finite number of elementary functions (polynomials, exponentials, logarithms, trigonometric functions, roots and their compositions). The notes of the course correct the book here: an antiderivative exists, Φ itself, but it is not elementary. This is Liouville’s theorem (1835), in the form of Rosenlicht that the notes quote: if f and g are rational and g is not constant, the integral of f e^g is elementary only if it equals R e^g, with R rational and R′ + g′R = f.',
      'For the bell f = 1 and g = -x²/2, so a rational R with R′ - xR = 1 would be needed. If R were a polynomial of degree d, the term -xR would have degree d + 1 and nothing would cancel it; if R had a pole of order m, R′ would have one of order m + 1, and nothing would cancel that either. So R does not exist and Φ is not elementary. The numbers show it too: every solution of R′ - xR = 1 is S(x) + C e^(x²/2), with S(x) = (Φ(x) - 1/2)/φ(x), and S grows like e^(x²/2), faster than any rational function.',
    ],
    formulas: "R′(x) - x R(x) = 1\nS(x) = (Φ(x) - 1/2)/φ(x) = x + x³/3 + x⁵/(3·5) + x⁷/(3·5·7) + ...,      S′ = 1 + x S",
    tableTitle: 'S(x) = (Φ(x) - 1/2)/φ(x): the candidate, and why it is not rational',
    cols: { x: 'x', S: 'S(x)', ratio: 'S(x)/e^(x²/2)', degree: 'Apparent degree x S′/S' },
    after: (rows) => {
      const F = EN;
      const last = rows[rows.length - 1];
      return [`The ratio S(x)/e^(x²/2) settles at √(π/2) = ${F.num(Math.sqrt(Math.PI / 2), 4)}: S grows like an exponential of x². The apparent degree x S′(x)/S(x), which for a rational function tends to its degree, is ${F.num(rows[0].degree, 2)} at x = ${rows[0].x} and ${F.num(last.degree, 2)} at x = ${last.x}, and keeps growing like x². No rational function does that: it is Liouville’s proof seen in numbers. The same S, written as a series, is the positive series of section 2.7 and the heart of the method of section 2.9. The same theorem says that the antiderivative of sin(x)/x, one of the functions of Exercise 1, is not elementary either: this is why its exact integral comes from the sine integral Si(π).`];
    },
  },
  erf: {
    intro: [
      'With the error function, erf(x) = (2/√π) ∫_0^x e^(-t²) dt, the formula becomes exact: Φ(z) = (1 + erf(z/√2))/2, and P(|Z| < k) = erf(k/√2). But erf is only the name given to that integral, and a name computes nothing: it is like writing √2 or π, exact symbols whose digits still have to be obtained with an algorithm. Every erf of every library is a program: the mathematical libraries of C use rational approximations on several intervals, the notes of the course the Taylor series. JavaScript, the language of this page, does not even have an erf: Math.erf does not exist, and the page writes its own.',
      'A practical example is the 68-95-99.7 rule, that is P(|Z| < k) = erf(k/√2) for k = 1, 2, 3. The notes derive it from a table with 4 decimals, doubling Φ(k) after rounding it; the table compares it with the method of the page and with mpmath.',
    ],
    formulas: 'erf(x) = (2/√π) ∫_0^x e^(-t²) dt\nΦ(z) = (1 + erf(z/√2))/2,      P(|Z| < k) = erf(k/√2) = 2Φ(k) - 1',
    tableTitle: 'The 68-95-99.7 rule: P(|Z| < k) = erf(k/√2)',
    cols: { k: 'k', value: 'Method of the page', reference: 'mpmath', rounded: 'From a table with 4 decimals' },
    after: (rows) => {
      const F = EN;
      return [`Rounding Φ(k) to 4 decimals before doubling it costs the last digit: ${rows.map((r) => `for k = ${r.k} the table gives ${F.num(r.rounded, 4)} instead of ${F.num(r.reference, 4)}`).join(', ')}. The method of the page differs from mpmath by at most one unit in the sixteenth digit. From here the page tries the three families of methods the assignment suggests: numerical integration (2.3 - 2.6), series (2.7) and the approximations built on erf (2.8).`];
    },
  },
  series: {
    intro: [
      'The notes of the course compute Φ by integrating term by term the Taylor series of e^(-t²/2), that is the power series of erf. It is an alternating series, and the alternating series theorem guarantees that the error is no larger than the first term left out. In exact arithmetic it works for every z; on a computer it does not. For large z the terms grow up to about e^(z²/2) before they fall, and adding huge numbers of opposite signs to get a number close to 1 costs digits: one for every power of ten of the largest term.',
      'The same function can also be written with all its terms positive (Marsaglia, 2004): the sum is exactly Liouville’s S of section 2.1. No cancellation inside the sum, one exponential outside it. The table compares the two series for z from 1 to 8; the chart follows the error as the number of terms grows.',
    ],
    formulas: 'Φ(z) = 1/2 + (1/√(2π)) Σ_(k≥0) (-1)^k z^(2k+1)/(2^k (2k+1) k!)          (notes, alternating)\nΦ(z) = 1/2 + φ(z) Σ_(k≥0) z^(2k+1)/(1·3·5···(2k+1))                     (positive terms)',
    tableTitle: 'The two series: terms needed, digits lost, errors',
    cols: { z: 'z', altTerms: 'Notes: terms', largest: 'Largest term', lost: 'Digits lost', altError: 'Error', posTerms: 'Positive: terms', posError: 'Error' },
    chooseLabel: 'z',
    chartTitle: (z) => `Φ(${EN.plain(z)}): error against the number of terms (logarithmic scale)`,
    legend: ['Series of the notes', 'First term left out (the alternating series bound)', 'Series with positive terms'],
    after: (rows) => {
      const F = EN;
      const at = (z) => rows.find((r) => r.z === z);
      const five = at(5);
      const eight = at(8);
      return [`Up to z = 3 the two series are equivalent. Then the series of the notes loses digits: at z = 5 its largest term is ${F.sci(five.alternating.largest)} and the error rises to ${F.err(five.alternating.error)}; at z = 8 the largest term is ${F.sci(eight.alternating.largest)}, the digits lost are ${F.num(eight.alternating.lost, 1)} and the error is ${F.err(eight.alternating.error)}, while the positive series stays at ${F.err(eight.positive.error)}. The alternating series bound holds only in exact arithmetic: in the chart, for large z, the error stops far above the first term left out, at the level of the roundings of the largest terms. The terms needed grow like z²: ${eight.positive.terms} for the positive series at z = 8.`];
    },
  },
  approximations: {
    intro: [
      'The approximations built on erf are the ones of the handbooks: a fixed formula, one exponential and five coefficients found once and for all. Formula 7.1.26 of Abramowitz and Stegun (from Hastings, 1955) writes erf(x) ≈ 1 - t(a₁ + a₂t + a₃t² + a₄t³ + a₅t⁴) e^(-x²), with t = 1/(1 + 0.3275911 x) and an error of at most 1.5 × 10^-7; for Φ the error is halved. Formula 26.2.17 (Zelen and Severo) approximates the tail P(Z > z) directly with a formula of the same kind, with an error below 7.5 × 10^-8.',
    ],
    chartTitle: 'Error of the two formulas along z, with the published bound ±7.5 × 10^-8',
    legend: ['Abramowitz-Stegun 7.1.26', 'Zelen-Severo 26.2.17', 'Published bound'],
    after: (f) => {
      const F = EN;
      return [`The errors wave: it is the signature of approximations built to spread the error evenly instead of piling it up in one place. The largest gaps, ${F.err(f.as)} at z = ${F.num(f.asAt, 1)} and ${F.err(f.zs)} at z = ${F.num(f.zsAt, 1)}, keep within the published bounds (${F.sci(f.asBound)} and ${F.sci(f.zsBound)}). They are the fastest (2.11) and enough for a table with 5 decimals, but they give no more than 7 digits, and far in the tail they are wrong in proportion: at z = -9, where Φ is 1.1 × 10^-19, formula 7.1.26 returns ${F.sig(f.asTail, 3)}, and 26.2.17 at z = -37 has a relative error of ${F.pct(f.zsRelative, 0)}.`];
    },
  },
  ours: {
    intro: (f) => [
      `The method of the page puts together the best two pieces. For |z| < ${f.switchZ} it uses the positive series of section 2.7, which cancels nothing and needs at most ${f.seriesTerms} terms there. For |z| ≥ ${f.switchZ} it uses Laplace’s continued fraction (1805) for Mills’ ratio, P(Z > w)/φ(w), computed with Lentz’s method: it converges for every w > 0, the faster the larger w is, and works on the tail directly, so it keeps every digit even of probabilities like 10^-300. Either way one exponential is enough.`,
    ],
    formulas: 'Φ(z) = 1/2 + φ(z) Σ_(k≥0) z^(2k+1)/(1·3·5···(2k+1))                  |z| < 2\nP(Z > w) = φ(w) / (w + 1/(w + 2/(w + 3/(w + ...))))                   w = |z| ≥ 2,   Φ(-w) = P(Z > w)',
    after: (f) => {
      const F = EN;
      return [`Against mpmath, for z from -8 to 8 and in the tail down to z = -37: largest absolute error ${F.err(f.ours.absolute)}, largest relative error ${F.err(f.ours.relative)} (at z = ${F.num(f.ours.relAt, 1)}, where the series still subtracts φS from 1/2). That means about 15 correct digits everywhere, against the 7 of the handbook formulas, with at most ${f.ours.terms} terms. Section 2.11 measures the price.`];
    },
  },
  reference: {
    intro: [
      'The trusted reference found on the web is twofold. The first is the table of the normal law of the NIST/SEMATECH e-Handbook of Statistical Methods (section 1.3.6.7.1), which gives P(0 ≤ Z ≤ z) with 5 decimals for z from 0 to 4.09: the classic table, which anyone can check. Five decimals, though, cannot see errors below 5 × 10^-6, so the second reference is mpmath, an open-source Python library with arbitrary precision, used here with 60 digits.',
    ],
    link: 'The NIST table',
    tableTitle: 'Φ(z) at a few points: NIST, mpmath and the method of the page',
    cols: { z: 'z', nist: 'NIST, 5 decimals', mpmath: 'mpmath, 60 digits', ours: 'Method of the page', error: 'Error', nistError: 'Error of NIST' },
    nist: (n) => `The whole table: ${n.agree} cells out of ${n.total} agree with the method of the page rounded to 5 decimals.`,
    mismatch: (m) => `The only one that does not is z = ${EN.num(m.z, 2)}: the table prints ${EN.num(m.table, 5)}, the method gives ${EN.num(m.ours, 10)}, which rounds to ${EN.num(m.rounded, 5)}. mpmath sides with the method: the table is off by one unit in its last digit.`,
    after: (rows) => {
      const F = EN;
      const worst = Math.max(...rows.map((r) => r.error));
      const nistWorst = Math.max(...rows.filter((r) => r.nistError !== null && r.z !== 1.36).map((r) => r.nistError));
      return [`At the points of the table the error of the method against mpmath is at most ${F.err(worst)}, the last digit of a double. The error of the NIST table stays below 5 × 10^-6, half a unit of the fifth decimal (at most ${F.err(nistWorst)}), except at z = 1.36. A reference has to be checked like a result: this is why the page uses two.`];
    },
  },
  methods: {
    intro: [
      'All the methods side by side, against mpmath: the largest absolute error for z from -8 to 8, the largest relative error below the mean, where Φ is small (down to z = -37), how many exponentials and how many terms one call takes, and how long it lasts. The time is measured here, in your browser: every method computes Φ at 1,001 points between -8 and 8, repeating until at least 8 milliseconds have passed, and the measure is repeated 11 times, taking turns between the methods. The table gives the median with its confidence interval from the order statistics, which assumes nothing about the shape of the distribution of the times.',
    ],
    tableTitle: 'Accuracy, cost and time of every method',
    cols: { method: 'Method', absolute: 'Absolute error', relative: 'Relative error in the tail', exp: 'exp', terms: 'Terms', time: 'ns per call' },
    relativeCell: (v) => (!Number.isFinite(v) ? '∞' : v >= 1 ? '≥ 1' : EN.err(v)),
    timeCell: (t) => (t ? `${EN.int(t.median)} [${EN.int(t.lo)}, ${EN.int(t.hi)}]` : 'measuring'),
    chartTitle: 'Error of every method along z, against mpmath (logarithmic scale)',
    after: (f) => {
      const F = EN;
      const out = [`The method of the page is the only one that keeps about 15 digits both in absolute and in relative terms. Gauss-Legendre with 64 nodes reaches the same absolute accuracy, but takes 64 exponentials and in the lower tail loses its digits in the subtraction from 1/2. The handbook formulas are the fastest, but stop at 7 digits. The series alone are not enough: the one of the notes loses digits for large z, the positive one loses the relative accuracy in the lower tail.`];
      if (f.speedup) out.push(`In your browser the method of the page is ${F.num(f.speedup, 1)} times faster than Gauss-Legendre and costs ${F.num(f.slowdown, 1)} times formula 7.1.26 (intervals at ${F.pct(f.coverage, 1)}). It is the same trade-off as real libraries: a quick formula where it is enough, a different one in the tail.`);
      return out;
    },
  },
  compare: {
    intro: [
      'How do they converge? The chart follows the error of the two mean sums as n = K = 3, 9, 27, ..., 729 grows, and dashed the gap between lower and upper of each method, which is their guarantee. The table at the bottom measures the order of convergence on every function, the slope of the line of log error against log n: order 2 means that tripling n divides the error by 9.',
    ],
    chartTitle: (name) => `${name}: error as n = K grows (logarithmic scales)`,
    legend: ['Riemann, centre', 'Lebesgue, mean', 'Riemann, upper - lower', 'Lebesgue, upper - lower'],
    tableTitle: 'Errors and guarantees for tripling n = K',
    cols: { n: 'n = K', riemann: 'Riemann’s error', lebesgue: 'Lebesgue’s error', riemannGap: 'Riemann’s guarantee', lebesgueGap: 'Lebesgue’s guarantee' },
    customPending: 'The comparison of your function is computed here, in the browser: a few tenths of a second.',
    after: (f, name) => {
      const F = EN;
      const winner = f.winner === 'lebesgue' ? 'Lebesgue' : 'Riemann';
      return [`${name}: with n = K = ${F.int(f.n)} ${winner} wins, by ${F.num(f.ratio, 1)} times (errors ${F.err(f.riemann)} for Riemann and ${F.err(f.lebesgue)} for Lebesgue). Riemann’s error falls with order ${F.num(f.riemannOrder, 2)}, Lebesgue’s with order ${F.num(f.lebesgueOrder, 2)}${f.riemannInfinite ? '; Riemann’s guarantee is infinite, Lebesgue’s is not' : ''}.`];
    },
    summaryTitle: 'All functions: errors with n = K = 9 and 729, and measured orders of convergence',
    summaryCols: { name: 'Function', riemannSmall: 'Riemann, 9', lebesgueSmall: 'Lebesgue, 9', riemannLarge: 'Riemann, 729', lebesgueLarge: 'Lebesgue, 729', orderRiemann: 'Order R', orderLebesgue: 'Order L', winner: 'Wins' },
    orderCell: (v) => (Number.isFinite(v) ? EN.num(v, 2) : 'exact'),
    summaryAfter: (rows) => {
      const F = EN;
      const names = (who) => rows.filter((r) => r.winner === who).map((r) => inline(functionNamesEn[r.key])).join(', ') || 'none';
      const order = (key, m) => {
        const r = rows.find((x) => x.key === key);
        return r ? F.num(r.orders[m], 2) : F.na;
      };
      return [
        `With n = K = 729 Riemann wins on: ${names('riemann')}; Lebesgue on: ${names('lebesgue')}.`,
        `The orders tell why. On smooth functions Riemann at the midpoints has order 2 (${order('sine', 'riemann')} on sin x, ${order('square', 'riemann')} on x²), Lebesgue about 1.5 (${order('sine', 'lebesgue')} and ${order('square', 'lebesgue')}): where f is flat, at the maximum of sin x or the minimum of x², the set above a level changes like a square root, and Lebesgue’s slices follow it poorly. On |x - 0.5|, instead, the measure above the level y is 1 - 2y, a straight line, and Lebesgue is exact with 3 levels already. On the step functions the order is 1 for both, because the jump falls inside a strip, but Lebesgue’s error is half of Riemann’s. On 1/√x Riemann’s order drops to ${order('unbounded', 'riemann')} while Lebesgue’s stays at ${order('unbounded', 'lebesgue')}; on sin(1/x) both struggle (${order('oscillating', 'riemann')} and ${order('oscillating', 'lebesgue')}).`,
        'Lebesgue’s real advantage is not speed: it is that its guarantee, (M - m)(b - a)/K, does not depend on how the function behaves along x, and that its theorems on limits (monotone and dominated convergence) allow limits and integrals to be swapped, which probability and statistics are built on.',
      ];
    },
  },
  traffic: {
    intro: [
      `An example from cybersecurity. The traffic of a server over a day, in Mb/s: ${TRAFFIC.base} at night, a bell of ${TRAFFIC.day} around ${TRAFFIC.peak}:00, and at ${TRAFFIC.at}:00 an attack that for a quarter of an hour adds up to ${TRAFFIC.attack} Mb/s. Riemann and Lebesgue answer two different questions about the same curve. Riemann adds up minute after minute and gives the total transferred, the figure on the bill. Lebesgue asks, for every threshold, how many hours the link stayed above it: the question of whoever sizes the bandwidth or a DDoS defence.`,
    ],
    chartTitle: 'The traffic of the day (Mb/s): every band covers the hours in which the traffic exceeds its threshold',
    tableTitle: 'The hours above every threshold (Lebesgue’s level sets)',
    cols: { y: 'Threshold (Mb/s)', hours: 'Hours above', minutes: 'Minutes above', when: 'When' },
    durationTitle: 'The load duration curve: the traffic sorted from the busiest minute, with the thresholds from 350 Mb/s up',
    after: (r) => {
      const F = EN;
      const above500 = r.rows.find((row) => row.y === 500);
      return [
        `Over the whole day ${F.num(r.total, 1)} Mb/s × hours go through, that is ${F.int(r.gigabytes)} GB (the Riemann sums minute by minute give ${F.num(r.riemann, 1)}). The attack is only ${F.pct(r.attackShare, 1)} of it: in the total it hardly shows. In the level sets, instead, it is the only protagonist: above 500 Mb/s the link stays ${F.num(above500.hours * 60, 1)} minutes, all between ${clock(above500.intervals[0][0])} and ${clock(above500.intervals[above500.intervals.length - 1][1])}, and the peak reaches ${F.int(r.peak)} Mb/s.`,
        'The load duration curve, the traffic sorted from the busiest minute to the quietest, is the decreasing rearrangement of section 1.4: network and power engineers have used it for decades without calling it Lebesgue. Its area is the total again.',
      ];
    },
  },
  montecarlo: {
    intro: [
      'Monte Carlo integrates by drawing points at random: the integral of f on [a, b] is (b - a) times the expected value of f(U), with U uniform, and the mean of N values estimates it. It never looks at the order of the points along the x axis, only at how many values fall where: it is a statistical relative of Lebesgue. Its error falls as 1/√N whatever the smoothness of the function, and every estimate comes with its confidence interval, computed with the three lines of Welford from Homework #4.',
    ],
    formulasTitle: 'Monte Carlo',
    fieldsIntro: 'How many points every estimate uses and how many independent estimates are made for every function; the seed is the one of section 2.15.',
    pointsLabel: 'Points per estimate N',
    pointsHint: `from ${EN.int(LIMITS.points[0])} to ${EN.int(LIMITS.points[1])}`,
    repsLabel: 'Repetitions',
    repsHint: `from ${EN.int(LIMITS.reps[0])} to ${EN.int(LIMITS.reps[1])}`,
    tableTitle: (s) => `${EN.int(s.params.reps)} estimates of ${EN.int(s.params.points)} points for every function`,
    cols: { name: 'Function', exact: 'Exact integral', mean: 'Mean of the estimates', sd: 'Standard deviation', se: 'Mean standard error', coverage: `${EN.pct(CONFIDENCE, 0)} intervals containing it` },
    chooseLabel: 'Histogram of',
    histogramTitle: (name, s) => `${name}: the ${EN.int(s.params.reps)} estimates, with the normal law of the central limit theorem and the exact value`,
    legend: ['estimates', 'expected normal', 'exact value'],
    after: (s) => {
      const F = EN;
      const u = s.mc.unbounded;
      const ok = FUNCTIONS.filter((key) => key !== 'unbounded').map((key) => `${inline(functionNamesEn[key])} ${F.pct(s.mc[key].coverage, 1)}`).join(', ');
      return [
        `For the ${FUNCTIONS.length - 1} functions with a finite variance the 95% intervals contain the exact integral in these shares: ${ok}. That is the promise of the interval, and the tests of section 4 say whether it is kept.`,
        `With 1/√x the share is ${F.pct(u.coverage, 1)}${u.coverage < 0.94 ? ', below the promise' : ''}. The estimates stay right on average (${F.sig(u.mean, 6)} against 2), but f(U) = 1/√U has an infinite variance: every now and then U falls very close to 0 and a single point moves the whole mean. The histogram shows it: a long tail to the right and a peak shifted to the left, and the standard deviation of a sample almost always underestimates the true uncertainty. It is the same function that Riemann does not integrate in the proper sense: even Monte Carlo, which does not look at the order of the points, feels the infinity.`,
      ];
    },
  },
  tryMc: {
    intro: [
      'Monte Carlo live: Play draws points from 10 up to 100,000, and the chart follows the estimate with its 95% band, against the exact value dashed. With bounded functions the band narrows as 1/√N and almost always contains the exact value; with 1/√x watch the jumps: a point very close to 0 moves the estimate at once. Another draw starts again with new points.',
    ],
    chooseLabel: 'Function',
    play: 'Play',
    pause: 'Pause',
    again: 'Another draw',
    chartTitle: (name) => `${name}: the estimate as the points grow (logarithmic scale), with its 95% band`,
    legend: ['estimate and 95% band', 'exact value'],
    status: (p, exact) => (p ? `${EN.int(p.k)} points: estimate ${EN.sig(p.estimate, 7)} ± ${EN.sig(1.96 * p.se, 3)}, exact value ${EN.sig(exact, 7)}.` : 'Press Play.'),
  },
  stats: {
    verdict: { reject: 'H₀ rejected', notReject: 'H₀ not rejected' },
    expected: { reject: 'expected: rejection', notReject: 'expected: no rejection', either: 'depends on the power of the test' },
    testLine: testLineEn,
    groups: { model: 'The normal model', coverage: 'Monte Carlo coverage', bias: 'Monte Carlo bias' },
    labels: {
      model: {
        ksNormal: 'The Box-Muller data follow the numerical Φ (Kolmogorov-Smirnov)',
        tailNormal: `In the Box-Muller data the share above ${ALARM_K} standard deviations is P(Z > ${ALARM_K}) (z)`,
        ksHeavy: 'The heavy-tailed data follow the same normal law (false on purpose)',
        tailHeavy: `In the heavy-tailed data the share above ${ALARM_K} standard deviations is P(Z > ${ALARM_K}) (false on purpose)`,
      },
      coverage: Object.fromEntries(Object.entries(functionNamesEn).map(([key, name]) => [key, `${name}: the ${EN.pct(CONFIDENCE, 0)} intervals contain the integral ${EN.pct(CONFIDENCE, 0)} of the times (z)`])),
      bias: Object.fromEntries(Object.entries(functionNamesEn).map(([key, name]) => [key, `${name}: the estimates have the exact integral as their mean (z)`])),
    },
  },
  tests: {
    intro: (s) => `The hypothesis tests of the page, at significance level α = ${EN.num(SIGNIFICANCE, 2)}. The normal model is checked on the ${EN.int(s.params.sample)} Box-Muller values and on as many heavy-tailed ones, with the Kolmogorov-Smirnov test and with the share beyond the three-sigma threshold; Monte Carlo with the coverage of the intervals and with the mean of the estimates, over ${EN.int(s.params.reps)} repetitions of ${EN.int(s.params.points)} points for every function. Two null hypotheses are false on purpose (the heavy-tailed data are not normal), and their rejection is expected.`,
    cols: { subject: 'Subject', hypothesis: 'Null hypothesis H₀', p: 'p-value', verdict: 'Outcome', expected: 'Reading' },
    after: (sum) => {
      const out = [`${sum.rejected} tests out of ${sum.count} reject the null hypothesis, ${sum.asExpected === sum.count ? 'all as expected' : `${sum.asExpected} out of ${sum.count} as expected`}.`];
      const expectedFalse = EN.num(sum.nulls * SIGNIFICANCE, 2);
      const which = sum.falseRejections.map((t) => EN.pval(t.result.pValue)).join(', ');
      out.push(
        `Among the ${sum.nulls} tests with a true null hypothesis, at level ${EN.num(SIGNIFICANCE, 2)} one expects on average ${expectedFalse} rejections by pure chance: ${sum.falseRejections.length === 0 ? 'here there are none' : `here there ${sum.falseRejections.length === 1 ? 'is one' : `are ${sum.falseRejections.length}`} (p = ${which})`}. Holm’s correction for multiple tests compares the smallest p-value with ${EN.num(SIGNIFICANCE, 2)}/${sum.nulls} = ${EN.num(sum.holmThreshold, 4)}, the next with ${EN.num(SIGNIFICANCE, 2)}/${sum.nulls - 1} and so on: ${sum.holm === 0 ? 'no rejection survives' : `${sum.holm === 1 ? 'one rejection survives' : `${sum.holm} rejections survive`}, to be looked at as a possible defect`}.`,
      );
      out.push('The Monte Carlo coverage of 1/√x is marked “depends on the power”: the theory says that without a finite variance the interval does not keep its 95% promise for a fixed N, and with enough repetitions the test notices it; with few repetitions it may not see it.');
      return out;
    },
  },
  history: {
    intro: 'From Kepler’s barrels to the generators of this page, the ideas used in the homework in chronological order.',
    legend: { task: 'used in this page', context: 'context' },
    events: [
      { year: '1615', task: true, title: 'Kepler', text: 'In the Nova stereometria doliorum vinariorum he computes the volume of wine barrels with a three-point rule: the ancestor of Simpson’s rule.' },
      { year: '1676-1722', task: true, title: 'Newton and Cotes', text: 'The formulas for integrating with equally spaced points that bear their names today: trapezoids and Simpson are their first two cases.' },
      { year: '1733', task: true, title: 'de Moivre', text: 'The normal curve appears as an approximation of the binomial: it is the density that Exercise 2 integrates.' },
      { year: '1743', task: true, title: 'Simpson', text: 'Thomas Simpson publishes the rule of parabolas that bears his name, already known to Cavalieri and James Gregory.' },
      { year: '1799', task: true, title: 'Kramp', text: 'Christian Kramp computes the first table of the integral of e^(-t²), for astronomical refraction: the first table of the normal law.' },
      { year: '1805', task: true, title: 'Laplace', text: 'In the fourth volume of the Traité de mécanique céleste, the continued fraction for the tail of the normal law: the second half of the method of section 2.9.' },
      { year: '1809', task: true, title: 'Gauss', text: 'In the Theoria motus the normal law becomes the law of observation errors.' },
      { year: '1814', task: true, title: 'Gauss', text: 'Methodus nova integralium valores per approximationem inveniendi: nodes and weights chosen to integrate exactly the polynomials of the highest possible degree, the Gauss rule of the page.' },
      { year: '1826', task: true, title: 'Jacobi', text: 'He links Gauss’s nodes to the roots of the Legendre polynomials, as gaussLegendre() computes them with Newton’s method.' },
      { year: '1829', task: true, title: 'Dirichlet', text: 'In the paper on the convergence of Fourier series he proposes a function that is one constant on the rationals and another on the irrationals, as an example of a function nobody knows how to integrate: the first pathological function of the assignment.' },
      { year: '1835', task: true, title: 'Liouville', text: 'He proves that some integrals, among them that of e^(-t²), cannot be written with a finite number of elementary functions: Φ has to be computed numerically (section 2.1).' },
      { year: '1854', task: true, title: 'Riemann', text: 'In his habilitation thesis on trigonometric series, published after his death, he defines the integral as the limit of the sums over strips.' },
      { year: '1871', task: true, title: 'Glaisher', text: 'He names the error function, erf, with which Φ(z) = (1 + erf(z/√2))/2 is written today (section 2.2).' },
      { year: '1875', task: true, title: 'Darboux', text: 'The lower and upper sums: a function is Riemann-integrable if and only if their difference goes to zero.' },
      { year: '1875', task: true, title: 'Thomae', text: 'In his book on definite integrals, the function that is 1/q at p/q: discontinuous at every rational, and yet Riemann-integrable. It is the second pathological function of the assignment.' },
      { year: '1898', task: false, title: 'Borel', text: 'He builds the measure of the sets of the line, additive over countable sequences: the ground Lebesgue will work on.' },
      { year: '1902', task: true, title: 'Lebesgue', text: 'The thesis Intégrale, longueur, aire, published in the Annali di Matematica Pura ed Applicata: the integral by levels and the measure of the level sets.' },
      { year: '1903', task: false, title: 'Sheppard', text: 'The tables of the normal law in Biometrika, the model of the tables every statistics book still prints.' },
      { year: '1905', task: false, title: 'Vitali', text: 'Giuseppe Vitali builds a non-measurable set: Lebesgue too has a limit, and a measure cannot be given to every subset of the line.' },
      { year: '1933', task: true, title: 'Kolmogorov', text: 'In the Grundbegriffe probability becomes a measure and the expected value a Lebesgue integral; the same year, in the Giornale dell’Istituto Italiano degli Attuari, the test on the largest gap between the empirical and the theoretical distribution function.' },
      { year: '1949', task: true, title: 'Metropolis and Ulam', text: 'The Monte Carlo Method: integrating and estimating probabilities by drawing random numbers.' },
      { year: '1955', task: true, title: 'Hastings', text: 'Approximations for Digital Computers: formulas with few coefficients for the first computers, among them the one for erf that Abramowitz and Stegun will print as 7.1.26.' },
      { year: '1958', task: true, title: 'Box and Muller', text: 'The transformation of two uniforms into two independent normals, used for the data of section 2.15.' },
      { year: '1964', task: true, title: 'Abramowitz and Stegun', text: 'The Handbook of Mathematical Functions of the National Bureau of Standards, with formulas 7.1.26 and 26.2.17 (Zelen and Severo) of section 2.8.' },
      { year: '1969', task: false, title: 'Cody', text: 'The rational approximations of erf that many numerical libraries still use: Φ is computed this way today, not with quadrature rules.' },
      { year: '1970', task: true, title: 'Stephens', text: 'The correction of the Kolmogorov-Smirnov test for finite samples, (√n + 0.12 + 0.11/√n) D, used in the page.' },
      { year: '1972', task: true, title: 'Rosenlicht', text: 'Integration in Finite Terms, in the American Mathematical Monthly: the form of Liouville’s theorem quoted by the notes of the course and used in section 2.1.' },
      { year: '1976', task: true, title: 'Lentz', text: 'A stable way of computing continued fractions from the top down, stopping when the result no longer changes: it is how the page computes Laplace’s.' },
      { year: '1985', task: true, title: 'IEEE 754', text: 'The standard of floating-point numbers: every double is a fraction m/2^k, which is why on a computer Dirichlet’s function is always 1 (section 1.8).' },
      { year: '2004', task: true, title: 'Marsaglia', text: 'Evaluating the Normal Distribution, in the Journal of Statistical Software: the positive series of section 2.7, a few lines of code for 15 digits.' },
      { year: '2014-2018', task: true, title: 'SplitMix and xoshiro', text: 'The random number generators of this page, as of Homeworks #3 and #4.' },
    ],
    after: 'The story runs on two tracks that this homework brings together. One is the definition of the integral, from Riemann to Lebesgue to Kolmogorov, which leads to modern probability and to Exercise 1; the other is the computation of the area under the bell, from Kepler’s barrels to Gauss, Laplace and the handbook formulas, which leads to Exercise 2.',
  },
  conclusion: (s, facts) => {
    const F = EN;
    const out = [
      'Exercise 1. Riemann and Lebesgue reach the same number on every Riemann-integrable function, but they get there in different ways. On smooth functions Riemann’s strips at their midpoints fall like 1/n², while Lebesgue slows down where the function is flat, because there the level set changes fast; Lebesgue is exact on |x - 0.5|, even on the step functions and faster where Riemann suffers, on 1/√x and on sin(1/x). As an algorithm, though, it costs more, because measuring the preimages still means cutting the domain. Its real advantage is another: it integrates functions that have no Riemann integral, such as Dirichlet’s, and it allows limits and integrals to be swapped, which probability is built on. On a computer Dirichlet’s and Thomae’s functions have to be computed with exact fractions, because every double is rational.',
      `Exercise 2. Φ has no elementary formula (Liouville), and erf writes it exactly without computing it. Of the three families of methods of the assignment, numerical integration converges with the orders of the theory (measured: ${F.num(facts.orders.left, 2)}, ${F.num(facts.orders.midpoint, 2)}, ${F.num(facts.orders.trapezoid, 2)} and ${F.num(facts.orders.simpson, 2)}, against 1, 2, 2 and 4), the series of the notes loses digits for large z, and the handbook formulas stop at 7 digits. The method of the page, the positive series near the centre and Laplace’s continued fraction in the tails, keeps about 15 digits everywhere with a single exponential, agrees with mpmath and with ${F.int(facts.nist.agree)} cells out of ${F.int(facts.nist.total)} of the NIST table, and the only cell that differs is an error of the table.`,
    ];
    if (s) {
      const u = s.mc.unbounded;
      out.push(`Monte Carlo, Lebesgue’s statistical cousin, keeps the 95% promise on the functions with finite variance; on 1/√x, which has infinite variance, the intervals contain the integral ${F.pct(u.coverage, 1)} of the times: it is the same function that Riemann does not integrate in the proper sense.`);
    }
    return out;
  },
  ruleNames: ruleNamesEn,
  tips: {
    piece: (p, i, sign) => {
      const F = EN;
      const what = { rect: 'rectangle', trap: 'trapezoid', parab: 'arc of parabola', node: 'Gauss node' }[p.kind];
      return `${what[0].toUpperCase()}${what.slice(1)} ${i + 1}: from ${F.num(p.x0, 3)} to ${F.num(p.x1, 3)}${p.kind === 'node' ? `, node at ${F.num(p.tag, 3)}, weight ${F.num(p.weight, 4)}` : ''}, area ${F.num(p.area, 6)}${sign < 0 ? ' (taken away from 1/2)' : ''}`;
    },
    convergence: (r) => `n = ${EN.int(r.n)}: ${Object.entries(r.errors).map(([rule, e]) => `${ruleNamesEn[rule]} ${e === null ? '-' : EN.err(e)}`).join(', ')}`,
    newton: (r) => `Step ${r.k}: z = ${EN.num(r.z, 12)}, error ${EN.err(r.error)}`,
    tail: (r) => `k = ${r.k}: P(Z > k) = ${EN.sci(r.reference, 3)}; 1 - Φ(k) is off by ${EN.err(r.subtractionError)}, the direct tail by ${EN.err(r.directError)}`,
    alarm: (k, events) => `k = ${EN.num(k, 1)}: normal data ${EN.sci(tailDirect(k))} (${EN.num(events * tailDirect(k), 1)} a day), heavy tails ${EN.sci(heavySf(k))} (${EN.num(events * heavySf(k), 1)} a day)`,
    ecdf: (x, F, P) => `x = ${EN.num(x, 3)}: empirical ${EN.num(F, 4)}, Φ ${EN.num(P, 4)}, gap ${EN.num(Math.abs(F - P), 4)}`,
    strip: (s, kind) => `From ${EN.sig(s.x0, 4)} to ${EN.sig(s.x1, 4)}: height ${EN.sig(s[kind], 5)}, minimum ${EN.sig(s.lower, 5)}, maximum ${EN.sig(s.upper, 5)}`,
    level: (y0, y1, measure, pieces) => `Band from ${EN.sig(y0, 4)} to ${EN.sig(y1, 4)}: f ≥ ${EN.sig(y1, 4)} over a length ${EN.sig(measure, 5)} (${pieces} ${pieces === 1 ? 'interval' : 'intervals'}), area ${EN.sig((y1 - y0) * measure, 5)}`,
    traffic: (y, set) => `Above ${EN.int(y)} Mb/s: ${EN.num(set.reduce((s, [a, b]) => s + b - a, 0) * 60, 1)} minutes${set.length ? `, ${set.map(([a, b]) => `${clock(a)}-${clock(b)}`).join(', ')}` : ''}`,
    distribution: (y, m) => `y = ${EN.sig(y, 4)}: f ≥ y over a length ${EN.sig(m, 5)}`,
    rearrangement: (s, sorted, original) => `s = ${EN.sig(s, 4)}: sorted ${EN.sig(sorted, 5)}, original ${EN.sig(original, 5)}`,
    duration: (h, v) => `${EN.num(h, 2)} hours a day above ${EN.int(v)} Mb/s`,
    compare: (r) => `n = K = ${EN.int(r.n)}: Riemann ${EN.err(r.errors.riemann)}, Lebesgue ${EN.err(r.errors.lebesgue)}`,
    estimates: (from, to, count, share) => `From ${EN.sig(from, 5)} to ${EN.sig(to, 5)}: ${EN.int(count)} estimates, ${EN.pct(share, 1)}`,
    mcPath: (p, exact) => `${EN.int(p.k)} points: estimate ${EN.sig(p.estimate, 6)} ± ${EN.sig(1.96 * p.se, 3)}, exact ${EN.sig(exact, 6)}`,
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: after extracting the archive it opens with a double click on index.html, even offline, with the same computations, charts and interactive examples. With node homework5.js it prints in the terminal the five rules, the table of the normal, the quantiles, the tails, the Riemann and Lebesgue sums of every function, Monte Carlo and the tests; --z, --mu, --sigma, --rule, --n, --function, --formula, --a, --b and --seed change the parameters.',
    contents: 'Contents: index.html, style.css, homework5.js (Riemann, Lebesgue, Dirichlet and Thomae with exact fractions, quadrature rules, series, continued fraction, the CDF, generators, statistics and charts), app.js (interface and texts), README.txt.',
    zip: 'Download homework5',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'The Riemann and Lebesgue integrals computed numerically, and the distribution function of the normal law.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
    noscript: 'This program needs JavaScript.',
  },
};

const HW5_TEXTS = { it, en };

return { NOTES_URL, originalAssignment, HW5_TEXTS };
})();

(function () {
'use strict';

// src/pages/statistics/hw5/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework5.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Da file:// i worker non partono: le simulazioni girano qui, a fette di
// pochi millisecondi, e la pagina resta reattiva mentre i numeri arrivano;
// intanto l'Esercizio 2 e gli esempi interattivi, che non ne hanno bisogno,
// funzionano gia'.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
const hw = Homework5;
const view = view$;
const { HW5_TEXTS, originalAssignment } = texts$;

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

const SLICES_MAX = 64;

const state = {
  lang: initialLanguage(),
  fields: { ...view.DEFAULT_INPUTS },
  // l'ultimo valore valido di ogni campo, e quelli dell'ultima simulazione partita
  params: { ...view.DEFAULT_PARAMS },
  target: { ...view.DEFAULT_PARAMS },
  // gli esempi e le scelte
  area: { ...view.AREA.defaults },
  infinityRule: 'gauss',
  alarm: { ...view.ALARM_DEFAULT },
  coins: 0,
  fnKey: 'square',
  custom: { ...view.DEFAULT_CUSTOM },
  validCustom: view.readCustom(view.DEFAULT_CUSTOM),
  riemannKind: 'midpoint',
  slices: { n: 4, K: 4, playing: false },
  histKey: 'unbounded',
  mc: { key: 'unbounded', draw: 0, shown: 0, playing: false },
};
let text = HW5_TEXTS[state.lang];
const regions = {};
const controls = { fields: {}, custom: {} };
const timers = { compute: null, slices: null, mc: null };

// I risultati gia' calcolati (gli ultimi), quelli mostrati e il calcolo in corso
const results = new Map();
const computation = { shown: null, error: null, running: null };

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
const charts = new Map(); // canvas -> { draw, data, width, detach, link }
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

function figure(caption, draw, data, { wide = false, tip = null, items = null, note = null, link = null } = {}) {
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': caption });
  const fig = h('figure', { class: wide ? 'figure wide' : 'figure' }, canvas, items && legend(items), note && h('p', { class: 'figure-note', text: note }), h('figcaption', { text: caption }));
  const detach = tip ? hw.attachChartTooltip(canvas, { draw, data, describe: tip, link }) : null;
  charts.set(canvas, { draw, data, width: -1, detach, link });
  resizer.observe(canvas);
  return fig;
}

/** Redraws a chart in place, with new data and labels, without replacing its canvas (no flicker while it plays or a slider moves). */
function refreshFigure(fig, caption, data, tip) {
  const canvas = fig.querySelector('canvas.chart');
  const chart = charts.get(canvas);
  if (!chart) return;
  if (chart.detach) chart.detach();
  chart.data = data;
  chart.detach = tip ? hw.attachChartTooltip(canvas, { draw: chart.draw, data, describe: tip, link: chart.link }) : null;
  canvas.setAttribute('aria-label', caption);
  fig.querySelector('figcaption').textContent = caption;
  if (chart.width > 0) {
    canvas.style.height = `${hw.chartHeight(chart.draw, data, chart.width)}px`;
    chart.draw(canvas, { ...data, width: chart.width }, palette());
  }
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

/** A table: column headers, then rows of cells, each { text | node, class?, head?, title? } (head: a row header, th); `id` for a table tied to a chart (view.LINKED_TABLES). */
function table(className, headers, rows, id = null) {
  return h(
    'table',
    { id, class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x) => h('th', { text: x })))),
    h(
      'tbody',
      null,
      rows.map((row) => h(
        'tr',
        { class: row.class || null },
        row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { 'data-label': cell.head ? null : headers[i], class: cell.class || null, title: cell.title || null }, cell.node || cell.text)),
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

/** A choice among a few values: the pressed button is the active one. */
function choices(label, options, value, onChange) {
  const buttons = options.map(([key, name]) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(key === value), text: name, onclick: () => select(key) }));
  function select(key) {
    options.forEach(([k], i) => buttons[i].setAttribute('aria-pressed', String(k === key)));
    onChange(key);
  }
  return h('div', { class: 'choices', role: 'group', 'aria-label': label }, h('span', { class: 'choices-label', text: label }), buttons);
}

/** A slider on indices; set() moves it when the state or the language change. */
function slider(id, onChange) {
  const label = h('label', { for: id });
  const input = h('input', { id, type: 'range', min: 0, max: 0, step: 1, value: 0, oninput: (e) => onChange(Number(e.target.value)) });
  return {
    el: h('div', { class: 'slider' }, label, input),
    set(max, value, labelText) {
      input.max = String(max);
      input.value = String(value);
      label.textContent = labelText;
      input.setAttribute('aria-valuetext', labelText);
    },
  };
}

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw5-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      h('p', { class: 'note', text: text.assignment.originalNote }),
      h(
        'blockquote',
        { lang: 'en' },
        originalAssignment().map((block) => {
          if (block.type === 'title') return h('p', null, h('strong', { text: block.text }));
          if (block.type === 'list') return h('ul', null, block.items.map((item) => h('li', { text: item })));
          if (block.type === 'link') return h('p', null, h('a', { href: block.href, target: '_blank', rel: 'noopener noreferrer', text: block.text }));
          return h('p', { text: block.text });
        }),
      ),
    ),
  );
}

// --- Prova: l'area sotto la campana -------------------------------------------------------

const tryArea = { fig: null, line: null, z: null, n: null };

function tryAreaBlock() {
  const T = text.tryArea;
  const F = text.fmt;
  const a = state.area;
  tryArea.z = slider('hw5-area-z', (i) => {
    a.z = view.zOfIndex(i);
    updateArea();
  });
  tryArea.n = slider('hw5-area-n', (i) => {
    a.n = i + 1;
    updateArea();
  });
  const st = view.areaState(a, F.decimal);
  tryArea.fig = figure(T.chartTitle(st, a.rule), hw.drawQuadrature, st.chart, { wide: true, tip: view.tips.area(st, text.tips) });
  tryArea.line = h('p', { class: 'caption line', 'aria-live': 'polite' });
  return h(
    'div',
    { class: 'try' },
    title('hw5-try-area', 2, text.sections.tryArea),
    paras(T.intro),
    choices(T.muLabel, view.AREA.mus.map((m) => [m, F.plain(m)]), a.mu, (v) => {
      a.mu = v;
      updateArea();
    }),
    choices(T.sigmaLabel, view.AREA.sigmas.map((v) => [v, F.plain(v)]), a.sigma, (v) => {
      a.sigma = v;
      updateArea();
    }),
    choices(T.ruleLabel, hw.RULES.map((r) => [r, text.ruleNames[r]]), a.rule, (v) => {
      a.rule = v;
      updateArea();
    }),
    choices(T.strategyLabel, view.AREA.strategies.map((s) => [s, T.strategies[s]]), a.strategy, (v) => {
      a.strategy = v;
      updateArea();
    }),
    h('div', { class: 'slider-row' }, tryArea.z.el, tryArea.n.el),
    h('div', { class: 'charts' }, tryArea.fig),
    tryArea.line,
  );
}

function updateArea() {
  const T = text.tryArea;
  const a = state.area;
  const st = view.areaState(a, text.fmt.decimal);
  tryArea.z.set(view.Z_STEPS, view.indexOfZ(a.z), T.zLabel(st.x, a.z));
  tryArea.n.set(view.AREA.nMax - 1, a.n - 1, T.nLabel(st.n, a.rule));
  refreshFigure(tryArea.fig, T.chartTitle(st, a.rule), st.chart, view.tips.area(st, text.tips));
  tryArea.line.textContent = T.result(st, a.rule);
}

// --- 1.2 Le regole ---------------------------------------------------------------------------------

function rulesBlock() {
  const R = text.rules;
  const F = text.fmt;
  const rows = view.ruleRows();
  return [
    paras(R.intro),
    formulas(text.formulas.rules, R.formulasTitle),
    subtitle(R.codeTitle),
    h('pre', { class: 'code', text: view.RULE_CODE }),
    subtitle(R.tableTitle(view.RULES_N)),
    table(
      'discussion rules',
      [R.cols.rule, R.cols.n, R.cols.evaluations, R.cols.value, R.cols.error],
      rows.map((r) => ({ cells: [{ text: text.ruleNames[r.rule], head: true }, { text: String(r.n) }, { text: String(r.evaluations) }, { text: F.num(r.value, 15) }, { text: F.err(r.error) }] })),
    ),
    subtitle(R.gaussTitle),
    table(
      'compact gauss',
      [R.gaussCols.i, R.gaussCols.node, R.gaussCols.weight],
      view.gaussRows(5).map((r) => ({ cells: [{ text: String(r.i), head: true }, { text: F.num(r.node, 15) }, { text: F.num(r.weight, 15) }] })),
    ),
    paras(R.after(rows)),
  ];
}

// --- 1.3 Il -infinito ------------------------------------------------------------------------------

function updateInfinity() {
  const I = text.infinity;
  const F = text.fmt;
  const rule = state.infinityRule;
  const n = hw.STRATEGY_RULES.find((r) => r.rule === rule).n;
  const keys = ['symmetry', 'trunc4', 'trunc8', 'substitution'];
  fill(
    regions.infinity,
    subtitle(I.tableTitle(rule, n)),
    table(
      'discussion strategies',
      [I.cols.z, I.cols.reference, ...keys.map((k) => I.cols[k])],
      view.strategyTable(rule).map((r) => ({ cells: [{ text: F.plain(r.z), head: true }, { text: F.num(r.reference, 8) }, ...r.errors.map((e) => ({ text: F.err(e) }))] })),
    ),
    paras(I.after(view.strategyFacts())),
  );
}

// --- 1.4 La convergenza, 1.5 la tavola, 1.6 i quantili ---------------------------------------------------------

function convergenceBlock() {
  const C = text.convergence;
  const F = text.fmt;
  const study = hw.convergenceStudy();
  return [
    paras(C.intro),
    h(
      'div',
      { class: 'charts' },
      figure(C.chartTitle(study.z), hw.drawLineChart, view.convergenceChart(study, F.decimal), { wide: true, tip: view.tips.convergence(study, text.tips), link: view.links.convergence, items: hw.RULES.map((r, i) => ({ label: text.ruleNames[r], color: i })) }),
    ),
    subtitle(C.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact convergence',
        [C.cols.n, ...hw.RULES.map((r) => text.ruleNames[r])],
        study.rows.map((r) => ({ cells: [{ text: F.int(r.n), head: true }, ...hw.RULES.map((rule) => ({ text: r.errors[rule] === null ? '-' : F.err(r.errors[rule]) }))] })),
        view.LINKED_TABLES.convergence,
      ),
    ),
    paras(C.after(view.convergenceFacts(study))),
  ];
}

function zTableBlock() {
  const Z = text.table;
  const F = text.fmt;
  const zt = hw.zTable();
  return [
    paras(Z.intro),
    subtitle(Z.title(zt)),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact ztable',
        ['z', ...Array.from({ length: hw.ZTABLE.cols }, (_, c) => `${F.decimal}0${c}`)],
        zt.table.map((row) => ({
          cells: [{ text: F.num(row.row, 1), head: true }, ...row.cells.map((c) => (view.isMarkedZ(c.z) ? { text: F.num(c.value, 4), class: 'is-mark', title: `Φ(${F.num(c.z, 2)}) = ${F.num(c.value, 8)}` } : { text: F.num(c.value, 4) }))],
        })),
      ),
    ),
    paras(Z.after(zt)),
  ];
}

function quantilesBlock() {
  const Q = text.quantiles;
  const F = text.fmt;
  const rows = view.quantileRows();
  const steps = view.newtonRows();
  return [
    paras(Q.intro),
    formulas(text.formulas.newton, Q.formulasTitle),
    subtitle(Q.tableTitle),
    table(
      'discussion quantiles',
      [Q.cols.p, Q.cols.z, Q.cols.steps, Q.cols.reference, Q.cols.difference],
      rows.map((r) => ({ cells: [{ text: F.plain(r.p), head: true }, { text: F.num(r.z, 12) }, { text: String(r.steps) }, { text: F.num(r.reference, 12) }, { text: F.err(r.difference) }] })),
    ),
    subtitle(Q.newtonTitle(view.NEWTON_P)),
    table(
      'compact newton',
      [Q.newtonCols.k, Q.newtonCols.z, Q.newtonCols.F, Q.newtonCols.dz, Q.newtonCols.error],
      steps.map((r) => ({ cells: [{ text: String(r.k), head: true }, { text: F.num(r.z, 15) }, { text: F.num(r.F, 15) }, { text: F.sig(r.dz, 4) }, { text: F.err(r.error) }] })),
      view.LINKED_TABLES.newton,
    ),
    h('div', { class: 'charts' }, figure(Q.chartTitle, hw.drawLineChart, view.newtonChart(steps, F.decimal), { wide: true, tip: view.tips.newton(steps, text.tips), link: view.links.newton })),
    paras(Q.after(rows)),
  ];
}

// --- 1.7 Le code e la prova delle soglie ------------------------------------------------------------------------

function tailsBlock() {
  const T = text.tails;
  const F = text.fmt;
  const rows = hw.tailRows();
  const alarms = view.alarmRows();
  return [
    paras(T.intro),
    subtitle(T.tableTitle),
    table(
      'compact tails',
      [T.cols.k, T.cols.reference, T.cols.subtraction, T.cols.subtractionError, T.cols.direct, T.cols.directError],
      rows.map((r) => ({ cells: [{ text: String(r.k), head: true }, { text: F.sci(r.reference, 2) }, { text: F.sci(r.subtraction, 2) }, { text: F.err(r.subtractionError), class: r.subtractionError > 1e-6 ? 'over' : null }, { text: F.sci(r.direct, 2) }, { text: F.err(r.directError) }] })),
      view.LINKED_TABLES.tails,
    ),
    h('div', { class: 'charts' }, figure(T.chartTitle, hw.drawLineChart, view.tailChart(rows, F.decimal), { wide: true, tip: view.tips.tails(rows, text.tips), link: view.links.tails, items: [{ label: T.legend[0], color: 1 }, { label: T.legend[1], color: 2 }] })),
    paras(T.after(view.tailFacts(rows))),
    paras(T.alarmIntro),
    subtitle(T.alarmTitle),
    table(
      'discussion alarms',
      [T.alarmCols.k, T.alarmCols.normal, T.alarmCols.normalPerDay, T.alarmCols.heavy, T.alarmCols.heavyPerDay, T.alarmCols.ratio],
      alarms.map((r) => ({ cells: [{ text: String(r.k), head: true }, { text: F.sci(r.normal, 2) }, { text: F.sig(r.normalPerDay, 4) }, { text: F.sci(r.heavy, 2) }, { text: F.sig(r.heavyPerDay, 4) }, { text: F.num(r.ratio, 1) }] })),
    ),
    paras(T.alarmAfter(alarms)),
  ];
}

const tryAlarm = { fig: null, line: null };

function tryAlarmBlock() {
  const T = text.tryAlarm;
  const F = text.fmt;
  const st = view.alarmState(state.alarm.events, state.alarm.rate);
  const data = view.alarmChart(st, F.decimal);
  tryAlarm.fig = figure(T.chartTitle, hw.drawLineChart, data, { wide: true, tip: view.tips.alarm(st, data, text.tips), items: [{ label: T.legend[0], color: 0 }, { label: T.legend[1], color: 1 }, { label: T.legend[2], color: 6, dashed: true }] });
  tryAlarm.line = h('p', { class: 'caption line', 'aria-live': 'polite', text: T.result(st) });
  return h(
    'div',
    { class: 'try' },
    title('hw5-try-alarm', 2, text.sections.tryAlarm),
    paras(T.intro),
    choices(T.eventsLabel, view.ALARM_EVENTS.map((e) => [e, F.events(e)]), state.alarm.events, (v) => {
      state.alarm.events = v;
      updateAlarm();
    }),
    choices(T.rateLabel, Object.keys(view.ALARM_RATES).map((r) => [r, T.rates[r]]), state.alarm.rate, (v) => {
      state.alarm.rate = v;
      updateAlarm();
    }),
    h('div', { class: 'charts' }, tryAlarm.fig),
    tryAlarm.line,
  );
}

function updateAlarm() {
  const T = text.tryAlarm;
  const st = view.alarmState(state.alarm.events, state.alarm.rate);
  const data = view.alarmChart(st, text.fmt.decimal);
  refreshFigure(tryAlarm.fig, T.chartTitle, data, view.tips.alarm(st, data, text.tips));
  tryAlarm.line.textContent = T.result(st);
}

// --- 1.8 I dati, con i campi ---------------------------------------------------------------------------------

// i campi: chiave, nome nello stato, id, tastiera, sezione
const FIELDS = [
  ['seed', 'seedText', 'hw5-seed', 'numeric'],
  ['sample', 'sampleText', 'hw5-sample', 'numeric'],
  ['points', 'pointsText', 'hw5-points', 'numeric'],
  ['reps', 'repsText', 'hw5-reps', 'numeric'],
];

function fieldBlock(keys) {
  const D = text.data;
  const M = text.montecarlo;
  const labels = { seed: [D.seedLabel, D.seedHint], sample: [D.sampleLabel, D.sampleHint], points: [M.pointsLabel, M.pointsHint], reps: [M.repsLabel, M.repsHint] };
  return h(
    'div',
    { class: 'params' },
    FIELDS.filter(([key]) => keys.includes(key)).map(([key, name, id, mode]) => {
      const input = h('input', { id, type: 'text', inputmode: mode, ...PRIVATE_FIELD, maxlength: view.FIELD_LENGTH[key], 'aria-describedby': `${id}-help`, oninput: (e) => changeFields({ [name]: e.target.value.slice(0, view.FIELD_LENGTH[key]) }) });
      input.value = state.fields[name];
      const help = h('p', { id: `${id}-help`, class: 'note', text: labels[key][1] });
      controls.fields[key] = { input, help, hint: labels[key][1] };
      const extra = key === 'seed' ? h('button', { type: 'button', class: 'btn alt', text: D.randomSeed, onclick: () => changeFields({ seedText: String(hw.randomSeed()) }, true) }) : null;
      return h('div', { class: 'param' }, h('label', { for: id, text: labels[key][0] }), h('span', { class: 'param-row' }, input, extra), help);
    }),
  );
}

function dataBlock() {
  const D = text.data;
  regions.status = h('div');
  regions.data = h('div');
  return [paras(D.intro), h('p', { text: D.fieldsIntro }), fieldBlock(['seed', 'sample']), regions.status, regions.data];
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
  if (r.ok) return null;
  if (r.error === 'range') return text.data.errors.range(...hw.LIMITS[key]);
  const m = text.data.errors[r.error];
  return typeof m === 'function' ? m(r.text) : m;
}

/** A new simulation when the parameters settle. */
function scheduleComputation() {
  clearTimeout(timers.compute);
  timers.compute = setTimeout(() => {
    state.target = { ...state.params };
    startComputation();
    updateCoins();
    resetMc();
  }, 400);
}

/** The fields read again: errors, the last valid value of each, and a new simulation when they settle. */
function updateInputs() {
  const read = view.readInputs(state.fields);
  for (const [key] of FIELDS) {
    const field = controls.fields[key];
    if (!field) continue;
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
    scheduleComputation();
  }
  updateStatus();
}

/** Under the fields: the errors, the values in use, the simulation running or the time it took. */
function updateStatus() {
  const D = text.data;
  const read = view.readInputs(state.fields);
  const badge = view.inputBadge(state.params, D);
  const waiting = Boolean(computation.running) || view.paramsKey(state.params) !== view.paramsKey(state.target);
  const s = computation.shown;
  const stale = !view.allValid(read) && h('p', { class: 'stale', role: 'status', text: D.stale });
  const running = waiting && s && h('p', { class: 'stale', role: 'status', text: D.pending });
  const error = computation.error && h('p', { class: 'note', text: text.ui.error(computation.error) });
  fill(
    regions.status,
    stale,
    h('p', { class: badge.known ? 'badge-line is-task' : 'badge-line is-custom' }, h('span', { text: badge.text }), badge.restore && h('button', { type: 'button', class: 'btn alt', text: D.restore, onclick: restore })),
    running,
    error,
    s && !waiting && h('p', { class: 'note', role: 'status', text: D.run(s) }),
  );
  if (regions.mcStatus) fill(regions.mcStatus, !view.allValid(read) && h('p', { class: 'stale', role: 'status', text: D.stale }), waiting && s && h('p', { class: 'stale', role: 'status', text: D.pending }), computation.error && h('p', { class: 'note', text: text.ui.error(computation.error) }));
}

function updateData() {
  const D = text.data;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.data, pending());
    return;
  }
  const items = [{ label: D.legend[0], color: 0 }, { label: D.legend[1], color: 2, dashed: true }];
  const normal = view.ecdfChart(s.normal, F.decimal);
  const heavy = view.ecdfChart(s.heavy, F.decimal);
  fill(
    regions.data,
    h(
      'div',
      { class: 'charts' },
      figure(D.normalTitle(s.normal.n), hw.drawLineChart, normal, { tip: view.tips.ecdf(normal, text.tips), items }),
      figure(D.heavyTitle(s.heavy.n), hw.drawLineChart, heavy, { tip: view.tips.ecdf(heavy, text.tips), items }),
    ),
    tests('model', s),
    paras(D.after(s)),
  );
}

// --- 1.9 Le verifiche -------------------------------------------------------------------------------------

let checkRows = null;

function updateVerify() {
  const V = text.checks;
  if (!checkRows) {
    fill(regions.verify, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const ok = checkRows.filter((r) => r.ok).length;
  fill(
    regions.verify,
    h('p', { text: V.intro }),
    check(ok === checkRows.length, V.summary(ok, checkRows.length)),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: V.details(checkRows.length) }),
      ['quadrature', 'normal', 'cdf', 'integrals', 'generator'].map((group) => [
        subtitle(V.groups[group]),
        table(
          'discussion checks',
          [V.cols.check, V.cols.expected, V.cols.result],
          checkRows.filter((r) => r.group === group).map((r) => ({ cells: [{ text: r.name, head: true }, { node: h('code', { text: r.expected }) }, { node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }), class: r.ok ? 'is-ok' : 'is-bad' }] })),
        ),
      ]),
    ),
  );
}

// ---------------------------------------------------------------------------
// Esercizio 1: le monete, le funzioni, Riemann, Lebesgue, i risultati, il
// confronto, i costi, Dirichlet e Thomae, il traffico, Monte Carlo
// ---------------------------------------------------------------------------

function exercise1Section() {
  const S = text.sections;
  regions.coins = h('div');
  regions.custom = h('div');
  regions.riemann = h('div');
  regions.lebesgue = h('div');
  regions.results = h('div');
  regions.compare = h('div');
  regions.efficiency = h('div');
  regions.mc = h('div');
  regions.mcStatus = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw5-exercise1', 0, S.exercise1),
    paras(text.exercise1.intro),
    title('hw5-idea', 1, S.idea),
    paras(text.idea.intro),
    h('div', { class: 'try' }, title('hw5-try-coins', 2, S.tryCoins), paras(text.tryCoins.intro), regions.coins),
    title('hw5-functions', 1, S.functions),
    functionsBlock(),
    title('hw5-riemann', 1, S.riemann),
    paras(text.riemann.intro),
    formulas(text.formulas.riemann, text.riemann.formulasTitle),
    choices(text.riemann.kindLabel, hw.RIEMANN_KINDS.map((k) => [k, text.riemann.kinds[k]]), state.riemannKind, (k) => {
      state.riemannKind = k;
      updateRiemann();
    }),
    regions.riemann,
    title('hw5-lebesgue', 1, S.lebesgue),
    paras(text.lebesgue.intro),
    formulas(text.formulas.lebesgue, text.lebesgue.formulasTitle),
    regions.lebesgue,
    trySlicesBlock(),
    title('hw5-results', 1, S.results),
    paras(text.results.intro),
    regions.results,
    title('hw5-compare', 1, S.compare),
    paras(text.compare.intro),
    regions.compare,
    title('hw5-efficiency', 1, S.efficiency),
    paras(text.efficiency.intro),
    regions.efficiency,
    title('hw5-pathological', 1, S.pathological),
    pathologicalBlock(),
    title('hw5-traffic', 1, S.traffic),
    trafficBlock(),
    title('hw5-montecarlo', 1, S.montecarlo),
    paras(text.montecarlo.intro),
    formulas(text.formulas.montecarlo, text.montecarlo.formulasTitle),
    h('p', { text: text.montecarlo.fieldsIntro }),
    fieldBlock(['points', 'reps']),
    regions.mcStatus,
    regions.mc,
    tryMcBlock(),
  );
}

// The comparison of the reader's function, computed once for sections 1.5 - 1.7.
let customStudyCache = { spec: null, study: null };

function customStudy() {
  if (state.fnKey !== hw.CUSTOM) return null;
  const { spec } = current();
  if (customStudyCache.spec !== spec) customStudyCache = { spec, study: hw.comparisonStudy(spec) };
  return customStudyCache.study;
}

// --- 1.5 I risultati -----------------------------------------------------------------------------------------

function updateResultsTable() {
  const R = text.results;
  const s = computation.shown;
  const rows = view.resultsRows(s, customStudy(), view.pathological());
  fill(
    regions.results,
    !s && pending(),
    subtitle(R.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact results',
        [R.cols.name, R.cols.integral, R.cols.riemann, R.cols.lebesgue, R.cols.riemannError, R.cols.lebesgueError, R.cols.verdict],
        rows.map((r) => ({ cells: [{ text: text.functionNames[r.key], head: true }, { text: R.integralCell(r) }, { text: R.riemannCell(r) }, { text: R.lebesgueCell(r) }, { text: R.errorCell(r.errors.riemann) }, { text: R.errorCell(r.errors.lebesgue) }, { text: R.verdicts[r.verdict] }] })),
      ),
    ),
    s && paras(R.after(rows)),
  );
}

// --- 1.7 Quanto costano -----------------------------------------------------------------------------------

let efficiencyCache = { study: null, result: null };

function updateEfficiency() {
  const E = text.efficiency;
  const F = text.fmt;
  const s = computation.shown;
  let study = null;
  if (state.fnKey === hw.CUSTOM) {
    const cs = customStudy();
    if (efficiencyCache.study !== cs) efficiencyCache = { study: cs, result: hw.efficiencyStudy(current().spec, cs.reference) };
    study = efficiencyCache.result;
  } else if (s) {
    study = s.efficiency[state.fnKey];
  }
  const rows = s ? view.efficiencyRows(s) : null;
  fill(
    regions.efficiency,
    !study
      ? pending()
      : h('div', { class: 'charts' }, figure(E.chartTitle(text.functionNames[state.fnKey]), hw.drawLineChart, view.efficiencyChart(study, F.decimal), { wide: true, items: [{ label: E.legend[0], color: 1 }, { label: E.legend[1], color: 0 }] })),
    rows && [
      subtitle(E.tableTitle),
      h(
        'div',
        { class: 'scroll' },
        table(
          'compact efficiency',
          [E.cols.name, E.cols.target, E.cols.riemann, E.cols.lebesgue],
          rows.flatMap((r) => r.targets.map((t) => ({ cells: [{ text: text.functionNames[r.key], head: true }, { text: F.pow(Math.round(Math.log10(t.target))) }, { text: E.cell(t.riemann, 'riemann') }, { text: E.cell(t.lebesgue, 'lebesgue') }] }))),
        ),
      ),
      paras(E.after(view.efficiencyFacts(s))),
    ],
  );
}

// --- 1.8 Dirichlet e Thomae --------------------------------------------------------------------------------

function pathologicalBlock() {
  const P = text.pathological;
  const F = text.fmt;
  const study = view.pathological();
  return [
    paras(P.intro),
    table(
      'discussion dirichlet',
      [P.cols.number, P.cols.fraction, P.cols.value],
      view.DIRICHLET_NUMBERS.map((d) => {
        const f = hw.exactFraction(d.value);
        return { cells: [{ text: P.numbers[d.key], head: true }, { node: h('code', { text: `${f.numerator}/2^${f.power}` }) }, { text: '1' }] };
      }),
    ),
    h('p', { text: P.thomaeIntro }),
    h('div', { class: 'charts' }, figure(P.chartTitle(view.thomaeUpper()), hw.drawHistogram, view.thomaeChart(F.decimal), { wide: true })),
    subtitle(P.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact thomae',
        [P.thomaeCols.n, P.thomaeCols.rational, P.thomaeCols.irrational, P.thomaeCols.lower, P.thomaeCols.upper, P.thomaeCols.doubles],
        study.thomae.map((r) => ({ cells: [{ text: F.int(r.n), head: true }, { text: F.sig(r.rational, 4) }, { text: F.int(r.irrational) }, { text: F.int(r.lower) }, { text: F.sig(r.upper, 4) }, { text: F.sig(r.doubles, 4) }] })),
      ),
    ),
    paras(P.after(study)),
  ];
}

// ---------------------------------------------------------------------------
// Esercizio 2: Liouville, erf, l'area, le regole, il -infinito, la
// convergenza, le serie, le approssimazioni, il metodo, il riferimento, il
// confronto, la tavola, i quantili, le code e i dati
// ---------------------------------------------------------------------------

function exercise2Section() {
  const S = text.sections;
  const F = text.fmt;
  regions.infinity = h('div');
  regions.ours = h('div');
  regions.methods = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw5-exercise2', 0, S.exercise2),
    paras(text.exercise2.intro),
    title('hw5-liouville', 1, S.liouville),
    liouvilleBlock(),
    title('hw5-erf', 1, S.erf),
    erfBlock(),
    title('hw5-area', 1, S.area),
    paras(text.area.intro),
    formulas(text.formulas.cdf),
    h('div', { class: 'charts' }, figure(text.area.chartTitle, hw.drawQuadrature, view.bellChart(F.decimal), { wide: true })),
    tryAreaBlock(),
    title('hw5-rules', 1, S.rules),
    rulesBlock(),
    title('hw5-infinity', 1, S.infinity),
    paras(text.infinity.intro),
    formulas(text.formulas.strategies, text.infinity.formulasTitle),
    choices(text.infinity.chooseLabel, hw.STRATEGY_RULES.map((r) => [r.rule, text.ruleNames[r.rule]]), state.infinityRule, (rule) => {
      state.infinityRule = rule;
      updateInfinity();
    }),
    regions.infinity,
    title('hw5-convergence', 1, S.convergence),
    convergenceBlock(),
    title('hw5-series', 1, S.series),
    seriesBlock(),
    title('hw5-approximations', 1, S.approximations),
    approximationsBlock(),
    title('hw5-ours', 1, S.ours),
    regions.ours,
    title('hw5-reference', 1, S.reference),
    referenceBlock(),
    title('hw5-methods', 1, S.methods),
    paras(text.methods.intro),
    regions.methods,
    title('hw5-table', 1, S.table),
    zTableBlock(),
    title('hw5-quantiles', 1, S.quantiles),
    quantilesBlock(),
    title('hw5-tails', 1, S.tails),
    tailsBlock(),
    tryAlarmBlock(),
    title('hw5-data', 1, S.data),
    dataBlock(),
  );
}

function checksSection() {
  regions.verify = h('div');
  return h('section', { class: 'section' }, title('hw5-checks', 0, text.sections.checks), regions.verify);
}

// --- 2.1 Liouville e 2.2 erf ---------------------------------------------------------------------------------

function liouvilleBlock() {
  const L = text.liouville;
  const F = text.fmt;
  const rows = hw.liouvilleRows();
  return [
    paras(L.intro),
    formulas(L.formulas),
    subtitle(L.tableTitle),
    h('div', { class: 'scroll' }, table('compact liouville', [L.cols.x, L.cols.S, L.cols.ratio, L.cols.degree], rows.map((r) => ({ cells: [{ text: F.int(r.x), head: true }, { text: r.S >= 1e5 ? F.sci(r.S, 6) : F.sig(r.S, 7) }, { text: F.num(r.ratio, 6) }, { text: F.num(r.degree, 2) }] })))),
    paras(L.after(rows)),
  ];
}

function erfBlock() {
  const E = text.erf;
  const F = text.fmt;
  const rows = hw.empiricalRuleRows();
  return [
    paras(E.intro),
    formulas(E.formulas),
    subtitle(E.tableTitle),
    h('div', { class: 'scroll' }, table('compact erf', [E.cols.k, E.cols.value, E.cols.reference, E.cols.rounded], rows.map((r) => ({ cells: [{ text: String(r.k), head: true }, { text: F.num(r.value, 16) }, { text: F.num(r.reference, 16) }, { text: F.num(r.rounded, 4) }] })))),
    paras(E.after(rows)),
  ];
}

// --- 2.7 - 2.11 --------------------------------------------------------------------------------------------

const series = { fig: null, z: view.SERIES_CHOICES[2] };

function seriesBlock() {
  const S = text.series;
  const F = text.fmt;
  const rows = hw.seriesRows();
  series.fig = figure(S.chartTitle(series.z), hw.drawLineChart, view.seriesChart(series.z, F.decimal), { wide: true, items: [{ label: S.legend[0], color: 1 }, { label: S.legend[1], color: 1, dashed: true }, { label: S.legend[2], color: 0 }] });
  return [
    paras(S.intro),
    formulas(S.formulas),
    subtitle(S.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact series',
        [S.cols.z, S.cols.altTerms, S.cols.largest, S.cols.lost, S.cols.altError, S.cols.posTerms, S.cols.posError],
        rows.map((r) => ({ cells: [{ text: String(r.z), head: true }, { text: String(r.alternating.terms) }, { text: F.sci(r.alternating.largest) }, { text: F.num(r.alternating.lost, 1) }, { text: F.err(r.alternating.error) }, { text: String(r.positive.terms) }, { text: F.err(r.positive.error) }] })),
      ),
    ),
    choices(S.chooseLabel, view.SERIES_CHOICES.map((v) => [v, F.plain(v)]), series.z, (z) => {
      series.z = z;
      refreshFigure(series.fig, S.chartTitle(z), view.seriesChart(z, F.decimal), null);
    }),
    h('div', { class: 'charts' }, series.fig),
    paras(S.after(rows)),
  ];
}

function approximationsBlock() {
  const A = text.approximations;
  const F = text.fmt;
  return [
    paras(A.intro),
    h('div', { class: 'charts' }, figure(A.chartTitle, hw.drawLineChart, view.approximationChart(F.decimal), { wide: true, items: [{ label: A.legend[0], color: 0 }, { label: A.legend[1], color: 1 }, { label: A.legend[2], color: 6, dashed: true }] })),
    paras(A.after(view.approximationFacts())),
  ];
}

function updateOurs() {
  const O = text.ours;
  const facts = view.methodsFacts(computation.shown);
  fill(regions.ours, paras(O.intro(facts)), formulas(O.formulas), paras(O.after(facts)));
}

function referenceBlock() {
  const R = text.reference;
  const F = text.fmt;
  const { rows, nist } = view.referenceFacts();
  return [
    paras(R.intro),
    h('p', null, h('a', { href: hw.NIST_URL, target: '_blank', rel: 'noopener noreferrer', text: R.link })),
    subtitle(R.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact reference',
        [R.cols.z, R.cols.nist, R.cols.mpmath, R.cols.ours, R.cols.error, R.cols.nistError],
        rows.map((r) => ({
          class: nist.mismatches.some((m) => m.z === r.z) ? 'misprint' : null,
          cells: [{ text: F.plain(r.z), head: true }, { text: r.nist === null ? '-' : F.num(r.nist, 5) }, { text: F.sig(r.mpmath, 16) }, { text: F.sig(r.value, 16) }, { text: F.err(r.error) }, { text: r.nistError === null ? '-' : F.err(r.nistError) }],
        })),
      ),
    ),
    h('p', { text: R.nist(nist) }),
    nist.mismatches.map((m) => h('p', { text: R.mismatch(m) })),
    paras(R.after(rows)),
  ];
}

function updateMethods() {
  const M = text.methods;
  const F = text.fmt;
  const s = computation.shown;
  const rows = view.methodsRows(s);
  fill(
    regions.methods,
    subtitle(M.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact methods',
        [M.cols.method, M.cols.absolute, M.cols.relative, M.cols.exp, M.cols.terms, M.cols.time],
        rows.map((r) => ({ class: r.key === 'ours' ? 'ours' : null, cells: [{ text: text.methodNames[r.key], head: true }, { text: F.err(r.absolute) }, { text: M.relativeCell(r.relative) }, { text: F.int(r.exp) }, { text: r.terms ? F.int(r.terms) : '-' }, { text: M.timeCell(r.time) }] })),
      ),
    ),
    !s && pending(),
    h('div', { class: 'charts' }, figure(M.chartTitle, hw.drawLineChart, view.methodsChart(F.decimal), { wide: true, items: hw.CDF_METHODS.map((key) => ({ label: text.methodNames[key], color: view.METHOD_STYLE[key].colorIndex, dashed: !!view.METHOD_STYLE[key].dashed })) })),
    paras(M.after(view.methodsFacts(s))),
  );
}

// --- Prova: le monete ------------------------------------------------------------------------------------

const coinClass = (cents) => (cents < 10 ? 'is-copper' : cents < 100 ? 'is-gold' : 'is-bimetal');

function updateCoins() {
  const T = text.tryCoins;
  const F = text.fmt;
  const hand = hw.handful(state.target.seed, state.coins);
  fill(
    regions.coins,
    subtitle(T.orderTitle),
    h('ol', { class: 'coins' }, hand.coins.map((c, i) => h('li', null, h('span', { class: `coin ${coinClass(c)}`, text: T.coinLabel(c) }), h('small', { text: F.euro(hand.running[i]) })))),
    h('p', { class: 'note', text: T.running(hand.total) }),
    subtitle(T.groupTitle),
    h('ul', { class: 'coin-groups' }, hand.groups.map((g) => h('li', null, h('span', { class: `coin ${coinClass(g.value)}`, text: T.coinLabel(g.value) }), h('span', { text: T.groupLine(g) })))),
    h('p', { class: 'caption line', 'aria-live': 'polite', text: T.total(hand) }),
    h('button', { type: 'button', class: 'btn', text: T.another, onclick: () => {
      state.coins += 1;
      updateCoins();
    } }),
  );
}

// --- 2.2 Le funzioni, e quella scritta da chi legge ------------------------------------------------------------------

function functionsBlock() {
  const Fn = text.functions;
  const F = text.fmt;
  return [
    paras(Fn.intro),
    subtitle(Fn.tableTitle),
    table(
      'discussion functions',
      [Fn.cols.name, Fn.cols.interval, Fn.cols.formula, Fn.cols.integral, Fn.cols.feature],
      hw.FUNCTIONS.map((key) => {
        const d = hw.FUNCTION_DEFS[key];
        return { cells: [{ text: text.functionNames[key], head: true }, { text: `[${F.plain(d.a)}, ${F.plain(d.b)}]` }, { node: h('code', { text: d.formula }) }, { text: F.sig(d.exact, 12) }, { text: Fn.features[key] }] };
      }),
    ),
    choices(Fn.chooseLabel, view.FUNCTION_KEYS.map((k) => [k, text.functionNames[k]]), state.fnKey, (k) => {
      state.fnKey = k;
      updateCustom();
      updateFunctionSections();
    }),
    regions.custom,
  ];
}

// il messaggio di un errore della formula: una frase fissa o costruita dall'errore
function formulaMessage(result) {
  const m = text.functions.errors[result.error];
  return typeof m === 'function' ? m(result) : m;
}

function customField(key, id, label, hint, maxLength, mode, wide = false) {
  const input = h('input', { id, type: 'text', inputmode: mode, ...PRIVATE_FIELD, maxlength: maxLength, 'aria-describedby': `${id}-help`, oninput: (e) => changeCustom({ [key]: e.target.value.slice(0, maxLength) }) });
  input.value = state.custom[key];
  const help = h('p', { id: `${id}-help`, class: 'note', text: hint });
  controls.custom[key] = { input, help, hint };
  return h('div', { class: wide ? 'param param-wide' : 'param' }, h('label', { for: id, text: label }), h('span', { class: 'param-row' }, input), help);
}

/** The block of the reader's function: built once when it is chosen, then only its messages change. */
function updateCustom() {
  const Fn = text.functions;
  if (state.fnKey !== hw.CUSTOM) {
    fill(regions.custom);
    controls.custom = {};
    return;
  }
  regions.customNote = h('div');
  fill(
    regions.custom,
    h(
      'div',
      { class: 'custom' },
      subtitle(Fn.customTitle),
      h(
        'div',
        { class: 'params' },
        customField('formula', 'hw5-formula', Fn.formulaLabel, Fn.formulaHint, hw.FORMULA_MAX, 'text', true),
        customField('aText', 'hw5-a', Fn.aLabel, '', view.RANGE_LENGTH, 'decimal'),
        customField('bText', 'hw5-b', Fn.bLabel, '', view.RANGE_LENGTH, 'decimal'),
      ),
      regions.customNote,
    ),
  );
  updateCustomMessages();
}

function changeCustom(patch) {
  Object.assign(state.custom, patch);
  const read = view.readCustom(state.custom);
  const before = state.validCustom;
  if (read.ok) state.validCustom = read;
  updateCustomMessages();
  if (state.validCustom !== before) updateFunctionSections();
}

function updateCustomMessages() {
  const Fn = text.functions;
  const read = view.readCustom(state.custom);
  const keyOf = { formula: 'formula', a: 'aText', b: 'bText' };
  for (const [key, field] of Object.entries(controls.custom)) {
    const error = !read.ok && keyOf[read.field] === key ? formulaMessage(read) : null;
    field.input.setAttribute('aria-invalid', String(Boolean(error)));
    field.help.className = error ? 'field-error' : 'note';
    field.help.textContent = error || field.hint;
  }
  const changed = state.custom.formula !== view.DEFAULT_CUSTOM.formula || state.custom.aText !== view.DEFAULT_CUSTOM.aText || state.custom.bText !== view.DEFAULT_CUSTOM.bText;
  const note = read.ok ? Fn.customNote(read) : '';
  fill(
    regions.customNote,
    !read.ok && h('p', { class: 'stale', role: 'status', text: Fn.stale }),
    note && h('p', { class: 'note', text: note }),
    changed && h('button', { type: 'button', class: 'btn alt', text: Fn.restore, onclick: () => {
      state.custom = { ...view.DEFAULT_CUSTOM };
      for (const [key, field] of Object.entries(controls.custom)) field.input.value = state.custom[key];
      changeCustom({});
    } }),
  );
}

// --- La funzione scelta: Riemann, Lebesgue, la prova e il confronto ----------------------------------------------------

let specCache = { key: null, custom: null, spec: null, reference: null };

/** The function of Exercise 1 and its reference integral, computed again only when the choice changes. */
function current() {
  if (specCache.key !== state.fnKey || specCache.custom !== state.validCustom) {
    const spec = view.specOf(state.fnKey, state.validCustom);
    specCache = { key: state.fnKey, custom: state.validCustom, spec, reference: view.referenceOf(spec) };
  }
  return specCache;
}

function updateFunctionSections() {
  updateRiemann();
  updateLebesgue();
  updateSlices();
  updateResultsTable();
  updateCompare();
  updateEfficiency();
}

const sumCells = (r, keys, F) => keys.map((k) => ({ text: k === 'gap' ? F.err(r[k]) : F.sig(r[k], 9) }));

function updateRiemann() {
  const R = text.riemann;
  const F = text.fmt;
  const { spec, reference } = current();
  const kind = state.riemannKind;
  const name = text.functionNames[state.fnKey];
  const chart = view.integralChart(spec, 'riemann', { n: 10, kind }, F.decimal);
  const rows = view.riemannRows(spec);
  const keys = ['left', 'right', 'midpoint', 'lower', 'upper', 'gap'];
  fill(
    regions.riemann,
    h('div', { class: 'charts' }, figure(R.chartTitle(name, 10, kind), hw.drawIntegral, chart.chart, { wide: true, tip: view.tips.strip(chart.chart, text.tips) })),
    subtitle(R.tableTitle(reference)),
    table('discussion sums', [R.cols.n, ...keys.map((k) => R.cols[k])], rows.map((r) => ({ cells: [{ text: String(r.n), head: true }, ...sumCells(r, keys, F)] }))),
    h('p', { class: 'note', text: R.note }),
    paras(R.after(rows, state.fnKey)),
  );
}

function updateLebesgue() {
  const L = text.lebesgue;
  const F = text.fmt;
  const { spec, reference } = current();
  const name = text.functionNames[state.fnKey];
  const chart = view.integralChart(spec, 'lebesgue', { K: 10 }, F.decimal);
  const rows = view.lebesgueRows(spec);
  const keys = ['lower', 'upper', 'midpoint', 'gap'];
  const dist = view.distributionChart(spec, F.decimal);
  const rear = view.rearrangementChart(spec, F.decimal);
  fill(
    regions.lebesgue,
    h('div', { class: 'charts' }, figure(L.chartTitle(name, 10), hw.drawIntegral, chart.chart, { wide: true, tip: view.tips.level(chart.chart, text.tips) })),
    subtitle(L.tableTitle(reference)),
    table('discussion sums', [L.cols.K, ...keys.map((k) => L.cols[k])], rows.map((r) => ({ cells: [{ text: String(r.K), head: true }, ...sumCells(r, keys, F)] }))),
    state.fnKey === 'unbounded' && h('p', { class: 'note', text: L.capNote(spec.cap, 2 - 1 / spec.cap) }),
    h(
      'div',
      { class: 'charts' },
      figure(L.distributionTitle, hw.drawLineChart, dist, { tip: view.tips.distribution(dist, text.tips) }),
      figure(L.rearrangementTitle, hw.drawLineChart, rear.chart, { tip: view.tips.rearrangement(rear.chart, text.tips) }),
    ),
    paras(L.after(rows, state.fnKey)),
  );
}

const trySlices = { riemann: null, lebesgue: null, n: null, K: null, play: null, line: null };

function trySlicesBlock() {
  const T = text.trySlices;
  regions.slicesCharts = h('div', { class: 'charts' });
  trySlices.n = slider('hw5-slices-n', (i) => {
    stopSlices();
    state.slices.n = i + 1;
    updateSlices();
  });
  trySlices.K = slider('hw5-slices-k', (i) => {
    stopSlices();
    state.slices.K = i + 1;
    updateSlices();
  });
  trySlices.play = h('button', { type: 'button', class: 'btn', text: T.play, onclick: toggleSlices });
  trySlices.line = h('p', { class: 'caption line', 'aria-live': 'polite' });
  trySlices.riemann = null;
  trySlices.lebesgue = null;
  return h(
    'div',
    { class: 'try' },
    title('hw5-try-slices', 2, text.sections.trySlices),
    paras(T.intro),
    h('div', { class: 'slider-row' }, trySlices.n.el, trySlices.K.el, trySlices.play),
    regions.slicesCharts,
    trySlices.line,
  );
}

function updateSlices() {
  const T = text.trySlices;
  const F = text.fmt;
  const { spec, reference } = current();
  const { n, K } = state.slices;
  const r = view.integralChart(spec, 'riemann', { n, kind: 'midpoint' }, F.decimal);
  const l = view.integralChart(spec, 'lebesgue', { K }, F.decimal);
  // the two figures are kept while only n and K change; a new function rebuilds them
  if (!trySlices.riemann || trySlices.spec !== spec) {
    trySlices.riemann = figure(T.riemannTitle(n), hw.drawIntegral, r.chart, { tip: view.tips.strip(r.chart, text.tips) });
    trySlices.lebesgue = figure(T.lebesgueTitle(K), hw.drawIntegral, l.chart, { tip: view.tips.level(l.chart, text.tips) });
    trySlices.spec = spec;
    fill(regions.slicesCharts, trySlices.riemann, trySlices.lebesgue);
  } else {
    refreshFigure(trySlices.riemann, T.riemannTitle(n), r.chart, view.tips.strip(r.chart, text.tips));
    refreshFigure(trySlices.lebesgue, T.lebesgueTitle(K), l.chart, view.tips.level(l.chart, text.tips));
  }
  trySlices.n.set(SLICES_MAX - 1, n - 1, T.nLabel(n));
  trySlices.K.set(SLICES_MAX - 1, K - 1, T.kLabel(K));
  trySlices.play.textContent = state.slices.playing ? T.pause : T.play;
  trySlices.line.setAttribute('aria-live', state.slices.playing ? 'off' : 'polite');
  trySlices.line.textContent = T.values(r.sums, l.sums, reference);
}

function stopSlices() {
  state.slices.playing = false;
  clearTimeout(timers.slices);
}

function toggleSlices() {
  const sl = state.slices;
  if (sl.playing) {
    stopSlices();
    updateSlices();
    return;
  }
  if (sl.n >= SLICES_MAX && sl.K >= SLICES_MAX) {
    sl.n = 1;
    sl.K = 1;
  }
  sl.playing = true;
  updateSlices();
  const tick = () => {
    timers.slices = setTimeout(() => {
      if (!sl.playing) return;
      sl.n = Math.min(SLICES_MAX, sl.n + 1);
      sl.K = Math.min(SLICES_MAX, sl.K + 1);
      if (sl.n >= SLICES_MAX && sl.K >= SLICES_MAX) sl.playing = false;
      updateSlices();
      if (sl.playing) tick();
    }, 380);
  };
  tick();
}

function updateCompare() {
  const C = text.compare;
  const F = text.fmt;
  const s = computation.shown;
  const name = text.functionNames[state.fnKey];
  // the nine functions come with the simulation; the reader's one is compared here
  const study = state.fnKey === hw.CUSTOM ? customStudy() : s ? s.compare[state.fnKey] : null;
  const summary = s ? view.summaryRows(s) : null;
  fill(
    regions.compare,
    state.fnKey === hw.CUSTOM && h('p', { class: 'note', text: C.customPending }),
    !study
      ? pending()
      : [
        h(
          'div',
          { class: 'charts' },
          figure(C.chartTitle(name), hw.drawLineChart, view.compareChart(study, F.decimal), {
            wide: true,
            tip: view.tips.compare(study, text.tips),
            link: view.links.compare,
            items: [{ label: C.legend[0], color: 1 }, { label: C.legend[1], color: 0 }, { label: C.legend[2], color: 1, dashed: true }, { label: C.legend[3], color: 0, dashed: true }],
          }),
        ),
        subtitle(C.tableTitle),
        h(
          'div',
          { class: 'scroll' },
          table(
            'compact compare',
            [C.cols.n, C.cols.riemann, C.cols.lebesgue, C.cols.riemannGap, C.cols.lebesgueGap],
            study.rows.map((r) => ({
              cells: [
                { text: F.int(r.n), head: true },
                { text: F.err(r.errors.riemann), class: r.errors.riemann < r.errors.lebesgue ? 'win' : null },
                { text: F.err(r.errors.lebesgue), class: r.errors.lebesgue < r.errors.riemann ? 'win' : null },
                { text: F.err(r.gaps.riemann) },
                { text: F.err(r.gaps.lebesgue) },
              ],
            })),
            view.LINKED_TABLES.compare,
          ),
        ),
        paras(C.after(view.compareFacts(study), name)),
      ],
    summary && [
      subtitle(C.summaryTitle),
      table(
        'discussion summary-compare',
        [C.summaryCols.name, C.summaryCols.riemannSmall, C.summaryCols.lebesgueSmall, C.summaryCols.riemannLarge, C.summaryCols.lebesgueLarge, C.summaryCols.orderRiemann, C.summaryCols.orderLebesgue, C.summaryCols.winner],
        summary.map((r) => ({ cells: [{ text: text.functionNames[r.key], head: true }, { text: F.err(r.small.riemann) }, { text: F.err(r.small.lebesgue) }, { text: F.err(r.large.riemann) }, { text: F.err(r.large.lebesgue) }, { text: C.orderCell(r.orders.riemann) }, { text: C.orderCell(r.orders.lebesgue) }, { text: r.winner === 'lebesgue' ? 'Lebesgue' : 'Riemann' }] })),
      ),
      paras(C.summaryAfter(summary)),
    ],
  );
}

// --- 2.6 Il traffico ---------------------------------------------------------------------------------------

function trafficBlock() {
  const T = text.traffic;
  const F = text.fmt;
  const report = hw.trafficReport();
  const chart = view.trafficChart(report, F.decimal);
  const duration = view.durationChart(F.decimal);
  return [
    paras(T.intro),
    h('div', { class: 'charts' }, figure(T.chartTitle, hw.drawIntegral, chart, { wide: true, tip: view.tips.traffic(chart, text.tips) })),
    subtitle(T.tableTitle),
    table(
      'discussion traffic',
      [T.cols.y, T.cols.hours, T.cols.minutes, T.cols.when],
      report.rows.map((r) => ({ cells: [{ text: F.int(r.y), head: true }, { text: F.num(r.hours, 3) }, { text: F.num(r.hours * 60, 1) }, { text: r.intervals.map(([a, b]) => `${view.clock(a)}-${view.clock(b)}`).join(', ') }] })),
    ),
    h('div', { class: 'charts' }, figure(T.durationTitle, hw.drawLineChart, duration, { wide: true, tip: view.tips.duration(duration, text.tips) })),
    paras(T.after(report)),
  ];
}

// --- 2.7 Monte Carlo e la prova dal vivo ----------------------------------------------------------------------

function updateMc() {
  const M = text.montecarlo;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.mc, pending());
    return;
  }
  const hist = view.mcHistogram(s, state.histKey, F.decimal);
  fill(
    regions.mc,
    subtitle(M.tableTitle(s)),
    table(
      'discussion mc',
      [M.cols.name, M.cols.exact, M.cols.mean, M.cols.sd, M.cols.se, M.cols.coverage],
      view.mcRows(s).map((r) => ({ cells: [{ text: text.functionNames[r.key], head: true }, { text: F.sig(r.exact, 8) }, { text: F.sig(r.mean, 8) }, { text: F.sig(r.sd, 4) }, { text: F.sig(r.meanSe, 4) }, { text: F.pct(r.coverage, 1), class: r.coverageTest.verdict === 'reject' ? 'over' : null }] })),
    ),
    choices(M.chooseLabel, hw.FUNCTIONS.map((k) => [k, text.functionNames[k]]), state.histKey, (k) => {
      state.histKey = k;
      updateMc();
    }),
    h('div', { class: 'charts' }, figure(M.histogramTitle(text.functionNames[state.histKey], s), hw.drawHistogram, hist, { wide: true, tip: view.tips.histogram(hist, text.tips), items: [{ label: M.legend[0], color: 0 }, { label: M.legend[1], color: 2 }, { label: M.legend[2], color: 1, dashed: true }] })),
    tests('coverage', s),
    paras(M.after(s)),
  );
}

const tryMc = { fig: null, play: null, line: null, run: null };

function tryMcBlock() {
  const T = text.tryMc;
  regions.tryMcChoice = h('div');
  tryMc.play = h('button', { type: 'button', class: 'btn', text: T.play, onclick: toggleMc });
  tryMc.line = h('p', { class: 'caption line', 'aria-live': 'polite' });
  tryMc.run = view.mcPath(state.target.seed, state.mc.key, state.mc.draw);
  tryMc.fig = figure(T.chartTitle(text.functionNames[state.mc.key]), hw.drawLineChart, view.mcPathChart(tryMc.run, state.mc.shown, text.fmt.decimal), { wide: true, tip: view.tips.mcPath(tryMc.run, text.tips), items: [{ label: T.legend[0], color: 0 }, { label: T.legend[1], color: 1, dashed: true }] });
  return h(
    'div',
    { class: 'try' },
    title('hw5-try-mc', 2, text.sections.tryMc),
    paras(T.intro),
    choices(T.chooseLabel, hw.FUNCTIONS.map((k) => [k, text.functionNames[k]]), state.mc.key, (k) => {
      state.mc.key = k;
      resetMc();
    }),
    h('div', { class: 'slider-row' }, h('span', { class: 'buttons' }, tryMc.play, h('button', { type: 'button', class: 'btn alt', text: T.again, onclick: () => {
      state.mc.draw += 1;
      resetMc();
    } }))),
    h('div', { class: 'charts' }, tryMc.fig),
    tryMc.line,
  );
}

function stopMc() {
  state.mc.playing = false;
  clearTimeout(timers.mc);
}

/** A new run of the live example: another function, another draw or another seed. */
function resetMc() {
  stopMc();
  state.mc.shown = 0;
  tryMc.run = view.mcPath(state.target.seed, state.mc.key, state.mc.draw);
  updateTryMc();
}

function updateTryMc() {
  const T = text.tryMc;
  const run = tryMc.run;
  const shown = state.mc.shown;
  refreshFigure(tryMc.fig, T.chartTitle(text.functionNames[state.mc.key]), view.mcPathChart(run, shown, text.fmt.decimal), view.tips.mcPath(run, text.tips));
  tryMc.play.textContent = state.mc.playing ? T.pause : T.play;
  tryMc.line.setAttribute('aria-live', state.mc.playing ? 'off' : 'polite');
  tryMc.line.textContent = T.status(shown > 0 ? run.path[shown - 1] : null, run.exact);
}

function toggleMc() {
  const mc = state.mc;
  const last = tryMc.run.path.length;
  if (mc.playing) {
    stopMc();
    updateTryMc();
    return;
  }
  if (mc.shown >= last) mc.shown = 0;
  mc.playing = true;
  updateTryMc();
  const tick = () => {
    timers.mc = setTimeout(() => {
      if (!mc.playing) return;
      mc.shown = Math.min(last, mc.shown + 1);
      if (mc.shown >= last) mc.playing = false;
      updateTryMc();
      if (mc.playing) tick();
    }, 160);
  };
  tick();
}

// --- 2.8 Dirichlet ---------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 3, 4 e 5
// ---------------------------------------------------------------------------

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section' }, title('hw5-tests', 0, text.sections.tests), regions.tests);
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
    paras(T.after(summary)),
  );
}

function historySection() {
  const H = text.history;
  return h(
    'section',
    { class: 'section' },
    title('hw5-history', 0, text.sections.history),
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

// i fatti delle conclusioni che non dipendono dalle simulazioni
let staticFacts = null;

function conclusionSection() {
  regions.conclusion = h('div');
  return h('section', { class: 'section' }, title('hw5-conclusion', 0, text.sections.conclusion), regions.conclusion);
}

function updateConclusion() {
  if (!staticFacts) staticFacts = { ...view.convergenceFacts(hw.convergenceStudy()), tailTotal: view.tailFacts(hw.tailRows()).total, nist: view.referenceFacts().nist };
  fill(regions.conclusion, paras(text.conclusion(computation.shown, staticFacts)));
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

// gli ultimi risultati restano in memoria
function remember(key, value) {
  results.delete(key);
  results.set(key, value);
  while (results.size > 4) results.delete(results.keys().next().value);
}

/** Computes the parameters of state.target; the computation still running for other parameters stops at its next slice. */
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
  updateData();
  updateResultsTable();
  updateCompare();
  updateEfficiency();
  updateOurs();
  updateMethods();
  updateMc();
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
  document.title = 'Homework #5 - Statistics';
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
  text = HW5_TEXTS[state.lang];
  stopSlices();
  stopMc();
  controls.fields = {};
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), exercise1Section(), exercise2Section(), checksSection(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateArea();
  updateInfinity();
  updateInputs();
  updateVerify();
  updateCoins();
  updateCustom();
  updateFunctionSections();
  updateTryMc();
  updateResults();
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
  // i colori dei grafici e delle legende seguono il tema del sistema
  darkQuery.addEventListener('change', render);
  render();
  // le verifiche e le simulazioni partono dopo il primo disegno della pagina
  setTimeout(() => {
    try {
      checkRows = hw.verifyAll();
    } catch (error) {
      checkRows = [{ group: 'quadrature', name: text.ui.error(message(error)), expected: '', actual: '', ok: false }];
    }
    updateVerify();
    startComputation();
  }, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
})();
