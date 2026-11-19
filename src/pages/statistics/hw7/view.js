// src/pages/statistics/hw7/view.js
// La logica di presentazione dell'Homework #7, comune alla pagina del sito e
// al programma scaricabile: le sezioni e il loro indice, i parametri dei
// calcoli e la loro chiave, le righe del riepilogo dei test, e il disegno
// dei grafici a fette. Le legende a pulsanti (legends), le etichette sotto
// il puntatore (tips) e le tabelle legate ai grafici (links) arriveranno con
// i grafici del compito, nella stessa forma degli altri homework.
import * as hw from './homework7.js';

/** The sections of the page, in order, with the level of their title: the index of the page and of the program is built from here. */
export const SECTIONS = [
  { id: 'hw7-assignment', key: 'assignment', level: 0 },
  { id: 'hw7-task', key: 'task', level: 0 },
  { id: 'hw7-checks', key: 'checks', level: 1 },
  { id: 'hw7-tests', key: 'tests', level: 0 },
  { id: 'hw7-history', key: 'history', level: 0 },
  { id: 'hw7-conclusion', key: 'conclusion', level: 0 },
];

/** The entries of the index: the sections with their titles in the current language. */
export const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

/** The parameters of the computations as the page opens, and the key that names a set of them. */
export const DEFAULT_PARAMS = Object.freeze({ seed: hw.DEFAULT_SEED, sample: hw.DEFAULT_SAMPLE });
export const paramsKey = (params) => `${params.seed}|${params.sample}`;
export function parseParamsKey(key) {
  const [seed, sample] = String(key).split('|').map(Number);
  return { seed, sample };
}

// ---------------------------------------------------------------------------
// Numeri
// ---------------------------------------------------------------------------

/** A p-value as mantissa and exponent, also below 10^-300, where p itself is 0: { m, e } with p = m x 10^e. */
export function pParts(p, log10p) {
  if (!Number.isFinite(log10p)) return { m: 0, e: 0 };
  const e = Math.floor(log10p);
  let m = 10 ** (log10p - e);
  if (m >= 9.995) return { m: 1, e: e + 1 };
  m = Math.round(m * 100) / 100;
  return { m, e };
}

// ---------------------------------------------------------------------------
// Il riepilogo dei test
// ---------------------------------------------------------------------------

/**
 * The rows of the summary of the tests, from the results of the
 * computations (null while they run): { key, stat: [name, value], p,
 * log10p, verdict, expected } or { key, pending, expected }. The tests of
 * the assignment join the one of the generator when it arrives.
 */
export function testRows(s) {
  if (!s) return [{ key: 'generator', pending: true, expected: 'accept' }];
  const g = s.generator;
  return [{ key: 'generator', stat: ['z', g.z], p: g.pValue, log10p: Math.log10(g.pValue), verdict: g.verdict, expected: 'accept' }];
}

/** The cells of a row of the summary, in the language of `text`. */
export function testCells(r, text) {
  const T = text.tests;
  const F = text.fmt;
  const d = T.rows[r.key];
  return {
    subject: d.subject,
    hypothesis: d.hypothesis,
    statistic: r.pending ? '-' : `${T.statNames[r.stat[0]]} = ${F.num(r.stat[1], 3)}`,
    p: r.pending ? '-' : F.p(r.p, r.log10p),
    verdict: r.pending ? T.pending : T.verdicts[r.verdict === 'reject' ? 'reject' : 'accept'],
    expected: T.expected[r.expected],
    rejected: r.verdict === 'reject',
  };
}

// ---------------------------------------------------------------------------
// Legende, etichette e tabelle legate ai grafici (vuote finche' non ci sono grafici)
// ---------------------------------------------------------------------------

/** The legends of the charts: { label, color | paletteKey, dashed?, box?, parts } for every item (ChartLegend.jsx). */
export const legends = {};

/** The labels under the pointer, one factory per chart: (hit, hidden) => text, leaving out the hidden parts. */
export const tips = {};

/** The id of every table tied to a chart, and the links of hw.attachChartTooltip. */
export const LINKED_TABLES = Object.freeze({});
export const links = {};

// ---------------------------------------------------------------------------
// Disegno a fette
// ---------------------------------------------------------------------------

// Quando arrivano i risultati molti grafici vanno disegnati insieme: si
// disegnano qualcuno per fotogramma, entro pochi millisecondi, cosi' la
// pagina continua a rispondere.
const frameJobs = [];
let frameRequested = false;

function runFrameJobs() {
  const start = Date.now();
  while (frameJobs.length && Date.now() - start < 8) frameJobs.shift()();
  frameRequested = frameJobs.length > 0;
  if (frameRequested) requestAnimationFrame(runFrameJobs);
}

/** Draws a chart at the next free moment: a few per frame, within 8 milliseconds. */
export function scheduleFrameJob(job) {
  frameJobs.push(job);
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(runFrameJobs);
  }
}
