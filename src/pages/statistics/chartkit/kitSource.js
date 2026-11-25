// src/pages/statistics/chartkit/kitSource.js
// Una tela che si disegna da sola (un'animazione, un editor da trascinare)
// come grafico del kit: lo stato e i suoi comandi restano suoi, il kit le
// da' la vista (zoom e spostamento), la tela trasparente, i gesti, i
// plugin e l'etichetta sotto il puntatore. Il controllore e' lo stesso
// degli altri grafici (kitChart.js): la tela gli passa solo le sue funzioni.

import { createChart } from './kitChart.js';

/**
 * Makes `canvas` a chart of the kit, drawn by `source`:
 *   draw(canvas, view, width, palette)   its state as it is now, in this view (null: the whole of it)
 *   frame(view, width)                   where the plot lies and what it shows, as chartFrame of the libraries
 *   height(width)                        the height of the canvas at this width
 *   locate(x, y, view, width)            optional: what is under the pointer, { rect, text } or null
 * `options`: palette, pointerLabel (the attachPointerLabel of the library),
 * plugins (zoomPan, ...), schedule. The source asks for a new drawing with
 * chart.redraw() when its state changes. Returns the chart (kitChart.js).
 */
export function createSourceChart(canvas, source, { palette, pointerLabel, plugins = [], schedule = null }) {
  const viewOf = (data) => data.view || null;
  return createChart(canvas, {
    draw: (target, data, pal) => source.draw(target, viewOf(data), data.width, pal),
    data: { view: null },
    palette,
    frame: (draw, data, width) => source.frame(viewOf(data), width),
    withView: (draw, data, view) => ({ ...data, view }),
    height: (draw, data, width) => source.height(width),
    hitTest: (draw, data, width, x, y) => (source.locate ? source.locate(x, y, viewOf(data), width) : null),
    hitAt: () => null,
    pointerLabel,
    describe: source.locate ? (hit) => hit.text : null,
    plugins,
    schedule,
  });
}
