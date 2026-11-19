// src/pages/statistics/hw7/texts.js
// I testi dell'Homework #7 in italiano e in inglese, per la pagina del sito
// e per il programma scaricabile. Finche' la consegna non arriva sono quelli
// dello scheletro: la struttura della pagina, le verifiche del generatore e
// i segnaposto delle sezioni. Ogni numero arriva dagli argomenti o dalle
// costanti della libreria: nessuna frase contiene un risultato scritto a mano.
import { SIGNIFICANCE } from './homework7.js';
import { pParts } from './view.js';

/**
 * The assignment as the professor wrote it, block by block ({ type: 'title'
 * | 'p' | 'list' | 'link', ... }): empty until it arrives.
 */
export const originalAssignment = () => [];

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
  return {
    decimal,
    na,
    int: (v) => (missing(v) ? na : `${v < 0 ? '-' : ''}${group(String(Math.round(Math.abs(Number(v)))))}`),
    num,
    sci,
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
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

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', '×');

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
  },
  sections: {
    assignment: '0. La consegna',
    task: '1. TASK',
    checks: '1.1 Verifiche',
    tests: '2. Riepilogo dei test statistici',
    history: '3. Contesto storico',
    conclusion: '4. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna dell’Homework #7 non è ancora arrivata. La pagina ne ha già la struttura, la stessa degli altri homework: la consegna con il suo testo originale, le sezioni del compito con gli esempi interattivi, il riepilogo dei test statistici, il contesto storico e le conclusioni. Si riempirà seguendo l’ordine del testo del professore.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese.',
    missing: 'Il testo arriverà con la consegna.',
  },
  task: {
    intro: [
      'Le sezioni del compito arriveranno con la consegna. Intanto la pagina mette alla prova gli strumenti che userà: il generatore di numeri casuali, controllato contro valori calcolati altrove, e i calcoli eseguiti in un worker, fuori dal thread principale, mentre la pagina resta reattiva.',
    ],
  },
  checks: {
    intro: 'Il generatore è controllato contro il codice C di riferimento di xoshiro128** e di SplitMix64 e contro un’implementazione indipendente in Python del primo flusso, lo stesso degli Homework #5 e #6.',
    summary: (ok, total) => `${ok} verifiche superate su ${total}`,
    details: (n) => `Le ${n} verifiche, una per una`,
    cols: { check: 'Verifica', expected: 'Atteso', actual: 'Ottenuto', result: 'Esito' },
    groups: { generator: 'Il generatore' },
    ok: 'superata',
    failed: 'fallita',
    generator: (g, seed) => `Il generatore, seme ${seed}: ${IT.int(g.n)} valori uniformi, media ${IT.num(g.mean, 5)} (attesa 0,5), varianza ${IT.num(g.variance, 5)} (attesa 1/12 ≈ ${IT.num(1 / 12, 5)}).`,
  },
  tests: {
    intro: `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. Per ora c’è solo quello del generatore; gli altri arriveranno con il compito. L’esito atteso è quello che la teoria fa prevedere.`,
    cols: { subject: 'Che cosa si verifica', hypothesis: 'Ipotesi nulla H0', statistic: 'Statistica', p: 'p-value', verdict: 'Esito', expected: 'Atteso' },
    rows: {
      generator: { subject: 'Il generatore della pagina', hypothesis: 'La media dei valori uniformi è 1/2 (test z con la varianza nota 1/12)' },
    },
    statNames: { z: 'z' },
    verdicts: { reject: 'H0 rifiutata', accept: 'H0 non rifiutata' },
    expected: { reject: 'rifiutata', accept: 'non rifiutata (95% dei casi)' },
    pending: 'In corso: il calcolo non è ancora finito.',
  },
  history: {
    intro: ['Il contesto storico delle idee del compito arriverà con la consegna.'],
  },
  conclusion: {
    paras: ['Le conclusioni arriveranno con il compito.'],
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline. Con node homework7.js stampa nel terminale le verifiche e i calcoli; --seed e --sample cambiano i parametri.',
    contents: 'Contenuto: index.html, style.css, homework7.js (calcoli, grafici e riga di comando), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework7',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'In preparazione: la consegna non è ancora arrivata.',
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
  },
  sections: {
    assignment: '0. The assignment',
    task: '1. TASK',
    checks: '1.1 Checks',
    tests: '2. Summary of the statistical tests',
    history: '3. Historical context',
    conclusion: '4. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment of Homework #7 has not arrived yet. The page already has its structure, the same as the other homework: the assignment with its original text, the sections of the task with their interactive examples, the summary of the statistical tests, the historical context and the conclusions. It will be filled following the order of the professor’s text.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned, in English.',
    missing: 'The text will come with the assignment.',
  },
  task: {
    intro: [
      'The sections of the task will come with the assignment. Meanwhile the page puts to the test the tools it will use: the random number generator, checked against values computed elsewhere, and the computations run in a worker, off the main thread, while the page stays responsive.',
    ],
  },
  checks: {
    intro: 'The generator is checked against the reference C code of xoshiro128** and SplitMix64 and against an independent Python implementation of the first stream, the same as in Homework #5 and #6.',
    summary: (ok, total) => `${ok} of ${total} checks passed`,
    details: (n) => `The ${n} checks, one by one`,
    cols: { check: 'Check', expected: 'Expected', actual: 'Obtained', result: 'Result' },
    groups: { generator: 'The generator' },
    ok: 'passed',
    failed: 'failed',
    generator: (g, seed) => `The generator, seed ${seed}: ${EN.int(g.n)} uniform values, mean ${EN.num(g.mean, 5)} (expected 0.5), variance ${EN.num(g.variance, 5)} (expected 1/12 ≈ ${EN.num(1 / 12, 5)}).`,
  },
  tests: {
    intro: `The hypothesis tests of the page, at the significance level α = ${EN.num(SIGNIFICANCE, 2)}. For now there is only the one of the generator; the others will come with the task. The expected result is the one the theory predicts.`,
    cols: { subject: 'What is checked', hypothesis: 'Null hypothesis H0', statistic: 'Statistic', p: 'p-value', verdict: 'Result', expected: 'Expected' },
    rows: {
      generator: { subject: 'The generator of the page', hypothesis: 'The mean of the uniform values is 1/2 (z test with the known variance 1/12)' },
    },
    statNames: { z: 'z' },
    verdicts: { reject: 'H0 rejected', accept: 'H0 not rejected' },
    expected: { reject: 'rejected', accept: 'not rejected (95% of the time)' },
    pending: 'Running: the computation has not finished yet.',
  },
  history: {
    intro: ['The historical context of the ideas of the task will come with the assignment.'],
  },
  conclusion: {
    paras: ['The conclusions will come with the task.'],
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: after extracting the archive it opens with a double click on index.html, even offline. With node homework7.js it prints the checks and the computations in the terminal; --seed and --sample change the parameters.',
    contents: 'Contents: index.html, style.css, homework7.js (computations, charts and command line), app.js (interface and texts), README.txt.',
    zip: 'Download homework7',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'In preparation: the assignment has not arrived yet.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
  },
};

export const HW7_TEXTS = { it, en };
