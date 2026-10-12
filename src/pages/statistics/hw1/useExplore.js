// src/pages/statistics/hw1/useExplore.js
// Le statistiche di una curva e di un punto base, calcolate nel worker e
// tenute in memoria: la stessa richiesta (la curva della consegna serve sia
// alla sezione 3.1 sia alla discussione) si calcola una volta sola. Se il
// worker non parte (browser vecchio, politica di sicurezza), il calcolo torna
// sul thread principale, a fette di pochi millisecondi (exploreAsync), cosi'
// la pagina non si blocca comunque.
import { startTransition, useEffect, useState } from 'react';
import { defaultBasePoint, explorationCurve, exploreAsync } from './homework1.js';

const results = new Map(); // key -> { stats } | { error }
const inflight = new Map(); // key -> Promise
const jobs = new Map(); // id -> { key, resolve }
let worker; // undefined: not created yet; null: not available
let nextId = 0;

/** Key of a request: the prime and the base point ("x,y"), "pooled" or "default". */
export const exploreKey = (p, base) => `${p}|${typeof base === 'string' ? base : `${base.x},${base.y}`}`;

function parseKey(key) {
  const [p, base] = key.split('|');
  if (base === 'pooled' || base === 'default') return { p: Number(p), base };
  const [x, y] = base.split(',').map(Number);
  return { p: Number(p), base: { x, y } };
}

function computeHere(key) {
  const { p, base } = parseKey(key);
  const message = (error) => ({ error: error instanceof Error ? error.message : String(error) });
  try {
    const curve = explorationCurve(p);
    return exploreAsync(curve, base === 'default' ? defaultBasePoint(curve) : base).then((stats) => ({ stats }), message);
  } catch (error) {
    return Promise.resolve(message(error));
  }
}

function fallBack() {
  worker = null;
  for (const [id, job] of jobs) {
    jobs.delete(id);
    computeHere(job.key).then(job.resolve);
  }
}

function getWorker() {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./stats.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      const { id, stats, error } = event.data;
      const job = jobs.get(id);
      if (!job) return;
      jobs.delete(id);
      job.resolve(error ? { error } : { stats });
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

function request(key) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = new Promise((resolve) => {
    const w = getWorker();
    if (!w) {
      computeHere(key).then(resolve);
      return;
    }
    const id = ++nextId;
    jobs.set(id, { key, resolve });
    const { p, base } = parseKey(key);
    w.postMessage({ id, p, base });
  }).then((result) => {
    results.set(key, result);
    inflight.delete(key);
    return result;
  });
  inflight.set(key, promise);
  return promise;
}

/** { stats } when ready, { error } if the computation failed, { pending: true } meanwhile. */
export function useExplore(key) {
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (results.has(key)) return undefined;
    let alive = true;
    request(key).then(() => {
      // a transition: React draws the new sections in slices, keeping the page responsive
      if (alive) startTransition(() => setVersion((v) => v + 1));
    });
    return () => {
      alive = false;
    };
  }, [key]);
  return results.get(key) || { pending: true };
}
