// src/pages/statistics/chartkit/kitReveal.js
// L'animazione piu' comune dei grafici degli homework: una curva disegnata
// punto per punto, al crescere della sua x (n che cresce, i giorni, i
// tentativi). Vale per i dati dei grafici a linee di ogni libreria, { x,
// series: [{ values, band?, fixed? }] }: le serie `fixed` (riferimenti,
// bande, soglie) restano intere.

/** An animation that draws a line chart point by point, as its x grows: { frames, at(t), ms }. */
export function reveal(chart, ms = 110) {
  return {
    frames: chart.x.length,
    ms,
    at: (t) => ({
      ...chart,
      series: chart.series.map((s) => (s.fixed ? s : { ...s, values: s.values.map((v, i) => (i <= t ? v : null)), band: s.band ? s.band.map((b, i) => (i <= t ? b : null)) : s.band })),
    }),
  };
}
