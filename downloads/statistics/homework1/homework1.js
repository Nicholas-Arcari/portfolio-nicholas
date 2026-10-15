/*
 * Homework #1 - Exercise 1 - Statistics - Nicholas Arcari
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

var task$ = (function () {
'use strict';

// src/pages/statistics/hw1/task.js
// I parametri della consegna dell'Homework #1 - Exercise 1, in un modulo a parte: li usano
// i calcoli (homework1.js), i testi e l'elenco degli homework, che cosi'
// citano gli stessi numeri senza dover caricare tutto il resto.

/** The parameters given in the assignment: y^2 = x^3 + 7 (mod 17), G = (1, 5), k = 6. */
const TASK = Object.freeze({ p: 17, a: 0, b: 7, G: Object.freeze({ x: 1, y: 5 }), k: 6 });

return { TASK };
})();

/* global process */
/**
 * Homework #1 - Exercise 1 - Public-key cryptography: PRIVATE KEY -> PUBLIC KEY, as in Ethereum
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

const { TASK: ASSIGNMENT } = task$;

// ---------------------------------------------------------------------------
// 0. The assignment's parameters and input validation
// ---------------------------------------------------------------------------

/** The parameters given in the assignment: y^2 = x^3 + 7 (mod 17), G = (1, 5), k = 6 (from task.js). */
const TASK = ASSIGNMENT;

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

const pointLists = new Map();

/**
 * Every affine point of the curve, sorted by x and then y (O excluded). The
 * list is computed once per curve and frozen: the page asks for it often.
 */
function curvePoints(curve) {
  const key = `${curve.p},${curve.a},${curve.b}`;
  if (pointLists.has(key)) return pointLists.get(key);
  const { p, a, b } = curve;
  const roots = new Map();
  for (let y = 0; y < p; y++) {
    const s = (y * y) % p;
    if (!roots.has(s)) roots.set(s, []);
    roots.get(s).push(y);
  }
  const points = [];
  for (let x = 0; x < p; x++) {
    for (const y of roots.get(mod(x * x * x + a * x + b, p)) || []) points.push(Object.freeze({ x, y }));
  }
  pointLists.set(key, Object.freeze(points));
  return pointLists.get(key);
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
 * Below this many distinct values a uniformity test is still exact, but has
 * almost no power: it could not reject even a clearly non-uniform set.
 */
const LOW_POWER = 20;

/** Random sets, permutations and random reassignments used by the exact tests. */
const SIMULATIONS = Object.freeze({ uniformity: 1000, correlation: 200, avalanche: 200 });

/** Monte Carlo p-value: the observed data count as one of the simulations, so it is never 0. */
const monteCarloP = (asExtreme, sims) => (1 + asExtreme) / (1 + sims);

/** Statistics equal up to rounding count as ties. */
const tie = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

// --- Counting bits by position ---------------------------------------------

/**
 * Positional population count (Harley-Seal): adds to out[offset + j] how
 * many of words[0 .. length-1] have bit j set. Carry-save adders sum the
 * words sixteen at a time, so the cost is a few bitwise operations per word
 * instead of one per bit. The exact tests below count millions of words, and
 * this is what keeps them fast.
 */
function positionalCount(words, length, out, offset = 0, weight = 1) {
  const addBits = (word, w) => {
    for (let bits = word; bits !== 0; bits &= bits - 1) out[offset + 31 - Math.clz32(bits & -bits)] += w;
  };
  // every block of sixteen words leaves one word of "sixteens", counted the
  // same way at the next level, with weight 16
  const sixteensOf = new Int32Array(length >>> 4);
  let blocks = 0;
  let ones = 0;
  let twos = 0;
  let fours = 0;
  let eights = 0;
  let m = 0;
  for (; m + 16 <= length; m += 16) {
    let a;
    let b;
    let u;
    // each line is a carry-save adder: (high, low) = majority and parity of three words
    a = words[m]; b = words[m + 1]; u = ones ^ a; let twosA = (ones & a) | (u & b); ones = u ^ b;
    a = words[m + 2]; b = words[m + 3]; u = ones ^ a; let twosB = (ones & a) | (u & b); ones = u ^ b;
    u = twos ^ twosA; let foursA = (twos & twosA) | (u & twosB); twos = u ^ twosB;
    a = words[m + 4]; b = words[m + 5]; u = ones ^ a; twosA = (ones & a) | (u & b); ones = u ^ b;
    a = words[m + 6]; b = words[m + 7]; u = ones ^ a; twosB = (ones & a) | (u & b); ones = u ^ b;
    u = twos ^ twosA; let foursB = (twos & twosA) | (u & twosB); twos = u ^ twosB;
    u = fours ^ foursA; const eightsA = (fours & foursA) | (u & foursB); fours = u ^ foursB;
    a = words[m + 8]; b = words[m + 9]; u = ones ^ a; twosA = (ones & a) | (u & b); ones = u ^ b;
    a = words[m + 10]; b = words[m + 11]; u = ones ^ a; twosB = (ones & a) | (u & b); ones = u ^ b;
    u = twos ^ twosA; foursA = (twos & twosA) | (u & twosB); twos = u ^ twosB;
    a = words[m + 12]; b = words[m + 13]; u = ones ^ a; twosA = (ones & a) | (u & b); ones = u ^ b;
    a = words[m + 14]; b = words[m + 15]; u = ones ^ a; twosB = (ones & a) | (u & b); ones = u ^ b;
    u = twos ^ twosA; foursB = (twos & twosA) | (u & twosB); twos = u ^ twosB;
    u = fours ^ foursA; const eightsB = (fours & foursA) | (u & foursB); fours = u ^ foursB;
    u = eights ^ eightsA;
    sixteensOf[blocks++] = (eights & eightsA) | (u & eightsB);
    eights = u ^ eightsB;
  }
  for (; m < length; m++) addBits(words[m], weight);
  addBits(ones, weight);
  addBits(twos, 2 * weight);
  addBits(fours, 4 * weight);
  addBits(eights, 8 * weight);
  if (blocks > 0) positionalCount(sixteensOf, blocks, out, offset, 16 * weight);
}

/** Number of bits set in a 32-bit integer. */
function popcount(v) {
  let x = v - ((v >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

/** Fisher-Yates shuffle, in place, with the given random generator. */
function shuffle(array, rand) {
  for (let t = array.length - 1; t > 0; t--) {
    const r = Math.floor(rand() * (t + 1));
    const tmp = array[t];
    array[t] = array[r];
    array[r] = tmp;
  }
}

// --- Uniformity and bits of the values -------------------------------------

/** a^e mod p by repeated squaring: every product stays below 2^53 for p <= P_MAX. */
function modPow(a, e, p) {
  let result = 1;
  let base = mod(a, p);
  let exp = e;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % p;
    base = (base * base) % p;
    exp = Math.floor(exp / 2);
  }
  return result;
}

/** A cube root of unity other than 1 modulo p: it exists exactly when p = 1 (mod 3). */
function cubeRootOfUnity(p) {
  if (p % 3 !== 1) return null;
  for (let h = 2; h < p; h++) {
    const beta = modPow(h, (p - 1) / 3, p);
    if (beta !== 1) return beta;
  }
  return null;
}

/**
 * The symmetry the set of observed x or y values inherits from the curve,
 * as a partition of [0, p) into orbits:
 *   y: {y, p - y}, because a subgroup contains -P = (x, -y) with every P;
 *   x: {x, beta x, beta^2 x} when p = 1 (mod 3), because (beta x, y) is a
 *      point whenever (x, y) is (beta^3 = 1);
 * with {0} on its own. If the set is not a union of these orbits, or there
 * is no symmetry, every value is an orbit of its own.
 */
function symmetryOrbits(present, p, coord) {
  const beta = coord === 'x' ? cubeRootOfUnity(p) : null;
  const kind = coord === 'y' ? 'pairs' : beta === null ? 'none' : 'triples';
  if (kind !== 'none') {
    const seen = new Uint8Array(p);
    const orbits = [];
    let closed = true;
    for (let v = 0; v < p && closed; v++) {
      if (seen[v]) continue;
      let orbit = [v];
      if (v !== 0 && kind === 'pairs') orbit = [v, p - v];
      if (v !== 0 && kind === 'triples') orbit = [v, (v * beta) % p, (((v * beta) % p) * beta) % p];
      for (const w of orbit) seen[w] = 1;
      if (orbit.some((w) => present[w] !== present[v])) closed = false;
      orbits.push(orbit);
    }
    if (closed) return { kind, orbits };
  }
  return { kind: 'none', orbits: Array.from({ length: p }, (_, v) => [v]) };
}

/** Orbits grouped by size, each group with the number of its orbits the observed set contains. */
function strataOf(orbits, present) {
  const bySize = new Map();
  for (const orbit of orbits) {
    if (!bySize.has(orbit.length)) bySize.set(orbit.length, { orbits: [], chosen: 0 });
    const stratum = bySize.get(orbit.length);
    stratum.orbits.push(orbit);
    if (present[orbit[0]]) stratum.chosen++;
  }
  return [...bySize.values()];
}

/**
 * Classes for a test on N observations: B groups of consecutive values, B
 * the largest number up to maxBins that leaves at least MIN_EXPECTED
 * expected observations in every class (Cochran's rule), or 2 if even two
 * classes cannot reach it.
 */
function uniformClasses(N, p, maxBins) {
  let B = null;
  for (let b = Math.min(maxBins, p); b >= 2; b--) {
    if ((Math.floor(p / b) * N) / p >= MIN_EXPECTED) {
      B = b;
      break;
    }
  }
  const bins = B ?? 2;
  const width = new Array(bins).fill(0);
  for (let v = 0; v < p; v++) width[Math.floor((v * bins) / p)]++;
  return {
    bins,
    cochran: B !== null,
    classOf: (v) => Math.floor((v * bins) / p),
    expected: width.map((w) => (w * N) / p),
  };
}

const pearsonChi2 = (observed, expected) => observed.reduce((s, o, j) => s + (o - expected[j]) ** 2 / expected[j], 0);

/**
 * The instinctive test: Pearson's chi-square of every observation against
 * uniform values in [0, p), with the chi-square distribution as reference.
 * It is kept on purpose, together with the reasons it does not hold here.
 */
function naiveUniformityTest(counts, p, maxBins, maxMult) {
  const N = counts.reduce((s, c) => s + c, 0);
  if (N < 2) return { computable: false, exact: false, N, reasons: ['small-sample'] };
  const classes = uniformClasses(N, p, maxBins);
  const observed = new Array(classes.bins).fill(0);
  counts.forEach((c, v) => {
    observed[classes.classOf(v)] += c;
  });
  const chi2 = pearsonChi2(observed, classes.expected);
  const pValue = chiSquarePValue(chi2, classes.bins - 1);
  const minExpected = Math.min(...classes.expected);
  const reasons = [];
  if (!classes.cochran) reasons.push('small-sample');
  reasons.push('exhaustive');
  if (maxMult > 1) reasons.push('duplicates');
  return {
    computable: true,
    exact: false,
    N,
    bins: classes.bins,
    perValue: classes.bins === p,
    df: classes.bins - 1,
    chi2,
    pValue,
    minExpected,
    reasons,
    verdict: pValue < SIGNIFICANCE ? 'reject' : 'notReject',
    leftTail: 1 - pValue,
    tooRegular: 1 - pValue < SIGNIFICANCE,
    alpha: SIGNIFICANCE,
  };
}

/**
 * The exact test on the distinct values. The reference is the same
 * construction done at random: sets with as many orbits of each size as the
 * observed one, drawn without replacement, so that they respect the same
 * symmetry. Pearson's statistic of the observed set is compared with its
 * distribution over `sims` random sets: the p-value is exact up to the
 * Monte Carlo error, with no chi-square approximation and no assumption of
 * independent values.
 */
function* exactUniformityTest(present, p, maxBins, symmetry, sims, rand) {
  const D = present.reduce((s, c) => s + c, 0);
  if (D === p) return { computable: false, exact: true, N: D, symmetry: symmetry.kind, reasons: ['all-values'] };
  if (D < 2) return { computable: false, exact: true, N: D, symmetry: symmetry.kind, reasons: ['small-sample'] };
  const classes = uniformClasses(D, p, maxBins);
  const observed = new Array(classes.bins).fill(0);
  for (let v = 0; v < p; v++) if (present[v]) observed[classes.classOf(v)]++;
  const chi2 = pearsonChi2(observed, classes.expected);
  // per stratum, the classes of the members of every orbit, flattened
  const strata = strataOf(symmetry.orbits, present).map((stratum) => {
    const size = stratum.orbits[0].length;
    const flat = new Int32Array(stratum.orbits.length * size);
    stratum.orbits.forEach((orbit, o) => orbit.forEach((v, m) => {
      flat[o * size + m] = classes.classOf(v);
    }));
    return { size, flat, order: Int32Array.from(stratum.orbits, (_, i) => i), chosen: stratum.chosen };
  });
  const counts = new Float64Array(classes.bins);
  let upper = 0;
  let lower = 0;
  for (let s = 0; s < sims; s++) {
    counts.fill(0);
    for (const { size, flat, order, chosen } of strata) {
      // partial Fisher-Yates: the first `chosen` orbits form a random subset
      for (let i = 0; i < chosen; i++) {
        const j = i + Math.floor(rand() * (order.length - i));
        const pick = order[j];
        order[j] = order[i];
        order[i] = pick;
        for (let m = pick * size, end = m + size; m < end; m++) counts[flat[m]]++;
      }
    }
    const stat = pearsonChi2(counts, classes.expected);
    if (stat >= chi2 || tie(stat, chi2)) upper++;
    if (stat <= chi2 || tie(stat, chi2)) lower++;
    yield;
  }
  const pValue = monteCarloP(upper, sims);
  const leftTail = monteCarloP(lower, sims);
  const reasons = ['exhaustive'];
  if (symmetry.kind !== 'none') reasons.push('orbits');
  if (D < LOW_POWER) reasons.push('low-power');
  return {
    computable: true,
    exact: true,
    N: D,
    bins: classes.bins,
    perValue: classes.bins === p,
    df: classes.bins - 1,
    chi2,
    pValue,
    leftTail,
    sims,
    symmetry: symmetry.kind,
    minExpected: Math.min(...classes.expected),
    reasons,
    verdict: pValue < SIGNIFICANCE ? 'reject' : 'notReject',
    tooRegular: leftTail < SIGNIFICANCE,
    alpha: SIGNIFICANCE,
  };
}

/**
 * Share of ones per bit position among the distinct values, with its exact
 * mean and variance under the same random model as the uniformity test
 * (orbits of each size drawn without replacement): the z-score needs no
 * assumption of independent values. A bit that the symmetry fixes has
 * variance 0 and no z-score.
 */
function orbitBitStats(present, p, symmetry) {
  const L = bitLength(p - 1);
  const D = present.reduce((s, c) => s + c, 0);
  const strata = strataOf(symmetry.orbits, present);
  return Array.from({ length: L }, (_, i) => {
    let ones = 0;
    for (let v = 0; v < p; v++) if (present[v]) ones += (v >>> i) & 1;
    let mean = 0;
    let variance = 0;
    for (const stratum of strata) {
      const M = stratum.orbits.length;
      const m = stratum.chosen;
      if (m === 0) continue;
      const c = stratum.orbits.map((orbit) => orbit.reduce((s, v) => s + ((v >>> i) & 1), 0));
      const mu = c.reduce((s, x) => s + x, 0) / M;
      const s2 = c.reduce((s, x) => s + (x - mu) ** 2, 0) / M;
      mean += m * mu;
      if (M > 1) variance += m * s2 * ((M - m) / (M - 1));
    }
    const sd = Math.sqrt(variance);
    const fixed = sd < 1e-9;
    return {
      bit: i,
      fraction: D ? ones / D : null,
      expected: D ? mean / D : expectedBitFraction(i, p),
      z: D && !fixed ? (ones - mean) / sd : null,
      fixed: D > 0 && fixed,
      distinct: D,
    };
  });
}

/** How many values occur 0, 1, 2, ... times, from per-value counts. */
function multiplicityTable(counts) {
  const table = [];
  for (const c of counts) table[c] = (table[c] || 0) + 1;
  return Array.from(table, (v) => v || 0);
}

/**
 * Uniformity and bits of one coordinate. The naive test uses every
 * observation; but on these curves the observations come in fixed groups
 * (x(kG) = x((n - k)G), and y repeats in triples when p = 1 mod 3), so they
 * are not independent. The exact test keeps each distinct value once and
 * compares the set with random sets that have the same symmetry.
 */
function* coordinateStats(counts, p, maxBins, attainable, coord, rand) {
  const present = counts.map((c) => (c > 0 ? 1 : 0));
  const observedValues = present.reduce((s, c) => s + c, 0);
  const positive = counts.filter((c) => c > 0);
  const minMult = positive.length ? Math.min(...positive) : 0;
  const maxMult = positive.length ? Math.max(...positive) : 0;
  const symmetry = symmetryOrbits(present, p, coord);
  const naive = naiveUniformityTest(counts, p, maxBins, maxMult);
  const distinct = yield* exactUniformityTest(present, p, maxBins, symmetry, SIMULATIONS.uniformity, rand);
  return {
    uniformity: {
      naive,
      distinct,
      observedValues,
      attainable,
      minMult,
      maxMult,
      sameMultiplicity: minMult === maxMult,
      symmetry: symmetry.kind,
    },
    bits: orbitBitStats(present, p, symmetry),
  };
}

// --- Correlation between the bits of k and of the point --------------------

/**
 * Correlation phi (Pearson on 0/1 variables) between every bit of k and
 * every bit of the point, x first and then y, with an exact global test by
 * permutation: the statistic N sum(phi^2) is recomputed after reassigning
 * the outputs to the values of k at random, `sims` times. Under that
 * reference each phi has standard deviation exactly 1/sqrt(N - 1), hence the
 * threshold 3/sqrt(N - 1) for a single cell; how many cells cross it by
 * chance is counted on the permutations too.
 */
function* bitCorrelationTest(ks, xs, ys, L, sims, rand) {
  const N = ks.length;
  const inputBits = bitLength(Math.max(1, ...ks));
  const outputBits = 2 * L;
  const combined = outputBits <= 31;
  const n1 = new Array(inputBits).fill(0);
  const m1 = new Array(outputBits).fill(0);
  for (let t = 0; t < N; t++) {
    for (let i = 0; i < inputBits; i++) n1[i] += (ks[t] >>> i) & 1;
    for (let j = 0; j < L; j++) {
      m1[j] += (xs[t] >>> j) & 1;
      m1[L + j] += (ys[t] >>> j) & 1;
    }
  }
  const den = n1.map((a) => m1.map((b) => Math.sqrt(a * (N - a) * b * (N - b))));
  // both[i][j]: values of k with bit i set whose output has bit j set. For
  // each bit i the outputs of the values of k that have it are copied into a
  // buffer and counted by position; a permutation only changes the outputs.
  const K = Int32Array.from(ks);
  const X = Int32Array.from(xs);
  const Y = Int32Array.from(ys);
  const withBit = Array.from({ length: inputBits }, (_, i) => {
    const list = [];
    for (let t = 0; t < N; t++) if ((K[t] >>> i) & 1) list.push(t);
    return Int32Array.from(list);
  });
  const outX = new Int32Array(N);
  const outY = new Int32Array(N);
  const buffer = new Int32Array(N);
  const both = Array.from({ length: inputBits }, () => new Array(outputBits).fill(0));
  const countBoth = (order) => {
    for (let t = 0; t < N; t++) {
      const u = order === null ? t : order[t];
      outX[t] = combined ? X[u] | (Y[u] << L) : X[u];
      outY[t] = Y[u];
    }
    for (let i = 0; i < inputBits; i++) {
      both[i].fill(0);
      const rows = withBit[i];
      for (let m = 0; m < rows.length; m++) buffer[m] = outX[rows[m]];
      positionalCount(buffer, rows.length, both[i], 0);
      if (!combined) {
        for (let m = 0; m < rows.length; m++) buffer[m] = outY[rows[m]];
        positionalCount(buffer, rows.length, both[i], L);
      }
    }
  };
  const phi = (i, j) => (den[i][j] === 0 ? null : (N * both[i][j] - n1[i] * m1[j]) / den[i][j]);
  const threshold = N > 1 ? 3 / Math.sqrt(N - 1) : null;

  countBoth(null);
  const values = [];
  let statistic = 0;
  let maxAbs = 0;
  let sumAbs = 0;
  let defined = 0;
  let above = 0;
  for (let i = 0; i < inputBits; i++) {
    const row = [];
    for (let j = 0; j < outputBits; j++) {
      const r = phi(i, j);
      row.push(r);
      if (r === null) continue;
      defined++;
      sumAbs += Math.abs(r);
      maxAbs = Math.max(maxAbs, Math.abs(r));
      statistic += N * r * r;
      if (Math.abs(r) > threshold) above++;
    }
    values.push(row);
  }

  let asExtreme = 0;
  let aboveTotal = 0;
  const runs = defined && N > 2 ? sims : 0;
  const order = Int32Array.from({ length: N }, (_, t) => t);
  for (let s = 0; s < runs; s++) {
    shuffle(order, rand);
    countBoth(order);
    let stat = 0;
    for (let i = 0; i < inputBits; i++) {
      for (let j = 0; j < outputBits; j++) {
        const r = phi(i, j);
        if (r === null) continue;
        stat += N * r * r;
        if (Math.abs(r) > threshold) aboveTotal++;
      }
    }
    if (stat >= statistic || tie(stat, statistic)) asExtreme++;
    yield;
  }
  return {
    inputBits,
    outputBits,
    values,
    threshold,
    maxAbs: defined ? maxAbs : null,
    meanAbs: defined ? sumAbs / defined : null,
    defined,
    above,
    expectedAbove: runs ? aboveTotal / runs : null,
    statistic: defined ? statistic : null,
    pValue: runs ? monteCarloP(asExtreme, runs) : null,
    sims: runs,
  };
}

// --- Avalanche ---------------------------------------------------------------

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
 * The pairs {k, k xor 2^i} of one subgroup, row by row: each unordered pair
 * once, from the k whose bit i is 0, and only if both values are in
 * [1, n - 1].
 */
function avalanchePairs(n, inputBits) {
  return Array.from({ length: inputBits }, (_, i) => {
    const low = [];
    const high = [];
    for (let k = 1; k < n; k++) {
      if ((k >>> i) & 1) continue;
      const k2 = k ^ (1 << i);
      if (k2 < n) {
        low.push(k);
        high.push(k2);
      }
    }
    return { low: Int32Array.from(low), high: Int32Array.from(high) };
  });
}

/**
 * Flip counts of every cell (bit of k, bit of x then y) for the values X[k],
 * Y[k] of each group: for every row, the masks of the flipped bits of all its
 * pairs, counted by position.
 */
function countFlips(tables, pairsOf, inputBits, L, flips, buffer) {
  const combined = 2 * L <= 31;
  for (let i = 0; i < inputBits; i++) flips[i].fill(0);
  for (let g = 0; g < tables.length; g++) {
    const { X, Y } = tables[g];
    const rows = pairsOf[g];
    for (let i = 0; i < rows.length; i++) {
      const { low, high } = rows[i];
      for (let t = 0; t < low.length; t++) {
        const dx = X[low[t]] ^ X[high[t]];
        buffer[t] = combined ? dx | ((Y[low[t]] ^ Y[high[t]]) << L) : dx;
      }
      positionalCount(buffer, low.length, flips[i], 0);
      if (!combined) {
        for (let t = 0; t < low.length; t++) buffer[t] = Y[low[t]] ^ Y[high[t]];
        positionalCount(buffer, low.length, flips[i], L);
      }
    }
  }
}

/**
 * Exact test of the avalanche matrix by random relabeling. In each subgroup
 * the map k -> kG sends the pair {k, n - k} to a pair of opposite points
 * {P, -P}. The reference functions keep exactly this structure (the same
 * image, the same symmetry f(n - k) = -f(k), the same pairs of k) and only
 * reassign at random which pair {P, -P} goes to which pair {k, n - k}, and
 * with which sign. Every cell is standardized with the mean and standard
 * deviation it has over `sims` such functions, and sum(z^2) of the observed
 * matrix is compared with the same statistic of each function: the
 * dependence between measurements (mirror pairs with the same x, pairs that
 * share a point) is in the reference too, and needs no correction.
 */
function* avalancheTest(groups, p, L, inputBits, pairsOf, observedRates, pairsPerBit, sims, rand) {
  const outputBits = 2 * L;
  const cells = inputBits * outputBits;
  const buffer = new Int32Array(Math.max(1, ...groups.map((g) => g.n)));
  const flips = Array.from({ length: inputBits }, () => new Array(outputBits).fill(0));
  const tables = groups.map((g) => ({ X: new Int32Array(g.n), Y: new Int32Array(g.n) }));
  const orbitOrder = groups.map((g) => Int32Array.from({ length: Math.floor((g.n - 1) / 2) }, (_, o) => o));
  const opposite = groups.map((g) => Int32Array.from(g.ys, (y) => (y === 0 ? 0 : p - y)));
  const rates = new Float64Array(sims * cells);

  for (let s = 0; s < sims; s++) {
    for (let gi = 0; gi < groups.length; gi++) {
      const { n, xs, ys } = groups[gi];
      const { X, Y } = tables[gi];
      const order = orbitOrder[gi];
      const negative = opposite[gi];
      shuffle(order, rand);
      let signs = 0;
      for (let o = 0; o < order.length; o++) {
        if ((o & 31) === 0) signs = Math.floor(rand() * 4294967296); // 32 random signs at a time
        const r = order[o];
        const k = o + 1;
        X[k] = xs[r];
        X[n - k] = xs[r];
        if ((signs >>> (o & 31)) & 1) {
          Y[k] = negative[r];
          Y[n - k] = ys[r];
        } else {
          Y[k] = ys[r];
          Y[n - k] = negative[r];
        }
      }
      if (n % 2 === 0) {
        // the point of order 2 is its own opposite: f(n/2) is fixed
        X[n / 2] = xs[n / 2 - 1];
        Y[n / 2] = ys[n / 2 - 1];
      }
    }
    countFlips(tables, pairsOf, inputBits, L, flips, buffer);
    for (let i = 0; i < inputBits; i++) {
      for (let j = 0; j < outputBits; j++) rates[s * cells + i * outputBits + j] = pairsPerBit[i] ? flips[i][j] / pairsPerBit[i] : NaN;
    }
    yield;
  }

  const mean = new Float64Array(cells);
  const sd = new Float64Array(cells);
  for (let c = 0; c < cells; c++) {
    let sum1 = 0;
    let sum2 = 0;
    for (let s = 0; s < sims; s++) {
      const v = rates[s * cells + c];
      sum1 += v;
      sum2 += v * v;
    }
    mean[c] = sum1 / sims;
    sd[c] = Math.sqrt(Math.max(0, sum2 / sims - mean[c] * mean[c]));
  }
  const usable = (c) => sims > 1 && Number.isFinite(mean[c]) && sd[c] > 1e-12;
  const z = Array.from({ length: inputBits }, (_, i) =>
    Array.from({ length: outputBits }, (_, j) => {
      const c = i * outputBits + j;
      return usable(c) && observedRates[i][j] !== null ? (observedRates[i][j] - mean[c]) / sd[c] : null;
    }),
  );
  let statistic = 0;
  let above = 0;
  let used = 0;
  z.forEach((row) =>
    row.forEach((v) => {
      if (v === null) return;
      used++;
      statistic += v * v;
      if (Math.abs(v) > 3) above++;
    }),
  );
  let asExtreme = 0;
  let aboveTotal = 0;
  for (let s = 0; s < sims; s++) {
    let stat = 0;
    for (let c = 0; c < cells; c++) {
      if (!usable(c)) continue;
      const v = (rates[s * cells + c] - mean[c]) / sd[c];
      stat += v * v;
      if (Math.abs(v) > 3) aboveTotal++;
    }
    if (stat >= statistic || tie(stat, statistic)) asExtreme++;
  }
  return {
    sims,
    cells: used,
    z,
    statistic: used ? statistic : null,
    pValue: used ? monteCarloP(asExtreme, sims) : null,
    above,
    expectedAbove: used ? aboveTotal / sims : null,
  };
}

/**
 * The instinctive avalanche test: every cell against the ideal flip rate of
 * uniform values, as if every measurement were independent, and
 * sum(z^2) ~ chi-square(cells). Kept on purpose, with the reasons it fails.
 */
function naiveAvalancheTest(sac, pairsPerBit, ideal) {
  let above = 0;
  let z2 = 0;
  let cells = 0;
  sac.forEach((row, i) =>
    row.forEach((v, j) => {
      if (v === null) return;
      const sigma = Math.sqrt((ideal[j] * (1 - ideal[j])) / pairsPerBit[i]);
      if (!(sigma > 0)) return;
      const z = (v - ideal[j]) / sigma;
      cells++;
      z2 += z * z;
      if (Math.abs(z) > 3) above++;
    }),
  );
  return {
    cells,
    above,
    expectedAbove: cells * twoSidedNormalTail(3),
    z2,
    pValue: cells ? chiSquarePValue(z2, cells) : null,
  };
}

// --- The exploration -----------------------------------------------------

/**
 * Statistical exploration of the map k -> kG, as a generator that yields
 * between units of work, so that a page can run it in slices without ever
 * blocking (exploreAsync) and a worker or the command line can run it in
 * one go (explore).
 *
 * base is a point (one base point G: k runs over 1, ..., n - 1, the whole
 * subgroup generated by G) or 'pooled' (every affine point of the curve in
 * turn as base point, each with its own k = 1, ..., ord - 1). Every value of
 * k is used, so the "sample" is in fact the whole population: the tests
 * below are descriptive, and the texts say so. All the random choices of the
 * exact tests come from a seeded generator, so the page, the downloadable
 * program and the command line print the same numbers.
 */
function* exploreSteps(curve, base, { homomorphismTrials = 200, seed = 2026 } = {}) {
  const { p } = curve;
  const pooled = base === 'pooled';
  if (pooled && p > POOLED_MAX_P) fail(`pooling every base point is limited to p <= ${POOLED_MAX_P}`);
  if (!pooled) assertPoint(base, curve);
  const bases = pooled ? curvePoints(curve) : [base];
  const L = bitLength(p - 1);
  const rand = prng(seed);

  // enumerate the subgroups: one table of multiples per base point
  const groups = [];
  for (const G of bases) {
    const gx = [];
    const gy = [];
    for (let R = G; R !== null; R = sum(R, G, curve)) {
      gx.push(R.x);
      gy.push(R.y);
    }
    groups.push({ G, n: gx.length + 1, xs: Int32Array.from(gx), ys: Int32Array.from(gy) });
    yield;
  }
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

  // uniformity and bits, with the exact tests
  const statsX = yield* coordinateStats(freqX, p, bins, curveXs.size, 'x', rand);
  const statsY = yield* coordinateStats(freqY, p, bins, curveYs.size, 'y', rand);

  // a structural fact: kG and (n - k)G are opposite points, with the same x
  const mirror = { pairs: 0, matches: 0 };
  for (const g of groups) {
    for (let k = 1; k < g.n - k; k++) {
      mirror.pairs++;
      if (g.xs[k - 1] === g.xs[g.n - k - 1]) mirror.matches++;
    }
  }

  // correlation between the bits of k and of the point, exact test by permutation
  const bitCorrelation = yield* bitCorrelationTest(ks, xs, ys, L, SIMULATIONS.correlation, rand);

  // avalanche: flip each bit of k, for every k of every subgroup. The ideal
  // flip rate of an output bit is that of two independent uniform values in
  // [0, p): 2q(1 - q), below 1/2 for the top bits when p is not a power of 2.
  const outputBits = 2 * L;
  const ideal = Array.from({ length: outputBits }, (_, j) => {
    const q = expectedBitFraction(j % L, p);
    return 2 * q * (1 - q);
  });
  const inputBits = Math.max(1, ...groups.map((g) => bitLength(g.n - 1)));
  const pairsOf = groups.map((g) => avalanchePairs(g.n, inputBits));
  const pairsPerBit = new Array(inputBits).fill(0);
  const mirroredPerBit = new Array(inputBits).fill(0);
  const distances = new Array(outputBits + 1).fill(0);
  let flipTotal = 0;
  groups.forEach((g, gi) => {
    pairsOf[gi].forEach(({ low, high }, i) => {
      for (let t = 0; t < low.length; t++) {
        const k = low[t];
        const k2 = high[t];
        // its mirror {n - k2, n - k} has the same x values: is it counted too?
        const mirrorLow = g.n - k2;
        if (mirrorLow !== k && !((mirrorLow >>> i) & 1)) mirroredPerBit[i]++;
        const d = popcount(g.xs[k - 1] ^ g.xs[k2 - 1]) + popcount(g.ys[k - 1] ^ g.ys[k2 - 1]);
        pairsPerBit[i]++;
        distances[d]++;
        flipTotal += d;
      }
    });
  });
  const observedTables = groups.map((g) => ({ X: Int32Array.from([0, ...g.xs, 0]), Y: Int32Array.from([0, ...g.ys, 0]) }));
  const flips = Array.from({ length: inputBits }, () => new Array(outputBits).fill(0));
  countFlips(observedTables, pairsOf, inputBits, L, flips, new Int32Array(Math.max(1, ...groups.map((g) => g.n))));
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
  yield;
  const exactAvalanche = measurements
    ? yield* avalancheTest(groups, p, L, inputBits, pairsOf, sac, pairsPerBit, SIMULATIONS.avalanche, rand)
    : { sims: 0, cells: 0, z: sac.map((row) => row.map(() => null)), statistic: null, pValue: null, above: 0, expectedAbove: null };

  // the homomorphism (k1 + k2)G = k1G + k2G, on random pairs
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
    histogram: { bins, x: histogram(freqX), y: histogram(freqY), expected: widths.map((w) => (w * N) / p) },
    uniformity: { x: statsX.uniformity, y: statsY.uniformity },
    bits: { x: statsX.bits, y: statsY.bits },
    correlation: {
      pearsonKX: pearson(ks, xs),
      pearsonKY: pearson(ks, ys),
      spearmanKX: spearman(ks, xs),
      spearmanKY: spearman(ks, ys),
      mirror,
      bits: bitCorrelation,
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
      pairsPerBit,
      mirrorShareAll: measurements ? mirroredPerBit.reduce((s, m) => s + m, 0) / measurements : 0,
      maxDev: cells ? maxDev : null,
      meanDev: cells ? sumDev / cells : null,
      cells,
      naive: naiveAvalancheTest(sac, pairsPerBit, ideal),
      exact: exactAvalanche,
    },
    homomorphism: { trials: usable.length ? homomorphismTrials : 0, holds },
  };
}

/** The whole exploration in one go: for a worker, the command line and the tests. */
function explore(curve, base, options) {
  const steps = exploreSteps(curve, base, options);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/**
 * The exploration in slices of a few milliseconds, with the browser free to
 * draw and react in between: the downloadable page uses it, because a page
 * opened from file:// cannot start a worker.
 */
function exploreAsync(curve, base, options, { sliceMs = 12, schedule = (run) => setTimeout(run, 0) } = {}) {
  return new Promise((resolve, reject) => {
    let steps;
    try {
      steps = exploreSteps(curve, base, options);
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

/**
 * Sizes a canvas for drawing at the device's pixel density. `knownWidth`,
 * when given (for example by a ResizeObserver), avoids reading clientWidth:
 * reading it after another canvas has just been resized would force the
 * browser to lay out the whole page again, once per chart.
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

/** A number for a chart label, with the decimal separator of the page's language. */
const chartNumber = (text, decimal) => (decimal === '.' ? text : text.replace('.', decimal));

/**
 * Bar chart of `values`, with an optional dashed reference (`expected`, one
 * value per bar or a single number) and labels under the first, the middle
 * and the last bar. With more bars than pixels, each pixel column shows the
 * largest of its bars, so that no value disappears. `decimal` is the decimal
 * separator of the axis labels ("," in Italian).
 */
function drawBarChart(canvas, { values, expected = null, labels = null, max = null, decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const { ctx, width, height } = setupCanvas(canvas, BAR_ASPECT, knownWidth);
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { margin, w, h, columns, perColumn, colW } = barLayout(values.length, width);
  const refs = expected === null ? [] : Array.isArray(expected) ? expected : values.map(() => expected);
  const top = max ?? Math.max(1e-9, ...values, ...refs) * 1.1;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = pal.grid;
  ctx.strokeRect(margin.left, margin.top, w, h);

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
  const fmt = (v) => chartNumber(top <= 1.5 ? v.toFixed(2) : String(Math.round(v)), decimal);
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

const BAR_ASPECT = 0.42;
const BAR_MARGIN = { left: 34, right: 8, top: 10, bottom: 22 };
const HEATMAP_MARGIN = { left: 34, right: 8, top: 18, bottom: 34 };
const HEATMAP_MIN_CELL = 4;

/**
 * Where the bars of drawBarChart lie on a canvas of this width: the plot
 * area and its pixel columns, each showing perColumn bars (more than one
 * when there are more bars than pixels).
 */
function barLayout(bars, width) {
  const height = Math.round(width * BAR_ASPECT);
  const w = width - BAR_MARGIN.left - BAR_MARGIN.right;
  const h = height - BAR_MARGIN.top - BAR_MARGIN.bottom;
  const columns = Math.min(bars, Math.max(1, Math.floor(w)));
  return { margin: BAR_MARGIN, w, h, height, columns, perColumn: bars / columns, colW: w / columns };
}

/** Where the cells of drawHeatmap lie on a canvas of this width. */
function heatmapLayout(values, width) {
  const rows = values.length;
  const cols = rows ? values[0].length : 0;
  const cell = Math.max(HEATMAP_MIN_CELL, (width - HEATMAP_MARGIN.left - HEATMAP_MARGIN.right) / Math.max(1, cols));
  return { margin: HEATMAP_MARGIN, rows, cols, cell, height: Math.round(HEATMAP_MARGIN.top + HEATMAP_MARGIN.bottom + rows * cell) };
}

/**
 * The height, in CSS pixels, that drawBarChart or drawHeatmap gives a canvas
 * of this width: a page can reserve the space before drawing, so that the
 * layout does not move when the chart appears.
 */
function chartHeight(draw, data, width) {
  return draw === drawHeatmap ? heatmapLayout(data.values, width).height : barLayout(data.values.length, width).height;
}

/**
 * The bar or the cell under the point (x, y) of a chart drawn at this
 * width, in CSS pixels from its top left corner; null outside the plot.
 * For bars, the values [from, to) of the pixel column (more than one when
 * there are more bars than pixels); for heatmaps, row and column. `rect` is
 * the rectangle to outline.
 */
function chartHitTest(draw, data, width, x, y) {
  if (draw === drawHeatmap) {
    const { margin, rows, cols, cell } = heatmapLayout(data.values, width);
    const col = Math.floor((x - margin.left) / cell);
    const row = Math.floor((y - margin.top) / cell);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    return { kind: 'cell', row, col, rect: { x: margin.left + col * cell, y: margin.top + row * cell, width: cell, height: cell } };
  }
  const { margin, w, h, columns, perColumn, colW } = barLayout(data.values.length, width);
  if (x < margin.left || x >= margin.left + w || y < margin.top || y > margin.top + h) return null;
  const column = Math.min(columns - 1, Math.floor((x - margin.left) / colW));
  const from = Math.floor(column * perColumn);
  const to = Math.max(Math.floor((column + 1) * perColumn), from + 1);
  return { kind: 'bar', from, to, rect: { x: margin.left + column * colW, y: margin.top, width: colW, height: h } };
}

/**
 * Explains a chart under the pointer: the bar or the cell below the mouse,
 * or below the finger after a tap, gets an outline and a label with the
 * text describe(hit), inserted as plain text. Both stay inside the
 * canvas's parent, which must be positioned. Returns the function that
 * removes them.
 */
function attachChartTooltip(canvas, { draw, data, describe }) {
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
  const hide = () => {
    mark.hidden = true;
    tip.hidden = true;
    shown = null;
  };
  const show = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const hit = chartHitTest(draw, data, r.width, x, y);
    const text = hit && describe(hit);
    if (!text) {
      hide();
      return;
    }
    const left = canvas.offsetLeft;
    const top = canvas.offsetTop;
    Object.assign(mark.style, {
      left: `${left + hit.rect.x}px`,
      top: `${top + hit.rect.y}px`,
      width: `${Math.max(2, hit.rect.width)}px`,
      height: `${hit.rect.height}px`,
    });
    mark.classList.toggle('is-thin', hit.rect.width < 6);
    mark.hidden = false;
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
  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => show(clientX, clientY));
  };
  // a finger leaves the canvas as soon as it is lifted: the label stays until a tap elsewhere
  const onLeave = (e) => {
    if (e.pointerType !== 'touch') hide();
  };
  const onDown = (e) => {
    if (e.pointerType === 'touch') show(e.clientX, e.clientY);
  };
  const onDocumentDown = (e) => {
    if (e.target !== canvas) hide();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerdown', onDocumentDown);
  return () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerdown', onDocumentDown);
    canvas.classList.remove('has-tip');
    mark.remove();
    tip.remove();
  };
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
 * bits of k, columns the bits of x and then of y, split by a line. `decimal`
 * is the decimal separator of the legend.
 */
function drawHeatmap(canvas, { values, range = 1, split = null, rowLabel = '', colLabels = ['', ''], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const { margin, rows, cols, cell } = heatmapLayout(values, width);
  const { ctx, height } = setupCanvas(canvas, (margin.top + margin.bottom + rows * cell) / width, width);
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
  ctx.fillText(`-${chartNumber(String(range), decimal)}`, margin.left, ly + 19);
  ctx.textAlign = 'center';
  ctx.fillText('0', margin.left + lw / 2, ly + 19);
  ctx.textAlign = 'right';
  ctx.fillText(`+${chartNumber(String(range), decimal)}`, margin.left + lw, ly + 19);
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
  print('Statistical exploration of k -> kG (every k of every subgroup; exact p-values,');
  print(`random sets: ${SIMULATIONS.uniformity}, permutations: ${SIMULATIONS.correlation}, relabelings: ${SIMULATIONS.avalanche}):`);
  print('  curve     base              N  uniform x  uniform y   r(k,x)  bits phi  avalanche  SAC p   (k1+k2)G');
  const rows = [[explorationCurve(TASK.p), 'pooled'], ...EXTENSION_PRIMES.map((q) => [explorationCurve(q), null])];
  const f = (v, d = 3) => (v === null || v === undefined ? 'n/a' : v.toFixed(d));
  const test = (t) => (t.computable ? `p=${t.pValue.toFixed(3)}` : 'n/a');
  for (const [c, b] of rows) {
    const s = explore(c, b ?? defaultBasePoint(c));
    print(
      `  p=${String(c.p).padEnd(7)} ${(s.pooled ? 'all points' : formatPoint(s.G)).padEnd(12)} ${String(s.N).padStart(6)}` +
        `  ${test(s.uniformity.x.distinct).padEnd(9)}  ${test(s.uniformity.y.distinct).padEnd(9)}` +
        ` ${f(s.correlation.pearsonKX).padStart(7)}  ${`p=${f(s.correlation.bits.pValue)}`.padEnd(8)}` +
        `  ${(s.avalanche.meanFraction === null ? 'n/a' : `${(100 * s.avalanche.meanFraction).toFixed(1)}%`).padStart(9)}` +
        `  ${f(s.avalanche.exact.pValue).padEnd(6)}  ${s.homomorphism.holds}/${s.homomorphism.trials}`,
    );
  }
  return 0;
}

/** True under Node, where the downloadable program can run runCli. */
const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);

return { TASK, EXTENSION_PRIMES, EXPLORATION_PRIMES, P_MAX, POOLED_MAX_P, isPrime, mod, modInv, makeCurve, INFINITY, isOnCurve, formatPoint, assertPoint, negate, samePoint, addDetailed, add, curvePoints, groupOrder, pointOrder, explorationCurve, defaultBasePoint, multiples, doubleAndAdd, scalarMultiply, bruteForceLog, prng, bitLength, expectedBitFraction, pearson, spearman, chiSquarePValue, twoSidedNormalTail, SIMULATIONS, exploreSteps, explore, exploreAsync, DEFAULT_PALETTE, animationOps, createAnimation, drawBarChart, chartHeight, chartHitTest, attachChartTooltip, drawHeatmap, reportLines, runCli, isNode };
})();

// src/pages/statistics/hw1/standalone/cli.js
// La coda del file homework1.js scaricabile: la riga di comando
// node homework1.js [k] [p] e l'uso da altri script. La build la aggiunge
// dopo la libreria cosi' com'e', quindi qui non ci sono import ne' export.
//
// Funziona qualunque sia il nome del file, e in entrambi i modi in cui Node
// puo' caricarlo:
//   - CommonJS (il package.json accanto lo dichiara): require('./homework1.js')
//     restituisce la libreria, e la riga di comando parte solo se il file e'
//     quello eseguito (require.main);
//   - modulo ES (per esempio copiato da solo in un progetto con
//     "type": "module"): la libreria e' globalThis.Homework1, e la riga di
//     comando parte solo se il file e' quello eseguito, cosa che qui si
//     ricava dalla traccia dello stack, l'unico modo che non richiede
//     import.meta (che in uno script classico sarebbe un errore di sintassi).

// Command line: node homework1.js [k] [p]
(function () {
  if (typeof window !== 'undefined' || typeof process !== 'object' || !process || !process.versions || !process.versions.node) return;
  const run = () => {
    process.exitCode = Homework1.runCli(process.argv.slice(2), console.log);
  };

  if (typeof module === 'object' && module && module.exports) {
    module.exports = Homework1;
    if (typeof require === 'function' && require.main === module) run();
    return;
  }

  globalThis.Homework1 = Homework1;
  // where is this file? the first frame of a fresh stack trace says it
  const frame = (new Error().stack || '').split('\n').find((line) => /^\s+at /.test(line)) || '';
  const location = frame
    .replace(/^\s+at\s+/, '')
    .replace(/^[^(]*\((.*)\)$/, '$1')
    .replace(/:\d+:\d+$/, '');
  const normalize = (path) => {
    let s = String(path);
    if (s.startsWith('file://')) {
      s = decodeURIComponent(s.slice('file://'.length));
      if (/^\/[A-Za-z]:/.test(s)) s = s.slice(1);
    }
    s = s.replace(/\\/g, '/');
    return /^[A-Za-z]:\//.test(s) ? s.toLowerCase() : s;
  };
  const fs = typeof process.getBuiltinModule === 'function' ? process.getBuiltinModule('fs') : null;
  const real = (path) => {
    try {
      return fs ? fs.realpathSync(path) : path;
    } catch {
      return path;
    }
  };
  const entry = process.argv[1] ? normalize(real(process.argv[1])) : '';
  const self = normalize(location);
  if (entry && (entry === self || `${entry}.js` === self)) run();
})();
