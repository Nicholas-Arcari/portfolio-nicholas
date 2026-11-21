// src/pages/statistics/hw7/view.js
// La logica di presentazione dell'Homework #7, comune alla pagina del sito e
// al programma scaricabile: le sezioni e il loro indice, i parametri dei
// calcoli, i dati di ogni grafico, le legende a pulsanti (le parti del
// disegno che ogni voce nasconde), le etichette sotto il puntatore, le
// tabelle legate ai grafici, i valori iniziali dei riquadri "Prova" e le
// righe del riepilogo dei test. Qui non ci sono testi: arrivano da texts.js.
import * as hw from './homework7.js';

/** The sections of the page, in order, with the level of their title: the index of the page and of the program is built from here. */
export const SECTIONS = [
  { id: 'hw7-assignment', key: 'assignment', level: 0 },
  { id: 'hw7-convergence', key: 'convergence', level: 0 },
  { id: 'hw7-probability', key: 'probability', level: 1 },
  { id: 'hw7-almost', key: 'almost', level: 1 },
  { id: 'hw7-try-sequences', key: 'trySequences', level: 2 },
  { id: 'hw7-l2', key: 'l2', level: 1 },
  { id: 'hw7-distribution', key: 'distribution', level: 1 },
  { id: 'hw7-try-clt', key: 'tryClt', level: 2 },
  { id: 'hw7-try-hash', key: 'tryHash', level: 2 },
  { id: 'hw7-map', key: 'map', level: 1 },
  { id: 'hw7-try-map', key: 'tryMap', level: 2 },
  { id: 'hw7-roles', key: 'roles', level: 1 },
  { id: 'hw7-results', key: 'results', level: 1 },
  { id: 'hw7-root', key: 'root', level: 1 },
  { id: 'hw7-try-scale', key: 'tryScale', level: 2 },
  { id: 'hw7-bursts', key: 'bursts', level: 1 },
  { id: 'hw7-try-bursts', key: 'tryBursts', level: 2 },
  { id: 'hw7-heavy', key: 'heavy', level: 1 },
  { id: 'hw7-speed', key: 'speed', level: 1 },
  { id: 'hw7-bayes', key: 'bayes', level: 0 },
  { id: 'hw7-conditional', key: 'conditional', level: 1 },
  { id: 'hw7-try-pvalue', key: 'tryPvalue', level: 2 },
  { id: 'hw7-engine', key: 'engine', level: 1 },
  { id: 'hw7-alarm', key: 'alarm', level: 1 },
  { id: 'hw7-try-alarm', key: 'tryAlarm', level: 2 },
  { id: 'hw7-network', key: 'network', level: 1 },
  { id: 'hw7-try-network', key: 'tryNetwork', level: 2 },
  { id: 'hw7-sprt', key: 'sprt', level: 1 },
  { id: 'hw7-try-sprt', key: 'trySprt', level: 2 },
  { id: 'hw7-rate', key: 'rate', level: 1 },
  { id: 'hw7-try-belief', key: 'tryBelief', level: 2 },
  { id: 'hw7-try-prior', key: 'tryPrior', level: 2 },
  { id: 'hw7-frequentist', key: 'frequentist', level: 1 },
  { id: 'hw7-spam', key: 'spam', level: 1 },
  { id: 'hw7-kdd', key: 'kdd', level: 1 },
  { id: 'hw7-limits', key: 'limits', level: 1 },
  { id: 'hw7-bvm', key: 'bvm', level: 1 },
  { id: 'hw7-checks', key: 'checks', level: 0 },
  { id: 'hw7-tests', key: 'tests', level: 0 },
  { id: 'hw7-history', key: 'history', level: 0 },
  { id: 'hw7-conclusion', key: 'conclusion', level: 0 },
];

/** The entries of the index: the sections with their titles in the current language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

/** The parameters of the computations as the page opens, and the key that names a set of them. */
export const DEFAULT_PARAMS = Object.freeze({ seed: hw.DEFAULT_SEED });
export const paramsKey = (params) => `${params.seed}`;
export const parseParamsKey = (key) => ({ seed: Number(key) });

// ---------------------------------------------------------------------------
// Numeri
// ---------------------------------------------------------------------------

/** A p-value as mantissa and exponent, also below 10^-300, where p itself is 0: { m, e } with p = m x 10^e. */
export function pParts(p, log10p) {
  if (!Number.isFinite(log10p)) return { m: 0, e: 0 };
  const e = Math.floor(log10p);
  let m = 10 ** (log10p - e);
  if (m >= 9.995) return { m: 1, e: e + 1 };
  m = Math.round(m * 100) / 100;
  return { m, e };
}

const percentTicks = (lo, hi, step) => Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => Number((lo + i * step).toFixed(6)));
/** An axis label in percent: 0.25 -> 25%. */
export const pctLabel = (decimal) => (v) => `${String(Number((100 * v).toFixed(1))).replace('.', decimal)}%`;
/** Powers of ten for a logarithmic axis. */
const powers = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => 10 ** (lo + i));

// ---------------------------------------------------------------------------
// 1.2 L'allarme
// ---------------------------------------------------------------------------

/** The categories of the natural frequencies, in the order of the cells: attacks seen, attacks missed, false alarms, quiet normal connections. */
export const ALARM_CATEGORIES = Object.freeze(['detected', 'missed', 'falseAlarm', 'quiet']);
const ALARM_COLORS = Object.freeze([1, 4, 3, 6]);

/** The picture of the natural frequencies of one alarm. */
export const alarmIcons = (facts) => ({ counts: facts.counts, total: facts.population, columns: 'auto', colors: ALARM_COLORS, faint: [3] });

/** The indices of the sliders of "Try it" as the page opens. */
export const ALARM_TRY_DEFAULT = Object.freeze({
  base: hw.ALARM_BASES.indexOf(hw.ALARM_DEFAULT.base),
  sensitivity: hw.ALARM_SENSITIVITIES.indexOf(hw.ALARM_DEFAULT.sensitivity),
  fpr: hw.ALARM_FPRS.indexOf(hw.ALARM_DEFAULT.fpr),
  second: false,
});

/** The facts of "Try it" from the indices of its sliders; with the second detector, the counts of the connections it sees again. */
export function alarmTry(state) {
  const settings = { base: hw.ALARM_BASES[state.base], sensitivity: hw.ALARM_SENSITIVITIES[state.sensitivity], fpr: hw.ALARM_FPRS[state.fpr] };
  const facts = hw.alarmFacts(settings);
  const chain = hw.evidenceChain(settings.base, [{ ...settings, fired: true }, { ...hw.SECOND_DETECTOR, fired: true }]);
  // the alarmed connections that the sandbox confirms: expected, rounded for the words
  const confirmed = [facts.expected[0] * hw.SECOND_DETECTOR.sensitivity, facts.expected[2] * hw.SECOND_DETECTOR.fpr];
  return { settings, facts, chain, confirmed };
}

/** The two orders of the same evidence: the posterior does not depend on it. */
export function alarmChains() {
  const first = { ...hw.ALARM_DEFAULT, fired: true, key: 'ids' };
  const second = { ...hw.SECOND_DETECTOR, fired: true, key: 'sandbox' };
  return { forward: hw.evidenceChain(hw.ALARM_DEFAULT.base, [first, second]), backward: hw.evidenceChain(hw.ALARM_DEFAULT.base, [second, first]) };
}

// ---------------------------------------------------------------------------
// 1.3 La rete bayesiana
// ---------------------------------------------------------------------------

/** The posteriors of the three hidden nodes along the story of NETWORK_STEPS. */
export const networkRows = () => hw.NETWORK_STEPS.map((evidence) => ({ evidence, ...hw.networkPosterior(evidence) }));

/** The chart of section 1.3: one group of bars per step (labels: their short names), one bar per hidden node. */
export function networkChart(rows, labels, decimal = '.') {
  return {
    categories: labels,
    series: hw.HIDDEN.map((node, k) => ({ values: rows.map((r) => r[node]), colorIndex: [0, 1, 4][k] })),
    yMax: 1,
    yTicks: percentTicks(0, 1, 0.25),
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The evidence of "Try it" as the page opens: every clue unknown. */
export const NETWORK_TRY_DEFAULT = Object.freeze({ edr: null, login: null, signature: null });

/** The places of the nodes in the drawing of the network, in a 100 x 60 box. */
export const NETWORK_LAYOUT = Object.freeze({
  phishing: Object.freeze({ x: 22, y: 10 }),
  exploit: Object.freeze({ x: 78, y: 10 }),
  compromise: Object.freeze({ x: 50, y: 32 }),
  login: Object.freeze({ x: 13, y: 52 }),
  edr: Object.freeze({ x: 50, y: 52 }),
  signature: Object.freeze({ x: 87, y: 52 }),
});
/** The arrows of the network: parent -> child. */
export const NETWORK_EDGES = Object.freeze([['phishing', 'compromise'], ['exploit', 'compromise'], ['phishing', 'login'], ['compromise', 'edr'], ['exploit', 'signature']]);

// ---------------------------------------------------------------------------
// 1.4 Il test di Wald
// ---------------------------------------------------------------------------

/** Two example addresses, written by hand: a user who mistypes once, then gets in; an attacker who keeps failing. */
export const SPRT_EXAMPLES = Object.freeze({ legit: Object.freeze([true, false, false]), attacker: Object.freeze([true, true, true, true, true]) });

/** The chart of the log-likelihood ratio: one line per walk, the two thresholds dashed. */
export function sprtChart(setup, walks, decimal = '.') {
  const longest = Math.max(1, ...walks.map((w) => w.llr.length - 1));
  const x = Array.from({ length: longest + 1 }, (_, i) => i);
  const top = Math.max(setup.upper, ...walks.flatMap((w) => w.llr)) + 1;
  const bottom = Math.min(setup.lower, ...walks.flatMap((w) => w.llr)) - 1;
  return {
    x,
    series: [
      ...walks.map((w, k) => ({ values: x.map((i) => (i < w.llr.length ? w.llr[i] : null)), colorIndex: w.color ?? k })),
      { values: x.map(() => setup.upper), colorIndex: 1, dashed: true },
      { values: x.map(() => setup.lower), colorIndex: 2, dashed: true },
    ],
    yMin: Math.floor(bottom),
    yMax: Math.ceil(top),
    yTicks: hw.niceTicks(Math.floor(bottom), Math.ceil(top), 6),
    xTicks: hw.niceTicks(0, longest, Math.min(8, longest + 1)).filter((v) => Number.isInteger(v)),
    decimal,
  };
}

/** The address of "Try it" as the page opens: no attempt yet, alpha 1 in 1,000. */
export const SPRT_TRY_DEFAULT = Object.freeze({ attempts: Object.freeze([]), alpha: hw.SPRT_ALPHAS.indexOf(hw.SPRT_DEFAULT.alpha), draws: 0 });

/** The posterior probability of an attacker from a log-likelihood ratio and prior odds of 1 (one address in two). */
export const sprtPosterior = (llr) => hw.sigmoid(llr);

// ---------------------------------------------------------------------------
// 1.5 Il tasso del phishing
// ---------------------------------------------------------------------------

/** The campaign of the page and its posteriors, day after day, under two priors. */
export function campaignFacts(seed = hw.DEFAULT_SEED) {
  const days = hw.campaign(seed);
  const uniform = hw.campaignPosteriors(days, hw.PRIORS.uniform);
  const informed = hw.campaignPosteriors(days, hw.PRIORS.informed);
  return { days, uniform, informed, aboveUniform: uniform.map((r) => r.above(hw.TARGET_RATE)), aboveInformed: informed.map((r) => r.above(hw.TARGET_RATE)) };
}

/** The chart of section 1.5: the posterior mean of each analyst, day by day, with its 95% interval as a band; the true rate dashed. */
export function campaignChart(c, decimal = '.') {
  const x = c.uniform.map((r) => r.day);
  return {
    x,
    series: [
      { values: c.uniform.map((r) => r.mean), band: c.uniform.map((r) => [r.lo, r.hi]), colorIndex: 0 },
      { values: c.informed.map((r) => r.mean), band: c.informed.map((r) => [r.lo, r.hi]), colorIndex: 1 },
      { values: x.map(() => hw.CAMPAIGN.rate), colorIndex: 6, dashed: true },
    ],
    yMin: 0,
    yMax: 0.6,
    yTicks: percentTicks(0, 0.6, 0.1),
    xTicks: x,
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** Prior, likelihood and posterior densities on the grid of the rates. */
export function densityChart({ prior, likelihood, posterior }, decimal = '.', top = null) {
  const visible = [...prior, ...likelihood, ...posterior].filter(Number.isFinite);
  const max = top ?? Math.max(1, ...visible) * 1.08;
  return {
    x: hw.GRID,
    series: [
      { values: prior.map((v) => (Number.isFinite(v) ? v : null)), colorIndex: 6, dashed: true },
      { values: likelihood, colorIndex: 3, dotted: true },
      { values: posterior, colorIndex: 0, dots: false },
    ],
    yMin: 0,
    yMax: max,
    yTicks: hw.niceTicks(0, max / 1.08, 4),
    xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
    decimal,
  };
}

/** The data of "Try it: belief": the prior chosen, and the e-mails seen so far. */
export const BELIEF_TRY_DEFAULT = Object.freeze({ prior: 'uniform', clicks: 0, sent: 0, draws: 0 });

/** Prior, likelihood and posterior of "Try it: belief", on the grid. */
export function beliefCurves(state) {
  const [a, b] = hw.PRIORS[state.prior];
  const prior = hw.GRID.map((x) => hw.betaDensity(x, a, b));
  const finite = prior.map((v) => (Number.isFinite(v) ? v : null));
  const post = hw.betaPosterior([a, b], state.clicks, state.sent);
  const posterior = hw.GRID.map((x) => {
    const v = hw.betaDensity(x, post.a, post.b);
    return Number.isFinite(v) ? v : null;
  });
  const likelihood = state.sent > 0 ? hw.GRID.map((x) => hw.betaDensity(x, state.clicks + 1, state.sent - state.clicks + 1)) : hw.GRID.map(() => null);
  return { prior: finite, likelihood, posterior, post };
}

/** The e-mails of "+ 10 e-mails": the stream 'live', one repetition per press, at the true rate. */
export function moreEmails(draw, count = 10) {
  const next = hw.generator(hw.DEFAULT_SEED, 'live', draw);
  let clicks = 0;
  for (let i = 0; i < count; i++) clicks += hw.bernoulli(next, hw.CAMPAIGN.rate);
  return clicks;
}

/** "Try it: draw the prior": the shape of the handles and the data chosen (the first day, the first three, all ten). */
export const PRIOR_TRY_DEFAULT = Object.freeze({ shape: 'informed', data: 'day1' });
export const PRIOR_DATA = Object.freeze(['day1', 'days3', 'days10']);
export function priorData(key, seed = hw.DEFAULT_SEED) {
  const days = hw.campaign(seed);
  const take = { day1: 1, days3: 3, days10: 10 }[key];
  const chosen = days.slice(0, take);
  return { clicks: chosen.reduce((s, d) => s + d.clicks, 0), sent: chosen.reduce((s, d) => s + d.sent, 0) };
}

// ---------------------------------------------------------------------------
// 1.6 Bayes e frequentisti
// ---------------------------------------------------------------------------

/** The chart of section 1.6: the exact coverage of every method against the true rate, with the 95% line. */
export function coverageChart(cov, decimal = '.') {
  return {
    x: cov.ps,
    series: [...hw.INTERVAL_METHODS.map((m, k) => ({ values: cov.curves[m], colorIndex: [1, 3, 4, 0][k], dots: false })), { values: cov.ps.map(() => 0.95), colorIndex: 6, dashed: true }],
    yMin: 0.6,
    yMax: 1,
    yTicks: percentTicks(0.6, 1, 0.1),
    xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 1.7 e 1.8 I due filtri
// ---------------------------------------------------------------------------

/** The chart of section 1.7: the test messages by their log-odds, spam and legitimate side by side. */
export function logOddsChart(sms, decimal = '.') {
  const top = Math.max(1, ...sms.bins.flatMap((b) => [b.spam, b.ham]));
  return {
    categories: sms.bins.map((b) => (b.to === Infinity ? `≥ ${b.from}` : `${b.from}`)),
    series: [{ values: sms.bins.map((b) => b.spam), colorIndex: 1 }, { values: sms.bins.map((b) => b.ham), colorIndex: 0 }],
    yMax: top * 1.08,
    yTicks: hw.niceTicks(0, top, 5),
    decimal,
  };
}

/** The message of the field of section 1.7 as the page opens: a phishing written for the page, not in the corpus. */
export const SPAM_EXAMPLE = 'Your account has been suspended, verify your password at this link';
/** The two inboxes of the field: the share of spam of the training set, and an inbox where 1 message in 100 is spam. */
export const SPAM_BASES = Object.freeze(['train', 'one']);
export const spamPrior = (key, sms) => (key === 'one' ? Math.log(1 / 99) : sms.model.priorLogOdds);

/** The connection of section 1.8 as the page opens, as positions in the lists of the levels. */
export const KDD_TRY_DEFAULT = Object.freeze({
  protocol: hw.KDD_LEVELS.protocol.indexOf(hw.KDD_EXAMPLE.protocol),
  service: hw.KDD_LEVELS.service.indexOf(hw.KDD_EXAMPLE.service),
  flag: hw.KDD_LEVELS.flag.indexOf(hw.KDD_EXAMPLE.flag),
});

// ---------------------------------------------------------------------------
// 2.1 - 2.3 In probabilita', quasi certa, in media quadratica
// ---------------------------------------------------------------------------

/** The chart of section 2.1: at every checkpoint, the share of the 1,000 paths outside the band and its exact probability, with Chebyshev's bound. */
export function outsideChart(paths, decimal = '.') {
  const x = paths.checks.map((c) => c.n);
  return {
    x,
    logX: true,
    series: [
      { values: paths.checks.map((c) => c.outside), colorIndex: 0, dotsOnly: true },
      { values: paths.checks.map((c) => c.exactOutside), colorIndex: 1, dots: false },
      { values: x.map((n) => hw.deviationBounds(n, paths.rate, paths.epsilon).chebyshev), colorIndex: 6, dashed: true },
    ],
    yMin: 0,
    yMax: 1,
    yTicks: percentTicks(0, 1, 0.25),
    xTicks: [10, 100, 1000, 10000],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The chart of section 2.2: 20 of the paths, with the band of 1 point around 3%. */
export function pathsChart(paths, decimal = '.') {
  const x = paths.points;
  return {
    x,
    logX: true,
    series: [
      ...paths.paths.map((line) => ({ values: line, colorIndex: 0, dots: false })),
      { values: x.map(() => paths.rate + paths.epsilon), colorIndex: 1, dashed: true },
      { values: x.map(() => paths.rate - paths.epsilon), colorIndex: 1, dashed: true },
    ],
    yMin: 0,
    yMax: 0.15,
    yTicks: percentTicks(0, 0.15, 0.05),
    xTicks: [1, 10, 100, 1000, 10000],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The second chart of section 2.2: outside the band at n, against leaving it at least once more after n. */
export function afterChart(paths, decimal = '.') {
  return {
    x: paths.checks.map((c) => c.n),
    logX: true,
    series: [{ values: paths.checks.map((c) => c.outside), colorIndex: 0 }, { values: paths.checks.map((c) => c.after), colorIndex: 4 }],
    yMin: 0,
    yMax: 1,
    yTicks: percentTicks(0, 1, 0.25),
    xTicks: [10, 100, 1000, 10000],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The chart of section 2.3: the mean square error of the 1,000 estimates against p(1 - p)/n, on logarithmic axes. */
export function mseChart(paths, decimal = '.') {
  return {
    x: paths.checks.map((c) => c.n),
    logX: true,
    logY: true,
    series: [{ values: paths.checks.map((c) => c.mse), colorIndex: 0, dotsOnly: true }, { values: paths.checks.map((c) => c.exactMse), colorIndex: 1, dots: false }],
    yMin: 1e-6,
    yMax: 1e-2,
    yTicks: powers(-6, -2),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

/** The sequence of "Try it" as the page opens, and the checkpoints of its table: odd ones for (-1)^n Z, which is equal to Z at every even n. */
export const SEQUENCE_TRY_DEFAULT = Object.freeze({ key: 'bern1', draw: 0 });
export const SEQUENCE_TABLE_N = Object.freeze([10, 100, 1000, 10000]);
export const sequenceTableN = (key) => (key === 'flip' ? [11, 101, 1001, 10001] : SEQUENCE_TABLE_N);

/** The paths of a sequence as a chart: a range that fits the sequence. */
export function sequenceChart(result, decimal = '.') {
  const ranges = { mean: [-0.5, 0.5], bern1: [0, 1.1], bern2: [0, 1.1], typewriter: [0, 1.1], flip: [-3, 3] };
  const top = Math.max(10, ...result.paths.flat());
  const [yMin, yMax] = ranges[result.key] || [0, top * 1.05];
  return {
    x: result.points,
    logX: true,
    series: result.paths.map((line, k) => ({ values: line, colorIndex: k % 7, dots: result.key !== 'mean' && result.key !== 'flip' })),
    yMin,
    yMax,
    yTicks: hw.niceTicks(yMin, yMax, 5),
    xTicks: [1, 10, 100, 1000],
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 2.4 In distribuzione
// ---------------------------------------------------------------------------

/** The chart of section 2.4: the exact Kolmogorov distance from the normal law of the two sums, and their Berry-Esseen bounds, on logarithmic axes. */
export function cltChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.n),
    logX: true,
    logY: true,
    series: [
      { values: rows.map((r) => r.bernoulli), colorIndex: 1 },
      { values: rows.map((r) => r.bernoulliBound), colorIndex: 1, dashed: true },
      { values: rows.map((r) => r.exponential), colorIndex: 0 },
      { values: rows.map((r) => r.exponentialBound), colorIndex: 0, dashed: true },
    ],
    yMin: 1e-3,
    yMax: 1,
    yTicks: powers(-3, 0),
    xTicks: [1, 10, 100, 1000],
    decimal,
  };
}

/** "Try it: CLT": the law, n, and the batch of sums (stream 'live', repetitions from 10^6 up). */
export const CLT_TRY_DEFAULT = Object.freeze({ law: 'exponential', n: 5, draw: 0 });
export const CLT_TRY_SIZES = Object.freeze([1, 2, 5, 10, 30, 100]);
export const CLT_TRY_REPS = 5000;

/** The sums of "Try it", their histogram against the limit density, and the test of Kolmogorov-Smirnov. */
export function cltTry(state, decimal = '.') {
  const values = hw.standardizedSums(state.law, state.n, CLT_TRY_REPS, hw.DEFAULT_SEED, { stream: 'live', offset: 1000000 + state.draw * CLT_TRY_REPS });
  const cauchy = state.law === 'cauchy';
  const h = hw.histogram(values, -4, 4, 40);
  const density = cauchy ? (x) => 1 / (Math.PI * (1 + x * x)) : hw.phi;
  const curve = Array.from({ length: 161 }, (_, i) => {
    const x = -4 + i * 0.05;
    return [x, density(x)];
  });
  const test = hw.ksTest(values, cauchy ? hw.cauchyCdf : hw.normalCdf);
  return {
    chart: { x0: -4, x1: 4, bars: h.bars, curve, xTicks: [-4, -2, 0, 2, 4], decimal },
    outside: h.outside,
    test,
    cauchy,
  };
}

/** "Try it: hash collisions": the size of the identifiers, how many of them (as a multiple of the median), the trials run. */
export const HASH_TRY_DEFAULT = Object.freeze({ bits: 16, factor: 1, trials: 0, hits: 0, history: Object.freeze([]) });
export const HASH_FACTORS = Object.freeze([0.5, 1, 2]);
/** The number of identifiers of "Try it": a multiple of the median, rounded. */
export const hashCount = (bits, factor) => Math.max(2, Math.round(hw.collisionMedian(bits) * factor));

/** The chart of "Try it: hash": the estimate after every batch of trials against the exact probability, with the band of the CLT around it. */
export function hashChart(state, exact, decimal = '.') {
  const points = state.history.length ? state.history : [{ trials: 1, hits: 0 }];
  const x = points.map((h) => h.trials);
  return {
    x,
    logX: true,
    series: [
      { values: points.map((h) => (state.history.length ? h.hits / h.trials : null)), colorIndex: 0 },
      { values: x.map(() => exact), band: x.map((r) => [Math.max(0, exact - 1.96 * Math.sqrt((exact * (1 - exact)) / r)), Math.min(1, exact + 1.96 * Math.sqrt((exact * (1 - exact)) / r))]), colorIndex: 1, dashed: true },
    ],
    yMin: 0,
    yMax: 1,
    yTicks: percentTicks(0, 1, 0.25),
    xTicks: powers(0, Math.max(1, Math.ceil(Math.log10(Math.max(10, x[x.length - 1]))))),
    yFormat: pctLabel(decimal),
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 2.6 - 2.8 Code pesanti, velocita', il posterior che converge
// ---------------------------------------------------------------------------

/** The chart of section 2.6: eight running means of Cauchy values, which never settle. */
export function cauchyChart(paths, decimal = '.') {
  return {
    x: hw.PATH_POINTS,
    logX: true,
    series: paths.map((line, k) => ({ values: line, colorIndex: k % 7, dots: false })),
    yMin: -6,
    yMax: 6,
    yTicks: [-6, -3, 0, 3, 6],
    xTicks: [1, 10, 100, 1000, 10000],
    decimal,
  };
}

/** The histogram of the standardized means of 1,000 connections against the normal density. */
export function bytesChart(b, decimal = '.') {
  const curve = Array.from({ length: 241 }, (_, i) => {
    const x = -3 + i * 0.05;
    return [x, hw.phi(x)];
  });
  return { x0: -3, x1: 9, bars: b.histogram.bars, curve, xTicks: [-3, 0, 3, 6, 9], decimal };
}

/** The chart of section 2.7: the exact probability of a deviation, the two bounds and the normal approximation, on logarithmic axes. */
export function speedChart(rows, decimal = '.') {
  const clip = (v) => Math.max(1e-12, v);
  return {
    x: rows.map((r) => r.n),
    logX: true,
    logY: true,
    series: [
      { values: rows.map((r) => clip(r.exact)), colorIndex: 1 },
      { values: rows.map((r) => r.chebyshev), colorIndex: 6, dashed: true },
      { values: rows.map((r) => r.hoeffding), colorIndex: 4, dashed: true },
      { values: rows.map((r) => clip(r.normal)), colorIndex: 0, dotted: true },
    ],
    yMin: 1e-12,
    yMax: 1,
    yTicks: [1e-12, 1e-9, 1e-6, 1e-3, 1],
    xTicks: [10, 100, 1000, 10000, 100000],
    decimal,
  };
}

/** The first chart of section 2.8: the posterior mean of the two analysts against the number of e-mails, with the true rate. */
export function bvmChart(rows, decimal = '.') {
  const x = rows.map((r) => r.n);
  return {
    x,
    logX: true,
    series: [
      { values: rows.map((r) => r.uniform.mean), band: rows.map((r) => [r.uniform.mean - 1.96 * r.uniform.sd, r.uniform.mean + 1.96 * r.uniform.sd]), colorIndex: 0 },
      { values: rows.map((r) => r.wrong.mean), band: rows.map((r) => [r.wrong.mean - 1.96 * r.wrong.sd, r.wrong.mean + 1.96 * r.wrong.sd]), colorIndex: 1 },
      { values: x.map(() => hw.BVM.rate), colorIndex: 6, dashed: true },
    ],
    yMin: 0,
    yMax: 0.5,
    yTicks: percentTicks(0, 0.5, 0.1),
    xTicks: [10, 100, 1000, 10000],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The second chart of section 2.8: the distance of each posterior from its normal approximation, on logarithmic axes. */
export function bvmDistanceChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.n),
    logX: true,
    logY: true,
    series: [{ values: rows.map((r) => r.uniform.distance), colorIndex: 0 }, { values: rows.map((r) => r.wrong.distance), colorIndex: 1 }],
    yMin: 1e-3,
    yMax: 1,
    yTicks: powers(-3, 0),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 1.7 - 1.9 Altri risultati, radice di n, la dipendenza
// ---------------------------------------------------------------------------

/** The rows of section 1.7: for every n, the exact distance from the normal law of Z (sigma known), of the t statistic (sigma estimated) and of the MLE of an exponential rate. */
export const resultsRows = () => hw.RESULT_SIZES.map((n) => ({ n, z: hw.ksExactBernoulli(n), t: hw.ksExactT(n), mle: hw.mleRate(n) }));

/** The chart of section 1.7: the three distances on logarithmic axes. */
export function resultsChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.n),
    logX: true,
    logY: true,
    series: [{ values: rows.map((r) => r.z), colorIndex: 0 }, { values: rows.map((r) => r.t), colorIndex: 1 }, { values: rows.map((r) => r.mle.distance), colorIndex: 2 }],
    yMin: 1e-3,
    yMax: 1,
    yTicks: powers(-3, 0),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

/** The chart of section 1.8: the spread of the count grows as sqrt(n), the one of the share falls as 1/sqrt(n); simulated (from the 1,000 paths) and exact. */
export function rootChart(paths, decimal = '.') {
  const sigma = Math.sqrt(paths.rate * (1 - paths.rate));
  const x = paths.checks.map((c) => c.n);
  return {
    x,
    logX: true,
    logY: true,
    series: [
      { values: paths.checks.map((c) => c.n * Math.sqrt(c.mse)), colorIndex: 0, dotsOnly: true },
      { values: x.map((n) => sigma * Math.sqrt(n)), colorIndex: 0, dots: false },
      { values: paths.checks.map((c) => Math.sqrt(c.mse)), colorIndex: 1, dotsOnly: true },
      { values: x.map((n) => sigma / Math.sqrt(n)), colorIndex: 1, dots: false },
    ],
    yMin: 1e-3,
    yMax: 100,
    yTicks: powers(-3, 2),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

/** "Try it: the right scale": alpha as the page opens (1/2, the scale of the central limit). */
export const SCALE_TRY_DEFAULT = Object.freeze({ alpha: hw.SCALE_ALPHAS.indexOf(0.5) });

/** The histograms of n^alpha (mean - 1) for the three sizes, on the same axis, against the normal density of the limit at alpha = 1/2. */
export function scaleCharts(samples, alpha, decimal = '.') {
  const curve = Array.from({ length: 161 }, (_, i) => {
    const x = -4 + i * 0.05;
    return [x, hw.phi(x)];
  });
  return samples.map(({ n, values }) => {
    const factor = n ** (alpha - 0.5);
    const scaled = Array.from(values, (v) => v * factor);
    const h = hw.histogram(scaled, -4, 4, 40);
    return { n, factor, outside: h.outside, chart: { x0: -4, x1: 4, bars: h.bars, curve, yMax: 1, xTicks: [-4, -2, 0, 2, 4], decimal } };
  });
}

/** "Try it: bursts": the correlation as the page opens (0.5). */
export const BURST_TRY_DEFAULT = Object.freeze({ rho: hw.BURST_RHOS.indexOf(0.5) });
export const BURST_N = Object.freeze([10, 30, 100, 300, 1000, 3000, 10000]);
/** The connections drawn in the two strips of "Try it": 400, 12 alarms on average. */
export const BURST_STRIP = 400;

/** The chart of the bursts: the exact standard error of the share of alarms, independent and with correlation rho. */
export function burstChart(rho, decimal = '.') {
  const p = hw.FALSE_ALARMS.rate;
  return {
    x: BURST_N,
    logX: true,
    logY: true,
    series: [
      { values: BURST_N.map((n) => Math.sqrt((p * (1 - p)) / n)), colorIndex: 0 },
      { values: BURST_N.map((n) => Math.sqrt(hw.burstVariance(n, p, rho)) / n), colorIndex: 1 },
    ],
    yMin: 1e-3,
    yMax: 1,
    yTicks: powers(-3, 0),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 2.1 e 2.2 La probabilita' condizionata e la verosimiglianza
// ---------------------------------------------------------------------------

/** "Try it: p-value": the indices of the sliders as the page opens. */
export const DISCOVERY_TRY_DEFAULT = Object.freeze({
  real: hw.DISCOVERY_REALS.indexOf(hw.DISCOVERY_DEFAULT.real),
  power: hw.DISCOVERY_POWERS.indexOf(hw.DISCOVERY_DEFAULT.power),
  alpha: hw.DISCOVERY_ALPHAS.indexOf(hw.DISCOVERY_DEFAULT.alpha),
});
export const DISCOVERY_CATEGORIES = Object.freeze(['trueDiscovery', 'missedEffect', 'falseDiscovery', 'trueNull']);
const DISCOVERY_COLORS = Object.freeze([2, 4, 1, 6]);
/** The picture of the 1,000 tests. */
export const discoveryIcons = (facts) => ({ counts: facts.counts, total: facts.total, columns: 50, colors: DISCOVERY_COLORS, faint: [3] });

/** The likelihood of the share of clicks after the first day and after ten days, scaled to a maximum of 1. */
export function likelihoodChart(seed = hw.DEFAULT_SEED, decimal = '.') {
  const day1 = priorData('day1', seed);
  const days10 = priorData('days10', seed);
  const a = hw.likelihoodCurve(day1.clicks, day1.sent);
  const b = hw.likelihoodCurve(days10.clicks, days10.sent);
  return {
    curves: { day1: a, days10: b, data: { day1, days10 } },
    chart: {
      x: hw.GRID,
      series: [{ values: a.values, colorIndex: 3, dots: false }, { values: b.values, colorIndex: 0, dots: false }],
      yMin: 0,
      yMax: 1.05,
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
      decimal,
    },
  };
}

// ---------------------------------------------------------------------------
// Legende, etichette sotto il puntatore e tabelle legate
// ---------------------------------------------------------------------------

/** The legends of the charts: { label, color | paletteKey, dashed?, box?, parts } for every item (ChartLegend.jsx). */
export const legends = {
  alarm: (L) => ALARM_CATEGORIES.map((c, k) => ({ label: L[c], color: ALARM_COLORS[k], box: true, parts: [`cat:${k}`] })),
  network: (L) => hw.HIDDEN.map((node, k) => ({ label: L[node], color: [0, 1, 4][k], box: true, parts: [`series:${k}`] })),
  sprt: (L, walks) => [
    ...walks.map((w, k) => ({ label: L[w.key], color: w.color ?? k, parts: [`series:${k}`] })),
    { label: L.block, color: 1, dashed: true, parts: [`series:${walks.length}`] },
    { label: L.clear, color: 2, dashed: true, parts: [`series:${walks.length + 1}`] },
  ],
  campaign: (L) => [
    { label: L.uniformPrior, color: 0, parts: ['series:0'] },
    { label: L.informedPrior, color: 1, parts: ['series:1'] },
    { label: L.trueRate, color: 6, dashed: true, parts: ['series:2'] },
  ],
  density: (L) => [
    { label: L.prior, color: 6, dashed: true, parts: ['series:0'] },
    { label: L.likelihood, color: 3, dashed: true, parts: ['series:1'] },
    { label: L.posterior, color: 0, parts: ['series:2'] },
  ],
  coverage: (L) => [...hw.INTERVAL_METHODS.map((m, k) => ({ label: L[m], color: [1, 3, 4, 0][k], parts: [`series:${k}`] })), { label: L.nominal, color: 6, dashed: true, parts: ['series:4'] }],
  logOdds: (L) => [
    { label: L.spam, color: 1, box: true, parts: ['series:0'] },
    { label: L.ham, color: 0, box: true, parts: ['series:1'] },
  ],
  outside: (L) => [
    { label: L.simulated, color: 0, box: true, parts: ['series:0'] },
    { label: L.exact, color: 1, parts: ['series:1'] },
    { label: L.chebyshev, color: 6, dashed: true, parts: ['series:2'] },
  ],
  paths: (L) => [
    { label: L.paths, color: 0, parts: Array.from({ length: hw.PATHS.shown }, (_, k) => `series:${k}`) },
    { label: L.band, color: 1, dashed: true, parts: [`series:${hw.PATHS.shown}`, `series:${hw.PATHS.shown + 1}`] },
  ],
  after: (L) => [
    { label: L.outsideAt, color: 0, parts: ['series:0'] },
    { label: L.outsideAfter, color: 4, parts: ['series:1'] },
  ],
  mse: (L) => [
    { label: L.simulatedMse, color: 0, box: true, parts: ['series:0'] },
    { label: L.exactMse, color: 1, parts: ['series:1'] },
  ],
  clt: (L) => [
    { label: L.bernoulli, color: 1, parts: ['series:0'] },
    { label: L.bernoulliBound, color: 1, dashed: true, parts: ['series:1'] },
    { label: L.exponential, color: 0, parts: ['series:2'] },
    { label: L.exponentialBound, color: 0, dashed: true, parts: ['series:3'] },
  ],
  cltTry: (L, cauchy) => [
    { label: L.sums, color: 0, box: true, parts: ['bars'] },
    { label: cauchy ? L.cauchyDensity : L.normalDensity, color: 2, parts: ['curve'] },
  ],
  hash: (L) => [
    { label: L.estimate, color: 0, parts: ['series:0'] },
    { label: L.exactBand, color: 1, dashed: true, parts: ['series:1'] },
  ],
  bytes: (L) => [
    { label: L.means, color: 0, box: true, parts: ['bars'] },
    { label: L.normalDensity, color: 2, parts: ['curve'] },
  ],
  speed: (L) => [
    { label: L.exact, color: 1, parts: ['series:0'] },
    { label: L.chebyshev, color: 6, dashed: true, parts: ['series:1'] },
    { label: L.hoeffding, color: 4, dashed: true, parts: ['series:2'] },
    { label: L.normal, color: 0, dashed: true, parts: ['series:3'] },
  ],
  bvm: (L) => [
    { label: L.uniformPrior, color: 0, parts: ['series:0'] },
    { label: L.wrongPrior, color: 1, parts: ['series:1'] },
    { label: L.trueRate, color: 6, dashed: true, parts: ['series:2'] },
  ],
  bvmDistance: (L) => [
    { label: L.uniformPrior, color: 0, parts: ['series:0'] },
    { label: L.wrongPrior, color: 1, parts: ['series:1'] },
  ],
  results: (L) => [
    { label: L.zKnown, color: 0, parts: ['series:0'] },
    { label: L.tEstimated, color: 1, parts: ['series:1'] },
    { label: L.mle, color: 2, parts: ['series:2'] },
  ],
  root: (L) => [
    { label: L.countSpread, color: 0, parts: ['series:0', 'series:1'] },
    { label: L.shareSpread, color: 1, parts: ['series:2', 'series:3'] },
  ],
  scale: (L) => [
    { label: L.scaled, color: 0, box: true, parts: ['bars'] },
    { label: L.normalDensity, color: 2, parts: ['curve'] },
  ],
  burst: (L) => [
    { label: L.independent, color: 0, parts: ['series:0'] },
    { label: L.correlated, color: 1, parts: ['series:1'] },
  ],
  discovery: (L) => DISCOVERY_CATEGORIES.map((c, k) => ({ label: L[c], color: DISCOVERY_COLORS[k], box: true, parts: [`cat:${k}`] })),
  likelihood: (L) => [
    { label: L.day1, color: 3, parts: ['series:0'] },
    { label: L.days10, color: 0, parts: ['series:1'] },
  ],
};

const seriesOn = (hidden, i) => !hidden.includes(`series:${i}`);
/** A value when its part is on screen, null otherwise: the label leaves out what the legend hides. */
const shown = (hidden, i, v) => (seriesOn(hidden, i) ? v : null);

/** The labels under the pointer, one factory per chart: (hit, hidden) => text, leaving out the hidden parts. */
export const tips = {
  alarm: (facts, T) => (hit) => T.alarm(hit.index, facts.counts[hit.index], facts.counts[hit.index] / facts.population),
  network: (rows, T) => (hit, hidden = []) => T.network(hit.index, hw.HIDDEN.map((node, k) => shown(hidden, k, rows[hit.index][node]))),
  sprt: (setup, walks, T) => (hit, hidden = []) => T.sprt(hit.index, walks.map((w, k) => shown(hidden, k, hit.index < w.llr.length ? w.llr[hit.index] : null)), seriesOn(hidden, walks.length) ? setup.upper : null, seriesOn(hidden, walks.length + 1) ? setup.lower : null, walks.map((w) => w.key)),
  campaign: (c, T) => (hit, hidden = []) => T.campaign(c.uniform[hit.index], shown(hidden, 0, c.uniform[hit.index]), shown(hidden, 1, c.informed[hit.index]), seriesOn(hidden, 2)),
  density: (curves, T) => (hit, hidden = []) => T.density(hw.GRID[hit.index], shown(hidden, 0, curves.prior[hit.index]), shown(hidden, 1, curves.likelihood[hit.index]), shown(hidden, 2, curves.posterior[hit.index])),
  coverage: (cov, T) => (hit, hidden = []) => T.coverage(cov.ps[hit.index], hw.INTERVAL_METHODS.map((m, k) => shown(hidden, k, cov.curves[m][hit.index]))),
  logOdds: (sms, T) => (hit, hidden = []) => T.logOdds(sms.bins[hit.index], shown(hidden, 0, sms.bins[hit.index].spam), shown(hidden, 1, sms.bins[hit.index].ham)),
  outside: (paths, T) => (hit, hidden = []) => {
    const c = paths.checks[hit.index];
    return T.outside(c.n, shown(hidden, 0, c.outside), shown(hidden, 1, c.exactOutside), shown(hidden, 2, hw.deviationBounds(c.n, paths.rate, paths.epsilon).chebyshev));
  },
  paths: (paths, T) => (hit, hidden = []) => {
    if (!seriesOn(hidden, 0)) return null;
    const values = paths.paths.map((line) => line[hit.index]);
    return T.paths(paths.points[hit.index], Math.min(...values), Math.max(...values), values.filter((v) => Math.abs(v - paths.rate) > paths.epsilon).length, values.length);
  },
  after: (paths, T) => (hit, hidden = []) => {
    const c = paths.checks[hit.index];
    return T.after(c.n, shown(hidden, 0, c.outside), shown(hidden, 1, c.after));
  },
  mse: (paths, T) => (hit, hidden = []) => {
    const c = paths.checks[hit.index];
    return T.mse(c.n, shown(hidden, 0, c.mse), shown(hidden, 1, c.exactMse));
  },
  sequence: (result, T) => (hit) => T.sequence(result.points[hit.index], result.paths.map((line) => line[hit.index])),
  clt: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.clt(r.n, [shown(hidden, 0, r.bernoulli), shown(hidden, 1, r.bernoulliBound), shown(hidden, 2, r.exponential), shown(hidden, 3, r.exponentialBound)]);
  },
  histogram: (chart, T, reps) => (hit) => {
    const b = chart.bars[hit.index];
    return b ? T.histogram(b.from, b.to, b.count, b.count / reps) : null;
  },
  hash: (state, exact, T) => (hit, hidden = []) => {
    const h = state.history[hit.index];
    if (!h) return null;
    return T.hash(h.trials, shown(hidden, 0, h.hits / h.trials), shown(hidden, 1, exact));
  },
  cauchy: (paths, T) => (hit) => {
    const values = paths.map((line) => line[hit.index]);
    return T.cauchy(hw.PATH_POINTS[hit.index], Math.min(...values), Math.max(...values));
  },
  speed: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.speed(r.n, [shown(hidden, 0, r.exact), shown(hidden, 1, r.chebyshev), shown(hidden, 2, r.hoeffding), shown(hidden, 3, r.normal)]);
  },
  bvm: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.bvm(r.n, r.clicks, shown(hidden, 0, r.uniform), shown(hidden, 1, r.wrong), seriesOn(hidden, 2));
  },
  bvmDistance: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.bvmDistance(r.n, shown(hidden, 0, r.uniform.distance), shown(hidden, 1, r.wrong.distance));
  },
  results: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.results(r.n, shown(hidden, 0, r.z), shown(hidden, 1, r.t), shown(hidden, 2, r.mle.distance));
  },
  root: (paths, T) => (hit, hidden = []) => {
    const c = paths.checks[hit.index];
    const sigma = Math.sqrt(paths.rate * (1 - paths.rate));
    return T.root(c.n, seriesOn(hidden, 0) ? [c.n * Math.sqrt(c.mse), sigma * Math.sqrt(c.n)] : null, seriesOn(hidden, 2) ? [Math.sqrt(c.mse), sigma / Math.sqrt(c.n)] : null);
  },
  burst: (rho, T) => (hit, hidden = []) => {
    const n = BURST_N[hit.index];
    const p = hw.FALSE_ALARMS.rate;
    return T.burst(n, shown(hidden, 0, Math.sqrt((p * (1 - p)) / n)), shown(hidden, 1, Math.sqrt(hw.burstVariance(n, p, rho)) / n));
  },
  discovery: (facts, T) => (hit) => T.discovery(hit.index, facts.counts[hit.index]),
  likelihood: (curves, T) => (hit, hidden = []) => T.likelihood(hw.GRID[hit.index], shown(hidden, 0, curves.day1.values[hit.index]), shown(hidden, 1, curves.days10.values[hit.index])),
};

/** The id of every table tied to a chart: the page and the program find it by id. */
export const LINKED_TABLES = Object.freeze({
  alarm: 'hw7-alarm-table',
  network: 'hw7-network-table',
  campaign: 'hw7-campaign-table',
  logOdds: 'hw7-logodds-table',
  outside: 'hw7-outside-table',
  after: 'hw7-after-table',
  mse: 'hw7-mse-table',
  clt: 'hw7-clt-table',
  speed: 'hw7-speed-table',
  bvm: 'hw7-bvm-table',
  results: 'hw7-results-table',
  root: 'hw7-root-table',
  discovery: 'hw7-discovery-table',
});

const tableById = (id) => () => document.getElementById(id);
// one row per bar, point or category of the chart, in the same order
const rowPerPoint = (id) => Object.freeze({ table: tableById(id), row: (hit) => hit.index, point: (row) => row });

export const links = Object.fromEntries(Object.entries(LINKED_TABLES).map(([key, id]) => [key, rowPerPoint(id)]));
// the two charts of section 2.8 mark the same table
links.bvmDistance = links.bvm;

// ---------------------------------------------------------------------------
// Il riepilogo dei test
// ---------------------------------------------------------------------------

const verdictOf = (p) => (p < hw.SIGNIFICANCE ? 'reject' : 'accept');

/**
 * The rows of the summary of the tests, from the results of the
 * computations (s, null while they run) and the two filters: { key, stat:
 * [name, value], p, log10p, verdict, expected } or { key, pending, expected }.
 */
export function testRows(s, sms, kdd) {
  const wait = (key, expected) => ({ key, pending: true, expected });
  const ks = (key, t, expected) => ({ key, stat: ['D', t.D], p: t.p, log10p: t.log10p, verdict: verdictOf(t.p), expected });
  const binomial = (key, t, expected) => ({ key, stat: ['k', t.k], p: t.p, log10p: t.log10p, verdict: verdictOf(t.p), expected, extra: t });
  const mcnemar = (key, m) => ({ key, stat: ['b/c', `${m.b}/${m.c}`], p: m.p, log10p: m.log10p, verdict: m.log10p < Math.log10(hw.SIGNIFICANCE) ? 'reject' : 'accept', expected: 'reject' });
  if (!s) {
    return [
      wait('generator', 'accept'),
      wait('cltExponential', 'reject'), wait('cltUniform', 'accept'), wait('cltCauchy', 'accept'), wait('hash', 'accept'), wait('gc', 'accept'), wait('bytes', 'reject'),
      wait('sprtLegit', 'accept'), wait('sprtAttacker', 'accept'), wait('coverage', 'accept'),
      mcnemar('smsFilter', sms.mcnemar), mcnemar('kddFilter', kdd.mcnemar),
    ];
  }
  const g = s.generator;
  return [
    { key: 'generator', stat: ['z', g.z], p: g.p, log10p: Math.log10(g.p), verdict: g.verdict, expected: 'accept' },
    // part 1: the forms of convergence
    ks('cltExponential', s.clt.exponential, 'reject'),
    ks('cltUniform', s.clt.uniform, 'accept'),
    ks('cltCauchy', s.clt.cauchy, 'accept'),
    binomial('hash', s.hash.test, 'accept'),
    ks('gc', s.gc.test, 'accept'),
    ks('bytes', s.bytes[s.bytes.length - 1], 'reject'),
    // part 2: Bayes
    binomial('sprtLegit', s.sprt.testLegit, 'accept'),
    binomial('sprtAttacker', s.sprt.testAttacker, 'accept'),
    binomial('coverage', s.coverage.test, 'accept'),
    mcnemar('smsFilter', sms.mcnemar),
    mcnemar('kddFilter', kdd.mcnemar),
  ];
}

/** The cells of a row of the summary, in the language of `text`. */
export function testCells(r, text) {
  const T = text.tests;
  const F = text.fmt;
  const d = T.rows[r.key];
  const statistic = () => {
    const [name, value] = r.stat;
    if (typeof value === 'string') return `${T.statNames[name]} = ${value}`;
    if (name === 'k') return `${T.statNames.k} = ${F.int(value)}`;
    return `${T.statNames[name]} = ${F.num(value, name === 'D' ? 4 : 3)}`;
  };
  return {
    subject: d.subject,
    hypothesis: d.hypothesis,
    statistic: r.pending ? '-' : statistic(),
    p: r.pending ? '-' : F.p(r.p, r.log10p),
    verdict: r.pending ? T.pending : T.verdicts[r.verdict === 'reject' ? 'reject' : 'accept'],
    expected: T.expected[r.expected],
    rejected: r.verdict === 'reject',
  };
}

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
