// src/pages/statistics/chartkit/ChartFigure.jsx
// L'adattatore React del kit dei grafici interattivi (solo per il sito; il
// programma scaricabile usa kitDom.js). Ha le props del vecchio Figure delle
// pagine (title, draw, data, palette, tip, wide, legend, note, link, hidden,
// onToggle), piu':
//   lib        la libreria dell'homework, che sa disegnare e misurare i suoi grafici
//   schedule   la coda dei primi disegni
//   animation  { frames, at(t) -> data, ms }: il grafico passo per passo, con il lettore
//   handles    { items: [{ id, axis, value, ... }], onChange(id, value) }: le linee da trascinare
//   pending    una simulazione e' in corso: il grafico mostra ancora i dati di prima
//   off        le parti nascoste da una legenda fuori dal grafico (una legenda per un gruppo di grafici)
// I parametri non stanno qui ma nel modello della sezione (useModel), che li
// condivide con le tabelle.
//
// Il canvas sta in un riquadro suo (kit-plot), dove il kit aggiunge da se'
// la tela trasparente e l'etichetta: React non tocca quei nodi. Zoom,
// suggerimento e lettore sono fratelli del riquadro, gestiti da React.
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../../contexts/languageContext';
import { ChartLegend } from '../ChartLegend';
import { hiddenParts, useHidden } from '../legendState';
import { createChart } from './kitChart';
import { kitLabels } from './kitLabels';
import { createPlayer } from './kitPlayer';
import { handles as handlesPlugin, zoomPan } from './kitPlugins';

const HINT_MS = 2200;

/** The player of an animation: back, play or pause, forward, the position and the speed. */
const ChartPlayer = ({ id, state, player, labels }) => (
  <div className="kit-player" role="group" aria-label={labels.player}>
    <button type="button" className="button alt small" onClick={() => player.step(-1)} aria-label={labels.back} title={labels.back} disabled={state.t <= 0}>‹</button>
    <button type="button" className="button small kit-play" onClick={() => player.toggle()} aria-pressed={state.playing}>{state.playing ? labels.pause : labels.play}</button>
    <button type="button" className="button alt small" onClick={() => player.step(1)} aria-label={labels.forward} title={labels.forward} disabled={state.t >= state.frames - 1}>›</button>
    <input id={`${id}-t`} className="kit-position" type="range" min={0} max={state.frames - 1} step={1} value={state.t} aria-label={labels.position(state.t + 1, state.frames)} aria-valuetext={labels.position(state.t + 1, state.frames)} onChange={(e) => player.seek(Number(e.target.value))} />
    <span className="kit-step" aria-hidden="true">{labels.position(state.t + 1, state.frames)}</span>
    <span className="kit-speed" role="group" aria-label={labels.speed}>
      {[1, 2, 4].map((s) => (
        <button key={s} type="button" className="button alt small" aria-pressed={state.speed === s} onClick={() => player.setSpeed(s)}>{`×${s}`}</button>
      ))}
    </span>
  </div>
);

export const ChartFigure = ({ title, draw, data: given, palette, tip = null, wide = false, legend = null, note = null, link = null, hidden: shared = null, onToggle = null, lib, schedule = null, animation = null, handles = null, pending = false, off: offGiven = null }) => {
  const { language } = useLanguage();
  const labels = kitLabels(language);
  const id = useId();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const handlesRef = useRef(null);
  const handlesChange = useRef(null);
  const [own, toggleOwn] = useHidden();
  const hidden = shared || own;
  const off = (offGiven || hiddenParts(legend, hidden)).join(' ');
  const [zoom, setZoom] = useState({ can: false, zoomed: false });
  const [hint, setHint] = useState(false);

  // the animation: the step on screen, and the player made once (it starts on the last step, where the chart is complete)
  const frames = animation ? Math.max(1, animation.frames) : 1;
  const [t, setT] = useState(frames - 1);
  const [playing, setPlaying] = useState({ t: frames - 1, frames, playing: false, speed: 1 });
  const [player] = useState(() => (animation ? createPlayer({ frames, ms: animation.ms || 60, onFrame: setT, onChange: setPlaying }) : null));
  useEffect(() => () => player && player.destroy(), [player]);
  const stepMs = animation ? animation.ms || 60 : 60;
  useEffect(() => {
    if (player) player.setFrames(frames);
  }, [player, frames]);
  useEffect(() => {
    if (player) player.setMs(stepMs);
  }, [player, stepMs]);
  const step = Math.min(t, frames - 1);
  const data = useMemo(() => (animation && step < frames - 1 ? animation.at(step) : given), [animation, step, frames, given]);

  useEffect(() => {
    handlesChange.current = handles ? handles.onChange : null;
  }, [handles]);
  const hasHandles = !!handles;

  // the controller, once per canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const plugins = [];
    if (handles) {
      handlesRef.current = handlesPlugin({ onChange: (key, value) => handlesChange.current && handlesChange.current(key, value) });
      plugins.push(handlesRef.current);
    }
    plugins.push(zoomPan());
    const chart = createChart(canvas, {
      draw,
      data,
      palette,
      frame: lib.chartFrame,
      withView: lib.withView,
      height: lib.chartHeight,
      hitTest: lib.chartHitTest,
      hitAt: lib.chartHitAt,
      pointerLabel: lib.attachPointerLabel,
      describe: tip,
      link,
      hidden: off ? off.split(' ') : [],
      plugins,
      schedule,
    });
    chartRef.current = chart;
    if (handlesRef.current) handlesRef.current.setSpecs(handles.items);
    const offRender = chart.on('render', ({ frame }) => setZoom((z) => (z.can === !!frame ? z : { ...z, can: !!frame })));
    const offView = chart.on('view', () => setZoom((z) => ({ ...z, zoomed: chart.isZoomed() })));
    let hintTimer = 0;
    const offHint = chart.on('hint', () => {
      setHint(true);
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => setHint(false), HINT_MS);
    });
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[entries.length - 1].contentRect.width);
      if (width > 0) chart.resize(width);
    });
    observer.observe(canvas);
    return () => {
      clearTimeout(hintTimer);
      offRender();
      offView();
      offHint();
      observer.disconnect();
      chart.destroy();
      chartRef.current = null;
      handlesRef.current = null;
    };
    // the controller is made once per chart (and per kind of chart: with or without handles); the effects below give it every new value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw, lib, schedule, hasHandles]);

  useEffect(() => {
    if (chartRef.current) chartRef.current.setData(data);
  }, [data]);
  useEffect(() => {
    if (chartRef.current) chartRef.current.setPalette(palette);
  }, [palette]);
  useEffect(() => {
    if (chartRef.current) chartRef.current.setHidden(off ? off.split(' ') : []);
  }, [off]);
  useEffect(() => {
    if (chartRef.current) chartRef.current.setDescribe(tip);
  }, [tip]);
  useEffect(() => {
    if (chartRef.current) chartRef.current.setLink(link);
  }, [link]);
  useEffect(() => {
    if (handlesRef.current) handlesRef.current.setSpecs(handles ? handles.items : []);
  }, [handles]);

  const tool = (fn) => () => {
    if (chartRef.current) fn(chartRef.current);
  };
  return (
    <figure className={`${wide ? 'hw1-figure hw1-figure-wide' : 'hw1-figure'} kit-figure${pending ? ' is-pending' : ''}`}>
      <div className="kit-stage">
        <div className="kit-plot">
          <canvas ref={canvasRef} className="hw1-canvas" role="img" aria-label={title} aria-busy={pending || undefined} />
        </div>
        {zoom.can && (
          <div className={zoom.zoomed ? 'kit-tools is-zoomed' : 'kit-tools'} role="group" aria-label={labels.tools}>
            <button type="button" onClick={tool((c) => c.zoomBy(1.5))} aria-label={labels.zoomIn} title={labels.zoomIn}>+</button>
            <button type="button" onClick={tool((c) => c.zoomBy(1 / 1.5))} aria-label={labels.zoomOut} title={labels.zoomOut} disabled={!zoom.zoomed}>-</button>
            <button type="button" onClick={tool((c) => c.resetView())} aria-label={labels.reset} title={labels.reset} disabled={!zoom.zoomed}>⤢</button>
          </div>
        )}
        {hint && <p className="kit-hint" aria-live="polite">{labels.hint}</p>}
        {pending && <p className="kit-busy" role="status">{labels.pending}</p>}
      </div>
      {player && <ChartPlayer id={id} state={playing} player={player} labels={labels} />}
      {legend && <ChartLegend items={legend} palette={palette} hidden={hidden} onToggle={onToggle || toggleOwn} />}
      {note && <p className="hw3-figure-note">{note}</p>}
      <figcaption>{title}</figcaption>
    </figure>
  );
};

export default ChartFigure;
