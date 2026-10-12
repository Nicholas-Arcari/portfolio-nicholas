/*
 * Homework #1 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Computations: toy curve, point addition, scalar multiplication, statistics,
 * animation and command line (node homework1.js [k] [p]).
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-1
 */

var Homework1 = (function () {
'use strict';

/* global process */
/**
 * HMWK 1 - Public-key cryptography: PRIVATE KEY -> PUBLIC KEY, as in Ethereum
 * Sapienza University of Rome - MSc in Cybersecurity (LM-66) - Statistics
 * Nicholas Arcari
 *
 * Elliptic-curve scalar multiplication Q = kG on toy curves with the same
 * equation as Ethereum's secp256k1, y^2 = x^3 + 7, over tiny prime fields,
 * so that every step can be printed, animated and measured.
 *
 *   0. The assignment's parameters and input validation
 *   1. Field and curve arithmetic (point addition, doubling, negation)
 *   2. Scalar multiplication: repeated addition G, 2G, ..., kG and double-and-add
 *   3. Brute-force inversion: why a toy key is not one-way
 *   4. Statistical exploration of k -> kG
 *   5. Slowed-down animation of the algorithm on a <canvas> (browser)
 *   6. Charts and heatmaps for the statistics on a <canvas> (browser)
 *   7. Printed report and command line
 *
 * Numbers are JavaScript doubles: every intermediate product stays below
 * 2^53, and therefore exact, as long as p <= P_MAX. Toy sizes only: curves
 * this small offer no security at all.
 */

// ---------------------------------------------------------------------------
// 0. The assignment's parameters and input validation
// ---------------------------------------------------------------------------

/** The parameters given in the assignment: y^2 = x^3 + 7 (mod 17), G = (1, 5), k = 6. */
const TASK = Object.freeze({ p: 17, a: 0, b: 7, G: Object.freeze({ x: 1, y: 5 }), k: 6 });

/** Larger toy curves y^2 = x^3 + 7 used as an extension: prime group order, like secp256k1. */
const EXTENSION_PRIMES = Object.freeze([97, 991, 10477]);
const EXPLORATION_PRIMES = Object.freeze([TASK.p, ...EXTENSION_PRIMES]);

/** Largest prime for which 3 p^3 < 2^53, so that no intermediate product loses precision. */
const P_MAX = 140000;

/** Largest curve for which pooling every base point is cheap enough. */
const POOLED_MAX_P = 97;

const fail = (message) => {
  throw new RangeError(message);
};

const describe = (v) => (typeof v === 'string' ? JSON.stringify(v) : String(v));

function assertInteger(name, v, min, max) {
  if (!Number.isSafeInteger(v) || v < min || v > max) {
    fail(`${name} must be an integer in [${min}, ${max}], got ${describe(v)}`);
  }
}

function isPrime(n) {
  if (!Number.isSafeInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

// ---------------------------------------------------------------------------
// 1. Field and curve arithmetic
// ---------------------------------------------------------------------------

/** Non-negative remainder: mod(-3, 17) = 14. */
const mod = (a, p) => ((a % p) + p) % p;

/** Inverse of a modulo p with the extended Euclidean algorithm. */
function modInv(a, p) {
  assertInteger('modulus', p, 2, Number.MAX_SAFE_INTEGER);
  if (!Number.isSafeInteger(a)) fail(`cannot invert ${describe(a)}: not an integer`);
  let [r0, r1] = [mod(a, p), p];
  let [s0, s1] = [1, 0];
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  if (r0 !== 1) fail(`${a} has no inverse modulo ${p}`);
  return mod(s0, p);
}

/**
 * The curve y^2 = x^3 + a*x + b over F_p; secp256k1 has a = 0 and b = 7.
 * Rejects what is not an elliptic curve over a prime field this code can
 * handle exactly: p not prime, too small or too large, or a singular curve.
 */
function makeCurve(p, b = 7, a = 0) {
  assertInteger('p', p, 5, P_MAX);
  if (!isPrime(p)) fail(`p must be prime, got ${p}`);
  assertInteger('a', a, -P_MAX, P_MAX);
  assertInteger('b', b, -P_MAX, P_MAX);
  const A = mod(a, p);
  const B = mod(b, p);
  if (mod(4 * A * A * A + 27 * B * B, p) === 0) fail(`singular curve: 4a^3 + 27b^2 = 0 (mod ${p})`);
  return Object.freeze({ p, a: A, b: B });
}

/** The point at infinity O, identity of the group, is represented by null. */
const INFINITY = null;

const onCurve = (P, { p, a, b }) => mod(P.y * P.y - (P.x * P.x * P.x + a * P.x + b), p) === 0;

function isOnCurve(P, curve) {
  if (P === null) return true;
  if (!P || !Number.isSafeInteger(P.x) || !Number.isSafeInteger(P.y)) return false;
  if (P.x < 0 || P.y < 0 || P.x >= curve.p || P.y >= curve.p) return false;
  return onCurve(P, curve);
}

function formatPoint(P) {
  if (P === null) return 'O';
  if (!P || typeof P !== 'object') return describe(P);
  return `(${P.x}, ${P.y})`;
}

/** Throws unless P is O (when allowed) or a point of the curve with coordinates in [0, p). */
function assertPoint(P, curve, { allowInfinity = false } = {}) {
  if (P === null && allowInfinity) return;
  if (P === null || !isOnCurve(P, curve)) fail(`${formatPoint(P)} is not a point of y^2 = x^3 + ${curve.b} (mod ${curve.p})`);
}

const negate = (P, { p }) => (P === null ? null : { x: P.x, y: mod(-P.y, p) });

const samePoint = (P, Q) =>
  P === null || Q === null ? P === Q : P.x === Q.x && P.y === Q.y;

/**
 * P + Q with the chord-and-tangent rule, keeping the intermediate values:
 * the slope lambda of the line through P and Q (the tangent when P = Q) and
 * the third point where that line meets the curve again, which is -R.
 * The sum R = P + Q is that third point reflected: (x3, -y3).
 *
 *   add:     lambda = (yQ - yP) / (xQ - xP)
 *   double:  lambda = (3 xP^2 + a) / (2 yP)
 *   x3 = lambda^2 - xP - xQ,   y3 = lambda (xP - x3) - yP     (all mod p)
 *
 * Internal: the inputs are trusted. The exported addDetailed checks them.
 */
function addRaw(P, Q, curve) {
  const { p, a } = curve;
  if (P === null) return { kind: 'identity', result: Q, lambda: null, third: null, vertical: false };
  if (Q === null) return { kind: 'identity', result: P, lambda: null, third: null, vertical: false };
  const doubling = P.x === Q.x && P.y === Q.y;
  if (P.x === Q.x && mod(P.y + Q.y, p) === 0) {
    // Q = -P (or a doubling with y = 0): the line is vertical and the sum is O
    return { kind: doubling ? 'double' : 'inverse', result: null, lambda: null, third: null, vertical: true };
  }
  const lambda = doubling
    ? mod((3 * P.x * P.x + a) * modInv(2 * P.y, p), p)
    : mod((Q.y - P.y) * modInv(Q.x - P.x, p), p);
  const x3 = mod(lambda * lambda - P.x - Q.x, p);
  const y3 = mod(lambda * (P.x - x3) - P.y, p);
  return {
    kind: doubling ? 'double' : 'add',
    result: { x: x3, y: y3 },
    lambda,
    third: { x: x3, y: mod(-y3, p) },
    vertical: false,
  };
}

const sum = (P, Q, curve) => addRaw(P, Q, curve).result;

function addDetailed(P, Q, curve) {
  assertPoint(P, curve, { allowInfinity: true });
  assertPoint(Q, curve, { allowInfinity: true });
  return addRaw(P, Q, curve);
}

const add = (P, Q, curve) => addDetailed(P, Q, curve).result;

/** Every affine point of the curve, sorted by x and then y (O excluded). */
function curvePoints(curve) {
  const { p, a, b } = curve;
  const roots = new Map();
  for (let y = 0; y < p; y++) {
    const s = (y * y) % p;
    if (!roots.has(s)) roots.set(s, []);
    roots.get(s).push(y);
  }
  const points = [];
  for (let x = 0; x < p; x++) {
    for (const y of roots.get(mod(x * x * x + a * x + b, p)) || []) points.push({ x, y });
  }
  return points;
}

const groupOrders = new Map();

/** Number of points of the curve, O included (counted once per curve). */
function groupOrder(curve) {
  const key = `${curve.p},${curve.a},${curve.b}`;
  if (!groupOrders.has(key)) groupOrders.set(key, curvePoints(curve).length + 1);
  return groupOrders.get(key);
}

/** kP by double-and-add, without checks and without keeping the steps. */
function multiplyRaw(k, P, curve) {
  let R = null;
  for (const bit of k.toString(2)) {
    R = sum(R, R, curve);
    if (bit === '1') R = sum(R, P, curve);
  }
  return R;
}

/**
 * Order of P: the smallest n > 0 with nP = O. By Lagrange's theorem it
 * divides the number of points #E, so only the divisors of #E are tried, each
 * with double-and-add: on a curve of prime order that is two scalar
 * multiplications instead of #E additions.
 */
function pointOrder(P, curve) {
  assertPoint(P, curve, { allowInfinity: true });
  if (P === null) return 1;
  const total = groupOrder(curve);
  for (let d = 2; d <= total; d++) {
    if (total % d === 0 && multiplyRaw(d, P, curve) === null) return d;
  }
  return fail('no divisor of #E annihilates P: the curve is not what it claims');
}

const isTaskCurve = (curve) => curve.p === TASK.p && curve.a === TASK.a && curve.b === TASK.b;

/**
 * The curve of an exploration prime: the assignment's curve for TASK.p,
 * otherwise y^2 = x^3 + 7, the equation of secp256k1.
 */
const explorationCurve = (p) => (p === TASK.p ? makeCurve(TASK.p, TASK.b, TASK.a) : makeCurve(p));

/**
 * The default base point: the one in the assignment on the assignment's
 * curve, otherwise the first point of maximal order (on a curve of prime
 * order, like secp256k1, every point except O generates the whole group).
 */
function defaultBasePoint(curve) {
  if (isTaskCurve(curve)) return { ...TASK.G };
  const points = curvePoints(curve);
  let best = points[0];
  let bestOrder = 0;
  for (const P of points) {
    const n = pointOrder(P, curve);
    if (n > bestOrder) [best, bestOrder] = [P, n];
    if (bestOrder === points.length + 1) break;
  }
  return best;
}

// ---------------------------------------------------------------------------
// 2. Scalar multiplication Q = kG
// ---------------------------------------------------------------------------

/** G, 2G, 3G, ..., kG by repeated addition: k - 1 point additions. */
function multiples(k, G, curve) {
  assertInteger('k', k, 1, 1000000);
  assertPoint(G, curve);
  const steps = [{ i: 1, point: G, kind: 'start', lambda: null, from: null, third: null, vertical: false }];
  let R = G;
  for (let i = 2; i <= k; i++) {
    const d = addRaw(R, G, curve);
    steps.push({ i, point: d.result, kind: d.kind, lambda: d.lambda, from: R, third: d.third, vertical: d.vertical });
    R = d.result;
  }
  return steps;
}

/**
 * kG with double-and-add, reading the bits of k from the most significant:
 * double R at every bit, then add G when the bit is 1. About 2*log2(k)
 * operations instead of k - 1, which is what keeps Q = kG fast even for the
 * 256-bit private keys of Ethereum.
 */
function doubleAndAdd(k, G, curve) {
  assertInteger('k', k, 1, Number.MAX_SAFE_INTEGER);
  assertPoint(G, curve);
  const bits = k.toString(2);
  const steps = [];
  let R = null;
  let multiple = 0;
  for (let j = 0; j < bits.length; j++) {
    if (j > 0) {
      const d = addRaw(R, R, curve);
      multiple *= 2;
      steps.push({ bitIndex: j, bit: bits[j], op: 'double', before: R, operand: R, multiple, ...d });
      R = d.result;
    }
    if (bits[j] === '1') {
      const d = addRaw(R, G, curve);
      multiple += 1;
      steps.push({ bitIndex: j, bit: bits[j], op: j === 0 ? 'load' : 'add', before: R, operand: G, multiple, ...d });
      R = d.result;
    }
  }
  return { bits, steps, result: R };
}

/** Q = kG, the public key of the private key k (0G = O). */
function scalarMultiply(k, G, curve) {
  assertInteger('k', k, 0, Number.MAX_SAFE_INTEGER);
  assertPoint(G, curve);
  return k === 0 ? null : doubleAndAdd(k, G, curve).result;
}

// ---------------------------------------------------------------------------
// 3. Brute-force inversion
// ---------------------------------------------------------------------------

/**
 * Recovers k from Q = kG by trying G, 2G, 3G, ...: at most n tries, n being
 * the order of G. On a toy curve that is instantaneous; on secp256k1 n is
 * about 1.16 * 10^77 and the same loop would never finish.
 */
function bruteForceLog(Q, G, curve) {
  assertPoint(G, curve);
  assertPoint(Q, curve, { allowInfinity: true });
  let R = G;
  for (let k = 1; R !== null; k++) {
    if (samePoint(R, Q)) return { k, tries: k };
    R = sum(R, G, curve);
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Statistical exploration
// ---------------------------------------------------------------------------

/** Seeded generator (mulberry32): the page, the program and the command line draw the same numbers. */
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bitLength = (n) => (n < 1 ? 0 : n.toString(2).length);

/** Fraction of the integers in [0, p) that have bit i set: what uniform values would give. */
function expectedBitFraction(i, p) {
  const half = 2 ** i;
  const block = 2 * half;
  return (Math.floor(p / block) * half + Math.max(0, (p % block) - half)) / p;
}

/** Pearson correlation coefficient; null when it is not defined (fewer than 3 pairs, or a constant variable). */
function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3 || ys.length !== n) return null;
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += xs[i];
    my += ys[i];
  }
  mx /= n;
  my /= n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}

/** Ranks from 1, ties sharing their average rank. */
function ranks(values) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array(values.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let t = i; t <= j; t++) r[order[t][1]] = avg;
    i = j + 1;
  }
  return r;
}

/** Spearman rank correlation: Pearson on the ranks. */
const spearman = (xs, ys) => (xs.length < 3 ? null : pearson(ranks(xs), ranks(ys)));

function logGamma(z) {
  // Lanczos approximation, g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const w = z - 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (w + i);
  const t = w + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (w + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Regularized upper incomplete gamma Q(s, x): series below s + 1, continued fraction above. */
function gammaQ(s, x) {
  if (!(s > 0) || !(x >= 0)) return NaN;
  if (x === 0) return 1;
  const front = Math.exp(-x + s * Math.log(x) - logGamma(s));
  if (x < s + 1) {
    let term = 1 / s;
    let total = term;
    for (let n = 1; n < 1000; n++) {
      term *= x / (s + n);
      total += term;
      if (Math.abs(term) < Math.abs(total) * 1e-15) break;
    }
    return Math.max(0, 1 - total * front);
  }
  const tiny = 1e-300;
  let b = x + 1 - s;
  let c = 1 / tiny;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - s);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-15) break;
  }
  return Math.min(1, front * h);
}

/** P(X >= chi2) for a chi-square variable with df degrees of freedom (exact, via the incomplete gamma). */
const chiSquarePValue = (chi2, df) => (df > 0 && chi2 >= 0 ? gammaQ(df / 2, chi2 / 2) : NaN);

/** Probability that |Z| > z for a standard normal Z. */
const twoSidedNormalTail = (z) => gammaQ(0.5, (z * z) / 2);

const SIGNIFICANCE = 0.05;
const MIN_EXPECTED = 5;

/**
 * Chi-square test of `counts` (one count per value in [0, p)) against the
 * uniform distribution on [0, p). Values are grouped into B consecutive
 * classes, B being the largest number up to maxBins that leaves at least
 * MIN_EXPECTED expected observations in every class (Cochran's rule). When
 * even two classes cannot reach it, the test is still computed on two
 * classes and marked as not valid, so that the number can be shown together
 * with the reason it does not mean much.
 *
 * `fpc` is the finite population correction for observations drawn without
 * replacement: D distinct values out of p have class counts with variance
 * (p - D) / (p - 1) times the multinomial one, and Pearson's statistic must
 * be divided by that factor to follow the chi-square distribution.
 */
function chiSquareUniform(counts, p, maxBins, fpc = 1) {
  const N = counts.reduce((s, c) => s + c, 0);
  if (N < 2) return { computable: false, N, reasons: ['small-sample'] };
  let B = null;
  for (let b = Math.min(maxBins, p); b >= 2; b--) {
    if ((Math.floor(p / b) * N) / p >= MIN_EXPECTED) {
      B = b;
      break;
    }
  }
  const reasons = [];
  if (B === null) reasons.push('small-sample');
  const bins = B ?? 2;
  const observed = new Array(bins).fill(0);
  const width = new Array(bins).fill(0);
  for (let v = 0; v < p; v++) {
    const j = Math.floor((v * bins) / p);
    observed[j] += counts[v];
    width[j]++;
  }
  const expected = width.map((w) => (w * N) / p);
  const minExpected = Math.min(...expected);
  if (minExpected < MIN_EXPECTED && !reasons.includes('small-sample')) reasons.push('low-expected');
  const pearsonChi2 = observed.reduce((s, o, j) => s + (o - expected[j]) ** 2 / expected[j], 0);
  const chi2 = pearsonChi2 / fpc;
  const df = bins - 1;
  const pValue = chiSquarePValue(chi2, df);
  return {
    computable: true,
    N,
    bins,
    perValue: bins === p,
    df,
    pearsonChi2,
    fpc,
    chi2,
    pValue,
    minExpected,
    reasons,
    expectedOk: minExpected >= MIN_EXPECTED,
    verdict: pValue < SIGNIFICANCE ? 'reject' : 'notReject',
    // P(X <= chi2): close to 0 means "more regular than chance would allow"
    leftTail: 1 - pValue,
    tooRegular: 1 - pValue < SIGNIFICANCE,
    alpha: SIGNIFICANCE,
  };
}

/** How many values occur 0, 1, 2, ... times, from per-value counts. */
function multiplicityTable(counts) {
  const table = [];
  for (const c of counts) table[c] = (table[c] || 0) + 1;
  return Array.from(table, (v) => v || 0);
}

/**
 * Uniformity of one coordinate, studied twice. The naive test uses every
 * observation; but on these curves the observations come in fixed groups
 * (x(kG) = x((n - k)G), and y repeats in triples when p = 1 mod 3), so they
 * are not independent and the naive statistic is inflated by the group
 * size. The second test keeps each distinct value once and compares the set
 * with D values drawn at random without replacement from [0, p): hence the
 * finite population correction. Without it a set covering half of [0, p)
 * would always look "too regular". When every value of [0, p) occurs, the
 * set of distinct values is uniform by construction and there is nothing
 * left to test.
 *
 * The y coordinates have one more constraint: a subgroup contains -P with
 * every P, so the set of y is symmetric (y and p - y occur together) and
 * its class counts mirror each other. A symmetric set is tested folded,
 * through min(y, p - y) on [0, (p - 1) / 2]: otherwise each deviation would
 * be counted twice.
 */
function uniformity(counts, p, maxBins, attainable, { symmetric = false } = {}) {
  const distinctCounts = counts.map((c) => (c > 0 ? 1 : 0));
  const observedValues = distinctCounts.reduce((s, c) => s + c, 0);
  const positive = counts.filter((c) => c > 0);
  const minMult = positive.length ? Math.min(...positive) : 0;
  const maxMult = positive.length ? Math.max(...positive) : 0;
  const naive = chiSquareUniform(counts, p, maxBins);
  if (naive.computable) {
    naive.reasons.push('exhaustive');
    if (maxMult > 1) naive.reasons.push('duplicates');
  }
  const closed = symmetric && distinctCounts.every((c, v) => c === distinctCounts[(p - v) % p]);
  const population = closed ? (p + 1) / 2 : p;
  let values = distinctCounts;
  if (closed) {
    values = new Array(population).fill(0);
    distinctCounts.forEach((c, v) => {
      if (c) values[Math.min(v, p - v)] = 1;
    });
  }
  const D = values.reduce((s, c) => s + c, 0);
  let distinct;
  if (D === population) {
    distinct = { computable: false, N: D, reasons: ['all-values'] };
  } else {
    distinct = chiSquareUniform(values, population, Math.min(maxBins, population), (population - D) / (population - 1));
    if (distinct.computable) {
      distinct.reasons.push('exhaustive');
      if (closed) distinct.reasons.push('symmetric');
    }
  }
  distinct.population = population;
  distinct.folded = closed;
  return {
    naive,
    distinct,
    observedValues,
    attainable,
    minMult,
    maxMult,
    sameMultiplicity: minMult === maxMult,
  };
}

/**
 * Fraction of ones per bit position among the distinct values, with the
 * uniform reference and a z-score. Repeated values carry no new information
 * (they repeat for algebraic reasons), so the reference model is a set of D
 * values drawn without replacement from [0, p): hypergeometric, with the
 * finite population correction in the standard error. When all p values
 * occur the fraction equals the reference exactly and z is not defined.
 */
function bitStats(values, p) {
  const L = bitLength(p - 1);
  const distinct = [...new Set(values)];
  const D = distinct.length;
  const fpc = (p - D) / (p - 1);
  return Array.from({ length: L }, (_, i) => {
    let ones = 0;
    for (const v of distinct) ones += (v >>> i) & 1;
    const fraction = D ? ones / D : null;
    const expected = expectedBitFraction(i, p);
    const se = D ? Math.sqrt(((expected * (1 - expected)) / D) * fpc) : 0;
    return { bit: i, fraction, expected, distinct: D, z: D && se > 0 ? (fraction - expected) / se : null };
  });
}

/**
 * Correlation between every bit of the input k and every bit of the output
 * point (the bits of x, then the bits of y): the phi coefficient, that is
 * Pearson on 0/1 variables. Under independence phi * sqrt(N) is roughly
 * standard normal, so |phi| above 3 / sqrt(N) is unusual: with many cells a
 * few still cross it by chance, about 0.27% of them.
 */
function bitCorrelation(ks, xs, ys, L) {
  const N = ks.length;
  const inputBits = bitLength(Math.max(1, ...ks));
  const outputs = [...Array.from({ length: L }, (_, j) => ['x', j]), ...Array.from({ length: L }, (_, j) => ['y', j])];
  const values = [];
  let maxAbs = 0;
  let sumAbs = 0;
  let defined = 0;
  let above = 0;
  const threshold = N > 0 ? 3 / Math.sqrt(N) : null;
  for (let i = 0; i < inputBits; i++) {
    const row = [];
    for (const [coord, j] of outputs) {
      const out = coord === 'x' ? xs : ys;
      let n1 = 0;
      let m1 = 0;
      let both = 0;
      for (let t = 0; t < N; t++) {
        const a = (ks[t] >>> i) & 1;
        const b = (out[t] >>> j) & 1;
        n1 += a;
        m1 += b;
        both += a & b;
      }
      const den = Math.sqrt(n1 * (N - n1) * m1 * (N - m1));
      const phi = den === 0 ? null : (N * both - n1 * m1) / den;
      row.push(phi);
      if (phi !== null) {
        defined++;
        sumAbs += Math.abs(phi);
        maxAbs = Math.max(maxAbs, Math.abs(phi));
        if (Math.abs(phi) > threshold) above++;
      }
    }
    values.push(row);
  }
  // global test: under independence N * phi^2 is about chi-square with 1
  // degree of freedom, so the sum over the cells is about chi-square(cells)
  let globalChi2 = 0;
  for (const row of values) for (const phi of row) if (phi !== null) globalChi2 += N * phi * phi;
  return {
    inputBits,
    outputBits: 2 * L,
    values,
    threshold,
    maxAbs: defined ? maxAbs : null,
    meanAbs: defined ? sumAbs / defined : null,
    defined,
    above,
    expectedAbove: defined * twoSidedNormalTail(3),
    globalChi2: defined ? globalChi2 : null,
    globalP: defined ? chiSquarePValue(globalChi2, defined) : null,
  };
}

/**
 * Flip rate of each output bit between two distinct random points of the
 * curve: the reference for a "random function into the curve", as opposed
 * to the one for uniform values in [0, p). Exact on small curves (every
 * pair of points), estimated from seeded random pairs on large ones.
 */
function curveFlipReference(curve, L, seed) {
  const pts = curvePoints(curve);
  const counts = new Array(2 * L).fill(0);
  let pairs = 0;
  const measure = (A, B) => {
    const dx = A.x ^ B.x;
    const dy = A.y ^ B.y;
    for (let j = 0; j < L; j++) {
      counts[j] += (dx >>> j) & 1;
      counts[L + j] += (dy >>> j) & 1;
    }
    pairs++;
  };
  if (pts.length <= 200) {
    for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) measure(pts[a], pts[b]);
  } else {
    const rand = prng(seed + 1);
    while (pairs < 200000) {
      const a = Math.floor(rand() * pts.length);
      const b = Math.floor(rand() * pts.length);
      if (a !== b) measure(pts[a], pts[b]);
    }
  }
  return { values: counts.map((c) => c / pairs), exact: pts.length <= 200 };
}

/**
 * How far a SAC matrix is from a reference flip rate per output bit: cells
 * beyond 3 sigma and the global test sum(z^2) ~ chi-square(cells), on all
 * the columns and separately on the x and on the y columns.
 *
 * The x columns have a known dependence. The pair {kG, (k + 2^i)G} and its
 * mirror {-(k + 2^i)G, -kG} = {(n - k - 2^i)G, (n - k)G} have the same x
 * coordinates, so when both pairs are counted the same x measurement is
 * counted twice. With a share d of duplicated pairs the variance of a flip
 * rate grows by the factor 1 + d (the design effect): `xCorrected` divides
 * it out. The y columns have no exact mirror (y becomes p - y) and are left
 * as they are.
 */
function sacAgainst(sac, pairsPerBit, reference, L, mirrorShare) {
  const parts = { all: [0, 0, 0], x: [0, 0, 0], y: [0, 0, 0], xCorrected: [0, 0, 0] };
  const addTo = (part, z) => {
    part[0]++;
    part[1] += z * z;
    if (Math.abs(z) > 3) part[2]++;
  };
  sac.forEach((row, i) =>
    row.forEach((v, j) => {
      if (v === null) return;
      const sigma = Math.sqrt((reference[j] * (1 - reference[j])) / pairsPerBit[i]);
      if (!(sigma > 0)) return;
      const z = (v - reference[j]) / sigma;
      addTo(parts.all, z);
      if (j < L) {
        addTo(parts.x, z);
        addTo(parts.xCorrected, z / Math.sqrt(1 + mirrorShare[i]));
      } else {
        addTo(parts.y, z);
      }
    }),
  );
  const summary = ([cells, z2, above]) => ({
    cells,
    above,
    expectedAbove: cells * twoSidedNormalTail(3),
    z2,
    pValue: cells ? chiSquarePValue(z2, cells) : null,
  });
  return { ...summary(parts.all), x: summary(parts.x), y: summary(parts.y), xCorrected: summary(parts.xCorrected) };
}

/** Distribution of a sum of independent Bernoulli(probs[j]) variables. */
function poissonBinomial(probs) {
  let dist = [1];
  for (const q of probs) {
    const next = new Array(dist.length + 1).fill(0);
    dist.forEach((v, d) => {
      next[d] += v * (1 - q);
      next[d + 1] += v * q;
    });
    dist = next;
  }
  return dist;
}

/**
 * Statistical exploration of the map k -> kG.
 *
 * base is a point (one base point G: k runs over 1, ..., n - 1, the whole
 * subgroup generated by G) or 'pooled' (every affine point of the curve in
 * turn as base point, each with its own k = 1, ..., ord - 1). Every value of
 * k is used, so the "sample" is in fact the whole population: the tests
 * below are descriptive, and the texts say so.
 */
function explore(curve, base, { homomorphismTrials = 200, seed = 2026 } = {}) {
  const { p } = curve;
  const pooled = base === 'pooled';
  if (pooled && p > POOLED_MAX_P) fail(`pooling every base point is limited to p <= ${POOLED_MAX_P}`);
  if (!pooled) assertPoint(base, curve);
  const bases = pooled ? curvePoints(curve) : [base];
  const L = bitLength(p - 1);

  // enumerate the subgroups: one table of multiples per base point
  const groups = bases.map((G) => {
    const gx = [];
    const gy = [];
    for (let R = G; R !== null; R = sum(R, G, curve)) {
      gx.push(R.x);
      gy.push(R.y);
    }
    return { G, n: gx.length + 1, xs: gx, ys: gy };
  });
  const ks = [];
  const xs = [];
  const ys = [];
  for (const g of groups) {
    g.xs.forEach((x, i) => {
      ks.push(i + 1);
      xs.push(x);
      ys.push(g.ys[i]);
    });
  }
  const N = ks.length;

  // distribution and frequency of individual values
  const freqX = new Array(p).fill(0);
  const freqY = new Array(p).fill(0);
  for (let t = 0; t < N; t++) {
    freqX[xs[t]]++;
    freqY[ys[t]]++;
  }
  const curveXs = new Set();
  const curveYs = new Set();
  for (const P of curvePoints(curve)) {
    curveXs.add(P.x);
    curveYs.add(P.y);
  }
  const bins = p <= POOLED_MAX_P ? p : 32;
  const histogram = (freq) => {
    const h = new Array(bins).fill(0);
    freq.forEach((c, v) => {
      h[Math.floor((v * bins) / p)] += c;
    });
    return h;
  };
  const widths = new Array(bins).fill(0);
  for (let v = 0; v < p; v++) widths[Math.floor((v * bins) / p)]++;

  // a structural fact: kG and (n - k)G are opposite points, with the same x
  const mirror = { pairs: 0, matches: 0 };
  for (const g of groups) {
    for (let k = 1; k < g.n - k; k++) {
      mirror.pairs++;
      if (g.xs[k - 1] === g.xs[g.n - k - 1]) mirror.matches++;
    }
  }

  // avalanche: flip each bit of k, for every k of every subgroup, counting
  // each pair of inputs once (counted from both ends, every measurement
  // would appear twice and the 3-sigma bands would be too narrow). The ideal
  // flip rate of an output bit is that of two independent uniform values in
  // [0, p): 2q(1 - q), which is below 1/2 for the top bits when p is not a
  // power of two.
  const outputBits = 2 * L;
  const ideal = Array.from({ length: outputBits }, (_, j) => {
    const q = expectedBitFraction(j % L, p);
    return 2 * q * (1 - q);
  });
  const inputBits = Math.max(1, ...groups.map((g) => bitLength(g.n - 1)));
  const flips = Array.from({ length: inputBits }, () => new Array(outputBits).fill(0));
  const pairsPerBit = new Array(inputBits).fill(0);
  const mirroredPerBit = new Array(inputBits).fill(0);
  const distances = new Array(outputBits + 1).fill(0);
  let flipTotal = 0;
  for (const g of groups) {
    const bitsHere = bitLength(g.n - 1);
    for (let k = 1; k < g.n; k++) {
      for (let i = 0; i < bitsHere; i++) {
        // each unordered pair {k, k xor 2^i} once: from the k whose bit i is 0
        if ((k >>> i) & 1) continue;
        const k2 = k ^ (1 << i);
        if (k2 >= g.n) continue;
        // its mirror {n - k2, n - k} has the same x values: is it counted too?
        const low = g.n - k2;
        if (low !== k && !((low >>> i) & 1)) mirroredPerBit[i]++;
        const dx = g.xs[k - 1] ^ g.xs[k2 - 1];
        const dy = g.ys[k - 1] ^ g.ys[k2 - 1];
        let d = 0;
        for (let j = 0; j < L; j++) {
          if ((dx >>> j) & 1) {
            flips[i][j]++;
            d++;
          }
          if ((dy >>> j) & 1) {
            flips[i][L + j]++;
            d++;
          }
        }
        pairsPerBit[i]++;
        distances[d]++;
        flipTotal += d;
      }
    }
  }
  const measurements = pairsPerBit.reduce((s, m) => s + m, 0);
  let maxDev = 0;
  let sumDev = 0;
  let cells = 0;
  const sac = flips.map((row, i) =>
    row.map((f, j) => {
      if (!pairsPerBit[i]) return null;
      const s = f / pairsPerBit[i];
      cells++;
      sumDev += Math.abs(s - ideal[j]);
      maxDev = Math.max(maxDev, Math.abs(s - ideal[j]));
      return s;
    }),
  );
  const curveReference = curveFlipReference(curve, L, seed);
  const mirrorShare = pairsPerBit.map((m, i) => (m ? mirroredPerBit[i] / m : 0));

  // the homomorphism (k1 + k2)G = k1G + k2G, on random pairs
  const rand = prng(seed);
  let holds = 0;
  const usable = groups.filter((g) => g.n > 1);
  for (let t = 0; t < homomorphismTrials && usable.length; t++) {
    const g = usable[Math.floor(rand() * usable.length)];
    const k1 = 1 + Math.floor(rand() * (g.n - 1));
    const k2 = 1 + Math.floor(rand() * (g.n - 1));
    const at = (k) => (k % g.n === 0 ? null : { x: g.xs[(k % g.n) - 1], y: g.ys[(k % g.n) - 1] });
    if (samePoint(sum(at(k1), at(k2), curve), at(k1 + k2))) holds++;
  }

  return {
    p,
    a: curve.a,
    b: curve.b,
    pooled,
    G: pooled ? null : base,
    n: pooled ? null : groups[0].n,
    baseCount: groups.length,
    orders: pooled ? multiplicityTable(groups.map((g) => g.n)).map((c, order) => [order, c]).filter(([, c]) => c) : null,
    N,
    smallSample: N < 30,
    bitLength: L,
    freqX,
    freqY,
    multiplicityX: multiplicityTable(freqX),
    multiplicityY: multiplicityTable(freqY),
    histogram: { bins, x: histogram(freqX), y: histogram(freqY), expected: widths.map((w) => (w * N) / p) },
    uniformity: {
      x: uniformity(freqX, p, bins, curveXs.size),
      y: uniformity(freqY, p, bins, curveYs.size, { symmetric: true }),
    },
    bits: { x: bitStats(xs, p), y: bitStats(ys, p) },
    correlation: {
      pearsonKX: pearson(ks, xs),
      pearsonKY: pearson(ks, ys),
      spearmanKX: spearman(ks, xs),
      spearmanKY: spearman(ks, ys),
      mirror,
      bits: bitCorrelation(ks, xs, ys, L),
    },
    avalanche: {
      inputBits,
      outputBits,
      measurements,
      meanFraction: measurements ? flipTotal / measurements / outputBits : null,
      idealMeanFraction: ideal.reduce((s, q) => s + q, 0) / outputBits,
      distances,
      expectedDistances: poissonBinomial(ideal).map((q) => q * measurements),
      sac,
      ideal,
      curveIdeal: curveReference.values,
      curveIdealExact: curveReference.exact,
      pairsPerBit,
      mirrorShare,
      mirrorShareAll: measurements ? mirroredPerBit.reduce((s, m) => s + m, 0) / measurements : 0,
      maxDev: cells ? maxDev : null,
      meanDev: cells ? sumDev / cells : null,
      cells,
      vsUniform: sacAgainst(sac, pairsPerBit, ideal, L, mirrorShare),
      vsCurve: sacAgainst(sac, pairsPerBit, curveReference.values, L, mirrorShare),
    },
    homomorphism: { trials: usable.length ? homomorphismTrials : 0, holds },
  };
}

// ---------------------------------------------------------------------------
// 5. Slowed-down animation (browser, <canvas>)
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = {
  background: '#ffffff',
  text: '#444444',
  muted: '#b8b8b8',
  grid: '#eeeeee',
  subgroup: '#5c6bc0',
  operandP: '#d52349',
  operandQ: '#f0a500',
  line: '#3fa796',
  third: '#7cb342',
  result: '#d52349',
  heatNegative: '#3b6fd8',
  heatZero: '#f2f2f2',
  heatPositive: '#d52349',
  heatNull: '#d9d9d9',
};

const PHASES = [
  ['operands', 700],
  ['line', 1400],
  ['third', 650],
  ['reflect', 850],
  ['result', 650],
];

/**
 * The operations to animate: the k - 1 additions, or the steps of
 * double-and-add. Each one keeps `op` (load, add, double), `kind` (add,
 * double, inverse, identity) and the operands, so that the captions can
 * tell the first load of G apart from O + G and from 2O = O.
 */
function animationOps(k, G, curve, method) {
  if (method === 'repeated') {
    return multiples(k, G, curve).map((s) => ({
      op: s.kind === 'start' ? 'load' : 'add',
      kind: s.kind === 'start' ? 'identity' : s.kind,
      P: s.from,
      Q: G,
      result: s.point,
      lambda: s.lambda,
      third: s.third,
      vertical: s.vertical,
      multiple: s.i,
      bitIndex: null,
    }));
  }
  return doubleAndAdd(k, G, curve).steps.map((s) => ({
    op: s.op,
    kind: s.kind,
    P: s.before,
    Q: s.operand,
    result: s.result,
    lambda: s.lambda,
    third: s.third,
    vertical: s.vertical,
    multiple: s.multiple,
    bitIndex: s.bitIndex,
  }));
}

const phasesOf = (op) => {
  if (op.kind === 'identity') return [['result', 900]];
  if (op.vertical) return [PHASES[0], PHASES[1], ['result', 900]];
  return PHASES;
};

/**
 * The line through P and Q, seen modulo p, is a set of parallel segments
 * wrapping around the p x p square (a line on a torus). Slopes are taken in
 * (-p/2, p/2] so that it wraps as few times as possible.
 */
function wrappedSegments(op, p) {
  const { P } = op;
  if (op.vertical) return [[P.x, -0.5, P.x, p - 0.5]];
  const slope = op.lambda > p / 2 ? op.lambda - p : op.lambda;
  const base = P.y - slope * P.x;
  const segments = [];
  const lo = -0.5;
  const hi = p - 0.5;
  for (let m = -Math.abs(slope) - 2; m <= Math.abs(slope) + 2; m++) {
    const c = base + m * p;
    let x0 = lo;
    let x1 = hi;
    if (slope !== 0) {
      const xa = (lo - c) / slope;
      const xb = (hi - c) / slope;
      x0 = Math.max(lo, Math.min(xa, xb));
      x1 = Math.min(hi, Math.max(xa, xb));
    } else if (c < lo || c > hi) {
      continue;
    }
    if (x1 > x0) segments.push([x0, slope * x0 + c, x1, slope * x1 + c]);
  }
  segments.sort((s, t) => s[0] - t[0]);
  return segments;
}

function setupCanvas(canvas, aspect) {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const width = canvas.clientWidth || 480;
  const height = Math.round(width * aspect);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function drawScene(canvas, state, palette) {
  const { curve, points, subgroupLabels, op, phase, t, reached } = state;
  const { p } = curve;
  const { ctx, width, height } = setupCanvas(canvas, 1);
  const margin = { left: 30, right: 10, top: 10, bottom: 26 };
  const size = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom);
  const cell = size / p;
  const X = (x) => margin.left + (x + 0.5) * cell;
  const Y = (y) => margin.top + size - (y + 0.5) * cell;
  const small = p <= 31;
  const dot = Math.max(2, Math.min(cell * 0.32, 7));

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  // frame and grid
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  if (small) {
    for (let i = 0; i <= p; i++) {
      ctx.beginPath();
      ctx.moveTo(margin.left + i * cell, margin.top);
      ctx.lineTo(margin.left + i * cell, margin.top + size);
      ctx.moveTo(margin.left, margin.top + i * cell);
      ctx.lineTo(margin.left + size, margin.top + i * cell);
      ctx.stroke();
    }
  } else {
    ctx.strokeRect(margin.left, margin.top, size, size);
  }
  ctx.fillStyle = palette.text;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  const tickEvery = small ? 4 : Math.ceil(p / 5 / 10) * 10;
  for (let v = 0; v < p; v += tickEvery) {
    ctx.fillText(String(v), X(v), margin.top + size + 15);
    ctx.textAlign = 'right';
    ctx.fillText(String(v), margin.left - 5, Y(v) + 4);
    ctx.textAlign = 'center';
  }

  // the curve, and the multiples of G reached so far
  ctx.fillStyle = palette.muted;
  for (const P of points) {
    ctx.beginPath();
    ctx.arc(X(P.x), Y(P.y), dot * 0.75, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = palette.subgroup;
  for (const R of reached) {
    if (R.point === null) continue;
    ctx.beginPath();
    ctx.arc(X(R.point.x), Y(R.point.y), dot, 0, 2 * Math.PI);
    ctx.fill();
  }
  if (small) {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    for (const [key, label] of subgroupLabels) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillText(label, X(x) + dot + 2, Y(y) - dot - 1);
    }
  }

  const ring = (P, color, radius, filled) => {
    ctx.beginPath();
    ctx.arc(X(P.x), Y(P.y), radius, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    if (filled) {
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.stroke();
  };

  if (!op) {
    // animation over: the public key Q = kG stays highlighted
    const last = reached[reached.length - 1];
    if (last && last.point) {
      ring(last.point, palette.result, dot + 3, true);
      ctx.fillStyle = palette.text;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Q = ${last.multiple}G`, X(last.point.x) + dot + 7, Y(last.point.y) + 4);
    }
    return;
  }

  const phaseIndex = phasesOf(op).findIndex(([name]) => name === phase);
  const reachedPhase = (name) => {
    const i = phasesOf(op).findIndex(([n]) => n === name);
    return i !== -1 && phaseIndex >= i;
  };

  // operands
  if (op.kind !== 'identity') {
    if (op.P) ring(op.P, palette.operandP, dot + 5, false);
    if (op.Q && !samePoint(op.P, op.Q)) ring(op.Q, palette.operandQ, dot + 5, false);
  }

  // the line (chord or tangent), drawn progressively
  if (op.kind !== 'identity' && reachedPhase('line')) {
    const segments = wrappedSegments(op, p);
    const lengths = segments.map(([x0, y0, x1, y1]) => Math.hypot(x1 - x0, y1 - y0));
    const total = lengths.reduce((s, l) => s + l, 0);
    let budget = (phase === 'line' ? t : 1) * total;
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.85;
    segments.forEach(([x0, y0, x1, y1], i) => {
      if (budget <= 0) return;
      const f = Math.min(1, budget / lengths[i]);
      budget -= lengths[i];
      ctx.beginPath();
      ctx.moveTo(X(x0), Y(y0));
      ctx.lineTo(X(x0 + (x1 - x0) * f), Y(y0 + (y1 - y0) * f));
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  // the third intersection -R, and its reflection R
  if (op.third && reachedPhase('third')) ring(op.third, palette.third, dot + 4, false);
  if (op.third && reachedPhase('reflect')) {
    const f = phase === 'reflect' ? t : 1;
    const y = op.third.y + (op.result.y - op.third.y) * f;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = palette.third;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(op.third.x), Y(op.third.y));
    ctx.lineTo(X(op.third.x), Y(y));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (reachedPhase('result') && op.result) {
    ring(op.result, palette.result, dot + 2, true);
    ctx.fillStyle = palette.text;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${op.multiple}G`, X(op.result.x) + dot + 6, Y(op.result.y) + 4);
  }
}

/**
 * Animates Q = kG on a <canvas>, one operation and one phase at a time:
 * operands, line through them (tangent when doubling) wrapping around the
 * square modulo p, third intersection -R, reflection to R. Returns a small
 * controller; onUpdate receives the operation and phase on screen.
 *
 *   const anim = createAnimation(document.querySelector('canvas'), {
 *     curve: makeCurve(17), G: { x: 1, y: 5 }, k: 6, method: 'double-and-add',
 *   });
 *   anim.play();
 */
function createAnimation(canvas, options) {
  const { curve, G, k, method = 'double-and-add', onUpdate = () => {} } = options;
  let speed = options.speed || 1;
  let palette = { ...DEFAULT_PALETTE, ...(options.palette || {}) };
  const ops = animationOps(k, G, curve, method);
  const points = curvePoints(curve);
  const subgroupLabels = new Map();
  let opIndex = 0;
  let phaseIndex = 0;
  let t = 0;
  let playing = false;
  let frame = 0;
  let last = 0;
  let reached = [];

  const current = () => {
    const op = ops[opIndex] || null;
    const phases = op ? phasesOf(op) : [];
    return { op, phase: phases[phaseIndex] ? phases[phaseIndex][0] : null, duration: phases[phaseIndex] ? phases[phaseIndex][1] : 0 };
  };

  const render = () => {
    const { op, phase } = current();
    drawScene(canvas, { curve, points, subgroupLabels, op, phase, t, reached }, palette);
    onUpdate({ op, opIndex, opCount: ops.length, phase, playing, done: opIndex >= ops.length });
  };

  const finishOp = (op) => {
    reached = [...reached, { point: op.result, multiple: op.multiple }];
    if (op.result) subgroupLabels.set(`${op.result.x},${op.result.y}`, `${op.multiple}G`);
  };

  const nextPhase = () => {
    const { op } = current();
    if (!op) return false;
    t = 0;
    if (phaseIndex < phasesOf(op).length - 1) {
      phaseIndex++;
    } else {
      finishOp(op);
      opIndex++;
      phaseIndex = 0;
      if (opIndex >= ops.length) return false;
    }
    return true;
  };

  const tick = (now) => {
    if (!playing) return;
    const { duration } = current();
    t += ((now - last) * speed) / Math.max(1, duration);
    last = now;
    if (t >= 1) {
      t = 1;
      if (!nextPhase()) {
        playing = false;
        render();
        return;
      }
    }
    render();
    frame = requestAnimationFrame(tick);
  };

  const controller = {
    play() {
      if (playing) return;
      if (opIndex >= ops.length) controller.reset();
      playing = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
      render();
    },
    pause() {
      playing = false;
      cancelAnimationFrame(frame);
      render();
    },
    step() {
      // a step shows the next phase already complete: a line at 0% is invisible
      controller.pause();
      if (opIndex >= ops.length) return;
      nextPhase();
      t = 1;
      render();
    },
    reset() {
      cancelAnimationFrame(frame);
      playing = false;
      opIndex = 0;
      phaseIndex = 0;
      t = 0;
      reached = [];
      subgroupLabels.clear();
      render();
    },
    setSpeed(s) {
      speed = s;
    },
    setPalette(next) {
      palette = { ...DEFAULT_PALETTE, ...next };
      render();
    },
    redraw: render,
    destroy() {
      playing = false;
      cancelAnimationFrame(frame);
    },
    get playing() {
      return playing;
    },
  };
  render();
  return controller;
}

// ---------------------------------------------------------------------------
// 6. Charts and heatmaps (browser, <canvas>)
// ---------------------------------------------------------------------------

/**
 * Bar chart of `values`, with an optional dashed reference (`expected`, one
 * value per bar or a single number) and labels under the first, the middle
 * and the last bar. With more bars than pixels, each pixel column shows the
 * largest of its bars, so that no value disappears.
 */
function drawBarChart(canvas, { values, expected = null, labels = null, max = null }, palette = DEFAULT_PALETTE) {
  const { ctx, width, height } = setupCanvas(canvas, 0.42);
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const margin = { left: 34, right: 8, top: 10, bottom: 22 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const refs = expected === null ? [] : Array.isArray(expected) ? expected : values.map(() => expected);
  const top = max ?? Math.max(1e-9, ...values, ...refs) * 1.1;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = pal.grid;
  ctx.strokeRect(margin.left, margin.top, w, h);

  const columns = Math.min(values.length, Math.max(1, Math.floor(w)));
  const perColumn = values.length / columns;
  const colW = w / columns;
  const gap = columns === values.length ? colW * 0.12 : 0;
  ctx.fillStyle = pal.subgroup;
  for (let c = 0; c < columns; c++) {
    const from = Math.floor(c * perColumn);
    const to = Math.max(Math.floor((c + 1) * perColumn), from + 1);
    let v = 0;
    for (let i = from; i < to; i++) v = Math.max(v, values[i] ?? 0);
    const bh = (v / top) * h;
    ctx.fillRect(margin.left + c * colW + gap, margin.top + h - bh, Math.max(0.6, colW - 2 * gap), bh);
  }
  if (refs.length) {
    ctx.strokeStyle = pal.operandP;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let c = 0; c < columns; c++) {
      const r = refs[Math.floor(c * perColumn)] ?? 0;
      const y = margin.top + h - (r / top) * h;
      ctx.moveTo(margin.left + c * colW, y);
      ctx.lineTo(margin.left + (c + 1) * colW, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = pal.text;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  const fmt = (v) => (top <= 1.5 ? v.toFixed(2) : String(Math.round(v)));
  ctx.fillText(fmt(top), margin.left - 4, margin.top + 9);
  ctx.fillText(fmt(0), margin.left - 4, margin.top + h);
  if (labels) {
    ctx.textAlign = 'center';
    const barW = w / values.length;
    for (const i of new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])) {
      ctx.fillText(labels[i], margin.left + (i + 0.5) * barW, margin.top + h + 15);
    }
  }
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, f) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * f)}, ${Math.round(g1 + (g2 - g1) * f)}, ${Math.round(b1 + (b2 - b1) * f)})`;
};

/**
 * Heatmap of a matrix of numbers in [-range, range] around 0 (negative in
 * blue, positive in red, null cells in grey), with a legend. Rows are the
 * bits of k, columns the bits of x and then of y, split by a line.
 */
function drawHeatmap(canvas, { values, range = 1, split = null, rowLabel = '', colLabels = ['', ''] }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const rows = values.length;
  const cols = rows ? values[0].length : 0;
  const width = canvas.clientWidth || 480;
  const margin = { left: 34, right: 8, top: 18, bottom: 34 };
  const cell = Math.max(4, (width - margin.left - margin.right) / Math.max(1, cols));
  const { ctx, height } = setupCanvas(canvas, (margin.top + margin.bottom + rows * cell) / width);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  const color = (v) => {
    if (v === null || Number.isNaN(v)) return pal.heatNull;
    const f = Math.max(-1, Math.min(1, v / range));
    return f < 0 ? mix(pal.heatZero, pal.heatNegative, -f) : mix(pal.heatZero, pal.heatPositive, f);
  };
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = color(values[i][j]);
      ctx.fillRect(margin.left + j * cell, margin.top + i * cell, cell - 1, cell - 1);
    }
  }
  ctx.fillStyle = pal.text;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i < rows; i += Math.max(1, Math.ceil(rows / 8))) {
    ctx.fillText(String(i), margin.left - 4, margin.top + i * cell + cell * 0.7);
  }
  ctx.save();
  ctx.translate(10, margin.top + (rows * cell) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(rowLabel, 0, 0);
  ctx.restore();
  if (split !== null) {
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left + split * cell - 0.5, margin.top - 4);
    ctx.lineTo(margin.left + split * cell - 0.5, margin.top + rows * cell + 4);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText(colLabels[0], margin.left + (split * cell) / 2, margin.top - 6);
    ctx.fillText(colLabels[1], margin.left + split * cell + ((cols - split) * cell) / 2, margin.top - 6);
  }
  // legend
  const ly = margin.top + rows * cell + 12;
  const lw = Math.min(200, width - margin.left - margin.right);
  for (let s = 0; s < lw; s++) {
    ctx.fillStyle = color(((s / (lw - 1)) * 2 - 1) * range);
    ctx.fillRect(margin.left + s, ly, 1, 8);
  }
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'left';
  ctx.fillText(`-${range}`, margin.left, ly + 19);
  ctx.textAlign = 'center';
  ctx.fillText('0', margin.left + lw / 2, ly + 19);
  ctx.textAlign = 'right';
  ctx.fillText(`+${range}`, margin.left + lw, ly + 19);
}

// ---------------------------------------------------------------------------
// 7. Printed report and command line
// ---------------------------------------------------------------------------

/** The program's printed output: G, 2G, ..., kG, the double-and-add trace and the TOY PUBLIC KEY. */
function reportLines(k, G, curve, { listLimit = 64 } = {}) {
  const n = pointOrder(G, curve);
  const lines = [
    `Toy curve: y^2 = x^3 + ${curve.b} (mod ${curve.p})`,
    `Base point G = ${formatPoint(G)}, order ${n}`,
    `Private key k = ${k}`,
    '',
  ];
  if (k <= listLimit) {
    for (const s of multiples(k, G, curve)) lines.push(`${s.i === 1 ? '' : s.i}G = ${formatPoint(s.point)}`);
  } else {
    lines.push(`(${k - 1} additions are too many to print: double-and-add below)`);
  }
  const daa = doubleAndAdd(k, G, curve);
  lines.push('', `Double-and-add, k = ${daa.bits} (binary), ${daa.steps.length} operations:`);
  for (const s of daa.steps) {
    const what = s.op === 'double' ? 'R = 2R' : s.op === 'load' ? 'R = G' : 'R = R + G';
    lines.push(`  bit ${s.bitIndex} (${s.bit}): ${what.padEnd(9)} -> ${s.multiple}G = ${formatPoint(s.result)}`);
  }
  lines.push('', `TOY PUBLIC KEY: Q = ${k}G = ${formatPoint(daa.result)}`);
  return lines;
}

const STRICT_INTEGER = /^\d+$/;

/**
 * Command line: node homework1.js [k] [p]. Arguments must be plain decimal
 * integers: "6.9", "1e3" or "0x1f" are refused instead of being read as
 * something else.
 */
function runCli(argv, print = console.log) {
  const [kArg = String(TASK.k), pArg = String(TASK.p)] = argv;
  const usage = () => {
    print(`usage: node homework1.js [k] [p]   k: integer from 1 to ${Number.MAX_SAFE_INTEGER}, p: one of ${EXPLORATION_PRIMES.join(', ')}`);
    return 1;
  };
  if (!STRICT_INTEGER.test(kArg) || !STRICT_INTEGER.test(pArg)) return usage();
  const k = Number(kArg);
  const p = Number(pArg);
  if (!Number.isSafeInteger(k) || k < 1 || !EXPLORATION_PRIMES.includes(p)) return usage();
  const curve = explorationCurve(p);
  const G = defaultBasePoint(curve);
  reportLines(k, G, curve).forEach((l) => print(l));
  const Q = scalarMultiply(k, G, curve);
  const n = pointOrder(G, curve);
  if (Q !== null) {
    const bf = bruteForceLog(Q, G, curve);
    print(`Brute force: Q = ${bf.k}G found after ${bf.tries} ${bf.tries === 1 ? 'try' : 'tries'} (k mod ${n} = ${k % n})`);
  }
  print('');
  print('Statistical exploration of k -> kG (every k of every subgroup):');
  print('  curve      base             N  chi2 distinct x (p)   r(k,x)  max|phi|  avalanche  SAC>3s     (k1+k2)G');
  const rows = [[explorationCurve(TASK.p), 'pooled'], ...EXTENSION_PRIMES.map((q) => [explorationCurve(q), null])];
  const f = (v, d = 3) => (v === null ? 'n/a' : v.toFixed(d));
  for (const [c, b] of rows) {
    const s = explore(c, b ?? defaultBasePoint(c));
    const u = s.uniformity.x.distinct;
    print(
      `  p=${String(c.p).padEnd(7)} ${(s.pooled ? 'all points' : formatPoint(s.G)).padEnd(12)} ${String(s.N).padStart(6)}` +
        `  ${(u.computable ? `${u.chi2.toFixed(1)} (${u.pValue.toFixed(2)})` : 'n/a').padEnd(19)}` +
        ` ${f(s.correlation.pearsonKX).padStart(7)}  ${f(s.correlation.bits.maxAbs).padStart(8)}` +
        `  ${(s.avalanche.meanFraction === null ? 'n/a' : `${(100 * s.avalanche.meanFraction).toFixed(1)}%`).padStart(9)}` +
        `  ${`${s.avalanche.vsUniform.above}/${s.avalanche.vsUniform.cells}`.padEnd(9)}  ${s.homomorphism.holds}/${s.homomorphism.trials}`,
    );
  }
  return 0;
}

/** True under Node, where the downloadable program can run runCli. */
const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);

return { TASK, EXTENSION_PRIMES, EXPLORATION_PRIMES, P_MAX, POOLED_MAX_P, isPrime, mod, modInv, makeCurve, INFINITY, isOnCurve, formatPoint, assertPoint, negate, samePoint, addDetailed, add, curvePoints, groupOrder, pointOrder, explorationCurve, defaultBasePoint, multiples, doubleAndAdd, scalarMultiply, bruteForceLog, prng, bitLength, expectedBitFraction, pearson, spearman, chiSquarePValue, twoSidedNormalTail, explore, DEFAULT_PALETTE, animationOps, createAnimation, drawBarChart, drawHeatmap, reportLines, runCli, isNode };
})();

// Command line: node homework1.js [k] [p]
if (typeof module === 'object' && module && module.exports) {
  module.exports = Homework1;
  if (typeof require === 'function' && require.main === module) {
    process.exitCode = Homework1.runCli(process.argv.slice(2), console.log);
  }
} else if (typeof window === 'undefined' && typeof process === 'object' && process && process.versions && process.versions.node) {
  process.exitCode = Homework1.runCli(process.argv.slice(2), console.log);
}
