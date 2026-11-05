// src/pages/statistics/hw5/texts.js
// I testi dell'Homework #5 in italiano e in inglese. Li usano sia la pagina
// del sito sia il programma scaricabile, cosi' le due versioni dicono le
// stesse cose con le stesse parole. Ogni numero arriva dagli argomenti (i
// risultati dei calcoli e delle simulazioni) o dalle costanti della
// libreria: nessuna frase contiene un risultato scritto a mano.
import { ALARM_K, CONFIDENCE, DARBOUX_SAMPLES, FORMULA_MAX, FORMULA_NAMES, HANDFUL, HEAVY_DF, LEVEL_CELLS, LIMITS, SIGNIFICANCE, STEPS, TRAFFIC, TRUNCATIONS, heavySf, tailDirect } from './homework5.js';
import { NEWTON_P, RULES_N, clock } from './view.js';

/** Number formatting of one language: decimal and thousands separators, the "not available" marker, the multiplication sign. */
function formatters(decimal, thousands, na, times) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const sci = (v, digits = 1) => {
    if (missing(v)) return na;
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '-∞';
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
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '-∞';
    const [whole, part] = Math.abs(v).toFixed(digits).split('.');
    const negative = v < 0 && Math.abs(v) >= 0.5 * 10 ** -digits;
    return `${negative ? '-' : ''}${group(whole)}${part ? `${decimal}${part}` : ''}`;
  };
  // significant digits, for numbers of any size
  const sig = (v, digits = 6) => {
    if (missing(v)) return na;
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '-∞';
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
    // a number as written in the code or in a field: 0.2 -> 0,2
    plain: (v) => (missing(v) ? na : local(String(v))),
    pval: (v) => (missing(v) ? na : v === 0 ? `< ${local('1e-300')}` : v < 0.001 ? sci(v) : local(v.toFixed(3))),
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
    // an error: 0, or a power of ten
    err: (v) => (missing(v) ? na : v === 0 ? '0' : !Number.isFinite(v) ? '∞' : sci(v)),
    sci,
    ms: (v) => (missing(v) ? na : v >= 1000 ? `${local((v / 1000).toFixed(2))} s` : `${Math.max(1, Math.round(v))} ms`),
    pow: (e) => `10^${e}`,
    // a number of events: 10^6 for a million
    events: (v) => `10^${Math.round(Math.log10(v))}`,
    // cents: 1,85 € or € 1.85
    euro: (cents) => (decimal === ',' ? `${local((cents / 100).toFixed(2))} €` : `€ ${(cents / 100).toFixed(2)}`),
  };
}

/** The value of a coin, as it is written on it: 1 c, 50 c, 1 €, 2 €. */
const coinLabel = (cents) => (cents >= 100 ? `${cents / 100} €` : `${cents} c`);

/**
 * The assignment as the professor wrote it. The only changes: the number
 * 1) of the first exercise, missing in the copy received, and the LaTeX
 * \dots of the second, written as three dots.
 */
export const originalAssignment = () => [
  { type: 'p', text: '1) Given a normal density find the CDF by numerical integration.' },
  { type: 'p', text: '2) Given a choice of functions (f_1, f_2, ...) compute numerically both the Riemann and Lebesgue integral.' },
];

// ---------------------------------------------------------------------------
// Le formule, scritte una volta: le parole cambiano con la lingua
// ---------------------------------------------------------------------------

const CDF_FORMULAS = [
  'F(x) = P(X ≤ x) = ∫_(-∞)^x 1/(σ√(2π)) e^(-(t - μ)²/(2σ²)) dt = Φ((x - μ)/σ)',
  'Φ(z) = ∫_(-∞)^z φ(t) dt,        φ(t) = e^(-t²/2)/√(2π)',
].join('\n');

const ruleFormulas = (w) =>
  [
    'h = (b - a)/n,   x_i = a + i h',
    `${w.left.padEnd(16)} h [f(x_0) + f(x_1) + ... + f(x_(n-1))]                       ${w.error} O(h)`,
    `${w.midpoint.padEnd(16)} h [f(x_(1/2)) + f(x_(3/2)) + ... + f(x_(n-1/2))]             ${w.error} O(h²)`,
    `${w.trapezoid.padEnd(16)} h [f(x_0)/2 + f(x_1) + ... + f(x_(n-1)) + f(x_n)/2]          ${w.error} O(h²)`,
    `${w.simpson.padEnd(16)} h/3 [f(x_0) + 4f(x_1) + 2f(x_2) + ... + 4f(x_(n-1)) + f(x_n)]   ${w.error} O(h⁴), n ${w.even}`,
    `${w.gauss.padEnd(16)} (b - a)/2 Σ w_i f((a + b)/2 + (b - a)/2 t_i)                ${w.exact}`,
  ].join('\n');

const strategyFormulas = (w) =>
  [
    `${w.symmetry.padEnd(14)} Φ(z) = 1/2 + ∫_0^z φ(t) dt                     (z ≥ 0;  z < 0: 1/2 - ∫_z^0 φ(t) dt)`,
    `${w.truncation.padEnd(14)} Φ(z) ≈ ∫_(-L)^z φ(t) dt                      (${w.leftOut} Φ(-L))`,
    `${w.substitution.padEnd(14)} t = z - (1 - u)/u,  dt = du/u²:  Φ(z) = ∫_0^1 φ(z - (1 - u)/u) du/u²`,
  ].join('\n');

const NEWTON_FORMULAS = [
  'Φ(z_p) = p,   Φ′(z) = φ(z)',
  'z_(k+1) = z_k - (Φ(z_k) - p)/φ(z_k)',
  'q = 1 - p:   w_(k+1) = w_k + (P(Z > w_k) - q)/φ(w_k),   z_p = w',
].join('\n');

const RIEMANN_FORMULAS = [
  'a = x_0 < x_1 < ... < x_n = b,   t_i ∈ [x_(i-1), x_i]',
  'S = Σ_(i=1)^n f(t_i) (x_i - x_(i-1))',
  'm_i = inf_[x_(i-1), x_i] f,   M_i = sup_[x_(i-1), x_i] f',
  'L = Σ m_i (x_i - x_(i-1))  ≤  S  ≤  U = Σ M_i (x_i - x_(i-1))',
].join('\n');

const lebesgueFormulas = (w) =>
  [
    `m = y_0 < y_1 < ... < y_K = M,   E_k = {x : f(x) ≥ y_k},   μ = ${w.measure}`,
    'L_K = m (b - a) + Σ_(k=1)^K (y_k - y_(k-1)) μ(E_k)',
    'U_K = m (b - a) + Σ_(k=1)^K (y_k - y_(k-1)) μ(E_(k-1)),      U_K - L_K = (M - m)(b - a)/K',
    `∫ f dμ = ∫_0^∞ μ{f > y} dy      (f ≥ 0: ${w.layer})`,
  ].join('\n');

const MC_FORMULAS = [
  '∫_a^b f(x) dx = (b - a) E[f(U)],   U ~ U(a, b)',
  'Î_N = (b - a)/N Σ_(i=1)^N f(U_i),   SE = (b - a) s_N/√N,   Î_N ± 1,96 SE',
].join('\n');

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', '×');

/** The line of numbers under a hypothesis test, whatever its kind. */
function testLineIt(t) {
  const F = IT;
  switch (t.kind) {
    case 'ks':
      return `D = ${F.num(t.D, 4)} su ${F.int(t.n)} valori (scarto massimo a x = ${F.num(t.at, 2)}), √n D corretto = ${F.num(t.statistic, 3)}, p = ${F.pval(t.pValue)}`;
    case 'proportion':
      return `${F.int(t.count)} su ${F.int(t.m)}, cioè ${F.pct(t.rate, 3)} contro ${F.pct(t.expected, 3)}, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'bias':
      return `media delle stime ${F.sig(t.mean, 7)} contro ${F.sig(t.expected, 7)} su ${F.int(t.m)} ripetizioni, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

/** How the reference integral of a table was obtained: exact, or one of the two estimates of referenceIntegral. */
const refIt = (ref) => (ref.exact ? 'esatto' : ref.method === 'composite' ? `di riferimento (Gauss composta, ± ${IT.err(ref.uncertainty)})` : 'secondo Simpson adattivo');

const ruleNamesIt = { left: 'Rettangoli', midpoint: 'Punti medi', trapezoid: 'Trapezi', simpson: 'Simpson', gauss: 'Gauss-Legendre' };
// i nomi dentro una frase: "con i trapezi", "con Simpson"
const ruleInlineIt = { left: 'i rettangoli', midpoint: 'i punti medi', trapezoid: 'i trapezi', simpson: 'Simpson', gauss: 'Gauss-Legendre' };
const functionNamesIt = { square: 'x² su [0, 1]', bell: 'La campana su [-3, 3]', steps: 'A gradini', oscillating: 'sin(1/x)', unbounded: '1/√x', traffic: 'Traffico di un giorno', custom: 'Scritta da voi' };

const it = {
  fmt: IT,
  formulas: {
    cdf: CDF_FORMULAS,
    rules: ruleFormulas({ left: 'rettangoli', midpoint: 'punti medi', trapezoid: 'trapezi', simpson: 'Simpson', gauss: 'Gauss-Legendre', error: 'errore', even: 'pari', exact: 'esatta fino al grado 2n - 1' }),
    strategies: strategyFormulas({ symmetry: 'simmetria', truncation: 'troncamento', substitution: 'sostituzione', leftOut: 'resta fuori' }),
    newton: NEWTON_FORMULAS,
    riemann: RIEMANN_FORMULAS,
    lebesgue: lebesgueFormulas({ measure: 'lunghezza totale', layer: 'la torta a strati' }),
    montecarlo: MC_FORMULAS,
  },
  ui: {
    index: 'Indice',
    indexTitle: 'Indice dell’homework',
    close: 'Chiudi',
    backToTop: 'Torna su',
    computing: 'Calcolo in corso...',
    language: 'Lingua',
    error: (m) => `Errore: ${m}`,
  },
  sections: {
    assignment: '0. La consegna',
    part1: 'Part 1 - La funzione di ripartizione della normale',
    area: '1.1 La CDF è un’area',
    tryArea: 'Prova: l’area sotto la campana',
    rules: '1.2 Cinque modi di sommare fette',
    infinity: '1.3 Il problema di -∞',
    convergence: '1.4 Quanti punti servono',
    table: '1.5 La tavola della normale, ricostruita',
    quantiles: '1.6 All’indietro: i quantili',
    tails: '1.7 Le code lontane e le soglie d’allarme',
    tryAlarm: 'Prova: la soglia d’allarme',
    data: '1.8 Il modello alla prova dei dati',
    checks: '1.9 Verifiche',
    part2: 'Part 2 - Integrale di Riemann e di Lebesgue',
    idea: '2.1 Due modi di contare',
    tryCoins: 'Prova: le monete di Lebesgue',
    functions: '2.2 Le funzioni',
    riemann: '2.3 Riemann: strisce verticali',
    lebesgue: '2.4 Lebesgue: fette orizzontali',
    trySlices: 'Prova: verticale o orizzontale',
    compare: '2.5 Chi vince, e quando',
    traffic: '2.6 Il traffico di un server',
    montecarlo: '2.7 Monte Carlo, il Lebesgue dei dadi',
    tryMc: 'Prova: Monte Carlo dal vivo',
    dirichlet: '2.8 La funzione di Dirichlet',
    tests: '3. I test d’ipotesi',
    history: '4. Il contesto storico',
    conclusion: '5. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna ha due parti. La prima chiede di trovare la funzione di ripartizione (CDF) di una densità normale per integrazione numerica; la seconda, data una scelta di funzioni f_1, f_2, ..., di calcolarne numericamente sia l’integrale di Riemann sia quello di Lebesgue.',
      'La pagina procede per esempi. La Part 1 calcola Φ con cinque regole scritte da zero, mostra come aggirare il -∞, misura quanti punti servono e poi usa la CDF: ricostruisce la tavola dei libri di statistica, trova all’indietro l’1,96 degli intervalli al 95% e le soglie d’allarme di un sistema che segnala anomalie, e la mette alla prova contro dati simulati. La Part 2 integra sei funzioni scelte per mostrare le differenze, più una che potete scrivere voi, nei due modi: le strisce verticali di Riemann e le fette orizzontali di Lebesgue; poi il traffico di un server, Monte Carlo e la funzione di Dirichlet. Tutti i numeri sono calcolati nel browser, e il programma scaricabile stampa gli stessi.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese. Le uniche modifiche: il numero 1) del primo esercizio, che mancava nella copia ricevuta, e il \\dots di LaTeX del secondo, scritto con tre punti.',
  },
  part1: {
    intro: [
      'X ~ N(μ, σ²) ha densità a campana e funzione di ripartizione F(x) = P(X ≤ x), l’area sotto la campana a sinistra di x. Quell’area non ha una formula con un numero finito di funzioni elementari (Liouville lo dimostrò nel 1835), quindi va calcolata: sommando fette, come chiede la consegna. Ogni N(μ, σ²) si riporta alla normale standard con z = (x - μ)/σ, quindi basta saper calcolare Φ.',
    ],
  },
  area: {
    intro: [
      'Il grafico è la densità della normale standard e l’area colorata è Φ(1,96) = 0,975: la probabilità che una normale stia sotto 1,96 deviazioni standard dalla media, il numero dietro a ogni intervallo di confidenza al 95%. Integrare numericamente vuol dire sostituire quell’area con pezzi di cui si sa calcolare l’area: rettangoli, trapezi, archi di parabola.',
    ],
    chartTitle: 'La densità della normale standard e Φ(1,96) = 0,975, l’area colorata',
  },
  tryArea: {
    intro: [
      'Scegliete μ, σ e il punto x, la regola e il numero di pezzi n. Con la simmetria i pezzi coprono [μ, x] e la metà a sinistra di μ vale 1/2 senza calcoli; con il troncamento coprono [μ - 4σ, x], e quello che sta a sinistra di μ - 4σ (3,2 × 10^-5) resta fuori. Passate sopra un pezzo per vederne l’area. Provate Simpson con n = 2, poi Gauss con 2 nodi: con gli stessi due valori della funzione, Gauss sbaglia molto meno.',
    ],
    muLabel: 'μ',
    sigmaLabel: 'σ',
    zLabel: (x, z) => `x = ${IT.num(x, 2)}  (z = ${IT.num(z, 2)})`,
    ruleLabel: 'Regola',
    nLabel: (n, rule) => (rule === 'gauss' ? `n = ${n} nodi` : `n = ${n} pezzi`),
    strategyLabel: '-∞',
    strategies: { symmetry: 'Simmetria', truncation: 'Troncamento a -4σ' },
    result: (st, rule) => {
      const F = IT;
      const how = st.base ? `1/2 ${st.sign > 0 ? '+' : '-'} ${F.num(st.sum, 8)}` : F.num(st.sum, 8);
      return `F(${F.num(st.x, 2)}) ≈ ${how} = ${F.num(st.value, 8)} con ${ruleInlineIt[rule]} e n = ${st.n} (${st.evaluations} valori della densità). Valore esatto ${F.num(st.exact, 8)}, errore ${F.err(st.error)}.`;
    },
    chartTitle: (st, rule) => `F(${IT.num(st.x, 2)}) con ${ruleInlineIt[rule]}, n = ${st.n}`,
  },
  rules: {
    intro: [
      'Cinque regole, dalla più ingenua alla più furba. Le prime quattro usano punti equidistanti: i rettangoli prendono il valore all’estremo sinistro di ogni pezzo, i punti medi quello al centro, i trapezi uniscono i due estremi con un segmento, Simpson tre punti con un arco di parabola. Gauss-Legendre sceglie invece dove valutare la funzione: n nodi e n pesi calcolati perché la regola sia esatta per ogni polinomio di grado fino a 2n - 1.',
    ],
    formulasTitle: 'Le cinque regole su [a, b]',
    codeTitle: 'Il codice: integrate() di homework5.js, una riga per regola',
    tableTitle: (n) => `Φ(1,96) con n = ${n}: valore, errore e valori della densità usati`,
    cols: { rule: 'Regola', n: 'n', evaluations: 'Valori di φ', value: 'Φ(1,96) calcolata', error: 'Errore' },
    gaussTitle: 'Gauss-Legendre con 5 nodi su [-1, 1]: le radici del polinomio di Legendre P_5 e i loro pesi',
    gaussCols: { i: 'i', node: 'Nodo t_i', weight: 'Peso w_i' },
    after: (rows) => {
      const F = IT;
      const g = rows.find((r) => r.rule === 'gauss');
      const s = rows.find((r) => r.rule === 'simpson');
      const l = rows.find((r) => r.rule === 'left');
      return [`Con ${RULES_N} pezzi i rettangoli sbagliano di ${F.err(l.error)}, Simpson di ${F.err(s.error)}, Gauss con ${g.n} nodi ${g.error === 0 ? 'non sbaglia nessuna cifra: il risultato coincide con il riferimento fino all’ultima' : `di ${F.err(g.error)}`}. Non è magia: φ è una funzione liscissima, e Gauss sfrutta tutta la sua regolarità. Nel grafico di Gauss ogni nodo sta dentro un rettangolo largo quanto il suo peso: anche Gauss è una somma di Riemann, con strisce e punti scelti bene.`];
    },
  },
  infinity: {
    intro: [
      'Il limite inferiore di Φ è -∞, e nessuna regola integra su un intervallo infinito. Tre modi per aggirarlo. La simmetria: φ è pari e l’area totale è 1, quindi la metà sinistra vale 1/2 esatto e resta da integrare solo [0, z]. Il troncamento: ci si ferma a -L e si accetta di perdere Φ(-L). La sostituzione: un cambio di variabile porta (-∞, z] su (0, 1], e l’integranda va a zero all’estremo.',
    ],
    formulasTitle: 'Tre modi di evitare -∞',
    chooseLabel: 'Regola',
    tableTitle: (rule, n) => `Errore su Φ(z) con ${rule === 'gauss' ? `Gauss-Legendre, ${n} nodi` : `Simpson, n = ${n}`}`,
    cols: { z: 'z', reference: 'Φ(z)', symmetry: 'Simmetria', trunc4: `Troncamento a -${TRUNCATIONS[0]}`, trunc8: `Troncamento a -${TRUNCATIONS[1]}`, substitution: 'Sostituzione' },
    after: (f) => {
      const F = IT;
      return [
        `Con ${f.n} nodi di Gauss la simmetria sbaglia al massimo di ${F.err(f.gauss[0])}: integra sull’intervallo più corto e la metà sinistra la conosce esatta. Il troncamento a -${TRUNCATIONS[0]} non scende mai sotto ${F.err(f.leftOut4)}, l’area che lascia fuori, qualunque regola si usi; a -${TRUNCATIONS[1]} quell’area è ${F.err(f.leftOut8)}, ma l’intervallo è lungo e servono più punti (errore fino a ${F.err(f.gauss[2])}). La sostituzione non perde niente per strada, ma comprime la campana vicino a u = 1 e con pochi punti fa peggio (fino a ${F.err(f.gauss[3])}).`,
        'La lezione pratica: prima di aumentare i punti conviene sfruttare quello che si sa della funzione. Qui una sola osservazione, la simmetria, vale più di mille punti in più.',
      ];
    },
  },
  convergence: {
    intro: [
      'Quanti punti servono? Il grafico misura l’errore su Φ(1,96) raddoppiando n, su scale logaritmiche: ogni regola diventa una retta, con pendenza pari al suo ordine. I rettangoli dimezzano l’errore quando si raddoppiano i punti, punti medi e trapezi lo dividono per 4, Simpson per 16; Gauss-Legendre scende ancora più in fretta, finché incontra il pavimento degli arrotondamenti dei numeri a 64 bit, intorno a 10^-16.',
    ],
    chartTitle: (z) => `Errore su Φ(${IT.num(z, 2)}) al crescere di n (scale logaritmiche)`,
    tableTitle: 'Errore per n raddoppiato',
    cols: { n: 'n' },
    after: (f) => {
      const F = IT;
      const order = (r) => F.num(f.orders[r], 2);
      return [
        `Gli ordini misurati sulle rette sono ${order('left')} per i rettangoli, ${order('midpoint')} per i punti medi, ${order('trapezoid')} per i trapezi e ${order('simpson')} per Simpson, come dice la teoria (1, 2, 2, 4). Per avere dieci decimali giusti Simpson usa ${F.int(f.enough.simpson)} valori di φ e Gauss ${F.int(f.enough.gauss)}; i rettangoli non ci arrivano nemmeno con 16.384 (errore ${F.err(f.left16384)}), i punti medi neppure (${F.err(f.midpoint16384)}).`,
        'Due avvertenze pratiche. Oltre il pavimento più punti non aiutano: l’errore risale, perché si sommano più arrotondamenti. E l’ordine vale per funzioni lisce: con un salto o un angolo anche Simpson torna al primo ordine, come si vede nella Part 2.',
      ];
    },
  },
  table: {
    intro: [
      'In fondo a ogni libro di statistica c’è la tavola di Φ(z): righe per la prima cifra decimale di z, colonne per la seconda. Qui la ricostruiamo: Φ(0) = 1/2, poi un arco di parabola di Simpson per ogni passo di 0,01, sommato al precedente. Due valori di φ per cella. Passate sopra le celle evidenziate: sono gli z dei quantili più usati.',
    ],
    title: (zt) => `Φ(z) per z = riga + colonna, ${IT.int(zt.evaluations)} valori di φ in tutto`,
    after: (zt) => {
      const cell = (z) => zt.table[Math.floor(Math.round(z * 100) / 10)].cells[Math.round(z * 100) % 10].value;
      return [`La cella peggiore sbaglia di ${IT.err(zt.maxError)} (a z = ${IT.num(zt.at, 2)}): ben sotto la mezza unità della quarta cifra, l’ultima che la tavola stampa. Il valore ${IT.num(cell(1.96), 4)} nella riga 1,9 e colonna ,06 è l’1,96 degli intervalli al 95%; 0,95 cade fra ${IT.num(cell(1.64), 4)} (1,64) e ${IT.num(cell(1.65), 4)} (1,65), ed è da lì che viene 1,645.`];
    },
  },
  quantiles: {
    intro: [
      'La tavola si usa anche all’indietro: dato p, trovare z_p con Φ(z_p) = p. È un’equazione, e il metodo di Newton la risolve usando la derivata di Φ, che è φ, nota esattamente: ogni passo corregge z dell’errore diviso la pendenza. Per non perdere cifre nella coda conviene lavorare sulla probabilità più piccola, q = 1 - p, integrata direttamente.',
    ],
    formulasTitle: 'Il metodo di Newton per il quantile',
    tableTitle: 'I quantili della normale, trovati all’indietro',
    cols: { p: 'p', z: 'z_p con Newton', steps: 'Passi', reference: 'Riferimento', difference: 'Differenza' },
    newtonTitle: (p) => `Newton passo per passo per p = ${IT.plain(p)}, partendo da z = 0`,
    newtonCols: { k: 'Passo', z: 'z_k', F: 'Φ(z_k)', dz: 'Correzione', error: 'Errore' },
    chartTitle: 'Errore di z_k dopo ogni passo (scala logaritmica)',
    after: (rows) => {
      const last = rows.find((r) => r.p === NEWTON_P);
      return [`z_0,975 = ${IT.num(last.z, 12)} è l’1,96 dell’Homework #4: lo moltiplicavamo per l’errore standard per avere gli intervalli al 95%. Nei primi passi Newton avanza lento, perché la campana si appiattisce; vicino alla radice ogni passo raddoppia le cifre giuste, come mostra la retta sempre più ripida del grafico.`];
    },
  },
  tails: {
    intro: [
      'Lontano nella coda le probabilità diventano minuscole, e il modo di calcolarle conta. Viene naturale calcolare P(Z > k) come 1 - Φ(k), ma Φ(k) è vicinissimo a 1 e la sottrazione cancella le cifre: è la stessa cancellazione della formula da manuale della varianza nell’Homework #4. Integrando direttamente la coda, Φ(-k) con la sostituzione, non si sottrae niente.',
    ],
    tableTitle: 'P(Z > k) nei due modi, con l’errore relativo',
    cols: { k: 'k', reference: 'P(Z > k)', subtraction: '1 - Φ(k)', subtractionError: 'Errore', direct: 'Diretta', directError: 'Errore' },
    chartTitle: 'Errore relativo dei due modi al crescere di k (scala logaritmica)',
    legend: ['1 - Φ(k)', 'coda integrata direttamente'],
    after: (f) => {
      const F = IT;
      return [`La sottrazione perde la sesta cifra da k = ${f.micro} e da k = ${f.total} sbaglia di più del 50%: a k = 8 dà ${F.sci(f.at8.subtraction)} invece di ${F.sci(f.at8.reference)}, a k = 9 ${F.sci(f.at9.subtraction)} invece di ${F.sci(f.at9.reference)}. La coda diretta non sbaglia mai più di ${F.err(f.worstDirect)} in relativo.`];
    },
    alarmIntro: [
      'A cosa serve una coda così lontana? A un sistema che segnala anomalie: un IDS che allarma quando il numero di richieste al minuto, i byte di una sessione o il tempo di risposta di un login superano la media di k deviazioni standard. Se i dati sono normali, la frazione di eventi legittimi segnalati per errore è proprio P(Z > k), e con un milione di eventi al giorno anche 10^-6 vuol dire un falso allarme al giorno.',
    ],
    alarmTitle: 'Soglie a k deviazioni standard, con un milione di eventi al giorno',
    alarmCols: { k: 'k', normal: 'Falsi allarmi, dati normali', normalPerDay: 'Al giorno', heavy: `Code pesanti (t di Student, ${HEAVY_DF} g.d.l.)`, heavyPerDay: 'Al giorno', ratio: 'Rapporto' },
    alarmAfter: (rows) => {
      const r3 = rows.find((r) => r.k === 3);
      const r5 = rows.find((r) => r.k === 5);
      return [`Il guaio è che la soglia giusta dipende dalla coda, e le code dei dati veri raramente sono normali. Con dati a code pesanti (una t di Student con ${HEAVY_DF} gradi di libertà, riscalata per avere la stessa media e la stessa varianza) la regola dei tre sigma segnala ${IT.num(r3.ratio, 1)} volte più eventi del previsto, e a 5 sigma ${IT.int(r5.ratio)} volte: la soglia d’allarme calcolata sulla normale sommerge chi la usa di falsi allarmi. La sezione 1.8 mostra come accorgersene dai dati.`];
    },
  },
  tryAlarm: {
    intro: [
      'Dite quanti eventi passano al giorno e quanti falsi allarmi siete disposti a sopportare: la pagina trova la soglia k con il metodo di Newton sulla coda integrata direttamente, e mostra cosa succederebbe con le stesse soglie se i dati avessero code pesanti.',
    ],
    eventsLabel: 'Eventi al giorno',
    rateLabel: 'Falsi allarmi accettati',
    rates: { tenDay: '10 al giorno', day: '1 al giorno', week: '1 a settimana', month: '1 al mese' },
    result: (st) => {
      const F = IT;
      return `Con ${F.events(st.events)} eventi al giorno, P(Z > k) deve valere ${F.sci(st.target)}: la soglia è k = ${F.num(st.k, 4)} deviazioni standard (${st.steps} passi di Newton). Se i dati hanno code pesanti, la stessa soglia dà ${F.num(st.heavyPerDay, 1)} falsi allarmi al giorno invece di ${F.sig(st.perDay, 3)}.`;
    },
    chartTitle: 'P(Z > k) per la normale e per i dati a code pesanti, con la frequenza accettata tratteggiata (scala logaritmica)',
    legend: ['dati normali', `code pesanti, t con ${HEAVY_DF} g.d.l.`, 'frequenza accettata'],
  },
  data: {
    intro: [
      'Una CDF calcolata si può mettere alla prova contro dei dati. Qui i dati sono simulati con il metodo di Box e Muller, che trasforma coppie di numeri uniformi in coppie di normali indipendenti; il test di Kolmogorov e Smirnov misura lo scarto massimo D fra la funzione di ripartizione empirica dei dati e la nostra Φ numerica. Lo stesso test, sui dati a code pesanti della sezione 1.7, deve accorgersi che non sono normali: è il controllo da fare prima di fidarsi di una soglia.',
    ],
    fieldsIntro: 'Il seme e il numero di valori simulati; gli stessi semi alimentano anche Monte Carlo nella sezione 2.7.',
    seedLabel: 'Seme',
    seedHint: `da 0 a ${IT.int(LIMITS.seed[1])}`,
    sampleLabel: 'Valori simulati n',
    sampleHint: `da ${IT.int(LIMITS.sample[0])} a ${IT.int(LIMITS.sample[1])}`,
    randomSeed: 'Seme a caso',
    restore: 'Valori della pagina',
    stale: 'Un campo non è valido: i risultati restano quelli degli ultimi valori validi.',
    pending: 'Nuova simulazione in corso...',
    badgeTask: 'Valori della pagina: seme 2026, 10.000 valori, Monte Carlo con 1.000 punti e 1.000 ripetizioni.',
    badgeCustom: (p) => `Valori vostri: seme ${p.seed}, ${IT.int(p.sample)} valori, Monte Carlo con ${IT.int(p.points)} punti e ${IT.int(p.reps)} ripetizioni.`,
    run: (s) => `${IT.int(s.draws)} valori generati e ${IT.ms(s.simMs)} di calcolo, nel worker del browser.`,
    errors: {
      empty: 'Il campo è vuoto.',
      notInteger: 'Serve un numero intero, senza segni né decimali.',
      range: (min, max) => `Serve un numero fra ${IT.int(min)} e ${IT.int(max)}.`,
    },
    normalTitle: (n) => `Box-Muller: funzione di ripartizione empirica di ${IT.int(n)} valori contro Φ numerica`,
    heavyTitle: (n) => `Code pesanti: funzione di ripartizione empirica di ${IT.int(n)} valori contro Φ numerica`,
    legend: ['empirica', 'Φ numerica'],
    after: (s) => {
      const F = IT;
      return [
        `Sui dati di Box-Muller lo scarto massimo è D = ${F.num(s.normal.ks.D, 4)} (p = ${F.pval(s.normal.ks.pValue)}), e sopra 3 deviazioni standard cade il ${F.pct(s.normal.tail.rate, 3)} dei valori contro il ${F.pct(s.normal.tail.expected, 3)} teorico. Sui dati a code pesanti D = ${F.num(s.heavy.ks.D, 4)} (p = ${F.pval(s.heavy.ks.pValue)}), e sopra 3 deviazioni standard ne cade il ${F.pct(s.heavy.tail.rate, 3)}: ${F.num(s.heavy.tail.rate / s.heavy.tail.expected, 1)} volte il teorico, proprio i falsi allarmi in più della sezione 1.7.`,
        'Si noti dove la funzione empirica si stacca dalla normale: al centro, non solo nelle code. Una t riscalata ha la stessa varianza della normale ma è più stretta in mezzo e più larga ai lati, e il test lo vede guardando tutta la curva.',
      ];
    },
  },
  checks: {
    intro: 'Ogni regola e ogni costante della pagina è controllata contro un riferimento indipendente: i nodi di Gauss contro la loro formula chiusa e NumPy, le regole contro polinomi che devono integrare esattamente, Φ, le code e i quantili contro mpmath a 40 cifre, gli integrali esatti della Part 2 contro mpmath, la t di Student e la legge di Kolmogorov contro SciPy, i generatori contro il codice C di riferimento e contro un’implementazione Python scritta a parte. Il riferimento di Φ usato nelle tabelle (la funzione gamma incompleta) non usa nessuna regola di quadratura: una regola controllata con sé stessa non dimostrerebbe niente.',
    summary: (ok, total) => `${ok} controlli su ${total} superati.`,
    details: (n) => `Tutti i ${n} controlli`,
    groups: { quadrature: 'Le regole', normal: 'La normale', part2: 'La Part 2', generator: 'I generatori' },
    cols: { check: 'Controllo', expected: 'Atteso', result: 'Esito' },
    ok: 'superato',
    failed: 'fallito',
  },
  part2: {
    intro: [
      'Riemann e Lebesgue misurano la stessa area in due modi. Riemann taglia l’asse x in strisce e in ogni striscia legge l’altezza della funzione; Lebesgue taglia l’asse y in livelli e per ogni livello misura quanta parte dell’asse x sta sopra. Per le funzioni continue i due integrali coincidono; Lebesgue vale per molte più funzioni e si comporta molto meglio con i limiti, ed è per questo che la probabilità moderna (il valore atteso è un integrale di Lebesgue) è costruita su di lui.',
    ],
  },
  idea: {
    intro: [
      'Lebesgue spiegava la differenza con le monete. Dovete pagare un debito con le monete che avete in tasca. Potete tirarle fuori una alla volta e sommarle nell’ordine in cui escono: è Riemann, che percorre l’asse x da sinistra a destra. Oppure potete prima dividerle per valore, contare quante sono di ogni tipo e moltiplicare: è Lebesgue, che raggruppa i punti per valore della funzione. Il totale è lo stesso; il secondo modo però non si preoccupa dell’ordine, e per questo funziona anche quando l’ordine è un caos.',
    ],
  },
  tryCoins: {
    intro: [
      `Una manciata di ${HANDFUL} monete. Sopra, nell’ordine in cui escono dalla tasca, con la somma che cresce moneta dopo moneta (Riemann). Sotto, le stesse monete divise per valore: quante ce ne sono di ogni tipo, per il loro valore (Lebesgue). Le somme sono in centesimi interi, quindi nessun arrotondamento può nascondere una differenza.`,
    ],
    orderTitle: 'Riemann: nell’ordine in cui escono',
    groupTitle: 'Lebesgue: raggruppate per valore',
    running: (total) => `Somma progressiva: ${IT.euro(total)}`,
    groupLine: (g) => `${g.count} × ${coinLabel(g.value)} = ${IT.euro(g.subtotal)}`,
    total: (h) => `Riemann ${IT.euro(h.total)}, Lebesgue ${IT.euro(h.byGroups)}: ${h.total === h.byGroups ? 'uguali' : 'diversi'}.`,
    another: 'Un’altra manciata',
    coinLabel,
  },
  functions: {
    intro: [
      'Sei funzioni, scelte ciascuna per mostrare qualcosa. x² è liscia e monotona; la campana è quella della Part 1; la funzione a gradini è una funzione semplice, il mattone di Lebesgue; sin(1/x) oscilla infinite volte vicino a 0 restando limitata; 1/√x è infinita in 0 ma ha area finita; il traffico di un server è un esempio realistico, con un attacco. Più una funzione che scrivete voi. La scelta vale per le sezioni 2.3, 2.4, 2.5 e per la prova che le segue.',
    ],
    tableTitle: 'Le funzioni e i loro integrali esatti',
    cols: { name: 'Funzione', interval: 'Intervallo', formula: 'f(x)', integral: 'Integrale esatto', feature: 'Che cosa mostra' },
    features: {
      square: 'Liscia: entrambi i metodi funzionano',
      bell: 'Liscia, con un picco: la Part 1',
      steps: 'Semplice: Lebesgue è esatto con pochi livelli',
      oscillating: 'Infinite oscillazioni vicino a 0',
      unbounded: 'Illimitata, con area finita',
      traffic: 'Dati di un giorno, con un attacco',
    },
    chooseLabel: 'Funzione',
    customTitle: 'La vostra funzione',
    formulaLabel: 'f(x) =',
    formulaHint: `Numeri, x, ${FORMULA_NAMES.constants.join(', ')}, + - * / ^, parentesi, |...| per il valore assoluto, e ${FORMULA_NAMES.functions.join(', ')}. Al massimo ${FORMULA_MAX} caratteri; 2x vale 2*x.`,
    aLabel: 'da a =',
    bLabel: 'a b =',
    restore: 'Ripristina',
    errors: {
      empty: 'Scrivete una formula.',
      tooLong: `Al massimo ${FORMULA_MAX} caratteri.`,
      character: (e) => `Carattere non ammesso "${e.text}" in posizione ${e.at + 1}.`,
      unknown: (e) => `Nome sconosciuto "${e.text}" in posizione ${e.at + 1}.`,
      call: (e) => `${e.text} vuole le parentesi: ${e.text}(x).`,
      parens: () => 'Parentesi non bilanciate.',
      bars: () => 'Barre del valore assoluto non bilanciate.',
      syntax: (e) => `Formula incompleta o simbolo inatteso in posizione ${e.at + 1}.`,
      end: () => 'La formula finisce troppo presto.',
      deep: () => 'Troppe parentesi annidate.',
      notDefined: (e) => `La funzione non è definita su ${IT.pct(e.share, 0)} dei punti dell’intervallo.`,
      range: () => 'Estremi non validi: servono due numeri fra -1.000.000 e 1.000.000.',
      order: () => 'Serve a < b.',
    },
    stale: 'Formula non valida: le sezioni mostrano l’ultima funzione valida.',
    customNote: (c) => [c.undefinedPoints ? `In ${c.undefinedPoints} punti su 2.001 la formula non è definita: lì vale 0, che non cambia l’integrale finché sono punti isolati.` : null, c.infinite ? `In ${c.infinite} punti è infinita: Riemann lo segnala, Lebesgue la taglia a 1.000.` : null].filter(Boolean).join(' '),
  },
  functionNames: functionNamesIt,
  riemann: {
    intro: [
      'Riemann divide [a, b] in n strisce e in ogni striscia prende il valore della funzione in un punto: l’estremo sinistro, il destro, il centro. La funzione è integrabile secondo Riemann se, stringendo le strisce, ogni scelta dei punti porta allo stesso numero; il test di Darboux lo verifica con la somma inferiore (il valore più basso di ogni striscia) e quella superiore (il più alto), che devono avvicinarsi.',
    ],
    formulasTitle: 'Somme di Riemann e di Darboux',
    kindLabel: 'Altezza della striscia',
    kinds: { left: 'Sinistra', right: 'Destra', midpoint: 'Centro', lower: 'Minimo', upper: 'Massimo' },
    chartTitle: (name, n, kind) => `${name}: ${n} strisce, altezza al ${{ left: 'estremo sinistro', right: 'estremo destro', midpoint: 'centro', lower: 'minimo', upper: 'massimo' }[kind]}`,
    tableTitle: (ref) => `Somme di Riemann (integrale ${refIt(ref)} ${IT.sig(ref.value, 10)})`,
    cols: { n: 'n', left: 'Sinistra', right: 'Destra', midpoint: 'Centro', lower: 'Inferiore', upper: 'Superiore', gap: 'Sup. - inf.' },
    note: `Minimo e massimo di ogni striscia sono stimati su ${DARBOUX_SAMPLES + 1} punti della striscia: esatti per i tratti monotoni, vicini per quelli lisci.`,
    after: (rows, key) => {
      const last = rows[rows.length - 1];
      if (!Number.isFinite(last.gap)) return ['Qui la somma superiore è infinita per ogni n: la prima striscia contiene lo 0, dove la funzione vale infinito. In senso proprio la funzione non è integrabile secondo Riemann, e il suo integrale esiste solo come limite (integrale improprio): le somme al centro si avvicinano a 2, ma lentamente.'];
      if (key === 'steps') return [`Con n = ${IT.int(last.n)} strisce sup. - inf. vale ${IT.err(last.gap)}: la differenza viene solo dalle tre strisce a cavallo dei salti, e scende come 1/n.`];
      if (key === 'oscillating') return [`Vicino a 0 ogni striscia contiene infinite onde, e minimo e massimo valgono -1 e 1: sup. - inf. scende lentamente (${IT.err(last.gap)} con n = ${IT.int(last.n)}). La funzione resta integrabile secondo Riemann, perché le strisce cattive occupano uno spazio sempre più piccolo.`];
      return [`Con n = ${IT.int(last.n)} strisce sup. - inf. vale ${IT.err(last.gap)}: inferiore e superiore si stringono intorno all’integrale, ed è la definizione di Riemann vista all’opera.`];
    },
  },
  lebesgue: {
    intro: [
      'Lebesgue divide invece i valori: K livelli fra il valore più basso m e il più alto M. Per ogni livello misura l’insieme dove la funzione sta sopra, qualunque forma abbia: un intervallo, dieci, infiniti. Ogni fascia orizzontale ha altezza (M - m)/K e larghezza pari a quella misura. La somma inferiore e quella superiore differiscono di (M - m)(b - a)/K, qualunque sia la funzione: è questa garanzia, che non dipende da come la funzione si comporta lungo x, a rendere Lebesgue così potente.',
      `Il prezzo è misurare gli insiemi di livello. Qui lo fa una griglia di ${IT.int(LEVEL_CELLS)} celle, raffinata con la bisezione dove la funzione attraversa il livello: gli estremi sono esatti anche in un salto, ma un’onda che nasce e muore dentro una cella non si vede. Le funzioni illimitate si tagliano a un tetto T, e quello che sta sopra resta fuori.`,
    ],
    formulasTitle: 'Somme di Lebesgue con K livelli',
    chartTitle: (name, K) => `${name}: ${K} livelli, ogni fascia sopra l’insieme dove f supera il suo livello`,
    tableTitle: (ref) => `Somme di Lebesgue (integrale ${refIt(ref)} ${IT.sig(ref.value, 10)})`,
    cols: { K: 'K', lower: 'Inferiore', upper: 'Superiore', midpoint: 'Media', gap: 'Sup. - inf.' },
    capNote: (cap, exact) => `Valori tagliati a T = ${IT.int(cap)}: le somme integrano min(f, T), che vale ${IT.sig(exact, 8)}; la parte sopra il tetto, 1/T = ${IT.sig(1 / cap, 3)}, resta fuori.`,
    distributionTitle: 'Lo sguardo di Lebesgue: μ{f ≥ y}, la misura dell’insieme sopra ogni livello y',
    rearrangementTitle: 'La funzione (viola) e la stessa con i valori riordinati dal più alto (blu): stessa area',
    after: (rows, key) => {
      const last = rows[rows.length - 1];
      if (key === 'steps') return [`Con K = ${rows[0].K} livelli i valori della funzione, ${[...STEPS.values].sort((a, b) => a - b).map((v) => IT.plain(v)).join(', ')}, cadono tutti su un livello (il passo è ${IT.plain((rows[0].M - rows[0].m) / rows[0].K)}): la somma inferiore è già esatta, ${IT.sig(rows[0].lower, 10)}. Una funzione semplice è fatta di pochi valori, e Lebesgue li conta: valore per misura dell’insieme dove la funzione lo assume.`];
      return [`Con K = ${IT.int(last.K)} livelli inferiore e superiore distano ${IT.err(last.gap)}, esattamente (M - m)(b - a)/K. Il secondo grafico ordina i valori della funzione dal più alto al più basso: la curva che ne esce (il riordinamento decrescente) ha la stessa area, ed è il grafico a sinistra letto di traverso.`];
    },
  },
  trySlices: {
    intro: [
      'Le stesse strisce e fette dal vivo: muovete n e K e confrontate. Con la funzione a gradini Lebesgue diventa esatto non appena i livelli cadono sui gradini, mentre Riemann paga ogni salto; con x² le strisce di Riemann vanno più veloci; con sin(1/x) entrambi faticano vicino a 0. Avvia fa crescere n e K insieme da 1 a 64.',
    ],
    nLabel: (n) => `n = ${n} strisce`,
    kLabel: (K) => `K = ${K} livelli`,
    play: 'Avvia',
    pause: 'Pausa',
    values: (r, l, ref) => {
      const F = IT;
      const e = (v) => (Number.isFinite(v) ? F.err(Math.abs(v - ref.value)) : '∞');
      return `Riemann al centro ${F.sig(r.midpoint, 8)} (errore ${e(r.midpoint)}), fra ${F.sig(r.lower, 6)} e ${F.sig(r.upper, 6)}. Lebesgue ${F.sig(l.midpoint, 8)} (errore ${e(l.midpoint)}), fra ${F.sig(l.lower, 6)} e ${F.sig(l.upper, 6)}. Integrale ${refIt(ref)} ${F.sig(ref.value, 10)}.`;
    },
    riemannTitle: (n) => `Riemann, ${n} strisce`,
    lebesgueTitle: (K) => `Lebesgue, ${K} livelli`,
  },
  compare: {
    intro: [
      'Chi vince? Il grafico confronta l’errore delle due somme medie al crescere di n = K, e tratteggiata la distanza fra inferiore e superiore di ciascun metodo, che è la loro garanzia. La tabella in fondo fa lo stesso confronto su tutte e sei le funzioni.',
    ],
    chartTitle: (name) => `${name}: errore al crescere di n = K (scale logaritmiche)`,
    legend: ['Riemann, centro', 'Lebesgue, media', 'Riemann, sup. - inf.', 'Lebesgue, sup. - inf.'],
    tableTitle: 'Errori e garanzie per n = K raddoppiato',
    cols: { n: 'n = K', riemann: 'Errore di Riemann', lebesgue: 'Errore di Lebesgue', riemannGap: 'Garanzia di Riemann', lebesgueGap: 'Garanzia di Lebesgue' },
    customPending: 'Il confronto della vostra funzione si calcola qui, nel browser: qualche decimo di secondo.',
    after: (f, name) => {
      const F = IT;
      const winner = f.winner === 'lebesgue' ? 'Lebesgue' : 'Riemann';
      return [`${name}: con n = K = ${F.int(f.n)} vince ${winner}, di ${F.num(f.ratio, 1)} volte (errori ${F.err(f.riemann)} per Riemann e ${F.err(f.lebesgue)} per Lebesgue). L’errore di Riemann scende con ordine ${F.num(f.riemannOrder, 2)}, quello di Lebesgue con ordine ${F.num(f.lebesgueOrder, 2)}${f.riemannInfinite ? '; la garanzia di Riemann è infinita, quella di Lebesgue no' : ''}.`];
    },
    summaryTitle: 'Tutte le funzioni: errori con n = K = 8 e n = K = 1.024',
    summaryCols: { name: 'Funzione', riemann8: 'Riemann, 8', lebesgue8: 'Lebesgue, 8', riemann1024: 'Riemann, 1.024', lebesgue1024: 'Lebesgue, 1.024', winner: 'Vince' },
    summaryAfter: (rows) => {
      const names = (who) => rows.filter((r) => r.winner === who).map((r) => functionNamesIt[r.key].toLowerCase()).join(', ') || 'nessuna';
      return [
        `Con n = K = 1.024 Riemann vince su: ${names('riemann')}; Lebesgue su: ${names('lebesgue')}. La lezione è onesta: come algoritmo numerico Lebesgue non è migliore di Riemann. Per le funzioni lisce le strisce di Riemann, valutate al centro, convergono come 1/n²; Lebesgue si fa valere con le funzioni semplici e con quelle illimitate, dove Riemann deve fermarsi a un limite improprio.`,
        'Il vero vantaggio di Lebesgue non è la velocità: è che la sua garanzia non dipende dalla forma della funzione lungo x, e che i suoi teoremi sui limiti (convergenza monotona e dominata) permettono di scambiare limite e integrale, cosa su cui la probabilità e la statistica sono costruite.',
      ];
    },
  },
  traffic: {
    intro: [
      `Un esempio da sicurezza informatica. Il traffico di un server in un giorno, in Mb/s: ${TRAFFIC.base} di notte, una campana di ${TRAFFIC.day} intorno alle ${TRAFFIC.peak}:00, e alle ${TRAFFIC.at}:00 un attacco che per un quarto d’ora aggiunge fino a ${TRAFFIC.attack} Mb/s. Riemann e Lebesgue rispondono a due domande diverse sulla stessa curva. Riemann somma minuto dopo minuto e dà il totale trasferito, quello che compare in bolletta. Lebesgue chiede, per ogni soglia, quante ore il collegamento ci è rimasto sopra: è la domanda di chi dimensiona la banda o una difesa da DDoS.`,
    ],
    chartTitle: 'Il traffico del giorno (Mb/s): ogni fascia copre le ore in cui il traffico supera la sua soglia',
    tableTitle: 'Le ore sopra ogni soglia (insiemi di livello di Lebesgue)',
    cols: { y: 'Soglia (Mb/s)', hours: 'Ore sopra', minutes: 'Minuti sopra', when: 'Quando' },
    durationTitle: 'La curva di durata del carico: il traffico ordinato dal minuto più carico, con le soglie da 350 Mb/s in su',
    after: (r) => {
      const F = IT;
      const above500 = r.rows.find((row) => row.y === 500);
      return [
        `In tutto il giorno passano ${F.num(r.total, 1)} Mb/s × ore, cioè ${F.int(r.gigabytes)} GB (le somme di Riemann minuto per minuto danno ${F.num(r.riemann, 1)}). L’attacco ne è solo il ${F.pct(r.attackShare, 1)}: nel totale si vede appena. Negli insiemi di livello invece è l’unico protagonista: sopra 500 Mb/s il collegamento resta ${F.num(above500.hours * 60, 1)} minuti, tutti fra le ${clock(above500.intervals[0][0])} e le ${clock(above500.intervals[above500.intervals.length - 1][1])}, e il picco arriva a ${F.int(r.peak)} Mb/s.`,
        'La curva di durata del carico, il traffico riordinato dal minuto più carico al più scarico, è il riordinamento decrescente della sezione 2.4: ingegneri delle reti e dell’energia la usano da decenni senza chiamarla Lebesgue. La sua area è di nuovo il totale.',
      ];
    },
  },
  montecarlo: {
    intro: [
      'Monte Carlo integra estraendo punti a caso: l’integrale di f su [a, b] è (b - a) volte il valore atteso di f(U), con U uniforme, e la media di N valori lo stima. Non guarda mai l’ordine dei punti sull’asse x, solo quanti valori cadono dove: è un parente statistico di Lebesgue. Il suo errore scende come 1/√N qualunque sia la regolarità della funzione, e ogni stima viene con il suo intervallo di confidenza, calcolato con le tre righe di Welford dell’Homework #4.',
    ],
    formulasTitle: 'Monte Carlo',
    fieldsIntro: 'Quanti punti usa ogni stima e quante stime indipendenti si fanno per ogni funzione; il seme è quello della sezione 1.8.',
    pointsLabel: 'Punti per stima N',
    pointsHint: `da ${IT.int(LIMITS.points[0])} a ${IT.int(LIMITS.points[1])}`,
    repsLabel: 'Ripetizioni',
    repsHint: `da ${IT.int(LIMITS.reps[0])} a ${IT.int(LIMITS.reps[1])}`,
    tableTitle: (s) => `${IT.int(s.params.reps)} stime di ${IT.int(s.params.points)} punti per ogni funzione`,
    cols: { name: 'Funzione', exact: 'Integrale esatto', mean: 'Media delle stime', sd: 'Deviazione standard', se: 'Errore standard medio', coverage: `Intervalli al ${IT.pct(CONFIDENCE, 0)} che lo contengono` },
    chooseLabel: 'Istogramma di',
    histogramTitle: (name, s) => `${name}: le ${IT.int(s.params.reps)} stime, con la normale del teorema del limite centrale e il valore esatto`,
    legend: ['stime', 'normale attesa', 'valore esatto'],
    after: (s) => {
      const F = IT;
      const u = s.mc.unbounded;
      const ok = ['square', 'bell', 'steps', 'oscillating', 'traffic'].map((key) => `${functionNamesIt[key].toLowerCase()} ${F.pct(s.mc[key].coverage, 1)}`).join(', ');
      return [
        `Per le cinque funzioni con varianza finita gli intervalli al 95% contengono l’integrale esatto in queste quote: ${ok}. È la promessa dell’intervallo, e i test della sezione 3 dicono se è mantenuta.`,
        `Con 1/√x la quota è ${F.pct(u.coverage, 1)}${u.coverage < 0.94 ? ', sotto la promessa' : ''}. Le stime restano giuste in media (${F.sig(u.mean, 6)} contro 2), ma f(U) = 1/√U ha varianza infinita: ogni tanto U cade vicinissimo a 0 e un solo punto sposta tutta la media. L’istogramma lo mostra: una coda lunga a destra e un picco spostato a sinistra, e la deviazione standard di un campione sottovaluta quasi sempre la vera incertezza. È la stessa funzione che Riemann non integra in senso proprio: anche Monte Carlo, che non guarda l’ordine dei punti, sente l’infinito.`,
      ];
    },
  },
  tryMc: {
    intro: [
      'Monte Carlo dal vivo: Avvia estrae punti da 10 fino a 100.000, e il grafico segue la stima con la sua fascia al 95%, contro il valore esatto tratteggiato. Con le funzioni limitate la fascia si stringe come 1/√N e contiene quasi sempre il valore esatto; con 1/√x guardate i salti: un punto vicinissimo a 0 sposta la stima di colpo. Un’altra estrazione rifà tutto con punti nuovi.',
    ],
    chooseLabel: 'Funzione',
    play: 'Avvia',
    pause: 'Pausa',
    again: 'Un’altra estrazione',
    chartTitle: (name) => `${name}: la stima al crescere dei punti (scala logaritmica), con la fascia al 95%`,
    legend: ['stima e fascia al 95%', 'valore esatto'],
    status: (p, exact) => (p ? `${IT.int(p.k)} punti: stima ${IT.sig(p.estimate, 7)} ± ${IT.sig(1.96 * p.se, 3)}, valore esatto ${IT.sig(exact, 7)}.` : 'Premete Avvia.'),
  },
  dirichlet: {
    intro: [
      'L’esempio classico che separa i due integrali è la funzione di Dirichlet: 1 sui razionali e 0 sugli irrazionali, su [0, 1]. Ogni striscia di Riemann contiene sia razionali sia irrazionali, quindi la somma inferiore vale sempre 0 e quella superiore sempre 1: per Riemann non è integrabile. Per Lebesgue sì, e l’integrale vale 0, perché i razionali sono numerabili e hanno misura zero.',
      'Al computer però non si può calcolare, e il motivo è pratico: ogni numero che un programma memorizza è razionale. Un double è sempre una frazione m/2^k: l’irrazionale non esiste, nemmeno π. Per il computer la funzione di Dirichlet vale 1 dappertutto, e il suo “integrale numerico” vale 1, non 0. La tabella mostra la frazione esatta di alcuni numeri come li memorizza il browser.',
    ],
    numbers: { tenth: '0,1', third: '1/3', pi4: 'π/4', sqrt2: '√2', e: 'e' },
    cols: { number: 'Numero', fraction: 'Frazione esatta memorizzata', value: 'Dirichlet al computer' },
    after: 'La misura di Lebesgue vede l’insieme di tutti i reali; un computer ne vede un sottoinsieme finito di razionali, che per Lebesgue ha misura zero. Questa è l’unica funzione della pagina che la matematica integra e il calcolo numerico no.',
  },
  stats: {
    verdict: { reject: 'H₀ rifiutata', notReject: 'H₀ non rifiutata' },
    expected: { reject: 'atteso: rifiuto', notReject: 'atteso: nessun rifiuto', either: 'dipende dalla potenza del test' },
    testLine: testLineIt,
    groups: { model: 'Il modello normale', coverage: 'Copertura di Monte Carlo', bias: 'Distorsione di Monte Carlo' },
    labels: {
      model: {
        ksNormal: 'I dati di Box-Muller seguono la Φ numerica (Kolmogorov-Smirnov)',
        tailNormal: `Nei dati di Box-Muller la quota sopra ${ALARM_K} deviazioni standard è P(Z > ${ALARM_K}) (z)`,
        ksHeavy: 'I dati a code pesanti seguono la stessa normale (falsa di proposito)',
        tailHeavy: `Nei dati a code pesanti la quota sopra ${ALARM_K} deviazioni standard è P(Z > ${ALARM_K}) (falsa di proposito)`,
      },
      coverage: Object.fromEntries(Object.entries(functionNamesIt).map(([key, name]) => [key, `${name}: gli intervalli al ${IT.pct(CONFIDENCE, 0)} contengono l’integrale il ${IT.pct(CONFIDENCE, 0)} delle volte (z)`])),
      bias: Object.fromEntries(Object.entries(functionNamesIt).map(([key, name]) => [key, `${name}: le stime hanno in media l’integrale esatto (z)`])),
    },
  },
  tests: {
    intro: (s) => `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. Il modello normale si controlla sui ${IT.int(s.params.sample)} valori di Box-Muller e su altrettanti a code pesanti, con il test di Kolmogorov-Smirnov e con la quota oltre la soglia dei tre sigma; Monte Carlo con la copertura degli intervalli e con la media delle stime, su ${IT.int(s.params.reps)} ripetizioni di ${IT.int(s.params.points)} punti per ogni funzione. Due ipotesi nulle sono false di proposito (i dati a code pesanti non sono normali), e il loro rifiuto è atteso.`,
    cols: { subject: 'Oggetto', hypothesis: 'Ipotesi nulla H₀', p: 'p-value', verdict: 'Esito', expected: 'Lettura' },
    after: (sum) => {
      const out = [`${sum.rejected} test su ${sum.count} rifiutano l’ipotesi nulla, ${sum.asExpected === sum.count ? 'tutti come atteso' : `${sum.asExpected} su ${sum.count} come atteso`}.`];
      const expectedFalse = IT.num(sum.nulls * SIGNIFICANCE, 2);
      const which = sum.falseRejections.map((t) => IT.pval(t.result.pValue)).join(', ');
      out.push(
        `Fra i ${sum.nulls} test con un’ipotesi nulla vera, al livello ${IT.num(SIGNIFICANCE, 2)} ci si aspettano in media ${expectedFalse} rifiuti per puro caso: ${sum.falseRejections.length === 0 ? 'qui non ce ne sono' : `qui ${sum.falseRejections.length === 1 ? 'ce n’è uno' : `ce ne sono ${sum.falseRejections.length}`} (p = ${which})`}. La correzione di Holm per i test multipli confronta il p-value più piccolo con ${IT.num(SIGNIFICANCE, 2)}/${sum.nulls} = ${IT.num(sum.holmThreshold, 4)}, il successivo con ${IT.num(SIGNIFICANCE, 2)}/${sum.nulls - 1} e così via: ${sum.holm === 0 ? 'nessun rifiuto sopravvive' : `${sum.holm === 1 ? 'sopravvive un rifiuto' : `sopravvivono ${sum.holm} rifiuti`}, da guardare come un possibile difetto`}.`,
      );
      out.push('La copertura di Monte Carlo per 1/√x è segnata come “dipende dalla potenza”: la teoria dice che senza varianza finita l’intervallo non mantiene la promessa del 95% per N fissato, e con abbastanza ripetizioni il test se ne accorge; con poche ripetizioni può non vederlo.');
      return out;
    },
  },
  history: {
    intro: 'Dalle botti di Keplero ai generatori di questa pagina, le idee usate nell’homework in ordine cronologico.',
    legend: { task: 'usato in questa pagina', context: 'contesto' },
    events: [
      { year: '1615', task: true, title: 'Keplero', text: 'Nella Nova stereometria doliorum vinariorum calcola il volume delle botti di vino con una regola a tre punti: l’antenata della regola di Simpson.' },
      { year: '1676-1722', task: true, title: 'Newton e Cotes', text: 'Le formule per integrare con punti equidistanti, che oggi portano i loro nomi: i trapezi e Simpson ne sono i primi due casi.' },
      { year: '1733', task: true, title: 'de Moivre', text: 'La curva normale compare come approssimazione della binomiale: è la densità che la Part 1 integra.' },
      { year: '1743', task: true, title: 'Simpson', text: 'Thomas Simpson pubblica la regola delle parabole che porta il suo nome, già nota a Cavalieri e a James Gregory.' },
      { year: '1799', task: true, title: 'Kramp', text: 'Christian Kramp calcola la prima tavola dell’integrale di e^(-t²), per la rifrazione astronomica: la prima tavola della normale.' },
      { year: '1809', task: true, title: 'Gauss', text: 'Nella Theoria motus la normale diventa la legge degli errori di osservazione.' },
      { year: '1814', task: true, title: 'Gauss', text: 'Methodus nova integralium valores per approximationem inveniendi: nodi e pesi scelti per integrare esattamente i polinomi del grado più alto possibile, la regola di Gauss della pagina.' },
      { year: '1826', task: true, title: 'Jacobi', text: 'Collega i nodi di Gauss alle radici dei polinomi di Legendre, come li calcola gaussLegendre() con il metodo di Newton.' },
      { year: '1835', task: false, title: 'Liouville', text: 'Dimostra che certi integrali, fra cui quello di e^(-t²), non si esprimono con un numero finito di funzioni elementari: Φ va calcolata numericamente.' },
      { year: '1854', task: true, title: 'Riemann', text: 'Nella tesi di abilitazione sulle serie trigonometriche, pubblicata dopo la sua morte, definisce l’integrale come limite delle somme sulle strisce.' },
      { year: '1871', task: false, title: 'Glaisher', text: 'Dà il nome alla funzione degli errori, erf, con cui oggi si scrive Φ(z) = (1 + erf(z/√2))/2.' },
      { year: '1875', task: true, title: 'Darboux', text: 'Le somme inferiore e superiore: una funzione è integrabile secondo Riemann se e solo se la loro differenza tende a zero.' },
      { year: '1898', task: false, title: 'Borel', text: 'Costruisce la misura degli insiemi della retta, additiva sulle successioni numerabili: il terreno su cui lavorerà Lebesgue.' },
      { year: '1902', task: true, title: 'Lebesgue', text: 'La tesi Intégrale, longueur, aire, pubblicata negli Annali di Matematica Pura ed Applicata: l’integrale per livelli e la misura degli insiemi di livello.' },
      { year: '1903', task: false, title: 'Sheppard', text: 'Le tavole della normale su Biometrika, il modello delle tavole che ogni libro di statistica riporta ancora.' },
      { year: '1905', task: false, title: 'Vitali', text: 'Giuseppe Vitali costruisce un insieme non misurabile: anche Lebesgue ha un limite, e la misura non si può dare a ogni sottoinsieme della retta.' },
      { year: '1933', task: true, title: 'Kolmogorov', text: 'Nei Grundbegriffe la probabilità diventa una misura e il valore atteso un integrale di Lebesgue; nello stesso anno, sul Giornale dell’Istituto Italiano degli Attuari, il test sullo scarto massimo fra la funzione di ripartizione empirica e quella teorica.' },
      { year: '1949', task: true, title: 'Metropolis e Ulam', text: 'The Monte Carlo Method: integrare e stimare probabilità estraendo numeri a caso.' },
      { year: '1958', task: true, title: 'Box e Muller', text: 'La trasformazione di due uniformi in due normali indipendenti, usata per i dati della sezione 1.8.' },
      { year: '1969', task: false, title: 'Cody', text: 'Le approssimazioni razionali di erf che usano ancora molte librerie numeriche: oggi Φ si calcola così, non con le regole di quadratura.' },
      { year: '1970', task: true, title: 'Stephens', text: 'La correzione del test di Kolmogorov-Smirnov per campioni finiti, (√n + 0,12 + 0,11/√n) D, usata nella pagina.' },
      { year: '1985', task: true, title: 'IEEE 754', text: 'Lo standard dei numeri in virgola mobile: ogni double è una frazione m/2^k, ed è per questo che la funzione di Dirichlet al computer vale sempre 1.' },
      { year: '2014-2018', task: true, title: 'SplitMix e xoshiro', text: 'I generatori di numeri casuali di questa pagina, come degli Homework #3 e #4.' },
    ],
    after: 'La storia corre su due binari che questo homework mette insieme. Uno è il calcolo dell’area, dalle botti di Keplero a Gauss, che porta alle regole della Part 1; l’altro è la definizione dell’integrale, da Riemann a Lebesgue a Kolmogorov, che porta alla probabilità moderna e alla Part 2.',
  },
  conclusion: (s, facts) => {
    const F = IT;
    const out = [
      `Part 1. La funzione di ripartizione della normale si calcola sommando fette della campana. Le cinque regole convergono con gli ordini della teoria (misurati: ${F.num(facts.orders.left, 2)}, ${F.num(facts.orders.midpoint, 2)}, ${F.num(facts.orders.trapezoid, 2)}, ${F.num(facts.orders.simpson, 2)}), e Gauss-Legendre arriva a dieci decimali con ${F.int(facts.enough.gauss)} valori di φ contro i ${F.int(facts.enough.simpson)} di Simpson. Il -∞ si aggira meglio con la simmetria che con il troncamento, e la coda lontana va integrata direttamente: 1 - Φ(k) sbaglia di più del 50% da k = ${facts.tailTotal}. Con la stessa CDF si ricostruiscono la tavola dei libri e i quantili, l’1,96 compreso, e si fissano le soglie d’allarme: purché i dati abbiano davvero code normali, cosa che il test di Kolmogorov-Smirnov permette di verificare.`,
      'Part 2. Riemann e Lebesgue danno lo stesso numero su tutte le funzioni della pagina, ma lo raggiungono in modi diversi. Come algoritmo Riemann vince sulle funzioni lisce; Lebesgue vince sulle funzioni semplici e su quelle illimitate, e la sua garanzia, (M - m)(b - a)/K, non dipende da come la funzione si comporta lungo x. Sul traffico di un server i due integrali rispondono a due domande: quanto è passato in tutto e per quanto tempo il collegamento è rimasto sopra ogni soglia.',
    ];
    if (s) {
      const u = s.mc.unbounded;
      out.push(`Monte Carlo, il cugino statistico di Lebesgue, mantiene la promessa del 95% sulle funzioni con varianza finita; su 1/√x, che ha varianza infinita, gli intervalli contengono l’integrale il ${F.pct(u.coverage, 1)} delle volte: è la stessa funzione che Riemann non integra in senso proprio. E la funzione di Dirichlet ricorda il limite di ogni calcolo numerico: un computer vede solo numeri razionali, un insieme che per Lebesgue ha misura zero.`);
    }
    return out;
  },
  ruleNames: ruleNamesIt,
  tips: {
    piece: (p, i, sign) => {
      const F = IT;
      const what = { rect: 'rettangolo', trap: 'trapezio', parab: 'arco di parabola', node: 'nodo di Gauss' }[p.kind];
      return `${what[0].toUpperCase()}${what.slice(1)} ${i + 1}: da ${F.num(p.x0, 3)} a ${F.num(p.x1, 3)}${p.kind === 'node' ? `, nodo in ${F.num(p.tag, 3)}, peso ${F.num(p.weight, 4)}` : ''}, area ${F.num(p.area, 6)}${sign < 0 ? ' (tolta da 1/2)' : ''}`;
    },
    convergence: (r) => `n = ${IT.int(r.n)}: ${Object.entries(r.errors).map(([rule, e]) => `${ruleNamesIt[rule]} ${e === null ? '-' : IT.err(e)}`).join(', ')}`,
    newton: (r) => `Passo ${r.k}: z = ${IT.num(r.z, 12)}, errore ${IT.err(r.error)}`,
    tail: (r) => `k = ${r.k}: P(Z > k) = ${IT.sci(r.reference, 3)}; 1 - Φ(k) sbaglia di ${IT.err(r.subtractionError)}, la coda diretta di ${IT.err(r.directError)}`,
    alarm: (k, events) => `k = ${IT.num(k, 1)}: dati normali ${IT.sci(tailDirect(k))} (${IT.num(events * tailDirect(k), 1)} al giorno), code pesanti ${IT.sci(heavySf(k))} (${IT.num(events * heavySf(k), 1)} al giorno)`,
    ecdf: (x, F, P) => `x = ${IT.num(x, 3)}: empirica ${IT.num(F, 4)}, Φ ${IT.num(P, 4)}, scarto ${IT.num(Math.abs(F - P), 4)}`,
    strip: (s, kind) => `Da ${IT.sig(s.x0, 4)} a ${IT.sig(s.x1, 4)}: altezza ${IT.sig(s[kind], 5)}, minimo ${IT.sig(s.lower, 5)}, massimo ${IT.sig(s.upper, 5)}`,
    level: (y0, y1, measure, pieces) => `Fascia da ${IT.sig(y0, 4)} a ${IT.sig(y1, 4)}: f ≥ ${IT.sig(y1, 4)} su una lunghezza ${IT.sig(measure, 5)} (${pieces} ${pieces === 1 ? 'intervallo' : 'intervalli'}), area ${IT.sig((y1 - y0) * measure, 5)}`,
    traffic: (y, set) => `Sopra ${IT.int(y)} Mb/s: ${IT.num(set.reduce((s, [a, b]) => s + b - a, 0) * 60, 1)} minuti${set.length ? `, ${set.map(([a, b]) => `${clock(a)}-${clock(b)}`).join(', ')}` : ''}`,
    distribution: (y, m) => `y = ${IT.sig(y, 4)}: f ≥ y su una lunghezza ${IT.sig(m, 5)}`,
    rearrangement: (s, sorted, original) => `s = ${IT.sig(s, 4)}: riordinata ${IT.sig(sorted, 5)}, originale ${IT.sig(original, 5)}`,
    duration: (h, v) => `${IT.num(h, 2)} ore al giorno sopra ${IT.int(v)} Mb/s`,
    compare: (r) => `n = K = ${IT.int(r.n)}: Riemann ${IT.err(r.errors.riemann)}, Lebesgue ${IT.err(r.errors.lebesgue)}`,
    estimates: (from, to, count, share) => `Da ${IT.sig(from, 5)} a ${IT.sig(to, 5)}: ${IT.int(count)} stime, ${IT.pct(share, 1)}`,
    mcPath: (p, exact) => `${IT.int(p.k)} punti: stima ${IT.sig(p.estimate, 6)} ± ${IT.sig(1.96 * p.se, 3)}, esatto ${IT.sig(exact, 6)}`,
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline, con gli stessi calcoli, grafici ed esempi interattivi. Con node homework5.js stampa nel terminale le cinque regole, la tavola della normale, i quantili, le code, le somme di Riemann e di Lebesgue di ogni funzione, Monte Carlo e i test; --z, --mu, --sigma, --rule, --n, --function, --formula, --a, --b e --seed cambiano i parametri.',
    contents: 'Contenuto: index.html, style.css, homework5.js (regole di quadratura, CDF, Riemann, Lebesgue, generatori, statistica e grafici), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework5',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'La funzione di ripartizione della normale per integrazione numerica, e gli integrali di Riemann e di Lebesgue calcolati numericamente.',
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
    case 'ks':
      return `D = ${F.num(t.D, 4)} over ${F.int(t.n)} values (largest gap at x = ${F.num(t.at, 2)}), corrected √n D = ${F.num(t.statistic, 3)}, p = ${F.pval(t.pValue)}`;
    case 'proportion':
      return `${F.int(t.count)} out of ${F.int(t.m)}, that is ${F.pct(t.rate, 3)} against ${F.pct(t.expected, 3)}, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'bias':
      return `mean of the estimates ${F.sig(t.mean, 7)} against ${F.sig(t.expected, 7)} over ${F.int(t.m)} repetitions, z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

const refEn = (ref) => (ref.exact ? 'exact' : ref.method === 'composite' ? `reference (composite Gauss, ± ${EN.err(ref.uncertainty)})` : 'adaptive Simpson');

const ruleNamesEn = { left: 'Rectangles', midpoint: 'Midpoints', trapezoid: 'Trapezoids', simpson: 'Simpson', gauss: 'Gauss-Legendre' };
const ruleInlineEn = { left: 'rectangles', midpoint: 'midpoints', trapezoid: 'trapezoids', simpson: 'Simpson', gauss: 'Gauss-Legendre' };
const functionNamesEn = { square: 'x² on [0, 1]', bell: 'The bell on [-3, 3]', steps: 'Step function', oscillating: 'sin(1/x)', unbounded: '1/√x', traffic: 'Traffic of a day', custom: 'Your own' };

const en = {
  fmt: EN,
  formulas: {
    cdf: CDF_FORMULAS,
    rules: ruleFormulas({ left: 'rectangles', midpoint: 'midpoints', trapezoid: 'trapezoids', simpson: 'Simpson', gauss: 'Gauss-Legendre', error: 'error', even: 'even', exact: 'exact up to degree 2n - 1' }),
    strategies: strategyFormulas({ symmetry: 'symmetry', truncation: 'truncation', substitution: 'substitution', leftOut: 'left out:' }),
    newton: NEWTON_FORMULAS,
    riemann: RIEMANN_FORMULAS,
    lebesgue: lebesgueFormulas({ measure: 'total length', layer: 'the layer cake' }),
    montecarlo: MC_FORMULAS.replace('1,96', '1.96'),
  },
  ui: {
    index: 'Contents',
    indexTitle: 'Homework contents',
    close: 'Close',
    backToTop: 'Back to top',
    computing: 'Computing...',
    language: 'Language',
    error: (m) => `Error: ${m}`,
  },
  sections: {
    assignment: '0. The assignment',
    part1: 'Part 1 - The distribution function of the normal law',
    area: '1.1 The CDF is an area',
    tryArea: 'Try it: the area under the bell',
    rules: '1.2 Five ways of adding up slices',
    infinity: '1.3 The problem of -∞',
    convergence: '1.4 How many points are needed',
    table: '1.5 The table of the normal, rebuilt',
    quantiles: '1.6 Backwards: the quantiles',
    tails: '1.7 Far tails and alarm thresholds',
    tryAlarm: 'Try it: the alarm threshold',
    data: '1.8 The model against data',
    checks: '1.9 Checks',
    part2: 'Part 2 - The Riemann and the Lebesgue integral',
    idea: '2.1 Two ways of counting',
    tryCoins: 'Try it: Lebesgue’s coins',
    functions: '2.2 The functions',
    riemann: '2.3 Riemann: vertical strips',
    lebesgue: '2.4 Lebesgue: horizontal slices',
    trySlices: 'Try it: vertical or horizontal',
    compare: '2.5 Who wins, and when',
    traffic: '2.6 The traffic of a server',
    montecarlo: '2.7 Monte Carlo, Lebesgue with dice',
    tryMc: 'Try it: Monte Carlo live',
    dirichlet: '2.8 Dirichlet’s function',
    tests: '3. Hypothesis tests',
    history: '4. Historical context',
    conclusion: '5. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment has two parts. The first asks for the cumulative distribution function (CDF) of a normal density by numerical integration; the second, given a choice of functions f_1, f_2, ..., asks to compute numerically both their Riemann and their Lebesgue integral.',
      'The page goes by examples. Part 1 computes Phi with five rules written from scratch, shows how to get around -∞, measures how many points are needed and then puts the CDF to work: it rebuilds the table at the back of statistics books, finds backwards the 1.96 of every 95% interval and the thresholds of a system that flags anomalies, and tests it against simulated data. Part 2 integrates six functions chosen to show the differences, plus one you can type yourself, in the two ways: Riemann’s vertical strips and Lebesgue’s horizontal slices; then the traffic of a server, Monte Carlo and Dirichlet’s function. Every number is computed in the browser, and the downloadable program prints the same ones.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned. The only changes: the number 1) of the first exercise, missing in the copy received, and the LaTeX \\dots of the second, written as three dots.',
  },
  part1: {
    intro: [
      'X ~ N(μ, σ²) has a bell-shaped density and distribution function F(x) = P(X ≤ x), the area under the bell to the left of x. That area has no formula with a finite number of elementary functions (Liouville proved it in 1835), so it has to be computed: by adding up slices, as the assignment asks. Every N(μ, σ²) reduces to the standard normal with z = (x - μ)/σ, so computing Φ is enough.',
    ],
  },
  area: {
    intro: [
      'The chart is the density of the standard normal and the coloured area is Φ(1.96) = 0.975: the probability that a normal falls below 1.96 standard deviations from its mean, the number behind every 95% confidence interval. Integrating numerically means replacing that area with pieces whose area is known: rectangles, trapezoids, arcs of parabola.',
    ],
    chartTitle: 'The density of the standard normal and Φ(1.96) = 0.975, the coloured area',
  },
  tryArea: {
    intro: [
      'Choose μ, σ and the point x, the rule and the number of pieces n. With the symmetry the pieces cover [μ, x] and the half to the left of μ counts 1/2 without computing; with the truncation they cover [μ - 4σ, x], and what lies to the left of μ - 4σ (3.2 × 10^-5) is left out. Hover over a piece to see its area. Try Simpson with n = 2, then Gauss with 2 nodes: with the same two values of the function, Gauss is far more accurate.',
    ],
    muLabel: 'μ',
    sigmaLabel: 'σ',
    zLabel: (x, z) => `x = ${EN.num(x, 2)}  (z = ${EN.num(z, 2)})`,
    ruleLabel: 'Rule',
    nLabel: (n, rule) => (rule === 'gauss' ? `n = ${n} nodes` : `n = ${n} pieces`),
    strategyLabel: '-∞',
    strategies: { symmetry: 'Symmetry', truncation: 'Truncation at -4σ' },
    result: (st, rule) => {
      const F = EN;
      const how = st.base ? `1/2 ${st.sign > 0 ? '+' : '-'} ${F.num(st.sum, 8)}` : F.num(st.sum, 8);
      return `F(${F.num(st.x, 2)}) ≈ ${how} = ${F.num(st.value, 8)} with ${ruleInlineEn[rule]} and n = ${st.n} (${st.evaluations} values of the density). Exact value ${F.num(st.exact, 8)}, error ${F.err(st.error)}.`;
    },
    chartTitle: (st, rule) => `F(${EN.num(st.x, 2)}) with ${ruleInlineEn[rule]}, n = ${st.n}`,
  },
  rules: {
    intro: [
      'Five rules, from the most naive to the smartest. The first four use equally spaced points: rectangles take the value at the left end of every piece, midpoints the one at the centre, trapezoids join the two ends with a segment, Simpson joins three points with an arc of parabola. Gauss-Legendre chooses instead where to evaluate the function: n nodes and n weights computed so that the rule is exact for every polynomial of degree up to 2n - 1.',
    ],
    formulasTitle: 'The five rules on [a, b]',
    codeTitle: 'The code: integrate() of homework5.js, one line per rule',
    tableTitle: (n) => `Φ(1.96) with n = ${n}: value, error and values of the density used`,
    cols: { rule: 'Rule', n: 'n', evaluations: 'Values of φ', value: 'Computed Φ(1.96)', error: 'Error' },
    gaussTitle: 'Gauss-Legendre with 5 nodes on [-1, 1]: the roots of the Legendre polynomial P_5 and their weights',
    gaussCols: { i: 'i', node: 'Node t_i', weight: 'Weight w_i' },
    after: (rows) => {
      const F = EN;
      const g = rows.find((r) => r.rule === 'gauss');
      const s = rows.find((r) => r.rule === 'simpson');
      const l = rows.find((r) => r.rule === 'left');
      return [`With ${RULES_N} pieces the rectangles are off by ${F.err(l.error)}, Simpson by ${F.err(s.error)}, Gauss with ${g.n} nodes ${g.error === 0 ? 'by nothing at all: the result agrees with the reference to the last digit' : `by ${F.err(g.error)}`}. It is not magic: φ is a very smooth function, and Gauss uses all of its smoothness. In the picture of Gauss every node lies inside a rectangle as wide as its weight: Gauss too is a Riemann sum, with well chosen strips and points.`];
    },
  },
  infinity: {
    intro: [
      'The lower limit of Φ is -∞, and no rule integrates over an infinite interval. Three ways around it. The symmetry: φ is even and its total area is 1, so the left half is exactly 1/2 and only [0, z] is left to integrate. The truncation: stop at -L and accept to lose Φ(-L). The substitution: a change of variable maps (-∞, z] onto (0, 1], and the integrand goes to zero at the end.',
    ],
    formulasTitle: 'Three ways of avoiding -∞',
    chooseLabel: 'Rule',
    tableTitle: (rule, n) => `Error on Φ(z) with ${rule === 'gauss' ? `Gauss-Legendre, ${n} nodes` : `Simpson, n = ${n}`}`,
    cols: { z: 'z', reference: 'Φ(z)', symmetry: 'Symmetry', trunc4: `Truncation at -${TRUNCATIONS[0]}`, trunc8: `Truncation at -${TRUNCATIONS[1]}`, substitution: 'Substitution' },
    after: (f) => {
      const F = EN;
      return [
        `With ${f.n} Gauss nodes the symmetry is off by at most ${F.err(f.gauss[0])}: it integrates over the shortest interval and knows the left half exactly. The truncation at -${TRUNCATIONS[0]} never goes below ${F.err(f.leftOut4)}, the area it leaves out, whatever the rule; at -${TRUNCATIONS[1]} that area is ${F.err(f.leftOut8)}, but the interval is long and needs more points (errors up to ${F.err(f.gauss[2])}). The substitution loses nothing on the way, but it squeezes the bell near u = 1 and with few points does worse (up to ${F.err(f.gauss[3])}).`,
        'The practical lesson: before adding points, use what is known about the function. Here a single observation, the symmetry, is worth more than a thousand extra points.',
      ];
    },
  },
  convergence: {
    intro: [
      'How many points are needed? The chart measures the error on Φ(1.96) as n doubles, on logarithmic scales: every rule becomes a straight line, with a slope equal to its order. Rectangles halve the error when the points double, midpoints and trapezoids divide it by 4, Simpson by 16; Gauss-Legendre falls faster still, until it meets the floor of the rounding of 64-bit numbers, around 10^-16.',
    ],
    chartTitle: (z) => `Error on Φ(${EN.num(z, 2)}) as n grows (logarithmic scales)`,
    tableTitle: 'Error for doubling n',
    cols: { n: 'n' },
    after: (f) => {
      const F = EN;
      const order = (r) => F.num(f.orders[r], 2);
      return [
        `The orders measured on the lines are ${order('left')} for rectangles, ${order('midpoint')} for midpoints, ${order('trapezoid')} for trapezoids and ${order('simpson')} for Simpson, as the theory says (1, 2, 2, 4). For ten correct decimals Simpson uses ${F.int(f.enough.simpson)} values of φ and Gauss ${F.int(f.enough.gauss)}; rectangles do not get there even with 16,384 (error ${F.err(f.left16384)}), and neither do midpoints (${F.err(f.midpoint16384)}).`,
        'Two practical warnings. Beyond the floor more points do not help: the error goes back up, because more roundings add up. And the order holds for smooth functions: with a jump or a corner even Simpson falls back to the first order, as Part 2 shows.',
      ];
    },
  },
  table: {
    intro: [
      'At the back of every statistics book there is the table of Φ(z): rows for the first decimal of z, columns for the second. Here it is rebuilt: Φ(0) = 1/2, then one Simpson parabola for every step of 0.01, added to the previous cell. Two values of φ per cell. Hover over the highlighted cells: they are the z of the most used quantiles.',
    ],
    title: (zt) => `Φ(z) for z = row + column, ${EN.int(zt.evaluations)} values of φ in all`,
    after: (zt) => {
      const cell = (z) => zt.table[Math.floor(Math.round(z * 100) / 10)].cells[Math.round(z * 100) % 10].value;
      return [`The worst cell is off by ${EN.err(zt.maxError)} (at z = ${EN.num(zt.at, 2)}): far below half a unit of the fourth digit, the last one the table prints. The value ${EN.num(cell(1.96), 4)} in row 1.9 and column .06 is the 1.96 of 95% intervals; 0.95 falls between ${EN.num(cell(1.64), 4)} (1.64) and ${EN.num(cell(1.65), 4)} (1.65), which is where 1.645 comes from.`];
    },
  },
  quantiles: {
    intro: [
      'The table also works backwards: given p, find z_p with Φ(z_p) = p. It is an equation, and Newton’s method solves it using the derivative of Φ, which is φ, known exactly: every step corrects z by the error divided by the slope. Not to lose digits in the tail, it is better to work on the smaller probability, q = 1 - p, integrated directly.',
    ],
    formulasTitle: 'Newton’s method for the quantile',
    tableTitle: 'The quantiles of the normal, found backwards',
    cols: { p: 'p', z: 'z_p with Newton', steps: 'Steps', reference: 'Reference', difference: 'Difference' },
    newtonTitle: (p) => `Newton step by step for p = ${EN.plain(p)}, starting from z = 0`,
    newtonCols: { k: 'Step', z: 'z_k', F: 'Φ(z_k)', dz: 'Correction', error: 'Error' },
    chartTitle: 'Error of z_k after every step (logarithmic scale)',
    after: (rows) => {
      const last = rows.find((r) => r.p === NEWTON_P);
      return [`z_0.975 = ${EN.num(last.z, 12)} is the 1.96 of Homework #4: we multiplied it by the standard error to get 95% intervals. In the first steps Newton advances slowly, because the bell flattens out; near the root every step doubles the correct digits, as the ever steeper line of the chart shows.`];
    },
  },
  tails: {
    intro: [
      'Far in the tail the probabilities become tiny, and the way of computing them matters. It feels natural to compute P(Z > k) as 1 - Φ(k), but Φ(k) is very close to 1 and the subtraction cancels the digits: it is the same cancellation as the textbook formula of the variance in Homework #4. Integrating the tail directly, Φ(-k) with the substitution, subtracts nothing.',
    ],
    tableTitle: 'P(Z > k) in the two ways, with the relative error',
    cols: { k: 'k', reference: 'P(Z > k)', subtraction: '1 - Φ(k)', subtractionError: 'Error', direct: 'Direct', directError: 'Error' },
    chartTitle: 'Relative error of the two ways as k grows (logarithmic scale)',
    legend: ['1 - Φ(k)', 'tail integrated directly'],
    after: (f) => {
      const F = EN;
      return [`The subtraction loses the sixth digit from k = ${f.micro} and from k = ${f.total} it is off by more than 50%: at k = 8 it gives ${F.sci(f.at8.subtraction)} instead of ${F.sci(f.at8.reference)}, at k = 9 ${F.sci(f.at9.subtraction)} instead of ${F.sci(f.at9.reference)}. The direct tail is never off by more than ${F.err(f.worstDirect)} in relative terms.`];
    },
    alarmIntro: [
      'What is such a far tail good for? For a system that flags anomalies: an IDS that raises an alarm when the requests per minute, the bytes of a session or the response time of a login exceed the mean by k standard deviations. If the data are normal, the share of legitimate events flagged by mistake is exactly P(Z > k), and with a million events a day even 10^-6 means a false alarm a day.',
    ],
    alarmTitle: 'Thresholds at k standard deviations, with a million events a day',
    alarmCols: { k: 'k', normal: 'False alarms, normal data', normalPerDay: 'Per day', heavy: `Heavy tails (Student’s t, ${HEAVY_DF} df)`, heavyPerDay: 'Per day', ratio: 'Ratio' },
    alarmAfter: (rows) => {
      const r3 = rows.find((r) => r.k === 3);
      const r5 = rows.find((r) => r.k === 5);
      return [`The trouble is that the right threshold depends on the tail, and the tails of real data are rarely normal. With heavy-tailed data (a Student’s t with ${HEAVY_DF} degrees of freedom, rescaled to the same mean and variance) the three-sigma rule flags ${EN.num(r3.ratio, 1)} times more events than expected, and at 5 sigma ${EN.int(r5.ratio)} times: the alarm threshold computed on the normal law buries its users in false alarms. Section 1.8 shows how to notice it from the data.`];
    },
  },
  tryAlarm: {
    intro: [
      'Say how many events pass every day and how many false alarms you are ready to put up with: the page finds the threshold k with Newton’s method on the tail integrated directly, and shows what the same threshold would do if the data had heavy tails.',
    ],
    eventsLabel: 'Events a day',
    rateLabel: 'False alarms accepted',
    rates: { tenDay: '10 a day', day: '1 a day', week: '1 a week', month: '1 a month' },
    result: (st) => {
      const F = EN;
      return `With ${F.events(st.events)} events a day, P(Z > k) must be ${F.sci(st.target)}: the threshold is k = ${F.num(st.k, 4)} standard deviations (${st.steps} Newton steps). If the data have heavy tails, the same threshold gives ${F.num(st.heavyPerDay, 1)} false alarms a day instead of ${F.sig(st.perDay, 3)}.`;
    },
    chartTitle: 'P(Z > k) for the normal law and for heavy-tailed data, with the accepted rate dashed (logarithmic scale)',
    legend: ['normal data', `heavy tails, t with ${HEAVY_DF} df`, 'accepted rate'],
  },
  data: {
    intro: [
      'A computed CDF can be tested against data. Here the data are simulated with Box and Muller’s method, which turns pairs of uniform numbers into pairs of independent normals; the Kolmogorov-Smirnov test measures the largest gap D between the empirical distribution function of the data and our numerical Φ. The same test, on the heavy-tailed data of section 1.7, must notice that they are not normal: it is the check to make before trusting a threshold.',
    ],
    fieldsIntro: 'The seed and the number of simulated values; the same seeds also feed Monte Carlo in section 2.7.',
    seedLabel: 'Seed',
    seedHint: `from 0 to ${EN.int(LIMITS.seed[1])}`,
    sampleLabel: 'Simulated values n',
    sampleHint: `from ${EN.int(LIMITS.sample[0])} to ${EN.int(LIMITS.sample[1])}`,
    randomSeed: 'Random seed',
    restore: 'Page values',
    stale: 'A field is not valid: the results stay those of the last valid values.',
    pending: 'New simulation running...',
    badgeTask: 'Page values: seed 2026, 10,000 values, Monte Carlo with 1,000 points and 1,000 repetitions.',
    badgeCustom: (p) => `Your values: seed ${p.seed}, ${EN.int(p.sample)} values, Monte Carlo with ${EN.int(p.points)} points and ${EN.int(p.reps)} repetitions.`,
    run: (s) => `${EN.int(s.draws)} values generated and ${EN.ms(s.simMs)} of computation, in the browser’s worker.`,
    errors: {
      empty: 'The field is empty.',
      notInteger: 'An integer is needed, with no sign and no decimals.',
      range: (min, max) => `A number between ${EN.int(min)} and ${EN.int(max)} is needed.`,
    },
    normalTitle: (n) => `Box-Muller: empirical distribution function of ${EN.int(n)} values against the numerical Φ`,
    heavyTitle: (n) => `Heavy tails: empirical distribution function of ${EN.int(n)} values against the numerical Φ`,
    legend: ['empirical', 'numerical Φ'],
    after: (s) => {
      const F = EN;
      return [
        `On the Box-Muller data the largest gap is D = ${F.num(s.normal.ks.D, 4)} (p = ${F.pval(s.normal.ks.pValue)}), and ${F.pct(s.normal.tail.rate, 3)} of the values fall above 3 standard deviations against the theoretical ${F.pct(s.normal.tail.expected, 3)}. On the heavy-tailed data D = ${F.num(s.heavy.ks.D, 4)} (p = ${F.pval(s.heavy.ks.pValue)}), and ${F.pct(s.heavy.tail.rate, 3)} fall above 3 standard deviations: ${F.num(s.heavy.tail.rate / s.heavy.tail.expected, 1)} times the theoretical share, exactly the extra false alarms of section 1.7.`,
        'Notice where the empirical function departs from the normal: in the middle, not only in the tails. A rescaled t has the same variance as the normal but is narrower in the middle and wider at the sides, and the test sees it by looking at the whole curve.',
      ];
    },
  },
  checks: {
    intro: 'Every rule and every constant of the page is checked against an independent reference: the Gauss nodes against their closed form and NumPy, the rules against polynomials they must integrate exactly, Φ, the tails and the quantiles against mpmath at 40 digits, the exact integrals of Part 2 against mpmath, Student’s t and Kolmogorov’s law against SciPy, the generators against their reference C code and against a separate Python implementation. The reference Φ used in the tables (the incomplete gamma function) uses no quadrature rule: a rule checked against itself would prove nothing.',
    summary: (ok, total) => `${ok} checks out of ${total} passed.`,
    details: (n) => `All ${n} checks`,
    groups: { quadrature: 'The rules', normal: 'The normal law', part2: 'Part 2', generator: 'The generators' },
    cols: { check: 'Check', expected: 'Expected', result: 'Result' },
    ok: 'passed',
    failed: 'failed',
  },
  part2: {
    intro: [
      'Riemann and Lebesgue measure the same area in two ways. Riemann cuts the x axis into strips and reads the height of the function in every strip; Lebesgue cuts the y axis into levels and for every level measures how much of the x axis lies above it. For continuous functions the two integrals agree; Lebesgue’s works for many more functions and behaves much better with limits, which is why modern probability (the expected value is a Lebesgue integral) is built on it.',
    ],
  },
  idea: {
    intro: [
      'Lebesgue explained the difference with coins. You have to pay a debt with the coins in your pocket. You can take them out one at a time and add them up in the order they come: that is Riemann, who walks along the x axis from left to right. Or you can first sort them by value, count how many there are of each kind and multiply: that is Lebesgue, who groups the points by the value of the function. The total is the same; the second way, though, does not care about the order, and that is why it works even when the order is chaos.',
    ],
  },
  tryCoins: {
    intro: [
      `A handful of ${HANDFUL} coins. Above, in the order they come out of the pocket, with the sum growing coin after coin (Riemann). Below, the same coins sorted by value: how many there are of each kind, times their value (Lebesgue). The sums are in whole cents, so no rounding can hide a difference.`,
    ],
    orderTitle: 'Riemann: in the order they come out',
    groupTitle: 'Lebesgue: grouped by value',
    running: (total) => `Running sum: ${EN.euro(total)}`,
    groupLine: (g) => `${g.count} × ${coinLabel(g.value)} = ${EN.euro(g.subtotal)}`,
    total: (h) => `Riemann ${EN.euro(h.total)}, Lebesgue ${EN.euro(h.byGroups)}: ${h.total === h.byGroups ? 'the same' : 'different'}.`,
    another: 'Another handful',
    coinLabel,
  },
  functions: {
    intro: [
      'Six functions, each chosen to show something. x² is smooth and monotone; the bell is the one of Part 1; the step function is a simple function, Lebesgue’s building block; sin(1/x) oscillates infinitely often near 0 while staying bounded; 1/√x is infinite at 0 but has a finite area; the traffic of a server is a realistic example, with an attack. Plus a function you type yourself. The choice applies to sections 2.3, 2.4, 2.5 and to the example after them.',
    ],
    tableTitle: 'The functions and their exact integrals',
    cols: { name: 'Function', interval: 'Interval', formula: 'f(x)', integral: 'Exact integral', feature: 'What it shows' },
    features: {
      square: 'Smooth: both methods work',
      bell: 'Smooth, with a peak: Part 1',
      steps: 'Simple: Lebesgue is exact with few levels',
      oscillating: 'Infinitely many oscillations near 0',
      unbounded: 'Unbounded, with a finite area',
      traffic: 'Data of a day, with an attack',
    },
    chooseLabel: 'Function',
    customTitle: 'Your function',
    formulaLabel: 'f(x) =',
    formulaHint: `Numbers, x, ${FORMULA_NAMES.constants.join(', ')}, + - * / ^, parentheses, |...| for the absolute value, and ${FORMULA_NAMES.functions.join(', ')}. At most ${FORMULA_MAX} characters; 2x means 2*x.`,
    aLabel: 'from a =',
    bLabel: 'to b =',
    restore: 'Restore',
    errors: {
      empty: 'Type a formula.',
      tooLong: `At most ${FORMULA_MAX} characters.`,
      character: (e) => `Character "${e.text}" not allowed at position ${e.at + 1}.`,
      unknown: (e) => `Unknown name "${e.text}" at position ${e.at + 1}.`,
      call: (e) => `${e.text} needs parentheses: ${e.text}(x).`,
      parens: () => 'Unbalanced parentheses.',
      bars: () => 'Unbalanced absolute value bars.',
      syntax: (e) => `Incomplete formula or unexpected symbol at position ${e.at + 1}.`,
      end: () => 'The formula ends too early.',
      deep: () => 'Too many nested parentheses.',
      notDefined: (e) => `The function is not defined at ${EN.pct(e.share, 0)} of the points of the interval.`,
      range: () => 'Invalid ends: two numbers between -1,000,000 and 1,000,000 are needed.',
      order: () => 'a < b is needed.',
    },
    stale: 'Invalid formula: the sections show the last valid function.',
    customNote: (c) => [c.undefinedPoints ? `At ${c.undefinedPoints} points out of 2,001 the formula is not defined: there it counts as 0, which does not change the integral as long as they are isolated points.` : null, c.infinite ? `At ${c.infinite} points it is infinite: Riemann reports it, Lebesgue cuts it at 1,000.` : null].filter(Boolean).join(' '),
  },
  functionNames: functionNamesEn,
  riemann: {
    intro: [
      'Riemann divides [a, b] into n strips and in every strip takes the value of the function at one point: the left end, the right end, the centre. The function is Riemann integrable if, as the strips narrow, every choice of points leads to the same number; Darboux’s test checks it with the lower sum (the lowest value of every strip) and the upper sum (the highest), which must come together.',
    ],
    formulasTitle: 'Riemann and Darboux sums',
    kindLabel: 'Height of the strip',
    kinds: { left: 'Left', right: 'Right', midpoint: 'Centre', lower: 'Minimum', upper: 'Maximum' },
    chartTitle: (name, n, kind) => `${name}: ${n} strips, height at the ${{ left: 'left end', right: 'right end', midpoint: 'centre', lower: 'minimum', upper: 'maximum' }[kind]}`,
    tableTitle: (ref) => `Riemann sums (${refEn(ref)} integral ${EN.sig(ref.value, 10)})`,
    cols: { n: 'n', left: 'Left', right: 'Right', midpoint: 'Centre', lower: 'Lower', upper: 'Upper', gap: 'Upper - lower' },
    note: `The minimum and maximum of every strip are estimated on ${DARBOUX_SAMPLES + 1} points of the strip: exact on monotone stretches, close on smooth ones.`,
    after: (rows, key) => {
      const last = rows[rows.length - 1];
      if (!Number.isFinite(last.gap)) return ['Here the upper sum is infinite for every n: the first strip contains 0, where the function is infinite. In the proper sense the function is not Riemann integrable, and its integral exists only as a limit (an improper integral): the sums at the centre approach 2, but slowly.'];
      if (key === 'steps') return [`With n = ${EN.int(last.n)} strips upper - lower is ${EN.err(last.gap)}: the difference comes only from the three strips straddling the jumps, and it falls as 1/n.`];
      if (key === 'oscillating') return [`Near 0 every strip contains infinitely many waves, and its minimum and maximum are -1 and 1: upper - lower falls slowly (${EN.err(last.gap)} with n = ${EN.int(last.n)}). The function is still Riemann integrable, because the bad strips take less and less room.`];
      return [`With n = ${EN.int(last.n)} strips upper - lower is ${EN.err(last.gap)}: lower and upper close in on the integral, and that is Riemann’s definition at work.`];
    },
  },
  lebesgue: {
    intro: [
      'Lebesgue divides the values instead: K levels between the lowest value m and the highest M. For every level he measures the set where the function lies above it, whatever its shape: one interval, ten, infinitely many. Every horizontal band has height (M - m)/K and a width equal to that measure. The lower and the upper sum differ by (M - m)(b - a)/K, whatever the function: this guarantee, which does not depend on how the function behaves along x, is what makes Lebesgue so powerful.',
      `The price is measuring the level sets. Here a grid of ${EN.int(LEVEL_CELLS)} cells does it, refined with bisection where the function crosses the level: the ends are exact even at a jump, but a wave that starts and ends inside one cell goes unseen. Unbounded functions are cut at a cap T, and what lies above it is left out.`,
    ],
    formulasTitle: 'Lebesgue sums with K levels',
    chartTitle: (name, K) => `${name}: ${K} levels, every band over the set where f exceeds its level`,
    tableTitle: (ref) => `Lebesgue sums (${refEn(ref)} integral ${EN.sig(ref.value, 10)})`,
    cols: { K: 'K', lower: 'Lower', upper: 'Upper', midpoint: 'Mean', gap: 'Upper - lower' },
    capNote: (cap, exact) => `Values cut at T = ${EN.int(cap)}: the sums integrate min(f, T), which is ${EN.sig(exact, 8)}; the part above the cap, 1/T = ${EN.sig(1 / cap, 3)}, is left out.`,
    distributionTitle: 'Lebesgue’s view: μ{f ≥ y}, the measure of the set above every level y',
    rearrangementTitle: 'The function (purple) and the same with its values sorted from the highest (blue): the same area',
    after: (rows, key) => {
      const last = rows[rows.length - 1];
      if (key === 'steps') return [`With K = ${rows[0].K} levels the values of the function, ${[...STEPS.values].sort((a, b) => a - b).map((v) => EN.plain(v)).join(', ')}, all fall on a level (the step is ${EN.plain((rows[0].M - rows[0].m) / rows[0].K)}): the lower sum is already exact, ${EN.sig(rows[0].lower, 10)}. A simple function is made of few values, and Lebesgue counts them: value times the measure of the set where the function takes it.`];
      return [`With K = ${EN.int(last.K)} levels lower and upper are ${EN.err(last.gap)} apart, exactly (M - m)(b - a)/K. The second chart sorts the values of the function from the highest to the lowest: the curve that comes out (the decreasing rearrangement) has the same area, and it is the chart on the left read sideways.`];
    },
  },
  trySlices: {
    intro: [
      'The same strips and slices live: move n and K and compare. With the step function Lebesgue becomes exact as soon as the levels fall on the steps, while Riemann pays for every jump; with x² Riemann’s strips are faster; with sin(1/x) both struggle near 0. Play grows n and K together from 1 to 64.',
    ],
    nLabel: (n) => `n = ${n} strips`,
    kLabel: (K) => `K = ${K} levels`,
    play: 'Play',
    pause: 'Pause',
    values: (r, l, ref) => {
      const F = EN;
      const e = (v) => (Number.isFinite(v) ? F.err(Math.abs(v - ref.value)) : '∞');
      return `Riemann at the centre ${F.sig(r.midpoint, 8)} (error ${e(r.midpoint)}), between ${F.sig(r.lower, 6)} and ${F.sig(r.upper, 6)}. Lebesgue ${F.sig(l.midpoint, 8)} (error ${e(l.midpoint)}), between ${F.sig(l.lower, 6)} and ${F.sig(l.upper, 6)}. Integral (${refEn(ref)}) ${F.sig(ref.value, 10)}.`;
    },
    riemannTitle: (n) => `Riemann, ${n} strips`,
    lebesgueTitle: (K) => `Lebesgue, ${K} levels`,
  },
  compare: {
    intro: [
      'Who wins? The chart compares the error of the two mean sums as n = K grows, and, dashed, the distance between lower and upper of each method, which is its guarantee. The table at the bottom makes the same comparison on all six functions.',
    ],
    chartTitle: (name) => `${name}: error as n = K grows (logarithmic scales)`,
    legend: ['Riemann, centre', 'Lebesgue, mean', 'Riemann, upper - lower', 'Lebesgue, upper - lower'],
    tableTitle: 'Errors and guarantees for doubling n = K',
    cols: { n: 'n = K', riemann: 'Riemann’s error', lebesgue: 'Lebesgue’s error', riemannGap: 'Riemann’s guarantee', lebesgueGap: 'Lebesgue’s guarantee' },
    customPending: 'The comparison of your function is computed here, in the browser: a few tenths of a second.',
    after: (f, name) => {
      const F = EN;
      const winner = f.winner === 'lebesgue' ? 'Lebesgue' : 'Riemann';
      return [`${name}: with n = K = ${F.int(f.n)} ${winner} wins, by ${F.num(f.ratio, 1)} times (errors ${F.err(f.riemann)} for Riemann and ${F.err(f.lebesgue)} for Lebesgue). Riemann’s error falls with order ${F.num(f.riemannOrder, 2)}, Lebesgue’s with order ${F.num(f.lebesgueOrder, 2)}${f.riemannInfinite ? '; Riemann’s guarantee is infinite, Lebesgue’s is not' : ''}.`];
    },
    summaryTitle: 'All functions: errors with n = K = 8 and n = K = 1,024',
    summaryCols: { name: 'Function', riemann8: 'Riemann, 8', lebesgue8: 'Lebesgue, 8', riemann1024: 'Riemann, 1,024', lebesgue1024: 'Lebesgue, 1,024', winner: 'Winner' },
    summaryAfter: (rows) => {
      const names = (who) => rows.filter((r) => r.winner === who).map((r) => functionNamesEn[r.key].toLowerCase()).join(', ') || 'none';
      return [
        `With n = K = 1,024 Riemann wins on: ${names('riemann')}; Lebesgue on: ${names('lebesgue')}. The lesson is an honest one: as a numerical algorithm Lebesgue is not better than Riemann. For smooth functions Riemann’s strips, evaluated at the centre, converge as 1/n²; Lebesgue comes into its own with simple functions and unbounded ones, where Riemann has to stop at an improper limit.`,
        'Lebesgue’s real advantage is not speed: it is that his guarantee does not depend on the shape of the function along x, and that his theorems on limits (monotone and dominated convergence) allow limit and integral to be swapped, which probability and statistics are built on.',
      ];
    },
  },
  traffic: {
    intro: [
      `An example from cybersecurity. The traffic of a server over a day, in Mb/s: ${TRAFFIC.base} at night, a bell of ${TRAFFIC.day} around ${TRAFFIC.peak}:00, and at ${TRAFFIC.at}:00 an attack that for a quarter of an hour adds up to ${TRAFFIC.attack} Mb/s. Riemann and Lebesgue answer two different questions about the same curve. Riemann adds up minute after minute and gives the total transferred, the figure on the bill. Lebesgue asks, for every threshold, how many hours the link stayed above it: the question of whoever sizes the bandwidth or a DDoS defence.`,
    ],
    chartTitle: 'The traffic of the day (Mb/s): every band covers the hours in which the traffic exceeds its threshold',
    tableTitle: 'The hours above every threshold (Lebesgue’s level sets)',
    cols: { y: 'Threshold (Mb/s)', hours: 'Hours above', minutes: 'Minutes above', when: 'When' },
    durationTitle: 'The load duration curve: the traffic sorted from the busiest minute, with the thresholds from 350 Mb/s up',
    after: (r) => {
      const F = EN;
      const above500 = r.rows.find((row) => row.y === 500);
      return [
        `Over the whole day ${F.num(r.total, 1)} Mb/s × hours go through, that is ${F.int(r.gigabytes)} GB (the Riemann sums minute by minute give ${F.num(r.riemann, 1)}). The attack is only ${F.pct(r.attackShare, 1)} of it: in the total it hardly shows. In the level sets, instead, it is the only protagonist: above 500 Mb/s the link stays ${F.num(above500.hours * 60, 1)} minutes, all between ${clock(above500.intervals[0][0])} and ${clock(above500.intervals[above500.intervals.length - 1][1])}, and the peak reaches ${F.int(r.peak)} Mb/s.`,
        'The load duration curve, the traffic sorted from the busiest minute to the quietest, is the decreasing rearrangement of section 2.4: network and power engineers have used it for decades without calling it Lebesgue. Its area is the total again.',
      ];
    },
  },
  montecarlo: {
    intro: [
      'Monte Carlo integrates by drawing points at random: the integral of f on [a, b] is (b - a) times the expected value of f(U), with U uniform, and the mean of N values estimates it. It never looks at the order of the points along the x axis, only at how many values fall where: it is a statistical relative of Lebesgue. Its error falls as 1/√N whatever the smoothness of the function, and every estimate comes with its confidence interval, computed with the three lines of Welford from Homework #4.',
    ],
    formulasTitle: 'Monte Carlo',
    fieldsIntro: 'How many points every estimate uses and how many independent estimates are made for every function; the seed is the one of section 1.8.',
    pointsLabel: 'Points per estimate N',
    pointsHint: `from ${EN.int(LIMITS.points[0])} to ${EN.int(LIMITS.points[1])}`,
    repsLabel: 'Repetitions',
    repsHint: `from ${EN.int(LIMITS.reps[0])} to ${EN.int(LIMITS.reps[1])}`,
    tableTitle: (s) => `${EN.int(s.params.reps)} estimates of ${EN.int(s.params.points)} points for every function`,
    cols: { name: 'Function', exact: 'Exact integral', mean: 'Mean of the estimates', sd: 'Standard deviation', se: 'Mean standard error', coverage: `${EN.pct(CONFIDENCE, 0)} intervals containing it` },
    chooseLabel: 'Histogram of',
    histogramTitle: (name, s) => `${name}: the ${EN.int(s.params.reps)} estimates, with the normal law of the central limit theorem and the exact value`,
    legend: ['estimates', 'expected normal', 'exact value'],
    after: (s) => {
      const F = EN;
      const u = s.mc.unbounded;
      const ok = ['square', 'bell', 'steps', 'oscillating', 'traffic'].map((key) => `${functionNamesEn[key].toLowerCase()} ${F.pct(s.mc[key].coverage, 1)}`).join(', ');
      return [
        `For the five functions with a finite variance the 95% intervals contain the exact integral in these shares: ${ok}. That is the promise of the interval, and the tests of section 3 say whether it is kept.`,
        `With 1/√x the share is ${F.pct(u.coverage, 1)}${u.coverage < 0.94 ? ', below the promise' : ''}. The estimates stay right on average (${F.sig(u.mean, 6)} against 2), but f(U) = 1/√U has an infinite variance: every now and then U falls very close to 0 and a single point moves the whole mean. The histogram shows it: a long tail to the right and a peak shifted to the left, and the standard deviation of a sample almost always underestimates the true uncertainty. It is the same function that Riemann does not integrate in the proper sense: even Monte Carlo, which does not look at the order of the points, feels the infinity.`,
      ];
    },
  },
  tryMc: {
    intro: [
      'Monte Carlo live: Play draws points from 10 up to 100,000, and the chart follows the estimate with its 95% band, against the exact value dashed. With bounded functions the band narrows as 1/√N and almost always contains the exact value; with 1/√x watch the jumps: a point very close to 0 moves the estimate at once. Another draw starts again with new points.',
    ],
    chooseLabel: 'Function',
    play: 'Play',
    pause: 'Pause',
    again: 'Another draw',
    chartTitle: (name) => `${name}: the estimate as the points grow (logarithmic scale), with its 95% band`,
    legend: ['estimate and 95% band', 'exact value'],
    status: (p, exact) => (p ? `${EN.int(p.k)} points: estimate ${EN.sig(p.estimate, 7)} ± ${EN.sig(1.96 * p.se, 3)}, exact value ${EN.sig(exact, 7)}.` : 'Press Play.'),
  },
  dirichlet: {
    intro: [
      'The classic example that separates the two integrals is Dirichlet’s function: 1 on the rationals and 0 on the irrationals, on [0, 1]. Every Riemann strip contains both rationals and irrationals, so the lower sum is always 0 and the upper sum always 1: for Riemann it is not integrable. For Lebesgue it is, and its integral is 0, because the rationals are countable and have measure zero.',
      'A computer, however, cannot compute it, and the reason is practical: every number a program stores is rational. A double is always a fraction m/2^k: the irrational does not exist, not even π. For the computer Dirichlet’s function is 1 everywhere, and its “numerical integral” is 1, not 0. The table shows the exact fraction of a few numbers as the browser stores them.',
    ],
    numbers: { tenth: '0.1', third: '1/3', pi4: 'π/4', sqrt2: '√2', e: 'e' },
    cols: { number: 'Number', fraction: 'Exact fraction stored', value: 'Dirichlet on the computer' },
    after: 'Lebesgue’s measure sees the set of all real numbers; a computer sees a finite subset of rationals, which for Lebesgue has measure zero. This is the only function of the page that mathematics integrates and numerical computation cannot.',
  },
  stats: {
    verdict: { reject: 'H₀ rejected', notReject: 'H₀ not rejected' },
    expected: { reject: 'expected: rejection', notReject: 'expected: no rejection', either: 'depends on the power of the test' },
    testLine: testLineEn,
    groups: { model: 'The normal model', coverage: 'Monte Carlo coverage', bias: 'Monte Carlo bias' },
    labels: {
      model: {
        ksNormal: 'The Box-Muller data follow the numerical Φ (Kolmogorov-Smirnov)',
        tailNormal: `In the Box-Muller data the share above ${ALARM_K} standard deviations is P(Z > ${ALARM_K}) (z)`,
        ksHeavy: 'The heavy-tailed data follow the same normal law (false on purpose)',
        tailHeavy: `In the heavy-tailed data the share above ${ALARM_K} standard deviations is P(Z > ${ALARM_K}) (false on purpose)`,
      },
      coverage: Object.fromEntries(Object.entries(functionNamesEn).map(([key, name]) => [key, `${name}: the ${EN.pct(CONFIDENCE, 0)} intervals contain the integral ${EN.pct(CONFIDENCE, 0)} of the times (z)`])),
      bias: Object.fromEntries(Object.entries(functionNamesEn).map(([key, name]) => [key, `${name}: the estimates have the exact integral as their mean (z)`])),
    },
  },
  tests: {
    intro: (s) => `The hypothesis tests of the page, at significance level α = ${EN.num(SIGNIFICANCE, 2)}. The normal model is checked on the ${EN.int(s.params.sample)} Box-Muller values and on as many heavy-tailed ones, with the Kolmogorov-Smirnov test and with the share beyond the three-sigma threshold; Monte Carlo with the coverage of the intervals and with the mean of the estimates, over ${EN.int(s.params.reps)} repetitions of ${EN.int(s.params.points)} points for every function. Two null hypotheses are false on purpose (the heavy-tailed data are not normal), and their rejection is expected.`,
    cols: { subject: 'Subject', hypothesis: 'Null hypothesis H₀', p: 'p-value', verdict: 'Outcome', expected: 'Reading' },
    after: (sum) => {
      const out = [`${sum.rejected} tests out of ${sum.count} reject the null hypothesis, ${sum.asExpected === sum.count ? 'all as expected' : `${sum.asExpected} out of ${sum.count} as expected`}.`];
      const expectedFalse = EN.num(sum.nulls * SIGNIFICANCE, 2);
      const which = sum.falseRejections.map((t) => EN.pval(t.result.pValue)).join(', ');
      out.push(
        `Among the ${sum.nulls} tests with a true null hypothesis, at level ${EN.num(SIGNIFICANCE, 2)} one expects on average ${expectedFalse} rejections by pure chance: ${sum.falseRejections.length === 0 ? 'here there are none' : `here there ${sum.falseRejections.length === 1 ? 'is one' : `are ${sum.falseRejections.length}`} (p = ${which})`}. Holm’s correction for multiple tests compares the smallest p-value with ${EN.num(SIGNIFICANCE, 2)}/${sum.nulls} = ${EN.num(sum.holmThreshold, 4)}, the next with ${EN.num(SIGNIFICANCE, 2)}/${sum.nulls - 1} and so on: ${sum.holm === 0 ? 'no rejection survives' : `${sum.holm === 1 ? 'one rejection survives' : `${sum.holm} rejections survive`}, to be looked at as a possible defect`}.`,
      );
      out.push('The Monte Carlo coverage of 1/√x is marked “depends on the power”: the theory says that without a finite variance the interval does not keep its 95% promise for a fixed N, and with enough repetitions the test notices it; with few repetitions it may not see it.');
      return out;
    },
  },
  history: {
    intro: 'From Kepler’s barrels to the generators of this page, the ideas used in the homework in chronological order.',
    legend: { task: 'used in this page', context: 'context' },
    events: [
      { year: '1615', task: true, title: 'Kepler', text: 'In Nova stereometria doliorum vinariorum he computes the volume of wine barrels with a three-point rule: the ancestor of Simpson’s rule.' },
      { year: '1676-1722', task: true, title: 'Newton and Cotes', text: 'The formulas for integrating with equally spaced points that bear their names today: trapezoids and Simpson are their first two cases.' },
      { year: '1733', task: true, title: 'de Moivre', text: 'The normal curve appears as an approximation of the binomial: it is the density that Part 1 integrates.' },
      { year: '1743', task: true, title: 'Simpson', text: 'Thomas Simpson publishes the rule of the parabolas that bears his name, already known to Cavalieri and to James Gregory.' },
      { year: '1799', task: true, title: 'Kramp', text: 'Christian Kramp computes the first table of the integral of e^(-t²), for astronomical refraction: the first table of the normal.' },
      { year: '1809', task: true, title: 'Gauss', text: 'In Theoria motus the normal becomes the law of observation errors.' },
      { year: '1814', task: true, title: 'Gauss', text: 'Methodus nova integralium valores per approximationem inveniendi: nodes and weights chosen to integrate polynomials of the highest possible degree exactly, the Gauss rule of the page.' },
      { year: '1826', task: true, title: 'Jacobi', text: 'He links Gauss’s nodes to the roots of the Legendre polynomials, as gaussLegendre() computes them with Newton’s method.' },
      { year: '1835', task: false, title: 'Liouville', text: 'He proves that some integrals, that of e^(-t²) among them, cannot be written with a finite number of elementary functions: Φ has to be computed numerically.' },
      { year: '1854', task: true, title: 'Riemann', text: 'In his habilitation thesis on trigonometric series, published after his death, he defines the integral as the limit of the sums over strips.' },
      { year: '1871', task: false, title: 'Glaisher', text: 'He names the error function, erf, with which Φ is written today as Φ(z) = (1 + erf(z/√2))/2.' },
      { year: '1875', task: true, title: 'Darboux', text: 'The lower and upper sums: a function is Riemann integrable if and only if their difference goes to zero.' },
      { year: '1898', task: false, title: 'Borel', text: 'He builds the measure of the sets of the line, additive over countable sequences: the ground Lebesgue will work on.' },
      { year: '1902', task: true, title: 'Lebesgue', text: 'The thesis Intégrale, longueur, aire, published in the Annali di Matematica Pura ed Applicata: the integral by levels and the measure of the level sets.' },
      { year: '1903', task: false, title: 'Sheppard', text: 'The tables of the normal in Biometrika, the model of the tables every statistics book still prints.' },
      { year: '1905', task: false, title: 'Vitali', text: 'Giuseppe Vitali builds a non-measurable set: Lebesgue too has a limit, and a measure cannot be given to every subset of the line.' },
      { year: '1933', task: true, title: 'Kolmogorov', text: 'In the Grundbegriffe probability becomes a measure and the expected value a Lebesgue integral; in the same year, in the Giornale dell’Istituto Italiano degli Attuari, the test on the largest gap between the empirical and the theoretical distribution function.' },
      { year: '1949', task: true, title: 'Metropolis and Ulam', text: 'The Monte Carlo Method: integrating and estimating probabilities by drawing random numbers.' },
      { year: '1958', task: true, title: 'Box and Muller', text: 'The transformation of two uniforms into two independent normals, used for the data of section 1.8.' },
      { year: '1969', task: false, title: 'Cody', text: 'The rational approximations of erf still used by many numerical libraries: that is how Φ is computed today, not with quadrature rules.' },
      { year: '1970', task: true, title: 'Stephens', text: 'The correction of the Kolmogorov-Smirnov test for finite samples, (√n + 0.12 + 0.11/√n) D, used in the page.' },
      { year: '1985', task: true, title: 'IEEE 754', text: 'The standard of floating point numbers: every double is a fraction m/2^k, which is why Dirichlet’s function is always 1 on a computer.' },
      { year: '2014-2018', task: true, title: 'SplitMix and xoshiro', text: 'The random number generators of this page, as of Homework #3 and #4.' },
    ],
    after: 'The story runs on two tracks that this homework brings together. One is the computation of the area, from Kepler’s barrels to Gauss, which leads to the rules of Part 1; the other is the definition of the integral, from Riemann to Lebesgue to Kolmogorov, which leads to modern probability and to Part 2.',
  },
  conclusion: (s, facts) => {
    const F = EN;
    const out = [
      `Part 1. The distribution function of the normal law is computed by adding up slices of the bell. The five rules converge with the orders of the theory (measured: ${F.num(facts.orders.left, 2)}, ${F.num(facts.orders.midpoint, 2)}, ${F.num(facts.orders.trapezoid, 2)}, ${F.num(facts.orders.simpson, 2)}), and Gauss-Legendre reaches ten decimals with ${F.int(facts.enough.gauss)} values of φ against Simpson’s ${F.int(facts.enough.simpson)}. -∞ is best avoided with the symmetry rather than the truncation, and the far tail must be integrated directly: 1 - Φ(k) is off by more than 50% from k = ${facts.tailTotal}. With the same CDF one rebuilds the table of the books and the quantiles, 1.96 included, and sets alarm thresholds: provided the data really have normal tails, which the Kolmogorov-Smirnov test allows to check.`,
      'Part 2. Riemann and Lebesgue give the same number on every function of the page, but reach it in different ways. As an algorithm Riemann wins on smooth functions; Lebesgue wins on simple functions and on unbounded ones, and his guarantee, (M - m)(b - a)/K, does not depend on how the function behaves along x. On the traffic of a server the two integrals answer two questions: how much went through in all, and for how long the link stayed above every threshold.',
    ];
    if (s) {
      const u = s.mc.unbounded;
      out.push(`Monte Carlo, Lebesgue’s statistical cousin, keeps its 95% promise on the functions with a finite variance; on 1/√x, whose variance is infinite, the intervals contain the integral ${F.pct(u.coverage, 1)} of the times: the same function that Riemann does not integrate in the proper sense. And Dirichlet’s function recalls the limit of every numerical computation: a computer sees only rational numbers, a set that for Lebesgue has measure zero.`);
    }
    return out;
  },
  ruleNames: ruleNamesEn,
  tips: {
    piece: (p, i, sign) => {
      const F = EN;
      const what = { rect: 'rectangle', trap: 'trapezoid', parab: 'arc of parabola', node: 'Gauss node' }[p.kind];
      return `${what[0].toUpperCase()}${what.slice(1)} ${i + 1}: from ${F.num(p.x0, 3)} to ${F.num(p.x1, 3)}${p.kind === 'node' ? `, node at ${F.num(p.tag, 3)}, weight ${F.num(p.weight, 4)}` : ''}, area ${F.num(p.area, 6)}${sign < 0 ? ' (taken away from 1/2)' : ''}`;
    },
    convergence: (r) => `n = ${EN.int(r.n)}: ${Object.entries(r.errors).map(([rule, e]) => `${ruleNamesEn[rule]} ${e === null ? '-' : EN.err(e)}`).join(', ')}`,
    newton: (r) => `Step ${r.k}: z = ${EN.num(r.z, 12)}, error ${EN.err(r.error)}`,
    tail: (r) => `k = ${r.k}: P(Z > k) = ${EN.sci(r.reference, 3)}; 1 - Φ(k) is off by ${EN.err(r.subtractionError)}, the direct tail by ${EN.err(r.directError)}`,
    alarm: (k, events) => `k = ${EN.num(k, 1)}: normal data ${EN.sci(tailDirect(k))} (${EN.num(events * tailDirect(k), 1)} a day), heavy tails ${EN.sci(heavySf(k))} (${EN.num(events * heavySf(k), 1)} a day)`,
    ecdf: (x, F, P) => `x = ${EN.num(x, 3)}: empirical ${EN.num(F, 4)}, Φ ${EN.num(P, 4)}, gap ${EN.num(Math.abs(F - P), 4)}`,
    strip: (s, kind) => `From ${EN.sig(s.x0, 4)} to ${EN.sig(s.x1, 4)}: height ${EN.sig(s[kind], 5)}, minimum ${EN.sig(s.lower, 5)}, maximum ${EN.sig(s.upper, 5)}`,
    level: (y0, y1, measure, pieces) => `Band from ${EN.sig(y0, 4)} to ${EN.sig(y1, 4)}: f ≥ ${EN.sig(y1, 4)} over a length ${EN.sig(measure, 5)} (${pieces} ${pieces === 1 ? 'interval' : 'intervals'}), area ${EN.sig((y1 - y0) * measure, 5)}`,
    traffic: (y, set) => `Above ${EN.int(y)} Mb/s: ${EN.num(set.reduce((s, [a, b]) => s + b - a, 0) * 60, 1)} minutes${set.length ? `, ${set.map(([a, b]) => `${clock(a)}-${clock(b)}`).join(', ')}` : ''}`,
    distribution: (y, m) => `y = ${EN.sig(y, 4)}: f ≥ y over a length ${EN.sig(m, 5)}`,
    rearrangement: (s, sorted, original) => `s = ${EN.sig(s, 4)}: sorted ${EN.sig(sorted, 5)}, original ${EN.sig(original, 5)}`,
    duration: (h, v) => `${EN.num(h, 2)} hours a day above ${EN.int(v)} Mb/s`,
    compare: (r) => `n = K = ${EN.int(r.n)}: Riemann ${EN.err(r.errors.riemann)}, Lebesgue ${EN.err(r.errors.lebesgue)}`,
    estimates: (from, to, count, share) => `From ${EN.sig(from, 5)} to ${EN.sig(to, 5)}: ${EN.int(count)} estimates, ${EN.pct(share, 1)}`,
    mcPath: (p, exact) => `${EN.int(p.k)} points: estimate ${EN.sig(p.estimate, 6)} ± ${EN.sig(1.96 * p.se, 3)}, exact ${EN.sig(exact, 6)}`,
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: after extracting the archive it opens with a double click on index.html, even offline, with the same computations, charts and interactive examples. With node homework5.js it prints in the terminal the five rules, the table of the normal, the quantiles, the tails, the Riemann and Lebesgue sums of every function, Monte Carlo and the tests; --z, --mu, --sigma, --rule, --n, --function, --formula, --a, --b and --seed change the parameters.',
    contents: 'Contents: index.html, style.css, homework5.js (quadrature rules, CDF, Riemann, Lebesgue, generators, statistics and charts), app.js (interface and texts), README.txt.',
    zip: 'Download homework5',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'The distribution function of the normal law by numerical integration, and the Riemann and Lebesgue integrals computed numerically.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
    noscript: 'This program needs JavaScript.',
  },
};

export const HW5_TEXTS = { it, en };
