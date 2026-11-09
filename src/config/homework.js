// src/config/homework.js
// Gli homework e i project di Statistics, condivisi con il professore
// attraverso questo sito. Per aggiungerne uno: una voce qui, il suo file in
// pages/statistics e la sua rotta in App.jsx. `type` ('homework' o
// 'project') serve al filtro dell'elenco; `theory` dice se la riga ha anche
// la pagina di teoria (theory/homeworkN.js).
//
// Le date sono istanti precisi, con lo scarto da UTC scritto per esteso: a
// video vengono sempre mostrate nell'ora di Roma, qualunque sia il fuso di
// chi apre la pagina, e il passaggio fra CEST e CET lo gestisce il browser.
// `completed` e' la data di completamento. Una data non ancora nota e'
// null, e si legge "da definire".
//
// I parametri citati nelle descrizioni vengono dalla stessa costante usata
// dal codice dell'homework: se la consegna cambia, cambia anche qui.
import { TASK as HW1 } from '../pages/statistics/hw1/task.js';

const hw1Curve = `y² = x³ + ${HW1.b} mod ${HW1.p}, G = (${HW1.G.x}, ${HW1.G.y}), k = ${HW1.k}`;

export const STATISTICS_HOMEWORK = [
  {
    slug: 'homework-1',
    name: 'Homework #1 - Exercise 1',
    type: 'homework',
    theory: true,
    description: {
      it: `Dalla chiave privata alla chiave pubblica con la moltiplicazione scalare su curva ellittica, come in Ethereum: sulla curva giocattolo della consegna (${hw1Curve}), somma dopo somma e con double-and-add. L’algoritmo animato al rallentatore. Coordinate, bit, correlazioni ed effetto valanga dei punti al variare di k, con test d’ipotesi. La discussione: funzione a senso unico o di hash?`,
      en: `From a private key to a public key with elliptic-curve scalar multiplication, as in Ethereum: on the toy curve of the assignment (${hw1Curve}), one addition at a time and with double-and-add. The algorithm animated in slow motion. Coordinates, bits, correlations and avalanche effect of the points as k varies, with hypothesis tests. The discussion: one-way function or hash function?`,
    },
    completed: '2026-10-12T08:28:00+02:00',
    due: '2026-10-15T21:00:00+02:00',
  },
  {
    slug: 'homework-2',
    name: 'Homework #1 - Exercise 2',
    type: 'homework',
    theory: true,
    description: {
      it: 'Dalla frase mnemonica all’indirizzo Ethereum: la pipeline di un wallet (BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256, EIP-55) scritta da zero e verificata con i vettori di test ufficiali. La distinzione fra generazione e derivazione delle chiavi, crittografia a chiave pubblica, hashing, checksum e codifica. Le proprietà statistiche di ogni passaggio, test d’ipotesi e contesto storico.',
      en: 'From a mnemonic sentence to an Ethereum address: the wallet pipeline (BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256, EIP-55) written from scratch and checked against the official test vectors. The distinction between key generation and derivation, public-key cryptography, hashing, checksums and encoding. The statistical properties of every step, hypothesis tests and historical context.',
    },
    completed: '2026-10-13T13:30:00+02:00',
    due: '2026-10-15T21:00:00+02:00',
  },
  {
    // homework-2a e non homework-2: gli indirizzi dei due esercizi
    // dell'Homework #1 restano quelli di prima fino alla fine del corso
    slug: 'homework-2a',
    name: 'Homework #2',
    type: 'homework',
    theory: true,
    description: {
      it: 'Uno schema giocattolo su secp256k1 (ElGamal su curva ellittica, chiavi private di 32 bit) e il cifrario di Cesare a confronto sullo stesso messaggio. La chiave di Cesare ritrovata con la statistica di un corpus inglese, quella dello schema giocattolo con la ricerca esaustiva, baby-step giant-step e il canguro di Pollard, che contro una chiave vera non bastano. Test d’ipotesi e contesto storico.',
      en: 'A toy scheme on secp256k1 (elliptic-curve ElGamal, 32-bit private keys) and the Caesar cipher compared on the same message. The Caesar key recovered with the statistics of an English corpus, the toy scheme’s key with exhaustive search, baby-step giant-step and Pollard’s kangaroo, which are not enough against a real key. Hypothesis tests and historical context.',
    },
    completed: '2026-10-15T20:25:00+02:00',
    due: '2026-10-22T21:00:00+02:00',
  },
  {
    slug: 'homework-3',
    name: 'Homework #3',
    type: 'homework',
    theory: true,
    description: {
      it: 'Il processo di penetrazione di m attaccanti su n sistemi, con incrementi i.i.d. di Bernoulli o di Rademacher. Traiettorie simulate del punteggio totale, medio e normalizzato al crescere di n: la legge dei grandi numeri con i limiti di Chebyshev e Hoeffding, la varianza, il teorema del limite centrale e quello di Berry-Esseen. Il ruolo di sistemi e attaccanti, test d’ipotesi e contesto storico.',
      en: 'The penetration process of m attackers on n systems, with i.i.d. Bernoulli or Rademacher increments. Simulated trajectories of the total, average and normalized score as n grows: the law of large numbers with the Chebyshev and Hoeffding bounds, the variance, the central limit theorem and the Berry-Esseen theorem. The role of systems and attackers, hypothesis tests and historical context.',
    },
    completed: '2026-10-23T12:12:00+02:00',
    due: '2026-10-29T21:00:00+01:00',
  },
  {
    // due parti, Part 1 e Part 2, in una sola pagina e con un solo indirizzo
    slug: 'homework-4',
    name: 'Homework #4',
    type: 'homework',
    theory: true,
    description: {
      it: 'Due parti in una pagina. Part 1: le formule ricorsive di Knuth e di Welford per media e varianza, ricavate passo per passo e confrontate con la formula da manuale, che perde cifre per cancellazione. Part 2: media e varianza campionarie dei punteggi dell’Homework #3, la correzione di Bessel, gli intervalli di confidenza, test d’ipotesi e contesto storico.',
      en: 'Two parts in one page. Part 1: Knuth’s and Welford’s recurrences for the mean and the variance, derived step by step and compared with the textbook formula, which loses digits to cancellation. Part 2: the sample mean and variance of the scores of Homework #3, Bessel’s correction, confidence intervals, hypothesis tests and historical context.',
    },
    completed: '2026-11-02T18:26:00+01:00',
    due: '2026-11-05T21:00:00+01:00',
  },
  {
    // due parti, Part 1 e Part 2, in una sola pagina e con un solo indirizzo
    slug: 'homework-5',
    name: 'Homework #5',
    type: 'homework',
    theory: true,
    description: {
      it: 'Due esercizi in una pagina. Esercizio 1: gli integrali di Riemann e di Lebesgue calcolati numericamente su undici funzioni e confrontati per precisione, convergenza e costo, con Dirichlet e Thomae in frazioni esatte. Esercizio 2: la funzione di ripartizione della normale, il teorema di Liouville, erf, le serie e un metodo efficiente con circa 15 cifre corrette, verificato con la tavola del NIST e con mpmath.',
      en: 'Two exercises in one page. Exercise 1: the Riemann and Lebesgue integrals computed numerically on eleven functions and compared in accuracy, convergence and cost, with Dirichlet’s and Thomae’s functions in exact fractions. Exercise 2: the distribution function of the normal law, Liouville’s theorem, erf, series and an efficient method with about 15 correct digits, checked against the NIST table and mpmath.',
    },
    completed: '2026-11-06T09:40:00+01:00',
    due: '2026-11-12T21:00:00+01:00',
  },
  {
    // progetto di gruppo: per ora la pagina dice solo "Work in progress...";
    // il codice stara' in un repository a parte, ancora da creare
    slug: 'project-1',
    name: 'Project #1',
    type: 'project',
    theory: false,
    description: {
      it: 'Progetto di gruppo, in preparazione.',
      en: 'Group project, in preparation.',
    },
    completed: null,
    // la fine dell'a.a. 2026-2027: per il Regolamento studenti Sapienza
    // 2026-2027 (art. 18) l'attivita' didattica termina il 30 settembre
    due: '2027-09-30T21:00:00+02:00',
  },
];
