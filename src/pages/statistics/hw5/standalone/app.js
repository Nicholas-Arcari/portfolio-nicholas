// src/pages/statistics/hw5/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework5.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Da file:// i worker non partono: le simulazioni girano qui, a fette di
// pochi millisecondi, e la pagina resta reattiva mentre i numeri arrivano;
// intanto l'Esercizio 2 e gli esempi interattivi, che non ne hanno bisogno,
// funzionano gia'.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
import * as hw from '../homework5.js';
import * as view from '../view.js';
import { HW5_TEXTS, originalAssignment } from '../texts.js';

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

const SLICES_MAX = 64;

const state = {
  lang: initialLanguage(),
  fields: { ...view.DEFAULT_INPUTS },
  // l'ultimo valore valido di ogni campo, e quelli dell'ultima simulazione partita
  params: { ...view.DEFAULT_PARAMS },
  target: { ...view.DEFAULT_PARAMS },
  // gli esempi e le scelte
  area: { ...view.AREA.defaults },
  infinityRule: 'gauss',
  alarm: { ...view.ALARM_DEFAULT },
  coins: 0,
  fnKey: 'square',
  custom: { ...view.DEFAULT_CUSTOM },
  validCustom: view.readCustom(view.DEFAULT_CUSTOM),
  riemannKind: 'midpoint',
  slices: { n: 4, K: 4, playing: false },
  histKey: 'unbounded',
  mc: { key: 'unbounded', draw: 0, shown: 0, playing: false },
};
let text = HW5_TEXTS[state.lang];
const regions = {};
const controls = { fields: {}, custom: {} };
const timers = { compute: null, slices: null, mc: null };

// I risultati gia' calcolati (gli ultimi), quelli mostrati e il calcolo in corso
const results = new Map();
const computation = { shown: null, error: null, running: null };

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
const charts = new Map(); // canvas -> { draw, data, width, detach, link }
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

function figure(caption, draw, data, { wide = false, tip: given = null, tipOf = null, items = null, note = null, link = null } = {}) {
  // tipOf(data): the label built from the same data the chart draws
  const tip = given || (tipOf ? tipOf(data) : null);
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': caption });
  const fig = h('figure', { class: wide ? 'figure wide' : 'figure' }, canvas, items && legend(items), note && h('p', { class: 'figure-note', text: note }), h('figcaption', { text: caption }));
  const detach = tip ? hw.attachChartTooltip(canvas, { draw, data, describe: tip, link }) : null;
  charts.set(canvas, { draw, data, width: -1, detach, link });
  resizer.observe(canvas);
  return fig;
}

/** Redraws a chart in place, with new data and labels, without replacing its canvas (no flicker while it plays or a slider moves). */
function refreshFigure(fig, caption, data, tip) {
  const canvas = fig.querySelector('canvas.chart');
  const chart = charts.get(canvas);
  if (!chart) return;
  if (chart.detach) chart.detach();
  chart.data = data;
  chart.detach = tip ? hw.attachChartTooltip(canvas, { draw: chart.draw, data, describe: tip, link: chart.link }) : null;
  canvas.setAttribute('aria-label', caption);
  fig.querySelector('figcaption').textContent = caption;
  if (chart.width > 0) {
    canvas.style.height = `${hw.chartHeight(chart.draw, data, chart.width)}px`;
    chart.draw(canvas, { ...data, width: chart.width }, palette());
  }
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

/** A table: column headers, then rows of cells, each { text | node, class?, head?, title? } (head: a row header, th); `id` for a table tied to a chart (view.LINKED_TABLES). */
function table(className, headers, rows, id = null) {
  return h(
    'table',
    { id, class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x) => h('th', { text: x })))),
    h(
      'tbody',
      null,
      rows.map((row) => h(
        'tr',
        { class: row.class || null },
        row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { 'data-label': cell.head ? null : headers[i], class: cell.class || null, title: cell.title || null }, cell.node || cell.text)),
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

/** A choice among a few values: the pressed button is the active one. */
function choices(label, options, value, onChange) {
  const buttons = options.map(([key, name]) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(key === value), text: name, onclick: () => select(key) }));
  function select(key) {
    options.forEach(([k], i) => buttons[i].setAttribute('aria-pressed', String(k === key)));
    onChange(key);
  }
  return h('div', { class: 'choices', role: 'group', 'aria-label': label }, h('span', { class: 'choices-label', text: label }), buttons);
}

/** A slider on indices; set() moves it when the state or the language change. */
function slider(id, onChange) {
  const label = h('label', { for: id });
  const input = h('input', { id, type: 'range', min: 0, max: 0, step: 1, value: 0, oninput: (e) => onChange(Number(e.target.value)) });
  return {
    el: h('div', { class: 'slider' }, label, input),
    set(max, value, labelText) {
      input.max = String(max);
      input.value = String(value);
      label.textContent = labelText;
      input.setAttribute('aria-valuetext', labelText);
    },
  };
}

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw5-assignment', 0, text.sections.assignment),
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
          if (block.type === 'list') return h('ul', null, block.items.map((item) => h('li', { text: item })));
          if (block.type === 'link') return h('p', null, h('a', { href: block.href, target: '_blank', rel: 'noopener noreferrer', text: block.text }));
          return h('p', { text: block.text });
        }),
      ),
    ),
  );
}

// --- Prova: l'area sotto la campana -------------------------------------------------------

const tryArea = { fig: null, line: null, z: null, n: null };

function tryAreaBlock() {
  const T = text.tryArea;
  const F = text.fmt;
  const a = state.area;
  tryArea.z = slider('hw5-area-z', (i) => {
    a.z = view.zOfIndex(i);
    updateArea();
  });
  tryArea.n = slider('hw5-area-n', (i) => {
    a.n = i + 1;
    updateArea();
  });
  const st = view.areaState(a, F.decimal);
  tryArea.fig = figure(T.chartTitle(st, a.rule), hw.drawQuadrature, st.chart, { wide: true, tip: view.tips.area(st, text.tips) });
  tryArea.line = h('p', { class: 'caption line', 'aria-live': 'polite' });
  return h(
    'div',
    { class: 'try' },
    title('hw5-try-area', 2, text.sections.tryArea),
    paras(T.intro),
    choices(T.muLabel, view.AREA.mus.map((m) => [m, F.plain(m)]), a.mu, (v) => {
      a.mu = v;
      updateArea();
    }),
    choices(T.sigmaLabel, view.AREA.sigmas.map((v) => [v, F.plain(v)]), a.sigma, (v) => {
      a.sigma = v;
      updateArea();
    }),
    choices(T.ruleLabel, hw.RULES.map((r) => [r, text.ruleNames[r]]), a.rule, (v) => {
      a.rule = v;
      updateArea();
    }),
    choices(T.strategyLabel, view.AREA.strategies.map((s) => [s, T.strategies[s]]), a.strategy, (v) => {
      a.strategy = v;
      updateArea();
    }),
    h('div', { class: 'slider-row' }, tryArea.z.el, tryArea.n.el),
    h('div', { class: 'charts' }, tryArea.fig),
    tryArea.line,
  );
}

function updateArea() {
  const T = text.tryArea;
  const a = state.area;
  const st = view.areaState(a, text.fmt.decimal);
  tryArea.z.set(view.Z_STEPS, view.indexOfZ(a.z), T.zLabel(st.x, a.z));
  tryArea.n.set(view.AREA.nMax - 1, a.n - 1, T.nLabel(st.n, a.rule));
  refreshFigure(tryArea.fig, T.chartTitle(st, a.rule), st.chart, view.tips.area(st, text.tips));
  tryArea.line.textContent = T.result(st, a.rule);
}

// --- 1.2 Le regole ---------------------------------------------------------------------------------

function rulesBlock() {
  const R = text.rules;
  const F = text.fmt;
  const rows = view.ruleRows();
  return [
    paras(R.intro),
    formulas(text.formulas.rules, R.formulasTitle),
    subtitle(R.tableTitle(view.RULES_N)),
    table(
      'discussion rules',
      [R.cols.rule, R.cols.n, R.cols.evaluations, R.cols.value, R.cols.error],
      rows.map((r) => ({ cells: [{ text: text.ruleNames[r.rule], head: true }, { text: String(r.n) }, { text: String(r.evaluations) }, { text: F.num(r.value, 15) }, { text: F.err(r.error) }] })),
    ),
    subtitle(R.gaussTitle),
    table(
      'compact gauss',
      [R.gaussCols.i, R.gaussCols.node, R.gaussCols.weight],
      view.gaussRows(5).map((r) => ({ cells: [{ text: String(r.i), head: true }, { text: F.num(r.node, 15) }, { text: F.num(r.weight, 15) }] })),
    ),
    paras(R.after(rows)),
  ];
}

// --- 1.3 Il -infinito ------------------------------------------------------------------------------

function updateInfinity() {
  const I = text.infinity;
  const F = text.fmt;
  const rule = state.infinityRule;
  const n = hw.STRATEGY_RULES.find((r) => r.rule === rule).n;
  const keys = ['symmetry', 'trunc4', 'trunc8', 'substitution'];
  fill(
    regions.infinity,
    subtitle(I.tableTitle(rule, n)),
    table(
      'discussion strategies',
      [I.cols.z, I.cols.reference, ...keys.map((k) => I.cols[k])],
      view.strategyTable(rule).map((r) => ({ cells: [{ text: F.plain(r.z), head: true }, { text: F.num(r.reference, 8) }, ...r.errors.map((e) => ({ text: F.err(e) }))] })),
    ),
    paras(I.after(view.strategyFacts())),
  );
}

// --- 1.4 La convergenza, 1.5 la tavola, 1.6 i quantili ---------------------------------------------------------

function convergenceBlock() {
  const C = text.convergence;
  const F = text.fmt;
  const study = hw.convergenceStudy();
  return [
    paras(C.intro),
    h(
      'div',
      { class: 'charts' },
      figure(C.chartTitle(study.z), hw.drawLineChart, view.convergenceChart(study, F.decimal), { wide: true, tip: view.tips.convergence(study, text.tips), link: view.links.convergence, items: hw.RULES.map((r, i) => ({ label: text.ruleNames[r], color: i })) }),
    ),
    subtitle(C.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact convergence',
        [C.cols.n, ...hw.RULES.map((r) => text.ruleNames[r])],
        study.rows.map((r) => ({ cells: [{ text: F.int(r.n), head: true }, ...hw.RULES.map((rule) => ({ text: r.errors[rule] === null ? '-' : F.err(r.errors[rule]) }))] })),
        view.LINKED_TABLES.convergence,
      ),
    ),
    paras(C.after(view.convergenceFacts(study))),
  ];
}

function zTableBlock() {
  const Z = text.table;
  const F = text.fmt;
  const zt = hw.zTable();
  return [
    paras(Z.intro),
    subtitle(Z.title(zt)),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact ztable',
        ['z', ...Array.from({ length: hw.ZTABLE.cols }, (_, c) => `${F.decimal}0${c}`)],
        zt.table.map((row) => ({
          cells: [{ text: F.num(row.row, 1), head: true }, ...row.cells.map((c) => (view.isMarkedZ(c.z) ? { text: F.num(c.value, 4), class: 'is-mark', title: `Φ(${F.num(c.z, 2)}) = ${F.num(c.value, 8)}` } : { text: F.num(c.value, 4) }))],
        })),
      ),
    ),
    paras(Z.after(zt)),
  ];
}

function quantilesBlock() {
  const Q = text.quantiles;
  const F = text.fmt;
  const rows = view.quantileRows();
  const steps = view.newtonRows();
  return [
    paras(Q.intro),
    formulas(text.formulas.newton, Q.formulasTitle),
    subtitle(Q.tableTitle),
    table(
      'discussion quantiles',
      [Q.cols.p, Q.cols.z, Q.cols.steps, Q.cols.reference, Q.cols.difference],
      rows.map((r) => ({ cells: [{ text: F.plain(r.p), head: true }, { text: F.num(r.z, 12) }, { text: String(r.steps) }, { text: F.num(r.reference, 12) }, { text: F.err(r.difference) }] })),
    ),
    subtitle(Q.newtonTitle(view.NEWTON_P)),
    table(
      'compact newton',
      [Q.newtonCols.k, Q.newtonCols.z, Q.newtonCols.F, Q.newtonCols.dz, Q.newtonCols.error],
      steps.map((r) => ({ cells: [{ text: String(r.k), head: true }, { text: F.num(r.z, 15) }, { text: F.num(r.F, 15) }, { text: F.sig(r.dz, 4) }, { text: F.err(r.error) }] })),
      view.LINKED_TABLES.newton,
    ),
    h('div', { class: 'charts' }, figure(Q.chartTitle, hw.drawLineChart, view.newtonChart(steps, F.decimal), { wide: true, tip: view.tips.newton(steps, text.tips), link: view.links.newton })),
    paras(Q.after(rows)),
  ];
}

// --- 1.7 Le code e la prova delle soglie ------------------------------------------------------------------------

function tailsBlock() {
  const T = text.tails;
  const F = text.fmt;
  const rows = hw.tailRows();
  const alarms = view.alarmRows();
  return [
    paras(T.intro),
    subtitle(T.tableTitle),
    table(
      'compact tails',
      [T.cols.k, T.cols.reference, T.cols.subtraction, T.cols.subtractionError, T.cols.direct, T.cols.directError],
      rows.map((r) => ({ cells: [{ text: String(r.k), head: true }, { text: F.sci(r.reference, 2) }, { text: F.sci(r.subtraction, 2) }, { text: F.err(r.subtractionError), class: r.subtractionError > 1e-6 ? 'over' : null }, { text: F.sci(r.direct, 2) }, { text: F.err(r.directError) }] })),
      view.LINKED_TABLES.tails,
    ),
    h('div', { class: 'charts' }, figure(T.chartTitle, hw.drawLineChart, view.tailChart(rows, F.decimal), { wide: true, tip: view.tips.tails(rows, text.tips), link: view.links.tails, items: [{ label: T.legend[0], color: 1 }, { label: T.legend[1], color: 2 }] })),
    paras(T.after(view.tailFacts(rows))),
    paras(T.alarmIntro),
    subtitle(T.alarmTitle),
    table(
      'discussion alarms',
      [T.alarmCols.k, T.alarmCols.normal, T.alarmCols.normalPerDay, T.alarmCols.heavy, T.alarmCols.heavyPerDay, T.alarmCols.ratio],
      alarms.map((r) => ({ cells: [{ text: String(r.k), head: true }, { text: F.sci(r.normal, 2) }, { text: F.sig(r.normalPerDay, 4) }, { text: F.sci(r.heavy, 2) }, { text: F.sig(r.heavyPerDay, 4) }, { text: F.num(r.ratio, 1) }] })),
    ),
    paras(T.alarmAfter(alarms)),
  ];
}

const tryAlarm = { fig: null, line: null };

function tryAlarmBlock() {
  const T = text.tryAlarm;
  const F = text.fmt;
  const st = view.alarmState(state.alarm.events, state.alarm.rate);
  const data = view.alarmChart(st, F.decimal);
  tryAlarm.fig = figure(T.chartTitle, hw.drawLineChart, data, { wide: true, tip: view.tips.alarm(st, data, text.tips), items: [{ label: T.legend[0], color: 0 }, { label: T.legend[1], color: 1 }, { label: T.legend[2], color: 6, dashed: true }] });
  tryAlarm.line = h('p', { class: 'caption line', 'aria-live': 'polite', text: T.result(st) });
  return h(
    'div',
    { class: 'try' },
    title('hw5-try-alarm', 2, text.sections.tryAlarm),
    paras(T.intro),
    choices(T.eventsLabel, view.ALARM_EVENTS.map((e) => [e, F.events(e)]), state.alarm.events, (v) => {
      state.alarm.events = v;
      updateAlarm();
    }),
    choices(T.rateLabel, Object.keys(view.ALARM_RATES).map((r) => [r, T.rates[r]]), state.alarm.rate, (v) => {
      state.alarm.rate = v;
      updateAlarm();
    }),
    h('div', { class: 'charts' }, tryAlarm.fig),
    tryAlarm.line,
  );
}

function updateAlarm() {
  const T = text.tryAlarm;
  const st = view.alarmState(state.alarm.events, state.alarm.rate);
  const data = view.alarmChart(st, text.fmt.decimal);
  refreshFigure(tryAlarm.fig, T.chartTitle, data, view.tips.alarm(st, data, text.tips));
  tryAlarm.line.textContent = T.result(st);
}

// --- 1.8 I dati, con i campi ---------------------------------------------------------------------------------

// i campi: chiave, nome nello stato, id, tastiera, sezione
const FIELDS = [
  ['seed', 'seedText', 'hw5-seed', 'numeric'],
  ['sample', 'sampleText', 'hw5-sample', 'numeric'],
  ['points', 'pointsText', 'hw5-points', 'numeric'],
  ['reps', 'repsText', 'hw5-reps', 'numeric'],
];

function fieldBlock(keys) {
  const D = text.data;
  const M = text.montecarlo;
  const labels = { seed: [D.seedLabel, D.seedHint], sample: [D.sampleLabel, D.sampleHint], points: [M.pointsLabel, M.pointsHint], reps: [M.repsLabel, M.repsHint] };
  return h(
    'div',
    { class: 'params' },
    FIELDS.filter(([key]) => keys.includes(key)).map(([key, name, id, mode]) => {
      const input = h('input', { id, type: 'text', inputmode: mode, ...PRIVATE_FIELD, maxlength: view.FIELD_LENGTH[key], 'aria-describedby': `${id}-help`, oninput: (e) => changeFields({ [name]: e.target.value.slice(0, view.FIELD_LENGTH[key]) }) });
      input.value = state.fields[name];
      const help = h('p', { id: `${id}-help`, class: 'note', text: labels[key][1] });
      controls.fields[key] = { input, help, hint: labels[key][1] };
      const extra = key === 'seed' ? h('button', { type: 'button', class: 'btn alt', text: D.randomSeed, onclick: () => changeFields({ seedText: String(hw.randomSeed()) }, true) }) : null;
      return h('div', { class: 'param' }, h('label', { for: id, text: labels[key][0] }), h('span', { class: 'param-row' }, input, extra), help);
    }),
  );
}

function dataBlock() {
  const D = text.data;
  regions.status = h('div');
  regions.data = h('div');
  return [paras(D.intro), h('p', { text: D.fieldsIntro }), fieldBlock(['seed', 'sample']), regions.status, regions.data];
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
  if (r.ok) return null;
  if (r.error === 'range') return text.data.errors.range(...hw.LIMITS[key]);
  const m = text.data.errors[r.error];
  return typeof m === 'function' ? m(r.text) : m;
}

/** A new simulation when the parameters settle. */
function scheduleComputation() {
  clearTimeout(timers.compute);
  timers.compute = setTimeout(() => {
    state.target = { ...state.params };
    startComputation();
    updateCoins();
    resetMc();
  }, 400);
}

/** The fields read again: errors, the last valid value of each, and a new simulation when they settle. */
function updateInputs() {
  const read = view.readInputs(state.fields);
  for (const [key] of FIELDS) {
    const field = controls.fields[key];
    if (!field) continue;
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
    scheduleComputation();
  }
  updateStatus();
}

/** Under the fields: the errors, the values in use, the simulation running or the time it took. */
function updateStatus() {
  const D = text.data;
  const read = view.readInputs(state.fields);
  const badge = view.inputBadge(state.params, D);
  const waiting = Boolean(computation.running) || view.paramsKey(state.params) !== view.paramsKey(state.target);
  const s = computation.shown;
  const stale = !view.allValid(read) && h('p', { class: 'stale', role: 'status', text: D.stale });
  const running = waiting && s && h('p', { class: 'stale', role: 'status', text: D.pending });
  const error = computation.error && h('p', { class: 'note', text: text.ui.error(computation.error) });
  fill(
    regions.status,
    stale,
    h('p', { class: badge.known ? 'badge-line is-task' : 'badge-line is-custom' }, h('span', { text: badge.text }), badge.restore && h('button', { type: 'button', class: 'btn alt', text: D.restore, onclick: restore })),
    running,
    error,
    s && !waiting && h('p', { class: 'note', role: 'status', text: D.run(s) }),
  );
  if (regions.mcStatus) fill(regions.mcStatus, !view.allValid(read) && h('p', { class: 'stale', role: 'status', text: D.stale }), waiting && s && h('p', { class: 'stale', role: 'status', text: D.pending }), computation.error && h('p', { class: 'note', text: text.ui.error(computation.error) }));
}

function updateData() {
  const D = text.data;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.data, pending());
    return;
  }
  const items = [{ label: D.legend[0], color: 0 }, { label: D.legend[1], color: 2, dashed: true }];
  const normal = view.ecdfChart(s.normal, F.decimal);
  const heavy = view.ecdfChart(s.heavy, F.decimal);
  fill(
    regions.data,
    h(
      'div',
      { class: 'charts' },
      figure(D.normalTitle(s.normal.n), hw.drawLineChart, normal, { tip: view.tips.ecdf(normal, text.tips), items }),
      figure(D.heavyTitle(s.heavy.n), hw.drawLineChart, heavy, { tip: view.tips.ecdf(heavy, text.tips), items }),
    ),
    tests('model', s),
    paras(D.after(s)),
  );
}

// --- 1.9 Le verifiche -------------------------------------------------------------------------------------

let checkRows = null;

function updateVerify() {
  const V = text.checks;
  if (!checkRows) {
    fill(regions.verify, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const ok = checkRows.filter((r) => r.ok).length;
  fill(
    regions.verify,
    h('p', { text: V.intro }),
    check(ok === checkRows.length, V.summary(ok, checkRows.length)),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: V.details(checkRows.length) }),
      ['quadrature', 'normal', 'cdf', 'integrals', 'generator'].map((group) => [
        subtitle(V.groups[group]),
        table(
          'discussion checks',
          [V.cols.check, V.cols.expected, V.cols.result],
          checkRows.filter((r) => r.group === group).map((r) => ({ cells: [{ text: r.name, head: true }, { node: h('code', { text: r.expected }) }, { node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }), class: r.ok ? 'is-ok' : 'is-bad' }] })),
        ),
      ]),
    ),
  );
}

// ---------------------------------------------------------------------------
// Esercizio 1: le monete, le funzioni, Riemann, Lebesgue, i risultati, il
// confronto, i costi, Dirichlet e Thomae, il traffico, Monte Carlo
// ---------------------------------------------------------------------------

function exercise1Section() {
  const S = text.sections;
  regions.coins = h('div');
  regions.custom = h('div');
  regions.riemann = h('div');
  regions.lebesgue = h('div');
  regions.results = h('div');
  regions.compare = h('div');
  regions.efficiency = h('div');
  regions.mc = h('div');
  regions.mcStatus = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw5-exercise1', 0, S.exercise1),
    paras(text.exercise1.intro),
    title('hw5-idea', 1, S.idea),
    paras(text.idea.intro),
    h('div', { class: 'try' }, title('hw5-try-coins', 2, S.tryCoins), paras(text.tryCoins.intro), regions.coins),
    title('hw5-functions', 1, S.functions),
    functionsBlock(),
    title('hw5-riemann', 1, S.riemann),
    paras(text.riemann.intro),
    formulas(text.formulas.riemann, text.riemann.formulasTitle),
    choices(text.riemann.kindLabel, hw.RIEMANN_KINDS.map((k) => [k, text.riemann.kinds[k]]), state.riemannKind, (k) => {
      state.riemannKind = k;
      updateRiemann();
    }),
    regions.riemann,
    title('hw5-lebesgue', 1, S.lebesgue),
    paras(text.lebesgue.intro),
    formulas(text.formulas.lebesgue, text.lebesgue.formulasTitle),
    regions.lebesgue,
    trySlicesBlock(),
    title('hw5-results', 1, S.results),
    paras(text.results.intro),
    regions.results,
    title('hw5-compare', 1, S.compare),
    paras(text.compare.intro),
    regions.compare,
    title('hw5-efficiency', 1, S.efficiency),
    paras(text.efficiency.intro),
    regions.efficiency,
    title('hw5-pathological', 1, S.pathological),
    pathologicalBlock(),
    title('hw5-traffic', 1, S.traffic),
    trafficBlock(),
    title('hw5-montecarlo', 1, S.montecarlo),
    paras(text.montecarlo.intro),
    formulas(text.formulas.montecarlo, text.montecarlo.formulasTitle),
    h('p', { text: text.montecarlo.fieldsIntro }),
    fieldBlock(['points', 'reps']),
    regions.mcStatus,
    regions.mc,
    tryMcBlock(),
  );
}

// The comparison of the reader's function, computed once for sections 1.5 - 1.7.
let customStudyCache = { spec: null, study: null };

function customStudy() {
  if (state.fnKey !== hw.CUSTOM) return null;
  const { spec } = current();
  if (customStudyCache.spec !== spec) customStudyCache = { spec, study: hw.comparisonStudy(spec) };
  return customStudyCache.study;
}

// --- 1.5 I risultati -----------------------------------------------------------------------------------------

function updateResultsTable() {
  const R = text.results;
  const s = computation.shown;
  const rows = view.resultsRows(s, customStudy(), view.pathological());
  fill(
    regions.results,
    !s && pending(),
    subtitle(R.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact results',
        [R.cols.name, R.cols.integral, R.cols.riemann, R.cols.lebesgue, R.cols.riemannError, R.cols.lebesgueError, R.cols.verdict],
        rows.map((r) => ({ cells: [{ text: text.functionNames[r.key], head: true }, { text: R.integralCell(r) }, { text: R.riemannCell(r) }, { text: R.lebesgueCell(r) }, { text: R.errorCell(r.errors.riemann) }, { text: R.errorCell(r.errors.lebesgue) }, { text: R.verdicts[r.verdict] }] })),
      ),
    ),
    s && paras(R.after(rows)),
  );
}

// --- 1.7 Quanto costano -----------------------------------------------------------------------------------

let efficiencyCache = { study: null, result: null };

function updateEfficiency() {
  const E = text.efficiency;
  const F = text.fmt;
  const s = computation.shown;
  let study = null;
  if (state.fnKey === hw.CUSTOM) {
    const cs = customStudy();
    if (efficiencyCache.study !== cs) efficiencyCache = { study: cs, result: hw.efficiencyStudy(current().spec, cs.reference) };
    study = efficiencyCache.result;
  } else if (s) {
    study = s.efficiency[state.fnKey];
  }
  const rows = s ? view.efficiencyRows(s) : null;
  fill(
    regions.efficiency,
    !study
      ? pending()
      : h('div', { class: 'charts' }, figure(E.chartTitle(text.functionNames[state.fnKey]), hw.drawLineChart, view.efficiencyChart(study, F.decimal), { wide: true, tipOf: (data) => view.tips.cost(data, text.tips), items: [{ label: E.legend[0], color: 1 }, { label: E.legend[1], color: 0 }] })),
    rows && [
      subtitle(E.tableTitle),
      h(
        'div',
        { class: 'scroll' },
        table(
          'compact efficiency',
          [E.cols.name, E.cols.target, E.cols.riemann, E.cols.lebesgue],
          rows.flatMap((r) => r.targets.map((t) => ({ cells: [{ text: text.functionNames[r.key], head: true }, { text: F.pow(Math.round(Math.log10(t.target))) }, { text: E.cell(t.riemann, 'riemann') }, { text: E.cell(t.lebesgue, 'lebesgue') }] }))),
        ),
      ),
      paras(E.after(view.efficiencyFacts(s))),
    ],
  );
}

// --- 1.8 Dirichlet e Thomae --------------------------------------------------------------------------------

function pathologicalBlock() {
  const P = text.pathological;
  const F = text.fmt;
  const study = view.pathological();
  return [
    paras(P.intro),
    table(
      'discussion dirichlet',
      [P.cols.number, P.cols.fraction, P.cols.value],
      view.DIRICHLET_NUMBERS.map((d) => {
        const f = hw.exactFraction(d.value);
        return { cells: [{ text: P.numbers[d.key], head: true }, { node: h('code', { text: `${f.numerator}/2^${f.power}` }) }, { text: '1' }] };
      }),
    ),
    h('p', { text: P.thomaeIntro }),
    h('div', { class: 'charts' }, figure(P.chartTitle(view.thomaeUpper()), hw.drawHistogram, view.thomaeChart(F.decimal), { wide: true, tipOf: (data) => view.tips.thomae(data, text.tips) })),
    subtitle(P.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact thomae',
        [P.thomaeCols.n, P.thomaeCols.rational, P.thomaeCols.irrational, P.thomaeCols.lower, P.thomaeCols.upper, P.thomaeCols.doubles],
        study.thomae.map((r) => ({ cells: [{ text: F.int(r.n), head: true }, { text: F.sig(r.rational, 4) }, { text: F.int(r.irrational) }, { text: F.int(r.lower) }, { text: F.sig(r.upper, 4) }, { text: F.sig(r.doubles, 4) }] })),
      ),
    ),
    paras(P.after(study)),
  ];
}

// ---------------------------------------------------------------------------
// Esercizio 2: Liouville, erf, l'area, le regole, il -infinito, la
// convergenza, le serie, le approssimazioni, il metodo, il riferimento, il
// confronto, la tavola, i quantili, le code e i dati
// ---------------------------------------------------------------------------

function exercise2Section() {
  const S = text.sections;
  const F = text.fmt;
  regions.infinity = h('div');
  regions.ours = h('div');
  regions.methods = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw5-exercise2', 0, S.exercise2),
    paras(text.exercise2.intro),
    title('hw5-liouville', 1, S.liouville),
    liouvilleBlock(),
    title('hw5-erf', 1, S.erf),
    erfBlock(),
    title('hw5-area', 1, S.area),
    paras(text.area.intro),
    formulas(text.formulas.cdf),
    h('div', { class: 'charts' }, figure(text.area.chartTitle, hw.drawQuadrature, view.bellChart(F.decimal), { wide: true, tipOf: (data) => view.tips.bell(data, text.tips) })),
    tryAreaBlock(),
    title('hw5-rules', 1, S.rules),
    rulesBlock(),
    title('hw5-infinity', 1, S.infinity),
    paras(text.infinity.intro),
    formulas(text.formulas.strategies, text.infinity.formulasTitle),
    choices(text.infinity.chooseLabel, hw.STRATEGY_RULES.map((r) => [r.rule, text.ruleNames[r.rule]]), state.infinityRule, (rule) => {
      state.infinityRule = rule;
      updateInfinity();
    }),
    regions.infinity,
    title('hw5-convergence', 1, S.convergence),
    convergenceBlock(),
    title('hw5-series', 1, S.series),
    seriesBlock(),
    title('hw5-approximations', 1, S.approximations),
    approximationsBlock(),
    title('hw5-ours', 1, S.ours),
    regions.ours,
    title('hw5-reference', 1, S.reference),
    referenceBlock(),
    title('hw5-methods', 1, S.methods),
    paras(text.methods.intro),
    regions.methods,
    title('hw5-table', 1, S.table),
    zTableBlock(),
    title('hw5-quantiles', 1, S.quantiles),
    quantilesBlock(),
    title('hw5-tails', 1, S.tails),
    tailsBlock(),
    tryAlarmBlock(),
    title('hw5-data', 1, S.data),
    dataBlock(),
  );
}

function checksSection() {
  regions.verify = h('div');
  return h('section', { class: 'section' }, title('hw5-checks', 0, text.sections.checks), regions.verify);
}

// --- 2.1 Liouville e 2.2 erf ---------------------------------------------------------------------------------

function liouvilleBlock() {
  const L = text.liouville;
  const F = text.fmt;
  const rows = hw.liouvilleRows();
  return [
    paras(L.intro),
    formulas(L.formulas),
    subtitle(L.tableTitle),
    h('div', { class: 'scroll' }, table('compact liouville', [L.cols.x, L.cols.S, L.cols.ratio, L.cols.degree], rows.map((r) => ({ cells: [{ text: F.int(r.x), head: true }, { text: r.S >= 1e5 ? F.sci(r.S, 6) : F.sig(r.S, 7) }, { text: F.num(r.ratio, 6) }, { text: F.num(r.degree, 2) }] })))),
    paras(L.after(rows)),
  ];
}

function erfBlock() {
  const E = text.erf;
  const F = text.fmt;
  const rows = hw.empiricalRuleRows();
  return [
    paras(E.intro),
    formulas(E.formulas),
    subtitle(E.tableTitle),
    h('div', { class: 'scroll' }, table('compact erf', [E.cols.k, E.cols.value, E.cols.reference, E.cols.rounded], rows.map((r) => ({ cells: [{ text: String(r.k), head: true }, { text: F.num(r.value, 16) }, { text: F.num(r.reference, 16) }, { text: F.num(r.rounded, 4) }] })))),
    paras(E.after(rows)),
  ];
}

// --- 2.7 - 2.11 --------------------------------------------------------------------------------------------

const series = { fig: null, z: view.SERIES_CHOICES[2] };

function seriesBlock() {
  const S = text.series;
  const F = text.fmt;
  const rows = hw.seriesRows();
  series.fig = figure(S.chartTitle(series.z), hw.drawLineChart, view.seriesChart(series.z, F.decimal), { wide: true, tipOf: (data) => view.tips.series(data, text.tips), items: [{ label: S.legend[0], color: 1 }, { label: S.legend[1], color: 1, dashed: true }, { label: S.legend[2], color: 0 }] });
  return [
    paras(S.intro),
    formulas(S.formulas),
    subtitle(S.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact series',
        [S.cols.z, S.cols.altTerms, S.cols.largest, S.cols.lost, S.cols.altError, S.cols.posTerms, S.cols.posError],
        rows.map((r) => ({ cells: [{ text: String(r.z), head: true }, { text: String(r.alternating.terms) }, { text: F.sci(r.alternating.largest) }, { text: F.num(r.alternating.lost, 1) }, { text: F.err(r.alternating.error) }, { text: String(r.positive.terms) }, { text: F.err(r.positive.error) }] })),
      ),
    ),
    choices(S.chooseLabel, view.SERIES_CHOICES.map((v) => [v, F.plain(v)]), series.z, (z) => {
      series.z = z;
      const data = view.seriesChart(z, F.decimal);
      refreshFigure(series.fig, S.chartTitle(z), data, view.tips.series(data, text.tips));
    }),
    h('div', { class: 'charts' }, series.fig),
    paras(S.after(rows)),
  ];
}

function approximationsBlock() {
  const A = text.approximations;
  const F = text.fmt;
  return [
    paras(A.intro),
    h('div', { class: 'charts' }, figure(A.chartTitle, hw.drawLineChart, view.approximationChart(F.decimal), { wide: true, tipOf: (data) => view.tips.approximation(data, text.tips), items: [{ label: A.legend[0], color: 0 }, { label: A.legend[1], color: 1 }, { label: A.legend[2], color: 6, dashed: true }] })),
    paras(A.after(view.approximationFacts())),
  ];
}

function updateOurs() {
  const O = text.ours;
  const facts = view.methodsFacts(computation.shown);
  fill(regions.ours, paras(O.intro(facts)), formulas(O.formulas), paras(O.after(facts)));
}

function referenceBlock() {
  const R = text.reference;
  const F = text.fmt;
  const { rows, nist } = view.referenceFacts();
  return [
    paras(R.intro),
    h('p', null, h('a', { href: hw.NIST_URL, target: '_blank', rel: 'noopener noreferrer', text: R.link })),
    subtitle(R.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact reference',
        [R.cols.z, R.cols.nist, R.cols.mpmath, R.cols.ours, R.cols.error, R.cols.nistError],
        rows.map((r) => ({
          class: nist.mismatches.some((m) => m.z === r.z) ? 'misprint' : null,
          cells: [{ text: F.plain(r.z), head: true }, { text: r.nist === null ? '-' : F.num(r.nist, 5) }, { text: F.sig(r.mpmath, 16) }, { text: F.sig(r.value, 16) }, { text: F.err(r.error) }, { text: r.nistError === null ? '-' : F.err(r.nistError) }],
        })),
      ),
    ),
    h('p', { text: R.nist(nist) }),
    nist.mismatches.map((m) => h('p', { text: R.mismatch(m) })),
    paras(R.after(rows)),
  ];
}

function updateMethods() {
  const M = text.methods;
  const F = text.fmt;
  const s = computation.shown;
  const rows = view.methodsRows(s);
  fill(
    regions.methods,
    subtitle(M.tableTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact methods',
        [M.cols.method, M.cols.absolute, M.cols.relative, M.cols.exp, M.cols.terms, M.cols.time],
        rows.map((r) => ({ class: r.key === 'ours' ? 'ours' : null, cells: [{ text: text.methodNames[r.key], head: true }, { text: F.err(r.absolute) }, { text: M.relativeCell(r.relative) }, { text: F.int(r.exp) }, { text: r.terms ? F.int(r.terms) : '-' }, { text: M.timeCell(r.time) }] })),
      ),
    ),
    !s && pending(),
    h('div', { class: 'charts' }, figure(M.chartTitle, hw.drawLineChart, view.methodsChart(F.decimal), { wide: true, tipOf: (data) => view.tips.methods(data, text.tips, text.methodNames), items: hw.CDF_METHODS.map((key) => ({ label: text.methodNames[key], color: view.METHOD_STYLE[key].colorIndex, dashed: !!view.METHOD_STYLE[key].dashed })) })),
    paras(M.after(view.methodsFacts(s))),
  );
}

// --- Prova: le monete ------------------------------------------------------------------------------------

const coinClass = (cents) => (cents < 10 ? 'is-copper' : cents < 100 ? 'is-gold' : 'is-bimetal');

function updateCoins() {
  const T = text.tryCoins;
  const F = text.fmt;
  const hand = hw.handful(state.target.seed, state.coins);
  fill(
    regions.coins,
    subtitle(T.orderTitle),
    h('ol', { class: 'coins' }, hand.coins.map((c, i) => h('li', null, h('span', { class: `coin ${coinClass(c)}`, text: T.coinLabel(c) }), h('small', { text: F.euro(hand.running[i]) })))),
    h('p', { class: 'note', text: T.running(hand.total) }),
    subtitle(T.groupTitle),
    h('ul', { class: 'coin-groups' }, hand.groups.map((g) => h('li', null, h('span', { class: `coin ${coinClass(g.value)}`, text: T.coinLabel(g.value) }), h('span', { text: T.groupLine(g) })))),
    h('p', { class: 'caption line', 'aria-live': 'polite', text: T.total(hand) }),
    h('button', { type: 'button', class: 'btn', text: T.another, onclick: () => {
      state.coins += 1;
      updateCoins();
    } }),
  );
}

// --- 2.2 Le funzioni, e quella scritta da chi legge ------------------------------------------------------------------

function functionsBlock() {
  const Fn = text.functions;
  const F = text.fmt;
  return [
    paras(Fn.intro),
    subtitle(Fn.tableTitle),
    table(
      'discussion functions',
      [Fn.cols.name, Fn.cols.interval, Fn.cols.formula, Fn.cols.integral, Fn.cols.feature],
      hw.FUNCTIONS.map((key) => {
        const d = hw.FUNCTION_DEFS[key];
        return { cells: [{ text: text.functionNames[key], head: true }, { text: `[${F.plain(d.a)}, ${F.plain(d.b)}]` }, { node: h('code', { text: d.formula }) }, { text: F.sig(d.exact, 12) }, { text: Fn.features[key] }] };
      }),
    ),
    choices(Fn.chooseLabel, view.FUNCTION_KEYS.map((k) => [k, text.functionNames[k]]), state.fnKey, (k) => {
      state.fnKey = k;
      updateCustom();
      updateFunctionSections();
    }),
    regions.custom,
  ];
}

// il messaggio di un errore della formula: una frase fissa o costruita dall'errore
function formulaMessage(result) {
  const m = text.functions.errors[result.error];
  return typeof m === 'function' ? m(result) : m;
}

function customField(key, id, label, hint, maxLength, mode, wide = false) {
  const input = h('input', { id, type: 'text', inputmode: mode, ...PRIVATE_FIELD, maxlength: maxLength, 'aria-describedby': `${id}-help`, oninput: (e) => changeCustom({ [key]: e.target.value.slice(0, maxLength) }) });
  input.value = state.custom[key];
  const help = h('p', { id: `${id}-help`, class: 'note', text: hint });
  controls.custom[key] = { input, help, hint };
  return h('div', { class: wide ? 'param param-wide' : 'param' }, h('label', { for: id, text: label }), h('span', { class: 'param-row' }, input), help);
}

/** The block of the reader's function: built once when it is chosen, then only its messages change. */
function updateCustom() {
  const Fn = text.functions;
  if (state.fnKey !== hw.CUSTOM) {
    fill(regions.custom);
    controls.custom = {};
    return;
  }
  regions.customNote = h('div');
  fill(
    regions.custom,
    h(
      'div',
      { class: 'custom' },
      subtitle(Fn.customTitle),
      h(
        'div',
        { class: 'params' },
        customField('formula', 'hw5-formula', Fn.formulaLabel, Fn.formulaHint, hw.FORMULA_MAX, 'text', true),
        customField('aText', 'hw5-a', Fn.aLabel, '', view.RANGE_LENGTH, 'decimal'),
        customField('bText', 'hw5-b', Fn.bLabel, '', view.RANGE_LENGTH, 'decimal'),
      ),
      regions.customNote,
    ),
  );
  updateCustomMessages();
}

function changeCustom(patch) {
  Object.assign(state.custom, patch);
  const read = view.readCustom(state.custom);
  const before = state.validCustom;
  if (read.ok) state.validCustom = read;
  updateCustomMessages();
  if (state.validCustom !== before) updateFunctionSections();
}

function updateCustomMessages() {
  const Fn = text.functions;
  const read = view.readCustom(state.custom);
  const keyOf = { formula: 'formula', a: 'aText', b: 'bText' };
  for (const [key, field] of Object.entries(controls.custom)) {
    const error = !read.ok && keyOf[read.field] === key ? formulaMessage(read) : null;
    field.input.setAttribute('aria-invalid', String(Boolean(error)));
    field.help.className = error ? 'field-error' : 'note';
    field.help.textContent = error || field.hint;
  }
  const changed = state.custom.formula !== view.DEFAULT_CUSTOM.formula || state.custom.aText !== view.DEFAULT_CUSTOM.aText || state.custom.bText !== view.DEFAULT_CUSTOM.bText;
  const note = read.ok ? Fn.customNote(read) : '';
  fill(
    regions.customNote,
    !read.ok && h('p', { class: 'stale', role: 'status', text: Fn.stale }),
    note && h('p', { class: 'note', text: note }),
    changed && h('button', { type: 'button', class: 'btn alt', text: Fn.restore, onclick: () => {
      state.custom = { ...view.DEFAULT_CUSTOM };
      for (const [key, field] of Object.entries(controls.custom)) field.input.value = state.custom[key];
      changeCustom({});
    } }),
  );
}

// --- La funzione scelta: Riemann, Lebesgue, la prova e il confronto ----------------------------------------------------

let specCache = { key: null, custom: null, spec: null, reference: null };

/** The function of Exercise 1 and its reference integral, computed again only when the choice changes. */
function current() {
  if (specCache.key !== state.fnKey || specCache.custom !== state.validCustom) {
    const spec = view.specOf(state.fnKey, state.validCustom);
    specCache = { key: state.fnKey, custom: state.validCustom, spec, reference: view.referenceOf(spec) };
  }
  return specCache;
}

function updateFunctionSections() {
  updateRiemann();
  updateLebesgue();
  updateSlices();
  updateResultsTable();
  updateCompare();
  updateEfficiency();
}

const sumCells = (r, keys, F) => keys.map((k) => ({ text: k === 'gap' ? F.err(r[k]) : F.sig(r[k], 9) }));

function updateRiemann() {
  const R = text.riemann;
  const F = text.fmt;
  const { spec, reference } = current();
  const kind = state.riemannKind;
  const name = text.functionNames[state.fnKey];
  const chart = view.integralChart(spec, 'riemann', { n: 10, kind }, F.decimal);
  const rows = view.riemannRows(spec);
  const keys = ['left', 'right', 'midpoint', 'lower', 'upper', 'gap'];
  fill(
    regions.riemann,
    h('div', { class: 'charts' }, figure(R.chartTitle(name, 10, kind), hw.drawIntegral, chart.chart, { wide: true, tip: view.tips.strip(chart.chart, text.tips) })),
    subtitle(R.tableTitle(reference)),
    table('discussion sums', [R.cols.n, ...keys.map((k) => R.cols[k])], rows.map((r) => ({ cells: [{ text: String(r.n), head: true }, ...sumCells(r, keys, F)] }))),
    h('p', { class: 'note', text: R.note }),
    paras(R.after(rows, state.fnKey)),
  );
}

function updateLebesgue() {
  const L = text.lebesgue;
  const F = text.fmt;
  const { spec, reference } = current();
  const name = text.functionNames[state.fnKey];
  const chart = view.integralChart(spec, 'lebesgue', { K: 10 }, F.decimal);
  const rows = view.lebesgueRows(spec);
  const keys = ['lower', 'upper', 'midpoint', 'gap'];
  const dist = view.distributionChart(spec, F.decimal);
  const rear = view.rearrangementChart(spec, F.decimal);
  fill(
    regions.lebesgue,
    h('div', { class: 'charts' }, figure(L.chartTitle(name, 10), hw.drawIntegral, chart.chart, { wide: true, tip: view.tips.level(chart.chart, text.tips) })),
    subtitle(L.tableTitle(reference)),
    table('discussion sums', [L.cols.K, ...keys.map((k) => L.cols[k])], rows.map((r) => ({ cells: [{ text: String(r.K), head: true }, ...sumCells(r, keys, F)] }))),
    state.fnKey === 'unbounded' && h('p', { class: 'note', text: L.capNote(spec.cap, 2 - 1 / spec.cap) }),
    h(
      'div',
      { class: 'charts' },
      figure(L.distributionTitle, hw.drawLineChart, dist, { tip: view.tips.distribution(dist, text.tips) }),
      figure(L.rearrangementTitle, hw.drawLineChart, rear.chart, { tip: view.tips.rearrangement(rear.chart, text.tips) }),
    ),
    paras(L.after(rows, state.fnKey)),
  );
}

const trySlices = { riemann: null, lebesgue: null, n: null, K: null, play: null, line: null };

function trySlicesBlock() {
  const T = text.trySlices;
  regions.slicesCharts = h('div', { class: 'charts' });
  trySlices.n = slider('hw5-slices-n', (i) => {
    stopSlices();
    state.slices.n = i + 1;
    updateSlices();
  });
  trySlices.K = slider('hw5-slices-k', (i) => {
    stopSlices();
    state.slices.K = i + 1;
    updateSlices();
  });
  trySlices.play = h('button', { type: 'button', class: 'btn', text: T.play, onclick: toggleSlices });
  trySlices.line = h('p', { class: 'caption line', 'aria-live': 'polite' });
  trySlices.riemann = null;
  trySlices.lebesgue = null;
  return h(
    'div',
    { class: 'try' },
    title('hw5-try-slices', 2, text.sections.trySlices),
    paras(T.intro),
    h('div', { class: 'slider-row' }, trySlices.n.el, trySlices.K.el, trySlices.play),
    regions.slicesCharts,
    trySlices.line,
  );
}

function updateSlices() {
  const T = text.trySlices;
  const F = text.fmt;
  const { spec, reference } = current();
  const { n, K } = state.slices;
  const r = view.integralChart(spec, 'riemann', { n, kind: 'midpoint' }, F.decimal);
  const l = view.integralChart(spec, 'lebesgue', { K }, F.decimal);
  // the two figures are kept while only n and K change; a new function rebuilds them
  if (!trySlices.riemann || trySlices.spec !== spec) {
    trySlices.riemann = figure(T.riemannTitle(n), hw.drawIntegral, r.chart, { tip: view.tips.strip(r.chart, text.tips) });
    trySlices.lebesgue = figure(T.lebesgueTitle(K), hw.drawIntegral, l.chart, { tip: view.tips.level(l.chart, text.tips) });
    trySlices.spec = spec;
    fill(regions.slicesCharts, trySlices.riemann, trySlices.lebesgue);
  } else {
    refreshFigure(trySlices.riemann, T.riemannTitle(n), r.chart, view.tips.strip(r.chart, text.tips));
    refreshFigure(trySlices.lebesgue, T.lebesgueTitle(K), l.chart, view.tips.level(l.chart, text.tips));
  }
  trySlices.n.set(SLICES_MAX - 1, n - 1, T.nLabel(n));
  trySlices.K.set(SLICES_MAX - 1, K - 1, T.kLabel(K));
  trySlices.play.textContent = state.slices.playing ? T.pause : T.play;
  trySlices.line.setAttribute('aria-live', state.slices.playing ? 'off' : 'polite');
  trySlices.line.textContent = T.values(r.sums, l.sums, reference);
}

function stopSlices() {
  state.slices.playing = false;
  clearTimeout(timers.slices);
}

function toggleSlices() {
  const sl = state.slices;
  if (sl.playing) {
    stopSlices();
    updateSlices();
    return;
  }
  if (sl.n >= SLICES_MAX && sl.K >= SLICES_MAX) {
    sl.n = 1;
    sl.K = 1;
  }
  sl.playing = true;
  updateSlices();
  const tick = () => {
    timers.slices = setTimeout(() => {
      if (!sl.playing) return;
      sl.n = Math.min(SLICES_MAX, sl.n + 1);
      sl.K = Math.min(SLICES_MAX, sl.K + 1);
      if (sl.n >= SLICES_MAX && sl.K >= SLICES_MAX) sl.playing = false;
      updateSlices();
      if (sl.playing) tick();
    }, 380);
  };
  tick();
}

function updateCompare() {
  const C = text.compare;
  const F = text.fmt;
  const s = computation.shown;
  const name = text.functionNames[state.fnKey];
  // the nine functions come with the simulation; the reader's one is compared here
  const study = state.fnKey === hw.CUSTOM ? customStudy() : s ? s.compare[state.fnKey] : null;
  const summary = s ? view.summaryRows(s) : null;
  fill(
    regions.compare,
    state.fnKey === hw.CUSTOM && h('p', { class: 'note', text: C.customPending }),
    !study
      ? pending()
      : [
        h(
          'div',
          { class: 'charts' },
          figure(C.chartTitle(name), hw.drawLineChart, view.compareChart(study, F.decimal), {
            wide: true,
            tip: view.tips.compare(study, text.tips),
            link: view.links.compare,
            items: [{ label: C.legend[0], color: 1 }, { label: C.legend[1], color: 0 }, { label: C.legend[2], color: 1, dashed: true }, { label: C.legend[3], color: 0, dashed: true }],
          }),
        ),
        subtitle(C.tableTitle),
        h(
          'div',
          { class: 'scroll' },
          table(
            'compact compare',
            [C.cols.n, C.cols.riemann, C.cols.lebesgue, C.cols.riemannGap, C.cols.lebesgueGap],
            study.rows.map((r) => ({
              cells: [
                { text: F.int(r.n), head: true },
                { text: F.err(r.errors.riemann), class: r.errors.riemann < r.errors.lebesgue ? 'win' : null },
                { text: F.err(r.errors.lebesgue), class: r.errors.lebesgue < r.errors.riemann ? 'win' : null },
                { text: F.err(r.gaps.riemann) },
                { text: F.err(r.gaps.lebesgue) },
              ],
            })),
            view.LINKED_TABLES.compare,
          ),
        ),
        paras(C.after(view.compareFacts(study), name)),
      ],
    summary && [
      subtitle(C.summaryTitle),
      table(
        'discussion summary-compare',
        [C.summaryCols.name, C.summaryCols.riemannSmall, C.summaryCols.lebesgueSmall, C.summaryCols.riemannLarge, C.summaryCols.lebesgueLarge, C.summaryCols.orderRiemann, C.summaryCols.orderLebesgue, C.summaryCols.winner],
        summary.map((r) => ({ cells: [{ text: text.functionNames[r.key], head: true }, { text: F.err(r.small.riemann) }, { text: F.err(r.small.lebesgue) }, { text: F.err(r.large.riemann) }, { text: F.err(r.large.lebesgue) }, { text: C.orderCell(r.orders.riemann) }, { text: C.orderCell(r.orders.lebesgue) }, { text: r.winner === 'lebesgue' ? 'Lebesgue' : 'Riemann' }] })),
      ),
      paras(C.summaryAfter(summary)),
    ],
  );
}

// --- 2.6 Il traffico ---------------------------------------------------------------------------------------

function trafficBlock() {
  const T = text.traffic;
  const F = text.fmt;
  const report = hw.trafficReport();
  const chart = view.trafficChart(report, F.decimal);
  const duration = view.durationChart(F.decimal);
  return [
    paras(T.intro),
    h('div', { class: 'charts' }, figure(T.chartTitle, hw.drawIntegral, chart, { wide: true, tip: view.tips.traffic(chart, text.tips) })),
    subtitle(T.tableTitle),
    table(
      'discussion traffic',
      [T.cols.y, T.cols.hours, T.cols.minutes, T.cols.when],
      report.rows.map((r) => ({ cells: [{ text: F.int(r.y), head: true }, { text: F.num(r.hours, 3) }, { text: F.num(r.hours * 60, 1) }, { text: r.intervals.map(([a, b]) => `${view.clock(a)}-${view.clock(b)}`).join(', ') }] })),
    ),
    h('div', { class: 'charts' }, figure(T.durationTitle, hw.drawLineChart, duration, { wide: true, tip: view.tips.duration(duration, text.tips) })),
    paras(T.after(report)),
  ];
}

// --- 2.7 Monte Carlo e la prova dal vivo ----------------------------------------------------------------------

function updateMc() {
  const M = text.montecarlo;
  const F = text.fmt;
  const s = computation.shown;
  if (!s) {
    fill(regions.mc, pending());
    return;
  }
  const hist = view.mcHistogram(s, state.histKey, F.decimal);
  fill(
    regions.mc,
    subtitle(M.tableTitle(s)),
    table(
      'discussion mc',
      [M.cols.name, M.cols.exact, M.cols.mean, M.cols.sd, M.cols.se, M.cols.coverage],
      view.mcRows(s).map((r) => ({ cells: [{ text: text.functionNames[r.key], head: true }, { text: F.sig(r.exact, 8) }, { text: F.sig(r.mean, 8) }, { text: F.sig(r.sd, 4) }, { text: F.sig(r.meanSe, 4) }, { text: F.pct(r.coverage, 1), class: r.coverageTest.verdict === 'reject' ? 'over' : null }] })),
    ),
    choices(M.chooseLabel, hw.FUNCTIONS.map((k) => [k, text.functionNames[k]]), state.histKey, (k) => {
      state.histKey = k;
      updateMc();
    }),
    h('div', { class: 'charts' }, figure(M.histogramTitle(text.functionNames[state.histKey], s), hw.drawHistogram, hist, { wide: true, tip: view.tips.histogram(hist, text.tips), items: [{ label: M.legend[0], color: 0 }, { label: M.legend[1], color: 2 }, { label: M.legend[2], color: 1, dashed: true }] })),
    tests('coverage', s),
    paras(M.after(s)),
  );
}

const tryMc = { fig: null, play: null, line: null, run: null };

function tryMcBlock() {
  const T = text.tryMc;
  regions.tryMcChoice = h('div');
  tryMc.play = h('button', { type: 'button', class: 'btn', text: T.play, onclick: toggleMc });
  tryMc.line = h('p', { class: 'caption line', 'aria-live': 'polite' });
  tryMc.run = view.mcPath(state.target.seed, state.mc.key, state.mc.draw);
  tryMc.fig = figure(T.chartTitle(text.functionNames[state.mc.key]), hw.drawLineChart, view.mcPathChart(tryMc.run, state.mc.shown, text.fmt.decimal), { wide: true, tip: view.tips.mcPath(tryMc.run, text.tips), items: [{ label: T.legend[0], color: 0 }, { label: T.legend[1], color: 1, dashed: true }] });
  return h(
    'div',
    { class: 'try' },
    title('hw5-try-mc', 2, text.sections.tryMc),
    paras(T.intro),
    choices(T.chooseLabel, hw.FUNCTIONS.map((k) => [k, text.functionNames[k]]), state.mc.key, (k) => {
      state.mc.key = k;
      resetMc();
    }),
    h('div', { class: 'slider-row' }, h('span', { class: 'buttons' }, tryMc.play, h('button', { type: 'button', class: 'btn alt', text: T.again, onclick: () => {
      state.mc.draw += 1;
      resetMc();
    } }))),
    h('div', { class: 'charts' }, tryMc.fig),
    tryMc.line,
  );
}

function stopMc() {
  state.mc.playing = false;
  clearTimeout(timers.mc);
}

/** A new run of the live example: another function, another draw or another seed. */
function resetMc() {
  stopMc();
  state.mc.shown = 0;
  tryMc.run = view.mcPath(state.target.seed, state.mc.key, state.mc.draw);
  updateTryMc();
}

function updateTryMc() {
  const T = text.tryMc;
  const run = tryMc.run;
  const shown = state.mc.shown;
  refreshFigure(tryMc.fig, T.chartTitle(text.functionNames[state.mc.key]), view.mcPathChart(run, shown, text.fmt.decimal), view.tips.mcPath(run, text.tips));
  tryMc.play.textContent = state.mc.playing ? T.pause : T.play;
  tryMc.line.setAttribute('aria-live', state.mc.playing ? 'off' : 'polite');
  tryMc.line.textContent = T.status(shown > 0 ? run.path[shown - 1] : null, run.exact);
}

function toggleMc() {
  const mc = state.mc;
  const last = tryMc.run.path.length;
  if (mc.playing) {
    stopMc();
    updateTryMc();
    return;
  }
  if (mc.shown >= last) mc.shown = 0;
  mc.playing = true;
  updateTryMc();
  const tick = () => {
    timers.mc = setTimeout(() => {
      if (!mc.playing) return;
      mc.shown = Math.min(last, mc.shown + 1);
      if (mc.shown >= last) mc.playing = false;
      updateTryMc();
      if (mc.playing) tick();
    }, 160);
  };
  tick();
}

// --- 2.8 Dirichlet ---------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 3, 4 e 5
// ---------------------------------------------------------------------------

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section' }, title('hw5-tests', 0, text.sections.tests), regions.tests);
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
    paras(T.after(summary)),
  );
}

function historySection() {
  const H = text.history;
  return h(
    'section',
    { class: 'section' },
    title('hw5-history', 0, text.sections.history),
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

// i fatti delle conclusioni che non dipendono dalle simulazioni
let staticFacts = null;

function conclusionSection() {
  regions.conclusion = h('div');
  return h('section', { class: 'section' }, title('hw5-conclusion', 0, text.sections.conclusion), regions.conclusion);
}

function updateConclusion() {
  if (!staticFacts) staticFacts = { ...view.convergenceFacts(hw.convergenceStudy()), tailTotal: view.tailFacts(hw.tailRows()).total, nist: view.referenceFacts().nist };
  fill(regions.conclusion, paras(text.conclusion(computation.shown, staticFacts)));
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

// gli ultimi risultati restano in memoria
function remember(key, value) {
  results.delete(key);
  results.set(key, value);
  while (results.size > 4) results.delete(results.keys().next().value);
}

/** Computes the parameters of state.target; the computation still running for other parameters stops at its next slice. */
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
  updateData();
  updateResultsTable();
  updateCompare();
  updateEfficiency();
  updateOurs();
  updateMethods();
  updateMc();
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
  document.title = 'Homework #5 - Statistics';
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
  text = HW5_TEXTS[state.lang];
  stopSlices();
  stopMc();
  controls.fields = {};
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), exercise1Section(), exercise2Section(), checksSection(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateArea();
  updateInfinity();
  updateInputs();
  updateVerify();
  updateCoins();
  updateCustom();
  updateFunctionSections();
  updateTryMc();
  updateResults();
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
  // i colori dei grafici e delle legende seguono il tema del sistema
  darkQuery.addEventListener('change', render);
  render();
  // le verifiche e le simulazioni partono dopo il primo disegno della pagina
  setTimeout(() => {
    try {
      checkRows = hw.verifyAll();
    } catch (error) {
      checkRows = [{ group: 'quadrature', name: text.ui.error(message(error)), expected: '', actual: '', ok: false }];
    }
    updateVerify();
    startComputation();
  }, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
