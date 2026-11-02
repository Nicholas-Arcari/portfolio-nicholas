HOMEWORK #4 - STATISTICS
Le formule ricorsive di Welford, e la media e la varianza campionarie
di m hacker su n sistemi.
Nicholas Arcari - Laurea magistrale in Cybersecurity, Sapienza Università di Roma

(English below)


CONTENUTO

  index.html     la pagina: si apre con un doppio clic, anche offline
  style.css      lo stile, con tema chiaro e scuro, per computer e telefono
  homework4.js   i calcoli, scritti da zero: le formule ricorsive di Knuth
                 e di Welford (le tre righe della Part 1), la formula da
                 manuale e quella a due passate per confronto, i generatori
                 SplitMix64 e xoshiro128**, le quattro leggi dei punteggi
                 con i loro momenti esatti, la simulazione degli m hacker,
                 la t di Student e il chi quadrato, i test d'ipotesi, i
                 grafici, l'animazione e la riga di comando
  app.js         l'interfaccia e i testi, in italiano e in inglese
  package.json   dice a Node che homework4.js è uno script CommonJS
  README.txt     questo file


COME SI USA

  Nel browser: estrarre prima tutto l'archivio in una cartella, poi aprire
  index.html da lì (aperto dentro il gestore di archivi resta vuoto, perché
  vengono estratti solo i file cliccati). La pagina si apre in inglese:
  IT / EN in alto cambia lingua, e il pulsante Contents (Indice, in
  italiano) porta a qualunque sezione della consegna. La Part 1 funziona
  subito: nella sezione 1.5 si possono scrivere altri dati e seguire le
  formule passo per passo. La simulazione della Part 2 gira nella pagina
  stessa, a fette di pochi millisecondi: con i valori iniziali i risultati
  arrivano in qualche secondo, senza bloccarla, e intanto l'animazione
  funziona già. La sezione 2.1 sceglie la legge dei punteggi, i campi
  della 2.2 cambiano p, n, m e il seme, e tutte le sezioni seguono.

  Da terminale, con Node.js 14 o successivo:

    node homework4.js                     i valori iniziali della pagina:
                                          esito dell'Homework #3 +
                                          punteggio, p = 0.2, n = 10000
                                          sistemi, m = 5000 hacker, seme 2026
    node homework4.js --dist uniform      un'altra legge dei punteggi:
                                          outcome, binomial, uniform, beta
    node homework4.js --p 0.5             un'altra probabilità di successo
                                          (da 0.01 a 0.99, solo per outcome)
    node homework4.js --n 2000 --m 800    sistemi e hacker (da 10 a 10000)
    node homework4.js --seed 7            un altro seme (da 0 a 4294967295)
    node homework4.js --random-seed       un seme casuale
    node homework4.js --data "1 2 3 10"   i dati della Part 1 (da 2 a 40
                                          numeri)

  Il programma stampa le verifiche (le formule ricorsive contro il modulo
  statistics di Python e NumPy, i generatori contro il loro codice C di
  riferimento, le leggi e le funzioni speciali contro SciPy 1.17.1 e le
  frazioni di Python), le tre righe di codice, la tabella passo per passo
  sui dati, la cancellazione della formula da manuale contro Welford e due
  passate, poi per la Part 2 la legge scelta con i suoi momenti, le medie
  delle medie e delle varianze campionarie per ogni n contro μ e σ², la
  variabilità fra gli hacker con le pendenze, la copertura degli
  intervalli t e chi quadrato, un istogramma delle medie a n = 10 e i test
  d'ipotesi. Le opzioni sono controllate in modo stretto: qualunque valore
  non valido viene rifiutato. npm start equivale a node homework4.js.

  Da un altro script Node: const hw = require('./homework4.js'), poi per
  esempio hw.welford([2, 4, 4, 4, 5, 5, 7, 9]) oppure
  hw.explore({ dist: 'beta', n: 1000, m: 2000, seed: 1 }). Se il file viene
  copiato da solo in un progetto che usa i moduli ES, la libreria è
  globalThis.Homework4 dopo import './homework4.js'.


NOTE

  Nessuna dipendenza, nessuna connessione di rete, nessun dato salvato.
  Ogni hacker ha due generatori suoi, ricavati dal seme: il primo decide i
  successi ed è quello dell'attaccante dell'Homework #3, il secondo dà i
  punteggi. Con lo stesso seme la pagina, l'animazione e il terminale
  vedono gli stessi hacker e stampano gli stessi numeri; i tempi dipendono
  dal computer. homework4.js e app.js sono generati dagli stessi sorgenti
  della pagina online, quindi i numeri e i testi coincidono:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-4


---------------------------------------------------------------------------


CONTENTS

  index.html     the page: it opens with a double click, even offline
  style.css      the style, with light and dark theme, for computer and phone
  homework4.js   the computations, written from scratch: the recurrences of
                 Knuth and Welford (the three lines of Part 1), the
                 textbook and the two-pass formulas for comparison, the
                 SplitMix64 and xoshiro128** generators, the four laws of
                 the scores with their exact moments, the simulation of
                 the m hackers, Student's t and the chi-square law, the
                 hypothesis tests, the charts, the animation and the
                 command line
  app.js         the interface and the texts, in Italian and English
  package.json   tells Node that homework4.js is a CommonJS script
  README.txt     this file


HOW TO USE IT

  In a browser: first extract the whole archive into a folder, then open
  index.html from there (opened inside the archive manager it stays empty,
  because only the clicked file gets extracted). The page opens in English:
  IT / EN at the top switches language, and the Contents button jumps to
  any section of the assignment. Part 1 works at once: in section 1.5 other
  data can be written and the formulas followed step by step. The
  simulation of Part 2 runs in the page itself, in slices of a few
  milliseconds: with the initial values the results arrive in a few
  seconds, without freezing it, and meanwhile the animation already works.
  Section 2.1 chooses the law of the scores, the fields of section 2.2
  change p, n, m and the seed, and every section follows.

  From a terminal, with Node.js 14 or later:

    node homework4.js                     the initial values of the page:
                                          outcome of Homework #3 + score,
                                          p = 0.2, n = 10000 systems,
                                          m = 5000 hackers, seed 2026
    node homework4.js --dist uniform      another law of the scores:
                                          outcome, binomial, uniform, beta
    node homework4.js --p 0.5             another probability of success
                                          (from 0.01 to 0.99, outcome only)
    node homework4.js --n 2000 --m 800    systems and hackers (from 10 to
                                          10000)
    node homework4.js --seed 7            another seed (from 0 to
                                          4294967295)
    node homework4.js --random-seed       a random seed
    node homework4.js --data "1 2 3 10"   the data of Part 1 (from 2 to 40
                                          numbers)

  The program prints the checks (the recurrences against Python's
  statistics module and NumPy, the generators against their reference C
  code, the laws and special functions against SciPy 1.17.1 and Python
  fractions), the three lines of code, the step-by-step table on the data,
  the cancellation of the textbook formula against Welford and two passes,
  then for Part 2 the chosen law with its moments, the averages of the
  sampling means and variances at every n against mu and sigma^2, the
  variability across the hackers with the slopes, the coverage of the t
  and chi-square intervals, a histogram of the means at n = 10 and the
  hypothesis tests. Options are checked strictly: any invalid value is
  refused. npm start is the same as node homework4.js.

  From another Node script: const hw = require('./homework4.js'), then for
  example hw.welford([2, 4, 4, 4, 5, 5, 7, 9]) or
  hw.explore({ dist: 'beta', n: 1000, m: 2000, seed: 1 }). If the file is
  copied alone into a project that uses ES modules, the library is
  globalThis.Homework4 after import './homework4.js'.


NOTES

  No dependencies, no network connection, nothing stored. Every hacker has
  two generators of its own, derived from the seed: the first decides the
  successes and is the one of the attacker of Homework #3, the second gives
  the scores. With the same seed the page, the animation and the terminal
  see the same hackers and print the same numbers; the times depend on the
  computer. homework4.js and app.js are generated from the same sources as
  the online page, so numbers and texts match:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-4
