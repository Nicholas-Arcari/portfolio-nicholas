// src/pages/statistics/hw3/useJob.js
// La simulazione della pagina, eseguita in un worker e tenuta in memoria:
// tornando sulla pagina, o tornando a parametri gia' visti, non si ripete.
// Si chiede un insieme di parametri alla volta: quando cambiano, la
// simulazione ancora in corso per quelli vecchi non serve piu', e il worker
// viene fermato e sostituito. Se un worker non parte (browser vecchio,
// politica di sicurezza), il calcolo torna sul thread principale, a fette di
// pochi millisecondi.
import { startTransition, useEffect, useState } from 'react';
import { exploreSteps, runStepsAsync } from './homework3.js';
import { parseParamsKey } from './view.js';

// ogni risultato pesa circa un megabyte: se ne tengono gli ultimi
const KEPT = 6;

const results = new Map(); // key -> { value } | { error }
let inflight = null; // { key, promise, cancel }
let worker = undefined; // Worker | null (non disponibile)
let nextId = 0;

const failure = (error) => ({ error: error instanceof Error ? error.message : String(error) });

function remember(key, result) {
  results.delete(key);
  results.set(key, result);
  while (results.size > KEPT) results.delete(results.keys().next().value);
}

function createWorker() {
  try {
    return new Worker(new URL('./stats.worker.js', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }
}

/** One computation for one key, in the worker or, without it, here in slices. */
function start(key) {
  const params = parseParamsKey(key);
  let cancelled = false;
  let current = null;
  // here, in slices: between two slices the computation stops if nobody wants it any more
  function* guarded() {
    const steps = exploreSteps(params);
    let step = steps.next();
    while (!step.done) {
      if (cancelled) throw new Error('cancelled');
      yield;
      step = steps.next();
    }
    return step.value;
  }
  const here = () => runStepsAsync(guarded).then((value) => ({ value }), failure);
  const promise = new Promise((resolve) => {
    if (worker === undefined) worker = createWorker();
    if (!worker) {
      here().then(resolve);
      return;
    }
    const id = ++nextId;
    current = worker;
    current.onmessage = (event) => {
      if (event.data.id !== id) return;
      resolve(event.data.error ? { error: event.data.error } : { value: event.data.value });
    };
    current.onerror = (event) => {
      event.preventDefault();
      current.terminate();
      worker = null;
      here().then(resolve);
    };
    current.postMessage({ id, params });
  }).then((result) => {
    if (!cancelled) remember(key, result);
    return { ...result, cancelled };
  });
  return {
    key,
    promise,
    cancel() {
      cancelled = true;
      // the worker is busy with parameters nobody wants any more: a new one takes its place
      if (current && worker === current) {
        current.terminate();
        worker = undefined;
      }
    },
  };
}

function request(key) {
  if (inflight && inflight.key === key) return inflight.promise;
  if (inflight) inflight.cancel();
  const job = start(key);
  inflight = job;
  job.promise.then(() => {
    if (inflight === job) inflight = null;
  });
  return job.promise;
}

/**
 * The results for some parameters (paramsKey of view.js): { value } when
 * ready, { error } if it failed, { pending: true } meanwhile.
 */
export function useExplore(key) {
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (results.has(key)) return undefined;
    let alive = true;
    request(key).then((result) => {
      // a transition: React draws the new sections in slices, keeping the page responsive
      if (alive && !result.cancelled) startTransition(() => setVersion((v) => v + 1));
    });
    return () => {
      alive = false;
    };
  }, [key]);
  return results.get(key) || { pending: true };
}

/** A value that follows another after a pause: the simulation starts when the fields stop changing. */
export function useSettled(value, delay = 400) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (settled === value) return undefined;
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, settled, delay]);
  return settled;
}
