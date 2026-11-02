// src/pages/statistics/hw4/stats.worker.js
// La simulazione dell'Homework #4 fuori dal thread principale: gli m
// hacker sugli n sistemi, con le formule di Welford, le statistiche a ogni
// n e i test (explore in homework4.js). La pagina resta
// reattiva, e l'animazione continua a girare, mentre i numeri arrivano.
import { explore } from './homework4.js';

self.onmessage = (event) => {
  const { id, params } = event.data;
  try {
    self.postMessage({ id, value: explore(params) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
