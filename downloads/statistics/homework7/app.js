/*
 * Homework #7 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * Interface and texts (Italian and English). Needs homework7.js, loaded first.
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-7
 */

(function () {
'use strict';

var kitView$ = (function () {
'use strict';

// src/pages/statistics/chartkit/kitView.js
// La matematica delle viste di un grafico interattivo: quale parte degli
// assi si vede, come cambia con lo zoom e con lo spostamento, e la
// conversione fra i pixel del riquadro e i valori. Niente DOM: sono funzioni
// pure, che servono identiche alla pagina e al programma scaricabile.
//
// Una vista e' { x: [lo, hi] o null, y: [lo, hi] o null } nelle unita' degli
// assi; null su un asse vuol dire "tutto". Il riquadro (frame) e' quello che
// la libreria di ogni homework descrive con chartFrame(): { plot: { x, y, w,
// h }, x: { min, max, log } o null, y: { min, max, log }, zoom: 'xy' o 'y' }.
// Sugli assi logaritmici i conti si fanno sui logaritmi, cosi' lo zoom e lo
// spostamento hanno lo stesso effetto in ogni punto dell'asse.

/** How far the view can be enlarged: a thousandth of the whole axis. */
const MIN_SPAN = 1e-3;

const fwd = (axis, v) => (axis.log ? Math.log10(v) : v);
const back = (axis, t) => (axis.log ? 10 ** t : t);

/** The pixel of the value v on an axis drawn from p0 (its min) to p1 (its max). */
function toPixel(axis, v, p0, p1) {
  const lo = fwd(axis, axis.min);
  const hi = fwd(axis, axis.max);
  return p0 + ((fwd(axis, v) - lo) / (hi - lo)) * (p1 - p0);
}

/** The value of the pixel p on an axis drawn from p0 (its min) to p1 (its max). */
function toValue(axis, p, p0, p1) {
  const lo = fwd(axis, axis.min);
  const hi = fwd(axis, axis.max);
  return back(axis, lo + ((p - p0) / (p1 - p0)) * (hi - lo));
}

/** Whether the point (x, y), in CSS pixels of the canvas, lies in the plot. */
const inPlot = (frame, x, y, slack = 0) => !!frame && x >= frame.plot.x - slack && x <= frame.plot.x + frame.plot.w + slack && y >= frame.plot.y - slack && y <= frame.plot.y + frame.plot.h + slack;

/** The values under the point (x, y): { x, y }, with null on an axis without values (categories). */
function valueAt(frame, x, y) {
  const { plot } = frame;
  return {
    x: frame.x ? toValue(frame.x, x, plot.x, plot.x + plot.w) : null,
    y: toValue(frame.y, y, plot.y + plot.h, plot.y),
  };
}

/** The pixels of the values { x, y } (either may be null). */
function pixelAt(frame, x, y) {
  const { plot } = frame;
  return {
    x: x === null || !frame.x ? null : toPixel(frame.x, x, plot.x, plot.x + plot.w),
    y: y === null ? null : toPixel(frame.y, y, plot.y + plot.h, plot.y),
  };
}

/** The whole extent of the data of a frame drawn without a view: the limits zoom and panning stay within. */
const fullView = (frame) => ({ x: frame.x ? [frame.x.min, frame.x.max] : null, y: [frame.y.min, frame.y.max] });

const axesOf = (zoom) => ({ x: zoom === 'xy' || zoom === 'x', y: zoom === 'xy' || zoom === 'y' });

/** One axis of a view, kept inside the whole axis and no narrower than MIN_SPAN of it; the full axis becomes null. */
function clampAxis(range, full, axis) {
  if (!range || !full) return null;
  const f0 = fwd(axis, full[0]);
  const f1 = fwd(axis, full[1]);
  const whole = f1 - f0;
  let a = fwd(axis, range[0]);
  let b = fwd(axis, range[1]);
  if (b - a >= whole * (1 - 1e-9)) return null;
  const span = Math.max(b - a, whole * MIN_SPAN);
  const mid = (a + b) / 2;
  a = mid - span / 2;
  b = mid + span / 2;
  if (a < f0) [a, b] = [f0, f0 + span];
  if (b > f1) [a, b] = [f1 - span, f1];
  return [back(axis, a), back(axis, b)];
}

/** A view kept inside the whole data; null when it shows everything. */
function clampView(view, frameAxes, full) {
  if (!view) return null;
  const x = frameAxes.x ? clampAxis(view.x, full.x, frameAxes.x) : null;
  const y = clampAxis(view.y, full.y, frameAxes.y);
  return x || y ? { x, y } : null;
}

/** The range an axis shows now: the view's, or the whole one. */
const current = (view, full, key) => (view && view[key]) || full[key];

/** Zooms one axis by k (k > 1 enlarges) about the value c. */
function zoomAxis(range, axis, c, k) {
  const a = fwd(axis, range[0]);
  const b = fwd(axis, range[1]);
  const t = fwd(axis, c);
  return [back(axis, t - (t - a) / k), back(axis, t + (b - t) / k)];
}

/**
 * The view zoomed by k (k > 1 enlarges, k < 1 shrinks) about the pixel (px,
 * py) of the plot, on the axes the chart allows (frame.zoom); `frame` is
 * the frame of the chart as drawn now, `full` its whole extent.
 */
function zoomView(view, frame, full, px, py, k) {
  const allowed = axesOf(frame.zoom);
  const at = valueAt(frame, px, py);
  const next = { x: null, y: null };
  if (allowed.x && frame.x) next.x = zoomAxis(current(view, full, 'x'), frame.x, at.x, k);
  else if (view && view.x) next.x = view.x;
  if (allowed.y) next.y = zoomAxis(current(view, full, 'y'), frame.y, at.y, k);
  else if (view && view.y) next.y = view.y;
  return clampView(next, frame, full);
}

/** The view moved by (dx, dy) pixels of the plot: the data follow the pointer. */
function panView(view, frame, full, dx, dy) {
  if (!view) return null;
  const allowed = axesOf(frame.zoom);
  const shift = (range, axis, pixels, size) => {
    const a = fwd(axis, range[0]);
    const b = fwd(axis, range[1]);
    const d = (pixels / size) * (b - a);
    return [back(axis, a - d), back(axis, b - d)];
  };
  const next = { x: view.x, y: view.y };
  if (allowed.x && frame.x && view.x) next.x = shift(view.x, frame.x, dx, frame.plot.w);
  if (allowed.y && view.y) next.y = shift(view.y, frame.y, -dy, frame.plot.h);
  // keep the span while moving: clampAxis would shrink a view pushed against the edge
  const keep = (range, full, axis) => {
    if (!range) return null;
    const f0 = fwd(axis, full[0]);
    const f1 = fwd(axis, full[1]);
    let a = fwd(axis, range[0]);
    let b = fwd(axis, range[1]);
    if (a < f0) [a, b] = [f0, f0 + (b - a)];
    if (b > f1) [a, b] = [f1 - (b - a), f1];
    return [back(axis, a), back(axis, b)];
  };
  return { x: frame.x ? keep(next.x, full.x, frame.x) : null, y: keep(next.y, full.y, frame.y) };
}

/** The view of the rectangle selected from (x0, y0) to (x1, y1), in pixels, on the axes the chart allows. */
function boxView(view, frame, full, x0, y0, x1, y1) {
  const allowed = axesOf(frame.zoom);
  const a = valueAt(frame, Math.min(x0, x1), Math.max(y0, y1));
  const b = valueAt(frame, Math.max(x0, x1), Math.min(y0, y1));
  return clampView(
    {
      x: allowed.x && frame.x ? [a.x, b.x] : (view && view.x) || null,
      y: allowed.y ? [a.y, b.y] : (view && view.y) || null,
    },
    frame,
    full,
  );
}

/** Whether a view shows less than the whole data. */
const isZoomed = (view) => !!view && (!!view.x || !!view.y);

return { toPixel, toValue, inPlot, valueAt, pixelAt, fullView, clampView, zoomView, panView, boxView, isZoomed };
})();

var kitGestures$ = (function () {
'use strict';

// src/pages/statistics/chartkit/kitGestures.js
// I gesti su un elemento: il puntatore (mouse, penna, dito), la rotella e i
// tasti, tradotti in quello che vogliono dire: passare sopra, premere e
// trascinare, il doppio clic, la rotella con Ctrl, il pizzico a due dita.
// Non sa niente di grafici: chi lo usa decide, con il valore che restituisce,
// se un gesto lo riguarda (press, wheel, pinch e key restituiscono true per
// tenerlo). Le coordinate sono in pixel CSS dall'angolo in alto a sinistra
// dell'elemento.

/**
 * Listens to `el` and calls `handlers`:
 *   hover(p)                     the pointer moves over it (not while a drag is on)
 *   leave()                      it leaves
 *   press(p) -> boolean          a button or a finger goes down; true starts a drag
 *   drag(p, start)               the pointer moves during that drag
 *   release(p, start)            the drag ends (or is cancelled)
 *   dblclick(p) -> boolean       double click
 *   wheel(p, { deltaY, ctrl }) -> boolean   true stops the page from scrolling
 *   pinch({ x, y, scale, dx, dy }) -> boolean   two fingers: the centre, the change of their distance and of the centre
 *   key(event) -> boolean        a key while the element has the focus; true stops its default action
 * p is { x, y, pointerType, button, shift, ctrl }. Returns the function that stops listening.
 */
function attachGestures(el, handlers) {
  const at = (e) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, pointerType: e.pointerType || 'mouse', button: e.button ?? 0, shift: !!e.shiftKey, ctrl: !!(e.ctrlKey || e.metaKey) };
  };
  const touches = new Map(); // pointerId -> { x, y } of the fingers down
  let drag = null; // { id, start } while a press holds the pointer
  let pinch = null; // { distance, x, y } while two fingers are down

  const twoFingers = () => {
    const [a, b] = [...touches.values()];
    return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  const onDown = (e) => {
    const p = at(e);
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, p);
      if (touches.size === 2) {
        // two fingers: the drag of one finger, if any, ends and the pinch begins
        if (drag && handlers.release) handlers.release(p, drag.start);
        drag = null;
        pinch = twoFingers();
        return;
      }
      if (touches.size > 2) return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (handlers.press && handlers.press(p)) {
      drag = { id: e.pointerId, start: p };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // a pointer that is already gone cannot be captured: the drag still works while it stays on the element
      }
      e.preventDefault();
    }
  };

  const onMove = (e) => {
    const p = at(e);
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
      touches.set(e.pointerId, p);
      if (pinch && touches.size === 2) {
        const now = twoFingers();
        const used = handlers.pinch && handlers.pinch({ x: now.x, y: now.y, scale: now.distance / Math.max(1, pinch.distance), dx: now.x - pinch.x, dy: now.y - pinch.y });
        pinch = now;
        if (used) e.preventDefault();
        return;
      }
    }
    if (drag && e.pointerId === drag.id) {
      if (handlers.drag) handlers.drag(p, drag.start);
      return;
    }
    if (!drag && handlers.hover && e.pointerType !== 'touch') handlers.hover(p);
  };

  const onUp = (e) => {
    const p = at(e);
    if (e.pointerType === 'touch') {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
    }
    if (drag && e.pointerId === drag.id) {
      const { start } = drag;
      drag = null;
      if (handlers.release) handlers.release(p, start);
    }
  };

  const onLeave = (e) => {
    if (!drag && e.pointerType !== 'touch' && handlers.leave) handlers.leave();
  };

  const onDouble = (e) => {
    if (handlers.dblclick && handlers.dblclick(at(e))) e.preventDefault();
  };

  const onWheel = (e) => {
    if (handlers.wheel && handlers.wheel(at(e), { deltaY: e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, ctrl: !!(e.ctrlKey || e.metaKey) })) e.preventDefault();
  };

  const onKey = (e) => {
    if (handlers.key && handlers.key(e)) e.preventDefault();
  };

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('dblclick', onDouble);
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('keydown', onKey);
  return () => {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    el.removeEventListener('pointerleave', onLeave);
    el.removeEventListener('dblclick', onDouble);
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('keydown', onKey);
  };
}

return { attachGestures };
})();

var kitChart$ = (function () {
'use strict';

// src/pages/statistics/chartkit/kitChart.js
// Un grafico interattivo: il canvas disegnato dalla libreria dell'homework,
// una tela trasparente sopra per i segni delle interazioni (il rettangolo
// dello zoom, le maniglie da trascinare), la vista (quale parte degli assi
// si vede), le parti nascoste dalla legenda e l'etichetta sotto il
// puntatore.
//
// Il controllore non sa che grafico sia: lo sanno le funzioni che riceve
// (draw, frame, withView, height, hitTest, hitAt, pointerLabel), che ogni
// libreria fornisce (Dependency Inversion). Le interazioni sono plugin
// (kitPlugins.js): un'interazione nuova e' un plugin nuovo, il controllore
// non cambia (Open/Closed). I gesti passano ai plugin in ordine, e il primo
// che ne tiene uno lo segue fino alla fine.
const { attachGestures } = kitGestures$;
const { clampView, fullView, isZoomed, zoomView } = kitView$;

const requestFrame = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16));
const cancelFrame = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id));

/**
 * Makes `canvas` an interactive chart. `deps`:
 *   draw, data, palette        the chart and what it draws
 *   frame(draw, data, width)   where the plot lies and what it shows (null: no zoom)
 *   withView(draw, data, view) the same data in another view
 *   height(draw, data, width)  the height of the canvas at this width
 *   hitTest, hitAt, pointerLabel   the label under the pointer (as attachChartTooltip)
 *   describe(hit, hidden)      its text, or null for none; link: the linked table, or null
 *   hidden                     the parts hidden by the legend
 *   plugins                    the interactions, in order of priority
 *   schedule(job)              where the first drawing goes (a queue of frames), optional
 * Returns the controller: setData, setPalette, setHidden, setDescribe,
 * resize, getFrame, getView, setView, zoomBy, resetView, isZoomed, on,
 * requestOverlay, setCursor, destroy.
 */
function createChart(canvas, deps) {
  const { draw, frame: frameOf, withView, height: heightOf, hitTest, hitAt, pointerLabel, schedule = null } = deps;
  let data = deps.data;
  let palette = deps.palette;
  let hidden = deps.hidden || [];
  let describe = deps.describe || null;
  let link = deps.link || null;
  let width = -1;
  let view = null;
  let viewed = data; // the data as drawn now: hidden parts and view applied
  let frame = null; // where the plot lies now
  let full = null; // the whole extent of the data, without a view
  let frameRequest = 0;
  let firstDrawn = false;
  let destroyed = false;
  const listeners = {};
  const plugins = deps.plugins || [];

  // the transparent canvas over the chart, for the marks of the interactions
  const overlay = document.createElement('canvas');
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px' });
  canvas.after(overlay);

  const emit = (name, payload) => (listeners[name] || []).forEach((fn) => fn(payload));
  const shown = () => (hidden.length ? { ...data, hidden } : data);

  const drawOverlay = () => {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    Object.assign(overlay.style, { left: `${canvas.offsetLeft}px`, top: `${canvas.offsetTop}px`, width: `${w}px`, height: `${h}px` });
    if (overlay.width !== Math.round(w * dpr) || overlay.height !== Math.round(h * dpr)) {
      overlay.width = Math.round(w * dpr);
      overlay.height = Math.round(h * dpr);
    }
    const ctx = overlay.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!frame) return;
    for (const plugin of plugins) if (plugin.overlay) plugin.overlay(ctx, frame, palette);
  };

  const render = () => {
    frameRequest = 0;
    if (destroyed || width <= 0) return;
    const base = shown();
    const fullFrame = frameOf(draw, base, width);
    full = fullFrame ? fullView(fullFrame) : null;
    // a view that the new data no longer allows (other limits) is brought back inside them
    if (view && fullFrame) view = clampView(view, fullFrame, full);
    if (!fullFrame) view = null;
    viewed = view ? withView(draw, base, view) : base;
    canvas.style.height = `${heightOf(draw, viewed, width)}px`;
    draw(canvas, { ...viewed, width }, palette);
    frame = frameOf(draw, viewed, width);
    canvas.tabIndex = frame ? 0 : -1;
    drawOverlay();
    // the label under a still pointer follows the chart that changed under it
    if (detachLabel && detachLabel.refresh) detachLabel.refresh();
    emit('render', { frame, view });
  };

  /** Draws again at the next frame (several changes in the same frame draw once). */
  const redraw = () => {
    if (!frameRequest && !destroyed) frameRequest = requestFrame(render);
  };

  // the label under the pointer, attached once: it always reads the data as drawn now
  let detachLabel = null;
  const attachLabel = () => {
    if (detachLabel || !describe) return;
    detachLabel = pointerLabel(
      canvas,
      (x, y, w) => {
        if (!describe) return null;
        const hit = hitTest(draw, viewed, w, x, y);
        const text = hit && describe(hit, hidden);
        return text ? { rect: hit.rect, text, row: link ? link.row(hit) : -1 } : null;
      },
      link && {
        table: () => (link ? link.table() : null),
        locate: (row, w) => {
          const hit = link && hitAt(draw, viewed, w, link.point(row));
          return hit && hit.rect;
        },
      },
    );
  };
  attachLabel();

  const api = {
    canvas,
    overlay,
    get palette() {
      return palette;
    },
    setData(next) {
      data = next;
      redraw();
    },
    setPalette(next) {
      palette = next;
      redraw();
    },
    setHidden(parts) {
      hidden = parts || [];
      redraw();
    },
    setDescribe(fn) {
      describe = fn;
      attachLabel();
    },
    setLink(next) {
      link = next;
    },
    /** The width the canvas gets in the page (from a ResizeObserver): the first drawing goes through the queue, if any. */
    resize(next) {
      if (next <= 0 || next === width) return;
      width = next;
      if (!firstDrawn && schedule) {
        firstDrawn = true;
        canvas.style.height = `${heightOf(draw, shown(), width)}px`;
        schedule(() => {
          if (!destroyed && canvas.isConnected) render();
        });
        return;
      }
      firstDrawn = true;
      render();
    },
    redraw,
    requestOverlay: () => drawOverlay(),
    getFrame: () => frame,
    getFullView: () => full,
    getView: () => view,
    setView(next) {
      const before = JSON.stringify(view);
      view = next && frame ? clampView(next, frame, full) : null;
      if (JSON.stringify(view) !== before) {
        emit('view', view);
        redraw();
      }
    },
    /** Zooms about the centre of the plot (k > 1 enlarges). */
    zoomBy(k) {
      if (!frame || !full) return;
      api.setView(zoomView(view, frame, full, frame.plot.x + frame.plot.w / 2, frame.plot.y + frame.plot.h / 2, k));
    },
    resetView() {
      api.setView(null);
    },
    isZoomed: () => isZoomed(view),
    canZoom: () => !!frame,
    setCursor(cursor) {
      canvas.style.cursor = cursor || '';
    },
    on(name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
      return () => {
        listeners[name] = (listeners[name] || []).filter((f) => f !== fn);
      };
    },
    emit,
    destroy() {
      destroyed = true;
      cancelFrame(frameRequest);
      detachGestures();
      if (detachLabel) detachLabel();
      for (const plugin of plugins) if (plugin.uninstall) plugin.uninstall();
      overlay.remove();
    },
  };

  // the gestures go to the plugins in order: the first that takes a press follows it to the end
  let active = null;
  const detachGestures = attachGestures(canvas, {
    hover(p) {
      let cursor = '';
      for (const plugin of plugins) {
        const c = plugin.hover && plugin.hover(p);
        if (c) {
          cursor = c;
          break;
        }
      }
      api.setCursor(cursor);
    },
    leave() {
      for (const plugin of plugins) if (plugin.leave) plugin.leave();
      api.setCursor('');
    },
    press(p) {
      active = plugins.find((plugin) => plugin.pointerDown && plugin.pointerDown(p)) || null;
      // the label waits while a plugin follows the drag
      if (active && detachLabel && detachLabel.suspend) detachLabel.suspend(true);
      return !!active;
    },
    drag(p, start) {
      if (active && active.pointerMove) active.pointerMove(p, start);
    },
    release(p, start) {
      if (active && active.pointerUp) active.pointerUp(p, start);
      if (active && detachLabel && detachLabel.suspend) detachLabel.suspend(false);
      active = null;
    },
    dblclick: (p) => plugins.some((plugin) => plugin.doubleClick && plugin.doubleClick(p)),
    wheel: (p, w) => plugins.some((plugin) => plugin.wheel && plugin.wheel(p, w)),
    pinch: (g) => plugins.some((plugin) => plugin.pinch && plugin.pinch(g)),
    key: (e) => plugins.some((plugin) => plugin.key && plugin.key(e)),
  });
  for (const plugin of plugins) if (plugin.install) plugin.install(api);
  return api;
}

return { createChart };
})();

var kitPlugins$ = (function () {
'use strict';

// src/pages/statistics/chartkit/kitPlugins.js
// Le interazioni di un grafico (kitChart.js), una per plugin. Un plugin e'
// un oggetto con i soli metodi che gli servono (Interface Segregation):
//   install(chart), uninstall()
//   hover(p) -> cursore o '', leave()
//   pointerDown(p) -> true per tenere il gesto, pointerMove(p, start), pointerUp(p, start)
//   doubleClick(p), wheel(p, { deltaY, ctrl }), pinch({ x, y, scale, dx, dy }), key(event) -> true se usati
//   overlay(ctx, frame, palette): i suoi segni sulla tela trasparente sopra il grafico
// Un'interazione nuova e' un plugin nuovo: il controllore non cambia.
const { boxView, inPlot, panView, pixelAt, valueAt, zoomView } = kitView$;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Zoom and panning: ctrl (or cmd) + wheel and two fingers zoom about the
 * pointer; a drag selects the rectangle to enlarge, or moves the view once
 * it is enlarged (with shift it always selects); a double click and the
 * keys 0 or Escape go back to the whole chart; + and - zoom, the arrows
 * move. A plain wheel scrolls the page, and the chart says (event 'hint')
 * how to zoom instead.
 */
function zoomPan() {
  let chart = null;
  let mode = null; // 'pan' or 'box' during a drag
  let box = null;
  let last = null;
  return {
    name: 'zoomPan',
    install(c) {
      chart = c;
    },
    hover(p) {
      const f = chart.getFrame();
      if (!inPlot(f, p.x, p.y)) return '';
      return chart.isZoomed() && !p.shift ? 'grab' : 'zoom-in';
    },
    pointerDown(p) {
      const f = chart.getFrame();
      if (!f || p.pointerType === 'touch' || !inPlot(f, p.x, p.y)) return false;
      if (chart.isZoomed() && !p.shift) {
        mode = 'pan';
        last = p;
        chart.setCursor('grabbing');
        return true;
      }
      mode = 'box';
      box = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
      return true;
    },
    pointerMove(p) {
      const f = chart.getFrame();
      if (!f) return;
      if (mode === 'pan') {
        chart.setView(panView(chart.getView(), f, chart.getFullView(), p.x - last.x, p.y - last.y));
        last = p;
      } else if (mode === 'box') {
        box.x1 = clamp(p.x, f.plot.x, f.plot.x + f.plot.w);
        box.y1 = clamp(p.y, f.plot.y, f.plot.y + f.plot.h);
        chart.requestOverlay();
      }
    },
    pointerUp() {
      const f = chart.getFrame();
      if (mode === 'box' && box && f) {
        const wide = Math.abs(box.x1 - box.x0) > 6 && f.zoom !== 'y';
        const tall = Math.abs(box.y1 - box.y0) > 6;
        if (wide || tall) {
          const { plot } = f;
          // a thin selection enlarges one axis only, the other one stays as it is
          const x0 = wide ? box.x0 : plot.x;
          const x1 = wide ? box.x1 : plot.x + plot.w;
          const y0 = tall ? box.y0 : plot.y;
          const y1 = tall ? box.y1 : plot.y + plot.h;
          const next = boxView(chart.getView(), f, chart.getFullView(), x0, y0, x1, y1);
          const view = chart.getView();
          chart.setView({ x: wide ? next && next.x : view && view.x, y: tall ? next && next.y : view && view.y });
        }
      }
      mode = null;
      box = null;
      chart.requestOverlay();
      chart.setCursor('');
    },
    doubleClick() {
      if (!chart.isZoomed()) return false;
      chart.resetView();
      return true;
    },
    wheel(p, w) {
      const f = chart.getFrame();
      if (!f || !inPlot(f, p.x, p.y)) return false;
      if (!w.ctrl) {
        chart.emit('hint');
        return false;
      }
      chart.setView(zoomView(chart.getView(), f, chart.getFullView(), p.x, p.y, Math.exp(-w.deltaY * 0.0025)));
      return true;
    },
    pinch(g) {
      const f = chart.getFrame();
      if (!f) return false;
      const zoomed = zoomView(chart.getView(), f, chart.getFullView(), g.x, g.y, g.scale);
      chart.setView(zoomed ? panView(zoomed, f, chart.getFullView(), g.dx, g.dy) : null);
      return true;
    },
    key(e) {
      const f = chart.getFrame();
      if (!f) return false;
      if (e.key === '+' || e.key === '=') {
        chart.zoomBy(1.5);
        return true;
      }
      if (e.key === '-' || e.key === '_') {
        if (!chart.isZoomed()) return false;
        chart.zoomBy(1 / 1.5);
        return true;
      }
      if (e.key === '0' || e.key === 'Escape') {
        if (!chart.isZoomed()) return false;
        chart.resetView();
        return true;
      }
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!step || !chart.isZoomed()) return false;
      chart.setView(panView(chart.getView(), f, chart.getFullView(), -step[0] * f.plot.w * 0.1, -step[1] * f.plot.h * 0.1));
      return true;
    },
    overlay(ctx, f, pal) {
      if (mode !== 'box' || !box) return;
      const yOnly = f.zoom === 'y';
      const x = yOnly ? f.plot.x : Math.min(box.x0, box.x1);
      const w = yOnly ? f.plot.w : Math.abs(box.x1 - box.x0);
      const y = Math.min(box.y0, box.y1);
      const h = Math.abs(box.y1 - box.y0);
      ctx.fillStyle = pal.highlight;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
      ctx.setLineDash([]);
    },
  };
}

/**
 * Lines to drag on the chart, bound to the parameters of its spec: specs
 * [{ id, axis: 'x' (a vertical line) or 'y' (a horizontal one), value,
 * min, max, step?, values? (the allowed ones), label? }], in the units of
 * the axes. onChange(id, value) receives the new value while dragging; the
 * line itself moves when the spec gives the new value back (setSpecs).
 */
function handles({ onChange, onEnd = null }) {
  let chart = null;
  let specs = [];
  let grabbed = null;
  const where = (f, spec) => {
    const at = spec.axis === 'x' ? pixelAt(f, spec.value, null).x : pixelAt(f, null, spec.value).y;
    if (at === null || !Number.isFinite(at)) return null;
    const inside = spec.axis === 'x' ? at >= f.plot.x - 1 && at <= f.plot.x + f.plot.w + 1 : at >= f.plot.y - 1 && at <= f.plot.y + f.plot.h + 1;
    return inside ? at : null;
  };
  const near = (p) => {
    const f = chart && chart.getFrame();
    if (!f || !inPlot(f, p.x, p.y, 8)) return null;
    const reach = p.pointerType === 'touch' ? 14 : 7;
    let best = null;
    let distance = reach;
    for (const spec of specs) {
      const at = where(f, spec);
      if (at === null) continue;
      const d = Math.abs((spec.axis === 'x' ? p.x : p.y) - at);
      if (d <= distance) {
        best = spec;
        distance = d;
      }
    }
    return best;
  };
  const snap = (spec, v) => {
    if (spec.values && spec.values.length) {
      // on a logarithmic axis the nearest value is the nearest in the logarithms, as the eye sees it
      const f = chart && chart.getFrame();
      const axis = f && f[spec.axis];
      const t = axis && axis.log ? (u) => Math.log10(u) : (u) => u;
      return spec.values.reduce((a, b) => (Math.abs(t(b) - t(v)) < Math.abs(t(a) - t(v)) ? b : a));
    }
    let out = clamp(v, spec.min ?? -Infinity, spec.max ?? Infinity);
    if (spec.step) out = Math.round(out / spec.step) * spec.step;
    return Number(out.toPrecision(12));
  };
  return {
    name: 'handles',
    install(c) {
      chart = c;
    },
    setSpecs(next) {
      specs = next || [];
      if (chart) chart.requestOverlay();
    },
    hover(p) {
      const spec = near(p);
      if (!spec) return '';
      return spec.axis === 'x' ? 'ew-resize' : 'ns-resize';
    },
    pointerDown(p) {
      grabbed = near(p);
      if (!grabbed) return false;
      chart.setCursor(grabbed.axis === 'x' ? 'ew-resize' : 'ns-resize');
      return true;
    },
    pointerMove(p) {
      const f = chart.getFrame();
      if (!grabbed || !f) return;
      const v = valueAt(f, p.x, p.y)[grabbed.axis];
      if (v === null || !Number.isFinite(v)) return;
      const next = snap(grabbed, v);
      if (next !== grabbed.value) {
        grabbed = { ...grabbed, value: next };
        onChange(grabbed.id, next);
      }
    },
    pointerUp() {
      if (grabbed && onEnd) onEnd(grabbed.id);
      grabbed = null;
      chart.setCursor('');
    },
    overlay(ctx, f, pal) {
      for (const spec of specs) {
        const at = where(f, spec);
        if (at === null) continue;
        const active = grabbed && grabbed.id === spec.id;
        ctx.strokeStyle = pal.highlight;
        ctx.fillStyle = pal.highlight;
        ctx.lineWidth = active ? 2.5 : 1.8;
        ctx.beginPath();
        if (spec.axis === 'x') {
          ctx.moveTo(at, f.plot.y);
          ctx.lineTo(at, f.plot.y + f.plot.h);
        } else {
          ctx.moveTo(f.plot.x, at);
          ctx.lineTo(f.plot.x + f.plot.w, at);
        }
        ctx.stroke();
        // the knob to grab, with the label beside it: at the left of a horizontal line, away from
        // the zoom buttons in the top right corner, and at the top of a vertical one, above the bars
        const kx = spec.axis === 'x' ? at : f.plot.x + 9;
        const ky = spec.axis === 'x' ? f.plot.y + 9 : at;
        ctx.beginPath();
        ctx.arc(kx, ky, active ? 7 : 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = pal.background;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (spec.label) {
          ctx.font = '11px sans-serif';
          ctx.fillStyle = pal.text;
          const right = spec.axis === 'x' && at > f.plot.x + f.plot.w * 0.7;
          ctx.textAlign = right ? 'right' : 'left';
          const tx = spec.axis === 'x' ? at + (right ? -10 : 10) : kx + 11;
          // above the line, or below it when the line is at the top of the plot
          let ty = spec.axis === 'x' ? f.plot.y + 13 : at - 7;
          if (spec.axis === 'y' && at - f.plot.y < 16) ty = at + 15;
          ctx.fillText(spec.label, tx, ty);
        }
      }
    },
  };
}

return { zoomPan, handles };
})();

var kitPlayer$ = (function () {
'use strict';

// src/pages/statistics/chartkit/kitPlayer.js
// Il lettore delle animazioni: un tempo t da 0 a frames - 1 che avanza a
// una certa velocita', con avvio, pausa, un passo avanti o indietro e un
// punto qualsiasi. Non sa niente di grafici: a ogni passo chiama
// onFrame(t), e chi lo usa ridisegna. All'inizio sta sull'ultimo passo, cosi'
// chi non preme Avvia vede il grafico completo, e non parte mai da solo:
// rispetta anche chi ha chiesto meno movimento.

const requestFrame = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(() => fn(Date.now()), 16));
const cancelFrame = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id));

/**
 * A player of `frames` steps, one every `ms` milliseconds at speed 1.
 * onFrame(t) draws step t; onChange(state) tells the interface { t,
 * frames, playing, speed }. Returns { play, pause, toggle, step, seek,
 * setSpeed, setFrames, setMs, state, destroy }.
 */
function createPlayer({ frames = 1, ms: stepMs = 60, loop = false, onFrame, onChange = null }) {
  let ms = stepMs;
  let count = Math.max(1, frames);
  let t = count - 1;
  let playing = false;
  let speed = 1;
  let request = 0;
  let last = 0;
  let elapsed = 0;
  const state = () => ({ t, frames: count, playing, speed });
  const notify = () => {
    if (onChange) onChange(state());
  };
  const tick = (now) => {
    if (!playing) return;
    if (!last) last = now;
    elapsed += (now - last) * speed;
    last = now;
    let moved = false;
    while (elapsed >= ms && playing) {
      elapsed -= ms;
      if (t < count - 1) {
        t += 1;
        moved = true;
      } else if (loop) {
        t = 0;
        moved = true;
      } else {
        playing = false;
      }
    }
    if (moved) onFrame(t);
    notify();
    if (playing) request = requestFrame(tick);
  };
  const api = {
    play() {
      if (playing || count < 2) return;
      // at the end, play starts again from the beginning
      if (t >= count - 1) {
        t = 0;
        onFrame(t);
      }
      playing = true;
      last = 0;
      elapsed = 0;
      request = requestFrame(tick);
      notify();
    },
    pause() {
      if (!playing) return;
      playing = false;
      cancelFrame(request);
      notify();
    },
    toggle() {
      if (playing) api.pause();
      else api.play();
    },
    step(by = 1) {
      api.pause();
      const next = Math.min(count - 1, Math.max(0, t + by));
      if (next !== t) {
        t = next;
        onFrame(t);
      }
      notify();
    },
    seek(at) {
      const next = Math.min(count - 1, Math.max(0, Math.round(at)));
      if (next !== t) {
        t = next;
        onFrame(t);
      }
      notify();
    },
    setSpeed(next) {
      speed = next;
      notify();
    },
    /** A new number of steps (the parameters changed): when stopped, the player goes to the end, where the chart is complete. */
    setFrames(next) {
      count = Math.max(1, next);
      if (!playing || t > count - 1) t = count - 1;
      notify();
    },
    /** Another length of a step, in milliseconds at speed 1 (a new animation). */
    setMs(next) {
      ms = Math.max(1, next);
    },
    state,
    destroy() {
      playing = false;
      cancelFrame(request);
    },
  };
  return api;
}

return { createPlayer };
})();

var kitSpec$ = (function () {
'use strict';

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
function sliderIndex(control, params) {
  const v = params[control.key];
  let best = 0;
  control.values.forEach((x, i) => {
    if (Math.abs(x - v) < Math.abs(control.values[best] - v)) best = i;
  });
  return best;
}

/** The parameters after a control is used: a slider gives the index of its value, a choice its value, a toggle true or false, an action nothing. */
function applyControl(control, params, input) {
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
function createModel({ params, simulate = null, simKey = keyOf, runner = null }) {
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

return { sliderIndex, applyControl, createModel };
})();

var kitLabels$ = (function () {
'use strict';

// src/pages/statistics/chartkit/kitLabels.js
// I testi dei comandi dei grafici interattivi, uguali in ogni homework: lo
// zoom, il suggerimento, il lettore delle animazioni.

const KIT_LABELS = Object.freeze({
  it: Object.freeze({
    tools: 'Zoom del grafico',
    zoomIn: 'Ingrandisci',
    zoomOut: 'Riduci',
    reset: 'Vista intera',
    hint: 'Ctrl + rotella per ingrandire; oppure trascinate per scegliere una zona, doppio clic per tornare alla vista intera',
    touchHint: 'Due dita per ingrandire',
    player: 'Animazione',
    play: 'Avvia',
    pause: 'Pausa',
    back: 'Un passo indietro',
    forward: 'Un passo avanti',
    speed: 'Velocità',
    position: (t, n) => `Passo ${t} di ${n}`,
    pending: 'Simulazione in corso...',
  }),
  en: Object.freeze({
    tools: 'Chart zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Whole chart',
    hint: 'Ctrl + wheel to zoom; or drag to pick an area, double click to go back to the whole chart',
    touchHint: 'Two fingers to zoom',
    player: 'Animation',
    play: 'Play',
    pause: 'Pause',
    back: 'One step back',
    forward: 'One step forward',
    speed: 'Speed',
    position: (t, n) => `Step ${t} of ${n}`,
    pending: 'Simulating...',
  }),
});

/** The labels in a language, English when it is not known. */
const kitLabels = (lang) => KIT_LABELS[lang] || KIT_LABELS.en;

return { KIT_LABELS, kitLabels };
})();

var kitReveal$ = (function () {
'use strict';

// src/pages/statistics/chartkit/kitReveal.js
// L'animazione piu' comune dei grafici degli homework: una curva disegnata
// punto per punto, al crescere della sua x (n che cresce, i giorni, i
// tentativi). Vale per i dati dei grafici a linee di ogni libreria, { x,
// series: [{ values, band?, fixed? }] }: le serie `fixed` (riferimenti,
// bande, soglie) restano intere.

/** An animation that draws a line chart point by point, as its x grows: { frames, at(t), ms }. */
function reveal(chart, ms = 110) {
  return {
    frames: chart.x.length,
    ms,
    at: (t) => ({
      ...chart,
      series: chart.series.map((s) => (s.fixed ? s : { ...s, values: s.values.map((v, i) => (i <= t ? v : null)), band: s.band ? s.band.map((b, i) => (i <= t ? b : null)) : s.band })),
    }),
  };
}

return { reveal };
})();

var kitDom$ = (function () {
'use strict';

// src/pages/statistics/chartkit/kitDom.js
// L'adattatore del kit dei grafici interattivi per i programmi scaricabili:
// lo stesso grafico della pagina (ChartFigure.jsx), costruito con il DOM, senza
// React. Un grafico e' una <figure> con, dall'alto: il riquadro del canvas
// con i pulsanti dello zoom, il lettore dell'animazione, la legenda a
// pulsanti, la nota e la didascalia. I comandi di una sezione (controlsOf,
// modelControls) stanno sopra i suoi grafici e seguono il suo modello
// (kitSpec.createModel). Le classi sono quelle di style.css dei programmi.
//
// Ogni testo entra con textContent, mai come HTML.
const { createChart } = kitChart$;
const { kitLabels } = kitLabels$;
const { createPlayer } = kitPlayer$;
const { handles: handlesPlugin, zoomPan } = kitPlugins$;
const { applyControl, createModel: makeModel, sliderIndex } = kitSpec$;

const HINT_MS = 2200;

/** The model of a section with controls (kitSpec.createModel), for the programs. */
const createModel = makeModel;
let uid = 0;

/** el('p', { class: 'note', text: '...' }, child, ...): the text always through textContent. */
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style') Object.assign(node.style, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** The parts of the drawing covered by the hidden items of a legend. */
const partsOf = (items, hidden) => items.flatMap((item, i) => (hidden.has(i) ? item.parts || [] : []));

/** Hides the cells, columns and rows of a table that belong to hidden parts (data-part), and shows the others. */
function hideParts(table, parts) {
  if (!table) return;
  for (const node of table.querySelectorAll('[data-part]')) node.hidden = parts.includes(node.dataset.part);
}

/**
 * The legend of a chart: { label, color? | paletteKey?, dashed?, box?,
 * parts }. Every item is a button: pressed its parts are on screen,
 * released they are hidden; onChange(parts) receives the hidden parts.
 * `hidden`, the set of the hidden items, outlives the legend.
 */
function legend(items, onChange, hidden, palette) {
  return el(
    'ul',
    { class: 'series-legend' },
    items.map((item, i) => {
      const color = item.paletteKey ? palette[item.paletteKey] : palette.series[(item.color ?? i) % palette.series.length];
      let swatch = null;
      if (item.box) swatch = 'is-box';
      else if (item.dashed) swatch = 'is-dashed';
      const button = el(
        'button',
        {
          type: 'button',
          'aria-pressed': String(!hidden.has(i)),
          class: hidden.has(i) ? 'is-off' : null,
          onclick: () => {
            if (hidden.has(i)) hidden.delete(i);
            else hidden.add(i);
            button.setAttribute('aria-pressed', String(!hidden.has(i)));
            button.classList.toggle('is-off', hidden.has(i));
            onChange(partsOf(items, hidden));
          },
        },
        el('span', { class: swatch, 'aria-hidden': 'true', style: { borderColor: color, backgroundColor: item.box ? color : 'transparent' } }),
        item.label,
      );
      return el('li', null, button);
    }),
  );
}

/**
 * The controls of a section (kitSpec), with the classes of the programs:
 * getParams() gives the parameters, onChange(params) receives them after
 * every use. box.update() moves the controls to the current parameters
 * without rebuilding them (a slider keeps the focus while it moves).
 */
function controlsOf(controls, getParams, onChange, pendingLabel = '') {
  const id = `kitc${(uid += 1)}`;
  const actions = controls.filter((c) => c.kind === 'action');
  const pending = el('p', { class: 'kit-pending note', role: 'status', text: pendingLabel, hidden: true });
  const params = getParams();
  const blocks = controls
    .map((c, i) => {
      if (c.kind === 'slider') {
        const index = sliderIndex(c, params);
        const text = c.label(c.values[index]);
        return el(
          'div',
          { class: 'slider' },
          el('label', { for: `${id}-${c.key}`, text }),
          el('input', { id: `${id}-${c.key}`, type: 'range', min: 0, max: c.values.length - 1, step: 1, value: index, 'aria-valuetext': text, oninput: (e) => onChange(applyControl(c, getParams(), Number(e.target.value))) }),
        );
      }
      if (c.kind === 'choice') {
        return el(
          'div',
          { class: 'choices', role: 'group', 'aria-label': c.label },
          el('span', { class: 'choices-label', text: c.label }),
          c.options.map(([value, name]) => el('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(params[c.key] === value), text: name, onclick: () => onChange(applyControl(c, getParams(), value)) })),
        );
      }
      if (c.kind === 'toggle') {
        return el('label', { class: 'kit-toggle' }, el('input', { type: 'checkbox', checked: !!params[c.key], onchange: (e) => onChange(applyControl(c, getParams(), e.target.checked)) }), ` ${c.label}`);
      }
      if (i !== controls.indexOf(actions[0])) return null;
      return el('p', { class: 'kit-actions' }, actions.map((a) => el('button', { type: 'button', class: 'btn alt small', text: a.label, onclick: () => onChange(applyControl(a, getParams())) })));
    })
    .filter(Boolean);
  const box = el('div', { class: 'kit-controls' }, blocks, pending);
  box.update = (busy = false) => {
    const now = getParams();
    let k = 0;
    for (const c of controls) {
      if (c.kind === 'action' && c !== actions[0]) continue;
      const block = blocks[k];
      k += 1;
      if (c.kind === 'slider') {
        const index = sliderIndex(c, now);
        const text = c.label(c.values[index]);
        block.querySelector('label').textContent = text;
        const input = block.querySelector('input');
        if (Number(input.value) !== index) input.value = String(index);
        input.setAttribute('aria-valuetext', text);
      } else if (c.kind === 'choice') {
        block.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(now[c.key] === c.options[j][0])));
      } else if (c.kind === 'toggle') {
        block.querySelector('input').checked = !!now[c.key];
      }
    }
    pending.hidden = !busy;
  };
  return box;
}

/** The controls bound to the model of a section (kitSpec.createModel): they follow it, and are released with their region (releaseFigures). */
function modelControls(model, controls, lang = 'en') {
  const box = controlsOf(controls, () => model.get().params, (next) => model.setParams(next), kitLabels(lang).pending);
  box.kitRelease = model.subscribe(() => box.update(model.get().pending));
  box.update(model.get().pending);
  return box;
}

/** The player of an animation: back, play or pause, forward, the position and the speed. */
function playerBar(id, player, labels) {
  const back = el('button', { type: 'button', class: 'btn alt small', 'aria-label': labels.back, title: labels.back, text: '‹', onclick: () => player.step(-1) });
  const play = el('button', { type: 'button', class: 'btn small kit-play', onclick: () => player.toggle() });
  const forward = el('button', { type: 'button', class: 'btn alt small', 'aria-label': labels.forward, title: labels.forward, text: '›', onclick: () => player.step(1) });
  const position = el('input', { id: `${id}-t`, class: 'kit-position', type: 'range', min: 0, step: 1, oninput: (e) => player.seek(Number(e.target.value)) });
  const where = el('span', { class: 'kit-step', 'aria-hidden': 'true' });
  const speeds = [1, 2, 4].map((s) => el('button', { type: 'button', class: 'btn alt small', text: `×${s}`, onclick: () => player.setSpeed(s) }));
  const bar = el('div', { class: 'kit-player', role: 'group', 'aria-label': labels.player }, back, play, forward, position, where, el('span', { class: 'kit-speed', role: 'group', 'aria-label': labels.speed }, speeds));
  bar.update = (state) => {
    play.textContent = state.playing ? labels.pause : labels.play;
    play.setAttribute('aria-pressed', String(state.playing));
    back.disabled = state.t <= 0;
    forward.disabled = state.t >= state.frames - 1;
    position.max = String(state.frames - 1);
    position.value = String(state.t);
    const text = labels.position(state.t + 1, state.frames);
    position.setAttribute('aria-label', text);
    position.setAttribute('aria-valuetext', text);
    where.textContent = text;
    speeds.forEach((b, i) => b.setAttribute('aria-pressed', String(state.speed === [1, 2, 4][i])));
  };
  return bar;
}

// one observer for every chart of the page: the width of each canvas, measured after layout
const sizes = typeof ResizeObserver === 'function'
  ? new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = Math.round(entry.contentRect.width);
      const figure = entry.target.closest('figure');
      if (figure && figure.kit && width > 0) figure.kit.chart.resize(width);
    }
  })
  : null;

/**
 * An interactive chart for the programs. `options`:
 *   label, draw, data, palette, lang
 *   lib (the library of the homework), schedule (the queue of the first drawings)
 *   tip (describe(hit, hidden)), link, items (the legend), keep (the set of hidden items that outlives the chart),
 *   table (the id of the linked table: the legend hides its parts too), onHide(parts) (anything else the legend hides), note, wide
 *   animation ({ frames, at(t) -> data, ms }: the chart step by step, with the player)
 *   handles ({ items, onChange(id, value) }: the lines to drag), pending (a simulation is running)
 * Returns the <figure>, with figure.kit = { chart, setData, setTip, setLabel,
 * setNote, relabel, setHidden, setAnimation, setHandles, setPending, destroy }.
 */
function createFigure(options) {
  const { label, draw, palette, lib, schedule = null, lang = 'en', items = null, note = null, link = null, table = null, wide = true } = options;
  const labels = kitLabels(lang);
  const id = `kit${(uid += 1)}`;
  const hidden = options.keep || new Set();
  let given = options.data;
  let animation = options.animation || null;
  let onHandle = options.handles ? options.handles.onChange : null;
  let t = animation ? Math.max(1, animation.frames) - 1 : 0;
  const frames = () => (animation ? Math.max(1, animation.frames) : 1);
  const dataNow = () => (animation && t < frames() - 1 ? animation.at(t) : given);

  const canvas = el('canvas', { class: 'chart', role: 'img', 'aria-label': label });
  const plot = el('div', { class: 'kit-plot' }, canvas);
  const zoomIn = el('button', { type: 'button', 'aria-label': labels.zoomIn, title: labels.zoomIn, text: '+' });
  const zoomOut = el('button', { type: 'button', 'aria-label': labels.zoomOut, title: labels.zoomOut, text: '-', disabled: true });
  const reset = el('button', { type: 'button', 'aria-label': labels.reset, title: labels.reset, text: '⤢', disabled: true });
  const tools = el('div', { class: 'kit-tools', role: 'group', 'aria-label': labels.tools, hidden: true }, zoomIn, zoomOut, reset);
  const hint = el('p', { class: 'kit-hint', 'aria-live': 'polite', text: labels.hint, hidden: true });
  const busy = el('p', { class: 'kit-busy', role: 'status', text: labels.pending, hidden: !options.pending });
  const caption = el('figcaption', { text: label });
  const noteEl = el('p', { class: 'figure-note', text: note || '', hidden: !note });

  const handles = options.handles ? handlesPlugin({ onChange: (key, value) => onHandle && onHandle(key, value) }) : null;
  const chart = createChart(canvas, {
    draw,
    data: dataNow(),
    palette,
    frame: lib.chartFrame,
    withView: lib.withView,
    height: lib.chartHeight,
    hitTest: lib.chartHitTest,
    hitAt: lib.chartHitAt,
    pointerLabel: lib.attachPointerLabel,
    describe: options.tip || null,
    link,
    hidden: items ? partsOf(items, hidden) : [],
    plugins: handles ? [handles, zoomPan()] : [zoomPan()],
    schedule,
  });
  if (handles) handles.setSpecs(options.handles.items);
  zoomIn.addEventListener('click', () => chart.zoomBy(1.5));
  zoomOut.addEventListener('click', () => chart.zoomBy(1 / 1.5));
  reset.addEventListener('click', () => chart.resetView());
  chart.on('render', ({ frame }) => {
    tools.hidden = !frame;
  });
  chart.on('view', () => {
    const zoomed = chart.isZoomed();
    tools.classList.toggle('is-zoomed', zoomed);
    zoomOut.disabled = !zoomed;
    reset.disabled = !zoomed;
  });
  let hintTimer = 0;
  chart.on('hint', () => {
    hint.hidden = false;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hint.hidden = true;
    }, HINT_MS);
  });

  // the animation: the player starts on the last step, where the chart is complete
  let bar = null;
  const player = createPlayer({
    frames: frames(),
    ms: (animation && animation.ms) || 60,
    onFrame: (step) => {
      t = step;
      chart.setData(dataNow());
    },
    onChange: (state) => bar && bar.update(state),
  });
  bar = playerBar(id, player, labels);
  bar.hidden = !animation;
  bar.update(player.state());

  const legendEl = items
    ? legend(
      items,
      (parts) => {
        chart.setHidden(parts);
        if (table) hideParts(document.getElementById(table), parts);
        if (options.onHide) options.onHide(parts);
      },
      hidden,
      palette,
    )
    : null;
  const figure = el(
    'figure',
    { class: `${wide ? 'figure wide' : 'figure'} kit-figure${options.pending ? ' is-pending' : ''}` },
    el('div', { class: 'kit-stage' }, plot, tools, hint, busy),
    bar,
    legendEl,
    noteEl,
    caption,
  );
  figure.kit = {
    chart,
    setData(next) {
      given = next;
      chart.setData(dataNow());
    },
    setTip: (next) => chart.setDescribe(next),
    setLabel(next) {
      canvas.setAttribute('aria-label', next);
      caption.textContent = next;
    },
    setNote(next) {
      noteEl.textContent = next || '';
      noteEl.hidden = !next;
    },
    /** New labels for the buttons of the legend (the same items, in the same order). */
    relabel(next) {
      if (!legendEl) return;
      legendEl.querySelectorAll('button').forEach((button, i) => {
        if (next[i]) button.lastChild.textContent = next[i].label;
      });
    },
    setHidden: (parts) => chart.setHidden(parts),
    /** A new animation (the parameters changed): when stopped, the player goes to the end, where the chart is complete. */
    setAnimation(next) {
      animation = next || null;
      bar.hidden = !animation;
      if (animation && animation.ms) player.setMs(animation.ms);
      player.setFrames(frames());
      t = player.state().t;
      chart.setData(dataNow());
    },
    setHandles(next) {
      if (!handles || !next) return;
      onHandle = next.onChange;
      handles.setSpecs(next.items);
    },
    setPending(on) {
      busy.hidden = !on;
      figure.classList.toggle('is-pending', !!on);
      canvas.setAttribute('aria-busy', on ? 'true' : 'false');
    },
    destroy() {
      clearTimeout(hintTimer);
      if (sizes) sizes.unobserve(canvas);
      player.destroy();
      chart.destroy();
    },
  };
  if (sizes) sizes.observe(canvas);
  // the table may come after the chart: its parts are hidden once both are on the page
  if (table && hidden.size && typeof requestAnimationFrame === 'function') requestAnimationFrame(() => hideParts(document.getElementById(table), partsOf(items, hidden)));
  return figure;
}

/** Releases the charts and the controls inside a region that is about to be replaced. */
function releaseFigures(region) {
  for (const figure of region.querySelectorAll('figure.kit-figure')) if (figure.kit) figure.kit.destroy();
  for (const box of region.querySelectorAll('.kit-controls')) if (box.kitRelease) box.kitRelease();
}

return { createModel, partsOf, hideParts, legend, controlsOf, modelControls, createFigure, releaseFigures };
})();

var view$ = (function () {
'use strict';

// src/pages/statistics/hw7/view.js
// La logica di presentazione dell'Homework #7, comune alla pagina del sito e
// al programma scaricabile: le sezioni e il loro indice, i parametri dei
// calcoli, i dati di ogni grafico, le legende a pulsanti (le parti del
// disegno che ogni voce nasconde), le etichette sotto il puntatore, le
// tabelle legate ai grafici, i valori iniziali dei riquadri "Prova" e le
// righe del riepilogo dei test. Qui non ci sono testi: arrivano da texts.js.
const hw = Homework7;
const { reveal: revealChart } = kitReveal$;

/** The sections of the page, in order, with the level of their title: the index of the page and of the program is built from here. */
const SECTIONS = [
  { id: 'hw7-assignment', key: 'assignment', level: 0 },
  { id: 'hw7-convergence', key: 'convergence', level: 0 },
  { id: 'hw7-probability', key: 'probability', level: 1 },
  { id: 'hw7-almost', key: 'almost', level: 1 },
  { id: 'hw7-try-sequences', key: 'trySequences', level: 2 },
  { id: 'hw7-l2', key: 'l2', level: 1 },
  { id: 'hw7-distribution', key: 'distribution', level: 1 },
  { id: 'hw7-try-clt', key: 'tryClt', level: 2 },
  { id: 'hw7-try-hash', key: 'tryHash', level: 2 },
  { id: 'hw7-map', key: 'map', level: 1 },
  { id: 'hw7-try-map', key: 'tryMap', level: 2 },
  { id: 'hw7-roles', key: 'roles', level: 1 },
  { id: 'hw7-results', key: 'results', level: 1 },
  { id: 'hw7-root', key: 'root', level: 1 },
  { id: 'hw7-try-scale', key: 'tryScale', level: 2 },
  { id: 'hw7-bursts', key: 'bursts', level: 1 },
  { id: 'hw7-try-bursts', key: 'tryBursts', level: 2 },
  { id: 'hw7-heavy', key: 'heavy', level: 1 },
  { id: 'hw7-speed', key: 'speed', level: 1 },
  { id: 'hw7-bayes', key: 'bayes', level: 0 },
  { id: 'hw7-conditional', key: 'conditional', level: 1 },
  { id: 'hw7-try-pvalue', key: 'tryPvalue', level: 2 },
  { id: 'hw7-engine', key: 'engine', level: 1 },
  { id: 'hw7-alarm', key: 'alarm', level: 1 },
  { id: 'hw7-try-alarm', key: 'tryAlarm', level: 2 },
  { id: 'hw7-network', key: 'network', level: 1 },
  { id: 'hw7-try-network', key: 'tryNetwork', level: 2 },
  { id: 'hw7-sprt', key: 'sprt', level: 1 },
  { id: 'hw7-try-sprt', key: 'trySprt', level: 2 },
  { id: 'hw7-rate', key: 'rate', level: 1 },
  { id: 'hw7-try-belief', key: 'tryBelief', level: 2 },
  { id: 'hw7-try-prior', key: 'tryPrior', level: 2 },
  { id: 'hw7-frequentist', key: 'frequentist', level: 1 },
  { id: 'hw7-spam', key: 'spam', level: 1 },
  { id: 'hw7-kdd', key: 'kdd', level: 1 },
  { id: 'hw7-limits', key: 'limits', level: 1 },
  { id: 'hw7-bvm', key: 'bvm', level: 1 },
  { id: 'hw7-checks', key: 'checks', level: 0 },
  { id: 'hw7-tests', key: 'tests', level: 0 },
  { id: 'hw7-history', key: 'history', level: 0 },
  { id: 'hw7-conclusion', key: 'conclusion', level: 0 },
];

/** The entries of the index: the sections with their titles in the current language. */
const tocEntries = (titles) => SECTIONS.map((s) => ({ ...s, title: titles[s.key] }));

/** The parameters of the computations as the page opens, and the key that names a set of them. */
const DEFAULT_PARAMS = Object.freeze({ seed: hw.DEFAULT_SEED });
const paramsKey = (params) => `${params.seed}`;
const parseParamsKey = (key) => ({ seed: Number(key) });

// ---------------------------------------------------------------------------
// Numeri
// ---------------------------------------------------------------------------

/** A p-value as mantissa and exponent, also below 10^-300, where p itself is 0: { m, e } with p = m x 10^e. */
function pParts(p, log10p) {
  if (!Number.isFinite(log10p)) return { m: 0, e: 0 };
  const e = Math.floor(log10p);
  let m = 10 ** (log10p - e);
  if (m >= 9.995) return { m: 1, e: e + 1 };
  m = Math.round(m * 100) / 100;
  return { m, e };
}

const percentTicks = (lo, hi, step) => Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => Number((lo + i * step).toFixed(6)));
/** An axis label in percent: 0.25 -> 25%. */
const pctLabel = (decimal) => (v) => `${String(Number((100 * v).toFixed(1))).replace('.', decimal)}%`;
/** Powers of ten for a logarithmic axis. */
const powers = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => 10 ** (lo + i));

// ---------------------------------------------------------------------------
// 1.2 L'allarme
// ---------------------------------------------------------------------------

/** The categories of the natural frequencies, in the order of the cells: attacks seen, attacks missed, false alarms, quiet normal connections. */
const ALARM_CATEGORIES = Object.freeze(['detected', 'missed', 'falseAlarm', 'quiet']);
const ALARM_COLORS = Object.freeze([1, 4, 3, 6]);

/** The picture of the natural frequencies of one alarm. */
const alarmIcons = (facts) => ({ counts: facts.counts, total: facts.population, columns: 'auto', colors: ALARM_COLORS, faint: [3] });

/** The indices of the sliders of "Try it" as the page opens. */
const ALARM_TRY_DEFAULT = Object.freeze({
  base: hw.ALARM_BASES.indexOf(hw.ALARM_DEFAULT.base),
  sensitivity: hw.ALARM_SENSITIVITIES.indexOf(hw.ALARM_DEFAULT.sensitivity),
  fpr: hw.ALARM_FPRS.indexOf(hw.ALARM_DEFAULT.fpr),
  second: false,
});

/** The facts of "Try it" from the indices of its sliders; with the second detector, the counts of the connections it sees again. */
function alarmTry(state) {
  const settings = { base: hw.ALARM_BASES[state.base], sensitivity: hw.ALARM_SENSITIVITIES[state.sensitivity], fpr: hw.ALARM_FPRS[state.fpr] };
  const facts = hw.alarmFacts(settings);
  const chain = hw.evidenceChain(settings.base, [{ ...settings, fired: true }, { ...hw.SECOND_DETECTOR, fired: true }]);
  // the alarmed connections that the sandbox confirms: expected, rounded for the words
  const confirmed = [facts.expected[0] * hw.SECOND_DETECTOR.sensitivity, facts.expected[2] * hw.SECOND_DETECTOR.fpr];
  return { settings, facts, chain, confirmed };
}

/** The two orders of the same evidence: the posterior does not depend on it. */
function alarmChains() {
  const first = { ...hw.ALARM_DEFAULT, fired: true, key: 'ids' };
  const second = { ...hw.SECOND_DETECTOR, fired: true, key: 'sandbox' };
  return { forward: hw.evidenceChain(hw.ALARM_DEFAULT.base, [first, second]), backward: hw.evidenceChain(hw.ALARM_DEFAULT.base, [second, first]) };
}

// ---------------------------------------------------------------------------
// 1.3 La rete bayesiana
// ---------------------------------------------------------------------------

/** The posteriors of the three hidden nodes along the story of NETWORK_STEPS. */
const networkRows = () => hw.NETWORK_STEPS.map((evidence) => ({ evidence, ...hw.networkPosterior(evidence) }));

/** The chart of section 1.3: one group of bars per step (labels: their short names), one bar per hidden node. */
function networkChart(rows, labels, decimal = '.') {
  return {
    categories: labels,
    series: hw.HIDDEN.map((node, k) => ({ values: rows.map((r) => r[node]), colorIndex: [0, 1, 4][k] })),
    yMax: 1,
    yTicks: percentTicks(0, 1, 0.25),
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The evidence of "Try it" as the page opens: every clue unknown. */
const NETWORK_TRY_DEFAULT = Object.freeze({ edr: null, login: null, signature: null });

/** The places of the nodes in the drawing of the network, in a 100 x 60 box. */
const NETWORK_LAYOUT = Object.freeze({
  phishing: Object.freeze({ x: 22, y: 10 }),
  exploit: Object.freeze({ x: 78, y: 10 }),
  compromise: Object.freeze({ x: 50, y: 32 }),
  login: Object.freeze({ x: 13, y: 52 }),
  edr: Object.freeze({ x: 50, y: 52 }),
  signature: Object.freeze({ x: 87, y: 52 }),
});
/** The arrows of the network: parent -> child. */
const NETWORK_EDGES = Object.freeze([['phishing', 'compromise'], ['exploit', 'compromise'], ['phishing', 'login'], ['compromise', 'edr'], ['exploit', 'signature']]);
/** The drawing of the network: its width in its own units (viewBox 0 0 100 64) and the size of a node. */
const NETWORK_VIEW = Object.freeze({ width: 100, box: Object.freeze({ w: 22, h: 12 }) });

/** The map of implications of "Try it: the map": the centre of every mode in the drawing (viewBox 0 0 104 60) and the size of its box. */
const MAP_LAYOUT = Object.freeze({
  as: Object.freeze({ x: 18, y: 12 }),
  l2: Object.freeze({ x: 18, y: 48 }),
  probability: Object.freeze({ x: 52, y: 30 }),
  distribution: Object.freeze({ x: 86, y: 30 }),
});
const MAP_VIEW = Object.freeze({ width: 104, box: Object.freeze({ w: 28, h: 12 }) });

/**
 * The box of a drawing (the network, the map) under the point (x, y), in
 * CSS pixels of a drawing `width` pixels wide: { key, rect } with the
 * rectangle to outline, or null. The drawings keep their proportions, so
 * one scale serves both axes.
 */
function diagramHit(layout, viewBox, width, x, y) {
  const k = width / viewBox.width;
  const { w, h } = viewBox.box;
  const key = Object.keys(layout).find((name) => Math.abs(x / k - layout[name].x) <= w / 2 && Math.abs(y / k - layout[name].y) <= h / 2);
  if (!key) return null;
  return { key, rect: { x: (layout[key].x - w / 2) * k, y: (layout[key].y - h / 2) * k, width: w * k, height: h * k } };
}

// ---------------------------------------------------------------------------
// 1.4 Il test di Wald
// ---------------------------------------------------------------------------

/** Two example addresses, written by hand: a user who mistypes once, then gets in; an attacker who keeps failing. */
const SPRT_EXAMPLES = Object.freeze({ legit: Object.freeze([true, false, false]), attacker: Object.freeze([true, true, true, true, true]) });

/** The chart of the log-likelihood ratio: one line per walk, the two thresholds dashed. */
function sprtChart(setup, walks, decimal = '.') {
  const longest = Math.max(1, ...walks.map((w) => w.llr.length - 1));
  const x = Array.from({ length: longest + 1 }, (_, i) => i);
  const top = Math.max(setup.upper, ...walks.flatMap((w) => w.llr)) + 1;
  const bottom = Math.min(setup.lower, ...walks.flatMap((w) => w.llr)) - 1;
  return {
    x,
    series: [
      ...walks.map((w, k) => ({ values: x.map((i) => (i < w.llr.length ? w.llr[i] : null)), colorIndex: w.color ?? k })),
      { values: x.map(() => setup.upper), colorIndex: 1, dashed: true, fixed: true },
      { values: x.map(() => setup.lower), colorIndex: 2, dashed: true, fixed: true },
    ],
    yMin: Math.floor(bottom),
    yMax: Math.ceil(top),
    yTicks: hw.niceTicks(Math.floor(bottom), Math.ceil(top), 6),
    xTicks: hw.niceTicks(0, longest, Math.min(8, longest + 1)).filter((v) => Number.isInteger(v)),
    decimal,
  };
}

/** The address of "Try it" as the page opens: no attempt yet, alpha 1 in 1,000. */
const SPRT_TRY_DEFAULT = Object.freeze({ attempts: Object.freeze([]), alpha: hw.SPRT_ALPHAS.indexOf(hw.SPRT_DEFAULT.alpha), draws: 0 });

/** The posterior probability of an attacker from a log-likelihood ratio and prior odds of 1 (one address in two). */
const sprtPosterior = (llr) => hw.sigmoid(llr);

// ---------------------------------------------------------------------------
// 1.5 Il tasso del phishing
// ---------------------------------------------------------------------------

/** The campaign of the page and its posteriors, day after day, under two priors. */
function campaignFacts(seed = hw.DEFAULT_SEED, { rate = hw.CAMPAIGN.rate, perDay = hw.CAMPAIGN.perDay } = {}) {
  const days = hw.campaign(seed, { days: hw.CAMPAIGN.days, perDay, rate });
  const uniform = hw.campaignPosteriors(days, hw.PRIORS.uniform);
  const informed = hw.campaignPosteriors(days, hw.PRIORS.informed);
  return { days, rate, perDay, uniform, informed, aboveUniform: uniform.map((r) => r.above(hw.TARGET_RATE)), aboveInformed: informed.map((r) => r.above(hw.TARGET_RATE)) };
}

/** The chart of section 1.5: the posterior mean of each analyst, day by day, with its 95% interval as a band; the true rate dashed. */
function campaignChart(c, decimal = '.') {
  const x = c.uniform.map((r) => r.day);
  return {
    x,
    series: [
      { values: c.uniform.map((r) => r.mean), band: c.uniform.map((r) => [r.lo, r.hi]), colorIndex: 0 },
      { values: c.informed.map((r) => r.mean), band: c.informed.map((r) => [r.lo, r.hi]), colorIndex: 1 },
      { values: x.map(() => c.rate ?? hw.CAMPAIGN.rate), colorIndex: 6, dashed: true, fixed: true },
    ],
    yMin: 0,
    yMax: 0.6,
    yTicks: percentTicks(0, 0.6, 0.1),
    xTicks: x,
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** Prior, likelihood and posterior densities on the grid of the rates. */
function densityChart({ prior, likelihood, posterior }, decimal = '.', top = null) {
  const visible = [...prior, ...likelihood, ...posterior].filter(Number.isFinite);
  const max = top ?? Math.max(1, ...visible) * 1.08;
  return {
    x: hw.GRID,
    series: [
      { values: prior.map((v) => (Number.isFinite(v) ? v : null)), colorIndex: 6, dashed: true },
      { values: likelihood, colorIndex: 3, dotted: true },
      { values: posterior, colorIndex: 0, dots: false },
    ],
    yMin: 0,
    yMax: max,
    yTicks: hw.niceTicks(0, max / 1.08, 4),
    xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
    decimal,
  };
}

/** The data of "Try it: belief": the prior chosen, and the e-mails seen so far. */
const BELIEF_TRY_DEFAULT = Object.freeze({ prior: 'uniform', clicks: 0, sent: 0, draws: 0 });

/** Prior, likelihood and posterior of "Try it: belief", on the grid. */
function beliefCurves(state) {
  const [a, b] = hw.PRIORS[state.prior];
  const prior = hw.GRID.map((x) => hw.betaDensity(x, a, b));
  const finite = prior.map((v) => (Number.isFinite(v) ? v : null));
  const post = hw.betaPosterior([a, b], state.clicks, state.sent);
  const posterior = hw.GRID.map((x) => {
    const v = hw.betaDensity(x, post.a, post.b);
    return Number.isFinite(v) ? v : null;
  });
  const likelihood = state.sent > 0 ? hw.GRID.map((x) => hw.betaDensity(x, state.clicks + 1, state.sent - state.clicks + 1)) : hw.GRID.map(() => null);
  return { prior: finite, likelihood, posterior, post };
}

/** The e-mails of "+ 10 e-mails": the stream 'live', one repetition per press, at the true rate. */
function moreEmails(draw, count = 10) {
  const next = hw.generator(hw.DEFAULT_SEED, 'live', draw);
  let clicks = 0;
  for (let i = 0; i < count; i++) clicks += hw.bernoulli(next, hw.CAMPAIGN.rate);
  return clicks;
}

/** "Try it: draw the prior": the shape of the handles and the data chosen (the first day, the first three, all ten). */
const PRIOR_TRY_DEFAULT = Object.freeze({ shape: 'informed', data: 'day1' });
const PRIOR_DATA = Object.freeze(['day1', 'days3', 'days10']);
function priorData(key, seed = hw.DEFAULT_SEED) {
  const days = hw.campaign(seed);
  const take = typeof key === 'number' ? key : { day1: 1, days3: 3, days10: 10 }[key];
  const chosen = days.slice(0, take);
  return { clicks: chosen.reduce((s, d) => s + d.clicks, 0), sent: chosen.reduce((s, d) => s + d.sent, 0) };
}

// ---------------------------------------------------------------------------
// 1.6 Bayes e frequentisti
// ---------------------------------------------------------------------------

/** The chart of section 1.6: the exact coverage of every method against the true rate, with the 95% line. */
function coverageChart(cov, decimal = '.') {
  return {
    x: cov.ps,
    series: [...hw.INTERVAL_METHODS.map((m, k) => ({ values: cov.curves[m], colorIndex: [1, 3, 4, 0][k], dots: false })), { values: cov.ps.map(() => 0.95), colorIndex: 6, dashed: true, fixed: true }],
    yMin: 0.6,
    yMax: 1,
    yTicks: percentTicks(0.6, 1, 0.1),
    xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 1.7 e 1.8 I due filtri
// ---------------------------------------------------------------------------

/** The chart of section 1.7: the test messages by their log-odds, spam and legitimate side by side. */
function logOddsChart(sms, decimal = '.') {
  const top = Math.max(1, ...sms.bins.flatMap((b) => [b.spam, b.ham]));
  return {
    categories: sms.bins.map((b) => (b.to === Infinity ? `≥ ${b.from}` : `${b.from}`)),
    series: [{ values: sms.bins.map((b) => b.spam), colorIndex: 1 }, { values: sms.bins.map((b) => b.ham), colorIndex: 0 }],
    yMax: top * 1.08,
    yTicks: hw.niceTicks(0, top, 5),
    decimal,
  };
}

/** The message of the field of section 1.7 as the page opens: a phishing written for the page, not in the corpus. */
const SPAM_EXAMPLE = 'Your account has been suspended, verify your password at this link';
/** The two inboxes of the field: the share of spam of the training set, and an inbox where 1 message in 100 is spam. */
const SPAM_BASES = Object.freeze(['train', 'one']);
const spamPrior = (key, sms) => (key === 'one' ? Math.log(1 / 99) : sms.model.priorLogOdds);

/** The connection of section 1.8 as the page opens, as positions in the lists of the levels. */
const KDD_TRY_DEFAULT = Object.freeze({
  protocol: hw.KDD_LEVELS.protocol.indexOf(hw.KDD_EXAMPLE.protocol),
  service: hw.KDD_LEVELS.service.indexOf(hw.KDD_EXAMPLE.service),
  flag: hw.KDD_LEVELS.flag.indexOf(hw.KDD_EXAMPLE.flag),
});

// ---------------------------------------------------------------------------
// 2.1 - 2.3 In probabilita', quasi certa, in media quadratica
// ---------------------------------------------------------------------------

/** The chart of section 2.1: at every checkpoint, the share of the 1,000 paths outside the band and its exact probability, with Chebyshev's bound. */
function outsideChart(paths, decimal = '.') {
  const x = paths.checks.map((c) => c.n);
  return {
    x,
    logX: true,
    series: [
      { values: paths.checks.map((c) => c.outside), colorIndex: 0, dotsOnly: true },
      { values: paths.checks.map((c) => c.exactOutside), colorIndex: 1, dots: false },
      { values: x.map((n) => hw.deviationBounds(n, paths.rate, paths.epsilon).chebyshev), colorIndex: 6, dashed: true },
    ],
    yMin: 0,
    yMax: 1,
    yTicks: percentTicks(0, 1, 0.25),
    xTicks: [10, 100, 1000, 10000],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The chart of section 2.2: 20 of the paths, with the band of 1 point around 3%. */
function pathsChart(paths, decimal = '.') {
  const x = paths.points;
  return {
    x,
    logX: true,
    series: [
      ...paths.paths.map((line) => ({ values: line, colorIndex: 0, dots: false })),
      { values: x.map(() => paths.rate + paths.epsilon), colorIndex: 1, dashed: true, fixed: true },
      { values: x.map(() => paths.rate - paths.epsilon), colorIndex: 1, dashed: true, fixed: true },
    ],
    yMin: 0,
    yMax: 0.15,
    yTicks: percentTicks(0, 0.15, 0.05),
    xTicks: [1, 10, 100, 1000, 10000],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The second chart of section 2.2: outside the band at n, against leaving it at least once more after n. */
function afterChart(paths, decimal = '.') {
  return {
    x: paths.checks.map((c) => c.n),
    logX: true,
    series: [{ values: paths.checks.map((c) => c.outside), colorIndex: 0 }, { values: paths.checks.map((c) => c.after), colorIndex: 4 }],
    yMin: 0,
    yMax: 1,
    yTicks: percentTicks(0, 1, 0.25),
    xTicks: [10, 100, 1000, 10000],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The chart of section 2.3: the mean square error of the 1,000 estimates against p(1 - p)/n, on logarithmic axes. */
function mseChart(paths, decimal = '.') {
  return {
    x: paths.checks.map((c) => c.n),
    logX: true,
    logY: true,
    series: [{ values: paths.checks.map((c) => c.mse), colorIndex: 0, dotsOnly: true }, { values: paths.checks.map((c) => c.exactMse), colorIndex: 1, dots: false }],
    yMin: 1e-6,
    yMax: 1e-2,
    yTicks: powers(-6, -2),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

/** The sequence of "Try it" as the page opens, and the checkpoints of its table: odd ones for (-1)^n Z, which is equal to Z at every even n. */
const SEQUENCE_TRY_DEFAULT = Object.freeze({ key: 'bern1', draw: 0 });
const SEQUENCE_TABLE_N = Object.freeze([10, 100, 1000, 10000]);
const sequenceTableN = (key) => (key === 'flip' ? [11, 101, 1001, 10001] : SEQUENCE_TABLE_N);

/** The paths of a sequence as a chart: a range that fits the sequence. */
function sequenceChart(result, decimal = '.') {
  const ranges = { mean: [-0.5, 0.5], bern1: [0, 1.1], bern2: [0, 1.1], typewriter: [0, 1.1], flip: [-3, 3] };
  const top = Math.max(10, ...result.paths.flat());
  const [yMin, yMax] = ranges[result.key] || [0, top * 1.05];
  return {
    x: result.points,
    logX: true,
    series: result.paths.map((line, k) => ({ values: line, colorIndex: k % 7, dots: result.key !== 'mean' && result.key !== 'flip' })),
    yMin,
    yMax,
    yTicks: hw.niceTicks(yMin, yMax, 5),
    xTicks: [1, 10, 100, 1000],
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 2.4 In distribuzione
// ---------------------------------------------------------------------------

/** The chart of section 2.4: the exact Kolmogorov distance from the normal law of the two sums, and their Berry-Esseen bounds, on logarithmic axes. */
function cltChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.n),
    logX: true,
    logY: true,
    series: [
      { values: rows.map((r) => r.bernoulli), colorIndex: 1 },
      { values: rows.map((r) => r.bernoulliBound), colorIndex: 1, dashed: true },
      { values: rows.map((r) => r.exponential), colorIndex: 0 },
      { values: rows.map((r) => r.exponentialBound), colorIndex: 0, dashed: true },
    ],
    yMin: 1e-3,
    yMax: 1,
    yTicks: powers(-3, 0),
    xTicks: [1, 10, 100, 1000],
    decimal,
  };
}

/** "Try it: CLT": the law, n, and the batch of sums (stream 'live', repetitions from 10^6 up). */
const CLT_TRY_DEFAULT = Object.freeze({ law: 'exponential', n: 5, draw: 0 });
const CLT_TRY_SIZES = Object.freeze([1, 2, 5, 10, 30, 100]);
const CLT_TRY_REPS = 5000;

/** The sums of "Try it", their histogram against the limit density, and the test of Kolmogorov-Smirnov. */
function cltTry(state, decimal = '.') {
  const values = hw.standardizedSums(state.law, state.n, CLT_TRY_REPS, hw.DEFAULT_SEED, { stream: 'live', offset: 1000000 + state.draw * CLT_TRY_REPS });
  const cauchy = state.law === 'cauchy';
  const h = hw.histogram(values, -4, 4, 40);
  const density = cauchy ? (x) => 1 / (Math.PI * (1 + x * x)) : hw.phi;
  const curve = Array.from({ length: 161 }, (_, i) => {
    const x = -4 + i * 0.05;
    return [x, density(x)];
  });
  const test = hw.ksTest(values, cauchy ? hw.cauchyCdf : hw.normalCdf);
  return {
    chart: { x0: -4, x1: 4, bars: h.bars, curve, xTicks: [-4, -2, 0, 2, 4], decimal },
    outside: h.outside,
    test,
    cauchy,
  };
}

/** "Try it: hash collisions": the size of the identifiers, how many of them (as a multiple of the median), the trials run. */
const HASH_TRY_DEFAULT = Object.freeze({ bits: 16, factor: 1, trials: 0, hits: 0, history: Object.freeze([]) });
const HASH_FACTORS = Object.freeze([0.5, 1, 2]);
/** The number of identifiers of "Try it": a multiple of the median, rounded. */
const hashCount = (bits, factor) => Math.max(2, Math.round(hw.collisionMedian(bits) * factor));

/** The trial counts where "Try it: hash" records its estimate: ten per decade from 10 on, so the path shows from the first batch. */
const hashGrid = (to) => {
  const out = [];
  for (let j = 0; ; j++) {
    const t = Math.round(10 ** (1 + j / 10));
    if (t > to) return out;
    if (out[out.length - 1] !== t) out.push(t);
  }
};

/**
 * `count` more trials for "Try it: hash", from the stream 'hash' after the
 * ones of the test (repetitions from 10^6): the run { trials, hits,
 * history } with the estimate recorded at every point of the grid passed,
 * and at the end.
 */
function hashMore(run, bits, m, count, seed = hw.DEFAULT_SEED) {
  let { trials, hits } = run;
  const history = [...run.history];
  const stops = hashGrid(trials + count).filter((t) => t > trials);
  if (stops[stops.length - 1] !== trials + count) stops.push(trials + count);
  for (const t of stops) {
    hits += hw.collisionRun(bits, m, t - trials, seed, 1000000 + trials);
    trials = t;
    history.push({ trials, hits });
  }
  return { trials, hits, history };
}

/**
 * The chart of "Try it: hash": the exact probability with the band of the
 * central limit around it, on the whole axis from the start (up to 10^4
 * trials, then to the next power of ten), and the estimate where it was
 * recorded.
 */
function hashChart(state, exact, decimal = '.') {
  const last = state.history.length ? state.history[state.history.length - 1].trials : 0;
  const decades = Math.max(4, Math.ceil(Math.log10(Math.max(10, last))));
  const at = new Map(state.history.map((h) => [h.trials, h.hits / h.trials]));
  const x = [...new Set([...hashGrid(10 ** decades), ...at.keys()])].sort((a, b) => a - b);
  const half = (r) => 1.96 * Math.sqrt((exact * (1 - exact)) / r);
  return {
    x,
    logX: true,
    series: [
      { values: x.map((t) => (at.has(t) ? at.get(t) : null)), colorIndex: 0, dots: false },
      { values: x.map(() => exact), band: x.map((r) => [Math.max(0, exact - half(r)), Math.min(1, exact + half(r))]), colorIndex: 1, dashed: true },
    ],
    yMin: 0,
    yMax: 1,
    yTicks: percentTicks(0, 1, 0.25),
    xTicks: powers(1, decades),
    yFormat: pctLabel(decimal),
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 2.6 - 2.8 Code pesanti, velocita', il posterior che converge
// ---------------------------------------------------------------------------

/** The chart of section 2.6: eight running means of Cauchy values, which never settle. */
function cauchyChart(paths, decimal = '.') {
  return {
    x: hw.PATH_POINTS,
    logX: true,
    series: paths.map((line, k) => ({ values: line, colorIndex: k % 7, dots: false })),
    yMin: -6,
    yMax: 6,
    yTicks: [-6, -3, 0, 3, 6],
    xTicks: [1, 10, 100, 1000, 10000],
    decimal,
  };
}

/** The histogram of the standardized means of 1,000 connections against the normal density. */
function bytesChart(b, decimal = '.') {
  const curve = Array.from({ length: 241 }, (_, i) => {
    const x = -3 + i * 0.05;
    return [x, hw.phi(x)];
  });
  return { x0: -3, x1: 9, bars: b.histogram.bars, curve, xTicks: [-3, 0, 3, 6, 9], decimal };
}

/** The chart of section 2.7: the exact probability of a deviation, the two bounds and the normal approximation, on logarithmic axes. */
function speedChart(rows, decimal = '.') {
  const clip = (v) => Math.max(1e-12, v);
  return {
    x: rows.map((r) => r.n),
    logX: true,
    logY: true,
    series: [
      { values: rows.map((r) => clip(r.exact)), colorIndex: 1 },
      { values: rows.map((r) => r.chebyshev), colorIndex: 6, dashed: true },
      { values: rows.map((r) => r.hoeffding), colorIndex: 4, dashed: true },
      { values: rows.map((r) => clip(r.normal)), colorIndex: 0, dotted: true },
    ],
    yMin: 1e-12,
    yMax: 1,
    yTicks: [1e-12, 1e-9, 1e-6, 1e-3, 1],
    xTicks: [10, 100, 1000, 10000, 100000],
    decimal,
  };
}

/** The first chart of section 2.8: the posterior mean of the two analysts against the number of e-mails, with the true rate. */
function bvmChart(rows, decimal = '.') {
  const x = rows.map((r) => r.n);
  return {
    x,
    logX: true,
    series: [
      { values: rows.map((r) => r.uniform.mean), band: rows.map((r) => [r.uniform.mean - 1.96 * r.uniform.sd, r.uniform.mean + 1.96 * r.uniform.sd]), colorIndex: 0 },
      { values: rows.map((r) => r.wrong.mean), band: rows.map((r) => [r.wrong.mean - 1.96 * r.wrong.sd, r.wrong.mean + 1.96 * r.wrong.sd]), colorIndex: 1 },
      { values: x.map(() => (rows[0] && rows[0].rate) ?? hw.BVM.rate), colorIndex: 6, dashed: true, fixed: true },
    ],
    yMin: 0,
    yMax: 0.5,
    yTicks: percentTicks(0, 0.5, 0.1),
    xTicks: [10, 100, 1000, 10000],
    yFormat: pctLabel(decimal),
    decimal,
  };
}

/** The second chart of section 2.8: the distance of each posterior from its normal approximation, on logarithmic axes. */
function bvmDistanceChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.n),
    logX: true,
    logY: true,
    series: [{ values: rows.map((r) => r.uniform.distance), colorIndex: 0 }, { values: rows.map((r) => r.wrong.distance), colorIndex: 1 }],
    yMin: 1e-3,
    yMax: 1,
    yTicks: powers(-3, 0),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 1.7 - 1.9 Altri risultati, radice di n, la dipendenza
// ---------------------------------------------------------------------------

/** The rows of section 1.7: for every n, the exact distance from the normal law of Z (sigma known), of the t statistic (sigma estimated) and of the MLE of an exponential rate. */
const resultsRows = (p = hw.FALSE_ALARMS.rate) => hw.RESULT_SIZES.map((n) => ({ n, z: hw.ksExactBernoulli(n, p), t: hw.ksExactT(n, p), mle: hw.mleRate(n) }));

/** The chart of section 1.7: the three distances on logarithmic axes. */
function resultsChart(rows, decimal = '.') {
  return {
    x: rows.map((r) => r.n),
    logX: true,
    logY: true,
    series: [{ values: rows.map((r) => r.z), colorIndex: 0 }, { values: rows.map((r) => r.t), colorIndex: 1 }, { values: rows.map((r) => r.mle.distance), colorIndex: 2 }],
    yMin: 1e-3,
    yMax: 1,
    yTicks: powers(-3, 0),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

/** The chart of section 1.8: the spread of the count grows as sqrt(n), the one of the share falls as 1/sqrt(n); simulated (from the 1,000 paths) and exact. */
function rootChart(paths, decimal = '.') {
  const sigma = Math.sqrt(paths.rate * (1 - paths.rate));
  const x = paths.checks.map((c) => c.n);
  return {
    x,
    logX: true,
    logY: true,
    series: [
      { values: paths.checks.map((c) => c.n * Math.sqrt(c.mse)), colorIndex: 0, dotsOnly: true },
      { values: x.map((n) => sigma * Math.sqrt(n)), colorIndex: 0, dots: false },
      { values: paths.checks.map((c) => Math.sqrt(c.mse)), colorIndex: 1, dotsOnly: true },
      { values: x.map((n) => sigma / Math.sqrt(n)), colorIndex: 1, dots: false },
    ],
    yMin: 1e-3,
    yMax: 100,
    yTicks: powers(-3, 2),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

/** "Try it: the right scale": alpha as the page opens (1/2, the scale of the central limit). */
const SCALE_TRY_DEFAULT = Object.freeze({ alpha: hw.SCALE_ALPHAS.indexOf(0.5) });

/** The histograms of n^alpha (mean - 1) for the three sizes, on the same axis, against the normal density of the limit at alpha = 1/2. */
function scaleCharts(samples, alpha, decimal = '.') {
  const curve = Array.from({ length: 161 }, (_, i) => {
    const x = -4 + i * 0.05;
    return [x, hw.phi(x)];
  });
  return samples.map(({ n, values }) => {
    const factor = n ** (alpha - 0.5);
    const scaled = Array.from(values, (v) => v * factor);
    const h = hw.histogram(scaled, -4, 4, 40);
    return { n, factor, outside: h.outside, chart: { x0: -4, x1: 4, bars: h.bars, curve, yMax: 1, xTicks: [-4, -2, 0, 2, 4], decimal } };
  });
}

/** "Try it: bursts": the correlation as the page opens (0.5). */
const BURST_TRY_DEFAULT = Object.freeze({ rho: hw.BURST_RHOS.indexOf(0.5) });
const BURST_N = Object.freeze([10, 30, 100, 300, 1000, 3000, 10000]);
/** The connections drawn in the two strips of "Try it": 400, 12 alarms on average. */
const BURST_STRIP = 400;
/** A strip of "Try it: alarms in bursts" as a chart (drawStrip): 50 connections per row, red where there is an alarm. */
const stripChart = (cells) => ({ cells, perRow: 50, colorIndex: 1 });

/** The chart of the bursts: the exact standard error of the share of alarms, independent and with correlation rho. */
function burstChart(rho, decimal = '.') {
  const p = hw.FALSE_ALARMS.rate;
  return {
    x: BURST_N,
    logX: true,
    logY: true,
    series: [
      { values: BURST_N.map((n) => Math.sqrt((p * (1 - p)) / n)), colorIndex: 0 },
      { values: BURST_N.map((n) => Math.sqrt(hw.burstVariance(n, p, rho)) / n), colorIndex: 1 },
    ],
    yMin: 1e-3,
    yMax: 1,
    yTicks: powers(-3, 0),
    xTicks: [10, 100, 1000, 10000],
    decimal,
  };
}

// ---------------------------------------------------------------------------
// 2.1 e 2.2 La probabilita' condizionata e la verosimiglianza
// ---------------------------------------------------------------------------

/** "Try it: p-value": the indices of the sliders as the page opens. */
const DISCOVERY_TRY_DEFAULT = Object.freeze({
  real: hw.DISCOVERY_REALS.indexOf(hw.DISCOVERY_DEFAULT.real),
  power: hw.DISCOVERY_POWERS.indexOf(hw.DISCOVERY_DEFAULT.power),
  alpha: hw.DISCOVERY_ALPHAS.indexOf(hw.DISCOVERY_DEFAULT.alpha),
});
const DISCOVERY_CATEGORIES = Object.freeze(['trueDiscovery', 'missedEffect', 'falseDiscovery', 'trueNull']);
const DISCOVERY_COLORS = Object.freeze([2, 4, 1, 6]);
/** The picture of the 1,000 tests. */
const discoveryIcons = (facts) => ({ counts: facts.counts, total: facts.total, columns: 50, colors: DISCOVERY_COLORS, faint: [3] });

/** The likelihood of the share of clicks after the first day and after ten days, scaled to a maximum of 1. */
function likelihoodChart(seed = hw.DEFAULT_SEED, decimal = '.', days = 10) {
  const day1 = priorData('day1', seed);
  const days10 = priorData(days, seed);
  const a = hw.likelihoodCurve(day1.clicks, day1.sent);
  const b = hw.likelihoodCurve(days10.clicks, days10.sent);
  return {
    curves: { day1: a, days10: b, days, data: { day1, days10 } },
    chart: {
      x: hw.GRID,
      series: [{ values: a.values, colorIndex: 3, dots: false }, { values: b.values, colorIndex: 0, dots: false }],
      yMin: 0,
      yMax: 1.05,
      yTicks: [0, 0.25, 0.5, 0.75, 1],
      xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
      decimal,
    },
  };
}

// ---------------------------------------------------------------------------
// Legende, etichette sotto il puntatore e tabelle legate
// ---------------------------------------------------------------------------

/** The legends of the charts: { label, color | paletteKey, dashed?, box?, parts } for every item (ChartLegend.jsx). */
const legends = {
  alarm: (L) => ALARM_CATEGORIES.map((c, k) => ({ label: L[c], color: ALARM_COLORS[k], box: true, parts: [`cat:${k}`] })),
  network: (L) => hw.HIDDEN.map((node, k) => ({ label: L[node], color: [0, 1, 4][k], box: true, parts: [`series:${k}`] })),
  sprt: (L, walks) => [
    ...walks.map((w, k) => ({ label: L[w.key], color: w.color ?? k, parts: [`series:${k}`] })),
    { label: L.block, color: 1, dashed: true, parts: [`series:${walks.length}`] },
    { label: L.clear, color: 2, dashed: true, parts: [`series:${walks.length + 1}`] },
  ],
  campaign: (L) => [
    { label: L.uniformPrior, color: 0, parts: ['series:0'] },
    { label: L.informedPrior, color: 1, parts: ['series:1'] },
    { label: L.trueRate, color: 6, dashed: true, parts: ['series:2'] },
  ],
  density: (L) => [
    { label: L.prior, color: 6, dashed: true, parts: ['series:0'] },
    { label: L.likelihood, color: 3, dashed: true, parts: ['series:1'] },
    { label: L.posterior, color: 0, parts: ['series:2'] },
  ],
  coverage: (L) => [...hw.INTERVAL_METHODS.map((m, k) => ({ label: L[m], color: [1, 3, 4, 0][k], parts: [`series:${k}`] })), { label: L.nominal, color: 6, dashed: true, parts: ['series:4'] }],
  logOdds: (L) => [
    { label: L.spam, color: 1, box: true, parts: ['series:0'] },
    { label: L.ham, color: 0, box: true, parts: ['series:1'] },
  ],
  outside: (L) => [
    { label: L.simulated, color: 0, box: true, parts: ['series:0'] },
    { label: L.exact, color: 1, parts: ['series:1'] },
    { label: L.chebyshev, color: 6, dashed: true, parts: ['series:2'] },
  ],
  paths: (L) => [
    { label: L.paths, color: 0, parts: Array.from({ length: hw.PATHS.shown }, (_, k) => `series:${k}`) },
    { label: L.band, color: 1, dashed: true, parts: [`series:${hw.PATHS.shown}`, `series:${hw.PATHS.shown + 1}`] },
  ],
  after: (L) => [
    { label: L.outsideAt, color: 0, parts: ['series:0'] },
    { label: L.outsideAfter, color: 4, parts: ['series:1'] },
  ],
  mse: (L) => [
    { label: L.simulatedMse, color: 0, box: true, parts: ['series:0'] },
    { label: L.exactMse, color: 1, parts: ['series:1'] },
  ],
  clt: (L) => [
    { label: L.bernoulli, color: 1, parts: ['series:0'] },
    { label: L.bernoulliBound, color: 1, dashed: true, parts: ['series:1'] },
    { label: L.exponential, color: 0, parts: ['series:2'] },
    { label: L.exponentialBound, color: 0, dashed: true, parts: ['series:3'] },
  ],
  cltTry: (L, cauchy) => [
    { label: L.sums, color: 0, box: true, parts: ['bars'] },
    { label: cauchy ? L.cauchyDensity : L.normalDensity, color: 2, parts: ['curve'] },
  ],
  hash: (L) => [
    { label: L.estimate, color: 0, parts: ['series:0'] },
    { label: L.exactBand, color: 1, dashed: true, parts: ['series:1'] },
  ],
  bytes: (L) => [
    { label: L.means, color: 0, box: true, parts: ['bars'] },
    { label: L.normalDensity, color: 2, parts: ['curve'] },
  ],
  speed: (L) => [
    { label: L.exact, color: 1, parts: ['series:0'] },
    { label: L.chebyshev, color: 6, dashed: true, parts: ['series:1'] },
    { label: L.hoeffding, color: 4, dashed: true, parts: ['series:2'] },
    { label: L.normal, color: 0, dashed: true, parts: ['series:3'] },
  ],
  bvm: (L) => [
    { label: L.uniformPrior, color: 0, parts: ['series:0'] },
    { label: L.wrongPrior, color: 1, parts: ['series:1'] },
    { label: L.trueRate, color: 6, dashed: true, parts: ['series:2'] },
  ],
  bvmDistance: (L) => [
    { label: L.uniformPrior, color: 0, parts: ['series:0'] },
    { label: L.wrongPrior, color: 1, parts: ['series:1'] },
  ],
  results: (L) => [
    { label: L.zKnown, color: 0, parts: ['series:0'] },
    { label: L.tEstimated, color: 1, parts: ['series:1'] },
    { label: L.mle, color: 2, parts: ['series:2'] },
  ],
  root: (L) => [
    { label: L.countSpread, color: 0, parts: ['series:0', 'series:1'] },
    { label: L.shareSpread, color: 1, parts: ['series:2', 'series:3'] },
  ],
  scale: (L) => [
    { label: L.scaled, color: 0, box: true, parts: ['bars'] },
    { label: L.normalDensity, color: 2, parts: ['curve'] },
  ],
  burst: (L) => [
    { label: L.independent, color: 0, parts: ['series:0'] },
    { label: L.correlated, color: 1, parts: ['series:1'] },
  ],
  discovery: (L) => DISCOVERY_CATEGORIES.map((c, k) => ({ label: L[c], color: DISCOVERY_COLORS[k], box: true, parts: [`cat:${k}`] })),
  likelihood: (L, days = 10) => [
    { label: L.day1, color: 3, parts: ['series:0'] },
    { label: days === 10 ? L.days10 : L.afterDays(days), color: 0, parts: ['series:1'] },
  ],
};

const seriesOn = (hidden, i) => !hidden.includes(`series:${i}`);
/** A value when its part is on screen, null otherwise: the label leaves out what the legend hides. */
const shown = (hidden, i, v) => (seriesOn(hidden, i) ? v : null);

/** The labels under the pointer, one factory per chart: (hit, hidden) => text, leaving out the hidden parts. */
const tips = {
  alarm: (facts, T) => (hit) => T.alarm(hit.index, facts.counts[hit.index], facts.counts[hit.index] / facts.population),
  network: (rows, T) => (hit, hidden = []) => T.network(hit.index, hw.HIDDEN.map((node, k) => shown(hidden, k, rows[hit.index][node]))),
  sprt: (setup, walks, T) => (hit, hidden = []) => T.sprt(hit.index, walks.map((w, k) => shown(hidden, k, hit.index < w.llr.length ? w.llr[hit.index] : null)), seriesOn(hidden, walks.length) ? setup.upper : null, seriesOn(hidden, walks.length + 1) ? setup.lower : null, walks.map((w) => w.key)),
  campaign: (c, T) => (hit, hidden = []) => T.campaign(c.uniform[hit.index], shown(hidden, 0, c.uniform[hit.index]), shown(hidden, 1, c.informed[hit.index]), seriesOn(hidden, 2)),
  density: (curves, T) => (hit, hidden = []) => T.density(hw.GRID[hit.index], shown(hidden, 0, curves.prior[hit.index]), shown(hidden, 1, curves.likelihood[hit.index]), shown(hidden, 2, curves.posterior[hit.index])),
  coverage: (cov, T) => (hit, hidden = []) => T.coverage(cov.ps[hit.index], hw.INTERVAL_METHODS.map((m, k) => shown(hidden, k, cov.curves[m][hit.index]))),
  logOdds: (sms, T) => (hit, hidden = []) => T.logOdds(sms.bins[hit.index], shown(hidden, 0, sms.bins[hit.index].spam), shown(hidden, 1, sms.bins[hit.index].ham)),
  outside: (paths, T) => (hit, hidden = []) => {
    const c = paths.checks[hit.index];
    return T.outside(c.n, shown(hidden, 0, c.outside), shown(hidden, 1, c.exactOutside), shown(hidden, 2, hw.deviationBounds(c.n, paths.rate, paths.epsilon).chebyshev));
  },
  paths: (paths, T) => (hit, hidden = []) => {
    if (!seriesOn(hidden, 0)) return null;
    const values = paths.paths.map((line) => line[hit.index]);
    return T.paths(paths.points[hit.index], Math.min(...values), Math.max(...values), values.filter((v) => Math.abs(v - paths.rate) > paths.epsilon).length, values.length);
  },
  after: (paths, T) => (hit, hidden = []) => {
    const c = paths.checks[hit.index];
    return T.after(c.n, shown(hidden, 0, c.outside), shown(hidden, 1, c.after));
  },
  mse: (paths, T) => (hit, hidden = []) => {
    const c = paths.checks[hit.index];
    return T.mse(c.n, shown(hidden, 0, c.mse), shown(hidden, 1, c.exactMse));
  },
  sequence: (result, T) => (hit) => T.sequence(result.points[hit.index], result.paths.map((line) => line[hit.index])),
  clt: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.clt(r.n, [shown(hidden, 0, r.bernoulli), shown(hidden, 1, r.bernoulliBound), shown(hidden, 2, r.exponential), shown(hidden, 3, r.exponentialBound)]);
  },
  histogram: (chart, T, reps) => (hit) => {
    const b = chart.bars[hit.index];
    return b ? T.histogram(b.from, b.to, b.count, b.count / reps) : null;
  },
  hash: (chart, exact, T) => (hit, hidden = []) => T.hash(chart.x[hit.index], shown(hidden, 0, chart.series[0].values[hit.index]), shown(hidden, 1, exact)),
  strip: (cells, T) => (hit) => {
    if (!cells[hit.index]) return T.strip(hit.index + 1, false, 0);
    let from = hit.index;
    let to = hit.index;
    while (from > 0 && cells[from - 1]) from--;
    while (to < cells.length - 1 && cells[to + 1]) to++;
    return T.strip(hit.index + 1, true, to - from + 1);
  },
  cauchy: (paths, T) => (hit) => {
    const values = paths.map((line) => line[hit.index]);
    return T.cauchy(hw.PATH_POINTS[hit.index], Math.min(...values), Math.max(...values));
  },
  speed: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.speed(r.n, [shown(hidden, 0, r.exact), shown(hidden, 1, r.chebyshev), shown(hidden, 2, r.hoeffding), shown(hidden, 3, r.normal)]);
  },
  bvm: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.bvm(r.n, r.clicks, shown(hidden, 0, r.uniform), shown(hidden, 1, r.wrong), seriesOn(hidden, 2));
  },
  bvmDistance: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.bvmDistance(r.n, shown(hidden, 0, r.uniform.distance), shown(hidden, 1, r.wrong.distance));
  },
  results: (rows, T) => (hit, hidden = []) => {
    const r = rows[hit.index];
    return T.results(r.n, shown(hidden, 0, r.z), shown(hidden, 1, r.t), shown(hidden, 2, r.mle.distance));
  },
  root: (paths, T) => (hit, hidden = []) => {
    const c = paths.checks[hit.index];
    const sigma = Math.sqrt(paths.rate * (1 - paths.rate));
    return T.root(c.n, seriesOn(hidden, 0) ? [c.n * Math.sqrt(c.mse), sigma * Math.sqrt(c.n)] : null, seriesOn(hidden, 2) ? [Math.sqrt(c.mse), sigma / Math.sqrt(c.n)] : null);
  },
  burst: (rho, T) => (hit, hidden = []) => {
    const n = BURST_N[hit.index];
    const p = hw.FALSE_ALARMS.rate;
    return T.burst(n, shown(hidden, 0, Math.sqrt((p * (1 - p)) / n)), shown(hidden, 1, Math.sqrt(hw.burstVariance(n, p, rho)) / n));
  },
  discovery: (facts, T) => (hit) => T.discovery(hit.index, facts.counts[hit.index]),
  likelihood: (curves, T) => (hit, hidden = []) => T.likelihood(hw.GRID[hit.index], shown(hidden, 0, curves.day1.values[hit.index]), shown(hidden, 1, curves.days10.values[hit.index]), curves.days ?? 10),
};

/** The id of every table tied to a chart: the page and the program find it by id. */
const LINKED_TABLES = Object.freeze({
  alarm: 'hw7-alarm-table',
  network: 'hw7-network-table',
  campaign: 'hw7-campaign-table',
  logOdds: 'hw7-logodds-table',
  outside: 'hw7-outside-table',
  after: 'hw7-after-table',
  mse: 'hw7-mse-table',
  clt: 'hw7-clt-table',
  speed: 'hw7-speed-table',
  bvm: 'hw7-bvm-table',
  results: 'hw7-results-table',
  root: 'hw7-root-table',
  discovery: 'hw7-discovery-table',
});

const tableById = (id) => () => document.getElementById(id);
// one row per bar, point or category of the chart, in the same order
const rowPerPoint = (id) => Object.freeze({ table: tableById(id), row: (hit) => hit.index, point: (row) => row });

const links = Object.fromEntries(Object.entries(LINKED_TABLES).map(([key, id]) => [key, rowPerPoint(id)]));
// the two charts of section 2.8 mark the same table
links.bvmDistance = links.bvm;

// ---------------------------------------------------------------------------
// Il riepilogo dei test
// ---------------------------------------------------------------------------

const verdictOf = (p) => (p < hw.SIGNIFICANCE ? 'reject' : 'accept');

/**
 * The rows of the summary of the tests, from the results of the
 * computations (s, null while they run) and the two filters: { key, stat:
 * [name, value], p, log10p, verdict, expected } or { key, pending, expected }.
 */
function testRows(s, sms, kdd) {
  const wait = (key, expected) => ({ key, pending: true, expected });
  const ks = (key, t, expected) => ({ key, stat: ['D', t.D], p: t.p, log10p: t.log10p, verdict: verdictOf(t.p), expected });
  const binomial = (key, t, expected) => ({ key, stat: ['k', t.k], p: t.p, log10p: t.log10p, verdict: verdictOf(t.p), expected, extra: t });
  const mcnemar = (key, m) => ({ key, stat: ['b/c', `${m.b}/${m.c}`], p: m.p, log10p: m.log10p, verdict: m.log10p < Math.log10(hw.SIGNIFICANCE) ? 'reject' : 'accept', expected: 'reject' });
  if (!s) {
    return [
      wait('generator', 'accept'),
      wait('cltExponential', 'reject'), wait('cltUniform', 'accept'), wait('cltCauchy', 'accept'), wait('hash', 'accept'), wait('gc', 'accept'), wait('bytes', 'reject'),
      wait('sprtLegit', 'accept'), wait('sprtAttacker', 'accept'), wait('coverage', 'accept'),
      mcnemar('smsFilter', sms.mcnemar), mcnemar('kddFilter', kdd.mcnemar),
    ];
  }
  const g = s.generator;
  return [
    { key: 'generator', stat: ['z', g.z], p: g.p, log10p: Math.log10(g.p), verdict: g.verdict, expected: 'accept' },
    // part 1: the forms of convergence
    ks('cltExponential', s.clt.exponential, 'reject'),
    ks('cltUniform', s.clt.uniform, 'accept'),
    ks('cltCauchy', s.clt.cauchy, 'accept'),
    binomial('hash', s.hash.test, 'accept'),
    ks('gc', s.gc.test, 'accept'),
    ks('bytes', s.bytes[s.bytes.length - 1], 'reject'),
    // part 2: Bayes
    binomial('sprtLegit', s.sprt.testLegit, 'accept'),
    binomial('sprtAttacker', s.sprt.testAttacker, 'accept'),
    binomial('coverage', s.coverage.test, 'accept'),
    mcnemar('smsFilter', sms.mcnemar),
    mcnemar('kddFilter', kdd.mcnemar),
  ];
}

/** The cells of a row of the summary, in the language of `text`. */
function testCells(r, text) {
  const T = text.tests;
  const F = text.fmt;
  const d = T.rows[r.key];
  const statistic = () => {
    const [name, value] = r.stat;
    if (typeof value === 'string') return `${T.statNames[name]} = ${value}`;
    if (name === 'k') return `${T.statNames.k} = ${F.int(value)}`;
    return `${T.statNames[name]} = ${F.num(value, name === 'D' ? 4 : 3)}`;
  };
  return {
    subject: d.subject,
    hypothesis: d.hypothesis,
    statistic: r.pending ? '-' : statistic(),
    p: r.pending ? '-' : F.p(r.p, r.log10p),
    verdict: r.pending ? T.pending : T.verdicts[r.verdict === 'reject' ? 'reject' : 'accept'],
    expected: T.expected[r.expected],
    rejected: r.verdict === 'reject',
  };
}

// ---------------------------------------------------------------------------
// Disegno a fette
// ---------------------------------------------------------------------------

// Quando arrivano i risultati molti grafici vanno disegnati insieme: si
// disegnano qualcuno per fotogramma, entro pochi millisecondi, cosi' la
// pagina continua a rispondere.
const frameJobs = [];
let frameRequested = false;

function runFrameJobs() {
  const start = Date.now();
  while (frameJobs.length && Date.now() - start < 8) frameJobs.shift()();
  frameRequested = frameJobs.length > 0;
  if (frameRequested) requestAnimationFrame(runFrameJobs);
}

/** Draws a chart at the next free moment: a few per frame, within 8 milliseconds. */
function scheduleFrameJob(job) {
  frameJobs.push(job);
  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(runFrameJobs);
  }
}

// ---------------------------------------------------------------------------
// I grafici con i loro comandi (chartkit)
// ---------------------------------------------------------------------------
// Il modello di ogni sezione con comandi: i parametri all'inizio e, dove
// serve, la simulazione che dipende da loro (eseguita a fette dal kit). La
// pagina e il programma scaricabile leggono da qui gli stessi modelli e gli
// stessi comandi; le etichette vengono dai testi (text.controls).

/** An animation that draws a line chart point by point, as its x grows (chartkit/kitReveal.js): the series marked `fixed` stay whole. */
const reveal = revealChart;

const RATES = Object.freeze([0.01, 0.02, 0.03, 0.05, 0.1]);
const EPSILONS = Object.freeze([0.005, 0.01, 0.015, 0.02]);
const TRUE_RATES = Object.freeze(Array.from({ length: 29 }, (_, i) => Number((0.02 + 0.01 * i).toFixed(2))));

/** The models of the sections with controls: the parameters at the start, and the simulation when one depends on them. */
const MODELS = Object.freeze({
  // 1.1 and 1.2: the rate of the false alarms and the band; the 1,000 simulated rules depend on both
  paths: { params: { rate: hw.FALSE_ALARMS.rate, epsilon: hw.FALSE_ALARMS.epsilon }, simulate: (p) => hw.pathsSteps(hw.DEFAULT_SEED, { rate: p.rate, epsilon: p.epsilon }) },
  // 1.3 and 1.8: only the rate counts
  pathsRate: { params: { rate: hw.FALSE_ALARMS.rate }, simulate: (p) => hw.pathsSteps(hw.DEFAULT_SEED, { rate: p.rate }) },
  clt: { params: { p: hw.FALSE_ALARMS.rate } },
  results: { params: { p: hw.FALSE_ALARMS.rate } },
  speed: { params: { rate: hw.FALSE_ALARMS.rate, epsilon: hw.FALSE_ALARMS.epsilon } },
  cauchy: { params: { seed: hw.DEFAULT_SEED } },
  bytes: { params: { n: hw.BYTES_SIZES[hw.BYTES_SIZES.length - 1] } },
  likelihood: { params: { days: 10 } },
  // seed 0: the two addresses written by hand; the others are simulated
  sprt: { params: { alpha: hw.SPRT_DEFAULT.alpha, beta: hw.SPRT_DEFAULT.beta, seed: 0 } },
  campaign: { params: { rate: hw.CAMPAIGN.rate, perDay: hw.CAMPAIGN.perDay, seed: hw.DEFAULT_SEED } },
  coverage: { params: { n: hw.COVERAGE_N } },
  spam: { params: { cut: 6 } },
  bvm: { params: { rate: hw.BVM.rate, seed: hw.DEFAULT_SEED } },
});

/** Whether the parameters are the ones at the start: then the page shows the results already computed by its worker. */
const atStart = (model, params) => Object.keys(MODELS[model].params).every((k) => params[k] === MODELS[model].params[k]);

/** The controls of every section, in the language of `C` (text.controls). */
const controls = {
  paths: (C) => [
    { key: 'rate', kind: 'slider', values: RATES, label: C.rate },
    { key: 'epsilon', kind: 'slider', values: EPSILONS, label: C.epsilon },
  ],
  pathsRate: (C) => [{ key: 'rate', kind: 'slider', values: RATES, label: C.rate }],
  clt: (C) => [{ key: 'p', kind: 'slider', values: [0.01, 0.03, 0.1, 0.3, 0.5], label: C.bernoulliP }],
  results: (C) => [{ key: 'p', kind: 'slider', values: [0.01, 0.03, 0.1, 0.3, 0.5], label: C.shareP }],
  speed: (C) => [
    { key: 'rate', kind: 'slider', values: RATES, label: C.rate },
    { key: 'epsilon', kind: 'slider', values: EPSILONS, label: C.epsilon },
  ],
  cauchy: (C) => [{ kind: 'action', label: C.newSample, run: (p) => ({ ...p, seed: p.seed + 1 }) }],
  bytes: (C) => [{ key: 'n', kind: 'choice', label: C.bytesN, options: hw.BYTES_SIZES.map((n) => [n, C.int(n)]) }],
  likelihood: (C) => [{ key: 'days', kind: 'slider', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], label: C.days }],
  sprt: (C) => [
    { key: 'alpha', kind: 'slider', values: [...hw.SPRT_ALPHAS].sort((a, b) => b - a), label: C.alpha },
    { key: 'beta', kind: 'slider', values: [0.05, 0.01, 0.001], label: C.beta },
    { kind: 'action', label: C.newWalks, run: (p) => ({ ...p, seed: p.seed + 1 }) },
    { kind: 'action', label: C.handWalks, run: (p) => ({ ...p, seed: 0 }) },
  ],
  campaign: (C) => [
    { key: 'rate', kind: 'slider', values: TRUE_RATES, label: C.trueRate },
    { key: 'perDay', kind: 'slider', values: [10, 20, 40, 100], label: C.perDay },
    { kind: 'action', label: C.newCampaign, run: (p) => ({ ...p, seed: p.seed + 1 }) },
  ],
  coverage: (C) => [{ key: 'n', kind: 'slider', values: [10, 20, 40, 100, 400], label: C.coverageN }],
  spam: (C, bins) => [{ key: 'cut', kind: 'slider', values: Array.from({ length: bins.length - 1 }, (_, i) => i + 1), label: (v) => C.threshold(bins[v].from) }],
  bvm: (C) => [
    { key: 'rate', kind: 'slider', values: TRUE_RATES, label: C.trueRate },
    { kind: 'action', label: C.newSample, run: (p) => ({ ...p, seed: p.seed + 1 }) },
  ],
};

/** The handles of the charts: lines to drag, bound to the parameters (the same values as their slider). */
const handles = {
  // 1.2: the rate in the middle of the band, and the two edges of the band
  paths: (p, C) => [
    { id: 'rate', axis: 'y', value: p.rate, values: RATES, label: C.handleRate(p.rate) },
    { id: 'up', axis: 'y', value: p.rate + p.epsilon, values: EPSILONS.map((e) => p.rate + e), label: C.bandUp },
    { id: 'down', axis: 'y', value: p.rate - p.epsilon, values: EPSILONS.map((e) => p.rate - e), label: C.bandDown },
  ],
  pathsMove: (p, id, v) => {
    if (id === 'rate') return { ...p, rate: v };
    const e = Math.abs(v - p.rate);
    return { ...p, epsilon: EPSILONS.reduce((a, b) => (Math.abs(b - e) < Math.abs(a - e) ? b : a)) };
  },
  // 2.5: the two thresholds of Wald; dragging one changes the error it controls
  sprt: (setup, C) => [
    { id: 'upper', axis: 'y', value: setup.upper, values: hw.SPRT_ALPHAS.map((a) => Math.log((1 - setup.beta) / a)), label: C.block },
    { id: 'lower', axis: 'y', value: setup.lower, values: [0.05, 0.01, 0.001].map((b) => Math.log(b / (1 - setup.alpha))), label: C.clear },
  ],
  sprtMove: (p, id, v) => {
    if (id === 'upper') return { ...p, alpha: Number(((1 - p.beta) / Math.exp(v)).toPrecision(1)) };
    return { ...p, beta: Number((Math.exp(v) * (1 - p.alpha)).toPrecision(1)) };
  },
  // 2.6 and 2.11: the true rate
  trueRate: (rate, C) => [{ id: 'rate', axis: 'y', value: rate, values: TRUE_RATES, label: C.handleRate(rate) }],
  trueRateMove: (p, id, v) => ({ ...p, rate: v }),
  // 2.8: the threshold of the filter, between two bins of log-odds
  spam: (cut, bins, C) => [{ id: 'cut', axis: 'x', value: cut, values: Array.from({ length: bins.length - 1 }, (_, i) => i + 1), label: C.threshold(bins[cut].from) }],
  spamMove: (p, id, v) => ({ ...p, cut: v }),
};

/** 2.5: the walks of the chart, the two written by hand (seed 0) or two simulated addresses. */
function sprtWalks(setup, seed) {
  if (!seed) {
    return [
      { ...hw.sprtPath(setup, SPRT_EXAMPLES.legit), key: 'legit', color: 0 },
      { ...hw.sprtPath(setup, SPRT_EXAMPLES.attacker), key: 'attacker', color: 1 },
    ];
  }
  const walk = (pFail, stream) => {
    const next = hw.generator(hw.DEFAULT_SEED, 'live', 3000000 + 1000 * seed + stream);
    const attempts = [];
    for (let i = 0; i < hw.SPRT_MAX_STEPS; i++) {
      attempts.push(hw.uniform53(next) < pFail);
      if (hw.sprtPath(setup, attempts).decision) break;
    }
    return hw.sprtPath(setup, attempts);
  };
  return [
    { ...walk(hw.SPRT_DEFAULT.p0, 0), key: 'legit', color: 0 },
    { ...walk(hw.SPRT_DEFAULT.p1, 1), key: 'attacker', color: 1 },
  ];
}

/** 2.8: what the filter does with the threshold between bin cut - 1 and bin cut: spam caught and missed, legitimate messages marked and left. */
function spamCut(bins, cut) {
  const sum = (key, from, to) => bins.slice(from, to).reduce((a, b) => a + b[key], 0);
  const tp = sum('spam', cut, bins.length);
  const fn = sum('spam', 0, cut);
  const fp = sum('ham', cut, bins.length);
  const tn = sum('ham', 0, cut);
  const n = tp + fn + fp + tn;
  return { threshold: bins[cut].from, tp, fn, fp, tn, accuracy: (tp + tn) / n, precision: tp + fp ? tp / (tp + fp) : 1, recall: tp + fn ? tp / (tp + fn) : 1 };
}

return { SECTIONS, tocEntries, DEFAULT_PARAMS, paramsKey, parseParamsKey, pParts, pctLabel, ALARM_CATEGORIES, alarmIcons, ALARM_TRY_DEFAULT, alarmTry, alarmChains, networkRows, networkChart, NETWORK_TRY_DEFAULT, NETWORK_LAYOUT, NETWORK_EDGES, NETWORK_VIEW, MAP_LAYOUT, MAP_VIEW, diagramHit, SPRT_EXAMPLES, sprtChart, SPRT_TRY_DEFAULT, sprtPosterior, campaignFacts, campaignChart, densityChart, BELIEF_TRY_DEFAULT, beliefCurves, moreEmails, PRIOR_TRY_DEFAULT, PRIOR_DATA, priorData, coverageChart, logOddsChart, SPAM_EXAMPLE, SPAM_BASES, spamPrior, KDD_TRY_DEFAULT, outsideChart, pathsChart, afterChart, mseChart, SEQUENCE_TRY_DEFAULT, SEQUENCE_TABLE_N, sequenceTableN, sequenceChart, cltChart, CLT_TRY_DEFAULT, CLT_TRY_SIZES, CLT_TRY_REPS, cltTry, HASH_TRY_DEFAULT, HASH_FACTORS, hashCount, hashMore, hashChart, cauchyChart, bytesChart, speedChart, bvmChart, bvmDistanceChart, resultsRows, resultsChart, rootChart, SCALE_TRY_DEFAULT, scaleCharts, BURST_TRY_DEFAULT, BURST_N, BURST_STRIP, stripChart, burstChart, DISCOVERY_TRY_DEFAULT, DISCOVERY_CATEGORIES, discoveryIcons, likelihoodChart, legends, tips, LINKED_TABLES, links, testRows, testCells, scheduleFrameJob, reveal, MODELS, atStart, controls, handles, sprtWalks, spamCut };
})();

var texts$ = (function () {
'use strict';

// src/pages/statistics/hw7/texts.js
// I testi dell'Homework #7 in italiano e in inglese, per la pagina del sito
// e per il programma scaricabile: le due versioni dicono le stesse cose con
// le stesse parole. Ogni numero arriva dagli argomenti (i risultati dei
// calcoli) o dalle costanti della libreria: nessuna frase contiene un
// risultato scritto a mano.
const { ALARM_DEFAULT, BURST_SECTION, BYTES_REPS, CAMPAIGN, CLT_REPS, COVERAGE_N, COVERAGE_RUNS, DECISION_LEVEL, FALSE_ALARMS, GC_REPS, HASH_TEST, KOLMOGOROV_MEAN, PATHS, PRIORS, SCALE_REPS, SEQUENCE_EPSILON, SIGNIFICANCE, SPRT_DEFAULT, SPRT_RUNS, TARGET_RATE } = Homework7;
const { pParts } = view$;

/**
 * The assignment as the professor wrote it, block by block: the real text
 * of Homework #7, which replaced a first, shorter one. The only change: its
 * lines, broken in the original, are joined into paragraphs, and the list
 * keeps its items without the dashes in front of them. The rest is as it
 * was written, "LLM" and "satistics" included.
 */
const originalAssignment = () => [
  { type: 'title', text: '== Modes of Convergence in Probability Theory ==' },
  { type: 'p', text: 'Explain the differences between the main modes of convergence used in probability theory and discuss their respective roles in the Law of Large Numbers (LLN) and the Central Limit Theorem (CLT).' },
  { type: 'p', text: 'For instance' },
  { type: 'list', items: ['Convergence in probability', 'Almost sure convergence (a.s.)', 'Mean-square convergence (quadratic mean or L²)', 'Convergence in distribution'] },
  { type: 'p', text: 'indicating their role in LLM and CLT (or other important results in satistics).' },
  { type: 'p', text: 'Discuss why the term √n frequently appears in convergence theorems, particularly in relation to the additivity of variance under suitable conditions and the role of independence, both in probability theory and statistical inference.' },
  { type: 'title', text: "== Conditional Probability, Bayes' Theorem and Statistical Inference ==" },
  { type: 'p', text: "Conditional probability in both probability theory and statistics and Bayes' Theorem. Understand the role and relationship between the 3 fundamental components of Bayesian inference: Prior probability,Likelihood, Posterior probability. Explain how Bayes' Theorem obtain posterior probabilities, and why this updating process plays a central role in a part of (Bayesian) statistical inference." },
  { type: 'p', text: 'Do some examples of the use of prior probabilities and likelihood functions, discussing their applications, advantages and limitations and their influence on statistical conclusions.' },
];

/** Number formatting of one language: decimal and thousands separators, the "not available" marker, the multiplication sign. */
function formatters(decimal, thousands, na, times) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const num = (v, digits = 3) => {
    if (missing(v)) return na;
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '-∞';
    const [whole, part] = Math.abs(v).toFixed(digits).split('.');
    const negative = v < 0 && Math.abs(v) >= 0.5 * 10 ** -digits;
    return `${negative ? '-' : ''}${group(whole)}${part ? `${decimal}${part}` : ''}`;
  };
  const sci = (v, digits = 2) => {
    if (missing(v)) return na;
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    let m = v / 10 ** e;
    let exp = e;
    if (Number(Math.abs(m).toFixed(digits)) >= 10) {
      m /= 10;
      exp += 1;
    }
    return `${local(m.toFixed(digits))} ${times} 10^${exp}`;
  };
  // a probability that may be tiny: four decimals, then a power of ten
  const prob = (v, digits = 4) => (missing(v) ? na : v === 0 ? '0' : v >= 10 ** -digits ? num(v, digits) : sci(v, 2));
  return {
    decimal,
    na,
    int: (v) => (missing(v) ? na : `${v < 0 ? '-' : ''}${group(String(Math.round(Math.abs(Number(v)))))}`),
    num,
    sci,
    prob,
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
    // a percentage that may be very small: as many decimals as it takes, up to 4, then a power of ten
    pctSmall: (v) => {
      if (missing(v)) return na;
      if (v === 0) return '0%';
      const x = 100 * v;
      if (x >= 1) return `${local(x.toFixed(1))}%`;
      if (x >= 0.01) return `${local(x.toFixed(2))}%`;
      return `${sci(x, 1)}%`;
    },
    // a p-value: four decimals down to 0.001, then a power of ten, also below 10^-300 where p itself is 0
    p: (p, log10p = Math.log10(p)) => {
      if (missing(p) && missing(log10p)) return na;
      if (p >= 0.001) return local(p.toFixed(4));
      const { m, e } = pParts(p, log10p);
      return `${local(m.toFixed(2))} ${times} 10^${e}`;
    },
    plain: (v) => (missing(v) ? na : local(String(v))),
  };
}

/** A list in words: a, b and c. */
const listOf = (items, and) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`);

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', '×');

// the article before a number: elided when the number is read with a vowel (1, 8, 11, 80...): l’8%, all’11,2%, dell’1%
const vowelNumber = (text) => {
  const whole = text.replace(/^[-+]/, '').split(/[,%\s]/)[0].replace(/\./g, '');
  return whole === '1' || whole === '11' || whole.startsWith('8');
};
const ELIDED = { il: 'l’', al: 'all’', del: 'dell’', dal: 'dall’', sul: 'sull’', nel: 'nell’' };
const art = (prep, text) => (vowelNumber(text) ? `${ELIDED[prep]}${text}` : `${prep} ${text}`);

const it = {
  fmt: IT,
  ui: {
    index: 'Indice',
    indexTitle: 'Indice dell’homework',
    close: 'Chiudi',
    backToTop: 'Torna su',
    computing: 'Calcolo in corso...',
    language: 'Lingua',
    error: (message) => `Il calcolo non è riuscito: ${message}`,
    another: 'Altro campione',
    reset: 'Ricomincia',
    yes: 'sì',
    no: 'no',
  },
  sections: {
    assignment: '0. La consegna',
    convergence: '1. Le forme di convergenza nella teoria della probabilità',
    probability: '1.1 In probabilità',
    almost: '1.2 Quasi certa',
    trySequences: 'Prova: traiettorie e controesempi',
    l2: '1.3 In media quadratica (L²)',
    distribution: '1.4 In distribuzione',
    tryClt: 'Prova: il limite centrale dal vivo',
    tryHash: 'Prova: collisioni di hash',
    map: '1.5 Come si legano: la mappa delle implicazioni',
    tryMap: 'Prova: la mappa',
    roles: '1.6 Il ruolo nella legge dei grandi numeri e nel limite centrale',
    results: '1.7 Altri risultati: consistenza, Slutsky, metodo delta, Glivenko-Cantelli, MLE',
    root: '1.8 Perché √n: la varianza che si somma',
    tryScale: 'Prova: la scala giusta',
    bursts: '1.9 Senza indipendenza: allarmi a raffica',
    tryBursts: 'Prova: allarmi a raffica',
    heavy: '1.10 Quando √n non basta: le code pesanti',
    speed: '1.11 Quanto in fretta: Chebyshev, Hoeffding, Berry-Esseen',
    bayes: '2. Probabilità condizionata, teorema di Bayes e inferenza statistica',
    conditional: '2.1 La probabilità condizionata, in probabilità e in statistica',
    tryPvalue: 'Prova: p-value e P(H0 | dati)',
    engine: '2.2 Il teorema di Bayes: prior, verosimiglianza, posterior',
    alarm: '2.3 Un allarme dell’IDS e il tasso di base',
    tryAlarm: 'Prova: l’allarme regolabile',
    network: '2.4 Una rete bayesiana per il triage',
    tryNetwork: 'Prova: spiegare via',
    sprt: '2.5 Quando bloccare un IP: il test sequenziale di Wald',
    trySprt: 'Prova: bloccare un IP',
    rate: '2.6 Stimare un tasso: chi clicca il phishing',
    tryBelief: 'Prova: la credenza dal vivo',
    tryPrior: 'Prova: disegnate il prior',
    frequentist: '2.7 Bayes e frequentisti: credibilità e confidenza',
    spam: '2.8 Il filtro antispam: naive Bayes su SMS veri',
    kdd: '2.9 Lo stesso motore su NSL-KDD',
    limits: '2.10 Vantaggi, limiti e influenza del prior sulle conclusioni',
    bvm: '2.11 Il posterior converge: Bernstein-von Mises',
    checks: '3. Verifiche',
    tests: '4. Riepilogo dei test statistici',
    history: '5. Contesto storico',
    conclusion: '6. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna ha due parti. La prima chiede di spiegare le differenze fra i principali modi di convergenza della teoria della probabilità (in probabilità, quasi certa, in media quadratica, in distribuzione), il loro ruolo nella legge dei grandi numeri, nel teorema del limite centrale e in altri risultati importanti della statistica, e perché nei teoremi di convergenza compare così spesso √n, in relazione all’additività della varianza e al ruolo dell’indipendenza, in probabilità e nell’inferenza. La seconda chiede la probabilità condizionata, in probabilità e in statistica, il teorema di Bayes e il ruolo e il rapporto delle tre componenti dell’inferenza bayesiana, prior, verosimiglianza e posterior: come il teorema produce i posterior, perché questo aggiornamento è centrale, ed esempi d’uso di prior e verosimiglianze con applicazioni, vantaggi, limiti e influenza sulle conclusioni.',
      'La pagina segue quest’ordine. La sezione 1 definisce e mostra i quattro modi nell’ordine del testo (da 1.1 a 1.4), li lega in una mappa delle implicazioni (1.5), ne riassume il ruolo nella legge dei grandi numeri e nel limite centrale (1.6) e in altri risultati della statistica: la consistenza degli stimatori, il teorema di Slutsky e il metodo delta, Glivenko-Cantelli, la normalità dello stimatore di massima verosimiglianza (1.7). Poi spiega √n: la varianza che si somma grazie all’indipendenza (1.8), che cosa succede senza (1.9), quando √n non basta (1.10) e quanto in fretta si converge (1.11). La sezione 2 parte dalla probabilità condizionata, con la catena di un attacco, l’indipendenza condizionata e la differenza fra un p-value e la probabilità di H0 (2.1); presenta il teorema di Bayes e le sue tre componenti (2.2); le mette al lavoro su esempi di sicurezza informatica, dall’allarme di un IDS a due filtri naive Bayes su dati veri (da 2.3 a 2.9); ne discute vantaggi, limiti e influenza del prior sulle conclusioni (2.10) e chiude con il posterior che converge, il ponte fra le due parti (2.11). Seguono le verifiche dei calcoli, il riepilogo dei test, il contesto storico e le conclusioni.',
      'Dodici riquadri «Prova» lasciano mettere le mani sui numeri: le traiettorie dei controesempi, il limite centrale dal vivo, le collisioni di hash, la mappa delle implicazioni, la scala giusta per n, gli allarmi a raffica, il p-value contro P(H0 | dati), un allarme da regolare, gli indizi di una rete, un indirizzo da bloccare, una credenza che si aggiorna a ogni e-mail e un prior da disegnare. Tutti i numeri sono calcolati nel browser, e il programma scaricabile stampa gli stessi. Anche i grafici delle sezioni si possono muovere: hanno i loro comandi, linee da trascinare, animazioni e lo zoom (Ctrl + rotella, oppure un rettangolo trascinato); grafici e tabelle seguono i comandi, mentre i paragrafi raccontano i valori iniziali.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese; le righe spezzate dell’originale sono unite in paragrafi.',
  },
  bayes: {
    intro: [
      'La seconda parte passa dalla convergenza all’inferenza. La probabilità condizionata dice come cambia una probabilità quando si sa qualcosa; il teorema di Bayes la rovescia, dalla probabilità dei dati date le ipotesi a quella delle ipotesi dati i dati. Usato così è un motore inferenziale, che fa sempre la stessa cosa: prende ciò che si sapeva prima (il prior), lo combina con quanto i dati sono probabili sotto ogni ipotesi (la verosimiglianza) e restituisce ciò che si sa dopo (il posterior). Gli esempi cambiano le ipotesi e i dati, non la regola: un allarme, tre indizi legati fra loro, una serie di tentativi di accesso, una campagna di phishing, le parole di un SMS, i campi di una connessione.',
    ],
  },
  engine: {
    components: 'Dalla definizione di probabilità condizionata, P(H ∩ E) = P(E | H) P(H) = P(H | E) P(E); dividendo per P(E) si ottiene il teorema di Bayes. Le sue tre componenti hanno ruoli diversi. Il prior P(H) è ciò che si sa prima dei dati: un tasso di base, l’esperienza, un’ipotesi dichiarata. La verosimiglianza P(E | H), letta come funzione dell’ipotesi (o del parametro θ) con i dati fissati, dice quanto ciascuna ipotesi rende probabili i dati osservati: porta l’informazione del campione. Il posterior P(H | E) è ciò che si sa dopo, e la sola cosa su cui si ragiona da lì in avanti. L’evidenza P(E), dalla probabilità totale, è la costante che fa sommare a 1 i posterior.',
    likelihood: (l) => `La verosimiglianza non è una distribuzione di probabilità su θ. Come funzione di θ non ha area 1: nel grafico, scalata a un massimo di 1, ha area ${IT.num(l.day1.area, 3)} con i dati del primo giorno (${IT.int(l.data.day1.clicks)} click su ${IT.int(l.data.day1.sent)}) e ${IT.num(l.days10.area, 3)} con quelli di dieci giorni (${IT.int(l.data.days10.clicks)} su ${IT.int(l.data.days10.sent)}). Ha il massimo nella frequenza osservata, la stima di massima verosimiglianza, e si stringe con i dati. Solo moltiplicata per un prior e normalizzata diventa un posterior.`,
    likelihoodTitle: 'La verosimiglianza della quota di click, dopo il primo giorno e dopo dieci giorni, scalata a un massimo di 1',
    odds: 'Con due ipotesi, H e ¬H, il teorema si legge meglio in forma di quote: le quote a posteriori sono le quote a priori per il rapporto di verosimiglianza LR = P(E | H)/P(E | ¬H). In logaritmi il prodotto diventa una somma: ogni prova aggiunge il suo peso ln LR, e le prove indipendenti date le ipotesi si sommano. Alan Turing, a Bletchley Park, misurava questi pesi in ban (logaritmi in base 10) e deciban.',
    formulas: [
      'P(H | E) = P(E | H) · P(H) / P(E)                  il teorema',
      'P(E) = Σ_i P(E | H_i) · P(H_i)                     la probabilità totale',
      'O(H | E) = O(H) · P(E | H) / P(E | ¬H)             le quote: posterior = prior × LR',
      'ln O(H | E_1, ..., E_k) = ln O(H) + Σ_j ln LR_j    prove indipendenti date H e ¬H',
      'p(θ | dati) ∝ p(dati | θ) · p(θ)                   un parametro continuo',
    ].join('\n'),
    weights: (w1, w10) => `Per un parametro il rapporto fra le tre componenti si vede nella media a posteriori. Con un prior Beta(a, b) e k click su n e-mail la media a posteriori è (a + k)/(a + b + n): una media pesata fra la media del prior e la frequenza osservata, con peso del prior (a + b)/(a + b + n). Con il prior informato Beta(3, 17) e il primo giorno il prior pesa ${art('il', IT.pct(w1.w, 1))}: ${IT.pct(w1.priorMean, 1)} e ${IT.pct(w1.mle, 1)} danno ${IT.pct(w1.posteriorMean, 1)}. Dopo dieci giorni pesa ${art('il', IT.pct(w10.w, 1))}, e il posterior (${IT.pct(w10.posteriorMean, 1)}) è quasi la frequenza osservata (${IT.pct(w10.mle, 1)}).`,
    central: 'Perché questo aggiornamento è centrale nell’inferenza bayesiana: tutto ciò che si conclude viene dal posterior. Le stime (media, mediana, moda), gli intervalli di credibilità, le probabilità delle ipotesi come P(θ > soglia), le previsioni di dati nuovi e le decisioni sono sue funzioni. E l’aggiornamento è coerente: il posterior di oggi è il prior di domani, e aggiornare un dato alla volta o tutti insieme, in qualunque ordine, dà lo stesso risultato.',
    after: 'Tre cose decidono il risultato, e gli esempi che seguono le mostrano una alla volta: il prior (2.3, il tasso di base), quanto ogni prova distingue le ipotesi (2.4 e 2.5), e quanti dati arrivano (2.6 e 2.11: con abbastanza dati il prior smette di contare).',
  },
  alarm: {
    intro: (f) => `Una regola dell’IDS riconosce ${art('il', IT.pct(f.sensitivity, 0))} degli attacchi (la sensibilità) e suona per errore ${art('sul', IT.pct(f.fpr, 0))} delle connessioni normali (il tasso di falsi positivi). Sembra un buon rilevatore. Ma su questa rete solo una connessione su ${IT.int(1 / f.base)} è un attacco: è il tasso di base, il prior. Quando l’IDS suona, quanto è probabile che sia davvero un attacco?`,
    paras: (f) => [
      `P(attacco | allarme) = (${IT.plain(f.base)} × ${IT.plain(f.sensitivity)}) / (${IT.plain(f.base)} × ${IT.plain(f.sensitivity)} + ${IT.plain(1 - f.base)} × ${IT.plain(f.fpr)}) = ${IT.pct(f.posterior)}: solo un allarme su ${IT.num(1 / f.posterior, 1)} è un attacco. Con le frequenze naturali il conto si fa a mente. Su ${IT.int(f.population)} connessioni gli attacchi sono ${IT.int(f.population * f.base)}: l’IDS ne vede ${IT.int(f.counts[0])} e ne perde ${IT.int(f.counts[1])}. Le connessioni normali sono ${IT.int(f.population * (1 - f.base))}, e ${art('il', IT.pct(f.fpr, 0))} di loro fa scattare ${IT.int(f.counts[2])} falsi allarmi. Gli allarmi sono ${IT.int(f.counts[0] + f.counts[2])}, e solo ${IT.int(f.counts[0])} sono attacchi.`,
      `È la fallacia del tasso di base: chi guarda solo la sensibilità ${art('del', IT.pct(f.sensitivity, 0))} sopravvaluta l’allarme di ${IT.num(f.sensitivity / f.posterior, 1)} volte. In forma di quote: il prior è 1 a ${IT.num(1 / f.priorOdds, 0)}, l’allarme lo moltiplica per LR = ${IT.num(f.sensitivity, 2)}/${IT.num(f.fpr, 2)} = ${IT.num(f.lrPlus, 1)} (${IT.num(Math.log10(f.lrPlus), 2)} ban) e lo porta a 1 a ${IT.num(1 / f.posteriorOdds, 2)}. Il silenzio invece rassicura molto: P(attacco | nessun allarme) = ${IT.pctSmall(f.posteriorQuiet)}.`,
    ],
    iconTitle: 'Le 10.000 connessioni: ogni quadratino è una connessione',
    tableTitle: 'Le quattro categorie',
    cols: { category: 'Categoria', truth: 'Verità', alarm: 'Allarme', count: 'Connessioni', share: 'Quota' },
    truth: { detected: 'attacco', missed: 'attacco', falseAlarm: 'normale', quiet: 'normale' },
    alarmed: { detected: 'sì', missed: 'no', falseAlarm: 'sì', quiet: 'no' },
    chainIntro: (s2) => `Una seconda prova, indipendente dalla prima dato lo stato della connessione: una sandbox apre il file che la connessione ha portato. Riconosce ${art('il', IT.pct(s2.sensitivity, 0))} del malware e sbaglia ${art('sul', IT.pct(s2.fpr, 0))} dei file innocui, quindi LR = ${IT.num(s2.sensitivity / s2.fpr, 0)}. Il posterior del primo allarme diventa il prior del secondo. Nell’ordine inverso, prima la sandbox e poi l’IDS, si arriva allo stesso numero: i pesi si sommano.`,
    chainTitle: 'Due prove in fila, nei due ordini',
    chainCols: { order: 'Ordine', step: 'Prova', lr: 'LR', weight: 'Peso (ban)', prior: 'Prior', posterior: 'Posterior' },
    orders: { forward: 'IDS, poi sandbox', backward: 'sandbox, poi IDS' },
    detectors: { ids: 'allarme dell’IDS', sandbox: 'allarme della sandbox' },
  },
  tryAlarm: {
    intro: 'Muovete i cursori: tasso di base, sensibilità e falsi positivi. I quadratini rossi sono gli attacchi visti, i viola quelli persi, gli arancioni i falsi allarmi. Con un tasso di base di uno su diecimila anche un rilevatore eccellente produce quasi solo falsi allarmi; con il secondo rilevatore acceso, gli allarmi vengono rivisti dalla sandbox.',
    base: (v) => `Tasso di base: ${IT.pctSmall(v)}`,
    sensitivity: (v) => `Sensibilità: ${IT.pct(v, 1)}`,
    fpr: (v) => `Falsi positivi: ${IT.pctSmall(v)}`,
    second: 'Rivedere gli allarmi con la sandbox',
    result: (t) => {
      const f = t.facts;
      const [seen, missed, wrong] = f.counts;
      return `Su ${IT.int(f.population)} connessioni: ${IT.int(seen)} ${seen === 1 ? 'attacco visto' : 'attacchi visti'}, ${IT.int(missed)} ${missed === 1 ? 'perso' : 'persi'}, ${IT.int(wrong)} ${wrong === 1 ? 'falso allarme' : 'falsi allarmi'}. P(attacco | allarme) = ${IT.pct(f.posterior)}.`;
    },
    secondResult: (t) => `La sandbox conferma circa ${IT.num(t.confirmed[0], 1)} attacchi e ${IT.num(t.confirmed[1], 1)} falsi allarmi: dopo due allarmi P(attacco) = ${IT.pct(t.chain[1].posterior)}.`,
  },
  network: {
    intro: [
      'Un analista vede tre indizi su un host e deve capire che cosa è successo. Due cause possibili: un phishing ha rubato una password, oppure qualcuno ha sfruttato una vulnerabilità dall’esterno. Ciascuna può compromettere l’host (le due cause agiscono indipendentemente, un modello detto noisy-OR, con una piccola probabilità di compromissione per altre vie). Gli indizi: l’EDR sull’host dà l’allarme (figlio della compromissione), l’accesso arriva da un luogo insolito (figlio del phishing), l’IDS vede la firma di un exploit (figlio della vulnerabilità). I numeri sono ordini di grandezza plausibili, non dati.',
      'Una rete bayesiana scrive la probabilità congiunta di tutti i nodi come prodotto delle probabilità di ciascuno dati i suoi genitori: con sei nodi binari bastano 1 + 1 + 4 + 2 + 2 + 2 = 12 numeri, invece dei 63 di una tabella completa. L’inferenza qui è per enumerazione: si sommano i 64 stati compatibili con gli indizi. Con reti grandi servono l’eliminazione delle variabili o i metodi Monte Carlo, ma la regola resta Bayes.',
    ],
    paras: (rows) => [
      `Senza indizi, phishing ed exploit hanno le loro probabilità a priori, ${IT.pct(rows[0].phishing)} e ${IT.pct(rows[0].exploit)}, e la compromissione ${IT.pct(rows[0].compromise)}. L’allarme dell’EDR porta la compromissione ${art('al', IT.pct(rows[1].compromise))} e alza entrambe le cause: il phishing ${art('al', IT.pct(rows[1].phishing))}, l’exploit ${art('al', IT.pct(rows[1].exploit))}.`,
      `Poi l’IDS vede la firma di un exploit: la vulnerabilità sale ${art('al', IT.pct(rows[2].exploit))} e il phishing ridiscende ${art('al', IT.pct(rows[2].phishing))}, quasi al suo prior, anche se nessun indizio riguarda il phishing. È lo «spiegare via» (explaining away): una causa trovata rende superflua l’altra. A priori le due cause sono indipendenti; dato il loro effetto comune diventano dipendenti, in senso opposto. Infine l’accesso insolito, un indizio proprio del phishing, lo riporta ${art('al', IT.pct(rows[3].phishing))}, e a sua volta toglie un po’ di peso all’exploit (${IT.pct(rows[3].exploit)}).`,
    ],
    nodes: { phishing: 'Phishing', exploit: 'Exploit', compromise: 'Compromissione', edr: 'Allarme EDR', login: 'Accesso insolito', signature: 'Firma di exploit' },
    steps: ['Nessun indizio', 'Allarme EDR', '+ firma di exploit', '+ accesso insolito'],
    stepsShort: ['Prima', 'EDR', '+ firma', '+ accesso'],
    chartTitle: 'Le probabilità delle tre variabili nascoste, indizio dopo indizio',
    tableTitle: 'La storia, passo per passo',
    cols: { step: 'Indizi', phishing: 'P(phishing)', exploit: 'P(exploit)', compromise: 'P(compromissione)', evidence: 'P(indizi)' },
  },
  tryNetwork: {
    intro: 'Ogni indizio può essere ignoto, presente o assente. Accendete l’allarme dell’EDR e poi la firma di exploit: guardate il phishing scendere. Provate anche a dire che l’EDR non ha suonato: la compromissione crolla, e con lei le due cause.',
    states: { unknown: 'ignoto', yes: 'sì', no: 'no' },
    result: (q) => `P(phishing) = ${IT.pct(q.phishing)}, P(exploit) = ${IT.pct(q.exploit)}, P(compromissione) = ${IT.pct(q.compromise)}; la probabilità di vedere questi indizi era ${IT.pctSmall(q.pEvidence)}.`,
    diagramLabel: 'La rete bayesiana del triage: le cause in alto, la compromissione al centro, gli indizi in basso',
  },
  sprt: {
    intro: [
      `Un indirizzo IP prova ad accedere, un tentativo dopo l’altro. Due ipotesi: un utente legittimo, che sbaglia ogni tanto (fallisce con probabilità p0 = ${IT.plain(SPRT_DEFAULT.p0)}: un errore di battitura, una password vecchia), oppure un attacco a forza bruta, che fallisce quasi sempre (p1 = ${IT.plain(SPRT_DEFAULT.p1)}). Bloccare un utente legittimo deve capitare al massimo una volta su ${IT.int(1 / SPRT_DEFAULT.alpha)} (α), lasciar passare un attaccante una volta su ${IT.int(1 / SPRT_DEFAULT.beta)} (β). Quanti tentativi aspettare?`,
      'Il test sequenziale di Wald (1945) somma, tentativo dopo tentativo, il logaritmo del rapporto di verosimiglianza, e decide appena la somma esce da una delle due soglie. È Bayes applicato un tentativo alla volta: con quote a priori di 1 a 1, la somma è proprio il logaritmo delle quote a posteriori che l’indirizzo sia un attaccante.',
    ],
    formulas: (s) => [
      `tentativo fallito:   + ln(p1/p0) = + ${IT.num(s.fail, 3)}`,
      `tentativo riuscito:  + ln((1 - p1)/(1 - p0)) = ${IT.num(s.success, 3)}`,
      `blocca quando la somma ≥ ln((1 - β)/α) = ${IT.num(s.upper, 3)}`,
      `libera quando la somma ≤ ln(β/(1 - α)) = ${IT.num(s.lower, 3)}`,
    ].join('\n'),
    paras: (s, legit, attacker) => [
      `Un attaccante che fallisce sempre viene bloccato al tentativo numero ${IT.int(Math.ceil(s.upper / s.fail))} (${IT.int(Math.ceil(s.upper / s.fail))} × ${IT.num(s.fail, 3)} = ${IT.num(Math.ceil(s.upper / s.fail) * s.fail, 2)}); un utente che entra ${IT.int(Math.ceil(s.lower / s.success))} volte di seguito viene liberato. Calcolati esattamente sul reticolo dei fallimenti e dei successi, gli errori sono P(bloccare un utente) = ${IT.prob(legit.block)} e P(liberare un attaccante) = ${IT.prob(attacker.clear)}, sotto α e β come Wald garantisce. In media servono ${IT.num(legit.mean, 2)} tentativi per un utente e ${IT.num(attacker.mean, 2)} per un attaccante; le approssimazioni di Wald, che trascurano di quanto la somma supera la soglia, dicono ${IT.num(s.waldLegit, 2)} e ${IT.num(s.waldAttacker, 2)}.`,
      `Le soglie, lette come probabilità a posteriori con un prior di metà e metà, sono P(attaccante) = ${IT.pct(1 / (1 + Math.exp(-s.upper)), 2)} per bloccare e ${IT.pct(1 / (1 + Math.exp(-s.lower)), 2)} per liberare. Wald e Wolfowitz (1948) dimostrarono che nessun altro test con gli stessi errori usa in media meno tentativi: il test sequenziale è il modo più rapido di decidere.`,
    ],
    simulation: (sim) => `Simulati ${IT.int(sim.legit.runs)} utenti e ${IT.int(sim.attackers.runs)} attaccanti: ${IT.int(sim.legit.block)} ${sim.legit.block === 1 ? 'utente bloccato' : 'utenti bloccati'} (atteso ${IT.num(sim.exactLegit.block * sim.legit.runs, 1)}) e ${IT.int(sim.attackers.clear)} attaccanti liberati (attesi ${IT.num(sim.exactAttacker.clear * sim.attackers.runs, 1)}), con ${IT.num(sim.legit.meanSteps, 2)} e ${IT.num(sim.attackers.meanSteps, 2)} tentativi in media.`,
    chartTitle: 'Il logaritmo del rapporto di verosimiglianza di due indirizzi d’esempio',
    tableTitle: 'Errori e tentativi: esatti, approssimati, simulati',
    cols: { who: 'Indirizzo', block: 'Bloccato', clear: 'Liberato', exact: 'Tentativi (esatti)', wald: 'Tentativi (Wald)', simulated: 'Tentativi (simulati)' },
    who: { legit: 'Utente legittimo', attacker: 'Attaccante' },
  },
  trySprt: {
    intro: 'Aggiungete i tentativi a mano, oppure fate arrivare un utente o un attaccante simulato, un tentativo alla volta. Il riquadro mostra la somma, le soglie e la probabilità a posteriori, con un prior di metà e metà. Abbassate α: servono più fallimenti per bloccare.',
    fail: '+ tentativo fallito',
    success: '+ tentativo riuscito',
    legit: 'Utente simulato',
    attacker: 'Attaccante simulato',
    alphaLabel: 'Errore ammesso sugli utenti (α)',
    alphaName: (a) => `1 su ${IT.int(1 / a)}`,
    result: (path, n, decision) => {
      const last = path.llr[path.llr.length - 1];
      const state = decision === 'block' ? 'indirizzo bloccato' : decision === 'clear' ? 'indirizzo liberato' : 'ancora nessuna decisione';
      return `${IT.int(n)} ${n === 1 ? 'tentativo' : 'tentativi'}, somma ${IT.num(last, 3)}, P(attaccante) = ${IT.pct(1 / (1 + Math.exp(-last)), 2)}: ${state}.`;
    },
    walk: 'L’indirizzo di prova',
  },
  rate: {
    intro: (c) => `Una campagna di phishing simulato manda ${IT.int(CAMPAIGN.perDay)} e-mail al giorno per ${IT.int(CAMPAIGN.days)} giorni. La quota vera di chi clicca, ${IT.pct(CAMPAIGN.rate, 0)}, l’analista non la conosce: la stima dai click. Due analisti partono da prior diversi: uno non sa niente, Beta(${PRIORS.uniform.join(', ')}), uniforme su [0, 1]; l’altro ha letto che di solito clicca ${art('il', IT.pct(PRIORS.informed[0] / (PRIORS.informed[0] + PRIORS.informed[1]), 0))}, e lo esprime con Beta(${PRIORS.informed.join(', ')}), che vale quanto ${IT.int(PRIORS.informed[0] + PRIORS.informed[1])} e-mail già viste. La sicurezza vuole stare sotto ${art('il', IT.pct(TARGET_RATE, 0))}. Click dei dieci giorni: ${c.days.map((d) => d.clicks).join(', ')}.`,
    paras: (c) => {
      const u = c.uniform;
      const i = c.informed;
      const d1 = u[1];
      const last = u[u.length - 1];
      const lastI = i[i.length - 1];
      return [
        `Il prior Beta è coniugato della binomiale: dopo k click su n e-mail il posterior è ancora una Beta, con k aggiunto al primo parametro e n - k al secondo. Il motore qui si riduce a contare. Dopo il primo giorno (${IT.int(d1.clicks)} click su ${IT.int(d1.sent)}) il primo analista stima ${IT.pct(d1.mean)}, con un intervallo di credibilità al 95% da ${IT.pct(d1.lo)} a ${IT.pct(d1.hi)}; il secondo, frenato dal suo prior, ${IT.pct(i[1].mean)}.`,
        `Dopo ${IT.int(last.sent)} e-mail e ${IT.int(last.clicks)} click i due quasi coincidono: ${IT.pct(last.mean)} (da ${IT.pct(last.lo)} a ${IT.pct(last.hi)}) e ${IT.pct(lastI.mean)} (da ${IT.pct(lastI.lo)} a ${IT.pct(lastI.hi)}). Il dato ha sommerso il prior. La domanda della sicurezza ha una risposta diretta: dati i click, la probabilità che la quota vera superi ${art('il', IT.pct(TARGET_RATE, 0))} è ${IT.pct(c.aboveUniform[c.aboveUniform.length - 1])}. Serve un’altra sessione di formazione.`,
      ];
    },
    after: 'L’intervallo di credibilità si legge come si vorrebbe leggere ogni intervallo: dati il prior e i click, la quota vera sta lì dentro con probabilità 95%. Un intervallo di confidenza dice un’altra cosa, e la sezione 2.7 la mette a confronto.',
    chartTitle: 'La stima dei due analisti, giorno dopo giorno, con il suo intervallo al 95%',
    tableTitle: 'I posterior, giorno per giorno',
    cols: { day: 'Giorno', sent: 'E-mail', clicks: 'Click', uniform: 'Prior uniforme', informed: 'Prior informato', above: `P(quota > ${IT.pct(TARGET_RATE, 0)})` },
    interval: (r) => `${IT.pct(r.mean)} [${IT.pct(r.lo)}, ${IT.pct(r.hi)}]`,
  },
  tryBelief: {
    intro: 'Scegliete il prior, poi aggiungete le e-mail una alla volta, o dieci alla volta (simulate al 12% vero). La curva tratteggiata è il prior, quella punteggiata la verosimiglianza, la piena il posterior: si vede il posterior spostarsi dal prior verso i dati, e stringersi.',
    priorLabel: 'Prior',
    priors: { uniform: 'Uniforme, Beta(1, 1)', jeffreys: 'Jeffreys, Beta(1/2, 1/2)', informed: 'Informato, Beta(3, 17)', wrong: 'Sbagliato, Beta(40, 60)' },
    click: '+ ha cliccato',
    noClick: '+ non ha cliccato',
    ten: '+ 10 e-mail',
    result: (state, post, above) => (state.sent === 0
      ? `Nessuna e-mail ancora: il posterior è il prior, con media ${IT.pct(post.mean)}.`
      : `${IT.int(state.clicks)} click su ${IT.int(state.sent)} e-mail: posterior Beta(${IT.num(post.a, post.a % 1 ? 1 : 0)}, ${IT.num(post.b, post.b % 1 ? 1 : 0)}), media ${IT.pct(post.mean)}, intervallo al 95% da ${IT.pct(post.lo)} a ${IT.pct(post.hi)}, P(quota > ${IT.pct(TARGET_RATE, 0)}) = ${IT.pct(above)}.`),
    chartTitle: 'Prior, verosimiglianza e posterior della quota di click',
  },
  tryPrior: {
    intro: 'Trascinate i punti per disegnare il prior che volete: anche con due gobbe, anche a zero in un tratto. Il posterior si calcola su una griglia di 201 valori, moltiplicando punto per punto e normalizzando: nessuna formula coniugata, il motore così com’è. Con i dati di un giorno il disegno conta molto; con quelli di dieci giorni quasi niente. Con la tastiera: frecce a sinistra e a destra per scegliere un punto, in alto e in basso per spostarlo.',
    shapeLabel: 'Forme pronte',
    shapes: { flat: 'Piatto', informed: 'Come Beta(3, 17)', twoPeaks: 'Due gobbe', pessimist: 'Pessimista' },
    dataLabel: 'Dati',
    data: { day1: 'Il primo giorno', days3: 'Tre giorni', days10: 'Dieci giorni' },
    editorLabel: 'Il prior da disegnare: undici punti trascinabili, da 0 a 1',
    handle: (i, h) => `punto ${i + 1} di 11, quota ${IT.num(i / 10, 1)}, altezza ${IT.num(h, 2)}`,
    result: (g, flat) => `${IT.int(g.clicks)} click su ${IT.int(g.sent)}: media a posteriori ${IT.pct(g.mean)}, intervallo al 95% da ${IT.pct(g.lo)} a ${IT.pct(g.hi)}. Con il prior piatto sarebbe ${IT.pct(flat.mean)}, da ${IT.pct(flat.lo)} a ${IT.pct(flat.hi)}.`,
    chartTitle: 'Il prior disegnato, la verosimiglianza e il posterior sulla griglia',
  },
  frequentist: {
    intro: [
      `Gli stessi click, due domande diverse. L’intervallo di credibilità bayesiano risponde a: dati questi click, dove sta la quota vera? L’intervallo di confidenza frequentista risponde a: se ripetessi la campagna tante volte, quante volte il mio metodo prenderebbe la quota vera? Il 95% del primo è una probabilità sulla quota; quello del secondo è una proprietà della procedura, che una volta calcolato l’intervallo contiene la quota vera oppure no.`,
      `Per confrontarli si guarda la copertura: la probabilità, quando la quota vera è p, che l’intervallo calcolato dai dati la contenga. Con ${IT.int(COVERAGE_N)} e-mail (un giorno di campagna) si calcola esattamente, sommando le probabilità binomiali dei ${IT.int(COVERAGE_N + 1)} risultati possibili, senza simulare. I metodi: Wald (la formula dei manuali, p̂ ± 1,96 √(p̂(1 - p̂)/n)), Wilson (1927, l’inverso del test del punteggio), Clopper-Pearson (1934, esatto con la binomiale) e Jeffreys, l’intervallo di credibilità del prior Beta(1/2, 1/2).`,
    ],
    paras: (cov) => {
      const S = cov.summary;
      return [
        `Wald copre in media ${art('il', IT.pct(S.wald.mean))} invece del 95%, e per quote piccole crolla: a p = ${IT.pct(S.wald.minAt, 1)} ${art('il', IT.pct(S.wald.min))}, perché con zero click l’intervallo è [0, 0]. Clopper-Pearson non scende mai sotto il 95% (minimo ${IT.pct(S.clopper.min)}), ma per riuscirci copre in media ${art('il', IT.pct(S.clopper.mean))} ed è il più largo (${IT.pct(S.clopper.width)} contro ${IT.pct(S.wilson.width)} di Wilson). Wilson (${IT.pct(S.wilson.mean)} in media) e Jeffreys (${IT.pct(S.jeffreys.mean)}) oscillano intorno al 95%.`,
        'L’intervallo bayesiano di Jeffreys, che nasce da una probabilità sulla quota, ha dunque anche una buona copertura frequentista: Brown, Cai e DasGupta (2001) lo raccomandano insieme a Wilson al posto di Wald. È un primo assaggio del ponte della sezione 2.11: quando i dati crescono, i due modi di ragionare danno gli stessi intervalli.',
      ];
    },
    simulation: (s) => `Le stesse coperture, simulate su ${IT.int(s.runs)} campagne alla quota vera ${art('del', IT.pct(s.p, 0))}: ${['wald', 'wilson', 'clopper', 'jeffreys'].map((m) => `${it.names.methods[m]} ${IT.pct(s.hits[m] / s.runs)} (esatta ${IT.pct(s.exact[m])})`).join(', ')}.`,
    chartTitle: `La copertura esatta degli intervalli al 95% con ${COVERAGE_N} e-mail, al variare della quota vera`,
    chartNote: 'Wald esce dal grafico per le quote più piccole: scende fino a quanto dice la tabella.',
    tableTitle: 'I quattro metodi a confronto',
    cols: { method: 'Metodo', mean: 'Copertura media', min: 'Copertura minima', at: 'Dove', width: 'Ampiezza media' },
  },
  spam: {
    intro: [
      'Il motore bayesiano più usato della sicurezza informatica è il filtro antispam: Sahami e colleghi lo proposero nel 1998, Paul Graham lo rese famoso nel 2002 con «A Plan for Spam». Ogni parola è una prova, e il filtro somma i loro pesi.',
    ],
    source: (d) => `I dati: la ${d.dataset}, raccolta da Almeida, Gómez Hidalgo e Yamakami: ${IT.int(d.messages)} SMS in inglese, etichettati come spam o legittimi. Licenza ${d.license}, che chiede di citare la fonte: ${d.paper}.`,
    links: { dataset: 'La raccolta (UCI)', paper: 'L’articolo' },
    paras: (m) => {
      const c = m.matrix;
      return [
        `Il file ripete ${IT.int(m.corpus.repeated)} messaggi: il filtro li conta una volta sola, perché lo stesso messaggio nell’addestramento e nella prova gonfierebbe l’accuratezza. Restano ${IT.int(m.corpus.docs.length)} messaggi distinti; tre su dieci, per posizione, servono da prova (${IT.int(m.corpus.test.length)}), gli altri ${IT.int(m.corpus.train.length)} per imparare. Le parole sono le sequenze di lettere e cifre, in minuscolo, più il simbolo della sterlina.`,
        `Il modello è il naive Bayes multinomiale: per ogni parola, la sua frequenza nello spam e nei messaggi legittimi dell’addestramento, con il correttivo di Laplace (+1) per le parole mai viste in una delle due classi. «Naive» perché tratta le parole come indipendenti data la classe, cosa falsa («free» e «prize» viaggiano insieme), ma che rende il motore una somma. Il prior è la quota di spam dell’addestramento, ${IT.pct(m.trainSpamShare)}.`,
        `Sui ${IT.int(c.n)} messaggi di prova il filtro ferma ${IT.int(c.tp)} spam su ${IT.int(c.tp + c.fn)} e scambia per spam ${IT.int(c.fp)} messaggi legittimi su ${IT.int(c.fp + c.tn)}: accuratezza ${IT.pct(c.accuracy)}, precisione ${IT.pct(c.precision)}, richiamo ${IT.pct(c.recall)}, area sotto la curva ROC ${IT.num(m.auc, 3)}. La regola banale che dichiara tutto legittimo arriva ${art('al', IT.pct(m.majority.accuracy))}: il test di McNemar sui messaggi in cui i due disaccordano dà p ≈ ${IT.p(m.mcnemar.p, m.mcnemar.log10p)}.`,
      ];
    },
    matrixTitle: 'La matrice di confusione sui messaggi di prova',
    matrixRows: { spam: 'Spam vero', ham: 'Legittimo vero' },
    matrixCols: { truth: '', spam: 'Il filtro dice spam', ham: 'Il filtro dice legittimo' },
    wordsTitle: 'Le parole che pesano di più (almeno 10 volte nell’addestramento)',
    wordsCols: { spam: 'Verso lo spam', spamWeight: 'Peso', ham: 'Verso il legittimo', hamWeight: 'Peso' },
    chartTitle: 'I messaggi di prova per log-quote di spam: a destra di 0 il filtro dice spam',
    tableTitle: 'I messaggi di prova per intervallo di log-quote',
    binCols: { bin: 'Log-quote', spam: 'Spam', ham: 'Legittimi' },
    bin: (b) => (b.to === Infinity ? `≥ ${IT.int(b.from)}` : `da ${IT.int(b.from)} a ${IT.int(b.to)}`),
    fieldLabel: 'Scrivete un messaggio, in inglese',
    baseLabel: 'Casella',
    bases: { train: 'Come l’addestramento', one: 'Uno spam su 100' },
    result: (sc) => `P(spam) = ${IT.pct(sc.posterior, 2)} (log-quote ${IT.num(sc.logOdds, 2)}, ${IT.int(sc.words)} ${sc.words === 1 ? 'parola' : 'parole'}).`,
    partsTitle: 'Il contributo di ogni parola',
    partsCols: { token: 'Parola', count: 'Volte', weight: 'Peso (log)' },
    unknown: 'mai vista: non pesa',
    after: 'Cambiate la casella: lo stesso messaggio, in una casella dove lo spam è raro, ha un posterior più basso. È il tasso di base della sezione 2.3, che entra dal prior.',
  },
  kdd: {
    intro: (d) => `Lo stesso motore sulle connessioni di NSL-KDD, i dati dell’Homework #6: dal protocollo, dal servizio e dal flag, la connessione è un attacco? I dati: ${d.dataset}, ${IT.int(d.records)} connessioni; vanno citati il dataset e l’articolo ${d.paper}.`,
    paras: (k) => [
      `Tre connessioni su dieci, per posizione, servono da prova (${IT.int(k.test)}), le altre ${IT.int(k.train)} per imparare. Il naive Bayes categoriale moltiplica il prior (gli attacchi sono ${art('il', IT.pct(k.classes[1] / (k.classes[0] + k.classes[1])))} dell’addestramento) per tre rapporti di verosimiglianza, uno per campo, con il correttivo di Laplace. Accuratezza ${IT.pct(k.naive.accuracy)}, richiamo sugli attacchi ${IT.pct(k.naive.recall)}, falsi positivi ${IT.pct(k.naive.fpr)}, area sotto la curva ROC ${IT.num(k.auc, 3)}.`,
      `L’Homework #6 ha mostrato che protocollo, servizio e flag sono fortemente dipendenti: l’ipotesi «naive» è falsa anche qui. Il confronto con il Bayes esatto lo misura. La tabella completa delle ${IT.int(k.cells)} combinazioni viste nell’addestramento, con un prior Beta(1, 1) in ogni cella, non fa ipotesi di indipendenza e arriva ${art('al', IT.pct(k.joint.accuracy))} (le ${IT.int(k.unseen)} connessioni di prova con una combinazione mai vista prendono il prior). Il naive Bayes conta due volte le prove che dicono la stessa cosa, e i suoi posterior sono troppo sicuri, ma la decisione cambia poco. Tutti e due battono di molto la regola che dichiara tutto un attacco (${IT.pct(k.majority.accuracy)}; McNemar, p ≈ ${IT.p(k.mcnemar.p, k.mcnemar.log10p)}).`,
    ],
    tableTitle: 'Tre classificatori sulle connessioni di prova',
    cols: { model: 'Classificatore', accuracy: 'Accuratezza', precision: 'Precisione', recall: 'Richiamo', fpr: 'Falsi positivi' },
    models: { naive: 'Naive Bayes (tre pesi)', joint: 'Tabella completa (Bayes esatto)', majority: 'Sempre «attacco»' },
    chooseTitle: 'Scegliete una connessione',
    labels: { protocol: 'Protocollo', service: 'Servizio', flag: 'Flag' },
    partsCols: { feature: 'Campo', value: 'Valore', attacks: 'Attacchi', normals: 'Normali', weight: 'Peso (log)' },
    features: { protocol: 'protocollo', service: 'servizio', flag: 'flag' },
    result: (e) => `Naive Bayes: P(attacco) = ${IT.pct(e.posterior, 2)}. ${e.joint.posterior === null ? 'La tabella completa non ha mai visto questa combinazione: resta il prior.' : `La tabella completa ha visto questa combinazione ${IT.int(e.joint.attacks + e.joint.normals)} volte, ${IT.int(e.joint.attacks)} come attacco: P(attacco) = ${IT.pct(e.joint.posterior, 2)}.`}`,
  },
  convergence: {
    intro: [
      'Una successione di variabili casuali X_1, X_2, ... può avvicinarsi a un limite X in modi diversi, e non equivalenti. Le quattro definizioni della consegna, per ogni ε > 0:',
    ],
    formulas: [
      'in probabilità:          P(|X_n - X| > ε) → 0',
      'quasi certa:              P(lim X_n = X) = 1',
      'in media quadratica:     E[(X_n - X)²] → 0',
      'in distribuzione:        F_n(x) → F(x) in ogni punto di continuità di F',
    ].join('\n'),
    after: [
      `L’esempio che attraversa la sezione: una regola dell’IDS dà un falso allarme ${art('sul', IT.pct(FALSE_ALARMS.rate, 0))} delle connessioni normali, e F̂_n, la quota di falsi allarmi nelle prime n connessioni, stima quel ${IT.pct(FALSE_ALARMS.rate, 0)}. Ogni forma di convergenza dice qualcosa di diverso su quanto ci si può fidare di F̂_n; la banda di tolleranza è di un punto, ε = ${IT.plain(FALSE_ALARMS.epsilon)}.`,
    ],
  },
  probability: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'La convergenza in probabilità dice che, fissato n abbastanza grande, una deviazione più larga di ε è improbabile. La legge debole dei grandi numeri la garantisce per la media di valori indipendenti con varianza finita, e la dimostrazione sta in una riga, con la disuguaglianza di Chebyshev: P(|F̂_n - p| > ε) ≤ Var(F̂_n)/ε² = p(1 - p)/(n ε²) → 0.',
        `Qui la probabilità si calcola anche esattamente, con la binomiale: ${IT.pct(at(100).exact)} dopo 100 connessioni, ${IT.pct(at(1000).exact)} dopo 1.000, ${IT.prob(at(10000).exact)} dopo 10.000. Il grafico la confronta con la quota delle ${IT.int(PATHS.count)} regole simulate fuori dalla banda e con il limite di Chebyshev, che è vero ma largo.`,
      ];
    },
    after: 'La convergenza in probabilità parla di un n alla volta: dopo 1.000 connessioni la stima è quasi sempre buona. Non dice nulla sulla storia di una singola regola, che potrebbe uscire dalla banda ancora molte volte. Di questo si occupa la convergenza quasi certa.',
    chartTitle: 'Fuori dalla banda di un punto: le regole simulate, la probabilità esatta e il limite di Chebyshev',
    tableTitle: 'Le regole fuori dalla banda',
    cols: { n: 'n', simulated: 'Simulate', exact: 'Esatta', chebyshev: 'Chebyshev' },
  },
  almost: {
    paras: (paths) => {
      const c = paths.checks.find((x) => x.n === 1000);
      return [
        'La convergenza quasi certa chiede di più: che quasi ogni traiettoria, presa per intero, finisca dentro la banda e non ne esca più. In formule equivale a P(sup_{m ≥ n} |X_m - X| > ε) → 0: non basta che a ogni n la deviazione sia improbabile, deve essere improbabile che ce ne sia ancora una qualsiasi, da n in poi. La legge forte dei grandi numeri (Kolmogorov, 1933) la garantisce per la media di valori indipendenti e identicamente distribuiti con media finita.',
        `Le ${IT.int(paths.count)} regole simulate lo mostrano: dopo ${IT.int(1000)} connessioni ${art('il', IT.pct(c.outside))} è fuori dalla banda, ma ${art('il', IT.pct(c.after))} ne uscirà ancora almeno una volta prima di ${IT.int(paths.length)} (il sup è tagliato lì). Anche questa quota va a zero: a ${IT.int(10000)} connessioni nessuna regola è più fuori.`,
        'Lo strumento per decidere è il lemma di Borel-Cantelli. Se la somma delle probabilità di eventi A_n è finita, quasi certamente se ne verificano solo un numero finito; se gli eventi sono indipendenti e la somma è infinita, se ne verificano infiniti. Con X_n di Bernoulli(1/n) indipendenti la somma di 1/n diverge: gli 1 non finiscono mai, e X_n non converge quasi certamente a 0, anche se P(X_n = 1) = 1/n → 0. Con Bernoulli(1/n²) la somma converge (vale π²/6): dopo un po’ solo zeri.',
      ];
    },
    after: 'Per una regola dell’IDS in produzione è la differenza fra «oggi la stima è quasi certamente buona» e «da un certo giorno in poi la stima resterà buona per sempre».',
    chartTitle: '20 delle 1.000 regole: la quota di falsi allarmi, connessione dopo connessione, e la banda di un punto',
    chart2Title: 'Fuori dalla banda a n, e fuori almeno un’altra volta dopo n',
    tableTitle: 'Le due quote, per n',
    cols: { n: 'n', outside: 'Fuori a n', after: 'Fuori ancora dopo n' },
  },
  trySequences: {
    intro: 'Scegliete una successione: il grafico ne mostra 12 traiettorie fino a n = 1.000, la tabella i suoi numeri esatti e quali convergenze valgono. Le traiettorie di Bernoulli(1/n) hanno 1 sparsi per sempre; quelle di Bernoulli(1/n²) si spengono subito; la «macchina da scrivere» passa su ogni punto in ogni blocco; il picco n·1{U < 1/n} si spegne presto, ma la sua media quadratica esplode.',
    chooseLabel: 'Successione',
    names: { mean: 'Media di monete - 1/2', bern1: 'Bernoulli(1/n)', bern2: 'Bernoulli(1/n²)', typewriter: 'Macchina da scrivere', spike: 'Picco n·1{U < 1/n}', flip: '(-1)^n Z' },
    describe: {
      mean: 'La media di n lanci di una moneta onesta, meno 1/2: converge a 0 in tutti i sensi.',
      bern1: 'Valori indipendenti, 1 con probabilità 1/n: in probabilità e in L2 sì, quasi certamente no.',
      bern2: 'Valori indipendenti, 1 con probabilità 1/n²: tutte le convergenze.',
      typewriter: 'L’indicatore di un intervallo di lunghezza 2^-k che scorre su [0, 1]: in probabilità e in L2 sì, ma ogni traiettoria vale 1 infinite volte.',
      spike: 'Vale n se U < 1/n, altrimenti 0: quasi certamente e in probabilità sì, in L2 no, perché E[X_n²] = n.',
      flip: 'Z normale standard, cambiata di segno a ogni passo: la legge è sempre N(0, 1), quindi converge in distribuzione a Z; ma |X_n - Z| = 2|Z| a ogni n dispari.',
    },
    tableTitle: 'I numeri esatti della successione',
    cols: { n: 'n', deviation: `P(|X_n - X| > ${IT.plain(SEQUENCE_EPSILON)})`, l2: 'E[(X_n - X)²]', afterwards: 'Ancora fuori dopo n', simulated: 'Traiettorie ancora fuori' },
    modesTitle: 'Quali convergenze valgono',
    modes: { probability: 'In probabilità', as: 'Quasi certa', l2: 'In L2', distribution: 'In distribuzione' },
    holds: 'sì',
    fails: 'no',
    never: '1 (non finisce mai)',
    simulatedNote: 'L’ultima colonna conta le 12 traiettorie simulate ancora lontane dal limite dopo n, fino a n = 1.000.',
  },
  l2: {
    paras: (paths) => {
      const c = paths.checks.find((x) => x.n === 1000);
      return [
        `In media quadratica la distanza conta con il suo quadrato: E[(F̂_n - p)²] → 0. Per la media di valori indipendenti è la varianza, p(1 - p)/n: per dimezzare l’errore servono quattro volte i dati. Le ${IT.int(paths.count)} regole simulate la seguono: a n = 1.000 l’errore quadratico medio è ${IT.sci(c.mse, 2)}, quello esatto ${IT.sci(c.exactMse, 2)}.`,
        'La convergenza in media quadratica implica quella in probabilità: per la disuguaglianza di Markov, P(|X_n - X| > ε) ≤ E[(X_n - X)²]/ε². Il contrario non vale, e nemmeno il legame con la convergenza quasi certa vale in un senso o nell’altro. Il picco Y_n = n·1{U < 1/n} va a 0 quasi certamente (appena n supera 1/U resta 0 per sempre), ma E[Y_n²] = n esplode: rari valori enormi bastano a rovinare la media quadratica, come una sola connessione gigante rovina la media dei byte (sezione 1.10). Bernoulli(1/n), al contrario, converge in L2 (E[X_n²] = 1/n) ma non quasi certamente.',
      ];
    },
    chartTitle: 'L’errore quadratico medio delle 1.000 regole e p(1 - p)/n, su assi logaritmici',
    tableTitle: 'L’errore quadratico medio, per n',
    cols: { n: 'n', simulated: 'Simulato', exact: 'p(1 - p)/n' },
    counterTitle: 'Due controesempi: quasi certa senza L2, L2 senza quasi certa',
    counterCols: { n: 'n', spikeP: 'Picco: P(Y_n ≠ 0)', spikeL2: 'Picco: E[Y_n²]', bernP: 'Bernoulli(1/n): P(X_n ≠ 0)', bernL2: 'Bernoulli(1/n): E[X_n²]' },
  },
  distribution: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'La convergenza in distribuzione è la più debole: chiede solo che la funzione di ripartizione di X_n si avvicini a quella di X, nei punti dove questa è continua. Non dice nulla sui valori di X_n e X sullo stesso esito: X_n = (-1)^n Z ha sempre la legge N(0, 1) di Z, quindi converge a Z in distribuzione, ma non si avvicina mai a Z. Quando il limite è una costante, convergere in distribuzione equivale a convergere in probabilità: per questo la legge dei grandi numeri si può dire in tutti e due i modi, F̂_n → p.',
        'Il teorema del limite centrale non parla del valore di F̂_n ma della forma del suo errore: √n (F̂_n - p)/σ converge in distribuzione alla normale standard. Più in generale, la somma standardizzata di n valori indipendenti con varianza finita. Il teorema di Berry-Esseen dice anche quanto in fretta: la distanza di Kolmogorov dalla normale (la massima differenza fra le due funzioni di ripartizione) non supera C ρ/(σ³ √n), con ρ = E|X - μ|³ e, per valori identicamente distribuiti, C = 0,4748 (Shevtsova, 2011).',
        `Le distanze del grafico sono esatte, non simulate: per i falsi allarmi la legge della somma è la binomiale, per i tempi fra due allarmi (esponenziali) è la Gamma. I falsi allarmi, rari e quindi asimmetrici, convergono lentamente: ${IT.num(at(10).bernoulli, 3)} a n = 10, ${IT.num(at(100).bernoulli, 3)} a 100, ${IT.num(at(1000).bernoulli, 3)} a 1.000. Gli esponenziali molto più in fretta: ${IT.num(at(10).exponential, 3)}, ${IT.num(at(100).exponential, 4)}, ${IT.num(at(1000).exponential, 4)}. Entrambi stanno sotto il loro limite di Berry-Esseen, e lo seguono come 1/√n.`,
      ];
    },
    tests: (c) => `Tre test di Kolmogorov-Smirnov su ${IT.int(CLT_REPS)} somme simulate (riepilogati nella sezione 4): ${IT.int(c.exponential.n)} esponenziali standardizzati contro la normale, D = ${IT.num(c.exponential.D, 4)}, p ≈ ${IT.p(c.exponential.p)}: con tanti campioni la regola pratica «n ≥ 30» non basta per una legge asimmetrica (la distanza esatta è ${IT.num(c.exponential.exact, 4)}). ${IT.int(c.uniform.n)} uniformi, la vecchia ricetta per generare valori normali: D = ${IT.num(c.uniform.D, 4)}, p = ${IT.p(c.uniform.p)}. La media di ${IT.int(c.cauchy.n)} valori di Cauchy contro la legge di Cauchy stessa: D = ${IT.num(c.cauchy.D, 4)}, p = ${IT.p(c.cauchy.p)}.`,
    chartTitle: 'Distanza di Kolmogorov dalla normale, esatta, e limite di Berry-Esseen, su assi logaritmici',
    tableTitle: 'Le distanze esatte e i limiti, per n',
    cols: { n: 'n', bernoulli: 'Falsi allarmi', bernoulliBound: 'Limite', exponential: 'Esponenziali', exponentialBound: 'Limite' },
  },
  tryClt: {
    intro: `Scegliete la legge e n: l’istogramma mostra ${IT.int(5000)} somme standardizzate, la curva la legge limite. Con n = 1 si vede la legge di partenza; crescendo n, la forma diventa la campana. Cauchy non ha varianza: le sue medie restano Cauchy, per ogni n.`,
    lawLabel: 'Legge',
    laws: { bernoulli: 'Falsi allarmi (Bernoulli 3%)', exponential: 'Tempi fra allarmi (esponenziale)', uniform: 'Uniforme', cauchy: 'Cauchy' },
    nLabel: 'n',
    result: (t, state) => `n = ${IT.int(state.n)}: distanza di Kolmogorov dalla ${t.cauchy ? 'legge di Cauchy' : 'normale'} ${IT.num(t.test.D, 4)}, test di Kolmogorov-Smirnov p = ${IT.p(t.test.p)}${t.outside > 0 ? `; ${art('il', IT.pct(t.outside))} delle somme cade fuori dal grafico` : ''}.`,
    chartTitle: 'Le somme standardizzate e la legge limite',
  },
  tryHash: {
    intro: 'Un servizio dà a ogni sessione un identificativo casuale di pochi bit. Quante sessioni bastano perché due abbiano lo stesso? È il paradosso del compleanno: con N valori possibili, la probabilità di una collisione fra m identificativi è 1 - (1 - 1/N)(1 - 2/N)...(1 - (m - 1)/N), e diventa 1/2 intorno a 1,18 √N. Lanciate le prove: la stima Monte Carlo converge alla probabilità esatta (legge dei grandi numeri), con oscillazioni che si stringono come 1/√r dentro la banda del limite centrale.',
    bitsLabel: 'Bit',
    factorLabel: 'Sessioni',
    factors: (m) => `${IT.int(m)}`,
    add100: '+ 100 prove',
    add1000: '+ 1.000 prove',
    result: (state, exact, m, bits) => (state.trials === 0
      ? `${IT.int(m)} identificativi di ${bits} bit: probabilità esatta di una collisione ${IT.pct(exact, 2)}.`
      : `${IT.int(state.trials)} prove, ${IT.int(state.hits)} con una collisione: stima ${IT.pct(state.hits / state.trials, 2)}, esatta ${IT.pct(exact, 2)}, scarto ${IT.num(Math.abs(state.hits / state.trials - exact) / Math.sqrt((exact * (1 - exact)) / state.trials), 2)} errori standard.`),
    thirtyTwo: (m) => `Con 32 bit la metà delle volte si ha una collisione già a ${IT.int(m)} sessioni: pochi per un servizio vero.`,
    chartTitle: 'La stima della probabilità di collisione, prova dopo prova, e la banda al 95% intorno al valore esatto',
  },
  map: {
    paras: [
      'Le quattro convergenze sono legate da implicazioni che valgono sempre. Quasi certa implica in probabilità. In media quadratica implica in probabilità (Markov), e più in generale in L^p implica in L^q per q < p. In probabilità implica in distribuzione. Ogni altra freccia è falsa, e per ciascuna c’è un controesempio fra le successioni della prova della sezione 1.2.',
      'Due rovesci parziali valgono: la convergenza in distribuzione a una costante implica quella in probabilità; e da una successione che converge in probabilità si può sempre estrarne una che converge quasi certamente (Riesz). Con un dominio sulle code (uniforme integrabilità) la convergenza in probabilità torna anche in media.',
    ],
    tableTitle: 'Da un modo all’altro',
    cols: { from: 'Se converge', to: 'allora converge', holds: 'Vale?', counter: 'Controesempio' },
  },
  tryMap: {
    intro: 'Cliccate un modo di convergenza: si accendono in verde quelli che implica, in rosso quelli che non implica, ciascuno con il suo controesempio.',
    modes: { as: 'Quasi certa', l2: 'In media quadratica', probability: 'In probabilità', distribution: 'In distribuzione' },
    pick: 'Scegliete un modo per vedere che cosa implica.',
    result: (mode, list) => `${it.tryMap.modes[mode]} implica: ${list.holds.length ? listOf(list.holds.map((m) => it.tryMap.modes[m].toLowerCase()), 'e') : 'solo se stessa'}. Non implica: ${list.fails.length ? listOf(list.fails.map((f) => `${it.tryMap.modes[f.mode].toLowerCase()} (controesempio: ${it.trySequences.names[f.counter]})`), 'e') : 'niente'}.`,
    diagramLabel: 'La mappa delle implicazioni fra i quattro modi di convergenza',
  },
  heavy: {
    paras: (b) => [
      'La legge dei grandi numeri chiede una media finita; il limite centrale con la sua √n, una varianza finita. Quando mancano, o quando le code sono così pesanti che la varianza esiste solo sulla carta, √n non basta più. La legge di Cauchy non ha né l’una né l’altra: la media di n suoi valori ha di nuovo la legge di Cauchy, larga quanto un valore solo. Le medie del grafico saltano per sempre, perché ogni tanto arriva un valore enorme che le sposta.',
      `I byte inviati dalle ${IT.int(b.n)} connessioni di NSL-KDD hanno media e varianza finite, ma code pesantissime: media ${IT.int(b.mean)} byte, mediana ${IT.int(b.median)}, massimo ${IT.int(b.max)}; ${IT.int(b.zeros)} connessioni non inviano nulla, e le 10 più grandi portano ${art('il', IT.pct(b.top10))} di tutti i byte (la sola più grande ${art('il', IT.pct(b.top1))}). L’asimmetria vale ${IT.num(b.skewness, 1)}. Il teorema di Berry-Esseen promette una distanza dalla normale sotto 0,05 solo da ${IT.int(b.needed)} connessioni in su.`,
    ],
    bytes: (rows) => `Per vederlo si estraggono ${IT.int(BYTES_REPS)} campioni di n connessioni con ripetizione, e se ne standardizza la media con la media e la deviazione standard vere. Con n = 1.000 la distanza dalla normale è ancora ${IT.num(rows[2].D, 3)}, e ${art('il', IT.pct(rows[2].below))} delle medie cade sotto la media vera: quasi tutti i campioni non contengono le connessioni giganti, e i pochi che le contengono saltano lontano. Una soglia d’allarme costruita sulla normale per «i byte medi di 1.000 connessioni» sbaglierebbe di molto: meglio la mediana, i logaritmi o la teoria dei valori estremi.`,
    cauchyTitle: 'Otto medie di valori di Cauchy, valore dopo valore: non si fermano',
    factsTitle: 'I byte delle connessioni di NSL-KDD',
    facts: { mean: 'Media', median: 'Mediana', sd: 'Deviazione standard', max: 'Massimo', zeros: 'Connessioni senza byte', top10: 'Quota delle 10 più grandi', skewness: 'Asimmetria', ratio: 'ρ/σ³ di Berry-Esseen', needed: 'n per distanza < 0,05' },
    histTitle: 'Le medie standardizzate di 1.000 connessioni e la densità normale',
    tableTitle: 'Le medie di n connessioni, contro la normale',
    cols: { n: 'n', D: 'Distanza', p: 'p-value', below: 'Sotto la media vera', median: 'Mediana standardizzata' },
  },
  speed: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'La legge dei grandi numeri dice che la probabilità di sbagliare va a zero; per decidere quante connessioni servono bisogna sapere quanto in fretta. Chebyshev usa solo la varianza e scende come 1/n. Hoeffding (1963) usa il fatto che i valori stanno fra 0 e 1 e scende in modo esponenziale, 2 exp(-2 n ε²). Il limite centrale dà un’approssimazione, non un limite: 2 Φ(-ε √n/σ).',
        `Per i falsi allarmi ${art('al', IT.pct(FALSE_ALARMS.rate, 0))} con un punto di tolleranza, a n = 10.000 la probabilità esatta è ${IT.prob(at(10000).exact)}, Chebyshev dice ${IT.prob(at(10000).chebyshev)}, Hoeffding ${IT.prob(at(10000).hoeffding)}: qui Hoeffding è peggio di Chebyshev, perché non sa che la varianza p(1 - p) è piccola. A n = 100.000 l’esponenziale vince (${IT.prob(at(100000).hoeffding)} contro ${IT.prob(at(100000).chebyshev)}), mentre la probabilità vera è ${IT.prob(at(100000).exact)}. La normale segue la probabilità esatta da vicino, ma nelle code lontane può sbagliare di ordini di grandezza: lo dice Berry-Esseen, che controlla la distanza assoluta, non quella relativa.`,
      ];
    },
    chartTitle: 'P(|F̂_n - 3%| > 1 punto): esatta, i due limiti e la normale, su assi logaritmici',
    tableTitle: 'La probabilità di una deviazione e i suoi limiti, per n',
    cols: { n: 'n', exact: 'Esatta', chebyshev: 'Chebyshev', hoeffding: 'Hoeffding', normal: 'Normale' },
  },
  bvm: {
    paras: (rows) => {
      const first = rows[0];
      const at = (n) => rows.find((r) => r.n === n);
      const last = rows[rows.length - 1];
      return [
        `Le due parti della consegna si incontrano qui. Due analisti guardano la stessa lunga campagna di phishing, fino a ${IT.int(last.n)} e-mail alla quota vera ${art('del', IT.pct(CAMPAIGN.rate, 0))}: uno con il prior uniforme, l’altro con un prior sbagliato e sicuro di sé, Beta(${PRIORS.wrong.join(', ')}), centrato ${art('sul', IT.pct(PRIORS.wrong[0] / (PRIORS.wrong[0] + PRIORS.wrong[1]), 0))} e forte quanto ${IT.int(PRIORS.wrong[0] + PRIORS.wrong[1])} e-mail. Dopo ${IT.int(first.n)} e-mail le loro medie sono ${IT.pct(first.uniform.mean)} e ${IT.pct(first.wrong.mean)}; dopo ${IT.int(1000)}, ${IT.pct(at(1000).uniform.mean)} e ${IT.pct(at(1000).wrong.mean)}; dopo ${IT.int(last.n)}, ${IT.pct(last.uniform.mean)} e ${IT.pct(last.wrong.mean)}.`,
        `Il posterior converge alla quota vera (consistenza, Doob 1949): quasi certamente, come la media dei click. E diventa normale: il teorema di Bernstein-von Mises dice che, con n grande, il posterior è circa N(θ̂, θ̂(1 - θ̂)/n), qualunque prior regolare si sia usato. La distanza di Kolmogorov fra ogni posterior e la sua normale scende come 1/√n (${IT.num(at(100).uniform.distance, 4)} a n = 100, ${IT.num(last.uniform.distance, 4)} a ${IT.int(last.n)}). Per questo, con tanti dati, l’intervallo di credibilità e quello di confidenza coincidono, e il prior smette di contare. Con pochi dati, come nel primo giorno della sezione 2.6, conta eccome.`,
      ];
    },
    chartTitle: 'La media a posteriori dei due analisti, con ±1,96 deviazioni standard, al crescere delle e-mail',
    chart2Title: 'La distanza di Kolmogorov fra ogni posterior e la sua approssimazione normale',
    tableTitle: 'I due posterior, per n',
    cols: { n: 'n', clicks: 'Click', uniform: 'Prior uniforme', wrong: 'Prior sbagliato', dUniform: 'Distanza (uniforme)', dWrong: 'Distanza (sbagliato)' },
    pair: (x) => `${IT.pct(x.mean, 2)} ± ${IT.pct(1.96 * x.sd, 2)}`,
  },
  roles: {
    intro: 'I quattro modi di convergenza sono la lingua in cui si scrivono i teoremi limite. La tabella dice quale modo usa ciascuno, sotto quali condizioni, e dove la pagina lo mostra.',
    tableTitle: 'I teoremi limite e i loro modi di convergenza',
    cols: { theorem: 'Teorema', statement: 'Che cosa converge', mode: 'Modo', condition: 'Condizioni', where: 'Sezione' },
    rows: [
      { theorem: 'Legge debole dei grandi numeri', statement: 'X̄_n → μ', mode: 'in probabilità', condition: 'indipendenti con varianza finita (Chebyshev); basta la media finita (Khinchin)', where: '1.1' },
      { theorem: 'Legge forte dei grandi numeri', statement: 'X̄_n → μ', mode: 'quasi certa', condition: 'indipendenti e identicamente distribuite, con media finita (Kolmogorov)', where: '1.2' },
      { theorem: 'Legge dei grandi numeri in L²', statement: 'E[(X̄_n - μ)²] = σ²/n → 0', mode: 'in media quadratica', condition: 'non correlate, con varianza finita', where: '1.3' },
      { theorem: 'Limite centrale', statement: '√n (X̄_n - μ)/σ → N(0, 1)', mode: 'in distribuzione', condition: 'indipendenti e identicamente distribuite, con varianza finita (Lindeberg-Lévy)', where: '1.4' },
      { theorem: 'Berry-Esseen', statement: 'sup |F_n - Φ| ≤ C ρ/(σ³ √n)', mode: 'velocità in distribuzione', condition: 'terzo momento finito', where: '1.4, 1.11' },
      { theorem: 'Legge dei grandi numeri in distribuzione', statement: 'X̄_n → μ, una costante', mode: 'in distribuzione, che qui equivale a in probabilità', condition: 'come la legge debole', where: '1.4' },
    ],
    after: 'Le due leggi dicono che la media si avvicina alla media vera: la debole a ogni n fissato, la forte lungo ogni traiettoria, la versione in L² anche in media. Il limite centrale dice come si distribuisce l’errore che resta, e quindi quanto è grande: circa σ/√n. È la combinazione che serve all’inferenza. La legge dei grandi numeri garantisce che la stima va nel posto giusto; il limite centrale dà la forma della sua incertezza, con cui si costruiscono intervalli e test.',
  },
  results: {
    intro: 'Molti risultati della statistica sono teoremi di convergenza travestiti. Quattro, con i numeri dei falsi allarmi e dei tempi fra allarmi.',
    consistency: 'Consistenza. Uno stimatore è consistente se converge al parametro: debolmente (in probabilità) o fortemente (quasi certamente). La quota di falsi allarmi F̂_n è consistente in tutti e due i sensi, per le due leggi dei grandi numeri; e lo è ogni funzione continua di uno stimatore consistente (teorema della mappa continua), come 1/X̄ per un tasso.',
    slutsky: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return `Slutsky (1925). Se X_n converge in distribuzione a X e Y_n in probabilità a una costante c, allora X_n + Y_n converge a X + c e X_n Y_n a c X. È ciò che rende normale la statistica t: nel limite centrale σ è quella vera, nella pratica la si stima, e la stima converge in probabilità, quindi il limite non cambia. Ma è un risultato asintotico. Per i falsi allarmi al ${IT.pct(FALSE_ALARMS.rate, 0)} la statistica t, con σ stimata, dista dalla normale ${IT.num(at(30).t, 3)} a n = 30, contro ${IT.num(at(30).z, 3)} con σ nota; a n = 1.000 la differenza si è quasi chiusa (${IT.num(at(1000).t, 4)} contro ${IT.num(at(1000).z, 4)}).`;
    },
    delta: (d100, d1000) => `Il metodo delta. Se √n (θ̂ - θ) converge a N(0, σ²) e g è derivabile, allora √n (g(θ̂) - g(θ)) converge a N(0, g'(θ)² σ²): l’errore di una funzione della stima si ottiene derivando. Per le log-quote ln(p/(1 - p)) la derivata è 1/(p(1 - p)), e la deviazione standard approssimata è 1/√(n p(1 - p)): ${IT.num(d1000.delta, 4)} a n = 1.000, contro ${IT.num(d1000.exact, 4)} esatta. A n = 100 lo scarto è più grande (${IT.num(d100.delta, 3)} contro ${IT.num(d100.exact, 3)}), e ${art('il', IT.pct(d100.excluded, 1))} delle volte, con zero allarmi, le log-quote non esistono nemmeno.`,
    gc: (rows) => {
      const first = rows[0];
      const last = rows[rows.length - 1];
      return `Glivenko-Cantelli (1933). La funzione di ripartizione empirica F_n converge a quella vera uniformemente, quasi certamente: sup |F_n - F| → 0. Kolmogorov ne diede anche la velocità: √n sup |F_n - F| converge in distribuzione a una legge che porta il suo nome, la base del test di Kolmogorov-Smirnov usato in tutta la pagina. Su ${IT.int(GC_REPS)} campioni di tempi fra allarmi la distanza media scende da ${IT.num(first.meanD, 3)} (n = ${IT.int(first.n)}) a ${IT.num(last.meanD, 4)} (n = ${IT.int(last.n)}), mentre √n per la distanza resta fra ${IT.num(Math.min(...rows.map((r) => r.meanScaled)), 2)} e ${IT.num(Math.max(...rows.map((r) => r.meanScaled)), 2)}, vicino alla media della legge di Kolmogorov, ${IT.num(KOLMOGOROV_MEAN, 3)}.`;
    },
    mle: (rows) => {
      const at = (n) => rows.find((r) => r.n === n).mle;
      return `La normalità dello stimatore di massima verosimiglianza. Sotto condizioni di regolarità √n (θ̂ - θ) converge a N(0, 1/I(θ)), con I l’informazione di Fisher, e la varianza 1/(n I(θ)) è la più piccola possibile per uno stimatore non distorto (Cramér-Rao). Per il tasso λ degli allarmi, stimato dai tempi fra l’uno e l’altro con λ̂ = n/S_n, la legge è nota esattamente: a n = 30 dista dalla normale ${IT.num(at(30).distance, 3)}, è distorto ${art('del', IT.pct(at(30).bias, 1))} e ha una varianza ${IT.num(at(30).efficiency, 2)} volte il limite di Cramér-Rao; a n = 1.000 la distanza è ${IT.num(at(1000).distance, 4)} e la varianza tocca il limite. È il lato frequentista del teorema di Bernstein-von Mises (sezione 2.11).`;
    },
    chartTitle: 'Distanza di Kolmogorov dalla normale: σ nota, σ stimata (Slutsky) e stimatore di massima verosimiglianza, su assi logaritmici',
    tableTitle: 'Le tre distanze, per n',
    cols: { n: 'n', z: 'Z, σ nota', t: 't, σ stimata', mle: 'MLE del tasso', bias: 'Distorsione del MLE', efficiency: 'Varianza / Cramér-Rao' },
    deltaTitle: 'Il metodo delta sulle log-quote',
    deltaCols: { n: 'n', exact: 'Deviazione standard esatta', delta: 'Metodo delta', excluded: 'Senza log-quote (k = 0)' },
    gcTitle: 'Glivenko-Cantelli: la distanza fra la funzione di ripartizione empirica e quella vera',
    gcCols: { n: 'n', meanD: 'Distanza media', meanScaled: '√n per la distanza', over: 'Oltre 1,358 (atteso 5%)' },
  },
  root: {
    paras: (sizes) => [
      'La somma di n valori ha varianza Var(S_n) = Σ Var(X_i) + 2 Σ_{i<j} Cov(X_i, X_j). Se i valori sono indipendenti, o anche solo non correlati, le covarianze sono zero e le varianze si sommano: Var(S_n) = n σ². La deviazione standard, la radice della varianza, cresce quindi come σ √n e non come n; dividendo per n, la media ha deviazione standard σ/√n, l’errore standard.',
      `Ecco perché √n è ovunque. Nella legge dei grandi numeri l’errore della media scende come 1/√n. Nel limite centrale bisogna moltiplicare l’errore proprio per √n per avere una legge che non collassa e non esplode (la prova qui sotto lo fa vedere). Nell’inferenza ogni intervallo è largo circa 2σ/√n, ogni statistica z o t divide per σ/√n, e il campione necessario cresce con il quadrato della precisione: per stimare il ${IT.pct(FALSE_ALARMS.rate, 0)} di falsi allarmi a più o meno un punto, al 95%, bastano ${IT.int(sizes[0])} connessioni; a mezzo punto ne servono ${IT.int(sizes[1])}, a un decimo di punto ${IT.int(sizes[2])}. Dimezzare l’errore costa quattro volte i dati.`,
      'Anche le velocità della sezione 1.11 parlano di √n: Berry-Esseen scende come 1/√n, e la disuguaglianza di Hoeffding, exp(-2 n ε²), dice che le deviazioni che contano sono quelle di ordine 1/√n. Il grafico mostra le due facce dello stesso fatto sulle 1.000 regole simulate: la deviazione standard del conteggio cresce come √n, l’errore standard della quota scende come 1/√n, tutti e due con pendenza 1/2 su assi logaritmici.',
    ],
    chartTitle: 'Deviazione standard del conteggio (cresce come √n) ed errore standard della quota (scende come 1/√n), simulati ed esatti, su assi logaritmici',
    tableTitle: 'Il conteggio e la quota di falsi allarmi, per n',
    cols: { n: 'n', sdCount: 'Deviazione standard del conteggio', exactCount: 'σ √n', sdShare: 'Errore standard della quota', exactShare: 'σ/√n' },
    inferenceTitle: 'L’errore standard e l’intervallo al 95% della quota di falsi allarmi',
    inferenceCols: { n: 'n', variance: 'Var(S_n) = n p(1 - p)', se: 'Errore standard', half: 'Semiampiezza al 95%' },
  },
  tryScale: {
    intro: `Scegliete α: i tre istogrammi mostrano n^α (media - 1) per ${IT.int(SCALE_REPS)} medie di n tempi fra allarmi esponenziali (di media 1 minuto), con n = 10, 100 e 1.000, sullo stesso asse. Con α minore di 1/2 gli istogrammi si stringono verso lo zero al crescere di n: è la legge dei grandi numeri. Con α maggiore di 1/2 si allargano ed escono dal grafico. Solo con α = 1/2 restano uguali e prendono la forma della normale: è la scala del limite centrale.`,
    alphaLabel: (a) => `α = ${IT.plain(a)}`,
    chartTitle: (n) => `n = ${IT.int(n)}`,
    result: (charts, alpha) => `α = ${IT.plain(alpha)}: la deviazione standard è ${listOf(charts.map((c) => `${IT.num(c.factor, 3)} a n = ${IT.int(c.n)}`), 'e')}${charts.some((c) => c.outside > 0.001) ? `; fuori dal grafico ${listOf(charts.map((c) => IT.pct(c.outside)), 'e')}` : ''}.`,
  },
  bursts: {
    paras: (f05, f09) => [
      'Tutto questo poggia sull’indipendenza, o almeno sull’assenza di correlazione. Ma i falsi allarmi veri arrivano spesso a raffiche: un backup notturno, una scansione pianificata, una configurazione sbagliata fanno scattare molti allarmi di fila. Il modello più semplice è una catena di Markov: dopo un allarme il successivo arriva con probabilità p + ρ(1 - p), dopo una connessione tranquilla con probabilità p(1 - ρ). La quota di lungo periodo resta p, ma due connessioni vicine hanno correlazione ρ, e due a distanza k hanno correlazione ρ^k.',
      `Le covarianze non sono più zero, e la varianza della somma diventa n p(1 - p) [1 + 2 Σ (1 - k/n) ρ^k], che per n grande vale circa n p(1 - p)(1 + ρ)/(1 - ρ). Con ρ = ${IT.plain(f05.rho)} la varianza di ${IT.int(f05.n)} connessioni è ${IT.num(f05.factor, 2)} volte quella indipendente: è come avere ${IT.int(f05.effective)} connessioni indipendenti invece di ${IT.int(f05.n)}. Con ρ = ${IT.plain(f09.rho)} il fattore è ${IT.num(f09.factor, 1)}, e le connessioni effettive sono ${IT.int(f09.effective)}. La legge dei grandi numeri vale ancora, perché le correlazioni si spengono, e anche il limite centrale con √n; ma la costante davanti a 1/√n è più grande.`,
    ],
    simulation: (rows) => {
      const at = (rho) => rows.find((r) => r.rho === rho);
      return `La simulazione di ${IT.int(BURST_SECTION.reps)} finestre di ${IT.int(BURST_SECTION.n)} connessioni lo conferma: varianza ${IT.num(at(0.5).variance, 1)} (esatta ${IT.num(at(0.5).exact.variance, 1)}) con ρ = 0,5 e ${IT.num(at(0.9).variance, 1)} (${IT.num(at(0.9).exact.variance, 1)}) con ρ = 0,9. Il guaio è per chi ignora la dipendenza: l’intervallo al 95% calcolato come se le connessioni fossero indipendenti copre la quota vera solo ${art('il', IT.pct(at(0.5).coverage, 1))} delle volte con ρ = 0,5 e ${art('il', IT.pct(at(0.9).coverage, 1))} con ρ = 0,9. In statistica è il problema della dimensione effettiva del campione, comune nelle serie temporali e nei log.`;
    },
    after: 'Quando la dipendenza non si spegne abbastanza in fretta (memoria lunga) cambia anche la velocità: l’errore della media scende come n^(H - 1), con H > 1/2, più piano di 1/√n. E quando le variabili non hanno nemmeno varianza finita, come nella sezione 1.10, √n non c’entra più.',
    tableTitle: 'Le raffiche simulate, contro la varianza esatta e l’intervallo ingenuo',
    cols: { rho: 'ρ', variance: 'Varianza simulata', exact: 'Varianza esatta', factor: 'Fattore', effective: 'Connessioni effettive', coverage: 'Copertura dell’intervallo ingenuo', predicted: 'Copertura prevista' },
  },
  tryBursts: {
    intro: 'Scegliete la correlazione fra connessioni vicine. Le due strisce mostrano le prime 400 connessioni, indipendenti e a raffiche, con la stessa quota media del 3%; il grafico mostra l’errore standard esatto della quota al crescere di n. Le due rette sono parallele, con pendenza -1/2: √n resta, cambia la costante.',
    rhoLabel: (r) => `Correlazione ρ = ${IT.plain(r)}`,
    strips: { independent: 'Indipendenti', bursts: 'A raffiche' },
    stripLabel: (name, alarms, total) => `${name}: ${IT.int(alarms)} ${alarms === 1 ? 'allarme' : 'allarmi'} nelle prime ${IT.int(total)} connessioni`,
    result: (f) => `ρ = ${IT.plain(f.rho)}: con ${IT.int(f.n)} connessioni la varianza è ${IT.num(f.factor, 2)} volte quella indipendente, come ${IT.int(f.effective)} connessioni indipendenti; l’intervallo al 95% ingenuo copre circa ${art('il', IT.pct(f.coverage, 1))}.`,
    chartTitle: 'Errore standard della quota di allarmi, indipendenti e a raffiche, su assi logaritmici',
  },
  conditional: {
    paras: [
      'La probabilità di A dato B è P(A | B) = P(A ∩ B)/P(B), con P(B) > 0: la probabilità di A ricalcolata nel mondo ristretto in cui B è accaduto. Ne discendono tre regole. Quella del prodotto, P(A ∩ B) = P(A | B) P(B), che si estende a una catena di eventi. Quella della probabilità totale, P(A) = Σ_i P(A | B_i) P(B_i) su una partizione. E l’indipendenza: A e B sono indipendenti quando P(A | B) = P(A), cioè quando sapere B non cambia niente.',
      'In statistica la probabilità condizionata è ovunque, spesso senza nome. La verosimiglianza è la probabilità dei dati condizionata al parametro, P(dati | θ). Un p-value è la probabilità, condizionata all’ipotesi nulla, di dati almeno così estremi. La copertura di un intervallo di confidenza è condizionata al valore vero. E il teorema di Bayes rovescia il condizionamento, da P(dati | θ) a P(θ | dati). Confondere le due direzioni è l’errore più comune della statistica applicata; i tre esempi che seguono lo mostrano da vicino.',
    ],
    chainIntro: 'La regola del prodotto: la catena di un attacco di phishing, stadio per stadio. Ogni probabilità è condizionata agli stadi precedenti: fra le e-mail recapitate, quante vengono aperte; fra quelle aperte, quante cliccate; e così via. I numeri sono ordini di grandezza plausibili, non dati.',
    chainTitle: 'La catena di un attacco: le probabilità condizionate e il loro prodotto',
    chainCols: { stage: 'Stadio', p: 'P(stadio | precedenti)', cumulative: 'P(arrivare fin qui)' },
    stages: { delivered: 'Supera il filtro', opened: 'Viene aperta', clicked: 'Il link viene cliccato', credentials: 'Si inseriscono le credenziali', mfa: 'L’MFA viene aggirato' },
    chainText: (c) => `Per una sola e-mail la violazione ha probabilità ${IT.pct(c.breach, 2)}, il prodotto delle cinque condizionate. Ma una campagna è fatta di molte e-mail, e la probabilità di almeno una violazione è 1 - (1 - p)^m: con 100 e-mail vale ${IT.pct(c.campaigns[1].breach)}, con 1.000 ${IT.pct(c.campaigns[2].breach)}. Senza l’MFA, l’ultimo anello, la probabilità per e-mail sale ${art('al', IT.pct(c.withoutMfa, 1))}, e su 1.000 e-mail la violazione è quasi certa: la probabilità di evitarla è ${IT.sci(1 - c.campaigns[2].withoutMfa, 1)}. Ogni anello moltiplica: per questo la difesa a più livelli funziona.`,
    indepIntro: 'Indipendenza e indipendenza condizionata non si implicano a vicenda. La rete del triage della sezione 2.4 ne dà un esempio in ciascun verso.',
    indepTitle: 'Le due cause della rete, prima e dopo l’allarme dell’EDR',
    indepCols: { when: '', phishing: 'P(phishing)', exploit: 'P(exploit)', product: 'Prodotto', both: 'P(entrambi)' },
    indepRows: { before: 'Senza indizi', after: 'Dato l’allarme EDR' },
    indepText: (f) => `A priori phishing ed exploit sono indipendenti: la probabilità di tutti e due è il prodotto delle due. Dato l’allarme dell’EDR, il loro effetto comune, non lo sono più: P(entrambi | EDR) = ${IT.pct(f.causesGivenEdr.both, 2)}, mentre il prodotto sarebbe ${IT.pct(f.causesGivenEdr.phishing * f.causesGivenEdr.exploit, 2)}; una causa rende meno probabile l’altra. Al contrario, l’accesso insolito e l’allarme dell’EDR sono dipendenti (P(accesso insolito) passa da ${IT.pct(f.login, 1)} a ${IT.pct(f.loginGivenEdr, 1)} quando l’EDR suona), ma sapendo che c’è stato un phishing diventano indipendenti: P(accesso insolito | phishing) = ${IT.pct(f.loginGivenPhishing, 1)} con l’EDR e senza. Il naive Bayes delle sezioni 2.8 e 2.9 assume proprio un’indipendenza condizionata, delle parole o dei campi data la classe; e il paradosso di Simpson dell’Homework #6 è un’associazione che si rovescia condizionando a un terzo fattore.`,
    pvalueIntro: (e) => `Un p-value è una probabilità condizionata all’ipotesi nulla, non la probabilità dell’ipotesi nulla. Una regola dell’IDS è documentata con ${art('il', IT.pct(e.p0, 0))} di falsi allarmi; su ${IT.int(e.n)} connessioni benigne ne dà ${IT.int(e.k)}. H0: la quota è ancora ${art('il', IT.pct(e.p0, 0))}; H1: la regola è peggiorata ${art('al', IT.pct(e.p1, 0))}.`,
    pvalueText: (e) => `Il p-value è P(almeno ${IT.int(e.k)} allarmi | H0) = ${IT.p(e.pValue)}: sotto il 5%, quindi H0 si rifiuta. Ma la probabilità che H0 sia vera richiede Bayes e un prior. Se di solito le regole restano come documentate, P(H0) = ${IT.pct(e.priorH0, 0)}, con un rapporto di verosimiglianza di ${IT.num(e.lr, 1)} a favore di H1 si ottiene P(H0 | dati) = ${IT.pct(e.posteriorH0, 1)}; con un prior di metà e metà sarebbe ${IT.pct(e.posteriorEven, 1)}. Il p-value non dipende dal prior; la probabilità di H0 sì.`,
    manyText: (f) => `Lo stesso succede su molti test: fra le ipotesi rifiutate, quante sono vere? Dipende da quante delle ipotesi testate hanno davvero un effetto, il tasso di base della sezione 2.3. Con ${art('il', IT.pct(f.real, 0))} di effetti veri, potenza ${art('del', IT.pct(f.power, 0))} e α = ${IT.plain(f.alpha)}, ${art('il', IT.pct(f.falseDiscovery, 0))} dei rifiuti sono falsi: è il tasso di falsi rilevamenti (Benjamini e Hochberg, 1995), e la ragione per cui Ioannidis (2005) scrisse che molti risultati pubblicati sono falsi.`,
  },
  tryPvalue: {
    intro: 'Muovete i cursori: la quota delle ipotesi testate che hanno un effetto vero, la potenza del test e α. I quadratini sono 1.000 test: verdi le scoperte vere, viola gli effetti mancati, rossi i rifiuti sbagliati, grigi le ipotesi nulle vere lasciate stare. Ogni test rifiuta allo stesso modo, con p sotto α; quello che cambia è la probabilità che un rifiuto sia giusto.',
    real: (v) => `Effetti veri: ${IT.pct(v, 0)}`,
    power: (v) => `Potenza: ${IT.pct(v, 0)}`,
    alpha: (v) => `α: ${IT.plain(v)}`,
    iconTitle: 'Mille test: ogni quadratino è un’ipotesi',
    tableTitle: 'Le quattro categorie dei test',
    cols: { category: 'Categoria', truth: 'Verità', decision: 'Decisione', count: 'Test', share: 'Quota' },
    truth: { trueDiscovery: 'effetto vero', missedEffect: 'effetto vero', falseDiscovery: 'H0 vera', trueNull: 'H0 vera' },
    decision: { trueDiscovery: 'rifiutata', missedEffect: 'non rifiutata', falseDiscovery: 'rifiutata', trueNull: 'non rifiutata' },
    result: (f) => `Su ${IT.int(f.total)} test: ${IT.int(f.counts[0])} scoperte vere, ${IT.int(f.counts[2])} false, ${IT.int(f.counts[1])} effetti mancati. P(H0 vera | rifiutata) = ${IT.pct(f.falseDiscovery, 1)}.`,
  },
  limits: {
    intro: `Gli esempi della sezione 2 mostrano che cosa dà l’inferenza bayesiana e che cosa costa. La tabella prende la campagna di phishing della sezione 2.6 e la guarda con i quattro prior, dopo uno, tre e dieci giorni. La conclusione «serve un’altra formazione» si prende quando P(quota > ${IT.pct(TARGET_RATE, 0)}) supera ${art('il', IT.pct(DECISION_LEVEL, 0))}.`,
    tableTitle: (level) => `La stessa campagna con quattro prior: media a posteriori e P(quota > ${IT.pct(TARGET_RATE, 0)}); ✓ quando supera ${art('il', IT.pct(level, 0))}`,
    cols: { prior: 'Prior', day1: 'Dopo 1 giorno', days3: 'Dopo 3 giorni', days10: 'Dopo 10 giorni' },
    cell: (x) => `${IT.pct(x.mean)}; P = ${IT.pct(x.above)}${x.act ? ' ✓' : ''}`,
    paras: (rows) => {
      const spread = (r, keys) => {
        const means = keys.map((k) => r.priors[k].mean);
        return [Math.min(...means), Math.max(...means)];
      };
      const fair = ['uniform', 'jeffreys', 'informed'];
      const [a1, b1] = spread(rows[0], fair);
      const [a10, b10] = spread(rows[rows.length - 1], fair);
      return [
        `Con un giorno di dati i tre prior ragionevoli danno medie da ${IT.pct(a1)} a ${IT.pct(b1)}; dopo dieci giorni da ${IT.pct(a10)} a ${IT.pct(b10)}. Il prior sbagliato e sicuro di sé resta lontano più a lungo (${IT.pct(rows[0].priors.wrong.mean)}, poi ${IT.pct(rows[rows.length - 1].priors.wrong.mean)}): gli servono molti più dati, come mostra la sezione 2.11. Qui la decisione è la stessa per tutti, perché i dati sono chiari; con dati al limite il prior può spostarla.`,
        'I vantaggi. Il prior porta un’informazione che i dati da soli non hanno: il tasso di base dell’allarme (2.3) è conoscenza vera, e ignorarlo porta alla fallacia. Il posterior risponde direttamente alle domande che contano, come P(quota > 10%), che un p-value non dà (2.1). L’aggiornamento è sequenziale e coerente (2.5, 2.6), funziona anche con pochi dati e con modelli strutturati come le reti (2.4), e porta in modo naturale alle decisioni.',
        'I limiti. Il prior va scelto, e con pochi dati la scelta conta; un prior sbagliato e sicuro di sé rallenta l’apprendimento (2.11), e uno che dà probabilità zero a un valore non potrà mai cambiare idea. La verosimiglianza può essere sbagliata: il naive Bayes conta due volte le prove dipendenti e diventa troppo sicuro (2.9). Le probabilità di una rete sono spesso stime di esperti (2.4). E fuori dai casi coniugati il posterior va calcolato con metodi numerici, su una griglia (2.6) o con Monte Carlo.',
        'L’influenza sulle conclusioni si misura con un’analisi di sensibilità, come la tabella: si ripete l’inferenza con prior diversi e plausibili, e si dichiara la conclusione solo se regge. Con molti dati il prior conta sempre meno (Bernstein-von Mises, 2.11); con pochi va scelto con cura e dichiarato.',
      ];
    },
  },
  controls: {
    rate: (v) => `Tasso dei falsi allarmi p = ${IT.pct(v, 0)}`,
    epsilon: (v) => `Banda ε = ${IT.num(v * 100, 1)} ${v === 0.01 ? 'punto' : 'punti'}`,
    bernoulliP: (v) => `p della Bernoulli = ${IT.pct(v, 0)}`,
    shareP: (v) => `Quota vera p = ${IT.pct(v, 0)}`,
    days: (v) => (v === 1 ? 'Dati: il primo giorno' : `Dati: i primi ${IT.int(v)} giorni`),
    alpha: (v) => `α = ${IT.plain(v)}: il rischio di bloccare un utente`,
    beta: (v) => `β = ${IT.plain(v)}: il rischio di liberare un attaccante`,
    trueRate: (v) => `Tasso vero dei clic = ${IT.pct(v, 0)}`,
    perDay: (v) => `E-mail al giorno: ${IT.int(v)}`,
    coverageN: (v) => `n = ${IT.int(v)} e-mail`,
    bytesN: 'Connessioni per media',
    int: (v) => IT.int(v),
    newSample: 'Nuovo campione',
    newWalks: 'Due indirizzi simulati',
    handWalks: 'I due esempi scritti a mano',
    newCampaign: 'Nuova campagna',
    handleRate: (v) => `p = ${IT.pct(v, 0)}`,
    bandUp: 'p + ε',
    bandDown: 'p - ε',
    block: 'blocca',
    clear: 'libera',
    threshold: (v) => `soglia ${IT.num(v, 0)}`,
    spam: (r) => `Con la soglia a log-odds ${IT.num(r.threshold, 0)}: ${IT.int(r.tp)} spam presi e ${IT.int(r.fn)} persi, ${IT.int(r.fp)} ${r.fp === 1 ? 'messaggio legittimo segnato' : 'messaggi legittimi segnati'} come spam; accuratezza ${IT.pct(r.accuracy, 1)}, precisione ${IT.pct(r.precision, 1)}, recall ${IT.pct(r.recall, 1)}.`,
  },
  checks: {
    intro: 'Ogni numero della pagina è controllato contro un riferimento indipendente: le funzioni speciali contro SciPy 1.17.1 e mpmath a 50 cifre; l’allarme e la rete contro un calcolo esatto con le frazioni; il test di Wald, le coperture, le distanze esatte, i due filtri contro un’implementazione in Python scritta a parte; le simulazioni contro lo stesso Python con una sua copia dei generatori, che con lo stesso seme deve dare gli stessi numeri; i generatori contro il loro codice C di riferimento.',
    summary: (ok, total) => `${ok} verifiche superate su ${total}`,
    details: (n) => `Le ${n} verifiche, una per una`,
    cols: { check: 'Verifica', expected: 'Atteso', actual: 'Ottenuto', result: 'Esito' },
    groups: { functions: 'Le funzioni speciali', bayes: 'Bayes: allarme, rete, Wald, coperture', filters: 'I due filtri naive Bayes', convergence: 'Le convergenze', simulation: 'Le simulazioni (seme 2026)', generator: 'Il generatore' },
    ok: 'superata',
    failed: 'fallita',
    pending: 'in attesa delle simulazioni',
  },
  tests: {
    intro: `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. L’esito atteso è quello che la teoria fa prevedere: quando l’ipotesi nulla è vera, un test al 5% la rifiuta comunque una volta su venti.`,
    cols: { subject: 'Che cosa si verifica', hypothesis: 'Ipotesi nulla H0', statistic: 'Statistica', p: 'p-value', verdict: 'Esito', expected: 'Atteso' },
    rows: {
      generator: { subject: 'Il generatore della pagina', hypothesis: 'La media di 100.000 valori uniformi è 1/2 (test z)' },
      sprtLegit: { subject: `Wald, ${IT.int(SPRT_RUNS)} utenti simulati`, hypothesis: 'La quota di utenti bloccati è quella esatta (binomiale)' },
      sprtAttacker: { subject: `Wald, ${IT.int(SPRT_RUNS)} attaccanti simulati`, hypothesis: 'La quota di attaccanti liberati è quella esatta' },
      coverage: { subject: `Jeffreys, ${IT.int(COVERAGE_RUNS)} campagne simulate`, hypothesis: 'La copertura simulata è quella esatta' },
      smsFilter: { subject: 'Il filtro antispam contro «tutto legittimo»', hypothesis: 'I due sbagliano allo stesso modo (McNemar)' },
      kddFilter: { subject: 'Naive Bayes su NSL-KDD contro «tutto attacco»', hypothesis: 'I due sbagliano allo stesso modo (McNemar)' },
      cltExponential: { subject: 'Somme di 30 esponenziali standardizzate', hypothesis: 'Hanno legge normale (Kolmogorov-Smirnov)' },
      cltUniform: { subject: 'Somme di 12 uniformi standardizzate', hypothesis: 'Hanno legge normale' },
      cltCauchy: { subject: 'Medie di 100 valori di Cauchy', hypothesis: 'Hanno la legge di Cauchy standard' },
      bytes: { subject: 'Medie dei byte di 1.000 connessioni', hypothesis: 'Hanno legge normale' },
      hash: { subject: `${IT.int(HASH_TEST.trials)} prove di identificativi a ${HASH_TEST.bits} bit`, hypothesis: 'La quota di collisioni è quella esatta' },
      gc: { subject: `Glivenko-Cantelli: √n per la distanza, ${IT.int(GC_REPS)} campioni di 1.000`, hypothesis: 'Ha la legge di Kolmogorov' },
    },
    statNames: { z: 'z', k: 'k', D: 'D', 'b/c': 'b/c' },
    verdicts: { reject: 'H0 rifiutata', accept: 'H0 non rifiutata' },
    expected: { reject: 'rifiutata', accept: 'non rifiutata (95% dei casi)' },
    pending: 'In corso: le simulazioni non sono ancora finite.',
  },
  history: {
    intro: 'Dalla legge dei grandi numeri alle sue forme forti e ai teoremi della statistica, e da un problema di probabilità inversa alle reti bayesiane e ai filtri antispam: le idee usate nell’homework in ordine cronologico.',
    items: [
      { year: '1713', title: 'Jacob Bernoulli', text: 'Ars Conjectandi, pubblicato postumo: la prima legge dei grandi numeri, la frequenza di un evento si avvicina alla sua probabilità.' },
      { year: '1733', title: 'de Moivre', text: 'L’approssimazione normale della binomiale: il primo limite centrale, con la sua √n.' },
      { year: '1763', title: 'Bayes e Price', text: 'Richard Price pubblica il saggio di Thomas Bayes sulla probabilità inversa: dedurre la probabilità di una causa dai suoi effetti.' },
      { year: '1774', title: 'Laplace', text: 'Mémoire sur la probabilité des causes par les événements: il teorema nella forma generale, poi la regola di successione e, nel 1810, il limite centrale.' },
      { year: '1853', title: 'Cauchy', text: 'Studia la legge che porta il suo nome, che Poisson aveva già notato nel 1824 come eccezione alla media.' },
      { year: '1867', title: 'Chebyshev', text: 'La disuguaglianza che dimostra la legge debole dei grandi numeri per variabili con varianza finita.' },
      { year: '1906', title: 'Markov', text: 'Le catene che portano il suo nome, per mostrare che la legge dei grandi numeri vale anche senza indipendenza.' },
      { year: '1908', title: 'Student', text: 'William Gosset, alla birreria Guinness, trova la legge della statistica t, con la varianza stimata dai dati.' },
      { year: '1909', title: 'Borel', text: 'La legge forte per le prove di Bernoulli, con i numeri normali: la prima convergenza quasi certa.' },
      { year: '1917', title: 'Cantelli', text: 'Il lemma di Borel-Cantelli e una legge forte con il momento quarto.' },
      { year: '1922', title: 'Lindeberg', text: 'La condizione sotto cui il limite centrale vale anche per variabili non identiche.' },
      { year: '1922-1925', title: 'Fisher', text: 'La massima verosimiglianza, l’informazione che porta il suo nome e il p-value come misura dell’evidenza contro H0.' },
      { year: '1925', title: 'Slutsky', text: 'Il teorema che combina la convergenza in distribuzione e quella in probabilità.' },
      { year: '1927', title: 'Wilson', text: 'L’intervallo per una proporzione che inverte il test del punteggio.' },
      { year: '1933', title: 'Kolmogorov', text: 'Gli assiomi della probabilità, la legge forte per variabili identicamente distribuite con media finita, e la legge limite di √n per la distanza dalla funzione di ripartizione empirica.' },
      { year: '1933', title: 'Glivenko e Cantelli', text: 'La funzione di ripartizione empirica converge uniformemente a quella vera, quasi certamente.' },
      { year: '1934', title: 'Clopper e Pearson', text: 'L’intervallo esatto per una proporzione, costruito sulla binomiale.' },
      { year: '1940', title: 'Turing e Good', text: 'A Bletchley Park, il Banburismus contro Enigma: pesi delle prove in ban e deciban, sommati uno dopo l’altro.' },
      { year: '1941-1942', title: 'Berry ed Esseen', text: 'La velocità del limite centrale: la distanza dalla normale non supera C ρ/(σ³ √n).' },
      { year: '1945', title: 'Wald', text: 'Il test sequenziale del rapporto di verosimiglianza, sviluppato per il collaudo dei materiali bellici; nel 1948, con Wolfowitz, la sua ottimalità.' },
      { year: '1945-1946', title: 'Rao e Cramér', text: 'Il limite inferiore della varianza di uno stimatore non distorto, che il MLE raggiunge asintoticamente.' },
      { year: '1946', title: 'Jeffreys', text: 'Il prior invariante che porta il suo nome; per una proporzione è Beta(1/2, 1/2).' },
      { year: '1949', title: 'Doob', text: 'La consistenza del posterior: con dati infiniti converge quasi certamente al valore vero.' },
      { year: '1963', title: 'Hoeffding', text: 'La disuguaglianza esponenziale per somme di variabili limitate.' },
      { year: '1988', title: 'Pearl', text: 'Probabilistic Reasoning in Intelligent Systems: le reti bayesiane come motore di inferenza.' },
      { year: '1995', title: 'Benjamini e Hochberg', text: 'Il tasso di falsi rilevamenti fra molti test, e il modo di controllarlo.' },
      { year: '1998-2002', title: 'Sahami, Graham', text: 'Il filtro antispam bayesiano: prima in un articolo di ricerca, poi in «A Plan for Spam».' },
      { year: '2001', title: 'Brown, Cai e DasGupta', text: 'Interval Estimation for a Binomial Proportion: perché l’intervallo di Wald va abbandonato.' },
      { year: '2005', title: 'Ioannidis', text: 'Why Most Published Research Findings Are False: il p-value letto senza il tasso di base.' },
      { year: '2009', title: 'Tavallaee e colleghi', text: 'NSL-KDD, la versione ripulita dei dati della KDD Cup 1999.' },
      { year: '2011', title: 'Almeida, Gómez Hidalgo e Yamakami', text: 'La SMS Spam Collection; nello stesso anno Shevtsova porta la costante di Berry-Esseen a 0,4748.' },
    ],
    after: 'La storia corre su due binari che l’homework incrocia: quello dei limiti (Bernoulli, Chebyshev, Borel, Kolmogorov, Berry ed Esseen) e quello dell’inferenza (Bayes, Laplace, Fisher, Turing, Wald, Pearl). Bernstein-von Mises li unisce: con abbastanza dati, credere e contare danno la stessa risposta.',
  },
  conclusion: {
    paras: (f) => [
      'I quattro modi di convergenza non sono sinonimi. Quasi certa e in media quadratica implicano in probabilità, che implica in distribuzione; ogni altra freccia ha un controesempio (Bernoulli(1/n), il picco, la macchina da scrivere, (-1)^n Z). La legge dei grandi numeri vive in probabilità (la debole), quasi certamente (la forte) e in media quadratica; il limite centrale in distribuzione; e la stessa lingua regge la consistenza degli stimatori, Slutsky, il metodo delta, Glivenko-Cantelli e la normalità del MLE.',
      `√n viene dalla varianza che si somma: con valori indipendenti, o solo non correlati, Var(S_n) = n σ², quindi l’errore della media è σ/√n e il limite centrale va scritto con √n. Per questo dimezzare l’errore costa quattro volte i dati (${IT.int(f.half)} connessioni per stimare il 3% a mezzo punto). Senza indipendenza la costante cresce: con allarmi a raffica di correlazione 0,5 la varianza è ${IT.num(f.burstFactor, 1)} volte quella indipendente. E senza varianza finita, o con code pesantissime come i byte di NSL-KDD, la normale arriva tardi o mai.`,
      `La probabilità condizionata è il cuore dell’inferenza, e il teorema di Bayes la rovescia: dalla verosimiglianza P(dati | ipotesi) al posterior P(ipotesi | dati), passando per il prior. Un p-value non è la probabilità di H0 (${IT.p(f.pValue)} contro ${IT.pct(f.posteriorH0, 1)} nell’esempio della sezione 2.1). Sugli esempi il motore funziona: mostra quanto pesa il tasso di base (${IT.pct(f.alarm)} di attacchi veri fra gli allarmi), spiega via una causa con un’altra, decide in pochi tentativi, stima la quota di click con un intervallo che si legge come una probabilità (${IT.pct(f.rate.mean)}, da ${IT.pct(f.rate.lo)} a ${IT.pct(f.rate.hi)}), filtra lo spam (${IT.pct(f.sms)} di accuratezza) e gli attacchi di NSL-KDD (${IT.pct(f.kdd)}).`,
      'Vantaggi e limiti vanno insieme: il prior porta informazione e richiede una scelta dichiarata; con pochi dati influenza le conclusioni, con molti le lascia ai dati. Il posterior che converge, normale e concentrato sul valore vero (Bernstein-von Mises), è il ponte fra le due parti della consegna: con abbastanza dati, credere e contare danno la stessa risposta.',
    ],
  },
  legends: {
    detected: 'Attacchi visti',
    missed: 'Attacchi persi',
    falseAlarm: 'Falsi allarmi',
    quiet: 'Normali senza allarme',
    phishing: 'Phishing',
    exploit: 'Exploit',
    compromise: 'Compromissione',
    legit: 'Utente legittimo',
    attacker: 'Attaccante',
    live: 'L’indirizzo di prova',
    block: 'Soglia di blocco',
    clear: 'Soglia di via libera',
    uniformPrior: 'Prior uniforme',
    informedPrior: 'Prior informato',
    wrongPrior: 'Prior sbagliato',
    trueRate: 'Quota vera',
    prior: 'Prior',
    likelihood: 'Verosimiglianza',
    posterior: 'Posterior',
    wald: 'Wald',
    wilson: 'Wilson',
    clopper: 'Clopper-Pearson',
    jeffreys: 'Jeffreys',
    nominal: '95%',
    spam: 'Spam',
    ham: 'Legittimi',
    simulated: 'Regole simulate',
    exact: 'Esatta',
    chebyshev: 'Chebyshev',
    hoeffding: 'Hoeffding',
    normal: 'Normale',
    paths: 'Traiettorie',
    band: 'Banda di un punto',
    outsideAt: 'Fuori a n',
    outsideAfter: 'Fuori ancora dopo n',
    simulatedMse: 'Simulato',
    exactMse: 'p(1 - p)/n',
    bernoulli: 'Falsi allarmi',
    bernoulliBound: 'Falsi allarmi, Berry-Esseen',
    exponential: 'Esponenziali',
    exponentialBound: 'Esponenziali, Berry-Esseen',
    sums: 'Somme simulate',
    normalDensity: 'Densità normale',
    cauchyDensity: 'Densità di Cauchy',
    estimate: 'Stima Monte Carlo',
    exactBand: 'Esatta, con la banda al 95%',
    means: 'Medie simulate',
    zKnown: 'Z, σ nota',
    tEstimated: 't, σ stimata',
    mle: 'MLE del tasso',
    countSpread: 'Deviazione standard del conteggio',
    shareSpread: 'Errore standard della quota',
    scaled: 'n^α (media - 1)',
    independent: 'Indipendenti',
    correlated: 'A raffiche',
    trueDiscovery: 'Scoperte vere',
    missedEffect: 'Effetti mancati',
    falseDiscovery: 'Rifiuti sbagliati',
    trueNull: 'Nulle vere lasciate stare',
    day1: 'Il primo giorno',
    afterDays: (d) => (d === 1 ? 'Dopo un giorno' : `Dopo ${IT.int(d)} giorni`),
    days10: 'Dieci giorni',
  },
  tips: {
    alarm: (k, count, share) => `${it.legends[['detected', 'missed', 'falseAlarm', 'quiet'][k]]}: ${IT.int(count)} connessioni (${IT.pctSmall(share)})`,
    network: (i, values) => [it.network.steps[i], ...['phishing', 'exploit', 'compromise'].map((n, k) => (values[k] === null ? null : `${it.legends[n]} ${IT.pct(values[k])}`))].filter(Boolean).join(' · '),
    sprt: (n, values, upper, lower, keys) => [`Tentativo ${IT.int(n)}`, ...values.map((v, k) => (v === null ? null : `${it.legends[keys[k]]} ${IT.num(v, 3)}`)), upper === null ? null : `blocco ${IT.num(upper, 3)}`, lower === null ? null : `via libera ${IT.num(lower, 3)}`].filter(Boolean).join(' · '),
    campaign: (row, u, i, truth) => [`Giorno ${IT.int(row.day)}: ${IT.int(row.clicks)} click su ${IT.int(row.sent)}`, u ? `uniforme ${it.rate.interval(u)}` : null, i ? `informato ${it.rate.interval(i)}` : null, truth ? `vera ${IT.pct(CAMPAIGN.rate, 0)}` : null].filter(Boolean).join(' · '),
    density: (x, prior, lik, post) => [`Quota ${IT.pct(x, 1)}`, prior === null ? null : `prior ${IT.num(prior, 2)}`, lik === null ? null : `verosimiglianza ${IT.num(lik, 2)}`, post === null ? null : `posterior ${IT.num(post, 2)}`].filter(Boolean).join(' · '),
    coverage: (p, values) => [`Quota vera ${IT.pct(p, 1)}`, ...['wald', 'wilson', 'clopper', 'jeffreys'].map((m, k) => (values[k] === null ? null : `${it.legends[m]} ${IT.pct(values[k])}`))].filter(Boolean).join(' · '),
    logOdds: (bin, spam, ham) => [`Log-quote ${it.spam.bin(bin)}`, spam === null ? null : `spam ${IT.int(spam)}`, ham === null ? null : `legittimi ${IT.int(ham)}`].filter(Boolean).join(' · '),
    outside: (n, sim, exact, cheb) => [`n = ${IT.int(n)}`, sim === null ? null : `simulate ${IT.pct(sim)}`, exact === null ? null : `esatta ${IT.pct(exact)}`, cheb === null ? null : `Chebyshev ${IT.pct(cheb)}`].filter(Boolean).join(' · '),
    paths: (n, min, max, out, total) => `n = ${IT.int(n)}: le 20 stime vanno da ${IT.pct(min, 2)} a ${IT.pct(max, 2)}, ${IT.int(out)} su ${IT.int(total)} fuori dalla banda`,
    after: (n, out, after) => [`n = ${IT.int(n)}`, out === null ? null : `fuori a n ${IT.pct(out)}`, after === null ? null : `fuori ancora dopo ${IT.pct(after)}`].filter(Boolean).join(' · '),
    mse: (n, sim, exact) => [`n = ${IT.int(n)}`, sim === null ? null : `simulato ${IT.sci(sim, 2)}`, exact === null ? null : `esatto ${IT.sci(exact, 2)}`].filter(Boolean).join(' · '),
    sequence: (n, values) => `n = ${IT.int(n)}: ${values.map((v) => IT.num(v, Math.abs(v) >= 10 ? 0 : 2)).join(', ')}`,
    clt: (n, values) => [`n = ${IT.int(n)}`, ...['bernoulli', 'bernoulliBound', 'exponential', 'exponentialBound'].map((k, i) => (values[i] === null ? null : `${it.legends[k]} ${IT.num(values[i], 4)}`))].filter(Boolean).join(' · '),
    histogram: (from, to, count, share) => `Da ${IT.num(from, 2)} a ${IT.num(to, 2)}: ${IT.int(count)} (${IT.pct(share)})`,
    hash: (trials, estimate, exact) => [`${IT.int(trials)} prove`, estimate === null ? null : `stima ${IT.pct(estimate, 2)}`, exact === null ? null : `esatta ${IT.pct(exact, 2)}`].filter(Boolean).join(' · '),
    strip: (n, alarm, run) => (alarm ? `Connessione ${IT.int(n)}: allarme, ${run > 1 ? `in una raffica di ${IT.int(run)}` : 'isolato'}` : `Connessione ${IT.int(n)}: nessun allarme`),
    node: (name, p, prior, observed) => (observed === null || observed === undefined ? `${name}: ${IT.pct(p, 1)} (${IT.pct(prior, 1)} prima degli indizi)` : `${name}: osservato, ${observed ? 'sì' : 'no'}`),
    mode: (name, implies, impliedBy) => {
      const low = (x) => x.charAt(0).toLowerCase() + x.slice(1);
      const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).map(low).join(', ')} e ${low(xs[xs.length - 1])}` : low(xs[0]));
      const a = implies.length ? `implica ${list(implies)}` : 'non implica nessun’altra';
      let b = 'nessun’altra la implica';
      if (impliedBy.length) b = `${impliedBy.length > 1 ? 'la implicano' : 'la implica'} ${list(impliedBy)}`;
      return `${name}: ${a}; ${b}.`;
    },
    cauchy: (n, min, max) => `n = ${IT.int(n)}: le medie vanno da ${IT.num(min, 2)} a ${IT.num(max, 2)}`,
    speed: (n, values) => [`n = ${IT.int(n)}`, ...['exact', 'chebyshev', 'hoeffding', 'normal'].map((k, i) => (values[i] === null ? null : `${it.legends[k]} ${IT.prob(values[i])}`))].filter(Boolean).join(' · '),
    bvm: (n, clicks, u, w, truth) => [`n = ${IT.int(n)}, ${IT.int(clicks)} click`, u ? `uniforme ${it.bvm.pair(u)}` : null, w ? `sbagliato ${it.bvm.pair(w)}` : null, truth ? `vera ${IT.pct(CAMPAIGN.rate, 0)}` : null].filter(Boolean).join(' · '),
    bvmDistance: (n, u, w) => [`n = ${IT.int(n)}`, u === null ? null : `uniforme ${IT.num(u, 4)}`, w === null ? null : `sbagliato ${IT.num(w, 4)}`].filter(Boolean).join(' · '),
    results: (n, z, t, mle) => [`n = ${IT.int(n)}`, z === null ? null : `σ nota ${IT.num(z, 4)}`, t === null ? null : `σ stimata ${IT.num(t, 4)}`, mle === null ? null : `MLE ${IT.num(mle, 4)}`].filter(Boolean).join(' · '),
    root: (n, count, share) => [`n = ${IT.int(n)}`, count ? `conteggio ${IT.num(count[0], 2)} (σ √n = ${IT.num(count[1], 2)})` : null, share ? `quota ${IT.num(share[0], 5)} (σ/√n = ${IT.num(share[1], 5)})` : null].filter(Boolean).join(' · '),
    burst: (n, ind, cor) => [`n = ${IT.int(n)}`, ind === null ? null : `indipendenti ${IT.num(ind, 5)}`, cor === null ? null : `a raffiche ${IT.num(cor, 5)}`].filter(Boolean).join(' · '),
    discovery: (k, count) => `${it.legends[['trueDiscovery', 'missedEffect', 'falseDiscovery', 'trueNull'][k]]}: ${IT.int(count)} test`,
    likelihood: (x, a, b, days = 10) => [`Quota ${IT.pct(x, 1)}`, a === null ? null : `primo giorno ${IT.num(a, 3)}`, b === null ? null : `${{ 1: 'un giorno', 10: 'dieci giorni' }[days] || `${IT.int(days)} giorni`} ${IT.num(b, 3)}`].filter(Boolean).join(' · '),
  },
  names: {
    methods: { wald: 'Wald', wilson: 'Wilson', clopper: 'Clopper-Pearson', jeffreys: 'Jeffreys' },
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese, con i dati degli SMS e di NSL-KDD dentro: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline. Con node homework7.js stampa nel terminale le convergenze, √n e le raffiche, gli altri risultati della statistica, la probabilità condizionata, l’allarme, la rete, il test di Wald, la campagna, le coperture, i due filtri e le verifiche; --seed cambia il seme.',
    contents: 'Contenuto: index.html, style.css, homework7.js (dati, calcoli, grafici e riga di comando), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework7',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Le forme di convergenza e il ruolo di √n; probabilità condizionata, teorema di Bayes e inferenza statistica.',
    course: 'Statistics, laurea magistrale in Cybersecurity, Sapienza Università di Roma',
    online: 'Versione online',
  },
};

// ---------------------------------------------------------------------------
// ENGLISH
// ---------------------------------------------------------------------------

const EN = formatters('.', ',', 'n/a', '×');

const en = {
  fmt: EN,
  ui: {
    index: 'Contents',
    indexTitle: 'Homework contents',
    close: 'Close',
    backToTop: 'Back to top',
    computing: 'Computing...',
    language: 'Language',
    error: (message) => `The computation failed: ${message}`,
    another: 'Another sample',
    reset: 'Start again',
    yes: 'yes',
    no: 'no',
  },
  sections: {
    assignment: '0. The assignment',
    convergence: '1. The modes of convergence in probability theory',
    probability: '1.1 In probability',
    almost: '1.2 Almost sure',
    trySequences: 'Try it: paths and counterexamples',
    l2: '1.3 In mean square (L²)',
    distribution: '1.4 In distribution',
    tryClt: 'Try it: the central limit, live',
    tryHash: 'Try it: hash collisions',
    map: '1.5 How they connect: the map of implications',
    tryMap: 'Try it: the map',
    roles: '1.6 The role in the law of large numbers and in the central limit',
    results: '1.7 Other results: consistency, Slutsky, delta method, Glivenko-Cantelli, MLE',
    root: '1.8 Why √n: the variance adds up',
    tryScale: 'Try it: the right scale',
    bursts: '1.9 Without independence: alarms in bursts',
    tryBursts: 'Try it: alarms in bursts',
    heavy: '1.10 When √n is not enough: heavy tails',
    speed: '1.11 How fast: Chebyshev, Hoeffding, Berry-Esseen',
    bayes: '2. Conditional probability, Bayes’ theorem and statistical inference',
    conditional: '2.1 Conditional probability, in probability and in statistics',
    tryPvalue: 'Try it: p-value and P(H0 | data)',
    engine: '2.2 Bayes’ theorem: prior, likelihood, posterior',
    alarm: '2.3 An IDS alarm and the base rate',
    tryAlarm: 'Try it: the adjustable alarm',
    network: '2.4 A Bayesian network for triage',
    tryNetwork: 'Try it: explaining away',
    sprt: '2.5 When to block an IP: Wald’s sequential test',
    trySprt: 'Try it: block an IP',
    rate: '2.6 Estimating a rate: who clicks the phishing',
    tryBelief: 'Try it: belief, live',
    tryPrior: 'Try it: draw the prior',
    frequentist: '2.7 Bayes and frequentists: credibility and confidence',
    spam: '2.8 The spam filter: naive Bayes on real SMS',
    kdd: '2.9 The same engine on NSL-KDD',
    limits: '2.10 Advantages, limitations and the influence of the prior on the conclusions',
    bvm: '2.11 The posterior converges: Bernstein-von Mises',
    checks: '3. Checks',
    tests: '4. Summary of the statistical tests',
    history: '5. Historical context',
    conclusion: '6. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment has two parts. The first asks to explain the differences between the main modes of convergence of probability theory (in probability, almost sure, in mean square, in distribution), their role in the law of large numbers, in the central limit theorem and in other important results of statistics, and why √n appears so often in convergence theorems, in relation to the additivity of variance and to the role of independence, in probability and in inference. The second asks for conditional probability, in probability and in statistics, Bayes’ theorem and the role and relationship of the three components of Bayesian inference, prior, likelihood and posterior: how the theorem produces the posteriors, why this updating is central, and examples of the use of priors and likelihoods with their applications, advantages, limitations and influence on the conclusions.',
      'The page follows this order. Section 1 defines and shows the four modes in the order of the text (1.1 to 1.4), connects them in a map of implications (1.5), sums up their role in the law of large numbers and in the central limit (1.6) and in other results of statistics: the consistency of estimators, Slutsky’s theorem and the delta method, Glivenko-Cantelli, the normality of the maximum likelihood estimator (1.7). Then it explains √n: the variance that adds up thanks to independence (1.8), what happens without it (1.9), when √n is not enough (1.10) and how fast convergence is (1.11). Section 2 starts from conditional probability, with the chain of an attack, conditional independence and the difference between a p-value and the probability of H0 (2.1); it presents Bayes’ theorem and its three components (2.2); it puts them to work on cybersecurity examples, from the alarm of an IDS to two naive Bayes filters on real data (2.3 to 2.9); it discusses the advantages, the limitations and the influence of the prior on the conclusions (2.10) and closes with the posterior that converges, the bridge between the two parts (2.11). Then come the checks of the computations, the summary of the tests, the historical context and the conclusions.',
      'Twelve "Try it" boxes let you get your hands on the numbers: the paths of the counterexamples, the central limit live, hash collisions, the map of implications, the right scale for n, alarms in bursts, the p-value against P(H0 | data), an alarm to tune, the clues of a network, an address to block, a belief that updates at every e-mail and a prior to draw. Every number is computed in the browser, and the downloadable program prints the same ones. The charts of the sections move too: they have their own controls, lines to drag, animations and zoom (ctrl + wheel, or a rectangle dragged); charts and tables follow the controls, while the paragraphs tell the starting values.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned, in English; the broken lines of the original are joined into paragraphs.',
  },
  bayes: {
    intro: [
      'The second part moves from convergence to inference. Conditional probability says how a probability changes when something is known; Bayes’ theorem reverses it, from the probability of the data given the hypotheses to that of the hypotheses given the data. Used this way it is an inferential engine, which always does the same thing: it takes what was known before (the prior), combines it with how probable the data are under every hypothesis (the likelihood) and returns what is known after (the posterior). The examples change the hypotheses and the data, not the rule: an alarm, three connected clues, a series of login attempts, a phishing campaign, the words of an SMS, the fields of a connection.',
    ],
  },
  engine: {
    components: 'From the definition of conditional probability, P(H ∩ E) = P(E | H) P(H) = P(H | E) P(E); dividing by P(E) gives Bayes’ theorem. Its three components play different roles. The prior P(H) is what is known before the data: a base rate, experience, a declared assumption. The likelihood P(E | H), read as a function of the hypothesis (or of the parameter θ) with the data fixed, says how probable each hypothesis makes the data observed: it carries the information of the sample. The posterior P(H | E) is what is known after, and the only thing reasoned upon from then on. The evidence P(E), from the law of total probability, is the constant that makes the posteriors add up to 1.',
    likelihood: (l) => `The likelihood is not a probability distribution over θ. As a function of θ it does not have area 1: in the chart, scaled to a maximum of 1, its area is ${EN.num(l.day1.area, 3)} with the data of the first day (${EN.int(l.data.day1.clicks)} clicks out of ${EN.int(l.data.day1.sent)}) and ${EN.num(l.days10.area, 3)} with those of ten days (${EN.int(l.data.days10.clicks)} out of ${EN.int(l.data.days10.sent)}). It peaks at the observed frequency, the maximum likelihood estimate, and narrows with the data. Only multiplied by a prior and normalized does it become a posterior.`,
    likelihoodTitle: 'The likelihood of the share of clicks, after the first day and after ten days, scaled to a maximum of 1',
    odds: 'With two hypotheses, H and ¬H, the theorem reads better in the form of odds: the posterior odds are the prior odds times the likelihood ratio LR = P(E | H)/P(E | ¬H). In logarithms the product becomes a sum: every piece of evidence adds its weight ln LR, and pieces of evidence independent given the hypotheses add up. Alan Turing, at Bletchley Park, measured these weights in bans (base 10 logarithms) and decibans.',
    formulas: [
      'P(H | E) = P(E | H) · P(H) / P(E)                  the theorem',
      'P(E) = Σ_i P(E | H_i) · P(H_i)                     total probability',
      'O(H | E) = O(H) · P(E | H) / P(E | ¬H)             odds: posterior = prior × LR',
      'ln O(H | E_1, ..., E_k) = ln O(H) + Σ_j ln LR_j    evidence independent given H and ¬H',
      'p(θ | data) ∝ p(data | θ) · p(θ)                   a continuous parameter',
    ].join('\n'),
    weights: (w1, w10) => `For a parameter the relationship between the three components shows in the posterior mean. With a Beta(a, b) prior and k clicks out of n e-mails the posterior mean is (a + k)/(a + b + n): a weighted average of the prior mean and the observed frequency, with prior weight (a + b)/(a + b + n). With the informed prior Beta(3, 17) and the first day the prior weighs ${EN.pct(w1.w, 1)}: ${EN.pct(w1.priorMean, 1)} and ${EN.pct(w1.mle, 1)} give ${EN.pct(w1.posteriorMean, 1)}. After ten days it weighs ${EN.pct(w10.w, 1)}, and the posterior (${EN.pct(w10.posteriorMean, 1)}) is almost the observed frequency (${EN.pct(w10.mle, 1)}).`,
    central: 'Why this updating is central in Bayesian inference: everything that is concluded comes from the posterior. The estimates (mean, median, mode), the credible intervals, the probabilities of hypotheses such as P(θ > threshold), the predictions of new data and the decisions are functions of it. And updating is coherent: today’s posterior is tomorrow’s prior, and updating one datum at a time or all at once, in any order, gives the same result.',
    after: 'Three things decide the result, and the examples that follow show them one at a time: the prior (2.3, the base rate), how well every piece of evidence separates the hypotheses (2.4 and 2.5), and how much data arrives (2.6 and 2.11: with enough data the prior stops mattering).',
  },
  alarm: {
    intro: (f) => `An IDS rule recognizes ${EN.pct(f.sensitivity, 0)} of the attacks (the sensitivity) and goes off by mistake on ${EN.pct(f.fpr, 0)} of the normal connections (the false positive rate). It looks like a good detector. But on this network only one connection in ${EN.int(1 / f.base)} is an attack: that is the base rate, the prior. When the IDS goes off, how likely is it to be a real attack?`,
    paras: (f) => [
      `P(attack | alarm) = (${EN.plain(f.base)} × ${EN.plain(f.sensitivity)}) / (${EN.plain(f.base)} × ${EN.plain(f.sensitivity)} + ${EN.plain(1 - f.base)} × ${EN.plain(f.fpr)}) = ${EN.pct(f.posterior)}: only one alarm in ${EN.num(1 / f.posterior, 1)} is an attack. With natural frequencies the computation can be done in one’s head. Out of ${EN.int(f.population)} connections, ${EN.int(f.population * f.base)} are attacks: the IDS sees ${EN.int(f.counts[0])} and misses ${EN.int(f.counts[1])}. The normal connections are ${EN.int(f.population * (1 - f.base))}, and ${EN.pct(f.fpr, 0)} of them trigger ${EN.int(f.counts[2])} false alarms. The alarms are ${EN.int(f.counts[0] + f.counts[2])}, and only ${EN.int(f.counts[0])} are attacks.`,
      `This is the base rate fallacy: whoever looks only at the sensitivity of ${EN.pct(f.sensitivity, 0)} overrates the alarm ${EN.num(f.sensitivity / f.posterior, 1)} times. In the form of odds: the prior is 1 to ${EN.num(1 / f.priorOdds, 0)}, the alarm multiplies it by LR = ${EN.num(f.sensitivity, 2)}/${EN.num(f.fpr, 2)} = ${EN.num(f.lrPlus, 1)} (${EN.num(Math.log10(f.lrPlus), 2)} bans) and brings it to 1 to ${EN.num(1 / f.posteriorOdds, 2)}. Silence, instead, reassures a lot: P(attack | no alarm) = ${EN.pctSmall(f.posteriorQuiet)}.`,
    ],
    iconTitle: 'The 10,000 connections: every square is a connection',
    tableTitle: 'The four categories',
    cols: { category: 'Category', truth: 'Truth', alarm: 'Alarm', count: 'Connections', share: 'Share' },
    truth: { detected: 'attack', missed: 'attack', falseAlarm: 'normal', quiet: 'normal' },
    alarmed: { detected: 'yes', missed: 'no', falseAlarm: 'yes', quiet: 'no' },
    chainIntro: (s2) => `A second piece of evidence, independent of the first given the state of the connection: a sandbox opens the file the connection carried. It recognizes ${EN.pct(s2.sensitivity, 0)} of the malware and is wrong on ${EN.pct(s2.fpr, 0)} of the harmless files, so LR = ${EN.num(s2.sensitivity / s2.fpr, 0)}. The posterior of the first alarm becomes the prior of the second. In the opposite order, first the sandbox and then the IDS, the result is the same number: the weights add up.`,
    chainTitle: 'Two pieces of evidence in a row, in both orders',
    chainCols: { order: 'Order', step: 'Evidence', lr: 'LR', weight: 'Weight (bans)', prior: 'Prior', posterior: 'Posterior' },
    orders: { forward: 'IDS, then sandbox', backward: 'sandbox, then IDS' },
    detectors: { ids: 'IDS alarm', sandbox: 'sandbox alarm' },
  },
  tryAlarm: {
    intro: 'Move the sliders: base rate, sensitivity and false positives. The red squares are the attacks seen, the purple ones the attacks missed, the orange ones the false alarms. With a base rate of one in ten thousand even an excellent detector produces almost only false alarms; with the second detector on, the alarms are checked again by the sandbox.',
    base: (v) => `Base rate: ${EN.pctSmall(v)}`,
    sensitivity: (v) => `Sensitivity: ${EN.pct(v, 1)}`,
    fpr: (v) => `False positives: ${EN.pctSmall(v)}`,
    second: 'Check the alarms with the sandbox',
    result: (t) => {
      const f = t.facts;
      const [seen, missed, wrong] = f.counts;
      return `Out of ${EN.int(f.population)} connections: ${EN.int(seen)} ${seen === 1 ? 'attack' : 'attacks'} seen, ${EN.int(missed)} missed, ${EN.int(wrong)} ${wrong === 1 ? 'false alarm' : 'false alarms'}. P(attack | alarm) = ${EN.pct(f.posterior)}.`;
    },
    secondResult: (t) => `The sandbox confirms about ${EN.num(t.confirmed[0], 1)} attacks and ${EN.num(t.confirmed[1], 1)} false alarms: after two alarms P(attack) = ${EN.pct(t.chain[1].posterior)}.`,
  },
  network: {
    intro: [
      'An analyst sees three clues on a host and must understand what happened. Two possible causes: a phishing e-mail stole a password, or someone exploited a vulnerability from outside. Each can compromise the host (the two causes act independently, a model called noisy-OR, with a small probability of compromise by other routes). The clues: the EDR on the host raises an alarm (child of the compromise), the login comes from an unusual place (child of the phishing), the IDS sees the signature of an exploit (child of the vulnerability). The numbers are plausible orders of magnitude, not data.',
      'A Bayesian network writes the joint probability of all the nodes as the product of the probability of each given its parents: with six binary nodes 1 + 1 + 4 + 2 + 2 + 2 = 12 numbers are enough, instead of the 63 of a full table. Inference here is by enumeration: the 64 states consistent with the clues are summed. Large networks need variable elimination or Monte Carlo methods, but the rule is still Bayes.',
    ],
    paras: (rows) => [
      `Without clues, phishing and exploit have their prior probabilities, ${EN.pct(rows[0].phishing)} and ${EN.pct(rows[0].exploit)}, and the compromise ${EN.pct(rows[0].compromise)}. The EDR alarm brings the compromise to ${EN.pct(rows[1].compromise)} and raises both causes: the phishing to ${EN.pct(rows[1].phishing)}, the exploit to ${EN.pct(rows[1].exploit)}.`,
      `Then the IDS sees the signature of an exploit: the vulnerability rises to ${EN.pct(rows[2].exploit)} and the phishing falls back to ${EN.pct(rows[2].phishing)}, close to its prior, although no clue is about the phishing. This is explaining away: a cause found makes the other unnecessary. A priori the two causes are independent; given their common effect they become dependent, in opposite directions. Finally the unusual login, a clue of the phishing itself, brings it back to ${EN.pct(rows[3].phishing)}, and in turn takes some weight off the exploit (${EN.pct(rows[3].exploit)}).`,
    ],
    nodes: { phishing: 'Phishing', exploit: 'Exploit', compromise: 'Compromise', edr: 'EDR alarm', login: 'Unusual login', signature: 'Exploit signature' },
    steps: ['No clue', 'EDR alarm', '+ exploit signature', '+ unusual login'],
    stepsShort: ['Before', 'EDR', '+ signature', '+ login'],
    chartTitle: 'The probabilities of the three hidden variables, clue after clue',
    tableTitle: 'The story, step by step',
    cols: { step: 'Clues', phishing: 'P(phishing)', exploit: 'P(exploit)', compromise: 'P(compromise)', evidence: 'P(clues)' },
  },
  tryNetwork: {
    intro: 'Every clue can be unknown, present or absent. Switch on the EDR alarm and then the exploit signature: watch the phishing go down. Try also saying that the EDR did not go off: the compromise collapses, and both causes with it.',
    states: { unknown: 'unknown', yes: 'yes', no: 'no' },
    result: (q) => `P(phishing) = ${EN.pct(q.phishing)}, P(exploit) = ${EN.pct(q.exploit)}, P(compromise) = ${EN.pct(q.compromise)}; the probability of seeing these clues was ${EN.pctSmall(q.pEvidence)}.`,
    diagramLabel: 'The Bayesian network of the triage: the causes at the top, the compromise in the middle, the clues at the bottom',
  },
  sprt: {
    intro: [
      `An IP address tries to log in, one attempt after the other. Two hypotheses: a legitimate user, who fails now and then (with probability p0 = ${EN.plain(SPRT_DEFAULT.p0)}: a typo, an old password), or a brute-force attack, which fails almost always (p1 = ${EN.plain(SPRT_DEFAULT.p1)}). Blocking a legitimate user should happen at most once in ${EN.int(1 / SPRT_DEFAULT.alpha)} (α), letting an attacker through once in ${EN.int(1 / SPRT_DEFAULT.beta)} (β). How many attempts should one wait?`,
      'Wald’s sequential test (1945) adds up, attempt after attempt, the logarithm of the likelihood ratio, and decides as soon as the sum leaves one of two thresholds. It is Bayes applied one attempt at a time: with prior odds of 1 to 1, the sum is exactly the logarithm of the posterior odds that the address is an attacker.',
    ],
    formulas: (s) => [
      `failed attempt:      + ln(p1/p0) = + ${EN.num(s.fail, 3)}`,
      `successful attempt:  + ln((1 - p1)/(1 - p0)) = ${EN.num(s.success, 3)}`,
      `block when the sum ≥ ln((1 - β)/α) = ${EN.num(s.upper, 3)}`,
      `clear when the sum ≤ ln(β/(1 - α)) = ${EN.num(s.lower, 3)}`,
    ].join('\n'),
    paras: (s, legit, attacker) => [
      `An attacker who always fails is blocked at attempt number ${EN.int(Math.ceil(s.upper / s.fail))} (${EN.int(Math.ceil(s.upper / s.fail))} × ${EN.num(s.fail, 3)} = ${EN.num(Math.ceil(s.upper / s.fail) * s.fail, 2)}); a user who gets in ${EN.int(Math.ceil(s.lower / s.success))} times in a row is cleared. Computed exactly on the lattice of failures and successes, the errors are P(blocking a user) = ${EN.prob(legit.block)} and P(clearing an attacker) = ${EN.prob(attacker.clear)}, below α and β as Wald guarantees. On average a user takes ${EN.num(legit.mean, 2)} attempts and an attacker ${EN.num(attacker.mean, 2)}; Wald’s approximations, which neglect how far the sum overshoots the threshold, say ${EN.num(s.waldLegit, 2)} and ${EN.num(s.waldAttacker, 2)}.`,
      `The thresholds, read as posterior probabilities with a prior of half and half, are P(attacker) = ${EN.pct(1 / (1 + Math.exp(-s.upper)), 2)} to block and ${EN.pct(1 / (1 + Math.exp(-s.lower)), 2)} to clear. Wald and Wolfowitz (1948) proved that no other test with the same errors needs fewer attempts on average: the sequential test is the fastest way to decide.`,
    ],
    simulation: (sim) => `Simulated ${EN.int(sim.legit.runs)} users and ${EN.int(sim.attackers.runs)} attackers: ${EN.int(sim.legit.block)} ${sim.legit.block === 1 ? 'user blocked' : 'users blocked'} (${EN.num(sim.exactLegit.block * sim.legit.runs, 1)} expected) and ${EN.int(sim.attackers.clear)} attackers cleared (${EN.num(sim.exactAttacker.clear * sim.attackers.runs, 1)} expected), with ${EN.num(sim.legit.meanSteps, 2)} and ${EN.num(sim.attackers.meanSteps, 2)} attempts on average.`,
    chartTitle: 'The log-likelihood ratio of two example addresses',
    tableTitle: 'Errors and attempts: exact, approximate, simulated',
    cols: { who: 'Address', block: 'Blocked', clear: 'Cleared', exact: 'Attempts (exact)', wald: 'Attempts (Wald)', simulated: 'Attempts (simulated)' },
    who: { legit: 'Legitimate user', attacker: 'Attacker' },
  },
  trySprt: {
    intro: 'Add the attempts by hand, or let a simulated user or attacker arrive, one attempt at a time. The box shows the sum, the thresholds and the posterior probability, with a prior of half and half. Lower α: more failures are needed to block.',
    fail: '+ failed attempt',
    success: '+ successful attempt',
    legit: 'Simulated user',
    attacker: 'Simulated attacker',
    alphaLabel: 'Error allowed on users (α)',
    alphaName: (a) => `1 in ${EN.int(1 / a)}`,
    result: (path, n, decision) => {
      const last = path.llr[path.llr.length - 1];
      const state = decision === 'block' ? 'address blocked' : decision === 'clear' ? 'address cleared' : 'no decision yet';
      return `${EN.int(n)} ${n === 1 ? 'attempt' : 'attempts'}, sum ${EN.num(last, 3)}, P(attacker) = ${EN.pct(1 / (1 + Math.exp(-last)), 2)}: ${state}.`;
    },
    walk: 'The address of this box',
  },
  rate: {
    intro: (c) => `A simulated phishing campaign sends ${EN.int(CAMPAIGN.perDay)} e-mails a day for ${EN.int(CAMPAIGN.days)} days. The true share of those who click, ${EN.pct(CAMPAIGN.rate, 0)}, is unknown to the analyst: it is estimated from the clicks. Two analysts start from different priors: one knows nothing, Beta(${PRIORS.uniform.join(', ')}), uniform on [0, 1]; the other has read that usually ${EN.pct(PRIORS.informed[0] / (PRIORS.informed[0] + PRIORS.informed[1]), 0)} click, and expresses it with Beta(${PRIORS.informed.join(', ')}), worth ${EN.int(PRIORS.informed[0] + PRIORS.informed[1])} e-mails already seen. Security wants to stay below ${EN.pct(TARGET_RATE, 0)}. Clicks of the ten days: ${c.days.map((d) => d.clicks).join(', ')}.`,
    paras: (c) => {
      const u = c.uniform;
      const i = c.informed;
      const d1 = u[1];
      const last = u[u.length - 1];
      const lastI = i[i.length - 1];
      return [
        `The Beta prior is conjugate to the binomial: after k clicks out of n e-mails the posterior is again a Beta, with k added to the first parameter and n - k to the second. Here the engine comes down to counting. After the first day (${EN.int(d1.clicks)} clicks out of ${EN.int(d1.sent)}) the first analyst estimates ${EN.pct(d1.mean)}, with a 95% credible interval from ${EN.pct(d1.lo)} to ${EN.pct(d1.hi)}; the second, held back by the prior, ${EN.pct(i[1].mean)}.`,
        `After ${EN.int(last.sent)} e-mails and ${EN.int(last.clicks)} clicks the two almost coincide: ${EN.pct(last.mean)} (from ${EN.pct(last.lo)} to ${EN.pct(last.hi)}) and ${EN.pct(lastI.mean)} (from ${EN.pct(lastI.lo)} to ${EN.pct(lastI.hi)}). The data have drowned the prior. The question of security has a direct answer: given the clicks, the probability that the true share exceeds ${EN.pct(TARGET_RATE, 0)} is ${EN.pct(c.aboveUniform[c.aboveUniform.length - 1])}. Another training session is needed.`,
      ];
    },
    after: 'The credible interval reads as one would like to read every interval: given the prior and the clicks, the true share lies inside with probability 95%. A confidence interval says something else, and section 2.7 compares them.',
    chartTitle: 'The estimate of the two analysts, day after day, with its 95% interval',
    tableTitle: 'The posteriors, day by day',
    cols: { day: 'Day', sent: 'E-mails', clicks: 'Clicks', uniform: 'Uniform prior', informed: 'Informed prior', above: `P(share > ${EN.pct(TARGET_RATE, 0)})` },
    interval: (r) => `${EN.pct(r.mean)} [${EN.pct(r.lo)}, ${EN.pct(r.hi)}]`,
  },
  tryBelief: {
    intro: 'Choose the prior, then add the e-mails one at a time, or ten at a time (simulated at the true 12%). The dashed curve is the prior, the dotted one the likelihood, the solid one the posterior: the posterior moves from the prior towards the data, and narrows.',
    priorLabel: 'Prior',
    priors: { uniform: 'Uniform, Beta(1, 1)', jeffreys: 'Jeffreys, Beta(1/2, 1/2)', informed: 'Informed, Beta(3, 17)', wrong: 'Wrong, Beta(40, 60)' },
    click: '+ clicked',
    noClick: '+ did not click',
    ten: '+ 10 e-mails',
    result: (state, post, above) => (state.sent === 0
      ? `No e-mail yet: the posterior is the prior, with mean ${EN.pct(post.mean)}.`
      : `${EN.int(state.clicks)} clicks out of ${EN.int(state.sent)} e-mails: posterior Beta(${EN.num(post.a, post.a % 1 ? 1 : 0)}, ${EN.num(post.b, post.b % 1 ? 1 : 0)}), mean ${EN.pct(post.mean)}, 95% interval from ${EN.pct(post.lo)} to ${EN.pct(post.hi)}, P(share > ${EN.pct(TARGET_RATE, 0)}) = ${EN.pct(above)}.`),
    chartTitle: 'Prior, likelihood and posterior of the share of clicks',
  },
  tryPrior: {
    intro: 'Drag the points to draw the prior you want: even with two humps, even zero on a stretch. The posterior is computed on a grid of 201 values, multiplying point by point and normalizing: no conjugate formula, the engine as it is. With the data of one day the drawing matters a lot; with those of ten days almost nothing. With the keyboard: arrows left and right pick a point, up and down move it.',
    shapeLabel: 'Ready-made shapes',
    shapes: { flat: 'Flat', informed: 'Like Beta(3, 17)', twoPeaks: 'Two humps', pessimist: 'Pessimist' },
    dataLabel: 'Data',
    data: { day1: 'The first day', days3: 'Three days', days10: 'Ten days' },
    editorLabel: 'The prior to draw: eleven points to drag, from 0 to 1',
    handle: (i, h) => `point ${i + 1} of 11, share ${EN.num(i / 10, 1)}, height ${EN.num(h, 2)}`,
    result: (g, flat) => `${EN.int(g.clicks)} clicks out of ${EN.int(g.sent)}: posterior mean ${EN.pct(g.mean)}, 95% interval from ${EN.pct(g.lo)} to ${EN.pct(g.hi)}. With the flat prior it would be ${EN.pct(flat.mean)}, from ${EN.pct(flat.lo)} to ${EN.pct(flat.hi)}.`,
    chartTitle: 'The prior drawn, the likelihood and the posterior on the grid',
  },
  frequentist: {
    intro: [
      'The same clicks, two different questions. The Bayesian credible interval answers: given these clicks, where is the true share? The frequentist confidence interval answers: if I repeated the campaign many times, how often would my method catch the true share? The 95% of the first is a probability about the share; that of the second is a property of the procedure, and once the interval is computed it either contains the true share or it does not.',
      `To compare them one looks at the coverage: the probability, when the true share is p, that the interval computed from the data contains it. With ${EN.int(COVERAGE_N)} e-mails (one day of the campaign) it is computed exactly, summing the binomial probabilities of the ${EN.int(COVERAGE_N + 1)} possible results, without simulating. The methods: Wald (the textbook formula, p̂ ± 1.96 √(p̂(1 - p̂)/n)), Wilson (1927, the inverse of the score test), Clopper-Pearson (1934, exact with the binomial) and Jeffreys, the credible interval of the prior Beta(1/2, 1/2).`,
    ],
    paras: (cov) => {
      const S = cov.summary;
      return [
        `Wald covers ${EN.pct(S.wald.mean)} on average instead of 95%, and for small shares it collapses: at p = ${EN.pct(S.wald.minAt, 1)} it covers ${EN.pct(S.wald.min)}, because with zero clicks the interval is [0, 0]. Clopper-Pearson never goes below 95% (minimum ${EN.pct(S.clopper.min)}), but to manage it covers ${EN.pct(S.clopper.mean)} on average and is the widest (${EN.pct(S.clopper.width)} against ${EN.pct(S.wilson.width)} for Wilson). Wilson (${EN.pct(S.wilson.mean)} on average) and Jeffreys (${EN.pct(S.jeffreys.mean)}) oscillate around 95%.`,
        'The Bayesian interval of Jeffreys, born from a probability about the share, thus also has good frequentist coverage: Brown, Cai and DasGupta (2001) recommend it, together with Wilson, instead of Wald. It is a first taste of the bridge of section 2.11: as the data grow, the two ways of reasoning give the same intervals.',
      ];
    },
    simulation: (s) => `The same coverages, simulated over ${EN.int(s.runs)} campaigns at the true share of ${EN.pct(s.p, 0)}: ${['wald', 'wilson', 'clopper', 'jeffreys'].map((m) => `${en.names.methods[m]} ${EN.pct(s.hits[m] / s.runs)} (exact ${EN.pct(s.exact[m])})`).join(', ')}.`,
    chartTitle: `The exact coverage of the 95% intervals with ${COVERAGE_N} e-mails, as the true share varies`,
    chartNote: 'Wald leaves the chart for the smallest shares: it falls as low as the table says.',
    tableTitle: 'The four methods compared',
    cols: { method: 'Method', mean: 'Mean coverage', min: 'Minimum coverage', at: 'Where', width: 'Mean width' },
  },
  spam: {
    intro: [
      'The most widely used Bayesian engine of cybersecurity is the spam filter: Sahami and colleagues proposed it in 1998, Paul Graham made it famous in 2002 with "A Plan for Spam". Every word is a piece of evidence, and the filter adds up their weights.',
    ],
    source: (d) => `The data: the ${d.dataset}, collected by Almeida, Gómez Hidalgo and Yamakami: ${EN.int(d.messages)} SMS in English, labelled as spam or legitimate. Licence ${d.license}, which asks to cite the source: ${d.paper}.`,
    links: { dataset: 'The collection (UCI)', paper: 'The paper' },
    paras: (m) => {
      const c = m.matrix;
      return [
        `The file repeats ${EN.int(m.corpus.repeated)} messages: the filter counts them once, because the same message in training and in testing would inflate the accuracy. ${EN.int(m.corpus.docs.length)} distinct messages remain; three in ten, by position, are used for testing (${EN.int(m.corpus.test.length)}), the other ${EN.int(m.corpus.train.length)} for learning. The words are the runs of letters and digits, lowercase, plus the pound sign.`,
        `The model is multinomial naive Bayes: for every word, its frequency in the spam and in the legitimate messages of training, with Laplace’s correction (+1) for the words never seen in one of the two classes. "Naive" because it treats the words as independent given the class, which is false ("free" and "prize" travel together), but turns the engine into a sum. The prior is the share of spam in training, ${EN.pct(m.trainSpamShare)}.`,
        `On the ${EN.int(c.n)} test messages the filter stops ${EN.int(c.tp)} spam out of ${EN.int(c.tp + c.fn)} and mistakes ${EN.int(c.fp)} legitimate messages out of ${EN.int(c.fp + c.tn)} for spam: accuracy ${EN.pct(c.accuracy)}, precision ${EN.pct(c.precision)}, recall ${EN.pct(c.recall)}, area under the ROC curve ${EN.num(m.auc, 3)}. The trivial rule that calls everything legitimate reaches ${EN.pct(m.majority.accuracy)}: McNemar’s test on the messages where the two disagree gives p ≈ ${EN.p(m.mcnemar.p, m.mcnemar.log10p)}.`,
      ];
    },
    matrixTitle: 'The confusion matrix on the test messages',
    matrixRows: { spam: 'True spam', ham: 'True legitimate' },
    matrixCols: { truth: '', spam: 'The filter says spam', ham: 'The filter says legitimate' },
    wordsTitle: 'The words that weigh most (at least 10 times in training)',
    wordsCols: { spam: 'Towards spam', spamWeight: 'Weight', ham: 'Towards legitimate', hamWeight: 'Weight' },
    chartTitle: 'The test messages by their log-odds of spam: right of 0 the filter says spam',
    tableTitle: 'The test messages by interval of log-odds',
    binCols: { bin: 'Log-odds', spam: 'Spam', ham: 'Legitimate' },
    bin: (b) => (b.to === Infinity ? `≥ ${EN.int(b.from)}` : `from ${EN.int(b.from)} to ${EN.int(b.to)}`),
    fieldLabel: 'Write a message, in English',
    baseLabel: 'Inbox',
    bases: { train: 'Like the training set', one: 'One spam in 100' },
    result: (sc) => `P(spam) = ${EN.pct(sc.posterior, 2)} (log-odds ${EN.num(sc.logOdds, 2)}, ${EN.int(sc.words)} ${sc.words === 1 ? 'word' : 'words'}).`,
    partsTitle: 'The contribution of every word',
    partsCols: { token: 'Word', count: 'Times', weight: 'Weight (log)' },
    unknown: 'never seen: no weight',
    after: 'Change the inbox: the same message, in an inbox where spam is rare, has a lower posterior. It is the base rate of section 2.3, entering through the prior.',
  },
  kdd: {
    intro: (d) => `The same engine on the connections of NSL-KDD, the data of Homework #6: from the protocol, the service and the flag, is the connection an attack? The data: ${d.dataset}, ${EN.int(d.records)} connections; the dataset and the paper must be cited, ${d.paper}.`,
    paras: (k) => [
      `Three connections in ten, by position, are used for testing (${EN.int(k.test)}), the other ${EN.int(k.train)} for learning. Categorical naive Bayes multiplies the prior (attacks are ${EN.pct(k.classes[1] / (k.classes[0] + k.classes[1]))} of training) by three likelihood ratios, one per field, with Laplace’s correction. Accuracy ${EN.pct(k.naive.accuracy)}, recall on the attacks ${EN.pct(k.naive.recall)}, false positives ${EN.pct(k.naive.fpr)}, area under the ROC curve ${EN.num(k.auc, 3)}.`,
      `Homework #6 showed that protocol, service and flag are strongly dependent: the "naive" hypothesis is false here too. The comparison with exact Bayes measures it. The full table of the ${EN.int(k.cells)} combinations seen in training, with a Beta(1, 1) prior in every cell, makes no independence assumption and reaches ${EN.pct(k.joint.accuracy)} (the ${EN.int(k.unseen)} test connections with a combination never seen take the prior). Naive Bayes counts twice the evidence that says the same thing, and its posteriors are too confident, but the decision changes little. Both beat by far the rule that calls everything an attack (${EN.pct(k.majority.accuracy)}; McNemar, p ≈ ${EN.p(k.mcnemar.p, k.mcnemar.log10p)}).`,
    ],
    tableTitle: 'Three classifiers on the test connections',
    cols: { model: 'Classifier', accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', fpr: 'False positives' },
    models: { naive: 'Naive Bayes (three weights)', joint: 'Full table (exact Bayes)', majority: 'Always "attack"' },
    chooseTitle: 'Choose a connection',
    labels: { protocol: 'Protocol', service: 'Service', flag: 'Flag' },
    partsCols: { feature: 'Field', value: 'Value', attacks: 'Attacks', normals: 'Normal', weight: 'Weight (log)' },
    features: { protocol: 'protocol', service: 'service', flag: 'flag' },
    result: (e) => `Naive Bayes: P(attack) = ${EN.pct(e.posterior, 2)}. ${e.joint.posterior === null ? 'The full table never saw this combination: the prior remains.' : `The full table saw this combination ${EN.int(e.joint.attacks + e.joint.normals)} times, ${EN.int(e.joint.attacks)} as an attack: P(attack) = ${EN.pct(e.joint.posterior, 2)}.`}`,
  },
  convergence: {
    intro: [
      'A sequence of random variables X_1, X_2, ... can approach a limit X in different ways, which are not equivalent. The four definitions of the assignment, for every ε > 0:',
    ],
    formulas: [
      'in probability:       P(|X_n - X| > ε) → 0',
      'almost surely:        P(lim X_n = X) = 1',
      'in mean square:       E[(X_n - X)²] → 0',
      'in distribution:      F_n(x) → F(x) at every point of continuity of F',
    ].join('\n'),
    after: [
      `The example that runs through the section: an IDS rule raises a false alarm on ${EN.pct(FALSE_ALARMS.rate, 0)} of the normal connections, and F̂_n, the share of false alarms in the first n connections, estimates that ${EN.pct(FALSE_ALARMS.rate, 0)}. Every form of convergence says something different about how far F̂_n can be trusted; the tolerance band is one point, ε = ${EN.plain(FALSE_ALARMS.epsilon)}.`,
    ],
  },
  probability: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'Convergence in probability says that, for a fixed n large enough, a deviation wider than ε is unlikely. The weak law of large numbers guarantees it for the mean of independent values with finite variance, and the proof takes one line, with Chebyshev’s inequality: P(|F̂_n - p| > ε) ≤ Var(F̂_n)/ε² = p(1 - p)/(n ε²) → 0.',
        `Here the probability can also be computed exactly, with the binomial: ${EN.pct(at(100).exact)} after 100 connections, ${EN.pct(at(1000).exact)} after 1,000, ${EN.prob(at(10000).exact)} after 10,000. The chart compares it with the share of the ${EN.int(PATHS.count)} simulated rules outside the band and with Chebyshev’s bound, which is true but loose.`,
      ];
    },
    after: 'Convergence in probability speaks of one n at a time: after 1,000 connections the estimate is almost always good. It says nothing about the history of a single rule, which might leave the band many more times. That is the business of almost sure convergence.',
    chartTitle: 'Outside the band of one point: the simulated rules, the exact probability and Chebyshev’s bound',
    tableTitle: 'The rules outside the band',
    cols: { n: 'n', simulated: 'Simulated', exact: 'Exact', chebyshev: 'Chebyshev' },
  },
  almost: {
    paras: (paths) => {
      const c = paths.checks.find((x) => x.n === 1000);
      return [
        'Almost sure convergence asks for more: that almost every path, taken as a whole, ends up inside the band and never leaves it again. In formulas it is equivalent to P(sup_{m ≥ n} |X_m - X| > ε) → 0: it is not enough that at every n a deviation is unlikely, it must be unlikely that there is any deviation at all, from n on. The strong law of large numbers (Kolmogorov, 1933) guarantees it for the mean of independent and identically distributed values with finite mean.',
        `The ${EN.int(paths.count)} simulated rules show it: after ${EN.int(1000)} connections ${EN.pct(c.outside)} are outside the band, but ${EN.pct(c.after)} will leave it at least once more before ${EN.int(paths.length)} (the sup is cut there). This share too goes to zero: at ${EN.int(10000)} connections no rule is outside any more.`,
        'The tool to decide is the Borel-Cantelli lemma. If the probabilities of events A_n have a finite sum, almost surely only finitely many of them happen; if the events are independent and the sum is infinite, infinitely many happen. With independent X_n Bernoulli(1/n) the sum of 1/n diverges: the ones never stop, and X_n does not converge to 0 almost surely, even though P(X_n = 1) = 1/n → 0. With Bernoulli(1/n²) the sum converges (to π²/6): after a while, only zeros.',
      ];
    },
    after: 'For an IDS rule in production it is the difference between "today the estimate is almost certainly good" and "from some day on the estimate will stay good forever".',
    chartTitle: '20 of the 1,000 rules: the share of false alarms, connection after connection, and the band of one point',
    chart2Title: 'Outside the band at n, and outside at least once more after n',
    tableTitle: 'The two shares, by n',
    cols: { n: 'n', outside: 'Outside at n', after: 'Outside again after n' },
  },
  trySequences: {
    intro: 'Choose a sequence: the chart shows 12 of its paths up to n = 1,000, the table its exact numbers and which kinds of convergence hold. The paths of Bernoulli(1/n) have ones scattered forever; those of Bernoulli(1/n²) die out at once; the "typewriter" passes over every point in every block; the spike n·1{U < 1/n} dies out early, but its mean square explodes.',
    chooseLabel: 'Sequence',
    names: { mean: 'Mean of coins - 1/2', bern1: 'Bernoulli(1/n)', bern2: 'Bernoulli(1/n²)', typewriter: 'Typewriter', spike: 'Spike n·1{U < 1/n}', flip: '(-1)^n Z' },
    describe: {
      mean: 'The mean of n tosses of a fair coin, minus 1/2: it converges to 0 in every sense.',
      bern1: 'Independent values, 1 with probability 1/n: in probability and in L2 yes, almost surely no.',
      bern2: 'Independent values, 1 with probability 1/n²: every kind of convergence.',
      typewriter: 'The indicator of an interval of length 2^-k sliding over [0, 1]: in probability and in L2 yes, but every path is 1 infinitely many times.',
      spike: 'It is n if U < 1/n, and 0 otherwise: almost surely and in probability yes, in L2 no, because E[X_n²] = n.',
      flip: 'A standard normal Z, with its sign changed at every step: the law is always N(0, 1), so it converges in distribution to Z; but |X_n - Z| = 2|Z| at every odd n.',
    },
    tableTitle: 'The exact numbers of the sequence',
    cols: { n: 'n', deviation: `P(|X_n - X| > ${EN.plain(SEQUENCE_EPSILON)})`, l2: 'E[(X_n - X)²]', afterwards: 'Away again after n', simulated: 'Paths still away' },
    modesTitle: 'Which kinds of convergence hold',
    modes: { probability: 'In probability', as: 'Almost sure', l2: 'In L2', distribution: 'In distribution' },
    holds: 'yes',
    fails: 'no',
    never: '1 (it never stops)',
    simulatedNote: 'The last column counts the 12 simulated paths still away from the limit after n, up to n = 1,000.',
  },
  l2: {
    paras: (paths) => {
      const c = paths.checks.find((x) => x.n === 1000);
      return [
        `In mean square the distance counts with its square: E[(F̂_n - p)²] → 0. For the mean of independent values it is the variance, p(1 - p)/n: halving the error takes four times the data. The ${EN.int(paths.count)} simulated rules follow it: at n = 1,000 the mean square error is ${EN.sci(c.mse, 2)}, the exact one ${EN.sci(c.exactMse, 2)}.`,
        'Convergence in mean square implies convergence in probability: by Markov’s inequality, P(|X_n - X| > ε) ≤ E[(X_n - X)²]/ε². The converse does not hold, and neither does any link with almost sure convergence, in either direction. The spike Y_n = n·1{U < 1/n} goes to 0 almost surely (as soon as n exceeds 1/U it stays 0 forever), but E[Y_n²] = n explodes: rare huge values are enough to ruin the mean square, as one giant connection ruins the mean of the bytes (section 1.10). Bernoulli(1/n), on the contrary, converges in L2 (E[X_n²] = 1/n) but not almost surely.',
      ];
    },
    chartTitle: 'The mean square error of the 1,000 rules and p(1 - p)/n, on logarithmic axes',
    tableTitle: 'The mean square error, by n',
    cols: { n: 'n', simulated: 'Simulated', exact: 'p(1 - p)/n' },
    counterTitle: 'Two counterexamples: almost sure without L2, L2 without almost sure',
    counterCols: { n: 'n', spikeP: 'Spike: P(Y_n ≠ 0)', spikeL2: 'Spike: E[Y_n²]', bernP: 'Bernoulli(1/n): P(X_n ≠ 0)', bernL2: 'Bernoulli(1/n): E[X_n²]' },
  },
  distribution: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'Convergence in distribution is the weakest: it only asks that the distribution function of X_n approach that of X, at the points where the latter is continuous. It says nothing about the values of X_n and X on the same outcome: X_n = (-1)^n Z always has the law N(0, 1) of Z, so it converges to Z in distribution, but it never gets close to Z. When the limit is a constant, converging in distribution is the same as converging in probability: that is why the law of large numbers can be stated both ways, F̂_n → p.',
        'The central limit theorem does not speak of the value of F̂_n but of the shape of its error: √n (F̂_n - p)/σ converges in distribution to the standard normal. More generally, so does the standardized sum of n independent values with finite variance. The Berry-Esseen theorem also says how fast: the Kolmogorov distance from the normal (the largest difference between the two distribution functions) is at most C ρ/(σ³ √n), with ρ = E|X - μ|³ and, for identically distributed values, C = 0.4748 (Shevtsova, 2011).',
        `The distances of the chart are exact, not simulated: for the false alarms the law of the sum is the binomial, for the times between two alarms (exponential) it is the Gamma. The false alarms, rare and so skewed, converge slowly: ${EN.num(at(10).bernoulli, 3)} at n = 10, ${EN.num(at(100).bernoulli, 3)} at 100, ${EN.num(at(1000).bernoulli, 3)} at 1,000. The exponential ones much faster: ${EN.num(at(10).exponential, 3)}, ${EN.num(at(100).exponential, 4)}, ${EN.num(at(1000).exponential, 4)}. Both stay below their Berry-Esseen bound, and follow it as 1/√n.`,
      ];
    },
    tests: (c) => `Three Kolmogorov-Smirnov tests on ${EN.int(CLT_REPS)} simulated sums (summarized in section 4): ${EN.int(c.exponential.n)} standardized exponential values against the normal, D = ${EN.num(c.exponential.D, 4)}, p ≈ ${EN.p(c.exponential.p)}: with many samples the rule of thumb "n ≥ 30" is not enough for a skewed law (the exact distance is ${EN.num(c.exponential.exact, 4)}). ${EN.int(c.uniform.n)} uniform values, the old recipe for generating normal values: D = ${EN.num(c.uniform.D, 4)}, p = ${EN.p(c.uniform.p)}. The mean of ${EN.int(c.cauchy.n)} Cauchy values against the Cauchy law itself: D = ${EN.num(c.cauchy.D, 4)}, p = ${EN.p(c.cauchy.p)}.`,
    chartTitle: 'Kolmogorov distance from the normal, exact, and the Berry-Esseen bound, on logarithmic axes',
    tableTitle: 'The exact distances and the bounds, by n',
    cols: { n: 'n', bernoulli: 'False alarms', bernoulliBound: 'Bound', exponential: 'Exponential', exponentialBound: 'Bound' },
  },
  tryClt: {
    intro: `Choose the law and n: the histogram shows ${EN.int(5000)} standardized sums, the curve the limit law. With n = 1 you see the starting law; as n grows, the shape becomes the bell. Cauchy has no variance: its means stay Cauchy, for every n.`,
    lawLabel: 'Law',
    laws: { bernoulli: 'False alarms (Bernoulli 3%)', exponential: 'Times between alarms (exponential)', uniform: 'Uniform', cauchy: 'Cauchy' },
    nLabel: 'n',
    result: (t, state) => `n = ${EN.int(state.n)}: Kolmogorov distance from the ${t.cauchy ? 'Cauchy law' : 'normal'} ${EN.num(t.test.D, 4)}, Kolmogorov-Smirnov test p = ${EN.p(t.test.p)}${t.outside > 0 ? `; ${EN.pct(t.outside)} of the sums fall outside the chart` : ''}.`,
    chartTitle: 'The standardized sums and the limit law',
  },
  tryHash: {
    intro: 'A service gives every session a random identifier of a few bits. How many sessions are enough for two to share one? It is the birthday paradox: with N possible values, the probability of a collision among m identifiers is 1 - (1 - 1/N)(1 - 2/N)...(1 - (m - 1)/N), and it becomes 1/2 around 1.18 √N. Run the trials: the Monte Carlo estimate converges to the exact probability (law of large numbers), with oscillations that shrink as 1/√r inside the band of the central limit.',
    bitsLabel: 'Bits',
    factorLabel: 'Sessions',
    factors: (m) => `${EN.int(m)}`,
    add100: '+ 100 trials',
    add1000: '+ 1,000 trials',
    result: (state, exact, m, bits) => (state.trials === 0
      ? `${EN.int(m)} identifiers of ${bits} bits: exact probability of a collision ${EN.pct(exact, 2)}.`
      : `${EN.int(state.trials)} trials, ${EN.int(state.hits)} with a collision: estimate ${EN.pct(state.hits / state.trials, 2)}, exact ${EN.pct(exact, 2)}, off by ${EN.num(Math.abs(state.hits / state.trials - exact) / Math.sqrt((exact * (1 - exact)) / state.trials), 2)} standard errors.`),
    thirtyTwo: (m) => `With 32 bits a collision happens half the time already at ${EN.int(m)} sessions: few for a real service.`,
    chartTitle: 'The estimate of the probability of a collision, trial after trial, and the 95% band around the exact value',
  },
  map: {
    paras: [
      'The four kinds of convergence are linked by implications that always hold. Almost sure implies in probability. In mean square implies in probability (Markov), and more generally in L^p implies in L^q for q < p. In probability implies in distribution. Every other arrow is false, and for each one there is a counterexample among the sequences of the box of section 1.2.',
      'Two partial converses hold: convergence in distribution to a constant implies convergence in probability; and from a sequence that converges in probability one can always extract one that converges almost surely (Riesz). With a control on the tails (uniform integrability) convergence in probability also gives convergence in mean.',
    ],
    tableTitle: 'From one mode to another',
    cols: { from: 'If it converges', to: 'then it converges', holds: 'True?', counter: 'Counterexample' },
  },
  tryMap: {
    intro: 'Click a mode of convergence: the modes it implies light up in green, those it does not imply in red, each with its counterexample.',
    modes: { as: 'Almost sure', l2: 'In mean square', probability: 'In probability', distribution: 'In distribution' },
    pick: 'Choose a mode to see what it implies.',
    result: (mode, list) => `${en.tryMap.modes[mode]} implies: ${list.holds.length ? listOf(list.holds.map((m) => en.tryMap.modes[m].toLowerCase()), 'and') : 'only itself'}. It does not imply: ${list.fails.length ? listOf(list.fails.map((f) => `${en.tryMap.modes[f.mode].toLowerCase()} (counterexample: ${en.trySequences.names[f.counter]})`), 'and') : 'anything'}.`,
    diagramLabel: 'The map of implications between the four modes of convergence',
  },
  heavy: {
    paras: (b) => [
      'The law of large numbers needs a finite mean; the central limit with its √n, a finite variance. When they are missing, or when the tails are so heavy that the variance exists only on paper, √n is no longer enough. The Cauchy law has neither: the mean of n of its values has again the Cauchy law, as wide as a single value. The means of the chart jump forever, because now and then a huge value arrives and moves them.',
      `The bytes sent by the ${EN.int(b.n)} connections of NSL-KDD have finite mean and variance, but very heavy tails: mean ${EN.int(b.mean)} bytes, median ${EN.int(b.median)}, maximum ${EN.int(b.max)}; ${EN.int(b.zeros)} connections send nothing, and the 10 largest carry ${EN.pct(b.top10)} of all the bytes (the largest alone ${EN.pct(b.top1)}). The skewness is ${EN.num(b.skewness, 1)}. The Berry-Esseen theorem promises a distance from the normal below 0.05 only from ${EN.int(b.needed)} connections on.`,
    ],
    bytes: (rows) => `To see it, ${EN.int(BYTES_REPS)} samples of n connections are drawn with replacement, and their mean is standardized with the true mean and standard deviation. With n = 1,000 the distance from the normal is still ${EN.num(rows[2].D, 3)}, and ${EN.pct(rows[2].below)} of the means fall below the true mean: almost every sample misses the giant connections, and the few that contain them jump far away. An alarm threshold built on the normal for "the mean bytes of 1,000 connections" would be badly wrong: better the median, logarithms or extreme value theory.`,
    cauchyTitle: 'Eight means of Cauchy values, value after value: they never stop',
    factsTitle: 'The bytes of the connections of NSL-KDD',
    facts: { mean: 'Mean', median: 'Median', sd: 'Standard deviation', max: 'Maximum', zeros: 'Connections with no bytes', top10: 'Share of the 10 largest', skewness: 'Skewness', ratio: 'Berry-Esseen ρ/σ³', needed: 'n for a distance < 0.05' },
    histTitle: 'The standardized means of 1,000 connections and the normal density',
    tableTitle: 'The means of n connections, against the normal',
    cols: { n: 'n', D: 'Distance', p: 'p-value', below: 'Below the true mean', median: 'Standardized median' },
  },
  speed: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'The law of large numbers says that the probability of being wrong goes to zero; to decide how many connections are needed one must know how fast. Chebyshev uses only the variance and goes down as 1/n. Hoeffding (1963) uses the fact that the values lie between 0 and 1 and goes down exponentially, 2 exp(-2 n ε²). The central limit gives an approximation, not a bound: 2 Φ(-ε √n/σ).',
        `For the false alarms at ${EN.pct(FALSE_ALARMS.rate, 0)} with one point of tolerance, at n = 10,000 the exact probability is ${EN.prob(at(10000).exact)}, Chebyshev says ${EN.prob(at(10000).chebyshev)}, Hoeffding ${EN.prob(at(10000).hoeffding)}: here Hoeffding is worse than Chebyshev, because it does not know that the variance p(1 - p) is small. At n = 100,000 the exponential wins (${EN.prob(at(100000).hoeffding)} against ${EN.prob(at(100000).chebyshev)}), while the true probability is ${EN.prob(at(100000).exact)}. The normal follows the exact probability closely, but in the far tails it can be wrong by orders of magnitude: Berry-Esseen says so, since it controls the absolute distance, not the relative one.`,
      ];
    },
    chartTitle: 'P(|F̂_n - 3%| > 1 point): exact, the two bounds and the normal, on logarithmic axes',
    tableTitle: 'The probability of a deviation and its bounds, by n',
    cols: { n: 'n', exact: 'Exact', chebyshev: 'Chebyshev', hoeffding: 'Hoeffding', normal: 'Normal' },
  },
  bvm: {
    paras: (rows) => {
      const first = rows[0];
      const at = (n) => rows.find((r) => r.n === n);
      const last = rows[rows.length - 1];
      return [
        `The two parts of the assignment meet here. Two analysts watch the same long phishing campaign, up to ${EN.int(last.n)} e-mails at the true share of ${EN.pct(CAMPAIGN.rate, 0)}: one with the uniform prior, the other with a wrong and self-confident prior, Beta(${PRIORS.wrong.join(', ')}), centred on ${EN.pct(PRIORS.wrong[0] / (PRIORS.wrong[0] + PRIORS.wrong[1]), 0)} and as strong as ${EN.int(PRIORS.wrong[0] + PRIORS.wrong[1])} e-mails. After ${EN.int(first.n)} e-mails their means are ${EN.pct(first.uniform.mean)} and ${EN.pct(first.wrong.mean)}; after ${EN.int(1000)}, ${EN.pct(at(1000).uniform.mean)} and ${EN.pct(at(1000).wrong.mean)}; after ${EN.int(last.n)}, ${EN.pct(last.uniform.mean)} and ${EN.pct(last.wrong.mean)}.`,
        `The posterior converges to the true share (consistency, Doob 1949): almost surely, like the mean of the clicks. And it becomes normal: the Bernstein-von Mises theorem says that, for large n, the posterior is about N(θ̂, θ̂(1 - θ̂)/n), whatever regular prior was used. The Kolmogorov distance between each posterior and its normal goes down as 1/√n (${EN.num(at(100).uniform.distance, 4)} at n = 100, ${EN.num(last.uniform.distance, 4)} at ${EN.int(last.n)}). That is why, with a lot of data, the credible interval and the confidence interval coincide, and the prior stops mattering. With little data, as on the first day of section 2.6, it matters a great deal.`,
      ];
    },
    chartTitle: 'The posterior mean of the two analysts, with ±1.96 standard deviations, as the e-mails grow',
    chart2Title: 'The Kolmogorov distance between each posterior and its normal approximation',
    tableTitle: 'The two posteriors, by n',
    cols: { n: 'n', clicks: 'Clicks', uniform: 'Uniform prior', wrong: 'Wrong prior', dUniform: 'Distance (uniform)', dWrong: 'Distance (wrong)' },
    pair: (x) => `${EN.pct(x.mean, 2)} ± ${EN.pct(1.96 * x.sd, 2)}`,
  },
  roles: {
    intro: 'The four modes of convergence are the language in which limit theorems are written. The table says which mode each one uses, under which conditions, and where the page shows it.',
    tableTitle: 'The limit theorems and their modes of convergence',
    cols: { theorem: 'Theorem', statement: 'What converges', mode: 'Mode', condition: 'Conditions', where: 'Section' },
    rows: [
      { theorem: 'Weak law of large numbers', statement: 'X̄_n → μ', mode: 'in probability', condition: 'independent with finite variance (Chebyshev); a finite mean is enough (Khinchin)', where: '1.1' },
      { theorem: 'Strong law of large numbers', statement: 'X̄_n → μ', mode: 'almost sure', condition: 'independent and identically distributed, with finite mean (Kolmogorov)', where: '1.2' },
      { theorem: 'Law of large numbers in L²', statement: 'E[(X̄_n - μ)²] = σ²/n → 0', mode: 'in mean square', condition: 'uncorrelated, with finite variance', where: '1.3' },
      { theorem: 'Central limit theorem', statement: '√n (X̄_n - μ)/σ → N(0, 1)', mode: 'in distribution', condition: 'independent and identically distributed, with finite variance (Lindeberg-Lévy)', where: '1.4' },
      { theorem: 'Berry-Esseen', statement: 'sup |F_n - Φ| ≤ C ρ/(σ³ √n)', mode: 'speed in distribution', condition: 'finite third moment', where: '1.4, 1.11' },
      { theorem: 'Law of large numbers in distribution', statement: 'X̄_n → μ, a constant', mode: 'in distribution, here the same as in probability', condition: 'as for the weak law', where: '1.4' },
    ],
    after: 'The two laws say that the mean approaches the true mean: the weak one at every fixed n, the strong one along every path, the L² version also on average. The central limit says how the error that is left is distributed, and so how large it is: about σ/√n. It is the combination inference needs. The law of large numbers guarantees that the estimate goes to the right place; the central limit gives the shape of its uncertainty, from which intervals and tests are built.',
  },
  results: {
    intro: 'Many results of statistics are convergence theorems in disguise. Four of them, with the numbers of the false alarms and of the times between alarms.',
    consistency: 'Consistency. An estimator is consistent if it converges to the parameter: weakly (in probability) or strongly (almost surely). The share of false alarms F̂_n is consistent in both senses, by the two laws of large numbers; and so is every continuous function of a consistent estimator (the continuous mapping theorem), such as 1/X̄ for a rate.',
    slutsky: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return `Slutsky (1925). If X_n converges in distribution to X and Y_n in probability to a constant c, then X_n + Y_n converges to X + c and X_n Y_n to c X. That is what makes the t statistic normal: in the central limit σ is the true one, in practice it is estimated, and the estimate converges in probability, so the limit does not change. But it is an asymptotic result. For the false alarms at ${EN.pct(FALSE_ALARMS.rate, 0)} the t statistic, with σ estimated, is ${EN.num(at(30).t, 3)} away from the normal law at n = 30, against ${EN.num(at(30).z, 3)} with σ known; at n = 1,000 the gap has almost closed (${EN.num(at(1000).t, 4)} against ${EN.num(at(1000).z, 4)}).`;
    },
    delta: (d100, d1000) => `The delta method. If √n (θ̂ - θ) converges to N(0, σ²) and g is differentiable, then √n (g(θ̂) - g(θ)) converges to N(0, g'(θ)² σ²): the error of a function of the estimate is obtained by differentiating. For the log-odds ln(p/(1 - p)) the derivative is 1/(p(1 - p)), and the approximate standard deviation is 1/√(n p(1 - p)): ${EN.num(d1000.delta, 4)} at n = 1,000, against ${EN.num(d1000.exact, 4)} exactly. At n = 100 the gap is wider (${EN.num(d100.delta, 3)} against ${EN.num(d100.exact, 3)}), and ${EN.pct(d100.excluded, 1)} of the time, with zero alarms, the log-odds do not even exist.`,
    gc: (rows) => {
      const first = rows[0];
      const last = rows[rows.length - 1];
      return `Glivenko-Cantelli (1933). The empirical distribution function F_n converges to the true one uniformly, almost surely: sup |F_n - F| → 0. Kolmogorov also gave its speed: √n sup |F_n - F| converges in distribution to a law that bears his name, the basis of the Kolmogorov-Smirnov test used all over the page. Over ${EN.int(GC_REPS)} samples of times between alarms the mean distance goes down from ${EN.num(first.meanD, 3)} (n = ${EN.int(first.n)}) to ${EN.num(last.meanD, 4)} (n = ${EN.int(last.n)}), while √n times the distance stays between ${EN.num(Math.min(...rows.map((r) => r.meanScaled)), 2)} and ${EN.num(Math.max(...rows.map((r) => r.meanScaled)), 2)}, close to the mean of Kolmogorov’s law, ${EN.num(KOLMOGOROV_MEAN, 3)}.`;
    },
    mle: (rows) => {
      const at = (n) => rows.find((r) => r.n === n).mle;
      return `The normality of the maximum likelihood estimator. Under regularity conditions √n (θ̂ - θ) converges to N(0, 1/I(θ)), with I Fisher’s information, and the variance 1/(n I(θ)) is the smallest possible for an unbiased estimator (Cramér-Rao). For the rate λ of the alarms, estimated from the times between them with λ̂ = n/S_n, the law is known exactly: at n = 30 it is ${EN.num(at(30).distance, 3)} away from the normal law, it is biased by ${EN.pct(at(30).bias, 1)} and its variance is ${EN.num(at(30).efficiency, 2)} times the Cramér-Rao bound; at n = 1,000 the distance is ${EN.num(at(1000).distance, 4)} and the variance reaches the bound. It is the frequentist side of the Bernstein-von Mises theorem (section 2.11).`;
    },
    chartTitle: 'Kolmogorov distance from the normal law: σ known, σ estimated (Slutsky) and the maximum likelihood estimator, on logarithmic axes',
    tableTitle: 'The three distances, by n',
    cols: { n: 'n', z: 'Z, σ known', t: 't, σ estimated', mle: 'MLE of the rate', bias: 'Bias of the MLE', efficiency: 'Variance / Cramér-Rao' },
    deltaTitle: 'The delta method on the log-odds',
    deltaCols: { n: 'n', exact: 'Exact standard deviation', delta: 'Delta method', excluded: 'No log-odds (k = 0)' },
    gcTitle: 'Glivenko-Cantelli: the distance between the empirical distribution function and the true one',
    gcCols: { n: 'n', meanD: 'Mean distance', meanScaled: '√n times the distance', over: 'Above 1.358 (5% expected)' },
  },
  root: {
    paras: (sizes) => [
      'The sum of n values has variance Var(S_n) = Σ Var(X_i) + 2 Σ_{i<j} Cov(X_i, X_j). If the values are independent, or even just uncorrelated, the covariances are zero and the variances add up: Var(S_n) = n σ². The standard deviation, the square root of the variance, therefore grows as σ √n and not as n; dividing by n, the mean has standard deviation σ/√n, the standard error.',
      `That is why √n is everywhere. In the law of large numbers the error of the mean goes down as 1/√n. In the central limit the error must be multiplied by exactly √n to get a law that neither collapses nor explodes (the box below shows it). In inference every interval is about 2σ/√n wide, every z or t statistic divides by σ/√n, and the sample needed grows with the square of the precision: to estimate ${EN.pct(FALSE_ALARMS.rate, 0)} of false alarms within one point, at 95%, ${EN.int(sizes[0])} connections are enough; within half a point ${EN.int(sizes[1])} are needed, within a tenth of a point ${EN.int(sizes[2])}. Halving the error costs four times the data.`,
      'The speeds of section 1.11 speak of √n too: Berry-Esseen goes down as 1/√n, and Hoeffding’s inequality, exp(-2 n ε²), says that the deviations that matter are those of order 1/√n. The chart shows the two faces of the same fact on the 1,000 simulated rules: the standard deviation of the count grows as √n, the standard error of the share goes down as 1/√n, both with slope 1/2 on logarithmic axes.',
    ],
    chartTitle: 'Standard deviation of the count (it grows as √n) and standard error of the share (it falls as 1/√n), simulated and exact, on logarithmic axes',
    tableTitle: 'The count and the share of false alarms, by n',
    cols: { n: 'n', sdCount: 'Standard deviation of the count', exactCount: 'σ √n', sdShare: 'Standard error of the share', exactShare: 'σ/√n' },
    inferenceTitle: 'The standard error and the 95% interval of the share of false alarms',
    inferenceCols: { n: 'n', variance: 'Var(S_n) = n p(1 - p)', se: 'Standard error', half: '95% half-width' },
  },
  tryScale: {
    intro: `Choose α: the three histograms show n^α (mean - 1) for ${EN.int(SCALE_REPS)} means of n exponential times between alarms (with a mean of 1 minute), with n = 10, 100 and 1,000, on the same axis. With α below 1/2 the histograms shrink towards zero as n grows: that is the law of large numbers. With α above 1/2 they widen and leave the chart. Only with α = 1/2 do they stay the same and take the shape of the normal: that is the scale of the central limit.`,
    alphaLabel: (a) => `α = ${EN.plain(a)}`,
    chartTitle: (n) => `n = ${EN.int(n)}`,
    result: (charts, alpha) => `α = ${EN.plain(alpha)}: the standard deviation is ${listOf(charts.map((c) => `${EN.num(c.factor, 3)} at n = ${EN.int(c.n)}`), 'and')}${charts.some((c) => c.outside > 0.001) ? `; outside the chart ${listOf(charts.map((c) => EN.pct(c.outside)), 'and')}` : ''}.`,
  },
  bursts: {
    paras: (f05, f09) => [
      'All this rests on independence, or at least on the absence of correlation. But real false alarms often come in bursts: a nightly backup, a scheduled scan, a wrong configuration trigger many alarms in a row. The simplest model is a Markov chain: after an alarm the next one comes with probability p + ρ(1 - p), after a quiet connection with probability p(1 - ρ). The long-run share stays p, but two neighbouring connections have correlation ρ, and two at distance k have correlation ρ^k.',
      `The covariances are no longer zero, and the variance of the sum becomes n p(1 - p) [1 + 2 Σ (1 - k/n) ρ^k], which for large n is about n p(1 - p)(1 + ρ)/(1 - ρ). With ρ = ${EN.plain(f05.rho)} the variance of ${EN.int(f05.n)} connections is ${EN.num(f05.factor, 2)} times the independent one: it is like having ${EN.int(f05.effective)} independent connections instead of ${EN.int(f05.n)}. With ρ = ${EN.plain(f09.rho)} the factor is ${EN.num(f09.factor, 1)}, and the effective connections are ${EN.int(f09.effective)}. The law of large numbers still holds, because the correlations die out, and so does the central limit with √n; but the constant in front of 1/√n is larger.`,
    ],
    simulation: (rows) => {
      const at = (rho) => rows.find((r) => r.rho === rho);
      return `The simulation of ${EN.int(BURST_SECTION.reps)} windows of ${EN.int(BURST_SECTION.n)} connections confirms it: variance ${EN.num(at(0.5).variance, 1)} (exact ${EN.num(at(0.5).exact.variance, 1)}) with ρ = 0.5 and ${EN.num(at(0.9).variance, 1)} (${EN.num(at(0.9).exact.variance, 1)}) with ρ = 0.9. The trouble is for whoever ignores the dependence: the 95% interval computed as if the connections were independent covers the true share only ${EN.pct(at(0.5).coverage, 1)} of the time with ρ = 0.5 and ${EN.pct(at(0.9).coverage, 1)} with ρ = 0.9. In statistics it is the problem of the effective sample size, common in time series and logs.`;
    },
    after: 'When the dependence does not die out fast enough (long memory) the speed changes too: the error of the mean goes down as n^(H - 1), with H > 1/2, more slowly than 1/√n. And when the variables do not even have a finite variance, as in section 1.10, √n no longer applies.',
    tableTitle: 'The simulated bursts, against the exact variance and the naive interval',
    cols: { rho: 'ρ', variance: 'Simulated variance', exact: 'Exact variance', factor: 'Factor', effective: 'Effective connections', coverage: 'Coverage of the naive interval', predicted: 'Predicted coverage' },
  },
  tryBursts: {
    intro: 'Choose the correlation between neighbouring connections. The two strips show the first 400 connections, independent and in bursts, with the same mean share of 3%; the chart shows the exact standard error of the share as n grows. The two lines are parallel, with slope -1/2: √n stays, the constant changes.',
    rhoLabel: (r) => `Correlation ρ = ${EN.plain(r)}`,
    strips: { independent: 'Independent', bursts: 'In bursts' },
    stripLabel: (name, alarms, total) => `${name}: ${EN.int(alarms)} ${alarms === 1 ? 'alarm' : 'alarms'} in the first ${EN.int(total)} connections`,
    result: (f) => `ρ = ${EN.plain(f.rho)}: with ${EN.int(f.n)} connections the variance is ${EN.num(f.factor, 2)} times the independent one, like ${EN.int(f.effective)} independent connections; the naive 95% interval covers about ${EN.pct(f.coverage, 1)}.`,
    chartTitle: 'Standard error of the share of alarms, independent and in bursts, on logarithmic axes',
  },
  conditional: {
    paras: [
      'The probability of A given B is P(A | B) = P(A ∩ B)/P(B), with P(B) > 0: the probability of A computed again in the smaller world where B has happened. Three rules follow from it. The product rule, P(A ∩ B) = P(A | B) P(B), which extends to a chain of events. The law of total probability, P(A) = Σ_i P(A | B_i) P(B_i) over a partition. And independence: A and B are independent when P(A | B) = P(A), that is, when knowing B changes nothing.',
      'In statistics conditional probability is everywhere, often without its name. The likelihood is the probability of the data given the parameter, P(data | θ). A p-value is the probability, given the null hypothesis, of data at least as extreme. The coverage of a confidence interval is conditional on the true value. And Bayes’ theorem reverses the conditioning, from P(data | θ) to P(θ | data). Confusing the two directions is the most common mistake of applied statistics; the three examples that follow show it up close.',
    ],
    chainIntro: 'The product rule: the chain of a phishing attack, stage by stage. Every probability is conditional on the previous stages: among the e-mails delivered, how many are opened; among those opened, how many are clicked; and so on. The numbers are plausible orders of magnitude, not data.',
    chainTitle: 'The chain of an attack: the conditional probabilities and their product',
    chainCols: { stage: 'Stage', p: 'P(stage | previous)', cumulative: 'P(getting this far)' },
    stages: { delivered: 'Gets past the filter', opened: 'Is opened', clicked: 'The link is clicked', credentials: 'The credentials are entered', mfa: 'MFA is bypassed' },
    chainText: (c) => `For a single e-mail the breach has probability ${EN.pct(c.breach, 2)}, the product of the five conditional ones. But a campaign is made of many e-mails, and the probability of at least one breach is 1 - (1 - p)^m: with 100 e-mails it is ${EN.pct(c.campaigns[1].breach)}, with 1,000 ${EN.pct(c.campaigns[2].breach)}. Without MFA, the last link, the probability per e-mail rises to ${EN.pct(c.withoutMfa, 1)}, and over 1,000 e-mails the breach is almost certain: the probability of avoiding it is ${EN.sci(1 - c.campaigns[2].withoutMfa, 1)}. Every link multiplies: that is why defence in depth works.`,
    indepIntro: 'Independence and conditional independence do not imply each other. The triage network of section 2.4 gives an example in each direction.',
    indepTitle: 'The two causes of the network, before and after the EDR alarm',
    indepCols: { when: '', phishing: 'P(phishing)', exploit: 'P(exploit)', product: 'Product', both: 'P(both)' },
    indepRows: { before: 'No clue', after: 'Given the EDR alarm' },
    indepText: (f) => `A priori phishing and exploit are independent: the probability of both is the product of the two. Given the EDR alarm, their common effect, they no longer are: P(both | EDR) = ${EN.pct(f.causesGivenEdr.both, 2)}, while the product would be ${EN.pct(f.causesGivenEdr.phishing * f.causesGivenEdr.exploit, 2)}; one cause makes the other less likely. Conversely, the unusual login and the EDR alarm are dependent (P(unusual login) goes from ${EN.pct(f.login, 1)} to ${EN.pct(f.loginGivenEdr, 1)} when the EDR goes off), but knowing that there was a phishing they become independent: P(unusual login | phishing) = ${EN.pct(f.loginGivenPhishing, 1)} with or without the EDR. The naive Bayes of sections 2.8 and 2.9 assumes exactly a conditional independence, of the words or of the fields given the class; and Simpson’s paradox of Homework #6 is an association that reverses when conditioning on a third factor.`,
    pvalueIntro: (e) => `A p-value is a probability conditional on the null hypothesis, not the probability of the null hypothesis. An IDS rule is documented with ${EN.pct(e.p0, 0)} of false alarms; on ${EN.int(e.n)} benign connections it raises ${EN.int(e.k)}. H0: the share is still ${EN.pct(e.p0, 0)}; H1: the rule has degraded to ${EN.pct(e.p1, 0)}.`,
    pvalueText: (e) => `The p-value is P(at least ${EN.int(e.k)} alarms | H0) = ${EN.p(e.pValue)}: below 5%, so H0 is rejected. But the probability that H0 is true needs Bayes and a prior. If rules usually stay as documented, P(H0) = ${EN.pct(e.priorH0, 0)}, with a likelihood ratio of ${EN.num(e.lr, 1)} in favour of H1 the result is P(H0 | data) = ${EN.pct(e.posteriorH0, 1)}; with a prior of half and half it would be ${EN.pct(e.posteriorEven, 1)}. The p-value does not depend on the prior; the probability of H0 does.`,
    manyText: (f) => `The same happens over many tests: among the hypotheses rejected, how many are true? It depends on how many of the hypotheses tested really have an effect, the base rate of section 2.3. With ${EN.pct(f.real, 0)} of real effects, power ${EN.pct(f.power, 0)} and α = ${EN.plain(f.alpha)}, ${EN.pct(f.falseDiscovery, 0)} of the rejections are false: it is the false discovery rate (Benjamini and Hochberg, 1995), and the reason why Ioannidis (2005) wrote that many published findings are false.`,
  },
  tryPvalue: {
    intro: 'Move the sliders: the share of the hypotheses tested that have a real effect, the power of the test and α. The squares are 1,000 tests: green the true discoveries, purple the missed effects, red the wrong rejections, grey the true null hypotheses left alone. Every test rejects in the same way, with p below α; what changes is the probability that a rejection is right.',
    real: (v) => `Real effects: ${EN.pct(v, 0)}`,
    power: (v) => `Power: ${EN.pct(v, 0)}`,
    alpha: (v) => `α: ${EN.plain(v)}`,
    iconTitle: 'A thousand tests: every square is a hypothesis',
    tableTitle: 'The four categories of the tests',
    cols: { category: 'Category', truth: 'Truth', decision: 'Decision', count: 'Tests', share: 'Share' },
    truth: { trueDiscovery: 'real effect', missedEffect: 'real effect', falseDiscovery: 'H0 true', trueNull: 'H0 true' },
    decision: { trueDiscovery: 'rejected', missedEffect: 'not rejected', falseDiscovery: 'rejected', trueNull: 'not rejected' },
    result: (f) => `Out of ${EN.int(f.total)} tests: ${EN.int(f.counts[0])} true discoveries, ${EN.int(f.counts[2])} false ones, ${EN.int(f.counts[1])} missed effects. P(H0 true | rejected) = ${EN.pct(f.falseDiscovery, 1)}.`,
  },
  limits: {
    intro: `The examples of section 2 show what Bayesian inference gives and what it costs. The table takes the phishing campaign of section 2.6 and looks at it with the four priors, after one, three and ten days. The conclusion "another training session is needed" is drawn when P(share > ${EN.pct(TARGET_RATE, 0)}) exceeds ${EN.pct(DECISION_LEVEL, 0)}.`,
    tableTitle: (level) => `The same campaign with four priors: posterior mean and P(share > ${EN.pct(TARGET_RATE, 0)}); ✓ when it exceeds ${EN.pct(level, 0)}`,
    cols: { prior: 'Prior', day1: 'After 1 day', days3: 'After 3 days', days10: 'After 10 days' },
    cell: (x) => `${EN.pct(x.mean)}; P = ${EN.pct(x.above)}${x.act ? ' ✓' : ''}`,
    paras: (rows) => {
      const spread = (r, keys) => {
        const means = keys.map((k) => r.priors[k].mean);
        return [Math.min(...means), Math.max(...means)];
      };
      const fair = ['uniform', 'jeffreys', 'informed'];
      const [a1, b1] = spread(rows[0], fair);
      const [a10, b10] = spread(rows[rows.length - 1], fair);
      return [
        `With one day of data the three reasonable priors give means from ${EN.pct(a1)} to ${EN.pct(b1)}; after ten days from ${EN.pct(a10)} to ${EN.pct(b10)}. The wrong and self-confident prior stays far away for longer (${EN.pct(rows[0].priors.wrong.mean)}, then ${EN.pct(rows[rows.length - 1].priors.wrong.mean)}): it needs much more data, as section 2.11 shows. Here the decision is the same for everybody, because the data are clear; with borderline data the prior can move it.`,
        'The advantages. The prior brings information that the data alone do not have: the base rate of the alarm (2.3) is real knowledge, and ignoring it leads to the fallacy. The posterior answers directly the questions that matter, such as P(share > 10%), which a p-value does not give (2.1). Updating is sequential and coherent (2.5, 2.6), it works with little data and with structured models such as networks (2.4), and it leads naturally to decisions.',
        'The limitations. The prior must be chosen, and with little data the choice matters; a wrong and self-confident prior slows learning down (2.11), and one that gives probability zero to a value can never change its mind. The likelihood can be wrong: naive Bayes counts dependent evidence twice and becomes overconfident (2.9). The probabilities of a network are often expert estimates (2.4). And outside conjugate cases the posterior must be computed numerically, on a grid (2.6) or with Monte Carlo.',
        'The influence on the conclusions is measured with a sensitivity analysis, like the table: the inference is repeated with different plausible priors, and the conclusion is declared only if it holds. With a lot of data the prior matters less and less (Bernstein-von Mises, 2.11); with little data it must be chosen with care and declared.',
      ];
    },
  },
  controls: {
    rate: (v) => `False-alarm rate p = ${EN.pct(v, 0)}`,
    epsilon: (v) => `Band ε = ${EN.num(v * 100, 1)} ${v === 0.01 ? 'point' : 'points'}`,
    bernoulliP: (v) => `p of the Bernoulli = ${EN.pct(v, 0)}`,
    shareP: (v) => `True share p = ${EN.pct(v, 0)}`,
    days: (v) => (v === 1 ? 'Data: the first day' : `Data: the first ${EN.int(v)} days`),
    alpha: (v) => `α = ${EN.plain(v)}: the risk of blocking a user`,
    beta: (v) => `β = ${EN.plain(v)}: the risk of clearing an attacker`,
    trueRate: (v) => `True click rate = ${EN.pct(v, 0)}`,
    perDay: (v) => `E-mails per day: ${EN.int(v)}`,
    coverageN: (v) => `n = ${EN.int(v)} e-mails`,
    bytesN: 'Connections per mean',
    int: (v) => EN.int(v),
    newSample: 'New sample',
    newWalks: 'Two simulated addresses',
    handWalks: 'The two examples written by hand',
    newCampaign: 'New campaign',
    handleRate: (v) => `p = ${EN.pct(v, 0)}`,
    bandUp: 'p + ε',
    bandDown: 'p - ε',
    block: 'block',
    clear: 'clear',
    threshold: (v) => `threshold ${EN.num(v, 0)}`,
    spam: (r) => `With the threshold at log-odds ${EN.num(r.threshold, 0)}: ${EN.int(r.tp)} spam caught and ${EN.int(r.fn)} missed, ${EN.int(r.fp)} legitimate ${r.fp === 1 ? 'message' : 'messages'} marked as spam; accuracy ${EN.pct(r.accuracy, 1)}, precision ${EN.pct(r.precision, 1)}, recall ${EN.pct(r.recall, 1)}.`,
  },
  checks: {
    intro: 'Every number of the page is checked against an independent reference: the special functions against SciPy 1.17.1 and mpmath at 50 digits; the alarm and the network against an exact computation with fractions; Wald’s test, the coverages, the exact distances and the two filters against an implementation in Python written apart; the simulations against the same Python with its own copy of the generators, which with the same seed must give the same numbers; the generators against their reference C code.',
    summary: (ok, total) => `${ok} of ${total} checks passed`,
    details: (n) => `The ${n} checks, one by one`,
    cols: { check: 'Check', expected: 'Expected', actual: 'Obtained', result: 'Result' },
    groups: { functions: 'The special functions', bayes: 'Bayes: alarm, network, Wald, coverages', filters: 'The two naive Bayes filters', convergence: 'The kinds of convergence', simulation: 'The simulations (seed 2026)', generator: 'The generator' },
    ok: 'passed',
    failed: 'failed',
    pending: 'waiting for the simulations',
  },
  tests: {
    intro: `The hypothesis tests of the page, at the significance level α = ${EN.num(SIGNIFICANCE, 2)}. The expected result is the one the theory predicts: when the null hypothesis is true, a test at 5% still rejects it once in twenty.`,
    cols: { subject: 'What is checked', hypothesis: 'Null hypothesis H0', statistic: 'Statistic', p: 'p-value', verdict: 'Result', expected: 'Expected' },
    rows: {
      generator: { subject: 'The generator of the page', hypothesis: 'The mean of 100,000 uniform values is 1/2 (z test)' },
      sprtLegit: { subject: `Wald, ${EN.int(SPRT_RUNS)} simulated users`, hypothesis: 'The share of users blocked is the exact one (binomial)' },
      sprtAttacker: { subject: `Wald, ${EN.int(SPRT_RUNS)} simulated attackers`, hypothesis: 'The share of attackers cleared is the exact one' },
      coverage: { subject: `Jeffreys, ${EN.int(COVERAGE_RUNS)} simulated campaigns`, hypothesis: 'The simulated coverage is the exact one' },
      smsFilter: { subject: 'The spam filter against "all legitimate"', hypothesis: 'The two are wrong in the same way (McNemar)' },
      kddFilter: { subject: 'Naive Bayes on NSL-KDD against "all attacks"', hypothesis: 'The two are wrong in the same way (McNemar)' },
      cltExponential: { subject: 'Standardized sums of 30 exponential values', hypothesis: 'They have the normal law (Kolmogorov-Smirnov)' },
      cltUniform: { subject: 'Standardized sums of 12 uniform values', hypothesis: 'They have the normal law' },
      cltCauchy: { subject: 'Means of 100 Cauchy values', hypothesis: 'They have the standard Cauchy law' },
      bytes: { subject: 'Mean bytes of 1,000 connections', hypothesis: 'They have the normal law' },
      hash: { subject: `${EN.int(HASH_TEST.trials)} trials of ${HASH_TEST.bits}-bit identifiers`, hypothesis: 'The share of collisions is the exact one' },
      gc: { subject: `Glivenko-Cantelli: √n times the distance, ${EN.int(GC_REPS)} samples of 1,000`, hypothesis: 'It has Kolmogorov’s law' },
    },
    statNames: { z: 'z', k: 'k', D: 'D', 'b/c': 'b/c' },
    verdicts: { reject: 'H0 rejected', accept: 'H0 not rejected' },
    expected: { reject: 'rejected', accept: 'not rejected (95% of the time)' },
    pending: 'Running: the simulations have not finished yet.',
  },
  history: {
    intro: 'From the law of large numbers to its strong forms and to the theorems of statistics, and from a problem of inverse probability to Bayesian networks and spam filters: the ideas used in the homework in chronological order.',
    items: [
      { year: '1713', title: 'Jacob Bernoulli', text: 'Ars Conjectandi, published posthumously: the first law of large numbers, the frequency of an event approaches its probability.' },
      { year: '1733', title: 'de Moivre', text: 'The normal approximation of the binomial: the first central limit, with its √n.' },
      { year: '1763', title: 'Bayes and Price', text: 'Richard Price publishes the essay of Thomas Bayes on inverse probability: inferring the probability of a cause from its effects.' },
      { year: '1774', title: 'Laplace', text: 'Mémoire sur la probabilité des causes par les événements: the theorem in its general form, then the rule of succession and, in 1810, the central limit.' },
      { year: '1853', title: 'Cauchy', text: 'He studies the law that bears his name, which Poisson had already noticed in 1824 as an exception to the mean.' },
      { year: '1867', title: 'Chebyshev', text: 'The inequality that proves the weak law of large numbers for variables with finite variance.' },
      { year: '1906', title: 'Markov', text: 'The chains that bear his name, to show that the law of large numbers holds without independence too.' },
      { year: '1908', title: 'Student', text: 'William Gosset, at the Guinness brewery, finds the law of the t statistic, with the variance estimated from the data.' },
      { year: '1909', title: 'Borel', text: 'The strong law for Bernoulli trials, with normal numbers: the first almost sure convergence.' },
      { year: '1917', title: 'Cantelli', text: 'The Borel-Cantelli lemma and a strong law with the fourth moment.' },
      { year: '1922', title: 'Lindeberg', text: 'The condition under which the central limit holds also for variables that are not identical.' },
      { year: '1922-1925', title: 'Fisher', text: 'Maximum likelihood, the information that bears his name and the p-value as a measure of the evidence against H0.' },
      { year: '1925', title: 'Slutsky', text: 'The theorem that combines convergence in distribution and convergence in probability.' },
      { year: '1927', title: 'Wilson', text: 'The interval for a proportion that inverts the score test.' },
      { year: '1933', title: 'Kolmogorov', text: 'The axioms of probability, the strong law for identically distributed variables with finite mean, and the limit law of √n times the distance from the empirical distribution function.' },
      { year: '1933', title: 'Glivenko and Cantelli', text: 'The empirical distribution function converges uniformly to the true one, almost surely.' },
      { year: '1934', title: 'Clopper and Pearson', text: 'The exact interval for a proportion, built on the binomial.' },
      { year: '1940', title: 'Turing and Good', text: 'At Bletchley Park, Banburismus against Enigma: weights of evidence in bans and decibans, added one after the other.' },
      { year: '1941-1942', title: 'Berry and Esseen', text: 'The speed of the central limit: the distance from the normal is at most C ρ/(σ³ √n).' },
      { year: '1945', title: 'Wald', text: 'The sequential probability ratio test, developed for the acceptance testing of war materiel; in 1948, with Wolfowitz, its optimality.' },
      { year: '1945-1946', title: 'Rao and Cramér', text: 'The lower bound on the variance of an unbiased estimator, which the MLE reaches asymptotically.' },
      { year: '1946', title: 'Jeffreys', text: 'The invariant prior that bears his name; for a proportion it is Beta(1/2, 1/2).' },
      { year: '1949', title: 'Doob', text: 'The consistency of the posterior: with infinite data it converges almost surely to the true value.' },
      { year: '1963', title: 'Hoeffding', text: 'The exponential inequality for sums of bounded variables.' },
      { year: '1988', title: 'Pearl', text: 'Probabilistic Reasoning in Intelligent Systems: Bayesian networks as an inference engine.' },
      { year: '1995', title: 'Benjamini and Hochberg', text: 'The false discovery rate among many tests, and how to control it.' },
      { year: '1998-2002', title: 'Sahami, Graham', text: 'The Bayesian spam filter: first in a research paper, then in "A Plan for Spam".' },
      { year: '2001', title: 'Brown, Cai and DasGupta', text: 'Interval Estimation for a Binomial Proportion: why the Wald interval should be abandoned.' },
      { year: '2005', title: 'Ioannidis', text: 'Why Most Published Research Findings Are False: the p-value read without the base rate.' },
      { year: '2009', title: 'Tavallaee and colleagues', text: 'NSL-KDD, the cleaned version of the data of the KDD Cup 1999.' },
      { year: '2011', title: 'Almeida, Gómez Hidalgo and Yamakami', text: 'The SMS Spam Collection; in the same year Shevtsova brings the Berry-Esseen constant down to 0.4748.' },
    ],
    after: 'The history runs on two tracks that the homework crosses: that of limits (Bernoulli, Chebyshev, Borel, Kolmogorov, Berry and Esseen) and that of inference (Bayes, Laplace, Fisher, Turing, Wald, Pearl). Bernstein-von Mises joins them: with enough data, believing and counting give the same answer.',
  },
  conclusion: {
    paras: (f) => [
      'The four modes of convergence are not synonyms. Almost sure and in mean square imply in probability, which implies in distribution; every other arrow has a counterexample (Bernoulli(1/n), the spike, the typewriter, (-1)^n Z). The law of large numbers lives in probability (the weak one), almost surely (the strong one) and in mean square; the central limit in distribution; and the same language carries the consistency of estimators, Slutsky, the delta method, Glivenko-Cantelli and the normality of the MLE.',
      `√n comes from the variance that adds up: with independent, or just uncorrelated, values Var(S_n) = n σ², so the error of the mean is σ/√n and the central limit must be written with √n. That is why halving the error costs four times the data (${EN.int(f.half)} connections to estimate 3% within half a point). Without independence the constant grows: with alarms in bursts of correlation 0.5 the variance is ${EN.num(f.burstFactor, 1)} times the independent one. And without a finite variance, or with very heavy tails like the bytes of NSL-KDD, the normal arrives late or never.`,
      `Conditional probability is the heart of inference, and Bayes’ theorem reverses it: from the likelihood P(data | hypothesis) to the posterior P(hypothesis | data), through the prior. A p-value is not the probability of H0 (${EN.p(f.pValue)} against ${EN.pct(f.posteriorH0, 1)} in the example of section 2.1). On the examples the engine works: it shows how much the base rate weighs (${EN.pct(f.alarm)} of real attacks among the alarms), explains one cause away with another, decides in a few attempts, estimates the share of clicks with an interval that reads as a probability (${EN.pct(f.rate.mean)}, from ${EN.pct(f.rate.lo)} to ${EN.pct(f.rate.hi)}), filters spam (${EN.pct(f.sms)} accuracy) and the attacks of NSL-KDD (${EN.pct(f.kdd)}).`,
      'Advantages and limitations go together: the prior brings information and demands a declared choice; with little data it influences the conclusions, with a lot it leaves them to the data. The posterior that converges, normal and concentrated on the true value (Bernstein-von Mises), is the bridge between the two parts of the assignment: with enough data, believing and counting give the same answer.',
    ],
  },
  legends: {
    detected: 'Attacks seen',
    missed: 'Attacks missed',
    falseAlarm: 'False alarms',
    quiet: 'Normal, no alarm',
    phishing: 'Phishing',
    exploit: 'Exploit',
    compromise: 'Compromise',
    legit: 'Legitimate user',
    attacker: 'Attacker',
    live: 'The address of this box',
    block: 'Blocking threshold',
    clear: 'Clearing threshold',
    uniformPrior: 'Uniform prior',
    informedPrior: 'Informed prior',
    wrongPrior: 'Wrong prior',
    trueRate: 'True share',
    prior: 'Prior',
    likelihood: 'Likelihood',
    posterior: 'Posterior',
    wald: 'Wald',
    wilson: 'Wilson',
    clopper: 'Clopper-Pearson',
    jeffreys: 'Jeffreys',
    nominal: '95%',
    spam: 'Spam',
    ham: 'Legitimate',
    simulated: 'Simulated rules',
    exact: 'Exact',
    chebyshev: 'Chebyshev',
    hoeffding: 'Hoeffding',
    normal: 'Normal',
    paths: 'Paths',
    band: 'Band of one point',
    outsideAt: 'Outside at n',
    outsideAfter: 'Outside again after n',
    simulatedMse: 'Simulated',
    exactMse: 'p(1 - p)/n',
    bernoulli: 'False alarms',
    bernoulliBound: 'False alarms, Berry-Esseen',
    exponential: 'Exponential',
    exponentialBound: 'Exponential, Berry-Esseen',
    sums: 'Simulated sums',
    normalDensity: 'Normal density',
    cauchyDensity: 'Cauchy density',
    estimate: 'Monte Carlo estimate',
    exactBand: 'Exact, with the 95% band',
    means: 'Simulated means',
    zKnown: 'Z, σ known',
    tEstimated: 't, σ estimated',
    mle: 'MLE of the rate',
    countSpread: 'Standard deviation of the count',
    shareSpread: 'Standard error of the share',
    scaled: 'n^α (mean - 1)',
    independent: 'Independent',
    correlated: 'In bursts',
    trueDiscovery: 'True discoveries',
    missedEffect: 'Missed effects',
    falseDiscovery: 'Wrong rejections',
    trueNull: 'True nulls left alone',
    day1: 'The first day',
    afterDays: (d) => (d === 1 ? 'After one day' : `After ${EN.int(d)} days`),
    days10: 'Ten days',
  },
  tips: {
    alarm: (k, count, share) => `${en.legends[['detected', 'missed', 'falseAlarm', 'quiet'][k]]}: ${EN.int(count)} connections (${EN.pctSmall(share)})`,
    network: (i, values) => [en.network.steps[i], ...['phishing', 'exploit', 'compromise'].map((n, k) => (values[k] === null ? null : `${en.legends[n]} ${EN.pct(values[k])}`))].filter(Boolean).join(' · '),
    sprt: (n, values, upper, lower, keys) => [`Attempt ${EN.int(n)}`, ...values.map((v, k) => (v === null ? null : `${en.legends[keys[k]]} ${EN.num(v, 3)}`)), upper === null ? null : `block ${EN.num(upper, 3)}`, lower === null ? null : `clear ${EN.num(lower, 3)}`].filter(Boolean).join(' · '),
    campaign: (row, u, i, truth) => [`Day ${EN.int(row.day)}: ${EN.int(row.clicks)} clicks out of ${EN.int(row.sent)}`, u ? `uniform ${en.rate.interval(u)}` : null, i ? `informed ${en.rate.interval(i)}` : null, truth ? `true ${EN.pct(CAMPAIGN.rate, 0)}` : null].filter(Boolean).join(' · '),
    density: (x, prior, lik, post) => [`Share ${EN.pct(x, 1)}`, prior === null ? null : `prior ${EN.num(prior, 2)}`, lik === null ? null : `likelihood ${EN.num(lik, 2)}`, post === null ? null : `posterior ${EN.num(post, 2)}`].filter(Boolean).join(' · '),
    coverage: (p, values) => [`True share ${EN.pct(p, 1)}`, ...['wald', 'wilson', 'clopper', 'jeffreys'].map((m, k) => (values[k] === null ? null : `${en.legends[m]} ${EN.pct(values[k])}`))].filter(Boolean).join(' · '),
    logOdds: (bin, spam, ham) => [`Log-odds ${en.spam.bin(bin)}`, spam === null ? null : `spam ${EN.int(spam)}`, ham === null ? null : `legitimate ${EN.int(ham)}`].filter(Boolean).join(' · '),
    outside: (n, sim, exact, cheb) => [`n = ${EN.int(n)}`, sim === null ? null : `simulated ${EN.pct(sim)}`, exact === null ? null : `exact ${EN.pct(exact)}`, cheb === null ? null : `Chebyshev ${EN.pct(cheb)}`].filter(Boolean).join(' · '),
    paths: (n, min, max, out, total) => `n = ${EN.int(n)}: the 20 estimates go from ${EN.pct(min, 2)} to ${EN.pct(max, 2)}, ${EN.int(out)} of ${EN.int(total)} outside the band`,
    after: (n, out, after) => [`n = ${EN.int(n)}`, out === null ? null : `outside at n ${EN.pct(out)}`, after === null ? null : `outside again after ${EN.pct(after)}`].filter(Boolean).join(' · '),
    mse: (n, sim, exact) => [`n = ${EN.int(n)}`, sim === null ? null : `simulated ${EN.sci(sim, 2)}`, exact === null ? null : `exact ${EN.sci(exact, 2)}`].filter(Boolean).join(' · '),
    sequence: (n, values) => `n = ${EN.int(n)}: ${values.map((v) => EN.num(v, Math.abs(v) >= 10 ? 0 : 2)).join(', ')}`,
    clt: (n, values) => [`n = ${EN.int(n)}`, ...['bernoulli', 'bernoulliBound', 'exponential', 'exponentialBound'].map((k, i) => (values[i] === null ? null : `${en.legends[k]} ${EN.num(values[i], 4)}`))].filter(Boolean).join(' · '),
    histogram: (from, to, count, share) => `From ${EN.num(from, 2)} to ${EN.num(to, 2)}: ${EN.int(count)} (${EN.pct(share)})`,
    hash: (trials, estimate, exact) => [`${EN.int(trials)} trials`, estimate === null ? null : `estimate ${EN.pct(estimate, 2)}`, exact === null ? null : `exact ${EN.pct(exact, 2)}`].filter(Boolean).join(' · '),
    strip: (n, alarm, run) => (alarm ? `Connection ${EN.int(n)}: alarm, ${run > 1 ? `in a burst of ${EN.int(run)}` : 'on its own'}` : `Connection ${EN.int(n)}: no alarm`),
    node: (name, p, prior, observed) => (observed === null || observed === undefined ? `${name}: ${EN.pct(p, 1)} (${EN.pct(prior, 1)} before the clues)` : `${name}: observed, ${observed ? 'yes' : 'no'}`),
    mode: (name, implies, impliedBy) => {
      const low = (x) => x.charAt(0).toLowerCase() + x.slice(1);
      const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).map(low).join(', ')} and ${low(xs[xs.length - 1])}` : low(xs[0]));
      const a = implies.length ? `implies ${list(implies)}` : 'implies no other mode';
      const b = impliedBy.length ? `implied by ${list(impliedBy)}` : 'implied by no other mode';
      return `${name}: ${a}; ${b}.`;
    },
    cauchy: (n, min, max) => `n = ${EN.int(n)}: the means go from ${EN.num(min, 2)} to ${EN.num(max, 2)}`,
    speed: (n, values) => [`n = ${EN.int(n)}`, ...['exact', 'chebyshev', 'hoeffding', 'normal'].map((k, i) => (values[i] === null ? null : `${en.legends[k]} ${EN.prob(values[i])}`))].filter(Boolean).join(' · '),
    bvm: (n, clicks, u, w, truth) => [`n = ${EN.int(n)}, ${EN.int(clicks)} clicks`, u ? `uniform ${en.bvm.pair(u)}` : null, w ? `wrong ${en.bvm.pair(w)}` : null, truth ? `true ${EN.pct(CAMPAIGN.rate, 0)}` : null].filter(Boolean).join(' · '),
    bvmDistance: (n, u, w) => [`n = ${EN.int(n)}`, u === null ? null : `uniform ${EN.num(u, 4)}`, w === null ? null : `wrong ${EN.num(w, 4)}`].filter(Boolean).join(' · '),
    results: (n, z, t, mle) => [`n = ${EN.int(n)}`, z === null ? null : `σ known ${EN.num(z, 4)}`, t === null ? null : `σ estimated ${EN.num(t, 4)}`, mle === null ? null : `MLE ${EN.num(mle, 4)}`].filter(Boolean).join(' · '),
    root: (n, count, share) => [`n = ${EN.int(n)}`, count ? `count ${EN.num(count[0], 2)} (σ √n = ${EN.num(count[1], 2)})` : null, share ? `share ${EN.num(share[0], 5)} (σ/√n = ${EN.num(share[1], 5)})` : null].filter(Boolean).join(' · '),
    burst: (n, ind, cor) => [`n = ${EN.int(n)}`, ind === null ? null : `independent ${EN.num(ind, 5)}`, cor === null ? null : `in bursts ${EN.num(cor, 5)}`].filter(Boolean).join(' · '),
    discovery: (k, count) => `${en.legends[['trueDiscovery', 'missedEffect', 'falseDiscovery', 'trueNull'][k]]}: ${EN.int(count)} tests`,
    likelihood: (x, a, b, days = 10) => [`Share ${EN.pct(x, 1)}`, a === null ? null : `first day ${EN.num(a, 3)}`, b === null ? null : `${{ 1: 'one day', 10: 'ten days' }[days] || `${EN.int(days)} days`} ${EN.num(b, 3)}`].filter(Boolean).join(' · '),
  },
  names: {
    methods: { wald: 'Wald', wilson: 'Wilson', clopper: 'Clopper-Pearson', jeffreys: 'Jeffreys' },
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English, with the data of the SMS and of NSL-KDD inside: after extracting the archive it opens with a double click on index.html, even offline. With node homework7.js it prints in the terminal the kinds of convergence, √n and the bursts, the other results of statistics, conditional probability, the alarm, the network, Wald’s test, the campaign, the coverages, the two filters and the checks; --seed changes the seed.',
    contents: 'Contents: index.html, style.css, homework7.js (data, computations, charts and command line), app.js (interface and texts), README.txt.',
    zip: 'Download homework7',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'The modes of convergence and the role of √n; conditional probability, Bayes’ theorem and statistical inference.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
  },
};

const HW7_TEXTS = { it, en };

return { originalAssignment, HW7_TEXTS };
})();

(function () {
'use strict';

// src/pages/statistics/hw7/standalone/app.js
// L'interfaccia del programma scaricabile dell'Homework #7, in JavaScript
// puro: niente React, niente dipendenze. Disegna le stesse sezioni della
// pagina del sito, nello stesso ordine della consegna, con gli stessi testi
// (texts.js), la stessa logica di presentazione (view.js) e gli stessi
// calcoli (homework7.js, con gli SMS e NSL-KDD dentro). La build
// (build/homework-standalone.js) lo unisce a view.js e texts.js in un unico
// app.js, uno script classico che si apre anche da file:// con un doppio
// clic su index.html.
//
// Le simulazioni lunghe girano a fette di pochi millisecondi (da file:// i
// worker non partono): le sezioni che ne hanno bisogno si riempiono quando
// arrivano. Ogni testo entra nella pagina con textContent, mai come HTML:
// nemmeno quello che si scrive nel campo dell'antispam.
const hw = Homework7;
const view = view$;
const { HW7_TEXTS, originalAssignment } = texts$;
const kit = kitDom$;

const HEADINGS = ['h2', 'h3', 'h4'];
const LANGUAGES = ['it', 'en'];
const SVG_NS = 'http://www.w3.org/2000/svg';

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#161616',
    text: '#d6d6d6',
    grid: '#262626',
    bars: '#7986cb',
    reference: '#ff6b81',
    highlight: '#ff6b81',
    series: ['#7986cb', '#ff6b81', '#4fb39c', '#ffca28', '#ba68c8', '#4dd0e1', '#9e9e9e', '#bcaaa4', '#d4e157', '#ffa726', '#64b5f6', '#f06292'],
  },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const palette = () => (darkQuery.matches ? PALETTES.dark : PALETTES.light);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// I campi non devono passare per correttori o completamenti.
const PRIVATE_FIELD = {
  autocomplete: 'off',
  autocorrect: 'off',
  autocapitalize: 'none',
  spellcheck: 'false',
  'data-gramm': 'false',
  'data-lpignore': 'true',
};

// ---------------------------------------------------------------------------
// Stato
// ---------------------------------------------------------------------------

// Si apre sempre in inglese, come la pagina sul sito; IT / EN cambia lingua
// finche' la pagina resta aperta, senza salvare la scelta. Il sito, aprendo
// la versione online, passa nell'indirizzo la lingua che si stava leggendo.
function initialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  return LANGUAGES.includes(fromUrl) ? fromUrl : 'en';
}

const state = {
  lang: initialLanguage(),
  // the boxes: they keep their state when the language changes
  sequence: view.SEQUENCE_TRY_DEFAULT.key,
  clt: { ...view.CLT_TRY_DEFAULT },
  hash: { bits: view.HASH_TRY_DEFAULT.bits, factor: view.HASH_TRY_DEFAULT.factor, trials: 0, hits: 0, history: [] },
  mapMode: null,
  scale: view.SCALE_TRY_DEFAULT.alpha,
  burst: view.BURST_TRY_DEFAULT.rho,
  discovery: { ...view.DISCOVERY_TRY_DEFAULT },
  alarm: { ...view.ALARM_TRY_DEFAULT },
  evidence: { ...view.NETWORK_TRY_DEFAULT },
  sprt: { attempts: [], alpha: view.SPRT_TRY_DEFAULT.alpha, draws: 0 },
  belief: { ...view.BELIEF_TRY_DEFAULT },
  prior: { shape: view.PRIOR_TRY_DEFAULT.shape, heights: [...hw.PRIOR_SHAPES[view.PRIOR_TRY_DEFAULT.shape]], data: view.PRIOR_TRY_DEFAULT.data },
  message: null,
  base: 'train',
  kdd: { ...view.KDD_TRY_DEFAULT },
  // the parameters of the sections with controls, by section
  params: {},
};
let text = HW7_TEXTS[state.lang];
const regions = {};
// the results of the long simulations, and the error if they failed
const computation = { shown: null, error: null };
// computed once, the first time they are needed
let models = null;
const getModels = () => {
  if (!models) models = { sms: hw.smsModel(), kdd: hw.kddModel() };
  return models;
};
let scaleSamples = null;
let checkRows = null;

// ---------------------------------------------------------------------------
// DOM: un aiutante minimo, i grafici e il loro ridisegno
// ---------------------------------------------------------------------------

/** h('p', { class: 'note', text: '...' }, child, ...): text always via textContent. */
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'style') Object.assign(el.style, value);
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** The same for SVG elements. */
function svg(tag, attrs, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'text') el.textContent = value;
    else el.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) if (child) el.append(child);
  return el;
}

const paras = (list) => (Array.isArray(list) ? list : [list]).filter(Boolean).map((t) => h('p', { text: t }));
const title = (id, level, label) => h(HEADINGS[level], { id, tabindex: -1, class: 'anchor', text: label });
const subtitle = (label) => h('p', { class: 'table-title' }, h('strong', { text: label }));
const check = (ok, label) => h('p', { class: ok ? 'check is-ok' : 'check is-bad' }, h('strong', { text: label }));
const formulas = (content) => h('pre', { text: content });
const resultLine = (content) => h('p', { class: 'caption line', 'aria-live': 'polite', text: content });
const actions = (...buttons) => h('p', { class: 'actions' }, buttons);
const action = (label, onclick, disabled = false) => h('button', { type: 'button', class: 'btn alt small', text: label, onclick, disabled });
const tryBox = (id, label, ...children) => h('div', { class: 'try' }, title(id, 2, label), children);
const message = (error) => (error instanceof Error ? error.message : String(error));
const pending = () => (computation.error ? h('p', { class: 'note', text: text.ui.error(computation.error) }) : h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));

// the models of the sections with controls, made again at every drawing of the page; their parameters survive it
let sectionModels = [];

/**
 * The model of a section with controls (view.MODELS[key], chartkit): its
 * parameters survive a change of language; `sim` is the result already
 * computed for the starting parameters.
 */
function sectionModel(name, key, sim = null) {
  const start = view.MODELS[key].params;
  const model = kit.createModel({ ...view.MODELS[key], params: state.params[name] || start, runner: hw.runStepsAsync });
  if (sim) model.provide(sim, start);
  // other parameters, kept from before: their simulation starts now
  if (state.params[name]) model.setParams(state.params[name]);
  model.subscribe(() => {
    state.params[name] = model.get().params;
  });
  sectionModels.push(model);
  return model;
}

/** What follows a model: update(state) now and after every change (charts updated in place, tables built again). */
function follow(model, update) {
  update(model.get());
  model.subscribe(() => update(model.get()));
}

// what the reader hid in the legends of the charts that are built again (a box that changes)
const kept = {};
const keep = (name) => {
  if (!kept[name]) kept[name] = new Set();
  return kept[name];
};

const { partsOf, hideParts } = kit;

/** Hides parts of a chart (a legend shared by several charts). */
function setHidden(fig, parts) {
  fig.kit.setHidden(parts);
}

/**
 * A chart (chartkit/kitDom.js): drawn by homework7.js, with its legend
 * (`items`), its label under the pointer, the table tied to it (`table`, an
 * id of view.LINKED_TABLES: the legend hides its parts there too) and zoom
 * on every chart with continuous axes; `animation` ({ frames, at(t), ms })
 * plays it step by step, `handles` ({ items, onChange }) are the lines to
 * drag, `pending` says that a simulation is running. `keep` is the set of
 * hidden items that outlives the chart.
 */
function figure(label, draw, data, { wide = true, tip = null, items = null, note = null, link = null, table = null, keep: hiddenItems = null, animation = null, handles = null, pending = false } = {}) {
  return kit.createFigure({ label, draw, data, palette: palette(), lib: hw, schedule: view.scheduleFrameJob, lang: state.lang, tip, items, note, link, table, keep: hiddenItems, wide, animation, handles, pending });
}

/** Replaces the content of a region, releasing the charts it contained and their labels. */
function fill(region, ...nodes) {
  kit.releaseFigures(region);
  for (const drawing of region.querySelectorAll('svg.diagram')) {
    const detach = drawingLabels.get(drawing);
    if (detach) detach();
    drawingLabels.delete(drawing);
  }
  region.replaceChildren(...nodes.flat(Infinity).filter((n) => n !== null && n !== undefined && n !== false));
}

/**
 * A table like the one of the page: `columns` [{ key, label, num?, part? }]
 * and `rows` [{ cells: { [key]: content }, class?, part? }]; the first
 * column is the header of every row. A column or a row with a `part` is
 * hidden with that part of its chart.
 */
function dataTable({ id = null, caption: label = null, className = '', columns, rows, note = null }) {
  const el = h(
    'table',
    { id, class: `table compact ${className}` },
    h('thead', null, h('tr', null, columns.map((c) => h('th', { scope: 'col', class: c.num ? 'num' : null, text: c.label, 'data-part': c.part || null })))),
    h(
      'tbody',
      null,
      rows.map((r) => h(
        'tr',
        { class: r.class || null, 'data-part': r.part || null },
        columns.map((c, i) => {
          const v = r.cells[c.key];
          const content = v instanceof Node ? v : String(v ?? '');
          return i === 0 ? h('th', { scope: 'row' }, content) : h('td', { class: c.num ? 'num' : null, 'data-label': c.label, 'data-part': c.part || null }, content);
        }),
      )),
    ),
  );
  return [label && subtitle(label), h('div', { class: 'scroll' }, el), note && h('p', { class: 'note', text: note })];
}

/** A choice among a few values: the pressed button is the active one. */
function choices(label, options, value, onChange) {
  const buttons = options.map(([key, name]) => h('button', { type: 'button', class: 'btn alt', 'aria-pressed': String(key === value), text: name, onclick: () => select(key) }));
  function select(key) {
    options.forEach(([k], i) => buttons[i].setAttribute('aria-pressed', String(k === key)));
    onChange(key);
  }
  return h('div', { class: 'choices', role: 'group', 'aria-label': label }, h('span', { class: 'choices-label', text: label }), buttons);
}

/** A slider on indices from 0 to max; label(text) changes its label. */
function slider(id, label, max, value, onChange) {
  const labelEl = h('label', { for: id, text: label });
  const input = h('input', { id, type: 'range', min: 0, max, step: 1, value, 'aria-valuetext': label, oninput: (e) => onChange(Number(e.target.value)) });
  return {
    el: h('div', { class: 'slider' }, labelEl, input),
    label(textLabel) {
      labelEl.textContent = textLabel;
      input.setAttribute('aria-valuetext', textLabel);
    },
  };
}

// the labels of the SVG drawings: released when their drawing is replaced
const drawingLabels = new Map(); // svg -> detach

/**
 * An SVG drawing with the label under the pointer, the same as the charts:
 * locate(x, y, width) says what lies under the point. The drawing sits in
 * a positioned box, where the label goes.
 */
function labelled(drawing, locate) {
  const box = h('div', { class: 'drawing' }, drawing);
  drawingLabels.set(drawing, hw.attachPointerLabel(drawing, locate));
  return box;
}

/** A box whose output region is built again at every change: `build()` returns the nodes. */
function live(build) {
  const region = h('div');
  const update = () => fill(region, build());
  update();
  return { region, update };
}

/** Draws a chart again in place, with new data, label under the pointer and caption, without replacing its canvas (no flicker while a slider moves); the hidden parts and the zoom stay. */
function refresh(fig, data, tip, label = null) {
  fig.kit.setData(data);
  fig.kit.setTip(tip);
  if (label !== null) fig.kit.setLabel(label);
}

/** Gives the buttons of a legend new labels (same items, same order). */
function relabel(fig, items) {
  fig.querySelectorAll('.series-legend button').forEach((button, i) => {
    if (items[i]) button.lastChild.textContent = items[i].label;
  });
}

/** The part of a chart that legend item k hides: its columns and rows in the linked table carry it. */
const part = (items, k) => items[k].parts[0];

// the parts that wait for the long simulations: built again when they arrive
let waiting = [];

/** A region built by build(s), with s the results of the simulations or null while they run. */
function whenComputed(build) {
  const region = h('div');
  waiting.push({ region, build });
  fill(region, build(computation.shown));
  return region;
}

function updateComputed() {
  for (const w of waiting) fill(w.region, w.build(computation.shown));
}

// ---------------------------------------------------------------------------
// 0. La consegna
// ---------------------------------------------------------------------------

function assignmentSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw7-assignment', 0, text.sections.assignment),
    paras(text.assignment.intro),
    h(
      'details',
      { class: 'original', open: true },
      h('summary', { text: text.assignment.originalTitle }),
      h('p', { class: 'note', text: text.assignment.originalNote }),
      h(
        'blockquote',
        { lang: 'en' },
        originalAssignment().map((block) => {
          if (block.type === 'title') return h('p', null, h('strong', { text: block.text }));
          if (block.type === 'list') return h('ul', { class: 'plain-list' }, block.items.map((item) => h('li', { text: item })));
          return h('p', { text: block.text });
        }),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// 1. Le forme di convergenza
// ---------------------------------------------------------------------------

function probabilityBlock() {
  const P = text.probability;
  const F = text.fmt;
  const items = view.legends.outside(text.legends);
  return [
    title('hw7-probability', 1, text.sections.probability),
    paras(P.paras(hw.deviationTable())),
    whenComputed((s) => {
      if (!s) return pending();
      const model = sectionModel('probability', 'paths', s.paths);
      const simOf = (m) => m.sim || s.paths;
      const fig = figure(P.chartTitle, hw.drawLineChart, view.outsideChart(simOf(model.get()), F.decimal), { items, link: view.links.outside, table: view.LINKED_TABLES.outside, keep: keep('outside') });
      const tableRegion = h('div');
      follow(model, (m) => {
        const paths = simOf(m);
        const data = view.outsideChart(paths, F.decimal);
        fig.kit.setData(data);
        fig.kit.setTip(view.tips.outside(paths, text.tips));
        fig.kit.setAnimation(view.reveal(data));
        fig.kit.setPending(m.pending);
        fill(
          tableRegion,
          dataTable({
            id: view.LINKED_TABLES.outside,
            caption: P.tableTitle,
            columns: [
              { key: 'n', label: P.cols.n },
              { key: 'simulated', label: P.cols.simulated, num: true, part: part(items, 0) },
              { key: 'exact', label: P.cols.exact, num: true, part: part(items, 1) },
              { key: 'chebyshev', label: P.cols.chebyshev, num: true, part: part(items, 2) },
            ],
            rows: paths.checks.map((c) => ({ cells: { n: F.int(c.n), simulated: F.pct(c.outside), exact: F.pct(c.exactOutside, 2), chebyshev: F.pct(hw.deviationBounds(c.n, paths.rate, paths.epsilon).chebyshev) } })),
          }),
        );
        hideParts(tableRegion.querySelector('table'), partsOf(items, keep('outside')));
      });
      return [kit.modelControls(model, view.controls.paths(text.controls), state.lang), h('div', { class: 'charts' }, fig), tableRegion];
    }),
    h('p', { text: P.after }),
  ];
}

function almostBlock() {
  const A = text.almost;
  const F = text.fmt;
  const pathsItems = view.legends.paths(text.legends);
  const afterItems = view.legends.after(text.legends);
  return [
    title('hw7-almost', 1, text.sections.almost),
    whenComputed((s) => {
      if (!s) return pending();
      const model = sectionModel('almost', 'paths', s.paths);
      const simOf = (m) => m.sim || s.paths;
      // the band follows the controls at once, the paths when their simulation arrives
      const pathsOf = (m) => view.pathsChart({ ...simOf(m), rate: m.params.rate, epsilon: m.params.epsilon }, F.decimal);
      const moveHandle = (id, v) => model.setParams(view.handles.pathsMove(model.get().params, id, v));
      const first = model.get();
      const pathsFig = figure(A.chartTitle, hw.drawLineChart, pathsOf(first), { items: pathsItems, keep: keep('paths'), handles: { items: view.handles.paths(first.params, text.controls), onChange: moveHandle } });
      const afterFig = figure(A.chart2Title, hw.drawLineChart, view.afterChart(simOf(first), F.decimal), { items: afterItems, link: view.links.after, table: view.LINKED_TABLES.after, keep: keep('after') });
      const tableRegion = h('div');
      follow(model, (m) => {
        const paths = simOf(m);
        const pathsData = pathsOf(m);
        const after = view.afterChart(paths, F.decimal);
        pathsFig.kit.setData(pathsData);
        pathsFig.kit.setTip(view.tips.paths(paths, text.tips));
        pathsFig.kit.setAnimation(view.reveal(pathsData, 80));
        pathsFig.kit.setHandles({ items: view.handles.paths(m.params, text.controls), onChange: moveHandle });
        afterFig.kit.setData(after);
        afterFig.kit.setTip(view.tips.after(paths, text.tips));
        afterFig.kit.setAnimation(view.reveal(after));
        pathsFig.kit.setPending(m.pending);
        afterFig.kit.setPending(m.pending);
        fill(
          tableRegion,
          dataTable({
            id: view.LINKED_TABLES.after,
            caption: A.tableTitle,
            columns: [
              { key: 'n', label: A.cols.n },
              { key: 'outside', label: A.cols.outside, num: true, part: part(afterItems, 0) },
              { key: 'after', label: A.cols.after, num: true, part: part(afterItems, 1) },
            ],
            rows: paths.checks.map((c) => ({ cells: { n: F.int(c.n), outside: F.pct(c.outside), after: F.pct(c.after) } })),
          }),
        );
        hideParts(tableRegion.querySelector('table'), partsOf(afterItems, keep('after')));
      });
      return [paras(A.paras(s.paths)), kit.modelControls(model, view.controls.paths(text.controls), state.lang), h('div', { class: 'charts' }, pathsFig, afterFig), tableRegion];
    }),
    h('p', { text: A.after }),
  ];
}

function trySequencesBox() {
  const T = text.trySequences;
  const F = text.fmt;
  const describe = h('p');
  const fig = figure(T.names[state.sequence], hw.drawLineChart, { series: [] });
  const tables = h('div');
  const update = () => {
    const key = state.sequence;
    const result = hw.sequencePaths(key, hw.DEFAULT_SEED);
    const modes = hw.SEQUENCE_MODES[key];
    const stillAway = (n) => result.last.filter((l) => l > n).length;
    describe.textContent = T.describe[key];
    refresh(fig, view.sequenceChart(result, F.decimal), view.tips.sequence(result, text.tips), T.names[key]);
    fill(
      tables,
      dataTable({
        caption: T.tableTitle,
        columns: [
          { key: 'n', label: T.cols.n },
          { key: 'deviation', label: T.cols.deviation, num: true },
          { key: 'l2', label: T.cols.l2, num: true },
          { key: 'afterwards', label: T.cols.afterwards, num: true },
          { key: 'simulated', label: T.cols.simulated, num: true },
        ],
        rows: view.sequenceTableN(key).map((n) => {
          const f = hw.sequenceFacts(key, n);
          let afterwards = F.prob(f.afterwards);
          if (f.afterwards === null) afterwards = '-';
          else if (f.afterwards === 1) afterwards = T.never;
          return {
            cells: {
              n: F.int(n),
              deviation: F.prob(f.deviation),
              l2: f.l2 >= 1 ? F.int(f.l2) : F.prob(f.l2),
              afterwards,
              simulated: n < hw.SEQUENCE_LENGTH ? `${F.int(stillAway(n))}/${F.int(result.last.length)}` : '-',
            },
          };
        }),
        note: T.simulatedNote,
      }),
      dataTable({
        caption: T.modesTitle,
        columns: [{ key: 'mode', label: '' }, { key: 'holds', label: T.names[key] }],
        rows: ['probability', 'as', 'l2', 'distribution'].map((m) => ({ class: modes[m] ? 'holds' : 'fails', cells: { mode: T.modes[m], holds: modes[m] ? T.holds : T.fails } })),
      }),
    );
  };
  update();
  return tryBox(
    'hw7-try-sequences',
    text.sections.trySequences,
    h('p', { text: T.intro }),
    choices(T.chooseLabel, hw.SEQUENCES.map((k) => [k, T.names[k]]), state.sequence, (k) => {
      state.sequence = k;
      update();
    }),
    describe,
    h('div', { class: 'charts' }, fig),
    tables,
  );
}

function l2Block() {
  const Q = text.l2;
  const F = text.fmt;
  const items = view.legends.mse(text.legends);
  return [
    title('hw7-l2', 1, text.sections.l2),
    whenComputed((s) => {
      if (!s) return pending();
      const model = sectionModel('l2', 'pathsRate', s.paths);
      const simOf = (m) => m.sim || s.paths;
      const fig = figure(Q.chartTitle, hw.drawLineChart, view.mseChart(simOf(model.get()), F.decimal), { items, link: view.links.mse, table: view.LINKED_TABLES.mse, keep: keep('mse') });
      const tableRegion = h('div');
      follow(model, (m) => {
        const paths = simOf(m);
        const data = view.mseChart(paths, F.decimal);
        fig.kit.setData(data);
        fig.kit.setTip(view.tips.mse(paths, text.tips));
        fig.kit.setAnimation(view.reveal(data));
        fig.kit.setPending(m.pending);
        fill(
          tableRegion,
          dataTable({
            id: view.LINKED_TABLES.mse,
            caption: Q.tableTitle,
            columns: [
              { key: 'n', label: Q.cols.n },
              { key: 'simulated', label: Q.cols.simulated, num: true, part: part(items, 0) },
              { key: 'exact', label: Q.cols.exact, num: true, part: part(items, 1) },
            ],
            rows: paths.checks.map((c) => ({ cells: { n: F.int(c.n), simulated: F.sci(c.mse, 2), exact: F.sci(c.exactMse, 2) } })),
          }),
        );
        hideParts(tableRegion.querySelector('table'), partsOf(items, keep('mse')));
      });
      return [paras(Q.paras(s.paths)), kit.modelControls(model, view.controls.pathsRate(text.controls), state.lang), h('div', { class: 'charts' }, fig), tableRegion];
    }),
    dataTable({
      caption: Q.counterTitle,
      columns: [
        { key: 'n', label: Q.counterCols.n },
        { key: 'spikeP', label: Q.counterCols.spikeP, num: true },
        { key: 'spikeL2', label: Q.counterCols.spikeL2, num: true },
        { key: 'bernP', label: Q.counterCols.bernP, num: true },
        { key: 'bernL2', label: Q.counterCols.bernL2, num: true },
      ],
      rows: view.SEQUENCE_TABLE_N.map((n) => {
        const spike = hw.sequenceFacts('spike', n);
        const bern = hw.sequenceFacts('bern1', n);
        return { cells: { n: F.int(n), spikeP: F.prob(spike.deviation), spikeL2: F.int(spike.l2), bernP: F.prob(bern.deviation), bernL2: F.prob(bern.l2) } };
      }),
    }),
  ];
}

function distributionBlock() {
  const D = text.distribution;
  const F = text.fmt;
  const items = view.legends.clt(text.legends);
  return [
    title('hw7-distribution', 1, text.sections.distribution),
    whenComputed((s) => {
      if (!s) return pending();
      const model = sectionModel('distribution', 'clt');
      // the exact distances for another p take a few milliseconds
      const rowsOf = (m) => (view.atStart('clt', m.params) ? s.clt.rows : hw.cltTable(hw.CLT_SIZES, m.params.p));
      const fig = figure(D.chartTitle, hw.drawLineChart, view.cltChart(rowsOf(model.get()), F.decimal), { items, link: view.links.clt, table: view.LINKED_TABLES.clt, keep: keep('clt') });
      const tableRegion = h('div');
      follow(model, (m) => {
        const rows = rowsOf(m);
        const data = view.cltChart(rows, F.decimal);
        fig.kit.setData(data);
        fig.kit.setTip(view.tips.clt(rows, text.tips));
        fig.kit.setAnimation(view.reveal(data));
        fill(
          tableRegion,
          dataTable({
            id: view.LINKED_TABLES.clt,
            caption: D.tableTitle,
            columns: [
              { key: 'n', label: D.cols.n },
              { key: 'bernoulli', label: D.cols.bernoulli, num: true, part: part(items, 0) },
              { key: 'bernoulliBound', label: D.cols.bernoulliBound, num: true, part: part(items, 1) },
              { key: 'exponential', label: D.cols.exponential, num: true, part: part(items, 2) },
              { key: 'exponentialBound', label: D.cols.exponentialBound, num: true, part: part(items, 3) },
            ],
            rows: rows.map((r) => ({ cells: { n: F.int(r.n), bernoulli: F.num(r.bernoulli, 4), bernoulliBound: F.num(r.bernoulliBound, 4), exponential: F.num(r.exponential, 4), exponentialBound: F.num(r.exponentialBound, 4) } })),
          }),
        );
        hideParts(tableRegion.querySelector('table'), partsOf(items, keep('clt')));
      });
      return [paras(D.paras(s.clt.rows)), kit.modelControls(model, view.controls.clt(text.controls), state.lang), h('div', { class: 'charts' }, fig), tableRegion, h('p', { text: D.tests(s.clt) })];
    }),
  ];
}

function tryCltBox() {
  const T = text.tryClt;
  const F = text.fmt;
  const first = view.cltTry(state.clt, F.decimal);
  const fig = figure(T.chartTitle, hw.drawHistogram, first.chart, { tip: view.tips.histogram(first.chart, text.tips, view.CLT_TRY_REPS), items: view.legends.cltTry(text.legends, first.cauchy), keep: keep('cltTry') });
  const line = resultLine(T.result(first, state.clt));
  const update = () => {
    const t = view.cltTry(state.clt, F.decimal);
    relabel(fig, view.legends.cltTry(text.legends, t.cauchy));
    refresh(fig, t.chart, view.tips.histogram(t.chart, text.tips, view.CLT_TRY_REPS));
    line.textContent = T.result(t, state.clt);
  };
  return tryBox(
    'hw7-try-clt',
    text.sections.tryClt,
    h('p', { text: T.intro }),
    choices(T.lawLabel, hw.CLT_LAWS.map((k) => [k, T.laws[k]]), state.clt.law, (v) => {
      state.clt.law = v;
      update();
    }),
    choices(T.nLabel, view.CLT_TRY_SIZES.map((n) => [n, F.int(n)]), state.clt.n, (v) => {
      state.clt.n = v;
      update();
    }),
    actions(action(text.ui.another, () => {
      state.clt.draw += 1;
      update();
    })),
    h('div', { class: 'charts' }, fig),
    line,
  );
}

function tryHashBox() {
  const T = text.tryHash;
  const F = text.fmt;
  const run = state.hash;
  const count = () => view.hashCount(run.bits, run.factor);
  const exactOf = () => hw.collisionExact(run.bits, count());
  const first = view.hashChart({ history: run.history }, exactOf(), F.decimal);
  const fig = figure(T.chartTitle, hw.drawLineChart, first, { tip: view.tips.hash(first, exactOf(), text.tips), items: view.legends.hash(text.legends), keep: keep('hash') });
  const line = resultLine('');
  const factorGroup = h('div');
  const update = () => {
    const exact = exactOf();
    const chart = view.hashChart({ history: run.history }, exact, F.decimal);
    refresh(fig, chart, view.tips.hash(chart, exact, text.tips));
    line.textContent = T.result(run, exact, count(), run.bits);
  };
  const clear = () => {
    run.trials = 0;
    run.hits = 0;
    run.history = [];
  };
  // the names of the factors depend on the bits: the group is built again when they change
  const buildFactors = () => fill(
    factorGroup,
    choices(T.factorLabel, view.HASH_FACTORS.map((f) => [f, T.factors(view.hashCount(run.bits, f))]), run.factor, (v) => {
      run.factor = v;
      clear();
      update();
    }),
  );
  // more trials, from the stream 'hash' after the ones of the test (repetitions from 10^6)
  const add = (n) => {
    Object.assign(run, view.hashMore(run, run.bits, count(), n));
    update();
  };
  buildFactors();
  update();
  return tryBox(
    'hw7-try-hash',
    text.sections.tryHash,
    h('p', { text: T.intro }),
    choices(T.bitsLabel, hw.HASH_TRY_BITS.map((b) => [b, String(b)]), run.bits, (v) => {
      run.bits = v;
      clear();
      buildFactors();
      update();
    }),
    factorGroup,
    actions(
      action(T.add100, () => add(100)),
      action(T.add1000, () => add(1000)),
      action(text.ui.reset, () => {
        clear();
        update();
      }),
    ),
    h('div', { class: 'charts' }, fig),
    line,
    h('p', { class: 'note', text: T.thirtyTwo(hw.collisionMedian(32)) }),
  );
}

function mapBlock() {
  const M = text.map;
  const pairs = hw.MODES.flatMap((a) => hw.MODES.filter((b) => b !== a).map((b) => ({ a, b, ...hw.implication(a, b) })));
  return [
    title('hw7-map', 1, text.sections.map),
    paras(M.paras),
    dataTable({
      caption: M.tableTitle,
      columns: [{ key: 'from', label: M.cols.from }, { key: 'to', label: M.cols.to }, { key: 'holds', label: M.cols.holds }, { key: 'counter', label: M.cols.counter }],
      rows: pairs.map((x) => ({ class: x.holds ? 'holds' : 'fails', cells: { from: text.tryMap.modes[x.a], to: text.tryMap.modes[x.b], holds: x.holds ? text.trySequences.holds : text.trySequences.fails, counter: x.holds ? '' : text.trySequences.names[x.counter] } })),
    }),
  ];
}

// La mappa delle implicazioni: i quattro modi, con le frecce che valgono sempre
function mapDiagram(mode) {
  const pal = palette();
  const P = view.MAP_LAYOUT;
  const { box } = view.MAP_VIEW;
  const stateOf = (m) => {
    if (!mode) return 'idle';
    if (m === mode) return 'self';
    return hw.implication(mode, m).holds ? 'holds' : 'fails';
  };
  const fills = { idle: pal.background, self: pal.series[0], holds: pal.series[2], fails: pal.series[1] };
  const drawing = svg(
    'svg',
    { class: 'diagram', viewBox: '0 0 104 60', role: 'img', 'aria-label': text.tryMap.diagramLabel },
    svg('defs', null, svg('marker', { id: 'map-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: pal.text }))),
    hw.IMPLICATIONS.map(([a, b]) => {
      const from = P[a];
      const to = P[b];
      const len = Math.hypot(to.x - from.x, to.y - from.y);
      const ux = (to.x - from.x) / len;
      const uy = (to.y - from.y) / len;
      const start = Math.min(box.w / 2 / Math.max(1e-9, Math.abs(ux)), box.h / 2 / Math.max(1e-9, Math.abs(uy)));
      return svg('line', { x1: from.x + ux * start, y1: from.y + uy * start, x2: to.x - ux * (start + 0.8), y2: to.y - uy * (start + 0.8), stroke: pal.text, 'stroke-width': 0.5, 'marker-end': 'url(#map-arrow)' });
    }),
    hw.MODES.map((m) => {
      const st = stateOf(m);
      return svg(
        'g',
        null,
        svg('rect', { x: P[m].x - box.w / 2, y: P[m].y - box.h / 2, width: box.w, height: box.h, rx: 2, fill: fills[st], 'fill-opacity': st === 'idle' ? 1 : 0.35, stroke: st === 'idle' ? pal.text : fills[st], 'stroke-width': st === 'self' ? 1 : 0.5 }),
        svg('text', { x: P[m].x, y: P[m].y + 1.2, 'text-anchor': 'middle', 'font-size': 3.4, fill: pal.text, text: text.tryMap.modes[m] }),
      );
    }),
  );
  const names = (list) => list.map((m) => text.tryMap.modes[m]);
  return labelled(drawing, (x, y, width) => {
    const hit = view.diagramHit(P, view.MAP_VIEW, width, x, y);
    if (!hit) return null;
    const others = hw.MODES.filter((m) => m !== hit.key);
    return { rect: hit.rect, text: text.tips.mode(text.tryMap.modes[hit.key], names(others.filter((m) => hw.implication(hit.key, m).holds)), names(others.filter((m) => hw.implication(m, hit.key).holds))) };
  });
}

function tryMapBox() {
  const T = text.tryMap;
  const out = live(() => {
    const mode = state.mapMode;
    const list = mode
      ? {
        holds: hw.MODES.filter((m) => m !== mode && hw.implication(mode, m).holds),
        fails: hw.MODES.filter((m) => m !== mode && !hw.implication(mode, m).holds).map((m) => ({ mode: m, counter: hw.implication(mode, m).counter })),
      }
      : null;
    return [mapDiagram(mode), resultLine(mode ? T.result(mode, list) : T.pick)];
  });
  return tryBox(
    'hw7-try-map',
    text.sections.tryMap,
    h('p', { text: T.intro }),
    choices(text.sections.tryMap, hw.MODES.map((m) => [m, T.modes[m]]), state.mapMode, (m) => {
      state.mapMode = m;
      out.update();
    }),
    out.region,
  );
}

function rolesBlock() {
  const R = text.roles;
  return [
    title('hw7-roles', 1, text.sections.roles),
    h('p', { text: R.intro }),
    dataTable({
      caption: R.tableTitle,
      className: 'roles',
      columns: [{ key: 'theorem', label: R.cols.theorem }, { key: 'statement', label: R.cols.statement }, { key: 'mode', label: R.cols.mode }, { key: 'condition', label: R.cols.condition }, { key: 'where', label: R.cols.where }],
      rows: R.rows.map((r) => ({ cells: r })),
    }),
    h('p', { text: R.after }),
  ];
}

function resultsBlock() {
  const R = text.results;
  const F = text.fmt;
  const start = view.resultsRows();
  const delta = [100, 1000, 10000].map((n) => hw.deltaLogOdds(n));
  const items = view.legends.results(text.legends);
  const model = sectionModel('results', 'results');
  const rowsOf = (m) => (view.atStart('results', m.params) ? start : view.resultsRows(m.params.p));
  const fig = figure(R.chartTitle, hw.drawLineChart, view.resultsChart(rowsOf(model.get()), F.decimal), { items, link: view.links.results, table: view.LINKED_TABLES.results, keep: keep('results') });
  const tableRegion = h('div');
  follow(model, (m) => {
    const rows = rowsOf(m);
    const data = view.resultsChart(rows, F.decimal);
    fig.kit.setData(data);
    fig.kit.setTip(view.tips.results(rows, text.tips));
    fig.kit.setAnimation(view.reveal(data, 300));
    fill(
      tableRegion,
      dataTable({
        id: view.LINKED_TABLES.results,
        caption: R.tableTitle,
        columns: [
          { key: 'n', label: R.cols.n },
          { key: 'z', label: R.cols.z, num: true, part: part(items, 0) },
          { key: 't', label: R.cols.t, num: true, part: part(items, 1) },
          { key: 'mle', label: R.cols.mle, num: true, part: part(items, 2) },
          { key: 'bias', label: R.cols.bias, num: true, part: part(items, 2) },
          { key: 'efficiency', label: R.cols.efficiency, num: true, part: part(items, 2) },
        ],
        rows: rows.map((r) => ({ cells: { n: F.int(r.n), z: F.num(r.z, 4), t: F.num(r.t, 4), mle: F.num(r.mle.distance, 4), bias: F.pct(r.mle.bias, 2), efficiency: F.num(r.mle.efficiency, 4) } })),
      }),
    );
    hideParts(tableRegion.querySelector('table'), partsOf(items, keep('results')));
  });
  return [
    title('hw7-results', 1, text.sections.results),
    h('p', { text: R.intro }),
    h('p', { text: R.consistency }),
    h('p', { text: R.slutsky(start) }),
    kit.modelControls(model, view.controls.results(text.controls), state.lang),
    h('div', { class: 'charts' }, fig),
    tableRegion,
    h('p', { text: R.delta(delta[0], delta[1]) }),
    dataTable({
      caption: R.deltaTitle,
      columns: [{ key: 'n', label: R.deltaCols.n }, { key: 'exact', label: R.deltaCols.exact, num: true }, { key: 'delta', label: R.deltaCols.delta, num: true }, { key: 'excluded', label: R.deltaCols.excluded, num: true }],
      rows: delta.map((d) => ({ cells: { n: F.int(d.n), exact: F.num(d.exact, 4), delta: F.num(d.delta, 4), excluded: F.prob(d.excluded) } })),
    }),
    whenComputed((s) => (!s ? pending() : [
      h('p', { text: R.gc(s.gc.rows) }),
      dataTable({
        caption: R.gcTitle,
        columns: [{ key: 'n', label: R.gcCols.n }, { key: 'meanD', label: R.gcCols.meanD, num: true }, { key: 'meanScaled', label: R.gcCols.meanScaled, num: true }, { key: 'over', label: R.gcCols.over, num: true }],
        rows: s.gc.rows.map((r) => ({ cells: { n: F.int(r.n), meanD: F.num(r.meanD, 4), meanScaled: F.num(r.meanScaled, 3), over: F.pct(r.over, 1) } })),
      }),
    ])),
    h('p', { text: R.mle(start) }),
  ];
}

function rootBlock() {
  const R = text.root;
  const F = text.fmt;
  const items = view.legends.root(text.legends);
  const inferenceRegion = h('div');
  const inferenceOf = (rate) => dataTable({
    caption: R.inferenceTitle,
    columns: [{ key: 'n', label: R.inferenceCols.n }, { key: 'variance', label: R.inferenceCols.variance, num: true }, { key: 'se', label: R.inferenceCols.se, num: true }, { key: 'half', label: R.inferenceCols.half, num: true }],
    rows: hw.rootTable(rate).map((r) => ({ cells: { n: F.int(r.n), variance: F.num(r.variance, 2), se: F.num(r.se, 5), half: `± ${F.pct(r.half, 2)}` } })),
  });
  fill(inferenceRegion, inferenceOf(hw.FALSE_ALARMS.rate));
  return [
    title('hw7-root', 1, text.sections.root),
    paras(R.paras([hw.sampleSizeFor(0.01), hw.sampleSizeFor(0.005), hw.sampleSizeFor(0.001)])),
    whenComputed((s) => {
      if (!s) return pending();
      const model = sectionModel('root', 'pathsRate', s.paths);
      const simOf = (m) => m.sim || s.paths;
      const fig = figure(R.chartTitle, hw.drawLineChart, view.rootChart(simOf(model.get()), F.decimal), { items, link: view.links.root, table: view.LINKED_TABLES.root, keep: keep('root') });
      const tableRegion = h('div');
      follow(model, (m) => {
        const paths = simOf(m);
        const sigma = Math.sqrt(paths.rate * (1 - paths.rate));
        const data = view.rootChart(paths, F.decimal);
        fig.kit.setData(data);
        fig.kit.setTip(view.tips.root(paths, text.tips));
        fig.kit.setAnimation(view.reveal(data));
        fig.kit.setPending(m.pending);
        fill(
          tableRegion,
          dataTable({
            id: view.LINKED_TABLES.root,
            caption: R.tableTitle,
            columns: [
              { key: 'n', label: R.cols.n },
              { key: 'sdCount', label: R.cols.sdCount, num: true, part: part(items, 0) },
              { key: 'exactCount', label: R.cols.exactCount, num: true, part: part(items, 0) },
              { key: 'sdShare', label: R.cols.sdShare, num: true, part: part(items, 1) },
              { key: 'exactShare', label: R.cols.exactShare, num: true, part: part(items, 1) },
            ],
            rows: paths.checks.map((c) => ({ cells: { n: F.int(c.n), sdCount: F.num(c.n * Math.sqrt(c.mse), 2), exactCount: F.num(sigma * Math.sqrt(c.n), 2), sdShare: F.num(Math.sqrt(c.mse), 5), exactShare: F.num(sigma / Math.sqrt(c.n), 5) } })),
          }),
        );
        hideParts(tableRegion.querySelector('table'), partsOf(items, keep('root')));
        fill(inferenceRegion, inferenceOf(m.params.rate));
      });
      return [kit.modelControls(model, view.controls.pathsRate(text.controls), state.lang), h('div', { class: 'charts' }, fig), tableRegion];
    }),
    inferenceRegion,
  ];
}

function tryScaleBox() {
  const T = text.tryScale;
  const F = text.fmt;
  // the means are drawn once; alpha only rescales them
  if (!scaleSamples) scaleSamples = hw.scaleSamples();
  const alphaOf = () => hw.SCALE_ALPHAS[state.scale];
  const first = view.scaleCharts(scaleSamples, alphaOf(), F.decimal);
  const items = view.legends.scale(text.legends);
  const hidden = keep('scale');
  const figs = first.map((c, i) => figure(T.chartTitle(c.n), hw.drawHistogram, c.chart, { wide: false, tip: view.tips.histogram(c.chart, text.tips, hw.SCALE_REPS), items: i === 0 ? items : null, keep: i === 0 ? hidden : null }));
  // the legend of the first chart hides the same parts in all three
  figs[0].querySelector('.series-legend').addEventListener('click', () => {
    const parts = partsOf(items, hidden);
    figs.slice(1).forEach((f) => setHidden(f, parts));
  });
  const line = resultLine(T.result(first, alphaOf()));
  const control = slider('hw7-alpha', T.alphaLabel(alphaOf()), hw.SCALE_ALPHAS.length - 1, state.scale, (v) => {
    state.scale = v;
    const charts3 = view.scaleCharts(scaleSamples, alphaOf(), F.decimal);
    charts3.forEach((c, i) => refresh(figs[i], c.chart, view.tips.histogram(c.chart, text.tips, hw.SCALE_REPS)));
    control.label(T.alphaLabel(alphaOf()));
    line.textContent = T.result(charts3, alphaOf());
  });
  // the hidden parts kept from before, in the two charts without a legend too
  const parts = partsOf(items, hidden);
  if (parts.length) figs.slice(1).forEach((f) => setHidden(f, parts));
  return tryBox('hw7-try-scale', text.sections.tryScale, h('p', { text: T.intro }), control.el, h('div', { class: 'charts three' }, figs), line);
}

function burstsBlock() {
  const B = text.bursts;
  const F = text.fmt;
  return [
    title('hw7-bursts', 1, text.sections.bursts),
    paras(B.paras(hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.5), hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.9))),
    whenComputed((s) => (!s ? pending() : [
      dataTable({
        caption: B.tableTitle,
        columns: [
          { key: 'rho', label: B.cols.rho },
          { key: 'variance', label: B.cols.variance, num: true },
          { key: 'exact', label: B.cols.exact, num: true },
          { key: 'factor', label: B.cols.factor, num: true },
          { key: 'effective', label: B.cols.effective, num: true },
          { key: 'coverage', label: B.cols.coverage, num: true },
          { key: 'predicted', label: B.cols.predicted, num: true },
        ],
        rows: s.bursts.map((b) => ({ cells: { rho: F.plain(b.rho), variance: F.num(b.variance, 1), exact: F.num(b.exact.variance, 1), factor: F.num(b.exact.factor, 2), effective: F.int(b.exact.effective), coverage: F.pct(b.coverage, 1), predicted: F.pct(b.exact.coverage, 1) } })),
      }),
      h('p', { text: B.simulation(s.bursts) }),
    ])),
    h('p', { text: B.after }),
  ];
}

function tryBurstsBox() {
  const T = text.tryBursts;
  const F = text.fmt;
  const rhoOf = () => hw.BURST_RHOS[state.burst];
  const independent = hw.burstPath(view.BURST_STRIP, hw.FALSE_ALARMS.rate, 0);
  const count = (cells) => cells.reduce((a, v) => a + v, 0);
  const strips = h('div');
  const fig = figure(T.chartTitle, hw.drawLineChart, view.burstChart(rhoOf(), F.decimal), { tip: view.tips.burst(rhoOf(), text.tips), items: view.legends.burst(text.legends), keep: keep('burst') });
  const line = resultLine('');
  const update = () => {
    const rho = rhoOf();
    const bursty = hw.burstPath(view.BURST_STRIP, hw.FALSE_ALARMS.rate, rho);
    const label1 = T.stripLabel(T.strips.independent, count(independent), view.BURST_STRIP);
    const label2 = T.stripLabel(T.strips.bursts, count(bursty), view.BURST_STRIP);
    fill(
      strips,
      h(
        'div',
        { class: 'charts' },
        figure(label1, hw.drawStrip, view.stripChart(independent), { wide: false, tip: view.tips.strip(independent, text.tips) }),
        figure(label2, hw.drawStrip, view.stripChart(bursty), { wide: false, tip: view.tips.strip(bursty, text.tips) }),
      ),
    );
    refresh(fig, view.burstChart(rho, F.decimal), view.tips.burst(rho, text.tips));
    line.textContent = T.result(hw.burstFacts(1000, hw.FALSE_ALARMS.rate, rho));
  };
  const control = slider('hw7-rho', T.rhoLabel(rhoOf()), hw.BURST_RHOS.length - 1, state.burst, (v) => {
    state.burst = v;
    control.label(T.rhoLabel(rhoOf()));
    update();
  });
  update();
  return tryBox('hw7-try-bursts', text.sections.tryBursts, h('p', { text: T.intro }), control.el, strips, h('div', { class: 'charts' }, fig), line);
}

function heavyBlock() {
  const H = text.heavy;
  const F = text.fmt;
  const b = hw.bytesFacts();
  const facts = [
    ['mean', F.int(b.mean)],
    ['median', F.int(b.median)],
    ['sd', F.int(b.sd)],
    ['max', F.int(b.max)],
    ['zeros', F.int(b.zeros)],
    ['top10', F.pct(b.top10)],
    ['skewness', F.num(b.skewness, 1)],
    ['ratio', F.num(b.ratio, 1)],
    ['needed', F.int(b.needed)],
  ];
  return [
    title('hw7-heavy', 1, text.sections.heavy),
    paras(H.paras(b)),
    dataTable({ caption: H.factsTitle, columns: [{ key: 'what', label: '' }, { key: 'value', label: '', num: true }], rows: facts.map(([k, v]) => ({ cells: { what: H.facts[k], value: v } })) }),
    whenComputed((s) => {
      if (!s) return pending();
      // a new sample of Cauchy paths takes a few milliseconds; the first one comes from the computation of the page
      const cauchyModel = sectionModel('cauchy', 'cauchy');
      const linesOf = (m) => (m.params.seed === hw.DEFAULT_SEED ? s.cauchy : hw.cauchyPaths(m.params.seed));
      const cauchyFig = figure(H.cauchyTitle, hw.drawLineChart, view.cauchyChart(linesOf(cauchyModel.get()), F.decimal));
      follow(cauchyModel, (m) => {
        const lines = linesOf(m);
        const data = view.cauchyChart(lines, F.decimal);
        cauchyFig.kit.setData(data);
        cauchyFig.kit.setTip(view.tips.cauchy(lines, text.tips));
        cauchyFig.kit.setAnimation(view.reveal(data, 80));
      });
      const bytesModel = sectionModel('bytes', 'bytes');
      const meansOf = (m) => s.bytes.find((x) => x.n === m.params.n) || s.bytes[s.bytes.length - 1];
      const histFig = figure(H.histTitle, hw.drawHistogram, view.bytesChart(meansOf(bytesModel.get()), F.decimal), { items: view.legends.bytes(text.legends), keep: keep('bytes') });
      follow(bytesModel, (m) => {
        const hist = view.bytesChart(meansOf(m), F.decimal);
        histFig.kit.setData(hist);
        histFig.kit.setTip(view.tips.histogram(hist, text.tips, hw.BYTES_REPS));
      });
      return [
        h(
          'div',
          { class: 'charts' },
          h('div', null, kit.modelControls(cauchyModel, view.controls.cauchy(text.controls), state.lang), cauchyFig),
          h('div', null, kit.modelControls(bytesModel, view.controls.bytes(text.controls), state.lang), histFig),
        ),
        dataTable({
          caption: H.tableTitle,
          columns: [{ key: 'n', label: H.cols.n }, { key: 'D', label: H.cols.D, num: true }, { key: 'p', label: H.cols.p, num: true }, { key: 'below', label: H.cols.below, num: true }, { key: 'median', label: H.cols.median, num: true }],
          rows: s.bytes.map((x) => ({ cells: { n: F.int(x.n), D: F.num(x.D, 3), p: F.p(x.p, x.log10p), below: F.pct(x.below), median: F.num(x.median, 3) } })),
        }),
        h('p', { text: H.bytes(s.bytes) }),
      ];
    }),
  ];
}

function speedBlock() {
  const V = text.speed;
  const F = text.fmt;
  const start = hw.deviationTable();
  const items = view.legends.speed(text.legends);
  const model = sectionModel('speed', 'speed');
  const rowsOf = (m) => hw.deviationTable(m.params.rate, m.params.epsilon);
  const fig = figure(V.chartTitle, hw.drawLineChart, view.speedChart(rowsOf(model.get()), F.decimal), { items, link: view.links.speed, table: view.LINKED_TABLES.speed, keep: keep('speed') });
  const tableRegion = h('div');
  follow(model, (m) => {
    const rows = rowsOf(m);
    const data = view.speedChart(rows, F.decimal);
    fig.kit.setData(data);
    fig.kit.setTip(view.tips.speed(rows, text.tips));
    fig.kit.setAnimation(view.reveal(data));
    fill(
      tableRegion,
      dataTable({
        id: view.LINKED_TABLES.speed,
        caption: V.tableTitle,
        columns: [
          { key: 'n', label: V.cols.n },
          { key: 'exact', label: V.cols.exact, num: true, part: part(items, 0) },
          { key: 'chebyshev', label: V.cols.chebyshev, num: true, part: part(items, 1) },
          { key: 'hoeffding', label: V.cols.hoeffding, num: true, part: part(items, 2) },
          { key: 'normal', label: V.cols.normal, num: true, part: part(items, 3) },
        ],
        rows: rows.map((r) => ({ cells: { n: F.int(r.n), exact: F.prob(r.exact), chebyshev: F.prob(r.chebyshev), hoeffding: F.prob(r.hoeffding), normal: F.prob(r.normal) } })),
      }),
    );
    hideParts(tableRegion.querySelector('table'), partsOf(items, keep('speed')));
  });
  return [
    title('hw7-speed', 1, text.sections.speed),
    paras(V.paras(start)),
    kit.modelControls(model, view.controls.speed(text.controls), state.lang),
    h('div', { class: 'charts' }, fig),
    tableRegion,
  ];
}

function convergenceSection() {
  const C = text.convergence;
  return h(
    'section',
    { class: 'section' },
    title('hw7-convergence', 0, text.sections.convergence),
    paras(C.intro),
    formulas(C.formulas),
    paras(C.after),
    probabilityBlock(),
    almostBlock(),
    trySequencesBox(),
    l2Block(),
    distributionBlock(),
    tryCltBox(),
    tryHashBox(),
    mapBlock(),
    tryMapBox(),
    rolesBlock(),
    resultsBlock(),
    rootBlock(),
    tryScaleBox(),
    burstsBlock(),
    tryBurstsBox(),
    heavyBlock(),
    speedBlock(),
  );
}

// ---------------------------------------------------------------------------
// 2. Probabilita' condizionata, teorema di Bayes e inferenza statistica
// ---------------------------------------------------------------------------

function conditionalBlock() {
  const C = text.conditional;
  const F = text.fmt;
  const chain = hw.attackChain();
  const indep = hw.independenceFacts();
  const pv = hw.pvalueFacts();
  const row = (when, x) => ({ cells: { when, phishing: F.pct(x.phishing, 2), exploit: F.pct(x.exploit, 2), product: F.pct(x.phishing * x.exploit, 3), both: F.pct(x.both, 3) } });
  return [
    title('hw7-conditional', 1, text.sections.conditional),
    paras(C.paras),
    h('p', { text: C.chainIntro }),
    dataTable({
      caption: C.chainTitle,
      columns: [{ key: 'stage', label: C.chainCols.stage }, { key: 'p', label: C.chainCols.p, num: true }, { key: 'cumulative', label: C.chainCols.cumulative, num: true }],
      rows: chain.rows.map((r) => ({ cells: { stage: C.stages[r.key], p: F.pct(r.p, 0), cumulative: F.pctSmall(r.cumulative) } })),
    }),
    h('p', { text: C.chainText(chain) }),
    h('p', { text: C.indepIntro }),
    dataTable({
      caption: C.indepTitle,
      columns: [
        { key: 'when', label: C.indepCols.when },
        { key: 'phishing', label: C.indepCols.phishing, num: true },
        { key: 'exploit', label: C.indepCols.exploit, num: true },
        { key: 'product', label: C.indepCols.product, num: true },
        { key: 'both', label: C.indepCols.both, num: true },
      ],
      rows: [row(C.indepRows.before, indep.causes), row(C.indepRows.after, indep.causesGivenEdr)],
    }),
    h('p', { text: C.indepText(indep) }),
    h('p', { text: C.pvalueIntro(pv) }),
    h('p', { text: C.pvalueText(pv) }),
    h('p', { text: C.manyText(hw.discoveryFacts()) }),
  ];
}

function tryPvalueBox() {
  const T = text.tryPvalue;
  const F = text.fmt;
  const d = state.discovery;
  const factsOf = () => hw.discoveryFacts({ real: hw.DISCOVERY_REALS[d.real], power: hw.DISCOVERY_POWERS[d.power], alpha: hw.DISCOVERY_ALPHAS[d.alpha] });
  const items = view.legends.discovery(text.legends);
  const hidden = keep('discovery');
  const first = factsOf();
  const fig = figure(T.iconTitle, hw.drawIconArray, view.discoveryIcons(first), { tip: view.tips.discovery(first, text.tips), items, link: view.links.discovery, table: view.LINKED_TABLES.discovery, keep: hidden });
  const tableRegion = h('div');
  const line = resultLine('');
  const sliders = {};
  const update = () => {
    const facts = factsOf();
    refresh(fig, view.discoveryIcons(facts), view.tips.discovery(facts, text.tips));
    sliders.real.label(T.real(facts.real));
    sliders.power.label(T.power(facts.power));
    sliders.alpha.label(T.alpha(facts.alpha));
    fill(
      tableRegion,
      dataTable({
        id: view.LINKED_TABLES.discovery,
        caption: T.tableTitle,
        columns: [{ key: 'category', label: T.cols.category }, { key: 'truth', label: T.cols.truth }, { key: 'decision', label: T.cols.decision }, { key: 'count', label: T.cols.count, num: true }, { key: 'share', label: T.cols.share, num: true }],
        rows: view.DISCOVERY_CATEGORIES.map((c, k) => ({ part: part(items, k), cells: { category: text.legends[c], truth: T.truth[c], decision: T.decision[c], count: F.int(facts.counts[k]), share: F.pct(facts.counts[k] / facts.total, 1) } })),
      }),
    );
    // the table is new: the categories hidden from the legend stay hidden
    hideParts(tableRegion.querySelector('table'), partsOf(items, hidden));
    line.textContent = T.result(facts);
  };
  const set = (key) => (v) => {
    d[key] = v;
    update();
  };
  sliders.real = slider('hw7-real', T.real(first.real), hw.DISCOVERY_REALS.length - 1, d.real, set('real'));
  sliders.power = slider('hw7-power', T.power(first.power), hw.DISCOVERY_POWERS.length - 1, d.power, set('power'));
  sliders.alpha = slider('hw7-alpha-tests', T.alpha(first.alpha), hw.DISCOVERY_ALPHAS.length - 1, d.alpha, set('alpha'));
  update();
  return tryBox('hw7-try-pvalue', text.sections.tryPvalue, h('p', { text: T.intro }), sliders.real.el, sliders.power.el, sliders.alpha.el, h('div', { class: 'charts' }, fig), tableRegion, line);
}

function engineBlock() {
  const E = text.engine;
  const F = text.fmt;
  // the text speaks of the first day and of ten days; the chart follows the days chosen
  const start = view.likelihoodChart(hw.DEFAULT_SEED, F.decimal);
  const d1 = start.curves.data.day1;
  const d10 = start.curves.data.days10;
  const model = sectionModel('engine', 'likelihood');
  const likOf = (m) => view.likelihoodChart(hw.DEFAULT_SEED, F.decimal, m.params.days);
  const first = likOf(model.get());
  const fig = figure(E.likelihoodTitle, hw.drawLineChart, first.chart, { tip: view.tips.likelihood(first.curves, text.tips), items: view.legends.likelihood(text.legends, model.get().params.days), keep: keep('likelihood') });
  follow(model, (m) => {
    const lik = likOf(m);
    fig.kit.setData(lik.chart);
    fig.kit.setTip(view.tips.likelihood(lik.curves, text.tips));
    relabel(fig, view.legends.likelihood(text.legends, m.params.days));
  });
  return [
    title('hw7-engine', 1, text.sections.engine),
    h('p', { text: E.components }),
    kit.modelControls(model, view.controls.likelihood(text.controls), state.lang),
    h('div', { class: 'charts' }, fig),
    h('p', { text: E.likelihood(start.curves) }),
    h('p', { text: E.odds }),
    formulas(E.formulas),
    h('p', { text: E.weights(hw.priorWeight(hw.PRIORS.informed, d1.clicks, d1.sent), hw.priorWeight(hw.PRIORS.informed, d10.clicks, d10.sent)) }),
    h('p', { text: E.central }),
    h('p', { text: E.after }),
  ];
}

function alarmBlock() {
  const A = text.alarm;
  const F = text.fmt;
  const facts = hw.alarmFacts(hw.ALARM_DEFAULT);
  const chains = view.alarmChains();
  const items = view.legends.alarm(text.legends);
  return [
    title('hw7-alarm', 1, text.sections.alarm),
    h('p', { text: A.intro(facts) }),
    paras(A.paras(facts)),
    h('div', { class: 'charts' }, figure(A.iconTitle, hw.drawIconArray, view.alarmIcons(facts), { tip: view.tips.alarm(facts, text.tips), items, link: view.links.alarm, table: view.LINKED_TABLES.alarm, keep: keep('alarm') })),
    dataTable({
      id: view.LINKED_TABLES.alarm,
      caption: A.tableTitle,
      columns: [
        { key: 'category', label: A.cols.category },
        { key: 'truth', label: A.cols.truth },
        { key: 'alarm', label: A.cols.alarm },
        { key: 'count', label: A.cols.count, num: true },
        { key: 'share', label: A.cols.share, num: true },
      ],
      rows: view.ALARM_CATEGORIES.map((c, k) => ({ part: part(items, k), cells: { category: text.legends[c], truth: A.truth[c], alarm: A.alarmed[c], count: F.int(facts.counts[k]), share: F.pctSmall(facts.counts[k] / facts.population) } })),
    }),
    h('p', { text: A.chainIntro(hw.SECOND_DETECTOR) }),
    dataTable({
      caption: A.chainTitle,
      columns: [
        { key: 'order', label: A.chainCols.order },
        { key: 'step', label: A.chainCols.step },
        { key: 'lr', label: A.chainCols.lr, num: true },
        { key: 'weight', label: A.chainCols.weight, num: true },
        { key: 'prior', label: A.chainCols.prior, num: true },
        { key: 'posterior', label: A.chainCols.posterior, num: true },
      ],
      rows: ['forward', 'backward'].flatMap((o) => chains[o].map((st, i) => ({ cells: { order: i === 0 ? A.orders[o] : '', step: A.detectors[st.key], lr: F.num(st.lr, 1), weight: F.num(st.weight, 2), prior: F.pct(st.prior, 2), posterior: F.pct(st.posterior, 2) } }))),
    }),
  ];
}

function tryAlarmBox() {
  const T = text.tryAlarm;
  const a = state.alarm;
  const first = view.alarmTry(a);
  const fig = figure(text.alarm.iconTitle, hw.drawIconArray, view.alarmIcons(first.facts), { tip: view.tips.alarm(first.facts, text.tips), items: view.legends.alarm(text.legends), keep: keep('alarmTry') });
  const line = resultLine('');
  const sliders = {};
  const update = () => {
    const t = view.alarmTry(a);
    refresh(fig, view.alarmIcons(t.facts), view.tips.alarm(t.facts, text.tips));
    sliders.base.label(T.base(t.settings.base));
    sliders.sensitivity.label(T.sensitivity(t.settings.sensitivity));
    sliders.fpr.label(T.fpr(t.settings.fpr));
    line.textContent = `${T.result(t)}${a.second ? ` ${T.secondResult(t)}` : ''}`;
  };
  const set = (key) => (v) => {
    a[key] = v;
    update();
  };
  sliders.base = slider('hw7-base', T.base(first.settings.base), hw.ALARM_BASES.length - 1, a.base, set('base'));
  sliders.sensitivity = slider('hw7-sensitivity', T.sensitivity(first.settings.sensitivity), hw.ALARM_SENSITIVITIES.length - 1, a.sensitivity, set('sensitivity'));
  sliders.fpr = slider('hw7-fpr', T.fpr(first.settings.fpr), hw.ALARM_FPRS.length - 1, a.fpr, set('fpr'));
  const second = h(
    'label',
    { class: 'toggle' },
    h('input', {
      type: 'checkbox',
      checked: a.second,
      onchange: (e) => {
        a.second = e.target.checked;
        update();
      },
    }),
    ` ${T.second}`,
  );
  update();
  return tryBox('hw7-try-alarm', text.sections.tryAlarm, h('p', { text: T.intro }), sliders.base.el, sliders.sensitivity.el, sliders.fpr.el, second, h('div', { class: 'charts' }, fig), line);
}

function networkBlock() {
  const N = text.network;
  const F = text.fmt;
  const rows = view.networkRows();
  const items = view.legends.network(text.legends);
  return [
    title('hw7-network', 1, text.sections.network),
    paras(N.intro),
    h('div', { class: 'charts' }, figure(N.chartTitle, hw.drawGroupedBars, view.networkChart(rows, N.stepsShort, F.decimal), { tip: view.tips.network(rows, text.tips), items, link: view.links.network, table: view.LINKED_TABLES.network, keep: keep('network') })),
    dataTable({
      id: view.LINKED_TABLES.network,
      caption: N.tableTitle,
      columns: [
        { key: 'step', label: N.cols.step },
        { key: 'phishing', label: N.cols.phishing, num: true, part: part(items, 0) },
        { key: 'exploit', label: N.cols.exploit, num: true, part: part(items, 1) },
        { key: 'compromise', label: N.cols.compromise, num: true, part: part(items, 2) },
        { key: 'evidence', label: N.cols.evidence, num: true },
      ],
      rows: rows.map((r, i) => ({ cells: { step: N.steps[i], phishing: F.pct(r.phishing), exploit: F.pct(r.exploit), compromise: F.pct(r.compromise), evidence: F.pctSmall(r.pEvidence) } })),
    }),
    paras(N.paras(rows)),
  ];
}

// La rete del triage, disegnata: ogni nodo con la sua probabilita', scritta
// e come barra; gli indizi osservati con il bordo evidenziato
function networkDiagram(q, evidence) {
  const pal = palette();
  const N = text.network.nodes;
  const { box } = view.NETWORK_VIEW;
  const L = view.NETWORK_LAYOUT;
  const prior = hw.networkPosterior({});
  const drawing = svg(
    'svg',
    { class: 'diagram', viewBox: '0 0 100 64', role: 'img', 'aria-label': text.tryNetwork.diagramLabel },
    svg('defs', null, svg('marker', { id: 'network-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: pal.text }))),
    view.NETWORK_EDGES.map(([a, b]) => svg('line', { x1: L[a].x, y1: L[a].y + box.h / 2, x2: L[b].x, y2: L[b].y - box.h / 2 - 0.6, stroke: pal.text, 'stroke-width': 0.35, 'marker-end': 'url(#network-arrow)' })),
    hw.NETWORK.nodes.map((node) => {
      const { x, y } = L[node];
      const p = q[node];
      const known = evidence[node] !== null && evidence[node] !== undefined;
      const left = x - box.w / 2;
      const top = y - box.h / 2;
      return svg(
        'g',
        null,
        svg('rect', { x: left, y: top, width: box.w, height: box.h, rx: 1.6, fill: pal.background, stroke: known ? pal.highlight : pal.text, 'stroke-width': known ? 0.8 : 0.3 }),
        svg('rect', { x: left + 1.5, y: top + box.h - 3, width: box.w - 3, height: 1.6, rx: 0.5, fill: pal.grid }),
        svg('rect', { x: left + 1.5, y: top + box.h - 3, width: (box.w - 3) * Math.min(1, Math.max(0, p)), height: 1.6, rx: 0.5, fill: pal.highlight }),
        svg('text', { x, y: top + 3.6, 'text-anchor': 'middle', 'font-size': 2.7, fill: pal.text, text: N[node] }),
        svg('text', { x, y: top + 7.6, 'text-anchor': 'middle', 'font-size': 3.2, 'font-weight': 'bold', fill: pal.text, text: text.fmt.pct(p) }),
      );
    }),
  );
  return labelled(drawing, (x, y, width) => {
    const hit = view.diagramHit(L, view.NETWORK_VIEW, width, x, y);
    return hit && { rect: hit.rect, text: text.tips.node(N[hit.key], q[hit.key], prior[hit.key], evidence[hit.key]) };
  });
}

function tryNetworkBox() {
  const T = text.tryNetwork;
  const options = [[null, T.states.unknown], [true, T.states.yes], [false, T.states.no]];
  const out = live(() => {
    const q = hw.networkPosterior(state.evidence);
    return [networkDiagram(q, state.evidence), resultLine(T.result(q))];
  });
  return tryBox(
    'hw7-try-network',
    text.sections.tryNetwork,
    h('p', { text: T.intro }),
    hw.CLUES.map((clue) => choices(text.network.nodes[clue], options, state.evidence[clue], (v) => {
      state.evidence[clue] = v;
      out.update();
    })),
    out.region,
  );
}

function sprtBlock() {
  const W = text.sprt;
  const F = text.fmt;
  const start = hw.sprtSetup(hw.SPRT_DEFAULT);
  const startExact = { legit: hw.sprtExact(start, hw.SPRT_DEFAULT.p0), attacker: hw.sprtExact(start, hw.SPRT_DEFAULT.p1) };
  const model = sectionModel('sprt', 'sprt');
  const setupOf = (m) => hw.sprtSetup({ ...hw.SPRT_DEFAULT, alpha: m.params.alpha, beta: m.params.beta });
  const moveHandle = (id, v) => model.setParams(view.handles.sprtMove(model.get().params, id, v));
  const firstSetup = setupOf(model.get());
  const firstWalks = view.sprtWalks(firstSetup, model.get().params.seed);
  const fig = figure(W.chartTitle, hw.drawLineChart, view.sprtChart(firstSetup, firstWalks, F.decimal), { items: view.legends.sprt(text.legends, firstWalks), keep: keep('sprt'), handles: { items: view.handles.sprt(firstSetup, text.controls), onChange: moveHandle } });
  const tableRegion = h('div');
  const row = (who, ex, wald, simulated) => ({ cells: { who: W.who[who], block: F.prob(ex.block), clear: F.prob(ex.clear), exact: F.num(ex.mean, 2), wald: F.num(wald, 2), simulated: simulated ? F.num(simulated.meanSteps, 2) : '-' } });
  const tableOf = (m) => {
    const setup = setupOf(m);
    const exact = { legit: hw.sprtExact(setup, hw.SPRT_DEFAULT.p0), attacker: hw.sprtExact(setup, hw.SPRT_DEFAULT.p1) };
    // the simulation of the page was run with the starting errors
    const s = computation.shown;
    const sim = s && m.params.alpha === hw.SPRT_DEFAULT.alpha && m.params.beta === hw.SPRT_DEFAULT.beta ? s.sprt : null;
    return dataTable({
      caption: W.tableTitle,
      columns: [
        { key: 'who', label: W.cols.who },
        { key: 'block', label: W.cols.block, num: true },
        { key: 'clear', label: W.cols.clear, num: true },
        { key: 'exact', label: W.cols.exact, num: true },
        { key: 'wald', label: W.cols.wald, num: true },
        { key: 'simulated', label: W.cols.simulated, num: true },
      ],
      rows: [row('legit', exact.legit, setup.waldLegit, sim && sim.legit), row('attacker', exact.attacker, setup.waldAttacker, sim && sim.attackers)],
    });
  };
  follow(model, (m) => {
    const setup = setupOf(m);
    const walks = view.sprtWalks(setup, m.params.seed);
    const data = view.sprtChart(setup, walks, F.decimal);
    fig.kit.setData(data);
    fig.kit.setTip(view.tips.sprt(setup, walks, text.tips));
    fig.kit.setAnimation(view.reveal(data, 320));
    fig.kit.setHandles({ items: view.handles.sprt(setup, text.controls), onChange: moveHandle });
    fill(tableRegion, tableOf(m));
  });
  return [
    title('hw7-sprt', 1, text.sections.sprt),
    paras(W.intro),
    formulas(W.formulas(start)),
    kit.modelControls(model, view.controls.sprt(text.controls), state.lang),
    h('div', { class: 'charts' }, fig),
    paras(W.paras(start, startExact.legit, startExact.attacker)),
    tableRegion,
    whenComputed((s) => {
      // the simulated column arrives with the computation of the page
      fill(tableRegion, tableOf(model.get()));
      return s ? h('p', { text: W.simulation(s.sprt) }) : pending();
    }),
  ];
}

function trySprtBox() {
  const T = text.trySprt;
  const F = text.fmt;
  const run = state.sprt;
  const setupOf = () => hw.sprtSetup({ ...hw.SPRT_DEFAULT, alpha: hw.SPRT_ALPHAS[run.alpha] });
  const walksOf = (setup) => [{ ...hw.sprtPath(setup, run.attempts), key: 'live', color: 4 }];
  const setup0 = setupOf();
  const walks0 = walksOf(setup0);
  const fig = figure(T.walk, hw.drawLineChart, view.sprtChart(setup0, walks0, F.decimal), { tip: view.tips.sprt(setup0, walks0, text.tips), items: view.legends.sprt(text.legends, walks0), keep: keep('trySprt') });
  const line = resultLine('');
  const buttons = [];
  const update = () => {
    const setup = setupOf();
    const walks = walksOf(setup);
    const path = walks[0];
    refresh(fig, view.sprtChart(setup, walks, F.decimal), view.tips.sprt(setup, walks, text.tips));
    buttons.forEach((b) => {
      b.disabled = Boolean(path.decision);
    });
    line.textContent = T.result(path, path.steps, path.decision);
  };
  const add = (failed) => {
    run.attempts = [...run.attempts, failed];
    update();
  };
  // a simulated address: one more attempt from the stream 'live', failing with p0 or p1
  const simulate = (pFail) => {
    const next = hw.generator(hw.DEFAULT_SEED, 'live', 2000000 + run.draws);
    run.attempts = [...run.attempts, hw.uniform53(next) < pFail];
    run.draws += 1;
    update();
  };
  buttons.push(action(T.fail, () => add(true)), action(T.success, () => add(false)), action(T.legit, () => simulate(hw.SPRT_DEFAULT.p0)), action(T.attacker, () => simulate(hw.SPRT_DEFAULT.p1)));
  update();
  return tryBox(
    'hw7-try-sprt',
    text.sections.trySprt,
    h('p', { text: T.intro }),
    choices(T.alphaLabel, hw.SPRT_ALPHAS.map((a, i) => [i, T.alphaName(a)]), run.alpha, (v) => {
      run.alpha = v;
      update();
    }),
    actions(
      buttons,
      action(text.ui.reset, () => {
        run.attempts = [];
        update();
      }),
    ),
    h('div', { class: 'charts' }, fig),
    line,
  );
}

function rateBlock() {
  const R = text.rate;
  const F = text.fmt;
  const start = view.campaignFacts();
  const items = view.legends.campaign(text.legends);
  const model = sectionModel('rate', 'campaign');
  const factsOf = (m) => (view.atStart('campaign', m.params) ? start : view.campaignFacts(m.params.seed, { rate: m.params.rate, perDay: m.params.perDay }));
  const moveHandle = (id, v) => model.setParams(view.handles.trueRateMove(model.get().params, id, v));
  const fig = figure(R.chartTitle, hw.drawLineChart, view.campaignChart(factsOf(model.get()), F.decimal), { items, link: view.links.campaign, table: view.LINKED_TABLES.campaign, keep: keep('campaign'), handles: { items: view.handles.trueRate(model.get().params.rate, text.controls), onChange: moveHandle } });
  const tableRegion = h('div');
  follow(model, (m) => {
    const c = factsOf(m);
    const data = view.campaignChart(c, F.decimal);
    fig.kit.setData(data);
    fig.kit.setTip(view.tips.campaign(c, text.tips));
    fig.kit.setAnimation(view.reveal(data, 450));
    fig.kit.setHandles({ items: view.handles.trueRate(m.params.rate, text.controls), onChange: moveHandle });
    fill(
      tableRegion,
      dataTable({
        id: view.LINKED_TABLES.campaign,
        caption: R.tableTitle,
        columns: [
          { key: 'day', label: R.cols.day },
          { key: 'sent', label: R.cols.sent, num: true },
          { key: 'clicks', label: R.cols.clicks, num: true },
          { key: 'uniform', label: R.cols.uniform, num: true, part: part(items, 0) },
          { key: 'informed', label: R.cols.informed, num: true, part: part(items, 1) },
          { key: 'above', label: R.cols.above, num: true, part: part(items, 0) },
        ],
        rows: c.uniform.map((u, i) => ({ cells: { day: F.int(u.day), sent: F.int(u.sent), clicks: F.int(u.clicks), uniform: R.interval(u), informed: R.interval(c.informed[i]), above: F.pct(c.aboveUniform[i]) } })),
      }),
    );
    hideParts(tableRegion.querySelector('table'), partsOf(items, keep('campaign')));
  });
  return [
    title('hw7-rate', 1, text.sections.rate),
    h('p', { text: R.intro(start) }),
    paras(R.paras(start)),
    kit.modelControls(model, view.controls.campaign(text.controls), state.lang),
    h('div', { class: 'charts' }, fig),
    tableRegion,
    h('p', { text: R.after }),
  ];
}

function tryBeliefBox() {
  const T = text.tryBelief;
  const F = text.fmt;
  const b = state.belief;
  const chartOf = (curves) => view.densityChart(curves, F.decimal, Math.min(40, Math.max(6, ...curves.posterior.filter(Number.isFinite), ...curves.likelihood.filter(Number.isFinite)) * 1.08));
  const first = view.beliefCurves(b);
  const fig = figure(T.chartTitle, hw.drawLineChart, chartOf(first), { tip: view.tips.density(first, text.tips), items: view.legends.density(text.legends), keep: keep('belief') });
  const line = resultLine('');
  const update = () => {
    const curves = view.beliefCurves(b);
    refresh(fig, chartOf(curves), view.tips.density(curves, text.tips));
    line.textContent = T.result(b, curves.post, curves.post.above(hw.TARGET_RATE));
  };
  const add = (clicked) => {
    b.clicks += clicked ? 1 : 0;
    b.sent += 1;
    update();
  };
  update();
  return tryBox(
    'hw7-try-belief',
    text.sections.tryBelief,
    h('p', { text: T.intro }),
    choices(T.priorLabel, hw.PRIOR_KEYS.map((k) => [k, T.priors[k]]), b.prior, (v) => {
      b.prior = v;
      update();
    }),
    actions(
      action(T.click, () => add(true)),
      action(T.noClick, () => add(false)),
      action(T.ten, () => {
        b.clicks += view.moreEmails(b.draws);
        b.sent += 10;
        b.draws += 1;
        update();
      }),
      action(text.ui.reset, () => {
        b.clicks = 0;
        b.sent = 0;
        update();
      }),
    ),
    h('div', { class: 'charts' }, fig),
    line,
  );
}

// the editor of the prior and its observer: released when the page is drawn again
let priorEditor = null;

function tryPriorBox() {
  const T = text.tryPrior;
  const F = text.fmt;
  const p = state.prior;
  const gridsOf = () => {
    const counts = view.priorData(p.data);
    return { grid: hw.gridPosterior(hw.priorFromHandles(p.heights), counts.clicks, counts.sent), flat: hw.gridPosterior(hw.priorFromHandles(hw.PRIOR_SHAPES.flat), counts.clicks, counts.sent) };
  };
  const first = gridsOf();
  const fig = figure(T.chartTitle, hw.drawLineChart, view.densityChart(first.grid, F.decimal), { tip: view.tips.density(first.grid, text.tips), items: view.legends.density(text.legends), keep: keep('prior') });
  const line = resultLine(T.result(first.grid, first.flat));
  const update = () => {
    const g = gridsOf();
    refresh(fig, view.densityChart(g.grid, F.decimal), view.tips.density(g.grid, text.tips));
    line.textContent = T.result(g.grid, g.flat);
  };
  const shapes = h('div');
  const buildShapes = () => fill(
    shapes,
    choices(T.shapeLabel, hw.PRIOR_SHAPE_KEYS.map((k) => [k, T.shapes[k]]), p.shape, (k) => {
      p.shape = k;
      p.heights = [...hw.PRIOR_SHAPES[k]];
      if (priorEditor) priorEditor.editor.setHeights(p.heights);
      update();
    }),
  );
  if (priorEditor) {
    priorEditor.observer.disconnect();
    priorEditor.editor.destroy();
  }
  const canvas = h('canvas', { class: 'editor', tabindex: 0, role: 'slider', 'aria-label': T.editorLabel, 'aria-valuemin': 0, 'aria-valuemax': 1 });
  const editor = hw.attachPriorEditor(canvas, {
    heights: p.heights,
    onChange: (heights) => {
      p.heights = heights;
      // a prior drawn by hand is none of the ready shapes
      if (p.shape !== null) {
        p.shape = null;
        buildShapes();
      }
      update();
    },
    palette: palette(),
    decimal: F.decimal,
    label: T.handle,
  });
  const observer = new ResizeObserver((entries) => {
    const width = Math.round(entries[entries.length - 1].contentRect.width);
    if (width > 0) editor.redraw(width);
  });
  observer.observe(canvas);
  priorEditor = { editor, observer };
  buildShapes();
  return tryBox(
    'hw7-try-prior',
    text.sections.tryPrior,
    h('p', { text: T.intro }),
    shapes,
    canvas,
    choices(T.dataLabel, view.PRIOR_DATA.map((k) => [k, T.data[k]]), p.data, (k) => {
      p.data = k;
      update();
    }),
    h('div', { class: 'charts' }, fig),
    line,
  );
}

function frequentistBlock() {
  const Q = text.frequentist;
  const F = text.fmt;
  const start = hw.coverageCurves();
  const model = sectionModel('frequentist', 'coverage');
  const covOf = (m) => (view.atStart('coverage', m.params) ? start : hw.coverageCurves(m.params.n));
  const fig = figure(Q.chartTitle, hw.drawLineChart, view.coverageChart(covOf(model.get()), F.decimal), { items: view.legends.coverage(text.legends), note: Q.chartNote, keep: keep('coverage') });
  const tableRegion = h('div');
  follow(model, (m) => {
    const cov = covOf(m);
    fig.kit.setData(view.coverageChart(cov, F.decimal));
    fig.kit.setTip(view.tips.coverage(cov, text.tips));
    fill(
      tableRegion,
      dataTable({
        caption: Q.tableTitle,
        columns: [
          { key: 'method', label: Q.cols.method },
          { key: 'mean', label: Q.cols.mean, num: true },
          { key: 'min', label: Q.cols.min, num: true },
          { key: 'at', label: Q.cols.at, num: true },
          { key: 'width', label: Q.cols.width, num: true },
        ],
        rows: hw.INTERVAL_METHODS.map((k) => ({ cells: { method: text.names.methods[k], mean: F.pct(cov.summary[k].mean), min: F.pct(cov.summary[k].min), at: `p = ${F.pct(cov.summary[k].minAt, 1)}`, width: F.pct(cov.summary[k].width) } })),
      }),
    );
  });
  return [
    title('hw7-frequentist', 1, text.sections.frequentist),
    paras(Q.intro),
    kit.modelControls(model, view.controls.coverage(text.controls), state.lang),
    h('div', { class: 'charts' }, fig),
    tableRegion,
    paras(Q.paras(start)),
    whenComputed((s) => (s ? h('p', { text: Q.simulation(s.coverage) }) : pending())),
  ];
}

function spamBlock() {
  const M = text.spam;
  const F = text.fmt;
  const { sms } = getModels();
  const c = sms.matrix;
  const items = view.legends.logOdds(text.legends);
  const words = Array.from({ length: Math.max(sms.spamWords.length, sms.hamWords.length) }, (_, i) => i);
  const link = (href, label) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', text: label });
  // the message to score: the example until the reader writes another one
  const field = h('textarea', { id: 'hw7-message', rows: 3, maxlength: 2000, ...PRIVATE_FIELD });
  field.value = state.message === null ? view.SPAM_EXAMPLE : state.message;
  // the threshold of the filter, between two bins of log-odds: a slider, or a line to drag on the chart
  const cutModel = sectionModel('spam', 'spam');
  const moveCut = (id, v) => cutModel.setParams(view.handles.spamMove(cutModel.get().params, id, v));
  const cutControls = kit.modelControls(cutModel, view.controls.spam(text.controls, sms.bins), state.lang);
  const cutFig = figure(M.chartTitle, hw.drawGroupedBars, view.logOddsChart(sms, F.decimal), { tip: view.tips.logOdds(sms, text.tips), items, link: view.links.logOdds, table: view.LINKED_TABLES.logOdds, keep: keep('logOdds'), handles: { items: view.handles.spam(cutModel.get().params.cut, sms.bins, text.controls), onChange: moveCut } });
  const cutLine = resultLine('');
  follow(cutModel, (m) => {
    cutFig.kit.setHandles({ items: view.handles.spam(m.params.cut, sms.bins, text.controls), onChange: moveCut });
    cutLine.textContent = text.controls.spam(view.spamCut(sms.bins, m.params.cut));
  });
  const scoreRegion = h('div');
  const update = () => {
    const score = hw.spamScore(sms.model, field.value, view.spamPrior(state.base, sms));
    const parts = [...score.parts].sort((a, b) => Math.abs(b.weight ?? 0) - Math.abs(a.weight ?? 0));
    const rowClass = (x) => {
      if (!x.known) return 'unknown';
      return x.weight > 0 ? 'towards-spam' : 'towards-ham';
    };
    fill(
      scoreRegion,
      resultLine(M.result(score)),
      parts.length > 0 &&
        dataTable({
          caption: M.partsTitle,
          columns: [{ key: 'token', label: M.partsCols.token }, { key: 'count', label: M.partsCols.count, num: true }, { key: 'weight', label: M.partsCols.weight, num: true }],
          rows: parts.map((x) => ({ class: rowClass(x), cells: { token: x.token, count: F.int(x.count), weight: x.known ? F.num(x.weight, 2) : M.unknown } })),
        }),
    );
  };
  field.addEventListener('input', () => {
    state.message = field.value.slice(0, 2000);
    update();
  });
  update();
  return [
    title('hw7-spam', 1, text.sections.spam),
    paras(M.intro),
    h('p', null, M.source(hw.SMS_DATA), ' ', link(hw.SMS_DATA.url, M.links.dataset), ' · ', link(hw.SMS_DATA.paperUrl, M.links.paper)),
    paras(M.paras(sms)),
    dataTable({
      caption: M.matrixTitle,
      columns: [{ key: 'truth', label: M.matrixCols.truth }, { key: 'spam', label: M.matrixCols.spam, num: true }, { key: 'ham', label: M.matrixCols.ham, num: true }],
      rows: [
        { cells: { truth: M.matrixRows.spam, spam: F.int(c.tp), ham: F.int(c.fn) } },
        { cells: { truth: M.matrixRows.ham, spam: F.int(c.fp), ham: F.int(c.tn) } },
      ],
    }),
    dataTable({
      caption: M.wordsTitle,
      columns: [{ key: 'spam', label: M.wordsCols.spam }, { key: 'spamWeight', label: M.wordsCols.spamWeight, num: true }, { key: 'ham', label: M.wordsCols.ham }, { key: 'hamWeight', label: M.wordsCols.hamWeight, num: true }],
      rows: words.map((i) => ({ cells: { spam: sms.spamWords[i].token, spamWeight: F.num(sms.spamWords[i].weight, 2), ham: sms.hamWords[i].token, hamWeight: F.num(sms.hamWords[i].weight, 2) } })),
    }),
    cutControls,
    h('div', { class: 'charts' }, cutFig),
    cutLine,
    dataTable({
      id: view.LINKED_TABLES.logOdds,
      caption: M.tableTitle,
      columns: [{ key: 'bin', label: M.binCols.bin }, { key: 'spam', label: M.binCols.spam, num: true, part: part(items, 0) }, { key: 'ham', label: M.binCols.ham, num: true, part: part(items, 1) }],
      rows: sms.bins.map((b) => ({ cells: { bin: M.bin(b), spam: F.int(b.spam), ham: F.int(b.ham) } })),
    }),
    h('div', { class: 'field' }, h('label', { for: 'hw7-message', text: M.fieldLabel }), field),
    choices(M.baseLabel, view.SPAM_BASES.map((k) => [k, M.bases[k]]), state.base, (k) => {
      state.base = k;
      update();
    }),
    scoreRegion,
    h('p', { text: M.after }),
  ];
}

function kddBlock() {
  const K = text.kdd;
  const F = text.fmt;
  const { kdd } = getModels();
  const link = (href, label) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', text: label });
  const explainRegion = h('div');
  const update = () => {
    const e = kdd.explain(state.kdd.protocol, state.kdd.service, state.kdd.flag);
    fill(
      explainRegion,
      dataTable({
        columns: [
          { key: 'feature', label: K.partsCols.feature },
          { key: 'value', label: K.partsCols.value },
          { key: 'attacks', label: K.partsCols.attacks, num: true },
          { key: 'normals', label: K.partsCols.normals, num: true },
          { key: 'weight', label: K.partsCols.weight, num: true },
        ],
        rows: e.parts.map((x) => ({ cells: { feature: K.features[x.feature], value: x.value, attacks: F.int(x.attacks), normals: F.int(x.normals), weight: F.num(x.weight, 2) } })),
      }),
      resultLine(K.result(e)),
    );
  };
  update();
  return [
    title('hw7-kdd', 1, text.sections.kdd),
    h('p', null, K.intro(hw.KDD_DATA), ' ', link(hw.KDD_DATA.url, 'NSL-KDD'), ' · ', link(hw.KDD_DATA.paperUrl, 'Tavallaee et al., 2009')),
    paras(K.paras(kdd)),
    dataTable({
      caption: K.tableTitle,
      columns: [
        { key: 'model', label: K.cols.model },
        { key: 'accuracy', label: K.cols.accuracy, num: true },
        { key: 'precision', label: K.cols.precision, num: true },
        { key: 'recall', label: K.cols.recall, num: true },
        { key: 'fpr', label: K.cols.fpr, num: true },
      ],
      rows: ['naive', 'joint', 'majority'].map((m) => ({ cells: { model: K.models[m], accuracy: F.pct(kdd[m].accuracy), precision: F.pct(kdd[m].precision), recall: F.pct(kdd[m].recall), fpr: F.pct(kdd[m].fpr) } })),
    }),
    subtitle(K.chooseTitle),
    h(
      'div',
      { class: 'selects' },
      hw.KDD_FEATURES.map((f) => h(
        'label',
        null,
        K.labels[f],
        h(
          'select',
          {
            onchange: (ev) => {
              state.kdd[f] = Number(ev.target.value);
              update();
            },
          },
          hw.KDD_LEVELS[f].map((v, i) => h('option', { value: i, selected: i === state.kdd[f], text: v })),
        ),
      )),
    ),
    explainRegion,
  ];
}

function limitsBlock() {
  const L = text.limits;
  const rows = hw.priorSensitivity();
  return [
    title('hw7-limits', 1, text.sections.limits),
    h('p', { text: L.intro }),
    dataTable({
      caption: L.tableTitle(hw.DECISION_LEVEL),
      columns: [{ key: 'prior', label: L.cols.prior }, { key: 'day1', label: L.cols.day1, num: true }, { key: 'days3', label: L.cols.days3, num: true }, { key: 'days10', label: L.cols.days10, num: true }],
      rows: hw.PRIOR_KEYS.map((k) => ({ cells: { prior: text.tryBelief.priors[k], day1: L.cell(rows[0].priors[k]), days3: L.cell(rows[1].priors[k]), days10: L.cell(rows[2].priors[k]) } })),
    }),
    paras(L.paras(rows)),
  ];
}

function bvmBlock() {
  const B = text.bvm;
  const F = text.fmt;
  const items = view.legends.bvm(text.legends);
  return [
    title('hw7-bvm', 1, text.sections.bvm),
    whenComputed((s) => {
      if (!s) return pending();
      // another true rate or sample takes a few milliseconds; the first one comes from the computation of the page
      const model = sectionModel('bvm', 'bvm');
      const rowsOf = (m) => (view.atStart('bvm', m.params) ? s.bvm : hw.bvmFacts(m.params.seed, { rate: m.params.rate }));
      const moveHandle = (id, v) => model.setParams(view.handles.trueRateMove(model.get().params, id, v));
      const first = rowsOf(model.get());
      const meansFig = figure(B.chartTitle, hw.drawLineChart, view.bvmChart(first, F.decimal), { items, link: view.links.bvm, table: view.LINKED_TABLES.bvm, keep: keep('bvm'), handles: { items: view.handles.trueRate(model.get().params.rate, text.controls), onChange: moveHandle } });
      const distanceFig = figure(B.chart2Title, hw.drawLineChart, view.bvmDistanceChart(first, F.decimal), { items: view.legends.bvmDistance(text.legends), link: view.links.bvmDistance, keep: keep('bvmDistance') });
      const tableRegion = h('div');
      follow(model, (m) => {
        const rows = rowsOf(m);
        const means = view.bvmChart(rows, F.decimal);
        const distances = view.bvmDistanceChart(rows, F.decimal);
        meansFig.kit.setData(means);
        meansFig.kit.setTip(view.tips.bvm(rows, text.tips));
        meansFig.kit.setAnimation(view.reveal(means));
        meansFig.kit.setHandles({ items: view.handles.trueRate(m.params.rate, text.controls), onChange: moveHandle });
        distanceFig.kit.setData(distances);
        distanceFig.kit.setTip(view.tips.bvmDistance(rows, text.tips));
        distanceFig.kit.setAnimation(view.reveal(distances));
        fill(
          tableRegion,
          dataTable({
            id: view.LINKED_TABLES.bvm,
            caption: B.tableTitle,
            columns: [
              { key: 'n', label: B.cols.n },
              { key: 'clicks', label: B.cols.clicks, num: true },
              { key: 'uniform', label: B.cols.uniform, num: true, part: part(items, 0) },
              { key: 'wrong', label: B.cols.wrong, num: true, part: part(items, 1) },
              { key: 'dUniform', label: B.cols.dUniform, num: true },
              { key: 'dWrong', label: B.cols.dWrong, num: true },
            ],
            rows: rows.map((r) => ({ cells: { n: F.int(r.n), clicks: F.int(r.clicks), uniform: B.pair(r.uniform), wrong: B.pair(r.wrong), dUniform: F.num(r.uniform.distance, 4), dWrong: F.num(r.wrong.distance, 4) } })),
          }),
        );
        hideParts(tableRegion.querySelector('table'), partsOf(items, keep('bvm')));
      });
      return [paras(B.paras(s.bvm)), kit.modelControls(model, view.controls.bvm(text.controls), state.lang), h('div', { class: 'charts' }, meansFig, distanceFig), tableRegion];
    }),
  ];
}

function bayesSection() {
  return h(
    'section',
    { class: 'section' },
    title('hw7-bayes', 0, text.sections.bayes),
    paras(text.bayes.intro),
    conditionalBlock(),
    tryPvalueBox(),
    engineBlock(),
    alarmBlock(),
    tryAlarmBox(),
    networkBlock(),
    tryNetworkBox(),
    sprtBlock(),
    trySprtBox(),
    rateBlock(),
    tryBeliefBox(),
    tryPriorBox(),
    frequentistBlock(),
    spamBlock(),
    kddBlock(),
    limitsBlock(),
    bvmBlock(),
  );
}

// ---------------------------------------------------------------------------
// 3. Le verifiche, 4. il riepilogo dei test, 5. il contesto storico, 6. le conclusioni
// ---------------------------------------------------------------------------

/** A table of the discussion: column headers, then rows of cells, each { text | node, class?, head? } (head: a row header, th). */
function table(className, headers, rows) {
  return h(
    'table',
    { class: `table ${className}` },
    h('thead', null, h('tr', null, headers.map((x) => h('th', { scope: 'col', text: x })))),
    h(
      'tbody',
      null,
      rows.map((row) => h(
        'tr',
        { class: row.class || null },
        row.cells.map((cell, i) => h(cell.head ? 'th' : 'td', { scope: cell.head ? 'row' : null, 'data-label': cell.head ? null : headers[i], class: cell.class || null }, cell.node || cell.text)),
      )),
    ),
  );
}

function checksSection() {
  regions.checks = h('div');
  return h('section', { class: 'section' }, title('hw7-checks', 0, text.sections.checks), regions.checks);
}

function updateVerify() {
  const V = text.checks;
  if (!checkRows) {
    fill(regions.checks, h('p', { text: V.intro }), h('p', { class: 'note pending', role: 'status', text: text.ui.computing }));
    return;
  }
  const done = checkRows.filter((r) => r.ok !== null);
  const ok = done.filter((r) => r.ok).length;
  const resultCell = (r) => {
    if (r.ok === null) return { text: V.pending };
    return { class: r.ok ? 'is-ok' : 'is-bad', node: h('span', { 'aria-label': r.ok ? V.ok : V.failed, text: r.ok ? '✓' : '✗' }) };
  };
  fill(
    regions.checks,
    h('p', { text: V.intro }),
    done.length < checkRows.length
      ? h('p', { class: 'note pending', role: 'status', text: `${V.summary(ok, done.length)}; ${checkRows.length - done.length} ${V.pending}` })
      : check(ok === checkRows.length, V.summary(ok, checkRows.length)),
    h(
      'details',
      { class: 'details' },
      h('summary', { text: V.details(checkRows.length) }),
      hw.CHECK_GROUPS.map((group) => [
        subtitle(V.groups[group]),
        table(
          'discussion',
          [V.cols.check, V.cols.expected, V.cols.actual, V.cols.result],
          checkRows
            .filter((r) => r.group === group)
            .map((r) => ({ cells: [{ head: true, text: r.name }, { node: h('code', { text: r.expected }) }, { node: h('code', { text: r.ok === null ? '-' : r.actual }) }, resultCell(r)] })),
        ),
      ]),
    ),
  );
}

/** The checks: those of the simulations wait for their results, computed with the seed of the page. */
function runChecks() {
  const s = computation.shown;
  try {
    checkRows = hw.verifyAll(s && s.params.seed === hw.DEFAULT_SEED ? s : null);
  } catch (error) {
    checkRows = [{ group: 'generator', name: text.ui.error(message(error)), expected: '', actual: '', ok: false }];
  }
  updateVerify();
}

function testsSection() {
  regions.tests = h('div');
  return h('section', { class: 'section far' }, title('hw7-tests', 0, text.sections.tests), regions.tests);
}

function updateTests() {
  const T = text.tests;
  const { sms, kdd } = getModels();
  const headers = [T.cols.subject, T.cols.hypothesis, T.cols.statistic, T.cols.p, T.cols.verdict, T.cols.expected];
  fill(
    regions.tests,
    h('p', { text: T.intro }),
    computation.error ? h('p', { class: 'note', text: text.ui.error(computation.error) }) : null,
    table(
      'discussion summary summary-tests',
      headers,
      view.testRows(computation.shown, sms, kdd).map((r) => {
        const c = view.testCells(r, text);
        return { class: c.rejected ? 'is-rejected' : null, cells: [{ head: true, text: c.subject }, { text: c.hypothesis }, { text: c.statistic }, { text: c.p }, { text: c.verdict }, { text: c.expected }] };
      }),
    ),
  );
}

function historySection() {
  const H = text.history;
  return h(
    'section',
    { class: 'section far' },
    title('hw7-history', 0, text.sections.history),
    h('p', { text: H.intro }),
    h('ol', { class: 'timeline' }, H.items.map((e) => h('li', { class: 'is-context' }, h('span', { class: 'year', text: e.year }), h('div', null, h('strong', { text: e.title }), h('p', { text: e.text }))))),
    h('p', { text: H.after }),
  );
}

function conclusionSection() {
  const { sms, kdd } = getModels();
  const c = view.campaignFacts();
  const pv = hw.pvalueFacts();
  const facts = {
    alarm: hw.alarmFacts(hw.ALARM_DEFAULT).posterior,
    rate: c.uniform[c.uniform.length - 1],
    sms: sms.matrix.accuracy,
    kdd: kdd.naive.accuracy,
    half: hw.sampleSizeFor(0.005),
    burstFactor: hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.5).factor,
    pValue: pv.pValue,
    posteriorH0: pv.posteriorH0,
  };
  return h('section', { class: 'section far' }, title('hw7-conclusion', 0, text.sections.conclusion), paras(text.conclusion.paras(facts)));
}

// ---------------------------------------------------------------------------
// Le simulazioni lunghe, a fette di pochi millisecondi
// ---------------------------------------------------------------------------

function startComputation() {
  hw.runStepsAsync(() => hw.exploreSteps(view.DEFAULT_PARAMS)).then(
    (value) => {
      computation.shown = value;
      computation.error = null;
      updateComputed();
      runChecks();
      updateTests();
    },
    (error) => {
      computation.error = message(error);
      updateComputed();
      updateVerify();
      updateTests();
    },
  );
}

// ---------------------------------------------------------------------------
// Indice, lingua e avvio
// ---------------------------------------------------------------------------

const dialog = document.getElementById('index-dialog');
const FOLLOW_MS = 2500;

// Porta il titolo in cima e lo segue per un paio di secondi: se nel
// frattempo qualcosa sopra cambia altezza (un grafico che arriva), lo
// scorrimento riparte verso la nuova posizione. Se l'utente scorre da se',
// si smette subito di inseguire.
function scrollToSection(target) {
  const behavior = reducedMotion() ? 'auto' : 'smooth';
  const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  const started = performance.now();
  let stopped = false;
  let lastTop = target.getBoundingClientRect().top + window.scrollY;
  const stop = () => {
    stopped = true;
    userEvents.forEach((type) => window.removeEventListener(type, stop));
  };
  userEvents.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  target.scrollIntoView({ behavior, block: 'start' });
  const follow = () => {
    if (stopped) return;
    if (performance.now() - started > FOLLOW_MS) {
      stop();
      return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(top - lastTop) > 1) {
      lastTop = top;
      target.scrollIntoView({ behavior, block: 'start' });
    }
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

function closeIndex() {
  document.documentElement.classList.remove('index-open');
  if (dialog.open) dialog.close();
}

function goTo(id) {
  closeIndex();
  const target = document.getElementById(id);
  if (!target) return;
  target.focus({ preventScroll: true });
  scrollToSection(target);
  target.classList.remove('flash');
  void target.offsetWidth;
  target.classList.add('flash');
  target.addEventListener('animationend', () => target.classList.remove('flash'), { once: true });
}

// In cima alla pagina, con il focus sul titolo: chi usa la tastiera riparte
// da li', non dal pulsante in fondo
function backToTop() {
  window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  document.getElementById('page-title').focus({ preventScroll: true });
}

const toTopButton = () => h('p', { class: 'to-top' }, h('button', { type: 'button', class: 'btn alt', text: text.ui.backToTop, onclick: backToTop }));

function renderChrome() {
  const t = text;
  document.documentElement.lang = state.lang;
  document.title = 'Homework #7 - Statistics';
  document.getElementById('subtitle').textContent = t.standalone.subtitle;
  document.getElementById('course').textContent = t.standalone.course;
  document.getElementById('open-index').textContent = t.ui.index;
  document.getElementById('index-title').textContent = t.ui.indexTitle;
  document.querySelector('.index-close').setAttribute('aria-label', t.ui.close);
  document.getElementById('language').setAttribute('aria-label', t.ui.language);
  document.getElementById('online-label').textContent = t.standalone.online;
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === state.lang));
  }
  document.getElementById('index-list').replaceChildren(
    ...view.tocEntries(t.sections).map((entry) => h('li', { class: `level-${entry.level}` }, h('button', { type: 'button', text: entry.title, onclick: () => goTo(entry.id) }))),
  );
}

function render() {
  text = HW7_TEXTS[state.lang];
  renderChrome();
  sectionModels.forEach((model) => model.destroy());
  sectionModels = [];
  waiting = [];
  const app = document.getElementById('app');
  fill(app, assignmentSection(), convergenceSection(), bayesSection(), checksSection(), testsSection(), historySection(), conclusionSection(), toTopButton());
  updateVerify();
  updateTests();
}

function boot() {
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.addEventListener('click', () => {
      if (button.dataset.lang === state.lang) return;
      state.lang = LANGUAGES.includes(button.dataset.lang) ? button.dataset.lang : 'en';
      render();
    });
  }
  document.getElementById('open-index').addEventListener('click', () => {
    document.documentElement.classList.add('index-open');
    dialog.showModal();
  });
  document.querySelector('.index-close').addEventListener('click', closeIndex);
  dialog.addEventListener('close', () => document.documentElement.classList.remove('index-open'));
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeIndex();
  });
  // i colori dei grafici, dei disegni e delle legende seguono il tema del sistema
  darkQuery.addEventListener('change', render);
  render();
  // le verifiche e le simulazioni partono dopo il primo disegno della pagina
  setTimeout(() => {
    runChecks();
    startComputation();
  }, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
})();
