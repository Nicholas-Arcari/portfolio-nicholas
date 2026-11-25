import { useEffect } from 'react';

// Il titolo della scheda di ogni pagina ("Ricette di Mamma Niky - Nicholas
// Arcari"), per schede, cronologia e segnalibri; senza titolo resta quello del
// sito, come nella Home. Ogni pagina lo dichiara, anche quelle dei corsi
// (tramite StatisticsLayout): un titolo che non cambia lascerebbe nella scheda
// quello della pagina di prima.
//
// Cambiando pagina il titolo nuovo si annuncia anche ai lettori di schermo,
// che in un sito a pagina singola non si accorgono da soli della navigazione:
// lo legge la regione aria-live #route-announcer di App.jsx. Non alla prima
// pagina, che il lettore legge comunque per intero.
export const SITE_TITLE = 'Nicholas Arcari - Portfolio';

let firstPage = true;

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - Nicholas Arcari` : SITE_TITLE;
    if (firstPage) {
      firstPage = false;
      return;
    }
    const region = document.getElementById('route-announcer');
    if (region) region.textContent = document.title;
  }, [title]);
}
