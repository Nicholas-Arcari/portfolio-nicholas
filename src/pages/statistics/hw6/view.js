// src/pages/statistics/hw6/view.js
// La logica di presentazione dell'Homework #6, comune alla pagina del sito e
// al programma scaricabile: le sezioni e il loro indice, i nomi dei livelli,
// i dati dei grafici, le legende a pulsanti, le etichette sotto il puntatore
// e i legami fra grafici e tabelle. I calcoli sono in homework6.js, le
// parole in texts.js.
import * as hw from './homework6.js';

/** The sections of the page, in order, with the level of their title: the index of the page and of the program is built from here. */
export const SECTIONS = [
  { id: 'hw6-assignment', key: 'assignment', level: 0 },
  { id: 'hw6-task', key: 'task', level: 0 },
  { id: 'hw6-dataset', key: 'dataset', level: 1 },
  { id: 'hw6-table', key: 'table', level: 1 },
  { id: 'hw6-frequencies', key: 'frequencies', level: 1 },
  { id: 'hw6-expected', key: 'expected', level: 1 },
  { id: 'hw6-chi2', key: 'chi2', level: 1 },
  { id: 'hw6-try-table', key: 'tryTable', level: 2 },
  { id: 'hw6-gtest', key: 'gtest', level: 1 },
  { id: 'hw6-small', key: 'small', level: 1 },
  { id: 'hw6-permutation', key: 'permutation', level: 1 },
  { id: 'hw6-try-permutation', key: 'tryPermutation', level: 2 },
  { id: 'hw6-checks', key: 'checks', level: 1 },
  { id: 'hw6-theory', key: 'theory', level: 0 },
  { id: 'hw6-interpretation', key: 'interpretation', level: 0 },
  { id: 'hw6-decision', key: 'decision', level: 1 },
  { id: 'hw6-residuals', key: 'residuals', level: 1 },
  { id: 'hw6-strength', key: 'strength', level: 1 },
  { id: 'hw6-try-dependence', key: 'tryDependence', level: 2 },
  { id: 'hw6-pairs', key: 'pairs', level: 1 },
  { id: 'hw6-causality', key: 'causality', level: 0 },
  { id: 'hw6-simpson', key: 'simpson', level: 1 },
  { id: 'hw6-try-simpson', key: 'trySimpson', level: 2 },
  { id: 'hw6-security', key: 'security', level: 1 },
  { id: 'hw6-tests', key: 'tests', level: 0 },
  { id: 'hw6-history', key: 'history', level: 0 },
  { id: 'hw6-conclusion', key: 'conclusion', level: 0 },
];

/** The entries of the index: the sections with their titles in the current language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

/** The name of a level in the current language: the texts name the classes, the outcomes and the merged levels; the data name the rest. */
export function levelName(variable, key, text) {
  if (key === hw.OTHERS) return variable === 'service' ? text.names.otherServices : text.names.others;
  if (variable === 'class') return text.names.classes[key];
  if (variable === 'outcome') return text.names.outcomes[key];
  if (variable === 'protocol') return key.toUpperCase();
  return key;
}

/** The names of the levels of the two variables of a pair (hw.pairCodes or hw.nslTable). */
export const pairNames = (pair, text) => ({
  x: pair.xLevels.map((k) => levelName(pair.xVar, k, text)),
  f: pair.fLevels.map((k) => levelName(pair.fVar, k, text)),
});

/** The rows and columns of a table that take part in the test (an empty one does not). */
export const used = (s) => ({ rows: s.rows, cols: s.cols });

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

/** The class of a cell from its adjusted residual: beyond 1.96, 2.58 and 3.29 it differs from independence at 5%, 1% and 0.1%. */
export function residualClass(z) {
  if (z === null || !Number.isFinite(z)) return '';
  const a = Math.abs(z);
  let level = 0;
  if (a >= 3.29) level = 3;
  else if (a >= 2.58) level = 2;
  else if (a >= 1.96) level = 1;
  if (level === 0) return 'hw6-res-0';
  return `hw6-res-${z > 0 ? 'p' : 'n'}${level}`;
}

/** The cells with the largest adjusted residuals, above and below independence: what the interpretation names. */
export function strongestCells(s, count = 3) {
  const cells = [];
  for (const i of s.rows) for (const j of s.cols) if (s.adjusted[i][j] !== null) cells.push({ i, j, z: s.adjusted[i][j], o: s.counts[i][j], e: s.expected[i][j] });
  const above = cells.filter((c) => c.z >= 1.96).sort((p, q) => q.z - p.z).slice(0, count);
  const below = cells.filter((c) => c.z <= -1.96).sort((p, q) => p.z - q.z).slice(0, count);
  return { above, below, total: cells.length, significant: cells.filter((c) => Math.abs(c.z) >= 1.96).length };
}

/** The cell farthest from independence: the largest adjusted residual in absolute value (section 1.4 names it, and opens its chart on its row). */
export function extremeCell(s) {
  let best = null;
  for (const i of s.rows) {
    for (const j of s.cols) {
      const z = s.adjusted[i][j];
      if (z !== null && (!best || Math.abs(z) > Math.abs(best.z))) best = { i, j, z, o: s.counts[i][j], e: s.expected[i][j] };
    }
  }
  return best;
}

/**
 * The level of X whose distribution of F is farthest from the marginal one,
 * and the level of F where the gap is largest: what section 1.3 reads from
 * the bars. Only the levels of X with at least 1% of the records (or 30 of
 * them) count, so a level of a few records cannot win with a share of 100%.
 */
export function profileGap(s) {
  const big = s.rows.filter((i) => s.rowTotals[i] >= Math.max(30, 0.01 * s.N));
  let best = null;
  for (const i of big.length ? big : s.rows) {
    for (const j of s.cols) {
      const gap = Math.abs(s.rowProfiles[i][j] - s.colShares[j]);
      if (!best || gap > best.gap) best = { i, j, gap, share: s.rowProfiles[i][j], marginal: s.colShares[j] };
    }
  }
  return best;
}

/** The pairs of section 3.4 with the most associated one that is not a function of the other (V below 1). */
export function pairsFacts(pairs) {
  return { top: pairs.find((p) => p.V < 0.999999) || pairs[0] };
}

/**
 * The sample of "Try it" in 1.8: n connections drawn from the stream
 * 'sample' (repetition draw), with the two variables of the pair chosen in
 * 1.1 (hw.pairCodes) and their table.
 */
export function permutationSample(codes, n, draw) {
  const idx = hw.sampleIndices(n, hw.DEFAULT_SEED, draw);
  const x = Uint8Array.from(idx, (k) => codes.x[k]);
  const f = Uint8Array.from(idx, (k) => codes.f[k]);
  const r = codes.xLevels.length;
  const c = codes.fLevels.length;
  return { x, f, r, c, s: hw.tableStats(hw.contingency(x, f, r, c)) };
}

/** How many shuffles the permutation test makes at every frame: about 48 frames in all, so the histogram grows under the eyes; all at once for whoever asked for less motion. */
export const permutationSlice = (B, reduced) => (reduced ? B : Math.max(10, Math.round(B / 48)));

/** The facts of Berkeley that sections 4.1 and 7 cite. */
export function berkeleyFacts() {
  const all = hw.tableStats(hw.ucbTable());
  const rows = simpsonRows();
  const total = rows[rows.length - 1];
  return {
    menRate: total.menRate,
    womenRate: total.womenRate,
    chi2: all.chi2,
    p: all.p,
    log10p: all.log10p,
    womenAhead: rows.slice(0, -1).filter((r) => r.womenRate > r.menRate).length,
    cmh: hw.cmhTest(hw.UCB.departments.map((_, d) => hw.ucbTable(d))),
  };
}

/**
 * The rows of the summary of the tests (section 5): what is tested, the
 * statistic, the p-value, the verdict at 5% and what was expected. `s` is
 * the table of section 1, `perm` the permutation test (null until it has
 * run), `small` the 2 x 2 table of the sample of 1.7 (Fisher's test works
 * also with an empty row), `dependence` the simulated log of 3.3 with its
 * theta.
 */
export function testRows({ s, perm, small, dependence, theta }) {
  const verdict = (p) => (p < hw.SIGNIFICANCE ? 'reject' : 'accept');
  const fisher = hw.fisherExact(small);
  const smallN = small[0][0] + small[0][1] + small[1][0] + small[1][1];
  const berkeley = hw.tableStats(hw.ucbTable());
  const cmh = hw.cmhTest(hw.UCB.departments.map((_, d) => hw.ucbTable(d)));
  const rows = [
    { key: 'chi2', stat: ['χ²', s.chi2], p: s.p, log10p: s.log10p, verdict: s.testable ? verdict(s.p) : null, expected: 'reject' },
    { key: 'g', stat: ['G', s.G], p: s.gP, log10p: s.gLog10p, verdict: s.testable ? verdict(s.gP) : null, expected: 'reject' },
    perm ? { key: 'permutation', stat: ['χ²', perm.observed], p: perm.pPerm, log10p: Math.log10(perm.pPerm), verdict: verdict(perm.pPerm), expected: 'depends', n: perm.n } : { key: 'permutation', pending: true, expected: 'depends' },
    { key: 'fisher', stat: ['OR', fisher.oddsRatio], p: fisher.p, log10p: Math.log10(fisher.p), verdict: verdict(fisher.p), expected: 'depends', n: smallN },
    { key: 'dependence', stat: ['χ²', dependence.chi2], p: dependence.p, log10p: dependence.log10p, verdict: verdict(dependence.p), expected: 'theta', theta },
    { key: 'berkeley', stat: ['χ²', berkeley.chi2], p: berkeley.p, log10p: berkeley.log10p, verdict: verdict(berkeley.p), expected: 'reject' },
    { key: 'cmh', stat: ['CMH', cmh.statistic], p: cmh.p, log10p: cmh.log10p, verdict: verdict(cmh.p), expected: 'accept' },
  ];
  return rows;
}

/** How many records of every label use every protocol: the facts behind the reading of protocol x class in section 3.2. */
export function labelProtocols() {
  const c = hw.nslColumns();
  const out = {};
  for (let i = 0; i < c.n; i++) {
    const label = hw.nslLabel(c.label[i]);
    const protocol = hw.PROTOCOL_NAMES[c.protocol[i]];
    if (!out[label]) out[label] = { tcp: 0, udp: 0, icmp: 0 };
    out[label][protocol]++;
  }
  return out;
}

/** Nice ticks from 0 to a top, and the top itself. */
function scale(top) {
  const ticks = hw.niceTicks(0, top, 4);
  const yMax = Math.max(top, ticks[ticks.length - 1]);
  return { ticks, yMax };
}

/**
 * The words of a row of the summary of the tests (view.testRows) in the
 * language of `text`: what is checked, the null hypothesis, the statistic,
 * the p-value, the verdict and what was expected. `pair` names X and F.
 */
export function testCells(r, text, pair) {
  const T = text.tests;
  const F = text.fmt;
  const make = T.rows[r.key];
  let d = make;
  if (r.key === 'chi2' || r.key === 'g') d = make(pair);
  else if (r.key === 'permutation' || r.key === 'fisher') d = make(F.int(r.n ?? 0));
  else if (r.key === 'dependence') d = make(r.theta);
  return {
    subject: d.subject,
    hypothesis: d.hypothesis,
    statistic: r.pending ? '-' : `${T.statNames[r.stat[0]]} = ${F.num(r.stat[1], 3)}`,
    p: r.pending ? '-' : F.p(r.p, r.log10p),
    verdict: r.pending ? T.pending : T.verdicts[r.verdict === 'reject' ? 'reject' : 'accept'],
    expected: r.expected === 'theta' ? T.expected.theta(r.theta) : T.expected[r.expected],
    rejected: r.verdict === 'reject',
  };
}

// ---------------------------------------------------------------------------
// I grafici
// ---------------------------------------------------------------------------

/** Section 1.3: the conditional distribution of F within every level of X, and the marginal one of F in the last bar. */
export function conditionalChart(s, names, text) {
  const rows = s.rows.map((i) => ({ label: names.x[i], values: s.cols.map((j) => s.rowProfiles[i][j]) }));
  rows.push({ label: text.names.all, values: s.cols.map((j) => s.colShares[j]) });
  return { rows, separate: true };
}

/** Section 1.4: the observed and the expected frequencies of one level of X, across the levels of F. */
export function expectedChart(s, row, names, decimal = '.') {
  const observed = s.cols.map((j) => s.counts[row][j]);
  const expected = s.cols.map((j) => s.expected[row][j]);
  const { ticks, yMax } = scale(Math.max(1, ...observed, ...expected) * 1.05);
  return {
    categories: s.cols.map((j) => names.f[j]),
    series: [
      { values: observed, colorIndex: 0 },
      { values: expected, colorIndex: 1 },
    ],
    yMax,
    yTicks: ticks,
    decimal,
  };
}

/** Section 1.8: the chi-squares of the shuffles as a density histogram, the density of the chi-square law, and the observed value. */
export function permutationChart(run, decimal = '.') {
  const done = run.done || run.values.length;
  const values = Array.from(run.values.subarray(0, done)).sort((a, b) => a - b);
  const q = (u) => (values.length ? values[Math.min(values.length - 1, Math.floor(u * values.length))] : 0);
  let x1 = Math.max(hw.chi2Quantile(0.001, run.df), q(0.995), 1);
  const beyond = run.observed > x1 * 3;
  if (!beyond) x1 = Math.max(x1, run.observed * 1.08);
  const bins = 40;
  const width = x1 / bins;
  const counts = new Array(bins).fill(0);
  // the shuffles beyond the right edge (at most half a percent of them) stay out of the bars, not piled on the last one
  for (const v of values) {
    const k = Math.floor(v / width);
    if (k < bins) counts[k]++;
  }
  const bars = counts.map((c, k) => ({ from: k * width, to: (k + 1) * width, value: done ? c / (done * width) : 0, count: c, share: done ? c / done : 0 }));
  const curve = Array.from({ length: 161 }, (_, k) => {
    const x = (k / 160) * x1;
    return [x, Math.min(hw.chi2Density(Math.max(x, 1e-9), run.df), 10)];
  });
  const peak = Math.max(...bars.map((b) => b.value), ...curve.map(([, y]) => y).filter(Number.isFinite));
  return { x0: 0, x1, bars, curve, marker: beyond ? null : run.observed, beyond, yMax: Math.min(peak * 1.1, 2), xTicks: hw.niceTicks(0, x1, 6), decimal };
}

/** Section 3.3: the p-value of the simulated log as n grows, against the level 0.05, on a scale of powers of ten. */
export function dependenceChart(series, decimal = '.') {
  const logs = series.map((r) => Math.max(r.log10p, -400));
  const low = Math.min(-2, ...logs);
  const step = low > -12 ? 2 : low > -60 ? 10 : low > -300 ? 50 : 100;
  const yMin = Math.floor(low / step) * step;
  const yTicks = [];
  for (let v = 0; v >= yMin; v -= step) yTicks.unshift(v);
  return {
    x: series.map((r) => r.n),
    logX: true,
    yMin,
    yMax: 0,
    yTicks,
    xTicks: [50, 200, 1000, 5000, 20000],
    yFormat: (v) => (v === 0 ? '1' : `10^${v}`),
    decimal,
    series: [
      { values: logs, colorIndex: 0 },
      { values: series.map(() => Math.log10(hw.SIGNIFICANCE)), colorIndex: 6, dashed: true },
    ],
  };
}

/** Section 4.1: the admission rate of men and women in every department of Berkeley, and in all six together. */
export function simpsonChart(text, decimal = '.') {
  const rate = (t, row) => t[row][0] / (t[row][0] + t[row][1]);
  const tables = [...hw.UCB.departments.map((_, d) => hw.ucbTable(d)), hw.ucbTable()];
  return {
    categories: [...hw.UCB.departments.map((d) => `${text.names.department} ${d}`), text.names.allDepartments],
    series: [
      { values: tables.map((t) => rate(t, 0)), colorIndex: 0 },
      { values: tables.map((t) => rate(t, 1)), colorIndex: 1 },
    ],
    yMax: 1,
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    yFormat: (v) => `${Math.round(v * 100)}%`,
    decimal,
  };
}

/** Rows of the department table of section 4.1: applicants, admitted and rate of men and women, the chi-square of the department. */
export function simpsonRows() {
  const rows = hw.UCB.departments.map((d, k) => ({ key: d, table: hw.ucbTable(k) }));
  rows.push({ key: 'all', table: hw.ucbTable() });
  return rows.map(({ key, table }) => {
    const s = hw.tableStats(table);
    const [[ma, mr], [fa, fr]] = table;
    return { key, men: ma + mr, menRate: ma / (ma + mr), women: fa + fr, womenRate: fa / (fa + fr), chi2: s.chi2, p: s.p, log10p: s.log10p, fisher: hw.fisherExact(table).p };
  });
}

// ---------------------------------------------------------------------------
// Le legende: ogni voce { label, color | paletteKey, dashed?, box?, parts }
// e' un pulsante che nasconde le sue parti del disegno (`hidden` dei dati)
// ---------------------------------------------------------------------------

export const legends = {
  // one item per level of F: it hides that segment in every bar, and its column in the table
  conditional: (s, names) => s.cols.map((j, k) => ({ label: names.f[j], color: k, box: true, parts: [`seg:${k}`] })),
  expected: (text) => [
    { label: text.legends.observed, color: 0, box: true, parts: ['series:0'] },
    { label: text.legends.expected, color: 1, box: true, parts: ['series:1'] },
  ],
  permutation: (text) => [
    { label: text.legends.shuffles, color: 0, box: true, parts: ['bars'] },
    { label: text.legends.density, color: 2, parts: ['curve'] },
    { label: text.legends.observedChi2, paletteKey: 'reference', dashed: true, parts: ['marker'] },
  ],
  dependence: (text) => [
    { label: text.legends.pValue, color: 0, parts: ['series:0'] },
    { label: text.legends.alpha, color: 6, dashed: true, parts: ['series:1'] },
  ],
  simpson: (text) => [
    { label: text.legends.men, color: 0, box: true, parts: ['series:0'] },
    { label: text.legends.women, color: 1, box: true, parts: ['series:1'] },
  ],
};

// ---------------------------------------------------------------------------
// Le etichette sotto il puntatore: (hit, hidden) => testo, senza le parti nascoste
// ---------------------------------------------------------------------------

const seriesOn = (hidden, i) => !hidden.includes(`series:${i}`);

export const tips = {
  conditional: (s, names, T) => (hit) => {
    const j = s.cols[hit.segment];
    if (hit.index === s.rows.length) return T.marginal(names.f[j], s.colShares[j], s.colTotals[j]);
    const i = s.rows[hit.index];
    return T.conditional(names.x[i], names.f[j], s.counts[i][j], s.rowProfiles[i][j], s.colShares[j]);
  },
  expected: (s, row, names, T) => (hit, hidden = []) => {
    const j = s.cols[hit.index];
    return T.expected(names.x[row], names.f[j], seriesOn(hidden, 0) ? s.counts[row][j] : null, seriesOn(hidden, 1) ? s.expected[row][j] : null);
  },
  permutation: (chart, T) => (hit) => {
    const b = chart.bars[hit.index];
    return b ? T.shuffles(b.from, b.to, b.count, b.share) : null;
  },
  dependence: (series, T) => (hit, hidden = []) => (seriesOn(hidden, 0) ? T.dependence(series[hit.index]) : null),
  simpson: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.simpson(r, { men: seriesOn(hidden, 0), women: seriesOn(hidden, 1) });
  },
};

// ---------------------------------------------------------------------------
// Tabelle legate ai grafici
// ---------------------------------------------------------------------------

/** The id of every table tied to a chart: the page and the program find it by id. */
export const LINKED_TABLES = Object.freeze({
  profiles: 'hw6-profiles-table',
  expected: 'hw6-expected-table',
  series: 'hw6-series-table',
  departments: 'hw6-departments-table',
});

const tableById = (id) => () => document.getElementById(id);

// one row per bar or point of the chart, in the same order
const rowPerPoint = (id) => Object.freeze({ table: tableById(id), row: (hit) => hit.index, point: (row) => row });

export const links = {
  profiles: rowPerPoint(LINKED_TABLES.profiles),
  expected: rowPerPoint(LINKED_TABLES.expected),
  series: rowPerPoint(LINKED_TABLES.series),
  departments: rowPerPoint(LINKED_TABLES.departments),
};

// ---------------------------------------------------------------------------
// I valori iniziali degli esempi interattivi
// ---------------------------------------------------------------------------

/** The counts of "Try it" in 1.5 as it opens (a small phishing exercise: training against clicking the link; the names are in the texts), and how many rows and columns the grid can have. */
export const TRY_COUNTS = Object.freeze([Object.freeze([3, 17]), Object.freeze([9, 11])]);
export const GRID = Object.freeze({ min: 2, max: 6 });

/**
 * The table of "Try it" in 1.5 from the cells as typed: the counts, or the
 * first error. A row or column of zeros stays (it is out of the test); a
 * table with nothing in it, or with fewer than two rows or columns that
 * have records, cannot be tested.
 */
export function readGrid(cells) {
  const counts = [];
  for (const row of cells) {
    const out = [];
    for (const cell of row) {
      const r = hw.parseInteger(cell, hw.LIMITS.cell);
      if (!r.ok) return { ok: false, error: 'cell' };
      out.push(r.value);
    }
    counts.push(out);
  }
  return checkCounts(counts);
}

/** The counts of a table the reader typed or pasted, with their statistics, or the reason why there is no test. */
export function checkCounts(counts, extra = {}) {
  const N = counts.reduce((s, row) => s + row.reduce((a, v) => a + v, 0), 0);
  if (N === 0) return { ok: false, error: 'zero' };
  const s = hw.tableStats(counts);
  if (!s.testable) return { ok: false, error: 'oneLevel' };
  return { ok: true, counts, s, ...extra };
}

/** The pairs of "Try it" in 1.5 as a table: hw.parsePairs, then the same checks as the grid. */
export function readPairs(text, header) {
  const r = hw.parsePairs(text, { header });
  if (!r.ok) return r;
  const out = checkCounts(r.counts, { xLevels: r.xLevels, fLevels: r.fLevels, records: r.records });
  return out;
}

/** The dependence of the simulated log as the page opens, and its size. */
export const DEPENDENCE_DEFAULT = Object.freeze({ theta: 0.1, n: 1000 });

/** The permutation test as the page opens: the size of the sample and the number of shuffles. */
export const PERMUTATION_DEFAULT = Object.freeze({ n: 100, B: 2000 });

/** The small sample of 1.7 as the page opens. */
export const SMALL_DEFAULT = 40;

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
