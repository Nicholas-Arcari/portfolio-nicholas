// src/pages/statistics/hw2/view.js
// Logica di presentazione dell'Homework #2, condivisa fra la pagina del sito
// (React) e il programma scaricabile (DOM puro): le sezioni, la lettura dei
// campi, le righe delle tabelle, i test e i dati dei grafici. Tenerla qui
// impedisce che le due versioni dicano cose diverse sugli stessi numeri.
import * as hw from './homework2.js';

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
export const SECTIONS = [
  { id: 'hw2-assignment', key: 'assignment', level: 0 },
  { id: 'hw2-pipeline', key: 'pipeline', level: 0 },
  { id: 'hw2-input', key: 'input', level: 1 },
  { id: 'hw2-bip39', key: 'bip39', level: 1 },
  { id: 'hw2-bip32', key: 'bip32', level: 1 },
  { id: 'hw2-bip44', key: 'bip44', level: 1 },
  { id: 'hw2-secp256k1', key: 'secp256k1', level: 1 },
  { id: 'hw2-keccak', key: 'keccak', level: 1 },
  { id: 'hw2-eip55', key: 'eip55', level: 1 },
  { id: 'hw2-verify', key: 'verify', level: 1 },
  { id: 'hw2-wallets', key: 'wallets', level: 1 },
  { id: 'hw2-categories', key: 'categories', level: 0 },
  { id: 'hw2-stats', key: 'stats', level: 0 },
  { id: 'hw2-stats-bip39', key: 'statsBip39', level: 1 },
  { id: 'hw2-stats-seed', key: 'statsSeed', level: 1 },
  { id: 'hw2-stats-bip32', key: 'statsBip32', level: 1 },
  { id: 'hw2-stats-secp256k1', key: 'statsSecp', level: 1 },
  { id: 'hw2-stats-keccak', key: 'statsKeccak', level: 1 },
  { id: 'hw2-stats-eip55', key: 'statsEip55', level: 1 },
  { id: 'hw2-stats-summary', key: 'statsSummary', level: 1 },
  { id: 'hw2-history', key: 'history', level: 0 },
  { id: 'hw2-timeline', key: 'timeline', level: 1 },
  { id: 'hw2-sha', key: 'sha', level: 1 },
  { id: 'hw2-discussion', key: 'discussion', level: 0 },
  { id: 'hw2-why', key: 'why', level: 1 },
  { id: 'hw2-fit', key: 'fit', level: 1 },
  { id: 'hw2-conclusion', key: 'conclusion', level: 1 },
];

/** The entries of the index, with their titles in the chosen language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

// ---------------------------------------------------------------------------
// The fields: sentence, passphrase, path
// ---------------------------------------------------------------------------

/** Longest texts the fields accept: a 24-word sentence fits easily, a pasted book does not. */
export const MNEMONIC_MAX_LENGTH = 400;
export const PASSPHRASE_MAX_LENGTH = 100;
export const PATH_MAX_LENGTH = 120;
export const ADDRESS_MAX_LENGTH = 60;
export const INDEX_MAX_LENGTH = 8;

/** Highest address index offered by the page (the command line accepts any up to 2^31 - 1). */
export const INDEX_MAX = 999;

/** The path choices: the wallet presets of the library, then a free path. */
export const PRESETS = [...hw.PATH_PRESETS.map((p) => p.id), 'custom'];

/** The values the page starts from, and returns to with "restore". */
export const TEST_INPUTS = Object.freeze({
  mnemonic: hw.TEST_MNEMONIC,
  passphrase: '',
  preset: 'bip44',
  indexText: '0',
  customPath: hw.DEFAULT_PATH,
});

/** The address index typed by the user: plain decimal digits only, from 0 to INDEX_MAX. */
export function parseIndex(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const i = Number(t);
  if (!Number.isSafeInteger(i) || i > INDEX_MAX) return { ok: false, error: 'range' };
  return { ok: true, value: i };
}

/**
 * The derivation path typed by the user. The checks are those of
 * hw.parsePath, in the same order, but with an error code instead of an
 * English message, so that each language can explain it.
 */
export function parsePathInput(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^m(\/\d{1,10}['hH]?)*$/.test(t)) return { ok: false, error: 'format' };
  const parts = t.split('/').slice(1);
  if (parts.length > hw.MAX_PATH_DEPTH) return { ok: false, error: 'depth' };
  if (parts.some((part) => Number(part.replace(/['hH]$/, '')) >= hw.HARDENED)) return { ok: false, error: 'range' };
  return { ok: true, value: t, levels: hw.parsePath(t) };
}

/** Everything the page needs to know about the fields: the sentence, the index, the path, and whether all are valid. */
export function readInputs({ mnemonic, passphrase, preset, indexText, customPath }) {
  const analysis = hw.analyzeMnemonic(mnemonic);
  const index = parseIndex(indexText);
  let path;
  if (preset === 'custom') path = parsePathInput(customPath);
  else path = index.ok ? { ok: true, value: hw.pathFor(preset, index.value) } : { ok: false, error: 'index' };
  return { analysis, index, path, passphrase, valid: analysis.valid && path.ok };
}

/** The input of the pipeline, when the fields are valid: the words as BIP-39 normalizes them. */
export const appliedInput = (read) => ({ mnemonic: read.analysis.sentence, passphrase: read.passphrase, path: read.path.value });

/** True when the fields hold the public test values. */
export function isTestInput(inputs) {
  return (
    hw.normalizeMnemonic(inputs.mnemonic).join(' ') === TEST_INPUTS.mnemonic &&
    inputs.passphrase === '' &&
    inputs.preset === TEST_INPUTS.preset &&
    inputs.indexText.trim() === TEST_INPUTS.indexText
  );
}

const WORD_INDEX = new Map(hw.WORDLIST.map((w, i) => [w, i]));

/**
 * Words of the list close to a word that is not in it: those sharing its
 * first four letters, which in the English list identify a word (or fewer
 * letters, if no word shares four).
 */
export function suggestWords(word, limit = 4) {
  for (let n = Math.min(4, word.length); n >= 1; n--) {
    const prefix = word.slice(0, n);
    const found = hw.WORDLIST.filter((w) => w.startsWith(prefix));
    if (found.length) return found.slice(0, limit);
  }
  return [];
}

/** Rows shown in the word table: at most 24, since no valid sentence is longer. */
export const WORD_ROWS_MAX = 24;

/** One row per word typed: position, word, its index in the list and its 11 bits (null if not in the list). */
export function wordRows(analysis) {
  return analysis.words.slice(0, WORD_ROWS_MAX).map((word, i) => {
    const index = WORD_INDEX.has(word) ? WORD_INDEX.get(word) : null;
    return { position: i + 1, word, index, bits: index === null ? null : index.toString(2).padStart(11, '0') };
  });
}

/**
 * The bits of a sentence whose words are all in the list, in groups of 11
 * (one per word), each split into entropy bits and checksum bits: only the
 * last word carries checksum bits.
 */
export function bitGroups(analysis) {
  if (!analysis.bits) return [];
  const entropyBits = analysis.bits.length - analysis.checksum.length;
  const groups = [];
  for (let i = 0; i < analysis.bits.length; i += 11) {
    const word = analysis.bits.slice(i, i + 11);
    const split = Math.max(0, Math.min(11, entropyBits - i));
    groups.push({ entropy: word.slice(0, split), checksum: word.slice(split) });
  }
  return groups;
}

/** SHA-256 of the entropy, whose first bits are the checksum. */
export const entropyHash = (analysis) => (analysis.entropy ? hw.toHex(hw.sha256(analysis.entropy)) : null);

// ---------------------------------------------------------------------------
// The pipeline, step by step
// ---------------------------------------------------------------------------

/** Short form of a long hexadecimal string. */
export const shortHex = (hex, keep = 10) => (hex.length > 2 * keep + 3 ? `${hex.slice(0, keep)}...${hex.slice(-keep)}` : hex);

const hex256 = (n) => hw.toHex(hw.ser256(n));

/** The nodes of the pipeline diagram, with the value of the chosen sentence and the section each arrow belongs to. */
export function flowNodes(pipeline) {
  const words = pipeline.analysis.words;
  return [
    { key: 'mnemonic', value: words.length > 4 ? `${words.slice(0, 3).join(' ')} ... ${words[words.length - 1]}` : words.join(' '), target: 'hw2-input' },
    { arrow: 'bip39', target: 'hw2-bip39' },
    { key: 'seed', value: shortHex(hw.toHex(pipeline.seed), 8), target: 'hw2-bip39' },
    { arrow: 'bip32', target: 'hw2-bip32' },
    { key: 'privateKey', value: shortHex(hw.toHex(pipeline.privateKey), 8), target: 'hw2-bip32' },
    { arrow: 'secp256k1', target: 'hw2-secp256k1' },
    { key: 'publicKey', value: shortHex(hw.toHex(pipeline.address.xy), 8), target: 'hw2-secp256k1' },
    { arrow: 'keccak', target: 'hw2-keccak' },
    { key: 'address', value: pipeline.address.address, target: 'hw2-keccak' },
    { arrow: 'eip55', target: 'hw2-eip55' },
    { key: 'checksummed', value: pipeline.checksum.address, target: 'hw2-eip55' },
  ];
}

/** The path up to each level: m, m/44', m/44'/60', ... */
const pathPrefixes = (levels) => levels.map((_, i) => ['m', ...levels.slice(0, i + 1).map((l) => l.label)].join('/'));

/** The master node and every level of the path, with the HMAC data and the resulting key and chain code. */
export function levelRows(pipeline) {
  const prefixes = pathPrefixes(pipeline.levels);
  const master = pipeline.master.node;
  return [
    { path: 'm', kind: 'master', data: hw.toHex(pipeline.seed), key: hex256(master.privateKey), chainCode: hw.toHex(master.chainCode) },
    ...pipeline.steps.map((step, i) => ({
      path: prefixes[i],
      kind: step.hardened ? 'hardened' : 'normal',
      data: hw.toHex(step.data),
      key: hex256(step.node.privateKey),
      chainCode: hw.toHex(step.node.chainCode),
    })),
  ];
}

/** The path of the parent of the final node (null for m). */
export const parentPath = (pipeline) => (pipeline.levels.length ? ['m', ...pipeline.levels.slice(0, -1).map((l) => l.label)].join('/') : null);

/**
 * Parent private key from the parent's extended public key and one child's
 * private key, for a normal (non-hardened) index: k = k_i - IL (mod n), with
 * IL computed from public data only. Why the first BIP-44 levels are hardened.
 */
export function recoverParentKey(parentNode, child) {
  // only what the parent's xpub contains: no private key goes in
  const xpub = { depth: parentNode.depth, chainCode: parentNode.chainCode, publicKey: parentNode.publicKey, point: parentNode.point };
  const { IL } = hw.deriveChildPublic(xpub, child.index);
  const n = hw.SECP256K1.n;
  const recovered = (((child.privateKey - IL) % n) + n) % n;
  return { IL, recovered, matches: recovered === parentNode.privateKey };
}

/** The leak of a normal child key, computed on the chosen path; not applicable to m or to a hardened last level. */
export function leakDemo(pipeline) {
  if (!pipeline.steps.length) return { applicable: false, reason: 'master' };
  const last = pipeline.steps[pipeline.steps.length - 1];
  if (last.hardened) return { applicable: false, reason: 'hardened', path: pipeline.path };
  const { IL, recovered, matches } = recoverParentKey(pipeline.parentNode, pipeline.node);
  return {
    applicable: true,
    parentPath: parentPath(pipeline),
    childPath: pipeline.path,
    index: last.value,
    IL: hex256(IL),
    childKey: hw.toHex(pipeline.privateKey),
    recovered: hex256(recovered),
    matches,
  };
}

const LEVEL_ROLES = ['purpose', 'coinType', 'account', 'change', 'index'];

/**
 * How the levels of a path read in BIP-44: purpose', coin_type', account',
 * change, address_index. `standard` says whether the path has that shape.
 */
export function bip44Levels(levels) {
  const standard =
    levels.length === 5 &&
    levels[0].hardened && levels[0].value === 44 &&
    levels[1].hardened && levels[2].hardened &&
    !levels[3].hardened && (levels[3].value === 0 || levels[3].value === 1) &&
    !levels[4].hardened;
  return {
    standard,
    ethereum: standard && levels[1].value === hw.ETHEREUM_COIN_TYPE,
    rows: standard ? levels.map((level, i) => ({ role: LEVEL_ROLES[i], label: level.label, value: level.value })) : [],
  };
}

/** Accounts shown for each wallet preset in the comparison table. */
export const COMPARISON_ACCOUNTS = 3;

/**
 * The first addresses of a seed on the path of every wallet preset. The
 * paths share their first levels (m/44'/60' always, m/44'/60'/0'/0 often),
 * so every node is derived once and reused.
 */
export function presetComparison(seed) {
  const nodes = new Map([['m', hw.masterKey(seed).node]]);
  const nodeAt = (path) => {
    if (!nodes.has(path)) {
      const cut = path.lastIndexOf('/');
      const [level] = hw.parsePath(`m${path.slice(cut)}`);
      nodes.set(path, hw.deriveChild(nodeAt(path.slice(0, cut)), level.index).node);
    }
    return nodes.get(path);
  };
  const rows = [];
  for (const { id } of hw.PATH_PRESETS) {
    for (let i = 0; i < COMPARISON_ACCOUNTS; i++) {
      const path = hw.pathFor(id, i);
      const node = nodeAt(path);
      rows.push({ preset: id, index: i, path, address: hw.toChecksumAddress(hw.publicKeyToAddress(node.point).address).address });
    }
  }
  return rows;
}

/** The public test account with this address, if any (Hardhat and Foundry list them). */
export const testAccount = (address) => hw.TEST_ACCOUNTS.find((a) => a.address === address) || null;

/** The curve parameters, as hexadecimal strings. */
export const curveParameters = () => ({ p: hex256(hw.SECP256K1.p), n: hex256(hw.SECP256K1.n), Gx: hex256(hw.SECP256K1.Gx), Gy: hex256(hw.SECP256K1.Gy) });

/** The checks of the secp256k1 step: key range, point on the curve, compressed form decoded back. */
export function curveChecks(pipeline) {
  const k = hw.bytesToBigInt(pipeline.privateKey);
  const { x, y } = pipeline.publicKey.point;
  const decoded = hw.decodeCompressed(pipeline.publicKey.compressed);
  return {
    keyInRange: k >= 1n && k < hw.SECP256K1.n,
    onCurve: hw.isOnSecp256k1(pipeline.publicKey.point),
    decodes: decoded.x === x && decoded.y === y,
    even: y % 2n === 0n,
    x: hex256(x),
    y: hex256(y),
  };
}

/** The 32 bytes of Keccak-256(x || y), split into the 12 discarded and the 20 kept. */
export function hashParts(pipeline) {
  const hex = hw.toHex(pipeline.address.hash);
  return { dropped: hex.slice(0, 24), kept: hex.slice(24), sha3: hw.toHex(hw.sha3_256(pipeline.address.xy)) };
}

/** Keccak-256 and SHA3-256 of the empty string: same permutation, different padding. */
export const emptyDigests = () => ({
  keccak: hw.toHex(hw.keccak256(new Uint8Array(0))),
  sha3: hw.toHex(hw.sha3_256(new Uint8Array(0))),
});

/** The positions (0-based) of the letters of a typed address whose case is not the one EIP-55 asks for. */
export function wrongCasePositions(typed, expected) {
  const out = [];
  for (let i = 2; i < typed.length; i++) if (typed[i] !== expected[i]) out.push(i - 2);
  return out;
}

/**
 * The verdict on an address typed in the checker, compared with the
 * address computed by the pipeline: wrong format, no checksum (all lower or
 * all upper case), valid, or invalid with the letters in the wrong case.
 */
export function checkTypedAddress(text, reference) {
  const t = String(text).trim();
  const r = hw.checkAddress(t);
  if (!r.format) return { status: 'format' };
  const same = t.toLowerCase() === reference.toLowerCase();
  if (r.valid === null) return { status: 'noChecksum', same, letters: r.letters };
  if (r.valid) return { status: 'valid', same, letters: r.letters };
  return { status: 'invalid', same, letters: r.letters, positions: wrongCasePositions(t, r.expected) };
}

/** The rows of verifyVectors, grouped in their order. */
export function vectorGroups(rows) {
  const groups = [];
  for (const row of rows) {
    if (!groups.length || groups[groups.length - 1].group !== row.group) groups.push({ group: row.group, rows: [] });
    groups[groups.length - 1].rows.push(row);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/** The statistical sections, in page order, with the anchor and the title key of each. */
export const STAT_SECTIONS = [
  { key: 'bip39', id: 'hw2-stats-bip39', title: 'statsBip39' },
  { key: 'seed', id: 'hw2-stats-seed', title: 'statsSeed' },
  { key: 'bip32', id: 'hw2-stats-bip32', title: 'statsBip32' },
  { key: 'secp256k1', id: 'hw2-stats-secp256k1', title: 'statsSecp' },
  { key: 'keccak', id: 'hw2-stats-keccak', title: 'statsKeccak' },
  { key: 'eip55', id: 'hw2-stats-eip55', title: 'statsEip55' },
];

/** Every hypothesis test of the exploration, by section: [key, test]. The texts name each key. */
export function statTests(s) {
  return {
    bip39: [
      ['words', s.bip39.words.test],
      ['nibble', s.bip39.checksumNibble.test],
      ['random', s.bip39.randomSequences],
      ['typos', s.bip39.wordTypos],
    ],
    seed: [
      ['bits', s.seed.bits.global],
      ['avalancheMean', s.seed.avalanche.mean_test],
      ['avalancheFit', s.seed.avalanche.fit],
    ],
    bip32: [
      ['bits', s.bip32.bits.global],
      ['siblingsMean', s.bip32.siblings.mean_test],
      ['siblingsFit', s.bip32.siblings.fit],
      ['correlation', s.bip32.correlation],
    ],
    secp256k1: [
      ['parity', s.secp256k1.parity],
      ['bitsX', s.secp256k1.bitsX.global],
      ['bitsY', s.secp256k1.bitsY.global],
      ['avalancheMean', s.secp256k1.avalanche.mean_test],
      ['avalancheFit', s.secp256k1.avalanche.fit],
    ],
    keccak: [
      ['bits', s.keccak.addressBits.global],
      ['firstHex', s.keccak.firstHex.test],
      ['bytes', s.keccak.bytes.test],
      ['avalancheMean', s.keccak.avalanche.mean_test],
      ['avalancheFit', s.keccak.avalanche.fit],
      ['sacOutput', s.keccak.avalanche.perOutput.global],
      ['sacInput', s.keccak.avalanche.perInput.global],
      ['sha3Mean', s.keccak.versusSha3.mean_test],
      ['sha3Fit', s.keccak.versusSha3.fit],
    ],
    eip55: [
      ['letters', s.eip55.letters.test],
      ['uppercase', s.eip55.uppercase],
      ['typos', s.eip55.typos],
    ],
  };
}

/** The tests as one list, with how many were rejected and the smallest p-value. */
export function testSummary(s) {
  const all = STAT_SECTIONS.flatMap(({ key }) => statTests(s)[key].map(([test, result]) => ({ section: key, key: test, result })));
  const smallest = all.reduce((m, t) => (m === null || t.result.pValue < m.result.pValue ? t : m), null);
  return {
    all,
    count: all.length,
    rejected: all.filter((t) => t.result.verdict === 'reject').length,
    smallest,
    bonferroni: hw.SIGNIFICANCE / all.length,
  };
}

/** Number of addresses with at most `letters` letters, from the histogram of the exploration. */
export const addressesWithAtMost = (s, letters) => s.eip55.letters.counts.slice(0, letters + 1).reduce((a, b) => a + b, 0);

const indexLabels = (n, from = 0, step = 1) => Array.from({ length: n }, (_, i) => String(from + i * step));

/**
 * A distance histogram for a chart: the range mean +- 5 standard
 * deviations of the reference Binomial(n, 1/2), in at most 40 classes, with
 * anything beyond the range counted in the first or last class, so that
 * no observation disappears.
 */
function distanceChart(d, decimal) {
  const sd = Math.sqrt(d.n) / 2;
  const lo = Math.max(0, Math.floor(d.n / 2 - 5 * sd));
  const hi = Math.min(d.n, Math.ceil(d.n / 2 + 5 * sd));
  const width = Math.max(1, Math.ceil((hi - lo + 1) / 40));
  const classes = Math.ceil((hi - lo + 1) / width);
  const values = new Array(classes).fill(0);
  const expected = new Array(classes).fill(0);
  for (let k = 0; k <= d.n; k++) {
    const c = Math.min(classes - 1, Math.max(0, Math.floor((k - lo) / width)));
    values[c] += d.counts[k];
    expected[c] += d.expected[k];
  }
  return { values, expected, labels: indexLabels(classes, lo, width), decimal, width, lo, hi };
}

/** Bit columns of the index-key heatmap, summed in blocks of this many key bits. */
export const CORRELATION_BLOCK = 8;

/**
 * The index-key correlations as z-scores, phi * sqrt(N - 1), summed over
 * blocks of CORRELATION_BLOCK key bits and divided by the square root of
 * the block size: under independence every cell is again about N(0, 1).
 */
function correlationBlocks(c, N) {
  return c.values.map((row) => {
    const out = [];
    for (let j = 0; j < row.length; j += CORRELATION_BLOCK) {
      let sum = 0;
      let cells = 0;
      for (const v of row.slice(j, j + CORRELATION_BLOCK)) {
        if (v === null) continue;
        sum += v * Math.sqrt(N - 1);
        cells++;
      }
      out.push(cells ? sum / Math.sqrt(cells) : null);
    }
    return out;
  });
}

function binomialExpected(n, p, N) {
  const out = [];
  let prob = (1 - p) ** n;
  for (let k = 0; k <= n; k++) {
    out.push(prob * N);
    prob *= ((n - k) / (k + 1)) * (p / (1 - p));
  }
  return out;
}

/**
 * The data of every chart of the statistical exploration. `decimal` is
 * the decimal separator of the labels; the axis names of the heatmaps come
 * from the texts.
 */
export function chartData(s, { decimal = '.', axes = {} } = {}) {
  const bits = (b) => ({ values: b.fractions, expected: 0.5, labels: indexLabels(b.bits), max: 1, decimal });
  return {
    words: { values: s.bip39.words.counts, expected: s.bip39.words.test.N / 2048, labels: indexLabels(2048), decimal },
    nibble: { values: s.bip39.checksumNibble.counts, expected: s.bip39.checksumNibble.test.N / 16, labels: indexLabels(16), decimal },
    seedBits: bits(s.seed.bits),
    seedDistances: distanceChart(s.seed.avalanche, decimal),
    keyBits: bits(s.bip32.bits),
    siblings: distanceChart(s.bip32.siblings, decimal),
    correlation: { values: correlationBlocks(s.bip32.correlation, s.bip32.bits.N), range: 4, rowLabel: axes.indexBits || '', colLabel: axes.keyBits || '', decimal },
    xBits: bits(s.secp256k1.bitsX),
    yBits: bits(s.secp256k1.bitsY),
    pointDistances: distanceChart(s.secp256k1.avalanche, decimal),
    addressBits: bits(s.keccak.addressBits),
    firstHex: { values: s.keccak.firstHex.counts, expected: s.keccak.firstHex.test.N / 16, labels: '0123456789abcdef'.split(''), decimal },
    keccakDistances: distanceChart(s.keccak.avalanche, decimal),
    sac: { values: s.keccak.avalanche.blocks, range: 4, rowLabel: axes.inputBits || '', colLabel: axes.outputBits || '', decimal },
    letters: { values: s.eip55.letters.counts, expected: binomialExpected(40, 6 / 16, s.eip55.letters.test.N), labels: indexLabels(41), decimal },
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
