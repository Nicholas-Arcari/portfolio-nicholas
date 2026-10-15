// src/pages/statistics/hw2/stats.worker.js
// I calcoli lunghi dell'Homework #1 - Exercise 2 fuori dal thread principale: i vettori di
// test ufficiali (sette PBKDF2 da 2048 iterazioni, piu' le derivazioni) e
// l'esplorazione statistica (un paio di secondi su un computer, molto di piu'
// su un telefono lento). In un worker la pagina resta reattiva mentre i
// numeri arrivano.
import { explore, verifyVectors } from './homework2.js';

const JOBS = { vectors: verifyVectors, explore };

self.onmessage = (event) => {
  const { id, job } = event.data;
  try {
    if (!Object.hasOwn(JOBS, job)) throw new Error(`unknown job ${job}`);
    self.postMessage({ id, value: JOBS[job]() });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
