// src/pages/statistics/hw7/standalone/app.js
// L'interfaccia del programma scaricabile dell'Homework #7, in JavaScript
// puro: niente React, niente dipendenze. Disegna le stesse sezioni della
// pagina del sito, nello stesso ordine della consegna, con gli stessi testi
// (texts.js), la stessa logica di presentazione (view.js) e gli stessi
// calcoli (homework7.js, con gli SMS e NSL-KDD dentro). La build
// (build/homework-standalone.js) lo unisce a view.js e texts.js in un unico
// app.js, uno script classico che si apre anche da file:// con un doppio
// clic su index.html.
//
// Le simulazioni lunghe girano a fette di pochi millisecondi (da file:// i
// worker non partono): le sezioni che ne hanno bisogno si riempiono quando
// arrivano. Ogni testo entra nella pagina con textContent, mai come HTML:
// nemmeno quello che si scrive nel campo dell'antispam.
import * as hw from '../homework7.js';
import * as view from '../view.js';
import { HW7_TEXTS, originalAssignment } from '../texts.js';
import * as kit from '../../chartkit/kitDom.js';

const HEADINGS = ['h2', 'h3', 'h4'];
const LANGUAGES = ['it', 'en'];
const SVG_NS = 'http://www.w3.org/2000/svg';

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#161616',
    text: '#d6d6d6',
    grid: '#262626',
    bars: '#7986cb',
    reference: '#ff6b81',
    highlight: '#ff6b81',
    series: ['#7986cb', '#ff6b81', '#4fb39c', '#ffca28', '#ba68c8', '#4dd0e1', '#9e9e9e', '#bcaaa4', '#d4e157', '#ffa726', '#64b5f6', '#f06292'],
  },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const palette = () => (darkQuery.matches ? PALETTES.dark : PALETTES.light);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  // the boxes: they keep their state when the language changes
  sequence: view.SEQUENCE_TRY_DEFAULT.key,
  clt: { ...view.CLT_TRY_DEFAULT },
  hash: { bits: view.HASH_TRY_DEFAULT.bits, factor: view.HASH_TRY_DEFAULT.factor, trials: 0, hits: 0, history: [] },
  mapMode: null,
  scale: view.SCALE_TRY_DEFAULT.alpha,
  burst: view.BURST_TRY_DEFAULT.rho,
  discovery: { ...view.DISCOVERY_TRY_DEFAULT },
  alarm: { ...view.ALARM_TRY_DEFAULT },
  evidence: { ...view.NETWORK_TRY_DEFAULT },
  sprt: { attempts: [], alpha: view.SPRT_TRY_DEFAULT.alpha, draws: 0 },
  belief: { ...view.BELIEF_TRY_DEFAULT },
  prior: { shape: view.PRIOR_TRY_DEFAULT.shape, heights: [...hw.PRIOR_SHAPES[view.PRIOR_TRY_DEFAULT.shape]], data: view.PRIOR_TRY_DEFAULT.data },
  message: null,
  base: 'train',
  kdd: { ...view.KDD_TRY_DEFAULT },
};
let text = HW7_TEXTS[state.lang];
const regions = {};
// the results of the long simulations, and the error if they failed
const computation = { shown: null, error: null };
// computed once, the first time they are needed
let models = null;
const getModels = () => {
  if (!models) models = { sms: hw.smsModel(), kdd: hw.kddModel() };
  return models;
};
let scaleSamples = null;
let checkRows = null;

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

/** The same for SVG elements. */
function svg(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'text') el.textContent = value;
    else el.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) if (child) el.append(child);
  return el;
}

const paras = (list) => (Array.isArray(list) ? list : [list]).filter(Boolean).map((t) => h('p', { text: t }));
const title = (id, level, label) => h(HEADINGS[level], { id, tabindex: -1, class: 'anchor', text: label });
const subtitle = (label) => h('p', { class: 'table-title' }, h('strong', { text: label }));
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad' }, h('strong', { text: label }));
const formulas = (content) => h('pre', { text: content });
const resultLine = (content) => h('p', { class: 'caption line', 'aria-live': 'polite', text: content });
const actions = (...buttons) => h('p', { class: 'actions' }, buttons);
const action = (label, onclick, disabled = false) => h('button', { type: 'button', class: 'btn alt small', text: label, onclick, disabled });
const tryBox = (id, label, ...children) => h('div', { class: 'try' }, title(id, 2, label), children);
const message = (error) => (error instanceof Error ? error.message : String(error));
const pending = () => (computation.error ? h('p', { class: 'note', text: text.ui.error(computation.error) }) : h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));

// what the reader hid in the legends of the charts that are built again (a box that changes)
const kept = {};
const keep = (name) => {
  if (!kept[name]) kept[name] = new Set();
  return kept[name];
};

const { partsOf, hideParts } = kit;

/** Hides parts of a chart (a legend shared by several charts). */
function setHidden(fig, parts) {
  fig.kit.setHidden(parts);
}

/**
 * A chart (chartkit/kitDom.js): drawn by homework7.js, with its legend
 * (`items`), its label under the pointer, the table tied to it (`table`, an
 * id of view.LINKED_TABLES: the legend hides its parts there too) and zoom
 * on every chart with continuous axes; with `spec`, its controls, the
 * handles to drag and the animation. `keep` is the set of hidden items that
 * outlives the chart.
 */
function figure(label, draw, data, { wide = true, tip = null, items = null, note = null, link = null, table = null, keep: hiddenItems = null, spec = null } = {}) {
  return kit.createFigure({ label, draw, data, spec, palette: palette(), lib: hw, schedule: view.scheduleFrameJob, lang: state.lang, tip, items, note, link, table, keep: hiddenItems, wide });
}

/** Replaces the content of a region, releasing the charts it contained and their labels. */
function fill(region, ...nodes) {
  kit.releaseFigures(region);
  for (const drawing of region.querySelectorAll('svg.diagram')) {
    const detach = drawingLabels.get(drawing);
    if (detach) detach();
    drawingLabels.delete(drawing);
  }
  region.replaceChildren(...nodes.flat(Infinity).filter((n) => n !== null && n !== undefined && n !== false));
}

/**
 * A table like the one of the page: `columns` [{ key, label, num?, part? }]
 * and `rows` [{ cells: { [key]: content }, class?, part? }]; the first
 * column is the header of every row. A column or a row with a `part` is
 * hidden with that part of its chart.
 */
function dataTable({ id = null, caption: label = null, className = '', columns, rows, note = null }) {
  const el = h(
    'table',
    { id, class: `table compact ${className}` },
    h('thead', null, h('tr', null, columns.map((c) => h('th', { scope: 'col', class: c.num ? 'num' : null, text: c.label, 'data-part': c.part || null })))),
    h(
      'tbody',
      null,
      rows.map((r) => h(
        'tr',
        { class: r.class || null, 'data-part': r.part || null },
        columns.map((c, i) => {
          const v = r.cells[c.key];
          const content = v instanceof Node ? v : String(v ?? '');
          return i === 0 ? h('th', { scope: 'row' }, content) : h('td', { class: c.num ? 'num' : null, 'data-label': c.label, 'data-part': c.part || null }, content);
        }),
      )),
    ),
  );
  return [label && subtitle(label), h('div', { class: 'scroll' }, el), note && h('p', { class: 'note', text: note })];
}

/** A choice among a few values: the pressed button is the active one. */
function choices(label, options, value, onChange) {
  const buttons = options.map(([key, name]) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(key === value), text: name, onclick: () => select(key) }));
  function select(key) {
    options.forEach(([k], i) => buttons[i].setAttribute('aria-pressed', String(k === key)));
    onChange(key);
  }
  return h('div', { class: 'choices', role: 'group', 'aria-label': label }, h('span', { class: 'choices-label', text: label }), buttons);
}

/** A slider on indices from 0 to max; label(text) changes its label. */
function slider(id, label, max, value, onChange) {
  const labelEl = h('label', { for: id, text: label });
  const input = h('input', { id, type: 'range', min: 0, max, step: 1, value, 'aria-valuetext': label, oninput: (e) => onChange(Number(e.target.value)) });
  return {
    el: h('div', { class: 'slider' }, labelEl, input),
    label(textLabel) {
      labelEl.textContent = textLabel;
      input.setAttribute('aria-valuetext', textLabel);
    },
  };
}

// the labels of the SVG drawings: released when their drawing is replaced
const drawingLabels = new Map(); // svg -> detach

/**
 * An SVG drawing with the label under the pointer, the same as the charts:
 * locate(x, y, width) says what lies under the point. The drawing sits in
 * a positioned box, where the label goes.
 */
function labelled(drawing, locate) {
  const box = h('div', { class: 'drawing' }, drawing);
  drawingLabels.set(drawing, hw.attachPointerLabel(drawing, locate));
  return box;
}

/** A box whose output region is built again at every change: `build()` returns the nodes. */
function live(build) {
  const region = h('div');
  const update = () => fill(region, build());
  update();
  return { region, update };
}

/** Draws a chart again in place, with new data, label under the pointer and caption, without replacing its canvas (no flicker while a slider moves); the hidden parts and the zoom stay. */
function refresh(fig, data, tip, label = null) {
  fig.kit.setData(data);
  fig.kit.setTip(tip);
  if (label !== null) fig.kit.setLabel(label);
}

/** Gives the buttons of a legend new labels (same items, same order). */
function relabel(fig, items) {
  fig.querySelectorAll('.series-legend button').forEach((button, i) => {
    if (items[i]) button.lastChild.textContent = items[i].label;
  });
}

/** The part of a chart that legend item k hides: its columns and rows in the linked table carry it. */
const part = (items, k) => items[k].parts[0];

// the parts that wait for the long simulations: built again when they arrive
let waiting = [];

/** A region built by build(s), with s the results of the simulations or null while they run. */
function whenComputed(build) {
  const region = h('div');
  waiting.push({ region, build });
  fill(region, build(computation.shown));
  return region;
}

function updateComputed() {
  for (const w of waiting) fill(w.region, w.build(computation.shown));
}

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw7-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      h('p', { class: 'note', text: text.assignment.originalNote }),
      h(
        'blockquote',
        { lang: 'en' },
        originalAssignment().map((block) => {
          if (block.type === 'title') return h('p', null, h('strong', { text: block.text }));
          if (block.type === 'list') return h('ul', { class: 'plain-list' }, block.items.map((item) => h('li', { text: item })));
          return h('p', { text: block.text });
        }),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// 1. Le forme di convergenza
// ---------------------------------------------------------------------------

function probabilityBlock() {
  const P = text.probability;
  const F = text.fmt;
  const items = view.legends.outside(text.legends);
  return [
    title('hw7-probability', 1, text.sections.probability),
    paras(P.paras(hw.deviationTable())),
    whenComputed((s) => (!s ? pending() : [
      h('div', { class: 'charts' }, figure(P.chartTitle, hw.drawLineChart, view.outsideChart(s.paths, F.decimal), { tip: view.tips.outside(s.paths, text.tips), items, link: view.links.outside, table: view.LINKED_TABLES.outside, keep: keep('outside') })),
      dataTable({
        id: view.LINKED_TABLES.outside,
        caption: P.tableTitle,
        columns: [
          { key: 'n', label: P.cols.n },
          { key: 'simulated', label: P.cols.simulated, num: true, part: part(items, 0) },
          { key: 'exact', label: P.cols.exact, num: true, part: part(items, 1) },
          { key: 'chebyshev', label: P.cols.chebyshev, num: true, part: part(items, 2) },
        ],
        rows: s.paths.checks.map((c) => ({ cells: { n: F.int(c.n), simulated: F.pct(c.outside), exact: F.pct(c.exactOutside, 2), chebyshev: F.pct(hw.deviationBounds(c.n, s.paths.rate, s.paths.epsilon).chebyshev) } })),
      }),
    ])),
    h('p', { text: P.after }),
  ];
}

function almostBlock() {
  const A = text.almost;
  const F = text.fmt;
  const pathsItems = view.legends.paths(text.legends);
  const afterItems = view.legends.after(text.legends);
  return [
    title('hw7-almost', 1, text.sections.almost),
    whenComputed((s) => (!s ? pending() : [
      paras(A.paras(s.paths)),
      h(
        'div',
        { class: 'charts' },
        figure(A.chartTitle, hw.drawLineChart, view.pathsChart(s.paths, F.decimal), { tip: view.tips.paths(s.paths, text.tips), items: pathsItems, keep: keep('paths') }),
        figure(A.chart2Title, hw.drawLineChart, view.afterChart(s.paths, F.decimal), { tip: view.tips.after(s.paths, text.tips), items: afterItems, link: view.links.after, table: view.LINKED_TABLES.after, keep: keep('after') }),
      ),
      dataTable({
        id: view.LINKED_TABLES.after,
        caption: A.tableTitle,
        columns: [
          { key: 'n', label: A.cols.n },
          { key: 'outside', label: A.cols.outside, num: true, part: part(afterItems, 0) },
          { key: 'after', label: A.cols.after, num: true, part: part(afterItems, 1) },
        ],
        rows: s.paths.checks.map((c) => ({ cells: { n: F.int(c.n), outside: F.pct(c.outside), after: F.pct(c.after) } })),
      }),
    ])),
    h('p', { text: A.after }),
  ];
}

function trySequencesBox() {
  const T = text.trySequences;
  const F = text.fmt;
  const describe = h('p');
  const fig = figure(T.names[state.sequence], hw.drawLineChart, { series: [] });
  const tables = h('div');
  const update = () => {
    const key = state.sequence;
    const result = hw.sequencePaths(key, hw.DEFAULT_SEED);
    const modes = hw.SEQUENCE_MODES[key];
    const stillAway = (n) => result.last.filter((l) => l > n).length;
    describe.textContent = T.describe[key];
    refresh(fig, view.sequenceChart(result, F.decimal), view.tips.sequence(result, text.tips), T.names[key]);
    fill(
      tables,
      dataTable({
        caption: T.tableTitle,
        columns: [
          { key: 'n', label: T.cols.n },
          { key: 'deviation', label: T.cols.deviation, num: true },
          { key: 'l2', label: T.cols.l2, num: true },
          { key: 'afterwards', label: T.cols.afterwards, num: true },
          { key: 'simulated', label: T.cols.simulated, num: true },
        ],
        rows: view.sequenceTableN(key).map((n) => {
          const f = hw.sequenceFacts(key, n);
          let afterwards = F.prob(f.afterwards);
          if (f.afterwards === null) afterwards = '-';
          else if (f.afterwards === 1) afterwards = T.never;
          return {
            cells: {
              n: F.int(n),
              deviation: F.prob(f.deviation),
              l2: f.l2 >= 1 ? F.int(f.l2) : F.prob(f.l2),
              afterwards,
              simulated: n < hw.SEQUENCE_LENGTH ? `${F.int(stillAway(n))}/${F.int(result.last.length)}` : '-',
            },
          };
        }),
        note: T.simulatedNote,
      }),
      dataTable({
        caption: T.modesTitle,
        columns: [{ key: 'mode', label: '' }, { key: 'holds', label: T.names[key] }],
        rows: ['probability', 'as', 'l2', 'distribution'].map((m) => ({ class: modes[m] ? 'holds' : 'fails', cells: { mode: T.modes[m], holds: modes[m] ? T.holds : T.fails } })),
      }),
    );
  };
  update();
  return tryBox(
    'hw7-try-sequences',
    text.sections.trySequences,
    h('p', { text: T.intro }),
    choices(T.chooseLabel, hw.SEQUENCES.map((k) => [k, T.names[k]]), state.sequence, (k) => {
      state.sequence = k;
      update();
    }),
    describe,
    h('div', { class: 'charts' }, fig),
    tables,
  );
}

function l2Block() {
  const Q = text.l2;
  const F = text.fmt;
  const items = view.legends.mse(text.legends);
  return [
    title('hw7-l2', 1, text.sections.l2),
    whenComputed((s) => (!s ? pending() : [
      paras(Q.paras(s.paths)),
      h('div', { class: 'charts' }, figure(Q.chartTitle, hw.drawLineChart, view.mseChart(s.paths, F.decimal), { tip: view.tips.mse(s.paths, text.tips), items, link: view.links.mse, table: view.LINKED_TABLES.mse, keep: keep('mse') })),
      dataTable({
        id: view.LINKED_TABLES.mse,
        caption: Q.tableTitle,
        columns: [
          { key: 'n', label: Q.cols.n },
          { key: 'simulated', label: Q.cols.simulated, num: true, part: part(items, 0) },
          { key: 'exact', label: Q.cols.exact, num: true, part: part(items, 1) },
        ],
        rows: s.paths.checks.map((c) => ({ cells: { n: F.int(c.n), simulated: F.sci(c.mse, 2), exact: F.sci(c.exactMse, 2) } })),
      }),
    ])),
    dataTable({
      caption: Q.counterTitle,
      columns: [
        { key: 'n', label: Q.counterCols.n },
        { key: 'spikeP', label: Q.counterCols.spikeP, num: true },
        { key: 'spikeL2', label: Q.counterCols.spikeL2, num: true },
        { key: 'bernP', label: Q.counterCols.bernP, num: true },
        { key: 'bernL2', label: Q.counterCols.bernL2, num: true },
      ],
      rows: view.SEQUENCE_TABLE_N.map((n) => {
        const spike = hw.sequenceFacts('spike', n);
        const bern = hw.sequenceFacts('bern1', n);
        return { cells: { n: F.int(n), spikeP: F.prob(spike.deviation), spikeL2: F.int(spike.l2), bernP: F.prob(bern.deviation), bernL2: F.prob(bern.l2) } };
      }),
    }),
  ];
}

function distributionBlock() {
  const D = text.distribution;
  const F = text.fmt;
  const items = view.legends.clt(text.legends);
  return [
    title('hw7-distribution', 1, text.sections.distribution),
    whenComputed((s) => (!s ? pending() : [
      paras(D.paras(s.clt.rows)),
      h('div', { class: 'charts' }, figure(D.chartTitle, hw.drawLineChart, view.cltChart(s.clt.rows, F.decimal), { tip: view.tips.clt(s.clt.rows, text.tips), items, link: view.links.clt, table: view.LINKED_TABLES.clt, keep: keep('clt') })),
      dataTable({
        id: view.LINKED_TABLES.clt,
        caption: D.tableTitle,
        columns: [
          { key: 'n', label: D.cols.n },
          { key: 'bernoulli', label: D.cols.bernoulli, num: true, part: part(items, 0) },
          { key: 'bernoulliBound', label: D.cols.bernoulliBound, num: true, part: part(items, 1) },
          { key: 'exponential', label: D.cols.exponential, num: true, part: part(items, 2) },
          { key: 'exponentialBound', label: D.cols.exponentialBound, num: true, part: part(items, 3) },
        ],
        rows: s.clt.rows.map((r) => ({ cells: { n: F.int(r.n), bernoulli: F.num(r.bernoulli, 4), bernoulliBound: F.num(r.bernoulliBound, 4), exponential: F.num(r.exponential, 4), exponentialBound: F.num(r.exponentialBound, 4) } })),
      }),
      h('p', { text: D.tests(s.clt) }),
    ])),
  ];
}

function tryCltBox() {
  const T = text.tryClt;
  const F = text.fmt;
  const first = view.cltTry(state.clt, F.decimal);
  const fig = figure(T.chartTitle, hw.drawHistogram, first.chart, { tip: view.tips.histogram(first.chart, text.tips, view.CLT_TRY_REPS), items: view.legends.cltTry(text.legends, first.cauchy), keep: keep('cltTry') });
  const line = resultLine(T.result(first, state.clt));
  const update = () => {
    const t = view.cltTry(state.clt, F.decimal);
    relabel(fig, view.legends.cltTry(text.legends, t.cauchy));
    refresh(fig, t.chart, view.tips.histogram(t.chart, text.tips, view.CLT_TRY_REPS));
    line.textContent = T.result(t, state.clt);
  };
  return tryBox(
    'hw7-try-clt',
    text.sections.tryClt,
    h('p', { text: T.intro }),
    choices(T.lawLabel, hw.CLT_LAWS.map((k) => [k, T.laws[k]]), state.clt.law, (v) => {
      state.clt.law = v;
      update();
    }),
    choices(T.nLabel, view.CLT_TRY_SIZES.map((n) => [n, F.int(n)]), state.clt.n, (v) => {
      state.clt.n = v;
      update();
    }),
    actions(action(text.ui.another, () => {
      state.clt.draw += 1;
      update();
    })),
    h('div', { class: 'charts' }, fig),
    line,
  );
}

function tryHashBox() {
  const T = text.tryHash;
  const F = text.fmt;
  const run = state.hash;
  const count = () => view.hashCount(run.bits, run.factor);
  const exactOf = () => hw.collisionExact(run.bits, count());
  const first = view.hashChart({ history: run.history }, exactOf(), F.decimal);
  const fig = figure(T.chartTitle, hw.drawLineChart, first, { tip: view.tips.hash(first, exactOf(), text.tips), items: view.legends.hash(text.legends), keep: keep('hash') });
  const line = resultLine('');
  const factorGroup = h('div');
  const update = () => {
    const exact = exactOf();
    const chart = view.hashChart({ history: run.history }, exact, F.decimal);
    refresh(fig, chart, view.tips.hash(chart, exact, text.tips));
    line.textContent = T.result(run, exact, count(), run.bits);
  };
  const clear = () => {
    run.trials = 0;
    run.hits = 0;
    run.history = [];
  };
  // the names of the factors depend on the bits: the group is built again when they change
  const buildFactors = () => fill(
    factorGroup,
    choices(T.factorLabel, view.HASH_FACTORS.map((f) => [f, T.factors(view.hashCount(run.bits, f))]), run.factor, (v) => {
      run.factor = v;
      clear();
      update();
    }),
  );
  // more trials, from the stream 'hash' after the ones of the test (repetitions from 10^6)
  const add = (n) => {
    Object.assign(run, view.hashMore(run, run.bits, count(), n));
    update();
  };
  buildFactors();
  update();
  return tryBox(
    'hw7-try-hash',
    text.sections.tryHash,
    h('p', { text: T.intro }),
    choices(T.bitsLabel, hw.HASH_TRY_BITS.map((b) => [b, String(b)]), run.bits, (v) => {
      run.bits = v;
      clear();
      buildFactors();
      update();
    }),
    factorGroup,
    actions(
      action(T.add100, () => add(100)),
      action(T.add1000, () => add(1000)),
      action(text.ui.reset, () => {
        clear();
        update();
      }),
    ),
    h('div', { class: 'charts' }, fig),
    line,
    h('p', { class: 'note', text: T.thirtyTwo(hw.collisionMedian(32)) }),
  );
}

function mapBlock() {
  const M = text.map;
  const pairs = hw.MODES.flatMap((a) => hw.MODES.filter((b) => b !== a).map((b) => ({ a, b, ...hw.implication(a, b) })));
  return [
    title('hw7-map', 1, text.sections.map),
    paras(M.paras),
    dataTable({
      caption: M.tableTitle,
      columns: [{ key: 'from', label: M.cols.from }, { key: 'to', label: M.cols.to }, { key: 'holds', label: M.cols.holds }, { key: 'counter', label: M.cols.counter }],
      rows: pairs.map((x) => ({ class: x.holds ? 'holds' : 'fails', cells: { from: text.tryMap.modes[x.a], to: text.tryMap.modes[x.b], holds: x.holds ? text.trySequences.holds : text.trySequences.fails, counter: x.holds ? '' : text.trySequences.names[x.counter] } })),
    }),
  ];
}

// La mappa delle implicazioni: i quattro modi, con le frecce che valgono sempre
function mapDiagram(mode) {
  const pal = palette();
  const P = view.MAP_LAYOUT;
  const { box } = view.MAP_VIEW;
  const stateOf = (m) => {
    if (!mode) return 'idle';
    if (m === mode) return 'self';
    return hw.implication(mode, m).holds ? 'holds' : 'fails';
  };
  const fills = { idle: pal.background, self: pal.series[0], holds: pal.series[2], fails: pal.series[1] };
  const drawing = svg(
    'svg',
    { class: 'diagram', viewBox: '0 0 104 60', role: 'img', 'aria-label': text.tryMap.diagramLabel },
    svg('defs', null, svg('marker', { id: 'map-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: pal.text }))),
    hw.IMPLICATIONS.map(([a, b]) => {
      const from = P[a];
      const to = P[b];
      const len = Math.hypot(to.x - from.x, to.y - from.y);
      const ux = (to.x - from.x) / len;
      const uy = (to.y - from.y) / len;
      const start = Math.min(box.w / 2 / Math.max(1e-9, Math.abs(ux)), box.h / 2 / Math.max(1e-9, Math.abs(uy)));
      return svg('line', { x1: from.x + ux * start, y1: from.y + uy * start, x2: to.x - ux * (start + 0.8), y2: to.y - uy * (start + 0.8), stroke: pal.text, 'stroke-width': 0.5, 'marker-end': 'url(#map-arrow)' });
    }),
    hw.MODES.map((m) => {
      const st = stateOf(m);
      return svg(
        'g',
        null,
        svg('rect', { x: P[m].x - box.w / 2, y: P[m].y - box.h / 2, width: box.w, height: box.h, rx: 2, fill: fills[st], 'fill-opacity': st === 'idle' ? 1 : 0.35, stroke: st === 'idle' ? pal.text : fills[st], 'stroke-width': st === 'self' ? 1 : 0.5 }),
        svg('text', { x: P[m].x, y: P[m].y + 1.2, 'text-anchor': 'middle', 'font-size': 3.4, fill: pal.text, text: text.tryMap.modes[m] }),
      );
    }),
  );
  const names = (list) => list.map((m) => text.tryMap.modes[m]);
  return labelled(drawing, (x, y, width) => {
    const hit = view.diagramHit(P, view.MAP_VIEW, width, x, y);
    if (!hit) return null;
    const others = hw.MODES.filter((m) => m !== hit.key);
    return { rect: hit.rect, text: text.tips.mode(text.tryMap.modes[hit.key], names(others.filter((m) => hw.implication(hit.key, m).holds)), names(others.filter((m) => hw.implication(m, hit.key).holds))) };
  });
}

function tryMapBox() {
  const T = text.tryMap;
  const out = live(() => {
    const mode = state.mapMode;
    const list = mode
      ? {
        holds: hw.MODES.filter((m) => m !== mode && hw.implication(mode, m).holds),
        fails: hw.MODES.filter((m) => m !== mode && !hw.implication(mode, m).holds).map((m) => ({ mode: m, counter: hw.implication(mode, m).counter })),
      }
      : null;
    return [mapDiagram(mode), resultLine(mode ? T.result(mode, list) : T.pick)];
  });
  return tryBox(
    'hw7-try-map',
    text.sections.tryMap,
    h('p', { text: T.intro }),
    choices(text.sections.tryMap, hw.MODES.map((m) => [m, T.modes[m]]), state.mapMode, (m) => {
      state.mapMode = m;
      out.update();
    }),
    out.region,
  );
}

function rolesBlock() {
  const R = text.roles;
  return [
    title('hw7-roles', 1, text.sections.roles),
    h('p', { text: R.intro }),
    dataTable({
      caption: R.tableTitle,
      className: 'roles',
      columns: [{ key: 'theorem', label: R.cols.theorem }, { key: 'statement', label: R.cols.statement }, { key: 'mode', label: R.cols.mode }, { key: 'condition', label: R.cols.condition }, { key: 'where', label: R.cols.where }],
      rows: R.rows.map((r) => ({ cells: r })),
    }),
    h('p', { text: R.after }),
  ];
}

function resultsBlock() {
  const R = text.results;
  const F = text.fmt;
  const rows = view.resultsRows();
  const delta = [100, 1000, 10000].map((n) => hw.deltaLogOdds(n));
  const items = view.legends.results(text.legends);
  return [
    title('hw7-results', 1, text.sections.results),
    h('p', { text: R.intro }),
    h('p', { text: R.consistency }),
    h('p', { text: R.slutsky(rows) }),
    h('div', { class: 'charts' }, figure(R.chartTitle, hw.drawLineChart, view.resultsChart(rows, F.decimal), { tip: view.tips.results(rows, text.tips), items, link: view.links.results, table: view.LINKED_TABLES.results, keep: keep('results') })),
    dataTable({
      id: view.LINKED_TABLES.results,
      caption: R.tableTitle,
      columns: [
        { key: 'n', label: R.cols.n },
        { key: 'z', label: R.cols.z, num: true, part: part(items, 0) },
        { key: 't', label: R.cols.t, num: true, part: part(items, 1) },
        { key: 'mle', label: R.cols.mle, num: true, part: part(items, 2) },
        { key: 'bias', label: R.cols.bias, num: true, part: part(items, 2) },
        { key: 'efficiency', label: R.cols.efficiency, num: true, part: part(items, 2) },
      ],
      rows: rows.map((r) => ({ cells: { n: F.int(r.n), z: F.num(r.z, 4), t: F.num(r.t, 4), mle: F.num(r.mle.distance, 4), bias: F.pct(r.mle.bias, 2), efficiency: F.num(r.mle.efficiency, 4) } })),
    }),
    h('p', { text: R.delta(delta[0], delta[1]) }),
    dataTable({
      caption: R.deltaTitle,
      columns: [{ key: 'n', label: R.deltaCols.n }, { key: 'exact', label: R.deltaCols.exact, num: true }, { key: 'delta', label: R.deltaCols.delta, num: true }, { key: 'excluded', label: R.deltaCols.excluded, num: true }],
      rows: delta.map((d) => ({ cells: { n: F.int(d.n), exact: F.num(d.exact, 4), delta: F.num(d.delta, 4), excluded: F.prob(d.excluded) } })),
    }),
    whenComputed((s) => (!s ? pending() : [
      h('p', { text: R.gc(s.gc.rows) }),
      dataTable({
        caption: R.gcTitle,
        columns: [{ key: 'n', label: R.gcCols.n }, { key: 'meanD', label: R.gcCols.meanD, num: true }, { key: 'meanScaled', label: R.gcCols.meanScaled, num: true }, { key: 'over', label: R.gcCols.over, num: true }],
        rows: s.gc.rows.map((r) => ({ cells: { n: F.int(r.n), meanD: F.num(r.meanD, 4), meanScaled: F.num(r.meanScaled, 3), over: F.pct(r.over, 1) } })),
      }),
    ])),
    h('p', { text: R.mle(rows) }),
  ];
}

function rootBlock() {
  const R = text.root;
  const F = text.fmt;
  const items = view.legends.root(text.legends);
  const sigma = Math.sqrt(hw.FALSE_ALARMS.rate * (1 - hw.FALSE_ALARMS.rate));
  return [
    title('hw7-root', 1, text.sections.root),
    paras(R.paras([hw.sampleSizeFor(0.01), hw.sampleSizeFor(0.005), hw.sampleSizeFor(0.001)])),
    whenComputed((s) => (!s ? pending() : [
      h('div', { class: 'charts' }, figure(R.chartTitle, hw.drawLineChart, view.rootChart(s.paths, F.decimal), { tip: view.tips.root(s.paths, text.tips), items, link: view.links.root, table: view.LINKED_TABLES.root, keep: keep('root') })),
      dataTable({
        id: view.LINKED_TABLES.root,
        caption: R.tableTitle,
        columns: [
          { key: 'n', label: R.cols.n },
          { key: 'sdCount', label: R.cols.sdCount, num: true, part: part(items, 0) },
          { key: 'exactCount', label: R.cols.exactCount, num: true, part: part(items, 0) },
          { key: 'sdShare', label: R.cols.sdShare, num: true, part: part(items, 1) },
          { key: 'exactShare', label: R.cols.exactShare, num: true, part: part(items, 1) },
        ],
        rows: s.paths.checks.map((c) => ({ cells: { n: F.int(c.n), sdCount: F.num(c.n * Math.sqrt(c.mse), 2), exactCount: F.num(sigma * Math.sqrt(c.n), 2), sdShare: F.num(Math.sqrt(c.mse), 5), exactShare: F.num(sigma / Math.sqrt(c.n), 5) } })),
      }),
    ])),
    dataTable({
      caption: R.inferenceTitle,
      columns: [{ key: 'n', label: R.inferenceCols.n }, { key: 'variance', label: R.inferenceCols.variance, num: true }, { key: 'se', label: R.inferenceCols.se, num: true }, { key: 'half', label: R.inferenceCols.half, num: true }],
      rows: hw.rootTable().map((r) => ({ cells: { n: F.int(r.n), variance: F.num(r.variance, 2), se: F.num(r.se, 5), half: `± ${F.pct(r.half, 2)}` } })),
    }),
  ];
}

function tryScaleBox() {
  const T = text.tryScale;
  const F = text.fmt;
  // the means are drawn once; alpha only rescales them
  if (!scaleSamples) scaleSamples = hw.scaleSamples();
  const alphaOf = () => hw.SCALE_ALPHAS[state.scale];
  const first = view.scaleCharts(scaleSamples, alphaOf(), F.decimal);
  const items = view.legends.scale(text.legends);
  const hidden = keep('scale');
  const figs = first.map((c, i) => figure(T.chartTitle(c.n), hw.drawHistogram, c.chart, { wide: false, tip: view.tips.histogram(c.chart, text.tips, hw.SCALE_REPS), items: i === 0 ? items : null, keep: i === 0 ? hidden : null }));
  // the legend of the first chart hides the same parts in all three
  figs[0].querySelector('.series-legend').addEventListener('click', () => {
    const parts = partsOf(items, hidden);
    figs.slice(1).forEach((f) => setHidden(f, parts));
  });
  const line = resultLine(T.result(first, alphaOf()));
  const control = slider('hw7-alpha', T.alphaLabel(alphaOf()), hw.SCALE_ALPHAS.length - 1, state.scale, (v) => {
    state.scale = v;
    const charts3 = view.scaleCharts(scaleSamples, alphaOf(), F.decimal);
    charts3.forEach((c, i) => refresh(figs[i], c.chart, view.tips.histogram(c.chart, text.tips, hw.SCALE_REPS)));
    control.label(T.alphaLabel(alphaOf()));
    line.textContent = T.result(charts3, alphaOf());
  });
  // the hidden parts kept from before, in the two charts without a legend too
  const parts = partsOf(items, hidden);
  if (parts.length) figs.slice(1).forEach((f) => setHidden(f, parts));
  return tryBox('hw7-try-scale', text.sections.tryScale, h('p', { text: T.intro }), control.el, h('div', { class: 'charts three' }, figs), line);
}

function burstsBlock() {
  const B = text.bursts;
  const F = text.fmt;
  return [
    title('hw7-bursts', 1, text.sections.bursts),
    paras(B.paras(hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.5), hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.9))),
    whenComputed((s) => (!s ? pending() : [
      dataTable({
        caption: B.tableTitle,
        columns: [
          { key: 'rho', label: B.cols.rho },
          { key: 'variance', label: B.cols.variance, num: true },
          { key: 'exact', label: B.cols.exact, num: true },
          { key: 'factor', label: B.cols.factor, num: true },
          { key: 'effective', label: B.cols.effective, num: true },
          { key: 'coverage', label: B.cols.coverage, num: true },
          { key: 'predicted', label: B.cols.predicted, num: true },
        ],
        rows: s.bursts.map((b) => ({ cells: { rho: F.plain(b.rho), variance: F.num(b.variance, 1), exact: F.num(b.exact.variance, 1), factor: F.num(b.exact.factor, 2), effective: F.int(b.exact.effective), coverage: F.pct(b.coverage, 1), predicted: F.pct(b.exact.coverage, 1) } })),
      }),
      h('p', { text: B.simulation(s.bursts) }),
    ])),
    h('p', { text: B.after }),
  ];
}

function tryBurstsBox() {
  const T = text.tryBursts;
  const F = text.fmt;
  const rhoOf = () => hw.BURST_RHOS[state.burst];
  const independent = hw.burstPath(view.BURST_STRIP, hw.FALSE_ALARMS.rate, 0);
  const count = (cells) => cells.reduce((a, v) => a + v, 0);
  const strips = h('div');
  const fig = figure(T.chartTitle, hw.drawLineChart, view.burstChart(rhoOf(), F.decimal), { tip: view.tips.burst(rhoOf(), text.tips), items: view.legends.burst(text.legends), keep: keep('burst') });
  const line = resultLine('');
  const update = () => {
    const rho = rhoOf();
    const bursty = hw.burstPath(view.BURST_STRIP, hw.FALSE_ALARMS.rate, rho);
    const label1 = T.stripLabel(T.strips.independent, count(independent), view.BURST_STRIP);
    const label2 = T.stripLabel(T.strips.bursts, count(bursty), view.BURST_STRIP);
    fill(
      strips,
      h(
        'div',
        { class: 'charts' },
        figure(label1, hw.drawStrip, view.stripChart(independent), { wide: false, tip: view.tips.strip(independent, text.tips) }),
        figure(label2, hw.drawStrip, view.stripChart(bursty), { wide: false, tip: view.tips.strip(bursty, text.tips) }),
      ),
    );
    refresh(fig, view.burstChart(rho, F.decimal), view.tips.burst(rho, text.tips));
    line.textContent = T.result(hw.burstFacts(1000, hw.FALSE_ALARMS.rate, rho));
  };
  const control = slider('hw7-rho', T.rhoLabel(rhoOf()), hw.BURST_RHOS.length - 1, state.burst, (v) => {
    state.burst = v;
    control.label(T.rhoLabel(rhoOf()));
    update();
  });
  update();
  return tryBox('hw7-try-bursts', text.sections.tryBursts, h('p', { text: T.intro }), control.el, strips, h('div', { class: 'charts' }, fig), line);
}

function heavyBlock() {
  const H = text.heavy;
  const F = text.fmt;
  const b = hw.bytesFacts();
  const facts = [
    ['mean', F.int(b.mean)],
    ['median', F.int(b.median)],
    ['sd', F.int(b.sd)],
    ['max', F.int(b.max)],
    ['zeros', F.int(b.zeros)],
    ['top10', F.pct(b.top10)],
    ['skewness', F.num(b.skewness, 1)],
    ['ratio', F.num(b.ratio, 1)],
    ['needed', F.int(b.needed)],
  ];
  return [
    title('hw7-heavy', 1, text.sections.heavy),
    paras(H.paras(b)),
    dataTable({ caption: H.factsTitle, columns: [{ key: 'what', label: '' }, { key: 'value', label: '', num: true }], rows: facts.map(([k, v]) => ({ cells: { what: H.facts[k], value: v } })) }),
    whenComputed((s) => {
      if (!s) return pending();
      const hist = view.bytesChart(s.bytes[s.bytes.length - 1], F.decimal);
      return [
        h(
          'div',
          { class: 'charts' },
          figure(H.cauchyTitle, hw.drawLineChart, view.cauchyChart(s.cauchy, F.decimal), { tip: view.tips.cauchy(s.cauchy, text.tips) }),
          figure(H.histTitle, hw.drawHistogram, hist, { tip: view.tips.histogram(hist, text.tips, hw.BYTES_REPS), items: view.legends.bytes(text.legends), keep: keep('bytes') }),
        ),
        dataTable({
          caption: H.tableTitle,
          columns: [{ key: 'n', label: H.cols.n }, { key: 'D', label: H.cols.D, num: true }, { key: 'p', label: H.cols.p, num: true }, { key: 'below', label: H.cols.below, num: true }, { key: 'median', label: H.cols.median, num: true }],
          rows: s.bytes.map((x) => ({ cells: { n: F.int(x.n), D: F.num(x.D, 3), p: F.p(x.p, x.log10p), below: F.pct(x.below), median: F.num(x.median, 3) } })),
        }),
        h('p', { text: H.bytes(s.bytes) }),
      ];
    }),
  ];
}

function speedBlock() {
  const V = text.speed;
  const F = text.fmt;
  const rows = hw.deviationTable();
  const items = view.legends.speed(text.legends);
  return [
    title('hw7-speed', 1, text.sections.speed),
    paras(V.paras(rows)),
    h('div', { class: 'charts' }, figure(V.chartTitle, hw.drawLineChart, view.speedChart(rows, F.decimal), { tip: view.tips.speed(rows, text.tips), items, link: view.links.speed, table: view.LINKED_TABLES.speed, keep: keep('speed') })),
    dataTable({
      id: view.LINKED_TABLES.speed,
      caption: V.tableTitle,
      columns: [
        { key: 'n', label: V.cols.n },
        { key: 'exact', label: V.cols.exact, num: true, part: part(items, 0) },
        { key: 'chebyshev', label: V.cols.chebyshev, num: true, part: part(items, 1) },
        { key: 'hoeffding', label: V.cols.hoeffding, num: true, part: part(items, 2) },
        { key: 'normal', label: V.cols.normal, num: true, part: part(items, 3) },
      ],
      rows: rows.map((r) => ({ cells: { n: F.int(r.n), exact: F.prob(r.exact), chebyshev: F.prob(r.chebyshev), hoeffding: F.prob(r.hoeffding), normal: F.prob(r.normal) } })),
    }),
  ];
}

function convergenceSection() {
  const C = text.convergence;
  return h(
    'section',
    { class: 'section' },
    title('hw7-convergence', 0, text.sections.convergence),
    paras(C.intro),
    formulas(C.formulas),
    paras(C.after),
    probabilityBlock(),
    almostBlock(),
    trySequencesBox(),
    l2Block(),
    distributionBlock(),
    tryCltBox(),
    tryHashBox(),
    mapBlock(),
    tryMapBox(),
    rolesBlock(),
    resultsBlock(),
    rootBlock(),
    tryScaleBox(),
    burstsBlock(),
    tryBurstsBox(),
    heavyBlock(),
    speedBlock(),
  );
}

// ---------------------------------------------------------------------------
// 2. Probabilita' condizionata, teorema di Bayes e inferenza statistica
// ---------------------------------------------------------------------------

function conditionalBlock() {
  const C = text.conditional;
  const F = text.fmt;
  const chain = hw.attackChain();
  const indep = hw.independenceFacts();
  const pv = hw.pvalueFacts();
  const row = (when, x) => ({ cells: { when, phishing: F.pct(x.phishing, 2), exploit: F.pct(x.exploit, 2), product: F.pct(x.phishing * x.exploit, 3), both: F.pct(x.both, 3) } });
  return [
    title('hw7-conditional', 1, text.sections.conditional),
    paras(C.paras),
    h('p', { text: C.chainIntro }),
    dataTable({
      caption: C.chainTitle,
      columns: [{ key: 'stage', label: C.chainCols.stage }, { key: 'p', label: C.chainCols.p, num: true }, { key: 'cumulative', label: C.chainCols.cumulative, num: true }],
      rows: chain.rows.map((r) => ({ cells: { stage: C.stages[r.key], p: F.pct(r.p, 0), cumulative: F.pctSmall(r.cumulative) } })),
    }),
    h('p', { text: C.chainText(chain) }),
    h('p', { text: C.indepIntro }),
    dataTable({
      caption: C.indepTitle,
      columns: [
        { key: 'when', label: C.indepCols.when },
        { key: 'phishing', label: C.indepCols.phishing, num: true },
        { key: 'exploit', label: C.indepCols.exploit, num: true },
        { key: 'product', label: C.indepCols.product, num: true },
        { key: 'both', label: C.indepCols.both, num: true },
      ],
      rows: [row(C.indepRows.before, indep.causes), row(C.indepRows.after, indep.causesGivenEdr)],
    }),
    h('p', { text: C.indepText(indep) }),
    h('p', { text: C.pvalueIntro(pv) }),
    h('p', { text: C.pvalueText(pv) }),
    h('p', { text: C.manyText(hw.discoveryFacts()) }),
  ];
}

function tryPvalueBox() {
  const T = text.tryPvalue;
  const F = text.fmt;
  const d = state.discovery;
  const factsOf = () => hw.discoveryFacts({ real: hw.DISCOVERY_REALS[d.real], power: hw.DISCOVERY_POWERS[d.power], alpha: hw.DISCOVERY_ALPHAS[d.alpha] });
  const items = view.legends.discovery(text.legends);
  const hidden = keep('discovery');
  const first = factsOf();
  const fig = figure(T.iconTitle, hw.drawIconArray, view.discoveryIcons(first), { tip: view.tips.discovery(first, text.tips), items, link: view.links.discovery, table: view.LINKED_TABLES.discovery, keep: hidden });
  const tableRegion = h('div');
  const line = resultLine('');
  const sliders = {};
  const update = () => {
    const facts = factsOf();
    refresh(fig, view.discoveryIcons(facts), view.tips.discovery(facts, text.tips));
    sliders.real.label(T.real(facts.real));
    sliders.power.label(T.power(facts.power));
    sliders.alpha.label(T.alpha(facts.alpha));
    fill(
      tableRegion,
      dataTable({
        id: view.LINKED_TABLES.discovery,
        caption: T.tableTitle,
        columns: [{ key: 'category', label: T.cols.category }, { key: 'truth', label: T.cols.truth }, { key: 'decision', label: T.cols.decision }, { key: 'count', label: T.cols.count, num: true }, { key: 'share', label: T.cols.share, num: true }],
        rows: view.DISCOVERY_CATEGORIES.map((c, k) => ({ part: part(items, k), cells: { category: text.legends[c], truth: T.truth[c], decision: T.decision[c], count: F.int(facts.counts[k]), share: F.pct(facts.counts[k] / facts.total, 1) } })),
      }),
    );
    // the table is new: the categories hidden from the legend stay hidden
    hideParts(tableRegion.querySelector('table'), partsOf(items, hidden));
    line.textContent = T.result(facts);
  };
  const set = (key) => (v) => {
    d[key] = v;
    update();
  };
  sliders.real = slider('hw7-real', T.real(first.real), hw.DISCOVERY_REALS.length - 1, d.real, set('real'));
  sliders.power = slider('hw7-power', T.power(first.power), hw.DISCOVERY_POWERS.length - 1, d.power, set('power'));
  sliders.alpha = slider('hw7-alpha-tests', T.alpha(first.alpha), hw.DISCOVERY_ALPHAS.length - 1, d.alpha, set('alpha'));
  update();
  return tryBox('hw7-try-pvalue', text.sections.tryPvalue, h('p', { text: T.intro }), sliders.real.el, sliders.power.el, sliders.alpha.el, h('div', { class: 'charts' }, fig), tableRegion, line);
}

function engineBlock() {
  const E = text.engine;
  const F = text.fmt;
  const lik = view.likelihoodChart(hw.DEFAULT_SEED, F.decimal);
  const d1 = lik.curves.data.day1;
  const d10 = lik.curves.data.days10;
  return [
    title('hw7-engine', 1, text.sections.engine),
    h('p', { text: E.components }),
    h('div', { class: 'charts' }, figure(E.likelihoodTitle, hw.drawLineChart, lik.chart, { tip: view.tips.likelihood(lik.curves, text.tips), items: view.legends.likelihood(text.legends), keep: keep('likelihood') })),
    h('p', { text: E.likelihood(lik.curves) }),
    h('p', { text: E.odds }),
    formulas(E.formulas),
    h('p', { text: E.weights(hw.priorWeight(hw.PRIORS.informed, d1.clicks, d1.sent), hw.priorWeight(hw.PRIORS.informed, d10.clicks, d10.sent)) }),
    h('p', { text: E.central }),
    h('p', { text: E.after }),
  ];
}

function alarmBlock() {
  const A = text.alarm;
  const F = text.fmt;
  const facts = hw.alarmFacts(hw.ALARM_DEFAULT);
  const chains = view.alarmChains();
  const items = view.legends.alarm(text.legends);
  return [
    title('hw7-alarm', 1, text.sections.alarm),
    h('p', { text: A.intro(facts) }),
    paras(A.paras(facts)),
    h('div', { class: 'charts' }, figure(A.iconTitle, hw.drawIconArray, view.alarmIcons(facts), { tip: view.tips.alarm(facts, text.tips), items, link: view.links.alarm, table: view.LINKED_TABLES.alarm, keep: keep('alarm') })),
    dataTable({
      id: view.LINKED_TABLES.alarm,
      caption: A.tableTitle,
      columns: [
        { key: 'category', label: A.cols.category },
        { key: 'truth', label: A.cols.truth },
        { key: 'alarm', label: A.cols.alarm },
        { key: 'count', label: A.cols.count, num: true },
        { key: 'share', label: A.cols.share, num: true },
      ],
      rows: view.ALARM_CATEGORIES.map((c, k) => ({ part: part(items, k), cells: { category: text.legends[c], truth: A.truth[c], alarm: A.alarmed[c], count: F.int(facts.counts[k]), share: F.pctSmall(facts.counts[k] / facts.population) } })),
    }),
    h('p', { text: A.chainIntro(hw.SECOND_DETECTOR) }),
    dataTable({
      caption: A.chainTitle,
      columns: [
        { key: 'order', label: A.chainCols.order },
        { key: 'step', label: A.chainCols.step },
        { key: 'lr', label: A.chainCols.lr, num: true },
        { key: 'weight', label: A.chainCols.weight, num: true },
        { key: 'prior', label: A.chainCols.prior, num: true },
        { key: 'posterior', label: A.chainCols.posterior, num: true },
      ],
      rows: ['forward', 'backward'].flatMap((o) => chains[o].map((st, i) => ({ cells: { order: i === 0 ? A.orders[o] : '', step: A.detectors[st.key], lr: F.num(st.lr, 1), weight: F.num(st.weight, 2), prior: F.pct(st.prior, 2), posterior: F.pct(st.posterior, 2) } }))),
    }),
  ];
}

function tryAlarmBox() {
  const T = text.tryAlarm;
  const a = state.alarm;
  const first = view.alarmTry(a);
  const fig = figure(text.alarm.iconTitle, hw.drawIconArray, view.alarmIcons(first.facts), { tip: view.tips.alarm(first.facts, text.tips), items: view.legends.alarm(text.legends), keep: keep('alarmTry') });
  const line = resultLine('');
  const sliders = {};
  const update = () => {
    const t = view.alarmTry(a);
    refresh(fig, view.alarmIcons(t.facts), view.tips.alarm(t.facts, text.tips));
    sliders.base.label(T.base(t.settings.base));
    sliders.sensitivity.label(T.sensitivity(t.settings.sensitivity));
    sliders.fpr.label(T.fpr(t.settings.fpr));
    line.textContent = `${T.result(t)}${a.second ? ` ${T.secondResult(t)}` : ''}`;
  };
  const set = (key) => (v) => {
    a[key] = v;
    update();
  };
  sliders.base = slider('hw7-base', T.base(first.settings.base), hw.ALARM_BASES.length - 1, a.base, set('base'));
  sliders.sensitivity = slider('hw7-sensitivity', T.sensitivity(first.settings.sensitivity), hw.ALARM_SENSITIVITIES.length - 1, a.sensitivity, set('sensitivity'));
  sliders.fpr = slider('hw7-fpr', T.fpr(first.settings.fpr), hw.ALARM_FPRS.length - 1, a.fpr, set('fpr'));
  const second = h(
    'label',
    { class: 'toggle' },
    h('input', {
      type: 'checkbox',
      checked: a.second,
      onchange: (e) => {
        a.second = e.target.checked;
        update();
      },
    }),
    ` ${T.second}`,
  );
  update();
  return tryBox('hw7-try-alarm', text.sections.tryAlarm, h('p', { text: T.intro }), sliders.base.el, sliders.sensitivity.el, sliders.fpr.el, second, h('div', { class: 'charts' }, fig), line);
}

function networkBlock() {
  const N = text.network;
  const F = text.fmt;
  const rows = view.networkRows();
  const items = view.legends.network(text.legends);
  return [
    title('hw7-network', 1, text.sections.network),
    paras(N.intro),
    h('div', { class: 'charts' }, figure(N.chartTitle, hw.drawGroupedBars, view.networkChart(rows, N.stepsShort, F.decimal), { tip: view.tips.network(rows, text.tips), items, link: view.links.network, table: view.LINKED_TABLES.network, keep: keep('network') })),
    dataTable({
      id: view.LINKED_TABLES.network,
      caption: N.tableTitle,
      columns: [
        { key: 'step', label: N.cols.step },
        { key: 'phishing', label: N.cols.phishing, num: true, part: part(items, 0) },
        { key: 'exploit', label: N.cols.exploit, num: true, part: part(items, 1) },
        { key: 'compromise', label: N.cols.compromise, num: true, part: part(items, 2) },
        { key: 'evidence', label: N.cols.evidence, num: true },
      ],
      rows: rows.map((r, i) => ({ cells: { step: N.steps[i], phishing: F.pct(r.phishing), exploit: F.pct(r.exploit), compromise: F.pct(r.compromise), evidence: F.pctSmall(r.pEvidence) } })),
    }),
    paras(N.paras(rows)),
  ];
}

// La rete del triage, disegnata: ogni nodo con la sua probabilita', scritta
// e come barra; gli indizi osservati con il bordo evidenziato
function networkDiagram(q, evidence) {
  const pal = palette();
  const N = text.network.nodes;
  const { box } = view.NETWORK_VIEW;
  const L = view.NETWORK_LAYOUT;
  const prior = hw.networkPosterior({});
  const drawing = svg(
    'svg',
    { class: 'diagram', viewBox: '0 0 100 64', role: 'img', 'aria-label': text.tryNetwork.diagramLabel },
    svg('defs', null, svg('marker', { id: 'network-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: pal.text }))),
    view.NETWORK_EDGES.map(([a, b]) => svg('line', { x1: L[a].x, y1: L[a].y + box.h / 2, x2: L[b].x, y2: L[b].y - box.h / 2 - 0.6, stroke: pal.text, 'stroke-width': 0.35, 'marker-end': 'url(#network-arrow)' })),
    hw.NETWORK.nodes.map((node) => {
      const { x, y } = L[node];
      const p = q[node];
      const known = evidence[node] !== null && evidence[node] !== undefined;
      const left = x - box.w / 2;
      const top = y - box.h / 2;
      return svg(
        'g',
        null,
        svg('rect', { x: left, y: top, width: box.w, height: box.h, rx: 1.6, fill: pal.background, stroke: known ? pal.highlight : pal.text, 'stroke-width': known ? 0.8 : 0.3 }),
        svg('rect', { x: left + 1.5, y: top + box.h - 3, width: box.w - 3, height: 1.6, rx: 0.5, fill: pal.grid }),
        svg('rect', { x: left + 1.5, y: top + box.h - 3, width: (box.w - 3) * Math.min(1, Math.max(0, p)), height: 1.6, rx: 0.5, fill: pal.highlight }),
        svg('text', { x, y: top + 3.6, 'text-anchor': 'middle', 'font-size': 2.7, fill: pal.text, text: N[node] }),
        svg('text', { x, y: top + 7.6, 'text-anchor': 'middle', 'font-size': 3.2, 'font-weight': 'bold', fill: pal.text, text: text.fmt.pct(p) }),
      );
    }),
  );
  return labelled(drawing, (x, y, width) => {
    const hit = view.diagramHit(L, view.NETWORK_VIEW, width, x, y);
    return hit && { rect: hit.rect, text: text.tips.node(N[hit.key], q[hit.key], prior[hit.key], evidence[hit.key]) };
  });
}

function tryNetworkBox() {
  const T = text.tryNetwork;
  const options = [[null, T.states.unknown], [true, T.states.yes], [false, T.states.no]];
  const out = live(() => {
    const q = hw.networkPosterior(state.evidence);
    return [networkDiagram(q, state.evidence), resultLine(T.result(q))];
  });
  return tryBox(
    'hw7-try-network',
    text.sections.tryNetwork,
    h('p', { text: T.intro }),
    hw.CLUES.map((clue) => choices(text.network.nodes[clue], options, state.evidence[clue], (v) => {
      state.evidence[clue] = v;
      out.update();
    })),
    out.region,
  );
}

function sprtBlock() {
  const W = text.sprt;
  const F = text.fmt;
  const setup = hw.sprtSetup(hw.SPRT_DEFAULT);
  const exact = { legit: hw.sprtExact(setup, hw.SPRT_DEFAULT.p0), attacker: hw.sprtExact(setup, hw.SPRT_DEFAULT.p1) };
  const walks = [
    { ...hw.sprtPath(setup, view.SPRT_EXAMPLES.legit), key: 'legit', color: 0 },
    { ...hw.sprtPath(setup, view.SPRT_EXAMPLES.attacker), key: 'attacker', color: 1 },
  ];
  const row = (who, ex, wald, simulated) => ({ cells: { who: W.who[who], block: F.prob(ex.block), clear: F.prob(ex.clear), exact: F.num(ex.mean, 2), wald: F.num(wald, 2), simulated: simulated ? F.num(simulated.meanSteps, 2) : '-' } });
  return [
    title('hw7-sprt', 1, text.sections.sprt),
    paras(W.intro),
    formulas(W.formulas(setup)),
    h('div', { class: 'charts' }, figure(W.chartTitle, hw.drawLineChart, view.sprtChart(setup, walks, F.decimal), { tip: view.tips.sprt(setup, walks, text.tips), items: view.legends.sprt(text.legends, walks), keep: keep('sprt') })),
    paras(W.paras(setup, exact.legit, exact.attacker)),
    whenComputed((s) => {
      const sim = s ? s.sprt : null;
      return [
        dataTable({
          caption: W.tableTitle,
          columns: [
            { key: 'who', label: W.cols.who },
            { key: 'block', label: W.cols.block, num: true },
            { key: 'clear', label: W.cols.clear, num: true },
            { key: 'exact', label: W.cols.exact, num: true },
            { key: 'wald', label: W.cols.wald, num: true },
            { key: 'simulated', label: W.cols.simulated, num: true },
          ],
          rows: [row('legit', exact.legit, setup.waldLegit, sim && sim.legit), row('attacker', exact.attacker, setup.waldAttacker, sim && sim.attackers)],
        }),
        sim ? h('p', { text: W.simulation(sim) }) : pending(),
      ];
    }),
  ];
}

function trySprtBox() {
  const T = text.trySprt;
  const F = text.fmt;
  const run = state.sprt;
  const setupOf = () => hw.sprtSetup({ ...hw.SPRT_DEFAULT, alpha: hw.SPRT_ALPHAS[run.alpha] });
  const walksOf = (setup) => [{ ...hw.sprtPath(setup, run.attempts), key: 'live', color: 4 }];
  const setup0 = setupOf();
  const walks0 = walksOf(setup0);
  const fig = figure(T.walk, hw.drawLineChart, view.sprtChart(setup0, walks0, F.decimal), { tip: view.tips.sprt(setup0, walks0, text.tips), items: view.legends.sprt(text.legends, walks0), keep: keep('trySprt') });
  const line = resultLine('');
  const buttons = [];
  const update = () => {
    const setup = setupOf();
    const walks = walksOf(setup);
    const path = walks[0];
    refresh(fig, view.sprtChart(setup, walks, F.decimal), view.tips.sprt(setup, walks, text.tips));
    buttons.forEach((b) => {
      b.disabled = Boolean(path.decision);
    });
    line.textContent = T.result(path, path.steps, path.decision);
  };
  const add = (failed) => {
    run.attempts = [...run.attempts, failed];
    update();
  };
  // a simulated address: one more attempt from the stream 'live', failing with p0 or p1
  const simulate = (pFail) => {
    const next = hw.generator(hw.DEFAULT_SEED, 'live', 2000000 + run.draws);
    run.attempts = [...run.attempts, hw.uniform53(next) < pFail];
    run.draws += 1;
    update();
  };
  buttons.push(action(T.fail, () => add(true)), action(T.success, () => add(false)), action(T.legit, () => simulate(hw.SPRT_DEFAULT.p0)), action(T.attacker, () => simulate(hw.SPRT_DEFAULT.p1)));
  update();
  return tryBox(
    'hw7-try-sprt',
    text.sections.trySprt,
    h('p', { text: T.intro }),
    choices(T.alphaLabel, hw.SPRT_ALPHAS.map((a, i) => [i, T.alphaName(a)]), run.alpha, (v) => {
      run.alpha = v;
      update();
    }),
    actions(
      buttons,
      action(text.ui.reset, () => {
        run.attempts = [];
        update();
      }),
    ),
    h('div', { class: 'charts' }, fig),
    line,
  );
}

function rateBlock() {
  const R = text.rate;
  const F = text.fmt;
  const c = view.campaignFacts();
  const items = view.legends.campaign(text.legends);
  return [
    title('hw7-rate', 1, text.sections.rate),
    h('p', { text: R.intro(c) }),
    paras(R.paras(c)),
    h('div', { class: 'charts' }, figure(R.chartTitle, hw.drawLineChart, view.campaignChart(c, F.decimal), { tip: view.tips.campaign(c, text.tips), items, link: view.links.campaign, table: view.LINKED_TABLES.campaign, keep: keep('campaign') })),
    dataTable({
      id: view.LINKED_TABLES.campaign,
      caption: R.tableTitle,
      columns: [
        { key: 'day', label: R.cols.day },
        { key: 'sent', label: R.cols.sent, num: true },
        { key: 'clicks', label: R.cols.clicks, num: true },
        { key: 'uniform', label: R.cols.uniform, num: true, part: part(items, 0) },
        { key: 'informed', label: R.cols.informed, num: true, part: part(items, 1) },
        { key: 'above', label: R.cols.above, num: true, part: part(items, 0) },
      ],
      rows: c.uniform.map((u, i) => ({ cells: { day: F.int(u.day), sent: F.int(u.sent), clicks: F.int(u.clicks), uniform: R.interval(u), informed: R.interval(c.informed[i]), above: F.pct(c.aboveUniform[i]) } })),
    }),
    h('p', { text: R.after }),
  ];
}

function tryBeliefBox() {
  const T = text.tryBelief;
  const F = text.fmt;
  const b = state.belief;
  const chartOf = (curves) => view.densityChart(curves, F.decimal, Math.min(40, Math.max(6, ...curves.posterior.filter(Number.isFinite), ...curves.likelihood.filter(Number.isFinite)) * 1.08));
  const first = view.beliefCurves(b);
  const fig = figure(T.chartTitle, hw.drawLineChart, chartOf(first), { tip: view.tips.density(first, text.tips), items: view.legends.density(text.legends), keep: keep('belief') });
  const line = resultLine('');
  const update = () => {
    const curves = view.beliefCurves(b);
    refresh(fig, chartOf(curves), view.tips.density(curves, text.tips));
    line.textContent = T.result(b, curves.post, curves.post.above(hw.TARGET_RATE));
  };
  const add = (clicked) => {
    b.clicks += clicked ? 1 : 0;
    b.sent += 1;
    update();
  };
  update();
  return tryBox(
    'hw7-try-belief',
    text.sections.tryBelief,
    h('p', { text: T.intro }),
    choices(T.priorLabel, hw.PRIOR_KEYS.map((k) => [k, T.priors[k]]), b.prior, (v) => {
      b.prior = v;
      update();
    }),
    actions(
      action(T.click, () => add(true)),
      action(T.noClick, () => add(false)),
      action(T.ten, () => {
        b.clicks += view.moreEmails(b.draws);
        b.sent += 10;
        b.draws += 1;
        update();
      }),
      action(text.ui.reset, () => {
        b.clicks = 0;
        b.sent = 0;
        update();
      }),
    ),
    h('div', { class: 'charts' }, fig),
    line,
  );
}

// the editor of the prior and its observer: released when the page is drawn again
let priorEditor = null;

function tryPriorBox() {
  const T = text.tryPrior;
  const F = text.fmt;
  const p = state.prior;
  const gridsOf = () => {
    const counts = view.priorData(p.data);
    return { grid: hw.gridPosterior(hw.priorFromHandles(p.heights), counts.clicks, counts.sent), flat: hw.gridPosterior(hw.priorFromHandles(hw.PRIOR_SHAPES.flat), counts.clicks, counts.sent) };
  };
  const first = gridsOf();
  const fig = figure(T.chartTitle, hw.drawLineChart, view.densityChart(first.grid, F.decimal), { tip: view.tips.density(first.grid, text.tips), items: view.legends.density(text.legends), keep: keep('prior') });
  const line = resultLine(T.result(first.grid, first.flat));
  const update = () => {
    const g = gridsOf();
    refresh(fig, view.densityChart(g.grid, F.decimal), view.tips.density(g.grid, text.tips));
    line.textContent = T.result(g.grid, g.flat);
  };
  const shapes = h('div');
  const buildShapes = () => fill(
    shapes,
    choices(T.shapeLabel, hw.PRIOR_SHAPE_KEYS.map((k) => [k, T.shapes[k]]), p.shape, (k) => {
      p.shape = k;
      p.heights = [...hw.PRIOR_SHAPES[k]];
      if (priorEditor) priorEditor.editor.setHeights(p.heights);
      update();
    }),
  );
  if (priorEditor) {
    priorEditor.observer.disconnect();
    priorEditor.editor.destroy();
  }
  const canvas = h('canvas', { class: 'editor', tabindex: 0, role: 'slider', 'aria-label': T.editorLabel, 'aria-valuemin': 0, 'aria-valuemax': 1 });
  const editor = hw.attachPriorEditor(canvas, {
    heights: p.heights,
    onChange: (heights) => {
      p.heights = heights;
      // a prior drawn by hand is none of the ready shapes
      if (p.shape !== null) {
        p.shape = null;
        buildShapes();
      }
      update();
    },
    palette: palette(),
    decimal: F.decimal,
    label: T.handle,
  });
  const observer = new ResizeObserver((entries) => {
    const width = Math.round(entries[entries.length - 1].contentRect.width);
    if (width > 0) editor.redraw(width);
  });
  observer.observe(canvas);
  priorEditor = { editor, observer };
  buildShapes();
  return tryBox(
    'hw7-try-prior',
    text.sections.tryPrior,
    h('p', { text: T.intro }),
    shapes,
    canvas,
    choices(T.dataLabel, view.PRIOR_DATA.map((k) => [k, T.data[k]]), p.data, (k) => {
      p.data = k;
      update();
    }),
    h('div', { class: 'charts' }, fig),
    line,
  );
}

function frequentistBlock() {
  const Q = text.frequentist;
  const F = text.fmt;
  const cov = hw.coverageCurves();
  return [
    title('hw7-frequentist', 1, text.sections.frequentist),
    paras(Q.intro),
    h('div', { class: 'charts' }, figure(Q.chartTitle, hw.drawLineChart, view.coverageChart(cov, F.decimal), { tip: view.tips.coverage(cov, text.tips), items: view.legends.coverage(text.legends), note: Q.chartNote, keep: keep('coverage') })),
    dataTable({
      caption: Q.tableTitle,
      columns: [
        { key: 'method', label: Q.cols.method },
        { key: 'mean', label: Q.cols.mean, num: true },
        { key: 'min', label: Q.cols.min, num: true },
        { key: 'at', label: Q.cols.at, num: true },
        { key: 'width', label: Q.cols.width, num: true },
      ],
      rows: hw.INTERVAL_METHODS.map((m) => ({ cells: { method: text.names.methods[m], mean: F.pct(cov.summary[m].mean), min: F.pct(cov.summary[m].min), at: `p = ${F.pct(cov.summary[m].minAt, 1)}`, width: F.pct(cov.summary[m].width) } })),
    }),
    paras(Q.paras(cov)),
    whenComputed((s) => (s ? h('p', { text: Q.simulation(s.coverage) }) : pending())),
  ];
}

function spamBlock() {
  const M = text.spam;
  const F = text.fmt;
  const { sms } = getModels();
  const c = sms.matrix;
  const items = view.legends.logOdds(text.legends);
  const words = Array.from({ length: Math.max(sms.spamWords.length, sms.hamWords.length) }, (_, i) => i);
  const link = (href, label) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', text: label });
  // the message to score: the example until the reader writes another one
  const field = h('textarea', { id: 'hw7-message', rows: 3, maxlength: 2000, ...PRIVATE_FIELD });
  field.value = state.message === null ? view.SPAM_EXAMPLE : state.message;
  const scoreRegion = h('div');
  const update = () => {
    const score = hw.spamScore(sms.model, field.value, view.spamPrior(state.base, sms));
    const parts = [...score.parts].sort((a, b) => Math.abs(b.weight ?? 0) - Math.abs(a.weight ?? 0));
    const rowClass = (x) => {
      if (!x.known) return 'unknown';
      return x.weight > 0 ? 'towards-spam' : 'towards-ham';
    };
    fill(
      scoreRegion,
      resultLine(M.result(score)),
      parts.length > 0 &&
        dataTable({
          caption: M.partsTitle,
          columns: [{ key: 'token', label: M.partsCols.token }, { key: 'count', label: M.partsCols.count, num: true }, { key: 'weight', label: M.partsCols.weight, num: true }],
          rows: parts.map((x) => ({ class: rowClass(x), cells: { token: x.token, count: F.int(x.count), weight: x.known ? F.num(x.weight, 2) : M.unknown } })),
        }),
    );
  };
  field.addEventListener('input', () => {
    state.message = field.value.slice(0, 2000);
    update();
  });
  update();
  return [
    title('hw7-spam', 1, text.sections.spam),
    paras(M.intro),
    h('p', null, M.source(hw.SMS_DATA), ' ', link(hw.SMS_DATA.url, M.links.dataset), ' · ', link(hw.SMS_DATA.paperUrl, M.links.paper)),
    paras(M.paras(sms)),
    dataTable({
      caption: M.matrixTitle,
      columns: [{ key: 'truth', label: M.matrixCols.truth }, { key: 'spam', label: M.matrixCols.spam, num: true }, { key: 'ham', label: M.matrixCols.ham, num: true }],
      rows: [
        { cells: { truth: M.matrixRows.spam, spam: F.int(c.tp), ham: F.int(c.fn) } },
        { cells: { truth: M.matrixRows.ham, spam: F.int(c.fp), ham: F.int(c.tn) } },
      ],
    }),
    dataTable({
      caption: M.wordsTitle,
      columns: [{ key: 'spam', label: M.wordsCols.spam }, { key: 'spamWeight', label: M.wordsCols.spamWeight, num: true }, { key: 'ham', label: M.wordsCols.ham }, { key: 'hamWeight', label: M.wordsCols.hamWeight, num: true }],
      rows: words.map((i) => ({ cells: { spam: sms.spamWords[i].token, spamWeight: F.num(sms.spamWords[i].weight, 2), ham: sms.hamWords[i].token, hamWeight: F.num(sms.hamWords[i].weight, 2) } })),
    }),
    h('div', { class: 'charts' }, figure(M.chartTitle, hw.drawGroupedBars, view.logOddsChart(sms, F.decimal), { tip: view.tips.logOdds(sms, text.tips), items, link: view.links.logOdds, table: view.LINKED_TABLES.logOdds, keep: keep('logOdds') })),
    dataTable({
      id: view.LINKED_TABLES.logOdds,
      caption: M.tableTitle,
      columns: [{ key: 'bin', label: M.binCols.bin }, { key: 'spam', label: M.binCols.spam, num: true, part: part(items, 0) }, { key: 'ham', label: M.binCols.ham, num: true, part: part(items, 1) }],
      rows: sms.bins.map((b) => ({ cells: { bin: M.bin(b), spam: F.int(b.spam), ham: F.int(b.ham) } })),
    }),
    h('div', { class: 'field' }, h('label', { for: 'hw7-message', text: M.fieldLabel }), field),
    choices(M.baseLabel, view.SPAM_BASES.map((k) => [k, M.bases[k]]), state.base, (k) => {
      state.base = k;
      update();
    }),
    scoreRegion,
    h('p', { text: M.after }),
  ];
}

function kddBlock() {
  const K = text.kdd;
  const F = text.fmt;
  const { kdd } = getModels();
  const link = (href, label) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', text: label });
  const explainRegion = h('div');
  const update = () => {
    const e = kdd.explain(state.kdd.protocol, state.kdd.service, state.kdd.flag);
    fill(
      explainRegion,
      dataTable({
        columns: [
          { key: 'feature', label: K.partsCols.feature },
          { key: 'value', label: K.partsCols.value },
          { key: 'attacks', label: K.partsCols.attacks, num: true },
          { key: 'normals', label: K.partsCols.normals, num: true },
          { key: 'weight', label: K.partsCols.weight, num: true },
        ],
        rows: e.parts.map((x) => ({ cells: { feature: K.features[x.feature], value: x.value, attacks: F.int(x.attacks), normals: F.int(x.normals), weight: F.num(x.weight, 2) } })),
      }),
      resultLine(K.result(e)),
    );
  };
  update();
  return [
    title('hw7-kdd', 1, text.sections.kdd),
    h('p', null, K.intro(hw.KDD_DATA), ' ', link(hw.KDD_DATA.url, 'NSL-KDD'), ' · ', link(hw.KDD_DATA.paperUrl, 'Tavallaee et al., 2009')),
    paras(K.paras(kdd)),
    dataTable({
      caption: K.tableTitle,
      columns: [
        { key: 'model', label: K.cols.model },
        { key: 'accuracy', label: K.cols.accuracy, num: true },
        { key: 'precision', label: K.cols.precision, num: true },
        { key: 'recall', label: K.cols.recall, num: true },
        { key: 'fpr', label: K.cols.fpr, num: true },
      ],
      rows: ['naive', 'joint', 'majority'].map((m) => ({ cells: { model: K.models[m], accuracy: F.pct(kdd[m].accuracy), precision: F.pct(kdd[m].precision), recall: F.pct(kdd[m].recall), fpr: F.pct(kdd[m].fpr) } })),
    }),
    subtitle(K.chooseTitle),
    h(
      'div',
      { class: 'selects' },
      hw.KDD_FEATURES.map((f) => h(
        'label',
        null,
        K.labels[f],
        h(
          'select',
          {
            onchange: (ev) => {
              state.kdd[f] = Number(ev.target.value);
              update();
            },
          },
          hw.KDD_LEVELS[f].map((v, i) => h('option', { value: i, selected: i === state.kdd[f], text: v })),
        ),
      )),
    ),
    explainRegion,
  ];
}

function limitsBlock() {
  const L = text.limits;
  const rows = hw.priorSensitivity();
  return [
    title('hw7-limits', 1, text.sections.limits),
    h('p', { text: L.intro }),
    dataTable({
      caption: L.tableTitle(hw.DECISION_LEVEL),
      columns: [{ key: 'prior', label: L.cols.prior }, { key: 'day1', label: L.cols.day1, num: true }, { key: 'days3', label: L.cols.days3, num: true }, { key: 'days10', label: L.cols.days10, num: true }],
      rows: hw.PRIOR_KEYS.map((k) => ({ cells: { prior: text.tryBelief.priors[k], day1: L.cell(rows[0].priors[k]), days3: L.cell(rows[1].priors[k]), days10: L.cell(rows[2].priors[k]) } })),
    }),
    paras(L.paras(rows)),
  ];
}

function bvmBlock() {
  const B = text.bvm;
  const F = text.fmt;
  const items = view.legends.bvm(text.legends);
  return [
    title('hw7-bvm', 1, text.sections.bvm),
    whenComputed((s) => (!s ? pending() : [
      paras(B.paras(s.bvm)),
      h(
        'div',
        { class: 'charts' },
        figure(B.chartTitle, hw.drawLineChart, view.bvmChart(s.bvm, F.decimal), { tip: view.tips.bvm(s.bvm, text.tips), items, link: view.links.bvm, table: view.LINKED_TABLES.bvm, keep: keep('bvm') }),
        figure(B.chart2Title, hw.drawLineChart, view.bvmDistanceChart(s.bvm, F.decimal), { tip: view.tips.bvmDistance(s.bvm, text.tips), items: view.legends.bvmDistance(text.legends), link: view.links.bvmDistance, keep: keep('bvmDistance') }),
      ),
      dataTable({
        id: view.LINKED_TABLES.bvm,
        caption: B.tableTitle,
        columns: [
          { key: 'n', label: B.cols.n },
          { key: 'clicks', label: B.cols.clicks, num: true },
          { key: 'uniform', label: B.cols.uniform, num: true, part: part(items, 0) },
          { key: 'wrong', label: B.cols.wrong, num: true, part: part(items, 1) },
          { key: 'dUniform', label: B.cols.dUniform, num: true },
          { key: 'dWrong', label: B.cols.dWrong, num: true },
        ],
        rows: s.bvm.map((r) => ({ cells: { n: F.int(r.n), clicks: F.int(r.clicks), uniform: B.pair(r.uniform), wrong: B.pair(r.wrong), dUniform: F.num(r.uniform.distance, 4), dWrong: F.num(r.wrong.distance, 4) } })),
      }),
    ])),
  ];
}

function bayesSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw7-bayes', 0, text.sections.bayes),
    paras(text.bayes.intro),
    conditionalBlock(),
    tryPvalueBox(),
    engineBlock(),
    alarmBlock(),
    tryAlarmBox(),
    networkBlock(),
    tryNetworkBox(),
    sprtBlock(),
    trySprtBox(),
    rateBlock(),
    tryBeliefBox(),
    tryPriorBox(),
    frequentistBlock(),
    spamBlock(),
    kddBlock(),
    limitsBlock(),
    bvmBlock(),
  );
}

// ---------------------------------------------------------------------------
// 3. Le verifiche, 4. il riepilogo dei test, 5. il contesto storico, 6. le conclusioni
// ---------------------------------------------------------------------------

/** A table of the discussion: column headers, then rows of cells, each { text | node, class?, head? } (head: a row header, th). */
function table(className, headers, rows) {
  return h(
    'table',
    { class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x) => h('th', { scope: 'col', text: x })))),
    h(
      'tbody',
      null,
      rows.map((row) => h(
        'tr',
        { class: row.class || null },
        row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { scope: cell.head ? 'row' : null, 'data-label': cell.head ? null : headers[i], class: cell.class || null }, cell.node || cell.text)),
      )),
    ),
  );
}

function checksSection() {
  regions.checks = h('div');
  return h('section', { class: 'section' }, title('hw7-checks', 0, text.sections.checks), regions.checks);
}

function updateVerify() {
  const V = text.checks;
  if (!checkRows) {
    fill(regions.checks, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const done = checkRows.filter((r) => r.ok !== null);
  const ok = done.filter((r) => r.ok).length;
  const resultCell = (r) => {
    if (r.ok === null) return { text: V.pending };
    return { class: r.ok ? 'is-ok' : 'is-bad', node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }) };
  };
  fill(
    regions.checks,
    h('p', { text: V.intro }),
    done.length < checkRows.length
      ? h('p', { class: 'note pending', role: 'status', text: `${V.summary(ok, done.length)}; ${checkRows.length - done.length} ${V.pending}` })
      : check(ok === checkRows.length, V.summary(ok, checkRows.length)),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: V.details(checkRows.length) }),
      hw.CHECK_GROUPS.map((group) => [
        subtitle(V.groups[group]),
        table(
          'discussion',
          [V.cols.check, V.cols.expected, V.cols.actual, V.cols.result],
          checkRows
            .filter((r) => r.group === group)
            .map((r) => ({ cells: [{ head: true, text: r.name }, { node: h('code', { text: r.expected }) }, { node: h('code', { text: r.ok === null ? '-' : r.actual }) }, resultCell(r)] })),
        ),
      ]),
    ),
  );
}

/** The checks: those of the simulations wait for their results, computed with the seed of the page. */
function runChecks() {
  const s = computation.shown;
  try {
    checkRows = hw.verifyAll(s && s.params.seed === hw.DEFAULT_SEED ? s : null);
  } catch (error) {
    checkRows = [{ group: 'generator', name: text.ui.error(message(error)), expected: '', actual: '', ok: false }];
  }
  updateVerify();
}

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section far' }, title('hw7-tests', 0, text.sections.tests), regions.tests);
}

function updateTests() {
  const T = text.tests;
  const { sms, kdd } = getModels();
  const headers = [T.cols.subject, T.cols.hypothesis, T.cols.statistic, T.cols.p, T.cols.verdict, T.cols.expected];
  fill(
    regions.tests,
    h('p', { text: T.intro }),
    computation.error ? h('p', { class: 'note', text: text.ui.error(computation.error) }) : null,
    table(
      'discussion summary summary-tests',
      headers,
      view.testRows(computation.shown, sms, kdd).map((r) => {
        const c = view.testCells(r, text);
        return { class: c.rejected ? 'is-rejected' : null, cells: [{ head: true, text: c.subject }, { text: c.hypothesis }, { text: c.statistic }, { text: c.p }, { text: c.verdict }, { text: c.expected }] };
      }),
    ),
  );
}

function historySection() {
  const H = text.history;
  return h(
    'section',
    { class: 'section far' },
    title('hw7-history', 0, text.sections.history),
    h('p', { text: H.intro }),
    h('ol', { class: 'timeline' }, H.items.map((e) => h('li', { class: 'is-context' }, h('span', { class: 'year', text: e.year }), h('div', null, h('strong', { text: e.title }), h('p', { text: e.text }))))),
    h('p', { text: H.after }),
  );
}

function conclusionSection() {
  const { sms, kdd } = getModels();
  const c = view.campaignFacts();
  const pv = hw.pvalueFacts();
  const facts = {
    alarm: hw.alarmFacts(hw.ALARM_DEFAULT).posterior,
    rate: c.uniform[c.uniform.length - 1],
    sms: sms.matrix.accuracy,
    kdd: kdd.naive.accuracy,
    half: hw.sampleSizeFor(0.005),
    burstFactor: hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.5).factor,
    pValue: pv.pValue,
    posteriorH0: pv.posteriorH0,
  };
  return h('section', { class: 'section far' }, title('hw7-conclusion', 0, text.sections.conclusion), paras(text.conclusion.paras(facts)));
}

// ---------------------------------------------------------------------------
// Le simulazioni lunghe, a fette di pochi millisecondi
// ---------------------------------------------------------------------------

function startComputation() {
  hw.runStepsAsync(() => hw.exploreSteps(view.DEFAULT_PARAMS)).then(
    (value) => {
      computation.shown = value;
      computation.error = null;
      updateComputed();
      runChecks();
      updateTests();
    },
    (error) => {
      computation.error = message(error);
      updateComputed();
      updateVerify();
      updateTests();
    },
  );
}

// ---------------------------------------------------------------------------
// Indice, lingua e avvio
// ---------------------------------------------------------------------------

const dialog = document.getElementById('index-dialog');
const FOLLOW_MS = 2500;

// Porta il titolo in cima e lo segue per un paio di secondi: se nel
// frattempo qualcosa sopra cambia altezza (un grafico che arriva), lo
// scorrimento riparte verso la nuova posizione. Se l'utente scorre da se',
// si smette subito di inseguire.
function scrollToSection(target) {
  const behavior = reducedMotion() ? 'auto' : 'smooth';
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
  window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  document.getElementById('page-title').focus({ preventScroll: true });
}

const toTopButton = () => h('p', { class: 'to-top' }, h('button', { type: 'button', class: 'btn alt', text: text.ui.backToTop, onclick: backToTop }));

function renderChrome() {
  const t = text;
  document.documentElement.lang = state.lang;
  document.title = 'Homework #7 - Statistics';
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
  text = HW7_TEXTS[state.lang];
  renderChrome();
  waiting = [];
  const app = document.getElementById('app');
  fill(app, assignmentSection(), convergenceSection(), bayesSection(), checksSection(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateVerify();
  updateTests();
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
  // i colori dei grafici, dei disegni e delle legende seguono il tema del sistema
  darkQuery.addEventListener('change', render);
  render();
  // le verifiche e le simulazioni partono dopo il primo disegno della pagina
  setTimeout(() => {
    runChecks();
    startComputation();
  }, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
