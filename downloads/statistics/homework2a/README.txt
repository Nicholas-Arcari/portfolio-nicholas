HOMEWORK #2 - STATISTICS
Uno schema giocattolo su curva ellittica e il cifrario di Cesare:
cifratura, crittanalisi statistica e attacchi.
Nicholas Arcari - Laurea magistrale in Cybersecurity, Sapienza Università di Roma

(English below)


AVVERTENZA

  Codice didattico. Lo schema su curva è debole di proposito (chiavi
  private di 32 bit, nessuna autenticazione) e l'aritmetica non è a tempo
  costante: non usarlo per proteggere nulla.


CONTENUTO

  index.html     la pagina: si apre con un doppio clic, anche offline
  style.css      lo stile, con tema chiaro e scuro, per computer e telefono
  homework2a.js  i calcoli, scritti da zero: SHA-256, l'aritmetica di
                 secp256k1, lo schema ElGamal su curva con chiavi di 32 bit,
                 il cifrario di Cesare, il corpus (Alice's Adventures in
                 Wonderland, di pubblico dominio) e i suoi modelli a
                 n-grammi, l'attacco statistico, la ricerca esaustiva,
                 baby-step giant-step e il canguro di Pollard, gli
                 esperimenti statistici e la riga di comando
  app.js         l'interfaccia e i testi, in italiano e in inglese
  package.json   dice a Node che homework2a.js è uno script CommonJS
  README.txt     questo file


COME SI USA

  Nel browser: estrarre prima tutto l'archivio in una cartella, poi aprire
  index.html da lì (aperto dentro il gestore di archivi resta vuoto, perché
  vengono estratti solo i file cliccati). La pagina si apre in inglese:
  IT / EN in alto cambia lingua, e il pulsante Contents (Indice, in
  italiano) porta a qualunque sezione della consegna. Gli esperimenti e gli
  attacchi girano nella pagina stessa, a fette di pochi millisecondi: i
  risultati arrivano in qualche secondo, senza bloccarla.

  Da terminale, con Node.js 14 o successivo:

    node homework2a.js                      la chiave, il messaggio e lo
                                            spostamento iniziali della pagina
    node homework2a.js --key 1000           un'altra chiave privata (da 1
                                            a 4294967295)
    node homework2a.js --random-key         una chiave privata casuale
    node homework2a.js --message "Attack at dawn" --shift 13
    node homework2a.js --random-nonces      nonce dal generatore
                                            crittografico invece che
                                            riproducibili
    node homework2a.js --no-stats           senza gli esperimenti statistici

  Il programma stampa le verifiche (vettori di SHA-256, multipli di G,
  andata e ritorno dei due cifrari), lo schema passo per passo (chiavi,
  primi blocchi del cifrato, decifratura), il cifrario di Cesare, l'attacco
  statistico al cifrato di Cesare, i tre attacchi alla chiave pubblica con
  il messaggio decifrato senza la chiave, la variante con un solo nonce e
  la malleabilità; poi, se non si chiede --no-stats, i modelli della lingua,
  il tasso di successo di ogni metodo per lunghezza del cifrato, i test
  d'ipotesi e il costo degli attacchi al crescere della chiave. Le opzioni
  sono controllate in modo stretto: qualunque valore non valido viene
  rifiutato. npm start equivale a node homework2a.js.

  Da un altro script Node: const hw = require('./homework2a.js'), poi per
  esempio hw.toyScheme(1000n).encrypt('ciao').blocks. Se il file viene
  copiato da solo in un progetto che usa i moduli ES, la libreria è
  globalThis.Homework2a dopo import './homework2a.js'.


NOTE

  Nessuna dipendenza, nessuna connessione di rete, nessun dato salvato. Gli
  esperimenti usano scelte casuali da un generatore a seme fisso, quindi
  il conteggio delle operazioni e i tassi di successo sono gli stessi
  ovunque; i tempi dipendono dal computer. Il corpus viene ricontrollato
  con la sua impronta SHA-256 all'avvio. homework2a.js e app.js sono
  generati dagli stessi sorgenti della pagina online, quindi i numeri e i
  testi coincidono:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-2a


---------------------------------------------------------------------------


WARNING

  Educational code. The curve scheme is weak on purpose (32-bit private
  keys, no authentication) and the arithmetic is not constant-time: never
  use it to protect anything.


CONTENTS

  index.html     the page: it opens with a double click, even offline
  style.css      the style, with light and dark theme, for computer and phone
  homework2a.js  the computations, written from scratch: SHA-256, the
                 arithmetic of secp256k1, elliptic-curve ElGamal with 32-bit
                 keys, the Caesar cipher, the corpus (Alice's Adventures in
                 Wonderland, in the public domain) and its n-gram models,
                 the statistical attack, exhaustive search, baby-step
                 giant-step and Pollard's kangaroo, the statistical
                 experiments and the command line
  app.js         the interface and the texts, in Italian and English
  package.json   tells Node that homework2a.js is a CommonJS script
  README.txt     this file


HOW TO USE IT

  In a browser: first extract the whole archive into a folder, then open
  index.html from there (opened inside the archive manager it stays empty,
  because only the clicked file gets extracted). The page opens in English:
  IT / EN at the top switches language, and the Contents button jumps to
  any section of the assignment. The experiments and the attacks run in
  the page itself, in slices of a few milliseconds: the results arrive in
  a few seconds, without freezing it.

  From a terminal, with Node.js 14 or later:

    node homework2a.js                      the starting key, message and
                                            shift of the page
    node homework2a.js --key 1000           another private key (from 1 to
                                            4294967295)
    node homework2a.js --random-key         a random private key
    node homework2a.js --message "Attack at dawn" --shift 13
    node homework2a.js --random-nonces      nonces from the cryptographic
                                            generator instead of
                                            reproducible ones
    node homework2a.js --no-stats           without the statistical
                                            experiments

  The program prints the checks (SHA-256 vectors, multiples of G, round
  trips of both ciphers), the scheme step by step (keys, first blocks of
  the ciphertext, decryption), the Caesar cipher, the statistical attack on
  the Caesar ciphertext, the three attacks on the public key with the
  message decrypted without the key, the variant with a single nonce and
  the malleability; then, unless --no-stats is given, the language models,
  the success rate of every method by ciphertext length, the hypothesis
  tests and the cost of the attacks as the key grows. Options are checked
  strictly: any invalid value is refused. npm start is the same as
  node homework2a.js.

  From another Node script: const hw = require('./homework2a.js'), then for
  example hw.toyScheme(1000n).encrypt('hello').blocks. If the file is
  copied alone into a project that uses ES modules, the library is
  globalThis.Homework2a after import './homework2a.js'.


NOTES

  No dependencies, no network connection, nothing stored. The experiments
  make their random choices with a fixed-seed generator, so the counts of
  operations and the success rates are the same everywhere; the times
  depend on the computer. The corpus is checked against its SHA-256
  fingerprint at start-up. homework2a.js and app.js are generated from the
  same sources as the online page, so numbers and texts match:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-2a
