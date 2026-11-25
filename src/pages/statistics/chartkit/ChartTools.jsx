// src/pages/statistics/chartkit/ChartTools.jsx
// I comandi dello zoom (ingrandisci, riduci, vista intera) e il suggerimento
// sulla rotella, per una tela che si disegna da sola (kitSource.js) dentro
// un componente React: gli stessi del grafico del kit (ChartFigure.jsx).
// useChartTools() da' attach(chart), da chiamare nell'effetto che crea il
// grafico (restituisce la funzione che lo stacca), e tools, da mettere nel
// riquadro kit-stage accanto al kit-plot.
import React, { useCallback, useRef, useState } from 'react';
import { useLanguage } from '../../../contexts/languageContext';
import { kitLabels } from './kitLabels';

const HINT_MS = 2200;

export function useChartTools() {
  const { language } = useLanguage();
  const labels = kitLabels(language);
  const chartRef = useRef(null);
  const [zoom, setZoom] = useState({ can: false, zoomed: false });
  const [hint, setHint] = useState(false);

  const attach = useCallback((chart) => {
    chartRef.current = chart;
    let timer = 0;
    const offs = [
      chart.on('render', ({ frame }) => setZoom((z) => (z.can === !!frame ? z : { ...z, can: !!frame }))),
      chart.on('view', () => setZoom((z) => ({ ...z, zoomed: chart.isZoomed() }))),
      chart.on('hint', () => {
        setHint(true);
        clearTimeout(timer);
        timer = setTimeout(() => setHint(false), HINT_MS);
      }),
    ];
    return () => {
      clearTimeout(timer);
      offs.forEach((off) => off());
      chartRef.current = null;
    };
  }, []);

  const tool = (fn) => () => {
    if (chartRef.current) fn(chartRef.current);
  };
  const tools = (
    <>
      {zoom.can && (
        <div className={zoom.zoomed ? 'kit-tools is-zoomed' : 'kit-tools'} role="group" aria-label={labels.tools}>
          <button type="button" onClick={tool((c) => c.zoomBy(1.5))} aria-label={labels.zoomIn} title={labels.zoomIn}>+</button>
          <button type="button" onClick={tool((c) => c.zoomBy(1 / 1.5))} aria-label={labels.zoomOut} title={labels.zoomOut} disabled={!zoom.zoomed}>-</button>
          <button type="button" onClick={tool((c) => c.resetView())} aria-label={labels.reset} title={labels.reset} disabled={!zoom.zoomed}>⤢</button>
        </div>
      )}
      {hint && <p className="kit-hint" aria-live="polite">{labels.hint}</p>}
    </>
  );
  return { attach, tools };
}
