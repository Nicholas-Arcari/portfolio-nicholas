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
export function toPixel(axis, v, p0, p1) {
  const lo = fwd(axis, axis.min);
  const hi = fwd(axis, axis.max);
  return p0 + ((fwd(axis, v) - lo) / (hi - lo)) * (p1 - p0);
}

/** The value of the pixel p on an axis drawn from p0 (its min) to p1 (its max). */
export function toValue(axis, p, p0, p1) {
  const lo = fwd(axis, axis.min);
  const hi = fwd(axis, axis.max);
  return back(axis, lo + ((p - p0) / (p1 - p0)) * (hi - lo));
}

/** Whether the point (x, y), in CSS pixels of the canvas, lies in the plot. */
export const inPlot = (frame, x, y, slack = 0) => !!frame && x >= frame.plot.x - slack && x <= frame.plot.x + frame.plot.w + slack && y >= frame.plot.y - slack && y <= frame.plot.y + frame.plot.h + slack;

/** The values under the point (x, y): { x, y }, with null on an axis without values (categories). */
export function valueAt(frame, x, y) {
  const { plot } = frame;
  return {
    x: frame.x ? toValue(frame.x, x, plot.x, plot.x + plot.w) : null,
    y: toValue(frame.y, y, plot.y + plot.h, plot.y),
  };
}

/** The pixels of the values { x, y } (either may be null). */
export function pixelAt(frame, x, y) {
  const { plot } = frame;
  return {
    x: x === null || !frame.x ? null : toPixel(frame.x, x, plot.x, plot.x + plot.w),
    y: y === null ? null : toPixel(frame.y, y, plot.y + plot.h, plot.y),
  };
}

/** The whole extent of the data of a frame drawn without a view: the limits zoom and panning stay within. */
export const fullView = (frame) => ({ x: frame.x ? [frame.x.min, frame.x.max] : null, y: [frame.y.min, frame.y.max] });

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
export function clampView(view, frameAxes, full) {
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
export function zoomView(view, frame, full, px, py, k) {
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
export function panView(view, frame, full, dx, dy) {
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
export function boxView(view, frame, full, x0, y0, x1, y1) {
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
export const isZoomed = (view) => !!view && (!!view.x || !!view.y);
