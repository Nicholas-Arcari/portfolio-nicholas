// build/charts/homework.mjs
// Le schede degli homework per la prova dei grafici (build/check-charts.mjs).
// Una scheda dice dove sta l'homework (route del sito, nome dello zip), quando
// ha finito di caricarsi (anchors: uno di questi id c'e'), quanti grafici del
// kit ha, quanti con lo zoom (zoomable, se non tutti), quante animazioni del
// kit (players) e quante verifiche (checks); poi le prove sue, con il mouse
// (steps, i tipi sono in scenarios.mjs; le linee da trascinare si provano
// anche con un dito) e i canvas che disegnano da se' (sources), con le classi
// che hanno nel sito e nello zip. Un homework nuovo e' una scheda in piu'.
//
// Le sezioni sono gli id dei titoli delle pagine, uguali nel sito e nello zip.
// chart: il numero del grafico nella sezione; label: un pezzo del suo titolo.

// le righe in cui cercare i punti dei dati da trascinare dell'HW4: sopra la loro retta, dal basso in su
const DRAG_ROWS = Array.from({ length: 52 }, (_, i) => 0.36 - i * 0.006);

export const HOMEWORK = [
  {
    id: 'hw1',
    name: 'HW1.1',
    route: '/statistics/homework-1',
    zip: 'homework1',
    anchors: ['hw1-conclusion', 'hw1-discussion'],
    charts: 19,
    steps: [
      { type: 'wheel', title: 'la mappa di phi', label: 'φ|phi', at: [0.5, 0.35], tip: true },
      { type: 'box', title: 'le frequenze', label: 'N/p', tip: true },
    ],
    sources: [{ kind: 'animation', title: 'l\'animazione', section: 'hw1-guru', site: 'canvas.hw1-anim', zip: 'canvas.anim', box: true }],
  },
  {
    id: 'hw2',
    name: 'HW1.2',
    route: '/statistics/homework-2',
    zip: 'homework2',
    anchors: ['hw2-conclusion'],
    charts: 15,
    checks: 45,
    steps: [
      { type: 'box', title: 'le 2048 parole', label: '2048', from: [0.4, 0.05], to: [0.5, 0.9], tip: true },
      { type: 'wheel', title: 'la mappa SAC', label: 'SAC', at: [0.3, 0.3], tip: true },
    ],
  },
  {
    id: 'hw2a',
    name: 'HW2',
    route: '/statistics/homework-2a',
    zip: 'homework2a',
    anchors: ['hw2a-conclusion'],
    charts: 8,
    players: 3,
    checks: 11,
    steps: [
      { type: 'box', title: 'i 256 byte', label: 'byte', from: [0.2, 0.3], to: [0.35, 0.8], tip: true },
      { type: 'wheel', title: 'la crescita', label: 'log2|bit' },
    ],
  },
  {
    id: 'hw3',
    name: 'HW3',
    route: '/statistics/homework-3',
    zip: 'homework3',
    anchors: ['hw3-conclusion'],
    charts: 15,
    players: 8,
    checks: 24,
    steps: [
      { type: 'slider', title: '2.1', section: 'hw3-sweep', chart: 0 },
      { type: 'slider', title: '5.1', section: 'hw3-normal', chart: 1 },
      { type: 'wheel', title: 'la varianza', section: 'hw3-variance', chart: 0 },
    ],
    sources: [{ kind: 'animation', title: 'le traiettorie', section: 'hw3-trajectories', site: 'canvas.hw3-anim', zip: 'canvas.anim', tip: true }],
  },
  {
    id: 'hw4',
    name: 'HW4',
    route: '/statistics/homework-4',
    zip: 'homework4',
    anchors: ['hw4-conclusion'],
    charts: 14,
    players: 3,
    checks: 36,
    steps: [
      { type: 'handle', title: '2.6, n', section: 'hw4-spread', chart: 2 },
      { type: 'handle', title: '2.7, n', section: 'hw4-inference', chart: 0 },
      { type: 'wheel', title: 'gli intervalli', section: 'hw4-try-intervals', chart: 0 },
      { type: 'slider', title: '1.4', section: 'hw4-steps', chart: 0 },
    ],
    sources: [
      { kind: 'animation', title: 'le traiettorie', section: 'hw4-trajectories', site: 'canvas.hw3-anim', zip: 'canvas.anim', tip: true },
      { kind: 'drag', title: 'i dati da trascinare', section: 'hw4-try-drag', site: 'canvas.hw4-drag', zip: 'canvas.drag', zoomAt: [0.5, 0.2], rows: DRAG_ROWS },
    ],
  },
  {
    id: 'hw5',
    name: 'HW5',
    route: '/statistics/homework-5',
    zip: 'homework5',
    anchors: ['hw5-conclusion'],
    charts: 24,
    players: 6,
    checks: 43,
    steps: [
      { type: 'handle', title: 'l\'area sotto la campana', section: 'hw5-try-area', chart: 0 },
      { type: 'handle', title: 'la soglia d\'allarme', section: 'hw5-try-alarm', chart: 0 },
      { type: 'wheel', title: 'la campana', section: 'hw5-area', chart: 0, tip: true },
      { type: 'wheel', title: 'le strisce di Riemann', section: 'hw5-riemann', chart: 0, tip: true },
      { type: 'wheel', title: 'gli strati di Lebesgue', section: 'hw5-lebesgue', chart: 0, tip: true },
    ],
  },
  {
    id: 'hw6',
    name: 'HW6',
    route: '/statistics/homework-6',
    zip: 'homework6',
    anchors: ['hw6-conclusion'],
    charts: 5,
    zoomable: 4,
    players: 1,
    checks: 28,
    steps: [
      { type: 'handle', title: 'alpha', section: 'hw6-try-dependence', chart: 0 },
      { type: 'choice', title: 'il livello 0,01', section: 'hw6-try-dependence', button: '^0[.,]01$' },
    ],
  },
  {
    id: 'hw7',
    name: 'HW7',
    route: '/statistics/homework-7',
    zip: 'homework7',
    anchors: ['hw7-conclusion'],
    charts: 34,
    zoomable: 29,
    players: 13,
    checks: 58,
    steps: [
      { type: 'slider', title: '1.1, la frequenza', section: 'hw7-probability' },
      { type: 'slider', title: '2.8, la soglia del filtro', section: 'hw7-spam' },
      { type: 'handle', title: '2.5, la soglia di Wald', section: 'hw7-sprt', chart: 0 },
      { type: 'wheel', title: '1.11', section: 'hw7-speed', chart: 0 },
    ],
    sources: [{ kind: 'editor', title: 'l\'editor della prior', section: 'hw7-try-prior', site: 'canvas.hw7-editor', zip: 'canvas.editor' }],
  },
];
