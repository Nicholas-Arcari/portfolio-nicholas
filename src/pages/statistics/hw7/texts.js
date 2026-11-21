// src/pages/statistics/hw7/texts.js
// I testi dell'Homework #7 in italiano e in inglese, per la pagina del sito
// e per il programma scaricabile: le due versioni dicono le stesse cose con
// le stesse parole. Ogni numero arriva dagli argomenti (i risultati dei
// calcoli) o dalle costanti della libreria: nessuna frase contiene un
// risultato scritto a mano.
import { ALARM_DEFAULT, BURST_SECTION, BYTES_REPS, CAMPAIGN, CLT_REPS, COVERAGE_N, COVERAGE_RUNS, DECISION_LEVEL, FALSE_ALARMS, GC_REPS, HASH_TEST, KOLMOGOROV_MEAN, PATHS, PRIORS, SCALE_REPS, SEQUENCE_EPSILON, SIGNIFICANCE, SPRT_DEFAULT, SPRT_RUNS, TARGET_RATE } from './homework7.js';
import { pParts } from './view.js';

/**
 * The assignment as the professor wrote it, block by block: the real text
 * of Homework #7, which replaced a first, shorter one. The only change: its
 * lines, broken in the original, are joined into paragraphs, and the list
 * keeps its items without the dashes in front of them. The rest is as it
 * was written, "LLM" and "satistics" included.
 */
export const originalAssignment = () => [
  { type: 'title', text: '== Modes of Convergence in Probability Theory ==' },
  { type: 'p', text: 'Explain the differences between the main modes of convergence used in probability theory and discuss their respective roles in the Law of Large Numbers (LLN) and the Central Limit Theorem (CLT).' },
  { type: 'p', text: 'For instance' },
  { type: 'list', items: ['Convergence in probability', 'Almost sure convergence (a.s.)', 'Mean-square convergence (quadratic mean or L²)', 'Convergence in distribution'] },
  { type: 'p', text: 'indicating their role in LLM and CLT (or other important results in satistics).' },
  { type: 'p', text: 'Discuss why the term √n frequently appears in convergence theorems, particularly in relation to the additivity of variance under suitable conditions and the role of independence, both in probability theory and statistical inference.' },
  { type: 'title', text: "== Conditional Probability, Bayes' Theorem and Statistical Inference ==" },
  { type: 'p', text: "Conditional probability in both probability theory and statistics and Bayes' Theorem. Understand the role and relationship between the 3 fundamental components of Bayesian inference: Prior probability,Likelihood, Posterior probability. Explain how Bayes' Theorem obtain posterior probabilities, and why this updating process plays a central role in a part of (Bayesian) statistical inference." },
  { type: 'p', text: 'Do some examples of the use of prior probabilities and likelihood functions, discussing their applications, advantages and limitations and their influence on statistical conclusions.' },
];

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
  // a probability that may be tiny: four decimals, then a power of ten
  const prob = (v, digits = 4) => (missing(v) ? na : v === 0 ? '0' : v >= 10 ** -digits ? num(v, digits) : sci(v, 2));
  return {
    decimal,
    na,
    int: (v) => (missing(v) ? na : `${v < 0 ? '-' : ''}${group(String(Math.round(Math.abs(Number(v)))))}`),
    num,
    sci,
    prob,
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
    // a percentage that may be very small: as many decimals as it takes, up to 4, then a power of ten
    pctSmall: (v) => {
      if (missing(v)) return na;
      if (v === 0) return '0%';
      const x = 100 * v;
      if (x >= 1) return `${local(x.toFixed(1))}%`;
      if (x >= 0.01) return `${local(x.toFixed(2))}%`;
      return `${sci(x, 1)}%`;
    },
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

/** A list in words: a, b and c. */
const listOf = (items, and) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`);

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', '×');

// the article before a number: elided when the number is read with a vowel (1, 8, 11, 80...): l’8%, all’11,2%, dell’1%
const vowelNumber = (text) => {
  const whole = text.replace(/^[-+]/, '').split(/[,%\s]/)[0].replace(/\./g, '');
  return whole === '1' || whole === '11' || whole.startsWith('8');
};
const ELIDED = { il: 'l’', al: 'all’', del: 'dell’', dal: 'dall’', sul: 'sull’', nel: 'nell’' };
const art = (prep, text) => (vowelNumber(text) ? `${ELIDED[prep]}${text}` : `${prep} ${text}`);

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
    another: 'Altro campione',
    reset: 'Ricomincia',
    yes: 'sì',
    no: 'no',
  },
  sections: {
    assignment: '0. La consegna',
    convergence: '1. Le forme di convergenza nella teoria della probabilità',
    probability: '1.1 In probabilità',
    almost: '1.2 Quasi certa',
    trySequences: 'Prova: traiettorie e controesempi',
    l2: '1.3 In media quadratica (L²)',
    distribution: '1.4 In distribuzione',
    tryClt: 'Prova: il limite centrale dal vivo',
    tryHash: 'Prova: collisioni di hash',
    map: '1.5 Come si legano: la mappa delle implicazioni',
    tryMap: 'Prova: la mappa',
    roles: '1.6 Il ruolo nella legge dei grandi numeri e nel limite centrale',
    results: '1.7 Altri risultati: consistenza, Slutsky, metodo delta, Glivenko-Cantelli, MLE',
    root: '1.8 Perché √n: la varianza che si somma',
    tryScale: 'Prova: la scala giusta',
    bursts: '1.9 Senza indipendenza: allarmi a raffica',
    tryBursts: 'Prova: allarmi a raffica',
    heavy: '1.10 Quando √n non basta: le code pesanti',
    speed: '1.11 Quanto in fretta: Chebyshev, Hoeffding, Berry-Esseen',
    bayes: '2. Probabilità condizionata, teorema di Bayes e inferenza statistica',
    conditional: '2.1 La probabilità condizionata, in probabilità e in statistica',
    tryPvalue: 'Prova: p-value e P(H0 | dati)',
    engine: '2.2 Il teorema di Bayes: prior, verosimiglianza, posterior',
    alarm: '2.3 Un allarme dell’IDS e il tasso di base',
    tryAlarm: 'Prova: l’allarme regolabile',
    network: '2.4 Una rete bayesiana per il triage',
    tryNetwork: 'Prova: spiegare via',
    sprt: '2.5 Quando bloccare un IP: il test sequenziale di Wald',
    trySprt: 'Prova: bloccare un IP',
    rate: '2.6 Stimare un tasso: chi clicca il phishing',
    tryBelief: 'Prova: la credenza dal vivo',
    tryPrior: 'Prova: disegnate il prior',
    frequentist: '2.7 Bayes e frequentisti: credibilità e confidenza',
    spam: '2.8 Il filtro antispam: naive Bayes su SMS veri',
    kdd: '2.9 Lo stesso motore su NSL-KDD',
    limits: '2.10 Vantaggi, limiti e influenza del prior sulle conclusioni',
    bvm: '2.11 Il posterior converge: Bernstein-von Mises',
    checks: '3. Verifiche',
    tests: '4. Riepilogo dei test statistici',
    history: '5. Contesto storico',
    conclusion: '6. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna ha due parti. La prima chiede di spiegare le differenze fra i principali modi di convergenza della teoria della probabilità (in probabilità, quasi certa, in media quadratica, in distribuzione), il loro ruolo nella legge dei grandi numeri, nel teorema del limite centrale e in altri risultati importanti della statistica, e perché nei teoremi di convergenza compare così spesso √n, in relazione all’additività della varianza e al ruolo dell’indipendenza, in probabilità e nell’inferenza. La seconda chiede la probabilità condizionata, in probabilità e in statistica, il teorema di Bayes e il ruolo e il rapporto delle tre componenti dell’inferenza bayesiana, prior, verosimiglianza e posterior: come il teorema produce i posterior, perché questo aggiornamento è centrale, ed esempi d’uso di prior e verosimiglianze con applicazioni, vantaggi, limiti e influenza sulle conclusioni.',
      'La pagina segue quest’ordine. La sezione 1 definisce e mostra i quattro modi nell’ordine del testo (da 1.1 a 1.4), li lega in una mappa delle implicazioni (1.5), ne riassume il ruolo nella legge dei grandi numeri e nel limite centrale (1.6) e in altri risultati della statistica: la consistenza degli stimatori, il teorema di Slutsky e il metodo delta, Glivenko-Cantelli, la normalità dello stimatore di massima verosimiglianza (1.7). Poi spiega √n: la varianza che si somma grazie all’indipendenza (1.8), che cosa succede senza (1.9), quando √n non basta (1.10) e quanto in fretta si converge (1.11). La sezione 2 parte dalla probabilità condizionata, con la catena di un attacco, l’indipendenza condizionata e la differenza fra un p-value e la probabilità di H0 (2.1); presenta il teorema di Bayes e le sue tre componenti (2.2); le mette al lavoro su esempi di sicurezza informatica, dall’allarme di un IDS a due filtri naive Bayes su dati veri (da 2.3 a 2.9); ne discute vantaggi, limiti e influenza del prior sulle conclusioni (2.10) e chiude con il posterior che converge, il ponte fra le due parti (2.11). Seguono le verifiche dei calcoli, il riepilogo dei test, il contesto storico e le conclusioni.',
      'Dodici riquadri «Prova» lasciano mettere le mani sui numeri: le traiettorie dei controesempi, il limite centrale dal vivo, le collisioni di hash, la mappa delle implicazioni, la scala giusta per n, gli allarmi a raffica, il p-value contro P(H0 | dati), un allarme da regolare, gli indizi di una rete, un indirizzo da bloccare, una credenza che si aggiorna a ogni e-mail e un prior da disegnare. Tutti i numeri sono calcolati nel browser, e il programma scaricabile stampa gli stessi.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese; le righe spezzate dell’originale sono unite in paragrafi.',
  },
  bayes: {
    intro: [
      'La seconda parte passa dalla convergenza all’inferenza. La probabilità condizionata dice come cambia una probabilità quando si sa qualcosa; il teorema di Bayes la rovescia, dalla probabilità dei dati date le ipotesi a quella delle ipotesi dati i dati. Usato così è un motore inferenziale, che fa sempre la stessa cosa: prende ciò che si sapeva prima (il prior), lo combina con quanto i dati sono probabili sotto ogni ipotesi (la verosimiglianza) e restituisce ciò che si sa dopo (il posterior). Gli esempi cambiano le ipotesi e i dati, non la regola: un allarme, tre indizi legati fra loro, una serie di tentativi di accesso, una campagna di phishing, le parole di un SMS, i campi di una connessione.',
    ],
  },
  engine: {
    components: 'Dalla definizione di probabilità condizionata, P(H ∩ E) = P(E | H) P(H) = P(H | E) P(E); dividendo per P(E) si ottiene il teorema di Bayes. Le sue tre componenti hanno ruoli diversi. Il prior P(H) è ciò che si sa prima dei dati: un tasso di base, l’esperienza, un’ipotesi dichiarata. La verosimiglianza P(E | H), letta come funzione dell’ipotesi (o del parametro θ) con i dati fissati, dice quanto ciascuna ipotesi rende probabili i dati osservati: porta l’informazione del campione. Il posterior P(H | E) è ciò che si sa dopo, e la sola cosa su cui si ragiona da lì in avanti. L’evidenza P(E), dalla probabilità totale, è la costante che fa sommare a 1 i posterior.',
    likelihood: (l) => `La verosimiglianza non è una distribuzione di probabilità su θ. Come funzione di θ non ha area 1: nel grafico, scalata a un massimo di 1, ha area ${IT.num(l.day1.area, 3)} con i dati del primo giorno (${IT.int(l.data.day1.clicks)} click su ${IT.int(l.data.day1.sent)}) e ${IT.num(l.days10.area, 3)} con quelli di dieci giorni (${IT.int(l.data.days10.clicks)} su ${IT.int(l.data.days10.sent)}). Ha il massimo nella frequenza osservata, la stima di massima verosimiglianza, e si stringe con i dati. Solo moltiplicata per un prior e normalizzata diventa un posterior.`,
    likelihoodTitle: 'La verosimiglianza della quota di click, dopo il primo giorno e dopo dieci giorni, scalata a un massimo di 1',
    odds: 'Con due ipotesi, H e ¬H, il teorema si legge meglio in forma di quote: le quote a posteriori sono le quote a priori per il rapporto di verosimiglianza LR = P(E | H)/P(E | ¬H). In logaritmi il prodotto diventa una somma: ogni prova aggiunge il suo peso ln LR, e le prove indipendenti date le ipotesi si sommano. Alan Turing, a Bletchley Park, misurava questi pesi in ban (logaritmi in base 10) e deciban.',
    formulas: [
      'P(H | E) = P(E | H) · P(H) / P(E)                  il teorema',
      'P(E) = Σ_i P(E | H_i) · P(H_i)                     la probabilità totale',
      'O(H | E) = O(H) · P(E | H) / P(E | ¬H)             le quote: posterior = prior × LR',
      'ln O(H | E_1, ..., E_k) = ln O(H) + Σ_j ln LR_j    prove indipendenti date H e ¬H',
      'p(θ | dati) ∝ p(dati | θ) · p(θ)                   un parametro continuo',
    ].join('\n'),
    weights: (w1, w10) => `Per un parametro il rapporto fra le tre componenti si vede nella media a posteriori. Con un prior Beta(a, b) e k click su n e-mail la media a posteriori è (a + k)/(a + b + n): una media pesata fra la media del prior e la frequenza osservata, con peso del prior (a + b)/(a + b + n). Con il prior informato Beta(3, 17) e il primo giorno il prior pesa ${art('il', IT.pct(w1.w, 1))}: ${IT.pct(w1.priorMean, 1)} e ${IT.pct(w1.mle, 1)} danno ${IT.pct(w1.posteriorMean, 1)}. Dopo dieci giorni pesa ${art('il', IT.pct(w10.w, 1))}, e il posterior (${IT.pct(w10.posteriorMean, 1)}) è quasi la frequenza osservata (${IT.pct(w10.mle, 1)}).`,
    central: 'Perché questo aggiornamento è centrale nell’inferenza bayesiana: tutto ciò che si conclude viene dal posterior. Le stime (media, mediana, moda), gli intervalli di credibilità, le probabilità delle ipotesi come P(θ > soglia), le previsioni di dati nuovi e le decisioni sono sue funzioni. E l’aggiornamento è coerente: il posterior di oggi è il prior di domani, e aggiornare un dato alla volta o tutti insieme, in qualunque ordine, dà lo stesso risultato.',
    after: 'Tre cose decidono il risultato, e gli esempi che seguono le mostrano una alla volta: il prior (2.3, il tasso di base), quanto ogni prova distingue le ipotesi (2.4 e 2.5), e quanti dati arrivano (2.6 e 2.11: con abbastanza dati il prior smette di contare).',
  },
  alarm: {
    intro: (f) => `Una regola dell’IDS riconosce ${art('il', IT.pct(f.sensitivity, 0))} degli attacchi (la sensibilità) e suona per errore ${art('sul', IT.pct(f.fpr, 0))} delle connessioni normali (il tasso di falsi positivi). Sembra un buon rilevatore. Ma su questa rete solo una connessione su ${IT.int(1 / f.base)} è un attacco: è il tasso di base, il prior. Quando l’IDS suona, quanto è probabile che sia davvero un attacco?`,
    paras: (f) => [
      `P(attacco | allarme) = (${IT.plain(f.base)} × ${IT.plain(f.sensitivity)}) / (${IT.plain(f.base)} × ${IT.plain(f.sensitivity)} + ${IT.plain(1 - f.base)} × ${IT.plain(f.fpr)}) = ${IT.pct(f.posterior)}: solo un allarme su ${IT.num(1 / f.posterior, 1)} è un attacco. Con le frequenze naturali il conto si fa a mente. Su ${IT.int(f.population)} connessioni gli attacchi sono ${IT.int(f.population * f.base)}: l’IDS ne vede ${IT.int(f.counts[0])} e ne perde ${IT.int(f.counts[1])}. Le connessioni normali sono ${IT.int(f.population * (1 - f.base))}, e ${art('il', IT.pct(f.fpr, 0))} di loro fa scattare ${IT.int(f.counts[2])} falsi allarmi. Gli allarmi sono ${IT.int(f.counts[0] + f.counts[2])}, e solo ${IT.int(f.counts[0])} sono attacchi.`,
      `È la fallacia del tasso di base: chi guarda solo la sensibilità ${art('del', IT.pct(f.sensitivity, 0))} sopravvaluta l’allarme di ${IT.num(f.sensitivity / f.posterior, 1)} volte. In forma di quote: il prior è 1 a ${IT.num(1 / f.priorOdds, 0)}, l’allarme lo moltiplica per LR = ${IT.num(f.sensitivity, 2)}/${IT.num(f.fpr, 2)} = ${IT.num(f.lrPlus, 1)} (${IT.num(Math.log10(f.lrPlus), 2)} ban) e lo porta a 1 a ${IT.num(1 / f.posteriorOdds, 2)}. Il silenzio invece rassicura molto: P(attacco | nessun allarme) = ${IT.pctSmall(f.posteriorQuiet)}.`,
    ],
    iconTitle: 'Le 10.000 connessioni: ogni quadratino è una connessione',
    tableTitle: 'Le quattro categorie',
    cols: { category: 'Categoria', truth: 'Verità', alarm: 'Allarme', count: 'Connessioni', share: 'Quota' },
    truth: { detected: 'attacco', missed: 'attacco', falseAlarm: 'normale', quiet: 'normale' },
    alarmed: { detected: 'sì', missed: 'no', falseAlarm: 'sì', quiet: 'no' },
    chainIntro: (s2) => `Una seconda prova, indipendente dalla prima dato lo stato della connessione: una sandbox apre il file che la connessione ha portato. Riconosce ${art('il', IT.pct(s2.sensitivity, 0))} del malware e sbaglia ${art('sul', IT.pct(s2.fpr, 0))} dei file innocui, quindi LR = ${IT.num(s2.sensitivity / s2.fpr, 0)}. Il posterior del primo allarme diventa il prior del secondo. Nell’ordine inverso, prima la sandbox e poi l’IDS, si arriva allo stesso numero: i pesi si sommano.`,
    chainTitle: 'Due prove in fila, nei due ordini',
    chainCols: { order: 'Ordine', step: 'Prova', lr: 'LR', weight: 'Peso (ban)', prior: 'Prior', posterior: 'Posterior' },
    orders: { forward: 'IDS, poi sandbox', backward: 'sandbox, poi IDS' },
    detectors: { ids: 'allarme dell’IDS', sandbox: 'allarme della sandbox' },
  },
  tryAlarm: {
    intro: 'Muovete i cursori: tasso di base, sensibilità e falsi positivi. I quadratini rossi sono gli attacchi visti, i viola quelli persi, gli arancioni i falsi allarmi. Con un tasso di base di uno su diecimila anche un rilevatore eccellente produce quasi solo falsi allarmi; con il secondo rilevatore acceso, gli allarmi vengono rivisti dalla sandbox.',
    base: (v) => `Tasso di base: ${IT.pctSmall(v)}`,
    sensitivity: (v) => `Sensibilità: ${IT.pct(v, 1)}`,
    fpr: (v) => `Falsi positivi: ${IT.pctSmall(v)}`,
    second: 'Rivedere gli allarmi con la sandbox',
    result: (t) => {
      const f = t.facts;
      const [seen, missed, wrong] = f.counts;
      return `Su ${IT.int(f.population)} connessioni: ${IT.int(seen)} ${seen === 1 ? 'attacco visto' : 'attacchi visti'}, ${IT.int(missed)} ${missed === 1 ? 'perso' : 'persi'}, ${IT.int(wrong)} ${wrong === 1 ? 'falso allarme' : 'falsi allarmi'}. P(attacco | allarme) = ${IT.pct(f.posterior)}.`;
    },
    secondResult: (t) => `La sandbox conferma circa ${IT.num(t.confirmed[0], 1)} attacchi e ${IT.num(t.confirmed[1], 1)} falsi allarmi: dopo due allarmi P(attacco) = ${IT.pct(t.chain[1].posterior)}.`,
  },
  network: {
    intro: [
      'Un analista vede tre indizi su un host e deve capire che cosa è successo. Due cause possibili: un phishing ha rubato una password, oppure qualcuno ha sfruttato una vulnerabilità dall’esterno. Ciascuna può compromettere l’host (le due cause agiscono indipendentemente, un modello detto noisy-OR, con una piccola probabilità di compromissione per altre vie). Gli indizi: l’EDR sull’host dà l’allarme (figlio della compromissione), l’accesso arriva da un luogo insolito (figlio del phishing), l’IDS vede la firma di un exploit (figlio della vulnerabilità). I numeri sono ordini di grandezza plausibili, non dati.',
      'Una rete bayesiana scrive la probabilità congiunta di tutti i nodi come prodotto delle probabilità di ciascuno dati i suoi genitori: con sei nodi binari bastano 1 + 1 + 4 + 2 + 2 + 2 = 12 numeri, invece dei 63 di una tabella completa. L’inferenza qui è per enumerazione: si sommano i 64 stati compatibili con gli indizi. Con reti grandi servono l’eliminazione delle variabili o i metodi Monte Carlo, ma la regola resta Bayes.',
    ],
    paras: (rows) => [
      `Senza indizi, phishing ed exploit hanno le loro probabilità a priori, ${IT.pct(rows[0].phishing)} e ${IT.pct(rows[0].exploit)}, e la compromissione ${IT.pct(rows[0].compromise)}. L’allarme dell’EDR porta la compromissione ${art('al', IT.pct(rows[1].compromise))} e alza entrambe le cause: il phishing ${art('al', IT.pct(rows[1].phishing))}, l’exploit ${art('al', IT.pct(rows[1].exploit))}.`,
      `Poi l’IDS vede la firma di un exploit: la vulnerabilità sale ${art('al', IT.pct(rows[2].exploit))} e il phishing ridiscende ${art('al', IT.pct(rows[2].phishing))}, quasi al suo prior, anche se nessun indizio riguarda il phishing. È lo «spiegare via» (explaining away): una causa trovata rende superflua l’altra. A priori le due cause sono indipendenti; dato il loro effetto comune diventano dipendenti, in senso opposto. Infine l’accesso insolito, un indizio proprio del phishing, lo riporta ${art('al', IT.pct(rows[3].phishing))}, e a sua volta toglie un po’ di peso all’exploit (${IT.pct(rows[3].exploit)}).`,
    ],
    nodes: { phishing: 'Phishing', exploit: 'Exploit', compromise: 'Compromissione', edr: 'Allarme EDR', login: 'Accesso insolito', signature: 'Firma di exploit' },
    steps: ['Nessun indizio', 'Allarme EDR', '+ firma di exploit', '+ accesso insolito'],
    stepsShort: ['Prima', 'EDR', '+ firma', '+ accesso'],
    chartTitle: 'Le probabilità delle tre variabili nascoste, indizio dopo indizio',
    tableTitle: 'La storia, passo per passo',
    cols: { step: 'Indizi', phishing: 'P(phishing)', exploit: 'P(exploit)', compromise: 'P(compromissione)', evidence: 'P(indizi)' },
  },
  tryNetwork: {
    intro: 'Ogni indizio può essere ignoto, presente o assente. Accendete l’allarme dell’EDR e poi la firma di exploit: guardate il phishing scendere. Provate anche a dire che l’EDR non ha suonato: la compromissione crolla, e con lei le due cause.',
    states: { unknown: 'ignoto', yes: 'sì', no: 'no' },
    result: (q) => `P(phishing) = ${IT.pct(q.phishing)}, P(exploit) = ${IT.pct(q.exploit)}, P(compromissione) = ${IT.pct(q.compromise)}; la probabilità di vedere questi indizi era ${IT.pctSmall(q.pEvidence)}.`,
    diagramLabel: 'La rete bayesiana del triage: le cause in alto, la compromissione al centro, gli indizi in basso',
  },
  sprt: {
    intro: [
      `Un indirizzo IP prova ad accedere, un tentativo dopo l’altro. Due ipotesi: un utente legittimo, che sbaglia ogni tanto (fallisce con probabilità p0 = ${IT.plain(SPRT_DEFAULT.p0)}: un errore di battitura, una password vecchia), oppure un attacco a forza bruta, che fallisce quasi sempre (p1 = ${IT.plain(SPRT_DEFAULT.p1)}). Bloccare un utente legittimo deve capitare al massimo una volta su ${IT.int(1 / SPRT_DEFAULT.alpha)} (α), lasciar passare un attaccante una volta su ${IT.int(1 / SPRT_DEFAULT.beta)} (β). Quanti tentativi aspettare?`,
      'Il test sequenziale di Wald (1945) somma, tentativo dopo tentativo, il logaritmo del rapporto di verosimiglianza, e decide appena la somma esce da una delle due soglie. È Bayes applicato un tentativo alla volta: con quote a priori di 1 a 1, la somma è proprio il logaritmo delle quote a posteriori che l’indirizzo sia un attaccante.',
    ],
    formulas: (s) => [
      `tentativo fallito:   + ln(p1/p0) = + ${IT.num(s.fail, 3)}`,
      `tentativo riuscito:  + ln((1 - p1)/(1 - p0)) = ${IT.num(s.success, 3)}`,
      `blocca quando la somma ≥ ln((1 - β)/α) = ${IT.num(s.upper, 3)}`,
      `libera quando la somma ≤ ln(β/(1 - α)) = ${IT.num(s.lower, 3)}`,
    ].join('\n'),
    paras: (s, legit, attacker) => [
      `Un attaccante che fallisce sempre viene bloccato al tentativo numero ${IT.int(Math.ceil(s.upper / s.fail))} (${IT.int(Math.ceil(s.upper / s.fail))} × ${IT.num(s.fail, 3)} = ${IT.num(Math.ceil(s.upper / s.fail) * s.fail, 2)}); un utente che entra ${IT.int(Math.ceil(s.lower / s.success))} volte di seguito viene liberato. Calcolati esattamente sul reticolo dei fallimenti e dei successi, gli errori sono P(bloccare un utente) = ${IT.prob(legit.block)} e P(liberare un attaccante) = ${IT.prob(attacker.clear)}, sotto α e β come Wald garantisce. In media servono ${IT.num(legit.mean, 2)} tentativi per un utente e ${IT.num(attacker.mean, 2)} per un attaccante; le approssimazioni di Wald, che trascurano di quanto la somma supera la soglia, dicono ${IT.num(s.waldLegit, 2)} e ${IT.num(s.waldAttacker, 2)}.`,
      `Le soglie, lette come probabilità a posteriori con un prior di metà e metà, sono P(attaccante) = ${IT.pct(1 / (1 + Math.exp(-s.upper)), 2)} per bloccare e ${IT.pct(1 / (1 + Math.exp(-s.lower)), 2)} per liberare. Wald e Wolfowitz (1948) dimostrarono che nessun altro test con gli stessi errori usa in media meno tentativi: il test sequenziale è il modo più rapido di decidere.`,
    ],
    simulation: (sim) => `Simulati ${IT.int(sim.legit.runs)} utenti e ${IT.int(sim.attackers.runs)} attaccanti: ${IT.int(sim.legit.block)} ${sim.legit.block === 1 ? 'utente bloccato' : 'utenti bloccati'} (atteso ${IT.num(sim.exactLegit.block * sim.legit.runs, 1)}) e ${IT.int(sim.attackers.clear)} attaccanti liberati (attesi ${IT.num(sim.exactAttacker.clear * sim.attackers.runs, 1)}), con ${IT.num(sim.legit.meanSteps, 2)} e ${IT.num(sim.attackers.meanSteps, 2)} tentativi in media.`,
    chartTitle: 'Il logaritmo del rapporto di verosimiglianza di due indirizzi d’esempio',
    tableTitle: 'Errori e tentativi: esatti, approssimati, simulati',
    cols: { who: 'Indirizzo', block: 'Bloccato', clear: 'Liberato', exact: 'Tentativi (esatti)', wald: 'Tentativi (Wald)', simulated: 'Tentativi (simulati)' },
    who: { legit: 'Utente legittimo', attacker: 'Attaccante' },
  },
  trySprt: {
    intro: 'Aggiungete i tentativi a mano, oppure fate arrivare un utente o un attaccante simulato, un tentativo alla volta. Il riquadro mostra la somma, le soglie e la probabilità a posteriori, con un prior di metà e metà. Abbassate α: servono più fallimenti per bloccare.',
    fail: '+ tentativo fallito',
    success: '+ tentativo riuscito',
    legit: 'Utente simulato',
    attacker: 'Attaccante simulato',
    alphaLabel: 'Errore ammesso sugli utenti (α)',
    alphaName: (a) => `1 su ${IT.int(1 / a)}`,
    result: (path, n, decision) => {
      const last = path.llr[path.llr.length - 1];
      const state = decision === 'block' ? 'indirizzo bloccato' : decision === 'clear' ? 'indirizzo liberato' : 'ancora nessuna decisione';
      return `${IT.int(n)} ${n === 1 ? 'tentativo' : 'tentativi'}, somma ${IT.num(last, 3)}, P(attaccante) = ${IT.pct(1 / (1 + Math.exp(-last)), 2)}: ${state}.`;
    },
    walk: 'L’indirizzo di prova',
  },
  rate: {
    intro: (c) => `Una campagna di phishing simulato manda ${IT.int(CAMPAIGN.perDay)} e-mail al giorno per ${IT.int(CAMPAIGN.days)} giorni. La quota vera di chi clicca, ${IT.pct(CAMPAIGN.rate, 0)}, l’analista non la conosce: la stima dai click. Due analisti partono da prior diversi: uno non sa niente, Beta(${PRIORS.uniform.join(', ')}), uniforme su [0, 1]; l’altro ha letto che di solito clicca ${art('il', IT.pct(PRIORS.informed[0] / (PRIORS.informed[0] + PRIORS.informed[1]), 0))}, e lo esprime con Beta(${PRIORS.informed.join(', ')}), che vale quanto ${IT.int(PRIORS.informed[0] + PRIORS.informed[1])} e-mail già viste. La sicurezza vuole stare sotto ${art('il', IT.pct(TARGET_RATE, 0))}. Click dei dieci giorni: ${c.days.map((d) => d.clicks).join(', ')}.`,
    paras: (c) => {
      const u = c.uniform;
      const i = c.informed;
      const d1 = u[1];
      const last = u[u.length - 1];
      const lastI = i[i.length - 1];
      return [
        `Il prior Beta è coniugato della binomiale: dopo k click su n e-mail il posterior è ancora una Beta, con k aggiunto al primo parametro e n - k al secondo. Il motore qui si riduce a contare. Dopo il primo giorno (${IT.int(d1.clicks)} click su ${IT.int(d1.sent)}) il primo analista stima ${IT.pct(d1.mean)}, con un intervallo di credibilità al 95% da ${IT.pct(d1.lo)} a ${IT.pct(d1.hi)}; il secondo, frenato dal suo prior, ${IT.pct(i[1].mean)}.`,
        `Dopo ${IT.int(last.sent)} e-mail e ${IT.int(last.clicks)} click i due quasi coincidono: ${IT.pct(last.mean)} (da ${IT.pct(last.lo)} a ${IT.pct(last.hi)}) e ${IT.pct(lastI.mean)} (da ${IT.pct(lastI.lo)} a ${IT.pct(lastI.hi)}). Il dato ha sommerso il prior. La domanda della sicurezza ha una risposta diretta: dati i click, la probabilità che la quota vera superi ${art('il', IT.pct(TARGET_RATE, 0))} è ${IT.pct(c.aboveUniform[c.aboveUniform.length - 1])}. Serve un’altra sessione di formazione.`,
      ];
    },
    after: 'L’intervallo di credibilità si legge come si vorrebbe leggere ogni intervallo: dati il prior e i click, la quota vera sta lì dentro con probabilità 95%. Un intervallo di confidenza dice un’altra cosa, e la sezione 2.7 la mette a confronto.',
    chartTitle: 'La stima dei due analisti, giorno dopo giorno, con il suo intervallo al 95%',
    tableTitle: 'I posterior, giorno per giorno',
    cols: { day: 'Giorno', sent: 'E-mail', clicks: 'Click', uniform: 'Prior uniforme', informed: 'Prior informato', above: `P(quota > ${IT.pct(TARGET_RATE, 0)})` },
    interval: (r) => `${IT.pct(r.mean)} [${IT.pct(r.lo)}, ${IT.pct(r.hi)}]`,
  },
  tryBelief: {
    intro: 'Scegliete il prior, poi aggiungete le e-mail una alla volta, o dieci alla volta (simulate al 12% vero). La curva tratteggiata è il prior, quella punteggiata la verosimiglianza, la piena il posterior: si vede il posterior spostarsi dal prior verso i dati, e stringersi.',
    priorLabel: 'Prior',
    priors: { uniform: 'Uniforme, Beta(1, 1)', jeffreys: 'Jeffreys, Beta(1/2, 1/2)', informed: 'Informato, Beta(3, 17)', wrong: 'Sbagliato, Beta(40, 60)' },
    click: '+ ha cliccato',
    noClick: '+ non ha cliccato',
    ten: '+ 10 e-mail',
    result: (state, post, above) => (state.sent === 0
      ? `Nessuna e-mail ancora: il posterior è il prior, con media ${IT.pct(post.mean)}.`
      : `${IT.int(state.clicks)} click su ${IT.int(state.sent)} e-mail: posterior Beta(${IT.num(post.a, post.a % 1 ? 1 : 0)}, ${IT.num(post.b, post.b % 1 ? 1 : 0)}), media ${IT.pct(post.mean)}, intervallo al 95% da ${IT.pct(post.lo)} a ${IT.pct(post.hi)}, P(quota > ${IT.pct(TARGET_RATE, 0)}) = ${IT.pct(above)}.`),
    chartTitle: 'Prior, verosimiglianza e posterior della quota di click',
  },
  tryPrior: {
    intro: 'Trascinate i punti per disegnare il prior che volete: anche con due gobbe, anche a zero in un tratto. Il posterior si calcola su una griglia di 201 valori, moltiplicando punto per punto e normalizzando: nessuna formula coniugata, il motore così com’è. Con i dati di un giorno il disegno conta molto; con quelli di dieci giorni quasi niente. Con la tastiera: frecce a sinistra e a destra per scegliere un punto, in alto e in basso per spostarlo.',
    shapeLabel: 'Forme pronte',
    shapes: { flat: 'Piatto', informed: 'Come Beta(3, 17)', twoPeaks: 'Due gobbe', pessimist: 'Pessimista' },
    dataLabel: 'Dati',
    data: { day1: 'Il primo giorno', days3: 'Tre giorni', days10: 'Dieci giorni' },
    editorLabel: 'Il prior da disegnare: undici punti trascinabili, da 0 a 1',
    handle: (i, h) => `punto ${i + 1} di 11, quota ${IT.num(i / 10, 1)}, altezza ${IT.num(h, 2)}`,
    result: (g, flat) => `${IT.int(g.clicks)} click su ${IT.int(g.sent)}: media a posteriori ${IT.pct(g.mean)}, intervallo al 95% da ${IT.pct(g.lo)} a ${IT.pct(g.hi)}. Con il prior piatto sarebbe ${IT.pct(flat.mean)}, da ${IT.pct(flat.lo)} a ${IT.pct(flat.hi)}.`,
    chartTitle: 'Il prior disegnato, la verosimiglianza e il posterior sulla griglia',
  },
  frequentist: {
    intro: [
      `Gli stessi click, due domande diverse. L’intervallo di credibilità bayesiano risponde a: dati questi click, dove sta la quota vera? L’intervallo di confidenza frequentista risponde a: se ripetessi la campagna tante volte, quante volte il mio metodo prenderebbe la quota vera? Il 95% del primo è una probabilità sulla quota; quello del secondo è una proprietà della procedura, che una volta calcolato l’intervallo contiene la quota vera oppure no.`,
      `Per confrontarli si guarda la copertura: la probabilità, quando la quota vera è p, che l’intervallo calcolato dai dati la contenga. Con ${IT.int(COVERAGE_N)} e-mail (un giorno di campagna) si calcola esattamente, sommando le probabilità binomiali dei ${IT.int(COVERAGE_N + 1)} risultati possibili, senza simulare. I metodi: Wald (la formula dei manuali, p̂ ± 1,96 √(p̂(1 - p̂)/n)), Wilson (1927, l’inverso del test del punteggio), Clopper-Pearson (1934, esatto con la binomiale) e Jeffreys, l’intervallo di credibilità del prior Beta(1/2, 1/2).`,
    ],
    paras: (cov) => {
      const S = cov.summary;
      return [
        `Wald copre in media ${art('il', IT.pct(S.wald.mean))} invece del 95%, e per quote piccole crolla: a p = ${IT.pct(S.wald.minAt, 1)} ${art('il', IT.pct(S.wald.min))}, perché con zero click l’intervallo è [0, 0]. Clopper-Pearson non scende mai sotto il 95% (minimo ${IT.pct(S.clopper.min)}), ma per riuscirci copre in media ${art('il', IT.pct(S.clopper.mean))} ed è il più largo (${IT.pct(S.clopper.width)} contro ${IT.pct(S.wilson.width)} di Wilson). Wilson (${IT.pct(S.wilson.mean)} in media) e Jeffreys (${IT.pct(S.jeffreys.mean)}) oscillano intorno al 95%.`,
        'L’intervallo bayesiano di Jeffreys, che nasce da una probabilità sulla quota, ha dunque anche una buona copertura frequentista: Brown, Cai e DasGupta (2001) lo raccomandano insieme a Wilson al posto di Wald. È un primo assaggio del ponte della sezione 2.11: quando i dati crescono, i due modi di ragionare danno gli stessi intervalli.',
      ];
    },
    simulation: (s) => `Le stesse coperture, simulate su ${IT.int(s.runs)} campagne alla quota vera ${art('del', IT.pct(s.p, 0))}: ${['wald', 'wilson', 'clopper', 'jeffreys'].map((m) => `${it.names.methods[m]} ${IT.pct(s.hits[m] / s.runs)} (esatta ${IT.pct(s.exact[m])})`).join(', ')}.`,
    chartTitle: `La copertura esatta degli intervalli al 95% con ${COVERAGE_N} e-mail, al variare della quota vera`,
    chartNote: 'Wald esce dal grafico per le quote più piccole: scende fino a quanto dice la tabella.',
    tableTitle: 'I quattro metodi a confronto',
    cols: { method: 'Metodo', mean: 'Copertura media', min: 'Copertura minima', at: 'Dove', width: 'Ampiezza media' },
  },
  spam: {
    intro: [
      'Il motore bayesiano più usato della sicurezza informatica è il filtro antispam: Sahami e colleghi lo proposero nel 1998, Paul Graham lo rese famoso nel 2002 con «A Plan for Spam». Ogni parola è una prova, e il filtro somma i loro pesi.',
    ],
    source: (d) => `I dati: la ${d.dataset}, raccolta da Almeida, Gómez Hidalgo e Yamakami: ${IT.int(d.messages)} SMS in inglese, etichettati come spam o legittimi. Licenza ${d.license}, che chiede di citare la fonte: ${d.paper}.`,
    links: { dataset: 'La raccolta (UCI)', paper: 'L’articolo' },
    paras: (m) => {
      const c = m.matrix;
      return [
        `Il file ripete ${IT.int(m.corpus.repeated)} messaggi: il filtro li conta una volta sola, perché lo stesso messaggio nell’addestramento e nella prova gonfierebbe l’accuratezza. Restano ${IT.int(m.corpus.docs.length)} messaggi distinti; tre su dieci, per posizione, servono da prova (${IT.int(m.corpus.test.length)}), gli altri ${IT.int(m.corpus.train.length)} per imparare. Le parole sono le sequenze di lettere e cifre, in minuscolo, più il simbolo della sterlina.`,
        `Il modello è il naive Bayes multinomiale: per ogni parola, la sua frequenza nello spam e nei messaggi legittimi dell’addestramento, con il correttivo di Laplace (+1) per le parole mai viste in una delle due classi. «Naive» perché tratta le parole come indipendenti data la classe, cosa falsa («free» e «prize» viaggiano insieme), ma che rende il motore una somma. Il prior è la quota di spam dell’addestramento, ${IT.pct(m.trainSpamShare)}.`,
        `Sui ${IT.int(c.n)} messaggi di prova il filtro ferma ${IT.int(c.tp)} spam su ${IT.int(c.tp + c.fn)} e scambia per spam ${IT.int(c.fp)} messaggi legittimi su ${IT.int(c.fp + c.tn)}: accuratezza ${IT.pct(c.accuracy)}, precisione ${IT.pct(c.precision)}, richiamo ${IT.pct(c.recall)}, area sotto la curva ROC ${IT.num(m.auc, 3)}. La regola banale che dichiara tutto legittimo arriva ${art('al', IT.pct(m.majority.accuracy))}: il test di McNemar sui messaggi in cui i due disaccordano dà p ≈ ${IT.p(m.mcnemar.p, m.mcnemar.log10p)}.`,
      ];
    },
    matrixTitle: 'La matrice di confusione sui messaggi di prova',
    matrixRows: { spam: 'Spam vero', ham: 'Legittimo vero' },
    matrixCols: { truth: '', spam: 'Il filtro dice spam', ham: 'Il filtro dice legittimo' },
    wordsTitle: 'Le parole che pesano di più (almeno 10 volte nell’addestramento)',
    wordsCols: { spam: 'Verso lo spam', spamWeight: 'Peso', ham: 'Verso il legittimo', hamWeight: 'Peso' },
    chartTitle: 'I messaggi di prova per log-quote di spam: a destra di 0 il filtro dice spam',
    tableTitle: 'I messaggi di prova per intervallo di log-quote',
    binCols: { bin: 'Log-quote', spam: 'Spam', ham: 'Legittimi' },
    bin: (b) => (b.to === Infinity ? `≥ ${IT.int(b.from)}` : `da ${IT.int(b.from)} a ${IT.int(b.to)}`),
    fieldLabel: 'Scrivete un messaggio, in inglese',
    baseLabel: 'Casella',
    bases: { train: 'Come l’addestramento', one: 'Uno spam su 100' },
    result: (sc) => `P(spam) = ${IT.pct(sc.posterior, 2)} (log-quote ${IT.num(sc.logOdds, 2)}, ${IT.int(sc.words)} ${sc.words === 1 ? 'parola' : 'parole'}).`,
    partsTitle: 'Il contributo di ogni parola',
    partsCols: { token: 'Parola', count: 'Volte', weight: 'Peso (log)' },
    unknown: 'mai vista: non pesa',
    after: 'Cambiate la casella: lo stesso messaggio, in una casella dove lo spam è raro, ha un posterior più basso. È il tasso di base della sezione 2.3, che entra dal prior.',
  },
  kdd: {
    intro: (d) => `Lo stesso motore sulle connessioni di NSL-KDD, i dati dell’Homework #6: dal protocollo, dal servizio e dal flag, la connessione è un attacco? I dati: ${d.dataset}, ${IT.int(d.records)} connessioni; vanno citati il dataset e l’articolo ${d.paper}.`,
    paras: (k) => [
      `Tre connessioni su dieci, per posizione, servono da prova (${IT.int(k.test)}), le altre ${IT.int(k.train)} per imparare. Il naive Bayes categoriale moltiplica il prior (gli attacchi sono ${art('il', IT.pct(k.classes[1] / (k.classes[0] + k.classes[1])))} dell’addestramento) per tre rapporti di verosimiglianza, uno per campo, con il correttivo di Laplace. Accuratezza ${IT.pct(k.naive.accuracy)}, richiamo sugli attacchi ${IT.pct(k.naive.recall)}, falsi positivi ${IT.pct(k.naive.fpr)}, area sotto la curva ROC ${IT.num(k.auc, 3)}.`,
      `L’Homework #6 ha mostrato che protocollo, servizio e flag sono fortemente dipendenti: l’ipotesi «naive» è falsa anche qui. Il confronto con il Bayes esatto lo misura. La tabella completa delle ${IT.int(k.cells)} combinazioni viste nell’addestramento, con un prior Beta(1, 1) in ogni cella, non fa ipotesi di indipendenza e arriva ${art('al', IT.pct(k.joint.accuracy))} (le ${IT.int(k.unseen)} connessioni di prova con una combinazione mai vista prendono il prior). Il naive Bayes conta due volte le prove che dicono la stessa cosa, e i suoi posterior sono troppo sicuri, ma la decisione cambia poco. Tutti e due battono di molto la regola che dichiara tutto un attacco (${IT.pct(k.majority.accuracy)}; McNemar, p ≈ ${IT.p(k.mcnemar.p, k.mcnemar.log10p)}).`,
    ],
    tableTitle: 'Tre classificatori sulle connessioni di prova',
    cols: { model: 'Classificatore', accuracy: 'Accuratezza', precision: 'Precisione', recall: 'Richiamo', fpr: 'Falsi positivi' },
    models: { naive: 'Naive Bayes (tre pesi)', joint: 'Tabella completa (Bayes esatto)', majority: 'Sempre «attacco»' },
    chooseTitle: 'Scegliete una connessione',
    labels: { protocol: 'Protocollo', service: 'Servizio', flag: 'Flag' },
    partsCols: { feature: 'Campo', value: 'Valore', attacks: 'Attacchi', normals: 'Normali', weight: 'Peso (log)' },
    features: { protocol: 'protocollo', service: 'servizio', flag: 'flag' },
    result: (e) => `Naive Bayes: P(attacco) = ${IT.pct(e.posterior, 2)}. ${e.joint.posterior === null ? 'La tabella completa non ha mai visto questa combinazione: resta il prior.' : `La tabella completa ha visto questa combinazione ${IT.int(e.joint.attacks + e.joint.normals)} volte, ${IT.int(e.joint.attacks)} come attacco: P(attacco) = ${IT.pct(e.joint.posterior, 2)}.`}`,
  },
  convergence: {
    intro: [
      'Una successione di variabili casuali X_1, X_2, ... può avvicinarsi a un limite X in modi diversi, e non equivalenti. Le quattro definizioni della consegna, per ogni ε > 0:',
    ],
    formulas: [
      'in probabilità:          P(|X_n - X| > ε) → 0',
      'quasi certa:              P(lim X_n = X) = 1',
      'in media quadratica:     E[(X_n - X)²] → 0',
      'in distribuzione:        F_n(x) → F(x) in ogni punto di continuità di F',
    ].join('\n'),
    after: [
      `L’esempio che attraversa la sezione: una regola dell’IDS dà un falso allarme ${art('sul', IT.pct(FALSE_ALARMS.rate, 0))} delle connessioni normali, e F̂_n, la quota di falsi allarmi nelle prime n connessioni, stima quel ${IT.pct(FALSE_ALARMS.rate, 0)}. Ogni forma di convergenza dice qualcosa di diverso su quanto ci si può fidare di F̂_n; la banda di tolleranza è di un punto, ε = ${IT.plain(FALSE_ALARMS.epsilon)}.`,
    ],
  },
  probability: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'La convergenza in probabilità dice che, fissato n abbastanza grande, una deviazione più larga di ε è improbabile. La legge debole dei grandi numeri la garantisce per la media di valori indipendenti con varianza finita, e la dimostrazione sta in una riga, con la disuguaglianza di Chebyshev: P(|F̂_n - p| > ε) ≤ Var(F̂_n)/ε² = p(1 - p)/(n ε²) → 0.',
        `Qui la probabilità si calcola anche esattamente, con la binomiale: ${IT.pct(at(100).exact)} dopo 100 connessioni, ${IT.pct(at(1000).exact)} dopo 1.000, ${IT.prob(at(10000).exact)} dopo 10.000. Il grafico la confronta con la quota delle ${IT.int(PATHS.count)} regole simulate fuori dalla banda e con il limite di Chebyshev, che è vero ma largo.`,
      ];
    },
    after: 'La convergenza in probabilità parla di un n alla volta: dopo 1.000 connessioni la stima è quasi sempre buona. Non dice nulla sulla storia di una singola regola, che potrebbe uscire dalla banda ancora molte volte. Di questo si occupa la convergenza quasi certa.',
    chartTitle: 'Fuori dalla banda di un punto: le regole simulate, la probabilità esatta e il limite di Chebyshev',
    tableTitle: 'Le regole fuori dalla banda',
    cols: { n: 'n', simulated: 'Simulate', exact: 'Esatta', chebyshev: 'Chebyshev' },
  },
  almost: {
    paras: (paths) => {
      const c = paths.checks.find((x) => x.n === 1000);
      return [
        'La convergenza quasi certa chiede di più: che quasi ogni traiettoria, presa per intero, finisca dentro la banda e non ne esca più. In formule equivale a P(sup_{m ≥ n} |X_m - X| > ε) → 0: non basta che a ogni n la deviazione sia improbabile, deve essere improbabile che ce ne sia ancora una qualsiasi, da n in poi. La legge forte dei grandi numeri (Kolmogorov, 1933) la garantisce per la media di valori indipendenti e identicamente distribuiti con media finita.',
        `Le ${IT.int(paths.count)} regole simulate lo mostrano: dopo ${IT.int(1000)} connessioni ${art('il', IT.pct(c.outside))} è fuori dalla banda, ma ${art('il', IT.pct(c.after))} ne uscirà ancora almeno una volta prima di ${IT.int(paths.length)} (il sup è tagliato lì). Anche questa quota va a zero: a ${IT.int(10000)} connessioni nessuna regola è più fuori.`,
        'Lo strumento per decidere è il lemma di Borel-Cantelli. Se la somma delle probabilità di eventi A_n è finita, quasi certamente se ne verificano solo un numero finito; se gli eventi sono indipendenti e la somma è infinita, se ne verificano infiniti. Con X_n di Bernoulli(1/n) indipendenti la somma di 1/n diverge: gli 1 non finiscono mai, e X_n non converge quasi certamente a 0, anche se P(X_n = 1) = 1/n → 0. Con Bernoulli(1/n²) la somma converge (vale π²/6): dopo un po’ solo zeri.',
      ];
    },
    after: 'Per una regola dell’IDS in produzione è la differenza fra «oggi la stima è quasi certamente buona» e «da un certo giorno in poi la stima resterà buona per sempre».',
    chartTitle: '20 delle 1.000 regole: la quota di falsi allarmi, connessione dopo connessione, e la banda di un punto',
    chart2Title: 'Fuori dalla banda a n, e fuori almeno un’altra volta dopo n',
    tableTitle: 'Le due quote, per n',
    cols: { n: 'n', outside: 'Fuori a n', after: 'Fuori ancora dopo n' },
  },
  trySequences: {
    intro: 'Scegliete una successione: il grafico ne mostra 12 traiettorie fino a n = 1.000, la tabella i suoi numeri esatti e quali convergenze valgono. Le traiettorie di Bernoulli(1/n) hanno 1 sparsi per sempre; quelle di Bernoulli(1/n²) si spengono subito; la «macchina da scrivere» passa su ogni punto in ogni blocco; il picco n·1{U < 1/n} si spegne presto, ma la sua media quadratica esplode.',
    chooseLabel: 'Successione',
    names: { mean: 'Media di monete - 1/2', bern1: 'Bernoulli(1/n)', bern2: 'Bernoulli(1/n²)', typewriter: 'Macchina da scrivere', spike: 'Picco n·1{U < 1/n}', flip: '(-1)^n Z' },
    describe: {
      mean: 'La media di n lanci di una moneta onesta, meno 1/2: converge a 0 in tutti i sensi.',
      bern1: 'Valori indipendenti, 1 con probabilità 1/n: in probabilità e in L2 sì, quasi certamente no.',
      bern2: 'Valori indipendenti, 1 con probabilità 1/n²: tutte le convergenze.',
      typewriter: 'L’indicatore di un intervallo di lunghezza 2^-k che scorre su [0, 1]: in probabilità e in L2 sì, ma ogni traiettoria vale 1 infinite volte.',
      spike: 'Vale n se U < 1/n, altrimenti 0: quasi certamente e in probabilità sì, in L2 no, perché E[X_n²] = n.',
      flip: 'Z normale standard, cambiata di segno a ogni passo: la legge è sempre N(0, 1), quindi converge in distribuzione a Z; ma |X_n - Z| = 2|Z| a ogni n dispari.',
    },
    tableTitle: 'I numeri esatti della successione',
    cols: { n: 'n', deviation: `P(|X_n - X| > ${IT.plain(SEQUENCE_EPSILON)})`, l2: 'E[(X_n - X)²]', afterwards: 'Ancora fuori dopo n', simulated: 'Traiettorie ancora fuori' },
    modesTitle: 'Quali convergenze valgono',
    modes: { probability: 'In probabilità', as: 'Quasi certa', l2: 'In L2', distribution: 'In distribuzione' },
    holds: 'sì',
    fails: 'no',
    never: '1 (non finisce mai)',
    simulatedNote: 'L’ultima colonna conta le 12 traiettorie simulate ancora lontane dal limite dopo n, fino a n = 1.000.',
  },
  l2: {
    paras: (paths) => {
      const c = paths.checks.find((x) => x.n === 1000);
      return [
        `In media quadratica la distanza conta con il suo quadrato: E[(F̂_n - p)²] → 0. Per la media di valori indipendenti è la varianza, p(1 - p)/n: per dimezzare l’errore servono quattro volte i dati. Le ${IT.int(paths.count)} regole simulate la seguono: a n = 1.000 l’errore quadratico medio è ${IT.sci(c.mse, 2)}, quello esatto ${IT.sci(c.exactMse, 2)}.`,
        'La convergenza in media quadratica implica quella in probabilità: per la disuguaglianza di Markov, P(|X_n - X| > ε) ≤ E[(X_n - X)²]/ε². Il contrario non vale, e nemmeno il legame con la convergenza quasi certa vale in un senso o nell’altro. Il picco Y_n = n·1{U < 1/n} va a 0 quasi certamente (appena n supera 1/U resta 0 per sempre), ma E[Y_n²] = n esplode: rari valori enormi bastano a rovinare la media quadratica, come una sola connessione gigante rovina la media dei byte (sezione 1.10). Bernoulli(1/n), al contrario, converge in L2 (E[X_n²] = 1/n) ma non quasi certamente.',
      ];
    },
    chartTitle: 'L’errore quadratico medio delle 1.000 regole e p(1 - p)/n, su assi logaritmici',
    tableTitle: 'L’errore quadratico medio, per n',
    cols: { n: 'n', simulated: 'Simulato', exact: 'p(1 - p)/n' },
    counterTitle: 'Due controesempi: quasi certa senza L2, L2 senza quasi certa',
    counterCols: { n: 'n', spikeP: 'Picco: P(Y_n ≠ 0)', spikeL2: 'Picco: E[Y_n²]', bernP: 'Bernoulli(1/n): P(X_n ≠ 0)', bernL2: 'Bernoulli(1/n): E[X_n²]' },
  },
  distribution: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'La convergenza in distribuzione è la più debole: chiede solo che la funzione di ripartizione di X_n si avvicini a quella di X, nei punti dove questa è continua. Non dice nulla sui valori di X_n e X sullo stesso esito: X_n = (-1)^n Z ha sempre la legge N(0, 1) di Z, quindi converge a Z in distribuzione, ma non si avvicina mai a Z. Quando il limite è una costante, convergere in distribuzione equivale a convergere in probabilità: per questo la legge dei grandi numeri si può dire in tutti e due i modi, F̂_n → p.',
        'Il teorema del limite centrale non parla del valore di F̂_n ma della forma del suo errore: √n (F̂_n - p)/σ converge in distribuzione alla normale standard. Più in generale, la somma standardizzata di n valori indipendenti con varianza finita. Il teorema di Berry-Esseen dice anche quanto in fretta: la distanza di Kolmogorov dalla normale (la massima differenza fra le due funzioni di ripartizione) non supera C ρ/(σ³ √n), con ρ = E|X - μ|³ e, per valori identicamente distribuiti, C = 0,4748 (Shevtsova, 2011).',
        `Le distanze del grafico sono esatte, non simulate: per i falsi allarmi la legge della somma è la binomiale, per i tempi fra due allarmi (esponenziali) è la Gamma. I falsi allarmi, rari e quindi asimmetrici, convergono lentamente: ${IT.num(at(10).bernoulli, 3)} a n = 10, ${IT.num(at(100).bernoulli, 3)} a 100, ${IT.num(at(1000).bernoulli, 3)} a 1.000. Gli esponenziali molto più in fretta: ${IT.num(at(10).exponential, 3)}, ${IT.num(at(100).exponential, 4)}, ${IT.num(at(1000).exponential, 4)}. Entrambi stanno sotto il loro limite di Berry-Esseen, e lo seguono come 1/√n.`,
      ];
    },
    tests: (c) => `Tre test di Kolmogorov-Smirnov su ${IT.int(CLT_REPS)} somme simulate (riepilogati nella sezione 4): ${IT.int(c.exponential.n)} esponenziali standardizzati contro la normale, D = ${IT.num(c.exponential.D, 4)}, p ≈ ${IT.p(c.exponential.p)}: con tanti campioni la regola pratica «n ≥ 30» non basta per una legge asimmetrica (la distanza esatta è ${IT.num(c.exponential.exact, 4)}). ${IT.int(c.uniform.n)} uniformi, la vecchia ricetta per generare valori normali: D = ${IT.num(c.uniform.D, 4)}, p = ${IT.p(c.uniform.p)}. La media di ${IT.int(c.cauchy.n)} valori di Cauchy contro la legge di Cauchy stessa: D = ${IT.num(c.cauchy.D, 4)}, p = ${IT.p(c.cauchy.p)}.`,
    chartTitle: 'Distanza di Kolmogorov dalla normale, esatta, e limite di Berry-Esseen, su assi logaritmici',
    tableTitle: 'Le distanze esatte e i limiti, per n',
    cols: { n: 'n', bernoulli: 'Falsi allarmi', bernoulliBound: 'Limite', exponential: 'Esponenziali', exponentialBound: 'Limite' },
  },
  tryClt: {
    intro: `Scegliete la legge e n: l’istogramma mostra ${IT.int(5000)} somme standardizzate, la curva la legge limite. Con n = 1 si vede la legge di partenza; crescendo n, la forma diventa la campana. Cauchy non ha varianza: le sue medie restano Cauchy, per ogni n.`,
    lawLabel: 'Legge',
    laws: { bernoulli: 'Falsi allarmi (Bernoulli 3%)', exponential: 'Tempi fra allarmi (esponenziale)', uniform: 'Uniforme', cauchy: 'Cauchy' },
    nLabel: 'n',
    result: (t, state) => `n = ${IT.int(state.n)}: distanza di Kolmogorov dalla ${t.cauchy ? 'legge di Cauchy' : 'normale'} ${IT.num(t.test.D, 4)}, test di Kolmogorov-Smirnov p = ${IT.p(t.test.p)}${t.outside > 0 ? `; ${art('il', IT.pct(t.outside))} delle somme cade fuori dal grafico` : ''}.`,
    chartTitle: 'Le somme standardizzate e la legge limite',
  },
  tryHash: {
    intro: 'Un servizio dà a ogni sessione un identificativo casuale di pochi bit. Quante sessioni bastano perché due abbiano lo stesso? È il paradosso del compleanno: con N valori possibili, la probabilità di una collisione fra m identificativi è 1 - (1 - 1/N)(1 - 2/N)...(1 - (m - 1)/N), e diventa 1/2 intorno a 1,18 √N. Lanciate le prove: la stima Monte Carlo converge alla probabilità esatta (legge dei grandi numeri), con oscillazioni che si stringono come 1/√r dentro la banda del limite centrale.',
    bitsLabel: 'Bit',
    factorLabel: 'Sessioni',
    factors: (m) => `${IT.int(m)}`,
    add100: '+ 100 prove',
    add1000: '+ 1.000 prove',
    result: (state, exact, m, bits) => (state.trials === 0
      ? `${IT.int(m)} identificativi di ${bits} bit: probabilità esatta di una collisione ${IT.pct(exact, 2)}.`
      : `${IT.int(state.trials)} prove, ${IT.int(state.hits)} con una collisione: stima ${IT.pct(state.hits / state.trials, 2)}, esatta ${IT.pct(exact, 2)}, scarto ${IT.num(Math.abs(state.hits / state.trials - exact) / Math.sqrt((exact * (1 - exact)) / state.trials), 2)} errori standard.`),
    thirtyTwo: (m) => `Con 32 bit la metà delle volte si ha una collisione già a ${IT.int(m)} sessioni: pochi per un servizio vero.`,
    chartTitle: 'La stima della probabilità di collisione, prova dopo prova, e la banda al 95% intorno al valore esatto',
  },
  map: {
    paras: [
      'Le quattro convergenze sono legate da implicazioni che valgono sempre. Quasi certa implica in probabilità. In media quadratica implica in probabilità (Markov), e più in generale in L^p implica in L^q per q < p. In probabilità implica in distribuzione. Ogni altra freccia è falsa, e per ciascuna c’è un controesempio fra le successioni della prova della sezione 1.2.',
      'Due rovesci parziali valgono: la convergenza in distribuzione a una costante implica quella in probabilità; e da una successione che converge in probabilità si può sempre estrarne una che converge quasi certamente (Riesz). Con un dominio sulle code (uniforme integrabilità) la convergenza in probabilità torna anche in media.',
    ],
    tableTitle: 'Da un modo all’altro',
    cols: { from: 'Se converge', to: 'allora converge', holds: 'Vale?', counter: 'Controesempio' },
  },
  tryMap: {
    intro: 'Cliccate un modo di convergenza: si accendono in verde quelli che implica, in rosso quelli che non implica, ciascuno con il suo controesempio.',
    modes: { as: 'Quasi certa', l2: 'In media quadratica', probability: 'In probabilità', distribution: 'In distribuzione' },
    pick: 'Scegliete un modo per vedere che cosa implica.',
    result: (mode, list) => `${it.tryMap.modes[mode]} implica: ${list.holds.length ? listOf(list.holds.map((m) => it.tryMap.modes[m].toLowerCase()), 'e') : 'solo se stessa'}. Non implica: ${list.fails.length ? listOf(list.fails.map((f) => `${it.tryMap.modes[f.mode].toLowerCase()} (controesempio: ${it.trySequences.names[f.counter]})`), 'e') : 'niente'}.`,
    diagramLabel: 'La mappa delle implicazioni fra i quattro modi di convergenza',
  },
  heavy: {
    paras: (b) => [
      'La legge dei grandi numeri chiede una media finita; il limite centrale con la sua √n, una varianza finita. Quando mancano, o quando le code sono così pesanti che la varianza esiste solo sulla carta, √n non basta più. La legge di Cauchy non ha né l’una né l’altra: la media di n suoi valori ha di nuovo la legge di Cauchy, larga quanto un valore solo. Le medie del grafico saltano per sempre, perché ogni tanto arriva un valore enorme che le sposta.',
      `I byte inviati dalle ${IT.int(b.n)} connessioni di NSL-KDD hanno media e varianza finite, ma code pesantissime: media ${IT.int(b.mean)} byte, mediana ${IT.int(b.median)}, massimo ${IT.int(b.max)}; ${IT.int(b.zeros)} connessioni non inviano nulla, e le 10 più grandi portano ${art('il', IT.pct(b.top10))} di tutti i byte (la sola più grande ${art('il', IT.pct(b.top1))}). L’asimmetria vale ${IT.num(b.skewness, 1)}. Il teorema di Berry-Esseen promette una distanza dalla normale sotto 0,05 solo da ${IT.int(b.needed)} connessioni in su.`,
    ],
    bytes: (rows) => `Per vederlo si estraggono ${IT.int(BYTES_REPS)} campioni di n connessioni con ripetizione, e se ne standardizza la media con la media e la deviazione standard vere. Con n = 1.000 la distanza dalla normale è ancora ${IT.num(rows[2].D, 3)}, e ${art('il', IT.pct(rows[2].below))} delle medie cade sotto la media vera: quasi tutti i campioni non contengono le connessioni giganti, e i pochi che le contengono saltano lontano. Una soglia d’allarme costruita sulla normale per «i byte medi di 1.000 connessioni» sbaglierebbe di molto: meglio la mediana, i logaritmi o la teoria dei valori estremi.`,
    cauchyTitle: 'Otto medie di valori di Cauchy, valore dopo valore: non si fermano',
    factsTitle: 'I byte delle connessioni di NSL-KDD',
    facts: { mean: 'Media', median: 'Mediana', sd: 'Deviazione standard', max: 'Massimo', zeros: 'Connessioni senza byte', top10: 'Quota delle 10 più grandi', skewness: 'Asimmetria', ratio: 'ρ/σ³ di Berry-Esseen', needed: 'n per distanza < 0,05' },
    histTitle: 'Le medie standardizzate di 1.000 connessioni e la densità normale',
    tableTitle: 'Le medie di n connessioni, contro la normale',
    cols: { n: 'n', D: 'Distanza', p: 'p-value', below: 'Sotto la media vera', median: 'Mediana standardizzata' },
  },
  speed: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'La legge dei grandi numeri dice che la probabilità di sbagliare va a zero; per decidere quante connessioni servono bisogna sapere quanto in fretta. Chebyshev usa solo la varianza e scende come 1/n. Hoeffding (1963) usa il fatto che i valori stanno fra 0 e 1 e scende in modo esponenziale, 2 exp(-2 n ε²). Il limite centrale dà un’approssimazione, non un limite: 2 Φ(-ε √n/σ).',
        `Per i falsi allarmi ${art('al', IT.pct(FALSE_ALARMS.rate, 0))} con un punto di tolleranza, a n = 10.000 la probabilità esatta è ${IT.prob(at(10000).exact)}, Chebyshev dice ${IT.prob(at(10000).chebyshev)}, Hoeffding ${IT.prob(at(10000).hoeffding)}: qui Hoeffding è peggio di Chebyshev, perché non sa che la varianza p(1 - p) è piccola. A n = 100.000 l’esponenziale vince (${IT.prob(at(100000).hoeffding)} contro ${IT.prob(at(100000).chebyshev)}), mentre la probabilità vera è ${IT.prob(at(100000).exact)}. La normale segue la probabilità esatta da vicino, ma nelle code lontane può sbagliare di ordini di grandezza: lo dice Berry-Esseen, che controlla la distanza assoluta, non quella relativa.`,
      ];
    },
    chartTitle: 'P(|F̂_n - 3%| > 1 punto): esatta, i due limiti e la normale, su assi logaritmici',
    tableTitle: 'La probabilità di una deviazione e i suoi limiti, per n',
    cols: { n: 'n', exact: 'Esatta', chebyshev: 'Chebyshev', hoeffding: 'Hoeffding', normal: 'Normale' },
  },
  bvm: {
    paras: (rows) => {
      const first = rows[0];
      const at = (n) => rows.find((r) => r.n === n);
      const last = rows[rows.length - 1];
      return [
        `Le due parti della consegna si incontrano qui. Due analisti guardano la stessa lunga campagna di phishing, fino a ${IT.int(last.n)} e-mail alla quota vera ${art('del', IT.pct(CAMPAIGN.rate, 0))}: uno con il prior uniforme, l’altro con un prior sbagliato e sicuro di sé, Beta(${PRIORS.wrong.join(', ')}), centrato ${art('sul', IT.pct(PRIORS.wrong[0] / (PRIORS.wrong[0] + PRIORS.wrong[1]), 0))} e forte quanto ${IT.int(PRIORS.wrong[0] + PRIORS.wrong[1])} e-mail. Dopo ${IT.int(first.n)} e-mail le loro medie sono ${IT.pct(first.uniform.mean)} e ${IT.pct(first.wrong.mean)}; dopo ${IT.int(1000)}, ${IT.pct(at(1000).uniform.mean)} e ${IT.pct(at(1000).wrong.mean)}; dopo ${IT.int(last.n)}, ${IT.pct(last.uniform.mean)} e ${IT.pct(last.wrong.mean)}.`,
        `Il posterior converge alla quota vera (consistenza, Doob 1949): quasi certamente, come la media dei click. E diventa normale: il teorema di Bernstein-von Mises dice che, con n grande, il posterior è circa N(θ̂, θ̂(1 - θ̂)/n), qualunque prior regolare si sia usato. La distanza di Kolmogorov fra ogni posterior e la sua normale scende come 1/√n (${IT.num(at(100).uniform.distance, 4)} a n = 100, ${IT.num(last.uniform.distance, 4)} a ${IT.int(last.n)}). Per questo, con tanti dati, l’intervallo di credibilità e quello di confidenza coincidono, e il prior smette di contare. Con pochi dati, come nel primo giorno della sezione 2.6, conta eccome.`,
      ];
    },
    chartTitle: 'La media a posteriori dei due analisti, con ±1,96 deviazioni standard, al crescere delle e-mail',
    chart2Title: 'La distanza di Kolmogorov fra ogni posterior e la sua approssimazione normale',
    tableTitle: 'I due posterior, per n',
    cols: { n: 'n', clicks: 'Click', uniform: 'Prior uniforme', wrong: 'Prior sbagliato', dUniform: 'Distanza (uniforme)', dWrong: 'Distanza (sbagliato)' },
    pair: (x) => `${IT.pct(x.mean, 2)} ± ${IT.pct(1.96 * x.sd, 2)}`,
  },
  roles: {
    intro: 'I quattro modi di convergenza sono la lingua in cui si scrivono i teoremi limite. La tabella dice quale modo usa ciascuno, sotto quali condizioni, e dove la pagina lo mostra.',
    tableTitle: 'I teoremi limite e i loro modi di convergenza',
    cols: { theorem: 'Teorema', statement: 'Che cosa converge', mode: 'Modo', condition: 'Condizioni', where: 'Sezione' },
    rows: [
      { theorem: 'Legge debole dei grandi numeri', statement: 'X̄_n → μ', mode: 'in probabilità', condition: 'indipendenti con varianza finita (Chebyshev); basta la media finita (Khinchin)', where: '1.1' },
      { theorem: 'Legge forte dei grandi numeri', statement: 'X̄_n → μ', mode: 'quasi certa', condition: 'indipendenti e identicamente distribuite, con media finita (Kolmogorov)', where: '1.2' },
      { theorem: 'Legge dei grandi numeri in L²', statement: 'E[(X̄_n - μ)²] = σ²/n → 0', mode: 'in media quadratica', condition: 'non correlate, con varianza finita', where: '1.3' },
      { theorem: 'Limite centrale', statement: '√n (X̄_n - μ)/σ → N(0, 1)', mode: 'in distribuzione', condition: 'indipendenti e identicamente distribuite, con varianza finita (Lindeberg-Lévy)', where: '1.4' },
      { theorem: 'Berry-Esseen', statement: 'sup |F_n - Φ| ≤ C ρ/(σ³ √n)', mode: 'velocità in distribuzione', condition: 'terzo momento finito', where: '1.4, 1.11' },
      { theorem: 'Legge dei grandi numeri in distribuzione', statement: 'X̄_n → μ, una costante', mode: 'in distribuzione, che qui equivale a in probabilità', condition: 'come la legge debole', where: '1.4' },
    ],
    after: 'Le due leggi dicono che la media si avvicina alla media vera: la debole a ogni n fissato, la forte lungo ogni traiettoria, la versione in L² anche in media. Il limite centrale dice come si distribuisce l’errore che resta, e quindi quanto è grande: circa σ/√n. È la combinazione che serve all’inferenza. La legge dei grandi numeri garantisce che la stima va nel posto giusto; il limite centrale dà la forma della sua incertezza, con cui si costruiscono intervalli e test.',
  },
  results: {
    intro: 'Molti risultati della statistica sono teoremi di convergenza travestiti. Quattro, con i numeri dei falsi allarmi e dei tempi fra allarmi.',
    consistency: 'Consistenza. Uno stimatore è consistente se converge al parametro: debolmente (in probabilità) o fortemente (quasi certamente). La quota di falsi allarmi F̂_n è consistente in tutti e due i sensi, per le due leggi dei grandi numeri; e lo è ogni funzione continua di uno stimatore consistente (teorema della mappa continua), come 1/X̄ per un tasso.',
    slutsky: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return `Slutsky (1925). Se X_n converge in distribuzione a X e Y_n in probabilità a una costante c, allora X_n + Y_n converge a X + c e X_n Y_n a c X. È ciò che rende normale la statistica t: nel limite centrale σ è quella vera, nella pratica la si stima, e la stima converge in probabilità, quindi il limite non cambia. Ma è un risultato asintotico. Per i falsi allarmi al ${IT.pct(FALSE_ALARMS.rate, 0)} la statistica t, con σ stimata, dista dalla normale ${IT.num(at(30).t, 3)} a n = 30, contro ${IT.num(at(30).z, 3)} con σ nota; a n = 1.000 la differenza si è quasi chiusa (${IT.num(at(1000).t, 4)} contro ${IT.num(at(1000).z, 4)}).`;
    },
    delta: (d100, d1000) => `Il metodo delta. Se √n (θ̂ - θ) converge a N(0, σ²) e g è derivabile, allora √n (g(θ̂) - g(θ)) converge a N(0, g'(θ)² σ²): l’errore di una funzione della stima si ottiene derivando. Per le log-quote ln(p/(1 - p)) la derivata è 1/(p(1 - p)), e la deviazione standard approssimata è 1/√(n p(1 - p)): ${IT.num(d1000.delta, 4)} a n = 1.000, contro ${IT.num(d1000.exact, 4)} esatta. A n = 100 lo scarto è più grande (${IT.num(d100.delta, 3)} contro ${IT.num(d100.exact, 3)}), e ${art('il', IT.pct(d100.excluded, 1))} delle volte, con zero allarmi, le log-quote non esistono nemmeno.`,
    gc: (rows) => {
      const first = rows[0];
      const last = rows[rows.length - 1];
      return `Glivenko-Cantelli (1933). La funzione di ripartizione empirica F_n converge a quella vera uniformemente, quasi certamente: sup |F_n - F| → 0. Kolmogorov ne diede anche la velocità: √n sup |F_n - F| converge in distribuzione a una legge che porta il suo nome, la base del test di Kolmogorov-Smirnov usato in tutta la pagina. Su ${IT.int(GC_REPS)} campioni di tempi fra allarmi la distanza media scende da ${IT.num(first.meanD, 3)} (n = ${IT.int(first.n)}) a ${IT.num(last.meanD, 4)} (n = ${IT.int(last.n)}), mentre √n per la distanza resta fra ${IT.num(Math.min(...rows.map((r) => r.meanScaled)), 2)} e ${IT.num(Math.max(...rows.map((r) => r.meanScaled)), 2)}, vicino alla media della legge di Kolmogorov, ${IT.num(KOLMOGOROV_MEAN, 3)}.`;
    },
    mle: (rows) => {
      const at = (n) => rows.find((r) => r.n === n).mle;
      return `La normalità dello stimatore di massima verosimiglianza. Sotto condizioni di regolarità √n (θ̂ - θ) converge a N(0, 1/I(θ)), con I l’informazione di Fisher, e la varianza 1/(n I(θ)) è la più piccola possibile per uno stimatore non distorto (Cramér-Rao). Per il tasso λ degli allarmi, stimato dai tempi fra l’uno e l’altro con λ̂ = n/S_n, la legge è nota esattamente: a n = 30 dista dalla normale ${IT.num(at(30).distance, 3)}, è distorto ${art('del', IT.pct(at(30).bias, 1))} e ha una varianza ${IT.num(at(30).efficiency, 2)} volte il limite di Cramér-Rao; a n = 1.000 la distanza è ${IT.num(at(1000).distance, 4)} e la varianza tocca il limite. È il lato frequentista del teorema di Bernstein-von Mises (sezione 2.11).`;
    },
    chartTitle: 'Distanza di Kolmogorov dalla normale: σ nota, σ stimata (Slutsky) e stimatore di massima verosimiglianza, su assi logaritmici',
    tableTitle: 'Le tre distanze, per n',
    cols: { n: 'n', z: 'Z, σ nota', t: 't, σ stimata', mle: 'MLE del tasso', bias: 'Distorsione del MLE', efficiency: 'Varianza / Cramér-Rao' },
    deltaTitle: 'Il metodo delta sulle log-quote',
    deltaCols: { n: 'n', exact: 'Deviazione standard esatta', delta: 'Metodo delta', excluded: 'Senza log-quote (k = 0)' },
    gcTitle: 'Glivenko-Cantelli: la distanza fra la funzione di ripartizione empirica e quella vera',
    gcCols: { n: 'n', meanD: 'Distanza media', meanScaled: '√n per la distanza', over: 'Oltre 1,358 (atteso 5%)' },
  },
  root: {
    paras: (sizes) => [
      'La somma di n valori ha varianza Var(S_n) = Σ Var(X_i) + 2 Σ_{i<j} Cov(X_i, X_j). Se i valori sono indipendenti, o anche solo non correlati, le covarianze sono zero e le varianze si sommano: Var(S_n) = n σ². La deviazione standard, la radice della varianza, cresce quindi come σ √n e non come n; dividendo per n, la media ha deviazione standard σ/√n, l’errore standard.',
      `Ecco perché √n è ovunque. Nella legge dei grandi numeri l’errore della media scende come 1/√n. Nel limite centrale bisogna moltiplicare l’errore proprio per √n per avere una legge che non collassa e non esplode (la prova qui sotto lo fa vedere). Nell’inferenza ogni intervallo è largo circa 2σ/√n, ogni statistica z o t divide per σ/√n, e il campione necessario cresce con il quadrato della precisione: per stimare il ${IT.pct(FALSE_ALARMS.rate, 0)} di falsi allarmi a più o meno un punto, al 95%, bastano ${IT.int(sizes[0])} connessioni; a mezzo punto ne servono ${IT.int(sizes[1])}, a un decimo di punto ${IT.int(sizes[2])}. Dimezzare l’errore costa quattro volte i dati.`,
      'Anche le velocità della sezione 1.11 parlano di √n: Berry-Esseen scende come 1/√n, e la disuguaglianza di Hoeffding, exp(-2 n ε²), dice che le deviazioni che contano sono quelle di ordine 1/√n. Il grafico mostra le due facce dello stesso fatto sulle 1.000 regole simulate: la deviazione standard del conteggio cresce come √n, l’errore standard della quota scende come 1/√n, tutti e due con pendenza 1/2 su assi logaritmici.',
    ],
    chartTitle: 'Deviazione standard del conteggio (cresce come √n) ed errore standard della quota (scende come 1/√n), simulati ed esatti, su assi logaritmici',
    tableTitle: 'Il conteggio e la quota di falsi allarmi, per n',
    cols: { n: 'n', sdCount: 'Deviazione standard del conteggio', exactCount: 'σ √n', sdShare: 'Errore standard della quota', exactShare: 'σ/√n' },
    inferenceTitle: 'L’errore standard e l’intervallo al 95% della quota di falsi allarmi',
    inferenceCols: { n: 'n', variance: 'Var(S_n) = n p(1 - p)', se: 'Errore standard', half: 'Semiampiezza al 95%' },
  },
  tryScale: {
    intro: `Scegliete α: i tre istogrammi mostrano n^α (media - 1) per ${IT.int(SCALE_REPS)} medie di n tempi fra allarmi esponenziali (di media 1 minuto), con n = 10, 100 e 1.000, sullo stesso asse. Con α minore di 1/2 gli istogrammi si stringono verso lo zero al crescere di n: è la legge dei grandi numeri. Con α maggiore di 1/2 si allargano ed escono dal grafico. Solo con α = 1/2 restano uguali e prendono la forma della normale: è la scala del limite centrale.`,
    alphaLabel: (a) => `α = ${IT.plain(a)}`,
    chartTitle: (n) => `n = ${IT.int(n)}`,
    result: (charts, alpha) => `α = ${IT.plain(alpha)}: la deviazione standard è ${listOf(charts.map((c) => `${IT.num(c.factor, 3)} a n = ${IT.int(c.n)}`), 'e')}${charts.some((c) => c.outside > 0.001) ? `; fuori dal grafico ${listOf(charts.map((c) => IT.pct(c.outside)), 'e')}` : ''}.`,
  },
  bursts: {
    paras: (f05, f09) => [
      'Tutto questo poggia sull’indipendenza, o almeno sull’assenza di correlazione. Ma i falsi allarmi veri arrivano spesso a raffiche: un backup notturno, una scansione pianificata, una configurazione sbagliata fanno scattare molti allarmi di fila. Il modello più semplice è una catena di Markov: dopo un allarme il successivo arriva con probabilità p + ρ(1 - p), dopo una connessione tranquilla con probabilità p(1 - ρ). La quota di lungo periodo resta p, ma due connessioni vicine hanno correlazione ρ, e due a distanza k hanno correlazione ρ^k.',
      `Le covarianze non sono più zero, e la varianza della somma diventa n p(1 - p) [1 + 2 Σ (1 - k/n) ρ^k], che per n grande vale circa n p(1 - p)(1 + ρ)/(1 - ρ). Con ρ = ${IT.plain(f05.rho)} la varianza di ${IT.int(f05.n)} connessioni è ${IT.num(f05.factor, 2)} volte quella indipendente: è come avere ${IT.int(f05.effective)} connessioni indipendenti invece di ${IT.int(f05.n)}. Con ρ = ${IT.plain(f09.rho)} il fattore è ${IT.num(f09.factor, 1)}, e le connessioni effettive sono ${IT.int(f09.effective)}. La legge dei grandi numeri vale ancora, perché le correlazioni si spengono, e anche il limite centrale con √n; ma la costante davanti a 1/√n è più grande.`,
    ],
    simulation: (rows) => {
      const at = (rho) => rows.find((r) => r.rho === rho);
      return `La simulazione di ${IT.int(BURST_SECTION.reps)} finestre di ${IT.int(BURST_SECTION.n)} connessioni lo conferma: varianza ${IT.num(at(0.5).variance, 1)} (esatta ${IT.num(at(0.5).exact.variance, 1)}) con ρ = 0,5 e ${IT.num(at(0.9).variance, 1)} (${IT.num(at(0.9).exact.variance, 1)}) con ρ = 0,9. Il guaio è per chi ignora la dipendenza: l’intervallo al 95% calcolato come se le connessioni fossero indipendenti copre la quota vera solo ${art('il', IT.pct(at(0.5).coverage, 1))} delle volte con ρ = 0,5 e ${art('il', IT.pct(at(0.9).coverage, 1))} con ρ = 0,9. In statistica è il problema della dimensione effettiva del campione, comune nelle serie temporali e nei log.`;
    },
    after: 'Quando la dipendenza non si spegne abbastanza in fretta (memoria lunga) cambia anche la velocità: l’errore della media scende come n^(H - 1), con H > 1/2, più piano di 1/√n. E quando le variabili non hanno nemmeno varianza finita, come nella sezione 1.10, √n non c’entra più.',
    tableTitle: 'Le raffiche simulate, contro la varianza esatta e l’intervallo ingenuo',
    cols: { rho: 'ρ', variance: 'Varianza simulata', exact: 'Varianza esatta', factor: 'Fattore', effective: 'Connessioni effettive', coverage: 'Copertura dell’intervallo ingenuo', predicted: 'Copertura prevista' },
  },
  tryBursts: {
    intro: 'Scegliete la correlazione fra connessioni vicine. Le due strisce mostrano le prime 400 connessioni, indipendenti e a raffiche, con la stessa quota media del 3%; il grafico mostra l’errore standard esatto della quota al crescere di n. Le due rette sono parallele, con pendenza -1/2: √n resta, cambia la costante.',
    rhoLabel: (r) => `Correlazione ρ = ${IT.plain(r)}`,
    strips: { independent: 'Indipendenti', bursts: 'A raffiche' },
    stripLabel: (name, alarms, total) => `${name}: ${IT.int(alarms)} ${alarms === 1 ? 'allarme' : 'allarmi'} nelle prime ${IT.int(total)} connessioni`,
    result: (f) => `ρ = ${IT.plain(f.rho)}: con ${IT.int(f.n)} connessioni la varianza è ${IT.num(f.factor, 2)} volte quella indipendente, come ${IT.int(f.effective)} connessioni indipendenti; l’intervallo al 95% ingenuo copre circa ${art('il', IT.pct(f.coverage, 1))}.`,
    chartTitle: 'Errore standard della quota di allarmi, indipendenti e a raffiche, su assi logaritmici',
  },
  conditional: {
    paras: [
      'La probabilità di A dato B è P(A | B) = P(A ∩ B)/P(B), con P(B) > 0: la probabilità di A ricalcolata nel mondo ristretto in cui B è accaduto. Ne discendono tre regole. Quella del prodotto, P(A ∩ B) = P(A | B) P(B), che si estende a una catena di eventi. Quella della probabilità totale, P(A) = Σ_i P(A | B_i) P(B_i) su una partizione. E l’indipendenza: A e B sono indipendenti quando P(A | B) = P(A), cioè quando sapere B non cambia niente.',
      'In statistica la probabilità condizionata è ovunque, spesso senza nome. La verosimiglianza è la probabilità dei dati condizionata al parametro, P(dati | θ). Un p-value è la probabilità, condizionata all’ipotesi nulla, di dati almeno così estremi. La copertura di un intervallo di confidenza è condizionata al valore vero. E il teorema di Bayes rovescia il condizionamento, da P(dati | θ) a P(θ | dati). Confondere le due direzioni è l’errore più comune della statistica applicata; i tre esempi che seguono lo mostrano da vicino.',
    ],
    chainIntro: 'La regola del prodotto: la catena di un attacco di phishing, stadio per stadio. Ogni probabilità è condizionata agli stadi precedenti: fra le e-mail recapitate, quante vengono aperte; fra quelle aperte, quante cliccate; e così via. I numeri sono ordini di grandezza plausibili, non dati.',
    chainTitle: 'La catena di un attacco: le probabilità condizionate e il loro prodotto',
    chainCols: { stage: 'Stadio', p: 'P(stadio | precedenti)', cumulative: 'P(arrivare fin qui)' },
    stages: { delivered: 'Supera il filtro', opened: 'Viene aperta', clicked: 'Il link viene cliccato', credentials: 'Si inseriscono le credenziali', mfa: 'L’MFA viene aggirato' },
    chainText: (c) => `Per una sola e-mail la violazione ha probabilità ${IT.pct(c.breach, 2)}, il prodotto delle cinque condizionate. Ma una campagna è fatta di molte e-mail, e la probabilità di almeno una violazione è 1 - (1 - p)^m: con 100 e-mail vale ${IT.pct(c.campaigns[1].breach)}, con 1.000 ${IT.pct(c.campaigns[2].breach)}. Senza l’MFA, l’ultimo anello, la probabilità per e-mail sale ${art('al', IT.pct(c.withoutMfa, 1))}, e su 1.000 e-mail la violazione è quasi certa: la probabilità di evitarla è ${IT.sci(1 - c.campaigns[2].withoutMfa, 1)}. Ogni anello moltiplica: per questo la difesa a più livelli funziona.`,
    indepIntro: 'Indipendenza e indipendenza condizionata non si implicano a vicenda. La rete del triage della sezione 2.4 ne dà un esempio in ciascun verso.',
    indepTitle: 'Le due cause della rete, prima e dopo l’allarme dell’EDR',
    indepCols: { when: '', phishing: 'P(phishing)', exploit: 'P(exploit)', product: 'Prodotto', both: 'P(entrambi)' },
    indepRows: { before: 'Senza indizi', after: 'Dato l’allarme EDR' },
    indepText: (f) => `A priori phishing ed exploit sono indipendenti: la probabilità di tutti e due è il prodotto delle due. Dato l’allarme dell’EDR, il loro effetto comune, non lo sono più: P(entrambi | EDR) = ${IT.pct(f.causesGivenEdr.both, 2)}, mentre il prodotto sarebbe ${IT.pct(f.causesGivenEdr.phishing * f.causesGivenEdr.exploit, 2)}; una causa rende meno probabile l’altra. Al contrario, l’accesso insolito e l’allarme dell’EDR sono dipendenti (P(accesso insolito) passa da ${IT.pct(f.login, 1)} a ${IT.pct(f.loginGivenEdr, 1)} quando l’EDR suona), ma sapendo che c’è stato un phishing diventano indipendenti: P(accesso insolito | phishing) = ${IT.pct(f.loginGivenPhishing, 1)} con l’EDR e senza. Il naive Bayes delle sezioni 2.8 e 2.9 assume proprio un’indipendenza condizionata, delle parole o dei campi data la classe; e il paradosso di Simpson dell’Homework #6 è un’associazione che si rovescia condizionando a un terzo fattore.`,
    pvalueIntro: (e) => `Un p-value è una probabilità condizionata all’ipotesi nulla, non la probabilità dell’ipotesi nulla. Una regola dell’IDS è documentata con ${art('il', IT.pct(e.p0, 0))} di falsi allarmi; su ${IT.int(e.n)} connessioni benigne ne dà ${IT.int(e.k)}. H0: la quota è ancora ${art('il', IT.pct(e.p0, 0))}; H1: la regola è peggiorata ${art('al', IT.pct(e.p1, 0))}.`,
    pvalueText: (e) => `Il p-value è P(almeno ${IT.int(e.k)} allarmi | H0) = ${IT.p(e.pValue)}: sotto il 5%, quindi H0 si rifiuta. Ma la probabilità che H0 sia vera richiede Bayes e un prior. Se di solito le regole restano come documentate, P(H0) = ${IT.pct(e.priorH0, 0)}, con un rapporto di verosimiglianza di ${IT.num(e.lr, 1)} a favore di H1 si ottiene P(H0 | dati) = ${IT.pct(e.posteriorH0, 1)}; con un prior di metà e metà sarebbe ${IT.pct(e.posteriorEven, 1)}. Il p-value non dipende dal prior; la probabilità di H0 sì.`,
    manyText: (f) => `Lo stesso succede su molti test: fra le ipotesi rifiutate, quante sono vere? Dipende da quante delle ipotesi testate hanno davvero un effetto, il tasso di base della sezione 2.3. Con ${art('il', IT.pct(f.real, 0))} di effetti veri, potenza ${art('del', IT.pct(f.power, 0))} e α = ${IT.plain(f.alpha)}, ${art('il', IT.pct(f.falseDiscovery, 0))} dei rifiuti sono falsi: è il tasso di falsi rilevamenti (Benjamini e Hochberg, 1995), e la ragione per cui Ioannidis (2005) scrisse che molti risultati pubblicati sono falsi.`,
  },
  tryPvalue: {
    intro: 'Muovete i cursori: la quota delle ipotesi testate che hanno un effetto vero, la potenza del test e α. I quadratini sono 1.000 test: verdi le scoperte vere, viola gli effetti mancati, rossi i rifiuti sbagliati, grigi le ipotesi nulle vere lasciate stare. Ogni test rifiuta allo stesso modo, con p sotto α; quello che cambia è la probabilità che un rifiuto sia giusto.',
    real: (v) => `Effetti veri: ${IT.pct(v, 0)}`,
    power: (v) => `Potenza: ${IT.pct(v, 0)}`,
    alpha: (v) => `α: ${IT.plain(v)}`,
    iconTitle: 'Mille test: ogni quadratino è un’ipotesi',
    tableTitle: 'Le quattro categorie dei test',
    cols: { category: 'Categoria', truth: 'Verità', decision: 'Decisione', count: 'Test', share: 'Quota' },
    truth: { trueDiscovery: 'effetto vero', missedEffect: 'effetto vero', falseDiscovery: 'H0 vera', trueNull: 'H0 vera' },
    decision: { trueDiscovery: 'rifiutata', missedEffect: 'non rifiutata', falseDiscovery: 'rifiutata', trueNull: 'non rifiutata' },
    result: (f) => `Su ${IT.int(f.total)} test: ${IT.int(f.counts[0])} scoperte vere, ${IT.int(f.counts[2])} false, ${IT.int(f.counts[1])} effetti mancati. P(H0 vera | rifiutata) = ${IT.pct(f.falseDiscovery, 1)}.`,
  },
  limits: {
    intro: `Gli esempi della sezione 2 mostrano che cosa dà l’inferenza bayesiana e che cosa costa. La tabella prende la campagna di phishing della sezione 2.6 e la guarda con i quattro prior, dopo uno, tre e dieci giorni. La conclusione «serve un’altra formazione» si prende quando P(quota > ${IT.pct(TARGET_RATE, 0)}) supera ${art('il', IT.pct(DECISION_LEVEL, 0))}.`,
    tableTitle: (level) => `La stessa campagna con quattro prior: media a posteriori e P(quota > ${IT.pct(TARGET_RATE, 0)}); ✓ quando supera ${art('il', IT.pct(level, 0))}`,
    cols: { prior: 'Prior', day1: 'Dopo 1 giorno', days3: 'Dopo 3 giorni', days10: 'Dopo 10 giorni' },
    cell: (x) => `${IT.pct(x.mean)}; P = ${IT.pct(x.above)}${x.act ? ' ✓' : ''}`,
    paras: (rows) => {
      const spread = (r, keys) => {
        const means = keys.map((k) => r.priors[k].mean);
        return [Math.min(...means), Math.max(...means)];
      };
      const fair = ['uniform', 'jeffreys', 'informed'];
      const [a1, b1] = spread(rows[0], fair);
      const [a10, b10] = spread(rows[rows.length - 1], fair);
      return [
        `Con un giorno di dati i tre prior ragionevoli danno medie da ${IT.pct(a1)} a ${IT.pct(b1)}; dopo dieci giorni da ${IT.pct(a10)} a ${IT.pct(b10)}. Il prior sbagliato e sicuro di sé resta lontano più a lungo (${IT.pct(rows[0].priors.wrong.mean)}, poi ${IT.pct(rows[rows.length - 1].priors.wrong.mean)}): gli servono molti più dati, come mostra la sezione 2.11. Qui la decisione è la stessa per tutti, perché i dati sono chiari; con dati al limite il prior può spostarla.`,
        'I vantaggi. Il prior porta un’informazione che i dati da soli non hanno: il tasso di base dell’allarme (2.3) è conoscenza vera, e ignorarlo porta alla fallacia. Il posterior risponde direttamente alle domande che contano, come P(quota > 10%), che un p-value non dà (2.1). L’aggiornamento è sequenziale e coerente (2.5, 2.6), funziona anche con pochi dati e con modelli strutturati come le reti (2.4), e porta in modo naturale alle decisioni.',
        'I limiti. Il prior va scelto, e con pochi dati la scelta conta; un prior sbagliato e sicuro di sé rallenta l’apprendimento (2.11), e uno che dà probabilità zero a un valore non potrà mai cambiare idea. La verosimiglianza può essere sbagliata: il naive Bayes conta due volte le prove dipendenti e diventa troppo sicuro (2.9). Le probabilità di una rete sono spesso stime di esperti (2.4). E fuori dai casi coniugati il posterior va calcolato con metodi numerici, su una griglia (2.6) o con Monte Carlo.',
        'L’influenza sulle conclusioni si misura con un’analisi di sensibilità, come la tabella: si ripete l’inferenza con prior diversi e plausibili, e si dichiara la conclusione solo se regge. Con molti dati il prior conta sempre meno (Bernstein-von Mises, 2.11); con pochi va scelto con cura e dichiarato.',
      ];
    },
  },
  checks: {
    intro: 'Ogni numero della pagina è controllato contro un riferimento indipendente: le funzioni speciali contro SciPy 1.17.1 e mpmath a 50 cifre; l’allarme e la rete contro un calcolo esatto con le frazioni; il test di Wald, le coperture, le distanze esatte, i due filtri contro un’implementazione in Python scritta a parte; le simulazioni contro lo stesso Python con una sua copia dei generatori, che con lo stesso seme deve dare gli stessi numeri; i generatori contro il loro codice C di riferimento.',
    summary: (ok, total) => `${ok} verifiche superate su ${total}`,
    details: (n) => `Le ${n} verifiche, una per una`,
    cols: { check: 'Verifica', expected: 'Atteso', actual: 'Ottenuto', result: 'Esito' },
    groups: { functions: 'Le funzioni speciali', bayes: 'Bayes: allarme, rete, Wald, coperture', filters: 'I due filtri naive Bayes', convergence: 'Le convergenze', simulation: 'Le simulazioni (seme 2026)', generator: 'Il generatore' },
    ok: 'superata',
    failed: 'fallita',
    pending: 'in attesa delle simulazioni',
  },
  tests: {
    intro: `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. L’esito atteso è quello che la teoria fa prevedere: quando l’ipotesi nulla è vera, un test al 5% la rifiuta comunque una volta su venti.`,
    cols: { subject: 'Che cosa si verifica', hypothesis: 'Ipotesi nulla H0', statistic: 'Statistica', p: 'p-value', verdict: 'Esito', expected: 'Atteso' },
    rows: {
      generator: { subject: 'Il generatore della pagina', hypothesis: 'La media di 100.000 valori uniformi è 1/2 (test z)' },
      sprtLegit: { subject: `Wald, ${IT.int(SPRT_RUNS)} utenti simulati`, hypothesis: 'La quota di utenti bloccati è quella esatta (binomiale)' },
      sprtAttacker: { subject: `Wald, ${IT.int(SPRT_RUNS)} attaccanti simulati`, hypothesis: 'La quota di attaccanti liberati è quella esatta' },
      coverage: { subject: `Jeffreys, ${IT.int(COVERAGE_RUNS)} campagne simulate`, hypothesis: 'La copertura simulata è quella esatta' },
      smsFilter: { subject: 'Il filtro antispam contro «tutto legittimo»', hypothesis: 'I due sbagliano allo stesso modo (McNemar)' },
      kddFilter: { subject: 'Naive Bayes su NSL-KDD contro «tutto attacco»', hypothesis: 'I due sbagliano allo stesso modo (McNemar)' },
      cltExponential: { subject: 'Somme di 30 esponenziali standardizzate', hypothesis: 'Hanno legge normale (Kolmogorov-Smirnov)' },
      cltUniform: { subject: 'Somme di 12 uniformi standardizzate', hypothesis: 'Hanno legge normale' },
      cltCauchy: { subject: 'Medie di 100 valori di Cauchy', hypothesis: 'Hanno la legge di Cauchy standard' },
      bytes: { subject: 'Medie dei byte di 1.000 connessioni', hypothesis: 'Hanno legge normale' },
      hash: { subject: `${IT.int(HASH_TEST.trials)} prove di identificativi a ${HASH_TEST.bits} bit`, hypothesis: 'La quota di collisioni è quella esatta' },
      gc: { subject: `Glivenko-Cantelli: √n per la distanza, ${IT.int(GC_REPS)} campioni di 1.000`, hypothesis: 'Ha la legge di Kolmogorov' },
    },
    statNames: { z: 'z', k: 'k', D: 'D', 'b/c': 'b/c' },
    verdicts: { reject: 'H0 rifiutata', accept: 'H0 non rifiutata' },
    expected: { reject: 'rifiutata', accept: 'non rifiutata (95% dei casi)' },
    pending: 'In corso: le simulazioni non sono ancora finite.',
  },
  history: {
    intro: 'Dalla legge dei grandi numeri alle sue forme forti e ai teoremi della statistica, e da un problema di probabilità inversa alle reti bayesiane e ai filtri antispam: le idee usate nell’homework in ordine cronologico.',
    items: [
      { year: '1713', title: 'Jacob Bernoulli', text: 'Ars Conjectandi, pubblicato postumo: la prima legge dei grandi numeri, la frequenza di un evento si avvicina alla sua probabilità.' },
      { year: '1733', title: 'de Moivre', text: 'L’approssimazione normale della binomiale: il primo limite centrale, con la sua √n.' },
      { year: '1763', title: 'Bayes e Price', text: 'Richard Price pubblica il saggio di Thomas Bayes sulla probabilità inversa: dedurre la probabilità di una causa dai suoi effetti.' },
      { year: '1774', title: 'Laplace', text: 'Mémoire sur la probabilité des causes par les événements: il teorema nella forma generale, poi la regola di successione e, nel 1810, il limite centrale.' },
      { year: '1853', title: 'Cauchy', text: 'Studia la legge che porta il suo nome, che Poisson aveva già notato nel 1824 come eccezione alla media.' },
      { year: '1867', title: 'Chebyshev', text: 'La disuguaglianza che dimostra la legge debole dei grandi numeri per variabili con varianza finita.' },
      { year: '1906', title: 'Markov', text: 'Le catene che portano il suo nome, per mostrare che la legge dei grandi numeri vale anche senza indipendenza.' },
      { year: '1908', title: 'Student', text: 'William Gosset, alla birreria Guinness, trova la legge della statistica t, con la varianza stimata dai dati.' },
      { year: '1909', title: 'Borel', text: 'La legge forte per le prove di Bernoulli, con i numeri normali: la prima convergenza quasi certa.' },
      { year: '1917', title: 'Cantelli', text: 'Il lemma di Borel-Cantelli e una legge forte con il momento quarto.' },
      { year: '1922', title: 'Lindeberg', text: 'La condizione sotto cui il limite centrale vale anche per variabili non identiche.' },
      { year: '1922-1925', title: 'Fisher', text: 'La massima verosimiglianza, l’informazione che porta il suo nome e il p-value come misura dell’evidenza contro H0.' },
      { year: '1925', title: 'Slutsky', text: 'Il teorema che combina la convergenza in distribuzione e quella in probabilità.' },
      { year: '1927', title: 'Wilson', text: 'L’intervallo per una proporzione che inverte il test del punteggio.' },
      { year: '1933', title: 'Kolmogorov', text: 'Gli assiomi della probabilità, la legge forte per variabili identicamente distribuite con media finita, e la legge limite di √n per la distanza dalla funzione di ripartizione empirica.' },
      { year: '1933', title: 'Glivenko e Cantelli', text: 'La funzione di ripartizione empirica converge uniformemente a quella vera, quasi certamente.' },
      { year: '1934', title: 'Clopper e Pearson', text: 'L’intervallo esatto per una proporzione, costruito sulla binomiale.' },
      { year: '1940', title: 'Turing e Good', text: 'A Bletchley Park, il Banburismus contro Enigma: pesi delle prove in ban e deciban, sommati uno dopo l’altro.' },
      { year: '1941-1942', title: 'Berry ed Esseen', text: 'La velocità del limite centrale: la distanza dalla normale non supera C ρ/(σ³ √n).' },
      { year: '1945', title: 'Wald', text: 'Il test sequenziale del rapporto di verosimiglianza, sviluppato per il collaudo dei materiali bellici; nel 1948, con Wolfowitz, la sua ottimalità.' },
      { year: '1945-1946', title: 'Rao e Cramér', text: 'Il limite inferiore della varianza di uno stimatore non distorto, che il MLE raggiunge asintoticamente.' },
      { year: '1946', title: 'Jeffreys', text: 'Il prior invariante che porta il suo nome; per una proporzione è Beta(1/2, 1/2).' },
      { year: '1949', title: 'Doob', text: 'La consistenza del posterior: con dati infiniti converge quasi certamente al valore vero.' },
      { year: '1963', title: 'Hoeffding', text: 'La disuguaglianza esponenziale per somme di variabili limitate.' },
      { year: '1988', title: 'Pearl', text: 'Probabilistic Reasoning in Intelligent Systems: le reti bayesiane come motore di inferenza.' },
      { year: '1995', title: 'Benjamini e Hochberg', text: 'Il tasso di falsi rilevamenti fra molti test, e il modo di controllarlo.' },
      { year: '1998-2002', title: 'Sahami, Graham', text: 'Il filtro antispam bayesiano: prima in un articolo di ricerca, poi in «A Plan for Spam».' },
      { year: '2001', title: 'Brown, Cai e DasGupta', text: 'Interval Estimation for a Binomial Proportion: perché l’intervallo di Wald va abbandonato.' },
      { year: '2005', title: 'Ioannidis', text: 'Why Most Published Research Findings Are False: il p-value letto senza il tasso di base.' },
      { year: '2009', title: 'Tavallaee e colleghi', text: 'NSL-KDD, la versione ripulita dei dati della KDD Cup 1999.' },
      { year: '2011', title: 'Almeida, Gómez Hidalgo e Yamakami', text: 'La SMS Spam Collection; nello stesso anno Shevtsova porta la costante di Berry-Esseen a 0,4748.' },
    ],
    after: 'La storia corre su due binari che l’homework incrocia: quello dei limiti (Bernoulli, Chebyshev, Borel, Kolmogorov, Berry ed Esseen) e quello dell’inferenza (Bayes, Laplace, Fisher, Turing, Wald, Pearl). Bernstein-von Mises li unisce: con abbastanza dati, credere e contare danno la stessa risposta.',
  },
  conclusion: {
    paras: (f) => [
      'I quattro modi di convergenza non sono sinonimi. Quasi certa e in media quadratica implicano in probabilità, che implica in distribuzione; ogni altra freccia ha un controesempio (Bernoulli(1/n), il picco, la macchina da scrivere, (-1)^n Z). La legge dei grandi numeri vive in probabilità (la debole), quasi certamente (la forte) e in media quadratica; il limite centrale in distribuzione; e la stessa lingua regge la consistenza degli stimatori, Slutsky, il metodo delta, Glivenko-Cantelli e la normalità del MLE.',
      `√n viene dalla varianza che si somma: con valori indipendenti, o solo non correlati, Var(S_n) = n σ², quindi l’errore della media è σ/√n e il limite centrale va scritto con √n. Per questo dimezzare l’errore costa quattro volte i dati (${IT.int(f.half)} connessioni per stimare il 3% a mezzo punto). Senza indipendenza la costante cresce: con allarmi a raffica di correlazione 0,5 la varianza è ${IT.num(f.burstFactor, 1)} volte quella indipendente. E senza varianza finita, o con code pesantissime come i byte di NSL-KDD, la normale arriva tardi o mai.`,
      `La probabilità condizionata è il cuore dell’inferenza, e il teorema di Bayes la rovescia: dalla verosimiglianza P(dati | ipotesi) al posterior P(ipotesi | dati), passando per il prior. Un p-value non è la probabilità di H0 (${IT.p(f.pValue)} contro ${IT.pct(f.posteriorH0, 1)} nell’esempio della sezione 2.1). Sugli esempi il motore funziona: mostra quanto pesa il tasso di base (${IT.pct(f.alarm)} di attacchi veri fra gli allarmi), spiega via una causa con un’altra, decide in pochi tentativi, stima la quota di click con un intervallo che si legge come una probabilità (${IT.pct(f.rate.mean)}, da ${IT.pct(f.rate.lo)} a ${IT.pct(f.rate.hi)}), filtra lo spam (${IT.pct(f.sms)} di accuratezza) e gli attacchi di NSL-KDD (${IT.pct(f.kdd)}).`,
      'Vantaggi e limiti vanno insieme: il prior porta informazione e richiede una scelta dichiarata; con pochi dati influenza le conclusioni, con molti le lascia ai dati. Il posterior che converge, normale e concentrato sul valore vero (Bernstein-von Mises), è il ponte fra le due parti della consegna: con abbastanza dati, credere e contare danno la stessa risposta.',
    ],
  },
  legends: {
    detected: 'Attacchi visti',
    missed: 'Attacchi persi',
    falseAlarm: 'Falsi allarmi',
    quiet: 'Normali senza allarme',
    phishing: 'Phishing',
    exploit: 'Exploit',
    compromise: 'Compromissione',
    legit: 'Utente legittimo',
    attacker: 'Attaccante',
    live: 'L’indirizzo di prova',
    block: 'Soglia di blocco',
    clear: 'Soglia di via libera',
    uniformPrior: 'Prior uniforme',
    informedPrior: 'Prior informato',
    wrongPrior: 'Prior sbagliato',
    trueRate: 'Quota vera',
    prior: 'Prior',
    likelihood: 'Verosimiglianza',
    posterior: 'Posterior',
    wald: 'Wald',
    wilson: 'Wilson',
    clopper: 'Clopper-Pearson',
    jeffreys: 'Jeffreys',
    nominal: '95%',
    spam: 'Spam',
    ham: 'Legittimi',
    simulated: 'Regole simulate',
    exact: 'Esatta',
    chebyshev: 'Chebyshev',
    hoeffding: 'Hoeffding',
    normal: 'Normale',
    paths: 'Traiettorie',
    band: 'Banda di un punto',
    outsideAt: 'Fuori a n',
    outsideAfter: 'Fuori ancora dopo n',
    simulatedMse: 'Simulato',
    exactMse: 'p(1 - p)/n',
    bernoulli: 'Falsi allarmi',
    bernoulliBound: 'Falsi allarmi, Berry-Esseen',
    exponential: 'Esponenziali',
    exponentialBound: 'Esponenziali, Berry-Esseen',
    sums: 'Somme simulate',
    normalDensity: 'Densità normale',
    cauchyDensity: 'Densità di Cauchy',
    estimate: 'Stima Monte Carlo',
    exactBand: 'Esatta, con la banda al 95%',
    means: 'Medie simulate',
    zKnown: 'Z, σ nota',
    tEstimated: 't, σ stimata',
    mle: 'MLE del tasso',
    countSpread: 'Deviazione standard del conteggio',
    shareSpread: 'Errore standard della quota',
    scaled: 'n^α (media - 1)',
    independent: 'Indipendenti',
    correlated: 'A raffiche',
    trueDiscovery: 'Scoperte vere',
    missedEffect: 'Effetti mancati',
    falseDiscovery: 'Rifiuti sbagliati',
    trueNull: 'Nulle vere lasciate stare',
    day1: 'Il primo giorno',
    days10: 'Dieci giorni',
  },
  tips: {
    alarm: (k, count, share) => `${it.legends[['detected', 'missed', 'falseAlarm', 'quiet'][k]]}: ${IT.int(count)} connessioni (${IT.pctSmall(share)})`,
    network: (i, values) => [it.network.steps[i], ...['phishing', 'exploit', 'compromise'].map((n, k) => (values[k] === null ? null : `${it.legends[n]} ${IT.pct(values[k])}`))].filter(Boolean).join(' · '),
    sprt: (n, values, upper, lower, keys) => [`Tentativo ${IT.int(n)}`, ...values.map((v, k) => (v === null ? null : `${it.legends[keys[k]]} ${IT.num(v, 3)}`)), upper === null ? null : `blocco ${IT.num(upper, 3)}`, lower === null ? null : `via libera ${IT.num(lower, 3)}`].filter(Boolean).join(' · '),
    campaign: (row, u, i, truth) => [`Giorno ${IT.int(row.day)}: ${IT.int(row.clicks)} click su ${IT.int(row.sent)}`, u ? `uniforme ${it.rate.interval(u)}` : null, i ? `informato ${it.rate.interval(i)}` : null, truth ? `vera ${IT.pct(CAMPAIGN.rate, 0)}` : null].filter(Boolean).join(' · '),
    density: (x, prior, lik, post) => [`Quota ${IT.pct(x, 1)}`, prior === null ? null : `prior ${IT.num(prior, 2)}`, lik === null ? null : `verosimiglianza ${IT.num(lik, 2)}`, post === null ? null : `posterior ${IT.num(post, 2)}`].filter(Boolean).join(' · '),
    coverage: (p, values) => [`Quota vera ${IT.pct(p, 1)}`, ...['wald', 'wilson', 'clopper', 'jeffreys'].map((m, k) => (values[k] === null ? null : `${it.legends[m]} ${IT.pct(values[k])}`))].filter(Boolean).join(' · '),
    logOdds: (bin, spam, ham) => [`Log-quote ${it.spam.bin(bin)}`, spam === null ? null : `spam ${IT.int(spam)}`, ham === null ? null : `legittimi ${IT.int(ham)}`].filter(Boolean).join(' · '),
    outside: (n, sim, exact, cheb) => [`n = ${IT.int(n)}`, sim === null ? null : `simulate ${IT.pct(sim)}`, exact === null ? null : `esatta ${IT.pct(exact)}`, cheb === null ? null : `Chebyshev ${IT.pct(cheb)}`].filter(Boolean).join(' · '),
    paths: (n, min, max, out, total) => `n = ${IT.int(n)}: le 20 stime vanno da ${IT.pct(min, 2)} a ${IT.pct(max, 2)}, ${IT.int(out)} su ${IT.int(total)} fuori dalla banda`,
    after: (n, out, after) => [`n = ${IT.int(n)}`, out === null ? null : `fuori a n ${IT.pct(out)}`, after === null ? null : `fuori ancora dopo ${IT.pct(after)}`].filter(Boolean).join(' · '),
    mse: (n, sim, exact) => [`n = ${IT.int(n)}`, sim === null ? null : `simulato ${IT.sci(sim, 2)}`, exact === null ? null : `esatto ${IT.sci(exact, 2)}`].filter(Boolean).join(' · '),
    sequence: (n, values) => `n = ${IT.int(n)}: ${values.map((v) => IT.num(v, Math.abs(v) >= 10 ? 0 : 2)).join(', ')}`,
    clt: (n, values) => [`n = ${IT.int(n)}`, ...['bernoulli', 'bernoulliBound', 'exponential', 'exponentialBound'].map((k, i) => (values[i] === null ? null : `${it.legends[k]} ${IT.num(values[i], 4)}`))].filter(Boolean).join(' · '),
    histogram: (from, to, count, share) => `Da ${IT.num(from, 2)} a ${IT.num(to, 2)}: ${IT.int(count)} (${IT.pct(share)})`,
    hash: (trials, estimate, exact) => [`${IT.int(trials)} prove`, estimate === null ? null : `stima ${IT.pct(estimate, 2)}`, exact === null ? null : `esatta ${IT.pct(exact, 2)}`].filter(Boolean).join(' · '),
    strip: (n, alarm, run) => (alarm ? `Connessione ${IT.int(n)}: allarme, ${run > 1 ? `in una raffica di ${IT.int(run)}` : 'isolato'}` : `Connessione ${IT.int(n)}: nessun allarme`),
    node: (name, p, prior, observed) => (observed === null || observed === undefined ? `${name}: ${IT.pct(p, 1)} (${IT.pct(prior, 1)} prima degli indizi)` : `${name}: osservato, ${observed ? 'sì' : 'no'}`),
    mode: (name, implies, impliedBy) => {
      const low = (x) => x.charAt(0).toLowerCase() + x.slice(1);
      const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).map(low).join(', ')} e ${low(xs[xs.length - 1])}` : low(xs[0]));
      const a = implies.length ? `implica ${list(implies)}` : 'non implica nessun’altra';
      let b = 'nessun’altra la implica';
      if (impliedBy.length) b = `${impliedBy.length > 1 ? 'la implicano' : 'la implica'} ${list(impliedBy)}`;
      return `${name}: ${a}; ${b}.`;
    },
    cauchy: (n, min, max) => `n = ${IT.int(n)}: le medie vanno da ${IT.num(min, 2)} a ${IT.num(max, 2)}`,
    speed: (n, values) => [`n = ${IT.int(n)}`, ...['exact', 'chebyshev', 'hoeffding', 'normal'].map((k, i) => (values[i] === null ? null : `${it.legends[k]} ${IT.prob(values[i])}`))].filter(Boolean).join(' · '),
    bvm: (n, clicks, u, w, truth) => [`n = ${IT.int(n)}, ${IT.int(clicks)} click`, u ? `uniforme ${it.bvm.pair(u)}` : null, w ? `sbagliato ${it.bvm.pair(w)}` : null, truth ? `vera ${IT.pct(CAMPAIGN.rate, 0)}` : null].filter(Boolean).join(' · '),
    bvmDistance: (n, u, w) => [`n = ${IT.int(n)}`, u === null ? null : `uniforme ${IT.num(u, 4)}`, w === null ? null : `sbagliato ${IT.num(w, 4)}`].filter(Boolean).join(' · '),
    results: (n, z, t, mle) => [`n = ${IT.int(n)}`, z === null ? null : `σ nota ${IT.num(z, 4)}`, t === null ? null : `σ stimata ${IT.num(t, 4)}`, mle === null ? null : `MLE ${IT.num(mle, 4)}`].filter(Boolean).join(' · '),
    root: (n, count, share) => [`n = ${IT.int(n)}`, count ? `conteggio ${IT.num(count[0], 2)} (σ √n = ${IT.num(count[1], 2)})` : null, share ? `quota ${IT.num(share[0], 5)} (σ/√n = ${IT.num(share[1], 5)})` : null].filter(Boolean).join(' · '),
    burst: (n, ind, cor) => [`n = ${IT.int(n)}`, ind === null ? null : `indipendenti ${IT.num(ind, 5)}`, cor === null ? null : `a raffiche ${IT.num(cor, 5)}`].filter(Boolean).join(' · '),
    discovery: (k, count) => `${it.legends[['trueDiscovery', 'missedEffect', 'falseDiscovery', 'trueNull'][k]]}: ${IT.int(count)} test`,
    likelihood: (x, a, b) => [`Quota ${IT.pct(x, 1)}`, a === null ? null : `primo giorno ${IT.num(a, 3)}`, b === null ? null : `dieci giorni ${IT.num(b, 3)}`].filter(Boolean).join(' · '),
  },
  names: {
    methods: { wald: 'Wald', wilson: 'Wilson', clopper: 'Clopper-Pearson', jeffreys: 'Jeffreys' },
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese, con i dati degli SMS e di NSL-KDD dentro: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline. Con node homework7.js stampa nel terminale le convergenze, √n e le raffiche, gli altri risultati della statistica, la probabilità condizionata, l’allarme, la rete, il test di Wald, la campagna, le coperture, i due filtri e le verifiche; --seed cambia il seme.',
    contents: 'Contenuto: index.html, style.css, homework7.js (dati, calcoli, grafici e riga di comando), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework7',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Le forme di convergenza e il ruolo di √n; probabilità condizionata, teorema di Bayes e inferenza statistica.',
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
    another: 'Another sample',
    reset: 'Start again',
    yes: 'yes',
    no: 'no',
  },
  sections: {
    assignment: '0. The assignment',
    convergence: '1. The modes of convergence in probability theory',
    probability: '1.1 In probability',
    almost: '1.2 Almost sure',
    trySequences: 'Try it: paths and counterexamples',
    l2: '1.3 In mean square (L²)',
    distribution: '1.4 In distribution',
    tryClt: 'Try it: the central limit, live',
    tryHash: 'Try it: hash collisions',
    map: '1.5 How they connect: the map of implications',
    tryMap: 'Try it: the map',
    roles: '1.6 The role in the law of large numbers and in the central limit',
    results: '1.7 Other results: consistency, Slutsky, delta method, Glivenko-Cantelli, MLE',
    root: '1.8 Why √n: the variance adds up',
    tryScale: 'Try it: the right scale',
    bursts: '1.9 Without independence: alarms in bursts',
    tryBursts: 'Try it: alarms in bursts',
    heavy: '1.10 When √n is not enough: heavy tails',
    speed: '1.11 How fast: Chebyshev, Hoeffding, Berry-Esseen',
    bayes: '2. Conditional probability, Bayes’ theorem and statistical inference',
    conditional: '2.1 Conditional probability, in probability and in statistics',
    tryPvalue: 'Try it: p-value and P(H0 | data)',
    engine: '2.2 Bayes’ theorem: prior, likelihood, posterior',
    alarm: '2.3 An IDS alarm and the base rate',
    tryAlarm: 'Try it: the adjustable alarm',
    network: '2.4 A Bayesian network for triage',
    tryNetwork: 'Try it: explaining away',
    sprt: '2.5 When to block an IP: Wald’s sequential test',
    trySprt: 'Try it: block an IP',
    rate: '2.6 Estimating a rate: who clicks the phishing',
    tryBelief: 'Try it: belief, live',
    tryPrior: 'Try it: draw the prior',
    frequentist: '2.7 Bayes and frequentists: credibility and confidence',
    spam: '2.8 The spam filter: naive Bayes on real SMS',
    kdd: '2.9 The same engine on NSL-KDD',
    limits: '2.10 Advantages, limitations and the influence of the prior on the conclusions',
    bvm: '2.11 The posterior converges: Bernstein-von Mises',
    checks: '3. Checks',
    tests: '4. Summary of the statistical tests',
    history: '5. Historical context',
    conclusion: '6. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment has two parts. The first asks to explain the differences between the main modes of convergence of probability theory (in probability, almost sure, in mean square, in distribution), their role in the law of large numbers, in the central limit theorem and in other important results of statistics, and why √n appears so often in convergence theorems, in relation to the additivity of variance and to the role of independence, in probability and in inference. The second asks for conditional probability, in probability and in statistics, Bayes’ theorem and the role and relationship of the three components of Bayesian inference, prior, likelihood and posterior: how the theorem produces the posteriors, why this updating is central, and examples of the use of priors and likelihoods with their applications, advantages, limitations and influence on the conclusions.',
      'The page follows this order. Section 1 defines and shows the four modes in the order of the text (1.1 to 1.4), connects them in a map of implications (1.5), sums up their role in the law of large numbers and in the central limit (1.6) and in other results of statistics: the consistency of estimators, Slutsky’s theorem and the delta method, Glivenko-Cantelli, the normality of the maximum likelihood estimator (1.7). Then it explains √n: the variance that adds up thanks to independence (1.8), what happens without it (1.9), when √n is not enough (1.10) and how fast convergence is (1.11). Section 2 starts from conditional probability, with the chain of an attack, conditional independence and the difference between a p-value and the probability of H0 (2.1); it presents Bayes’ theorem and its three components (2.2); it puts them to work on cybersecurity examples, from the alarm of an IDS to two naive Bayes filters on real data (2.3 to 2.9); it discusses the advantages, the limitations and the influence of the prior on the conclusions (2.10) and closes with the posterior that converges, the bridge between the two parts (2.11). Then come the checks of the computations, the summary of the tests, the historical context and the conclusions.',
      'Twelve "Try it" boxes let you get your hands on the numbers: the paths of the counterexamples, the central limit live, hash collisions, the map of implications, the right scale for n, alarms in bursts, the p-value against P(H0 | data), an alarm to tune, the clues of a network, an address to block, a belief that updates at every e-mail and a prior to draw. Every number is computed in the browser, and the downloadable program prints the same ones.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned, in English; the broken lines of the original are joined into paragraphs.',
  },
  bayes: {
    intro: [
      'The second part moves from convergence to inference. Conditional probability says how a probability changes when something is known; Bayes’ theorem reverses it, from the probability of the data given the hypotheses to that of the hypotheses given the data. Used this way it is an inferential engine, which always does the same thing: it takes what was known before (the prior), combines it with how probable the data are under every hypothesis (the likelihood) and returns what is known after (the posterior). The examples change the hypotheses and the data, not the rule: an alarm, three connected clues, a series of login attempts, a phishing campaign, the words of an SMS, the fields of a connection.',
    ],
  },
  engine: {
    components: 'From the definition of conditional probability, P(H ∩ E) = P(E | H) P(H) = P(H | E) P(E); dividing by P(E) gives Bayes’ theorem. Its three components play different roles. The prior P(H) is what is known before the data: a base rate, experience, a declared assumption. The likelihood P(E | H), read as a function of the hypothesis (or of the parameter θ) with the data fixed, says how probable each hypothesis makes the data observed: it carries the information of the sample. The posterior P(H | E) is what is known after, and the only thing reasoned upon from then on. The evidence P(E), from the law of total probability, is the constant that makes the posteriors add up to 1.',
    likelihood: (l) => `The likelihood is not a probability distribution over θ. As a function of θ it does not have area 1: in the chart, scaled to a maximum of 1, its area is ${EN.num(l.day1.area, 3)} with the data of the first day (${EN.int(l.data.day1.clicks)} clicks out of ${EN.int(l.data.day1.sent)}) and ${EN.num(l.days10.area, 3)} with those of ten days (${EN.int(l.data.days10.clicks)} out of ${EN.int(l.data.days10.sent)}). It peaks at the observed frequency, the maximum likelihood estimate, and narrows with the data. Only multiplied by a prior and normalized does it become a posterior.`,
    likelihoodTitle: 'The likelihood of the share of clicks, after the first day and after ten days, scaled to a maximum of 1',
    odds: 'With two hypotheses, H and ¬H, the theorem reads better in the form of odds: the posterior odds are the prior odds times the likelihood ratio LR = P(E | H)/P(E | ¬H). In logarithms the product becomes a sum: every piece of evidence adds its weight ln LR, and pieces of evidence independent given the hypotheses add up. Alan Turing, at Bletchley Park, measured these weights in bans (base 10 logarithms) and decibans.',
    formulas: [
      'P(H | E) = P(E | H) · P(H) / P(E)                  the theorem',
      'P(E) = Σ_i P(E | H_i) · P(H_i)                     total probability',
      'O(H | E) = O(H) · P(E | H) / P(E | ¬H)             odds: posterior = prior × LR',
      'ln O(H | E_1, ..., E_k) = ln O(H) + Σ_j ln LR_j    evidence independent given H and ¬H',
      'p(θ | data) ∝ p(data | θ) · p(θ)                   a continuous parameter',
    ].join('\n'),
    weights: (w1, w10) => `For a parameter the relationship between the three components shows in the posterior mean. With a Beta(a, b) prior and k clicks out of n e-mails the posterior mean is (a + k)/(a + b + n): a weighted average of the prior mean and the observed frequency, with prior weight (a + b)/(a + b + n). With the informed prior Beta(3, 17) and the first day the prior weighs ${EN.pct(w1.w, 1)}: ${EN.pct(w1.priorMean, 1)} and ${EN.pct(w1.mle, 1)} give ${EN.pct(w1.posteriorMean, 1)}. After ten days it weighs ${EN.pct(w10.w, 1)}, and the posterior (${EN.pct(w10.posteriorMean, 1)}) is almost the observed frequency (${EN.pct(w10.mle, 1)}).`,
    central: 'Why this updating is central in Bayesian inference: everything that is concluded comes from the posterior. The estimates (mean, median, mode), the credible intervals, the probabilities of hypotheses such as P(θ > threshold), the predictions of new data and the decisions are functions of it. And updating is coherent: today’s posterior is tomorrow’s prior, and updating one datum at a time or all at once, in any order, gives the same result.',
    after: 'Three things decide the result, and the examples that follow show them one at a time: the prior (2.3, the base rate), how well every piece of evidence separates the hypotheses (2.4 and 2.5), and how much data arrives (2.6 and 2.11: with enough data the prior stops mattering).',
  },
  alarm: {
    intro: (f) => `An IDS rule recognizes ${EN.pct(f.sensitivity, 0)} of the attacks (the sensitivity) and goes off by mistake on ${EN.pct(f.fpr, 0)} of the normal connections (the false positive rate). It looks like a good detector. But on this network only one connection in ${EN.int(1 / f.base)} is an attack: that is the base rate, the prior. When the IDS goes off, how likely is it to be a real attack?`,
    paras: (f) => [
      `P(attack | alarm) = (${EN.plain(f.base)} × ${EN.plain(f.sensitivity)}) / (${EN.plain(f.base)} × ${EN.plain(f.sensitivity)} + ${EN.plain(1 - f.base)} × ${EN.plain(f.fpr)}) = ${EN.pct(f.posterior)}: only one alarm in ${EN.num(1 / f.posterior, 1)} is an attack. With natural frequencies the computation can be done in one’s head. Out of ${EN.int(f.population)} connections, ${EN.int(f.population * f.base)} are attacks: the IDS sees ${EN.int(f.counts[0])} and misses ${EN.int(f.counts[1])}. The normal connections are ${EN.int(f.population * (1 - f.base))}, and ${EN.pct(f.fpr, 0)} of them trigger ${EN.int(f.counts[2])} false alarms. The alarms are ${EN.int(f.counts[0] + f.counts[2])}, and only ${EN.int(f.counts[0])} are attacks.`,
      `This is the base rate fallacy: whoever looks only at the sensitivity of ${EN.pct(f.sensitivity, 0)} overrates the alarm ${EN.num(f.sensitivity / f.posterior, 1)} times. In the form of odds: the prior is 1 to ${EN.num(1 / f.priorOdds, 0)}, the alarm multiplies it by LR = ${EN.num(f.sensitivity, 2)}/${EN.num(f.fpr, 2)} = ${EN.num(f.lrPlus, 1)} (${EN.num(Math.log10(f.lrPlus), 2)} bans) and brings it to 1 to ${EN.num(1 / f.posteriorOdds, 2)}. Silence, instead, reassures a lot: P(attack | no alarm) = ${EN.pctSmall(f.posteriorQuiet)}.`,
    ],
    iconTitle: 'The 10,000 connections: every square is a connection',
    tableTitle: 'The four categories',
    cols: { category: 'Category', truth: 'Truth', alarm: 'Alarm', count: 'Connections', share: 'Share' },
    truth: { detected: 'attack', missed: 'attack', falseAlarm: 'normal', quiet: 'normal' },
    alarmed: { detected: 'yes', missed: 'no', falseAlarm: 'yes', quiet: 'no' },
    chainIntro: (s2) => `A second piece of evidence, independent of the first given the state of the connection: a sandbox opens the file the connection carried. It recognizes ${EN.pct(s2.sensitivity, 0)} of the malware and is wrong on ${EN.pct(s2.fpr, 0)} of the harmless files, so LR = ${EN.num(s2.sensitivity / s2.fpr, 0)}. The posterior of the first alarm becomes the prior of the second. In the opposite order, first the sandbox and then the IDS, the result is the same number: the weights add up.`,
    chainTitle: 'Two pieces of evidence in a row, in both orders',
    chainCols: { order: 'Order', step: 'Evidence', lr: 'LR', weight: 'Weight (bans)', prior: 'Prior', posterior: 'Posterior' },
    orders: { forward: 'IDS, then sandbox', backward: 'sandbox, then IDS' },
    detectors: { ids: 'IDS alarm', sandbox: 'sandbox alarm' },
  },
  tryAlarm: {
    intro: 'Move the sliders: base rate, sensitivity and false positives. The red squares are the attacks seen, the purple ones the attacks missed, the orange ones the false alarms. With a base rate of one in ten thousand even an excellent detector produces almost only false alarms; with the second detector on, the alarms are checked again by the sandbox.',
    base: (v) => `Base rate: ${EN.pctSmall(v)}`,
    sensitivity: (v) => `Sensitivity: ${EN.pct(v, 1)}`,
    fpr: (v) => `False positives: ${EN.pctSmall(v)}`,
    second: 'Check the alarms with the sandbox',
    result: (t) => {
      const f = t.facts;
      const [seen, missed, wrong] = f.counts;
      return `Out of ${EN.int(f.population)} connections: ${EN.int(seen)} ${seen === 1 ? 'attack' : 'attacks'} seen, ${EN.int(missed)} missed, ${EN.int(wrong)} ${wrong === 1 ? 'false alarm' : 'false alarms'}. P(attack | alarm) = ${EN.pct(f.posterior)}.`;
    },
    secondResult: (t) => `The sandbox confirms about ${EN.num(t.confirmed[0], 1)} attacks and ${EN.num(t.confirmed[1], 1)} false alarms: after two alarms P(attack) = ${EN.pct(t.chain[1].posterior)}.`,
  },
  network: {
    intro: [
      'An analyst sees three clues on a host and must understand what happened. Two possible causes: a phishing e-mail stole a password, or someone exploited a vulnerability from outside. Each can compromise the host (the two causes act independently, a model called noisy-OR, with a small probability of compromise by other routes). The clues: the EDR on the host raises an alarm (child of the compromise), the login comes from an unusual place (child of the phishing), the IDS sees the signature of an exploit (child of the vulnerability). The numbers are plausible orders of magnitude, not data.',
      'A Bayesian network writes the joint probability of all the nodes as the product of the probability of each given its parents: with six binary nodes 1 + 1 + 4 + 2 + 2 + 2 = 12 numbers are enough, instead of the 63 of a full table. Inference here is by enumeration: the 64 states consistent with the clues are summed. Large networks need variable elimination or Monte Carlo methods, but the rule is still Bayes.',
    ],
    paras: (rows) => [
      `Without clues, phishing and exploit have their prior probabilities, ${EN.pct(rows[0].phishing)} and ${EN.pct(rows[0].exploit)}, and the compromise ${EN.pct(rows[0].compromise)}. The EDR alarm brings the compromise to ${EN.pct(rows[1].compromise)} and raises both causes: the phishing to ${EN.pct(rows[1].phishing)}, the exploit to ${EN.pct(rows[1].exploit)}.`,
      `Then the IDS sees the signature of an exploit: the vulnerability rises to ${EN.pct(rows[2].exploit)} and the phishing falls back to ${EN.pct(rows[2].phishing)}, close to its prior, although no clue is about the phishing. This is explaining away: a cause found makes the other unnecessary. A priori the two causes are independent; given their common effect they become dependent, in opposite directions. Finally the unusual login, a clue of the phishing itself, brings it back to ${EN.pct(rows[3].phishing)}, and in turn takes some weight off the exploit (${EN.pct(rows[3].exploit)}).`,
    ],
    nodes: { phishing: 'Phishing', exploit: 'Exploit', compromise: 'Compromise', edr: 'EDR alarm', login: 'Unusual login', signature: 'Exploit signature' },
    steps: ['No clue', 'EDR alarm', '+ exploit signature', '+ unusual login'],
    stepsShort: ['Before', 'EDR', '+ signature', '+ login'],
    chartTitle: 'The probabilities of the three hidden variables, clue after clue',
    tableTitle: 'The story, step by step',
    cols: { step: 'Clues', phishing: 'P(phishing)', exploit: 'P(exploit)', compromise: 'P(compromise)', evidence: 'P(clues)' },
  },
  tryNetwork: {
    intro: 'Every clue can be unknown, present or absent. Switch on the EDR alarm and then the exploit signature: watch the phishing go down. Try also saying that the EDR did not go off: the compromise collapses, and both causes with it.',
    states: { unknown: 'unknown', yes: 'yes', no: 'no' },
    result: (q) => `P(phishing) = ${EN.pct(q.phishing)}, P(exploit) = ${EN.pct(q.exploit)}, P(compromise) = ${EN.pct(q.compromise)}; the probability of seeing these clues was ${EN.pctSmall(q.pEvidence)}.`,
    diagramLabel: 'The Bayesian network of the triage: the causes at the top, the compromise in the middle, the clues at the bottom',
  },
  sprt: {
    intro: [
      `An IP address tries to log in, one attempt after the other. Two hypotheses: a legitimate user, who fails now and then (with probability p0 = ${EN.plain(SPRT_DEFAULT.p0)}: a typo, an old password), or a brute-force attack, which fails almost always (p1 = ${EN.plain(SPRT_DEFAULT.p1)}). Blocking a legitimate user should happen at most once in ${EN.int(1 / SPRT_DEFAULT.alpha)} (α), letting an attacker through once in ${EN.int(1 / SPRT_DEFAULT.beta)} (β). How many attempts should one wait?`,
      'Wald’s sequential test (1945) adds up, attempt after attempt, the logarithm of the likelihood ratio, and decides as soon as the sum leaves one of two thresholds. It is Bayes applied one attempt at a time: with prior odds of 1 to 1, the sum is exactly the logarithm of the posterior odds that the address is an attacker.',
    ],
    formulas: (s) => [
      `failed attempt:      + ln(p1/p0) = + ${EN.num(s.fail, 3)}`,
      `successful attempt:  + ln((1 - p1)/(1 - p0)) = ${EN.num(s.success, 3)}`,
      `block when the sum ≥ ln((1 - β)/α) = ${EN.num(s.upper, 3)}`,
      `clear when the sum ≤ ln(β/(1 - α)) = ${EN.num(s.lower, 3)}`,
    ].join('\n'),
    paras: (s, legit, attacker) => [
      `An attacker who always fails is blocked at attempt number ${EN.int(Math.ceil(s.upper / s.fail))} (${EN.int(Math.ceil(s.upper / s.fail))} × ${EN.num(s.fail, 3)} = ${EN.num(Math.ceil(s.upper / s.fail) * s.fail, 2)}); a user who gets in ${EN.int(Math.ceil(s.lower / s.success))} times in a row is cleared. Computed exactly on the lattice of failures and successes, the errors are P(blocking a user) = ${EN.prob(legit.block)} and P(clearing an attacker) = ${EN.prob(attacker.clear)}, below α and β as Wald guarantees. On average a user takes ${EN.num(legit.mean, 2)} attempts and an attacker ${EN.num(attacker.mean, 2)}; Wald’s approximations, which neglect how far the sum overshoots the threshold, say ${EN.num(s.waldLegit, 2)} and ${EN.num(s.waldAttacker, 2)}.`,
      `The thresholds, read as posterior probabilities with a prior of half and half, are P(attacker) = ${EN.pct(1 / (1 + Math.exp(-s.upper)), 2)} to block and ${EN.pct(1 / (1 + Math.exp(-s.lower)), 2)} to clear. Wald and Wolfowitz (1948) proved that no other test with the same errors needs fewer attempts on average: the sequential test is the fastest way to decide.`,
    ],
    simulation: (sim) => `Simulated ${EN.int(sim.legit.runs)} users and ${EN.int(sim.attackers.runs)} attackers: ${EN.int(sim.legit.block)} ${sim.legit.block === 1 ? 'user blocked' : 'users blocked'} (${EN.num(sim.exactLegit.block * sim.legit.runs, 1)} expected) and ${EN.int(sim.attackers.clear)} attackers cleared (${EN.num(sim.exactAttacker.clear * sim.attackers.runs, 1)} expected), with ${EN.num(sim.legit.meanSteps, 2)} and ${EN.num(sim.attackers.meanSteps, 2)} attempts on average.`,
    chartTitle: 'The log-likelihood ratio of two example addresses',
    tableTitle: 'Errors and attempts: exact, approximate, simulated',
    cols: { who: 'Address', block: 'Blocked', clear: 'Cleared', exact: 'Attempts (exact)', wald: 'Attempts (Wald)', simulated: 'Attempts (simulated)' },
    who: { legit: 'Legitimate user', attacker: 'Attacker' },
  },
  trySprt: {
    intro: 'Add the attempts by hand, or let a simulated user or attacker arrive, one attempt at a time. The box shows the sum, the thresholds and the posterior probability, with a prior of half and half. Lower α: more failures are needed to block.',
    fail: '+ failed attempt',
    success: '+ successful attempt',
    legit: 'Simulated user',
    attacker: 'Simulated attacker',
    alphaLabel: 'Error allowed on users (α)',
    alphaName: (a) => `1 in ${EN.int(1 / a)}`,
    result: (path, n, decision) => {
      const last = path.llr[path.llr.length - 1];
      const state = decision === 'block' ? 'address blocked' : decision === 'clear' ? 'address cleared' : 'no decision yet';
      return `${EN.int(n)} ${n === 1 ? 'attempt' : 'attempts'}, sum ${EN.num(last, 3)}, P(attacker) = ${EN.pct(1 / (1 + Math.exp(-last)), 2)}: ${state}.`;
    },
    walk: 'The address of this box',
  },
  rate: {
    intro: (c) => `A simulated phishing campaign sends ${EN.int(CAMPAIGN.perDay)} e-mails a day for ${EN.int(CAMPAIGN.days)} days. The true share of those who click, ${EN.pct(CAMPAIGN.rate, 0)}, is unknown to the analyst: it is estimated from the clicks. Two analysts start from different priors: one knows nothing, Beta(${PRIORS.uniform.join(', ')}), uniform on [0, 1]; the other has read that usually ${EN.pct(PRIORS.informed[0] / (PRIORS.informed[0] + PRIORS.informed[1]), 0)} click, and expresses it with Beta(${PRIORS.informed.join(', ')}), worth ${EN.int(PRIORS.informed[0] + PRIORS.informed[1])} e-mails already seen. Security wants to stay below ${EN.pct(TARGET_RATE, 0)}. Clicks of the ten days: ${c.days.map((d) => d.clicks).join(', ')}.`,
    paras: (c) => {
      const u = c.uniform;
      const i = c.informed;
      const d1 = u[1];
      const last = u[u.length - 1];
      const lastI = i[i.length - 1];
      return [
        `The Beta prior is conjugate to the binomial: after k clicks out of n e-mails the posterior is again a Beta, with k added to the first parameter and n - k to the second. Here the engine comes down to counting. After the first day (${EN.int(d1.clicks)} clicks out of ${EN.int(d1.sent)}) the first analyst estimates ${EN.pct(d1.mean)}, with a 95% credible interval from ${EN.pct(d1.lo)} to ${EN.pct(d1.hi)}; the second, held back by the prior, ${EN.pct(i[1].mean)}.`,
        `After ${EN.int(last.sent)} e-mails and ${EN.int(last.clicks)} clicks the two almost coincide: ${EN.pct(last.mean)} (from ${EN.pct(last.lo)} to ${EN.pct(last.hi)}) and ${EN.pct(lastI.mean)} (from ${EN.pct(lastI.lo)} to ${EN.pct(lastI.hi)}). The data have drowned the prior. The question of security has a direct answer: given the clicks, the probability that the true share exceeds ${EN.pct(TARGET_RATE, 0)} is ${EN.pct(c.aboveUniform[c.aboveUniform.length - 1])}. Another training session is needed.`,
      ];
    },
    after: 'The credible interval reads as one would like to read every interval: given the prior and the clicks, the true share lies inside with probability 95%. A confidence interval says something else, and section 2.7 compares them.',
    chartTitle: 'The estimate of the two analysts, day after day, with its 95% interval',
    tableTitle: 'The posteriors, day by day',
    cols: { day: 'Day', sent: 'E-mails', clicks: 'Clicks', uniform: 'Uniform prior', informed: 'Informed prior', above: `P(share > ${EN.pct(TARGET_RATE, 0)})` },
    interval: (r) => `${EN.pct(r.mean)} [${EN.pct(r.lo)}, ${EN.pct(r.hi)}]`,
  },
  tryBelief: {
    intro: 'Choose the prior, then add the e-mails one at a time, or ten at a time (simulated at the true 12%). The dashed curve is the prior, the dotted one the likelihood, the solid one the posterior: the posterior moves from the prior towards the data, and narrows.',
    priorLabel: 'Prior',
    priors: { uniform: 'Uniform, Beta(1, 1)', jeffreys: 'Jeffreys, Beta(1/2, 1/2)', informed: 'Informed, Beta(3, 17)', wrong: 'Wrong, Beta(40, 60)' },
    click: '+ clicked',
    noClick: '+ did not click',
    ten: '+ 10 e-mails',
    result: (state, post, above) => (state.sent === 0
      ? `No e-mail yet: the posterior is the prior, with mean ${EN.pct(post.mean)}.`
      : `${EN.int(state.clicks)} clicks out of ${EN.int(state.sent)} e-mails: posterior Beta(${EN.num(post.a, post.a % 1 ? 1 : 0)}, ${EN.num(post.b, post.b % 1 ? 1 : 0)}), mean ${EN.pct(post.mean)}, 95% interval from ${EN.pct(post.lo)} to ${EN.pct(post.hi)}, P(share > ${EN.pct(TARGET_RATE, 0)}) = ${EN.pct(above)}.`),
    chartTitle: 'Prior, likelihood and posterior of the share of clicks',
  },
  tryPrior: {
    intro: 'Drag the points to draw the prior you want: even with two humps, even zero on a stretch. The posterior is computed on a grid of 201 values, multiplying point by point and normalizing: no conjugate formula, the engine as it is. With the data of one day the drawing matters a lot; with those of ten days almost nothing. With the keyboard: arrows left and right pick a point, up and down move it.',
    shapeLabel: 'Ready-made shapes',
    shapes: { flat: 'Flat', informed: 'Like Beta(3, 17)', twoPeaks: 'Two humps', pessimist: 'Pessimist' },
    dataLabel: 'Data',
    data: { day1: 'The first day', days3: 'Three days', days10: 'Ten days' },
    editorLabel: 'The prior to draw: eleven points to drag, from 0 to 1',
    handle: (i, h) => `point ${i + 1} of 11, share ${EN.num(i / 10, 1)}, height ${EN.num(h, 2)}`,
    result: (g, flat) => `${EN.int(g.clicks)} clicks out of ${EN.int(g.sent)}: posterior mean ${EN.pct(g.mean)}, 95% interval from ${EN.pct(g.lo)} to ${EN.pct(g.hi)}. With the flat prior it would be ${EN.pct(flat.mean)}, from ${EN.pct(flat.lo)} to ${EN.pct(flat.hi)}.`,
    chartTitle: 'The prior drawn, the likelihood and the posterior on the grid',
  },
  frequentist: {
    intro: [
      'The same clicks, two different questions. The Bayesian credible interval answers: given these clicks, where is the true share? The frequentist confidence interval answers: if I repeated the campaign many times, how often would my method catch the true share? The 95% of the first is a probability about the share; that of the second is a property of the procedure, and once the interval is computed it either contains the true share or it does not.',
      `To compare them one looks at the coverage: the probability, when the true share is p, that the interval computed from the data contains it. With ${EN.int(COVERAGE_N)} e-mails (one day of the campaign) it is computed exactly, summing the binomial probabilities of the ${EN.int(COVERAGE_N + 1)} possible results, without simulating. The methods: Wald (the textbook formula, p̂ ± 1.96 √(p̂(1 - p̂)/n)), Wilson (1927, the inverse of the score test), Clopper-Pearson (1934, exact with the binomial) and Jeffreys, the credible interval of the prior Beta(1/2, 1/2).`,
    ],
    paras: (cov) => {
      const S = cov.summary;
      return [
        `Wald covers ${EN.pct(S.wald.mean)} on average instead of 95%, and for small shares it collapses: at p = ${EN.pct(S.wald.minAt, 1)} it covers ${EN.pct(S.wald.min)}, because with zero clicks the interval is [0, 0]. Clopper-Pearson never goes below 95% (minimum ${EN.pct(S.clopper.min)}), but to manage it covers ${EN.pct(S.clopper.mean)} on average and is the widest (${EN.pct(S.clopper.width)} against ${EN.pct(S.wilson.width)} for Wilson). Wilson (${EN.pct(S.wilson.mean)} on average) and Jeffreys (${EN.pct(S.jeffreys.mean)}) oscillate around 95%.`,
        'The Bayesian interval of Jeffreys, born from a probability about the share, thus also has good frequentist coverage: Brown, Cai and DasGupta (2001) recommend it, together with Wilson, instead of Wald. It is a first taste of the bridge of section 2.11: as the data grow, the two ways of reasoning give the same intervals.',
      ];
    },
    simulation: (s) => `The same coverages, simulated over ${EN.int(s.runs)} campaigns at the true share of ${EN.pct(s.p, 0)}: ${['wald', 'wilson', 'clopper', 'jeffreys'].map((m) => `${en.names.methods[m]} ${EN.pct(s.hits[m] / s.runs)} (exact ${EN.pct(s.exact[m])})`).join(', ')}.`,
    chartTitle: `The exact coverage of the 95% intervals with ${COVERAGE_N} e-mails, as the true share varies`,
    chartNote: 'Wald leaves the chart for the smallest shares: it falls as low as the table says.',
    tableTitle: 'The four methods compared',
    cols: { method: 'Method', mean: 'Mean coverage', min: 'Minimum coverage', at: 'Where', width: 'Mean width' },
  },
  spam: {
    intro: [
      'The most widely used Bayesian engine of cybersecurity is the spam filter: Sahami and colleagues proposed it in 1998, Paul Graham made it famous in 2002 with "A Plan for Spam". Every word is a piece of evidence, and the filter adds up their weights.',
    ],
    source: (d) => `The data: the ${d.dataset}, collected by Almeida, Gómez Hidalgo and Yamakami: ${EN.int(d.messages)} SMS in English, labelled as spam or legitimate. Licence ${d.license}, which asks to cite the source: ${d.paper}.`,
    links: { dataset: 'The collection (UCI)', paper: 'The paper' },
    paras: (m) => {
      const c = m.matrix;
      return [
        `The file repeats ${EN.int(m.corpus.repeated)} messages: the filter counts them once, because the same message in training and in testing would inflate the accuracy. ${EN.int(m.corpus.docs.length)} distinct messages remain; three in ten, by position, are used for testing (${EN.int(m.corpus.test.length)}), the other ${EN.int(m.corpus.train.length)} for learning. The words are the runs of letters and digits, lowercase, plus the pound sign.`,
        `The model is multinomial naive Bayes: for every word, its frequency in the spam and in the legitimate messages of training, with Laplace’s correction (+1) for the words never seen in one of the two classes. "Naive" because it treats the words as independent given the class, which is false ("free" and "prize" travel together), but turns the engine into a sum. The prior is the share of spam in training, ${EN.pct(m.trainSpamShare)}.`,
        `On the ${EN.int(c.n)} test messages the filter stops ${EN.int(c.tp)} spam out of ${EN.int(c.tp + c.fn)} and mistakes ${EN.int(c.fp)} legitimate messages out of ${EN.int(c.fp + c.tn)} for spam: accuracy ${EN.pct(c.accuracy)}, precision ${EN.pct(c.precision)}, recall ${EN.pct(c.recall)}, area under the ROC curve ${EN.num(m.auc, 3)}. The trivial rule that calls everything legitimate reaches ${EN.pct(m.majority.accuracy)}: McNemar’s test on the messages where the two disagree gives p ≈ ${EN.p(m.mcnemar.p, m.mcnemar.log10p)}.`,
      ];
    },
    matrixTitle: 'The confusion matrix on the test messages',
    matrixRows: { spam: 'True spam', ham: 'True legitimate' },
    matrixCols: { truth: '', spam: 'The filter says spam', ham: 'The filter says legitimate' },
    wordsTitle: 'The words that weigh most (at least 10 times in training)',
    wordsCols: { spam: 'Towards spam', spamWeight: 'Weight', ham: 'Towards legitimate', hamWeight: 'Weight' },
    chartTitle: 'The test messages by their log-odds of spam: right of 0 the filter says spam',
    tableTitle: 'The test messages by interval of log-odds',
    binCols: { bin: 'Log-odds', spam: 'Spam', ham: 'Legitimate' },
    bin: (b) => (b.to === Infinity ? `≥ ${EN.int(b.from)}` : `from ${EN.int(b.from)} to ${EN.int(b.to)}`),
    fieldLabel: 'Write a message, in English',
    baseLabel: 'Inbox',
    bases: { train: 'Like the training set', one: 'One spam in 100' },
    result: (sc) => `P(spam) = ${EN.pct(sc.posterior, 2)} (log-odds ${EN.num(sc.logOdds, 2)}, ${EN.int(sc.words)} ${sc.words === 1 ? 'word' : 'words'}).`,
    partsTitle: 'The contribution of every word',
    partsCols: { token: 'Word', count: 'Times', weight: 'Weight (log)' },
    unknown: 'never seen: no weight',
    after: 'Change the inbox: the same message, in an inbox where spam is rare, has a lower posterior. It is the base rate of section 2.3, entering through the prior.',
  },
  kdd: {
    intro: (d) => `The same engine on the connections of NSL-KDD, the data of Homework #6: from the protocol, the service and the flag, is the connection an attack? The data: ${d.dataset}, ${EN.int(d.records)} connections; the dataset and the paper must be cited, ${d.paper}.`,
    paras: (k) => [
      `Three connections in ten, by position, are used for testing (${EN.int(k.test)}), the other ${EN.int(k.train)} for learning. Categorical naive Bayes multiplies the prior (attacks are ${EN.pct(k.classes[1] / (k.classes[0] + k.classes[1]))} of training) by three likelihood ratios, one per field, with Laplace’s correction. Accuracy ${EN.pct(k.naive.accuracy)}, recall on the attacks ${EN.pct(k.naive.recall)}, false positives ${EN.pct(k.naive.fpr)}, area under the ROC curve ${EN.num(k.auc, 3)}.`,
      `Homework #6 showed that protocol, service and flag are strongly dependent: the "naive" hypothesis is false here too. The comparison with exact Bayes measures it. The full table of the ${EN.int(k.cells)} combinations seen in training, with a Beta(1, 1) prior in every cell, makes no independence assumption and reaches ${EN.pct(k.joint.accuracy)} (the ${EN.int(k.unseen)} test connections with a combination never seen take the prior). Naive Bayes counts twice the evidence that says the same thing, and its posteriors are too confident, but the decision changes little. Both beat by far the rule that calls everything an attack (${EN.pct(k.majority.accuracy)}; McNemar, p ≈ ${EN.p(k.mcnemar.p, k.mcnemar.log10p)}).`,
    ],
    tableTitle: 'Three classifiers on the test connections',
    cols: { model: 'Classifier', accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', fpr: 'False positives' },
    models: { naive: 'Naive Bayes (three weights)', joint: 'Full table (exact Bayes)', majority: 'Always "attack"' },
    chooseTitle: 'Choose a connection',
    labels: { protocol: 'Protocol', service: 'Service', flag: 'Flag' },
    partsCols: { feature: 'Field', value: 'Value', attacks: 'Attacks', normals: 'Normal', weight: 'Weight (log)' },
    features: { protocol: 'protocol', service: 'service', flag: 'flag' },
    result: (e) => `Naive Bayes: P(attack) = ${EN.pct(e.posterior, 2)}. ${e.joint.posterior === null ? 'The full table never saw this combination: the prior remains.' : `The full table saw this combination ${EN.int(e.joint.attacks + e.joint.normals)} times, ${EN.int(e.joint.attacks)} as an attack: P(attack) = ${EN.pct(e.joint.posterior, 2)}.`}`,
  },
  convergence: {
    intro: [
      'A sequence of random variables X_1, X_2, ... can approach a limit X in different ways, which are not equivalent. The four definitions of the assignment, for every ε > 0:',
    ],
    formulas: [
      'in probability:       P(|X_n - X| > ε) → 0',
      'almost surely:        P(lim X_n = X) = 1',
      'in mean square:       E[(X_n - X)²] → 0',
      'in distribution:      F_n(x) → F(x) at every point of continuity of F',
    ].join('\n'),
    after: [
      `The example that runs through the section: an IDS rule raises a false alarm on ${EN.pct(FALSE_ALARMS.rate, 0)} of the normal connections, and F̂_n, the share of false alarms in the first n connections, estimates that ${EN.pct(FALSE_ALARMS.rate, 0)}. Every form of convergence says something different about how far F̂_n can be trusted; the tolerance band is one point, ε = ${EN.plain(FALSE_ALARMS.epsilon)}.`,
    ],
  },
  probability: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'Convergence in probability says that, for a fixed n large enough, a deviation wider than ε is unlikely. The weak law of large numbers guarantees it for the mean of independent values with finite variance, and the proof takes one line, with Chebyshev’s inequality: P(|F̂_n - p| > ε) ≤ Var(F̂_n)/ε² = p(1 - p)/(n ε²) → 0.',
        `Here the probability can also be computed exactly, with the binomial: ${EN.pct(at(100).exact)} after 100 connections, ${EN.pct(at(1000).exact)} after 1,000, ${EN.prob(at(10000).exact)} after 10,000. The chart compares it with the share of the ${EN.int(PATHS.count)} simulated rules outside the band and with Chebyshev’s bound, which is true but loose.`,
      ];
    },
    after: 'Convergence in probability speaks of one n at a time: after 1,000 connections the estimate is almost always good. It says nothing about the history of a single rule, which might leave the band many more times. That is the business of almost sure convergence.',
    chartTitle: 'Outside the band of one point: the simulated rules, the exact probability and Chebyshev’s bound',
    tableTitle: 'The rules outside the band',
    cols: { n: 'n', simulated: 'Simulated', exact: 'Exact', chebyshev: 'Chebyshev' },
  },
  almost: {
    paras: (paths) => {
      const c = paths.checks.find((x) => x.n === 1000);
      return [
        'Almost sure convergence asks for more: that almost every path, taken as a whole, ends up inside the band and never leaves it again. In formulas it is equivalent to P(sup_{m ≥ n} |X_m - X| > ε) → 0: it is not enough that at every n a deviation is unlikely, it must be unlikely that there is any deviation at all, from n on. The strong law of large numbers (Kolmogorov, 1933) guarantees it for the mean of independent and identically distributed values with finite mean.',
        `The ${EN.int(paths.count)} simulated rules show it: after ${EN.int(1000)} connections ${EN.pct(c.outside)} are outside the band, but ${EN.pct(c.after)} will leave it at least once more before ${EN.int(paths.length)} (the sup is cut there). This share too goes to zero: at ${EN.int(10000)} connections no rule is outside any more.`,
        'The tool to decide is the Borel-Cantelli lemma. If the probabilities of events A_n have a finite sum, almost surely only finitely many of them happen; if the events are independent and the sum is infinite, infinitely many happen. With independent X_n Bernoulli(1/n) the sum of 1/n diverges: the ones never stop, and X_n does not converge to 0 almost surely, even though P(X_n = 1) = 1/n → 0. With Bernoulli(1/n²) the sum converges (to π²/6): after a while, only zeros.',
      ];
    },
    after: 'For an IDS rule in production it is the difference between "today the estimate is almost certainly good" and "from some day on the estimate will stay good forever".',
    chartTitle: '20 of the 1,000 rules: the share of false alarms, connection after connection, and the band of one point',
    chart2Title: 'Outside the band at n, and outside at least once more after n',
    tableTitle: 'The two shares, by n',
    cols: { n: 'n', outside: 'Outside at n', after: 'Outside again after n' },
  },
  trySequences: {
    intro: 'Choose a sequence: the chart shows 12 of its paths up to n = 1,000, the table its exact numbers and which kinds of convergence hold. The paths of Bernoulli(1/n) have ones scattered forever; those of Bernoulli(1/n²) die out at once; the "typewriter" passes over every point in every block; the spike n·1{U < 1/n} dies out early, but its mean square explodes.',
    chooseLabel: 'Sequence',
    names: { mean: 'Mean of coins - 1/2', bern1: 'Bernoulli(1/n)', bern2: 'Bernoulli(1/n²)', typewriter: 'Typewriter', spike: 'Spike n·1{U < 1/n}', flip: '(-1)^n Z' },
    describe: {
      mean: 'The mean of n tosses of a fair coin, minus 1/2: it converges to 0 in every sense.',
      bern1: 'Independent values, 1 with probability 1/n: in probability and in L2 yes, almost surely no.',
      bern2: 'Independent values, 1 with probability 1/n²: every kind of convergence.',
      typewriter: 'The indicator of an interval of length 2^-k sliding over [0, 1]: in probability and in L2 yes, but every path is 1 infinitely many times.',
      spike: 'It is n if U < 1/n, and 0 otherwise: almost surely and in probability yes, in L2 no, because E[X_n²] = n.',
      flip: 'A standard normal Z, with its sign changed at every step: the law is always N(0, 1), so it converges in distribution to Z; but |X_n - Z| = 2|Z| at every odd n.',
    },
    tableTitle: 'The exact numbers of the sequence',
    cols: { n: 'n', deviation: `P(|X_n - X| > ${EN.plain(SEQUENCE_EPSILON)})`, l2: 'E[(X_n - X)²]', afterwards: 'Away again after n', simulated: 'Paths still away' },
    modesTitle: 'Which kinds of convergence hold',
    modes: { probability: 'In probability', as: 'Almost sure', l2: 'In L2', distribution: 'In distribution' },
    holds: 'yes',
    fails: 'no',
    never: '1 (it never stops)',
    simulatedNote: 'The last column counts the 12 simulated paths still away from the limit after n, up to n = 1,000.',
  },
  l2: {
    paras: (paths) => {
      const c = paths.checks.find((x) => x.n === 1000);
      return [
        `In mean square the distance counts with its square: E[(F̂_n - p)²] → 0. For the mean of independent values it is the variance, p(1 - p)/n: halving the error takes four times the data. The ${EN.int(paths.count)} simulated rules follow it: at n = 1,000 the mean square error is ${EN.sci(c.mse, 2)}, the exact one ${EN.sci(c.exactMse, 2)}.`,
        'Convergence in mean square implies convergence in probability: by Markov’s inequality, P(|X_n - X| > ε) ≤ E[(X_n - X)²]/ε². The converse does not hold, and neither does any link with almost sure convergence, in either direction. The spike Y_n = n·1{U < 1/n} goes to 0 almost surely (as soon as n exceeds 1/U it stays 0 forever), but E[Y_n²] = n explodes: rare huge values are enough to ruin the mean square, as one giant connection ruins the mean of the bytes (section 1.10). Bernoulli(1/n), on the contrary, converges in L2 (E[X_n²] = 1/n) but not almost surely.',
      ];
    },
    chartTitle: 'The mean square error of the 1,000 rules and p(1 - p)/n, on logarithmic axes',
    tableTitle: 'The mean square error, by n',
    cols: { n: 'n', simulated: 'Simulated', exact: 'p(1 - p)/n' },
    counterTitle: 'Two counterexamples: almost sure without L2, L2 without almost sure',
    counterCols: { n: 'n', spikeP: 'Spike: P(Y_n ≠ 0)', spikeL2: 'Spike: E[Y_n²]', bernP: 'Bernoulli(1/n): P(X_n ≠ 0)', bernL2: 'Bernoulli(1/n): E[X_n²]' },
  },
  distribution: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'Convergence in distribution is the weakest: it only asks that the distribution function of X_n approach that of X, at the points where the latter is continuous. It says nothing about the values of X_n and X on the same outcome: X_n = (-1)^n Z always has the law N(0, 1) of Z, so it converges to Z in distribution, but it never gets close to Z. When the limit is a constant, converging in distribution is the same as converging in probability: that is why the law of large numbers can be stated both ways, F̂_n → p.',
        'The central limit theorem does not speak of the value of F̂_n but of the shape of its error: √n (F̂_n - p)/σ converges in distribution to the standard normal. More generally, so does the standardized sum of n independent values with finite variance. The Berry-Esseen theorem also says how fast: the Kolmogorov distance from the normal (the largest difference between the two distribution functions) is at most C ρ/(σ³ √n), with ρ = E|X - μ|³ and, for identically distributed values, C = 0.4748 (Shevtsova, 2011).',
        `The distances of the chart are exact, not simulated: for the false alarms the law of the sum is the binomial, for the times between two alarms (exponential) it is the Gamma. The false alarms, rare and so skewed, converge slowly: ${EN.num(at(10).bernoulli, 3)} at n = 10, ${EN.num(at(100).bernoulli, 3)} at 100, ${EN.num(at(1000).bernoulli, 3)} at 1,000. The exponential ones much faster: ${EN.num(at(10).exponential, 3)}, ${EN.num(at(100).exponential, 4)}, ${EN.num(at(1000).exponential, 4)}. Both stay below their Berry-Esseen bound, and follow it as 1/√n.`,
      ];
    },
    tests: (c) => `Three Kolmogorov-Smirnov tests on ${EN.int(CLT_REPS)} simulated sums (summarized in section 4): ${EN.int(c.exponential.n)} standardized exponential values against the normal, D = ${EN.num(c.exponential.D, 4)}, p ≈ ${EN.p(c.exponential.p)}: with many samples the rule of thumb "n ≥ 30" is not enough for a skewed law (the exact distance is ${EN.num(c.exponential.exact, 4)}). ${EN.int(c.uniform.n)} uniform values, the old recipe for generating normal values: D = ${EN.num(c.uniform.D, 4)}, p = ${EN.p(c.uniform.p)}. The mean of ${EN.int(c.cauchy.n)} Cauchy values against the Cauchy law itself: D = ${EN.num(c.cauchy.D, 4)}, p = ${EN.p(c.cauchy.p)}.`,
    chartTitle: 'Kolmogorov distance from the normal, exact, and the Berry-Esseen bound, on logarithmic axes',
    tableTitle: 'The exact distances and the bounds, by n',
    cols: { n: 'n', bernoulli: 'False alarms', bernoulliBound: 'Bound', exponential: 'Exponential', exponentialBound: 'Bound' },
  },
  tryClt: {
    intro: `Choose the law and n: the histogram shows ${EN.int(5000)} standardized sums, the curve the limit law. With n = 1 you see the starting law; as n grows, the shape becomes the bell. Cauchy has no variance: its means stay Cauchy, for every n.`,
    lawLabel: 'Law',
    laws: { bernoulli: 'False alarms (Bernoulli 3%)', exponential: 'Times between alarms (exponential)', uniform: 'Uniform', cauchy: 'Cauchy' },
    nLabel: 'n',
    result: (t, state) => `n = ${EN.int(state.n)}: Kolmogorov distance from the ${t.cauchy ? 'Cauchy law' : 'normal'} ${EN.num(t.test.D, 4)}, Kolmogorov-Smirnov test p = ${EN.p(t.test.p)}${t.outside > 0 ? `; ${EN.pct(t.outside)} of the sums fall outside the chart` : ''}.`,
    chartTitle: 'The standardized sums and the limit law',
  },
  tryHash: {
    intro: 'A service gives every session a random identifier of a few bits. How many sessions are enough for two to share one? It is the birthday paradox: with N possible values, the probability of a collision among m identifiers is 1 - (1 - 1/N)(1 - 2/N)...(1 - (m - 1)/N), and it becomes 1/2 around 1.18 √N. Run the trials: the Monte Carlo estimate converges to the exact probability (law of large numbers), with oscillations that shrink as 1/√r inside the band of the central limit.',
    bitsLabel: 'Bits',
    factorLabel: 'Sessions',
    factors: (m) => `${EN.int(m)}`,
    add100: '+ 100 trials',
    add1000: '+ 1,000 trials',
    result: (state, exact, m, bits) => (state.trials === 0
      ? `${EN.int(m)} identifiers of ${bits} bits: exact probability of a collision ${EN.pct(exact, 2)}.`
      : `${EN.int(state.trials)} trials, ${EN.int(state.hits)} with a collision: estimate ${EN.pct(state.hits / state.trials, 2)}, exact ${EN.pct(exact, 2)}, off by ${EN.num(Math.abs(state.hits / state.trials - exact) / Math.sqrt((exact * (1 - exact)) / state.trials), 2)} standard errors.`),
    thirtyTwo: (m) => `With 32 bits a collision happens half the time already at ${EN.int(m)} sessions: few for a real service.`,
    chartTitle: 'The estimate of the probability of a collision, trial after trial, and the 95% band around the exact value',
  },
  map: {
    paras: [
      'The four kinds of convergence are linked by implications that always hold. Almost sure implies in probability. In mean square implies in probability (Markov), and more generally in L^p implies in L^q for q < p. In probability implies in distribution. Every other arrow is false, and for each one there is a counterexample among the sequences of the box of section 1.2.',
      'Two partial converses hold: convergence in distribution to a constant implies convergence in probability; and from a sequence that converges in probability one can always extract one that converges almost surely (Riesz). With a control on the tails (uniform integrability) convergence in probability also gives convergence in mean.',
    ],
    tableTitle: 'From one mode to another',
    cols: { from: 'If it converges', to: 'then it converges', holds: 'True?', counter: 'Counterexample' },
  },
  tryMap: {
    intro: 'Click a mode of convergence: the modes it implies light up in green, those it does not imply in red, each with its counterexample.',
    modes: { as: 'Almost sure', l2: 'In mean square', probability: 'In probability', distribution: 'In distribution' },
    pick: 'Choose a mode to see what it implies.',
    result: (mode, list) => `${en.tryMap.modes[mode]} implies: ${list.holds.length ? listOf(list.holds.map((m) => en.tryMap.modes[m].toLowerCase()), 'and') : 'only itself'}. It does not imply: ${list.fails.length ? listOf(list.fails.map((f) => `${en.tryMap.modes[f.mode].toLowerCase()} (counterexample: ${en.trySequences.names[f.counter]})`), 'and') : 'anything'}.`,
    diagramLabel: 'The map of implications between the four modes of convergence',
  },
  heavy: {
    paras: (b) => [
      'The law of large numbers needs a finite mean; the central limit with its √n, a finite variance. When they are missing, or when the tails are so heavy that the variance exists only on paper, √n is no longer enough. The Cauchy law has neither: the mean of n of its values has again the Cauchy law, as wide as a single value. The means of the chart jump forever, because now and then a huge value arrives and moves them.',
      `The bytes sent by the ${EN.int(b.n)} connections of NSL-KDD have finite mean and variance, but very heavy tails: mean ${EN.int(b.mean)} bytes, median ${EN.int(b.median)}, maximum ${EN.int(b.max)}; ${EN.int(b.zeros)} connections send nothing, and the 10 largest carry ${EN.pct(b.top10)} of all the bytes (the largest alone ${EN.pct(b.top1)}). The skewness is ${EN.num(b.skewness, 1)}. The Berry-Esseen theorem promises a distance from the normal below 0.05 only from ${EN.int(b.needed)} connections on.`,
    ],
    bytes: (rows) => `To see it, ${EN.int(BYTES_REPS)} samples of n connections are drawn with replacement, and their mean is standardized with the true mean and standard deviation. With n = 1,000 the distance from the normal is still ${EN.num(rows[2].D, 3)}, and ${EN.pct(rows[2].below)} of the means fall below the true mean: almost every sample misses the giant connections, and the few that contain them jump far away. An alarm threshold built on the normal for "the mean bytes of 1,000 connections" would be badly wrong: better the median, logarithms or extreme value theory.`,
    cauchyTitle: 'Eight means of Cauchy values, value after value: they never stop',
    factsTitle: 'The bytes of the connections of NSL-KDD',
    facts: { mean: 'Mean', median: 'Median', sd: 'Standard deviation', max: 'Maximum', zeros: 'Connections with no bytes', top10: 'Share of the 10 largest', skewness: 'Skewness', ratio: 'Berry-Esseen ρ/σ³', needed: 'n for a distance < 0.05' },
    histTitle: 'The standardized means of 1,000 connections and the normal density',
    tableTitle: 'The means of n connections, against the normal',
    cols: { n: 'n', D: 'Distance', p: 'p-value', below: 'Below the true mean', median: 'Standardized median' },
  },
  speed: {
    paras: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return [
        'The law of large numbers says that the probability of being wrong goes to zero; to decide how many connections are needed one must know how fast. Chebyshev uses only the variance and goes down as 1/n. Hoeffding (1963) uses the fact that the values lie between 0 and 1 and goes down exponentially, 2 exp(-2 n ε²). The central limit gives an approximation, not a bound: 2 Φ(-ε √n/σ).',
        `For the false alarms at ${EN.pct(FALSE_ALARMS.rate, 0)} with one point of tolerance, at n = 10,000 the exact probability is ${EN.prob(at(10000).exact)}, Chebyshev says ${EN.prob(at(10000).chebyshev)}, Hoeffding ${EN.prob(at(10000).hoeffding)}: here Hoeffding is worse than Chebyshev, because it does not know that the variance p(1 - p) is small. At n = 100,000 the exponential wins (${EN.prob(at(100000).hoeffding)} against ${EN.prob(at(100000).chebyshev)}), while the true probability is ${EN.prob(at(100000).exact)}. The normal follows the exact probability closely, but in the far tails it can be wrong by orders of magnitude: Berry-Esseen says so, since it controls the absolute distance, not the relative one.`,
      ];
    },
    chartTitle: 'P(|F̂_n - 3%| > 1 point): exact, the two bounds and the normal, on logarithmic axes',
    tableTitle: 'The probability of a deviation and its bounds, by n',
    cols: { n: 'n', exact: 'Exact', chebyshev: 'Chebyshev', hoeffding: 'Hoeffding', normal: 'Normal' },
  },
  bvm: {
    paras: (rows) => {
      const first = rows[0];
      const at = (n) => rows.find((r) => r.n === n);
      const last = rows[rows.length - 1];
      return [
        `The two parts of the assignment meet here. Two analysts watch the same long phishing campaign, up to ${EN.int(last.n)} e-mails at the true share of ${EN.pct(CAMPAIGN.rate, 0)}: one with the uniform prior, the other with a wrong and self-confident prior, Beta(${PRIORS.wrong.join(', ')}), centred on ${EN.pct(PRIORS.wrong[0] / (PRIORS.wrong[0] + PRIORS.wrong[1]), 0)} and as strong as ${EN.int(PRIORS.wrong[0] + PRIORS.wrong[1])} e-mails. After ${EN.int(first.n)} e-mails their means are ${EN.pct(first.uniform.mean)} and ${EN.pct(first.wrong.mean)}; after ${EN.int(1000)}, ${EN.pct(at(1000).uniform.mean)} and ${EN.pct(at(1000).wrong.mean)}; after ${EN.int(last.n)}, ${EN.pct(last.uniform.mean)} and ${EN.pct(last.wrong.mean)}.`,
        `The posterior converges to the true share (consistency, Doob 1949): almost surely, like the mean of the clicks. And it becomes normal: the Bernstein-von Mises theorem says that, for large n, the posterior is about N(θ̂, θ̂(1 - θ̂)/n), whatever regular prior was used. The Kolmogorov distance between each posterior and its normal goes down as 1/√n (${EN.num(at(100).uniform.distance, 4)} at n = 100, ${EN.num(last.uniform.distance, 4)} at ${EN.int(last.n)}). That is why, with a lot of data, the credible interval and the confidence interval coincide, and the prior stops mattering. With little data, as on the first day of section 2.6, it matters a great deal.`,
      ];
    },
    chartTitle: 'The posterior mean of the two analysts, with ±1.96 standard deviations, as the e-mails grow',
    chart2Title: 'The Kolmogorov distance between each posterior and its normal approximation',
    tableTitle: 'The two posteriors, by n',
    cols: { n: 'n', clicks: 'Clicks', uniform: 'Uniform prior', wrong: 'Wrong prior', dUniform: 'Distance (uniform)', dWrong: 'Distance (wrong)' },
    pair: (x) => `${EN.pct(x.mean, 2)} ± ${EN.pct(1.96 * x.sd, 2)}`,
  },
  roles: {
    intro: 'The four modes of convergence are the language in which limit theorems are written. The table says which mode each one uses, under which conditions, and where the page shows it.',
    tableTitle: 'The limit theorems and their modes of convergence',
    cols: { theorem: 'Theorem', statement: 'What converges', mode: 'Mode', condition: 'Conditions', where: 'Section' },
    rows: [
      { theorem: 'Weak law of large numbers', statement: 'X̄_n → μ', mode: 'in probability', condition: 'independent with finite variance (Chebyshev); a finite mean is enough (Khinchin)', where: '1.1' },
      { theorem: 'Strong law of large numbers', statement: 'X̄_n → μ', mode: 'almost sure', condition: 'independent and identically distributed, with finite mean (Kolmogorov)', where: '1.2' },
      { theorem: 'Law of large numbers in L²', statement: 'E[(X̄_n - μ)²] = σ²/n → 0', mode: 'in mean square', condition: 'uncorrelated, with finite variance', where: '1.3' },
      { theorem: 'Central limit theorem', statement: '√n (X̄_n - μ)/σ → N(0, 1)', mode: 'in distribution', condition: 'independent and identically distributed, with finite variance (Lindeberg-Lévy)', where: '1.4' },
      { theorem: 'Berry-Esseen', statement: 'sup |F_n - Φ| ≤ C ρ/(σ³ √n)', mode: 'speed in distribution', condition: 'finite third moment', where: '1.4, 1.11' },
      { theorem: 'Law of large numbers in distribution', statement: 'X̄_n → μ, a constant', mode: 'in distribution, here the same as in probability', condition: 'as for the weak law', where: '1.4' },
    ],
    after: 'The two laws say that the mean approaches the true mean: the weak one at every fixed n, the strong one along every path, the L² version also on average. The central limit says how the error that is left is distributed, and so how large it is: about σ/√n. It is the combination inference needs. The law of large numbers guarantees that the estimate goes to the right place; the central limit gives the shape of its uncertainty, from which intervals and tests are built.',
  },
  results: {
    intro: 'Many results of statistics are convergence theorems in disguise. Four of them, with the numbers of the false alarms and of the times between alarms.',
    consistency: 'Consistency. An estimator is consistent if it converges to the parameter: weakly (in probability) or strongly (almost surely). The share of false alarms F̂_n is consistent in both senses, by the two laws of large numbers; and so is every continuous function of a consistent estimator (the continuous mapping theorem), such as 1/X̄ for a rate.',
    slutsky: (rows) => {
      const at = (n) => rows.find((r) => r.n === n);
      return `Slutsky (1925). If X_n converges in distribution to X and Y_n in probability to a constant c, then X_n + Y_n converges to X + c and X_n Y_n to c X. That is what makes the t statistic normal: in the central limit σ is the true one, in practice it is estimated, and the estimate converges in probability, so the limit does not change. But it is an asymptotic result. For the false alarms at ${EN.pct(FALSE_ALARMS.rate, 0)} the t statistic, with σ estimated, is ${EN.num(at(30).t, 3)} away from the normal law at n = 30, against ${EN.num(at(30).z, 3)} with σ known; at n = 1,000 the gap has almost closed (${EN.num(at(1000).t, 4)} against ${EN.num(at(1000).z, 4)}).`;
    },
    delta: (d100, d1000) => `The delta method. If √n (θ̂ - θ) converges to N(0, σ²) and g is differentiable, then √n (g(θ̂) - g(θ)) converges to N(0, g'(θ)² σ²): the error of a function of the estimate is obtained by differentiating. For the log-odds ln(p/(1 - p)) the derivative is 1/(p(1 - p)), and the approximate standard deviation is 1/√(n p(1 - p)): ${EN.num(d1000.delta, 4)} at n = 1,000, against ${EN.num(d1000.exact, 4)} exactly. At n = 100 the gap is wider (${EN.num(d100.delta, 3)} against ${EN.num(d100.exact, 3)}), and ${EN.pct(d100.excluded, 1)} of the time, with zero alarms, the log-odds do not even exist.`,
    gc: (rows) => {
      const first = rows[0];
      const last = rows[rows.length - 1];
      return `Glivenko-Cantelli (1933). The empirical distribution function F_n converges to the true one uniformly, almost surely: sup |F_n - F| → 0. Kolmogorov also gave its speed: √n sup |F_n - F| converges in distribution to a law that bears his name, the basis of the Kolmogorov-Smirnov test used all over the page. Over ${EN.int(GC_REPS)} samples of times between alarms the mean distance goes down from ${EN.num(first.meanD, 3)} (n = ${EN.int(first.n)}) to ${EN.num(last.meanD, 4)} (n = ${EN.int(last.n)}), while √n times the distance stays between ${EN.num(Math.min(...rows.map((r) => r.meanScaled)), 2)} and ${EN.num(Math.max(...rows.map((r) => r.meanScaled)), 2)}, close to the mean of Kolmogorov’s law, ${EN.num(KOLMOGOROV_MEAN, 3)}.`;
    },
    mle: (rows) => {
      const at = (n) => rows.find((r) => r.n === n).mle;
      return `The normality of the maximum likelihood estimator. Under regularity conditions √n (θ̂ - θ) converges to N(0, 1/I(θ)), with I Fisher’s information, and the variance 1/(n I(θ)) is the smallest possible for an unbiased estimator (Cramér-Rao). For the rate λ of the alarms, estimated from the times between them with λ̂ = n/S_n, the law is known exactly: at n = 30 it is ${EN.num(at(30).distance, 3)} away from the normal law, it is biased by ${EN.pct(at(30).bias, 1)} and its variance is ${EN.num(at(30).efficiency, 2)} times the Cramér-Rao bound; at n = 1,000 the distance is ${EN.num(at(1000).distance, 4)} and the variance reaches the bound. It is the frequentist side of the Bernstein-von Mises theorem (section 2.11).`;
    },
    chartTitle: 'Kolmogorov distance from the normal law: σ known, σ estimated (Slutsky) and the maximum likelihood estimator, on logarithmic axes',
    tableTitle: 'The three distances, by n',
    cols: { n: 'n', z: 'Z, σ known', t: 't, σ estimated', mle: 'MLE of the rate', bias: 'Bias of the MLE', efficiency: 'Variance / Cramér-Rao' },
    deltaTitle: 'The delta method on the log-odds',
    deltaCols: { n: 'n', exact: 'Exact standard deviation', delta: 'Delta method', excluded: 'No log-odds (k = 0)' },
    gcTitle: 'Glivenko-Cantelli: the distance between the empirical distribution function and the true one',
    gcCols: { n: 'n', meanD: 'Mean distance', meanScaled: '√n times the distance', over: 'Above 1.358 (5% expected)' },
  },
  root: {
    paras: (sizes) => [
      'The sum of n values has variance Var(S_n) = Σ Var(X_i) + 2 Σ_{i<j} Cov(X_i, X_j). If the values are independent, or even just uncorrelated, the covariances are zero and the variances add up: Var(S_n) = n σ². The standard deviation, the square root of the variance, therefore grows as σ √n and not as n; dividing by n, the mean has standard deviation σ/√n, the standard error.',
      `That is why √n is everywhere. In the law of large numbers the error of the mean goes down as 1/√n. In the central limit the error must be multiplied by exactly √n to get a law that neither collapses nor explodes (the box below shows it). In inference every interval is about 2σ/√n wide, every z or t statistic divides by σ/√n, and the sample needed grows with the square of the precision: to estimate ${EN.pct(FALSE_ALARMS.rate, 0)} of false alarms within one point, at 95%, ${EN.int(sizes[0])} connections are enough; within half a point ${EN.int(sizes[1])} are needed, within a tenth of a point ${EN.int(sizes[2])}. Halving the error costs four times the data.`,
      'The speeds of section 1.11 speak of √n too: Berry-Esseen goes down as 1/√n, and Hoeffding’s inequality, exp(-2 n ε²), says that the deviations that matter are those of order 1/√n. The chart shows the two faces of the same fact on the 1,000 simulated rules: the standard deviation of the count grows as √n, the standard error of the share goes down as 1/√n, both with slope 1/2 on logarithmic axes.',
    ],
    chartTitle: 'Standard deviation of the count (it grows as √n) and standard error of the share (it falls as 1/√n), simulated and exact, on logarithmic axes',
    tableTitle: 'The count and the share of false alarms, by n',
    cols: { n: 'n', sdCount: 'Standard deviation of the count', exactCount: 'σ √n', sdShare: 'Standard error of the share', exactShare: 'σ/√n' },
    inferenceTitle: 'The standard error and the 95% interval of the share of false alarms',
    inferenceCols: { n: 'n', variance: 'Var(S_n) = n p(1 - p)', se: 'Standard error', half: '95% half-width' },
  },
  tryScale: {
    intro: `Choose α: the three histograms show n^α (mean - 1) for ${EN.int(SCALE_REPS)} means of n exponential times between alarms (with a mean of 1 minute), with n = 10, 100 and 1,000, on the same axis. With α below 1/2 the histograms shrink towards zero as n grows: that is the law of large numbers. With α above 1/2 they widen and leave the chart. Only with α = 1/2 do they stay the same and take the shape of the normal: that is the scale of the central limit.`,
    alphaLabel: (a) => `α = ${EN.plain(a)}`,
    chartTitle: (n) => `n = ${EN.int(n)}`,
    result: (charts, alpha) => `α = ${EN.plain(alpha)}: the standard deviation is ${listOf(charts.map((c) => `${EN.num(c.factor, 3)} at n = ${EN.int(c.n)}`), 'and')}${charts.some((c) => c.outside > 0.001) ? `; outside the chart ${listOf(charts.map((c) => EN.pct(c.outside)), 'and')}` : ''}.`,
  },
  bursts: {
    paras: (f05, f09) => [
      'All this rests on independence, or at least on the absence of correlation. But real false alarms often come in bursts: a nightly backup, a scheduled scan, a wrong configuration trigger many alarms in a row. The simplest model is a Markov chain: after an alarm the next one comes with probability p + ρ(1 - p), after a quiet connection with probability p(1 - ρ). The long-run share stays p, but two neighbouring connections have correlation ρ, and two at distance k have correlation ρ^k.',
      `The covariances are no longer zero, and the variance of the sum becomes n p(1 - p) [1 + 2 Σ (1 - k/n) ρ^k], which for large n is about n p(1 - p)(1 + ρ)/(1 - ρ). With ρ = ${EN.plain(f05.rho)} the variance of ${EN.int(f05.n)} connections is ${EN.num(f05.factor, 2)} times the independent one: it is like having ${EN.int(f05.effective)} independent connections instead of ${EN.int(f05.n)}. With ρ = ${EN.plain(f09.rho)} the factor is ${EN.num(f09.factor, 1)}, and the effective connections are ${EN.int(f09.effective)}. The law of large numbers still holds, because the correlations die out, and so does the central limit with √n; but the constant in front of 1/√n is larger.`,
    ],
    simulation: (rows) => {
      const at = (rho) => rows.find((r) => r.rho === rho);
      return `The simulation of ${EN.int(BURST_SECTION.reps)} windows of ${EN.int(BURST_SECTION.n)} connections confirms it: variance ${EN.num(at(0.5).variance, 1)} (exact ${EN.num(at(0.5).exact.variance, 1)}) with ρ = 0.5 and ${EN.num(at(0.9).variance, 1)} (${EN.num(at(0.9).exact.variance, 1)}) with ρ = 0.9. The trouble is for whoever ignores the dependence: the 95% interval computed as if the connections were independent covers the true share only ${EN.pct(at(0.5).coverage, 1)} of the time with ρ = 0.5 and ${EN.pct(at(0.9).coverage, 1)} with ρ = 0.9. In statistics it is the problem of the effective sample size, common in time series and logs.`;
    },
    after: 'When the dependence does not die out fast enough (long memory) the speed changes too: the error of the mean goes down as n^(H - 1), with H > 1/2, more slowly than 1/√n. And when the variables do not even have a finite variance, as in section 1.10, √n no longer applies.',
    tableTitle: 'The simulated bursts, against the exact variance and the naive interval',
    cols: { rho: 'ρ', variance: 'Simulated variance', exact: 'Exact variance', factor: 'Factor', effective: 'Effective connections', coverage: 'Coverage of the naive interval', predicted: 'Predicted coverage' },
  },
  tryBursts: {
    intro: 'Choose the correlation between neighbouring connections. The two strips show the first 400 connections, independent and in bursts, with the same mean share of 3%; the chart shows the exact standard error of the share as n grows. The two lines are parallel, with slope -1/2: √n stays, the constant changes.',
    rhoLabel: (r) => `Correlation ρ = ${EN.plain(r)}`,
    strips: { independent: 'Independent', bursts: 'In bursts' },
    stripLabel: (name, alarms, total) => `${name}: ${EN.int(alarms)} ${alarms === 1 ? 'alarm' : 'alarms'} in the first ${EN.int(total)} connections`,
    result: (f) => `ρ = ${EN.plain(f.rho)}: with ${EN.int(f.n)} connections the variance is ${EN.num(f.factor, 2)} times the independent one, like ${EN.int(f.effective)} independent connections; the naive 95% interval covers about ${EN.pct(f.coverage, 1)}.`,
    chartTitle: 'Standard error of the share of alarms, independent and in bursts, on logarithmic axes',
  },
  conditional: {
    paras: [
      'The probability of A given B is P(A | B) = P(A ∩ B)/P(B), with P(B) > 0: the probability of A computed again in the smaller world where B has happened. Three rules follow from it. The product rule, P(A ∩ B) = P(A | B) P(B), which extends to a chain of events. The law of total probability, P(A) = Σ_i P(A | B_i) P(B_i) over a partition. And independence: A and B are independent when P(A | B) = P(A), that is, when knowing B changes nothing.',
      'In statistics conditional probability is everywhere, often without its name. The likelihood is the probability of the data given the parameter, P(data | θ). A p-value is the probability, given the null hypothesis, of data at least as extreme. The coverage of a confidence interval is conditional on the true value. And Bayes’ theorem reverses the conditioning, from P(data | θ) to P(θ | data). Confusing the two directions is the most common mistake of applied statistics; the three examples that follow show it up close.',
    ],
    chainIntro: 'The product rule: the chain of a phishing attack, stage by stage. Every probability is conditional on the previous stages: among the e-mails delivered, how many are opened; among those opened, how many are clicked; and so on. The numbers are plausible orders of magnitude, not data.',
    chainTitle: 'The chain of an attack: the conditional probabilities and their product',
    chainCols: { stage: 'Stage', p: 'P(stage | previous)', cumulative: 'P(getting this far)' },
    stages: { delivered: 'Gets past the filter', opened: 'Is opened', clicked: 'The link is clicked', credentials: 'The credentials are entered', mfa: 'MFA is bypassed' },
    chainText: (c) => `For a single e-mail the breach has probability ${EN.pct(c.breach, 2)}, the product of the five conditional ones. But a campaign is made of many e-mails, and the probability of at least one breach is 1 - (1 - p)^m: with 100 e-mails it is ${EN.pct(c.campaigns[1].breach)}, with 1,000 ${EN.pct(c.campaigns[2].breach)}. Without MFA, the last link, the probability per e-mail rises to ${EN.pct(c.withoutMfa, 1)}, and over 1,000 e-mails the breach is almost certain: the probability of avoiding it is ${EN.sci(1 - c.campaigns[2].withoutMfa, 1)}. Every link multiplies: that is why defence in depth works.`,
    indepIntro: 'Independence and conditional independence do not imply each other. The triage network of section 2.4 gives an example in each direction.',
    indepTitle: 'The two causes of the network, before and after the EDR alarm',
    indepCols: { when: '', phishing: 'P(phishing)', exploit: 'P(exploit)', product: 'Product', both: 'P(both)' },
    indepRows: { before: 'No clue', after: 'Given the EDR alarm' },
    indepText: (f) => `A priori phishing and exploit are independent: the probability of both is the product of the two. Given the EDR alarm, their common effect, they no longer are: P(both | EDR) = ${EN.pct(f.causesGivenEdr.both, 2)}, while the product would be ${EN.pct(f.causesGivenEdr.phishing * f.causesGivenEdr.exploit, 2)}; one cause makes the other less likely. Conversely, the unusual login and the EDR alarm are dependent (P(unusual login) goes from ${EN.pct(f.login, 1)} to ${EN.pct(f.loginGivenEdr, 1)} when the EDR goes off), but knowing that there was a phishing they become independent: P(unusual login | phishing) = ${EN.pct(f.loginGivenPhishing, 1)} with or without the EDR. The naive Bayes of sections 2.8 and 2.9 assumes exactly a conditional independence, of the words or of the fields given the class; and Simpson’s paradox of Homework #6 is an association that reverses when conditioning on a third factor.`,
    pvalueIntro: (e) => `A p-value is a probability conditional on the null hypothesis, not the probability of the null hypothesis. An IDS rule is documented with ${EN.pct(e.p0, 0)} of false alarms; on ${EN.int(e.n)} benign connections it raises ${EN.int(e.k)}. H0: the share is still ${EN.pct(e.p0, 0)}; H1: the rule has degraded to ${EN.pct(e.p1, 0)}.`,
    pvalueText: (e) => `The p-value is P(at least ${EN.int(e.k)} alarms | H0) = ${EN.p(e.pValue)}: below 5%, so H0 is rejected. But the probability that H0 is true needs Bayes and a prior. If rules usually stay as documented, P(H0) = ${EN.pct(e.priorH0, 0)}, with a likelihood ratio of ${EN.num(e.lr, 1)} in favour of H1 the result is P(H0 | data) = ${EN.pct(e.posteriorH0, 1)}; with a prior of half and half it would be ${EN.pct(e.posteriorEven, 1)}. The p-value does not depend on the prior; the probability of H0 does.`,
    manyText: (f) => `The same happens over many tests: among the hypotheses rejected, how many are true? It depends on how many of the hypotheses tested really have an effect, the base rate of section 2.3. With ${EN.pct(f.real, 0)} of real effects, power ${EN.pct(f.power, 0)} and α = ${EN.plain(f.alpha)}, ${EN.pct(f.falseDiscovery, 0)} of the rejections are false: it is the false discovery rate (Benjamini and Hochberg, 1995), and the reason why Ioannidis (2005) wrote that many published findings are false.`,
  },
  tryPvalue: {
    intro: 'Move the sliders: the share of the hypotheses tested that have a real effect, the power of the test and α. The squares are 1,000 tests: green the true discoveries, purple the missed effects, red the wrong rejections, grey the true null hypotheses left alone. Every test rejects in the same way, with p below α; what changes is the probability that a rejection is right.',
    real: (v) => `Real effects: ${EN.pct(v, 0)}`,
    power: (v) => `Power: ${EN.pct(v, 0)}`,
    alpha: (v) => `α: ${EN.plain(v)}`,
    iconTitle: 'A thousand tests: every square is a hypothesis',
    tableTitle: 'The four categories of the tests',
    cols: { category: 'Category', truth: 'Truth', decision: 'Decision', count: 'Tests', share: 'Share' },
    truth: { trueDiscovery: 'real effect', missedEffect: 'real effect', falseDiscovery: 'H0 true', trueNull: 'H0 true' },
    decision: { trueDiscovery: 'rejected', missedEffect: 'not rejected', falseDiscovery: 'rejected', trueNull: 'not rejected' },
    result: (f) => `Out of ${EN.int(f.total)} tests: ${EN.int(f.counts[0])} true discoveries, ${EN.int(f.counts[2])} false ones, ${EN.int(f.counts[1])} missed effects. P(H0 true | rejected) = ${EN.pct(f.falseDiscovery, 1)}.`,
  },
  limits: {
    intro: `The examples of section 2 show what Bayesian inference gives and what it costs. The table takes the phishing campaign of section 2.6 and looks at it with the four priors, after one, three and ten days. The conclusion "another training session is needed" is drawn when P(share > ${EN.pct(TARGET_RATE, 0)}) exceeds ${EN.pct(DECISION_LEVEL, 0)}.`,
    tableTitle: (level) => `The same campaign with four priors: posterior mean and P(share > ${EN.pct(TARGET_RATE, 0)}); ✓ when it exceeds ${EN.pct(level, 0)}`,
    cols: { prior: 'Prior', day1: 'After 1 day', days3: 'After 3 days', days10: 'After 10 days' },
    cell: (x) => `${EN.pct(x.mean)}; P = ${EN.pct(x.above)}${x.act ? ' ✓' : ''}`,
    paras: (rows) => {
      const spread = (r, keys) => {
        const means = keys.map((k) => r.priors[k].mean);
        return [Math.min(...means), Math.max(...means)];
      };
      const fair = ['uniform', 'jeffreys', 'informed'];
      const [a1, b1] = spread(rows[0], fair);
      const [a10, b10] = spread(rows[rows.length - 1], fair);
      return [
        `With one day of data the three reasonable priors give means from ${EN.pct(a1)} to ${EN.pct(b1)}; after ten days from ${EN.pct(a10)} to ${EN.pct(b10)}. The wrong and self-confident prior stays far away for longer (${EN.pct(rows[0].priors.wrong.mean)}, then ${EN.pct(rows[rows.length - 1].priors.wrong.mean)}): it needs much more data, as section 2.11 shows. Here the decision is the same for everybody, because the data are clear; with borderline data the prior can move it.`,
        'The advantages. The prior brings information that the data alone do not have: the base rate of the alarm (2.3) is real knowledge, and ignoring it leads to the fallacy. The posterior answers directly the questions that matter, such as P(share > 10%), which a p-value does not give (2.1). Updating is sequential and coherent (2.5, 2.6), it works with little data and with structured models such as networks (2.4), and it leads naturally to decisions.',
        'The limitations. The prior must be chosen, and with little data the choice matters; a wrong and self-confident prior slows learning down (2.11), and one that gives probability zero to a value can never change its mind. The likelihood can be wrong: naive Bayes counts dependent evidence twice and becomes overconfident (2.9). The probabilities of a network are often expert estimates (2.4). And outside conjugate cases the posterior must be computed numerically, on a grid (2.6) or with Monte Carlo.',
        'The influence on the conclusions is measured with a sensitivity analysis, like the table: the inference is repeated with different plausible priors, and the conclusion is declared only if it holds. With a lot of data the prior matters less and less (Bernstein-von Mises, 2.11); with little data it must be chosen with care and declared.',
      ];
    },
  },
  checks: {
    intro: 'Every number of the page is checked against an independent reference: the special functions against SciPy 1.17.1 and mpmath at 50 digits; the alarm and the network against an exact computation with fractions; Wald’s test, the coverages, the exact distances and the two filters against an implementation in Python written apart; the simulations against the same Python with its own copy of the generators, which with the same seed must give the same numbers; the generators against their reference C code.',
    summary: (ok, total) => `${ok} of ${total} checks passed`,
    details: (n) => `The ${n} checks, one by one`,
    cols: { check: 'Check', expected: 'Expected', actual: 'Obtained', result: 'Result' },
    groups: { functions: 'The special functions', bayes: 'Bayes: alarm, network, Wald, coverages', filters: 'The two naive Bayes filters', convergence: 'The kinds of convergence', simulation: 'The simulations (seed 2026)', generator: 'The generator' },
    ok: 'passed',
    failed: 'failed',
    pending: 'waiting for the simulations',
  },
  tests: {
    intro: `The hypothesis tests of the page, at the significance level α = ${EN.num(SIGNIFICANCE, 2)}. The expected result is the one the theory predicts: when the null hypothesis is true, a test at 5% still rejects it once in twenty.`,
    cols: { subject: 'What is checked', hypothesis: 'Null hypothesis H0', statistic: 'Statistic', p: 'p-value', verdict: 'Result', expected: 'Expected' },
    rows: {
      generator: { subject: 'The generator of the page', hypothesis: 'The mean of 100,000 uniform values is 1/2 (z test)' },
      sprtLegit: { subject: `Wald, ${EN.int(SPRT_RUNS)} simulated users`, hypothesis: 'The share of users blocked is the exact one (binomial)' },
      sprtAttacker: { subject: `Wald, ${EN.int(SPRT_RUNS)} simulated attackers`, hypothesis: 'The share of attackers cleared is the exact one' },
      coverage: { subject: `Jeffreys, ${EN.int(COVERAGE_RUNS)} simulated campaigns`, hypothesis: 'The simulated coverage is the exact one' },
      smsFilter: { subject: 'The spam filter against "all legitimate"', hypothesis: 'The two are wrong in the same way (McNemar)' },
      kddFilter: { subject: 'Naive Bayes on NSL-KDD against "all attacks"', hypothesis: 'The two are wrong in the same way (McNemar)' },
      cltExponential: { subject: 'Standardized sums of 30 exponential values', hypothesis: 'They have the normal law (Kolmogorov-Smirnov)' },
      cltUniform: { subject: 'Standardized sums of 12 uniform values', hypothesis: 'They have the normal law' },
      cltCauchy: { subject: 'Means of 100 Cauchy values', hypothesis: 'They have the standard Cauchy law' },
      bytes: { subject: 'Mean bytes of 1,000 connections', hypothesis: 'They have the normal law' },
      hash: { subject: `${EN.int(HASH_TEST.trials)} trials of ${HASH_TEST.bits}-bit identifiers`, hypothesis: 'The share of collisions is the exact one' },
      gc: { subject: `Glivenko-Cantelli: √n times the distance, ${EN.int(GC_REPS)} samples of 1,000`, hypothesis: 'It has Kolmogorov’s law' },
    },
    statNames: { z: 'z', k: 'k', D: 'D', 'b/c': 'b/c' },
    verdicts: { reject: 'H0 rejected', accept: 'H0 not rejected' },
    expected: { reject: 'rejected', accept: 'not rejected (95% of the time)' },
    pending: 'Running: the simulations have not finished yet.',
  },
  history: {
    intro: 'From the law of large numbers to its strong forms and to the theorems of statistics, and from a problem of inverse probability to Bayesian networks and spam filters: the ideas used in the homework in chronological order.',
    items: [
      { year: '1713', title: 'Jacob Bernoulli', text: 'Ars Conjectandi, published posthumously: the first law of large numbers, the frequency of an event approaches its probability.' },
      { year: '1733', title: 'de Moivre', text: 'The normal approximation of the binomial: the first central limit, with its √n.' },
      { year: '1763', title: 'Bayes and Price', text: 'Richard Price publishes the essay of Thomas Bayes on inverse probability: inferring the probability of a cause from its effects.' },
      { year: '1774', title: 'Laplace', text: 'Mémoire sur la probabilité des causes par les événements: the theorem in its general form, then the rule of succession and, in 1810, the central limit.' },
      { year: '1853', title: 'Cauchy', text: 'He studies the law that bears his name, which Poisson had already noticed in 1824 as an exception to the mean.' },
      { year: '1867', title: 'Chebyshev', text: 'The inequality that proves the weak law of large numbers for variables with finite variance.' },
      { year: '1906', title: 'Markov', text: 'The chains that bear his name, to show that the law of large numbers holds without independence too.' },
      { year: '1908', title: 'Student', text: 'William Gosset, at the Guinness brewery, finds the law of the t statistic, with the variance estimated from the data.' },
      { year: '1909', title: 'Borel', text: 'The strong law for Bernoulli trials, with normal numbers: the first almost sure convergence.' },
      { year: '1917', title: 'Cantelli', text: 'The Borel-Cantelli lemma and a strong law with the fourth moment.' },
      { year: '1922', title: 'Lindeberg', text: 'The condition under which the central limit holds also for variables that are not identical.' },
      { year: '1922-1925', title: 'Fisher', text: 'Maximum likelihood, the information that bears his name and the p-value as a measure of the evidence against H0.' },
      { year: '1925', title: 'Slutsky', text: 'The theorem that combines convergence in distribution and convergence in probability.' },
      { year: '1927', title: 'Wilson', text: 'The interval for a proportion that inverts the score test.' },
      { year: '1933', title: 'Kolmogorov', text: 'The axioms of probability, the strong law for identically distributed variables with finite mean, and the limit law of √n times the distance from the empirical distribution function.' },
      { year: '1933', title: 'Glivenko and Cantelli', text: 'The empirical distribution function converges uniformly to the true one, almost surely.' },
      { year: '1934', title: 'Clopper and Pearson', text: 'The exact interval for a proportion, built on the binomial.' },
      { year: '1940', title: 'Turing and Good', text: 'At Bletchley Park, Banburismus against Enigma: weights of evidence in bans and decibans, added one after the other.' },
      { year: '1941-1942', title: 'Berry and Esseen', text: 'The speed of the central limit: the distance from the normal is at most C ρ/(σ³ √n).' },
      { year: '1945', title: 'Wald', text: 'The sequential probability ratio test, developed for the acceptance testing of war materiel; in 1948, with Wolfowitz, its optimality.' },
      { year: '1945-1946', title: 'Rao and Cramér', text: 'The lower bound on the variance of an unbiased estimator, which the MLE reaches asymptotically.' },
      { year: '1946', title: 'Jeffreys', text: 'The invariant prior that bears his name; for a proportion it is Beta(1/2, 1/2).' },
      { year: '1949', title: 'Doob', text: 'The consistency of the posterior: with infinite data it converges almost surely to the true value.' },
      { year: '1963', title: 'Hoeffding', text: 'The exponential inequality for sums of bounded variables.' },
      { year: '1988', title: 'Pearl', text: 'Probabilistic Reasoning in Intelligent Systems: Bayesian networks as an inference engine.' },
      { year: '1995', title: 'Benjamini and Hochberg', text: 'The false discovery rate among many tests, and how to control it.' },
      { year: '1998-2002', title: 'Sahami, Graham', text: 'The Bayesian spam filter: first in a research paper, then in "A Plan for Spam".' },
      { year: '2001', title: 'Brown, Cai and DasGupta', text: 'Interval Estimation for a Binomial Proportion: why the Wald interval should be abandoned.' },
      { year: '2005', title: 'Ioannidis', text: 'Why Most Published Research Findings Are False: the p-value read without the base rate.' },
      { year: '2009', title: 'Tavallaee and colleagues', text: 'NSL-KDD, the cleaned version of the data of the KDD Cup 1999.' },
      { year: '2011', title: 'Almeida, Gómez Hidalgo and Yamakami', text: 'The SMS Spam Collection; in the same year Shevtsova brings the Berry-Esseen constant down to 0.4748.' },
    ],
    after: 'The history runs on two tracks that the homework crosses: that of limits (Bernoulli, Chebyshev, Borel, Kolmogorov, Berry and Esseen) and that of inference (Bayes, Laplace, Fisher, Turing, Wald, Pearl). Bernstein-von Mises joins them: with enough data, believing and counting give the same answer.',
  },
  conclusion: {
    paras: (f) => [
      'The four modes of convergence are not synonyms. Almost sure and in mean square imply in probability, which implies in distribution; every other arrow has a counterexample (Bernoulli(1/n), the spike, the typewriter, (-1)^n Z). The law of large numbers lives in probability (the weak one), almost surely (the strong one) and in mean square; the central limit in distribution; and the same language carries the consistency of estimators, Slutsky, the delta method, Glivenko-Cantelli and the normality of the MLE.',
      `√n comes from the variance that adds up: with independent, or just uncorrelated, values Var(S_n) = n σ², so the error of the mean is σ/√n and the central limit must be written with √n. That is why halving the error costs four times the data (${EN.int(f.half)} connections to estimate 3% within half a point). Without independence the constant grows: with alarms in bursts of correlation 0.5 the variance is ${EN.num(f.burstFactor, 1)} times the independent one. And without a finite variance, or with very heavy tails like the bytes of NSL-KDD, the normal arrives late or never.`,
      `Conditional probability is the heart of inference, and Bayes’ theorem reverses it: from the likelihood P(data | hypothesis) to the posterior P(hypothesis | data), through the prior. A p-value is not the probability of H0 (${EN.p(f.pValue)} against ${EN.pct(f.posteriorH0, 1)} in the example of section 2.1). On the examples the engine works: it shows how much the base rate weighs (${EN.pct(f.alarm)} of real attacks among the alarms), explains one cause away with another, decides in a few attempts, estimates the share of clicks with an interval that reads as a probability (${EN.pct(f.rate.mean)}, from ${EN.pct(f.rate.lo)} to ${EN.pct(f.rate.hi)}), filters spam (${EN.pct(f.sms)} accuracy) and the attacks of NSL-KDD (${EN.pct(f.kdd)}).`,
      'Advantages and limitations go together: the prior brings information and demands a declared choice; with little data it influences the conclusions, with a lot it leaves them to the data. The posterior that converges, normal and concentrated on the true value (Bernstein-von Mises), is the bridge between the two parts of the assignment: with enough data, believing and counting give the same answer.',
    ],
  },
  legends: {
    detected: 'Attacks seen',
    missed: 'Attacks missed',
    falseAlarm: 'False alarms',
    quiet: 'Normal, no alarm',
    phishing: 'Phishing',
    exploit: 'Exploit',
    compromise: 'Compromise',
    legit: 'Legitimate user',
    attacker: 'Attacker',
    live: 'The address of this box',
    block: 'Blocking threshold',
    clear: 'Clearing threshold',
    uniformPrior: 'Uniform prior',
    informedPrior: 'Informed prior',
    wrongPrior: 'Wrong prior',
    trueRate: 'True share',
    prior: 'Prior',
    likelihood: 'Likelihood',
    posterior: 'Posterior',
    wald: 'Wald',
    wilson: 'Wilson',
    clopper: 'Clopper-Pearson',
    jeffreys: 'Jeffreys',
    nominal: '95%',
    spam: 'Spam',
    ham: 'Legitimate',
    simulated: 'Simulated rules',
    exact: 'Exact',
    chebyshev: 'Chebyshev',
    hoeffding: 'Hoeffding',
    normal: 'Normal',
    paths: 'Paths',
    band: 'Band of one point',
    outsideAt: 'Outside at n',
    outsideAfter: 'Outside again after n',
    simulatedMse: 'Simulated',
    exactMse: 'p(1 - p)/n',
    bernoulli: 'False alarms',
    bernoulliBound: 'False alarms, Berry-Esseen',
    exponential: 'Exponential',
    exponentialBound: 'Exponential, Berry-Esseen',
    sums: 'Simulated sums',
    normalDensity: 'Normal density',
    cauchyDensity: 'Cauchy density',
    estimate: 'Monte Carlo estimate',
    exactBand: 'Exact, with the 95% band',
    means: 'Simulated means',
    zKnown: 'Z, σ known',
    tEstimated: 't, σ estimated',
    mle: 'MLE of the rate',
    countSpread: 'Standard deviation of the count',
    shareSpread: 'Standard error of the share',
    scaled: 'n^α (mean - 1)',
    independent: 'Independent',
    correlated: 'In bursts',
    trueDiscovery: 'True discoveries',
    missedEffect: 'Missed effects',
    falseDiscovery: 'Wrong rejections',
    trueNull: 'True nulls left alone',
    day1: 'The first day',
    days10: 'Ten days',
  },
  tips: {
    alarm: (k, count, share) => `${en.legends[['detected', 'missed', 'falseAlarm', 'quiet'][k]]}: ${EN.int(count)} connections (${EN.pctSmall(share)})`,
    network: (i, values) => [en.network.steps[i], ...['phishing', 'exploit', 'compromise'].map((n, k) => (values[k] === null ? null : `${en.legends[n]} ${EN.pct(values[k])}`))].filter(Boolean).join(' · '),
    sprt: (n, values, upper, lower, keys) => [`Attempt ${EN.int(n)}`, ...values.map((v, k) => (v === null ? null : `${en.legends[keys[k]]} ${EN.num(v, 3)}`)), upper === null ? null : `block ${EN.num(upper, 3)}`, lower === null ? null : `clear ${EN.num(lower, 3)}`].filter(Boolean).join(' · '),
    campaign: (row, u, i, truth) => [`Day ${EN.int(row.day)}: ${EN.int(row.clicks)} clicks out of ${EN.int(row.sent)}`, u ? `uniform ${en.rate.interval(u)}` : null, i ? `informed ${en.rate.interval(i)}` : null, truth ? `true ${EN.pct(CAMPAIGN.rate, 0)}` : null].filter(Boolean).join(' · '),
    density: (x, prior, lik, post) => [`Share ${EN.pct(x, 1)}`, prior === null ? null : `prior ${EN.num(prior, 2)}`, lik === null ? null : `likelihood ${EN.num(lik, 2)}`, post === null ? null : `posterior ${EN.num(post, 2)}`].filter(Boolean).join(' · '),
    coverage: (p, values) => [`True share ${EN.pct(p, 1)}`, ...['wald', 'wilson', 'clopper', 'jeffreys'].map((m, k) => (values[k] === null ? null : `${en.legends[m]} ${EN.pct(values[k])}`))].filter(Boolean).join(' · '),
    logOdds: (bin, spam, ham) => [`Log-odds ${en.spam.bin(bin)}`, spam === null ? null : `spam ${EN.int(spam)}`, ham === null ? null : `legitimate ${EN.int(ham)}`].filter(Boolean).join(' · '),
    outside: (n, sim, exact, cheb) => [`n = ${EN.int(n)}`, sim === null ? null : `simulated ${EN.pct(sim)}`, exact === null ? null : `exact ${EN.pct(exact)}`, cheb === null ? null : `Chebyshev ${EN.pct(cheb)}`].filter(Boolean).join(' · '),
    paths: (n, min, max, out, total) => `n = ${EN.int(n)}: the 20 estimates go from ${EN.pct(min, 2)} to ${EN.pct(max, 2)}, ${EN.int(out)} of ${EN.int(total)} outside the band`,
    after: (n, out, after) => [`n = ${EN.int(n)}`, out === null ? null : `outside at n ${EN.pct(out)}`, after === null ? null : `outside again after ${EN.pct(after)}`].filter(Boolean).join(' · '),
    mse: (n, sim, exact) => [`n = ${EN.int(n)}`, sim === null ? null : `simulated ${EN.sci(sim, 2)}`, exact === null ? null : `exact ${EN.sci(exact, 2)}`].filter(Boolean).join(' · '),
    sequence: (n, values) => `n = ${EN.int(n)}: ${values.map((v) => EN.num(v, Math.abs(v) >= 10 ? 0 : 2)).join(', ')}`,
    clt: (n, values) => [`n = ${EN.int(n)}`, ...['bernoulli', 'bernoulliBound', 'exponential', 'exponentialBound'].map((k, i) => (values[i] === null ? null : `${en.legends[k]} ${EN.num(values[i], 4)}`))].filter(Boolean).join(' · '),
    histogram: (from, to, count, share) => `From ${EN.num(from, 2)} to ${EN.num(to, 2)}: ${EN.int(count)} (${EN.pct(share)})`,
    hash: (trials, estimate, exact) => [`${EN.int(trials)} trials`, estimate === null ? null : `estimate ${EN.pct(estimate, 2)}`, exact === null ? null : `exact ${EN.pct(exact, 2)}`].filter(Boolean).join(' · '),
    strip: (n, alarm, run) => (alarm ? `Connection ${EN.int(n)}: alarm, ${run > 1 ? `in a burst of ${EN.int(run)}` : 'on its own'}` : `Connection ${EN.int(n)}: no alarm`),
    node: (name, p, prior, observed) => (observed === null || observed === undefined ? `${name}: ${EN.pct(p, 1)} (${EN.pct(prior, 1)} before the clues)` : `${name}: observed, ${observed ? 'yes' : 'no'}`),
    mode: (name, implies, impliedBy) => {
      const low = (x) => x.charAt(0).toLowerCase() + x.slice(1);
      const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).map(low).join(', ')} and ${low(xs[xs.length - 1])}` : low(xs[0]));
      const a = implies.length ? `implies ${list(implies)}` : 'implies no other mode';
      const b = impliedBy.length ? `implied by ${list(impliedBy)}` : 'implied by no other mode';
      return `${name}: ${a}; ${b}.`;
    },
    cauchy: (n, min, max) => `n = ${EN.int(n)}: the means go from ${EN.num(min, 2)} to ${EN.num(max, 2)}`,
    speed: (n, values) => [`n = ${EN.int(n)}`, ...['exact', 'chebyshev', 'hoeffding', 'normal'].map((k, i) => (values[i] === null ? null : `${en.legends[k]} ${EN.prob(values[i])}`))].filter(Boolean).join(' · '),
    bvm: (n, clicks, u, w, truth) => [`n = ${EN.int(n)}, ${EN.int(clicks)} clicks`, u ? `uniform ${en.bvm.pair(u)}` : null, w ? `wrong ${en.bvm.pair(w)}` : null, truth ? `true ${EN.pct(CAMPAIGN.rate, 0)}` : null].filter(Boolean).join(' · '),
    bvmDistance: (n, u, w) => [`n = ${EN.int(n)}`, u === null ? null : `uniform ${EN.num(u, 4)}`, w === null ? null : `wrong ${EN.num(w, 4)}`].filter(Boolean).join(' · '),
    results: (n, z, t, mle) => [`n = ${EN.int(n)}`, z === null ? null : `σ known ${EN.num(z, 4)}`, t === null ? null : `σ estimated ${EN.num(t, 4)}`, mle === null ? null : `MLE ${EN.num(mle, 4)}`].filter(Boolean).join(' · '),
    root: (n, count, share) => [`n = ${EN.int(n)}`, count ? `count ${EN.num(count[0], 2)} (σ √n = ${EN.num(count[1], 2)})` : null, share ? `share ${EN.num(share[0], 5)} (σ/√n = ${EN.num(share[1], 5)})` : null].filter(Boolean).join(' · '),
    burst: (n, ind, cor) => [`n = ${EN.int(n)}`, ind === null ? null : `independent ${EN.num(ind, 5)}`, cor === null ? null : `in bursts ${EN.num(cor, 5)}`].filter(Boolean).join(' · '),
    discovery: (k, count) => `${en.legends[['trueDiscovery', 'missedEffect', 'falseDiscovery', 'trueNull'][k]]}: ${EN.int(count)} tests`,
    likelihood: (x, a, b) => [`Share ${EN.pct(x, 1)}`, a === null ? null : `first day ${EN.num(a, 3)}`, b === null ? null : `ten days ${EN.num(b, 3)}`].filter(Boolean).join(' · '),
  },
  names: {
    methods: { wald: 'Wald', wilson: 'Wilson', clopper: 'Clopper-Pearson', jeffreys: 'Jeffreys' },
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English, with the data of the SMS and of NSL-KDD inside: after extracting the archive it opens with a double click on index.html, even offline. With node homework7.js it prints in the terminal the kinds of convergence, √n and the bursts, the other results of statistics, conditional probability, the alarm, the network, Wald’s test, the campaign, the coverages, the two filters and the checks; --seed changes the seed.',
    contents: 'Contents: index.html, style.css, homework7.js (data, computations, charts and command line), app.js (interface and texts), README.txt.',
    zip: 'Download homework7',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'The modes of convergence and the role of √n; conditional probability, Bayes’ theorem and statistical inference.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
  },
};

export const HW7_TEXTS = { it, en };
