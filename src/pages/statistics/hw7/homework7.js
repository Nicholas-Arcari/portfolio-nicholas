// src/pages/statistics/hw7/homework7.js
// Homework #7 di Statistics: la libreria dei calcoli. E' lo scheletro
// pronto prima della consegna, con quello che ogni homework riusa: il
// generatore con le sue verifiche, i calcoli a fette per il worker e per il
// programma scaricabile, i grafici (righe, istogrammi, barre impilate e
// affiancate) con le etichette sotto il puntatore e le legende a pulsanti
// (parti nascoste in `hidden`), e la riga di comando. Quando arriva la
// consegna, i calcoli del compito entrano in exploreSteps e nelle verifiche,
// i grafici nuovi accanto a quelli qui.
//
// Lo stesso file serve la pagina (import), il worker (stats.worker.js) e il
// programma scaricabile (homework7.js da solo, anche con node homework7.js):
// niente DOM fuori dalle funzioni di disegno, niente dipendenze.

const fail = (message) => {
  throw new RangeError(message);
};

// ---------------------------------------------------------------------------
// 1. I parametri
// ---------------------------------------------------------------------------

/** The parameters of the computations as the page opens: the seed of every stream and the size of the sample. */
export const DEFAULT_SEED = 2026;
export const DEFAULT_SAMPLE = 100000;

/** The accepted ranges. */
export const LIMITS = Object.freeze({
  seed: Object.freeze([0, 4294967295]),
  sample: Object.freeze([1000, 1000000]),
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

/** A real number of the range [min, max], with a decimal point or a decimal comma and an optional exponent: -3, 0,5, 2.5e-3. */
export function parseNumber(text, [min, max]) {
  const t = String(text).trim();
  const plain = t.replace(',', '.');
  if (t === '') return { ok: false, error: 'empty', text: t };
  if (plain.length > 16 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d{1,3})?$/.test(plain)) return { ok: false, error: 'notNumber', text: t };
  const value = Number(plain);
  if (!(value >= min && value <= max)) return { ok: false, error: 'range', text: t };
  return { ok: true, value };
}

/** The parameters of the computations, checked against LIMITS. */
export function checkParams({ seed = DEFAULT_SEED, sample = DEFAULT_SAMPLE } = {}) {
  const within = (v, [lo, hi]) => Number.isInteger(v) && v >= lo && v <= hi;
  if (!within(seed, LIMITS.seed)) fail(`seed out of range: ${seed}`);
  if (!within(sample, LIMITS.sample)) fail(`sample out of range: ${sample}`);
  return { seed, sample };
}

// ---------------------------------------------------------------------------
// 2. Il generatore
// ---------------------------------------------------------------------------

/*
 * The generators of Homework #3, #4, #5 and #6: SplitMix64 turns a 64-bit
 * number into the initial state of xoshiro128**, which draws the numbers.
 * Every stream starts SplitMix64 from seed x 2^32 + j, XOR the golden ratio
 * times the number of the stream, so the streams never meet and every
 * repetition j is the same whatever the others do. Stream 0 ('main') is the
 * first stream of Homework #5 and #6, checked there against independent
 * Python code: the same checks hold here.
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

/** The streams of the page: more are added at the end, so the first one keeps its numbers. */
export const STREAMS = Object.freeze(['main']);

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

/** The standard normal distribution function, from the complementary error function (Numerical Recipes erfc, |error| < 1.2e-7): enough for p-values. */
export function normalCdf(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * x);
  const erfc = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return z >= 0 ? 1 - erfc / 2 : erfc / 2;
}

// ---------------------------------------------------------------------------
// 3. I calcoli della pagina, a fette
// ---------------------------------------------------------------------------

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

/**
 * The computations of the page as a generator: it yields between pieces of
 * work, so the page (or the downloadable program, from file://) can run it a
 * few milliseconds at a time, and the worker runs it in one go (explore).
 * Until the assignment arrives it tests the generator of the page: the mean
 * of `sample` uniform values against 1/2 (a z test with the known variance
 * 1/12) and their variance against 1/12.
 */
export function* exploreSteps(params = {}) {
  const { seed, sample } = checkParams(params);
  const started = now();
  const next = generator(seed, 'main', 0);
  let k = 0;
  let mean = 0;
  let ss = 0;
  while (k < sample) {
    const stop = Math.min(sample, k + 20000);
    for (; k < stop; ) {
      const u = uniform53(next);
      k++;
      const delta = u - mean;
      mean += delta / k;
      ss += delta * (u - mean);
    }
    yield;
  }
  const variance = ss / (sample - 1);
  const z = (mean - 0.5) / Math.sqrt(1 / 12 / sample);
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  return {
    params: { seed, sample },
    generator: { n: sample, mean, variance, z, pValue, verdict: pValue < SIGNIFICANCE ? 'reject' : 'accept' },
    elapsed: now() - started,
  };
}

/** The same computations in one go (the worker). */
export function explore(params = {}) {
  const steps = exploreSteps(params);
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
// 4. I grafici: righe, istogrammi, barre impilate e affiancate; etichette sotto il puntatore e legende a pulsanti
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
// 5. Verifiche e riga di comando
// ---------------------------------------------------------------------------

/*
 * Independent checks: the generators against their reference C code
 * (Homework #4) and the first stream against an independent Python
 * implementation (Homework #5, where the same stream is called 'normal').
 * The checks of the assignment join them when it arrives, each in its group.
 */
export const CHECK_VECTORS = Object.freeze([
  { group: 'generator', name: 'xoshiro128** from (1, 2, 3, 4)', expected: '11520 0 5927040 70819200 2031721883 1637235492', compute: () => { const g = xoshiro128ss(1, 2, 3, 4); return Array.from({ length: 6 }, g).join(' '); } },
  { group: 'generator', name: 'SplitMix64 from 0', expected: '16294208416658607535 7960286522194355700 487617019471545679', compute: () => { const g = splitMix64(0); return Array.from({ length: 3 }, g).join(' '); } },
  { group: 'generator', name: 'Main stream, seed 2026 (independent Python code)', expected: '1441997221 504457382 1212262897 368519188', compute: () => { const g = generator(2026, 'main', 0); return Array.from({ length: 4 }, g).join(' '); } },
  { group: 'generator', name: 'Box-Muller: the first two normal values, seed 2026 (Python)', expected: '-0.2973509092608619 1.447208380667575', compute: () => { const z = normalSampler(generator(2026, 'main', 0)); return `${z()} ${z()}`; } },
]);

/** The groups of the checks, in the order the page shows them. */
export const CHECK_GROUPS = Object.freeze(['generator']);

/** Every check, with what was expected and what came out: equal strings, or numbers within a relative error of 10^-9. */
export function verifyAll() {
  return CHECK_VECTORS.map((v) => {
    const actual = v.compute();
    const ok = typeof v.expected === 'string' ? actual === v.expected : Math.abs(actual - v.expected) <= 1e-9 * Math.max(1e-300, Math.abs(v.expected));
    return { group: v.group, name: v.name, expected: String(v.expected), actual: String(actual), ok };
  });
}

/**
 * Command line: node homework7.js [--seed 2026 | --random-seed]
 * [--sample 100000]. Options are checked strictly: anything unknown or
 * malformed prints the usage.
 */
export function runCli(argv, print = console.log) {
  const usage = () => {
    print(`usage: node homework7.js [--seed ${DEFAULT_SEED} | --random-seed] [--sample ${DEFAULT_SAMPLE}]`);
    print(`       sample from ${LIMITS.sample[0]} to ${LIMITS.sample[1]}.`);
    return 1;
  };
  const options = { seed: DEFAULT_SEED, sample: DEFAULT_SAMPLE };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--random-seed') options.seed = randomSeed();
    else if (arg === '--seed' && value !== undefined && parseInteger(value, LIMITS.seed).ok) {
      options.seed = parseInteger(value, LIMITS.seed).value;
      i++;
    } else if (arg === '--sample' && value !== undefined && parseInteger(value, LIMITS.sample).ok) {
      options.sample = parseInteger(value, LIMITS.sample).value;
      i++;
    } else return usage();
  }
  print('Homework #7 - Statistics');
  print('The assignment has not arrived yet: this is the skeleton of the program.');
  print('');
  const checks = verifyAll();
  const failed = checks.filter((c) => !c.ok);
  print(`Checks: ${checks.length - failed.length} of ${checks.length} passed (the generators against their reference C code and an independent Python implementation).`);
  for (const c of failed) print(`  FAILED ${c.name}: expected ${c.expected}, got ${c.actual}`);
  const r = explore(options);
  const g = r.generator;
  print('');
  print(`The generator, seed ${r.params.seed}: ${g.n} uniform values, mean ${g.mean.toFixed(6)} (expected 0.5), variance ${g.variance.toFixed(6)} (expected ${(1 / 12).toFixed(6)})`);
  print(`  z test of the mean against 1/2: z = ${g.z.toFixed(3)}, p = ${g.pValue.toFixed(3)}, ${g.verdict === 'reject' ? 'rejected' : 'not rejected'} at the ${SIGNIFICANCE * 100}% level (${r.elapsed.toFixed(0)} ms)`);
  return failed.length ? 1 : 0;
}
