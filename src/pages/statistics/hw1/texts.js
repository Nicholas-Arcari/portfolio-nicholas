// src/pages/statistics/hw1/texts.js
// I testi dell'Homework #1 in italiano e in inglese. Li usano sia la pagina
// del sito sia il programma scaricabile, cosi' le due versioni dicono le
// stesse cose con le stesse parole. I parametri della consegna arrivano da
// TASK e ogni numero delle analisi dagli argomenti: nessuna frase contiene
// "17" o "(1, 5)" scritti a mano, e cambiando TASK cambia tutto il testo.
import { TASK } from './homework1.js';
import { bitsBeyond, worstBit } from './view.js';

const fmtPoint = (P) => (P === null ? 'O' : `(${P.x}, ${P.y})`);

/** Number formatting of one language: decimal separator and "not defined" marker. */
function formatters(decimal, na) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  return {
    na,
    decimal,
    num: (v, digits = 3) => (missing(v) ? na : local((Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits))),
    pval: (v) => (missing(v) ? na : v === 0 ? '0' : v < 0.001 ? local(v.toExponential(1)) : local(v.toFixed(3))),
    // an expected count: a decimal when it is large, two significant digits when it is small
    approx: (v) => {
      if (missing(v)) return na;
      if (v === 0) return '0';
      if (v >= 100) return local(v.toFixed(0));
      if (v >= 1) return local(v.toFixed(1));
      return v >= 1e-4 ? local(String(Number(v.toPrecision(2)))) : `< ${local('0.0001')}`;
    },
    pct: (v) => (missing(v) ? na : `${local((100 * v).toFixed(1))}%`),
    short: (v) => (missing(v) ? na : local(String(v))),
  };
}

/** Binary digits 1 at the end of p: the low bits that y and p - y always have complementary. */
const trailingOnes = (p) => {
  let t = 0;
  for (let q = p; q & 1; q >>>= 1) t++;
  return t;
};

/** "1 cella", "2 celle": a count with its noun in the right number. */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * The assignment as the professor wrote it, block by block. The curve, the
 * base point and the key come from TASK, the same constant the program uses:
 * the quotation and the computation cannot drift apart.
 */
export const originalAssignment = (task = TASK) => [
  { type: 'title', text: 'HMWK 1 - Example App: Public-Key Cryptography PRIVATE KEY → PUBLIC KEY in Ethereum' },
  {
    type: 'p',
    text: 'Notes: Elliptic-curve scalar multiplication can be viewed as a cryptographic one-way function. It is deterministic and easy to compute in the forward direction: private key k → public key Q = kG while recovering k from Q is computationally difficult. It therefore shares some properties with cryptographic hash functions, but it is based on the Elliptic Curve Discrete Logarithm Problem (ECDLP) and is used for public-key cryptography and digital signatures.',
  },
  { type: 'p', text: 'The goal is to understand the basic idea of elliptic-curve scalar multiplication, not to implement a real cryptographic system.' },
  { type: 'heading', text: 'TASK' },
  {
    type: 'p',
    text: 'Write a small JavaScript/html/css program showing how a private key can be used to generate a public key using elliptic-curve scalar multiplication. (In Ethereum, the relevant elliptic curve is secp256k1).',
  },
  {
    type: 'lines',
    lines: [
      `Hints: For this exercise, use a small toy curve: y² = x³ + ${task.b} (mod ${task.p})`,
      `For example, use for instance the following base point: G = ${fmtPoint(task.G)} Choose for instance a small private key: k = ${task.k}`,
      'The public key is: Q = kG  Define the toy curve and the base point G. Define the private key k.',
      'Implement the basic point-addition operation. Compute and print: G, 2G, 3G, ..., kG. Or use  afaster method for a larger k.',
      'Print the final point as the TOY PUBLIC KEY.',
    ],
  },
  { type: 'p', text: 'OPTIONAL-GURU LEVEL :-)  Make a slown-down visual representation of the algo (may use the canvas or SVG, whatever you like better)' },
  { type: 'heading', text: '== STATISTICAL EXPLORATION ==' },
  { type: 'p', text: 'Repeat the experiment with different values of k and, if useful, different valid base points.' },
  { type: 'p', text: 'Explore simple statistical properties of the resulting points, for example:' },
  {
    type: 'list',
    items: [
      'distribution of x and y coordinates;',
      'frequency of individual values;',
      'distribution of bits;',
      'apparent uniformity;',
      'correlations between input and output;',
      'possible avalanche-like behaviour.',
    ],
  },
  {
    type: 'p',
    text: 'Discuss which of these properties are meaningful for a cryptographic one-way function and which are properties specifically associated with cryptographic hash functions.',
  },
];

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', 'n/d');

const it = {
  fmt: IT,
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
    task: '1. TASK: dalla chiave privata alla chiave pubblica',
    setup: '1.1 Curva giocattolo, punto base e chiave privata',
    addition: '1.2 La somma di punti',
    multiples: '1.3 G, 2G, 3G, ..., kG',
    fast: '1.4 Un metodo più rapido per k grandi: double-and-add',
    publicKey: '1.5 La TOY PUBLIC KEY',
    guru: '2. OPTIONAL - GURU LEVEL: l’algoritmo al rallentatore',
    stats: '3. STATISTICAL EXPLORATION',
    statsTask: '3.1 Sulla curva della consegna',
    distribution: 'a. Distribuzione delle coordinate x e y',
    frequency: 'b. Frequenza dei singoli valori',
    bits: 'c. Distribuzione dei bit',
    uniformity: 'd. Uniformità apparente',
    correlation: 'e. Correlazioni fra ingresso e uscita',
    avalanche: 'f. Effetto valanga',
    statsExt: '3.2 Estensione: curve giocattolo più grandi',
    discussion: '4. Discussione: funzione a senso unico o funzione di hash?',
    definitions: '4.1 Definizioni',
    properties: '4.2 Le sei proprietà, una per una',
    inversion: '4.3 Invertire Q: perché la chiave giocattolo non è a senso unico',
    conclusion: '4.4 Conclusioni',
  },
  assignment: {
    intro: (task) => [
      'In Ethereum la chiave privata è un intero k scelto a caso fra 1 e n - 1, dove n ≈ 2^256 è l’ordine del punto base, e la chiave pubblica è il punto Q = kG della curva ellittica secp256k1, y² = x³ + 7 su un campo primo di 256 bit. Calcolare Q a partire da k è veloce; risalire a k partendo da Q è il problema del logaritmo discreto su curva ellittica (ECDLP), per cui non si conosce alcun algoritmo efficiente.',
      `La consegna chiede di mostrarlo su una curva giocattolo con la stessa equazione, y² = x³ + ${task.b} (mod ${task.p}), con punto base G = ${fmtPoint(task.G)} e chiave privata k = ${task.k}. La pagina la segue punto per punto: il TASK (sezione 1), il livello guru facoltativo (sezione 2), l’esplorazione statistica (sezione 3) e la discussione finale (sezione 4). I valori si possono cambiare; quando non sono più quelli della consegna la pagina lo segnala, e un pulsante li ripristina.`,
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese.',
  },
  setup: {
    fieldLabel: 'Campo F_p',
    baseLabel: 'Punto base G',
    keyLabel: 'Chiave privata k',
    orderWord: 'ordine',
    taskTag: 'della consegna',
    taskBadge: (task) => `Valori della consegna: y² = x³ + ${task.b} (mod ${task.p}), G = ${fmtPoint(task.G)}, k = ${task.k}.`,
    customBadge: (task) => `Valori diversi da quelli della consegna, che usa y² = x³ + ${task.b} (mod ${task.p}), G = ${fmtPoint(task.G)} e k = ${task.k}.`,
    restore: 'Ripristina i valori della consegna',
    kHint: (max) => `Un intero da 1 a ${max}.`,
    kError: {
      empty: 'Inserisci la chiave privata k.',
      notInteger: (t) => `"${t}" non è un intero positivo: sono ammesse solo le cifre da 0 a 9.`,
      range: (max) => `k deve essere un intero da 1 a ${max}.`,
      fallback: (k) => `Finché il valore non è valido resta in uso l’ultimo corretto, k = ${k}.`,
    },
    curveSummary: (p, b, count, n) =>
      `La curva y² = x³ + ${b} su F_${p} ha ${count - 1} punti affini più il punto all’infinito O, ${count} punti in tutto. G genera un sottogruppo di ${n} punti: kG dipende solo da k modulo ${n}.`,
    pointsTitle: 'I punti della curva',
    pointsLegend: 'In blu i multipli di G, cioè il sottogruppo che genera; bordati G (arancione) e la chiave pubblica Q (rosso).',
  },
  addition: {
    intro:
      'Il gruppo dei punti si costruisce con la regola della corda e della tangente. Per sommare P = (x1, y1) e Q = (x2, y2) si traccia la retta che li unisce (la tangente se P = Q): incontra la curva in un terzo punto, -R, e la somma è il suo simmetrico rispetto all’asse x, R = P + Q. In formule, modulo p:',
    formulas: (task) => [
      'P ≠ Q:   λ = (y2 - y1) / (x2 - x1)',
      `P = Q:   λ = (3·x1² + a) / (2·y1)        (qui a = ${task.a})`,
      'x3 = λ² - x1 - x2        y3 = λ·(x1 - x3) - y1',
      'P + (-P) = O,   P + O = P        (O: punto all’infinito, elemento neutro)',
    ],
    note: 'Dividere modulo p significa moltiplicare per l’inverso modulare, calcolato con l’algoritmo di Euclide esteso. Le funzioni del programma rifiutano qualunque ingresso che non sia un punto della curva, invece di restituire in silenzio un risultato sbagliato.',
  },
  multiples: {
    intro: 'Come chiede la consegna, ogni riga somma G alla precedente: k - 1 somme di punti. Sotto la tabella, lo stesso calcolo come lo stampa il programma, anche da terminale con node homework1.js.',
    colMultiple: 'Multiplo',
    colPoint: 'Punto',
    colOperation: 'Operazione',
    colLambda: 'λ',
    kinds: {
      start: 'punto di partenza',
      add: 'somma (corda)',
      double: 'raddoppio (tangente)',
      inverse: 'P + (-P) = O (retta verticale)',
      identity: 'O + G = G',
    },
    tooMany: (k, limit) => `Con k = ${k} servirebbero ${k - 1} somme: oltre ${limit} la tabella non le elenca, e il calcolo passa al double-and-add (1.4).`,
    printedTitle: 'Output del programma',
  },
  fast: {
    intro: (k, bits, steps) =>
      `Si scrive k = ${k} in binario, ${bits}, e si leggono i bit da sinistra. Il primo bit, sempre 1, carica R = G; per ogni bit successivo si raddoppia R e, se il bit vale 1, si somma G. Bastano ${steps - 1} operazioni di gruppo invece delle ${k - 1} della somma ripetuta: il costo cresce con il numero di bit di k, non con k. Per una chiave Ethereum di 256 bit sono circa 383 operazioni (255 raddoppi e in media circa 128 somme), invece di circa 2^256.`,
    colBit: 'Bit di k',
    colOperation: 'Operazione',
    colR: 'R',
    colPoint: 'Punto',
    ops: { load: 'R = G', double: 'R = 2R', add: 'R = R + G' },
  },
  publicKey: {
    intro: 'Il punto finale, stampato come chiede la consegna:',
    label: 'TOY PUBLIC KEY',
    infinity:
      'Q = O, il punto all’infinito: k è un multiplo dell’ordine di G. O non è una chiave pubblica valida, ed è per questo che in Ethereum la chiave privata si sceglie fra 1 e n - 1.',
    ethereum:
      'In Ethereum la chiave pubblica è la coppia (x, y) di Q, 64 byte, e l’indirizzo sono gli ultimi 20 byte del suo hash Keccak-256: lo riprende la sezione 4.4.',
  },
  guru: {
    intro:
      'Ogni operazione è disegnata in cinque fasi sulla griglia p × p: i due operandi; la retta che li unisce (la tangente quando si raddoppia), che si avvolge sul quadrato perché tutto è modulo p; il terzo punto in cui la retta incontra la curva, -R; il suo simmetrico R, che è la somma. In grigio i punti della curva, in blu i multipli di G già calcolati. Passo avanza di una fase alla volta.',
    vizNote: (primes) => `L’animazione usa la curva e la chiave scelte in 1.1 (p = ${primes.join(' o ')}): su griglie più grandi non si leggerebbe nulla.`,
    methodLabel: 'Algoritmo',
    methodRepeated: 'Somma ripetuta: G, 2G, ..., kG',
    methodDouble: 'Double-and-add',
    speedLabel: 'Velocità',
    play: 'Avvia',
    pause: 'Pausa',
    step: 'Passo',
    reset: 'Ricomincia',
    bitsLabel: 'Bit di k',
    phases: {
      operands: 'gli operandi',
      line: 'la retta che li unisce',
      third: 'il terzo punto di intersezione',
      reflect: 'il simmetrico',
      result: 'il risultato',
    },
    progress: (i, n, phase) => `Operazione ${i} di ${n}, ${phase}`,
    caption: (op, phase) => {
      if (!op) return '';
      const m = `${op.multiple}G`;
      if (op.op === 'load') return `${m} = G: si parte da G = ${fmtPoint(op.result)}.`;
      if (op.kind === 'identity' && op.op === 'double') {
        return `R è il punto all’infinito, e 2·O = O: anche ${m} = O, perché ${op.multiple} è un multiplo dell’ordine di G.`;
      }
      if (op.kind === 'identity') {
        return `R è il punto all’infinito, l’elemento neutro: O + G = G, quindi ${m} = G = ${fmtPoint(op.result)} e i multipli ricominciano da capo.`;
      }
      let head;
      if (op.vertical) {
        head = op.kind === 'double'
          ? `Raddoppio di ${fmtPoint(op.P)}: con y = 0 la tangente è verticale`
          : `${fmtPoint(op.P)} + ${fmtPoint(op.Q)}: i due punti sono opposti e la retta è verticale`;
      } else {
        head = op.kind === 'double'
          ? `Raddoppio di ${fmtPoint(op.P)}: tangente con λ = ${op.lambda}`
          : `${fmtPoint(op.P)} + ${fmtPoint(op.Q)}: corda con λ = ${op.lambda}`;
      }
      let tail = '';
      if (op.vertical && phase === 'result') tail = `, non c’è un terzo punto affine e ${m} = O`;
      else if (phase === 'third' && op.third) tail = `, che incontra di nuovo la curva in -R = ${fmtPoint(op.third)}`;
      else if ((phase === 'reflect' || phase === 'result') && op.result) tail = `; il simmetrico di -R è R = ${m} = ${fmtPoint(op.result)}`;
      return `${head}${tail}.`;
    },
    done: (k, Q) => `Fatto: Q = ${k}G = ${fmtPoint(Q)}.`,
  },
  stats: {
    intro: (task, facts) => [
      'La consegna chiede di ripetere l’esperimento con valori diversi di k e, se utile, con punti base validi diversi, e di esplorare le proprietà statistiche dei punti ottenuti. Per un punto base G si usano tutti i valori di k da 1 a n - 1, dove n è l’ordine di G: oltre n i punti si ripetono, perché kG dipende solo da k modulo n.',
      `Due avvertenze valgono per tutta la sezione. Primo, i dati non sono un campione casuale ma l’intera popolazione dei multipli: i test sono descrittivi, e un p-value misura quanto la popolazione si discosta da un modello, non un’inferenza su qualcosa di più grande. Secondo, la curva della consegna ha ${facts.order} punti in tutto, e anche usando tutti i punti base insieme le osservazioni sono ${facts.pooledN}. Per questo la sezione 3.2 ripete le stesse analisi su curve con la stessa equazione ma più grandi.`,
      'Ogni analisi ha due test: quello che si farebbe d’istinto, che presuppone osservazioni indipendenti e qui non è valido, e uno esatto, che confronta i dati con insiemi o funzioni casuali che rispettano le stesse simmetrie (simulazioni e permutazioni). Le scelte casuali vengono da un generatore con seme fisso: la pagina, il programma scaricabile e il terminale danno gli stessi numeri.',
    ],
    taskIntro: (task, n) =>
      `Il punto base predefinito qui sono tutti i punti validi insieme: con il solo G = ${fmtPoint(task.G)} della consegna, di ordine ${n}, i valori di k sarebbero ${n - 1}, troppo pochi per qualunque statistica. Il selettore permette di scegliere G o un qualunque altro punto della curva.`,
    extIntro: (exts) => {
      const list = exts.map((e) => `p = ${e.p} (${e.order} punti)`).join(', ');
      const parts = [`Le stesse analisi su curve y² = x³ + 7 più grandi: ${list}.`];
      if (exts.every((e) => e.prime)) {
        parts.push('In tutte il numero di punti è primo: ogni punto diverso da O genera l’intero gruppo, come su secp256k1, e non ci sono sottogruppi di ordini diversi da accorpare.');
      }
      if (exts.every((e) => !e.supersingular && !e.anomalous)) {
        parts.push('Nessuna è supersingolare (#E ≠ p + 1) né anomala (#E ≠ p), i due casi deboli della sezione 4.1.');
      }
      return parts.join(' ');
    },
    fieldLabel: 'Campo F_p',
    baseLabel: 'Punto base',
    pooled: 'tutti i punti base validi, insieme',
    defaultTag: 'predefinito',
    taskTag: 'della consegna',
    orderWord: 'ordine',
    pointsShown: (shown, total) => `Nel selettore ${shown} punti su ${total}: su una curva di ordine primo ognuno genera l’intero gruppo.`,
    summary: (s) =>
      s.pooled
        ? `${s.baseCount} punti base, ognuno con tutti i k da 1 al suo ordine meno uno: N = ${s.N} osservazioni.`
        : `G = ${fmtPoint(s.G)}, di ordine n = ${s.n}: N = ${s.N} osservazioni, una per ogni k da 1 a ${s.n - 1}.`,
    ordersLine: (orders) => `Ordini dei punti base: ${orders.map(([o, c]) => `${c} di ordine ${o}`).join(', ')}.`,
    smallSample: (N) => `Con N = ${N} le analisi che seguono hanno pochissima potenza statistica: i numeri sono riportati per completezza, ognuno con la sua avvertenza.`,
    // the label over a chart, for the bar or the cell under the pointer
    tips: {
      hist: (coord, from, to, count, expected) =>
        `${from === to ? `${coord} = ${from}` : `${coord} da ${from} a ${to}`}: ${count} ${count === 1 ? 'osservazione' : 'osservazioni'} (attese ${IT.approx(expected)})`,
      freq: (coord, from, to, min, max, expected) => {
        const times = (n) => (n === 0 ? 'mai' : n === 1 ? 'una volta' : `${n} volte`);
        const what = from === to ? `${coord} = ${from}: ${times(max)}` : `${coord} da ${from} a ${to}: ${min === max ? times(max) : `da ${min} a ${max} volte`} ciascuno`;
        return `${what} (attese ${IT.approx(expected)})`;
      },
      bit: (coord, b) =>
        b.fraction === null
          ? `bit ${b.bit} di ${coord}: nessun valore osservato`
          : `bit ${b.bit} di ${coord}: quota di 1 = ${IT.num(b.fraction, 3)} su ${b.distinct} valori distinti (attesa ${IT.num(b.expected, 3)})${b.z === null ? '' : `, z = ${IT.num(b.z, 2)}`}`,
      distance: (d, count, expected) => `${d} ${d === 1 ? 'bit cambiato' : 'bit cambiati'}: ${count} ${count === 1 ? 'coppia' : 'coppie'} (attese ${IT.approx(expected)})`,
      correlation: (kBit, coord, bit, phi) => `bit ${kBit} di k, bit ${bit} di ${coord}: ${phi === null ? 'φ non definito (bit costante)' : `φ = ${IT.num(phi, 3)}`}`,
      sac: (kBit, coord, bit, z) => `bit ${kBit} di k invertito, bit ${bit} di ${coord}: ${z === null ? 'non definito' : `z = ${IT.num(z, 2)}`}`,
    },
    distribution: {
      intro: 'Quante volte cade ciascun valore di x e di y. Sulle curve piccole una barra per valore, su quelle grandi una barra per classe di valori consecutivi; la linea tratteggiata è ciò che darebbero valori uniformi in [0, p).',
      chartX: 'Distribuzione di x',
      chartY: 'Distribuzione di y',
      explain: (s) => {
        const ux = s.uniformity.x;
        const uy = s.uniformity.y;
        const yRule = s.p % 3 === 2
          ? 'per p ≡ 2 (mod 3) ogni y è possibile, perché x → x³ è biiettiva'
          : `per p ≡ 1 (mod 3) y è possibile solo se y² - ${s.b} è un cubo modulo p, circa un valore su tre`;
        return [
          `Le x osservate sono ${ux.observedValues} valori distinti su ${s.p}, le y ${uy.observedValues}. Non tutti i valori possono comparire: x è l’ascissa di un punto solo se x³ + ${s.b} è un quadrato modulo p, cosa che sull’intera curva accade per ${ux.attainable} valori su ${s.p}, circa la metà; le y possibili sono ${uy.attainable}, perché ${yRule}. Le barre vuote non sono sfortuna statistica: sono valori che la funzione non può produrre.`,
        ];
      },
    },
    frequency: {
      intro: 'La frequenza di ogni singolo valore di x e di y: nel grafico per tutte le curve, e in una tabella per quelle piccole.',
      chartX: 'Frequenza per valore di x (tratteggio: N/p)',
      chartY: 'Frequenza per valore di y (tratteggio: N/p)',
      tableTitle: 'Frequenze per valore',
      colValue: 'Valore',
      colX: 'volte come x',
      colY: 'volte come y',
      tableNote: (p) => `Tutti i ${p} valori di [0, p).`,
      bigNote: (p) => `Con p = ${p} una tabella di ${p} righe non sarebbe leggibile: il grafico mostra ogni valore, e dove una colonna di pixel raccoglie più valori ne mostra il massimo.`,
      explain: (s) => {
        const ux = s.uniformity.x;
        const uy = s.uniformity.y;
        const m = s.correlation.mirror;
        if (s.pooled) {
          return [
            `Accorpando punti base di ordini diversi i valori compaiono un numero variabile di volte (x da ${ux.minMult} a ${ux.maxMult}, y da ${uy.minMult} a ${uy.maxMult}): i punti dei sottogruppi grandi sono contati più spesso. Dentro ogni sottogruppo valgono le regole del punto base singolo: x a coppie, y singole o a terne.`,
          ];
        }
        const out = [];
        out.push(ux.sameMultiplicity && ux.maxMult === 2
          ? `Ogni x osservata compare esattamente 2 volte: kG e (n - k)G = -kG sono punti opposti, (x, y) e (x, -y), con la stessa x. Accade in ${m.matches} coppie su ${m.pairs}.`
          : `Le x compaiono da ${ux.minMult} a ${ux.maxMult} volte: le coppie kG e (n - k)G = -kG hanno sempre la stessa x (${m.matches} coppie su ${m.pairs}), e un punto con y = 0, se c’è, è opposto a se stesso e compare una volta sola.`);
        out.push(s.p % 3 === 2
          ? `Con p ≡ 2 (mod 3), come p = ${s.p}, la mappa x → x³ è biiettiva: per ogni y esiste una sola x con x³ = y² - ${s.b}, quindi ogni y compare al più una volta (qui da ${uy.minMult} a ${uy.maxMult}).`
          : `Con p ≡ 1 (mod 3), come p = ${s.p}, l’equazione x³ = y² - ${s.b} ha zero, una o tre soluzioni, e le tre sono x, βx e β²x, con β radice cubica dell’unità modulo p. Per questo le y compaiono una o tre volte (qui da ${uy.minMult} a ${uy.maxMult}): un’altra struttura che una funzione casuale non avrebbe. Su secp256k1, dove pure p ≡ 1 (mod 3), la mappa (x, y) → (βx, y) è l’endomorfismo usato per accelerare i calcoli, e torna nella sezione 4.2.`);
        return out;
      },
    },
    bits: {
      intro: 'Per ogni posizione di bit, la quota di 1 fra i valori distinti di x e di y. La linea tratteggiata è la quota attesa per un insieme casuale della stessa dimensione e con le stesse simmetrie dei valori osservati: per i bit alti è sotto 1/2 perché p non è una potenza di 2.',
      chartX: 'Bit di x: quota di 1 per posizione',
      chartY: 'Bit di y: quota di 1 per posizione',
      explain: (s) => {
        const Dx = s.bits.x[0].distinct;
        const Dy = s.bits.y[0].distinct;
        const out = [
          `Le quote sono calcolate sui valori distinti (${Dx} per x, ${Dy} per y): i valori ripetuti non portano informazione nuova, si ripetono per ragioni algebriche. Il riferimento è lo stesso del test di uniformità esatto (sezione d): insiemi scelti a caso fra quelli con le stesse simmetrie, per i quali media e varianza di ogni quota si calcolano esattamente. Lo z-score quindi non presuppone osservazioni indipendenti.`,
        ];
        const describe = (b, c) => (b ? `il bit ${b.bit} di ${c} (z = ${IT.num(b.z, 2)})` : `nessun bit di ${c}`);
        out.push(`Gli scarti più grandi dall’atteso sono ${describe(worstBit(s.bits.x), 'x')} e ${describe(worstBit(s.bits.y), 'y')}; oltre |z| = 3 ci sono ${bitsBeyond(s)} bit su ${2 * s.bitLength}.`);
        const fixedY = s.bits.y.filter((b) => b.fixed).map((b) => b.bit);
        if (Dy === s.p) {
          out.push('Per y compaiono tutti i p valori: le quote sono per forza quelle dell’intero [0, p), e non c’è nulla da misurare.');
        } else if (fixedY.length && s.uniformity.y.symmetry === 'pairs') {
          const t = trailingOnes(s.p);
          const which = fixedY.length === 1 ? `Il bit ${fixedY[0]} di y è fissato` : `I bit di y da ${fixedY[0]} a ${fixedY[fixedY.length - 1]} sono fissati`;
          out.push(`${which} dalla simmetria: y e p - y compaiono sempre insieme, e p = ${s.p} in binario è ${s.p.toString(2)}, che finisce con ${t === 1 ? 'una cifra 1' : `${t} cifre 1`}, quindi ${t === 1 ? 'l’ultima cifra' : `le ultime ${t} cifre`} di p - y sono il complemento di quelle di y. Qualunque insieme con questa simmetria ha lì esattamente metà di 1: per quei bit lo z-score non esiste.`);
        }
        return out;
      },
    },
    uniformity: {
      intro: 'Il test χ² confronta i conteggi con quelli di valori uniformi in [0, p), su classi di valori consecutivi: le più numerose possibili (una per valore sulle curve piccole, al più 32 su quelle grandi) purché ognuna attenda almeno 5 osservazioni. Due versioni, una accanto all’altra: quella che si farebbe d’istinto, su tutte le osservazioni e con la distribuzione χ² come riferimento, e quella esatta, sui valori distinti confrontati con insiemi casuali che hanno le stesse simmetrie.',
      coordTitle: (c) => `Coordinata ${c}`,
      naiveLabel: 'Test ingenuo: tutte le osservazioni',
      distinctLabel: 'Test esatto: valori distinti',
      status: {
        valid: 'VALIDO',
        descriptive: 'DESCRITTIVO',
        invalid: 'NON VALIDO',
        na: 'NON CALCOLABILE',
      },
      statusHelp: {
        valid: 'Le ipotesi del test sono rispettate.',
        descriptive: 'Test esatto, ma i dati sono la popolazione intera: il risultato descrive, non generalizza.',
        invalid: 'Il numero è calcolato, ma le ipotesi del test non reggono: non va usato per concludere.',
        na: 'Il test non si può calcolare.',
      },
      line: (t) =>
        t.exact
          ? `χ² = ${IT.num(t.chi2, 2)} su ${t.bins} classi${t.perValue ? ', una per valore' : ''}; p-value esatto ${IT.pval(t.pValue)}, dal confronto con ${t.sims} insiemi casuali.`
          : `χ² = ${IT.num(t.chi2, 2)} con ${count(t.df, 'grado', 'gradi')} di libertà su ${t.bins} classi${t.perValue ? ', una per valore' : ''}; minimo atteso per classe ${IT.num(t.minExpected, 2)}; p-value ${IT.pval(t.pValue)} secondo la distribuzione χ².`,
      reasons: {
        'small-sample': (t) =>
          t.computable
            ? `Con N = ${t.N} osservazioni nemmeno due classi arrivano a 5 osservazioni attese: l’approssimazione χ² non regge.`
            : `Con N = ${t.N} non c’è nulla da confrontare.`,
        duplicates: (t, u) =>
          `Le osservazioni non sono indipendenti: ogni valore compare ${u.sameMultiplicity ? `esattamente ${u.maxMult} volte` : `da ${u.minMult} a ${u.maxMult} volte`} per ragioni algebriche, quindi i conteggi sono multipli fissi e la statistica è gonfiata all’incirca di quel fattore.`,
        exhaustive: (t) =>
          t.exact
            ? 'I dati sono l’intera popolazione, non un campione. Il riferimento è la stessa costruzione fatta a caso: insiemi con lo stesso numero di valori e le stesse simmetrie, estratti senza reinserimento. Il p-value è la quota di questi insiemi con una statistica almeno altrettanto lontana dall’uniforme: esatto a meno dell’errore Monte Carlo, senza approssimazione χ² e senza ipotesi di indipendenza.'
            : 'I dati sono l’intera popolazione dei multipli, non un campione casuale: il p-value descrive quanto la popolazione si discosta dall’uniforme, non è un’inferenza su qualcosa di più grande.',
        orbits: (t) =>
          t.symmetry === 'pairs'
            ? 'Le y arrivano a coppie: il sottogruppo contiene -P con ogni P, quindi y e p - y compaiono sempre insieme. Anche gli insiemi casuali di riferimento sono fatti di coppie {y, p - y}.'
            : 'Le x arrivano a terne: per p ≡ 1 (mod 3), con (x, y) è sulla curva anche (βx, y), dove β è una radice cubica dell’unità, quindi x, βx e β²x compaiono insieme. Anche gli insiemi casuali di riferimento sono fatti di terne.',
        'low-power': (t) => `Con soli ${t.N} valori distinti il test è esatto ma non ha potenza: non riuscirebbe a rifiutare nemmeno un insieme chiaramente non uniforme.`,
        'all-values': (t, u, s) => `Compaiono tutti i ${s.p} valori di [0, p): l’insieme dei valori distinti è uniforme per costruzione e non resta nulla da verificare.`,
      },
      verdict: (t) => {
        if (t.tooRegular) return `Lettura: la statistica è più piccola di quanto darebbe quasi ogni insieme di riferimento (coda sinistra ${IT.pval(t.leftTail)}): i valori sono distribuiti fra le classi in modo più regolare del caso. Fra più test un valore così può capitare: va confrontato con le altre curve.`;
        if (t.verdict === 'reject') return `Lettura: uno scarto così grande è raro fra gli insiemi di riferimento (p-value ${IT.pval(t.pValue)}): a livello di classi i valori non sembrano uniformi.`;
        return `Lettura: uno scarto così è del tutto normale fra gli insiemi di riferimento (p-value ${IT.pval(t.pValue)}): a livello di classi i valori sembrano uniformi.`;
      },
      noVerdict: 'Lettura: nessuna conclusione, il test non è valido per i motivi sopra.',
      why: (s, coord) => {
        const u = s.uniformity[coord];
        const d = u.distinct;
        if (!d.computable) return null;
        if (d.reasons.includes('low-power')) {
          return `Il limite vero è la dimensione: ${u.observedValues} valori distinti sono troppo pochi per qualunque test di uniformità. Il risultato non dice che la funzione sia uniforme, né che non lo sia.`;
        }
        if (d.verdict === 'reject') {
          return `I valori possibili sono vincolati dalla curva (${u.attainable} su ${s.p}) e il sottogruppo ne copre una parte non distribuita in modo uniforme.`;
        }
        const share = coord === 'x' ? 'circa metà' : s.p % 3 === 2 ? 'tutti' : 'circa un terzo';
        return `Perché sembra uniforme: i valori raggiungibili, ${share} di [0, p), sono sparsi sull’intervallo come un insieme casuale con le stesse simmetrie. La struttura non sta in dove cadono ma in quali sono possibili, in quante volte compaiono (coppie e terne) e nelle simmetrie stesse: cose che un test a classi non vede, e che il test ingenuo scambia per mancanza di uniformità.`;
      },
    },
    correlation: {
      intro: 'Due livelli. Sui valori: la correlazione di Pearson (lineare) e di Spearman (sui ranghi) fra k e le coordinate del punto. Sui bit: per ogni bit di k e ogni bit di x e di y, il coefficiente φ, cioè Pearson su variabili 0/1. Se l’uscita non dipendesse da k, ogni φ avrebbe deviazione standard esattamente 1/√(N - 1): |φ| > 3/√(N - 1) è insolito, ma su molte celle qualcuna lo supera per caso.',
      colMeasure: 'Misura',
      colValue: 'Valore',
      rows: {
        pearsonKX: 'Pearson r(k, x)',
        pearsonKY: 'Pearson r(k, y)',
        spearmanKX: 'Spearman ρ(k, x)',
        spearmanKY: 'Spearman ρ(k, y)',
        mirror: 'x(kG) = x((n - k)G)',
        homomorphism: '(k1 + k2)G = k1G + k2G',
      },
      pairsValue: (m) => `${m.matches} coppie su ${m.pairs}`,
      trialsValue: (h) => `vera in ${h.holds} prove su ${h.trials}`,
      undefinedWhy: 'n/d vuol dire non definita: servono almeno 3 valori e variabili non costanti.',
      heatmapTitle: (range) => `φ fra i bit di k (righe) e i bit di x e di y (colonne): rosso positivo, blu negativo, grigio non definito. La scala va da -${IT.short(range)} a +${IT.short(range)}, circa 4/√N.`,
      kBits: 'bit di k',
      explain: (s) => {
        const c = s.correlation;
        const b = c.bits;
        const out = [];
        const symmetricK = !s.pooled || (s.orders && s.orders.length === 1);
        if (c.pearsonKX !== null && symmetricK && c.mirror.pairs > 0 && c.mirror.matches === c.mirror.pairs) {
          out.push(`r(k, x) = ${IT.num(c.pearsonKX)} e ρ(k, x) = ${IT.num(c.spearmanKX)} non indicano indipendenza: x è una funzione simmetrica di k, perché x(kG) = x((n - k)G), e la correlazione fra k e una sua funzione simmetrica rispetto a n/2 è zero per costruzione, lineare o sui ranghi. Eppure x è completamente determinata da k: correlazione nulla non vuol dire indipendenza.`);
        }
        if (!b.defined) {
          out.push('Nessuna cella della matrice è definita: con così pochi valori ogni bit è costante.');
          return out;
        }
        out.push(`Matrice bit a bit: |φ| massimo ${IT.num(b.maxAbs)}, medio ${IT.num(b.meanAbs)}, soglia 3/√(N - 1) = ${IT.num(b.threshold)}. Celle oltre la soglia: ${b.above} su ${b.defined}, contro ${IT.num(b.expectedAbove, 1)} in media sulle permutazioni del test.`);
        if (b.pValue !== null) {
          out.push(`Test globale per permutazione: la statistica N·Σφ² = ${IT.num(b.statistic, 1)} è confrontata con quella di ${b.sims} riassegnazioni casuali delle uscite ai valori di k, che rompono ogni legame fra ingresso e uscita lasciando invariate tutte le altre proprietà dei dati. P-value esatto, a meno dell’errore Monte Carlo: ${IT.pval(b.pValue)}.`);
        }
        if (s.pooled && b.maxAbs === 0) {
          out.push('Tutte le φ sono esattamente zero, per costruzione: su una curva di ordine primo, accorpando tutti i punti base, per ogni k i punti kG percorrono l’intero gruppo, quindi la distribuzione dell’uscita non dipende affatto da k. È un’indipendenza che viene dalla media su tutti i G, non dalla funzione k → kG per un G fissato.');
        } else if (s.pooled && b.pValue !== null && b.pValue < 0.05) {
          out.push('Il test rifiuta l’indipendenza, ma per un motivo che riguarda l’accorpamento e non k → kG: con sottogruppi di ordini diversi, i k grandi esistono solo nei sottogruppi grandi, che contengono punti diversi, quindi i bit alti di k dicono da quale sottogruppo viene il punto.');
        } else if (b.pValue !== null && b.pValue < 0.05) {
          out.push('Il test rifiuta l’indipendenza: su un gruppo così piccolo la struttura dei multipli si vede anche a livello di singoli bit.');
        } else if (b.pValue !== null) {
          out.push('Il test non trova legami fra singoli bit: a livello di bit k e kG sembrano indipendenti, anche se kG è una funzione deterministica e fortemente strutturata di k. È il limite di queste misure: vedono solo dipendenze lineari fra coppie di bit.');
        }
        if (s.smallSample) out.push(`Con N = ${s.N} queste stime sono molto instabili.`);
        return out;
      },
    },
    avalanche: {
      intro: 'Si inverte un bit di k e si contano i bit di x e di y che cambiano. Ogni coppia {k, k con il bit invertito} è contata una volta sola, e solo se entrambi i valori stanno fra 1 e n - 1. Per una funzione di hash ideale ogni bit d’uscita cambierebbe con probabilità 1/2; qui l’uscita è un valore in [0, p), quindi il riferimento ideale per ciascun bit è 2q(1 - q), dove q è la quota di 1 attesa per quel bit fra valori uniformi in [0, p).',
      chartTitle: 'Bit d’uscita cambiati invertendo un bit di k: quante coppie per ogni numero di bit (tratteggio: riferimento ideale)',
      heatmapTitle: () => 'Matrice di valanga: per ogni bit di k invertito (righe) e ogni bit di x e di y (colonne), quanto la frequenza di cambio si scosta da quella delle funzioni di riferimento del test esatto, in deviazioni standard. Rosso: cambia più spesso; blu: meno spesso. La scala va da -4 a +4.',
      kBits: 'bit di k invertito',
      none: 'Dentro il sottogruppo non ci sono due valori di k che differiscano di un solo bit: l’effetto valanga non è misurabile.',
      naiveLabel: 'Test ingenuo: misure indipendenti',
      exactLabel: 'Test esatto: funzioni con la stessa simmetria',
      naiveLine: (a) =>
        `Σz² = ${IT.num(a.naive.z2, 1)} su ${count(a.naive.cells, 'cella', 'celle')} contro il riferimento ideale; celle oltre 3σ: ${a.naive.above}, attese ${IT.num(a.naive.expectedAbove, 1)}; p-value ${IT.pval(a.naive.pValue)} secondo la distribuzione χ².`,
      naiveReasons: (s) => [
        `Le misure non sono indipendenti. La coppia {kG, (k + 2^i)G} e la sua speculare {(n - k - 2^i)G, (n - k)G} = {-(k + 2^i)G, -kG} hanno le stesse x, e nel ${IT.pct(s.avalanche.mirrorShareAll)} dei casi vengono contate entrambe: la stessa misura entra due volte. In più, coppie diverse condividono un punto.`,
        'Il riferimento 2q(1 - q) vale per valori uniformi in [0, p), mentre le uscite sono punti della curva: non tutti i valori sono possibili.',
        s.pooled ? 'Accorpando i punti base, le stesse coppie di punti ricompaiono per molti G diversi.' : null,
      ].filter(Boolean),
      exactLine: (a) =>
        `Σz² = ${IT.num(a.exact.statistic, 1)} su ${count(a.exact.cells, 'cella', 'celle')}, standardizzate con media e deviazione standard di ${a.exact.sims} funzioni di riferimento; celle oltre 3σ: ${a.exact.above}, in media ${IT.num(a.exact.expectedAbove, 1)} per le funzioni di riferimento; p-value esatto ${IT.pval(a.exact.pValue)}.`,
      exactReasons: (s) => [
        `Le funzioni di riferimento hanno la stessa immagine, la stessa simmetria f(n - k) = -f(k) e le stesse coppie di k di k → kG: cambia solo, a caso, quale coppia di punti opposti {P, -P} va a quale coppia {k, n - k}, e con che segno${s.pooled ? ', sottogruppo per sottogruppo' : ''}. La dipendenza fra le misure c’è anche nel riferimento, quindi non serve alcuna correzione.`,
        'I dati sono l’intera popolazione delle coppie: il p-value descrive quanto è tipica la matrice osservata fra le funzioni con la stessa struttura.',
      ],
      exactVerdict: (s) => {
        const e = s.avalanche.exact;
        return e.pValue < 0.05
          ? `Lettura: la matrice osservata è più lontana dal riferimento di quasi tutte le funzioni con la stessa struttura (p-value ${IT.pval(e.pValue)}): c’è struttura oltre la simmetria.`
          : `Lettura: la matrice è tipica di una funzione casuale con la stessa simmetria (p-value ${IT.pval(e.pValue)}): a livello di bit, k → kG si comporta come se avesse un effetto valanga.`;
      },
      explain: (s) => {
        const a = s.avalanche;
        if (!a.measurements) return [it.stats.avalanche.none];
        const out = [
          `Su ${a.measurements} coppie cambia in media il ${IT.pct(a.meanFraction)} dei ${a.outputBits} bit d’uscita, contro il ${IT.pct(a.idealMeanFraction)} del riferimento ideale; lo scarto di una cella dall’ideale è al massimo ${IT.num(a.maxDev)}, in media ${IT.num(a.meanDev)}.`,
        ];
        const naive = a.naive.pValue;
        const exact = a.exact.pValue;
        if (exact === null) return out;
        if (naive !== null && naive < 0.05 && exact >= 0.05) {
          out.push(`Il confronto fra i due test è il risultato: quello ingenuo rifiuta (p-value ${IT.pval(naive)}), quello esatto no (p-value ${IT.pval(exact)}). Lo scarto che il test ingenuo vede non è assenza di valanga, ma dipendenza fra le misure: tenendone conto, la matrice è quella di una funzione casuale con la stessa simmetria.`);
        } else if (s.pooled && exact < 0.05) {
          out.push(`Anche il test esatto rifiuta, per un motivo che riguarda l’accorpamento: per k e i fissati, al variare di G la coppia (kG, (k + 2^i)G) è (P, rP) con r = (k + 2^i)/k modulo n, e combinazioni diverse di k e i con lo stesso r danno le stesse coppie di punti in tutti i sottogruppi. Le funzioni di riferimento, rimescolate sottogruppo per sottogruppo, non hanno questa ripetizione.${s.orders && s.orders.length > 1 ? ' Con sottogruppi di ordini diversi, in più, ogni riga mescola gruppi di dimensioni diverse.' : ''}`);
        } else if (exact < 0.05) {
          out.push('Anche il test esatto rifiuta: su un gruppo così piccolo la struttura si vede anche nei bit, perché invertire il bit i di k (da 0 a 1) significa sommare sempre lo stesso punto 2^i·G.');
        }
        if (s.smallSample) out.push(`Con N = ${s.N} queste stime sono molto instabili.`);
        return out;
      },
    },
  },
  discussion: {
    definitions: [
      {
        term: 'Funzione a senso unico.',
        body: 'Una funzione f è a senso unico se si calcola in tempo polinomiale e, per ogni avversario probabilistico polinomiale A, la probabilità che A, dato f(x) per un x casuale, trovi una qualunque preimmagine è trascurabile nel parametro di sicurezza. Nessuna funzione è dimostrata tale: l’esistenza di funzioni a senso unico implicherebbe P ≠ NP. La moltiplicazione scalare k → kG su un gruppo di ordine primo n è un candidato, e la sua sicurezza è un’ipotesi: la difficoltà dell’ECDLP.',
      },
      {
        term: 'Quanto è difficile l’ECDLP.',
        body: 'Gli attacchi generici, baby-step giant-step e rho di Pollard, richiedono circa √n operazioni di gruppo, e nel modello del gruppo generico ne servono almeno Ω(√n) (Shoup, 1997). Per secp256k1 n ≈ 2^256, quindi circa 2^128 operazioni: è il suo livello di sicurezza di 128 bit. Poi ci sono gli attacchi che sfruttano la struttura: Pohlig-Hellman riduce il problema al più grande fattore primo di n; MOV e Frey-Rück lo trasferiscono a un logaritmo discreto nel gruppo moltiplicativo di un’estensione F_(p^m), facile quando il grado di immersione m è piccolo, come sulle curve supersingolari (m ≤ 2 per p > 3); Smart, Satoh-Araki e Semaev lo risolvono in tempo polinomiale sulle curve anomale, quelle con #E = p.',
      },
      {
        term: 'Funzione di hash crittografica.',
        body: 'H: {0,1}* → {0,1}^ℓ comprime ingressi di qualunque lunghezza in un’uscita di lunghezza fissa, con resistenza alla preimmagine, alla seconda preimmagine e alle collisioni (Rogaway e Shrimpton, 2004). In pratica le si chiede anche di comportarsi come un oracolo casuale (Bellare e Rogaway, 1993), un’idealizzazione che nessuna funzione concreta realizza davvero (Canetti, Goldreich e Halevi, 1998). L’effetto valanga (Feistel, 1973) e lo Strict Avalanche Criterion (Webster e Tavares, 1985) sono criteri di progetto necessari a quel comportamento, non definizioni di sicurezza.',
      },
      {
        term: 'Test statistici e sicurezza.',
        body: 'Un test statistico è un distinguitore: superarlo significa solo che quel distinguitore fallisce. Per la pseudocasualità, cioè l’indistinguibilità da valori uniformi per ogni distinguitore efficiente, superare i test è necessario ma mai sufficiente. Per una funzione a senso unico non è né necessario né sufficiente: se g è a senso unico, f(x1, x2) = (g(x1), x2) lo è ancora, pur ricopiando metà dell’ingresso nell’uscita, e f(x) = g(x) ‖ 0 lo è con un bit d’uscita sempre nullo; viceversa una permutazione pubblica, come AES con una chiave nota, supera ogni batteria di test e si inverte in un istante.',
      },
    ],
    propertiesIntro: (T, E) =>
      `Le sei proprietà elencate nella consegna, una per riga: che ruolo hanno per una funzione a senso unico, che ruolo hanno per una funzione di hash, e cosa mostrano i dati di questa pagina. La colonna Osservato usa la curva della consegna con tutti i punti base (N = ${T.N}) e la curva scelta in 3.2 (p = ${E.p}, ${E.pooled ? 'tutti i punti base' : `G = ${fmtPoint(E.G)}`}, N = ${E.N}).`,
    colProperty: 'Proprietà',
    colOwf: 'Funzione a senso unico',
    colHash: 'Funzione di hash',
    colObserved: 'Osservato',
    rows: [
      {
        key: 'distribution',
        name: 'Distribuzione di x e y',
        owf: 'Non richiesta: la definizione chiede solo che invertire sia difficile, e l’uscita può avere qualunque distribuzione, anche concentrata su metà dei valori.',
        hash: 'Richiesta: un’uscita distinguibile dall’uniforme rompe il comportamento da oracolo casuale e riduce l’entropia degli identificativi.',
      },
      {
        key: 'frequency',
        name: 'Frequenza dei singoli valori',
        owf: 'Conta in un caso: un valore molto frequente si inverte scegliendo una qualunque delle sue preimmagini. k → kG è iniettiva su [1, n - 1], quindi ogni punto ha una sola preimmagine.',
        hash: 'Conta la resistenza alle collisioni: nessuna coppia di ingressi con la stessa uscita dev’essere trovabile.',
      },
      {
        key: 'bits',
        name: 'Distribuzione dei bit',
        owf: 'Irrilevante: g(x) ‖ 0 è a senso unico con un bit sempre nullo.',
        hash: 'Ogni bit d’uscita deve valere 1 con probabilità 1/2: un bit sbilanciato è già un distinguitore.',
      },
      {
        key: 'uniformity',
        name: 'Uniformità apparente',
        owf: 'Né necessaria né sufficiente.',
        hash: 'Necessaria, non sufficiente: è la versione a grana grossa dell’indistinguibilità da un oracolo casuale.',
      },
      {
        key: 'correlation',
        name: 'Correlazioni fra ingresso e uscita',
        owf: 'Conta solo una relazione che aiuti a invertire. Qui la struttura c’è (omomorfismo, simmetria), ma per quanto noto vale al più un fattore costante sugli attacchi generici.',
        hash: 'Nessuna correlazione e nessuna relazione algebrica fra uscite di ingressi collegati.',
      },
      {
        key: 'avalanche',
        name: 'Effetto valanga',
        owf: 'Non richiesto: in (g(x1), x2) invertire un bit di x2 cambia un solo bit d’uscita.',
        hash: 'Richiesto come criterio di progetto: ogni bit d’uscita deve cambiare con probabilità 1/2 invertendo un qualunque bit d’ingresso.',
      },
    ],
    observed: {
      distribution: (T, E) =>
        `${T.uniformity.x.observedValues} x distinte su ${T.p} sulla curva della consegna, ${E.uniformity.x.observedValues} su ${E.p} con p = ${E.p}: solo i valori con x³ + ${E.b} quadrato modulo p, circa la metà.`,
      frequency: (T, E) =>
        `Le x collidono a coppie (${E.correlation.mirror.matches} coppie su ${E.correlation.mirror.pairs} con p = ${E.p}), le y ${E.p % 3 === 1 ? 'a terne' : 'mai'}. Il punto intero non si ripete mai per k in [1, n - 1].`,
      bits: (T, E) =>
        `Con p = ${E.p}, ${bitsBeyond(E)} bit su ${2 * E.bitLength} oltre |z| = 3 rispetto a insiemi casuali con le stesse simmetrie; i bit bassi di y sono fissati dalla simmetria y ↔ p - y.`,
      uniformity: (T, E) => {
        const d = E.uniformity.x.distinct;
        const dy = E.uniformity.y.distinct;
        if (!d.computable) return IT.na;
        return `Test esatto sui valori distinti con p = ${E.p}: p-value ${IT.pval(d.pValue)} per x e ${IT.pval(dy.pValue)} per y, rispetto a insiemi casuali con le stesse simmetrie; il test ingenuo, che ignora i valori ripetuti, è non valido. Sulla curva della consegna i valori sono troppo pochi perché un test abbia potenza.`;
      },
      correlation: (T, E) =>
        `r(k, x) = ${IT.num(E.correlation.pearsonKX)} per simmetria; φ bit a bit con p = ${E.p}: ${count(E.correlation.bits.above, 'cella', 'celle')} oltre 3/√(N - 1) su ${E.correlation.bits.defined} (in media ${IT.num(E.correlation.bits.expectedAbove, 1)} per caso), test per permutazione p-value ${IT.pval(E.correlation.bits.pValue)}. Omomorfismo vero in ${E.homomorphism.holds} prove su ${E.homomorphism.trials}.`,
      avalanche: (T, E) => {
        const a = E.avalanche;
        return `Con p = ${E.p} cambia in media il ${IT.pct(a.meanFraction)} dei bit (ideale ${IT.pct(a.idealMeanFraction)}); matrice di valanga: test esatto p-value ${IT.pval(a.exact.pValue)}, contro ${IT.pval(a.naive.pValue)} del test ingenuo, che ignora la dipendenza fra le misure.`;
      },
    },
    propertiesAfter: [
      'Le proprietà che rendono k → kG utile come funzione a senso unico non compaiono nella tabella: il calcolo diretto efficiente (sezione 1.4), la difficoltà dell’inversione (sezione 4.3) e la struttura di gruppo su cui si reggono firme e scambio di chiavi. Nessuna delle sei statistiche le misura.',
      'La struttura osservata non è innocua per principio, ma per quanto noto lo è in pratica. La simmetria P → -P, che produce le x a coppie, e l’automorfismo (x, y) → (βx, y), che produce le y a terne quando p ≡ 1 (mod 3) come su secp256k1, permettono al metodo rho di Pollard di lavorare su classi di 6 punti invece che su singoli punti, con un guadagno di √6 (Duursma, Gaudry e Morain, 1999): su secp256k1 da circa 2^128 a circa 2^127 operazioni. Un guadagno costante, non asintotico: la struttura che le statistiche vedono vale meno di 1,3 bit di sicurezza.',
    ],
    inversion: (ctx) => {
      const out = [
        `Conoscendo solo G e Q, provare G, 2G, 3G, ... trova Q dopo ${ctx.tries} tentativi: k ≡ ${ctx.kmod} (mod ${ctx.n}). È la ricerca esaustiva, che nel caso peggiore costa n tentativi; i metodi generici migliori, baby-step giant-step e rho di Pollard, ne richiedono circa √n, qui ${Math.ceil(Math.sqrt(ctx.n))}.`,
      ];
      const notes = [];
      if (!ctx.nPrime) notes.push(`l’ordine di G, n = ${ctx.nFactors}, non è primo, e Pohlig-Hellman riduce il problema a logaritmi in sottogruppi di ordine primo, il più grande dei quali ha ${ctx.nLargest} elementi`);
      if (ctx.facts.supersingular) notes.push(`la curva è supersingolare (#E = p + 1 = ${ctx.facts.order}), e l’attacco MOV porta il problema nel gruppo moltiplicativo di F_(p²), dove esistono algoritmi subesponenziali`);
      if (ctx.facts.anomalous) notes.push('la curva è anomala (#E = p), e l’attacco di Smart la risolve in tempo polinomiale');
      if (notes.length) out.push(`Sulla curva scelta ci sono anche scorciatoie strutturali: ${notes.join('; ')}. Su una curva giocattolo non servono, ma sono esattamente le ragioni per cui le curve reali hanno ordine primo e grado di immersione grande.`);
      out.push('Su secp256k1 il sottogruppo ha circa 1,16 × 10^77 punti. Anche il metodo rho di Pollard, che richiede circa √n passi invece di n, ne richiederebbe circa 3,4 × 10^38: a 10^12 passi al secondo sono circa 10^19 anni. A rendere la funzione a senso unico sono la dimensione del gruppo e l’assenza di strutture sfruttabili, non la formula, che è la stessa della curva giocattolo.');
      return out;
    },
    inversionInfinity: 'Q = O: non c’è nulla da invertire, k è un multiplo dell’ordine di G.',
    conclusion: [
      'La moltiplicazione scalare su curva ellittica è una funzione a senso unico candidata, non una funzione di hash. Condivide con le funzioni di hash il determinismo, la facilità del calcolo diretto e la difficoltà dell’inversione, ed è questo che la consegna intende con "shares some properties". Ma è una biiezione strutturata: un omomorfismo di gruppi, i cui punti sono circa p fra le p² coppie (x, y) possibili, le cui x coprono circa metà di [0, p) e collidono a coppie. Proprio quella struttura la rende utile: le firme ECDSA e lo scambio di chiavi Diffie-Hellman si reggono sull’omomorfismo. Una funzione di hash con la stessa proprietà sarebbe rotta, perché da H(a) e H(b) si calcolerebbe H(a + b).',
      'Le statistiche lo confermano senza poterlo dimostrare. Con i test esatti, i valori distinti di x e di y sono indistinguibili da insiemi casuali con le stesse simmetrie, i bit sono quelli attesi, la correlazione bit a bit è compatibile con zero e la matrice di valanga è tipica di una funzione casuale con la stessa simmetria. La struttura sta altrove: quali valori sono possibili, quante volte compaiono (coppie e terne), le simmetrie y ↔ p - y e x → βx e l’omomorfismo, vero in ogni prova; e i test ingenui, che ignorano queste dipendenze, la scambiano per mancanza di casualità. Nessuna di queste misure dice quanto sia difficile invertire la funzione: è una proprietà computazionale, non statistica, e sulle curve giocattolo è falsa.',
      'Per questo Ethereum compone le due cose. La chiave pubblica Q = kG viene dalla funzione a senso unico; l’indirizzo sono gli ultimi 20 byte di Keccak-256(x ‖ y), cioè un hash applicato al punto strutturato per ottenere un identificativo corto e uniforme. E la collisione delle x si ritrova nelle firme: ECDSA usa solo r = x(R) mod n, e R e -R hanno la stessa x, quindi (r, s) e (r, n - s) sono entrambe valide. Ethereum blocca questa malleabilità con EIP-2, che accetta solo s ≤ n/2, e aggiunge alla firma il recovery id v, il bit che dice quale dei due punti con quella x usare per ricostruire la chiave pubblica. Allo stesso modo il segreto di uno scambio Diffie-Hellman su curva ellittica passa da una funzione di derivazione di chiave prima di diventare una chiave.',
    ],
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline. Con node homework1.js [k] [p] stampa da terminale la sequenza, la chiave pubblica e le statistiche.',
    contents: 'Contenuto: index.html, style.css, homework1.js (calcoli e statistiche), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework1.zip',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Dalla chiave privata alla chiave pubblica: moltiplicazione scalare su curva ellittica, come in Ethereum.',
    course: 'Statistics, laurea magistrale in Cybersecurity, Sapienza Università di Roma',
    online: 'Versione online',
    noscript: 'Questo programma ha bisogno di JavaScript.',
  },
};

// ---------------------------------------------------------------------------
// ENGLISH
// ---------------------------------------------------------------------------

const EN = formatters('.', 'n/a');

const en = {
  fmt: EN,
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
    task: '1. TASK: from a private key to a public key',
    setup: '1.1 Toy curve, base point and private key',
    addition: '1.2 Point addition',
    multiples: '1.3 G, 2G, 3G, ..., kG',
    fast: '1.4 A faster method for a larger k: double-and-add',
    publicKey: '1.5 The TOY PUBLIC KEY',
    guru: '2. OPTIONAL - GURU LEVEL: the algorithm in slow motion',
    stats: '3. STATISTICAL EXPLORATION',
    statsTask: '3.1 On the assignment’s curve',
    distribution: 'a. Distribution of the x and y coordinates',
    frequency: 'b. Frequency of individual values',
    bits: 'c. Distribution of bits',
    uniformity: 'd. Apparent uniformity',
    correlation: 'e. Correlations between input and output',
    avalanche: 'f. Avalanche effect',
    statsExt: '3.2 Extension: larger toy curves',
    discussion: '4. Discussion: one-way function or hash function?',
    definitions: '4.1 Definitions',
    properties: '4.2 The six properties, one by one',
    inversion: '4.3 Inverting Q: why the toy key is not one-way',
    conclusion: '4.4 Conclusions',
  },
  assignment: {
    intro: (task) => [
      'In Ethereum the private key is an integer k chosen at random between 1 and n - 1, where n ≈ 2^256 is the order of the base point, and the public key is the point Q = kG on the elliptic curve secp256k1, y² = x³ + 7 over a 256-bit prime field. Computing Q from k is fast; recovering k from Q is the Elliptic Curve Discrete Logarithm Problem (ECDLP), for which no efficient algorithm is known.',
      `The assignment asks to show this on a toy curve with the same equation, y² = x³ + ${task.b} (mod ${task.p}), with base point G = ${fmtPoint(task.G)} and private key k = ${task.k}. The page follows it point by point: the TASK (section 1), the optional guru level (section 2), the statistical exploration (section 3) and the final discussion (section 4). The values can be changed; when they are no longer the assignment’s the page says so, and a button restores them.`,
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned.',
  },
  setup: {
    fieldLabel: 'Field F_p',
    baseLabel: 'Base point G',
    keyLabel: 'Private key k',
    orderWord: 'order',
    taskTag: 'from the assignment',
    taskBadge: (task) => `The assignment’s values: y² = x³ + ${task.b} (mod ${task.p}), G = ${fmtPoint(task.G)}, k = ${task.k}.`,
    customBadge: (task) => `Values differ from the assignment, which uses y² = x³ + ${task.b} (mod ${task.p}), G = ${fmtPoint(task.G)} and k = ${task.k}.`,
    restore: 'Restore the assignment’s values',
    kHint: (max) => `An integer from 1 to ${max}.`,
    kError: {
      empty: 'Enter the private key k.',
      notInteger: (t) => `"${t}" is not a positive integer: only the digits 0 to 9 are accepted.`,
      range: (max) => `k must be an integer from 1 to ${max}.`,
      fallback: (k) => `Until the value is valid, the last correct one stays in use, k = ${k}.`,
    },
    curveSummary: (p, b, count, n) =>
      `The curve y² = x³ + ${b} over F_${p} has ${count - 1} affine points plus the point at infinity O, ${count} points in total. G generates a subgroup of ${n} points: kG depends only on k modulo ${n}.`,
    pointsTitle: 'The points of the curve',
    pointsLegend: 'Blue: the multiples of G, that is the subgroup it generates; outlined: G (orange) and the public key Q (red).',
  },
  addition: {
    intro:
      'The group of points is built with the chord-and-tangent rule. To add P = (x1, y1) and Q = (x2, y2), draw the line through them (the tangent when P = Q): it meets the curve at a third point, -R, and the sum is its mirror image across the x axis, R = P + Q. In formulas, modulo p:',
    formulas: (task) => [
      'P ≠ Q:   λ = (y2 - y1) / (x2 - x1)',
      `P = Q:   λ = (3·x1² + a) / (2·y1)        (here a = ${task.a})`,
      'x3 = λ² - x1 - x2        y3 = λ·(x1 - x3) - y1',
      'P + (-P) = O,   P + O = P        (O: point at infinity, the identity)',
    ],
    note: 'Dividing modulo p means multiplying by the modular inverse, computed with the extended Euclidean algorithm. The functions of the program refuse any input that is not a point of the curve, instead of silently returning a wrong result.',
  },
  multiples: {
    intro: 'As the assignment asks, each row adds G to the previous one: k - 1 point additions. Below the table, the same computation as the program prints it, also from a terminal with node homework1.js.',
    colMultiple: 'Multiple',
    colPoint: 'Point',
    colOperation: 'Operation',
    colLambda: 'λ',
    kinds: {
      start: 'starting point',
      add: 'addition (chord)',
      double: 'doubling (tangent)',
      inverse: 'P + (-P) = O (vertical line)',
      identity: 'O + G = G',
    },
    tooMany: (k, limit) => `With k = ${k} it would take ${k - 1} additions: beyond ${limit} the table does not list them, and the computation moves to double-and-add (1.4).`,
    printedTitle: 'Program output',
  },
  fast: {
    intro: (k, bits, steps) =>
      `Write k = ${k} in binary, ${bits}, and read the bits from the left. The first bit, always 1, loads R = G; for every following bit, double R and, if the bit is 1, add G. ${steps - 1} group operations are enough instead of the ${k - 1} of repeated addition: the cost grows with the number of bits of k, not with k. For a 256-bit Ethereum key that is about 383 operations (255 doublings and about 128 additions on average), instead of about 2^256.`,
    colBit: 'Bit of k',
    colOperation: 'Operation',
    colR: 'R',
    colPoint: 'Point',
    ops: { load: 'R = G', double: 'R = 2R', add: 'R = R + G' },
  },
  publicKey: {
    intro: 'The final point, printed as the assignment asks:',
    label: 'TOY PUBLIC KEY',
    infinity: 'Q = O, the point at infinity: k is a multiple of the order of G. O is not a valid public key, which is why in Ethereum the private key is chosen between 1 and n - 1.',
    ethereum: 'In Ethereum the public key is the pair (x, y) of Q, 64 bytes, and the address is the last 20 bytes of its Keccak-256 hash: section 4.4 comes back to it.',
  },
  guru: {
    intro:
      'Each operation is drawn in five phases on the p × p grid: the two operands; the line through them (the tangent when doubling), which wraps around the square because everything is modulo p; the third point where the line meets the curve, -R; its mirror image R, which is the sum. Grey: the points of the curve; blue: the multiples of G computed so far. Step moves one phase at a time.',
    vizNote: (primes) => `The animation uses the curve and the key chosen in 1.1 (p = ${primes.join(' or ')}): larger grids would be unreadable.`,
    methodLabel: 'Algorithm',
    methodRepeated: 'Repeated addition: G, 2G, ..., kG',
    methodDouble: 'Double-and-add',
    speedLabel: 'Speed',
    play: 'Play',
    pause: 'Pause',
    step: 'Step',
    reset: 'Restart',
    bitsLabel: 'Bits of k',
    phases: {
      operands: 'the operands',
      line: 'the line through them',
      third: 'the third intersection',
      reflect: 'the mirror image',
      result: 'the result',
    },
    progress: (i, n, phase) => `Operation ${i} of ${n}, ${phase}`,
    caption: (op, phase) => {
      if (!op) return '';
      const m = `${op.multiple}G`;
      if (op.op === 'load') return `${m} = G: start from G = ${fmtPoint(op.result)}.`;
      if (op.kind === 'identity' && op.op === 'double') {
        return `R is the point at infinity, and 2·O = O: ${m} = O as well, because ${op.multiple} is a multiple of the order of G.`;
      }
      if (op.kind === 'identity') {
        return `R is the point at infinity, the identity: O + G = G, so ${m} = G = ${fmtPoint(op.result)} and the multiples start over.`;
      }
      let head;
      if (op.vertical) {
        head = op.kind === 'double'
          ? `Doubling ${fmtPoint(op.P)}: with y = 0 the tangent is vertical`
          : `${fmtPoint(op.P)} + ${fmtPoint(op.Q)}: the two points are opposite and the line is vertical`;
      } else {
        head = op.kind === 'double'
          ? `Doubling ${fmtPoint(op.P)}: tangent with λ = ${op.lambda}`
          : `${fmtPoint(op.P)} + ${fmtPoint(op.Q)}: chord with λ = ${op.lambda}`;
      }
      let tail = '';
      if (op.vertical && phase === 'result') tail = `, there is no third affine point and ${m} = O`;
      else if (phase === 'third' && op.third) tail = `, which meets the curve again at -R = ${fmtPoint(op.third)}`;
      else if ((phase === 'reflect' || phase === 'result') && op.result) tail = `; the mirror image of -R is R = ${m} = ${fmtPoint(op.result)}`;
      return `${head}${tail}.`;
    },
    done: (k, Q) => `Done: Q = ${k}G = ${fmtPoint(Q)}.`,
  },
  stats: {
    intro: (task, facts) => [
      'The assignment asks to repeat the experiment with different values of k and, if useful, different valid base points, and to explore the statistical properties of the resulting points. For a base point G every k from 1 to n - 1 is used, n being the order of G: beyond n the points repeat, because kG depends only on k modulo n.',
      `Two caveats hold for the whole section. First, the data are not a random sample but the whole population of multiples: the tests are descriptive, and a p-value measures how far the population is from a model, it is not an inference about something larger. Second, the assignment’s curve has ${facts.order} points in total, and even with all base points together there are ${facts.pooledN} observations. This is why section 3.2 repeats the same analyses on curves with the same equation but larger.`,
      'Each analysis has two tests: the one you would run instinctively, which assumes independent observations and is not valid here, and an exact one, which compares the data with random sets or functions that respect the same symmetries (simulations and permutations). The random choices come from a generator with a fixed seed: the page, the downloadable program and the terminal give the same numbers.',
    ],
    taskIntro: (task, n) =>
      `The default base point here is all valid points together: with the assignment’s G = ${fmtPoint(task.G)} alone, of order ${n}, there would be ${n - 1} values of k, too few for any statistic. The selector lets you choose G or any other point of the curve.`,
    extIntro: (exts) => {
      const list = exts.map((e) => `p = ${e.p} (${e.order} points)`).join(', ');
      const parts = [`The same analyses on larger curves y² = x³ + 7: ${list}.`];
      if (exts.every((e) => e.prime)) {
        parts.push('In all of them the number of points is prime: every point other than O generates the whole group, as on secp256k1, and there are no subgroups of different orders to pool.');
      }
      if (exts.every((e) => !e.supersingular && !e.anomalous)) {
        parts.push('None is supersingular (#E ≠ p + 1) or anomalous (#E ≠ p), the two weak cases of section 4.1.');
      }
      return parts.join(' ');
    },
    fieldLabel: 'Field F_p',
    baseLabel: 'Base point',
    pooled: 'all valid base points, together',
    defaultTag: 'default',
    taskTag: 'from the assignment',
    orderWord: 'order',
    pointsShown: (shown, total) => `${shown} points out of ${total} in the selector: on a curve of prime order each one generates the whole group.`,
    summary: (s) =>
      s.pooled
        ? `${s.baseCount} base points, each with every k from 1 to its order minus one: N = ${s.N} observations.`
        : `G = ${fmtPoint(s.G)}, of order n = ${s.n}: N = ${s.N} observations, one for each k from 1 to ${s.n - 1}.`,
    ordersLine: (orders) => `Orders of the base points: ${orders.map(([o, c]) => `${c} of order ${o}`).join(', ')}.`,
    smallSample: (N) => `With N = ${N} the analyses below have very little statistical power: the numbers are reported for completeness, each with its caveat.`,
    // the label over a chart, for the bar or the cell under the pointer
    tips: {
      hist: (coord, from, to, count, expected) =>
        `${from === to ? `${coord} = ${from}` : `${coord} from ${from} to ${to}`}: ${count} ${count === 1 ? 'observation' : 'observations'} (expected ${EN.approx(expected)})`,
      freq: (coord, from, to, min, max, expected) => {
        const times = (n) => (n === 0 ? 'never' : n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);
        const what = from === to ? `${coord} = ${from}: ${times(max)}` : `${coord} from ${from} to ${to}: ${min === max ? times(max) : `from ${min} to ${max} times`} each`;
        return `${what} (expected ${EN.approx(expected)})`;
      },
      bit: (coord, b) =>
        b.fraction === null
          ? `bit ${b.bit} of ${coord}: no value observed`
          : `bit ${b.bit} of ${coord}: share of ones = ${EN.num(b.fraction, 3)} over ${b.distinct} distinct values (expected ${EN.num(b.expected, 3)})${b.z === null ? '' : `, z = ${EN.num(b.z, 2)}`}`,
      distance: (d, count, expected) => `${d} ${d === 1 ? 'bit changed' : 'bits changed'}: ${count} ${count === 1 ? 'pair' : 'pairs'} (expected ${EN.approx(expected)})`,
      correlation: (kBit, coord, bit, phi) => `bit ${kBit} of k, bit ${bit} of ${coord}: ${phi === null ? 'φ not defined (constant bit)' : `φ = ${EN.num(phi, 3)}`}`,
      sac: (kBit, coord, bit, z) => `bit ${kBit} of k flipped, bit ${bit} of ${coord}: ${z === null ? 'not defined' : `z = ${EN.num(z, 2)}`}`,
    },
    distribution: {
      intro: 'How often each value of x and of y occurs. On small curves one bar per value, on large ones one bar per class of consecutive values; the dashed line is what uniform values in [0, p) would give.',
      chartX: 'Distribution of x',
      chartY: 'Distribution of y',
      explain: (s) => {
        const ux = s.uniformity.x;
        const uy = s.uniformity.y;
        const yRule = s.p % 3 === 2
          ? 'for p ≡ 2 (mod 3) every y is possible, because x → x³ is a bijection'
          : `for p ≡ 1 (mod 3) y is possible only if y² - ${s.b} is a cube modulo p, about one value in three`;
        return [
          `The observed x are ${ux.observedValues} distinct values out of ${s.p}, the y ${uy.observedValues}. Not every value can occur: x is the abscissa of a point only if x³ + ${s.b} is a square modulo p, which on the whole curve holds for ${ux.attainable} values out of ${s.p}, about half; the possible y are ${uy.attainable}, because ${yRule}. The empty bars are not statistical bad luck: they are values the function cannot produce.`,
        ];
      },
    },
    frequency: {
      intro: 'The frequency of each individual value of x and of y: in the chart for every curve, and in a table for the small ones.',
      chartX: 'Frequency per value of x (dashed: N/p)',
      chartY: 'Frequency per value of y (dashed: N/p)',
      tableTitle: 'Frequencies per value',
      colValue: 'Value',
      colX: 'times as x',
      colY: 'times as y',
      tableNote: (p) => `All ${p} values of [0, p).`,
      bigNote: (p) => `With p = ${p} a table of ${p} rows would be unreadable: the chart shows every value, and where a pixel column gathers several values it shows their maximum.`,
      explain: (s) => {
        const ux = s.uniformity.x;
        const uy = s.uniformity.y;
        const m = s.correlation.mirror;
        if (s.pooled) {
          return [
            `Pooling base points of different orders, values occur a variable number of times (x from ${ux.minMult} to ${ux.maxMult}, y from ${uy.minMult} to ${uy.maxMult}): the points of large subgroups are counted more often. Within each subgroup the rules of a single base point hold: x in pairs, y single or in triples.`,
          ];
        }
        const out = [];
        out.push(ux.sameMultiplicity && ux.maxMult === 2
          ? `Every observed x occurs exactly twice: kG and (n - k)G = -kG are opposite points, (x, y) and (x, -y), with the same x. It happens in ${m.matches} pairs out of ${m.pairs}.`
          : `The x occur from ${ux.minMult} to ${ux.maxMult} times: the pairs kG and (n - k)G = -kG always share their x (${m.matches} pairs out of ${m.pairs}), and a point with y = 0, if there is one, is its own opposite and occurs once.`);
        out.push(s.p % 3 === 2
          ? `With p ≡ 2 (mod 3), like p = ${s.p}, the map x → x³ is a bijection: for each y there is exactly one x with x³ = y² - ${s.b}, so each y occurs at most once (here from ${uy.minMult} to ${uy.maxMult}).`
          : `With p ≡ 1 (mod 3), like p = ${s.p}, the equation x³ = y² - ${s.b} has zero, one or three solutions, and the three are x, βx and β²x, β being a cube root of unity modulo p. This is why the y occur once or three times (here from ${uy.minMult} to ${uy.maxMult}): another structure a random function would not have. On secp256k1, where p ≡ 1 (mod 3) too, the map (x, y) → (βx, y) is the endomorphism used to speed up computations, and it comes back in section 4.2.`);
        return out;
      },
    },
    bits: {
      intro: 'For each bit position, the share of ones among the distinct values of x and of y. The dashed line is the share expected for a random set of the same size and with the same symmetries as the observed values: for the top bits it is below 1/2 because p is not a power of 2.',
      chartX: 'Bits of x: share of ones per position',
      chartY: 'Bits of y: share of ones per position',
      explain: (s) => {
        const Dx = s.bits.x[0].distinct;
        const Dy = s.bits.y[0].distinct;
        const out = [
          `The shares are computed on the distinct values (${Dx} for x, ${Dy} for y): repeated values carry no new information, they repeat for algebraic reasons. The reference is the same as for the exact uniformity test (section d): sets chosen at random among those with the same symmetries, for which the mean and variance of every share are computed exactly. The z-score therefore assumes no independent observations.`,
        ];
        const describe = (b, c) => (b ? `bit ${b.bit} of ${c} (z = ${EN.num(b.z, 2)})` : `no bit of ${c}`);
        out.push(`The largest deviations from the expectation are ${describe(worstBit(s.bits.x), 'x')} and ${describe(worstBit(s.bits.y), 'y')}; ${count(bitsBeyond(s), 'bit', 'bits')} out of ${2 * s.bitLength} ${bitsBeyond(s) === 1 ? 'is' : 'are'} beyond |z| = 3.`);
        const fixedY = s.bits.y.filter((b) => b.fixed).map((b) => b.bit);
        if (Dy === s.p) {
          out.push('For y all p values occur: the shares are necessarily those of the whole [0, p), and there is nothing to measure.');
        } else if (fixedY.length && s.uniformity.y.symmetry === 'pairs') {
          const t = trailingOnes(s.p);
          const which = fixedY.length === 1 ? `Bit ${fixedY[0]} of y is fixed` : `Bits ${fixedY[0]} to ${fixedY[fixedY.length - 1]} of y are fixed`;
          out.push(`${which} by the symmetry: y and p - y always occur together, and p = ${s.p} is ${s.p.toString(2)} in binary, which ends with ${t === 1 ? 'a 1' : `${t} ones`}, so ${t === 1 ? 'the last digit' : `the last ${t} digits`} of p - y are the complement of those of y. Any set with this symmetry has exactly half ones there: for those bits there is no z-score.`);
        }
        return out;
      },
    },
    uniformity: {
      intro: 'The χ² test compares the counts with those of uniform values in [0, p), over classes of consecutive values: as many as possible (one per value on small curves, at most 32 on large ones) provided each expects at least 5 observations. Two versions, side by side: the one you would run instinctively, on every observation with the χ² distribution as reference, and the exact one, on the distinct values compared with random sets that have the same symmetries.',
      coordTitle: (c) => `Coordinate ${c}`,
      naiveLabel: 'Naive test: every observation',
      distinctLabel: 'Exact test: distinct values',
      status: {
        valid: 'VALID',
        descriptive: 'DESCRIPTIVE',
        invalid: 'NOT VALID',
        na: 'NOT COMPUTABLE',
      },
      statusHelp: {
        valid: 'The assumptions of the test hold.',
        descriptive: 'Exact test, but the data are the whole population: the result describes, it does not generalise.',
        invalid: 'The number is computed, but the assumptions of the test fail: it must not be used to conclude anything.',
        na: 'The test cannot be computed.',
      },
      line: (t) =>
        t.exact
          ? `χ² = ${EN.num(t.chi2, 2)} over ${t.bins} classes${t.perValue ? ', one per value' : ''}; exact p-value ${EN.pval(t.pValue)}, from the comparison with ${t.sims} random sets.`
          : `χ² = ${EN.num(t.chi2, 2)} with ${count(t.df, 'degree', 'degrees')} of freedom over ${t.bins} classes${t.perValue ? ', one per value' : ''}; smallest expected count per class ${EN.num(t.minExpected, 2)}; p-value ${EN.pval(t.pValue)} from the χ² distribution.`,
      reasons: {
        'small-sample': (t) =>
          t.computable
            ? `With N = ${t.N} observations not even two classes reach 5 expected observations: the χ² approximation does not hold.`
            : `With N = ${t.N} there is nothing to compare.`,
        duplicates: (t, u) =>
          `The observations are not independent: each value occurs ${u.sameMultiplicity ? `exactly ${u.maxMult} times` : `${u.minMult} to ${u.maxMult} times`} for algebraic reasons, so the counts are fixed multiples and the statistic is inflated roughly by that factor.`,
        exhaustive: (t) =>
          t.exact
            ? 'The data are the whole population, not a sample. The reference is the same construction done at random: sets with the same number of values and the same symmetries, drawn without replacement. The p-value is the share of these sets whose statistic is at least as far from uniform: exact up to the Monte Carlo error, with no χ² approximation and no assumption of independence.'
            : 'The data are the whole population of multiples, not a random sample: the p-value describes how far the population is from uniform, it is not an inference about something larger.',
        orbits: (t) =>
          t.symmetry === 'pairs'
            ? 'The y come in pairs: the subgroup contains -P with every P, so y and p - y always occur together. The random reference sets are made of pairs {y, p - y} too.'
            : 'The x come in triples: for p ≡ 1 (mod 3), with (x, y) the point (βx, y) is on the curve too, β being a cube root of unity, so x, βx and β²x occur together. The random reference sets are made of triples too.',
        'low-power': (t) => `With only ${t.N} distinct values the test is exact but has no power: it could not reject even a clearly non-uniform set.`,
        'all-values': (t, u, s) => `All ${s.p} values of [0, p) occur: the set of distinct values is uniform by construction and there is nothing left to test.`,
      },
      verdict: (t) => {
        if (t.tooRegular) return `Reading: the statistic is smaller than almost every reference set would give (left tail ${EN.pval(t.leftTail)}): the values are spread over the classes more regularly than chance. Among several tests such a value can happen: compare it with the other curves.`;
        if (t.verdict === 'reject') return `Reading: such a large deviation is rare among the reference sets (p-value ${EN.pval(t.pValue)}): at class level the values do not look uniform.`;
        return `Reading: such a deviation is entirely normal among the reference sets (p-value ${EN.pval(t.pValue)}): at class level the values look uniform.`;
      },
      noVerdict: 'Reading: no conclusion, the test is not valid for the reasons above.',
      why: (s, coord) => {
        const u = s.uniformity[coord];
        const d = u.distinct;
        if (!d.computable) return null;
        if (d.reasons.includes('low-power')) {
          return `The real limit is size: ${u.observedValues} distinct values are too few for any uniformity test. The result says neither that the function is uniform nor that it is not.`;
        }
        if (d.verdict === 'reject') {
          return `The possible values are constrained by the curve (${u.attainable} out of ${s.p}) and the subgroup covers a part of them that is not evenly spread.`;
        }
        const share = coord === 'x' ? 'about half' : s.p % 3 === 2 ? 'all' : 'about a third';
        return `Why it looks uniform: the reachable values, ${share} of [0, p), are spread over the interval like a random set with the same symmetries. The structure is not in where they fall but in which ones are possible, in how many times they occur (pairs and triples) and in the symmetries themselves: things a class-based test does not see, and that the naive test mistakes for a lack of uniformity.`;
      },
    },
    correlation: {
      intro: 'Two levels. On values: the Pearson (linear) and Spearman (rank) correlation between k and the coordinates of the point. On bits: for each bit of k and each bit of x and of y, the φ coefficient, that is Pearson on 0/1 variables. If the output did not depend on k, every φ would have standard deviation exactly 1/√(N - 1): |φ| > 3/√(N - 1) is unusual, but over many cells a few cross it by chance.',
      colMeasure: 'Measure',
      colValue: 'Value',
      rows: {
        pearsonKX: 'Pearson r(k, x)',
        pearsonKY: 'Pearson r(k, y)',
        spearmanKX: 'Spearman ρ(k, x)',
        spearmanKY: 'Spearman ρ(k, y)',
        mirror: 'x(kG) = x((n - k)G)',
        homomorphism: '(k1 + k2)G = k1G + k2G',
      },
      pairsValue: (m) => `${m.matches} pairs out of ${m.pairs}`,
      trialsValue: (h) => `true in ${h.holds} trials out of ${h.trials}`,
      undefinedWhy: 'n/a means not defined: at least 3 values and non-constant variables are needed.',
      heatmapTitle: (range) => `φ between the bits of k (rows) and the bits of x and of y (columns): red positive, blue negative, grey not defined. The scale goes from -${EN.short(range)} to +${EN.short(range)}, about 4/√N.`,
      kBits: 'bits of k',
      explain: (s) => {
        const c = s.correlation;
        const b = c.bits;
        const out = [];
        const symmetricK = !s.pooled || (s.orders && s.orders.length === 1);
        if (c.pearsonKX !== null && symmetricK && c.mirror.pairs > 0 && c.mirror.matches === c.mirror.pairs) {
          out.push(`r(k, x) = ${EN.num(c.pearsonKX)} and ρ(k, x) = ${EN.num(c.spearmanKX)} do not mean independence: x is a symmetric function of k, because x(kG) = x((n - k)G), and the correlation between k and a function of it symmetric about n/2 is zero by construction, linear or on ranks. Yet x is completely determined by k: zero correlation does not mean independence.`);
        }
        if (!b.defined) {
          out.push('No cell of the matrix is defined: with so few values every bit is constant.');
          return out;
        }
        out.push(`Bit matrix: largest |φ| ${EN.num(b.maxAbs)}, mean ${EN.num(b.meanAbs)}, threshold 3/√(N - 1) = ${EN.num(b.threshold)}. Cells beyond the threshold: ${b.above} out of ${b.defined}, against ${EN.num(b.expectedAbove, 1)} on average over the permutations of the test.`);
        if (b.pValue !== null) {
          out.push(`Global permutation test: the statistic N·Σφ² = ${EN.num(b.statistic, 1)} is compared with that of ${b.sims} random reassignments of the outputs to the values of k, which break any link between input and output and leave every other property of the data unchanged. Exact p-value, up to the Monte Carlo error: ${EN.pval(b.pValue)}.`);
        }
        if (s.pooled && b.maxAbs === 0) {
          out.push('Every φ is exactly zero, by construction: on a curve of prime order, pooling all base points, for each k the points kG run over the whole group, so the distribution of the output does not depend on k at all. This independence comes from averaging over every G, not from the map k → kG for a fixed G.');
        } else if (s.pooled && b.pValue !== null && b.pValue < 0.05) {
          out.push('The test rejects independence, but for a reason that concerns the pooling and not k → kG: with subgroups of different orders, large values of k exist only in the large subgroups, which contain different points, so the high bits of k tell which subgroup the point comes from.');
        } else if (b.pValue !== null && b.pValue < 0.05) {
          out.push('The test rejects independence: on such a small group the structure of the multiples shows even at the level of single bits.');
        } else if (b.pValue !== null) {
          out.push('The test finds no link between single bits: at bit level k and kG look independent, even though kG is a deterministic and strongly structured function of k. This is the limit of such measures: they only see linear dependences between pairs of bits.');
        }
        if (s.smallSample) out.push(`With N = ${s.N} these estimates are very unstable.`);
        return out;
      },
    },
    avalanche: {
      intro: 'Flip one bit of k and count how many bits of x and y change. Every pair {k, k with the bit flipped} is counted once, and only if both values lie between 1 and n - 1. For an ideal hash function each output bit would change with probability 1/2; here the output is a value in [0, p), so the ideal reference for each bit is 2q(1 - q), q being the share of ones expected for that bit among uniform values in [0, p).',
      chartTitle: 'Output bits changed by flipping one bit of k: how many pairs for each number of bits (dashed: ideal reference)',
      heatmapTitle: () => 'Avalanche matrix: for each flipped bit of k (rows) and each bit of x and of y (columns), how far the rate of change is from that of the reference functions of the exact test, in standard deviations. Red: changes more often; blue: less often. The scale goes from -4 to +4.',
      kBits: 'flipped bit of k',
      none: 'Inside the subgroup no two values of k differ by a single bit: the avalanche effect cannot be measured.',
      naiveLabel: 'Naive test: independent measurements',
      exactLabel: 'Exact test: functions with the same symmetry',
      naiveLine: (a) =>
        `Σz² = ${EN.num(a.naive.z2, 1)} over ${count(a.naive.cells, 'cell', 'cells')} against the ideal reference; cells beyond 3σ: ${a.naive.above}, expected ${EN.num(a.naive.expectedAbove, 1)}; p-value ${EN.pval(a.naive.pValue)} from the χ² distribution.`,
      naiveReasons: (s) => [
        `The measurements are not independent. The pair {kG, (k + 2^i)G} and its mirror {(n - k - 2^i)G, (n - k)G} = {-(k + 2^i)G, -kG} have the same x, and in ${EN.pct(s.avalanche.mirrorShareAll)} of the cases both are counted: the same measurement enters twice. Moreover, different pairs share a point.`,
        'The reference 2q(1 - q) holds for uniform values in [0, p), while the outputs are points of the curve: not every value is possible.',
        s.pooled ? 'Pooling the base points, the same pairs of points come back for many different G.' : null,
      ].filter(Boolean),
      exactLine: (a) =>
        `Σz² = ${EN.num(a.exact.statistic, 1)} over ${count(a.exact.cells, 'cell', 'cells')}, standardised with the mean and standard deviation of ${a.exact.sims} reference functions; cells beyond 3σ: ${a.exact.above}, ${EN.num(a.exact.expectedAbove, 1)} on average for the reference functions; exact p-value ${EN.pval(a.exact.pValue)}.`,
      exactReasons: (s) => [
        `The reference functions have the same image, the same symmetry f(n - k) = -f(k) and the same pairs of k as k → kG: only which pair of opposite points {P, -P} goes to which pair {k, n - k}, and with which sign, changes at random${s.pooled ? ', subgroup by subgroup' : ''}. The dependence between the measurements is in the reference too, so no correction is needed.`,
        'The data are the whole population of pairs: the p-value describes how typical the observed matrix is among the functions with the same structure.',
      ],
      exactVerdict: (s) => {
        const e = s.avalanche.exact;
        return e.pValue < 0.05
          ? `Reading: the observed matrix is farther from the reference than almost every function with the same structure (p-value ${EN.pval(e.pValue)}): there is structure beyond the symmetry.`
          : `Reading: the matrix is typical of a random function with the same symmetry (p-value ${EN.pval(e.pValue)}): at bit level, k → kG behaves as if it had an avalanche effect.`;
      },
      explain: (s) => {
        const a = s.avalanche;
        if (!a.measurements) return [en.stats.avalanche.none];
        const out = [
          `Over ${a.measurements} pairs, on average ${EN.pct(a.meanFraction)} of the ${a.outputBits} output bits change, against ${EN.pct(a.idealMeanFraction)} for the ideal reference; the deviation of a cell from the ideal is at most ${EN.num(a.maxDev)}, ${EN.num(a.meanDev)} on average.`,
        ];
        const naive = a.naive.pValue;
        const exact = a.exact.pValue;
        if (exact === null) return out;
        if (naive !== null && naive < 0.05 && exact >= 0.05) {
          out.push(`The comparison between the two tests is the result: the naive one rejects (p-value ${EN.pval(naive)}), the exact one does not (p-value ${EN.pval(exact)}). What the naive test sees is not a lack of avalanche but dependence between the measurements: taking it into account, the matrix is that of a random function with the same symmetry.`);
        } else if (s.pooled && exact < 0.05) {
          out.push(`The exact test rejects too, for a reason that concerns the pooling: for fixed k and i, as G varies the pair (kG, (k + 2^i)G) is (P, rP) with r = (k + 2^i)/k modulo n, and different combinations of k and i with the same r give the same pairs of points in every subgroup. The reference functions, shuffled subgroup by subgroup, do not have this repetition.${s.orders && s.orders.length > 1 ? ' With subgroups of different orders, moreover, each row mixes groups of different sizes.' : ''}`);
        } else if (exact < 0.05) {
          out.push('The exact test rejects too: on such a small group the structure shows in the bits as well, because flipping bit i of k (from 0 to 1) always means adding the same point 2^i·G.');
        }
        if (s.smallSample) out.push(`With N = ${s.N} these estimates are very unstable.`);
        return out;
      },
    },
  },
  discussion: {
    definitions: [
      {
        term: 'One-way function.',
        body: 'A function f is one-way if it is computable in polynomial time and, for every probabilistic polynomial-time adversary A, the probability that A, given f(x) for a random x, finds any preimage is negligible in the security parameter. No function is proven to be one: the existence of one-way functions would imply P ≠ NP. Scalar multiplication k → kG on a group of prime order n is a candidate, and its security is an assumption: the hardness of the ECDLP.',
      },
      {
        term: 'How hard the ECDLP is.',
        body: 'Generic attacks, baby-step giant-step and Pollard’s rho, take about √n group operations, and in the generic group model at least Ω(√n) are needed (Shoup, 1997). For secp256k1 n ≈ 2^256, hence about 2^128 operations: its 128-bit security level. Then there are attacks that exploit structure: Pohlig-Hellman reduces the problem to the largest prime factor of n; MOV and Frey-Rück transfer it to a discrete logarithm in the multiplicative group of an extension F_(p^m), easy when the embedding degree m is small, as on supersingular curves (m ≤ 2 for p > 3); Smart, Satoh-Araki and Semaev solve it in polynomial time on anomalous curves, those with #E = p.',
      },
      {
        term: 'Cryptographic hash function.',
        body: 'H: {0,1}* → {0,1}^ℓ compresses inputs of any length into a fixed-length output, with preimage, second-preimage and collision resistance (Rogaway and Shrimpton, 2004). In practice it is also expected to behave like a random oracle (Bellare and Rogaway, 1993), an idealisation no concrete function truly achieves (Canetti, Goldreich and Halevi, 1998). The avalanche effect (Feistel, 1973) and the Strict Avalanche Criterion (Webster and Tavares, 1985) are design criteria needed for that behaviour, not definitions of security.',
      },
      {
        term: 'Statistical tests and security.',
        body: 'A statistical test is a distinguisher: passing it only means that this distinguisher fails. For pseudorandomness, that is indistinguishability from uniform values for every efficient distinguisher, passing the tests is necessary but never sufficient. For a one-way function it is neither necessary nor sufficient: if g is one-way, f(x1, x2) = (g(x1), x2) still is, although it copies half of its input into the output, and so is f(x) = g(x) ‖ 0, with an output bit always zero; conversely a public permutation, such as AES with a known key, passes every test battery and is inverted in an instant.',
      },
    ],
    propertiesIntro: (T, E) =>
      `The six properties listed in the assignment, one per row: their role for a one-way function, their role for a hash function, and what the data on this page show. The Observed column uses the assignment’s curve with all base points (N = ${T.N}) and the curve chosen in 3.2 (p = ${E.p}, ${E.pooled ? 'all base points' : `G = ${fmtPoint(E.G)}`}, N = ${E.N}).`,
    colProperty: 'Property',
    colOwf: 'One-way function',
    colHash: 'Hash function',
    colObserved: 'Observed',
    rows: [
      {
        key: 'distribution',
        name: 'Distribution of x and y',
        owf: 'Not required: the definition only asks that inversion be hard, and the output may have any distribution, even one concentrated on half of the values.',
        hash: 'Required: an output distinguishable from uniform breaks the random-oracle behaviour and lowers the entropy of identifiers.',
      },
      {
        key: 'frequency',
        name: 'Frequency of individual values',
        owf: 'It matters in one case: a very frequent value is inverted by picking any of its preimages. k → kG is injective on [1, n - 1], so each point has exactly one preimage.',
        hash: 'Collision resistance matters: no pair of inputs with the same output may be findable.',
      },
      {
        key: 'bits',
        name: 'Distribution of bits',
        owf: 'Irrelevant: g(x) ‖ 0 is one-way with a bit always zero.',
        hash: 'Each output bit must be 1 with probability 1/2: an unbalanced bit is already a distinguisher.',
      },
      {
        key: 'uniformity',
        name: 'Apparent uniformity',
        owf: 'Neither necessary nor sufficient.',
        hash: 'Necessary, not sufficient: it is the coarse-grained version of indistinguishability from a random oracle.',
      },
      {
        key: 'correlation',
        name: 'Correlations between input and output',
        owf: 'Only a relation that helps inversion matters. Here the structure is there (homomorphism, symmetry), but as far as we know it is worth at most a constant factor on generic attacks.',
        hash: 'No correlation and no algebraic relation between the outputs of related inputs.',
      },
      {
        key: 'avalanche',
        name: 'Avalanche effect',
        owf: 'Not required: in (g(x1), x2) flipping a bit of x2 changes a single output bit.',
        hash: 'Required as a design criterion: each output bit must change with probability 1/2 when any input bit is flipped.',
      },
    ],
    observed: {
      distribution: (T, E) =>
        `${T.uniformity.x.observedValues} distinct x out of ${T.p} on the assignment’s curve, ${E.uniformity.x.observedValues} out of ${E.p} with p = ${E.p}: only the values with x³ + ${E.b} a square modulo p, about half.`,
      frequency: (T, E) =>
        `The x collide in pairs (${E.correlation.mirror.matches} pairs out of ${E.correlation.mirror.pairs} with p = ${E.p}), the y ${E.p % 3 === 1 ? 'in triples' : 'never'}. The whole point never repeats for k in [1, n - 1].`,
      bits: (T, E) =>
        `With p = ${E.p}, ${count(bitsBeyond(E), 'bit', 'bits')} out of ${2 * E.bitLength} beyond |z| = 3 against random sets with the same symmetries; the low bits of y are fixed by the symmetry y ↔ p - y.`,
      uniformity: (T, E) => {
        const d = E.uniformity.x.distinct;
        const dy = E.uniformity.y.distinct;
        if (!d.computable) return EN.na;
        return `Exact test on the distinct values with p = ${E.p}: p-value ${EN.pval(d.pValue)} for x and ${EN.pval(dy.pValue)} for y, against random sets with the same symmetries; the naive test, which ignores the repeated values, is not valid. On the assignment’s curve the values are too few for a test to have power.`;
      },
      correlation: (T, E) =>
        `r(k, x) = ${EN.num(E.correlation.pearsonKX)} by symmetry; bitwise φ with p = ${E.p}: ${count(E.correlation.bits.above, 'cell', 'cells')} beyond 3/√(N - 1) out of ${E.correlation.bits.defined} (${EN.num(E.correlation.bits.expectedAbove, 1)} on average by chance), permutation test p-value ${EN.pval(E.correlation.bits.pValue)}. Homomorphism true in ${E.homomorphism.holds} trials out of ${E.homomorphism.trials}.`,
      avalanche: (T, E) => {
        const a = E.avalanche;
        return `With p = ${E.p} on average ${EN.pct(a.meanFraction)} of the bits change (ideal ${EN.pct(a.idealMeanFraction)}); avalanche matrix: exact test p-value ${EN.pval(a.exact.pValue)}, against ${EN.pval(a.naive.pValue)} for the naive test, which ignores the dependence between the measurements.`;
      },
    },
    propertiesAfter: [
      'The properties that make k → kG useful as a one-way function are not in the table: efficient forward computation (section 1.4), hard inversion (section 4.3) and the group structure that signatures and key exchange rest on. None of the six statistics measures them.',
      'The observed structure is not harmless in principle, but as far as we know it is in practice. The symmetry P → -P, which produces the x in pairs, and the automorphism (x, y) → (βx, y), which produces the y in triples when p ≡ 1 (mod 3) as on secp256k1, let Pollard’s rho work on classes of 6 points instead of single points, a gain of √6 (Duursma, Gaudry and Morain, 1999): on secp256k1 from about 2^128 to about 2^127 operations. A constant gain, not an asymptotic one: the structure the statistics see is worth less than 1.3 bits of security.',
    ],
    inversion: (ctx) => {
      const out = [
        `Knowing only G and Q, trying G, 2G, 3G, ... finds Q after ${ctx.tries} attempts: k ≡ ${ctx.kmod} (mod ${ctx.n}). This is exhaustive search, which costs n attempts in the worst case; the best generic methods, baby-step giant-step and Pollard’s rho, need about √n, here ${Math.ceil(Math.sqrt(ctx.n))}.`,
      ];
      const notes = [];
      if (!ctx.nPrime) notes.push(`the order of G, n = ${ctx.nFactors}, is not prime, and Pohlig-Hellman reduces the problem to logarithms in subgroups of prime order, the largest of which has ${ctx.nLargest} elements`);
      if (ctx.facts.supersingular) notes.push(`the curve is supersingular (#E = p + 1 = ${ctx.facts.order}), and the MOV attack moves the problem to the multiplicative group of F_(p²), where subexponential algorithms exist`);
      if (ctx.facts.anomalous) notes.push('the curve is anomalous (#E = p), and Smart’s attack solves it in polynomial time');
      if (notes.length) out.push(`The chosen curve also has structural shortcuts: ${notes.join('; ')}. A toy curve does not need them, but they are exactly why real curves have prime order and a large embedding degree.`);
      out.push('On secp256k1 the subgroup has about 1.16 × 10^77 points. Even Pollard’s rho, which needs about √n steps instead of n, would need about 3.4 × 10^38: at 10^12 steps per second that is about 10^19 years. What makes the function one-way is the size of the group and the absence of exploitable structure, not the formula, which is the same as on the toy curve.');
      return out;
    },
    inversionInfinity: 'Q = O: there is nothing to invert, k is a multiple of the order of G.',
    conclusion: [
      'Elliptic-curve scalar multiplication is a candidate one-way function, not a hash function. It shares with hash functions determinism, easy forward computation and hard inversion, which is what the assignment means by "shares some properties". But it is a structured bijection: a group homomorphism, whose points are about p of the p² possible pairs (x, y), whose x cover about half of [0, p) and collide in pairs. That very structure is what makes it useful: ECDSA signatures and Diffie-Hellman key exchange rest on the homomorphism. A hash function with the same property would be broken, since from H(a) and H(b) one could compute H(a + b).',
      'The statistics confirm this without being able to prove it. With the exact tests, the distinct values of x and y are indistinguishable from random sets with the same symmetries, the bits are as expected, the bitwise correlation is compatible with zero and the avalanche matrix is typical of a random function with the same symmetry. The structure lies elsewhere: which values are possible, how many times they occur (pairs and triples), the symmetries y ↔ p - y and x → βx and the homomorphism, true in every trial; and the naive tests, which ignore these dependences, mistake it for a lack of randomness. None of these measures says how hard the function is to invert: that is a computational property, not a statistical one, and on toy curves it is false.',
      'This is why Ethereum combines the two. The public key Q = kG comes from the one-way function; the address is the last 20 bytes of Keccak-256(x ‖ y), a hash applied to the structured point to get a short, uniform identifier. And the collision of the x shows up in signatures: ECDSA only uses r = x(R) mod n, and R and -R share their x, so (r, s) and (r, n - s) are both valid. Ethereum blocks this malleability with EIP-2, which only accepts s ≤ n/2, and adds to the signature the recovery id v, the bit that says which of the two points with that x to use to rebuild the public key. In the same way the secret of an elliptic-curve Diffie-Hellman exchange goes through a key-derivation function before it becomes a key.',
    ],
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: once the archive is extracted, it opens with a double click on index.html, even offline. With node homework1.js [k] [p] it prints the sequence, the public key and the statistics in a terminal.',
    contents: 'Contents: index.html, style.css, homework1.js (computations and statistics), app.js (interface and texts), README.txt.',
    zip: 'Download homework1.zip',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'From a private key to a public key: elliptic-curve scalar multiplication, as in Ethereum.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
    noscript: 'This program needs JavaScript.',
  },
};

export const HW1_TEXTS = { it, en };
