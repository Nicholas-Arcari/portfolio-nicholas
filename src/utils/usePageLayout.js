import { useEffect } from 'react';

// I layout del template dipendono da una classe sul <body>: `homepage` (la home
// e le pagine dei progetti), `right-sidebar` (contenuto e colonna a destra),
// `no-sidebar` (una colonna sola). Ogni pagina dichiara il suo; uscendo si torna
// a `homepage`, la classe con cui parte index.html.
//
// `scrollToTop`: la pagina si apre dall'inizio, anche se ci si arriva da
// un'altra scorsa a meta' (per esempio dal menu a scomparsa). Gli elenchi che
// ricordano il punto in cui si era (src/utils/listMemory.js) passano false.
const LAYOUTS = ['homepage', 'right-sidebar', 'no-sidebar'];

export function usePageLayout(layout, { scrollToTop = true } = {}) {
  useEffect(() => {
    const { classList } = document.body;
    LAYOUTS.forEach((name) => classList.toggle(name, name === layout));
    if (scrollToTop) window.scrollTo(0, 0);
    return () => {
      LAYOUTS.forEach((name) => classList.toggle(name, name === 'homepage'));
    };
  }, [layout, scrollToTop]);
}
