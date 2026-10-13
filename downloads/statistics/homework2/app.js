/*
 * Homework #2 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Interface and texts (Italian and English). Needs homework2.js, loaded first.
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-2
 */

(function () {
'use strict';

var view$ = (function () {
'use strict';

// src/pages/statistics/hw2/view.js
// Logica di presentazione dell'Homework #2, condivisa fra la pagina del sito
// (React) e il programma scaricabile (DOM puro): le sezioni, la lettura dei
// campi, le righe delle tabelle, i test e i dati dei grafici. Tenerla qui
// impedisce che le due versioni dicano cose diverse sugli stessi numeri.
const hw = Homework2;

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
const SECTIONS = [
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
const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

// ---------------------------------------------------------------------------
// The fields: sentence, passphrase, path
// ---------------------------------------------------------------------------

/** Longest texts the fields accept: a 24-word sentence fits easily, a pasted book does not. */
const MNEMONIC_MAX_LENGTH = 400;
const PASSPHRASE_MAX_LENGTH = 100;
const PATH_MAX_LENGTH = 120;
const ADDRESS_MAX_LENGTH = 60;
const INDEX_MAX_LENGTH = 8;

/** Highest address index offered by the page (the command line accepts any up to 2^31 - 1). */
const INDEX_MAX = 999;

/** The path choices: the wallet presets of the library, then a free path. */
const PRESETS = [...hw.PATH_PRESETS.map((p) => p.id), 'custom'];

/** The values the page starts from, and returns to with "restore". */
const TEST_INPUTS = Object.freeze({
  mnemonic: hw.TEST_MNEMONIC,
  passphrase: '',
  preset: 'bip44',
  indexText: '0',
  customPath: hw.DEFAULT_PATH,
});

/** The address index typed by the user: plain decimal digits only, from 0 to INDEX_MAX. */
function parseIndex(text) {
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
function parsePathInput(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^m(\/\d{1,10}['hH]?)*$/.test(t)) return { ok: false, error: 'format' };
  const parts = t.split('/').slice(1);
  if (parts.length > hw.MAX_PATH_DEPTH) return { ok: false, error: 'depth' };
  if (parts.some((part) => Number(part.replace(/['hH]$/, '')) >= hw.HARDENED)) return { ok: false, error: 'range' };
  return { ok: true, value: t, levels: hw.parsePath(t) };
}

/** Everything the page needs to know about the fields: the sentence, the index, the path, and whether all are valid. */
function readInputs({ mnemonic, passphrase, preset, indexText, customPath }) {
  const analysis = hw.analyzeMnemonic(mnemonic);
  const index = parseIndex(indexText);
  let path;
  if (preset === 'custom') path = parsePathInput(customPath);
  else path = index.ok ? { ok: true, value: hw.pathFor(preset, index.value) } : { ok: false, error: 'index' };
  return { analysis, index, path, passphrase, valid: analysis.valid && path.ok };
}

/** The input of the pipeline, when the fields are valid: the words as BIP-39 normalizes them. */
const appliedInput = (read) => ({ mnemonic: read.analysis.sentence, passphrase: read.passphrase, path: read.path.value });

/** True when the fields hold the public test values. */
function isTestInput(inputs) {
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
function suggestWords(word, limit = 4) {
  for (let n = Math.min(4, word.length); n >= 1; n--) {
    const prefix = word.slice(0, n);
    const found = hw.WORDLIST.filter((w) => w.startsWith(prefix));
    if (found.length) return found.slice(0, limit);
  }
  return [];
}

/** Rows shown in the word table: at most 24, since no valid sentence is longer. */
const WORD_ROWS_MAX = 24;

/** One row per word typed: position, word, its index in the list and its 11 bits (null if not in the list). */
function wordRows(analysis) {
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
function bitGroups(analysis) {
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
const entropyHash = (analysis) => (analysis.entropy ? hw.toHex(hw.sha256(analysis.entropy)) : null);

// ---------------------------------------------------------------------------
// The pipeline, step by step
// ---------------------------------------------------------------------------

/** Short form of a long hexadecimal string. */
const shortHex = (hex, keep = 10) => (hex.length > 2 * keep + 3 ? `${hex.slice(0, keep)}...${hex.slice(-keep)}` : hex);

const hex256 = (n) => hw.toHex(hw.ser256(n));

/** The nodes of the pipeline diagram, with the value of the chosen sentence and the section each arrow belongs to. */
function flowNodes(pipeline) {
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
function levelRows(pipeline) {
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
const parentPath = (pipeline) => (pipeline.levels.length ? ['m', ...pipeline.levels.slice(0, -1).map((l) => l.label)].join('/') : null);

/**
 * Parent private key from the parent's extended public key and one child's
 * private key, for a normal (non-hardened) index: k = k_i - IL (mod n), with
 * IL computed from public data only. Why the first BIP-44 levels are hardened.
 */
function recoverParentKey(parentNode, child) {
  // only what the parent's xpub contains: no private key goes in
  const xpub = { depth: parentNode.depth, chainCode: parentNode.chainCode, publicKey: parentNode.publicKey, point: parentNode.point };
  const { IL } = hw.deriveChildPublic(xpub, child.index);
  const n = hw.SECP256K1.n;
  const recovered = (((child.privateKey - IL) % n) + n) % n;
  return { IL, recovered, matches: recovered === parentNode.privateKey };
}

/** The leak of a normal child key, computed on the chosen path; not applicable to m or to a hardened last level. */
function leakDemo(pipeline) {
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
function bip44Levels(levels) {
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
const COMPARISON_ACCOUNTS = 3;

/**
 * The first addresses of a seed on the path of every wallet preset. The
 * paths share their first levels (m/44'/60' always, m/44'/60'/0'/0 often),
 * so every node is derived once and reused.
 */
function presetComparison(seed) {
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
const testAccount = (address) => hw.TEST_ACCOUNTS.find((a) => a.address === address) || null;

/** The curve parameters, as hexadecimal strings. */
const curveParameters = () => ({ p: hex256(hw.SECP256K1.p), n: hex256(hw.SECP256K1.n), Gx: hex256(hw.SECP256K1.Gx), Gy: hex256(hw.SECP256K1.Gy) });

/** The checks of the secp256k1 step: key range, point on the curve, compressed form decoded back. */
function curveChecks(pipeline) {
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
function hashParts(pipeline) {
  const hex = hw.toHex(pipeline.address.hash);
  return { dropped: hex.slice(0, 24), kept: hex.slice(24), sha3: hw.toHex(hw.sha3_256(pipeline.address.xy)) };
}

/** Keccak-256 and SHA3-256 of the empty string: same permutation, different padding. */
const emptyDigests = () => ({
  keccak: hw.toHex(hw.keccak256(new Uint8Array(0))),
  sha3: hw.toHex(hw.sha3_256(new Uint8Array(0))),
});

/** The positions (0-based) of the letters of a typed address whose case is not the one EIP-55 asks for. */
function wrongCasePositions(typed, expected) {
  const out = [];
  for (let i = 2; i < typed.length; i++) if (typed[i] !== expected[i]) out.push(i - 2);
  return out;
}

/**
 * The verdict on an address typed in the checker, compared with the
 * address computed by the pipeline: wrong format, no checksum (all lower or
 * all upper case), valid, or invalid with the letters in the wrong case.
 */
function checkTypedAddress(text, reference) {
  const t = String(text).trim();
  const r = hw.checkAddress(t);
  if (!r.format) return { status: 'format' };
  const same = t.toLowerCase() === reference.toLowerCase();
  if (r.valid === null) return { status: 'noChecksum', same, letters: r.letters };
  if (r.valid) return { status: 'valid', same, letters: r.letters };
  return { status: 'invalid', same, letters: r.letters, positions: wrongCasePositions(t, r.expected) };
}

/** The rows of verifyVectors, grouped in their order. */
function vectorGroups(rows) {
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
const STAT_SECTIONS = [
  { key: 'bip39', id: 'hw2-stats-bip39', title: 'statsBip39' },
  { key: 'seed', id: 'hw2-stats-seed', title: 'statsSeed' },
  { key: 'bip32', id: 'hw2-stats-bip32', title: 'statsBip32' },
  { key: 'secp256k1', id: 'hw2-stats-secp256k1', title: 'statsSecp' },
  { key: 'keccak', id: 'hw2-stats-keccak', title: 'statsKeccak' },
  { key: 'eip55', id: 'hw2-stats-eip55', title: 'statsEip55' },
];

/** Every hypothesis test of the exploration, by section: [key, test]. The texts name each key. */
const statTests = hw.statisticalTests;

/** The tests as one list, with how many were rejected and the smallest p-value. */
function testSummary(s) {
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
const addressesWithAtMost = (s, letters) => s.eip55.letters.counts.slice(0, letters + 1).reduce((a, b) => a + b, 0);

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
const CORRELATION_BLOCK = 8;

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
function chartData(s, { decimal = '.', axes = {} } = {}) {
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

/**
 * What the label over each chart of chartData says for the bar or the cell
 * under the pointer (hw.attachChartTooltip), from the same statistics and
 * chart data. P is the `tips` part of the texts. A bar may stand for
 * several values when the chart has more of them than pixels (the 2048
 * words): then the label gives the range.
 */
function chartTips(s, data, P) {
  const sum = (list, from, to) => list.slice(from, to).reduce((a, b) => a + b, 0);
  const words = s.bip39.words.counts;
  const bit = (b, what) => ({ from }) => P.bit(what, from, b.fractions[from], b.z[from]);
  // classes of `width` distances from `lo`; the first and the last also hold anything beyond the range
  const distances = (chart, d) => ({ from, to }) => {
    const first = chart.lo + from * chart.width;
    const last = Math.min(d.n, chart.lo + to * chart.width - 1);
    return P.distances(from === 0 && chart.lo > 0 ? null : first, to === chart.values.length && chart.hi < d.n ? null : last, sum(chart.values, from, to), sum(chart.expected, from, to));
  };
  return {
    words: ({ from, to }) => {
      if (to - from === 1) return P.word(from, hw.WORDLIST[from], words[from], data.words.expected);
      const part = words.slice(from, to);
      return P.words(from, to - 1, hw.WORDLIST[from], hw.WORDLIST[to - 1], Math.min(...part), Math.max(...part));
    },
    nibble: ({ from }) => P.nibble(from, s.bip39.checksumNibble.counts[from], data.nibble.expected),
    seedBits: bit(s.seed.bits, P.of.seed),
    seedDistances: distances(data.seedDistances, s.seed.avalanche),
    keyBits: bit(s.bip32.bits, P.of.key),
    siblings: distances(data.siblings, s.bip32.siblings),
    correlation: ({ row, col }) => P.indexKey(row, col * CORRELATION_BLOCK, Math.min(255, (col + 1) * CORRELATION_BLOCK - 1), data.correlation.values[row][col]),
    xBits: bit(s.secp256k1.bitsX, P.of.x),
    yBits: bit(s.secp256k1.bitsY, P.of.y),
    pointDistances: distances(data.pointDistances, s.secp256k1.avalanche),
    addressBits: bit(s.keccak.addressBits, P.of.address),
    firstHex: ({ from }) => P.firstHex('0123456789abcdef'[from], s.keccak.firstHex.counts[from], data.firstHex.expected),
    keccakDistances: distances(data.keccakDistances, s.keccak.avalanche),
    sac: ({ row, col }) => P.sacBlock(16 * row, 16 * row + 15, 8 * col, 8 * col + 7, data.sac.values[row][col]),
    letters: ({ from }) => P.letters(from, s.eip55.letters.counts[from], data.letters.expected[from]),
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
function scheduleFrameJob(job) {
  frameJobs.push(job);
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(runFrameJobs);
  }
}

return { SECTIONS, tocEntries, MNEMONIC_MAX_LENGTH, PASSPHRASE_MAX_LENGTH, PATH_MAX_LENGTH, ADDRESS_MAX_LENGTH, INDEX_MAX_LENGTH, INDEX_MAX, PRESETS, TEST_INPUTS, parseIndex, parsePathInput, readInputs, appliedInput, isTestInput, suggestWords, WORD_ROWS_MAX, wordRows, bitGroups, entropyHash, shortHex, flowNodes, levelRows, parentPath, recoverParentKey, leakDemo, bip44Levels, COMPARISON_ACCOUNTS, presetComparison, testAccount, curveParameters, curveChecks, hashParts, emptyDigests, wrongCasePositions, checkTypedAddress, vectorGroups, STAT_SECTIONS, statTests, testSummary, addressesWithAtMost, CORRELATION_BLOCK, chartData, chartTips, scheduleFrameJob };
})();

var texts$ = (function () {
'use strict';

// src/pages/statistics/hw2/texts.js
// I testi dell'Homework #2 in italiano e in inglese. Li usano sia la pagina
// del sito sia il programma scaricabile, cosi' le due versioni dicono le
// stesse cose con le stesse parole. Ogni numero arriva dagli argomenti (la
// pipeline calcolata, i risultati dell'esplorazione) o dalle costanti della
// libreria: nessuna frase contiene un risultato scritto a mano.
const { EXPLORE_SEED, MAX_PATH_DEPTH, SAMPLES, SIGNIFICANCE, TEST_LABELS, chiSquarePValue } = Homework2;
const { CORRELATION_BLOCK, addressesWithAtMost } = view$;

/** Number formatting of one language: decimal separator and "not available" marker. */
function formatters(decimal, na) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  return {
    na,
    decimal,
    num: (v, digits = 3) => (missing(v) ? na : local((Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits))),
    pval: (v) => (missing(v) ? na : v === 0 ? '0' : v < 0.001 ? local(v.toExponential(1)) : local(v.toFixed(3))),
    // an expected count: a decimal when it is large, two significant digits when it is small
    approx: (v) => {
      if (missing(v)) return na;
      if (v === 0) return '0';
      if (v >= 100) return local(v.toFixed(0));
      if (v >= 1) return local(v.toFixed(1));
      return v >= 1e-4 ? local(String(Number(v.toPrecision(2)))) : `< ${local('0.0001')}`;
    },
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
  };
}

/** Short form of a long hexadecimal string, for sentences. */
const short = (hex) => (hex.length > 19 ? `${hex.slice(0, 8)}...${hex.slice(-8)}` : hex);

/**
 * The assignment as the professor wrote it, block by block. The only
 * change is the long dash, written "-" as everywhere on this site.
 */
const originalAssignment = () => [
  { type: 'title', text: 'HMWK 2 - From Wallet Seed to Ethereum Address: Hashing, Key Derivation and Cryptographic Primitives' },
  { type: 'p', text: 'Statistical properties' },
  { type: 'heading', text: 'TASK' },
  {
    type: 'p',
    text: 'Check the practical cryptographic pipeline used in Ethereum wallets, from a mnemonic phrase to an Ethereum address and briefly describe the role and purpose of the following standards and cryptographic primitives:',
  },
  {
    type: 'lines',
    lines: [
      'BIP-39 - mnemonic sentence and seed generation;',
      'BIP-32 - hierarchical deterministic (HD) key derivation;',
      'BIP-44 - standard derivation paths for hierarchical deterministic wallets;',
      'secp256k1 - elliptic-curve public-key cryptography;',
      'Keccak-256 - hash function used in Ethereum address derivation;',
      'EIP-55 - mixed-case checksum encoding for Ethereum addresses.',
    ],
  },
  { type: 'p', text: 'In case try experiencing with software such as metamask, rabby, exodus, rainbow, ... or similar to understand the role of each iece of technology ...' },
  { type: 'p', text: 'A simplified wallet pipeline can be represented as:' },
  {
    type: 'lines',
    lines: ['Mnemonic ↓ BIP-39 ↓', 'Seed  BIP-32 / BIP-44 ↓', 'Private Key ↓ secp256k1 ↓', 'Public Key ↓ Keccak-256 ↓', 'Ethereum Address ↓ EIP-55 ↓', 'Checksummed Address'],
  },
  {
    type: 'lines',
    lines: [
      'For the purpose of this homework, distinguish clearly between:',
      'key generation and key derivation;',
      'public-key cryptography;',
      'hashing;',
      'checksums;',
      'encoding.',
      'Also briefly discuss the role of each primitive and how the different steps fit together and the statistical properties.',
    ],
  },
  { type: 'heading', text: 'Hints: TEMPORAL AND HISTORICAL CONTEXT' },
  { type: 'p', text: 'Briefly place these technologies in chronological context.' },
  {
    type: 'lines',
    lines: [
      'Discuss the approximate historical order of:',
      'RSA - public-key cryptography, introduced in 1977;',
      'SHA-2 / SHA-512 - standardized in 2001;',
      'BIP-32 - hierarchical deterministic wallets, 2012;',
      'BIP-39 - mnemonic code for generating deterministic wallets, 2013;',
      'BIP-44 - multi-account hierarchical deterministic wallets, 2014;',
      'SHA-3 - standardized by NIST in 2015, based on Keccak;',
      'EIP-55 - Ethereum mixed-case checksum addresses, 2016.',
      'Also explain the distinction between:',
    ],
  },
  { type: 'p', text: 'SHA-2 / SHA-512 and Keccak / SHA-3' },
  {
    type: 'p',
    text: 'They are related historically and both belong to the family of cryptographic hash functions, but Keccak is the underlying design selected for SHA-3, while Ethereum uses Keccak-256, which is not identical to the standardized SHA3-256 function (because of the padding/domain-separation convention.)',
  },
  {
    type: 'lines',
    lines: [
      'Why does the Ethereum wallet pipeline use several different cryptographic techniques instead of using one single algorithm for everything?',
      'Explain briefly why:',
      'BIP-39/BIP-32/BIP-44 → key management and derivation',
      'secp256k1 → public/private key relationship and digital signatures',
      'Keccak-256 → hashing',
      'EIP-55 → checksum/error detection',
      'serve different purposes in the overall system.',
    ],
  },
];

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', 'n/d');

/** The line of numbers under a hypothesis test, whatever its kind. */
function testLineIt(t) {
  const F = IT;
  switch (t.kind) {
    case 'chi2':
      return t.classes === undefined
        ? `Σz² = ${F.num(t.chi2, 1)}, χ² con ${t.df} gradi di libertà, p = ${F.pval(t.pValue)}`
        : `χ² = ${F.num(t.chi2, 1)} su ${t.classes} classi (${t.df} gradi di libertà), p = ${F.pval(t.pValue)}`;
    case 'binomial':
      return `${t.successes} su ${t.trials} = ${F.pct(t.rate, 2)} (atteso ${F.pct(t.expectedRate, 2)}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'poisson':
      return `${t.observed} osservati, ${F.num(t.expected, 2)} attesi (test di Poisson esatto), p = ${F.pval(t.pValue)}`;
    case 'z':
      return `media ${F.num(t.mean, 2)} (attesa ${t.expectedMean}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'permutation':
      return `N·Σφ² = ${F.num(t.statistic, 1)}, p = ${F.pval(t.pValue)} su ${t.sims} permutazioni`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

/** The caption of a distance histogram: what it shows, the range and the width of its classes. */
const distanceRangeIt = (c) => (c.width > 1 ? `; da ${c.lo} a ${c.hi}, classi di ${c.width} valori` : `; da ${c.lo} a ${c.hi}`);

const it = {
  fmt: IT,
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
    pipeline: '1. TASK: la pipeline di un wallet, dalla frase all’indirizzo',
    input: '1.1 Frase, passphrase e percorso',
    bip39: '1.2 BIP-39: dalla frase al seed',
    bip32: '1.3 BIP-32: chiavi deterministiche gerarchiche',
    bip44: '1.4 BIP-44: i percorsi di derivazione standard',
    secp256k1: '1.5 secp256k1: dalla chiave privata alla chiave pubblica',
    keccak: '1.6 Keccak-256: dalla chiave pubblica all’indirizzo',
    eip55: '1.7 EIP-55: il checksum nelle maiuscole',
    verify: '1.8 Verifica con i vettori di test ufficiali',
    wallets: '1.9 La prova con un wallet vero',
    categories: '2. Generazione, derivazione, chiave pubblica, hash, checksum e codifica',
    stats: '3. Le proprietà statistiche',
    statsBip39: '3.1 BIP-39: parole e checksum',
    statsSeed: '3.2 Il seed: PBKDF2-HMAC-SHA512',
    statsBip32: '3.3 BIP-32: le chiavi figlie',
    statsSecp: '3.4 secp256k1: le chiavi pubbliche',
    statsKeccak: '3.5 Keccak-256: indirizzi ed effetto valanga',
    statsEip55: '3.6 EIP-55: lettere, maiuscole ed errori di battitura',
    statsSummary: '3.7 Riepilogo dei test',
    history: '4. Contesto storico',
    timeline: '4.1 Cronologia',
    sha: '4.2 SHA-2 / SHA-512 e Keccak / SHA-3',
    discussion: '5. Discussione',
    why: '5.1 Perché tante tecniche e non un solo algoritmo',
    fit: '5.2 Come si incastrano i passaggi',
    conclusion: '5.3 Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna chiede di verificare la pipeline crittografica con cui un wallet Ethereum passa da una frase mnemonica a un indirizzo, e di descrivere ruolo e scopo di ogni standard e primitiva lungo la strada: BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256 ed EIP-55. Chiede poi di distinguere generazione e derivazione delle chiavi, crittografia a chiave pubblica, hashing, checksum e codifica, di discutere come i passaggi si incastrano e quali proprietà statistiche hanno, e di collocare queste tecnologie nel loro contesto storico.',
      'La pagina segue quest’ordine. La sezione 1 percorre la pipeline un passaggio alla volta, con valori calcolati dal vivo nel browser da un’implementazione scritta da zero e verificata con i vettori di test ufficiali; frase, passphrase e percorso si possono cambiare, e il risultato si può confrontare con un wallet vero. La sezione 2 distingue le cinque categorie, la 3 misura le proprietà statistiche di ogni passaggio con test d’ipotesi, la 4 ricostruisce la cronologia e il rapporto fra SHA-2 e Keccak/SHA-3, la 5 discute perché servono tante tecniche diverse e come si incastrano.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese.',
  },
  pipeline: {
    intro: [
      'Un wallet Ethereum non custodisce chiavi: custodisce un segreto iniziale e ne ricalcola le chiavi ogni volta che servono. Il segreto è una frase di 12-24 parole (BIP-39), che diventa un seed di 512 bit; dal seed nasce un albero di chiavi (BIP-32), in cui un percorso standard (BIP-44) sceglie il ramo di ogni account. La chiave privata scelta dà la chiave pubblica sulla curva secp256k1, la chiave pubblica dà l’indirizzo con Keccak-256, e l’indirizzo si scrive con il checksum di EIP-55.',
      'Ogni funzione della pipeline è scritta da zero in JavaScript, senza librerie, a partire dai documenti degli standard: SHA-256, SHA-512, HMAC, PBKDF2, RIPEMD-160, la permutazione Keccak-f[1600], l’aritmetica di secp256k1, Base58Check. Il diagramma mostra i valori della frase scelta in 1.1; ogni passaggio porta alla sua sezione.',
    ],
    flowTitle: 'La pipeline, con i valori della frase scelta',
    nodes: {
      mnemonic: 'Frase mnemonica',
      seed: 'Seed, 512 bit',
      privateKey: 'Chiave privata, 256 bit',
      publicKey: 'Chiave pubblica x ‖ y, 512 bit',
      address: 'Indirizzo Ethereum, 160 bit',
      checksummed: 'Indirizzo con checksum',
    },
    arrows: {
      bip39: 'BIP-39: PBKDF2-HMAC-SHA512',
      bip32: 'BIP-32 / BIP-44: HMAC-SHA512 lungo il percorso',
      secp256k1: 'secp256k1: K = kG',
      keccak: 'Keccak-256, ultimi 20 byte',
      eip55: 'EIP-55: maiuscole dall’hash',
    },
    stale: 'Valori dell’ultimo input valido: i campi in 1.1 contengono un errore.',
  },
  input: {
    intro: 'La frase predefinita è quella pubblica di prova di Hardhat e Foundry: i suoi account sono noti a tutti, e proprio per questo serve ai confronti. Si può generare una frase casuale, aggiungere una passphrase e scegliere il percorso di un wallet.',
    mnemonicLabel: 'Frase mnemonica (BIP-39, lista inglese)',
    useTest: 'Frase di prova',
    random: (n) => `Genera ${n} parole`,
    randomNote: 'Le frasi generate usano il generatore crittografico del browser (crypto.getRandomValues): sono casuali davvero, ma restano frasi di prova, mostrate in una pagina web.',
    passphraseLabel: 'Passphrase (facoltativa)',
    passphraseHint: 'La "venticinquesima parola" di BIP-39: entra nel sale di PBKDF2 e cambia l’intero seed. I wallet più diffusi la lasciano vuota.',
    presetLabel: 'Percorso di derivazione',
    presets: {
      bip44: "MetaMask, Rabby, Rainbow, Trezor, Exodus: m/44'/60'/0'/0/i",
      ledgerLive: "Ledger Live: m/44'/60'/i'/0/0",
      ledgerLegacy: "Ledger (vecchia app), MyEtherWallet: m/44'/60'/0'/i",
      custom: 'Percorso personalizzato',
    },
    indexLabel: 'Indice i',
    indexHint: (max) => `Da 0 a ${max}; nei wallet è l’account i + 1 (Account 1 è i = 0).`,
    indexError: {
      empty: 'Scrivi un indice.',
      notInteger: (t) => `"${t}" non è un intero scritto in cifre.`,
      range: (max) => `L’indice va da 0 a ${max}.`,
    },
    pathLabel: 'Percorso',
    pathHint: `Nella forma m/44'/60'/0'/0/0: un apice (o h) segna un indice hardened; al più ${MAX_PATH_DEPTH} livelli, ogni indice sotto 2^31.`,
    pathError: {
      empty: 'Scrivi un percorso.',
      format: "Non è un percorso: inizia con m e prosegue con /numero, eventualmente seguito da ' o h.",
      depth: `Troppi livelli: al più ${MAX_PATH_DEPTH}.`,
      range: 'Un indice è troppo grande: ognuno deve stare sotto 2^31 = 2147483648, perché il bit più alto segna gli indici hardened.',
    },
    status: {
      valid: (a) => `Frase valida: ${a.count} parole, ${a.entropy.length * 8} bit di entropia e ${a.checksum.length} di checksum.`,
      empty: 'Scrivi una frase di 12, 15, 18, 21 o 24 parole.',
      unknown: (list) =>
        `Non sono nella lista BIP-39 inglese: ${list
          .map((u) => `"${u.word}" (parola ${u.position}${u.suggestions.length ? `; forse ${u.suggestions.join(', ')}` : ''})`)
          .join('; ')}.`,
      length: (n) => `${n} ${n === 1 ? 'parola' : 'parole'}: BIP-39 ne vuole 12, 15, 18, 21 o 24.`,
      checksum: (a) =>
        `Le parole sono tutte nella lista, ma il checksum non torna: gli ultimi ${a.checksum.length} bit sono ${a.checksum}, i primi ${a.checksum.length} bit di SHA-256(entropia) sono ${a.expectedChecksum}. Un wallet rifiuterebbe questa frase (dettagli in 1.2).`,
    },
    stale: 'Finché i campi contengono un errore, i valori calcolati restano quelli dell’ultimo input valido.',
    testBadge: (address) => `Valori di prova: frase pubblica di Hardhat e Foundry, nessuna passphrase, percorso di MetaMask, indice 0. Indirizzo atteso: ${address}.`,
    customBadge: 'Valori diversi da quelli di prova.',
    restore: 'Ripristina i valori di prova',
  },
  bip39: {
    intro: [
      'BIP-39 trasforma un segreto casuale in parole che una persona può trascrivere, e le parole in un seed binario. Si parte da ENT bit di entropia (128, 160, 192, 224 o 256) prodotti da un generatore crittografico; si aggiungono CS = ENT/32 bit di checksum, i primi bit di SHA-256(entropia); gli ENT + CS bit si dividono in gruppi di 11, e ogni gruppo è l’indice di una parola in una lista di 2048 = 2^11. Con 128 bit: 4 bit di checksum, 132 bit in tutto, 12 parole; con 256 bit: 8 bit di checksum e 24 parole.',
      'La lista inglese è costruita perché bastino le prime quattro lettere a identificare ogni parola e perché non contenga parole simili, come build e built o woman e women: un wallet può completare le parole e intercettare molti errori prima ancora del checksum.',
    ],
    wordsTitle: 'Le parole e i loro 11 bit',
    cols: { position: '#', word: 'Parola', index: 'Indice', bits: '11 bit' },
    notInList: 'non nella lista',
    moreWords: (n) => `... e altre ${n} ${n === 1 ? 'parola' : 'parole'}, non mostrate.`,
    bitsTitle: (ent, cs) => `I ${ent + cs} bit della frase: ${ent} di entropia e, evidenziati, ${cs} di checksum`,
    entropyLabel: (bits) => `Entropia, ${bits} bit`,
    hashLabel: 'SHA-256(entropia)',
    checksumOk: (a) => `Checksum: gli ultimi ${a.checksum.length} bit della frase, ${a.checksum}, coincidono con i primi ${a.checksum.length} bit di SHA-256(entropia). ✓`,
    checksumBad: (a) => `Checksum: gli ultimi ${a.checksum.length} bit della frase sono ${a.checksum}, ma i primi ${a.checksum.length} bit di SHA-256(entropia) sono ${a.expectedChecksum}. ✗`,
    noBits: 'Finché ci sono parole fuori dalla lista, o un numero di parole non valido, i bit non si possono ricostruire.',
    seedTitle: 'Dalla frase al seed',
    seedFormula: 'seed = PBKDF2-HMAC-SHA512(password = frase normalizzata NFKD, sale = "mnemonic" + passphrase, 2048 iterazioni, 64 byte)',
    seedLabel: (hasPassphrase) => (hasPassphrase ? 'Seed, 512 bit, con la passphrase scelta' : 'Seed, 512 bit, senza passphrase'),
    after: [
      'Il seed si calcola dal testo delle parole, non dall’entropia. Il checksum non entra nel calcolo (anche una frase con checksum sbagliato ha un seed), ma BIP-39 chiede ai wallet di rifiutarla; e la stessa entropia scritta con la lista di un’altra lingua dà un seed diverso. La normalizzazione Unicode NFKD rende identica la stessa frase scritta su tastiere diverse.',
      'Le 2048 iterazioni rallentano di un fattore 2^11 chi prova frasi o passphrase candidate, ma non aggiungono entropia: la sicurezza resta quella dei 128 (o 256) bit iniziali, e chi conosce 11 parole su 12 trova l’ultima fra 128 candidate. La passphrase aggiunge un secondo fattore: ogni passphrase dà un wallet valido e diverso, e senza quella giusta i fondi semplicemente non compaiono (plausible deniability).',
    ],
  },
  bip32: {
    intro: [
      'BIP-32 costruisce un albero di chiavi a partire da un solo seed. La radice è I = HMAC-SHA512(chiave = "Bitcoin seed", dati = seed): i primi 256 bit, IL, sono la chiave privata master; gli altri 256, IR, il chain code, una seconda metà segreta che entra in ogni derivazione, così che la sola chiave privata di un nodo non basti a calcolarne i figli.',
      "Il figlio i di un nodo (k, c) si ottiene da I = HMAC-SHA512(c, dati), con k_i = IL + k (mod n) e chain code c_i = IR. Per gli indici hardened, da 2^31 in su e scritti con l’apice (44'), i dati sono 0x00 ‖ k ‖ i e serve la chiave privata del padre. Per quelli normali i dati sono la chiave pubblica compressa del padre ‖ i: così anche le chiavi pubbliche figlie si calcolano dalla sola chiave pubblica estesa del padre (xpub), con K_i = IL·G + K. È ciò che permette a un wallet in sola lettura, o al server di un negozio, di generare indirizzi sempre nuovi senza mai toccare una chiave privata.",
    ],
    levelsTitle: 'Il percorso, livello per livello',
    cols: { path: 'Nodo', kind: 'Derivazione', data: 'Dati di HMAC-SHA512', key: 'Chiave privata k', chain: 'Chain code c' },
    kinds: {
      master: 'master: chiave "Bitcoin seed", dati = seed',
      hardened: 'hardened: 0x00 ‖ k del padre ‖ i',
      normal: 'normale: K del padre ‖ i',
    },
    extendedTitle: 'Le chiavi estese',
    xprv: (path) => `xprv del nodo ${path}`,
    xpub: (path) => `xpub del nodo ${path}`,
    parentXpub: (path) => `xpub del padre, ${path}`,
    extendedNote: "Base58Check di 78 byte: versione (per cui il testo inizia con xprv o xpub), profondità, impronta del padre (i primi 4 byte di RIPEMD-160(SHA-256) della sua chiave pubblica), indice, chain code e chiave. La xpub del nodo m/44'/60'/0'/0 è quella che un wallet in sola lettura importa per vedere tutti gli indirizzi di un account.",
    leakTitle: 'Perché i primi livelli sono hardened',
    leak: (d) => [
      `Chi possiede la xpub del padre (${d.parentPath}) calcola da solo IL = HMAC-SHA512(c, K ‖ ${d.index}) per il figlio normale ${d.childPath}: qui IL = ${short(d.IL)}. Se trapela anche la chiave privata di quel figlio, k_i = ${short(d.childKey)}, la chiave privata del padre è k = k_i - IL (mod n) = ${short(d.recovered)}, ${d.matches ? 'esattamente quella vera ✓' : 'che però non coincide con quella vera ✗'}. E dal padre seguono tutte le chiavi sorelle.`,
      'Con un indice hardened il calcolo è impossibile, perché IL dipende dalla chiave privata del padre. Per questo BIP-44 rende hardened scopo, moneta e account: una fuga di questo tipo resta confinata in un account, e la xpub di un account non dice nulla degli altri.',
    ],
    leakHardened: 'L’ultimo livello del percorso scelto è hardened: la xpub del padre e la chiave figlia, insieme, non rivelano nulla. È proprio lo scopo della derivazione hardened.',
    leakMaster: 'Il percorso scelto è m: il nodo master non ha un padre, e non c’è nulla da ricavare.',
  },
  bip44: {
    intro: "BIP-32 definisce l’albero, non quale ramo usare. BIP-44, sulla base di BIP-43, fissa cinque livelli, m / purpose' / coin_type' / account' / change / address_index, così che wallet diversi trovino le stesse chiavi dalla stessa frase e che monete e account diversi stiano in rami indipendenti.",
    levelsTitle: (path) => `I livelli di ${path}`,
    roles: {
      purpose: () => 'scopo: il numero del BIP che definisce la struttura (BIP-43). Hardened.',
      coinType: (v) => `tipo di moneta, dal registro SLIP-44: 0 Bitcoin, 1 le reti di test, 60 Ethereum${v === 60 ? '' : ` (qui ${v}: non è Ethereum)`}. Hardened: monete diverse in rami indipendenti.`,
      account: () => 'account, numerati da 0. Hardened: la xpub di un account non dice nulla degli altri.',
      change: () => 'catena: 0 esterna (indirizzi per ricevere), 1 interna (resto). Ethereum non ha resto, perché non usa UTXO, e usa sempre 0.',
      index: () => 'indice dell’indirizzo, da 0 in su. Normale: la xpub del livello precedente genera tutti gli indirizzi.',
    },
    notStandard: (path) => `${path} non ha la struttura di BIP-44: BIP-32 lo deriva comunque, ma un wallet standard non lo cercherebbe.`,
    compareTitle: 'La stessa frase in wallet diversi',
    compareIntro: (n) => `I wallet non usano tutti lo stesso percorso per l’account i: MetaMask, Rabby, Rainbow, Trezor ed Exodus cambiano l’ultimo indice, Ledger Live cambia l’account, la vecchia app di Ledger e MyEtherWallet usano un percorso a quattro livelli. Per i = 0 MetaMask e Ledger Live coincidono, perché il percorso è lo stesso; dal secondo account divergono. Gli indirizzi per i = 0, ..., ${n - 1} della frase e della passphrase scelte, con evidenziato il percorso in uso:`,
    cols: { wallet: 'Wallet', path: 'Percorso', address: 'Indirizzo' },
    presetNames: { bip44: 'MetaMask, Rabby, ...', ledgerLive: 'Ledger Live', ledgerLegacy: 'Ledger vecchio, MEW' },
    testMark: 'account pubblico di prova',
    after: [
      'Per questo importare la stessa frase in un altro wallet può mostrare un portafoglio "vuoto": i fondi sono su un altro ramo dell’albero. E per questo i wallet esplorano gli indirizzi in ordine e si fermano dopo una serie di indirizzi mai usati (il gap limit di BIP-44, 20).',
      'Il tipo 60 vale per tutte le reti compatibili con Ethereum (Polygon, Arbitrum, BNB Chain, ...): la stessa chiave dà lo stesso indirizzo su ognuna. Sono le firme, che dal 2016 includono l’identificativo della rete (EIP-155), a impedire che una transazione valida su una rete venga ripetuta su un’altra.',
    ],
  },
  secp: {
    intro: [
      'secp256k1 è la curva y² = x³ + 7 sul campo F_p, con p = 2^256 - 2^32 - 977, definita nel 2000 dallo standard SEC 2 e scelta da Bitcoin e poi da Ethereum. Il punto base G genera un gruppo di ordine primo n, poco meno di 2^256, che contiene tutti i punti della curva (cofattore 1). La chiave privata è un intero k con 1 ≤ k < n, la chiave pubblica il punto K = kG: la moltiplicazione scalare dell’Homework #1, su numeri di 256 bit.',
      'Calcolare K da k costa circa 256 raddoppi e 128 somme di punti; tornare da K a k è il logaritmo discreto su curva ellittica, per cui il miglior algoritmo noto, il rho di Pollard, richiede circa √n ≈ 2^128 operazioni. È questa asimmetria a rendere pubblicabile K, che serve a verificare le firme ECDSA fatte con k.',
    ],
    constantsTitle: 'I parametri della curva',
    constants: { p: 'p, il primo del campo', n: 'n, l’ordine di G', Gx: 'x di G', Gy: 'y di G' },
    keyTitle: 'Dalla chiave privata al punto',
    keyLabel: 'Chiave privata k',
    keyCheck: (ok) => (ok ? '1 ≤ k < n ✓' : '1 ≤ k < n ✗'),
    xLabel: 'x di K = kG',
    yLabel: 'y di K = kG',
    onCurve: (ok) => (ok ? 'y² ≡ x³ + 7 (mod p) ✓' : 'y² ≢ x³ + 7 (mod p) ✗'),
    encodingsTitle: 'Le codifiche della chiave pubblica',
    uncompressed: 'Non compressa, 65 byte: 04 ‖ x ‖ y (SEC 1)',
    compressed: (even) => `Compressa, 33 byte: ${even ? '02' : '03'} ‖ x, perché y è ${even ? 'pari' : 'dispari'}`,
    ethereumForm: 'Ethereum, 64 byte: x ‖ y senza prefisso, l’ingresso di Keccak-256',
    decompress: (ok) => `Dalla forma compressa si torna a y = (x³ + 7)^((p + 1)/4) mod p, scegliendo la radice con la parità del prefisso${ok ? ': si riottiene la stessa y ✓' : ': y diversa ✗'}`,
    after: [
      'La forma compressa basta perché per ogni x ci sono al più due punti, (x, y) e (x, p - y), uno con y pari e uno con y dispari; e poiché p ≡ 3 (mod 4) la radice quadrata è un solo elevamento a potenza. BIP-32 usa la forma compressa, nei dati di derivazione e nelle impronte; Ethereum usa la coppia x ‖ y senza prefisso.',
      'Le transazioni Ethereum non contengono né la chiave pubblica né il mittente: contengono la firma ECDSA (r, s) e un bit di recupero (v, o yParity) che dice quale dei due punti con ascissa r usare. Dalla firma la rete ricostruisce K (ecrecover), ne calcola l’indirizzo e lo usa come mittente. E poiché con (r, s) anche (r, n - s) sarebbe valida, dal 2016 Ethereum accetta solo s ≤ n/2 (EIP-2): la simmetria P ↔ -P già vista nell’Homework #1.',
    ],
  },
  keccak: {
    intro: 'L’indirizzo è un’impronta della chiave pubblica: i 64 byte x ‖ y entrano in Keccak-256, e dei 32 byte prodotti si tengono gli ultimi 20. L’hash serve a tre cose: accorcia l’identificatore (20 byte invece di 64), lo rende uniforme e privo della struttura algebrica del punto, e lo lega alla chiave in modo che non si possa tornare indietro.',
    inputLabel: 'Ingresso: x ‖ y, 64 byte',
    hashLabel: 'Keccak-256(x ‖ y), 32 byte: i primi 12 si scartano, gli ultimi 20 (evidenziati) sono l’indirizzo',
    addressLabel: 'Indirizzo, in minuscolo',
    sha3Label: 'Per confronto, SHA3-256(x ‖ y): stesso ingresso, stessa permutazione, padding diverso (sezione 4.2)',
    after: [
      'Troncare a 160 bit costa sicurezza solo contro le collisioni. Trovare una chiave per un indirizzo dato richiede circa 2^160 tentativi; trovare due chiavi con lo stesso indirizzo, qualunque esso sia, circa 2^80 (paradosso del compleanno). Il secondo numero conta solo per chi può scegliere entrambe le parti, per esempio con indirizzi di contratti calcolabili in anticipo; per rubare un indirizzo esistente conta il primo.',
      'Keccak-256 è ovunque in Ethereum: identifica transazioni e blocchi, dà l’indirizzo dei contratti (da mittente e nonce, o con CREATE2 da un sale e dal codice), i selettori delle funzioni (i primi 4 byte dell’hash della loro firma) e il checksum di EIP-55, nella sezione che segue.',
    ],
  },
  eip55: {
    intro: [
      'Le cifre esadecimali non distinguono maiuscole e minuscole, ed EIP-55 usa proprio questa libertà. Si calcola Keccak-256 del testo dell’indirizzo in minuscolo (i 40 caratteri ASCII, senza 0x), e ogni lettera a-f dell’indirizzo diventa maiuscola se la cifra esadecimale corrispondente dell’hash vale 8 o più, cioè se il suo bit più alto è 1. Le cifre 0-9 non cambiano.',
      'Per chi ignora le maiuscole l’indirizzo resta lo stesso, quindi lo schema è compatibile con tutto il software precedente; chi lo controlla rifiuta un indirizzo con le maiuscole sbagliate.',
    ],
    gridTitle: 'Carattere per carattere',
    gridLegend: 'Sotto ogni carattere, la cifra corrispondente di Keccak-256 dell’indirizzo minuscolo. Evidenziate le lettere maiuscole (cifra da 8 a f); in grigio le cifre 0-9, che non portano checksum.',
    hashLabel: 'Keccak-256 del testo dell’indirizzo minuscolo',
    resultLabel: 'Indirizzo con checksum EIP-55',
    letters: (n) => `${n} ${n === 1 ? 'lettera' : 'lettere'}, quindi ${n} bit di controllo.`,
    checkerTitle: 'Prova il controllo',
    checkerLabel: 'Indirizzo da controllare',
    checkerHint: 'Cambia una maiuscola, o un carattere, e osserva il risultato.',
    check: {
      format: 'Non è un indirizzo: servono 0x e 40 cifre esadecimali.',
      valid: (same) =>
        same
          ? 'Checksum corretto: è l’indirizzo calcolato sopra. ✓'
          : 'Checksum corretto, ma è un indirizzo diverso da quello calcolato sopra: se è un errore di battitura, è uno dei rari che EIP-55 non vede (sezione 3.6).',
      noChecksum: (same) => `Tutto minuscolo o tutto maiuscolo: non c’è checksum da controllare, e un wallet lo accetta così com’è${same ? ' (è l’indirizzo calcolato sopra)' : ''}.`,
      invalid: (same, positions) => {
        const list = positions.map((p) => p + 1).join(', ');
        const where = positions.length === 1 ? `la lettera in posizione ${list} dovrebbe` : `le lettere in posizione ${list} dovrebbero`;
        return same
          ? `Stesso indirizzo, maiuscole sbagliate: ${where} avere l’altra forma, e un wallet lo rifiuterebbe. ✗`
          : `Indirizzo diverso da quello calcolato, e le maiuscole non tornano (${where} avere l’altra forma): l’errore di battitura è stato intercettato. ✗`;
      },
    },
    after: [
      'Ogni lettera porta un bit di controllo, e un indirizzo ha in media 15 lettere. Un errore di battitura passa inosservato in media con probabilità dello 0,0247% (sezione 3.6), contro il 6,25% del checksum di una frase di 12 parole; e senza aggiungere un solo carattere.',
      'Il checksum protegge dagli errori, non dagli attacchi: chiunque calcola la forma corretta di qualunque indirizzo. Non difende dal malware che sostituisce l’indirizzo negli appunti, né dall’address poisoning, in cui l’attaccante crea un indirizzo con le stesse cifre iniziali e finali di uno che la vittima usa, sperando che venga copiato dalla cronologia.',
    ],
  },
  verify: {
    intro: 'Ogni passaggio, scritto da zero, è confrontato con i vettori di test pubblicati: i digest di riferimento delle funzioni di hash (FIPS 180-4, RFC 4231, FIPS 202), i vettori di BIP-39 del repository di riferimento (passphrase "TREZOR"), il vettore 1 di BIP-32, i casi di prova di EIP-55 e gli account noti della frase di prova. Il calcolo avviene qui, nel browser, all’apertura della pagina.',
    summary: (ok, total) => (ok === total ? `${ok} controlli su ${total} riprodotti esattamente. ✓` : `${ok} controlli su ${total} riprodotti; ${total - ok} diversi. ✗`),
    groups: {
      hash: 'Funzioni di hash',
      bip39: 'BIP-39: vettori ufficiali, passphrase "TREZOR"',
      bip32: 'BIP-32: vettore 1, seed 000102...0f',
      ethereum: 'Frase di prova: indirizzi e chiavi private',
      eip55: 'EIP-55: casi di prova dello standard',
    },
    details: (n) => `I ${n} controlli, uno per uno`,
    cols: { check: 'Controllo', expected: 'Valore atteso', result: 'Esito' },
    label: (row) => {
      switch (row.check) {
        case 'entropyToWords':
          return `${row.subject}: entropia → parole`;
        case 'wordsToSeed':
          return `${row.subject}: parole + "TREZOR" → seed`;
        case 'seedToMaster':
          return `${row.subject}: seed → xprv master`;
        case 'xprv':
        case 'xpub':
          return `${row.subject}: ${row.check}`;
        case 'address':
          return `${row.subject}: indirizzo`;
        case 'privateKey':
          return `${row.subject}: chiave privata`;
        case 'checksum':
          return 'forma con checksum';
        default:
          return row.subject;
      }
    },
    ok: 'riprodotto',
    failed: 'diverso',
  },
  wallets: {
    intro: 'La consegna suggerisce di provare un wallet vero. La frase di prova è pubblica, quindi si può importare senza rischi, purché non ci si versino fondi veri: il wallet deve mostrare gli stessi indirizzi che questa pagina calcola, e il confronto verifica l’intera pipeline su software reale. I passi qui sotto sono stati eseguiti davvero il 13 ottobre 2026, con MetaMask 13.50.0 e Rabby 0.94.11 per Chrome; le voci sono quelle mostrate dai wallet, che possono cambiarle da una versione all’altra.',
    steps: [
      'Usare un profilo del browser separato, o un browser che non si usa per altro, senza estensioni di wallet che custodiscono fondi veri.',
      'MetaMask: "I have an existing wallet", poi "Import using Secret Recovery Phrase" (non gli accessi con Google, Apple o Telegram). In "Import a wallet" scrivere o incollare le 12 parole nell’unico campo e premere "Continue"; in "MetaMask password" scrivere due volte la password, spuntare "If I lose this password, MetaMask can’t reset it." e premere "Create password"; poi "Maybe later" per la biometria, "Continue" e "Open wallet". In questa versione le schermate di importazione restano in inglese anche con la lingua italiana, perché la traduzione manca.',
      'In alto compare "Account 1" con 0xf39Fd...92266. Per la frase di prova MetaMask trova da solo gli altri account, perché hanno transazioni: nella lista "Accounts", Account 2 è 0x70997...c79C8 e Account 3 è 0x3C44C...293BC, cioè gli indici 1 e 2 di questa pagina con il percorso "MetaMask, Rabby, ...". "Receive" mostra lo stesso indirizzo su Ethereum, Linea, Base, Arbitrum, BNB Chain, OP e Polygon: il tipo di moneta 60 di 1.4 vale per tutte.',
      'Con una frase generata qui con "Genera" MetaMask mostra solo Account 1, e "Add account" nella lista degli account crea Account 2 e Account 3, con gli indirizzi degli indici 1 e 2 di questa pagina. Una frase con il checksum sbagliato non passa: "Continue" resta disattivato e compare "Secret Recovery Phrase not found.".',
      'Rabby: "I already have an address", poi "Seed Phrase or Private Key"; nella scheda "Seed Phrase" ("My seed phrase has 12 words") scrivere le parole e premere "Next"; in "Set Password" scrivere due volte la password e premere "Confirm". La schermata "Address Imported" mostra "Seed Phrase 1 #1" con 0xf39fd6...b92266. Con il checksum sbagliato Rabby risponde "The seed phrase is invalid, please check!".',
      'In Rabby, "Add more addresses from this Seed Phrase" apre "Manage Seed Phrase": gli indirizzi completi della frase, con le reti usate, la data della prima transazione e il saldo (gli account della frase di prova sono in uso dal 2020 su decine di reti). In "Advanced Settings", "Custom Address HD path" offre "BIP44", "Ledger Live" e "Ledger Legacy": i primi tre indirizzi di ciascuno coincidono con le righe della tabella in 1.4.',
      'Rainbow ed Exodus, su telefono e computer, hanno una voce analoga per ripristinare un wallet da una frase (qui non provati). MetaMask non chiede la passphrase di BIP-39; Trezor e Ledger la offrono come "wallet nascosto", e con una passphrase la stessa frase dà indirizzi del tutto diversi (1.2).',
    ],
    tableTitle: 'Gli account attesi della frase di prova',
    cols: { account: 'Account', path: 'Percorso', address: 'Indirizzo', check: 'Calcolato qui' },
    accountName: (i) => `Account ${i + 1}`,
    verified: 'Verifica del 13 ottobre 2026: MetaMask 13.50.0 mostra 0xf39Fd...92266, 0x70997...c79C8 e 0x3C44C...293BC; Rabby 0.94.11 elenca per esteso 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266, 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 e 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc. Sono gli indirizzi della tabella.',
  },
  categories: {
    intro: 'La consegna chiede di distinguere cinque cose che nella pipeline convivono, a volte nella stessa funzione. Il criterio è lo scopo, non l’algoritmo: SHA-256 è una funzione di hash, ma in BIP-39 fa da checksum; Keccak-256 dà l’indirizzo e, in EIP-55, anche il checksum.',
    cols: { category: 'Categoria', what: 'Che cosa fa', where: 'Nella pipeline', properties: 'Proprietà' },
    rows: [
      {
        key: 'generation',
        name: 'Generazione di chiavi',
        what: 'Crea un segreto nuovo da una sorgente casuale. È l’unico passaggio non deterministico: tutto il resto ne è funzione.',
        where: 'L’entropia di BIP-39, 128-256 bit da un generatore crittografico (crypto.getRandomValues, il generatore di un wallet hardware); qui i pulsanti "Genera".',
        properties: 'Segreta e irripetibile. La sicurezza dell’intero wallet è l’imprevedibilità di questo passo: un generatore debole rende inutile tutto il resto.',
      },
      {
        key: 'derivation',
        name: 'Derivazione di chiavi',
        what: 'Calcola nuovi segreti da un segreto, in modo deterministico: stesso ingresso, stessa uscita.',
        where: 'PBKDF2-HMAC-SHA512 (frase → seed, con 2048 iterazioni); HMAC-SHA512 di BIP-32 (seed → master → figli) lungo il percorso di BIP-44.',
        properties: 'Non aggiunge entropia; è a senso unico (dai figli hardened non si risale ai padri); permette un solo backup per infinite chiavi.',
      },
      {
        key: 'publicKey',
        name: 'Crittografia a chiave pubblica',
        what: 'Lega una chiave privata k a una pubblica K = kG: K si può pubblicare, k firma e K verifica.',
        where: 'secp256k1: chiave privata → chiave pubblica; firme ECDSA delle transazioni; derivazione pubblica di BIP-32 (K_i = IL·G + K).',
        properties: 'Strutturata: è un omomorfismo di gruppi, ed è questo che rende possibili le firme. A senso unico solo computazionalmente (logaritmo discreto).',
      },
      {
        key: 'hashing',
        name: 'Hashing',
        what: 'Comprime un ingresso qualsiasi in un’impronta di lunghezza fissa, resistente a controimmagini e collisioni e indistinguibile da bit casuali.',
        where: 'Keccak-256 (indirizzo, EIP-55); SHA-512 dentro HMAC e PBKDF2; SHA-256 (checksum di BIP-39, Base58Check); RIPEMD-160(SHA-256) per le impronte di BIP-32.',
        properties: 'Pubblico, senza chiave, non invertibile, senza struttura algebrica.',
      },
      {
        key: 'checksum',
        name: 'Checksum',
        what: 'Aggiunge ridondanza per accorgersi degli errori accidentali di trascrizione o di battitura.',
        where: 'BIP-39 (4-8 bit da SHA-256); EIP-55 (le maiuscole, da Keccak-256); Base58Check (4 byte di doppio SHA-256) in xprv e xpub.',
        properties: 'Pubblico: protegge dagli errori, non dagli attacchi, perché chiunque calcola il checksum di un dato falso. Con c bit di controllo un errore casuale passa con probabilità circa 2^-c.',
      },
      {
        key: 'encoding',
        name: 'Codifica',
        what: 'Rappresenta gli stessi bit in un’altra forma, per persone o programmi; è reversibile e non nasconde nulla.',
        where: 'Le parole (11 bit ciascuna), l’esadecimale con 0x, il Base58 di xprv e xpub, i formati dei punti (04, 02/03), le maiuscole di EIP-55.',
        properties: 'Biiettiva, senza sicurezza: una frase mnemonica è una codifica dell’entropia, non una cifratura.',
      },
    ],
    after: [
      'Due confusioni frequenti. La prima fra generazione e derivazione: quando un wallet "crea un nuovo account" non genera nulla, deriva l’indice successivo; per questo una sola frase ripristina tutti gli account, e per questo chi conosce la frase li conosce tutti. La seconda fra codifica e cifratura: parole, esadecimale e Base58 rappresentano i segreti senza proteggerli; l’unica protezione di una frase scritta su carta è la carta.',
      'E un caso che appartiene a due categorie: EIP-55 è una codifica (le maiuscole non cambiano l’indirizzo) che trasporta un checksum (le maiuscole dipendono dall’hash). È ciò che lo rende compatibile all’indietro.',
    ],
  },
  stats: {
    intro: [
      'Ogni passaggio della pipeline dovrebbe produrre uscite che, viste da fuori, non si distinguono da bit casuali uniformi, tranne dove la struttura è voluta: le parole codificano i bit, la chiave pubblica è un punto della curva, le maiuscole codificano un checksum. Qui lo si verifica con test d’ipotesi, passaggio per passaggio.',
      `A differenza dell’Homework #1, dove la popolazione era intera (tutti i multipli di un punto su una curva giocattolo), qui gli ingressi sono campioni casuali e indipendenti di spazi enormi, 2^128 frasi e 2^256 chiavi: i test sono inferenziali, e un p-value piccolo direbbe qualcosa sulla funzione, non solo sul campione. Gli ingressi vengono da un generatore con seme fisso (mulberry32, seme ${EXPLORE_SEED}), così la pagina, il programma scaricabile e il terminale stampano gli stessi numeri; i campioni sono dimensionati perché il calcolo duri pochi secondi.`,
      `Ogni test ha livello di significatività α = ${IT.num(SIGNIFICANCE, 2)} e un’ipotesi nulla H₀ scritta accanto. Un test superato, però, non dimostra nulla sulla sicurezza: misura l’assenza di difetti grossolani, non la difficoltà di invertire una funzione (sezione 3.7).`,
    ],
    verdict: { reject: 'H₀ rifiutata', notReject: 'H₀ non rifiutata' },
    testLine: testLineIt,
    steps: { bip39: 'BIP-39', seed: 'Seed', bip32: 'BIP-32', secp256k1: 'secp256k1', keccak: 'Keccak-256', eip55: 'EIP-55' },
    labels: {
      bip39: {
        words: 'Le 2048 parole sono equiprobabili (χ² di adattamento)',
        nibble: 'I 4 bit di checksum sono uniformi sui 16 valori (χ²)',
        random: '12 parole a caso passano il checksum con probabilità 1/16 (binomiale)',
        typos: 'Una parola sostituita passa il checksum con la probabilità calcolata (binomiale)',
      },
      seed: {
        bits: 'Ogni bit del seed è una moneta equa: Σz² ~ χ²(512)',
        avalancheMean: 'Un bit di entropia cambiato cambia in media 256 bit del seed (z)',
        avalancheFit: 'Le distanze seguono la Binomiale(512, 1/2) (χ²)',
      },
      bip32: {
        bits: 'Ogni bit delle chiavi figlie è una moneta equa: Σz² ~ χ²(256)',
        siblingsMean: 'Chiavi di indici consecutivi distano in media 128 bit (z)',
        siblingsFit: 'Le loro distanze seguono la Binomiale(256, 1/2) (χ²)',
        correlation: 'Bit dell’indice e bit della chiave sono indipendenti (permutazioni)',
      },
      secp256k1: {
        parity: 'La y è dispari con probabilità 1/2 (binomiale)',
        bitsX: 'I bit di x sono monete eque: Σz² ~ χ²(256)',
        bitsY: 'I bit di y sono monete eque: Σz² ~ χ²(256)',
        avalancheMean: 'Un bit di k cambiato cambia in media 256 bit di x ‖ y (z)',
        avalancheFit: 'Le distanze seguono la Binomiale(512, 1/2) (χ²)',
      },
      keccak: {
        bits: 'I bit degli indirizzi sono monete eque: Σz² ~ χ²(160)',
        firstHex: 'La prima cifra esadecimale è uniforme (χ²)',
        bytes: 'I byte degli indirizzi sono uniformi sui 256 valori (χ²)',
        avalancheMean: 'Un bit d’ingresso cambiato cambia in media 128 bit dell’uscita (z)',
        avalancheFit: 'Le distanze seguono la Binomiale(256, 1/2) (χ²)',
        sacOutput: 'Ogni bit d’uscita cambia con probabilità 1/2: Σz² ~ χ²(256)',
        sacInput: 'Ogni bit d’ingresso cambia in media metà dell’uscita: Σz² ~ χ²(512)',
        sha3Mean: 'Keccak-256 e SHA3-256 dello stesso ingresso distano in media 128 bit (z)',
        sha3Fit: 'Le loro distanze seguono la Binomiale(256, 1/2) (χ²)',
      },
      eip55: {
        letters: 'Le lettere per indirizzo seguono la Binomiale(40, 3/8) (χ²)',
        uppercase: 'Metà delle lettere è maiuscola (binomiale)',
        typos: 'Gli errori di battitura accettati sono quelli previsti per un hash ideale (Poisson esatto)',
      },
    },
    // the label over a chart, for the bar or the cell under the pointer
    tips: {
      word: (index, word, count, expected) => `parola ${index}, "${word}": ${count === 1 ? 'una volta' : `${count} volte`} (attese ${IT.approx(expected)})`,
      words: (from, to, fromWord, toWord, min, max) => `parole da ${from} ("${fromWord}") a ${to} ("${toWord}"): ${min === max ? `${max} volte` : `da ${min} a ${max} volte`} ciascuna`,
      nibble: (value, count, expected) => `checksum ${value.toString(2).padStart(4, '0')} (${value}): ${count} ${count === 1 ? 'frase' : 'frasi'} (attese ${IT.approx(expected)})`,
      of: { seed: 'del seed', key: 'della chiave', x: 'di x', y: 'di y', address: 'dell’indirizzo' },
      bit: (what, index, fraction, z) => `bit ${index} ${what}: quota di 1 = ${IT.num(fraction, 3)} (attesa 0,500), z = ${IT.num(z, 2)}`,
      distances: (from, to, count, expected) => {
        let what = from === to ? `distanza ${from}` : `distanze da ${from} a ${to}`;
        if (from === null) what = `distanze fino a ${to}`;
        else if (to === null) what = `distanze da ${from} in su`;
        return `${what}: ${count} ${count === 1 ? 'coppia' : 'coppie'} (attese ${IT.approx(expected)})`;
      },
      indexKey: (row, from, to, z) => `bit ${row} dell’indice, bit ${from}-${to} della chiave: ${z === null ? 'non definito' : `z = ${IT.num(z, 2)}`}`,
      firstHex: (digit, count, expected) => `prima cifra ${digit}: ${count} ${count === 1 ? 'indirizzo' : 'indirizzi'} (attesi ${IT.approx(expected)})`,
      sacBlock: (inFrom, inTo, outFrom, outTo, z) => `bit d’ingresso ${inFrom}-${inTo}, bit d’uscita ${outFrom}-${outTo}: z = ${IT.num(z, 2)}`,
      letters: (n, count, expected) => `${n} ${n === 1 ? 'lettera' : 'lettere'}: ${count} ${count === 1 ? 'indirizzo' : 'indirizzi'} (attesi ${IT.approx(expected)})`,
    },
    axes: {
      indexBits: 'bit dell’indice',
      keyBits: `bit della chiave, a blocchi di ${CORRELATION_BLOCK}`,
      inputBits: 'bit d’ingresso, a blocchi di 16',
      outputBits: 'bit d’uscita, a blocchi di 8',
    },
    bip39: {
      intro: `Se l’entropia è uniforme, ogni parola è un blocco di 11 bit uniforme, e le 2048 parole devono comparire con la stessa frequenza. L’ultima parola contiene anche il checksum: 7 bit di entropia e 4 bit di SHA-256, che per una buona funzione di hash sono a loro volta uniformi. Campioni: ${SAMPLES.mnemonics} frasi casuali, ${SAMPLES.sequences} sequenze di parole a caso, ${SAMPLES.wordTypos} frasi con una parola sostituita.`,
      wordsChart: (N, M) => `Frequenza di ciascuna delle 2048 parole in ${M} frasi (${N} parole); tratteggio: ${N}/2048 ≈ ${IT.num(N / 2048, 2)}`,
      nibbleChart: (M) => `Gli ultimi 4 bit, il checksum, delle ${M} frasi; tratteggio: ${M}/16`,
      explain: (s) => {
        const r = s.bip39.randomSequences;
        const t = s.bip39.wordTypos;
        return [
          `Delle ${r.trials} sequenze di 12 parole scelte a caso fra le 2048, ${r.successes} hanno il checksum giusto (${IT.pct(r.rate, 2)}), contro l’1/16 = 6,25% atteso: una frase inventata, o ricordata male, ha una probabilità su sedici di sembrare valida. Con 24 parole il checksum ha 8 bit e la probabilità scende a 1/256.`,
          `Sostituendo una parola a caso in ${t.trials} frasi valide, il checksum ha intercettato l’errore nel ${IT.pct(t.detected, 2)} dei casi; il ${IT.pct(t.rate, 2)} è passato, contro il ${IT.pct(t.expectedRate, 2)} atteso. L’atteso non è esattamente 1/16: se cambia una delle prime 11 parole cambia l’entropia, e il checksum torna giusto con probabilità 1/16; se cambia l’ultima, l’entropia resta la stessa in 15 casi su 2047 (cambiano solo i bit di checksum, e la frase è sempre rifiutata) e cambia negli altri 2032, di cui 127 hanno il checksum giusto: (11/12)·(1/16) + (1/12)·(127/2047).`,
          'Il checksum di BIP-39 è corto per scelta: serve a intercettare gli errori di trascrizione, non a proteggere il segreto, e ogni bit di controllo costerebbe un bit di entropia o una parola in più. Le prime quattro lettere uniche fanno il resto: una parola storpiata di solito non è nella lista, e viene rifiutata ancora prima del checksum.',
        ];
      },
    },
    seed: {
      intro: `Il seed è l’uscita di PBKDF2-HMAC-SHA512. Per una funzione pseudocasuale ogni bit è una moneta equa, indipendente dalle altre, e cambiare un solo bit dell’entropia (quindi una parola, e spesso il checksum) cambia ciascun bit del seed con probabilità 1/2: la distanza di Hamming fra i due seed segue una Binomiale(512, 1/2), con media 256 e deviazione standard √512/2 ≈ 11,3. Campioni: ${SAMPLES.seeds} seed e ${SAMPLES.seedPairs} coppie.`,
      bitsChart: (N) => `Quota di 1 in ciascuno dei 512 bit, su ${N} seed; tratteggio: 0,5`,
      distanceChart: (d, c) => `Distanze di Hamming fra i seed di ${d.N} coppie di frasi la cui entropia differisce di un bit; tratteggio: Binomiale(512, 1/2)${distanceRangeIt(c)}`,
      explain: (s) => {
        const b = s.seed.bits;
        const a = s.seed.avalanche;
        const biased = 512 * (1 + 4 * 0.05 ** 2 * b.N);
        return [
          `I ${b.N} seed contano ${b.N * 512} bit, con ${b.beyond3} posizioni su 512 oltre 3 deviazioni standard da 1/2 (attese per caso ${IT.num(b.expectedBeyond3, 2)}). Cambiando un bit dell’entropia, i due seed differiscono in media in ${IT.num(a.mean, 1)} bit su 512, con deviazione standard ${IT.num(a.sd, 2)} (attesa ${IT.num(a.expectedSd, 2)}), da un minimo di ${a.min} a un massimo di ${a.max}: due frasi quasi uguali danno seed indipendenti come due stringhe casuali.`,
          `Il campione è piccolo per scelta: ogni seed costa 2048 iterazioni di HMAC-SHA512, cioè più di 4000 compressioni di SHA-512, ed è proprio la lentezza che PBKDF2 deve garantire. ${b.N} seed bastano comunque a vedere un difetto grossolano: se ogni bit valesse 1 con probabilità 0,55, Σz² varrebbe in media circa ${IT.num(biased, 0)} invece di 512 ± 32, con un p-value di circa ${IT.pval(chiSquarePValue(biased, 512))}.`,
        ];
      },
    },
    bip32: {
      intro: `Le chiavi m/44'/60'/0'/0/i della frase di prova, per i da 0 a ${SAMPLES.keys - 1}. Indici consecutivi differiscono in pochi bit; entrano in HMAC-SHA512 con il chain code del padre, e k_i = IL + k (mod n). Se HMAC si comporta come una funzione pseudocasuale le chiavi non hanno legami visibili con l’indice: bit bilanciati, chiavi vicine a distanza Binomiale(256, 1/2), nessuna correlazione fra i bit dell’indice e quelli della chiave.`,
      bitsChart: (N) => `Quota di 1 in ciascuno dei 256 bit, su ${N} chiavi figlie; tratteggio: 0,5`,
      distanceChart: (d, c) => `Distanze fra le chiavi degli indici i e i + 1 (${d.N} coppie); tratteggio: Binomiale(256, 1/2)${distanceRangeIt(c)}`,
      heatmap: (c) => `Correlazione fra i ${c.inputBits} bit dell’indice (righe) e i 256 bit della chiave a blocchi di ${CORRELATION_BLOCK} (colonne), come punteggio z: blu negativo, rosso positivo, scala ±4. Senza legami ogni cella è circa N(0, 1).`,
      explain: (s) => {
        const b = s.bip32.bits;
        const d = s.bip32.siblings;
        const c = s.bip32.correlation;
        return [
          `Le ${b.N} chiavi hanno ${b.beyond3} bit su 256 oltre 3 deviazioni standard (attesi ${IT.num(b.expectedBeyond3, 2)}), e chiavi di indici consecutivi distano in media ${IT.num(d.mean, 1)} bit su 256 (atteso 128), con deviazione standard ${IT.num(d.sd, 2)} contro 8: indici quasi uguali, chiavi senza nulla in comune. Sommare k (mod n) non altera l’uniformità, perché aggiungere una costante modulo n è una biiezione; e le chiavi sono uniformi in [1, n) invece che in [0, 2^256), una differenza di una parte su 2,7 · 10^38, invisibile.`,
          `La mappa di calore confronta ognuno dei ${c.inputBits} bit dell’indice con i 256 bit della chiave: ${c.above} correlazioni su ${c.inputBits * 256} superano 3/√(N - 1) in valore assoluto, contro ${IT.num(c.expectedAbove, 2)} attese senza alcun legame (stimate dalle stesse permutazioni); la statistica globale N·Σφ² = ${IT.num(c.statistic, 1)} ha p = ${IT.pval(c.pValue)} su ${c.sims} permutazioni casuali delle chiavi fra gli indici.`,
          'Eppure le chiavi sorelle non sono indipendenti per tutti. Per chi conosce la xpub del padre, che contiene il chain code, ogni IL_i è calcolabile e le differenze k_i - k_j = IL_i - IL_j (mod n) sono note: una sola chiave figlia rivela tutte le altre (sezione 1.3). Nessun test sui bit può vederlo, perché la dipendenza passa per un segreto: è una proprietà crittografica, non statistica.',
        ];
      },
    },
    secp: {
      intro: `Le chiavi pubbliche K_i = k_i G delle stesse ${SAMPLES.keys} chiavi, e ${SAMPLES.keyPairs} coppie di chiavi private casuali che differiscono di un bit. Le coordinate sono numeri modulo p, e p è più piccolo di 2^256 di circa 2^32: la loro scrittura su 256 bit è uniforme a meno di una parte su 10^67. La parità di y, cioè il prefisso 02 o 03 della forma compressa, dovrebbe essere un bit equo, perché (x, y) e (x, p - y) sono entrambi sulla curva e hanno parità opposta.`,
      xChart: (N) => `Quota di 1 nei 256 bit di x, su ${N} chiavi pubbliche`,
      yChart: (N) => `Quota di 1 nei 256 bit di y, su ${N} chiavi pubbliche`,
      distanceChart: (d, c) => `Distanze fra x ‖ y di ${d.N} coppie di chiavi private che differiscono di un bit; tratteggio: Binomiale(512, 1/2)${distanceRangeIt(c)}`,
      homomorphism: (h) => `Struttura, non un test: (k1 + k2)G = k1G + k2G in ${h.holds} prove su ${h.trials}.`,
      explain: (s) => {
        const p = s.secp256k1.parity;
        const x = s.secp256k1.bitsX;
        const y = s.secp256k1.bitsY;
        const a = s.secp256k1.avalanche;
        const h = s.secp256k1.homomorphism;
        return [
          `La y è dispari ${p.successes} volte su ${p.trials} (${IT.pct(p.rate, 1)}), e i bit di x e di y sono bilanciati: oltre 3 deviazioni standard ${x.beyond3} e ${y.beyond3} su 256, attesi ${IT.num(x.expectedBeyond3, 2)}. Cambiando un solo bit della chiave privata, x ‖ y cambia in media in ${IT.num(a.mean, 1)} bit su 512, con deviazione standard ${IT.num(a.sd, 2)} (attesa ${IT.num(a.expectedSd, 2)}): la moltiplicazione scalare mescola come una funzione casuale.`,
          `Ma è un omomorfismo: (k1 + k2)G = k1G + k2G in ${h.holds} prove su ${h.trials}. Una funzione di hash con questa proprietà sarebbe rotta, perché da H(a) e H(b) si calcolerebbe H(a + b); per secp256k1 è lo scopo, perché ci poggiano le firme, lo scambio di chiavi e la derivazione pubblica di BIP-32. I test sui singoli valori non la vedono: serve il test giusto, che qui è una verifica algebrica. Per questo, dopo la curva, la pipeline mette un hash.`,
        ];
      },
    },
    keccak: {
      intro: `Gli indirizzi sono gli ultimi 20 byte di Keccak-256(x ‖ y). Se Keccak-256 si comporta come una funzione casuale, bit e byte degli indirizzi sono uniformi, e cambiare un bit qualsiasi dell’ingresso cambia ogni bit dell’uscita con probabilità 1/2 (il criterio di valanga stretto, SAC): la distanza fra le due uscite segue una Binomiale(256, 1/2). Per la valanga si usano ${SAMPLES.keccakInputs} ingressi casuali di 64 byte, come x ‖ y, ognuno con ciascuno dei 512 bit invertito a turno: ${SAMPLES.keccakInputs * 512} coppie.`,
      bitsChart: (N) => `Quota di 1 nei 160 bit degli indirizzi, su ${N} indirizzi`,
      hexChart: (N) => `Prima cifra esadecimale di ${N} indirizzi; tratteggio: ${N}/16`,
      distanceChart: (d, c) => `Distanze fra Keccak-256(x) e Keccak-256(x con un bit invertito), ${d.N} coppie; tratteggio: Binomiale(256, 1/2)${distanceRangeIt(c)}`,
      heatmap: 'Matrice del SAC a blocchi: righe, 32 blocchi di 16 bit d’ingresso; colonne, 32 blocchi di 8 bit d’uscita. Ogni cella è il punteggio z della frequenza di cambiamento rispetto a 1/2 (2048 misure): blu sotto, rosso sopra, scala ±4.',
      explain: (s) => {
        const k = s.keccak;
        const a = k.avalanche;
        const rates = a.perOutput.rates;
        return [
          `Gli indirizzi delle ${k.addressBits.N} chiavi hanno bit bilanciati (${k.addressBits.beyond3} su 160 oltre 3 deviazioni standard), e la prima cifra esadecimale e i byte sono uniformi: nulla della struttura del punto sopravvive all’hash.`,
          `Le ${a.pairs} distanze hanno media ${IT.num(a.mean, 2)} (attesa 128) e deviazione standard ${IT.num(a.sd, 2)} (attesa 8). Ogni bit d’uscita cambia con una frequenza fra ${IT.num(Math.min(...rates), 3)} e ${IT.num(Math.max(...rates), 3)} (attesa 0,5; ${a.perOutput.beyond3} bit su 256 oltre 3 deviazioni standard), ogni bit d’ingresso cambia in media metà dell’uscita, e la mappa a blocchi non mostra righe né colonne: nessuna parte dell’ingresso conta meno delle altre. Keccak-f raggiunge la valanga completa dopo pochi dei suoi 24 round; gli altri sono margine contro attacchi più sottili, che infatti funzionano solo su versioni ridotte.`,
          `Keccak-256 e SHA3-256 dello stesso ingresso distano in media ${IT.num(k.versusSha3.mean, 1)} bit su 256: il solo byte di padding diverso, 0x01 contro 0x06, basta a renderle due funzioni indipendenti, come vuole la separazione di dominio (sezione 4.2).`,
        ];
      },
    },
    eip55: {
      intro: `In un indirizzo uniforme ogni cifra esadecimale è una lettera (a-f) con probabilità 6/16 = 3/8: il numero di lettere segue una Binomiale(40, 3/8), con media 15. Ogni lettera porta un bit di controllo, la sua maiuscola, deciso da Keccak-256 dell’indirizzo: in media 15 bit, ma con molta variabilità da un indirizzo all’altro. Campioni: gli indirizzi delle ${SAMPLES.keys} chiavi e ${SAMPLES.addressTypos} errori di battitura.`,
      lettersChart: (N) => `Numero di lettere in ${N} indirizzi; tratteggio: Binomiale(40, 3/8)`,
      explain: (s) => {
        const e = s.eip55;
        const N = e.letters.test.N;
        const few = addressesWithAtMost(s, 10);
        const t = e.typos;
        return [
          `I ${N} indirizzi hanno in media ${IT.num(e.letters.mean, 2)} lettere, e il ${IT.pct(e.uppercase.rate, 1)} delle lettere è maiuscolo. ${few} indirizzi su ${N} (${IT.pct(few / N, 1)}) hanno 10 lettere o meno, quindi al più 10 bit di controllo.`,
          'Un errore di battitura su un carattere dà un altro indirizzo, con un hash indipendente: ogni sua lettera ha la maiuscola giusta con probabilità 1/2, e l’errore passa con probabilità 2^-L, dove L è il numero di lettere. In media su L ~ Binomiale(40, 3/8), E[2^-L] = (5/8 + 3/8 · 1/2)^40 = (13/16)^40 ≈ 0,0247%, il valore citato da EIP-55. Non è 2^-15 ≈ 0,003%, perché per la disuguaglianza di Jensen gli indirizzi con poche lettere pesano molto: un indirizzo senza lettere, con probabilità (5/8)^40 ≈ 7 · 10^-9, non ha alcun checksum.',
          `Nella simulazione, ${t.trials} errori di battitura (un carattere sostituito da un’altra cifra esadecimale, con le lettere in maiuscolo o minuscolo a caso): ${t.passed} accettati, ${IT.num(t.expected, 1)} attesi per un hash ideale, dato il numero di lettere di ciascun indirizzo sbagliato. Il tasso osservato, ${IT.pct(t.passed / t.trials, 4)}, si confronta con lo ${IT.pct(t.exactRate, 4)} della formula; rispetto al checksum di 12 parole di BIP-39, che lascia passare un errore su 16, EIP-55 è circa 250 volte più severo, senza aggiungere caratteri.`,
        ];
      },
    },
    summary: {
      intro: (sum, smallestLabel) =>
        `${sum.count} test, ciascuno al livello α = ${IT.num(SIGNIFICANCE, 2)}. Anche se ogni funzione fosse ideale, ci si aspetterebbero in media ${IT.num(sum.count * SIGNIFICANCE, 1)} rifiuti per puro caso; qui ${sum.rejected === 0 ? 'nessuno' : sum.rejected}. Il p-value più piccolo è ${IT.pval(sum.smallest.result.pValue)} (${smallestLabel}); la correzione di Bonferroni, che tiene sotto il 5% la probabilità anche di un solo falso rifiuto, abbasserebbe la soglia a ${IT.num(SIGNIFICANCE, 2)}/${sum.count} ≈ ${IT.num(sum.bonferroni, 4)}.`,
      cols: { step: 'Passaggio', hypothesis: 'Ipotesi nulla H₀', p: 'p-value', verdict: 'Esito' },
      after: [
        'I passaggi pseudocasuali, SHA-256 nel checksum, PBKDF2, HMAC-SHA512 e Keccak-256, si comportano come funzioni casuali, nei limiti di ciò che campioni di queste dimensioni possono vedere. La struttura c’è dove è voluta, nelle parole, che codificano i bit, e nella curva, che è un omomorfismo; e si vede solo con il test giusto.',
        'Ciò che i test non possono dire è che la pipeline sia sicura. Un contatore cifrato con AES e una chiave nota supera tutti questi test ed è invertibile da chiunque; la sicurezza dei passaggi poggia su decenni di crittoanalisi, non sulla statistica. I test servono a trovare errori grossolani, e la storia ne offre di istruttivi: nel 2023 il comando bx seed di Libbitcoin Explorer generava l’entropia di BIP-39 con un Mersenne Twister inizializzato da 32 bit dell’orologio. Ogni frase era formalmente perfetta e, presa da sola, statisticamente impeccabile; ma le frasi possibili erano solo 2^32, e i fondi sono stati rubati (l’incidente "Milk Sad"). Il difetto non stava nelle uscite ma nello spazio da cui provenivano: un test sulle uscite lo vedrebbe solo con circa 2^16 frasi, cercando ripetizioni.',
      ],
    },
  },
  history: {
    intro: 'La consegna chiede l’ordine storico approssimativo di sette tappe, evidenziate qui sotto; le altre date servono a collocarle: da dove vengono le idee, e perché Ethereum usa proprio queste versioni.',
    legend: { task: 'tappa della consegna', context: 'contesto' },
    events: [
      { year: '1976', task: false, title: 'Diffie e Hellman', text: 'Con "New Directions in Cryptography" nasce l’idea della crittografia a chiave pubblica: due parti concordano un segreto su un canale pubblico, e la firma digitale diventa concepibile.' },
      { year: '1977', task: true, title: 'RSA', text: 'Rivest, Shamir e Adleman: il primo sistema pratico di cifratura e firma a chiave pubblica, fondato sulla difficoltà di fattorizzare. Ethereum non lo usa, ma ne eredita lo schema: chiave privata, chiave pubblica, firme che chiunque può verificare.' },
      { year: '1985', task: false, title: 'Curve ellittiche', text: 'Koblitz e Miller propongono, indipendentemente, il gruppo dei punti di una curva ellittica: la stessa sicurezza di RSA con chiavi molto più corte, 256 bit contro circa 3072.' },
      { year: '1996-1997', task: false, title: 'RIPEMD-160 e HMAC', text: 'RIPEMD-160 (1996) dà le impronte di 4 byte delle chiavi estese di BIP-32. HMAC (Bellare, Canetti e Krawczyk; RFC 2104, 1997) trasforma una funzione di hash in un MAC e in una funzione pseudocasuale con chiave: è il cuore di PBKDF2 e di BIP-32.' },
      { year: '1999-2000', task: false, title: 'PBKDF2, ECDSA e secp256k1', text: 'PKCS #5 v2.0 (RFC 2898, 2000) definisce PBKDF2, che BIP-39 usa per il seed; ECDSA entra negli standard (ANSI X9.62 nel 1999, FIPS 186-2 nel 2000); SEC 2 (2000) pubblica i parametri di secp256k1, una curva di Koblitz con a = 0 e b = 7.' },
      { year: '2001', task: true, title: 'SHA-2 / SHA-512', text: 'NIST pubblica la famiglia SHA-2, progettata dalla NSA (bozza nel 2001, FIPS 180-2 nel 2002): SHA-256 e SHA-512 hanno la struttura Merkle-Damgård di MD5 e SHA-1.' },
      { year: '2004-2005', task: false, title: 'Attacchi a MD5 e SHA-1', text: 'Wang e colleghi trovano collisioni in MD5 e un attacco teorico a SHA-1. SHA-2 resiste, ma ha la stessa struttura: NIST decide di cercare un’alternativa diversa.' },
      { year: '2007-2012', task: false, title: 'Il concorso SHA-3', text: 'Un concorso pubblico con 64 proposte, sul modello di quello che aveva scelto AES. Nel 2012 vince Keccak (Bertoni, Daemen, Peeters e Van Assche), una funzione a spugna.' },
      { year: '2008-2009', task: false, title: 'Bitcoin', text: 'Il documento di Satoshi Nakamoto (2008) e la rete (2009): secp256k1, firme ECDSA, indirizzi da SHA-256 e RIPEMD-160. I primi wallet conservano chiavi casuali indipendenti, e ogni nuova chiave richiede un nuovo backup.' },
      { year: '2012', task: true, title: 'BIP-32', text: 'Pieter Wuille introduce i wallet deterministici gerarchici: un seed, un albero di chiavi, chiavi pubbliche estese per i wallet in sola lettura. Un solo backup, per sempre.' },
      { year: '2013', task: true, title: 'BIP-39', text: 'Palatinus, Rusnak, Voisine e Bowe (tra loro i fondatori di Trezor): il seed diventa una frase di 12-24 parole con checksum, da trascrivere a mano. Alla fine dello stesso anno Vitalik Buterin scrive il white paper di Ethereum.' },
      { year: '2014', task: true, title: 'BIP-44', text: 'Palatinus e Rusnak fissano la struttura dei percorsi (scopo, moneta, account, catena, indice), con i tipi di moneta del registro SLIP-44: 60 per Ethereum. Lo stesso anno lo yellow paper di Gavin Wood specifica Ethereum, con Keccak-256 come funzione di hash.' },
      { year: '2015', task: true, title: 'SHA-3', text: 'FIPS 202: Keccak diventa SHA-3, con un padding che separa i domini delle diverse funzioni. Ethereum, in rete dal 30 luglio, una settimana prima della pubblicazione, era già legato alla versione del concorso: usa Keccak-256, non SHA3-256.' },
      { year: '2016', task: true, title: 'EIP-55', text: 'Buterin e Van de Sande: il checksum nelle maiuscole degli indirizzi, compatibile con tutto il software esistente. Lo stesso anno EIP-2 accetta solo firme con s ≤ n/2 ed EIP-155 aggiunge l’identificativo della rete alle firme.' },
    ],
    after: 'Letta in ordine, la pipeline è stratificata nel tempo. I fondamenti matematici (1976-1985) precedono di trent’anni le criptovalute; le primitive (HMAC, PBKDF2, ECDSA, SHA-2, secp256k1) sono standard dei primi anni 2000, scelti da Bitcoin nel 2009 ed ereditati da Ethereum; i BIP del 2012-2014 risolvono un problema nato con Bitcoin, la gestione di molte chiavi. Ethereum aggiunge Keccak-256 (2014-2015) ed EIP-55 (2016). Per questo il seed di un wallet Ethereum passa per la chiave "Bitcoin seed" e per un registro di monete: la gestione delle chiavi è ereditata, l’indirizzo è di Ethereum.',
    sha: {
      intro: 'SHA-2 e SHA-3 appartengono entrambe alle funzioni di hash crittografiche, e sono imparentate dalla storia più che dalla struttura. La tabella le mette a confronto, con la variante di Keccak usata da Ethereum.',
      cols: ['', 'SHA-256 / SHA-512 (SHA-2)', 'Keccak-256 (Ethereum)', 'SHA3-256 (FIPS 202)'],
      rows: [
        ['Origine', 'NSA; NIST, FIPS 180-2, 2001-2002', 'Bertoni, Daemen, Peeters e Van Assche; vincitore del concorso SHA-3, 2012', 'NIST, FIPS 202, 2015'],
        ['Costruzione', 'Merkle-Damgård: una funzione di compressione (Davies-Meyer) applicata a ogni blocco', 'Spugna sulla permutazione Keccak-f[1600]', 'La stessa spugna'],
        ['Stato interno', '256 / 512 bit, quanto l’uscita', '1600 bit: rate 1088 più capacità 512', 'Uguale'],
        ['Blocco e round', '512 bit e 64 round / 1024 bit e 80 round', '1088 bit (136 byte), 24 round', 'Uguale'],
        ['Padding', 'Un bit 1, zeri, poi la lunghezza del messaggio (64 / 128 bit)', 'pad10*1: primo byte 0x01, ultimo 0x80', 'Suffisso 01, poi pad10*1: primo byte 0x06'],
        ['Length extension', 'Sì: da H(m) e dalla lunghezza di m si calcola H(m ‖ padding ‖ m′)', 'No: la capacità non esce mai', 'No'],
        ['In questa pipeline', 'SHA-512 in HMAC (BIP-32) e PBKDF2 (BIP-39); SHA-256 nel checksum di BIP-39, in Base58Check e nelle impronte', 'Indirizzi, EIP-55, transazioni', 'Nessuno: qui solo per confronto'],
      ],
      digestsTitle: 'La stessa spugna, due padding: gli hash della stringa vuota',
      digestLabel: (name) => `${name}("")`,
      paras: [
        'SHA-2 (2001) estende la struttura di MD5 e SHA-1: una funzione di compressione iterata alla Merkle-Damgård, il cui stato finale è l’hash. Dopo gli attacchi del 2004-2005 a MD5 e SHA-1, NIST non ha cercato un sostituto di SHA-2, che resiste ancora, ma un’alternativa con una struttura diversa, così che un progresso contro l’una non colpisse anche l’altra. Il concorso (2007-2012) lo ha vinto Keccak, una funzione a spugna: uno stato di 1600 bit, di cui a ogni passo si assorbono 1088 bit di messaggio (la rate), mentre gli altri 512 (la capacità) non vengono mai letti né scritti dall’esterno e determinano la sicurezza, c/2 = 256 bit contro gli attacchi generici.',
        'Keccak-256 e SHA3-256 differiscono solo nel padding. Nella bozza di FIPS 202 (2014) NIST ha aggiunto prima del padding pad10*1 due bit di separazione di dominio, 01 per SHA-3 e 1111 per le funzioni SHAKE, così che funzioni diverse costruite sulla stessa permutazione non diano mai la stessa uscita. Ethereum, progettato in quegli stessi mesi, aveva già adottato la versione del concorso. Con lo stesso messaggio il blocco finale cambia, 0x01 diventa 0x06, e la permutazione fa il resto: le uscite non hanno nulla in comune. Per questo nel software di Ethereum la funzione si chiama keccak256 (Solidity ha eliminato l’alias sha3 nella versione 0.5.0), e una libreria "SHA-3" qualsiasi darebbe indirizzi sbagliati.',
        'La struttura cambia anche le garanzie. In SHA-256 l’uscita è l’intero stato interno: chi conosce H(m) e la lunghezza di m può continuare il calcolo e ottenere H(m ‖ padding ‖ m′) senza conoscere m. Per questo un MAC con SHA-2 si costruisce con HMAC, due hash annidati, come in BIP-32 e in PBKDF2. In Keccak la capacità non viene mai emessa: niente length extension, e un MAC può essere semplicemente l’hash di chiave e messaggio (KMAC).',
      ],
    },
  },
  discussion: {
    why: {
      intro: 'La consegna elenca quattro gruppi con quattro scopi. Ognuno richiede proprietà che gli altri non hanno, o che anzi non devono avere.',
      cols: { parts: 'Componenti', purpose: 'Scopo', instead: 'Perché non un’altra tecnica' },
      rows: [
        {
          parts: 'BIP-39 / BIP-32 / BIP-44',
          purpose: 'Gestione e derivazione delle chiavi: un solo segreto, trascrivibile a mano, da cui derivare in modo riproducibile infinite chiavi, organizzate per moneta e account.',
          instead: 'Una chiave casuale per ogni indirizzo vorrebbe un backup per ogni chiave. Un hash del seed basterebbe a derivare chiavi private, ma non chiavi pubbliche senza segreti (la xpub sfrutta la struttura della curva), né parole con checksum e una derivazione volutamente lenta.',
        },
        {
          parts: 'secp256k1',
          purpose: 'La relazione fra chiave privata e pubblica e le firme digitali: chiunque verifica, solo il proprietario firma.',
          instead: 'Un hash è a senso unico, ma da solo non permette di verificare una firma senza rivelare il segreto (le firme basate su hash esistono, ma sono grandi migliaia di byte o usa-e-getta). Serve una struttura algebrica: l’omomorfismo.',
        },
        {
          parts: 'Keccak-256',
          purpose: 'Hashing: un identificatore corto, uniforme e senza struttura per la chiave pubblica, e le impronte di transazioni, blocchi e dati.',
          instead: 'La chiave pubblica è lunga (64 byte) e strutturata; l’hash la comprime e ne cancella la struttura. Una funzione con struttura algebrica, come la curva, non può fare da hash.',
        },
        {
          parts: 'EIP-55',
          purpose: 'Checksum: intercettare gli errori di chi scrive o copia un indirizzo.',
          instead: 'Non deve resistere ad attacchi ma costare nulla: nessun carattere in più, compatibile con il software esistente. Una firma o un MAC non servirebbero, perché l’errore lo fa una persona, e un attaccante calcola comunque il checksum giusto del proprio indirizzo.',
        },
      ],
      after: [
        'Le proprietà richieste sono in conflitto, e nessun algoritmo le ha tutte: una firma ha bisogno di struttura algebrica, un hash della sua assenza; una chiave deve essere lunga e imprevedibile, un checksum corto e calcolabile da chiunque; la generazione deve essere casuale, la derivazione deterministica. L’Homework #1 lo ha mostrato in piccolo: la moltiplicazione scalare è a senso unico, ma ha troppa struttura per fare da hash.',
        'Separare i ruoli ha anche vantaggi d’ingegneria: ogni strato si analizza, si standardizza e si sostituisce da solo. EIP-55 è arrivato nel 2016 senza cambiare il protocollo; un wallet può cambiare lista di parole o percorso senza toccare la curva; e se un computer quantistico risolvesse il logaritmo discreto (algoritmo di Shor) andrebbero sostituite le firme, mentre agli hash l’algoritmo di Grover toglierebbe al più metà dei bit di sicurezza. Anche dove la funzione è la stessa, come HMAC-SHA512 in BIP-39 e in BIP-32, chiavi e dati cambiano da un uso all’altro: è la separazione di dominio, che impedisce a un uso di interferire con l’altro.',
      ],
    },
    fit: [
      'Seguendo i bit: 128 bit di entropia diventano 12 parole (132 bit con il checksum), poi un seed di 512 bit, una chiave privata di 256 bit, una chiave pubblica di 512 bit (x ‖ y), un hash di 256 bit, un indirizzo di 160 bit e infine 40 caratteri con circa 15 bit di checksum nelle maiuscole. Le lunghezze salgono e scendono, la sicurezza no: nessun passaggio deterministico aggiunge entropia, e ognuno può solo conservarla o perderne.',
      'I livelli sono scelti per incastrarsi. 128 bit di entropia corrispondono al livello di sicurezza di secp256k1 (il rho di Pollard richiede circa 2^128 operazioni) e alla resistenza alle collisioni di Keccak-256; l’indirizzo di 160 bit offre 2^160 contro chi cerca una chiave per un indirizzo dato. Una frase di 24 parole porta 256 bit di entropia ma non alza la sicurezza dei fondi oltre i circa 128 bit della curva: dà margine contro un generatore difettoso.',
      'Ogni passaggio ha un ruolo, e il successivo lo presuppone. BIP-39 rende il segreto trascrivibile e controllabile; PBKDF2 lo rallenta e lo separa dalle parole; BIP-32 lo moltiplica in un albero, con la xpub per chi deve solo osservare; BIP-44 rende l’albero uguale per tutti i wallet; secp256k1 lega a ogni chiave privata una chiave pubblica che verifica le firme; Keccak-256 comprime la chiave pubblica in un identificatore uniforme; EIP-55 protegge dagli errori chi lo copia. Statisticamente la catena alterna funzioni pseudocasuali, le cui uscite superano i test della sezione 3, e trasformazioni strutturate (le parole, la curva, le maiuscole), la cui struttura è voluta.',
      'La catena funziona anche all’indietro, quando si spende: il wallet firma con k (ECDSA, di solito con un nonce deterministico secondo RFC 6979), la rete ricava K dalla firma e dal bit di recupero, ne calcola Keccak-256 e prende gli ultimi 20 byte come mittente. Ogni primitiva della pipeline ricompare, nel verso opposto.',
    ],
    conclusion: (sum) => [
      'La pipeline di un wallet Ethereum è una catena di standard nati in tempi e per problemi diversi: la gestione delle chiavi viene da Bitcoin (BIP-32, BIP-39, BIP-44, e la chiave di HMAC "Bitcoin seed" lo ricorda), la curva e le firme dagli standard dei primi anni 2000, l’hash da un concorso pubblico vinto nel 2012 ma adottato prima della standardizzazione, il checksum da una proposta di Ethereum del 2016. Ogni anello è stato verificato qui con i vettori ufficiali, e si può verificare con un wallet reale.',
      'Le cinque categorie della consegna corrispondono a cinque garanzie diverse: imprevedibilità (generazione), riproducibilità (derivazione), verificabilità senza segreto (chiave pubblica), compressione senza struttura (hash), rilevazione degli errori umani (checksum); la codifica non garantisce nulla, rende i bit leggibili. Nessun algoritmo singolo le offre tutte, perché alcune si escludono: la firma vuole struttura, l’hash ne vuole l’assenza.',
      `Statisticamente, i passaggi pseudocasuali sono indistinguibili da funzioni casuali ${sum === null ? 'nei test della sezione 3' : sum.rejected === 0 ? `in tutti i ${sum.count} test` : `in ${sum.count - sum.rejected} test su ${sum.count} (un rifiuto ogni venti test è atteso per caso)`}, e l’unica struttura misurata, l’omomorfismo della curva, è quella voluta. Ma la sezione 3 ha mostrato anche il limite del metodo: le dipendenze che contano (la xpub con una chiave figlia, un generatore con pochi semi) passano per segreti o per lo spazio degli ingressi, dove i test sulle uscite non guardano. La sicurezza di un wallet si decide nel primo passaggio, la generazione dell’entropia, e nella custodia della frase; il resto è matematica deterministica, verificabile, e qui verificata.`,
    ],
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline. Con node homework2.js stampa nel terminale la pipeline, i vettori di test e le statistiche; --mnemonic, --passphrase, --index e --path cambiano l’input.',
    contents: 'Contenuto: index.html, style.css, homework2.js (pipeline, verifiche e statistiche), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework2.zip',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Dalla frase mnemonica all’indirizzo Ethereum: hashing, derivazione delle chiavi e primitive crittografiche.',
    course: 'Statistics, laurea magistrale in Cybersecurity, Sapienza Università di Roma',
    online: 'Versione online',
    noscript: 'Questo programma ha bisogno di JavaScript.',
  },
};

// ---------------------------------------------------------------------------
// ENGLISH
// ---------------------------------------------------------------------------

const EN = formatters('.', 'n/a');

/** The line of numbers under a hypothesis test, whatever its kind. */
function testLineEn(t) {
  const F = EN;
  switch (t.kind) {
    case 'chi2':
      return t.classes === undefined
        ? `Σz² = ${F.num(t.chi2, 1)}, chi-square with ${t.df} degrees of freedom, p = ${F.pval(t.pValue)}`
        : `χ² = ${F.num(t.chi2, 1)} over ${t.classes} classes (${t.df} degrees of freedom), p = ${F.pval(t.pValue)}`;
    case 'binomial':
      return `${t.successes} of ${t.trials} = ${F.pct(t.rate, 2)} (expected ${F.pct(t.expectedRate, 2)}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'poisson':
      return `${t.observed} observed, ${F.num(t.expected, 2)} expected (exact Poisson test), p = ${F.pval(t.pValue)}`;
    case 'z':
      return `mean ${F.num(t.mean, 2)} (expected ${t.expectedMean}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'permutation':
      return `N·Σφ² = ${F.num(t.statistic, 1)}, p = ${F.pval(t.pValue)} over ${t.sims} permutations`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

const distanceRangeEn = (c) => (c.width > 1 ? `; from ${c.lo} to ${c.hi}, classes of ${c.width} values` : `; from ${c.lo} to ${c.hi}`);

const en = {
  fmt: EN,
  ui: {
    index: 'Contents',
    indexTitle: 'Contents of the homework',
    close: 'Close',
    backToTop: 'Back to top',
    computing: 'Computing...',
    language: 'Language',
    error: (m) => `Error: ${m}`,
  },
  sections: {
    assignment: '0. The assignment',
    pipeline: '1. TASK: the wallet pipeline, from the sentence to the address',
    input: '1.1 Sentence, passphrase and path',
    bip39: '1.2 BIP-39: from the sentence to the seed',
    bip32: '1.3 BIP-32: hierarchical deterministic keys',
    bip44: '1.4 BIP-44: standard derivation paths',
    secp256k1: '1.5 secp256k1: from the private key to the public key',
    keccak: '1.6 Keccak-256: from the public key to the address',
    eip55: '1.7 EIP-55: the checksum in the letter case',
    verify: '1.8 Checking against the official test vectors',
    wallets: '1.9 Trying it with a real wallet',
    categories: '2. Generation, derivation, public key, hashing, checksum and encoding',
    stats: '3. Statistical properties',
    statsBip39: '3.1 BIP-39: words and checksum',
    statsSeed: '3.2 The seed: PBKDF2-HMAC-SHA512',
    statsBip32: '3.3 BIP-32: the child keys',
    statsSecp: '3.4 secp256k1: the public keys',
    statsKeccak: '3.5 Keccak-256: addresses and avalanche effect',
    statsEip55: '3.6 EIP-55: letters, upper case and typos',
    statsSummary: '3.7 Summary of the tests',
    history: '4. Historical context',
    timeline: '4.1 Timeline',
    sha: '4.2 SHA-2 / SHA-512 and Keccak / SHA-3',
    discussion: '5. Discussion',
    why: '5.1 Why several techniques instead of one algorithm',
    fit: '5.2 How the steps fit together',
    conclusion: '5.3 Conclusions',
  },
  assignment: {
    intro: [
      'The assignment asks to check the cryptographic pipeline through which an Ethereum wallet goes from a mnemonic sentence to an address, and to describe the role and purpose of every standard and primitive along the way: BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256 and EIP-55. It then asks to distinguish key generation and key derivation, public-key cryptography, hashing, checksums and encoding, to discuss how the steps fit together and which statistical properties they have, and to place these technologies in their historical context.',
      'The page follows that order. Section 1 walks through the pipeline one step at a time, with values computed live in the browser by an implementation written from scratch and checked against the official test vectors; sentence, passphrase and path can be changed, and the result can be compared with a real wallet. Section 2 distinguishes the five categories, section 3 measures the statistical properties of every step with hypothesis tests, section 4 rebuilds the timeline and the relation between SHA-2 and Keccak/SHA-3, and section 5 discusses why so many different techniques are needed and how they fit together.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned.',
  },
  pipeline: {
    intro: [
      'An Ethereum wallet does not store keys: it stores an initial secret and recomputes the keys whenever they are needed. The secret is a sentence of 12 to 24 words (BIP-39), which becomes a 512-bit seed; the seed grows a tree of keys (BIP-32), where a standard path (BIP-44) picks the branch of each account. The chosen private key gives the public key on the secp256k1 curve, the public key gives the address through Keccak-256, and the address is written with the EIP-55 checksum.',
      'Every function of the pipeline is written from scratch in JavaScript, with no libraries, from the documents of the standards: SHA-256, SHA-512, HMAC, PBKDF2, RIPEMD-160, the Keccak-f[1600] permutation, secp256k1 arithmetic, Base58Check. The diagram shows the values of the sentence chosen in 1.1; each step leads to its section.',
    ],
    flowTitle: 'The pipeline, with the values of the chosen sentence',
    nodes: {
      mnemonic: 'Mnemonic sentence',
      seed: 'Seed, 512 bits',
      privateKey: 'Private key, 256 bits',
      publicKey: 'Public key x ‖ y, 512 bits',
      address: 'Ethereum address, 160 bits',
      checksummed: 'Checksummed address',
    },
    arrows: {
      bip39: 'BIP-39: PBKDF2-HMAC-SHA512',
      bip32: 'BIP-32 / BIP-44: HMAC-SHA512 along the path',
      secp256k1: 'secp256k1: K = kG',
      keccak: 'Keccak-256, last 20 bytes',
      eip55: 'EIP-55: upper case from the hash',
    },
    stale: 'Values of the last valid input: the fields in 1.1 contain an error.',
  },
  input: {
    intro: 'The default sentence is the public test sentence of Hardhat and Foundry: its accounts are known to everybody, which is exactly why it is useful for comparisons. A random sentence can be generated, a passphrase added and the path of a wallet chosen.',
    mnemonicLabel: 'Mnemonic sentence (BIP-39, English list)',
    useTest: 'Test sentence',
    random: (n) => `Generate ${n} words`,
    randomNote: 'Generated sentences use the browser’s cryptographic generator (crypto.getRandomValues): they are truly random, but they remain test sentences, shown on a web page.',
    passphraseLabel: 'Passphrase (optional)',
    passphraseHint: 'The "25th word" of BIP-39: it goes into the PBKDF2 salt and changes the whole seed. The most common wallets leave it empty.',
    presetLabel: 'Derivation path',
    presets: {
      bip44: "MetaMask, Rabby, Rainbow, Trezor, Exodus: m/44'/60'/0'/0/i",
      ledgerLive: "Ledger Live: m/44'/60'/i'/0/0",
      ledgerLegacy: "Ledger (old app), MyEtherWallet: m/44'/60'/0'/i",
      custom: 'Custom path',
    },
    indexLabel: 'Index i',
    indexHint: (max) => `From 0 to ${max}; in wallets it is account i + 1 (Account 1 is i = 0).`,
    indexError: {
      empty: 'Type an index.',
      notInteger: (t) => `"${t}" is not an integer written in digits.`,
      range: (max) => `The index goes from 0 to ${max}.`,
    },
    pathLabel: 'Path',
    pathHint: `In the form m/44'/60'/0'/0/0: an apostrophe (or h) marks a hardened index; at most ${MAX_PATH_DEPTH} levels, each index below 2^31.`,
    pathError: {
      empty: 'Type a path.',
      format: "Not a path: it starts with m and goes on with /number, optionally followed by ' or h.",
      depth: `Too many levels: at most ${MAX_PATH_DEPTH}.`,
      range: 'An index is too large: each must stay below 2^31 = 2147483648, because the top bit marks hardened indices.',
    },
    status: {
      valid: (a) => `Valid sentence: ${a.count} words, ${a.entropy.length * 8} bits of entropy and ${a.checksum.length} of checksum.`,
      empty: 'Type a sentence of 12, 15, 18, 21 or 24 words.',
      unknown: (list) =>
        `Not in the English BIP-39 list: ${list
          .map((u) => `"${u.word}" (word ${u.position}${u.suggestions.length ? `; maybe ${u.suggestions.join(', ')}` : ''})`)
          .join('; ')}.`,
      length: (n) => `${n} ${n === 1 ? 'word' : 'words'}: BIP-39 wants 12, 15, 18, 21 or 24.`,
      checksum: (a) =>
        `All the words are in the list, but the checksum does not match: the last ${a.checksum.length} bits are ${a.checksum}, the first ${a.checksum.length} bits of SHA-256(entropy) are ${a.expectedChecksum}. A wallet would refuse this sentence (details in 1.2).`,
    },
    stale: 'While the fields contain an error, the computed values stay those of the last valid input.',
    testBadge: (address) => `Test values: the public sentence of Hardhat and Foundry, no passphrase, the MetaMask path, index 0. Expected address: ${address}.`,
    customBadge: 'Values different from the test ones.',
    restore: 'Restore the test values',
  },
  bip39: {
    intro: [
      'BIP-39 turns a random secret into words a person can write down, and the words into a binary seed. It starts from ENT bits of entropy (128, 160, 192, 224 or 256) produced by a cryptographic generator; it appends CS = ENT/32 checksum bits, the first bits of SHA-256(entropy); the ENT + CS bits are split into groups of 11, and each group is the index of a word in a list of 2048 = 2^11. With 128 bits: 4 checksum bits, 132 bits in all, 12 words; with 256 bits: 8 checksum bits and 24 words.',
      'The English list is built so that the first four letters identify every word and so that it contains no similar words, such as build and built or woman and women: a wallet can complete the words and catch many errors before the checksum is even checked.',
    ],
    wordsTitle: 'The words and their 11 bits',
    cols: { position: '#', word: 'Word', index: 'Index', bits: '11 bits' },
    notInList: 'not in the list',
    moreWords: (n) => `... and ${n} more ${n === 1 ? 'word' : 'words'}, not shown.`,
    bitsTitle: (ent, cs) => `The ${ent + cs} bits of the sentence: ${ent} of entropy and, highlighted, ${cs} of checksum`,
    entropyLabel: (bits) => `Entropy, ${bits} bits`,
    hashLabel: 'SHA-256(entropy)',
    checksumOk: (a) => `Checksum: the last ${a.checksum.length} bits of the sentence, ${a.checksum}, equal the first ${a.checksum.length} bits of SHA-256(entropy). ✓`,
    checksumBad: (a) => `Checksum: the last ${a.checksum.length} bits of the sentence are ${a.checksum}, but the first ${a.checksum.length} bits of SHA-256(entropy) are ${a.expectedChecksum}. ✗`,
    noBits: 'As long as some words are not in the list, or the number of words is not valid, the bits cannot be rebuilt.',
    seedTitle: 'From the sentence to the seed',
    seedFormula: 'seed = PBKDF2-HMAC-SHA512(password = sentence normalized to NFKD, salt = "mnemonic" + passphrase, 2048 iterations, 64 bytes)',
    seedLabel: (hasPassphrase) => (hasPassphrase ? 'Seed, 512 bits, with the chosen passphrase' : 'Seed, 512 bits, without passphrase'),
    after: [
      'The seed is computed from the text of the words, not from the entropy. The checksum does not enter the computation (a sentence with a wrong checksum still has a seed), but BIP-39 asks wallets to refuse it; and the same entropy written with the list of another language gives a different seed. Unicode NFKD normalization makes the same sentence typed on different keyboards identical.',
      'The 2048 iterations slow down by a factor of 2^11 anyone trying candidate sentences or passphrases, but they add no entropy: security stays that of the initial 128 (or 256) bits, and whoever knows 11 words out of 12 finds the last one among 128 candidates. The passphrase adds a second factor: every passphrase gives a valid, different wallet, and without the right one the funds simply do not show up (plausible deniability).',
    ],
  },
  bip32: {
    intro: [
      'BIP-32 builds a tree of keys from a single seed. The root is I = HMAC-SHA512(key = "Bitcoin seed", data = seed): the first 256 bits, IL, are the master private key; the other 256, IR, the chain code, a second secret half that enters every derivation, so that the private key of a node alone is not enough to compute its children.',
      "Child i of a node (k, c) comes from I = HMAC-SHA512(c, data), with k_i = IL + k (mod n) and chain code c_i = IR. For hardened indices, from 2^31 up and written with an apostrophe (44'), the data are 0x00 ‖ k ‖ i and the parent’s private key is needed. For normal ones the data are the parent’s compressed public key ‖ i: so child public keys can also be computed from the parent’s extended public key alone (xpub), with K_i = IL·G + K. This is what lets a watch-only wallet, or a shop’s server, generate ever new addresses without ever touching a private key.",
    ],
    levelsTitle: 'The path, level by level',
    cols: { path: 'Node', kind: 'Derivation', data: 'HMAC-SHA512 data', key: 'Private key k', chain: 'Chain code c' },
    kinds: {
      master: 'master: key "Bitcoin seed", data = seed',
      hardened: 'hardened: 0x00 ‖ parent k ‖ i',
      normal: 'normal: parent K ‖ i',
    },
    extendedTitle: 'The extended keys',
    xprv: (path) => `xprv of node ${path}`,
    xpub: (path) => `xpub of node ${path}`,
    parentXpub: (path) => `xpub of the parent, ${path}`,
    extendedNote: "Base58Check of 78 bytes: version (which makes the text start with xprv or xpub), depth, parent fingerprint (the first 4 bytes of RIPEMD-160(SHA-256) of its public key), index, chain code and key. The xpub of node m/44'/60'/0'/0 is what a watch-only wallet imports to see every address of an account.",
    leakTitle: 'Why the first levels are hardened',
    leak: (d) => [
      `Whoever holds the parent’s xpub (${d.parentPath}) computes alone IL = HMAC-SHA512(c, K ‖ ${d.index}) for the normal child ${d.childPath}: here IL = ${short(d.IL)}. If the private key of that child leaks too, k_i = ${short(d.childKey)}, the parent’s private key is k = k_i - IL (mod n) = ${short(d.recovered)}, ${d.matches ? 'exactly the real one ✓' : 'which however differs from the real one ✗'}. And from the parent follow all the sibling keys.`,
      'With a hardened index the computation is impossible, because IL depends on the parent’s private key. This is why BIP-44 hardens purpose, coin and account: a leak of this kind stays confined to one account, and the xpub of an account says nothing about the others.',
    ],
    leakHardened: 'The last level of the chosen path is hardened: the parent’s xpub and the child key, together, reveal nothing. That is exactly the purpose of hardened derivation.',
    leakMaster: 'The chosen path is m: the master node has no parent, and there is nothing to recover.',
  },
  bip44: {
    intro: "BIP-32 defines the tree, not which branch to use. BIP-44, on top of BIP-43, fixes five levels, m / purpose' / coin_type' / account' / change / address_index, so that different wallets find the same keys from the same sentence and different coins and accounts live in independent branches.",
    levelsTitle: (path) => `The levels of ${path}`,
    roles: {
      purpose: () => 'purpose: the number of the BIP that defines the structure (BIP-43). Hardened.',
      coinType: (v) => `coin type, from the SLIP-44 registry: 0 Bitcoin, 1 the test networks, 60 Ethereum${v === 60 ? '' : ` (here ${v}: not Ethereum)`}. Hardened: different coins in independent branches.`,
      account: () => 'account, numbered from 0. Hardened: the xpub of one account says nothing about the others.',
      change: () => 'chain: 0 external (receiving addresses), 1 internal (change). Ethereum has no change, since it does not use UTXOs, and always uses 0.',
      index: () => 'address index, from 0 up. Normal: the xpub of the previous level generates every address.',
    },
    notStandard: (path) => `${path} does not have the BIP-44 structure: BIP-32 derives it anyway, but a standard wallet would not look for it.`,
    compareTitle: 'The same sentence in different wallets',
    compareIntro: (n) => `Wallets do not all use the same path for account i: MetaMask, Rabby, Rainbow, Trezor and Exodus change the last index, Ledger Live changes the account, the old Ledger app and MyEtherWallet use a four-level path. For i = 0 MetaMask and Ledger Live agree, because the path is the same; from the second account on they diverge. The addresses for i = 0, ..., ${n - 1} of the chosen sentence and passphrase, with the path in use highlighted:`,
    cols: { wallet: 'Wallet', path: 'Path', address: 'Address' },
    presetNames: { bip44: 'MetaMask, Rabby, ...', ledgerLive: 'Ledger Live', ledgerLegacy: 'Old Ledger, MEW' },
    testMark: 'public test account',
    after: [
      'This is why importing the same sentence into another wallet can show an "empty" wallet: the funds are on another branch of the tree. And this is why wallets scan addresses in order and stop after a run of never-used addresses (the BIP-44 gap limit, 20).',
      'Coin type 60 holds for every Ethereum-compatible network (Polygon, Arbitrum, BNB Chain, ...): the same key gives the same address on each of them. It is the signatures, which since 2016 include the network identifier (EIP-155), that stop a transaction valid on one network from being replayed on another.',
    ],
  },
  secp: {
    intro: [
      'secp256k1 is the curve y² = x³ + 7 over the field F_p, with p = 2^256 - 2^32 - 977, defined in 2000 by the SEC 2 standard and chosen by Bitcoin and then by Ethereum. The base point G generates a group of prime order n, just below 2^256, which contains every point of the curve (cofactor 1). The private key is an integer k with 1 ≤ k < n, the public key the point K = kG: the scalar multiplication of Homework #1, on 256-bit numbers.',
      'Computing K from k costs about 256 doublings and 128 point additions; going back from K to k is the elliptic-curve discrete logarithm, for which the best known algorithm, Pollard’s rho, needs about √n ≈ 2^128 operations. This asymmetry is what makes K publishable: it is used to verify the ECDSA signatures made with k.',
    ],
    constantsTitle: 'The parameters of the curve',
    constants: { p: 'p, the prime of the field', n: 'n, the order of G', Gx: 'x of G', Gy: 'y of G' },
    keyTitle: 'From the private key to the point',
    keyLabel: 'Private key k',
    keyCheck: (ok) => (ok ? '1 ≤ k < n ✓' : '1 ≤ k < n ✗'),
    xLabel: 'x of K = kG',
    yLabel: 'y of K = kG',
    onCurve: (ok) => (ok ? 'y² ≡ x³ + 7 (mod p) ✓' : 'y² ≢ x³ + 7 (mod p) ✗'),
    encodingsTitle: 'The encodings of the public key',
    uncompressed: 'Uncompressed, 65 bytes: 04 ‖ x ‖ y (SEC 1)',
    compressed: (even) => `Compressed, 33 bytes: ${even ? '02' : '03'} ‖ x, because y is ${even ? 'even' : 'odd'}`,
    ethereumForm: 'Ethereum, 64 bytes: x ‖ y without prefix, the input of Keccak-256',
    decompress: (ok) => `From the compressed form, y = (x³ + 7)^((p + 1)/4) mod p, choosing the root with the parity of the prefix${ok ? ': the same y comes back ✓' : ': a different y ✗'}`,
    after: [
      'The compressed form is enough because for every x there are at most two points, (x, y) and (x, p - y), one with even y and one with odd y; and since p ≡ 3 (mod 4) the square root is a single exponentiation. BIP-32 uses the compressed form, in the derivation data and in fingerprints; Ethereum uses the pair x ‖ y without prefix.',
      'Ethereum transactions contain neither the public key nor the sender: they contain the ECDSA signature (r, s) and a recovery bit (v, or yParity) that says which of the two points with abscissa r to use. From the signature the network rebuilds K (ecrecover), computes its address and uses it as the sender. And since with (r, s) also (r, n - s) would be valid, since 2016 Ethereum only accepts s ≤ n/2 (EIP-2): the symmetry P ↔ -P already seen in Homework #1.',
    ],
  },
  keccak: {
    intro: 'The address is a fingerprint of the public key: the 64 bytes x ‖ y go into Keccak-256, and of the 32 bytes produced the last 20 are kept. The hash does three things: it shortens the identifier (20 bytes instead of 64), it makes it uniform and free of the algebraic structure of the point, and it binds it to the key so that there is no way back.',
    inputLabel: 'Input: x ‖ y, 64 bytes',
    hashLabel: 'Keccak-256(x ‖ y), 32 bytes: the first 12 are dropped, the last 20 (highlighted) are the address',
    addressLabel: 'Address, in lower case',
    sha3Label: 'For comparison, SHA3-256(x ‖ y): same input, same permutation, different padding (section 4.2)',
    after: [
      'Truncating to 160 bits costs security only against collisions. Finding a key for a given address takes about 2^160 attempts; finding two keys with the same address, whatever it is, about 2^80 (the birthday paradox). The second number only matters to someone who can choose both sides, for instance with contract addresses computable in advance; to steal an existing address, the first one is what counts.',
      'Keccak-256 is everywhere in Ethereum: it identifies transactions and blocks, gives the address of contracts (from sender and nonce, or with CREATE2 from a salt and the code), the function selectors (the first 4 bytes of the hash of their signature) and the EIP-55 checksum of the next section.',
    ],
  },
  eip55: {
    intro: [
      'Hexadecimal digits do not distinguish upper and lower case, and EIP-55 uses exactly this freedom. It computes Keccak-256 of the text of the address in lower case (the 40 ASCII characters, without 0x), and every letter a-f of the address becomes upper case if the corresponding hexadecimal digit of the hash is 8 or more, that is, if its top bit is 1. The digits 0-9 do not change.',
      'For software that ignores case the address stays the same, so the scheme is compatible with all earlier software; software that checks it refuses an address with the wrong case.',
    ],
    gridTitle: 'Character by character',
    gridLegend: 'Under every character, the corresponding digit of Keccak-256 of the lower-case address. Upper-case letters (digit from 8 to f) are highlighted; the digits 0-9, which carry no checksum, are grey.',
    hashLabel: 'Keccak-256 of the text of the lower-case address',
    resultLabel: 'Address with the EIP-55 checksum',
    letters: (n) => `${n} ${n === 1 ? 'letter' : 'letters'}, hence ${n} check bits.`,
    checkerTitle: 'Try the check',
    checkerLabel: 'Address to check',
    checkerHint: 'Change a letter’s case, or a character, and watch the result.',
    check: {
      format: 'Not an address: it needs 0x and 40 hexadecimal digits.',
      valid: (same) =>
        same
          ? 'Correct checksum: this is the address computed above. ✓'
          : 'Correct checksum, but it is a different address from the one computed above: if it is a typo, it is one of the rare ones EIP-55 does not see (section 3.6).',
      noChecksum: (same) => `All lower case or all upper case: there is no checksum to check, and a wallet accepts it as it is${same ? ' (it is the address computed above)' : ''}.`,
      invalid: (same, positions) => {
        const list = positions.map((p) => p + 1).join(', ');
        const where = positions.length === 1 ? `the letter in position ${list} should` : `the letters in positions ${list} should`;
        return same
          ? `Same address, wrong case: ${where} have the other case, and a wallet would refuse it. ✗`
          : `A different address from the computed one, and the case does not match (${where} have the other case): the typo has been caught. ✗`;
      },
    },
    after: [
      'Every letter carries one check bit, and an address has 15 letters on average. A typo goes unnoticed with an average probability of 0.0247% (section 3.6), against 6.25% for the checksum of a 12-word sentence; and without adding a single character.',
      'The checksum protects against errors, not attacks: anyone computes the correct form of any address. It does not defend against malware that replaces the address in the clipboard, nor against address poisoning, where the attacker creates an address with the same first and last digits as one the victim uses, hoping it gets copied from the history.',
    ],
  },
  verify: {
    intro: 'Every step, written from scratch, is compared with the published test vectors: the reference digests of the hash functions (FIPS 180-4, RFC 4231, FIPS 202), the BIP-39 vectors of the reference repository (passphrase "TREZOR"), BIP-32 vector 1, the EIP-55 test cases and the known accounts of the test sentence. The computation runs here, in the browser, when the page opens.',
    summary: (ok, total) => (ok === total ? `${ok} of ${total} checks reproduced exactly. ✓` : `${ok} of ${total} checks reproduced; ${total - ok} differ. ✗`),
    groups: {
      hash: 'Hash functions',
      bip39: 'BIP-39: official vectors, passphrase "TREZOR"',
      bip32: 'BIP-32: vector 1, seed 000102...0f',
      ethereum: 'Test sentence: addresses and private keys',
      eip55: 'EIP-55: test cases of the standard',
    },
    details: (n) => `The ${n} checks, one by one`,
    cols: { check: 'Check', expected: 'Expected value', result: 'Result' },
    label: (row) => {
      switch (row.check) {
        case 'entropyToWords':
          return `${row.subject}: entropy → words`;
        case 'wordsToSeed':
          return `${row.subject}: words + "TREZOR" → seed`;
        case 'seedToMaster':
          return `${row.subject}: seed → master xprv`;
        case 'xprv':
        case 'xpub':
          return `${row.subject}: ${row.check}`;
        case 'address':
          return `${row.subject}: address`;
        case 'privateKey':
          return `${row.subject}: private key`;
        case 'checksum':
          return 'checksummed form';
        default:
          return row.subject;
      }
    },
    ok: 'reproduced',
    failed: 'different',
  },
  wallets: {
    intro: 'The assignment suggests trying a real wallet. The test sentence is public, so it can be imported safely as long as no real funds are sent to it: the wallet must show the same addresses this page computes, and the comparison checks the whole pipeline on real software. The steps below were actually carried out on 13 October 2026, with MetaMask 13.50.0 and Rabby 0.94.11 for Chrome; the labels are those shown by the wallets, which may change them from one version to the next.',
    steps: [
      'Use a separate browser profile, or a browser not used for anything else, with no wallet extensions holding real funds.',
      'MetaMask: "I have an existing wallet", then "Import using Secret Recovery Phrase" (not the Google, Apple or Telegram sign-ins). In "Import a wallet" type or paste the 12 words in the single field and press "Continue"; in "MetaMask password" type the password twice, tick "If I lose this password, MetaMask can’t reset it." and press "Create password"; then "Maybe later" for biometrics, "Continue" and "Open wallet". In this version the import screens stay in English even with the Italian language, because the translation is missing.',
      'At the top appears "Account 1" with 0xf39Fd...92266. For the test sentence MetaMask finds the other accounts by itself, because they have transactions: in the "Accounts" list, Account 2 is 0x70997...c79C8 and Account 3 is 0x3C44C...293BC, that is indices 1 and 2 of this page with the path "MetaMask, Rabby, ...". "Receive" shows the same address on Ethereum, Linea, Base, Arbitrum, BNB Chain, OP and Polygon: coin type 60 of 1.4 holds for all of them.',
      'With a sentence generated here with "Generate" MetaMask shows only Account 1, and "Add account" in the account list creates Account 2 and Account 3, with the addresses of indices 1 and 2 of this page. A sentence with a wrong checksum does not pass: "Continue" stays disabled and "Secret Recovery Phrase not found." appears.',
      'Rabby: "I already have an address", then "Seed Phrase or Private Key"; in the "Seed Phrase" tab ("My seed phrase has 12 words") type the words and press "Next"; in "Set Password" type the password twice and press "Confirm". The "Address Imported" screen shows "Seed Phrase 1 #1" with 0xf39fd6...b92266. With a wrong checksum Rabby answers "The seed phrase is invalid, please check!".',
      'In Rabby, "Add more addresses from this Seed Phrase" opens "Manage Seed Phrase": the full addresses of the sentence, with the networks used, the date of the first transaction and the balance (the accounts of the test sentence have been in use since 2020 on dozens of networks). In "Advanced Settings", "Custom Address HD path" offers "BIP44", "Ledger Live" and "Ledger Legacy": the first three addresses of each match the rows of the table in 1.4.',
      'Rainbow and Exodus, on phone and desktop, have a similar option to restore a wallet from a sentence (not tried here). MetaMask does not ask for the BIP-39 passphrase; Trezor and Ledger offer it as a "hidden wallet", and with a passphrase the same sentence gives completely different addresses (1.2).',
    ],
    tableTitle: 'The expected accounts of the test sentence',
    cols: { account: 'Account', path: 'Path', address: 'Address', check: 'Computed here' },
    accountName: (i) => `Account ${i + 1}`,
    verified: 'Checked on 13 October 2026: MetaMask 13.50.0 shows 0xf39Fd...92266, 0x70997...c79C8 and 0x3C44C...293BC; Rabby 0.94.11 lists in full 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266, 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 and 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc. They are the addresses of the table.',
  },
  categories: {
    intro: 'The assignment asks to distinguish five things that live together in the pipeline, sometimes in the same function. The criterion is the purpose, not the algorithm: SHA-256 is a hash function, but in BIP-39 it acts as a checksum; Keccak-256 gives the address and, in EIP-55, the checksum too.',
    cols: { category: 'Category', what: 'What it does', where: 'In the pipeline', properties: 'Properties' },
    rows: [
      {
        key: 'generation',
        name: 'Key generation',
        what: 'Creates a new secret from a random source. It is the only non-deterministic step: everything else is a function of it.',
        where: 'The BIP-39 entropy, 128-256 bits from a cryptographic generator (crypto.getRandomValues, the generator of a hardware wallet); here, the "Generate" buttons.',
        properties: 'Secret and unrepeatable. The security of the whole wallet is the unpredictability of this step: a weak generator makes everything else useless.',
      },
      {
        key: 'derivation',
        name: 'Key derivation',
        what: 'Computes new secrets from a secret, deterministically: same input, same output.',
        where: 'PBKDF2-HMAC-SHA512 (sentence → seed, with 2048 iterations); the HMAC-SHA512 of BIP-32 (seed → master → children) along the BIP-44 path.',
        properties: 'It adds no entropy; it is one-way (hardened children do not lead back to their parents); it allows one backup for infinitely many keys.',
      },
      {
        key: 'publicKey',
        name: 'Public-key cryptography',
        what: 'Binds a private key k to a public one K = kG: K can be published, k signs and K verifies.',
        where: 'secp256k1: private key → public key; ECDSA signatures of transactions; BIP-32 public derivation (K_i = IL·G + K).',
        properties: 'Structured: it is a group homomorphism, and that is what makes signatures possible. One-way only computationally (discrete logarithm).',
      },
      {
        key: 'hashing',
        name: 'Hashing',
        what: 'Compresses any input into a fixed-length fingerprint, resistant to preimages and collisions and indistinguishable from random bits.',
        where: 'Keccak-256 (address, EIP-55); SHA-512 inside HMAC and PBKDF2; SHA-256 (BIP-39 checksum, Base58Check); RIPEMD-160(SHA-256) for BIP-32 fingerprints.',
        properties: 'Public, keyless, not invertible, without algebraic structure.',
      },
      {
        key: 'checksum',
        name: 'Checksum',
        what: 'Adds redundancy to notice accidental transcription or typing errors.',
        where: 'BIP-39 (4-8 bits from SHA-256); EIP-55 (the letter case, from Keccak-256); Base58Check (4 bytes of double SHA-256) in xprv and xpub.',
        properties: 'Public: it protects against errors, not attacks, because anyone computes the checksum of false data. With c check bits a random error passes with probability about 2^-c.',
      },
      {
        key: 'encoding',
        name: 'Encoding',
        what: 'Represents the same bits in another form, for people or programs; it is reversible and hides nothing.',
        where: 'The words (11 bits each), hexadecimal with 0x, the Base58 of xprv and xpub, the point formats (04, 02/03), the EIP-55 letter case.',
        properties: 'Bijective, with no security: a mnemonic sentence is an encoding of the entropy, not an encryption.',
      },
    ],
    after: [
      'Two frequent confusions. The first between generation and derivation: when a wallet "creates a new account" it generates nothing, it derives the next index; this is why a single sentence restores every account, and why whoever knows the sentence knows them all. The second between encoding and encryption: words, hexadecimal and Base58 represent secrets without protecting them; the only protection of a sentence written on paper is the paper.',
      'And one case belongs to two categories: EIP-55 is an encoding (the case does not change the address) that carries a checksum (the case depends on the hash). That is what makes it backward compatible.',
    ],
  },
  stats: {
    intro: [
      'Every step of the pipeline should produce outputs that, seen from outside, cannot be told apart from uniform random bits, except where the structure is intended: the words encode the bits, the public key is a point of the curve, the letter case encodes a checksum. This is checked here with hypothesis tests, step by step.',
      `Unlike Homework #1, where the population was complete (every multiple of a point on a toy curve), here the inputs are random, independent samples of huge spaces, 2^128 sentences and 2^256 keys: the tests are inferential, and a small p-value would say something about the function, not just about the sample. The inputs come from a generator with a fixed seed (mulberry32, seed ${EXPLORE_SEED}), so the page, the downloadable program and the terminal print the same numbers; the samples are sized so that the computation takes a few seconds.`,
      `Every test has significance level α = ${EN.num(SIGNIFICANCE, 2)} and a null hypothesis H₀ written next to it. A passed test, however, proves nothing about security: it measures the absence of gross defects, not the difficulty of inverting a function (section 3.7).`,
    ],
    verdict: { reject: 'H₀ rejected', notReject: 'H₀ not rejected' },
    testLine: testLineEn,
    steps: { bip39: 'BIP-39', seed: 'Seed', bip32: 'BIP-32', secp256k1: 'secp256k1', keccak: 'Keccak-256', eip55: 'EIP-55' },
    labels: TEST_LABELS, // the same English labels as the command line
    // the label over a chart, for the bar or the cell under the pointer
    tips: {
      word: (index, word, count, expected) => `word ${index}, "${word}": ${count === 1 ? 'once' : `${count} times`} (expected ${EN.approx(expected)})`,
      words: (from, to, fromWord, toWord, min, max) => `words from ${from} ("${fromWord}") to ${to} ("${toWord}"): ${min === max ? `${max} times` : `from ${min} to ${max} times`} each`,
      nibble: (value, count, expected) => `checksum ${value.toString(2).padStart(4, '0')} (${value}): ${count} ${count === 1 ? 'sentence' : 'sentences'} (expected ${EN.approx(expected)})`,
      of: { seed: 'of the seed', key: 'of the key', x: 'of x', y: 'of y', address: 'of the address' },
      bit: (what, index, fraction, z) => `bit ${index} ${what}: share of ones = ${EN.num(fraction, 3)} (expected 0.500), z = ${EN.num(z, 2)}`,
      distances: (from, to, count, expected) => {
        let what = from === to ? `distance ${from}` : `distances from ${from} to ${to}`;
        if (from === null) what = `distances up to ${to}`;
        else if (to === null) what = `distances from ${from} up`;
        return `${what}: ${count} ${count === 1 ? 'pair' : 'pairs'} (expected ${EN.approx(expected)})`;
      },
      indexKey: (row, from, to, z) => `bit ${row} of the index, bits ${from}-${to} of the key: ${z === null ? 'not defined' : `z = ${EN.num(z, 2)}`}`,
      firstHex: (digit, count, expected) => `first digit ${digit}: ${count} ${count === 1 ? 'address' : 'addresses'} (expected ${EN.approx(expected)})`,
      sacBlock: (inFrom, inTo, outFrom, outTo, z) => `input bits ${inFrom}-${inTo}, output bits ${outFrom}-${outTo}: z = ${EN.num(z, 2)}`,
      letters: (n, count, expected) => `${n} ${n === 1 ? 'letter' : 'letters'}: ${count} ${count === 1 ? 'address' : 'addresses'} (expected ${EN.approx(expected)})`,
    },
    axes: {
      indexBits: 'index bits',
      keyBits: `key bits, in blocks of ${CORRELATION_BLOCK}`,
      inputBits: 'input bits, in blocks of 16',
      outputBits: 'output bits, in blocks of 8',
    },
    bip39: {
      intro: `If the entropy is uniform, every word is a uniform 11-bit block, and the 2048 words must appear with the same frequency. The last word also holds the checksum: 7 bits of entropy and 4 bits of SHA-256, which for a good hash function are uniform as well. Samples: ${SAMPLES.mnemonics} random sentences, ${SAMPLES.sequences} sequences of random words, ${SAMPLES.wordTypos} sentences with one word replaced.`,
      wordsChart: (N, M) => `Frequency of each of the 2048 words in ${M} sentences (${N} words); dashed: ${N}/2048 ≈ ${EN.num(N / 2048, 2)}`,
      nibbleChart: (M) => `The last 4 bits, the checksum, of the ${M} sentences; dashed: ${M}/16`,
      explain: (s) => {
        const r = s.bip39.randomSequences;
        const t = s.bip39.wordTypos;
        return [
          `Of the ${r.trials} sequences of 12 words drawn at random from the 2048, ${r.successes} have the right checksum (${EN.pct(r.rate, 2)}), against the expected 1/16 = 6.25%: an invented sentence, or one remembered wrong, has one chance in sixteen of looking valid. With 24 words the checksum has 8 bits and the probability drops to 1/256.`,
          `Replacing one random word in ${t.trials} valid sentences, the checksum caught the error in ${EN.pct(t.detected, 2)} of the cases; ${EN.pct(t.rate, 2)} passed, against the expected ${EN.pct(t.expectedRate, 2)}. The expectation is not exactly 1/16: if one of the first 11 words changes, the entropy changes, and the checksum is right again with probability 1/16; if the last one changes, the entropy stays the same in 15 cases out of 2047 (only the checksum bits change, and the sentence is always refused) and changes in the other 2032, of which 127 have the right checksum: (11/12)·(1/16) + (1/12)·(127/2047).`,
          'The BIP-39 checksum is short by design: it is meant to catch transcription errors, not to protect the secret, and every check bit would cost a bit of entropy or one more word. The unique first four letters do the rest: a garbled word is usually not in the list, and is refused before the checksum is even checked.',
        ];
      },
    },
    seed: {
      intro: `The seed is the output of PBKDF2-HMAC-SHA512. For a pseudorandom function every bit is a fair coin, independent of the others, and changing a single bit of the entropy (hence a word, and often the checksum) changes every bit of the seed with probability 1/2: the Hamming distance between the two seeds follows Binomial(512, 1/2), with mean 256 and standard deviation √512/2 ≈ 11.3. Samples: ${SAMPLES.seeds} seeds and ${SAMPLES.seedPairs} pairs.`,
      bitsChart: (N) => `Share of ones in each of the 512 bits, over ${N} seeds; dashed: 0.5`,
      distanceChart: (d, c) => `Hamming distances between the seeds of ${d.N} pairs of sentences whose entropy differs in one bit; dashed: Binomial(512, 1/2)${distanceRangeEn(c)}`,
      explain: (s) => {
        const b = s.seed.bits;
        const a = s.seed.avalanche;
        const biased = 512 * (1 + 4 * 0.05 ** 2 * b.N);
        return [
          `The ${b.N} seeds hold ${b.N * 512} bits, with ${b.beyond3} positions out of 512 more than 3 standard deviations from 1/2 (expected by chance: ${EN.num(b.expectedBeyond3, 2)}). Changing one bit of the entropy, the two seeds differ on average in ${EN.num(a.mean, 1)} bits out of 512, with standard deviation ${EN.num(a.sd, 2)} (expected ${EN.num(a.expectedSd, 2)}), from a minimum of ${a.min} to a maximum of ${a.max}: two almost equal sentences give seeds as independent as two random strings.`,
          `The sample is small by design: every seed costs 2048 iterations of HMAC-SHA512, that is more than 4000 SHA-512 compressions, and that slowness is exactly what PBKDF2 must guarantee. ${b.N} seeds are still enough to see a gross defect: if every bit were 1 with probability 0.55, Σz² would average about ${EN.num(biased, 0)} instead of 512 ± 32, with a p-value of about ${EN.pval(chiSquarePValue(biased, 512))}.`,
        ];
      },
    },
    bip32: {
      intro: `The keys m/44'/60'/0'/0/i of the test sentence, for i from 0 to ${SAMPLES.keys - 1}. Consecutive indices differ in a few bits; they enter HMAC-SHA512 with the parent’s chain code, and k_i = IL + k (mod n). If HMAC behaves as a pseudorandom function, the keys have no visible link with the index: balanced bits, neighbouring keys at distance Binomial(256, 1/2), no correlation between index bits and key bits.`,
      bitsChart: (N) => `Share of ones in each of the 256 bits, over ${N} child keys; dashed: 0.5`,
      distanceChart: (d, c) => `Distances between the keys of indices i and i + 1 (${d.N} pairs); dashed: Binomial(256, 1/2)${distanceRangeEn(c)}`,
      heatmap: (c) => `Correlation between the ${c.inputBits} index bits (rows) and the 256 key bits in blocks of ${CORRELATION_BLOCK} (columns), as a z-score: blue negative, red positive, scale ±4. Without any link every cell is about N(0, 1).`,
      explain: (s) => {
        const b = s.bip32.bits;
        const d = s.bip32.siblings;
        const c = s.bip32.correlation;
        return [
          `The ${b.N} keys have ${b.beyond3} bits out of 256 more than 3 standard deviations away (expected ${EN.num(b.expectedBeyond3, 2)}), and keys of consecutive indices are on average ${EN.num(d.mean, 1)} bits apart out of 256 (expected 128), with standard deviation ${EN.num(d.sd, 2)} against 8: almost equal indices, keys with nothing in common. Adding k (mod n) does not spoil uniformity, because adding a constant modulo n is a bijection; and the keys are uniform in [1, n) instead of [0, 2^256), a difference of one part in 2.7 · 10^38, invisible.`,
          `The heatmap compares each of the ${c.inputBits} index bits with the 256 key bits: ${c.above} correlations out of ${c.inputBits * 256} exceed 3/√(N - 1) in absolute value, against ${EN.num(c.expectedAbove, 2)} expected with no link at all (estimated from the same permutations); the global statistic N·Σφ² = ${EN.num(c.statistic, 1)} has p = ${EN.pval(c.pValue)} over ${c.sims} random permutations of the keys among the indices.`,
          'And yet sibling keys are not independent for everyone. For whoever knows the parent’s xpub, which contains the chain code, every IL_i can be computed and the differences k_i - k_j = IL_i - IL_j (mod n) are known: a single child key reveals all the others (section 1.3). No test on the bits can see it, because the dependence goes through a secret: it is a cryptographic property, not a statistical one.',
        ];
      },
    },
    secp: {
      intro: `The public keys K_i = k_i G of the same ${SAMPLES.keys} keys, and ${SAMPLES.keyPairs} pairs of random private keys that differ in one bit. The coordinates are numbers modulo p, and p is smaller than 2^256 by about 2^32: written on 256 bits they are uniform up to one part in 10^67. The parity of y, that is the 02 or 03 prefix of the compressed form, should be a fair bit, because (x, y) and (x, p - y) are both on the curve and have opposite parity.`,
      xChart: (N) => `Share of ones in the 256 bits of x, over ${N} public keys`,
      yChart: (N) => `Share of ones in the 256 bits of y, over ${N} public keys`,
      distanceChart: (d, c) => `Distances between x ‖ y of ${d.N} pairs of private keys that differ in one bit; dashed: Binomial(512, 1/2)${distanceRangeEn(c)}`,
      homomorphism: (h) => `Structure, not a test: (k1 + k2)G = k1G + k2G in ${h.holds} trials out of ${h.trials}.`,
      explain: (s) => {
        const p = s.secp256k1.parity;
        const x = s.secp256k1.bitsX;
        const y = s.secp256k1.bitsY;
        const a = s.secp256k1.avalanche;
        const h = s.secp256k1.homomorphism;
        return [
          `y is odd ${p.successes} times out of ${p.trials} (${EN.pct(p.rate, 1)}), and the bits of x and y are balanced: more than 3 standard deviations away, ${x.beyond3} and ${y.beyond3} out of 256, ${EN.num(x.expectedBeyond3, 2)} expected. Changing a single bit of the private key, x ‖ y changes on average in ${EN.num(a.mean, 1)} bits out of 512, with standard deviation ${EN.num(a.sd, 2)} (expected ${EN.num(a.expectedSd, 2)}): scalar multiplication mixes like a random function.`,
          `But it is a homomorphism: (k1 + k2)G = k1G + k2G in ${h.holds} trials out of ${h.trials}. A hash function with this property would be broken, since from H(a) and H(b) one would compute H(a + b); for secp256k1 it is the point, because signatures, key exchange and BIP-32 public derivation rest on it. Tests on single values do not see it: it takes the right test, which here is an algebraic check. This is why, after the curve, the pipeline puts a hash.`,
        ];
      },
    },
    keccak: {
      intro: `Addresses are the last 20 bytes of Keccak-256(x ‖ y). If Keccak-256 behaves as a random function, the bits and bytes of the addresses are uniform, and changing any input bit changes every output bit with probability 1/2 (the strict avalanche criterion, SAC): the distance between the two outputs follows Binomial(256, 1/2). The avalanche uses ${SAMPLES.keccakInputs} random 64-byte inputs, like x ‖ y, each with every one of its 512 bits flipped in turn: ${SAMPLES.keccakInputs * 512} pairs.`,
      bitsChart: (N) => `Share of ones in the 160 bits of the addresses, over ${N} addresses`,
      hexChart: (N) => `First hexadecimal digit of ${N} addresses; dashed: ${N}/16`,
      distanceChart: (d, c) => `Distances between Keccak-256(x) and Keccak-256(x with one bit flipped), ${d.N} pairs; dashed: Binomial(256, 1/2)${distanceRangeEn(c)}`,
      heatmap: 'The SAC matrix in blocks: rows, 32 blocks of 16 input bits; columns, 32 blocks of 8 output bits. Every cell is the z-score of the change frequency against 1/2 (2048 measurements): blue below, red above, scale ±4.',
      explain: (s) => {
        const k = s.keccak;
        const a = k.avalanche;
        const rates = a.perOutput.rates;
        return [
          `The addresses of the ${k.addressBits.N} keys have balanced bits (${k.addressBits.beyond3} out of 160 more than 3 standard deviations away), and their first hexadecimal digit and their bytes are uniform: nothing of the structure of the point survives the hash.`,
          `The ${a.pairs} distances have mean ${EN.num(a.mean, 2)} (expected 128) and standard deviation ${EN.num(a.sd, 2)} (expected 8). Every output bit changes with a frequency between ${EN.num(Math.min(...rates), 3)} and ${EN.num(Math.max(...rates), 3)} (expected 0.5; ${a.perOutput.beyond3} bits out of 256 more than 3 standard deviations away), every input bit changes half of the output on average, and the block map shows no rows or columns: no part of the input counts less than the others. Keccak-f reaches full avalanche after a few of its 24 rounds; the rest is a margin against subtler attacks, which indeed only work on reduced versions.`,
          `Keccak-256 and SHA3-256 of the same input are on average ${EN.num(k.versusSha3.mean, 1)} bits apart out of 256: the single different padding byte, 0x01 against 0x06, is enough to make them two independent functions, as domain separation intends (section 4.2).`,
        ];
      },
    },
    eip55: {
      intro: `In a uniform address every hexadecimal digit is a letter (a-f) with probability 6/16 = 3/8: the number of letters follows Binomial(40, 3/8), with mean 15. Every letter carries one check bit, its case, decided by Keccak-256 of the address: 15 bits on average, but with much variation from one address to another. Samples: the addresses of the ${SAMPLES.keys} keys and ${SAMPLES.addressTypos} typos.`,
      lettersChart: (N) => `Number of letters in ${N} addresses; dashed: Binomial(40, 3/8)`,
      explain: (s) => {
        const e = s.eip55;
        const N = e.letters.test.N;
        const few = addressesWithAtMost(s, 10);
        const t = e.typos;
        return [
          `The ${N} addresses have ${EN.num(e.letters.mean, 2)} letters on average, and ${EN.pct(e.uppercase.rate, 1)} of the letters are upper case. ${few} addresses out of ${N} (${EN.pct(few / N, 1)}) have 10 letters or fewer, hence at most 10 check bits.`,
          'A typo in one character gives another address, with an independent hash: each of its letters has the right case with probability 1/2, and the typo passes with probability 2^-L, where L is the number of letters. Averaging over L ~ Binomial(40, 3/8), E[2^-L] = (5/8 + 3/8 · 1/2)^40 = (13/16)^40 ≈ 0.0247%, the value quoted by EIP-55. It is not 2^-15 ≈ 0.003%, because by Jensen’s inequality addresses with few letters weigh a lot: an address without letters, with probability (5/8)^40 ≈ 7 · 10^-9, has no checksum at all.',
          `In the simulation, ${t.trials} typos (one character replaced by another hexadecimal digit, letters in upper or lower case at random): ${t.passed} accepted, ${EN.num(t.expected, 1)} expected for an ideal hash, given the number of letters of each mistyped address. The observed rate, ${EN.pct(t.passed / t.trials, 4)}, compares with the ${EN.pct(t.exactRate, 4)} of the formula; compared with the checksum of a 12-word BIP-39 sentence, which lets one error in 16 through, EIP-55 is about 250 times stricter, without adding characters.`,
        ];
      },
    },
    summary: {
      intro: (sum, smallestLabel) =>
        `${sum.count} tests, each at level α = ${EN.num(SIGNIFICANCE, 2)}. Even if every function were ideal, ${EN.num(sum.count * SIGNIFICANCE, 1)} rejections would be expected on average by pure chance; here ${sum.rejected === 0 ? 'there are none' : `there ${sum.rejected === 1 ? 'is 1' : `are ${sum.rejected}`}`}. The smallest p-value is ${EN.pval(sum.smallest.result.pValue)} (${smallestLabel}); the Bonferroni correction, which keeps the probability of even a single false rejection below 5%, would lower the threshold to ${EN.num(SIGNIFICANCE, 2)}/${sum.count} ≈ ${EN.num(sum.bonferroni, 4)}.`,
      cols: { step: 'Step', hypothesis: 'Null hypothesis H₀', p: 'p-value', verdict: 'Result' },
      after: [
        'The pseudorandom steps, SHA-256 in the checksum, PBKDF2, HMAC-SHA512 and Keccak-256, behave as random functions, within what samples of this size can see. Structure is present where it is intended, in the words, which encode the bits, and in the curve, which is a homomorphism; and it only shows up with the right test.',
        'What the tests cannot say is that the pipeline is secure. A counter encrypted with AES under a known key passes all these tests and can be inverted by anyone; the security of the steps rests on decades of cryptanalysis, not on statistics. The tests are for finding gross errors, and history offers instructive ones: in 2023 the bx seed command of Libbitcoin Explorer generated BIP-39 entropy with a Mersenne Twister seeded from 32 bits of the clock. Every sentence was formally perfect and, taken alone, statistically flawless; but there were only 2^32 possible sentences, and the funds were stolen (the "Milk Sad" incident). The defect was not in the outputs but in the space they came from: a test on the outputs would only see it with about 2^16 sentences, looking for repetitions.',
      ],
    },
  },
  history: {
    intro: 'The assignment asks for the approximate historical order of seven milestones, highlighted below; the other dates help place them: where the ideas come from, and why Ethereum uses exactly these versions.',
    legend: { task: 'milestone of the assignment', context: 'context' },
    events: [
      { year: '1976', task: false, title: 'Diffie and Hellman', text: 'With "New Directions in Cryptography" the idea of public-key cryptography is born: two parties agree on a secret over a public channel, and digital signatures become conceivable.' },
      { year: '1977', task: true, title: 'RSA', text: 'Rivest, Shamir and Adleman: the first practical public-key encryption and signature system, based on the difficulty of factoring. Ethereum does not use it, but inherits its scheme: private key, public key, signatures anyone can verify.' },
      { year: '1985', task: false, title: 'Elliptic curves', text: 'Koblitz and Miller propose, independently, the group of points of an elliptic curve: the same security as RSA with much shorter keys, 256 bits against about 3072.' },
      { year: '1996-1997', task: false, title: 'RIPEMD-160 and HMAC', text: 'RIPEMD-160 (1996) gives the 4-byte fingerprints of BIP-32 extended keys. HMAC (Bellare, Canetti and Krawczyk; RFC 2104, 1997) turns a hash function into a MAC and a keyed pseudorandom function: it is the heart of PBKDF2 and BIP-32.' },
      { year: '1999-2000', task: false, title: 'PBKDF2, ECDSA and secp256k1', text: 'PKCS #5 v2.0 (RFC 2898, 2000) defines PBKDF2, which BIP-39 uses for the seed; ECDSA enters the standards (ANSI X9.62 in 1999, FIPS 186-2 in 2000); SEC 2 (2000) publishes the parameters of secp256k1, a Koblitz curve with a = 0 and b = 7.' },
      { year: '2001', task: true, title: 'SHA-2 / SHA-512', text: 'NIST publishes the SHA-2 family, designed by the NSA (draft in 2001, FIPS 180-2 in 2002): SHA-256 and SHA-512 have the Merkle-Damgård structure of MD5 and SHA-1.' },
      { year: '2004-2005', task: false, title: 'Attacks on MD5 and SHA-1', text: 'Wang and colleagues find collisions in MD5 and a theoretical attack on SHA-1. SHA-2 holds, but it has the same structure: NIST decides to look for a different alternative.' },
      { year: '2007-2012', task: false, title: 'The SHA-3 competition', text: 'A public competition with 64 submissions, modelled on the one that had chosen AES. In 2012 Keccak wins (Bertoni, Daemen, Peeters and Van Assche), a sponge function.' },
      { year: '2008-2009', task: false, title: 'Bitcoin', text: 'Satoshi Nakamoto’s paper (2008) and network (2009): secp256k1, ECDSA signatures, addresses from SHA-256 and RIPEMD-160. Early wallets keep independent random keys, and every new key needs a new backup.' },
      { year: '2012', task: true, title: 'BIP-32', text: 'Pieter Wuille introduces hierarchical deterministic wallets: one seed, a tree of keys, extended public keys for watch-only wallets. One backup, forever.' },
      { year: '2013', task: true, title: 'BIP-39', text: 'Palatinus, Rusnak, Voisine and Bowe (among them the founders of Trezor): the seed becomes a sentence of 12 to 24 words with a checksum, to be written down by hand. At the end of the same year Vitalik Buterin writes the Ethereum white paper.' },
      { year: '2014', task: true, title: 'BIP-44', text: 'Palatinus and Rusnak fix the structure of paths (purpose, coin, account, chain, index), with the coin types of the SLIP-44 registry: 60 for Ethereum. The same year Gavin Wood’s yellow paper specifies Ethereum, with Keccak-256 as its hash function.' },
      { year: '2015', task: true, title: 'SHA-3', text: 'FIPS 202: Keccak becomes SHA-3, with a padding that separates the domains of the different functions. Ethereum, live since 30 July, a week before publication, was already bound to the competition version: it uses Keccak-256, not SHA3-256.' },
      { year: '2016', task: true, title: 'EIP-55', text: 'Buterin and Van de Sande: the checksum in the letter case of addresses, compatible with all existing software. The same year EIP-2 only accepts signatures with s ≤ n/2 and EIP-155 adds the network identifier to signatures.' },
    ],
    after: 'Read in order, the pipeline is layered in time. The mathematical foundations (1976-1985) predate cryptocurrencies by thirty years; the primitives (HMAC, PBKDF2, ECDSA, SHA-2, secp256k1) are standards of the early 2000s, chosen by Bitcoin in 2009 and inherited by Ethereum; the BIPs of 2012-2014 solve a problem born with Bitcoin, managing many keys. Ethereum adds Keccak-256 (2014-2015) and EIP-55 (2016). This is why the seed of an Ethereum wallet goes through the key "Bitcoin seed" and a registry of coins: key management is inherited, the address is Ethereum’s own.',
    sha: {
      intro: 'SHA-2 and SHA-3 both belong to the cryptographic hash functions, and they are related by history more than by structure. The table compares them, together with the Keccak variant used by Ethereum.',
      cols: ['', 'SHA-256 / SHA-512 (SHA-2)', 'Keccak-256 (Ethereum)', 'SHA3-256 (FIPS 202)'],
      rows: [
        ['Origin', 'NSA; NIST, FIPS 180-2, 2001-2002', 'Bertoni, Daemen, Peeters and Van Assche; winner of the SHA-3 competition, 2012', 'NIST, FIPS 202, 2015'],
        ['Construction', 'Merkle-Damgård: a compression function (Davies-Meyer) applied to every block', 'Sponge on the Keccak-f[1600] permutation', 'The same sponge'],
        ['Internal state', '256 / 512 bits, as large as the output', '1600 bits: rate 1088 plus capacity 512', 'Same'],
        ['Block and rounds', '512 bits and 64 rounds / 1024 bits and 80 rounds', '1088 bits (136 bytes), 24 rounds', 'Same'],
        ['Padding', 'A 1 bit, zeros, then the message length (64 / 128 bits)', 'pad10*1: first byte 0x01, last 0x80', 'Suffix 01, then pad10*1: first byte 0x06'],
        ['Length extension', 'Yes: from H(m) and the length of m one computes H(m ‖ padding ‖ m′)', 'No: the capacity is never output', 'No'],
        ['In this pipeline', 'SHA-512 in HMAC (BIP-32) and PBKDF2 (BIP-39); SHA-256 in the BIP-39 checksum, in Base58Check and in fingerprints', 'Addresses, EIP-55, transactions', 'None: here only for comparison'],
      ],
      digestsTitle: 'The same sponge, two paddings: the hashes of the empty string',
      digestLabel: (name) => `${name}("")`,
      paras: [
        'SHA-2 (2001) extends the structure of MD5 and SHA-1: a compression function iterated in Merkle-Damgård fashion, whose final state is the hash. After the 2004-2005 attacks on MD5 and SHA-1, NIST did not look for a replacement of SHA-2, which still holds, but for an alternative with a different structure, so that progress against one would not hit the other as well. The competition (2007-2012) was won by Keccak, a sponge function: a 1600-bit state, of which 1088 bits of message are absorbed at every step (the rate), while the other 512 (the capacity) are never read or written from outside and determine the security, c/2 = 256 bits against generic attacks.',
        'Keccak-256 and SHA3-256 differ only in the padding. In the FIPS 202 draft (2014) NIST added two domain-separation bits before the pad10*1 padding, 01 for SHA-3 and 1111 for the SHAKE functions, so that different functions built on the same permutation never give the same output. Ethereum, designed in those same months, had already adopted the competition version. With the same message the final block changes, 0x01 becomes 0x06, and the permutation does the rest: the outputs have nothing in common. This is why in Ethereum software the function is called keccak256 (Solidity removed the sha3 alias in version 0.5.0), and a generic "SHA-3" library would give wrong addresses.',
        'The structure also changes the guarantees. In SHA-256 the output is the whole internal state: whoever knows H(m) and the length of m can continue the computation and obtain H(m ‖ padding ‖ m′) without knowing m. This is why a MAC with SHA-2 is built with HMAC, two nested hashes, as in BIP-32 and PBKDF2. In Keccak the capacity is never output: no length extension, and a MAC can simply be the hash of key and message (KMAC).',
      ],
    },
  },
  discussion: {
    why: {
      intro: 'The assignment lists four groups with four purposes. Each one needs properties the others lack, or indeed must not have.',
      cols: { parts: 'Components', purpose: 'Purpose', instead: 'Why not another technique' },
      rows: [
        {
          parts: 'BIP-39 / BIP-32 / BIP-44',
          purpose: 'Key management and derivation: a single secret, written down by hand, from which infinitely many keys are derived reproducibly, organized by coin and account.',
          instead: 'A random key for every address would need a backup for every key. A hash of the seed would be enough to derive private keys, but not public keys without secrets (the xpub exploits the structure of the curve), nor words with a checksum and a deliberately slow derivation.',
        },
        {
          parts: 'secp256k1',
          purpose: 'The relation between private and public key, and digital signatures: anyone verifies, only the owner signs.',
          instead: 'A hash is one-way, but alone it cannot verify a signature without revealing the secret (hash-based signatures exist, but they are thousands of bytes long or one-time). An algebraic structure is needed: the homomorphism.',
        },
        {
          parts: 'Keccak-256',
          purpose: 'Hashing: a short, uniform, structureless identifier for the public key, and the fingerprints of transactions, blocks and data.',
          instead: 'The public key is long (64 bytes) and structured; the hash compresses it and erases its structure. A function with algebraic structure, like the curve, cannot act as a hash.',
        },
        {
          parts: 'EIP-55',
          purpose: 'Checksum: catching the errors of whoever types or copies an address.',
          instead: 'It does not need to resist attacks but to cost nothing: no extra characters, compatible with existing software. A signature or a MAC would not help, because the error is made by a person, and an attacker computes the right checksum of their own address anyway.',
        },
      ],
      after: [
        'The required properties conflict, and no algorithm has them all: a signature needs algebraic structure, a hash its absence; a key must be long and unpredictable, a checksum short and computable by anyone; generation must be random, derivation deterministic. Homework #1 showed it on a small scale: scalar multiplication is one-way, but has too much structure to act as a hash.',
        'Separating the roles also has engineering advantages: each layer is analysed, standardized and replaced on its own. EIP-55 arrived in 2016 without changing the protocol; a wallet can change word list or path without touching the curve; and if a quantum computer solved the discrete logarithm (Shor’s algorithm), the signatures would have to be replaced, while Grover’s algorithm would take at most half of the security bits of the hashes. Even where the function is the same, like HMAC-SHA512 in BIP-39 and in BIP-32, keys and data change from one use to the other: this is domain separation, which keeps one use from interfering with another.',
      ],
    },
    fit: [
      'Following the bits: 128 bits of entropy become 12 words (132 bits with the checksum), then a 512-bit seed, a 256-bit private key, a 512-bit public key (x ‖ y), a 256-bit hash, a 160-bit address and finally 40 characters with about 15 checksum bits in the letter case. Lengths go up and down, security does not: no deterministic step adds entropy, and each one can only keep it or lose some.',
      'The levels are chosen to fit. 128 bits of entropy match the security level of secp256k1 (Pollard’s rho needs about 2^128 operations) and the collision resistance of Keccak-256; the 160-bit address offers 2^160 against whoever looks for a key for a given address. A 24-word sentence carries 256 bits of entropy but does not raise the security of the funds beyond the curve’s roughly 128 bits: it gives a margin against a faulty generator.',
      'Every step has a role, and the next one relies on it. BIP-39 makes the secret writable and checkable; PBKDF2 slows it down and separates it from the words; BIP-32 multiplies it into a tree, with the xpub for whoever only needs to watch; BIP-44 makes the tree the same for every wallet; secp256k1 binds to every private key a public key that verifies signatures; Keccak-256 compresses the public key into a uniform identifier; EIP-55 protects whoever copies it from errors. Statistically the chain alternates pseudorandom functions, whose outputs pass the tests of section 3, and structured transformations (the words, the curve, the letter case), whose structure is intended.',
      'The chain also runs backwards, when spending: the wallet signs with k (ECDSA, usually with a deterministic nonce following RFC 6979), the network recovers K from the signature and the recovery bit, computes Keccak-256 of it and takes the last 20 bytes as the sender. Every primitive of the pipeline comes back, in the opposite direction.',
    ],
    conclusion: (sum) => [
      'The pipeline of an Ethereum wallet is a chain of standards born at different times and for different problems: key management comes from Bitcoin (BIP-32, BIP-39, BIP-44, and the HMAC key "Bitcoin seed" is a reminder), the curve and signatures from the standards of the early 2000s, the hash from a public competition won in 2012 but adopted before standardization, the checksum from an Ethereum proposal of 2016. Every link has been checked here against the official vectors, and can be checked with a real wallet.',
      'The five categories of the assignment correspond to five different guarantees: unpredictability (generation), reproducibility (derivation), verifiability without a secret (public key), compression without structure (hash), detection of human errors (checksum); encoding guarantees nothing, it makes the bits readable. No single algorithm offers them all, because some exclude each other: the signature wants structure, the hash wants its absence.',
      `Statistically, the pseudorandom steps are indistinguishable from random functions ${sum === null ? 'in the tests of section 3' : sum.rejected === 0 ? `in all ${sum.count} tests` : `in ${sum.count - sum.rejected} tests out of ${sum.count} (one rejection every twenty tests is expected by chance)`}, and the only structure measured, the homomorphism of the curve, is the intended one. But section 3 also showed the limit of the method: the dependences that matter (the xpub with a child key, a generator with few seeds) go through secrets or through the space of inputs, where tests on outputs do not look. The security of a wallet is decided in the first step, the generation of the entropy, and in the custody of the sentence; the rest is deterministic mathematics, verifiable, and verified here.`,
    ],
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: once the archive is extracted, it opens with a double click on index.html, even offline. With node homework2.js it prints the pipeline, the test vectors and the statistics in a terminal; --mnemonic, --passphrase, --index and --path change the input.',
    contents: 'Contents: index.html, style.css, homework2.js (pipeline, checks and statistics), app.js (interface and texts), README.txt.',
    zip: 'Download homework2.zip',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'From a mnemonic sentence to an Ethereum address: hashing, key derivation and cryptographic primitives.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
    noscript: 'This program needs JavaScript.',
  },
};

const HW2_TEXTS = { it, en };

return { originalAssignment, HW2_TEXTS };
})();

(function () {
'use strict';

// src/pages/statistics/hw2/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework2.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
const hw = Homework2;
const view = view$;
const { HW2_TEXTS, originalAssignment } = texts$;

const HEADINGS = ['h2', 'h3', 'h4'];
const LANGUAGES = ['it', 'en'];
const hex = hw.toHex;

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#161616',
    text: '#d6d6d6',
    grid: '#262626',
    bars: '#7986cb',
    reference: '#ff6b81',
    heatNegative: '#5b8def',
    heatZero: '#1e1e1e',
    heatPositive: '#ff6b81',
    heatNull: '#3a3a3a',
  },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const palette = () => (darkQuery.matches ? PALETTES.dark : PALETTES.light);

// I campi non devono passare per correttori, completamenti o gestori di
// password: una frase mnemonica non deve uscire dal browser.
const PRIVATE_FIELD = {
  autocomplete: 'off',
  autocorrect: 'off',
  autocapitalize: 'none',
  spellcheck: 'false',
  'data-gramm': 'false',
  'data-lpignore': 'true',
};

// ---------------------------------------------------------------------------
// Stato e preferenze
// ---------------------------------------------------------------------------

function initialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (LANGUAGES.includes(fromUrl)) return fromUrl;
  try {
    const saved = window.localStorage.getItem('hw2-lang');
    if (LANGUAGES.includes(saved)) return saved;
  } catch {
    // file:// o navigazione privata: nessuna preferenza salvata
  }
  return 'it';
}

const state = {
  lang: initialLanguage(),
  fields: { ...view.TEST_INPUTS },
  applied: view.appliedInput(view.readInputs(view.TEST_INPUTS)),
};
let text = HW2_TEXTS[state.lang];
const regions = {};
const controls = {};
const computed = { vectors: null, stats: null }; // null while computing, then { value } or { error }

const sameApplied = (a, b) => a.mnemonic === b.mnemonic && a.passphrase === b.passphrase && a.path === b.path;

// Il seed (2048 iterazioni di PBKDF2) si ricalcola solo se cambiano frase o
// passphrase; le chiavi solo se cambia anche il percorso.
const cache = { seedKey: null, seed: null, analysis: null, comparison: null, path: null, keys: null };

function currentPipeline() {
  const a = state.applied;
  const seedKey = JSON.stringify([a.mnemonic, a.passphrase]);
  if (cache.seedKey !== seedKey) {
    cache.seedKey = seedKey;
    cache.seed = hw.mnemonicToSeed(a.mnemonic, a.passphrase);
    cache.analysis = hw.analyzeMnemonic(a.mnemonic);
    cache.comparison = view.presetComparison(cache.seed);
    cache.path = null;
  }
  if (cache.path !== a.path) {
    cache.path = a.path;
    cache.keys = hw.keysFromSeed(cache.seed, a.path);
  }
  return { ok: true, analysis: cache.analysis, passphrase: a.passphrase, ...cache.keys };
}

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
const pending = () => h('p', { class: 'note pending', role: 'status', text: text.ui.computing });
const failure = (message) => h('p', { class: 'note', text: text.ui.error(message) });
// La nota "valori dell'ultimo input valido" c'e' sempre, nascosta: la mostra
// il CSS quando la sezione della pipeline ha la classe is-stale. Cosi' un
// errore in un campo cambia una classe invece di ridisegnare tutto.
const staleNote = () => h('p', { class: 'stale stale-note', text: text.pipeline.stale });
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad', text: label });

/** A labelled value: the label above, the (long, hexadecimal) value below. */
const value = (label, content, extra = '') => h('div', { class: `value ${extra}`.trim() }, h('span', { class: 'value-label', text: label }), h('code', null, content));

// The width of every chart comes from the ResizeObserver, measured after
// layout: reading clientWidth right after another chart has been resized
// would make the browser lay out the whole page again, once per chart. The
// height is set at once, the drawing happens a few milliseconds per frame.
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

function figure(caption, draw, data, wide = false, tip = null) {
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': caption });
  const fig = h('figure', { class: wide ? 'figure wide' : 'figure' }, canvas, h('figcaption', { text: caption }));
  // the label with the values of the bar or the cell under the pointer
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

function redrawAll() {
  for (const [canvas, chart] of charts) {
    if (chart.width > 0) chart.draw(canvas, { ...chart.data, width: chart.width }, palette());
  }
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

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  const blocks = originalAssignment().map((block) => {
    if (block.type === 'title' || block.type === 'heading') return h('p', null, h('strong', { text: block.text }));
    if (block.type === 'lines') return h('p', null, block.lines.map((line, j) => (j ? [h('br'), line] : line)));
    return h('p', { text: block.text });
  });
  return h(
    'section',
    { class: 'section' },
    title('hw2-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      h('p', { class: 'note', text: text.assignment.originalNote }),
      h('blockquote', { lang: 'en' }, blocks),
    ),
  );
}

// ---------------------------------------------------------------------------
// 1. TASK: la pipeline
// ---------------------------------------------------------------------------

function pipelineSection() {
  const S = text.sections;
  for (const name of ['flow', 'mnemonicStatus', 'pathHelp', 'stale', 'badge', 'bip39', 'seed', 'bip32', 'bip44', 'secp', 'keccak', 'eip55', 'vectors', 'wallets']) {
    regions[name] = h('div');
  }
  regions.pipeline = h(
    'section',
    { class: 'section' },
    title('hw2-pipeline', 0, S.pipeline),
    paras(text.pipeline.intro),
    regions.flow,

    title('hw2-input', 1, S.input),
    inputBlock(),

    title('hw2-bip39', 1, S.bip39),
    paras(text.bip39.intro),
    regions.bip39,
    subtitle(text.bip39.seedTitle),
    h('pre', { text: text.bip39.seedFormula }),
    regions.seed,
    paras(text.bip39.after),

    title('hw2-bip32', 1, S.bip32),
    paras(text.bip32.intro),
    regions.bip32,

    title('hw2-bip44', 1, S.bip44),
    h('p', { text: text.bip44.intro }),
    regions.bip44,
    paras(text.bip44.after),

    title('hw2-secp256k1', 1, S.secp256k1),
    paras(text.secp.intro),
    constantsBlock(),
    regions.secp,
    paras(text.secp.after),

    title('hw2-keccak', 1, S.keccak),
    h('p', { text: text.keccak.intro }),
    regions.keccak,
    paras(text.keccak.after),

    title('hw2-eip55', 1, S.eip55),
    paras(text.eip55.intro),
    regions.eip55,
    paras(text.eip55.after),

    title('hw2-verify', 1, S.verify),
    h('p', { text: text.verify.intro }),
    regions.vectors,

    title('hw2-wallets', 1, S.wallets),
    h('p', { text: text.wallets.intro }),
    h('ol', { class: 'steps' }, text.wallets.steps.map((step) => h('li', { text: step }))),
    regions.wallets,
  );
  return regions.pipeline;
}

function updateFlow(pipeline) {
  const P = text.pipeline;
  fill(
    regions.flow,
    h(
      'figure',
      { class: 'flow' },
      h('figcaption', { text: P.flowTitle }),
      staleNote(),
      h('ol', null, view.flowNodes(pipeline).map((item) => (item.arrow
        ? h('li', { class: 'flow-arrow' }, h('button', { type: 'button', onclick: () => goTo(item.target) }, h('span', { 'aria-hidden': 'true', text: '↓' }), ` ${P.arrows[item.arrow]}`))
        : h('li', { class: 'flow-node' }, h('span', { text: P.nodes[item.key] }), h('code', { text: item.value }))))),
    ),
  );
}

// --- 1.1 I campi ----------------------------------------------------------------

function inputBlock() {
  const I = text.input;
  const f = state.fields;
  controls.mnemonic = h('textarea', {
    rows: 3,
    ...PRIVATE_FIELD,
    maxlength: view.MNEMONIC_MAX_LENGTH,
    'aria-describedby': 'mnemonic-status',
    oninput: (e) => changeFields({ mnemonic: e.target.value.slice(0, view.MNEMONIC_MAX_LENGTH) }),
  });
  controls.mnemonic.value = f.mnemonic;
  controls.passphrase = h('input', {
    type: 'text',
    class: 'wide',
    ...PRIVATE_FIELD,
    maxlength: view.PASSPHRASE_MAX_LENGTH,
    'aria-describedby': 'passphrase-help',
    oninput: (e) => changeFields({ passphrase: e.target.value.slice(0, view.PASSPHRASE_MAX_LENGTH) }),
  });
  controls.passphrase.value = f.passphrase;
  controls.preset = h(
    'select',
    { onchange: (e) => changePreset(e.target.value) },
    view.PRESETS.map((p) => h('option', { value: p, text: I.presets[p] })),
  );
  controls.preset.value = f.preset;
  controls.index = h('input', {
    type: 'text',
    inputmode: 'numeric',
    ...PRIVATE_FIELD,
    maxlength: view.INDEX_MAX_LENGTH,
    'aria-describedby': 'path-help',
    oninput: (e) => changeFields({ indexText: e.target.value.slice(0, view.INDEX_MAX_LENGTH) }),
  });
  controls.index.value = f.indexText;
  controls.path = h('input', {
    type: 'text',
    class: 'wide',
    ...PRIVATE_FIELD,
    maxlength: view.PATH_MAX_LENGTH,
    'aria-describedby': 'path-help',
    oninput: (e) => changeFields({ customPath: e.target.value.slice(0, view.PATH_MAX_LENGTH) }),
  });
  controls.path.value = f.customPath;
  controls.indexLabel = h('label', null, h('span', { text: I.indexLabel }), controls.index);
  controls.pathLabel = h('label', null, h('span', { text: I.pathLabel }), controls.path);

  return [
    h('p', { text: I.intro }),
    h(
      'div',
      { class: 'fields' },
      h('label', { class: 'mnemonic' }, h('span', { text: I.mnemonicLabel }), controls.mnemonic),
      regions.mnemonicStatus,
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', class: 'btn alt', text: I.useTest, onclick: () => changeFields({ mnemonic: hw.TEST_MNEMONIC }, true) }),
        h('button', { type: 'button', class: 'btn alt', text: I.random(12), onclick: () => changeFields({ mnemonic: hw.generateMnemonic(12) }, true) }),
        h('button', { type: 'button', class: 'btn alt', text: I.random(24), onclick: () => changeFields({ mnemonic: hw.generateMnemonic(24) }, true) }),
      ),
      h('p', { class: 'note', text: I.randomNote }),
      h('div', { class: 'controls' }, h('label', null, h('span', { text: I.passphraseLabel }), controls.passphrase)),
      h('p', { id: 'passphrase-help', class: 'note', text: I.passphraseHint }),
      h('div', { class: 'controls' }, h('label', null, h('span', { text: I.presetLabel }), controls.preset), controls.indexLabel, controls.pathLabel),
      regions.pathHelp,
    ),
    regions.stale,
    regions.badge,
  ];
}

/** Puts the values of the state into the fields, after a button changed them. */
function syncFields() {
  const f = state.fields;
  if (controls.mnemonic.value !== f.mnemonic) controls.mnemonic.value = f.mnemonic;
  if (controls.passphrase.value !== f.passphrase) controls.passphrase.value = f.passphrase;
  if (controls.preset.value !== f.preset) controls.preset.value = f.preset;
  if (controls.index.value !== f.indexText) controls.index.value = f.indexText;
  if (controls.path.value !== f.customPath) controls.path.value = f.customPath;
}

function changeFields(patch, fromButton = false) {
  state.fields = { ...state.fields, ...patch };
  if (fromButton) syncFields();
  const read = view.readInputs(state.fields);
  regions.pipeline.classList.toggle('is-stale', !read.valid);
  let refresh = false;
  if (read.valid) {
    const input = view.appliedInput(read);
    if (!sameApplied(input, state.applied)) {
      state.applied = input;
      refresh = true;
    }
  }
  updateInputs(read);
  updateBip39(read);
  if (refresh) updatePipeline();
}

function changePreset(value) {
  const preset = view.PRESETS.includes(value) ? value : 'bip44';
  const read = view.readInputs(state.fields);
  changeFields(preset === 'custom' && read.path.ok ? { preset, customPath: read.path.value } : { preset }, true);
}

function updateInputs(read) {
  const I = text.input;
  const a = read.analysis;
  const f = state.fields;
  let status;
  if (a.error === 'empty') status = I.status.empty;
  else if (a.error === 'unknown-word') status = I.status.unknown(a.unknown.map((u) => ({ ...u, suggestions: view.suggestWords(u.word) })));
  else if (a.error === 'length') status = I.status.length(a.count);
  else if (a.error === 'checksum') status = I.status.checksum(a);
  else status = I.status.valid(a);
  fill(regions.mnemonicStatus, h('p', { id: 'mnemonic-status', class: a.valid ? 'check is-ok' : 'field-error', role: a.valid ? null : 'alert', text: status }));
  controls.mnemonic.setAttribute('aria-invalid', String(!a.valid));

  const custom = f.preset === 'custom';
  controls.indexLabel.hidden = custom;
  controls.pathLabel.hidden = !custom;
  controls.index.setAttribute('aria-invalid', String(!read.index.ok));
  controls.path.setAttribute('aria-invalid', String(!read.path.ok));
  let error = null;
  if (!custom && !read.index.ok) {
    if (read.index.error === 'notInteger') error = I.indexError.notInteger(read.index.text);
    else if (read.index.error === 'range') error = I.indexError.range(view.INDEX_MAX);
    else error = I.indexError.empty;
  } else if (custom && !read.path.ok) {
    error = I.pathError[read.path.error];
  }
  fill(
    regions.pathHelp,
    h('p', { id: 'path-help', class: error ? 'field-error' : 'note', role: error ? 'alert' : null, text: error || (custom ? I.pathHint : I.indexHint(view.INDEX_MAX)) }),
  );
  fill(regions.stale, read.valid ? null : h('p', { class: 'stale', role: 'status', text: I.stale }));
  const isTest = view.isTestInput(f);
  fill(
    regions.badge,
    h(
      'p',
      { class: isTest ? 'badge-line is-task' : 'badge-line is-custom' },
      h('span', { text: isTest ? I.testBadge(hw.TEST_ACCOUNTS[0].address) : I.customBadge }),
      isTest ? null : h('button', { type: 'button', class: 'btn alt', text: I.restore, onclick: () => changeFields(view.TEST_INPUTS, true) }),
    ),
  );
}

// --- 1.2 BIP-39 -------------------------------------------------------------------

function updateBip39(read) {
  const B = text.bip39;
  const analysis = read.analysis;
  const rows = view.wordRows(analysis);
  const groups = view.bitGroups(analysis);
  const hidden = analysis.count - rows.length;
  fill(
    regions.bip39,
    subtitle(B.wordsTitle),
    rows.length
      ? h(
        'div',
        { class: 'scroll' },
        table(
          'compact words',
          [B.cols.position, B.cols.word, B.cols.index, B.cols.bits],
          rows.map((r) => ({
            class: r.index === null ? 'is-unknown' : null,
            cells: [{ text: String(r.position) }, { text: r.word }, { text: r.index === null ? '-' : String(r.index) }, { text: r.bits === null ? B.notInList : r.bits }],
          })),
        ),
      )
      : null,
    hidden > 0 ? h('p', { class: 'note', text: B.moreWords(hidden) }) : null,
    groups.length
      ? [
        subtitle(B.bitsTitle(analysis.bits.length - analysis.checksum.length, analysis.checksum.length)),
        h('p', { class: 'bits-line' }, groups.map((g) => h('span', null, g.entropy, g.checksum ? h('mark', { text: g.checksum }) : null))),
        value(B.entropyLabel(analysis.entropy.length * 8), hex(analysis.entropy)),
        value(B.hashLabel, view.entropyHash(analysis)),
        check(analysis.valid, analysis.valid ? B.checksumOk(analysis) : B.checksumBad(analysis)),
      ]
      : h('p', { class: 'note', text: B.noBits }),
  );
}

// --- La pipeline calcolata: 1.2 (seed) - 1.7 ------------------------------------------

function updatePipeline() {
  const pipeline = currentPipeline();
  updateFlow(pipeline);
  fill(regions.seed, staleNote(), value(text.bip39.seedLabel(pipeline.passphrase !== ''), hex(pipeline.seed)));
  updateBip32(pipeline);
  updateBip44(pipeline);
  updateSecp(pipeline);
  updateKeccak(pipeline);
  updateEip55(pipeline);
}

function updateBip32(pipeline) {
  const B = text.bip32;
  const leak = view.leakDemo(pipeline);
  const parent = view.parentPath(pipeline);
  fill(
    regions.bip32,
    subtitle(B.levelsTitle),
    staleNote(),
    table(
      'discussion levels',
      [B.cols.path, B.cols.kind, B.cols.data, B.cols.key, B.cols.chain],
      view.levelRows(pipeline).map((r) => ({
        cells: [
          { head: true, node: h('code', { text: r.path }) },
          { text: B.kinds[r.kind] },
          { node: h('code', { text: view.shortHex(r.data, 6) }) },
          { node: h('code', { text: view.shortHex(r.key, 6) }) },
          { node: h('code', { text: view.shortHex(r.chainCode, 6) }) },
        ],
      })),
    ),
    subtitle(B.extendedTitle),
    value(B.xprv(pipeline.path), pipeline.extended.xprv),
    value(B.xpub(pipeline.path), pipeline.extended.xpub),
    parent ? value(B.parentXpub(parent), pipeline.extended.parentXpub) : null,
    h('p', { class: 'note', text: B.extendedNote }),
    subtitle(B.leakTitle),
    leak.applicable ? paras(B.leak(leak)) : h('p', { text: leak.reason === 'master' ? B.leakMaster : B.leakHardened }),
  );
}

function updateBip44(pipeline) {
  const B = text.bip44;
  const levels = view.bip44Levels(pipeline.levels);
  fill(
    regions.bip44,
    subtitle(B.levelsTitle(pipeline.path)),
    staleNote(),
    levels.standard
      ? h('ul', { class: 'roles' }, levels.rows.map((r) => h('li', null, h('code', { text: r.label }), ` ${B.roles[r.role](r.value)}`)))
      : h('p', { text: B.notStandard(pipeline.path) }),
    subtitle(B.compareTitle),
    h('p', { text: B.compareIntro(view.COMPARISON_ACCOUNTS) }),
    table(
      'discussion compare',
      [B.cols.wallet, B.cols.path, B.cols.address],
      cache.comparison.map((r) => {
        const known = view.testAccount(r.address);
        return {
          class: r.path === pipeline.path ? 'is-current' : null,
          cells: [
            { head: true, text: B.presetNames[r.preset] },
            { node: h('code', { text: r.path }) },
            { node: h('span', null, h('code', { text: r.address }), known ? h('span', { class: 'note', text: ` (${B.testMark} ${known.index + 1})` }) : null) },
          ],
        };
      }),
    ),
  );
}

function constantsBlock() {
  const C = text.secp;
  const params = view.curveParameters();
  return h('details', { class: 'details' }, h('summary', { text: C.constantsTitle }), ['p', 'n', 'Gx', 'Gy'].map((key) => value(C.constants[key], params[key])));
}

function updateSecp(pipeline) {
  const C = text.secp;
  const checks = view.curveChecks(pipeline);
  fill(
    regions.secp,
    subtitle(C.keyTitle),
    staleNote(),
    value(C.keyLabel, hex(pipeline.privateKey)),
    check(checks.keyInRange, C.keyCheck(checks.keyInRange)),
    value(C.xLabel, checks.x),
    value(C.yLabel, checks.y),
    check(checks.onCurve, C.onCurve(checks.onCurve)),
    subtitle(C.encodingsTitle),
    value(C.uncompressed, hex(pipeline.publicKey.uncompressed)),
    value(C.compressed(checks.even), hex(pipeline.publicKey.compressed)),
    value(C.ethereumForm, hex(pipeline.address.xy)),
    check(checks.decodes, C.decompress(checks.decodes)),
  );
}

function updateKeccak(pipeline) {
  const K = text.keccak;
  const parts = view.hashParts(pipeline);
  fill(
    regions.keccak,
    staleNote(),
    value(K.inputLabel, hex(pipeline.address.xy)),
    value(K.hashLabel, [h('span', { class: 'dropped', text: parts.dropped }), h('mark', { text: parts.kept })]),
    value(K.addressLabel, pipeline.address.address),
    value(K.sha3Label, parts.sha3, 'is-muted'),
  );
}

function updateEip55(pipeline) {
  const E = text.eip55;
  const c = pipeline.checksum;
  const letters = c.chars.filter((ch) => ch.letter).length;
  const result = h('div');
  const checker = h('input', {
    type: 'text',
    ...PRIVATE_FIELD,
    maxlength: view.ADDRESS_MAX_LENGTH,
    'aria-describedby': 'checker-result',
    oninput: (e) => showCheck(e.target.value.slice(0, view.ADDRESS_MAX_LENGTH)),
  });
  checker.value = c.address;
  function showCheck(typed) {
    const r = view.checkTypedAddress(typed, c.address);
    let message;
    let className = 'check';
    if (r.status === 'format') {
      message = E.check.format;
      className = 'check is-bad';
    } else if (r.status === 'valid') {
      message = E.check.valid(r.same);
      if (r.same) className = 'check is-ok';
    } else if (r.status === 'noChecksum') {
      message = E.check.noChecksum(r.same);
    } else {
      message = E.check.invalid(r.same, r.positions);
      className = 'check is-bad';
    }
    fill(result, h('p', { id: 'checker-result', class: className, 'aria-live': 'polite', text: message }));
  }
  showCheck(c.address);
  fill(
    regions.eip55,
    subtitle(E.gridTitle),
    staleNote(),
    h(
      'div',
      { class: 'grid', role: 'img', 'aria-label': `${E.resultLabel}: ${c.address}` },
      c.chars.map((ch, i) => h(
        'span',
        { class: ch.letter ? (ch.upper ? 'is-upper' : 'is-lower') : 'is-digit' },
        h('b', { text: ch.upper ? ch.char.toUpperCase() : ch.char }),
        h('small', { text: c.hash[i] }),
      )),
    ),
    h('p', { class: 'note', text: E.gridLegend }),
    value(E.hashLabel, c.hash),
    value(E.resultLabel, c.address),
    h('p', { text: E.letters(letters) }),
    subtitle(E.checkerTitle),
    h('div', { class: 'controls' }, h('label', { class: 'checker' }, h('span', { text: E.checkerLabel }), checker)),
    h('p', { class: 'note', text: E.checkerHint }),
    result,
  );
}

// --- 1.8 Vettori di test e 1.9 Wallet ---------------------------------------------------

function updateVectors() {
  const V = text.verify;
  const W = text.wallets;
  const result = computed.vectors;
  const rows = result && result.value ? result.value : [];
  if (!result) fill(regions.vectors, pending());
  else if (result.error) fill(regions.vectors, failure(result.error));
  else {
    const ok = rows.filter((r) => r.ok).length;
    fill(
      regions.vectors,
      h('p', { class: ok === rows.length ? 'check is-ok' : 'check is-bad' }, h('strong', { text: V.summary(ok, rows.length) })),
      h(
        'details',
        { class: 'details' },
        h('summary', { text: V.details(rows.length) }),
        view.vectorGroups(rows).map((g) => [
          subtitle(V.groups[g.group]),
          table(
            'discussion vectors',
            [V.cols.check, V.cols.expected, V.cols.result],
            g.rows.map((r) => ({
              cells: [
                { head: true, text: V.label(r) },
                { node: h('code', { text: r.expected }) },
                { class: r.ok ? 'is-ok' : 'is-bad', node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }) },
              ],
            })),
          ),
        ]),
      ),
    );
  }
  fill(
    regions.wallets,
    subtitle(W.tableTitle),
    table(
      'discussion accounts',
      [W.cols.account, W.cols.path, W.cols.address, W.cols.check],
      hw.TEST_ACCOUNTS.map((a) => {
        const path = hw.pathFor('bip44', a.index);
        const row = rows.find((r) => r.check === 'address' && r.subject === path);
        let mark = '...';
        if (row) mark = row.ok ? '✓' : '✗';
        return {
          cells: [
            { head: true, text: W.accountName(a.index) },
            { node: h('code', { text: path }) },
            { node: h('code', { text: a.address }) },
            { class: row && !row.ok ? 'is-bad' : 'is-ok', text: mark },
          ],
        };
      }),
    ),
    h('p', { class: 'note', text: W.verified }),
  );
}

// ---------------------------------------------------------------------------
// 2. Le cinque categorie
// ---------------------------------------------------------------------------

function categoriesSection() {
  const C = text.categories;
  return h(
    'section',
    { class: 'section' },
    title('hw2-categories', 0, text.sections.categories),
    h('p', { text: C.intro }),
    table(
      'discussion categories',
      [C.cols.category, C.cols.what, C.cols.where, C.cols.properties],
      C.rows.map((row) => ({ cells: [{ head: true, text: row.name }, { text: row.what }, { text: row.where }, { text: row.properties }] })),
    ),
    paras(C.after),
  );
}

// ---------------------------------------------------------------------------
// 3. Le proprieta' statistiche
// ---------------------------------------------------------------------------

function statsSection() {
  regions.stats = h('div');
  return h('section', { class: 'section' }, title('hw2-stats', 0, text.sections.stats), paras(text.stats.intro), regions.stats);
}

function testRow(label, test) {
  const rejected = test.verdict === 'reject';
  const status = rejected ? 'is-invalid' : 'is-valid';
  return h(
    'div',
    { class: `test ${status}` },
    h('p', { class: 'test-head' }, h('strong', { text: label }), ' ', h('span', { class: `badge ${status}`, text: text.stats.verdict[rejected ? 'reject' : 'notReject'] })),
    h('p', { text: text.stats.testLine(test) }),
  );
}

const tests = (section, s) => h('div', { class: 'tests' }, view.statTests(s)[section].map(([key, test]) => testRow(text.stats.labels[section][key], test)));

function updateStats() {
  const result = computed.stats;
  const titles = view.STAT_SECTIONS.map(({ id, title: key }) => title(id, 1, text.sections[key]));
  const summaryTitle = title('hw2-stats-summary', 1, text.sections.statsSummary);
  if (!result || result.error) {
    // i titoli ci sono sempre, cosi' l'indice trova le sezioni anche durante il calcolo
    const status = () => (result ? failure(result.error) : pending());
    fill(regions.stats, titles.map((t) => [t, status()]), summaryTitle, status());
    updateConclusion();
    return;
  }
  const s = result.value;
  const T = text.stats;
  const F = text.fmt;
  const data = view.chartData(s, { decimal: F.decimal, axes: T.axes });
  const tips = view.chartTips(s, data, T.tips);
  const summary = view.testSummary(s);
  const smallest = summary.smallest;
  fill(
    regions.stats,
    titles[0],
    h('p', { text: T.bip39.intro }),
    figure(T.bip39.wordsChart(s.bip39.words.test.N, s.samples.mnemonics), hw.drawBarChart, data.words, true, tips.words),
    h('div', { class: 'charts' }, figure(T.bip39.nibbleChart(s.samples.mnemonics), hw.drawBarChart, data.nibble, false, tips.nibble)),
    tests('bip39', s),
    paras(T.bip39.explain(s)),

    titles[1],
    h('p', { text: T.seed.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(T.seed.bitsChart(s.seed.bits.N), hw.drawBarChart, data.seedBits, false, tips.seedBits),
      figure(T.seed.distanceChart(s.seed.avalanche, data.seedDistances), hw.drawBarChart, data.seedDistances, false, tips.seedDistances),
    ),
    tests('seed', s),
    paras(T.seed.explain(s)),

    titles[2],
    h('p', { text: T.bip32.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(T.bip32.bitsChart(s.bip32.bits.N), hw.drawBarChart, data.keyBits, false, tips.keyBits),
      figure(T.bip32.distanceChart(s.bip32.siblings, data.siblings), hw.drawBarChart, data.siblings, false, tips.siblings),
    ),
    figure(T.bip32.heatmap(s.bip32.correlation), hw.drawHeatmap, data.correlation, true, tips.correlation),
    tests('bip32', s),
    paras(T.bip32.explain(s)),

    titles[3],
    h('p', { text: T.secp.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(T.secp.xChart(s.secp256k1.bitsX.N), hw.drawBarChart, data.xBits, false, tips.xBits),
      figure(T.secp.yChart(s.secp256k1.bitsY.N), hw.drawBarChart, data.yBits, false, tips.yBits),
    ),
    figure(T.secp.distanceChart(s.secp256k1.avalanche, data.pointDistances), hw.drawBarChart, data.pointDistances, false, tips.pointDistances),
    tests('secp256k1', s),
    h('p', { class: 'structure', text: T.secp.homomorphism(s.secp256k1.homomorphism) }),
    paras(T.secp.explain(s)),

    titles[4],
    h('p', { text: T.keccak.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(T.keccak.bitsChart(s.keccak.addressBits.N), hw.drawBarChart, data.addressBits, false, tips.addressBits),
      figure(T.keccak.hexChart(s.keccak.firstHex.test.N), hw.drawBarChart, data.firstHex, false, tips.firstHex),
    ),
    figure(T.keccak.distanceChart(s.keccak.avalanche, data.keccakDistances), hw.drawBarChart, data.keccakDistances, false, tips.keccakDistances),
    figure(T.keccak.heatmap, hw.drawHeatmap, data.sac, true, tips.sac),
    tests('keccak', s),
    paras(T.keccak.explain(s)),

    titles[5],
    h('p', { text: T.eip55.intro }),
    figure(T.eip55.lettersChart(s.eip55.letters.test.N), hw.drawBarChart, data.letters, false, tips.letters),
    tests('eip55', s),
    paras(T.eip55.explain(s)),

    summaryTitle,
    h('p', { text: T.summary.intro(summary, `${T.steps[smallest.section]}: ${T.labels[smallest.section][smallest.key]}`) }),
    table(
      'discussion summary-tests',
      [T.summary.cols.step, T.summary.cols.hypothesis, T.summary.cols.p, T.summary.cols.verdict],
      summary.all.map((t) => {
        const rejected = t.result.verdict === 'reject';
        return {
          class: rejected ? 'is-rejected' : null,
          cells: [
            { head: true, text: T.steps[t.section] },
            { text: T.labels[t.section][t.key] },
            { text: F.pval(t.result.pValue) },
            { text: T.verdict[rejected ? 'reject' : 'notReject'] },
          ],
        };
      }),
    ),
    h('p', { class: 'structure', text: T.secp.homomorphism(s.secp256k1.homomorphism) }),
    paras(T.summary.after),
  );
  updateConclusion();
}

// ---------------------------------------------------------------------------
// 4. Contesto storico e 5. Discussione
// ---------------------------------------------------------------------------

function historySection() {
  const H = text.history;
  const digests = view.emptyDigests();
  return h(
    'section',
    { class: 'section' },
    title('hw2-history', 0, text.sections.history),
    title('hw2-timeline', 1, text.sections.timeline),
    h('p', { text: H.intro }),
    h('p', { class: 'legend' }, h('span', { class: 'legend-task', text: H.legend.task }), h('span', { class: 'legend-context', text: H.legend.context })),
    h(
      'ol',
      { class: 'timeline' },
      H.events.map((e) => h('li', { class: e.task ? 'is-task' : 'is-context' }, h('span', { class: 'year', text: e.year }), h('div', null, h('strong', { text: e.title }), h('p', { text: e.text })))),
    ),
    h('p', { text: H.after }),
    title('hw2-sha', 1, text.sections.sha),
    h('p', { text: H.sha.intro }),
    h(
      'table',
      { class: 'table discussion sha' },
      h('thead', null, h('tr', null, H.sha.cols.map((c) => h('th', { text: c })))),
      h('tbody', null, H.sha.rows.map((row) => h('tr', null, h('th', { text: row[0] }), row.slice(1).map((cell, i) => h('td', { 'data-label': H.sha.cols[i + 1], text: cell }))))),
    ),
    subtitle(H.sha.digestsTitle),
    value(H.sha.digestLabel('Keccak-256'), digests.keccak),
    value(H.sha.digestLabel('SHA3-256'), digests.sha3),
    paras(H.sha.paras),
  );
}

function discussionSection() {
  const D = text.discussion;
  regions.conclusion = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw2-discussion', 0, text.sections.discussion),
    title('hw2-why', 1, text.sections.why),
    h('p', { text: D.why.intro }),
    table(
      'discussion why',
      [D.why.cols.parts, D.why.cols.purpose, D.why.cols.instead],
      D.why.rows.map((row) => ({ cells: [{ head: true, text: row.parts }, { text: row.purpose }, { text: row.instead }] })),
    ),
    paras(D.why.after),
    title('hw2-fit', 1, text.sections.fit),
    paras(D.fit),
    title('hw2-conclusion', 1, text.sections.conclusion),
    regions.conclusion,
  );
}

function updateConclusion() {
  const result = computed.stats;
  const summary = result && result.value ? view.testSummary(result.value) : null;
  fill(regions.conclusion, paras(text.discussion.conclusion(summary)));
}

// ---------------------------------------------------------------------------
// Calcoli lunghi: vettori di test ed esplorazione statistica
// ---------------------------------------------------------------------------

const message = (error) => (error instanceof Error ? error.message : String(error));

function startComputations() {
  // i vettori dopo il primo disegno della pagina: sette PBKDF2 da 2048 iterazioni
  setTimeout(() => {
    try {
      computed.vectors = { value: hw.verifyVectors() };
    } catch (error) {
      computed.vectors = { error: message(error) };
    }
    updateVectors();
  }, 50);
  // l'esplorazione a fette di pochi millisecondi, senza bloccare la pagina
  hw.exploreAsync().then(
    (value) => {
      computed.stats = { value };
      updateStats();
    },
    (error) => {
      computed.stats = { error: message(error) };
      updateStats();
    },
  );
}

// ---------------------------------------------------------------------------
// Indice, lingua e avvio
// ---------------------------------------------------------------------------

const dialog = document.getElementById('index-dialog');
const FOLLOW_MS = 2500;

// Porta il titolo in cima e lo segue per un paio di secondi: se nel
// frattempo qualcosa sopra cambia altezza (una statistica che finisce di
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
  document.title = 'Homework #2 - Statistics';
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
  text = HW2_TEXTS[state.lang];
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), pipelineSection(), categoriesSection(), statsSection(), historySection(), discussionSection(), toTopButton());
  const read = view.readInputs(state.fields);
  regions.pipeline.classList.toggle('is-stale', !read.valid);
  updateInputs(read);
  updateBip39(read);
  updatePipeline();
  updateVectors();
  updateStats();
}

function boot() {
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.addEventListener('click', () => {
      if (button.dataset.lang === state.lang) return;
      state.lang = LANGUAGES.includes(button.dataset.lang) ? button.dataset.lang : 'it';
      try {
        window.localStorage.setItem('hw2-lang', state.lang);
      } catch {
        // la scelta vale solo per questa visita
      }
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
  darkQuery.addEventListener('change', redrawAll);
  render();
  startComputations();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
})();
