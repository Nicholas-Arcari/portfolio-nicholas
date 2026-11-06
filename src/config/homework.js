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
      it: `Crittografia a chiave pubblica: dalla chiave privata alla chiave pubblica con la moltiplicazione scalare su curva ellittica, come in Ethereum (curva giocattolo ${hw1Curve}), con animazione dell'algoritmo, esplorazione statistica e discussione.`,
      en: `Public-key cryptography: from a private key to a public key with elliptic-curve scalar multiplication, as in Ethereum (toy curve ${hw1Curve}), with an animation of the algorithm, a statistical exploration and a discussion.`,
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
      it: `Dalla frase mnemonica all'indirizzo Ethereum: la pipeline di un wallet (BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256, EIP-55) scritta da zero e verificata con i vettori di test ufficiali, la distinzione fra generazione e derivazione delle chiavi, crittografia a chiave pubblica, hashing, checksum e codifica, le proprietà statistiche di ogni passaggio e il contesto storico.`,
      en: `From a mnemonic sentence to an Ethereum address: the wallet pipeline (BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256, EIP-55) written from scratch and checked against the official test vectors, the distinction between key generation and derivation, public-key cryptography, hashing, checksums and encoding, the statistical properties of every step and the historical context.`,
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
      it: "Uno schema giocattolo su secp256k1 (ElGamal su curva ellittica con chiavi private di 32 bit) e il cifrario di Cesare: cifrare e decifrare lo stesso messaggio, confrontare procedure, spazi delle chiavi e proprietà statistiche, rompere Cesare con la statistica di un corpus inglese (massima verosimiglianza, χ², n-grammi, dizionario) e lo schema giocattolo con la ricerca esaustiva, baby-step giant-step e il canguro di Pollard, con test d'ipotesi, contesto storico e discussione.",
      en: "A toy scheme on secp256k1 (elliptic-curve ElGamal with 32-bit private keys) and the Caesar cipher: encrypting and decrypting the same message, comparing procedures, key spaces and statistical properties, breaking Caesar with the statistics of an English corpus (maximum likelihood, χ², n-grams, dictionary) and the toy scheme with exhaustive search, baby-step giant-step and Pollard's kangaroo, with hypothesis tests, historical context and discussion.",
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
      it: 'Il processo di penetrazione di m attaccanti su n sistemi come somma di incrementi i.i.d., nel modello di Bernoulli e in quello di Rademacher: traiettorie animate, distribuzioni del punteggio totale, medio e normalizzato al crescere di n, legge dei grandi numeri con i limiti di Chebyshev e Hoeffding, varianza sotto le tre normalizzazioni, teorema del limite centrale con la sua velocità (Berry-Esseen), il ruolo dei sistemi e degli attaccanti, test d’ipotesi e contesto storico.',
      en: 'The penetration process of m attackers on n systems as a sum of i.i.d. increments, in the Bernoulli and in the Rademacher model: animated trajectories, distributions of the total, average and normalized score as n grows, the law of large numbers with the Chebyshev and Hoeffding bounds, the variance under the three normalizations, the central limit theorem and its speed (Berry-Esseen), the role of systems and attackers, hypothesis tests and historical context.',
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
      it: 'Due esercizi in una pagina. Esercizio 1: gli integrali di Riemann e di Lebesgue calcolati numericamente sulle sette funzioni della consegna (sin x, x², i due gradini, |x - 0,5|, 1/√x, sin(x)/x), su due della pagina (sin(1/x) e il traffico di un server con un attacco) e su una scritta da chi legge: i risultati fianco a fianco, gli ordini di convergenza misurati e il costo in valori di f e in tempo; le due funzioni patologiche, Dirichlet e Thomae, calcolate con le frazioni esatte, perché ogni double è razionale. Esercizio 2: la funzione di ripartizione della normale, che non ha formula elementare (Liouville) ed erf scrive senza calcolare; integrazione numerica con cinque regole, la serie degli appunti e quella a termini positivi, le formule di Abramowitz e Stegun, e un metodo efficiente (serie più frazione continua di Laplace) con circa 15 cifre ovunque, confrontato con la tavola del NIST, di cui trova una cella sbagliata, e con mpmath; poi la tavola, i quantili, le soglie d’allarme di un IDS e una prova contro dati simulati. Monte Carlo, test d’ipotesi, contesto storico e una pagina di teoria.',
      en: 'Two exercises in one page. Exercise 1: the Riemann and Lebesgue integrals computed numerically on the seven functions of the assignment (sin x, x², the two step functions, |x - 0.5|, 1/√x, sin(x)/x), on two of the page (sin(1/x) and the traffic of a server under attack) and on one typed by the reader: the results side by side, the measured orders of convergence and the cost in values of f and in time; the two pathological functions, Dirichlet’s and Thomae’s, computed with exact fractions, because every double is rational. Exercise 2: the distribution function of the normal law, which has no elementary formula (Liouville) and which erf writes without computing it; numerical integration with five rules, the series of the notes and the one with positive terms, the formulas of Abramowitz and Stegun, and an efficient method (series plus Laplace’s continued fraction) with about 15 digits everywhere, checked against the NIST table, where it finds a wrong cell, and against mpmath; then the table, the quantiles, the alarm thresholds of an IDS and a test against simulated data. Monte Carlo, hypothesis tests, historical context and a theory page.',
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
      it: 'Due parti in una pagina. Part 1: la funzione di ripartizione della normale per integrazione numerica, con cinque regole scritte da zero (rettangoli, punti medi, trapezi, Simpson, Gauss-Legendre), tre modi di aggirare il -∞, la tavola dei libri ricostruita, i quantili con il metodo di Newton, le code lontane e le soglie d’allarme di un sistema che segnala anomalie, la prova di Kolmogorov-Smirnov. Part 2: gli integrali di Riemann e di Lebesgue di sei funzioni e di una scritta da chi legge, le monete di Lebesgue, chi vince e quando, il traffico di un server, Monte Carlo e la funzione di Dirichlet, con test d’ipotesi e contesto storico.',
      en: 'Two parts in one page. Part 1: the distribution function of the normal law by numerical integration, with five rules written from scratch (rectangles, midpoints, trapezoids, Simpson, Gauss-Legendre), three ways around -∞, the table of the books rebuilt, the quantiles with Newton’s method, the far tails and the alarm thresholds of a system that flags anomalies, the Kolmogorov-Smirnov test. Part 2: the Riemann and Lebesgue integrals of six functions and of one typed by the reader, Lebesgue’s coins, who wins and when, the traffic of a server, Monte Carlo and Dirichlet’s function, with hypothesis tests and historical context.',
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
