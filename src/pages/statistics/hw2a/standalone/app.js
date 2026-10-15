// src/pages/statistics/hw2a/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework2a.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Da file:// i worker non partono: i calcoli lunghi (esplorazione, costo
// degli attacchi, attacchi sulla chiave) girano qui, a fette di pochi
// millisecondi, e la pagina resta reattiva mentre i numeri arrivano.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
import * as hw from '../homework2a.js';
import * as view from '../view.js';
import { HW2A_TEXTS, originalAssignment } from '../texts.js';

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
  fields: { ...view.DEFAULT_INPUTS },
  applied: { key: hw.DEFAULT_KEY, message: hw.DEFAULT_MESSAGE, shift: hw.DEFAULT_SHIFT },
  nonces: 'seeded',
  round: 0,
};
let text = HW2A_TEXTS[state.lang];
const regions = {};
const controls = {};
// null while computing, then { value } or { error }
const computed = { verify: null, stats: null, scaling: null };
const attacks = { key: null, token: null, exhaustive: null, bsgs: null, kangaroo: null };

// Lo schema si ricrea solo se cambiano chiave o nonce; il cifrato solo se
// cambia anche il messaggio; il modello della lingua una volta sola.
const cache = { schemeId: null, scheme: null, message: null, encryption: null, decryption: null, augustus: null, reuseId: null, reuse: null, models: null };

function current() {
  const a = state.applied;
  const schemeId = `${a.key}|${state.nonces}|${state.round}`;
  if (cache.schemeId !== schemeId) {
    cache.schemeId = schemeId;
    cache.scheme = hw.toyScheme(a.key, { nonces: state.nonces });
    cache.message = null;
  }
  if (cache.message !== a.message) {
    cache.message = a.message;
    cache.encryption = cache.scheme.encrypt(a.message);
    cache.decryption = cache.scheme.decrypt(cache.encryption.blocks);
    cache.augustus = view.augustusDemo(cache.scheme, cache.encryption.blocks);
  }
  const reuseId = `${a.key}|${a.message}`;
  if (cache.reuseId !== reuseId) {
    cache.reuseId = reuseId;
    cache.reuse = view.reuseDemo(a.key, a.message);
  }
  return {
    scheme: cache.scheme,
    encryption: cache.encryption,
    decryption: cache.decryption,
    augustus: cache.augustus,
    reuse: cache.reuse,
    publicKey: hw.pointHex(cache.scheme.K),
    caesar: view.caesarFacts(a.message, a.shift),
  };
}

function languageModels() {
  const s = computed.stats && computed.stats.value;
  if (!s) return null;
  if (!cache.models) cache.models = hw.languageModels(s.models.betas);
  return cache.models;
}

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
const pending = (result = null) => (result && result.error ? h('p', { class: 'note', text: text.ui.error(result.error) }) : h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
// La nota "valori dell'ultimo input valido" c'e' sempre, nascosta: la mostra
// il CSS quando la sezione ha la classe is-stale.
const staleNote = (label) => h('p', { class: 'stale stale-note', text: label });
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad', text: label });
const formulas = (content, label = null) => [label && subtitle(label), h('pre', { text: content })];

/** A labelled value: the label above, the (long) value below. */
const value = (label, content, extra = '') => h('div', { class: `value ${extra}`.trim() }, h('span', { class: 'value-label', text: label }), h('code', null, content));

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

function figure(caption, draw, data, { wide = false, tip = null, items = null } = {}) {
  const canvas = h('canvas', { class: 'chart', role: 'img', 'aria-label': caption });
  const fig = h('figure', { class: wide ? 'figure wide' : 'figure' }, canvas, items && legend(items), h('figcaption', { text: caption }));
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
  // the legends take their colours from the palette too
  updateStats();
  updateScaling();
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

/** The hypothesis tests of one subject, with what each should say. */
function tests(group, s, only = null) {
  return h(
    'div',
    { class: 'tests' },
    view.statTests(s)[group].filter(([key]) => !only || only.includes(key)).map(([key, t]) => {
      const rejected = t.verdict === 'reject';
      const expected = view.EXPECTED_VERDICTS[group][key];
      return h(
        'div',
        { class: `test ${rejected ? 'is-invalid' : 'is-valid'}` },
        h(
          'p',
          { class: 'test-head' },
          h('strong', { text: text.stats.labels[group][key] }),
          ' ',
          h('span', { class: `badge ${rejected ? 'is-invalid' : 'is-valid'}`, text: text.stats.verdict[rejected ? 'reject' : 'notReject'] }),
          h('span', { class: 'note', text: ` (${text.stats.expected[expected]})` }),
        ),
        h('p', { text: text.stats.testLine(t) }),
      );
    }),
  );
}

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  const blocks = originalAssignment().map((block) => (block.type === 'title' ? h('p', null, h('strong', { text: block.text })) : h('p', { text: block.text })));
  return h(
    'section',
    { class: 'section' },
    title('hw2a-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
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
// 1. Lo schema giocattolo
// ---------------------------------------------------------------------------

function schemeSection() {
  const S = text.sections;
  for (const name of ['keyHelp', 'messageHelp', 'nonces', 'stale', 'badge', 'keys', 'encrypt', 'decrypt', 'verify']) regions[name] = h('div');
  regions.scheme = h(
    'section',
    { class: 'section' },
    title('hw2a-scheme', 0, S.scheme),
    paras(text.scheme.intro),
    formulas(text.scheme.formulas, text.scheme.formulasTitle),

    title('hw2a-input', 1, S.input),
    inputBlock(),

    title('hw2a-keys', 1, S.keys),
    paras(text.keys.intro),
    regions.keys,
    paras(text.keys.after),

    title('hw2a-encrypt', 1, S.encrypt),
    paras(text.encrypt.intro),
    regions.encrypt,
    paras(text.encrypt.after),

    title('hw2a-decrypt', 1, S.decrypt),
    paras(text.decrypt.intro),
    regions.decrypt,

    title('hw2a-roles', 1, S.roles),
    h('p', { text: text.roles.intro }),
    table(
      'discussion key-roles',
      [text.roles.cols.value, text.roles.cols.who, text.roles.cols.purpose, text.roles.cols.leak],
      text.roles.rows.map((r) => ({ cells: [{ head: true, text: r.value }, { text: r.who }, { text: r.purpose }, { text: r.leak }] })),
    ),
    h('p', { text: text.roles.after }),

    title('hw2a-verify', 1, S.verify),
    h('p', { text: text.verify.intro }),
    regions.verify,
  );
  return regions.scheme;
}

// --- 1.1 I campi ----------------------------------------------------------------

function inputBlock() {
  const I = text.input;
  const f = state.fields;
  controls.key = h('input', {
    type: 'text',
    inputmode: 'numeric',
    class: 'key',
    ...PRIVATE_FIELD,
    maxlength: view.KEY_MAX_LENGTH,
    'aria-describedby': 'key-help',
    oninput: (e) => changeFields({ keyText: e.target.value.slice(0, view.KEY_MAX_LENGTH) }),
  });
  controls.key.value = f.keyText;
  controls.message = h('textarea', {
    rows: 3,
    ...PRIVATE_FIELD,
    maxlength: view.MESSAGE_MAX_LENGTH,
    'aria-describedby': 'message-help',
    oninput: (e) => changeFields({ message: e.target.value.slice(0, view.MESSAGE_MAX_LENGTH) }),
  });
  controls.message.value = f.message;
  return [
    h('p', { text: I.intro }),
    h(
      'div',
      { class: 'fields' },
      h(
        'div',
        { class: 'controls' },
        h('label', null, h('span', { text: I.keyLabel }), controls.key),
        h('span', { class: 'buttons' }, h('button', { type: 'button', class: 'btn alt', text: I.randomKey, onclick: () => changeFields({ keyText: hw.randomPrivateKey().toString() }, true) })),
      ),
      regions.keyHelp,
      h('label', { class: 'mnemonic' }, h('span', { text: I.messageLabel }), controls.message),
      regions.messageHelp,
      regions.nonces,
      h('p', { class: 'note', text: I.noncesHint }),
    ),
    regions.stale,
    regions.badge,
  ];
}

/** Puts the values of the state into the fields, after a button changed them. */
function syncFields() {
  const f = state.fields;
  if (controls.key.value !== f.keyText) controls.key.value = f.keyText;
  if (controls.message.value !== f.message) controls.message.value = f.message;
  if (controls.shift && controls.shift.value !== f.shiftText) controls.shift.value = f.shiftText;
}

function changeFields(patch, fromButton = false) {
  state.fields = { ...state.fields, ...patch };
  if (fromButton) syncFields();
  const read = view.readInputs(state.fields);
  const prev = state.applied;
  const next = {
    key: read.key.ok ? read.key.value : prev.key,
    message: read.message.ok ? read.message.value : prev.message,
    shift: read.shift.ok ? read.shift.value : prev.shift,
  };
  state.applied = next;
  updateInputs(read);
  if (next.key !== prev.key || next.message !== prev.message) updateScheme();
  else if (next.shift !== prev.shift) updateCaesar();
}

function chooseNonces(mode, reroll = false) {
  if (mode === state.nonces && !reroll) return;
  state.nonces = mode;
  state.round++;
  updateInputs(view.readInputs(state.fields));
  updateScheme();
}

function restore() {
  state.fields = { ...view.DEFAULT_INPUTS };
  syncFields();
  state.applied = { key: hw.DEFAULT_KEY, message: hw.DEFAULT_MESSAGE, shift: hw.DEFAULT_SHIFT };
  if (state.nonces !== 'seeded') {
    state.nonces = 'seeded';
    state.round++;
  }
  updateInputs(view.readInputs(state.fields));
  updateScheme();
}

function updateInputs(read) {
  const I = text.input;
  const C = text.caesarCipher;
  let keyError = null;
  if (!read.key.ok) keyError = read.key.error === 'notInteger' ? I.keyError.notInteger(read.key.text) : I.keyError[read.key.error];
  let messageError = null;
  if (!read.message.ok) messageError = read.message.error === 'tooLong' ? I.messageError.tooLong(read.message.bytes) : I.messageError.empty;
  let shiftError = null;
  if (!read.shift.ok) shiftError = read.shift.error === 'notInteger' ? C.shiftError.notInteger(read.shift.text) : C.shiftError[read.shift.error];
  fill(regions.keyHelp, h('p', { id: 'key-help', class: keyError ? 'field-error' : 'note', role: keyError ? 'alert' : null, text: keyError || I.keyHint }));
  fill(regions.messageHelp, h('p', { id: 'message-help', class: messageError ? 'field-error' : 'note', role: messageError ? 'alert' : null, text: messageError || I.messageHint(read.message.bytes) }));
  if (regions.shiftHelp) fill(regions.shiftHelp, h('p', { id: 'shift-help', class: shiftError ? 'field-error' : 'note', role: shiftError ? 'alert' : null, text: shiftError || C.shiftHint }));
  controls.key.setAttribute('aria-invalid', String(!read.key.ok));
  controls.message.setAttribute('aria-invalid', String(!read.message.ok));
  if (controls.shift) controls.shift.setAttribute('aria-invalid', String(!read.shift.ok));
  fill(
    regions.nonces,
    h(
      'div',
      { class: 'nonces', role: 'group', 'aria-label': I.noncesLabel },
      h('span', { class: 'nonces-label', text: I.noncesLabel }),
      ['seeded', 'random'].map((mode) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(state.nonces === mode), text: I.nonces[mode], onclick: () => chooseNonces(mode) })),
      state.nonces === 'random' && h('button', { type: 'button', class: 'btn alt', text: I.reroll, onclick: () => chooseNonces('random', true) }),
    ),
  );
  const schemeStale = !read.key.ok || !read.message.ok;
  const caesarStale = !read.shift.ok || !read.message.ok;
  regions.scheme.classList.toggle('is-stale', schemeStale);
  regions.attack.classList.toggle('is-stale', schemeStale);
  regions.caesar.classList.toggle('is-stale', caesarStale);
  regions.cryptanalysis.classList.toggle('is-stale', caesarStale);
  fill(regions.stale, (schemeStale || caesarStale) && h('p', { class: 'stale', role: 'status', text: I.stale }));
  const badge = view.inputBadge(state.fields, state.nonces, I);
  fill(
    regions.badge,
    h(
      'p',
      { class: badge.known ? 'badge-line is-task' : 'badge-line is-custom' },
      h('span', { text: badge.text }),
      badge.restore && h('button', { type: 'button', class: 'btn alt restore', text: I.restore, onclick: restore }),
    ),
  );
}

// --- 1.2 - 1.4 Chiavi, cifratura e decifratura ------------------------------------

function updateKeys(c) {
  const K = text.keys;
  const f = view.keyFacts(c.scheme);
  fill(
    regions.keys,
    staleNote(text.scheme.stale),
    value(K.kLabel, f.k),
    value(K.hexLabel, f.hex),
    value(K.binaryLabel(f.bits), f.binary),
    value(K.xLabel, f.x),
    value(K.yLabel, f.y),
    value(K.compressedLabel(f.even), f.compressed),
    check(f.onCurve, K.onCurve(f.onCurve)),
    f.isDefault && check(f.matchesReference, K.reference(f.matchesReference)),
  );
}

function updateEncryption(c) {
  const E = text.encrypt;
  fill(
    regions.encrypt,
    subtitle(E.tableTitle),
    staleNote(text.scheme.stale),
    h('div', { class: 'scroll' }, table('compact blocks', [E.cols.position, E.cols.byte, E.cols.r, E.cols.C1, E.cols.C2], view.blockRows(c.encryption.blocks).map((r) => ({ cells: [{ text: r.position }, { text: `${r.byte} ${r.char}` }, { text: r.r }, { text: r.C1 }, { text: r.C2 }] })))),
    h('p', { class: 'note', text: E.size(view.ciphertextSize(c.encryption.blocks)) }),
  );
}

function updateDecryption(c) {
  const D = text.decrypt;
  const first = view.firstBlock(c.encryption.blocks, c.decryption);
  const ok = c.decryption.ok && c.decryption.text === c.encryption.text;
  fill(
    regions.decrypt,
    first && [
      subtitle(D.firstTitle),
      staleNote(text.scheme.stale),
      value(D.labels.C1, first.C1),
      value(D.labels.C2, first.C2),
      value(D.labels.S, first.S),
      check(first.sameS, D.sameS(first.sameS)),
      value(D.labels.M, first.M),
      check(first.decoded >= 0, D.decoded(first.decoded, first.char)),
    ],
    value(D.resultLabel, c.decryption.text ?? ''),
    check(ok, D.check(ok)),
  );
}

function updateVerify() {
  const V = text.verify;
  const result = computed.verify;
  if (!result || !result.value) {
    fill(regions.verify, pending(result));
    return;
  }
  const rows = result.value;
  const ok = rows.filter((r) => r.ok).length;
  fill(
    regions.verify,
    h('p', { class: ok === rows.length ? 'check is-ok' : 'check is-bad' }, h('strong', { text: V.summary(ok, rows.length) })),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: V.details(rows.length) }),
      view.checkGroups(rows).map((g) => [
        subtitle(V.groups[g.group]),
        table('discussion vectors', [V.cols.check, V.cols.expected, V.cols.result], g.rows.map((r) => ({
          cells: [{ head: true, text: r.name }, { node: h('code', { text: r.expected }) }, { class: r.ok ? 'is-ok' : 'is-bad', node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }) }],
        }))),
      ]),
    ),
  );
}

// ---------------------------------------------------------------------------
// 2. Il cifrario di Cesare
// ---------------------------------------------------------------------------

function caesarSection() {
  const S = text.sections;
  const C = text.caesarCipher;
  for (const name of ['shiftHelp', 'caesarLive', 'compare', 'propertiesLive', 'propertiesStats']) regions[name] = h('div');
  controls.shift = h('input', {
    type: 'text',
    inputmode: 'numeric',
    class: 'shift',
    ...PRIVATE_FIELD,
    maxlength: view.SHIFT_MAX_LENGTH,
    'aria-describedby': 'shift-help',
    oninput: (e) => changeFields({ shiftText: e.target.value.slice(0, view.SHIFT_MAX_LENGTH) }),
  });
  controls.shift.value = state.fields.shiftText;
  regions.caesar = h(
    'section',
    { class: 'section' },
    title('hw2a-caesar', 0, S.caesar),
    paras(text.caesar.intro),
    title('hw2a-caesar-cipher', 1, S.caesarCipher),
    paras(C.intro),
    h('div', { class: 'controls' }, h('label', null, h('span', { text: C.shiftLabel }), controls.shift)),
    regions.shiftHelp,
    regions.caesarLive,
    title('hw2a-compare', 1, S.compare),
    regions.compare,
    title('hw2a-properties', 1, S.properties),
    paras(text.properties.intro),
    regions.propertiesLive,
    regions.propertiesStats,
  );
  return regions.caesar;
}

function updateCaesar() {
  const c = current();
  const C = text.caesarCipher;
  const P = text.properties;
  const shift = state.applied.shift;
  const table26 = view.substitution(shift);
  fill(
    regions.caesarLive,
    subtitle(C.tableTitle),
    h(
      'div',
      { class: 'subst', role: 'table', 'aria-label': C.tableTitle },
      h('div', { class: 'subst-row', role: 'row' }, h('span', { class: 'subst-head', role: 'rowheader', text: C.plainRow }), table26.plain.map((l) => h('span', { role: 'cell', text: l }))),
      h('div', { class: 'subst-row is-cipher', role: 'row' }, h('span', { class: 'subst-head', role: 'rowheader', text: C.cipherRow }), table26.cipher.map((l) => h('span', { role: 'cell', text: l }))),
    ),
    staleNote(C.stale),
    value(C.cipherLabel, c.caesar.cipher),
    value(C.decryptedLabel, c.caesar.decrypted),
    check(c.caesar.ok, C.check(c.caesar.ok)),
    h('p', { text: C.top(c.caesar) }),
  );
  const F = text.fmt;
  const letters = view.letterChart(state.applied.message, F.decimal);
  const cipherLetters = view.letterChart(c.caesar.cipher, F.decimal);
  fill(
    regions.propertiesLive,
    h(
      'div',
      { class: 'charts' },
      figure(P.lettersChart, hw.drawBarChart, letters, { tip: view.tips.letters(letters, text.tips) }),
      figure(P.cipherChart(shift), hw.drawBarChart, cipherLetters, { tip: view.tips.letters(cipherLetters, text.tips) }),
    ),
  );
  updateAlgorithm();
}

function updateCompare() {
  const C = text.compare;
  const c = current();
  const rows = C.rows(view.ciphertextSize(c.encryption.blocks));
  fill(
    regions.compare,
    h('p', { text: C.intro }),
    table('discussion compare', C.cols, rows.map((row) => ({ cells: [{ head: true, text: row[0] }, ...row.slice(1).map((cell) => ({ text: cell }))] }))),
    paras(C.after),
  );
}

function updateProperties() {
  const P = text.properties;
  const F = text.fmt;
  const s = computed.stats && computed.stats.value;
  if (!s) {
    fill(regions.propertiesStats, pending(computed.stats));
    return;
  }
  const bytes = view.ecBytesChart(s, F.decimal);
  fill(
    regions.propertiesStats,
    h('p', { text: P.sampleIntro(s) }),
    figure(P.bytesChart(s), hw.drawBarChart, bytes, { wide: true, tip: view.tips.ecBytes(bytes, text.tips) }),
    subtitle(P.tableTitle),
    table('discussion ciphers', [P.cols.text, P.cols.symbols, P.cols.entropy, P.cols.ic], view.cipherRows(s).map((r) => ({
      cells: [{ head: true, text: P.rowNames[r.key] }, { text: F.int(r.symbols) }, { text: P.entropyCell(r.entropy, r.max) }, { text: P.icCell(r.ic, r.uniformIc) }],
    }))),
    h('p', { text: P.repeated(s) }),
    tests('caesar', s),
    tests('ec', s),
    paras(P.explain(s)),
  );
}

// ---------------------------------------------------------------------------
// 3. Crittanalisi statistica
// ---------------------------------------------------------------------------

function cryptanalysisSection() {
  const S = text.sections;
  for (const name of ['corpus', 'algorithmLive', 'lengths', 'methods']) regions[name] = h('div');
  regions.cryptanalysis = h(
    'section',
    { class: 'section' },
    title('hw2a-cryptanalysis', 0, S.cryptanalysis),
    paras(text.cryptanalysis.intro),
    title('hw2a-corpus', 1, S.corpus),
    paras(text.corpus.intro),
    regions.corpus,
    title('hw2a-algorithm', 1, S.algorithm),
    paras(text.algorithm.intro),
    formulas(text.algorithm.formula),
    subtitle(text.algorithm.liveTitle),
    regions.algorithmLive,
    paras(text.algorithm.after),
    title('hw2a-lengths', 1, S.lengths),
    regions.lengths,
    title('hw2a-methods', 1, S.methods),
    paras(text.methods.intro),
    h('ul', { class: 'roles' }, text.methods.list.map((item) => h('li', null, h('strong', { text: text.methodNames[item.method] }), `: ${item.text}`))),
    regions.methods,
    title('hw2a-limits', 1, S.limits),
    paras(text.limits.paras),
  );
  return regions.cryptanalysis;
}

function updateCorpus() {
  const C = text.corpus;
  const F = text.fmt;
  const s = computed.stats && computed.stats.value;
  if (!s) {
    fill(regions.corpus, pending(computed.stats));
    return;
  }
  const chart = view.corpusChart(s, F.decimal);
  fill(
    regions.corpus,
    subtitle(C.chaptersTitle),
    table('discussion chapters', [C.cols.number, C.cols.title, C.cols.letters, C.cols.role], view.chapterRows(s).map((c) => ({
      class: `is-${c.role}`,
      cells: [{ head: true, text: c.number }, { text: c.title }, { text: F.int(c.letters) }, { text: C.roles[c.role] }],
    }))),
    figure(C.chart(s), hw.drawBarChart, chart, { wide: true, tip: view.tips.corpus(chart, text.tips) }),
    paras(C.facts(s)),
    tests('corpus', s),
    paras(C.modelsIntro),
    formulas(C.formula),
    subtitle(C.modelsTitle),
    table('discussion models', ['order', 'beta', 'crossEntropy', 'redundancy', 'unicity'].map((k) => C.modelCols[k]), view.modelRows(s).map((r) => ({
      cells: [{ head: true, text: `${r.order} (${C.orderName(r.order)})` }, { text: F.num(r.beta, r.beta < 1 ? 1 : 0) }, { text: F.num(r.crossEntropy, 3) }, { text: F.num(r.redundancy, 3) }, { text: F.num(r.unicity, 1) }],
    }))),
    paras(C.after(s)),
  );
}

function updateAlgorithm() {
  const A = text.algorithm;
  const F = text.fmt;
  const models = languageModels();
  if (!models) {
    fill(regions.algorithmLive, computed.stats && computed.stats.error ? pending(computed.stats) : h('p', { class: 'note pending', role: 'status', text: A.pending }));
    return;
  }
  const c = current();
  const shift = state.applied.shift;
  const crack = hw.crackCaesar(c.caesar.cipher, models);
  const chart = view.posteriorChart(crack, F.decimal);
  fill(
    regions.algorithmLive,
    check(crack.key === shift, A.live(crack, shift)),
    figure(A.posteriorChart, hw.drawBarChart, chart, { wide: true, tip: view.tips.posterior(crack, text.tips) }),
    subtitle(A.candidatesTitle),
    table('discussion candidates', [A.candidateCols.shift, A.candidateCols.perLetter, A.candidateCols.posterior, A.candidateCols.text], view.candidateRows(crack).map((r) => ({
      class: r.shift === crack.key ? 'is-current' : null,
      cells: [{ head: true, text: r.shift }, { text: F.num(r.perLetter, 3) }, { text: F.prob(r.posterior) }, { node: h('code', { text: r.text.length > 60 ? `${r.text.slice(0, 60)}...` : r.text }) }],
    }))),
    paras(A.fit(view.fitChecks(crack, models))),
  );
}

function updateLengths() {
  const L = text.lengths;
  const F = text.fmt;
  const s = computed.stats && computed.stats.value;
  if (!s) {
    fill(regions.lengths, pending(computed.stats));
    return;
  }
  const chart = view.successChart(s, F.decimal);
  fill(
    regions.lengths,
    paras(L.intro(s)),
    figure(L.chart, hw.drawLineChart, chart, { wide: true, tip: view.tips.success(s, text.tips), items: [{ label: L.legend[0] }, { label: L.legend[1], dashed: true }] }),
    subtitle(L.tableTitle),
    h('div', { class: 'scroll' }, table('compact lengths', [L.cols.length, L.cols.trials, L.cols.rate, L.cols.interval, L.cols.bound], view.lengthRows(s).map((r) => ({
      cells: [{ text: r.length }, { text: F.int(r.trials) }, { text: F.pct(r.rates.unigram) }, { text: `${F.pct(r.interval[0])} - ${F.pct(r.interval[1])}` }, { text: F.pct(r.bound) }],
    })))),
    paras(L.explain(s)),
  );
}

function updateMethods() {
  const M = text.methods;
  const F = text.fmt;
  const s = computed.stats && computed.stats.value;
  if (!s) {
    fill(regions.methods, pending(computed.stats));
    return;
  }
  const chart = view.methodsChart(s, F.decimal);
  fill(
    regions.methods,
    figure(M.chart, hw.drawLineChart, chart, { wide: true, tip: view.tips.methods(s, text.tips), items: hw.METHODS.map((m) => ({ label: text.methodNames[m] })) }),
    subtitle(M.tableTitle),
    table('discussion thresholds', [M.cols.method, ...M.cols.levels], view.thresholds(s).map((row) => ({
      cells: [{ head: true, text: text.methodNames[row.method] }, ...row.levels.map((v) => ({ text: v === null ? M.never : String(v) }))],
    }))),
    paras(M.explain(s)),
  );
}

// ---------------------------------------------------------------------------
// 4. L'attacco allo schema giocattolo
// ---------------------------------------------------------------------------

function attackSection() {
  const S = text.sections;
  for (const name of ['exhaustive', 'bsgs', 'kangaroo', 'scaling', 'weaknessesLive']) regions[name] = h('div');
  const D = text.differences;
  const W = text.weaknesses;
  regions.attack = h(
    'section',
    { class: 'section' },
    title('hw2a-attack', 0, S.attack),
    paras(text.attack.intro),
    title('hw2a-exhaustive', 1, S.exhaustive),
    paras(text.exhaustive.intro),
    regions.exhaustive,
    paras(text.exhaustive.after),
    title('hw2a-bsgs', 1, S.bsgs),
    paras(text.bsgs.intro),
    formulas(text.bsgs.formula),
    regions.bsgs,
    paras(text.bsgs.after),
    title('hw2a-kangaroo', 1, S.kangaroo),
    paras(text.kangaroo.intro),
    regions.kangaroo,
    paras(text.kangaroo.after),
    title('hw2a-scaling', 1, S.scaling),
    regions.scaling,
    title('hw2a-differences', 1, S.differences),
    h('p', { text: D.intro }),
    table('discussion differences', D.cols, D.rows.map((row) => ({ cells: [{ head: true, text: row[0] }, { text: row[1] }, { text: row[2] }] }))),
    paras(D.after),
    title('hw2a-real', 1, S.real),
    paras(text.real.paras),
    title('hw2a-weaknesses', 1, S.weaknesses),
    h('p', { text: W.intro }),
    table('discussion weaknesses', [W.cols.weakness, W.cols.origin, W.cols.attack, W.cols.fix], W.rows.map((row) => ({ cells: [{ head: true, text: row[0] }, { text: row[1] }, { text: row[2] }, { text: row[3] }] }))),
    regions.weaknessesLive,
    paras(W.after),
  );
  return regions.attack;
}

function updateAttacks() {
  const c = current();
  const ready = attacks.key === c.publicKey;
  const X = text.exhaustive;
  const B = text.bsgs;
  const ex = ready && attacks.exhaustive;
  if (ex && ex.value) {
    const r = view.exhaustiveSummary(ex.value, state.applied.key);
    fill(regions.exhaustive, r.found ? check(true, X.found(r)) : h('p', { text: X.notFound(r, state.applied.key) }));
  } else fill(regions.exhaustive, pending(ex || null));
  const bs = ready && attacks.bsgs;
  if (bs && bs.value) {
    const r = view.bsgsSummary(bs.value);
    const recovered = r.found ? hw.toyScheme(BigInt(r.key)).decrypt(c.encryption.blocks) : null;
    fill(regions.bsgs, check(r.found, B.result(r)), recovered && [value(B.decryptedLabel, recovered.text ?? ''), check(recovered.ok, B.check(recovered.ok))]);
  } else fill(regions.bsgs, pending(bs || null));
  const ka = ready && attacks.kangaroo;
  if (ka && ka.value) fill(regions.kangaroo, check(ka.value.found, text.kangaroo.result(ka.value)));
  else fill(regions.kangaroo, pending(ka || null));
}

function updateScaling() {
  const C = text.scaling;
  const F = text.fmt;
  const sc = computed.scaling && computed.scaling.value;
  if (!sc) {
    fill(regions.scaling, pending(computed.scaling));
    return;
  }
  const chart = view.scalingChart(sc, F.decimal);
  fill(
    regions.scaling,
    paras(C.intro(sc)),
    figure(C.chart, hw.drawLineChart, chart, { wide: true, tip: view.tips.scaling(sc, text.tips), items: C.legend.map((label, i) => ({ label, color: i })) }),
    subtitle(C.fitsTitle),
    table('discussion fits', [C.fitCols.method, C.fitCols.slope, C.fitCols.theory, C.fitCols.constant], view.ATTACKS.map((m) => ({
      cells: [{ head: true, text: text.attackNames[m] }, { text: `${F.num(sc.fits[m].slope, 3)} ± ${F.num(sc.fits[m].slopeError, 3)}` }, { text: F.num(sc.fits[m].exponent, 1) }, { text: F.num(sc.fits[m].constant, 2) }],
    }))),
    subtitle(C.extrapolationTitle),
    table('discussion extrapolation', ['bits', 'exhaustive', 'best', 'here', 'fast', 'memory'].map((k) => C.extrapolationCols[k]), view.extrapolationRows(sc).map((r) => ({
      cells: [{ head: true, text: r.bits }, { text: F.pow2(r.log2.exhaustive) }, { text: F.pow2(r.best) }, { text: F.duration(r.here) }, { text: F.duration(r.fast) }, { text: C.memory(r.memory) }],
    }))),
    paras(C.explain(sc)),
  );
}

function updateWeaknesses() {
  const W = text.weaknesses;
  const c = current();
  const best = c.reuse.attack && c.reuse.attack.candidates.length ? c.reuse.attack.candidates[0] : null;
  fill(
    regions.weaknessesLive,
    subtitle(W.reuseTitle),
    staleNote(text.scheme.stale),
    paras(W.reuse(c.reuse)),
    best && [value(W.reuseResult, best.text), check(best.text === state.applied.message, W.reuseCheck(best.text === state.applied.message))],
    subtitle(W.augustusTitle),
    h('p', { text: W.augustus }),
    c.augustus.ok ? value('', c.augustus.text ?? '') : h('p', { class: 'note', text: W.augustusFail }),
    h('p', { text: W.augustusAfter }),
  );
}

// ---------------------------------------------------------------------------
// 5, 6 e 7
// ---------------------------------------------------------------------------

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section' }, title('hw2a-tests', 0, text.sections.tests), h('p', { text: text.tests.intro }), regions.tests);
}

function updateTests() {
  const T = text.tests;
  const F = text.fmt;
  const s = computed.stats && computed.stats.value;
  if (!s) {
    fill(regions.tests, pending(computed.stats));
    return;
  }
  const summary = view.testSummary(s);
  fill(
    regions.tests,
    h('p', { text: T.keysIntro(s) }),
    tests('keys', s),
    table('discussion summary-tests', [T.cols.subject, T.cols.hypothesis, T.cols.p, T.cols.verdict, T.cols.expected], summary.all.map((t) => {
      const rejected = t.result.verdict === 'reject';
      return {
        class: rejected ? 'is-rejected' : null,
        cells: [{ head: true, text: text.stats.groups[t.group] }, { text: text.stats.labels[t.group][t.key] }, { text: F.pval(t.result.pValue) }, { text: text.stats.verdict[rejected ? 'reject' : 'notReject'] }, { text: text.stats.expected[t.expected] }],
      };
    })),
    paras(T.after(summary)),
  );
}

function historySection() {
  const H = text.history;
  return h(
    'section',
    { class: 'section' },
    title('hw2a-history', 0, text.sections.history),
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
  return h('section', { class: 'section' }, title('hw2a-conclusion', 0, text.sections.conclusion), regions.conclusion);
}

function updateConclusion() {
  fill(regions.conclusion, paras(text.conclusion((computed.stats && computed.stats.value) || null)));
}

// ---------------------------------------------------------------------------
// Aggiornamenti e calcoli lunghi
// ---------------------------------------------------------------------------

function updateStats() {
  updateProperties();
  updateCorpus();
  updateAlgorithm();
  updateLengths();
  updateMethods();
  updateTests();
  updateConclusion();
}

function updateScheme() {
  const c = current();
  updateKeys(c);
  updateEncryption(c);
  updateDecryption(c);
  updateCaesar();
  updateCompare();
  updateWeaknesses();
  updateAttacks();
  scheduleAttacks();
}

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

let attackTimer = null;

// Gli attacchi ripartono quando la chiave smette di cambiare; quelli sulla
// chiave vecchia vengono fermati alla fetta successiva.
function scheduleAttacks() {
  const publicKey = current().publicKey;
  if (attacks.key === publicKey) return;
  clearTimeout(attackTimer);
  attackTimer = setTimeout(() => startAttacks(publicKey), 400);
}

function startAttacks(publicKey) {
  if (attacks.token) attacks.token.cancelled = true;
  const token = { cancelled: false };
  Object.assign(attacks, { key: publicKey, token, exhaustive: null, bsgs: null, kangaroo: null });
  updateAttacks();
  const run = (name) => hw.runStepsAsync(() => cancellable(hw.attackSteps(name, publicKey), token)).then(
    (value) => {
      if (token.cancelled || value === null) return;
      attacks[name] = { value };
      updateAttacks();
    },
    (error) => {
      if (token.cancelled) return;
      attacks[name] = { error: message(error) };
      updateAttacks();
    },
  );
  // the quick ones first: the exhaustive search takes seconds
  run('bsgs').then(() => run('kangaroo')).then(() => run('exhaustive'));
}

function startComputations() {
  setTimeout(() => {
    try {
      computed.verify = { value: hw.verifyAll() };
    } catch (error) {
      computed.verify = { error: message(error) };
    }
    updateVerify();
  }, 50);
  hw.exploreAsync().then(
    (value) => {
      computed.stats = { value };
      updateStats();
    },
    (error) => {
      computed.stats = { error: message(error) };
      updateStats();
    },
  );
  hw.scalingAsync().then(
    (value) => {
      computed.scaling = { value };
      updateScaling();
    },
    (error) => {
      computed.scaling = { error: message(error) };
      updateScaling();
    },
  );
  startAttacks(current().publicKey);
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
  document.title = 'Homework #2 - Statistics';
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
  text = HW2A_TEXTS[state.lang];
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), schemeSection(), caesarSection(), cryptanalysisSection(), attackSection(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateInputs(view.readInputs(state.fields));
  const c = current();
  updateKeys(c);
  updateEncryption(c);
  updateDecryption(c);
  updateVerify();
  updateCaesar();
  updateCompare();
  updateWeaknesses();
  updateAttacks();
  updateScaling();
  updateStats();
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
  startComputations();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
