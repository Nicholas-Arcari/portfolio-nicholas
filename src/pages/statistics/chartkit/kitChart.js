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
import { attachGestures } from './kitGestures.js';
import { clampView, fullView, isZoomed, zoomView } from './kitView.js';

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
export function createChart(canvas, deps) {
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
  // the cursor is the kit's only when a plugin asked for one: a canvas that sets its own (a point to grab) keeps it
  let cursorSet = false;
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
      if (cursor || cursorSet) api.setCursor(cursor);
      cursorSet = !!cursor;
    },
    leave() {
      for (const plugin of plugins) if (plugin.leave) plugin.leave();
      if (cursorSet) api.setCursor('');
      cursorSet = false;
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
