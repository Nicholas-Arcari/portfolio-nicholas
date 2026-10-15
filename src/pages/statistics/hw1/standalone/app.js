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
import * as hw from '../homework1.js';
import * as view from '../view.js';
import { HW1_TEXTS, originalAssignment } from '../texts.js';

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

// Si apre sempre in inglese, come la pagina sul sito; IT / EN cambia lingua
// finche' la pagina resta aperta, senza salvare la scelta. Il sito, aprendo
// la versione online, passa nell'indirizzo la lingua che si stava leggendo.
function initialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  return LANGUAGES.includes(fromUrl) ? fromUrl : 'en';
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
  const tips = view.chartTips(s, T.tips);
  const C = T.correlation;
  const A = T.avalanche;
  const valueRows = ['pearsonKX', 'pearsonKY', 'spearmanKX', 'spearmanKY'];
  return [
    titles[0],
    h('p', { text: T.distribution.intro }),
    h('div', { class: 'charts' }, figure(T.distribution.chartX, hw.drawBarChart, data.histX, false, tips.histX), figure(T.distribution.chartY, hw.drawBarChart, data.histY, false, tips.histY)),
    paras(T.distribution.explain(s)),

    titles[1],
    h('p', { text: T.frequency.intro }),
    h('div', { class: 'charts' }, figure(T.frequency.chartX, hw.drawBarChart, data.freqX, false, tips.freqX), figure(T.frequency.chartY, hw.drawBarChart, data.freqY, false, tips.freqY)),
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
    paras(T.frequency.explain(s)),

    titles[2],
    h('p', { text: T.bits.intro }),
    h('div', { class: 'charts' }, figure(T.bits.chartX, hw.drawBarChart, data.bitsX, false, tips.bitsX), figure(T.bits.chartY, hw.drawBarChart, data.bitsY, false, tips.bitsY)),
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
    figure(C.heatmapTitle(data.correlation.range), hw.drawHeatmap, data.correlation, true, tips.correlation),
    paras(C.explain(s)),

    titles[5],
    h('p', { text: A.intro }),
    s.avalanche.measurements > 0
      ? [
        figure(A.chartTitle, hw.drawBarChart, data.distances, false, tips.distances),
        figure(A.heatmapTitle(), hw.drawHeatmap, data.sac, true, tips.sac),
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
  document.title = 'Homework #1 - Exercise 1 - Statistics';
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
  fill(app, assignmentSection(), taskSection(), guruSection(), statsSection(), discussionSection(), toTopButton());
  syncTaskControls();
  updateTask();
  updateStats('task');
  updateStats('ext');
}

function boot() {
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.addEventListener('click', () => {
      if (button.dataset.lang === state.lang) return;
      state.lang = LANGUAGES.includes(button.dataset.lang) ? button.dataset.lang : 'en';
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
