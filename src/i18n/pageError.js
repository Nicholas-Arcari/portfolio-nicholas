// Traduzioni della sezione "pageError", in italiano e in inglese.
// Come funzionano le sezioni: registry.js.
import { register } from './registry.js';

register('pageError', {
  it: {
    title: 'La pagina non si è caricata',
    text: 'Controlla la connessione e riprova.',
    reload: 'Ricarica',
  },
  en: {
    title: 'This page did not load',
    text: 'Check your connection and try again.',
    reload: 'Reload',
  },
});
