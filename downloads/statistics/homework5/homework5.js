/*
 * Homework #5 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Computations: five quadrature rules, the normal CDF, its table, quantiles and tails, Riemann, Darboux and Lebesgue sums,
 * a formula reader, Monte Carlo, xoshiro128** and SplitMix64, Box-Muller, hypothesis tests, charts and command line (node homework5.js [options]).
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-5
 */

var Homework5 = (function () {
'use strict';

/* global process */
/**
 * Homework #5 - Riemann and Lebesgue integration, and the numerical
 *               computation of the normal CDF
 * Sapienza University of Rome - MSc in Cybersecurity (LM-66) - Statistics
 * Nicholas Arcari
 *
 * Exercise 1 integrates a collection of functions in the two ways:
 * Riemann's, which cuts the x axis into strips, and Lebesgue's, which cuts
 * the y axis into levels and measures the set where the function stays
 * above each of them; it compares their accuracy, their convergence and
 * their cost, and computes Dirichlet's and Thomae's functions, which no
 * double can show, with exact fractions; then Monte Carlo, the statistical
 * version of the second.
 * Exercise 2 computes the distribution function of the standard normal,
 * Phi(z) = integral from -infinity to z of its density, which has no
 * elementary formula (Liouville): five quadrature rules written from
 * scratch, three ways around the infinite lower limit, two power series,
 * Laplace's continued fraction, two classic approximations based on erf,
 * and an efficient method made of the best two pieces, checked against the
 * NIST table and mpmath; then it puts Phi to work: its table, its
 * quantiles, the far tails behind an alarm threshold, and a
 * Kolmogorov-Smirnov test against simulated data. Everything is written
 * from scratch, with no dependencies (the library keeps the code of
 * Exercise 2 first, because Exercise 1 uses its normal law):
 *
 *   0. Parameters and input validation
 *   1. Exercise 2: the normal density and five quadrature rules
 *   2. Exercise 2: the CDF, its table, its quantiles and its tails
 *  2b. Exercise 2: series, continued fraction, erf and the method of the page
 *   3. Exercise 1: the functions, and a parser for the one typed in the page
 *   4. Exercise 1: Riemann and Darboux sums
 *   5. Exercise 1: Lebesgue sums, level sets, results and costs
 *  5b. Exercise 1: Dirichlet's and Thomae's functions, with exact fractions
 *   6. Random numbers: SplitMix64, xoshiro128**, Box-Muller, Monte Carlo
 *   7. Statistics: special functions and hypothesis tests
 *   8. The experiments
 *   9. Charts (browser, <canvas>)
 *  10. Checks, printed report and command line
 */

// ---------------------------------------------------------------------------
// 0. Parameters and input validation
// ---------------------------------------------------------------------------

const fail = (message) => {
  throw new RangeError(message);
};

/** The values the page opens with: the seed, the size of the simulated sample, the points and the repetitions of Monte Carlo. */
const DEFAULT_SEED = 2026;
const DEFAULT_SAMPLE = 10000;
const DEFAULT_POINTS = 1000;
const DEFAULT_REPS = 1000;

/** The accepted ranges: at most 2 x 10^7 points of Monte Carlo per function, a second or two of computation. */
const LIMITS = Object.freeze({
  seed: Object.freeze([0, 4294967295]),
  sample: Object.freeze([100, 100000]),
  points: Object.freeze([10, 10000]),
  reps: Object.freeze([100, 2000]),
});

/** Significance level of every test, and the level of the confidence intervals. */
const SIGNIFICANCE = 0.05;
const CONFIDENCE = 0.95;
const Z95 = 1.959963984540054;

/** An integer of the range [min, max], in decimal digits. */
function parseInteger(text, [min, max]) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (!/^\d{1,12}$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const value = Number(t);
  if (value < min || value > max) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** A real number of the range [min, max], with a decimal point or a decimal comma and an optional exponent: -3, 0,5, 2.5e-3. */
function parseNumber(text, [min, max]) {
  const t = String(text).trim();
  const plain = t.replace(',', '.');
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (plain.length > 16 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d{1,3})?$/.test(plain)) return { ok: false, error: 'notNumber', text: t };
  const value = Number(plain);
  if (!(value >= min && value <= max)) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** The parameters of the simulations, checked against LIMITS. */
function checkParams({ seed = DEFAULT_SEED, sample = DEFAULT_SAMPLE, points = DEFAULT_POINTS, reps = DEFAULT_REPS } = {}) {
  const within = (v, [lo, hi]) => Number.isInteger(v) && v >= lo && v <= hi;
  if (!within(seed, LIMITS.seed)) fail(`the seed must be an integer between 0 and ${LIMITS.seed[1]}`);
  if (!within(sample, LIMITS.sample)) fail(`the sample must have between ${LIMITS.sample[0]} and ${LIMITS.sample[1]} values`);
  if (!within(points, LIMITS.points)) fail(`Monte Carlo needs between ${LIMITS.points[0]} and ${LIMITS.points[1]} points`);
  if (!within(reps, LIMITS.reps)) fail(`the repetitions must be between ${LIMITS.reps[0]} and ${LIMITS.reps[1]}`);
  return { seed, sample, points, reps };
}

// ---------------------------------------------------------------------------
// 1. Exercise 2: the normal density and five quadrature rules
// ---------------------------------------------------------------------------

/*
 * The density of N(mu, sigma^2) is phi((x - mu)/sigma)/sigma, with
 *   phi(z) = exp(-z^2/2)/sqrt(2 pi),
 * and its distribution function F(x) = Phi((x - mu)/sigma) is the integral
 * of phi from -infinity to z = (x - mu)/sigma. Phi has no formula with a
 * finite number of elementary functions (Liouville): it has to be computed,
 * and here it is computed as the assignment asks, by numerical integration.
 *
 * A quadrature rule replaces the integral of f on [a, b] with a weighted sum
 * of values of f. With n subintervals of width h = (b - a)/n:
 *   left        h (f_0 + ... + f_(n-1))                    error O(h)
 *   midpoint    h (f_(1/2) + ... + f_(n-1/2))              error O(h^2)
 *   trapezoid   h (f_0/2 + f_1 + ... + f_(n-1) + f_n/2)    error O(h^2)
 *   Simpson     h/3 (f_0 + 4 f_1 + 2 f_2 + ... + 4 f_(n-1) + f_n), n even, O(h^4)
 * Gauss-Legendre puts n nodes and weights where they integrate exactly every
 * polynomial of degree up to 2n - 1: for a smooth function such as phi its
 * error falls faster than any power of 1/n.
 */

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/** The standard normal density phi(z). */
const phi = (z) => Math.exp(-0.5 * z * z) / SQRT_2PI;

/** The density of N(mu, sigma^2) at x. */
const normalDensity = (x, mu = 0, sigma = 1) => phi((x - mu) / sigma) / sigma;

/** The five rules, in the order the page shows them. */
const RULES = Object.freeze(['left', 'midpoint', 'trapezoid', 'simpson', 'gauss']);

/** Their order for a smooth function: the error falls as h^order (Gauss faster than any power). */
const RULE_ORDER = Object.freeze({ left: 1, midpoint: 2, trapezoid: 2, simpson: 4, gauss: Infinity });

/** The most nodes of Gauss-Legendre: enough for 15 digits of every integral of this page. */
const GAUSS_MAX = 64;

/** P_n(t) and its derivative, by the three-term recurrence of the Legendre polynomials. */
function legendre(n, t) {
  let p0 = 1;
  let p1 = t;
  for (let k = 2; k <= n; k++) {
    const p2 = ((2 * k - 1) * t * p1 - (k - 1) * p0) / k;
    p0 = p1;
    p1 = p2;
  }
  return [p1, (n * (t * p1 - p0)) / (t * t - 1)];
}

const gaussCache = new Map();

/**
 * Nodes and weights of the n-point Gauss-Legendre rule on [-1, 1]: the roots
 * of the Legendre polynomial P_n, found with Newton's method from the
 * approximation cos(pi (i + 3/4)/(n + 1/2)), and the weights
 * 2/((1 - t^2) P_n'(t)^2). The nodes are in increasing order.
 */
function gaussLegendre(n) {
  if (!Number.isInteger(n) || n < 1 || n > GAUSS_MAX) fail(`Gauss-Legendre needs between 1 and ${GAUSS_MAX} nodes`);
  if (gaussCache.has(n)) return gaussCache.get(n);
  const nodes = new Array(n);
  const weights = new Array(n);
  for (let i = 0; i < Math.ceil(n / 2); i++) {
    let t = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
    for (let iter = 0; iter < 100; iter++) {
      const [p, dp] = legendre(n, t);
      const dt = p / dp;
      t -= dt;
      if (Math.abs(dt) < 1e-16) break;
    }
    const [, dp] = legendre(n, t);
    const w = 2 / ((1 - t * t) * dp * dp);
    nodes[i] = -t;
    nodes[n - 1 - i] = t;
    weights[i] = w;
    weights[n - 1 - i] = w;
  }
  const rule = Object.freeze({ nodes: Object.freeze(nodes), weights: Object.freeze(weights) });
  gaussCache.set(n, rule);
  return rule;
}

/**
 * The integral of f on [a, b] with one rule and n subintervals of equal
 * width (Simpson: n even), or, for Gauss, n nodes on the whole interval.
 */
function integrate(f, a, b, rule, n) {
  if (!Number.isInteger(n) || n < 1) fail('n must be a positive integer');
  if (a === b) return 0;
  const h = (b - a) / n;
  let s = 0;
  switch (rule) {
    case 'left':
      for (let i = 0; i < n; i++) s += f(a + i * h);
      return s * h;
    case 'midpoint':
      for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h);
      return s * h;
    case 'trapezoid':
      s = (f(a) + f(b)) / 2;
      for (let i = 1; i < n; i++) s += f(a + i * h);
      return s * h;
    case 'simpson':
      if (n % 2) fail('Simpson\'s rule needs an even number of subintervals');
      s = f(a) + f(b);
      for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
      return (s * h) / 3;
    case 'gauss': {
      const { nodes, weights } = gaussLegendre(n);
      const mid = (a + b) / 2;
      const half = (b - a) / 2;
      for (let i = 0; i < n; i++) s += weights[i] * f(mid + half * nodes[i]);
      return s * half;
    }
    default:
      return fail(`unknown rule ${rule}`);
  }
}

/** How many values of f a rule takes with n subintervals (or nodes). */
const evaluationsOf = (rule, n) => (rule === 'trapezoid' || rule === 'simpson' ? n + 1 : n);

/** The smallest valid n of a rule not below `n`: Simpson wants it even, Gauss at most GAUSS_MAX. */
const validN = (rule, n) => {
  const k = Math.max(rule === 'simpson' ? 2 : 1, Math.round(n));
  if (rule === 'simpson') return k % 2 ? k + 1 : k;
  if (rule === 'gauss') return Math.min(GAUSS_MAX, k);
  return k;
};

/**
 * The pieces that a rule adds up on [a, b], for the pictures: rectangles
 * (left, midpoint), trapezoids, Simpson's parabolas (one every two
 * subintervals) and Gauss's nodes, each drawn as a rectangle of height f at
 * the node and width weight x (b - a)/2, side by side from a: the widths add
 * up to b - a, and every node falls inside its own rectangle (the
 * separation theorem of Chebyshev, Markov and Stieltjes), so Gauss too is a
 * Riemann sum, with strips and points chosen with care.
 */
function rulePieces(f, a, b, rule, n) {
  const h = (b - a) / n;
  const pieces = [];
  if (rule === 'left' || rule === 'midpoint') {
    for (let i = 0; i < n; i++) {
      const x0 = a + i * h;
      const tag = rule === 'left' ? x0 : x0 + h / 2;
      const y = f(tag);
      pieces.push({ kind: 'rect', x0, x1: x0 + h, tag, y, area: y * h });
    }
  } else if (rule === 'trapezoid') {
    for (let i = 0; i < n; i++) {
      const x0 = a + i * h;
      const y0 = f(x0);
      const y1 = f(x0 + h);
      pieces.push({ kind: 'trap', x0, x1: x0 + h, y0, y1, area: ((y0 + y1) * h) / 2 });
    }
  } else if (rule === 'simpson') {
    for (let i = 0; i + 1 < n; i += 2) {
      const x0 = a + i * h;
      const y0 = f(x0);
      const ym = f(x0 + h);
      const y1 = f(x0 + 2 * h);
      pieces.push({ kind: 'parab', x0, x1: x0 + 2 * h, y0, ym, y1, area: (h / 3) * (y0 + 4 * ym + y1) });
    }
  } else if (rule === 'gauss') {
    const { nodes, weights } = gaussLegendre(n);
    const half = (b - a) / 2;
    let left = a;
    for (let i = 0; i < n; i++) {
      const x = (a + b) / 2 + half * nodes[i];
      const width = weights[i] * half;
      const y = f(x);
      pieces.push({ kind: 'node', x0: left, x1: left + width, tag: x, weight: weights[i], y, area: y * width });
      left += width;
    }
  } else {
    fail(`unknown rule ${rule}`);
  }
  return pieces;
}

// ---------------------------------------------------------------------------
// 2. Exercise 2: the CDF, its table, its quantiles and its tails
// ---------------------------------------------------------------------------

/*
 * The lower limit of Phi is -infinity, and a rule needs a finite interval.
 * Three ways around it:
 *   symmetry      phi is even and its integral over the whole line is 1, so
 *                 Phi(z) = 1/2 + integral from 0 to z (minus, for z < 0);
 *   truncation    stop at -L: Phi(-L) is left out, 3.2e-5 for L = 4 and
 *                 6.2e-16 for L = 8;
 *   substitution  t = z - (1 - u)/u maps u in (0, 1] onto (-infinity, z],
 *                 dt = du/u^2, and the integrand phi(t)/u^2 goes to 0 as u
 *                 goes to 0: a finite interval, with nothing left out.
 * The upper tail P(Z > k) = 1 - Phi(k) is the same thing seen from the
 * other side: subtracting Phi(k) from 1 loses digits when Phi(k) is close
 * to 1, and Phi(-k) with the substitution keeps them all.
 */

const STRATEGIES = Object.freeze(['symmetry', 'truncation', 'substitution']);

/** The lower limits of the truncated integral: -4 leaves out 3.2e-5, -8 leaves out 6.2e-16. */
const TRUNCATIONS = Object.freeze([4, 8]);
const TRUNCATION = 8;

/** The rule and n of the page's computations of Phi, unless the reader chooses: 64 Gauss nodes, 15 digits. */
const PRECISE = Object.freeze({ rule: 'gauss', n: 64 });

/** The integrand of the substitution t = z - (1 - u)/u: phi(t) dt/du, 0 at u = 0. */
const substituted = (z) => (u) => (u > 0 ? phi(z - (1 - u) / u) / (u * u) : 0);

/** Phi(z) by numerical integration of phi with one rule and n subintervals (or nodes), around -infinity in one of three ways. */
function cdfStandard(z, { rule = PRECISE.rule, n = PRECISE.n, strategy = 'symmetry', lower = TRUNCATION } = {}) {
  switch (strategy) {
    case 'symmetry':
      return z >= 0 ? 0.5 + integrate(phi, 0, z, rule, n) : 0.5 - integrate(phi, z, 0, rule, n);
    case 'truncation':
      return z <= -lower ? 0 : integrate(phi, -lower, z, rule, n);
    case 'substitution':
      return integrate(substituted(z), 0, 1, rule, n);
    default:
      return fail(`unknown strategy ${strategy}`);
  }
}

/** F(x) = P(X <= x) for X ~ N(mu, sigma^2), by numerical integration. */
const normalCdfNumeric = (x, mu = 0, sigma = 1, options = {}) => cdfStandard((x - mu) / sigma, options);

/** P(Z > k) as 1 - Phi(k): the subtraction that loses digits far in the tail. */
const tailBySubtraction = (k, options = PRECISE) => 1 - cdfStandard(k, { ...options, strategy: 'symmetry' });

/** P(Z > k) = Phi(-k) with the substitution: no subtraction, every digit kept. */
const tailDirect = (k, options = PRECISE) => cdfStandard(-k, { ...options, strategy: 'substitution' });

/** The values of z of the comparison of the three strategies. */
const STRATEGY_POINTS = Object.freeze([-3, -1, 0, 1, 1.96, 3]);

/** The rules and n of the comparison of the strategies: few points on purpose, so that the differences show. */
const STRATEGY_RULES = Object.freeze([Object.freeze({ rule: 'simpson', n: 16 }), Object.freeze({ rule: 'gauss', n: 16 })]);

/** Phi at the points of STRATEGY_POINTS in every way, with the error against the reference. */
function strategyRows() {
  return STRATEGY_POINTS.map((z) => {
    const reference = normalCdf(z);
    const cells = [];
    for (const { rule, n } of STRATEGY_RULES) {
      for (const strategy of STRATEGIES) {
        const lowers = strategy === 'truncation' ? TRUNCATIONS : [TRUNCATION];
        for (const lower of lowers) {
          const value = cdfStandard(z, { rule, n, strategy, lower });
          cells.push({ rule, n, strategy, lower: strategy === 'truncation' ? lower : null, value, error: Math.abs(value - reference) });
        }
      }
    }
    return { z, reference, cells };
  });
}

/** The values of n of the convergence study: 2, 4, 8, ..., 16384 subintervals (Gauss up to GAUSS_MAX nodes). */
const CONVERGENCE_N = Object.freeze(Array.from({ length: 14 }, (_, i) => 2 ** (i + 1)));

/** The point of the convergence study: Phi(1.96) = 0.975, the value behind every 95% interval. */
const CONVERGENCE_Z = 1.96;

/**
 * The error of every rule on Phi(z) (symmetry, so on [0, z]) for every n of
 * CONVERGENCE_N, and the order measured on the part of the curve above the
 * rounding floor: the slope of log error against log n.
 */
function convergenceStudy(z = CONVERGENCE_Z, strategy = 'symmetry') {
  const reference = normalCdf(z);
  const rows = CONVERGENCE_N.map((n) => {
    const errors = {};
    const values = {};
    for (const rule of RULES) {
      if (rule === 'gauss' && n > GAUSS_MAX) {
        errors[rule] = null;
        values[rule] = null;
        continue;
      }
      const value = cdfStandard(z, { rule, n, strategy });
      values[rule] = value;
      errors[rule] = Math.abs(value - reference);
    }
    return { n, values, errors };
  });
  const orders = {};
  for (const rule of RULES) {
    // the straight part: errors above 1e-13, where rounding does not count yet
    const pts = rows.filter((r) => r.errors[rule] !== null && r.errors[rule] > 1e-13);
    orders[rule] = pts.length >= 3 ? -fitLine(pts.map((r) => Math.log10(r.n)), pts.map((r) => Math.log10(r.errors[rule]))).slope : NaN;
  }
  // the fewest values of phi that give 10 correct decimals (error below 5e-11)
  const enough = {};
  for (const rule of RULES) {
    const r = rows.find((row) => row.errors[rule] !== null && row.errors[rule] < 5e-11);
    enough[rule] = r ? evaluationsOf(rule, r.n) : null;
  }
  return { z, strategy, reference, rows, orders, enough };
}

/** The layout of the classic table of the standard normal: rows 0.0, 0.1, ..., 3.4, columns + 0.00, ..., + 0.09. */
const ZTABLE = Object.freeze({ rows: 35, cols: 10, step: 0.01 });

/**
 * The table of Phi(z) for z = 0.00, 0.01, ..., 3.49, as printed in
 * statistics books: Phi(0) = 1/2, then one Simpson parabola on every step of
 * 0.01, added as it goes. Every cell costs two new values of phi.
 */
function zTable() {
  const { rows, cols, step } = ZTABLE;
  const flat = [0.5];
  let value = 0.5;
  let left = phi(0);
  let evaluations = 1;
  for (let j = 1; j < rows * cols; j++) {
    const z0 = (j - 1) * step;
    const z1 = j * step;
    const right = phi(z1);
    value += ((z1 - z0) / 6) * (left + 4 * phi((z0 + z1) / 2) + right);
    evaluations += 2;
    flat.push(value);
    left = right;
  }
  let maxError = 0;
  let at = 0;
  const table = [];
  for (let r = 0; r < rows; r++) {
    const cells = [];
    for (let c = 0; c < cols; c++) {
      const j = r * cols + c;
      const z = j * step;
      const error = Math.abs(flat[j] - normalCdf(z));
      if (error > maxError) {
        maxError = error;
        at = z;
      }
      cells.push({ z, value: flat[j], error });
    }
    table.push({ row: r / 10, cells });
  }
  return { table, maxError, at, evaluations };
}

/** The levels of the quantiles of the page: the 90% to the 99.99% ones. */
const QUANTILE_LEVELS = Object.freeze([0.9, 0.95, 0.975, 0.99, 0.995, 0.999, 0.9999]);

/**
 * The quantile z_p, Phi(z_p) = p, backwards with Newton's method. It works
 * on the smaller tail, q = 1 - p for p >= 1/2 (exact in floating point, by
 * Sterbenz's lemma) or q = p, and solves P(Z > w) = q: w <- w + (P(Z > w) -
 * q)/phi(w), with the tail integrated directly, so that no digit is lost to
 * a subtraction; then z_p = w or -w. From w = 0 the steps never overshoot
 * (the tail is convex for w > 0), and near the root every step doubles the
 * correct digits.
 */
function quantileNewton(p, options = PRECISE) {
  if (!(p > 0 && p < 1)) fail('p must lie strictly between 0 and 1');
  const upper = p >= 0.5;
  const target = upper ? 1 - p : p;
  let w = 0;
  const steps = [];
  for (let k = 1; k <= 60; k++) {
    const q = tailDirect(w, options);
    const dw = (q - target) / phi(w);
    w += dw;
    steps.push({ k, z: upper ? w : -w, F: upper ? 1 - q : q, dz: upper ? dw : -dw });
    if (Math.abs(dw) < 1e-15 * Math.max(1, w)) break;
  }
  return { p, z: upper ? w : -w, steps, reference: normalQuantile(p) };
}

/** The thresholds of the table of the tails: k = 1, ..., 9 standard deviations. */
const TAIL_KS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);

/** P(Z > k) in the two ways, with the relative error of each against the reference. */
function tailRows(options = PRECISE) {
  return TAIL_KS.map((k) => {
    const reference = normalSf(k);
    const subtraction = tailBySubtraction(k, options);
    const direct = tailDirect(k, options);
    return { k, reference, subtraction, direct, subtractionError: Math.abs(subtraction - reference) / reference, directError: Math.abs(direct - reference) / reference };
  });
}

/**
 * The alarm threshold k, in standard deviations above the mean, that a
 * normal model gives a target rate of false alarms P(Z > k) = target:
 * Newton's method on log P(Z > k), whose derivative is -phi(k)/P(Z > k),
 * with the tail computed without subtraction.
 */
function alarmThreshold(target, options = PRECISE) {
  if (!(target > 0 && target < 0.5)) fail('the rate of false alarms must lie between 0 and 1/2');
  let k = 0;
  let steps = 0;
  for (; steps < 60; steps++) {
    const q = tailDirect(k, options);
    const dk = ((Math.log(q) - Math.log(target)) * q) / phi(k);
    k += dk;
    if (Math.abs(dk) < 1e-13 * Math.max(1, k)) break;
  }
  return { target, k, steps: steps + 1, reference: -normalQuantile(target) };
}

/** The points of the curve F(x): 201 values of x from mu - 4 sigma to mu + 4 sigma, every integer z among them. */
const CURVE_POINTS = 201;
const CURVE_SPAN = 4;

/**
 * The CDF as a function, which is what the assignment asks for: F(x) of
 * N(mu, sigma^2) by numerical integration at CURVE_POINTS values of x from
 * mu - 4 sigma to mu + 4 sigma, with one rule, n and strategy, next to the
 * reference and the error at every point. Every value is its own integral
 * from -infinity, not a running sum, so the error of one point does not
 * carry over to the next.
 */
function cdfCurve({ mu = 0, sigma = 1, rule = 'simpson', n = 16, strategy = 'symmetry', points = CURVE_POINTS, span = CURVE_SPAN } = {}) {
  if (!Number.isFinite(mu) || !Number.isFinite(sigma) || !(sigma > 0)) fail('mu must be a real number and sigma a positive one');
  if (!Number.isInteger(points) || points < 2) fail('the curve needs at least two points');
  const options = { rule, n: validN(rule, n), strategy };
  const zs = [];
  const xs = [];
  const numeric = [];
  const exact = [];
  const errors = [];
  let maxError = 0;
  let at = mu;
  for (let i = 0; i < points; i++) {
    const z = -span + (2 * span * i) / (points - 1);
    const value = cdfStandard(z, options);
    const reference = normalCdf(z);
    const error = Math.abs(value - reference);
    zs.push(z);
    xs.push(mu + sigma * z);
    numeric.push(value);
    exact.push(reference);
    errors.push(error);
    if (error > maxError) {
      maxError = error;
      at = mu + sigma * z;
    }
  }
  return { mu, sigma, ...options, zs, xs, numeric, exact, errors, maxError, at, evaluations: points * evaluationsOf(rule, options.n) };
}

// ---------------------------------------------------------------------------
// 2b. Exercise 2: series, continued fraction, erf and the method of the page
// ---------------------------------------------------------------------------

/*
 * Liouville (1835), in Rosenlicht's form: with f and g rational and g not
 * constant, the integral of f e^g is elementary only if it equals R e^g for
 * a rational R with R' + g' R = f. For the bell, f = 1 and g = -x^2/2, so
 * R' - x R = 1. A polynomial R of degree d leaves -x R of degree d + 1,
 * which nothing cancels; a pole of order m of R gives R' a pole of order
 * m + 1, which nothing cancels either. No rational R exists, so Phi has no
 * elementary formula. The solutions are S + C e^(x^2/2), with
 *   S(x) = (Phi(x) - 1/2)/phi(x) = x + x^3/3 + x^5/(3 5) + x^7/(3 5 7) + ...,
 * which grows like e^(x^2/2), faster than any rational function: the same
 * S is the series the page computes Phi with.
 *
 * Phi(z) = (1 + erf(z/sqrt 2))/2 is exact, but erf only names the integral:
 * every erf of every library is itself a program (series near 0, continued
 * fractions or rational approximations in the tails). JavaScript has none.
 */

/**
 * The series of the notes of the course (Hogg, McKean and Craig, 3.4), from
 * the Taylor series of e^(-z^2/2) integrated term by term:
 *   Phi(z) = 1/2 + (1/sqrt(2 pi)) sum (-1)^k z^(2k+1)/(2^k (2k+1) k!).
 * Alternating: the first term left out bounds the error, in exact
 * arithmetic. In floating point the terms grow to about e^(z^2/2) before
 * they shrink, and their cancellation eats the digits. With `terms` the
 * sum stops there; otherwise when a term no longer changes it.
 */
function cdfAlternating(z, { terms: limit = Infinity, tolerance = 1e-17, maxTerms = 2000 } = {}) {
  let power = z;
  let sum = z;
  let largest = Math.abs(z);
  let k = 1;
  for (; k < Math.min(limit, maxTerms); k++) {
    power *= (-z * z) / (2 * k);
    const term = power / (2 * k + 1);
    sum += term;
    largest = Math.max(largest, Math.abs(term));
    if (limit === Infinity && Math.abs(term) <= tolerance * Math.abs(sum)) {
      k++;
      break;
    }
  }
  const omitted = Math.abs((power * (-z * z)) / (2 * k) / (2 * k + 1));
  return { value: 0.5 + sum / SQRT_2PI, terms: k, largest: largest / SQRT_2PI, bound: omitted / SQRT_2PI };
}

/**
 * The same function written with positive terms (Marsaglia, 2004):
 *   Phi(z) = 1/2 + phi(z) S(z),  S(z) = z + z^3/3 + z^5/(3 5) + ...
 * S is Liouville's function above: no cancellation inside the sum, one
 * exponential outside it. Below the mean the 1/2 still cancels against
 * phi S, so far in the lower tail the relative error grows.
 */
function cdfPositive(z, { terms: limit = Infinity, tolerance = 1e-17, maxTerms = 2000 } = {}) {
  let term = z;
  let sum = z;
  let k = 1;
  for (; k < Math.min(limit, maxTerms); k++) {
    term *= (z * z) / (2 * k + 1);
    sum += term;
    if (limit === Infinity && Math.abs(term) <= tolerance * Math.abs(sum)) {
      k++;
      break;
    }
  }
  return { value: 0.5 + phi(z) * sum, terms: k, S: sum };
}

/**
 * Mills' ratio R(w) = P(Z > w)/phi(w) = 1/(w + 1/(w + 2/(w + 3/(w + ...)))),
 * Laplace's continued fraction (1805), by Lentz's method: it converges for
 * every w > 0, slowly near 0 and fast in the tail, where it keeps every
 * digit of probabilities as small as 10^-300.
 */
function millsRatio(w, { tolerance = 1e-16, maxTerms = 5000 } = {}) {
  if (!(w > 0)) fail('the continued fraction needs w > 0');
  const tiny = 1e-300;
  let f = w;
  let C = w;
  let D = 0;
  let terms = 0;
  for (let k = 1; k <= maxTerms; k++) {
    D = w + k * D;
    D = 1 / (D === 0 ? tiny : D);
    C = w + k / C;
    if (C === 0) C = tiny;
    const delta = C * D;
    f *= delta;
    terms = k;
    if (Math.abs(delta - 1) < tolerance) break;
  }
  return { R: 1 / f, terms };
}

/** Abramowitz and Stegun 7.1.26 (Hastings, 1955): erf(x) = 1 - t (a1 + a2 t + ... + a5 t^4) e^(-x^2), t = 1/(1 + p x), x >= 0, with |error| <= 1.5e-7. */
const ERF_AS = Object.freeze({ p: 0.3275911, a: Object.freeze([0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429]), bound: 1.5e-7 });

function erfAS(x) {
  const ax = Math.abs(x);
  const t = 1 / (1 + ERF_AS.p * ax);
  const [a1, a2, a3, a4, a5] = ERF_AS.a;
  const e = 1 - t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5)))) * Math.exp(-ax * ax);
  return x < 0 ? -e : e;
}

/** Phi through 7.1.26: (1 + erf(z/sqrt 2))/2, so its error is at most half that of erf. */
const cdfAS = (z) => 0.5 * (1 + erfAS(z / Math.SQRT2));

/** Abramowitz and Stegun 26.2.17 (Zelen and Severo, 1964): P(Z > w) = phi(w) t (b1 + b2 t + ... + b5 t^4), t = 1/(1 + p w), w >= 0, with |error| < 7.5e-8. */
const CDF_ZS = Object.freeze({ p: 0.2316419, b: Object.freeze([0.31938153, -0.356563782, 1.781477937, -1.821255978, 1.330274429]), bound: 7.5e-8 });

function cdfZS(z) {
  const w = Math.abs(z);
  const t = 1 / (1 + CDF_ZS.p * w);
  const [b1, b2, b3, b4, b5] = CDF_ZS.b;
  const q = phi(w) * t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
  return z < 0 ? q : 1 - q;
}

/** Where the method of the page leaves the series for the continued fraction. */
const SWITCH_Z = 2;

/**
 * The method of the page, made of the best two pieces: the positive series
 * for |z| < 2, which never cancels inside and needs at most 25 terms there,
 * and Laplace's continued fraction beyond, which needs at most 106 terms
 * and keeps the relative accuracy of the smallest probabilities. One
 * exponential either way, about 15 correct digits everywhere.
 */
function cdfOursDetail(z) {
  if (Number.isNaN(z)) return { value: NaN, branch: 'series', terms: 0 };
  const w = Math.abs(z);
  if (w < SWITCH_Z) {
    const s = cdfPositive(z);
    return { value: s.value, branch: 'series', terms: s.terms };
  }
  if (w > 40) return { value: z < 0 ? 0 : 1, branch: 'fraction', terms: 0 };
  const m = millsRatio(w);
  const q = phi(w) * m.R;
  return { value: z < 0 ? q : 1 - q, branch: 'fraction', terms: m.terms };
}

const cdfOurs = (z) => cdfOursDetail(z).value;

/** The methods of Exercise 2, in the order of the page; the three rules of integration use n = 64 and the symmetry around 0. */
const CDF_METHODS = Object.freeze(['trapezoid', 'simpson', 'gauss', 'alternating', 'positive', 'abramowitz', 'zelen', 'ours']);
const METHOD_N = 64;

const cdfBy = Object.freeze({
  trapezoid: (z) => cdfStandard(z, { rule: 'trapezoid', n: METHOD_N }),
  simpson: (z) => cdfStandard(z, { rule: 'simpson', n: METHOD_N }),
  gauss: (z) => cdfStandard(z, { rule: 'gauss', n: METHOD_N }),
  alternating: (z) => cdfAlternating(z).value,
  positive: (z) => cdfPositive(z).value,
  abramowitz: cdfAS,
  zelen: cdfZS,
  ours: cdfOurs,
});

/** Phi(z) from mpmath with 60 digits, rounded to the nearest double, at z = -8, -7.9, ..., 0; for z > 0, Phi(z) = 1 - Phi(-z). */
const MPMATH_PHI = Object.freeze([
  6.220960574271784e-16, 1.3945171466592683e-15, 3.0953587719586956e-15, 6.8033115407739706e-15, 1.4806537490048047e-14, 3.1908916729108963e-14,
  6.809224890620033e-14, 1.4388386381575857e-13, 3.0106279811174375e-13, 6.237844463331576e-13, 1.279812543885835e-12, 2.600126965638173e-12,
  5.2309575441445875e-12, 1.0420976987965194e-11, 2.055788909399518e-11, 4.016000583859118e-11, 7.76884758170983e-11, 1.4882282217623108e-10,
  2.8231580370432744e-10, 5.30342326294883e-10, 9.86587645037698e-10, 1.8175078630994324e-09, 3.3157459783261613e-09, 5.9903714010635345e-09,
  1.0717590258310907e-08, 1.8989562465887718e-08, 3.3320448485428574e-08, 5.790134039964589e-08, 9.96442631693348e-08, 1.6982674071475982e-07,
  2.866515718791939e-07, 4.791832765903198e-07, 7.933281519755946e-07, 1.300807453917282e-06, 2.11245470250285e-06, 3.3976731247300603e-06,
  5.41254390770386e-06, 8.539905470991804e-06, 1.3345749015906338e-05, 2.0657506912546737e-05, 3.1671241833119924e-05, 4.8096344017602716e-05,
  7.234804392511998e-05, 0.00010779973347738834, 0.00015910859015753388, 0.00023262907903552504, 0.00033692926567688097, 0.0004834241423837772,
  0.0006871379379158485, 0.0009676032132183569, 0.0013498980316300946, 0.001865813300384038, 0.002555130330427933, 0.0034669738030406686,
  0.00466118802371875, 0.006209665325776135, 0.00819753592459613, 0.010724110021675805, 0.013903447513498611, 0.017864420562816556,
  0.02275013194817921, 0.0287165598160018, 0.0359303191129258, 0.04456546275854304, 0.054799291699557995, 0.06680720126885807,
  0.08075665923377105, 0.09680048458561033, 0.11506967022170826, 0.13566606094638267, 0.15865525393145705, 0.1840601253467595,
  0.2118553985833967, 0.241963652223073, 0.2742531177500736, 0.3085375387259869, 0.3445782583896758, 0.3820885778110474,
  0.42074029056089696, 0.460172162722971, 0.5,
]);

/** The same far in the lower tail, where only the relative error makes sense: [z, Phi(z)]. */
const MPMATH_TAILS = Object.freeze([[-9, 1.1285884059538405e-19], [-10, 7.619853024160525e-24], [-12, 1.776482112077679e-33], [-15, 3.670966199312751e-51], [-20, 2.7536241186062337e-89], [-25, 3.056696706382561e-138], [-30, 4.906713927148187e-198], [-37, 5.725571222524577e-300]].map((pair) => Object.freeze(pair)));

/** The points of the comparison with the references, with Phi(z) from mpmath (60 digits, rounded to the nearest double). */
const REFERENCE_POINTS = Object.freeze([[-6, 9.86587645037698e-10], [-5, 2.866515718791939e-07], [-4, 3.1671241833119924e-05], [-3, 0.0013498980316300946], [-2.5, 0.006209665325776135], [-1.96, 0.024997895148220435], [-1.5, 0.06680720126885807], [-1, 0.15865525393145705], [-0.5, 0.3085375387259869], [0, 0.5], [0.5, 0.6914624612740131], [1, 0.8413447460685429], [1.36, 0.913085038052915], [1.5, 0.9331927987311419], [1.96, 0.9750021048517795], [2, 0.9772498680518208], [2.5, 0.9937903346742238], [3, 0.9986501019683699], [4, 0.9999683287581669], [5, 0.9999997133484281], [6, 0.9999999990134123]].map((pair) => Object.freeze(pair)));

/** The table of the NIST/SEMATECH e-Handbook of Statistical Methods, section 1.3.6.7.1: P(0 <= Z <= z) in units of 10^-5, one row for every tenth of z from 0.0 to 4.0, one column for every hundredth. */
const NIST_ROWS = Object.freeze([
  '0 399 798 1197 1595 1994 2392 2790 3188 3586',
  '3983 4380 4776 5172 5567 5962 6356 6749 7142 7535',
  '7926 8317 8706 9095 9483 9871 10257 10642 11026 11409',
  '11791 12172 12552 12930 13307 13683 14058 14431 14803 15173',
  '15542 15910 16276 16640 17003 17364 17724 18082 18439 18793',
  '19146 19497 19847 20194 20540 20884 21226 21566 21904 22240',
  '22575 22907 23237 23565 23891 24215 24537 24857 25175 25490',
  '25804 26115 26424 26730 27035 27337 27637 27935 28230 28524',
  '28814 29103 29389 29673 29955 30234 30511 30785 31057 31327',
  '31594 31859 32121 32381 32639 32894 33147 33398 33646 33891',
  '34134 34375 34614 34849 35083 35314 35543 35769 35993 36214',
  '36433 36650 36864 37076 37286 37493 37698 37900 38100 38298',
  '38493 38686 38877 39065 39251 39435 39617 39796 39973 40147',
  '40320 40490 40658 40824 40988 41149 41308 41466 41621 41774',
  '41924 42073 42220 42364 42507 42647 42785 42922 43056 43189',
  '43319 43448 43574 43699 43822 43943 44062 44179 44295 44408',
  '44520 44630 44738 44845 44950 45053 45154 45254 45352 45449',
  '45543 45637 45728 45818 45907 45994 46080 46164 46246 46327',
  '46407 46485 46562 46638 46712 46784 46856 46926 46995 47062',
  '47128 47193 47257 47320 47381 47441 47500 47558 47615 47670',
  '47725 47778 47831 47882 47932 47982 48030 48077 48124 48169',
  '48214 48257 48300 48341 48382 48422 48461 48500 48537 48574',
  '48610 48645 48679 48713 48745 48778 48809 48840 48870 48899',
  '48928 48956 48983 49010 49036 49061 49086 49111 49134 49158',
  '49180 49202 49224 49245 49266 49286 49305 49324 49343 49361',
  '49379 49396 49413 49430 49446 49461 49477 49492 49506 49520',
  '49534 49547 49560 49573 49585 49598 49609 49621 49632 49643',
  '49653 49664 49674 49683 49693 49702 49711 49720 49728 49736',
  '49744 49752 49760 49767 49774 49781 49788 49795 49801 49807',
  '49813 49819 49825 49831 49836 49841 49846 49851 49856 49861',
  '49865 49869 49874 49878 49882 49886 49889 49893 49896 49900',
  '49903 49906 49910 49913 49916 49918 49921 49924 49926 49929',
  '49931 49934 49936 49938 49940 49942 49944 49946 49948 49950',
  '49952 49953 49955 49957 49958 49960 49961 49962 49964 49965',
  '49966 49968 49969 49970 49971 49972 49973 49974 49975 49976',
  '49977 49978 49978 49979 49980 49981 49981 49982 49983 49983',
  '49984 49985 49985 49986 49986 49987 49987 49988 49988 49989',
  '49989 49990 49990 49990 49991 49991 49992 49992 49992 49992',
  '49993 49993 49993 49994 49994 49994 49994 49995 49995 49995',
  '49995 49995 49996 49996 49996 49996 49996 49996 49997 49997',
  '49997 49997 49997 49997 49997 49997 49998 49998 49998 49998',
]);

/** Where the NIST table lives. */
const NIST_URL = 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda3671.htm';

/** Phi(z) as the NIST table gives it, 1/2 plus or minus the cell of |z| (5 decimals), for |z| <= 4.09; null beyond. */
function nistPhi(z) {
  const cell = Math.round(Math.abs(z) * 100);
  if (cell > 409) return null;
  const units = Number(NIST_ROWS[Math.floor(cell / 10)].split(' ')[cell % 10]);
  return z >= 0 ? 0.5 + units / 1e5 : 0.5 - units / 1e5;
}

/** The reference Phi(z) from mpmath: on the grid of 0.1 from -8 to 8, far in the tail, or at the points of the comparison; null elsewhere. */
function referencePhi(z) {
  const i = Math.round(Math.abs(z) * 10);
  if (i <= 80 && Math.abs(Math.abs(z) * 10 - i) < 1e-9) return z <= 0 ? MPMATH_PHI[80 - i] : 1 - MPMATH_PHI[80 - i];
  const known = [...MPMATH_TAILS, ...REFERENCE_POINTS].find(([t]) => t === z);
  return known ? known[1] : null;
}

/**
 * The accuracy of a method against mpmath: the largest absolute error on
 * z = -8, -7.9, ..., 8, and the largest relative error below the mean,
 * where Phi is small, down to z = -37 (Phi = 5.7e-300).
 */
function accuracyOf(compute) {
  let absolute = 0;
  let absAt = 0;
  let relative = 0;
  let relAt = 0;
  const check = (z, ref) => {
    const v = compute(z);
    const e = Number.isFinite(v) ? Math.abs(v - ref) : Infinity;
    if (z >= -8 && e > absolute) {
      absolute = e;
      absAt = z;
    }
    if (z <= 0 && e / ref > relative) {
      relative = e / ref;
      relAt = z;
    }
  };
  for (let i = -80; i <= 80; i++) check(i / 10, referencePhi(i / 10));
  for (const [z, ref] of MPMATH_TAILS) check(z, ref);
  return { absolute, absAt, relative, relAt };
}

/** Every cell of the NIST table against a method rounded to 5 decimals: how many agree, and the ones that do not. */
function nistComparison(compute = cdfOurs) {
  const mismatches = [];
  let agree = 0;
  NIST_ROWS.forEach((row, r) => {
    row.split(' ').forEach((text, c) => {
      const z = (r * 10 + c) / 100;
      const area = compute(z) - 0.5;
      const units = Number(text);
      if (Math.round(area * 1e5) === units) agree++;
      else mismatches.push({ z, table: units / 1e5, ours: area, rounded: Math.round(area * 1e5) / 1e5 });
    });
  });
  return { total: NIST_ROWS.length * 10, agree, mismatches };
}

/** The comparison at the points of REFERENCE_POINTS: the NIST value when the table covers z, mpmath, a method, and their errors. */
function referenceRows(compute = cdfOurs) {
  return REFERENCE_POINTS.map(([z, mpmath]) => {
    const value = compute(z);
    const nist = nistPhi(z);
    return { z, mpmath, nist, value, error: Math.abs(value - mpmath), relative: Math.abs(value - mpmath) / mpmath, nistError: nist === null ? null : Math.abs(nist - mpmath) };
  });
}

/** The points of the table of the two series. */
const SERIES_Z = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);

/** The two series at every z of SERIES_Z: the terms they need, the largest term of the alternating one, the digits it loses to cancellation, and the error of each. */
function seriesRows() {
  return SERIES_Z.map((z) => {
    const reference = 1 - MPMATH_PHI[80 - z * 10];
    const alt = cdfAlternating(z);
    const pos = cdfPositive(z);
    return {
      z,
      reference,
      alternating: { terms: alt.terms, largest: alt.largest, lost: Math.max(0, Math.log10(alt.largest / (reference - 0.5))), error: Math.abs(alt.value - reference) },
      positive: { terms: pos.terms, error: Math.abs(pos.value - reference) },
    };
  });
}

/** The two series at one z with 1, 2, ..., `count` terms: the error of each and the bound of the alternating series. */
function seriesPath(z, count) {
  const reference = referencePhi(z) ?? cdfOurs(z);
  return Array.from({ length: count }, (_, i) => {
    const alt = cdfAlternating(z, { terms: i + 1 });
    const pos = cdfPositive(z, { terms: i + 1 });
    return { terms: i + 1, alternating: Math.abs(alt.value - reference), bound: alt.bound, positive: Math.abs(pos.value - reference) };
  });
}

/** The points of the table of Liouville's S. */
const LIOUVILLE_X = Object.freeze([1, 2, 4, 6, 8, 10]);

/**
 * S(x) = (Phi(x) - 1/2)/phi(x), the only kind of candidate of Liouville's
 * test, at the points of LIOUVILLE_X: its ratio to e^(x^2/2), which tends
 * to sqrt(pi/2), and its apparent degree x S'(x)/S(x) = x (1 + x S)/S. A
 * rational function has a fixed degree at infinity; S has none.
 */
function liouvilleRows() {
  return LIOUVILLE_X.map((x) => {
    const S = cdfPositive(x).S;
    return { x, S, ratio: S / Math.exp((x * x) / 2), degree: (x * (1 + x * S)) / S };
  });
}

/** The thresholds of the 68-95-99.7 rule. */
const RULE_K = Object.freeze([1, 2, 3]);

/** P(|Z| < k) = erf(k/sqrt 2) = 1 - 2 Phi(-k) with the method of the page, as the notes get it from a table of 4 decimals (2 Phi(k) - 1 after rounding), and from mpmath. */
function empiricalRuleRows() {
  return RULE_K.map((k) => ({ k, value: 1 - 2 * cdfOurs(-k), rounded: (2 * Math.round(cdfOurs(k) * 1e4) - 1e4) / 1e4, reference: 1 - 2 * MPMATH_PHI[80 - k * 10] }));
}

/** The largest number of terms a method takes on z = -8, -7.9, ..., 8 (0 for the methods without terms). */
function termsOf(key) {
  const count = { alternating: (z) => cdfAlternating(z).terms, positive: (z) => cdfPositive(z).terms, ours: (z) => cdfOursDetail(z).terms }[key];
  if (!count) return 0;
  let most = 0;
  for (let i = -80; i <= 80; i++) most = Math.max(most, count(i / 10));
  return most;
}

/** How many times each method calls exp: the rules once per node, the series of the notes never, the others once. */
const EXP_CALLS = Object.freeze({ trapezoid: METHOD_N + 1, simpson: METHOD_N + 1, gauss: METHOD_N, alternating: 0, positive: 1, abramowitz: 1, zelen: 1, ours: 1 });

/** The z of the measures of time: 1001 points from -8 to 8, and how many measures of each method. */
const TIMING_Z = Object.freeze(Array.from({ length: 1001 }, (_, i) => -8 + i * 0.016));
const TIMING_RUNS = 11;

/** Nanoseconds per call of a method over TIMING_Z, the calls repeated until they take at least 8 ms. */
function nanosecondsPerCall(compute) {
  const r = timeIt(() => {
    let s = 0;
    for (const z of TIMING_Z) s += compute(z);
    return s;
  }, 8);
  return (r.ms * 1e6) / TIMING_Z.length;
}

/**
 * The median of a sample with its confidence interval from the order
 * statistics: [x_(k), x_(n+1-k)] for the largest k whose binomial coverage
 * 1 - 2 P(Bin(n, 1/2) <= k - 1) is still at least `confidence`. No
 * hypothesis on the shape of the times, which are anything but normal.
 */
function medianInterval(values, confidence = CONFIDENCE) {
  const x = [...values].sort((p, q) => p - q);
  const n = x.length;
  const median = n % 2 ? x[(n - 1) / 2] : (x[n / 2 - 1] + x[n / 2]) / 2;
  let pmf = 0.5 ** n;
  let cum = 0;
  let k = 0;
  let coverage = 1;
  for (let j = 0; j < n; j++) {
    cum += pmf;
    if (1 - 2 * cum < confidence) break;
    k = j + 1;
    coverage = 1 - 2 * cum;
    pmf = (pmf * (n - j)) / (j + 1);
  }
  if (k === 0) return { median, lo: x[0], hi: x[n - 1], coverage: 1 - 2 * 0.5 ** n };
  return { median, lo: x[k - 1], hi: x[n - k], coverage };
}

// ---------------------------------------------------------------------------
// 3. Exercise 1: the functions, and a parser for the one typed in the page
// ---------------------------------------------------------------------------

/*
 * The seven functions of the assignment, and two more of the page:
 *   sine         sin(x) on [0, pi], smooth: both are easy;
 *   square       x^2 on [0, 1], smooth and monotone;
 *   jump         1 on [0, 0.5), 3 on [0.5, 1]: a simple function, the bread
 *                and butter of Lebesgue, whose jump Riemann's strips straddle;
 *   vee          |x - 0.5| on [0, 1]: continuous, with a corner;
 *   unbounded    1/sqrt(x) on (0, 1]: infinite at 0, with a finite integral;
 *                Riemann's integral exists only as a limit (improper), the
 *                Lebesgue integral directly;
 *   indicator    1 on [0, 0.5), 0 on [0.5, 1]: the indicator of a set;
 *   sinc         sin(x)/x on [0, pi], smooth once its value 1 at 0 is set;
 *   oscillating  sin(1/x) on (0, 1]: infinitely many waves near 0, bounded;
 *   traffic      the traffic of a server over a day, in Mb/s, with an attack
 *                at 21:00: Riemann gives the total, Lebesgue the time spent
 *                above every threshold.
 * Dirichlet's and Thomae's functions, the pathological ones, live in
 * section 5b: on a computer every number is a fraction, so they need exact
 * arithmetic. Plus the function typed in the page, read by a small parser
 * and never passed to eval: the site's security policy would not allow it.
 */

const FUNCTIONS = Object.freeze(['sine', 'square', 'jump', 'vee', 'unbounded', 'indicator', 'sinc', 'oscillating', 'traffic']);
const PATHOLOGICAL = Object.freeze(['dirichlet', 'thomae']);
const CUSTOM = 'custom';

/** Where the two step functions of the assignment jump. */
const JUMP_AT = 0.5;

/** 1 before 0.5, 3 from 0.5 on. */
const jump = (x) => (x < JUMP_AT ? 1 : 3);

/** 1 before 0.5, 0 from 0.5 on: the indicator of [0, 0.5). */
const indicator = (x) => (x < JUMP_AT ? 1 : 0);

/** sin(x)/x, with its limit 1 at x = 0. */
const sinc = (x) => (x === 0 ? 1 : Math.sin(x) / x);

/** Si(x) = sum (-1)^k x^(2k+1)/((2k+1) (2k+1)!), the sine integral, for the exact value of the integral of sin(x)/x. */
function sineIntegral(x) {
  let term = x;
  let sum = x;
  for (let k = 1; k < 60; k++) {
    term *= (-x * x) / (2 * k * (2 * k + 1));
    const add = term / (2 * k + 1);
    sum += add;
    if (Math.abs(add) < 1e-17 * Math.abs(sum)) break;
  }
  return sum;
}

/** The traffic of a day, in Mb/s: 100 at night, a bell of 300 around 15:00, and an attack of 850 at 21:00 lasting a quarter of an hour. */
const TRAFFIC = Object.freeze({ base: 100, day: 300, peak: 15, width: 4, attack: 850, at: 21, duration: 0.12 });

const traffic = (t) => TRAFFIC.base + TRAFFIC.day * Math.exp(-(((t - TRAFFIC.peak) / TRAFFIC.width) ** 2)) + TRAFFIC.attack * Math.exp(-(((t - TRAFFIC.at) / TRAFFIC.duration) ** 2));

/** The integral of exp(-((t - c)/s)^2) on [0, 24]: s sqrt(pi)/2 (erf((24 - c)/s) + erf(c/s)), erf through the normal tail. */
const bellIntegral = (c, s) => {
  const erf = (x) => (x >= 0 ? 1 - 2 * normalSf(x * Math.SQRT2) : -1 + 2 * normalSf(-x * Math.SQRT2));
  return ((s * Math.sqrt(Math.PI)) / 2) * (erf((24 - c) / s) + erf(c / s));
};

/** Ci(x) = gamma + ln x + sum (-1)^k x^(2k)/(2k (2k)!), the cosine integral, for the exact value of the integral of sin(1/x). */
function cosineIntegral(x) {
  let term = 1;
  let sum = 0;
  for (let k = 1; k < 60; k++) {
    term *= (-x * x) / ((2 * k - 1) * (2 * k));
    const add = term / (2 * k);
    sum += add;
    if (Math.abs(add) < 1e-17) break;
  }
  return 0.5772156649015329 + Math.log(x) + sum;
}

/**
 * The definition of every function: interval, formula, the function, its
 * exact integral (from a closed form, never from the rules of this file),
 * and the cap of the values when the function is unbounded.
 */
const FUNCTION_DEFS = Object.freeze({
  sine: Object.freeze({ a: 0, b: Math.PI, formula: 'sin(x)', f: Math.sin, exact: 2 }),
  square: Object.freeze({ a: 0, b: 1, formula: 'x^2', f: (x) => x * x, exact: 1 / 3 }),
  jump: Object.freeze({ a: 0, b: 1, formula: '1 if x < 0.5, 3 if x >= 0.5', f: jump, exact: 2 }),
  vee: Object.freeze({ a: 0, b: 1, formula: '|x - 0.5|', f: (x) => Math.abs(x - 0.5), exact: 0.25 }),
  unbounded: Object.freeze({ a: 0, b: 1, formula: '1/sqrt(x)', f: (x) => 1 / Math.sqrt(x), exact: 2, cap: 100, improper: true }),
  indicator: Object.freeze({ a: 0, b: 1, formula: '1 if x < 0.5, 0 if x >= 0.5', f: indicator, exact: 0.5 }),
  sinc: Object.freeze({ a: 0, b: Math.PI, formula: 'sin(x)/x, with 1 at x = 0', f: sinc, exact: sineIntegral(Math.PI) }),
  oscillating: Object.freeze({ a: 0, b: 1, formula: 'sin(1/x), with 0 at x = 0', f: (x) => (x > 0 ? Math.sin(1 / x) : 0), exact: Math.sin(1) - cosineIntegral(1) }),
  traffic: Object.freeze({ a: 0, b: 24, formula: '100 + 300 exp(-((t - 15)/4)^2) + 850 exp(-((t - 21)/0.12)^2)', f: traffic, exact: TRAFFIC.base * 24 + TRAFFIC.day * bellIntegral(TRAFFIC.peak, TRAFFIC.width) + TRAFFIC.attack * bellIntegral(TRAFFIC.at, TRAFFIC.duration) }),
});

/** The caps of the values that the page offers for an unbounded function. */
const CAPS = Object.freeze([10, 100, 1000, 10000]);

/** The longest formula accepted, and its default. */
const FORMULA_MAX = 120;
const DEFAULT_FORMULA = 'x*sin(1/x)';
const DEFAULT_RANGE = Object.freeze([0, 1]);
const RANGE_LIMIT = 1e6;

const FUNCS = Object.freeze({
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, log: Math.log, ln: Math.log,
  log10: Math.log10, sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, sign: Math.sign,
});
const CONSTS = Object.freeze({ pi: Math.PI, e: Math.E });

/** The names the parser knows, for the help line of the page. */
const FORMULA_NAMES = Object.freeze({ functions: Object.freeze(Object.keys(FUNCS)), constants: Object.freeze(Object.keys(CONSTS)) });

/** The tokens of a formula: numbers (decimal point or comma), names, operators. */
function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const number = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (number) {
      tokens.push({ type: 'num', value: Number(number[0].replace(',', '.')), at: i });
      i += number[0].length;
      continue;
    }
    const name = /^[A-Za-z][A-Za-z0-9]*/.exec(text.slice(i));
    if (name) {
      tokens.push({ type: 'name', value: name[0].toLowerCase(), at: i });
      i += name[0].length;
      continue;
    }
    if (c === '*' && text[i + 1] === '*') {
      tokens.push({ type: 'op', value: '^', at: i });
      i += 2;
      continue;
    }
    if ('+-*/^()|'.includes(c)) {
      tokens.push({ type: 'op', value: c, at: i });
      i++;
      continue;
    }
    return { error: 'character', at: i, text: c };
  }
  return { tokens };
}

/**
 * Reads a formula in x: numbers, x, pi, e, + - * / ^ (or **), parentheses,
 * |...| for the absolute value, the functions of FUNCS with one argument,
 * and multiplication without a sign (2x, 3sin(x), x(x + 1)). The result is a
 * tree of small functions, built once: { ok: true, f } or { ok: false,
 * error, at } with the position of the problem.
 */
function parseFormula(text) {
  const t = String(text);
  if (t.trim() === '') return { ok: false, error: 'empty', at: 0 };
  if (t.length > FORMULA_MAX) return { ok: false, error: 'tooLong', at: FORMULA_MAX };
  const lexed = tokenize(t);
  if (lexed.error) return { ok: false, error: lexed.error, at: lexed.at, text: lexed.text };
  const { tokens } = lexed;
  let pos = 0;
  let depth = 0;
  const peek = () => tokens[pos];
  const isOp = (v) => peek() && peek().type === 'op' && peek().value === v;
  const stop = (error, at = peek() ? peek().at : t.length, extra = null) => {
    throw Object.assign(new Error(error), { code: error, at, extra });
  };
  // a primary can be followed by another one without a sign: that is a product
  const startsPrimary = () => peek() && (peek().type === 'num' || peek().type === 'name' || (peek().type === 'op' && (peek().value === '(' || peek().value === '|')));
  function expr() {
    if (++depth > 60) stop('deep');
    let left = term();
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].value;
      const right = term();
      const l = left;
      left = op === '+' ? (x) => l(x) + right(x) : (x) => l(x) - right(x);
    }
    depth--;
    return left;
  }
  function term() {
    let left = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = tokens[pos++].value;
        const right = unary();
        const l = left;
        left = op === '*' ? (x) => l(x) * right(x) : (x) => l(x) / right(x);
      } else if (startsPrimary() && !isOp('|')) {
        const right = power();
        const l = left;
        left = (x) => l(x) * right(x);
      } else {
        return left;
      }
    }
  }
  function unary() {
    if (isOp('-')) {
      pos++;
      const inner = unary();
      return (x) => -inner(x);
    }
    if (isOp('+')) {
      pos++;
      return unary();
    }
    return power();
  }
  function power() {
    const base = primary();
    if (isOp('^')) {
      pos++;
      const exponent = unary();
      return (x) => base(x) ** exponent(x);
    }
    return base;
  }
  function primary() {
    const tok = peek();
    if (!tok) stop('end');
    if (tok.type === 'num') {
      pos++;
      const v = tok.value;
      return () => v;
    }
    if (tok.type === 'name') {
      pos++;
      if (tok.value === 'x') return (x) => x;
      if (Object.prototype.hasOwnProperty.call(CONSTS, tok.value)) {
        const v = CONSTS[tok.value];
        return () => v;
      }
      if (Object.prototype.hasOwnProperty.call(FUNCS, tok.value)) {
        if (!isOp('(')) stop('call', tok.at, tok.value);
        pos++;
        const arg = expr();
        if (!isOp(')')) stop('parens');
        pos++;
        const fn = FUNCS[tok.value];
        return (x) => fn(arg(x));
      }
      return stop('unknown', tok.at, tok.value);
    }
    if (tok.value === '(') {
      pos++;
      const inner = expr();
      if (!isOp(')')) stop('parens');
      pos++;
      return inner;
    }
    if (tok.value === '|') {
      pos++;
      const inner = expr();
      if (!isOp('|')) stop('bars');
      pos++;
      return (x) => Math.abs(inner(x));
    }
    return stop('syntax', tok.at, tok.value);
  }
  try {
    const f = expr();
    if (pos < tokens.length) stop(isOp(')') ? 'parens' : 'syntax', tokens[pos].at, tokens[pos].value);
    return { ok: true, f };
  } catch (error) {
    if (!error.code) throw error;
    return { ok: false, error: error.code, at: error.at, text: error.extra };
  }
}

/** How many points check a typed function on its interval, and the share of them that may be undefined. */
const CHECK_POINTS = 2001;
const UNDEFINED_SHARE = 0.01;

/**
 * A typed function made ready for the two integrals: the formula read, the
 * interval checked, the points where it is not defined (log(0), 0/0) set to
 * 0, which changes no integral as long as they are isolated, and its
 * infinite values kept: the sums then show where Riemann gives up.
 */
function customFunction(formula, a, b) {
  const parsed = parseFormula(formula);
  if (!parsed.ok) return parsed;
  if (!(Number.isFinite(a) && Number.isFinite(b) && a < b)) return { ok: false, error: 'range', at: 0 };
  if (Math.abs(a) > RANGE_LIMIT || Math.abs(b) > RANGE_LIMIT) return { ok: false, error: 'range', at: 0 };
  const raw = parsed.f;
  let undefinedPoints = 0;
  let infinite = 0;
  for (let i = 0; i < CHECK_POINTS; i++) {
    const v = raw(a + ((b - a) * i) / (CHECK_POINTS - 1));
    if (Number.isNaN(v)) undefinedPoints++;
    else if (!Number.isFinite(v)) infinite++;
  }
  if (undefinedPoints > UNDEFINED_SHARE * CHECK_POINTS) return { ok: false, error: 'notDefined', at: 0, share: undefinedPoints / CHECK_POINTS };
  const f = (x) => {
    const v = raw(x);
    return Number.isNaN(v) ? 0 : v;
  };
  return { ok: true, f, a, b, formula, undefinedPoints, infinite };
}

/** One function of the page, catalogued or typed, as { f, a, b, exact (null if unknown), cap }. */
function functionOf(key, custom = null) {
  if (key === CUSTOM) {
    if (!custom || !custom.ok) fail('the typed function is not valid');
    return { key, f: custom.f, a: custom.a, b: custom.b, exact: null, cap: custom.infinite ? CAPS[2] : Infinity, formula: custom.formula };
  }
  const d = FUNCTION_DEFS[key];
  if (!d) fail(`unknown function ${key}`);
  return { key, f: d.f, a: d.a, b: d.b, exact: d.exact, cap: d.cap ?? Infinity, formula: d.formula };
}

/**
 * Adaptive Simpson with a tolerance of 10^-10: it halves only the intervals
 * where the parabolas still disagree. Two ways of stopping short: a depth
 * of 40 halvings around one point (a singularity at an end, which it still
 * handles well) and the budget of evaluations, spent by a function with
 * waves at every scale, where its estimate can be badly off.
 */
function adaptiveSimpson(f, a, b, tolerance = 1e-10, maxDepth = 40, budget = 200000) {
  let evaluations = 0;
  let deepest = 0;
  let exhausted = false;
  const value = (x) => {
    evaluations++;
    const v = f(x);
    return Number.isFinite(v) ? v : 0;
  };
  const simpson = (x0, x1, f0, fm, f1) => ((x1 - x0) / 6) * (f0 + 4 * fm + f1);
  function step(x0, x1, f0, fm, f1, whole, tol, depth) {
    const m = (x0 + x1) / 2;
    const flm = value((x0 + m) / 2);
    const frm = value((m + x1) / 2);
    const left = simpson(x0, m, f0, flm, fm);
    const right = simpson(m, x1, fm, frm, f1);
    deepest = Math.max(deepest, depth);
    // a function that never settles (waves at every scale) would halve forever: a budget stops it
    if (evaluations > budget) exhausted = true;
    if (exhausted || depth >= maxDepth || Math.abs(left + right - whole) <= 15 * tol) return left + right + (left + right - whole) / 15;
    return step(x0, m, f0, flm, fm, left, tol / 2, depth + 1) + step(m, x1, fm, frm, f1, right, tol / 2, depth + 1);
  }
  // the ends are left out by a hair: an infinite value there would stop everything
  const eps = (b - a) * 1e-12;
  const fa = value(a + eps);
  const fb = value(b - eps);
  const fm = value((a + b) / 2);
  const total = step(a + eps, b - eps, fa, fm, fb, simpson(a + eps, b - eps, fa, fm, fb), tolerance, 0);
  return { value: total, evaluations, depth: deepest, exhausted, ok: !exhausted };
}

/** Composite Gauss-Legendre: `nodes` nodes on each of `panels` equal panels. */
function compositeGauss(f, a, b, panels, nodes = 5) {
  const h = (b - a) / panels;
  let s = 0;
  for (let i = 0; i < panels; i++) s += integrate(f, a + i * h, a + (i + 1) * h, 'gauss', nodes);
  return s;
}

/**
 * The integral of a typed function, whose exact value nobody knows. Adaptive
 * Simpson when it finishes within its budget; when it does not (sin(1/x)
 * fools it: its parabolas agree by chance near 0), composite Gauss on 8192
 * and 16384 panels, the finer value with the difference of the two as its
 * uncertainty. It is a third opinion, not the truth: a wave narrower than a
 * panel can still hide anywhere.
 */
function referenceIntegral(f, a, b) {
  const adaptive = adaptiveSimpson(f, a, b);
  if (adaptive.ok) return { value: adaptive.value, method: 'adaptive', uncertainty: null };
  const coarse = compositeGauss(f, a, b, 8192);
  const fine = compositeGauss(f, a, b, 16384);
  return { value: fine, method: 'composite', uncertainty: Math.abs(fine - coarse) };
}

// ---------------------------------------------------------------------------
// 4. Exercise 1: Riemann and Darboux sums
// ---------------------------------------------------------------------------

/*
 * Riemann cuts [a, b] into n strips and takes in each the value of f at one
 * point (the left end, the right end, the middle): sum f(t_i) h. A function
 * is Riemann integrable when every choice of points gives the same limit,
 * and Darboux's test says when: the lower sum (the smallest value of every
 * strip) and the upper sum (the largest) must close in on each other. A
 * computer cannot know the true minimum and maximum of a strip: here they
 * are estimated from DARBOUX_SAMPLES + 1 equally spaced points of the strip,
 * exact for monotone pieces and close for smooth ones.
 */

const RIEMANN_KINDS = Object.freeze(['left', 'right', 'midpoint', 'lower', 'upper']);
const DARBOUX_SAMPLES = 16;

/** Every Riemann sum of f on [a, b] with n strips, and the strips with the values used. */
function riemannSums(f, a, b, n) {
  if (!Number.isInteger(n) || n < 1) fail('n must be a positive integer');
  const h = (b - a) / n;
  const strips = [];
  const sums = { left: 0, right: 0, midpoint: 0, lower: 0, upper: 0 };
  let f0 = f(a);
  let evaluations = 1;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * h;
    const x1 = i === n - 1 ? b : a + (i + 1) * h;
    const f1 = f(x1);
    const fm = f((x0 + x1) / 2);
    evaluations += 2;
    let lo = Math.min(f0, f1, fm);
    let hi = Math.max(f0, f1, fm);
    for (let j = 1; j < DARBOUX_SAMPLES; j++) {
      if (2 * j === DARBOUX_SAMPLES) continue;
      const v = f(x0 + ((x1 - x0) * j) / DARBOUX_SAMPLES);
      evaluations++;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const w = x1 - x0;
    sums.left += f0 * w;
    sums.right += f1 * w;
    sums.midpoint += fm * w;
    sums.lower += lo * w;
    sums.upper += hi * w;
    strips.push({ x0, x1, left: f0, right: f1, midpoint: fm, lower: lo, upper: hi });
    f0 = f1;
  }
  return { n, h, ...sums, strips, evaluations };
}

// ---------------------------------------------------------------------------
// 5. Exercise 1: Lebesgue sums, level sets and the rearrangement
// ---------------------------------------------------------------------------

/*
 * Lebesgue cuts the values instead: levels y_0 < y_1 < ... < y_K from the
 * smallest value m to the largest M, and for each level the measure (the
 * total length) of the set where f >= y_k, whatever shape it has. The simple
 * function equal to y_k where y_k <= f < y_(k+1) lies below f and above
 * f - (M - m)/K, and its integral is the lower Lebesgue sum
 *   L_K = m (b - a) + sum over k of (y_k - y_(k-1)) mu{f >= y_k};
 * with mu{f >= y_(k-1)} it is the upper sum, and the two differ by
 * (M - m)(b - a)/K: they meet as K grows for every bounded measurable
 * function, however wild in x, as long as its level sets can be measured.
 * That is the price: here a level set is found on a grid of LEVEL_CELLS
 * cells and refined with bisection where f crosses the level, so its ends
 * are exact to about 10^-13 even at a jump; a wave that starts and ends
 * inside one cell without crossing the level at the cell's ends is not seen.
 * An unbounded function is cut at a cap T: the sums integrate min(f, T), and
 * what lies above T is the top of the layer cake, the integral from T to
 * infinity of mu{f > y} dy (1/T for 1/sqrt(x)).
 */

const LEVEL_CELLS = 4096;
const BISECTIONS = 44;

/** The values of f on a grid of `cells` cells of [a, b]. */
function sampleGrid(f, a, b, cells = LEVEL_CELLS) {
  const xs = new Float64Array(cells + 1);
  const ys = new Float64Array(cells + 1);
  for (let i = 0; i <= cells; i++) {
    const x = i === cells ? b : a + ((b - a) * i) / cells;
    xs[i] = x;
    ys[i] = f(x);
  }
  return { xs, ys, cells, a, b };
}

/**
 * The set {x : f(x) >= t} on a grid: its measure and, with `collect`, its
 * intervals. Where f crosses t inside a cell, bisection on the predicate
 * f >= t finds the crossing.
 */
function levelSet(grid, f, t, collect = false) {
  const { xs, ys, cells } = grid;
  let measure = 0;
  let evaluations = 0;
  const intervals = collect ? [] : null;
  // the boundary between x0 (inside the set when firstIn) and x1 (on the other side)
  const crossing = (x0, x1, firstIn) => {
    let lo = x0;
    let hi = x1;
    for (let k = 0; k < BISECTIONS; k++) {
      const mid = (lo + hi) / 2;
      if (mid === lo || mid === hi) break;
      evaluations++;
      if ((f(mid) >= t) === firstIn) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  let start = ys[0] >= t ? xs[0] : null;
  const close = (end) => {
    measure += end - start;
    // a level touched at a single point (a peak exactly at the level) is no interval
    if (collect && end > start) intervals.push([start, end]);
    start = null;
  };
  for (let i = 0; i < cells; i++) {
    const inside0 = ys[i] >= t;
    const inside1 = ys[i + 1] >= t;
    if (inside0 && !inside1) close(crossing(xs[i], xs[i + 1], true));
    else if (!inside0 && inside1) start = crossing(xs[i], xs[i + 1], false);
  }
  if (start !== null) close(xs[cells]);
  return { measure, intervals, evaluations };
}

/** The smallest and the largest value of f on a grid, the infinite ones cut at the cap. */
function gridRange(grid, cap) {
  let m = Infinity;
  let M = -Infinity;
  for (const y of grid.ys) {
    const v = y > cap ? cap : y < -cap ? -cap : y;
    if (v < m) m = v;
    if (v > M) M = v;
  }
  return [m, M];
}

/**
 * The Lebesgue sums of f on [a, b] with K equally spaced levels from the
 * smallest value m to the largest M (or the cap): lower, upper, and their
 * mean, which is the sum of the midpoint simple function. With `collect`,
 * the intervals of every level set, for the pictures.
 */
function lebesgueSums(f, a, b, K, { cap = Infinity, grid = null, collect = false } = {}) {
  if (!Number.isInteger(K) || K < 1) fail('K must be a positive integer');
  const g = grid || sampleGrid(f, a, b);
  const [m, M] = gridRange(g, cap);
  const width = b - a;
  const levels = Array.from({ length: K + 1 }, (_, k) => (k === K ? M : m + ((M - m) * k) / K));
  const measures = new Array(K + 1);
  const sets = collect ? [] : null;
  let evaluations = g.cells + 1;
  measures[0] = width;
  for (let k = 1; k <= K; k++) {
    const s = levelSet(g, f, levels[k], collect);
    measures[k] = M > m ? s.measure : width;
    evaluations += s.evaluations;
    if (collect) sets.push(s.intervals);
  }
  let lower = m * width;
  let upper = m * width;
  for (let k = 1; k <= K; k++) {
    const dy = levels[k] - levels[k - 1];
    lower += dy * measures[k];
    upper += dy * measures[k - 1];
  }
  return { K, m, M, levels, measures, lower, upper, midpoint: (lower + upper) / 2, sets, evaluations, cap, capped: M >= cap };
}

/**
 * The values of n (strips) and K (levels) of the comparison: 3, 9, ..., 729.
 * Odd on purpose: the jump at 0.5 of the two step functions then falls
 * inside a strip, as a jump whose place nobody knows would; with an even n
 * it would sit on the edge of two strips and Riemann would be exact by luck.
 */
const COMPARE_N = Object.freeze(Array.from({ length: 6 }, (_, i) => 3 ** (i + 1)));

/** The order of convergence measured on a list of errors: minus the slope of log error against log n, on the errors above the rounding floor. */
function measuredOrder(ns, errors) {
  const points = ns.map((n, i) => [n, errors[i]]).filter(([, e]) => Number.isFinite(e) && e > 1e-13);
  if (points.length < 3) return NaN;
  return -fitLine(points.map(([n]) => Math.log10(n)), points.map(([, e]) => Math.log10(e))).slope;
}

/**
 * Riemann against Lebesgue on one function, for n = K = 3, 9, ..., 729:
 * the Riemann sums, and the Lebesgue sums read off one set of 729 levels
 * (the levels for K = 243 are one every three, and so on). Errors against
 * the exact integral when it is known, against a reference integral
 * otherwise, and the orders of convergence measured on them.
 */
function comparisonStudy(spec) {
  const { f, a, b, cap } = spec;
  const grid = sampleGrid(f, a, b);
  const top = COMPARE_N[COMPARE_N.length - 1];
  const full = lebesgueSums(f, a, b, top, { cap, grid });
  const ref = spec.exact === null ? referenceIntegral(f, a, b) : { value: spec.exact, method: 'exact', uncertainty: 0 };
  const reference = ref.value;
  const width = b - a;
  const rows = COMPARE_N.map((n) => {
    const r = riemannSums(f, a, b, n);
    const every = top / n;
    let lower = full.m * width;
    let upper = full.m * width;
    for (let k = 1; k <= n; k++) {
      const dy = full.levels[k * every] - full.levels[(k - 1) * every];
      lower += dy * full.measures[k * every];
      upper += dy * full.measures[(k - 1) * every];
    }
    const lebesgue = { lower, upper, midpoint: (lower + upper) / 2 };
    const err = (v) => (Number.isFinite(v) ? Math.abs(v - reference) : Infinity);
    return {
      n,
      riemann: { left: r.left, midpoint: r.midpoint, lower: r.lower, upper: r.upper },
      lebesgue,
      errors: { riemann: err(r.midpoint), lebesgue: err(lebesgue.midpoint) },
      gaps: { riemann: r.upper - r.lower, lebesgue: upper - lower },
    };
  });
  const orders = {
    riemann: measuredOrder(COMPARE_N, rows.map((r) => r.errors.riemann)),
    lebesgue: measuredOrder(COMPARE_N, rows.map((r) => r.errors.lebesgue)),
  };
  return { key: spec.key, reference, exact: spec.exact, referenceMethod: ref.method, uncertainty: ref.uncertainty, rows, orders, m: full.m, M: full.M, capped: full.capped, cap };
}

/** Runs a task until at least `minMs` milliseconds have passed, and returns its result with the time of one run. */
function timeIt(task, minMs = 4) {
  const start = now();
  let runs = 0;
  let value;
  let elapsed;
  do {
    value = task();
    runs++;
    elapsed = now() - start;
  } while (elapsed < minMs);
  return { value, ms: elapsed / runs, runs };
}

/** The relative accuracies of the table of costs: the error divided by the integral. */
const EFFICIENCY_TARGETS = Object.freeze([1e-2, 1e-4]);

/**
 * What each approach costs on one function, for n = K = 3, 9, ..., 729. The
 * Riemann sum with midpoints takes n values of f. The Lebesgue sum takes
 * the values that measuring its level sets needs: a grid of 4097 points,
 * then 44 halvings on every crossing of every level. For each, the error,
 * the values of f and the time of one sum, averaged over repeated runs;
 * then, for every relative accuracy of EFFICIENCY_TARGETS, the first n
 * whose error is within that share of the integral.
 */
function efficiencyStudy(spec, reference = spec.exact) {
  const { f, a, b, cap } = spec;
  const err = (v) => (Number.isFinite(v) ? Math.abs(v - reference) : Infinity);
  const rows = COMPARE_N.map((n) => {
    const r = timeIt(() => integrate(f, a, b, 'midpoint', n));
    const l = timeIt(() => lebesgueSums(f, a, b, n, { cap }));
    return {
      n,
      riemann: { value: r.value, error: err(r.value), evaluations: n, ms: r.ms },
      lebesgue: { value: l.value.midpoint, error: err(l.value.midpoint), evaluations: l.value.evaluations, ms: l.ms },
    };
  });
  const reach = (method, target) => rows.find((row) => row[method].error <= target * Math.abs(reference)) ?? null;
  return { key: spec.key, reference, rows, targets: EFFICIENCY_TARGETS.map((target) => ({ target, riemann: reach('riemann', target), lebesgue: reach('lebesgue', target) })) };
}

/**
 * The decreasing rearrangement f*: the values of f at `count` midpoints,
 * sorted from the largest, against s = the measure of the set where f is at
 * least that large. Same area as f, only the order changes: it is the
 * distribution function mu{f >= y} read the other way round, and the load
 * duration curve of an electrical or network engineer.
 */
function rearrangement(f, a, b, count = 1000, cap = Infinity) {
  const h = (b - a) / count;
  const values = new Array(count);
  for (let i = 0; i < count; i++) {
    const v = f(a + (i + 0.5) * h);
    values[i] = v > cap ? cap : v < -cap ? -cap : v;
  }
  const sorted = [...values].sort((p, q) => q - p);
  let area = 0;
  for (const v of sorted) area += v * h;
  return { s: sorted.map((_, i) => (i + 0.5) * h), values: sorted, area, h };
}

/** The traffic thresholds of section 2.6, in Mb/s: how long the link stays above each. */
const TRAFFIC_THRESHOLDS = Object.freeze([150, 200, 300, 350, 500, 600, 800]);

/** Hours above every threshold of the traffic (Lebesgue's level sets), the total transferred (Riemann's integral) and the attack's share of both. */
function trafficReport() {
  const d = FUNCTION_DEFS.traffic;
  const grid = sampleGrid(d.f, d.a, d.b, 24 * 360);
  const rows = TRAFFIC_THRESHOLDS.map((y) => {
    const s = levelSet(grid, d.f, y, true);
    return { y, hours: s.measure, intervals: s.intervals };
  });
  // without the attack: the same day, minus the bump at 21:00
  const quiet = (t) => TRAFFIC.base + TRAFFIC.day * Math.exp(-(((t - TRAFFIC.peak) / TRAFFIC.width) ** 2));
  const quietTotal = integrate(quiet, d.a, d.b, 'gauss', GAUSS_MAX);
  const total = d.exact;
  const riemann = riemannSums(d.f, d.a, d.b, 24 * 60).midpoint;
  // 1 Mb/s for one hour is 3600 megabits, 450 megabytes, 0.45 gigabytes
  return { rows, total, riemann, quietTotal, attackShare: (total - quietTotal) / total, gigabytes: total * 0.45, peak: d.f(TRAFFIC.at) };
}

// ---------------------------------------------------------------------------
// 5b. Exercise 1: Dirichlet's and Thomae's functions, with exact fractions
// ---------------------------------------------------------------------------

/*
 * Dirichlet's function is 1 on the rationals and 0 on the irrationals;
 * Thomae's is 1/q at p/q in lowest terms and 0 on the irrationals. No
 * double can show them: every double is a fraction m/2^e, so a program
 * that asks "is x rational?" gets yes every time. Here the tags of the
 * Riemann sums are exact fractions i/n, or the irrational numbers
 * (i + 1/sqrt 2)/n, written down as such; the largest value of Thomae's
 * function on a strip is 1/q, with q the smallest denominator inside it.
 *   Dirichlet  every strip holds rationals and irrationals: lower sums 0,
 *              upper sums 1, for every n. No Riemann integral. The level
 *              set {f >= t}, 0 < t <= 1, is the set of the rationals of
 *              [0, 1]: countable, of measure 0. Lebesgue integral 0.
 *   Thomae     upper sums go to 0, lower sums are 0: Riemann integral 0.
 *              The level set {f >= 1/Q} is the finite set of the fractions
 *              with q <= Q (Farey's): measure 0. Lebesgue integral 0.
 */

/** Euclid's algorithm. */
function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

/** The smallest denominator q of a fraction p/q in [i/n, (i + 1)/n], in integer arithmetic: 1/q is the largest value of Thomae's function on that strip. */
function smallestDenominator(i, n) {
  for (let q = 1; q < n; q++) {
    const lo = i * q;
    const hi = (i + 1) * q;
    const pLo = (lo - (lo % n)) / n + (lo % n ? 1 : 0);
    const pHi = (hi - (hi % n)) / n;
    if (pLo <= pHi) return q;
  }
  return n;
}

/** Thomae's function as a program that trusts the doubles sees it: x = m/2^e in lowest terms gives 1/2^e. */
function thomaeOnDoubles(x) {
  if (!Number.isFinite(x)) return 0;
  let v = Math.abs(x);
  let q = 1;
  while (!Number.isInteger(v)) {
    v *= 2;
    q *= 2;
  }
  return 1 / q;
}

/** Dirichlet's function as the same program sees it: always 1, since every double is a fraction. */
const dirichletOnDoubles = () => 1;

/** The numbers of strips of the two pathological functions. */
const PATHOLOGICAL_N = Object.freeze([10, 100, 1000, 10000]);

/** How many fractions of [0, 1] have a denominator up to Q: 1 + phi(1) + ... + phi(Q), the length of Farey's sequence, with Euler's phi from a sieve. */
function fareyLength(Q) {
  const totient = Array.from({ length: Q + 1 }, (_, i) => i);
  for (let p = 2; p <= Q; p++) {
    if (totient[p] !== p) continue;
    for (let k = p; k <= Q; k += p) totient[k] -= totient[k] / p;
  }
  let total = 1;
  for (let q = 1; q <= Q; q++) total += totient[q];
  return total;
}

/** The denominators of the level sets of Thomae's function shown by the page: {f >= 1/Q} for these Q. */
const FAREY_Q = Object.freeze([10, 100, 1000]);

/**
 * The sums of the two functions for every n of PATHOLOGICAL_N: Riemann with
 * rational tags i/n and with irrational tags, the lower and upper Darboux
 * sums, the Lebesgue sum, and the left sum of a program that trusts the
 * doubles. Dirichlet's sums need no loop: every strip holds both kinds of
 * numbers. Thomae's upper sums are added up strip by strip.
 */
function pathologicalStudy(ns = PATHOLOGICAL_N) {
  const dirichlet = ns.map((n) => ({ n, rational: 1, irrational: 0, lower: 0, upper: 1, lebesgue: 0, doubles: 1 }));
  const thomae = ns.map((n) => {
    let rational = 0;
    let upper = 0;
    let doubles = 0;
    for (let i = 0; i < n; i++) {
      rational += gcd(i, n);
      upper += 1 / smallestDenominator(i, n);
      doubles += thomaeOnDoubles(i / n);
    }
    return { n, rational: rational / (n * n), irrational: 0, lower: 0, upper: upper / n, lebesgue: 0, doubles: doubles / n };
  });
  const farey = FAREY_Q.map((Q) => ({ Q, level: 1 / Q, points: fareyLength(Q), measure: 0 }));
  return { dirichlet, thomae, farey, upperOrder: measuredOrder(ns, thomae.map((r) => r.upper)) };
}

// ---------------------------------------------------------------------------
// 6. Random numbers: SplitMix64, xoshiro128**, Box-Muller, Monte Carlo
// ---------------------------------------------------------------------------

/*
 * The generators of Homework #3 and #4: SplitMix64 turns a 64-bit number
 * into the initial state of xoshiro128**, which draws the numbers. Every
 * stream (the normal sample, the heavy-tailed one, Monte Carlo, the coins)
 * starts SplitMix64 from seed x 2^32 + j, XOR the golden ratio times the
 * number of the stream, so the streams never meet and every repetition j is
 * the same whatever the others do.
 */

const MASK64 = (1n << 64n) - 1n;
const GOLDEN = 0x9e3779b97f4a7c15n;

/** SplitMix64 (Steele, Lea and Flood, 2014), as in Vigna's reference code: 64-bit outputs, as BigInt. */
function splitMix64(seed) {
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

/** The streams of the page. */
const STREAMS = Object.freeze(['normal', 'heavy', 'mc', 'coins']);

/** The initial state of stream `stream`, repetition j (from 0): two outputs of SplitMix64 as four 32-bit words. */
function streamState(seed, stream, j) {
  const index = STREAMS.indexOf(stream);
  if (index < 0) fail(`unknown stream ${stream}`);
  const start = (BigInt(seed >>> 0) << 32n) | BigInt(j >>> 0);
  const next = splitMix64(start ^ ((GOLDEN * BigInt(index)) & MASK64));
  const a = next();
  const b = next();
  return [Number(a & 0xffffffffn), Number(a >> 32n), Number(b & 0xffffffffn), Number(b >> 32n)];
}

/** A stream: xoshiro128** from streamState. */
const generator = (seed, stream, j) => xoshiro128ss(...streamState(seed, stream, j));

/** A uniform double in (0, 1) from two outputs: 53 random bits, never 0 and never 1. */
const uniform53 = (next) => ((next() >>> 5) * 67108864 + (next() >>> 6) + 0.5) / 9007199254740992;

/** A new seed from the cryptographic generator, when there is one (the seed does not protect anything). */
function randomSeed() {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') return c.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}

/** Standard normal values by Box-Muller (1958): two uniforms give two independent normals, sqrt(-2 ln u1) (cos, sin)(2 pi u2). */
function normalSampler(next) {
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

/** The degrees of freedom of the heavy-tailed data: Student's t with 3, rescaled to variance 1. */
const HEAVY_DF = 3;

/** Values of Student's t with HEAVY_DF degrees of freedom divided by sqrt(df/(df - 2)): mean 0, variance 1, like N(0, 1), but with heavy tails. */
function heavySampler(next) {
  const z = normalSampler(next);
  const scale = Math.sqrt((HEAVY_DF - 2) / HEAVY_DF);
  return () => {
    const x = z();
    let chi2 = 0;
    for (let i = 0; i < HEAVY_DF; i++) {
      const w = z();
      chi2 += w * w;
    }
    return (x / Math.sqrt(chi2 / HEAVY_DF)) * scale;
  };
}

/** P(X > x) for the heavy-tailed data: Student's t tail at x sqrt(df/(df - 2)). */
const heavySf = (x) => studentSf(x * Math.sqrt(HEAVY_DF / (HEAVY_DF - 2)), HEAVY_DF);

/** The largest gap between the distribution functions of the heavy-tailed law and of N(0, 1): what the Kolmogorov-Smirnov test has to see. */
function heavyDistance() {
  let best = 0;
  let at = 0;
  for (let i = 0; i <= 8000; i++) {
    const x = -8 + i / 500;
    const d = Math.abs(1 - heavySf(x) - normalCdf(x));
    if (d > best) {
      best = d;
      at = x;
    }
  }
  return { distance: best, at };
}

/**
 * One Monte Carlo estimate of the integral of f on [a, b] with N uniform
 * points: (b - a) times the mean of f, the mean and the variance with
 * Welford's three lines (Homework #4), and the 95% interval
 * estimate +- 1.96 (b - a) s/sqrt(N).
 */
function monteCarlo(f, a, b, N, next) {
  let mean = 0;
  let ss = 0;
  for (let k = 1; k <= N; k++) {
    const v = f(a + (b - a) * uniform53(next));
    const delta = v - mean;
    mean += delta / k;
    ss += delta * (v - mean);
  }
  const width = b - a;
  const se = (width * Math.sqrt(ss / (N - 1))) / Math.sqrt(N);
  const estimate = width * mean;
  return { estimate, se, lo: estimate - Z95 * se, hi: estimate + Z95 * se };
}

/** The running Monte Carlo estimate of one function at the checkpoints, with its 95% band: the animation of section 2.7. */
function monteCarloPath(f, a, b, checkpoints, next) {
  const out = [];
  let mean = 0;
  let ss = 0;
  let k = 0;
  const width = b - a;
  for (const target of checkpoints) {
    while (k < target) {
      k++;
      const v = f(a + width * uniform53(next));
      const delta = v - mean;
      mean += delta / k;
      ss += delta * (v - mean);
    }
    const se = k > 1 ? (width * Math.sqrt(ss / (k - 1))) / Math.sqrt(k) : NaN;
    out.push({ k, estimate: width * mean, se });
  }
  return out;
}

/** The euro coins, in cents, and how often each turns up in a pocket (the small ones more often). */
const COINS = Object.freeze([1, 2, 5, 10, 20, 50, 100, 200]);
const COIN_WEIGHTS = Object.freeze([9, 8, 7, 6, 5, 4, 3, 2]);
const HANDFUL = 24;

/**
 * A handful of HANDFUL coins, the `draw`-th of the seed: in the order they
 * come out of the pocket (Riemann adds them up in that order), and grouped
 * by value (Lebesgue counts how many of each and multiplies). The total is
 * the same, in integer cents, so no rounding can hide a difference.
 */
function handful(seed, draw) {
  const next = generator(seed, 'coins', draw);
  const total = COIN_WEIGHTS.reduce((s, w) => s + w, 0);
  const coins = [];
  for (let i = 0; i < HANDFUL; i++) {
    let r = uniform53(next) * total;
    let c = 0;
    while (r >= COIN_WEIGHTS[c] && c < COINS.length - 1) r -= COIN_WEIGHTS[c++];
    coins.push(COINS[c]);
  }
  const running = [];
  let sum = 0;
  for (const v of coins) running.push((sum += v));
  const groups = COINS.map((value) => {
    const count = coins.filter((v) => v === value).length;
    return { value, count, subtotal: value * count };
  }).filter((g) => g.count > 0).reverse();
  return { coins, running, groups, total: sum, byGroups: groups.reduce((s, g) => s + g.subtotal, 0) };
}

/**
 * The exact fraction of a double, m/2^k with m an odd integer (or 0): every
 * finite double is one, so every number a computer stores is rational. The
 * Dirichlet function, 1 on the rationals and 0 elsewhere, is therefore 1 at
 * every point a program can ask about.
 */
function exactFraction(x) {
  if (!Number.isFinite(x)) fail('only finite numbers have a fraction');
  if (x === 0) return { numerator: '0', power: 0, denominator: '1' };
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const hi = view.getUint32(0);
  const lo = view.getUint32(4);
  const negative = hi >>> 31 === 1;
  const exponent = (hi >>> 20) & 0x7ff;
  let mantissa = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let power;
  if (exponent === 0) {
    power = 1074; // subnormal: m 2^-1074
  } else {
    mantissa |= 1n << 52n;
    power = 1075 - exponent;
  }
  while (power > 0 && (mantissa & 1n) === 0n) {
    mantissa >>= 1n;
    power--;
  }
  const scale = power < 0 ? 2n ** BigInt(-power) : 1n;
  const numerator = (negative ? -1n : 1n) * mantissa * scale;
  return { numerator: numerator.toString(), power: Math.max(0, power), denominator: (2n ** BigInt(Math.max(0, power))).toString() };
}

// ---------------------------------------------------------------------------
// 7. Statistics: special functions and hypothesis tests
// ---------------------------------------------------------------------------

/*
 * The references of this file never use its quadrature rules: Phi and its
 * tail come from the incomplete gamma function (a series and a continued
 * fraction, as in Homework #3 and #4), Student's t from the incomplete beta
 * function. A rule checked against itself would prove nothing.
 */

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

/** Probability that |Z| > z for a standard normal Z. */
function twoSidedNormalTail(z) {
  return gammaQ(0.5, (z * z) / 2);
}

/** P(Z > x), accurate also far in the upper tail: erfc(x/sqrt(2))/2 = Q(1/2, x^2/2)/2. The reference of Exercise 2. */
function normalSf(x) {
  return x >= 0 ? 0.5 * gammaQ(0.5, (x * x) / 2) : 1 - 0.5 * gammaQ(0.5, (x * x) / 2);
}

/** Phi(x) = P(Z <= x), the reference of Exercise 2: no quadrature inside. */
function normalCdf(x) {
  return normalSf(-x);
}

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

/** The regularized incomplete beta function I_x(a, b): Lentz's continued fraction, on the side where it converges fast. */
function betaIncomplete(x, a, b) {
  if (!(x > 0)) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (front * betaFraction(x, a, b)) / a;
  return 1 - (front * betaFraction(1 - x, b, a)) / b;
}

/** P(T > t) for Student's t with df degrees of freedom: I_(df/(df + t^2))(df/2, 1/2)/2 for t >= 0, and symmetric. */
function studentSf(t, df) {
  const tail = 0.5 * betaIncomplete(df / (df + t * t), df / 2, 0.5);
  return t >= 0 ? tail : 1 - tail;
}

/** Sample mean, variance (n - 1), skewness and kurtosis of a list of numbers. */
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
 * P(K > x) for Kolmogorov's limit law, the law of sqrt(n) D_n:
 * 2 sum_(k >= 1) (-1)^(k-1) exp(-2 k^2 x^2), and for small x, where that
 * series converges slowly, 1 - sqrt(2 pi)/x sum_(k >= 1) exp(-(2k - 1)^2 pi^2/(8 x^2)).
 */
function kolmogorovSf(x) {
  if (!(x > 0)) return 1;
  if (x < 1) {
    let s = 0;
    for (let k = 1; k <= 20; k++) s += Math.exp((-((2 * k - 1) ** 2) * Math.PI * Math.PI) / (8 * x * x));
    return Math.min(1, Math.max(0, 1 - (Math.sqrt(2 * Math.PI) / x) * s));
  }
  let s = 0;
  for (let k = 1; k <= 100; k++) {
    const term = Math.exp(-2 * k * k * x * x);
    s += k % 2 ? term : -term;
    if (term < 1e-18) break;
  }
  return Math.min(1, Math.max(0, 2 * s));
}

/**
 * Kolmogorov-Smirnov test of data (sorted in increasing order) against a
 * distribution function F: D = the largest gap between F and the empirical
 * distribution function, and the p-value from Kolmogorov's law at
 * (sqrt(n) + 0.12 + 0.11/sqrt(n)) D, Stephens' correction for finite n.
 */
function ksTest(sorted, F) {
  const n = sorted.length;
  let D = 0;
  let at = 0;
  for (let i = 0; i < n; i++) {
    const v = F(sorted[i]);
    const d = Math.max(v - i / n, (i + 1) / n - v);
    if (d > D) {
      D = d;
      at = i;
    }
  }
  const root = Math.sqrt(n);
  const statistic = (root + 0.12 + 0.11 / root) * D;
  return finish({ kind: 'ks', n, D, at: sorted[at], statistic, pValue: kolmogorovSf(statistic) });
}

/** z-test of an observed proportion against p0: z = (rate - p0)/sqrt(p0 (1 - p0)/m). */
function proportionTest(count, m, p0) {
  const rate = count / m;
  const z = (rate - p0) / Math.sqrt((p0 * (1 - p0)) / m);
  return finish({ kind: 'proportion', count, rate, expected: p0, m, z, pValue: twoSidedNormalTail(z) });
}

/** z-test of the mean of m estimates against the exact value, with their own standard deviation. */
function biasTest(mean, sd, m, exact) {
  const z = (mean - exact) / (sd / Math.sqrt(m));
  return finish({ kind: 'bias', mean, expected: exact, m, z, pValue: twoSidedNormalTail(z) });
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

// ---------------------------------------------------------------------------
// 8. The experiments
// ---------------------------------------------------------------------------

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

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

/** The alarm threshold of the tests: 3 standard deviations, the classic three-sigma rule. */
const ALARM_K = 3;

/** The points of the empirical distribution function drawn by the page: at most this many. */
const ECDF_POINTS = 400;

/**
 * A simulated sample against the numerical Phi: sorted values, the
 * Kolmogorov-Smirnov test, the share above ALARM_K standard deviations
 * against P(Z > 3), moments, and the empirical distribution function at
 * evenly spaced ranks for the chart.
 */
function sampleReport(values) {
  const sorted = Float64Array.from(values).sort();
  const ks = ksTest(sorted, (x) => cdfStandard(x));
  const above = sorted.length - lowerBound(sorted, ALARM_K);
  const tail = proportionTest(above, sorted.length, tailDirect(ALARM_K));
  const n = sorted.length;
  const step = Math.max(1, Math.floor(n / ECDF_POINTS));
  const ecdf = [];
  for (let i = 0; i < n; i += step) ecdf.push([sorted[i], (i + 1) / n]);
  return { n, ks, tail, above, moments: sampleMoments(sorted), ecdf, min: sorted[0], max: sorted[n - 1] };
}

/** The first index of a sorted array whose value is at least x. */
function lowerBound(sorted, x) {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Everything random of the page, step by step (the browser draws between
 * steps): a normal sample by Box-Muller and a heavy-tailed one, both against
 * the numerical Phi; then, for every function of Exercise 1, `reps` Monte Carlo
 * estimates with `points` points each, their spread, and how often their
 * 95% intervals contain the exact integral.
 */
function* exploreSteps(params = {}) {
  const p = checkParams(params);
  const started = now();
  const normal = normalSampler(generator(p.seed, 'normal', 0));
  const normalValues = Array.from({ length: p.sample }, normal);
  yield;
  const normalReport = sampleReport(normalValues);
  yield;
  const heavy = heavySampler(generator(p.seed, 'heavy', 0));
  const heavyValues = Array.from({ length: p.sample }, heavy);
  yield;
  const heavyReport = sampleReport(heavyValues);
  yield;
  const mc = {};
  for (const [index, key] of FUNCTIONS.entries()) {
    const spec = functionOf(key);
    const estimates = new Float64Array(p.reps);
    let covered = 0;
    let seSum = 0;
    for (let r = 0; r < p.reps; r++) {
      const e = monteCarlo(spec.f, spec.a, spec.b, p.points, generator(p.seed, 'mc', index * 4096 + r));
      estimates[r] = e.estimate;
      seSum += e.se;
      if (e.lo <= spec.exact && spec.exact <= e.hi) covered++;
      if (r % 64 === 63) yield;
    }
    const moments = sampleMoments(estimates);
    const sd = Math.sqrt(moments.variance);
    let squares = 0;
    for (const v of estimates) squares += (v - spec.exact) ** 2;
    mc[key] = {
      exact: spec.exact,
      mean: moments.mean,
      sd,
      meanSe: seSum / p.reps,
      rmse: Math.sqrt(squares / p.reps),
      covered,
      coverage: covered / p.reps,
      skewness: moments.skewness,
      kurtosis: moments.kurtosis,
      estimates: Array.from(estimates),
      coverageTest: proportionTest(covered, p.reps, CONFIDENCE),
      biasTest: biasTest(moments.mean, sd, p.reps, spec.exact),
    };
  }
  // Riemann against Lebesgue on every function: no randomness, but a few hundred milliseconds
  const compare = {};
  for (const key of FUNCTIONS) {
    compare[key] = comparisonStudy(functionOf(key));
    yield;
  }
  // what the two approaches cost, in values of f and in time
  const efficiency = {};
  for (const key of FUNCTIONS) {
    efficiency[key] = efficiencyStudy(functionOf(key), compare[key].reference);
    yield;
  }
  // the methods of Exercise 2 against the clock, in turns, so that a slow moment of the computer weighs on all of them alike
  const runs = Object.fromEntries(CDF_METHODS.map((key) => [key, []]));
  for (let r = 0; r < TIMING_RUNS; r++) {
    for (const key of CDF_METHODS) {
      runs[key].push(nanosecondsPerCall(cdfBy[key]));
      yield;
    }
  }
  const timing = Object.fromEntries(CDF_METHODS.map((key) => [key, { ...medianInterval(runs[key]), runs: runs[key] }]));
  return { params: p, normal: normalReport, heavy: heavyReport, mc, compare, efficiency, timing, heavyDistance: heavyDistance(), simMs: now() - started, draws: 2 * p.sample + FUNCTIONS.length * p.reps * p.points };
}

const explore = (options) => runSteps(exploreSteps(options));
const exploreAsync = (options, scheduling) => runStepsAsync(() => exploreSteps(options), scheduling);

/** The hypothesis tests of the page, by group: the model of Exercise 2, and Monte Carlo on every function of Exercise 1. */
function statisticalTests(s) {
  const model = [
    ['ksNormal', s.normal.ks],
    ['tailNormal', s.normal.tail],
    ['ksHeavy', s.heavy.ks],
    ['tailHeavy', s.heavy.tail],
  ];
  const coverage = FUNCTIONS.map((key) => [key, s.mc[key].coverageTest]);
  const bias = FUNCTIONS.map((key) => [key, s.mc[key].biasTest]);
  return { model, coverage, bias };
}

// ---------------------------------------------------------------------------
// 9. Charts (browser, <canvas>)
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

/** A label under the x axis, centred on its tick but kept inside the canvas: the last tick of a chart often lies on its right edge. */
function xTickLabel(ctx, label, x, y, width) {
  const half = ctx.measureText(label).width / 2;
  ctx.fillText(label, Math.min(Math.max(x, half + 1), width - half - 1), y);
}

/** Background, grid, tick labels and frame of a plot with linear axes. */
function drawFrame(ctx, pal, { width, height, margin, w, h, px, py, xTicks, yTicks, decimal, yLabel = null }) {
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
    ctx.fillText((yLabel || axisLabel)(v, decimal), margin.left - 4, py(v) + 4);
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
}

const LINE_ASPECT = 0.56;
const LINE_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };
const HIST_ASPECT = 0.56;
const HIST_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };
const AREA_ASPECT = 0.5;
const AREA_MARGIN = { left: 44, right: 12, top: 10, bottom: 24 };

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
function drawLineChart(canvas, { x, series, logX = false, logY = false, yMin = 0, yMax = 1, yTicks = [], xTicks = [], yFormat = null, hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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
 * exact value). The legend is in the page.
 */
function drawHistogram(canvas, { x0, x1, bars, curve = null, marker = null, yMax = null, xTicks = [], hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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

/** Where the plots of drawQuadrature and drawIntegral lie on a canvas of this width. */
function areaLayout(data, width, aspect = AREA_ASPECT) {
  const height = Math.round(width * aspect);
  const margin = AREA_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const px = (v) => margin.left + (w * (v - data.x0)) / (data.x1 - data.x0);
  const py = (v) => margin.top + h * (1 - (Math.min(data.yMax, Math.max(data.yMin, v)) - data.yMin) / (data.yMax - data.yMin));
  const vy = (Y) => data.yMin + ((margin.top + h - Y) / h) * (data.yMax - data.yMin);
  return { margin, w, h, height, px, py, vy };
}

/** The parabola through (x0, y0), (xm, ym), (x1, y1), with xm in the middle, at x. */
const parabolaAt = (p, x) => {
  const t = (x - p.x0) / (p.x1 - p.x0);
  return p.y0 * (1 - t) * (1 - 2 * t) + 4 * p.ym * t * (1 - t) + p.y1 * t * (2 * t - 1);
};

/**
 * The integral of Exercise 2 in a picture: the curve of a density, the area
 * under it between `from` and `to` shaded, the pieces that a rule adds up
 * (rulePieces: rectangles, trapezoids, parabolas, Gauss's strips with their
 * nodes as dots) and a dashed marker at `to`.
 */
function drawQuadrature(canvas, { x0, x1, yMin = 0, yMax, curve, from = null, to = null, pieces = [], xTicks = [], yTicks = [], hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, AREA_ASPECT, knownWidth);
  const L = areaLayout({ x0, x1, yMin, yMax }, width);
  drawFrame(ctx, pal, { width, height, ...L, xTicks, yTicks, decimal });
  ctx.save();
  ctx.beginPath();
  ctx.rect(L.margin.left, L.margin.top, L.w, L.h);
  ctx.clip();
  if (from !== null && to !== null && to > from && !hidden.includes('area')) {
    const inside = curve.filter(([x]) => x >= from && x <= to);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = pal.series[0];
    ctx.beginPath();
    ctx.moveTo(L.px(from), L.py(0));
    for (const [x, y] of inside) ctx.lineTo(L.px(x), L.py(y));
    ctx.lineTo(L.px(to), L.py(0));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  (hidden.includes('pieces') ? [] : pieces).forEach((p, i) => {
    const color = i % 2 ? pal.series[3] : pal.series[1];
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (p.kind === 'rect' || p.kind === 'node') {
      ctx.rect(L.px(p.x0), L.py(p.y), L.px(p.x1) - L.px(p.x0), L.py(0) - L.py(p.y));
    } else if (p.kind === 'trap') {
      ctx.moveTo(L.px(p.x0), L.py(0));
      ctx.lineTo(L.px(p.x0), L.py(p.y0));
      ctx.lineTo(L.px(p.x1), L.py(p.y1));
      ctx.lineTo(L.px(p.x1), L.py(0));
      ctx.closePath();
    } else if (p.kind === 'parab') {
      ctx.moveTo(L.px(p.x0), L.py(0));
      for (let s = 0; s <= 24; s++) {
        const x = p.x0 + ((p.x1 - p.x0) * s) / 24;
        ctx.lineTo(L.px(x), L.py(parabolaAt(p, x)));
      }
      ctx.lineTo(L.px(p.x1), L.py(0));
      ctx.closePath();
    }
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (p.kind === 'node' || (p.kind === 'rect' && p.tag !== undefined)) {
      ctx.beginPath();
      ctx.arc(L.px(p.tag), L.py(p.y), 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  if (!hidden.includes('curve')) {
    ctx.strokeStyle = pal.series[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    curve.forEach(([x, y], i) => (i ? ctx.lineTo(L.px(x), L.py(y)) : ctx.moveTo(L.px(x), L.py(y))));
    ctx.stroke();
  }
  if (to !== null && !hidden.includes('marker')) {
    ctx.strokeStyle = pal.reference;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(L.px(to), L.margin.top);
    ctx.lineTo(L.px(to), L.margin.top + L.h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

const INTEGRAL_ASPECT = 0.56;

/** The complement of a list of disjoint, sorted intervals inside [a, b]. */
function complement(intervals, a, b) {
  const out = [];
  let x = a;
  for (const [s, e] of intervals) {
    if (s > x) out.push([x, s]);
    x = Math.max(x, e);
  }
  if (x < b) out.push([x, b]);
  return out;
}

/**
 * The integral of Exercise 1 in a picture: the graph of f, and under it either
 * Riemann's strips (rectangles standing on the x axis, as high as f at the
 * chosen point, `kind`) or Lebesgue's layers: for every level y_k the set
 * where f >= y_k, drawn as a band between y_(k-1) and y_k (its negative part
 * where f < y_k, for the levels below 0). The bands of one level have one
 * colour: a level set is rarely one interval.
 */
function drawIntegral(canvas, { a, b, yMin, yMax, curve, mode = 'riemann', strips = [], kind = 'midpoint', levels = [], sets = [], xTicks = [], yTicks = [], hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, INTEGRAL_ASPECT, knownWidth);
  const L = areaLayout({ x0: a, x1: b, yMin, yMax }, width, INTEGRAL_ASPECT);
  drawFrame(ctx, pal, { width, height, ...L, xTicks, yTicks, decimal });
  ctx.save();
  ctx.beginPath();
  ctx.rect(L.margin.left, L.margin.top, L.w, L.h);
  ctx.clip();
  const zero = L.py(0);
  const box = (x0, x1, y0, y1) => ctx.rect(L.px(x0), L.py(Math.max(y0, y1)), Math.max(0.6, L.px(x1) - L.px(x0)), Math.abs(L.py(y0) - L.py(y1)));
  if (mode === 'riemann') {
    (hidden.includes('strips') ? [] : strips).forEach((s, i) => {
      const v = s[kind];
      if (!Number.isFinite(v) && v !== Infinity) return;
      ctx.fillStyle = i % 2 ? pal.series[3] : pal.series[1];
      ctx.beginPath();
      box(s.x0, s.x1, 0, Math.min(v, yMax * 2));
      ctx.globalAlpha = 0.24;
      ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  } else if (!hidden.includes('layers')) {
    // the base, from 0 to the smallest value m, over the whole interval
    if (levels.length && levels[0] !== 0) {
      ctx.fillStyle = pal.series[6];
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      box(a, b, 0, levels[0]);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (let k = 1; k < levels.length; k++) {
      const set = sets[k - 1] || [];
      const color = k % 2 ? pal.series[0] : pal.series[2];
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.4;
      const y0 = levels[k - 1];
      const y1 = levels[k];
      ctx.beginPath();
      if (y1 > 0) for (const [s, e] of set) box(s, e, Math.max(0, y0), y1);
      if (y0 < 0) for (const [s, e] of complement(set, a, b)) box(s, e, y0, Math.min(0, y1));
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    for (const y of levels) {
      ctx.strokeStyle = pal.text;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(L.margin.left, L.py(y));
      ctx.lineTo(L.margin.left + L.w, L.py(y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = pal.text;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(L.margin.left, zero);
  ctx.lineTo(L.margin.left + L.w, zero);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = pal.series[4];
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  let pen = false;
  for (const [x, y] of hidden.includes('curve') ? [] : curve) {
    if (!Number.isFinite(y)) {
      pen = false;
      continue;
    }
    if (pen) ctx.lineTo(L.px(x), L.py(y));
    else ctx.moveTo(L.px(x), L.py(y));
    pen = true;
  }
  ctx.stroke();
  ctx.restore();
}

/** The height that a chart function gives a canvas of this width, to reserve the space before drawing. */
function chartHeight(draw, data, width) {
  if (draw === drawLineChart) return lineLayout(data, width).height;
  if (draw === drawQuadrature) return Math.round(width * AREA_ASPECT);
  if (draw === drawIntegral) return Math.round(width * INTEGRAL_ASPECT);
  return histLayout(data, width).height;
}

/**
 * What lies under the point (x, y) of a chart drawn at this width, in CSS
 * pixels from its top left corner; null outside the plot. For lines, the
 * index of the nearest x; for the pictures of the rules, the piece; for
 * Riemann, the strip; for Lebesgue, the level band under the pointer; for
 * histograms, the bar. `rect` is the rectangle to outline.
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
  if (draw === drawQuadrature) {
    const L = areaLayout(data, width);
    if (x < L.margin.left || x > L.margin.left + L.w || y < L.margin.top || y > L.margin.top + L.h) return null;
    const off = data.hidden || [];
    // senza pezzi (la campana della sezione 2.3) si indica il punto della curva piu' vicino
    if (!data.pieces.length && data.curve && data.curve.length) {
      if (off.includes('curve')) return null;
      let index = 0;
      data.curve.forEach(([cx], i) => {
        if (Math.abs(L.px(cx) - x) < Math.abs(L.px(data.curve[index][0]) - x)) index = i;
      });
      return { kind: 'curve', index, rect: { x: L.px(data.curve[index][0]) - 3, y: L.margin.top, width: 6, height: L.h } };
    }
    if (off.includes('pieces')) return null;
    const index = data.pieces.findIndex((p) => x >= L.px(p.x0) && x <= L.px(p.x1));
    if (index < 0) return null;
    const p = data.pieces[index];
    return { kind: 'piece', index, rect: { x: L.px(p.x0), y: L.margin.top, width: L.px(p.x1) - L.px(p.x0), height: L.h } };
  }
  if (draw === drawIntegral) {
    const L = areaLayout({ x0: data.a, x1: data.b, yMin: data.yMin, yMax: data.yMax }, width, INTEGRAL_ASPECT);
    if (x < L.margin.left || x > L.margin.left + L.w || y < L.margin.top || y > L.margin.top + L.h) return null;
    if (data.mode === 'riemann') {
      if ((data.hidden || []).includes('strips')) return null;
      const index = data.strips.findIndex((s) => x >= L.px(s.x0) && x <= L.px(s.x1));
      if (index < 0) return null;
      const s = data.strips[index];
      return { kind: 'strip', index, rect: { x: L.px(s.x0), y: L.margin.top, width: L.px(s.x1) - L.px(s.x0), height: L.h } };
    }
    if ((data.hidden || []).includes('layers')) return null;
    const value = L.vy(y);
    const k = data.levels.findIndex((level, i) => i > 0 && value >= data.levels[i - 1] && value <= level);
    if (k < 1) return null;
    const top = L.py(data.levels[k]);
    return { kind: 'level', index: k, rect: { x: L.margin.left, y: top, width: L.w, height: Math.max(2, L.py(data.levels[k - 1]) - top) } };
  }
  const { margin, w, h, px } = histLayout(data, width);
  if (x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
  if ((data.hidden || []).includes('bars')) return null;
  let index = data.bars.findIndex((b) => x >= px(b.from) && x < px(b.to));
  // barre sottili come aste (Thomae, sezione 1.8): vale la piu' vicina entro `snap` pixel
  if (index < 0 && data.snap) {
    let best = data.snap;
    data.bars.forEach((b, i) => {
      const d = Math.abs((px(b.from) + px(b.to)) / 2 - x);
      if (d <= best) {
        best = d;
        index = i;
      }
    });
  }
  if (index < 0) return null;
  const b = data.bars[index];
  const left = Math.min(px(b.from), (px(b.from) + px(b.to)) / 2 - 3);
  const right = Math.max(px(b.to), (px(b.from) + px(b.to)) / 2 + 3);
  return { kind: 'bar', index, rect: { x: left, y: margin.top, width: right - left, height: h } };
}

/**
 * The reverse of chartHitTest: what the pointer would hit on the point
 * `index` of a line chart; null for any other chart or index. A row of a
 * table uses it to outline its point.
 */
function chartHitAt(draw, data, width, index) {
  if (draw === drawLineChart) {
    const { margin, h, xs } = lineLayout(data, width);
    if (!(index >= 0 && index < xs.length)) return null;
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
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
const attachChartTooltip = (canvas, { draw, data, describe: explain, link = null }) =>
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
function attachPointerLabel(canvas, locate, link = null) {
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
// 10. Checks, printed report and command line
// ---------------------------------------------------------------------------

/*
 * Independent checks: the Gauss-Legendre rule against its closed form and
 * NumPy's leggauss, the rules on polynomials they integrate exactly, Phi,
 * its tails and its quantiles against mpmath at 40 digits, the exact
 * integrals of Exercise 1 against mpmath and Python, the tail of Student's t
 * and Kolmogorov's law against SciPy 1.17.1, the generators against their
 * reference C code (Homework #4) and against an independent Python
 * implementation of the streams of this page, and the exact fractions
 * against Python's fractions module.
 */
const CHECK_VECTORS = Object.freeze([
  { group: 'quadrature', name: 'Gauss-Legendre, 5 nodes: the largest, sqrt(5 + 2 sqrt(10/7))/3 (NumPy leggauss)', expected: 0.906179845938664, compute: () => gaussLegendre(5).nodes[4] },
  { group: 'quadrature', name: 'Gauss-Legendre, 5 nodes: the weight of the middle one, 128/225', expected: 0.5688888888888889, compute: () => gaussLegendre(5).weights[2] },
  { group: 'quadrature', name: 'Gauss-Legendre, 5 nodes: the outer weight, (322 - 13 sqrt(70))/900', expected: 0.23692688505618908, compute: () => gaussLegendre(5).weights[0] },
  { group: 'quadrature', name: 'Simpson on x^3 over [0, 2] with n = 2: exact for cubics', expected: 4, compute: () => integrate((x) => x ** 3, 0, 2, 'simpson', 2) },
  { group: 'quadrature', name: 'Gauss with 3 nodes on x^5 - 2x^4 + 1 over [-1, 1]: exact up to degree 5', expected: 1.2, compute: () => integrate((x) => x ** 5 - 2 * x ** 4 + 1, -1, 1, 'gauss', 3) },
  { group: 'quadrature', name: 'Midpoints on x^2 over [0, 1] with n = 4: 1/3 - 1/192', expected: 0.328125, compute: () => integrate((x) => x * x, 0, 1, 'midpoint', 4) },
  { group: 'quadrature', name: 'Trapezoids on x^2 over [0, 1] with n = 4: 1/3 + 1/96', expected: 0.34375, compute: () => integrate((x) => x * x, 0, 1, 'trapezoid', 4) },
  { group: 'normal', name: 'Phi(1), 64 Gauss nodes (mpmath, 40 digits)', expected: 0.8413447460685429, compute: () => cdfStandard(1) },
  { group: 'normal', name: 'Phi(1.96), 64 Gauss nodes (mpmath)', expected: 0.9750021048517796, compute: () => cdfStandard(1.96) },
  { group: 'normal', name: 'Phi(-3) with the substitution (mpmath)', expected: 0.0013498980316300946, compute: () => cdfStandard(-3, { strategy: 'substitution' }) },
  { group: 'normal', name: 'P(Z > 5) integrated directly (mpmath)', expected: 2.866515718791939e-7, compute: () => tailDirect(5) },
  { group: 'normal', name: 'P(Z > 8) integrated directly (mpmath)', expected: 6.220960574271784e-16, compute: () => tailDirect(8) },
  { group: 'normal', name: 'Quantile 0.975 with Newton (mpmath)', expected: 1.959963984540054, compute: () => quantileNewton(0.975).z },
  { group: 'normal', name: 'Quantile 0.9999 with Newton (mpmath, for 0.9999 as stored, 0.99990000000000001101...)', expected: 3.7190164854557084, compute: () => quantileNewton(0.9999).z },
  { group: 'normal', name: 'Alarm threshold for P(Z > k) = 10^-6 (mpmath)', expected: 4.753424308822899, compute: () => alarmThreshold(1e-6).k },
  { group: 'normal', name: 'Table of the normal at z = 1.00, Simpson step by step (mpmath)', expected: 0.8413447460685429, compute: () => zTable().table[10].cells[0].value },
  { group: 'normal', name: 'The reference Phi(1.96), incomplete gamma (mpmath)', expected: 0.9750021048517796, compute: () => normalCdf(1.96) },
  { group: 'integrals', name: 'Ci(1), the cosine integral (mpmath)', expected: 0.33740392290096816, compute: () => cosineIntegral(1) },
  { group: 'integrals', name: 'Integral of sin(1/x) over (0, 1], sin(1) - Ci(1) (mpmath)', expected: 0.5040670619069284, compute: () => FUNCTION_DEFS.oscillating.exact },
  { group: 'integrals', name: 'Integral of sin(x)/x over [0, pi], Si(pi), the sine integral (mpmath)', expected: 1.8519370519824663, compute: () => FUNCTION_DEFS.sinc.exact },
  { group: 'integrals', name: 'Traffic: the integral of the day, closed form (mpmath quad)', expected: 4706.179234345086, compute: () => FUNCTION_DEFS.traffic.exact },
  { group: 'integrals', name: 'Lebesgue on the jump 1-3 with the levels 1, 1.5, ..., 3: the lower sum is exact', expected: 2, compute: () => lebesgueSums(jump, 0, 1, 4).lower },
  { group: 'integrals', name: 'Thomae: the left sum with n = 1000, (1/n^2) sum of gcd(i, n) (Python, exact)', expected: 0.0085, compute: () => pathologicalStudy([1000]).thomae[0].rational },
  { group: 'integrals', name: 'Farey: the fractions of [0, 1] with denominator up to 100 (Python)', expected: 3045, compute: () => fareyLength(100) },
  { group: 'integrals', name: 'Heavy tails: P(X > 3), Student t with 3 df at 3 sqrt(3) (SciPy t.sf)', expected: 0.006923416494429522, compute: () => heavySf(3) },
  { group: 'integrals', name: 'Kolmogorov: P(K > 1.3580986393225507) (SciPy kolmogi)', expected: 0.05, compute: () => kolmogorovSf(1.3580986393225507) },
  { group: 'integrals', name: 'Parser: 2x^2 - 3(x + 1) at x = 2', expected: -1, compute: () => parseFormula('2x^2 - 3(x + 1)').f(2) },
  { group: 'integrals', name: 'Parser: |x - 1| + sqrt(4) at x = -1', expected: 4, compute: () => parseFormula('|x - 1| + sqrt(4)').f(-1) },
  { group: 'integrals', name: 'Exact fraction of 0.1 (Python fractions)', expected: '3602879701896397/2^55', compute: () => { const r = exactFraction(0.1); return `${r.numerator}/2^${r.power}`; } },
  { group: 'integrals', name: 'Exact fraction of pi/4 (Python fractions)', expected: '884279719003555/2^50', compute: () => { const r = exactFraction(Math.PI / 4); return `${r.numerator}/2^${r.power}`; } },
  { group: 'cdf', name: 'The series of the notes: Phi(1) (mpmath)', expected: 0.8413447460685429, compute: () => cdfAlternating(1).value },
  { group: 'cdf', name: 'The positive series: Phi(1.96) (mpmath)', expected: 0.9750021048517796, compute: () => cdfPositive(1.96).value },
  { group: 'cdf', name: 'The method of the page: Phi(-2), continued fraction (mpmath)', expected: 0.02275013194817921, compute: () => cdfOurs(-2) },
  { group: 'cdf', name: 'The method of the page: Phi(-37) (mpmath)', expected: 5.725571222524577e-300, compute: () => cdfOurs(-37) },
  { group: 'cdf', name: 'Abramowitz and Stegun 7.1.26: largest error on [-8, 8] within 7.5e-8, half the bound of erf', expected: 'yes', compute: () => (accuracyOf(cdfAS).absolute <= ERF_AS.bound / 2 ? 'yes' : 'no') },
  { group: 'cdf', name: 'Zelen and Severo 26.2.17: largest error on [-8, 8] within 7.5e-8', expected: 'yes', compute: () => (accuracyOf(cdfZS).absolute <= CDF_ZS.bound ? 'yes' : 'no') },
  { group: 'cdf', name: 'NIST table: cells that agree with the method of the page (z = 1.36 is misprinted)', expected: 409, compute: () => nistComparison().agree },
  { group: 'generator', name: 'xoshiro128** from (1, 2, 3, 4)', expected: '11520 0 5927040 70819200 2031721883 1637235492', compute: () => { const g = xoshiro128ss(1, 2, 3, 4); return Array.from({ length: 6 }, g).join(' '); } },
  { group: 'generator', name: 'SplitMix64 from 0', expected: '16294208416658607535 7960286522194355700 487617019471545679', compute: () => { const g = splitMix64(0); return Array.from({ length: 3 }, g).join(' '); } },
  { group: 'generator', name: 'Normal stream, seed 2026 (independent Python code)', expected: '1441997221 504457382 1212262897 368519188', compute: () => { const g = generator(2026, 'normal', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Monte Carlo stream 0, seed 2026 (Python)', expected: '2564833005 3707597774 700057353 3153315336', compute: () => { const g = generator(2026, 'mc', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Coin stream 0, seed 2026 (Python)', expected: '2753327663 3794412426 3548633717 3932290691', compute: () => { const g = generator(2026, 'coins', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Box-Muller: the first two normal values, seed 2026 (Python)', expected: '-0.2973509092608619 1.447208380667575', compute: () => { const z = normalSampler(generator(2026, 'normal', 0)); return `${z()} ${z()}`; } },
]);

/** Every check, with what was expected and what came out: equal strings, or numbers within a relative error of 10^-9. */
function verifyAll() {
  return CHECK_VECTORS.map((v) => {
    const actual = v.compute();
    const ok = typeof v.expected === 'string' ? actual === v.expected : Math.abs(actual - v.expected) <= 1e-9 * Math.max(1e-300, Math.abs(v.expected));
    return { group: v.group, name: v.name, expected: String(v.expected), actual: String(actual), ok };
  });
}

const pad = (v, width) => String(v).padStart(width);
const fixed = (v, digits) => (Number.isFinite(v) ? v.toFixed(digits) : v === Infinity ? 'inf' : 'n/a');
const sci = (v) => (v === 0 ? '0' : Number.isFinite(v) ? v.toExponential(2) : v === Infinity ? 'inf' : 'n/a');
const fmtP = (t) => {
  if (t.pValue === 0) return '< 1e-300';
  return t.pValue < 0.001 ? t.pValue.toExponential(1) : t.pValue.toFixed(3);
};
const seconds = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(0)} ms`);

/** The names of the hypothesis tests, as the command line prints them. */
const TEST_LABELS = Object.freeze({
  model: {
    ksNormal: 'the Box-Muller sample follows the normal law of the numerical Phi (Kolmogorov-Smirnov)',
    tailNormal: 'in the Box-Muller sample the share above 3 standard deviations is P(Z > 3)',
    ksHeavy: 'the heavy-tailed sample follows the same normal law (false on purpose)',
    tailHeavy: 'in the heavy-tailed sample the share above 3 standard deviations is P(Z > 3) (false on purpose)',
  },
  coverage: Object.fromEntries(FUNCTIONS.map((key) => [key, `the 95% Monte Carlo intervals of ${key} contain the exact integral 95% of the times`])),
  bias: Object.fromEntries(FUNCTIONS.map((key) => [key, `the Monte Carlo estimates of ${key} have the exact integral as their mean`])),
});

/**
 * Command line: node homework5.js [--z 1.96] [--mu 0] [--sigma 1]
 * [--rule left|midpoint|trapezoid|simpson|gauss] [--n 16]
 * [--function square|bell|steps|oscillating|unbounded|traffic]
 * [--formula "x*sin(1/x)" --a 0 --b 1] [--seed 2026 | --random-seed]
 * [--sample 10000] [--points 1000] [--reps 1000]. Options are checked
 * strictly: anything unknown or malformed prints the usage.
 */
function runCli(argv, print = console.log) {
  const usage = () => {
    print('usage: node homework5.js [--z 1.96] [--mu 0] [--sigma 1] [--rule left|midpoint|trapezoid|simpson|gauss] [--n 16]');
    print(`       [--function ${FUNCTIONS.join('|')}] [--formula "x*sin(1/x)" --a 0 --b 1]`);
    print(`       [--seed 2026 | --random-seed] [--sample ${DEFAULT_SAMPLE}] [--points ${DEFAULT_POINTS}] [--reps ${DEFAULT_REPS}]`);
    print(`       n from 1 to 100000 (Simpson even, Gauss at most ${GAUSS_MAX}); sigma > 0; sample from ${LIMITS.sample[0]} to ${LIMITS.sample[1]}, points from ${LIMITS.points[0]} to ${LIMITS.points[1]}, reps from ${LIMITS.reps[0]} to ${LIMITS.reps[1]}.`);
    return 1;
  };
  const options = { seed: DEFAULT_SEED, sample: DEFAULT_SAMPLE, points: DEFAULT_POINTS, reps: DEFAULT_REPS };
  let z = CONVERGENCE_Z;
  let mu = 0;
  let sigma = 1;
  let rule = 'simpson';
  let n = 16;
  let only = null;
  let formula = null;
  let a = DEFAULT_RANGE[0];
  let b = DEFAULT_RANGE[1];
  const number = (value, range) => (value === undefined ? { ok: false } : parseNumber(value, range));
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--random-seed') options.seed = randomSeed();
    else if ((arg === '--z' || arg === '--mu') && number(value, [-1e6, 1e6]).ok) {
      if (arg === '--z') z = number(value, [-1e6, 1e6]).value;
      else mu = number(value, [-1e6, 1e6]).value;
      i++;
    } else if (arg === '--sigma' && number(value, [1e-9, 1e6]).ok) {
      sigma = number(value, [1e-9, 1e6]).value;
      i++;
    } else if (arg === '--rule' && RULES.includes(value)) {
      rule = value;
      i++;
    } else if (arg === '--n' && value !== undefined && parseInteger(value, [1, 100000]).ok) {
      n = parseInteger(value, [1, 100000]).value;
      i++;
    } else if (arg === '--function' && FUNCTIONS.includes(value)) {
      only = value;
      i++;
    } else if (arg === '--formula' && value !== undefined) {
      formula = value;
      i++;
    } else if ((arg === '--a' || arg === '--b') && number(value, [-RANGE_LIMIT, RANGE_LIMIT]).ok) {
      if (arg === '--a') a = number(value, [-RANGE_LIMIT, RANGE_LIMIT]).value;
      else b = number(value, [-RANGE_LIMIT, RANGE_LIMIT]).value;
      i++;
    } else if (['--seed', '--sample', '--points', '--reps'].includes(arg) && value !== undefined && parseInteger(value, LIMITS[arg.slice(2)]).ok) {
      options[arg.slice(2)] = parseInteger(value, LIMITS[arg.slice(2)]).value;
      i++;
    } else {
      return usage();
    }
  }
  if ((rule === 'simpson' && n % 2) || (rule === 'gauss' && n > GAUSS_MAX)) return usage();
  const checks = verifyAll();
  const failed = checks.filter((r) => !r.ok);
  print(`Checks: ${checks.length - failed.length} of ${checks.length} passed (Gauss-Legendre against its closed form and NumPy, Phi, its tails and quantiles against mpmath, the exact integrals against mpmath, Student's t and Kolmogorov's law against SciPy 1.17.1, the generators against their reference C code and an independent Python implementation).`);
  failed.forEach((r) => print(`  FAILED ${r.name}: expected ${r.expected}, got ${r.actual}`));
  print('');

  const s = explore(options);
  const ord = (v) => (Number.isFinite(v) ? v.toFixed(2) : '-');

  // --- Exercise 1
  print('EXERCISE 1 - Riemann and Lebesgue integration.');
  let custom = null;
  if (formula !== null) {
    custom = customFunction(formula, a, b);
    if (!custom.ok) {
      print(`  The formula "${formula}" cannot be used (${custom.error}${custom.at !== undefined ? ` at ${custom.at}` : ''}).`);
      return 1;
    }
  }
  const keys = custom ? [CUSTOM] : only ? [only] : FUNCTIONS;
  const studies = {};
  for (const key of keys) {
    const spec = functionOf(key, custom);
    const st = key === CUSTOM ? comparisonStudy(spec) : s.compare[key];
    studies[key] = st;
    const how = { exact: 'exact', adaptive: 'adaptive Simpson', composite: `composite Gauss +- ${sci(st.uncertainty)}` }[st.referenceMethod];
    print(`  ${key === CUSTOM ? `f(x) = ${spec.formula}` : `${key}: ${spec.formula}`} on [${Number(spec.a.toPrecision(12))}, ${Number(spec.b.toPrecision(12))}], ${how} ${st.reference.toPrecision(12)}${Number.isFinite(spec.cap) ? `, values cut at ${spec.cap}` : ''}`);
    for (const row of st.rows.filter((_, i) => i % 2 === 1)) {
      const r = row.riemann;
      const l = row.lebesgue;
      print(`    n = K = ${pad(row.n, 3)}  Riemann left ${fixed(r.left, 6)}, mid ${fixed(r.midpoint, 6)}, lower ${fixed(r.lower, 6)}, upper ${fixed(r.upper, 6)} | Lebesgue lower ${fixed(l.lower, 6)}, upper ${fixed(l.upper, 6)}, mid ${fixed(l.midpoint, 6)}`);
    }
    print(`    measured orders of the midpoint sums, n = K = ${COMPARE_N[0]} to ${COMPARE_N[COMPARE_N.length - 1]}: Riemann ${ord(st.orders.riemann)}, Lebesgue ${ord(st.orders.lebesgue)}`);
  }
  print('');
  const top = COMPARE_N[COMPARE_N.length - 1];
  print(`Results side by side, ${top} strips and ${top} levels, midpoints:`);
  print(`  ${'function'.padEnd(12)} ${'integral'.padStart(18)} ${'Riemann'.padStart(18)} ${'Lebesgue'.padStart(18)} ${'error R'.padStart(9)} ${'error L'.padStart(9)}`);
  for (const key of keys) {
    const last = studies[key].rows[studies[key].rows.length - 1];
    print(`  ${key.padEnd(12)} ${studies[key].reference.toPrecision(12).padStart(18)} ${last.riemann.midpoint.toPrecision(12).padStart(18)} ${last.lebesgue.midpoint.toPrecision(12).padStart(18)} ${sci(last.errors.riemann).padStart(9)} ${sci(last.errors.lebesgue).padStart(9)}`);
  }
  print('');
  if (!custom) {
    print(`Cost of reaching a relative error of ${EFFICIENCY_TARGETS.map((t) => t.toExponential(0)).join(' and ')}: values of f and time of one sum (Riemann with midpoints, Lebesgue with its level sets):`);
    for (const key of keys) {
      const e = s.efficiency[key];
      const cell = (hit) => (hit ? `n = ${pad(hit.n, 3)}, ${pad(hit.evaluations, 7)} values, ${hit.ms.toFixed(3)} ms` : 'not reached with 729');
      for (const t of e.targets) print(`  ${key.padEnd(12)} ${t.target.toExponential(0)}  Riemann ${cell(t.riemann && t.riemann.riemann ? { n: t.riemann.n, ...t.riemann.riemann } : null).padEnd(42)} Lebesgue ${cell(t.lebesgue && t.lebesgue.lebesgue ? { n: t.lebesgue.n, ...t.lebesgue.lebesgue } : null)}`);
    }
    print('');
  }
  const pat = pathologicalStudy();
  print("Dirichlet's function (1 on the rationals, 0 elsewhere), with exact fractions: for every n the rational tags give 1, the irrational ones 0, lower sums 0, upper sums 1, so there is no Riemann integral; the level sets are the rationals, a countable set of measure 0, so the Lebesgue integral is 0. On doubles every number is a fraction: the left sums give 1.");
  print("Thomae's function (1/q at p/q, 0 elsewhere):");
  print(`  ${'n'.padStart(6)}  ${'rational tags'.padStart(14)}  ${'irrational'.padStart(10)}  ${'lower'.padStart(6)}  ${'upper'.padStart(10)}  ${'on doubles'.padStart(10)}`);
  for (const r of pat.thomae) print(`  ${pad(r.n, 6)}  ${r.rational.toPrecision(6).padStart(14)}  ${pad(0, 10)}  ${pad(0, 6)}  ${r.upper.toPrecision(6).padStart(10)}  ${r.doubles.toPrecision(6).padStart(10)}`);
  print(`  upper sums fall with order ${ord(pat.upperOrder)}: Riemann integral 0. Level sets {f >= 1/Q}: ${pat.farey.map((r) => `Q = ${r.Q}: ${r.points} points`).join(', ')}, finite, of measure 0: Lebesgue integral 0.`);
  print('');
  const tr = trafficReport();
  print(`The traffic of the day: ${tr.total.toFixed(1)} Mb/s x hours = ${tr.gigabytes.toFixed(0)} GB (Riemann, minute by minute: ${tr.riemann.toFixed(1)}); the attack is ${(100 * tr.attackShare).toFixed(1)}% of it. Hours above each threshold (Lebesgue):`);
  print(`  ${tr.rows.map((r) => `${r.y} Mb/s: ${r.hours.toFixed(3)} h`).join(', ')}`);
  print('');
  print(`Monte Carlo: ${s.params.reps} estimates of ${s.params.points} points for every function, seed ${s.params.seed} (all the experiments: ${seconds(s.simMs)}):`);
  for (const key of FUNCTIONS) {
    const m = s.mc[key];
    print(`  ${key.padEnd(12)} exact ${m.exact.toPrecision(8).padStart(12)}  mean ${m.mean.toPrecision(8).padStart(12)}  sd ${sci(m.sd).padStart(9)}  coverage ${(100 * m.coverage).toFixed(1)}%`);
  }
  print('');

  // --- Exercise 2
  print('EXERCISE 2 - The normal CDF.');
  print("Liouville: R' - x R = 1 would need a rational R; its solutions are S + C e^(x^2/2), with S(x) = (Phi(x) - 1/2)/phi(x):");
  for (const r of liouvilleRows()) print(`  x = ${pad(r.x, 2)}  S(x) = ${r.S.toPrecision(10).padStart(16)}  S/e^(x^2/2) = ${r.ratio.toFixed(6)}  apparent degree ${r.degree.toFixed(2)}`);
  print(`  S/e^(x^2/2) tends to sqrt(pi/2) = ${Math.sqrt(Math.PI / 2).toFixed(6)} and the degree keeps growing: no rational function does that, so Phi has no elementary formula.`);
  print('erf: P(|Z| < k) = erf(k/sqrt 2) = 1 - 2 Phi(-k):');
  for (const r of empiricalRuleRows()) print(`  k = ${r.k}  method of the page ${r.value.toPrecision(16)}  mpmath ${r.reference.toPrecision(16)}  from a table of 4 decimals ${r.rounded.toFixed(4)}`);
  print('');
  const x = mu + sigma * z;
  print(`Numerical integration: X ~ N(${mu}, ${sigma}^2), x = ${Number(x.toPrecision(12))}, z = (x - mu)/sigma = ${z}.`);
  print(`  F(x) = Phi(z), reference (incomplete gamma, no quadrature): ${normalCdf(z).toPrecision(17)}`);
  print(`  ${'rule'.padEnd(10)} ${'n'.padStart(6)}  ${'F(x)'.padStart(20)}  ${'error'.padStart(9)}`);
  for (const r of RULES) {
    const k = validN(r, n);
    const v = cdfStandard(z, { rule: r, n: k });
    print(`  ${r.padEnd(10)} ${pad(k, 6)}  ${v.toPrecision(17).padStart(20)}  ${sci(Math.abs(v - normalCdf(z))).padStart(9)}`);
  }
  print('');
  print(`Around -infinity, error of Phi(z) with ${STRATEGY_RULES.map((s) => `${s.rule} n = ${s.n}`).join(' and ')}:`);
  const header = STRATEGY_RULES.flatMap((s) => STRATEGIES.flatMap((st) => (st === 'truncation' ? TRUNCATIONS.map((L) => `${s.rule[0]}:trunc-${L}`) : [`${s.rule[0]}:${st.slice(0, 5)}`])));
  print(`  ${'z'.padStart(5)}  ${header.map((h) => h.padStart(11)).join(' ')}`);
  for (const row of strategyRows()) print(`  ${pad(row.z, 5)}  ${row.cells.map((c) => sci(c.error).padStart(11)).join(' ')}`);
  print('');
  const conv = convergenceStudy();
  print(`Convergence on Phi(${conv.z}) = ${conv.reference.toPrecision(16)} (symmetry, [0, ${conv.z}]): error against n`);
  print(`  ${'n'.padStart(6)}  ${RULES.map((r) => r.padStart(10)).join(' ')}`);
  for (const row of conv.rows) print(`  ${pad(row.n, 6)}  ${RULES.map((r) => (row.errors[r] === null ? '-' : sci(row.errors[r])).padStart(10)).join(' ')}`);
  print(`  measured orders: ${RULES.map((r) => `${r} ${Number.isFinite(conv.orders[r]) ? conv.orders[r].toFixed(2) : '-'}`).join(', ')} (theory 1, 2, 2, 4, exponential)`);
  print(`  values of phi for 10 correct decimals: ${RULES.map((r) => `${r} ${conv.enough[r] ?? '> 16384'}`).join(', ')}`);
  print('');
  print('The two series: terms needed, largest term of the alternating one, digits it loses, errors:');
  print(`  ${'z'.padStart(2)}  ${'notes: terms'.padStart(12)} ${'largest'.padStart(9)} ${'lost'.padStart(5)} ${'error'.padStart(9)}   ${'positive: terms'.padStart(15)} ${'error'.padStart(9)}`);
  for (const r of seriesRows()) print(`  ${pad(r.z, 2)}  ${pad(r.alternating.terms, 12)} ${sci(r.alternating.largest).padStart(9)} ${r.alternating.lost.toFixed(1).padStart(5)} ${sci(r.alternating.error).padStart(9)}   ${pad(r.positive.terms, 15)} ${sci(r.positive.error).padStart(9)}`);
  print('');
  print(`Every method against mpmath (largest absolute error on [-8, 8], largest relative error below the mean down to z = -37), with its cost and its time per call (median of ${TIMING_RUNS} runs, ${Math.round(100 * s.timing.ours.coverage)}% interval):`);
  print(`  ${'method'.padEnd(12)} ${'absolute'.padStart(9)} ${'relative'.padStart(9)} ${'exp'.padStart(4)} ${'terms'.padStart(6)} ${'ns per call'.padStart(26)}`);
  for (const key of CDF_METHODS) {
    const acc = accuracyOf(cdfBy[key]);
    const t = s.timing[key];
    print(`  ${key.padEnd(12)} ${sci(acc.absolute).padStart(9)} ${(acc.relative >= 1 ? '>= 1' : sci(acc.relative)).padStart(9)} ${pad(EXP_CALLS[key], 4)} ${pad(termsOf(key), 6)} ${`${t.median.toFixed(0)} [${t.lo.toFixed(0)}, ${t.hi.toFixed(0)}]`.padStart(26)}`);
  }
  print('');
  const nist = nistComparison();
  print(`The NIST/SEMATECH table (${NIST_URL}): ${nist.agree} of ${nist.total} cells agree with the method of the page rounded to 5 decimals.`);
  for (const m of nist.mismatches) print(`  z = ${m.z.toFixed(2)}: the table prints ${m.table.toFixed(5)}, the method gives ${m.ours.toFixed(10)}, which rounds to ${m.rounded.toFixed(5)}; mpmath agrees with the method.`);
  print('At several points, against NIST and mpmath:');
  print(`  ${'z'.padStart(5)}  ${'NIST'.padStart(7)}  ${'mpmath'.padStart(22)}  ${'method of the page'.padStart(22)}  ${'error'.padStart(9)}`);
  for (const r of referenceRows()) print(`  ${String(r.z).padStart(5)}  ${(r.nist === null ? '-' : r.nist.toFixed(5)).padStart(7)}  ${r.mpmath.toPrecision(16).padStart(22)}  ${r.value.toPrecision(16).padStart(22)}  ${sci(r.error).padStart(9)}`);
  print('');
  const zt = zTable();
  print(`The table of the standard normal, Phi(z), z = row + column (one Simpson parabola per step of 0.01, ${zt.evaluations} values of phi; largest error ${sci(zt.maxError)} at z = ${zt.at.toFixed(2)}):`);
  print(`  ${'z'.padStart(4)}  ${Array.from({ length: ZTABLE.cols }, (_, c) => `.0${c}`.padStart(6)).join(' ')}`);
  for (const row of zt.table) print(`  ${row.row.toFixed(1).padStart(4)}  ${row.cells.map((c) => c.value.toFixed(4).padStart(6)).join(' ')}`);
  print('');
  print('Quantiles backwards with Newton on the smaller tail, w <- w + (P(Z > w) - q)/phi(w), from w = 0:');
  for (const p of QUANTILE_LEVELS) {
    const q = quantileNewton(p);
    print(`  p = ${String(p).padEnd(6)}  z_p = ${q.z.toPrecision(16)}  ${q.steps.length} steps  (reference ${q.reference.toPrecision(16)})`);
  }
  print('');
  print('Tails P(Z > k): 1 - Phi(k) against Phi(-k) integrated directly, relative errors:');
  print(`  ${'k'.padStart(2)}  ${'reference'.padStart(10)}  ${'1 - Phi(k)'.padStart(10)} ${'error'.padStart(9)}  ${'direct'.padStart(10)} ${'error'.padStart(9)}`);
  for (const r of tailRows()) print(`  ${pad(r.k, 2)}  ${sci(r.reference).padStart(10)}  ${sci(r.subtraction).padStart(10)} ${sci(r.subtractionError).padStart(9)}  ${sci(r.direct).padStart(10)} ${sci(r.directError).padStart(9)}`);
  const events = 1e6;
  for (const perDay of [1, 1 / 7]) {
    const t = alarmThreshold(perDay / events);
    print(`  ${events.toExponential(0)} events a day, ${perDay === 1 ? 'one false alarm a day' : 'one false alarm a week'}: k = ${t.k.toFixed(4)} standard deviations; with heavy tails (Student t, 3 df) the same k gives ${(events * heavySf(t.k)).toFixed(1)} a day`);
  }
  print('');

  print(`Simulated data, ${s.params.sample} values: Box-Muller D = ${s.normal.ks.D.toFixed(4)}, share above 3 sd ${(s.normal.tail.rate * 100).toFixed(3)}%; heavy tails D = ${s.heavy.ks.D.toFixed(4)}, share above 3 sd ${(s.heavy.tail.rate * 100).toFixed(3)}% (normal law ${(100 * tailDirect(ALARM_K)).toFixed(3)}%)`);
  print('');
  const all = Object.entries(statisticalTests(s)).flatMap(([group, list]) => list.map(([k, test]) => ({ group, key: k, test })));
  print(`Hypothesis tests, alpha = ${SIGNIFICANCE}:`);
  for (const { group, key: k, test } of all) print(`  ${group.padEnd(9)} ${fmtP(test).padEnd(9)} ${test.verdict === 'reject' ? '[rejected] ' : ''}${TEST_LABELS[group][k]}`);
  return failed.length ? 1 : 0;
}

/** True under Node, where the downloadable program can run runCli. */
const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);

return { DEFAULT_SEED, DEFAULT_SAMPLE, DEFAULT_POINTS, DEFAULT_REPS, LIMITS, SIGNIFICANCE, CONFIDENCE, Z95, parseInteger, parseNumber, checkParams, SQRT_2PI, phi, normalDensity, RULES, RULE_ORDER, GAUSS_MAX, gaussLegendre, integrate, evaluationsOf, validN, rulePieces, STRATEGIES, TRUNCATIONS, TRUNCATION, PRECISE, substituted, cdfStandard, normalCdfNumeric, tailBySubtraction, tailDirect, STRATEGY_POINTS, STRATEGY_RULES, strategyRows, CONVERGENCE_N, CONVERGENCE_Z, convergenceStudy, ZTABLE, zTable, QUANTILE_LEVELS, quantileNewton, TAIL_KS, tailRows, alarmThreshold, CURVE_POINTS, CURVE_SPAN, cdfCurve, cdfAlternating, cdfPositive, millsRatio, ERF_AS, erfAS, cdfAS, CDF_ZS, cdfZS, SWITCH_Z, cdfOursDetail, cdfOurs, CDF_METHODS, METHOD_N, cdfBy, MPMATH_PHI, MPMATH_TAILS, REFERENCE_POINTS, NIST_ROWS, NIST_URL, nistPhi, referencePhi, accuracyOf, nistComparison, referenceRows, SERIES_Z, seriesRows, seriesPath, LIOUVILLE_X, liouvilleRows, RULE_K, empiricalRuleRows, termsOf, EXP_CALLS, TIMING_Z, TIMING_RUNS, medianInterval, FUNCTIONS, PATHOLOGICAL, CUSTOM, JUMP_AT, jump, indicator, sinc, sineIntegral, TRAFFIC, traffic, cosineIntegral, FUNCTION_DEFS, CAPS, FORMULA_MAX, DEFAULT_FORMULA, DEFAULT_RANGE, RANGE_LIMIT, FORMULA_NAMES, parseFormula, CHECK_POINTS, UNDEFINED_SHARE, customFunction, functionOf, adaptiveSimpson, compositeGauss, referenceIntegral, RIEMANN_KINDS, DARBOUX_SAMPLES, riemannSums, LEVEL_CELLS, BISECTIONS, sampleGrid, levelSet, lebesgueSums, COMPARE_N, measuredOrder, comparisonStudy, EFFICIENCY_TARGETS, efficiencyStudy, rearrangement, TRAFFIC_THRESHOLDS, trafficReport, gcd, smallestDenominator, thomaeOnDoubles, dirichletOnDoubles, PATHOLOGICAL_N, fareyLength, FAREY_Q, pathologicalStudy, splitMix64, xoshiro128ss, STREAMS, streamState, generator, uniform53, randomSeed, normalSampler, HEAVY_DF, heavySampler, heavySf, heavyDistance, monteCarlo, monteCarloPath, COINS, COIN_WEIGHTS, HANDFUL, handful, exactFraction, twoSidedNormalTail, normalSf, normalCdf, normalQuantile, betaIncomplete, studentSf, sampleMoments, kolmogorovSf, ksTest, proportionTest, biasTest, fitLine, runSteps, runStepsAsync, ALARM_K, ECDF_POINTS, exploreSteps, explore, exploreAsync, statisticalTests, DEFAULT_PALETTE, axisLabel, niceTicks, drawLineChart, drawHistogram, drawQuadrature, drawIntegral, chartHeight, chartHitTest, chartHitAt, attachChartTooltip, attachPointerLabel, CHECK_VECTORS, verifyAll, TEST_LABELS, runCli, isNode };
})();

// src/pages/statistics/hw5/standalone/cli.js
// La coda del file homework5.js scaricabile: la riga di comando
// node homework5.js [opzioni] e l'uso da altri script. La build la aggiunge
// dopo la libreria cosi' com'e', quindi qui non ci sono import ne' export.
//
// Funziona qualunque sia il nome del file, e in entrambi i modi in cui Node
// puo' caricarlo:
//   - CommonJS (il package.json accanto lo dichiara): require('./homework5.js')
//     restituisce la libreria, e la riga di comando parte solo se il file e'
//     quello eseguito (require.main);
//   - modulo ES (per esempio copiato da solo in un progetto con
//     "type": "module"): la libreria e' globalThis.Homework5, e la riga di
//     comando parte solo se il file e' quello eseguito, cosa che qui si
//     ricava dalla traccia dello stack, l'unico modo che non richiede
//     import.meta (che in uno script classico sarebbe un errore di sintassi).

// Command line: node homework5.js [--z 1.96] [--mu 0] [--sigma 1] [--rule left|midpoint|trapezoid|simpson|gauss] [--n 16] [--function square|bell|steps|oscillating|unbounded|traffic] [--formula "x*sin(1/x)" --a 0 --b 1] [--seed 2026 | --random-seed] [--sample 10000] [--points 1000] [--reps 1000]
(function () {
  if (typeof window !== 'undefined' || typeof process !== 'object' || !process || !process.versions || !process.versions.node) return;
  const run = () => {
    process.exitCode = Homework5.runCli(process.argv.slice(2), console.log);
  };

  if (typeof module === 'object' && module && module.exports) {
    module.exports = Homework5;
    if (typeof require === 'function' && require.main === module) run();
    return;
  }

  globalThis.Homework5 = Homework5;
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
