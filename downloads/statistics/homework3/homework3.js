/*
 * Homework #3 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Computations: xoshiro128** and SplitMix64, the m attackers of the Bernoulli and Rademacher models, the exact laws,
 * distances from the normal, hypothesis tests, charts, the animation and command line (node homework3.js [options]).
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-3
 */

var Homework3 = (function () {
'use strict';

/* global process */
/**
 * Homework #3 - The penetration score of m attackers on n systems:
 *               sums of i.i.d. increments, the law of large numbers and the
 *               central limit theorem
 * Sapienza University of Rome - MSc in Cybersecurity (LM-66) - Statistics
 * Nicholas Arcari
 *
 * Every attacker attacks the n systems one after the other and scores X_i
 * on system i, with X_1, X_2, ... independent and identically distributed:
 * 1 with probability p and 0 otherwise (Bernoulli model), or +1 and -1 with
 * probability 1/2 each (Rademacher model, the symmetric zero-mean case).
 * The m attackers are m independent copies of the same process: their
 * trajectories S_k = X_1 + ... + X_k, k = 1, ..., n, are the sample on
 * which the page studies the total score S_n, the average score S_n/n and
 * the normalized total score S_n/sqrt(n) as n grows. Everything is written
 * from scratch, with no dependencies:
 *
 *   0. Parameters and input validation
 *   1. Random numbers: SplitMix64 and xoshiro128**
 *   2. The two models and their exact laws
 *   3. Simulation of the m attackers
 *   4. Statistics: special functions, distances and hypothesis tests
 *   5. The experiments
 *   6. Charts (browser, <canvas>)
 *   7. Animation of the trajectories (browser, <canvas>)
 *   8. Checks, printed report and command line
 */

// ---------------------------------------------------------------------------
// 0. Parameters and input validation
// ---------------------------------------------------------------------------

const fail = (message) => {
  throw new RangeError(message);
};

/** The two models of the score, in the order the page shows them. */
const MODELS = Object.freeze(['bernoulli', 'rademacher']);

/** The three quantities: the total score S_n, the average score S_n/n, the normalized total score S_n/sqrt(n). */
const QUANTITIES = Object.freeze(['sum', 'mean', 'normalized']);

/** The values the page opens with: P(X = 1) of the Bernoulli model, systems, attackers, seed. */
const DEFAULT_P = 0.2;
const DEFAULT_N = 10000;
const DEFAULT_M = 5000;
const DEFAULT_SEED = 2026;

/** The accepted ranges: at most 10^8 increments per model, a second or two of computation. */
const LIMITS = Object.freeze({
  p: Object.freeze([0.01, 0.99]),
  n: Object.freeze([10, 10000]),
  m: Object.freeze([10, 10000]),
  seed: Object.freeze([0, 4294967295]),
});

/** The tolerance of the law of large numbers, P(|S_n/n - mu| > epsilon), as the page opens, and its range. */
const DEFAULT_EPSILON = 0.05;
const EPSILON_RANGE = Object.freeze([0.01, 0.25]);

/** The values of n at which the m trajectories are observed; n itself closes the list. */
const N_GRID = Object.freeze([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]);

/** The checkpoints of a run on n systems: the grid below n, then n. */
const checkpoints = (n) => [...N_GRID.filter((v) => v < n), n];

/** The n of the small-sample tests: still on a coarse lattice, still skewed. */
const SMALL_N = 10;

/** The sizes b of the groups of attackers in the study of m: the best of b attackers, at least one of b. */
const BLOCKS = Object.freeze([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]);

/** The fewest groups over which a mean is taken. */
const MIN_GROUPS = 5;

/** Significance level of every test. */
const SIGNIFICANCE = 0.05;

/** The constant of the Berry-Esseen inequality for identically distributed summands (Shevtsova, 2011). */
const BERRY_ESSEEN_C = 0.4748;

/** An integer of the range [min, max], in decimal digits. */
function parseInteger(text, [min, max]) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (!/^\d{1,12}$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const value = Number(t);
  if (value < min || value > max) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** A probability of the range [min, max], with a decimal point or a decimal comma: 0.2, 0,2, .2. */
function parseProbability(text, [min, max] = LIMITS.p) {
  const t = String(text).trim();
  const plain = t.replace(',', '.');
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (plain.length > 12 || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(plain)) return { ok: false, error: 'notNumber', text: t };
  const value = Number(plain);
  if (!(value >= min && value <= max)) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** The parameters of a run, checked against LIMITS. */
function checkParams({ p = DEFAULT_P, n = DEFAULT_N, m = DEFAULT_M, seed = DEFAULT_SEED } = {}) {
  const within = (v, [lo, hi]) => typeof v === 'number' && v >= lo && v <= hi;
  if (!within(p, LIMITS.p)) fail(`p must be between ${LIMITS.p[0]} and ${LIMITS.p[1]}`);
  if (!Number.isInteger(n) || !within(n, LIMITS.n)) fail(`n must be an integer between ${LIMITS.n[0]} and ${LIMITS.n[1]}`);
  if (!Number.isInteger(m) || !within(m, LIMITS.m)) fail(`m must be an integer between ${LIMITS.m[0]} and ${LIMITS.m[1]}`);
  if (!Number.isInteger(seed) || !within(seed, LIMITS.seed)) fail(`the seed must be an integer between 0 and ${LIMITS.seed[1]}`);
  return { p, n, m, seed };
}

// ---------------------------------------------------------------------------
// 1. Random numbers: SplitMix64 and xoshiro128**
// ---------------------------------------------------------------------------

/*
 * The previous homeworks drew a few thousand numbers from mulberry32, whose
 * period is 2^32. Here a run draws up to 2 x 10^8 numbers and every attacker
 * has a stream of its own, so with a period of 2^32 the streams of different
 * attackers would overlap. xoshiro128** (Blackman and Vigna, 2018) has 128
 * bits of state, period 2^128 - 1 and passes the BigCrush battery, with fast
 * 32-bit arithmetic; its states are seeded with SplitMix64, as its authors
 * recommend. Both are checked against the reference C code (section 8).
 */

const MASK64 = (1n << 64n) - 1n;

/** SplitMix64 (Steele, Lea and Flood, 2014), as in Vigna's reference code: 64-bit outputs, as BigInt. */
function splitMix64(seed) {
  let x = BigInt.asUintN(64, BigInt(seed));
  return () => {
    x = (x + 0x9e3779b97f4a7c15n) & MASK64;
    let z = x;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64;
    return z ^ (z >> 31n);
  };
}

const rotl = (x, k) => (x << k) | (x >>> (32 - k));

/** xoshiro128** 1.1 from the state (a, b, c, d), not all zero: unsigned 32-bit outputs. */
function xoshiro128ss(a, b, c, d) {
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

/**
 * The initial state of the generator of attacker j (from 0) in a model: two
 * outputs of SplitMix64 started from seed x 2^32 + model x 2^31 + j, as four
 * 32-bit words. Every attacker has a stream of its own, so its trajectory
 * does not depend on how many attackers or systems there are: more systems
 * extend it, more attackers add new ones, and the simulation, the animation
 * and the command line see the same attackers.
 */
function attackerState(seed, model, j) {
  const index = MODELS.indexOf(model);
  if (index < 0) fail(`unknown model ${model}`);
  const next = splitMix64((BigInt(seed >>> 0) << 32n) | (BigInt(index) << 31n) | BigInt(j >>> 0));
  const a = next();
  const b = next();
  return [Number(a & 0xffffffffn), Number(a >> 32n), Number(b & 0xffffffffn), Number(b >> 32n)];
}

/** The generator of attacker j in a model: xoshiro128** from attackerState. */
const attackerGenerator = (seed, model, j) => xoshiro128ss(...attackerState(seed, model, j));

const TWO32 = 4294967296;

/**
 * How a 32-bit output u becomes an increment: a hit (X = 1, or X = +1) when
 * u < threshold, that is with probability p (Bernoulli) or 1/2 (Rademacher),
 * otherwise the model's low value, 0 or -1.
 */
const stepRule = (model, p) => (model === 'bernoulli' ? { threshold: p * TWO32, low: 0 } : { threshold: TWO32 / 2, low: -1 });

/** A new seed from the cryptographic generator, when there is one (the seed does not protect anything). */
function randomSeed() {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') return c.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * TWO32);
}

// ---------------------------------------------------------------------------
// 2. The two models and their exact laws
// ---------------------------------------------------------------------------

/**
 * The moments of one increment X: mean mu, variance sigma^2, the third
 * absolute central moment rho = E|X - mu|^3 (Berry-Esseen), the fourth
 * cumulant kappa4 and the skewness. The hits K of n steps are binomial,
 * K ~ Bin(n, hit), and S_n = low n + step K: S_n = K (Bernoulli) or
 * S_n = 2K - n (Rademacher).
 */
function modelMoments(model, p = DEFAULT_P) {
  if (model === 'bernoulli') {
    const q = 1 - p;
    return { model, hit: p, mu: p, variance: p * q, sigma: Math.sqrt(p * q), rho: p * q * (p * p + q * q), kappa4: p * q * (1 - 6 * p * q), skewness: (q - p) / Math.sqrt(p * q), low: 0, step: 1 };
  }
  if (model === 'rademacher') return { model, hit: 0.5, mu: 0, variance: 1, sigma: 1, rho: 1, kappa4: -2, skewness: 0, low: -1, step: 2 };
  return fail(`unknown model ${model}`);
}

/** The scale of a quantity at n: S_n, S_n/n or S_n/sqrt(n) is S_n times this. */
const quantityScale = (quantity, n) => (quantity === 'sum' ? 1 : quantity === 'mean' ? 1 / n : 1 / Math.sqrt(n));

/** Mean, variance and standard deviation of S_n, S_n/n or S_n/sqrt(n). */
function quantityMoments(mom, n, quantity) {
  const c = quantityScale(quantity, n);
  return { mean: n * mom.mu * c, variance: n * mom.variance * c * c, sd: Math.sqrt(n) * mom.sigma * c };
}

/** The fourth central moment of S_n: cumulants add, so it is 3 (n sigma^2)^2 + n kappa4. */
const fourthMoment = (mom, n) => 3 * (n * mom.variance) ** 2 + n * mom.kappa4;

/**
 * The binomial probabilities P(K = k), k = 0, ..., n, by the ratio
 * P(k + 1)/P(k) = (n - k)/(k + 1) x q/(1 - q) from the mode outwards, then
 * normalized: no factorials, no overflow, and the far tails underflow to 0
 * only below 1e-308.
 */
function binomialPmf(n, q) {
  const pmf = new Float64Array(n + 1);
  if (q <= 0 || q >= 1) {
    pmf[q <= 0 ? 0 : n] = 1;
    return pmf;
  }
  const mode = Math.min(n, Math.floor((n + 1) * q));
  const odds = q / (1 - q);
  pmf[mode] = 1;
  for (let k = mode; k < n; k++) pmf[k + 1] = (pmf[k] * (n - k) * odds) / (k + 1);
  for (let k = mode; k > 0; k--) pmf[k - 1] = (pmf[k] * k) / ((n - k + 1) * odds);
  let total = 0;
  for (let k = 0; k <= n; k++) total += pmf[k];
  for (let k = 0; k <= n; k++) pmf[k] /= total;
  return pmf;
}

/** The exact law of S_n in a model: atom k is worth low + step k, with probability pmf[k]. */
function exactLaw(model, p, n) {
  const mom = modelMoments(model, p);
  return { n, low: mom.low * n, step: mom.step, pmf: binomialPmf(n, mom.hit) };
}

/** True when S_n = v is farther than epsilon from the mean in the average score: |v/n - mu| > epsilon (relative tolerance 1e-9, so that the atoms exactly at epsilon do not count). */
const beyondEpsilon = (v, n, mu, epsilon) => Math.abs(v - n * mu) > epsilon * n * (1 + 1e-9);

/** P(|S_n/n - mu| > epsilon) from the exact law, summing the two tails term by term. */
function exactExceedance(law, mu, epsilon) {
  let total = 0;
  for (let k = 0; k < law.pmf.length; k++) if (beyondEpsilon(law.low + law.step * k, law.n, mu, epsilon)) total += law.pmf[k];
  return Math.min(1, total);
}

/** The bounds of section 3 on P(|S_n/n - mu| > epsilon), capped at 1: Chebyshev, Hoeffding, and the normal approximation (not a bound). */
const chebyshevBound = (mom, n, epsilon) => Math.min(1, mom.variance / (n * epsilon * epsilon));
const hoeffdingBound = (mom, n, epsilon) => Math.min(1, 2 * Math.exp((-2 * n * epsilon * epsilon) / (mom.step * mom.step)));
const normalExceedance = (mom, n, epsilon) => Math.min(1, 2 * normalSf((epsilon * Math.sqrt(n)) / mom.sigma));

/** The Berry-Esseen bound on the Kolmogorov distance between the standardized S_n and N(0, 1). */
const berryEsseen = (mom, n) => Math.min(1, (BERRY_ESSEEN_C * mom.rho) / (mom.sigma ** 3 * Math.sqrt(n)));

/** The standardized value of atom k: z_k = (S - n mu)/(sigma sqrt(n)). */
function standardAtoms(law, mom) {
  const scale = mom.sigma * Math.sqrt(law.n);
  return (k) => (law.low + law.step * k - law.n * mom.mu) / scale;
}

/** The normal CDF with the continuity correction at the atoms: Phi(z_k + h/2), h the spacing of the atoms, and 1 at the last atom. */
function correctedNormal(law, mom) {
  const z = standardAtoms(law, mom);
  const half = law.step / (2 * mom.sigma * Math.sqrt(law.n));
  const last = law.pmf.length - 1;
  return (k) => (k === last ? 1 : cdfFast(z(k) + half));
}

// ---------------------------------------------------------------------------
// 3. Simulation of the m attackers
// ---------------------------------------------------------------------------

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

/**
 * The m attackers of one model on n systems, one attacker after the other,
 * as a generator that yields after every attacker (a page can run it in
 * slices of a few milliseconds, a worker or the command line in one go).
 * The trajectories are not stored; along the way the simulation records:
 *   - at every checkpoint of the grid, how many attackers have each value of
 *     S (counts per atom of the exact law);
 *   - the final score of every attacker, in order (the groups of section 6);
 *   - for every system, how many attackers hit it and which one was first;
 *   - the pairs of consecutive increments (the independence test): only the
 *     hit-hit pairs are counted, the rest of the table follows from the
 *     hits and the first and last increment of every attacker;
 *   - Rademacher only: on how many of the first `even` steps the walk is on
 *     the positive side (Feller's convention: the step from S_(i-1) to S_i
 *     counts when one of the two is positive, that is when their sum is),
 *     its returns to zero and its maximum.
 */
function* simulateSteps(model, { p = DEFAULT_P, n = DEFAULT_N, m = DEFAULT_M, seed = DEFAULT_SEED } = {}) {
  const mom = modelMoments(model, p);
  const { threshold, low } = stepRule(model, p);
  const grid = checkpoints(n);
  const counts = grid.map((v) => new Int32Array(v + 1));
  const finals = new Int32Array(m);
  const hits = new Int32Array(n);
  const firstHit = new Int32Array(n);
  const walk = model === 'rademacher';
  const even = n - (n % 2);
  const positive = walk ? new Int32Array(m) : null;
  const zeros = walk ? new Int32Array(m) : null;
  const maxima = walk ? new Int32Array(m) : null;
  let hitsTotal = 0;
  let hitHit = 0;
  let firstHits = 0;
  let lastHits = 0;
  const started = now();
  for (let j = 0; j < m; j++) {
    let [s0, s1, s2, s3] = attackerState(seed, model, j);
    s0 |= 0;
    s1 |= 0;
    s2 |= 0;
    s3 |= 0;
    let S = 0;
    let i = 0;
    let x = 0;
    let previous = 0;
    let up = 0;
    let zero = 0;
    let max = 0;
    for (let g = 0; g < grid.length; g++) {
      const end = grid[g];
      while (i < end) {
        // one step of xoshiro128**, written out: the same numbers as
        // xoshiro128ss (the checks of section 8 compare them), in half the time
        const r = Math.imul(s1, 5);
        const u = Math.imul((r << 7) | (r >>> 25), 9) >>> 0;
        const t = s1 << 9;
        s2 ^= s0;
        s3 ^= s1;
        s1 ^= s2;
        s0 ^= s3;
        s2 ^= t;
        s3 = (s3 << 11) | (s3 >>> 21);
        const before = S;
        if (u < threshold) {
          x = 1;
          S++;
          hits[i]++;
          if (firstHit[i] === 0) firstHit[i] = j + 1;
        } else {
          x = 0;
          S += low;
        }
        hitHit += previous & x;
        if (i === 0) firstHits += x;
        previous = x;
        i++;
        if (walk) {
          if (i <= even && before + S > 0) up++;
          if (S === 0) zero++;
          if (S > max) max = S;
        }
      }
      counts[g][(S - low * end) / mom.step]++;
    }
    lastHits += x;
    hitsTotal += (S - low * n) / mom.step;
    finals[j] = S;
    if (walk) {
      positive[j] = up;
      zeros[j] = zero;
      maxima[j] = max;
    }
    yield;
  }
  // (X_i, X_i+1): miss-miss, miss-hit, hit-miss, hit-hit; hits as first of a pair, and as second
  const asFirst = hitsTotal - lastHits;
  const asSecond = hitsTotal - firstHits;
  const pairs = [m * (n - 1) - asFirst - asSecond + hitHit, asSecond - hitHit, asFirst - hitHit, hitHit];
  return { model, p, n, m, seed, grid, counts, finals, hits, firstHit, pairs, even, positive, zeros, maxima, draws: m * n, ms: now() - started };
}

/** Runs one of the generators of this file to the end, in one go (a worker, the command line). */
function runSteps(steps) {
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/** Runs a generator in slices of a few milliseconds, leaving the browser free to draw in between. */
function runStepsAsync(makeSteps, { sliceMs = 12, schedule = (run) => setTimeout(run, 0) } = {}) {
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
// 4. Statistics: special functions, distances and hypothesis tests
// ---------------------------------------------------------------------------

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

/** P(X >= chi2) for a chi-square variable with df degrees of freedom. */
const chiSquarePValue = (chi2, df) => (df > 0 && chi2 >= 0 ? gammaQ(df / 2, chi2 / 2) : NaN);

/** Probability that |Z| > z for a standard normal Z. */
const twoSidedNormalTail = (z) => gammaQ(0.5, (z * z) / 2);

/** The standard normal density. */
const normalPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

/** P(Z > x), accurate also far in the upper tail: erfc(x/sqrt(2))/2 = Q(1/2, x^2/2)/2. */
const normalSf = (x) => (x >= 0 ? 0.5 * gammaQ(0.5, (x * x) / 2) : 1 - 0.5 * gammaQ(0.5, (x * x) / 2));

/** Phi(x) = P(Z <= x). */
const normalCdf = (x) => normalSf(-x);

// beyond 8.5 standard deviations Phi is 0 or 1 within 1e-17: no need to compute it
const cdfFast = (x) => (x < -8.5 ? 0 : x > 8.5 ? 1 : normalCdf(x));

/** The normal quantile Phi^-1(p): Acklam's rational approximation, then one step of Halley's method. */
function normalQuantile(p) {
  if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
  if (p > 0.5) return -normalQuantile(1 - p);
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  let x;
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const e = normalCdf(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

/**
 * P(K > lambda) for Kolmogorov's distribution, the limit law of sqrt(m) D_m:
 * 2 sum (-1)^(k-1) exp(-2 k^2 lambda^2), or, for small lambda, where that
 * series converges slowly, 1 - sqrt(2 pi)/lambda sum exp(-(2k-1)^2 pi^2 / (8 lambda^2)).
 */
function kolmogorovSf(lambda) {
  if (!(lambda > 0)) return 1;
  if (lambda < 1.18) {
    const t = (Math.PI * Math.PI) / (8 * lambda * lambda);
    let total = 0;
    for (let k = 1; k <= 20; k++) total += Math.exp(-((2 * k - 1) ** 2) * t);
    return Math.min(1, Math.max(0, 1 - (Math.sqrt(2 * Math.PI) / lambda) * total));
  }
  let total = 0;
  for (let k = 1; k <= 100; k++) {
    const term = Math.exp(-2 * k * k * lambda * lambda);
    total += k % 2 ? term : -term;
    if (term < 1e-300) break;
  }
  return Math.min(1, Math.max(0, 2 * total));
}

/** The p-value of a Kolmogorov-Smirnov distance D on m observations, with Stephens's correction of sqrt(m). */
const ksPValue = (D, m) => kolmogorovSf((Math.sqrt(m) + 0.12 + 0.11 / Math.sqrt(m)) * D);

/** E[sqrt(m) D_m] under H0 for a continuous law: sqrt(pi/2) ln 2. The Monte Carlo floor of section 5: below about this / sqrt(m) a simulated distance is noise. */
const KS_MEAN = Math.sqrt(Math.PI / 2) * Math.LN2;

/**
 * sup over x of |F(x) - G(x)|, with F a lattice law given by weights per atom
 * (counts, or probabilities) and G a continuous CDF: on each interval
 * between atoms F is constant, so the supremum is reached just before or at
 * an atom. zOf(k) is the position of atom k.
 */
function distanceToContinuous(weights, zOf, cdf) {
  let total = 0;
  for (let k = 0; k < weights.length; k++) total += weights[k];
  let F = 0;
  let D = 0;
  for (let k = 0; k < weights.length; k++) {
    const G = cdf(zOf(k));
    D = Math.max(D, Math.abs(G - F));
    F = Math.min(1, F + weights[k] / total);
    D = Math.max(D, Math.abs(F - G));
  }
  return D;
}

/** The same against another law on the same atoms, with CDF G(k) at atom k (1 at the last): the largest difference at the atoms. */
function distanceToLattice(weights, G) {
  let total = 0;
  for (let k = 0; k < weights.length; k++) total += weights[k];
  let F = 0;
  let D = 0;
  for (let k = 0; k < weights.length; k++) {
    F = Math.min(1, F + weights[k] / total);
    D = Math.max(D, Math.abs(F - G(k)));
  }
  return D;
}

/** Sample moments of a lattice sample, from its counts per atom (atom k worth low + step k). */
function latticeMoments(counts, low = 0, step = 1) {
  let m = 0;
  let s1 = 0;
  for (let k = 0; k < counts.length; k++) {
    m += counts[k];
    s1 += counts[k] * (low + step * k);
  }
  const mean = s1 / m;
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (let k = 0; k < counts.length; k++) {
    if (!counts[k]) continue;
    const d = low + step * k - mean;
    const d2 = d * d;
    m2 += counts[k] * d2;
    m3 += counts[k] * d2 * d;
    m4 += counts[k] * d2 * d2;
  }
  m2 /= m;
  m3 /= m;
  m4 /= m;
  return { m, mean, variance: m > 1 ? (m2 * m) / (m - 1) : NaN, skewness: m2 > 0 ? m3 / m2 ** 1.5 : 0, kurtosis: m2 > 0 ? m4 / (m2 * m2) : 3 };
}

/** Sample moments of a list of numbers, the same way. */
function sampleMoments(values) {
  const m = values.length;
  let s1 = 0;
  for (const v of values) s1 += v;
  const mean = s1 / m;
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const v of values) {
    const d = v - mean;
    m2 += d * d;
    m3 += d * d * d;
    m4 += d * d * d * d;
  }
  m2 /= m;
  m3 /= m;
  m4 /= m;
  return { m, mean, variance: m > 1 ? (m2 * m) / (m - 1) : NaN, skewness: m2 > 0 ? m3 / m2 ** 1.5 : 0, kurtosis: m2 > 0 ? m4 / (m2 * m2) : 3 };
}

const finish = (test) => ({ ...test, verdict: test.pValue < SIGNIFICANCE ? 'reject' : 'notReject', alpha: SIGNIFICANCE });

/**
 * Chi-square goodness of fit of counts against probabilities. Neighbouring
 * classes are merged until each expects at least 5 observations (Cochran),
 * so that the chi-square approximation holds.
 */
function goodnessOfFit(counts, probabilities) {
  let N = 0;
  for (const c of counts) N += c;
  const merged = [];
  let o = 0;
  let e = 0;
  for (let i = 0; i < counts.length; i++) {
    o += counts[i];
    e += probabilities[i] * N;
    if (e >= 5) {
      merged.push([o, e]);
      o = 0;
      e = 0;
    }
  }
  if (merged.length && (o > 0 || e > 0)) {
    merged[merged.length - 1][0] += o;
    merged[merged.length - 1][1] += e;
  }
  const chi2 = merged.reduce((s, [obs, exp]) => s + (obs - exp) ** 2 / exp, 0);
  const df = merged.length - 1;
  return finish({ kind: 'chi2', N, classes: merged.length, df, chi2, pValue: df > 0 ? chiSquarePValue(chi2, df) : NaN });
}

/**
 * Chi-square test of independence on a contingency table of counts: the
 * expected counts come from the margins, with (r - 1)(c - 1) degrees of
 * freedom; Cramer's V measures the strength of the dependence.
 */
function independenceTest(table) {
  const rows = table.length;
  const cols = table[0].length;
  const rowSums = table.map((row) => row.reduce((s, v) => s + v, 0));
  const colSums = Array.from({ length: cols }, (_, j) => table.reduce((s, row) => s + row[j], 0));
  const N = rowSums.reduce((s, v) => s + v, 0);
  let chi2 = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const e = (rowSums[i] * colSums[j]) / N;
      chi2 += (table[i][j] - e) ** 2 / e;
    }
  }
  const df = (rows - 1) * (cols - 1);
  return finish({ kind: 'independence', N, rows, cols, df, chi2, cramerV: Math.sqrt(chi2 / (N * (Math.min(rows, cols) - 1))), pValue: chiSquarePValue(chi2, df) });
}

/** z-test of a sample mean against mu, with the standard deviation sd of one observation known under H0. */
function meanTest(mean, mu, sd, m) {
  const z = (mean - mu) / (sd / Math.sqrt(m));
  return finish({ kind: 'mean', mean, expected: mu, z, pValue: twoSidedNormalTail(z) });
}

/**
 * Large-sample test of a sample variance s^2 against sigma^2: under H0 s^2
 * has mean sigma^2 and variance (mu4 - sigma^4 (m - 3)/(m - 1))/m, with mu4
 * the fourth central moment, and it is approximately normal for large m.
 * Unlike the chi-square test of the variance, it does not assume normal data.
 */
function varianceTest(s2, variance, mu4, m) {
  const se = Math.sqrt((mu4 - (variance * variance * (m - 3)) / (m - 1)) / m);
  const z = (s2 - variance) / se;
  return finish({ kind: 'variance', variance: s2, expected: variance, ratio: s2 / variance, z, pValue: twoSidedNormalTail(z) });
}

/** Jarque-Bera test of normality: JB = m/6 (g1^2 + (b2 - 3)^2/4), about chi-square with 2 degrees of freedom. */
function jarqueBera({ m, skewness, kurtosis }) {
  const statistic = (m / 6) * (skewness * skewness + (kurtosis - 3) ** 2 / 4);
  return finish({ kind: 'jb', m, skewness, excessKurtosis: kurtosis - 3, statistic, pValue: chiSquarePValue(statistic, 2) });
}

/** Kolmogorov-Smirnov test of a distance D on m observations. */
const ksTest = (D, m, corrected = false) => finish({ kind: 'ks', D, m, lambda: Math.sqrt(m) * D, corrected, pValue: ksPValue(D, m) });

/** Wilson score interval of a proportion (95%): unlike p +- 1.96 sd, it stays inside [0, 1] and works near 0 and 1. */
function wilsonInterval(rate, n, z = 1.959963984540054) {
  if (!(n > 0)) return [NaN, NaN];
  const z2 = z * z;
  const center = (rate + z2 / (2 * n)) / (1 + z2 / n);
  const half = (z * Math.sqrt((rate * (1 - rate)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

/** Least squares line y = a + b x, with the standard error of the slope. */
function fitLine(xs, ys) {
  const k = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / k;
  const my = ys.reduce((s, v) => s + v, 0) / k;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < k; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let rss = 0;
  for (let i = 0; i < k; i++) rss += (ys[i] - intercept - slope * xs[i]) ** 2;
  return { slope, intercept, slopeError: k > 2 ? Math.sqrt(rss / (k - 2) / sxx) : NaN };
}

/** E[max of b independent copies] of a lattice law: sum of v_k (F_k^b - F_(k-1)^b). */
function expectedMaxDiscrete(law, b) {
  let F = 0;
  let previous = 0;
  let e = 0;
  for (let k = 0; k < law.pmf.length; k++) {
    F = Math.min(1, F + law.pmf[k]);
    const Fb = F ** b;
    e += (law.low + law.step * k) * (Fb - previous);
    previous = Fb;
  }
  return e;
}

/** E[max of b independent standard normals], by Simpson's rule on the integral of x b phi(x) Phi(x)^(b-1). */
function expectedMaxNormal(b) {
  if (b <= 1) return 0;
  const N = 2000;
  const lo = -9;
  const hi = 9;
  const h = (hi - lo) / N;
  let total = 0;
  for (let i = 0; i <= N; i++) {
    const x = lo + i * h;
    const f = x * b * normalPdf(x) * normalCdf(x) ** (b - 1);
    total += f * (i === 0 || i === N ? 1 : i % 2 ? 4 : 2);
  }
  return (total * h) / 3;
}

/** The arcsine law on [0, 1]: Lévy's limit of the share of time a symmetric walk spends on the positive side. */
const arcsineCdf = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : (2 / Math.PI) * Math.asin(Math.sqrt(x)));
const arcsineDensity = (x) => (x <= 0 || x >= 1 ? NaN : 1 / (Math.PI * Math.sqrt(x * (1 - x))));

/** u_2j = P(S_2j = 0) = C(2j, j)/4^j, j = 0..J, by u_2j = u_2(j-1) (2j - 1)/(2j). */
function returnProbabilities(J) {
  const u = new Float64Array(J + 1);
  u[0] = 1;
  for (let j = 1; j <= J; j++) u[j] = (u[j - 1] * (2 * j - 1)) / (2 * j);
  return u;
}

/** Feller's discrete arcsine law: in 2N steps the walk is on the positive side for 2k of them with probability u_2k u_(2N-2k). */
function discreteArcsine(N) {
  const u = returnProbabilities(N);
  const law = new Float64Array(N + 1);
  for (let k = 0; k <= N; k++) law[k] = u[k] * u[N - k];
  return law;
}

// ---------------------------------------------------------------------------
// 5. The experiments
// ---------------------------------------------------------------------------

/** The values of n of the exact curves of section 5: every n up to 30, then 60 steps evenly spaced on a log scale. */
function curveGrid(nMax) {
  const set = new Set();
  for (let n = 1; n <= Math.min(30, nMax); n++) set.add(n);
  for (let i = 0; i <= 60 && nMax > 30; i++) set.add(Math.round(10 ** (Math.log10(30) + (i * (Math.log10(nMax) - Math.log10(30))) / 60)));
  for (const n of checkpoints(nMax)) set.add(n);
  return [...set].sort((a, b) => a - b);
}

/** The exact Kolmogorov distance of the standardized S_n from N(0, 1), with and without the continuity correction, and the Berry-Esseen bound, along curveGrid. */
function* distanceCurveSteps(model, p, nMax) {
  const mom = modelMoments(model, p);
  const ns = curveGrid(nMax);
  const distance = [];
  const corrected = [];
  for (const n of ns) {
    const law = exactLaw(model, p, n);
    distance.push(distanceToContinuous(law.pmf, standardAtoms(law, mom), cdfFast));
    corrected.push(distanceToLattice(law.pmf, correctedNormal(law, mom)));
    if (n % 16 === 0) yield;
  }
  return { ns, distance, corrected, bound: ns.map((n) => berryEsseen(mom, n)) };
}

/** What a checkpoint of the simulation says: the counts per atom, the exact law, the sample moments and the distances from the normal. */
function checkpointFacts(sim, mom, g) {
  const n = sim.grid[g];
  const law = exactLaw(sim.model, sim.p, n);
  const counts = sim.counts[g];
  const z = standardAtoms(law, mom);
  return {
    n,
    counts,
    pmf: law.pmf,
    low: law.low,
    step: law.step,
    sample: latticeMoments(counts, law.low, law.step),
    ks: distanceToContinuous(counts, z, cdfFast),
    ksCorrected: distanceToLattice(counts, correctedNormal(law, mom)),
    distance: distanceToContinuous(law.pmf, z, cdfFast),
    distanceCorrected: distanceToLattice(law.pmf, correctedNormal(law, mom)),
  };
}

/**
 * The m attackers in groups of b (section 6): the best of each group,
 * standardized, against its exact expectation, the normal one and
 * sqrt(2 ln b); how often at least one of the b is more than 3 standard
 * deviations above the mean; and how many systems at least one of the first
 * b attackers hit.
 */
function attackerGroups(sim, mom, law) {
  const { n, m, finals } = sim;
  const scale = mom.sigma * Math.sqrt(n);
  const standard = (S) => (S - n * mom.mu) / scale;
  const threshold = n * mom.mu + 3 * scale;
  let tail = 0;
  for (let k = law.pmf.length - 1; k >= 0 && law.low + law.step * k > threshold; k--) tail += law.pmf[k];
  const firstCounts = new Int32Array(m + 1);
  for (const f of sim.firstHit) firstCounts[f]++;
  const covered = new Int32Array(m + 1);
  for (let b = 1; b <= m; b++) covered[b] = covered[b - 1] + firstCounts[b];
  const rows = [];
  for (const b of BLOCKS) {
    const groups = Math.floor(m / b);
    if (groups < MIN_GROUPS) break;
    let sum = 0;
    let sum2 = 0;
    let beyond = 0;
    for (let g = 0; g < groups; g++) {
      let best = -Infinity;
      for (let j = g * b; j < (g + 1) * b; j++) if (finals[j] > best) best = finals[j];
      const z = standard(best);
      sum += z;
      sum2 += z * z;
      if (best > threshold) beyond++;
    }
    const mean = sum / groups;
    const sd = Math.sqrt(Math.max(0, (sum2 - groups * mean * mean) / (groups - 1)));
    rows.push({
      b,
      groups,
      mean,
      error: sd / Math.sqrt(groups),
      exact: standard(expectedMaxDiscrete(law, b)),
      normal: expectedMaxNormal(b),
      asymptote: b > 1 ? Math.sqrt(2 * Math.log(b)) : 0,
      beyond: beyond / groups,
      beyondExact: 1 - (1 - tail) ** b,
      coverage: covered[b] / n,
      coverageExact: 1 - (1 - mom.hit) ** b,
    });
  }
  return { threshold, tail, rows, covered: covered[m] / n, coveredExact: 1 - (1 - mom.hit) ** m };
}

/** The symmetric walk (Rademacher): time on the positive side against the arcsine law, returns to zero, maximum. */
function walkFacts(sim, law) {
  const N = sim.even / 2;
  const arcsine = new Int32Array(N + 1);
  for (const v of sim.positive) arcsine[v / 2]++;
  const arcsineLaw = discreteArcsine(N);
  let extreme = 0;
  let extremeExact = 0;
  for (let k = 0; k <= N; k++) {
    const share = k / N;
    if (share < 0.1 || share > 0.9) {
      extreme += arcsine[k];
      extremeExact += arcsineLaw[k];
    }
  }
  const u = returnProbabilities(Math.floor(sim.n / 2));
  let zerosExact = 0;
  for (let j = 1; j < u.length; j++) zerosExact += u[j];
  // reflection principle: P(M_n >= r) = P(S_n >= r) + P(S_n > r), so E[M_n] = 2 E[S_n+] - P(S_n >= 1)
  let positivePart = 0;
  let atLeastOne = 0;
  for (let k = 0; k < law.pmf.length; k++) {
    const v = law.low + law.step * k;
    if (v > 0) {
      positivePart += v * law.pmf[k];
      atLeastOne += law.pmf[k];
    }
  }
  return {
    even: sim.even,
    arcsine,
    arcsineLaw,
    extreme: extreme / sim.m,
    extremeExact,
    extremeLimit: 1 - arcsineCdf(0.9) + arcsineCdf(0.1),
    zeros: sampleMoments(sim.zeros).mean,
    zerosExact,
    maximum: sampleMoments(sim.maxima).mean,
    maximumExact: 2 * positivePart - atLeastOne,
    sqrtLaw: Math.sqrt((2 * sim.n) / Math.PI),
    test: goodnessOfFit(arcsine, arcsineLaw),
  };
}

/** Everything the page says about one model, from one simulation. */
function* analyzeSteps(sim) {
  const mom = modelMoments(sim.model, sim.p);
  const { n, m } = sim;
  const points = [];
  for (let g = 0; g < sim.grid.length; g++) {
    points.push(checkpointFacts(sim, mom, g));
    yield;
  }
  const last = points[points.length - 1];
  const small = points.find((pt) => pt.n === SMALL_N) || last;
  const law = { n, low: last.low, step: last.step, pmf: last.pmf };
  let hitsTotal = 0;
  const perSystem = new Int32Array(m + 1);
  for (const v of sim.hits) {
    hitsTotal += v;
    perSystem[v]++;
  }
  const systemLaw = binomialPmf(m, mom.hit);
  let total = 0;
  for (const v of sim.finals) total += v;
  const groups = attackerGroups(sim, mom, law);
  yield;
  const walk = sim.model === 'rademacher' ? walkFacts(sim, law) : null;
  // the share of hits over all m n increments is the mean of S_n/n over the attackers: its test is `mean`
  const tests = {
    pairs: independenceTest([[sim.pairs[0], sim.pairs[1]], [sim.pairs[2], sim.pairs[3]]]),
    systems: sim.model === 'bernoulli' ? goodnessOfFit(perSystem, systemLaw) : null,
    mean: meanTest(last.sample.mean / n, mom.mu, mom.sigma / Math.sqrt(n), m),
    variance: varianceTest(last.sample.variance, n * mom.variance, fourthMoment(mom, n), m),
    exact: goodnessOfFit(last.counts, last.pmf),
    normal: ksTest(last.ksCorrected, m, true),
    smallKs: ksTest(small.ks, m),
    jb: jarqueBera(last.sample),
    smallJb: jarqueBera(small.sample),
    arcsine: walk ? walk.test : null,
  };
  const curve = yield* distanceCurveSteps(sim.model, sim.p, n);
  return {
    model: sim.model,
    mom,
    params: { p: sim.p, n, m, seed: sim.seed },
    grid: sim.grid,
    points,
    tests,
    groups,
    walk,
    aggregate: {
      hits: hitsTotal,
      total,
      expected: m * n * mom.mu,
      sd: mom.sigma * Math.sqrt(m * n),
      perSystem,
      systemLaw,
      systemSample: latticeMoments(perSystem),
      pairs: sim.pairs,
    },
    curve,
    draws: sim.draws,
    ms: sim.ms,
  };
}

/**
 * The whole study for one set of parameters, as a generator that yields
 * between units of work: for each model the simulation of the m attackers
 * on the n systems, then what it says at every checkpoint, the groups of
 * attackers, the walk and the tests, and the exact distances from the normal.
 */
function* exploreSteps(options = {}) {
  const params = checkParams(options);
  const started = now();
  const models = {};
  for (const model of MODELS) {
    const sim = yield* simulateSteps(model, params);
    models[model] = yield* analyzeSteps(sim);
  }
  return { params, models, ms: now() - started };
}

const explore = (options) => runSteps(exploreSteps(options));
const exploreAsync = (options, scheduling) => runStepsAsync(() => exploreSteps(options), scheduling);

/** Every hypothesis test of the page, by group: the generator, the law of large numbers, the central limit theorem, the walk. */
function statisticalTests(s) {
  const B = s.models.bernoulli.tests;
  const R = s.models.rademacher.tests;
  return {
    sim: [
      ['bernoulliPairs', B.pairs],
      ['rademacherPairs', R.pairs],
      ['bernoulliSystems', B.systems],
    ],
    lln: [
      ['bernoulliMean', B.mean],
      ['rademacherMean', R.mean],
      ['bernoulliVariance', B.variance],
      ['rademacherVariance', R.variance],
    ],
    clt: [
      ['bernoulliExact', B.exact],
      ['rademacherExact', R.exact],
      ['rademacherNormal', R.normal],
      ['rademacherSmall', R.smallKs],
      ['rademacherJb', R.jb],
      ['bernoulliJb', B.jb],
      ['bernoulliSmall', B.smallJb],
    ],
    walk: [['arcsine', R.arcsine]],
  };
}

/** The hypotheses, as the command line prints them. */
const TEST_LABELS = Object.freeze({
  sim: {
    bernoulliPairs: 'Bernoulli: consecutive increments are independent',
    rademacherPairs: 'Rademacher: consecutive increments are independent',
    bernoulliSystems: 'Bernoulli: the hits per system follow Bin(m, p)',
  },
  lln: {
    bernoulliMean: 'Bernoulli: the mean of S_n/n is p',
    rademacherMean: 'Rademacher: the mean of S_n/n is 0',
    bernoulliVariance: 'Bernoulli: the variance of S_n is n p (1 - p)',
    rademacherVariance: 'Rademacher: the variance of S_n is n',
  },
  clt: {
    bernoulliExact: 'Bernoulli: S_n follows its exact law Bin(n, p)',
    rademacherExact: 'Rademacher: S_n follows its exact law 2 Bin(n, 1/2) - n',
    rademacherNormal: 'Rademacher: S_n/sqrt(n) is N(0, 1), with continuity correction',
    rademacherSmall: `Rademacher: S_${SMALL_N}/sqrt(${SMALL_N}) is N(0, 1), without correction`,
    rademacherJb: 'Rademacher: S_n/sqrt(n) has the skewness and kurtosis of a normal',
    bernoulliJb: 'Bernoulli: the standardized S_n has the skewness and kurtosis of a normal',
    bernoulliSmall: `Bernoulli: the standardized S_${SMALL_N} has the skewness and kurtosis of a normal`,
  },
  walk: { arcsine: 'Rademacher: the time on the positive side follows the arcsine law' },
});

// ---------------------------------------------------------------------------
// 6. Charts (browser, <canvas>)
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = {
  background: '#ffffff',
  text: '#444444',
  grid: '#eeeeee',
  bars: '#5c6bc0',
  reference: '#d52349',
  highlight: '#d52349',
  series: ['#5c6bc0', '#d52349', '#2e7d6b', '#f0a500', '#8e24aa', '#00838f', '#777777'],
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
function axisLabel(v, decimal = '.') {
  if (v === 0) return '0';
  const a = Math.abs(v);
  let s;
  if (a >= 1) s = Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
  else if (a >= 0.001) s = String(Number(v.toPrecision(2)));
  else s = v.toExponential(0);
  return chartNumber(s, decimal);
}

/** About `count` round values covering [lo, hi], for the ticks of an axis. */
function niceTicks(lo, hi, count = 5) {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / Math.max(1, count - 1);
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = [1, 2, 2.5, 5, 10].map((f) => f * power).find((u) => u >= raw) || 10 * power;
  const ticks = [];
  for (let v = Math.ceil(lo / unit) * unit; v <= hi + unit * 1e-9; v += unit) ticks.push(Math.abs(v) < unit * 1e-9 ? 0 : Number(v.toPrecision(12)));
  return ticks;
}

const LINE_ASPECT = 0.56;
const LINE_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };
const HIST_ASPECT = 0.56;
const HIST_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };
const QQ_ASPECT = 0.8;
const QQ_MARGIN = { left: 40, right: 12, top: 10, bottom: 24 };

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
function drawLineChart(canvas, { x, series, logX = false, logY = false, yMin = 0, yMax = 1, yTicks = [], xTicks = [], yFormat = null, decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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
    ctx.fillText(axisLabel(v, decimal), px(v), margin.top + h + 15);
  }
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, w, h);
  ctx.clip();
  series.forEach((s, i) => {
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
 * simulation, as densities), the same bins under another law (`expected`,
 * one value per bar, a dashed outline) and a curve (`curve`, points [x, y]
 * of a density, such as the normal one). The legend is in the page.
 */
function drawHistogram(canvas, { x0, x1, bars, expected = null, curve = null, yMax = null, xTicks = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, HIST_ASPECT, knownWidth);
  const { margin, w, h, px } = histLayout({ x0, x1 }, width);
  let top = yMax;
  if (top === null) {
    top = 1e-12;
    for (const b of bars) top = Math.max(top, b.value);
    if (expected) for (const v of expected) top = Math.max(top, v);
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
    ctx.fillText(axisLabel(v, decimal), px(v), margin.top + h + 15);
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
  for (const b of bars) {
    const left = px(b.from);
    const right = px(b.to);
    const gap = right - left > 4 ? 0.6 : 0;
    ctx.fillRect(left + gap, py(b.value), Math.max(0.8, right - left - 2 * gap), margin.top + h - py(b.value));
  }
  ctx.globalAlpha = 1;
  if (expected) {
    ctx.strokeStyle = pal.series[1];
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    bars.forEach((b, i) => {
      if (i === 0 || bars[i - 1].to !== b.from) ctx.moveTo(px(b.from), py(expected[i]));
      else ctx.lineTo(px(b.from), py(expected[i]));
      ctx.lineTo(px(b.to), py(expected[i]));
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (curve && curve.length > 1) {
    ctx.strokeStyle = pal.series[2];
    ctx.lineWidth = 2;
    ctx.beginPath();
    curve.forEach(([X, v], i) => (i ? ctx.lineTo(px(X), py(v)) : ctx.moveTo(px(X), py(v))));
    ctx.stroke();
  }
  ctx.restore();
}

/** Where the plot of drawQQ lies on a canvas of this width. */
function qqLayout(data, width) {
  const height = Math.round(width * QQ_ASPECT);
  const margin = QQ_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const px = (v) => margin.left + (w * (v - data.lo)) / (data.hi - data.lo);
  const py = (v) => margin.top + h * (1 - (v - data.lo) / (data.hi - data.lo));
  return { margin, w, h, height, px, py };
}

/** Normal quantile plot: points [theoretical, sample] and the line y = x, on the same range [lo, hi] on both axes. */
function drawQQ(canvas, { points, lo, hi, ticks = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, QQ_ASPECT, knownWidth);
  const { margin, w, h, px, py } = qqLayout({ lo, hi }, width);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  for (const v of ticks) {
    ctx.beginPath();
    ctx.moveTo(px(v), margin.top);
    ctx.lineTo(px(v), margin.top + h);
    ctx.moveTo(margin.left, py(v));
    ctx.lineTo(margin.left + w, py(v));
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText(axisLabel(v, decimal), px(v), margin.top + h + 15);
    ctx.textAlign = 'right';
    ctx.fillText(axisLabel(v, decimal), margin.left - 4, py(v) + 4);
  }
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, w, h);
  ctx.clip();
  ctx.strokeStyle = pal.series[1];
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px(lo), py(lo));
  ctx.lineTo(px(hi), py(hi));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = pal.series[0];
  for (const [a, b] of points) {
    ctx.beginPath();
    ctx.arc(px(a), py(b), 2.4, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

/** The height that a chart function gives a canvas of this width, to reserve the space before drawing. */
function chartHeight(draw, data, width) {
  if (draw === drawLineChart) return lineLayout(data, width).height;
  if (draw === drawQQ) return qqLayout(data, width).height;
  return histLayout(data, width).height;
}

/**
 * What lies under the point (x, y) of a chart drawn at this width, in CSS
 * pixels from its top left corner; null outside the plot. For lines, the
 * index of the nearest x; for histograms, the bar; for quantile plots, the
 * nearest point. `rect` is the rectangle to outline.
 */
function chartHitTest(draw, data, width, x, y) {
  if (draw === drawLineChart) {
    const { margin, h, w, xs } = lineLayout(data, width);
    if (x < margin.left - 6 || x > margin.left + w + 6 || y < margin.top || y > margin.top + h) return null;
    let index = 0;
    xs.forEach((X, i) => {
      if (Math.abs(X - x) < Math.abs(xs[index] - x)) index = i;
    });
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawQQ) {
    const { margin, w, h, px, py } = qqLayout(data, width);
    if (x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
    let index = -1;
    let best = 144;
    data.points.forEach(([a, b], i) => {
      const d = (px(a) - x) ** 2 + (py(b) - y) ** 2;
      if (d < best) {
        best = d;
        index = i;
      }
    });
    if (index < 0) return null;
    const [a, b] = data.points[index];
    return { kind: 'point', index, rect: { x: px(a) - 5, y: py(b) - 5, width: 10, height: 10 } };
  }
  const { margin, w, h, px } = histLayout(data, width);
  if (x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
  const index = data.bars.findIndex((b) => x >= px(b.from) && x < px(b.to));
  if (index < 0) return null;
  const b = data.bars[index];
  return { kind: 'bar', index, rect: { x: px(b.from), y: margin.top, width: px(b.to) - px(b.from), height: h } };
}

/**
 * Explains a chart under the pointer: the bar or the point below the
 * mouse, or below the finger after a tap, gets an outline and a label with
 * the text describe(hit), inserted as plain text. Both stay inside the
 * canvas's parent, which must be positioned. Returns the function that
 * removes them.
 */
function attachChartTooltip(canvas, { draw, data, describe: explain }) {
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
    const text = hit && explain(hit);
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

// ---------------------------------------------------------------------------
// 7. Animation of the trajectories (browser, <canvas>)
// ---------------------------------------------------------------------------

const ANIM_ASPECT = 0.6;
const ANIM_MARGIN = { left: 46, right: 10, top: 10, bottom: 24 };
const ANIM_PANEL = 0.2; // share of the plot taken by the histogram on the right
const ANIM_BINS = 36;
const ANIM_SECONDS = 15; // a run, at speed 1

/** The value of a quantity for a score S after k systems. */
const quantityValue = (quantity, S, k) => (quantity === 'sum' ? S : quantity === 'mean' ? S / k : S / Math.sqrt(k));

/** The law of the iterated logarithm: the envelope sigma sqrt(2 k ln ln k) around k mu, defined for k >= 3. */
const iteratedLogarithm = (k) => (k >= 3 ? Math.sqrt(2 * k * Math.log(Math.log(k))) : NaN);

/**
 * The trajectories of the attackers, step by step: on the left the first
 * `shown` attackers (the first in another colour) with the band mean +- 2
 * standard deviations and the envelope of the law of the iterated
 * logarithm, on the right the histogram of the current values of `sample`
 * attackers with the normal law of the same mean and standard deviation.
 * The quantity can be S_k, S_k/k or S_k/sqrt(k). The attackers are those of
 * the simulation (same seed, same streams). It opens on the last step;
 * play() starts again from the first system. Returns the controls.
 */
function createTrajectoryAnimation(canvas, options) {
  const { model, p = DEFAULT_P, n = DEFAULT_N, seed = DEFAULT_SEED, onUpdate = () => {} } = options;
  const mom = modelMoments(model, p);
  const { threshold, low } = stepRule(model, p);
  const A = Math.max(1, Math.min(options.sample || 500, options.m || Infinity));
  const D = Math.min(options.shown || 50, A);
  let quantity = QUANTITIES.includes(options.quantity) ? options.quantity : 'sum';
  let speed = options.speed || 1;
  let decimal = options.decimal || '.';
  let palette = { ...DEFAULT_PALETTE, ...(options.palette || {}) };

  // the drawn trajectories, whole, and the extremes of every quantity over all attackers and steps (fixed axes)
  const paths = Array.from({ length: D }, () => new Int32Array(n + 1));
  const inverse = new Float64Array(n + 1);
  const inverseRoot = new Float64Array(n + 1);
  for (let k = 1; k <= n; k++) {
    inverse[k] = 1 / k;
    inverseRoot[k] = 1 / Math.sqrt(k);
  }
  const extremes = { sum: [0, 0], mean: [Infinity, -Infinity], normalized: [Infinity, -Infinity] };
  const current = new Int32Array(A);
  for (let j = 0; j < A; j++) {
    const next = attackerGenerator(seed, model, j);
    let S = 0;
    let lo = [0, Infinity, Infinity];
    let hi = [0, -Infinity, -Infinity];
    for (let k = 1; k <= n; k++) {
      S += next() < threshold ? 1 : low;
      if (j < D) paths[j][k] = S;
      if (S < lo[0]) lo[0] = S;
      if (S > hi[0]) hi[0] = S;
      const a = S * inverse[k];
      if (a < lo[1]) lo[1] = a;
      if (a > hi[1]) hi[1] = a;
      const b = S * inverseRoot[k];
      if (b < lo[2]) lo[2] = b;
      if (b > hi[2]) hi[2] = b;
    }
    current[j] = S;
    QUANTITIES.forEach((q, i) => {
      extremes[q][0] = Math.min(extremes[q][0], lo[i]);
      extremes[q][1] = Math.max(extremes[q][1], hi[i]);
    });
    lo = null;
    hi = null;
  }
  const ranges = {};
  for (const q of QUANTITIES) {
    const end = quantityMoments(mom, n, q);
    const a = Math.min(extremes[q][0], end.mean - 2.5 * end.sd);
    const b = Math.max(extremes[q][1], end.mean + 2.5 * end.sd);
    const pad = (b - a) * 0.04 || 1;
    ranges[q] = [a - pad, b + pad];
  }

  let k = n;
  let generators = null;
  let playing = false;
  let frame = 0;
  let last = 0;
  let carry = 0;
  let layer = null;
  let drawnK = -1;
  let geometry = null;

  const value = (S, step) => (quantity === 'sum' ? S : quantity === 'mean' ? S * inverse[step] : S * inverseRoot[step]);

  const layout = () => {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const width = canvas.clientWidth || 640;
    const height = Math.round(width * ANIM_ASPECT);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;
    const m = ANIM_MARGIN;
    const inner = width - m.left - m.right;
    const plotW = Math.round(inner * (1 - ANIM_PANEL)) - 8;
    const panelX = m.left + plotW + 8;
    const panelW = width - m.right - panelX;
    const h = height - m.top - m.bottom;
    const [y0, y1] = ranges[quantity];
    return {
      dpr,
      width,
      height,
      plotW,
      panelX,
      panelW,
      h,
      px: (step) => m.left + (plotW * step) / n,
      py: (v) => m.top + h * (1 - (v - y0) / (y1 - y0)),
      y0,
      y1,
    };
  };

  const strokePaths = (from, to) => {
    const G = geometry;
    const ctx = layer.getContext('2d');
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ANIM_MARGIN.left, ANIM_MARGIN.top, G.plotW, G.h);
    ctx.clip();
    const first = quantity === 'sum' ? Math.max(0, from) : Math.max(1, from);
    const stride = Math.max(1, Math.floor((to - first) / (2 * G.plotW)));
    for (let j = D - 1; j >= 0; j--) {
      const path = paths[j];
      ctx.strokeStyle = j === 0 ? palette.highlight : palette.series[0];
      ctx.globalAlpha = j === 0 ? 1 : 0.32;
      ctx.lineWidth = j === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(G.px(first), G.py(value(path[first], first)));
      for (let s = first + stride; s < to; s += stride) ctx.lineTo(G.px(s), G.py(value(path[s], s)));
      ctx.lineTo(G.px(to), G.py(value(path[to], to)));
      ctx.stroke();
    }
    ctx.restore();
  };

  // the band mean +- 2 sd and the envelope of the iterated logarithm, over all n
  const band = (sign, width) => {
    const out = [];
    const steps = Math.min(n, 400);
    for (let i = 0; i <= steps; i++) {
      const step = Math.max(1, Math.round((i * n) / steps));
      const q = quantityMoments(mom, step, quantity);
      out.push([step, q.mean + sign * width * q.sd]);
    }
    return out;
  };
  const envelope = (sign) => {
    const out = [];
    const steps = Math.min(n, 400);
    for (let i = 0; i <= steps; i++) {
      const step = Math.max(3, Math.round((i * n) / steps));
      const c = quantityScale(quantity, step);
      out.push([step, (step * mom.mu + sign * mom.sigma * iteratedLogarithm(step)) * c]);
    }
    return out;
  };

  const status = () => {
    let sum = 0;
    let sum2 = 0;
    let best = -Infinity;
    for (let j = 0; j < A; j++) {
      const v = k ? value(current[j], k) : 0;
      sum += v;
      sum2 += v * v;
      if (v > best) best = v;
    }
    const mean = sum / A;
    const theory = k ? quantityMoments(mom, k, quantity) : { mean: 0, sd: 0 };
    let outside = 0;
    if (k) for (let j = 0; j < A; j++) if (Math.abs(value(current[j], k) - theory.mean) > 2 * theory.sd) outside++;
    return {
      k,
      n,
      playing,
      done: k >= n,
      quantity,
      sample: A,
      shown: D,
      mean,
      sd: A > 1 ? Math.sqrt(Math.max(0, (sum2 - A * mean * mean) / (A - 1))) : 0,
      theoryMean: theory.mean,
      theorySd: theory.sd,
      outside: k ? outside / A : 0,
      best,
      first: k ? value(paths[0][k], k) : 0,
    };
  };

  const render = () => {
    if (!geometry) {
      geometry = layout();
      drawnK = -1;
    }
    const G = geometry;
    if (!layer || layer.width !== canvas.width || layer.height !== canvas.height) {
      layer = layer || document.createElement('canvas');
      layer.width = canvas.width;
      layer.height = canvas.height;
      drawnK = -1;
    }
    if (drawnK > k || drawnK < 0) {
      layer.getContext('2d').clearRect(0, 0, layer.width, layer.height);
      drawnK = quantity === 'sum' ? 0 : 1;
    }
    if (k > drawnK) {
      strokePaths(drawnK, k);
      drawnK = k;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    const m = ANIM_MARGIN;
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, G.width, G.height);
    ctx.font = '11px sans-serif';
    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.grid;
    ctx.fillStyle = palette.text;
    ctx.textAlign = 'right';
    for (const v of niceTicks(G.y0, G.y1, 5)) {
      ctx.beginPath();
      ctx.moveTo(m.left, G.py(v));
      ctx.lineTo(m.left + G.plotW, G.py(v));
      ctx.stroke();
      ctx.fillText(axisLabel(v, decimal), m.left - 4, G.py(v) + 4);
    }
    ctx.textAlign = 'center';
    for (const v of [0, Math.round(n / 2), n]) ctx.fillText(axisLabel(v, decimal), G.px(v), m.top + G.h + 15);
    ctx.strokeRect(m.left, m.top, G.plotW, G.h);
    ctx.strokeRect(G.panelX, m.top, G.panelW, G.h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(m.left, m.top, G.plotW, G.h);
    ctx.clip();
    const upper = band(1, 2);
    const lower = band(-1, 2);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = palette.series[2];
    ctx.beginPath();
    upper.forEach(([s, v], i) => (i ? ctx.lineTo(G.px(s), G.py(v)) : ctx.moveTo(G.px(s), G.py(v))));
    for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(G.px(lower[i][0]), G.py(lower[i][1]));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, G.width, G.height);
    ctx.strokeStyle = palette.series[2];
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    band(0, 0).forEach(([s, v], i) => (i ? ctx.lineTo(G.px(s), G.py(v)) : ctx.moveTo(G.px(s), G.py(v))));
    ctx.stroke();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = palette.series[3];
    for (const sign of [1, -1]) {
      ctx.beginPath();
      envelope(sign).forEach(([s, v], i) => (i ? ctx.lineTo(G.px(s), G.py(v)) : ctx.moveTo(G.px(s), G.py(v))));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (k < n) {
      ctx.strokeStyle = palette.text;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(G.px(k), m.top);
      ctx.lineTo(G.px(k), m.top + G.h);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // the histogram of the current values, with the normal law of the same mean and standard deviation
    if (k > 0) {
      const binH = (G.y1 - G.y0) / ANIM_BINS;
      const counts = new Array(ANIM_BINS).fill(0);
      for (let j = 0; j < A; j++) {
        const b = Math.floor((value(current[j], k) - G.y0) / binH);
        if (b >= 0 && b < ANIM_BINS) counts[b]++;
      }
      const theory = quantityMoments(mom, k, quantity);
      const expected = counts.map((_, b) => A * (normalCdf((G.y0 + (b + 1) * binH - theory.mean) / theory.sd) - normalCdf((G.y0 + b * binH - theory.mean) / theory.sd)));
      const top = Math.max(1, ...counts, ...expected);
      ctx.fillStyle = palette.series[0];
      ctx.globalAlpha = 0.85;
      counts.forEach((c, b) => {
        if (!c) return;
        const yTop = G.py(G.y0 + (b + 1) * binH);
        const yBottom = G.py(G.y0 + b * binH);
        ctx.fillRect(G.panelX + 1, yTop + 0.5, ((G.panelW - 2) * c) / top, Math.max(0.8, yBottom - yTop - 1));
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.series[2];
      ctx.lineWidth = 2;
      ctx.beginPath();
      expected.forEach((e, b) => {
        const X = G.panelX + 1 + ((G.panelW - 2) * e) / top;
        const Y = G.py(G.y0 + (b + 0.5) * binH);
        if (b) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      });
      ctx.stroke();
    }
    onUpdate(status());
  };

  const advance = (target) => {
    if (!generators) generators = Array.from({ length: A }, (_, j) => attackerGenerator(seed, model, j));
    while (k < target) {
      k++;
      for (let j = 0; j < A; j++) current[j] += generators[j]() < threshold ? 1 : low;
    }
  };

  const rate = () => Math.max(2, n / ANIM_SECONDS) * speed;

  const tick = (time) => {
    if (!playing) return;
    const dt = Math.min(0.1, Math.max(0, (time - last) / 1000));
    last = time;
    carry += dt * rate();
    const steps = Math.floor(carry);
    carry -= steps;
    if (steps > 0) advance(Math.min(n, k + steps));
    if (k >= n) playing = false;
    render();
    if (playing) frame = requestAnimationFrame(tick);
  };

  const controls = {
    play() {
      if (playing) return;
      if (k >= n) controls.reset();
      playing = true;
      last = typeof performance !== 'undefined' ? performance.now() : Date.now();
      carry = 0;
      render();
      frame = requestAnimationFrame(tick);
    },
    pause() {
      playing = false;
      cancelAnimationFrame(frame);
      render();
    },
    step() {
      playing = false;
      cancelAnimationFrame(frame);
      if (k >= n) {
        k = 0;
        current.fill(0);
        generators = null;
      }
      advance(k + 1);
      render();
    },
    reset() {
      playing = false;
      cancelAnimationFrame(frame);
      k = 0;
      current.fill(0);
      generators = null;
      drawnK = -1;
      render();
    },
    toEnd() {
      playing = false;
      cancelAnimationFrame(frame);
      advance(n);
      render();
    },
    setQuantity(q) {
      if (!QUANTITIES.includes(q) || q === quantity) return;
      quantity = q;
      geometry = null;
      render();
    },
    setSpeed(s) {
      speed = s > 0 ? s : 1;
    },
    setPalette(next) {
      palette = { ...DEFAULT_PALETTE, ...next };
      drawnK = -1;
      render();
    },
    setDecimal(d) {
      decimal = d;
      render();
    },
    redraw() {
      geometry = null;
      render();
    },
    status,
    destroy() {
      playing = false;
      cancelAnimationFrame(frame);
      layer = null;
    },
  };
  render();
  return controls;
}

// ---------------------------------------------------------------------------
// 8. Checks, printed report and command line
// ---------------------------------------------------------------------------

/**
 * Known values the implementation must reproduce: the outputs of the
 * reference C code of xoshiro128** and SplitMix64 (prng.di.unimi.it,
 * compiled with gcc), the scores of two attackers after 10000 systems
 * computed by the same C program, and values of the distributions and
 * special functions computed with SciPy 1.17.1.
 */
const CHECK_VECTORS = Object.freeze([
  { group: 'generator', name: 'xoshiro128** from (1, 2, 3, 4)', expected: '11520 0 5927040 70819200 2031721883 1637235492', compute: () => { const g = xoshiro128ss(1, 2, 3, 4); return Array.from({ length: 6 }, g).join(' '); } },
  { group: 'generator', name: 'SplitMix64 from 0', expected: '16294208416658607535 7960286522194355700 487617019471545679', compute: () => { const g = splitMix64(0); return Array.from({ length: 3 }, g).join(' '); } },
  { group: 'generator', name: 'Attacker 1, Bernoulli, seed 2026', expected: '1441997221 504457382 1212262897 368519188', compute: () => { const g = attackerGenerator(2026, 'bernoulli', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Attacker 5000, Rademacher, seed 2026', expected: '932901363 2428308212 2459144351 749651128', compute: () => { const g = attackerGenerator(2026, 'rademacher', 4999); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'S_10000 of attacker 1, Bernoulli, p = 0.2', expected: '2038', compute: () => String(scoreOf(2026, 'bernoulli', 0.2, 0, 10000)) },
  { group: 'generator', name: 'S_10000 of attacker 1, Rademacher', expected: '-32', compute: () => String(scoreOf(2026, 'rademacher', 0.5, 0, 10000)) },
  { group: 'functions', name: 'Phi(1.959963984540054)', expected: 0.975, compute: () => normalCdf(1.959963984540054) },
  { group: 'functions', name: 'P(Z > 5)', expected: 2.866515718791933e-7, compute: () => normalSf(5) },
  { group: 'functions', name: 'Phi^-1(0.975)', expected: 1.959963984540054, compute: () => normalQuantile(0.975) },
  { group: 'functions', name: 'Phi^-1(1e-10)', expected: -6.361340902404056, compute: () => normalQuantile(1e-10) },
  { group: 'functions', name: 'P(K = 2), K ~ Bin(10, 0.2)', expected: 0.30198988800000004, compute: () => binomialPmf(10, 0.2)[2] },
  { group: 'functions', name: 'P(K = 5000), K ~ Bin(10000, 1/2)', expected: 0.007978646139382158, compute: () => binomialPmf(10000, 0.5)[5000] },
  { group: 'functions', name: 'P(K <= 1950), K ~ Bin(10000, 0.2)', expected: 0.10769939023206805, compute: () => binomialPmf(10000, 0.2).slice(0, 1951).reduce((s, v) => s + v, 0) },
  { group: 'functions', name: 'P(chi2(20) > 30)', expected: 0.06985366069940986, compute: () => chiSquarePValue(30, 20) },
  { group: 'functions', name: 'Kolmogorov: P(K > 1.3580986393225505)', expected: 0.050000000000000024, compute: () => kolmogorovSf(1.3580986393225505) },
  { group: 'functions', name: 'Kolmogorov: P(K > 0.5)', expected: 0.9639452436648751, compute: () => kolmogorovSf(0.5) },
  { group: 'functions', name: 'E[max of 10 N(0, 1)]', expected: 1.5387527308351732, compute: () => expectedMaxNormal(10) },
  { group: 'functions', name: 'E[max of 1000 N(0, 1)]', expected: 3.2414357691334437, compute: () => expectedMaxNormal(1000) },
  { group: 'functions', name: 'Arcsine law: P(share <= 0.1)', expected: 0.20483276469913345, compute: () => arcsineCdf(0.1) },
  { group: 'functions', name: 'Kolmogorov distance, Rademacher, n = 100', expected: 0.03979461869358952, compute: () => { const law = exactLaw('rademacher', 0.5, 100); return distanceToContinuous(law.pmf, standardAtoms(law, modelMoments('rademacher')), normalCdf); } },
  { group: 'functions', name: 'Kolmogorov distance, Bernoulli(0.2), n = 100', expected: 0.05946158487339781, compute: () => { const law = exactLaw('bernoulli', 0.2, 100); return distanceToContinuous(law.pmf, standardAtoms(law, modelMoments('bernoulli', 0.2)), normalCdf); } },
  { group: 'functions', name: 'E[max of 10 copies of S_100], Rademacher', expected: 15.355961336350052, compute: () => expectedMaxDiscrete(exactLaw('rademacher', 0.5, 100), 10) },
  { group: 'functions', name: 'Jarque-Bera on 0 1 1 2 2 2 3 3 4 7', expected: 2.4442510806731916, compute: () => jarqueBera(sampleMoments([0, 1, 1, 2, 2, 2, 3, 3, 4, 7])).statistic },
  { group: 'functions', name: 'Its p-value', expected: 0.29460330973676335, compute: () => jarqueBera(sampleMoments([0, 1, 1, 2, 2, 2, 3, 3, 4, 7])).pValue },
]);

/** The score S_n of attacker j after n systems, step by step (the checks). */
function scoreOf(seed, model, p, j, n) {
  const next = attackerGenerator(seed, model, j);
  const { threshold, low } = stepRule(model, p);
  let S = 0;
  for (let i = 0; i < n; i++) S += next() < threshold ? 1 : low;
  return S;
}

/** Every check, with what was expected and what came out: equal strings, or numbers within a relative error of 10^-9. */
function verifyAll() {
  return CHECK_VECTORS.map((v) => {
    const actual = v.compute();
    const ok = typeof v.expected === 'string' ? actual === v.expected : Math.abs(actual - v.expected) <= 1e-9 * Math.max(1e-300, Math.abs(v.expected));
    return { group: v.group, name: v.name, expected: String(v.expected), actual: String(actual), ok };
  });
}

const pad = (v, width) => String(v).padStart(width);
const fixed = (v, digits) => (Number.isFinite(v) ? v.toFixed(digits) : 'n/a');
const fmtP = (t) => {
  if (t.pValue === 0) return '< 1e-300';
  return t.pValue < 0.001 ? t.pValue.toExponential(1) : t.pValue.toFixed(3);
};
const seconds = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(0)} ms`);
const probability = (v) => (v < 1e-4 && v > 0 ? v.toExponential(1) : v.toFixed(4));
const tiny = (v) => (v === 0 ? '0' : v < 1e-4 ? v.toExponential(1) : v.toFixed(5));

/** A histogram in text: one row per bin of S_n/sqrt(n), the simulated share as #, the normal one as |. */
function textHistogram(point, mom, print) {
  const bins = [];
  for (let x = -3.5; x < 3.5 - 1e-9; x += 0.5) bins.push([x, x + 0.5]);
  const scale = mom.sigma * Math.sqrt(point.n);
  const shares = bins.map(() => 0);
  let total = 0;
  point.counts.forEach((c, k) => {
    total += c;
    const z = (point.low + point.step * k - point.n * mom.mu) / scale;
    const b = Math.floor((z + 3.5) / 0.5);
    if (b >= 0 && b < bins.length) shares[b] += c;
  });
  const normal = bins.map(([a, b]) => normalCdf(b) - normalCdf(a));
  const top = Math.max(...shares.map((c) => c / total), ...normal);
  bins.forEach(([a, b], i) => {
    const bar = Math.round((40 * shares[i]) / total / top);
    const mark = Math.round((40 * normal[i]) / top);
    const row = Array.from({ length: 42 }, (_, c) => (c === mark ? '|' : c < bar ? '#' : ' ')).join('');
    print(`  ${fixed(a, 1).padStart(5)} to ${fixed(b, 1).padStart(4)}  ${row} ${(100 * shares[i] / total).toFixed(1).padStart(5)}%`);
  });
}

/**
 * Command line: node homework3.js [--p 0.2] [--n 10000] [--m 5000]
 * [--seed 2026 | --random-seed] [--epsilon 0.05]. Options are checked
 * strictly: anything unknown or malformed prints the usage.
 */
function runCli(argv, print = console.log) {
  const usage = () => {
    print('usage: node homework3.js [--p 0.2] [--n 10000] [--m 5000] [--seed 2026 | --random-seed] [--epsilon 0.05]');
    print(`       p from ${LIMITS.p[0]} to ${LIMITS.p[1]}; n (systems) and m (attackers) from ${LIMITS.n[0]} to ${LIMITS.n[1]}; seed from 0 to ${LIMITS.seed[1]}; epsilon from ${EPSILON_RANGE[0]} to ${EPSILON_RANGE[1]}.`);
    return 1;
  };
  const options = { p: DEFAULT_P, n: DEFAULT_N, m: DEFAULT_M, seed: DEFAULT_SEED };
  let epsilon = DEFAULT_EPSILON;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--random-seed') options.seed = randomSeed();
    else if (arg === '--p' && value !== undefined && parseProbability(value).ok) {
      options.p = parseProbability(value).value;
      i++;
    } else if ((arg === '--n' || arg === '--m') && value !== undefined && parseInteger(value, LIMITS[arg.slice(2)]).ok) {
      options[arg.slice(2)] = parseInteger(value, LIMITS[arg.slice(2)]).value;
      i++;
    } else if (arg === '--seed' && value !== undefined && parseInteger(value, LIMITS.seed).ok) {
      options.seed = parseInteger(value, LIMITS.seed).value;
      i++;
    } else if (arg === '--epsilon' && value !== undefined && parseProbability(value, EPSILON_RANGE).ok) {
      epsilon = parseProbability(value, EPSILON_RANGE).value;
      i++;
    } else {
      return usage();
    }
  }
  const checks = verifyAll();
  const failed = checks.filter((r) => !r.ok);
  print(`Checks: ${checks.length - failed.length} of ${checks.length} passed (xoshiro128** and SplitMix64 against their reference C code, distributions and special functions against SciPy 1.17.1).`);
  failed.forEach((r) => print(`  FAILED ${r.name}: expected ${r.expected}, got ${r.actual}`));
  print('');

  const { p, n, m, seed } = options;
  const s = explore(options);
  const B = s.models.bernoulli;
  const R = s.models.rademacher;
  print(`${m} attackers on ${n} systems, seed ${seed} (every attacker draws from its own xoshiro128** stream):`);
  print(`  Bernoulli   X = 1 with probability p = ${p}, else 0:   mu = ${p}, sigma^2 = ${fixed(B.mom.variance, 4)}`);
  print('  Rademacher  X = +1 or -1 with probability 1/2:      mu = 0, sigma^2 = 1');
  print(`  ${(B.draws + R.draws).toExponential(2)} increments simulated in ${seconds(B.ms + R.ms)}`);
  print('');

  for (const M of [B, R]) {
    print(`${M.model === 'bernoulli' ? 'Bernoulli' : 'Rademacher'}: sample mean and variance over the ${m} attackers [theory]`);
    print(`  ${pad('n', 6)}  ${'mean S_n'.padEnd(22)} ${'var S_n'.padEnd(24)} ${'mean S_n/n'.padEnd(22)} ${'var S_n/n'.padEnd(26)} var S_n/sqrt(n)`);
    for (const pt of M.points) {
      const t = quantityMoments(M.mom, pt.n, 'sum');
      const c = quantityScale('mean', pt.n);
      print(`  ${pad(pt.n, 6)}  ${`${fixed(pt.sample.mean, 2)} [${fixed(t.mean, 2)}]`.padEnd(22)} ${`${fixed(pt.sample.variance, 2)} [${fixed(t.variance, 2)}]`.padEnd(24)} ${`${fixed(pt.sample.mean * c, 4)} [${fixed(M.mom.mu, 4)}]`.padEnd(22)} ${`${pt.sample.variance * c * c < 1e-3 ? (pt.sample.variance * c * c).toExponential(2) : fixed(pt.sample.variance * c * c, 5)} [${t.variance * c * c < 1e-3 ? (t.variance * c * c).toExponential(2) : fixed(t.variance * c * c, 5)}]`.padEnd(26)} ${fixed(pt.sample.variance / pt.n, 4)} [${fixed(M.mom.variance, 4)}]`);
    }
    const fit = fitLine(M.points.map((pt) => Math.log10(pt.n)), M.points.map((pt) => Math.log10(pt.sample.variance)));
    print(`  log10 Var(S_n) against log10 n: slope ${fixed(fit.slope, 4)} +- ${fixed(fit.slopeError, 4)} (theory 1), hence ${fixed(fit.slope - 2, 4)} for S_n/n (theory -1) and ${fixed(fit.slope - 1, 4)} for S_n/sqrt(n) (theory 0)`);
    print('');
  }

  print(`Law of large numbers: P(|S_n/n - mu| > ${epsilon}), simulated [95% Wilson interval], exact, Chebyshev and Hoeffding bounds`);
  for (const M of [B, R]) {
    print(`  ${M.model === 'bernoulli' ? 'Bernoulli' : 'Rademacher'}`);
    for (const pt of M.points) {
      let beyond = 0;
      pt.counts.forEach((c, k) => {
        if (c && beyondEpsilon(pt.low + pt.step * k, pt.n, M.mom.mu, epsilon)) beyond += c;
      });
      const rate = beyond / m;
      const [a, b] = wilsonInterval(rate, m);
      const exact = exactExceedance({ n: pt.n, low: pt.low, step: pt.step, pmf: pt.pmf }, M.mom.mu, epsilon);
      print(`  ${pad(pt.n, 6)}  ${fixed(rate, 4)} [${fixed(a, 4)}, ${fixed(b, 4)}]  exact ${probability(exact).padStart(7)}  Chebyshev ${fixed(chebyshevBound(M.mom, pt.n, epsilon), 4)}  Hoeffding ${probability(hoeffdingBound(M.mom, pt.n, epsilon)).padStart(7)}`);
    }
  }
  print('');

  print('Central limit theorem: Kolmogorov distance of the standardized S_n from N(0, 1)');
  print(`  simulated (KS on ${m} attackers, noise level about ${fixed(KS_MEAN / Math.sqrt(m), 4)}), exact, exact with continuity correction, Berry-Esseen bound`);
  for (const M of [R, B]) {
    print(`  ${M.model === 'bernoulli' ? 'Bernoulli (S_n - n p)/sqrt(n p (1 - p))' : 'Rademacher S_n/sqrt(n)'}`);
    for (const pt of M.points) print(`  ${pad(pt.n, 6)}  simulated ${fixed(pt.ks, 4)}  exact ${fixed(pt.distance, 5)}  corrected ${tiny(pt.distanceCorrected)}  Berry-Esseen ${fixed(berryEsseen(M.mom, pt.n), 4)}`);
  }
  print('');
  const lastR = R.points[R.points.length - 1];
  print(`Histogram of S_n/sqrt(n), Rademacher, n = ${n} (# simulated, | normal):`);
  textHistogram(lastR, R.mom, print);
  print('');

  print('Attackers in groups of b (standardized final scores):');
  print(`  ${pad('b', 5)}  ${'best of b: simulated'.padEnd(24)} exact    normal  sqrt(2 ln b)   P(one beyond +3 sd): sim  exact    systems hit: sim   exact`);
  for (const [M, name] of [[B, 'Bernoulli'], [R, 'Rademacher']]) {
    print(`  ${name}`);
    for (const r of M.groups.rows) print(`  ${pad(r.b, 5)}  ${`${fixed(r.mean, 3)} +- ${fixed(1.96 * r.error, 3)}`.padEnd(24)} ${fixed(r.exact, 3).padStart(6)}  ${fixed(r.normal, 3).padStart(6)}  ${fixed(r.asymptote, 3).padStart(6)}        ${fixed(r.beyond, 4).padStart(12)}  ${fixed(r.beyondExact, 4)}    ${fixed(r.coverage, 4).padStart(10)}   ${fixed(r.coverageExact, 4)}`);
  }
  print('');

  const W = R.walk;
  print(`The symmetric walk (Rademacher), n = ${n}:`);
  print(`  attackers on the same side for more than 90% of the first ${W.even} systems: ${fixed(100 * W.extreme, 1)}% (exact ${fixed(100 * W.extremeExact, 1)}%, arcsine law ${fixed(100 * W.extremeLimit, 1)}%; a uniform share would give 20%)`);
  print(`  returns to zero: ${fixed(W.zeros, 2)} on average (exact ${fixed(W.zerosExact, 2)}, about sqrt(2n/pi) = ${fixed(W.sqrtLaw, 2)})`);
  print(`  maximum of the walk: ${fixed(W.maximum, 2)} on average (exact ${fixed(W.maximumExact, 2)}, about sqrt(2n/pi) = ${fixed(W.sqrtLaw, 2)})`);
  print('');

  print('Aggregate penetration score over all attackers and systems:');
  for (const M of [B, R]) {
    const z = (M.aggregate.total - M.aggregate.expected) / M.aggregate.sd;
    print(`  ${(M.model === 'bernoulli' ? 'Bernoulli' : 'Rademacher').padEnd(11)} total ${M.aggregate.total} (expected ${fixed(M.aggregate.expected, 0)} +- ${fixed(M.aggregate.sd, 1)}, z = ${fixed(z, 2)}); per system: mean ${fixed(M.aggregate.systemSample.mean, 2)}, variance ${fixed(M.aggregate.systemSample.variance, 2)} (Bin(m, ${M.mom.hit}): ${fixed(m * M.mom.hit, 2)}, ${fixed(m * M.mom.hit * (1 - M.mom.hit), 2)})`);
  }
  print('');

  const all = Object.entries(statisticalTests(s)).flatMap(([group, list]) => list.map(([k, test]) => ({ group, key: k, test })));
  print(`Hypothesis tests, alpha = ${SIGNIFICANCE}:`);
  for (const { group, key: k, test } of all) print(`  ${group.padEnd(4)} ${fmtP(test).padEnd(9)} ${test.verdict === 'reject' ? '[rejected] ' : ''}${TEST_LABELS[group][k]}`);
  return failed.length ? 1 : 0;
}

/** True under Node, where the downloadable program can run runCli. */
const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);

return { MODELS, QUANTITIES, DEFAULT_P, DEFAULT_N, DEFAULT_M, DEFAULT_SEED, LIMITS, DEFAULT_EPSILON, EPSILON_RANGE, N_GRID, checkpoints, SMALL_N, BLOCKS, MIN_GROUPS, SIGNIFICANCE, BERRY_ESSEEN_C, parseInteger, parseProbability, checkParams, splitMix64, xoshiro128ss, attackerState, attackerGenerator, stepRule, randomSeed, modelMoments, quantityScale, quantityMoments, fourthMoment, binomialPmf, exactLaw, beyondEpsilon, exactExceedance, chebyshevBound, hoeffdingBound, normalExceedance, berryEsseen, standardAtoms, correctedNormal, simulateSteps, runSteps, runStepsAsync, chiSquarePValue, twoSidedNormalTail, normalPdf, normalSf, normalCdf, normalQuantile, kolmogorovSf, ksPValue, KS_MEAN, distanceToContinuous, distanceToLattice, latticeMoments, sampleMoments, goodnessOfFit, independenceTest, meanTest, varianceTest, jarqueBera, ksTest, wilsonInterval, fitLine, expectedMaxDiscrete, expectedMaxNormal, arcsineCdf, arcsineDensity, returnProbabilities, discreteArcsine, curveGrid, distanceCurveSteps, exploreSteps, explore, exploreAsync, statisticalTests, TEST_LABELS, DEFAULT_PALETTE, axisLabel, niceTicks, drawLineChart, drawHistogram, drawQQ, chartHeight, chartHitTest, attachChartTooltip, quantityValue, iteratedLogarithm, createTrajectoryAnimation, CHECK_VECTORS, verifyAll, runCli, isNode };
})();

// src/pages/statistics/hw3/standalone/cli.js
// La coda del file homework3.js scaricabile: la riga di comando
// node homework3.js [opzioni] e l'uso da altri script. La build la aggiunge
// dopo la libreria cosi' com'e', quindi qui non ci sono import ne' export.
//
// Funziona qualunque sia il nome del file, e in entrambi i modi in cui Node
// puo' caricarlo:
//   - CommonJS (il package.json accanto lo dichiara): require('./homework3.js')
//     restituisce la libreria, e la riga di comando parte solo se il file e'
//     quello eseguito (require.main);
//   - modulo ES (per esempio copiato da solo in un progetto con
//     "type": "module"): la libreria e' globalThis.Homework3, e la riga di
//     comando parte solo se il file e' quello eseguito, cosa che qui si
//     ricava dalla traccia dello stack, l'unico modo che non richiede
//     import.meta (che in uno script classico sarebbe un errore di sintassi).

// Command line: node homework3.js [--p 0.2] [--n 10000] [--m 5000] [--seed 2026 | --random-seed] [--epsilon 0.05]
(function () {
  if (typeof window !== 'undefined' || typeof process !== 'object' || !process || !process.versions || !process.versions.node) return;
  const run = () => {
    process.exitCode = Homework3.runCli(process.argv.slice(2), console.log);
  };

  if (typeof module === 'object' && module && module.exports) {
    module.exports = Homework3;
    if (typeof require === 'function' && require.main === module) run();
    return;
  }

  globalThis.Homework3 = Homework3;
  // In un modulo ES require non esiste, e fino a Node 18 manca anche il
  // generatore crittografico globale (crypto): lo si carica qui, in modo
  // asincrono, e la riga di comando parte solo dopo, cosi' anche
  // --random-seed usa il generatore crittografico su ogni versione di Node
  // da 14 in su.
  const ready = globalThis.crypto
    ? Promise.resolve()
    : import('crypto').then((nodeCrypto) => {
      if (!globalThis.crypto) globalThis.crypto = nodeCrypto.webcrypto || { getRandomValues: (bytes) => nodeCrypto.randomFillSync(bytes) };
    });
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
  if (entry && (entry === self || `${entry}.js` === self)) ready.then(run);
})();
