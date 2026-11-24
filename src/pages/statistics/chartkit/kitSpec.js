// src/pages/statistics/chartkit/kitSpec.js
// I comandi di una sezione e il suo modello: i parametri che i comandi
// cambiano e, quando una simulazione dipende da loro, il suo risultato. Il
// modello e' della sezione, non del grafico: grafici e tabelle della stessa
// sezione leggono gli stessi parametri e la stessa simulazione, e non
// possono raccontare cose diverse. Non sa niente di React ne' del DOM: la
// pagina lo usa con useModel.js, il programma scaricabile direttamente.
//
//   control = { key, kind: 'slider', values: [...], label(value) }
//           | { key, kind: 'choice', options: [[value, name], ...], label }
//           | { key, kind: 'toggle', label }
//           | { kind: 'action', label, run(params) -> params }
// Le etichette sono gia' nella lingua della pagina; il modello tiene solo i
// parametri, che non dipendono dalla lingua.

/** The position of a slider: the index of the value closest to the parameter. */
export function sliderIndex(control, params) {
  const v = params[control.key];
  let best = 0;
  control.values.forEach((x, i) => {
    if (Math.abs(x - v) < Math.abs(control.values[best] - v)) best = i;
  });
  return best;
}

/** The parameters after a control is used: a slider gives the index of its value, a choice its value, a toggle true or false, an action nothing. */
export function applyControl(control, params, input) {
  if (control.kind === 'slider') return { ...params, [control.key]: control.values[input] };
  if (control.kind === 'choice') return { ...params, [control.key]: input };
  if (control.kind === 'toggle') return { ...params, [control.key]: !!input };
  if (control.kind === 'action') return control.run(params);
  return params;
}

const keyOf = (params) => JSON.stringify(params);
const KEPT = 6;

/**
 * The state of a section with controls: { params, sim, pending, error }.
 *   params            the parameters at the start
 *   simulate(params)  optional: the steps (a generator) of a simulation, whose return value is its result
 *   simKey(params)    which parameters the simulation depends on (default: all of them)
 *   runner            the library's runStepsAsync: the simulation runs in slices of a few milliseconds
 * While a simulation runs, `sim` stays the last result (so nothing goes
 * blank) and `pending` is true; the results of the last parameters seen
 * are kept, and a simulation nobody wants any more stops between two slices.
 * Returns { get, setParams, provide, subscribe, destroy }.
 */
export function createModel({ params, simulate = null, simKey = keyOf, runner = null }) {
  let state = { params: { ...params }, sim: null, pending: false, error: null };
  const cache = new Map();
  const listeners = new Set();
  let job = null;
  const set = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };
  const remember = (key, value) => {
    cache.delete(key);
    cache.set(key, value);
    while (cache.size > KEPT) cache.delete(cache.keys().next().value);
  };
  const run = (p) => {
    if (!simulate) return;
    const key = simKey(p);
    if (cache.has(key)) {
      if (job) job.cancel();
      job = null;
      set({ sim: cache.get(key), pending: false, error: null });
      return;
    }
    if (job && job.key === key) return;
    if (job) job.cancel();
    if (!runner) return;
    let cancelled = false;
    function* guarded() {
      const steps = simulate(p);
      let step = steps.next();
      while (!step.done) {
        if (cancelled) throw new Error('cancelled');
        yield;
        step = steps.next();
      }
      return step.value;
    }
    job = {
      key,
      cancel: () => {
        cancelled = true;
      },
    };
    set({ pending: true });
    runner(guarded).then(
      (value) => {
        if (cancelled) return;
        remember(key, value);
        job = null;
        set({ sim: value, pending: false, error: null });
      },
      (error) => {
        if (cancelled) return;
        job = null;
        set({ pending: false, error: error instanceof Error ? error.message : String(error) });
      },
    );
  };
  return {
    get: () => state,
    setParams(next) {
      set({ params: next });
      run(next);
    },
    /** A result computed elsewhere (the worker of the page) for the parameters `forParams`: used now if they are the current ones. */
    provide(value, forParams = params) {
      if (!simulate || !value) return;
      const key = simKey(forParams);
      if (!cache.has(key)) remember(key, value);
      if (simKey(state.params) === key && state.sim !== value) {
        if (job && job.key === key) {
          job.cancel();
          job = null;
        }
        set({ sim: value, pending: false, error: null });
      }
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    destroy() {
      if (job) job.cancel();
      job = null;
      listeners.clear();
    },
  };
}
