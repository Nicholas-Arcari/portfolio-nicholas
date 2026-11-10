// src/pages/statistics/legendState.js
// Lo stato delle legende a pulsanti (ChartLegend.jsx): quali voci chi legge
// ha nascosto, e quali parti del disegno coprono. Sta in un modulo a parte
// perche' lo usano sia la legenda sia le pagine, per le tabelle annesse.
import { useCallback, useState } from 'react';

/** The items the reader has hidden, as a set of their indices, and the function that hides or shows one. */
export function useHidden() {
  const [hidden, setHidden] = useState(() => new Set());
  const toggle = useCallback((i) => {
    setHidden((old) => {
      const next = new Set(old);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);
  return [hidden, toggle];
}

/** The parts of the drawing that the hidden items cover, in a stable order. */
export const hiddenParts = (items, hidden) => (items || []).flatMap((item, i) => (hidden.has(i) ? item.parts || [] : []));

/** Whether a part is on screen: not covered by a hidden item. */
export const partShown = (items, hidden, part) => !hiddenParts(items, hidden).includes(part);
