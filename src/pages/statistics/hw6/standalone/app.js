// src/pages/statistics/hw6/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework6.js, con i record di NSL-KDD). La build
// (build/homework-standalone.js) lo unisce a view.js e texts.js in un unico
// app.js, uno script classico che si apre anche da file:// con un doppio
// clic su index.html.
//
// Ogni calcolo dura pochi millisecondi: il test di permutazione avanza un
// poco a ogni fotogramma, cosi' l'istogramma cresce sotto gli occhi.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
import * as hw from '../homework6.js';
import * as view from '../view.js';
import { HW6_TEXTS, originalAssignment } from '../texts.js';

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

const startCells = () => view.TRY_COUNTS.map((row) => row.map(String));

const state = {
  lang: initialLanguage(),
  // la coppia (X, F) della sezione 1
  choice: { x: hw.DEFAULT_PAIR.x, f: hw.DEFAULT_PAIR.f, merge: false },
  profile: 'rows',
  // la modalita' di X del grafico di 1.4: null, quella della cella piu' lontana dall'indipendenza
  expectedRow: null,
  tryTable: { mode: 'grid', cells: startCells(), pairs: null, header: false },
  small: { n: view.SMALL_DEFAULT, draw: 0 },
  perm: { n: view.PERMUTATION_DEFAULT.n, B: view.PERMUTATION_DEFAULT.B, draw: 0 },
  dependence: { theta: hw.THETAS.indexOf(view.DEPENDENCE_DEFAULT.theta), n: hw.DEPENDENCE_SIZES.indexOf(view.DEPENDENCE_DEFAULT.n) },
  simpson: 'all',
};
let text = HW6_TEXTS[state.lang];
const regions = {};
let pair = null; // { key, codes, s, choice }
let checkRows = null;
// il test di permutazione: il fotogramma in attesa, il risultato dell'ultima corsa finita
const perm = { frame: 0, result: null, fig: null, line: null };

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

const paras = (list) => (Array.isArray(list) ? list : [list]).filter(Boolean).map((t) => h('p', { text: t }));
const title = (id, level, label) => h(HEADINGS[level], { id, tabindex: -1, class: 'anchor', text: label });
const subtitle = (label) => h('p', { class: 'table-title' }, h('strong', { text: label }));
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad' }, h('strong', { text: label }));
const formulas = (content) => h('pre', { text: content });
const caption = (...children) => h('div', { class: 'caption line', 'aria-live': 'polite' }, children);
const range = (n) => Array.from({ length: n }, (_, i) => i);

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

// what the reader hid in the legends of the charts that are built again (another pair, a slider)
const kept = { conditional: new Set(), expected: new Set(), permutation: new Set(), dependence: new Set(), simpson: new Set() };

/** The parts of the drawing covered by the hidden items of a legend. */
const partsOf = (items, hidden) => items.flatMap((item, i) => (hidden.has(i) ? item.parts || [] : []));

/**
 * The legend of a chart: { label, color? | paletteKey?, dashed?, box?,
 * parts }. Every item is a button: pressed (as the page opens) its parts
 * are on screen, released they are hidden; onChange(parts) receives the
 * hidden parts after every press. `hidden`, the set of the hidden items,
 * outlives the legend when its chart is built again.
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

/** Hides the cells and rows of a table that belong to hidden parts (data-part), and shows the others. */
function hideParts(tableEl, parts) {
  for (const el of tableEl.querySelectorAll('[data-part]')) el.hidden = parts.includes(el.dataset.part);
}

/** Hides parts of a chart. */
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
 * tied to the chart; `keep` is the set of hidden items that outlives the
 * chart.
 */
function figure(label, draw, data, { wide = false, tip = null, items = null, note = null, link = null, onHide = null, keep = null } = {}) {
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': label });
  const hidden = keep || new Set();
  const chart = { draw, data, width: -1, detach: null, link, tip, hidden: items ? partsOf(items, hidden) : [] };
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
        hidden,
      ),
    h('p', { class: 'figure-note', text: note || '', hidden: !note }),
    h('figcaption', { text: label }),
  );
  attachTip(canvas, chart);
  charts.set(canvas, chart);
  resizer.observe(canvas);
  return fig;
}

/** Redraws a chart in place, with new data, label and note, without replacing its canvas (no flicker while it grows); the hidden parts stay hidden. */
function refreshFigure(fig, label, data, tip, note = null) {
  const canvas = fig.querySelector('canvas.chart');
  const chart = charts.get(canvas);
  if (!chart) return;
  chart.data = data;
  chart.tip = tip;
  attachTip(canvas, chart);
  canvas.setAttribute('aria-label', label);
  fig.querySelector('figcaption').textContent = label;
  const noteEl = fig.querySelector('.figure-note');
  noteEl.textContent = note || '';
  noteEl.hidden = !note;
  redraw(canvas, chart);
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

/**
 * A table: column headers, then rows of cells, each { text | node, class?,
 * head?, part? } (head: a row header, th); `id` for a table tied to a
 * chart (view.LINKED_TABLES). `columns` gives the part of the chart each
 * column belongs to: hideParts() hides them with their part of the chart.
 */
function table(className, headers, rows, id = null, columns = []) {
  return h(
    'table',
    { id, class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x, i) => h('th', { scope: 'col', text: x, 'data-part': columns[i] || null })))),
    h(
      'tbody',
      null,
      rows.map((row) => h(
        'tr',
        { class: row.class || null },
        row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { scope: cell.head ? 'row' : null, 'data-label': cell.head ? null : headers[i], class: cell.class || null, 'data-part': columns[i] || null, 'data-diff': cell.diff ? 'true' : null }, cell.node || cell.text)),
      )),
    ),
  );
}

/**
 * A two-way table: the levels of X on the rows, those of F on the columns,
 * with the totals when `totals` gives them ({ row(i), col(j), all }).
 * `colPart(j)` names the part of a chart a column belongs to (the legend
 * hides it); `cellClass` colours the residuals.
 */
function matrix({ id = null, caption: label = null, corner = '', rows, cols, rowName, colName, cell, cellClass = null, totals = null, totalLabel = '', className = '', colPart = null, marginRow = null }) {
  const part = (j) => (colPart ? colPart(j) : null);
  const el = h(
    'table',
    { id, class: `table compact matrix ${className}` },
    h('thead', null, h('tr', null, h('th', { scope: 'col', text: corner }), cols.map((j) => h('th', { scope: 'col', text: colName(j), 'data-part': part(j) })), totals && h('th', { scope: 'col', class: 'total', text: totalLabel }))),
    h(
      'tbody',
      null,
      rows.map((i) => h('tr', null, h('th', { scope: 'row', text: rowName(i) }), cols.map((j) => h('td', { class: (cellClass && cellClass(i, j)) || null, 'data-part': part(j), text: cell(i, j) })), totals && h('td', { class: 'total', text: totals.row(i) }))),
      marginRow && h('tr', { class: 'margin-row' }, h('th', { scope: 'row', text: marginRow.name }), cols.map((j) => h('td', { 'data-part': part(j), text: marginRow.cell(j) })), totals && h('td', { class: 'total', text: marginRow.total })),
    ),
    totals && totals.col && h('tfoot', null, h('tr', null, h('th', { scope: 'row', text: totalLabel }), cols.map((j) => h('td', { 'data-part': part(j), text: totals.col(j) })), h('td', { class: 'total', text: totals.all }))),
  );
  return [label && subtitle(label), h('div', { class: 'scroll' }, el)];
}

/** A choice among a few values: the pressed button is the active one; set(value) moves it from outside. */
function choices(label, options, value, onChange) {
  const buttons = options.map(([key, name]) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(key === value), text: name, onclick: () => select(key) }));
  const set = (key) => options.forEach(([k], i) => buttons[i].setAttribute('aria-pressed', String(k === key)));
  function select(key) {
    set(key);
    onChange(key);
  }
  const el = h('div', { class: 'choices', role: 'group', 'aria-label': label }, h('span', { class: 'choices-label', text: label }), buttons);
  el.set = set;
  return el;
}

/** A slider on indices from 0 to max. */
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

// ---------------------------------------------------------------------------
// La coppia (X, F) e i suoi numeri
// ---------------------------------------------------------------------------

function computePair() {
  const { x, f, merge } = state.choice;
  const codes = hw.pairCodes(x, f, { merge });
  const s = hw.tableStats(hw.contingency(codes.x, codes.f, codes.xLevels.length, codes.fLevels.length));
  pair = { key: `${x}|${f}|${merge ? 1 : 0}`, codes, s, choice: { ...state.choice } };
}

const names = () => view.pairNames(pair.codes, text);
const varNames = () => ({ x: text.names.variables[pair.choice.x], f: text.names.variables[pair.choice.f] });
const corner = () => `${varNames().x} \\ ${varNames().f}`;

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw6-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      h('p', { class: 'note', text: text.assignment.originalNote }),
      h('blockquote', { lang: 'en' }, originalAssignment().map((block) => (block.type === 'title' ? h('p', null, h('strong', { text: block.text })) : h('p', { text: block.text })))),
    ),
  );
}

// ---------------------------------------------------------------------------
// 1.1 Il dataset e la scelta di X e F
// ---------------------------------------------------------------------------

function datasetBlock() {
  const D = text.dataset;
  const F = text.fmt;
  const variables = hw.VARIABLES.map((v) => [v, text.names.variables[v]]);
  let xChoices = null;
  let fChoices = null;
  // X e F devono essere diverse: scegliere per X la variabile di F le scambia
  const choose = (axis) => (v) => {
    const other = axis === 'x' ? 'f' : 'x';
    if (v === state.choice[other]) state.choice[other] = state.choice[axis];
    state.choice[axis] = v;
    xChoices.set(state.choice.x);
    fChoices.set(state.choice.f);
    changePair();
  };
  xChoices = choices(D.xLabel, variables, state.choice.x, choose('x'));
  fChoices = choices(D.fLabel, variables, state.choice.f, choose('f'));
  const merge = h('button', {
    type: 'button',
    class: 'btn alt',
    'aria-pressed': String(state.choice.merge),
    text: D.mergeLabel,
    onclick: () => {
      state.choice.merge = !state.choice.merge;
      merge.setAttribute('aria-pressed', String(state.choice.merge));
      changePair();
      updatePairs();
    },
  });
  const records = hw.firstRecords(8);
  const flagLevels = hw.variableLevels('flag');
  const flagCounts = new Array(flagLevels.length).fill(0);
  for (const v of hw.variableCodes('flag')) flagCounts[v]++;
  return [
    h('p', { text: D.intro }),
    xChoices,
    fChoices,
    h('div', { class: 'choices', role: 'group', 'aria-label': D.levelsLabel }, h('span', { class: 'choices-label', text: D.levelsLabel }), merge),
    subtitle(D.sampleTitle),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact',
        ['n', 'protocol', 'service', 'flag', 'label', 'class'].map((k) => D.sampleCols[k]),
        records.map((r, i) => ({ cells: [{ head: true, text: String(i + 1) }, { text: r.protocol }, { text: r.service }, { text: r.flag }, { text: r.label }, { text: text.names.classes[r.class] }] })),
      ),
    ),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: D.categoriesTitle }),
      h('p', { text: D.categoriesIntro }),
      h(
        'div',
        { class: 'scroll' },
        table(
          'compact',
          ['label', 'count', 'category', 'source'].map((k) => D.categoryCols[k]),
          hw.labelCounts().map((l) => ({ cells: [{ head: true, text: l.label }, { text: F.int(l.count) }, { text: text.names.classes[l.category] }, { text: D.sources[l.source] }] })),
        ),
      ),
    ),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: D.flagsTitle }),
      h(
        'div',
        { class: 'scroll' },
        table(
          'compact',
          [D.sampleCols.flag, D.categoryCols.count, ''],
          flagLevels.map((flag, i) => ({ cells: [{ head: true, text: flag }, { text: F.int(flagCounts[i]) }, { text: D.flags[flag] }] })),
        ),
      ),
    ),
    h('p', { class: 'note', text: D.citation }),
    h('p', { class: 'buttons' }, h('a', { href: hw.DATA_SOURCE.url, target: '_blank', rel: 'noopener noreferrer', text: D.datasetLink }), h('a', { href: hw.DATA_SOURCE.paperUrl, target: '_blank', rel: 'noopener noreferrer', text: D.paperLink })),
  ];
}

// ---------------------------------------------------------------------------
// 1.2 - 1.5: la tabella, le frequenze, le attese, il chi quadrato
// ---------------------------------------------------------------------------

function contingencyBlock() {
  const T = text.table;
  const F = text.fmt;
  const { s } = pair;
  const n = names();
  const empty = [];
  for (const i of s.rows) for (const j of s.cols) if (s.counts[i][j] === 0) empty.push(`${n.x[i]} / ${n.f[j]}`);
  return [
    h('p', { text: T.intro }),
    formulas(T.formulas),
    matrix({
      caption: T.title(varNames().x, varNames().f),
      corner: corner(),
      rows: range(s.counts.length),
      cols: range(s.counts[0].length),
      rowName: (i) => n.x[i],
      colName: (j) => n.f[j],
      cell: (i, j) => F.int(s.counts[i][j]),
      cellClass: (i, j) => (s.counts[i][j] === 0 ? 'is-zero' : null),
      totals: { row: (i) => F.int(s.rowTotals[i]), col: (j) => F.int(s.colTotals[j]), all: F.int(s.N) },
      totalLabel: text.ui.total,
    }),
    empty.length > 0 && h('p', { text: T.empty(empty.slice(0, 8).join(', ') + (empty.length > 8 ? ', ...' : '')) }),
  ];
}

function marginalTable(label, levels, totals, shares) {
  const C = text.frequencies.marginalCols;
  const F = text.fmt;
  return h('div', null, subtitle(label), h('div', { class: 'scroll' }, table('compact num', [C.level, C.count, C.share], levels.map((name, i) => ({ cells: [{ head: true, text: name }, { text: F.int(totals[i]) }, { text: F.pct(shares[i]) }] })))));
}

function frequenciesBlock() {
  const Q = text.frequencies;
  const F = text.fmt;
  const { s } = pair;
  const n = names();
  const items = view.legends.conditional(s, n);
  const profilesRegion = h('div');
  const colPart = (j) => `seg:${s.cols.indexOf(j)}`;
  const drawProfiles = () => {
    const rows = state.profile === 'rows';
    const content = rows
      ? matrix({
        id: view.LINKED_TABLES.profiles,
        caption: Q.rowsTitle,
        corner: corner(),
        rows: s.rows,
        cols: s.cols,
        rowName: (i) => n.x[i],
        colName: (j) => n.f[j],
        cell: (i, j) => F.pct(s.rowProfiles[i][j]),
        totals: { row: (i) => F.int(s.rowTotals[i]) },
        totalLabel: Q.marginalCols.count,
        colPart,
        marginRow: { name: text.names.all, cell: (j) => F.pct(s.colShares[j]), total: F.int(s.N) },
      })
      : matrix({
        caption: Q.colsTitle,
        corner: corner(),
        rows: s.rows,
        cols: s.cols,
        rowName: (i) => n.x[i],
        colName: (j) => n.f[j],
        cell: (i, j) => F.pct(s.colProfiles[i][j]),
        totals: { row: (i) => F.pct(s.rowShares[i]), col: (j) => F.int(s.colTotals[j]), all: F.int(s.N) },
        totalLabel: text.names.all,
        colPart,
      });
    fill(profilesRegion, content);
    hideParts(profilesRegion, partsOf(items, kept.conditional));
  };
  drawProfiles();
  const gap = view.profileGap(s);
  return [
    h('p', { text: Q.intro }),
    formulas(Q.formulas),
    h('div', { class: 'pair' }, marginalTable(Q.marginalTitle(varNames().x), s.rows.map((i) => n.x[i]), s.rows.map((i) => s.rowTotals[i]), s.rows.map((i) => s.rowShares[i])), marginalTable(Q.marginalTitle(varNames().f), s.cols.map((j) => n.f[j]), s.cols.map((j) => s.colTotals[j]), s.cols.map((j) => s.colShares[j]))),
    choices(Q.profileLabel, [['rows', Q.profiles.rows], ['cols', Q.profiles.cols]], state.profile, (v) => {
      state.profile = v;
      drawProfiles();
    }),
    profilesRegion,
    h(
      'div',
      { class: 'charts' },
      figure(Q.chartTitle, hw.drawStackedBars, view.conditionalChart(s, n, text), {
        wide: true,
        tip: view.tips.conditional(s, n, text.tips),
        items,
        keep: kept.conditional,
        link: view.links.profiles,
        onHide: (parts) => hideParts(profilesRegion, parts),
      }),
    ),
    gap && h('p', { text: Q.after({ x: n.x[gap.i], f: n.f[gap.j], share: gap.share, marginal: gap.marginal }) }),
  ];
}

function expectedBlock() {
  const E = text.expected;
  const F = text.fmt;
  const { s } = pair;
  const n = names();
  const extreme = view.extremeCell(s);
  if (state.expectedRow === null || !s.rows.includes(state.expectedRow)) state.expectedRow = extreme ? extreme.i : s.rows[0];
  const items = view.legends.expected(text);
  const compareRegion = h('div');
  let fig = null;
  const hideCompare = (parts) => {
    hideParts(compareRegion, parts);
    for (const el of compareRegion.querySelectorAll('[data-diff]')) el.hidden = parts.includes('series:0') || parts.includes('series:1');
  };
  const drawRow = () => {
    const row = state.expectedRow;
    fill(
      compareRegion,
      h(
        'div',
        { class: 'scroll' },
        table(
          'compact num',
          [E.cols.level, E.cols.observed, E.cols.expected, E.cols.difference],
          s.cols.map((j) => ({ cells: [{ head: true, text: n.f[j] }, { text: F.int(s.counts[row][j]) }, { text: F.num(s.expected[row][j], 1) }, { text: F.num(s.counts[row][j] - s.expected[row][j], 1), diff: true }] })),
          view.LINKED_TABLES.expected,
          [null, 'series:0', 'series:1', null],
        ),
      ),
    );
    // l'intestazione della differenza sparisce con le sue celle
    compareRegion.querySelector('thead th:last-child').dataset.diff = 'true';
    hideCompare(partsOf(items, kept.expected));
    if (fig) refreshFigure(fig, E.chartTitle(n.x[row]), view.expectedChart(s, row, n, F.decimal), view.tips.expected(s, row, n, text.tips));
  };
  drawRow();
  fig = figure(E.chartTitle(n.x[state.expectedRow]), hw.drawGroupedBars, view.expectedChart(s, state.expectedRow, n, F.decimal), {
    wide: true,
    tip: view.tips.expected(s, state.expectedRow, n, text.tips),
    items,
    keep: kept.expected,
    link: view.links.expected,
    onHide: hideCompare,
  });
  return [
    h('p', { text: E.intro }),
    formulas(E.formulas),
    matrix({
      caption: E.tableTitle,
      corner: corner(),
      rows: range(s.counts.length),
      cols: range(s.counts[0].length),
      rowName: (i) => n.x[i],
      colName: (j) => n.f[j],
      cell: (i, j) => F.num(s.expected[i][j], 1),
      totals: { row: (i) => F.int(s.rowTotals[i]), col: (j) => F.int(s.colTotals[j]), all: F.int(s.N) },
      totalLabel: text.ui.total,
    }),
    h('p', { class: 'note', text: E.note }),
    choices(E.chooseLabel, s.rows.map((i) => [i, n.x[i]]), state.expectedRow, (v) => {
      state.expectedRow = v;
      drawRow();
    }),
    compareRegion,
    h('div', { class: 'charts' }, fig),
    extreme && h('p', { text: E.after({ x: n.x[extreme.i], f: n.f[extreme.j], o: extreme.o, e: extreme.e }) }),
  ];
}

function chi2Block() {
  const C = text.chi2;
  const F = text.fmt;
  const { s } = pair;
  const n = names();
  if (!s.testable) return h('p', { text: C.notTestable });
  return [
    h('p', { text: C.intro }),
    formulas(C.formulas),
    matrix({
      caption: C.contributionsTitle,
      corner: corner(),
      rows: s.rows,
      cols: s.cols,
      rowName: (i) => n.x[i],
      colName: (j) => n.f[j],
      cell: (i, j) => F.num(s.contributions[i][j], 2),
      totals: {
        row: (i) => F.num(s.cols.reduce((a, j) => a + s.contributions[i][j], 0), 2),
        col: (j) => F.num(s.rows.reduce((a, i) => a + s.contributions[i][j], 0), 2),
        all: F.num(s.chi2, 2),
      },
      totalLabel: text.ui.total,
    }),
    h('p', { class: 'caption line' }, h('strong', { text: C.result(s) })),
    h('p', { text: C.decision(s) }),
    h('p', { text: C.after }),
  ];
}

// --- Prova: la vostra tabella ----------------------------------------------------------------

function tryTableBlock() {
  const T = text.tryTable;
  const t = state.tryTable;
  const editor = h('div');
  const result = h('div');
  const rowName = (i) => (i < T.exampleNames.x.length ? T.exampleNames.x[i] : T.rowName(i));
  const colName = (j) => (j < T.exampleNames.f.length ? T.exampleNames.f[j] : T.colName(j));
  const pairsText = () => (t.pairs === null ? T.examplePairs : t.pairs);

  const showResult = () => {
    const F = text.fmt;
    const read = t.mode === 'grid' ? view.readGrid(t.cells) : view.readPairs(pairsText(), t.header);
    if (t.mode === 'pairs') {
      const help = editor.querySelector('#hw6-pairs-help');
      if (help) help.textContent = read.ok ? T.records(read.records) : '';
      const area = editor.querySelector('textarea');
      if (area) area.setAttribute('aria-invalid', String(!read.ok));
    }
    if (!read.ok) {
      const m = T.errors[read.error];
      fill(result, h('p', { class: 'field-error', role: 'alert', text: typeof m === 'function' ? m(read.line, read.text) : m }));
      return;
    }
    const s = read.s;
    const nm = read.xLevels ? { x: read.xLevels, f: read.fLevels } : { x: t.cells.map((_, i) => rowName(i)), f: t.cells[0].map((_, j) => colName(j)) };
    const head = t.mode === 'grid' ? `${T.xName} \\ ${T.fName}` : 'X \\ F';
    fill(
      result,
      t.mode === 'pairs' &&
        matrix({
          corner: head,
          rows: range(s.counts.length),
          cols: range(s.counts[0].length),
          rowName: (i) => nm.x[i],
          colName: (j) => nm.f[j],
          cell: (i, j) => F.int(s.counts[i][j]),
          totals: { row: (i) => F.int(s.rowTotals[i]), col: (j) => F.int(s.colTotals[j]), all: F.int(s.N) },
          totalLabel: text.ui.total,
        }),
      matrix({
        caption: text.expected.tableTitle,
        corner: head,
        rows: range(s.counts.length),
        cols: range(s.counts[0].length),
        rowName: (i) => nm.x[i],
        colName: (j) => nm.f[j],
        cell: (i, j) => (s.rowTotals[i] > 0 && s.colTotals[j] > 0 ? F.num(s.expected[i][j], 2) : '-'),
        cellClass: (i, j) => (s.rowTotals[i] > 0 && s.colTotals[j] > 0 && s.expected[i][j] < 5 ? 'is-small' : null),
      }),
      caption(h('p', null, h('strong', { text: T.result(s) }), ` ${T.verdict(s)}`), !s.small.cochran && h('p', { text: T.small(s) }), s.two && h('p', { text: T.twoByTwo(s) })),
    );
  };

  const drawEditor = () => {
    if (t.mode === 'grid') {
      const grid = h(
        'table',
        { class: 'table compact grid' },
        h('thead', null, h('tr', null, h('th', { scope: 'col', text: `${T.xName} \\ ${T.fName}` }), t.cells[0].map((_, j) => h('th', { scope: 'col', text: colName(j) })))),
        h(
          'tbody',
          null,
          t.cells.map((row, i) => h(
            'tr',
            null,
            h('th', { scope: 'row', text: rowName(i) }),
            row.map((v, j) => {
              const input = h('input', {
                type: 'text',
                inputmode: 'numeric',
                maxlength: 7,
                ...PRIVATE_FIELD,
                value: v,
                'aria-label': T.cellLabel(rowName(i), colName(j)),
                'aria-invalid': String(!hw.parseInteger(v, hw.LIMITS.cell).ok),
                oninput: (e) => {
                  t.cells[i][j] = e.target.value.slice(0, 7);
                  input.setAttribute('aria-invalid', String(!hw.parseInteger(t.cells[i][j], hw.LIMITS.cell).ok));
                  showResult();
                },
              });
              return h('td', null, input);
            }),
          )),
        ),
      );
      const reshape = (change) => () => {
        change();
        drawEditor();
        showResult();
      };
      const rows = t.cells.length;
      const cols = t.cells[0].length;
      fill(
        editor,
        h('div', { class: 'scroll' }, grid),
        h(
          'p',
          { class: 'buttons' },
          h('button', { type: 'button', class: 'btn alt', text: T.addRow, disabled: rows >= view.GRID.max, onclick: reshape(() => t.cells.push(t.cells[0].map(() => '0'))) }),
          h('button', { type: 'button', class: 'btn alt', text: T.removeRow, disabled: rows <= view.GRID.min, onclick: reshape(() => t.cells.pop()) }),
          h('button', { type: 'button', class: 'btn alt', text: T.addCol, disabled: cols >= view.GRID.max, onclick: reshape(() => t.cells.forEach((row) => row.push('0'))) }),
          h('button', { type: 'button', class: 'btn alt', text: T.removeCol, disabled: cols <= view.GRID.min, onclick: reshape(() => t.cells.forEach((row) => row.pop())) }),
          h('button', { type: 'button', class: 'btn', text: T.reset, onclick: reset }),
        ),
      );
    } else {
      fill(
        editor,
        h(
          'div',
          { class: 'pairs-input' },
          h('label', { for: 'hw6-pairs-input', text: T.pairsLabel }),
          h('textarea', {
            id: 'hw6-pairs-input',
            rows: 8,
            ...PRIVATE_FIELD,
            'aria-describedby': 'hw6-pairs-help',
            oninput: (e) => {
              t.pairs = e.target.value.slice(0, 2000000);
              showResult();
            },
          }),
          h(
            'label',
            { class: 'checkbox' },
            h('input', {
              type: 'checkbox',
              checked: t.header,
              onchange: (e) => {
                t.header = e.target.checked;
                showResult();
              },
            }),
            ` ${T.headerLabel}`,
          ),
          h('p', { id: 'hw6-pairs-help', class: 'note' }),
          h('p', { class: 'buttons' }, h('button', { type: 'button', class: 'btn', text: T.reset, onclick: reset })),
        ),
      );
      editor.querySelector('textarea').value = pairsText();
    }
  };

  function reset() {
    t.cells = startCells();
    t.pairs = null;
    t.header = false;
    drawEditor();
    showResult();
  }

  drawEditor();
  showResult();
  return h(
    'div',
    { class: 'try' },
    title('hw6-try-table', 2, text.sections.tryTable),
    h('p', { text: T.intro }),
    choices(T.modeLabel, [['grid', T.modes.grid], ['pairs', T.modes.pairs]], t.mode, (v) => {
      t.mode = v;
      drawEditor();
      showResult();
    }),
    editor,
    result,
  );
}

// --- 1.6 Il test G, 1.7 le tabelle piccole -----------------------------------------------------

function gtestBlock() {
  const G = text.gtest;
  const { s } = pair;
  if (!s.testable) return h('p', { text: text.chi2.notTestable });
  return [h('p', { text: G.intro }), formulas(G.formulas), h('p', { class: 'caption line' }, h('strong', { text: G.result(s) })), h('p', { text: G.compare(s) })];
}

const smallCounts = () => hw.smallTable(state.small.n, hw.DEFAULT_SEED, state.small.draw);

function smallBlock() {
  const M = text.small;
  const F = text.fmt;
  const { s } = pair;
  const sampleRegion = h('div');
  const drawSample = () => {
    const counts = smallCounts();
    const st = hw.tableStats(counts);
    const cols = [text.names.outcomes.normal, text.names.outcomes.attack];
    fill(
      sampleRegion,
      matrix({
        caption: M.tableTitle(state.small.n),
        rows: [0, 1],
        cols: [0, 1],
        rowName: (i) => M.rows[i],
        colName: (j) => cols[j],
        cell: (i, j) => F.int(counts[i][j]),
        totals: { row: (i) => F.int(st.rowTotals[i]), col: (j) => F.int(st.colTotals[j]), all: F.int(st.N) },
        totalLabel: text.ui.total,
      }),
      caption(st.testable && st.two ? [h('p', null, h('strong', { text: M.result(st) })), h('p', { text: M.cochran(st) })] : h('p', { text: text.chi2.notTestable })),
    );
  };
  drawSample();
  return [
    h('p', { text: M.intro }),
    s.testable && h('p', { text: M.rule(s) }),
    h('p', { text: M.exactIntro }),
    choices(M.sizeLabel, hw.SMALL_SIZES.map((v) => [v, F.int(v)]), state.small.n, (v) => {
      state.small.n = v;
      drawSample();
      updateTests();
    }),
    h(
      'p',
      { class: 'buttons' },
      h('button', {
        type: 'button',
        class: 'btn alt',
        text: M.newSample,
        onclick: () => {
          state.small.draw += 1;
          drawSample();
          updateTests();
        },
      }),
    ),
    sampleRegion,
    h('p', { text: M.after }),
  ];
}

// --- 1.8 Il test di permutazione ---------------------------------------------------------------

const permKey = () => `${pair.key}|${state.perm.n}|${state.perm.B}|${state.perm.draw}`;

/** Runs the permutation test on a new sample, a slice of shuffles per frame; the chart grows in place. */
function runPermutation() {
  cancelAnimationFrame(perm.frame);
  if (!perm.fig) return;
  const T = text.tryPermutation;
  const F = text.fmt;
  const { n, B, draw } = state.perm;
  const sample = view.permutationSample(pair.codes, n, draw);
  const key = permKey();
  const label = T.chartTitle(F.int(n), sample.s.df);
  const show = (done, values, result) => {
    const chart = view.permutationChart({ done, values, df: sample.s.df, observed: sample.s.chi2 }, F.decimal);
    refreshFigure(perm.fig, label, chart, view.tips.permutation(chart, text.tips), chart.beyond ? T.beyond(sample.s.chi2) : null);
    perm.line.setAttribute('aria-live', result ? 'polite' : 'off');
    if (result) fill(perm.line, h('p', null, h('strong', { text: T.result(result) })), h('p', { text: `${T.agreement(result)} ${T.cochran(sample.s)}`.trim() }));
    else fill(perm.line, h('p', { text: T.running(done, B) }));
  };
  if (!sample.s.testable) {
    perm.fig.hidden = true;
    fill(perm.line, h('p', { text: text.chi2.notTestable }));
    return;
  }
  perm.fig.hidden = false;
  show(0, new Float64Array(0), null);
  const steps = hw.permutationSteps(sample.x, sample.f, sample.r, sample.c, B, hw.DEFAULT_SEED, { slice: view.permutationSlice(B, reducedMotion()), j: draw });
  const tick = () => {
    const step = steps.next();
    if (step.done) {
      const result = { ...step.value, n };
      perm.result = { key, ...result };
      show(B, result.values, result);
      updateTests();
    } else {
      show(step.value.done, step.value.values, null);
      perm.frame = requestAnimationFrame(tick);
    }
  };
  perm.frame = requestAnimationFrame(tick);
}

function permutationBlock() {
  const T = text.tryPermutation;
  const F = text.fmt;
  perm.fig = figure(T.chartTitle(F.int(state.perm.n), pair.s.df), hw.drawHistogram, view.permutationChart({ done: 0, values: new Float64Array(0), df: Math.max(1, pair.s.df), observed: 0 }, F.decimal), {
    wide: true,
    items: view.legends.permutation(text),
    keep: kept.permutation,
  });
  perm.line = caption();
  const restart = (change) => (v) => {
    change(v);
    runPermutation();
  };
  return [
    paras(text.permutation.intro),
    formulas(text.permutation.formulas),
    h(
      'div',
      { class: 'try' },
      title('hw6-try-permutation', 2, text.sections.tryPermutation),
      h('p', { text: T.intro }),
      choices(T.sizeLabel, hw.PERMUTATION_SIZES.map((v) => [v, F.int(v)]), state.perm.n, restart((v) => (state.perm.n = v))),
      choices(T.countLabel, hw.PERMUTATION_COUNTS.map((v) => [v, F.int(v)]), state.perm.B, restart((v) => (state.perm.B = v))),
      h(
        'p',
        { class: 'buttons' },
        h('button', { type: 'button', class: 'btn', text: T.run, onclick: () => runPermutation() }),
        h('button', { type: 'button', class: 'btn alt', text: T.again, onclick: restart(() => (state.perm.draw += 1)) }),
      ),
      h('div', { class: 'charts' }, perm.fig),
      perm.line,
    ),
  ];
}

// --- 1.9 Le verifiche ------------------------------------------------------------------------------

function updateVerify() {
  const V = text.checks;
  if (!checkRows) {
    fill(regions.checks, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const ok = checkRows.filter((r) => r.ok).length;
  fill(
    regions.checks,
    h('p', { text: V.intro }),
    check(ok === checkRows.length, V.summary(ok, checkRows.length)),
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
            .map((r) => ({
              cells: [{ head: true, text: r.name }, { node: h('code', { text: r.expected }) }, { node: h('code', { text: r.actual }) }, { class: r.ok ? 'is-ok' : 'is-bad', node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }) }],
            })),
        ),
      ]),
    ),
  );
}

// ---------------------------------------------------------------------------
// 1. Le sezioni del compito
// ---------------------------------------------------------------------------

function taskSection() {
  const S = text.sections;
  regions.contingency = h('div');
  regions.frequencies = h('div');
  regions.expected = h('div');
  regions.chi2 = h('div');
  regions.gtest = h('div');
  regions.small = h('div');
  regions.permutation = h('div');
  regions.checks = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw6-task', 0, S.task),
    paras(text.task.intro),
    title('hw6-dataset', 1, S.dataset),
    datasetBlock(),
    title('hw6-table', 1, S.table),
    regions.contingency,
    title('hw6-frequencies', 1, S.frequencies),
    regions.frequencies,
    title('hw6-expected', 1, S.expected),
    regions.expected,
    title('hw6-chi2', 1, S.chi2),
    regions.chi2,
    tryTableBlock(),
    title('hw6-gtest', 1, S.gtest),
    regions.gtest,
    title('hw6-small', 1, S.small),
    regions.small,
    title('hw6-permutation', 1, S.permutation),
    regions.permutation,
    title('hw6-checks', 1, S.checks),
    regions.checks,
  );
}

// ---------------------------------------------------------------------------
// 2. La teoria, 3. l'interpretazione
// ---------------------------------------------------------------------------

function theorySection() {
  const T = text.theory;
  return h('section', { class: 'section' }, title('hw6-theory', 0, text.sections.theory), paras(T.paras), formulas(T.formulas), paras(T.after));
}

function decisionBlock() {
  const { s } = pair;
  return s.testable ? paras(text.decision.paras(s, varNames())) : h('p', { text: text.chi2.notTestable });
}

function residualsBlock() {
  const R = text.residuals;
  const F = text.fmt;
  const { s } = pair;
  const n = names();
  if (!s.testable) return h('p', { text: text.chi2.notTestable });
  const c = pair.choice;
  const protocolClass = (c.x === 'protocol' && c.f === 'class') || (c.x === 'class' && c.f === 'protocol');
  return [
    h('p', { text: R.intro }),
    formulas(R.formulas),
    matrix({
      caption: R.title,
      corner: corner(),
      rows: s.rows,
      cols: s.cols,
      rowName: (i) => n.x[i],
      colName: (j) => n.f[j],
      cell: (i, j) => (s.adjusted[i][j] === null ? '-' : F.num(s.adjusted[i][j], 2)),
      cellClass: (i, j) => view.residualClass(s.adjusted[i][j]),
      className: 'residuals',
    }),
    h('p', { class: 'note', text: R.scale }),
    h('p', { text: R.after(view.strongestCells(s), n) }),
    protocolClass && h('p', { text: R.protocolClass(view.labelProtocols()) }),
  ];
}

function strengthBlock() {
  const S = text.strength;
  const { s } = pair;
  return [h('p', { text: S.intro }), formulas(S.formulas), s.testable && h('p', { class: 'caption line' }, h('strong', { text: S.result(s, varNames()) }))];
}

// --- Prova: una dipendenza regolabile -------------------------------------------------------------

const dependenceStats = () => hw.tableStats(hw.dependenceTable(hw.DEPENDENCE_SIZES[state.dependence.n], hw.THETAS[state.dependence.theta], hw.DEFAULT_SEED));

function tryDependenceBlock() {
  const T = text.tryDependence;
  const tableRegion = h('div');
  const seriesRegion = h('div');
  const items = view.legends.dependence(text);
  let fig = null;
  let lastTheta = null;
  const thetaSlider = slider('hw6-theta', '', hw.THETAS.length - 1, state.dependence.theta, (v) => {
    state.dependence.theta = v;
    update();
  });
  const nSlider = slider('hw6-logins', '', hw.DEPENDENCE_SIZES.length - 1, state.dependence.n, (v) => {
    state.dependence.n = v;
    update();
  });
  function update() {
    const F = text.fmt;
    const theta = hw.THETAS[state.dependence.theta];
    const n = hw.DEPENDENCE_SIZES[state.dependence.n];
    thetaSlider.label(T.thetaLabel(theta));
    nSlider.label(T.nLabel(n));
    const counts = hw.dependenceTable(n, theta, hw.DEFAULT_SEED);
    const st = hw.tableStats(counts);
    fill(
      tableRegion,
      matrix({
        corner: `${T.xName} \\ ${T.fName}`,
        rows: [0, 1, 2],
        cols: [0, 1, 2],
        rowName: (i) => T.names.x[i],
        colName: (j) => T.names.f[j],
        cell: (i, j) => F.int(counts[i][j]),
        cellClass: (i, j) => view.residualClass(st.adjusted[i][j]),
        totals: { row: (i) => F.int(st.rowTotals[i]), col: (j) => F.int(st.colTotals[j]), all: F.int(st.N) },
        totalLabel: text.ui.total,
        className: 'residuals',
      }),
      h('p', { class: 'caption line', 'aria-live': 'polite' }, h('strong', { text: T.result(st, n, theta) })),
    );
    const series = hw.dependenceSeries(theta, hw.DEFAULT_SEED);
    fill(
      seriesRegion,
      subtitle(T.tableTitle),
      h(
        'div',
        { class: 'scroll' },
        table(
          'compact num series',
          [T.cols.n, T.cols.chi2, T.cols.p, T.cols.V, T.cols.verdict],
          series.map((r) => ({ class: r.n === n ? 'is-current' : null, cells: [{ head: true, text: F.int(r.n) }, { text: F.num(r.chi2, 2) }, { text: F.p(r.p, r.log10p) }, { text: F.num(r.V, 3) }, { text: T.verdicts[r.p < hw.SIGNIFICANCE ? 'reject' : 'accept'] }] })),
          view.LINKED_TABLES.series,
          [null, null, 'series:0', null, 'series:1'],
        ),
      ),
    );
    hideParts(seriesRegion, partsOf(items, kept.dependence));
    if (lastTheta !== theta) {
      lastTheta = theta;
      if (fig) refreshFigure(fig, T.chartTitle, view.dependenceChart(series, F.decimal), view.tips.dependence(series, text.tips));
      else
        fig = figure(T.chartTitle, hw.drawLineChart, view.dependenceChart(series, F.decimal), {
          wide: true,
          tip: view.tips.dependence(series, text.tips),
          items,
          keep: kept.dependence,
          link: view.links.series,
          onHide: (parts) => hideParts(seriesRegion, parts),
        });
    }
    updateTests();
  }
  update();
  return h(
    'div',
    { class: 'try' },
    title('hw6-try-dependence', 2, text.sections.tryDependence),
    h('p', { text: T.intro }),
    h('div', { class: 'slider-row' }, thetaSlider.el, nSlider.el),
    tableRegion,
    seriesRegion,
    h('div', { class: 'charts' }, fig),
    h('p', { text: T.after }),
  );
}

function updatePairs() {
  const P = text.pairs;
  const F = text.fmt;
  const pairs = hw.allPairs({ merge: state.choice.merge });
  const { top } = view.pairsFacts(pairs);
  const name = (v) => text.names.variables[v];
  fill(
    regions.pairs,
    h('p', { text: P.intro }),
    h(
      'div',
      { class: 'scroll' },
      table(
        'compact num',
        ['pair', 'cells', 'chi2', 'df', 'p', 'V', 'effect', 'cochran'].map((k) => P.cols[k]),
        pairs.map((p) => ({ cells: [{ head: true, text: `${name(p.x)} × ${name(p.f)}` }, { text: `${p.r} × ${p.c}` }, { text: F.num(p.chi2, 1) }, { text: String(p.df) }, { text: F.p(p.p, p.log10p) }, { text: F.num(p.V, 3) }, { text: text.effects[p.effect] }, { text: p.cochran ? P.yes : P.no }] })),
      ),
    ),
    h('p', { class: 'note', text: P.note }),
    h('p', { text: P.after({ x: name(top.x), f: name(top.f), V: top.V }) }),
  );
}

function interpretationSection() {
  const S = text.sections;
  regions.decision = h('div');
  regions.residuals = h('div');
  regions.strength = h('div');
  regions.pairs = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw6-interpretation', 0, S.interpretation),
    h('p', { text: text.interpretation.intro }),
    title('hw6-decision', 1, S.decision),
    regions.decision,
    title('hw6-residuals', 1, S.residuals),
    regions.residuals,
    title('hw6-strength', 1, S.strength),
    regions.strength,
    tryDependenceBlock(),
    title('hw6-pairs', 1, S.pairs),
    regions.pairs,
  );
}

// ---------------------------------------------------------------------------
// 4. Associazione e causalita'
// ---------------------------------------------------------------------------

function simpsonBlock() {
  const S = text.simpson;
  const F = text.fmt;
  const rows = view.simpsonRows();
  const items = view.legends.simpson(text);
  const tableEl = table(
    'compact num departments',
    [S.cols.department, S.cols.men, S.cols.menRate, S.cols.women, S.cols.womenRate, S.cols.p],
    rows.map((r) => ({ class: r.key === 'all' ? 'margin-row' : null, cells: [{ head: true, text: r.key === 'all' ? S.all : r.key }, { text: F.int(r.men) }, { text: F.pct(r.menRate) }, { text: F.int(r.women) }, { text: F.pct(r.womenRate) }, { text: F.p(r.fisher) }] })),
    view.LINKED_TABLES.departments,
    [null, 'series:0', 'series:0', 'series:1', 'series:1', null],
  );
  hideParts(tableEl, partsOf(items, kept.simpson));
  return [
    paras(S.intro(view.berkeleyFacts())),
    subtitle(S.tableTitle),
    h('div', { class: 'scroll' }, tableEl),
    h(
      'div',
      { class: 'charts' },
      figure(S.chartTitle, hw.drawGroupedBars, view.simpsonChart(text, F.decimal), { wide: true, tip: view.tips.simpson(rows, text.tips), items, keep: kept.simpson, link: view.links.departments, onHide: (parts) => hideParts(tableEl, parts) }),
    ),
    h('p', { class: 'note', text: S.source }),
  ];
}

function trySimpsonBlock() {
  const T = text.trySimpson;
  const region = h('div');
  const update = () => {
    const F = text.fmt;
    const tableCounts = hw.ucbTable(state.simpson === 'all' ? null : hw.UCB.departments.indexOf(state.simpson));
    const st = hw.tableStats(tableCounts);
    const rates = tableCounts.map(([a, r]) => a / (a + r));
    fill(
      region,
      matrix({
        rows: [0, 1],
        cols: [0, 1],
        rowName: (i) => T.rows[i],
        colName: (j) => T.cols[j],
        cell: (i, j) => F.int(tableCounts[i][j]),
        totals: { row: (i) => F.int(st.rowTotals[i]), col: (j) => F.int(st.colTotals[j]), all: F.int(st.N) },
        totalLabel: text.ui.total,
      }),
      h('p', { class: 'caption line', 'aria-live': 'polite' }, h('strong', { text: T.result(st, rates) })),
    );
  };
  update();
  return h(
    'div',
    { class: 'try' },
    title('hw6-try-simpson', 2, text.sections.trySimpson),
    h('p', { text: T.intro }),
    choices(T.chooseLabel, [['all', T.all], ...hw.UCB.departments.map((d) => [d, T.department(d)])], state.simpson, (v) => {
      state.simpson = v;
      update();
    }),
    region,
  );
}

function causalitySection() {
  const S = text.sections;
  return h(
    'section',
    { class: 'section' },
    title('hw6-causality', 0, S.causality),
    paras(text.causality.intro),
    title('hw6-simpson', 1, S.simpson),
    simpsonBlock(),
    trySimpsonBlock(),
    title('hw6-security', 1, S.security),
    paras(text.security.paras),
  );
}

// ---------------------------------------------------------------------------
// 5. Il riepilogo dei test, 6. il contesto storico, 7. le conclusioni
// ---------------------------------------------------------------------------

function updateTests() {
  if (!regions.tests || !pair) return;
  const T = text.tests;
  const permResult = perm.result && perm.result.key === permKey() ? perm.result : null;
  const rows = view.testRows({ s: pair.s, perm: permResult, small: smallCounts(), dependence: dependenceStats(), theta: hw.THETAS[state.dependence.theta] });
  const headers = [T.cols.subject, T.cols.hypothesis, T.cols.statistic, T.cols.p, T.cols.verdict, T.cols.expected];
  fill(
    regions.tests,
    h('p', { text: T.intro }),
    table(
      'discussion summary summary-tests',
      headers,
      rows.map((r) => {
        const c = view.testCells(r, text, varNames());
        return { class: c.rejected ? 'is-rejected' : null, cells: [{ head: true, text: c.subject }, { text: c.hypothesis }, { text: c.statistic }, { text: c.p }, { text: c.verdict }, { text: c.expected }] };
      }),
    ),
  );
}

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section far' }, title('hw6-tests', 0, text.sections.tests), regions.tests);
}

function historySection() {
  const H = text.history;
  return h(
    'section',
    { class: 'section far' },
    title('hw6-history', 0, text.sections.history),
    h('p', { text: H.intro }),
    h('ol', { class: 'timeline' }, H.items.map((e) => h('li', { class: 'is-context' }, h('span', { class: 'year', text: e.year }), h('div', null, h('strong', { text: e.title }), h('p', { text: e.text }))))),
    h('p', { text: H.after }),
  );
}

function updateConclusion() {
  const { s } = pair;
  const b = view.berkeleyFacts();
  fill(
    regions.conclusion,
    paras(
      text.conclusion.paras({
        N: s.N,
        pair: varNames(),
        chi2: s.chi2,
        df: s.df,
        p: s.p,
        log10p: s.log10p,
        cochran: s.small.cochran,
        effect: s.effect,
        V: s.V,
        where: s.testable ? text.conclusion.where(view.strongestCells(s, 1), names()) : '',
        berkeley: { p: b.p, log10p: b.log10p },
        cmh: { p: b.cmh.p },
      }),
    ),
  );
}

function conclusionSection() {
  regions.conclusion = h('div');
  return h('section', { class: 'section far' }, title('hw6-conclusion', 0, text.sections.conclusion), regions.conclusion);
}

/** Everything that depends on the pair (X, F): computed again and drawn again. */
function changePair() {
  computePair();
  kept.conditional = new Set();
  state.expectedRow = null;
  fill(regions.contingency, contingencyBlock());
  fill(regions.frequencies, frequenciesBlock());
  fill(regions.expected, expectedBlock());
  fill(regions.chi2, chi2Block());
  fill(regions.gtest, gtestBlock());
  fill(regions.small, smallBlock());
  fill(regions.permutation, permutationBlock());
  fill(regions.decision, decisionBlock());
  fill(regions.residuals, residualsBlock());
  fill(regions.strength, strengthBlock());
  updateTests();
  updateConclusion();
  runPermutation();
}

// ---------------------------------------------------------------------------
// Indice, lingua e avvio
// ---------------------------------------------------------------------------

const dialog = document.getElementById('index-dialog');
const FOLLOW_MS = 2500;

// Porta il titolo in cima e lo segue per un paio di secondi: se nel
// frattempo qualcosa sopra cambia altezza, lo scorrimento riparte verso la
// nuova posizione. Se l'utente scorre da se', si smette subito di inseguire.
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
  document.title = 'Homework #6 - Statistics';
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
  text = HW6_TEXTS[state.lang];
  cancelAnimationFrame(perm.frame);
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), taskSection(), theorySection(), interpretationSection(), causalitySection(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateVerify();
  updatePairs();
  changePair();
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
  // le verifiche partono dopo il primo disegno della pagina
  setTimeout(() => {
    try {
      checkRows = hw.verifyAll();
    } catch (error) {
      checkRows = [{ group: 'data', name: text.ui.error(error instanceof Error ? error.message : String(error)), expected: '', actual: '', ok: false }];
    }
    updateVerify();
  }, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
