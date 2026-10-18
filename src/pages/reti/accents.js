// src/pages/reti/accents.js
// I file del laboratorio scrivono gli accenti con l'apostrofo (e', perche',
// piu'): nel testo impaginato tornano lettere accentate. Solo le parole di
// questo elenco, cosi' un apice di chiusura ('ubuntu') o il K' di una
// formula restano come sono; comandi, codice e output non passano di qui.

const GRAVE = ['e', 'cosi', 'bensi', 'cio', 'cioe', 'gia', 'piu', 'puo', 'pero',
  'dara', 'esporra', 'fallira', 'potra', 'produrra', 'sara', 'verra',
  'attivita', 'autenticita', 'confidenzialita', 'connettivita', 'difficolta', 'entita',
  'estremita', 'funzionalita', 'identita', 'integrita', 'leggibilita', 'modalita', 'necessita',
  'primalita', 'priorita', 'proprieta', 'quantita', 'raggiungibilita', 'realta',
  'retrocompatibilita', 'univocita', 'universita', 'validita', 'velocita', 'visibilita',
  'vulnerabilita'];
const ACUTE = ['perche', 'poiche', 'affinche', 'anziche', 'ne', 'se'];

const GRAVE_OF = { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' };
const ACCENTED = new Map([
  ...GRAVE.map((w) => [w, w.slice(0, -1) + GRAVE_OF[w.slice(-1)]]),
  ...ACUTE.map((w) => [w, `${w.slice(0, -1)}é`]),
]);

// una parola attaccata a un apostrofo che non e' seguito da un'altra lettera;
// prima puo' esserci anche un'elisione ("l'estremita'")
const WORD = /(^|[^A-Za-zÀ-ÿ])([A-Za-z]+)'(?![A-Za-zÀ-ÿ])/g;

export function accents(text) {
  return text.replace(WORD, (all, before, word) => {
    const accented = ACCENTED.get(word.toLowerCase());
    if (!accented) return all;
    const first = word[0] === word[0].toUpperCase() ? accented[0].toUpperCase() : accented[0];
    return before + first + accented.slice(1);
  });
}
