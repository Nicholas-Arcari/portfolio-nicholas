HOMEWORK #3 - STATISTICS
Il punteggio di penetrazione di m attaccanti su n sistemi:
legge dei grandi numeri e teorema del limite centrale.
Nicholas Arcari - Laurea magistrale in Cybersecurity, Sapienza Università di Roma

(English below)


CONTENUTO

  index.html     la pagina: si apre con un doppio clic, anche offline
  style.css      lo stile, con tema chiaro e scuro, per computer e telefono
  homework3.js   i calcoli, scritti da zero: i generatori SplitMix64 e
                 xoshiro128**, la simulazione degli m attaccanti nei modelli
                 di Bernoulli e di Rademacher, le leggi esatte (binomiale,
                 arcoseno di Feller), le distanze dalla normale, i limiti di
                 Chebyshev, Hoeffding e Berry-Esseen, i test d'ipotesi, i
                 grafici, l'animazione delle traiettorie e la riga di comando
  app.js         l'interfaccia e i testi, in italiano e in inglese
  package.json   dice a Node che homework3.js è uno script CommonJS
  README.txt     questo file


COME SI USA

  Nel browser: estrarre prima tutto l'archivio in una cartella, poi aprire
  index.html da lì (aperto dentro il gestore di archivi resta vuoto, perché
  vengono estratti solo i file cliccati). La pagina si apre in inglese:
  IT / EN in alto cambia lingua, e il pulsante Contents (Indice, in
  italiano) porta a qualunque sezione della consegna. La simulazione gira
  nella pagina stessa, a fette di pochi millisecondi: con i valori iniziali
  i risultati arrivano in qualche secondo, senza bloccarla, e intanto
  l'animazione delle traiettorie funziona già. I campi della sezione 1.3
  cambiano p, n, m e il seme, e tutte le sezioni seguono.

  Da terminale, con Node.js 14 o successivo:

    node homework3.js                     i valori iniziali della pagina:
                                          p = 0.2, n = 10000 sistemi,
                                          m = 5000 attaccanti, seme 2026
    node homework3.js --p 0.05            un'altra probabilità di
                                          penetrazione (da 0.01 a 0.99)
    node homework3.js --n 2000 --m 800    sistemi e attaccanti (da 10 a
                                          10000)
    node homework3.js --seed 7            un altro seme (da 0 a 4294967295)
    node homework3.js --random-seed       un seme casuale
    node homework3.js --epsilon 0.1       la tolleranza della legge dei
                                          grandi numeri (da 0.01 a 0.25)

  Il programma stampa le verifiche (i generatori contro il loro codice C di
  riferimento, le leggi e le funzioni speciali contro SciPy 1.17.1), media
  e varianza delle tre grandezze per ogni n con le pendenze della varianza,
  la probabilità P(|S_n/n - mu| > epsilon) simulata, esatta e con i limiti
  di Chebyshev e Hoeffding, la distanza di Kolmogorov dalla normale con il
  limite di Berry-Esseen, un istogramma di S_n/sqrt(n), i gruppi di
  attaccanti (il migliore di b, almeno uno oltre +3 sigma, i sistemi
  raggiunti), il cammino simmetrico (legge dell'arcoseno, ritorni a zero,
  massimo), il punteggio aggregato e i test d'ipotesi. Le opzioni sono
  controllate in modo stretto: qualunque valore non valido viene rifiutato.
  npm start equivale a node homework3.js.

  Da un altro script Node: const hw = require('./homework3.js'), poi per
  esempio hw.explore({ p: 0.1, n: 1000, m: 2000, seed: 1 }). Se il file
  viene copiato da solo in un progetto che usa i moduli ES, la libreria è
  globalThis.Homework3 dopo import './homework3.js'.


NOTE

  Nessuna dipendenza, nessuna connessione di rete, nessun dato salvato.
  Ogni attaccante ha un generatore suo, ricavato dal seme: con lo stesso
  seme la pagina, l'animazione e il terminale vedono gli stessi attaccanti
  e stampano gli stessi numeri; i tempi dipendono dal computer.
  homework3.js e app.js sono generati dagli stessi sorgenti della pagina
  online, quindi i numeri e i testi coincidono:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-3


---------------------------------------------------------------------------


CONTENTS

  index.html     the page: it opens with a double click, even offline
  style.css      the style, with light and dark theme, for computer and phone
  homework3.js   the computations, written from scratch: the SplitMix64 and
                 xoshiro128** generators, the simulation of the m attackers
                 in the Bernoulli and Rademacher models, the exact laws
                 (binomial, Feller's arcsine), the distances from the
                 normal, the Chebyshev, Hoeffding and Berry-Esseen bounds,
                 the hypothesis tests, the charts, the animation of the
                 trajectories and the command line
  app.js         the interface and the texts, in Italian and English
  package.json   tells Node that homework3.js is a CommonJS script
  README.txt     this file


HOW TO USE IT

  In a browser: first extract the whole archive into a folder, then open
  index.html from there (opened inside the archive manager it stays empty,
  because only the clicked file gets extracted). The page opens in English:
  IT / EN at the top switches language, and the Contents button jumps to
  any section of the assignment. The simulation runs in the page itself,
  in slices of a few milliseconds: with the initial values the results
  arrive in a few seconds, without freezing it, and meanwhile the
  animation of the trajectories already works. The fields of section 1.3
  change p, n, m and the seed, and every section follows.

  From a terminal, with Node.js 14 or later:

    node homework3.js                     the initial values of the page:
                                          p = 0.2, n = 10000 systems,
                                          m = 5000 attackers, seed 2026
    node homework3.js --p 0.05            another penetration probability
                                          (from 0.01 to 0.99)
    node homework3.js --n 2000 --m 800    systems and attackers (from 10
                                          to 10000)
    node homework3.js --seed 7            another seed (from 0 to
                                          4294967295)
    node homework3.js --random-seed       a random seed
    node homework3.js --epsilon 0.1       the tolerance of the law of large
                                          numbers (from 0.01 to 0.25)

  The program prints the checks (the generators against their reference C
  code, the laws and special functions against SciPy 1.17.1), mean and
  variance of the three quantities at every n with the slopes of the
  variance, the probability P(|S_n/n - mu| > epsilon) simulated, exact and
  with the Chebyshev and Hoeffding bounds, the Kolmogorov distance from the
  normal with the Berry-Esseen bound, a histogram of S_n/sqrt(n), the
  groups of attackers (the best of b, at least one beyond +3 sigma, the
  systems reached), the symmetric walk (arcsine law, returns to zero,
  maximum), the aggregate score and the hypothesis tests. Options are
  checked strictly: any invalid value is refused. npm start is the same as
  node homework3.js.

  From another Node script: const hw = require('./homework3.js'), then for
  example hw.explore({ p: 0.1, n: 1000, m: 2000, seed: 1 }). If the file is
  copied alone into a project that uses ES modules, the library is
  globalThis.Homework3 after import './homework3.js'.


NOTES

  No dependencies, no network connection, nothing stored. Every attacker
  has a generator of its own, derived from the seed: with the same seed
  the page, the animation and the terminal see the same attackers and
  print the same numbers; the times depend on the computer. homework3.js
  and app.js are generated from the same sources as the online page, so
  numbers and texts match:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-3
