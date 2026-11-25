// src/pages/ssa/notesText.js
// Il testo delle lezioni di Security in Software Applications: un file per
// lezione e per lingua in ./notes, scaricato solo quando si apre quella
// lezione in quella lingua e letto una volta sola (parseNotes.js).
import { parseNotes } from './parseNotes';

const FILES = import.meta.glob('./notes/*.md', { query: '?raw', import: 'default' });

const loaded = new Map();

/** La lezione `file` (es. "lecture-05") nella lingua scelta, gia' in blocchi. */
export function loadNotes(file, language) {
  const path = `./notes/${file}.${language}.md`;
  if (!loaded.has(path)) {
    const load = FILES[path];
    const promise = load ? load().then(parseNotes) : Promise.reject(new Error(`appunti non trovati: ${path}`));
    // un download fallito non resta in memoria: alla prossima visita si riprova
    promise.catch(() => loaded.delete(path));
    loaded.set(path, promise);
  }
  return loaded.get(path);
}
