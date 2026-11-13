// src/pages/statistics/hw6/texts.js
// I testi dell'Homework #6 in italiano e in inglese, per la pagina del sito
// e per il programma scaricabile: le due versioni dicono le stesse cose con
// le stesse parole. Ogni numero arriva dagli argomenti (le tabelle e i test
// calcolati sui dati) o dalle costanti della libreria: nessuna frase
// contiene un risultato scritto a mano.
import { DATA_SOURCE, DEPENDENCE_SIZES, RARE_SHARE, SERVICE_GROUPS, SIGNIFICANCE, UCB } from './homework6.js';
import { pParts } from './view.js';

/**
 * The assignment as the professor wrote it, block by block. The only
 * change: none (the double space of the title disappears on screen anyway).
 */
export const originalAssignment = () => [
  { type: 'title', text: 'Homework  (Statistical Independence)' },
  { type: 'p', text: 'Given any bivariate dataset (X, F), Programmatically construct the contingency table and calculate conditional and marginal frequencies.' },
  { type: 'p', text: 'Compute the expected frequencies under the assumption of independence. Calculate the Chi-square statistic (OPTIONAL: also the p-value).' },
  {
    type: 'p',
    text: 'Recall the theoretical concepts of independence in statistics and probability. Interpret the results to determine whether the two variables are statistically independent or dependent. Briefly discuss the conclusions, distinguishing statistical association from causality.',
  },
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

/** A list in words: a, b and c. */
const listOf = (items, and) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`);

/** The degrees of freedom in words: 1 grado, 8 gradi; 1 degree, 8 degrees. */
const gradi = (df) => `${df} ${df === 1 ? 'grado' : 'gradi'} di libertà`;
const degrees = (df) => `${df} ${df === 1 ? 'degree' : 'degrees'} of freedom`;

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', '×');

const effectIt = { negligible: 'trascurabile', small: 'piccola', medium: 'media', large: 'grande' };

const it = {
  fmt: IT,
  effects: effectIt,
  ui: {
    index: 'Indice',
    indexTitle: 'Indice dell’homework',
    close: 'Chiudi',
    backToTop: 'Torna su',
    computing: 'Calcolo in corso...',
    language: 'Lingua',
    error: (message) => `Il calcolo non è riuscito: ${message}`,
    total: 'Totale',
  },
  names: {
    variables: { protocol: 'protocollo', service: 'servizio', flag: 'flag', class: 'classe', outcome: 'esito' },
    classes: { normal: 'normale', dos: 'DoS', probe: 'Probe', r2l: 'R2L', u2r: 'U2R' },
    outcomes: { normal: 'normale', attack: 'attacco' },
    others: 'altri',
    otherServices: 'altri servizi',
    all: 'tutte',
    department: 'Dip.',
    allDepartments: 'Tutti',
  },
  sections: {
    assignment: '0. La consegna',
    task: '1. TASK: la tabella di contingenza di un dataset di sicurezza',
    dataset: '1.1 Il dataset: 22.544 connessioni di NSL-KDD',
    table: '1.2 La tabella di contingenza',
    frequencies: '1.3 Frequenze marginali e condizionate',
    expected: '1.4 Le frequenze attese se X e F fossero indipendenti',
    chi2: '1.5 La statistica chi quadrato e il p-value',
    tryTable: 'Prova: la vostra tabella',
    gtest: '1.6 Il test G',
    small: '1.7 Tabelle piccole: la regola del 5, Fisher e Yates',
    permutation: '1.8 Il test di permutazione',
    tryPermutation: 'Prova: rimescolare F',
    checks: '1.9 Verifiche',
    theory: '2. L’indipendenza in probabilità e in statistica',
    interpretation: '3. Indipendenti o dipendenti? L’interpretazione',
    decision: '3.1 La decisione',
    residuals: '3.2 Quali celle: i residui standardizzati',
    strength: '3.3 Quanto è forte: la V di Cramér',
    tryDependence: 'Prova: una dipendenza regolabile',
    pairs: '3.4 Tutte le coppie di variabili',
    causality: '4. Associazione non è causalità',
    simpson: '4.1 Il paradosso di Simpson: Berkeley, 1973',
    trySimpson: 'Prova: dividere per dipartimento',
    security: '4.2 Nei dati di sicurezza',
    tests: '5. Riepilogo dei test statistici',
    history: '6. Contesto storico',
    conclusion: '7. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna chiede di partire da un dataset bivariato (X, F) qualsiasi e di costruirne via codice la tabella di contingenza, con le frequenze marginali e condizionate; poi di calcolare le frequenze attese se X e F fossero indipendenti e la statistica chi quadrato, con il suo p-value (facoltativo). Chiede infine di richiamare i concetti di indipendenza in probabilità e in statistica, di interpretare i risultati per dire se le due variabili sono indipendenti o dipendenti e di discutere brevemente le conclusioni, distinguendo l’associazione statistica dalla causalità.',
      'La pagina segue quest’ordine. La sezione 1 lavora su dati veri di sicurezza informatica, le 22.544 connessioni di rete del test set di NSL-KDD: si scelgono X e F fra cinque variabili, e la tabella (1.2), le frequenze marginali e condizionate (1.3), le attese (1.4), il χ² e il p-value (1.5) si ricalcolano dai record. Accanto ci sono il test G (1.6), i rimedi per le tabelle piccole (1.7), il test di permutazione, che arriva al p-value senza formule (1.8), e le verifiche dei calcoli (1.9). La sezione 2 richiama la teoria, la 3 interpreta i risultati, la 4 separa l’associazione dalla causalità con un caso reale, le ammissioni a Berkeley del 1973. Seguono il riepilogo dei test, il contesto storico e le conclusioni.',
      'Quattro riquadri «Prova» lasciano mettere le mani sui numeri: una tabella da scrivere o incollare, il rimescolamento di F, una dipendenza da regolare con un cursore e il paradosso di Simpson diviso per dipartimento. Tutti i numeri sono calcolati nel browser, e il programma scaricabile stampa gli stessi.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese.',
  },
  task: {
    intro: [
      'Il dataset è il test set di NSL-KDD, la versione ripulita dei dati della KDD Cup 1999 preparata dal Canadian Institute for Cybersecurity (Tavallaee e altri, 2009): 22.544 connessioni TCP/IP osservate in una rete simulata, ognuna con 41 caratteristiche e un’etichetta, «normal» o il nome dell’attacco. È il dataset classico su cui si allenano e si confrontano i sistemi di rilevamento delle intrusioni, ed è pieno di variabili categoriali: il caso per cui è nato il test del χ².',
      `La pagina ne usa cinque: il protocollo (TCP, UDP, ICMP), il servizio (i ${SERVICE_GROUPS} più frequenti, gli altri insieme), il flag con cui la connessione si è chiusa, la classe (normale, DoS, Probe, R2L, U2R) e l’esito (normale o attacco). La domanda pratica è quella di chi scrive le regole di un IDS: il protocollo dice qualcosa sul tipo di attacco? Se X e F fossero indipendenti, conoscere l’uno non aiuterebbe a prevedere l’altro.`,
    ],
  },
  dataset: {
    intro: `Si scelgono le due variabili: X sulle righe della tabella, F sulle colonne. All’apertura X è il protocollo e F la classe; ogni scelta ricalcola la sezione 1 e l’interpretazione della 3. «Accorpa i livelli rari» unisce i livelli di una variabile con meno del ${IT.pct(RARE_SHARE, 0)} dei record, quando sono almeno due: è il rimedio classico quando alcune frequenze attese sono troppo piccole (sezione 1.7).`,
    xLabel: 'X (righe)',
    fLabel: 'F (colonne)',
    levelsLabel: 'Livelli',
    mergeLabel: 'Accorpa i livelli rari',
    sampleTitle: 'Le prime otto connessioni del file, con le colonne che la pagina usa',
    sampleCols: { n: '#', protocol: 'Protocollo', service: 'Servizio', flag: 'Flag', label: 'Etichetta', class: 'Classe' },
    categoriesTitle: 'Le 38 etichette del test set e la loro classe',
    categoriesIntro: 'Per i 22 attacchi del training la classe è quella del file training_attack_types della KDD Cup 1999; per gli attacchi che ha solo il test set è quella del database degli attacchi della valutazione DARPA del 1999 (MIT Lincoln Laboratory), da cui vengono; snmpgetattack, snmpguess, worm e sqlattack non sono in nessuno dei due e prendono la classe più comune in letteratura. L’unico caso conteso è httptunnel: alcune tabelle lo mettono fra gli U2R, il Lincoln Laboratory fra gli R2L, e la pagina segue il Lincoln Laboratory.',
    categoryCols: { label: 'Etichetta', count: 'Record', category: 'Classe', source: 'Fonte della classe' },
    sources: { data: 'dato', kdd99: 'KDD Cup 1999', ll99: 'Lincoln Lab 1999', literature: 'letteratura' },
    flagsTitle: 'Che cosa dicono i flag (gli stati della connessione di Bro, da cui vengono)',
    flags: {
      SF: 'aperta e chiusa normalmente',
      REJ: 'tentativo rifiutato (al SYN risponde un RST)',
      S0: 'tentativo senza risposta: tipico di un SYN flood o di una scansione',
      RSTO: 'stabilita, poi interrotta con un RST da chi l’ha aperta',
      RSTR: 'stabilita, poi interrotta con un RST dal destinatario',
      S3: 'stabilita, chiusura tentata dal destinatario senza risposta',
      SH: 'SYN e poi FIN senza SYN-ACK: connessione aperta a metà, da scansione',
      S1: 'stabilita e mai chiusa',
      S2: 'stabilita, chiusura tentata da chi l’ha aperta senza risposta',
      OTH: 'nessun SYN visto, solo traffico a metà strada',
      RSTOS0: 'SYN seguito da un RST di chi l’ha aperta, senza SYN-ACK',
    },
    citation: `Dati: ${DATA_SOURCE.dataset}, ${IT.int(DATA_SOURCE.records)} record. Licenza: «You may redistribute, republish, and mirror the ISCX NSL-KDD dataset in any form. However, any use or redistribution of the data must include a citation to the NSL-KDD dataset and the paper referenced below.» Articolo: ${DATA_SOURCE.paper}.`,
    datasetLink: 'La pagina del dataset (UNB)',
    paperLink: 'L’articolo (IEEE)',
  },
  table: {
    intro: 'La tabella si costruisce leggendo i record una volta: ogni connessione aggiunge 1 alla cella della sua modalità di X e della sua modalità di F. Le somme di riga e di colonna, i margini, contano le connessioni di ogni modalità; il totale in basso a destra è N.',
    formulas: 'n_ij = numero di record con X = x_i e F = f_j\nn_i. = Σ_j n_ij      n_.j = Σ_i n_ij      N = Σ_i Σ_j n_ij',
    title: (x, f) => `X = ${x} (righe), F = ${f} (colonne): numero di connessioni`,
    empty: (cells) => `Ci sono celle vuote: ${cells}. Già questo dice qualcosa sul legame fra le due variabili.`,
  },
  frequencies: {
    intro: 'Le frequenze marginali sono i margini divisi per N: la distribuzione di X da sola e quella di F da sola. Le condizionate dividono ogni cella per il totale della sua riga, cioè danno la distribuzione di F dentro una modalità di X (i profili di riga); oppure per il totale della sua colonna, la distribuzione di X dentro una modalità di F (i profili di colonna).',
    formulas: 'marginali:     f(x_i) = n_i. / N         f(f_j) = n_.j / N\ncondizionate:  f(f_j | x_i) = n_ij / n_i.   f(x_i | f_j) = n_ij / n_.j',
    marginalTitle: (v) => `La marginale di ${v}`,
    marginalCols: { level: 'Modalità', count: 'Record', share: 'Frequenza' },
    profileLabel: 'Condizionate',
    profiles: { rows: 'di F dato X (profili di riga)', cols: 'di X dato F (profili di colonna)' },
    rowsTitle: 'La distribuzione di F dentro ogni modalità di X (profili di riga), e in fondo la marginale di F',
    colsTitle: 'La distribuzione di X dentro ogni modalità di F (profili di colonna), e a destra la marginale di X',
    chartTitle: 'La distribuzione di F dentro ogni modalità di X, e in fondo quella di tutte le connessioni (la marginale)',
    after: (g) => `Se X e F fossero indipendenti, tutte le barre sarebbero uguali all’ultima, a meno del rumore del campione. Qui no: fra le connessioni con ${g.x} quelle con ${g.f} sono il ${IT.pct(g.share)}, contro il ${IT.pct(g.marginal)} di tutte. È la dipendenza, vista prima di qualunque test.`,
  },
  expected: {
    intro: 'Se X e F fossero indipendenti, la probabilità di una cella sarebbe il prodotto delle marginali, P(X = x_i, F = f_j) = P(X = x_i) P(F = f_j). Su N record la cella attesa è quindi N (n_i./N)(n_.j/N) = n_i. n_.j / N: la frazione n_.j/N della modalità f_j applicata alle n_i. connessioni della riga.',
    formulas: 'E_ij = n_i. × n_.j / N',
    tableTitle: 'Le frequenze attese sotto indipendenza',
    note: 'Le attese hanno gli stessi margini dei dati: cambia solo il modo in cui i totali si distribuiscono nelle celle.',
    chooseLabel: 'Modalità di X da confrontare',
    chartTitle: (x) => `Osservate e attese per X = ${x}`,
    cols: { level: 'F', observed: 'Osservate', expected: 'Attese', difference: 'O - E' },
    after: (c) => `La cella più lontana dall’indipendenza (quella con il residuo più grande, sezione 3.2) è ${c.x} con ${c.f}: si osservano ${IT.int(c.o)} connessioni contro ${IT.num(c.e, 1)} attese, ${c.o > c.e ? `${IT.num(c.o / c.e, 1)} volte tante` : `il ${IT.pct(1 - c.o / c.e, 0)} in meno`}. Il grafico si apre sulla sua riga.`,
  },
  chi2: {
    intro: 'Il χ² di Pearson misura quanto le osservate si allontanano dalle attese, cella per cella, in unità della grandezza delle attese stesse: (O - E)² / E. Sommato sulle celle vale 0 solo se la tabella è esattamente quella dell’indipendenza. Se X e F sono indipendenti, al crescere di N la sua legge si avvicina a quella di un χ² con (r - 1)(c - 1) gradi di libertà: tante sono le celle libere una volta fissati i margini.',
    formulas: 'χ² = Σ_i Σ_j (n_ij - E_ij)² / E_ij\ngradi di libertà = (r - 1)(c - 1)\np-value = P(χ²(gl) ≥ χ² osservato)',
    contributionsTitle: 'Il contributo di ogni cella al χ²',
    result: (s) => `χ² = ${IT.num(s.chi2, 3)} con ${gradi(s.df)}, p-value ≈ ${IT.p(s.p, s.log10p)}.`,
    decision: (s) =>
      s.p < SIGNIFICANCE
        ? `Con α = ${IT.num(SIGNIFICANCE, 2)} il valore critico è ${IT.num(s.critical, 2)}: il χ² osservato lo supera ${IT.num(s.chi2 / s.critical, 0)} volte, e l’ipotesi d’indipendenza è rifiutata.`
        : `Con α = ${IT.num(SIGNIFICANCE, 2)} il valore critico è ${IT.num(s.critical, 2)}: il χ² osservato resta sotto, e l’ipotesi d’indipendenza non è rifiutata.`,
    after: 'Un p-value così piccolo non è un errore di calcolo: con decine di migliaia di record anche una dipendenza modesta lascia un segno enorme. Il numero in virgola mobile va in underflow sotto 10^-308, e già SciPy restituisce 0; la pagina tiene separato il logaritmo del p-value (la funzione gamma incompleta con la frazione continua di Lentz), così il numero resta leggibile, e le verifiche lo confrontano con mpmath a 50 cifre.',
    notTestable: 'Una variabile ha una sola modalità con record: non c’è niente da confrontare, e il test non si può fare.',
  },
  tryTable: {
    intro: 'Scrivete i conteggi nelle celle, oppure incollate due colonne di dati, un record per riga (x,f): la tabella, le attese, il χ² con il p-value, il G e la V di Cramér si aggiornano a ogni tasto. All’apertura c’è un piccolo esercizio di phishing: 40 dipendenti, chi ha seguito la formazione e chi no, e chi ha cliccato il link della mail di prova e chi l’ha segnalata. Con una tabella 2 × 2 compaiono anche il test esatto di Fisher e la correzione di Yates (sezione 1.7).',
    modeLabel: 'Dati',
    modes: { grid: 'Celle', pairs: 'Record (x,f)' },
    exampleNames: { x: ['formati', 'non formati'], f: ['cliccato', 'segnalato'] },
    xName: 'Formazione',
    fName: 'Mail di prova',
    examplePairs: ['notte,bloccato', 'notte,bloccato', 'notte,riuscito', 'giorno,riuscito', 'giorno,riuscito', 'giorno,riuscito', 'giorno,fallito', 'giorno,riuscito', 'sera,fallito', 'sera,riuscito', 'sera,fallito', 'giorno,riuscito'].join('\n'),
    addRow: 'Aggiungi riga',
    addCol: 'Aggiungi colonna',
    removeRow: 'Togli riga',
    removeCol: 'Togli colonna',
    reset: 'Ripristina l’esempio',
    cellLabel: (x, f) => `Conteggio per ${x} e ${f}`,
    rowName: (i) => `riga ${i + 1}`,
    colName: (j) => `colonna ${j + 1}`,
    pairsLabel: 'Un record per riga: modalità di X, virgola, modalità di F',
    headerLabel: 'La prima riga contiene i nomi delle colonne',
    errors: {
      empty: 'Non ci sono record.',
      tooMany: 'Al massimo 100.000 record.',
      line: (n, text) => `La riga ${n} («${text}») non ha due valori separati da una virgola.`,
      levels: 'Al massimo 12 modalità per variabile.',
      oneLevel: 'Servono almeno due modalità per X e due per F.',
      cell: 'Ogni cella è un intero da 0 a 1.000.000.',
      zero: 'La tabella è vuota.',
    },
    records: (n) => `${IT.int(n)} record letti.`,
    result: (s) => `χ² = ${IT.num(s.chi2, 3)} con ${gradi(s.df)}, p ≈ ${IT.p(s.p, s.log10p)}; G = ${IT.num(s.G, 3)}, p ≈ ${IT.p(s.gP, s.gLog10p)}; V di Cramér = ${IT.num(s.V, 3)} (associazione ${effectIt[s.effect]}).`,
    verdict: (s) => (s.p < SIGNIFICANCE ? 'Al 5% l’indipendenza è rifiutata.' : 'Al 5% l’indipendenza non è rifiutata: i dati sono compatibili con l’indipendenza (che non per questo è dimostrata).'),
    small: (s) => `Attenzione: ${s.small.below5} celle su ${s.small.cells} hanno attesa sotto 5${s.small.below1 ? `, ${s.small.below1} sotto 1` : ''}; l’approssimazione χ² non è affidabile (regola di Cochran).`,
    twoByTwo: (s) => `2 × 2: con la correzione di Yates χ² = ${IT.num(s.yates.chi2, 3)}, p ≈ ${IT.p(s.yates.p, s.yates.log10p)}; test esatto di Fisher p = ${IT.p(s.fisher.p)}; odds ratio ${IT.num(s.fisher.oddsRatio, 3)}.`,
  },
  gtest: {
    intro: 'Il test G confronta le stesse osservate e attese con il logaritmo del loro rapporto invece che con il quadrato della differenza: è il rapporto di verosimiglianza fra il modello con le celle libere e quello dell’indipendenza. Per il teorema di Wilks (1938), sotto indipendenza ha la stessa legge asintotica del χ², con gli stessi gradi di libertà.',
    formulas: 'G = 2 Σ_i Σ_j n_ij ln(n_ij / E_ij)        (le celle vuote contano 0)',
    result: (s) => `G = ${IT.num(s.G, 3)}, p ≈ ${IT.p(s.gP, s.gLog10p)}: ${s.gP < SIGNIFICANCE ? 'l’indipendenza è rifiutata anche così' : 'anche così l’indipendenza non è rifiutata'}.`,
    compare: (s) => `I due test misurano la stessa distanza in due modi: qui G è ${IT.num(s.G / s.chi2, 2)} volte il χ². Quando le attese sono grandi e le osservate vicine il rapporto si avvicina a 1; si allontana quando ci sono celle vuote o molto lontane dalle attese, che il quadrato del χ² e il logaritmo del G pesano in modo diverso.`,
  },
  small: {
    intro: 'L’approssimazione χ² vale per attese grandi. La regola pratica di Cochran (1954): nessuna cella con attesa sotto 1 e al più il 20% sotto 5. Quando non vale ci sono tre rimedi: accorpare i livelli rari (il pulsante della sezione 1.1), usare un test esatto, o far dare il p-value a una simulazione (sezione 1.8).',
    rule: (s) => `Nella tabella scelta ${s.small.below5} celle su ${s.small.cells} hanno attesa sotto 5 e ${s.small.below1} sotto 1 (la più piccola vale ${IT.num(s.small.minExpected, 2)}): la regola è ${s.small.cochran ? 'rispettata' : 'violata, e il p-value della formula va preso con cautela'}.`,
    exactIntro: 'Per una tabella 2 × 2 il test esatto di Fisher calcola il p-value senza approssimazioni: con i margini fissati la cella in alto a sinistra segue una legge ipergeometrica, e si sommano le probabilità delle tabelle non più probabili di quella osservata. Yates (1934) propone invece di correggere il χ² togliendo 1/2 a ogni |O - E|, perché una variabile discreta approssimata con una continua tende a esagerare. Qui un campione di poche connessioni estratte a caso dal dataset: TCP o no, normale o attacco.',
    sizeLabel: 'Connessioni nel campione',
    newSample: 'Altro campione',
    tableTitle: (n) => `${n} connessioni estratte a caso: TCP o no, normale o attacco`,
    rows: ['TCP', 'UDP o ICMP'],
    result: (s) => `χ² senza correzione ${IT.num(s.chi2, 3)}, p ≈ ${IT.p(s.p, s.log10p)}; con Yates ${IT.num(s.yates.chi2, 3)}, p ≈ ${IT.p(s.yates.p, s.yates.log10p)}; Fisher esatto p = ${IT.p(s.fisher.p)}.`,
    cochran: (s) => (s.small.cochran ? 'Qui le attese rispettano la regola di Cochran.' : `Qui ${s.small.below5} celle su 4 hanno attesa sotto 5: la formula χ² non è affidabile, e Fisher è il test da guardare.`),
    after: 'Con pochi record i tre p-value possono dire cose diverse: il χ² senza correzione è il più ottimista, Yates il più prudente, Fisher è esatto ma, essendo discreto, spesso un po’ conservativo. Con l’ultimo pulsante si cambia campione: il verdetto oscilla, come deve con pochi dati.',
  },
  permutation: {
    intro: [
      'Il test di permutazione arriva al p-value senza la legge del χ². Se X e F sono indipendenti, mescolare a caso i valori di F fra i record non cambia nulla di sostanziale: i margini restano gli stessi, sparisce solo un eventuale legame. Si rimescola molte volte, ogni volta si calcola il χ², e si conta quanto spesso il caso produce un valore grande almeno quanto quello osservato: (1 + conteggio)/(B + 1) è il p-value.',
      'Sul dataset intero il χ² osservato è così grande che nessun rimescolamento ci arriva vicino. Il riquadro lavora quindi su un campione di poche connessioni estratte a caso, con la stessa coppia X, F della sezione 1.1: lì la risposta non è scontata, e si vede la distribuzione nascere.',
    ],
    formulas: 'p ≈ (1 + #{rimescolamenti con χ² ≥ χ² osservato}) / (B + 1)',
  },
  tryPermutation: {
    intro: 'Scegliete quante connessioni estrarre e quante volte rimescolare, poi premete il pulsante: l’istogramma dei χ² dei rimescolamenti cresce e si posa sulla densità del χ² con gli stessi gradi di libertà, e la linea tratteggiata segna il χ² osservato.',
    sizeLabel: 'Connessioni estratte',
    countLabel: 'Rimescolamenti',
    run: 'Rimescola',
    again: 'Altro campione',
    running: (done, B) => `Rimescolamenti: ${IT.int(done)} su ${IT.int(B)}...`,
    chartTitle: (n, df) => `I χ² di F rimescolato su ${n} connessioni, contro la densità del χ² con ${gradi(df)}`,
    result: (r) => `Su ${IT.int(r.n)} connessioni il χ² osservato è ${IT.num(r.observed, 3)}: ${IT.int(r.exceed)} rimescolamenti su ${IT.int(r.B)} arrivano almeno lì, p ≈ ${IT.p(r.pPerm)}. La formula del χ² dice p ≈ ${IT.p(r.p)}.`,
    agreement: (r) => (Math.abs(Math.log10(Math.max(r.pPerm, 1e-12)) - Math.log10(Math.max(r.p, 1e-12))) < 0.5 ? 'Le due strade danno quasi lo stesso numero: qui l’approssimazione χ² funziona.' : 'Le due strade danno numeri diversi: con celle attese così piccole la formula non è affidabile, e il rimescolamento è il p-value da credere.'),
    beyond: (v) => `Il χ² osservato (${IT.num(v, 1)}) è fuori dal grafico, molto a destra: nessun rimescolamento ci arriva vicino.`,
    cochran: (s) => (s.small.cochran ? '' : `(In questo campione la regola di Cochran non vale: ${s.small.below5} celle su ${s.small.cells} hanno attesa sotto 5.)`),
  },
  checks: {
    intro: 'Ogni numero della pagina è controllato contro un riferimento indipendente: i conteggi contro una lettura del file originale in Python, le tabelle e i test contro SciPy 1.17.1 e NumPy, i p-value troppo piccoli per SciPy (che va in underflow anche nei logaritmi) contro mpmath a 50 cifre, il test di Cochran-Mantel-Haenszel su Berkeley contro R e un calcolo esatto con le frazioni, i generatori contro il loro codice C di riferimento.',
    summary: (ok, total) => `${ok} verifiche superate su ${total}`,
    details: (n) => `Le ${n} verifiche, una per una`,
    cols: { check: 'Verifica', expected: 'Atteso', actual: 'Ottenuto', result: 'Esito' },
    groups: { data: 'I dati', tables: 'Tabelle, statistiche e residui', tests: 'La legge del χ²', small: 'Tabelle piccole', simpson: 'Berkeley', generator: 'Il generatore' },
    ok: 'superata',
    failed: 'fallita',
  },
  theory: {
    paras: [
      'In probabilità due eventi A e B sono indipendenti se P(A ∩ B) = P(A) P(B), cioè, quando P(B) > 0, se P(A | B) = P(A): sapere che B è avvenuto non cambia la probabilità di A. Due variabili discrete X e F sono indipendenti se questo vale per tutte le coppie di valori: la distribuzione congiunta è il prodotto delle marginali, e ogni distribuzione di F condizionata a un valore di X è uguale alla marginale di F. È la versione in formule delle barre tutte uguali della sezione 1.3.',
    ],
    formulas: 'A, B indipendenti:   P(A ∩ B) = P(A) P(B)   ⇔   P(A | B) = P(A)   (se P(B) > 0)\nX, F indipendenti:   P(X = x, F = f) = P(X = x) P(F = f)   per ogni x, f\n                ⇔   P(F = f | X = x) = P(F = f)   per ogni x con P(X = x) > 0',
    after: [
      'In statistica le probabilità non si conoscono: si stimano con le frequenze, e anche se X e F sono davvero indipendenti la tabella osservata non è mai esattamente il prodotto dei margini, per il solo rumore del campione. La domanda diventa un test d’ipotesi: H0 «X e F sono indipendenti» contro H1 «non lo sono». Il χ² misura la distanza fra le frequenze osservate e quelle che H0 prevede; la sua legge sotto H0, asintotica per N grande, dice quanto una distanza così sia plausibile per caso.',
      'Perché (r - 1)(c - 1) gradi di libertà: le celle sono r × c, ma i margini sono fissati dai dati; scelte le celle delle prime r - 1 righe e c - 1 colonne, le altre sono obbligate. Pearson nel 1900 contava r c - 1 gradi; Fisher nel 1922 mostrò che stimare i margini ne toglie (r - 1) + (c - 1).',
      'Tre cose che l’indipendenza non è. Non è l’incompatibilità: due eventi incompatibili con probabilità positive sono anzi dipendenti, perché se uno avviene l’altro è escluso (una connessione non può essere insieme DoS e normale). Non è la correlazione nulla: per variabili numeriche l’indipendenza implica covarianza zero ma non il contrario, e per variabili categoriali una correlazione non è nemmeno definita, mentre il χ² coglie qualunque forma di dipendenza. E non passa da due a tre variabili: X e F possono essere indipendenti prese da sole e dipendenti dentro ogni livello di una terza Z, o il contrario, come mostra la sezione 4.',
    ],
  },
  interpretation: {
    intro: 'La sezione 1 ha calcolato; qui si legge. Tre domande, nell’ordine in cui se le pone chi analizza un log: c’è dipendenza? dove? quanto è forte?',
  },
  decision: {
    paras: (s, pair) => [
      s.p < SIGNIFICANCE
        ? `Per X = ${pair.x} e F = ${pair.f} il χ² vale ${IT.num(s.chi2, 2)} con ${gradi(s.df)} e il p-value è circa ${IT.p(s.p, s.log10p)}: con α = ${IT.num(SIGNIFICANCE, 2)} l’ipotesi d’indipendenza è rifiutata, e ${pair.x} e ${pair.f} sono statisticamente dipendenti. Il test G dice lo stesso.`
        : `Per X = ${pair.x} e F = ${pair.f} il χ² vale ${IT.num(s.chi2, 2)} con ${gradi(s.df)} e il p-value è ${IT.p(s.p, s.log10p)}: con α = ${IT.num(SIGNIFICANCE, 2)} l’indipendenza non è rifiutata. Non è una prova d’indipendenza: dice solo che questi dati non bastano a escluderla.`,
      `«Statisticamente» è la parola che conta. Con N = ${IT.int(s.N)} il test vede anche dipendenze piccole, e il p-value misura quanto siamo sicuri che una dipendenza ci sia, non quanto sia grande. Per il dove servono i residui (3.2), per il quanto la V di Cramér (3.3).`,
    ],
  },
  residuals: {
    intro: 'Il residuo standardizzato di una cella (aggiustato, Haberman 1973) è la differenza fra osservata e attesa divisa per la sua deviazione standard sotto indipendenza. Se X e F sono indipendenti si comporta come una normale standard: oltre ±1,96 la cella si discosta dall’indipendenza al 5%, oltre ±2,58 all’1%, oltre ±3,29 allo 0,1%. Il colore lo dice: rosso, più connessioni dell’atteso; blu, meno.',
    formulas: 'r_ij = (n_ij - E_ij) / √(E_ij (1 - n_i./N)(1 - n_.j/N))',
    title: 'I residui standardizzati di ogni cella',
    scale: 'Colori: oltre ±1,96 (5%), ±2,58 (1%) e ±3,29 (0,1%); rosso sopra l’atteso, blu sotto.',
    after: (c, names) => {
      const cell = (x) => `${names.x[x.i]} con ${names.f[x.j]} (${IT.num(x.z, 1)})`;
      const parts = [];
      if (c.above.length) parts.push(`Le celle più sopra l’atteso: ${listOf(c.above.map(cell), 'e')}.`);
      if (c.below.length) parts.push(`Le più sotto: ${listOf(c.below.map(cell), 'e')}.`);
      parts.push(`${c.significant} celle su ${c.total} si discostano dall’indipendenza al 5%.`);
      return parts.join(' ');
    },
    protocolClass: (f) =>
      `Il perché sta nei meccanismi degli attacchi. Le DoS su ICMP sono smurf e pod (${IT.int(f.smurf.icmp + f.pod.icmp)} connessioni, tutte ICMP); le Probe su ICMP sono soprattutto ipsweep e saint (${IT.int(f.ipsweep.icmp + f.saint.icmp)}); le R2L su UDP sono richieste SNMP, snmpguess e snmpgetattack (${IT.int(f.snmpguess.udp + f.snmpgetattack.udp)}); e neptune, il SYN flood più numeroso del dataset (${IT.int(f.neptune.tcp)} connessioni), è tutto TCP. Il protocollo non decide l’attacco: è l’attacco che, per come è fatto, sceglie il protocollo.`,
  },
  strength: {
    intro: 'Il χ² cresce con N: raddoppiando i dati con le stesse proporzioni raddoppia anche lui, e il p-value crolla. Per misurare quanto è forte la dipendenza, indipendentemente da N, Cramér (1946) divide il χ² per il suo massimo possibile, N (min(r, c) - 1): la V va da 0 (indipendenza) a 1 (una variabile determina l’altra). Moltiplicata per √(min(r, c) - 1) diventa la w di Cohen, per cui 0,1, 0,3 e 0,5 sono le soglie convenzionali di un effetto piccolo, medio e grande.',
    formulas: 'V = √(χ² / (N (min(r, c) - 1)))          w = V √(min(r, c) - 1)',
    result: (s, pair) => `Per ${pair.x} e ${pair.f}: V = ${IT.num(s.V, 3)} e w = ${IT.num(s.w, 3)}, un’associazione ${effectIt[s.effect]}. Il p-value di 10^${Math.floor(s.log10p)} e un’associazione ${effectIt[s.effect]} non si contraddicono: il primo dice che la dipendenza è certa, la seconda quanto pesa.`,
  },
  tryDependence: {
    intro: 'Un registro di accessi simulato con il generatore della pagina: X è la fascia oraria del login (notte, giorno, sera), F il suo esito (riuscito, fallito, bloccato). Con probabilità θ l’esito segue la fascia (di notte bloccato, di giorno riuscito, di sera fallito), altrimenti è estratto per conto suo: θ = 0 è l’indipendenza perfetta, θ = 1 un legame deterministico. Spostate i cursori: con θ fisso il χ² cresce con n e il p-value scende, mentre la V resta circa la stessa.',
    names: { x: ['notte', 'giorno', 'sera'], f: ['riuscito', 'fallito', 'bloccato'] },
    xName: 'Fascia oraria',
    fName: 'Esito',
    thetaLabel: (t) => `Dipendenza θ = ${IT.num(t, 2)}`,
    nLabel: (n) => `Accessi n = ${IT.int(n)}`,
    result: (s, n, t) => `Su ${IT.int(n)} accessi con θ = ${IT.num(t, 2)}: χ² = ${IT.num(s.chi2, 2)}, p ≈ ${IT.p(s.p, s.log10p)}, V = ${IT.num(s.V, 3)} (${effectIt[s.effect]}). ${s.p < SIGNIFICANCE ? 'Al 5% l’indipendenza è rifiutata.' : 'Al 5% l’indipendenza non è rifiutata.'}`,
    chartTitle: 'Il p-value della stessa dipendenza al crescere di n (scala delle potenze di dieci), con il livello 0,05 tratteggiato',
    tableTitle: 'La stessa dipendenza a ogni n',
    cols: { n: 'n', chi2: 'χ²', p: 'p-value', V: 'V', verdict: 'Al 5%' },
    verdicts: { reject: 'rifiutata', accept: 'non rifiutata' },
    after: `Il messaggio pratico: un p-value minuscolo su milioni di righe di log non vuol dire che il legame conti; un p-value grande su pochi eventi non vuol dire che il legame non ci sia. La significatività dipende da n, l’intensità no. Le righe della tabella vanno da ${IT.int(DEPENDENCE_SIZES[0])} a ${IT.int(DEPENDENCE_SIZES[DEPENDENCE_SIZES.length - 1])} accessi, ognuna con un campione nuovo.`,
  },
  pairs: {
    intro: 'Le cinque variabili formano dieci coppie. Per ognuna la pagina costruisce la tabella e ne calcola χ², p-value e V di Cramér, in ordine di intensità: è la stessa analisi che nei sistemi di rilevamento delle intrusioni si usa per scegliere le caratteristiche più legate alla classe (la selezione delle feature con il χ²).',
    cols: { pair: 'Coppia', cells: 'Celle', chi2: 'χ²', df: 'gl', p: 'p-value', V: 'V', effect: 'Intensità', cochran: 'Cochran' },
    yes: 'sì',
    no: 'no',
    note: 'Classe ed esito hanno V = 1 per costruzione: l’esito è una funzione della classe (normale o attacco), il caso limite della dipendenza.',
    after: (top) => `Tolto quel caso, la coppia più associata è ${top.x} e ${top.f} (V = ${IT.num(top.V, 3)}). Tutte le coppie sono dipendenti al 5%: su 22.544 record non sorprende, ed è il motivo per cui conta l’intensità.`,
  },
  causality: {
    intro: [
      'Il χ² dice se due variabili sono associate, non perché. Un’associazione può venire da una causa diretta (X produce F), da una causa inversa (F produce X), da una terza variabile che le muove entrambe (un confondente) o dal modo in cui i dati sono stati raccolti (la selezione). La tabella di contingenza non distingue questi casi: per farlo servono un esperimento, in cui X si assegna a caso, o ipotesi esplicite su come i dati sono nati.',
      'I criteri di Bradford Hill (1965) elencano gli indizi che rendono plausibile una causa: forza dell’associazione, coerenza fra studi diversi, specificità, precedenza nel tempo, gradiente dose-risposta, plausibilità, esperimento. Nessuno basta da solo; la dipendenza statistica è solo il punto di partenza.',
    ],
  },
  simpson: {
    intro: (f) => [
      `Nell’autunno del 1973 l’Università della California a Berkeley ammise il ${IT.pct(f.menRate)} degli uomini e il ${IT.pct(f.womenRate)} delle donne che avevano chiesto un posto nei sei dipartimenti più grandi: una dipendenza fortissima fra genere ed esito (χ² = ${IT.num(f.chi2, 1)}, p ≈ ${IT.p(f.p, f.log10p)}). Bickel, Hammel e O’Connell (Science, 1975) guardarono dentro i dipartimenti: in ${f.womenAhead} su 6 le donne erano ammesse più degli uomini.`,
      'Il confondente era il dipartimento. Le donne avevano chiesto soprattutto i dipartimenti con pochi posti e molte domande, dove tutti erano respinti più spesso; gli uomini soprattutto quelli facili. Sommare i dipartimenti mescola due cose diverse, e il totale racconta una storia che nessun dipartimento racconta: è il paradosso di Simpson.',
      `Il test di Cochran-Mantel-Haenszel misura l’associazione fra genere ed esito tenendo fisso il dipartimento. Sui sei dipartimenti vale ${IT.num(f.cmh.statistic, 4)}, p = ${IT.p(f.cmh.p)}: dentro i dipartimenti l’indipendenza non è rifiutata, e l’odds ratio comune uomini contro donne, ${IT.num(f.cmh.oddsRatio, 3)}, è vicino a 1 (anzi appena a favore delle donne).`,
    ],
    chartTitle: 'Quota di ammessi per genere in ogni dipartimento e nei sei insieme',
    tableTitle: 'Le domande, gli ammessi e il test di ogni dipartimento',
    cols: { department: 'Dipartimento', men: 'Uomini', menRate: 'ammessi', women: 'Donne', womenRate: 'ammesse', p: 'p (Fisher)' },
    all: 'Tutti insieme',
    source: `Dati: Bickel, Hammel e O’Connell, «Sex Bias in Graduate Admissions: Data from Berkeley», Science 187 (1975); il dataset UCBAdmissions di R. I dipartimenti sono i sei più grandi, ${UCB.departments.join(', ')}.`,
  },
  trySimpson: {
    intro: 'Scegliete un dipartimento o tutti insieme: la tabella 2 × 2 e il suo test cambiano. La stessa domanda ha due risposte, e quella giusta dipende dal confronto che ha senso: a decidere l’ammissione è il dipartimento.',
    chooseLabel: 'Tabella',
    all: 'Tutti insieme',
    department: (d) => `Dipartimento ${d}`,
    rows: ['Uomini', 'Donne'],
    cols: ['Ammessi', 'Respinti'],
    result: (s, rates) => `Ammessi: uomini ${IT.pct(rates[0])}, donne ${IT.pct(rates[1])}. χ² = ${IT.num(s.chi2, 2)}, p ≈ ${IT.p(s.p, s.log10p)}; Fisher p = ${IT.p(s.fisher.p)}. ${s.p < SIGNIFICANCE ? 'Al 5% genere ed esito risultano dipendenti.' : 'Al 5% l’indipendenza fra genere ed esito non è rifiutata.'}`,
  },
  security: {
    paras: [
      'Nei dati di sicurezza le stesse trappole sono quotidiane. Il protocollo non «causa» gli attacchi: è l’attacco che sceglie il protocollo, per come è costruito (smurf usa ICMP perché sfrutta le risposte ai ping), quindi la freccia, se c’è, va dalla classe al protocollo. E le proporzioni di NSL-KDD non sono quelle di una rete vera: gli autori hanno scelto i record per livello di difficoltà, e nel test set gli attacchi sono più della metà delle connessioni. Le associazioni misurate valgono per questo campione; su un’altra rete, con un’altra frequenza di base degli attacchi, potrebbero cambiare.',
      'Un confondente tipico: se gli allarmi di un IDS sembrano più frequenti di notte, può darsi che la notte sia più pericolosa, oppure che di notte giri soprattutto traffico automatico (backup, scansioni pianificate) che l’IDS segnala a qualunque ora. Per distinguere le due spiegazioni bisogna stratificare per tipo di traffico, come Berkeley per dipartimento; per parlare di causa, cambiare una cosa alla volta, per esempio confrontando due regole con un test A/B.',
      'Infine la direzione e la selezione. Un’associazione fra «ha seguito la formazione» e «non clicca il phishing», come quella dell’esempio della sezione 1.5, non prova che la formazione funzioni, se a seguirla sono stati i dipendenti già più attenti. L’esperimento giusto assegna la formazione a caso, e solo allora la dipendenza nella tabella si può leggere come effetto.',
    ],
  },
  tests: {
    intro: `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. L’esito atteso è quello che la teoria o i dati noti fanno prevedere; dove dipende dal campione, la colonna lo dice.`,
    cols: { subject: 'Che cosa si verifica', hypothesis: 'Ipotesi nulla H0', statistic: 'Statistica', p: 'p-value', verdict: 'Esito', expected: 'Atteso' },
    rows: {
      chi2: (pair) => ({ subject: `NSL-KDD, ${pair.x} e ${pair.f} (χ²)`, hypothesis: `${pair.x} e ${pair.f} sono indipendenti` }),
      g: (pair) => ({ subject: `NSL-KDD, ${pair.x} e ${pair.f} (G)`, hypothesis: 'La stessa, con il rapporto di verosimiglianza' }),
      permutation: (n) => ({ subject: `Permutazione su ${n} connessioni`, hypothesis: 'F rimescolato produce χ² grandi quanto quello osservato' }),
      fisher: (n) => ({ subject: `Campione di ${n} connessioni (Fisher)`, hypothesis: 'TCP e attacco sono indipendenti' }),
      dependence: (t) => ({ subject: `Accessi simulati, θ = ${IT.num(t, 2)}`, hypothesis: 'Fascia oraria ed esito sono indipendenti' }),
      berkeley: { subject: 'Berkeley, sei dipartimenti insieme', hypothesis: 'Genere ed esito sono indipendenti' },
      cmh: { subject: 'Berkeley, dipartimento per dipartimento (CMH)', hypothesis: 'Indipendenza dentro ogni dipartimento' },
    },
    verdicts: { reject: 'H0 rifiutata', accept: 'H0 non rifiutata' },
    expected: { reject: 'rifiutata', accept: 'non rifiutata', depends: 'dipende dal campione', theta: (t) => (t === 0 ? 'non rifiutata (95% dei casi)' : 'rifiutata con n abbastanza grande') },
    statNames: { 'χ²': 'χ²', G: 'G', OR: 'odds ratio', CMH: 'CMH' },
    pending: 'In corso: il test di permutazione della sezione 1.8 sta ancora rimescolando.',
  },
  history: {
    intro: 'Da Pearson ai sistemi di rilevamento delle intrusioni, le idee usate nell’homework in ordine cronologico.',
    items: [
      { year: '1900', title: 'Pearson', text: 'Pubblica il criterio χ² sul Philosophical Magazine: la distanza fra frequenze osservate e attese, con la sua legge asintotica.' },
      { year: '1900-1903', title: 'Yule', text: 'Studia l’associazione fra attributi e il suo coefficiente Q, e nota che unire gruppi diversi può invertire un’associazione: il paradosso che porterà il nome di Simpson.' },
      { year: '1904', title: 'Pearson', text: 'On the Theory of Contingency: le tabelle a doppia entrata e il coefficiente di contingenza.' },
      { year: '1922', title: 'Fisher', text: 'Mostra che una tabella r × c ha (r - 1)(c - 1) gradi di libertà, non r c - 1 come pensava Pearson: la stima dei margini ne consuma.' },
      { year: '1934', title: 'Yates', text: 'Propone la correzione di continuità per il χ² delle tabelle 2 × 2 con numeri piccoli.' },
      { year: '1935', title: 'Fisher', text: 'In The Design of Experiments la signora che riconosce il tè: il test esatto per le tabelle 2 × 2, trovato in parallelo da Irwin e da Yates.' },
      { year: '1938', title: 'Wilks', text: 'Il teorema sulla legge asintotica del rapporto di verosimiglianza, da cui il test G.' },
      { year: '1946', title: 'Cramér', text: 'Nei Mathematical Methods of Statistics il coefficiente V, l’intensità dell’associazione indipendente da N.' },
      { year: '1951', title: 'Simpson', text: 'The Interpretation of Interaction in Contingency Tables: l’inversione delle associazioni quando si sommano strati diversi.' },
      { year: '1954', title: 'Cochran', text: 'Some Methods for Strengthening the Common χ² Tests: la regola pratica sulle attese sotto 5 e i test per tabelle stratificate.' },
      { year: '1959', title: 'Mantel e Haenszel', text: 'Il test per l’associazione dentro gli strati, nato per gli studi caso-controllo sul cancro.' },
      { year: '1965', title: 'Bradford Hill', text: 'Association or Causation?: i criteri per giudicare se un’associazione può essere una causa.' },
      { year: '1973', title: 'Haberman', text: 'I residui aggiustati per le tabelle di contingenza, che si leggono come normali standard.' },
      { year: '1975', title: 'Bickel, Hammel e O’Connell', text: 'Su Science le ammissioni di Berkeley: il paradosso di Simpson in un caso reale e famoso.' },
      { year: '1999', title: 'KDD Cup', text: 'I dati della valutazione DARPA del 1998 diventano la gara di rilevamento delle intrusioni della KDD Cup.' },
      { year: '2000', title: 'Pearl', text: 'Causality: un linguaggio formale (i grafi, l’operatore do) per distinguere associazione e causa.' },
      { year: '2009', title: 'Tavallaee, Bagheri, Lu e Ghorbani', text: 'A Detailed Analysis of the KDD CUP 99 Data Set: NSL-KDD, senza i record ripetuti e con il test set usato qui.' },
    ],
    after: 'La storia corre su due binari che l’homework incrocia: quello del test (Pearson, Fisher, Yates, Cramér) e quello dell’interpretazione (Yule, Simpson, Hill, Pearl). Il primo dice se c’è un legame, il secondo che cosa se ne può concludere.',
  },
  conclusion: {
    where: (c, names) => {
      const cell = (x) => `${names.x[x.i]} con ${names.f[x.j]}`;
      const parts = [];
      if (c.above[0]) parts.push(`${cell(c.above[0])} molto sopra l’atteso (${IT.num(c.above[0].z, 1)})`);
      if (c.below[0]) parts.push(`${cell(c.below[0])} molto sotto (${IT.num(c.below[0].z, 1)})`);
      return parts.length ? listOf(parts, 'e') : 'in nessuna cella in particolare';
    },
    paras: (f) => [
      `Sulle ${IT.int(f.N)} connessioni di NSL-KDD la tabella di contingenza di ${f.pair.x} e ${f.pair.f}, costruita dai record, mostra profili condizionati lontani dalla marginale; le frequenze attese sotto indipendenza ne sono lontane quanto basta per un χ² di ${IT.num(f.chi2, 1)} con ${gradi(f.df)}, p ≈ ${IT.p(f.p, f.log10p)}. ${f.p < SIGNIFICANCE ? 'Le due variabili sono statisticamente dipendenti' : 'L’indipendenza non è rifiutata'}; il test G arriva allo stesso verdetto, e la regola di Cochran è ${f.cochran ? 'rispettata' : 'violata (meglio accorpare i livelli rari)'}.`,
      `La dipendenza ha intensità ${effectIt[f.effect]} (V = ${IT.num(f.V, 3)}), e i residui dicono dove sta: ${f.where}. Con decine di migliaia di record la significatività è scontata; l’intensità e i residui sono ciò che serve a chi deve scrivere una regola.`,
      `L’associazione non è una causa. A Berkeley la dipendenza fra genere ed esito (p ≈ ${IT.p(f.berkeley.p, f.berkeley.log10p)}) sparisce dentro i dipartimenti (Cochran-Mantel-Haenszel, p = ${IT.p(f.cmh.p)}): il confondente era il dipartimento scelto. Nei dati di sicurezza valgono le stesse cautele: la direzione delle frecce, i confondenti come il tipo di traffico, e un dataset le cui proporzioni sono state scelte dagli autori.`,
    ],
  },
  legends: {
    observed: 'osservate',
    expected: 'attese sotto indipendenza',
    shuffles: 'χ² dei rimescolamenti',
    density: 'densità del χ²',
    observedChi2: 'χ² osservato',
    pValue: 'p-value',
    alpha: 'α = 0,05',
    men: 'uomini',
    women: 'donne',
  },
  tips: {
    conditional: (x, f, count, share, marginal) => `${x}, ${f}: ${IT.int(count)} connessioni, il ${IT.pct(share)} delle ${x} (fra tutte: ${IT.pct(marginal)})`,
    marginal: (f, share, total) => `Tutte le connessioni, ${f}: ${IT.pct(share)} (${IT.int(total)})`,
    expected: (x, f, o, e) => [`${x}, ${f}`, o !== null && `osservate ${IT.int(o)}`, e !== null && `attese ${IT.num(e, 1)}`].filter(Boolean).join(': ').replace(': attese', ', attese'),
    shuffles: (from, to, count, share) => `χ² da ${IT.num(from, 1)} a ${IT.num(to, 1)}: ${IT.int(count)} rimescolamenti (${IT.pct(share)})`,
    dependence: (r) => `n = ${IT.int(r.n)}: χ² ${IT.num(r.chi2, 1)}, p ≈ ${IT.p(r.p, r.log10p)}, V ${IT.num(r.V, 3)}`,
    simpson: (r, show) => {
      const name = r.key === 'all' ? 'Tutti i dipartimenti' : `Dipartimento ${r.key}`;
      const parts = [show.men && `uomini ${IT.pct(r.menRate)} di ${IT.int(r.men)}`, show.women && `donne ${IT.pct(r.womenRate)} di ${IT.int(r.women)}`].filter(Boolean);
      return parts.length ? `${name}: ${parts.join(', ')}` : null;
    },
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese, con i dati di NSL-KDD dentro: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline. Con node homework6.js stampa nel terminale la tabella, le frequenze, le attese, i test, i residui, il test di permutazione, Berkeley e le verifiche; --x, --f, --merge, --seed, --sample e --perms cambiano i parametri.',
    contents: 'Contenuto: index.html, style.css, homework6.js (dati, calcoli, grafici e riga di comando), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework6',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'L’indipendenza statistica: la tabella di contingenza, le frequenze attese e il test del chi quadrato su dati reali di sicurezza, e la differenza fra associazione e causalità.',
    course: 'Statistics, laurea magistrale in Cybersecurity, Sapienza Università di Roma',
    online: 'Versione online',
  },
};

// ---------------------------------------------------------------------------
// ENGLISH
// ---------------------------------------------------------------------------

const EN = formatters('.', ',', 'n/a', '×');

const effectEn = { negligible: 'negligible', small: 'small', medium: 'medium', large: 'large' };

const en = {
  fmt: EN,
  effects: effectEn,
  ui: {
    index: 'Contents',
    indexTitle: 'Homework contents',
    close: 'Close',
    backToTop: 'Back to top',
    computing: 'Computing...',
    language: 'Language',
    error: (message) => `The computation failed: ${message}`,
    total: 'Total',
  },
  names: {
    variables: { protocol: 'protocol', service: 'service', flag: 'flag', class: 'class', outcome: 'outcome' },
    classes: { normal: 'normal', dos: 'DoS', probe: 'Probe', r2l: 'R2L', u2r: 'U2R' },
    outcomes: { normal: 'normal', attack: 'attack' },
    others: 'others',
    otherServices: 'other services',
    all: 'all',
    department: 'Dept.',
    allDepartments: 'All',
  },
  sections: {
    assignment: '0. The assignment',
    task: '1. TASK: the contingency table of a security dataset',
    dataset: '1.1 The dataset: 22,544 connections of NSL-KDD',
    table: '1.2 The contingency table',
    frequencies: '1.3 Marginal and conditional frequencies',
    expected: '1.4 The expected frequencies if X and F were independent',
    chi2: '1.5 The chi-square statistic and the p-value',
    tryTable: 'Try it: your own table',
    gtest: '1.6 The G test',
    small: '1.7 Small tables: the rule of 5, Fisher and Yates',
    permutation: '1.8 The permutation test',
    tryPermutation: 'Try it: shuffling F',
    checks: '1.9 Checks',
    theory: '2. Independence in probability and in statistics',
    interpretation: '3. Independent or dependent? The interpretation',
    decision: '3.1 The decision',
    residuals: '3.2 Which cells: the standardized residuals',
    strength: '3.3 How strong: Cramér’s V',
    tryDependence: 'Try it: an adjustable dependence',
    pairs: '3.4 Every pair of variables',
    causality: '4. Association is not causation',
    simpson: '4.1 Simpson’s paradox: Berkeley, 1973',
    trySimpson: 'Try it: splitting by department',
    security: '4.2 In security data',
    tests: '5. Summary of the statistical tests',
    history: '6. Historical context',
    conclusion: '7. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment asks to start from any bivariate dataset (X, F) and to build its contingency table in code, with the marginal and conditional frequencies; then to compute the expected frequencies if X and F were independent and the chi-square statistic, with its p-value (optional). Finally it asks to recall the concepts of independence in probability and in statistics, to interpret the results to tell whether the two variables are independent or dependent, and to discuss the conclusions briefly, distinguishing statistical association from causation.',
      'The page follows this order. Section 1 works on real cybersecurity data, the 22,544 network connections of the NSL-KDD test set: X and F are chosen among five variables, and the table (1.2), the marginal and conditional frequencies (1.3), the expected ones (1.4), the chi-square and the p-value (1.5) are computed again from the records. Next to them are the G test (1.6), the remedies for small tables (1.7), the permutation test, which reaches the p-value without formulas (1.8), and the checks of the computations (1.9). Section 2 recalls the theory, section 3 interprets the results, section 4 separates association from causation with a real case, the Berkeley admissions of 1973. Then come the summary of the tests, the historical context and the conclusions.',
      'Four "Try it" boxes let you get your hands on the numbers: a table to type or paste, the shuffling of F, a dependence to adjust with a slider and Simpson’s paradox split by department. Every number is computed in the browser, and the downloadable program prints the same ones.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned, in English.',
  },
  task: {
    intro: [
      'The dataset is the test set of NSL-KDD, the cleaned version of the KDD Cup 1999 data prepared by the Canadian Institute for Cybersecurity (Tavallaee and others, 2009): 22,544 TCP/IP connections observed on a simulated network, each with 41 features and a label, "normal" or the name of the attack. It is the classic dataset on which intrusion detection systems are trained and compared, and it is full of categorical variables: the case the chi-square test was born for.',
      `The page uses five of them: the protocol (TCP, UDP, ICMP), the service (the ${SERVICE_GROUPS} most frequent, the others together), the flag the connection ended with, the class (normal, DoS, Probe, R2L, U2R) and the outcome (normal or attack). The practical question is the one of whoever writes the rules of an IDS: does the protocol say anything about the kind of attack? If X and F were independent, knowing one would not help to predict the other.`,
    ],
  },
  dataset: {
    intro: `Choose the two variables: X on the rows of the table, F on the columns. As the page opens X is the protocol and F the class; every choice computes section 1 and the interpretation of section 3 again. "Merge rare levels" joins the levels of a variable with less than ${EN.pct(RARE_SHARE, 0)} of the records, when there are at least two of them: the classic remedy when some expected frequencies are too small (section 1.7).`,
    xLabel: 'X (rows)',
    fLabel: 'F (columns)',
    levelsLabel: 'Levels',
    mergeLabel: 'Merge rare levels',
    sampleTitle: 'The first eight connections of the file, with the columns the page uses',
    sampleCols: { n: '#', protocol: 'Protocol', service: 'Service', flag: 'Flag', label: 'Label', class: 'Class' },
    categoriesTitle: 'The 38 labels of the test set and their class',
    categoriesIntro: 'For the 22 attacks of the training set the class is the one of the file training_attack_types of the KDD Cup 1999; for the attacks only the test set has, it is the one of the attack database of the DARPA 1999 evaluation (MIT Lincoln Laboratory), where they come from; snmpgetattack, snmpguess, worm and sqlattack are in neither and get the class most of the literature gives them. The only contested case is httptunnel: some tables put it among the U2R attacks, the Lincoln Laboratory among the R2L ones, and the page follows the Lincoln Laboratory.',
    categoryCols: { label: 'Label', count: 'Records', category: 'Class', source: 'Source of the class' },
    sources: { data: 'data', kdd99: 'KDD Cup 1999', ll99: 'Lincoln Lab 1999', literature: 'literature' },
    flagsTitle: 'What the flags say (the connection states of Bro, where they come from)',
    flags: {
      SF: 'opened and closed normally',
      REJ: 'attempt rejected (the SYN gets a RST)',
      S0: 'attempt without reply: typical of a SYN flood or a scan',
      RSTO: 'established, then aborted with a RST by the originator',
      RSTR: 'established, then aborted with a RST by the responder',
      S3: 'established, close attempted by the responder without reply',
      SH: 'SYN then FIN without SYN-ACK: a half-open connection, from a scan',
      S1: 'established and never closed',
      S2: 'established, close attempted by the originator without reply',
      OTH: 'no SYN seen, only midstream traffic',
      RSTOS0: 'SYN followed by a RST of the originator, without SYN-ACK',
    },
    citation: `Data: ${DATA_SOURCE.dataset}, ${EN.int(DATA_SOURCE.records)} records. Licence: "You may redistribute, republish, and mirror the ISCX NSL-KDD dataset in any form. However, any use or redistribution of the data must include a citation to the NSL-KDD dataset and the paper referenced below." Paper: ${DATA_SOURCE.paper}.`,
    datasetLink: 'The page of the dataset (UNB)',
    paperLink: 'The paper (IEEE)',
  },
  table: {
    intro: 'The table is built by reading the records once: every connection adds 1 to the cell of its level of X and its level of F. The sums of the rows and of the columns, the margins, count the connections of every level; the total at the bottom right is N.',
    formulas: 'n_ij = number of records with X = x_i and F = f_j\nn_i. = Σ_j n_ij      n_.j = Σ_i n_ij      N = Σ_i Σ_j n_ij',
    title: (x, f) => `X = ${x} (rows), F = ${f} (columns): number of connections`,
    empty: (cells) => `Some cells are empty: ${cells}. That alone says something about the link between the two variables.`,
  },
  frequencies: {
    intro: 'The marginal frequencies are the margins divided by N: the distribution of X alone and that of F alone. The conditional ones divide every cell by the total of its row, giving the distribution of F within a level of X (the row profiles); or by the total of its column, the distribution of X within a level of F (the column profiles).',
    formulas: 'marginal:      f(x_i) = n_i. / N         f(f_j) = n_.j / N\nconditional:   f(f_j | x_i) = n_ij / n_i.   f(x_i | f_j) = n_ij / n_.j',
    marginalTitle: (v) => `The marginal of ${v}`,
    marginalCols: { level: 'Level', count: 'Records', share: 'Frequency' },
    profileLabel: 'Conditional',
    profiles: { rows: 'of F given X (row profiles)', cols: 'of X given F (column profiles)' },
    rowsTitle: 'The distribution of F within every level of X (row profiles), and at the bottom the marginal of F',
    colsTitle: 'The distribution of X within every level of F (column profiles), and on the right the marginal of X',
    chartTitle: 'The distribution of F within every level of X, and at the bottom that of all the connections (the marginal)',
    after: (g) => `If X and F were independent, every bar would be equal to the last one, up to the noise of the sample. Not here: among the connections with ${g.x}, those with ${g.f} are ${EN.pct(g.share)}, against ${EN.pct(g.marginal)} of all. This is the dependence, seen before any test.`,
  },
  expected: {
    intro: 'If X and F were independent, the probability of a cell would be the product of the marginals, P(X = x_i, F = f_j) = P(X = x_i) P(F = f_j). Over N records the expected cell is therefore N (n_i./N)(n_.j/N) = n_i. n_.j / N: the fraction n_.j/N of the level f_j applied to the n_i. connections of the row.',
    formulas: 'E_ij = n_i. × n_.j / N',
    tableTitle: 'The expected frequencies under independence',
    note: 'The expected frequencies have the same margins as the data: only the way the totals spread over the cells changes.',
    chooseLabel: 'Level of X to compare',
    chartTitle: (x) => `Observed and expected for X = ${x}`,
    cols: { level: 'F', observed: 'Observed', expected: 'Expected', difference: 'O - E' },
    after: (c) => `The cell farthest from independence (the one with the largest residual, section 3.2) is ${c.x} with ${c.f}: there are ${EN.int(c.o)} connections against ${EN.num(c.e, 1)} expected, ${c.o > c.e ? `${EN.num(c.o / c.e, 1)} times as many` : `${EN.pct(1 - c.o / c.e, 0)} fewer`}. The chart opens on its row.`,
  },
  chi2: {
    intro: 'Pearson’s chi-square measures how far the observed frequencies are from the expected ones, cell by cell, in units of the size of the expected ones: (O - E)² / E. Summed over the cells, it is 0 only if the table is exactly the one of independence. If X and F are independent, as N grows its law approaches that of a chi-square with (r - 1)(c - 1) degrees of freedom: that many cells are free once the margins are fixed.',
    formulas: 'χ² = Σ_i Σ_j (n_ij - E_ij)² / E_ij\ndegrees of freedom = (r - 1)(c - 1)\np-value = P(χ²(df) ≥ observed χ²)',
    contributionsTitle: 'The contribution of every cell to the chi-square',
    result: (s) => `χ² = ${EN.num(s.chi2, 3)} with ${degrees(s.df)}, p-value ≈ ${EN.p(s.p, s.log10p)}.`,
    decision: (s) =>
      s.p < SIGNIFICANCE
        ? `With α = ${EN.num(SIGNIFICANCE, 2)} the critical value is ${EN.num(s.critical, 2)}: the observed chi-square is ${EN.num(s.chi2 / s.critical, 0)} times as large, and the hypothesis of independence is rejected.`
        : `With α = ${EN.num(SIGNIFICANCE, 2)} the critical value is ${EN.num(s.critical, 2)}: the observed chi-square stays below it, and the hypothesis of independence is not rejected.`,
    after: 'A p-value this small is not a computing error: with tens of thousands of records even a modest dependence leaves a huge mark. Floating point underflows below 10^-308, and SciPy already returns 0; the page keeps the logarithm of the p-value apart (the incomplete gamma function with Lentz’s continued fraction), so the number stays readable, and the checks compare it with mpmath at 50 digits.',
    notTestable: 'One variable has a single level with records: there is nothing to compare, and the test cannot be made.',
  },
  tryTable: {
    intro: 'Type the counts in the cells, or paste two columns of data, one record per line (x,f): the table, the expected frequencies, the chi-square with its p-value, G and Cramér’s V follow every key. As it opens there is a small phishing exercise: 40 employees, those who took the training and those who did not, and those who clicked the link of the test email and those who reported it. With a 2 × 2 table Fisher’s exact test and Yates’s correction appear too (section 1.7).',
    modeLabel: 'Data',
    modes: { grid: 'Cells', pairs: 'Records (x,f)' },
    exampleNames: { x: ['trained', 'untrained'], f: ['clicked', 'reported'] },
    xName: 'Training',
    fName: 'Test email',
    examplePairs: ['night,blocked', 'night,blocked', 'night,success', 'day,success', 'day,success', 'day,success', 'day,failure', 'day,success', 'evening,failure', 'evening,success', 'evening,failure', 'day,success'].join('\n'),
    addRow: 'Add a row',
    addCol: 'Add a column',
    removeRow: 'Remove a row',
    removeCol: 'Remove a column',
    reset: 'Restore the example',
    cellLabel: (x, f) => `Count for ${x} and ${f}`,
    rowName: (i) => `row ${i + 1}`,
    colName: (j) => `column ${j + 1}`,
    pairsLabel: 'One record per line: level of X, comma, level of F',
    headerLabel: 'The first line holds the names of the columns',
    errors: {
      empty: 'There are no records.',
      tooMany: 'At most 100,000 records.',
      line: (n, text) => `Line ${n} ("${text}") does not have two values separated by a comma.`,
      levels: 'At most 12 levels per variable.',
      oneLevel: 'X and F need at least two levels each.',
      cell: 'Every cell is a whole number from 0 to 1,000,000.',
      zero: 'The table is empty.',
    },
    records: (n) => `${EN.int(n)} records read.`,
    result: (s) => `χ² = ${EN.num(s.chi2, 3)} with ${degrees(s.df)}, p ≈ ${EN.p(s.p, s.log10p)}; G = ${EN.num(s.G, 3)}, p ≈ ${EN.p(s.gP, s.gLog10p)}; Cramér’s V = ${EN.num(s.V, 3)} (${effectEn[s.effect]} association).`,
    verdict: (s) => (s.p < SIGNIFICANCE ? 'At 5% independence is rejected.' : 'At 5% independence is not rejected: the data are compatible with independence (which is not proved by this).'),
    small: (s) => `Careful: ${s.small.below5} of ${s.small.cells} cells have an expected frequency below 5${s.small.below1 ? `, ${s.small.below1} below 1` : ''}; the chi-square approximation is not reliable (Cochran’s rule).`,
    twoByTwo: (s) => `2 × 2: with Yates’s correction χ² = ${EN.num(s.yates.chi2, 3)}, p ≈ ${EN.p(s.yates.p, s.yates.log10p)}; Fisher’s exact test p = ${EN.p(s.fisher.p)}; odds ratio ${EN.num(s.fisher.oddsRatio, 3)}.`,
  },
  gtest: {
    intro: 'The G test compares the same observed and expected frequencies through the logarithm of their ratio instead of the square of their difference: it is the likelihood ratio between the model with free cells and that of independence. By Wilks’s theorem (1938), under independence it has the same asymptotic law as the chi-square, with the same degrees of freedom.',
    formulas: 'G = 2 Σ_i Σ_j n_ij ln(n_ij / E_ij)        (empty cells count 0)',
    result: (s) => `G = ${EN.num(s.G, 3)}, p ≈ ${EN.p(s.gP, s.gLog10p)}: ${s.gP < SIGNIFICANCE ? 'independence is rejected this way too' : 'this way too independence is not rejected'}.`,
    compare: (s) => `The two tests measure the same distance in two ways: here G is ${EN.num(s.G / s.chi2, 2)} times the chi-square. When the expected frequencies are large and the observed ones close, the ratio approaches 1; it moves away when there are empty cells or cells far from their expected value, which the square of the chi-square and the logarithm of G weigh differently.`,
  },
  small: {
    intro: 'The chi-square approximation holds for large expected frequencies. Cochran’s practical rule (1954): no cell with an expected frequency below 1 and at most 20% below 5. When it fails there are three remedies: merging the rare levels (the button of section 1.1), using an exact test, or letting a simulation give the p-value (section 1.8).',
    rule: (s) => `In the chosen table ${s.small.below5} of ${s.small.cells} cells have an expected frequency below 5 and ${s.small.below1} below 1 (the smallest is ${EN.num(s.small.minExpected, 2)}): the rule is ${s.small.cochran ? 'satisfied' : 'violated, and the p-value of the formula is to be taken with care'}.`,
    exactIntro: 'For a 2 × 2 table Fisher’s exact test computes the p-value without approximations: with the margins fixed, the top left cell follows a hypergeometric law, and the probabilities of the tables no more probable than the observed one are added up. Yates (1934) proposes instead to correct the chi-square by taking 1/2 off every |O - E|, because a discrete variable approximated by a continuous one tends to exaggerate. Here a sample of a few connections drawn at random from the dataset: TCP or not, normal or attack.',
    sizeLabel: 'Connections in the sample',
    newSample: 'Another sample',
    tableTitle: (n) => `${n} connections drawn at random: TCP or not, normal or attack`,
    rows: ['TCP', 'UDP or ICMP'],
    result: (s) => `Chi-square without correction ${EN.num(s.chi2, 3)}, p ≈ ${EN.p(s.p, s.log10p)}; with Yates ${EN.num(s.yates.chi2, 3)}, p ≈ ${EN.p(s.yates.p, s.yates.log10p)}; Fisher’s exact p = ${EN.p(s.fisher.p)}.`,
    cochran: (s) => (s.small.cochran ? 'Here the expected frequencies satisfy Cochran’s rule.' : `Here ${s.small.below5} of 4 cells have an expected frequency below 5: the chi-square formula is not reliable, and Fisher is the test to look at.`),
    after: 'With few records the three p-values can say different things: the chi-square without correction is the most optimistic, Yates the most cautious, Fisher is exact but, being discrete, often a little conservative. The last button changes the sample: the verdict swings, as it must with little data.',
  },
  permutation: {
    intro: [
      'The permutation test reaches the p-value without the chi-square law. If X and F are independent, shuffling the values of F at random among the records changes nothing that matters: the margins stay the same, only a possible link disappears. Shuffle many times, compute the chi-square each time, and count how often chance produces a value at least as large as the observed one: (1 + count)/(B + 1) is the p-value.',
      'On the whole dataset the observed chi-square is so large that no shuffle comes close. The box therefore works on a sample of a few connections drawn at random, with the same pair X, F of section 1.1: there the answer is not a foregone conclusion, and the distribution can be seen taking shape.',
    ],
    formulas: 'p ≈ (1 + #{shuffles with χ² ≥ observed χ²}) / (B + 1)',
  },
  tryPermutation: {
    intro: 'Choose how many connections to draw and how many times to shuffle, then press the button: the histogram of the chi-squares of the shuffles grows and settles on the density of the chi-square with the same degrees of freedom, and the dashed line marks the observed chi-square.',
    sizeLabel: 'Connections drawn',
    countLabel: 'Shuffles',
    run: 'Shuffle',
    again: 'Another sample',
    running: (done, B) => `Shuffles: ${EN.int(done)} of ${EN.int(B)}...`,
    chartTitle: (n, df) => `The chi-squares of F shuffled over ${n} connections, against the density of the chi-square with ${degrees(df)}`,
    result: (r) => `On ${EN.int(r.n)} connections the observed chi-square is ${EN.num(r.observed, 3)}: ${EN.int(r.exceed)} shuffles of ${EN.int(r.B)} reach at least that far, p ≈ ${EN.p(r.pPerm)}. The chi-square formula says p ≈ ${EN.p(r.p)}.`,
    agreement: (r) => (Math.abs(Math.log10(Math.max(r.pPerm, 1e-12)) - Math.log10(Math.max(r.p, 1e-12))) < 0.5 ? 'The two ways give nearly the same number: here the chi-square approximation works.' : 'The two ways give different numbers: with expected frequencies this small the formula is not reliable, and the shuffling is the p-value to trust.'),
    beyond: (v) => `The observed chi-square (${EN.num(v, 1)}) is off the chart, far to the right: no shuffle comes close.`,
    cochran: (s) => (s.small.cochran ? '' : `(In this sample Cochran’s rule does not hold: ${s.small.below5} of ${s.small.cells} cells have an expected frequency below 5.)`),
  },
  checks: {
    intro: 'Every number of the page is checked against an independent reference: the counts against a reading of the original file in Python, the tables and the tests against SciPy 1.17.1 and NumPy, the p-values too small for SciPy (which underflows even in logarithms) against mpmath at 50 digits, the Cochran-Mantel-Haenszel test on Berkeley against R and an exact computation with fractions, the generators against their reference C code.',
    summary: (ok, total) => `${ok} of ${total} checks passed`,
    details: (n) => `The ${n} checks, one by one`,
    cols: { check: 'Check', expected: 'Expected', actual: 'Obtained', result: 'Result' },
    groups: { data: 'The data', tables: 'Tables, statistics and residuals', tests: 'The chi-square law', small: 'Small tables', simpson: 'Berkeley', generator: 'The generator' },
    ok: 'passed',
    failed: 'failed',
  },
  theory: {
    paras: [
      'In probability two events A and B are independent if P(A ∩ B) = P(A) P(B), that is, when P(B) > 0, if P(A | B) = P(A): knowing that B happened does not change the probability of A. Two discrete variables X and F are independent if this holds for every pair of values: the joint distribution is the product of the marginals, and every distribution of F conditional on a value of X equals the marginal of F. It is the formula behind the bars all equal of section 1.3.',
    ],
    formulas: 'A, B independent:   P(A ∩ B) = P(A) P(B)   ⇔   P(A | B) = P(A)   (if P(B) > 0)\nX, F independent:   P(X = x, F = f) = P(X = x) P(F = f)   for every x, f\n                ⇔   P(F = f | X = x) = P(F = f)   for every x with P(X = x) > 0',
    after: [
      'In statistics the probabilities are unknown: they are estimated by the frequencies, and even when X and F are truly independent the observed table is never exactly the product of the margins, because of the noise of the sample alone. The question becomes a hypothesis test: H0 "X and F are independent" against H1 "they are not". The chi-square measures the distance between the observed frequencies and those H0 predicts; its law under H0, asymptotic for large N, tells how plausible such a distance is by chance.',
      'Why (r - 1)(c - 1) degrees of freedom: there are r × c cells, but the margins are fixed by the data; once the cells of the first r - 1 rows and c - 1 columns are chosen, the others are forced. In 1900 Pearson counted r c - 1 degrees; in 1922 Fisher showed that estimating the margins takes (r - 1) + (c - 1) of them away.',
      'Three things independence is not. It is not incompatibility: two incompatible events with positive probabilities are in fact dependent, because if one happens the other is excluded (a connection cannot be both DoS and normal). It is not zero correlation: for numerical variables independence implies zero covariance but not the converse, and for categorical variables a correlation is not even defined, while the chi-square catches any form of dependence. And it does not carry over from two variables to three: X and F can be independent on their own and dependent within every level of a third Z, or the opposite, as section 4 shows.',
    ],
  },
  interpretation: {
    intro: 'Section 1 computed; here we read. Three questions, in the order whoever analyses a log asks them: is there a dependence? where? how strong?',
  },
  decision: {
    paras: (s, pair) => [
      s.p < SIGNIFICANCE
        ? `For X = ${pair.x} and F = ${pair.f} the chi-square is ${EN.num(s.chi2, 2)} with ${degrees(s.df)} and the p-value is about ${EN.p(s.p, s.log10p)}: with α = ${EN.num(SIGNIFICANCE, 2)} the hypothesis of independence is rejected, and ${pair.x} and ${pair.f} are statistically dependent. The G test says the same.`
        : `For X = ${pair.x} and F = ${pair.f} the chi-square is ${EN.num(s.chi2, 2)} with ${degrees(s.df)} and the p-value is ${EN.p(s.p, s.log10p)}: with α = ${EN.num(SIGNIFICANCE, 2)} independence is not rejected. It is not a proof of independence: it only says that these data are not enough to exclude it.`,
      `"Statistically" is the word that matters. With N = ${EN.int(s.N)} the test sees even small dependences, and the p-value measures how sure we are that a dependence exists, not how large it is. For the where we need the residuals (3.2), for the how much Cramér’s V (3.3).`,
    ],
  },
  residuals: {
    intro: 'The standardized residual of a cell (adjusted, Haberman 1973) is the difference between observed and expected divided by its standard deviation under independence. If X and F are independent it behaves like a standard normal: beyond ±1.96 the cell departs from independence at 5%, beyond ±2.58 at 1%, beyond ±3.29 at 0.1%. The colour says it: red, more connections than expected; blue, fewer.',
    formulas: 'r_ij = (n_ij - E_ij) / √(E_ij (1 - n_i./N)(1 - n_.j/N))',
    title: 'The standardized residuals of every cell',
    scale: 'Colours: beyond ±1.96 (5%), ±2.58 (1%) and ±3.29 (0.1%); red above the expected value, blue below.',
    after: (c, names) => {
      const cell = (x) => `${names.x[x.i]} with ${names.f[x.j]} (${EN.num(x.z, 1)})`;
      const parts = [];
      if (c.above.length) parts.push(`The cells furthest above the expected value: ${listOf(c.above.map(cell), 'and')}.`);
      if (c.below.length) parts.push(`The furthest below: ${listOf(c.below.map(cell), 'and')}.`);
      parts.push(`${c.significant} of ${c.total} cells depart from independence at 5%.`);
      return parts.join(' ');
    },
    protocolClass: (f) =>
      `The reason lies in how the attacks work. The DoS attacks over ICMP are smurf and pod (${EN.int(f.smurf.icmp + f.pod.icmp)} connections, all ICMP); the Probes over ICMP are mostly ipsweep and saint (${EN.int(f.ipsweep.icmp + f.saint.icmp)}); the R2L attacks over UDP are SNMP requests, snmpguess and snmpgetattack (${EN.int(f.snmpguess.udp + f.snmpgetattack.udp)}); and neptune, the largest SYN flood of the dataset (${EN.int(f.neptune.tcp)} connections), is all TCP. The protocol does not decide the attack: it is the attack that, by the way it is built, picks the protocol.`,
  },
  strength: {
    intro: 'The chi-square grows with N: doubling the data with the same proportions doubles it too, and the p-value collapses. To measure how strong the dependence is, whatever N, Cramér (1946) divides the chi-square by its largest possible value, N (min(r, c) - 1): V goes from 0 (independence) to 1 (one variable determines the other). Multiplied by √(min(r, c) - 1) it becomes Cohen’s w, for which 0.1, 0.3 and 0.5 are the conventional thresholds of a small, medium and large effect.',
    formulas: 'V = √(χ² / (N (min(r, c) - 1)))          w = V √(min(r, c) - 1)',
    result: (s, pair) => `For ${pair.x} and ${pair.f}: V = ${EN.num(s.V, 3)} and w = ${EN.num(s.w, 3)}, a ${effectEn[s.effect]} association. A p-value of 10^${Math.floor(s.log10p)} and a ${effectEn[s.effect]} association do not contradict each other: the first says the dependence is certain, the second how much it weighs.`,
  },
  tryDependence: {
    intro: 'A log of logins simulated with the generator of the page: X is the time slot of the login (night, day, evening), F its outcome (success, failure, blocked). With probability θ the outcome follows the time slot (at night blocked, by day success, in the evening failure), otherwise it is drawn on its own: θ = 0 is perfect independence, θ = 1 a deterministic link. Move the sliders: with θ fixed, the chi-square grows with n and the p-value falls, while V stays about the same.',
    names: { x: ['night', 'day', 'evening'], f: ['success', 'failure', 'blocked'] },
    xName: 'Time slot',
    fName: 'Outcome',
    thetaLabel: (t) => `Dependence θ = ${EN.num(t, 2)}`,
    nLabel: (n) => `Logins n = ${EN.int(n)}`,
    result: (s, n, t) => `Over ${EN.int(n)} logins with θ = ${EN.num(t, 2)}: χ² = ${EN.num(s.chi2, 2)}, p ≈ ${EN.p(s.p, s.log10p)}, V = ${EN.num(s.V, 3)} (${effectEn[s.effect]}). ${s.p < SIGNIFICANCE ? 'At 5% independence is rejected.' : 'At 5% independence is not rejected.'}`,
    chartTitle: 'The p-value of the same dependence as n grows (scale of powers of ten), with the level 0.05 dashed',
    tableTitle: 'The same dependence at every n',
    cols: { n: 'n', chi2: 'χ²', p: 'p-value', V: 'V', verdict: 'At 5%' },
    verdicts: { reject: 'rejected', accept: 'not rejected' },
    after: `The practical message: a tiny p-value over millions of log lines does not mean the link matters; a large p-value over a few events does not mean there is no link. Significance depends on n, strength does not. The rows of the table go from ${EN.int(DEPENDENCE_SIZES[0])} to ${EN.int(DEPENDENCE_SIZES[DEPENDENCE_SIZES.length - 1])} logins, each with a new sample.`,
  },
  pairs: {
    intro: 'The five variables make ten pairs. For each of them the page builds the table and computes its chi-square, p-value and Cramér’s V, in order of strength: it is the same analysis that intrusion detection systems use to choose the features most tied to the class (chi-square feature selection).',
    cols: { pair: 'Pair', cells: 'Cells', chi2: 'χ²', df: 'df', p: 'p-value', V: 'V', effect: 'Strength', cochran: 'Cochran' },
    yes: 'yes',
    no: 'no',
    note: 'Class and outcome have V = 1 by construction: the outcome is a function of the class (normal or attack), the limiting case of dependence.',
    after: (top) => `Leaving that case aside, the most associated pair is ${top.x} and ${top.f} (V = ${EN.num(top.V, 3)}). Every pair is dependent at 5%: over 22,544 records it is no surprise, and it is why strength matters.`,
  },
  causality: {
    intro: [
      'The chi-square says whether two variables are associated, not why. An association can come from a direct cause (X produces F), from a reverse cause (F produces X), from a third variable that moves both (a confounder) or from the way the data were collected (selection). The contingency table cannot tell these cases apart: that takes an experiment, in which X is assigned at random, or explicit assumptions about how the data came to be.',
      'Bradford Hill’s criteria (1965) list the clues that make a cause plausible: strength of the association, consistency across different studies, specificity, precedence in time, a dose-response gradient, plausibility, experiment. None is enough on its own; statistical dependence is only the starting point.',
    ],
  },
  simpson: {
    intro: (f) => [
      `In the autumn of 1973 the University of California at Berkeley admitted ${EN.pct(f.menRate)} of the men and ${EN.pct(f.womenRate)} of the women who had applied to its six largest departments: a very strong dependence between gender and outcome (χ² = ${EN.num(f.chi2, 1)}, p ≈ ${EN.p(f.p, f.log10p)}). Bickel, Hammel and O’Connell (Science, 1975) looked inside the departments: in ${f.womenAhead} of 6 women were admitted more often than men.`,
      'The confounder was the department. Women had applied mostly to departments with few places and many applications, where everybody was rejected more often; men mostly to the easy ones. Adding up the departments mixes two different things, and the total tells a story that no department tells: this is Simpson’s paradox.',
      `The Cochran-Mantel-Haenszel test measures the association between gender and outcome holding the department fixed. Over the six departments it is ${EN.num(f.cmh.statistic, 4)}, p = ${EN.p(f.cmh.p)}: within the departments independence is not rejected, and the common odds ratio of men against women, ${EN.num(f.cmh.oddsRatio, 3)}, is close to 1 (if anything slightly in favour of women).`,
    ],
    chartTitle: 'Share of admitted applicants by gender in every department and in the six together',
    tableTitle: 'The applications, the admitted and the test of every department',
    cols: { department: 'Department', men: 'Men', menRate: 'admitted', women: 'Women', womenRate: 'admitted', p: 'p (Fisher)' },
    all: 'All together',
    source: `Data: Bickel, Hammel and O’Connell, "Sex Bias in Graduate Admissions: Data from Berkeley", Science 187 (1975); the dataset UCBAdmissions of R. The departments are the six largest, ${UCB.departments.join(', ')}.`,
  },
  trySimpson: {
    intro: 'Choose a department or all together: the 2 × 2 table and its test change. The same question has two answers, and the right one depends on the comparison that makes sense: it is the department that decides the admission.',
    chooseLabel: 'Table',
    all: 'All together',
    department: (d) => `Department ${d}`,
    rows: ['Men', 'Women'],
    cols: ['Admitted', 'Rejected'],
    result: (s, rates) => `Admitted: men ${EN.pct(rates[0])}, women ${EN.pct(rates[1])}. χ² = ${EN.num(s.chi2, 2)}, p ≈ ${EN.p(s.p, s.log10p)}; Fisher p = ${EN.p(s.fisher.p)}. ${s.p < SIGNIFICANCE ? 'At 5% gender and outcome turn out dependent.' : 'At 5% the independence of gender and outcome is not rejected.'}`,
  },
  security: {
    paras: [
      'In security data the same traps are an everyday matter. The protocol does not "cause" the attacks: it is the attack that picks the protocol, by the way it is built (smurf uses ICMP because it exploits the replies to pings), so the arrow, if there is one, goes from the class to the protocol. And the proportions of NSL-KDD are not those of a real network: the authors selected the records by level of difficulty, and in the test set attacks are more than half of the connections. The associations measured hold for this sample; on another network, with another base rate of attacks, they could change.',
      'A typical confounder: if the alarms of an IDS seem more frequent at night, it may be that the night is more dangerous, or that at night mostly automatic traffic runs (backups, scheduled scans) that the IDS flags at any hour. To tell the two explanations apart one must stratify by kind of traffic, as Berkeley by department; to speak of a cause, change one thing at a time, for example comparing two rules with an A/B test.',
      'Finally direction and selection. An association between "took the training" and "does not click the phishing", like the one of the example of section 1.5, does not prove that the training works, if those who took it were the most careful employees anyway. The right experiment assigns the training at random, and only then can the dependence in the table be read as an effect.',
    ],
  },
  tests: {
    intro: `The hypothesis tests of the page, at the significance level α = ${EN.num(SIGNIFICANCE, 2)}. The expected result is the one theory or the known data predict; where it depends on the sample, the column says so.`,
    cols: { subject: 'What is checked', hypothesis: 'Null hypothesis H0', statistic: 'Statistic', p: 'p-value', verdict: 'Result', expected: 'Expected' },
    rows: {
      chi2: (pair) => ({ subject: `NSL-KDD, ${pair.x} and ${pair.f} (chi-square)`, hypothesis: `${pair.x} and ${pair.f} are independent` }),
      g: (pair) => ({ subject: `NSL-KDD, ${pair.x} and ${pair.f} (G)`, hypothesis: 'The same, with the likelihood ratio' }),
      permutation: (n) => ({ subject: `Permutation over ${n} connections`, hypothesis: 'Shuffled F produces chi-squares as large as the observed one' }),
      fisher: (n) => ({ subject: `Sample of ${n} connections (Fisher)`, hypothesis: 'TCP and attack are independent' }),
      dependence: (t) => ({ subject: `Simulated logins, θ = ${EN.num(t, 2)}`, hypothesis: 'Time slot and outcome are independent' }),
      berkeley: { subject: 'Berkeley, six departments together', hypothesis: 'Gender and outcome are independent' },
      cmh: { subject: 'Berkeley, department by department (CMH)', hypothesis: 'Independence within every department' },
    },
    verdicts: { reject: 'H0 rejected', accept: 'H0 not rejected' },
    expected: { reject: 'rejected', accept: 'not rejected', depends: 'depends on the sample', theta: (t) => (t === 0 ? 'not rejected (95% of the times)' : 'rejected with n large enough') },
    statNames: { 'χ²': 'χ²', G: 'G', OR: 'odds ratio', CMH: 'CMH' },
    pending: 'Running: the permutation test of section 1.8 is still shuffling.',
  },
  history: {
    intro: 'From Pearson to intrusion detection systems, the ideas used in the homework in chronological order.',
    items: [
      { year: '1900', title: 'Pearson', text: 'Publishes the chi-square criterion in the Philosophical Magazine: the distance between observed and expected frequencies, with its asymptotic law.' },
      { year: '1900-1903', title: 'Yule', text: 'Studies the association of attributes and its coefficient Q, and notes that joining different groups can reverse an association: the paradox that will take Simpson’s name.' },
      { year: '1904', title: 'Pearson', text: 'On the Theory of Contingency: two-way tables and the contingency coefficient.' },
      { year: '1922', title: 'Fisher', text: 'Shows that an r × c table has (r - 1)(c - 1) degrees of freedom, not r c - 1 as Pearson thought: estimating the margins uses some up.' },
      { year: '1934', title: 'Yates', text: 'Proposes the continuity correction for the chi-square of 2 × 2 tables with small numbers.' },
      { year: '1935', title: 'Fisher', text: 'In The Design of Experiments the lady tasting tea: the exact test for 2 × 2 tables, found in parallel by Irwin and by Yates.' },
      { year: '1938', title: 'Wilks', text: 'The theorem on the asymptotic law of the likelihood ratio, from which the G test follows.' },
      { year: '1946', title: 'Cramér', text: 'In the Mathematical Methods of Statistics the coefficient V, the strength of the association whatever N.' },
      { year: '1951', title: 'Simpson', text: 'The Interpretation of Interaction in Contingency Tables: associations reversing when different strata are added up.' },
      { year: '1954', title: 'Cochran', text: 'Some Methods for Strengthening the Common χ² Tests: the practical rule on expected frequencies below 5 and the tests for stratified tables.' },
      { year: '1959', title: 'Mantel and Haenszel', text: 'The test for the association within strata, born for case-control studies of cancer.' },
      { year: '1965', title: 'Bradford Hill', text: 'Association or Causation?: the criteria to judge whether an association can be a cause.' },
      { year: '1973', title: 'Haberman', text: 'The adjusted residuals for contingency tables, which read as standard normals.' },
      { year: '1975', title: 'Bickel, Hammel and O’Connell', text: 'The Berkeley admissions in Science: Simpson’s paradox in a real and famous case.' },
      { year: '1999', title: 'KDD Cup', text: 'The data of the DARPA 1998 evaluation become the intrusion detection contest of the KDD Cup.' },
      { year: '2000', title: 'Pearl', text: 'Causality: a formal language (graphs, the do operator) to tell association from cause.' },
      { year: '2009', title: 'Tavallaee, Bagheri, Lu and Ghorbani', text: 'A Detailed Analysis of the KDD CUP 99 Data Set: NSL-KDD, without the repeated records and with the test set used here.' },
    ],
    after: 'The history runs on two tracks that the homework crosses: the one of the test (Pearson, Fisher, Yates, Cramér) and the one of interpretation (Yule, Simpson, Hill, Pearl). The first says whether there is a link, the second what can be concluded from it.',
  },
  conclusion: {
    where: (c, names) => {
      const cell = (x) => `${names.x[x.i]} with ${names.f[x.j]}`;
      const parts = [];
      if (c.above[0]) parts.push(`${cell(c.above[0])} far above the expected value (${EN.num(c.above[0].z, 1)})`);
      if (c.below[0]) parts.push(`${cell(c.below[0])} far below (${EN.num(c.below[0].z, 1)})`);
      return parts.length ? listOf(parts, 'and') : 'in no cell in particular';
    },
    paras: (f) => [
      `Over the ${EN.int(f.N)} connections of NSL-KDD the contingency table of ${f.pair.x} and ${f.pair.f}, built from the records, shows conditional profiles far from the marginal; the expected frequencies under independence are far enough from the data for a chi-square of ${EN.num(f.chi2, 1)} with ${degrees(f.df)}, p ≈ ${EN.p(f.p, f.log10p)}. ${f.p < SIGNIFICANCE ? 'The two variables are statistically dependent' : 'Independence is not rejected'}; the G test reaches the same verdict, and Cochran’s rule is ${f.cochran ? 'satisfied' : 'violated (better merge the rare levels)'}.`,
      `The dependence has ${effectEn[f.effect]} strength (V = ${EN.num(f.V, 3)}), and the residuals say where it lies: ${f.where}. With tens of thousands of records significance is a given; strength and residuals are what whoever writes a rule needs.`,
      `Association is not a cause. At Berkeley the dependence between gender and outcome (p ≈ ${EN.p(f.berkeley.p, f.berkeley.log10p)}) disappears within the departments (Cochran-Mantel-Haenszel, p = ${EN.p(f.cmh.p)}): the confounder was the department chosen. In security data the same cautions hold: the direction of the arrows, confounders such as the kind of traffic, and a dataset whose proportions were chosen by its authors.`,
    ],
  },
  legends: {
    observed: 'observed',
    expected: 'expected under independence',
    shuffles: 'chi-squares of the shuffles',
    density: 'chi-square density',
    observedChi2: 'observed chi-square',
    pValue: 'p-value',
    alpha: 'α = 0.05',
    men: 'men',
    women: 'women',
  },
  tips: {
    conditional: (x, f, count, share, marginal) => `${x}, ${f}: ${EN.int(count)} connections, ${EN.pct(share)} of the ${x} ones (among all: ${EN.pct(marginal)})`,
    marginal: (f, share, total) => `All the connections, ${f}: ${EN.pct(share)} (${EN.int(total)})`,
    expected: (x, f, o, e) => [`${x}, ${f}`, o !== null && `observed ${EN.int(o)}`, e !== null && `expected ${EN.num(e, 1)}`].filter(Boolean).join(': ').replace(': expected', ', expected'),
    shuffles: (from, to, count, share) => `Chi-square from ${EN.num(from, 1)} to ${EN.num(to, 1)}: ${EN.int(count)} shuffles (${EN.pct(share)})`,
    dependence: (r) => `n = ${EN.int(r.n)}: χ² ${EN.num(r.chi2, 1)}, p ≈ ${EN.p(r.p, r.log10p)}, V ${EN.num(r.V, 3)}`,
    simpson: (r, show) => {
      const name = r.key === 'all' ? 'All the departments' : `Department ${r.key}`;
      const parts = [show.men && `men ${EN.pct(r.menRate)} of ${EN.int(r.men)}`, show.women && `women ${EN.pct(r.womenRate)} of ${EN.int(r.women)}`].filter(Boolean);
      return parts.length ? `${name}: ${parts.join(', ')}` : null;
    },
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English, with the NSL-KDD data inside: after extracting the archive it opens with a double click on index.html, even offline. With node homework6.js it prints the table, the frequencies, the expected values, the tests, the residuals, the permutation test, Berkeley and the checks in the terminal; --x, --f, --merge, --seed, --sample and --perms change the parameters.',
    contents: 'Contents: index.html, style.css, homework6.js (data, computations, charts and command line), app.js (interface and texts), README.txt.',
    zip: 'Download homework6',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'Statistical independence: the contingency table, the expected frequencies and the chi-square test on real security data, and the difference between association and causation.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
  },
};

export const HW6_TEXTS = { it, en };
