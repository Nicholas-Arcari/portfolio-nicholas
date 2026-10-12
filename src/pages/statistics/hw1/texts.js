// src/pages/statistics/hw1/texts.js
// Testi della pagina dell'Homework #1, in italiano e in inglese. Stanno qui e
// non in i18n/translations.js perche' sono lunghi e appartengono solo a questa
// pagina; la lingua e' quella scelta nel selettore del sito.

const it = {
  taskTitle: 'La consegna',
  task: [
    'In Ethereum la chiave privata e\' un intero casuale k di 256 bit, e la chiave pubblica e\' il punto Q = kG della curva ellittica secp256k1, y² = x³ + 7 su un campo primo di 256 bit; l\'indirizzo si ricava poi da Q con Keccak-256. Calcolare Q a partire da k e\' veloce, mentre risalire a k partendo da Q e\' il problema del logaritmo discreto su curva ellittica (ECDLP), per cui non si conosce alcun algoritmo efficiente.',
    'Questa pagina riproduce l\'idea su una curva giocattolo con la stessa equazione, y² = x³ + 7 (mod 17), punto base G = (1, 5) e chiave privata k = 6. Calcola G, 2G, ..., kG con la regola di somma dei punti, poi lo stesso risultato con il metodo piu\' rapido double-and-add, anima l\'algoritmo ed esplora le proprieta\' statistiche della funzione k → kG. I numeri sono volutamente minuscoli: qui niente e\' sicuro.',
  ],
  setupTitle: '1. Curva giocattolo, punto base e chiave privata',
  fieldLabel: 'Campo F_p',
  baseLabel: 'Punto base G',
  keyLabel: 'Chiave privata k',
  orderWord: 'ordine',
  curveSummary: (p, count, n) =>
    `y² = x³ + 7 su F_${p}: ${count - 1} punti affini piu' il punto all'infinito O, ${count} in tutto. G genera un sottogruppo di ${n} punti, quindi kG si ripete ogni ${n} valori di k.`,
  pointsTitle: 'I punti della curva',
  pointsLegend: 'In evidenza i multipli di G; bordati G e la chiave pubblica Q.',
  repeatedTitle: '2. Somma ripetuta: G, 2G, 3G, ..., kG',
  repeatedIntro:
    'Ogni riga somma G alla precedente con la regola della corda e della tangente. Se i due punti coincidono (2G = G + G) la retta e\' la tangente, con pendenza λ = (3x² + a) / 2y; altrimenti λ = (y2 - y1) / (x2 - x1). Poi x3 = λ² - x1 - x2 e y3 = λ(x1 - x3) - y1, tutto modulo p, dove dividere significa moltiplicare per l\'inverso modulare.',
  colMultiple: 'Multiplo',
  colPoint: 'Punto',
  colOperation: 'Operazione',
  colLambda: 'λ',
  kinds: {
    start: 'punto di partenza',
    add: 'somma (corda)',
    double: 'raddoppio (tangente)',
    inverse: 'P + (-P) = O',
    identity: 'O + G = G',
  },
  tooMany: (k) => `Con k = ${k} servirebbero ${k - 1} somme: troppe da elencare, vedi il double-and-add qui sotto.`,
  fastTitle: '3. Un metodo piu\' rapido: double-and-add',
  fastIntro: (bits, ops) =>
    `Si scrive k in binario (${bits}) e si leggono i bit da sinistra: a ogni bit si raddoppia R, e se il bit vale 1 si somma G. Bastano ${ops} operazioni invece di k - 1: per una chiave Ethereum di 256 bit sono in media circa 384 operazioni, invece di circa 2^256.`,
  colBit: 'Bit',
  ops: { load: 'R = G', double: 'R = 2R', add: 'R = R + G' },
  publicKeyLabel: 'CHIAVE PUBBLICA GIOCATTOLO',
  infinityKey: 'Q = O, il punto all\'infinito: k e\' un multiplo dell\'ordine di G, e O non e\' una chiave pubblica valida.',
  bruteTitle: '4. Perche\' questa chiave non e\' a senso unico',
  brute: (tries, n, kmod) =>
    `Conoscendo solo G e Q, provare G, 2G, 3G, ... trova Q dopo ${tries} tentativi: k ≡ ${kmod} (mod ${n}). Con un sottogruppo di ${n} punti l'inversione e' immediata. Su secp256k1 il sottogruppo ha circa 1,16 × 10^77 punti: anche a 10^12 tentativi al secondo la stessa ricerca richiederebbe circa 10^57 anni. A rendere la funzione a senso unico sono la dimensione del gruppo e l'assenza di strutture sfruttabili, non la formula.`,
  guruTitle: '5. Livello guru: l\'algoritmo al rallentatore',
  guruIntro:
    'Ogni operazione e\' disegnata in cinque fasi sulla griglia p × p: i due operandi, la retta che li unisce (la tangente quando si raddoppia), che si avvolge sul quadrato perche\' tutto e\' modulo p, il terzo punto in cui la retta incontra di nuovo la curva e il suo riflesso, che e\' la somma. In grigio i punti della curva, in blu i multipli di G gia\' calcolati.',
  vizNote: 'L\'animazione usa p = 17 o p = 97: con griglie piu\' grandi non si leggerebbe nulla.',
  methodLabel: 'Algoritmo',
  methodRepeated: 'Somma ripetuta',
  methodDouble: 'Double-and-add',
  speedLabel: 'Velocita\'',
  play: 'Avvia',
  pause: 'Pausa',
  step: 'Passo',
  reset: 'Ricomincia',
  phases: {
    operands: 'gli operandi',
    line: 'la retta che li unisce',
    third: 'il terzo punto di intersezione, -R',
    reflect: 'il riflesso: R',
    result: 'il risultato',
  },
  caption: (op, phase, fmt) => {
    if (!op) return '';
    const head = `${op.multiple}G`;
    if (op.kind === 'identity') return `${head}: R parte da G = ${fmt(op.result)}.`;
    const what = op.vertical
      ? `${fmt(op.P)} + ${fmt(op.Q)}: retta verticale, la somma e' il punto all'infinito O`
      : op.kind === 'double'
        ? `raddoppio di ${fmt(op.P)}, tangente con λ = ${op.lambda}`
        : `${fmt(op.P)} + ${fmt(op.Q)}, corda con λ = ${op.lambda}`;
    const detail =
      phase === 'third' && op.third ? ` → -R = ${fmt(op.third)}`
        : (phase === 'reflect' || phase === 'result') && op.result ? ` → R = ${head} = ${fmt(op.result)}`
          : '';
    return `${what}${detail}.`;
  },
  done: (k, Q) => `Fatto: Q = ${k}G = ${Q}.`,
  statsTitle: '6. Esplorazione statistica',
  statsIntro:
    'La funzione k → kG viene calcolata per ogni k da 1 a n - 1, dove n e\' l\'ordine del punto base, su quattro curve giocattolo con la stessa equazione: p = 17, la curva della consegna, e p = 97, 991 e 10477, scelti perche\' li\' il numero di punti e\' primo, come su secp256k1. Scegli una curva e un punto base per ripetere l\'esperimento.',
  statsBaseDefault: 'predefinito',
  rows: {
    sample: 'Valori di k esaminati',
    distinctX: 'Valori distinti di x / possibili',
    chiX: 'Test χ² di uniformita\' su x',
    chiY: 'Test χ² di uniformita\' su y',
    corrKX: 'Correlazione r(k, x)',
    corrKY: 'Correlazione r(k, y)',
    serial: 'Correlazione seriale r(x_k, x_k+1)',
    mirror: 'x(kG) = x((n - k)G)',
    avalanche: 'Valanga: bit di uscita cambiati da un bit di k',
    homomorphism: '(k1 + k2)G = k1G + k2G',
  },
  chi: (c) => `χ² = ${c.chi2.toFixed(1)} con ${c.df} gradi di liberta', p-value ${c.pValue.toFixed(2)}`,
  pairs: (m, t) => `${m} coppie su ${t}`,
  trials: (h, t) => `vera in ${h} prove su ${t}`,
  avalancheValue: (a) => `${(100 * a.meanFraction).toFixed(1)}% in media (${a.measurements} misure su ${a.outputBits} bit)`,
  multiplicityTitle: 'Quante volte compare ogni valore',
  multiplicity: (label, table) =>
    `${label}: ${table.map((count, times) => (count ? `${count} valori ${times === 0 ? 'mai' : times === 1 ? 'una volta' : `${times} volte`}` : null)).filter(Boolean).join(', ')}.`,
  charts: {
    histX: 'Distribuzione di x (tratteggio: valori uniformi)',
    histY: 'Distribuzione di y (tratteggio: valori uniformi)',
    bitsX: 'Bit di x: quota di 1 per posizione (tratteggio: valori uniformi in [0, p))',
    avalanche: 'Valanga: bit di uscita cambiati invertendo un bit di k (tratteggio: funzione casuale ideale)',
  },
  discussionTitle: '7. Discussione: funzione a senso unico o funzione di hash?',
  discussion: [
    'Cosa mostrano i numeri. A grana grossa le coordinate sembrano uniformi (sulle curve piu\' grandi i test χ² non rifiutano l\'uniformita\'), la quota di 1 in ogni bit e\' vicina a quella di valori uniformi, la correlazione lineare fra k e x e\' zero e invertire un bit di k cambia circa meta\' dei bit di uscita. In superficie, k → kG si comporta come una funzione casuale.',
    'Guardando meglio la struttura emerge. Solo circa meta\' dei valori in [0, p) sono la x di qualche punto (x³ + 7 deve essere un quadrato), e ogni x che compare compare esattamente due volte: kG e (n - k)G sono punti opposti, (x, y) e (x, -y). E\' la stessa simmetria che rende r(k, x) esattamente zero: x e\' una funzione simmetrica di k attorno a n/2, che una correlazione lineare non vede, benche\' x sia completamente determinata da k. Quando p ≡ 1 (mod 3) i valori di y arrivano invece a terne (x³ = y² - 7 ha tre radici cubiche), mentre quando p ≡ 2 (mod 3), come per 17, ogni y compare una volta sola. E la funzione e\' un omomorfismo di gruppi: (k1 + k2)G = k1G + k2G e\' risultata vera in ogni prova.',
    'Quali proprieta\' contano per una funzione a senso unico. Il determinismo, la rapidita\' del calcolo diretto (il double-and-add richiede O(log k) operazioni) e soprattutto la difficolta\' computazionale dell\'inversione: dato Q, trovare k deve essere irrealizzabile. Qui e\' l\'ECDLP, e dipende dalla dimensione del gruppo e dalla sua struttura: un ordine primo grande (l\'n di secp256k1 e\' un primo di 256 bit) e nessuna scorciatoia nota. Le nostre curve falliscono per dimensione e, quella della consegna, anche per struttura: i suoi 18 punti si scompongono in 2 · 3², e Pohlig-Hellman divide il problema in problemi minuscoli; anche le curve con tanti punti quanto p (anomale, come p = 127 per questa equazione) o supersingolari (p ≡ 2 mod 3, come 17) hanno attacchi noti. Dentro [1, n - 1] la funzione e\' biettiva, quindi chiavi private diverse non danno mai la stessa chiave pubblica. Nessuno dei test statistici qui sopra misura la difficolta\' dell\'inversione: la casualita\' statistica non e\' ne\' necessaria ne\' sufficiente per una funzione a senso unico.',
    'Quali proprieta\' appartengono alle funzioni di hash crittografiche. L\'effetto valanga (un bit invertito in ingresso cambia ogni bit di uscita con probabilita\' 1/2, in modo indipendente), uscite indistinguibili da stringhe casuali uniformi, nessuna correlazione fra bit di ingresso e di uscita, resistenza alle collisioni su ingressi di qualunque lunghezza, uscita di lunghezza fissa e nessuna struttura algebrica. La moltiplicazione su curva ellittica non ne ha nessuna, per progetto: le sue uscite sono punti strutturati, le sue x collidono a coppie, e il suo omomorfismo non e\' un difetto ma il motivo per cui e\' utile, perche\' su di esso si costruiscono le firme ECDSA e lo scambio di chiavi Diffie-Hellman. Una funzione di hash con quella proprieta\' sarebbe rotta: da H(a) e H(b) si calcolerebbe H(a + b).',
    'Per questo Ethereum non usa direttamente la chiave pubblica come indirizzo: l\'indirizzo sono gli ultimi 20 byte di Keccak-256(Q), un hash applicato al punto strutturato proprio per ottenere un identificativo corto e dall\'aspetto uniforme. Allo stesso modo, il segreto condiviso di uno scambio Diffie-Hellman su curva ellittica passa da una funzione di derivazione di chiave prima di diventare una chiave. Funzione a senso unico e funzione di hash sono strumenti complementari, e le statistiche di questa pagina aiutano a vedere perche\' non sono intercambiabili.',
  ],
  downloadTitle: 'Scarica il codice',
  downloadText:
    'Tutto l\'homework in un solo file JavaScript, senza dipendenze: curva, somma dei punti, kG, statistiche e animazione. Con node homework1.js stampa G, ..., kG, la chiave pubblica e le statistiche; in un browser disegna anche l\'animazione.',
  downloadBtn: 'homework1.js',
};

const en = {
  taskTitle: 'The assignment',
  task: [
    'In Ethereum a private key is a random 256-bit integer k, and the public key is the point Q = kG on the elliptic curve secp256k1, y² = x³ + 7 over a 256-bit prime field; the address is then derived from Q with Keccak-256. Computing Q from k is fast, while recovering k from Q is the Elliptic Curve Discrete Logarithm Problem (ECDLP), for which no efficient algorithm is known.',
    'This page reproduces the idea on a toy curve with the same equation, y² = x³ + 7 (mod 17), base point G = (1, 5) and private key k = 6. It computes G, 2G, ..., kG with the point-addition rule, then the same result with the faster double-and-add method, animates the algorithm and explores the statistical properties of the map k → kG. The numbers are deliberately tiny: nothing here is secure.',
  ],
  setupTitle: '1. Toy curve, base point and private key',
  fieldLabel: 'Field F_p',
  baseLabel: 'Base point G',
  keyLabel: 'Private key k',
  orderWord: 'order',
  curveSummary: (p, count, n) =>
    `y² = x³ + 7 over F_${p}: ${count - 1} affine points plus the point at infinity O, ${count} in total. G generates a subgroup of ${n} points, so kG repeats every ${n} values of k.`,
  pointsTitle: 'The points of the curve',
  pointsLegend: 'Highlighted: the multiples of G; outlined: G and the public key Q.',
  repeatedTitle: '2. Repeated addition: G, 2G, 3G, ..., kG',
  repeatedIntro:
    'Each row adds G to the previous one with the chord-and-tangent rule. When the two points coincide (2G = G + G) the line is the tangent, with slope λ = (3x² + a) / 2y; otherwise λ = (y2 - y1) / (x2 - x1). Then x3 = λ² - x1 - x2 and y3 = λ(x1 - x3) - y1, all modulo p, where dividing means multiplying by the modular inverse.',
  colMultiple: 'Multiple',
  colPoint: 'Point',
  colOperation: 'Operation',
  colLambda: 'λ',
  kinds: {
    start: 'starting point',
    add: 'addition (chord)',
    double: 'doubling (tangent)',
    inverse: 'P + (-P) = O',
    identity: 'O + G = G',
  },
  tooMany: (k) => `With k = ${k} it would take ${k - 1} additions: too many to list, see double-and-add below.`,
  fastTitle: '3. A faster method: double-and-add',
  fastIntro: (bits, ops) =>
    `Write k in binary (${bits}) and read the bits from the left: double R at every bit, and add G when the bit is 1. ${ops} operations instead of k - 1: for a 256-bit Ethereum key that is about 384 operations on average, instead of about 2^256.`,
  colBit: 'Bit',
  ops: { load: 'R = G', double: 'R = 2R', add: 'R = R + G' },
  publicKeyLabel: 'TOY PUBLIC KEY',
  infinityKey: 'Q = O, the point at infinity: k is a multiple of the order of G, and O is not a valid public key.',
  bruteTitle: '4. Why this key is not one-way',
  brute: (tries, n, kmod) =>
    `Knowing only G and Q, trying G, 2G, 3G, ... finds Q after ${tries} attempts: k ≡ ${kmod} (mod ${n}). With a subgroup of ${n} points the inversion is immediate. On secp256k1 the subgroup has about 1.16 × 10^77 points: even at 10^12 attempts per second, the same search would take about 10^57 years. What makes the function one-way is the size of the group and the absence of exploitable structure, not the formula.`,
  guruTitle: '5. Guru level: the algorithm in slow motion',
  guruIntro:
    'Each operation is drawn in five phases on the p × p grid: the two operands, the line through them (the tangent when doubling), which wraps around the square because everything is modulo p, the third point where the line meets the curve again, and its reflection, which is the sum. Grey: the points of the curve; blue: the multiples of G computed so far.',
  vizNote: 'The animation uses p = 17 or p = 97: larger grids would be unreadable.',
  methodLabel: 'Algorithm',
  methodRepeated: 'Repeated addition',
  methodDouble: 'Double-and-add',
  speedLabel: 'Speed',
  play: 'Play',
  pause: 'Pause',
  step: 'Step',
  reset: 'Restart',
  phases: {
    operands: 'the operands',
    line: 'the line through them',
    third: 'the third intersection, -R',
    reflect: 'the reflection: R',
    result: 'the result',
  },
  caption: (op, phase, fmt) => {
    if (!op) return '';
    const head = `${op.multiple}G`;
    if (op.kind === 'identity') return `${head}: R starts from G = ${fmt(op.result)}.`;
    const what = op.vertical
      ? `${fmt(op.P)} + ${fmt(op.Q)}: vertical line, the sum is the point at infinity O`
      : op.kind === 'double'
        ? `doubling ${fmt(op.P)}, tangent with λ = ${op.lambda}`
        : `${fmt(op.P)} + ${fmt(op.Q)}, chord with λ = ${op.lambda}`;
    const detail =
      phase === 'third' && op.third ? ` → -R = ${fmt(op.third)}`
        : (phase === 'reflect' || phase === 'result') && op.result ? ` → R = ${head} = ${fmt(op.result)}`
          : '';
    return `${what}${detail}.`;
  },
  done: (k, Q) => `Done: Q = ${k}G = ${Q}.`,
  statsTitle: '6. Statistical exploration',
  statsIntro:
    'The map k → kG is computed for every k from 1 to n - 1, n being the order of the base point, on four toy curves with the same equation: p = 17, the assignment\'s curve, and p = 97, 991 and 10477, chosen because there the number of points is prime, as on secp256k1. Pick a curve and a base point to repeat the experiment.',
  statsBaseDefault: 'default',
  rows: {
    sample: 'Values of k examined',
    distinctX: 'Distinct x values / possible',
    chiX: 'χ² uniformity test on x',
    chiY: 'χ² uniformity test on y',
    corrKX: 'Correlation r(k, x)',
    corrKY: 'Correlation r(k, y)',
    serial: 'Serial correlation r(x_k, x_k+1)',
    mirror: 'x(kG) = x((n - k)G)',
    avalanche: 'Avalanche: output bits changed by one bit of k',
    homomorphism: '(k1 + k2)G = k1G + k2G',
  },
  chi: (c) => `χ² = ${c.chi2.toFixed(1)} with ${c.df} degrees of freedom, p-value ${c.pValue.toFixed(2)}`,
  pairs: (m, t) => `${m} pairs out of ${t}`,
  trials: (h, t) => `true in ${h} trials out of ${t}`,
  avalancheValue: (a) => `${(100 * a.meanFraction).toFixed(1)}% on average (${a.measurements} measurements over ${a.outputBits} bits)`,
  multiplicityTitle: 'How often each value occurs',
  multiplicity: (label, table) =>
    `${label}: ${table.map((count, times) => (count ? `${count} values ${times === 0 ? 'never' : times === 1 ? 'once' : times === 2 ? 'twice' : `${times} times`}` : null)).filter(Boolean).join(', ')}.`,
  charts: {
    histX: 'Distribution of x (dashed: uniform values)',
    histY: 'Distribution of y (dashed: uniform values)',
    bitsX: 'Bits of x: share of ones per position (dashed: uniform values in [0, p))',
    avalanche: 'Avalanche: output bits changed by flipping one bit of k (dashed: ideal random function)',
  },
  discussionTitle: '7. Discussion: one-way function or hash function?',
  discussion: [
    'What the numbers show. At coarse resolution the coordinates look uniform (on the larger curves the χ² tests do not reject uniformity), the share of ones in each bit is close to that of uniform values, the linear correlation between k and x is zero and flipping one bit of k changes about half of the output bits. On the surface, k → kG behaves like a random function.',
    'Look closer and the structure appears. Only about half of the values in [0, p) are the x of some point (x³ + 7 must be a square), and every x that occurs, occurs exactly twice: kG and (n - k)G are opposite points, (x, y) and (x, -y). The same symmetry is why r(k, x) is exactly zero: x is a symmetric function of k around n/2, which a linear correlation cannot see, even though x is completely determined by k. When p ≡ 1 (mod 3) the values of y come in triples instead (x³ = y² - 7 has three cube roots), while when p ≡ 2 (mod 3), as for 17, each y occurs only once. And the map is a group homomorphism: (k1 + k2)G = k1G + k2G held in every trial.',
    'Which properties matter for a one-way function. Determinism, fast forward evaluation (double-and-add needs O(log k) operations) and above all computational hardness of inversion: given Q, finding k must be infeasible. Here that is the ECDLP, and it depends on the size of the group and on its structure: a large prime order (secp256k1\'s n is a 256-bit prime) and no known shortcut. Our curves fail on size and, for the assignment\'s curve, on structure too: its 18 points factor as 2 · 3², and Pohlig-Hellman splits the problem into tiny ones; curves with as many points as p (anomalous, like p = 127 for this equation) or supersingular ones (p ≡ 2 mod 3, like 17) have known attacks as well. Within [1, n - 1] the map is a bijection, so different private keys never give the same public key. None of the statistical tests above measures hardness of inversion: statistical randomness is neither necessary nor sufficient for a one-way function.',
    'Which properties belong to cryptographic hash functions. The avalanche effect (one flipped input bit changes each output bit with probability 1/2, independently), outputs indistinguishable from uniform random strings, no correlation between input and output bits, collision resistance on inputs of any length, a fixed-length output and no algebraic structure. Elliptic-curve multiplication has none of these by design: its outputs are structured points, its x coordinates collide in pairs, and its homomorphism is not a flaw but the reason it is useful, since ECDSA signatures and Diffie-Hellman key exchange are built on it. A hash function with that property would be broken: from H(a) and H(b) one could compute H(a + b).',
    'That is why Ethereum does not use the public key directly as an address: the address is the last 20 bytes of Keccak-256(Q), a hash applied to the structured point precisely to obtain a short, uniform-looking identifier. In the same way, the shared secret of an elliptic-curve Diffie-Hellman exchange goes through a key-derivation function before it becomes a key. One-way functions and hash functions are complementary tools, and the statistics on this page help to see why they are not interchangeable.',
  ],
  downloadTitle: 'Download the code',
  downloadText:
    'The whole homework in a single JavaScript file with no dependencies: curve, point addition, kG, statistics and animation. With node homework1.js it prints G, ..., kG, the public key and the statistics; in a browser it also draws the animation.',
  downloadBtn: 'homework1.js',
};

export const HW1_TEXTS = { it, en };
