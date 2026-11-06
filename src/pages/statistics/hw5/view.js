// src/pages/statistics/hw5/view.js
// Logica di presentazione dell'Homework #5, condivisa fra la pagina del sito
// (React) e il programma scaricabile (DOM puro): le sezioni, la lettura dei
// campi, le righe delle tabelle, i dati dei grafici e i fatti che i testi
// citano. Tenerla qui impedisce che le due versioni dicano cose diverse
// sugli stessi numeri.
import * as hw from './homework5.js';

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
export const SECTIONS = [
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
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

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
export const AREA = Object.freeze({
  zRange: Object.freeze([-4, 4]),
  zStep: 0.01,
  mus: Object.freeze([-2, -1, 0, 1, 2]),
  sigmas: Object.freeze([0.5, 1, 2]),
  nMax: 32,
  strategies: Object.freeze(['symmetry', 'truncation']),
  defaults: Object.freeze({ mu: 0, sigma: 1, z: 1.96, rule: 'simpson', n: 4, strategy: 'symmetry' }),
});

export const Z_STEPS = Math.round((AREA.zRange[1] - AREA.zRange[0]) / AREA.zStep);
export const zOfIndex = (i) => Number((AREA.zRange[0] + i * AREA.zStep).toFixed(2));
export const indexOfZ = (z) => Math.round((z - AREA.zRange[0]) / AREA.zStep);

/**
 * The first example: F(x) for X ~ N(mu, sigma^2) with one rule and n
 * pieces. With the symmetry the pieces cover [mu, x] and the half to the
 * left of mu counts 1/2 (for x < mu they cover [x, mu] and are taken away
 * from 1/2); with the truncation they cover [mu - 4 sigma, x], and
 * Phi(-4) = 3.2e-5 is left out.
 */
export function areaState({ mu, sigma, z, rule, n, strategy }, decimal = '.') {
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
export function bellChart(decimal = '.') {
  const s = areaState({ ...AREA.defaults, n: 2 }, decimal);
  return { ...s.chart, pieces: [] };
}

// ---------------------------------------------------------------------------
// 1.2 Le cinque regole
// ---------------------------------------------------------------------------

/** The rules and the n of the table of section 1.2. */
export const RULES_N = 16;

/** The five rules on Phi(1.96) with n = 16: value, error, values of phi used. */
export const ruleRows = () =>
  hw.RULES.map((rule) => {
    const n = hw.validN(rule, RULES_N);
    const value = hw.cdfStandard(hw.CONVERGENCE_Z, { rule, n });
    return { rule, n, value, error: Math.abs(value - hw.normalCdf(hw.CONVERGENCE_Z)), evaluations: hw.evaluationsOf(rule, n) };
  });

/** The nodes and weights of Gauss-Legendre with 5 points, on [-1, 1]. */
export function gaussRows(n = 5) {
  const { nodes, weights } = hw.gaussLegendre(n);
  return nodes.map((t, i) => ({ i: i + 1, node: t, weight: weights[i] }));
}

/** The function of section 1.2 as the page shows it: integrate() of homework5.js, one line per rule. */
export const RULE_CODE = [
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
export const STRATEGY_COLUMNS = Object.freeze([
  Object.freeze({ strategy: 'symmetry', lower: null }),
  Object.freeze({ strategy: 'truncation', lower: 4 }),
  Object.freeze({ strategy: 'truncation', lower: 8 }),
  Object.freeze({ strategy: 'substitution', lower: null }),
]);

/** The rows of section 1.3 for one rule: z, Phi(z), and the error of every way around -infinity. */
export function strategyTable(rule) {
  return hw.strategyRows().map((row) => ({
    z: row.z,
    reference: row.reference,
    errors: STRATEGY_COLUMNS.map((c) => row.cells.find((cell) => cell.rule === rule && cell.strategy === c.strategy && (c.lower === null || cell.lower === c.lower)).error),
  }));
}

/** What the text of section 1.3 says: the largest error of every column for both rules, and what the truncation at -4 leaves out. */
export function strategyFacts() {
  const out = {};
  for (const { rule } of hw.STRATEGY_RULES) out[rule] = STRATEGY_COLUMNS.map((_, c) => Math.max(...strategyTable(rule).map((r) => r.errors[c])));
  return { ...out, leftOut4: hw.normalCdf(-4), leftOut8: hw.normalCdf(-8), n: hw.STRATEGY_RULES[0].n };
}

// ---------------------------------------------------------------------------
// 1.4 Quanti punti servono
// ---------------------------------------------------------------------------

/** The convergence chart: error against n for the five rules, on logarithmic axes. */
export function convergenceChart(study, decimal = '.') {
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
export function convergenceFacts(study) {
  const at = (n) => study.rows.find((r) => r.n === n);
  return { orders: study.orders, enough: study.enough, simpson16: at(16).errors.simpson, gauss8: at(8).errors.gauss, left16384: at(16384).errors.left, midpoint16384: at(16384).errors.midpoint, reference: study.reference, z: study.z };
}

// ---------------------------------------------------------------------------
// 1.5 La tavola, 1.6 i quantili
// ---------------------------------------------------------------------------

/** The cells of the table that the text points at: the z of the most used quantiles. */
export const ZTABLE_MARKS = Object.freeze([1.28, 1.64, 1.65, 1.96, 2.33, 2.57, 2.58]);

export const isMarkedZ = (z) => ZTABLE_MARKS.some((m) => Math.abs(m - z) < 1e-9);

/** The quantiles of section 1.6, with the difference from the reference (Acklam's approximation and one step of Halley). */
export const quantileRows = () =>
  hw.QUANTILE_LEVELS.map((p) => {
    const q = hw.quantileNewton(p);
    return { p, z: q.z, steps: q.steps.length, reference: q.reference, difference: Math.abs(q.z - q.reference) };
  });

/** The level whose Newton steps the page shows one by one: the 1.96 of every 95% interval. */
export const NEWTON_P = 0.975;

/** The steps of Newton's method for NEWTON_P, with the error of each against the final value. */
export function newtonRows(p = NEWTON_P) {
  const q = hw.quantileNewton(p);
  return q.steps.map((s) => ({ ...s, error: Math.abs(s.z - q.z) }));
}

/** The chart of the Newton steps: the error after each step, on a logarithmic axis. */
export function newtonChart(rows, decimal = '.') {
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
export function tailChart(rows, decimal = '.') {
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
export function tailFacts(rows) {
  const first = (limit) => {
    const r = rows.find((row) => row.subtractionError > limit);
    return r ? r.k : null;
  };
  return { micro: first(1e-6), total: first(0.5), worstDirect: Math.max(...rows.map((r) => r.directError)), at8: rows.find((r) => r.k === 8), at9: rows.find((r) => r.k === 9) };
}

/** The events a day and the false alarms the reader accepts, in the example of the alarm threshold. */
export const ALARM_EVENTS = Object.freeze([1e4, 1e5, 1e6, 1e7]);
export const ALARM_RATES = Object.freeze({ tenDay: 10, day: 1, week: 1 / 7, month: 1 / 30 });
export const ALARM_DEFAULT = Object.freeze({ events: 1e6, rate: 'day' });

/** The thresholds of the table of section 1.7, with a million events a day. */
export const ALARM_KS = Object.freeze([2, 3, 4, 5, 6]);

export const alarmRows = (events = 1e6) =>
  ALARM_KS.map((k) => {
    const normal = hw.tailDirect(k);
    const heavy = hw.heavySf(k);
    return { k, normal, heavy, normalPerDay: events * normal, heavyPerDay: events * heavy, ratio: heavy / normal };
  });

/** The example of the alarm threshold: the k for the accepted rate, and what heavy tails would make of it. */
export function alarmState(events, rate) {
  const perDay = ALARM_RATES[rate];
  const target = perDay / events;
  const t = hw.alarmThreshold(target);
  return { events, rate, perDay, target, k: t.k, steps: t.steps, heavyRate: hw.heavySf(t.k), heavyPerDay: events * hw.heavySf(t.k) };
}

/** The chart of the example: the two tails on a logarithmic axis, and the accepted rate as a dashed line. */
export function alarmChart(state, decimal = '.') {
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
export const FIELD_LENGTH = Object.freeze({ seed: 10, sample: 6, points: 5, reps: 4 });

export const DEFAULT_PARAMS = Object.freeze({ seed: hw.DEFAULT_SEED, sample: hw.DEFAULT_SAMPLE, points: hw.DEFAULT_POINTS, reps: hw.DEFAULT_REPS });

/** The text of the fields for some parameters. */
export const fieldsOf = (params) => ({ seedText: String(params.seed), sampleText: String(params.sample), pointsText: String(params.points), repsText: String(params.reps) });

export const DEFAULT_INPUTS = Object.freeze(fieldsOf(DEFAULT_PARAMS));

/** The four fields, read and checked. */
export const readInputs = ({ seedText, sampleText, pointsText, repsText }) => ({
  seed: hw.parseInteger(seedText, hw.LIMITS.seed),
  sample: hw.parseInteger(sampleText, hw.LIMITS.sample),
  points: hw.parseInteger(pointsText, hw.LIMITS.points),
  reps: hw.parseInteger(repsText, hw.LIMITS.reps),
});

export const sameParams = (a, b) => a.seed === b.seed && a.sample === b.sample && a.points === b.points && a.reps === b.reps;

/** The parameters after a change of the fields: every valid field takes its new value, the others keep the last valid one. */
export function applyInputs(read, previous) {
  const pick = (r, old) => (r.ok ? r.value : old);
  const next = { seed: pick(read.seed, previous.seed), sample: pick(read.sample, previous.sample), points: pick(read.points, previous.points), reps: pick(read.reps, previous.reps) };
  return sameParams(next, previous) ? previous : next;
}

export const allValid = (read) => read.seed.ok && read.sample.ok && read.points.ok && read.reps.ok;

/** The parameters as one string, the key of the cache of results. */
export const paramsKey = (params) => `${params.seed}|${params.sample}|${params.points}|${params.reps}`;
export function parseParamsKey(key) {
  const [seed, sample, points, reps] = key.split('|').map(Number);
  return { seed, sample, points, reps };
}

/** The line under the fields: the parameters of the page, or the reader's, with the button to go back. */
export function inputBadge(params, I) {
  const known = sameParams(params, DEFAULT_PARAMS);
  return { known, restore: !known, text: known ? I.badgeTask : I.badgeCustom(params) };
}

/** The window of the charts of section 1.8: the same for both samples, so that the two curves can be compared; a few extreme values of the heavy tails fall outside. */
export const ECDF_WINDOW = Object.freeze([-5, 5]);

/** The empirical distribution function of a sample against the numerical Phi, in ECDF_WINDOW. */
export function ecdfChart(report, decimal = '.') {
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
export const FUNCTION_KEYS = Object.freeze([...hw.FUNCTIONS, hw.CUSTOM]);

/** The fields of the reader's function, as the page opens. */
export const DEFAULT_CUSTOM = Object.freeze({ formula: hw.DEFAULT_FORMULA, aText: String(hw.DEFAULT_RANGE[0]), bText: String(hw.DEFAULT_RANGE[1]) });
export const RANGE_LENGTH = 12;

/** The reader's function, read and checked: the two ends and the formula, with the first problem found. */
export function readCustom({ formula, aText, bText }) {
  const a = hw.parseNumber(aText, [-hw.RANGE_LIMIT, hw.RANGE_LIMIT]);
  const b = hw.parseNumber(bText, [-hw.RANGE_LIMIT, hw.RANGE_LIMIT]);
  if (!a.ok || !b.ok) return { ok: false, a, b, error: 'range', field: !a.ok ? 'a' : 'b' };
  if (!(a.value < b.value)) return { ok: false, a, b, error: 'order', field: 'b' };
  const result = hw.customFunction(formula, a.value, b.value);
  return result.ok ? { ...result, ok: true } : { ...result, ok: false, field: 'formula' };
}

/** One function of the choice: the library's, or the reader's when it is valid (otherwise the last valid one). */
export const specOf = (key, custom) => hw.functionOf(key, custom);

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
export function integralChart(spec, mode, { n = 10, K = 10, kind = 'midpoint' } = {}, decimal = '.') {
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
export const SUM_SIZES = Object.freeze([10, 100, 1000]);

/** The Riemann sums of a function for n = 10, 100, 1000. */
export const riemannRows = (spec) =>
  SUM_SIZES.map((n) => {
    const r = hw.riemannSums(spec.f, spec.a, spec.b, n);
    return { n, left: r.left, right: r.right, midpoint: r.midpoint, lower: r.lower, upper: r.upper, gap: r.upper - r.lower };
  });

/** The Lebesgue sums of a function for K = 10, 100, 1000 levels. */
export const lebesgueRows = (spec) =>
  SUM_SIZES.map((K) => {
    const l = hw.lebesgueSums(spec.f, spec.a, spec.b, K, { cap: spec.cap });
    return { K, lower: l.lower, upper: l.upper, midpoint: l.midpoint, gap: l.upper - l.lower, m: l.m, M: l.M, capped: l.capped };
  });

/** The integral the errors are measured against: the exact one, or hw.referenceIntegral for the reader's function. */
export function referenceOf(spec) {
  if (spec.exact !== null) return { value: spec.exact, exact: true, method: 'exact', uncertainty: null };
  return { ...hw.referenceIntegral(spec.f, spec.a, spec.b), exact: false };
}

/** The distribution function of the values, y -> mu{f >= y}, at 200 levels: Lebesgue's view of the function. */
export function distributionChart(spec, decimal = '.') {
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
export function rearrangementChart(spec, decimal = '.') {
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
export function compareChart(study, decimal = '.') {
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
export function compareFacts(study) {
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
export const SUMMARY_N = Object.freeze([hw.COMPARE_N[1], hw.COMPARE_N[hw.COMPARE_N.length - 1]]);

/** The overview of section 1.6: every function, its two errors at n = K = 9 and 729, the orders measured on all six n, and the winner. */
export const summaryRows = (s) =>
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
export const SAME_LIMIT = Object.freeze({ sine: 'yes', square: 'yes', jump: 'yes', vee: 'yes', unbounded: 'improper', indicator: 'yes', sinc: 'yes', oscillating: 'yes', traffic: 'yes', custom: 'unknown', dirichlet: 'noRiemann', thomae: 'yes' });

/**
 * The table of section 1.5: every function with its integral and the two
 * midpoint sums with 729 strips and 729 levels, with their errors and the
 * verdict; the typed function when there is one; then Dirichlet and Thomae
 * from the exact fractions of section 1.8 (their Riemann value is the
 * upper sum with 10,000 strips: the lower one is always 0).
 */
export function resultsRows(s, customStudy = null, patho = null) {
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
export const efficiencyRows = (s) => hw.FUNCTIONS.map((key) => ({ key, reference: s.efficiency[key].reference, targets: s.efficiency[key].targets }));

/**
 * The numbers the text of section 1.7 quotes, for a relative error of 1%:
 * how many times the values of f of Riemann Lebesgue needs, where both get
 * there; where Lebesgue needs fewer levels than Riemann needs strips; where
 * only one of the two gets there with 729.
 */
export function efficiencyFacts(s) {
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
export function efficiencyChart(study, decimal = '.') {
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
export const THOMAE_Q = 40;
export const THOMAE_STRIPS = 10;

let pathologicalCache = null;

/** The sums of section 1.8, computed once: they do not depend on anything the reader changes. */
export const pathological = () => {
  if (!pathologicalCache) pathologicalCache = hw.pathologicalStudy();
  return pathologicalCache;
};

/** Thomae's function in a picture: a stem of height 1/q on every p/q with q up to THOMAE_Q, and the staircase of the upper sum with THOMAE_STRIPS strips. */
export function thomaeChart(decimal = '.') {
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
export const thomaeUpper = () => {
  let s = 0;
  for (let i = 0; i < THOMAE_STRIPS; i++) s += 1 / hw.smallestDenominator(i, THOMAE_STRIPS);
  return s / THOMAE_STRIPS;
};

// ---------------------------------------------------------------------------
// 2.6 Il traffico
// ---------------------------------------------------------------------------

/** "21:07" for 21.12 hours. */
export function clock(hours) {
  const minutes = Math.round(hours * 60);
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** The traffic of the day in Lebesgue's view: the bands of the thresholds, each over the hours the link stays above it. */
export function trafficChart(report, decimal = '.') {
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
export function durationChart(decimal = '.') {
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
export const mcRows = (s) => hw.FUNCTIONS.map((key) => ({ key, ...s.mc[key] }));

/** The histogram of the estimates of one function, with the normal law of the central limit theorem and the exact value. */
export function mcHistogram(s, key, decimal = '.') {
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
export const MC_CHECKPOINTS = Object.freeze(Array.from({ length: 41 }, (_, i) => Math.round(10 ** (1 + i / 10))));

/** A run of the live example: the running estimate of one function, the `run`-th of the seed. */
export function mcPath(seed, key, run) {
  const spec = hw.functionOf(key);
  const index = hw.FUNCTIONS.indexOf(key);
  return { key, exact: spec.exact, path: hw.monteCarloPath(spec.f, spec.a, spec.b, MC_CHECKPOINTS, hw.generator(seed, 'mc', 100000 + index * 1000 + run)) };
}

/** The chart of the live example up to the `shown`-th checkpoint: the estimate with its 95% band, and the exact value. The axis covers the whole run from the start, so it stays still while the points arrive. */
export function mcPathChart(run, shown, decimal = '.') {
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
export const DIRICHLET_NUMBERS = Object.freeze([
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
export const SERIES_CHOICES = Object.freeze([1, 3, 5, 8]);
export const SERIES_TERMS = 120;

/** The chart of section 2.7: the error of the two series against the number of terms at one z, with the bound of the alternating series. */
export function seriesChart(z, decimal = '.') {
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
export function approximationChart(decimal = '.') {
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
export function approximationFacts() {
  const as = hw.accuracyOf(hw.cdfAS);
  const zs = hw.accuracyOf(hw.cdfZS);
  return { as: as.absolute, asAt: as.absAt, zs: zs.absolute, zsAt: zs.absAt, asBound: hw.ERF_AS.bound / 2, zsBound: hw.CDF_ZS.bound, zsRelative: zs.relative, asTail: hw.cdfAS(-9) };
}

/** The colors and dashes of the methods in the chart of section 2.11. */
export const METHOD_STYLE = Object.freeze({
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
export function methodsChart(decimal = '.') {
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
export function methodsRows(s) {
  if (!methodsCache) methodsCache = hw.CDF_METHODS.map((key) => ({ key, ...hw.accuracyOf(hw.cdfBy[key]), exp: hw.EXP_CALLS[key], terms: hw.termsOf(key) }));
  return methodsCache.map((row) => ({ ...row, time: s ? s.timing[row.key] : null }));
}

/** The numbers the texts of sections 2.9 - 2.11 quote. */
export function methodsFacts(s) {
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
export function referenceFacts() {
  if (!referenceCache) referenceCache = { rows: hw.referenceRows(), nist: hw.nistComparison() };
  return referenceCache;
}

// ---------------------------------------------------------------------------
// I test
// ---------------------------------------------------------------------------

export const TEST_GROUPS = ['model', 'coverage', 'bias'];

export const statTests = hw.statisticalTests;

/**
 * What every test should say, from theory and not from the data: the
 * normal sample fits; the heavy-tailed one does not, when the sample is
 * large enough for the test to see the difference; Monte Carlo is unbiased
 * and its intervals cover 95% for every function with a finite variance,
 * while for 1/sqrt(x) the variance is infinite and the intervals may fall
 * short, depending on how many repetitions there are.
 */
export function expectedVerdicts(s) {
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
export function testSummary(s) {
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
export const tips = {
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
export const LINKED_TABLES = Object.freeze({
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
export const links = {
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
export function scheduleFrameJob(job) {
  frameJobs.push(job);
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(runFrameJobs);
  }
}
