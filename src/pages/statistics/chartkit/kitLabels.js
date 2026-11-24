// src/pages/statistics/chartkit/kitLabels.js
// I testi dei comandi dei grafici interattivi, uguali in ogni homework: lo
// zoom, il suggerimento, il lettore delle animazioni.

export const KIT_LABELS = Object.freeze({
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
export const kitLabels = (lang) => KIT_LABELS[lang] || KIT_LABELS.en;
