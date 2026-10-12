// src/pages/statistics/hw2/useComputed.js
// I due calcoli lunghi della pagina, i vettori di test (sezione 1.8) e
// l'esplorazione statistica (sezione 3), eseguiti nel worker e tenuti in
// memoria: tornando sulla pagina non si ripetono. Se il worker non parte
// (browser vecchio, politica di sicurezza), il calcolo torna sul thread
// principale: l'esplorazione a fette di pochi millisecondi (exploreAsync), i
// vettori in un solo passo, dopo che la pagina e' stata disegnata.
import { startTransition, useEffect, useState } from 'react';
import { exploreAsync, verifyVectors } from './homework2.js';

const results = new Map(); // job -> { value } | { error }
const inflight = new Map(); // job -> Promise
const jobs = new Map(); // id -> { job, resolve }
let worker; // undefined: not created yet; null: not available
let nextId = 0;

const failure = (error) => ({ error: error instanceof Error ? error.message : String(error) });

function computeHere(job) {
  if (job === 'explore') return exploreAsync().then((value) => ({ value }), failure);
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        resolve({ value: verifyVectors() });
      } catch (error) {
        resolve(failure(error));
      }
    }, 0);
  });
}

function fallBack() {
  worker = null;
  for (const [id, entry] of jobs) {
    jobs.delete(id);
    computeHere(entry.job).then(entry.resolve);
  }
}

function getWorker() {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./stats.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      const { id, value, error } = event.data;
      const entry = jobs.get(id);
      if (!entry) return;
      jobs.delete(id);
      entry.resolve(error ? { error } : { value });
    };
    worker.onerror = (event) => {
      event.preventDefault();
      worker.terminate();
      fallBack();
    };
  } catch {
    worker = null;
  }
  return worker;
}

function request(job) {
  if (inflight.has(job)) return inflight.get(job);
  const promise = new Promise((resolve) => {
    const w = getWorker();
    if (!w) {
      computeHere(job).then(resolve);
      return;
    }
    const id = ++nextId;
    jobs.set(id, { job, resolve });
    w.postMessage({ id, job });
  }).then((result) => {
    results.set(job, result);
    inflight.delete(job);
    return result;
  });
  inflight.set(job, promise);
  return promise;
}

/** 'vectors' or 'explore': { value } when ready, { error } if the computation failed, { pending: true } meanwhile. */
export function useComputed(job) {
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (results.has(job)) return undefined;
    let alive = true;
    request(job).then(() => {
      // a transition: React draws the new sections in slices, keeping the page responsive
      if (alive) startTransition(() => setVersion((v) => v + 1));
    });
    return () => {
      alive = false;
    };
  }, [job]);
  return results.get(job) || { pending: true };
}
