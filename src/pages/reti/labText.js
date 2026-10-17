// src/pages/reti/labText.js
// Quello che le pagine di Reti di Calcolatori leggono dai file del
// laboratorio, senza mai cambiarne il testo: la descrizione di ogni
// esercitazione dalla tabella del README, e i titoli "+++ ... +++" di ogni
// file per l'indice. I file stanno in ./lab, copiati tali e quali dal
// repository del laboratorio.
import README from './lab/README.md?raw';
import { RETI_LAB } from '../../config/reti';

const TEXTS = import.meta.glob('./lab/*.txt', { query: '?raw', import: 'default' });

export { README };

// Una promessa per file, sempre la stessa: React.use() la aspetta una volta
const loaded = new Map();
export function loadLabText(file) {
  if (!loaded.has(file)) loaded.set(file, TEXTS[`./lab/${file}`]());
  return loaded.get(file);
}

/**
 * Le descrizioni in italiano, dalla tabella del README: per ogni file
 * "Argomento. Temi chiave." Le righe della tabella sono del tipo
 * | 01 | [01-docker.txt](01-docker.txt) | Docker: fondamenti | Daemon, ... |
 */
export const README_DESCRIPTIONS = (() => {
  const out = {};
  for (const line of README.split('\n')) {
    const m = line.match(/^\|[^|]*\|\s*\[([^\]]+)\]\([^)]*\)\s*\|([^|]*)\|([^|]*)\|\s*$/);
    if (m) out[m[1]] = `${m[2].trim()}. ${m[3].trim()}.`;
  }
  return out;
})();

/** La descrizione di un'esercitazione nella lingua scelta. */
export const labDescription = (ex, language) => (language === 'en' ? ex.en : README_DESCRIPTIONS[ex.file] || '');

/** L'esercitazione a cui punta un link del README (es. "01-docker.txt"), se c'e'. */
export const labByFile = (file) => RETI_LAB.find((ex) => ex.file === file) || null;

const HEADING = /^\s*\+{3,}\s*(.+?)\s*\+{3,}\s*$/;
const RULE = /^\s*-{10,}\s*$/;

/**
 * Il testo diviso in pezzi consecutivi che, rimessi insieme, danno il file
 * identico. Ogni titolo "+++ ... +++" (con le righe di trattini sopra e
 * sotto, se ci sono) diventa un pezzo con un id, a cui porta l'indice; la
 * riga con il nome e la matricola non e' un titolo.
 */
export function labSections(text) {
  const lines = text.split('\n');
  const heads = [];
  lines.forEach((line, i) => {
    const m = line.match(HEADING);
    if (!m || /matricola/i.test(m[1])) return;
    const start = i > 0 && RULE.test(lines[i - 1]) ? i - 1 : i;
    const end = i + 1 < lines.length && RULE.test(lines[i + 1]) ? i + 1 : i;
    heads.push({ start, end, title: m[1] });
  });
  const pieces = [];
  const piece = (from, to, extra = {}) => {
    if (to <= from) return;
    const last = to >= lines.length;
    pieces.push({ text: lines.slice(from, to).join('\n') + (last ? '' : '\n'), ...extra });
  };
  let at = 0;
  heads.forEach((h, n) => {
    piece(at, h.start);
    piece(h.start, h.end + 1, { id: `lab-section-${n + 1}`, title: h.title });
    at = h.end + 1;
  });
  piece(at, lines.length);
  return pieces;
}
