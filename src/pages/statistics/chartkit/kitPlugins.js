// src/pages/statistics/chartkit/kitPlugins.js
// Le interazioni di un grafico (kitChart.js), una per plugin. Un plugin e'
// un oggetto con i soli metodi che gli servono (Interface Segregation):
//   install(chart), uninstall()
//   hover(p) -> cursore o '', leave()
//   pointerDown(p) -> true per tenere il gesto, pointerMove(p, start), pointerUp(p, start)
//   doubleClick(p), wheel(p, { deltaY, ctrl }), pinch({ x, y, scale, dx, dy }), key(event) -> true se usati
//   overlay(ctx, frame, palette): i suoi segni sulla tela trasparente sopra il grafico
// Un'interazione nuova e' un plugin nuovo: il controllore non cambia.
import { boxView, inPlot, panView, pixelAt, valueAt, zoomView } from './kitView.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Zoom and panning: ctrl (or cmd) + wheel and two fingers zoom about the
 * pointer; a drag selects the rectangle to enlarge, or moves the view once
 * it is enlarged (with shift it always selects); a double click and the
 * keys 0 or Escape go back to the whole chart; + and - zoom, the arrows
 * move. A plain wheel scrolls the page, and the chart says (event 'hint')
 * how to zoom instead.
 */
export function zoomPan() {
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
export function handles({ onChange, onEnd = null }) {
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
    if (spec.values && spec.values.length) return spec.values.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
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
