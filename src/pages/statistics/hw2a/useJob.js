// src/pages/statistics/hw2a/useJob.js
// I calcoli lunghi della pagina, eseguiti nei worker e tenuti in memoria:
// tornando sulla pagina, o tornando a una chiave gia' attaccata, non si
// ripetono. Tre gruppi, ognuno con il suo worker, cosi' lavorano in
// parallelo: le verifiche e l'esplorazione statistica, il costo degli
// attacchi, gli attacchi sulla chiave della sezione 1. Quando la chiave
// cambia, gli attacchi ancora in corso sulla chiave vecchia non servono
// piu': il loro worker viene fermato e sostituito, e i lavori ancora utili
// ripartono sul nuovo. Se un worker non parte (browser vecchio, politica di
// sicurezza), il calcolo torna sul thread principale, a fette di pochi
// millisecondi.
import { startTransition, useEffect, useState } from 'react';
import { attackSteps, exploreSteps, runStepsAsync, scalingSteps, verifyAll } from './homework2a.js';

const GROUPS = { verify: 'stats', explore: 'stats', scaling: 'scaling', exhaustive: 'attack', bsgs: 'attack', kangaroo: 'attack' };

// the same jobs, as generators, for the main thread
const STEPS = {
  // eslint-disable-next-line require-yield
  verify: function* verify() {
    return verifyAll();
  },
  explore: () => exploreSteps(),
  scaling: () => scalingSteps(),
  exhaustive: (param) => attackSteps('exhaustive', param),
  bsgs: (param) => attackSteps('bsgs', param),
  kangaroo: (param) => attackSteps('kangaroo', param),
};

const results = new Map(); // key -> { value } | { error }
const inflight = new Map(); // key -> Promise
const workers = new Map(); // group -> { worker, pending: Map(id -> entry) } | null
let nextId = 0;

const keyOf = (job, param) => (param === null || param === undefined ? job : `${job}|${param}`);
const failure = (error) => ({ error: error instanceof Error ? error.message : String(error) });

function computeHere(entry) {
  return runStepsAsync(() => STEPS[entry.job](entry.param)).then((value) => ({ value }), failure);
}

function createWorker(group) {
  let state = null;
  try {
    const worker = new Worker(new URL('./stats.worker.js', import.meta.url), { type: 'module' });
    state = { worker, pending: new Map() };
    worker.onmessage = (event) => {
      const { id, value, error } = event.data;
      const entry = state.pending.get(id);
      if (!entry) return;
      state.pending.delete(id);
      entry.resolve(error ? { error } : { value });
    };
    worker.onerror = (event) => {
      event.preventDefault();
      worker.terminate();
      workers.set(group, null);
      for (const entry of state.pending.values()) computeHere(entry).then(entry.resolve);
      state.pending.clear();
    };
  } catch {
    state = null;
  }
  workers.set(group, state);
  return state;
}

function post(group, entry) {
  const state = workers.has(group) ? workers.get(group) : createWorker(group);
  if (!state) {
    computeHere(entry).then(entry.resolve);
    return;
  }
  const id = ++nextId;
  state.pending.set(id, entry);
  state.worker.postMessage({ id, job: entry.job, param: entry.param });
}

/** Stops the attacks on other keys: the worker is replaced, and the jobs still wanted start again on the new one. */
function dropOtherKeys(group, param) {
  const state = workers.get(group);
  if (!state) return;
  const pending = [...state.pending.values()];
  if (!pending.some((entry) => entry.param !== param)) return;
  state.worker.terminate();
  workers.delete(group);
  for (const entry of pending) {
    if (entry.param === param) post(group, entry);
    else {
      inflight.delete(entry.key);
      entry.resolve({ cancelled: true });
    }
  }
}

function request(job, param) {
  const key = keyOf(job, param);
  if (inflight.has(key)) return inflight.get(key);
  const group = GROUPS[job];
  if (group === 'attack') dropOtherKeys(group, param);
  const promise = new Promise((resolve) => post(group, { job, param, key, resolve })).then((result) => {
    if (!result.cancelled) {
      results.set(key, result);
      inflight.delete(key);
    }
    return result;
  });
  inflight.set(key, promise);
  return promise;
}

/**
 * A long computation by name, with an optional parameter (the public key,
 * for the attacks): { value } when ready, { error } if it failed,
 * { pending: true } meanwhile. With param undefined it waits.
 */
export function useJob(job, param = null) {
  const [, setVersion] = useState(0);
  const key = keyOf(job, param);
  const waiting = param === undefined;
  useEffect(() => {
    if (waiting || results.has(key)) return undefined;
    let alive = true;
    request(job, param).then((result) => {
      // a transition: React draws the new sections in slices, keeping the page responsive
      if (alive && !result.cancelled) startTransition(() => setVersion((v) => v + 1));
    });
    return () => {
      alive = false;
    };
  }, [job, param, key, waiting]);
  return (!waiting && results.get(key)) || { pending: true };
}

/** A value that follows another after a pause: the attacks start when the key stops changing. */
export function useSettled(value, delay = 400) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (settled === value) return undefined;
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, settled, delay]);
  return settled;
}
