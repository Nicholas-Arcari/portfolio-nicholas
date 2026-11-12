// src/pages/statistics/hw6/stats.worker.js
// I calcoli dell'Homework #6 fuori dal thread principale (explore in
// homework6.js): la pagina resta reattiva mentre i numeri arrivano. Finche'
// la consegna non arriva, e' la prova del generatore della pagina.
import { explore } from './homework6.js';

self.onmessage = (event) => {
  const { id, params } = event.data;
  try {
    self.postMessage({ id, value: explore(params) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
