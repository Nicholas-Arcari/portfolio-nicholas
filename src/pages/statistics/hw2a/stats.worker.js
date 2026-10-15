// src/pages/statistics/hw2a/stats.worker.js
// I calcoli lunghi dell'Homework #2 fuori dal thread principale: le
// verifiche, l'esplorazione statistica (corpus, modelli, l'esperimento sulle
// lunghezze, i due cifrati, le chiavi pubbliche), il costo degli attacchi al
// crescere della chiave e i tre attacchi sulla chiave della sezione 1. Ogni
// gruppo di lavori ha un worker suo (useJob.js), cosi' girano in parallelo
// e la pagina resta reattiva mentre i numeri arrivano.
import { attackSteps, explore, runSteps, scaling, verifyAll } from './homework2a.js';

const JOBS = {
  verify: () => verifyAll(),
  explore: () => explore(),
  scaling: () => scaling(),
  exhaustive: (publicKey) => runSteps(attackSteps('exhaustive', publicKey)),
  bsgs: (publicKey) => runSteps(attackSteps('bsgs', publicKey)),
  kangaroo: (publicKey) => runSteps(attackSteps('kangaroo', publicKey)),
};

self.onmessage = (event) => {
  const { id, job, param } = event.data;
  try {
    if (!Object.hasOwn(JOBS, job)) throw new Error(`unknown job ${job}`);
    self.postMessage({ id, value: JOBS[job](param) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
