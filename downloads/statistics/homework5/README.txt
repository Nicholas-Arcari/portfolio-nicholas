HOMEWORK #5 - STATISTICS
Gli integrali di Riemann e di Lebesgue calcolati numericamente, e la
funzione di ripartizione della normale.
Nicholas Arcari - Laurea magistrale in Cybersecurity, Sapienza Università di Roma

(English below)


CONTENUTO

  index.html     la pagina: si apre con un doppio clic, anche offline
  style.css      lo stile, con tema chiaro e scuro, per computer e telefono
  homework5.js   i calcoli, scritti da zero: le somme di Riemann e di
                 Darboux, le somme di Lebesgue con gli insiemi di livello,
                 il loro costo, Dirichlet e Thomae con le frazioni esatte,
                 un lettore di formule, Monte Carlo; per la normale cinque
                 regole di quadratura (rettangoli, punti medi, trapezi,
                 Simpson, Gauss-Legendre con i nodi trovati con il metodo
                 di Newton), tre modi di aggirare il -infinito, la serie
                 degli appunti, quella a termini positivi, la frazione
                 continua di Laplace, le formule di Abramowitz e Stegun, il
                 metodo della pagina, la tavola del NIST e i valori di
                 mpmath; poi la tavola, i quantili e le code, i generatori
                 SplitMix64 e xoshiro128**, Box-Muller, il test di
                 Kolmogorov-Smirnov, i grafici e la riga di comando
  app.js         l'interfaccia e i testi, in italiano e in inglese
  package.json   dice a Node che homework5.js è uno script CommonJS
  README.txt     questo file


COME SI USA

  Nel browser: estrarre prima tutto l'archivio in una cartella, poi aprire
  index.html da lì (aperto dentro il gestore di archivi resta vuoto, perché
  vengono estratti solo i file cliccati). La pagina si apre in inglese:
  IT / EN in alto cambia lingua, e il pulsante Contents (Indice, in
  italiano) porta a qualunque sezione. Gran parte della pagina funziona
  subito: le strisce e le fette, le monete di Lebesgue, la funzione scritta
  da voi, Dirichlet e Thomae, Liouville, le serie, il confronto con il NIST,
  l'area sotto la campana, la soglia d'allarme. Le simulazioni e le misure
  (i risultati e i costi di ogni funzione, Monte Carlo, i tempi dei metodi
  per la normale, i dati contro la Φ numerica) girano nella pagina stessa,
  a fette di pochi millisecondi: con i valori iniziali i risultati arrivano
  in qualche secondo, senza bloccarla. I campi delle sezioni 1.10 e 2.15
  cambiano i punti e le ripetizioni di Monte Carlo, il seme e i valori
  simulati, e tutte le sezioni seguono.

  Da terminale, con Node.js 14 o successivo:

    node homework5.js                         i valori iniziali della
                                              pagina, seme 2026
    node homework5.js --function unbounded    una sola funzione
                                              dell'Esercizio 1: sine,
                                              square, jump, vee, unbounded,
                                              indicator, sinc, oscillating,
                                              traffic
    node homework5.js --formula "x*sin(1/x)" --a 0 --b 1
                                              una funzione vostra, sui suoi
                                              estremi
    node homework5.js --z 2.5 --rule gauss --n 8
                                              Φ in un altro punto, con
                                              un'altra regola e un altro n
                                              (Simpson vuole n pari, Gauss
                                              al massimo 64 nodi)
    node homework5.js --mu 100 --sigma 15 --z 1
                                              una normale qualunque: x =
                                              mu + sigma z
    node homework5.js --seed 7                un altro seme (da 0 a
                                              4294967295)
    node homework5.js --random-seed           un seme casuale
    node homework5.js --sample 50000 --points 2000 --reps 500
                                              i valori simulati (da 100 a
                                              100000), i punti di Monte
                                              Carlo (da 10 a 10000) e le
                                              ripetizioni (da 100 a 2000)

  Il programma stampa le verifiche (contro mpmath, NumPy, SciPy 1.17.1, il
  codice C di riferimento dei generatori e una versione Python scritta a
  parte), poi per l'Esercizio 1 le somme di Riemann e di Lebesgue di ogni
  funzione con gli ordini di convergenza misurati, i risultati fianco a
  fianco, il costo in valori di f e in tempo, Dirichlet e Thomae con le
  frazioni esatte, le ore sopra ogni soglia del traffico e Monte Carlo; per
  l'Esercizio 2 la tabella di Liouville, la regola 68-95-99,7, Φ con le
  cinque regole, i tre modi di evitare il -infinito, la convergenza, le due
  serie, precisione e tempo di ogni metodo, la tavola del NIST cella per
  cella, il confronto in alcuni punti, la tavola della normale, i quantili
  con il metodo di Newton, le code e le soglie d'allarme; infine i dati
  simulati e i test d'ipotesi. Le opzioni sono controllate in modo stretto:
  qualunque valore non valido viene rifiutato. npm start equivale a
  node homework5.js.

  Da un altro script Node: const hw = require('./homework5.js'), poi per
  esempio hw.cdfOurs(1.96), hw.lebesgueSums(Math.sin, 0, Math.PI, 100).midpoint
  oppure hw.explore({ seed: 1, sample: 1000, points: 500, reps: 200 }). Se il
  file viene copiato da solo in un progetto che usa i moduli ES, la libreria
  è globalThis.Homework5 dopo import './homework5.js'.


NOTE

  Nessuna dipendenza, nessuna connessione di rete, nessun dato salvato.
  La formula scritta nella pagina è letta da un piccolo analizzatore e non
  passa mai da eval. La tavola del NIST e i valori di mpmath sono copiati
  dentro homework5.js: la pagina li confronta senza scaricare nulla. Con lo
  stesso seme la pagina e il terminale vedono gli stessi dati simulati e
  stampano gli stessi numeri; i tempi dipendono dal computer. homework5.js
  e app.js sono generati dagli stessi sorgenti della pagina online, quindi
  i numeri e i testi coincidono:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-5


---------------------------------------------------------------------------


CONTENTS

  index.html     the page: it opens with a double click, even offline
  style.css      the style, with light and dark theme, for computer and phone
  homework5.js   the computations, written from scratch: the Riemann and
                 Darboux sums, the Lebesgue sums with their level sets,
                 their cost, Dirichlet's and Thomae's functions with exact
                 fractions, a formula reader, Monte Carlo; for the normal
                 law five quadrature rules (rectangles, midpoints,
                 trapezoids, Simpson, Gauss-Legendre with its nodes found by
                 Newton's method), three ways around -infinity, the series
                 of the notes, the one with positive terms, Laplace's
                 continued fraction, the formulas of Abramowitz and Stegun,
                 the method of the page, the NIST table and the values of
                 mpmath; then the table, quantiles and tails, the SplitMix64
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
  any section. Most of the page works at once: the strips and the slices,
  Lebesgue's coins, your own function, Dirichlet and Thomae, Liouville, the
  series, the comparison with NIST, the area under the bell, the alarm
  threshold. The simulations and the measures (the results and costs of
  every function, Monte Carlo, the times of the methods for the normal law,
  the data against the numerical Φ) run in the page itself, in slices of a
  few milliseconds: with the initial values the results arrive in a few
  seconds, without freezing it. The fields of sections 1.10 and 2.15 change
  the points and repetitions of Monte Carlo, the seed and the simulated
  values, and every section follows.

  From a terminal, with Node.js 14 or later:

    node homework5.js                         the initial values of the
                                              page, seed 2026
    node homework5.js --function unbounded    a single function of
                                              Exercise 1: sine, square,
                                              jump, vee, unbounded,
                                              indicator, sinc, oscillating,
                                              traffic
    node homework5.js --formula "x*sin(1/x)" --a 0 --b 1
                                              a function of your own, on
                                              its ends
    node homework5.js --z 2.5 --rule gauss --n 8
                                              Φ at another point, with
                                              another rule and another n
                                              (Simpson wants an even n,
                                              Gauss at most 64 nodes)
    node homework5.js --mu 100 --sigma 15 --z 1
                                              any normal law: x =
                                              mu + sigma z
    node homework5.js --seed 7                another seed (from 0 to
                                              4294967295)
    node homework5.js --random-seed           a random seed
    node homework5.js --sample 50000 --points 2000 --reps 500
                                              the simulated values (from
                                              100 to 100000), the points of
                                              Monte Carlo (from 10 to
                                              10000) and the repetitions
                                              (from 100 to 2000)

  The program prints the checks (against mpmath, NumPy, SciPy 1.17.1, the
  reference C code of the generators and a separate Python version), then
  for Exercise 1 the Riemann and Lebesgue sums of every function with the
  measured orders of convergence, the results side by side, the cost in
  values of f and in time, Dirichlet and Thomae with exact fractions, the
  hours above every threshold of the traffic and Monte Carlo; for
  Exercise 2 the table of Liouville, the 68-95-99.7 rule, Φ with the five
  rules, the three ways of avoiding -infinity, the convergence, the two
  series, the accuracy and time of every method, the NIST table cell by
  cell, the comparison at a few points, the table of the normal law, the
  quantiles with Newton's method, the tails and the alarm thresholds;
  finally the simulated data and the hypothesis tests. Options are checked
  strictly: any invalid value is refused. npm start is the same as
  node homework5.js.

  From another Node script: const hw = require('./homework5.js'), then for
  example hw.cdfOurs(1.96), hw.lebesgueSums(Math.sin, 0, Math.PI, 100).midpoint
  or hw.explore({ seed: 1, sample: 1000, points: 500, reps: 200 }). If the
  file is copied alone into a project that uses ES modules, the library is
  globalThis.Homework5 after import './homework5.js'.


NOTES

  No dependencies, no network connection, nothing stored. The formula
  typed in the page is read by a small parser and never goes through eval.
  The NIST table and the values of mpmath are copied inside homework5.js:
  the page compares them without downloading anything. With the same seed
  the page and the terminal see the same simulated data and print the same
  numbers; the times depend on the computer. homework5.js and app.js are
  generated from the same sources as the online page, so numbers and texts
  match:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-5
