// src/pages/statistics/hw2a/texts.js
// I testi dell'Homework #2 in italiano e in inglese. Li usano sia la pagina
// del sito sia il programma scaricabile, cosi' le due versioni dicono le
// stesse cose con le stesse parole. Ogni numero arriva dagli argomenti (lo
// schema calcolato, i risultati degli esperimenti) o dalle costanti della
// libreria: nessuna frase contiene un risultato scritto a mano.
import { DEFAULT_SHIFT, EXHAUSTIVE_LIMIT, EXPLORE_SEED, KEY_BITS, KEY_MAX, LENGTHS, MESSAGE_MAX_BYTES, SAMPLES, SIGNIFICANCE, SPLIT } from './homework2a.js';
import { FAST_RATE, rateAt, thresholds } from './view.js';

/**
 * Number formatting of one language: decimal and thousands separators, the
 * "not available" marker and the names of the units of time.
 */
function formatters(decimal, thousands, na, units, times) {
  const local = (s) => (decimal === '.' ? s : s.replace('.', decimal));
  const missing = (v) => v === null || v === undefined || Number.isNaN(v);
  const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const sci = (v, digits = 1) => {
    if (missing(v)) return na;
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    let m = v / 10 ** e;
    let exp = e;
    if (Number(m.toFixed(digits)) >= 10) {
      m /= 10;
      exp += 1;
    }
    return `${local(m.toFixed(digits))} ${times} 10^${exp}`;
  };
  return {
    na,
    decimal,
    int: (v) => (missing(v) ? na : `${v < 0 ? '-' : ''}${group(String(Math.round(Math.abs(Number(v)))))}`),
    big: (v) => group(String(v)),
    num: (v, digits = 3) => (missing(v) ? na : local((Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits))),
    pval: (v) => (missing(v) ? na : v === 0 ? `< ${local('1e-300')}` : v < 0.001 ? local(v.toExponential(1)) : local(v.toFixed(3))),
    pct: (v, digits = 1) => (missing(v) ? na : `${local((100 * v).toFixed(digits))}%`),
    // a probability with four decimals, or a bound when it is smaller than that
    prob: (v) => (missing(v) ? na : v < 1e-4 ? `< ${local('0.0001')}` : local(v.toFixed(4))),
    sci,
    pow2: (e, digits = 1) => (missing(e) ? na : `2^${local(e.toFixed(digits))}`),
    ms: (v) => (missing(v) ? na : v >= 1000 ? `${local((v / 1000).toFixed(2))} s` : `${Math.max(1, Math.round(v))} ms`),
    // a duration in seconds, in the largest unit that keeps it readable
    duration: (s) => {
      if (missing(s) || !Number.isFinite(s)) return na;
      const scale = [[units.years, 365.25 * 86400], [units.days, 86400], [units.hours, 3600], [units.minutes, 60], [units.seconds, 1]];
      for (const [name, size] of scale) {
        if (s >= size) {
          const v = s / size;
          return v >= 1e6 ? `${sci(v)} ${name}` : `${local(v.toFixed(1))} ${name}`;
        }
      }
      return `${Math.max(1, Math.round(s * 1000))} ms`;
    },
  };
}

/**
 * The assignment as the professor wrote it, block by block. The only
 * change is the long dash after the title, written "-" as everywhere on
 * this site.
 */
export const originalAssignment = () => [
  { type: 'title', text: 'Homework 2' },
  {
    type: 'p',
    text: 'Using the toy cryptographic scheme based on the secp256k1 elliptic curve developed in Part 1 of the previous homework, encrypt and decrypt a simple message. Describe the main steps of the algorithm and the role of the keys.',
  },
  { type: 'p', text: 'The Caesar Cipher: Implement the Caesar cipher to encrypt and decrypt the same message.' },
  { type: 'p', text: 'Discuss the similarities and differences between the two schemes, focusing on their encryption and decryption procedures, key spaces, and statistical properties.' },
  {
    type: 'p',
    text: 'Statistical Cryptanalysis of the Caesar Cipher: Given a sufficiently large corpus of text in a known language, design and implement a simple algorithm to recover the key of the Caesar cipher by exploiting the statistical distribution of letters.',
  },
  { type: 'p', text: 'Test the algorithm on ciphertexts of different lengths and discuss its effectiveness and limitations.' },
  { type: 'p', text: 'Optional: Compare alternative approaches, such as exhaustive key search, letter-frequency analysis, and n-gram scoring.' },
  {
    type: 'p',
    text: 'The toy scheme developed in Part 1 uses the secp256k1 elliptic curve but restricts the private key to a small range to make experiments computationally feasible. Design and implement a simple attack to recover the private key, or otherwise decrypt the message, exploiting this restricted key space. Discuss the differences between this attack and the statistical attack against the Caesar cipher. Explain why the same approach would not necessarily be feasible against a properly configured ECC scheme using a sufficiently large private-key space. Optional: Discuss alternative attacks and explain which weaknesses arise from the restricted key space and which, if any, could arise from the design of the toy scheme itself.',
  },
];

const chapterRange = (list) => `${list[0]}-${list[list.length - 1]}`;

// ---------------------------------------------------------------------------
// ITALIANO
// ---------------------------------------------------------------------------

const IT = formatters(',', '.', 'n/d', { years: 'anni', days: 'giorni', hours: 'ore', minutes: 'minuti', seconds: 'secondi' }, '×');

/** The line of numbers under a hypothesis test, whatever its kind. */
function testLineIt(t) {
  const F = IT;
  switch (t.kind) {
    case 'chi2':
      return t.classes === undefined
        ? `Σz² = ${F.num(t.chi2, 1)}, χ² con ${t.df} gradi di libertà, p = ${F.pval(t.pValue)}`
        : `χ² = ${F.num(t.chi2, 1)} su ${t.classes} classi (${t.df} gradi di libertà), p = ${F.pval(t.pValue)}`;
    case 'binomial':
      return `${F.int(t.successes)} su ${F.int(t.trials)} = ${F.pct(t.rate, 2)} (atteso ${F.pct(t.expectedRate, 2)}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'independence':
      return `χ² = ${F.num(t.chi2, 1)} su una tabella ${t.rows} × ${t.cols} (${t.df} gradi di libertà, attesa minima ${F.num(t.minExpected, 1)}), V di Cramér = ${F.num(t.cramerV, 3)}, p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

const methodNamesIt = {
  top: 'Lettera più frequente',
  chi2: 'χ² di Pearson',
  unigram: 'Massima verosimiglianza',
  bigram: 'Bigrammi',
  quadgram: 'Quadrigrammi',
  dictionary: 'Ricerca esaustiva con dizionario',
};

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
    scheme: '1. TASK: lo schema giocattolo su secp256k1, cifrare e decifrare',
    input: '1.1 Chiave privata, messaggio e nonce',
    keys: '1.2 Generazione delle chiavi',
    encrypt: '1.3 Cifratura',
    decrypt: '1.4 Decifratura',
    roles: '1.5 Il ruolo delle chiavi',
    verify: '1.6 Verifiche',
    caesar: '2. Il cifrario di Cesare e il confronto fra i due schemi',
    caesarCipher: '2.1 Cifrare e decifrare lo stesso messaggio',
    compare: '2.2 Procedure e spazi delle chiavi',
    properties: '2.3 Le proprietà statistiche dei due cifrati',
    cryptanalysis: '3. Crittanalisi statistica del cifrario di Cesare',
    corpus: '3.1 Il corpus e i modelli della lingua',
    algorithm: '3.2 L’algoritmo: massima verosimiglianza',
    lengths: '3.3 Testi cifrati di lunghezza diversa',
    methods: '3.4 Ricerca esaustiva, frequenze e n-grammi a confronto',
    limits: '3.5 Efficacia e limiti',
    attack: '4. L’attacco allo schema giocattolo',
    exhaustive: '4.1 La ricerca esaustiva',
    bsgs: '4.2 Baby-step giant-step',
    kangaroo: '4.3 Il metodo del canguro di Pollard',
    scaling: '4.4 Il costo al crescere della chiave',
    differences: '4.5 Due attacchi a confronto',
    real: '4.6 Perché non funziona contro ECC ben configurato',
    weaknesses: '4.7 Altri attacchi: spazio delle chiavi o progetto?',
    tests: '5. Riepilogo dei test statistici',
    history: '6. Contesto storico',
    conclusion: '7. Conclusioni',
  },
  assignment: {
    intro: [
      'La consegna ha tre parti. La prima chiede di cifrare e decifrare un messaggio con lo schema giocattolo basato su secp256k1 dell’homework precedente, descrivendo i passaggi dell’algoritmo e il ruolo delle chiavi; poi di cifrare lo stesso messaggio con il cifrario di Cesare e di confrontare i due schemi: procedure di cifratura e decifratura, spazi delle chiavi, proprietà statistiche. La seconda chiede di rompere il cifrario di Cesare con la statistica: dato un corpus abbastanza grande in una lingua nota, un algoritmo che ritrovi la chiave dalla distribuzione delle lettere, provato su testi di lunghezza diversa e, facoltativamente, confrontato con la ricerca esaustiva, l’analisi delle frequenze e i punteggi a n-grammi. La terza chiede di rompere lo schema giocattolo sfruttando lo spazio ridotto delle chiavi private, di confrontare questo attacco con quello statistico, di spiegare perché non funzionerebbe contro una crittografia su curva ellittica ben configurata e, facoltativamente, di distinguere le debolezze dovute allo spazio ridotto da quelle del progetto dello schema.',
      `Lo schema "della parte 1" va precisato. L’esercizio 1 dell’Homework #1 calcolava K = kG su curve giocattolo (y² = x³ + 7 su F_17, come chiedevano i parametri della consegna, e su campi primi un po’ più grandi); l’esercizio 2 usava secp256k1 con chiavi di 256 bit, senza cifrare nulla. Lo schema che questa consegna presuppone sta in mezzo: la curva vera, secp256k1, con la chiave privata ristretta a un intervallo piccolo, qui gli interi da 1 a 2^${KEY_BITS} - 1; e per cifrare il metodo standard per una coppia di chiavi K = kG, ElGamal su curva ellittica. La sezione 1 lo definisce e lo usa.`,
      'La pagina segue l’ordine della consegna: la sezione 1 cifra e decifra con lo schema giocattolo, la 2 con il cifrario di Cesare e confronta i due cifrati, la 3 rompe il cifrario di Cesare con la statistica di un corpus inglese, la 4 rompe lo schema giocattolo con tre algoritmi per il logaritmo discreto e discute perché lo stesso attacco non basta contro una chiave vera. La 5 riassume i test statistici, la 6 colloca le idee nel tempo e la 7 trae le conclusioni. Tutti i numeri sono calcolati nel browser, e il programma scaricabile stampa gli stessi.',
    ],
    originalTitle: 'Il testo originale della consegna',
    originalNote: 'Com’è stato assegnato, in inglese.',
  },
  scheme: {
    intro: [
      'Lo schema è ElGamal su curva ellittica, proposto da Koblitz nel 1987 a partire dallo schema di ElGamal del 1985, sulla curva secp256k1 di Bitcoin ed Ethereum. Il ricevente sceglie una chiave privata k e pubblica K = kG. Per cifrare, il mittente trasforma ogni byte del messaggio in un punto M = bG, estrae un numero casuale r (il nonce) e invia la coppia C1 = rG, C2 = M + rK. Il ricevente calcola kC1 = k·rG = r·kG = rK, lo sottrae da C2 e ritrova M, e da M il byte. Chi non conosce né r né k vede due punti che, per quanto se ne sa, sono indistinguibili da punti casuali.',
      `Rispetto a uno schema reale ci sono due semplificazioni, entrambe volute. La chiave privata ha al più ${KEY_BITS} bit invece di 256: è la restrizione della consegna, che la sezione 4 sfrutta. E ogni byte è cifrato da solo, con un nonce suo: costa 66 byte di cifrato per ogni byte di messaggio, ma rende diretto il confronto con il cifrario di Cesare, che lavora una lettera alla volta.`,
    ],
    formulasTitle: 'Lo schema in tre passi',
    formulas: [
      `Generazione delle chiavi   k scelto a caso in [1, 2^${KEY_BITS} - 1]; K = kG`,
      'Cifratura del byte b       M = bG; r nuovo in [1, n - 1];',
      '                           C1 = rG, S = rK, C2 = M + S',
      'Decifratura                S = kC1 (= rK); M = C2 - S; b tale che bG = M',
    ].join('\n'),
    stale: 'Valori dell’ultimo input valido: i campi in 1.1 contengono un errore.',
  },
  input: {
    intro: 'La chiave privata iniziale è stata estratta una volta per tutte con un generatore crittografico; il messaggio è la frase con cui Svetonio descrive il cifrario di Cesare (Vita di Cesare, 56, nella traduzione inglese di J. C. Rolfe del 1914). Chiunque apra la pagina vede gli stessi valori, e node homework2a.js stampa gli stessi numeri. Chiave e messaggio si possono cambiare, e tutte le sezioni seguono, attacchi compresi.',
    keyLabel: `Chiave privata k (da 1 a ${IT.big(KEY_MAX)})`,
    keyHint: `Un intero di al più ${KEY_BITS} bit, in cifre decimali. Con una chiave piccola, per esempio 1000, anche la ricerca esaustiva della sezione 4.1 la trova.`,
    randomKey: 'Chiave casuale',
    keyError: {
      empty: 'Scrivi una chiave.',
      notInteger: (t) => `"${t}" non è un intero scritto in cifre decimali.`,
      range: `La chiave va da 1 a ${IT.big(KEY_MAX)} = 2^${KEY_BITS} - 1.`,
    },
    messageLabel: `Messaggio (al più ${MESSAGE_MAX_BYTES} byte in UTF-8)`,
    messageHint: (bytes) => `${bytes} byte su ${MESSAGE_MAX_BYTES}: ogni byte diventa un blocco del cifrato. Le lettere accentate occupano due byte.`,
    messageError: {
      empty: 'Scrivi un messaggio.',
      tooLong: (bytes) => `Il messaggio occupa ${bytes} byte in UTF-8: al più ${MESSAGE_MAX_BYTES}.`,
    },
    noncesLabel: 'Nonce',
    nonces: { seeded: 'Riproducibili', random: 'Casuali' },
    reroll: 'Nuovi nonce casuali',
    noncesHint: 'I nonce riproducibili vengono da SHA-256 di un seme fisso, così la pagina e il terminale mostrano lo stesso cifrato; per lo stesso motivo chiunque può ricalcolarli, ed è una delle debolezze della sezione 4.7. I nonce casuali vengono dal generatore crittografico del browser: il cifrato cambia a ogni estrazione, il messaggio decifrato no.',
    defaultBadge: (pk) => `Valori iniziali: la chiave estratta per questo homework, la frase di Svetonio e i nonce riproducibili. Chiave pubblica attesa, ricalcolata anche con la libreria ethers 6.13.5: ${pk}.`,
    customBadge: 'Valori diversi da quelli iniziali.',
    restore: 'Ripristina i valori iniziali',
    stale: 'Finché un campo contiene un errore, le sezioni che ne dipendono restano all’ultimo valore valido.',
  },
  keys: {
    intro: [
      'La chiave privata k è un intero; la chiave pubblica è il punto K = kG, calcolato con la moltiplicazione scalare dell’esercizio 1 dell’Homework #1, qui sui numeri di 256 bit di secp256k1. Calcolare K da k costa al più 64 somme di punti con una tabella precalcolata dei multipli di G; tornare da K a k è il problema del logaritmo discreto.',
      `Su secp256k1, con k scelto fra 1 e n - 1, il miglior attacco noto richiede circa 2^128 operazioni. Con k di ${KEY_BITS} bit, come qui, ne bastano circa 2^17 (sezione 4): la curva è la stessa, cambia solo l’insieme in cui cercare k.`,
    ],
    kLabel: 'Chiave privata k (decimale)',
    hexLabel: 'k in esadecimale',
    binaryLabel: (bits) => `k in binario: ${bits} bit significativi su ${KEY_BITS}`,
    xLabel: 'Ascissa x di K',
    yLabel: 'Ordinata y di K',
    compressedLabel: (even) => `K in forma compressa (SEC 1): ${even ? '02, y pari' : '03, y dispari'}, poi x`,
    onCurve: (ok) => (ok ? 'K soddisfa y² = x³ + 7 (mod p): è un punto della curva. ✓' : 'K non è un punto della curva. ✗'),
    reference: (ok) => (ok ? 'Coincide con la chiave pubblica ricalcolata con ethers 6.13.5. ✓' : 'Non coincide con la chiave pubblica ricalcolata con ethers 6.13.5. ✗'),
    after: [
      `La chiave pubblica non tradisce la sua origine: x e y di K sembrano numeri casuali di 256 bit anche quando k ne ha solo ${KEY_BITS}, e il test della sezione 2.3 non distingue le chiavi pubbliche di chiavi private piccole da quelle di chiavi private di 256 bit. Il difetto dello schema giocattolo non è statistico ma algebrico: K = kG con k piccolo.`,
    ],
  },
  encrypt: {
    intro: [
      'Il messaggio diventa una sequenza di byte (UTF-8), e ogni byte b diventa il punto M = bG: il byte 0 è il punto all’infinito, il byte 255 è 255G. Per ogni byte si estrae un nonce r, intero fra 1 e n - 1, e si calcolano C1 = rG e il punto condiviso S = rK; il cifrato del byte è la coppia (C1, C2 = M + S), 66 byte in forma compressa.',
      'Il nonce si usa una volta e si dimentica: chi lo conoscesse calcolerebbe S = rK da K, che è pubblica, e decifrerebbe il blocco. C1 = rG lo trasmette senza rivelarlo, perché ricavare r da C1 è di nuovo un logaritmo discreto, e con r di 256 bit uno difficile.',
    ],
    tableTitle: 'I blocchi del cifrato',
    cols: { position: '#', byte: 'Byte', r: 'Nonce r', C1: 'C1 = rG', C2: 'C2 = bG + rK' },
    size: ({ bytes, total }) => `${IT.int(bytes)} byte di messaggio, ${IT.int(bytes)} blocchi, ${IT.int(total)} byte di cifrato.`,
    after: [
      'Lo stesso byte cifrato due volte dà due blocchi diversi, perché il nonce cambia: tutte le "e" del messaggio hanno un cifrato diverso. È la cifratura probabilistica (Goldwasser e Micali, 1984), la proprietà che manca al cifrario di Cesare e che la sezione 2.3 misura.',
    ],
  },
  decrypt: {
    intro: [
      'Il ricevente conosce k e nient’altro. Per ogni blocco calcola S = kC1, che coincide con rK perché kC1 = k(rG) = r(kG) = rK; sottrae S da C2 e ottiene M = bG. Resta da trovare b, ancora un logaritmo discreto, ma facile: b ha solo 256 valori, e una tabella dei punti 0G, ..., 255G, costruita una volta, lo dà con una ricerca.',
      `Con k di ${KEY_BITS} bit, kC1 costa una trentina di raddoppi e una quindicina di somme: la chiave piccola rende veloce anche la decifratura. È l’unico vantaggio, e lo paga la sicurezza.`,
    ],
    firstTitle: 'Il primo blocco, passo per passo',
    labels: {
      C1: 'C1, ricevuto',
      C2: 'C2, ricevuto',
      S: 'S = kC1',
      M: 'M = C2 - S',
    },
    decoded: (b, c) => (b < 0 ? 'M non è bG per nessun byte: il blocco non si decifra. ✗' : `M = ${b}G: il byte ${b}, "${c}". ✓`),
    sameS: (ok) => (ok ? 'kC1 coincide con il punto rK calcolato dal mittente. ✓' : 'kC1 non coincide con rK. ✗'),
    resultLabel: 'Il messaggio decifrato',
    check: (ok) => (ok ? 'Il messaggio decifrato coincide con l’originale. ✓' : 'Il messaggio decifrato non coincide con l’originale. ✗'),
  },
  roles: {
    intro: 'Ogni valore dello schema ha un proprietario e uno scopo, e ognuno, se trapela, fa un danno diverso.',
    cols: { value: 'Valore', who: 'Chi lo conosce', purpose: 'A cosa serve', leak: 'Se trapela' },
    rows: [
      {
        value: 'k, chiave privata',
        who: 'Solo il ricevente.',
        purpose: 'Decifrare: S = kC1.',
        leak: 'Chiunque decifra tutti i messaggi, passati e futuri, cifrati con K.',
      },
      {
        value: 'K = kG, chiave pubblica',
        who: 'Tutti.',
        purpose: 'Cifrare: S = rK. Chiunque può scrivere al ricevente.',
        leak: 'È pubblica per costruzione: protegge k finché il logaritmo discreto è difficile, e con k piccolo non lo è.',
      },
      {
        value: 'r, nonce',
        who: 'Solo il mittente, per il tempo di un blocco.',
        purpose: 'Rendere la cifratura probabilistica; C1 = rG lo trasmette senza rivelarlo.',
        leak: 'Chi conosce r calcola S = rK e decifra quel blocco. Un nonce riusato o prevedibile rompe lo schema anche con k sicuro (sezione 4.7).',
      },
      {
        value: 'S = rK = kC1, segreto condiviso',
        who: 'Mittente e ricevente.',
        purpose: 'La maschera che nasconde M: C2 = M + S. È uno scambio di Diffie-Hellman su curva.',
        leak: 'Decifra quel blocco, e solo quello.',
      },
      {
        value: 'M = bG, codifica',
        who: 'Non è un segreto.',
        purpose: 'Portare il byte nel gruppo dei punti, dove si può sommare S.',
        leak: 'Nulla: la tabella dei 256 punti è pubblica.',
      },
      {
        value: 'p, n, G, parametri della curva',
        who: 'Tutti.',
        purpose: 'Fissare il gruppo in cui si calcola.',
        leak: 'Nulla: sono pubblici per costruzione.',
      },
    ],
    after: 'La differenza con il cifrario di Cesare è già qui. Cesare ha una sola chiave, che cifra e decifra e deve restare segreta per entrambe le cose; lo schema su curva ne ha due, e quella che cifra può essere pubblicata. Il prezzo dell’asimmetria è un problema difficile che la sostenga: il logaritmo discreto, che la restrizione a 32 bit rende facile.',
  },
  verify: {
    intro: 'Tutto è scritto da zero, senza librerie. Prima di fidarsi dei numeri, la pagina li confronta con valori noti: i vettori di test di SHA-256 (FIPS 180-4), alcuni multipli di G ricalcolati con ethers 6.13.5 (calcolati sia con la tabella precalcolata sia con raddoppi e somme), nG = O, che dice che G ha ordine n, e il viaggio di andata e ritorno dei due cifrari sul messaggio iniziale.',
    summary: (ok, n) => `${ok} verifiche superate su ${n}.`,
    details: (n) => `Le ${n} verifiche`,
    groups: { sha256: 'SHA-256 (FIPS 180-4)', curve: 'secp256k1', scheme: 'Schema giocattolo', caesar: 'Cifrario di Cesare' },
    cols: { check: 'Verifica', expected: 'Valore atteso', result: 'Esito' },
    ok: 'superata',
    failed: 'fallita',
  },
  caesar: {
    intro: [
      'La seconda parte della consegna: lo stesso messaggio con il cifrario di Cesare, e il confronto fra i due schemi.',
    ],
  },
  caesarCipher: {
    intro: [
      `Il cifrario di Cesare sposta ogni lettera di s posti in avanti nell’alfabeto, ricominciando da A dopo Z: con s = ${DEFAULT_SHIFT}, lo spostamento che Svetonio attribuisce a Cesare, A diventa D, B diventa E, ..., Z diventa C. Decifrare vuol dire spostare indietro degli stessi s posti. In formule, con le lettere numerate da 0 (A) a 25 (Z): c = (p + s) mod 26 e p = (c - s) mod 26.`,
      'Qui maiuscole e minuscole restano tali, e tutto ciò che non è una lettera dalla A alla Z (spazi, punteggiatura, cifre, lettere accentate) resta com’è, come nella maggior parte delle implementazioni didattiche.',
    ],
    shiftLabel: 'Spostamento s (da 0 a 25)',
    shiftHint: 'Con s = 0 il testo resta in chiaro; s e 26 - s si annullano a vicenda.',
    shiftError: {
      empty: 'Scrivi uno spostamento.',
      notInteger: (t) => `"${t}" non è un intero scritto in cifre.`,
      range: 'Lo spostamento va da 0 a 25.',
    },
    tableTitle: 'La tabella di sostituzione',
    plainRow: 'Chiaro',
    cipherRow: 'Cifrato',
    cipherLabel: 'Il messaggio cifrato',
    decryptedLabel: 'Il messaggio decifrato',
    check: (ok) => (ok ? 'Il messaggio decifrato coincide con l’originale. ✓' : 'Il messaggio decifrato non coincide con l’originale. ✗'),
    top: (f) =>
      f.top
        ? `Il cifrato ha la stessa lunghezza, gli stessi spazi e la stessa punteggiatura del messaggio, e ogni lettera è sostituita sempre dalla stessa: la "${f.top.letter}", la lettera più frequente del messaggio (${f.top.count} volte su ${f.letters}), diventa sempre "${f.top.image}".`
        : 'Il messaggio non contiene lettere dalla A alla Z: il cifrario di Cesare lo lascia com’è.',
    stale: 'Valori dell’ultimo spostamento valido: il campo contiene un errore.',
  },
  compare: {
    intro: 'La tabella mette a confronto i due schemi e, per riferimento, ciò che si usa davvero per cifrare con una chiave su curva ellittica.',
    cols: ['', 'Cifrario di Cesare', 'Schema giocattolo (EC-ElGamal, k di 32 bit)', 'ECC ben configurato (ECIES)'],
    rows: (size) => [
      ['Tipo', 'Simmetrico: la stessa chiave cifra e decifra.', 'Asimmetrico: K cifra, k decifra.', 'Asimmetrico per la chiave, simmetrico per il messaggio (cifratura ibrida).'],
      ['Gruppo', 'Gli interi modulo 26, con la somma.', 'I punti di secp256k1, con la somma di punti; ordine n ≈ 2^256.', 'Lo stesso.'],
      ['Cifratura', 'c = p + s (mod 26), lettera per lettera, deterministica.', 'C1 = rG, C2 = bG + rK, byte per byte, con un nonce nuovo per ogni byte.', 'Un punto effimero rG, il segreto rK passato per una funzione di derivazione, e un cifrario autenticato (AES-GCM, ChaCha20-Poly1305) sull’intero messaggio.'],
      ['Decifratura', 'p = c - s (mod 26).', 'S = kC1, M = C2 - S, poi la tabella dei 256 punti.', 'S = k·rG, la stessa derivazione, e la verifica del tag prima di decifrare.'],
      ['Spazio delle chiavi', '26 spostamenti, uno dei quali (0) non cifra: log2 26 ≈ 4,7 bit.', `2^${KEY_BITS} - 1 chiavi private: ${KEY_BITS} bit, ma circa 16 di sicurezza contro baby-step giant-step e canguro.`, 'n - 1 ≈ 2^256 chiavi: circa 128 bit di sicurezza.'],
      ['Lunghezza del cifrato', 'Uguale al messaggio.', `66 byte per byte di messaggio: qui ${IT.int(size.bytes)} byte diventano ${IT.int(size.total)}.`, 'Il messaggio più 33 byte (il punto effimero) e 16 di tag.'],
      ['La stessa lettera due volte', 'Dà sempre la stessa lettera.', 'Dà due blocchi diversi.', 'Dà cifrati diversi.'],
      ['Che cosa trapela', 'Frequenze delle lettere, lunghezza delle parole, spazi, punteggiatura, lettere ripetute.', 'La lunghezza esatta in byte.', 'La lunghezza del messaggio.'],
      ['Integrità', 'Nessuna.', 'Nessuna: il cifrato è malleabile (sezione 4.7).', 'Il tag rifiuta ogni cifrato modificato.'],
      ['Miglior attacco', 'Statistico, dal solo cifrato: bastano poche lettere (sezione 3).', 'Algebrico, dalla sola chiave pubblica: circa 2^17 operazioni (sezione 4).', 'Algebrico: circa 2^128 operazioni, fuori portata.'],
    ],
    after: [
      'Le somiglianze sono strutturali. Entrambi cifrano sommando al chiaro un elemento di un gruppo e decifrano sottraendolo: Cesare somma s nel gruppo degli interi modulo 26, lo schema su curva somma S = rK nel gruppo dei punti. Entrambi lavorano un simbolo alla volta, e in entrambi la chiave sta in un insieme che si può elencare: 26 elementi in un caso, circa 4,3 miliardi nell’altro. In entrambi, decifrare con la chiave sbagliata dà un risultato senza senso, e chi attacca ha bisogno di un modo per riconoscere quella giusta.',
      'Le differenze stanno in tre punti. La chiave: Cesare ne ha una sola, segreta, che cifra e decifra; lo schema su curva separa chi può cifrare (chiunque, con K) da chi può decifrare (solo chi ha k), ed è questa asimmetria a richiedere un problema difficile come il logaritmo discreto. La traslazione: Cesare usa sempre la stessa, s, mentre lo schema su curva ne usa una nuova per ogni byte, S = rK con r casuale; è la differenza fra un cifrario a sostituzione e un one-time pad nel gruppo dei punti, e la sezione 4.7 mostra che basta riusare r per tornare a un cifrario di Cesare sui byte. E lo spazio delle chiavi: 26 contro 2^32, e soprattutto contro 2^256 in uno schema reale.',
    ],
  },
  properties: {
    intro: [
      'La consegna chiede di confrontare anche le proprietà statistiche. Il cifrario di Cesare è una permutazione fissa dell’alfabeto: le frequenze delle lettere del cifrato sono quelle del chiaro, ruotate di s posti. Lo schema su curva è probabilistico: il cifrato di ogni byte è una coppia di punti che, statisticamente, non dipende dal byte.',
    ],
    lettersChart: 'Le lettere del messaggio: conteggi (barre) e attese secondo le frequenze del corpus della sezione 3 (tratteggio)',
    cipherChart: (shift) => `Le lettere del cifrato di Cesare (barre), con le stesse attese (tratteggio): lo stesso profilo, spostato di ${shift} ${shift === 1 ? 'posto' : 'posti'}`,
    sampleIntro: (s) => `Un messaggio breve è poco per dei test. Per questi si usano i primi ${IT.int(s.ciphers.bytes)} byte dei capitoli di test del corpus (sezione 3.1), ${IT.int(s.ciphers.plain.letters)} lettere, cifrati con entrambi gli schemi: con Cesare (s = ${s.ciphers.shift}) e con lo schema giocattolo, con la chiave iniziale e nonce riproducibili da un seme diverso da quello della sezione 1.`,
    bytesChart: (s) => `I byte delle ascisse x(C1) e x(C2) del cifrato su curva: ${IT.int(s.ciphers.ec.counts.reduce((a, b) => a + b, 0))} byte, conteggi (barre) e attesa uniforme (tratteggio)`,
    tableTitle: 'Entropia e indice di coincidenza',
    cols: { text: 'Testo', symbols: 'Simboli', entropy: 'Entropia (bit per simbolo)', ic: 'Indice di coincidenza' },
    rowNames: { plain: 'Chiaro (lettere)', caesar: 'Cifrato di Cesare (lettere)', ec: 'Cifrato su curva (byte di x(C1) e x(C2))' },
    entropyCell: (v, max) => `${IT.num(v, 3)} su ${IT.num(max, 3)}`,
    icCell: (v, uniform) => `${IT.num(v, 5)} (uniforme: ${IT.num(uniform, 5)})`,
    repeated: (s) => {
      const r = s.ciphers.repeated;
      const letter = 'abcdefghijklmnopqrstuvwxyz'[r.letter];
      return `La lettera "${letter}" compare ${r.occurrences} volte nel testo: il cifrario di Cesare la trasforma ${r.occurrences} volte nella stessa lettera (${r.caesarDistinct} ${r.caesarDistinct === 1 ? 'cifrato diverso' : 'cifrati diversi'}), lo schema su curva in ${r.ecDistinct} blocchi tutti diversi.`;
    },
    explain: (s) => [
      `Le entropie e gli indici di coincidenza del chiaro e del cifrato di Cesare sono identici, non circa uguali: una permutazione dei simboli non cambia la distribuzione, ne rinomina i valori. Per questo l’indice di coincidenza (Friedman, 1922) dice che un testo è cifrato con un’unica sostituzione, ma non dice quale: la chiave si trova confrontando le frequenze con quelle della lingua (sezione 3). I test lo confermano: le lettere del cifrato sono tutt’altro che uniformi, e la lettera del cifrato dipende completamente da quella del chiaro (V di Cramér = ${IT.num(s.ciphers.caesar.dependence.cramerV, 3)}).`,
      `Il cifrato su curva ha un’entropia di ${IT.num(s.ciphers.ec.entropy, 4)} bit per byte su 8 e un indice di coincidenza di ${IT.num(s.ciphers.ec.ic, 5)}, contro 1/256 ≈ ${IT.num(1 / 256, 5)} per byte uniformi: le frequenze del chiaro sono sparite, e i test non trovano né uno scarto dall’uniforme né una dipendenza dal byte cifrato. Non è un caso fortunato: sotto l’ipotesi decisionale di Diffie-Hellman (DDH) su secp256k1, (rG, M + rK) è indistinguibile da una coppia di punti casuali qualunque sia M (Tsiounis e Yung, 1998). I test non possono dimostrarlo; possono solo non smentirlo.`,
      'Due avvertenze. Il cifrato su curva non è uniforme in ogni suo byte: il primo byte di un punto compresso è 02 o 03, la parità di y, e per questo i test usano le ascisse e verificano la parità a parte. E l’indistinguibilità vale contro chi non conosce k: con k di 32 bit, chiunque lo calcoli (sezione 4) rende il cifrato trasparente. Le statistiche del cifrato sono perfette e la sicurezza è nulla: la sicurezza di uno schema a chiave pubblica non si vede nei suoi cifrati.',
    ],
  },
  cryptanalysis: {
    intro: [
      'La seconda parte: ritrovare la chiave del cifrario di Cesare dal solo cifrato, con la statistica di un corpus in una lingua nota.',
    ],
  },
  corpus: {
    intro: [
      'Il corpus è Alice’s Adventures in Wonderland di Lewis Carroll (1865), di pubblico dominio, nella trascrizione di Project Gutenberg (eBook #11): 12 capitoli in inglese. Per misurare l’attacco su testo che non ha mai visto, i capitoli hanno tre ruoli, come in un esperimento di apprendimento statistico: i capitoli I-VII stimano i modelli, VIII-IX scelgono il grado di smoothing (validazione), e l’attacco si misura su X-XII (test), mai usati prima. I modelli finali usano tutti i capitoli I-IX.',
    ],
    chaptersTitle: 'I capitoli e il loro ruolo',
    cols: { number: 'Cap.', title: 'Titolo', letters: 'Lettere', role: 'Ruolo' },
    roles: { fit: 'stima', validation: 'validazione', test: 'test' },
    chart: (s) => `Frequenza delle lettere: capitoli di addestramento (${chapterRange(SPLIT.training)}, ${IT.int(s.corpus.training.letters)} lettere, barre) e di test (${chapterRange(SPLIT.test)}, ${IT.int(s.corpus.test.letters)} lettere, tratteggio)`,
    facts: (s) => [
      `Nei capitoli di addestramento la lettera più frequente è la "${'abcdefghijklmnopqrstuvwxyz'[s.models.top]}" (${IT.pct(s.models.q[s.models.top])}), l’entropia delle lettere è ${IT.num(s.corpus.training.entropy, 3)} bit su un massimo di log2 26 ≈ ${IT.num(Math.log2(26), 3)}, e l’indice di coincidenza è ${IT.num(s.corpus.training.ic, 4)}, contro 1/26 ≈ ${IT.num(1 / 26, 4)} per lettere uniformi: la distanza fra le due è la ridondanza che l’attacco sfrutta.`,
      `Il test del χ² rifiuta l’omogeneità fra addestramento e test: i capitoli ${chapterRange(SPLIT.test)}, con più dialoghi e personaggi nuovi (il Re, la Regina, il processo), hanno frequenze significativamente diverse (p = ${IT.pval(s.corpus.homogeneity.pValue)}). Ma la differenza è piccola: la distanza di variazione totale fra le due distribuzioni è ${IT.pct(s.corpus.tvd)}, e la V di Cramér ${IT.num(s.corpus.homogeneity.cramerV, 3)}. Con centomila lettere anche una differenza minima diventa significativa: significatività statistica e rilevanza pratica sono due cose diverse, e per l’attacco conta la seconda. Un corpus non è la lingua, è un campione con il suo stile; che i modelli reggano su capitoli diversi da quelli su cui sono stati stimati è proprio ciò che la sezione 3.3 misura.`,
    ],
    modelsIntro: [
      'Oltre alle frequenze delle singole lettere, l’attacco può usare le sequenze: un modello a n-grammi stima la probabilità di ogni lettera date le n - 1 precedenti, cioè una catena di Markov di ordine n - 1. I conteggi grezzi non bastano: con ottantamila lettere molti dei 456.976 quadrigrammi possibili non compaiono mai, e un modello che desse loro probabilità zero scarterebbe anche il testo giusto alla prima sequenza insolita.',
      'Le probabilità sono quindi lisciate verso il modello di ordine inferiore: un contesto visto spesso conta per i suoi conteggi, uno visto di rado prende in prestito dal contesto più corto, e uno mai visto ricade su di esso. È la media a posteriori con una distribuzione di Dirichlet a priori centrata sull’ordine inferiore e del peso di β osservazioni. Lo smoothing additivo, più comune, darebbe a un contesto mai visto la distribuzione uniforme: proprio i contesti insoliti che una decifratura sbagliata produce riceverebbero probabilità generose, e i quadrigrammi perderebbero buona parte del loro vantaggio. β si sceglie sui capitoli di validazione, minimizzando l’entropia incrociata.',
    ],
    formula: [
      'P_n(x | h) = ( c(h x) + β · P_(n-1)(x | h′) ) / ( c(h) + β )',
      'h = le n - 1 lettere precedenti; h′ = h senza la più vecchia; P_0(x) = 1/26',
      'entropia incrociata  H = -(1/N) Σ log2 P(x_t | contesto)   [bit per lettera]',
    ].join('\n'),
    modelsTitle: 'I modelli, misurati sui capitoli di test',
    modelCols: { order: 'Ordine', beta: 'β scelto', crossEntropy: 'Entropia incrociata (bit/lettera)', redundancy: 'Ridondanza D (bit/lettera)', unicity: 'Distanza di unicità (lettere)' },
    orderName: (n) => ['singole lettere', 'bigrammi', 'trigrammi', 'quadrigrammi'][n - 1],
    after: (s) => [
      `L’entropia incrociata scende da ${IT.num(s.models.crossEntropy[0], 2)} bit per lettera con le sole frequenze a ${IT.num(s.models.crossEntropy[3], 2)} con i quadrigrammi: più contesto, meno incertezza su ogni lettera. Shannon (1951) stimava per l’inglese, con contesti lunghi, fra 0,6 e 1,3 bit per lettera; la differenza è la parte della lingua che quattro lettere non vedono. Per le singole lettere la scelta di β è indifferente (le entropie di validazione differiscono alla sesta cifra), perché ogni lettera compare migliaia di volte.`,
      `La ridondanza D = log2 26 - H è ciò che rende possibile l’attacco. La distanza di unicità di Shannon (1949), U = H(K)/D = log2 26 / D, stima quante lettere di cifrato servono perché una sola chiave dia un testo plausibile: circa ${IT.num(s.models.unicity[0], 1)} con le sole frequenze, circa ${IT.num(s.models.unicity[3], 1)} con i quadrigrammi. La sezione 3.4 mostra che le lunghezze a cui l’attacco diventa affidabile hanno proprio questo ordine di grandezza.`,
    ],
  },
  algorithm: {
    intro: [
      'L’algoritmo: per ognuno dei 26 spostamenti s, decifrare e misurare quanto il risultato somiglia all’inglese; scegliere lo spostamento più plausibile. Il criterio naturale è la verosimiglianza. Se le lettere del chiaro fossero indipendenti con le frequenze q del corpus, la probabilità di osservare il cifrato con la chiave s sarebbe il prodotto delle q delle lettere decifrate; lo spostamento che la rende massima è lo stimatore di massima verosimiglianza della chiave, e con la chiave uniforme a priori anche lo stimatore bayesiano che, sotto quel modello, minimizza la probabilità di errore.',
      'In pratica bastano i 26 conteggi n_x del cifrato: decifrare con s trasforma la lettera cifrata x + s nella x, e la log-verosimiglianza è una somma di 26 termini, 26 × 26 operazioni qualunque sia la lunghezza del testo.',
    ],
    formula: [
      'ŝ = argmax_s  Σ_i log q(c_i - s)  =  argmax_s  Σ_x n_(x+s) · log q(x)',
      'P(s | cifrato) = exp(ℓ(s)) / Σ_t exp(ℓ(t))     (chiave uniforme a priori)',
    ].join('\n'),
    liveTitle: 'L’attacco sul cifrato di Cesare del messaggio',
    live: (crack, shift) =>
      crack.key === null
        ? 'Il cifrato non contiene lettere, o più spostamenti sono a pari merito: la verosimiglianza non sceglie.'
        : `Su ${crack.letters} lettere, lo spostamento più verosimile è s = ${crack.key}, con probabilità a posteriori ${IT.prob(crack.posterior[crack.key])}${crack.key === shift ? ': è quello usato in 2.1. ✓' : `, ma in 2.1 è stato usato s = ${shift}: con così poche lettere l’attacco sbaglia. ✗`}`,
    posteriorChart: 'Probabilità a posteriori dei 26 spostamenti, con il più probabile evidenziato',
    candidatesTitle: 'I cinque spostamenti più probabili',
    candidateCols: { shift: 's', perLetter: 'Log-verosimiglianza per lettera', posterior: 'Probabilità a posteriori', text: 'Decifrato' },
    fit: (checks) =>
      checks === null
        ? []
        : [
          `Verifica: le lettere decifrate con s = ${checks.best.shift} seguono le frequenze dell’inglese? Il χ² di adattamento dà p = ${IT.pval(checks.best.test.pValue)}: ${checks.best.test.verdict === 'reject' ? 'rifiutato, il testo è insolito per l’inglese' : 'non rifiutato, il testo è compatibile con l’inglese'}.${checks.second ? ` Con il secondo spostamento più probabile, s = ${checks.second.shift}, p = ${IT.pval(checks.second.test.pValue)}: ${checks.second.test.verdict === 'reject' ? 'rifiutato' : 'non rifiutato'}.` : ''}`,
        ],
    pending: 'L’attacco usa i modelli della sezione 3.1, ancora in calcolo.',
    after: [
      'Il χ² di Pearson, spesso usato allo stesso scopo, minimizza Σ (n_x(s) - L q_x)² / (L q_x): misura la stessa distanza fra frequenze osservate e attese, ma pesa molto le lettere rare (una "z" inattesa fa salire molto il χ²), e su testi corti sbaglia più spesso della verosimiglianza (sezione 3.4).',
      'Il punto debole del cifrario di Cesare non è solo il numero di chiavi: è che la sostituzione conserva la statistica del testo. Ogni lettera del cifrato porta un po’ di informazione sulla chiave, e la verosimiglianza la somma.',
    ],
  },
  lengths: {
    intro: (s) => [
      `Per misurare l’efficacia, l’algoritmo è stato provato sui capitoli di test, che non ha mai visto: per ogni lunghezza L da ${LENGTHS[0]} a ${LENGTHS[LENGTHS.length - 1]} lettere, fino a ${IT.int(SAMPLES.maxTrials)} brani disgiunti di L lettere consecutive, ognuno cifrato con uno spostamento casuale (seme ${EXPLORE_SEED}). Un tentativo vale 1 se la chiave trovata è giusta, 1/t se è fra t chiavi a pari merito (la probabilità di indovinarla tirando a sorte fra quelle), 0 altrimenti. Con brani lunghi i brani disgiunti sono meno (${s.caesar.trials[s.caesar.trials.length - 1]} da ${LENGTHS[LENGTHS.length - 1]} lettere), e gli intervalli di confidenza, di Wilson al 95%, più larghi.`,
    ],
    chart: 'Massima verosimiglianza sulle frequenze delle lettere: tasso di successo per lunghezza del cifrato (asse logaritmico)',
    legend: ['Tasso di successo, con l’intervallo di confidenza al 95%', 'Limite inferiore di Chernoff per lettere indipendenti'],
    tableTitle: 'Tasso di successo per lunghezza',
    cols: { length: 'Lettere', trials: 'Brani', rate: 'Successo', interval: 'Intervallo al 95%', bound: 'Limite di Chernoff' },
    explain: (s) => {
      const r = (L) => IT.pct(rateAt(s, 'unigram', L));
      const q = s.models.q[s.models.top];
      return [
        `Con una lettera sola l’algoritmo indovina nel ${r(1)} dei casi: sceglie lo spostamento che trasforma quella lettera in "${'abcdefghijklmnopqrstuvwxyz'[s.models.top]}", ed è giusto quando la lettera era proprio quella (nel corpus il ${IT.pct(q)} delle lettere). Con 10 lettere indovina nel ${r(10)} dei casi, con 20 nel ${r(20)}, con 50 nel ${r(50)}.`,
        `La forma della curva ha una spiegazione teorica. Se le lettere fossero indipendenti con frequenze q, lo spostamento giusto perderebbe contro uno sbagliato d con probabilità al più ρ_d^L, dove ρ_d = min_λ Σ_x q(x)^(1-λ) q(x-d)^λ (limite di Chernoff), e l’errore totale sarebbe al più Σ_d ρ_d^L. Lo spostamento più facile da confondere con quello giusto è d = ${s.caesar.confusable.shift} (o ${26 - s.caesar.confusable.shift}, il suo opposto), con ρ = ${IT.num(s.caesar.confusable.rho, 3)}: ogni lettera in più moltiplica il termine dominante dell’errore per ${IT.num(s.caesar.confusable.rho, 3)}, cioè porta ${IT.num(-Math.log2(s.caesar.confusable.rho), 2)} bit di evidenza a favore della chiave giusta. Il limite è prudente, perché somma 25 eventi che si sovrappongono, e diventa informativo solo oltre una decina di lettere, ma dice la cosa importante: l’errore decresce esponenzialmente con la lunghezza.`,
        s.caesar.rates.unigram.every((r, i) => r >= s.caesar.bound[i])
          ? 'Il testo vero non è fatto di lettere indipendenti: le parole ripetono sequenze, e due brani dello stesso capitolo si somigliano. Eppure la curva misurata sta sopra il limite a ogni lunghezza: la dipendenza fra lettere vicine non danneggia un attacco che la ignora, e la sfruttano gli n-grammi della sezione 3.4.'
          : 'Il testo vero non è fatto di lettere indipendenti, e il limite vale per un modello: a qualche lunghezza la curva misurata scende sotto il limite, segno che la dipendenza fra lettere vicine, o la differenza fra i capitoli, pesa. Gli n-grammi della sezione 3.4 la sfruttano invece di subirla.',
      ];
    },
  },
  methods: {
    intro: [
      'La consegna suggerisce di confrontare la ricerca esaustiva, l’analisi delle frequenze e i punteggi a n-grammi. Con 26 chiavi, ogni metodo le prova tutte: cambia il criterio con cui riconosce quella giusta, e quindi quanta informazione sulla lingua usa.',
    ],
    list: [
      { method: 'top', text: 'assume che la lettera più frequente del cifrato sia la "e". Usa un solo numero del corpus.' },
      { method: 'chi2', text: 'la distanza fra le frequenze delle lettere decifrate e quelle del corpus.' },
      { method: 'unigram', text: 'le frequenze del corpus come modello: l’algoritmo della sezione 3.2.' },
      { method: 'bigram', text: 'la verosimiglianza con il modello a bigrammi della sezione 3.1, che vede anche l’ordine di due lettere.' },
      { method: 'quadgram', text: 'la verosimiglianza con il modello a quadrigrammi: ogni lettera date le tre precedenti.' },
      { method: 'dictionary', text: 'decifra con ogni chiave e conta le lettere delle parole che compaiono nei capitoli di addestramento. È la ricerca esaustiva come la farebbe una persona, che legge le 26 decifrature e sceglie quella con parole vere.' },
    ],
    chart: 'Tasso di successo dei sei metodi per lunghezza del cifrato (asse logaritmico)',
    tableTitle: 'Lettere necessarie per raggiungere il 50%, il 90% e il 99% di successo',
    cols: { method: 'Metodo', levels: ['50%', '90%', '99%'] },
    never: 'oltre 200',
    explain: (s) => {
      const t = Object.fromEntries(thresholds(s).map((row) => [row.method, row.levels]));
      const L = (m, i) => (t[m][i] === null ? 'oltre 200' : String(t[m][i]));
      const r = (m, n) => IT.pct(rateAt(s, m, n));
      return [
        `L’ordine dei metodi è quello dell’informazione che usano. Il χ² e la massima verosimiglianza usano la stessa informazione, le frequenze, ma la verosimiglianza la usa meglio: è il criterio ottimo sotto il modello, e a 10 lettere vince ${r('unigram', 10)} contro ${r('chi2', 10)}. I quadrigrammi, che usano anche l’ordine delle lettere, arrivano al 90% con ${L('quadgram', 1)} lettere e al 99% con ${L('quadgram', 2)}; le frequenze da sole ne vogliono ${L('unigram', 1)} e ${L('unigram', 2)}. La distanza di unicità della sezione 3.1 prevedeva questo ordine di grandezza: circa ${IT.num(s.models.unicity[0], 0)} lettere con le sole frequenze, circa ${IT.num(s.models.unicity[3], 1)} con i quadrigrammi.`,
        `La ricerca esaustiva con dizionario (${IT.int(s.corpus.vocabulary)} parole diverse) sta in mezzo: ha bisogno di parole intere, e un brano corto taglia le parole ai bordi (a 5 lettere vale ${r('dictionary', 5)}, contro ${r('quadgram', 5)} dei quadrigrammi). E la si mette fuori gioco togliendo gli spazi, come facevano i crittografi classici scrivendo il cifrato in gruppi di cinque lettere, mentre gli n-grammi non se ne accorgono, perché leggono solo le lettere.`,
        `La lettera più frequente è il metodo peggiore: anche a 200 lettere indovina solo nel ${r('top', 200)} dei casi, perché in un brano breve la "e" non è sempre la lettera più frequente. È il metodo che si insegna per primo, ma ignora 25 frequenze su 26.`,
        'Il costo non distingue i metodi: tutti provano 26 chiavi. Le frequenze richiedono 26 × 26 operazioni qualunque sia la lunghezza, gli n-grammi 26 per lettera, il dizionario 26 ricerche per parola. Contro un cifrario con 26 chiavi il costo non conta mai: conta solo saper riconoscere la chiave giusta.',
      ];
    },
  },
  limits: {
    paras: [
      'Testi corti. Sotto le 5 lettere nessun metodo è affidabile, e con una o due lettere il problema non ha una soluzione unica: molte chiavi danno decifrature plausibili. È l’idea della distanza di unicità: sotto quella lunghezza il cifrario è inattaccabile, non perché sia robusto ma perché il messaggio stesso è ambiguo.',
      'La lingua. Il modello deve essere quello del testo: un messaggio in italiano attaccato con le frequenze dell’inglese spesso cade lo stesso, perché le due lingue hanno molte lettere frequenti in comune, ma servono più lettere; un testo di cifre, sigle o parole d’ordine casuali non ha ridondanza da sfruttare, e nessun metodo statistico lo rompe. Lo stesso vale per un testo atipico: Gadsby (1939) di Ernest Vincent Wright, un romanzo scritto senza la lettera "e", inganna il metodo della lettera più frequente e indebolisce gli altri.',
      'Il modello. L’indipendenza delle lettere è falsa (il limite di Chernoff vale per un testo che non esiste) e un corpus di un solo autore non è la lingua (sezione 3.1). Gli n-grammi correggono la prima approssimazione, un corpus più grande e vario la seconda; entrambe le correzioni fanno risparmiare lettere, non cambiano la conclusione.',
      'Il limite vero è altrove: l’attacco funziona perché il cifrario di Cesare è una sostituzione fissa. Anche la sostituzione monoalfabetica generale, con 26! ≈ 4·10^26 ≈ 2^88 chiavi, più delle 2^56 di DES, cade allo stesso modo, con un po’ più di testo e una ricerca più furba: un grande spazio delle chiavi è necessario ma non sufficiente. Serve che il cifrato non conservi la statistica del chiaro, ed è ciò che lo schema su curva garantisce (sezione 2.3).',
    ],
  },
  attack: {
    intro: [
      `Lo schema giocattolo è sicuro quanto è difficile ritrovare k da K = kG. Con k ristretto a ${KEY_BITS} bit, il problema diventa il logaritmo discreto in un intervallo noto, [1, 2^${KEY_BITS}): l’attaccante non ha bisogno del messaggio né di statistiche, gli basta la chiave pubblica, che è pubblica per definizione. Le sottosezioni attaccano la chiave della sezione 1 con tre algoritmi, misurano come cresce il costo con la dimensione della chiave e discutono che cosa cambia contro una chiave vera.`,
      'Il costo si misura in operazioni di gruppo, somme o raddoppi di punti: un numero che non dipende dal computer. I tempi, invece, sono quelli di questo browser.',
    ],
  },
  exhaustive: {
    intro: [
      `L’attacco più semplice: calcolare G, 2G, 3G, ..., una somma di punti per volta, finché si ottiene K. Il primo k con kG = K è la chiave, e non ci sono falsi positivi, a differenza dell’attacco statistico, perché la verifica è esatta. Il costo è k somme, in media 2^${KEY_BITS - 1} per una chiave uniforme a ${KEY_BITS} bit. La pagina prova i primi 2^${Math.log2(EXHAUSTIVE_LIMIT)} = ${IT.int(EXHAUSTIVE_LIMIT)} candidati sulla chiave della sezione 1, ne misura la velocità e stima il resto.`,
      'L’implementazione avanza 256 candidati alla volta: ognuno riceve la stessa somma, e una sola inversione modulare serve per tutti (il trucco di Montgomery), ma i candidati si controllano in ordine, così il numero di somme resta esattamente k.',
    ],
    found: (r) => `La chiave è fra i primi ${IT.int(r.limit)} candidati: k = ${IT.int(r.key)}, trovata dopo ${IT.int(r.ops)} somme, in ${IT.ms(r.ms)}. ✓`,
    notFound: (r, key) => `I primi ${IT.int(r.limit)} candidati in ${IT.ms(r.ms)}: ${IT.int(r.rate)} somme al secondo. La chiave non è fra loro. Per arrivare a k = ${IT.big(key)} servirebbero ${IT.big(key)} somme, circa ${IT.duration(r.toKey)} a questa velocità, e ${IT.duration(r.toAll)} per coprire l’intero intervallo.`,
    after: [
      'Ore in JavaScript, in un browser, su un solo processore. Un’implementazione ottimizzata in C, o su una scheda grafica, è più veloce di ordini di grandezza, e copre 2^32 candidati in secondi: la ricerca esaustiva è già sufficiente a rompere lo schema giocattolo. È ciò che è successo davvero con Profanity e con Milk Sad (sezione 6), dove le chiavi private venivano da un seme di 32 bit.',
    ],
  },
  bsgs: {
    intro: [
      `Baby-step giant-step (Shanks, 1971) scambia tempo con memoria. Ogni k in [1, 2^${KEY_BITS}) si scrive k = i·m + j con m = 2^${KEY_BITS / 2} e 0 ≤ i, j ≤ m. I passi piccoli calcolano jG per j = 1, ..., m e li mettono in una tabella indicizzata da x; i passi grandi calcolano K, K - mG, K - 2mG, ... finché K - i·mG è nella tabella, cioè coincide con jG, oppure con -jG, che ha la stessa x: allora k = i·m + j, oppure k = i·m - j. Al più m + 2^32/m ≈ 2^17 operazioni invece di 2^32, ma servono m punti in memoria.`,
    ],
    formula: [
      'passi piccoli    tabella x(jG) → j,  per j = 1, ..., m        (m = 2^16)',
      'passi grandi     Q_i = K - i·mG,  per i = 0, 1, 2, ...',
      'incontro         x(Q_i) = x(jG)  ⇒  k = i·m + j  (oppure i·m - j)',
    ].join('\n'),
    result: (r) => (r.found
      ? `k = ${IT.int(r.key)} = ${IT.int(r.i)} · ${IT.int(r.m)} + ${IT.int(r.j)}: trovata con ${IT.int(r.ops)} operazioni (${IT.int(r.baby)} passi piccoli e ${IT.int(r.giant)} grandi), in ${IT.ms(r.ms)}. ✓`
      : 'La chiave non è nell’intervallo. ✗'),
    decryptedLabel: 'Il messaggio della sezione 1, decifrato con la chiave ritrovata',
    check: (ok) => (ok ? 'Coincide con il messaggio originale: l’attaccante legge tutto, senza aver mai visto k. ✓' : 'Non coincide con il messaggio. ✗'),
    after: [
      'La tabella dei passi piccoli non dipende dalla chiave attaccata: costruita una volta, serve per tutte le chiavi dello stesso intervallo, e ogni nuova chiave costa in media solo 2^15 passi grandi. Contro molti utenti con chiavi piccole l’attacco diventa più conveniente, non meno.',
    ],
  },
  kangaroo: {
    intro: [
      `Il metodo del canguro (Pollard, 1978) ottiene lo stesso costo, circa 2·2^${KEY_BITS / 2} = 2^${KEY_BITS / 2 + 1} operazioni, con una memoria trascurabile. Due branchi di canguri saltano lungo il gruppo: i salti valgono 2^j·G, e j dipende dal punto in cui il canguro si trova, così due canguri che passano per lo stesso punto da lì in poi fanno gli stessi salti. I canguri "domestici" partono da multipli noti di G a metà dell’intervallo, quelli "selvatici" da K più un multiplo noto. Quando un selvatico cade sulle orme di un domestico i due percorsi si fondono, e lo si scopre al successivo punto distinto (un punto la cui x finisce con d zeri binari), che entrambi visitano e memorizzano con la distanza percorsa. Da lì: esponente del domestico = k + esponente del selvatico, e k segue.`,
      'È la versione parallela di van Oorschot e Wiener (1999): N canguri, metà per branco, con salto medio N·√w/4 per un intervallo di ampiezza w, la scelta che minimizza il lavoro atteso, circa 2√w salti in tutto.',
    ],
    result: (r) => (r.found
      ? `k = ${IT.int(r.key)}: trovata con ${IT.int(r.ops)} salti di ${r.N} canguri (attesi circa ${IT.int(r.expected)}), salto medio ${IT.int(r.meanJump)}, memorizzando solo ${IT.int(r.distinguished)} punti distinti, in ${IT.ms(r.ms)}. ✓`
      : 'La chiave non è stata trovata. ✗'),
    after: [
      'Rispetto a baby-step giant-step la memoria scende da 65.536 punti a qualche centinaio, e il lavoro si divide fra tanti processori quanti sono i canguri, quasi senza comunicazione: è il metodo usato in pratica per i logaritmi discreti in un intervallo. Il numero di salti varia da una chiave all’altra: è piccolo quando k è vicino al centro dell’intervallo, dove partono i domestici, grande quando è vicino ai bordi.',
    ],
  },
  scaling: {
    intro: (sc) => [
      `Per vedere come cresce il costo, i tre attacchi sono stati provati su chiavi casuali di dimensione crescente (seme ${sc.seed}): la ricerca esaustiva da ${sc.rows.exhaustive[0].bits} a ${sc.rows.exhaustive[sc.rows.exhaustive.length - 1].bits} bit, baby-step giant-step da ${sc.rows.bsgs[0].bits} a ${sc.rows.bsgs[sc.rows.bsgs.length - 1].bits}, il canguro da ${sc.rows.kangaroo[0].bits} a ${sc.rows.kangaroo[sc.rows.kangaroo.length - 1].bits}. Le operazioni non dipendono dalla macchina; la velocità sì, e questa ne fa ${IT.int(sc.rate)} al secondo.`,
    ],
    chart: 'log2 delle operazioni medie per dimensione della chiave: misurate (punti) e retta con l’esponente teorico (tratteggio)',
    legend: ['Ricerca esaustiva', 'Baby-step giant-step', 'Canguro'],
    fitsTitle: 'Le pendenze stimate',
    fitCols: { method: 'Attacco', slope: 'Pendenza stimata', theory: 'Teoria', constant: 'Costante (log2)' },
    extrapolationTitle: 'Estrapolazione',
    extrapolationCols: { bits: 'Bit della chiave', exhaustive: 'Ricerca esaustiva', best: 'BSGS o canguro', here: 'Tempo qui', fast: 'Tempo a 10^12 operazioni/s', memory: 'Memoria di BSGS' },
    memory: (e) => `2^${e} punti`,
    explain: (sc) => {
      const f = sc.fits;
      return [
        `Le pendenze stimate sono ${IT.num(f.exhaustive.slope, 2)} ± ${IT.num(f.exhaustive.slopeError, 2)} per la ricerca esaustiva, ${IT.num(f.bsgs.slope, 3)} ± ${IT.num(f.bsgs.slopeError, 3)} per baby-step giant-step e ${IT.num(f.kangaroo.slope, 2)} ± ${IT.num(f.kangaroo.slopeError, 2)} per il canguro: compatibili con 1 e con 1/2. Ogni bit in più di chiave raddoppia il lavoro della ricerca esaustiva e lo moltiplica per √2 negli altri due. La ricerca esaustiva è la più rumorosa perché il suo costo è la chiave stessa, uniforme fra 1 e 2^b.`,
        'L’estrapolazione tiene fisso l’esponente della teoria e stima dai dati solo la costante: estrapolare la pendenza stimata sarebbe imprudente, perché un errore di 0,02 sulla pendenza diventerebbe un fattore 2^5 a 256 bit. È la differenza fra un modello giustificato dalla teoria e una retta adattata ai dati.',
        `A ${KEY_BITS} bit l’attacco migliore costa circa 2^17 operazioni: meno di un secondo. A 256 bit ne costerebbe circa 2^129, e anche a 10^12 operazioni al secondo servirebbero circa ${IT.duration(2 ** 129 / FAST_RATE)}, un miliardo di volte l’età dell’universo.`,
      ];
    },
  },
  differences: {
    intro: 'La consegna chiede di confrontare questo attacco con quello statistico al cifrario di Cesare. Sono diversi in quasi tutto.',
    cols: ['', 'Attacco statistico a Cesare', 'Attacco allo schema giocattolo'],
    rows: [
      ['Che cosa ricostruisce', 'Il messaggio, e la chiave come sottoprodotto.', 'La chiave privata; il messaggio segue.'],
      ['Da che cosa', 'Dal cifrato (poche lettere) e da un modello della lingua.', 'Dalla sola chiave pubblica: il cifrato serve solo dopo, per leggere.'],
      ['Che cosa sfrutta', 'La ridondanza della lingua, che la sostituzione conserva.', 'La struttura algebrica K = kG e il piccolo intervallo di k.'],
      ['Natura', 'Un problema di stima: quale chiave rende il testo più plausibile.', 'Un problema di ricerca: quale k soddisfa kG = K.'],
      ['Esito', 'Probabilistico: con testi corti può sbagliare.', 'Certo: la chiave esiste ed è unica nell’intervallo.'],
      ['Verifica della chiave', 'Statistica: la più verosimile, non necessariamente quella giusta.', 'Esatta: kG = K, senza falsi positivi.'],
      ['Costo', '26 tentativi, qualunque sia il testo.', 'Fino a 2^32 operazioni con la ricerca esaustiva, circa 2^17 con BSGS o il canguro.'],
      ['Dipende dal messaggio?', 'Sì: lingua e lunghezza decidono il successo.', 'No: funziona anche se il messaggio è casuale.'],
      ['Rimedio', 'Nessuno dentro il cifrario: la sostituzione conserva la statistica per costruzione.', 'Allargare lo spazio delle chiavi a n - 1 ≈ 2^256.'],
    ],
    after: [
      'In una frase: l’attacco a Cesare è un problema di stima, quello allo schema giocattolo un problema di ricerca. Il primo usa la statistica del messaggio, il secondo la ignora; il primo può sbagliare, il secondo no; il primo non si ferma allargando lo spazio delle chiavi (la sostituzione monoalfabetica, con 2^88 chiavi, cade allo stesso modo), il secondo sì.',
      'Hanno però un punto in comune: entrambi provano chiavi e riconoscono quella giusta. Contro Cesare provare è banale e riconoscere è il problema; contro lo schema su curva riconoscere è banale (kG = K) e provare è il problema. La sicurezza di un cifrario moderno chiede che entrambe le cose siano difficili: nessun riconoscimento statistico dal cifrato (sezione 2.3), e nessuna ricerca possibile nello spazio delle chiavi.',
    ],
  },
  real: {
    paras: [
      'Contro secp256k1 con una chiave scelta uniformemente fra 1 e n - 1, la ricerca esaustiva richiederebbe in media 2^255 operazioni, e baby-step giant-step e il canguro circa 2^128, il primo con 2^128 punti in memoria. Non è un limite di questi algoritmi: Shoup (1997) ha dimostrato che ogni algoritmo generico, che usa il gruppo solo attraverso le sue operazioni, ha bisogno di Ω(√n) operazioni. Il rho di Pollard raggiunge questo limite senza memoria, ma non fa meglio.',
      'Gli attacchi non generici sfruttano una struttura che secp256k1 non ha. Pohlig-Hellman richiede che l’ordine del gruppo abbia fattori piccoli, e n è primo; MOV e Frey-Rück richiedono un grado di immersione piccolo, e quello di secp256k1 è enorme; l’attacco di Smart richiede una curva anomala, con #E = p, e secp256k1 non lo è. L’unica struttura in più, l’endomorfismo (x, y) → (βx, y), riduce il rho di un fattore √6 (Duursma, Gaudry e Morain, 1999): da 2^128 a circa 2^127 operazioni, come visto nell’esercizio 1 dell’Homework #1.',
      `L’asimmetria è ciò che rende la crittografia possibile. Il proprietario della chiave calcola K = kG con circa 256 raddoppi e 128 somme, un costo che cresce come il logaritmo di n; l’attaccante ha bisogno di circa √n operazioni. Passare da ${KEY_BITS} a 256 bit moltiplica per 8 il lavoro di chi usa la chiave e per 2^112 quello di chi la cerca.`,
      'Per questo "ben configurato" vuol dire anzitutto chiave generata bene: uniforme in [1, n - 1], da un generatore crittografico. Le chiavi deboli trovate nella realtà non erano corte per scelta, ma per un generatore difettoso: 32 bit di seme in Profanity (2022) e nel comando bx seed di Libbitcoin Explorer (Milk Sad, 2023). La curva era sicura, lo spazio delle chiavi effettivo no. Resta un’eccezione: un computer quantistico abbastanza grande risolverebbe il logaritmo discreto in tempo polinomiale con l’algoritmo di Shor, e lì nessuna lunghezza di chiave su curva basterebbe.',
    ],
  },
  weaknesses: {
    intro: 'La consegna chiede di separare le debolezze dovute allo spazio ridotto delle chiavi da quelle del progetto dello schema. La tabella le elenca; due si possono provare qui, sul messaggio della sezione 1.',
    cols: { weakness: 'Debolezza', origin: 'Origine', attack: 'Attacco', fix: 'Rimedio' },
    rows: [
      ['k di 32 bit', 'Spazio delle chiavi', 'Ricerca esaustiva, baby-step giant-step, canguro (4.1-4.3): k dalla sola K, con circa 2^17 operazioni.', 'k uniforme in [1, n - 1].'],
      ['Precalcolo e molti bersagli', 'Spazio delle chiavi', 'Una tabella di passi piccoli, o di punti distinti, costruita una volta serve per ogni chiave dello stesso intervallo, e ogni chiave in più costa meno (Bernstein e Lange, 2012).', 'Come sopra.'],
      ['Nonce riusato', 'Progetto (uso)', 'Tutti i C1 uguali, e C2_i - C2_j = (b_i - b_j)G rivela le differenze fra i byte: un cifrario di Cesare sui byte, rotto con le frequenze (prova qui sotto).', 'Un nonce nuovo per ogni cifratura, dal generatore crittografico.'],
      ['Nonce prevedibile o piccolo', 'Progetto (uso)', 'Chi ricalcola r (da un seme noto, come i nonce riproducibili di questa pagina) o lo trova con baby-step giant-step se è piccolo, calcola S = rK e decifra senza k.', 'Come sopra.'],
      ['Malleabilità', 'Progetto', 'Aggiungere δG a C2 aggiunge δ al byte decifrato, senza conoscere k (prova qui sotto); i blocchi si possono anche scambiare, togliere o duplicare.', 'Un cifrario autenticato, che rifiuta i cifrati modificati (ECIES).'],
      ['Cifrati scelti', 'Progetto', 'Chi può far decifrare un cifrato a piacere manda (C1 + tG, C2 + tK), che cifra lo stesso messaggio con il nonce r + t, e lo legge: lo schema non è sicuro contro attacchi a cifrato scelto (IND-CCA2).', 'Come sopra.'],
      ['Punti non validati', 'Implementazione', 'Se la decifratura non controllasse che C1 sta sulla curva, punti di curve diverse con sottogruppi piccoli rivelerebbero k modulo piccoli primi (attacchi a curva non valida: Biehl, Meyer e Müller, 2000). Questa implementazione rifiuta i punti che non stanno sulla curva.', 'Validare ogni punto ricevuto.'],
      ['Un byte per blocco', 'Progetto', 'Rivela la lunghezza esatta, moltiplica il cifrato per 66, e i blocchi sono indipendenti, come nella modalità ECB.', 'Cifrare l’intero messaggio con una chiave derivata (cifratura ibrida).'],
      ['Messaggi piccoli', 'Progetto, ma innocua', 'Ogni blocco ha solo 256 messaggi possibili, ma cifrarli tutti e confrontare non serve, perché il nonce cambia il cifrato ogni volta. Lo servirebbe in uno schema deterministico, come RSA senza padding.', 'Nessuno: la cifratura probabilistica lo protegge già.'],
    ],
    reuseTitle: 'Prova: lo stesso nonce per ogni byte',
    reuse: (demo) => {
      const a = demo.attack;
      if (!a || !a.candidates.length) return ['Il messaggio non dà candidati validi.'];
      return [
        `Il messaggio della sezione 1 cifrato con un solo nonce: i ${demo.blocks.length} C1 sono ${a.sameC1 ? 'tutti uguali, e lo vede chiunque' : 'diversi'}. Le differenze C2_i - C2_1 = (b_i - b_1)G danno b_i - b_1 con la tabella dei punti, e del messaggio resta ignoto un solo byte, b_1: ${a.range} valori possibili, di cui ${a.valid} danno un testo UTF-8 valido. Le frequenze dei byte nei capitoli di addestramento scelgono il più plausibile:`,
      ];
    },
    reuseResult: 'Il messaggio letto senza k',
    reuseCheck: (ok) => (ok ? 'Coincide con il messaggio originale: nessuna chiave privata, nessun logaritmo discreto difficile. ✓' : 'Non coincide con il messaggio originale: il messaggio è troppo corto o atipico. ✗'),
    augustusTitle: 'Prova: la malleabilità',
    augustus: 'Ogni C2 del cifrato della sezione 1 più G, decifrato con k:',
    augustusFail: 'Il messaggio contiene il byte 255, che più 1 non è più un byte: il blocco non si decifra.',
    augustusAfter: 'Ogni byte è aumentato di 1: le lettere sono diventate le successive, gli spazi punti esclamativi. È il cifrario di Augusto, che secondo Svetonio spostava ogni lettera di un posto, applicato da chi non conosce la chiave a un messaggio che non può leggere.',
    after: [
      'Delle debolezze, solo le prime due vengono dallo spazio ridotto delle chiavi, e scompaiono con k di 256 bit. Le altre sono del progetto o dell’implementazione, e resterebbero con qualunque chiave: è per questo che gli schemi reali non cifrano con ElGamal "nudo", ma con schemi ibridi autenticati come ECIES (da DHIES, Abdalla, Bellare e Rogaway, 2001), sicuri anche contro chi può far decifrare cifrati scelti.',
    ],
  },
  stats: {
    verdict: { reject: 'H₀ rifiutata', notReject: 'H₀ non rifiutata' },
    expected: { reject: 'atteso: rifiuto', notReject: 'atteso: nessun rifiuto', either: 'misura una differenza reale' },
    testLine: testLineIt,
    groups: { corpus: 'Corpus', caesar: 'Cesare', ec: 'Schema su curva', keys: 'Chiavi pubbliche' },
    labels: {
      corpus: { homogeneity: 'Addestramento e test hanno le stesse frequenze delle lettere (χ², 2 × 26)' },
      caesar: {
        uniform: 'Le lettere del cifrato di Cesare sono uniformi sulle 26 (χ²)',
        dependence: 'Lettera del chiaro e lettera del cifrato sono indipendenti (χ², Cesare)',
      },
      ec: {
        uniform: 'I byte di x(C1) e x(C2) sono uniformi sui 256 valori (χ²)',
        parity: 'La y di C2 è dispari con probabilità 1/2 (binomiale)',
        independence: 'Il byte in chiaro e i primi 2 bit di x(C2) sono indipendenti (χ²)',
      },
      keys: {
        small: 'I bit di x(kG) sono monete eque per chiavi di 32 bit: Σz² ~ χ²(256)',
        full: 'I bit di x(kG) sono monete eque per chiavi di 256 bit: Σz² ~ χ²(256)',
      },
    },
  },
  tests: {
    intro: `I test d’ipotesi della pagina, con livello di significatività α = ${IT.num(SIGNIFICANCE, 2)}. A differenza degli homework precedenti, qui alcuni rifiuti sono attesi e voluti: il cifrato di Cesare non è uniforme e dipende dal chiaro, ed è proprio ciò che lo rende attaccabile.`,
    cols: { subject: 'Oggetto', hypothesis: 'Ipotesi nulla H₀', p: 'p-value', verdict: 'Esito', expected: 'Lettura' },
    keysIntro: (s) => `Le chiavi pubbliche: ${IT.int(s.keys.small.N)} chiavi K = kG con k uniforme fra 1 e 2^32 - 1, e altrettante con k uniforme fra 1 e n - 1. Se la restrizione lasciasse un’impronta nelle coordinate, il primo test la vedrebbe.`,
    after: (sum) => [
      `${sum.rejected} test su ${sum.count} rifiutano l’ipotesi nulla, ${sum.asExpected === sum.count ? 'tutti come atteso' : `${sum.asExpected} su ${sum.count} come atteso`}. I rifiuti del cifrario di Cesare sono la sua debolezza (sezione 2.3); quello del corpus misura una differenza reale ma piccola fra capitoli (sezione 3.1). I test sullo schema su curva e sulle chiavi pubbliche non rifiutano nulla, eppure lo schema si rompe in meno di un secondo: i test statistici misurano l’assenza di difetti grossolani nelle uscite, non la difficoltà di invertire la funzione.`,
    ],
  },
  history: {
    intro: 'Dal cifrario di Cesare a ElGamal su curva ellittica, le idee di questa pagina in ordine cronologico, con le due vulnerabilità reali che riproducono lo schema giocattolo.',
    legend: { task: 'usato in questa pagina', context: 'contesto' },
    events: [
      { year: 'I secolo a.C.', task: true, title: 'Il cifrario di Cesare', text: 'Svetonio (Vite dei Cesari, circa 121 d.C.) racconta che Cesare scriveva le lettere riservate sostituendo ogni lettera con quella tre posti più avanti, e che Augusto usava la successiva. Il messaggio di questa pagina è la sua descrizione.' },
      { year: 'IX secolo', task: true, title: 'al-Kindi e l’analisi delle frequenze', text: 'Nel trattato sulla decifrazione dei messaggi crittografici, al-Kindi descrive il metodo della sezione 3: contare le lettere del cifrato e confrontarle con quelle di un testo lungo nella stessa lingua. È la più antica descrizione nota della crittanalisi statistica; il manoscritto, conservato a Istanbul, è stato pubblicato nel 1987.' },
      { year: '1467', task: false, title: 'Alberti', text: 'Leon Battista Alberti descrive il disco cifrante e la sostituzione polialfabetica: cambiare alfabeto durante il messaggio, così che le frequenze non sopravvivano.' },
      { year: '1553-1586', task: false, title: 'Bellaso e Vigenère', text: 'Il cifrario che porta il nome di Vigenère, descritto prima da Giovan Battista Bellaso: un cifrario di Cesare con uno spostamento diverso per ogni lettera, dato da una parola chiave. Resiste per tre secoli.' },
      { year: '1863', task: false, title: 'Kasiski', text: 'Friedrich Kasiski pubblica come trovare la lunghezza della chiave di Vigenère: il cifrato si divide allora in tanti cifrari di Cesare, e ognuno cade con le frequenze.' },
      { year: '1900', task: false, title: 'Pearson', text: 'Karl Pearson introduce il test del χ², il criterio di uno dei metodi della sezione 3.4 e di molti test di questa pagina.' },
      { year: '1920-1922', task: false, title: 'Friedman', text: 'William Friedman definisce l’indice di coincidenza (scritto nel 1920, pubblicato nel 1922): la statistica entra nella crittanalisi come misura, non più come intuizione.' },
      { year: '1949-1951', task: true, title: 'Shannon', text: 'La teoria matematica della segretezza: cifrari perfetti, entropia e distanza di unicità (1949), poi la stima dell’entropia dell’inglese (1951). Sono le grandezze della sezione 3.1.' },
      { year: '1971', task: true, title: 'Baby-step giant-step', text: 'Daniel Shanks, studiando i numeri di classe dei campi quadratici, trova il primo algoritmo in √n per il logaritmo discreto.' },
      { year: '1976', task: false, title: 'Diffie e Hellman', text: 'Nasce la crittografia a chiave pubblica, con lo scambio di chiavi che porta il loro nome: S = rK = kC1 è uno scambio di Diffie-Hellman su curva.' },
      { year: '1978', task: true, title: 'Pollard', text: 'John Pollard pubblica i metodi rho e canguro (lambda) per il logaritmo discreto: √n operazioni, senza tabelle.' },
      { year: '1984-1985', task: true, title: 'Cifratura probabilistica ed ElGamal', text: 'Goldwasser e Micali definiscono la sicurezza semantica e la cifratura probabilistica (1984); Taher ElGamal pubblica lo schema di cifratura e di firma basato sul logaritmo discreto (1985).' },
      { year: '1985-1987', task: true, title: 'Curve ellittiche', text: 'Miller (1985) e Koblitz (1987) propongono le curve ellittiche per la crittografia; Koblitz descrive anche l’analogo di ElGamal su curva e come rappresentare un messaggio con un punto.' },
      { year: '1997-1999', task: false, title: 'I limiti degli attacchi generici', text: 'Shoup dimostra che un algoritmo generico ha bisogno di Ω(√n) operazioni (1997); van Oorschot e Wiener parallelizzano rho e canguro con i punti distinti (1999).' },
      { year: '2000-2001', task: false, title: 'secp256k1 ed ECIES', text: 'SEC 2 pubblica i parametri di secp256k1 (2000); Abdalla, Bellare e Rogaway analizzano DHIES (2001), lo schema ibrido autenticato da cui viene ECIES, il modo corretto di cifrare con una chiave su curva.' },
      { year: '2022', task: true, title: 'Profanity', text: 'Un generatore di indirizzi Ethereum "personalizzati" ricava le chiavi private da un seme di 32 bit. A metà settembre 1inch rende pubblica la debolezza; pochi giorni dopo Wintermute perde circa 160 milioni di dollari. Lo spazio delle chiavi dello schema giocattolo, nella realtà.' },
      { year: '2023', task: true, title: 'Milk Sad', text: 'Il comando bx seed di Libbitcoin Explorer 3.x genera le frasi dei wallet con un Mersenne Twister inizializzato da 32 bit dell’orologio di sistema: i fondi vengono rubati fra giugno e luglio (CVE-2023-39910).' },
    ],
    after: 'Letta in ordine, la storia ripete la stessa lezione due volte. I cifrari classici sono caduti per la statistica, e ogni tentativo di salvarli (più alfabeti, chiavi più lunghe) ha solo spostato più in là il numero di lettere necessarie, finché Shannon ha dato la misura esatta del problema. La crittografia moderna ha risolto quel problema, con cifrati indistinguibili dal caso, e ha spostato la sicurezza sulla difficoltà di un calcolo: ma un calcolo difficile su uno spazio di chiavi piccolo è facile, come hanno scoperto nel 2022 e nel 2023 i proprietari di chiavi generate da 32 bit.',
  },
  conclusion: (s) => [
    `Lo stesso messaggio, cifrato con i due schemi, mostra due modi opposti di fallire. Il cifrario di Cesare cade perché conserva la statistica del testo: con le frequenze dell’inglese e la massima verosimiglianza ${s ? `bastano 20 lettere per ritrovare la chiave nel ${IT.pct(rateAt(s, 'unigram', 20), 0)} dei casi, e con i quadrigrammi 10 lettere per il ${IT.pct(rateAt(s, 'quadgram', 10), 0)}` : 'bastano poche decine di lettere per ritrovare la chiave quasi sempre'}. Lo schema su curva ha un cifrato statisticamente impeccabile, e cade lo stesso, in meno di un secondo, perché la chiave privata ha 32 bit: l’attacco non guarda il messaggio, risolve un logaritmo discreto in un intervallo piccolo.`,
    'Le due lezioni si completano. Uno spazio delle chiavi grande è necessario ma non sufficiente: la sostituzione monoalfabetica ha 2^88 chiavi e si rompe con le frequenze. Un cifrato indistinguibile dal caso è necessario ma non sufficiente: lo schema giocattolo ce l’ha e si rompe con 2^17 operazioni. ElGamal su curva con una chiave di 256 bit ha entrambe le proprietà, e il miglior attacco noto richiede circa 2^128 operazioni.',
    'Resta ciò che nessuna lunghezza di chiave sistema: nonce riusati o prevedibili, cifrati malleabili, punti non validati. Sono errori di progetto e di implementazione, e nella realtà fanno più danni degli algoritmi: le chiavi rubate con Profanity e con Milk Sad stavano su una curva sicura, ma erano state generate male.',
  ],
  methodNames: methodNamesIt,
  attackNames: { exhaustive: 'Ricerca esaustiva', bsgs: 'Baby-step giant-step', kangaroo: 'Canguro' },
  tips: {
    letter: (letter, count, expected) => `${letter}: ${count} ${count === 1 ? 'volta' : 'volte'}, attese ${IT.num(expected, 1)}`,
    byte: (b, count, expected) => `Byte ${b}: ${IT.int(count)} volte, attese ${IT.num(expected, 1)}`,
    bytes: (from, to, min, max, expected) => `Byte da ${from} a ${to}: da ${IT.int(min)} a ${IT.int(max)} volte, attese ${IT.num(expected, 1)} ciascuno`,
    frequency: (letter, training, test) => `${letter}: ${IT.pct(training, 2)} in addestramento, ${IT.pct(test, 2)} nel test`,
    shift: (s, p, text) => `s = ${s}: probabilità ${IT.prob(p)}; "${text.slice(0, 32)}${text.length > 32 ? '...' : ''}"`,
    success: (L, n, rate, interval, bound) => `${L} ${L === 1 ? 'lettera' : 'lettere'}, ${n} brani: successo ${IT.pct(rate)} (95%: ${IT.pct(interval[0])}-${IT.pct(interval[1])}); limite di Chernoff ${IT.pct(bound)}`,
    methods: (L, rates) => `${L} ${L === 1 ? 'lettera' : 'lettere'}: ${rates.map((r, i) => `${Object.values(methodNamesIt)[i]} ${IT.pct(r)}`).join(', ')}`,
    scaling: (bits, means) => `${bits} bit: ${means.map((m, i) => (m === null ? null : `${['ricerca esaustiva', 'BSGS', 'canguro'][i]} ${IT.int(m)}`)).filter(Boolean).join(', ')} operazioni in media`,
  },
  download: {
    title: 'Scarica il codice',
    text: 'Il programma completo in HTML, CSS e JavaScript, senza dipendenze, in italiano e in inglese: dopo aver estratto l’archivio si apre con un doppio clic su index.html, anche offline. Con node homework2a.js stampa nel terminale lo schema, il cifrario di Cesare, gli attacchi e le statistiche; --key, --message, --shift e --random-nonces cambiano l’input.',
    contents: 'Contenuto: index.html, style.css, homework2a.js (schemi, attacchi, corpus e statistiche), app.js (interfaccia e testi), README.txt.',
    zip: 'Scarica homework2a.zip',
    online: 'Apri il programma online',
  },
  standalone: {
    subtitle: 'Uno schema giocattolo su curva ellittica e il cifrario di Cesare: cifratura, crittanalisi statistica e attacchi.',
    course: 'Statistics, laurea magistrale in Cybersecurity, Sapienza Università di Roma',
    online: 'Versione online',
    noscript: 'Questo programma ha bisogno di JavaScript.',
  },
};

// ---------------------------------------------------------------------------
// ENGLISH
// ---------------------------------------------------------------------------

const EN = formatters('.', ',', 'n/a', { years: 'years', days: 'days', hours: 'hours', minutes: 'minutes', seconds: 'seconds' }, '×');

/** The line of numbers under a hypothesis test, whatever its kind. */
function testLineEn(t) {
  const F = EN;
  switch (t.kind) {
    case 'chi2':
      return t.classes === undefined
        ? `Σz² = ${F.num(t.chi2, 1)}, χ² with ${t.df} degrees of freedom, p = ${F.pval(t.pValue)}`
        : `χ² = ${F.num(t.chi2, 1)} over ${t.classes} classes (${t.df} degrees of freedom), p = ${F.pval(t.pValue)}`;
    case 'binomial':
      return `${F.int(t.successes)} of ${F.int(t.trials)} = ${F.pct(t.rate, 2)} (expected ${F.pct(t.expectedRate, 2)}), z = ${F.num(t.z, 2)}, p = ${F.pval(t.pValue)}`;
    case 'independence':
      return `χ² = ${F.num(t.chi2, 1)} on a ${t.rows} × ${t.cols} table (${t.df} degrees of freedom, smallest expected count ${F.num(t.minExpected, 1)}), Cramér's V = ${F.num(t.cramerV, 3)}, p = ${F.pval(t.pValue)}`;
    default:
      return `p = ${F.pval(t.pValue)}`;
  }
}

const methodNamesEn = {
  top: 'Most frequent letter',
  chi2: 'Pearson’s χ²',
  unigram: 'Maximum likelihood',
  bigram: 'Bigrams',
  quadgram: 'Quadgrams',
  dictionary: 'Exhaustive search with a dictionary',
};

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
    scheme: '1. TASK: the toy scheme on secp256k1, encrypting and decrypting',
    input: '1.1 Private key, message and nonces',
    keys: '1.2 Key generation',
    encrypt: '1.3 Encryption',
    decrypt: '1.4 Decryption',
    roles: '1.5 The role of the keys',
    verify: '1.6 Checks',
    caesar: '2. The Caesar cipher and the two schemes compared',
    caesarCipher: '2.1 Encrypting and decrypting the same message',
    compare: '2.2 Procedures and key spaces',
    properties: '2.3 The statistical properties of the two ciphertexts',
    cryptanalysis: '3. Statistical cryptanalysis of the Caesar cipher',
    corpus: '3.1 The corpus and the language models',
    algorithm: '3.2 The algorithm: maximum likelihood',
    lengths: '3.3 Ciphertexts of different lengths',
    methods: '3.4 Exhaustive search, frequencies and n-grams compared',
    limits: '3.5 Effectiveness and limitations',
    attack: '4. The attack on the toy scheme',
    exhaustive: '4.1 Exhaustive search',
    bsgs: '4.2 Baby-step giant-step',
    kangaroo: '4.3 Pollard’s kangaroo method',
    scaling: '4.4 The cost as the key grows',
    differences: '4.5 Two attacks compared',
    real: '4.6 Why it fails against properly configured ECC',
    weaknesses: '4.7 Other attacks: key space or design?',
    tests: '5. Summary of the statistical tests',
    history: '6. Historical context',
    conclusion: '7. Conclusions',
  },
  assignment: {
    intro: [
      'The assignment has three parts. The first asks to encrypt and decrypt a message with the toy scheme based on secp256k1 from the previous homework, describing the steps of the algorithm and the role of the keys; then to encrypt the same message with the Caesar cipher and to compare the two schemes: encryption and decryption procedures, key spaces, statistical properties. The second asks to break the Caesar cipher with statistics: given a large enough corpus in a known language, an algorithm that recovers the key from the distribution of letters, tested on texts of different lengths and, optionally, compared with exhaustive search, letter-frequency analysis and n-gram scoring. The third asks to break the toy scheme by exploiting the restricted space of private keys, to compare this attack with the statistical one, to explain why it would not work against properly configured elliptic-curve cryptography and, optionally, to tell the weaknesses due to the restricted key space from those of the scheme’s design.',
      `The scheme "of Part 1" needs to be made precise. Exercise 1 of Homework #1 computed K = kG on toy curves (y² = x³ + 7 over F_17, as the parameters of that assignment required, and over somewhat larger prime fields); Exercise 2 used secp256k1 with 256-bit keys, without encrypting anything. The scheme this assignment assumes lies in between: the real curve, secp256k1, with the private key restricted to a small range, here the integers from 1 to 2^${KEY_BITS} - 1; and, to encrypt, the standard method for a key pair K = kG, elliptic-curve ElGamal. Section 1 defines it and uses it.`,
      'The page follows the order of the assignment: section 1 encrypts and decrypts with the toy scheme, section 2 with the Caesar cipher and compares the two ciphertexts, section 3 breaks the Caesar cipher with the statistics of an English corpus, section 4 breaks the toy scheme with three discrete-logarithm algorithms and discusses why the same attack is not enough against a real key. Section 5 sums up the statistical tests, section 6 places the ideas in time and section 7 draws the conclusions. Every number is computed in the browser, and the downloadable program prints the same ones.',
    ],
    originalTitle: 'The original text of the assignment',
    originalNote: 'As it was assigned.',
  },
  scheme: {
    intro: [
      'The scheme is elliptic-curve ElGamal, proposed by Koblitz in 1987 from ElGamal’s scheme of 1985, on the secp256k1 curve of Bitcoin and Ethereum. The receiver picks a private key k and publishes K = kG. To encrypt, the sender turns every byte of the message into a point M = bG, draws a random number r (the nonce) and sends the pair C1 = rG, C2 = M + rK. The receiver computes kC1 = k·rG = r·kG = rK, subtracts it from C2 and gets M back, and from M the byte. Whoever knows neither r nor k sees two points that, as far as anyone knows, cannot be told from random points.',
      `Compared with a real scheme there are two simplifications, both on purpose. The private key has at most ${KEY_BITS} bits instead of 256: this is the restriction of the assignment, which section 4 exploits. And every byte is encrypted on its own, with its own nonce: it costs 66 bytes of ciphertext for every byte of message, but makes the comparison with the Caesar cipher, which works one letter at a time, direct.`,
    ],
    formulasTitle: 'The scheme in three steps',
    formulas: [
      `Key generation      k drawn at random in [1, 2^${KEY_BITS} - 1]; K = kG`,
      'Encrypting byte b   M = bG; a fresh r in [1, n - 1];',
      '                    C1 = rG, S = rK, C2 = M + S',
      'Decryption          S = kC1 (= rK); M = C2 - S; b such that bG = M',
    ].join('\n'),
    stale: 'Values of the last valid input: the fields in 1.1 contain an error.',
  },
  input: {
    intro: 'The starting private key was drawn once and for all with a cryptographic generator; the message is the sentence in which Suetonius describes the Caesar cipher (Life of Julius Caesar, 56, in J. C. Rolfe’s English translation of 1914). Whoever opens the page sees the same values, and node homework2a.js prints the same numbers. Key and message can be changed, and every section follows, attacks included.',
    keyLabel: `Private key k (from 1 to ${EN.big(KEY_MAX)})`,
    keyHint: `An integer of at most ${KEY_BITS} bits, in decimal digits. With a small key, for example 1000, even the exhaustive search of section 4.1 finds it.`,
    randomKey: 'Random key',
    keyError: {
      empty: 'Type a key.',
      notInteger: (t) => `"${t}" is not an integer written in decimal digits.`,
      range: `The key goes from 1 to ${EN.big(KEY_MAX)} = 2^${KEY_BITS} - 1.`,
    },
    messageLabel: `Message (at most ${MESSAGE_MAX_BYTES} bytes of UTF-8)`,
    messageHint: (bytes) => `${bytes} of ${MESSAGE_MAX_BYTES} bytes: every byte becomes a block of the ciphertext. Accented letters take two bytes.`,
    messageError: {
      empty: 'Type a message.',
      tooLong: (bytes) => `The message takes ${bytes} bytes in UTF-8: at most ${MESSAGE_MAX_BYTES}.`,
    },
    noncesLabel: 'Nonces',
    nonces: { seeded: 'Reproducible', random: 'Random' },
    reroll: 'New random nonces',
    noncesHint: 'The reproducible nonces come from SHA-256 of a fixed seed, so that the page and the terminal show the same ciphertext; for the same reason anyone can recompute them, which is one of the weaknesses of section 4.7. The random nonces come from the browser’s cryptographic generator: the ciphertext changes with every draw, the decrypted message does not.',
    defaultBadge: (pk) => `Starting values: the key drawn for this homework, the sentence of Suetonius and the reproducible nonces. Expected public key, also computed with the ethers 6.13.5 library: ${pk}.`,
    customBadge: 'Values different from the starting ones.',
    restore: 'Restore the starting values',
    stale: 'While a field contains an error, the sections that depend on it keep its last valid value.',
  },
  keys: {
    intro: [
      'The private key k is an integer; the public key is the point K = kG, computed with the scalar multiplication of Exercise 1 of Homework #1, here on the 256-bit numbers of secp256k1. Computing K from k costs at most 64 point additions with a precomputed table of multiples of G; going back from K to k is the discrete logarithm problem.',
      `On secp256k1, with k chosen between 1 and n - 1, the best known attack takes about 2^128 operations. With a ${KEY_BITS}-bit k, as here, about 2^17 are enough (section 4): the curve is the same, only the set in which k must be searched changes.`,
    ],
    kLabel: 'Private key k (decimal)',
    hexLabel: 'k in hexadecimal',
    binaryLabel: (bits) => `k in binary: ${bits} significant bits of ${KEY_BITS}`,
    xLabel: 'Abscissa x of K',
    yLabel: 'Ordinate y of K',
    compressedLabel: (even) => `K in compressed form (SEC 1): ${even ? '02, y even' : '03, y odd'}, then x`,
    onCurve: (ok) => (ok ? 'K satisfies y² = x³ + 7 (mod p): it is a point of the curve. ✓' : 'K is not a point of the curve. ✗'),
    reference: (ok) => (ok ? 'It matches the public key computed with ethers 6.13.5. ✓' : 'It does not match the public key computed with ethers 6.13.5. ✗'),
    after: [
      `The public key does not betray its origin: the x and y of K look like random 256-bit numbers even when k has only ${KEY_BITS} bits, and the test of section 2.3 cannot tell the public keys of small private keys from those of 256-bit private keys. The flaw of the toy scheme is not statistical but algebraic: K = kG with a small k.`,
    ],
  },
  encrypt: {
    intro: [
      'The message becomes a sequence of bytes (UTF-8), and every byte b becomes the point M = bG: byte 0 is the point at infinity, byte 255 is 255G. For every byte a nonce r is drawn, an integer between 1 and n - 1, and C1 = rG and the shared point S = rK are computed; the ciphertext of the byte is the pair (C1, C2 = M + S), 66 bytes in compressed form.',
      'The nonce is used once and forgotten: whoever knew it would compute S = rK from K, which is public, and decrypt the block. C1 = rG carries it without revealing it, because recovering r from C1 is again a discrete logarithm, and with a 256-bit r a hard one.',
    ],
    tableTitle: 'The blocks of the ciphertext',
    cols: { position: '#', byte: 'Byte', r: 'Nonce r', C1: 'C1 = rG', C2: 'C2 = bG + rK' },
    size: ({ bytes, total }) => `${EN.int(bytes)} bytes of message, ${EN.int(bytes)} blocks, ${EN.int(total)} bytes of ciphertext.`,
    after: [
      'The same byte encrypted twice gives two different blocks, because the nonce changes: all the "e"s of the message have a different ciphertext. This is probabilistic encryption (Goldwasser and Micali, 1984), the property the Caesar cipher lacks and section 2.3 measures.',
    ],
  },
  decrypt: {
    intro: [
      'The receiver knows k and nothing else. For every block it computes S = kC1, which equals rK because kC1 = k(rG) = r(kG) = rK; it subtracts S from C2 and gets M = bG. What is left is to find b, again a discrete logarithm, but an easy one: b has only 256 values, and a table of the points 0G, ..., 255G, built once, gives it with a lookup.',
      `With a ${KEY_BITS}-bit k, kC1 costs about thirty doublings and fifteen additions: the small key makes decryption fast too. It is its only advantage, and security pays for it.`,
    ],
    firstTitle: 'The first block, step by step',
    labels: {
      C1: 'C1, received',
      C2: 'C2, received',
      S: 'S = kC1',
      M: 'M = C2 - S',
    },
    decoded: (b, c) => (b < 0 ? 'M is not bG for any byte: the block does not decrypt. ✗' : `M = ${b}G: byte ${b}, "${c}". ✓`),
    sameS: (ok) => (ok ? 'kC1 equals the point rK computed by the sender. ✓' : 'kC1 does not equal rK. ✗'),
    resultLabel: 'The decrypted message',
    check: (ok) => (ok ? 'The decrypted message matches the original. ✓' : 'The decrypted message does not match the original. ✗'),
  },
  roles: {
    intro: 'Every value of the scheme has an owner and a purpose, and each, if it leaks, does a different kind of damage.',
    cols: { value: 'Value', who: 'Who knows it', purpose: 'What it is for', leak: 'If it leaks' },
    rows: [
      {
        value: 'k, private key',
        who: 'The receiver only.',
        purpose: 'Decrypting: S = kC1.',
        leak: 'Anyone decrypts every message, past and future, encrypted with K.',
      },
      {
        value: 'K = kG, public key',
        who: 'Everyone.',
        purpose: 'Encrypting: S = rK. Anyone can write to the receiver.',
        leak: 'It is public by design: it protects k as long as the discrete logarithm is hard, and with a small k it is not.',
      },
      {
        value: 'r, nonce',
        who: 'The sender only, for the time of one block.',
        purpose: 'Making encryption probabilistic; C1 = rG carries it without revealing it.',
        leak: 'Whoever knows r computes S = rK and decrypts that block. A reused or predictable nonce breaks the scheme even with a safe k (section 4.7).',
      },
      {
        value: 'S = rK = kC1, shared secret',
        who: 'Sender and receiver.',
        purpose: 'The mask that hides M: C2 = M + S. It is an elliptic-curve Diffie-Hellman exchange.',
        leak: 'It decrypts that block, and only that one.',
      },
      {
        value: 'M = bG, encoding',
        who: 'It is not a secret.',
        purpose: 'Bringing the byte into the group of points, where S can be added.',
        leak: 'Nothing: the table of the 256 points is public.',
      },
      {
        value: 'p, n, G, curve parameters',
        who: 'Everyone.',
        purpose: 'Fixing the group in which everything is computed.',
        leak: 'Nothing: they are public by design.',
      },
    ],
    after: 'The difference from the Caesar cipher is already here. Caesar has a single key, which encrypts and decrypts and must stay secret for both; the curve scheme has two, and the one that encrypts can be published. The price of the asymmetry is a hard problem to rest on: the discrete logarithm, which the 32-bit restriction makes easy.',
  },
  verify: {
    intro: 'Everything is written from scratch, with no libraries. Before trusting the numbers, the page compares them with known values: the test vectors of SHA-256 (FIPS 180-4), some multiples of G computed with ethers 6.13.5 (each computed both with the precomputed table and by doublings and additions), nG = O, which says that G has order n, and the round trip of both ciphers on the starting message.',
    summary: (ok, n) => `${ok} of ${n} checks passed.`,
    details: (n) => `The ${n} checks`,
    groups: { sha256: 'SHA-256 (FIPS 180-4)', curve: 'secp256k1', scheme: 'Toy scheme', caesar: 'Caesar cipher' },
    cols: { check: 'Check', expected: 'Expected value', result: 'Result' },
    ok: 'passed',
    failed: 'failed',
  },
  caesar: {
    intro: [
      'The second part of the assignment: the same message with the Caesar cipher, and the comparison between the two schemes.',
    ],
  },
  caesarCipher: {
    intro: [
      `The Caesar cipher moves every letter s places forward in the alphabet, starting again from A after Z: with s = ${DEFAULT_SHIFT}, the shift Suetonius attributes to Caesar, A becomes D, B becomes E, ..., Z becomes C. Decrypting means moving back by the same s places. In formulas, with the letters numbered from 0 (A) to 25 (Z): c = (p + s) mod 26 and p = (c - s) mod 26.`,
      'Here upper and lower case are kept, and anything that is not a letter from A to Z (spaces, punctuation, digits, accented letters) stays as it is, as in most textbook implementations.',
    ],
    shiftLabel: 'Shift s (from 0 to 25)',
    shiftHint: 'With s = 0 the text stays in the clear; s and 26 - s undo each other.',
    shiftError: {
      empty: 'Type a shift.',
      notInteger: (t) => `"${t}" is not an integer written in digits.`,
      range: 'The shift goes from 0 to 25.',
    },
    tableTitle: 'The substitution table',
    plainRow: 'Plain',
    cipherRow: 'Cipher',
    cipherLabel: 'The encrypted message',
    decryptedLabel: 'The decrypted message',
    check: (ok) => (ok ? 'The decrypted message matches the original. ✓' : 'The decrypted message does not match the original. ✗'),
    top: (f) =>
      f.top
        ? `The ciphertext has the same length, the same spaces and the same punctuation as the message, and every letter is always replaced by the same one: "${f.top.letter}", the most frequent letter of the message (${f.top.count} times out of ${f.letters}), always becomes "${f.top.image}".`
        : 'The message contains no letters from A to Z: the Caesar cipher leaves it as it is.',
    stale: 'Values of the last valid shift: the field contains an error.',
  },
  compare: {
    intro: 'The table compares the two schemes and, for reference, what is really used to encrypt with an elliptic-curve key.',
    cols: ['', 'Caesar cipher', 'Toy scheme (EC-ElGamal, 32-bit k)', 'Properly configured ECC (ECIES)'],
    rows: (size) => [
      ['Kind', 'Symmetric: the same key encrypts and decrypts.', 'Asymmetric: K encrypts, k decrypts.', 'Asymmetric for the key, symmetric for the message (hybrid encryption).'],
      ['Group', 'The integers modulo 26, with addition.', 'The points of secp256k1, with point addition; order n ≈ 2^256.', 'The same.'],
      ['Encryption', 'c = p + s (mod 26), letter by letter, deterministic.', 'C1 = rG, C2 = bG + rK, byte by byte, with a fresh nonce for every byte.', 'An ephemeral point rG, the secret rK passed through a key derivation function, and an authenticated cipher (AES-GCM, ChaCha20-Poly1305) over the whole message.'],
      ['Decryption', 'p = c - s (mod 26).', 'S = kC1, M = C2 - S, then the table of the 256 points.', 'S = k·rG, the same derivation, and the check of the tag before decrypting.'],
      ['Key space', '26 shifts, one of which (0) does not encrypt: log2 26 ≈ 4.7 bits.', `2^${KEY_BITS} - 1 private keys: ${KEY_BITS} bits, but about 16 bits of security against baby-step giant-step and the kangaroo.`, 'n - 1 ≈ 2^256 keys: about 128 bits of security.'],
      ['Ciphertext length', 'The same as the message.', `66 bytes per byte of message: here ${EN.int(size.bytes)} bytes become ${EN.int(size.total)}.`, 'The message plus 33 bytes (the ephemeral point) and 16 of tag.'],
      ['The same letter twice', 'Always gives the same letter.', 'Gives two different blocks.', 'Gives different ciphertexts.'],
      ['What leaks', 'Letter frequencies, word lengths, spaces, punctuation, repeated letters.', 'The exact length in bytes.', 'The length of the message.'],
      ['Integrity', 'None.', 'None: the ciphertext is malleable (section 4.7).', 'The tag rejects every modified ciphertext.'],
      ['Best attack', 'Statistical, from the ciphertext alone: a few letters are enough (section 3).', 'Algebraic, from the public key alone: about 2^17 operations (section 4).', 'Algebraic: about 2^128 operations, out of reach.'],
    ],
    after: [
      'The similarities are structural. Both encrypt by adding an element of a group to the plaintext and decrypt by subtracting it: Caesar adds s in the group of the integers modulo 26, the curve scheme adds S = rK in the group of points. Both work one symbol at a time, and in both the key lies in a set that can be listed: 26 elements in one case, about 4.3 billion in the other. In both, decrypting with the wrong key gives nonsense, and the attacker needs a way to recognize the right one.',
      'The differences lie in three places. The key: Caesar has a single secret key that encrypts and decrypts; the curve scheme separates who can encrypt (anyone, with K) from who can decrypt (only the holder of k), and it is this asymmetry that requires a hard problem such as the discrete logarithm. The translation: Caesar always uses the same one, s, while the curve scheme uses a new one for every byte, S = rK with a random r; it is the difference between a substitution cipher and a one-time pad in the group of points, and section 4.7 shows that reusing r is enough to fall back to a Caesar cipher on bytes. And the key space: 26 against 2^32, and above all against 2^256 in a real scheme.',
    ],
  },
  properties: {
    intro: [
      'The assignment asks to compare the statistical properties too. The Caesar cipher is a fixed permutation of the alphabet: the letter frequencies of the ciphertext are those of the plaintext, rotated by s places. The curve scheme is probabilistic: the ciphertext of every byte is a pair of points that, statistically, does not depend on the byte.',
    ],
    lettersChart: 'The letters of the message: counts (bars) and expected counts from the frequencies of the corpus of section 3 (dashed)',
    cipherChart: (shift) => `The letters of the Caesar ciphertext (bars), with the same expected counts (dashed): the same profile, shifted by ${shift} ${shift === 1 ? 'place' : 'places'}`,
    sampleIntro: (s) => `A short message is too little for tests. For those, the first ${EN.int(s.ciphers.bytes)} bytes of the test chapters of the corpus (section 3.1), ${EN.int(s.ciphers.plain.letters)} letters, are encrypted with both schemes: with Caesar (s = ${s.ciphers.shift}) and with the toy scheme, with the starting key and reproducible nonces from a seed other than that of section 1.`,
    bytesChart: (s) => `The bytes of the abscissas x(C1) and x(C2) of the curve ciphertext: ${EN.int(s.ciphers.ec.counts.reduce((a, b) => a + b, 0))} bytes, counts (bars) and uniform expectation (dashed)`,
    tableTitle: 'Entropy and index of coincidence',
    cols: { text: 'Text', symbols: 'Symbols', entropy: 'Entropy (bits per symbol)', ic: 'Index of coincidence' },
    rowNames: { plain: 'Plaintext (letters)', caesar: 'Caesar ciphertext (letters)', ec: 'Curve ciphertext (bytes of x(C1) and x(C2))' },
    entropyCell: (v, max) => `${EN.num(v, 3)} of ${EN.num(max, 3)}`,
    icCell: (v, uniform) => `${EN.num(v, 5)} (uniform: ${EN.num(uniform, 5)})`,
    repeated: (s) => {
      const r = s.ciphers.repeated;
      const letter = 'abcdefghijklmnopqrstuvwxyz'[r.letter];
      return `The letter "${letter}" occurs ${r.occurrences} times in the text: the Caesar cipher turns it ${r.occurrences} times into the same letter (${r.caesarDistinct} distinct ${r.caesarDistinct === 1 ? 'ciphertext' : 'ciphertexts'}), the curve scheme into ${r.ecDistinct} blocks, all different.`;
    },
    explain: (s) => [
      `The entropies and the indices of coincidence of the plaintext and of the Caesar ciphertext are identical, not about equal: a permutation of the symbols does not change the distribution, it renames its values. This is why the index of coincidence (Friedman, 1922) tells that a text is encrypted with a single substitution, but not which one: the key is found by comparing the frequencies with those of the language (section 3). The tests confirm it: the letters of the ciphertext are anything but uniform, and the ciphertext letter depends entirely on the plaintext letter (Cramér's V = ${EN.num(s.ciphers.caesar.dependence.cramerV, 3)}).`,
      `The curve ciphertext has an entropy of ${EN.num(s.ciphers.ec.entropy, 4)} bits per byte out of 8 and an index of coincidence of ${EN.num(s.ciphers.ec.ic, 5)}, against 1/256 ≈ ${EN.num(1 / 256, 5)} for uniform bytes: the frequencies of the plaintext are gone, and the tests find neither a departure from uniformity nor a dependence on the encrypted byte. It is not luck: under the decisional Diffie-Hellman assumption (DDH) on secp256k1, (rG, M + rK) cannot be told from a pair of random points whatever M is (Tsiounis and Yung, 1998). The tests cannot prove it; they can only fail to refute it.`,
      'Two caveats. The curve ciphertext is not uniform in every byte: the first byte of a compressed point is 02 or 03, the parity of y, which is why the tests use the abscissas and check the parity separately. And the indistinguishability holds against whoever does not know k: with a 32-bit k, anyone who computes it (section 4) makes the ciphertext transparent. The statistics of the ciphertext are perfect and the security is nil: the security of a public-key scheme cannot be seen in its ciphertexts.',
    ],
  },
  cryptanalysis: {
    intro: [
      'The second part: recovering the key of the Caesar cipher from the ciphertext alone, with the statistics of a corpus in a known language.',
    ],
  },
  corpus: {
    intro: [
      'The corpus is Lewis Carroll’s Alice’s Adventures in Wonderland (1865), in the public domain, in the Project Gutenberg transcription (eBook #11): 12 chapters in English. To measure the attack on text it has never seen, the chapters have three roles, as in a statistical learning experiment: chapters I-VII estimate the models, VIII-IX choose the amount of smoothing (validation), and the attack is measured on X-XII (test), never used before. The final models use all of chapters I-IX.',
    ],
    chaptersTitle: 'The chapters and their role',
    cols: { number: 'Ch.', title: 'Title', letters: 'Letters', role: 'Role' },
    roles: { fit: 'estimation', validation: 'validation', test: 'test' },
    chart: (s) => `Letter frequencies: training chapters (${chapterRange(SPLIT.training)}, ${EN.int(s.corpus.training.letters)} letters, bars) and test chapters (${chapterRange(SPLIT.test)}, ${EN.int(s.corpus.test.letters)} letters, dashed)`,
    facts: (s) => [
      `In the training chapters the most frequent letter is "${'abcdefghijklmnopqrstuvwxyz'[s.models.top]}" (${EN.pct(s.models.q[s.models.top])}), the entropy of the letters is ${EN.num(s.corpus.training.entropy, 3)} bits out of a maximum of log2 26 ≈ ${EN.num(Math.log2(26), 3)}, and the index of coincidence is ${EN.num(s.corpus.training.ic, 4)}, against 1/26 ≈ ${EN.num(1 / 26, 4)} for uniform letters: the distance between the two is the redundancy the attack exploits.`,
      `The χ² test rejects homogeneity between training and test: chapters ${chapterRange(SPLIT.test)}, with more dialogue and new characters (the King, the Queen, the trial), have significantly different frequencies (p = ${EN.pval(s.corpus.homogeneity.pValue)}). But the difference is small: the total variation distance between the two distributions is ${EN.pct(s.corpus.tvd)}, and Cramér's V ${EN.num(s.corpus.homogeneity.cramerV, 3)}. With a hundred thousand letters even a tiny difference becomes significant: statistical significance and practical relevance are two different things, and what matters to the attack is the second. A corpus is not the language, it is a sample with its own style; whether the models hold on chapters other than those they were estimated on is exactly what section 3.3 measures.`,
    ],
    modelsIntro: [
      'Besides the frequencies of single letters, the attack can use sequences: an n-gram model estimates the probability of every letter given the n - 1 before it, that is, a Markov chain of order n - 1. Raw counts are not enough: with eighty thousand letters many of the 456,976 possible quadgrams never occur, and a model giving them probability zero would discard even the right text at its first unusual sequence.',
      'The probabilities are therefore smoothed toward the model of lower order: a context seen often counts for its own counts, one seen rarely borrows from the shorter context, and one never seen falls back on it. It is the posterior mean under a Dirichlet prior centred on the lower order and worth β observations. Additive smoothing, more common, would give an unseen context the uniform distribution: the very unusual contexts that a wrong decryption produces would receive generous probabilities, and the quadgrams would lose much of their advantage. β is chosen on the validation chapters, by minimizing the cross-entropy.',
    ],
    formula: [
      'P_n(x | h) = ( c(h x) + β · P_(n-1)(x | h′) ) / ( c(h) + β )',
      'h = the n - 1 letters before; h′ = h without the oldest; P_0(x) = 1/26',
      'cross-entropy  H = -(1/N) Σ log2 P(x_t | context)   [bits per letter]',
    ].join('\n'),
    modelsTitle: 'The models, measured on the test chapters',
    modelCols: { order: 'Order', beta: 'Chosen β', crossEntropy: 'Cross-entropy (bits/letter)', redundancy: 'Redundancy D (bits/letter)', unicity: 'Unicity distance (letters)' },
    orderName: (n) => ['single letters', 'bigrams', 'trigrams', 'quadgrams'][n - 1],
    after: (s) => [
      `The cross-entropy falls from ${EN.num(s.models.crossEntropy[0], 2)} bits per letter with the frequencies alone to ${EN.num(s.models.crossEntropy[3], 2)} with quadgrams: more context, less uncertainty about each letter. Shannon (1951) estimated for English, with long contexts, between 0.6 and 1.3 bits per letter; the difference is the part of the language that four letters cannot see. For single letters the choice of β makes no difference (the validation entropies differ in the sixth digit), because every letter occurs thousands of times.`,
      `The redundancy D = log2 26 - H is what makes the attack possible. Shannon’s unicity distance (1949), U = H(K)/D = log2 26 / D, estimates how many ciphertext letters are needed for a single key to give a plausible text: about ${EN.num(s.models.unicity[0], 1)} with the frequencies alone, about ${EN.num(s.models.unicity[3], 1)} with quadgrams. Section 3.4 shows that the lengths at which the attack becomes reliable have just this order of magnitude.`,
    ],
  },
  algorithm: {
    intro: [
      'The algorithm: for each of the 26 shifts s, decrypt and measure how much the result looks like English; pick the most plausible shift. The natural criterion is the likelihood. If the letters of the plaintext were independent with the frequencies q of the corpus, the probability of observing the ciphertext under the key s would be the product of the q of the decrypted letters; the shift that maximizes it is the maximum-likelihood estimator of the key, and with a uniform prior on the key also the Bayes estimator that, under that model, minimizes the probability of error.',
      'In practice the 26 counts n_x of the ciphertext are enough: decrypting with s turns the cipher letter x + s into x, and the log-likelihood is a sum of 26 terms, 26 × 26 operations whatever the length of the text.',
    ],
    formula: [
      'ŝ = argmax_s  Σ_i log q(c_i - s)  =  argmax_s  Σ_x n_(x+s) · log q(x)',
      'P(s | ciphertext) = exp(ℓ(s)) / Σ_t exp(ℓ(t))     (uniform prior on the key)',
    ].join('\n'),
    liveTitle: 'The attack on the Caesar ciphertext of the message',
    live: (crack, shift) =>
      crack.key === null
        ? 'The ciphertext contains no letters, or several shifts tie: the likelihood does not choose.'
        : `Over ${crack.letters} letters, the most likely shift is s = ${crack.key}, with posterior probability ${EN.prob(crack.posterior[crack.key])}${crack.key === shift ? ': it is the one used in 2.1. ✓' : `, but s = ${shift} was used in 2.1: with so few letters the attack fails. ✗`}`,
    posteriorChart: 'Posterior probability of the 26 shifts, with the most probable one highlighted',
    candidatesTitle: 'The five most probable shifts',
    candidateCols: { shift: 's', perLetter: 'Log-likelihood per letter', posterior: 'Posterior probability', text: 'Decryption' },
    fit: (checks) =>
      checks === null
        ? []
        : [
          `Check: do the letters decrypted with s = ${checks.best.shift} follow the frequencies of English? The χ² goodness of fit gives p = ${EN.pval(checks.best.test.pValue)}: ${checks.best.test.verdict === 'reject' ? 'rejected, the text is unusual for English' : 'not rejected, the text is compatible with English'}.${checks.second ? ` With the second most probable shift, s = ${checks.second.shift}, p = ${EN.pval(checks.second.test.pValue)}: ${checks.second.test.verdict === 'reject' ? 'rejected' : 'not rejected'}.` : ''}`,
        ],
    pending: 'The attack uses the models of section 3.1, still being computed.',
    after: [
      'Pearson’s χ², often used for the same purpose, minimizes Σ (n_x(s) - L q_x)² / (L q_x): it measures the same distance between observed and expected frequencies, but weighs rare letters heavily (an unexpected "z" sends the χ² up), and on short texts it fails more often than the likelihood (section 3.4).',
      'The weakness of the Caesar cipher is not just the number of keys: it is that the substitution preserves the statistics of the text. Every letter of the ciphertext carries a little information about the key, and the likelihood adds it up.',
    ],
  },
  lengths: {
    intro: (s) => [
      `To measure its effectiveness, the algorithm was tried on the test chapters, which it has never seen: for every length L from ${LENGTHS[0]} to ${LENGTHS[LENGTHS.length - 1]} letters, up to ${EN.int(SAMPLES.maxTrials)} disjoint passages of L consecutive letters, each encrypted with a random shift (seed ${EXPLORE_SEED}). A trial counts 1 if the key found is right, 1/t if it is among t keys tied for best (the probability of guessing it by drawing among them), 0 otherwise. With long passages there are fewer disjoint ones (${s.caesar.trials[s.caesar.trials.length - 1]} of ${LENGTHS[LENGTHS.length - 1]} letters), and the 95% confidence intervals, Wilson’s, are wider.`,
    ],
    chart: 'Maximum likelihood on the letter frequencies: success rate by ciphertext length (logarithmic axis)',
    legend: ['Success rate, with the 95% confidence interval', 'Chernoff’s lower bound for independent letters'],
    tableTitle: 'Success rate by length',
    cols: { length: 'Letters', trials: 'Passages', rate: 'Success', interval: '95% interval', bound: 'Chernoff bound' },
    explain: (s) => {
      const r = (L) => EN.pct(rateAt(s, 'unigram', L));
      const q = s.models.q[s.models.top];
      return [
        `With a single letter the algorithm is right in ${r(1)} of the cases: it picks the shift that turns that letter into "${'abcdefghijklmnopqrstuvwxyz'[s.models.top]}", and it is right when the letter was just that one (${EN.pct(q)} of the letters of the corpus). With 10 letters it is right in ${r(10)} of the cases, with 20 in ${r(20)}, with 50 in ${r(50)}.`,
        `The shape of the curve has a theoretical explanation. If the letters were independent with frequencies q, the right shift would lose against a wrong shift d with probability at most ρ_d^L, where ρ_d = min_λ Σ_x q(x)^(1-λ) q(x-d)^λ (Chernoff bound), and the total error would be at most Σ_d ρ_d^L. The shift most easily confused with the right one is d = ${s.caesar.confusable.shift} (or ${26 - s.caesar.confusable.shift}, its opposite), with ρ = ${EN.num(s.caesar.confusable.rho, 3)}: every extra letter multiplies the dominant term of the error by ${EN.num(s.caesar.confusable.rho, 3)}, that is, it brings ${EN.num(-Math.log2(s.caesar.confusable.rho), 2)} bits of evidence in favour of the right key. The bound is cautious, because it adds up 25 overlapping events, and it becomes informative only beyond about ten letters, but it says the important thing: the error decreases exponentially with the length.`,
        s.caesar.rates.unigram.every((r, i) => r >= s.caesar.bound[i])
          ? 'Real text is not made of independent letters: words repeat sequences, and two passages of the same chapter resemble each other. Yet the measured curve lies above the bound at every length: the dependence between neighbouring letters does not harm an attack that ignores it, and the n-grams of section 3.4 exploit it.'
          : 'Real text is not made of independent letters, and the bound holds for a model: at some lengths the measured curve falls below the bound, a sign that the dependence between neighbouring letters, or the difference between chapters, weighs in. The n-grams of section 3.4 exploit it instead of suffering it.',
      ];
    },
  },
  methods: {
    intro: [
      'The assignment suggests comparing exhaustive key search, letter-frequency analysis and n-gram scoring. With 26 keys, every method tries them all: what changes is the criterion by which it recognizes the right one, and so how much information about the language it uses.',
    ],
    list: [
      { method: 'top', text: 'assumes that the most frequent letter of the ciphertext is "e". It uses a single number from the corpus.' },
      { method: 'chi2', text: 'the distance between the frequencies of the decrypted letters and those of the corpus.' },
      { method: 'unigram', text: 'the frequencies of the corpus as a model: the algorithm of section 3.2.' },
      { method: 'bigram', text: 'the likelihood under the bigram model of section 3.1, which also sees the order of two letters.' },
      { method: 'quadgram', text: 'the likelihood under the quadgram model: every letter given the three before it.' },
      { method: 'dictionary', text: 'decrypts with every key and counts the letters of the words that occur in the training chapters. It is exhaustive search as a person would do it, reading the 26 decryptions and picking the one with real words.' },
    ],
    chart: 'Success rate of the six methods by ciphertext length (logarithmic axis)',
    tableTitle: 'Letters needed to reach 50%, 90% and 99% success',
    cols: { method: 'Method', levels: ['50%', '90%', '99%'] },
    never: 'over 200',
    explain: (s) => {
      const t = Object.fromEntries(thresholds(s).map((row) => [row.method, row.levels]));
      const L = (m, i) => (t[m][i] === null ? 'over 200' : String(t[m][i]));
      const r = (m, n) => EN.pct(rateAt(s, m, n));
      return [
        `The order of the methods is that of the information they use. The χ² and maximum likelihood use the same information, the frequencies, but the likelihood uses it better: it is the optimal criterion under the model, and at 10 letters it wins ${r('unigram', 10)} against ${r('chi2', 10)}. The quadgrams, which also use the order of the letters, reach 90% with ${L('quadgram', 1)} letters and 99% with ${L('quadgram', 2)}; the frequencies alone need ${L('unigram', 1)} and ${L('unigram', 2)}. The unicity distance of section 3.1 predicted this order of magnitude: about ${EN.num(s.models.unicity[0], 0)} letters with the frequencies alone, about ${EN.num(s.models.unicity[3], 1)} with quadgrams.`,
        `Exhaustive search with a dictionary (${EN.int(s.corpus.vocabulary)} distinct words) lies in between: it needs whole words, and a short passage cuts the words at its edges (at 5 letters it scores ${r('dictionary', 5)}, against ${r('quadgram', 5)} for the quadgrams). And it is put out of action by removing the spaces, as classical cryptographers did by writing ciphertext in groups of five letters, while the n-grams do not notice, because they read only the letters.`,
        `The most frequent letter is the worst method: even at 200 letters it is right in only ${r('top', 200)} of the cases, because in a short passage "e" is not always the most frequent letter. It is the method taught first, but it ignores 25 of the 26 frequencies.`,
        'Cost does not separate the methods: they all try 26 keys. The frequencies take 26 × 26 operations whatever the length, the n-grams 26 per letter, the dictionary 26 lookups per word. Against a cipher with 26 keys cost never matters: only recognizing the right key does.',
      ];
    },
  },
  limits: {
    paras: [
      'Short texts. Below 5 letters no method is reliable, and with one or two letters the problem has no unique solution: many keys give plausible decryptions. This is the idea of the unicity distance: below that length the cipher cannot be broken, not because it is strong but because the message itself is ambiguous.',
      'The language. The model must be the text’s: a message in Italian attacked with English frequencies often falls anyway, because the two languages share many frequent letters, but more letters are needed; a text of digits, acronyms or random passwords has no redundancy to exploit, and no statistical method breaks it. The same holds for an atypical text: Ernest Vincent Wright’s Gadsby (1939), a novel written without the letter "e", fools the most-frequent-letter method and weakens the others.',
      'The model. The independence of letters is false (the Chernoff bound holds for a text that does not exist) and a corpus by a single author is not the language (section 3.1). The n-grams correct the first approximation, a larger and more varied corpus the second; both corrections save letters, neither changes the conclusion.',
      'The real limit lies elsewhere: the attack works because the Caesar cipher is a fixed substitution. Even the general monoalphabetic substitution, with 26! ≈ 4·10^26 ≈ 2^88 keys, more than DES’s 2^56, falls the same way, with a little more text and a smarter search: a large key space is necessary but not sufficient. The ciphertext must not preserve the statistics of the plaintext, and that is what the curve scheme guarantees (section 2.3).',
    ],
  },
  attack: {
    intro: [
      `The toy scheme is as safe as recovering k from K = kG is hard. With k restricted to ${KEY_BITS} bits, the problem becomes the discrete logarithm in a known interval, [1, 2^${KEY_BITS}): the attacker needs neither the message nor statistics, only the public key, which is public by definition. The subsections attack the key of section 1 with three algorithms, measure how the cost grows with the size of the key and discuss what changes against a real key.`,
      'The cost is measured in group operations, additions or doublings of points: a number that does not depend on the computer. The times, instead, are those of this browser.',
    ],
  },
  exhaustive: {
    intro: [
      `The simplest attack: compute G, 2G, 3G, ..., one point addition at a time, until K comes out. The first k with kG = K is the key, and there are no false positives, unlike the statistical attack, because the check is exact. The cost is k additions, 2^${KEY_BITS - 1} on average for a uniform ${KEY_BITS}-bit key. The page tries the first 2^${Math.log2(EXHAUSTIVE_LIMIT)} = ${EN.int(EXHAUSTIVE_LIMIT)} candidates on the key of section 1, measures the speed and estimates the rest.`,
      'The implementation advances 256 candidates at a time: each receives the same addition, and a single modular inversion serves them all (Montgomery’s trick), but the candidates are checked in order, so the number of additions stays exactly k.',
    ],
    found: (r) => `The key is among the first ${EN.int(r.limit)} candidates: k = ${EN.int(r.key)}, found after ${EN.int(r.ops)} additions, in ${EN.ms(r.ms)}. ✓`,
    notFound: (r, key) => `The first ${EN.int(r.limit)} candidates in ${EN.ms(r.ms)}: ${EN.int(r.rate)} additions per second. The key is not among them. Reaching k = ${EN.big(key)} would take ${EN.big(key)} additions, about ${EN.duration(r.toKey)} at this speed, and ${EN.duration(r.toAll)} to cover the whole range.`,
    after: [
      'Hours in JavaScript, in a browser, on a single core. An optimized implementation in C, or on a graphics card, is faster by orders of magnitude, and covers 2^32 candidates in seconds: exhaustive search alone is enough to break the toy scheme. This is what really happened with Profanity and with Milk Sad (section 6), where the private keys came from a 32-bit seed.',
    ],
  },
  bsgs: {
    intro: [
      `Baby-step giant-step (Shanks, 1971) trades time for memory. Every k in [1, 2^${KEY_BITS}) can be written k = i·m + j with m = 2^${KEY_BITS / 2} and 0 ≤ i, j ≤ m. The baby steps compute jG for j = 1, ..., m and put them in a table indexed by x; the giant steps compute K, K - mG, K - 2mG, ... until K - i·mG is in the table, that is, it equals jG, or -jG, which has the same x: then k = i·m + j, or k = i·m - j. At most m + 2^32/m ≈ 2^17 operations instead of 2^32, but m points must be kept in memory.`,
    ],
    formula: [
      'baby steps    table x(jG) → j,  for j = 1, ..., m        (m = 2^16)',
      'giant steps   Q_i = K - i·mG,  for i = 0, 1, 2, ...',
      'meeting       x(Q_i) = x(jG)  ⇒  k = i·m + j  (or i·m - j)',
    ].join('\n'),
    result: (r) => (r.found
      ? `k = ${EN.int(r.key)} = ${EN.int(r.i)} · ${EN.int(r.m)} + ${EN.int(r.j)}: found with ${EN.int(r.ops)} operations (${EN.int(r.baby)} baby steps and ${EN.int(r.giant)} giant ones), in ${EN.ms(r.ms)}. ✓`
      : 'The key is not in the range. ✗'),
    decryptedLabel: 'The message of section 1, decrypted with the recovered key',
    check: (ok) => (ok ? 'It matches the original message: the attacker reads everything without ever having seen k. ✓' : 'It does not match the message. ✗'),
    after: [
      'The table of baby steps does not depend on the key under attack: built once, it serves every key of the same range, and every new key costs on average only 2^15 giant steps. Against many users with small keys the attack becomes cheaper, not more expensive.',
    ],
  },
  kangaroo: {
    intro: [
      `The kangaroo method (Pollard, 1978) achieves the same cost, about 2·2^${KEY_BITS / 2} = 2^${KEY_BITS / 2 + 1} operations, with negligible memory. Two herds of kangaroos jump along the group: the jumps are worth 2^j·G, and j depends on the point where the kangaroo stands, so two kangaroos that pass through the same point make the same jumps from there on. The "tame" kangaroos start from known multiples of G in the middle of the interval, the "wild" ones from K plus a known multiple. When a wild kangaroo lands on the tracks of a tame one the two paths merge, and this shows at the next distinguished point (a point whose x ends with d zero bits), which both visit and store with the distance travelled. From there: exponent of the tame one = k + exponent of the wild one, and k follows.`,
      'This is the parallel version of van Oorschot and Wiener (1999): N kangaroos, half per herd, with mean jump N·√w/4 for an interval of width w, the choice that minimizes the expected work, about 2√w jumps in all.',
    ],
    result: (r) => (r.found
      ? `k = ${EN.int(r.key)}: found with ${EN.int(r.ops)} jumps of ${r.N} kangaroos (about ${EN.int(r.expected)} expected), mean jump ${EN.int(r.meanJump)}, storing only ${EN.int(r.distinguished)} distinguished points, in ${EN.ms(r.ms)}. ✓`
      : 'The key was not found. ✗'),
    after: [
      'Compared with baby-step giant-step, the memory falls from 65,536 points to a few hundred, and the work splits among as many processors as there are kangaroos, with almost no communication: it is the method used in practice for discrete logarithms in an interval. The number of jumps varies from key to key: it is small when k is near the middle of the interval, where the tame kangaroos start, large when it is near the edges.',
    ],
  },
  scaling: {
    intro: (sc) => [
      `To see how the cost grows, the three attacks were tried on random keys of increasing size (seed ${sc.seed}): exhaustive search from ${sc.rows.exhaustive[0].bits} to ${sc.rows.exhaustive[sc.rows.exhaustive.length - 1].bits} bits, baby-step giant-step from ${sc.rows.bsgs[0].bits} to ${sc.rows.bsgs[sc.rows.bsgs.length - 1].bits}, the kangaroo from ${sc.rows.kangaroo[0].bits} to ${sc.rows.kangaroo[sc.rows.kangaroo.length - 1].bits}. The operations do not depend on the machine; the speed does, and this one does ${EN.int(sc.rate)} per second.`,
    ],
    chart: 'log2 of the mean operations by key size: measured (points) and the line with the theoretical exponent (dashed)',
    legend: ['Exhaustive search', 'Baby-step giant-step', 'Kangaroo'],
    fitsTitle: 'The estimated slopes',
    fitCols: { method: 'Attack', slope: 'Estimated slope', theory: 'Theory', constant: 'Constant (log2)' },
    extrapolationTitle: 'Extrapolation',
    extrapolationCols: { bits: 'Key bits', exhaustive: 'Exhaustive search', best: 'BSGS or kangaroo', here: 'Time here', fast: 'Time at 10^12 operations/s', memory: 'BSGS memory' },
    memory: (e) => `2^${e} points`,
    explain: (sc) => {
      const f = sc.fits;
      return [
        `The estimated slopes are ${EN.num(f.exhaustive.slope, 2)} ± ${EN.num(f.exhaustive.slopeError, 2)} for exhaustive search, ${EN.num(f.bsgs.slope, 3)} ± ${EN.num(f.bsgs.slopeError, 3)} for baby-step giant-step and ${EN.num(f.kangaroo.slope, 2)} ± ${EN.num(f.kangaroo.slopeError, 2)} for the kangaroo: compatible with 1 and with 1/2. Every extra bit of key doubles the work of exhaustive search and multiplies it by √2 in the other two. Exhaustive search is the noisiest because its cost is the key itself, uniform between 1 and 2^b.`,
        'The extrapolation keeps the exponent of the theory fixed and estimates only the constant from the data: extrapolating the estimated slope would be unwise, because an error of 0.02 in the slope would become a factor 2^5 at 256 bits. It is the difference between a model justified by theory and a line fitted to the data.',
        `At ${KEY_BITS} bits the best attack costs about 2^17 operations: less than a second. At 256 bits it would cost about 2^129, and even at 10^12 operations per second it would take about ${EN.duration(2 ** 129 / FAST_RATE)}, a billion times the age of the universe.`,
      ];
    },
  },
  differences: {
    intro: 'The assignment asks to compare this attack with the statistical one against the Caesar cipher. They differ in almost everything.',
    cols: ['', 'Statistical attack on Caesar', 'Attack on the toy scheme'],
    rows: [
      ['What it rebuilds', 'The message, and the key as a by-product.', 'The private key; the message follows.'],
      ['From what', 'From the ciphertext (a few letters) and a model of the language.', 'From the public key alone: the ciphertext is needed only afterwards, to read.'],
      ['What it exploits', 'The redundancy of the language, which the substitution preserves.', 'The algebraic structure K = kG and the small range of k.'],
      ['Nature', 'An estimation problem: which key makes the text most plausible.', 'A search problem: which k satisfies kG = K.'],
      ['Outcome', 'Probabilistic: with short texts it can fail.', 'Certain: the key exists and is unique in the range.'],
      ['Check of the key', 'Statistical: the most likely key, not necessarily the right one.', 'Exact: kG = K, with no false positives.'],
      ['Cost', '26 trials, whatever the text.', 'Up to 2^32 operations with exhaustive search, about 2^17 with BSGS or the kangaroo.'],
      ['Depends on the message?', 'Yes: language and length decide success.', 'No: it works even if the message is random.'],
      ['Remedy', 'None within the cipher: the substitution preserves the statistics by construction.', 'Widening the key space to n - 1 ≈ 2^256.'],
    ],
    after: [
      'In one sentence: the attack on Caesar is an estimation problem, the one on the toy scheme a search problem. The first uses the statistics of the message, the second ignores them; the first can fail, the second cannot; the first is not stopped by widening the key space (the monoalphabetic substitution, with 2^88 keys, falls the same way), the second is.',
      'They do share one point: both try keys and recognize the right one. Against Caesar trying is trivial and recognizing is the problem; against the curve scheme recognizing is trivial (kG = K) and trying is the problem. The security of a modern cipher requires both to be hard: no statistical recognition from the ciphertext (section 2.3), and no feasible search of the key space.',
    ],
  },
  real: {
    paras: [
      'Against secp256k1 with a key chosen uniformly between 1 and n - 1, exhaustive search would take 2^255 operations on average, and baby-step giant-step and the kangaroo about 2^128, the former with 2^128 points in memory. This is not a limit of these algorithms: Shoup (1997) proved that every generic algorithm, one that uses the group only through its operations, needs Ω(√n) operations. Pollard’s rho reaches this bound without memory, but does no better.',
      'Non-generic attacks exploit a structure that secp256k1 lacks. Pohlig-Hellman requires the order of the group to have small factors, and n is prime; MOV and Frey-Rück require a small embedding degree, and that of secp256k1 is huge; Smart’s attack requires an anomalous curve, with #E = p, and secp256k1 is not one. Its only extra structure, the endomorphism (x, y) → (βx, y), reduces the rho by a factor √6 (Duursma, Gaudry and Morain, 1999): from 2^128 to about 2^127 operations, as seen in Exercise 1 of Homework #1.',
      `The asymmetry is what makes cryptography possible. The key owner computes K = kG with about 256 doublings and 128 additions, a cost that grows like the logarithm of n; the attacker needs about √n operations. Going from ${KEY_BITS} to 256 bits multiplies the work of the key’s user by 8 and that of whoever searches for it by 2^112.`,
      'This is why "properly configured" means above all a well-generated key: uniform in [1, n - 1], from a cryptographic generator. The weak keys found in the real world were not short by choice, but because of a faulty generator: 32 bits of seed in Profanity (2022) and in the bx seed command of Libbitcoin Explorer (Milk Sad, 2023). The curve was secure, the effective key space was not. One exception remains: a large enough quantum computer would solve the discrete logarithm in polynomial time with Shor’s algorithm, and then no elliptic-curve key length would be enough.',
    ],
  },
  weaknesses: {
    intro: 'The assignment asks to separate the weaknesses due to the restricted key space from those of the scheme’s design. The table lists them; two can be tried here, on the message of section 1.',
    cols: { weakness: 'Weakness', origin: 'Origin', attack: 'Attack', fix: 'Remedy' },
    rows: [
      ['32-bit k', 'Key space', 'Exhaustive search, baby-step giant-step, kangaroo (4.1-4.3): k from K alone, with about 2^17 operations.', 'k uniform in [1, n - 1].'],
      ['Precomputation and many targets', 'Key space', 'A table of baby steps, or of distinguished points, built once serves every key of the same range, and every further key costs less (Bernstein and Lange, 2012).', 'As above.'],
      ['Reused nonce', 'Design (usage)', 'All C1 equal, and C2_i - C2_j = (b_i - b_j)G reveals the differences between the bytes: a Caesar cipher on bytes, broken with frequencies (try it below).', 'A fresh nonce for every encryption, from the cryptographic generator.'],
      ['Predictable or small nonce', 'Design (usage)', 'Whoever recomputes r (from a known seed, like the reproducible nonces of this page) or finds it with baby-step giant-step when it is small computes S = rK and decrypts without k.', 'As above.'],
      ['Malleability', 'Design', 'Adding δG to C2 adds δ to the decrypted byte, without knowing k (try it below); blocks can also be swapped, removed or duplicated.', 'An authenticated cipher, which rejects modified ciphertexts (ECIES).'],
      ['Chosen ciphertexts', 'Design', 'Whoever can have any ciphertext decrypted sends (C1 + tG, C2 + tK), which encrypts the same message with nonce r + t, and reads it: the scheme is not secure against chosen-ciphertext attacks (IND-CCA2).', 'As above.'],
      ['Unvalidated points', 'Implementation', 'If decryption did not check that C1 lies on the curve, points of other curves with small subgroups would reveal k modulo small primes (invalid-curve attacks: Biehl, Meyer and Müller, 2000). This implementation rejects points that are not on the curve.', 'Validating every point received.'],
      ['One byte per block', 'Design', 'It reveals the exact length, multiplies the ciphertext by 66, and the blocks are independent, as in ECB mode.', 'Encrypting the whole message with a derived key (hybrid encryption).'],
      ['Small messages', 'Design, but harmless', 'Every block has only 256 possible messages, but encrypting them all and comparing does not help, because the nonce changes the ciphertext every time. It would in a deterministic scheme, such as RSA without padding.', 'None: probabilistic encryption already protects it.'],
    ],
    reuseTitle: 'Try it: the same nonce for every byte',
    reuse: (demo) => {
      const a = demo.attack;
      if (!a || !a.candidates.length) return ['The message gives no valid candidates.'];
      return [
        `The message of section 1 encrypted with a single nonce: its ${demo.blocks.length} C1 are ${a.sameC1 ? 'all equal, for anyone to see' : 'different'}. The differences C2_i - C2_1 = (b_i - b_1)G give b_i - b_1 through the table of points, and only one byte of the message stays unknown, b_1: ${a.range} possible values, of which ${a.valid} give valid UTF-8 text. The byte frequencies of the training chapters pick the most plausible:`,
      ];
    },
    reuseResult: 'The message read without k',
    reuseCheck: (ok) => (ok ? 'It matches the original message: no private key, no hard discrete logarithm. ✓' : 'It does not match the original message: the message is too short or too unusual. ✗'),
    augustusTitle: 'Try it: malleability',
    augustus: 'Every C2 of the ciphertext of section 1 plus G, decrypted with k:',
    augustusFail: 'The message contains byte 255, which plus 1 is no longer a byte: that block does not decrypt.',
    augustusAfter: 'Every byte went up by 1: the letters became the next ones, the spaces exclamation marks. It is the cipher of Augustus, who according to Suetonius moved every letter by one place, applied by someone who does not know the key to a message they cannot read.',
    after: [
      'Of these weaknesses, only the first two come from the restricted key space, and they vanish with a 256-bit k. The others belong to the design or the implementation and would remain with any key: this is why real systems do not encrypt with "bare" ElGamal, but with authenticated hybrid schemes such as ECIES (from DHIES, Abdalla, Bellare and Rogaway, 2001), secure even against whoever can have chosen ciphertexts decrypted.',
    ],
  },
  stats: {
    verdict: { reject: 'H₀ rejected', notReject: 'H₀ not rejected' },
    expected: { reject: 'expected: rejection', notReject: 'expected: no rejection', either: 'measures a real difference' },
    testLine: testLineEn,
    groups: { corpus: 'Corpus', caesar: 'Caesar', ec: 'Curve scheme', keys: 'Public keys' },
    labels: {
      corpus: { homogeneity: 'Training and test have the same letter frequencies (χ², 2 × 26)' },
      caesar: {
        uniform: 'The letters of the Caesar ciphertext are uniform over the 26 (χ²)',
        dependence: 'Plaintext letter and ciphertext letter are independent (χ², Caesar)',
      },
      ec: {
        uniform: 'The bytes of x(C1) and x(C2) are uniform over the 256 values (χ²)',
        parity: 'The y of C2 is odd with probability 1/2 (binomial)',
        independence: 'The plaintext byte and the first 2 bits of x(C2) are independent (χ²)',
      },
      keys: {
        small: 'The bits of x(kG) are fair coins for 32-bit keys: Σz² ~ χ²(256)',
        full: 'The bits of x(kG) are fair coins for 256-bit keys: Σz² ~ χ²(256)',
      },
    },
  },
  tests: {
    intro: `The hypothesis tests of the page, at significance level α = ${EN.num(SIGNIFICANCE, 2)}. Unlike the previous homework, here some rejections are expected and wanted: the Caesar ciphertext is not uniform and depends on the plaintext, which is exactly what makes it breakable.`,
    cols: { subject: 'Subject', hypothesis: 'Null hypothesis H₀', p: 'p-value', verdict: 'Outcome', expected: 'Reading' },
    keysIntro: (s) => `The public keys: ${EN.int(s.keys.small.N)} keys K = kG with k uniform between 1 and 2^32 - 1, and as many with k uniform between 1 and n - 1. If the restriction left a trace in the coordinates, the first test would see it.`,
    after: (sum) => [
      `${sum.rejected} of ${sum.count} tests reject the null hypothesis, ${sum.asExpected === sum.count ? 'all as expected' : `${sum.asExpected} of ${sum.count} as expected`}. The rejections of the Caesar cipher are its weakness (section 2.3); that of the corpus measures a real but small difference between chapters (section 3.1). The tests on the curve scheme and on the public keys reject nothing, and yet the scheme breaks in less than a second: statistical tests measure the absence of gross defects in the outputs, not how hard it is to invert the function.`,
    ],
  },
  history: {
    intro: 'From the Caesar cipher to elliptic-curve ElGamal, the ideas of this page in chronological order, with the two real vulnerabilities that reproduce the toy scheme.',
    legend: { task: 'used in this page', context: 'context' },
    events: [
      { year: '1st century BC', task: true, title: 'The Caesar cipher', text: 'Suetonius (Lives of the Caesars, about AD 121) tells that Caesar wrote his confidential letters by replacing every letter with the one three places further on, and that Augustus used the next one. The message of this page is his description.' },
      { year: '9th century', task: true, title: 'al-Kindi and frequency analysis', text: 'In his treatise on deciphering cryptographic messages, al-Kindi describes the method of section 3: count the letters of the ciphertext and compare them with those of a long text in the same language. It is the oldest known description of statistical cryptanalysis; the manuscript, kept in Istanbul, was published in 1987.' },
      { year: '1467', task: false, title: 'Alberti', text: 'Leon Battista Alberti describes the cipher disk and polyalphabetic substitution: changing alphabet during the message, so that the frequencies do not survive.' },
      { year: '1553-1586', task: false, title: 'Bellaso and Vigenère', text: 'The cipher named after Vigenère, first described by Giovan Battista Bellaso: a Caesar cipher with a different shift for every letter, given by a keyword. It held out for three centuries.' },
      { year: '1863', task: false, title: 'Kasiski', text: 'Friedrich Kasiski publishes how to find the key length of Vigenère: the ciphertext then splits into many Caesar ciphers, and each falls to frequencies.' },
      { year: '1900', task: false, title: 'Pearson', text: 'Karl Pearson introduces the χ² test, the criterion of one of the methods of section 3.4 and of many tests of this page.' },
      { year: '1920-1922', task: false, title: 'Friedman', text: 'William Friedman defines the index of coincidence (written in 1920, published in 1922): statistics enters cryptanalysis as a measurement, no longer as intuition.' },
      { year: '1949-1951', task: true, title: 'Shannon', text: 'The mathematical theory of secrecy: perfect ciphers, entropy and unicity distance (1949), then the estimate of the entropy of English (1951). They are the quantities of section 3.1.' },
      { year: '1971', task: true, title: 'Baby-step giant-step', text: 'Daniel Shanks, studying class numbers of quadratic fields, finds the first √n algorithm for the discrete logarithm.' },
      { year: '1976', task: false, title: 'Diffie and Hellman', text: 'Public-key cryptography is born, with the key exchange that bears their name: S = rK = kC1 is a Diffie-Hellman exchange on a curve.' },
      { year: '1978', task: true, title: 'Pollard', text: 'John Pollard publishes the rho and kangaroo (lambda) methods for the discrete logarithm: √n operations, with no tables.' },
      { year: '1984-1985', task: true, title: 'Probabilistic encryption and ElGamal', text: 'Goldwasser and Micali define semantic security and probabilistic encryption (1984); Taher ElGamal publishes the encryption and signature scheme based on the discrete logarithm (1985).' },
      { year: '1985-1987', task: true, title: 'Elliptic curves', text: 'Miller (1985) and Koblitz (1987) propose elliptic curves for cryptography; Koblitz also describes the elliptic-curve analogue of ElGamal and how to represent a message with a point.' },
      { year: '1997-1999', task: false, title: 'The limits of generic attacks', text: 'Shoup proves that a generic algorithm needs Ω(√n) operations (1997); van Oorschot and Wiener parallelize rho and the kangaroo with distinguished points (1999).' },
      { year: '2000-2001', task: false, title: 'secp256k1 and ECIES', text: 'SEC 2 publishes the parameters of secp256k1 (2000); Abdalla, Bellare and Rogaway analyse DHIES (2001), the authenticated hybrid scheme ECIES comes from, the right way to encrypt with a curve key.' },
      { year: '2022', task: true, title: 'Profanity', text: 'A generator of "vanity" Ethereum addresses derives the private keys from a 32-bit seed. In mid-September 1inch discloses the weakness; a few days later Wintermute loses about 160 million dollars. The key space of the toy scheme, in the real world.' },
      { year: '2023', task: true, title: 'Milk Sad', text: 'The bx seed command of Libbitcoin Explorer 3.x generates wallet sentences with a Mersenne Twister seeded with 32 bits of the system clock: funds are stolen in June and July (CVE-2023-39910).' },
    ],
    after: 'Read in order, history repeats the same lesson twice. Classical ciphers fell to statistics, and every attempt to save them (more alphabets, longer keys) only pushed the number of letters needed further away, until Shannon gave the exact measure of the problem. Modern cryptography solved that problem, with ciphertexts that cannot be told from random, and moved security onto the hardness of a computation: but a hard computation over a small key space is easy, as the owners of keys generated from 32 bits found out in 2022 and 2023.',
  },
  conclusion: (s) => [
    `The same message, encrypted with the two schemes, shows two opposite ways of failing. The Caesar cipher falls because it preserves the statistics of the text: with the frequencies of English and maximum likelihood ${s ? `20 letters are enough to recover the key in ${EN.pct(rateAt(s, 'unigram', 20), 0)} of the cases, and with quadgrams 10 letters for ${EN.pct(rateAt(s, 'quadgram', 10), 0)}` : 'a few dozen letters are enough to recover the key almost always'}. The curve scheme has a statistically flawless ciphertext, and falls all the same, in less than a second, because the private key has 32 bits: the attack does not look at the message, it solves a discrete logarithm in a small interval.`,
    'The two lessons complete each other. A large key space is necessary but not sufficient: the monoalphabetic substitution has 2^88 keys and breaks with frequencies. A ciphertext indistinguishable from random is necessary but not sufficient: the toy scheme has one and breaks with 2^17 operations. Elliptic-curve ElGamal with a 256-bit key has both properties, and the best known attack takes about 2^128 operations.',
    'What remains is what no key length fixes: reused or predictable nonces, malleable ciphertexts, unvalidated points. They are design and implementation errors, and in the real world they do more damage than the algorithms: the keys stolen through Profanity and Milk Sad lived on a secure curve, but had been badly generated.',
  ],
  methodNames: methodNamesEn,
  attackNames: { exhaustive: 'Exhaustive search', bsgs: 'Baby-step giant-step', kangaroo: 'Kangaroo' },
  tips: {
    letter: (letter, count, expected) => `${letter}: ${count} ${count === 1 ? 'time' : 'times'}, ${EN.num(expected, 1)} expected`,
    byte: (b, count, expected) => `Byte ${b}: ${EN.int(count)} times, ${EN.num(expected, 1)} expected`,
    bytes: (from, to, min, max, expected) => `Bytes ${from} to ${to}: ${EN.int(min)} to ${EN.int(max)} times, ${EN.num(expected, 1)} expected each`,
    frequency: (letter, training, test) => `${letter}: ${EN.pct(training, 2)} in training, ${EN.pct(test, 2)} in test`,
    shift: (s, p, text) => `s = ${s}: probability ${EN.prob(p)}; "${text.slice(0, 32)}${text.length > 32 ? '...' : ''}"`,
    success: (L, n, rate, interval, bound) => `${L} ${L === 1 ? 'letter' : 'letters'}, ${n} passages: success ${EN.pct(rate)} (95%: ${EN.pct(interval[0])}-${EN.pct(interval[1])}); Chernoff bound ${EN.pct(bound)}`,
    methods: (L, rates) => `${L} ${L === 1 ? 'letter' : 'letters'}: ${rates.map((r, i) => `${Object.values(methodNamesEn)[i]} ${EN.pct(r)}`).join(', ')}`,
    scaling: (bits, means) => `${bits} bits: ${means.map((m, i) => (m === null ? null : `${['exhaustive search', 'BSGS', 'kangaroo'][i]} ${EN.int(m)}`)).filter(Boolean).join(', ')} operations on average`,
  },
  download: {
    title: 'Download the code',
    text: 'The complete program in HTML, CSS and JavaScript, with no dependencies, in Italian and English: once the archive is extracted, it opens with a double click on index.html, even offline. With node homework2a.js it prints the scheme, the Caesar cipher, the attacks and the statistics in a terminal; --key, --message, --shift and --random-nonces change the input.',
    contents: 'Contents: index.html, style.css, homework2a.js (schemes, attacks, corpus and statistics), app.js (interface and texts), README.txt.',
    zip: 'Download homework2a.zip',
    online: 'Open the program online',
  },
  standalone: {
    subtitle: 'A toy elliptic-curve scheme and the Caesar cipher: encryption, statistical cryptanalysis and attacks.',
    course: 'Statistics, MSc in Cybersecurity, Sapienza University of Rome',
    online: 'Online version',
    noscript: 'This program needs JavaScript.',
  },
};

export const HW2A_TEXTS = { it, en };
