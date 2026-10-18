// src/pages/reti/labText.js
// Quello che le pagine di Reti di Calcolatori leggono dai file del
// laboratorio: la descrizione di ogni esercitazione dalla tabella del README,
// il testo impaginato da mostrare e il file originale da scaricare. I file
// stanno in ./lab, copiati tali e quali dal repository del laboratorio; le
// loro versioni impaginate in ./doc, con le stesse parole nello stesso
// ordine (lo controlla la build, in build/reti-doc.js).
import README from './lab/README.md?raw';
import { RETI_LAB } from '../../config/reti';

const TEXTS = import.meta.glob('./lab/*.txt', { query: '?raw', import: 'default' });
const DOCS = import.meta.glob('./doc/*.lab', { query: '?raw', import: 'default' });

export { README };

// Una promessa per file, sempre la stessa: React.use() la aspetta una volta
const loaded = new Map();
const load = (path, files) => {
  if (!loaded.has(path)) loaded.set(path, files[path]());
  return loaded.get(path);
};

/** Il file originale, cosi' com'e' (per il pulsante che lo scarica). */
export const loadLabText = (file) => load(`./lab/${file}`, TEXTS);

/** La versione impaginata dello stesso file. */
export const loadLabDoc = (file) => load(`./doc/${file.replace(/\.txt$/, '.lab')}`, DOCS);

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
