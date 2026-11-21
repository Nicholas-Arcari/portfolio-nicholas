// src/pages/statistics/chartkit/ChartFigure.jsx
// L'adattatore React del kit dei grafici interattivi (solo per il sito; il
// programma scaricabile usa kitDom.js). Ha le props del vecchio Figure delle
// pagine (title, draw, data, palette, tip, wide, legend, note, link, hidden,
// onToggle), piu' `lib` (la libreria dell'homework, che sa disegnare e
// misurare i suoi grafici), `schedule` (la coda dei primi disegni) e `spec`
// (un grafico con i suoi comandi, kitSpec.js): con spec i dati li calcola
// spec.model dai parametri, e compaiono comandi, maniglie e animazione.
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
import { applyControl, framesOf, handlesOf, initialParams, sliderIndex } from './kitSpec';

const HINT_MS = 2200;

/** The controls of a spec: sliders, choices, toggles and actions, with the classes of the pages. */
const ChartControls = ({ id, controls, params, onChange }) => {
  const actions = controls.filter((c) => c.kind === 'action');
  return (
    <div className="kit-controls">
      {controls.map((c, i) => {
        if (c.kind === 'slider') {
          const index = sliderIndex(c, params);
          const label = c.label(c.values[index]);
          return (
            <div key={c.key} className="hw3-slider">
              <label htmlFor={`${id}-${c.key}`}>{label}</label>
              <input id={`${id}-${c.key}`} type="range" min={0} max={c.values.length - 1} step={1} value={index} aria-valuetext={label} onChange={(e) => onChange(applyControl(c, params, Number(e.target.value)))} />
            </div>
          );
        }
        if (c.kind === 'choice') {
          return (
            <div key={c.key} className="hw3-choices" role="group" aria-label={c.label}>
              <span className="hw3-choices-label">{c.label}</span>
              {c.options.map(([value, name]) => (
                <button key={String(value)} type="button" className="button alt" aria-pressed={params[c.key] === value} onClick={() => onChange(applyControl(c, params, value))}>{name}</button>
              ))}
            </div>
          );
        }
        if (c.kind === 'toggle') {
          return (
            <label key={c.key} className="kit-toggle">
              <input type="checkbox" checked={!!params[c.key]} onChange={(e) => onChange(applyControl(c, params, e.target.checked))} />
              {` ${c.label}`}
            </label>
          );
        }
        return i === controls.indexOf(actions[0]) ? (
          <p key="actions" className="kit-actions">
            {actions.map((a) => <button key={a.label} type="button" className="button alt small" onClick={() => onChange(applyControl(a, params))}>{a.label}</button>)}
          </p>
        ) : null;
      })}
    </div>
  );
};

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

export const ChartFigure = ({ title, draw, data: given = null, spec = null, palette, tip = null, wide = false, legend = null, note = null, link = null, hidden: shared = null, onToggle = null, lib, schedule = null }) => {
  const { language } = useLanguage();
  const labels = kitLabels(language);
  const id = useId();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const handlesRef = useRef(null);
  const [own, toggleOwn] = useHidden();
  const hidden = shared || own;
  const off = hiddenParts(legend, hidden).join(' ');
  const [zoom, setZoom] = useState({ can: false, zoomed: false });
  const [hint, setHint] = useState(false);

  // a chart with its controls: the parameters, and the step of the animation
  const [params, setParams] = useState(() => (spec ? initialParams(spec) : null));
  const frames = spec ? framesOf(spec, params) : 1;
  const [t, setT] = useState(frames - 1);
  const [playing, setPlaying] = useState({ t: frames - 1, frames, playing: false, speed: 1 });
  // the player of the animation, made once: it starts on the last step, where the chart is complete
  const [player] = useState(() => (spec && spec.animation ? createPlayer({ frames, ms: spec.animation.ms || 60, onFrame: setT, onChange: setPlaying }) : null));
  useEffect(() => () => player && player.destroy(), [player]);
  const step = Math.min(t, frames - 1);
  const data = useMemo(() => (spec ? spec.model(params, step) : given), [spec, params, step, given]);
  const describe = useMemo(() => (spec && spec.tip ? spec.tip(data) : tip), [spec, data, tip]);

  // the controller, once per canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const plugins = [];
    if (spec && spec.handles) {
      handlesRef.current = handlesPlugin({ onChange: (key, value) => setParams((p) => spec.onHandle(p, key, value)) });
      plugins.push(handlesRef.current);
    }
    plugins.push(zoomPan());
    const parts = off ? off.split(' ') : [];
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
      describe: describe ? (hit, hiddenNow) => describe(hit, hiddenNow) : null,
      link,
      hidden: parts,
      plugins,
      schedule,
    });
    chartRef.current = chart;
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
    // the controller is made once per chart: the effects below give it every new value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw, lib, schedule, spec]);

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
    if (chartRef.current) chartRef.current.setDescribe(describe ? (hit, hiddenNow) => describe(hit, hiddenNow) : null);
  }, [describe]);
  useEffect(() => {
    if (chartRef.current) chartRef.current.setLink(link);
  }, [link]);
  useEffect(() => {
    if (handlesRef.current && spec) handlesRef.current.setSpecs(handlesOf(spec, params));
  }, [spec, params, data]);
  useEffect(() => {
    if (player) player.setFrames(frames);
  }, [player, frames]);

  const tool = (fn) => () => {
    if (chartRef.current) fn(chartRef.current);
  };
  return (
    <figure className={wide ? 'hw1-figure hw1-figure-wide kit-figure' : 'hw1-figure kit-figure'}>
      {spec && spec.controls && spec.controls.length > 0 && <ChartControls id={id} controls={spec.controls} params={params} onChange={setParams} />}
      <div className="kit-stage">
        <div className="kit-plot">
          <canvas ref={canvasRef} className="hw1-canvas" role="img" aria-label={title} />
        </div>
        {zoom.can && (
          <div className={zoom.zoomed ? 'kit-tools is-zoomed' : 'kit-tools'} role="group" aria-label={labels.tools}>
            <button type="button" onClick={tool((c) => c.zoomBy(1.5))} aria-label={labels.zoomIn} title={labels.zoomIn}>+</button>
            <button type="button" onClick={tool((c) => c.zoomBy(1 / 1.5))} aria-label={labels.zoomOut} title={labels.zoomOut} disabled={!zoom.zoomed}>-</button>
            <button type="button" onClick={tool((c) => c.resetView())} aria-label={labels.reset} title={labels.reset} disabled={!zoom.zoomed}>⤢</button>
          </div>
        )}
        {hint && <p className="kit-hint" aria-live="polite">{labels.hint}</p>}
      </div>
      {player && <ChartPlayer id={id} state={playing} player={player} labels={labels} />}
      {legend && <ChartLegend items={legend} palette={palette} hidden={hidden} onToggle={onToggle || toggleOwn} />}
      {note && <p className="hw3-figure-note">{note}</p>}
      <figcaption>{title}</figcaption>
    </figure>
  );
};

export default ChartFigure;
