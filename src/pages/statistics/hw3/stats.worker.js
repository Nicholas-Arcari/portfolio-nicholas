// src/pages/statistics/hw3/stats.worker.js
// La simulazione dell'Homework #3 fuori dal thread principale: gli m
// attaccanti dei due modelli sugli n sistemi, le leggi esatte, i gruppi di
// attaccanti, il cammino e i test (explore in homework3.js). La pagina resta
// reattiva, e l'animazione continua a girare, mentre i numeri arrivano.
import { explore } from './homework3.js';

self.onmessage = (event) => {
  const { id, params } = event.data;
  try {
    self.postMessage({ id, value: explore(params) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
