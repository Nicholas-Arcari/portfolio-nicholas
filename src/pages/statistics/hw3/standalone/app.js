// src/pages/statistics/hw3/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework3.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Da file:// i worker non partono: la simulazione gira qui, a fette di pochi
// millisecondi, e la pagina resta reattiva mentre i numeri arrivano; intanto
// l'animazione delle traiettorie, che non ne ha bisogno, funziona gia'.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
import * as hw from '../homework3.js';
import * as view from '../view.js';
import { HW3_TEXTS, originalAssignment } from '../texts.js';

const HEADINGS = ['h2', 'h3', 'h4'];
const LANGUAGES = ['it', 'en'];

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#161616',
    text: '#d6d6d6',
    grid: '#262626',
    bars: '#7986cb',
    reference: '#ff6b81',
    highlight: '#ff6b81',
    series: ['#7986cb', '#ff6b81', '#4fb39c', '#ffca28', '#ba68c8', '#4dd0e1', '#9e9e9e'],
  },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const palette = () => (darkQuery.matches ? PALETTES.dark : PALETTES.light);

// I campi non devono passare per correttori o completamenti.
const PRIVATE_FIELD = {
  autocomplete: 'off',
  autocorrect: 'off',
  autocapitalize: 'none',
  spellcheck: 'false',
  'data-gramm': 'false',
  'data-lpignore': 'true',
};

// ---------------------------------------------------------------------------
// Stato
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
  fields: { ...view.DEFAULT_INPUTS },
  // l'ultimo valore valido di ogni campo, e quelli dell'ultima simulazione partita
  params: { ...view.DEFAULT_PARAMS },
  target: { ...view.DEFAULT_PARAMS },
  epsilon: hw.DEFAULT_EPSILON,
  sweep: { quantity: 'mean', g: null, playing: false },
  normal: { model: 'rademacher', g: null, playing: false },
  anim: { model: 'rademacher', quantity: 'sum', speed: 1 },
};
let text = HW3_TEXTS[state.lang];
const regions = {};
const controls = { fields: {} };
const timers = { compute: null, sweep: null, normal: null };

// I risultati gia' calcolati (gli ultimi), quelli mostrati e la simulazione in corso
const results = new Map();
const computation = { shown: null, error: null, running: null };
let animation = null;

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
    else if (key === 'style') Object.assign(el.style, value);
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
const subtitle = (label) => h('p', { class: 'table-title' }, h('strong', { text: label }));
const pending = () => (computation.error ? h('p', { class: 'note', text: text.ui.error(computation.error) }) : h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad' }, h('strong', { text: label }));
const formulas = (content, label = null) => [label && subtitle(label), h('pre', { text: content })];

// The width of every chart comes from the ResizeObserver, measured after
// layout; the height is set at once, the drawing happens a few
// milliseconds per frame.
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

/** The legend of a chart, in the page: { label, color?, dashed? }. */
function legend(items) {
  const pal = palette();
  return h(
    'ul',
    { class: 'series-legend' },
    items.map((item, i) => {
      const color = pal.series[item.color ?? i];
      return h('li', null, h('span', { class: item.dashed ? 'is-dashed' : null, 'aria-hidden': 'true', style: { borderColor: color, backgroundColor: item.dashed ? 'transparent' : color } }), item.label);
    }),
  );
}

function figure(caption, draw, data, { wide = false, tip = null, items = null, note = null } = {}) {
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': caption });
  const fig = h('figure', { class: wide ? 'figure wide' : 'figure' }, canvas, items && legend(items), note && h('p', { class: 'figure-note', text: note }), h('figcaption', { text: caption }));
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

/** A table: column headers, then rows of cells, each { text | node, class?, head? } (head: a row header, th). */
function table(className, headers, rows) {
  return h(
    'table',
    { class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x) => h('th', { text: x })))),
    h(
      'tbody',
      null,
      rows.map((row) => h(
        'tr',
        { class: row.class || null },
        row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { 'data-label': cell.head ? null : headers[i], class: cell.class || null }, cell.node || cell.text)),
      )),
    ),
  );
}

/** The hypothesis tests of one group, with what each should say. */
function tests(group, s) {
  const expected = view.expectedVerdicts(s);
  return h(
    'div',
    { class: 'tests' },
    view.statTests(s)[group].map(([key, t]) => {
      const rejected = t.verdict === 'reject';
      return h(
        'div',
        { class: `test ${rejected ? 'is-invalid' : 'is-valid'}` },
        h(
          'p',
          { class: 'test-head' },
          h('strong', { text: text.stats.labels[group][key] }),
          ' ',
          h('span', { class: `badge ${rejected ? 'is-invalid' : 'is-valid'}`, text: text.stats.verdict[rejected ? 'reject' : 'notReject'] }),
          h('span', { class: 'note', text: ` (${text.stats.expected[expected[group][key]]})` }),
        ),
        h('p', { text: text.stats.testLine(t) }),
      );
    }),
  );
}

/** A choice among a few values (model, quantity): the pressed button is the active one. */
function choices(label, options, value, onChange) {
  const buttons = options.map(([key, name]) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(key === value), text: name, onclick: () => select(key) }));
  function select(key) {
    options.forEach(([k], i) => buttons[i].setAttribute('aria-pressed', String(k === key)));
    onChange(key);
  }
  return h('div', { class: 'choices', role: 'group', 'aria-label': label }, h('span', { class: 'choices-label', text: label }), buttons);
}

/** A slider on the indices of the checkpoints; set() moves it when the results or the language change. */
function slider(id, onChange) {
  const label = h('label', { for: id });
  const input = h('input', { id, type: 'range', min: 0, max: 0, step: 1, value: 0, oninput: (e) => onChange(Number(e.target.value)) });
  return {
    el: h('div', { class: 'slider' }, label, input),
    set(max, value, labelText) {
      input.max = String(max);
      input.value = String(value);
      input.disabled = max === 0 && !computation.shown;
      label.textContent = labelText;
      input.setAttribute('aria-valuetext', labelText);
    },
  };
}

const modelOptions = () => hw.MODELS.map((m) => [m, text.modelNames[m]]);

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw3-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      h('p', { class: 'note', text: text.assignment.originalNote }),
      h('blockquote', { lang: 'en' }, originalAssignment().map((block) => h('p', { text: block.text }))),
    ),
  );
}

// ---------------------------------------------------------------------------
// 1. Il modello, i campi, l'animazione e le verifiche
// ---------------------------------------------------------------------------

function modelSection() {
  const S = text.sections;
  const I = text.input;
  const Q = text.quantities;
  regions.models = h('div');
  regions.status = h('div');
  regions.verify = h('div');
  regions.simTests = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw3-model', 0, S.model),
    paras(text.model.intro),
    formulas(text.model.formulas, text.model.formulasTitle),
    title('hw3-models', 1, S.models),
    regions.models,
    title('hw3-quantities', 1, S.quantities),
    paras(Q.intro),
    subtitle(Q.tableTitle),
    table('discussion quantities', [Q.cols.quantity, Q.cols.mean, Q.cols.variance, Q.cols.sd, Q.cols.trend], Q.rows.map((row) => ({ cells: [{ text: row[0], head: true }, { text: row[1] }, { text: row[2] }, { text: row[3] }, { text: row[4] }] }))),
    paras(Q.after),
    title('hw3-input', 1, S.input),
    h('p', { text: I.intro }),
    inputsBlock(),
    regions.status,
    title('hw3-trajectories', 1, S.trajectories),
    trajectoriesBlock(),
    title('hw3-verify', 1, S.verify),
    regions.verify,
    regions.simTests,
  );
}

function updateModels() {
  const M = text.models;
  const F = text.fmt;
  const p = state.params.p;
  fill(
    regions.models,
    paras(M.intro),
    subtitle(M.tableTitle(p)),
    table(
      'discussion models',
      [M.cols.model, M.cols.values, M.cols.mu, M.cols.variance, M.cols.rho, M.cols.skewness],
      hw.MODELS.map((model) => {
        const mom = hw.modelMoments(model, p);
        return { cells: [{ text: text.modelNames[model], head: true }, { text: model === 'bernoulli' ? '{0, 1}' : '{-1, +1}' }, { text: F.num(mom.mu, 4) }, { text: F.num(mom.variance, 4) }, { text: F.num(mom.rho, 4) }, { text: F.num(mom.skewness, 4) }] };
      }),
    ),
    paras(M.after),
  );
}

// --- 1.3 I campi ----------------------------------------------------------------

const FIELDS = [
  ['p', 'pText', 'hw3-p', 'decimal'],
  ['n', 'nText', 'hw3-n', 'numeric'],
  ['m', 'mText', 'hw3-m', 'numeric'],
  ['seed', 'seedText', 'hw3-seed', 'numeric'],
];

function inputsBlock() {
  const I = text.input;
  const labels = { p: [I.pLabel, I.pHint], n: [I.nLabel, I.nHint], m: [I.mLabel, I.mHint], seed: [I.seedLabel, I.seedHint] };
  return h(
    'div',
    { class: 'params' },
    FIELDS.map(([key, name, id, mode]) => {
      const input = h('input', { id, type: 'text', inputmode: mode, ...PRIVATE_FIELD, maxlength: view.FIELD_LENGTH[key], 'aria-describedby': `${id}-help`, oninput: (e) => changeFields({ [name]: e.target.value.slice(0, view.FIELD_LENGTH[key]) }) });
      input.value = state.fields[name];
      const help = h('p', { id: `${id}-help`, class: 'note', text: labels[key][1] });
      controls.fields[key] = { input, help, hint: labels[key][1] };
      const extra = key === 'seed' ? h('button', { type: 'button', class: 'btn alt', text: I.randomSeed, onclick: () => changeFields({ seedText: String(hw.randomSeed()) }, true) }) : null;
      return h('div', { class: 'param' }, h('label', { for: id, text: labels[key][0] }), h('span', { class: 'param-row' }, input, extra), help);
    }),
  );
}

function changeFields(patch, fromButton = false) {
  Object.assign(state.fields, patch);
  if (fromButton) syncFields();
  updateInputs();
}

function syncFields() {
  for (const [key, name] of FIELDS) {
    const field = controls.fields[key];
    if (field && field.input.value !== state.fields[name]) field.input.value = state.fields[name];
  }
}

function restore() {
  state.fields = { ...view.DEFAULT_INPUTS };
  syncFields();
  updateInputs();
}

function fieldError(r, key) {
  const I = text.input;
  if (r.ok) return null;
  if (r.error === 'range') return I.errors.range(...I.limits[key]);
  return I.errors[r.error](r.text);
}

/** The fields read again: errors, the last valid value of each, and a new simulation when they settle. */
function updateInputs() {
  const read = view.readInputs(state.fields);
  for (const [key] of FIELDS) {
    const field = controls.fields[key];
    const error = fieldError(read[key], key);
    field.input.setAttribute('aria-invalid', String(Boolean(error)));
    field.help.className = error ? 'field-error' : 'note';
    field.help.textContent = error || field.hint;
    if (error) field.help.setAttribute('role', 'alert');
    else field.help.removeAttribute('role');
  }
  const next = view.applyInputs(read, state.params);
  if (next !== state.params) {
    state.params = next;
    updateModels();
    clearTimeout(timers.compute);
    timers.compute = setTimeout(() => {
      state.target = { ...state.params };
      startComputation();
      createAnimation();
    }, 400);
  }
  updateStatus();
}

/** Under the fields: the errors, the values in use, the simulation running or the time it took. */
function updateStatus() {
  const I = text.input;
  const read = view.readInputs(state.fields);
  const badge = view.inputBadge(state.params, I);
  const waiting = computation.running || view.paramsKey(state.params) !== view.paramsKey(state.target);
  const s = computation.shown;
  fill(
    regions.status,
    !view.allValid(read) && h('p', { class: 'stale', role: 'status', text: I.stale }),
    h('p', { class: badge.known ? 'badge-line is-task' : 'badge-line is-custom' }, h('span', { text: badge.text }), badge.restore && h('button', { type: 'button', class: 'btn alt', text: I.restore, onclick: restore })),
    waiting && s && h('p', { class: 'stale', role: 'status', text: I.pending }),
    computation.error && h('p', { class: 'note', text: text.ui.error(computation.error) }),
    s && !waiting && h('p', { class: 'note', role: 'status', text: I.run(s) }),
  );
}

// --- 1.4 Le traiettorie -----------------------------------------------------------

function trajectoriesBlock() {
  const T = text.trajectories;
  regions.trajectoriesIntro = h('div');
  const button = (label, action) => h('button', { type: 'button', class: 'btn alt', text: label, onclick: () => animation && animation[action]() });
  controls.play = h('button', {
    type: 'button',
    class: 'btn',
    text: T.play,
    onclick: () => {
      if (!animation) return;
      if (animation.status().playing) animation.pause();
      else animation.play();
    },
  });
  const speed = h(
    'select',
    {
      onchange: (e) => {
        state.anim.speed = Number(e.target.value);
        if (animation) animation.setSpeed(view.ANIMATION.speeds[state.anim.speed]);
      },
    },
    T.speeds.map((name, i) => h('option', { value: i, text: name, selected: i === state.anim.speed })),
  );
  controls.canvas = h('canvas', { class: 'anim', role: 'img', 'aria-label': text.sections.trajectories });
  controls.caption = h('p', { class: 'caption', 'aria-live': 'polite' });
  return [
    regions.trajectoriesIntro,
    choices(T.modelLabel, modelOptions(), state.anim.model, (model) => {
      state.anim.model = model;
      createAnimation();
    }),
    choices(T.quantityLabel, hw.QUANTITIES.map((q) => [q, text.trajectoryNames[q]]), state.anim.quantity, (quantity) => {
      state.anim.quantity = quantity;
      if (animation) animation.setQuantity(quantity);
    }),
    h('div', { class: 'controls' }, h('label', null, T.speedLabel, speed), h('span', { class: 'buttons' }, controls.play, button(T.step, 'step'), button(T.reset, 'reset'), button(T.end, 'toEnd'))),
    // posizionato: ci stanno dentro l'evidenziazione e l'etichetta sotto il puntatore
    h('div', { class: 'figure' }, controls.canvas),
    legend([{ label: T.legend[0], color: 0 }, { label: T.legend[1], color: 1 }, { label: T.legend[2], color: 2, dashed: true }, { label: T.legend[3], color: 3, dashed: true }]),
    controls.caption,
    paras(T.after),
  ];
}

function updateCaption(st) {
  const T = text.trajectories;
  controls.caption.textContent = T.caption(st, text.trajectoryNames[st.quantity]);
  controls.caption.setAttribute('aria-live', st.playing ? 'off' : 'polite');
  let label = T.play;
  if (st.playing) label = T.pause;
  else if (st.k > 0 && !st.done) label = T.resume;
  controls.play.textContent = label;
}

let canvasWidth = 0;
const canvasResizer = new ResizeObserver(() => {
  const canvas = controls.canvas;
  if (!animation || !canvas || canvas.clientWidth === canvasWidth) return;
  canvasWidth = canvas.clientWidth;
  animation.redraw();
});

/** The animation of the attackers of the last simulation started, for the chosen model. */
function createAnimation() {
  if (animation) animation.destroy();
  animation = null;
  const canvas = controls.canvas;
  if (!canvas || !canvas.isConnected) return;
  const options = view.animationOptions(state.target, state.anim.model);
  fill(regions.trajectoriesIntro, paras(text.trajectories.intro(options.shown, options.sample)));
  animation = hw.createTrajectoryAnimation(canvas, {
    ...options,
    quantity: state.anim.quantity,
    speed: view.ANIMATION.speeds[state.anim.speed],
    palette: palette(),
    decimal: text.fmt.decimal,
    describe: view.tips.trajectory(text),
    onUpdate: updateCaption,
  });
  canvasWidth = canvas.clientWidth;
  canvasResizer.disconnect();
  canvasResizer.observe(canvas);
}

// --- 1.5 Verifiche -----------------------------------------------------------------

let checkRows = null;

function updateVerify() {
  const V = text.verify;
  if (!checkRows) {
    fill(regions.verify, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const ok = checkRows.filter((r) => r.ok).length;
  const groups = ['generator', 'functions'].map((group) => ({ group, rows: checkRows.filter((r) => r.group === group) }));
  fill(
    regions.verify,
    h('p', { text: V.intro }),
    check(ok === checkRows.length, V.summary(ok, checkRows.length)),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: V.details(checkRows.length) }),
      groups.map((g) => [
        subtitle(V.groups[g.group]),
        table(
          'discussion vectors',
          [V.cols.check, V.cols.expected, V.cols.result],
          g.rows.map((r) => ({ cells: [{ text: r.name, head: true }, { node: h('code', { text: r.expected }) }, { node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }), class: r.ok ? 'is-ok' : 'is-bad' }] })),
        ),
      ]),
    ),
  );
}

function updateSimTests() {
  const s = computation.shown;
  fill(regions.simTests, s && tests('sim', s));
}

// ---------------------------------------------------------------------------
// 2. Le distribuzioni
// ---------------------------------------------------------------------------

function distributionsSection() {
  const S = text.sections;
  const W = text.sweep;
  regions.sweep = h('div');
  regions.moments = h('div');
  controls.sweepSlider = slider('hw3-sweep-n', (g) => {
    stopPlayer('sweep');
    state.sweep.g = g;
    updateSweep();
  });
  controls.sweepPlay = h('button', { type: 'button', class: 'btn alt', text: W.play, onclick: () => togglePlayer('sweep', updateSweep) });
  return h(
    'section',
    { class: 'section' },
    title('hw3-distributions', 0, S.distributions),
    paras(text.distributions.intro),
    title('hw3-sweep', 1, S.sweep),
    paras(W.intro),
    choices(W.quantityLabel, hw.QUANTITIES.map((q) => [q, text.quantityNames[q]]), state.sweep.quantity, (quantity) => {
      state.sweep.quantity = quantity;
      updateSweep();
    }),
    h('div', { class: 'slider-row' }, controls.sweepSlider.el, controls.sweepPlay),
    regions.sweep,
    legend([{ label: W.legend[0], color: 0 }, { label: W.legend[1], color: 1, dashed: true }, { label: W.legend[2], color: 2 }]),
    paras(W.after),
    title('hw3-moments', 1, S.moments),
    regions.moments,
  );
}

/** The index shown by a player (sweep or normal): the chosen one, or its default, within the checkpoints. */
function playerIndex(name, last) {
  const fallback = name === 'normal' && computation.shown ? view.pointIndex(computation.shown.models.rademacher, 100) : last;
  const g = state[name].g === null ? fallback : state[name].g;
  return Math.min(g, last);
}

const lastIndex = () => (computation.shown ? computation.shown.models.bernoulli.points.length - 1 : 0);

function stopPlayer(name) {
  state[name].playing = false;
  clearTimeout(timers[name]);
}

function togglePlayer(name, update) {
  if (state[name].playing) {
    stopPlayer(name);
    update();
    return;
  }
  const last = lastIndex();
  if (playerIndex(name, last) >= last) state[name].g = 0;
  state[name].playing = true;
  update();
  const tick = () => {
    timers[name] = setTimeout(() => {
      if (!state[name].playing) return;
      const end = lastIndex();
      const g = Math.min(playerIndex(name, end) + 1, end);
      state[name].g = g;
      if (g >= end) state[name].playing = false;
      update();
      if (state[name].playing) tick();
    }, 1100);
  };
  tick();
}

function updateSweep() {
  const W = text.sweep;
  const s = computation.shown;
  controls.sweepPlay.textContent = state.sweep.playing ? W.pause : W.play;
  if (!s) {
    controls.sweepSlider.set(0, 0, W.nLabel(0));
    fill(regions.sweep, pending());
    return;
  }
  const last = lastIndex();
  const g = playerIndex('sweep', last);
  const q = state.sweep.quantity;
  const n = s.models.bernoulli.points[g].n;
  controls.sweepSlider.set(last, g, W.nLabel(n));
  fill(
    regions.sweep,
    h(
      'div',
      { class: 'charts' },
      hw.MODELS.map((model) => {
        const M = s.models[model];
        const data = view.sweepChart(M, g, q, text.fmt.decimal);
        return figure(W.chart(text.modelNames[model], text.quantityNames[q], n, s.params.m), hw.drawHistogram, data, { tip: view.tips.histogram(data, text.tips), note: W.stats(text.modelNames[model], view.quantityStats(M, g, q), q) });
      }),
    ),
  );
}

function updateMoments() {
  const M = text.moments;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.moments, pending());
    return;
  }
  const B = s.models.bernoulli.mom;
  const R = s.models.rademacher.mom;
  fill(
    regions.moments,
    h('p', { text: M.intro }),
    subtitle(M.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact moments',
        [M.cols.n, `${M.cols.bMean} (${F.num(B.mu, 4)})`, `${M.cols.bVar} (${F.num(B.variance, 4)})`, `${M.cols.rMean} (${F.num(R.mu, 4)})`, `${M.cols.rVar} (${F.num(R.variance, 4)})`],
        view.momentRows(s).map((r) => ({ cells: [{ text: F.int(r.n) }, { text: F.num(r.bMean, 4) }, { text: F.num(r.bVar, 4) }, { text: F.num(r.rMean, 4) }, { text: F.num(r.rVar, 4) }] })),
      ),
    ),
    paras(M.after(s)),
  );
}

// ---------------------------------------------------------------------------
// 3. La legge dei grandi numeri
// ---------------------------------------------------------------------------

function llnSection() {
  const S = text.sections;
  const C = text.convergence;
  const [lo, hi] = hw.EPSILON_RANGE;
  regions.convergence = h('div');
  regions.bounds = h('div');
  const label = h('label', { for: 'hw3-epsilon', text: C.epsilonLabel(state.epsilon) });
  const input = h('input', {
    id: 'hw3-epsilon',
    type: 'range',
    min: Math.round(lo * 100),
    max: Math.round(hi * 100),
    step: 1,
    'aria-valuetext': C.epsilonLabel(state.epsilon),
    oninput: (e) => {
      state.epsilon = Number(e.target.value) / 100;
      label.textContent = C.epsilonLabel(state.epsilon);
      input.setAttribute('aria-valuetext', label.textContent);
      updateConvergence();
      updateBounds();
    },
  });
  input.value = String(Math.round(state.epsilon * 100));
  return h(
    'section',
    { class: 'section' },
    title('hw3-lln', 0, S.lln),
    paras(text.lln.intro),
    title('hw3-convergence', 1, S.convergence),
    h('p', { text: C.intro }),
    h('div', { class: 'slider-row' }, h('div', { class: 'slider' }, label, input)),
    regions.convergence,
    title('hw3-bounds', 1, S.bounds),
    regions.bounds,
    title('hw3-strong', 1, S.strong),
    paras(text.strong.paras),
  );
}

function updateConvergence() {
  const C = text.convergence;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.convergence, pending());
    return;
  }
  const eps = state.epsilon;
  const rows = view.llnRows(s, eps);
  // la frazione, e sotto il suo intervallo al 95%
  const cell = (x) => h('span', null, F.num(x.rate, 4), h('span', { class: 'interval', text: `${F.num(x.interval[0], 4)}-${F.num(x.interval[1], 4)}` }));
  const B = text.modelNames.bernoulli;
  const R = text.modelNames.rademacher;
  fill(
    regions.convergence,
    h('div', { class: 'charts' }, hw.MODELS.map((model) => figure(C.chart(text.modelNames[model], eps), hw.drawLineChart, view.llnChart(rows[model], F.decimal), { tip: view.tips.lln(rows[model], text.tips) }))),
    legend([{ label: C.legend[0], color: 0 }, { label: C.legend[1], color: 2 }, { label: C.legend[2], color: 3, dashed: true }, { label: C.legend[3], color: 4, dashed: true }]),
    subtitle(C.tableTitle(eps)),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact lln',
        [C.cols.n, `${B}: ${C.cols.simulated}`, `${B}: ${C.cols.exact}`, `${R}: ${C.cols.simulated}`, `${R}: ${C.cols.exact}`],
        rows.bernoulli.map((b, i) => ({ cells: [{ text: F.int(b.n) }, { node: cell(b) }, { text: F.small(b.exact) }, { node: cell(rows.rademacher[i]) }, { text: F.small(rows.rademacher[i].exact) }] })),
      ),
    ),
    paras(C.after(s, eps)),
    tests('lln', s),
  );
}

function updateBounds() {
  const s = computation.shown;
  fill(regions.bounds, s ? paras(text.bounds.paras(s, state.epsilon)) : pending());
}

// ---------------------------------------------------------------------------
// 4. La varianza
// ---------------------------------------------------------------------------

function varianceSection() {
  regions.variance = h('div');
  return h('section', { class: 'section' }, title('hw3-variance', 0, text.sections.variance), regions.variance);
}

function updateVariance() {
  const V = text.variance;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.variance, pending());
    return;
  }
  const fits = view.varianceFits(s);
  fill(
    regions.variance,
    h('p', { text: V.intro }),
    h('div', { class: 'charts' }, hw.MODELS.map((model) => figure(V.chart(text.modelNames[model]), hw.drawLineChart, view.varianceChart(s.models[model], F.decimal), { tip: view.tips.variance(s.models[model], text.tips) }))),
    legend([{ label: V.legend[0], color: 0 }, { label: V.legend[1], color: 1 }, { label: V.legend[2], color: 2 }, { label: V.legend[3], color: 6, dashed: true }]),
    subtitle(V.fitTitle),
    table(
      'discussion fits',
      [V.fitCols.quantity, V.fitCols.bernoulli, V.fitCols.rademacher, V.fitCols.theory],
      hw.QUANTITIES.map((q) => ({
        cells: [
          { text: text.quantityNames[q], head: true },
          { text: `${F.num(fits.bernoulli[q], 4)} ± ${F.num(fits.bernoulli.error, 4)}` },
          { text: `${F.num(fits.rademacher[q], 4)} ± ${F.num(fits.rademacher.error, 4)}` },
          { text: F.int(view.VARIANCE_SLOPES[q]) },
        ],
      })),
    ),
    paras(V.after(s)),
  );
}

// ---------------------------------------------------------------------------
// 5. Il teorema del limite centrale
// ---------------------------------------------------------------------------

function cltSection() {
  const S = text.sections;
  const N = text.normal;
  regions.normal = h('div');
  regions.speed = h('div');
  regions.drift = h('div');
  controls.normalSlider = slider('hw3-clt-n', (g) => {
    stopPlayer('normal');
    state.normal.g = g;
    updateNormal();
  });
  controls.normalPlay = h('button', { type: 'button', class: 'btn alt', text: text.sweep.play, onclick: () => togglePlayer('normal', updateNormal) });
  return h(
    'section',
    { class: 'section' },
    title('hw3-clt', 0, S.clt),
    paras(text.clt.intro),
    title('hw3-normal', 1, S.normal),
    h('p', { text: N.intro }),
    choices(N.modelLabel, ['rademacher', 'bernoulli'].map((m) => [m, N.models[m]]), state.normal.model, (model) => {
      state.normal.model = model;
      updateNormal();
    }),
    h('div', { class: 'slider-row' }, controls.normalSlider.el, controls.normalPlay),
    regions.normal,
    title('hw3-speed', 1, S.speed),
    regions.speed,
    title('hw3-bernoulli', 1, S.bernoulli),
    regions.drift,
  );
}

function updateNormal() {
  const N = text.normal;
  const F = text.fmt;
  const s = computation.shown;
  controls.normalPlay.textContent = state.normal.playing ? text.sweep.pause : text.sweep.play;
  if (!s) {
    controls.normalSlider.set(0, 0, N.nLabel(0));
    fill(regions.normal, pending());
    return;
  }
  const M = s.models[state.normal.model];
  const last = lastIndex();
  const g = playerIndex('normal', last);
  const n = M.points[g].n;
  const label = N.models[state.normal.model];
  controls.normalSlider.set(last, g, N.nLabel(n));
  const hist = view.cltHistogram(M, g, F.decimal);
  const qq = view.qqData(M, g, F.decimal);
  fill(
    regions.normal,
    h(
      'div',
      { class: 'charts' },
      figure(N.histChart(label, n), hw.drawHistogram, hist, { tip: view.tips.histogram(hist, text.tips), items: [{ label: N.legend[0], color: 0 }, { label: N.legend[1], color: 1, dashed: true }, { label: N.legend[2], color: 2 }] }),
      figure(N.qqChart(label, n), hw.drawQQ, qq, { tip: view.tips.qq(qq, text.tips), items: [{ label: N.qqLegend[0], color: 0 }, { label: N.qqLegend[1], color: 1, dashed: true }] }),
    ),
    h('p', { class: 'stats', text: N.stats(view.shapeAt(M, g)) }),
    paras(N.after),
    tests('clt', s),
  );
}

function updateSpeed() {
  const P = text.speed;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.speed, pending());
    return;
  }
  fill(
    regions.speed,
    h('p', { text: P.intro }),
    h('div', { class: 'charts' }, ['rademacher', 'bernoulli'].map((model) => figure(P.chart(text.modelNames[model]), hw.drawLineChart, view.distanceChart(s.models[model], s.params.m, F.decimal), { tip: view.tips.distance(s.models[model], text.tips) }))),
    legend([{ label: P.legend[0], color: 1 }, { label: P.legend[1], color: 2 }, { label: P.legend[2], color: 3, dashed: true }, { label: P.legend[3], color: 0 }, { label: P.legend[4], color: 6, dashed: true }]),
    paras(P.after(s)),
  );
}

function updateDrift() {
  const D = text.bernoulli;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.drift, pending());
    return;
  }
  fill(
    regions.drift,
    h('p', { text: D.intro }),
    subtitle(D.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact drift',
        ['n', 'mean', 'sampleMean', 'skewness', 'sampleSkewness', 'distance'].map((k) => D.cols[k]),
        view.driftRows(s.models.bernoulli).map((r) => ({ cells: [{ text: F.int(r.n) }, { text: F.num(r.mean, 3) }, { text: F.num(r.sampleMean, 3) }, { text: F.num(r.skewness, 4) }, { text: F.num(r.sampleSkewness, 4) }, { text: F.num(r.distance, 4) }] })),
      ),
    ),
    paras(D.after(s)),
  );
}

// ---------------------------------------------------------------------------
// 6. Sistemi e attaccanti
// ---------------------------------------------------------------------------

function interpretationSection() {
  const S = text.sections;
  regions.size = h('div');
  regions.attackers = h('div');
  regions.aggregate = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw3-interpretation', 0, S.interpretation),
    paras(text.interpretation.intro),
    title('hw3-size', 1, S.size),
    regions.size,
    title('hw3-attackers', 1, S.attackers),
    regions.attackers,
    title('hw3-aggregate', 1, S.aggregate),
    regions.aggregate,
    title('hw3-limits', 1, S.limits),
    paras(text.limits.paras),
  );
}

function updateSize() {
  const Z = text.size;
  const s = computation.shown;
  if (!s) {
    fill(regions.size, pending());
    return;
  }
  const W = s.models.rademacher.walk;
  const data = view.arcsineChart(W, text.fmt.decimal);
  fill(
    regions.size,
    paras(Z.paras(s)),
    figure(Z.arcsineChart(W.even, s.params.m), hw.drawHistogram, data, { wide: true, tip: view.tips.arcsine(data, text.tips), items: [{ label: Z.arcsineLegend[0], color: 0 }, { label: Z.arcsineLegend[1], color: 1, dashed: true }, { label: Z.arcsineLegend[2], color: 2 }] }),
    paras(Z.after),
    tests('walk', s),
  );
}

function updateAttackers() {
  const A = text.attackers;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.attackers, pending());
    return;
  }
  const G = s.models.bernoulli.groups;
  const n = s.params.n;
  fill(
    regions.attackers,
    h('p', { text: A.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(A.bestChart(n), hw.drawLineChart, view.bestChart(G, F.decimal), { tip: view.tips.best(G, text.tips), items: [{ label: A.bestLegend[0], color: 0 }, { label: A.bestLegend[1], color: 1 }, { label: A.bestLegend[2], color: 2, dashed: true }, { label: A.bestLegend[3], color: 3, dashed: true }] }),
      figure(A.probabilityChart(n), hw.drawLineChart, view.probabilityChart(G, F.decimal), { tip: view.tips.probability(G, text.tips), items: [{ label: A.probabilityLegend[0], color: 0 }, { label: A.probabilityLegend[1], color: 0, dashed: true }, { label: A.probabilityLegend[2], color: 2 }, { label: A.probabilityLegend[3], color: 2, dashed: true }] }),
    ),
    paras(A.after(s)),
  );
}

function updateAggregate() {
  const G = text.aggregate;
  const s = computation.shown;
  if (!s) {
    fill(regions.aggregate, pending());
    return;
  }
  const data = view.systemsChart(s.models.bernoulli, text.fmt.decimal);
  fill(
    regions.aggregate,
    paras(G.paras(s)),
    figure(G.systemsChart(s.params.n, s.params.m), hw.drawHistogram, data, { wide: true, tip: view.tips.histogram(data, text.tips), items: [{ label: G.systemsLegend[0], color: 0 }, { label: G.systemsLegend[1], color: 1, dashed: true }, { label: G.systemsLegend[2], color: 2 }] }),
    paras(G.after),
  );
}

// ---------------------------------------------------------------------------
// 7, 8 e 9
// ---------------------------------------------------------------------------

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section' }, title('hw3-tests', 0, text.sections.tests), regions.tests);
}

function updateTests() {
  const T = text.tests;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.tests, pending());
    return;
  }
  const summary = view.testSummary(s);
  fill(
    regions.tests,
    h('p', { text: T.intro(s) }),
    table(
      'discussion summary-tests',
      [T.cols.subject, T.cols.hypothesis, T.cols.p, T.cols.verdict, T.cols.expected],
      summary.all.map((t) => {
        const rejected = t.result.verdict === 'reject';
        return {
          class: rejected ? 'is-rejected' : null,
          cells: [{ text: text.stats.groups[t.group], head: true }, { text: text.stats.labels[t.group][t.key] }, { text: F.pval(t.result.pValue) }, { text: text.stats.verdict[rejected ? 'reject' : 'notReject'] }, { text: text.stats.expected[t.expected] }],
        };
      }),
    ),
    paras(T.after(summary, s)),
  );
}

function historySection() {
  const H = text.history;
  return h(
    'section',
    { class: 'section' },
    title('hw3-history', 0, text.sections.history),
    h('p', { text: H.intro }),
    h('p', { class: 'legend' }, h('span', { class: 'legend-task', text: H.legend.task }), h('span', { class: 'legend-context', text: H.legend.context })),
    h(
      'ol',
      { class: 'timeline' },
      H.events.map((e) => h('li', { class: e.task ? 'is-task' : 'is-context' }, h('span', { class: 'year', text: e.year }), h('div', null, h('strong', { text: e.title }), h('p', { text: e.text })))),
    ),
    h('p', { text: H.after }),
  );
}

function conclusionSection() {
  regions.conclusion = h('div');
  return h('section', { class: 'section' }, title('hw3-conclusion', 0, text.sections.conclusion), regions.conclusion);
}

function updateConclusion() {
  fill(regions.conclusion, paras(text.conclusion(computation.shown)));
}

// ---------------------------------------------------------------------------
// La simulazione
// ---------------------------------------------------------------------------

const message = (error) => (error instanceof Error ? error.message : String(error));

/** A generator that stops early, returning null, once its token is cancelled. */
function* cancellable(steps, token) {
  let step = steps.next();
  while (!step.done) {
    if (token.cancelled) return null;
    yield;
    step = steps.next();
  }
  return step.value;
}

// gli ultimi risultati restano in memoria (ognuno pesa circa un megabyte)
function remember(key, value) {
  results.delete(key);
  results.set(key, value);
  while (results.size > 4) results.delete(results.keys().next().value);
}

/** Simulates the parameters of state.target; the one still running for other parameters stops at its next slice. */
function startComputation() {
  const params = state.target;
  const key = view.paramsKey(params);
  if (computation.running) computation.running.token.cancelled = true;
  computation.running = null;
  if (results.has(key)) {
    computation.shown = results.get(key);
    computation.error = null;
    updateResults();
    return;
  }
  const token = { cancelled: false };
  computation.running = { key, token };
  updateStatus();
  hw.runStepsAsync(() => cancellable(hw.exploreSteps(params), token)).then(
    (value) => {
      if (token.cancelled || value === null) return;
      remember(key, value);
      computation.running = null;
      computation.shown = value;
      computation.error = null;
      updateResults();
    },
    (error) => {
      if (token.cancelled) return;
      computation.running = null;
      computation.error = message(error);
      updateResults();
    },
  );
}

function updateResults() {
  updateStatus();
  updateSimTests();
  updateSweep();
  updateMoments();
  updateConvergence();
  updateBounds();
  updateVariance();
  updateNormal();
  updateSpeed();
  updateDrift();
  updateSize();
  updateAttackers();
  updateAggregate();
  updateTests();
  updateConclusion();
}

// ---------------------------------------------------------------------------
// Indice, lingua e avvio
// ---------------------------------------------------------------------------

const dialog = document.getElementById('index-dialog');
const FOLLOW_MS = 2500;

// Porta il titolo in cima e lo segue per un paio di secondi: se nel
// frattempo qualcosa sopra cambia altezza (una sezione che finisce di
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
  document.title = 'Homework #3 - Statistics';
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
  text = HW3_TEXTS[state.lang];
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), modelSection(), distributionsSection(), llnSection(), varianceSection(), cltSection(), interpretationSection(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateModels();
  updateInputs();
  updateVerify();
  updateResults();
  createAnimation();
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
  // i colori dei grafici, delle legende e dell'animazione seguono il tema del sistema
  darkQuery.addEventListener('change', render);
  render();
  // le verifiche e la simulazione partono dopo il primo disegno della pagina
  setTimeout(() => {
    try {
      checkRows = hw.verifyAll();
    } catch (error) {
      checkRows = [{ group: 'functions', name: text.ui.error(message(error)), expected: '', actual: '', ok: false }];
    }
    updateVerify();
    startComputation();
  }, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
