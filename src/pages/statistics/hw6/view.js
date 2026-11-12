// src/pages/statistics/hw6/view.js
// La logica di presentazione dell'Homework #6, comune alla pagina del sito e
// al programma scaricabile: le sezioni e il loro indice, i parametri dei
// calcoli e la loro chiave, e il disegno dei grafici a fette. Le legende a
// pulsanti (legends), le etichette sotto il puntatore (tips) e le tabelle
// legate ai grafici (links) arriveranno con i grafici del compito, nella
// stessa forma degli altri homework.
import * as hw from './homework6.js';

/** The sections of the page, in order, with the level of their title: the index of the page and of the program is built from here. */
export const SECTIONS = [
  { id: 'hw6-assignment', key: 'assignment', level: 0 },
  { id: 'hw6-task', key: 'task', level: 0 },
  { id: 'hw6-checks', key: 'checks', level: 1 },
  { id: 'hw6-tests', key: 'tests', level: 0 },
  { id: 'hw6-history', key: 'history', level: 0 },
  { id: 'hw6-conclusion', key: 'conclusion', level: 0 },
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
