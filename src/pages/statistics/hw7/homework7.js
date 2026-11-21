// src/pages/statistics/hw7/homework7.js
// Homework #7 di Statistics: la libreria dei calcoli. Due parti, come la
// consegna. La prima usa il teorema di Bayes come motore inferenziale: un
// allarme dell'IDS e il tasso di base, una rete bayesiana per il triage di
// un incidente, il test sequenziale di Wald per decidere quando bloccare un
// indirizzo IP, la stima bayesiana della quota di dipendenti che cliccano
// un phishing (con un prior qualsiasi, su una griglia, e il confronto con
// gli intervalli frequentisti), e due filtri naive Bayes su dati veri: gli
// SMS della SMS Spam Collection e le connessioni di NSL-KDD. La seconda
// esplora le forme di convergenza: in probabilita', quasi certa, in media
// quadratica e in distribuzione (legge dei grandi numeri e limite
// centrale), con i controesempi che le separano, le code pesanti, la
// velocita' delle disuguaglianze, il posterior che converge e le collisioni
// di hash.
//
// Lo stesso file serve la pagina (import), il worker (stats.worker.js) e il
// programma scaricabile (homework7.js da solo, anche con node homework7.js):
// niente DOM fuori dalle funzioni di disegno, niente dipendenze. I dati sono
// in smsspam.js e nslkdd.js, che la build mette dentro il programma.
import { MESSAGES, SOURCE as SMS_SOURCE } from './smsspam.js';
import { FLAGS, LABELS, PROTOCOLS, RECORDS, SERVICES, SOURCE as KDD_SOURCE, SRC_BYTES } from './nslkdd.js';

const fail = (message) => {
  throw new RangeError(message);
};

// ---------------------------------------------------------------------------
// 1. I parametri
// ---------------------------------------------------------------------------

/** The seed of every stream as the page opens. */
export const DEFAULT_SEED = 2026;

/** The accepted ranges. */
export const LIMITS = Object.freeze({
  seed: Object.freeze([0, 4294967295]),
});

/** Significance level of every test. */
export const SIGNIFICANCE = 0.05;

/** An integer of the range [min, max], in decimal digits. */
export function parseInteger(text, [min, max]) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (!/^\d{1,12}$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const value = Number(t);
  if (value < min || value > max) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** The parameters of the computations, checked against LIMITS. */
export function checkParams({ seed = DEFAULT_SEED } = {}) {
  if (!(Number.isInteger(seed) && seed >= LIMITS.seed[0] && seed <= LIMITS.seed[1])) fail(`seed out of range: ${seed}`);
  return { seed };
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const range = (n) => Array.from({ length: n }, (_, i) => i);
const LN10 = Math.log(10);
const SQRT_2PI = Math.sqrt(2 * Math.PI);

// ---------------------------------------------------------------------------
// 2. Le funzioni speciali: gamma, beta, normale, binomiale, Kolmogorov
// ---------------------------------------------------------------------------

const LANCZOS = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];

/** ln Γ(x) for x > 0 (Lanczos, g = 7, nine coefficients: relative error about 1e-15). */
export function lnGamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  const z = x - 1;
  let a = LANCZOS[0];
  const t = z + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** ln B(a, b). */
export const lnBeta = (a, b) => lnGamma(a) + lnGamma(b) - lnGamma(a + b);

/** ln of the binomial coefficient C(n, k). */
export const lnChoose = (n, k) => lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);

const TINY = 1e-300;

/**
 * The regularized incomplete gamma functions P(s, x) and Q(s, x) = 1 - P:
 * the series below s + 1, Lentz's continued fraction above (Numerical
 * Recipes 6.2), as in Homework #5. Returns { P, Q }.
 */
export function incompleteGamma(s, x) {
  if (!(s > 0) || !(x >= 0)) return { P: NaN, Q: NaN };
  if (x === 0) return { P: 0, Q: 1 };
  const front = Math.exp(-x + s * Math.log(x) - lnGamma(s));
  if (x < s + 1) {
    let term = 1 / s;
    let total = term;
    for (let n = 1; n < 100000; n++) {
      term *= x / (s + n);
      total += term;
      if (Math.abs(term) < Math.abs(total) * 1e-16) break;
    }
    const P = Math.min(1, total * front);
    return { P, Q: 1 - P };
  }
  let b = x + 1 - s;
  let c = 1 / TINY;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - s);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  const Q = Math.min(1, front * h);
  return { P: 1 - Q, Q };
}

/** The distribution function of the Gamma(k, 1) law, the sum of k exponential values of mean 1. */
export const gammaCdf = (x, k) => (x <= 0 ? 0 : incompleteGamma(k, x).P);

// the continued fraction of the incomplete beta function (Numerical Recipes 6.4, Lentz)
function betaFraction(x, a, b) {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < 100000; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return h;
}

/** The regularized incomplete beta function I_x(a, b), the distribution function of the Beta(a, b) law at x. */
export function betaCdf(x, a, b) {
  if (!(a > 0 && b > 0)) return NaN;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnFront = a * Math.log(x) + b * Math.log1p(-x) - lnBeta(a, b);
  if (x < (a + 1) / (a + b + 2)) return (Math.exp(lnFront) * betaFraction(x, a, b)) / a;
  return 1 - (Math.exp(lnFront) * betaFraction(1 - x, b, a)) / b;
}

/** The density of the Beta(a, b) law at x. */
export function betaDensity(x, a, b) {
  if (x < 0 || x > 1) return 0;
  if (x === 0) return a < 1 ? Infinity : a === 1 ? Math.exp(-lnBeta(a, b)) : 0;
  if (x === 1) return b < 1 ? Infinity : b === 1 ? Math.exp(-lnBeta(a, b)) : 0;
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log1p(-x) - lnBeta(a, b));
}

/** The quantile of the Beta(a, b) law: Newton's method on I_x(a, b) = p, kept inside a bracket that bisection narrows. */
export function betaQuantile(p, a, b) {
  if (!(p >= 0 && p <= 1)) return NaN;
  if (p === 0) return 0;
  if (p === 1) return 1;
  let lo = 0;
  let hi = 1;
  let x = a / (a + b);
  for (let i = 0; i < 200; i++) {
    const f = betaCdf(x, a, b) - p;
    if (f === 0) return x;
    if (f < 0) lo = x;
    else hi = x;
    const density = betaDensity(x, a, b);
    let next = density > 0 && Number.isFinite(density) ? x - f / density : NaN;
    if (!(next > lo && next < hi)) next = (lo + hi) / 2;
    if (Math.abs(next - x) <= 1e-15 * Math.max(x, 1e-300) || hi - lo <= 1e-16) return next;
    x = next;
  }
  return x;
}

/** The standard normal density. */
export const phi = (z) => Math.exp(-0.5 * z * z) / SQRT_2PI;

/**
 * Mills' ratio R(w) = P(Z > w)/phi(w), by Laplace's continued fraction
 * (Lentz), for w > 0: it keeps the relative accuracy far in the tail.
 */
function millsRatio(w) {
  let f = w;
  let C = w;
  let D = 0;
  for (let k = 1; k <= 5000; k++) {
    D = w + k * D;
    D = 1 / (D === 0 ? TINY : D);
    C = w + k / C;
    if (C === 0) C = TINY;
    const delta = C * D;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  return 1 / f;
}

/**
 * The standard normal distribution function Phi, the method of Homework #5:
 * the series with positive terms 1/2 + phi(z)(z + z^3/3 + z^5/15 + ...)
 * for |z| < 2, Laplace's continued fraction beyond. About 15 correct digits.
 */
export function normalCdf(z) {
  if (Number.isNaN(z)) return NaN;
  const w = Math.abs(z);
  if (w < 2) {
    let term = z;
    let sum = z;
    for (let k = 1; k < 200; k++) {
      term *= (z * z) / (2 * k + 1);
      sum += term;
      if (Math.abs(term) <= 1e-17 * Math.abs(sum)) break;
    }
    return 0.5 + phi(z) * sum;
  }
  if (w > 40) return z < 0 ? 0 : 1;
  const q = phi(w) * millsRatio(w);
  return z < 0 ? q : 1 - q;
}

/** P(Z > z), with its relative accuracy also far in the upper tail. */
export const normalSf = (z) => normalCdf(-z);

/**
 * The standard normal quantile: Acklam's rational approximation (relative
 * error below 1.2e-9), then one step of Halley's method on normalCdf.
 */
export function normalQuantile(p) {
  if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  let x;
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p > 1 - 0.02425) {
    const q = Math.sqrt(-2 * Math.log1p(-p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const e = normalCdf(x) - p;
  const u = e / phi(x);
  return x - u / (1 + (x * u) / 2);
}

/** ln P(K = k) for K ~ Binomial(n, p). */
export function binomialLogPmf(k, n, p) {
  if (k < 0 || k > n || !Number.isInteger(k)) return -Infinity;
  if (p === 0) return k === 0 ? 0 : -Infinity;
  if (p === 1) return k === n ? 0 : -Infinity;
  return lnChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p);
}

/** P(K <= k) for K ~ Binomial(n, p), through the incomplete beta function: I_(1-p)(n - k, k + 1). */
export function binomialCdf(k, n, p) {
  const kk = Math.floor(k);
  if (kk < 0) return 0;
  if (kk >= n) return 1;
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  return betaCdf(1 - p, n - kk, kk + 1);
}

/** P(K >= k) for K ~ Binomial(n, p), without the cancellation of 1 - P(K <= k - 1) in the upper tail. */
export function binomialSf(k, n, p) {
  const kk = Math.ceil(k);
  if (kk <= 0) return 1;
  if (kk > n) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return betaCdf(p, kk, n - kk + 1);
}

/**
 * The survival function of Kolmogorov's limit law, P(K > x): the
 * alternating series 2 sum (-1)^(k-1) exp(-2 k^2 x^2) for x >= 1, the theta
 * series sqrt(2 pi)/x sum exp(-(2k-1)^2 pi^2/(8 x^2)) below.
 */
export function kolmogorovSf(x) {
  if (!(x > 0)) return 1;
  if (x < 1) {
    let s = 0;
    for (let k = 1; k <= 20; k++) s += Math.exp(-((2 * k - 1) ** 2) * Math.PI * Math.PI / (8 * x * x));
    return clamp(1 - (SQRT_2PI / x) * s, 0, 1);
  }
  let s = 0;
  for (let k = 1; k <= 200; k++) {
    const t = Math.exp(-2 * k * k * x * x);
    s += k % 2 ? t : -t;
    if (t < 1e-18) break;
  }
  return clamp(2 * s, 0, 1);
}

/**
 * The Kolmogorov-Smirnov test of a sample against a continuous
 * distribution function: D = sup |F_n - F|, and its p-value from
 * Kolmogorov's law with Stephens' correction (sqrt n + 0.12 + 0.11/sqrt n) D,
 * with its logarithm also below 10^-300.
 */
export function ksTest(values, cdf) {
  const x = Float64Array.from(values).sort();
  const n = x.length;
  let D = 0;
  for (let i = 0; i < n; i++) {
    const F = cdf(x[i]);
    D = Math.max(D, (i + 1) / n - F, F - i / n);
  }
  const root = Math.sqrt(n);
  const lambda = (root + 0.12 + 0.11 / root) * D;
  const p = kolmogorovSf(lambda);
  // when p underflows, its logarithm from the first term of the series, 2 exp(-2 lambda^2)
  const log10p = p > 0 ? Math.log10(p) : (Math.LN2 - 2 * lambda * lambda) / LN10;
  return { D, p, log10p, size: n };
}

/** The standard Cauchy distribution function. */
export const cauchyCdf = (x) => 0.5 + Math.atan(x) / Math.PI;

/** A p-value written as { p, log10p }, also when p underflows. */
const pOf = (p) => ({ p, log10p: p > 0 ? Math.log10(p) : -Infinity });

/**
 * The exact two-sided binomial test of k successes in n trials against the
 * probability p0: the sum of the probabilities of the outcomes no more
 * likely than k (the rule of R's binom.test and SciPy's binomtest).
 */
export function binomialTest(k, n, p0) {
  const own = binomialLogPmf(k, n, p0);
  let total = 0;
  const tolerance = 1e-7;
  for (let j = 0; j <= n; j++) {
    const lp = binomialLogPmf(j, n, p0);
    if (lp <= own + tolerance) total += Math.exp(lp);
  }
  return { k, n, p0, observed: k / n, ...pOf(Math.min(1, total)) };
}

/** ln P(K <= k) for K ~ Binomial(n, p), summed in logarithms: it never underflows, however small. */
export function binomialLogCdf(k, n, p) {
  const terms = range(Math.floor(k) + 1).map((j) => binomialLogPmf(j, n, p));
  const top = Math.max(...terms);
  if (top === -Infinity) return -Infinity;
  return top + Math.log(terms.reduce((s, t) => s + Math.exp(t - top), 0));
}

/**
 * McNemar's exact test on the discordant pairs b and c (b + c > 0): twice
 * the lower binomial tail of min(b, c) in b + c trials with p = 1/2, capped
 * at 1, with its logarithm when p underflows.
 */
export function mcnemarTest(b, c) {
  const n = b + c;
  if (n === 0) return { b, c, p: 1, log10p: 0 };
  const lnP = Math.min(0, Math.log(2) + binomialLogCdf(Math.min(b, c), n, 0.5));
  return { b, c, p: Math.exp(lnP), log10p: lnP / LN10 };
}

// ---------------------------------------------------------------------------
// 3. Il generatore
// ---------------------------------------------------------------------------

/*
 * The generators of Homework #3 to #6: SplitMix64 turns a 64-bit number
 * into the initial state of xoshiro128**, which draws the numbers. Every
 * stream starts SplitMix64 from seed x 2^32 + j, XOR the golden ratio times
 * the number of the stream, so the streams never meet and every repetition
 * j (a campaign, a path, a sample) is the same whatever the others do.
 * Stream 0 ('main') is the first stream of Homework #5 and #6, checked
 * there against independent Python code; here the other streams are
 * checked the same way, through the results they produce.
 */

const MASK64 = (1n << 64n) - 1n;
const GOLDEN = 0x9e3779b97f4a7c15n;

/** SplitMix64 (Steele, Lea and Flood, 2014), as in Vigna's reference code: 64-bit outputs, as BigInt. */
export function splitMix64(seed) {
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

/** The streams of the page: more are added at the end, so the first ones keep their numbers. */
export const STREAMS = Object.freeze(['main', 'phishing', 'sprt', 'paths', 'sequences', 'clt', 'cauchy', 'bytes', 'hash', 'coverage', 'bvm', 'live', 'bursts', 'gc']);

/** The initial state of stream `stream`, repetition j (from 0): two outputs of SplitMix64 as four 32-bit words. */
export function streamState(seed, stream, j) {
  const index = STREAMS.indexOf(stream);
  if (index < 0) fail(`unknown stream ${stream}`);
  const start = (BigInt(seed >>> 0) << 32n) | BigInt(j >>> 0);
  const next = splitMix64(start ^ ((GOLDEN * BigInt(index)) & MASK64));
  const a = next();
  const b = next();
  return [Number(a & 0xffffffffn), Number(a >> 32n), Number(b & 0xffffffffn), Number(b >> 32n)];
}

/** A stream: xoshiro128** from streamState. */
export const generator = (seed, stream, j) => xoshiro128ss(...streamState(seed, stream, j));

/** A uniform double in (0, 1) from two outputs: 53 random bits, never 0 and never 1. */
export const uniform53 = (next) => ((next() >>> 5) * 67108864 + (next() >>> 6) + 0.5) / 9007199254740992;

/** A new seed from the cryptographic generator, when there is one (the seed does not protect anything). */
export function randomSeed() {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') return c.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}

/** Standard normal values by Box-Muller (1958): two uniforms give two independent normals, sqrt(-2 ln u1) (cos, sin)(2 pi u2). */
export function normalSampler(next) {
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

/** A Bernoulli value: 1 when the uniform falls below p. */
export const bernoulli = (next, p) => (uniform53(next) < p ? 1 : 0);

/** An integer of [0, m), m <= 2^32, from one uniform (bias below 2^-21 for m <= 2^32, irrelevant here). */
export const uniformInt = (next, m) => Math.floor(uniform53(next) * m);

// ---------------------------------------------------------------------------
// I calcoli a fette
// ---------------------------------------------------------------------------

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

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
// 4. Bayes, il motore: prior x verosimiglianza / evidenza = posterior
// ---------------------------------------------------------------------------

/** Bayes' theorem on a finite set of hypotheses: the posteriors from the priors and the likelihoods of the evidence, and the evidence P(E). */
export function bayes(priors, likelihoods) {
  const joint = priors.map((p, i) => p * likelihoods[i]);
  const evidence = joint.reduce((s, v) => s + v, 0);
  return { posteriors: joint.map((v) => v / evidence), evidence };
}

export const odds = (p) => p / (1 - p);
export const probabilityOfOdds = (o) => (o === Infinity ? 1 : o / (1 + o));
/** The logistic function, without overflow for large |x|. */
export const sigmoid = (x) => (x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)));

// --- 4.1 L'allarme dell'IDS --------------------------------------------------

/** The alarm as the page opens: one connection in 100 is an attack, the IDS sees 95 attacks in 100 and raises an alarm on 3 normal connections in 100. */
export const ALARM_DEFAULT = Object.freeze({ base: 0.01, sensitivity: 0.95, fpr: 0.03 });
/** The second, independent detector: a sandbox that opens what the connection carried. */
export const SECOND_DETECTOR = Object.freeze({ sensitivity: 0.8, fpr: 0.01 });
/** The connections of the picture of natural frequencies. */
export const POPULATION = 10000;
/** The values the sliders of "Try it" can take. */
export const ALARM_BASES = Object.freeze([0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5]);
export const ALARM_SENSITIVITIES = Object.freeze([0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 0.999]);
export const ALARM_FPRS = Object.freeze([0.0001, 0.0005, 0.001, 0.005, 0.01, 0.02, 0.03, 0.05, 0.1, 0.2]);

/** Integer counts from real ones that add up to `total`: the largest remainders get the units left over. */
export function roundCounts(values, total) {
  const floors = values.map(Math.floor);
  let left = total - floors.reduce((s, v) => s + v, 0);
  const order = values.map((v, i) => [v - Math.floor(v), i]).sort((x, y) => y[0] - x[0] || x[1] - y[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors;
}

/**
 * One alarm: the probability of an attack after it (Bayes), and after its
 * silence; the likelihood ratios; the natural frequencies of `population`
 * connections (expected, and rounded for the picture: detected attacks,
 * missed attacks, false alarms, quiet normal connections).
 */
export function alarmFacts({ base, sensitivity, fpr }, population = POPULATION) {
  const pAlarm = base * sensitivity + (1 - base) * fpr;
  const posterior = (base * sensitivity) / pAlarm;
  const pQuiet = 1 - pAlarm;
  const posteriorQuiet = (base * (1 - sensitivity)) / pQuiet;
  const expected = [population * base * sensitivity, population * base * (1 - sensitivity), population * (1 - base) * fpr, population * (1 - base) * (1 - fpr)];
  return {
    base,
    sensitivity,
    fpr,
    pAlarm,
    posterior,
    posteriorQuiet,
    lrPlus: sensitivity / fpr,
    lrMinus: (1 - sensitivity) / (1 - fpr),
    priorOdds: odds(base),
    posteriorOdds: odds(base) * (sensitivity / fpr),
    expected,
    counts: roundCounts(expected, population),
    population,
  };
}

/**
 * Evidence after evidence: every detector, with its sensitivity, its false
 * positive rate and whether it fired, multiplies the odds by its likelihood
 * ratio; in logarithms it adds its weight. Turing measured the weights in
 * bans (log10) and decibans. The posterior of a step is the prior of the next.
 */
export function evidenceChain(base, detectors) {
  let logOdds = Math.log(odds(base));
  return detectors.map((d) => {
    const lr = d.fired ? d.sensitivity / d.fpr : (1 - d.sensitivity) / (1 - d.fpr);
    const prior = sigmoid(logOdds);
    logOdds += Math.log(lr);
    return { ...d, prior, lr, weight: Math.log10(lr), posterior: sigmoid(logOdds), logOdds };
  });
}

// --- 4.2 La rete bayesiana del triage ----------------------------------------

/**
 * A small Bayesian network for the triage of an incident. Two causes:
 * a phishing that stole a password, and a vulnerability exploited from
 * outside. Either can compromise the host (noisy-OR, with a small leak).
 * Three clues: the EDR on the host raises an alarm (child of the
 * compromise), the login comes from an unusual place (child of the
 * phishing), the IDS sees the signature of an exploit (child of the
 * vulnerability). The numbers are plausible orders of magnitude, not data.
 */
export const NETWORK = Object.freeze({
  nodes: Object.freeze(['phishing', 'exploit', 'compromise', 'edr', 'login', 'signature']),
  causes: Object.freeze({ phishing: 0.05, exploit: 0.02 }),
  compromise: Object.freeze({ leak: 0.002, phishing: 0.6, exploit: 0.9 }),
  // P(clue | its parent false), P(clue | its parent true)
  edr: Object.freeze({ parent: 'compromise', p: Object.freeze([0.04, 0.85]) }),
  login: Object.freeze({ parent: 'phishing', p: Object.freeze([0.03, 0.5]) }),
  signature: Object.freeze({ parent: 'exploit', p: Object.freeze([0.01, 0.8]) }),
});

export const CLUES = Object.freeze(['edr', 'login', 'signature']);
export const HIDDEN = Object.freeze(['phishing', 'exploit', 'compromise']);

/** P(compromise | phishing, exploit) by noisy-OR: each cause fails to compromise on its own, independently. */
export function compromiseGiven(phishing, exploit) {
  const c = NETWORK.compromise;
  return 1 - (1 - c.leak) * (phishing ? 1 - c.phishing : 1) * (exploit ? 1 - c.exploit : 1);
}

/** The probability of one complete state of the network, { phishing: 0|1, ... }: the product of every node given its parents. */
export function networkJoint(s) {
  const pick = (p, v) => (v ? p : 1 - p);
  let p = pick(NETWORK.causes.phishing, s.phishing) * pick(NETWORK.causes.exploit, s.exploit);
  p *= pick(compromiseGiven(s.phishing, s.exploit), s.compromise);
  for (const clue of CLUES) p *= pick(NETWORK[clue].p[s[NETWORK[clue].parent]], s[clue]);
  return p;
}

/**
 * Inference by enumeration: the 64 states consistent with the evidence
 * ({ edr: true | false, ... }; a clue left out is unknown), summed. Returns
 * the probability of every node given the evidence, and P(evidence).
 */
export function networkPosterior(evidence = {}) {
  const totals = Object.fromEntries(NETWORK.nodes.map((n) => [n, 0]));
  let pEvidence = 0;
  for (let bits = 0; bits < 64; bits++) {
    const s = Object.fromEntries(NETWORK.nodes.map((n, i) => [n, (bits >> i) & 1]));
    if (Object.entries(evidence).some(([n, v]) => v !== null && v !== undefined && s[n] !== (v ? 1 : 0))) continue;
    const p = networkJoint(s);
    pEvidence += p;
    for (const n of NETWORK.nodes) if (s[n]) totals[n] += p;
  }
  return { ...Object.fromEntries(NETWORK.nodes.map((n) => [n, totals[n] / pEvidence])), pEvidence };
}

/** The story of section 1.3, one clue at a time: nothing, the EDR alarm, the exploit signature, the unusual login. */
export const NETWORK_STEPS = Object.freeze([
  Object.freeze({}),
  Object.freeze({ edr: true }),
  Object.freeze({ edr: true, signature: true }),
  Object.freeze({ edr: true, signature: true, login: true }),
]);

// --- 4.3 Quando bloccare un IP: il test sequenziale di Wald ------------------

/**
 * Login attempts from one address, one at a time. A legitimate user fails
 * now and then (p0 = 0.2: typos, an old password); a brute-force attack
 * fails almost always (p1 = 0.95). Blocking a legitimate user should
 * happen once in a thousand (alpha), missing an attacker once in a hundred
 * (beta).
 */
export const SPRT_DEFAULT = Object.freeze({ p0: 0.2, p1: 0.95, alpha: 0.001, beta: 0.01 });
export const SPRT_ALPHAS = Object.freeze([0.01, 0.001, 0.0001]);
/** How many attempts the exact computation and the simulation follow before giving up. */
export const SPRT_MAX_STEPS = 400;

/**
 * Wald's sequential probability ratio test (1945): every failed attempt
 * adds ln(p1/p0) to the log-likelihood ratio, every success adds
 * ln((1 - p1)/(1 - p0)); the address is blocked when the sum reaches
 * ln((1 - beta)/alpha), cleared when it falls to ln(beta/(1 - alpha)). With
 * the prior odds of an attack added, the same sum is the log of the
 * posterior odds: Bayes' theorem applied one attempt at a time.
 */
export function sprtSetup({ p0, p1, alpha, beta } = SPRT_DEFAULT) {
  const fail = Math.log(p1 / p0);
  const success = Math.log((1 - p1) / (1 - p0));
  const upper = Math.log((1 - beta) / alpha);
  const lower = Math.log(beta / (1 - alpha));
  // the mean step under each hypothesis: the Kullback-Leibler divergences, with their signs
  const driftAttacker = p1 * fail + (1 - p1) * success;
  const driftLegit = p0 * fail + (1 - p0) * success;
  return {
    p0,
    p1,
    alpha,
    beta,
    fail,
    success,
    upper,
    lower,
    driftAttacker,
    driftLegit,
    // Wald's approximations of the expected number of attempts
    waldAttacker: ((1 - beta) * upper + beta * lower) / driftAttacker,
    waldLegit: (alpha * upper + (1 - alpha) * lower) / driftLegit,
  };
}

/** The decision after a log-likelihood ratio: 'block', 'clear' or null (one more attempt). */
export const sprtDecision = (setup, llr) => (llr >= setup.upper - 1e-12 ? 'block' : llr <= setup.lower + 1e-12 ? 'clear' : null);

/** The path of the log-likelihood ratio along a list of attempts (true = failed), stopped at the decision. */
export function sprtPath(setup, attempts) {
  const llr = [0];
  let decision = null;
  for (const failed of attempts) {
    if (decision) break;
    const next = llr[llr.length - 1] + (failed ? setup.fail : setup.success);
    llr.push(next);
    decision = sprtDecision(setup, next);
  }
  return { llr, decision, steps: llr.length - 1 };
}

/**
 * The exact behaviour of the test when every attempt fails with
 * probability pFail: the walk lives on the lattice f ln(p1/p0) + s ln(...)
 * of failures and successes, so its law after every attempt is a short
 * list of points, followed until SPRT_MAX_STEPS. Returns the probabilities
 * of blocking, of clearing and of no decision, and the expected number of
 * attempts (counting the undecided ones at the last step).
 */
export function sprtExact(setup, pFail, maxSteps = SPRT_MAX_STEPS) {
  let alive = new Map([['0,0', 1]]);
  let block = 0;
  let clear = 0;
  let mean = 0;
  const stopping = [];
  for (let n = 1; n <= maxSteps && alive.size; n++) {
    const next = new Map();
    let stoppedNow = 0;
    for (const [key, p] of alive) {
      const [f, s] = key.split(',').map(Number);
      for (const [failed, q] of [[true, pFail], [false, 1 - pFail]]) {
        const ff = f + (failed ? 1 : 0);
        const ss = s + (failed ? 0 : 1);
        const mass = p * q;
        const decision = sprtDecision(setup, ff * setup.fail + ss * setup.success);
        if (decision === 'block') block += mass;
        else if (decision === 'clear') clear += mass;
        else {
          const k = `${ff},${ss}`;
          next.set(k, (next.get(k) || 0) + mass);
          continue;
        }
        stoppedNow += mass;
        mean += n * mass;
      }
    }
    stopping.push(stoppedNow);
    alive = next;
  }
  const undecided = [...alive.values()].reduce((s, v) => s + v, 0);
  return { block, clear, undecided, mean: mean + maxSteps * undecided, stopping };
}

/**
 * The same test simulated: `runs` addresses whose attempts fail with
 * probability pFail; run r draws from stream 'sprt', repetition offset + r.
 */
export function sprtSimulate(setup, pFail, runs, seed, offset = 0) {
  let block = 0;
  let clear = 0;
  let undecided = 0;
  let steps = 0;
  for (let r = 0; r < runs; r++) {
    const next = generator(seed, 'sprt', offset + r);
    let llr = 0;
    let decision = null;
    let n = 0;
    while (!decision && n < SPRT_MAX_STEPS) {
      n++;
      llr += uniform53(next) < pFail ? setup.fail : setup.success;
      decision = sprtDecision(setup, llr);
    }
    if (decision === 'block') block++;
    else if (decision === 'clear') clear++;
    else undecided++;
    steps += n;
  }
  return { runs, block, clear, undecided, meanSteps: steps / runs };
}

/** The simulated users and attackers of section 1.4. */
export const SPRT_RUNS = 10000;

// --- 4.4 Stimare un tasso: il phishing, con un prior Beta ----------------------

/** The simulated campaign: 40 e-mails a day for 10 days; the true share of clicks, 12%, is unknown to the analyst. */
export const CAMPAIGN = Object.freeze({ days: 10, perDay: 40, rate: 0.12 });

/** The priors of the page, as the parameters (a, b) of a Beta law. */
export const PRIORS = Object.freeze({
  uniform: Object.freeze([1, 1]),
  jeffreys: Object.freeze([0.5, 0.5]),
  informed: Object.freeze([3, 17]),
  wrong: Object.freeze([40, 60]),
});
export const PRIOR_KEYS = Object.freeze(['uniform', 'jeffreys', 'informed', 'wrong']);

/** The clicks of the campaign, day by day: day d draws its e-mails from stream 'phishing', repetition d. */
export function campaign(seed, { days, perDay, rate } = CAMPAIGN) {
  return range(days).map((d) => {
    const next = generator(seed, 'phishing', d);
    let clicks = 0;
    for (let i = 0; i < perDay; i++) clicks += bernoulli(next, rate);
    return { day: d + 1, sent: perDay, clicks };
  });
}

/** The posterior Beta(a + clicks, b + sent - clicks), with its mean, mode, standard deviation and equal-tailed credible interval. */
export function betaPosterior([a0, b0], clicks, sent, level = 0.95) {
  const a = a0 + clicks;
  const b = b0 + sent - clicks;
  const mean = a / (a + b);
  const tail = (1 - level) / 2;
  return {
    a,
    b,
    mean,
    mode: a > 1 && b > 1 ? (a - 1) / (a + b - 2) : null,
    sd: Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1))),
    lo: betaQuantile(tail, a, b),
    hi: betaQuantile(1 - tail, a, b),
    // the probability that the true rate exceeds a threshold
    above: (x) => 1 - betaCdf(x, a, b),
  };
}

/** The posterior after every day of the campaign: day 0 is the prior. */
export function campaignPosteriors(days, prior) {
  let sent = 0;
  let clicks = 0;
  const rows = [{ day: 0, sent, clicks, ...betaPosterior(prior, 0, 0) }];
  for (const d of days) {
    sent += d.sent;
    clicks += d.clicks;
    rows.push({ day: d.day, sent, clicks, ...betaPosterior(prior, clicks, sent) });
  }
  return rows;
}

/** The share of clicks the security team wants to stay under, and the question of section 1.5: how likely is the rate above it? */
export const TARGET_RATE = 0.1;

// --- 4.5 Un prior qualsiasi, su una griglia -----------------------------------

/** The grid of the rates: 0, 0.005, ..., 1. */
export const GRID_SIZE = 201;
export const GRID = Object.freeze(range(GRID_SIZE).map((i) => i / (GRID_SIZE - 1)));
/** The handles of the prior that can be dragged: 0, 0.1, ..., 1. */
export const HANDLES = 11;
export const HANDLE_X = Object.freeze(range(HANDLES).map((i) => i / (HANDLES - 1)));

/** Ready-made shapes of the prior, as the heights of the handles (0 to 1). */
export const PRIOR_SHAPES = Object.freeze({
  flat: Object.freeze(range(HANDLES).map(() => 0.6)),
  informed: Object.freeze(HANDLE_X.map((x) => {
    const peak = betaDensity(2 / 18, 3, 17);
    return Number((betaDensity(Math.min(Math.max(x, 1e-9), 1 - 1e-9), 3, 17) / peak).toFixed(3));
  })),
  twoPeaks: Object.freeze([0.05, 0.9, 0.35, 0.05, 0.05, 0.1, 0.35, 0.9, 0.35, 0.05, 0.02]),
  pessimist: Object.freeze([0, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7, 0.85, 0.95, 1]),
});
export const PRIOR_SHAPE_KEYS = Object.freeze(['flat', 'informed', 'twoPeaks', 'pessimist']);

/** The trapezoid rule on the grid. */
const gridIntegral = (values) => {
  const h = 1 / (GRID_SIZE - 1);
  let s = 0;
  for (let i = 1; i < GRID_SIZE; i++) s += (values[i - 1] + values[i]) * h * 0.5;
  return s;
};

/** The prior on the grid from the heights of the handles, joined by straight lines and normalized to a density. */
export function priorFromHandles(heights) {
  const values = GRID.map((x) => {
    const t = x * (HANDLES - 1);
    const i = Math.min(HANDLES - 2, Math.floor(t));
    const u = t - i;
    return Math.max(0, heights[i] * (1 - u) + heights[i + 1] * u);
  });
  const area = gridIntegral(values);
  return area > 0 ? values.map((v) => v / area) : values.map(() => 1);
}

/** The quantile of a density on the grid, from its cumulative trapezoids, by linear interpolation. */
function gridQuantile(density, q) {
  const h = 1 / (GRID_SIZE - 1);
  let cumulative = 0;
  for (let i = 1; i < GRID_SIZE; i++) {
    const piece = (density[i - 1] + density[i]) * h * 0.5;
    if (cumulative + piece >= q) return GRID[i - 1] + (piece > 0 ? ((q - cumulative) / piece) * h : 0);
    cumulative += piece;
  }
  return 1;
}

/**
 * Bayes on a grid, with any prior: posterior = prior x likelihood,
 * normalized by the trapezoid rule. No conjugate formula: the engine bare.
 * The likelihood is shown as a density too (the posterior of a flat prior).
 */
export function gridPosterior(prior, clicks, sent, level = 0.95) {
  const logLik = GRID.map((x) => (x === 0 ? (clicks === 0 ? 0 : -Infinity) : x === 1 ? (clicks === sent ? 0 : -Infinity) : clicks * Math.log(x) + (sent - clicks) * Math.log1p(-x)));
  const top = Math.max(...logLik);
  const lik = logLik.map((v) => Math.exp(v - top));
  const likArea = gridIntegral(lik);
  const likelihood = lik.map((v) => v / likArea);
  const raw = prior.map((v, i) => v * lik[i]);
  const area = gridIntegral(raw);
  const posterior = area > 0 ? raw.map((v) => v / area) : raw;
  const mean = gridIntegral(posterior.map((v, i) => v * GRID[i]));
  const tail = (1 - level) / 2;
  return { prior, likelihood, posterior, mean, lo: gridQuantile(posterior, tail), hi: gridQuantile(posterior, 1 - tail), clicks, sent };
}

// --- 4.6 Bayes e frequentisti: credibilita' contro confidenza ----------------

/** One day of the campaign: 40 e-mails. */
export const COVERAGE_N = 40;
export const INTERVAL_METHODS = Object.freeze(['wald', 'wilson', 'clopper', 'jeffreys']);
/** The rates of the coverage curves: 0.005, 0.01, ..., 0.5 (the other half is the mirror image). */
export const COVERAGE_PS = Object.freeze(range(100).map((i) => (i + 1) / 200));

/**
 * The 95% interval for a rate after k clicks out of n: Wald (the textbook
 * normal one), Wilson (1927, the inverted score test), Clopper-Pearson
 * (1934, exact by the binomial) and Jeffreys (the credible interval of the
 * prior Beta(1/2, 1/2); the convention of Brown, Cai and DasGupta, 2001,
 * puts its lower end at 0 when k = 0 and its upper end at 1 when k = n).
 */
export function interval(method, k, n, level = 0.95) {
  const alpha = 1 - level;
  const z = normalQuantile(1 - alpha / 2);
  const p = k / n;
  if (method === 'wald') {
    const half = z * Math.sqrt((p * (1 - p)) / n);
    return [Math.max(0, p - half), Math.min(1, p + half)];
  }
  if (method === 'wilson') {
    const centre = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
    const half = (z / (1 + (z * z) / n)) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [Math.max(0, centre - half), Math.min(1, centre + half)];
  }
  if (method === 'clopper') return [k === 0 ? 0 : betaQuantile(alpha / 2, k, n - k + 1), k === n ? 1 : betaQuantile(1 - alpha / 2, k + 1, n - k)];
  if (method === 'jeffreys') return [k === 0 ? 0 : betaQuantile(alpha / 2, k + 0.5, n - k + 0.5), k === n ? 1 : betaQuantile(1 - alpha / 2, k + 0.5, n - k + 0.5)];
  return fail(`unknown method ${method}`);
}

/**
 * The exact coverage of every method: the probability, when the true rate
 * is p, that the interval of the observed k contains p, summed over the
 * n + 1 possible k. No simulation: binomial probabilities.
 */
export function coverageCurves(n = COVERAGE_N, ps = COVERAGE_PS) {
  const intervals = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, range(n + 1).map((k) => interval(m, k, n))]));
  const curves = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, []]));
  const widths = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, []]));
  for (const p of ps) {
    const pmf = range(n + 1).map((k) => Math.exp(binomialLogPmf(k, n, p)));
    for (const m of INTERVAL_METHODS) {
      let cover = 0;
      let width = 0;
      intervals[m].forEach(([lo, hi], k) => {
        if (lo <= p && p <= hi) cover += pmf[k];
        width += pmf[k] * (hi - lo);
      });
      curves[m].push(cover);
      widths[m].push(width);
    }
  }
  const summary = Object.fromEntries(INTERVAL_METHODS.map((m) => {
    const c = curves[m];
    return [m, { mean: c.reduce((s, v) => s + v, 0) / c.length, min: Math.min(...c), minAt: ps[c.indexOf(Math.min(...c))], width: widths[m].reduce((s, v) => s + v, 0) / c.length }];
  }));
  return { n, ps, intervals, curves, widths, summary };
}

/** The coverage at one rate, exactly, for every method. */
export const coverageAt = (p, n = COVERAGE_N) => coverageCurves(n, [p]).curves;

/** The same coverage simulated: `runs` campaigns of n e-mails at the rate p (stream 'coverage', repetition r). */
export function coverageSimulation(p, n, runs, seed) {
  const intervals = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, range(n + 1).map((k) => interval(m, k, n))]));
  const hits = Object.fromEntries(INTERVAL_METHODS.map((m) => [m, 0]));
  for (let r = 0; r < runs; r++) {
    const next = generator(seed, 'coverage', r);
    let k = 0;
    for (let i = 0; i < n; i++) k += bernoulli(next, p);
    for (const m of INTERVAL_METHODS) {
      const [lo, hi] = intervals[m][k];
      if (lo <= p && p <= hi) hits[m]++;
    }
  }
  return { p, n, runs, hits };
}
export const COVERAGE_RUNS = 20000;

// --- 4.7 Il filtro antispam: naive Bayes sugli SMS -------------------------------

export const SMS_DATA = SMS_SOURCE;

/** The words of a message: lowercase runs of letters and digits, and the pound sign on its own; the HTML entities of the file are not words. */
export function tokenize(text) {
  return String(text).toLowerCase().replace(/&(lt|gt|amp);/g, ' ').match(/[\p{L}\p{N}]+|£/gu) || [];
}

/** The text of a message as it was written: the three HTML entities of the file decoded. */
export const messageText = (text) => String(text).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Whether a record belongs to the test set: 3 in every 10, by position. */
export const inTest = (i) => i % 10 < 3;

let smsCache = null;

/**
 * The corpus: every distinct message once (the file repeats 404 lines), in
 * the order of the file, split by position into a training set (7 in 10)
 * and a test set (3 in 10).
 */
export function smsCorpus() {
  if (smsCache) return smsCache;
  const seen = new Set();
  const docs = [];
  for (const m of MESSAGES) {
    const text = m.slice(1);
    if (seen.has(text)) continue;
    seen.add(text);
    docs.push({ spam: m[0] === 's', text, tokens: tokenize(text) });
  }
  const train = [];
  const test = [];
  docs.forEach((d, i) => (inTest(i) ? test : train).push(d));
  smsCache = { docs, train, test, lines: MESSAGES.length, repeated: MESSAGES.length - docs.length };
  return smsCache;
}

/**
 * Multinomial naive Bayes with Laplace smoothing (alpha = 1): the counts of
 * every word in the spam and in the legitimate messages of the training set.
 */
export function trainNaiveBayes(docs, alpha = 1) {
  const counts = new Map();
  const totals = [0, 0];
  const classes = [0, 0];
  for (const d of docs) {
    const c = d.spam ? 1 : 0;
    classes[c]++;
    for (const t of d.tokens) {
      let entry = counts.get(t);
      if (!entry) {
        entry = [0, 0];
        counts.set(t, entry);
      }
      entry[c]++;
      totals[c]++;
    }
  }
  const V = counts.size;
  const weight = (t) => {
    const e = counts.get(t);
    if (!e) return null;
    return Math.log((e[1] + alpha) / (totals[1] + alpha * V)) - Math.log((e[0] + alpha) / (totals[0] + alpha * V));
  };
  return { counts, totals, classes, V, alpha, priorLogOdds: Math.log(classes[1] / classes[0]), weight };
}

/**
 * The posterior of a message: the prior log-odds of spam plus the weight
 * ln P(word | spam)/P(word | legitimate) of every known word. `priorLogOdds`
 * replaces the base rate of the training set (section 1.7: the same message
 * in another inbox).
 */
export function spamScore(model, text, priorLogOdds = model.priorLogOdds) {
  const tokens = typeof text === 'string' ? tokenize(text) : text;
  const words = new Map();
  for (const t of tokens) words.set(t, (words.get(t) || 0) + 1);
  let logOdds = priorLogOdds;
  const parts = [];
  for (const [token, count] of words) {
    const w = model.weight(token);
    if (w !== null) logOdds += count * w;
    parts.push({ token, count, weight: w, known: w !== null });
  }
  return { logOdds, posterior: sigmoid(logOdds), parts, words: tokens.length };
}

/** The area under the ROC curve, as the Mann-Whitney statistic: the probability that a random spam scores above a random legitimate message (ties count one half). */
export function rocArea(scores, labels) {
  const order = range(scores.length).sort((i, j) => scores[i] - scores[j]);
  let rank = 0;
  let sumRanks = 0;
  let positives = 0;
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && scores[order[j + 1]] === scores[order[i]]) j++;
    const mid = (i + j) / 2 + 1;
    for (let t = i; t <= j; t++) {
      if (labels[order[t]]) {
        sumRanks += mid;
        positives++;
      }
    }
    rank = j + 1;
    i = j + 1;
  }
  const negatives = rank - positives;
  return (sumRanks - (positives * (positives + 1)) / 2) / (positives * negatives);
}

/** The confusion matrix and its measures, for predictions and true labels (true = the positive class). */
export function confusion(predicted, actual) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  predicted.forEach((p, i) => {
    if (p && actual[i]) tp++;
    else if (p) fp++;
    else if (actual[i]) fn++;
    else tn++;
  });
  const n = tp + fp + fn + tn;
  return { tp, fp, fn, tn, n, accuracy: (tp + tn) / n, precision: tp / (tp + fp), recall: tp / (tp + fn), fpr: fp / (fp + tn), f1: (2 * tp) / (2 * tp + fp + fn) };
}

/** The bins of the log-odds of the test messages, for the chart of section 1.7. */
export const LOGODDS_BINS = Object.freeze(range(13).map((i) => -30 + 5 * i));

let smsModelCache = null;

/**
 * The filter of section 1.7: trained on the training set, judged on the
 * test set (threshold: posterior 1/2), against the rule that calls every
 * message legitimate; the words that weigh most; the log-odds of the test
 * messages, binned.
 */
export function smsModel() {
  if (smsModelCache) return smsModelCache;
  const corpus = smsCorpus();
  const model = trainNaiveBayes(corpus.train);
  const scores = corpus.test.map((d) => spamScore(model, d.tokens).logOdds);
  const actual = corpus.test.map((d) => d.spam);
  const predicted = scores.map((s) => s > 0);
  const matrix = confusion(predicted, actual);
  // McNemar against "everything is legitimate": b = the filter right and the rule wrong, c = the other way round
  let b = 0;
  let c = 0;
  predicted.forEach((p, i) => {
    const filterRight = p === actual[i];
    const ruleRight = !actual[i];
    if (filterRight && !ruleRight) b++;
    if (ruleRight && !filterRight) c++;
  });
  const words = [...model.counts.entries()].filter(([, e]) => e[0] + e[1] >= 10).map(([token, e]) => ({ token, spam: e[1], ham: e[0], weight: model.weight(token) }));
  words.sort((x, y) => y.weight - x.weight || (x.token < y.token ? -1 : 1));
  const bins = LOGODDS_BINS.map((from, i) => ({ from, to: i === LOGODDS_BINS.length - 1 ? Infinity : LOGODDS_BINS[i + 1], spam: 0, ham: 0 }));
  scores.forEach((s, i) => {
    const k = clamp(Math.floor((s - LOGODDS_BINS[0]) / 5), 0, bins.length - 1);
    bins[k][actual[i] ? 'spam' : 'ham']++;
  });
  smsModelCache = {
    corpus,
    model,
    matrix,
    auc: rocArea(scores, actual),
    majority: { accuracy: actual.filter((a) => !a).length / actual.length },
    mcnemar: mcnemarTest(b, c),
    spamWords: words.slice(0, 12),
    hamWords: words.slice(-12).reverse(),
    bins,
    trainSpamShare: model.classes[1] / (model.classes[0] + model.classes[1]),
  };
  return smsModelCache;
}

// --- 4.8 Lo stesso motore su NSL-KDD ---------------------------------------------

export const KDD_DATA = KDD_SOURCE;
export const KDD_FEATURES = Object.freeze(['protocol', 'service', 'flag']);
export const KDD_LEVELS = Object.freeze({ protocol: PROTOCOLS, service: SERVICES, flag: FLAGS });

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let kddCache = null;

/** The records of NSL-KDD: the codes of protocol, service and flag, whether it is an attack, and the bytes sent by the source. */
export function kddRecords() {
  if (kddCache) return kddCache;
  const codes = RECORDS.join('');
  const n = codes.length / 4;
  const protocol = new Uint8Array(n);
  const service = new Uint8Array(n);
  const flag = new Uint8Array(n);
  const attack = new Uint8Array(n);
  const normal = LABELS.indexOf('normal');
  for (let i = 0; i < n; i++) {
    protocol[i] = ALPHABET.indexOf(codes[4 * i]);
    service[i] = ALPHABET.indexOf(codes[4 * i + 1]);
    flag[i] = ALPHABET.indexOf(codes[4 * i + 2]);
    attack[i] = ALPHABET.indexOf(codes[4 * i + 3]) === normal ? 0 : 1;
  }
  const bytes = Float64Array.from(SRC_BYTES.join(',').split(','), (s) => parseInt(s, 36));
  if (bytes.length !== n) fail('the bytes and the records of NSL-KDD differ in number');
  kddCache = { n, protocol, service, flag, attack, bytes, columns: { protocol, service, flag } };
  return kddCache;
}

let kddModelCache = null;

/**
 * Categorical naive Bayes on NSL-KDD: from protocol, service and flag, is
 * the connection an attack? Trained on 7 records in 10, judged on the other
 * 3, against the full table of the three columns together (the exact
 * Bayes, with a Beta(1, 1) prior in every cell) and against the rule that
 * calls everything an attack (the larger class).
 */
export function kddModel() {
  if (kddModelCache) return kddModelCache;
  const R = kddRecords();
  const sizes = KDD_FEATURES.map((f) => KDD_LEVELS[f].length);
  const counts = KDD_FEATURES.map((_, j) => [new Float64Array(sizes[j]), new Float64Array(sizes[j])]);
  const classes = [0, 0];
  const joint = new Map();
  for (let i = 0; i < R.n; i++) {
    if (inTest(i)) continue;
    const c = R.attack[i];
    classes[c]++;
    KDD_FEATURES.forEach((f, j) => {
      counts[j][c][R.columns[f][i]]++;
    });
    const key = `${R.protocol[i]},${R.service[i]},${R.flag[i]}`;
    const e = joint.get(key) || [0, 0];
    e[c]++;
    joint.set(key, e);
  }
  const priorLogOdds = Math.log(classes[1] / classes[0]);
  const featureWeight = (j, v) => Math.log((counts[j][1][v] + 1) / (classes[1] + sizes[j])) - Math.log((counts[j][0][v] + 1) / (classes[0] + sizes[j]));
  const explain = (p, s, f) => {
    const values = [p, s, f];
    const parts = KDD_FEATURES.map((feature, j) => ({ feature, value: KDD_LEVELS[feature][values[j]], weight: featureWeight(j, values[j]), attacks: counts[j][1][values[j]], normals: counts[j][0][values[j]] }));
    const logOdds = priorLogOdds + parts.reduce((sum, x) => sum + x.weight, 0);
    const e = joint.get(`${p},${s},${f}`) || [0, 0];
    return { parts, logOdds, posterior: sigmoid(logOdds), joint: { attacks: e[1], normals: e[0], posterior: e[0] + e[1] ? (e[1] + 1) / (e[0] + e[1] + 2) : null } };
  };
  const test = range(R.n).filter(inTest);
  const actual = test.map((i) => R.attack[i] === 1);
  const naive = test.map((i) => explain(R.protocol[i], R.service[i], R.flag[i]));
  const predictedNaive = naive.map((x) => x.logOdds > 0);
  const predictedJoint = naive.map((x) => (x.joint.posterior === null ? classes[1] > classes[0] : x.joint.posterior > 0.5));
  const majorityAttack = classes[1] > classes[0];
  let b = 0;
  let c = 0;
  predictedNaive.forEach((p, k) => {
    const nbRight = p === actual[k];
    const ruleRight = majorityAttack === actual[k];
    if (nbRight && !ruleRight) b++;
    if (ruleRight && !nbRight) c++;
  });
  kddModelCache = {
    classes,
    priorLogOdds,
    explain,
    train: R.n - test.length,
    test: test.length,
    naive: confusion(predictedNaive, actual),
    joint: confusion(predictedJoint, actual),
    majority: confusion(test.map(() => majorityAttack), actual),
    auc: rocArea(naive.map((x) => x.logOdds), actual),
    mcnemar: mcnemarTest(b, c),
    cells: joint.size,
    unseen: naive.filter((x) => x.joint.posterior === null).length,
  };
  return kddModelCache;
}

/** The connection that the explanation of section 1.8 shows as the page opens: TCP, private, S0 (a half-open connection, the trace of a SYN flood). */
export const KDD_EXAMPLE = Object.freeze({ protocol: 'tcp', service: 'private', flag: 'S0' });

// ---------------------------------------------------------------------------
// 5. Le forme di convergenza
// ---------------------------------------------------------------------------

// --- 5.1 In probabilita': la stima del tasso di falsi allarmi ------------------

/** A rule of the IDS raises a false alarm on 3 benign connections in 100; the estimate after n connections should stay within 1 point. */
export const FALSE_ALARMS = Object.freeze({ rate: 0.03, epsilon: 0.01 });
/** The numbers of connections of the tables of Part 2. */
export const N_STEPS = Object.freeze([10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]);

/**
 * P(|S_n/n - p| > eps) for S_n ~ Binomial(n, p), exactly: the two tails of
 * the binomial law, S < n(p - eps) and S > n(p + eps).
 */
export function deviationExact(n, p, eps) {
  const below = Math.ceil(n * (p - eps) - 1e-9) - 1;
  const above = Math.floor(n * (p + eps) + 1e-9) + 1;
  return (below >= 0 ? binomialCdf(below, n, p) : 0) + (above <= n ? binomialSf(above, n, p) : 0);
}

/** The bounds and the approximation of the same probability: Chebyshev, Hoeffding, and the normal law of the CLT. */
export function deviationBounds(n, p, eps) {
  const sd = Math.sqrt((p * (1 - p)) / n);
  return {
    chebyshev: Math.min(1, (p * (1 - p)) / (n * eps * eps)),
    hoeffding: Math.min(1, 2 * Math.exp(-2 * n * eps * eps)),
    normal: 2 * normalSf(eps / sd),
  };
}

/** The table of sections 2.1 and 2.7: n, the exact probability, the two bounds, the normal approximation, the mean square error. */
export function deviationTable(p = FALSE_ALARMS.rate, eps = FALSE_ALARMS.epsilon, ns = N_STEPS) {
  return ns.map((n) => ({ n, exact: deviationExact(n, p, eps), ...deviationBounds(n, p, eps), mse: (p * (1 - p)) / n }));
}

// --- 5.2 Quasi certa: le traiettorie ------------------------------------------

/** The paths of section 2.2: 1,000 IDS rules estimated over 10,000 connections each (stream 'paths', repetition = the path). */
export const PATHS = Object.freeze({ count: 1000, length: 10000, shown: 20 });
/** The values of n where the paths are recorded: about 60, evenly spaced on a logarithmic axis. */
export const PATH_POINTS = Object.freeze([...new Set(range(61).map((i) => Math.round(10 ** ((4 * i) / 60))))]);
/** The checkpoints of the tables of sections 2.2 and 2.3. */
export const PATH_CHECKS = Object.freeze([10, 30, 100, 300, 1000, 3000, 10000]);

/**
 * The running means of `count` paths of Bernoulli(rate) values. For every
 * checkpoint n: the share of paths outside the band rate +- eps at n
 * (convergence in probability), the share that leave the band at least
 * once between n and the end (the almost sure criterion, cut at `length`),
 * and the mean square error. The first `shown` paths are kept at PATH_POINTS.
 */
export function* pathsSteps(seed, { rate = FALSE_ALARMS.rate, epsilon = FALSE_ALARMS.epsilon, count = PATHS.count, length = PATHS.length, shown = PATHS.shown } = {}) {
  const outside = new Float64Array(PATH_CHECKS.length);
  const after = new Float64Array(PATH_CHECKS.length);
  const square = new Float64Array(PATH_CHECKS.length);
  const kept = [];
  const points = new Set(PATH_POINTS);
  const checks = new Map(PATH_CHECKS.map((n, i) => [n, i]));
  for (let j = 0; j < count; j++) {
    const next = generator(seed, 'paths', j);
    let sum = 0;
    let lastOutside = 0;
    const line = [];
    for (let n = 1; n <= length; n++) {
      sum += bernoulli(next, rate);
      // outside means |S - n p| > n eps, compared on the counts as deviationExact does: a mean exactly on the edge stays inside
      const gap = Math.abs(sum - rate * n);
      const out = gap > epsilon * n + 1e-9;
      if (out) lastOutside = n;
      if (j < shown && points.has(n)) line.push(sum / n);
      const c = checks.get(n);
      if (c !== undefined) {
        if (out) outside[c]++;
        square[c] += (gap / n) ** 2;
      }
    }
    // a path has left the band after n if its last exit came at n or later
    PATH_CHECKS.forEach((n, c) => {
      if (lastOutside >= n) after[c]++;
    });
    if (j < shown) kept.push(line);
    if (j % 25 === 24) yield;
  }
  return {
    rate,
    epsilon,
    count,
    length,
    checks: PATH_CHECKS.map((n, c) => ({ n, outside: outside[c] / count, after: after[c] / count, mse: square[c] / count, exactMse: (rate * (1 - rate)) / n, exactOutside: deviationExact(n, rate, epsilon) })),
    paths: kept,
    points: PATH_POINTS,
  };
}

// --- 5.3 I controesempi che separano le convergenze --------------------------

/**
 * The sequences of "Try it": all converge to 0 in some sense, except the
 * last, whose limit is Z itself.
 *  mean:       the mean of n fair coins, minus 1/2: every kind of convergence;
 *  bern1:      independent Bernoulli(1/n): in probability and in L2, not almost surely;
 *  bern2:      independent Bernoulli(1/n^2): every kind, almost surely by Borel-Cantelli;
 *  typewriter: the indicator of a sliding interval of length 2^-k: in probability and in L2, almost surely nowhere;
 *  spike:      n 1{U < 1/n}: almost surely and in probability, not in L2;
 *  flip:       (-1)^n Z with Z normal: in distribution only.
 */
export const SEQUENCES = Object.freeze(['mean', 'bern1', 'bern2', 'typewriter', 'spike', 'flip']);
export const SEQUENCE_EPSILON = 0.1;
/** Which modes every sequence has, as the theory says (the numbers of sequenceFacts show them). */
export const SEQUENCE_MODES = Object.freeze({
  mean: Object.freeze({ probability: true, as: true, l2: true, distribution: true }),
  bern1: Object.freeze({ probability: true, as: false, l2: true, distribution: true }),
  bern2: Object.freeze({ probability: true, as: true, l2: true, distribution: true }),
  typewriter: Object.freeze({ probability: true, as: false, l2: true, distribution: true }),
  spike: Object.freeze({ probability: true, as: true, l2: false, distribution: true }),
  flip: Object.freeze({ probability: false, as: false, l2: false, distribution: true }),
});

/** The block and the position of n = 2^k + j in the typewriter sequence. */
const typewriterIndex = (n) => {
  const k = Math.floor(Math.log2(n));
  return { k, j: n - 2 ** k };
};

/**
 * The exact numbers of a sequence at n: the probability of a deviation
 * larger than eps, the mean square distance from the limit, the probability
 * of another deviation at some m >= n (the almost sure criterion; 1 means
 * that deviations never stop), and the distance between the laws (for a
 * constant limit, convergence in distribution is convergence in probability).
 */
export function sequenceFacts(key, n, eps = SEQUENCE_EPSILON) {
  if (key === 'mean') {
    return { deviation: deviationExact(n, 0.5, eps), l2: 1 / (4 * n), afterwards: null, law: deviationExact(n, 0.5, eps) };
  }
  if (key === 'bern1') return { deviation: 1 / n, l2: 1 / n, afterwards: 1, law: 1 / n };
  if (key === 'bern2') return { deviation: 1 / (n * n), l2: 1 / (n * n), afterwards: n >= 2 ? 1 / n : 1, law: 1 / (n * n) };
  if (key === 'typewriter') {
    const { k } = typewriterIndex(n);
    return { deviation: 2 ** -k, l2: 2 ** -k, afterwards: 1, law: 2 ** -k };
  }
  if (key === 'spike') return { deviation: 1 / n, l2: n, afterwards: 1 / n, law: 1 / n };
  if (key === 'flip') {
    const odd = n % 2 === 1;
    return { deviation: odd ? 2 * normalSf(eps / 2) : 0, l2: odd ? 4 : 0, afterwards: 2 * normalSf(eps / 2), law: 0 };
  }
  return fail(`unknown sequence ${key}`);
}

/** The x values of the paths of "Try it": 1 to 1,000 on a logarithmic axis. */
export const SEQUENCE_POINTS = Object.freeze([...new Set(range(46).map((i) => Math.round(10 ** ((3 * i) / 45))))]);
export const SEQUENCE_LENGTH = 1000;

/**
 * `count` paths of a sequence, simulated (stream 'sequences', repetition
 * = the path), recorded at SEQUENCE_POINTS; and, for every path, the last n
 * where it was still away from its limit.
 */
export function sequencePaths(key, seed, count = 12, length = SEQUENCE_LENGTH) {
  const points = new Set(SEQUENCE_POINTS);
  const paths = [];
  const last = [];
  for (let j = 0; j < count; j++) {
    const next = generator(seed, 'sequences', j);
    const u = uniform53(next);
    const z = normalQuantile(u);
    let sum = 0;
    let away = 0;
    const line = [];
    for (let n = 1; n <= length; n++) {
      let v;
      let off = null;
      if (key === 'mean') {
        sum += bernoulli(next, 0.5);
        v = sum / n - 0.5;
        // on the counts, so that a mean exactly 0.1 away stays inside, as in sequenceFacts
        off = Math.abs(sum - 0.5 * n) > SEQUENCE_EPSILON * n + 1e-9;
      } else if (key === 'bern1') v = bernoulli(next, 1 / n);
      else if (key === 'bern2') v = bernoulli(next, 1 / (n * n));
      else if (key === 'typewriter') {
        const { k, j: pos } = typewriterIndex(n);
        const width = 2 ** -k;
        v = u >= pos * width && u < (pos + 1) * width ? 1 : 0;
      } else if (key === 'spike') v = u < 1 / n ? n : 0;
      else if (key === 'flip') v = n % 2 ? -z : z;
      const limit = key === 'flip' ? z : 0;
      if (off ?? Math.abs(v - limit) > SEQUENCE_EPSILON) away = n;
      if (points.has(n)) line.push(v);
    }
    paths.push(line);
    last.push(away);
  }
  return { key, paths, last, points: SEQUENCE_POINTS };
}

// --- 5.4 Il limite centrale ----------------------------------------------------

/** The laws whose sums section 2.4 and "Try it" standardize. */
export const CLT_LAWS = Object.freeze(['bernoulli', 'exponential', 'uniform', 'cauchy']);
export const CLT_SIZES = Object.freeze([1, 2, 5, 10, 30, 100, 300, 1000]);
/** Shevtsova's constant (2011) of the Berry-Esseen theorem for independent and identically distributed values. */
export const BERRY_ESSEEN_C = 0.4748;

/**
 * Every law with its mean, its standard deviation, the third absolute
 * central moment rho and the ratio rho/sigma^3 of the Berry-Esseen bound,
 * and a sampler from one uniform: a false alarm (Bernoulli 0.03), the time
 * between two alarms (exponential of mean 1), a uniform value, and Cauchy,
 * which has no mean.
 */
export function lawFacts(law) {
  const p = FALSE_ALARMS.rate;
  if (law === 'bernoulli') {
    const sd = Math.sqrt(p * (1 - p));
    const rho = p * (1 - p) * (p * p + (1 - p) * (1 - p));
    return { mean: p, sd, rho, ratio: rho / sd ** 3, sample: (u) => (u < p ? 1 : 0) };
  }
  if (law === 'exponential') {
    const rho = 12 / Math.E - 2;
    return { mean: 1, sd: 1, rho, ratio: rho, sample: (u) => -Math.log(u) };
  }
  if (law === 'uniform') {
    const sd = Math.sqrt(1 / 12);
    return { mean: 0.5, sd, rho: 1 / 32, ratio: 1 / 32 / sd ** 3, sample: (u) => u };
  }
  if (law === 'cauchy') return { mean: null, sd: null, rho: null, ratio: null, sample: (u) => Math.tan(Math.PI * (u - 0.5)) };
  return fail(`unknown law ${law}`);
}

/**
 * `reps` sums of n values of a law, standardized: (S_n - n mu)/(sigma
 * sqrt n); for Cauchy the mean S_n/n, which has no mean to subtract.
 * Repetition r draws from stream `stream`, repetition offset + r.
 */
export function standardizedSums(law, n, reps, seed, { stream = 'clt', offset = 0 } = {}) {
  const f = lawFacts(law);
  const out = new Float64Array(reps);
  for (let r = 0; r < reps; r++) {
    const next = generator(seed, stream, offset + r);
    let s = 0;
    for (let i = 0; i < n; i++) s += f.sample(uniform53(next));
    out[r] = law === 'cauchy' ? s / n : (s - n * f.mean) / (f.sd * Math.sqrt(n));
  }
  return out;
}

/** A histogram of values on [x0, x1] as densities, with `count` bars; the values outside are left out (their share is returned). */
export function histogram(values, x0, x1, count) {
  const width = (x1 - x0) / count;
  const bars = range(count).map((i) => ({ from: x0 + i * width, to: x0 + (i + 1) * width, count: 0, value: 0 }));
  let outside = 0;
  for (const v of values) {
    const k = Math.floor((v - x0) / width);
    if (k < 0 || k >= count) outside++;
    else bars[k].count++;
  }
  for (const b of bars) b.value = b.count / (values.length * width);
  return { bars, outside: outside / values.length };
}

/**
 * The exact Kolmogorov distance between the standardized binomial law and
 * the normal one: the supremum is reached at a jump, on one side or the
 * other of it, so it is enough to look at the n + 1 jumps (only those that
 * carry probability above 10^-17).
 */
export function ksExactBernoulli(n, p = FALSE_ALARMS.rate) {
  const mu = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  let D = 0;
  let cdf = 0;
  for (let k = 0; k <= n; k++) {
    const mass = Math.exp(binomialLogPmf(k, n, p));
    const Phi = normalCdf((k - mu) / sd);
    D = Math.max(D, Math.abs(cdf - Phi));
    cdf += mass;
    D = Math.max(D, Math.abs(cdf - Phi));
    if (k > mu && 1 - cdf < 1e-17) break;
  }
  return D;
}

/**
 * The exact Kolmogorov distance between the standardized sum of n
 * exponential values (a Gamma(n, 1) law) and the normal one: the
 * largest gap on a grid of z, refined by golden section around it.
 */
export function ksExactExponential(n) {
  const root = Math.sqrt(n);
  const gap = (z) => Math.abs(gammaCdf(n + z * root, n) - normalCdf(z));
  let best = -6;
  let bestGap = 0;
  for (let i = 0; i <= 1200; i++) {
    const z = -6 + i * 0.01;
    const g = gap(z);
    if (g > bestGap) {
      bestGap = g;
      best = z;
    }
  }
  let a = best - 0.01;
  let b = best + 0.01;
  const ratio = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const c = b - ratio * (b - a);
    const d = a + ratio * (b - a);
    if (gap(c) > gap(d)) b = d;
    else a = c;
  }
  return Math.max(bestGap, gap((a + b) / 2));
}

/** The Berry-Esseen bound C rho/(sigma^3 sqrt n), capped at 1. */
export const berryEsseen = (ratio, n) => Math.min(1, (BERRY_ESSEEN_C * ratio) / Math.sqrt(n));

/** The table of section 2.4: for every n, the exact distance from the normal law of the two sums, and their Berry-Esseen bounds. */
export function cltTable(ns = CLT_SIZES) {
  const b = lawFacts('bernoulli');
  const e = lawFacts('exponential');
  return ns.map((n) => ({ n, bernoulli: ksExactBernoulli(n), bernoulliBound: berryEsseen(b.ratio, n), exponential: ksExactExponential(n), exponentialBound: berryEsseen(e.ratio, n) }));
}

// --- 5.5 Le code pesanti: Cauchy e i byte di NSL-KDD --------------------------

let bytesCache = null;

/** The bytes sent by the source of the 22,544 connections: mean, standard deviation, skewness, the Berry-Esseen ratio, the share of the largest ones. */
export function bytesFacts() {
  if (bytesCache) return bytesCache;
  const x = kddRecords().bytes;
  const n = x.length;
  let mean = 0;
  for (const v of x) mean += v / n;
  let m2 = 0;
  let m3 = 0;
  let a3 = 0;
  for (const v of x) {
    const d = v - mean;
    m2 += (d * d) / n;
    m3 += (d * d * d) / n;
    a3 += Math.abs(d * d * d) / n;
  }
  const sd = Math.sqrt(m2);
  const sorted = Float64Array.from(x).sort();
  const total = mean * n;
  const top = (k) => sorted.slice(n - k).reduce((s, v) => s + v, 0) / total;
  let zeros = 0;
  for (const v of x) if (v === 0) zeros++;
  bytesCache = {
    n,
    mean,
    sd,
    skewness: m3 / sd ** 3,
    ratio: a3 / sd ** 3,
    median: (sorted[(n - 1) >> 1] + sorted[n >> 1]) / 2,
    max: sorted[n - 1],
    zeros,
    top10: top(10),
    top1: top(1),
    // how many connections the Berry-Esseen bound needs to promise a distance below 0.05
    needed: Math.ceil(((BERRY_ESSEEN_C * (a3 / sd ** 3)) / 0.05) ** 2),
  };
  return bytesCache;
}

export const BYTES_SIZES = Object.freeze([10, 100, 1000]);
export const BYTES_REPS = 10000;

/**
 * Samples of n connections drawn with replacement from the 22,544 (stream
 * 'bytes', repetition offset + r): their mean bytes, standardized by the
 * true mean and sd/sqrt n. The CLT promises a normal law; the tails of the
 * data delay it.
 */
export function bytesMeans(n, reps, seed, offset = 0) {
  const x = kddRecords().bytes;
  const f = bytesFacts();
  const out = new Float64Array(reps);
  for (let r = 0; r < reps; r++) {
    const next = generator(seed, 'bytes', offset + r);
    let s = 0;
    for (let i = 0; i < n; i++) s += x[uniformInt(next, x.length)];
    out[r] = (s / n - f.mean) / (f.sd / Math.sqrt(n));
  }
  return out;
}

/** The running means of `count` Cauchy paths (stream 'cauchy'), at PATH_POINTS: they never settle. */
export function cauchyPaths(seed, count = 8, length = PATHS.length) {
  const points = new Set(PATH_POINTS);
  return range(count).map((j) => {
    const next = generator(seed, 'cauchy', j);
    let s = 0;
    const line = [];
    for (let n = 1; n <= length; n++) {
      s += Math.tan(Math.PI * (uniform53(next) - 0.5));
      if (points.has(n)) line.push(s / n);
    }
    return line;
  });
}

// --- 5.6 Il posterior converge: Bernstein-von Mises ----------------------------

/** The long campaign of section 2.8: up to 10,000 e-mails at the true rate 12%, one stream (stream 'bvm'). */
export const BVM = Object.freeze({ rate: CAMPAIGN.rate, length: 10000, checks: Object.freeze([10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]) });

/** The Kolmogorov distance between the Beta(a, b) posterior and the normal law with its mean and standard deviation. */
export function betaNormalDistance(a, b) {
  const m = a / (a + b);
  const s = Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)));
  const gap = (x) => Math.abs(betaCdf(x, a, b) - normalCdf((x - m) / s));
  const lo = Math.max(1e-12, m - 7 * s);
  const hi = Math.min(1 - 1e-12, m + 7 * s);
  let best = lo;
  let bestGap = 0;
  const steps = 700;
  for (let i = 0; i <= steps; i++) {
    const x = lo + ((hi - lo) * i) / steps;
    const g = gap(x);
    if (g > bestGap) {
      bestGap = g;
      best = x;
    }
  }
  const h = (hi - lo) / steps;
  let u = Math.max(lo, best - h);
  let v = Math.min(hi, best + h);
  const ratio = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const c = v - ratio * (v - u);
    const d = u + ratio * (v - u);
    if (gap(c) > gap(d)) v = d;
    else u = c;
  }
  // the gap at 0 and 1, where a normal law still has mass and the Beta none
  return Math.max(bestGap, gap((u + v) / 2), normalCdf((0 - m) / s), 1 - normalCdf((1 - m) / s));
}

/**
 * The same e-mails seen by two analysts, one with the flat prior and one
 * with the wrong one (Beta(40, 60), mean 40%): at every checkpoint, the
 * posterior mean and standard deviation of each, and the distance of each
 * posterior from its normal approximation. Both forget their prior.
 */
export function bvmFacts(seed) {
  const next = generator(seed, 'bvm', 0);
  const checks = new Set(BVM.checks);
  let clicks = 0;
  const rows = [];
  for (let n = 1; n <= BVM.length; n++) {
    clicks += bernoulli(next, BVM.rate);
    if (!checks.has(n)) continue;
    const row = { n, clicks, mle: clicks / n };
    for (const key of ['uniform', 'wrong']) {
      const [a0, b0] = PRIORS[key];
      const a = a0 + clicks;
      const b = b0 + n - clicks;
      row[key] = { mean: a / (a + b), sd: Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1))), distance: betaNormalDistance(a, b) };
    }
    rows.push(row);
  }
  return rows;
}

// --- 5.7 Le collisioni di hash: il compleanno ------------------------------------

/** The sizes of the identifiers, in bits. */
export const HASH_BITS = Object.freeze([16, 20, 24, 32]);
/** The sizes "Try it" can simulate (32 bits would take millions of draws per trial). */
export const HASH_TRY_BITS = Object.freeze([16, 20, 24]);

/** The probability that m random identifiers of `bits` bits are not all different: 1 - prod (1 - i/N), in logarithms. */
export function collisionExact(bits, m) {
  const N = 2 ** bits;
  if (m > N) return 1;
  let ln = 0;
  for (let i = 1; i < m; i++) ln += Math.log1p(-i / N);
  return -Math.expm1(ln);
}

/** The smallest number of identifiers with a collision more likely than not, found by bisection. */
export function collisionMedian(bits) {
  let lo = 1;
  let hi = Math.ceil(2 * Math.sqrt(2 ** bits)) + 2;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (collisionExact(bits, mid) >= 0.5) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** One trial: m identifiers drawn at random from 2^bits; true if two of them are equal. */
export function collisionTrial(next, bits, m) {
  const N = 2 ** bits;
  const seen = new Set();
  for (let i = 0; i < m; i++) {
    const v = uniformInt(next, N);
    if (seen.has(v)) return true;
    seen.add(v);
  }
  return false;
}

/** `trials` trials (stream 'hash', repetitions offset to offset + trials - 1): how many saw a collision. */
export function collisionRun(bits, m, trials, seed, offset = 0) {
  let hits = 0;
  for (let t = 0; t < trials; t++) if (collisionTrial(generator(seed, 'hash', offset + t), bits, m)) hits++;
  return hits;
}

/** The trials of the test of the summary: 16-bit identifiers, as many as give a collision one time in two, 20,000 times (as many as the other simulations of the page). */
export const HASH_TEST = Object.freeze({ bits: 16, trials: 20000 });

// --- 5.8 La mappa delle implicazioni ---------------------------------------------

/** The four modes, and the arrows that always hold between them. */
export const MODES = Object.freeze(['as', 'l2', 'probability', 'distribution']);
export const IMPLICATIONS = Object.freeze([
  Object.freeze(['as', 'probability']),
  Object.freeze(['l2', 'probability']),
  Object.freeze(['probability', 'distribution']),
]);

/** Whether mode a implies mode b (directly or through probability), and when it does not, the sequence that shows it. */
export function implication(a, b) {
  if (a === b) return { holds: true };
  const direct = (x, y) => IMPLICATIONS.some(([u, v]) => u === x && v === y);
  if (direct(a, b) || (direct(a, 'probability') && direct('probability', b))) return { holds: true };
  const counter = {
    'probability>as': 'bern1',
    'probability>l2': 'spike',
    'l2>as': 'typewriter',
    'as>l2': 'spike',
    'distribution>probability': 'flip',
    'distribution>as': 'flip',
    'distribution>l2': 'flip',
  }[`${a}>${b}`];
  return { holds: false, counter };
}

// --- 5.9 Perche' radice di n: la varianza che si somma ----------------------------

/**
 * The standard error of the share of false alarms after n connections:
 * with independent connections the variances add up, Var(S_n) = n p(1 - p),
 * so the count spreads as sqrt(n) and the share as 1/sqrt(n). For every n:
 * the variance and the standard deviation of the count, the standard error
 * of the share and the half-width of its 95% interval.
 */
export function rootTable(p = FALSE_ALARMS.rate, ns = [10, 100, 1000, 10000, 100000]) {
  const z = normalQuantile(0.975);
  return ns.map((n) => {
    const variance = n * p * (1 - p);
    const se = Math.sqrt((p * (1 - p)) / n);
    return { n, variance, sd: Math.sqrt(variance), se, half: z * se };
  });
}

/** The connections needed for a 95% interval of half-width eps: n = z^2 p(1 - p)/eps^2, the square of the precision. */
export function sampleSizeFor(eps, p = FALSE_ALARMS.rate, level = 0.95) {
  const z = normalQuantile(1 - (1 - level) / 2);
  return Math.ceil((z * z * p * (1 - p)) / (eps * eps));
}

/** The values of alpha of "Try it: the right scale", the sizes and how many means per size. */
export const SCALE_ALPHAS = Object.freeze([0, 0.25, 0.4, 0.5, 0.6, 0.75, 1]);
export const SCALE_SIZES = Object.freeze([10, 100, 1000]);
export const SCALE_REPS = 2000;

/**
 * Means of n exponential values of mean 1 (the times between two alarms,
 * in minutes), as sqrt(n)(mean - 1), for every size of SCALE_SIZES (stream
 * 'live', repetitions from 3 x 10^6): "Try it" multiplies them by
 * n^(alpha - 1/2) to get n^alpha (mean - 1) for any alpha.
 */
export function scaleSamples(seed = DEFAULT_SEED, reps = SCALE_REPS) {
  return SCALE_SIZES.map((n, i) => {
    const out = new Float64Array(reps);
    for (let r = 0; r < reps; r++) {
      const next = generator(seed, 'live', 3000000 + i * reps + r);
      let s = 0;
      for (let k = 0; k < n; k++) s -= Math.log(uniform53(next));
      out[r] = Math.sqrt(n) * (s / n - 1);
    }
    return { n, values: out };
  });
}

// --- 5.10 Senza indipendenza: allarmi a raffica ------------------------------------

/** The correlations between two consecutive connections of "Try it: bursts". */
export const BURST_RHOS = Object.freeze([0, 0.25, 0.5, 0.75, 0.9, 0.95]);
/** The correlations of the section, and its size. */
export const BURST_SECTION = Object.freeze({ rhos: Object.freeze([0, 0.5, 0.9]), n: 1000, reps: 4000 });

/**
 * False alarms that come in bursts: a two-state Markov chain whose
 * stationary share of alarms is p and whose consecutive values have
 * correlation rho. After an alarm the next one comes with probability
 * p + rho(1 - p), after a quiet connection with probability p(1 - rho).
 */
export const burstTransitions = (p, rho) => ({ afterAlarm: p + rho * (1 - p), afterQuiet: p * (1 - rho) });

/**
 * The exact variance of the number of alarms in n connections of the
 * chain: the covariances no longer vanish, and the variances do not just
 * add up: n p(1 - p) [1 + 2 sum_{k=1}^{n-1} (1 - k/n) rho^k].
 */
export function burstVariance(n, p, rho) {
  let s = 0;
  let r = 1;
  for (let k = 1; k < n; k++) {
    r *= rho;
    if (r < 1e-18) break;
    s += (1 - k / n) * r;
  }
  return n * p * (1 - p) * (1 + 2 * s);
}

/** The factor by which the variance grows, and the effective number of independent connections: n (1 - rho)/(1 + rho) for large n. */
export function burstFacts(n, p, rho) {
  const variance = burstVariance(n, p, rho);
  const factor = variance / (n * p * (1 - p));
  // the naive 95% interval assumes independence: its true coverage, by the normal approximation
  const coverage = 2 * normalCdf(normalQuantile(0.975) / Math.sqrt(factor)) - 1;
  return { n, rho, variance, factor, limit: (1 + rho) / (1 - rho), effective: n / factor, coverage };
}

/**
 * The chain simulated: `reps` windows of n connections (stream 'bursts',
 * repetition offset + r), starting from the stationary share. Returns the
 * mean and the variance of the counts, and how often the naive 95%
 * interval, F +- 1.96 sqrt(F(1 - F)/n), contains p.
 */
export function burstSimulation(n, p, rho, reps, seed, offset = 0) {
  const { afterAlarm, afterQuiet } = burstTransitions(p, rho);
  const z = normalQuantile(0.975);
  let sum = 0;
  let sumSq = 0;
  let covered = 0;
  for (let r = 0; r < reps; r++) {
    const next = generator(seed, 'bursts', offset + r);
    let x = bernoulli(next, p);
    let count = x;
    for (let t = 1; t < n; t++) {
      x = bernoulli(next, x ? afterAlarm : afterQuiet);
      count += x;
    }
    sum += count;
    sumSq += count * count;
    const f = count / n;
    const half = z * Math.sqrt((f * (1 - f)) / n);
    if (Math.abs(f - p) <= half) covered++;
  }
  const mean = sum / reps;
  return { n, rho, reps, mean, variance: (sumSq - reps * mean * mean) / (reps - 1), coverage: covered / reps };
}

/** One path of the chain for the picture of "Try it": the alarms of the first `n` connections (stream 'bursts', repetitions from 10^6). */
export function burstPath(n, p, rho, seed = DEFAULT_SEED, j = 1000000) {
  const { afterAlarm, afterQuiet } = burstTransitions(p, rho);
  const next = generator(seed, 'bursts', j);
  const out = new Uint8Array(n);
  out[0] = bernoulli(next, p);
  for (let t = 1; t < n; t++) out[t] = bernoulli(next, out[t - 1] ? afterAlarm : afterQuiet);
  return out;
}

// --- 5.11 Altri risultati: Slutsky, metodo delta, Glivenko-Cantelli, MLE ------------

/** The sizes of the tables of section 1.7. */
export const RESULT_SIZES = Object.freeze([30, 100, 1000, 10000]);

/**
 * The exact Kolmogorov distance from the normal law of the t statistic
 * T = (F - p)/sqrt(F(1 - F)/n), where the standard deviation is estimated
 * from the data (Slutsky's theorem makes it normal in the limit). T grows
 * with the count k, so its law is the binomial one moved to the points t_k;
 * k = 0 and k = n give T = -infinity and +infinity.
 */
export function ksExactT(n, p = FALSE_ALARMS.rate) {
  let D = 0;
  let cdf = 0;
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const t = k === 0 ? -Infinity : k === n ? Infinity : (f - p) / Math.sqrt((f * (1 - f)) / n);
    const Phi = t === -Infinity ? 0 : t === Infinity ? 1 : normalCdf(t);
    const mass = Math.exp(binomialLogPmf(k, n, p));
    D = Math.max(D, Math.abs(cdf - Phi));
    cdf += mass;
    D = Math.max(D, Math.abs(cdf - Phi));
    if (k > n * p && 1 - cdf < 1e-17) break;
  }
  return D;
}

/**
 * The delta method on the log-odds g(F) = ln(F/(1 - F)): its standard
 * deviation is about |g'(p)| sqrt(p(1 - p)/n) = 1/sqrt(n p(1 - p)). The exact
 * one is computed on the binomial law, given 0 < k < n (where g is finite),
 * with the probability of k = 0 or n, left out.
 */
export function deltaLogOdds(n, p = FALSE_ALARMS.rate) {
  let mass = 0;
  let m1 = 0;
  let m2 = 0;
  for (let k = 1; k < n; k++) {
    const w = Math.exp(binomialLogPmf(k, n, p));
    if (w < 1e-300) continue;
    const g = Math.log(k / (n - k));
    mass += w;
    m1 += w * g;
    m2 += w * g * g;
  }
  const mean = m1 / mass;
  return { n, exact: Math.sqrt(m2 / mass - mean * mean), delta: 1 / Math.sqrt(n * p * (1 - p)), excluded: 1 - mass, bias: mean - Math.log(p / (1 - p)) };
}

/**
 * The maximum likelihood estimate of the rate of alarms from n exponential
 * times between them, lambda_hat = n/S_n. Its law is exact: lambda S_n is
 * Gamma(n, 1), so P(lambda_hat <= x) = P(S_n >= n/x). Returns the exact
 * Kolmogorov distance of sqrt(n)(lambda_hat - lambda)/lambda from the normal
 * law (the asymptotic normality of the MLE, with Fisher's information
 * I = 1/lambda^2), the exact relative bias and the ratio of the exact
 * variance to the Cramer-Rao bound lambda^2/n.
 */
export function mleRate(n) {
  const root = Math.sqrt(n);
  const cdf = (z) => (1 + z / root <= 0 ? 0 : 1 - gammaCdf(n / (1 + z / root), n));
  const gap = (z) => Math.abs(cdf(z) - normalCdf(z));
  let best = -6;
  let bestGap = 0;
  for (let i = 0; i <= 1200; i++) {
    const z = -6 + i * 0.01;
    const g = gap(z);
    if (g > bestGap) {
      bestGap = g;
      best = z;
    }
  }
  let a = best - 0.01;
  let b = best + 0.01;
  const ratio = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const c = b - ratio * (b - a);
    const d = a + ratio * (b - a);
    if (gap(c) > gap(d)) b = d;
    else a = c;
  }
  return {
    n,
    distance: Math.max(bestGap, gap((a + b) / 2)),
    bias: n / (n - 1) - 1,
    // Var(lambda_hat)/(lambda^2/n) = n^3/((n - 1)^2 (n - 2))
    efficiency: n > 2 ? (n * n * n) / ((n - 1) * (n - 1) * (n - 2)) : Infinity,
  };
}

/** The sizes and the samples per size of the Glivenko-Cantelli simulation. */
export const GC_SIZES = Object.freeze([10, 100, 1000, 10000]);
export const GC_REPS = 400;
/** The mean of Kolmogorov's law: sqrt(pi/2) ln 2. */
export const KOLMOGOROV_MEAN = Math.sqrt(Math.PI / 2) * Math.LN2;

/**
 * Glivenko-Cantelli: the empirical distribution function of n exponential
 * values converges uniformly to the true one, almost surely. For every n,
 * `reps` samples (stream 'gc', repetition i x reps + r): the mean of
 * D_n = sup |F_n - F|, the mean of sqrt(n) D_n (Kolmogorov: its law tends to
 * the one of K, whose mean is KOLMOGOROV_MEAN) and its values, for the test.
 */
export function glivenkoCantelli(seed, sizes = GC_SIZES, reps = GC_REPS) {
  return sizes.map((n, i) => {
    const scaled = new Float64Array(reps);
    let sumD = 0;
    const x = new Float64Array(n);
    for (let r = 0; r < reps; r++) {
      const next = generator(seed, 'gc', i * reps + r);
      for (let k = 0; k < n; k++) x[k] = -Math.log(uniform53(next));
      x.sort();
      let D = 0;
      for (let k = 0; k < n; k++) {
        const F = -Math.expm1(-x[k]);
        D = Math.max(D, (k + 1) / n - F, F - k / n);
      }
      sumD += D;
      scaled[r] = Math.sqrt(n) * D;
    }
    let sumScaled = 0;
    let over = 0;
    for (const v of scaled) {
      sumScaled += v;
      if (v > 1.3581) over++;
    }
    return { n, meanD: sumD / reps, meanScaled: sumScaled / reps, over: over / reps, scaled };
  });
}

/** The distribution function of Kolmogorov's law. */
export const kolmogorovCdf = (x) => 1 - kolmogorovSf(x);

// --- 6.1 La probabilita' condizionata ------------------------------------------------

/**
 * The chain of a phishing attack, stage by stage: the probability of every
 * stage given that the previous ones happened. By the product rule the
 * probability of the whole chain is the product of the conditional ones.
 * Plausible orders of magnitude, not data.
 */
export const ATTACK_CHAIN = Object.freeze([
  Object.freeze({ key: 'delivered', p: 0.3 }),
  Object.freeze({ key: 'opened', p: 0.6 }),
  Object.freeze({ key: 'clicked', p: 0.2 }),
  Object.freeze({ key: 'credentials', p: 0.5 }),
  Object.freeze({ key: 'mfa', p: 0.1 }),
]);
export const CAMPAIGN_SIZES = Object.freeze([1, 100, 1000]);

/** The chain multiplied out: after every stage, the probability that an e-mail has come that far; and, for a campaign of m e-mails, the probability of at least one breach. */
export function attackChain(stages = ATTACK_CHAIN) {
  let cumulative = 1;
  const rows = stages.map((s) => {
    cumulative *= s.p;
    return { ...s, cumulative };
  });
  const breach = cumulative;
  const withoutMfa = breach / stages[stages.length - 1].p;
  return {
    rows,
    breach,
    withoutMfa,
    campaigns: CAMPAIGN_SIZES.map((m) => ({ m, breach: -Math.expm1(m * Math.log1p(-breach)), withoutMfa: -Math.expm1(m * Math.log1p(-withoutMfa)) })),
  };
}

/** P(a and b | evidence) in the network of section 2.4, by enumeration. */
export function networkPair(a, b, evidence = {}) {
  let both = 0;
  let total = 0;
  for (let bits = 0; bits < 64; bits++) {
    const s = Object.fromEntries(NETWORK.nodes.map((n, i) => [n, (bits >> i) & 1]));
    if (Object.entries(evidence).some(([n, v]) => v !== null && v !== undefined && s[n] !== (v ? 1 : 0))) continue;
    const p = networkJoint(s);
    total += p;
    if (s[a] && s[b]) both += p;
  }
  return both / total;
}

/**
 * Independence and conditional independence, with the numbers of the
 * network: the two causes are independent a priori and dependent given
 * the EDR alarm; the unusual login and the EDR alarm are dependent, and
 * independent given the phishing.
 */
export function independenceFacts() {
  const prior = networkPosterior({});
  const edr = networkPosterior({ edr: true });
  return {
    causes: { phishing: prior.phishing, exploit: prior.exploit, both: networkPair('phishing', 'exploit') },
    causesGivenEdr: { phishing: edr.phishing, exploit: edr.exploit, both: networkPair('phishing', 'exploit', { edr: true }) },
    login: prior.login,
    loginGivenEdr: edr.login,
    loginGivenPhishing: networkPosterior({ phishing: true }).login,
    loginGivenPhishingEdr: networkPosterior({ phishing: true, edr: true }).login,
  };
}

/**
 * A p-value is a conditional probability: of data at least as extreme,
 * given H0. A rule of the IDS is documented with 3% false alarms; on 1,000
 * benign connections it raises 45. H0: the rate is 3%; H1: the rule has
 * drifted to 5%. The p-value P(S >= 45 | H0) against the posterior P(H0 |
 * S = 45) with a prior of 90% on H0 (most rules keep working).
 */
export const PVALUE_EXAMPLE = Object.freeze({ n: 1000, k: 45, p0: 0.03, p1: 0.05, priorH0: 0.9 });
export function pvalueFacts({ n, k, p0, p1, priorH0 } = PVALUE_EXAMPLE) {
  const pValue = binomialSf(k, n, p0);
  const l0 = binomialLogPmf(k, n, p0);
  const l1 = binomialLogPmf(k, n, p1);
  const lr = Math.exp(l1 - l0);
  const posteriorH0 = 1 / (1 + ((1 - priorH0) / priorH0) * lr);
  return { n, k, p0, p1, priorH0, pValue, likelihood0: Math.exp(l0), likelihood1: Math.exp(l1), lr, posteriorH0, posteriorEven: 1 / (1 + lr) };
}

/**
 * Many tests at once: among the hypotheses tested, a share `real` has a
 * real effect; a test finds a real effect with probability `power` and
 * rejects a true H0 with probability `alpha`. Out of 1,000 tests, the
 * expected counts (true discoveries, missed effects, false discoveries,
 * true H0 kept) and P(H0 | rejected), the false discovery rate.
 */
export const DISCOVERY_REALS = Object.freeze([0.01, 0.02, 0.05, 0.1, 0.2, 0.5]);
export const DISCOVERY_POWERS = Object.freeze([0.2, 0.5, 0.8, 0.95]);
export const DISCOVERY_ALPHAS = Object.freeze([0.05, 0.01, 0.005]);
export const DISCOVERY_DEFAULT = Object.freeze({ real: 0.1, power: 0.8, alpha: 0.05 });
export const DISCOVERY_TESTS = 1000;
export function discoveryFacts({ real, power, alpha } = DISCOVERY_DEFAULT, total = DISCOVERY_TESTS) {
  const expected = [total * real * power, total * real * (1 - power), total * (1 - real) * alpha, total * (1 - real) * (1 - alpha)];
  const rejected = real * power + (1 - real) * alpha;
  return { real, power, alpha, total, expected, counts: roundCounts(expected, total), falseDiscovery: ((1 - real) * alpha) / rejected, pRejected: rejected };
}

// --- 6.2 L'influenza del prior sulle conclusioni ------------------------------------

/** The decision of section 2.10: another training session if P(rate > 10%) exceeds 90%. */
export const DECISION_LEVEL = 0.9;
export const SENSITIVITY_DATA = Object.freeze([1, 3, 10]);

/** For every prior and every amount of data (the first 1, 3 and 10 days): the posterior mean, its 95% interval, P(rate > 10%) and the decision. */
export function priorSensitivity(seed = DEFAULT_SEED) {
  const days = campaign(seed);
  return SENSITIVITY_DATA.map((d) => {
    const chosen = days.slice(0, d);
    const clicks = chosen.reduce((s, x) => s + x.clicks, 0);
    const sent = chosen.reduce((s, x) => s + x.sent, 0);
    return {
      days: d,
      clicks,
      sent,
      priors: Object.fromEntries(PRIOR_KEYS.map((k) => {
        const post = betaPosterior(PRIORS[k], clicks, sent);
        const above = post.above(TARGET_RATE);
        return [k, { mean: post.mean, lo: post.lo, hi: post.hi, above, act: above > DECISION_LEVEL }];
      })),
    };
  });
}

/** The weight of the prior in the posterior mean of a Beta prior: (a + b)/(a + b + n); the posterior mean is w x prior mean + (1 - w) x k/n. */
export function priorWeight([a, b], clicks, sent) {
  const w = (a + b) / (a + b + sent);
  return { w, priorMean: a / (a + b), mle: sent ? clicks / sent : null, posteriorMean: (a + clicks) / (a + b + sent) };
}

/** The likelihood of the share of clicks, scaled to a maximum of 1, on the grid: a function of theta, not a density (its area is not 1). */
export function likelihoodCurve(clicks, sent) {
  const mle = clicks / sent;
  const at = (x) => {
    if (x <= 0 || x >= 1) return 0;
    let l = 0;
    if (clicks) l += clicks * Math.log(x / mle);
    if (sent - clicks) l += (sent - clicks) * Math.log((1 - x) / (1 - mle));
    return Math.exp(l);
  };
  const values = GRID.map(at);
  const h = 1 / (GRID_SIZE - 1);
  let area = 0;
  for (let i = 1; i < GRID_SIZE; i++) area += (values[i - 1] + values[i]) * h * 0.5;
  return { values, mle, area };
}

// ---------------------------------------------------------------------------
// 6. I calcoli lunghi della pagina, a fette (il worker)
// ---------------------------------------------------------------------------

/** The repetitions of the tests of the central limit theorem. */
export const CLT_REPS = 20000;
/** The sizes of the three tests on standardized sums: the exponential at 30 (the rule of thumb), the uniform at 12 (the old recipe for normal values), Cauchy at 100. */
export const CLT_TESTS = Object.freeze({ exponential: 30, uniform: 12, cauchy: 100 });

/**
 * The simulations of the page as a generator: it yields between pieces of
 * work, so the page (or the downloadable program, from file://) can run it
 * a few milliseconds at a time, and the worker runs it in one go (explore).
 * Everything here is plain data, and every number is a function of the seed.
 */
export function* exploreSteps(params = {}) {
  const { seed } = checkParams(params);
  const started = now();

  // the generator of the page: the mean of 100,000 uniform values against 1/2 (z test, known variance 1/12)
  const sample = 100000;
  const nextMain = generator(seed, 'main', 0);
  let mean = 0;
  let ss = 0;
  for (let k = 1; k <= sample; k++) {
    const u = uniform53(nextMain);
    const delta = u - mean;
    mean += delta / k;
    ss += delta * (u - mean);
    if (k % 25000 === 0) yield;
  }
  const z = (mean - 0.5) / Math.sqrt(1 / 12 / sample);
  const zp = 2 * normalSf(Math.abs(z));
  const generatorTest = { n: sample, mean, variance: ss / (sample - 1), z, p: zp, verdict: zp < SIGNIFICANCE ? 'reject' : 'accept' };

  // 1.4: Wald's test on 10,000 legitimate users and 10,000 attackers, against its exact error rates
  const setup = sprtSetup(SPRT_DEFAULT);
  const exactLegit = sprtExact(setup, SPRT_DEFAULT.p0);
  const exactAttacker = sprtExact(setup, SPRT_DEFAULT.p1);
  const legit = sprtSimulate(setup, SPRT_DEFAULT.p0, SPRT_RUNS, seed, 0);
  yield;
  const attackers = sprtSimulate(setup, SPRT_DEFAULT.p1, SPRT_RUNS, seed, SPRT_RUNS);
  yield;
  const sprt = {
    legit,
    attackers,
    exactLegit: { block: exactLegit.block, clear: exactLegit.clear, mean: exactLegit.mean },
    exactAttacker: { block: exactAttacker.block, clear: exactAttacker.clear, mean: exactAttacker.mean },
    testLegit: binomialTest(legit.block, legit.runs, exactLegit.block),
    testAttacker: binomialTest(attackers.clear, attackers.runs, exactAttacker.clear),
  };

  // 1.6: the coverage of the four intervals at the true rate of the campaign, simulated against the exact one
  const coverageSim = coverageSimulation(CAMPAIGN.rate, COVERAGE_N, COVERAGE_RUNS, seed);
  const coverageExactAt = coverageAt(CAMPAIGN.rate);
  const coverage = {
    ...coverageSim,
    exact: Object.fromEntries(INTERVAL_METHODS.map((m) => [m, coverageExactAt[m][0]])),
    test: binomialTest(coverageSim.hits.jeffreys, coverageSim.runs, coverageExactAt.jeffreys[0]),
  };
  yield;

  // 2.2 and 2.3: 1,000 paths of 10,000 connections
  const paths = yield* pathsSteps(seed);

  // 2.4: the exact distances from the normal law, and three tests on simulated sums
  const cltRows = cltTable();
  yield;
  const expo = standardizedSums('exponential', CLT_TESTS.exponential, CLT_REPS, seed, { offset: 0 });
  yield;
  const unif = standardizedSums('uniform', CLT_TESTS.uniform, CLT_REPS, seed, { offset: CLT_REPS });
  yield;
  const cauchyMeans = standardizedSums('cauchy', CLT_TESTS.cauchy, CLT_REPS, seed, { stream: 'cauchy', offset: 1000 });
  yield;
  const clt = {
    rows: cltRows,
    exponential: { n: CLT_TESTS.exponential, ...ksTest(expo, normalCdf), exact: ksExactExponential(CLT_TESTS.exponential) },
    uniform: { n: CLT_TESTS.uniform, ...ksTest(unif, normalCdf) },
    cauchy: { n: CLT_TESTS.cauchy, ...ksTest(cauchyMeans, cauchyCdf) },
  };

  // 2.6: the mean bytes of 10, 100 and 1,000 connections, and the paths of Cauchy
  const bytes = [];
  for (const [i, n] of BYTES_SIZES.entries()) {
    const values = bytesMeans(n, BYTES_REPS, seed, i * BYTES_REPS);
    const sorted = Float64Array.from(values).sort();
    bytes.push({ n, ...ksTest(values, normalCdf), histogram: histogram(values, -3, 9, 48), below: sorted.filter((v) => v < 0).length / values.length, median: sorted[values.length >> 1] });
    yield;
  }
  const cauchy = cauchyPaths(seed);
  yield;

  // 2.8: the posterior converges
  const bvm = bvmFacts(seed);
  yield;

  // "Try it" of 2.4: 16-bit identifiers, as many as give a collision once in two; 20,000 trials
  const hashM = collisionMedian(HASH_TEST.bits);
  const hashExact = collisionExact(HASH_TEST.bits, hashM);
  const hashHits = collisionRun(HASH_TEST.bits, hashM, HASH_TEST.trials, seed, 0);
  const hash = { bits: HASH_TEST.bits, m: hashM, trials: HASH_TEST.trials, hits: hashHits, exact: hashExact, test: binomialTest(hashHits, HASH_TEST.trials, hashExact) };
  yield;

  // 1.7: Glivenko-Cantelli, and the test of sqrt(n) D_n at n = 1,000 against Kolmogorov's law
  const gcRows = glivenkoCantelli(seed);
  const gcTestRow = gcRows.find((r) => r.n === 1000);
  const gc = { rows: gcRows.map(({ n, meanD, meanScaled, over }) => ({ n, meanD, meanScaled, over })), test: { n: gcTestRow.n, ...ksTest(gcTestRow.scaled, kolmogorovCdf) } };
  yield;

  // 1.9: the bursts, simulated against their exact variance and the coverage of the naive interval
  const bursts = [];
  for (const [i, rho] of BURST_SECTION.rhos.entries()) {
    const sim = burstSimulation(BURST_SECTION.n, FALSE_ALARMS.rate, rho, BURST_SECTION.reps, seed, i * BURST_SECTION.reps);
    bursts.push({ ...sim, exact: burstFacts(BURST_SECTION.n, FALSE_ALARMS.rate, rho) });
    yield;
  }

  return { params: { seed }, generator: generatorTest, sprt, coverage, paths, clt, bytes, cauchy, bvm, hash, gc, bursts, elapsed: now() - started };
}

/** The same computations in one go (the worker). */
export function explore(params = {}) {
  const steps = exploreSteps(params);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

// ---------------------------------------------------------------------------
// 8. I grafici: righe, istogrammi, barre impilate e affiancate, la griglia delle frequenze naturali; etichette sotto il puntatore e legende a pulsanti
// ---------------------------------------------------------------------------

export const DEFAULT_PALETTE = {
  background: '#ffffff',
  text: '#444444',
  grid: '#eeeeee',
  bars: '#5c6bc0',
  reference: '#d52349',
  highlight: '#d52349',
  // the first seven as in the other homework; the others for charts with many parts (the stacked bars of Homework #6 had 11)
  series: ['#5c6bc0', '#d52349', '#2e7d6b', '#f0a500', '#8e24aa', '#00838f', '#777777', '#8d6e63', '#9e9d24', '#ef6c00', '#1e88e5', '#ad1457'],
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
export function drawLineChart(canvas, { x, series, logX = false, logY = false, yMin = 0, yMax = 1, yTicks = [], xTicks = [], yFormat = null, hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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
 * exact value). The legend is in the page; `hidden` lists the parts it
 * hides ('bars', 'curve', 'marker'), which still count for the axis.
 */
export function drawHistogram(canvas, { x0, x1, bars, curve = null, marker = null, yMax = null, xTicks = [], hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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



const STACK_MARGIN = { left: 96, right: 14, top: 8, bottom: 26 };
const STACK_ROW = 26;
const STACK_GAP = 10;

/** Where the bars of drawStackedBars lie: one row per bar, the shares from 0 to 1 across the plot. */
function stackLayout(data, width) {
  const margin = { ...STACK_MARGIN, left: Math.max(56, Math.min(STACK_MARGIN.left, Math.round(width * 0.24))) };
  const n = data.rows.length;
  const h = n * STACK_ROW + (n - 1) * STACK_GAP + (data.separate ? STACK_GAP : 0);
  const height = margin.top + h + margin.bottom;
  const w = width - margin.left - margin.right;
  const px = (v) => margin.left + w * v;
  const top = (i) => margin.top + i * (STACK_ROW + STACK_GAP) + (data.separate && i === n - 1 ? STACK_GAP : 0);
  return { margin, w, h, height, px, top };
}

/**
 * Bars of conditional shares, one per row, each from 0 to 100%: the row
 * { label, values } has one segment per level (their shares add to 1), in
 * the colours of the palette, so the bars of the levels of X can be
 * compared with each other and with the last one (`separate`: the
 * marginal distribution, set a little apart). `hidden` lists the segments
 * the legend hides ('seg:j'): their place stays empty, the others do not
 * move.
 */
export function drawStackedBars(canvas, { rows, separate = false, hidden = [], width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width = knownWidth || canvas.clientWidth || 600;
  const L = stackLayout({ rows, separate }, width);
  const { ctx } = setupCanvas(canvas, L.height / width, width);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, L.height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'center';
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    ctx.moveTo(L.px(v), L.margin.top);
    ctx.lineTo(L.px(v), L.margin.top + L.h);
    ctx.stroke();
    xTickLabel(ctx, `${Math.round(v * 100)}%`, L.px(v), L.margin.top + L.h + 16, width);
  }
  rows.forEach((row, i) => {
    const y = L.top(i);
    let acc = 0;
    row.values.forEach((v, j) => {
      const share = Number.isFinite(v) ? v : 0;
      if (!hidden.includes(`seg:${j}`) && share > 0) {
        ctx.fillStyle = pal.series[j % pal.series.length];
        ctx.globalAlpha = 0.88;
        ctx.fillRect(L.px(acc), y, Math.max(0.6, L.px(acc + share) - L.px(acc)), STACK_ROW);
        ctx.globalAlpha = 1;
      }
      acc += share;
    });
    ctx.strokeStyle = pal.grid;
    ctx.strokeRect(L.px(0), y, L.w, STACK_ROW);
    ctx.fillStyle = pal.text;
    ctx.textAlign = 'right';
    const label = row.label.length > 16 ? `${row.label.slice(0, 15)}…` : row.label;
    ctx.fillText(label, L.margin.left - 6, y + STACK_ROW / 2 + 4);
  });
}

const GROUP_ASPECT = 0.5;
const GROUP_MARGIN = { left: 48, right: 12, top: 10, bottom: 30 };

/** Where the bars of drawGroupedBars lie: the categories across, one bar per series inside each. */
function groupLayout(data, width) {
  const height = Math.round(width * GROUP_ASPECT);
  const margin = GROUP_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const k = data.categories.length;
  const s = data.series.length;
  const slot = w / k;
  const inner = slot * 0.78;
  const bar = inner / s;
  const x = (cat, ser) => margin.left + cat * slot + (slot - inner) / 2 + ser * bar;
  const py = (v) => margin.top + h * (1 - Math.min(1, Math.max(0, v / data.yMax)));
  return { margin, w, h, height, slot, bar, x, py };
}

/**
 * Bars side by side: for every category (a level, a department) one bar per
 * series ({ values, colorIndex }), from 0 up, on the scale [0, yMax] with
 * the ticks `yTicks` (yFormat writes them). `hidden` lists the series the
 * legend hides ('series:s'): their bars leave an empty place.
 */
export function drawGroupedBars(canvas, { categories, series, yMax, yTicks = [], yFormat = null, hidden = [], decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, GROUP_ASPECT, knownWidth);
  const L = groupLayout({ categories, series, yMax }, width);
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
    ctx.moveTo(L.margin.left, L.py(v));
    ctx.lineTo(L.margin.left + L.w, L.py(v));
    ctx.stroke();
    ctx.fillText(label(v), L.margin.left - 4, L.py(v) + 4);
  }
  ctx.strokeRect(L.margin.left, L.margin.top, L.w, L.h);
  series.forEach((s, j) => {
    if (hidden.includes(`series:${j}`)) return;
    ctx.fillStyle = pal.series[(s.colorIndex ?? j) % pal.series.length];
    ctx.globalAlpha = s.dim ? 0.45 : 0.88;
    s.values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      const top = L.py(v);
      ctx.fillRect(L.x(i, j) + 0.5, top, Math.max(0.8, L.bar - 1), L.margin.top + L.h - top);
    });
    ctx.globalAlpha = 1;
  });
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'center';
  categories.forEach((name, i) => {
    const text = name.length > 12 ? `${name.slice(0, 11)}…` : name;
    xTickLabel(ctx, text, L.margin.left + (i + 0.5) * L.slot, L.margin.top + L.h + 16, width);
  });
}

/** The height that a chart function gives a canvas of this width, to reserve the space before drawing. */
export function chartHeight(draw, data, width) {
  if (draw === drawIconArray) return iconLayout(data, width).height;
  if (draw === drawStrip) return stripLayout(data, width).height;
  if (draw === drawLineChart) return lineLayout(data, width).height;
  if (draw === drawStackedBars) return stackLayout(data, width).height;
  if (draw === drawGroupedBars) return groupLayout(data, width).height;
  return histLayout(data, width).height;
}

/**
 * What lies under the point (x, y) of a chart drawn at this width, in CSS
 * pixels from its top left corner; null outside the plot or on a hidden
 * part. For lines, the index of the nearest x; for histograms, the bar; for
 * stacked bars, the segment of a row; for grouped bars, the category (the
 * label lists its bars). `rect` is the rectangle to outline.
 */
export function chartHitTest(draw, data, width, x, y) {
  if (draw === drawIconArray) return iconHit(data, width, x, y);
  if (draw === drawStrip) return stripHit(data, width, x, y);
  const off = data.hidden || [];
  if (draw === drawLineChart) {
    const { margin, h, w, xs } = lineLayout(data, width);
    if (x < margin.left - 6 || x > margin.left + w + 6 || y < margin.top || y > margin.top + h) return null;
    let index = 0;
    xs.forEach((X, i) => {
      if (Math.abs(X - x) < Math.abs(xs[index] - x)) index = i;
    });
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawStackedBars) {
    const L = stackLayout(data, width);
    const i = data.rows.findIndex((_, k) => y >= L.top(k) && y <= L.top(k) + STACK_ROW);
    if (i < 0 || x < L.px(0) || x > L.px(1)) return null;
    const v = (x - L.margin.left) / L.w;
    let acc = 0;
    for (let j = 0; j < data.rows[i].values.length; j++) {
      const share = data.rows[i].values[j] || 0;
      if (share > 0 && v >= acc && v <= acc + share) {
        if (off.includes(`seg:${j}`)) return null;
        return { kind: 'segment', index: i, segment: j, rect: { x: L.px(acc), y: L.top(i), width: Math.max(2, L.px(acc + share) - L.px(acc)), height: STACK_ROW } };
      }
      acc += share;
    }
    return null;
  }
  if (draw === drawGroupedBars) {
    const L = groupLayout(data, width);
    if (x < L.margin.left || x > L.margin.left + L.w || y < L.margin.top || y > L.margin.top + L.h) return null;
    if (data.series.every((_, j) => off.includes(`series:${j}`))) return null;
    const index = Math.min(data.categories.length - 1, Math.floor((x - L.margin.left) / L.slot));
    return { kind: 'bar', index, rect: { x: L.margin.left + index * L.slot, y: L.margin.top, width: L.slot, height: L.h } };
  }
  const { margin, w, h, px } = histLayout(data, width);
  if (x < margin.left || x > margin.left + w || y < margin.top || y > margin.top + h) return null;
  if (off.includes('bars')) return null;
  const index = data.bars.findIndex((b) => x >= px(b.from) && x < px(b.to));
  if (index < 0) return null;
  const b = data.bars[index];
  return { kind: 'bar', index, rect: { x: px(b.from), y: margin.top, width: Math.max(2, px(b.to) - px(b.from)), height: h } };
}

/**
 * The reverse of chartHitTest: what the pointer would hit on the point,
 * the row of stacked bars or the category `index`; null for any other
 * chart or index. A row of a table uses it to outline its part.
 */
export function chartHitAt(draw, data, width, index) {
  if (draw === drawIconArray) return iconRegion(data, width, index);
  if (draw === drawLineChart) {
    const { margin, h, xs } = lineLayout(data, width);
    if (!(index >= 0 && index < xs.length)) return null;
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  if (draw === drawStackedBars) {
    if (!(index >= 0 && index < data.rows.length)) return null;
    const L = stackLayout(data, width);
    return { kind: 'segment', index, rect: { x: L.px(0), y: L.top(index), width: L.w, height: STACK_ROW } };
  }
  if (draw === drawGroupedBars) {
    if (!(index >= 0 && index < data.categories.length)) return null;
    const L = groupLayout(data, width);
    return { kind: 'bar', index, rect: { x: L.margin.left + index * L.slot, y: L.margin.top, width: L.slot, height: L.h } };
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
export const attachChartTooltip = (canvas, { draw, data, describe: explain, link = null }) =>
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
export function attachPointerLabel(canvas, locate, link = null) {
  const box = canvas.parentElement;
  // where the element lies inside its box: the offsets of an HTML element (a canvas), the
  // difference of the rectangles for the others (an SVG drawing), which have no offsets
  const offset = () => {
    if (typeof canvas.offsetLeft === 'number') return { left: canvas.offsetLeft, top: canvas.offsetTop };
    const a = canvas.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    return { left: a.left - b.left - box.clientLeft, top: a.top - b.top - box.clientTop };
  };
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
    const at = offset();
    Object.assign(mark.style, {
      left: `${at.left + rect.x}px`,
      top: `${at.top + rect.y}px`,
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
    const { left, top } = offset();
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
// I due disegni nuovi: la griglia delle frequenze naturali e il prior da trascinare
// ---------------------------------------------------------------------------

const ICON_MARGIN = 2;

/** Where the cells of drawIconArray lie: `columns` per row ('auto': 200 on a wide canvas, 100 on a narrow one), square, as wide as the canvas allows. */
function iconLayout(data, width) {
  const columns = data.columns === 'auto' ? (width >= 560 ? 200 : 100) : data.columns || 100;
  const rows = Math.ceil(data.total / columns);
  const cell = (width - 2 * ICON_MARGIN) / columns;
  return { columns, rows, cell, height: Math.round(2 * ICON_MARGIN + rows * cell) };
}

/** The category of every cell, in order: the first counts[0] cells are of the first category, and so on. */
function iconCategories(counts) {
  const ends = [];
  let s = 0;
  for (const c of counts) {
    s += c;
    ends.push(s);
  }
  return ends;
}

/**
 * Natural frequencies as a picture: `total` cells, `columns` per row, one
 * colour per category (counts, in order; `colors` are indices of
 * palette.series, `faint` the categories drawn pale). `hidden` lists the
 * categories the legend hides ('cat:k'): their cells stay empty, the others
 * do not move.
 */
export function drawIconArray(canvas, { counts, total, columns = 'auto', colors = [1, 4, 3, 6], faint = [3], hidden = [], width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const L = iconLayout({ total, columns }, width);
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(L.height * dpr);
  canvas.style.height = `${L.height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, L.height);
  const ends = iconCategories(counts);
  const gap = L.cell >= 4 ? 1 : L.cell >= 2.5 ? 0.5 : 0;
  let k = 0;
  for (let i = 0; i < total; i++) {
    while (k < ends.length - 1 && i >= ends[k]) k++;
    if (hidden.includes(`cat:${k}`)) continue;
    const row = Math.floor(i / L.columns);
    const col = i % L.columns;
    ctx.globalAlpha = faint.includes(k) ? 0.28 : 1;
    ctx.fillStyle = pal.series[colors[k] % pal.series.length];
    ctx.fillRect(ICON_MARGIN + col * L.cell, ICON_MARGIN + row * L.cell, Math.max(0.6, L.cell - gap), Math.max(0.6, L.cell - gap));
  }
  ctx.globalAlpha = 1;
}

/** The cell under (x, y) of an icon array, as its category; null on a hidden category or outside. */
function iconHit(data, width, x, y) {
  const L = iconLayout(data, width);
  const col = Math.floor((x - ICON_MARGIN) / L.cell);
  const row = Math.floor((y - ICON_MARGIN) / L.cell);
  if (col < 0 || col >= L.columns || row < 0 || row >= L.rows) return null;
  const i = row * L.columns + col;
  if (i >= data.total) return null;
  const ends = iconCategories(data.counts);
  const index = ends.findIndex((e) => i < e);
  if (index < 0 || (data.hidden || []).includes(`cat:${index}`)) return null;
  return { kind: 'cell', index, rect: { x: ICON_MARGIN + col * L.cell, y: ICON_MARGIN + row * L.cell, width: L.cell, height: L.cell } };
}

/** The rows that the cells of a category span: what a row of the table outlines. */
function iconRegion(data, width, index) {
  const L = iconLayout(data, width);
  const ends = iconCategories(data.counts);
  if (!(index >= 0 && index < ends.length)) return null;
  const first = index === 0 ? 0 : ends[index - 1];
  const last = ends[index] - 1;
  if (last < first) return null;
  const r0 = Math.floor(first / L.columns);
  const r1 = Math.floor(last / L.columns);
  const x0 = r0 === r1 ? ICON_MARGIN + (first % L.columns) * L.cell : ICON_MARGIN;
  const x1 = r0 === r1 ? ICON_MARGIN + ((last % L.columns) + 1) * L.cell : ICON_MARGIN + L.columns * L.cell;
  return { kind: 'cell', index, rect: { x: x0, y: ICON_MARGIN + r0 * L.cell, width: x1 - x0, height: (r1 - r0 + 1) * L.cell } };
}

/** Where the cells of drawStrip lie: perRow square cells per row, filling the width. */
function stripLayout(data, width) {
  const perRow = data.perRow || 50;
  const rows = Math.max(1, Math.ceil(data.cells.length / perRow));
  const size = width / perRow;
  return { perRow, rows, size, height: Math.max(1, Math.round(rows * size)) };
}

/**
 * A strip of events in their order, one square cell each, perRow per row:
 * in the colour of `colorIndex` (palette.series) where the value is 1, in
 * the grid colour where it is 0. "Try it: alarms in bursts" draws the
 * connections, red where there is an alarm.
 */
export function drawStrip(canvas, { cells, perRow = 50, colorIndex = 1, width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width0 = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const L = stripLayout({ cells, perRow }, width0);
  const { ctx, width, height } = setupCanvas(canvas, L.height / width0, knownWidth);
  const size = width / L.perRow;
  const gap = Math.max(0.5, size * 0.08);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  for (let k = 0; k < cells.length; k++) {
    ctx.fillStyle = cells[k] ? pal.series[colorIndex % pal.series.length] : pal.grid;
    ctx.fillRect((k % L.perRow) * size + gap, Math.floor(k / L.perRow) * size + gap, size - 2 * gap, size - 2 * gap);
  }
}

/** The cell of drawStrip under the point (x, y). */
function stripHit(data, width, x, y) {
  const L = stripLayout(data, width);
  const col = Math.floor(x / L.size);
  const row = Math.floor(y / L.size);
  const index = row * L.perRow + col;
  if (col < 0 || col >= L.perRow || row < 0 || index >= data.cells.length) return null;
  return { kind: 'cell', index, rect: { x: col * L.size, y: row * L.size, width: L.size, height: L.size } };
}

const EDITOR_ASPECT = 0.42;
const EDITOR_MARGIN = { left: 34, right: 14, top: 14, bottom: 26 };
const HANDLE_RADIUS = 7;

/**
 * The prior that can be drawn: the heights of HANDLES points at x = 0, 0.1,
 * ..., 1, joined by straight lines, dragged up and down with the mouse or a
 * finger, or chosen with the keyboard (arrows left and right pick a handle,
 * up and down move it). onChange(heights) after every change. Returns the
 * controls: setHeights, setPalette, setDecimal, redraw, destroy.
 */
export function attachPriorEditor(canvas, { heights: initial, onChange = () => {}, palette: initialPalette = DEFAULT_PALETTE, decimal: initialDecimal = '.', label = (i, h) => `${i}: ${h}` }) {
  let heights = [...initial];
  let palette = { ...DEFAULT_PALETTE, ...initialPalette };
  let decimal = initialDecimal;
  let dragging = -1;
  let selected = 0;
  let focused = false;
  let width = 0;
  const geometry = () => {
    const w = width || canvas.clientWidth || 480;
    const height = Math.round(w * EDITOR_ASPECT);
    const m = EDITOR_MARGIN;
    const pw = w - m.left - m.right;
    const ph = height - m.top - m.bottom;
    return { w, height, px: (x) => m.left + x * pw, py: (h) => m.top + (1 - h) * ph, height1: (y) => clamp(1 - (y - m.top) / ph, 0, 1), m, pw, ph };
  };
  const render = () => {
    const G = geometry();
    const { ctx } = setupCanvas(canvas, EDITOR_ASPECT, G.w);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, G.w, G.height);
    ctx.font = '11px sans-serif';
    ctx.strokeStyle = palette.grid;
    ctx.fillStyle = palette.text;
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = i / 5;
      ctx.beginPath();
      ctx.moveTo(G.px(x), G.m.top);
      ctx.lineTo(G.px(x), G.m.top + G.ph);
      ctx.stroke();
      xTickLabel(ctx, axisLabel(x, decimal), G.px(x), G.m.top + G.ph + 16, G.w);
    }
    ctx.strokeRect(G.m.left, G.m.top, G.pw, G.ph);
    // the shape, filled
    const color = palette.series[0];
    ctx.beginPath();
    ctx.moveTo(G.px(0), G.py(0));
    heights.forEach((h, i) => ctx.lineTo(G.px(HANDLE_X[i]), G.py(h)));
    ctx.lineTo(G.px(1), G.py(0));
    ctx.closePath();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    heights.forEach((h, i) => (i ? ctx.lineTo(G.px(HANDLE_X[i]), G.py(h)) : ctx.moveTo(G.px(HANDLE_X[i]), G.py(h))));
    ctx.stroke();
    // the handles; the selected one ringed when the canvas has the focus
    heights.forEach((h, i) => {
      ctx.beginPath();
      ctx.arc(G.px(HANDLE_X[i]), G.py(h), i === dragging ? HANDLE_RADIUS + 2 : HANDLE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = i === dragging ? palette.highlight : color;
      ctx.fill();
      ctx.strokeStyle = palette.background;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (focused && i === selected) {
        ctx.beginPath();
        ctx.arc(G.px(HANDLE_X[i]), G.py(h), HANDLE_RADIUS + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = palette.highlight;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    canvas.setAttribute('aria-valuetext', label(selected, heights[selected]));
  };
  const changed = () => {
    render();
    onChange([...heights]);
  };
  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const locate = (x, y) => {
    const G = geometry();
    let best = -1;
    let dist = (HANDLE_RADIUS + 10) ** 2;
    heights.forEach((h, i) => {
      const d = (G.px(HANDLE_X[i]) - x) ** 2 + (G.py(h) - y) ** 2;
      if (d <= dist) {
        dist = d;
        best = i;
      }
    });
    // anywhere in the column of a handle picks it too: easier with a finger
    if (best < 0) {
      const i = Math.round(((x - G.m.left) / G.pw) * (HANDLES - 1));
      if (i >= 0 && i < HANDLES && Math.abs(G.px(HANDLE_X[i]) - x) < 14 && y >= G.m.top - 8 && y <= G.m.top + G.ph + 8) best = i;
    }
    return best;
  };
  const onDown = (e) => {
    const [x, y] = point(e);
    const i = locate(x, y);
    if (i < 0) return;
    dragging = i;
    selected = i;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    heights[i] = geometry().height1(y);
    changed();
  };
  const onMove = (e) => {
    const [x, y] = point(e);
    if (dragging < 0) {
      canvas.style.cursor = locate(x, y) >= 0 ? 'ns-resize' : 'default';
      return;
    }
    const h = geometry().height1(y);
    if (heights[dragging] !== h) {
      heights[dragging] = h;
      changed();
    }
  };
  const onUp = () => {
    if (dragging < 0) return;
    dragging = -1;
    render();
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      selected = clamp(selected + (e.key === 'ArrowLeft' ? -1 : 1), 0, HANDLES - 1);
      render();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      heights[selected] = clamp(Math.round((heights[selected] + (e.key === 'ArrowUp' ? 0.05 : -0.05)) * 100) / 100, 0, 1);
      changed();
    } else return;
    e.preventDefault();
  };
  const onFocus = () => {
    focused = true;
    render();
  };
  const onBlur = () => {
    focused = false;
    render();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('focus', onFocus);
  canvas.addEventListener('blur', onBlur);
  render();
  return {
    setHeights(next) {
      heights = [...next];
      render();
    },
    setPalette(next) {
      palette = { ...DEFAULT_PALETTE, ...next };
      render();
    },
    setDecimal(d) {
      decimal = d;
      render();
    },
    redraw(nextWidth = 0) {
      width = nextWidth;
      render();
    },
    destroy() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('focus', onFocus);
      canvas.removeEventListener('blur', onBlur);
    },
  };
}

// ---------------------------------------------------------------------------
// 7. Verifiche e riga di comando
// ---------------------------------------------------------------------------

/*
 * Independent checks. The special functions, the exact probabilities and
 * the two filters against an implementation in Python written apart from
 * this file (SciPy 1.17.1, NumPy 2.4 and mpmath 1.4 at 50 digits; Python's
 * fractions for the alarm and the network). The simulations against the
 * same Python code with its own copy of the generators: the same seed must
 * give the same numbers. The generators against their reference C code.
 * A check passes when the strings are equal, or the numbers agree within a
 * relative error of `tol` (10^-9 unless said otherwise).
 */
const words = (values) => values.join(' ');
const sprtSetupDefault = () => sprtSetup(SPRT_DEFAULT);

export const CHECK_VECTORS = Object.freeze([
  { group: 'functions', name: 'Φ(-5), the normal distribution function far in the tail (mpmath)', expected: 2.866515718791939e-07, compute: () => normalCdf(-5), tol: 1e-13 },
  { group: 'functions', name: 'Φ(1.96) (mpmath)', expected: 0.9750021048517795, compute: () => normalCdf(1.96), tol: 1e-14 },
  { group: 'functions', name: 'Φ⁻¹(0.975), the normal quantile (mpmath)', expected: 1.9599639845400543, compute: () => normalQuantile(0.975), tol: 1e-14 },
  { group: 'functions', name: 'I_0.12(13, 89), the Beta distribution function (SciPy betainc)', expected: 0.4385072848831475, compute: () => betaCdf(0.12, 13, 89), tol: 1e-12 },
  { group: 'functions', name: 'The 0.025 quantile of Beta(49.5, 351.5) (SciPy beta.ppf)', expected: 0.09311681542258143, compute: () => betaQuantile(0.025, 49.5, 351.5), tol: 1e-11 },
  { group: 'functions', name: 'P(Gamma(30, 1) ≤ 35) (SciPy gammainc)', expected: 0.8229545478999403, compute: () => gammaCdf(35, 30), tol: 1e-12 },
  { group: 'functions', name: 'P(Binomial(1000, 0.03) ≤ 20) (SciPy binom.cdf)', expected: 0.033280784135194114, compute: () => binomialCdf(20, 1000, 0.03), tol: 1e-11 },
  { group: 'functions', name: 'Kolmogorov’s law, P(K > 1) (SciPy kolmogorov)', expected: 0.26999967167735456, compute: () => kolmogorovSf(1), tol: 1e-12 },
  { group: 'functions', name: 'ln Γ(100.5) (mpmath)', expected: 361.4355404677776, compute: () => lnGamma(100.5), tol: 1e-13 },
  { group: 'functions', name: 'Exact binomial test, 7 clicks in 40 against 0.12 (SciPy binomtest)', expected: 0.3240523111458291, compute: () => binomialTest(7, 40, 0.12).p, tol: 1e-11 },

  { group: 'bayes', name: 'P(attack | alarm) with 1%, 95% and 3% (fractions: 95/392)', expected: 0.2423469387755102, compute: () => alarmFacts(ALARM_DEFAULT).posterior, tol: 1e-14 },
  { group: 'bayes', name: 'P(attack | alarm, sandbox alarm) (fractions)', expected: 0.962390781309358, compute: () => evidenceChain(ALARM_DEFAULT.base, [{ ...ALARM_DEFAULT, fired: true }, { ...SECOND_DETECTOR, fired: true }])[1].posterior, tol: 1e-13 },
  { group: 'bayes', name: 'Network: P(phishing | EDR alarm) (fractions, by enumeration)', expected: 0.33285214574340466, compute: () => networkPosterior({ edr: true }).phishing, tol: 1e-13 },
  { group: 'bayes', name: 'Network: P(phishing | EDR alarm, exploit signature)', expected: 0.07021738104501918, compute: () => networkPosterior({ edr: true, signature: true }).phishing, tol: 1e-13 },
  { group: 'bayes', name: 'Network: P(exploit | EDR alarm, exploit signature)', expected: 0.9503084441820995, compute: () => networkPosterior({ edr: true, signature: true }).exploit, tol: 1e-13 },
  { group: 'bayes', name: 'Wald: probability of blocking a legitimate user, exact (Python, the same lattice)', expected: 0.0004159930207001508, compute: () => sprtExact(sprtSetupDefault(), SPRT_DEFAULT.p0).block, tol: 1e-10 },
  { group: 'bayes', name: 'Wald: expected attempts of an attacker, exact', expected: 5.788450405345544, compute: () => sprtExact(sprtSetupDefault(), SPRT_DEFAULT.p1).mean, tol: 1e-10 },
  { group: 'bayes', name: 'Coverage of the Jeffreys interval at p = 0.12, n = 40 (SciPy)', expected: 0.9436787574822046, compute: () => coverageAt(0.12).jeffreys[0], tol: 1e-10 },
  { group: 'bayes', name: 'Smallest coverage of the Wald interval, p from 0.005 to 0.5 (SciPy)', expected: 0.1816304136888073, compute: () => coverageCurves().summary.wald.min, tol: 1e-10 },
  { group: 'bayes', name: 'Attack chain: P(at least one breach) in 1,000 e-mails (fractions)', expected: 0.8349690004435205, compute: () => attackChain().campaigns.find((c) => c.m === 1000).breach, tol: 1e-12 },
  { group: 'bayes', name: 'Network: P(phishing and exploit | EDR alarm) (fractions)', expected: 0.010222635404891075, compute: () => networkPair('phishing', 'exploit', { edr: true }), tol: 1e-12 },
  { group: 'bayes', name: 'p-value of 45 false alarms in 1,000 against 3% (SciPy binom.sf)', expected: 0.005559033343866492, compute: () => pvalueFacts().pValue, tol: 1e-10 },
  { group: 'bayes', name: 'P(H0 | 45 false alarms), prior 90%, H1 = 5% (SciPy binom.pmf)', expected: 0.2904137342271108, compute: () => pvalueFacts().posteriorH0, tol: 1e-10 },
  { group: 'bayes', name: 'Many tests: P(H0 | rejected) with 10% real effects, power 80%, alpha 5% (fractions)', expected: 0.36, compute: () => discoveryFacts().falseDiscovery, tol: 1e-13 },
  { group: 'bayes', name: 'Informed prior after the first day: P(rate > 10%) (SciPy beta.sf)', expected: 0.9334105544171286, compute: () => priorSensitivity()[0].priors.informed.above, tol: 1e-10 },

  { group: 'filters', name: 'SMS: distinct messages, of which spam (Python)', expected: "5170 652", compute: () => words([smsCorpus().docs.length, smsCorpus().docs.filter((d) => d.spam).length]) },
  { group: 'filters', name: 'SMS: vocabulary of the training set', expected: "7214", compute: () => String(smsModel().model.V) },
  { group: 'filters', name: 'SMS: true and false positives, false and true negatives on the test set', expected: "171 5 20 1355", compute: () => { const m = smsModel().matrix; return words([m.tp, m.fp, m.fn, m.tn]); } },
  { group: 'filters', name: 'SMS: area under the ROC curve', expected: 0.9678818909762859, compute: () => smsModel().auc, tol: 1e-12 },
  { group: 'filters', name: 'SMS: P(spam) of a phishing message written for the page', expected: 0.9952701617967173, compute: () => spamScore(smsModel().model, 'Your account has been suspended, verify your password at this link').posterior, tol: 1e-10 },
  { group: 'filters', name: 'NSL-KDD: naive Bayes, TP FP FN TN on the test set (Python)', expected: "3343 110 500 2812", compute: () => { const m = kddModel().naive; return words([m.tp, m.fp, m.fn, m.tn]); } },
  { group: 'filters', name: 'NSL-KDD: the full table, TP FP FN TN', expected: "3461 180 382 2742", compute: () => { const m = kddModel().joint; return words([m.tp, m.fp, m.fn, m.tn]); } },
  { group: 'filters', name: 'NSL-KDD: McNemar against the larger class, b and c', expected: "2812 500", compute: () => words([kddModel().mcnemar.b, kddModel().mcnemar.c]) },

  { group: 'convergence', name: 'P(|F̂ - 0.03| > 0.01) after 1,000 connections, exact (SciPy binom)', expected: 0.05063266843884167, compute: () => deviationExact(1000, 0.03, 0.01), tol: 1e-10 },
  { group: 'convergence', name: 'Kolmogorov distance of 100 false alarms from the normal law (SciPy)', expected: 0.1472492104640194, compute: () => ksExactBernoulli(100), tol: 1e-10 },
  { group: 'convergence', name: 'Kolmogorov distance of 30 exponential values from the normal law (SciPy, minimize)', expected: 0.024291427995467962, compute: () => ksExactExponential(30), tol: 1e-7 },
  { group: 'convergence', name: 'Distance between Beta(13, 89) and its normal approximation (SciPy)', expected: 0.02958472167249593, compute: () => betaNormalDistance(13, 89), tol: 1e-7 },
  { group: 'convergence', name: 'P(collision) among 77,163 identifiers of 32 bits (mpmath)', expected: 0.49999989051734833, compute: () => collisionExact(32, 77163), tol: 1e-10 },
  { group: 'convergence', name: 'Variance of 1,000 bursty connections, rho = 0.5 (Python, the sum of the covariances)', expected: 87.1836, compute: () => burstVariance(1000, 0.03, 0.5), tol: 1e-12 },
  { group: 'convergence', name: 'Kolmogorov distance of the t statistic from the normal law, n = 100 (SciPy)', expected: 0.18224982095487896, compute: () => ksExactT(100), tol: 1e-10 },
  { group: 'convergence', name: 'Exact standard deviation of the log-odds, n = 1,000 (Python)', expected: 0.19010989811321694, compute: () => deltaLogOdds(1000).exact, tol: 1e-10 },
  { group: 'convergence', name: 'Distance of the MLE of an exponential rate from the normal law, n = 30 (SciPy gamma, minimize)', expected: 0.046743254220091734, compute: () => mleRate(30).distance, tol: 1e-7 },
  { group: 'convergence', name: 'Connections for a 95% interval of half a point at 3%', expected: "4472", compute: () => String(sampleSizeFor(0.005)) },
  { group: 'convergence', name: 'Bytes of NSL-KDD: mean, standard deviation, skewness (NumPy, SciPy)', expected: "10395.450231 472775.9451 117.477719", compute: () => { const f = bytesFacts(); return words([f.mean.toFixed(6), f.sd.toFixed(4), f.skewness.toFixed(6)]); } },

  { group: 'simulation', name: 'Phishing campaign, seed 2026: clicks of the ten days (Python, its own generator)', expected: "7 6 6 6 4 7 3 5 2 5", compute: () => words(campaign(DEFAULT_SEED).map((d) => d.clicks)) },
  { group: 'simulation', name: 'Wald, 10,000 users and 10,000 attackers: blocked users, missed attackers, total attempts', expected: "1 40 87941", compute: (s) => words([s.sprt.legit.block, s.sprt.attackers.clear, Math.round(s.sprt.legit.meanSteps * s.sprt.legit.runs + s.sprt.attackers.meanSteps * s.sprt.attackers.runs)]) },
  { group: 'simulation', name: '20,000 campaigns: hits of Wald, Wilson, Clopper-Pearson and Jeffreys', expected: "17415 19062 19582 18911", compute: (s) => words(INTERVAL_METHODS.map((m) => s.coverage.hits[m])) },
  { group: 'simulation', name: '1,000 paths: outside the band at n = 1,000 and after it (NumPy, its own generator)', expected: "0.054 0.136", compute: (s) => { const c = s.paths.checks.find((x) => x.n === 1000); return words([c.outside, c.after]); } },
  { group: 'simulation', name: '20,000 sums of 30 exponential values: Kolmogorov statistic', expected: 0.027414904463515244, compute: (s) => s.clt.exponential.D, tol: 1e-9 },
  { group: 'simulation', name: '10,000 means of 1,000 connections: Kolmogorov statistic', expected: 0.37262639225731886, compute: (s) => s.bytes[2].D, tol: 1e-9 },
  { group: 'simulation', name: '20,000 trials of 16-bit identifiers: collisions', expected: "9992", compute: (s) => String(s.hash.hits) },
  { group: 'simulation', name: 'Long campaign: clicks in 10,000 e-mails', expected: "1214", compute: (s) => String(s.bvm[s.bvm.length - 1].clicks) },
  { group: 'simulation', name: 'Glivenko-Cantelli, 400 samples of 1,000: mean of D_n (NumPy, its own generator)', expected: 0.026751133648986576, compute: (s) => s.gc.rows.find((r) => r.n === 1000).meanD, tol: 1e-9 },
  { group: 'simulation', name: 'Bursts, rho = 0.5, 4,000 windows of 1,000: total alarms and naive intervals that cover', expected: "119603 2832", compute: (s) => { const b = s.bursts.find((x) => x.rho === 0.5); return words([Math.round(b.mean * b.reps), Math.round(b.coverage * b.reps)]); } },

  { group: 'generator', name: 'xoshiro128** from (1, 2, 3, 4)', expected: '11520 0 5927040 70819200 2031721883 1637235492', compute: () => { const g = xoshiro128ss(1, 2, 3, 4); return Array.from({ length: 6 }, g).join(' '); } },
  { group: 'generator', name: 'SplitMix64 from 0', expected: '16294208416658607535 7960286522194355700 487617019471545679', compute: () => { const g = splitMix64(0); return Array.from({ length: 3 }, g).join(' '); } },
  { group: 'generator', name: 'Main stream, seed 2026 (independent Python code)', expected: '1441997221 504457382 1212262897 368519188', compute: () => { const g = generator(2026, 'main', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Box-Muller: the first two normal values, seed 2026 (Python)', expected: '-0.2973509092608619 1.447208380667575', compute: () => { const z = normalSampler(generator(2026, 'main', 0)); return `${z()} ${z()}`; } },
]);

/** The groups of the checks, in the order the page shows them. */
export const CHECK_GROUPS = Object.freeze(['functions', 'bayes', 'filters', 'convergence', 'simulation', 'generator']);

/**
 * Every check, with what was expected and what came out. The checks of
 * the simulations read the results of the computations (`results`, from
 * explore with the default seed): without them they wait, pending.
 */
export function verifyAll(results = null) {
  return CHECK_VECTORS.map((v) => {
    if (v.group === 'simulation' && v.compute.length > 0 && (!results || results.params.seed !== DEFAULT_SEED)) {
      return { group: v.group, name: v.name, expected: String(v.expected), actual: '', ok: null };
    }
    const actual = v.compute(results);
    const tol = v.tol ?? 1e-9;
    const ok = typeof v.expected === 'string' ? actual === v.expected : Math.abs(actual - v.expected) <= tol * Math.max(1e-300, Math.abs(v.expected));
    return { group: v.group, name: v.name, expected: String(v.expected), actual: String(actual), ok };
  });
}

/**
 * Command line: node homework7.js [--seed 2026 | --random-seed]. Options
 * are checked strictly: anything unknown or malformed prints the usage.
 * The output follows the page: the forms of convergence, then conditional
 * probability and Bayes, then the checks.
 */
export function runCli(argv, print = console.log) {
  const usage = () => {
    print(`usage: node homework7.js [--seed ${DEFAULT_SEED} | --random-seed]`);
    return 1;
  };
  let seed = DEFAULT_SEED;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--random-seed') seed = randomSeed();
    else if (arg === '--seed' && value !== undefined && parseInteger(value, LIMITS.seed).ok) {
      seed = parseInteger(value, LIMITS.seed).value;
      i++;
    } else return usage();
  }
  const pct = (v, d = 2) => `${(100 * v).toFixed(d)}%`;
  const p4 = (p) => (p >= 0.001 ? p.toFixed(4) : p.toExponential(2));
  print('Homework #7 - Statistics: the modes of convergence, and conditional probability, Bayes\' theorem and statistical inference');
  print(`Seed ${seed}${seed === DEFAULT_SEED ? ' (the one of the page)' : ''}`);
  const r = explore({ seed });
  print('');
  print('1. THE MODES OF CONVERGENCE');
  print('False-alarm rate 3%, band 1 point: n, exact P(outside), Chebyshev, Hoeffding, normal');
  for (const row of deviationTable().filter((x) => [100, 1000, 10000, 100000].includes(x.n))) print(`  ${String(row.n).padStart(6)} ${p4(row.exact).padStart(10)} ${p4(row.chebyshev).padStart(10)} ${p4(row.hoeffding).padStart(10)} ${p4(row.normal).padStart(10)}`);
  const c1000 = r.paths.checks.find((c) => c.n === 1000);
  print(`1,000 paths: outside the band at n = 1,000: ${pct(c1000.outside, 1)} (exact ${pct(c1000.exactOutside, 1)}); leave it again later: ${pct(c1000.after, 1)}; mean square error ${c1000.mse.toExponential(2)} (exact ${c1000.exactMse.toExponential(2)})`);
  print(`CLT, Kolmogorov distance from the normal law (exact): ${r.clt.rows.filter((x) => [10, 100, 1000].includes(x.n)).map((x) => `n = ${x.n}: Bernoulli ${x.bernoulli.toFixed(4)}, exponential ${x.exponential.toFixed(4)}`).join('; ')}`);
  print(`Birthday: 50% of collisions at ${collisionMedian(32)} identifiers of 32 bits; 16 bits, ${r.hash.m} identifiers: ${r.hash.hits} collisions in ${r.hash.trials} trials (exact ${pct(r.hash.exact)})`);
  print(`Slutsky, the t statistic: distance from the normal law ${RESULT_SIZES.map((n) => `n = ${n}: ${ksExactT(n).toFixed(4)}`).join(', ')}`);
  print(`Delta method, the log-odds: exact sd ${[100, 1000, 10000].map((n) => { const d = deltaLogOdds(n); return `n = ${n}: ${d.exact.toFixed(4)} (delta ${d.delta.toFixed(4)})`; }).join(', ')}`);
  print(`Glivenko-Cantelli: mean of sqrt(n) D_n ${r.gc.rows.map((x) => `n = ${x.n}: ${x.meanScaled.toFixed(3)}`).join(', ')} (limit ${KOLMOGOROV_MEAN.toFixed(3)})`);
  print(`MLE of an exponential rate: distance from the normal law ${[10, 30, 100, 1000].map((n) => `n = ${n}: ${mleRate(n).distance.toFixed(4)}`).join(', ')}`);
  print(`Why sqrt(n): the variance of the count adds up, ${rootTable().map((x) => `n = ${x.n}: sd ${x.sd.toFixed(1)}, standard error ${x.se.toFixed(5)}`).join('; ')}`);
  print(`  for a 95% interval of half a point at 3%: ${sampleSizeFor(0.005)} connections; of a tenth of a point: ${sampleSizeFor(0.001)}`);
  print(`Bursts (4,000 windows of 1,000): ${r.bursts.map((b) => `rho = ${b.rho}: variance ${b.variance.toFixed(1)} (exact ${b.exact.variance.toFixed(1)}, ${b.exact.factor.toFixed(2)} times the independent one), naive interval covers ${pct(b.coverage, 1)}`).join('; ')}`);
  const b = bytesFacts();
  print(`Bytes of NSL-KDD: mean ${b.mean.toFixed(1)}, skewness ${b.skewness.toFixed(1)}; means of 1,000 connections, distance from the normal law ${r.bytes[2].D.toFixed(3)}`);
  print('');
  print('2. CONDITIONAL PROBABILITY, BAYES\' THEOREM AND STATISTICAL INFERENCE');
  const chainFacts = attackChain();
  print(`Attack chain: ${chainFacts.rows.map((x) => `${x.key} ${pct(x.p, 0)}`).join(' x ')} = ${(100 * chainFacts.breach).toFixed(2)}% per e-mail; at least one breach in 1,000 e-mails: ${pct(chainFacts.campaigns[2].breach, 1)}`);
  const pv = pvalueFacts();
  print(`p-value of ${pv.k} false alarms in ${pv.n} against ${pct(pv.p0, 0)}: ${p4(pv.pValue)}; but P(H0 | data) with a prior of ${pct(pv.priorH0, 0)} is ${pct(pv.posteriorH0, 1)}`);
  const fd = discoveryFacts();
  print(`Many tests (${pct(fd.real, 0)} real effects, power ${pct(fd.power, 0)}, alpha ${pct(fd.alpha, 0)}): P(H0 | rejected) = ${pct(fd.falseDiscovery, 1)}`);
  const a = alarmFacts(ALARM_DEFAULT);
  print(`IDS alarm: base rate ${pct(a.base)}, sensitivity ${pct(a.sensitivity)}, false positives ${pct(a.fpr)}: P(attack | alarm) = ${pct(a.posterior)}, P(attack | no alarm) = ${pct(a.posteriorQuiet, 4)}`);
  print(`  in ${a.population} connections: ${a.counts[0]} attacks seen, ${a.counts[1]} missed, ${a.counts[2]} false alarms, ${a.counts[3]} quiet`);
  const chain = evidenceChain(ALARM_DEFAULT.base, [{ ...ALARM_DEFAULT, fired: true }, { ...SECOND_DETECTOR, fired: true }]);
  print(`  a second, independent alarm (sandbox, ${pct(SECOND_DETECTOR.sensitivity, 0)} / ${pct(SECOND_DETECTOR.fpr, 0)}): ${pct(chain[1].posterior)}`);
  print('Bayesian network of the triage (P(phishing), P(exploit), P(compromise)):');
  for (const ev of NETWORK_STEPS) {
    const q = networkPosterior(ev);
    print(`  ${Object.keys(ev).join(' + ') || 'no clue'}: ${pct(q.phishing, 1)}, ${pct(q.exploit, 1)}, ${pct(q.compromise, 1)}`);
  }
  const setup = sprtSetup(SPRT_DEFAULT);
  const exL = sprtExact(setup, SPRT_DEFAULT.p0);
  const exA = sprtExact(setup, SPRT_DEFAULT.p1);
  print(`Wald's test: block at ${setup.upper.toFixed(3)}, clear at ${setup.lower.toFixed(3)}; a failure adds ${setup.fail.toFixed(3)}, a success ${setup.success.toFixed(3)}`);
  print(`  exact: legitimate users blocked ${exL.block.toExponential(3)} (alpha ${SPRT_DEFAULT.alpha}), attackers missed ${exA.clear.toExponential(3)} (beta ${SPRT_DEFAULT.beta}); attempts ${exL.mean.toFixed(2)} and ${exA.mean.toFixed(2)}`);
  print(`  simulated: ${r.sprt.legit.block} of ${r.sprt.legit.runs} users blocked, ${r.sprt.attackers.clear} of ${r.sprt.attackers.runs} attackers cleared`);
  const days = campaign(seed);
  const post = campaignPosteriors(days, PRIORS.uniform);
  const last = post[post.length - 1];
  print(`Phishing campaign: clicks per day ${days.map((d) => d.clicks).join(' ')}; uniform prior -> mean ${pct(last.mean)}, 95% interval ${pct(last.lo)} to ${pct(last.hi)}, P(rate > ${pct(TARGET_RATE, 0)}) = ${pct(last.above(TARGET_RATE), 1)}`);
  print(`  P(rate > ${pct(TARGET_RATE, 0)}) by prior after 1, 3 and 10 days: ${PRIOR_KEYS.map((k) => `${k} ${priorSensitivity(seed).map((x) => pct(x.priors[k].above, 1)).join('/')}`).join(', ')}`);
  const cov = coverageCurves();
  print(`Coverage of the 95% intervals, n = ${COVERAGE_N}, mean and minimum over p: ${INTERVAL_METHODS.map((m) => `${m} ${pct(cov.summary[m].mean, 1)}/${pct(cov.summary[m].min, 1)}`).join(', ')}`);
  const sms = smsModel();
  print(`SMS filter: ${sms.corpus.train.length} messages to learn, ${sms.corpus.test.length} to judge; accuracy ${pct(sms.matrix.accuracy)}, precision ${pct(sms.matrix.precision)}, recall ${pct(sms.matrix.recall)}, AUC ${sms.auc.toFixed(4)}`);
  print(`  heaviest spam words: ${sms.spamWords.slice(0, 8).map((w) => w.token).join(', ')}; heaviest legitimate: ${sms.hamWords.slice(0, 8).map((w) => w.token).join(', ')}`);
  const kdd = kddModel();
  print(`NSL-KDD: naive Bayes accuracy ${pct(kdd.naive.accuracy)}, full table ${pct(kdd.joint.accuracy)}, larger class ${pct(kdd.majority.accuracy)}`);
  const lastBvm = r.bvm[r.bvm.length - 1];
  print(`Posterior after ${lastBvm.n} e-mails: uniform prior ${pct(lastBvm.uniform.mean)}, wrong prior ${pct(lastBvm.wrong.mean)}; distance from the normal law ${lastBvm.uniform.distance.toFixed(4)}`);
  print('');
  const checks = verifyAll(seed === DEFAULT_SEED ? r : null);
  const done = checks.filter((c) => c.ok !== null);
  const failed = done.filter((c) => !c.ok);
  print(`Checks: ${done.length - failed.length} of ${done.length} passed${done.length < checks.length ? ` (${checks.length - done.length} need the seed of the page)` : ''}`);
  for (const c of failed) print(`  FAILED ${c.name}: expected ${c.expected}, got ${c.actual}`);
  print(`(${r.elapsed.toFixed(0)} ms of simulations)`);
  return failed.length ? 1 : 0;
}
