// src/pages/statistics/chartkit/useModel.js
// Il modello di una sezione con i suoi comandi (kitSpec.createModel) in una
// pagina React: i parametri, la simulazione che dipende da loro e se e'
// ancora in corso. Il modello si crea una volta; `sim`, quando arriva (il
// worker della pagina), e' il risultato gia' calcolato per i parametri
// iniziali.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createModel } from './kitSpec';

/** [state, model]: state is { params, sim, pending, error }; model.setParams(next) changes the parameters. */
export function useModel(options, sim = null) {
  const [model] = useState(() => createModel(options));
  const state = useSyncExternalStore(model.subscribe, model.get);
  useEffect(() => () => model.destroy(), [model]);
  useEffect(() => {
    if (sim) model.provide(sim, options.params);
    // the starting parameters do not change: only a new result matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, sim]);
  return [state, model];
}
