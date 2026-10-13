HOMEWORK #2 - STATISTICS
Dalla frase mnemonica all'indirizzo Ethereum: hashing, derivazione delle
chiavi e primitive crittografiche.
Nicholas Arcari - Laurea magistrale in Cybersecurity, Sapienza Università di Roma

(English below)


AVVERTENZA

  Codice didattico. Non scrivere mai in questo programma, né in nessun
  altro, la frase di un wallet vero, e non usarlo con fondi veri: segue gli
  standard ed è verificato con i loro vettori di test, ma non è protetto
  (nessuna aritmetica a tempo costante, segreti lasciati in memoria).


CONTENUTO

  index.html     la pagina: si apre con un doppio clic, anche offline
  style.css      lo stile, con tema chiaro e scuro, per computer e telefono
  homework2.js   i calcoli, scritti da zero: SHA-256, SHA-512, HMAC, PBKDF2,
                 RIPEMD-160, Keccak-256 e SHA3-256, secp256k1, BIP-39, BIP-32,
                 BIP-44, EIP-55, i vettori di test ufficiali, l'esplorazione
                 statistica e la riga di comando
  app.js         l'interfaccia e i testi, in italiano e in inglese
  package.json   dice a Node che homework2.js è uno script CommonJS
  README.txt     questo file


COME SI USA

  Nel browser: aprire index.html. La lingua si cambia con IT / EN in alto,
  e il pulsante Indice porta a qualunque sezione della consegna.

  Da terminale, con Node.js 14 o successivo:

    node homework2.js                       la frase di prova pubblica di
                                            Hardhat e Foundry, account 0
    node homework2.js --index 1             l'account 1 (m/44'/60'/0'/0/1)
    node homework2.js --path "m/44'/60'/1'/0/0"
    node homework2.js --random 24           una frase casuale di 24 parole
    node homework2.js --mnemonic "..." --passphrase "..."
    node homework2.js --no-stats            senza l'esplorazione statistica

  Il programma stampa ogni passaggio della pipeline (parole, entropia,
  checksum, seed, chiave master, percorso, chiave privata, chiave pubblica,
  Keccak-256, indirizzo ed EIP-55), il risultato dei 45 vettori di test
  ufficiali e i 28 test statistici, con ipotesi nulla e p-value. Le opzioni
  sono controllate in modo stretto: qualunque valore non valido viene
  rifiutato.
  npm start equivale a node homework2.js.

  Da un altro script Node: const hw = require('./homework2.js'), poi per
  esempio hw.walletPipeline({ path: "m/44'/60'/0'/0/1" }).checksum.address.
  Se il file viene copiato da solo in un progetto che usa i moduli ES, la
  libreria è globalThis.Homework2 dopo import './homework2.js'.


NOTE

  Nessuna dipendenza, nessuna connessione di rete, nessun dato salvato
  tranne la lingua scelta. I test statistici usano ingressi casuali da un
  generatore a seme fisso, e la pagina li calcola a fette di pochi
  millisecondi, senza bloccarsi. homework2.js e app.js sono generati dagli
  stessi sorgenti della pagina online, quindi i numeri e i testi coincidono:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-2


---------------------------------------------------------------------------


WARNING

  Educational code. Never type into this program, or any other, the
  sentence of a real wallet, and never use it with real funds: it follows
  the standards and is checked against their test vectors, but it is not
  hardened (no constant-time arithmetic, secrets left in memory).


CONTENTS

  index.html     the page: it opens with a double click, even offline
  style.css      the style, with light and dark theme, for computer and phone
  homework2.js   the computations, written from scratch: SHA-256, SHA-512,
                 HMAC, PBKDF2, RIPEMD-160, Keccak-256 and SHA3-256, secp256k1,
                 BIP-39, BIP-32, BIP-44, EIP-55, the official test vectors,
                 the statistical exploration and the command line
  app.js         the interface and the texts, in Italian and English
  package.json   tells Node that homework2.js is a CommonJS script
  README.txt     this file


HOW TO USE IT

  In a browser: open index.html. IT / EN at the top switches language, and
  the Contents button jumps to any section of the assignment.

  From a terminal, with Node.js 14 or later:

    node homework2.js                       the public test sentence of
                                            Hardhat and Foundry, account 0
    node homework2.js --index 1             account 1 (m/44'/60'/0'/0/1)
    node homework2.js --path "m/44'/60'/1'/0/0"
    node homework2.js --random 24           a random 24-word sentence
    node homework2.js --mnemonic "..." --passphrase "..."
    node homework2.js --no-stats            without the statistical exploration

  The program prints every step of the pipeline (words, entropy, checksum,
  seed, master key, path, private key, public key, Keccak-256, address and
  EIP-55), the result of the 45 official test vectors and the 28
  statistical tests, with null hypothesis and p-value. Options are checked
  strictly: any invalid value is refused. npm start is the same as
  node homework2.js.

  From another Node script: const hw = require('./homework2.js'), then for
  example hw.walletPipeline({ path: "m/44'/60'/0'/0/1" }).checksum.address.
  If the file is copied alone into a project that uses ES modules, the
  library is globalThis.Homework2 after import './homework2.js'.


NOTES

  No dependencies, no network connection, nothing stored except the chosen
  language. The statistical tests use random inputs from a fixed-seed
  generator, and the page computes them in slices of a few milliseconds,
  without freezing. homework2.js and app.js are generated from the same
  sources as the online page, so numbers and texts match:
  https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-2
