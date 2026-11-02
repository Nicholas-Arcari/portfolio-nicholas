/* global process */
/**
 * Homework #4 - Welford's recurrence formulas, and the sampling mean and
 *               variance of m hackers on n systems
 * Sapienza University of Rome - MSc in Cybersecurity (LM-66) - Statistics
 * Nicholas Arcari
 *
 * Part 1 derives Knuth's running mean and Welford's recurrences for the
 * sum of squares SS and the variance, and runs them: three lines update the
 * mean and SS with every new value, without storing the data and without
 * the cancellation of the textbook formula. Part 2 extends Homework #3:
 * every penetration attempt now gets a score between 0 and 10, drawn from a
 * fixed distribution with mean mu and variance sigma^2; each of m hackers
 * attempts n systems and computes, with the same three lines, the sampling
 * mean and variance of its n scores; across the hackers the averages are
 * compared with mu and sigma^2, and their variability is followed as n
 * grows. Everything is written from scratch, with no dependencies:
 *
 *   0. Parameters and input validation
 *   1. Part 1: the recurrences of Knuth and Welford
 *   2. Random numbers: SplitMix64 and xoshiro128**
 *   3. The score distributions and their exact moments
 *   4. Simulation of the m hackers
 *   5. Statistics: special functions and hypothesis tests
 *   6. The experiments
 *   7. Charts (browser, <canvas>)
 *   8. Animation of the running mean and variance (browser, <canvas>)
 *   9. Checks, printed report and command line
 */

// ---------------------------------------------------------------------------
// 0. Parameters and input validation
// ---------------------------------------------------------------------------

const fail = (message) => {
  throw new RangeError(message);
};

/** The score distributions, in the order the page shows them. */
export const DISTRIBUTIONS = Object.freeze(['outcome', 'binomial', 'uniform', 'beta']);

/** The two quantities of every hacker: the sampling mean M_n and the sampling variance s_n^2. */
export const QUANTITIES = Object.freeze(['mean', 'variance']);

/** The values the page opens with: the distribution, P(success) as in Homework #3, systems, hackers, seed. */
export const DEFAULT_DIST = 'outcome';
export const DEFAULT_P = 0.2;
export const DEFAULT_N = 10000;
export const DEFAULT_M = 5000;
export const DEFAULT_SEED = 2026;

/** The scores lie in [0, SCORE_MAX]; the parameters of the binomial and of the Beta law are fixed. */
export const SCORE_MAX = 10;
export const BINOMIAL = Object.freeze({ trials: 10, q: 0.3 });
export const BETA = Object.freeze({ a: 2, b: 5 });

/** The accepted ranges: at most 10^8 scores, a second or two of computation. */
export const LIMITS = Object.freeze({
  p: Object.freeze([0.01, 0.99]),
  n: Object.freeze([10, 10000]),
  m: Object.freeze([10, 10000]),
  seed: Object.freeze([0, 4294967295]),
});

/** The values of n at which the mean and the variance of every hacker are read; the variance needs n >= 2. */
export const N_GRID = Object.freeze([2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]);

/** The checkpoints of a run on n systems: the grid below n, then n. */
export const checkpoints = (n) => [...N_GRID.filter((v) => v < n), n];

/** The n of the small-sample tests. */
export const SMALL_N = 10;

/** Significance level of every test, and the level of the confidence intervals of section 2.6. */
export const SIGNIFICANCE = 0.05;
export const CONFIDENCE = 0.95;

/** An integer of the range [min, max], in decimal digits. */
export function parseInteger(text, [min, max]) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (!/^\d{1,12}$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const value = Number(t);
  if (value < min || value > max) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** A probability of the range [min, max], with a decimal point or a decimal comma: 0.2, 0,2, .2. */
export function parseProbability(text, [min, max] = LIMITS.p) {
  const t = String(text).trim();
  const plain = t.replace(',', '.');
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (plain.length > 12 || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(plain)) return { ok: false, error: 'notNumber', text: t };
  const value = Number(plain);
  if (!(value >= min && value <= max)) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}


/** The parameters of a run, checked against LIMITS. */
export function checkParams({ dist = DEFAULT_DIST, p = DEFAULT_P, n = DEFAULT_N, m = DEFAULT_M, seed = DEFAULT_SEED } = {}) {
  const within = (v, [lo, hi]) => typeof v === 'number' && v >= lo && v <= hi;
  if (!DISTRIBUTIONS.includes(dist)) fail(`the distribution must be one of ${DISTRIBUTIONS.join(', ')}`);
  if (!within(p, LIMITS.p)) fail(`p must be between ${LIMITS.p[0]} and ${LIMITS.p[1]}`);
  if (!Number.isInteger(n) || !within(n, LIMITS.n)) fail(`n must be an integer between ${LIMITS.n[0]} and ${LIMITS.n[1]}`);
  if (!Number.isInteger(m) || !within(m, LIMITS.m)) fail(`m must be an integer between ${LIMITS.m[0]} and ${LIMITS.m[1]}`);
  if (!Number.isInteger(seed) || !within(seed, LIMITS.seed)) fail(`the seed must be an integer between 0 and ${LIMITS.seed[1]}`);
  return { dist, p, n, m, seed };
}

// ---------------------------------------------------------------------------
// 1. Part 1: the recurrences of Knuth and Welford
// ---------------------------------------------------------------------------

/*
 * Knuth (The Art of Computer Programming, vol. 2, section 4.2.2) updates
 * the mean of x_1, ..., x_k without keeping their sum:
 *   M_1 = x_1,   M_k = M_(k-1) + (x_k - M_(k-1))/k.
 * Welford (1962) does the same for the sum of squared deviations from the
 * mean, SS_k = sum (x_i - M_k)^2:
 *   SS_1 = 0,    SS_k = SS_(k-1) + (x_k - M_(k-1))(x_k - M_k),
 * and the sample variance is s_k^2 = SS_k/(k - 1). The three lines of
 * WELFORD_LINES are the whole algorithm: welford() runs exactly them, and
 * the simulation of section 4 repeats them for every hacker.
 */

/** The core of Part 1 as the page shows it: the same three lines as in welford() and in simulateSteps(). */
export const WELFORD_LINES = Object.freeze([
  'const delta = x - mean;    // x_k - M_(k-1)',
  'mean += delta / k;         // Knuth:   M_k = M_(k-1) + (x_k - M_(k-1))/k',
  'ss += delta * (x - mean);  // Welford: SS_k = SS_(k-1) + (x_k - M_(k-1))(x_k - M_k)',
]);

/** Mean, SS and sample variance of a list of numbers in one pass, with the recurrences of Knuth and Welford. */
export function welford(values) {
  let mean = 0;
  let ss = 0;
  let k = 0;
  for (const x of values) {
    k += 1;
    const delta = x - mean;    // x_k - M_(k-1)
    mean += delta / k;         // Knuth:   M_k = M_(k-1) + (x_k - M_(k-1))/k
    ss += delta * (x - mean);  // Welford: SS_k = SS_(k-1) + (x_k - M_(k-1))(x_k - M_k)
  }
  return { k, mean, ss, variance: k > 1 ? ss / (k - 1) : NaN, population: k > 0 ? ss / k : NaN };
}

/**
 * Every step of the recurrences on a list of numbers, for the table and the
 * chart of section 1.5: x_k, delta = x_k - M_(k-1), M_k, x_k - M_k, the
 * increment of SS, SS_k, the sample variance SS_k/(k - 1), the population
 * variance SS_k/k, and s_k^2 once more from its own recurrence (section
 * 1.3), s_k^2 = (k - 2)/(k - 1) s_(k-1)^2 + delta^2/k, as a check.
 */
export function welfordSteps(values) {
  const rows = [];
  let mean = 0;
  let ss = 0;
  let s2 = 0;
  values.forEach((x, i) => {
    const k = i + 1;
    const previous = mean;
    const delta = x - mean;
    mean += delta / k;
    const after = x - mean;
    const increment = delta * after;
    ss += increment;
    if (k >= 2) s2 = ((k - 2) * s2) / (k - 1) + (delta * delta) / k;
    rows.push({ k, x, previous, delta, mean, after, increment, ss, variance: k > 1 ? ss / (k - 1) : NaN, population: ss / k, recursive: k > 1 ? s2 : NaN });
  });
  return rows;
}

/** The textbook one-pass formula, (sum x^2 - (sum x)^2/n)/(n - 1): one pass, but it subtracts two huge, almost equal numbers. */
export function naiveVariance(values) {
  let s1 = 0;
  let s2 = 0;
  for (const x of values) {
    s1 += x;
    s2 += x * x;
  }
  const n = values.length;
  return (s2 - (s1 * s1) / n) / (n - 1);
}

/** The two-pass formula: the mean first, then the squared deviations from it. Accurate, but it must read the data twice. */
export function twoPassVariance(values) {
  let s1 = 0;
  for (const x of values) s1 += x;
  const mean = s1 / values.length;
  let ss = 0;
  for (const x of values) ss += (x - mean) * (x - mean);
  return ss / (values.length - 1);
}

/** The data of section 1.5 as the page opens with them (the classic example: mean 5, population standard deviation 2). */
export const DEFAULT_DATA = Object.freeze([2, 4, 4, 4, 5, 5, 7, 9]);

/** How many numbers section 1.5 accepts, and how large. */
export const DATA_MAX = 40;
export const DATA_LIMIT = 1e15;

/**
 * The numbers of section 1.5: separated by spaces, semicolons or a comma
 * followed by a space, with a decimal point or a decimal comma (2.5 and
 * 2,5 are the same number), at least 2 and at most DATA_MAX of them.
 */
export function parseData(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty', text: t };
  const tokens = t.replace(/,\s+/g, ' ').split(/[\s;]+/).filter(Boolean);
  if (tokens.length > DATA_MAX) return { ok: false, error: 'tooMany', text: t };
  const values = [];
  for (const token of tokens) {
    if (token.length > 24 || !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d{1,3})?$/.test(token)) return { ok: false, error: 'notNumber', text: token };
    const v = Number(token.replace(',', '.'));
    if (!Number.isFinite(v) || Math.abs(v) > DATA_LIMIT) return { ok: false, error: 'tooLarge', text: token };
    values.push(v);
  }
  if (values.length < 2) return { ok: false, error: 'tooFew', text: t };
  return { ok: true, value: values };
}

/** The classic example of the cancellation: 4, 7, 13, 16 (variance 30) shifted by growing offsets. */
export const CANCELLATION_DATA = Object.freeze([4, 7, 13, 16]);
export const CANCELLATION_OFFSETS = Object.freeze([0, 1e6, 1e8, 1e9, 1e12]);

/** The three formulas on CANCELLATION_DATA + c, for every offset c: the exact variance is always 30. */
export function cancellationRows() {
  return CANCELLATION_OFFSETS.map((c) => {
    const x = CANCELLATION_DATA.map((v) => c + v);
    return { offset: c, naive: naiveVariance(x), twoPass: twoPassVariance(x), welford: welford(x).variance, mean: welford(x).mean };
  });
}

/** The exponents of the offsets of the stability curve, 10^0 ... 10^14, and how many scores it uses. */
export const STABILITY_POWERS = Object.freeze(Array.from({ length: 15 }, (_, e) => e));
export const STABILITY_SIZE = 1000;

/**
 * Section 1.6: the variance of x_i = c + y_i, with y_i the first 1000
 * scores of hacker 1 (initial distribution and seed) and c = 10^0, ...,
 * 10^14. A shift does not change the variance, so the exact value is the
 * one of the y_i, computed with integers (exact up to the last division);
 * the relative error of every formula shows what floating point does to it.
 */
export function stabilityCurve() {
  const draw = hackerScores(DEFAULT_SEED, scoreLaw(DEFAULT_DIST, DEFAULT_P), 0);
  const y = Array.from({ length: STABILITY_SIZE }, draw);
  let s1 = 0;
  let s2 = 0;
  for (const v of y) {
    s1 += v;
    s2 += v * v;
  }
  const N = y.length;
  const exact = (N * s2 - s1 * s1) / (N * (N - 1));
  const error = (v) => Math.abs(v - exact) / exact;
  const rows = STABILITY_POWERS.map((power) => {
    const c = 10 ** power;
    const x = y.map((v) => c + v);
    const values = { naive: naiveVariance(x), twoPass: twoPassVariance(x), welford: welford(x).variance };
    return { power, offset: c, values, errors: { naive: error(values.naive), twoPass: error(values.twoPass), welford: error(values.welford) } };
  });
  return { exact, size: N, rows };
}

/** The formulas of section 1.6, in the order of the chart. */
export const FORMULAS = Object.freeze(['naive', 'twoPass', 'welford']);

// ---------------------------------------------------------------------------
// 2. Random numbers: SplitMix64 and xoshiro128**
// ---------------------------------------------------------------------------

/*
 * The generators of Homework #3, unchanged: xoshiro128** (Blackman and
 * Vigna, 2018), with 128 bits of state and period 2^128 - 1, seeded with
 * SplitMix64. Every hacker has two streams. The first, 'outcome', is the
 * stream of attacker j of Homework #3 in the Bernoulli model: with the same
 * seed and the same p, hacker j succeeds and fails on exactly the systems
 * where attacker j of Homework #3 did, and the score is what this homework
 * adds. The second, 'score', starts SplitMix64 from the same number XOR the
 * golden ratio 0x9e3779b97f4a7c15, so it does not meet the streams of
 * Homework #3. Both are checked against the reference C code (section 9).
 */

const MASK64 = (1n << 64n) - 1n;

/** SplitMix64 (Steele, Lea and Flood, 2014), as in Vigna's reference code: 64-bit outputs, as BigInt. */
export function splitMix64(seed) {
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

/** The two streams of every hacker. */
export const STREAMS = Object.freeze(['outcome', 'score']);

const GOLDEN = 0x9e3779b97f4a7c15n;

/**
 * The initial state of a stream of hacker j (from 0): two outputs of
 * SplitMix64 started from seed x 2^32 + j ('outcome', the number of
 * Homework #3) or from that number XOR GOLDEN ('score'), as four 32-bit
 * words. The scores of a hacker do not depend on how many hackers or
 * systems there are: more systems extend its trajectory, more hackers add
 * new ones, and the page, the animation and the command line see the same
 * hackers.
 */
export function hackerState(seed, stream, j) {
  const index = STREAMS.indexOf(stream);
  if (index < 0) fail(`unknown stream ${stream}`);
  const start = (BigInt(seed >>> 0) << 32n) | BigInt(j >>> 0);
  const next = splitMix64(index === 0 ? start : start ^ GOLDEN);
  const a = next();
  const b = next();
  return [Number(a & 0xffffffffn), Number(a >> 32n), Number(b & 0xffffffffn), Number(b >> 32n)];
}

/** A stream of hacker j: xoshiro128** from hackerState. */
export const hackerGenerator = (seed, stream, j) => xoshiro128ss(...hackerState(seed, stream, j));

const TWO32 = 4294967296;

/** A new seed from the cryptographic generator, when there is one (the seed does not protect anything). */
export function randomSeed() {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') return c.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * TWO32);
}

// ---------------------------------------------------------------------------
// 3. The score distributions and their exact moments
// ---------------------------------------------------------------------------

/*
 * Four laws on [0, 10], each with its exact moments: mu and sigma^2, and the
 * central moments mu3, mu4 and mu6 that the theory of Part 2 needs (the
 * variance of s^2 depends on mu4, its covariance with the mean on mu3, its
 * skewness on mu6).
 *   outcome   the outcome of Homework #3 plus a score: a failure (probability
 *             1 - p) scores an integer uniform on 0..4, a success one on 6..10;
 *   binomial  Bin(10, 0.3): ten steps, each succeeding with probability 0.3;
 *   uniform   the integers 0..10, all equally likely;
 *   beta      10 times a Beta(2, 5) variable: continuous, mostly low.
 */

/** The central moments mu2, mu3, mu4 and mu6 of a law on the integers 0..10, from its probabilities. */
function discreteMoments(pmf) {
  let mu = 0;
  pmf.forEach((pr, k) => {
    mu += k * pr;
  });
  const c = [0, 0, 0, 0, 0, 0, 0];
  pmf.forEach((pr, k) => {
    let d = 1;
    for (let r = 1; r <= 6; r++) {
      d *= k - mu;
      c[r] += pr * d;
    }
  });
  return { mu, variance: c[2], mu3: c[3], mu4: c[4], mu6: c[6] };
}

/** The same moments for scale x Beta(a, b), from the raw moments E[Y^r] = prod over i < r of (a + i)/(a + b + i). */
function betaMoments(a, b, scale) {
  const raw = [1];
  for (let r = 1; r <= 6; r++) raw.push((raw[r - 1] * (a + r - 1)) / (a + b + r - 1));
  const mu = raw[1];
  const binomial = (r, i) => {
    let c = 1;
    for (let t = 1; t <= i; t++) c = (c * (r - t + 1)) / t;
    return c;
  };
  const central = (r) => {
    let total = 0;
    for (let i = 0; i <= r; i++) total += binomial(r, i) * raw[i] * (-mu) ** (r - i);
    return total * scale ** r;
  };
  return { mu: mu * scale, variance: central(2), mu3: central(3), mu4: central(4), mu6: central(6) };
}

/** The distribution function of Beta(a, b) for integer a and b: the probability that at least a of a + b - 1 uniform numbers lie below y. */
export function betaCdf(y, a = BETA.a, b = BETA.b) {
  if (y <= 0) return 0;
  if (y >= 1) return 1;
  const N = a + b - 1;
  let total = 0;
  let c = 1;
  for (let j = 0; j <= N; j++) {
    if (j >= a) total += c * y ** j * (1 - y) ** (N - j);
    c = (c * (N - j)) / (j + 1);
  }
  return total;
}

/** The density of Beta(a, b) for integer a and b: y^(a-1) (1 - y)^(b-1) / B(a, b), with B(a, b) = (a-1)! (b-1)! / (a+b-1)!. */
export function betaDensity(y, a = BETA.a, b = BETA.b) {
  if (y < 0 || y > 1) return 0;
  let inverseB = 1;
  for (let t = 1; t <= a + b - 1; t++) inverseB *= t;
  for (let t = 1; t < a; t++) inverseB /= t;
  for (let t = 1; t < b; t++) inverseB /= t;
  return y ** (a - 1) * (1 - y) ** (b - 1) * inverseB;
}

/**
 * The law of the scores: its probabilities on 0..10 (discrete laws) or its
 * distribution function and density (the Beta law), its moments, and the
 * classes of the chi-square test of the pooled scores: the eleven integers,
 * or ten intervals of width 1.
 */
export function scoreLaw(dist, p = DEFAULT_P) {
  let law;
  if (dist === 'outcome' || dist === 'binomial' || dist === 'uniform') {
    const pmf = new Float64Array(SCORE_MAX + 1);
    if (dist === 'outcome') {
      for (let v = 0; v <= 4; v++) {
        pmf[v] = (1 - p) / 5;
        pmf[v + 6] = p / 5;
      }
    } else if (dist === 'binomial') {
      const { trials, q } = BINOMIAL;
      let c = 1;
      for (let k = 0; k <= trials; k++) {
        pmf[k] = c * q ** k * (1 - q) ** (trials - k);
        c = (c * (trials - k)) / (k + 1);
      }
    } else {
      pmf.fill(1 / (SCORE_MAX + 1));
    }
    // the thresholds of the inversion: a 32-bit number u gives the first k with u < F(k) 2^32
    const thresholds = new Float64Array(SCORE_MAX + 1);
    let F = 0;
    for (let k = 0; k <= SCORE_MAX; k++) {
      F += pmf[k];
      thresholds[k] = F * TWO32;
    }
    law = { dist, discrete: true, pmf, thresholds, ...discreteMoments(pmf), classes: Array.from(pmf) };
  } else if (dist === 'beta') {
    const cdf = (x) => betaCdf(x / SCORE_MAX);
    law = {
      dist,
      discrete: false,
      pmf: null,
      cdf,
      density: (x) => betaDensity(x / SCORE_MAX) / SCORE_MAX,
      ...betaMoments(BETA.a, BETA.b, SCORE_MAX),
      classes: Array.from({ length: SCORE_MAX }, (_, i) => cdf(i + 1) - cdf(i)),
    };
  } else {
    fail(`unknown distribution ${dist}`);
  }
  law.p = dist === 'outcome' ? p : null;
  law.sigma = Math.sqrt(law.variance);
  law.skewness = law.mu3 / law.variance ** 1.5;
  law.kurtosis = law.mu4 / law.variance ** 2 - 3;
  return law;
}

/**
 * The exact moments of the sampling mean M_n and of the sampling variance
 * s_n^2 of n i.i.d. scores. E[M_n] = mu and Var(M_n) = sigma^2/n, with
 * fourth central moment (mu4 + 3(n - 1) sigma^4)/n^3, skewness g1/sqrt(n)
 * and excess kurtosis g2/n. E[s_n^2] = sigma^2 and
 * Var(s_n^2) = mu4/n - sigma^4 (n - 3)/(n (n - 1)), against the
 * 2 sigma^4/(n - 1) of normal data; its skewness, to first order,
 * (mu6 - 3 sigma^2 mu4 - 6 mu3^2 + 2 sigma^6)/((mu4 - sigma^4)^(3/2) sqrt(n)).
 * Cov(M_n, s_n^2) = mu3/n. The biased SS_n/n has mean sigma^2 (n - 1)/n.
 */
export function samplingTheory(law, n) {
  const s2 = law.variance;
  const s4 = s2 * s2;
  const varMean = s2 / n;
  const varVariance = law.mu4 / n - (s4 * (n - 3)) / (n * (n - 1));
  const cov = law.mu3 / n;
  const spread = law.mu4 - s4;
  return {
    n,
    mean: law.mu,
    varMean,
    sdMean: Math.sqrt(varMean),
    mu4Mean: (law.mu4 + 3 * (n - 1) * s4) / n ** 3,
    skewMean: law.skewness / Math.sqrt(n),
    kurtMean: law.kurtosis / n,
    variance: s2,
    varVariance,
    sdVariance: Math.sqrt(varVariance),
    normalVariance: (2 * s4) / (n - 1),
    skewVariance: spread > 0 ? (law.mu6 - 3 * s2 * law.mu4 - 6 * law.mu3 * law.mu3 + 2 * s4 * s2) / (spread ** 1.5 * Math.sqrt(n)) : 0,
    biased: (s2 * (n - 1)) / n,
    varBiased: ((n - 1) / n) ** 2 * varVariance,
    cov,
    corr: cov / Math.sqrt(varMean * varVariance),
  };
}

/**
 * Where the coverage of the chi-square interval for sigma^2 goes as n
 * grows. The interval assumes normal data, for which s^2 has relative
 * variance 2/(n - 1); in general it is about (kappa - 1)/n, kappa =
 * mu4/sigma^4, so the coverage tends to 2 Phi(z sqrt(2/(kappa - 1))) - 1:
 * 95% only when kappa = 3, as for the normal law.
 */
export const chiSquareCoverageLimit = (law, z = 1.959963984540054) => 2 * normalCdf(z * Math.sqrt(2 / (law.kurtosis + 2))) - 1;

// ---------------------------------------------------------------------------
// 4. Simulation of the m hackers
// ---------------------------------------------------------------------------

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

/**
 * The scores of hacker j, one call after the other. The outcome law reads
 * one number from each stream: the success (u < p 2^32, as in Homework #3)
 * and then the score in its range, floor(5 v / 2^32). The other laws read
 * the score stream only: Bin(10, 0.3) by inversion of its distribution
 * function, the uniform law with floor(11 v / 2^32), and Beta(2, 5) as the
 * second smallest of six uniform numbers (the k-th smallest of N uniform
 * numbers is Beta(k, N + 1 - k)), drawn exactly with two numbers instead of
 * six: 1 - U1^(1/6) U2^(1/5).
 */
export function hackerScores(seed, law, j) {
  const score = hackerGenerator(seed, 'score', j);
  if (law.dist === 'outcome') {
    const outcome = hackerGenerator(seed, 'outcome', j);
    const threshold = law.p * TWO32;
    return () => {
      const hit = outcome() < threshold;
      const v = Math.floor((score() * 5) / TWO32);
      return hit ? 6 + v : v;
    };
  }
  if (law.dist === 'binomial') {
    const T = law.thresholds;
    return () => {
      const u = score();
      let k = 0;
      while (k < SCORE_MAX && u >= T[k]) k++;
      return k;
    };
  }
  if (law.dist === 'uniform') return () => Math.floor((score() * (SCORE_MAX + 1)) / TWO32);
  // the smallest of six uniform numbers is 1 - U1^(1/6); above it the other five are uniform, and the smallest of them is the second of the six
  return () => SCORE_MAX * (1 - ((score() + 0.5) / TWO32) ** (1 / 6) * ((score() + 0.5) / TWO32) ** (1 / 5));
}

/**
 * The m hackers on n systems, one hacker after the other, as a generator
 * that yields after every hacker (a page can run it in slices of a few
 * milliseconds, a worker or the command line in one go). Every hacker runs
 * the three lines of Part 1 on its scores and, at every checkpoint of the
 * grid, its mean M_n and its variance s_n^2 = SS_n/(n - 1) are recorded.
 * The scores themselves are not stored; along the way the simulation also
 * counts them per class (the chi-square test of the generator) and sums
 * (x_i - mu)(x_(i+1) - mu) over consecutive scores (the test of their
 * independence).
 */
export function* simulateSteps({ dist = DEFAULT_DIST, p = DEFAULT_P, n = DEFAULT_N, m = DEFAULT_M, seed = DEFAULT_SEED } = {}) {
  const law = scoreLaw(dist, p);
  const grid = checkpoints(n);
  const means = grid.map(() => new Float64Array(m));
  const variances = grid.map(() => new Float64Array(m));
  const counts = new Float64Array(law.classes.length);
  const top = law.classes.length - 1;
  const mu = law.mu;
  let lagSum = 0;
  const started = now();
  for (let j = 0; j < m; j++) {
    const draw = hackerScores(seed, law, j);
    let mean = 0;
    let ss = 0;
    let previous = 0;
    let g = 0;
    let checkpoint = grid[0];
    for (let k = 1; k <= n; k++) {
      const x = draw();
      counts[law.discrete ? x : Math.min(top, Math.floor(x))]++;
      if (k > 1) lagSum += (previous - mu) * (x - mu);
      previous = x;
      const delta = x - mean;    // x_k - M_(k-1)
      mean += delta / k;         // Knuth:   M_k = M_(k-1) + (x_k - M_(k-1))/k
      ss += delta * (x - mean);  // Welford: SS_k = SS_(k-1) + (x_k - M_(k-1))(x_k - M_k)
      if (k === checkpoint) {
        means[g][j] = mean;
        variances[g][j] = ss / (k - 1);
        g++;
        checkpoint = grid[g];
      }
    }
    yield;
  }
  return { dist, p, n, m, seed, law, grid, means, variances, counts, lagSum, pairs: m * (n - 1), draws: m * n, ms: now() - started };
}

/** The first n scores of hacker j, summarized with the three lines of Part 1: the scores, their mean, their sample variance and SS/n (the interactive examples of sections 2.5 and 2.7). */
export function sampleStats(seed, law, j, n) {
  const values = Array.from({ length: n }, hackerScores(seed, law, j));
  const w = welford(values);
  return { j, values, mean: w.mean, variance: w.variance, biased: w.population };
}

/** Runs one of the generators of this file to the end, in one go (a worker, the command line). */
export function runSteps(steps) {
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

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
// 5. Statistics: special functions and hypothesis tests
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
export const chiSquarePValue = (chi2, df) => (df > 0 && chi2 >= 0 ? gammaQ(df / 2, chi2 / 2) : NaN);

/** Probability that |Z| > z for a standard normal Z. */
export const twoSidedNormalTail = (z) => gammaQ(0.5, (z * z) / 2);

/** The standard normal density. */
export const normalPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

/** P(Z > x), accurate also far in the upper tail: erfc(x/sqrt(2))/2 = Q(1/2, x^2/2)/2. */
export const normalSf = (x) => (x >= 0 ? 0.5 * gammaQ(0.5, (x * x) / 2) : 1 - 0.5 * gammaQ(0.5, (x * x) / 2));

/** Phi(x) = P(Z <= x). */
export const normalCdf = (x) => normalSf(-x);

/** The normal quantile Phi^-1(p): Acklam's rational approximation, then one step of Halley's method. */
export function normalQuantile(p) {
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

/** The regularized incomplete beta function I_x(a, b): Lentz's continued fraction, on the side where it converges fast. */
export function betaIncomplete(x, a, b) {
  if (!(x > 0)) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (front * betaFraction(x, a, b)) / a;
  return 1 - (front * betaFraction(1 - x, b, a)) / b;
}

function betaFraction(x, a, b) {
  const tiny = 1e-300;
  const clamp = (v) => (Math.abs(v) < tiny ? tiny : v);
  let c = 1;
  let d = 1 / clamp(1 - ((a + b) * x) / (a + 1));
  let h = d;
  for (let i = 1; i <= 2000; i++) {
    const i2 = 2 * i;
    let term = (i * (b - i) * x) / ((a + i2 - 1) * (a + i2));
    d = 1 / clamp(1 + term * d);
    c = clamp(1 + term / c);
    h *= d * c;
    term = (-(a + i) * (a + b + i) * x) / ((a + i2) * (a + i2 + 1));
    d = 1 / clamp(1 + term * d);
    c = clamp(1 + term / c);
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return h;
}

/** P(T <= t) for Student's t with df degrees of freedom: 1 - I_(df/(df + t^2))(df/2, 1/2)/2 for t >= 0, and symmetric. */
export function studentCdf(t, df) {
  const tail = 0.5 * betaIncomplete(df / (df + t * t), df / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}

/** The quantile of Student's t: bisection on its distribution function, to the last digit. */
export function studentQuantile(p, df) {
  if (!(p > 0 && p < 1)) return NaN;
  if (p < 0.5) return -studentQuantile(1 - p, df);
  let lo = 0;
  let hi = 1;
  while (studentCdf(hi, df) < p) hi *= 2;
  for (let i = 0; i < 400 && hi - lo > 1e-15 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (studentCdf(mid, df) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The quantile of the chi-square law with df degrees of freedom: bisection on P(X <= x) = 1 - Q(df/2, x/2). */
export function chiSquareQuantile(p, df) {
  if (!(p > 0 && p < 1)) return NaN;
  let lo = 0;
  let hi = df + 10 * Math.sqrt(2 * df) + 10;
  while (1 - chiSquarePValue(hi, df) < p) hi *= 2;
  for (let i = 0; i < 400 && hi - lo > 1e-15 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (1 - chiSquarePValue(mid, df) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Sample moments of a list of numbers, the same way. */
export function sampleMoments(values) {
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
export function goodnessOfFit(counts, probabilities) {
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

/** z-test of a sample mean against mu, with the standard deviation sd of one observation known under H0. */
export function meanTest(mean, mu, sd, m) {
  const z = (mean - mu) / (sd / Math.sqrt(m));
  return finish({ kind: 'mean', mean, expected: mu, z, pValue: twoSidedNormalTail(z) });
}

/**
 * Large-sample test of a sample variance s^2 against sigma^2: under H0 s^2
 * has mean sigma^2 and variance (mu4 - sigma^4 (m - 3)/(m - 1))/m, with mu4
 * the fourth central moment, and it is approximately normal for large m.
 * Unlike the chi-square test of the variance, it does not assume normal data.
 */
export function varianceTest(s2, variance, mu4, m) {
  const se = Math.sqrt((mu4 - (variance * variance * (m - 3)) / (m - 1)) / m);
  const z = (s2 - variance) / se;
  return finish({ kind: 'variance', variance: s2, expected: variance, ratio: s2 / variance, z, pValue: twoSidedNormalTail(z) });
}

/** Jarque-Bera test of normality: JB = m/6 (g1^2 + (b2 - 3)^2/4), about chi-square with 2 degrees of freedom. */
export function jarqueBera({ m, skewness, kurtosis }) {
  const statistic = (m / 6) * (skewness * skewness + (kurtosis - 3) ** 2 / 4);
  return finish({ kind: 'jb', m, skewness, excessKurtosis: kurtosis - 3, statistic, pValue: chiSquarePValue(statistic, 2) });
}

/**
 * Test of the spread of m values (the sampling variances of the hackers)
 * against a variance V. For large m the sample variance v is about normal
 * with variance (mu4 - sigma^4)/m; no formula gives the fourth moment of a
 * sampling variance, so the standard error is estimated from the sample
 * itself, (m4 - m2^2)/m with its central moments m2 and m4 (Wald's test).
 */
export function spreadTest(sample, V) {
  const m2 = (sample.variance * (sample.m - 1)) / sample.m;
  const m4 = sample.kurtosis * m2 * m2;
  const z = (sample.variance - V) / Math.sqrt(Math.max(0, m4 - m2 * m2) / sample.m);
  return finish({ kind: 'variance', variance: sample.variance, expected: V, ratio: sample.variance / V, z, pValue: twoSidedNormalTail(z) });
}

/** z-test of an observed proportion against p0: z = (rate - p0)/sqrt(p0 (1 - p0)/m). */
export function proportionTest(rate, p0, m) {
  const z = (rate - p0) / Math.sqrt((p0 * (1 - p0)) / m);
  return finish({ kind: 'proportion', rate, expected: p0, m, z, pValue: twoSidedNormalTail(z) });
}

/** Test of a correlation r of m pairs against rho with Fisher's transformation: atanh(r) is about normal with variance 1/(m - 3). */
export function correlationTest(r, rho, m) {
  const z = (Math.atanh(r) - Math.atanh(rho)) * Math.sqrt(m - 3);
  return finish({ kind: 'correlation', r, expected: rho, m, z, pValue: twoSidedNormalTail(z) });
}

/**
 * Test that consecutive scores are uncorrelated: with mu and sigma^2 known,
 * the sum of (x_i - mu)(x_(i+1) - mu) over the pairs of every hacker has
 * mean 0 and variance pairs x sigma^4 when the scores are independent (two
 * products sharing a score are uncorrelated), so r = sum/(pairs sigma^2) is
 * about N(0, 1/pairs).
 */
export function lagTest(lagSum, pairs, variance) {
  const r = lagSum / (pairs * variance);
  const z = r * Math.sqrt(pairs);
  return finish({ kind: 'lag', r, pairs, z, pValue: twoSidedNormalTail(z) });
}

/** Pearson's correlation of two lists of numbers with known means. */
export function correlation(xs, ys, mx, my) {
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    sxy += a * b;
    sxx += a * a;
    syy += b * b;
  }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
}

/** Least squares line y = a + b x, with the standard error of the slope. */
export function fitLine(xs, ys) {
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

// ---------------------------------------------------------------------------
// 6. The experiments
// ---------------------------------------------------------------------------

/**
 * One checkpoint: the means and the variances of the m hackers at n, their
 * sample moments across the hackers (the average of the sampling means and
 * of the sampling variances, and their spread), the theory, the correlation
 * between mean and variance, and the share of hackers whose 95% intervals
 * contain mu (Student's t, valid for any law with finite variance as n
 * grows) and sigma^2 (chi-square, exact only for normal scores).
 */
function checkpointFacts(sim, g) {
  const { law, m } = sim;
  const n = sim.grid[g];
  const means = sim.means[g];
  const variances = sim.variances[g];
  const meanStats = sampleMoments(means);
  const varStats = sampleMoments(variances);
  const t = studentQuantile(1 - (1 - CONFIDENCE) / 2, n - 1);
  const low = chiSquareQuantile((1 - CONFIDENCE) / 2, n - 1);
  const high = chiSquareQuantile(1 - (1 - CONFIDENCE) / 2, n - 1);
  let tCovered = 0;
  let chiCovered = 0;
  for (let j = 0; j < m; j++) {
    if (Math.abs(means[j] - law.mu) <= t * Math.sqrt(variances[j] / n)) tCovered++;
    const c = ((n - 1) * variances[j]) / law.variance;
    if (c >= low && c <= high) chiCovered++;
  }
  return {
    n,
    means,
    variances,
    theory: samplingTheory(law, n),
    meanStats,
    varStats,
    biased: (varStats.mean * (n - 1)) / n,
    corr: correlation(means, variances, meanStats.mean, varStats.mean),
    coverage: { t: tCovered / m, chi2: chiCovered / m, tQuantile: t, chiLow: low, chiHigh: high },
  };
}

/** The point of the grid at n, or the nearest below it. */
export function pointAt(points, n) {
  let best = points[0];
  for (const pt of points) if (pt.n <= n) best = pt;
  return best;
}

/** The hypothesis tests of the page, at a small n (SMALL_N) and at the last n. */
function testsOf(s) {
  const { law, m } = s;
  const small = pointAt(s.points, SMALL_N);
  const last = s.points[s.points.length - 1];
  return {
    scores: goodnessOfFit(s.pooled.counts, law.classes),
    lag: lagTest(s.pooled.lagSum, s.pooled.pairs, law.variance),
    meanSmall: meanTest(small.meanStats.mean, law.mu, small.theory.sdMean, m),
    meanLarge: meanTest(last.meanStats.mean, law.mu, last.theory.sdMean, m),
    spreadMean: varianceTest(last.meanStats.variance, last.theory.varMean, last.theory.mu4Mean, m),
    normalSmall: jarqueBera(small.meanStats),
    normalLarge: jarqueBera(last.meanStats),
    varianceSmall: meanTest(small.varStats.mean, law.variance, small.theory.sdVariance, m),
    varianceLarge: meanTest(last.varStats.mean, law.variance, last.theory.sdVariance, m),
    biased: meanTest(small.biased, law.variance, Math.sqrt(small.theory.varBiased), m),
    spreadVariance: spreadTest(last.varStats, last.theory.varVariance),
    normalTheory: spreadTest(small.varStats, small.theory.normalVariance),
    varianceNormal: jarqueBera(last.varStats),
    coverage: proportionTest(last.coverage.t, CONFIDENCE, m),
    correlation: correlationTest(last.corr, last.theory.corr, m),
    independence: correlationTest(last.corr, 0, m),
  };
}

/** Every experiment of the page for one set of parameters, as a generator (see runSteps). */
export function* exploreSteps(options = {}) {
  const params = checkParams(options);
  const started = now();
  const sim = yield* simulateSteps(params);
  const points = [];
  for (let g = 0; g < sim.grid.length; g++) {
    points.push(checkpointFacts(sim, g));
    yield;
  }
  const s = {
    params,
    law: sim.law,
    m: sim.m,
    points,
    pooled: { counts: sim.counts, total: sim.draws, lagSum: sim.lagSum, pairs: sim.pairs },
    draws: sim.draws,
    simMs: sim.ms,
  };
  s.tests = testsOf(s);
  s.ms = now() - started;
  return s;
}

export const explore = (options) => runSteps(exploreSteps(options));
export const exploreAsync = (options, scheduling) => runStepsAsync(() => exploreSteps(options), scheduling);

/** Every hypothesis test of the page, by group: the generator (section 2.1), the averages (2.4), the spread (2.6), inference (2.7). */
export function statisticalTests(s) {
  const T = s.tests;
  return {
    sim: [
      ['scores', T.scores],
      ['lag', T.lag],
    ],
    averages: [
      ['meanSmall', T.meanSmall],
      ['meanLarge', T.meanLarge],
      ['varianceSmall', T.varianceSmall],
      ['varianceLarge', T.varianceLarge],
      ['biased', T.biased],
    ],
    spread: [
      ['spreadMean', T.spreadMean],
      ['spreadVariance', T.spreadVariance],
      ['normalTheory', T.normalTheory],
      ['normalSmall', T.normalSmall],
      ['normalLarge', T.normalLarge],
      ['varianceNormal', T.varianceNormal],
    ],
    inference: [
      ['coverage', T.coverage],
      ['correlation', T.correlation],
      ['independence', T.independence],
    ],
  };
}

/** The hypotheses, as the command line prints them. */
export const TEST_LABELS = Object.freeze({
  sim: {
    scores: 'the pooled scores follow the chosen distribution',
    lag: 'consecutive scores are uncorrelated',
  },
  averages: {
    meanSmall: `the average of the sampling means at n = ${SMALL_N} is mu`,
    meanLarge: 'the average of the sampling means at the last n is mu',
    varianceSmall: `the average of the sampling variances at n = ${SMALL_N} is sigma^2`,
    varianceLarge: 'the average of the sampling variances at the last n is sigma^2',
    biased: `the average of SS/n at n = ${SMALL_N} is sigma^2 (it is not: SS/n is biased)`,
  },
  spread: {
    spreadMean: 'the variance of the sampling means at the last n is sigma^2/n',
    spreadVariance: 'the variance of the sampling variances at the last n is mu4/n - sigma^4 (n - 3)/(n (n - 1))',
    normalTheory: `the variance of the sampling variances at n = ${SMALL_N} is 2 sigma^4/(n - 1), as for normal scores`,
    normalSmall: `the sampling means at n = ${SMALL_N} have the skewness and kurtosis of a normal`,
    normalLarge: 'the sampling means at the last n have the skewness and kurtosis of a normal',
    varianceNormal: 'the sampling variances at the last n have the skewness and kurtosis of a normal',
  },
  inference: {
    coverage: 'at the last n the 95% t interval contains mu for 95% of the hackers',
    correlation: 'at the last n the correlation of mean and variance is Cov/sqrt(Var(M) Var(s^2)), Cov = mu3/n',
    independence: 'at the last n mean and variance are uncorrelated, as for normal scores',
  },
});

// ---------------------------------------------------------------------------
// 7. Charts (browser, <canvas>)
// ---------------------------------------------------------------------------

export const DEFAULT_PALETTE = {
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
export function drawLineChart(canvas, { x, series, logX = false, logY = false, yMin = 0, yMax = 1, yTicks = [], xTicks = [], yFormat = null, decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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
export function drawHistogram(canvas, { x0, x1, bars, expected = null, curve = null, yMax = null, xTicks = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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
export function drawQQ(canvas, { points, lo, hi, ticks = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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
    xTickLabel(ctx, axisLabel(v, decimal), px(v), margin.top + h + 15, width);
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

const SCATTER_ASPECT = 0.62;
const SCATTER_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };

/** Where the plot of drawScatter lies on a canvas of this width. */
function scatterLayout(data, width) {
  const height = Math.round(width * SCATTER_ASPECT);
  const margin = SCATTER_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const px = (v) => margin.left + (w * (v - data.x0)) / (data.x1 - data.x0);
  const py = (v) => margin.top + h * (1 - (v - data.y0) / (data.y1 - data.y0));
  return { margin, w, h, height, px, py };
}

/**
 * Scatter plot of the pairs (xs[i], ys[i]): small translucent squares, so
 * that the colour darkens where many points overlap; a dashed cross at
 * `center` and, through it, a line of slope `slope` (the theoretical
 * regression line), when given.
 */
export function drawScatter(canvas, { xs, ys, x0, x1, y0, y1, xTicks = [], yTicks = [], center = null, slope = null, decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, SCATTER_ASPECT, knownWidth);
  const { margin, w, h, px, py } = scatterLayout({ x0, x1, y0, y1 }, width);
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
    ctx.fillText(axisLabel(v, decimal), margin.left - 4, py(v) + 4);
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
  ctx.fillStyle = pal.series[0];
  ctx.globalAlpha = Math.min(0.6, Math.max(0.06, 12 / Math.sqrt(xs.length)));
  for (let i = 0; i < xs.length; i++) ctx.fillRect(px(xs[i]) - 1.3, py(ys[i]) - 1.3, 2.6, 2.6);
  ctx.globalAlpha = 1;
  if (center) {
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = pal.series[1];
    ctx.beginPath();
    ctx.moveTo(px(center[0]), margin.top);
    ctx.lineTo(px(center[0]), margin.top + h);
    ctx.moveTo(margin.left, py(center[1]));
    ctx.lineTo(margin.left + w, py(center[1]));
    ctx.stroke();
    if (slope !== null) {
      ctx.strokeStyle = pal.series[2];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px(x0), py(center[1] + slope * (x0 - center[0])));
      ctx.lineTo(px(x1), py(center[1] + slope * (x1 - center[0])));
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  ctx.restore();
}

/** The horizontal axis of drawWelfordChart: the steps 1, ..., K with half a step of margin on both sides. */
const welfordAxis = (data) => ({ x: [0.5, data.rows.length + 0.5] });

/**
 * The recurrences of Part 1 on a chart: the data x_1, ..., x_k as dots, the
 * running mean M_1, ..., M_k as a line with the band M_j +- s_j, and at step
 * k the two factors of the increment of SS: delta = x_k - M_(k-1), from the
 * previous mean to the new value (left), and x_k - M_k, from the new mean to
 * the same value (right). `rows` are the steps of welfordSteps().
 */
export function drawWelfordChart(canvas, { rows, k, yMin, yMax, yTicks = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, LINE_ASPECT, knownWidth);
  const { margin, w, h, px } = lineLayout(welfordAxis({ rows }), width);
  const py = (v) => margin.top + h * (1 - (Math.min(yMax, Math.max(yMin, v)) - yMin) / (yMax - yMin));
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
    ctx.fillText(axisLabel(v, decimal), margin.left - 4, py(v) + 4);
  }
  ctx.textAlign = 'center';
  const every = rows.length <= 12 ? 1 : rows.length <= 24 ? 2 : 5;
  for (const r of rows) if (r.k === 1 || r.k % every === 0) ctx.fillText(String(r.k), px(r.k), margin.top + h + 15);
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, w, h);
  ctx.clip();
  const shown = rows.slice(0, k);
  const band = shown.filter((r) => r.k >= 2);
  if (band.length > 1) {
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = pal.series[2];
    ctx.beginPath();
    band.forEach((r, i) => (i ? ctx.lineTo(px(r.k), py(r.mean + Math.sqrt(r.variance))) : ctx.moveTo(px(r.k), py(r.mean + Math.sqrt(r.variance)))));
    for (let i = band.length - 1; i >= 0; i--) ctx.lineTo(px(band[i].k), py(band[i].mean - Math.sqrt(band[i].variance)));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = pal.series[1];
  ctx.lineWidth = 2;
  ctx.beginPath();
  shown.forEach((r, i) => (i ? ctx.lineTo(px(r.k), py(r.mean)) : ctx.moveTo(px(r.k), py(r.mean))));
  ctx.stroke();
  ctx.fillStyle = pal.series[0];
  for (const r of shown) {
    ctx.beginPath();
    ctx.arc(px(r.k), py(r.x), 3.4, 0, 2 * Math.PI);
    ctx.fill();
  }
  const r = rows[k - 1];
  if (r) {
    const X = px(r.k);
    ctx.lineWidth = 3;
    if (r.k >= 2) {
      // the previous mean, and delta from it to the new value
      ctx.strokeStyle = pal.series[1];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px(r.k - 1), py(r.previous));
      ctx.lineTo(X - 6, py(r.previous));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = pal.series[3];
      ctx.beginPath();
      ctx.moveTo(X - 6, py(r.previous));
      ctx.lineTo(X - 6, py(r.x));
      ctx.stroke();
    }
    ctx.strokeStyle = pal.series[4];
    ctx.beginPath();
    ctx.moveTo(X + 6, py(r.mean));
    ctx.lineTo(X + 6, py(r.x));
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = pal.highlight;
    ctx.beginPath();
    ctx.arc(X, py(r.x), 7, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

const INTERVAL_ASPECT = 0.7;
const INTERVAL_MARGIN = { left: 36, right: 12, top: 8, bottom: 24 };

/** Where the plot of drawIntervals lies on a canvas of this width, and the height of a row. */
function intervalLayout(data, width) {
  const height = Math.round(width * INTERVAL_ASPECT);
  const margin = INTERVAL_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const rowH = h / Math.max(1, data.rows.length);
  const px = (v) => margin.left + (w * (v - data.x0)) / (data.x1 - data.x0);
  const py = (i) => margin.top + rowH * (i + 0.5);
  return { margin, w, h, height, rowH, px, py };
}

/**
 * Confidence intervals, one per row: rows [{ lo, hi, est, ok }] as
 * segments, green when they contain the true value and red when they miss
 * it, with a dot at the estimate and a dashed line at the true value
 * (`truth`). A segment that goes beyond the axis ends with an arrow.
 */
export function drawIntervals(canvas, { rows, x0, x1, truth, xTicks = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, INTERVAL_ASPECT, knownWidth);
  const { margin, w, h, rowH, px, py } = intervalLayout({ rows, x0, x1 }, width);
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
  for (const i of [0, Math.floor(rows.length / 2) - 1, rows.length - 1]) if (i >= 0) ctx.fillText(String(i + 1), margin.left - 5, py(i) + 4);
  ctx.strokeRect(margin.left, margin.top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin.left, margin.top, w, h);
  ctx.clip();
  const thick = Math.max(1, Math.min(3, rowH * 0.55));
  rows.forEach((r, i) => {
    const y = py(i);
    const color = r.ok ? pal.series[2] : pal.series[1];
    const a = px(Math.max(r.lo, x0));
    const b = px(Math.min(r.hi, x1));
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.moveTo(a, y);
    ctx.lineTo(b, y);
    ctx.stroke();
    const arrow = (X, dir) => {
      ctx.beginPath();
      ctx.moveTo(X, y);
      ctx.lineTo(X - dir * 5, y - 3);
      ctx.lineTo(X - dir * 5, y + 3);
      ctx.closePath();
      ctx.fill();
    };
    if (r.lo < x0) arrow(px(x0), -1);
    if (r.hi > x1) arrow(px(x1), 1);
    if (r.est >= x0 && r.est <= x1) {
      ctx.beginPath();
      ctx.arc(px(r.est), y, Math.max(1.5, thick), 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  ctx.strokeStyle = pal.text;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(px(truth), margin.top);
  ctx.lineTo(px(truth), margin.top + h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/** The height that a chart function gives a canvas of this width, to reserve the space before drawing. */
export function chartHeight(draw, data, width) {
  if (draw === drawLineChart) return lineLayout(data, width).height;
  if (draw === drawWelfordChart) return lineLayout(welfordAxis(data), width).height;
  if (draw === drawQQ) return qqLayout(data, width).height;
  if (draw === drawScatter) return scatterLayout(data, width).height;
  if (draw === drawIntervals) return intervalLayout(data, width).height;
  return histLayout(data, width).height;
}

/**
 * What lies under the point (x, y) of a chart drawn at this width, in CSS
 * pixels from its top left corner; null outside the plot. For lines, the
 * index of the nearest x; for the steps of Part 1, the nearest step shown;
 * for histograms, the bar; for quantile and scatter plots, the nearest
 * point. `rect` is the rectangle to outline.
 */
export function chartHitTest(draw, data, width, x, y) {
  if (draw === drawLineChart) {
    const { margin, h, w, xs } = lineLayout(data, width);
    if (x < margin.left - 6 || x > margin.left + w + 6 || y < margin.top || y > margin.top + h) return null;
    let index = 0;
    xs.forEach((X, i) => {
      if (Math.abs(X - x) < Math.abs(xs[index] - x)) index = i;
    });
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawWelfordChart) {
    const { margin, h, w, px } = lineLayout(welfordAxis(data), width);
    if (data.k < 1 || x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
    let index = 0;
    for (let i = 1; i < data.k; i++) if (Math.abs(px(i + 1) - x) < Math.abs(px(index + 1) - x)) index = i;
    return { kind: 'point', index, rect: { x: px(index + 1) - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawIntervals) {
    const { margin, w, h, rowH, py } = intervalLayout(data, width);
    if (x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
    const index = Math.min(data.rows.length - 1, Math.max(0, Math.floor((y - margin.top) / rowH)));
    return { kind: 'row', index, rect: { x: margin.left, y: py(index) - Math.max(2, rowH / 2), width: w, height: Math.max(4, rowH) } };
  }
  if (draw === drawScatter) {
    const { margin, w, h, px, py } = scatterLayout(data, width);
    if (x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
    let index = -1;
    let best = 144;
    for (let i = 0; i < data.xs.length; i++) {
      const d = (px(data.xs[i]) - x) ** 2 + (py(data.ys[i]) - y) ** 2;
      if (d < best) {
        best = d;
        index = i;
      }
    }
    if (index < 0) return null;
    return { kind: 'point', index, rect: { x: px(data.xs[index]) - 5, y: py(data.ys[index]) - 5, width: 10, height: 10 } };
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
export const attachChartTooltip = (canvas, { draw, data, describe: explain }) =>
  attachPointerLabel(canvas, (x, y, width) => {
    const hit = chartHitTest(draw, data, width, x, y);
    const text = hit && explain(hit);
    return text ? { rect: hit.rect, text } : null;
  });

/**
 * The same label for any canvas: locate(x, y, width) says what is under
 * the point, as { rect, text }, or null. The animation uses it directly.
 */
export function attachPointerLabel(canvas, locate) {
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
  const hide = () => {
    mark.hidden = true;
    tip.hidden = true;
    shown = null;
    pointer = null;
  };
  const show = (clientX, clientY) => {
    pointer = { clientX, clientY };
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const hit = locate(x, y, r.width);
    if (!hit) {
      mark.hidden = true;
      tip.hidden = true;
      shown = null;
      return;
    }
    const { text } = hit;
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
  const detach = () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerdown', onDocumentDown);
    canvas.classList.remove('has-tip');
    mark.remove();
    tip.remove();
  };
  // a chart that changes under a still pointer (the animation) calls it after every frame
  detach.refresh = () => {
    if (pointer) show(pointer.clientX, pointer.clientY);
  };
  return detach;
}

// ---------------------------------------------------------------------------
// 8. Animation of the running mean and variance (browser, <canvas>)
// ---------------------------------------------------------------------------

const ANIM_ASPECT = 0.6;
const ANIM_MARGIN = { left: 46, right: 10, top: 10, bottom: 24 };
const ANIM_PANEL = 0.2; // share of the plot taken by the histogram on the right
const ANIM_BINS = 36;
const ANIM_SECONDS = 15; // a run, at speed 1

/** The law of the iterated logarithm: a running mean stays within sd sqrt(2 ln ln k / k) of its limit, for k >= 3. */
export const iteratedLogarithm = (k) => (k >= 3 ? Math.sqrt((2 * Math.log(Math.log(k))) / k) : NaN);

/**
 * The centre and the standard deviation of a quantity after k scores: M_k
 * around mu with sigma/sqrt(k), s_k^2 around sigma^2 with sqrt(Var(s_k^2));
 * `unit` is the standard deviation of one term of the running average
 * (sigma for the mean, sqrt(mu4 - sigma^4) for the variance), for the
 * envelope of the iterated logarithm.
 */
export function quantityTheory(law, quantity, k) {
  if (quantity === 'mean') return { mean: law.mu, sd: law.sigma / Math.sqrt(k), unit: law.sigma };
  return { mean: law.variance, sd: k >= 2 ? samplingTheory(law, k).sdVariance : NaN, unit: Math.sqrt(Math.max(0, law.mu4 - law.variance ** 2)) };
}

/**
 * The running mean M_k or variance s_k^2 of the hackers, score after score,
 * computed with the three lines of Part 1: on the left the first `shown`
 * hackers (the first in another colour) with the band centre +- 2 standard
 * deviations and the envelope of the law of the iterated logarithm, on the
 * right the histogram of the current values of `sample` hackers with the
 * normal law of the same mean and standard deviation. The hackers are those
 * of the simulation (same seed, same streams). It opens on the last score;
 * play() starts again from the first. Returns the controls.
 */
export function createScoreAnimation(canvas, options) {
  const { dist = DEFAULT_DIST, p = DEFAULT_P, n = DEFAULT_N, seed = DEFAULT_SEED, onUpdate = () => {} } = options;
  const law = scoreLaw(dist, p);
  const A = Math.max(1, Math.min(options.sample || 500, options.m || Infinity));
  const D = Math.min(options.shown || 50, A);
  let quantity = QUANTITIES.includes(options.quantity) ? options.quantity : 'mean';
  let speed = options.speed || 1;
  let decimal = options.decimal || '.';
  let palette = { ...DEFAULT_PALETTE, ...(options.palette || {}) };

  // the drawn trajectories, whole, and the extremes of both quantities over all hackers and scores (fixed axes)
  const paths = { mean: Array.from({ length: D }, () => new Float32Array(n + 1)), variance: Array.from({ length: D }, () => new Float32Array(n + 1)) };
  const extremes = { mean: [Infinity, -Infinity], variance: [Infinity, -Infinity] };
  const currentMean = new Float64Array(A);
  const currentSS = new Float64Array(A);
  for (let j = 0; j < A; j++) {
    const draw = hackerScores(seed, law, j);
    let mean = 0;
    let ss = 0;
    for (let k = 1; k <= n; k++) {
      const x = draw();
      const delta = x - mean;
      mean += delta / k;
      ss += delta * (x - mean);
      if (mean < extremes.mean[0]) extremes.mean[0] = mean;
      if (mean > extremes.mean[1]) extremes.mean[1] = mean;
      const v = k > 1 ? ss / (k - 1) : NaN;
      if (k > 1) {
        if (v < extremes.variance[0]) extremes.variance[0] = v;
        if (v > extremes.variance[1]) extremes.variance[1] = v;
      }
      if (j < D) {
        paths.mean[j][k] = mean;
        paths.variance[j][k] = v;
      }
    }
    currentMean[j] = mean;
    currentSS[j] = ss;
  }
  const ranges = {};
  for (const q of QUANTITIES) {
    const end = quantityTheory(law, q, n);
    const a = Math.min(extremes[q][0], end.mean - 2.5 * end.sd);
    const b = Math.max(extremes[q][1], end.mean + 2.5 * end.sd);
    const pad = (b - a) * 0.04 || 1;
    ranges[q] = [q === 'variance' ? Math.max(-pad, a - pad) : a - pad, b + pad];
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

  const firstStep = () => (quantity === 'mean' ? 1 : 2);
  const value = (j) => (quantity === 'mean' ? currentMean[j] : k > 1 ? currentSS[j] / (k - 1) : NaN);

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
    const first = Math.max(firstStep(), from);
    const stride = Math.max(1, Math.floor((to - first) / (2 * G.plotW)));
    for (let j = D - 1; j >= 0; j--) {
      const path = paths[quantity][j];
      ctx.strokeStyle = j === 0 ? palette.highlight : palette.series[0];
      ctx.globalAlpha = j === 0 ? 1 : 0.32;
      ctx.lineWidth = j === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(G.px(first), G.py(path[first]));
      for (let s = first + stride; s < to; s += stride) ctx.lineTo(G.px(s), G.py(path[s]));
      ctx.lineTo(G.px(to), G.py(path[to]));
      ctx.stroke();
    }
    ctx.restore();
  };

  // the band centre +- 2 sd and the envelope of the iterated logarithm, over all n
  const curve = (at) => {
    const out = [];
    const steps = Math.min(n, 400);
    for (let i = 0; i <= steps; i++) {
      const step = Math.max(firstStep(), Math.round((i * n) / steps));
      const point = at(step);
      if (point !== null) out.push([step, point]);
    }
    return out;
  };
  const band = (sign, width) => curve((step) => {
    const q = quantityTheory(law, quantity, step);
    return q.mean + sign * width * q.sd;
  });
  const envelope = (sign) => curve((step) => {
    if (step < 3) return null;
    const q = quantityTheory(law, quantity, step);
    return q.mean + sign * q.unit * iteratedLogarithm(step);
  });

  const status = () => {
    const ready = k >= firstStep();
    let sum = 0;
    let sum2 = 0;
    for (let j = 0; j < A && ready; j++) {
      const v = value(j);
      sum += v;
      sum2 += v * v;
    }
    const mean = ready ? sum / A : NaN;
    const theory = ready ? quantityTheory(law, quantity, k) : { mean: NaN, sd: NaN };
    let outside = 0;
    if (ready) for (let j = 0; j < A; j++) if (Math.abs(value(j) - theory.mean) > 2 * theory.sd) outside++;
    return {
      k,
      n,
      playing,
      done: k >= n,
      quantity,
      sample: A,
      shown: D,
      ready,
      mean,
      sd: ready && A > 1 ? Math.sqrt(Math.max(0, (sum2 - A * mean * mean) / (A - 1))) : NaN,
      theoryMean: theory.mean,
      theorySd: theory.sd,
      outside: ready ? outside / A : NaN,
      first: ready ? paths[quantity][0][k] : NaN,
    };
  };

  // what is under the pointer: a bar of the histogram, or a score of the trajectories
  let histogram = null;
  let describe = options.describe || null;
  let detachLabel = null;

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
      drawnK = firstStep();
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
    histogram = null;
    if (k >= firstStep()) {
      const binH = (G.y1 - G.y0) / ANIM_BINS;
      const counts = new Array(ANIM_BINS).fill(0);
      for (let j = 0; j < A; j++) {
        const b = Math.floor((value(j) - G.y0) / binH);
        if (b >= 0 && b < ANIM_BINS) counts[b]++;
      }
      const theory = quantityTheory(law, quantity, k);
      const expected = counts.map((_, b) => A * (normalCdf((G.y0 + (b + 1) * binH - theory.mean) / theory.sd) - normalCdf((G.y0 + b * binH - theory.mean) / theory.sd)));
      const top = Math.max(1, ...counts, ...expected);
      histogram = { binH, counts, expected };
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
    // the label under a still pointer follows the frames
    if (detachLabel) detachLabel.refresh();
  };

  const locate = (x, y) => {
    const G = geometry;
    const m = ANIM_MARGIN;
    if (!G || !describe || y < m.top || y > m.top + G.h) return null;
    if (x >= G.panelX && x <= G.panelX + G.panelW) {
      if (!histogram) return null;
      const v = G.y0 + ((m.top + G.h - y) / G.h) * (G.y1 - G.y0);
      const b = Math.floor((v - G.y0) / histogram.binH);
      if (b < 0 || b >= histogram.counts.length) return null;
      const from = G.y0 + b * histogram.binH;
      const yTop = G.py(from + histogram.binH);
      const text = describe({ kind: 'bin', quantity, k, from, to: from + histogram.binH, count: histogram.counts[b], expected: histogram.expected[b], sample: A });
      return text ? { rect: { x: G.panelX, y: yTop, width: G.panelW, height: G.py(from) - yTop }, text } : null;
    }
    if (x < m.left || x > m.left + G.plotW || k < firstStep()) return null;
    const step = Math.max(firstStep(), Math.min(k, Math.round(((x - m.left) / G.plotW) * n)));
    const theory = quantityTheory(law, quantity, step);
    const text = describe({ kind: 'step', quantity, step, first: paths[quantity][0][step], mean: theory.mean, sd: theory.sd });
    return text ? { rect: { x: G.px(step) - 3, y: m.top, width: 6, height: G.h }, text } : null;
  };
  detachLabel = typeof document !== 'undefined' && canvas.parentElement ? attachPointerLabel(canvas, locate) : null;

  const advance = (target) => {
    if (!generators) generators = Array.from({ length: A }, (_, j) => hackerScores(seed, law, j));
    while (k < target) {
      k++;
      for (let j = 0; j < A; j++) {
        const x = generators[j]();
        const delta = x - currentMean[j];
        currentMean[j] += delta / k;
        currentSS[j] += delta * (x - currentMean[j]);
      }
    }
  };

  const restart = () => {
    k = 0;
    currentMean.fill(0);
    currentSS.fill(0);
    generators = null;
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
      if (k >= n) restart();
      advance(Math.max(k + 1, firstStep()));
      render();
    },
    reset() {
      playing = false;
      cancelAnimationFrame(frame);
      restart();
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
    setDescribe(fn) {
      describe = fn;
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
      if (detachLabel) detachLabel();
    },
  };
  render();
  return controls;
}

// ---------------------------------------------------------------------------
// 8b. Welford to drag (browser, <canvas>)
// ---------------------------------------------------------------------------

const DRAG_ASPECT = 0.62;
const DRAG_RADIUS = 7;

/**
 * The recurrences of Part 1 under the fingers. The data are points on a line
 * from lo to hi, which can be dragged with the mouse or a finger; the last
 * one is the new value x_k. Every move recomputes M_(k-1), M_k, the two
 * deviations delta = x_k - M_(k-1) and x_k - M_k and the increment of SS,
 * and draws: on the line the two means (the old one dashed) and the two
 * deviations as arrows; below on the left the rectangle delta x (x_k - M_k),
 * that is the square delta x delta without a strip 1/k of it; on the right
 * SS_(k-1) plus the increment against SS_k computed directly, two bars of
 * the same length. onChange(stats) follows every change. Returns the
 * controls.
 */
export function createWelfordDrag(canvas, options = {}) {
  const lo = options.lo ?? 0;
  const hi = options.hi ?? SCORE_MAX;
  // `initial`: the data that reset() restores; `values`: those to start from (the same, unless the page is drawn again)
  const initial = (options.initial || options.values || DEFAULT_DATA).map(Number);
  let values = (options.values || initial).map(Number);
  let palette = { ...DEFAULT_PALETTE, ...(options.palette || {}) };
  let decimal = options.decimal || '.';
  const onChange = options.onChange || (() => {});
  let dragging = -1;
  let positions = [];
  let geometry = null;

  const clamp = (v) => Math.min(hi, Math.max(lo, Math.round(v * 10) / 10));
  const fmt = (v, digits = 2) => {
    const t = Number(v.toFixed(digits));
    return decimal === '.' ? String(t) : String(t).replace('.', decimal);
  };

  const stats = () => {
    const k = values.length;
    const before = welford(values.slice(0, k - 1));
    const all = welford(values);
    const x = values[k - 1];
    const delta = x - before.mean;
    const after = x - all.mean;
    let direct = 0;
    for (const v of values) direct += (v - all.mean) * (v - all.mean);
    return { k, x, values: [...values], previousMean: before.mean, mean: all.mean, delta, after, increment: delta * after, previousSS: before.ss, ss: all.ss, direct, variance: all.variance };
  };

  const layout = () => {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const width = canvas.clientWidth || 640;
    // on a phone the rectangle and the bars do not fit side by side: a taller canvas, the bars below
    const narrow = width < 520;
    const height = Math.round(width * (narrow ? 1.15 : DRAG_ASPECT));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;
    const left = 26;
    const right = width - 26;
    return {
      dpr,
      width,
      height,
      left,
      right,
      narrow,
      lineY: Math.round(height * (narrow ? 0.24 : 0.34)),
      lowerTop: Math.round(height * (narrow ? 0.46 : 0.56)),
      px: (v) => left + ((v - lo) / (hi - lo)) * (right - left),
      value: (X) => lo + ((X - left) / (right - left)) * (hi - lo),
    };
  };

  const arrow = (ctx, x0, x1, y, color, label) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    if (Math.abs(x1 - x0) > 6) {
      const dir = Math.sign(x1 - x0);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x1 - dir * 8, y - 5);
      ctx.lineTo(x1 - dir * 8, y + 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    const mid = Math.min(geometry.right - 40, Math.max(geometry.left + 40, (x0 + x1) / 2));
    ctx.fillText(label, mid, y - 6);
  };

  const render = () => {
    if (!geometry) geometry = layout();
    const G = geometry;
    const S = stats();
    const ctx = canvas.getContext('2d');
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, G.width, G.height);
    ctx.font = '11px sans-serif';
    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.text;
    ctx.fillStyle = palette.text;

    // the line and its ticks
    ctx.beginPath();
    ctx.moveTo(G.left, G.lineY);
    ctx.lineTo(G.right, G.lineY);
    ctx.stroke();
    ctx.textAlign = 'center';
    for (let v = Math.ceil(lo); v <= hi; v++) {
      ctx.beginPath();
      ctx.moveTo(G.px(v), G.lineY - 3);
      ctx.lineTo(G.px(v), G.lineY + 3);
      ctx.stroke();
      ctx.fillText(String(v), G.px(v), G.lineY + 15);
    }

    // the two means: the old one dashed, the new one solid
    const top = 14;
    const bottom = G.lineY + 58;
    ctx.strokeStyle = palette.series[1];
    ctx.fillStyle = palette.series[1];
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(G.px(S.previousMean), top);
    ctx.lineTo(G.px(S.previousMean), bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(G.px(S.mean), top);
    ctx.lineTo(G.px(S.mean), bottom);
    ctx.stroke();
    ctx.font = '11px sans-serif';
    const leftFirst = S.previousMean <= S.mean;
    ctx.textAlign = leftFirst ? 'right' : 'left';
    ctx.fillText(`M_${S.k - 1} = ${fmt(S.previousMean)}`, G.px(S.previousMean) + (leftFirst ? -4 : 4), top + 2);
    ctx.textAlign = leftFirst ? 'left' : 'right';
    ctx.fillText(`M_${S.k} = ${fmt(S.mean)}`, G.px(S.mean) + (leftFirst ? 4 : -4), top + 2);

    // the two deviations of the new value
    arrow(ctx, G.px(S.previousMean), G.px(S.x), G.lineY + 34, palette.series[3], `δ = ${fmt(S.delta)}`);
    arrow(ctx, G.px(S.mean), G.px(S.x), G.lineY + 56, palette.series[4], `x_${S.k} - M_${S.k} = ${fmt(S.after)}`);

    // the points, stacked when they overlap
    positions = [];
    values.forEach((v, i) => {
      const X = G.px(v);
      let level = 0;
      for (const q of positions) if (Math.abs(q.x - X) < 2 * DRAG_RADIUS + 1) level = Math.max(level, q.level + 1);
      positions.push({ i, x: X, y: G.lineY - DRAG_RADIUS - 3 - level * (2 * DRAG_RADIUS + 2), level });
    });
    for (const q of positions) {
      const isNew = q.i === values.length - 1;
      ctx.fillStyle = isNew ? palette.highlight : palette.series[0];
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.i === dragging ? DRAG_RADIUS + 2 : DRAG_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = palette.background;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // below on the left: the rectangle delta x (x_k - M_k), the square delta x delta without a strip of 1/k
    const lowerH = G.height - G.lowerTop - 10;
    const side = G.narrow ? Math.max(30, Math.min(G.width * 0.32, lowerH * 0.36)) : Math.max(30, Math.min(lowerH - 30, G.width / 2 - 90));
    const bx = G.left + (G.narrow ? 50 : 70);
    const by = G.lowerTop + 18;
    const kept = side * ((S.k - 1) / S.k);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = palette.text;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, side, side);
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = palette.series[3];
    ctx.fillRect(bx, by + side - kept, side, kept);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.series[4];
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by + side - kept, side, kept);
    ctx.fillStyle = palette.series[3];
    ctx.fillRect(bx, by - 4, side, 4);
    ctx.fillStyle = palette.series[4];
    ctx.fillRect(bx - 4, by + side - kept, 4, kept);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.fillText(`|δ| = ${fmt(Math.abs(S.delta))}`, bx + side / 2, by - 8);
    ctx.textAlign = 'right';
    ctx.fillText(`${fmt(Math.abs(S.after))}`, bx - 8, by + side - kept / 2 + 4);
    ctx.textAlign = 'center';
    ctx.fillText(fmt(S.increment), bx + side / 2, by + side - kept / 2 + 4);
    ctx.font = '11px sans-serif';
    ctx.fillText(`1/${S.k}`, bx + side / 2, by + Math.max(9, (side - kept) / 2 + 4));

    // below on the right: SS_(k-1) + increment against SS_k computed directly
    const barX = G.narrow ? G.left : G.width / 2 + 10;
    const barW = G.right - barX;
    const maxSS = Math.max(S.previousSS + S.increment, S.direct, 1e-9);
    const scale = (v) => (barW * 0.92 * v) / maxSS;
    const row = (y, parts, label, total) => {
      ctx.fillStyle = palette.text;
      ctx.textAlign = 'left';
      ctx.font = '11px sans-serif';
      ctx.fillText(label, barX, y - 5);
      let X = barX;
      for (const [v, color] of parts) {
        ctx.fillStyle = color;
        ctx.fillRect(X, y, Math.max(0, scale(v)), 14);
        X += Math.max(0, scale(v));
      }
      ctx.fillStyle = palette.text;
      ctx.textAlign = X > G.right - 40 ? 'right' : 'left';
      ctx.fillText(fmt(total), X > G.right - 40 ? X - 4 : X + 4, y + 11);
    };
    const y1 = G.narrow ? by + side + 28 : G.lowerTop + Math.round(lowerH * 0.32);
    const y2 = G.narrow ? y1 + 40 : G.lowerTop + Math.round(lowerH * 0.72);
    row(y1, [[S.previousSS, palette.series[0]], [S.increment, palette.series[3]]], `SS_${S.k - 1} + δ (x_${S.k} - M_${S.k})`, S.previousSS + S.increment);
    row(y2, [[S.direct, palette.series[2]]], `Σ (x_i - M_${S.k})² = SS_${S.k}`, S.direct);
  };

  const locate = (x, y) => {
    let best = -1;
    let dist = (DRAG_RADIUS + 8) ** 2;
    for (const q of positions) {
      const d = (q.x - x) ** 2 + (q.y - y) ** 2;
      if (d <= dist) {
        dist = d;
        best = q.i;
      }
    }
    return best;
  };
  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const changed = () => {
    render();
    onChange(stats());
  };
  const onDown = (e) => {
    const [x, y] = point(e);
    const i = locate(x, y);
    if (i < 0) return;
    dragging = i;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    render();
  };
  const onMove = (e) => {
    const [x, y] = point(e);
    if (dragging < 0) {
      canvas.style.cursor = locate(x, y) >= 0 ? 'grab' : 'default';
      return;
    }
    canvas.style.cursor = 'grabbing';
    const v = clamp(geometry.value(x));
    if (values[dragging] !== v) {
      values = values.slice();
      values[dragging] = v;
      changed();
    }
  };
  const onUp = () => {
    if (dragging < 0) return;
    dragging = -1;
    render();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  const controls = {
    stats,
    setValue(i, v) {
      if (i < 0 || i >= values.length) return;
      values = values.slice();
      values[i] = clamp(v);
      changed();
    },
    add(v) {
      if (values.length >= DATA_MAX) return;
      values = [...values, clamp(v)];
      changed();
    },
    removeLast() {
      if (values.length <= 2) return;
      values = values.slice(0, -1);
      changed();
    },
    reset() {
      values = [...initial];
      changed();
    },
    setPalette(next) {
      palette = { ...DEFAULT_PALETTE, ...next };
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
    destroy() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    },
  };
  render();
  onChange(stats());
  return controls;
}

// ---------------------------------------------------------------------------
// 9. Checks, printed report and command line
// ---------------------------------------------------------------------------

/**
 * Known values the implementation must reproduce: Python's statistics
 * module (exact fractions) and NumPy on the recurrences of Part 1, the
 * outputs of the reference C code of xoshiro128** and SplitMix64
 * (prng.di.unimi.it, compiled with gcc) and of the same C program for the
 * scores of hacker 1, and values of the distributions, of the special
 * functions and of the exact moments computed with SciPy 1.17.1 and with
 * Python fractions (by enumerating every sample of 3 scores).
 */
export const CHECK_VECTORS = Object.freeze([
  { group: 'welford', name: 'Welford on 2 4 4 4 5 5 7 9: the variance (Python statistics.variance)', expected: 4.571428571428571, compute: () => welford([2, 4, 4, 4, 5, 5, 7, 9]).variance },
  { group: 'welford', name: 'Welford on 2 4 4 4 5 5 7 9: the mean', expected: 5, compute: () => welford([2, 4, 4, 4, 5, 5, 7, 9]).mean },
  { group: 'welford', name: 'The recurrence of the variance (section 1.3) on the same data', expected: 4.571428571428571, compute: () => welfordSteps([2, 4, 4, 4, 5, 5, 7, 9]).at(-1).recursive },
  { group: 'welford', name: 'Welford on 10^9 + 4, 7, 13, 16: the variance', expected: 30, compute: () => cancellationRows()[3].welford },
  { group: 'welford', name: 'The textbook formula on 10^8 + 4, 7, 13, 16 (Python, plain sums)', expected: 29.333333333333332, compute: () => cancellationRows()[2].naive },
  { group: 'welford', name: 'The textbook formula on 10^9 + 4, 7, 13, 16 (Python, plain sums)', expected: -170.66666666666666, compute: () => cancellationRows()[3].naive },
  { group: 'welford', name: 'Welford on the 10000 scores of hacker 1: the variance (Python, exact fractions)', expected: 7.7867300330033, compute: () => welford(firstScores(10000)).variance },
  { group: 'welford', name: 'The same with NumPy, var(ddof=1)', expected: 7.786730033003301, compute: () => welford(firstScores(10000)).variance },
  { group: 'welford', name: 'Welford on the 10000 scores of hacker 1: the mean', expected: 3.2192, compute: () => welford(firstScores(10000)).mean },
  { group: 'welford', name: 'Welford on the first 10 scores of hacker 1: the variance (Python)', expected: 4.455555555555556, compute: () => welford(firstScores(10)).variance },
  { group: 'generator', name: 'xoshiro128** from (1, 2, 3, 4)', expected: '11520 0 5927040 70819200 2031721883 1637235492', compute: () => { const g = xoshiro128ss(1, 2, 3, 4); return Array.from({ length: 6 }, g).join(' '); } },
  { group: 'generator', name: 'SplitMix64 from 0', expected: '16294208416658607535 7960286522194355700 487617019471545679', compute: () => { const g = splitMix64(0); return Array.from({ length: 3 }, g).join(' '); } },
  { group: 'generator', name: 'Hacker 1, outcome stream (attacker 1 of Homework #3), seed 2026', expected: '1441997221 504457382 1212262897 368519188', compute: () => { const g = hackerGenerator(2026, 'outcome', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Hacker 1, score stream, seed 2026', expected: '2642532066 1102174774 4176861233 298201834', compute: () => { const g = hackerGenerator(2026, 'score', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Hacker 1, first 10 scores: outcome of Homework #3 + score, p = 0.2', expected: '3 7 4 6 4 3 1 3 2 0', compute: () => firstScores(10).join(' ') },
  { group: 'generator', name: 'Hacker 1, first 10 scores: Bin(10, 0.3)', expected: '3 2 6 1 5 4 2 4 3 0', compute: () => firstScores(10, 'binomial').join(' ') },
  { group: 'generator', name: 'Hacker 1, first 10 scores: uniform on 0..10', expected: '6 2 10 0 10 8 2 7 5 0', compute: () => firstScores(10, 'uniform').join(' ') },
  { group: 'generator', name: 'Hacker 1, first 4 scores: 10 Beta(2, 5)', expected: '2.974107153634434 4.161627672677751 0.5694933356535781 2.753906247288207', compute: () => firstScores(4, 'beta').join(' ') },
  { group: 'generator', name: 'Hacker 1, 10000 scores: successes, sum, sum of squares', expected: '2038 32192 181492', compute: () => { const x = firstScores(10000); return [x.filter((v) => v >= 6).length, x.reduce((a, v) => a + v, 0), x.reduce((a, v) => a + v * v, 0)].join(' '); } },
  { group: 'functions', name: 'Outcome law, p = 0.2: mu4', expected: 183.7472, compute: () => scoreLaw('outcome', 0.2).mu4 },
  { group: 'functions', name: 'Outcome law, p = 0.2: mu6', expected: 6296.84288, compute: () => scoreLaw('outcome', 0.2).mu6 },
  { group: 'functions', name: 'Outcome law: Var(s^2) at n = 3 (enumeration of all samples)', expected: 61.249066666666664, compute: () => samplingTheory(scoreLaw('outcome', 0.2), 3).varVariance },
  { group: 'functions', name: 'Outcome law: Cov(M, s^2) at n = 3 (enumeration)', expected: 6.912, compute: () => samplingTheory(scoreLaw('outcome', 0.2), 3).cov },
  { group: 'functions', name: 'Bin(10, 0.3): Var(s^2) at n = 2 (enumeration)', expected: 8.547, compute: () => samplingTheory(scoreLaw('binomial'), 2).varVariance },
  { group: 'functions', name: '10 Beta(2, 5): mu4', expected: 18.74219075385256, compute: () => scoreLaw('beta').mu4 },
  { group: 'functions', name: 'Beta(2, 5): P(Y <= 0.3)', expected: 0.5798250000000003, compute: () => betaCdf(0.3) },
  { group: 'functions', name: 'Student t, 1 df: quantile 0.975', expected: 12.706204736174694, compute: () => studentQuantile(0.975, 1) },
  { group: 'functions', name: 'Student t, 9 df: quantile 0.975', expected: 2.262157162798205, compute: () => studentQuantile(0.975, 9) },
  { group: 'functions', name: 'Student t, 9999 df: quantile 0.975', expected: 1.960201263621357, compute: () => studentQuantile(0.975, 9999) },
  { group: 'functions', name: 'Student t, 5 df: P(T <= 2)', expected: 0.9490302605850708, compute: () => studentCdf(2, 5) },
  { group: 'functions', name: 'Student t, 2 df: P(T <= -3)', expected: 0.04773298313335456, compute: () => studentCdf(-3, 2) },
  { group: 'functions', name: 'Chi-square, 9 df: quantile 0.025', expected: 2.7003894999803584, compute: () => chiSquareQuantile(0.025, 9) },
  { group: 'functions', name: 'Chi-square, 9 df: quantile 0.975', expected: 19.02276779864163, compute: () => chiSquareQuantile(0.975, 9) },
  { group: 'functions', name: 'Chi-square, 9999 df: quantile 0.025', expected: 9723.73223701499, compute: () => chiSquareQuantile(0.025, 9999) },
  { group: 'functions', name: 'Phi(1.959963984540054)', expected: 0.975, compute: () => normalCdf(1.959963984540054) },
  { group: 'functions', name: 'Jarque-Bera on 0 1 1 2 2 2 3 3 4 7', expected: 2.4442510806731916, compute: () => jarqueBera(sampleMoments([0, 1, 1, 2, 2, 2, 3, 3, 4, 7])).statistic },
]);

/** The first `count` scores of hacker 1 (j = 0) with seed 2026, for the checks. */
function firstScores(count, dist = DEFAULT_DIST) {
  const draw = hackerScores(DEFAULT_SEED, scoreLaw(dist, DEFAULT_P), 0);
  return Array.from({ length: count }, draw);
}

/** Every check, with what was expected and what came out: equal strings, or numbers within a relative error of 10^-9. */
export function verifyAll() {
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
const small = (v) => (v === 0 ? '0' : Math.abs(v) < 1e-3 ? v.toExponential(2) : v.toFixed(5));

/** The names of the distributions, as the command line prints them. */
const LAW_NAMES = Object.freeze({
  outcome: 'outcome of Homework #3 + score: failure -> uniform on 0..4, success -> uniform on 6..10',
  binomial: `Bin(${BINOMIAL.trials}, ${BINOMIAL.q})`,
  uniform: 'uniform on the integers 0..10',
  beta: `10 Beta(${BETA.a}, ${BETA.b}), continuous`,
});

/** A histogram in text: one row per bin of the standardized sampling means, the simulated share as #, the normal one as |. */
function textHistogram(pt, print) {
  const bins = [];
  for (let x = -3.5; x < 3.5 - 1e-9; x += 0.5) bins.push([x, x + 0.5]);
  const shares = bins.map(() => 0);
  for (const v of pt.means) {
    const z = (v - pt.theory.mean) / pt.theory.sdMean;
    const b = Math.floor((z + 3.5) / 0.5);
    if (b >= 0 && b < bins.length) shares[b]++;
  }
  const total = pt.means.length;
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
 * Command line: node homework4.js [--dist outcome|binomial|uniform|beta]
 * [--p 0.2] [--n 10000] [--m 5000] [--seed 2026 | --random-seed]
 * [--data "2 4 4 4 5 5 7 9"]. Options are checked strictly: anything
 * unknown or malformed prints the usage.
 */
export function runCli(argv, print = console.log) {
  const usage = () => {
    print('usage: node homework4.js [--dist outcome|binomial|uniform|beta] [--p 0.2] [--n 10000] [--m 5000] [--seed 2026 | --random-seed] [--data "2 4 4 4 5 5 7 9"]');
    print(`       p from ${LIMITS.p[0]} to ${LIMITS.p[1]} (outcome law only); n (systems) and m (hackers) from ${LIMITS.n[0]} to ${LIMITS.n[1]}; seed from 0 to ${LIMITS.seed[1]};`);
    print(`       data: from 2 to ${DATA_MAX} numbers for Part 1, separated by spaces or semicolons.`);
    return 1;
  };
  const options = { dist: DEFAULT_DIST, p: DEFAULT_P, n: DEFAULT_N, m: DEFAULT_M, seed: DEFAULT_SEED };
  let data = [...DEFAULT_DATA];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--random-seed') options.seed = randomSeed();
    else if (arg === '--dist' && DISTRIBUTIONS.includes(value)) {
      options.dist = value;
      i++;
    } else if (arg === '--p' && value !== undefined && parseProbability(value).ok) {
      options.p = parseProbability(value).value;
      i++;
    } else if ((arg === '--n' || arg === '--m') && value !== undefined && parseInteger(value, LIMITS[arg.slice(2)]).ok) {
      options[arg.slice(2)] = parseInteger(value, LIMITS[arg.slice(2)]).value;
      i++;
    } else if (arg === '--seed' && value !== undefined && parseInteger(value, LIMITS.seed).ok) {
      options.seed = parseInteger(value, LIMITS.seed).value;
      i++;
    } else if (arg === '--data' && value !== undefined && parseData(value).ok) {
      data = parseData(value).value;
      i++;
    } else {
      return usage();
    }
  }
  const checks = verifyAll();
  const failed = checks.filter((r) => !r.ok);
  print(`Checks: ${checks.length - failed.length} of ${checks.length} passed (the recurrences against Python's statistics module and NumPy, xoshiro128** and SplitMix64 against their reference C code, laws and special functions against SciPy 1.17.1 and Python fractions).`);
  failed.forEach((r) => print(`  FAILED ${r.name}: expected ${r.expected}, got ${r.actual}`));
  print('');

  print('PART 1 - Welford\'s recurrence formulas. The core, three lines:');
  WELFORD_LINES.forEach((line) => print(`  ${line}`));
  print('');
  print(`Step by step on ${data.join(' ')}:`);
  print(`  ${pad('k', 3)}  ${'x_k'.padStart(12)}  ${'delta'.padStart(12)}  ${'M_k'.padStart(12)}  ${'x_k - M_k'.padStart(12)}  ${'SS_k'.padStart(14)}  ${'s_k^2'.padStart(14)}`);
  for (const r of welfordSteps(data)) {
    print(`  ${pad(r.k, 3)}  ${pad(r.x, 12)}  ${pad(Number(r.delta.toPrecision(10)), 12)}  ${pad(Number(r.mean.toPrecision(10)), 12)}  ${pad(Number(r.after.toPrecision(10)), 12)}  ${pad(Number(r.ss.toPrecision(12)), 14)}  ${r.k > 1 ? pad(Number(r.variance.toPrecision(12)), 14) : pad('-', 14)}`);
  }
  print('');
  print('The cancellation of the textbook formula, on 4, 7, 13, 16 + c (the variance is always 30):');
  print(`  ${'c'.padStart(14)}  ${'textbook'.padStart(20)}  ${'two passes'.padStart(20)}  ${'Welford'.padStart(20)}`);
  for (const r of cancellationRows()) print(`  ${pad(r.offset, 14)}  ${pad(r.naive, 20)}  ${pad(r.twoPass, 20)}  ${pad(r.welford, 20)}`);
  const curve = stabilityCurve();
  print(`Relative error on the first ${curve.size} scores of hacker 1 + c (exact variance ${curve.exact}):`);
  print(`  ${'c'.padStart(6)}  ${'textbook'.padStart(10)}  ${'two passes'.padStart(10)}  ${'Welford'.padStart(10)}`);
  for (const r of curve.rows) print(`  ${`1e${r.power}`.padStart(6)}  ${r.errors.naive.toExponential(1).padStart(10)}  ${r.errors.twoPass.toExponential(1).padStart(10)}  ${r.errors.welford.toExponential(1).padStart(10)}`);
  print('');

  const { n, m, seed } = options;
  const s = explore(options);
  const L = s.law;
  print(`PART 2 - Sampling mean and variance. ${m} hackers on ${n} systems, seed ${seed}.`);
  print(`  Scores: ${LAW_NAMES[L.dist]}${L.dist === 'outcome' ? `, p = ${L.p}` : ''}`);
  print(`  mu = ${fixed(L.mu, 6)}, sigma^2 = ${fixed(L.variance, 6)}, skewness ${fixed(L.skewness, 4)}, excess kurtosis ${fixed(L.kurtosis, 4)}, mu3 = ${fixed(L.mu3, 4)}, mu4 = ${fixed(L.mu4, 4)}`);
  print(`  ${s.draws.toExponential(2)} scores simulated in ${seconds(s.simMs)}`);
  print('');
  print('Averages across the hackers [theory]:');
  print(`  ${pad('n', 6)}  ${'mean of M_n'.padEnd(22)} ${'mean of s_n^2'.padEnd(22)} ${'mean of SS_n/n'.padEnd(26)}`);
  for (const pt of s.points) print(`  ${pad(pt.n, 6)}  ${`${fixed(pt.meanStats.mean, 4)} [${fixed(L.mu, 4)}]`.padEnd(22)} ${`${fixed(pt.varStats.mean, 4)} [${fixed(L.variance, 4)}]`.padEnd(22)} ${`${fixed(pt.biased, 4)} [${fixed(pt.theory.biased, 4)}]`.padEnd(26)}`);
  print('');
  print('Variability across the hackers [theory]; Var(s^2) of normal scores in ():');
  print(`  ${pad('n', 6)}  ${'Var(M_n)'.padEnd(28)} ${'Var(s_n^2)'.padEnd(40)} corr(M_n, s_n^2)`);
  for (const pt of s.points) print(`  ${pad(pt.n, 6)}  ${`${small(pt.meanStats.variance)} [${small(pt.theory.varMean)}]`.padEnd(28)} ${`${small(pt.varStats.variance)} [${small(pt.theory.varVariance)}] (${small(pt.theory.normalVariance)})`.padEnd(40)} ${fixed(pt.corr, 3)} [${fixed(pt.theory.corr, 3)}]`);
  const fitMean = fitLine(s.points.map((pt) => Math.log10(pt.n)), s.points.map((pt) => Math.log10(pt.meanStats.variance)));
  const tail = s.points.filter((pt) => pt.n >= 10);
  const fitVar = fitLine(tail.map((pt) => Math.log10(pt.n)), tail.map((pt) => Math.log10(pt.varStats.variance)));
  print(`  log10 Var(M_n) against log10 n: slope ${fixed(fitMean.slope, 4)} +- ${fixed(fitMean.slopeError, 4)} (theory -1); log10 Var(s_n^2), n >= 10: ${fixed(fitVar.slope, 4)} +- ${fixed(fitVar.slopeError, 4)} (about -1)`);
  print('');
  print(`Inference: share of hackers whose ${100 * CONFIDENCE}% interval contains the true value`);
  print(`  ${pad('n', 6)}  ${'t interval for mu'.padEnd(20)} chi-square interval for sigma^2 (limit ${fixed(chiSquareCoverageLimit(L), 4)})`);
  for (const pt of s.points) print(`  ${pad(pt.n, 6)}  ${fixed(pt.coverage.t, 4).padEnd(20)} ${fixed(pt.coverage.chi2, 4)}`);
  print('');
  const at10 = pointAt(s.points, SMALL_N);
  print(`Histogram of the standardized sampling means at n = ${at10.n} (# simulated, | normal):`);
  textHistogram(at10, print);
  print('');

  const all = Object.entries(statisticalTests(s)).flatMap(([group, list]) => list.map(([k, test]) => ({ group, key: k, test })));
  print(`Hypothesis tests, alpha = ${SIGNIFICANCE}:`);
  for (const { group, key: k, test } of all) print(`  ${group.padEnd(9)} ${fmtP(test).padEnd(9)} ${test.verdict === 'reject' ? '[rejected] ' : ''}${TEST_LABELS[group][k]}`);
  return failed.length ? 1 : 0;
}

/** True under Node, where the downloadable program can run runCli. */
export const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);
