// src/pages/statistics/hw6/standalone/app.js
// L'interfaccia del programma scaricabile dell'Homework #6, in JavaScript
// puro: niente React, niente dipendenze. Disegna le stesse sezioni della
// pagina del sito con gli stessi testi (texts.js), la stessa logica di
// presentazione (view.js) e gli stessi calcoli (homework6.js). La build
// (build/homework-standalone.js) lo unisce a view.js e texts.js in un unico
// app.js, uno script classico che si apre anche da file:// con un doppio
// clic su index.html.
//
// E' lo scheletro pronto prima della consegna: le verifiche del generatore e
// i calcoli a fette (da file:// i worker non partono) funzionano gia'. I
// grafici con le legende a pulsanti, quando arriveranno, useranno gli stessi
// aiutanti degli altri programmi (figure, legend, hideParts, keep).
//
// Ogni testo entra nella pagina con textContent, mai come HTML.
import * as hw from '../homework6.js';
import * as view from '../view.js';
import { HW6_TEXTS, originalAssignment } from '../texts.js';

const HEADINGS = ['h2', 'h3', 'h4'];
const LANGUAGES = ['it', 'en'];

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

const state = { lang: initialLanguage() };
let text = HW6_TEXTS[state.lang];
const regions = {};
let checkRows = null;
const computation = { shown: null, error: null };

// ---------------------------------------------------------------------------
// DOM: un aiutante minimo
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
const message = (error) => (error instanceof Error ? error.message : String(error));
const pending = () => (computation.error ? h('p', { class: 'note', text: text.ui.error(computation.error) }) : h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad' }, h('strong', { text: label }));

/** Replaces the content of a region. */
function fill(region, ...nodes) {
  region.replaceChildren(...nodes.flat(Infinity).filter((n) => n !== null && n !== undefined && n !== false));
}

/** A table: column headers, then rows of cells, each { text | node, head? } (head: a row header, th). */
function table(className, headers, rows) {
  return h(
    'table',
    { class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x) => h('th', { text: x })))),
    h(
      'tbody',
      null,
      rows.map((row) => h('tr', { class: row.class || null }, row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { 'data-label': cell.head ? null : headers[i] }, cell.node || cell.text)))),
    ),
  );
}

// ---------------------------------------------------------------------------
// Le sezioni
// ---------------------------------------------------------------------------

function assignmentSection() {
  const blocks = originalAssignment();
  return h(
    'section',
    { class: 'section' },
    title('hw6-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      blocks.length === 0
        ? h('p', { class: 'note', text: text.assignment.missing })
        : [
          h('p', { class: 'note', text: text.assignment.originalNote }),
          h(
            'blockquote',
            { lang: 'en' },
            blocks.map((block) => {
              if (block.type === 'title') return h('p', null, h('strong', { text: block.text }));
              if (block.type === 'list') return h('ul', null, block.items.map((item) => h('li', { text: item })));
              if (block.type === 'link') return h('p', null, h('a', { href: block.href, target: '_blank', rel: 'noopener noreferrer', text: block.text }));
              return h('p', { text: block.text });
            }),
          ),
        ],
    ),
  );
}

function taskSection() {
  regions.checks = h('div');
  return h('section', { class: 'section' }, title('hw6-task', 0, text.sections.task), paras(text.task.intro), title('hw6-checks', 1, text.sections.checks), regions.checks);
}

function updateVerify() {
  const V = text.checks;
  const s = computation.shown;
  if (!checkRows) {
    fill(regions.checks, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const ok = checkRows.filter((r) => r.ok).length;
  fill(
    regions.checks,
    h('p', { text: V.intro }),
    check(ok === checkRows.length, V.summary(ok, checkRows.length)),
    h('div', { class: 'scroll' }, table('discussion checks', [V.cols.name, V.cols.expected, V.cols.actual, V.cols.ok], checkRows.map((r) => ({ cells: [{ text: r.name, head: true }, { node: h('code', { text: r.expected }) }, { node: h('code', { text: r.actual }) }, { text: r.ok ? V.ok : V.failed }] })))),
    s ? h('p', { text: V.generator(s.generator, s.params.seed) }) : pending(),
  );
}

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section' }, title('hw6-tests', 0, text.sections.tests), regions.tests);
}

function updateTests() {
  const T = text.tests;
  const s = computation.shown;
  if (!s) {
    fill(regions.tests, h('p', { text: T.intro }), pending());
    return;
  }
  const g = s.generator;
  fill(
    regions.tests,
    h('p', { text: T.intro }),
    table('discussion summary', [T.cols.subject, T.cols.hypothesis, T.cols.p, T.cols.verdict], [
      { class: g.verdict === 'reject' ? 'is-rejected' : null, cells: [{ text: T.rows.generator.subject, head: true }, { text: T.rows.generator.hypothesis }, { text: T.line(g) }, { text: T.verdicts[g.verdict] }] },
    ]),
  );
}

const historySection = () => h('section', { class: 'section' }, title('hw6-history', 0, text.sections.history), paras(text.history.intro));
const conclusionSection = () => h('section', { class: 'section' }, title('hw6-conclusion', 0, text.sections.conclusion), paras(text.conclusion.paras));

// ---------------------------------------------------------------------------
// I calcoli, a fette di pochi millisecondi
// ---------------------------------------------------------------------------

function startComputation() {
  hw.runStepsAsync(() => hw.exploreSteps(view.DEFAULT_PARAMS)).then(
    (value) => {
      computation.shown = value;
      computation.error = null;
      updateVerify();
      updateTests();
    },
    (error) => {
      computation.error = message(error);
      updateVerify();
      updateTests();
    },
  );
}

// ---------------------------------------------------------------------------
// Indice, lingua e avvio
// ---------------------------------------------------------------------------

const dialog = document.getElementById('index-dialog');

function closeIndex() {
  document.documentElement.classList.remove('index-open');
  if (dialog.open) dialog.close();
}

function goTo(id) {
  closeIndex();
  const target = document.getElementById(id);
  if (!target) return;
  target.focus({ preventScroll: true });
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  target.scrollIntoView({ behavior, block: 'start' });
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
  renderChrome();
  const app = document.getElementById('app');
  fill(app, assignmentSection(), taskSection(), testsSection(), historySection(), conclusionSection(), toTopButton());
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
  render();
  // le verifiche e i calcoli partono dopo il primo disegno della pagina
  setTimeout(() => {
    try {
      checkRows = hw.verifyAll();
    } catch (error) {
      checkRows = [{ group: 'generator', name: text.ui.error(message(error)), expected: '', actual: '', ok: false }];
    }
    updateVerify();
    startComputation();
  }, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
