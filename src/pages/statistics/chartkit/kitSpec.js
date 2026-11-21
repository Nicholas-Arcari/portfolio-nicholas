// src/pages/statistics/chartkit/kitSpec.js
// Il contratto di un grafico con i suoi comandi, scritto una volta in
// view.js e servito uguale alla pagina (React) e al programma scaricabile
// (DOM): gli adattatori lo mostrano, il kit non cambia.
//
//   spec = {
//     params: { ... },                     i parametri all'inizio
//     controls: [control, ...],            i comandi, nell'ordine in cui appaiono
//     model(params, t) -> data,            i dati del grafico (t: il passo dell'animazione)
//     tip(data, hidden) -> describe,       optional: l'etichetta sotto il puntatore
//     handles(params) -> [handle, ...],    optional: le linee da trascinare (kitPlugins.handles)
//     onHandle(params, id, value) -> params,   optional: dove va un trascinamento
//     animation: { frames(params), ms },   optional: quanti passi e quanto dura ognuno
//   }
//   control = { key, kind: 'slider', values: [...], label(value) }
//           | { key, kind: 'choice', options: [[value, name], ...], label }
//           | { key, kind: 'toggle', label }
//           | { kind: 'action', label, run(params) -> params }
// Le etichette sono gia' nella lingua della pagina: lo spec si costruisce con
// i testi (view.js riceve text).

/** The parameters a spec starts with (a copy: the spec stays as it is). */
export const initialParams = (spec) => ({ ...(spec.params || {}) });

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

/** How many steps the animation of a spec has with these parameters (1: no animation). */
export const framesOf = (spec, params) => (spec.animation ? Math.max(1, spec.animation.frames(params)) : 1);

/** The handles of a spec with these parameters (none without). */
export const handlesOf = (spec, params) => (spec.handles ? spec.handles(params) : []);
