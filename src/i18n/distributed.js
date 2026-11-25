// Traduzioni della sezione "distributed", in italiano e in inglese:
// DISTRIBUTED SYSTEMS: gli appunti delle lezioni (laurea magistrale).
// Come funzionano le sezioni: registry.js.
import { register } from './registry.js';

register('distributed', {
  it: {
    terminal: [
      '> ./load_module.sh --distributed-systems',
      '> Caricamento appunti delle lezioni...',
      '> Lingue: EN, IT',
      '> Pronto.',
    ],
    lectureTerminal: ['> Formule: LaTeX', '> Pronto.'],
    title: 'Distributed Systems - Lezioni',
    subtitle: 'Gli appunti delle lezioni del corso di Distributed Systems, in inglese e in italiano. Seleziona una riga per aprire la lezione.',
    search: 'Cerca una lezione (es. Paxos, vector clock, broadcast)...',
    colName: 'Lezione',
    colDescription: 'Argomenti',
    noResults: 'Nessuna lezione trovata.',
    lecture: 'Lezione',
    of: 'di',
    navTitle: 'Le lezioni',
    index: 'Indice',
    indexTitle: 'Indice della lezione',
    close: 'Chiudi',
    backToList: 'Tutte le lezioni',
    backToTop: 'Torna su',
    loading: 'Caricamento...',
    loadError: 'Non riesco a caricare il testo della lezione. Ricarica la pagina.',
  },
  en: {
    terminal: [
      '> ./load_module.sh --distributed-systems',
      '> Loading lecture notes...',
      '> Languages: EN, IT',
      '> Ready.',
    ],
    lectureTerminal: ['> Formulas: LaTeX', '> Ready.'],
    title: 'Distributed Systems - Lectures',
    subtitle: 'The lecture notes of the Distributed Systems course, in English and in Italian. Select a row to open the lecture.',
    search: 'Search a lecture (e.g. Paxos, vector clock, broadcast)...',
    colName: 'Lecture',
    colDescription: 'Topics',
    noResults: 'No lecture found.',
    lecture: 'Lecture',
    of: 'of',
    navTitle: 'Lectures',
    index: 'Contents',
    indexTitle: 'Lecture contents',
    close: 'Close',
    backToList: 'All lectures',
    backToTop: 'Back to top',
    loading: 'Loading...',
    loadError: 'The text of this lecture could not be loaded. Reload the page.',
  },
});
