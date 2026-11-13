// src/pages/statistics/hw6/homework6.js
// Homework #6 di Statistics: l'indipendenza statistica. Su un dataset
// bivariato (X, F) qualsiasi: la tabella di contingenza costruita dai
// record, le frequenze marginali e condizionate, le frequenze attese se X e
// F fossero indipendenti, la statistica chi quadrato con il suo p-value, e
// accanto il test G, i residui, la V di Cramer, i test per le tabelle
// piccole (Fisher, Yates), il test di permutazione e quello di
// Cochran-Mantel-Haenszel per il paradosso di Simpson.
//
// I dati sono veri: le 22.544 connessioni di rete del test set di NSL-KDD
// (nslkdd.js, con la citazione che la licenza chiede), e per il paradosso le
// ammissioni a Berkeley del 1973. I valori di riferimento delle verifiche
// vengono da SciPy 1.17.1, da mpmath a 50 cifre e da R.
//
// Lo stesso file serve la pagina (import) e il programma scaricabile
// (homework6.js da solo, anche con node homework6.js): niente DOM fuori
// dalle funzioni di disegno, niente dipendenze.
import { FLAGS, LABELS, PROTOCOLS, RECORDS, SERVICES, SOURCE } from './nslkdd.js';

const fail = (message) => {
  throw new RangeError(message);
};

// ---------------------------------------------------------------------------
// 1. I parametri
// ---------------------------------------------------------------------------

/** The seed of every random choice of the page (samples, shuffles, the simulated log). */
export const DEFAULT_SEED = 2026;

/** The accepted ranges: the seed, a cell of the table the reader types, a size of the simulated log. */
export const LIMITS = Object.freeze({
  seed: Object.freeze([0, 4294967295]),
  cell: Object.freeze([0, 1000000]),
  size: Object.freeze([10, 100000]),
});

/** An integer of the range [min, max], in decimal digits. */
export function parseInteger(text, [min, max]) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (!/^\d{1,12}$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const value = Number(t);
  if (value < min || value > max) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** A real number of the range [min, max], with a decimal point or a decimal comma and an optional exponent: -3, 0,5, 2.5e-3. */
export function parseNumber(text, [min, max]) {
  const t = String(text).trim();
  const plain = t.replace(',', '.');
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (plain.length > 16 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d{1,3})?$/.test(plain)) return { ok: false, error: 'notNumber', text: t };
  const value = Number(plain);
  if (!(value >= min && value <= max)) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}


// ---------------------------------------------------------------------------
// 2. Il dataset: NSL-KDD, le sue variabili e le categorie degli attacchi
// ---------------------------------------------------------------------------

/** Where the data come from, as the page and the program cite it (the licence asks for it). */
export const DATA_SOURCE = SOURCE;

/*
 * The category of every label. The 22 attacks of the training set have the
 * one of the KDD Cup 1999 file training_attack_types; the attacks that only
 * the test set has get the one of the attack database of the DARPA 1999
 * evaluation (MIT Lincoln Laboratory), where they come from; four of them
 * (snmpgetattack, snmpguess, worm, sqlattack) are in neither and get the
 * category most of the literature gives them. httptunnel is the one that the
 * literature splits (some tables put it among the user to root attacks): the
 * Lincoln Laboratory lists it among the remote to local ones, and so does
 * this page.
 */
const CATEGORY_LIST = [
  ['normal', 'normal', 'data'],
  ['back', 'dos', 'kdd99'],
  ['land', 'dos', 'kdd99'],
  ['neptune', 'dos', 'kdd99'],
  ['pod', 'dos', 'kdd99'],
  ['smurf', 'dos', 'kdd99'],
  ['teardrop', 'dos', 'kdd99'],
  ['apache2', 'dos', 'll99'],
  ['mailbomb', 'dos', 'll99'],
  ['processtable', 'dos', 'll99'],
  ['udpstorm', 'dos', 'll99'],
  ['ipsweep', 'probe', 'kdd99'],
  ['nmap', 'probe', 'kdd99'],
  ['portsweep', 'probe', 'kdd99'],
  ['satan', 'probe', 'kdd99'],
  ['mscan', 'probe', 'll99'],
  ['saint', 'probe', 'll99'],
  ['ftp_write', 'r2l', 'kdd99'],
  ['guess_passwd', 'r2l', 'kdd99'],
  ['imap', 'r2l', 'kdd99'],
  ['multihop', 'r2l', 'kdd99'],
  ['phf', 'r2l', 'kdd99'],
  ['spy', 'r2l', 'kdd99'],
  ['warezclient', 'r2l', 'kdd99'],
  ['warezmaster', 'r2l', 'kdd99'],
  ['httptunnel', 'r2l', 'll99'],
  ['named', 'r2l', 'll99'],
  ['sendmail', 'r2l', 'll99'],
  ['xlock', 'r2l', 'll99'],
  ['xsnoop', 'r2l', 'll99'],
  ['snmpgetattack', 'r2l', 'literature'],
  ['snmpguess', 'r2l', 'literature'],
  ['worm', 'r2l', 'literature'],
  ['buffer_overflow', 'u2r', 'kdd99'],
  ['loadmodule', 'u2r', 'kdd99'],
  ['perl', 'u2r', 'kdd99'],
  ['rootkit', 'u2r', 'kdd99'],
  ['ps', 'u2r', 'll99'],
  ['xterm', 'u2r', 'll99'],
  ['sqlattack', 'u2r', 'literature'],
];
export const ATTACK_CATEGORIES = Object.freeze(Object.fromEntries(CATEGORY_LIST.map(([label, category, source]) => [label, Object.freeze({ category, source })])));

/** The levels of the derived variables: the class of the record, and normal against attack. */
export const CLASSES = Object.freeze(['normal', 'dos', 'probe', 'r2l', 'u2r']);
export const OUTCOMES = Object.freeze(['normal', 'attack']);

/** The services shown one by one, the most frequent: the other 57 become one level. */
export const SERVICE_GROUPS = 7;

/** The variables the reader can pick as X and as F, and the default pair. */
export const VARIABLES = Object.freeze(['protocol', 'service', 'flag', 'class', 'outcome']);
export const DEFAULT_PAIR = Object.freeze({ x: 'protocol', f: 'class' });

/** The key of a level that holds several values: the other services, or the rare levels merged. */
export const OTHERS = '*';

/** The levels of a variable: their keys, in the order of the table (the values of the data, the most frequent first). */
export function variableLevels(variable) {
  switch (variable) {
    case 'protocol':
      return [...PROTOCOLS];
    case 'service':
      return [...SERVICES.slice(0, SERVICE_GROUPS), OTHERS];
    case 'flag':
      return [...FLAGS];
    case 'class':
      return [...CLASSES];
    case 'outcome':
      return [...OUTCOMES];
    default:
      return fail(`unknown variable ${variable}`);
  }
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let columns = null;

/** The four columns of the records, decoded once: positions in PROTOCOLS, SERVICES, FLAGS and LABELS. */
export function nslColumns() {
  if (!columns) {
    const n = RECORDS.length / 4;
    if (n !== SOURCE.records) fail('the records of NSL-KDD are damaged');
    const value = new Uint8Array(128);
    for (let i = 0; i < ALPHABET.length; i++) value[ALPHABET.charCodeAt(i)] = i;
    const out = { n, protocol: new Uint8Array(n), service: new Uint8Array(n), flag: new Uint8Array(n), label: new Uint8Array(n) };
    for (let i = 0; i < n; i++) {
      out.protocol[i] = value[RECORDS.charCodeAt(4 * i)];
      out.service[i] = value[RECORDS.charCodeAt(4 * i + 1)];
      out.flag[i] = value[RECORDS.charCodeAt(4 * i + 2)];
      out.label[i] = value[RECORDS.charCodeAt(4 * i + 3)];
    }
    columns = out;
  }
  return columns;
}

const codeCache = new Map();

/** The level of every record for a variable: its position in variableLevels(variable). */
export function variableCodes(variable) {
  if (!codeCache.has(variable)) {
    const c = nslColumns();
    const out = new Uint8Array(c.n);
    if (variable === 'protocol') out.set(c.protocol);
    else if (variable === 'flag') out.set(c.flag);
    else if (variable === 'service') for (let i = 0; i < c.n; i++) out[i] = Math.min(c.service[i], SERVICE_GROUPS);
    else if (variable === 'class' || variable === 'outcome') {
      const level = LABELS.map((label) => {
        const category = ATTACK_CATEGORIES[label].category;
        return variable === 'class' ? CLASSES.indexOf(category) : category === 'normal' ? 0 : 1;
      });
      for (let i = 0; i < c.n; i++) out[i] = level[c.label[i]];
    } else fail(`unknown variable ${variable}`);
    codeCache.set(variable, out);
  }
  return codeCache.get(variable);
}

/** The contingency table of two coded variables: counts[i][j] records have level i of the first and j of the second (only `indices`, when given). */
export function contingency(xCodes, fCodes, r, c, indices = null) {
  const counts = Array.from({ length: r }, () => new Array(c).fill(0));
  if (indices) for (const i of indices) counts[xCodes[i]][fCodes[i]]++;
  else for (let i = 0; i < xCodes.length; i++) counts[xCodes[i]][fCodes[i]]++;
  return counts;
}

/** The share of the records under which a level counts as rare, when the reader asks to merge the rare levels. */
export const RARE_SHARE = 0.01;

/** Where every level of one variable goes when its rare levels merge (at least two of them, into OTHERS, or into an OTHERS level already there). */
function mergeMap(levels, totals, N, share) {
  const rare = levels.map((key, i) => key !== OTHERS && totals[i] < share * N);
  if (rare.filter(Boolean).length < 2) return { map: levels.map((_, i) => i), levels: [...levels] };
  const kept = levels.filter((_, i) => !rare[i]);
  const target = kept.includes(OTHERS) ? kept.indexOf(OTHERS) : kept.length;
  const out = target === kept.length ? [...kept, OTHERS] : kept;
  const map = levels.map((key, i) => (rare[i] ? target : kept.indexOf(key)));
  return { map, levels: out };
}

/**
 * The two variables of a pair as codes of the same records, ready for a
 * table: with `merge`, the rare levels of each variable (under RARE_SHARE
 * of the records, when there are at least two) become one level, the
 * classic remedy for expected frequencies that are too small.
 */
export function pairCodes(xVar, fVar, { merge = false } = {}) {
  if (xVar === fVar) fail('X and F must be two different variables');
  let x = variableCodes(xVar);
  let f = variableCodes(fVar);
  let xLevels = variableLevels(xVar);
  let fLevels = variableLevels(fVar);
  if (merge) {
    const n = x.length;
    const total = (codes, k) => {
      const t = new Array(k).fill(0);
      for (const v of codes) t[v]++;
      return t;
    };
    const mx = mergeMap(xLevels, total(x, xLevels.length), n, RARE_SHARE);
    const mf = mergeMap(fLevels, total(f, fLevels.length), n, RARE_SHARE);
    x = Uint8Array.from(x, (v) => mx.map[v]);
    f = Uint8Array.from(f, (v) => mf.map[v]);
    xLevels = mx.levels;
    fLevels = mf.levels;
  }
  return { xVar, fVar, x, f, xLevels, fLevels };
}

/** The contingency table of a pair of NSL-KDD (pairCodes), on all the records or on `indices`. */
export function nslTable(xVar, fVar, { merge = false, indices = null } = {}) {
  const p = pairCodes(xVar, fVar, { merge });
  return { xVar, fVar, xLevels: p.xLevels, fLevels: p.fLevels, counts: contingency(p.x, p.f, p.xLevels.length, p.fLevels.length, indices) };
}

/** The protocols in the order of the codes, and the label of a code: for the readings that name attacks. */
export const PROTOCOL_NAMES = PROTOCOLS;
export const nslLabel = (code) => LABELS[code];

/** Every record of a pair as text, the first `count` of them: what the page shows of the data before counting. */
export function firstRecords(count = 8) {
  const c = nslColumns();
  return Array.from({ length: Math.min(count, c.n) }, (_, i) => ({
    protocol: PROTOCOLS[c.protocol[i]],
    service: SERVICES[c.service[i]],
    flag: FLAGS[c.flag[i]],
    label: LABELS[c.label[i]],
    class: ATTACK_CATEGORIES[LABELS[c.label[i]]].category,
  }));
}

/** How many records every label has, with its category: the table of the categories of the page. */
export function labelCounts() {
  const c = nslColumns();
  const counts = new Array(LABELS.length).fill(0);
  for (let i = 0; i < c.n; i++) counts[c.label[i]]++;
  return LABELS.map((label, i) => ({ label, count: counts[i], ...ATTACK_CATEGORIES[label] }));
}

// ---------------------------------------------------------------------------
// 3. La tabella e i suoi test: chi quadrato, G, Fisher, Yates, residui, V di Cramer
// ---------------------------------------------------------------------------

const LN10 = Math.log(10);

const LANCZOS = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];

/** ln Γ(x) for x > 0 (Lanczos, g = 7, nine coefficients: relative error about 1e-15). */
export function lnGamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  const z = x - 1;
  let a = LANCZOS[0];
  const t = z + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * The upper tail of the chi-square law with df degrees of freedom at x, as
 * { p, log10p }: the regularized incomplete gamma Q(df/2, x/2), by its
 * series below a + 1 and by Lentz's continued fraction above, with the
 * logarithm kept apart. A p-value of 10^-495 is still a number this way,
 * even if p itself underflows to 0.
 */
export function chi2Tail(x, df) {
  if (!(df > 0)) fail(`degrees of freedom must be positive: ${df}`);
  if (!(x > 0)) return { p: 1, log10p: 0 };
  const a = df / 2;
  const y = x / 2;
  const lnPrefix = -y + a * Math.log(y) - lnGamma(a);
  if (y < a + 1) {
    let ap = a;
    let term = 1 / a;
    let sum = term;
    for (let n = 0; n < 100000; n++) {
      ap += 1;
      term *= y / ap;
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-17) break;
    }
    const q = Math.max(0, 1 - Math.exp(lnPrefix) * sum);
    return { p: q, log10p: q > 0 ? Math.log10(q) : -Infinity };
  }
  const tiny = 1e-300;
  let b = y + 1 - a;
  let c = 1 / tiny;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  const lnQ = lnPrefix + Math.log(h);
  return { p: Math.exp(lnQ), log10p: lnQ / LN10 };
}

/** The density of the chi-square law with df degrees of freedom at x: the curve of the chart of the permutation test. */
export function chi2Density(x, df) {
  const a = df / 2;
  if (x <= 0) return a < 1 ? Infinity : a === 1 ? 0.5 : 0;
  return Math.exp((a - 1) * Math.log(x) - x / 2 - a * Math.LN2 - lnGamma(a));
}

/** The upper quantile of the chi-square law: the x with chi2Tail(x, df).p = p (bisection on a bracket, to 1e-12). */
export function chi2Quantile(p, df) {
  let lo = 0;
  let hi = Math.max(1, df);
  while (chi2Tail(hi, df).p > p) hi *= 2;
  for (let i = 0; i < 200 && hi - lo > 1e-12 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (chi2Tail(mid, df).p > p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const lnChoose = (n, k) => lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);

/**
 * Fisher's exact test of a 2 x 2 table [[a, b], [c, d]]: with the margins
 * fixed, the top left cell follows the hypergeometric law; the two-sided
 * p-value adds the probabilities of every table no more probable than the
 * observed one (as SciPy and R do). Also the sample odds ratio ad/(bc).
 */
export function fisherExact([[a, b], [c, d]]) {
  const r1 = a + b;
  const r2 = c + d;
  const c1 = a + c;
  const n = r1 + r2;
  const lo = Math.max(0, c1 - r2);
  const hi = Math.min(r1, c1);
  const lnTotal = lnChoose(n, c1);
  const lnP = (k) => lnChoose(r1, k) + lnChoose(r2, c1 - k) - lnTotal;
  const observed = lnP(a);
  let p = 0;
  let less = 0;
  let greater = 0;
  for (let k = lo; k <= hi; k++) {
    const lk = lnP(k);
    const pk = Math.exp(lk);
    // the same tolerance as SciPy: a table counts when its probability is at most (1 + 1e-7) times the observed one
    if (lk <= observed + 1e-7) p += pk;
    if (k <= a) less += pk;
    if (k >= a) greater += pk;
  }
  const oddsRatio = b * c === 0 ? (a * d === 0 ? NaN : Infinity) : (a * d) / (b * c);
  return { p: Math.min(1, p), less: Math.min(1, less), greater: Math.min(1, greater), oddsRatio };
}

/** Yates's continuity correction for a 2 x 2 table: every |O - E| shrinks by 1/2 (not below 0) before squaring. */
export function yatesTest(table) {
  const N = table[0][0] + table[0][1] + table[1][0] + table[1][1];
  const rows = [table[0][0] + table[0][1], table[1][0] + table[1][1]];
  const cols = [table[0][0] + table[1][0], table[0][1] + table[1][1]];
  let chi2 = 0;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const e = (rows[i] * cols[j]) / N;
      const d = Math.max(0, Math.abs(table[i][j] - e) - 0.5);
      chi2 += (d * d) / e;
    }
  }
  return { chi2, ...chi2Tail(chi2, 1) };
}

/** Cohen's effect size w = V sqrt(min(r, c) - 1), in the words of the page: below 0.1 negligible, then small, medium (0.3) and large (0.5). */
export function effectClass(w) {
  if (!(w >= 0.1)) return 'negligible';
  if (w < 0.3) return 'small';
  if (w < 0.5) return 'medium';
  return 'large';
}

/** The level of significance of every test of the page. */
export const SIGNIFICANCE = 0.05;

/**
 * Everything the page says about a contingency table counts[i][j] (rows:
 * the levels of X, columns: those of F): totals, marginal and conditional
 * frequencies, expected frequencies under independence, the chi-square
 * statistic with its p-value (also as log10, for the tiny ones), the G
 * statistic, Cramer's V and Cohen's w, Pearson's and Haberman's adjusted
 * residuals, Cochran's rule for small tables, and for 2 x 2 tables Yates's
 * correction and Fisher's exact test. Empty rows and columns stay in the
 * table but out of the test: they have no expected frequency and no degree
 * of freedom.
 */
export function tableStats(counts) {
  const rowTotals = counts.map((row) => row.reduce((s, v) => s + v, 0));
  const colTotals = counts[0].map((_, j) => counts.reduce((s, row) => s + row[j], 0));
  const N = rowTotals.reduce((s, v) => s + v, 0);
  if (!(N > 0)) fail('the table is empty');
  const rows = rowTotals.flatMap((t, i) => (t > 0 ? [i] : []));
  const cols = colTotals.flatMap((t, j) => (t > 0 ? [j] : []));
  const r = rows.length;
  const c = cols.length;
  const expected = counts.map((row, i) => row.map((_, j) => (rowTotals[i] * colTotals[j]) / N));
  const blank = () => counts.map((row) => row.map(() => null));
  const contributions = blank();
  const pearson = blank();
  const adjusted = blank();
  let chi2 = 0;
  let G = 0;
  let below5 = 0;
  let below1 = 0;
  let minExpected = Infinity;
  for (const i of rows) {
    for (const j of cols) {
      const o = counts[i][j];
      const e = expected[i][j];
      const d = o - e;
      contributions[i][j] = (d * d) / e;
      chi2 += contributions[i][j];
      if (o > 0) G += 2 * o * Math.log(o / e);
      pearson[i][j] = d / Math.sqrt(e);
      const scale = (1 - rowTotals[i] / N) * (1 - colTotals[j] / N);
      adjusted[i][j] = scale > 0 ? d / Math.sqrt(e * scale) : null;
      if (e < 5) below5++;
      if (e < 1) below1++;
      minExpected = Math.min(minExpected, e);
    }
  }
  const df = (r - 1) * (c - 1);
  const testable = df > 0;
  const tail = testable ? chi2Tail(chi2, df) : { p: NaN, log10p: NaN };
  const gTail = testable ? chi2Tail(G, df) : { p: NaN, log10p: NaN };
  const k = Math.min(r, c) - 1;
  const V = testable ? Math.sqrt(chi2 / (N * k)) : NaN;
  const cells = r * c;
  const two = r === 2 && c === 2 ? rows.map((i) => cols.map((j) => counts[i][j])) : null;
  return {
    counts,
    N,
    rowTotals,
    colTotals,
    rows,
    cols,
    r,
    c,
    rowShares: rowTotals.map((t) => t / N),
    colShares: colTotals.map((t) => t / N),
    rowProfiles: counts.map((row, i) => (rowTotals[i] > 0 ? row.map((v) => v / rowTotals[i]) : null)),
    colProfiles: counts.map((row) => row.map((v, j) => (colTotals[j] > 0 ? v / colTotals[j] : null))),
    expected,
    contributions,
    chi2,
    df,
    testable,
    p: tail.p,
    log10p: tail.log10p,
    G,
    gP: gTail.p,
    gLog10p: gTail.log10p,
    V,
    w: V * Math.sqrt(k),
    effect: testable ? effectClass(V * Math.sqrt(k)) : null,
    pearson,
    adjusted,
    small: { cells, below5, below1, minExpected, cochran: below1 === 0 && below5 <= 0.2 * cells },
    two,
    yates: two ? yatesTest(two) : null,
    fisher: two ? fisherExact(two) : null,
    critical: testable ? chi2Quantile(SIGNIFICANCE, df) : NaN,
  };
}

/** The chi-square of a table whose expected frequencies are already known (the shuffles of the permutation test keep the margins). */
function chi2With(counts, expected) {
  let chi2 = 0;
  for (let i = 0; i < counts.length; i++) {
    for (let j = 0; j < counts[i].length; j++) {
      const e = expected[i][j];
      if (e > 0) chi2 += ((counts[i][j] - e) ** 2) / e;
    }
  }
  return chi2;
}

/** Every pair of variables of NSL-KDD with its chi-square, p-value, Cramer's V and Cochran's rule: the map of the associations. */
export function allPairs({ merge = false } = {}) {
  const out = [];
  for (let a = 0; a < VARIABLES.length; a++) {
    for (let b = a + 1; b < VARIABLES.length; b++) {
      const t = nslTable(VARIABLES[a], VARIABLES[b], { merge });
      const s = tableStats(t.counts);
      out.push({ x: VARIABLES[a], f: VARIABLES[b], r: s.r, c: s.c, chi2: s.chi2, df: s.df, p: s.p, log10p: s.log10p, V: s.V, effect: s.effect, cochran: s.small.cochran, below5: s.small.below5, cells: s.small.cells });
    }
  }
  return out.sort((p, q) => q.V - p.V);
}

/**
 * Two columns of text, one record per line (x, f; also with ; or a tab), as
 * a contingency table: the levels in the order they first appear. A first
 * line that names the columns is skipped when asked; empty lines are
 * ignored. At most 100000 records and 12 levels per variable.
 */
export function parsePairs(text, { header = false } = {}) {
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
  const body = header ? lines.slice(1) : lines;
  if (body.length === 0) return { ok: false, error: 'empty' };
  if (body.length > 100000) return { ok: false, error: 'tooMany' };
  const xLevels = [];
  const fLevels = [];
  const pairs = [];
  for (let n = 0; n < body.length; n++) {
    const parts = body[n].split(/[,;\t]/).map((s) => s.trim());
    if (parts.length !== 2 || parts[0] === '' || parts[1] === '') return { ok: false, error: 'line', line: n + (header ? 2 : 1), text: body[n].slice(0, 40) };
    if (!xLevels.includes(parts[0])) xLevels.push(parts[0]);
    if (!fLevels.includes(parts[1])) fLevels.push(parts[1]);
    if (xLevels.length > 12 || fLevels.length > 12) return { ok: false, error: 'levels' };
    pairs.push([xLevels.indexOf(parts[0]), fLevels.indexOf(parts[1])]);
  }
  if (xLevels.length < 2 || fLevels.length < 2) return { ok: false, error: 'oneLevel' };
  const counts = Array.from({ length: xLevels.length }, () => new Array(fLevels.length).fill(0));
  for (const [i, j] of pairs) counts[i][j]++;
  return { ok: true, xLevels, fLevels, counts, records: pairs.length };
}

// ---------------------------------------------------------------------------
// 4. Campioni, permutazioni e una dipendenza regolabile
// ---------------------------------------------------------------------------

/** n distinct records of NSL-KDD drawn without replacement: a partial Fisher-Yates shuffle with the stream 'sample', repetition j. */
export function sampleIndices(n, seed, j = 0) {
  const total = nslColumns().n;
  if (!(n >= 1 && n <= total)) fail(`sample size out of range: ${n}`);
  const next = generator(seed, 'sample', j);
  const idx = new Uint32Array(total);
  for (let i = 0; i < total; i++) idx[i] = i;
  for (let i = 0; i < n; i++) {
    const k = i + Math.floor(uniform53(next) * (total - i));
    const t = idx[i];
    idx[i] = idx[k];
    idx[k] = t;
  }
  return Array.from(idx.subarray(0, n));
}

/** The sizes of the small samples of section 1.7. */
export const SMALL_SIZES = Object.freeze([20, 40, 80]);

/** The 2 x 2 table of a small sample of NSL-KDD: tcp or not (rows), normal or attack (columns); stream 'sample', repetition j. */
export function smallTable(n, seed, j = 0) {
  const protocol = variableCodes('protocol');
  const outcome = variableCodes('outcome');
  const t = [
    [0, 0],
    [0, 0],
  ];
  for (const i of sampleIndices(n, seed, j)) t[protocol[i] === 0 ? 0 : 1][outcome[i]]++;
  return t;
}

/** The sizes of the samples of the permutation test, and how many shuffles it can make. */
export const PERMUTATION_SIZES = Object.freeze([30, 100, 300, 1000]);
export const PERMUTATION_COUNTS = Object.freeze([500, 2000]);

/**
 * The permutation test of independence on records x (levels 0..r-1) and f
 * (0..c-1): B times the values of F are shuffled among the records, X
 * staying in place. A shuffle keeps both margins and breaks any link
 * between the two, so its chi-squares are what independence produces by
 * chance; the share of them at least as large as the observed one, (1 +
 * count)/(B + 1), estimates the p-value without the chi-square law. As a
 * generator it yields every `slice` shuffles, so the page draws the
 * histogram while it grows; the stream is 'perm', repetition j.
 */
export function* permutationSteps(x, f, r, c, B, seed, { slice = 50, j = 0 } = {}) {
  const base = tableStats(contingency(x, f, r, c));
  const next = generator(seed, 'perm', j);
  const shuffled = Uint8Array.from(f);
  const n = shuffled.length;
  const values = new Float64Array(B);
  let exceed = 0;
  const tolerance = 1e-9 * Math.max(1, base.chi2);
  for (let b = 0; b < B; b++) {
    for (let i = n - 1; i > 0; i--) {
      const k = Math.floor(uniform53(next) * (i + 1));
      const t = shuffled[i];
      shuffled[i] = shuffled[k];
      shuffled[k] = t;
    }
    const v = chi2With(contingency(x, shuffled, r, c), base.expected);
    values[b] = v;
    if (v >= base.chi2 - tolerance) exceed++;
    if ((b + 1) % slice === 0 && b + 1 < B) yield { done: b + 1, values, exceed };
  }
  return { observed: base.chi2, df: base.df, p: base.p, values, exceed, B, pPerm: (1 + exceed) / (B + 1) };
}

/** The permutation test in one go. */
export function permutationTest(x, f, r, c, B, seed, options = {}) {
  const steps = permutationSteps(x, f, r, c, B, seed, options);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/**
 * The simulated security log of the dependence example: X is the time of a
 * login (night, day, evening), F its outcome (success, failure, blocked).
 * With probability theta the outcome follows the time (night: blocked,
 * day: success, evening: failure), otherwise it is drawn on its own: theta
 * = 0 is perfect independence, theta = 1 a deterministic link.
 */
export const DEPENDENCE = Object.freeze({
  x: Object.freeze(['night', 'day', 'evening']),
  f: Object.freeze(['success', 'failure', 'blocked']),
  px: Object.freeze([0.15, 0.6, 0.25]),
  pf: Object.freeze([0.75, 0.2, 0.05]),
  link: Object.freeze([2, 0, 1]),
});

/** The values of theta of the slider, the sizes of the table and those of the series. */
export const THETAS = Object.freeze(Array.from({ length: 21 }, (_, i) => i / 20));
export const DEPENDENCE_SIZES = Object.freeze([50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]);

const pick = (u, probs) => {
  let acc = 0;
  for (let k = 0; k < probs.length; k++) {
    acc += probs[k];
    if (u < acc) return k;
  }
  return probs.length - 1;
};

/** n logins of the simulated log with dependence theta, from the stream 'dependence', repetition j: their contingency table. */
export function dependenceTable(n, theta, seed, j = 0) {
  const next = generator(seed, 'dependence', j);
  const counts = DEPENDENCE.x.map(() => DEPENDENCE.f.map(() => 0));
  for (let i = 0; i < n; i++) {
    const x = pick(uniform53(next), DEPENDENCE.px);
    const linked = uniform53(next) < theta;
    const f = linked ? DEPENDENCE.link[x] : pick(uniform53(next), DEPENDENCE.pf);
    counts[x][f]++;
  }
  return counts;
}

/** The same dependence at every size of DEPENDENCE_SIZES: how the chi-square, the p-value and V move with n. */
export function dependenceSeries(theta, seed) {
  return DEPENDENCE_SIZES.map((n, k) => {
    const s = tableStats(dependenceTable(n, theta, seed, k + 1));
    return { n, chi2: s.chi2, df: s.df, p: s.p, log10p: s.log10p, V: s.V, effect: s.effect };
  });
}

// ---------------------------------------------------------------------------
// 5. Associazione e causalita': le ammissioni di Berkeley (1973)
// ---------------------------------------------------------------------------

/**
 * The graduate admissions of the University of California, Berkeley, fall
 * 1973, in the six largest departments (Bickel, Hammel and O'Connell,
 * Science 187, 1975; the dataset UCBAdmissions of R): admitted and rejected
 * applicants, by gender and department.
 */
export const UCB = Object.freeze({
  departments: Object.freeze(['A', 'B', 'C', 'D', 'E', 'F']),
  male: Object.freeze({ admitted: Object.freeze([512, 353, 120, 138, 53, 22]), rejected: Object.freeze([313, 207, 205, 279, 138, 351]) }),
  female: Object.freeze({ admitted: Object.freeze([89, 17, 202, 131, 94, 24]), rejected: Object.freeze([19, 8, 391, 244, 299, 317]) }),
});

/** The 2 x 2 table of department d (0-5), or of all six together (d = null): rows men, women; columns admitted, rejected. */
export function ucbTable(d = null) {
  const sum = (list) => (d === null ? list.reduce((s, v) => s + v, 0) : list[d]);
  return [
    [sum(UCB.male.admitted), sum(UCB.male.rejected)],
    [sum(UCB.female.admitted), sum(UCB.female.rejected)],
  ];
}

/**
 * The Cochran-Mantel-Haenszel test of independence given the strata, on
 * 2 x 2 tables [[a, b], [c, d]]: the top left cells added over the strata
 * against their expected values, with or without the continuity
 * correction, on one degree of freedom; and the Mantel-Haenszel common
 * odds ratio, sum(ad/n) / sum(bc/n).
 */
export function cmhTest(tables, { correct = true } = {}) {
  let observed = 0;
  let expected = 0;
  let variance = 0;
  let num = 0;
  let den = 0;
  for (const [[a, b], [c, d]] of tables) {
    const n = a + b + c + d;
    if (n < 2) continue;
    observed += a;
    expected += ((a + b) * (a + c)) / n;
    variance += ((a + b) * (c + d) * (a + c) * (b + d)) / (n * n * (n - 1));
    num += (a * d) / n;
    den += (b * c) / n;
  }
  const deviation = Math.max(0, Math.abs(observed - expected) - (correct ? 0.5 : 0));
  const statistic = (deviation * deviation) / variance;
  return { statistic, ...chi2Tail(statistic, 1), oddsRatio: num / den, observed, expected };
}

// ---------------------------------------------------------------------------
// 6. Il generatore
// ---------------------------------------------------------------------------

/*
 * The generators of Homework #3, #4 and #5: SplitMix64 turns a 64-bit
 * number into the initial state of xoshiro128**, which draws the numbers.
 * Every stream starts SplitMix64 from seed x 2^32 + j, XOR the golden ratio
 * times the number of the stream, so the streams never meet and every
 * repetition j is the same whatever the others do. Stream 0 ('main') is the
 * first stream of Homework #5, checked there against independent Python
 * code: the same checks hold here.
 */

const MASK64 = (1n << 64n) - 1n;
const GOLDEN = 0x9e3779b97f4a7c15n;

/** SplitMix64 (Steele, Lea and Flood, 2014), as in Vigna's reference code: 64-bit outputs, as BigInt. */
export function splitMix64(seed) {
  let x = BigInt.asUintN(64, BigInt(seed));
  return () => {
    x = (x + GOLDEN) & MASK64;
    let z = x;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    return z ^ (z >> 31n);
  };
}

const rotl = (x, k) => (x << k) | (x >>> (32 - k));

/** xoshiro128** 1.1 from the state (a, b, c, d), not all zero: unsigned 32-bit outputs. */
export function xoshiro128ss(a, b, c, d) {
  let s0 = a | 0;
  let s1 = b | 0;
  let s2 = c | 0;
  let s3 = d | 0;
  if ((s0 | s1 | s2 | s3) === 0) fail('the state of xoshiro128** must not be all zero');
  return () => {
    const result = Math.imul(rotl(Math.imul(s1, 5), 7), 9) >>> 0;
    const t = s1 << 9;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = rotl(s3, 11);
    return result;
  };
}

/** The streams of the page: 'main' first (the one checked against Python), then the samples, the shuffles and the simulated log. */
export const STREAMS = Object.freeze(['main', 'sample', 'perm', 'dependence']);

/** The initial state of stream `stream`, repetition j (from 0): two outputs of SplitMix64 as four 32-bit words. */
export function streamState(seed, stream, j) {
  const index = STREAMS.indexOf(stream);
  if (index < 0) fail(`unknown stream ${stream}`);
  const start = (BigInt(seed >>> 0) << 32n) | BigInt(j >>> 0);
  const next = splitMix64(start ^ ((GOLDEN * BigInt(index)) & MASK64));
  const a = next();
  const b = next();
  return [Number(a & 0xffffffffn), Number(a >> 32n), Number(b & 0xffffffffn), Number(b >> 32n)];
}

/** A stream: xoshiro128** from streamState. */
export const generator = (seed, stream, j) => xoshiro128ss(...streamState(seed, stream, j));

/** A uniform double in (0, 1) from two outputs: 53 random bits, never 0 and never 1. */
export const uniform53 = (next) => ((next() >>> 5) * 67108864 + (next() >>> 6) + 0.5) / 9007199254740992;

/** A new seed from the cryptographic generator, when there is one (the seed does not protect anything). */
export function randomSeed() {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') return c.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}

/** Standard normal values by Box-Muller (1958): two uniforms give two independent normals, sqrt(-2 ln u1) (cos, sin)(2 pi u2). */
export function normalSampler(next) {
  let spare = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    const r = Math.sqrt(-2 * Math.log(uniform53(next)));
    const angle = 2 * Math.PI * uniform53(next);
    spare = r * Math.sin(angle);
    return r * Math.cos(angle);
  };
}


const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

/** Runs a generator in slices of a few milliseconds, leaving the browser free to draw in between. */
export function runStepsAsync(makeSteps, { sliceMs = 12, schedule = (run) => setTimeout(run, 0) } = {}) {
  return new Promise((resolve, reject) => {
    let steps;
    try {
      steps = makeSteps();
    } catch (error) {
      reject(error);
      return;
    }
    const run = () => {
      const end = Date.now() + sliceMs;
      try {
        let step = steps.next();
        while (!step.done && Date.now() < end) step = steps.next();
        if (step.done) resolve(step.value);
        else schedule(run);
      } catch (error) {
        reject(error);
      }
    };
    schedule(run);
  });
}


// ---------------------------------------------------------------------------
// 7. I grafici: righe, istogrammi, barre impilate e affiancate; etichette sotto il puntatore e legende a pulsanti
// ---------------------------------------------------------------------------

export const DEFAULT_PALETTE = {
  background: '#ffffff',
  text: '#444444',
  grid: '#eeeeee',
  bars: '#5c6bc0',
  reference: '#d52349',
  highlight: '#d52349',
  // the first seven as in the other homework; the others for the stacked bars of the flags (up to 11 levels)
  series: ['#5c6bc0', '#d52349', '#2e7d6b', '#f0a500', '#8e24aa', '#00838f', '#777777', '#8d6e63', '#9e9d24', '#ef6c00', '#1e88e5', '#ad1457'],
};

/**
 * Sizes a canvas for drawing at the device's pixel density. `knownWidth`,
 * when given (for example by a ResizeObserver), avoids reading clientWidth,
 * which right after another canvas has been resized would force the browser
 * to lay out the whole page again.
 */
function setupCanvas(canvas, aspect, knownWidth = 0) {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const width = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const height = Math.round(width * aspect);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

const chartNumber = (text, decimal) => (decimal === '.' ? text : text.replace('.', decimal));

/** A short number for an axis: 0, 0.05, 1.5, 200, 10000, 1e-4. */
export function axisLabel(v, decimal = '.') {
  if (v === 0) return '0';
  const a = Math.abs(v);
  let s;
  if (a >= 1) s = Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
  else if (a >= 0.001) s = String(Number(v.toPrecision(2)));
  else s = v.toExponential(0);
  return chartNumber(s, decimal);
}

/** About `count` round values covering [lo, hi], for the ticks of an axis. */
export function niceTicks(lo, hi, count = 5) {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / Math.max(1, count - 1);
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = [1, 2, 2.5, 5, 10].map((f) => f * power).find((u) => u >= raw) || 10 * power;
  const ticks = [];
  for (let v = Math.ceil(lo / unit) * unit; v <= hi + unit * 1e-9; v += unit) ticks.push(Math.abs(v) < unit * 1e-9 ? 0 : Number(v.toPrecision(12)));
  return ticks;
}

/** A label under the x axis, centred on its tick but kept inside the canvas: the last tick of a chart often lies on its right edge. */
function xTickLabel(ctx, label, x, y, width) {
  const half = ctx.measureText(label).width / 2;
  ctx.fillText(label, Math.min(Math.max(x, half + 1), width - half - 1), y);
}


const LINE_ASPECT = 0.56;
const LINE_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };
const HIST_ASPECT = 0.56;
const HIST_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };

/** Where the plot of drawLineChart lies on a canvas of this width, and the pixel of every x value. */
function lineLayout(data, width) {
  const height = Math.round(width * LINE_ASPECT);
  const margin = LINE_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const x0 = data.x[0];
  const x1 = data.x[data.x.length - 1];
  const scale = (v) => (data.logX ? (Math.log(v) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) : (v - x0) / (x1 - x0));
  const px = (v) => margin.left + w * scale(v);
  return { margin, w, h, height, px, xs: data.x.map(px) };
}

/**
 * Line chart: one line per series over the same x values, on linear or
 * logarithmic axes, each with an optional shaded band (a confidence
 * interval), dashed or dotted (a bound, a theoretical line), with or without
 * dots; null values are skipped. The colours are palette.series in order, or
 * the one of `colorIndex`; the legend is written in the page, under the
 * figure, where it can be read and translated.
 */
export function drawLineChart(canvas, { x, series, logX = false, logY = false, yMin = 0, yMax = 1, yTicks = [], xTicks = [], yFormat = null, hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, LINE_ASPECT, knownWidth);
  const { margin, w, h, px } = lineLayout({ x, logX }, width);
  const ty = (v) => (logY ? Math.log10(v) : v);
  const lo = ty(yMin);
  const hi = ty(yMax);
  const py = (v) => {
    const t = logY && !(v > 0) ? lo : ty(v);
    return margin.top + h * (1 - (Math.min(hi, Math.max(lo, t)) - lo) / (hi - lo));
  };
  const shown = (v) => v !== null && v !== undefined && !Number.isNaN(v) && (!logY || v > 0);
  const label = yFormat || ((v) => axisLabel(v, decimal));
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'right';
  for (const v of yTicks) {
    ctx.beginPath();
    ctx.moveTo(margin.left, py(v));
    ctx.lineTo(margin.left + w, py(v));
    ctx.stroke();
    ctx.fillText(label(v), margin.left - 4, py(v) + 4);
  }
  ctx.textAlign = 'center';
  for (const v of xTicks) {
    ctx.beginPath();
    ctx.moveTo(px(v), margin.top);
    ctx.lineTo(px(v), margin.top + h);
    ctx.stroke();
    xTickLabel(ctx, axisLabel(v, decimal), px(v), margin.top + h + 15, width);
  }
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, w, h);
  ctx.clip();
  series.forEach((s, i) => {
    if (hidden.includes(`series:${i}`)) return;
    const color = pal.series[(s.colorIndex ?? i) % pal.series.length];
    const points = x.map((v, j) => [px(v), s.values[j]]).filter(([, v]) => shown(v));
    if (s.band) {
      const band = x.map((v, j) => [px(v), s.band[j]]).filter(([, b]) => b && !Number.isNaN(b[0]) && !Number.isNaN(b[1]));
      if (band.length > 1) {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = color;
        ctx.beginPath();
        band.forEach(([X, b], j) => (j ? ctx.lineTo(X, py(b[1])) : ctx.moveTo(X, py(b[1]))));
        for (let j = band.length - 1; j >= 0; j--) ctx.lineTo(band[j][0], py(band[j][1][0]));
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    if (!s.dotsOnly) {
      ctx.strokeStyle = color;
      ctx.lineWidth = s.dashed || s.dotted ? 1.5 : 2;
      ctx.setLineDash(s.dashed ? [5, 4] : s.dotted ? [2, 3] : []);
      ctx.beginPath();
      points.forEach(([X, v], j) => (j ? ctx.lineTo(X, py(v)) : ctx.moveTo(X, py(v))));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (s.dots ?? (s.dotsOnly || (!s.dashed && !s.dotted))) {
      ctx.fillStyle = color;
      for (const [X, v] of points) {
        ctx.beginPath();
        ctx.arc(X, py(v), 2.6, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });
  ctx.restore();
}

/** Where the plot of drawHistogram lies on a canvas of this width. */
function histLayout(data, width) {
  const height = Math.round(width * HIST_ASPECT);
  const margin = HIST_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const px = (v) => margin.left + (w * (v - data.x0)) / (data.x1 - data.x0);
  return { margin, w, h, height, px };
}

/**
 * Histogram on a continuous axis: the bars [{ from, to, value }] (the
 * simulation, as densities), a curve (`curve`, points [x, y] of a density,
 * such as the normal one) and an optional vertical line at `marker` (the
 * exact value). The legend is in the page; `hidden` lists the parts it
 * hides ('bars', 'curve', 'marker'), which still count for the axis.
 */
export function drawHistogram(canvas, { x0, x1, bars, curve = null, marker = null, yMax = null, xTicks = [], hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, HIST_ASPECT, knownWidth);
  const { margin, w, h, px } = histLayout({ x0, x1 }, width);
  let top = yMax;
  if (top === null) {
    top = 1e-12;
    for (const b of bars) top = Math.max(top, b.value);
    if (curve) for (const [, v] of curve) top = Math.max(top, v);
    top *= 1.08;
  }
  const py = (v) => margin.top + h * (1 - Math.min(1, v / top));
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'center';
  for (const v of xTicks) {
    ctx.beginPath();
    ctx.moveTo(px(v), margin.top);
    ctx.lineTo(px(v), margin.top + h);
    ctx.stroke();
    xTickLabel(ctx, axisLabel(v, decimal), px(v), margin.top + h + 15, width);
  }
  ctx.textAlign = 'right';
  for (const v of niceTicks(0, top / 1.08, 3)) {
    ctx.beginPath();
    ctx.moveTo(margin.left, py(v));
    ctx.lineTo(margin.left + w, py(v));
    ctx.stroke();
    ctx.fillText(axisLabel(v, decimal), margin.left - 4, py(v) + 4);
  }
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, w, h);
  ctx.clip();
  ctx.fillStyle = pal.series[0];
  ctx.globalAlpha = 0.85;
  for (const b of hidden.includes('bars') ? [] : bars) {
    const left = px(b.from);
    const right = px(b.to);
    const gap = right - left > 4 ? 0.6 : 0;
    ctx.fillRect(left + gap, py(b.value), Math.max(0.8, right - left - 2 * gap), margin.top + h - py(b.value));
  }
  ctx.globalAlpha = 1;
  if (curve && curve.length > 1 && !hidden.includes('curve')) {
    ctx.strokeStyle = pal.series[2];
    ctx.lineWidth = 2;
    ctx.beginPath();
    curve.forEach(([X, v], i) => (i ? ctx.lineTo(px(X), py(v)) : ctx.moveTo(px(X), py(v))));
    ctx.stroke();
  }
  if (marker !== null && !hidden.includes('marker')) {
    ctx.strokeStyle = pal.reference;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(px(marker), margin.top);
    ctx.lineTo(px(marker), margin.top + h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}



const STACK_MARGIN = { left: 96, right: 14, top: 8, bottom: 26 };
const STACK_ROW = 26;
const STACK_GAP = 10;

/** Where the bars of drawStackedBars lie: one row per bar, the shares from 0 to 1 across the plot. */
function stackLayout(data, width) {
  const margin = { ...STACK_MARGIN, left: Math.max(56, Math.min(STACK_MARGIN.left, Math.round(width * 0.24))) };
  const n = data.rows.length;
  const h = n * STACK_ROW + (n - 1) * STACK_GAP + (data.separate ? STACK_GAP : 0);
  const height = margin.top + h + margin.bottom;
  const w = width - margin.left - margin.right;
  const px = (v) => margin.left + w * v;
  const top = (i) => margin.top + i * (STACK_ROW + STACK_GAP) + (data.separate && i === n - 1 ? STACK_GAP : 0);
  return { margin, w, h, height, px, top };
}

/**
 * Bars of conditional shares, one per row, each from 0 to 100%: the row
 * { label, values } has one segment per level (their shares add to 1), in
 * the colours of the palette, so the bars of the levels of X can be
 * compared with each other and with the last one (`separate`: the
 * marginal distribution, set a little apart). `hidden` lists the segments
 * the legend hides ('seg:j'): their place stays empty, the others do not
 * move.
 */
export function drawStackedBars(canvas, { rows, separate = false, hidden = [], width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width = knownWidth || canvas.clientWidth || 600;
  const L = stackLayout({ rows, separate }, width);
  const { ctx } = setupCanvas(canvas, L.height / width, width);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, L.height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'center';
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    ctx.moveTo(L.px(v), L.margin.top);
    ctx.lineTo(L.px(v), L.margin.top + L.h);
    ctx.stroke();
    xTickLabel(ctx, `${Math.round(v * 100)}%`, L.px(v), L.margin.top + L.h + 16, width);
  }
  rows.forEach((row, i) => {
    const y = L.top(i);
    let acc = 0;
    row.values.forEach((v, j) => {
      const share = Number.isFinite(v) ? v : 0;
      if (!hidden.includes(`seg:${j}`) && share > 0) {
        ctx.fillStyle = pal.series[j % pal.series.length];
        ctx.globalAlpha = 0.88;
        ctx.fillRect(L.px(acc), y, Math.max(0.6, L.px(acc + share) - L.px(acc)), STACK_ROW);
        ctx.globalAlpha = 1;
      }
      acc += share;
    });
    ctx.strokeStyle = pal.grid;
    ctx.strokeRect(L.px(0), y, L.w, STACK_ROW);
    ctx.fillStyle = pal.text;
    ctx.textAlign = 'right';
    const label = row.label.length > 16 ? `${row.label.slice(0, 15)}…` : row.label;
    ctx.fillText(label, L.margin.left - 6, y + STACK_ROW / 2 + 4);
  });
}

const GROUP_ASPECT = 0.5;
const GROUP_MARGIN = { left: 48, right: 12, top: 10, bottom: 30 };

/** Where the bars of drawGroupedBars lie: the categories across, one bar per series inside each. */
function groupLayout(data, width) {
  const height = Math.round(width * GROUP_ASPECT);
  const margin = GROUP_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const k = data.categories.length;
  const s = data.series.length;
  const slot = w / k;
  const inner = slot * 0.78;
  const bar = inner / s;
  const x = (cat, ser) => margin.left + cat * slot + (slot - inner) / 2 + ser * bar;
  const py = (v) => margin.top + h * (1 - Math.min(1, Math.max(0, v / data.yMax)));
  return { margin, w, h, height, slot, bar, x, py };
}

/**
 * Bars side by side: for every category (a level, a department) one bar per
 * series ({ values, colorIndex }), from 0 up, on the scale [0, yMax] with
 * the ticks `yTicks` (yFormat writes them). `hidden` lists the series the
 * legend hides ('series:s'): their bars leave an empty place.
 */
export function drawGroupedBars(canvas, { categories, series, yMax, yTicks = [], yFormat = null, hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, GROUP_ASPECT, knownWidth);
  const L = groupLayout({ categories, series, yMax }, width);
  const label = yFormat || ((v) => axisLabel(v, decimal));
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'right';
  for (const v of yTicks) {
    ctx.beginPath();
    ctx.moveTo(L.margin.left, L.py(v));
    ctx.lineTo(L.margin.left + L.w, L.py(v));
    ctx.stroke();
    ctx.fillText(label(v), L.margin.left - 4, L.py(v) + 4);
  }
  ctx.strokeRect(L.margin.left, L.margin.top, L.w, L.h);
  series.forEach((s, j) => {
    if (hidden.includes(`series:${j}`)) return;
    ctx.fillStyle = pal.series[(s.colorIndex ?? j) % pal.series.length];
    ctx.globalAlpha = s.dim ? 0.45 : 0.88;
    s.values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      const top = L.py(v);
      ctx.fillRect(L.x(i, j) + 0.5, top, Math.max(0.8, L.bar - 1), L.margin.top + L.h - top);
    });
    ctx.globalAlpha = 1;
  });
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'center';
  categories.forEach((name, i) => {
    const text = name.length > 12 ? `${name.slice(0, 11)}…` : name;
    xTickLabel(ctx, text, L.margin.left + (i + 0.5) * L.slot, L.margin.top + L.h + 16, width);
  });
}

/** The height that a chart function gives a canvas of this width, to reserve the space before drawing. */
export function chartHeight(draw, data, width) {
  if (draw === drawLineChart) return lineLayout(data, width).height;
  if (draw === drawStackedBars) return stackLayout(data, width).height;
  if (draw === drawGroupedBars) return groupLayout(data, width).height;
  return histLayout(data, width).height;
}

/**
 * What lies under the point (x, y) of a chart drawn at this width, in CSS
 * pixels from its top left corner; null outside the plot or on a hidden
 * part. For lines, the index of the nearest x; for histograms, the bar; for
 * stacked bars, the segment of a row; for grouped bars, the category (the
 * label lists its bars). `rect` is the rectangle to outline.
 */
export function chartHitTest(draw, data, width, x, y) {
  const off = data.hidden || [];
  if (draw === drawLineChart) {
    const { margin, h, w, xs } = lineLayout(data, width);
    if (x < margin.left - 6 || x > margin.left + w + 6 || y < margin.top || y > margin.top + h) return null;
    let index = 0;
    xs.forEach((X, i) => {
      if (Math.abs(X - x) < Math.abs(xs[index] - x)) index = i;
    });
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawStackedBars) {
    const L = stackLayout(data, width);
    const i = data.rows.findIndex((_, k) => y >= L.top(k) && y <= L.top(k) + STACK_ROW);
    if (i < 0 || x < L.px(0) || x > L.px(1)) return null;
    const v = (x - L.margin.left) / L.w;
    let acc = 0;
    for (let j = 0; j < data.rows[i].values.length; j++) {
      const share = data.rows[i].values[j] || 0;
      if (share > 0 && v >= acc && v <= acc + share) {
        if (off.includes(`seg:${j}`)) return null;
        return { kind: 'segment', index: i, segment: j, rect: { x: L.px(acc), y: L.top(i), width: Math.max(2, L.px(acc + share) - L.px(acc)), height: STACK_ROW } };
      }
      acc += share;
    }
    return null;
  }
  if (draw === drawGroupedBars) {
    const L = groupLayout(data, width);
    if (x < L.margin.left || x > L.margin.left + L.w || y < L.margin.top || y > L.margin.top + L.h) return null;
    if (data.series.every((_, j) => off.includes(`series:${j}`))) return null;
    const index = Math.min(data.categories.length - 1, Math.floor((x - L.margin.left) / L.slot));
    return { kind: 'bar', index, rect: { x: L.margin.left + index * L.slot, y: L.margin.top, width: L.slot, height: L.h } };
  }
  const { margin, w, h, px } = histLayout(data, width);
  if (x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
  if (off.includes('bars')) return null;
  const index = data.bars.findIndex((b) => x >= px(b.from) && x < px(b.to));
  if (index < 0) return null;
  const b = data.bars[index];
  return { kind: 'bar', index, rect: { x: px(b.from), y: margin.top, width: Math.max(2, px(b.to) - px(b.from)), height: h } };
}

/**
 * The reverse of chartHitTest: what the pointer would hit on the point,
 * the row of stacked bars or the category `index`; null for any other
 * chart or index. A row of a table uses it to outline its part.
 */
export function chartHitAt(draw, data, width, index) {
  if (draw === drawLineChart) {
    const { margin, h, xs } = lineLayout(data, width);
    if (!(index >= 0 && index < xs.length)) return null;
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawStackedBars) {
    if (!(index >= 0 && index < data.rows.length)) return null;
    const L = stackLayout(data, width);
    return { kind: 'segment', index, rect: { x: L.px(0), y: L.top(index), width: L.w, height: STACK_ROW } };
  }
  if (draw === drawGroupedBars) {
    if (!(index >= 0 && index < data.categories.length)) return null;
    const L = groupLayout(data, width);
    return { kind: 'bar', index, rect: { x: L.margin.left + index * L.slot, y: L.margin.top, width: L.slot, height: L.h } };
  }
  return null;
}

/**
 * Explains a chart under the pointer: the bar or the point below the
 * mouse, or below the finger after a tap, gets an outline and a label with
 * the text describe(hit), inserted as plain text. Both stay inside the
 * canvas's parent, which must be positioned. `link` ties the chart to a
 * table, as { table() (the element, or null), row(hit) (the index of the
 * row in the body, -1 for none), point(row) (the index of its point) }:
 * the row of the point under the pointer gets the outline too, and a row
 * under the pointer, or tapped, outlines its point. Returns the function
 * that removes them.
 */
export const attachChartTooltip = (canvas, { draw, data, describe: explain, link = null }) =>
  attachPointerLabel(
    canvas,
    (x, y, width) => {
      const hit = chartHitTest(draw, data, width, x, y);
      const text = hit && explain(hit);
      return text ? { rect: hit.rect, text, row: link ? link.row(hit) : -1 } : null;
    },
    link && {
      table: link.table,
      locate: (row, width) => {
        const hit = chartHitAt(draw, data, width, link.point(row));
        return hit && hit.rect;
      },
    },
  );

/**
 * The same label for any canvas: locate(x, y, width) says what is under
 * the point, as { rect, text, row? }, or null. With `link`, { table(),
 * locate(row, width) }, the row `row` of the table's body is marked (class
 * is-marked) while its point is under the pointer, and the other way round:
 * locate(row, width) gives the rectangle of a row on the canvas, or null.
 */
export function attachPointerLabel(canvas, locate, link = null) {
  const box = canvas.parentElement;
  const mark = document.createElement('div');
  const tip = document.createElement('div');
  mark.className = 'chart-mark';
  tip.className = 'chart-tip';
  // the canvas already has its description; the label only repeats numbers on screen
  mark.setAttribute('aria-hidden', 'true');
  tip.setAttribute('aria-hidden', 'true');
  mark.hidden = true;
  tip.hidden = true;
  box.append(mark, tip);
  canvas.classList.add('has-tip');
  let frame = 0;
  let shown = null;
  // where the pointer is while the label is on screen: refresh() asks again what is under it
  let pointer = null;
  // the marked row of the linked table, and whether the outline on the canvas comes from a row
  let marked = null;
  let fromRow = false;
  // a row marked from the chart and hidden in the scrolling box of its table comes into view,
  // just inside the edge; only the box scrolls, never the page, so the chart stays under the pointer
  const revealRow = (row) => {
    const table = row.closest('table');
    const area = table && table.parentElement;
    if (!area || !/auto|scroll/.test(getComputedStyle(area).overflowY)) return;
    const a = area.getBoundingClientRect();
    // the part of the box on screen, below the header that stays on top
    const top = Math.max(a.top + area.clientTop + (table.tHead ? table.tHead.offsetHeight : 0), 0);
    const bottom = Math.min(a.top + area.clientTop + area.clientHeight, window.innerHeight);
    if (bottom <= top) return;
    const r = row.getBoundingClientRect();
    let by = 0;
    if (r.top < top || r.height > bottom - top) by = r.top - top;
    else if (r.bottom > bottom) by = r.bottom - bottom;
    if (Math.abs(by) < 1) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    area.scrollTo({ top: area.scrollTop + by, behavior: reduced ? 'auto' : 'smooth' });
  };
  const markRow = (index, reveal = false) => {
    const table = link && link.table();
    const row = (table && index >= 0 && table.tBodies[0] && table.tBodies[0].rows[index]) || null;
    if (row === marked) return;
    if (marked) marked.classList.remove('is-marked');
    if (row) row.classList.add('is-marked');
    marked = row;
    if (row && reveal) revealRow(row);
  };
  const hide = () => {
    mark.hidden = true;
    tip.hidden = true;
    shown = null;
    pointer = null;
    fromRow = false;
    markRow(-1);
  };
  const place = (rect) => {
    Object.assign(mark.style, {
      left: `${canvas.offsetLeft + rect.x}px`,
      top: `${canvas.offsetTop + rect.y}px`,
      width: `${Math.max(2, rect.width)}px`,
      height: `${rect.height}px`,
    });
    mark.classList.toggle('is-thin', rect.width < 6);
    mark.hidden = false;
  };
  const show = (clientX, clientY) => {
    pointer = { clientX, clientY };
    fromRow = false;
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const hit = locate(x, y, r.width);
    if (!hit) {
      mark.hidden = true;
      tip.hidden = true;
      shown = null;
      markRow(-1);
      return;
    }
    const { text } = hit;
    const left = canvas.offsetLeft;
    const top = canvas.offsetTop;
    place(hit.rect);
    markRow(hit.row ?? -1, true);
    if (text !== shown) {
      tip.textContent = text;
      shown = text;
    }
    tip.hidden = false;
    // above and to the right of the pointer, flipped near the edges of the figure
    let tx = left + x + 14;
    if (tx + tip.offsetWidth > box.clientWidth) tx = Math.max(0, left + x - tip.offsetWidth - 14);
    let ty = top + y - tip.offsetHeight - 12;
    if (ty < 0) ty = top + y + 18;
    tip.style.left = `${tx}px`;
    tip.style.top = `${ty}px`;
  };
  // the other way round: a row of the linked table under the mouse, or tapped, outlines its point
  const rowAt = (target) => {
    const table = link && link.table();
    const row = table && target instanceof Element ? target.closest('tr') : null;
    return row && row.parentElement.tagName === 'TBODY' && row.parentElement.parentElement === table ? row : null;
  };
  const showRow = (row) => {
    const rect = link.locate(row.sectionRowIndex, canvas.getBoundingClientRect().width);
    tip.hidden = true;
    shown = null;
    pointer = null;
    fromRow = true;
    if (rect) place(rect);
    else mark.hidden = true;
    markRow(rect ? row.sectionRowIndex : -1);
  };
  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => show(clientX, clientY));
  };
  // a finger leaves the canvas as soon as it is lifted: the label stays until a tap elsewhere
  const onLeave = (e) => {
    if (e.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    hide();
  };
  const onDown = (e) => {
    if (e.pointerType === 'touch') show(e.clientX, e.clientY);
  };
  const onDocumentDown = (e) => {
    const row = rowAt(e.target);
    if (row) showRow(row);
    else if (e.target !== canvas) hide();
  };
  const onDocumentOver = (e) => {
    if (e.pointerType === 'touch') return;
    const row = rowAt(e.target);
    if (row) showRow(row);
    else if (fromRow) hide();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerdown', onDocumentDown);
  if (link) document.addEventListener('pointerover', onDocumentOver);
  const detach = () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerdown', onDocumentDown);
    document.removeEventListener('pointerover', onDocumentOver);
    markRow(-1);
    canvas.classList.remove('has-tip');
    mark.remove();
    tip.remove();
  };
  // a chart that changes under a still pointer calls it after every frame
  detach.refresh = () => {
    if (pointer) show(pointer.clientX, pointer.clientY);
  };
  return detach;
}

// ---------------------------------------------------------------------------
// 8. Verifiche e riga di comando
// ---------------------------------------------------------------------------

/*
 * Independent checks: the counts of the data against an independent Python
 * reading of the original file; the tables, the tests and the residuals
 * against SciPy 1.17.1 and NumPy; the p-values too small for SciPy, which
 * underflows even in logarithms, against mpmath at 50 digits; Berkeley's
 * Cochran-Mantel-Haenszel test against R (mantelhaen.test) and an exact
 * Python computation with fractions; the generators against their reference
 * C code (Homework #4) and an independent Python implementation (#5).
 */
const protocolClass = () => tableStats(nslTable('protocol', 'class').counts);

export const CHECK_VECTORS = Object.freeze([
  { group: 'data', name: 'NSL-KDD, KDDTest+: the records (22,544 lines of 43 fields)', expected: 22544, compute: () => nslColumns().n },
  { group: 'data', name: 'Records per protocol: tcp, udp, icmp (Python, from the file)', expected: '18880 2621 1043', compute: () => protocolClass().rowTotals.join(' ') },
  { group: 'data', name: 'Records per class: normal, DoS, Probe, R2L, U2R (Python, the file and the categories of the page)', expected: '9711 7458 2421 2887 67', compute: () => protocolClass().colTotals.join(' ') },
  { group: 'tables', name: 'Protocol x class: the row of tcp (Python)', expected: '7842 6738 1864 2369 67', compute: () => nslTable('protocol', 'class').counts[0].join(' ') },
  { group: 'tables', name: 'Protocol x class: expected tcp x normal, 18880 x 9711 / 22544 (NumPy)', expected: 8132.704045422285, compute: () => protocolClass().expected[0][0] },
  { group: 'tables', name: 'Protocol x class: chi-square (SciPy chi2_contingency)', expected: 2317.733021402818, compute: () => protocolClass().chi2 },
  { group: 'tables', name: 'Protocol x class: log10 of the p-value (mpmath, 50 digits; SciPy underflows)', expected: -494.8742571142892, compute: () => protocolClass().log10p },
  { group: 'tables', name: 'Protocol x class: G statistic (SciPy, lambda_ = log-likelihood)', expected: 3127.579318894243, compute: () => protocolClass().G },
  { group: 'tables', name: "Protocol x class: Cramer's V (SciPy contingency.association)", expected: 0.2267259438120658, compute: () => protocolClass().V },
  { group: 'tables', name: 'Protocol x class: adjusted residual of udp x normal, the largest (NumPy, Haberman)', expected: 27.14771129410081, compute: () => protocolClass().adjusted[1][0] },
  { group: 'tables', name: 'Protocol x outcome: chi-square (SciPy)', expected: 1165.8963133345965, compute: () => tableStats(nslTable('protocol', 'outcome').counts).chi2 },
  { group: 'tables', name: 'Protocol x outcome: log10 of the p-value (SciPy chi2.logsf)', expected: -253.17116767627994, compute: () => tableStats(nslTable('protocol', 'outcome').counts).log10p },
  { group: 'tables', name: 'Flag x class: chi-square (SciPy)', expected: 15054.379066629064, compute: () => tableStats(nslTable('flag', 'class').counts).chi2 },
  { group: 'tables', name: 'Flag x class: log10 of the p-value (mpmath)', expected: -3212.444851520565, compute: () => tableStats(nslTable('flag', 'class').counts).log10p },
  { group: 'tests', name: 'Chi-square tail at 3.841458820694124 with 1 degree of freedom (SciPy chi2.sf)', expected: 0.04999999999999989, compute: () => chi2Tail(3.841458820694124, 1).p },
  { group: 'tests', name: 'Chi-square tail at 10 with 4 degrees of freedom (SciPy)', expected: 0.04042768199451279, compute: () => chi2Tail(10, 4).p },
  { group: 'tests', name: 'Chi-square tail at 250 with 12 degrees of freedom (SciPy)', expected: 1.3681670503533537e-46, compute: () => chi2Tail(250, 12).p },
  { group: 'small', name: "Fisher's exact test, the lady tasting tea [[3, 1], [1, 3]] (SciPy fisher_exact)", expected: 0.48571428571428565, compute: () => fisherExact([[3, 1], [1, 3]]).p },
  { group: 'small', name: "Yates's correction on the same table (SciPy chi2_contingency, correction=True)", expected: 0.5, compute: () => yatesTest([[3, 1], [1, 3]]).chi2 },
  { group: 'small', name: "Fisher's exact test, Berkeley's six departments together (SciPy)", expected: 4.835903179337353e-22, compute: () => fisherExact(ucbTable()).p },
  { group: 'simpson', name: "Berkeley's six departments together: chi-square without correction (SciPy)", expected: 92.20528041152762, compute: () => tableStats(ucbTable()).chi2 },
  { group: 'simpson', name: 'Berkeley by department: Cochran-Mantel-Haenszel with correction (R mantelhaen.test: 1.4269; exact Python)', expected: 1.4269462285866941, compute: () => cmhTest(UCB.departments.map((_, d) => ucbTable(d))).statistic },
  { group: 'simpson', name: 'Its p-value (R: 0.2323; mpmath)', expected: 0.2322634628170472, compute: () => cmhTest(UCB.departments.map((_, d) => ucbTable(d))).p },
  { group: 'simpson', name: 'Mantel-Haenszel common odds ratio, men against women (R: 0.9046968)', expected: 0.904696828258623, compute: () => cmhTest(UCB.departments.map((_, d) => ucbTable(d))).oddsRatio },
  { group: 'generator', name: 'xoshiro128** from (1, 2, 3, 4)', expected: '11520 0 5927040 70819200 2031721883 1637235492', compute: () => { const g = xoshiro128ss(1, 2, 3, 4); return Array.from({ length: 6 }, g).join(' '); } },
  { group: 'generator', name: 'SplitMix64 from 0', expected: '16294208416658607535 7960286522194355700 487617019471545679', compute: () => { const g = splitMix64(0); return Array.from({ length: 3 }, g).join(' '); } },
  { group: 'generator', name: 'Main stream, seed 2026 (independent Python code)', expected: '1441997221 504457382 1212262897 368519188', compute: () => { const g = generator(2026, 'main', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Box-Muller: the first two normal values, seed 2026 (Python)', expected: '-0.2973509092608619 1.447208380667575', compute: () => { const z = normalSampler(generator(2026, 'main', 0)); return `${z()} ${z()}`; } },
]);

/** The groups of the checks, in the order the page shows them. */
export const CHECK_GROUPS = Object.freeze(['data', 'tables', 'tests', 'small', 'simpson', 'generator']);

/** Every check, with what was expected and what came out: equal strings, or numbers within a relative error of 10^-9. */
export function verifyAll() {
  return CHECK_VECTORS.map((v) => {
    const actual = v.compute();
    const ok = typeof v.expected === 'string' ? actual === v.expected : Math.abs(actual - v.expected) <= 1e-9 * Math.max(1e-300, Math.abs(v.expected));
    return { group: v.group, name: v.name, expected: String(v.expected), actual: String(actual), ok };
  });
}

const pad = (v, width) => String(v).padStart(width);
const pLabel = (p, log10p) => (p >= 1e-300 ? (p < 0.001 ? p.toExponential(2) : p.toFixed(4)) : `10^${log10p.toFixed(1)}`);

/**
 * Command line: node homework6.js [--x protocol] [--f class] [--merge]
 * [--seed 2026] [--sample 100] [--perms 2000]. The variables are protocol,
 * service, flag, class and outcome. Options are checked strictly: anything
 * unknown or malformed prints the usage.
 */
export function runCli(argv, print = console.log) {
  const usage = () => {
    print(`usage: node homework6.js [--x ${DEFAULT_PAIR.x}] [--f ${DEFAULT_PAIR.f}] [--merge] [--seed ${DEFAULT_SEED}] [--sample 100] [--perms 2000]`);
    print(`       variables: ${VARIABLES.join(', ')} (X and F different); sample from 10 to ${SOURCE.records}; perms from 100 to 20000.`);
    return 1;
  };
  const o = { x: DEFAULT_PAIR.x, f: DEFAULT_PAIR.f, merge: false, seed: DEFAULT_SEED, sample: 100, perms: 2000 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--merge') o.merge = true;
    else if ((arg === '--x' || arg === '--f') && VARIABLES.includes(value)) {
      o[arg.slice(2)] = value;
      i++;
    } else if (arg === '--seed' && value !== undefined && parseInteger(value, LIMITS.seed).ok) {
      o.seed = parseInteger(value, LIMITS.seed).value;
      i++;
    } else if (arg === '--sample' && value !== undefined && parseInteger(value, [10, SOURCE.records]).ok) {
      o.sample = parseInteger(value, [10, SOURCE.records]).value;
      i++;
    } else if (arg === '--perms' && value !== undefined && parseInteger(value, [100, 20000]).ok) {
      o.perms = parseInteger(value, [100, 20000]).value;
      i++;
    } else return usage();
  }
  if (o.x === o.f) return usage();
  const name = (key) => (key === OTHERS ? 'others' : key);
  print('Homework #6 - Statistics: statistical independence');
  print(`Data: ${SOURCE.dataset}, ${SOURCE.records} records. ${SOURCE.paper}. ${SOURCE.url}`);
  print('');
  const pair = pairCodes(o.x, o.f, { merge: o.merge });
  const t = contingency(pair.x, pair.f, pair.xLevels.length, pair.fLevels.length);
  const s = tableStats(t);
  const width = Math.max(8, ...pair.xLevels.map((k) => name(k).length));
  const cell = 10;
  const line = (label, values) => print(`  ${label.padEnd(width)} ${values.map((v) => pad(v, cell)).join('')}`);
  print(`Contingency table: X = ${o.x} (rows), F = ${o.f} (columns)${o.merge ? ', rare levels merged' : ''}`);
  line('', [...pair.fLevels.map(name), 'total']);
  t.forEach((row, i) => line(name(pair.xLevels[i]), [...row, s.rowTotals[i]]));
  line('total', [...s.colTotals, s.N]);
  print('');
  print('Conditional frequencies of F given X (row %), and the marginal of F:');
  t.forEach((row, i) => line(name(pair.xLevels[i]), s.rowProfiles[i] ? s.rowProfiles[i].map((v) => `${(100 * v).toFixed(1)}%`) : row.map(() => '-')));
  line('marginal', s.colShares.map((v) => `${(100 * v).toFixed(1)}%`));
  print('');
  print('Expected frequencies under independence, n_i. n_.j / N:');
  s.expected.forEach((row, i) => line(name(pair.xLevels[i]), row.map((v) => v.toFixed(1))));
  print('');
  print(`Chi-square = ${s.chi2.toFixed(3)} with ${s.df} degrees of freedom, p = ${pLabel(s.p, s.log10p)}: independence ${s.p < SIGNIFICANCE ? 'rejected' : 'not rejected'} at the ${SIGNIFICANCE * 100}% level`);
  print(`G = ${s.G.toFixed(3)}, p = ${pLabel(s.gP, s.gLog10p)}; Cramer's V = ${s.V.toFixed(4)} (w = ${s.w.toFixed(4)}, ${s.effect})`);
  let rule = 'satisfied';
  if (!s.small.cochran) rule = o.merge ? 'still violated: a rare level is alone and cannot merge' : 'violated (try --merge)';
  print(`Expected frequencies under 5: ${s.small.below5} of ${s.small.cells} cells, under 1: ${s.small.below1}; Cochran's rule ${rule}`);
  print('');
  print('Adjusted residuals (beyond +-1.96: the cell differs from independence at the 5% level):');
  s.adjusted.forEach((row, i) => line(name(pair.xLevels[i]), row.map((v) => (v === null ? '-' : v.toFixed(2)))));
  print('');
  const idx = sampleIndices(o.sample, o.seed);
  const px = Uint8Array.from(idx, (k) => pair.x[k]);
  const pf = Uint8Array.from(idx, (k) => pair.f[k]);
  const started = now();
  const perm = permutationTest(px, pf, pair.xLevels.length, pair.fLevels.length, o.perms, o.seed);
  print(`Permutation test on ${o.sample} records drawn with seed ${o.seed}: chi-square ${perm.observed.toFixed(3)}, ${perm.exceed} of ${perm.B} shuffles at least as large, p = ${perm.pPerm.toFixed(4)} (formula: ${pLabel(perm.p, Math.log10(perm.p))}) in ${(now() - started).toFixed(0)} ms`);
  print('');
  const all = tableStats(ucbTable());
  const cmh = cmhTest(UCB.departments.map((_, d) => ucbTable(d)));
  print("Simpson's paradox, Berkeley 1973: admitted men " + `${(100 * ucbTable()[0][0] / all.rowTotals[0]).toFixed(1)}%, women ${(100 * ucbTable()[1][0] / all.rowTotals[1]).toFixed(1)}%: chi-square ${all.chi2.toFixed(2)}, p = ${pLabel(all.p, all.log10p)}`);
  UCB.departments.forEach((d, k) => {
    const [[ma, mr], [fa, fr]] = ucbTable(k);
    print(`  department ${d}: men ${(100 * ma / (ma + mr)).toFixed(1)}%, women ${(100 * fa / (fa + fr)).toFixed(1)}%`);
  });
  print(`  Cochran-Mantel-Haenszel, given the department: ${cmh.statistic.toFixed(4)}, p = ${cmh.p.toFixed(4)}; common odds ratio ${cmh.oddsRatio.toFixed(4)}`);
  print('');
  const checks = verifyAll();
  const failed = checks.filter((c) => !c.ok);
  print(`Checks: ${checks.length - failed.length} of ${checks.length} passed (SciPy 1.17.1, mpmath, R, Python and the reference C code of the generators).`);
  for (const c of failed) print(`  FAILED ${c.name}: expected ${c.expected}, got ${c.actual}`);
  return failed.length ? 1 : 0;
}
