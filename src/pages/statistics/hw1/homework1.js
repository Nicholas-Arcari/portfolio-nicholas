/* global process */
/**
 * HMWK 1 - Public-key cryptography: PRIVATE KEY -> PUBLIC KEY, as in Ethereum
 * Sapienza University of Rome - MSc in Cybersecurity (LM-66) - Statistics
 * Nicholas Arcari
 *
 * Elliptic-curve scalar multiplication Q = kG on toy curves with the same
 * equation as Ethereum's secp256k1, y^2 = x^3 + 7, but over tiny prime
 * fields, so that every step can be printed, animated and measured.
 *
 *   1. Field and curve arithmetic (point addition, doubling, negation)
 *   2. Scalar multiplication: repeated addition G, 2G, ..., kG and double-and-add
 *   3. Brute-force inversion: why a toy key is not one-way
 *   4. Statistical exploration of k -> kG
 *   5. Slowed-down animation of the algorithm on a <canvas> (browser)
 *   6. Bar charts for the statistics on a <canvas> (browser)
 *   7. Command line:  node homework1.js [k] [p]
 *
 * No dependencies. Toy numbers only: curves this small offer no security.
 */

// ---------------------------------------------------------------------------
// 1. Field and curve arithmetic
// ---------------------------------------------------------------------------

/** Non-negative remainder: mod(-3, 17) = 14. */
export const mod = (a, p) => ((a % p) + p) % p;

/** Inverse of a modulo p with the extended Euclidean algorithm. */
export function modInv(a, p) {
  let [r0, r1] = [mod(a, p), p];
  let [s0, s1] = [1, 0];
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  if (r0 !== 1) throw new RangeError(`${a} has no inverse modulo ${p}`);
  return mod(s0, p);
}

/** The curve y^2 = x^3 + a*x + b over F_p; secp256k1 has a = 0 and b = 7. */
export const makeCurve = (p, b = 7, a = 0) => ({ p, a, b });

/** The point at infinity O, identity of the group, is represented by null. */
export const INFINITY = null;

export const isOnCurve = (P, { p, a, b }) =>
  P === null || mod(P.y * P.y - (P.x * P.x * P.x + a * P.x + b), p) === 0;

export const negate = (P, { p }) => (P === null ? null : { x: P.x, y: mod(-P.y, p) });

export const samePoint = (P, Q) =>
  P === null || Q === null ? P === Q : P.x === Q.x && P.y === Q.y;

export const formatPoint = (P) => (P === null ? 'O' : `(${P.x}, ${P.y})`);

/**
 * P + Q with the chord-and-tangent rule, keeping the intermediate values:
 * the slope lambda of the line through P and Q (the tangent when P = Q) and
 * the third point where that line meets the curve again, which is -R.
 * The sum R = P + Q is that third point reflected: (x3, -y3).
 *
 *   add:     lambda = (yQ - yP) / (xQ - xP)
 *   double:  lambda = (3 xP^2 + a) / (2 yP)
 *   x3 = lambda^2 - xP - xQ,   y3 = lambda (xP - x3) - yP     (all mod p)
 */
export function addDetailed(P, Q, curve) {
  const { p, a } = curve;
  if (P === null) return { kind: 'identity', result: Q, lambda: null, third: null, vertical: false };
  if (Q === null) return { kind: 'identity', result: P, lambda: null, third: null, vertical: false };
  const doubling = samePoint(P, Q);
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

export const add = (P, Q, curve) => addDetailed(P, Q, curve).result;

/** Every affine point of the curve, sorted by x and then y (O excluded). */
export function curvePoints(curve) {
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

/** Number of points of the curve, O included. */
export const groupOrder = (curve) => curvePoints(curve).length + 1;

/** Order of P: the smallest n > 0 with nP = O. */
export function pointOrder(P, curve) {
  // n counts P, 2P, 3P, ... until the first multiple that is O
  let n = 1;
  for (let R = P; R !== null; R = add(R, P, curve)) n++;
  return P === null ? 1 : n;
}

/**
 * The default base point: the one in the assignment on the mod-17 curve,
 * otherwise the first point of maximal order (on a curve of prime order,
 * like secp256k1, every point except O generates the whole group).
 */
export function defaultBasePoint(curve) {
  if (curve.p === 17 && curve.b === 7 && curve.a === 0) return { x: 1, y: 5 };
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
export function multiples(k, G, curve) {
  const steps = [{ i: 1, point: G, kind: 'start', lambda: null, from: null, third: null, vertical: false }];
  let R = G;
  for (let i = 2; i <= k; i++) {
    const d = addDetailed(R, G, curve);
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
export function doubleAndAdd(k, G, curve) {
  if (!Number.isInteger(k) || k < 1) throw new RangeError('k must be a positive integer');
  const bits = k.toString(2);
  const steps = [];
  let R = null;
  let multiple = 0;
  for (let j = 0; j < bits.length; j++) {
    if (j > 0) {
      const d = addDetailed(R, R, curve);
      multiple *= 2;
      steps.push({ bitIndex: j, bit: bits[j], op: 'double', before: R, operand: R, multiple, ...d });
      R = d.result;
    }
    if (bits[j] === '1') {
      const d = addDetailed(R, G, curve);
      multiple += 1;
      steps.push({ bitIndex: j, bit: bits[j], op: j === 0 ? 'load' : 'add', before: R, operand: G, multiple, ...d });
      R = d.result;
    }
  }
  return { bits, steps, result: R };
}

/** Q = kG, the public key of the private key k. */
export const scalarMultiply = (k, G, curve) => (k === 0 ? null : doubleAndAdd(k, G, curve).result);

// ---------------------------------------------------------------------------
// 3. Brute-force inversion
// ---------------------------------------------------------------------------

/**
 * Recovers k from Q = kG by trying G, 2G, 3G, ...: at most n tries, n being
 * the order of G. On a toy curve that is instantaneous; on secp256k1
 * n is about 1.16 * 10^77 and the same loop would never finish.
 */
export function bruteForceLog(Q, G, curve) {
  let R = G;
  for (let k = 1; R !== null; k++) {
    if (samePoint(R, Q)) return { k, tries: k };
    R = add(R, G, curve);
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Statistical exploration
// ---------------------------------------------------------------------------

/** Seeded generator (mulberry32): the page and the command line draw the same numbers. */
export function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const bitLength = (n) => (n < 1 ? 0 : n.toString(2).length);

const popcount = (v) => {
  let c = 0;
  for (let w = v; w; w >>>= 1) c += w & 1;
  return c;
};

/** Fraction of the integers in [0, p) that have bit i set: what uniform values would give. */
export function expectedBitFraction(i, p) {
  const half = 2 ** i;
  const block = 2 * half;
  return (Math.floor(p / block) * half + Math.max(0, (p % block) - half)) / p;
}

/** Pearson correlation coefficient. */
export function pearson(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
}

function erf(z) {
  // Abramowitz and Stegun 7.1.26, error below 1.5e-7
  const sign = Math.sign(z);
  const x = Math.abs(z);
  const t = 1 / (1 + 0.3275911 * x);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - poly * Math.exp(-x * x));
}

/** P(X >= chi2) for a chi-square with df degrees of freedom (Wilson-Hilferty approximation). */
export function chiSquarePValue(chi2, df) {
  const z = (Math.cbrt(chi2 / df) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  return 1 - 0.5 * (1 + erf(z / Math.SQRT2));
}

/** How many values occur 0, 1, 2, ... times among `values` taken from [0, p). */
function multiplicities(values, p) {
  const count = new Array(p).fill(0);
  for (const v of values) count[v]++;
  const table = [];
  for (const c of count) table[c] = (table[c] || 0) + 1;
  return Array.from(table, (v) => v || 0);
}

/**
 * Statistical exploration of the map k -> kG on one curve and base point.
 * Takes k = 1, ..., N (the whole subgroup when it has at most maxSamples
 * points, with one addition per k) and measures the properties listed in
 * the assignment.
 */
export function explore(curve, G, { maxSamples = 20000, bins = 16, avalancheTrials = 300, seed = 2026 } = {}) {
  const { p } = curve;
  const n = pointOrder(G, curve);
  const N = Math.min(n - 1, maxSamples);
  const ks = [];
  const xs = [];
  const ys = [];
  let R = null;
  for (let k = 1; k <= N; k++) {
    R = add(R, G, curve);
    ks.push(k);
    xs.push(R.x);
    ys.push(R.y);
  }
  const wholeGroup = N === n - 1;
  const pointOf = (k) => (wholeGroup ? { x: xs[k - 1], y: ys[k - 1] } : scalarMultiply(k, G, curve));

  // distribution of the coordinates: histograms on [0, p) and a chi-square
  // test against uniform values (each bin expects its share of [0, p))
  const B = Math.min(bins, p);
  const binOf = (v) => Math.floor((v * B) / p);
  const widths = new Array(B).fill(0);
  for (let v = 0; v < p; v++) widths[binOf(v)]++;
  const expected = widths.map((w) => (w * N) / p);
  const histogram = (vs) => {
    const h = new Array(B).fill(0);
    for (const v of vs) h[binOf(v)]++;
    return h;
  };
  const chiSquare = (h) => {
    const chi2 = h.reduce((s, o, j) => s + (o - expected[j]) ** 2 / expected[j], 0);
    return { chi2, df: B - 1, pValue: chiSquarePValue(chi2, B - 1) };
  };
  const histX = histogram(xs);
  const histY = histogram(ys);

  // distribution of the bits: fraction of ones per bit position
  const L = bitLength(p - 1);
  const bitFractions = (vs) =>
    Array.from({ length: L }, (_, i) => vs.reduce((s, v) => s + ((v >>> i) & 1), 0) / vs.length);

  // a structural fact: kG and (n - k)G are opposite points, same x
  let mirrorPairs = 0;
  let mirrorMatches = 0;
  if (wholeGroup) {
    for (let k = 1; k < n - k; k++) {
      mirrorPairs++;
      if (xs[k - 1] === xs[n - k - 1]) mirrorMatches++;
    }
  }

  // input/output links: avalanche and algebraic structure
  const rand = prng(seed);
  const randomK = () => 1 + Math.floor(rand() * (n - 1));
  const inputBits = bitLength(n - 1);
  const outputBits = 2 * L;
  const distances = new Array(outputBits + 1).fill(0);
  let flips = 0;
  let measurements = 0;
  for (let t = 0; t < avalancheTrials; t++) {
    const k = randomK();
    const Q = pointOf(k);
    for (let j = 0; j < inputBits; j++) {
      const k2 = k ^ (1 << j);
      if (k2 === 0 || k2 >= n) continue;
      const Q2 = pointOf(k2);
      const d = popcount(Q.x ^ Q2.x) + popcount(Q.y ^ Q2.y);
      distances[d]++;
      flips += d;
      measurements++;
    }
  }
  let homomorphic = 0;
  const homomorphismTrials = 200;
  for (let t = 0; t < homomorphismTrials; t++) {
    const k1 = randomK();
    const k2 = randomK();
    const sumOfImages = add(pointOf(k1), pointOf(k2), curve);
    const imageOfSum = scalarMultiply((k1 + k2) % n, G, curve);
    if (samePoint(sumOfImages, imageOfSum)) homomorphic++;
  }

  return {
    p,
    n,
    N,
    G,
    curvePointCount: groupOrder(curve),
    bins: B,
    expected,
    histX,
    histY,
    chiX: chiSquare(histX),
    chiY: chiSquare(histY),
    distinctX: new Set(xs).size,
    distinctY: new Set(ys).size,
    multiplicityX: multiplicities(xs, p),
    multiplicityY: multiplicities(ys, p),
    bitLength: L,
    bitsX: bitFractions(xs),
    bitsY: bitFractions(ys),
    bitsExpected: Array.from({ length: L }, (_, i) => expectedBitFraction(i, p)),
    corrKX: pearson(ks, xs),
    corrKY: pearson(ks, ys),
    corrSerialX: N > 2 ? pearson(xs.slice(0, -1), xs.slice(1)) : 0,
    mirrorPairs,
    mirrorMatches,
    avalanche: {
      inputBits,
      outputBits,
      measurements,
      meanFraction: measurements ? flips / measurements / outputBits : 0,
      distances,
    },
    homomorphism: { trials: homomorphismTrials, holds: homomorphic },
  };
}

// ---------------------------------------------------------------------------
// 5. Slowed-down animation (browser, <canvas>)
// ---------------------------------------------------------------------------

export const DEFAULT_PALETTE = {
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
};

const PHASES = [
  ['operands', 700],
  ['line', 1400],
  ['third', 650],
  ['reflect', 850],
  ['result', 650],
];

/** The operations to animate: the k - 1 additions, or the steps of double-and-add. */
export function animationOps(k, G, curve, method) {
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
  if (!op) {
    // animation over: the public key Q = kG stays highlighted
    const last = reached[reached.length - 1];
    if (last && last.point) {
      ctx.beginPath();
      ctx.arc(X(last.point.x), Y(last.point.y), dot + 3, 0, 2 * Math.PI);
      ctx.fillStyle = palette.result;
      ctx.fill();
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
export function createAnimation(canvas, options) {
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
      if (opIndex >= ops.length) {
        // stay on the final operation, fully drawn
        opIndex = ops.length;
        return false;
      }
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
// 6. Bar charts for the statistics (browser, <canvas>)
// ---------------------------------------------------------------------------

/**
 * Bar chart of `values`, with an optional dashed reference (`expected`,
 * one value per bar or a single number) and labels under the first, the
 * middle and the last bar.
 */
export function drawBarChart(canvas, { values, expected = null, labels = null, max = null }, palette = DEFAULT_PALETTE) {
  const { ctx, width, height } = setupCanvas(canvas, 0.42);
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const margin = { left: 34, right: 8, top: 10, bottom: 22 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const refs = expected === null ? [] : Array.isArray(expected) ? expected : values.map(() => expected);
  const top = max ?? Math.max(1e-9, ...values, ...refs) * 1.1;
  const barW = w / values.length;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = pal.grid;
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.fillStyle = pal.subgroup;
  values.forEach((v, i) => {
    const bh = (v / top) * h;
    ctx.fillRect(margin.left + i * barW + barW * 0.12, margin.top + h - bh, barW * 0.76, bh);
  });
  if (refs.length) {
    ctx.strokeStyle = pal.operandP;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    refs.forEach((r, i) => {
      const y = margin.top + h - (r / top) * h;
      ctx.moveTo(margin.left + i * barW, y);
      ctx.lineTo(margin.left + (i + 1) * barW, y);
    });
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
    for (const i of new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])) {
      ctx.fillText(labels[i], margin.left + (i + 0.5) * barW, margin.top + h + 15);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Command line: node homework1.js [k] [p]
// ---------------------------------------------------------------------------

export const EXPLORATION_PRIMES = [17, 97, 991, 10477];

function main(argv) {
  const k = Number.parseInt(argv[0] ?? '6', 10);
  const p = Number.parseInt(argv[1] ?? '17', 10);
  if (!Number.isInteger(k) || k < 1 || !EXPLORATION_PRIMES.includes(p)) {
    console.log(`usage: node homework1.js [k >= 1] [p in ${EXPLORATION_PRIMES.join(', ')}]`);
    return;
  }
  const curve = makeCurve(p);
  const G = defaultBasePoint(curve);
  const n = pointOrder(G, curve);
  const line = (s = '') => console.log(s);

  line(`HMWK 1 - private key -> public key on the toy curve y^2 = x^3 + 7 (mod ${p})`);
  line(`points on the curve: ${groupOrder(curve) - 1} + O = ${groupOrder(curve)}`);
  line(`base point G = ${formatPoint(G)}, order ${n}`);
  line(`private key k = ${k}`);
  line();
  line('Repeated addition');
  if (k <= 64) {
    for (const s of multiples(k, G, curve)) {
      const how = s.kind === 'start' ? '' : `${s.kind}${s.lambda === null ? '' : `, lambda = ${s.lambda}`}`;
      line(`  ${String(s.i).padStart(3)}G = ${formatPoint(s.point).padEnd(14)} ${how}`);
    }
  } else {
    line(`  (${k - 1} additions: skipped, use double-and-add)`);
  }
  line();
  const daa = doubleAndAdd(k, G, curve);
  line(`Double-and-add, k = ${daa.bits} in binary (${daa.steps.length} operations)`);
  for (const s of daa.steps) {
    const what = s.op === 'double' ? 'R = 2R' : s.op === 'load' ? 'R = G' : 'R = R + G';
    line(`  bit ${s.bitIndex} (${s.bit}): ${what.padEnd(10)} = ${s.multiple}G = ${formatPoint(s.result)}`);
  }
  const Q = daa.result;
  line();
  line(`TOY PUBLIC KEY  Q = kG = ${formatPoint(Q)}`);
  if (Q !== null) {
    const bf = bruteForceLog(Q, G, curve);
    line(`brute force: Q = ${bf.k}G found after ${bf.tries} tries (k mod ${n} = ${k % n})`);
  }
  line();
  line('Statistical exploration of k -> kG, k = 1 ... n-1');
  line('     p      n  distinct x  chi2 x (p-value)  r(k,x)   r(k,y)  avalanche  x(kG)=x((n-k)G)  (k1+k2)G = k1G + k2G');
  for (const q of EXPLORATION_PRIMES) {
    const c = makeCurve(q);
    const s = explore(c, defaultBasePoint(c));
    line(
      `${String(q).padStart(6)} ${String(s.n).padStart(6)} ${String(s.distinctX).padStart(11)}` +
        `  ${s.chiX.chi2.toFixed(1).padStart(7)} (${s.chiX.pValue.toFixed(2)})` +
        `  ${s.corrKX.toFixed(3).padStart(7)}  ${s.corrKY.toFixed(3).padStart(7)}` +
        `  ${(100 * s.avalanche.meanFraction).toFixed(1).padStart(8)}%` +
        `  ${String(s.mirrorMatches).padStart(7)}/${s.mirrorPairs}` +
        `  ${String(s.homomorphism.holds).padStart(12)}/${s.homomorphism.trials}`,
    );
  }
}

const runningAsScript =
  typeof window === 'undefined' &&
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  /homework1\.m?js$/.test(process.argv[1] || '');

if (runningAsScript) main(process.argv.slice(2));
