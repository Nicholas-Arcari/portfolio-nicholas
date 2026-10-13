// src/pages/statistics/hw2/standalone/app.js
// L'interfaccia del programma scaricabile, in JavaScript puro: niente React,
// niente dipendenze. Disegna le stesse sezioni della pagina del sito con gli
// stessi testi (texts.js), la stessa logica di presentazione (view.js) e gli
// stessi calcoli (homework2.js). La build (build/homework-standalone.js) lo
// unisce a view.js e texts.js in un unico app.js, uno script classico che si
// apre anche da file:// con un doppio clic su index.html.
//
// Ogni testo entra nella pagina con textContent, mai come HTML: nemmeno
// quello che si scrive nei campi puo' diventare markup.
import * as hw from '../homework2.js';
import * as view from '../view.js';
import { HW2_TEXTS, originalAssignment } from '../texts.js';

const HEADINGS = ['h2', 'h3', 'h4'];
const LANGUAGES = ['it', 'en'];
const hex = hw.toHex;

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#161616',
    text: '#d6d6d6',
    grid: '#262626',
    bars: '#7986cb',
    reference: '#ff6b81',
    heatNegative: '#5b8def',
    heatZero: '#1e1e1e',
    heatPositive: '#ff6b81',
    heatNull: '#3a3a3a',
  },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const palette = () => (darkQuery.matches ? PALETTES.dark : PALETTES.light);

// I campi non devono passare per correttori, completamenti o gestori di
// password: una frase mnemonica non deve uscire dal browser.
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

function initialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (LANGUAGES.includes(fromUrl)) return fromUrl;
  try {
    const saved = window.localStorage.getItem('hw2-lang');
    if (LANGUAGES.includes(saved)) return saved;
  } catch {
    // file:// o navigazione privata: nessuna preferenza salvata
  }
  return 'it';
}

const state = {
  lang: initialLanguage(),
  fields: { ...view.TEST_INPUTS },
  applied: view.appliedInput(view.readInputs(view.TEST_INPUTS)),
};
let text = HW2_TEXTS[state.lang];
const regions = {};
const controls = {};
const computed = { vectors: null, stats: null }; // null while computing, then { value } or { error }

const sameApplied = (a, b) => a.mnemonic === b.mnemonic && a.passphrase === b.passphrase && a.path === b.path;

// Il seed (2048 iterazioni di PBKDF2) si ricalcola solo se cambiano frase o
// passphrase; le chiavi solo se cambia anche il percorso.
const cache = { seedKey: null, seed: null, analysis: null, comparison: null, path: null, keys: null };

function currentPipeline() {
  const a = state.applied;
  const seedKey = JSON.stringify([a.mnemonic, a.passphrase]);
  if (cache.seedKey !== seedKey) {
    cache.seedKey = seedKey;
    cache.seed = hw.mnemonicToSeed(a.mnemonic, a.passphrase);
    cache.analysis = hw.analyzeMnemonic(a.mnemonic);
    cache.comparison = view.presetComparison(cache.seed);
    cache.path = null;
  }
  if (cache.path !== a.path) {
    cache.path = a.path;
    cache.keys = hw.keysFromSeed(cache.seed, a.path);
  }
  return { ok: true, analysis: cache.analysis, passphrase: a.passphrase, ...cache.keys };
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
const pending = () => h('p', { class: 'note pending', role: 'status', text: text.ui.computing });
const failure = (message) => h('p', { class: 'note', text: text.ui.error(message) });
// La nota "valori dell'ultimo input valido" c'e' sempre, nascosta: la mostra
// il CSS quando la sezione della pipeline ha la classe is-stale. Cosi' un
// errore in un campo cambia una classe invece di ridisegnare tutto.
const staleNote = () => h('p', { class: 'stale stale-note', text: text.pipeline.stale });
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad', text: label });

/** A labelled value: the label above, the (long, hexadecimal) value below. */
const value = (label, content, extra = '') => h('div', { class: `value ${extra}`.trim() }, h('span', { class: 'value-label', text: label }), h('code', null, content));

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

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  const blocks = originalAssignment().map((block) => {
    if (block.type === 'title' || block.type === 'heading') return h('p', null, h('strong', { text: block.text }));
    if (block.type === 'lines') return h('p', null, block.lines.map((line, j) => (j ? [h('br'), line] : line)));
    return h('p', { text: block.text });
  });
  return h(
    'section',
    { class: 'section' },
    title('hw2-assignment', 0, text.sections.assignment),
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
// 1. TASK: la pipeline
// ---------------------------------------------------------------------------

function pipelineSection() {
  const S = text.sections;
  for (const name of ['flow', 'mnemonicStatus', 'pathHelp', 'stale', 'badge', 'bip39', 'seed', 'bip32', 'bip44', 'secp', 'keccak', 'eip55', 'vectors', 'wallets']) {
    regions[name] = h('div');
  }
  regions.pipeline = h(
    'section',
    { class: 'section' },
    title('hw2-pipeline', 0, S.pipeline),
    paras(text.pipeline.intro),
    regions.flow,

    title('hw2-input', 1, S.input),
    inputBlock(),

    title('hw2-bip39', 1, S.bip39),
    paras(text.bip39.intro),
    regions.bip39,
    subtitle(text.bip39.seedTitle),
    h('pre', { text: text.bip39.seedFormula }),
    regions.seed,
    paras(text.bip39.after),

    title('hw2-bip32', 1, S.bip32),
    paras(text.bip32.intro),
    regions.bip32,

    title('hw2-bip44', 1, S.bip44),
    h('p', { text: text.bip44.intro }),
    regions.bip44,
    paras(text.bip44.after),

    title('hw2-secp256k1', 1, S.secp256k1),
    paras(text.secp.intro),
    constantsBlock(),
    regions.secp,
    paras(text.secp.after),

    title('hw2-keccak', 1, S.keccak),
    h('p', { text: text.keccak.intro }),
    regions.keccak,
    paras(text.keccak.after),

    title('hw2-eip55', 1, S.eip55),
    paras(text.eip55.intro),
    regions.eip55,
    paras(text.eip55.after),

    title('hw2-verify', 1, S.verify),
    h('p', { text: text.verify.intro }),
    regions.vectors,

    title('hw2-wallets', 1, S.wallets),
    h('p', { text: text.wallets.intro }),
    h('ol', { class: 'steps' }, text.wallets.steps.map((step) => h('li', { text: step }))),
    regions.wallets,
  );
  return regions.pipeline;
}

function updateFlow(pipeline) {
  const P = text.pipeline;
  fill(
    regions.flow,
    h(
      'figure',
      { class: 'flow' },
      h('figcaption', { text: P.flowTitle }),
      staleNote(),
      h('ol', null, view.flowNodes(pipeline).map((item) => (item.arrow
        ? h('li', { class: 'flow-arrow' }, h('button', { type: 'button', onclick: () => goTo(item.target) }, h('span', { 'aria-hidden': 'true', text: '↓' }), ` ${P.arrows[item.arrow]}`))
        : h('li', { class: 'flow-node' }, h('span', { text: P.nodes[item.key] }), h('code', { text: item.value }))))),
    ),
  );
}

// --- 1.1 I campi ----------------------------------------------------------------

function inputBlock() {
  const I = text.input;
  const f = state.fields;
  controls.mnemonic = h('textarea', {
    rows: 3,
    ...PRIVATE_FIELD,
    maxlength: view.MNEMONIC_MAX_LENGTH,
    'aria-describedby': 'mnemonic-status',
    oninput: (e) => changeFields({ mnemonic: e.target.value.slice(0, view.MNEMONIC_MAX_LENGTH) }),
  });
  controls.mnemonic.value = f.mnemonic;
  controls.passphrase = h('input', {
    type: 'text',
    class: 'wide',
    ...PRIVATE_FIELD,
    maxlength: view.PASSPHRASE_MAX_LENGTH,
    'aria-describedby': 'passphrase-help',
    oninput: (e) => changeFields({ passphrase: e.target.value.slice(0, view.PASSPHRASE_MAX_LENGTH) }),
  });
  controls.passphrase.value = f.passphrase;
  controls.preset = h(
    'select',
    { onchange: (e) => changePreset(e.target.value) },
    view.PRESETS.map((p) => h('option', { value: p, text: I.presets[p] })),
  );
  controls.preset.value = f.preset;
  controls.index = h('input', {
    type: 'text',
    inputmode: 'numeric',
    ...PRIVATE_FIELD,
    maxlength: view.INDEX_MAX_LENGTH,
    'aria-describedby': 'path-help',
    oninput: (e) => changeFields({ indexText: e.target.value.slice(0, view.INDEX_MAX_LENGTH) }),
  });
  controls.index.value = f.indexText;
  controls.path = h('input', {
    type: 'text',
    class: 'wide',
    ...PRIVATE_FIELD,
    maxlength: view.PATH_MAX_LENGTH,
    'aria-describedby': 'path-help',
    oninput: (e) => changeFields({ customPath: e.target.value.slice(0, view.PATH_MAX_LENGTH) }),
  });
  controls.path.value = f.customPath;
  controls.indexLabel = h('label', null, h('span', { text: I.indexLabel }), controls.index);
  controls.pathLabel = h('label', null, h('span', { text: I.pathLabel }), controls.path);

  return [
    h('p', { text: I.intro }),
    h(
      'div',
      { class: 'fields' },
      h('label', { class: 'mnemonic' }, h('span', { text: I.mnemonicLabel }), controls.mnemonic),
      regions.mnemonicStatus,
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', class: 'btn alt', text: I.useTest, onclick: () => changeFields({ mnemonic: hw.TEST_MNEMONIC }, true) }),
        h('button', { type: 'button', class: 'btn alt', text: I.random(12), onclick: () => changeFields({ mnemonic: hw.generateMnemonic(12) }, true) }),
        h('button', { type: 'button', class: 'btn alt', text: I.random(24), onclick: () => changeFields({ mnemonic: hw.generateMnemonic(24) }, true) }),
      ),
      h('p', { class: 'note', text: I.randomNote }),
      h('div', { class: 'controls' }, h('label', null, h('span', { text: I.passphraseLabel }), controls.passphrase)),
      h('p', { id: 'passphrase-help', class: 'note', text: I.passphraseHint }),
      h('div', { class: 'controls' }, h('label', null, h('span', { text: I.presetLabel }), controls.preset), controls.indexLabel, controls.pathLabel),
      regions.pathHelp,
    ),
    regions.stale,
    regions.badge,
  ];
}

/** Puts the values of the state into the fields, after a button changed them. */
function syncFields() {
  const f = state.fields;
  if (controls.mnemonic.value !== f.mnemonic) controls.mnemonic.value = f.mnemonic;
  if (controls.passphrase.value !== f.passphrase) controls.passphrase.value = f.passphrase;
  if (controls.preset.value !== f.preset) controls.preset.value = f.preset;
  if (controls.index.value !== f.indexText) controls.index.value = f.indexText;
  if (controls.path.value !== f.customPath) controls.path.value = f.customPath;
}

function changeFields(patch, fromButton = false) {
  state.fields = { ...state.fields, ...patch };
  if (fromButton) syncFields();
  const read = view.readInputs(state.fields);
  regions.pipeline.classList.toggle('is-stale', !read.valid);
  let refresh = false;
  if (read.valid) {
    const input = view.appliedInput(read);
    if (!sameApplied(input, state.applied)) {
      state.applied = input;
      refresh = true;
    }
  }
  updateInputs(read);
  updateBip39(read);
  if (refresh) updatePipeline();
}

function changePreset(value) {
  const preset = view.PRESETS.includes(value) ? value : 'bip44';
  const read = view.readInputs(state.fields);
  changeFields(preset === 'custom' && read.path.ok ? { preset, customPath: read.path.value } : { preset }, true);
}

function updateInputs(read) {
  const I = text.input;
  const a = read.analysis;
  const f = state.fields;
  let status;
  if (a.error === 'empty') status = I.status.empty;
  else if (a.error === 'unknown-word') status = I.status.unknown(a.unknown.map((u) => ({ ...u, suggestions: view.suggestWords(u.word) })));
  else if (a.error === 'length') status = I.status.length(a.count);
  else if (a.error === 'checksum') status = I.status.checksum(a);
  else status = I.status.valid(a);
  fill(regions.mnemonicStatus, h('p', { id: 'mnemonic-status', class: a.valid ? 'check is-ok' : 'field-error', role: a.valid ? null : 'alert', text: status }));
  controls.mnemonic.setAttribute('aria-invalid', String(!a.valid));

  const custom = f.preset === 'custom';
  controls.indexLabel.hidden = custom;
  controls.pathLabel.hidden = !custom;
  controls.index.setAttribute('aria-invalid', String(!read.index.ok));
  controls.path.setAttribute('aria-invalid', String(!read.path.ok));
  let error = null;
  if (!custom && !read.index.ok) {
    if (read.index.error === 'notInteger') error = I.indexError.notInteger(read.index.text);
    else if (read.index.error === 'range') error = I.indexError.range(view.INDEX_MAX);
    else error = I.indexError.empty;
  } else if (custom && !read.path.ok) {
    error = I.pathError[read.path.error];
  }
  fill(
    regions.pathHelp,
    h('p', { id: 'path-help', class: error ? 'field-error' : 'note', role: error ? 'alert' : null, text: error || (custom ? I.pathHint : I.indexHint(view.INDEX_MAX)) }),
  );
  fill(regions.stale, read.valid ? null : h('p', { class: 'stale', role: 'status', text: I.stale }));
  const isTest = view.isTestInput(f);
  fill(
    regions.badge,
    h(
      'p',
      { class: isTest ? 'badge-line is-task' : 'badge-line is-custom' },
      h('span', { text: isTest ? I.testBadge(hw.TEST_ACCOUNTS[0].address) : I.customBadge }),
      isTest ? null : h('button', { type: 'button', class: 'btn alt', text: I.restore, onclick: () => changeFields(view.TEST_INPUTS, true) }),
    ),
  );
}

// --- 1.2 BIP-39 -------------------------------------------------------------------

function updateBip39(read) {
  const B = text.bip39;
  const analysis = read.analysis;
  const rows = view.wordRows(analysis);
  const groups = view.bitGroups(analysis);
  const hidden = analysis.count - rows.length;
  fill(
    regions.bip39,
    subtitle(B.wordsTitle),
    rows.length
      ? h(
        'div',
        { class: 'scroll' },
        table(
          'compact words',
          [B.cols.position, B.cols.word, B.cols.index, B.cols.bits],
          rows.map((r) => ({
            class: r.index === null ? 'is-unknown' : null,
            cells: [{ text: String(r.position) }, { text: r.word }, { text: r.index === null ? '-' : String(r.index) }, { text: r.bits === null ? B.notInList : r.bits }],
          })),
        ),
      )
      : null,
    hidden > 0 ? h('p', { class: 'note', text: B.moreWords(hidden) }) : null,
    groups.length
      ? [
        subtitle(B.bitsTitle(analysis.bits.length - analysis.checksum.length, analysis.checksum.length)),
        h('p', { class: 'bits-line' }, groups.map((g) => h('span', null, g.entropy, g.checksum ? h('mark', { text: g.checksum }) : null))),
        value(B.entropyLabel(analysis.entropy.length * 8), hex(analysis.entropy)),
        value(B.hashLabel, view.entropyHash(analysis)),
        check(analysis.valid, analysis.valid ? B.checksumOk(analysis) : B.checksumBad(analysis)),
      ]
      : h('p', { class: 'note', text: B.noBits }),
  );
}

// --- La pipeline calcolata: 1.2 (seed) - 1.7 ------------------------------------------

function updatePipeline() {
  const pipeline = currentPipeline();
  updateFlow(pipeline);
  fill(regions.seed, staleNote(), value(text.bip39.seedLabel(pipeline.passphrase !== ''), hex(pipeline.seed)));
  updateBip32(pipeline);
  updateBip44(pipeline);
  updateSecp(pipeline);
  updateKeccak(pipeline);
  updateEip55(pipeline);
}

function updateBip32(pipeline) {
  const B = text.bip32;
  const leak = view.leakDemo(pipeline);
  const parent = view.parentPath(pipeline);
  fill(
    regions.bip32,
    subtitle(B.levelsTitle),
    staleNote(),
    table(
      'discussion levels',
      [B.cols.path, B.cols.kind, B.cols.data, B.cols.key, B.cols.chain],
      view.levelRows(pipeline).map((r) => ({
        cells: [
          { head: true, node: h('code', { text: r.path }) },
          { text: B.kinds[r.kind] },
          { node: h('code', { text: view.shortHex(r.data, 6) }) },
          { node: h('code', { text: view.shortHex(r.key, 6) }) },
          { node: h('code', { text: view.shortHex(r.chainCode, 6) }) },
        ],
      })),
    ),
    subtitle(B.extendedTitle),
    value(B.xprv(pipeline.path), pipeline.extended.xprv),
    value(B.xpub(pipeline.path), pipeline.extended.xpub),
    parent ? value(B.parentXpub(parent), pipeline.extended.parentXpub) : null,
    h('p', { class: 'note', text: B.extendedNote }),
    subtitle(B.leakTitle),
    leak.applicable ? paras(B.leak(leak)) : h('p', { text: leak.reason === 'master' ? B.leakMaster : B.leakHardened }),
  );
}

function updateBip44(pipeline) {
  const B = text.bip44;
  const levels = view.bip44Levels(pipeline.levels);
  fill(
    regions.bip44,
    subtitle(B.levelsTitle(pipeline.path)),
    staleNote(),
    levels.standard
      ? h('ul', { class: 'roles' }, levels.rows.map((r) => h('li', null, h('code', { text: r.label }), ` ${B.roles[r.role](r.value)}`)))
      : h('p', { text: B.notStandard(pipeline.path) }),
    subtitle(B.compareTitle),
    h('p', { text: B.compareIntro(view.COMPARISON_ACCOUNTS) }),
    table(
      'discussion compare',
      [B.cols.wallet, B.cols.path, B.cols.address],
      cache.comparison.map((r) => {
        const known = view.testAccount(r.address);
        return {
          class: r.path === pipeline.path ? 'is-current' : null,
          cells: [
            { head: true, text: B.presetNames[r.preset] },
            { node: h('code', { text: r.path }) },
            { node: h('span', null, h('code', { text: r.address }), known ? h('span', { class: 'note', text: ` (${B.testMark} ${known.index + 1})` }) : null) },
          ],
        };
      }),
    ),
  );
}

function constantsBlock() {
  const C = text.secp;
  const params = view.curveParameters();
  return h('details', { class: 'details' }, h('summary', { text: C.constantsTitle }), ['p', 'n', 'Gx', 'Gy'].map((key) => value(C.constants[key], params[key])));
}

function updateSecp(pipeline) {
  const C = text.secp;
  const checks = view.curveChecks(pipeline);
  fill(
    regions.secp,
    subtitle(C.keyTitle),
    staleNote(),
    value(C.keyLabel, hex(pipeline.privateKey)),
    check(checks.keyInRange, C.keyCheck(checks.keyInRange)),
    value(C.xLabel, checks.x),
    value(C.yLabel, checks.y),
    check(checks.onCurve, C.onCurve(checks.onCurve)),
    subtitle(C.encodingsTitle),
    value(C.uncompressed, hex(pipeline.publicKey.uncompressed)),
    value(C.compressed(checks.even), hex(pipeline.publicKey.compressed)),
    value(C.ethereumForm, hex(pipeline.address.xy)),
    check(checks.decodes, C.decompress(checks.decodes)),
  );
}

function updateKeccak(pipeline) {
  const K = text.keccak;
  const parts = view.hashParts(pipeline);
  fill(
    regions.keccak,
    staleNote(),
    value(K.inputLabel, hex(pipeline.address.xy)),
    value(K.hashLabel, [h('span', { class: 'dropped', text: parts.dropped }), h('mark', { text: parts.kept })]),
    value(K.addressLabel, pipeline.address.address),
    value(K.sha3Label, parts.sha3, 'is-muted'),
  );
}

function updateEip55(pipeline) {
  const E = text.eip55;
  const c = pipeline.checksum;
  const letters = c.chars.filter((ch) => ch.letter).length;
  const result = h('div');
  const checker = h('input', {
    type: 'text',
    ...PRIVATE_FIELD,
    maxlength: view.ADDRESS_MAX_LENGTH,
    'aria-describedby': 'checker-result',
    oninput: (e) => showCheck(e.target.value.slice(0, view.ADDRESS_MAX_LENGTH)),
  });
  checker.value = c.address;
  function showCheck(typed) {
    const r = view.checkTypedAddress(typed, c.address);
    let message;
    let className = 'check';
    if (r.status === 'format') {
      message = E.check.format;
      className = 'check is-bad';
    } else if (r.status === 'valid') {
      message = E.check.valid(r.same);
      if (r.same) className = 'check is-ok';
    } else if (r.status === 'noChecksum') {
      message = E.check.noChecksum(r.same);
    } else {
      message = E.check.invalid(r.same, r.positions);
      className = 'check is-bad';
    }
    fill(result, h('p', { id: 'checker-result', class: className, 'aria-live': 'polite', text: message }));
  }
  showCheck(c.address);
  fill(
    regions.eip55,
    subtitle(E.gridTitle),
    staleNote(),
    h(
      'div',
      { class: 'grid', role: 'img', 'aria-label': `${E.resultLabel}: ${c.address}` },
      c.chars.map((ch, i) => h(
        'span',
        { class: ch.letter ? (ch.upper ? 'is-upper' : 'is-lower') : 'is-digit' },
        h('b', { text: ch.upper ? ch.char.toUpperCase() : ch.char }),
        h('small', { text: c.hash[i] }),
      )),
    ),
    h('p', { class: 'note', text: E.gridLegend }),
    value(E.hashLabel, c.hash),
    value(E.resultLabel, c.address),
    h('p', { text: E.letters(letters) }),
    subtitle(E.checkerTitle),
    h('div', { class: 'controls' }, h('label', { class: 'checker' }, h('span', { text: E.checkerLabel }), checker)),
    h('p', { class: 'note', text: E.checkerHint }),
    result,
  );
}

// --- 1.8 Vettori di test e 1.9 Wallet ---------------------------------------------------

function updateVectors() {
  const V = text.verify;
  const W = text.wallets;
  const result = computed.vectors;
  const rows = result && result.value ? result.value : [];
  if (!result) fill(regions.vectors, pending());
  else if (result.error) fill(regions.vectors, failure(result.error));
  else {
    const ok = rows.filter((r) => r.ok).length;
    fill(
      regions.vectors,
      h('p', { class: ok === rows.length ? 'check is-ok' : 'check is-bad' }, h('strong', { text: V.summary(ok, rows.length) })),
      h(
        'details',
        { class: 'details' },
        h('summary', { text: V.details(rows.length) }),
        view.vectorGroups(rows).map((g) => [
          subtitle(V.groups[g.group]),
          table(
            'discussion vectors',
            [V.cols.check, V.cols.expected, V.cols.result],
            g.rows.map((r) => ({
              cells: [
                { head: true, text: V.label(r) },
                { node: h('code', { text: r.expected }) },
                { class: r.ok ? 'is-ok' : 'is-bad', node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }) },
              ],
            })),
          ),
        ]),
      ),
    );
  }
  fill(
    regions.wallets,
    subtitle(W.tableTitle),
    table(
      'discussion accounts',
      [W.cols.account, W.cols.path, W.cols.address, W.cols.check],
      hw.TEST_ACCOUNTS.map((a) => {
        const path = hw.pathFor('bip44', a.index);
        const row = rows.find((r) => r.check === 'address' && r.subject === path);
        let mark = '...';
        if (row) mark = row.ok ? '✓' : '✗';
        return {
          cells: [
            { head: true, text: W.accountName(a.index) },
            { node: h('code', { text: path }) },
            { node: h('code', { text: a.address }) },
            { class: row && !row.ok ? 'is-bad' : 'is-ok', text: mark },
          ],
        };
      }),
    ),
    h('p', { class: 'note', text: W.verified }),
  );
}

// ---------------------------------------------------------------------------
// 2. Le cinque categorie
// ---------------------------------------------------------------------------

function categoriesSection() {
  const C = text.categories;
  return h(
    'section',
    { class: 'section' },
    title('hw2-categories', 0, text.sections.categories),
    h('p', { text: C.intro }),
    table(
      'discussion categories',
      [C.cols.category, C.cols.what, C.cols.where, C.cols.properties],
      C.rows.map((row) => ({ cells: [{ head: true, text: row.name }, { text: row.what }, { text: row.where }, { text: row.properties }] })),
    ),
    paras(C.after),
  );
}

// ---------------------------------------------------------------------------
// 3. Le proprieta' statistiche
// ---------------------------------------------------------------------------

function statsSection() {
  regions.stats = h('div');
  return h('section', { class: 'section' }, title('hw2-stats', 0, text.sections.stats), paras(text.stats.intro), regions.stats);
}

function testRow(label, test) {
  const rejected = test.verdict === 'reject';
  const status = rejected ? 'is-invalid' : 'is-valid';
  return h(
    'div',
    { class: `test ${status}` },
    h('p', { class: 'test-head' }, h('strong', { text: label }), ' ', h('span', { class: `badge ${status}`, text: text.stats.verdict[rejected ? 'reject' : 'notReject'] })),
    h('p', { text: text.stats.testLine(test) }),
  );
}

const tests = (section, s) => h('div', { class: 'tests' }, view.statTests(s)[section].map(([key, test]) => testRow(text.stats.labels[section][key], test)));

function updateStats() {
  const result = computed.stats;
  const titles = view.STAT_SECTIONS.map(({ id, title: key }) => title(id, 1, text.sections[key]));
  const summaryTitle = title('hw2-stats-summary', 1, text.sections.statsSummary);
  if (!result || result.error) {
    // i titoli ci sono sempre, cosi' l'indice trova le sezioni anche durante il calcolo
    const status = () => (result ? failure(result.error) : pending());
    fill(regions.stats, titles.map((t) => [t, status()]), summaryTitle, status());
    updateConclusion();
    return;
  }
  const s = result.value;
  const T = text.stats;
  const F = text.fmt;
  const data = view.chartData(s, { decimal: F.decimal, axes: T.axes });
  const tips = view.chartTips(s, data, T.tips);
  const summary = view.testSummary(s);
  const smallest = summary.smallest;
  fill(
    regions.stats,
    titles[0],
    h('p', { text: T.bip39.intro }),
    figure(T.bip39.wordsChart(s.bip39.words.test.N, s.samples.mnemonics), hw.drawBarChart, data.words, true, tips.words),
    h('div', { class: 'charts' }, figure(T.bip39.nibbleChart(s.samples.mnemonics), hw.drawBarChart, data.nibble, false, tips.nibble)),
    tests('bip39', s),
    paras(T.bip39.explain(s)),

    titles[1],
    h('p', { text: T.seed.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(T.seed.bitsChart(s.seed.bits.N), hw.drawBarChart, data.seedBits, false, tips.seedBits),
      figure(T.seed.distanceChart(s.seed.avalanche, data.seedDistances), hw.drawBarChart, data.seedDistances, false, tips.seedDistances),
    ),
    tests('seed', s),
    paras(T.seed.explain(s)),

    titles[2],
    h('p', { text: T.bip32.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(T.bip32.bitsChart(s.bip32.bits.N), hw.drawBarChart, data.keyBits, false, tips.keyBits),
      figure(T.bip32.distanceChart(s.bip32.siblings, data.siblings), hw.drawBarChart, data.siblings, false, tips.siblings),
    ),
    figure(T.bip32.heatmap(s.bip32.correlation), hw.drawHeatmap, data.correlation, true, tips.correlation),
    tests('bip32', s),
    paras(T.bip32.explain(s)),

    titles[3],
    h('p', { text: T.secp.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(T.secp.xChart(s.secp256k1.bitsX.N), hw.drawBarChart, data.xBits, false, tips.xBits),
      figure(T.secp.yChart(s.secp256k1.bitsY.N), hw.drawBarChart, data.yBits, false, tips.yBits),
    ),
    figure(T.secp.distanceChart(s.secp256k1.avalanche, data.pointDistances), hw.drawBarChart, data.pointDistances, false, tips.pointDistances),
    tests('secp256k1', s),
    h('p', { class: 'structure', text: T.secp.homomorphism(s.secp256k1.homomorphism) }),
    paras(T.secp.explain(s)),

    titles[4],
    h('p', { text: T.keccak.intro }),
    h(
      'div',
      { class: 'charts' },
      figure(T.keccak.bitsChart(s.keccak.addressBits.N), hw.drawBarChart, data.addressBits, false, tips.addressBits),
      figure(T.keccak.hexChart(s.keccak.firstHex.test.N), hw.drawBarChart, data.firstHex, false, tips.firstHex),
    ),
    figure(T.keccak.distanceChart(s.keccak.avalanche, data.keccakDistances), hw.drawBarChart, data.keccakDistances, false, tips.keccakDistances),
    figure(T.keccak.heatmap, hw.drawHeatmap, data.sac, true, tips.sac),
    tests('keccak', s),
    paras(T.keccak.explain(s)),

    titles[5],
    h('p', { text: T.eip55.intro }),
    figure(T.eip55.lettersChart(s.eip55.letters.test.N), hw.drawBarChart, data.letters, false, tips.letters),
    tests('eip55', s),
    paras(T.eip55.explain(s)),

    summaryTitle,
    h('p', { text: T.summary.intro(summary, `${T.steps[smallest.section]}: ${T.labels[smallest.section][smallest.key]}`) }),
    table(
      'discussion summary-tests',
      [T.summary.cols.step, T.summary.cols.hypothesis, T.summary.cols.p, T.summary.cols.verdict],
      summary.all.map((t) => {
        const rejected = t.result.verdict === 'reject';
        return {
          class: rejected ? 'is-rejected' : null,
          cells: [
            { head: true, text: T.steps[t.section] },
            { text: T.labels[t.section][t.key] },
            { text: F.pval(t.result.pValue) },
            { text: T.verdict[rejected ? 'reject' : 'notReject'] },
          ],
        };
      }),
    ),
    h('p', { class: 'structure', text: T.secp.homomorphism(s.secp256k1.homomorphism) }),
    paras(T.summary.after),
  );
  updateConclusion();
}

// ---------------------------------------------------------------------------
// 4. Contesto storico e 5. Discussione
// ---------------------------------------------------------------------------

function historySection() {
  const H = text.history;
  const digests = view.emptyDigests();
  return h(
    'section',
    { class: 'section' },
    title('hw2-history', 0, text.sections.history),
    title('hw2-timeline', 1, text.sections.timeline),
    h('p', { text: H.intro }),
    h('p', { class: 'legend' }, h('span', { class: 'legend-task', text: H.legend.task }), h('span', { class: 'legend-context', text: H.legend.context })),
    h(
      'ol',
      { class: 'timeline' },
      H.events.map((e) => h('li', { class: e.task ? 'is-task' : 'is-context' }, h('span', { class: 'year', text: e.year }), h('div', null, h('strong', { text: e.title }), h('p', { text: e.text })))),
    ),
    h('p', { text: H.after }),
    title('hw2-sha', 1, text.sections.sha),
    h('p', { text: H.sha.intro }),
    h(
      'table',
      { class: 'table discussion sha' },
      h('thead', null, h('tr', null, H.sha.cols.map((c) => h('th', { text: c })))),
      h('tbody', null, H.sha.rows.map((row) => h('tr', null, h('th', { text: row[0] }), row.slice(1).map((cell, i) => h('td', { 'data-label': H.sha.cols[i + 1], text: cell }))))),
    ),
    subtitle(H.sha.digestsTitle),
    value(H.sha.digestLabel('Keccak-256'), digests.keccak),
    value(H.sha.digestLabel('SHA3-256'), digests.sha3),
    paras(H.sha.paras),
  );
}

function discussionSection() {
  const D = text.discussion;
  regions.conclusion = h('div');
  return h(
    'section',
    { class: 'section' },
    title('hw2-discussion', 0, text.sections.discussion),
    title('hw2-why', 1, text.sections.why),
    h('p', { text: D.why.intro }),
    table(
      'discussion why',
      [D.why.cols.parts, D.why.cols.purpose, D.why.cols.instead],
      D.why.rows.map((row) => ({ cells: [{ head: true, text: row.parts }, { text: row.purpose }, { text: row.instead }] })),
    ),
    paras(D.why.after),
    title('hw2-fit', 1, text.sections.fit),
    paras(D.fit),
    title('hw2-conclusion', 1, text.sections.conclusion),
    regions.conclusion,
  );
}

function updateConclusion() {
  const result = computed.stats;
  const summary = result && result.value ? view.testSummary(result.value) : null;
  fill(regions.conclusion, paras(text.discussion.conclusion(summary)));
}

// ---------------------------------------------------------------------------
// Calcoli lunghi: vettori di test ed esplorazione statistica
// ---------------------------------------------------------------------------

const message = (error) => (error instanceof Error ? error.message : String(error));

function startComputations() {
  // i vettori dopo il primo disegno della pagina: sette PBKDF2 da 2048 iterazioni
  setTimeout(() => {
    try {
      computed.vectors = { value: hw.verifyVectors() };
    } catch (error) {
      computed.vectors = { error: message(error) };
    }
    updateVectors();
  }, 50);
  // l'esplorazione a fette di pochi millisecondi, senza bloccare la pagina
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
  text = HW2_TEXTS[state.lang];
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), pipelineSection(), categoriesSection(), statsSection(), historySection(), discussionSection(), toTopButton());
  const read = view.readInputs(state.fields);
  regions.pipeline.classList.toggle('is-stale', !read.valid);
  updateInputs(read);
  updateBip39(read);
  updatePipeline();
  updateVectors();
  updateStats();
}

function boot() {
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.addEventListener('click', () => {
      if (button.dataset.lang === state.lang) return;
      state.lang = LANGUAGES.includes(button.dataset.lang) ? button.dataset.lang : 'it';
      try {
        window.localStorage.setItem('hw2-lang', state.lang);
      } catch {
        // la scelta vale solo per questa visita
      }
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
