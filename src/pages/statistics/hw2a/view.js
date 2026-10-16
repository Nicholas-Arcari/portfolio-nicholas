// src/pages/statistics/hw2a/view.js
// Logica di presentazione dell'Homework #2, condivisa fra la pagina del sito
// (React) e il programma scaricabile (DOM puro): le sezioni, la lettura dei
// campi, le righe delle tabelle e i dati dei grafici. Tenerla qui impedisce
// che le due versioni dicano cose diverse sugli stessi numeri.
import * as hw from './homework2a.js';

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
export const SECTIONS = [
  { id: 'hw2a-assignment', key: 'assignment', level: 0 },
  { id: 'hw2a-scheme', key: 'scheme', level: 0 },
  { id: 'hw2a-input', key: 'input', level: 1 },
  { id: 'hw2a-keys', key: 'keys', level: 1 },
  { id: 'hw2a-encrypt', key: 'encrypt', level: 1 },
  { id: 'hw2a-decrypt', key: 'decrypt', level: 1 },
  { id: 'hw2a-roles', key: 'roles', level: 1 },
  { id: 'hw2a-verify', key: 'verify', level: 1 },
  { id: 'hw2a-caesar', key: 'caesar', level: 0 },
  { id: 'hw2a-caesar-cipher', key: 'caesarCipher', level: 1 },
  { id: 'hw2a-compare', key: 'compare', level: 1 },
  { id: 'hw2a-properties', key: 'properties', level: 1 },
  { id: 'hw2a-cryptanalysis', key: 'cryptanalysis', level: 0 },
  { id: 'hw2a-corpus', key: 'corpus', level: 1 },
  { id: 'hw2a-algorithm', key: 'algorithm', level: 1 },
  { id: 'hw2a-lengths', key: 'lengths', level: 1 },
  { id: 'hw2a-methods', key: 'methods', level: 1 },
  { id: 'hw2a-limits', key: 'limits', level: 1 },
  { id: 'hw2a-attack', key: 'attack', level: 0 },
  { id: 'hw2a-exhaustive', key: 'exhaustive', level: 1 },
  { id: 'hw2a-bsgs', key: 'bsgs', level: 1 },
  { id: 'hw2a-kangaroo', key: 'kangaroo', level: 1 },
  { id: 'hw2a-scaling', key: 'scaling', level: 1 },
  { id: 'hw2a-differences', key: 'differences', level: 1 },
  { id: 'hw2a-real', key: 'real', level: 1 },
  { id: 'hw2a-weaknesses', key: 'weaknesses', level: 1 },
  { id: 'hw2a-tests', key: 'tests', level: 0 },
  { id: 'hw2a-history', key: 'history', level: 0 },
  { id: 'hw2a-conclusion', key: 'conclusion', level: 0 },
];

/** The entries of the index, with their titles in the chosen language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

// ---------------------------------------------------------------------------
// The fields: private key, message, shift
// ---------------------------------------------------------------------------

/** Longest texts the fields accept: the message is checked again in bytes. */
export const KEY_MAX_LENGTH = 12;
export const MESSAGE_MAX_LENGTH = hw.MESSAGE_MAX_BYTES;
export const SHIFT_MAX_LENGTH = 3;

/** The values the page starts from, and returns to with "restore". */
export const DEFAULT_INPUTS = Object.freeze({
  keyText: String(hw.DEFAULT_KEY),
  message: hw.DEFAULT_MESSAGE,
  shiftText: String(hw.DEFAULT_SHIFT),
});

/** The message typed by the user: not empty, and at most MESSAGE_MAX_BYTES bytes of UTF-8. */
export function parseMessage(text) {
  if (text === '') return { ok: false, error: 'empty' };
  const bytes = hw.utf8(text).length;
  if (bytes > hw.MESSAGE_MAX_BYTES) return { ok: false, error: 'tooLong', bytes };
  return { ok: true, value: text, bytes };
}

/** The three fields, each read on its own: an error in one does not stop the sections that depend on the others. */
export const readInputs = ({ keyText, message, shiftText }) => ({
  key: hw.parsePrivateKey(keyText),
  message: parseMessage(message),
  shift: hw.parseShift(shiftText),
});

/** Whether the fields hold the starting key and message, with the reproducible nonces. */
export const isDefaultInput = (fields, nonces) => nonces === 'seeded' && fields.keyText.trim() === DEFAULT_INPUTS.keyText && fields.message === DEFAULT_INPUTS.message;

/** The line under the fields: the known values with their expected public key, and whether "restore" makes sense. */
export function inputBadge(fields, nonces, I) {
  if (isDefaultInput(fields, nonces)) return { known: true, restore: fields.shiftText.trim() !== DEFAULT_INPUTS.shiftText, text: I.defaultBadge(hw.DEFAULT_PUBLIC_KEY) };
  return { known: false, restore: true, text: I.customBadge };
}

// ---------------------------------------------------------------------------
// 1. The toy scheme
// ---------------------------------------------------------------------------

/** Short form of a long hexadecimal string. */
export const shortHex = (hex, keep = 8) => (hex.length > 2 * keep + 3 ? `${hex.slice(0, keep)}...${hex.slice(-keep)}` : hex);

const hex256 = (n) => n.toString(16).padStart(64, '0');

/** A byte as the tables show it: the character when it is printable ASCII, a middle dot otherwise. */
export function charOf(byte) {
  if (byte === 32) return '␣';
  return byte > 32 && byte < 127 ? String.fromCharCode(byte) : '·';
}

/** The facts of section 1.2 about a key pair. */
export function keyFacts(scheme) {
  const { k, K } = scheme;
  return {
    k: k.toString(),
    hex: `0x${k.toString(16)}`,
    bits: k.toString(2).length,
    binary: k.toString(2).padStart(hw.KEY_BITS, '0'),
    x: hex256(K.x),
    y: hex256(K.y),
    compressed: hw.pointHex(K),
    even: K.y % 2n === 0n,
    onCurve: hw.isOnSecp256k1(K),
    isDefault: k === hw.DEFAULT_KEY,
    matchesReference: hw.pointHex(K) === hw.DEFAULT_PUBLIC_KEY,
  };
}

/** One row per block of the ciphertext: position, byte, nonce and the two points. */
export const blockRows = (blocks) =>
  blocks.map((b) => ({
    position: b.index + 1,
    byte: b.byte,
    char: charOf(b.byte),
    r: shortHex(hex256(b.r), 6),
    C1: shortHex(hw.pointHex(b.C1), 6),
    C2: shortHex(hw.pointHex(b.C2), 6),
  }));

/** The first block, step by step, for section 1.4: what the receiver computes. */
export function firstBlock(blocks, decrypted) {
  if (!blocks.length) return null;
  const b = blocks[0];
  const d = decrypted.blocks[0];
  return {
    byte: b.byte,
    char: charOf(b.byte),
    C1: hw.pointHex(b.C1),
    C2: hw.pointHex(b.C2),
    S: hw.pointHex(d.S),
    M: hw.pointHex(d.M),
    decoded: d.byte,
    sameS: hw.pointsEqual(d.S, b.S),
  };
}

/** The size of the ciphertext: 66 bytes per byte of message. */
export const ciphertextSize = (blocks) => ({ bytes: blocks.length, total: 66 * blocks.length });

/**
 * The line under the nonce buttons: the ciphertext of section 1.3 by its
 * size and SHA-256, so that a new draw shows next to the button that made
 * it, and whether k still decrypts it to the message.
 */
export function cipherSummary(encryption, decryption, nonces, draw) {
  const bytes = hw.ciphertextBytes(encryption.blocks);
  return {
    mode: nonces,
    draw,
    total: bytes.length,
    digest: shortHex(hw.toHex(hw.sha256(bytes))),
    ok: decryption.ok && decryption.text === encryption.text,
  };
}

/** The rows of the checks of section 1.6, grouped. */
export function checkGroups(rows) {
  const groups = [];
  for (const row of rows) {
    if (!groups.length || groups[groups.length - 1].group !== row.group) groups.push({ group: row.group, rows: [] });
    groups[groups.length - 1].rows.push(row);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// 2. The Caesar cipher and the two ciphertexts
// ---------------------------------------------------------------------------

const UPPER = hw.ALPHABET.toUpperCase().split('');

/** The substitution table of a shift: the plain alphabet and the cipher alphabet. */
export const substitution = (shift) => ({ plain: UPPER, cipher: UPPER.map((_, i) => UPPER[(i + shift) % 26]) });

/** The Caesar cipher on the message: ciphertext, decryption, and the most frequent letter with its image. */
export function caesarFacts(message, shift) {
  const cipher = hw.caesar(message, shift);
  const decrypted = hw.caesarDecrypt(cipher, shift);
  const counts = hw.letterCounts(hw.letterIndices(message));
  const letters = counts.reduce((s, c) => s + c, 0);
  const top = counts.indexOf(Math.max(...counts));
  return {
    cipher,
    decrypted,
    ok: decrypted === message,
    letters,
    top: letters ? { letter: hw.ALPHABET[top], count: counts[top], image: hw.ALPHABET[(top + shift) % 26] } : null,
  };
}

/**
 * The letter counts of a text for a bar chart, with the counts expected
 * from the frequencies of the training chapters (L q) as the dashed
 * reference.
 */
export function letterChart(text, decimal = '.') {
  const counts = hw.letterCounts(hw.letterIndices(text));
  const L = counts.reduce((s, c) => s + c, 0);
  return { values: counts, expected: hw.trainingFrequencies().map((q) => q * L), labels: UPPER, allLabels: true, decimal };
}

/** The table of section 2.3: entropy and index of coincidence of the plaintext and of the two ciphertexts. */
export function cipherRows(s) {
  const c = s.ciphers;
  return [
    { key: 'plain', symbols: c.plain.letters, entropy: c.plain.entropy, max: Math.log2(26), ic: c.plain.ic, uniformIc: 1 / 26 },
    { key: 'caesar', symbols: c.plain.letters, entropy: c.caesar.entropy, max: Math.log2(26), ic: c.caesar.ic, uniformIc: 1 / 26 },
    { key: 'ec', symbols: c.ec.counts.reduce((a, b) => a + b, 0), entropy: c.ec.entropy, max: 8, ic: c.ec.ic, uniformIc: 1 / 256 },
  ];
}

/** The bytes of x(C1) and x(C2) of the toy ciphertext, against the uniform expectation. */
export function ecBytesChart(s, decimal = '.') {
  const counts = s.ciphers.ec.counts;
  const N = counts.reduce((a, b) => a + b, 0);
  return { values: counts, expected: N / 256, labels: counts.map((_, i) => String(i)), decimal };
}

// ---------------------------------------------------------------------------
// 3. Statistical cryptanalysis
// ---------------------------------------------------------------------------

/** The role of every chapter of the corpus. */
export function chapterRows(s) {
  const role = (n) => {
    if (hw.SPLIT.test.includes(n)) return 'test';
    return hw.SPLIT.validation.includes(n) ? 'validation' : 'fit';
  };
  return s.corpus.chapters.map((c) => ({ ...c, role: role(c.number) }));
}

/** The letter frequencies of the training chapters (bars) and of the test chapters (dashed). */
export function corpusChart(s, decimal = '.') {
  const share = (counts) => {
    const N = counts.reduce((a, b) => a + b, 0);
    return counts.map((c) => c / N);
  };
  return { values: share(s.corpus.training.counts), expected: share(s.corpus.test.counts), labels: UPPER, allLabels: true, decimal };
}

/** One row per order of the language models: smoothing, cross-entropy on the test chapters, redundancy, unicity distance. */
export const modelRows = (s) =>
  s.models.crossEntropy.map((h, i) => ({ order: i + 1, beta: s.models.betas[i], crossEntropy: h, redundancy: s.models.redundancy[i], unicity: s.models.unicity[i] }));

/** The candidate decryptions of the live attack, from the most to the least probable. */
export function candidateRows(crack, limit = 5) {
  return crack.candidates
    .map((c) => ({ ...c, posterior: crack.posterior[c.shift] }))
    .sort((a, b) => b.posterior - a.posterior || b.logLikelihood - a.logLikelihood)
    .slice(0, limit);
}

/** The posterior of the 26 shifts, with the best one in another colour. */
export const posteriorChart = (crack, decimal = '.') => ({
  values: crack.posterior,
  labels: Array.from({ length: 26 }, (_, s) => String(s)),
  allLabels: true,
  highlight: crack.key === null ? [] : [crack.key],
  max: 1,
  decimal,
});

/** The check of the live attack: the letters decrypted with the best shift, and with the second best, against the English frequencies. */
export function fitChecks(crack, models) {
  if (crack.key === null) return null;
  const second = candidateRows(crack, 2)[1];
  return {
    best: { shift: crack.key, test: hw.letterFit(crack.counts, crack.key, models) },
    second: second ? { shift: second.shift, test: hw.letterFit(crack.counts, second.shift, models) } : null,
  };
}

/** The ticks of the length axis, on a logarithmic scale. */
export const LENGTH_TICKS = [1, 2, 5, 10, 20, 50, 100, 200];
const PERCENT_TICKS = [0, 0.25, 0.5, 0.75, 1];

/** Success of maximum likelihood by length: the rate, its 95% interval and Chernoff's lower bound. */
export function successChart(s, decimal = '.') {
  const c = s.caesar;
  return {
    x: c.lengths,
    logX: true,
    series: [
      { values: c.rates.unigram, band: c.intervals.unigram },
      { values: c.bound, dashed: true },
    ],
    yMin: 0,
    yMax: 1,
    yTicks: PERCENT_TICKS,
    xTicks: LENGTH_TICKS,
    yFormat: (v) => `${Math.round(100 * v)}%`,
    decimal,
  };
}

/** Success of every method by length. */
export function methodsChart(s, decimal = '.') {
  const c = s.caesar;
  return {
    x: c.lengths,
    logX: true,
    series: hw.METHODS.map((m) => ({ values: c.rates[m] })),
    yMin: 0,
    yMax: 1,
    yTicks: PERCENT_TICKS,
    xTicks: LENGTH_TICKS,
    yFormat: (v) => `${Math.round(100 * v)}%`,
    decimal,
  };
}

/** The success levels of the comparison table. */
export const LEVELS = [0.5, 0.9, 0.99];

/** For every method, the shortest length tried that reaches each success level (null if none does). */
export function thresholds(s) {
  const c = s.caesar;
  return hw.METHODS.map((m) => ({
    method: m,
    levels: LEVELS.map((level) => {
      const i = c.rates[m].findIndex((r) => r >= level);
      return i < 0 ? null : c.lengths[i];
    }),
  }));
}

/** The success rate of one method at one length (null if that length was not tried). */
export function rateAt(s, method, length) {
  const i = s.caesar.lengths.indexOf(length);
  return i < 0 ? null : s.caesar.rates[method][i];
}

/** One row per length: trials, rate of every method, interval of maximum likelihood, bound. */
export const lengthRows = (s) =>
  s.caesar.lengths.map((L, i) => ({
    length: L,
    trials: s.caesar.trials[i],
    rates: Object.fromEntries(hw.METHODS.map((m) => [m, s.caesar.rates[m][i]])),
    interval: s.caesar.intervals.unigram[i],
    bound: s.caesar.bound[i],
  }));

// ---------------------------------------------------------------------------
// 4. The attacks
// ---------------------------------------------------------------------------

/** Exhaustive search on the key of section 1: speed, and the time it would take to reach k and to cover the whole range. */
export function exhaustiveSummary(result, key) {
  const rate = result.ms > 0 ? (1000 * result.ops) / result.ms : NaN;
  return {
    ...result,
    rate,
    toKey: Number(key) / rate,
    toAll: Number(hw.KEY_MAX) / rate,
  };
}

/** Baby-step giant-step on the key of section 1: k = i m + j, with the counts of steps. */
export function bsgsSummary(result) {
  if (!result.found) return { ...result, m: result.baby, i: null, j: null };
  const m = result.baby;
  const i = result.giant - 1;
  return { ...result, m, i, j: result.key - i * m };
}

/** All the sizes of the scaling experiment, in order. */
export const scalingBits = (sc) => [...new Set(Object.values(sc.rows).flatMap((rows) => rows.map((r) => r.bits)))].sort((a, b) => a - b);

/** The three attacks of the scaling experiment, in the order of the charts and the tables. */
export const ATTACKS = ['exhaustive', 'bsgs', 'kangaroo'];

/** log2 of the mean operations by key size, measured (points) and as the theory's line with the fitted constant (dashed). */
export function scalingChart(sc, decimal = '.') {
  const bits = scalingBits(sc);
  const measured = ATTACKS.map((m) => ({ values: bits.map((b) => {
    const row = sc.rows[m].find((r) => r.bits === b);
    return row ? Math.log2(row.mean) : null;
  }) }));
  const theory = ATTACKS.map((m, i) => ({ values: bits.map((b) => sc.fits[m].constant + sc.fits[m].exponent * b), dashed: true, colorIndex: i }));
  return {
    x: bits,
    logX: false,
    series: [...measured, ...theory],
    yMin: 0,
    yMax: 34,
    yTicks: [0, 8, 16, 24, 32],
    xTicks: [8, 16, 24, 32],
    yFormat: (v) => String(v),
    decimal,
  };
}

/** The key sizes of the extrapolation table. */
export const EXTRAPOLATION_BITS = [32, 64, 128, 256];

/** A fast machine, for the extrapolation: 10^12 group operations per second. */
export const FAST_RATE = 1e12;

/**
 * The cost of every attack at larger key sizes, with the theory's exponent
 * and the fitted constant, as log2 of the group operations; the time of the
 * best attack at the speed measured here and at FAST_RATE; and the memory
 * of baby-step giant-step, in points.
 */
export function extrapolationRows(sc) {
  return EXTRAPOLATION_BITS.map((bits) => {
    const log2 = Object.fromEntries(ATTACKS.map((m) => [m, sc.fits[m].constant + sc.fits[m].exponent * bits]));
    const best = Math.min(log2.bsgs, log2.kangaroo);
    return { bits, log2, best, here: 2 ** best / sc.rate, fast: 2 ** best / FAST_RATE, memory: bits / 2 };
  });
}

/** The flawed variant of section 4.7: the message with one nonce for every byte, and the attack that reads it without k. */
export function reuseDemo(key, message) {
  const blocks = hw.toyScheme(key, { nonces: () => hw.REUSED_NONCE }).encrypt(message).blocks;
  return { blocks, attack: hw.nonceReuseAttack(blocks) };
}

/** The malleability of section 4.7: every C2 plus G, decrypted with k. */
export const augustusDemo = (scheme, blocks) => scheme.decrypt(hw.shiftCiphertext(blocks, 1));

// ---------------------------------------------------------------------------
// 5. The hypothesis tests
// ---------------------------------------------------------------------------

/** The subjects of the tests, in page order. */
export const TEST_GROUPS = ['corpus', 'caesar', 'ec', 'keys'];

/** What each test should say if everything works as explained: some rejections are the point. */
export const EXPECTED_VERDICTS = Object.freeze({
  corpus: { homogeneity: 'either' },
  caesar: { uniform: 'reject', dependence: 'reject' },
  ec: { uniform: 'notReject', parity: 'notReject', independence: 'notReject' },
  keys: { small: 'notReject', full: 'notReject' },
});

/** Every hypothesis test of the exploration, by subject: [key, test]. The texts name each key. */
export const statTests = hw.statisticalTests;

/** The tests as one list, with how many were rejected and how many as expected. */
export function testSummary(s) {
  const all = TEST_GROUPS.flatMap((group) => statTests(s)[group].map(([key, result]) => ({ group, key, result, expected: EXPECTED_VERDICTS[group][key] })));
  return {
    all,
    count: all.length,
    rejected: all.filter((t) => t.result.verdict === 'reject').length,
    asExpected: all.filter((t) => t.expected === 'either' || t.expected === t.result.verdict).length,
  };
}

// ---------------------------------------------------------------------------
// Chart labels under the pointer
// ---------------------------------------------------------------------------

/**
 * What the label over each chart says for the bar or the point under the
 * pointer (hw.attachChartTooltip), from the same data the chart draws. P
 * is the `tips` part of the texts.
 */
export const tips = {
  letters: (data, P) => ({ from }) => P.letter(UPPER[from], data.values[from], data.expected[from]),
  ecBytes: (data, P) => ({ from, to }) => {
    const part = data.values.slice(from, to);
    return to - from === 1 ? P.byte(from, data.values[from], data.expected) : P.bytes(from, to - 1, Math.min(...part), Math.max(...part), data.expected);
  },
  corpus: (data, P) => ({ from }) => P.frequency(UPPER[from], data.values[from], data.expected[from]),
  posterior: (crack, P) => ({ from }) => P.shift(from, crack.posterior[from], crack.candidates[from].text),
  success: (s, P) => ({ index }) => P.success(s.caesar.lengths[index], s.caesar.trials[index], s.caesar.rates.unigram[index], s.caesar.intervals.unigram[index], s.caesar.bound[index]),
  methods: (s, P) => ({ index }) => P.methods(s.caesar.lengths[index], hw.METHODS.map((m) => s.caesar.rates[m][index])),
  scaling: (sc, P) => ({ index }) => {
    const bits = scalingBits(sc)[index];
    return P.scaling(bits, ATTACKS.map((m) => {
      const row = sc.rows[m].find((r) => r.bits === bits);
      return row ? row.mean : null;
    }));
  },
};

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
 * Runs drawing work a few milliseconds per frame: a page with many charts
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
