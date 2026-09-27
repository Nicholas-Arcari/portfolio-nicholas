// src/utils/jumpToItem.js
// Porta la pagina alla voce suggerita dalla Ruota della Fortuna.
//
// La ruota estrae dall'elenco completo, ma la lista a video puo' essere
// filtrata dalla ricerca e non contenere la voce estratta. Per questo prima si
// azzera il filtro, e flushSync ridisegna subito la lista: senza, la voce
// comparirebbe solo al render successivo e getElementById non la troverebbe.
import { flushSync } from 'react-dom';

export const jumpToItem = (id, clearFilter) => {
  flushSync(clearFilter);

  const el = document.getElementById(id);
  if (!el) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  // Evidenziazione breve, per ritrovare la riga a colpo d'occhio. Togliere e
  // rimettere la classe (con un reflow in mezzo) fa ripartire l'animazione
  // anche quando la ruota suggerisce due volte di fila la stessa voce.
  el.classList.remove('wheel-target');
  void el.offsetWidth;
  el.classList.add('wheel-target');
  el.addEventListener('animationend', () => el.classList.remove('wheel-target'), { once: true });
};
