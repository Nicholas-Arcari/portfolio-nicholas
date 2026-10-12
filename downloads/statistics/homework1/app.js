/*
 * Homework #1 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Interface and texts (Italian and English). Needs homework1.js, loaded first.
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-1
 */

(function () {
'use strict';

var view$ = (function () {
'use strict';

// src/pages/statistics/hw1/view.js
// Logica di presentazione condivisa fra la pagina del sito (React) e il
// programma scaricabile (DOM puro): quali sezioni esistono, come si legge il
// campo k, come si classifica la validita' di un test, quali dati vanno nei
// grafici. Tenerla qui impedisce che le due versioni dicano cose diverse
// sugli stessi numeri.
const hw = Homework1;

/** The six statistical analyses, in the order the assignment lists them. */
const ANALYSES = ['distribution', 'frequency', 'bits', 'uniformity', 'correlation', 'avalanche'];

const analysisSections = (prefix) => ANALYSES.map((key) => ({ id: `${prefix}-${key}`, key, level: 2 }));

/** The sections of the homework, in page order: ids for the anchors, keys for the titles. */
const SECTIONS = [
  { id: 'hw1-assignment', key: 'assignment', level: 0 },
  { id: 'hw1-task', key: 'task', level: 0 },
  { id: 'hw1-setup', key: 'setup', level: 1 },
  { id: 'hw1-addition', key: 'addition', level: 1 },
  { id: 'hw1-multiples', key: 'multiples', level: 1 },
  { id: 'hw1-fast', key: 'fast', level: 1 },
  { id: 'hw1-public-key', key: 'publicKey', level: 1 },
  { id: 'hw1-guru', key: 'guru', level: 0 },
  { id: 'hw1-stats', key: 'stats', level: 0 },
  { id: 'hw1-stats-task', key: 'statsTask', level: 1 },
  ...analysisSections('hw1-stats-task'),
  { id: 'hw1-stats-ext', key: 'statsExt', level: 1 },
  ...analysisSections('hw1-stats-ext'),
  { id: 'hw1-discussion', key: 'discussion', level: 0 },
  { id: 'hw1-discussion-definitions', key: 'definitions', level: 1 },
  { id: 'hw1-discussion-properties', key: 'properties', level: 1 },
  { id: 'hw1-discussion-inversion', key: 'inversion', level: 1 },
  { id: 'hw1-discussion-conclusion', key: 'conclusion', level: 1 },
];

/** The entries of the index, with their titles in the chosen language. */
const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

/** Curves small enough to animate and to list every point of. */
const VIZ_PRIMES = [17, 97];

/** Rows of the table G, 2G, ..., kG: beyond this the page points to double-and-add. */
const LIST_LIMIT = 64;

const K_MAX = 999;

/** Longest text the k field accepts: enough for K_MAX and a few stray characters to complain about. */
const K_INPUT_MAX_LENGTH = 12;

/**
 * Reads the private key typed by the user. Only plain decimal digits are
 * accepted: "6.9", "1e3", "-5" or "0x1F" are errors to show, never numbers
 * to guess.
 */
function parseK(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'notInteger' };
  const k = Number(t);
  if (!Number.isSafeInteger(k) || k < 1 || k > K_MAX) return { ok: false, error: 'range' };
  return { ok: true, value: k };
}

/**
 * Status of a test result:
 *   'na'          not computable (fewer than two observations, or every
 *                 possible value present, so nothing left to test)
 *   'invalid'     computed, but its assumptions fail (too few expected
 *                 observations per class, or repeated, dependent values)
 *   'descriptive' exact, but the data are the whole population, not a
 *                 random sample: the p-value describes
 *   'valid'       a proper test
 */
function testStatus(test) {
  if (!test || !test.computable) return 'na';
  const r = test.reasons;
  if (r.includes('small-sample') || r.includes('duplicates')) return 'invalid';
  if (r.includes('exhaustive')) return 'descriptive';
  return 'valid';
}

/**
 * What the page shows for one uniformity test: its status, the numbers, the
 * reasons behind the status and the reading. U is the uniformity part of
 * the texts in the chosen language.
 */
function uniformityBlock(test, u, s, label, U) {
  const status = testStatus(test);
  let verdict = null;
  if (test.computable) verdict = status === 'invalid' ? U.noVerdict : U.verdict(test);
  return {
    label,
    status,
    statusLabel: U.status[status],
    help: U.statusHelp[status],
    line: test.computable ? U.line(test) : null,
    reasons: test.reasons.map((r) => U.reasons[r](test, u, s)),
    verdict,
  };
}

/** The two avalanche tests, naive and exact, in the same form; A and U are the avalanche and uniformity texts. */
function avalancheBlocks(s, A, U) {
  const a = s.avalanche;
  if (!a.measurements) return [];
  const exactStatus = a.exact.pValue === null ? 'na' : 'descriptive';
  return [
    {
      label: A.naiveLabel,
      status: 'invalid',
      statusLabel: U.status.invalid,
      help: U.statusHelp.invalid,
      line: A.naiveLine(a),
      reasons: A.naiveReasons(s),
      verdict: U.noVerdict,
    },
    {
      label: A.exactLabel,
      status: exactStatus,
      statusLabel: U.status[exactStatus],
      help: U.statusHelp[exactStatus],
      line: a.exact.pValue === null ? null : A.exactLine(a),
      reasons: A.exactReasons(s),
      verdict: a.exact.pValue === null ? null : A.exactVerdict(s),
    },
  ];
}

/** Prime factorization: 18 -> [[2, 1], [3, 2]]. */
function factorize(n) {
  const factors = [];
  let m = n;
  for (let d = 2; d * d <= m; d++) {
    let e = 0;
    while (m % d === 0) {
      m /= d;
      e++;
    }
    if (e) factors.push([d, e]);
  }
  if (m > 1) factors.push([m, 1]);
  return factors;
}

const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const superscript = (e) => String(e).split('').map((d) => SUPERSCRIPT[Number(d)]).join('');

/** 18 -> "2 · 3²". */
const formatFactors = (n) => factorize(n).map(([q, e]) => (e === 1 ? String(q) : `${q}${superscript(e)}`)).join(' · ');

/**
 * What the discussion needs to know about a curve: its number of points and
 * whether it falls in a known weak family. For p > 3 a curve is
 * supersingular exactly when it has p + 1 points (trace 0, which Hasse's
 * bound forces), and anomalous when it has p points.
 */
function curveFacts(curve) {
  const order = hw.groupOrder(curve);
  return {
    p: curve.p,
    order,
    prime: hw.isPrime(order),
    supersingular: order === curve.p + 1,
    anomalous: order === curve.p,
  };
}

/** Number of observations when every point of the curve is used as base point. */
const pooledSize = (curve) => hw.curvePoints(curve).reduce((s, P) => s + hw.pointOrder(P, curve) - 1, 0);

/** The options of a base-point selector: every point of a small curve, a sample of a large one. */
function basePointOptions(curve, { pooled = false, sample = 8 } = {}) {
  const points = hw.curvePoints(curve);
  const first = hw.defaultBasePoint(curve);
  const list = points.length <= 200 ? points : [first, ...points.filter((P) => !hw.samePoint(P, first)).slice(0, sample - 1)];
  const options = list.map((P) => ({
    value: `${P.x},${P.y}`,
    point: P,
    order: hw.pointOrder(P, curve),
    isDefault: hw.samePoint(P, first),
  }));
  return pooled ? [{ value: 'pooled', point: null, order: null, isDefault: false }, ...options] : options;
}

/** "3,7" -> { x: 3, y: 7 }; "pooled" stays as it is. */
const parseBase = (value) => {
  if (value === 'pooled') return 'pooled';
  const [x, y] = String(value).split(',').map(Number);
  return { x, y };
};

/** Bits of x and of y whose share of ones is more than 3 standard errors from the expected one. */
const bitsBeyond = (s) => [...s.bits.x, ...s.bits.y].filter((b) => b.z !== null && Math.abs(b.z) > 3).length;

/** The bit with the largest |z| among those of one coordinate. */
const worstBit = (bits) =>
  bits.reduce((m, b) => (b.z !== null && (m === null || Math.abs(b.z) > Math.abs(m.z)) ? b : m), null);

/** Labels of the histogram classes: the first value of each class. */
const binLabels = (p, bins) => Array.from({ length: bins }, (_, j) => String(Math.ceil((j * p) / bins)));

const round2 = (v) => Number(v.toPrecision(2));

/**
 * Colour scale of the bit-correlation heatmap: +-4/sqrt(N), so that a cell
 * at the 3-sigma threshold is already clearly coloured and pure noise stays
 * pale, whatever the number of observations.
 */
const correlationRange = (N) => round2(Math.min(1, 4 / Math.sqrt(Math.max(1, N))));

/** One row per value of [0, p): how many times it occurs as x and as y. */
const frequencyRows = (s) => s.freqX.map((x, v) => ({ v, x, y: s.freqY[v] }));

/** Largest p for which the page lists the frequency of every value in a table. */
const FREQUENCY_TABLE_MAX_P = 97;

/**
 * The data of every chart and heatmap of one statistical exploration.
 * `decimal` is the decimal separator of the axis labels and legends.
 */
function chartData(s, { kBits = 'k', flipBits = 'k', decimal = '.' } = {}) {
  const labels = binLabels(s.p, s.histogram.bins);
  const values = Array.from({ length: s.p }, (_, v) => String(v));
  const bitLabels = Array.from({ length: s.bitLength }, (_, i) => String(i));
  const bits = (list) => ({ values: list.map((b) => b.fraction ?? 0), expected: list.map((b) => b.expected), labels: bitLabels, max: 1, decimal });
  const a = s.avalanche;
  return {
    histX: { values: s.histogram.x, expected: s.histogram.expected, labels, decimal },
    histY: { values: s.histogram.y, expected: s.histogram.expected, labels, decimal },
    freqX: { values: s.freqX, expected: s.N / s.p, labels: values, decimal },
    freqY: { values: s.freqY, expected: s.N / s.p, labels: values, decimal },
    bitsX: bits(s.bits.x),
    bitsY: bits(s.bits.y),
    distances: { values: a.distances, expected: a.expectedDistances, labels: a.distances.map((_, d) => String(d)), decimal },
    correlation: {
      values: s.correlation.bits.values,
      range: correlationRange(s.N),
      split: s.bitLength,
      rowLabel: kBits,
      colLabels: ['x', 'y'],
      decimal,
    },
    // the avalanche matrix as z-scores against the reference functions of the exact test
    sac: {
      values: a.exact.z,
      range: 4,
      split: s.bitLength,
      rowLabel: flipBits,
      colLabels: ['x', 'y'],
      decimal,
    },
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

return { ANALYSES, SECTIONS, tocEntries, VIZ_PRIMES, LIST_LIMIT, K_MAX, K_INPUT_MAX_LENGTH, parseK, testStatus, uniformityBlock, avalancheBlocks, factorize, formatFactors, curveFacts, pooledSize, basePointOptions, parseBase, bitsBeyond, worstBit, binLabels, correlationRange, frequencyRows, FREQUENCY_TABLE_MAX_P, chartData, scheduleFrameJob };
})();

var texts$ = (function () {
'use strict';

// src/pages/statistics/hw1/texts.js
// I testi dell'Homework #1 in italiano e in inglese. Li usano sia la pagina
// del sito sia il programma scaricabile, cosi' le due versioni dicono le
// stesse cose con le stesse parole. I parametri della consegna arrivano da
// TASK e ogni numero delle analisi dagli argomenti: nessuna frase contiene
// "17" o "(1, 5)" scritti a mano, e cambiando TASK cambia tutto il testo.
const { TASK } = Homework1;
const { bitsBeyond, worstBit } = view$;

const fmtPoint = (P) => (P === null ? 'O' : `(${P.x}, ${P.y})`);

/** Number formatting of one language: decimal separator and "not defined" marker. */
function formatters(decimal, na) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  return {
    na,
    decimal,
    num: (v, digits = 3) => (missing(v) ? na : local((Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits))),
    pval: (v) => (missing(v) ? na : v === 0 ? '0' : v < 0.001 ? local(v.toExponential(1)) : local(v.toFixed(3))),
    pct: (v) => (missing(v) ? na : `${local((100 * v).toFixed(1))}%`),
    short: (v) => (missing(v) ? na : local(String(v))),
  };
}

/** Binary digits 1 at the end of p: the low bits that y and p - y always have complementary. */
const trailingOnes = (p) => {
  let t = 0;
  for (let q = p; q & 1; q >>>= 1) t++;
  return t;
};

/** "1 cella", "2 celle": a count with its noun in the right number. */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * The assignment as the professor wrote it, block by block. The curve, the
 * base point and the key come from TASK, the same constant the program uses:
 * the quotation and the computation cannot drift apart.
 */
const originalAssignment = (task = TASK) => [
  { type: 'title', text: 'HMWK 1 - Example App: Public-Key Cryptography PRIVATE KEY → PUBLIC KEY in Ethereum' },
  {
    type: 'p',
    text: 'Notes: Elliptic-curve scalar multiplication can be viewed as a cryptographic one-way function. It is deterministic and easy to compute in the forward direction: private key k → public key Q = kG while recovering k from Q is computationally difficult. It therefore shares some properties with cryptographic hash functions, but it is based on the Elliptic Curve Discrete Logarithm Problem (ECDLP) and is used for public-key cryptography and digital signatures.',
  },
  { type: 'p', text: 'The goal is to understand the basic idea of elliptic-curve scalar multiplication, not to implement a real cryptographic system.' },
  { type: 'heading', text: 'TASK' },
  {
    type: 'p',
    text: 'Write a small JavaScript/html/css program showing how a private key can be used to generate a public key using elliptic-curve scalar multiplication. (In Ethereum, the relevant elliptic curve is secp256k1).',
  },
  {
    type: 'lines',
    lines: [
      `Hints: For this exercise, use a small toy curve: y² = x³ + ${task.b} (mod ${task.p})`,
      `For example, use for instance the following base point: G = ${fmtPoint(task.G)} Choose for instance a small private key: k = ${task.k}`,
      'The public key is: Q = kG  Define the toy curve and the base point G. Define the private key k.',
      'Implement the basic point-addition operation. Compute and print: G, 2G, 3G, ..., kG. Or use  afaster method for a larger k.',
      'Print the final point as the TOY PUBLIC KEY.',
    ],
  },
  { type: 'p', text: 'OPTIONAL-GURU LEVEL :-)  Make a slown-down visual representation of the algo (may use the canvas or SVG, whatever you like better)' },
  { type: 'heading', text: '== STATISTICAL EXPLORATION ==' },
  { type: 'p', text: 'Repeat the experiment with different values of k and, if useful, different valid base points.' },
  { type: 'p', text: 'Explore simple statistical properties of the resulting points, for example:' },
  {
    type: 'list',
    items: [
      'distribution of x and y coordinates;',
      'frequency of individual values;',
      'distribution of bits;',
      'apparent uniformity;',
      'correlations between input and output;',
      'possible avalanche-like behaviour.',
    ],
  },
  {
    type: 'p',
    text: 'Discuss which of these properties are meaningful for a cryptographic one-way function and which are properties specifically associated with cryptographic hash functions.',
  },
];

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', 'n/d');

const it = {
  fmt: IT,
  ui: {
    index: 'Indice',
    indexTitle: 'Indice dell’homework',
    close: 'Chiudi',
    computing: 'Calcolo in corso...',
    language: 'Lingua',
    error: (m) => `Errore: ${m}`,
  },
  sections: {
    assignment: '0. La consegna',
    task: '1. TASK: dalla chiave privata alla chiave pubblica',
    setup: '1.1 Curva giocattolo, punto base e chiave privata',
    addition: '1.2 La somma di punti',
    multiples: '1.3 G, 2G, 3G, ..., kG',
    fast: '1.4 Un metodo più rapido per k grandi: double-and-add',
    publicKey: '1.5 La TOY PUBLIC KEY',
    guru: '2. OPTIONAL - GURU LEVEL: l’algoritmo al rallentatore',
    stats: '3. STATISTICAL EXPLORATION',
    statsTask: '3.1 Sulla curva della consegna',
    distribution: 'a. Distribuzione delle coordinate x e y',
    frequency: 'b. Frequenza dei singoli valori',
    bits: 'c. Distribuzione dei bit',
    uniformity: 'd. Uniformità apparente',
    correlation: 'e. Correlazioni fra ingresso e uscita',
    avalanche: 'f. Effetto valanga',
    statsExt: '3.2 Estensione: curve giocattolo più grandi',
    discussion: '4. Discussione: funzione a senso unico o funzione di hash?',
    definitions: '4.1 Definizioni',
    properties: '4.2 Le sei proprietà, una per una',
    inversion: '4.3 Invertire Q: perché la chiave giocattolo non è a senso unico',
    conclusion: '4.4 Conclusioni',
  },
  assignment: {
    intro: (task) => [
      'In Ethereum la chiave privata è un intero k scelto a caso fra 1 e n - 1, dove n ≈ 2^256 è l’ordine del punto base, e la chiave pubblica è il punto Q = kG della curva ellittica secp256k1, y² = x³ + 7 su un campo primo di 256 bit. Calcolare Q a partire da k è veloce; risalire a k partendo da Q è il problema del logaritmo discreto su curva ellittica (ECDLP), per cui non si conosce alcun algoritmo efficiente.',
      `La consegna chiede di mostrarlo su una curva giocattolo con la stessa equazione, y² = x³ + ${task.b} (mod ${task.p}), con punto base G = ${fmtPoint(task.G)} e chiave privata k = ${task.k}. La pagina la segue punto per punto: il TASK (sezione 1), il livello guru facoltativo (sezione 2), l’esplorazione statistica (sezione 3) e la discussione finale (sezione 4). I valori si possono cambiare; quando non sono più quelli della consegna la pagina lo segnala, e un pulsante li ripristina.`,
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese.',
  },
  setup: {
    fieldLabel: 'Campo F_p',
    baseLabel: 'Punto base G',
    keyLabel: 'Chiave privata k',
    orderWord: 'ordine',
    taskTag: 'della consegna',
    taskBadge: (task) => `Valori della consegna: y² = x³ + ${task.b} (mod ${task.p}), G = ${fmtPoint(task.G)}, k = ${task.k}.`,
    customBadge: (task) => `Valori diversi da quelli della consegna, che usa y² = x³ + ${task.b} (mod ${task.p}), G = ${fmtPoint(task.G)} e k = ${task.k}.`,
    restore: 'Ripristina i valori della consegna',
    kHint: (max) => `Un intero da 1 a ${max}.`,
    kError: {
      empty: 'Inserisci la chiave privata k.',
      notInteger: (t) => `"${t}" non è un intero positivo: sono ammesse solo le cifre da 0 a 9.`,
      range: (max) => `k deve essere un intero da 1 a ${max}.`,
      fallback: (k) => `Finché il valore non è valido resta in uso l’ultimo corretto, k = ${k}.`,
    },
    curveSummary: (p, b, count, n) =>
      `La curva y² = x³ + ${b} su F_${p} ha ${count - 1} punti affini più il punto all’infinito O, ${count} punti in tutto. G genera un sottogruppo di ${n} punti: kG dipende solo da k modulo ${n}.`,
    pointsTitle: 'I punti della curva',
    pointsLegend: 'In blu i multipli di G, cioè il sottogruppo che genera; bordati G (arancione) e la chiave pubblica Q (rosso).',
  },
  addition: {
    intro:
      'Il gruppo dei punti si costruisce con la regola della corda e della tangente. Per sommare P = (x1, y1) e Q = (x2, y2) si traccia la retta che li unisce (la tangente se P = Q): incontra la curva in un terzo punto, -R, e la somma è il suo simmetrico rispetto all’asse x, R = P + Q. In formule, modulo p:',
    formulas: (task) => [
      'P ≠ Q:   λ = (y2 - y1) / (x2 - x1)',
      `P = Q:   λ = (3·x1² + a) / (2·y1)        (qui a = ${task.a})`,
      'x3 = λ² - x1 - x2        y3 = λ·(x1 - x3) - y1',
      'P + (-P) = O,   P + O = P        (O: punto all’infinito, elemento neutro)',
    ],
    note: 'Dividere modulo p significa moltiplicare per l’inverso modulare, calcolato con l’algoritmo di Euclide esteso. Le funzioni del programma rifiutano qualunque ingresso che non sia un punto della curva, invece di restituire in silenzio un risultato sbagliato.',
  },
  multiples: {
    intro: 'Come chiede la consegna, ogni riga somma G alla precedente: k - 1 somme di punti. Sotto la tabella, lo stesso calcolo come lo stampa il programma, anche da terminale con node homework1.js.',
    colMultiple: 'Multiplo',
    colPoint: 'Punto',
    colOperation: 'Operazione',
    colLambda: 'λ',
    kinds: {
      start: 'punto di partenza',
      add: 'somma (corda)',
      double: 'raddoppio (tangente)',
      inverse: 'P + (-P) = O (retta verticale)',
      identity: 'O + G = G',
    },
    tooMany: (k, limit) => `Con k = ${k} servirebbero ${k - 1} somme: oltre ${limit} la tabella non le elenca, e il calcolo passa al double-and-add (1.4).`,
    printedTitle: 'Output del programma',
  },
  fast: {
    intro: (k, bits, steps) =>
      `Si scrive k = ${k} in binario, ${bits}, e si leggono i bit da sinistra. Il primo bit, sempre 1, carica R = G; per ogni bit successivo si raddoppia R e, se il bit vale 1, si somma G. Bastano ${steps - 1} operazioni di gruppo invece delle ${k - 1} della somma ripetuta: il costo cresce con il numero di bit di k, non con k. Per una chiave Ethereum di 256 bit sono circa 383 operazioni (255 raddoppi e in media circa 128 somme), invece di circa 2^256.`,
    colBit: 'Bit di k',
    colOperation: 'Operazione',
    colR: 'R',
    colPoint: 'Punto',
    ops: { load: 'R = G', double: 'R = 2R', add: 'R = R + G' },
  },
  publicKey: {
    intro: 'Il punto finale, stampato come chiede la consegna:',
    label: 'TOY PUBLIC KEY',
    infinity:
      'Q = O, il punto all’infinito: k è un multiplo dell’ordine di G. O non è una chiave pubblica valida, ed è per questo che in Ethereum la chiave privata si sceglie fra 1 e n - 1.',
    ethereum:
      'In Ethereum la chiave pubblica è la coppia (x, y) di Q, 64 byte, e l’indirizzo sono gli ultimi 20 byte del suo hash Keccak-256: lo riprende la sezione 4.4.',
  },
  guru: {
    intro:
      'Ogni operazione è disegnata in cinque fasi sulla griglia p × p: i due operandi; la retta che li unisce (la tangente quando si raddoppia), che si avvolge sul quadrato perché tutto è modulo p; il terzo punto in cui la retta incontra la curva, -R; il suo simmetrico R, che è la somma. In grigio i punti della curva, in blu i multipli di G già calcolati. Passo avanza di una fase alla volta.',
    vizNote: (primes) => `L’animazione usa la curva e la chiave scelte in 1.1 (p = ${primes.join(' o ')}): su griglie più grandi non si leggerebbe nulla.`,
    methodLabel: 'Algoritmo',
    methodRepeated: 'Somma ripetuta: G, 2G, ..., kG',
    methodDouble: 'Double-and-add',
    speedLabel: 'Velocità',
    play: 'Avvia',
    pause: 'Pausa',
    step: 'Passo',
    reset: 'Ricomincia',
    bitsLabel: 'Bit di k',
    phases: {
      operands: 'gli operandi',
      line: 'la retta che li unisce',
      third: 'il terzo punto di intersezione',
      reflect: 'il simmetrico',
      result: 'il risultato',
    },
    progress: (i, n, phase) => `Operazione ${i} di ${n}, ${phase}`,
    caption: (op, phase) => {
      if (!op) return '';
      const m = `${op.multiple}G`;
      if (op.op === 'load') return `${m} = G: si parte da G = ${fmtPoint(op.result)}.`;
      if (op.kind === 'identity' && op.op === 'double') {
        return `R è il punto all’infinito, e 2·O = O: anche ${m} = O, perché ${op.multiple} è un multiplo dell’ordine di G.`;
      }
      if (op.kind === 'identity') {
        return `R è il punto all’infinito, l’elemento neutro: O + G = G, quindi ${m} = G = ${fmtPoint(op.result)} e i multipli ricominciano da capo.`;
      }
      let head;
      if (op.vertical) {
        head = op.kind === 'double'
          ? `Raddoppio di ${fmtPoint(op.P)}: con y = 0 la tangente è verticale`
          : `${fmtPoint(op.P)} + ${fmtPoint(op.Q)}: i due punti sono opposti e la retta è verticale`;
      } else {
        head = op.kind === 'double'
          ? `Raddoppio di ${fmtPoint(op.P)}: tangente con λ = ${op.lambda}`
          : `${fmtPoint(op.P)} + ${fmtPoint(op.Q)}: corda con λ = ${op.lambda}`;
      }
      let tail = '';
      if (op.vertical && phase === 'result') tail = `, non c’è un terzo punto affine e ${m} = O`;
      else if (phase === 'third' && op.third) tail = `, che incontra di nuovo la curva in -R = ${fmtPoint(op.third)}`;
      else if ((phase === 'reflect' || phase === 'result') && op.result) tail = `; il simmetrico di -R è R = ${m} = ${fmtPoint(op.result)}`;
      return `${head}${tail}.`;
    },
    done: (k, Q) => `Fatto: Q = ${k}G = ${fmtPoint(Q)}.`,
  },
  stats: {
    intro: (task, facts) => [
      'La consegna chiede di ripetere l’esperimento con valori diversi di k e, se utile, con punti base validi diversi, e di esplorare le proprietà statistiche dei punti ottenuti. Per un punto base G si usano tutti i valori di k da 1 a n - 1, dove n è l’ordine di G: oltre n i punti si ripetono, perché kG dipende solo da k modulo n.',
      `Due avvertenze valgono per tutta la sezione. Primo, i dati non sono un campione casuale ma l’intera popolazione dei multipli: i test sono descrittivi, e un p-value misura quanto la popolazione si discosta da un modello, non un’inferenza su qualcosa di più grande. Secondo, la curva della consegna ha ${facts.order} punti in tutto, e anche usando tutti i punti base insieme le osservazioni sono ${facts.pooledN}. Per questo la sezione 3.2 ripete le stesse analisi su curve con la stessa equazione ma più grandi.`,
      'Ogni analisi ha due test: quello che si farebbe d’istinto, che presuppone osservazioni indipendenti e qui non è valido, e uno esatto, che confronta i dati con insiemi o funzioni casuali che rispettano le stesse simmetrie (simulazioni e permutazioni). Le scelte casuali vengono da un generatore con seme fisso: la pagina, il programma scaricabile e il terminale danno gli stessi numeri.',
    ],
    taskIntro: (task, n) =>
      `Il punto base predefinito qui sono tutti i punti validi insieme: con il solo G = ${fmtPoint(task.G)} della consegna, di ordine ${n}, i valori di k sarebbero ${n - 1}, troppo pochi per qualunque statistica. Il selettore permette di scegliere G o un qualunque altro punto della curva.`,
    extIntro: (exts) => {
      const list = exts.map((e) => `p = ${e.p} (${e.order} punti)`).join(', ');
      const parts = [`Le stesse analisi su curve y² = x³ + 7 più grandi: ${list}.`];
      if (exts.every((e) => e.prime)) {
        parts.push('In tutte il numero di punti è primo: ogni punto diverso da O genera l’intero gruppo, come su secp256k1, e non ci sono sottogruppi di ordini diversi da accorpare.');
      }
      if (exts.every((e) => !e.supersingular && !e.anomalous)) {
        parts.push('Nessuna è supersingolare (#E ≠ p + 1) né anomala (#E ≠ p), i due casi deboli della sezione 4.1.');
      }
      return parts.join(' ');
    },
    fieldLabel: 'Campo F_p',
    baseLabel: 'Punto base',
    pooled: 'tutti i punti base validi, insieme',
    defaultTag: 'predefinito',
    taskTag: 'della consegna',
    orderWord: 'ordine',
    pointsShown: (shown, total) => `Nel selettore ${shown} punti su ${total}: su una curva di ordine primo ognuno genera l’intero gruppo.`,
    summary: (s) =>
      s.pooled
        ? `${s.baseCount} punti base, ognuno con tutti i k da 1 al suo ordine meno uno: N = ${s.N} osservazioni.`
        : `G = ${fmtPoint(s.G)}, di ordine n = ${s.n}: N = ${s.N} osservazioni, una per ogni k da 1 a ${s.n - 1}.`,
    ordersLine: (orders) => `Ordini dei punti base: ${orders.map(([o, c]) => `${c} di ordine ${o}`).join(', ')}.`,
    smallSample: (N) => `Con N = ${N} le analisi che seguono hanno pochissima potenza statistica: i numeri sono riportati per completezza, ognuno con la sua avvertenza.`,
    distribution: {
      intro: 'Quante volte cade ciascun valore di x e di y. Sulle curve piccole una barra per valore, su quelle grandi una barra per classe di valori consecutivi; la linea tratteggiata è ciò che darebbero valori uniformi in [0, p).',
      chartX: 'Distribuzione di x',
      chartY: 'Distribuzione di y',
      explain: (s) => {
        const ux = s.uniformity.x;
        const uy = s.uniformity.y;
        const yRule = s.p % 3 === 2
          ? 'per p ≡ 2 (mod 3) ogni y è possibile, perché x → x³ è biiettiva'
          : `per p ≡ 1 (mod 3) y è possibile solo se y² - ${s.b} è un cubo modulo p, circa un valore su tre`;
        return [
          `Le x osservate sono ${ux.observedValues} valori distinti su ${s.p}, le y ${uy.observedValues}. Non tutti i valori possono comparire: x è l’ascissa di un punto solo se x³ + ${s.b} è un quadrato modulo p, cosa che sull’intera curva accade per ${ux.attainable} valori su ${s.p}, circa la metà; le y possibili sono ${uy.attainable}, perché ${yRule}. Le barre vuote non sono sfortuna statistica: sono valori che la funzione non può produrre.`,
        ];
      },
    },
    frequency: {
      intro: 'La frequenza di ogni singolo valore di x e di y, poi un riepilogo: quanti valori compaiono 0, 1, 2, ... volte.',
      chartX: 'Frequenza per valore di x (tratteggio: N/p)',
      chartY: 'Frequenza per valore di y (tratteggio: N/p)',
      tableTitle: 'Frequenze per valore',
      colValue: 'Valore',
      colX: 'volte come x',
      colY: 'volte come y',
      tableNote: (p) => `Tutti i ${p} valori di [0, p).`,
      bigNote: (p) => `Con p = ${p} una tabella di ${p} righe non sarebbe leggibile: il grafico mostra ogni valore, e dove una colonna di pixel raccoglie più valori ne mostra il massimo.`,
      summaryTitle: 'Riepilogo delle molteplicità',
      summary: (coord, table) => {
        const parts = table
          .map((count, times) => {
            if (!count) return null;
            const what = count === 1 ? '1 valore' : `${count} valori`;
            const how = times === 0 ? 'mai' : times === 1 ? 'una volta' : `${times} volte`;
            return `${what} ${how}`;
          })
          .filter(Boolean);
        return `${coord}: ${parts.join(', ')}.`;
      },
      explain: (s) => {
        const ux = s.uniformity.x;
        const uy = s.uniformity.y;
        const m = s.correlation.mirror;
        if (s.pooled) {
          return [
            `Accorpando punti base di ordini diversi i valori compaiono un numero variabile di volte (x da ${ux.minMult} a ${ux.maxMult}, y da ${uy.minMult} a ${uy.maxMult}): i punti dei sottogruppi grandi sono contati più spesso. Dentro ogni sottogruppo valgono le regole del punto base singolo: x a coppie, y singole o a terne.`,
          ];
        }
        const out = [];
        out.push(ux.sameMultiplicity && ux.maxMult === 2
          ? `Ogni x osservata compare esattamente 2 volte: kG e (n - k)G = -kG sono punti opposti, (x, y) e (x, -y), con la stessa x. Accade in ${m.matches} coppie su ${m.pairs}.`
          : `Le x compaiono da ${ux.minMult} a ${ux.maxMult} volte: le coppie kG e (n - k)G = -kG hanno sempre la stessa x (${m.matches} coppie su ${m.pairs}), e un punto con y = 0, se c’è, è opposto a se stesso e compare una volta sola.`);
        out.push(s.p % 3 === 2
          ? `Con p ≡ 2 (mod 3), come p = ${s.p}, la mappa x → x³ è biiettiva: per ogni y esiste una sola x con x³ = y² - ${s.b}, quindi ogni y compare al più una volta (qui da ${uy.minMult} a ${uy.maxMult}).`
          : `Con p ≡ 1 (mod 3), come p = ${s.p}, l’equazione x³ = y² - ${s.b} ha zero, una o tre soluzioni, e le tre sono x, βx e β²x, con β radice cubica dell’unità modulo p. Per questo le y compaiono una o tre volte (qui da ${uy.minMult} a ${uy.maxMult}): un’altra struttura che una funzione casuale non avrebbe. Su secp256k1, dove pure p ≡ 1 (mod 3), la mappa (x, y) → (βx, y) è l’endomorfismo usato per accelerare i calcoli, e torna nella sezione 4.2.`);
        return out;
      },
    },
    bits: {
      intro: 'Per ogni posizione di bit, la quota di 1 fra i valori distinti di x e di y. La linea tratteggiata è la quota attesa per un insieme casuale della stessa dimensione e con le stesse simmetrie dei valori osservati: per i bit alti è sotto 1/2 perché p non è una potenza di 2.',
      chartX: 'Bit di x: quota di 1 per posizione',
      chartY: 'Bit di y: quota di 1 per posizione',
      explain: (s) => {
        const Dx = s.bits.x[0].distinct;
        const Dy = s.bits.y[0].distinct;
        const out = [
          `Le quote sono calcolate sui valori distinti (${Dx} per x, ${Dy} per y): i valori ripetuti non portano informazione nuova, si ripetono per ragioni algebriche. Il riferimento è lo stesso del test di uniformità esatto (sezione d): insiemi scelti a caso fra quelli con le stesse simmetrie, per i quali media e varianza di ogni quota si calcolano esattamente. Lo z-score quindi non presuppone osservazioni indipendenti.`,
        ];
        const describe = (b, c) => (b ? `il bit ${b.bit} di ${c} (z = ${IT.num(b.z, 2)})` : `nessun bit di ${c}`);
        out.push(`Gli scarti più grandi dall’atteso sono ${describe(worstBit(s.bits.x), 'x')} e ${describe(worstBit(s.bits.y), 'y')}; oltre |z| = 3 ci sono ${bitsBeyond(s)} bit su ${2 * s.bitLength}.`);
        const fixedY = s.bits.y.filter((b) => b.fixed).map((b) => b.bit);
        if (Dy === s.p) {
          out.push('Per y compaiono tutti i p valori: le quote sono per forza quelle dell’intero [0, p), e non c’è nulla da misurare.');
        } else if (fixedY.length && s.uniformity.y.symmetry === 'pairs') {
          const t = trailingOnes(s.p);
          const which = fixedY.length === 1 ? `Il bit ${fixedY[0]} di y è fissato` : `I bit di y da ${fixedY[0]} a ${fixedY[fixedY.length - 1]} sono fissati`;
          out.push(`${which} dalla simmetria: y e p - y compaiono sempre insieme, e p = ${s.p} in binario è ${s.p.toString(2)}, che finisce con ${t === 1 ? 'una cifra 1' : `${t} cifre 1`}, quindi ${t === 1 ? 'l’ultima cifra' : `le ultime ${t} cifre`} di p - y sono il complemento di quelle di y. Qualunque insieme con questa simmetria ha lì esattamente metà di 1: per quei bit lo z-score non esiste.`);
        }
        return out;
      },
    },
    uniformity: {
      intro: 'Il test χ² confronta i conteggi con quelli di valori uniformi in [0, p), su classi di valori consecutivi: le più numerose possibili (una per valore sulle curve piccole, al più 32 su quelle grandi) purché ognuna attenda almeno 5 osservazioni. Due versioni, una accanto all’altra: quella che si farebbe d’istinto, su tutte le osservazioni e con la distribuzione χ² come riferimento, e quella esatta, sui valori distinti confrontati con insiemi casuali che hanno le stesse simmetrie.',
      coordTitle: (c) => `Coordinata ${c}`,
      naiveLabel: 'Test ingenuo: tutte le osservazioni',
      distinctLabel: 'Test esatto: valori distinti',
      status: {
        valid: 'VALIDO',
        descriptive: 'DESCRITTIVO',
        invalid: 'NON VALIDO',
        na: 'NON CALCOLABILE',
      },
      statusHelp: {
        valid: 'Le ipotesi del test sono rispettate.',
        descriptive: 'Test esatto, ma i dati sono la popolazione intera: il risultato descrive, non generalizza.',
        invalid: 'Il numero è calcolato, ma le ipotesi del test non reggono: non va usato per concludere.',
        na: 'Il test non si può calcolare.',
      },
      line: (t) =>
        t.exact
          ? `χ² = ${IT.num(t.chi2, 2)} su ${t.bins} classi${t.perValue ? ', una per valore' : ''}; p-value esatto ${IT.pval(t.pValue)}, dal confronto con ${t.sims} insiemi casuali.`
          : `χ² = ${IT.num(t.chi2, 2)} con ${count(t.df, 'grado', 'gradi')} di libertà su ${t.bins} classi${t.perValue ? ', una per valore' : ''}; minimo atteso per classe ${IT.num(t.minExpected, 2)}; p-value ${IT.pval(t.pValue)} secondo la distribuzione χ².`,
      reasons: {
        'small-sample': (t) =>
          t.computable
            ? `Con N = ${t.N} osservazioni nemmeno due classi arrivano a 5 osservazioni attese: l’approssimazione χ² non regge.`
            : `Con N = ${t.N} non c’è nulla da confrontare.`,
        duplicates: (t, u) =>
          `Le osservazioni non sono indipendenti: ogni valore compare ${u.sameMultiplicity ? `esattamente ${u.maxMult} volte` : `da ${u.minMult} a ${u.maxMult} volte`} per ragioni algebriche, quindi i conteggi sono multipli fissi e la statistica è gonfiata all’incirca di quel fattore.`,
        exhaustive: (t) =>
          t.exact
            ? 'I dati sono l’intera popolazione, non un campione. Il riferimento è la stessa costruzione fatta a caso: insiemi con lo stesso numero di valori e le stesse simmetrie, estratti senza reinserimento. Il p-value è la quota di questi insiemi con una statistica almeno altrettanto lontana dall’uniforme: esatto a meno dell’errore Monte Carlo, senza approssimazione χ² e senza ipotesi di indipendenza.'
            : 'I dati sono l’intera popolazione dei multipli, non un campione casuale: il p-value descrive quanto la popolazione si discosta dall’uniforme, non è un’inferenza su qualcosa di più grande.',
        orbits: (t) =>
          t.symmetry === 'pairs'
            ? 'Le y arrivano a coppie: il sottogruppo contiene -P con ogni P, quindi y e p - y compaiono sempre insieme. Anche gli insiemi casuali di riferimento sono fatti di coppie {y, p - y}.'
            : 'Le x arrivano a terne: per p ≡ 1 (mod 3), con (x, y) è sulla curva anche (βx, y), dove β è una radice cubica dell’unità, quindi x, βx e β²x compaiono insieme. Anche gli insiemi casuali di riferimento sono fatti di terne.',
        'low-power': (t) => `Con soli ${t.N} valori distinti il test è esatto ma non ha potenza: non riuscirebbe a rifiutare nemmeno un insieme chiaramente non uniforme.`,
        'all-values': (t, u, s) => `Compaiono tutti i ${s.p} valori di [0, p): l’insieme dei valori distinti è uniforme per costruzione e non resta nulla da verificare.`,
      },
      verdict: (t) => {
        if (t.tooRegular) return `Lettura: la statistica è più piccola di quanto darebbe quasi ogni insieme di riferimento (coda sinistra ${IT.pval(t.leftTail)}): i valori sono distribuiti fra le classi in modo più regolare del caso. Fra più test un valore così può capitare: va confrontato con le altre curve.`;
        if (t.verdict === 'reject') return `Lettura: uno scarto così grande è raro fra gli insiemi di riferimento (p-value ${IT.pval(t.pValue)}): a livello di classi i valori non sembrano uniformi.`;
        return `Lettura: uno scarto così è del tutto normale fra gli insiemi di riferimento (p-value ${IT.pval(t.pValue)}): a livello di classi i valori sembrano uniformi.`;
      },
      noVerdict: 'Lettura: nessuna conclusione, il test non è valido per i motivi sopra.',
      why: (s, coord) => {
        const u = s.uniformity[coord];
        const d = u.distinct;
        if (!d.computable) return null;
        if (d.reasons.includes('low-power')) {
          return `Il limite vero è la dimensione: ${u.observedValues} valori distinti sono troppo pochi per qualunque test di uniformità. Il risultato non dice che la funzione sia uniforme, né che non lo sia.`;
        }
        if (d.verdict === 'reject') {
          return `I valori possibili sono vincolati dalla curva (${u.attainable} su ${s.p}) e il sottogruppo ne copre una parte non distribuita in modo uniforme.`;
        }
        const share = coord === 'x' ? 'circa metà' : s.p % 3 === 2 ? 'tutti' : 'circa un terzo';
        return `Perché sembra uniforme: i valori raggiungibili, ${share} di [0, p), sono sparsi sull’intervallo come un insieme casuale con le stesse simmetrie. La struttura non sta in dove cadono ma in quali sono possibili, in quante volte compaiono (coppie e terne) e nelle simmetrie stesse: cose che un test a classi non vede, e che il test ingenuo scambia per mancanza di uniformità.`;
      },
    },
    correlation: {
      intro: 'Due livelli. Sui valori: la correlazione di Pearson (lineare) e di Spearman (sui ranghi) fra k e le coordinate del punto. Sui bit: per ogni bit di k e ogni bit di x e di y, il coefficiente φ, cioè Pearson su variabili 0/1. Se l’uscita non dipendesse da k, ogni φ avrebbe deviazione standard esattamente 1/√(N - 1): |φ| > 3/√(N - 1) è insolito, ma su molte celle qualcuna lo supera per caso.',
      colMeasure: 'Misura',
      colValue: 'Valore',
      rows: {
        pearsonKX: 'Pearson r(k, x)',
        pearsonKY: 'Pearson r(k, y)',
        spearmanKX: 'Spearman ρ(k, x)',
        spearmanKY: 'Spearman ρ(k, y)',
        mirror: 'x(kG) = x((n - k)G)',
        homomorphism: '(k1 + k2)G = k1G + k2G',
      },
      pairsValue: (m) => `${m.matches} coppie su ${m.pairs}`,
      trialsValue: (h) => `vera in ${h.holds} prove su ${h.trials}`,
      undefinedWhy: 'n/d vuol dire non definita: servono almeno 3 valori e variabili non costanti.',
      heatmapTitle: (range) => `φ fra i bit di k (righe) e i bit di x e di y (colonne): rosso positivo, blu negativo, grigio non definito. La scala va da -${IT.short(range)} a +${IT.short(range)}, circa 4/√N.`,
      kBits: 'bit di k',
      explain: (s) => {
        const c = s.correlation;
        const b = c.bits;
        const out = [];
        const symmetricK = !s.pooled || (s.orders && s.orders.length === 1);
        if (c.pearsonKX !== null && symmetricK && c.mirror.pairs > 0 && c.mirror.matches === c.mirror.pairs) {
          out.push(`r(k, x) = ${IT.num(c.pearsonKX)} e ρ(k, x) = ${IT.num(c.spearmanKX)} non indicano indipendenza: x è una funzione simmetrica di k, perché x(kG) = x((n - k)G), e la correlazione fra k e una sua funzione simmetrica rispetto a n/2 è zero per costruzione, lineare o sui ranghi. Eppure x è completamente determinata da k: correlazione nulla non vuol dire indipendenza.`);
        }
        if (!b.defined) {
          out.push('Nessuna cella della matrice è definita: con così pochi valori ogni bit è costante.');
          return out;
        }
        out.push(`Matrice bit a bit: |φ| massimo ${IT.num(b.maxAbs)}, medio ${IT.num(b.meanAbs)}, soglia 3/√(N - 1) = ${IT.num(b.threshold)}. Celle oltre la soglia: ${b.above} su ${b.defined}, contro ${IT.num(b.expectedAbove, 1)} in media sulle permutazioni del test.`);
        if (b.pValue !== null) {
          out.push(`Test globale per permutazione: la statistica N·Σφ² = ${IT.num(b.statistic, 1)} è confrontata con quella di ${b.sims} riassegnazioni casuali delle uscite ai valori di k, che rompono ogni legame fra ingresso e uscita lasciando invariate tutte le altre proprietà dei dati. P-value esatto, a meno dell’errore Monte Carlo: ${IT.pval(b.pValue)}.`);
        }
        if (s.pooled && b.maxAbs === 0) {
          out.push('Tutte le φ sono esattamente zero, per costruzione: su una curva di ordine primo, accorpando tutti i punti base, per ogni k i punti kG percorrono l’intero gruppo, quindi la distribuzione dell’uscita non dipende affatto da k. È un’indipendenza che viene dalla media su tutti i G, non dalla funzione k → kG per un G fissato.');
        } else if (s.pooled && b.pValue !== null && b.pValue < 0.05) {
          out.push('Il test rifiuta l’indipendenza, ma per un motivo che riguarda l’accorpamento e non k → kG: con sottogruppi di ordini diversi, i k grandi esistono solo nei sottogruppi grandi, che contengono punti diversi, quindi i bit alti di k dicono da quale sottogruppo viene il punto.');
        } else if (b.pValue !== null && b.pValue < 0.05) {
          out.push('Il test rifiuta l’indipendenza: su un gruppo così piccolo la struttura dei multipli si vede anche a livello di singoli bit.');
        } else if (b.pValue !== null) {
          out.push('Il test non trova legami fra singoli bit: a livello di bit k e kG sembrano indipendenti, anche se kG è una funzione deterministica e fortemente strutturata di k. È il limite di queste misure: vedono solo dipendenze lineari fra coppie di bit.');
        }
        if (s.smallSample) out.push(`Con N = ${s.N} queste stime sono molto instabili.`);
        return out;
      },
    },
    avalanche: {
      intro: 'Si inverte un bit di k e si contano i bit di x e di y che cambiano. Ogni coppia {k, k con il bit invertito} è contata una volta sola, e solo se entrambi i valori stanno fra 1 e n - 1. Per una funzione di hash ideale ogni bit d’uscita cambierebbe con probabilità 1/2; qui l’uscita è un valore in [0, p), quindi il riferimento ideale per ciascun bit è 2q(1 - q), dove q è la quota di 1 attesa per quel bit fra valori uniformi in [0, p).',
      chartTitle: 'Bit d’uscita cambiati invertendo un bit di k: quante coppie per ogni numero di bit (tratteggio: riferimento ideale)',
      heatmapTitle: () => 'Matrice di valanga: per ogni bit di k invertito (righe) e ogni bit di x e di y (colonne), quanto la frequenza di cambio si scosta da quella delle funzioni di riferimento del test esatto, in deviazioni standard. Rosso: cambia più spesso; blu: meno spesso. La scala va da -4 a +4.',
      kBits: 'bit di k invertito',
      none: 'Dentro il sottogruppo non ci sono due valori di k che differiscano di un solo bit: l’effetto valanga non è misurabile.',
      naiveLabel: 'Test ingenuo: misure indipendenti',
      exactLabel: 'Test esatto: funzioni con la stessa simmetria',
      naiveLine: (a) =>
        `Σz² = ${IT.num(a.naive.z2, 1)} su ${count(a.naive.cells, 'cella', 'celle')} contro il riferimento ideale; celle oltre 3σ: ${a.naive.above}, attese ${IT.num(a.naive.expectedAbove, 1)}; p-value ${IT.pval(a.naive.pValue)} secondo la distribuzione χ².`,
      naiveReasons: (s) => [
        `Le misure non sono indipendenti. La coppia {kG, (k + 2^i)G} e la sua speculare {(n - k - 2^i)G, (n - k)G} = {-(k + 2^i)G, -kG} hanno le stesse x, e nel ${IT.pct(s.avalanche.mirrorShareAll)} dei casi vengono contate entrambe: la stessa misura entra due volte. In più, coppie diverse condividono un punto.`,
        'Il riferimento 2q(1 - q) vale per valori uniformi in [0, p), mentre le uscite sono punti della curva: non tutti i valori sono possibili.',
        s.pooled ? 'Accorpando i punti base, le stesse coppie di punti ricompaiono per molti G diversi.' : null,
      ].filter(Boolean),
      exactLine: (a) =>
        `Σz² = ${IT.num(a.exact.statistic, 1)} su ${count(a.exact.cells, 'cella', 'celle')}, standardizzate con media e deviazione standard di ${a.exact.sims} funzioni di riferimento; celle oltre 3σ: ${a.exact.above}, in media ${IT.num(a.exact.expectedAbove, 1)} per le funzioni di riferimento; p-value esatto ${IT.pval(a.exact.pValue)}.`,
      exactReasons: (s) => [
        `Le funzioni di riferimento hanno la stessa immagine, la stessa simmetria f(n - k) = -f(k) e le stesse coppie di k di k → kG: cambia solo, a caso, quale coppia di punti opposti {P, -P} va a quale coppia {k, n - k}, e con che segno${s.pooled ? ', sottogruppo per sottogruppo' : ''}. La dipendenza fra le misure c’è anche nel riferimento, quindi non serve alcuna correzione.`,
        'I dati sono l’intera popolazione delle coppie: il p-value descrive quanto è tipica la matrice osservata fra le funzioni con la stessa struttura.',
      ],
      exactVerdict: (s) => {
        const e = s.avalanche.exact;
        return e.pValue < 0.05
          ? `Lettura: la matrice osservata è più lontana dal riferimento di quasi tutte le funzioni con la stessa struttura (p-value ${IT.pval(e.pValue)}): c’è struttura oltre la simmetria.`
          : `Lettura: la matrice è tipica di una funzione casuale con la stessa simmetria (p-value ${IT.pval(e.pValue)}): a livello di bit, k → kG si comporta come se avesse un effetto valanga.`;
      },
      explain: (s) => {
        const a = s.avalanche;
        if (!a.measurements) return [it.stats.avalanche.none];
        const out = [
          `Su ${a.measurements} coppie cambia in media il ${IT.pct(a.meanFraction)} dei ${a.outputBits} bit d’uscita, contro il ${IT.pct(a.idealMeanFraction)} del riferimento ideale; lo scarto di una cella dall’ideale è al massimo ${IT.num(a.maxDev)}, in media ${IT.num(a.meanDev)}.`,
        ];
        const naive = a.naive.pValue;
        const exact = a.exact.pValue;
        if (exact === null) return out;
        if (naive !== null && naive < 0.05 && exact >= 0.05) {
          out.push(`Il confronto fra i due test è il risultato: quello ingenuo rifiuta (p-value ${IT.pval(naive)}), quello esatto no (p-value ${IT.pval(exact)}). Lo scarto che il test ingenuo vede non è assenza di valanga, ma dipendenza fra le misure: tenendone conto, la matrice è quella di una funzione casuale con la stessa simmetria.`);
        } else if (s.pooled && exact < 0.05) {
          out.push(`Anche il test esatto rifiuta, per un motivo che riguarda l’accorpamento: per k e i fissati, al variare di G la coppia (kG, (k + 2^i)G) è (P, rP) con r = (k + 2^i)/k modulo n, e combinazioni diverse di k e i con lo stesso r danno le stesse coppie di punti in tutti i sottogruppi. Le funzioni di riferimento, rimescolate sottogruppo per sottogruppo, non hanno questa ripetizione.${s.orders && s.orders.length > 1 ? ' Con sottogruppi di ordini diversi, in più, ogni riga mescola gruppi di dimensioni diverse.' : ''}`);
        } else if (exact < 0.05) {
          out.push('Anche il test esatto rifiuta: su un gruppo così piccolo la struttura si vede anche nei bit, perché invertire il bit i di k (da 0 a 1) significa sommare sempre lo stesso punto 2^i·G.');
        }
        if (s.smallSample) out.push(`Con N = ${s.N} queste stime sono molto instabili.`);
        return out;
      },
    },
  },
  discussion: {
    definitions: [
      {
        term: 'Funzione a senso unico.',
        body: 'Una funzione f è a senso unico se si calcola in tempo polinomiale e, per ogni avversario probabilistico polinomiale A, la probabilità che A, dato f(x) per un x casuale, trovi una qualunque preimmagine è trascurabile nel parametro di sicurezza. Nessuna funzione è dimostrata tale: l’esistenza di funzioni a senso unico implicherebbe P ≠ NP. La moltiplicazione scalare k → kG su un gruppo di ordine primo n è un candidato, e la sua sicurezza è un’ipotesi: la difficoltà dell’ECDLP.',
      },
      {
        term: 'Quanto è difficile l’ECDLP.',
        body: 'Gli attacchi generici, baby-step giant-step e rho di Pollard, richiedono circa √n operazioni di gruppo, e nel modello del gruppo generico ne servono almeno Ω(√n) (Shoup, 1997). Per secp256k1 n ≈ 2^256, quindi circa 2^128 operazioni: è il suo livello di sicurezza di 128 bit. Poi ci sono gli attacchi che sfruttano la struttura: Pohlig-Hellman riduce il problema al più grande fattore primo di n; MOV e Frey-Rück lo trasferiscono a un logaritmo discreto nel gruppo moltiplicativo di un’estensione F_(p^m), facile quando il grado di immersione m è piccolo, come sulle curve supersingolari (m ≤ 2 per p > 3); Smart, Satoh-Araki e Semaev lo risolvono in tempo polinomiale sulle curve anomale, quelle con #E = p.',
      },
      {
        term: 'Funzione di hash crittografica.',
        body: 'H: {0,1}* → {0,1}^ℓ comprime ingressi di qualunque lunghezza in un’uscita di lunghezza fissa, con resistenza alla preimmagine, alla seconda preimmagine e alle collisioni (Rogaway e Shrimpton, 2004). In pratica le si chiede anche di comportarsi come un oracolo casuale (Bellare e Rogaway, 1993), un’idealizzazione che nessuna funzione concreta realizza davvero (Canetti, Goldreich e Halevi, 1998). L’effetto valanga (Feistel, 1973) e lo Strict Avalanche Criterion (Webster e Tavares, 1985) sono criteri di progetto necessari a quel comportamento, non definizioni di sicurezza.',
      },
      {
        term: 'Test statistici e sicurezza.',
        body: 'Un test statistico è un distinguitore: superarlo significa solo che quel distinguitore fallisce. Per la pseudocasualità, cioè l’indistinguibilità da valori uniformi per ogni distinguitore efficiente, superare i test è necessario ma mai sufficiente. Per una funzione a senso unico non è né necessario né sufficiente: se g è a senso unico, f(x1, x2) = (g(x1), x2) lo è ancora, pur ricopiando metà dell’ingresso nell’uscita, e f(x) = g(x) ‖ 0 lo è con un bit d’uscita sempre nullo; viceversa una permutazione pubblica, come AES con una chiave nota, supera ogni batteria di test e si inverte in un istante.',
      },
    ],
    propertiesIntro: (T, E) =>
      `Le sei proprietà elencate nella consegna, una per riga: che ruolo hanno per una funzione a senso unico, che ruolo hanno per una funzione di hash, e cosa mostrano i dati di questa pagina. La colonna Osservato usa la curva della consegna con tutti i punti base (N = ${T.N}) e la curva scelta in 3.2 (p = ${E.p}, ${E.pooled ? 'tutti i punti base' : `G = ${fmtPoint(E.G)}`}, N = ${E.N}).`,
    colProperty: 'Proprietà',
    colOwf: 'Funzione a senso unico',
    colHash: 'Funzione di hash',
    colObserved: 'Osservato',
    rows: [
      {
        key: 'distribution',
        name: 'Distribuzione di x e y',
        owf: 'Non richiesta: la definizione chiede solo che invertire sia difficile, e l’uscita può avere qualunque distribuzione, anche concentrata su metà dei valori.',
        hash: 'Richiesta: un’uscita distinguibile dall’uniforme rompe il comportamento da oracolo casuale e riduce l’entropia degli identificativi.',
      },
      {
        key: 'frequency',
        name: 'Frequenza dei singoli valori',
        owf: 'Conta in un caso: un valore molto frequente si inverte scegliendo una qualunque delle sue preimmagini. k → kG è iniettiva su [1, n - 1], quindi ogni punto ha una sola preimmagine.',
        hash: 'Conta la resistenza alle collisioni: nessuna coppia di ingressi con la stessa uscita dev’essere trovabile.',
      },
      {
        key: 'bits',
        name: 'Distribuzione dei bit',
        owf: 'Irrilevante: g(x) ‖ 0 è a senso unico con un bit sempre nullo.',
        hash: 'Ogni bit d’uscita deve valere 1 con probabilità 1/2: un bit sbilanciato è già un distinguitore.',
      },
      {
        key: 'uniformity',
        name: 'Uniformità apparente',
        owf: 'Né necessaria né sufficiente.',
        hash: 'Necessaria, non sufficiente: è la versione a grana grossa dell’indistinguibilità da un oracolo casuale.',
      },
      {
        key: 'correlation',
        name: 'Correlazioni fra ingresso e uscita',
        owf: 'Conta solo una relazione che aiuti a invertire. Qui la struttura c’è (omomorfismo, simmetria), ma per quanto noto vale al più un fattore costante sugli attacchi generici.',
        hash: 'Nessuna correlazione e nessuna relazione algebrica fra uscite di ingressi collegati.',
      },
      {
        key: 'avalanche',
        name: 'Effetto valanga',
        owf: 'Non richiesto: in (g(x1), x2) invertire un bit di x2 cambia un solo bit d’uscita.',
        hash: 'Richiesto come criterio di progetto: ogni bit d’uscita deve cambiare con probabilità 1/2 invertendo un qualunque bit d’ingresso.',
      },
    ],
    observed: {
      distribution: (T, E) =>
        `${T.uniformity.x.observedValues} x distinte su ${T.p} sulla curva della consegna, ${E.uniformity.x.observedValues} su ${E.p} con p = ${E.p}: solo i valori con x³ + ${E.b} quadrato modulo p, circa la metà.`,
      frequency: (T, E) =>
        `Le x collidono a coppie (${E.correlation.mirror.matches} coppie su ${E.correlation.mirror.pairs} con p = ${E.p}), le y ${E.p % 3 === 1 ? 'a terne' : 'mai'}. Il punto intero non si ripete mai per k in [1, n - 1].`,
      bits: (T, E) =>
        `Con p = ${E.p}, ${bitsBeyond(E)} bit su ${2 * E.bitLength} oltre |z| = 3 rispetto a insiemi casuali con le stesse simmetrie; i bit bassi di y sono fissati dalla simmetria y ↔ p - y.`,
      uniformity: (T, E) => {
        const d = E.uniformity.x.distinct;
        const dy = E.uniformity.y.distinct;
        if (!d.computable) return IT.na;
        return `Test esatto sui valori distinti con p = ${E.p}: p-value ${IT.pval(d.pValue)} per x e ${IT.pval(dy.pValue)} per y, rispetto a insiemi casuali con le stesse simmetrie; il test ingenuo, che ignora i valori ripetuti, è non valido. Sulla curva della consegna i valori sono troppo pochi perché un test abbia potenza.`;
      },
      correlation: (T, E) =>
        `r(k, x) = ${IT.num(E.correlation.pearsonKX)} per simmetria; φ bit a bit con p = ${E.p}: ${count(E.correlation.bits.above, 'cella', 'celle')} oltre 3/√(N - 1) su ${E.correlation.bits.defined} (in media ${IT.num(E.correlation.bits.expectedAbove, 1)} per caso), test per permutazione p-value ${IT.pval(E.correlation.bits.pValue)}. Omomorfismo vero in ${E.homomorphism.holds} prove su ${E.homomorphism.trials}.`,
      avalanche: (T, E) => {
        const a = E.avalanche;
        return `Con p = ${E.p} cambia in media il ${IT.pct(a.meanFraction)} dei bit (ideale ${IT.pct(a.idealMeanFraction)}); matrice di valanga: test esatto p-value ${IT.pval(a.exact.pValue)}, contro ${IT.pval(a.naive.pValue)} del test ingenuo, che ignora la dipendenza fra le misure.`;
      },
    },
    propertiesAfter: [
      'Le proprietà che rendono k → kG utile come funzione a senso unico non compaiono nella tabella: il calcolo diretto efficiente (sezione 1.4), la difficoltà dell’inversione (sezione 4.3) e la struttura di gruppo su cui si reggono firme e scambio di chiavi. Nessuna delle sei statistiche le misura.',
      'La struttura osservata non è innocua per principio, ma per quanto noto lo è in pratica. La simmetria P → -P, che produce le x a coppie, e l’automorfismo (x, y) → (βx, y), che produce le y a terne quando p ≡ 1 (mod 3) come su secp256k1, permettono al metodo rho di Pollard di lavorare su classi di 6 punti invece che su singoli punti, con un guadagno di √6 (Duursma, Gaudry e Morain, 1999): su secp256k1 da circa 2^128 a circa 2^127 operazioni. Un guadagno costante, non asintotico: la struttura che le statistiche vedono vale meno di 1,3 bit di sicurezza.',
    ],
    inversion: (ctx) => {
      const out = [
        `Conoscendo solo G e Q, provare G, 2G, 3G, ... trova Q dopo ${ctx.tries} tentativi: k ≡ ${ctx.kmod} (mod ${ctx.n}). È la ricerca esaustiva, che nel caso peggiore costa n tentativi; i metodi generici migliori, baby-step giant-step e rho di Pollard, ne richiedono circa √n, qui ${Math.ceil(Math.sqrt(ctx.n))}.`,
      ];
      const notes = [];
      if (!ctx.nPrime) notes.push(`l’ordine di G, n = ${ctx.nFactors}, non è primo, e Pohlig-Hellman riduce il problema a logaritmi in sottogruppi di ordine primo, il più grande dei quali ha ${ctx.nLargest} elementi`);
      if (ctx.facts.supersingular) notes.push(`la curva è supersingolare (#E = p + 1 = ${ctx.facts.order}), e l’attacco MOV porta il problema nel gruppo moltiplicativo di F_(p²), dove esistono algoritmi subesponenziali`);
      if (ctx.facts.anomalous) notes.push('la curva è anomala (#E = p), e l’attacco di Smart la risolve in tempo polinomiale');
      if (notes.length) out.push(`Sulla curva scelta ci sono anche scorciatoie strutturali: ${notes.join('; ')}. Su una curva giocattolo non servono, ma sono esattamente le ragioni per cui le curve reali hanno ordine primo e grado di immersione grande.`);
      out.push('Su secp256k1 il sottogruppo ha circa 1,16 × 10^77 punti. Anche il metodo rho di Pollard, che richiede circa √n passi invece di n, ne richiederebbe circa 3,4 × 10^38: a 10^12 passi al secondo sono circa 10^19 anni. A rendere la funzione a senso unico sono la dimensione del gruppo e l’assenza di strutture sfruttabili, non la formula, che è la stessa della curva giocattolo.');
      return out;
    },
    inversionInfinity: 'Q = O: non c’è nulla da invertire, k è un multiplo dell’ordine di G.',
    conclusion: [
      'La moltiplicazione scalare su curva ellittica è una funzione a senso unico candidata, non una funzione di hash. Condivide con le funzioni di hash il determinismo, la facilità del calcolo diretto e la difficoltà dell’inversione, ed è questo che la consegna intende con "shares some properties". Ma è una biiezione strutturata: un omomorfismo di gruppi, i cui punti sono circa p fra le p² coppie (x, y) possibili, le cui x coprono circa metà di [0, p) e collidono a coppie. Proprio quella struttura la rende utile: le firme ECDSA e lo scambio di chiavi Diffie-Hellman si reggono sull’omomorfismo. Una funzione di hash con la stessa proprietà sarebbe rotta, perché da H(a) e H(b) si calcolerebbe H(a + b).',
      'Le statistiche lo confermano senza poterlo dimostrare. Con i test esatti, i valori distinti di x e di y sono indistinguibili da insiemi casuali con le stesse simmetrie, i bit sono quelli attesi, la correlazione bit a bit è compatibile con zero e la matrice di valanga è tipica di una funzione casuale con la stessa simmetria. La struttura sta altrove: quali valori sono possibili, quante volte compaiono (coppie e terne), le simmetrie y ↔ p - y e x → βx e l’omomorfismo, vero in ogni prova; e i test ingenui, che ignorano queste dipendenze, la scambiano per mancanza di casualità. Nessuna di queste misure dice quanto sia difficile invertire la funzione: è una proprietà computazionale, non statistica, e sulle curve giocattolo è falsa.',
      'Per questo Ethereum compone le due cose. La chiave pubblica Q = kG viene dalla funzione a senso unico; l’indirizzo sono gli ultimi 20 byte di Keccak-256(x ‖ y), cioè un hash applicato al punto strutturato per ottenere un identificativo corto e uniforme. E la collisione delle x si ritrova nelle firme: ECDSA usa solo r = x(R) mod n, e R e -R hanno la stessa x, quindi (r, s) e (r, n - s) sono entrambe valide. Ethereum blocca questa malleabilità con EIP-2, che accetta solo s ≤ n/2, e aggiunge alla firma il recovery id v, il bit che dice quale dei due punti con quella x usare per ricostruire la chiave pubblica. Allo stesso modo il segreto di uno scambio Diffie-Hellman su curva ellittica passa da una funzione di derivazione di chiave prima di diventare una chiave.',
    ],
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: si apre con un doppio clic su index.html, anche offline. Con node homework1.js [k] [p] stampa da terminale la sequenza, la chiave pubblica e le statistiche.',
    contents: 'Contenuto: index.html, style.css, homework1.js (calcoli e statistiche), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework1.zip',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Dalla chiave privata alla chiave pubblica: moltiplicazione scalare su curva ellittica, come in Ethereum.',
    course: 'Statistics, laurea magistrale in Cybersecurity, Sapienza Università di Roma',
    online: 'Versione online',
    noscript: 'Questo programma ha bisogno di JavaScript.',
  },
};

// ---------------------------------------------------------------------------
// ENGLISH
// ---------------------------------------------------------------------------

const EN = formatters('.', 'n/a');

const en = {
  fmt: EN,
  ui: {
    index: 'Contents',
    indexTitle: 'Homework contents',
    close: 'Close',
    computing: 'Computing...',
    language: 'Language',
    error: (m) => `Error: ${m}`,
  },
  sections: {
    assignment: '0. The assignment',
    task: '1. TASK: from a private key to a public key',
    setup: '1.1 Toy curve, base point and private key',
    addition: '1.2 Point addition',
    multiples: '1.3 G, 2G, 3G, ..., kG',
    fast: '1.4 A faster method for a larger k: double-and-add',
    publicKey: '1.5 The TOY PUBLIC KEY',
    guru: '2. OPTIONAL - GURU LEVEL: the algorithm in slow motion',
    stats: '3. STATISTICAL EXPLORATION',
    statsTask: '3.1 On the assignment’s curve',
    distribution: 'a. Distribution of the x and y coordinates',
    frequency: 'b. Frequency of individual values',
    bits: 'c. Distribution of bits',
    uniformity: 'd. Apparent uniformity',
    correlation: 'e. Correlations between input and output',
    avalanche: 'f. Avalanche effect',
    statsExt: '3.2 Extension: larger toy curves',
    discussion: '4. Discussion: one-way function or hash function?',
    definitions: '4.1 Definitions',
    properties: '4.2 The six properties, one by one',
    inversion: '4.3 Inverting Q: why the toy key is not one-way',
    conclusion: '4.4 Conclusions',
  },
  assignment: {
    intro: (task) => [
      'In Ethereum the private key is an integer k chosen at random between 1 and n - 1, where n ≈ 2^256 is the order of the base point, and the public key is the point Q = kG on the elliptic curve secp256k1, y² = x³ + 7 over a 256-bit prime field. Computing Q from k is fast; recovering k from Q is the Elliptic Curve Discrete Logarithm Problem (ECDLP), for which no efficient algorithm is known.',
      `The assignment asks to show this on a toy curve with the same equation, y² = x³ + ${task.b} (mod ${task.p}), with base point G = ${fmtPoint(task.G)} and private key k = ${task.k}. The page follows it point by point: the TASK (section 1), the optional guru level (section 2), the statistical exploration (section 3) and the final discussion (section 4). The values can be changed; when they are no longer the assignment’s the page says so, and a button restores them.`,
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned.',
  },
  setup: {
    fieldLabel: 'Field F_p',
    baseLabel: 'Base point G',
    keyLabel: 'Private key k',
    orderWord: 'order',
    taskTag: 'from the assignment',
    taskBadge: (task) => `The assignment’s values: y² = x³ + ${task.b} (mod ${task.p}), G = ${fmtPoint(task.G)}, k = ${task.k}.`,
    customBadge: (task) => `Values differ from the assignment, which uses y² = x³ + ${task.b} (mod ${task.p}), G = ${fmtPoint(task.G)} and k = ${task.k}.`,
    restore: 'Restore the assignment’s values',
    kHint: (max) => `An integer from 1 to ${max}.`,
    kError: {
      empty: 'Enter the private key k.',
      notInteger: (t) => `"${t}" is not a positive integer: only the digits 0 to 9 are accepted.`,
      range: (max) => `k must be an integer from 1 to ${max}.`,
      fallback: (k) => `Until the value is valid, the last correct one stays in use, k = ${k}.`,
    },
    curveSummary: (p, b, count, n) =>
      `The curve y² = x³ + ${b} over F_${p} has ${count - 1} affine points plus the point at infinity O, ${count} points in total. G generates a subgroup of ${n} points: kG depends only on k modulo ${n}.`,
    pointsTitle: 'The points of the curve',
    pointsLegend: 'Blue: the multiples of G, that is the subgroup it generates; outlined: G (orange) and the public key Q (red).',
  },
  addition: {
    intro:
      'The group of points is built with the chord-and-tangent rule. To add P = (x1, y1) and Q = (x2, y2), draw the line through them (the tangent when P = Q): it meets the curve at a third point, -R, and the sum is its mirror image across the x axis, R = P + Q. In formulas, modulo p:',
    formulas: (task) => [
      'P ≠ Q:   λ = (y2 - y1) / (x2 - x1)',
      `P = Q:   λ = (3·x1² + a) / (2·y1)        (here a = ${task.a})`,
      'x3 = λ² - x1 - x2        y3 = λ·(x1 - x3) - y1',
      'P + (-P) = O,   P + O = P        (O: point at infinity, the identity)',
    ],
    note: 'Dividing modulo p means multiplying by the modular inverse, computed with the extended Euclidean algorithm. The functions of the program refuse any input that is not a point of the curve, instead of silently returning a wrong result.',
  },
  multiples: {
    intro: 'As the assignment asks, each row adds G to the previous one: k - 1 point additions. Below the table, the same computation as the program prints it, also from a terminal with node homework1.js.',
    colMultiple: 'Multiple',
    colPoint: 'Point',
    colOperation: 'Operation',
    colLambda: 'λ',
    kinds: {
      start: 'starting point',
      add: 'addition (chord)',
      double: 'doubling (tangent)',
      inverse: 'P + (-P) = O (vertical line)',
      identity: 'O + G = G',
    },
    tooMany: (k, limit) => `With k = ${k} it would take ${k - 1} additions: beyond ${limit} the table does not list them, and the computation moves to double-and-add (1.4).`,
    printedTitle: 'Program output',
  },
  fast: {
    intro: (k, bits, steps) =>
      `Write k = ${k} in binary, ${bits}, and read the bits from the left. The first bit, always 1, loads R = G; for every following bit, double R and, if the bit is 1, add G. ${steps - 1} group operations are enough instead of the ${k - 1} of repeated addition: the cost grows with the number of bits of k, not with k. For a 256-bit Ethereum key that is about 383 operations (255 doublings and about 128 additions on average), instead of about 2^256.`,
    colBit: 'Bit of k',
    colOperation: 'Operation',
    colR: 'R',
    colPoint: 'Point',
    ops: { load: 'R = G', double: 'R = 2R', add: 'R = R + G' },
  },
  publicKey: {
    intro: 'The final point, printed as the assignment asks:',
    label: 'TOY PUBLIC KEY',
    infinity: 'Q = O, the point at infinity: k is a multiple of the order of G. O is not a valid public key, which is why in Ethereum the private key is chosen between 1 and n - 1.',
    ethereum: 'In Ethereum the public key is the pair (x, y) of Q, 64 bytes, and the address is the last 20 bytes of its Keccak-256 hash: section 4.4 comes back to it.',
  },
  guru: {
    intro:
      'Each operation is drawn in five phases on the p × p grid: the two operands; the line through them (the tangent when doubling), which wraps around the square because everything is modulo p; the third point where the line meets the curve, -R; its mirror image R, which is the sum. Grey: the points of the curve; blue: the multiples of G computed so far. Step moves one phase at a time.',
    vizNote: (primes) => `The animation uses the curve and the key chosen in 1.1 (p = ${primes.join(' or ')}): larger grids would be unreadable.`,
    methodLabel: 'Algorithm',
    methodRepeated: 'Repeated addition: G, 2G, ..., kG',
    methodDouble: 'Double-and-add',
    speedLabel: 'Speed',
    play: 'Play',
    pause: 'Pause',
    step: 'Step',
    reset: 'Restart',
    bitsLabel: 'Bits of k',
    phases: {
      operands: 'the operands',
      line: 'the line through them',
      third: 'the third intersection',
      reflect: 'the mirror image',
      result: 'the result',
    },
    progress: (i, n, phase) => `Operation ${i} of ${n}, ${phase}`,
    caption: (op, phase) => {
      if (!op) return '';
      const m = `${op.multiple}G`;
      if (op.op === 'load') return `${m} = G: start from G = ${fmtPoint(op.result)}.`;
      if (op.kind === 'identity' && op.op === 'double') {
        return `R is the point at infinity, and 2·O = O: ${m} = O as well, because ${op.multiple} is a multiple of the order of G.`;
      }
      if (op.kind === 'identity') {
        return `R is the point at infinity, the identity: O + G = G, so ${m} = G = ${fmtPoint(op.result)} and the multiples start over.`;
      }
      let head;
      if (op.vertical) {
        head = op.kind === 'double'
          ? `Doubling ${fmtPoint(op.P)}: with y = 0 the tangent is vertical`
          : `${fmtPoint(op.P)} + ${fmtPoint(op.Q)}: the two points are opposite and the line is vertical`;
      } else {
        head = op.kind === 'double'
          ? `Doubling ${fmtPoint(op.P)}: tangent with λ = ${op.lambda}`
          : `${fmtPoint(op.P)} + ${fmtPoint(op.Q)}: chord with λ = ${op.lambda}`;
      }
      let tail = '';
      if (op.vertical && phase === 'result') tail = `, there is no third affine point and ${m} = O`;
      else if (phase === 'third' && op.third) tail = `, which meets the curve again at -R = ${fmtPoint(op.third)}`;
      else if ((phase === 'reflect' || phase === 'result') && op.result) tail = `; the mirror image of -R is R = ${m} = ${fmtPoint(op.result)}`;
      return `${head}${tail}.`;
    },
    done: (k, Q) => `Done: Q = ${k}G = ${fmtPoint(Q)}.`,
  },
  stats: {
    intro: (task, facts) => [
      'The assignment asks to repeat the experiment with different values of k and, if useful, different valid base points, and to explore the statistical properties of the resulting points. For a base point G every k from 1 to n - 1 is used, n being the order of G: beyond n the points repeat, because kG depends only on k modulo n.',
      `Two caveats hold for the whole section. First, the data are not a random sample but the whole population of multiples: the tests are descriptive, and a p-value measures how far the population is from a model, it is not an inference about something larger. Second, the assignment’s curve has ${facts.order} points in total, and even with all base points together there are ${facts.pooledN} observations. This is why section 3.2 repeats the same analyses on curves with the same equation but larger.`,
      'Each analysis has two tests: the one you would run instinctively, which assumes independent observations and is not valid here, and an exact one, which compares the data with random sets or functions that respect the same symmetries (simulations and permutations). The random choices come from a generator with a fixed seed: the page, the downloadable program and the terminal give the same numbers.',
    ],
    taskIntro: (task, n) =>
      `The default base point here is all valid points together: with the assignment’s G = ${fmtPoint(task.G)} alone, of order ${n}, there would be ${n - 1} values of k, too few for any statistic. The selector lets you choose G or any other point of the curve.`,
    extIntro: (exts) => {
      const list = exts.map((e) => `p = ${e.p} (${e.order} points)`).join(', ');
      const parts = [`The same analyses on larger curves y² = x³ + 7: ${list}.`];
      if (exts.every((e) => e.prime)) {
        parts.push('In all of them the number of points is prime: every point other than O generates the whole group, as on secp256k1, and there are no subgroups of different orders to pool.');
      }
      if (exts.every((e) => !e.supersingular && !e.anomalous)) {
        parts.push('None is supersingular (#E ≠ p + 1) or anomalous (#E ≠ p), the two weak cases of section 4.1.');
      }
      return parts.join(' ');
    },
    fieldLabel: 'Field F_p',
    baseLabel: 'Base point',
    pooled: 'all valid base points, together',
    defaultTag: 'default',
    taskTag: 'from the assignment',
    orderWord: 'order',
    pointsShown: (shown, total) => `${shown} points out of ${total} in the selector: on a curve of prime order each one generates the whole group.`,
    summary: (s) =>
      s.pooled
        ? `${s.baseCount} base points, each with every k from 1 to its order minus one: N = ${s.N} observations.`
        : `G = ${fmtPoint(s.G)}, of order n = ${s.n}: N = ${s.N} observations, one for each k from 1 to ${s.n - 1}.`,
    ordersLine: (orders) => `Orders of the base points: ${orders.map(([o, c]) => `${c} of order ${o}`).join(', ')}.`,
    smallSample: (N) => `With N = ${N} the analyses below have very little statistical power: the numbers are reported for completeness, each with its caveat.`,
    distribution: {
      intro: 'How often each value of x and of y occurs. On small curves one bar per value, on large ones one bar per class of consecutive values; the dashed line is what uniform values in [0, p) would give.',
      chartX: 'Distribution of x',
      chartY: 'Distribution of y',
      explain: (s) => {
        const ux = s.uniformity.x;
        const uy = s.uniformity.y;
        const yRule = s.p % 3 === 2
          ? 'for p ≡ 2 (mod 3) every y is possible, because x → x³ is a bijection'
          : `for p ≡ 1 (mod 3) y is possible only if y² - ${s.b} is a cube modulo p, about one value in three`;
        return [
          `The observed x are ${ux.observedValues} distinct values out of ${s.p}, the y ${uy.observedValues}. Not every value can occur: x is the abscissa of a point only if x³ + ${s.b} is a square modulo p, which on the whole curve holds for ${ux.attainable} values out of ${s.p}, about half; the possible y are ${uy.attainable}, because ${yRule}. The empty bars are not statistical bad luck: they are values the function cannot produce.`,
        ];
      },
    },
    frequency: {
      intro: 'The frequency of each individual value of x and of y, then a summary: how many values occur 0, 1, 2, ... times.',
      chartX: 'Frequency per value of x (dashed: N/p)',
      chartY: 'Frequency per value of y (dashed: N/p)',
      tableTitle: 'Frequencies per value',
      colValue: 'Value',
      colX: 'times as x',
      colY: 'times as y',
      tableNote: (p) => `All ${p} values of [0, p).`,
      bigNote: (p) => `With p = ${p} a table of ${p} rows would be unreadable: the chart shows every value, and where a pixel column gathers several values it shows their maximum.`,
      summaryTitle: 'Multiplicity summary',
      summary: (coord, table) => {
        const parts = table
          .map((count, times) => {
            if (!count) return null;
            const what = count === 1 ? '1 value' : `${count} values`;
            const how = times === 0 ? 'never' : times === 1 ? 'once' : times === 2 ? 'twice' : `${times} times`;
            return `${what} ${how}`;
          })
          .filter(Boolean);
        return `${coord}: ${parts.join(', ')}.`;
      },
      explain: (s) => {
        const ux = s.uniformity.x;
        const uy = s.uniformity.y;
        const m = s.correlation.mirror;
        if (s.pooled) {
          return [
            `Pooling base points of different orders, values occur a variable number of times (x from ${ux.minMult} to ${ux.maxMult}, y from ${uy.minMult} to ${uy.maxMult}): the points of large subgroups are counted more often. Within each subgroup the rules of a single base point hold: x in pairs, y single or in triples.`,
          ];
        }
        const out = [];
        out.push(ux.sameMultiplicity && ux.maxMult === 2
          ? `Every observed x occurs exactly twice: kG and (n - k)G = -kG are opposite points, (x, y) and (x, -y), with the same x. It happens in ${m.matches} pairs out of ${m.pairs}.`
          : `The x occur from ${ux.minMult} to ${ux.maxMult} times: the pairs kG and (n - k)G = -kG always share their x (${m.matches} pairs out of ${m.pairs}), and a point with y = 0, if there is one, is its own opposite and occurs once.`);
        out.push(s.p % 3 === 2
          ? `With p ≡ 2 (mod 3), like p = ${s.p}, the map x → x³ is a bijection: for each y there is exactly one x with x³ = y² - ${s.b}, so each y occurs at most once (here from ${uy.minMult} to ${uy.maxMult}).`
          : `With p ≡ 1 (mod 3), like p = ${s.p}, the equation x³ = y² - ${s.b} has zero, one or three solutions, and the three are x, βx and β²x, β being a cube root of unity modulo p. This is why the y occur once or three times (here from ${uy.minMult} to ${uy.maxMult}): another structure a random function would not have. On secp256k1, where p ≡ 1 (mod 3) too, the map (x, y) → (βx, y) is the endomorphism used to speed up computations, and it comes back in section 4.2.`);
        return out;
      },
    },
    bits: {
      intro: 'For each bit position, the share of ones among the distinct values of x and of y. The dashed line is the share expected for a random set of the same size and with the same symmetries as the observed values: for the top bits it is below 1/2 because p is not a power of 2.',
      chartX: 'Bits of x: share of ones per position',
      chartY: 'Bits of y: share of ones per position',
      explain: (s) => {
        const Dx = s.bits.x[0].distinct;
        const Dy = s.bits.y[0].distinct;
        const out = [
          `The shares are computed on the distinct values (${Dx} for x, ${Dy} for y): repeated values carry no new information, they repeat for algebraic reasons. The reference is the same as for the exact uniformity test (section d): sets chosen at random among those with the same symmetries, for which the mean and variance of every share are computed exactly. The z-score therefore assumes no independent observations.`,
        ];
        const describe = (b, c) => (b ? `bit ${b.bit} of ${c} (z = ${EN.num(b.z, 2)})` : `no bit of ${c}`);
        out.push(`The largest deviations from the expectation are ${describe(worstBit(s.bits.x), 'x')} and ${describe(worstBit(s.bits.y), 'y')}; ${count(bitsBeyond(s), 'bit', 'bits')} out of ${2 * s.bitLength} ${bitsBeyond(s) === 1 ? 'is' : 'are'} beyond |z| = 3.`);
        const fixedY = s.bits.y.filter((b) => b.fixed).map((b) => b.bit);
        if (Dy === s.p) {
          out.push('For y all p values occur: the shares are necessarily those of the whole [0, p), and there is nothing to measure.');
        } else if (fixedY.length && s.uniformity.y.symmetry === 'pairs') {
          const t = trailingOnes(s.p);
          const which = fixedY.length === 1 ? `Bit ${fixedY[0]} of y is fixed` : `Bits ${fixedY[0]} to ${fixedY[fixedY.length - 1]} of y are fixed`;
          out.push(`${which} by the symmetry: y and p - y always occur together, and p = ${s.p} is ${s.p.toString(2)} in binary, which ends with ${t === 1 ? 'a 1' : `${t} ones`}, so ${t === 1 ? 'the last digit' : `the last ${t} digits`} of p - y are the complement of those of y. Any set with this symmetry has exactly half ones there: for those bits there is no z-score.`);
        }
        return out;
      },
    },
    uniformity: {
      intro: 'The χ² test compares the counts with those of uniform values in [0, p), over classes of consecutive values: as many as possible (one per value on small curves, at most 32 on large ones) provided each expects at least 5 observations. Two versions, side by side: the one you would run instinctively, on every observation with the χ² distribution as reference, and the exact one, on the distinct values compared with random sets that have the same symmetries.',
      coordTitle: (c) => `Coordinate ${c}`,
      naiveLabel: 'Naive test: every observation',
      distinctLabel: 'Exact test: distinct values',
      status: {
        valid: 'VALID',
        descriptive: 'DESCRIPTIVE',
        invalid: 'NOT VALID',
        na: 'NOT COMPUTABLE',
      },
      statusHelp: {
        valid: 'The assumptions of the test hold.',
        descriptive: 'Exact test, but the data are the whole population: the result describes, it does not generalise.',
        invalid: 'The number is computed, but the assumptions of the test fail: it must not be used to conclude anything.',
        na: 'The test cannot be computed.',
      },
      line: (t) =>
        t.exact
          ? `χ² = ${EN.num(t.chi2, 2)} over ${t.bins} classes${t.perValue ? ', one per value' : ''}; exact p-value ${EN.pval(t.pValue)}, from the comparison with ${t.sims} random sets.`
          : `χ² = ${EN.num(t.chi2, 2)} with ${count(t.df, 'degree', 'degrees')} of freedom over ${t.bins} classes${t.perValue ? ', one per value' : ''}; smallest expected count per class ${EN.num(t.minExpected, 2)}; p-value ${EN.pval(t.pValue)} from the χ² distribution.`,
      reasons: {
        'small-sample': (t) =>
          t.computable
            ? `With N = ${t.N} observations not even two classes reach 5 expected observations: the χ² approximation does not hold.`
            : `With N = ${t.N} there is nothing to compare.`,
        duplicates: (t, u) =>
          `The observations are not independent: each value occurs ${u.sameMultiplicity ? `exactly ${u.maxMult} times` : `${u.minMult} to ${u.maxMult} times`} for algebraic reasons, so the counts are fixed multiples and the statistic is inflated roughly by that factor.`,
        exhaustive: (t) =>
          t.exact
            ? 'The data are the whole population, not a sample. The reference is the same construction done at random: sets with the same number of values and the same symmetries, drawn without replacement. The p-value is the share of these sets whose statistic is at least as far from uniform: exact up to the Monte Carlo error, with no χ² approximation and no assumption of independence.'
            : 'The data are the whole population of multiples, not a random sample: the p-value describes how far the population is from uniform, it is not an inference about something larger.',
        orbits: (t) =>
          t.symmetry === 'pairs'
            ? 'The y come in pairs: the subgroup contains -P with every P, so y and p - y always occur together. The random reference sets are made of pairs {y, p - y} too.'
            : 'The x come in triples: for p ≡ 1 (mod 3), with (x, y) the point (βx, y) is on the curve too, β being a cube root of unity, so x, βx and β²x occur together. The random reference sets are made of triples too.',
        'low-power': (t) => `With only ${t.N} distinct values the test is exact but has no power: it could not reject even a clearly non-uniform set.`,
        'all-values': (t, u, s) => `All ${s.p} values of [0, p) occur: the set of distinct values is uniform by construction and there is nothing left to test.`,
      },
      verdict: (t) => {
        if (t.tooRegular) return `Reading: the statistic is smaller than almost every reference set would give (left tail ${EN.pval(t.leftTail)}): the values are spread over the classes more regularly than chance. Among several tests such a value can happen: compare it with the other curves.`;
        if (t.verdict === 'reject') return `Reading: such a large deviation is rare among the reference sets (p-value ${EN.pval(t.pValue)}): at class level the values do not look uniform.`;
        return `Reading: such a deviation is entirely normal among the reference sets (p-value ${EN.pval(t.pValue)}): at class level the values look uniform.`;
      },
      noVerdict: 'Reading: no conclusion, the test is not valid for the reasons above.',
      why: (s, coord) => {
        const u = s.uniformity[coord];
        const d = u.distinct;
        if (!d.computable) return null;
        if (d.reasons.includes('low-power')) {
          return `The real limit is size: ${u.observedValues} distinct values are too few for any uniformity test. The result says neither that the function is uniform nor that it is not.`;
        }
        if (d.verdict === 'reject') {
          return `The possible values are constrained by the curve (${u.attainable} out of ${s.p}) and the subgroup covers a part of them that is not evenly spread.`;
        }
        const share = coord === 'x' ? 'about half' : s.p % 3 === 2 ? 'all' : 'about a third';
        return `Why it looks uniform: the reachable values, ${share} of [0, p), are spread over the interval like a random set with the same symmetries. The structure is not in where they fall but in which ones are possible, in how many times they occur (pairs and triples) and in the symmetries themselves: things a class-based test does not see, and that the naive test mistakes for a lack of uniformity.`;
      },
    },
    correlation: {
      intro: 'Two levels. On values: the Pearson (linear) and Spearman (rank) correlation between k and the coordinates of the point. On bits: for each bit of k and each bit of x and of y, the φ coefficient, that is Pearson on 0/1 variables. If the output did not depend on k, every φ would have standard deviation exactly 1/√(N - 1): |φ| > 3/√(N - 1) is unusual, but over many cells a few cross it by chance.',
      colMeasure: 'Measure',
      colValue: 'Value',
      rows: {
        pearsonKX: 'Pearson r(k, x)',
        pearsonKY: 'Pearson r(k, y)',
        spearmanKX: 'Spearman ρ(k, x)',
        spearmanKY: 'Spearman ρ(k, y)',
        mirror: 'x(kG) = x((n - k)G)',
        homomorphism: '(k1 + k2)G = k1G + k2G',
      },
      pairsValue: (m) => `${m.matches} pairs out of ${m.pairs}`,
      trialsValue: (h) => `true in ${h.holds} trials out of ${h.trials}`,
      undefinedWhy: 'n/a means not defined: at least 3 values and non-constant variables are needed.',
      heatmapTitle: (range) => `φ between the bits of k (rows) and the bits of x and of y (columns): red positive, blue negative, grey not defined. The scale goes from -${EN.short(range)} to +${EN.short(range)}, about 4/√N.`,
      kBits: 'bits of k',
      explain: (s) => {
        const c = s.correlation;
        const b = c.bits;
        const out = [];
        const symmetricK = !s.pooled || (s.orders && s.orders.length === 1);
        if (c.pearsonKX !== null && symmetricK && c.mirror.pairs > 0 && c.mirror.matches === c.mirror.pairs) {
          out.push(`r(k, x) = ${EN.num(c.pearsonKX)} and ρ(k, x) = ${EN.num(c.spearmanKX)} do not mean independence: x is a symmetric function of k, because x(kG) = x((n - k)G), and the correlation between k and a function of it symmetric about n/2 is zero by construction, linear or on ranks. Yet x is completely determined by k: zero correlation does not mean independence.`);
        }
        if (!b.defined) {
          out.push('No cell of the matrix is defined: with so few values every bit is constant.');
          return out;
        }
        out.push(`Bit matrix: largest |φ| ${EN.num(b.maxAbs)}, mean ${EN.num(b.meanAbs)}, threshold 3/√(N - 1) = ${EN.num(b.threshold)}. Cells beyond the threshold: ${b.above} out of ${b.defined}, against ${EN.num(b.expectedAbove, 1)} on average over the permutations of the test.`);
        if (b.pValue !== null) {
          out.push(`Global permutation test: the statistic N·Σφ² = ${EN.num(b.statistic, 1)} is compared with that of ${b.sims} random reassignments of the outputs to the values of k, which break any link between input and output and leave every other property of the data unchanged. Exact p-value, up to the Monte Carlo error: ${EN.pval(b.pValue)}.`);
        }
        if (s.pooled && b.maxAbs === 0) {
          out.push('Every φ is exactly zero, by construction: on a curve of prime order, pooling all base points, for each k the points kG run over the whole group, so the distribution of the output does not depend on k at all. This independence comes from averaging over every G, not from the map k → kG for a fixed G.');
        } else if (s.pooled && b.pValue !== null && b.pValue < 0.05) {
          out.push('The test rejects independence, but for a reason that concerns the pooling and not k → kG: with subgroups of different orders, large values of k exist only in the large subgroups, which contain different points, so the high bits of k tell which subgroup the point comes from.');
        } else if (b.pValue !== null && b.pValue < 0.05) {
          out.push('The test rejects independence: on such a small group the structure of the multiples shows even at the level of single bits.');
        } else if (b.pValue !== null) {
          out.push('The test finds no link between single bits: at bit level k and kG look independent, even though kG is a deterministic and strongly structured function of k. This is the limit of such measures: they only see linear dependences between pairs of bits.');
        }
        if (s.smallSample) out.push(`With N = ${s.N} these estimates are very unstable.`);
        return out;
      },
    },
    avalanche: {
      intro: 'Flip one bit of k and count how many bits of x and y change. Every pair {k, k with the bit flipped} is counted once, and only if both values lie between 1 and n - 1. For an ideal hash function each output bit would change with probability 1/2; here the output is a value in [0, p), so the ideal reference for each bit is 2q(1 - q), q being the share of ones expected for that bit among uniform values in [0, p).',
      chartTitle: 'Output bits changed by flipping one bit of k: how many pairs for each number of bits (dashed: ideal reference)',
      heatmapTitle: () => 'Avalanche matrix: for each flipped bit of k (rows) and each bit of x and of y (columns), how far the rate of change is from that of the reference functions of the exact test, in standard deviations. Red: changes more often; blue: less often. The scale goes from -4 to +4.',
      kBits: 'flipped bit of k',
      none: 'Inside the subgroup no two values of k differ by a single bit: the avalanche effect cannot be measured.',
      naiveLabel: 'Naive test: independent measurements',
      exactLabel: 'Exact test: functions with the same symmetry',
      naiveLine: (a) =>
        `Σz² = ${EN.num(a.naive.z2, 1)} over ${count(a.naive.cells, 'cell', 'cells')} against the ideal reference; cells beyond 3σ: ${a.naive.above}, expected ${EN.num(a.naive.expectedAbove, 1)}; p-value ${EN.pval(a.naive.pValue)} from the χ² distribution.`,
      naiveReasons: (s) => [
        `The measurements are not independent. The pair {kG, (k + 2^i)G} and its mirror {(n - k - 2^i)G, (n - k)G} = {-(k + 2^i)G, -kG} have the same x, and in ${EN.pct(s.avalanche.mirrorShareAll)} of the cases both are counted: the same measurement enters twice. Moreover, different pairs share a point.`,
        'The reference 2q(1 - q) holds for uniform values in [0, p), while the outputs are points of the curve: not every value is possible.',
        s.pooled ? 'Pooling the base points, the same pairs of points come back for many different G.' : null,
      ].filter(Boolean),
      exactLine: (a) =>
        `Σz² = ${EN.num(a.exact.statistic, 1)} over ${count(a.exact.cells, 'cell', 'cells')}, standardised with the mean and standard deviation of ${a.exact.sims} reference functions; cells beyond 3σ: ${a.exact.above}, ${EN.num(a.exact.expectedAbove, 1)} on average for the reference functions; exact p-value ${EN.pval(a.exact.pValue)}.`,
      exactReasons: (s) => [
        `The reference functions have the same image, the same symmetry f(n - k) = -f(k) and the same pairs of k as k → kG: only which pair of opposite points {P, -P} goes to which pair {k, n - k}, and with which sign, changes at random${s.pooled ? ', subgroup by subgroup' : ''}. The dependence between the measurements is in the reference too, so no correction is needed.`,
        'The data are the whole population of pairs: the p-value describes how typical the observed matrix is among the functions with the same structure.',
      ],
      exactVerdict: (s) => {
        const e = s.avalanche.exact;
        return e.pValue < 0.05
          ? `Reading: the observed matrix is farther from the reference than almost every function with the same structure (p-value ${EN.pval(e.pValue)}): there is structure beyond the symmetry.`
          : `Reading: the matrix is typical of a random function with the same symmetry (p-value ${EN.pval(e.pValue)}): at bit level, k → kG behaves as if it had an avalanche effect.`;
      },
      explain: (s) => {
        const a = s.avalanche;
        if (!a.measurements) return [en.stats.avalanche.none];
        const out = [
          `Over ${a.measurements} pairs, on average ${EN.pct(a.meanFraction)} of the ${a.outputBits} output bits change, against ${EN.pct(a.idealMeanFraction)} for the ideal reference; the deviation of a cell from the ideal is at most ${EN.num(a.maxDev)}, ${EN.num(a.meanDev)} on average.`,
        ];
        const naive = a.naive.pValue;
        const exact = a.exact.pValue;
        if (exact === null) return out;
        if (naive !== null && naive < 0.05 && exact >= 0.05) {
          out.push(`The comparison between the two tests is the result: the naive one rejects (p-value ${EN.pval(naive)}), the exact one does not (p-value ${EN.pval(exact)}). What the naive test sees is not a lack of avalanche but dependence between the measurements: taking it into account, the matrix is that of a random function with the same symmetry.`);
        } else if (s.pooled && exact < 0.05) {
          out.push(`The exact test rejects too, for a reason that concerns the pooling: for fixed k and i, as G varies the pair (kG, (k + 2^i)G) is (P, rP) with r = (k + 2^i)/k modulo n, and different combinations of k and i with the same r give the same pairs of points in every subgroup. The reference functions, shuffled subgroup by subgroup, do not have this repetition.${s.orders && s.orders.length > 1 ? ' With subgroups of different orders, moreover, each row mixes groups of different sizes.' : ''}`);
        } else if (exact < 0.05) {
          out.push('The exact test rejects too: on such a small group the structure shows in the bits as well, because flipping bit i of k (from 0 to 1) always means adding the same point 2^i·G.');
        }
        if (s.smallSample) out.push(`With N = ${s.N} these estimates are very unstable.`);
        return out;
      },
    },
  },
  discussion: {
    definitions: [
      {
        term: 'One-way function.',
        body: 'A function f is one-way if it is computable in polynomial time and, for every probabilistic polynomial-time adversary A, the probability that A, given f(x) for a random x, finds any preimage is negligible in the security parameter. No function is proven to be one: the existence of one-way functions would imply P ≠ NP. Scalar multiplication k → kG on a group of prime order n is a candidate, and its security is an assumption: the hardness of the ECDLP.',
      },
      {
        term: 'How hard the ECDLP is.',
        body: 'Generic attacks, baby-step giant-step and Pollard’s rho, take about √n group operations, and in the generic group model at least Ω(√n) are needed (Shoup, 1997). For secp256k1 n ≈ 2^256, hence about 2^128 operations: its 128-bit security level. Then there are attacks that exploit structure: Pohlig-Hellman reduces the problem to the largest prime factor of n; MOV and Frey-Rück transfer it to a discrete logarithm in the multiplicative group of an extension F_(p^m), easy when the embedding degree m is small, as on supersingular curves (m ≤ 2 for p > 3); Smart, Satoh-Araki and Semaev solve it in polynomial time on anomalous curves, those with #E = p.',
      },
      {
        term: 'Cryptographic hash function.',
        body: 'H: {0,1}* → {0,1}^ℓ compresses inputs of any length into a fixed-length output, with preimage, second-preimage and collision resistance (Rogaway and Shrimpton, 2004). In practice it is also expected to behave like a random oracle (Bellare and Rogaway, 1993), an idealisation no concrete function truly achieves (Canetti, Goldreich and Halevi, 1998). The avalanche effect (Feistel, 1973) and the Strict Avalanche Criterion (Webster and Tavares, 1985) are design criteria needed for that behaviour, not definitions of security.',
      },
      {
        term: 'Statistical tests and security.',
        body: 'A statistical test is a distinguisher: passing it only means that this distinguisher fails. For pseudorandomness, that is indistinguishability from uniform values for every efficient distinguisher, passing the tests is necessary but never sufficient. For a one-way function it is neither necessary nor sufficient: if g is one-way, f(x1, x2) = (g(x1), x2) still is, although it copies half of its input into the output, and so is f(x) = g(x) ‖ 0, with an output bit always zero; conversely a public permutation, such as AES with a known key, passes every test battery and is inverted in an instant.',
      },
    ],
    propertiesIntro: (T, E) =>
      `The six properties listed in the assignment, one per row: their role for a one-way function, their role for a hash function, and what the data on this page show. The Observed column uses the assignment’s curve with all base points (N = ${T.N}) and the curve chosen in 3.2 (p = ${E.p}, ${E.pooled ? 'all base points' : `G = ${fmtPoint(E.G)}`}, N = ${E.N}).`,
    colProperty: 'Property',
    colOwf: 'One-way function',
    colHash: 'Hash function',
    colObserved: 'Observed',
    rows: [
      {
        key: 'distribution',
        name: 'Distribution of x and y',
        owf: 'Not required: the definition only asks that inversion be hard, and the output may have any distribution, even one concentrated on half of the values.',
        hash: 'Required: an output distinguishable from uniform breaks the random-oracle behaviour and lowers the entropy of identifiers.',
      },
      {
        key: 'frequency',
        name: 'Frequency of individual values',
        owf: 'It matters in one case: a very frequent value is inverted by picking any of its preimages. k → kG is injective on [1, n - 1], so each point has exactly one preimage.',
        hash: 'Collision resistance matters: no pair of inputs with the same output may be findable.',
      },
      {
        key: 'bits',
        name: 'Distribution of bits',
        owf: 'Irrelevant: g(x) ‖ 0 is one-way with a bit always zero.',
        hash: 'Each output bit must be 1 with probability 1/2: an unbalanced bit is already a distinguisher.',
      },
      {
        key: 'uniformity',
        name: 'Apparent uniformity',
        owf: 'Neither necessary nor sufficient.',
        hash: 'Necessary, not sufficient: it is the coarse-grained version of indistinguishability from a random oracle.',
      },
      {
        key: 'correlation',
        name: 'Correlations between input and output',
        owf: 'Only a relation that helps inversion matters. Here the structure is there (homomorphism, symmetry), but as far as we know it is worth at most a constant factor on generic attacks.',
        hash: 'No correlation and no algebraic relation between the outputs of related inputs.',
      },
      {
        key: 'avalanche',
        name: 'Avalanche effect',
        owf: 'Not required: in (g(x1), x2) flipping a bit of x2 changes a single output bit.',
        hash: 'Required as a design criterion: each output bit must change with probability 1/2 when any input bit is flipped.',
      },
    ],
    observed: {
      distribution: (T, E) =>
        `${T.uniformity.x.observedValues} distinct x out of ${T.p} on the assignment’s curve, ${E.uniformity.x.observedValues} out of ${E.p} with p = ${E.p}: only the values with x³ + ${E.b} a square modulo p, about half.`,
      frequency: (T, E) =>
        `The x collide in pairs (${E.correlation.mirror.matches} pairs out of ${E.correlation.mirror.pairs} with p = ${E.p}), the y ${E.p % 3 === 1 ? 'in triples' : 'never'}. The whole point never repeats for k in [1, n - 1].`,
      bits: (T, E) =>
        `With p = ${E.p}, ${count(bitsBeyond(E), 'bit', 'bits')} out of ${2 * E.bitLength} beyond |z| = 3 against random sets with the same symmetries; the low bits of y are fixed by the symmetry y ↔ p - y.`,
      uniformity: (T, E) => {
        const d = E.uniformity.x.distinct;
        const dy = E.uniformity.y.distinct;
        if (!d.computable) return EN.na;
        return `Exact test on the distinct values with p = ${E.p}: p-value ${EN.pval(d.pValue)} for x and ${EN.pval(dy.pValue)} for y, against random sets with the same symmetries; the naive test, which ignores the repeated values, is not valid. On the assignment’s curve the values are too few for a test to have power.`;
      },
      correlation: (T, E) =>
        `r(k, x) = ${EN.num(E.correlation.pearsonKX)} by symmetry; bitwise φ with p = ${E.p}: ${count(E.correlation.bits.above, 'cell', 'cells')} beyond 3/√(N - 1) out of ${E.correlation.bits.defined} (${EN.num(E.correlation.bits.expectedAbove, 1)} on average by chance), permutation test p-value ${EN.pval(E.correlation.bits.pValue)}. Homomorphism true in ${E.homomorphism.holds} trials out of ${E.homomorphism.trials}.`,
      avalanche: (T, E) => {
        const a = E.avalanche;
        return `With p = ${E.p} on average ${EN.pct(a.meanFraction)} of the bits change (ideal ${EN.pct(a.idealMeanFraction)}); avalanche matrix: exact test p-value ${EN.pval(a.exact.pValue)}, against ${EN.pval(a.naive.pValue)} for the naive test, which ignores the dependence between the measurements.`;
      },
    },
    propertiesAfter: [
      'The properties that make k → kG useful as a one-way function are not in the table: efficient forward computation (section 1.4), hard inversion (section 4.3) and the group structure that signatures and key exchange rest on. None of the six statistics measures them.',
      'The observed structure is not harmless in principle, but as far as we know it is in practice. The symmetry P → -P, which produces the x in pairs, and the automorphism (x, y) → (βx, y), which produces the y in triples when p ≡ 1 (mod 3) as on secp256k1, let Pollard’s rho work on classes of 6 points instead of single points, a gain of √6 (Duursma, Gaudry and Morain, 1999): on secp256k1 from about 2^128 to about 2^127 operations. A constant gain, not an asymptotic one: the structure the statistics see is worth less than 1.3 bits of security.',
    ],
    inversion: (ctx) => {
      const out = [
        `Knowing only G and Q, trying G, 2G, 3G, ... finds Q after ${ctx.tries} attempts: k ≡ ${ctx.kmod} (mod ${ctx.n}). This is exhaustive search, which costs n attempts in the worst case; the best generic methods, baby-step giant-step and Pollard’s rho, need about √n, here ${Math.ceil(Math.sqrt(ctx.n))}.`,
      ];
      const notes = [];
      if (!ctx.nPrime) notes.push(`the order of G, n = ${ctx.nFactors}, is not prime, and Pohlig-Hellman reduces the problem to logarithms in subgroups of prime order, the largest of which has ${ctx.nLargest} elements`);
      if (ctx.facts.supersingular) notes.push(`the curve is supersingular (#E = p + 1 = ${ctx.facts.order}), and the MOV attack moves the problem to the multiplicative group of F_(p²), where subexponential algorithms exist`);
      if (ctx.facts.anomalous) notes.push('the curve is anomalous (#E = p), and Smart’s attack solves it in polynomial time');
      if (notes.length) out.push(`The chosen curve also has structural shortcuts: ${notes.join('; ')}. A toy curve does not need them, but they are exactly why real curves have prime order and a large embedding degree.`);
      out.push('On secp256k1 the subgroup has about 1.16 × 10^77 points. Even Pollard’s rho, which needs about √n steps instead of n, would need about 3.4 × 10^38: at 10^12 steps per second that is about 10^19 years. What makes the function one-way is the size of the group and the absence of exploitable structure, not the formula, which is the same as on the toy curve.');
      return out;
    },
    inversionInfinity: 'Q = O: there is nothing to invert, k is a multiple of the order of G.',
    conclusion: [
      'Elliptic-curve scalar multiplication is a candidate one-way function, not a hash function. It shares with hash functions determinism, easy forward computation and hard inversion, which is what the assignment means by "shares some properties". But it is a structured bijection: a group homomorphism, whose points are about p of the p² possible pairs (x, y), whose x cover about half of [0, p) and collide in pairs. That very structure is what makes it useful: ECDSA signatures and Diffie-Hellman key exchange rest on the homomorphism. A hash function with the same property would be broken, since from H(a) and H(b) one could compute H(a + b).',
      'The statistics confirm this without being able to prove it. With the exact tests, the distinct values of x and y are indistinguishable from random sets with the same symmetries, the bits are as expected, the bitwise correlation is compatible with zero and the avalanche matrix is typical of a random function with the same symmetry. The structure lies elsewhere: which values are possible, how many times they occur (pairs and triples), the symmetries y ↔ p - y and x → βx and the homomorphism, true in every trial; and the naive tests, which ignore these dependences, mistake it for a lack of randomness. None of these measures says how hard the function is to invert: that is a computational property, not a statistical one, and on toy curves it is false.',
      'This is why Ethereum combines the two. The public key Q = kG comes from the one-way function; the address is the last 20 bytes of Keccak-256(x ‖ y), a hash applied to the structured point to get a short, uniform identifier. And the collision of the x shows up in signatures: ECDSA only uses r = x(R) mod n, and R and -R share their x, so (r, s) and (r, n - s) are both valid. Ethereum blocks this malleability with EIP-2, which only accepts s ≤ n/2, and adds to the signature the recovery id v, the bit that says which of the two points with that x to use to rebuild the public key. In the same way the secret of an elliptic-curve Diffie-Hellman exchange goes through a key-derivation function before it becomes a key.',
    ],
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: it opens with a double click on index.html, even offline. With node homework1.js [k] [p] it prints the sequence, the public key and the statistics in a terminal.',
    contents: 'Contents: index.html, style.css, homework1.js (computations and statistics), app.js (interface and texts), README.txt.',
    zip: 'Download homework1.zip',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'From a private key to a public key: elliptic-curve scalar multiplication, as in Ethereum.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
    noscript: 'This program needs JavaScript.',
  },
};

const HW1_TEXTS = { it, en };

return { originalAssignment, HW1_TEXTS };
})();

(function () {
'use strict';

// src/pages/statistics/hw1/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework1.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nel campo k puo' diventare markup.
const hw = Homework1;
const view = view$;
const { HW1_TEXTS, originalAssignment } = texts$;

const TASK = hw.TASK;
const TASK_CURVE = hw.explorationCurve(TASK.p);
const EXT_LAST = hw.EXTENSION_PRIMES[hw.EXTENSION_PRIMES.length - 1];
const SPEEDS = [0.25, 0.5, 1, 2, 4];
const HEADINGS = ['h2', 'h3', 'h4'];
const LANGUAGES = ['it', 'en'];
const fmt = hw.formatPoint;
const pointKey = (P) => `${P.x},${P.y}`;

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#161616',
    text: '#d6d6d6',
    muted: '#4a4a4a',
    grid: '#262626',
    subgroup: '#7986cb',
    operandP: '#ff6b81',
    operandQ: '#f0a500',
    line: '#4fd1b5',
    third: '#9ccc65',
    result: '#ff6b81',
    heatNegative: '#5b8def',
    heatZero: '#1e1e1e',
    heatPositive: '#ff6b81',
    heatNull: '#3a3a3a',
  },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const palette = () => (darkQuery.matches ? PALETTES.dark : PALETTES.light);

// ---------------------------------------------------------------------------
// Stato e preferenze
// ---------------------------------------------------------------------------

function initialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (LANGUAGES.includes(fromUrl)) return fromUrl;
  try {
    const saved = window.localStorage.getItem('hw1-lang');
    if (LANGUAGES.includes(saved)) return saved;
  } catch {
    // file:// o navigazione privata: nessuna preferenza salvata
  }
  return 'it';
}

const state = {
  lang: initialLanguage(),
  p: TASK.p,
  gKey: pointKey(TASK.G),
  kText: String(TASK.k),
  k: TASK.k,
  method: 'double-and-add',
  speed: 1,
  taskBase: 'pooled',
  extP: EXT_LAST,
  extBase: pointKey(hw.defaultBasePoint(hw.explorationCurve(EXT_LAST))),
};
let text = HW1_TEXTS[state.lang];
let animation = null;
const regions = {};
const controls = {};
const results = new Map();
const tokens = { task: 0, ext: 0 };

const taskFacts = { ...view.curveFacts(TASK_CURVE), pooledN: view.pooledSize(TASK_CURVE) };
const taskOrder = hw.pointOrder(TASK.G, TASK_CURVE);
const taskOptions = view.basePointOptions(TASK_CURVE, { pooled: true });
const extFacts = hw.EXTENSION_PRIMES.map((q) => view.curveFacts(hw.explorationCurve(q)));

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
const label = (caption, field) => h('label', null, h('span', { text: caption }), field);
const pending = () => h('p', { class: 'note pending', role: 'status', text: text.ui.computing });

// The width of every chart comes from the ResizeObserver, measured after
// layout: reading clientWidth right after another chart has been resized
// would make the browser lay out the whole page again, once per chart. The
// height is set at once, the drawing happens a few milliseconds per frame.
const charts = new Map(); // canvas -> { draw, data, width }
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

function figure(caption, draw, data, wide = false) {
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': caption });
  charts.set(canvas, { draw, data, width: -1 });
  resizer.observe(canvas);
  return h('figure', { class: wide ? 'figure wide' : 'figure' }, canvas, h('figcaption', { text: caption }));
}

/** Replaces the content of a region, releasing the charts it contained. */
function fill(region, ...nodes) {
  for (const canvas of region.querySelectorAll('canvas.chart')) {
    resizer.unobserve(canvas);
    charts.delete(canvas);
  }
  region.replaceChildren(...nodes.flat(Infinity).filter((n) => n !== null && n !== undefined && n !== false));
}

function redrawAll() {
  for (const [canvas, chart] of charts) {
    if (chart.width > 0) chart.draw(canvas, { ...chart.data, width: chart.width }, palette());
  }
  if (animation) animation.setPalette(palette());
}

function select(options, value, onChange) {
  const el = h('select', { onchange: (e) => onChange(e.target.value) }, options.map((o) => h('option', { value: o.value, text: o.label })));
  el.value = value;
  return el;
}

function setOptions(el, options, value) {
  el.replaceChildren(...options.map((o) => h('option', { value: o.value, text: o.label })));
  el.value = value;
}

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  const blocks = originalAssignment(TASK).map((block) => {
    if (block.type === 'title' || block.type === 'heading') return h('p', null, h('strong', { text: block.text }));
    if (block.type === 'list') return h('ul', null, block.items.map((item) => h('li', { text: item })));
    if (block.type === 'lines') return h('p', null, block.lines.map((line, j) => (j ? [h('br'), line] : line)));
    return h('p', { text: block.text });
  });
  return h(
    'section',
    { class: 'section' },
    title('hw1-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro(TASK)),
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
// 1. TASK
// ---------------------------------------------------------------------------

function pointOptions(curve) {
  return view.basePointOptions(curve).map((o) => ({
    value: o.value,
    label: `${fmt(o.point)}, ${text.setup.orderWord} ${o.order}${curve.p === TASK.p && hw.samePoint(o.point, TASK.G) ? ` (${text.setup.taskTag})` : ''}`,
  }));
}

function syncTaskControls() {
  const curve = hw.explorationCurve(state.p);
  controls.p.value = String(state.p);
  setOptions(controls.g, pointOptions(curve), state.gKey);
  controls.k.value = state.kText;
}

function restore() {
  state.p = TASK.p;
  state.gKey = pointKey(TASK.G);
  state.kText = String(TASK.k);
  state.k = TASK.k;
  syncTaskControls();
  updateTask();
}

function taskSection() {
  const t = text;
  controls.p = select(view.VIZ_PRIMES.map((q) => ({ value: String(q), label: `p = ${q}` })), String(state.p), (value) => {
    const next = Number(value);
    state.p = view.VIZ_PRIMES.includes(next) ? next : TASK.p;
    state.gKey = pointKey(hw.defaultBasePoint(hw.explorationCurve(state.p)));
    syncTaskControls();
    updateTask();
  });
  controls.g = select([], state.gKey, (value) => {
    if (view.basePointOptions(hw.explorationCurve(state.p)).some((o) => o.value === value)) state.gKey = value;
    updateTask();
  });
  controls.k = h('input', {
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    spellcheck: 'false',
    maxlength: view.K_INPUT_MAX_LENGTH,
    'aria-describedby': 'k-help',
    oninput: (e) => {
      state.kText = e.target.value.slice(0, view.K_INPUT_MAX_LENGTH);
      const parsed = view.parseK(state.kText);
      if (parsed.ok) state.k = parsed.value;
      updateTask();
    },
  });
  regions.taskState = h('div');
  regions.multiples = h('div');
  regions.fast = h('div');
  regions.key = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw1-task', 0, t.sections.task),
    title('hw1-setup', 1, t.sections.setup),
    h('div', { class: 'controls' }, label(t.setup.fieldLabel, controls.p), label(t.setup.baseLabel, controls.g), label(t.setup.keyLabel, controls.k)),
    regions.taskState,
    title('hw1-addition', 1, t.sections.addition),
    h('p', { text: t.addition.intro }),
    h('pre', { class: 'formulas', text: t.addition.formulas(TASK).join('\n') }),
    h('p', { text: t.addition.note }),
    title('hw1-multiples', 1, t.sections.multiples),
    h('p', { text: t.multiples.intro }),
    regions.multiples,
    title('hw1-fast', 1, t.sections.fast),
    regions.fast,
    title('hw1-public-key', 1, t.sections.publicKey),
    h('p', { text: t.publicKey.intro }),
    regions.key,
    h('p', { text: t.publicKey.ethereum }),
  );
}

function table(headers, rows, className = 'table') {
  return h(
    'table',
    { class: className },
    h('thead', null, h('tr', null, headers.map((x) => h('th', { text: x })))),
    h('tbody', null, rows.map((cells) => h('tr', null, cells.map((x) => h('td', { text: x }))))),
  );
}

function updateTask() {
  const t = text;
  const curve = hw.explorationCurve(state.p);
  const points = hw.curvePoints(curve);
  const G = view.parseBase(state.gKey);
  const n = hw.pointOrder(G, curve);
  const { k } = state;
  const subgroup = new Set(hw.multiples(n - 1, G, curve).map((s) => pointKey(s.point)));
  const daa = hw.doubleAndAdd(k, G, curve);
  const Q = daa.result;
  const parsed = view.parseK(state.kText);
  const isTask = state.p === TASK.p && hw.samePoint(G, TASK.G) && k === TASK.k;

  let kError = null;
  if (!parsed.ok) {
    if (parsed.error === 'notInteger') kError = t.setup.kError.notInteger(state.kText.trim());
    else if (parsed.error === 'range') kError = t.setup.kError.range(view.K_MAX);
    else kError = t.setup.kError.empty;
  }
  controls.k.setAttribute('aria-invalid', String(Boolean(kError)));

  fill(
    regions.taskState,
    h('p', { id: 'k-help', class: kError ? 'field-error' : 'note', role: kError ? 'alert' : null, text: kError ? `${kError} ${t.setup.kError.fallback(k)}` : t.setup.kHint(view.K_MAX) }),
    h(
      'p',
      { class: isTask ? 'badge-line is-task' : 'badge-line is-custom' },
      h('span', { text: isTask ? t.setup.taskBadge(TASK) : t.setup.customBadge(TASK) }),
      isTask ? null : h('button', { type: 'button', class: 'btn alt', onclick: restore, text: t.setup.restore }),
    ),
    h('p', { text: t.setup.curveSummary(state.p, curve.b, points.length + 1, n) }),
    h('p', { class: 'table-title' }, h('strong', { text: t.setup.pointsTitle })),
    h(
      'p',
      { class: 'chips' },
      points.map((P) => {
        const classes = ['chip'];
        if (subgroup.has(pointKey(P))) classes.push('in-subgroup');
        if (hw.samePoint(P, G)) classes.push('is-g');
        if (Q && hw.samePoint(P, Q)) classes.push('is-q');
        return h('span', { class: classes.join(' '), text: fmt(P) });
      }),
    ),
    h('p', { class: 'note', text: t.setup.pointsLegend }),
  );

  const m = t.multiples;
  fill(
    regions.multiples,
    k <= view.LIST_LIMIT
      ? table(
        [m.colMultiple, m.colPoint, m.colOperation, m.colLambda],
        hw.multiples(k, G, curve).map((s) => [`${s.i}G`, fmt(s.point), m.kinds[s.vertical ? 'inverse' : s.kind], s.lambda === null ? '' : String(s.lambda)]),
      )
      : h('p', { class: 'note', text: m.tooMany(k, view.LIST_LIMIT) }),
    h('p', { class: 'table-title' }, h('strong', { text: m.printedTitle })),
    h('pre', { class: 'output', text: hw.reportLines(k, G, curve).join('\n') }),
  );

  const f = t.fast;
  fill(
    regions.fast,
    h('p', { text: f.intro(k, daa.bits, daa.steps.length) }),
    table(
      [f.colBit, f.colOperation, f.colR, f.colPoint],
      daa.steps.map((s) => [`${s.bitIndex} (${s.bit})`, f.ops[s.op], `${s.multiple}G`, fmt(s.result)]),
    ),
  );

  fill(
    regions.key,
    h(
      'div',
      { class: 'key' },
      h('span', { text: t.publicKey.label }),
      h('strong', { text: `Q = ${k}G = ${fmt(Q)}` }),
      Q === null ? h('small', { text: t.publicKey.infinity }) : null,
    ),
  );

  rebuildAnimation(curve, G, k, Q);
  updateInversion(curve, G, k, n, Q);
}

// ---------------------------------------------------------------------------
// 2. OPTIONAL - GURU LEVEL
// ---------------------------------------------------------------------------

const animationResizer = new ResizeObserver(() => {
  if (animation) animation.redraw();
});

function guruSection() {
  regions.guru = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw1-guru', 0, text.sections.guru),
    h('p', { text: text.guru.intro }),
    h('p', { class: 'note', text: text.guru.vizNote(view.VIZ_PRIMES) }),
    regions.guru,
  );
}

function rebuildAnimation(curve, G, k, Q) {
  if (animation) {
    animation.destroy();
    animation = null;
  }
  animationResizer.disconnect();
  const g = text.guru;
  const bits = k.toString(2);
  const canvas = h('canvas', { class: 'chart anim', role: 'img', 'aria-label': text.sections.guru });
  const caption = h('p', { class: 'caption', 'aria-live': 'polite' });
  const bitsLine = h('p', { class: 'bits', 'aria-label': `${g.bitsLabel}: ${bits}` }, bits.split('').map((b) => h('span', { class: 'bit', text: b })));
  const play = h('button', {
    type: 'button',
    class: 'btn',
    text: g.play,
    onclick: () => (animation.playing ? animation.pause() : animation.play()),
  });
  const method = select(
    [
      { value: 'double-and-add', label: g.methodDouble },
      { value: 'repeated', label: g.methodRepeated },
    ],
    state.method,
    (value) => {
      state.method = value === 'repeated' ? 'repeated' : 'double-and-add';
      rebuildAnimation(curve, G, k, Q);
    },
  );
  const speed = select(SPEEDS.map((s) => ({ value: String(s), label: `${s}×` })), String(state.speed), (value) => {
    state.speed = SPEEDS.includes(Number(value)) ? Number(value) : 1;
    animation.setSpeed(state.speed);
  });
  fill(
    regions.guru,
    h(
      'div',
      { class: 'controls' },
      label(g.methodLabel, method),
      label(g.speedLabel, speed),
      h(
        'span',
        { class: 'buttons' },
        play,
        h('button', { type: 'button', class: 'btn alt', text: g.step, onclick: () => animation.step() }),
        h('button', { type: 'button', class: 'btn alt', text: g.reset, onclick: () => animation.reset() }),
      ),
    ),
    state.method === 'double-and-add' ? bitsLine : null,
    canvas,
    caption,
  );
  const onUpdate = (status) => {
    play.textContent = status.playing ? g.pause : g.play;
    if (status.done) caption.textContent = g.done(k, Q);
    else if (status.op) caption.textContent = `${g.progress(status.opIndex + 1, status.opCount, g.phases[status.phase])}. ${g.caption(status.op, status.phase)}`;
    else caption.textContent = '';
    const current = state.method === 'double-and-add' && status.op ? status.op.bitIndex : null;
    bitsLine.querySelectorAll('.bit').forEach((el, i) => el.classList.toggle('is-current', i === current));
  };
  animation = hw.createAnimation(canvas, { curve, G, k, method: state.method, speed: state.speed, palette: palette(), onUpdate });
  animationResizer.observe(canvas);
}

// ---------------------------------------------------------------------------
// 3. STATISTICAL EXPLORATION
// ---------------------------------------------------------------------------

function baseOptions(options, taskPoint) {
  const T = text.stats;
  return options.map((o) => {
    if (o.value === 'pooled') return { value: o.value, label: T.pooled };
    let tag = '';
    if (taskPoint && hw.samePoint(o.point, taskPoint)) tag = ` (${T.taskTag})`;
    else if (!taskPoint && o.isDefault) tag = ` (${T.defaultTag})`;
    return { value: o.value, label: `${fmt(o.point)}, ${T.orderWord} ${o.order}${tag}` };
  });
}

function extOptions() {
  const curve = hw.explorationCurve(state.extP);
  return view.basePointOptions(curve, { pooled: state.extP <= hw.POOLED_MAX_P });
}

function statsSection() {
  const t = text;
  controls.taskBase = select(baseOptions(taskOptions, TASK.G), state.taskBase, (value) => {
    if (taskOptions.some((o) => o.value === value)) state.taskBase = value;
    updateStats('task');
  });
  controls.extP = select(hw.EXTENSION_PRIMES.map((q) => ({ value: String(q), label: `p = ${q}` })), String(state.extP), (value) => {
    const next = Number(value);
    state.extP = hw.EXTENSION_PRIMES.includes(next) ? next : EXT_LAST;
    state.extBase = pointKey(hw.defaultBasePoint(hw.explorationCurve(state.extP)));
    setOptions(controls.extBase, baseOptions(extOptions(), null), state.extBase);
    updateStats('ext');
  });
  controls.extBase = select(baseOptions(extOptions(), null), state.extBase, (value) => {
    if (extOptions().some((o) => o.value === value)) state.extBase = value;
    updateStats('ext');
  });
  regions.taskSummary = h('div');
  regions.statsTask = h('div');
  regions.extSummary = h('div');
  regions.statsExt = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw1-stats', 0, t.sections.stats),
    paras(t.stats.intro(TASK, taskFacts)),
    title('hw1-stats-task', 1, t.sections.statsTask),
    h('p', { text: t.stats.taskIntro(TASK, taskOrder) }),
    h('div', { class: 'controls' }, label(t.stats.baseLabel, controls.taskBase)),
    regions.taskSummary,
    regions.statsTask,
    title('hw1-stats-ext', 1, t.sections.statsExt),
    h('p', { text: t.stats.extIntro(extFacts) }),
    h('div', { class: 'controls' }, label(t.stats.fieldLabel, controls.extP), label(t.stats.baseLabel, controls.extBase)),
    regions.extSummary,
    regions.statsExt,
  );
}

const inflight = new Map();

/**
 * Statistics of a key ("p|base"), from the cache or computed in slices of a
 * few milliseconds (exploreAsync): a page opened from file:// cannot start a
 * worker, and this way it never freezes, even on a slow phone.
 */
function withStats(key, done) {
  if (results.has(key)) {
    done(results.get(key));
    return;
  }
  if (!inflight.has(key)) {
    const [p, base] = key.split('|');
    let job;
    try {
      job = hw.exploreAsync(hw.explorationCurve(Number(p)), view.parseBase(base));
    } catch (error) {
      job = Promise.reject(error);
    }
    inflight.set(
      key,
      job
        .then((stats) => ({ stats }), (error) => ({ error: error instanceof Error ? error.message : String(error) }))
        .then((result) => {
          results.set(key, result);
          inflight.delete(key);
          return result;
        }),
    );
  }
  inflight.get(key).then(done);
}

function testResult(block) {
  return h(
    'div',
    { class: `test is-${block.status}` },
    h('p', { class: 'test-head' }, h('strong', { text: block.label }), ' ', h('span', { class: `badge is-${block.status}`, text: block.statusLabel })),
    h('p', { class: 'note', text: block.help }),
    block.line ? h('p', { text: block.line }) : null,
    block.reasons.length ? h('ul', { class: 'reasons' }, block.reasons.map((r) => h('li', { text: r }))) : null,
    block.verdict ? h('p', { text: block.verdict }) : null,
  );
}

function analyses(prefix, result) {
  const T = text.stats;
  const F = text.fmt;
  const titles = view.ANALYSES.map((key) => title(`${prefix}-${key}`, 2, text.sections[key]));
  const s = result.stats;
  if (!s) {
    return view.ANALYSES.map((key, i) => [titles[i], result.error ? h('p', { class: 'note', text: text.ui.error(result.error) }) : pending()]);
  }
  const data = view.chartData(s, { kBits: T.correlation.kBits, flipBits: T.avalanche.kBits, decimal: F.decimal });
  const C = T.correlation;
  const A = T.avalanche;
  const valueRows = ['pearsonKX', 'pearsonKY', 'spearmanKX', 'spearmanKY'];
  return [
    titles[0],
    h('p', { text: T.distribution.intro }),
    h('div', { class: 'charts' }, figure(T.distribution.chartX, hw.drawBarChart, data.histX), figure(T.distribution.chartY, hw.drawBarChart, data.histY)),
    paras(T.distribution.explain(s)),

    titles[1],
    h('p', { text: T.frequency.intro }),
    h('div', { class: 'charts' }, figure(T.frequency.chartX, hw.drawBarChart, data.freqX), figure(T.frequency.chartY, hw.drawBarChart, data.freqY)),
    s.p <= view.FREQUENCY_TABLE_MAX_P
      ? [
        h('p', { class: 'table-title' }, h('strong', { text: T.frequency.tableTitle }), ' ', h('span', { class: 'note', text: T.frequency.tableNote(s.p) })),
        h(
          'div',
          { class: 'scroll' },
          h(
            'table',
            { class: 'table compact' },
            h('thead', null, h('tr', null, h('th', { text: T.frequency.colValue }), h('th', { text: T.frequency.colX }), h('th', { text: T.frequency.colY }))),
            h('tbody', null, view.frequencyRows(s).map((r) => h('tr', { class: r.x || r.y ? null : 'is-empty' }, h('td', { text: r.v }), h('td', { text: r.x }), h('td', { text: r.y })))),
          ),
        ),
      ]
      : h('p', { class: 'note', text: T.frequency.bigNote(s.p) }),
    h('p', null, h('strong', { text: T.frequency.summaryTitle }), h('br'), T.frequency.summary('x', s.multiplicityX), h('br'), T.frequency.summary('y', s.multiplicityY)),
    paras(T.frequency.explain(s)),

    titles[2],
    h('p', { text: T.bits.intro }),
    h('div', { class: 'charts' }, figure(T.bits.chartX, hw.drawBarChart, data.bitsX), figure(T.bits.chartY, hw.drawBarChart, data.bitsY)),
    paras(T.bits.explain(s)),

    titles[3],
    h('p', { text: T.uniformity.intro }),
    h(
      'div',
      { class: 'uniformity' },
      ['x', 'y'].map((coord) => {
        const u = s.uniformity[coord];
        const why = T.uniformity.why(s, coord);
        return h(
          'section',
          { class: 'coord' },
          h('h5', { text: T.uniformity.coordTitle(coord) }),
          testResult(view.uniformityBlock(u.naive, u, s, T.uniformity.naiveLabel, T.uniformity)),
          testResult(view.uniformityBlock(u.distinct, u, s, T.uniformity.distinctLabel, T.uniformity)),
          why ? h('p', { text: why }) : null,
        );
      }),
    ),

    titles[4],
    h('p', { text: C.intro }),
    h(
      'table',
      { class: 'table summary' },
      h('thead', null, h('tr', null, h('th', { text: C.colMeasure }), h('th', { text: C.colValue }))),
      h(
        'tbody',
        null,
        valueRows.map((key) => h('tr', null, h('th', { text: C.rows[key] }), h('td', { text: F.num(s.correlation[key]) }))),
        h('tr', null, h('th', { text: C.rows.mirror }), h('td', { text: C.pairsValue(s.correlation.mirror) })),
        h('tr', null, h('th', { text: C.rows.homomorphism }), h('td', { text: C.trialsValue(s.homomorphism) })),
      ),
    ),
    valueRows.some((key) => s.correlation[key] === null) ? h('p', { class: 'note', text: C.undefinedWhy }) : null,
    figure(C.heatmapTitle(data.correlation.range), hw.drawHeatmap, data.correlation, true),
    paras(C.explain(s)),

    titles[5],
    h('p', { text: A.intro }),
    s.avalanche.measurements > 0
      ? [
        figure(A.chartTitle, hw.drawBarChart, data.distances),
        figure(A.heatmapTitle(), hw.drawHeatmap, data.sac, true),
        h('div', { class: 'uniformity' }, view.avalancheBlocks(s, A, T.uniformity).map((block) => h('section', { class: 'coord' }, testResult(block)))),
      ]
      : null,
    paras(A.explain(s)),
  ];
}

function updateStats(which) {
  const isTask = which === 'task';
  const key = isTask ? `${TASK.p}|${state.taskBase}` : `${state.extP}|${state.extBase}`;
  const prefix = isTask ? 'hw1-stats-task' : 'hw1-stats-ext';
  const summaryRegion = isTask ? regions.taskSummary : regions.extSummary;
  const region = isTask ? regions.statsTask : regions.statsExt;
  const token = ++tokens[which];
  if (!results.has(key)) {
    fill(summaryRegion);
    fill(region, analyses(prefix, { pending: true }));
    if (!isTask) fill(regions.properties, pending());
  }
  withStats(key, (result) => {
    if (token !== tokens[which]) return;
    const s = result.stats;
    const T = text.stats;
    const notes = [];
    if (!isTask) {
      const listed = extOptions().filter((o) => o.value !== 'pooled').length;
      const total = hw.curvePoints(hw.explorationCurve(state.extP)).length;
      if (listed < total) notes.push(h('p', { class: 'note', text: T.pointsShown(listed, total) }));
    }
    if (s) {
      notes.push(h('p', null, T.summary(s), s.orders ? ` ${T.ordersLine(s.orders)}` : '', s.smallSample ? ` ${T.smallSample(s.N)}` : ''));
    }
    fill(summaryRegion, notes);
    fill(region, analyses(prefix, result));
    if (!isTask) updateProperties();
  });
}

// ---------------------------------------------------------------------------
// 4. Discussione
// ---------------------------------------------------------------------------

function discussionSection() {
  const D = text.discussion;
  regions.properties = h('div');
  regions.inversion = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw1-discussion', 0, text.sections.discussion),
    title('hw1-discussion-definitions', 1, text.sections.definitions),
    D.definitions.map((d) => h('p', null, h('strong', { text: d.term }), ` ${d.body}`)),
    title('hw1-discussion-properties', 1, text.sections.properties),
    regions.properties,
    paras(D.propertiesAfter),
    title('hw1-discussion-inversion', 1, text.sections.inversion),
    regions.inversion,
    title('hw1-discussion-conclusion', 1, text.sections.conclusion),
    paras(D.conclusion),
  );
}

function updateProperties() {
  const D = text.discussion;
  const pooledKey = `${TASK.p}|pooled`;
  if (!results.has(pooledKey)) {
    fill(regions.properties, pending());
    withStats(pooledKey, () => updateProperties());
    return;
  }
  const T = results.get(pooledKey).stats;
  const E = (results.get(`${state.extP}|${state.extBase}`) || {}).stats;
  if (!T || !E) {
    fill(regions.properties, pending());
    return;
  }
  fill(
    regions.properties,
    h('p', { text: D.propertiesIntro(T, E) }),
    h(
      'table',
      { class: 'table discussion' },
      h('thead', null, h('tr', null, [D.colProperty, D.colOwf, D.colHash, D.colObserved].map((x) => h('th', { text: x })))),
      h(
        'tbody',
        null,
        D.rows.map((row) => h(
          'tr',
          null,
          h('th', { 'data-label': D.colProperty, text: row.name }),
          h('td', { 'data-label': D.colOwf, text: row.owf }),
          h('td', { 'data-label': D.colHash, text: row.hash }),
          h('td', { 'data-label': D.colObserved, text: D.observed[row.key](T, E) }),
        )),
      ),
    ),
  );
}

function updateInversion(curve, G, k, n, Q) {
  const D = text.discussion;
  if (Q === null) {
    fill(regions.inversion, paras([D.inversionInfinity]));
    return;
  }
  const bf = hw.bruteForceLog(Q, G, curve);
  const factors = view.factorize(n);
  fill(
    regions.inversion,
    paras(D.inversion({
      tries: bf.tries,
      n,
      kmod: k % n,
      nPrime: hw.isPrime(n),
      nFactors: view.formatFactors(n),
      nLargest: factors[factors.length - 1][0],
      facts: view.curveFacts(curve),
    })),
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

function renderChrome() {
  const t = text;
  document.documentElement.lang = state.lang;
  document.title = `Homework #1 - Statistics`;
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
  text = HW1_TEXTS[state.lang];
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), taskSection(), guruSection(), statsSection(), discussionSection());
  syncTaskControls();
  updateTask();
  updateStats('task');
  updateStats('ext');
}

function boot() {
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.addEventListener('click', () => {
      if (button.dataset.lang === state.lang) return;
      state.lang = LANGUAGES.includes(button.dataset.lang) ? button.dataset.lang : 'it';
      try {
        window.localStorage.setItem('hw1-lang', state.lang);
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
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
})();
