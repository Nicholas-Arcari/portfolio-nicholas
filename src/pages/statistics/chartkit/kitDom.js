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
import { createChart } from './kitChart.js';
import { kitLabels } from './kitLabels.js';
import { createPlayer } from './kitPlayer.js';
import { handles as handlesPlugin, zoomPan } from './kitPlugins.js';
import { applyControl, createModel as makeModel, sliderIndex } from './kitSpec.js';

const HINT_MS = 2200;

/** The model of a section with controls (kitSpec.createModel), for the programs. */
export const createModel = makeModel;
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
export const partsOf = (items, hidden) => items.flatMap((item, i) => (hidden.has(i) ? item.parts || [] : []));

/** Hides the cells, columns and rows of a table that belong to hidden parts (data-part), and shows the others. */
export function hideParts(table, parts) {
  if (!table) return;
  for (const node of table.querySelectorAll('[data-part]')) node.hidden = parts.includes(node.dataset.part);
}

/**
 * The legend of a chart: { label, color? | paletteKey?, dashed?, box?,
 * parts }. Every item is a button: pressed its parts are on screen,
 * released they are hidden; onChange(parts) receives the hidden parts.
 * `hidden`, the set of the hidden items, outlives the legend.
 */
export function legend(items, onChange, hidden, palette) {
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
export function controlsOf(controls, getParams, onChange, pendingLabel = '') {
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
export function modelControls(model, controls, lang = 'en') {
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
 *   table (the id of the linked table: the legend hides its parts too), note, wide
 *   animation ({ frames, at(t) -> data, ms }: the chart step by step, with the player)
 *   handles ({ items, onChange(id, value) }: the lines to drag), pending (a simulation is running)
 * Returns the <figure>, with figure.kit = { chart, setData, setTip, setLabel,
 * setHidden, setAnimation, setHandles, setPending, destroy }.
 */
export function createFigure(options) {
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
    note && el('p', { class: 'figure-note', text: note }),
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
export function releaseFigures(region) {
  for (const figure of region.querySelectorAll('figure.kit-figure')) if (figure.kit) figure.kit.destroy();
  for (const box of region.querySelectorAll('.kit-controls')) if (box.kitRelease) box.kitRelease();
}
