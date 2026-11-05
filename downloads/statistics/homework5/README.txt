HOMEWORK #5 - STATISTICS
La funzione di ripartizione della normale per integrazione numerica, e gli
integrali di Riemann e di Lebesgue calcolati numericamente.
Nicholas Arcari - Laurea magistrale in Cybersecurity, Sapienza Università di Roma

(English below)


CONTENUTO

  index.html     la pagina: si apre con un doppio clic, anche offline
  style.css      lo stile, con tema chiaro e scuro, per computer e telefono
  homework5.js   i calcoli, scritti da zero: cinque regole di quadratura
                 (rettangoli, punti medi, trapezi, Simpson, Gauss-Legendre
                 con i nodi trovati con il metodo di Newton), la funzione
                 di ripartizione della normale con tre modi di aggirare il
                 -infinito, la tavola, i quantili e le code, le somme di
                 Riemann e di Darboux, le somme di Lebesgue con gli insiemi
                 di livello, un lettore di formule, Monte Carlo, i
                 generatori SplitMix64 e xoshiro128**, Box-Muller, il test
                 di Kolmogorov-Smirnov, i grafici e la riga di comando
  app.js         l'interfaccia e i testi, in italiano e in inglese
  package.json   dice a Node che homework5.js è uno script CommonJS
  README.txt     questo file


COME SI USA

  Nel browser: estrarre prima tutto l'archivio in una cartella, poi aprire
  index.html da lì (aperto dentro il gestore di archivi resta vuoto, perché
  vengono estratti solo i file cliccati). La pagina si apre in inglese:
  IT / EN in alto cambia lingua, e il pulsante Contents (Indice, in
  italiano) porta a qualunque sezione. La Part 1 e gli esempi interattivi
  funzionano subito: l'area sotto la campana con le cinque regole, la
  soglia d'allarme, le monete di Lebesgue, le strisce e le fette, la
  funzione scritta da voi. Le simulazioni (i dati contro la Φ numerica,
  Monte Carlo su ogni funzione, il confronto fra Riemann e Lebesgue) girano
  nella pagina stessa, a fette di pochi millisecondi: con i valori iniziali
  i risultati arrivano in qualche secondo, senza bloccarla. I campi delle
  sezioni 1.8 e 2.7 cambiano il seme, i valori simulati, i punti e le
  ripetizioni di Monte Carlo, e tutte le sezioni seguono.

  Da terminale, con Node.js 14 o successivo:

    node homework5.js                         i valori iniziali della
                                              pagina: Φ(1,96) con le cinque
                                              regole e n = 16, seme 2026
    node homework5.js --z 2.5 --rule gauss --n 8
                                              un altro punto, un'altra
                                              regola, un altro n (Simpson
                                              vuole n pari, Gauss al
                                              massimo 64 nodi)
    node homework5.js --mu 100 --sigma 15 --z 1
                                              una normale qualunque: x =
                                              mu + sigma z
    node homework5.js --function unbounded    una sola funzione della Part 2:
                                              square, bell, steps,
                                              oscillating, unbounded,
                                              traffic
    node homework5.js --formula "x*sin(1/x)" --a 0 --b 1
                                              una funzione vostra, sui suoi
                                              estremi
    node homework5.js --seed 7                un altro seme (da 0 a
                                              4294967295)
    node homework5.js --random-seed           un seme casuale
    node homework5.js --sample 50000 --points 2000 --reps 500
                                              i valori simulati (da 100 a
                                              100000), i punti di Monte
                                              Carlo (da 10 a 10000) e le
                                              ripetizioni (da 100 a 2000)

  Il programma stampa le verifiche (i nodi di Gauss contro la loro formula
  chiusa e NumPy, Φ, le code e i quantili contro mpmath, gli integrali
  esatti contro mpmath, la t di Student e la legge di Kolmogorov contro
  SciPy 1.17.1, i generatori contro il loro codice C di riferimento e una
  versione Python scritta a parte), poi per la Part 1 Φ con le cinque
  regole, i tre modi di evitare il -infinito, la convergenza con gli
  ordini misurati, la tavola della normale, i quantili con il metodo di
  Newton, le code nei due modi e le soglie d'allarme; per la Part 2 le
  somme di Riemann e di Lebesgue di ogni funzione, le ore sopra ogni
  soglia del traffico, Monte Carlo e i test d'ipotesi. Le opzioni sono
  controllate in modo stretto: qualunque valore non valido viene
  rifiutato. npm start equivale a node homework5.js.

  Da un altro script Node: const hw = require('./homework5.js'), poi per
  esempio hw.cdfStandard(1.96, { rule: 'simpson', n: 16 }),
  hw.lebesgueSums(Math.sin, 0, Math.PI, 100).midpoint oppure
  hw.explore({ seed: 1, sample: 1000, points: 500, reps: 200 }). Se il file
  viene copiato da solo in un progetto che usa i moduli ES, la libreria è
  globalThis.Homework5 dopo import './homework5.js'.


NOTE

  Nessuna dipendenza, nessuna connessione di rete, nessun dato salvato.
  La formula scritta nella pagina è letta da un piccolo analizzatore e non
  passa mai da eval. Con lo stesso seme la pagina e il terminale vedono gli
  stessi dati simulati e stampano gli stessi numeri; i tempi dipendono dal
  computer. homework5.js e app.js sono generati dagli stessi sorgenti della
  pagina online, quindi i numeri e i testi coincidono:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-5


---------------------------------------------------------------------------


CONTENTS

  index.html     the page: it opens with a double click, even offline
  style.css      the style, with light and dark theme, for computer and phone
  homework5.js   the computations, written from scratch: five quadrature
                 rules (rectangles, midpoints, trapezoids, Simpson,
                 Gauss-Legendre with its nodes found by Newton's method),
                 the distribution function of the normal law with three
                 ways around -infinity, its table, quantiles and tails, the
                 Riemann and Darboux sums, the Lebesgue sums with their
                 level sets, a formula reader, Monte Carlo, the SplitMix64
                 and xoshiro128** generators, Box-Muller, the
                 Kolmogorov-Smirnov test, the charts and the command line
  app.js         the interface and the texts, in Italian and English
  package.json   tells Node that homework5.js is a CommonJS script
  README.txt     this file


HOW TO USE IT

  In a browser: first extract the whole archive into a folder, then open
  index.html from there (opened inside the archive manager it stays empty,
  because only the clicked file gets extracted). The page opens in English:
  IT / EN at the top switches language, and the Contents button jumps to
  any section. Part 1 and the interactive examples work at once: the area
  under the bell with the five rules, the alarm threshold, Lebesgue's
  coins, the strips and the slices, your own function. The simulations
  (the data against the numerical Φ, Monte Carlo on every function, the
  comparison of Riemann and Lebesgue) run in the page itself, in slices of
  a few milliseconds: with the initial values the results arrive in a few
  seconds, without freezing it. The fields of sections 1.8 and 2.7 change
  the seed, the simulated values, and the points and repetitions of Monte
  Carlo, and every section follows.

  From a terminal, with Node.js 14 or later:

    node homework5.js                         the initial values of the
                                              page: Φ(1.96) with the five
                                              rules and n = 16, seed 2026
    node homework5.js --z 2.5 --rule gauss --n 8
                                              another point, another rule,
                                              another n (Simpson wants an
                                              even n, Gauss at most 64
                                              nodes)
    node homework5.js --mu 100 --sigma 15 --z 1
                                              any normal law: x =
                                              mu + sigma z
    node homework5.js --function unbounded    a single function of Part 2:
                                              square, bell, steps,
                                              oscillating, unbounded,
                                              traffic
    node homework5.js --formula "x*sin(1/x)" --a 0 --b 1
                                              a function of your own, on
                                              its ends
    node homework5.js --seed 7                another seed (from 0 to
                                              4294967295)
    node homework5.js --random-seed           a random seed
    node homework5.js --sample 50000 --points 2000 --reps 500
                                              the simulated values (from
                                              100 to 100000), the points of
                                              Monte Carlo (from 10 to
                                              10000) and the repetitions
                                              (from 100 to 2000)

  The program prints the checks (the Gauss nodes against their closed form
  and NumPy, Φ, its tails and quantiles against mpmath, the exact integrals
  against mpmath, Student's t and Kolmogorov's law against SciPy 1.17.1,
  the generators against their reference C code and a separate Python
  version), then for Part 1 Φ with the five rules, the three ways of
  avoiding -infinity, the convergence with the measured orders, the table
  of the normal, the quantiles with Newton's method, the tails in the two
  ways and the alarm thresholds; for Part 2 the Riemann and Lebesgue sums
  of every function, the hours above every threshold of the traffic, Monte
  Carlo and the hypothesis tests. Options are checked strictly: any invalid
  value is refused. npm start is the same as node homework5.js.

  From another Node script: const hw = require('./homework5.js'), then for
  example hw.cdfStandard(1.96, { rule: 'simpson', n: 16 }),
  hw.lebesgueSums(Math.sin, 0, Math.PI, 100).midpoint or
  hw.explore({ seed: 1, sample: 1000, points: 500, reps: 200 }). If the
  file is copied alone into a project that uses ES modules, the library is
  globalThis.Homework5 after import './homework5.js'.


NOTES

  No dependencies, no network connection, nothing stored. The formula
  typed in the page is read by a small parser and never goes through eval.
  With the same seed the page and the terminal see the same simulated data
  and print the same numbers; the times depend on the computer.
  homework5.js and app.js are generated from the same sources as the
  online page, so numbers and texts match:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-5
