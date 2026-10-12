// src/pages/statistics/hw1/stats.worker.js
// Le statistiche calcolate fuori dal thread principale: sulla curva piu'
// grande explore() impiega circa un decimo di secondo su un computer, e su un
// telefono lento parecchio di piu'. In un worker la pagina resta reattiva
// mentre i numeri arrivano.
import { defaultBasePoint, explorationCurve, explore } from './homework1.js';

self.onmessage = (event) => {
  const { id, p, base } = event.data;
  try {
    const curve = explorationCurve(p);
    const G = base === 'default' ? defaultBasePoint(curve) : base;
    self.postMessage({ id, stats: explore(curve, G) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
