// src/pages/statistics/followSidebar.js
// La colonna destra delle pagine con StatisticsLayout (Statistics e Reti di
// calcolatori) resta in vista mentre la pagina scorre: solo da computer,
// quando sta accanto al testo. Se e' piu' bassa della finestra resta ferma in
// alto. Se e' piu' alta segue lo scorrimento: scendendo scorre con la pagina
// finche' se ne vede il fondo e li' si ferma; risalendo torna giu' con la
// pagina finche' se ne vede la cima e li' si ferma.
//
// Il lavoro lo fa position: sticky (HackerTheme.css): qui si cambiano solo il
// suo top e un margin-top che sposta la posizione "naturale" della colonna
// dove si trova in quel momento. Cosi', mentre segue la pagina, la colonna
// scorre con lei come il resto del contenuto, senza scatti, e quando arriva
// al bordo si ferma da sola: lo scorrimento resta tutto del browser.
import { useEffect } from 'react';

// il template mette la colonna sotto il testo da 980 px di larghezza in giu'
const WIDE = '(min-width: 981px)';
// lo spazio fra la colonna e i bordi della finestra, in px
const GAP = 24;

/** The space the round buttons at the bottom right (.settings-bar) take from the column, when they cover it. */
function bottomGap(el) {
  const bar = document.querySelector('.settings-bar');
  if (!bar) return GAP;
  const b = bar.getBoundingClientRect();
  const s = el.getBoundingClientRect();
  return b.left < s.right && b.right > s.left ? window.innerHeight - b.top + GAP / 2 : GAP;
}

/** Keeps the column `ref` in view while the page scrolls (see above). */
export function useFollowingSidebar(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const row = el.parentElement;
    const wide = window.matchMedia(WIDE);
    // 'top': ferma in alto (o al suo posto in cima alla pagina);
    // 'down': scorre con la pagina e si ferma quando se ne vede il fondo;
    // 'up': scorre con la pagina finche' se ne vede la cima
    let mode = 'top';
    let lastY = window.scrollY;
    let frame = 0;

    const place = (marginTop, top) => {
      el.style.marginTop = `${marginTop}px`;
      el.style.top = `${top}px`;
    };

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      if (!wide.matches) {
        el.style.marginTop = '';
        el.style.top = '';
        mode = 'top';
        return;
      }
      const height = el.offsetHeight;
      // the column starts with the padding of the grid: its first box goes GAP below the top of the window
      const topStick = GAP - (parseFloat(getComputedStyle(el).paddingTop) || 0);
      const bottomStick = window.innerHeight - bottomGap(el) - height;
      if (bottomStick >= topStick) {
        // it fits in the window: simply stuck at the top
        place(0, topStick);
        mode = 'top';
        return;
      }
      // the margin-top that leaves the column where it is now, inside its row
      const here = () => Math.max(0, Math.min(el.getBoundingClientRect().top - row.getBoundingClientRect().top, row.clientHeight - height));
      if (delta > 0 && mode !== 'down') {
        place(here(), bottomStick);
        mode = 'down';
      } else if (delta < 0 && mode === 'down') {
        place(here(), bottomStick);
        mode = 'up';
      } else if (mode === 'down') {
        // the window or the column may have changed height
        el.style.top = `${bottomStick}px`;
      }
      if (mode === 'up' && el.getBoundingClientRect().top >= topStick) {
        place(0, topStick);
        mode = 'top';
      } else if (mode === 'top') {
        place(0, topStick);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    observer.observe(row);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    wide.addEventListener('change', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      wide.removeEventListener('change', schedule);
      el.style.marginTop = '';
      el.style.top = '';
    };
  }, [ref]);
}
