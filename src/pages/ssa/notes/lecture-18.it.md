La Lezione 18 introduce la programmazione degli smart contract in **Solidity**, il linguaggio principale di Ethereum. Le slide vengono dal corso online "Decentralized Finance" (defi-learning.org, tenuto da Berkeley con Stanford, l'Imperial College London e la University of Illinois; questa lezione è di Andrew Miller). Presentano gli smart contract dal punto di vista del programmatore (oggetti sulla blockchain con codice, storage e metodi, attraverso un registro di nomi di dominio), le basi di Solidity (tipi, mapping, funzioni, costruttori, modificatori di visibilità e di mutabilità, eventi, chiamate fra contratti, la valuta nativa, i metadati del blocco), un caso di studio (l'asta olandese di CryptoKitties), il **gas** (la tariffa per il calcolo e l'eccezione out-of-gas), il confronto fra contratti legali e smart contract (la definizione di Szabo), i **token** (gli ERC-20 fungibili e gli ERC-721 non fungibili), una prova guidata con un wallet su una rete di test e, in fondo, alcune slide extra sui tipi di dato di Solidity e sulle conversioni fra interi. La lezione estende il corso lampo della Lezione 16 e fornisce le basi di linguaggio per l'attacco di re-entrancy della Lezione 17; in tutti questi appunti il codice viene letto anche con gli occhi di un attaccante. Le slide sono 72.

## Gli smart contract dal punto di vista del programmatore (pagine 1-14)

### Slide 1 · Frontespizio

> **Decentralized Finance**
>
> Introduction to Smart Contracts
>
> Instructor: Dan Boneh, Arthur Gervais, **Andrew Miller,** Christine Parlour, Dawn Song

Sotto i nomi la slide mostra le foto dei cinque docenti e i loghi della Stanford University, dell'Imperial College London, della University of Illinois Urbana-Champaign e della University of California, Berkeley (non riprodotti in questi appunti).

**Approfondimento.** Le slide sono la lezione "Introduction to Smart Contracts" del MOOC "Decentralized Finance" (2021); il nome in grassetto, Andrew Miller, è il docente di questa lezione. La **DeFi** (finanza decentralizzata) indica servizi finanziari, come exchange, prestiti e stablecoin, realizzati come smart contract invece di essere gestiti da banche.

### Slide 2 · Outline

> - ***What are smart contracts?***
>
>   They're neither smart nor contracts!
>
>   Developer's perspective: Program objects on the blockchain
>
> - ***Basics of Solidity programming in Ethereum***
>
>   Just enough to follow the DeFi examples later
>
> - ***Case Study: The Dutch Auction from CryptoKitties***
> - ***Comparing Legal Contracts and Smart Contracts***

**Approfondimento.** "Neither smart nor contracts": uno smart contract non è intelligente (esegue esattamente il suo codice, bug compresi) e non è un contratto legale (nessun tribunale lo fa rispettare: ciò che viene fatto rispettare è il codice). Per uno sviluppatore è un **oggetto**: codice più stato persistente, conservato sulla blockchain a un indirizzo, i cui metodi vengono invocati da transazioni.

La pagina 3 è il divisore di sezione "Part 1: Smart Contracts from Programmer Perspective".

### Slide 4 · Digital currencies: just one blockchain application

![Lezione 18, pagina 4](L18_p04.webp "50% 1400x592")

**Figura.** A sinistra, gli **Users** (un gruppo di icone di persone) scambiano **Money** (una pila di monete su una freccia a doppio senso) con un riquadro con l'etichetta **Decentralized Consensus "Blockchain"**. Il riquadro contiene gli **Account Balances**: Alice: ฿10, Bob: ฿15, Carol: ฿120. Dietro di esso sono impilate diverse copie del riquadro, e a destra c'è una piccola catena di blocchi con una breve diramazione laterale.

**Approfondimento.** Una criptovaluta come Bitcoin è una blockchain il cui stato condiviso è solo una tabella di saldi e la cui unica operazione è un trasferimento. Il protocollo di consenso (Lezione 16) fa sì che tutti i nodi, le copie impilate del disegno, concordino sulla stessa tabella senza una banca fidata; la diramazione laterale nella catena è un fork, che il consenso risolve.

### Slide 5 · Smart Contracts: user-defined programs running on top of a blockchain

![Lezione 18, pagina 5](L18_p05.webp "50% 1400x583")

**Figura.** La stessa immagine della slide 4, ma ora il riquadro della blockchain contiene dei **Contracts** (in rosso): ogni contratto è un riquadro con il suo **Code** (rosa) e il suo **Storage** (un cilindro di database), con una freccia dal codice allo storage. Gli utenti scambiano con la blockchain sia **Money** sia **Data** (due frecce).

**Approfondimento.** Ethereum generalizza Bitcoin: oltre ai saldi, lo stato condiviso contiene programmi, i contratti, ciascuno con il proprio storage. Una transazione può chiamare una funzione di un contratto, passandole dati e denaro; ogni nodo esegue il codice (nella Ethereum Virtual Machine, slide 18) e applica le stesse modifiche, quindi il risultato è concordato dal consenso. Per la sicurezza questo ha conseguenze forti: il codice è pubblico, non si può cambiare una volta pubblicato, maneggia denaro vero, e chiunque al mondo può chiamarlo con qualunque input. I contratti sono quindi un bersaglio ideale per gli attaccanti (Lezioni 16 e 17).

### Slide 6-9 · Example: Domain Name Registry in Ethereum

```solidity
pragma solidity ^0.5.0;

contract MyRegistry {

    mapping ( string => address ) public registry;

    function registerDomain(string memory domain) public {
        // Can only reserve new unregistered domain names
        require(registry[domain] == address(0));

        // Update the owner of this domain
        registry[domain] = msg.sender;
    }
}
```

**Analisi del codice.** Le quattro slide mostrano lo stesso codice nell'editor Remix (righe 1-14), ciascuna con una parte diversa evidenziata in rosa: nella slide 6 l'intero contratto; nella slide 7 la dichiarazione `mapping`, con un cilindro **Storage** disegnato accanto al codice; nella slide 8 la funzione `registerDomain`, con un riquadro con l'etichetta **Code**; nella slide 9 le due istruzioni dentro la funzione (righe 8-9 e 11-12).

- *Che cosa fa.* `pragma solidity ^0.5.0` seleziona la versione del compilatore (0.5.x). Il contratto `MyRegistry` ha una variabile di **storage**, `registry`, un mapping dai nomi di dominio (stringhe) agli indirizzi dei proprietari; `public` fa generare al compilatore un getter `registry(string)` che chiunque può chiamare. Il **codice** è la funzione `registerDomain`: con `require` controlla che il nome sia ancora libero (i nomi non assegnati corrispondono all'indirizzo zero, `address(0)`), e poi registra chi chiama, `msg.sender`, come proprietario. Se il `require` fallisce, l'intera transazione viene annullata.
- *Il modello.* Le slide 7 e 8 proiettano il codice sull'immagine della slide 5: le variabili di storage sono lo stato persistente del contratto, conservato sulla blockchain; le funzioni sono il codice che le transazioni eseguono.
- *Debolezze.* Sono l'argomento della domanda della slide 14.

### Slide 10 · Example: Domain Name Registry in Ethereum

![Lezione 18, pagina 10](L18_p10.webp "50% 1400x629")

**Figura.** Un utente manda una richiesta al **Registry Contract** (un riquadro con un cilindro di storage e il metodo `registerDomain`): "invoke **`registerDomain`** with string "*defi.io*"". Un gruppo di altri utenti scambia messaggi con il contratto (freccia a doppio senso) per "query registry to look up the current owner".

**Approfondimento.** I due tipi di interazione con un contratto. Registrare un dominio è una **transazione**: cambia lo stato, quindi va firmata, inclusa in un blocco e pagata con il gas. Cercare il proprietario è una **chiamata** a una funzione di sola lettura (il getter `registry`): qualunque nodo risponde localmente dalla propria copia dello stato, gratis e subito, e nulla viene registrato sulla catena.

### Slide 11 · Let's look at an instance on the Test Network

![Lezione 18, pagina 11](L18_p11.webp "50% 1400x637")

**Figura.** Schermate del block explorer Etherscan per la **Kovan Testnet Network**. A sinistra, la pagina di "Contract 0x12E9d045dD5cF027EEbad8fdC3454A1dcCC5d89D", sezione "Read Contract Information": la funzione "1. registry" con un campo di input "<input> (string)" che contiene `https://berkeley-defi.github.io/`, un pulsante **Query** e il risultato "[ registry(string) method Response ] » address : 0x1B326Ad348e19ecFd1406C43D3bF7a95547AC55c". A destra: "Contract Source Code Verified (Exact Match)", "Contract Name: MyRegistry", e i **Logs** di una transazione: l'evento "Registered (address registrant, string domain)", "[topic0] 0xb3eccf73f39b1c07947c780b2b39df2a1bb…" (tagliato), e i dati decodificati parola per parola: Addr → 0x1b326ad348e19ecfd1406c4… (tagliato), Text → @, Text → (vuoto), Text → https://berkeley-defi.git… (tagliato).

**Approfondimento.** Il registro delle slide 6-9, esteso con l'evento della slide 25, pubblicato su Kovan, una rete di test i cui ether non hanno valore (Kovan e Ropsten sono state chiuse nel 2022; oggi la principale rete di test è Sepolia).

- "Contract Source Code Verified (Exact Match)" significa che Etherscan ha compilato il sorgente reso pubblico e ha ottenuto esattamente il bytecode pubblicato a quell'indirizzo. Solo allora gli utenti possono fidarsi che il sorgente leggibile sia ciò che il contratto fa davvero (slide 53, "Mutuality").
- La query restituisce il proprietario del dominio `https://berkeley-defi.github.io/`: l'indirizzo `0x1B32…C55c`, il conto del docente, che ricompare nella slide 61.
- I log mostrano l'evento emesso dalla registrazione. topic0 è l'hash della firma dell'evento (slide 25), e i dati sono gli argomenti codificati secondo l'ABI, mostrati come parole di 32 byte decodificate come testo: l'indirizzo di chi registra; `@`, che è il byte 0x40, l'offset da cui comincia la stringa; una parola "vuota", che è la lunghezza della stringa, 32 = 0x20, il codice dello spazio; e poi la stringa stessa.

### Slide 12 · Interaction between Contracts

![Lezione 18, pagina 12](L18_p12.webp "50% 1400x540")

**Figura.** Un gruppo di utenti interagisce (freccia a doppio senso) con un **Joint Account Contract** (metodo `signRequest`, con una pila di monete). Il conto congiunto interagisce con un **Auction Contract** (metodo `placeBid`; monete sulla freccia), che a sua volta interagisce con un **Digital Asset Contract** (metodo `transferToken`; sopra di esso un piccolo personaggio in pixel art, un oggetto digitale da collezione).

**Approfondimento.** I contratti possono chiamarsi a vicenda: un conto congiunto (per esempio un wallet multi-firma, che spende solo con l'approvazione di più proprietari) fa un'offerta in un'asta, e l'asta trasferisce un asset digitale (un token, slide 57-62) al vincitore. Questa **componibilità** ("money legos") è la base della DeFi. È anche una fonte di attacchi, perché ogni chiamata a un altro contratto cede il controllo a codice che potrebbe essere malevolo: è così che funziona la re-entrancy (Lezione 17).

### Slide 13 · Recap of contract programming model so far...

> - ***Contract class:*** Defines the program code and storage variables for a contract
> - ***Contract object:*** an instance of the class living on the blockchain
> - ***Storage fields:*** variables stored by the contract
> - ***Functions/methods***: can be invoked to run the given code, updating the state of the contract
> - ***Access control:*** Use "require()" to cancel the transaction if it isn't authorized. You can inspect the caller that invoked the function
> - ***Composition:*** interaction between multiple contracts

**Approfondimento.** L'analogia con la programmazione a oggetti: il codice sorgente è una **classe**; pubblicarlo crea un'**istanza** con il proprio indirizzo e il proprio storage, e lo stesso codice si può pubblicare molte volte. Il controllo degli accessi non è automatico: ogni funzione pubblica può essere chiamata da chiunque, a meno che il codice stesso non controlli chi chiama (`msg.sender`) con `require`. Un controllo mancante è la classica vulnerabilità della "funzione non protetta": nel luglio 2017 un attaccante prese il controllo di wallet multi-firma di Parity chiamando la loro funzione di inizializzazione, che chiunque poteva chiamare, e rubò circa 150.000 ether.

### Slide 14 · Question: What's missing from the example?

> - What could go wrong here? How could you fix it
> - What other functionality would a useful domain name registry need to have?

**Analisi del codice.** Accanto alle domande, la slide mostra di nuovo il codice di `MyRegistry` (slide 6-9, righe 1-14), invariato.

- *Che cosa potrebbe andare storto.*
  - **Front-running.** Le transazioni aspettano in un insieme pubblico (la mempool) prima di essere incluse in un blocco. Un attaccante che vede una `registerDomain("defi.io")` in attesa può mandare la stessa chiamata con un prezzo del gas più alto ed essere incluso per primo: l'attaccante ottiene il nome e la transazione della vittima fallisce sul `require`.
  - **Squatting.** La registrazione costa solo il gas e i nomi non scadono mai, quindi chiunque può registrare tutti i nomi di valore e rivenderli.
  - Non c'è modo di **trasferire**, liberare o rinnovare un nome: se il proprietario perde la chiave privata, il nome è perso per sempre. I nomi non sono normalizzati, quindi `DeFi.io` e `defi.io` sono nomi diversi, il che permette nomi simili a quelli veri per il phishing.
- *Correzioni e funzioni mancanti.* Una registrazione **commit-reveal**: prima si manda solo un hash del nome e di un segreto, poi, qualche blocco dopo, li si rivela; chi fa front-running non può conoscere il nome in tempo. Far costare qualcosa la registrazione e farla scadere (una tariffa annuale), aggiungere funzioni per trasferire e rinnovare un nome, protette da `require(registry[domain] == msg.sender)`, emettere eventi per ogni modifica, e risolvere i nomi in dati utili (indirizzi, hash di contenuti). È così che funziona l'Ethereum Name Service (ENS): i nomi `.eth` vengono registrati con un processo commit-reveal e una tariffa annuale.

## Le basi della programmazione in Ethereum (pagine 15-30)

Le pagine 15 e 16 sono i divisori di sezione "Introduction to Smart Contracts - Part 2: Ethereum programming basics - Just enough to follow the Defi examples later" e "Part 2: Ethereum programming basics - Just enough to follow the Defi examples".

### Slide 17 · Outline and background

> No programming experience required, but might help
>
> Focus on the unique parts of Solidity
>
> ***Outline:***
>
> - Solidity and EVM bytecode
> - Data types
> - Functions and constructors
> - Visibility/mutability modifiers
> - Accessing blockchain metadata
> - Working with the built-in currency
> - Events and interaction between contracts
>
> Saved for next time: Gas

**Approfondimento.** Il programma delle slide 18-29. "Next time" si riferisce alla lezione successiva del corso originale; in queste slide il gas arriva qualche slide più avanti (slide 39-49).

### Slide 18 · Solidity and Ethereum Bytecode

![Lezione 18, pagina 18](L18_p18.webp "43% 782x743")

**Figura.** Due riquadri uniti da una spessa freccia verso il basso: "**Solidity program** High level language" sopra, "**Ethereum Virtual Machine (EVM) Program** Low level bytecode" sotto.

A destra della slide, una schermata delle prime otto righe di `MyRegistry` (slide 6-9), tagliata sul bordo destro, e sotto di essa un listato di bytecode EVM in forma mnemonica, tagliato su entrambi i bordi:

```text
REVERT JUMPDEST POP PUSH2 0x303 DUP1 PUSH2
PUSH1 0x4 CALLDATASIZE LT PUSH2 0x78 JUMPI
0x1000000000000000000000000000000000000000
0x7D JUMPI DUP1 PUSH4 0x1D0806AE EQ PUSH2
PUSH2 0xDD JUMPI DUP1 PUSH4 0xD3642A88 EQ
DUP1 REVERT JUMPDEST PUSH2 0x85 PUSH2 0x18
DUP1 REVERT JUMPDEST POP PUSH2 0x9C PUSH2
```

**Analisi del codice.**

- *Che cosa mostra.* Il compilatore (`solc`) traduce il sorgente Solidity in bytecode per l'EVM, una macchina a stack; il bytecode è ciò che viene conservato sulla catena ed eseguito da ogni nodo. Il frammento fa parte del **dispatcher**, il codice che viene eseguito per primo a ogni chiamata: `PUSH1 0x4 CALLDATASIZE LT` controlla se l'input della chiamata (i call data) è più corto di 4 byte; la lunga costante, una potenza di 2, serve a far scorrere i call data e a tenerne i primi 4 byte, il **selettore della funzione** (i primi 4 byte dell'hash Keccak-256 della firma della funzione); le sequenze `PUSH4 0x1D0806AE EQ … JUMPI` e `PUSH4 0xD3642A88 EQ … JUMPI` lo confrontano con i selettori delle due funzioni pubbliche del contratto (`registerDomain` e il getter `registry`) e saltano al codice corrispondente. Se nulla corrisponde, la chiamata termina con `REVERT`.
- *Perché conta per la sicurezza.* Ciò che viene eseguito è il bytecode, non il sorgente: gli strumenti di analisi (decompilatori, esecutori simbolici come Mythril) e gli attaccanti lavorano su di esso, e il sorgente è affidabile solo quando viene verificato rispetto al bytecode (slide 11). Anche il gas si paga per istruzione di bytecode (slide 45).

### Slide 19 · Solidity and Data Types

> Solidity is statically typed
>
> Like Java, C, Rust….. unlike python or javascript
>
> Example:
>
> - **Integers**: uint (unsigned 256-bit integer)
>
>   int (signed 256-bit integer)

```solidity
/* Initialize ten users */
for (uint i = 0; i < 10; i++) {
    users[i].balance = 1;
}
```

**Analisi del codice.**

- *Che cosa fa.* Un ciclo con un contatore `uint` che imposta a 1 il campo `balance` dei primi dieci elementi di `users` (un array o un mapping di struct dichiarato altrove).
- *I tipi.* La parola dell'EVM è di 256 bit, quindi `uint` significa `uint256` e `int` significa `int256`. I tipi vengono controllati in compilazione (come nella Lezione 19, parte 2), ma la tipizzazione statica non impedisce l'overflow aritmetico: prima di Solidity 0.8 gli interi si riavvolgevano in silenzio (slide 69), la causa delle vulnerabilità dei token elencate nella Lezione 1 (slide 16-17).
- *Il gas.* Ogni iterazione costa gas, e qui ognuna scrive nello storage, l'operazione più cara (slide 43). Un ciclo su un elenco che gli utenti possono allungare a piacere può superare il limite di gas di un blocco e rendere impossibile eseguire la funzione (slide 41).

### Slide 20 · Mapping data types

> - *Mapping*: a key value storage / hash table
> - Every key is initially mapped to zero
> - There is no built-in way to query the length of a mapping, or iterate over its non-zero elements. A separate variable can be used

```solidity
mapping ( string => address ) public registry;
```

**Analisi del codice.** Nella slide una freccia indica `string` come "Key type" e un'altra indica `address` come "Value type".

- *Che cosa fa.* La dichiarazione del registro delle slide 6-9: un mapping dalle stringhe agli indirizzi.
- *Come funziona.* Le chiavi non sono conservate da nessuna parte: il valore di una chiave sta in una posizione dello storage calcolata facendo l'hash (Keccak-256) della chiave insieme alla posizione del mapping. Ognuna delle 2^256 posizioni possibili esiste e contiene zero finché non viene scritta. Da qui "every key is mapped to zero", e non c'è un elenco di chiavi da contare o da scorrere: se serve, il contratto deve tenere da sé un contatore o un array delle chiavi (slide 71), pagandone il gas.
- *Conseguenza.* Lo zero vale anche come "assente": il registro tratta `address(0)` come "non registrato", il che funziona perché nessuno può mandare transazioni dall'indirizzo zero.

### Slide 21 · Function signatures

```solidity
function getCurrentPrice(int slidingWindowSize) public view
    returns(int price, int confidence) {

    /** Compute the current price using on-chain data
     ... */

}
```

**Analisi del codice.** Nella slide delle frecce indicano le parti della dichiarazione: "Name" (`getCurrentPrice`), "Arguments" (`int slidingWindowSize`), "Visibility Modifier" (`public`), "Mutability Modifier" (`view`) e "Return types" (`returns(int price, int confidence)`).

- *Che cosa fa.* Dichiara una funzione che calcola un prezzo da dati sulla blockchain (il corpo è omesso) e restituisce due valori con nome: le funzioni Solidity possono restituire più valori insieme.
- *Nota di sicurezza.* Un prezzo calcolato da dati sulla catena, per esempio dalle riserve di un exchange decentralizzato, può essere manipolato dentro una sola transazione da un attaccante che prende in prestito una grossa somma con un flash loan. Fare la media del prezzo su una finestra temporale (la "sliding window" dell'argomento) rende la manipolazione molto più costosa: la manipolazione degli oracoli dei prezzi è una delle principali classi di attacchi alla DeFi.

### Slide 22 · Constructors

> Invoked when initially creating the contract
>
> Used to customize settings or give an initial state

```solidity
contract BoardAction {

    address public president;
    address public vicePresident;

    constructor(address initialPresident, address initialVP) public {
        /** initialize the contract **/
        president = initialPresident;
        vicePresident = initialVP;
    }
}
```

**Analisi del codice.** Il codice è alle righe 42-52 di un file; la parola chiave `constructor` è evidenziata.

- *Che cosa fa.* Il costruttore viene eseguito una volta, nella transazione che pubblica il contratto: i suoi argomenti impostano i due indirizzi pubblici. Dopo la pubblicazione il codice del costruttore non fa parte del contratto e non si può chiamare di nuovo.
- *Nota di sicurezza.* Prima di Solidity 0.4.22 il costruttore era la funzione con lo stesso nome del contratto. Un errore di battitura nel nome, o la ridenominazione del contratto, la trasformava in una normale funzione pubblica che chiunque poteva chiamare per diventare il proprietario: è successo al contratto Rubixi, rinominato da DynamicPyramid mentre il suo costruttore si chiamava ancora `DynamicPyramid()`. La parola chiave `constructor` elimina questa classe di bug. (La visibilità `public` sul costruttore era obbligatoria in Solidity 0.5 e 0.6 e non si usa più dalla 0.7.)

### Slide 23 · Visibility modifiers

> For functions:

```solidity
function calledByAnyone() public { /* anyone can call */ }

function calledInternally() internal { /* only called by another
                                          function in this contract */ }
```

> For instance variables:

```solidity
int public myPublicField; /* A getter method is
                             automatically created */

int private myPrivateField; /* No getter method is
                               provided */
```

> Question: could **`myPrivateField`** hold a secret value?

**Analisi del codice.** Nella slide sono evidenziati i modificatori `public`, `internal`, `public` e `private`.

- *Che cosa fa.* Una funzione `public` può essere chiamata da chiunque (da transazioni, da altri contratti e dall'interno); una `internal` solo da questo contratto e dai contratti che ne ereditano (Solidity ha anche `external`, chiamabile solo dall'esterno, e `private`, chiamabile solo da questo contratto). Per le variabili di stato, `public` fa generare al compilatore un getter, `private` no, e nasconde anche la variabile ai contratti derivati.
- *La domanda.* **No.** `private` limita l'accesso da parte *del codice di altri contratti*, non la visibilità dei dati. L'intero storage di ogni contratto fa parte dello stato della blockchain, copiato su ogni nodo: chiunque può leggere qualunque slot dello storage (per esempio con il metodo JSON-RPC `eth_getStorageAt`) o trovare il valore nell'input della transazione che l'ha scritto, che è pubblico. Password, chiavi o il numero segreto di un gioco a indovinelli non vanno mai conservati in un contratto, privato o no: si usa uno schema commit-reveal (conservare solo un hash e rivelare il valore più tardi) oppure si tiene il segreto fuori dalla catena. È la differenza fra modificatori di visibilità e riservatezza sottolineata nella Lezione 20 (slide 8).
- *Un'altra trappola.* Prima di Solidity 0.5 una funzione senza modificatore di visibilità era `public` per default, quindi dimenticare il modificatore esponeva funzioni interne; dalla 0.5 la visibilità va scritta esplicitamente.

### Slide 24 · Mutability modifiers

```solidity
function ordinary() public { /* can modify state and
                                call other functions */ }

function viewOnly() public view { /* can't modify any storage or
                                     call another non-view function */ }

function localOnly() public pure { /* doesn't even read any
                                      state either */ }
```

**Analisi del codice.** Nella slide sono evidenziati `view` e `pure`.

- *Che cosa fa.* Una funzione ordinaria può leggere e cambiare lo stato. Una funzione `view` promette di non modificare lo stato: niente scritture nello storage, niente eventi, niente ether inviati, niente chiamate a funzioni che non siano `view` o `pure`. Una funzione `pure` promette anche di non leggere lo stato, quindi il suo risultato dipende solo dai suoi argomenti. Il compilatore controlla queste promesse, e le chiamate da altri contratti a funzioni `view` e `pure` usano l'istruzione EVM `STATICCALL`, che fa fallire qualunque tentativo di cambiare lo stato.
- *Perché conta.* Le funzioni `view` e `pure` si possono chiamare gratis dall'esterno della blockchain (slide 10); chiamate dentro una transazione costano comunque gas. E `view` non significa innocua: nella **read-only re-entrancy**, un contratto chiama la funzione `view` di un altro contratto mentre quest'ultimo è in uno stato intermedio incoerente (nel mezzo di una chiamata rientrante, Lezione 17), e prende decisioni basate su valori sbagliati.

### Slide 25 · Events

> There are two main ways to observe the state of a contract:
>
> - Using ***view*** functions, such as getter functions for public fields
> - Looking at ***event logs***. Can "subscribe" to events of a contract

```solidity
event Registered(address registrant, string domain);

function registerDomain(string memory domain) public {
    // Can only reserve new unregistered domain names
    require(registry[domain] == address(0));

    // Update the owner of this domain
    registry[domain] = msg.sender;

    emit Registered(msg.sender, domain);
}
```

![Lezione 18, pagina 25](L18_p25.webp "49% 882x319")

**Figura.** Sopra la parte in basso a destra del codice, un pezzo di un pannello **Logs** di Etherscan: "Registered (address registrant, string domain)" e una riga di dati decodificati "Text → https://berkeley-defi.github.io/".

**Analisi del codice.** Nella slide sono evidenziate la dichiarazione dell'evento e l'istruzione `emit`.

- *Che cosa fa.* Il registro delle slide 6-9 ora dichiara un evento `Registered` e lo emette a ogni registrazione. L'evento viene registrato nel log della transazione, con l'hash della firma dell'evento come primo topic (topic0, visibile nella slide 11) e gli argomenti come dati.
- *Perché gli eventi.* I log costano molto meno dello storage, e i programmi fuori dalla catena (wallet, interfacce web, Etherscan) possono iscriversi a essi e reagire ai cambiamenti invece di interrogare di continuo le funzioni `view`. I contratti non possono leggere i log: sono pensati per il mondo esterno.
- *Nota di sicurezza.* Gli eventi sono la base del monitoraggio e della risposta agli incidenti (accorgersi di un attacco mentre avviene), quindi emettere un evento per ogni cambiamento di stato importante è una pratica raccomandata. Non sono però una protezione: dicono ciò che il codice sceglie di dire, e un token malevolo può emettere un evento `Transfer` senza trasferire nulla.

### Slide 26 · Calling methods of other contracts

```solidity
abstract contract Token {
    function transferFrom(address from, address to, uint amount) public virtual;
}

contract Exchanger {
    Token tokenA = Token(address(0x000 /* Hardcoded address of existing token */ ));
    Token tokenB = Token(address(0x000 /* Hardcoded address of existing token */ ));

    function swap1(address Alice, address Bob) public {
        tokenA.transferFrom(Alice, Bob, 1);
        tokenB.transferFrom(Bob, Alice, 1);
    }
}
```

**Analisi del codice.** Nella slide delle frecce indicano l'interfaccia del contratto esterno, "The interface for an external contract" (l'`abstract contract Token`), il suo indirizzo, "Address of external contract instance" (gli indirizzi scritti nel codice), e una chiamata di metodo, "Method Call" (`tokenA.transferFrom(...)`).

- *Che cosa fa.* Per chiamare un altro contratto, un contratto ha bisogno della sua interfaccia (qui un contratto astratto che contiene solo la dichiarazione di `transferFrom`; Solidity ha anche la parola chiave `interface`) e del suo indirizzo. `Token(address(...))` trasforma l'indirizzo in un riferimento tipizzato, e `tokenA.transferFrom(...)` viene compilata in una chiamata di messaggio a quel contratto. `swap1` scambia un'unità del token A, da Alice a Bob, con un'unità del token B, da Bob ad Alice.
- *La vulnerabilità.* `swap1` è `public` e riceve Alice e Bob come **argomenti**: chiunque può chiamarla con due indirizzi qualsiasi. `transferFrom` riesce solo se i proprietari hanno autorizzato l'`Exchanger` a muovere i loro token (`approve`, slide 62); ma una volta che l'hanno fatto, qualunque terzo può far partire scambi fra loro, in qualunque momento e quante volte vuole. Inoltre i risultati di `transferFrom` vengono ignorati: con un token ERC-20 che segnala il fallimento restituendo `false` invece di annullare la transazione, una metà dello scambio potrebbe fallire in silenzio mentre l'altra metà riesce.
- *Correzione.* Prendere una delle parti da `msg.sender` e richiedere il consenso dell'altra (per esempio un ordine firmato), dichiarare il vero tipo di ritorno (`returns (bool)`) e controllarlo, oppure usare un wrapper come `SafeERC20` di OpenZeppelin.
- *Nota.* `abstract` e `virtual` sono sintassi di Solidity 0.6+, mentre le slide 6-9 usano la versione 0.5: le slide mescolano versioni diverse del linguaggio.

### Slide 27 · Working with the native currency

```solidity
function acceptExactlyTwoEther() public payable returns(uint) {
    require(msg.value >= 2.0 ether);

    uint refund = msg.value - 2.0 ether;
    payable(msg.sender).transfer(refund);

    return address(this).balance;
}
```

> `1.0 ether` => 1000000000000000000 wei

**Analisi del codice.** Nella slide sono evidenziati `payable`, `msg.value`, `2.0 ether`, `.transfer` e `.balance`.

- *Che cosa fa.* `payable` permette alla funzione di ricevere ether insieme alla chiamata (una chiamata con ether a una funzione che non è `payable` viene respinta); `msg.value` è l'importo ricevuto. La funzione richiede almeno 2 ether, rimanda l'eccedenza a chi chiama con `transfer`, e restituisce il saldo del contratto, `address(this).balance`. Il contratto tiene così esattamente 2 ether.
- *Le unità.* Gli importi sono interi in **wei**: 1 ether = 10^18 wei, e 1 gwei = 10^9 wei. `2.0 ether` è solo un modo di scrivere 2·10^18; non ci sono numeri in virgola mobile.
- *Note di sicurezza.* La sottrazione non può andare in underflow grazie al `require`. `transfer` inoltra al destinatario solo 2300 unità di gas e annulla la transazione se il pagamento fallisce: un tempo era la protezione raccomandata contro la re-entrancy (Lezione 17), ma poiché i costi del gas possono cambiare (EIP-1884, 2019) oggi è sconsigliata a favore di `call` unita allo schema checks-effects-interactions o a una protezione dalla re-entrancy. Se chi chiama è un contratto che rifiuta i pagamenti, il rimborso fallisce e con esso l'intera chiamata (qui questo danneggia solo chi chiama). Da Solidity 0.8 `msg.sender` non è payable per default, da qui la conversione `payable(...)`.

### Slide 28 · Reading the current time

```solidity
function placeBid(int price) public {
    require(block.timestamp <= deadline);

    /** rest of the code for placing a bid **/
}
```

> Other metadata about the block are available too

**Analisi del codice.** Nella slide è evidenziato `block.timestamp`.

- *Che cosa fa.* Accetta offerte solo fino a una scadenza (una variabile di storage), confrontandola con il timestamp del blocco che include la transazione (tempo Unix, secondi dal 1970).
- *Altri metadati.* Fra gli altri `block.number`, `block.coinbase` (l'indirizzo di chi produce il blocco), `block.chainid`, `blockhash(n)`, `msg.sender`, `msg.value`, `tx.origin` (il conto che ha firmato la transazione) e `gasleft()`.
- *Note di sicurezza.* Il timestamp viene scelto da chi produce il blocco entro certi limiti (prima del 2022 i miner potevano spostarlo di qualche secondo; dal passaggio alla proof of stake è fissato dallo slot di 12 secondi), quindi va bene per scadenze di ore, non per tempi precisi. I dati del blocco non vanno mai usati come fonte di casualità: chi produce il blocco può vederli e influenzarli, e qualunque altro contratto nello stesso blocco calcola gli stessi valori, ed è così che sono state attaccate molte lotterie sulla catena. `tx.origin` non va mai usato per l'autorizzazione: un contratto malevolo chiamato dalla vittima supererebbe il controllo.

### Slide 29 · Other Solidity quirks and features

> - ***Storage, memory, calldata***
>
>   Compiler warnings often give recommendations to follow
>
> - ***Creating contracts programmatically***
> - ***Modifier macros*** e.g. onlyOwner
> - ***Calling another contract's code***
> - ***Inheritance and interfaces***
> - ***…..***
>
> Next time: Hands on writing and deploying a smart contract

**Approfondimento.**

- **Posizione dei dati** (data location). `storage` è lo stato persistente sulla catena (costoso: scrivere un nuovo slot dello storage costa 20.000 unità di gas), `memory` sono dati temporanei per la durata di una chiamata, `calldata` è l'input di sola lettura di una chiamata esterna (il più economico). Array, struct e stringhe devono dichiarare dove stanno. Assegnare una variabile di storage a una variabile locale dichiarata `storage` crea un riferimento, quindi scrivere attraverso di essa cambia lo stato (aliasing, come nella Lezione 19); assegnarla a una variabile `memory` ne fa una copia. I compilatori vecchi permettevano puntatori allo storage non inizializzati, che puntavano allo slot 0 e sovrascrivevano in silenzio altre variabili.
- **Creare contratti da programma.** `new C(...)` pubblica un nuovo contratto dall'interno di un contratto (le factory); l'istruzione `CREATE2` rende prevedibile l'indirizzo del nuovo contratto.
- I **modificatori** sono controlli riutilizzabili attaccati alle funzioni, per esempio `modifier onlyOwner() { require(msg.sender == owner); _; }`, dove `_` sta per il corpo della funzione; `function withdraw() public onlyOwner { ... }` esegue allora prima il controllo. Dimenticare il modificatore su una funzione è un bug di controllo degli accessi comune.
- **Chiamare il codice di un altro contratto.** Oltre alle chiamate tipizzate (slide 26) ci sono `call` e `delegatecall` di basso livello. `delegatecall` esegue il codice di un altro contratto *sullo storage di chi chiama*: si usa per le librerie e per i proxy aggiornabili, ed è stata al centro di entrambi gli incidenti dei wallet di Parity del 2017.
- **Ereditarietà e interfacce.** I contratti possono ereditare da più contratti e implementare interfacce come ERC-20 (slide 62).

### Slide 30 · Quiz:

> What does this Solidity code do?
>
> What's wrong with it?

**Approfondimento.** Nel PDF la slide contiene solo le due domande, senza codice: nella lezione originale il codice veniva mostrato dal vivo. Le due domande sono quelle giuste per ogni contratto di questa lezione: si vedano le risposte per il registro (slide 14), l'exchanger (slide 26), l'asta olandese (slide 35) e la vendita del token (slide 52).

## Caso di studio: l'asta olandese (pagine 31-35)

Le pagine 31 e 32 sono i divisori di sezione "Smart Contract Case Study: Dutch Auction" e "Part 3a: Smart Contract Case Study - Dutch Auction".

### Slide 33 · CryptoKitties (articolo di giornale)

> The first big NFT

![Lezione 18, pagina 33](L18_p33.webp "50% 1306x1017")

**Figura.** La slide non ha titolo: mostra un articolo di giornale con il titolo "CryptoKitties is the Ethereum cat collecting game that's seen over $1m in user spending" e il sottotitolo "This is definitely what blockchain was invented for", sopra l'immagine di un gatto giallo da cartone animato in un cerchio rosa, con un diamante viola di Ethereum sopra la testa. Una stella gialla sulla slide dice "The first big NFT".

**Approfondimento.** CryptoKitties (di Axiom Zen, poi Dapper Labs) fu lanciato nel novembre 2017: gli utenti comprano, collezionano e fanno riprodurre gatti digitali, ciascuno dei quali è un token non fungibile (slide 56-62). Nel dicembre 2017 le sue transazioni erano una grossa parte di tutto il traffico di Ethereum e congestionarono la rete, la prima vera dimostrazione della capacità limitata di Ethereum; lo standard ERC-721 per i token non fungibili è nato da lì. Il sottotitolo dell'articolo è ironico.

### Slide 34 · Cryptokitties is based on Dutch Auctions

> The "Buy it Now" price is initially set at a largest value
>
> As time goes on, the "Buy it Now" price is lowered
>
> As soon as someone is ready to buy it, they announce their bid and win

![Lezione 18, pagina 34](L18_p34.webp "50% 1400x498")

**Figura.** La pagina di vendita di un gattino su CryptoKitties (con l'etichetta "3.5/4 purrfect"): "Buy now price Ξ 0.0028", "Time left 1 day", un pulsante arancione "Buy now", e un grafico del prezzo che scende lungo una retta da "Started at Ξ 0.005" a "Price goes to Ξ 0.002", con un punto sul prezzo attuale.

**Approfondimento.** In un'**asta olandese** (al ribasso) il prezzo parte alto e scende con il tempo; il primo offerente che accetta il prezzo corrente vince e paga quel prezzo. Si adatta bene a una blockchain: una sola transazione chiude l'asta, il contratto non deve conservare e confrontare molte offerte, e non ci sono offerte in busta chiusa, che su una catena pubblica sarebbero visibili a tutti a meno di usare uno schema commit-reveal. Il punto debole è che il prezzo è fissato dal blocco in cui la transazione viene inclusa, e che gli acquisti in attesa sono visibili: un altro compratore può vedere una `buyNow` nella mempool e passare per primo con un prezzo del gas più alto (front-running).

### Slide 35 · Dutch Auction in a few lines of Solidity

```solidity
contract DutchAuction {
    // Parameters
    uint public initialPrice; uint public biddingPeriod;
    uint public offerPriceDecrement; uint public startTime;
    KittyToken public kitty; address payable public seller;
    address payable winnerAddress;

    function buyNow() public payable {
        uint timeElapsed = block.timestamp - startTime;
        uint currPrice = initialPrice - (timeElapsed * offerPriceDecrement);
        uint userBid = msg.value;
        require (winnerAddress == address(0)); // Auction hasn't ended early
        require (timeElapsed < biddingPeriod); // Auction hasn't ended by time
        require (userBid >= currPrice); // Bid is big enough

        winnerAddress = payable(msg.sender);
        winnerAddress.transfer(userBid - currPrice);  // Refund the difference
        seller.transfer(currPrice);
        kitty.transferOwnership(winnerAddress);
    }
}
```

**Analisi del codice.**

- *Che cosa fa.* Lo storage contiene i parametri dell'asta (prezzo iniziale, durata, ribasso del prezzo al secondo, istante di inizio), l'oggetto in vendita (`kitty`, un contratto di token con un metodo `transferOwnership`), il venditore e il vincitore. `buyNow` calcola il prezzo corrente (il prezzo iniziale meno il tempo trascorso moltiplicato per il ribasso) e controlla che nessuno abbia ancora vinto, che l'asta non sia finita e che gli ether inviati coprano il prezzo. Poi registra il vincitore, rimborsa l'eccedenza, paga il venditore e trasferisce il gattino al vincitore. L'ordine segue lo schema checks-effects-interactions: `winnerAddress` viene impostato prima delle chiamate esterne, quindi una chiamata rientrante a `buyNow` fallirebbe sul primo `require` (Lezione 17).
- *Che cosa può andare storto.*
  - **Aritmetica.** Se `biddingPeriod * offerPriceDecrement` è maggiore di `initialPrice`, verso la fine dell'asta la sottrazione va sotto zero: prima di Solidity 0.8 `currPrice` si riavvolge in un numero enorme e nessuno può comprare; dalla 0.8 la chiamata viene annullata. I parametri vanno validati quando l'asta viene creata; anzi, il contratto non ha proprio un costruttore, quindi così com'è scritto i parametri non vengono mai impostati, e il contratto dell'asta deve essere reso proprietario del gattino in anticipo.
  - **Denial of service da parte del venditore.** `seller.transfer` annulla la transazione se `seller` è un contratto che rifiuta i pagamenti o che ha bisogno di più di 2300 unità di gas; allora ogni `buyNow` fallisce e il gattino non si può mai vendere. Più sicuro: registrare l'importo dovuto e lasciare che sia il venditore a prelevarlo (pagamenti "pull" invece che "push").
  - **Nessuna conclusione.** Se nessuno compra prima della scadenza, nessuna funzione restituisce il gattino al venditore.
  - **Front-running e tempo.** Gli acquisti in attesa sono pubblici, quindi un concorrente può superarli con un prezzo del gas più alto (slide 34); chi produce i blocchi ha una piccola influenza su `block.timestamp`, e quindi sul prezzo.
  - Il vincitore non è `public` e nessun evento annuncia la vendita (slide 25).

## Demo: scrivere e pubblicare contratti con Remix (pagine 36-38)

Le pagine 36 e 37 sono i divisori di sezione "Introduction to Smart Contracts - Part 3: Demonstration of Coding and Deploying Smart Contracts with Remix" e "Part 3b: Demo of Coding and Deploying Smart Contracts with Remix".

### Slide 38 · Demo di Remix (video)

**Figura.** La slide non ha titolo: è un fotogramma del video della demo, non riprodotto perché include la webcam di chi presenta. Mostra l'IDE Remix nel browser (remix.ethereum.org). A sinistra il file `browser/helloworld.sol`, un piccolo contratto `Test` con una variabile membro, una funzione `pure` `test` che restituisce la stringa "hello world", una stringa pubblica `message` e una funzione `set` che la cambia (il fotogramma è troppo sfocato per trascrivere il codice con esattezza). A destra il pannello "Run": gas limit 3000000, value 0 wei, il contratto `Test` con i pulsanti Deploy e At Address, "Transactions recorded: 2", e sotto "Deployed Contracts" l'istanza "Test at 0x692…77b3a (memory)" con il pulsante `set` (input "hello again WORLD"), `message` (output "0: string:") e `test` (output "0: string: hello world!"). In basso, la console con l'input decodificato, l'output decodificato, i log e il valore (0 wei) di una transazione.

**Approfondimento.** Remix è l'IDE web per Solidity: compila, pubblica su una catena simulata nel browser ("memory") o su una rete vera attraverso un wallet, permette di chiamare le funzioni con dei pulsanti e mostra ogni transazione con il suo input e il suo output decodificati. Include anche un debugger (slide 42-43) e plugin di analisi statica.

## Il gas in Ethereum (pagine 39-49)

La pagina 39 è il divisore di sezione "Part 4: Gas in Ethereum".

### Slide 40 · Each transaction has to pay a gas fee

> More complicated transactions consume more gas, so they cost more.
>
> source: ethgasstation.info

![Lezione 18, pagina 40](L18_p40.webp "50% 1400x618")

**Figura.** Una dashboard di ethgasstation.info con tre pannelli: "Transaction Count by Gas Price" (un grafico a barre della percentuale di transazioni in cinque fasce di prezzo del gas, da meno di 1 a più di 50 gwei; la maggior parte delle transazioni è nella fascia 20-50), "Confirmation Time by Gas Price" (il tempo di conferma, in minuti, per prezzi del gas di 1, 20, 21 e più di 40 gwei, tutti sotto il minuto) e "Real Time Gas Use" (un indicatore a 100, ultimo blocco 12846402). Sotto, "Recommended Gas Prices in Gwei": 36 TRADER (< ASAP), 36 FAST (< 2m), 24.1 STANDARD (< 5m).

**Approfondimento.** Ogni operazione costa una quantità di **gas**, e la tariffa di una transazione è il gas usato moltiplicato per il **prezzo del gas** (in gwei per unità di gas). Gli utenti scelgono il prezzo, e chi produce i blocchi include prima le transazioni che pagano di più: il prezzo è un'asta per lo spazio limitato nei blocchi, ed è per questo che il sito raccomanda un prezzo per ogni velocità di conferma. Dal fork London (EIP-1559, 2021) la tariffa è una **base fee** per unità di gas, fissata dal protocollo e bruciata, più una **priority fee** (la mancia) per chi produce il blocco. Il gas è prima di tutto un meccanismo di sicurezza: l'EVM è Turing-completa, quindi un nodo non può sapere in anticipo se un pezzo di codice termina (il problema della fermata); con il gas ogni esecuzione è limitata e pagata, il che impedisce il denial of service con cicli infiniti e rende costoso inondare la rete.

### Slide 41 · Miners limited by a global limit on gas per block

![Lezione 18, pagina 41](L18_p41.webp "50% 1039x903")

**Figura.** "Ethereum Average Gas Limit Chart" (Source: Etherscan.io; "Click and drag in the plot area to zoom in"). Il limite medio di gas per blocco, dal 2016 al 2021 (asse y da 0 a 17,5 M), cresce a gradini: circa 3 milioni nel 2016, circa 4,7 M, un breve calo brusco alla fine del 2016, poi circa 4 M, 6,7 M (2017), 8 M (2018-2019), 10 M e 12,5 M (2020) e 15 M (2021).

**Approfondimento.** Ogni blocco ha un gas totale massimo, quindi la rete elabora una quantità limitata di calcolo per blocco (un blocco ogni 12-15 secondi): questo limita il lavoro di ogni nodo ed è il limite di capacità della blockchain. Il limite viene regolato da chi produce i blocchi. Il calo alla fine del 2016 corrisponde agli attacchi di denial of service di quell'autunno, in cui gli attaccanti usavano istruzioni il cui prezzo in gas era molto più basso del loro costo reale (operazioni che leggono lo stato di altri conti): i miner abbassarono temporaneamente il limite, e il fork dell'ottobre 2016 (EIP-150) alzò il prezzo di quelle istruzioni. Il gas protegge dal denial of service solo se i prezzi riflettono i costi reali. Per chi scrive contratti: una funzione il cui gas cresce con la quantità di dati, come un ciclo su tutti gli utenti, può superare il limite del blocco e diventare impossibile da chiamare, bloccando i fondi che ne dipendono.

### Slide 42-43 · Every instruction costs a fixed amount of gas

> A counter of gas used is tracked when executing the transaction
>
> Remaining gas: 9500
>
> Remaining gas: 8000

```solidity
contract MyRegistry {

    mapping ( string => address ) public registry;

    function registerDomain(string memory domain) public {
        // Can only reserve new unregistered domain names
        require(registry[domain] == address(0));

        // Update the owner of this domain
        registry[domain] = msg.sender;
    }
}
```

**Analisi del codice.** Il codice è alle righe 3-14 di `MyRegistry` (slide 6-9) nel debugger di Remix (un'icona a forma di insetto a sinistra). Il corpo di `registerDomain` è evidenziato in azzurro e l'istruzione in esecuzione in blu più scuro: nella slide 42 il `require` (riga 9), con l'etichetta gialla "Remaining gas: 9500"; nella slide 43 l'assegnamento (riga 12), con "Remaining gas: 8000".

- *Che cosa mostra.* La transazione parte con un budget di gas, e ogni istruzione EVM eseguita sottrae il suo costo; fra le due istantanee sono state spese 1.500 unità di gas. I numeri sono solo illustrativi: in realtà l'assegnamento è di gran lunga il passo più costoso, perché una scrittura nello storage che porta uno slot da zero a un valore diverso da zero costa 20.000 unità di gas, contro 3-5 per un'istruzione aritmetica (slide 45), dato che ogni nodo deve conservare il valore per sempre.

### Slide 44 · Gas limits and refunds

> - Each transaction specifies a gas limit and a price for the gas, in units of Ether
> - Ether value to pay for the gas must be reserved up front
> - At end of contract execution, unused gas is refunded

![Lezione 18, pagina 44](L18_p44.webp "50% 1396x509")

**Figura.** Un utente manda una transazione a un **Auction Contract** (metodo `placeBid`). Il riquadro della transazione, con una pila di monete, dice "Transaction: Gas Limit: 4500 gas / Gas Price: 15.0e-6 per gas / …….".

**Approfondimento.** Limite di gas × prezzo del gas è la tariffa massima: qui 4500 × 15·10⁻⁶ = 0,0675 ether, presi dal saldo di chi invia prima dell'esecuzione. Alla fine il gas non usato viene restituito; il gas usato si paga anche se la transazione fallisce (slide 46). Il limite protegge chi invia: un bug che cicla all'infinito costa al massimo il limite.

### Slide 45 · There's a big table for gas prices per opcode

> This is based on the compiled opcodes for Ethereum Virtual Machine (EVM), not high level code
>
> "FORMULA" means the gas for this opcode depends on the arguments (for example on the size of the argument).
>
> https://github.com/djrtwo/evm-opcode-gas-costs

![Lezione 18, pagina 45](L18_p45.webp "50% 1025x923")

**Figura.** Un foglio di calcolo, tagliato in alto e a destra, con le colonne Value, Mnemonic, Gas Used e una quarta colonna di cui si vedono solo le prime lettere. Righe: 0x00 STOP 0; 0x01 ADD 3; 0x02 MUL 5; 0x03 SUB 3; 0x04 DIV 5; 0x05 SDIV 5; 0x06 MOD 5; 0x07 SMOD 5; 0x08 ADDMOD 8; 0x09 MULMOD 8; 0x0a EXP FORMULA; 0x0b SIGNEXTEND 5; 0x10 LT 3. Gli inizi visibili della quarta colonna ("ze", "ve", "lo", "m") sono le fasce di costo della specifica di Ethereum (zero, very low, low, mid).

**Approfondimento.** I costi in gas sono definiti per istruzione EVM nella specifica di Ethereum (lo Yellow Paper), quindi il costo di un'istruzione Solidity dipende dalle istruzioni in cui viene compilata (slide 18). Alcuni costi sono dinamici: `EXP` costa di più per esponenti più grandi, copiare e calcolare hash costa per parola di 32 byte, l'accesso allo storage dipende dal fatto che lo slot fosse già stato usato. La tabella cambia con i fork (EIP-150, EIP-1884, EIP-2929), e i contratti che presuppongono costi fissi possono rompersi, come è successo con le 2300 unità di gas inoltrate da `transfer` (slide 27).

### Slide 46 · What happens when gas runs out?

> - An **Out-Of-Gas** exception is thrown
> - Any changes made to storage variables, any account transfers, are **reverted** to their state before this method call
> - You are ***still charged*** the gas fee for every instruction leading up to the exception
> - Like other exceptions, it can be ***caught*** by a handler function
> - Methods can be invoked with just a portion of available gas

**Approfondimento.** L'esecuzione è atomica: un'eccezione out-of-gas annulla ogni effetto della chiamata, la stessa semantica di "revert" di un `require` fallito, ma il gas viene speso; altrimenti gli attaccanti potrebbero far calcolare gratis ogni nodo. Quando il contratto A chiama il contratto B con solo una parte del suo gas (esplicitamente, come in `b.call{gas: 50000}(...)`, o automaticamente, poiché viene passato al massimo 63/64 del gas rimasto, EIP-150), esaurire il gas in B annulla solo gli effetti di B: A riceve un indicatore di fallimento (`call` restituisce `false`) o cattura l'errore con `try`/`catch` (Solidity 0.6+), e prosegue. Il pericolo è ignorare quell'indicatore: proseguire come se un pagamento fosse riuscito è il bug chiamato "unchecked send", che nel 2016 fece perdere al contratto "King of the Ether Throne" dei pagamenti destinati ai suoi giocatori. Un attaccante può anche scegliere il gas di una transazione in modo che una chiamata interna fallisca mentre quella esterna riesce ("insufficient gas griefing").

### Slide 47 · Etherscan: una transazione rimasta senza gas

![Lezione 18, pagina 47](L18_p47.webp "50% 1400x699")

**Figura.** La slide non ha titolo: è la pagina di una transazione su Etherscan (schede Overview, State Changes, Comments): Transaction Hash 0x679d887dd23623c5477bffb62f854215b97; Block 3910317 (5926643 Block Confirmations); Timestamp 1022 days 9 hrs ago (Jun-21-2017 11:16:46 PM +UTC); From 0x7ed1e469fcb3ee19c0366d829e29; To: Contract 0x12444b6ec62e616ebc8a23e5, con l'avviso in rosso "Warning! Error encountered during contract execution [**Out of gas**]", indicato da una freccia rossa; Value: 1.5651901706057287 Ether ($269.82) - [CANCELLED]; Transaction Fee: 0.00126 Ether ($0.22); "Click to see More".

**Approfondimento.** Una vera transazione fallita del 2017: gli ether inviati al contratto (1,565) non sono stati trasferiti (il valore è "CANCELLED" e resta a chi li ha inviati), ma la tariffa è stata pagata. Con un errore out-of-gas l'esecuzione consuma tutto il gas messo a disposizione, quindi chi invia paga l'intero limite di gas (slide 46).

### Slide 48 · MetaMask: errore nella transazione

![Lezione 18, pagina 48](L18_p48.webp "50% 1400x762")

**Figura.** La slide non ha titolo: mostra una finestra di conferma di MetaMask ("MetaMask Notification", Main Ethereum Network) per una transazione da "Account 3" a "0xeE03…F8…", metodo WITHDRAW, importo ◆0 ($0.00), schede DETAILS e DATA. A destra: GAS FEE ◆0.19602 ($77.39); AMOUNT + GAS FEE, TOTAL ◆0.19602 ($77.39); un riquadro rosso "ALERT: Transaction Error. Exception thrown in contract code."; i pulsanti Reject e Confirm.

**Approfondimento.** Prima di inviare, i wallet simulano la transazione per stimarne il gas. Qui la simulazione fallisce, il contratto lancerebbe un'eccezione, e MetaMask avverte che confermare servirebbe solo a pagare una tariffa di quasi 0,2 ether (77 dollari) per una transazione che non fa nulla. Transazioni del genere vanno rifiutate: nel migliore dei casi sono inutili, e potrebbero far parte di un tentativo di phishing.

### Slide 49 · Recap: Gas in Ethereum

> Pay for the computation you use with gas
>
> Gives a good reason to optimize your code
>
> Next time: a case study comparing smart contracts with legal contracts

**Approfondimento.** Ottimizzare un contratto (meno scritture nello storage, variabili compatte, niente cicli senza limite) fa risparmiare denaro ai suoi utenti. Il gas fa anche parte della superficie d'attacco: il limite di gas del blocco (slide 41), le chiamate che falliscono per mancanza di gas (slide 46) e le ipotesi di costi fissi (slide 45) compaiono tutti in attacchi reali.

## Smart contract e contratti del mondo reale (pagine 50-55)

La pagina 50 è il divisore di sezione "Part 5: Smart contracts vs real world contracts".

### Slide 51 · Traditional contracts: the basic elements

> - Offer and acceptance
> - Consideration
> - Mutual agreement
> - Legality and Capacity
>
> How could we make a smart contract that models this contract?

![Lezione 18, pagina 51](L18_p51.webp "45% 809x573")

**Figura.** Una pergamena con il testo "If Bob pays Alice 1.0 ETH by Feb 21, then Alice will transfer 1.0 CAT tokens to Bob.", firmata "*Alice*" a mano.

**Approfondimento.** Nel diritto dei contratti un contratto richiede: una **proposta** di una parte e la sua **accettazione** da parte dell'altra; la **consideration** (il corrispettivo), qualcosa di valore dato da ciascuna parte (qui ether contro token CAT); il **mutuo accordo**, entrambe le parti capiscono gli stessi termini e li accettano; **liceità e capacità**, l'oggetto è lecito e le parti sono in grado di stipulare un contratto (maggiorenni, capaci di intendere e di volere). La pergamena di Alice è una semplice proposta condizionata; la slide successiva la trasforma in codice.

### Slide 52 · Example: Offering a token for sale

```solidity
contract ContractOffer {

    address payable public Alice = address(0x0 /**/);
    address payable public   Bob = address(0x0 /**/;
    /* Hardcoded address of the CAT token */
    Token public CatToken = Token(address(0x0 /**/));

    function bobAcceptsOffer() public payable {
        require(msg.sender == Bob);  /* Only offered to Bob */
        require(msg.value == 1.0 ether); /* Payment must be 1 ETH */
        require(now <= 1613937837); /* Offer good through Feb 21 */

        // Transfer the payment to Alice
        Alice.transfer(1.0 ether);

        // Transfer the CAT token to Bob
        CatToken.transferFrom(Alice, Bob, 1.0);
    }
}
```

**Analisi del codice.** Il codice è alle righe 3-21 di un file.

- *Che cosa fa.* Gli indirizzi di Alice, di Bob e del token CAT sono scritti nel contratto (gli `0x0 /**/` sono segnaposto per gli indirizzi veri). Solo Bob può accettare, solo pagando esattamente 1 ether, e solo fino al timestamp 1613937837, cioè il 21 febbraio 2021, 20:03:57 UTC (`now` è il vecchio nome di `block.timestamp`, rimosso in Solidity 0.7). Gli ether vanno ad Alice e un token CAT va da Alice a Bob con `transferFrom`, che funziona solo se Alice ha autorizzato il contratto con `approve` (slide 62). Entrambi i trasferimenti sono nella stessa transazione: se il trasferimento del token fallisce, viene annullato anche il pagamento di Bob. Lo scambio è atomico, e nessuno deve fidarsi dell'altra parte.
- *Problemi.*
  - Alla riga 6 manca una parentesi chiusa, `address(0x0 /**/;`, quindi il codice così com'è scritto non compila.
  - Bob può chiamare di nuovo `bobAcceptsOffer`: niente registra che la proposta è stata accettata, quindi finché l'autorizzazione di Alice lo copre, ogni chiamata vende un altro token per un altro ether. Manca un flag `bool accepted`.
  - `1.0` è un numero delle unità più piccole del token: un token ERC-20 di solito ha 18 decimali, quindi "1.0 CAT tokens" dovrebbe essere `1e18` unità; così com'è scritto Bob riceve 10⁻¹⁸ CAT.
  - Se il contratto viene pubblicato con i segnaposto, `Alice` è l'indirizzo zero, e gli ether inviati a esso sono persi per sempre.

### Slide 53 · Example: Offering a token for sale

> - ***Offer and acceptance***
>
>   To accept an offer, have to digitally sign the transaction.
>
>   Alice would have to transfer asset to the contract ahead of time
>
> - ***Consideration***
>
>   Payment is collected in the blockchain's native currency
>
> - ***Mutuality***
>
>   The high level code for the contract is typically published
>
> - ***Capacity / Legality***
>
>   The execution of the contract code automatically carry out the transfer of the digital asset in the same transaction as the payment.

**Approfondimento.** Come gli elementi legali corrispondono allo smart contract:

- **Proposta e accettazione**: Alice fa la proposta pubblicando il contratto; Bob accetta firmando una transazione che chiama `bobAcceptsOffer`. Perché sia certo che l'asset verrà consegnato, Alice deve bloccarlo nel contratto in anticipo (escrow) o almeno autorizzare il contratto a prenderlo.
- **Consideration**: ether, pagati insieme all'accettazione.
- **Mutuality**: i termini sono il codice; le parti concordano sugli stessi termini se il sorgente è pubblicato e verificato (slide 11), e se sanno leggerlo.
- **Capacity / Legality**: nessuno le controlla: chiunque abbia una chiave può chiamare il contratto. Ciò che il contratto offre invece è un'esecuzione automatica e atomica: pagamento e consegna avvengono nella stessa transazione, oppure non avvengono affatto.

### Slide 54 · "Smart contracts" conceptualized by Szabo in 1994

> *A smart contract is a **computerized transaction protocol that executes the terms of a contract**. The general objectives are to satisfy common contractual conditions (such as payment terms, liens, confidentiality, and even enforcement), **minimize exceptions** both malicious and accidental, and **minimize the need for trusted intermediaries**. Related economic goals include **lowering fraud loss, arbitrations and enforcement costs**, and other transaction costs.*
>
> -Nick Szabo "The Idea of Smart Contracts"

**Approfondimento.** Nick Szabo, informatico e giurista, introdusse il termine nel 1994; il suo esempio classico è il distributore automatico, che fa rispettare un contratto semplice (entrano monete, esce il prodotto) senza alcun intermediario. Ethereum (2015) ha reso l'idea praticabile eseguendo i contratti su una blockchain. Gli obiettivi si scontrano con la realtà in due punti. "Minimize exceptions both malicious and accidental": in pratica i bug nei contratti hanno causato perdite enormi (l'attacco a The DAO del 2016, Lezione 17; i wallet di Parity), e il codice immutabile rende permanenti gli errori. "Minimize the need for trusted intermediaries": la fiducia si sposta da banche e notai al codice, ai suoi autori e revisori, e agli oracoli che portano sulla catena i dati esterni.

### Slide 55 · Questions

> Consider the Dutch Auction smart contract.
>
> How could we describe it based on the four elements of a legal contract?
>
> How could we describe it based on Szabo's smart contract objectives?

**Approfondimento.** Una possibile risposta per l'asta della slide 35. **Proposta**: il venditore pubblica l'asta con un prezzo pubblico e decrescente e affida il gattino al contratto; **accettazione**: un compratore chiama `buyNow` con abbastanza ether; **consideration**: ether contro il gattino; **mutuality**: codice pubblicato e parametri pubblici; **capacità e liceità**: non controllate, chiunque può comprare. Quanto agli obiettivi di Szabo: i termini di pagamento sono fatti rispettare dal codice, in una sola transazione atomica, senza una casa d'aste come intermediario, e con costi bassi (solo il gas); ma le "eccezioni" non sono eliminate, come mostrano i problemi trovati nella slide 35.

## Token fungibili e non fungibili (pagine 56-64)

La pagina 56 è il divisore di sezione "Part 6: Fungible and Non-Fungible Tokens on Ethereum".

### Slide 57 · What are tokens?

> Tokens are smart contracts that function as digital assets

![Lezione 18, pagina 57](L18_p57.webp "50% 925x782")

**Figura.** Un gruppo di utenti con tre frecce a doppio senso: una porta monete e ha l'etichetta "Transfer transaction"; una va a un **Contract** con i suoi "methods"; una va a un **Token**, un riquadro di contratto con una nuvola di monete sull'angolo e i metodi "transfer", "checkbalance", "...".

**Approfondimento.** Un token è un contratto che tiene un registro di saldi (un mapping dagli indirizzi agli importi) e offre metodi per trasferirli: le "monete" esistono solo come voci nello storage del contratto. L'ether è la valuta nativa, spostata dalle transazioni stesse; i token sono valute e asset definiti dalle applicazioni (stablecoin come USDC, token di governance, oggetti da collezione). La sicurezza di un token è la sicurezza del suo codice: un bug al suo interno crea o distrugge valore, come gli integer overflow nelle funzioni `mintToken` elencati nella Lezione 1 (slide 16-17).

### Slide 58 · Etherscan: il token CryptoKitties

![Lezione 18, pagina 58](L18_p58.webp "50% 1400x966")

**Figura.** La slide non ha titolo: mostra la pagina Etherscan del token **CryptoKitties** (tag CryptoKitties, NFT, Collectibles; in alto "Eth: $3,267.71 (+0.48%) | 43 Gwei"). Overview [ERC-721]: Max Total Supply 2,007,928 CK; Holders 104,893 (0.00%); Transfers 5,507,348. Profile Summary: l'indirizzo del contratto (0x06…, tagliato), il sito ufficiale e i profili social. Schede Transfers, Holders, Inventory (selezionata), Info, DEX Trades, Contract, Comments: "Latest 10,000 active tokens (From a total of 2,008,006 tokens)", con le immagini dei gattini #1, #2 e #3 e gli indirizzi dei loro proprietari.

**Approfondimento.** Ogni gattino è un token con il proprio numero (#1, #2, ...), i propri attributi e il proprio proprietario: un token **non fungibile**. Etherscan può elencarli, contare i detentori e mostrare i trasferimenti senza sapere nulla di specifico su CryptoKitties, perché il contratto implementa lo standard ERC-721 (slide successiva).

### Slide 59 · Following a standard means some functionality can be completely generic

![Lezione 18, pagina 59](L18_p59.webp "50% 1339x836")

**Figura.** Il "Non-Fungible Token Tracker" di Etherscan (ERC-721): "Non-Fungible Tokens (NFT)", "A total of 15,282 ERC-721 Token Contracts found", le pagine "First < Page 1 of 306 > Last", e una tabella di token con i loro trasferimenti nelle ultime 24 ore e negli ultimi 3 giorni: 1 Template 10,452 e 11,174; 2 Art Blocks 5,133 e 12,872; 3 Gauntlets 4,317 e 5,718.

**Approfondimento.** Poiché migliaia di contratti implementano la stessa interfaccia, un solo strumento generico può elencarli, mostrarli e trasferirli tutti: wallet, explorer e marketplace non hanno bisogno di codice specifico per ogni token. Lo stesso vale per i token fungibili e per ERC-20 (slide 62).

### Slide 60 · Un contratto per token non fungibili

```solidity
contract NonFungibleToken {
    struct Record {
        string description;     // This could be a url that points to a jpeg, or anything else
        address owner;          //
        bool exists;            // True if this record exists (asset has been minted)
    }

    mapping (uint => Record) public table; //maps ids to records
    uint public nextid = 0;

    function ownerOf(uint id) view public  returns(address) {
        return table[id].owner;
    }

    address public administrator;
    constructor () public { administrator = msg.sender; }

    function mint(string memory description) public {
        require(msg.sender == administrator);
        require(table[nextid].exists == false);
        table[nextid].exists = true;
        table[nextid].owner = msg.sender;
        table[nextid].description = description;
        nextid += 1;
    }

    function transfer(uint id, address to) public {
        require(table[id].exists);
        require(ownerOf(id) == msg.sender);
        table[    id].owner = to;
    }
}
```

**Analisi del codice.** La slide non ha titolo: il codice (righe 3-34 di un file, su sfondo scuro) copre l'intera slide.

- *Che cosa fa.* Un NFT minimo: ogni asset è un `Record` con una descrizione (per esempio l'URL di un'immagine), un proprietario e un flag che dice se è stato creato ("minted"); i record sono conservati in un mapping dagli ID ai record. Solo l'`administrator`, cioè chi ha pubblicato il contratto, impostato dal costruttore, può coniare nuovi asset, che ricevono ID crescenti e appartengono all'amministratore. `transfer` permette al proprietario di un asset esistente di cederlo a un altro indirizzo; `ownerOf` restituisce il proprietario di un ID.
- *Che cosa manca o è debole.*
  - Non è ERC-721: non ci sono eventi `Transfer` (slide 25), né `approve`/`transferFrom` per i marketplace, né `safeTransferFrom` (che controlla che un contratto destinatario sappia gestire gli NFT), quindi gli strumenti generici (slide 59) non lo riconoscerebbero.
  - `transfer` accetta qualunque `to`, compreso l'indirizzo zero o uno scritto male: l'asset è allora perso per sempre.
  - Il "jpeg" è solo un URL: il token registra la proprietà di un puntatore, e l'immagine può cambiare o sparire a meno che non sia referenziata dal suo hash (per esempio su IPFS).
  - Il conio dipende da un'unica chiave dell'amministratore: se viene rubata, l'attaccante può coniare a volontà. (Il controllo `exists == false` è sempre vero, perché `nextid` punta sempre a un record nuovo; e `ownerOf` restituisce l'indirizzo zero per gli ID che non esistono.)

### Slide 61 · I 100 maggiori detentori di un token di prova

![Lezione 18, pagina 61](L18_p61.webp "50% 1400x709")

**Figura.** La slide non ha titolo: mostra un grafico a ciambella di Etherscan, "ECE398SC test token 1 Top 100 Token Holders" (Source: Etherscan.io). Un indirizzo, 0x1b326ad348e19ecfd1406c43d3bf7a95547ac55c, detiene più di metà della fornitura (la grande fetta blu); il resto è diviso fra decine di indirizzi, ciascuno una fetta colorata sottile con l'etichetta del suo indirizzo.

**Approfondimento.** Un token di prova **fungibile** creato per un corso: le unità sono intercambiabili e il contratto registra solo quante ne detiene ogni indirizzo. Il maggiore detentore è lo stesso indirizzo che possiede il dominio della slide 11, presumibilmente il docente che ha creato il token e l'ha distribuito agli studenti.

### Slide 62 · ERC20 defines interfaces for basic token behavior

> **Basic functionality:**
>
> https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md

```solidity
function totalSupply() constant returns (uint256 totalSupply)

function balanceOf(address _owner) constant returns (uint256 balance)

function transfer(address _to, uint256 _value) returns (bool success)
```

> **Delegating control:**

```solidity
function transferFrom(address _from, address _to, uint256 _value) returns (bool success)

function approve(address _spender, uint256 _value) returns (bool success)

function allowance(address _owner, address _spender) constant returns (uint256 remaining)
```

**Analisi del codice.** Nella slide il link è in alto a destra, accanto a "Basic functionality:".

- *Che cosa fa.* L'interfaccia dello standard ERC-20 (EIP-20, 2015) per i token fungibili. **Basic functionality**: il numero totale di token, il saldo di un indirizzo, e il `transfer` di token da chi chiama a un altro indirizzo. **Delegating control**: con `approve` un proprietario autorizza uno spender, di solito un contratto come l'exchanger della slide 26, a muovere fino a `_value` dei token del proprietario; lo spender chiama poi `transferFrom`; `allowance` dice quanto lo spender può ancora muovere. Le funzioni restituiscono `success`, e lo standard definisce anche gli eventi `Transfer` e `Approval`.
- *Sintassi vecchia.* `constant` è la vecchia parola chiave per `view` (rimossa in Solidity 0.5); la versione attuale dello standard usa `external view`.
- *Note di sicurezza.* Cambiare un'autorizzazione da N a M con `approve` è soggetto a una race: lo spender può vedere la modifica nella mempool, spendere prima il vecchio N e poi il nuovo M (il problema del front-running di approve); il rimedio usuale è portare prima l'autorizzazione a 0, oppure usare funzioni che la aumentano o la diminuiscono. Le autorizzazioni illimitate date a un contratto che viene poi sfruttato sono un modo comune in cui gli utenti perdono i loro token. Alcuni token restituiscono `false` invece di annullare la transazione, quindi chi chiama deve controllare il risultato (slide 26).

### Slide 63 · To summarize

> - Tokens are contracts that function like digital assets
> - Difference between fungible and non-fungible
>
>   Non-fungible: each asset in a series has a distinct ID, attributes
>
>   Fungible: the assets are interchangeable, can be summed up
>
> - Using standard interfaces for tokens help enable interoperability
>   - ERC20/721 feature many additional features, approval mechanism for composing with other contracts

**Approfondimento.** I token fungibili (ERC-20) si comportano come denaro: un saldo è solo un numero. I token non fungibili (ERC-721) sono come titoli di proprietà di oggetti distinti, ciascuno con il proprio ID. Il meccanismo delle autorizzazioni è ciò che permette ad altri contratti (exchange, aste, protocolli di prestito) di muovere token per conto dei loro proprietari, la componibilità della slide 12, ed è anche una delle principali fonti di rischio (slide 62).

### Slide 64 · There are plenty ERC20 templates on the internet

> This is a widely adopted standard, and so tons of tools/service will "just work" if you adhere to ERC20 standard
>
> http://lmgtfy.com/?q=erc20+token+template
>
> https://github.com/bitfwdcommunity/Issue-your-own-ERC20-token/blob/master/contracts/erc20_tutorial.sol
>
> https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/contracts/token/ERC20

**Approfondimento.** Il primo link è uno scherzo, un "let me google that for you". Per i token veri vale il consiglio dello sviluppo sicuro: riusare una libreria verificata e mantenuta come quella di OpenZeppelin (oggi il repository si chiama `openzeppelin-contracts`) invece di copiare modelli. Molti dei primi token copiavano il codice l'uno dall'altro insieme ai suoi bug, ed è per questo che lo stesso overflow di `mintToken` compare in decine di CVE (Lezione 1, slide 16-17).

## Extra: una prova con Ropsten e MetaMask (pagine 65-68)

La pagina 65 è il divisore di sezione "Bonus: Ropsten / Metamask Run-through".

### Slide 66 · Ropsten / Metamask Run-Through

> Beforehand - install Metamask
>
> In this demo:
>
> 1. Create a new Ropsten (testnet) account in Metamask, copy the address
> 2. Visit the ropsten faucet, request Ether
> 3. View the transaction in Etherscan
> 4. Send a transaction to the instructor to complete the first challenge

**Approfondimento.** MetaMask è un wallet nel browser: conserva le chiavi private dell'utente e firma le transazioni per i siti web. Un faucet regala ether della rete di test, e Etherscan mostra le transazioni. Ropsten è stata chiusa nel 2022; oggi lo stesso esercizio si fa sulla rete di test Sepolia. La **seed phrase** (la frase mnemonica) che MetaMask mostra all'installazione genera tutte le chiavi dell'utente: chiunque la scopra controlla tutti i conti, quindi non va mai condivisa né digitata in un sito web.

### Slide 67 · La home page di Etherscan

> https://etherscan.io/

![Lezione 18, pagina 67](L18_p67.webp "50% 1400x726")

**Figura.** La slide non ha titolo: mostra schermate della vecchia home page di Etherscan, accanto al logo di Etherscan ("The Ethereum Block Explorer", non riprodotto) e al suo link. Una fascia blu: market cap of $23.803 billion; $232.71 @ 0.0352 BTC/ETH; last block 6428950 (13.9 s); transactions 317.87 M (5.4 TPS); hash rate 263,624.79 GH/s; network difficulty 3,245.89 TH. L'elenco degli ultimi **Blocks**: il blocco 6428949 minato da SparkPool (21 transazioni in 3 secondi, ricompensa del blocco 3.25126 ether), 6428948 da Ethermine (117 transazioni in 25 secondi, 3.30499 ether), 6428947 da MiningPoolHub_1 (48 transazioni in 4 secondi, 3.08219 ether), 6428946 da MineralPool. L'elenco delle ultime **Transactions**: hash di transazioni con mittente, destinatario e importo (0.02230033 ether, 0.01 ether, ...), tutte ">32 secs ago".

**Approfondimento.** Un block explorer è la finestra sullo stato pubblico della catena: chiunque può vedere ogni blocco, ogni transazione, ogni saldo e ogni contratto, ed è per questo che sulla catena non si può conservare nulla di segreto (slide 23). La schermata risale all'epoca della proof-of-work, con i mining pool che producevano i blocchi e guadagnavano una ricompensa per ciascuno.

### Slide 68 · Several links for creating a ropsten wallet

> Get testnet Ether from the faucet
>
> Send some tETH (any amount) the instructor:
>
> 0x0974d3A22bDB7f73dCAb552a71896A2150DD2346

**Figura.** I loghi di MetaMask e di MyEtherWallet, i titoli "Mnemonic Code Converter", "MetaMask Ether Faucet" e "Ethereum Ropsten Faucet" (link ai rispettivi siti) e un codice QR, presumibilmente dell'indirizzo del docente (non riprodotto).

**Approfondimento.** MyEtherWallet è un wallet web e il Mnemonic Code Converter uno strumento che ricava le chiavi da una seed phrase (BIP-39): vanno bene entrambi per esperimenti con conti di prova, ma una seed phrase vera non va mai digitata in un sito web. tETH è ether di prova, senza valore.

## I tipi di dato di Solidity (pagine 69-72)

Le ultime quattro slide sono materiale extra sui tipi di dato di Solidity.

### Slide 69 · Basic datatypes available in Solidity

> **Integers:**
>
> int, int8, int16, …, int256
>
> uint, uint8, uint16, …, uint256
>
> Solidity is statically typed, like C or Java, but unlike python and javascript

```solidity
uint8 x = 15;
uint8 y = 255;
return x+y;
```

**Analisi del codice.**

- *Che cosa fa.* Somma due interi senza segno di 8 bit. I tipi interi esistono a passi di 8 bit, da `int8`/`uint8` a `int256`/`uint256`.
- *La trappola.* 15 + 255 = 270 non sta in un `uint8` (massimo 255). Prima di Solidity 0.8 il risultato si riavvolgeva in silenzio a 270 - 256 = **14**; dalla 0.8 l'aritmetica è controllata e l'operazione annulla la transazione, a meno che non sia scritta dentro un blocco `unchecked { ... }`. Bug di overflow di questo tipo stanno dietro le CVE sui token della Lezione 1 (slide 16-17) e l'attacco "batchOverflow" del 2018, in cui una moltiplicazione andò in overflow e creò quantità enormi di un token; prima della 0.8 la difesa era la libreria SafeMath.

### Slide 70 · Integer Conversions in Solidity

> - Syntax most similar to python, but the behavior is like C
> - Some restrictions on integer conversions, only change sign or size in one conversion
>
> Question: what value will y take?

```solidity
int x = -2;
uint y = uint(uint8(int8(x)));
```

**Analisi del codice.**

- *Che cosa fa.* Tre conversioni esplicite, dall'interno verso l'esterno. `int8(x)` cambia solo la dimensione: tiene gli 8 bit più bassi di -2, che come numero con segno di 8 bit vale ancora -2 (bit `11111110`). `uint8(...)` cambia solo il segno: gli stessi bit letti come numero senza segno valgono **254**. `uint(...)` cambia di nuovo solo la dimensione, estendendo con zeri: `y` = **254**.
- *Perché la catena.* Da Solidity 0.8 una conversione esplicita può cambiare il segno o la dimensione, non entrambi insieme, quindi `uint(int8(x))` o `uint8(x)` con `x` di tipo `int` non compilano: il programmatore deve esplicitare i passaggi, e quindi vedere che cosa succede ai bit. Le conversioni esplicite non vengono mai controllate a run time: troncare un valore grande a un tipo più piccolo perde in silenzio i bit alti, una fonte frequente di bug.
- *Nota.* La sintassi di Solidity è modellata soprattutto su JavaScript e C++, con qualche influenza di Python; il comportamento degli interi (dimensione fissa, complemento a due) è quello del C.

### Slide 71 · Arrays and lists in Solidity

> Statically sized array:

```solidity
int32[10] memory fixSizeArray;
fixSizeArray[2] = 15;
fixSizeArray[5] = 30;
```

> Dynamic length array: (more expensive, still can't change once created)

```solidity
int32[] memory varSizeArray = new int32[](x);
varSizeArray[2] = 15;
varSizeArray[5] = 30;
```

> Array in storage: (persists across transactions)

```solidity
address[] listOfCallers;

function append() public returns(uint) {
    listOfCallers.push(msg.sender);
    return listOfCallers.length;
}
```

**Analisi del codice.**

- *Che cosa fa.* Un array di dimensione fissa di dieci `int32` in memoria; un array in memoria la cui lunghezza `x` viene decisa a run time con `new` (dopo non può crescere: gli array in memoria non hanno `push`); e un array dinamico nello storage, che conserva il suo contenuto fra una transazione e l'altra e cresce con `push`: `append` aggiunge l'indirizzo di chi chiama e restituisce la nuova lunghezza.
- *I limiti.* Ogni accesso viene controllato: `fixSizeArray[10]` o un indice oltre `x` annulla la transazione. A differenza del C (Lezioni 3 e 19), Solidity è memory-safe per gli array.
- *Note di sicurezza.* Chiunque può chiamare `append` tutte le volte che vuole, quindi l'array cresce senza limite: qualunque funzione che scorre `listOfCallers` finirà per superare il limite di gas del blocco e diventerà impossibile da eseguire (slide 41). In Solidity prima della 0.6 la `length` di un array nello storage si poteva assegnare direttamente: accorciare un array vuoto faceva andare la sua lunghezza in underflow a 2^256 - 1, così che l'array copriva l'intero storage e un attaccante poteva sovrascrivere qualunque variabile attraverso di esso, un classico degli esercizi capture-the-flag sugli smart contract.

### Slide 72 · Basic datatypes available in Solidity

> **Strings and Bytes:**
>
> *bytes32*: fixed size, returned by hash functions
>
> *bytes memory*: array of bytes
>
> *string memory:* array of characters
>
> *abi.encode( )*: flattens multiple arguments to a *bytes*
>
> Fancier string libraries are available too

```solidity
string memory s = "hello world";
bytes memory x = abi.encode(s);
bytes32 y = sha256(x);
bytes32 z = sha256(abi.encode(y));
```

**Analisi del codice.**

- *Che cosa fa.* `abi.encode(s)` serializza la stringa nel formato ABI standard (offset, lunghezza, dati riempiti fino a 32 byte, come nei log della slide 11); `sha256` calcola l'hash dei byte e restituisce un `bytes32`; l'ultima riga calcola l'hash dell'hash, dopo averlo codificato di nuovo. (Ethereum stesso usa soprattutto `keccak256`, anch'esso disponibile.)
- *Note.* Una `string` è una sequenza di byte UTF-8: Solidity non ha operazioni predefinite per confrontare, concatenare o misurare le stringhe in caratteri (le stringhe si confrontano confrontandone gli hash), da qui le "fancier string libraries". Quando si calcola l'hash di più valori insieme, va preferito `abi.encode` ad `abi.encodePacked`: la codifica compatta delle due stringhe `("a", "bc")` e di `("ab", "c")` è la stessa, quindi due input diversi danno lo stesso hash, il che rompe le firme e gli impegni (commitment) costruiti su di esso.
