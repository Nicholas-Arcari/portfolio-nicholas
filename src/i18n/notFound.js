// Traduzioni della sezione "notFound", in italiano e in inglese.
// Come funzionano le sezioni: registry.js.
import { register } from './registry.js';

register('notFound', {
  it: {
    title: 'Pagina Non Trovata',
    text: 'La pagina che stai cercando non esiste o \u00e8 stata spostata.',
    back: 'Torna alla Home',
  },
  en: {
    title: 'Page Not Found',
    text: 'The page you are looking for does not exist or has been moved.',
    back: 'Back to Home',
  },
});
