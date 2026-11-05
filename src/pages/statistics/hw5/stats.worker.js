// src/pages/statistics/hw5/stats.worker.js
// I calcoli casuali dell'Homework #5 fuori dal thread principale: i dati
// simulati contro la Φ numerica, le stime di Monte Carlo di ogni funzione e
// il confronto fra Riemann e Lebesgue (explore in homework5.js). La pagina
// resta reattiva, e gli esempi interattivi continuano a rispondere, mentre i
// numeri arrivano.
import { explore } from './homework5.js';

self.onmessage = (event) => {
  const { id, params } = event.data;
  try {
    self.postMessage({ id, value: explore(params) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
