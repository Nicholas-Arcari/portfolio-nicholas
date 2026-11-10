// src/pages/statistics/hw4/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework4.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Da file:// i worker non partono: la simulazione gira qui, a fette di pochi
// millisecondi, e la pagina resta reattiva mentre i numeri arrivano; intanto
// la Part 1 e l'animazione, che non ne hanno bisogno, funzionano gia'.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
import * as hw from '../homework4.js';
import * as view from '../view.js';
import { HW4_TEXTS, originalAssignment } from '../texts.js';

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
  data: { text: view.DEFAULT_DATA_TEXT, values: [...hw.DEFAULT_DATA] },
  steps: { g: null, playing: false },
  spread: { g: null, playing: false, mode: 'fixed' },
  inference: { g: null },
  anim: { quantity: 'mean', speed: 1 },
  // gli esempi interattivi
  drag: { values: null },
  digits: { power: 8, dataset: 'classic' },
  bessel: { n: 5, run: null, playing: false },
  intervals: { g: 3, level: 0.95, param: 'mean', dist: null, batch: 0, misses: [] },
};
let text = HW4_TEXTS[state.lang];
const regions = {};
const controls = { fields: {} };
const timers = { compute: null, steps: null, spread: null, bessel: null };

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
const charts = new Map(); // canvas -> { draw, data, width, detach, link, tip, hidden }

// what a chart draws: its data, without the parts hidden from the legend
const shownData = (chart) => (chart.hidden.length ? { ...chart.data, hidden: chart.hidden } : chart.data);

const resizer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const canvas = entry.target;
    const chart = charts.get(canvas);
    const width = Math.round(entry.contentRect.width);
    if (!chart || width <= 0 || width === chart.width) continue;
    chart.width = width;
    canvas.style.height = `${hw.chartHeight(chart.draw, shownData(chart), width)}px`;
    view.scheduleFrameJob(() => {
      if (charts.get(canvas) === chart && chart.width === width) chart.draw(canvas, { ...shownData(chart), width }, palette());
    });
  }
});

/** Ties the label under the pointer to a chart: it describes what is on screen, and leaves out the hidden parts. */
function attachTip(canvas, chart) {
  if (chart.detach) chart.detach();
  const tip = chart.tip;
  chart.detach = tip ? hw.attachChartTooltip(canvas, { draw: chart.draw, data: shownData(chart), describe: (hit) => tip(hit, chart.hidden), link: chart.link }) : null;
}

/** Draws a chart again at its width, with its data and hidden parts. */
function redraw(canvas, chart) {
  if (chart.width > 0) {
    canvas.style.height = `${hw.chartHeight(chart.draw, shownData(chart), chart.width)}px`;
    chart.draw(canvas, { ...shownData(chart), width: chart.width }, palette());
  }
}

// what the reader hid in the legends: the charts of a region are built again at every step or result
const kept = { steps: new Set(), stability: new Set(), scores: new Set(), trajectories: new Set(), means: new Set(), variances: new Set(), histograms: new Set(), spread: new Set(), coverage: new Set(), scatter: new Set(), drag: new Set() };

/** The parts of the drawing covered by the hidden items of a legend. */
const partsOf = (items, hidden) => items.flatMap((item, i) => (hidden.has(i) ? item.parts || [] : []));

/**
 * The legend of a chart, or of a group of charts: { label, color? |
 * paletteKey?, dashed?, box?, parts }. Every item is a button: pressed (as
 * the page opens) its parts are on screen, released they are hidden;
 * onChange(parts) receives the hidden parts after every press. `hidden`,
 * the set of the hidden items, outlives the legend when its chart is built
 * again.
 */
function legend(items, onChange = null, hidden = new Set()) {
  const pal = palette();
  return h(
    'ul',
    { class: 'series-legend' },
    items.map((item, i) => {
      const color = item.paletteKey ? pal[item.paletteKey] : pal.series[(item.color ?? i) % pal.series.length];
      let swatch = null;
      if (item.box) swatch = 'is-box';
      else if (item.dashed) swatch = 'is-dashed';
      const button = h(
        'button',
        {
          type: 'button',
          'aria-pressed': String(!hidden.has(i)),
          class: hidden.has(i) ? 'is-off' : null,
          onclick: () => {
            if (hidden.has(i)) hidden.delete(i);
            else hidden.add(i);
            button.setAttribute('aria-pressed', String(!hidden.has(i)));
            button.classList.toggle('is-off', hidden.has(i));
            if (onChange) onChange(partsOf(items, hidden));
          },
        },
        h('span', { class: swatch, 'aria-hidden': 'true', style: { borderColor: color, backgroundColor: item.box ? color : 'transparent' } }),
        item.label,
      );
      return h('li', null, button);
    }),
  );
}

// the hidden parts of several charts that share one table, each with its own prefix ('means/series:1')
const prefixed = (groups) => groups.flatMap(([name, items, set]) => partsOf(items, set).map((part) => `${name}/${part}`));

/** Hides the cells and rows of a table that belong to hidden parts (data-part), and shows the others. */
function hideParts(tableEl, parts) {
  for (const el of tableEl.querySelectorAll('[data-part]')) el.hidden = parts.includes(el.dataset.part);
}

/** Hides parts of a chart (the legend of a group of charts calls it on each of them). */
function setHidden(fig, parts) {
  const canvas = fig.querySelector('canvas.chart');
  const chart = charts.get(canvas);
  if (!chart) return;
  chart.hidden = parts;
  attachTip(canvas, chart);
  redraw(canvas, chart);
}

/**
 * A chart with its legend (`items`) and its label under the pointer.
 * onHide(parts) runs when the reader hides or shows a part, for the table
 * tied to the chart, and `keep` (a set) remembers the hidden items when
 * the chart is built again; the charts of a group share one legend outside them
 * (groupLegend) and have no `items`.
 */
function figure(caption, draw, data, { wide = false, tip = null, items = null, note = null, link = null, onHide = null, keep = null } = {}) {
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': caption });
  const kept = keep || new Set();
  const chart = { draw, data, width: -1, detach: null, link, tip, hidden: items ? partsOf(items, kept) : [] };
  const fig = h(
    'figure',
    { class: wide ? 'figure wide' : 'figure' },
    canvas,
    items &&
      legend(
        items,
        (parts) => {
          setHidden(fig, parts);
          if (onHide) onHide(parts);
        },
        kept,
      ),
    note && h('p', { class: 'figure-note', text: note }),
    h('figcaption', { text: caption }),
  );
  attachTip(canvas, chart);
  charts.set(canvas, chart);
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

/** A table: column headers, then rows of cells, each { text | node, class?, head? } (head: a row header, th); `id` for a table tied to a chart (view.LINKED_TABLES); `columns` gives the part of a chart each column belongs to, and a row can have its own `part`: hideParts() hides them with their curve. */
function table(className, headers, rows, id = null, columns = []) {
  return h(
    'table',
    { id, class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x, i) => h('th', { text: x, 'data-part': columns[i] || null })))),
    h(
      'tbody',
      null,
      rows.map((row) => h(
        'tr',
        { class: row.class || null, 'data-part': row.part || null },
        row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { 'data-label': cell.head ? null : headers[i], class: cell.class || null, 'data-part': columns[i] || null }, cell.node || cell.text)),
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

/** A choice among a few values (law, quantity, axis): the pressed button is the active one. */
function choices(label, options, value, onChange) {
  const buttons = options.map(([key, name]) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(key === value), text: name, onclick: () => select(key) }));
  function select(key) {
    options.forEach(([k], i) => buttons[i].setAttribute('aria-pressed', String(k === key)));
    onChange(key);
  }
  return h('div', { class: 'choices', role: 'group', 'aria-label': label }, h('span', { class: 'choices-label', text: label }), buttons);
}

/** A slider on indices (steps, checkpoints); set() moves it when the data, the results or the language change. */
function slider(id, onChange) {
  const label = h('label', { for: id });
  const input = h('input', { id, type: 'range', min: 0, max: 0, step: 1, value: 0, oninput: (e) => onChange(Number(e.target.value)) });
  return {
    el: h('div', { class: 'slider' }, label, input),
    set(max, value, labelText, enabled = true) {
      input.max = String(max);
      input.value = String(value);
      input.disabled = !enabled;
      label.textContent = labelText;
      input.setAttribute('aria-valuetext', labelText);
    },
  };
}

// ---------------------------------------------------------------------------
// I due cursori che si possono far scorrere: i passi della sezione 1.4 e gli n della 2.6
// ---------------------------------------------------------------------------

let stepRowsCache = { values: null, rows: [] };
function stepRows() {
  if (stepRowsCache.values !== state.data.values) stepRowsCache = { values: state.data.values, rows: hw.welfordSteps(state.data.values) };
  return stepRowsCache.rows;
}

const lastIndex = () => (computation.shown ? computation.shown.points.length - 1 : 0);

const players = {
  steps: { last: () => stepRows().length - 1, fallback: () => stepRows().length - 1, delay: 1000, update: () => updateSteps() },
  spread: { last: () => lastIndex(), fallback: () => 0, delay: 1100, update: () => updateSpread() },
};

/** The index shown by a player: the chosen one, or its default, within its range. */
function playerIndex(name) {
  const P = players[name];
  const g = state[name].g === null ? P.fallback() : state[name].g;
  return Math.max(0, Math.min(g, P.last()));
}

function stopPlayer(name) {
  state[name].playing = false;
  clearTimeout(timers[name]);
}

function choose(name, g) {
  stopPlayer(name);
  state[name].g = g;
  players[name].update();
}

function togglePlayer(name) {
  const P = players[name];
  if (state[name].playing) {
    stopPlayer(name);
    P.update();
    return;
  }
  if (playerIndex(name) >= P.last()) state[name].g = 0;
  state[name].playing = true;
  P.update();
  const tick = () => {
    timers[name] = setTimeout(() => {
      if (!state[name].playing) return;
      const end = P.last();
      const g = Math.min(playerIndex(name) + 1, end);
      state[name].g = g;
      if (g >= end) state[name].playing = false;
      P.update();
      if (state[name].playing) tick();
    }, P.delay);
  };
  tick();
}

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw4-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      h('p', { class: 'note', text: text.assignment.originalNote }),
      h('blockquote', { lang: 'en' }, originalAssignment().map((block) => (block.type === 'h' ? h('p', null, h('strong', { text: block.text })) : h('p', { text: block.text })))),
    ),
  );
}

// ---------------------------------------------------------------------------
// Part 1: le formule, i passi, la stabilita' e le verifiche
// ---------------------------------------------------------------------------

const derivation = (block, content) => [paras(block.intro), formulas(content, block.formulasTitle), paras(block.after)];

function part1Section() {
  const S = text.sections;
  regions.verify = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw4-part1', 0, S.part1),
    paras(text.part1.intro),
    title('hw4-knuth', 1, S.knuth),
    derivation(text.knuth, text.formulas.knuth),
    title('hw4-ss', 1, S.ss),
    derivation(text.ss, text.formulas.ss),
    tryDragBlock(),
    title('hw4-variance', 1, S.variance),
    derivation(text.variance, text.formulas.variance),
    title('hw4-steps', 1, S.steps),
    stepsBlock(),
    title('hw4-stability', 1, S.stability),
    stabilityBlock(),
    tryDigitsBlock(),
    title('hw4-checks', 1, S.checks),
    regions.verify,
  );
}

// --- 1.4 Passo per passo -------------------------------------------------------------

function stepsBlock() {
  const S = text.steps;
  const input = h('input', {
    id: 'hw4-data',
    type: 'text',
    inputmode: 'decimal',
    ...PRIVATE_FIELD,
    maxlength: view.DATA_LENGTH,
    'aria-describedby': 'hw4-data-help',
    oninput: (e) => changeData(e.target.value.slice(0, view.DATA_LENGTH)),
  });
  input.value = state.data.text;
  controls.data = {
    input,
    help: h('p', { id: 'hw4-data-help', class: 'note', text: S.dataHint }),
    restore: h('button', {
      type: 'button',
      class: 'btn alt',
      text: S.restore,
      onclick: () => {
        input.value = view.DEFAULT_DATA_TEXT;
        changeData(view.DEFAULT_DATA_TEXT);
      },
    }),
    stale: h('p', { class: 'stale', role: 'status', text: S.stale }),
  };
  controls.stepsSlider = slider('hw4-step', (g) => choose('steps', g));
  controls.stepsPlay = h('button', { type: 'button', class: 'btn', text: S.play, onclick: () => togglePlayer('steps') });
  const stepButton = (label, target) => h('button', { type: 'button', class: 'btn alt', text: label, onclick: () => choose('steps', target()) });
  regions.steps = h('div');
  return [
    paras(S.intro),
    h('div', { class: 'param data' }, h('label', { for: 'hw4-data', text: S.dataLabel }), h('span', { class: 'param-row' }, input, controls.data.restore), controls.data.help),
    controls.data.stale,
    h(
      'div',
      { class: 'slider-row' },
      controls.stepsSlider.el,
      h(
        'span',
        { class: 'buttons' },
        controls.stepsPlay,
        stepButton(S.step, () => {
          const g = playerIndex('steps');
          return g >= players.steps.last() ? 0 : g + 1;
        }),
        stepButton(S.reset, () => 0),
        stepButton(S.end, () => players.steps.last()),
      ),
    ),
    regions.steps,
    paras(S.after),
  ];
}

function changeData(value) {
  state.data.text = value;
  const r = hw.parseData(value);
  if (r.ok) {
    state.data.values = r.value;
    stopPlayer('steps');
    state.steps.g = null;
  }
  updateSteps();
}

/** The chart, the line with the numbers, the table and the final check of section 1.4. */
function updateSteps() {
  const S = text.steps;
  const F = text.fmt;
  const read = hw.parseData(state.data.text);
  const error = read.ok ? null : S.errors[read.error](read.text);
  const D = controls.data;
  D.input.setAttribute('aria-invalid', String(Boolean(error)));
  D.help.className = error ? 'field-error' : 'note';
  D.help.textContent = error || S.dataHint;
  if (error) D.help.setAttribute('role', 'alert');
  else D.help.removeAttribute('role');
  D.restore.hidden = state.data.text === view.DEFAULT_DATA_TEXT;
  D.stale.hidden = !error;

  const rows = stepRows();
  const last = rows.length - 1;
  const g = playerIndex('steps');
  const label = S.chart(g + 1, rows.length);
  controls.stepsSlider.set(last, g, label);
  let play = S.play;
  if (state.steps.playing) play = S.pause;
  else if (g > 0 && g < last) play = S.resume;
  controls.stepsPlay.textContent = play;
  const c = view.stepsCheck(state.data.values);
  const cell = (v) => ({ text: F.sig(v) });
  // i dati, la media, la fascia, delta e x - M sono anche colonne della tabella
  const items = view.legends.steps(text);
  const steps = table(
    'compact steps',
    ['k', 'x', 'delta', 'mean', 'after', 'increment', 'ss', 'variance'].map((key) => S.cols[key]),
    rows.map((r, i) => ({
      class: i === g ? 'is-current' : i > g ? 'is-future' : null,
      cells: [{ text: String(r.k), head: true }, cell(r.x), cell(r.delta), cell(r.mean), cell(r.after), cell(r.increment), cell(r.ss), { text: r.k > 1 ? F.sig(r.variance) : '-' }],
    })),
    view.LINKED_TABLES.steps,
    [null, 'points', 'delta', 'mean', 'after', null, null, 'band'],
  );
  hideParts(steps, partsOf(items, kept.steps));
  fill(
    regions.steps,
    figure(label, hw.drawWelfordChart, view.stepsChart(rows, g + 1, F.decimal), {
      wide: true,
      tip: view.tips.steps(rows, text.tips),
      link: view.links.steps,
      items,
      keep: kept.steps,
      onHide: (parts) => hideParts(steps, parts),
    }),
    h('p', { class: 'caption line', 'aria-live': state.steps.playing ? 'off' : 'polite', text: S.line(rows[g], rows[g - 1]) }),
    subtitle(S.tableTitle),
    h('div', { class: rows.length > 16 ? 'scroll' : null }, steps),
    check(c.welfordError < 1e-9, S.check(c)),
  );
}

// --- 1.5 La stabilita' numerica --------------------------------------------------------

let stability = null;

function stabilityBlock() {
  const S = text.stability;
  const F = text.fmt;
  if (!stability) stability = { rows: hw.cancellationRows(), curve: hw.stabilityCurve() };
  const offset = (c) => (c === 0 ? '0' : F.pow(Math.round(Math.log10(c))));
  // le tre formule sono le tre curve del grafico e le tre colonne della tabella
  const cancellation = table(
    'compact cancellation',
    [S.cols.offset, S.cols.naive, S.cols.twoPass, S.cols.welford],
    stability.rows.map((r) => ({ cells: [{ text: offset(r.offset), head: true }, { text: F.sig(r.naive, 17), class: Math.abs(r.naive - 30) > 1e-9 ? 'over' : null }, { text: F.sig(r.twoPass, 17) }, { text: F.sig(r.welford, 17) }] })),
    view.LINKED_TABLES.cancellation,
    [null, 'series:0', 'series:1', 'series:2'],
  );
  hideParts(cancellation, partsOf(view.legends.stability(text), kept.stability));
  return [
    paras(S.intro),
    subtitle(S.tableTitle),
    h('div', { class: 'scroll' }, cancellation),
    h(
      'div',
      { class: 'charts' },
      figure(S.chartTitle(F.int(stability.curve.size)), hw.drawLineChart, view.stabilityChart(stability.curve, F.decimal), {
        wide: true,
        tip: view.tips.stability(stability.curve, text.tips),
        link: view.links.cancellation,
        items: view.legends.stability(text),
        keep: kept.stability,
        onHide: (parts) => hideParts(cancellation, parts),
      }),
    ),
    paras(S.facts(view.stabilityFacts(stability.curve))),
    paras(S.after),
  ];
}

// --- 1.6 Verifiche -----------------------------------------------------------------

let checkRows = null;

function updateVerify() {
  const V = text.checks;
  if (!checkRows) {
    fill(regions.verify, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const ok = checkRows.filter((r) => r.ok).length;
  const groups = ['welford', 'generator', 'functions'].map((group) => ({ group, rows: checkRows.filter((r) => r.group === group) }));
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

// ---------------------------------------------------------------------------
// Part 2: i punteggi, i campi, l'animazione e i risultati
// ---------------------------------------------------------------------------

function part2Section() {
  const S = text.sections;
  const I = text.input;
  regions.scores = h('div');
  regions.status = h('div');
  regions.averages = h('div');
  regions.comparison = h('div');
  regions.spread = h('div');
  regions.inference = h('div');
  controls.spreadSlider = slider('hw4-spread-n', (g) => choose('spread', g));
  controls.spreadPlay = h('button', { type: 'button', class: 'btn alt', text: text.spread.play, onclick: () => togglePlayer('spread') });
  controls.inferenceSlider = slider('hw4-scatter-n', (g) => {
    state.inference.g = g;
    updateInference();
  });
  return h(
    'section',
    { class: 'section' },
    title('hw4-part2', 0, S.part2),
    paras(text.part2.intro),
    title('hw4-scores', 1, S.scores),
    regions.scores,
    title('hw4-input', 1, S.input),
    h('p', { text: I.intro }),
    inputsBlock(),
    regions.status,
    title('hw4-trajectories', 1, S.trajectories),
    trajectoriesBlock(),
    title('hw4-averages', 1, S.averages),
    regions.averages,
    title('hw4-comparison', 1, S.comparison),
    regions.comparison,
    tryBesselBlock(),
    title('hw4-spread', 1, S.spread),
    paras(text.spread.intro),
    formulas(text.formulas.spread, text.spread.formulasTitle),
    paras(text.spread.afterFormulas),
    h(
      'div',
      { class: 'controls-block' },
      choices(text.spread.axisLabel, view.AXIS_MODES.map((m) => [m, text.spread.axisNames[m]]), state.spread.mode, (mode) => {
        state.spread.mode = mode;
        updateSpread();
      }),
      h('div', { class: 'slider-row' }, controls.spreadSlider.el, controls.spreadPlay),
    ),
    regions.spread,
    title('hw4-inference', 1, S.inference),
    paras(text.inference.intro),
    h('ul', { class: 'list' }, text.inference.list.map((item) => h('li', { text: item }))),
    paras(text.inference.afterList),
    h('div', { class: 'slider-row' }, controls.inferenceSlider.el),
    regions.inference,
    tryIntervalsBlock(),
  );
}

// --- 2.1 La distribuzione dei punteggi ------------------------------------------------------

function updateScores() {
  const S = text.scores;
  const F = text.fmt;
  const params = state.params;
  const law = hw.scoreLaw(params.dist, params.p);
  const s = computation.shown;
  const data = view.scoresChart(law, s, F.decimal);
  const simulated = Boolean(data.expected);
  const items = view.legends.scores(text, law.discrete, simulated);
  // la legenda cambia voci quando arriva la simulazione: si riparte con tutto visibile
  if (kept.scoresSimulated !== simulated) {
    kept.scores = new Set();
    kept.scoresSimulated = simulated;
  }
  fill(
    regions.scores,
    paras(S.intro(params.p)),
    choices(S.chooseLabel, hw.DISTRIBUTIONS.map((d) => [d, text.distNames[d]]), params.dist, setDist),
    subtitle(S.tableTitle(params.p)),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact laws',
        [S.cols.law, S.cols.values, S.cols.mu, S.cols.variance, S.cols.skewness, S.cols.kurtosis, S.cols.mu4],
        view.lawRows(params.p).map((L) => ({
          class: L.dist === params.dist ? 'is-current' : null,
          cells: [{ text: text.distNames[L.dist], head: true }, { text: S.values[L.dist] }, { text: F.num(L.mu, 4) }, { text: F.num(L.variance, 4) }, { text: F.num(L.skewness, 4) }, { text: F.num(L.kurtosis, 4) }, { text: F.num(L.mu4, 3) }],
        })),
      ),
    ),
    paras(S.after),
    h('div', { class: 'charts' }, figure(S.chartTitle(text.distNames[params.dist], simulated), hw.drawHistogram, data, { wide: true, tip: view.tips.scores(data, law.discrete, text.tips), items, keep: kept.scores })),
    s && simulated && tests('sim', s),
  );
}

function setDist(dist) {
  const next = view.applyInputs(view.readInputs(state.fields), state.params, dist);
  if (next === state.params) return;
  state.params = next;
  updateScores();
  scheduleComputation();
  updateStatus();
}

// --- 2.2 I campi ----------------------------------------------------------------

const FIELDS = [
  ['p', 'pText', 'hw4-p', 'decimal'],
  ['n', 'nText', 'hw4-n', 'numeric'],
  ['m', 'mText', 'hw4-m', 'numeric'],
  ['seed', 'seedText', 'hw4-seed', 'numeric'],
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
  const next = view.applyInputs(view.readInputs(state.fields), state.params, view.DEFAULT_PARAMS.dist);
  if (next !== state.params) {
    state.params = next;
    updateScores();
    scheduleComputation();
  }
  updateInputs();
}

function fieldError(r, key) {
  const I = text.input;
  if (r.ok) return null;
  if (r.error === 'range') return I.errors.range(...I.limits[key]);
  return I.errors[r.error](r.text);
}

/** A new simulation when the parameters settle. */
function scheduleComputation() {
  clearTimeout(timers.compute);
  timers.compute = setTimeout(() => {
    state.target = { ...state.params };
    startComputation();
    createAnimation();
    resetBessel();
    resetIntervals();
  }, 400);
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
    updateScores();
    scheduleComputation();
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

// --- 2.3 Le traiettorie -----------------------------------------------------------

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
    choices(T.quantityLabel, hw.QUANTITIES.map((q) => [q, text.quantityNames[q]]), state.anim.quantity, (quantity) => {
      state.anim.quantity = quantity;
      if (animation) animation.setQuantity(quantity);
    }),
    h('div', { class: 'controls' }, h('label', null, T.speedLabel, speed), h('span', { class: 'buttons' }, controls.play, button(T.step, 'step'), button(T.reset, 'reset'), button(T.end, 'toEnd'))),
    // posizionato: ci stanno dentro l'evidenziazione e l'etichetta sotto il puntatore
    h('div', { class: 'figure' }, controls.canvas),
    // la legenda sotto l'animazione: le parti nascoste si ridisegnano dal primo punteggio
    legend(view.legends.trajectories(text), (parts) => animation && animation.setHidden(parts), kept.trajectories),
    controls.caption,
    paras(T.after),
  ];
}

function updateCaption(st) {
  const T = text.trajectories;
  controls.caption.textContent = T.caption(st, text.quantityNames[st.quantity]);
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

/** The animation of the hackers of the last simulation started. */
function createAnimation() {
  if (animation) animation.destroy();
  animation = null;
  const canvas = controls.canvas;
  if (!canvas || !canvas.isConnected) return;
  const options = view.animationOptions(state.target);
  fill(regions.trajectoriesIntro, paras(text.trajectories.intro(options.shown, options.sample)));
  animation = hw.createScoreAnimation(canvas, {
    ...options,
    quantity: state.anim.quantity,
    speed: view.ANIMATION.speeds[state.anim.speed],
    palette: palette(),
    decimal: text.fmt.decimal,
    describe: view.tips.trajectory(text),
    hidden: partsOf(view.legends.trajectories(text), kept.trajectories),
    onUpdate: updateCaption,
  });
  canvasWidth = canvas.clientWidth;
  canvasResizer.disconnect();
  canvasResizer.observe(canvas);
}

// --- 2.4 e 2.5 Le medie e il confronto -------------------------------------------------------

const zCell = (z) => ({ text: text.fmt.num(z, 2), class: Math.abs(z) > 1.959963984540054 ? 'over' : null });

function updateAverages() {
  const A = text.averages;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.averages, paras(A.intro(null)), pending());
    return;
  }
  // i due grafici hanno una tabella sola: la media delle M_n, la media delle s_n² e le due versioni con n
  const meansItems = view.legends.means(text);
  const variancesItems = view.legends.variances(text);
  const averages = table(
    'compact averages',
    ['n', 'mean', 'meanZ', 'variance', 'varianceZ', 'biased', 'biasedTheory'].map((k) => A.cols[k]),
    view.averageRows(s).map((r) => ({ cells: [{ text: F.int(r.n), head: true }, { text: F.num(r.mean, 4) }, zCell(r.meanZ), { text: F.num(r.variance, 4) }, zCell(r.varianceZ), { text: F.num(r.biased, 4) }, { text: F.num(r.biasedTheory, 4) }] })),
    view.LINKED_TABLES.averages,
    [null, 'means/series:1', 'means/series:1', 'variances/series:1', 'variances/series:1', 'variances/series:3', 'variances/series:2'],
  );
  const hideAverages = () =>
    hideParts(
      averages,
      prefixed([
        ['means', meansItems, kept.means],
        ['variances', variancesItems, kept.variances],
      ]),
    );
  hideAverages();
  fill(
    regions.averages,
    paras(A.intro(s)),
    subtitle(A.tableTitle(s.m)),
    h('div', { class: 'scroll' }, averages),
    h(
      'div',
      { class: 'charts' },
      figure(A.meansChart(s.m), hw.drawLineChart, view.meansChart(s, F.decimal), { tip: view.tips.means(s, text.tips), link: view.links.averages, items: meansItems, keep: kept.means, onHide: hideAverages }),
      figure(A.variancesChart(s.m), hw.drawLineChart, view.variancesChart(s, F.decimal), {
        tip: view.tips.variances(s, text.tips),
        link: view.links.averages,
        items: variancesItems,
        keep: kept.variances,
        onHide: hideAverages,
      }),
    ),
    paras(A.facts(s)),
    tests('averages', s),
  );
}

function updateComparison() {
  const C = text.comparison.paras(computation.shown);
  fill(regions.comparison, paras(C.before), formulas(text.formulas.unbiased, text.comparison.formulasTitle), paras(C.after));
}

// --- 2.6 La variabilita' al crescere di n ---------------------------------------------------------

function updateSpread() {
  const S = text.spread;
  const F = text.fmt;
  const s = computation.shown;
  controls.spreadPlay.textContent = state.spread.playing ? S.pause : S.play;
  if (!s) {
    controls.spreadSlider.set(0, 0, S.nLabel(0), false);
    fill(regions.spread, pending());
    return;
  }
  const g = playerIndex('spread');
  const pt = s.points[g];
  controls.spreadSlider.set(lastIndex(), g, S.nLabel(pt.n));
  const mean = view.spreadHistogram(s, g, 'mean', state.spread.mode, F.decimal);
  const variance = view.spreadHistogram(s, g, 'variance', state.spread.mode, F.decimal);
  // una legenda per i due istogrammi; le cinque curve del grafico sono cinque colonne della tabella
  const histItems = view.legends.histograms(text);
  const histMean = figure(S.histMean(pt.n, s.m), hw.drawHistogram, mean, { tip: view.tips.histogram(mean, text.tips), note: S.histNote(pt.meanStats, pt.theory, 'mean') });
  const histVariance = figure(S.histVariance(pt.n, s.m), hw.drawHistogram, variance, { tip: view.tips.histogram(variance, text.tips), note: S.histNote(pt.varStats, pt.theory, 'variance') });
  for (const fig of [histMean, histVariance]) setHidden(fig, partsOf(histItems, kept.histograms));
  const items = view.legends.spread(text);
  const spread = table(
    'compact spread',
    ['n', 'varMean', 'varMeanTheory', 'varVariance', 'varVarianceTheory', 'normalVariance', 'skewMean'].map((k) => S.cols[k]),
    view.spreadRows(s).map((r) => ({ cells: [{ text: F.int(r.n), head: true }, { text: F.sig(r.varMean, 4) }, { text: F.sig(r.varMeanTheory, 4) }, { text: F.sig(r.varVariance, 4) }, { text: F.sig(r.varVarianceTheory, 4) }, { text: F.sig(r.normalVariance, 4) }, { text: `${F.num(r.skewMean, 3)} (${F.num(r.skewMeanTheory, 3)})` }] })),
    view.LINKED_TABLES.spread,
    [null, 'series:0', 'series:1', 'series:2', 'series:3', 'series:4', null],
  );
  hideParts(spread, partsOf(items, kept.spread));
  fill(
    regions.spread,
    h('div', { class: 'charts' }, histMean, histVariance),
    legend(
      histItems,
      (parts) => {
        for (const fig of [histMean, histVariance]) setHidden(fig, parts);
      },
      kept.histograms,
    ),
    h(
      'div',
      { class: 'charts' },
      figure(S.chartTitle, hw.drawLineChart, view.spreadChart(s, F.decimal), {
        wide: true,
        tip: view.tips.spread(s, text.tips),
        link: view.links.spread,
        items,
        keep: kept.spread,
        onHide: (parts) => hideParts(spread, parts),
      }),
    ),
    subtitle(S.tableTitle),
    h('div', { class: 'scroll' }, spread),
    paras(S.facts(s)),
    tests('spread', s),
  );
}

// --- 2.7 Statistica inferenziale ---------------------------------------------------------------------

function updateInference() {
  const I = text.inference;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    controls.inferenceSlider.set(0, 0, I.nLabel(0), false);
    fill(regions.inference, pending());
    return;
  }
  const last = lastIndex();
  const g = Math.min(state.inference.g === null ? last : state.inference.g, last);
  const pt = s.points[g];
  controls.inferenceSlider.set(last, g, I.nLabel(pt.n));
  const scatter = view.scatterData(s, g, F.decimal);
  // la copertura dei due intervalli e la correlazione degli hacker sono colonne della tabella
  const coverageItems = view.legends.coverage(text);
  const scatterItems = view.legends.scatter(text);
  const inference = table(
    'compact inference',
    ['n', 't', 'tQuantile', 'chi2', 'corr', 'corrTheory'].map((k) => I.cols[k]),
    view.inferenceRows(s).map((r) => ({ cells: [{ text: F.int(r.n), head: true }, { text: F.pct(r.t, 2) }, { text: F.num(r.tQuantile, 3) }, { text: F.pct(r.chi2, 2) }, { text: F.num(r.corr, 3) }, { text: F.num(r.corrTheory, 3) }] })),
    view.LINKED_TABLES.inference,
    [null, 'coverage/series:2', 'coverage/series:2', 'coverage/series:3', 'scatter/points', 'scatter/slope'],
  );
  const hideInference = () =>
    hideParts(
      inference,
      prefixed([
        ['coverage', coverageItems, kept.coverage],
        ['scatter', scatterItems, kept.scatter],
      ]),
    );
  hideInference();
  fill(
    regions.inference,
    h(
      'div',
      { class: 'charts' },
      figure(I.coverageTitle, hw.drawLineChart, view.coverageChart(s, F.decimal), {
        tip: view.tips.coverage(s, text.tips),
        link: view.links.inference,
        items: coverageItems,
        keep: kept.coverage,
        onHide: hideInference,
      }),
      figure(I.scatterTitle(pt.n, s.m), hw.drawScatter, scatter, { tip: view.tips.scatter(scatter, text.tips), items: scatterItems, keep: kept.scatter, onHide: hideInference }),
    ),
    subtitle(I.tableTitle),
    h('div', { class: 'scroll' }, inference),
    paras(I.facts(s)),
    tests('inference', s),
  );
}

// ---------------------------------------------------------------------------
// Gli esempi interattivi ("Prova")
// ---------------------------------------------------------------------------

/** Redraws a chart in place, with new data and labels, without replacing its canvas (no flicker while it plays); the hidden parts stay hidden. */
function refreshFigure(fig, caption, data, tip) {
  const canvas = fig.querySelector('canvas.chart');
  const chart = charts.get(canvas);
  if (!chart) return;
  chart.data = data;
  chart.tip = tip;
  attachTip(canvas, chart);
  canvas.setAttribute('aria-label', caption);
  fig.querySelector('figcaption').textContent = caption;
  redraw(canvas, chart);
}

// --- 1.2 I dati da trascinare ---------------------------------------------------------

let drag = null;
let dragWidth = 0;
const dragResizer = new ResizeObserver(() => {
  const canvas = controls.dragCanvas;
  if (!drag || !canvas || canvas.clientWidth === dragWidth) return;
  dragWidth = canvas.clientWidth;
  drag.redraw();
});

function tryDragBlock() {
  const D = text.tryDrag;
  const span = 10 * (view.DRAG.hi - view.DRAG.lo);
  controls.dragCanvas = h('canvas', { class: 'drag', role: 'img', 'aria-label': text.sections.tryDrag });
  controls.dragCaption = h('p', { class: 'caption line', 'aria-live': 'polite' });
  controls.dragSlider = slider('hw4-drag-x', (v) => drag && drag.setValue(drag.stats().k - 1, view.DRAG.lo + v / 10));
  controls.dragAdd = h('button', { type: 'button', class: 'btn alt', text: D.add, onclick: () => drag && drag.add(view.DRAG.lo + Math.round(Math.random() * span) / 10) });
  controls.dragRemove = h('button', { type: 'button', class: 'btn alt', text: D.remove, onclick: () => drag && drag.removeLast() });
  const reset = h('button', { type: 'button', class: 'btn alt', text: D.reset, onclick: () => drag && drag.reset() });
  return h(
    'div',
    { class: 'try' },
    title('hw4-try-drag', 2, text.sections.tryDrag),
    paras(D.intro),
    h('div', { class: 'slider-row' }, controls.dragSlider.el, h('span', { class: 'buttons' }, controls.dragAdd, controls.dragRemove, reset)),
    // posizionato: ci stanno dentro l'evidenziazione e l'etichetta sotto il puntatore
    h('div', { class: 'figure' }, controls.dragCanvas),
    // la legenda: le parti nascoste non si disegnano, e un punto nascosto non si trascina
    legend(view.legends.drag(text), (parts) => drag && drag.setHidden(parts), kept.drag),
    controls.dragCaption,
    paras(D.after),
  );
}

function updateDrag(st) {
  const D = text.tryDrag;
  state.drag.values = st.values;
  controls.dragCaption.textContent = D.caption(st);
  controls.dragSlider.set(10 * (view.DRAG.hi - view.DRAG.lo), Math.round(10 * (st.x - view.DRAG.lo)), D.sliderLabel(st.k, text.fmt.sig(st.x, 3)));
  controls.dragAdd.disabled = st.k >= hw.DATA_MAX;
  controls.dragRemove.disabled = st.k <= 2;
}

/** The draggable data, again after every new drawing of the page (the data moved so far stay). */
function createDrag() {
  if (drag) drag.destroy();
  drag = null;
  const canvas = controls.dragCanvas;
  if (!canvas || !canvas.isConnected) return;
  drag = hw.createWelfordDrag(canvas, { ...view.DRAG, initial: view.DRAG.values, values: state.drag.values || view.DRAG.values, palette: palette(), decimal: text.fmt.decimal, hidden: partsOf(view.legends.drag(text), kept.drag), onChange: updateDrag });
  dragWidth = canvas.clientWidth;
  dragResizer.disconnect();
  dragResizer.observe(canvas);
}

// --- 1.5 Le cifre che si perdono -------------------------------------------------------

function tryDigitsBlock() {
  const D = text.tryDigits;
  regions.digits = h('div');
  controls.digitsSlider = slider('hw4-digits-c', (e) => {
    state.digits.power = e;
    updateDigits();
  });
  return h(
    'div',
    { class: 'try' },
    title('hw4-try-digits', 2, text.sections.tryDigits),
    paras(D.intro),
    choices(D.datasetLabel, view.DIGIT_DATASETS.map((d) => [d, D.datasets[d]]), state.digits.dataset, (d) => {
      state.digits.dataset = d;
      updateDigits();
    }),
    h('div', { class: 'slider-row' }, controls.digitsSlider.el),
    regions.digits,
  );
}

function updateDigits() {
  const D = text.tryDigits;
  const r = view.digitsReport(state.digits.power, state.digits.dataset);
  controls.digitsSlider.set(view.DIGIT_POWERS[1], state.digits.power, D.powerLabel(state.digits.power));
  const row = (name, ...value) => h('div', { class: 'digit-row' }, h('span', { class: 'digit-name', text: name }), ...value);
  fill(
    regions.digits,
    h('p', { class: 'note', text: D.exact(r.exact) }),
    h(
      'div',
      { class: 'digits' },
      r.rows.map((x) => row(D.rows[x.formula], h('span', { class: 'digit-value' }, x.parts.map((part) => h('span', { class: part.ok ? 'digit-ok' : 'digit-bad', text: part.text }))), h('span', { class: 'digit-note', text: `${D.right(x.right)}, ${D.error(x.error)}` }))),
    ),
    subtitle(D.sumsTitle),
    h(
      'div',
      { class: 'digits' },
      [r.sums.a, r.sums.b].map((num, i) => row(D.sumLabels[i], h('span', { class: 'digit-value' }, h('span', { class: 'digit-common', text: num.slice(0, r.sums.common) }), h('span', { class: 'digit-bad', text: num.slice(r.sums.common) }), h('span', { class: 'digit-common', text: r.sums.exponents[i] })))),
    ),
    h('p', { text: D.common(r.sums.commonDigits, r.sums.total) }),
  );
}

// --- 2.5 Bessel in diretta -----------------------------------------------------------------

function tryBesselBlock() {
  const B = text.tryBessel;
  regions.bessel = h('div');
  controls.besselSlider = slider('hw4-bessel-n', (v) => {
    state.bessel.n = view.BESSEL_N[0] + v;
    resetBessel();
  });
  controls.besselPlay = h('button', { type: 'button', class: 'btn', text: B.play, onclick: toggleBessel });
  controls.besselSteps = [
    [B.one, 1],
    [B.hundred, 100],
    [B.thousand, 1000],
  ].map(([label, count]) => h('button', { type: 'button', class: 'btn alt', text: label, onclick: () => advanceBessel(count) }));
  const reset = h('button', { type: 'button', class: 'btn alt', text: B.reset, onclick: resetBessel });
  const data = view.besselChart(view.besselStart(state.target, state.bessel.n), text.fmt.decimal);
  controls.besselFigure = figure(B.chartTitle(state.bessel.n), hw.drawLineChart, data, {
    wide: true,
    items: view.legends.bessel(text),
  });
  return h(
    'div',
    { class: 'try' },
    title('hw4-try-bessel', 2, text.sections.tryBessel),
    paras(B.intro),
    h('div', { class: 'slider-row' }, controls.besselSlider.el, h('span', { class: 'buttons' }, controls.besselPlay, controls.besselSteps, reset)),
    h('div', { class: 'charts' }, controls.besselFigure),
    regions.bessel,
  );
}

function stopBessel() {
  state.bessel.playing = false;
  clearTimeout(timers.bessel);
}

function resetBessel() {
  stopBessel();
  state.bessel.run = view.besselStart(state.target, state.bessel.n);
  updateBessel();
}

function advanceBessel(count) {
  state.bessel.run = view.besselAdvance(state.bessel.run, count);
  updateBessel();
}

function toggleBessel() {
  if (state.bessel.playing) {
    stopBessel();
    updateBessel();
    return;
  }
  state.bessel.playing = true;
  const tick = () => {
    timers.bessel = setTimeout(() => {
      if (!state.bessel.playing) return;
      const run = state.bessel.run;
      if (run.count >= view.BESSEL_MAX) {
        stopBessel();
        updateBessel();
        return;
      }
      state.bessel.run = view.besselAdvance(run, Math.max(1, Math.ceil(run.count * 0.06)));
      updateBessel();
      tick();
    }, 70);
  };
  updateBessel();
  tick();
}

function updateBessel() {
  const B = text.tryBessel;
  const run = state.bessel.run;
  if (!run || !controls.besselFigure) return;
  const law = hw.scoreLaw(run.dist, run.p);
  const full = run.count >= view.BESSEL_MAX;
  controls.besselSlider.set(view.BESSEL_N[1] - view.BESSEL_N[0], run.n - view.BESSEL_N[0], B.nLabel(run.n));
  controls.besselPlay.textContent = state.bessel.playing ? B.pause : B.play;
  controls.besselPlay.disabled = full;
  controls.besselSteps.forEach((b) => {
    b.disabled = full;
  });
  const data = view.besselChart(run, text.fmt.decimal);
  refreshFigure(controls.besselFigure, B.chartTitle(run.n), data, view.tips.bessel(run, data, text.tips));
  fill(
    regions.bessel,
    h('p', { class: 'caption line', 'aria-live': state.bessel.playing ? 'off' : 'polite', text: B.status(run, law) }),
    run.last && h('p', { class: 'note', text: B.last(run.last) }),
    full && h('p', { class: 'note', text: B.limit }),
  );
}

// --- 2.7 Cento intervalli di confidenza ------------------------------------------------

function tryIntervalsBlock() {
  const I = text.tryIntervals;
  const F = text.fmt;
  const S = state.intervals;
  regions.intervals = h('div');
  regions.intervalLaw = h('div');
  controls.intervalSlider = slider('hw4-intervals-n', (g) => {
    S.g = g;
    resetIntervals();
  });
  controls.intervalButton = h('button', {
    type: 'button',
    class: 'btn',
    text: I.newBatch,
    onclick: () => {
      S.batch += 1;
      updateIntervals();
    },
  });
  return h(
    'div',
    { class: 'try' },
    title('hw4-try-intervals', 2, text.sections.tryIntervals),
    paras(I.intro),
    choices(I.paramLabel, ['mean', 'variance'].map((v) => [v, I.params[v]]), S.param, (v) => {
      S.param = v;
      resetIntervals();
    }),
    choices(I.levelLabel, view.LEVELS.map((l) => [l, F.pct(l, 0)]), S.level, (v) => {
      S.level = v;
      resetIntervals();
    }),
    regions.intervalLaw,
    h('div', { class: 'slider-row' }, controls.intervalSlider.el, controls.intervalButton),
    regions.intervals,
  );
}

function resetIntervals() {
  state.intervals.batch = 0;
  state.intervals.misses = [];
  updateIntervals();
}

function updateIntervals() {
  const I = text.tryIntervals;
  const S = state.intervals;
  if (!regions.intervals) return;
  const dist = S.dist || state.target.dist;
  const n = view.INTERVAL_NS[S.g];
  fill(
    regions.intervalLaw,
    choices(I.lawLabel, hw.DISTRIBUTIONS.map((d) => [d, text.distNames[d]]), dist, (d) => {
      S.dist = d;
      resetIntervals();
    }),
  );
  controls.intervalSlider.set(view.INTERVAL_NS.length - 1, S.g, I.nLabel(n));
  controls.intervalButton.disabled = S.batch >= 99;
  const settings = { seed: state.target.seed, dist, p: state.target.p, n, level: S.level, param: S.param };
  const current = view.intervalBatch({ ...settings, batch: S.batch });
  for (let b = 0; b < S.batch; b++) if (S.misses[b] === undefined) S.misses[b] = view.intervalBatch({ ...settings, batch: b }).misses;
  S.misses[S.batch] = current.misses;
  let total = 0;
  for (let b = 0; b <= S.batch; b++) total += S.misses[b];
  const data = view.intervalChart(current, text.fmt.decimal);
  fill(
    regions.intervals,
    h(
      'div',
      { class: 'charts' },
      figure(I.chartTitle(current, text.distNames[dist]), hw.drawIntervals, data, {
        wide: true,
        tip: view.tips.intervals(current, text.tips),
        items: view.legends.intervals(text),
      }),
    ),
    h('p', { class: 'caption line', 'aria-live': 'polite', text: I.counts(current.misses, S.level, (S.batch + 1) * view.INTERVAL_SIZE, total) }),
  );
}

// ---------------------------------------------------------------------------
// 3, 4 e 5
// ---------------------------------------------------------------------------

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section' }, title('hw4-tests', 0, text.sections.tests), regions.tests);
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
    title('hw4-history', 0, text.sections.history),
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
  return h('section', { class: 'section' }, title('hw4-conclusion', 0, text.sections.conclusion), regions.conclusion);
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
  updateScores();
  updateAverages();
  updateComparison();
  updateSpread();
  updateInference();
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
  document.title = 'Homework #4 - Statistics';
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
  text = HW4_TEXTS[state.lang];
  stopPlayer('steps');
  stopPlayer('spread');
  stopBessel();
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), part1Section(), part2Section(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateSteps();
  updateScores();
  updateInputs();
  updateVerify();
  updateResults();
  createAnimation();
  createDrag();
  updateDigits();
  if (!state.bessel.run || state.bessel.run.seed !== state.target.seed || state.bessel.run.dist !== state.target.dist || state.bessel.run.p !== state.target.p) resetBessel();
  else updateBessel();
  updateIntervals();
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
