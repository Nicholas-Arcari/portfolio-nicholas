// src/pages/statistics/hw4/texts.js
// I testi dell'Homework #4 in italiano e in inglese. Li usano sia la pagina
// del sito sia il programma scaricabile, cosi' le due versioni dicono le
// stesse cose con le stesse parole. Ogni numero arriva dagli argomenti (i
// risultati della simulazione, i dati scritti nel campo) o dalle costanti
// della libreria: nessuna frase contiene un risultato scritto a mano.
import { BETA, BINOMIAL, CONFIDENCE, DATA_MAX, DEFAULT_M, DEFAULT_N, DEFAULT_P, DEFAULT_SEED, LIMITS, N_GRID, SIGNIFICANCE, SMALL_N, scoreLaw } from './homework4.js';
import { averageFacts, comparisonFacts, inferenceFacts, spreadFacts } from './view.js';

/** Number formatting of one language: decimal and thousands separators, the "not available" marker, the multiplication sign. */
function formatters(decimal, thousands, na, times) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const sci = (v, digits = 1) => {
    if (missing(v)) return na;
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    let mant = v / 10 ** e;
    let exp = e;
    if (Number(Math.abs(mant).toFixed(digits)) >= 10) {
      mant /= 10;
      exp += 1;
    }
    return `${local(mant.toFixed(digits))} ${times} 10^${exp}`;
  };
  // fixed decimals, with the thousands grouped: 2828.4 -> 2.828,4 in Italian
  const num = (v, digits = 3) => {
    if (missing(v)) return na;
    const [whole, part] = Math.abs(v).toFixed(digits).split('.');
    const negative = v < 0 && Math.abs(v) >= 0.5 * 10 ** -digits;
    return `${negative ? '-' : ''}${group(whole)}${part ? `${decimal}${part}` : ''}`;
  };
  // significant digits, for numbers of any size (the data of section 1.4)
  const sig = (v, digits = 6) => {
    if (missing(v)) return na;
    if (v === 0) return '0';
    if (Math.abs(v) >= 1e15 || Math.abs(v) < 1e-5) return sci(v, digits - 1);
    const s = String(Number(v.toPrecision(digits)));
    const [whole, part] = s.replace('-', '').split('.');
    return `${v < 0 ? '-' : ''}${group(whole)}${part ? `${decimal}${part}` : ''}`;
  };
  return {
    na,
    decimal,
    int: (v) => (missing(v) ? na : `${v < 0 ? '-' : ''}${group(String(Math.round(Math.abs(Number(v)))))}`),
    num,
    sig,
    // a number with as many decimals as typed (a parameter): 0.2 -> 0,2
    plain: (v) => (missing(v) ? na : local(String(v))),
    pval: (v) => (missing(v) ? na : v === 0 ? `< ${local('1e-300')}` : v < 0.001 ? sci(v) : local(v.toFixed(3))),
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
    // a small positive number: four decimals, or powers of ten below 10^-4
    small: (v, digits = 4) => (missing(v) ? na : v === 0 ? '0' : Math.abs(v) < 10 ** -digits ? sci(v) : local(v.toFixed(digits))),
    sci,
    ms: (v) => (missing(v) ? na : v >= 1000 ? `${local((v / 1000).toFixed(2))} s` : `${Math.max(1, Math.round(v))} ms`),
    pow: (e) => `10^${e}`,
  };
}

/**
 * The assignment as the professor wrote it, block by block. The only
 * change is the dash of the two titles, written "-" as everywhere on this
 * site.
 */
export const originalAssignment = () => [
  { type: 'h', text: 'Ex. 1 - Welford’s Recurrence Formulas' },
  { type: 'p', text: 'Derive Welford’s recurrence formulas for the sum of squares (SS) and the variance, following the same approach as Knuth’s recurrence formula for the mean.' },
  { type: 'p', text: 'Write the corresponding code. The core logic should require only about 3 lines.' },
  { type: 'h', text: 'Ex. 2 - Sampling Mean and Variance' },
  { type: 'p', text: 'Extend the previous homework by assigning each penetration attempt a score between 0 and 10, drawn from a fixed probability distribution of your choice. Let the theoretical mean and variance of this distribution be μ and σ², respectively.' },
  { type: 'p', text: 'Assume there are m hackers, each attempting to penetrate n systems. Each hacker receives one score for each system, resulting in a trajectory of n scores.' },
  { type: 'p', text: 'For each hacker, use Welford’s recurrence formulas to compute the sampling mean and sampling variance of their n scores.' },
  { type: 'p', text: 'Across the m hackers, compute the average of the sampling means and the average of the sampling variances. Compare these two averages with the theoretical mean μ and variance σ², respectively.' },
  { type: 'p', text: 'What conclusions can you draw from these comparisons? Why are these results useful in inferential statistics? Repeat the experiment for different values of n. How does increasing the number of systems attempted by each hacker affect the variability of the sampling means and sampling variances?' },
];

// ---------------------------------------------------------------------------
// Le formule, scritte una volta: le stesse nelle due lingue
// ---------------------------------------------------------------------------

const KNUTH_FORMULAS = [
  'k M_k = (x_1 + ... + x_(k-1)) + x_k = (k - 1) M_(k-1) + x_k',
  'M_k   = M_(k-1) + (x_k - M_(k-1))/k                    M_1 = x_1',
  '      = M_(k-1) + δ_k/k,       δ_k = x_k - M_(k-1)',
].join('\n');

const SS_FORMULAS = [
  'x_i - M_k = (x_i - M_(k-1)) - δ_k/k                                       i ≤ k - 1',
  'Σ_(i≤k-1) (x_i - M_k)² = SS_(k-1) - 2 (δ_k/k) Σ_(i≤k-1) (x_i - M_(k-1)) + (k - 1) δ_k²/k²',
  '                       = SS_(k-1) + (k - 1) δ_k²/k²                       (Σ_(i≤k-1) (x_i - M_(k-1)) = 0)',
  'x_k - M_k = δ_k - δ_k/k = (k - 1) δ_k/k',
  'SS_k = SS_(k-1) + (k - 1) δ_k²/k² + (k - 1)² δ_k²/k² = SS_(k-1) + ((k - 1)/k) δ_k²',
  'SS_k = SS_(k-1) + (x_k - M_(k-1)) (x_k - M_k)                              SS_1 = 0',
].join('\n');

const VARIANCE_FORMULAS = [
  's_k² = SS_k/(k - 1) = (SS_(k-1) + ((k - 1)/k) δ_k²)/(k - 1)',
  '     = ((k - 2)/(k - 1)) s_(k-1)² + δ_k²/k',
  '     = s_(k-1)² + (δ_k²/k - s_(k-1)²/(k - 1))                       k ≥ 2,  s_1² = 0',
  'v_k  = SS_k/k = v_(k-1) + ((x_k - M_(k-1)) (x_k - M_k) - v_(k-1))/k      v_1 = 0',
].join('\n');

const UNBIASED_FORMULAS = [
  'E[M_n]  = (1/n) Σ E[X_i] = μ',
  'SS_n    = Σ (X_i - μ)² - n (M_n - μ)²',
  'E[SS_n] = n σ² - n Var(M_n) = n σ² - σ² = (n - 1) σ²',
  'E[s_n²] = E[SS_n]/(n - 1) = σ²           E[SS_n/n] = σ² (n - 1)/n',
].join('\n');

const spreadFormulas = (large, normal) =>
  [
    'Var(M_n)       = σ²/n',
    `Var(s_n²)      = μ₄/n - σ⁴ (n - 3)/(n (n - 1))    ≈ (μ₄ - σ⁴)/n  ${large}`,
    `               = 2 σ⁴/(n - 1)                     ${normal}`,
    'Cov(M_n, s_n²) = μ₃/n',
  ].join('\n');

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', '×');

/** The line of numbers under a hypothesis test, whatever its kind. */
function testLineIt(t) {
  const F = IT;
  switch (t.kind) {
    case 'chi2':
      return `χ² = ${F.num(t.chi2, 1)} su ${F.int(t.classes)} classi (${F.int(t.df)} gradi di libertà), p = ${F.pval(t.pValue)}`;
    case 'mean':
      return `media ${F.num(t.mean, 5)} contro ${F.num(t.expected, 5)}, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'variance':
      return `varianza ${F.sig(t.variance, 5)} contro ${F.sig(t.expected, 5)} (rapporto ${F.num(t.ratio, 4)}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'jb':
      return `asimmetria ${F.num(t.skewness, 3)}, curtosi in eccesso ${F.num(t.excessKurtosis, 3)}, JB = ${F.num(t.statistic, 2)} (χ² con 2 gradi di libertà), p = ${F.pval(t.pValue)}`;
    case 'proportion':
      return `quota ${F.pct(t.rate, 2)} contro ${F.pct(t.expected, 0)} su ${F.int(t.m)} hacker, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'correlation':
      return `correlazione ${F.num(t.r, 4)} contro ${F.num(t.expected, 4)} su ${F.int(t.m)} hacker (trasformazione di Fisher), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'lag':
      return `correlazione ${F.num(t.r, 5)} su ${F.int(t.pairs)} coppie di punteggi consecutivi, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

/** Where the formulas of section 1.5 break, in words. */
function stabilityIt(f) {
  const F = IT;
  const at = (power) => `c = ${F.pow(power)}`;
  const naive = `La formula da manuale perde la sesta cifra significativa da ${at(f.naive.micro)} e le perde tutte da ${at(f.naive.total)}: l’errore supera il 100%${f.negative ? ', e la varianza esce sbagliata anche nel segno' : ''}.`;
  const welford = f.welford.micro === null ? `Welford resta sotto un errore relativo di 10^-6 fino a ${at(f.maxPower)}.` : `Welford resta sotto un errore relativo di 10^-6 fino a ${at(f.welford.micro - 1)}, e a ${at(f.maxPower)} sbaglia del ${F.pct(f.welford.last, 1)}.`;
  const twoPass = f.twoPass.micro === null ? `Le due passate restano esatte fino a ${at(f.maxPower)}.` : `Le due passate restano sotto 10^-6 fino a ${at(f.twoPass.micro - 1)} e a ${at(f.maxPower)} sbagliano del ${F.pct(f.twoPass.last, 1)}: quando c n supera 2^53 ≈ 9 × 10^15 anche la somma dei dati si arrotonda, e la media da cui partono gli scarti è sbagliata di qualche unità.`;
  return [`Il grafico usa i primi ${F.int(f.size)} punteggi dell’hacker 1 della Part 2 (varianza esatta ${F.num(f.exact, 6)}) spostati di c = 10^0, ..., ${F.pow(f.maxPower)}. ${naive} ${welford} ${twoPass}`];
}

const it = {
  fmt: IT,
  formulas: { knuth: KNUTH_FORMULAS, ss: SS_FORMULAS, variance: VARIANCE_FORMULAS, unbiased: UNBIASED_FORMULAS, spread: spreadFormulas('per n grande', 'per dati normali, μ₄ = 3σ⁴') },
  ui: {
    index: 'Indice',
    indexTitle: 'Indice dell’homework',
    close: 'Chiudi',
    backToTop: 'Torna su',
    computing: 'Simulazione in corso...',
    language: 'Lingua',
    error: (m) => `Errore: ${m}`,
  },
  sections: {
    assignment: '0. La consegna',
    part1: 'Part 1 - Le formule ricorsive di Welford',
    knuth: '1.1 La formula di Knuth per la media',
    ss: '1.2 La somma dei quadrati: la formula di Welford',
    variance: '1.3 La varianza',
    steps: '1.4 Passo per passo',
    stability: '1.5 La stabilità numerica',
    checks: '1.6 Verifiche',
    part2: 'Part 2 - Media e varianza campionarie',
    scores: '2.1 La distribuzione dei punteggi',
    input: '2.2 Hacker, sistemi e seme',
    trajectories: '2.3 Le traiettorie, punteggio dopo punteggio',
    averages: '2.4 Le medie sugli hacker',
    comparison: '2.5 Che cosa dice il confronto',
    spread: '2.6 La variabilità al crescere di n',
    inference: '2.7 Perché serve alla statistica inferenziale',
    tryDrag: 'Prova: trascina i dati',
    tryDigits: 'Prova: le cifre che si perdono',
    tryBessel: 'Prova: Bessel in diretta',
    tryIntervals: 'Prova: 100 intervalli di confidenza',
    tests: '3. Riepilogo dei test statistici',
    history: '4. Contesto storico',
    conclusion: '5. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna ha due parti. La Part 1 chiede di ricavare le formule ricorsive di Welford per la somma dei quadrati (SS) e per la varianza, seguendo lo stesso procedimento della formula ricorsiva di Knuth per la media, e di scriverne il codice, il cui nucleo deve stare in circa tre righe. La Part 2 estende l’Homework #3: ogni tentativo di penetrazione riceve un punteggio fra 0 e 10, estratto da una distribuzione fissa a scelta con media μ e varianza σ²; m hacker attaccano n sistemi ciascuno, e ogni hacker calcola con le formule di Welford la media e la varianza campionarie dei suoi n punteggi. Sugli m hacker si confrontano la media delle medie campionarie con μ e la media delle varianze campionarie con σ², si discutono le conclusioni e la loro utilità per la statistica inferenziale, e si ripete l’esperimento per diversi n, studiando come cambia la variabilità delle medie e delle varianze campionarie.',
      'La Part 1 ricava le formule passo per passo, le anima su dati scelti da chi legge e ne misura la stabilità numerica contro la formula da manuale; il codice richiesto, in tre righe, è nel programma scaricabile in fondo alla pagina. La Part 2 sceglie la distribuzione dei punteggi, simula gli hacker, confronta le medie con μ e σ², risponde alle tre domande della consegna (sezioni 2.5, 2.6 e 2.7) e collega i risultati all’inferenza. La sezione 3 riassume i test statistici, la 4 colloca le idee nel tempo e la 5 trae le conclusioni. Tutti i numeri sono calcolati nel browser, e il programma scaricabile stampa gli stessi.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese. L’unica modifica è il trattino dei due titoli, scritto "-" come in tutto il sito.',
  },
  part1: {
    intro: [
      'Media e varianza di x_1, x_2, ... si possono calcolare in due modi: tenendo tutti i dati e facendo due passate (prima la media, poi gli scarti dalla media), oppure aggiornando pochi numeri a ogni dato nuovo, senza tenere i dati. Il secondo modo serve quando i dati arrivano in flusso (un sensore, un log, il traffico di una rete) o sono troppi per la memoria, ed è quello della consegna. Una formula ricorsiva dice come passare dalla statistica dei primi k - 1 dati a quella dei primi k usando soltanto il dato nuovo x_k.',
    ],
  },
  knuth: {
    intro: [
      'Sia M_k = (x_1 + ... + x_k)/k la media dei primi k dati. Invece di tenere la somma, la si riscrive con la media precedente: x_1 + ... + x_(k-1) = (k - 1) M_(k-1). Basta separare il dato nuovo dagli altri:',
    ],
    formulasTitle: 'La media, da k - 1 a k dati',
    after: [
      'La media nuova è quella vecchia corretta di una frazione 1/k dello scarto δ_k = x_k - M_(k-1) fra il dato nuovo e la media vecchia. È la formula ricorsiva che Knuth riporta in The Art of Computer Programming (vol. 2, § 4.2.2), e con M_0 = 0 vale anche per k = 1. Il procedimento ha tre passi, che per SS si ripetono identici: si scrive la grandezza dei primi k dati con quella dei primi k - 1, si isola il contributo del dato nuovo, si esprime tutto con lo scarto δ_k.',
      'Rispetto alla somma, la media corrente resta grande quanto i dati, non cresce con k, e la correzione δ_k/k diventa sempre più piccola: dopo molti dati, uno nuovo sposta la media di poco. È lo stesso aggiornamento degli algoritmi a passo decrescente, come l’approssimazione stocastica di Robbins e Monro.',
    ],
  },
  ss: {
    intro: [
      'Sia SS_k = Σ_(i≤k) (x_i - M_k)² la somma dei quadrati degli scarti dei primi k dati dalla loro media. Stesso procedimento: si separano i primi k - 1 dati dal nuovo, e si scrive ogni scarto dalla media nuova come scarto dalla media vecchia meno lo spostamento della media, che per la formula di Knuth è M_k - M_(k-1) = δ_k/k.',
    ],
    formulasTitle: 'La somma dei quadrati, da k - 1 a k dati',
    after: [
      'L’ultima riga è la formula di Welford (1962): l’incremento di SS è il prodotto dei due scarti del dato nuovo, da prima e da dopo l’aggiornamento della media, perché x_k - M_k = ((k - 1)/k) δ_k. I due fattori hanno sempre lo stesso segno, quindi ogni incremento è ≥ 0 e SS non può diventare negativa, cosa che la formula da manuale non garantisce (sezione 1.6).',
      'La stessa formula si ottiene anche dalla scomposizione SS_k = Σ x_i² - k M_k²: sottraendo quella dei primi k - 1 dati e usando k M_k = (k - 1) M_(k-1) + x_k, resta SS_k - SS_(k-1) = x_k² - k M_k² + (k - 1) M_(k-1)² = (x_k - M_(k-1))(x_k - M_k). La prima strada però mostra perché funziona: gli scarti dalla media vecchia sommano a zero, quindi spostare la media aggiunge a SS solo un termine in δ_k².',
    ],
  },
  variance: {
    intro: [
      'La varianza campionaria dei primi k dati è s_k² = SS_k/(k - 1), per k ≥ 2; quella della popolazione, che è anche lo stimatore di massima verosimiglianza per dati normali, è v_k = SS_k/k. Dividendo la formula di Welford si ottengono le loro ricorsioni, nella stessa forma di quella di Knuth:',
    ],
    formulasTitle: 'Le due varianze, da k - 1 a k dati',
    after: [
      'La varianza della popolazione si aggiorna esattamente come una media: è la media corrente dei termini (x_k - M_(k-1))(x_k - M_k), e la sua ricorsione è quella di Knuth applicata a loro. La varianza campionaria ha in più il fattore (k - 2)/(k - 1), che viene dal divisore k - 1; con due dati vale s_2² = δ_2²/2 = (x_2 - x_1)²/2.',
      'Conviene aggiornare M e SS e dividere solo quando serve la varianza: si risparmia una divisione per passo, SS ha senso anche quando la varianza non è ancora definita (k = 1), e le due varianze si ottengono dallo stesso SS. Perché il divisore giusto sia k - 1, la correzione di Bessel, è il cuore della Part 2: la sezione 2.5 lo dimostra e la simulazione lo verifica.',
      'Le tre formule di aggiornamento, δ_k = x_k - M_(k-1), M_k = M_(k-1) + δ_k/k e SS_k = SS_(k-1) + δ_k (x_k - M_k), sono l’algoritmo intero: la terza usa la media già aggiornata dalla seconda, ed è così che il prodotto contiene i due scarti, da prima e da dopo. Scritte in JavaScript sono le tre righe che la consegna chiede: stanno nella funzione welford() di homework4.js, nel programma della sezione "Scarica il codice" in fondo alla pagina, e sono le stesse che la pagina esegue nella tabella della sezione 1.4, nell’animazione della sezione 2.3 e nella simulazione della Part 2, una volta per ogni punteggio di ogni hacker.',
      'Il costo è costante per dato e in memoria: tre numeri (k, M e SS) bastano per qualunque n, e media e varianza si possono leggere a ogni passo. Con i punteggi di un hacker che arrivano un sistema dopo l’altro, sono disponibili in ogni momento senza tornare sui dati: è ciò che la Part 2 usa per avere, in una sola simulazione, i risultati di ogni n.',
      'Due risultati parziali si possono anche unire, per esempio quelli calcolati in parallelo su due parti dei dati: con n_A e n_B dati, n = n_A + n_B e δ = M_B - M_A, la media è M_A + δ n_B/n e la somma dei quadrati SS_A + SS_B + δ² n_A n_B/n (Chan, Golub e LeVeque, 1979). Con n_B = 1 è di nuovo la formula di Welford.',
    ],
  },
  steps: {
    intro: [
      'La tabella e il grafico applicano le tre formule di aggiornamento ai dati del campo, uno alla volta. Per ogni passo k: il dato x_k, lo scarto δ_k = x_k - M_(k-1) dalla media vecchia, la media nuova M_k, lo scarto x_k - M_k dalla media nuova, il loro prodotto (l’incremento di SS), SS_k e la varianza campionaria s_k². Nel grafico i punti sono i dati e la linea la media corrente, con la fascia M_k ± s_k; al passo evidenziato il segmento giallo è δ_k, da M_(k-1) a x_k, e quello viola x_k - M_k, i due fattori dell’incremento.',
      `I dati iniziali sono l’esempio classico 2, 4, 4, 4, 5, 5, 7, 9: media 5, varianza della popolazione 4, varianza campionaria 32/7. Si possono scrivere altri numeri, da 2 a ${DATA_MAX}.`,
    ],
    dataLabel: `I dati (da 2 a ${DATA_MAX} numeri)`,
    dataHint: 'Separati da spazi o da punto e virgola; 2,5 e 2.5 sono lo stesso numero.',
    errors: {
      empty: () => 'Scrivi almeno due numeri.',
      tooMany: () => `Al massimo ${DATA_MAX} numeri.`,
      notNumber: (t) => `"${t}" non è un numero.`,
      tooLarge: (t) => `"${t}" è troppo grande: al massimo 10^15 in valore assoluto.`,
      tooFew: () => 'Servono almeno due numeri.',
    },
    restore: 'Ripristina i dati iniziali',
    stale: 'Finché il campo contiene un errore, la tabella usa gli ultimi dati validi.',
    play: 'Avvia',
    pause: 'Pausa',
    resume: 'Riprendi',
    step: 'Un passo',
    reset: 'Dall’inizio',
    end: 'Alla fine',
    chart: (k, K) => `Le formule ricorsive al passo ${k} di ${K}`,
    legend: ['dati x_k', 'media corrente M_k', 'fascia M_k ± s_k', 'δ_k = x_k - M_(k-1)', 'x_k - M_k'],
    line: (r, previous) => {
      const F = IT;
      if (r.k === 1) return `Passo 1: M_1 = x_1 = ${F.sig(r.x)}, SS_1 = 0; la varianza campionaria non è ancora definita.`;
      return `Passo ${r.k}: δ = ${F.sig(r.x)} - ${F.sig(r.previous)} = ${F.sig(r.delta)}; M_${r.k} = ${F.sig(r.previous)} + ${F.sig(r.delta)}/${r.k} = ${F.sig(r.mean)}; SS_${r.k} = ${F.sig(previous.ss)} + ${F.sig(r.delta)} × ${F.sig(r.after)} = ${F.sig(r.ss)}; s²_${r.k} = ${F.sig(r.ss)}/${r.k - 1} = ${F.sig(r.variance)}.`;
    },
    tableTitle: 'Le formule di aggiornamento, passo per passo',
    cols: { k: 'k', x: 'x_k', delta: 'δ_k', mean: 'M_k', after: 'x_k - M_k', increment: 'δ_k (x_k - M_k)', ss: 'SS_k', variance: 's_k²' },
    check: (c) => {
      const F = IT;
      return `Alla fine: media ${F.sig(c.mean, 10)}; varianza campionaria con Welford ${F.sig(c.welford, 10)}, con le due passate ${F.sig(c.twoPass, 10)}, con la formula da manuale ${F.sig(c.naive, 10)}${c.naiveError > 1e-9 ? ` (errore relativo ${F.sci(c.naiveError)})` : ''}.`;
    },
    after: [
      'Nella tabella si vedono due cose. L’incremento di SS non è mai negativo, perché δ_k e x_k - M_k hanno lo stesso segno. E un dato lontano dalla media conta due volte: sposta la media di δ_k/k e aggiunge a SS circa δ_k², che è il motivo per cui la varianza è così sensibile ai valori anomali. Provando per esempio 2 4 4 4 5 5 7 90 si vede l’ultimo passo moltiplicare SS per più di cento.',
    ],
  },
  stability: {
    intro: [
      'La varianza si può calcolare in una passata anche con la formula da manuale, SS = Σx² - (Σx)²/n, che tiene soltanto Σx e Σx². In aritmetica esatta è identica alle altre; in virgola mobile è pericolosa, perché sottrae due numeri enormi e quasi uguali. Se i dati hanno media c e deviazione standard σ, Σx² e (Σx)²/n valgono circa n c², la loro differenza circa n σ², e delle circa 16 cifre decimali dei double (53 bit di mantissa, IEEE 754) se ne perdono circa 2 log₁₀(c/σ): è la cancellazione catastrofica. La formula di Welford non sottrae mai quantità grandi fra loro: lavora con gli scarti, che hanno la dimensione di σ.',
      'La tabella usa l’esempio classico 4, 7, 13, 16, con varianza 30, spostato di una costante c: lo spostamento non cambia la varianza, ma la formula da manuale sì.',
    ],
    tableTitle: 'Le tre formule su 4, 7, 13, 16 + c (varianza esatta 30)',
    cols: { offset: 'c', naive: 'Formula da manuale', twoPass: 'Due passate', welford: 'Welford' },
    chartTitle: (size) => `Errore relativo sulla varianza di ${size} punteggi spostati di c = 10^x, per x da 0 a 14 (scala logaritmica)`,
    legend: ['formula da manuale', 'due passate', 'Welford'],
    facts: stabilityIt,
    after: [
      'Il perché sta nella dimensione dei numeri che si sottraggono. Welford calcola x_k - M_(k-1), una differenza della dimensione di σ fra numeri della dimensione di c: l’errore di arrotondamento di M, circa c ε con ε = 2^-53 ≈ 1,1 × 10^-16, passa negli scarti, e l’errore relativo della varianza cresce all’incirca in proporzione a c, una cifra persa per ogni fattore 10. La formula da manuale perde in proporzione a c²: due cifre per ogni fattore 10, come si vede dalla pendenza doppia nel grafico. Il problema e le sue soluzioni sono analizzati da Chan, Golub e LeVeque (1983).',
      'Per i punteggi della Part 2, fra 0 e 10, la cancellazione non conta: anche la formula da manuale darebbe quasi tutte le cifre. Conta con misure che hanno un grande valore di fondo e piccole variazioni, come i tempi in millisecondi dall’epoca Unix (circa 1,8 × 10^12) o i contatori di byte delle interfacce di rete: proprio i dati che in sicurezza si analizzano in flusso, e su cui la formula da manuale darebbe varianze prive di senso.',
    ],
  },
  checks: {
    intro: 'Le formule, il generatore e le funzioni statistiche sono controllati contro riferimenti indipendenti: le formule di aggiornamento contro il modulo statistics di Python, che calcola con le frazioni e quindi in modo esatto, e contro NumPy 2.4.6; xoshiro128** e SplitMix64 contro il loro codice C di riferimento; i punteggi dell’hacker 1, con tutte e quattro le leggi, contro lo stesso programma C; leggi, quantili e funzioni speciali contro SciPy 1.17.1; le formule di Var(s²) e Cov(M, s²) della sezione 2.6 contro l’enumerazione esatta, con le frazioni di Python, di tutti i campioni di 2 e di 3 punteggi.',
    summary: (ok, total) => `${ok} verifiche su ${total} superate.`,
    details: (total) => `Le ${total} verifiche`,
    groups: { welford: 'Le formule ricorsive', generator: 'Generatore e punteggi', functions: 'Leggi, momenti e funzioni speciali' },
    cols: { check: 'Verifica', expected: 'Valore atteso', result: 'Esito' },
    ok: 'superata',
    failed: 'fallita',
  },
  part2: {
    intro: [
      'La Part 2 riprende gli attaccanti dell’Homework #3, che qui sono gli hacker della consegna, e dà un punteggio a ogni tentativo. Ogni hacker produce una traiettoria di n punteggi X_1, ..., X_n, indipendenti e con la stessa legge di media μ e varianza σ², e la riassume con le formule di aggiornamento della Part 1 nella media campionaria M_n e nella varianza campionaria s_n² = SS_n/(n - 1). Gli m hacker sono m campioni indipendenti: le loro medie e varianze sono m estrazioni delle statistiche M_n e s_n², e la media di queste estrazioni dice quanto valgono in media, cioè se M_n e s_n² sono stimatori corretti di μ e σ².',
    ],
  },
  scores: {
    intro: (p) => {
      const L = scoreLaw('outcome', p);
      return [
        `La distribuzione iniziale estende l’Homework #3 nel modo più diretto: ogni tentativo riesce con probabilità p, come prima, e il punteggio dice quanto è andato bene. Un tentativo fallito vale un intero uniforme fra 0 e 4, uno riuscito un intero uniforme fra 6 e 10. Con p = ${IT.plain(p)} la media è μ = 2 + 6p = ${IT.sig(L.mu)} e la varianza σ² = 2 + 36 p (1 - p) = ${IT.sig(L.variance)}: la varianza dentro i due gruppi, 2, più quella fra i due gruppi, 36 p (1 - p). Il generatore dei successi è quello dell’Homework #3: con lo stesso seme e lo stesso p, l’hacker j riesce e fallisce sugli stessi sistemi dell’attaccante j.`,
        `Le altre tre leggi servono a vedere che cosa dipende dalla forma della distribuzione: la binomiale Bin(${BINOMIAL.trials}; ${IT.plain(BINOMIAL.q)}), dieci passi ognuno riuscito con probabilità ${IT.plain(BINOMIAL.q)}, è quasi a campana; l’uniforme sugli interi da 0 a 10 è simmetrica e senza code; la Beta(${BETA.a}, ${BETA.b}) moltiplicata per 10 è continua e asimmetrica. Scegliere un’altra legge ripete la simulazione.`,
      ];
    },
    chooseLabel: 'Distribuzione dei punteggi',
    tableTitle: (p) => `Le quattro leggi e i loro momenti (p = ${IT.plain(p)} per la prima)`,
    cols: { law: 'Legge', values: 'Valori', mu: 'Media μ', variance: 'Varianza σ²', skewness: 'Asimmetria', kurtosis: 'Curtosi in eccesso', mu4: 'μ₄' },
    values: { outcome: '0..4, 6..10', binomial: '0..10', uniform: '0..10', beta: '[0, 10]' },
    after: [
      'μ e σ² bastano per le medie della sezione 2.4. La variabilità della varianza campionaria dipende anche dal momento centrale quarto μ₄, cioè dalla curtosi, e la sua correlazione con la media dal momento terzo μ₃, cioè dall’asimmetria: per questo la tabella riporta anche loro, e le quattro leggi si comportano in modo diverso nelle sezioni 2.6 e 2.7.',
    ],
    chartTitle: (name, simulated) => (simulated ? `I punteggi di tutti gli hacker contro la legge: ${name}` : `La legge dei punteggi: ${name}`),
    legend: (discrete, simulated) => {
      if (!simulated) return discrete ? ['legge'] : ['legge, per intervallo', null, 'densità'];
      return discrete ? ['punteggi simulati', 'legge'] : ['punteggi simulati, per intervallo', 'legge, per intervallo', 'densità'];
    },
  },
  input: {
    intro: `I valori iniziali sono quelli dell’Homework #3: p = ${IT.plain(DEFAULT_P)} (solo per la prima legge), n = ${IT.int(DEFAULT_N)} sistemi per hacker, m = ${IT.int(DEFAULT_M)} hacker e il seme ${DEFAULT_SEED}. Ogni hacker ha due generatori xoshiro128**, con lo stato ricavato da SplitMix64: il primo decide i successi ed è quello dell’attaccante dell’Homework #3, il secondo dà i punteggi. Con lo stesso seme la pagina, l’animazione e node homework4.js vedono gli stessi hacker e stampano gli stessi numeri. Media e varianza di ogni hacker si leggono a n = ${N_GRID.slice(0, 6).join(', ')}, ... e all’ultimo sistema, nella stessa simulazione: le formule di Welford danno i valori di ogni n strada facendo, ed è così che l’esperimento si ripete per diversi n. Con i valori iniziali si simulano ${IT.int(DEFAULT_N * DEFAULT_M)} punteggi; il tempo impiegato compare sotto i campi.`,
    pLabel: `Probabilità di successo p, prima legge (da ${IT.plain(LIMITS.p[0])} a ${IT.plain(LIMITS.p[1])})`,
    pHint: 'Con la virgola o con il punto: 0,2 e 0.2 sono lo stesso valore. Le altre leggi non dipendono da p.',
    nLabel: `Sistemi n per hacker (da ${IT.int(LIMITS.n[0])} a ${IT.int(LIMITS.n[1])})`,
    nHint: `La lunghezza delle traiettorie. Media e varianza si leggono a n = ${N_GRID.slice(0, 4).join(', ')}, ... e all’ultimo sistema.`,
    mLabel: `Hacker m (da ${IT.int(LIMITS.m[0])} a ${IT.int(LIMITS.m[1])})`,
    mHint: 'I campioni indipendenti. La media di m valori ha un errore di circa 1/√m volte la loro deviazione standard.',
    seedLabel: `Seme (da 0 a ${IT.int(LIMITS.seed[1])})`,
    seedHint: 'Lo stesso seme dà gli stessi hacker, qui e nel terminale (node homework4.js --seed ...).',
    randomSeed: 'Seme casuale',
    errors: {
      empty: () => 'Scrivi un valore.',
      notInteger: (t) => `"${t}" non è un intero scritto in cifre decimali.`,
      notNumber: (t) => `"${t}" non è un numero.`,
      range: (lo, hi) => `Il valore va da ${lo} a ${hi}.`,
    },
    limits: {
      p: [IT.plain(LIMITS.p[0]), IT.plain(LIMITS.p[1])],
      n: [IT.int(LIMITS.n[0]), IT.int(LIMITS.n[1])],
      m: [IT.int(LIMITS.m[0]), IT.int(LIMITS.m[1])],
      seed: [IT.int(LIMITS.seed[0]), IT.int(LIMITS.seed[1])],
    },
    defaultBadge: `Valori iniziali: esito dell’Homework #3 + punteggio, p = ${IT.plain(DEFAULT_P)}, n = ${IT.int(DEFAULT_N)} sistemi, m = ${IT.int(DEFAULT_M)} hacker, seme ${DEFAULT_SEED}.`,
    customBadge: 'Valori diversi da quelli iniziali.',
    restore: 'Ripristina i valori iniziali',
    stale: 'Finché un campo contiene un errore, la pagina usa il suo ultimo valore valido.',
    pending: 'Simulazione in corso con i nuovi valori: le sezioni seguenti si aggiornano appena finisce.',
    run: (s) => `Simulati ${IT.int(s.draws)} punteggi (${IT.int(s.params.m)} hacker, ${IT.int(s.params.n)} sistemi), con media e varianza di ogni hacker a ${s.points.length} valori di n, in ${IT.ms(s.ms)}.`,
  },
  trajectories: {
    intro: (shown, sample) => [
      `L’animazione mostra le formule al lavoro, punteggio dopo punteggio. A sinistra la media corrente M_k, o la varianza corrente s_k², dei primi ${IT.int(shown)} hacker, con il primo in rosso; a destra l’istogramma dei valori di ${IT.int(sample)} hacker al passo corrente, con la curva della normale che ha la media e la deviazione standard della teoria. La fascia verde è il valore vero ± 2 deviazioni standard, σ/√k per la media e √Var(s_k²) per la varianza; la linea tratteggiata verde è μ, o σ², e quella punteggiata gialla l’inviluppo della legge del logaritmo iterato.`,
      'All’inizio le traiettorie occupano tutto l’intervallo dei punteggi; poi si stringono attorno al valore vero, come 1/√k: è la legge dei grandi numeri, per la media e anche per la varianza, che a meno di un termine che svanisce è la media dei quadrati (X_i - μ)². L’animazione si apre sull’ultimo punteggio: Avvia la fa ripartire dal primo, Un punteggio avanza di un passo.',
    ],
    quantityLabel: 'Grandezza',
    speedLabel: 'Velocità',
    speeds: ['Lenta', 'Normale', 'Veloce'],
    play: 'Avvia',
    pause: 'Pausa',
    resume: 'Riprendi',
    step: 'Un punteggio',
    reset: 'Dall’inizio',
    end: 'Alla fine',
    legend: ['hacker', 'hacker 1', 'valore vero ± 2 deviazioni standard', 'logaritmo iterato'],
    caption: (st, name) => {
      if (!st.ready) return `Punteggio ${IT.int(st.k)} di ${IT.int(st.n)}: la varianza campionaria è definita da 2 punteggi in poi.`;
      return `Punteggio ${IT.int(st.k)} di ${IT.int(st.n)}: ${name} dei ${IT.int(st.sample)} hacker in media ${IT.num(st.mean, 4)} (teoria ${IT.num(st.theoryMean, 4)}), con deviazione standard ${IT.num(st.sd, 4)} (teoria ${IT.num(st.theorySd, 4)}); fuori dalla fascia il ${IT.pct(st.outside)}; hacker 1: ${IT.num(st.first, 4)}.`;
    },
    after: [
      'Le due grandezze si comportano in modo diverso. Con pochi punteggi l’istogramma delle varianze è asimmetrico, con una coda verso destra, e la normale arriva più tardi che per le medie: s_k² è una media di quadrati, che sono più asimmetrici dei punteggi stessi. E la fascia della varianza è più larga in proporzione, perché dipende da μ₄: stimare la variabilità di un hacker richiede più dati che stimarne la media.',
    ],
  },
  averages: {
    intro: (s) => [
      `Per ogni n la tabella prende le ${IT.int(s ? s.m : DEFAULT_M)} medie campionarie e le ${IT.int(s ? s.m : DEFAULT_M)} varianze campionarie degli hacker e ne fa la media: è il confronto chiesto dalla consegna. Accanto a ogni media c’è la sua distanza dal valore teorico in errori standard, z: la media di m valori indipendenti ha la deviazione standard di un valore divisa per √m, cioè σ/√(nm) per le medie e √(Var(s_n²)/m) per le varianze. Se gli stimatori sono corretti, |z| supera 1,96 circa una volta su venti.`,
      'L’ultima colonna fa la stessa media con SS_n/n, la varianza che divide per n invece che per n - 1: il suo valore atteso è σ² (n - 1)/n, sempre più piccolo di σ².',
    ],
    tableTitle: (m) => `Medie sugli ${IT.int(m)} hacker, per n`,
    cols: { n: 'n', mean: 'Media delle M_n', meanZ: 'z', variance: 'Media delle s_n²', varianceZ: 'z', biased: 'Media di SS_n/n', biasedTheory: 'σ² (n - 1)/n' },
    meansChart: (m) => `La media delle ${IT.int(m)} medie campionarie contro μ, per n (scala logaritmica)`,
    variancesChart: (m) => `La media delle ${IT.int(m)} varianze campionarie, e di SS_n/n, contro σ², per n`,
    legendMeans: ['μ, con la fascia al 95% per la media di m medie', 'media delle M_n'],
    legendVariances: ['σ², con la fascia al 95%', 'media delle s_n²', 'σ² (n - 1)/n', 'media di SS_n/n'],
    facts: (s) => {
      const a = averageFacts(s);
      const F = IT;
      const where = (rows, key) => rows.map((r) => `n = ${F.int(r.n)}, z = ${F.num(r[key], 2)}`).join('; ');
      const outsideMeans = a.meansOutside.length === 0 ? 'nessuna è fuori dalla sua fascia al 95%' : `${a.meansOutside.length === 1 ? 'una è' : `${a.meansOutside.length} sono`} fuori dalla fascia al 95% (${where(a.meansOutside, 'meanZ')})`;
      const outsideVariances = a.variancesOutside.length === 0 ? 'nessuna è fuori dalla fascia' : `${a.variancesOutside.length === 1 ? 'una è' : `${a.variancesOutside.length} sono`} fuori dalla fascia (${where(a.variancesOutside, 'varianceZ')})`;
      return [
        `Le medie delle medie campionarie stanno su μ = ${F.sig(s.law.mu)} per ogni n: ${outsideMeans}. Le medie delle varianze campionarie stanno su σ² = ${F.sig(s.law.variance)}: ${outsideVariances}. Con ${a.count} valori di n ci si aspettano in media ${F.num(a.expectedOutside, 1)} uscite per puro caso, e i punti non sono indipendenti, perché a ogni n gli hacker sono gli stessi e le loro medie a n diversi condividono i primi punteggi.`,
        `Le medie di SS_n/n invece seguono σ² (n - 1)/n, non σ²: a n = ${F.int(a.first.n)} valgono ${F.num(a.first.biased, 4)} contro un valore atteso di ${F.num(a.first.biasedTheory, 4)}, a n = ${F.int(a.small.n)} ${F.num(a.small.biased, 4)} contro ${F.num(a.small.biasedTheory, 4)}, e la distanza da σ², che è σ²/n, si perde nel rumore solo per n grande (${F.num(a.last.bias, 4)} a n = ${F.int(a.last.n)}).`,
      ];
    },
  },
  comparison: {
    formulasTitle: 'Perché M_n e s_n² sono corrette',
    paras: (s) => {
      const F = IT;
      const c = s ? comparisonFacts(s) : null;
      return {
        before: [
          'La prima conclusione è che la media campionaria e la varianza campionaria sono stimatori corretti, cioè non distorti: per ogni n, anche per n = 2, E[M_n] = μ e E[s_n²] = σ². La simulazione non lo dimostra, ma lo mette alla prova m volte per ogni n e con quattro leggi diverse, e i test della sezione 3 non trovano differenze. La dimostrazione è breve: la media è lineare, e SS_n si scompone attorno a μ.',
        ],
        after: [
          'La seconda è il perché del divisore n - 1. Gli scarti si misurano da M_n e non da μ, e M_n è proprio il punto che rende minima la somma dei quadrati degli scarti: SS_n è sempre al più Σ (X_i - μ)², e in media più piccola esattamente di n Var(M_n) = σ². Una delle n informazioni è servita a stimare la media, e restano n - 1 gradi di libertà. Dividere per n - 1 compensa: è la correzione di Bessel. Dividere per n dà lo stimatore di massima verosimiglianza per dati normali, distorto di -σ²/n, come mostra l’ultima colonna della tabella.',
          'La terza è che la correttezza non dipende dalla legge: la dimostrazione usa solo l’indipendenza e momenti finiti, non la normalità, e infatti con tutte e quattro le leggi le medie cadono su μ e σ². Vale anche per la varianza della popolazione corretta di qualunque legge, mentre non vale per la deviazione standard: s_n è distorta verso il basso, perché la radice è concava (disuguaglianza di Jensen).',
          c
            ? `L’ultima è che la correttezza è una proprietà della media su molti campioni, non di un campione solo. A n = ${F.int(c.n)} la media delle varianze degli hacker è σ², ma il 90% degli hacker ha una varianza fra ${F.num(c.variance5, 2)} e ${F.num(c.variance95, 2)}, e solo il ${F.pct(c.withinVariance, 0)} sta entro il 10% da σ² (per la media il ${F.pct(c.withinMean, 0)}). Quanto una stima si allontana dal vero è la domanda della sezione 2.6, ed è quella che conta quando, come quasi sempre, il campione è uno solo.`
            : 'L’ultima è che la correttezza è una proprietà della media su molti campioni, non di un campione solo: quanto una stima si allontana dal vero è la domanda della sezione 2.6.',
        ],
      };
    },
  },
  spread: {
    intro: [
      'La consegna chiede di ripetere l’esperimento per diversi n e di guardare la variabilità delle medie e delle varianze campionarie. Le formule esatte sono queste:',
    ],
    formulasTitle: 'La variabilità di M_n e s_n²',
    afterFormulas: [
      'Entrambe le varianze scendono come 1/n, e le deviazioni standard, cioè l’errore tipico di una stima fatta da un solo hacker, come 1/√n: per dimezzare l’errore servono quattro volte i sistemi. Le due statistiche sono consistenti: si concentrano sul valore vero quando n cresce. La varianza di s_n² però dipende da μ₄: con code pesanti la stima di σ² è molto più incerta di quella di μ, e la formula 2σ⁴/(n - 1) dei libri vale soltanto per dati normali, con curtosi in eccesso nulla.',
    ],
    axisLabel: 'Asse',
    axisNames: { fixed: 'Uguale per ogni n', own: 'Di questo n' },
    nLabel: (n) => `n = ${IT.int(n)} sistemi per hacker`,
    play: 'Scorri gli n',
    pause: 'Pausa',
    histMean: (n, m) => `Le ${IT.int(m)} medie campionarie a n = ${IT.int(n)}`,
    histVariance: (n, m) => `Le ${IT.int(m)} varianze campionarie a n = ${IT.int(n)}`,
    legendHist: ['hacker', 'normale della teoria'],
    histNote: (stats, theory, quantity) => {
      const F = IT;
      const isMean = quantity === 'mean';
      return `Media ${F.num(stats.mean, 4)} (teoria ${F.num(isMean ? theory.mean : theory.variance, 4)}), deviazione standard ${F.num(Math.sqrt(stats.variance), 4)} (teoria ${F.num(isMean ? theory.sdMean : theory.sdVariance, 4)}), asimmetria ${F.num(stats.skewness, 3)}${isMean ? ` (teoria ${F.num(theory.skewMean, 3)})` : ''}.`;
    },
    chartTitle: 'Varianza delle medie e delle varianze campionarie fra gli hacker, per n (scale logaritmiche)',
    legend: ['Var(M_n) simulata', 'σ²/n', 'Var(s_n²) simulata', 'μ₄/n - σ⁴ (n - 3)/(n (n - 1))', '2σ⁴/(n - 1), dati normali'],
    tableTitle: 'La variabilità fra gli hacker, per n',
    cols: { n: 'n', varMean: 'Var(M_n)', varMeanTheory: 'σ²/n', varVariance: 'Var(s_n²)', varVarianceTheory: 'Teoria', normalVariance: 'Dati normali', skewMean: 'Asimmetria delle M_n' },
    facts: (s) => {
      const f = spreadFacts(s);
      const F = IT;
      const L = s.law;
      const ratio = f.normalRatioSmall;
      return [
        `Sulla scala logaritmica le due varianze sono rette di pendenza -1: i minimi quadrati danno ${F.num(f.meanSlope.slope, 3)} ± ${F.num(f.meanSlope.slopeError, 3)} per le medie e ${F.num(f.varianceSlope.slope, 3)} ± ${F.num(f.varianceSlope.slopeError, 3)} per le varianze (da n = ${SMALL_N}). Da n = ${F.int(f.first.n)} a n = ${F.int(f.last.n)} la deviazione standard delle medie si riduce di ${F.num(f.shrinkMean, 1)} volte e quella delle varianze di ${F.num(f.shrinkVariance, 1)}, contro √(${F.int(f.last.n)}/${F.int(f.first.n)}) = ${F.num(Math.sqrt(f.last.n / f.first.n), 1)}: a n piccolo la varianza di s_n² non è ancora proporzionale a 1/n.`,
        `Per la legge scelta, con curtosi in eccesso ${F.num(L.kurtosis, 3)}, la varianza di s_n² a n = ${F.int(f.small.n)} è ${F.num(ratio, 3)} volte quella che avrebbero dati normali con la stessa σ²: ${Math.abs(ratio - 1) < 0.05 ? 'quasi la stessa, perché la curtosi è vicina a quella della normale' : ratio > 1 ? 'più grande, perché le code pesano più che nella normale' : 'più piccola, perché le code pesano meno che nella normale'}. Simulata vale ${F.sig(f.small.varVariance, 4)}, la teoria esatta dà ${F.sig(f.small.varVarianceTheory, 4)} e la formula dei dati normali ${F.sig(f.small.normalVariance, 4)}.`,
        `Con la larghezza cambia anche la forma: a n piccolo le medie hanno l’asimmetria dei punteggi divisa per √n (${F.num(f.first.skewMean, 3)} a n = ${F.int(f.first.n)}, teoria ${F.num(f.first.skewMeanTheory, 3)}) e le varianze sono ancora più asimmetriche (${F.num(f.first.skewVariance, 3)}); poi entrambe diventano normali, per il teorema del limite centrale, perché s_n² è una media di quadrati più un termine che svanisce. Con l’asse uguale per ogni n i due istogrammi si stringono; con l’asse di ogni n si vede la forma diventare una campana.`,
      ];
    },
  },
  inference: {
    intro: [
      'In pratica non si hanno m hacker ma uno solo: un campione di n osservazioni, da cui stimare μ e σ² senza conoscerli. I risultati delle sezioni 2.4-2.6 sono proprio ciò che rende possibile farlo, e dire quanto ci si può sbagliare:',
    ],
    list: [
      'correttezza: M_n e s_n² centrano in media il bersaglio qualunque sia la legge, quindi media e varianza si stimano senza conoscerla, e il divisore n - 1 rende corretta anche la stima della varianza;',
      'consistenza: le loro varianze tendono a zero come 1/n, quindi con abbastanza dati la stima di un solo campione è vicina al vero (legge dei grandi numeri);',
      'errore standard: Var(M_n) = σ²/n si stima con s_n²/n proprio perché s_n² è corretta, e s_n/√n è l’incertezza che accompagna ogni media: è il motivo per cui la varianza si calcola insieme alla media;',
      'distribuzione campionaria: per il teorema del limite centrale (M_n - μ)/(s_n/√n) è circa normale, e per dati normali è esattamente una t di Student con n - 1 gradi di libertà (Gosset, 1908). Da qui gli intervalli di confidenza M_n ± t s_n/√n e i test sulla media.',
    ],
    afterList: [
      'La simulazione mette alla prova l’intervallo più usato, M_n ± t_(0,975; n-1) s_n/√n: per ogni n conta per quanti hacker l’intervallo contiene μ. Il grafico mostra anche l’intervallo per σ² basato sul chi quadrato, da (n - 1) s_n²/χ²_(0,975; n-1) a (n - 1) s_n²/χ²_(0,025; n-1), che è esatto soltanto per dati normali.',
    ],
    coverageTitle: 'Quota di hacker il cui intervallo al 95% contiene il valore vero, per n',
    coverageLegend: ['95%', 'limite dell’intervallo χ² per n grande', 'intervallo t per μ', 'intervallo χ² per σ²'],
    scatterTitle: (n, m) => `Le ${IT.int(m)} coppie (M_n, s_n²) a n = ${IT.int(n)}`,
    scatterLegend: ['hacker', '(μ, σ²)', 'retta teorica di pendenza μ₃/σ²'],
    nLabel: (n) => `n = ${IT.int(n)} sistemi per hacker`,
    tableTitle: 'Gli intervalli e la correlazione fra media e varianza, per n',
    cols: { n: 'n', t: 'Copertura t', tQuantile: 't_(0,975; n-1)', chi2: 'Copertura χ²', corr: 'corr(M_n, s_n²)', corrTheory: 'Teoria' },
    facts: (s) => {
      const i = inferenceFacts(s);
      const F = IT;
      const L = s.law;
      const kappa = L.kurtosis + 3;
      const symmetric = Math.abs(L.mu3) < 1e-12;
      return [
        `L’intervallo t funziona per qualunque legge quando n cresce: a n = ${F.int(i.last.n)} contiene μ per il ${F.pct(i.last.t)} degli hacker. A n piccolo copre meno del dichiarato (${F.pct(i.first.t)} a n = ${F.int(i.first.n)}, ${F.pct(i.small.t)} a n = ${F.int(i.small.n)}), perché i punteggi non sono normali: ${symmetric ? 'con code più leggere della normale la t è solo approssimata' : 'con dati asimmetrici M_n e s_n sono correlate, e l’intervallo si allarga e si stringe insieme alla media che si sposta'}.${i.ties > 0 ? ` A n = 2 c’è anche un limite più semplice: con probabilità Σ p_k² = ${F.num(i.ties, 3)} i due punteggi sono uguali, s_2 = 0 e l’intervallo è un punto solo.` : ''}`,
        `L’intervallo χ² invece non migliora con n: la sua copertura tende a ${F.pct(i.limit)}, non al 95%, perché assume per s_n² una varianza relativa di 2/(n - 1), mentre è circa (κ - 1)/n con κ = μ₄/σ⁴ = ${F.num(kappa, 3)}. ${Math.abs(kappa - 3) < 0.1 ? 'Qui κ è vicino a 3, il valore della normale, e l’errore è piccolo; con altre leggi non lo è.' : kappa > 3 ? 'Con code più pesanti della normale copre meno del dichiarato.' : 'Con code più leggere della normale copre più del dichiarato, ed è inutilmente largo.'} La stima della media è robusta, quella della varianza no: per questo i test sulla varianza, come il test F, si usano con cautela fuori dalla normalità.`,
        `Il grafico a dispersione mostra un fatto meno noto: M_n e s_n² sono correlate, con Cov(M_n, s_n²) = μ₃/n, nulla solo per leggi simmetriche. Per la legge scelta la correlazione teorica a n = ${F.int(i.last.n)} è ${F.num(i.last.corrTheory, 3)} e quella simulata ${F.num(i.last.corr, 3)}; ${symmetric ? 'qui μ₃ = 0 e le due statistiche sono scorrelate, anche se non indipendenti.' : `un hacker con una media alta tende ad avere anche una varianza alta, lungo la retta di pendenza μ₃/σ² = ${F.num(i.slope, 3)}.`} Per dati normali M_n e s_n² sono indipendenti, una proprietà che caratterizza la normale (Lukacs, 1942) e su cui si regge la t di Student.`,
      ];
    },
  },
  tryDrag: {
    intro: [
      'Trascinate i punti con il mouse o con il dito: l’ultimo, in rosso, è il dato nuovo x_k (il cursore sotto lo sposta anche da tastiera). Sulla retta ci sono le due medie, M_(k-1) tratteggiata e M_k continua, e i due scarti del dato nuovo: δ in giallo e x_k - M_k in viola. In basso a sinistra il rettangolo che ha per lati i due scarti: la sua area è l’incremento di SS, ed è il quadrato δ × δ senza una striscia di 1/k, perché x_k - M_k = ((k - 1)/k) δ. A destra SS_(k-1) più quell’area, contro SS_k calcolata da capo: le due barre restano sempre lunghe uguali, ed è la formula di Welford.',
    ],
    sliderLabel: (k, v) => `Il dato nuovo x_${k} = ${v}`,
    add: 'Aggiungi un dato',
    remove: 'Togli l’ultimo',
    reset: 'Ripristina',
    legend: ['dati', 'dato nuovo x_k', 'M_(k-1) e M_k', 'δ = x_k - M_(k-1)', 'x_k - M_k', 'SS_(k-1)', 'SS_k calcolata da capo'],
    caption: (st) => {
      const F = IT;
      return `Dato nuovo x_${st.k} = ${F.sig(st.x, 4)}: la media passa da M_${st.k - 1} = ${F.sig(st.previousMean, 4)} a M_${st.k} = ${F.sig(st.mean, 4)}; δ = ${F.sig(st.delta, 4)}, x_${st.k} - M_${st.k} = ${F.sig(st.after, 4)}, incremento ${F.sig(st.increment, 4)}. SS_${st.k} = ${F.sig(st.previousSS, 4)} + ${F.sig(st.increment, 4)} = ${F.sig(st.previousSS + st.increment, 4)}, come il calcolo diretto Σ (x_i - M_${st.k})² = ${F.sig(st.direct, 4)}; varianza campionaria s² = ${F.sig(st.variance, 4)}.`;
    },
    after: [
      'Provate a portare il dato nuovo sopra la media vecchia: δ si annulla, il rettangolo sparisce e SS non cambia. Allontanatelo: l’area cresce come il quadrato della distanza, ed è per questo che un solo valore anomalo pesa tanto sulla varianza. Con molti dati la striscia 1/k diventa sottile e l’incremento è quasi δ².',
    ],
  },
  tryDigits: {
    intro: [
      'Il cursore sposta i dati di c = 10^0, ..., 10^15: la varianza esatta non cambia. Per ciascuna delle tre formule le cifre uguali a quelle del valore esatto sono in verde e le altre in rosso. Sotto, i due numeri enormi che la formula da manuale sottrae: in grigio le cifre iniziali che hanno in comune e che la sottrazione cancella, in rosso quelle che restano, già sporcate dagli arrotondamenti.',
    ],
    powerLabel: (e) => `Spostamento c = 10^${e}`,
    datasetLabel: 'Dati',
    datasets: { classic: '4, 7, 13, 16', scores: '1.000 punteggi' },
    rows: { naive: 'Formula da manuale', twoPass: 'Due passate', welford: 'Welford' },
    exact: (v) => `Valore esatto della varianza: ${IT.sig(v, 15)}`,
    right: (r) => (r === 0 ? 'nessuna cifra giusta' : r >= 16 ? 'tutte le cifre giuste' : `${r} cifre giuste su 16`),
    error: (e) => (e === 0 ? 'errore nullo' : `errore relativo ${IT.sci(e)}`),
    sumsTitle: 'Dentro la formula da manuale: Σx² e (Σx)²/n',
    sumLabels: ['Σx²', '(Σx)²/n'],
    common: (d, total) =>
      d === 0
        ? 'I due numeri non hanno cifre iniziali in comune: la sottrazione non perde niente.'
        : d >= total
          ? `I due numeri sono identici in tutte le ${total} cifre: la differenza vale zero, e con lei la varianza.`
          : `I due numeri hanno in comune le prime ${d} cifre su ${total}: la sottrazione le cancella, e alla differenza restano ${total - d} cifre, quelle già sporcate dagli arrotondamenti.`,
  },
  tryBessel: {
    intro: [
      'Ogni pressione estrae altri campioni di n punteggi dalla legge della sezione 2.1: il campione j sono i primi n punteggi dell’hacker j della simulazione. Il grafico segue, al crescere del numero di campioni, la media delle s² (blu) e quella di SS/n (rossa): la prima si avvicina a σ², la seconda a σ² (n - 1)/n, e la distanza fra le due è proprio ciò che la correzione di Bessel toglie. La fascia verde è dove la media delle s² deve stare al 95% se s² è corretta, e si stringe come 1/√(numero di campioni). Con n piccolo le due medie restano lontane, con n grande quasi si toccano.',
    ],
    nLabel: (n) => `n = ${n} punteggi per campione`,
    one: '+1 campione',
    hundred: '+100',
    thousand: '+1.000',
    play: 'Avvia',
    pause: 'Pausa',
    reset: 'Ricomincia',
    chartTitle: (n) => `Media delle varianze di campioni di ${n} punteggi, al crescere del numero di campioni (scala logaritmica)`,
    legend: ['σ², con la fascia al 95%', 'σ² (n - 1)/n', 'media delle s²', 'media di SS/n'],
    status: (st, law) => {
      const F = IT;
      if (st.count === 0) return 'Nessun campione ancora: premete +1 campione o Avvia.';
      return `${F.int(st.count)} campioni: media delle s² ${F.num(st.sumVariance / st.count, 4)} (σ² = ${F.sig(law.variance, 4)}), media di SS/n ${F.num(st.sumBiased / st.count, 4)} (σ² (n - 1)/n = ${F.sig((law.variance * (st.n - 1)) / st.n, 4)}).`;
    },
    last: (sample) => {
      const F = IT;
      const shown = sample.values.slice(0, 12).map((v) => F.sig(v, 3)).join(', ');
      return `Ultimo campione (hacker ${F.int(sample.j + 1)}): ${shown}${sample.values.length > 12 ? ', ...' : ''}; media ${F.num(sample.mean, 3)}, s² ${F.num(sample.variance, 3)}, SS/n ${F.num(sample.biased, 3)}.`;
    },
    limit: 'Raggiunto il massimo di 20.000 campioni: Ricomincia o cambiate n.',
  },
  tryIntervals: {
    intro: [
      'Cento campioni di n punteggi, cioè cento hacker con n sistemi, e per ciascuno l’intervallo di confidenza: in verde quelli che contengono il valore vero (la linea tratteggiata), in rosso quelli che lo mancano. Un intervallo al 95% dovrebbe mancarlo circa 5 volte su 100. Si possono cambiare n, il livello, il parametro (μ con la t di Student, σ² con il chi quadrato) e la legge, e vedere quando la promessa è mantenuta; Nuovi 100 campioni passa ai cento hacker successivi e somma i conteggi.',
      'Due prove da fare: con la legge iniziale e n = 2 l’intervallo per μ manca il valore vero più spesso del dichiarato; con la legge uniforme l’intervallo per σ² non lo manca quasi mai, perché con code più leggere della normale è troppo largo.',
    ],
    nLabel: (n) => `n = ${n} punteggi per campione`,
    levelLabel: 'Livello',
    paramLabel: 'Parametro',
    params: { mean: 'μ (t di Student)', variance: 'σ² (chi quadrato)' },
    lawLabel: 'Legge',
    newBatch: 'Nuovi 100 campioni',
    chartTitle: (b, lawName) => `Intervalli al ${IT.pct(b.level, 0)} per ${b.param === 'mean' ? 'μ' : 'σ²'} con n = ${b.n}, ${lawName}`,
    legend: ['contiene il valore vero', 'manca il valore vero', 'valore vero'],
    counts: (misses, level, total, totalMisses) =>
      `In questa estrazione ${misses} intervalli su 100 mancano il valore vero (attesi circa ${Math.round(100 * (1 - level))}); in tutte le estrazioni con queste impostazioni ${IT.int(totalMisses)} su ${IT.int(total)}, cioè il ${IT.pct(totalMisses / total, 1)}, contro il ${IT.pct(1 - level, 0)} dichiarato.`,
  },
  stats: {
    verdict: { reject: 'H₀ rifiutata', notReject: 'H₀ non rifiutata' },
    expected: { reject: 'atteso: rifiuto', notReject: 'atteso: nessun rifiuto', either: 'dipende dalla potenza del test' },
    testLine: testLineIt,
    groups: { sim: 'Generatore', averages: 'Medie', spread: 'Variabilità', inference: 'Inferenza' },
    labels: {
      sim: {
        scores: 'I punteggi di tutti gli hacker seguono la legge scelta (χ²)',
        lag: 'Punteggi consecutivi scorrelati (z)',
      },
      averages: {
        meanSmall: `La media delle M_${SMALL_N} è μ (z)`,
        meanLarge: 'La media delle M_n all’ultimo n è μ (z)',
        varianceSmall: `La media delle s_${SMALL_N}² è σ² (z)`,
        varianceLarge: 'La media delle s_n² all’ultimo n è σ² (z)',
        biased: `La media di SS_${SMALL_N}/${SMALL_N} è σ² (z): falsa di proposito, SS_n/n è distorta`,
      },
      spread: {
        spreadMean: 'All’ultimo n la varianza delle M_n è σ²/n (z, grandi campioni)',
        spreadVariance: 'All’ultimo n la varianza delle s_n² è μ₄/n - σ⁴ (n - 3)/(n (n - 1)) (z, grandi campioni)',
        normalTheory: `A n = ${SMALL_N} la varianza delle s_n² è 2σ⁴/(n - 1), come per dati normali (z)`,
        normalSmall: `Le M_${SMALL_N} hanno asimmetria e curtosi di una normale (Jarque-Bera)`,
        normalLarge: 'All’ultimo n le M_n hanno asimmetria e curtosi di una normale (Jarque-Bera)',
        varianceNormal: 'All’ultimo n le s_n² hanno asimmetria e curtosi di una normale (Jarque-Bera)',
      },
      inference: {
        coverage: `All’ultimo n l’intervallo t al ${IT.pct(CONFIDENCE, 0)} contiene μ per il ${IT.pct(CONFIDENCE, 0)} degli hacker (z)`,
        correlation: 'All’ultimo n la correlazione fra M_n e s_n² è quella della teoria (Fisher)',
        independence: 'All’ultimo n M_n e s_n² sono scorrelate, come per dati normali (Fisher)',
      },
    },
  },
  tests: {
    intro: (s) => `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. Il generatore si controlla con la legge dei punteggi e con la correlazione fra punteggi consecutivi; la correttezza con le medie delle medie e delle varianze a n = ${SMALL_N} e a n = ${IT.int(s.params.n)}; la variabilità con le formule esatte e con la normalità delle due statistiche; l’inferenza con la copertura dell’intervallo t e con la correlazione fra media e varianza. Alcune ipotesi nulle sono false di proposito (SS_n/n è distorta, media e varianza non sono scorrelate per leggi asimmetriche, a n = ${SMALL_N} le medie non sono ancora normali), e il loro rifiuto è atteso.`,
    cols: { subject: 'Oggetto', hypothesis: 'Ipotesi nulla H₀', p: 'p-value', verdict: 'Esito', expected: 'Lettura' },
    after: (sum) => {
      const out = [`${sum.rejected} test su ${sum.count} rifiutano l’ipotesi nulla, ${sum.asExpected === sum.count ? 'tutti come atteso' : `${sum.asExpected} su ${sum.count} come atteso`}.`];
      const expectedFalse = IT.num(sum.nulls * SIGNIFICANCE, 2);
      const which = sum.falseRejections.map((t) => IT.pval(t.result.pValue)).join(', ');
      out.push(
        `Fra i ${sum.nulls} test con un’ipotesi nulla vera, al livello ${IT.num(SIGNIFICANCE, 2)} ci si aspettano in media ${expectedFalse} rifiuti per puro caso: ${sum.falseRejections.length === 0 ? 'qui non ce ne sono' : `qui ${sum.falseRejections.length === 1 ? 'ce n’è uno' : `ce ne sono ${sum.falseRejections.length}`} (p = ${which})`}. La correzione di Holm per i test multipli, che tiene sotto il 5% la probabilità anche di un solo rifiuto sbagliato, confronta il p-value più piccolo con ${IT.num(SIGNIFICANCE, 2)}/${sum.nulls} = ${IT.num(sum.holmThreshold, 4)}, il successivo con ${IT.num(SIGNIFICANCE, 2)}/${sum.nulls - 1} e così via: ${sum.holm === 0 ? 'nessun rifiuto sopravvive' : `${sum.holm === 1 ? 'sopravvive un rifiuto' : `sopravvivono ${sum.holm} rifiuti`}, da guardare come un possibile difetto`}.`,
      );
      out.push('Un’osservazione vale per tutti: con milioni di punteggi i test sui punteggi stessi vedono differenze minuscole, mentre quelli sulle medie degli hacker hanno m osservazioni e vedono differenze di circa 2/√m volte la deviazione standard della statistica. Significatività ed entità di una differenza sono due domande diverse: il rifiuto della normalità a n = 10 dice che la differenza c’è, non che è grande.');
      return out;
    },
  },
  history: {
    intro: 'Dai minimi quadrati di Gauss alle formule ricorsive di questa pagina, le idee usate nell’homework in ordine cronologico.',
    legend: { task: 'usato in questa pagina', context: 'contesto' },
    events: [
      { year: '1809', task: true, title: 'Gauss', text: 'Nella Theoria motus fonda i minimi quadrati: la media aritmetica è il valore che rende minima la somma dei quadrati degli scarti, la proprietà che la sezione 2.5 usa per spiegare il divisore n - 1.' },
      { year: '1810', task: true, title: 'Laplace', text: 'Il teorema del limite centrale per somme di variabili indipendenti: la ragione per cui le medie e le varianze degli hacker diventano normali al crescere di n.' },
      { year: '1823', task: true, title: 'Gauss', text: 'Nella Theoria combinationis observationum dimostra che la somma dei quadrati dei residui, divisa per il numero di osservazioni meno quello dei parametri stimati, è una stima corretta della varianza: con un solo parametro, la media, il divisore è n - 1. La correzione porta il nome di Bessel, che la usava nel calcolo degli errori delle osservazioni astronomiche.' },
      { year: '1853', task: true, title: 'Bienaymé', text: 'La varianza di una somma di variabili indipendenti è la somma delle varianze: da qui Var(M_n) = σ²/n, la legge della sezione 2.6.' },
      { year: '1900', task: true, title: 'Pearson', text: 'Il test chi quadrato di adattamento, usato qui per controllare i punteggi del generatore.' },
      { year: '1908', task: true, title: 'Gosset ("Student")', text: 'In The probable error of a mean, scritto da chimico della birreria Guinness con piccoli campioni, ricava la legge di (M_n - μ)/(s_n/√n) per dati normali: la t di Student dell’intervallo della sezione 2.7.' },
      { year: '1921', task: true, title: 'Fisher', text: 'La trasformazione z = atanh(r) del coefficiente di correlazione, approssimativamente normale con varianza 1/(m - 3): il test sulla correlazione fra media e varianza.' },
      { year: '1922', task: true, title: 'Fisher', text: 'On the mathematical foundations of theoretical statistics: consistenza, efficienza e sufficienza degli stimatori, e i gradi di libertà, il concetto dietro al divisore n - 1.' },
      { year: '1937', task: true, title: 'Neyman', text: 'La teoria degli intervalli di confidenza: un intervallo calcolato dal campione che contiene il parametro con una probabilità fissata, il 95% della sezione 2.7.' },
      { year: '1942', task: true, title: 'Lukacs', text: 'Se media e varianza campionarie sono indipendenti, la legge è normale: per qualunque altra legge sono dipendenti, e per una legge asimmetrica anche correlate, come mostra il grafico a dispersione.' },
      { year: '1949', task: true, title: 'Metropolis e Ulam', text: 'The Monte Carlo Method: stimare probabilità e valori attesi simulando molti campioni, il metodo della Part 2.' },
      { year: '1962', task: true, title: 'Welford', text: 'In Note on a method for calculating corrected sums of squares and products (Technometrics) propone l’aggiornamento di media e somma dei quadrati dato per dato, senza la cancellazione della formula da manuale: le formule della Part 1.' },
      { year: '1969', task: true, title: 'Knuth', text: 'The Art of Computer Programming, vol. 2, riporta le ricorsioni per media e deviazione standard citando Welford, nella parte sull’accuratezza dell’aritmetica in virgola mobile: la formula per la media della consegna.' },
      { year: '1979', task: true, title: 'Chan, Golub e LeVeque; Holm', text: 'Chan, Golub e LeVeque generalizzano Welford all’unione di due gruppi di dati (l’algoritmo a coppie), e nel 1983 ne analizzano la stabilità; Holm propone la correzione per i test multipli usata nella sezione 3.' },
      { year: '1980', task: true, title: 'Jarque e Bera', text: 'Il test di normalità basato sull’asimmetria e sulla curtosi, usato per le medie e le varianze degli hacker.' },
      { year: '1985', task: true, title: 'IEEE 754', text: 'Lo standard dell’aritmetica in virgola mobile: i double a 53 bit di mantissa con cui la sezione 1.5 misura la cancellazione.' },
      { year: '1996', task: false, title: 'Alon, Matias e Szegedy', text: 'La teoria degli algoritmi di flusso: quali statistiche si possono calcolare in una passata con poca memoria. Media e varianza sono il caso più semplice, e Welford la sua soluzione esatta.' },
      { year: '2014-2018', task: true, title: 'SplitMix e xoshiro', text: 'Steele, Lea e Flood pubblicano SplitMix (2014), Blackman e Vigna i generatori xoshiro (2018): sono i numeri casuali di questa pagina, come dell’Homework #3.' },
    ],
    after: 'La storia procede su due binari che questo homework unisce. Quello della stima (Gauss, Student, Fisher, Neyman) dice che cosa valgono M_n e s_n² come stimatori; quello del calcolo (Welford, Knuth, Chan, Golub e LeVeque) dice come calcolarli bene con una macchina, in una passata e senza perdere cifre. Le formule ricorsive della Part 1 stanno all’incrocio.',
  },
  conclusion: (s) => {
    const F = IT;
    const first = 'Part 1. Le formule di Welford si ricavano con lo stesso procedimento di quella di Knuth per la media: si scrive la grandezza dei primi k dati con quella dei primi k - 1 e lo scarto del dato nuovo. Ne vengono SS_k = SS_(k-1) + (x_k - M_(k-1))(x_k - M_k) e s_k² = SS_k/(k - 1), con la stessa forma per la varianza. Nel codice sono tre righe che lavorano in memoria costante e in una sola passata, e che, a differenza della formula da manuale, non perdono tutte le cifre quando i dati hanno un grande valore di fondo.';
    if (!s) return [first, 'Part 2. Con m hacker e n sistemi, la media delle medie campionarie coincide con μ e la media delle varianze campionarie con σ², per ogni n: sono stimatori corretti, e la loro variabilità scende come 1/n.'];
    const f = spreadFacts(s);
    const i = inferenceFacts(s);
    const small = s.points.find((pt) => pt.n === SMALL_N) || s.points[0];
    return [
      first,
      `Part 2. Con ${F.int(s.m)} hacker e fino a ${F.int(s.params.n)} sistemi, la media delle medie campionarie coincide con μ e la media delle varianze campionarie con σ² entro l’errore della simulazione, per ogni n e con tutte e quattro le leggi: sono stimatori corretti, mentre SS_n/n sottostima σ² di σ²/n. Al crescere di n la variabilità di entrambe scende come 1/n (pendenze ${F.num(f.meanSlope.slope, 3)} e ${F.num(f.varianceSlope.slope, 3)} sulla scala logaritmica), quindi l’errore della stima di un solo hacker scende come 1/√n; la varianza della varianza dipende dalla curtosi, e solo per dati normali vale 2σ⁴/(n - 1).`,
      `Per l’inferenza questi risultati sono la base: permettono di stimare μ e σ² da un solo campione, di accompagnare la stima con il suo errore standard s_n/√n e di costruire intervalli e test. La simulazione ne mostra anche i limiti: l’intervallo t per μ arriva al 95% con ogni legge (${F.pct(i.last.t)} a n = ${F.int(i.last.n)}), quello per σ² senza normalità converge a ${F.pct(i.limit)}; e media e varianza sono correlate quando la legge è asimmetrica.`,
      `Per hacker e sistemi la lezione è pratica. Il punteggio medio di un hacker su pochi sistemi dice poco: a n = ${F.int(small.n)} la sua deviazione standard è ${F.num(small.theory.sdMean, 2)}, contro una media di ${F.num(s.law.mu, 2)}. Ma l’incertezza si conosce, e scende con la radice del numero di tentativi. E stimare la variabilità di un hacker, per esempio per distinguere un attaccante costante da uno che alterna successi e fallimenti, richiede molti più dati che stimarne la media.`,
    ];
  },
  distNames: { outcome: 'Esito HW3 + punteggio', binomial: `Bin(${BINOMIAL.trials}; ${IT.plain(BINOMIAL.q)})`, uniform: 'Uniforme 0-10', beta: `Beta(${BETA.a}, ${BETA.b}) × 10` },
  quantityNames: { mean: 'M_k', variance: 's_k²' },
  tips: {
    trajectory: (hit, name) =>
      hit.kind === 'bin'
        ? `${name} fra ${IT.num(hit.from, 3)} e ${IT.num(hit.to, 3)} al punteggio ${IT.int(hit.k)}: ${IT.int(hit.count)} hacker su ${IT.int(hit.sample)}, ${IT.num(hit.expected, 1)} attesi dalla normale`
        : `Punteggio ${IT.int(hit.step)}: ${name} dell’hacker 1 ${IT.num(hit.first, 4)}; valore vero ${IT.num(hit.mean, 4)}, fascia fra ${IT.num(hit.mean - 2 * hit.sd, 4)} e ${IT.num(hit.mean + 2 * hit.sd, 4)}`,
    step: (r) => (r.k === 1 ? `Passo 1: x = ${IT.sig(r.x)}, M = ${IT.sig(r.mean)}, SS = 0` : `Passo ${r.k}: x = ${IT.sig(r.x)}, δ = ${IT.sig(r.delta)}, M = ${IT.sig(r.mean)}, SS = ${IT.sig(r.ss)}, s² = ${IT.sig(r.variance)}`),
    stability: (r) => `c = 10^${r.power}: errore relativo ${IT.sci(r.errors.naive)} (manuale), ${IT.sci(r.errors.twoPass)} (due passate), ${IT.sci(r.errors.welford)} (Welford)`,
    score: (b, discrete) => {
      const where = discrete ? `Punteggio ${b.k}` : `Da ${b.k} a ${b.k + 1}`;
      return b.share === null ? `${where}: legge ${IT.pct(b.prob, 2)}` : `${where}: simulazione ${IT.pct(b.share, 3)}, legge ${IT.pct(b.prob, 3)}`;
    },
    mean: (pt, law, m) => `n = ${IT.int(pt.n)}: media delle M_n ${IT.num(pt.meanStats.mean, 4)}, μ = ${IT.sig(law.mu)}, fascia ± ${IT.num(1.959963984540054 * pt.theory.sdMean / Math.sqrt(m), 4)}`,
    variance: (pt, law, m) => `n = ${IT.int(pt.n)}: media delle s_n² ${IT.num(pt.varStats.mean, 4)}, σ² = ${IT.sig(law.variance)} (fascia ± ${IT.num(1.959963984540054 * pt.theory.sdVariance / Math.sqrt(m), 4)}); media di SS_n/n ${IT.num(pt.biased, 4)}, attesa ${IT.num(pt.theory.biased, 4)}`,
    spread: (r) => `n = ${IT.int(r.n)}: Var(M_n) ${IT.small(r.varMean)} (teoria ${IT.small(r.varMeanTheory)}), Var(s_n²) ${IT.small(r.varVariance)} (teoria ${IT.small(r.varVarianceTheory)}, dati normali ${IT.small(r.normalVariance)})`,
    bin: (from, to, share, normal) => `Da ${IT.sig(from, 4)} a ${IT.sig(to, 4)}: hacker ${IT.pct(share, 2)}${normal === null ? '' : `, normale ${IT.pct(normal, 2)}`}`,
    coverage: (r) => `n = ${IT.int(r.n)}: intervallo t ${IT.pct(r.t, 2)} (t = ${IT.num(r.tQuantile, 3)}), intervallo χ² ${IT.pct(r.chi2, 2)}`,
    hacker: (j, mean, variance) => `Hacker ${IT.int(j)}: M_n = ${IT.num(mean, 4)}, s_n² = ${IT.num(variance, 4)}`,
    bessel: (count, variance, biased) => `${IT.int(count)} campioni: media delle s² ${IT.num(variance, 4)}, media di SS/n ${IT.num(biased, 4)}`,
    interval: (r, param) => `Hacker ${IT.int(r.hacker)}: media ${IT.num(r.mean, 3)}, s² ${IT.num(r.variance, 3)}; intervallo per ${param === 'mean' ? 'μ' : 'σ²'} da ${IT.num(r.lo, 3)} a ${IT.num(r.hi, 3)}, ${r.ok ? 'contiene' : 'manca'} il valore vero`,
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline, con le stesse formule, simulazioni e animazioni. Con node homework4.js stampa nel terminale le formule passo per passo, la stabilità, le tabelle, un istogramma e i test; --dist, --p, --n, --m, --seed e --data cambiano i parametri.',
    contents: 'Contenuto: index.html, style.css, homework4.js (formule di Welford, generatore, simulazione, statistica, grafici e animazione), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework4',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Le formule ricorsive di Welford, e la media e la varianza campionarie di m hacker su n sistemi.',
    course: 'Statistics, laurea magistrale in Cybersecurity, Sapienza Università di Roma',
    online: 'Versione online',
    noscript: 'Questo programma ha bisogno di JavaScript.',
  },
};

// ---------------------------------------------------------------------------
// ENGLISH
// ---------------------------------------------------------------------------

const EN = formatters('.', ',', 'n/a', '×');

function testLineEn(t) {
  const F = EN;
  switch (t.kind) {
    case 'chi2':
      return `χ² = ${F.num(t.chi2, 1)} over ${F.int(t.classes)} classes (${F.int(t.df)} degrees of freedom), p = ${F.pval(t.pValue)}`;
    case 'mean':
      return `mean ${F.num(t.mean, 5)} against ${F.num(t.expected, 5)}, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'variance':
      return `variance ${F.sig(t.variance, 5)} against ${F.sig(t.expected, 5)} (ratio ${F.num(t.ratio, 4)}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'jb':
      return `skewness ${F.num(t.skewness, 3)}, excess kurtosis ${F.num(t.excessKurtosis, 3)}, JB = ${F.num(t.statistic, 2)} (χ² with 2 degrees of freedom), p = ${F.pval(t.pValue)}`;
    case 'proportion':
      return `share ${F.pct(t.rate, 2)} against ${F.pct(t.expected, 0)} over ${F.int(t.m)} hackers, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'correlation':
      return `correlation ${F.num(t.r, 4)} against ${F.num(t.expected, 4)} over ${F.int(t.m)} hackers (Fisher’s transformation), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'lag':
      return `correlation ${F.num(t.r, 5)} over ${F.int(t.pairs)} pairs of consecutive scores, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

function stabilityEn(f) {
  const F = EN;
  const at = (power) => `c = ${F.pow(power)}`;
  const naive = `The textbook formula loses the sixth significant digit from ${at(f.naive.micro)} and all of them from ${at(f.naive.total)}: the error exceeds 100%${f.negative ? ', and the variance comes out wrong even in its sign' : ''}.`;
  const welford = f.welford.micro === null ? `Welford stays below a relative error of 10^-6 up to ${at(f.maxPower)}.` : `Welford stays below a relative error of 10^-6 up to ${at(f.welford.micro - 1)}, and at ${at(f.maxPower)} it is off by ${F.pct(f.welford.last, 1)}.`;
  const twoPass = f.twoPass.micro === null ? `The two passes stay exact up to ${at(f.maxPower)}.` : `The two passes stay below 10^-6 up to ${at(f.twoPass.micro - 1)} and at ${at(f.maxPower)} are off by ${F.pct(f.twoPass.last, 1)}: once c n exceeds 2^53 ≈ 9 × 10^15 the sum of the data is rounded too, and the mean from which the deviations start is wrong by a few units.`;
  return [`The chart uses the first ${F.int(f.size)} scores of hacker 1 of Part 2 (exact variance ${F.num(f.exact, 6)}) shifted by c = 10^0, ..., ${F.pow(f.maxPower)}. ${naive} ${welford} ${twoPass}`];
}

const en = {
  fmt: EN,
  formulas: { knuth: KNUTH_FORMULAS, ss: SS_FORMULAS, variance: VARIANCE_FORMULAS, unbiased: UNBIASED_FORMULAS, spread: spreadFormulas('for large n', 'for normal data, μ₄ = 3σ⁴') },
  ui: {
    index: 'Contents',
    indexTitle: 'Homework contents',
    close: 'Close',
    backToTop: 'Back to top',
    computing: 'Simulation running...',
    language: 'Language',
    error: (m) => `Error: ${m}`,
  },
  sections: {
    assignment: '0. The assignment',
    part1: 'Part 1 - Welford’s recurrence formulas',
    knuth: '1.1 Knuth’s formula for the mean',
    ss: '1.2 The sum of squares: Welford’s formula',
    variance: '1.3 The variance',
    steps: '1.4 Step by step',
    stability: '1.5 Numerical stability',
    checks: '1.6 Checks',
    part2: 'Part 2 - Sampling mean and variance',
    scores: '2.1 The distribution of the scores',
    input: '2.2 Hackers, systems and seed',
    trajectories: '2.3 The trajectories, score after score',
    averages: '2.4 The averages over the hackers',
    comparison: '2.5 What the comparison says',
    spread: '2.6 Variability as n grows',
    inference: '2.7 Why it matters for inferential statistics',
    tryDrag: 'Try it: drag the data',
    tryDigits: 'Try it: the digits that get lost',
    tryBessel: 'Try it: Bessel live',
    tryIntervals: 'Try it: 100 confidence intervals',
    tests: '3. Summary of the statistical tests',
    history: '4. Historical context',
    conclusion: '5. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment has two parts. Part 1 asks to derive Welford’s recurrence formulas for the sum of squares (SS) and for the variance, following the same approach as Knuth’s recurrence formula for the mean, and to write the code, whose core should take about three lines. Part 2 extends Homework #3: every penetration attempt gets a score between 0 and 10, drawn from a fixed distribution of one’s choice with mean μ and variance σ²; m hackers attack n systems each, and every hacker computes with Welford’s formulas the sampling mean and variance of its n scores. Over the m hackers, the average of the sampling means is compared with μ and the average of the sampling variances with σ², the conclusions and their use in inferential statistics are discussed, and the experiment is repeated for several n, to see how the variability of the sampling means and variances changes.',
      'Part 1 derives the formulas step by step, animates them on data chosen by the reader and measures their numerical stability against the textbook formula; the code asked for, in three lines, is in the downloadable program at the bottom of the page. Part 2 chooses the distribution of the scores, simulates the hackers, compares the averages with μ and σ², answers the three questions of the assignment (sections 2.5, 2.6 and 2.7) and connects the results to inference. Section 3 summarizes the statistical tests, section 4 places the ideas in time and section 5 draws the conclusions. Every number is computed in the browser, and the downloadable program prints the same ones.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned. The only change is the dash of the two titles, written "-" as everywhere on this site.',
  },
  part1: {
    intro: [
      'The mean and the variance of x_1, x_2, ... can be computed in two ways: keeping all the data and making two passes (the mean first, then the deviations from it), or updating a few numbers with every new value, without keeping the data. The second way is needed when the data arrive as a stream (a sensor, a log, the traffic of a network) or are too many for the memory, and it is the one of the assignment. A recurrence formula says how to go from the statistic of the first k - 1 values to that of the first k using only the new value x_k.',
    ],
  },
  knuth: {
    intro: [
      'Let M_k = (x_1 + ... + x_k)/k be the mean of the first k values. Instead of keeping the sum, it is written with the previous mean: x_1 + ... + x_(k-1) = (k - 1) M_(k-1). It is enough to separate the new value from the others:',
    ],
    formulasTitle: 'The mean, from k - 1 to k values',
    after: [
      'The new mean is the old one corrected by a fraction 1/k of the deviation δ_k = x_k - M_(k-1) between the new value and the old mean. It is the recurrence that Knuth gives in The Art of Computer Programming (vol. 2, § 4.2.2), and with M_0 = 0 it also holds for k = 1. The approach has three steps, which repeat unchanged for SS: write the quantity of the first k values with that of the first k - 1, isolate the contribution of the new value, express everything with the deviation δ_k.',
      'Unlike the sum, the running mean stays as large as the data, it does not grow with k, and the correction δ_k/k keeps shrinking: after many values a new one moves the mean only a little. It is the same update as the algorithms with a decreasing step, such as the stochastic approximation of Robbins and Monro.',
    ],
  },
  ss: {
    intro: [
      'Let SS_k = Σ_(i≤k) (x_i - M_k)² be the sum of the squared deviations of the first k values from their mean. Same approach: separate the first k - 1 values from the new one, and write every deviation from the new mean as a deviation from the old mean minus the shift of the mean, which by Knuth’s formula is M_k - M_(k-1) = δ_k/k.',
    ],
    formulasTitle: 'The sum of squares, from k - 1 to k values',
    after: [
      'The last line is Welford’s formula (1962): the increment of SS is the product of the two deviations of the new value, before and after the update of the mean, because x_k - M_k = ((k - 1)/k) δ_k. The two factors always have the same sign, so every increment is ≥ 0 and SS cannot become negative, which the textbook formula does not guarantee (section 1.6).',
      'The same formula also follows from the decomposition SS_k = Σ x_i² - k M_k²: subtracting the one of the first k - 1 values and using k M_k = (k - 1) M_(k-1) + x_k leaves SS_k - SS_(k-1) = x_k² - k M_k² + (k - 1) M_(k-1)² = (x_k - M_(k-1))(x_k - M_k). The first route, though, shows why it works: the deviations from the old mean sum to zero, so moving the mean adds to SS only a term in δ_k².',
    ],
  },
  variance: {
    intro: [
      'The sample variance of the first k values is s_k² = SS_k/(k - 1), for k ≥ 2; the population variance, which is also the maximum likelihood estimator for normal data, is v_k = SS_k/k. Dividing Welford’s formula gives their recurrences, in the same form as Knuth’s:',
    ],
    formulasTitle: 'The two variances, from k - 1 to k values',
    after: [
      'The population variance is updated exactly like a mean: it is the running mean of the terms (x_k - M_(k-1))(x_k - M_k), and its recurrence is Knuth’s applied to them. The sample variance has the extra factor (k - 2)/(k - 1), which comes from the divisor k - 1; with two values it is s_2² = δ_2²/2 = (x_2 - x_1)²/2.',
      'It is better to update M and SS and divide only when the variance is needed: one division less per step, SS makes sense even when the variance is not defined yet (k = 1), and both variances come from the same SS. Why the right divisor is k - 1, Bessel’s correction, is the heart of Part 2: section 2.5 proves it and the simulation checks it.',
      'The three update formulas, δ_k = x_k - M_(k-1), M_k = M_(k-1) + δ_k/k and SS_k = SS_(k-1) + δ_k (x_k - M_k), are the whole algorithm: the third uses the mean already updated by the second, and that is how the product contains both deviations, before and after. Written in JavaScript they are the three lines the assignment asks for: they are in the function welford() of homework4.js, in the program of the section "Download the code" at the bottom of the page, and they are the same ones the page runs in the table of section 1.4, in the animation of section 2.3 and in the simulation of Part 2, once for every score of every hacker.',
      'The cost is constant per value and in memory: three numbers (k, M and SS) are enough for any n, and the mean and the variance can be read at every step. With the scores of a hacker arriving one system after the other, they are available at any time without going back to the data: this is what Part 2 uses to get the results of every n from a single simulation.',
      'Two partial results can also be merged, for example those computed in parallel on two parts of the data: with n_A and n_B values, n = n_A + n_B and δ = M_B - M_A, the mean is M_A + δ n_B/n and the sum of squares SS_A + SS_B + δ² n_A n_B/n (Chan, Golub and LeVeque, 1979). With n_B = 1 it is Welford’s formula again.',
    ],
  },
  steps: {
    intro: [
      'The table and the chart apply the three update formulas to the data of the field, one value at a time. For every step k: the value x_k, the deviation δ_k = x_k - M_(k-1) from the old mean, the new mean M_k, the deviation x_k - M_k from the new mean, their product (the increment of SS), SS_k and the sample variance s_k². In the chart the dots are the data and the line the running mean, with the band M_k ± s_k; at the highlighted step the yellow segment is δ_k, from M_(k-1) to x_k, and the purple one x_k - M_k, the two factors of the increment.',
      `The initial data are the classic example 2, 4, 4, 4, 5, 5, 7, 9: mean 5, population variance 4, sample variance 32/7. Other numbers can be written, from 2 to ${DATA_MAX} of them.`,
    ],
    dataLabel: `The data (from 2 to ${DATA_MAX} numbers)`,
    dataHint: 'Separated by spaces or semicolons; 2.5 and 2,5 are the same number.',
    errors: {
      empty: () => 'Write at least two numbers.',
      tooMany: () => `At most ${DATA_MAX} numbers.`,
      notNumber: (t) => `"${t}" is not a number.`,
      tooLarge: (t) => `"${t}" is too large: at most 10^15 in absolute value.`,
      tooFew: () => 'At least two numbers are needed.',
    },
    restore: 'Restore the initial data',
    stale: 'While the field contains an error, the table uses the last valid data.',
    play: 'Play',
    pause: 'Pause',
    resume: 'Resume',
    step: 'One step',
    reset: 'From the start',
    end: 'To the end',
    chart: (k, K) => `The recurrences at step ${k} of ${K}`,
    legend: ['data x_k', 'running mean M_k', 'band M_k ± s_k', 'δ_k = x_k - M_(k-1)', 'x_k - M_k'],
    line: (r, previous) => {
      const F = EN;
      if (r.k === 1) return `Step 1: M_1 = x_1 = ${F.sig(r.x)}, SS_1 = 0; the sample variance is not defined yet.`;
      return `Step ${r.k}: δ = ${F.sig(r.x)} - ${F.sig(r.previous)} = ${F.sig(r.delta)}; M_${r.k} = ${F.sig(r.previous)} + ${F.sig(r.delta)}/${r.k} = ${F.sig(r.mean)}; SS_${r.k} = ${F.sig(previous.ss)} + ${F.sig(r.delta)} × ${F.sig(r.after)} = ${F.sig(r.ss)}; s²_${r.k} = ${F.sig(r.ss)}/${r.k - 1} = ${F.sig(r.variance)}.`;
    },
    tableTitle: 'The update formulas, step by step',
    cols: { k: 'k', x: 'x_k', delta: 'δ_k', mean: 'M_k', after: 'x_k - M_k', increment: 'δ_k (x_k - M_k)', ss: 'SS_k', variance: 's_k²' },
    check: (c) => {
      const F = EN;
      return `At the end: mean ${F.sig(c.mean, 10)}; sample variance with Welford ${F.sig(c.welford, 10)}, with two passes ${F.sig(c.twoPass, 10)}, with the textbook formula ${F.sig(c.naive, 10)}${c.naiveError > 1e-9 ? ` (relative error ${F.sci(c.naiveError)})` : ''}.`;
    },
    after: [
      'The table shows two things. The increment of SS is never negative, because δ_k and x_k - M_k have the same sign. And a value far from the mean counts twice: it moves the mean by δ_k/k and adds about δ_k² to SS, which is why the variance is so sensitive to outliers. Trying for example 2 4 4 4 5 5 7 90 shows the last step multiplying SS by more than a hundred.',
    ],
  },
  stability: {
    intro: [
      'The variance can also be computed in one pass with the textbook formula, SS = Σx² - (Σx)²/n, which keeps only Σx and Σx². In exact arithmetic it equals the others; in floating point it is dangerous, because it subtracts two huge, almost equal numbers. If the data have mean c and standard deviation σ, Σx² and (Σx)²/n are about n c², their difference about n σ², and of the about 16 decimal digits of a double (53-bit mantissa, IEEE 754) about 2 log₁₀(c/σ) are lost: it is catastrophic cancellation. Welford’s formula never subtracts large quantities from each other: it works with the deviations, which are as large as σ.',
      'The table uses the classic example 4, 7, 13, 16, with variance 30, shifted by a constant c: the shift does not change the variance, but it changes the textbook formula.',
    ],
    tableTitle: 'The three formulas on 4, 7, 13, 16 + c (exact variance 30)',
    cols: { offset: 'c', naive: 'Textbook formula', twoPass: 'Two passes', welford: 'Welford' },
    chartTitle: (size) => `Relative error of the variance of ${size} scores shifted by c = 10^x, for x from 0 to 14 (logarithmic scale)`,
    legend: ['textbook formula', 'two passes', 'Welford'],
    facts: stabilityEn,
    after: [
      'The reason lies in the size of the numbers that are subtracted. Welford computes x_k - M_(k-1), a difference as large as σ between numbers as large as c: the rounding error of M, about c ε with ε = 2^-53 ≈ 1.1 × 10^-16, passes into the deviations, and the relative error of the variance grows roughly in proportion to c, one digit lost for every factor of 10. The textbook formula loses in proportion to c²: two digits for every factor of 10, as the doubled slope in the chart shows. The problem and its solutions are analysed by Chan, Golub and LeVeque (1983).',
      'For the scores of Part 2, between 0 and 10, cancellation does not matter: even the textbook formula would give almost every digit. It matters for measurements with a large baseline and small variations, such as times in milliseconds since the Unix epoch (about 1.8 × 10^12) or the byte counters of network interfaces: exactly the data that security analyses as a stream, and on which the textbook formula would give meaningless variances.',
    ],
  },
  checks: {
    intro: 'The formulas, the generator and the statistical functions are checked against independent references: the update formulas against Python’s statistics module, which computes with fractions and therefore exactly, and against NumPy 2.4.6; xoshiro128** and SplitMix64 against their reference C code; the scores of hacker 1, with all four laws, against the same C program; laws, quantiles and special functions against SciPy 1.17.1; the formulas of Var(s²) and Cov(M, s²) of section 2.6 against the exact enumeration, with Python fractions, of every sample of 2 and 3 scores.',
    summary: (ok, total) => `${ok} of ${total} checks passed.`,
    details: (total) => `The ${total} checks`,
    groups: { welford: 'The recurrences', generator: 'Generator and scores', functions: 'Laws, moments and special functions' },
    cols: { check: 'Check', expected: 'Expected value', result: 'Result' },
    ok: 'passed',
    failed: 'failed',
  },
  part2: {
    intro: [
      'Part 2 takes the attackers of Homework #3, here the hackers of the assignment, and gives every attempt a score. Every hacker produces a trajectory of n scores X_1, ..., X_n, independent and with the same law of mean μ and variance σ², and summarizes it with the update formulas of Part 1 in the sampling mean M_n and the sampling variance s_n² = SS_n/(n - 1). The m hackers are m independent samples: their means and variances are m draws of the statistics M_n and s_n², and the average of these draws tells what they are worth on average, that is whether M_n and s_n² are unbiased estimators of μ and σ².',
    ],
  },
  scores: {
    intro: (p) => {
      const L = scoreLaw('outcome', p);
      return [
        `The initial distribution extends Homework #3 in the most direct way: every attempt succeeds with probability p, as before, and the score says how well it went. A failed attempt is worth an integer uniform between 0 and 4, a successful one an integer uniform between 6 and 10. With p = ${EN.plain(p)} the mean is μ = 2 + 6p = ${EN.sig(L.mu)} and the variance σ² = 2 + 36 p (1 - p) = ${EN.sig(L.variance)}: the variance within the two groups, 2, plus the one between them, 36 p (1 - p). The generator of the successes is the one of Homework #3: with the same seed and the same p, hacker j succeeds and fails on the same systems as attacker j.`,
        `The other three laws show what depends on the shape of the distribution: the binomial Bin(${BINOMIAL.trials}, ${EN.plain(BINOMIAL.q)}), ten steps each successful with probability ${EN.plain(BINOMIAL.q)}, is almost bell-shaped; the uniform law on the integers from 0 to 10 is symmetric and without tails; Beta(${BETA.a}, ${BETA.b}) times 10 is continuous and skewed. Choosing another law repeats the simulation.`,
      ];
    },
    chooseLabel: 'Distribution of the scores',
    tableTitle: (p) => `The four laws and their moments (p = ${EN.plain(p)} for the first)`,
    cols: { law: 'Law', values: 'Values', mu: 'Mean μ', variance: 'Variance σ²', skewness: 'Skewness', kurtosis: 'Excess kurtosis', mu4: 'μ₄' },
    values: { outcome: '0..4, 6..10', binomial: '0..10', uniform: '0..10', beta: '[0, 10]' },
    after: [
      'μ and σ² are enough for the averages of section 2.4. The variability of the sampling variance also depends on the fourth central moment μ₄, that is on the kurtosis, and its correlation with the mean on the third moment μ₃, that is on the skewness: this is why the table also gives them, and why the four laws behave differently in sections 2.6 and 2.7.',
    ],
    chartTitle: (name, simulated) => (simulated ? `The scores of all the hackers against the law: ${name}` : `The law of the scores: ${name}`),
    legend: (discrete, simulated) => {
      if (!simulated) return discrete ? ['law'] : ['law, per interval', null, 'density'];
      return discrete ? ['simulated scores', 'law'] : ['simulated scores, per interval', 'law, per interval', 'density'];
    },
  },
  input: {
    intro: `The initial values are those of Homework #3: p = ${EN.plain(DEFAULT_P)} (for the first law only), n = ${EN.int(DEFAULT_N)} systems per hacker, m = ${EN.int(DEFAULT_M)} hackers and the seed ${DEFAULT_SEED}. Every hacker has two xoshiro128** generators, with the state derived from SplitMix64: the first decides the successes and is the one of the attacker of Homework #3, the second gives the scores. With the same seed the page, the animation and node homework4.js see the same hackers and print the same numbers. The mean and the variance of every hacker are read at n = ${N_GRID.slice(0, 6).join(', ')}, ... and at the last system, in the same simulation: Welford’s formulas give the values of every n along the way, and that is how the experiment is repeated for several n. With the initial values ${EN.int(DEFAULT_N * DEFAULT_M)} scores are simulated; the time taken appears under the fields.`,
    pLabel: `Probability of success p, first law (from ${EN.plain(LIMITS.p[0])} to ${EN.plain(LIMITS.p[1])})`,
    pHint: 'With a decimal point or comma: 0.2 and 0,2 are the same value. The other laws do not depend on p.',
    nLabel: `Systems n per hacker (from ${EN.int(LIMITS.n[0])} to ${EN.int(LIMITS.n[1])})`,
    nHint: `The length of the trajectories. The mean and the variance are read at n = ${N_GRID.slice(0, 4).join(', ')}, ... and at the last system.`,
    mLabel: `Hackers m (from ${EN.int(LIMITS.m[0])} to ${EN.int(LIMITS.m[1])})`,
    mHint: 'The independent samples. The average of m values has an error of about 1/√m times their standard deviation.',
    seedLabel: `Seed (from 0 to ${EN.int(LIMITS.seed[1])})`,
    seedHint: 'The same seed gives the same hackers, here and in the terminal (node homework4.js --seed ...).',
    randomSeed: 'Random seed',
    errors: {
      empty: () => 'Write a value.',
      notInteger: (t) => `"${t}" is not an integer written in decimal digits.`,
      notNumber: (t) => `"${t}" is not a number.`,
      range: (lo, hi) => `The value goes from ${lo} to ${hi}.`,
    },
    limits: {
      p: [EN.plain(LIMITS.p[0]), EN.plain(LIMITS.p[1])],
      n: [EN.int(LIMITS.n[0]), EN.int(LIMITS.n[1])],
      m: [EN.int(LIMITS.m[0]), EN.int(LIMITS.m[1])],
      seed: [EN.int(LIMITS.seed[0]), EN.int(LIMITS.seed[1])],
    },
    defaultBadge: `Initial values: outcome of Homework #3 + score, p = ${EN.plain(DEFAULT_P)}, n = ${EN.int(DEFAULT_N)} systems, m = ${EN.int(DEFAULT_M)} hackers, seed ${DEFAULT_SEED}.`,
    customBadge: 'Values different from the initial ones.',
    restore: 'Restore the initial values',
    stale: 'While a field contains an error, the page uses its last valid value.',
    pending: 'Simulation running with the new values: the following sections update as soon as it ends.',
    run: (s) => `Simulated ${EN.int(s.draws)} scores (${EN.int(s.params.m)} hackers, ${EN.int(s.params.n)} systems), with the mean and the variance of every hacker at ${s.points.length} values of n, in ${EN.ms(s.ms)}.`,
  },
  trajectories: {
    intro: (shown, sample) => [
      `The animation shows the formulas at work, score after score. On the left the running mean M_k, or the running variance s_k², of the first ${EN.int(shown)} hackers, with the first in red; on the right the histogram of the values of ${EN.int(sample)} hackers at the current step, with the curve of the normal law that has the mean and the standard deviation of the theory. The green band is the true value ± 2 standard deviations, σ/√k for the mean and √Var(s_k²) for the variance; the dashed green line is μ, or σ², and the dotted yellow one the envelope of the law of the iterated logarithm.`,
      'At first the trajectories fill the whole range of the scores; then they close in on the true value, like 1/√k: it is the law of large numbers, for the mean and also for the variance, which up to a vanishing term is the mean of the squares (X_i - μ)². The animation opens on the last score: Play starts it again from the first, One score moves one step.',
    ],
    quantityLabel: 'Quantity',
    speedLabel: 'Speed',
    speeds: ['Slow', 'Normal', 'Fast'],
    play: 'Play',
    pause: 'Pause',
    resume: 'Resume',
    step: 'One score',
    reset: 'From the start',
    end: 'To the end',
    legend: ['hackers', 'hacker 1', 'true value ± 2 standard deviations', 'iterated logarithm'],
    caption: (st, name) => {
      if (!st.ready) return `Score ${EN.int(st.k)} of ${EN.int(st.n)}: the sample variance is defined from 2 scores on.`;
      return `Score ${EN.int(st.k)} of ${EN.int(st.n)}: ${name} of the ${EN.int(st.sample)} hackers ${EN.num(st.mean, 4)} on average (theory ${EN.num(st.theoryMean, 4)}), with standard deviation ${EN.num(st.sd, 4)} (theory ${EN.num(st.theorySd, 4)}); outside the band ${EN.pct(st.outside)}; hacker 1: ${EN.num(st.first, 4)}.`;
    },
    after: [
      'The two quantities behave differently. With few scores the histogram of the variances is skewed, with a tail to the right, and the normal law arrives later than for the means: s_k² is a mean of squares, which are more skewed than the scores themselves. And the band of the variance is wider in proportion, because it depends on μ₄: estimating the variability of a hacker takes more data than estimating its mean.',
    ],
  },
  averages: {
    intro: (s) => [
      `For every n the table takes the ${EN.int(s ? s.m : DEFAULT_M)} sampling means and the ${EN.int(s ? s.m : DEFAULT_M)} sampling variances of the hackers and averages them: it is the comparison asked by the assignment. Next to every average is its distance from the theoretical value in standard errors, z: the average of m independent values has the standard deviation of one value divided by √m, that is σ/√(nm) for the means and √(Var(s_n²)/m) for the variances. If the estimators are unbiased, |z| exceeds 1.96 about once in twenty.`,
      'The last column averages SS_n/n, the variance that divides by n instead of n - 1: its expected value is σ² (n - 1)/n, always smaller than σ².',
    ],
    tableTitle: (m) => `Averages over the ${EN.int(m)} hackers, per n`,
    cols: { n: 'n', mean: 'Average of M_n', meanZ: 'z', variance: 'Average of s_n²', varianceZ: 'z', biased: 'Average of SS_n/n', biasedTheory: 'σ² (n - 1)/n' },
    meansChart: (m) => `The average of the ${EN.int(m)} sampling means against μ, per n (logarithmic scale)`,
    variancesChart: (m) => `The average of the ${EN.int(m)} sampling variances, and of SS_n/n, against σ², per n`,
    legendMeans: ['μ, with the 95% band for the average of m means', 'average of M_n'],
    legendVariances: ['σ², with the 95% band', 'average of s_n²', 'σ² (n - 1)/n', 'average of SS_n/n'],
    facts: (s) => {
      const a = averageFacts(s);
      const F = EN;
      const where = (rows, key) => rows.map((r) => `n = ${F.int(r.n)}, z = ${F.num(r[key], 2)}`).join('; ');
      const outsideMeans = a.meansOutside.length === 0 ? 'none is outside its 95% band' : `${a.meansOutside.length === 1 ? 'one is' : `${a.meansOutside.length} are`} outside the 95% band (${where(a.meansOutside, 'meanZ')})`;
      const outsideVariances = a.variancesOutside.length === 0 ? 'none is outside the band' : `${a.variancesOutside.length === 1 ? 'one is' : `${a.variancesOutside.length} are`} outside the band (${where(a.variancesOutside, 'varianceZ')})`;
      return [
        `The averages of the sampling means sit on μ = ${F.sig(s.law.mu)} for every n: ${outsideMeans}. The averages of the sampling variances sit on σ² = ${F.sig(s.law.variance)}: ${outsideVariances}. With ${a.count} values of n, ${F.num(a.expectedOutside, 1)} exits are expected on average by pure chance, and the points are not independent, because at every n the hackers are the same and their averages at different n share the first scores.`,
        `The averages of SS_n/n instead follow σ² (n - 1)/n, not σ²: at n = ${F.int(a.first.n)} they are ${F.num(a.first.biased, 4)} against an expected value of ${F.num(a.first.biasedTheory, 4)}, at n = ${F.int(a.small.n)} ${F.num(a.small.biased, 4)} against ${F.num(a.small.biasedTheory, 4)}, and the distance from σ², which is σ²/n, gets lost in the noise only for large n (${F.num(a.last.bias, 4)} at n = ${F.int(a.last.n)}).`,
      ];
    },
  },
  comparison: {
    formulasTitle: 'Why M_n and s_n² are unbiased',
    paras: (s) => {
      const F = EN;
      const c = s ? comparisonFacts(s) : null;
      return {
        before: [
          'The first conclusion is that the sampling mean and the sampling variance are unbiased estimators: for every n, even n = 2, E[M_n] = μ and E[s_n²] = σ². The simulation does not prove it, but it puts it to the test m times for every n and with four different laws, and the tests of section 3 find no difference. The proof is short: the mean is linear, and SS_n decomposes around μ.',
        ],
        after: [
          'The second is the reason for the divisor n - 1. The deviations are measured from M_n and not from μ, and M_n is precisely the point that minimizes the sum of the squared deviations: SS_n is always at most Σ (X_i - μ)², and on average smaller by exactly n Var(M_n) = σ². One of the n pieces of information was spent estimating the mean, and n - 1 degrees of freedom remain. Dividing by n - 1 compensates: it is Bessel’s correction. Dividing by n gives the maximum likelihood estimator for normal data, biased by -σ²/n, as the last column of the table shows.',
          'The third is that unbiasedness does not depend on the law: the proof uses only independence and finite moments, not normality, and indeed with all four laws the averages fall on μ and σ². It does not hold for the standard deviation, though: s_n is biased downwards, because the square root is concave (Jensen’s inequality).',
          c
            ? `The last is that unbiasedness is a property of the average over many samples, not of a single sample. At n = ${F.int(c.n)} the average of the hackers’ variances is σ², but 90% of the hackers have a variance between ${F.num(c.variance5, 2)} and ${F.num(c.variance95, 2)}, and only ${F.pct(c.withinVariance, 0)} are within 10% of σ² (for the mean ${F.pct(c.withinMean, 0)}). How far an estimate strays from the truth is the question of section 2.6, and it is the one that matters when, as almost always, there is a single sample.`
            : 'The last is that unbiasedness is a property of the average over many samples, not of a single sample: how far an estimate strays from the truth is the question of section 2.6.',
        ],
      };
    },
  },
  spread: {
    intro: [
      'The assignment asks to repeat the experiment for several n and to look at the variability of the sampling means and variances. The exact formulas are these:',
    ],
    formulasTitle: 'The variability of M_n and s_n²',
    afterFormulas: [
      'Both variances fall like 1/n, and the standard deviations, that is the typical error of an estimate made by a single hacker, like 1/√n: halving the error takes four times the systems. The two statistics are consistent: they concentrate on the true value as n grows. The variance of s_n², though, depends on μ₄: with heavy tails the estimate of σ² is far more uncertain than that of μ, and the textbook formula 2σ⁴/(n - 1) holds only for normal data, with zero excess kurtosis.',
    ],
    axisLabel: 'Axis',
    axisNames: { fixed: 'The same for every n', own: 'Of this n' },
    nLabel: (n) => `n = ${EN.int(n)} systems per hacker`,
    play: 'Run through n',
    pause: 'Pause',
    histMean: (n, m) => `The ${EN.int(m)} sampling means at n = ${EN.int(n)}`,
    histVariance: (n, m) => `The ${EN.int(m)} sampling variances at n = ${EN.int(n)}`,
    legendHist: ['hackers', 'normal law of the theory'],
    histNote: (stats, theory, quantity) => {
      const F = EN;
      const isMean = quantity === 'mean';
      return `Mean ${F.num(stats.mean, 4)} (theory ${F.num(isMean ? theory.mean : theory.variance, 4)}), standard deviation ${F.num(Math.sqrt(stats.variance), 4)} (theory ${F.num(isMean ? theory.sdMean : theory.sdVariance, 4)}), skewness ${F.num(stats.skewness, 3)}${isMean ? ` (theory ${F.num(theory.skewMean, 3)})` : ''}.`;
    },
    chartTitle: 'Variance of the sampling means and variances across the hackers, per n (logarithmic scales)',
    legend: ['Var(M_n) simulated', 'σ²/n', 'Var(s_n²) simulated', 'μ₄/n - σ⁴ (n - 3)/(n (n - 1))', '2σ⁴/(n - 1), normal data'],
    tableTitle: 'The variability across the hackers, per n',
    cols: { n: 'n', varMean: 'Var(M_n)', varMeanTheory: 'σ²/n', varVariance: 'Var(s_n²)', varVarianceTheory: 'Theory', normalVariance: 'Normal data', skewMean: 'Skewness of M_n' },
    facts: (s) => {
      const f = spreadFacts(s);
      const F = EN;
      const L = s.law;
      const ratio = f.normalRatioSmall;
      return [
        `On the logarithmic scale the two variances are lines of slope -1: least squares give ${F.num(f.meanSlope.slope, 3)} ± ${F.num(f.meanSlope.slopeError, 3)} for the means and ${F.num(f.varianceSlope.slope, 3)} ± ${F.num(f.varianceSlope.slopeError, 3)} for the variances (from n = ${SMALL_N}). From n = ${F.int(f.first.n)} to n = ${F.int(f.last.n)} the standard deviation of the means shrinks ${F.num(f.shrinkMean, 1)} times and that of the variances ${F.num(f.shrinkVariance, 1)} times, against √(${F.int(f.last.n)}/${F.int(f.first.n)}) = ${F.num(Math.sqrt(f.last.n / f.first.n), 1)}: at small n the variance of s_n² is not yet proportional to 1/n.`,
        `For the chosen law, with excess kurtosis ${F.num(L.kurtosis, 3)}, the variance of s_n² at n = ${F.int(f.small.n)} is ${F.num(ratio, 3)} times that of normal data with the same σ²: ${Math.abs(ratio - 1) < 0.05 ? 'almost the same, because the kurtosis is close to that of the normal law' : ratio > 1 ? 'larger, because the tails weigh more than in the normal law' : 'smaller, because the tails weigh less than in the normal law'}. Simulated it is ${F.sig(f.small.varVariance, 4)}, the exact theory gives ${F.sig(f.small.varVarianceTheory, 4)} and the formula for normal data ${F.sig(f.small.normalVariance, 4)}.`,
        `The shape changes together with the width: at small n the means have the skewness of the scores divided by √n (${F.num(f.first.skewMean, 3)} at n = ${F.int(f.first.n)}, theory ${F.num(f.first.skewMeanTheory, 3)}) and the variances are even more skewed (${F.num(f.first.skewVariance, 3)}); then both become normal, by the central limit theorem, because s_n² is a mean of squares plus a vanishing term. With the same axis for every n the two histograms narrow; with the axis of each n the shape turns into a bell.`,
      ];
    },
  },
  inference: {
    intro: [
      'In practice there are not m hackers but one: a sample of n observations, from which μ and σ² must be estimated without knowing them. The results of sections 2.4-2.6 are exactly what makes this possible, and what says how wrong one can be:',
    ],
    list: [
      'unbiasedness: M_n and s_n² hit the target on average whatever the law, so the mean and the variance can be estimated without knowing it, and the divisor n - 1 makes the estimate of the variance unbiased too;',
      'consistency: their variances go to zero like 1/n, so with enough data the estimate from a single sample is close to the truth (law of large numbers);',
      'standard error: Var(M_n) = σ²/n is estimated by s_n²/n precisely because s_n² is unbiased, and s_n/√n is the uncertainty that goes with every mean: this is why the variance is computed together with the mean;',
      'sampling distribution: by the central limit theorem (M_n - μ)/(s_n/√n) is about normal, and for normal data it is exactly a Student t with n - 1 degrees of freedom (Gosset, 1908). Hence the confidence intervals M_n ± t s_n/√n and the tests on the mean.',
    ],
    afterList: [
      'The simulation puts the most used interval to the test, M_n ± t_(0.975; n-1) s_n/√n: for every n it counts for how many hackers the interval contains μ. The chart also shows the chi-square interval for σ², from (n - 1) s_n²/χ²_(0.975; n-1) to (n - 1) s_n²/χ²_(0.025; n-1), which is exact only for normal data.',
    ],
    coverageTitle: 'Share of hackers whose 95% interval contains the true value, per n',
    coverageLegend: ['95%', 'limit of the χ² interval for large n', 't interval for μ', 'χ² interval for σ²'],
    scatterTitle: (n, m) => `The ${EN.int(m)} pairs (M_n, s_n²) at n = ${EN.int(n)}`,
    scatterLegend: ['hackers', '(μ, σ²)', 'theoretical line of slope μ₃/σ²'],
    nLabel: (n) => `n = ${EN.int(n)} systems per hacker`,
    tableTitle: 'The intervals and the correlation between mean and variance, per n',
    cols: { n: 'n', t: 't coverage', tQuantile: 't_(0.975; n-1)', chi2: 'χ² coverage', corr: 'corr(M_n, s_n²)', corrTheory: 'Theory' },
    facts: (s) => {
      const i = inferenceFacts(s);
      const F = EN;
      const L = s.law;
      const kappa = L.kurtosis + 3;
      const symmetric = Math.abs(L.mu3) < 1e-12;
      return [
        `The t interval works for any law as n grows: at n = ${F.int(i.last.n)} it contains μ for ${F.pct(i.last.t)} of the hackers. At small n it covers less than declared (${F.pct(i.first.t)} at n = ${F.int(i.first.n)}, ${F.pct(i.small.t)} at n = ${F.int(i.small.n)}), because the scores are not normal: ${symmetric ? 'with tails lighter than the normal ones the t law is only an approximation' : 'with skewed data M_n and s_n are correlated, and the interval widens and narrows together with the mean that moves'}.${i.ties > 0 ? ` At n = 2 there is also a simpler limit: with probability Σ p_k² = ${F.num(i.ties, 3)} the two scores are equal, s_2 = 0 and the interval is a single point.` : ''}`,
        `The χ² interval instead does not improve with n: its coverage tends to ${F.pct(i.limit)}, not to 95%, because it assumes for s_n² a relative variance of 2/(n - 1), while it is about (κ - 1)/n with κ = μ₄/σ⁴ = ${F.num(kappa, 3)}. ${Math.abs(kappa - 3) < 0.1 ? 'Here κ is close to 3, the value of the normal law, and the error is small; with other laws it is not.' : kappa > 3 ? 'With tails heavier than the normal ones it covers less than declared.' : 'With tails lighter than the normal ones it covers more than declared, and it is needlessly wide.'} The estimate of the mean is robust, that of the variance is not: this is why the tests on the variance, such as the F test, are used with care outside normality.`,
        `The scatter plot shows a less known fact: M_n and s_n² are correlated, with Cov(M_n, s_n²) = μ₃/n, which is zero only for symmetric laws. For the chosen law the theoretical correlation at n = ${F.int(i.last.n)} is ${F.num(i.last.corrTheory, 3)} and the simulated one ${F.num(i.last.corr, 3)}; ${symmetric ? 'here μ₃ = 0 and the two statistics are uncorrelated, although not independent.' : `a hacker with a high mean tends to have a high variance too, along the line of slope μ₃/σ² = ${F.num(i.slope, 3)}.`} For normal data M_n and s_n² are independent, a property that characterizes the normal law (Lukacs, 1942) and on which Student’s t rests.`,
      ];
    },
  },
  tryDrag: {
    intro: [
      'Drag the points with the mouse or a finger: the last one, in red, is the new value x_k (the slider below moves it from the keyboard too). On the line are the two means, M_(k-1) dashed and M_k solid, and the two deviations of the new value: δ in yellow and x_k - M_k in purple. Below on the left is the rectangle whose sides are the two deviations: its area is the increment of SS, and it is the square δ × δ without a strip of 1/k, because x_k - M_k = ((k - 1)/k) δ. On the right, SS_(k-1) plus that area against SS_k computed from scratch: the two bars always stay equally long, and that is Welford’s formula.',
    ],
    sliderLabel: (k, v) => `The new value x_${k} = ${v}`,
    add: 'Add a value',
    remove: 'Remove the last',
    reset: 'Restore',
    legend: ['data', 'new value x_k', 'M_(k-1) and M_k', 'δ = x_k - M_(k-1)', 'x_k - M_k', 'SS_(k-1)', 'SS_k computed from scratch'],
    caption: (st) => {
      const F = EN;
      return `New value x_${st.k} = ${F.sig(st.x, 4)}: the mean goes from M_${st.k - 1} = ${F.sig(st.previousMean, 4)} to M_${st.k} = ${F.sig(st.mean, 4)}; δ = ${F.sig(st.delta, 4)}, x_${st.k} - M_${st.k} = ${F.sig(st.after, 4)}, increment ${F.sig(st.increment, 4)}. SS_${st.k} = ${F.sig(st.previousSS, 4)} + ${F.sig(st.increment, 4)} = ${F.sig(st.previousSS + st.increment, 4)}, as the direct computation Σ (x_i - M_${st.k})² = ${F.sig(st.direct, 4)}; sample variance s² = ${F.sig(st.variance, 4)}.`;
    },
    after: [
      'Try bringing the new value onto the old mean: δ vanishes, the rectangle disappears and SS does not change. Move it away: the area grows like the square of the distance, which is why a single outlier weighs so much on the variance. With many values the 1/k strip gets thin and the increment is almost δ².',
    ],
  },
  tryDigits: {
    intro: [
      'The slider shifts the data by c = 10^0, ..., 10^15: the exact variance does not change. For each of the three formulas the digits equal to those of the exact value are green and the others red. Below are the two huge numbers that the textbook formula subtracts: in grey the leading digits they share, which the subtraction cancels, in red those that remain, already spoiled by rounding.',
    ],
    powerLabel: (e) => `Shift c = 10^${e}`,
    datasetLabel: 'Data',
    datasets: { classic: '4, 7, 13, 16', scores: '1,000 scores' },
    rows: { naive: 'Textbook formula', twoPass: 'Two passes', welford: 'Welford' },
    exact: (v) => `Exact value of the variance: ${EN.sig(v, 15)}`,
    right: (r) => (r === 0 ? 'no right digit' : r >= 16 ? 'all digits right' : `${r} of 16 digits right`),
    error: (e) => (e === 0 ? 'no error' : `relative error ${EN.sci(e)}`),
    sumsTitle: 'Inside the textbook formula: Σx² and (Σx)²/n',
    sumLabels: ['Σx²', '(Σx)²/n'],
    common: (d, total) =>
      d === 0
        ? 'The two numbers share no leading digit: the subtraction loses nothing.'
        : d >= total
          ? `The two numbers are identical in all ${total} digits: their difference is zero, and so is the variance.`
          : `The two numbers share their first ${d} of ${total} digits: the subtraction cancels them, and the difference keeps ${total - d} digits, those already spoiled by rounding.`,
  },
  tryBessel: {
    intro: [
      'Every press draws more samples of n scores from the law of section 2.1: sample j is the first n scores of hacker j of the simulation. As the number of samples grows, the chart follows the average of s² (blue) and that of SS/n (red): the first approaches σ², the second σ² (n - 1)/n, and the gap between them is exactly what Bessel’s correction removes. The green band is where the average of s² must lie at 95% if s² is unbiased, and it narrows like 1/√(number of samples). With small n the two averages stay apart, with large n they almost touch.',
    ],
    nLabel: (n) => `n = ${n} scores per sample`,
    one: '+1 sample',
    hundred: '+100',
    thousand: '+1,000',
    play: 'Play',
    pause: 'Pause',
    reset: 'Start again',
    chartTitle: (n) => `Average of the variances of samples of ${n} scores, as the number of samples grows (logarithmic scale)`,
    legend: ['σ², with the 95% band', 'σ² (n - 1)/n', 'average of s²', 'average of SS/n'],
    status: (st, law) => {
      const F = EN;
      if (st.count === 0) return 'No samples yet: press +1 sample or Play.';
      return `${F.int(st.count)} samples: average of s² ${F.num(st.sumVariance / st.count, 4)} (σ² = ${F.sig(law.variance, 4)}), average of SS/n ${F.num(st.sumBiased / st.count, 4)} (σ² (n - 1)/n = ${F.sig((law.variance * (st.n - 1)) / st.n, 4)}).`;
    },
    last: (sample) => {
      const F = EN;
      const shown = sample.values.slice(0, 12).map((v) => F.sig(v, 3)).join(', ');
      return `Last sample (hacker ${F.int(sample.j + 1)}): ${shown}${sample.values.length > 12 ? ', ...' : ''}; mean ${F.num(sample.mean, 3)}, s² ${F.num(sample.variance, 3)}, SS/n ${F.num(sample.biased, 3)}.`;
    },
    limit: 'Reached the maximum of 20,000 samples: start again or change n.',
  },
  tryIntervals: {
    intro: [
      'A hundred samples of n scores, that is a hundred hackers with n systems, and for each its confidence interval: green those that contain the true value (the dashed line), red those that miss it. A 95% interval should miss it about 5 times in 100. n, the level, the parameter (μ with Student’s t, σ² with the chi-square) and the law can be changed, to see when the promise is kept; New 100 samples moves to the next hundred hackers and adds up the counts.',
      'Two things to try: with the initial law and n = 2 the interval for μ misses the true value more often than declared; with the uniform law the interval for σ² almost never misses it, because with tails lighter than the normal ones it is too wide.',
    ],
    nLabel: (n) => `n = ${n} scores per sample`,
    levelLabel: 'Level',
    paramLabel: 'Parameter',
    params: { mean: 'μ (Student’s t)', variance: 'σ² (chi-square)' },
    lawLabel: 'Law',
    newBatch: 'New 100 samples',
    chartTitle: (b, lawName) => `${EN.pct(b.level, 0)} intervals for ${b.param === 'mean' ? 'μ' : 'σ²'} with n = ${b.n}, ${lawName}`,
    legend: ['contains the true value', 'misses the true value', 'true value'],
    counts: (misses, level, total, totalMisses) =>
      `In this draw ${misses} of 100 intervals miss the true value (about ${Math.round(100 * (1 - level))} expected); over all the draws with these settings ${EN.int(totalMisses)} of ${EN.int(total)}, that is ${EN.pct(totalMisses / total, 1)}, against the declared ${EN.pct(1 - level, 0)}.`,
  },
  stats: {
    verdict: { reject: 'H₀ rejected', notReject: 'H₀ not rejected' },
    expected: { reject: 'expected: rejection', notReject: 'expected: no rejection', either: 'depends on the power of the test' },
    testLine: testLineEn,
    groups: { sim: 'Generator', averages: 'Averages', spread: 'Variability', inference: 'Inference' },
    labels: {
      sim: {
        scores: 'The scores of all the hackers follow the chosen law (χ²)',
        lag: 'Consecutive scores are uncorrelated (z)',
      },
      averages: {
        meanSmall: `The average of M_${SMALL_N} is μ (z)`,
        meanLarge: 'The average of M_n at the last n is μ (z)',
        varianceSmall: `The average of s_${SMALL_N}² is σ² (z)`,
        varianceLarge: 'The average of s_n² at the last n is σ² (z)',
        biased: `The average of SS_${SMALL_N}/${SMALL_N} is σ² (z): false on purpose, SS_n/n is biased`,
      },
      spread: {
        spreadMean: 'At the last n the variance of M_n is σ²/n (z, large samples)',
        spreadVariance: 'At the last n the variance of s_n² is μ₄/n - σ⁴ (n - 3)/(n (n - 1)) (z, large samples)',
        normalTheory: `At n = ${SMALL_N} the variance of s_n² is 2σ⁴/(n - 1), as for normal data (z)`,
        normalSmall: `M_${SMALL_N} has the skewness and kurtosis of a normal law (Jarque-Bera)`,
        normalLarge: 'At the last n M_n has the skewness and kurtosis of a normal law (Jarque-Bera)',
        varianceNormal: 'At the last n s_n² has the skewness and kurtosis of a normal law (Jarque-Bera)',
      },
      inference: {
        coverage: `At the last n the ${EN.pct(CONFIDENCE, 0)} t interval contains μ for ${EN.pct(CONFIDENCE, 0)} of the hackers (z)`,
        correlation: 'At the last n the correlation between M_n and s_n² is the theoretical one (Fisher)',
        independence: 'At the last n M_n and s_n² are uncorrelated, as for normal data (Fisher)',
      },
    },
  },
  tests: {
    intro: (s) => `The hypothesis tests of the page, at significance level α = ${EN.num(SIGNIFICANCE, 2)}. The generator is checked with the law of the scores and the correlation between consecutive scores; unbiasedness with the averages of the means and of the variances at n = ${SMALL_N} and at n = ${EN.int(s.params.n)}; variability with the exact formulas and the normality of the two statistics; inference with the coverage of the t interval and the correlation between mean and variance. Some null hypotheses are false on purpose (SS_n/n is biased, mean and variance are not uncorrelated for skewed laws, at n = ${SMALL_N} the means are not normal yet), and their rejection is expected.`,
    cols: { subject: 'Subject', hypothesis: 'Null hypothesis H₀', p: 'p-value', verdict: 'Outcome', expected: 'Reading' },
    after: (sum) => {
      const out = [`${sum.rejected} of ${sum.count} tests reject the null hypothesis, ${sum.asExpected === sum.count ? 'all as expected' : `${sum.asExpected} of ${sum.count} as expected`}.`];
      const expectedFalse = EN.num(sum.nulls * SIGNIFICANCE, 2);
      const which = sum.falseRejections.map((t) => EN.pval(t.result.pValue)).join(', ');
      out.push(
        `Among the ${sum.nulls} tests with a true null hypothesis, at level ${EN.num(SIGNIFICANCE, 2)} ${expectedFalse} rejections by pure chance are expected on average: ${sum.falseRejections.length === 0 ? 'here there are none' : `here there ${sum.falseRejections.length === 1 ? 'is one' : `are ${sum.falseRejections.length}`} (p = ${which})`}. Holm’s correction for multiple tests, which keeps below 5% the probability of even one wrong rejection, compares the smallest p-value with ${EN.num(SIGNIFICANCE, 2)}/${sum.nulls} = ${EN.num(sum.holmThreshold, 4)}, the next with ${EN.num(SIGNIFICANCE, 2)}/${sum.nulls - 1} and so on: ${sum.holm === 0 ? 'no rejection survives' : `${sum.holm === 1 ? 'one rejection survives' : `${sum.holm} rejections survive`}, to be looked at as a possible flaw`}.`,
      );
      out.push('One remark applies to all of them: with millions of scores the tests on the scores themselves see tiny differences, while those on the hackers’ averages have m observations and see differences of about 2/√m times the standard deviation of the statistic. Significance and size of a difference are two different questions: rejecting normality at n = 10 says that the difference exists, not that it is large.');
      return out;
    },
  },
  history: {
    intro: 'From Gauss’s least squares to the recurrence formulas of this page, the ideas used in the homework in chronological order.',
    legend: { task: 'used on this page', context: 'context' },
    events: [
      { year: '1809', task: true, title: 'Gauss', text: 'In the Theoria motus he founds least squares: the arithmetic mean is the value that minimizes the sum of the squared deviations, the property that section 2.5 uses to explain the divisor n - 1.' },
      { year: '1810', task: true, title: 'Laplace', text: 'The central limit theorem for sums of independent variables: the reason why the means and the variances of the hackers become normal as n grows.' },
      { year: '1823', task: true, title: 'Gauss', text: 'In the Theoria combinationis observationum he proves that the sum of the squared residuals, divided by the number of observations minus that of the estimated parameters, is an unbiased estimate of the variance: with one parameter, the mean, the divisor is n - 1. The correction bears the name of Bessel, who used it to compute the errors of astronomical observations.' },
      { year: '1853', task: true, title: 'Bienaymé', text: 'The variance of a sum of independent variables is the sum of the variances: hence Var(M_n) = σ²/n, the law of section 2.6.' },
      { year: '1900', task: true, title: 'Pearson', text: 'The chi-square goodness-of-fit test, used here to check the scores of the generator.' },
      { year: '1908', task: true, title: 'Gosset ("Student")', text: 'In The probable error of a mean, written as a chemist of the Guinness brewery working with small samples, he derives the law of (M_n - μ)/(s_n/√n) for normal data: the Student t of the interval of section 2.7.' },
      { year: '1921', task: true, title: 'Fisher', text: 'The transformation z = atanh(r) of the correlation coefficient, approximately normal with variance 1/(m - 3): the test on the correlation between mean and variance.' },
      { year: '1922', task: true, title: 'Fisher', text: 'On the mathematical foundations of theoretical statistics: consistency, efficiency and sufficiency of estimators, and degrees of freedom, the concept behind the divisor n - 1.' },
      { year: '1937', task: true, title: 'Neyman', text: 'The theory of confidence intervals: an interval computed from the sample that contains the parameter with a fixed probability, the 95% of section 2.7.' },
      { year: '1942', task: true, title: 'Lukacs', text: 'If the sample mean and variance are independent, the law is normal: for any other law they are dependent, and for a skewed law also correlated, as the scatter plot shows.' },
      { year: '1949', task: true, title: 'Metropolis and Ulam', text: 'The Monte Carlo Method: estimating probabilities and expected values by simulating many samples, the method of Part 2.' },
      { year: '1962', task: true, title: 'Welford', text: 'In Note on a method for calculating corrected sums of squares and products (Technometrics) he proposes updating the mean and the sum of squares value by value, without the cancellation of the textbook formula: the formulas of Part 1.' },
      { year: '1969', task: true, title: 'Knuth', text: 'The Art of Computer Programming, vol. 2, gives the recurrences for the mean and the standard deviation, citing Welford, in the part on the accuracy of floating-point arithmetic: the formula for the mean of the assignment.' },
      { year: '1979', task: true, title: 'Chan, Golub and LeVeque; Holm', text: 'Chan, Golub and LeVeque generalize Welford to the union of two groups of data (the pairwise algorithm), and in 1983 analyse its stability; Holm proposes the correction for multiple tests used in section 3.' },
      { year: '1980', task: true, title: 'Jarque and Bera', text: 'The normality test based on skewness and kurtosis, used for the means and the variances of the hackers.' },
      { year: '1985', task: true, title: 'IEEE 754', text: 'The standard of floating-point arithmetic: the doubles with a 53-bit mantissa with which section 1.5 measures cancellation.' },
      { year: '1996', task: false, title: 'Alon, Matias and Szegedy', text: 'The theory of streaming algorithms: which statistics can be computed in one pass with little memory. The mean and the variance are the simplest case, and Welford its exact solution.' },
      { year: '2014-2018', task: true, title: 'SplitMix and xoshiro', text: 'Steele, Lea and Flood publish SplitMix (2014), Blackman and Vigna the xoshiro generators (2018): they are the random numbers of this page, as of Homework #3.' },
    ],
    after: 'The history runs on two tracks that this homework joins. The one of estimation (Gauss, Student, Fisher, Neyman) says what M_n and s_n² are worth as estimators; the one of computation (Welford, Knuth, Chan, Golub and LeVeque) says how to compute them well with a machine, in one pass and without losing digits. The recurrence formulas of Part 1 sit where the two meet.',
  },
  conclusion: (s) => {
    const F = EN;
    const first = 'Part 1. Welford’s formulas are derived with the same approach as Knuth’s formula for the mean: the quantity of the first k values is written with that of the first k - 1 and the deviation of the new value. This gives SS_k = SS_(k-1) + (x_k - M_(k-1))(x_k - M_k) and s_k² = SS_k/(k - 1), with the same form for the variance. In code they are three lines that work in constant memory and in a single pass, and that, unlike the textbook formula, do not lose every digit when the data have a large baseline.';
    if (!s) return [first, 'Part 2. With m hackers and n systems, the average of the sampling means equals μ and the average of the sampling variances equals σ², for every n: they are unbiased estimators, and their variability falls like 1/n.'];
    const f = spreadFacts(s);
    const i = inferenceFacts(s);
    const small = s.points.find((pt) => pt.n === SMALL_N) || s.points[0];
    return [
      first,
      `Part 2. With ${F.int(s.m)} hackers and up to ${F.int(s.params.n)} systems, the average of the sampling means equals μ and the average of the sampling variances equals σ² within the error of the simulation, for every n and with all four laws: they are unbiased estimators, while SS_n/n underestimates σ² by σ²/n. As n grows the variability of both falls like 1/n (slopes ${F.num(f.meanSlope.slope, 3)} and ${F.num(f.varianceSlope.slope, 3)} on the logarithmic scale), so the error of the estimate of a single hacker falls like 1/√n; the variance of the variance depends on the kurtosis, and only for normal data is it 2σ⁴/(n - 1).`,
      `For inference these results are the foundation: they allow estimating μ and σ² from a single sample, attaching to the estimate its standard error s_n/√n and building intervals and tests. The simulation also shows their limits: the t interval for μ reaches 95% with every law (${F.pct(i.last.t)} at n = ${F.int(i.last.n)}), the one for σ² without normality converges to ${F.pct(i.limit)}; and the mean and the variance are correlated when the law is skewed.`,
      `For hackers and systems the lesson is practical. The average score of a hacker over a few systems says little: at n = ${F.int(small.n)} its standard deviation is ${F.num(small.theory.sdMean, 2)}, against a mean of ${F.num(s.law.mu, 2)}. But the uncertainty is known, and it falls with the square root of the number of attempts. And estimating the variability of a hacker, for example to tell a steady attacker from one that alternates successes and failures, takes far more data than estimating its mean.`,
    ];
  },
  distNames: { outcome: 'HW3 outcome + score', binomial: `Bin(${BINOMIAL.trials}, ${EN.plain(BINOMIAL.q)})`, uniform: 'Uniform 0-10', beta: `Beta(${BETA.a}, ${BETA.b}) × 10` },
  quantityNames: { mean: 'M_k', variance: 's_k²' },
  tips: {
    trajectory: (hit, name) =>
      hit.kind === 'bin'
        ? `${name} between ${EN.num(hit.from, 3)} and ${EN.num(hit.to, 3)} at score ${EN.int(hit.k)}: ${EN.int(hit.count)} hackers of ${EN.int(hit.sample)}, ${EN.num(hit.expected, 1)} expected from the normal law`
        : `Score ${EN.int(hit.step)}: ${name} of hacker 1 ${EN.num(hit.first, 4)}; true value ${EN.num(hit.mean, 4)}, band between ${EN.num(hit.mean - 2 * hit.sd, 4)} and ${EN.num(hit.mean + 2 * hit.sd, 4)}`,
    step: (r) => (r.k === 1 ? `Step 1: x = ${EN.sig(r.x)}, M = ${EN.sig(r.mean)}, SS = 0` : `Step ${r.k}: x = ${EN.sig(r.x)}, δ = ${EN.sig(r.delta)}, M = ${EN.sig(r.mean)}, SS = ${EN.sig(r.ss)}, s² = ${EN.sig(r.variance)}`),
    stability: (r) => `c = 10^${r.power}: relative error ${EN.sci(r.errors.naive)} (textbook), ${EN.sci(r.errors.twoPass)} (two passes), ${EN.sci(r.errors.welford)} (Welford)`,
    score: (b, discrete) => {
      const where = discrete ? `Score ${b.k}` : `From ${b.k} to ${b.k + 1}`;
      return b.share === null ? `${where}: law ${EN.pct(b.prob, 2)}` : `${where}: simulation ${EN.pct(b.share, 3)}, law ${EN.pct(b.prob, 3)}`;
    },
    mean: (pt, law, m) => `n = ${EN.int(pt.n)}: average of M_n ${EN.num(pt.meanStats.mean, 4)}, μ = ${EN.sig(law.mu)}, band ± ${EN.num(1.959963984540054 * pt.theory.sdMean / Math.sqrt(m), 4)}`,
    variance: (pt, law, m) => `n = ${EN.int(pt.n)}: average of s_n² ${EN.num(pt.varStats.mean, 4)}, σ² = ${EN.sig(law.variance)} (band ± ${EN.num(1.959963984540054 * pt.theory.sdVariance / Math.sqrt(m), 4)}); average of SS_n/n ${EN.num(pt.biased, 4)}, expected ${EN.num(pt.theory.biased, 4)}`,
    spread: (r) => `n = ${EN.int(r.n)}: Var(M_n) ${EN.small(r.varMean)} (theory ${EN.small(r.varMeanTheory)}), Var(s_n²) ${EN.small(r.varVariance)} (theory ${EN.small(r.varVarianceTheory)}, normal data ${EN.small(r.normalVariance)})`,
    bin: (from, to, share, normal) => `From ${EN.sig(from, 4)} to ${EN.sig(to, 4)}: hackers ${EN.pct(share, 2)}${normal === null ? '' : `, normal ${EN.pct(normal, 2)}`}`,
    coverage: (r) => `n = ${EN.int(r.n)}: t interval ${EN.pct(r.t, 2)} (t = ${EN.num(r.tQuantile, 3)}), χ² interval ${EN.pct(r.chi2, 2)}`,
    hacker: (j, mean, variance) => `Hacker ${EN.int(j)}: M_n = ${EN.num(mean, 4)}, s_n² = ${EN.num(variance, 4)}`,
    bessel: (count, variance, biased) => `${EN.int(count)} samples: average of s² ${EN.num(variance, 4)}, average of SS/n ${EN.num(biased, 4)}`,
    interval: (r, param) => `Hacker ${EN.int(r.hacker)}: mean ${EN.num(r.mean, 3)}, s² ${EN.num(r.variance, 3)}; interval for ${param === 'mean' ? 'μ' : 'σ²'} from ${EN.num(r.lo, 3)} to ${EN.num(r.hi, 3)}, ${r.ok ? 'contains' : 'misses'} the true value`,
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: after extracting the archive it opens with a double click on index.html, even offline, with the same formulas, simulations and animations. With node homework4.js it prints in the terminal the formulas step by step, the stability, the tables, a histogram and the tests; --dist, --p, --n, --m, --seed and --data change the parameters.',
    contents: 'Contents: index.html, style.css, homework4.js (Welford’s formulas, generator, simulation, statistics, charts and animation), app.js (interface and texts), README.txt.',
    zip: 'Download homework4',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'Welford’s recurrence formulas, and the sampling mean and variance of m hackers on n systems.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
    noscript: 'This program needs JavaScript.',
  },
};

export const HW4_TEXTS = { it, en };
