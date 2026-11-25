La Lezione 16 è un corso lampo su blockchain e smart contract, lo scenario dell'attacco della Lezione 17. Parte da un problema tradizionale, la notarizzazione di un contratto (un notaio e un archivio di cui ci si deve fidare entrambi), lo automatizza con un servizio notarile centrale (e ne mostra i problemi di integrità e disponibilità), e poi lo decentralizza: che cos'è una **blockchain** (blocchi di transazioni firmate da cui si calcolano i saldi dei conti), le sue proprietà (persistenza, liveness, verificabilità pubblica), come si propongono nuovi blocchi e si coniano nuove monete con la **proof-of-work** (e, in alternativa, la **proof-of-stake**), e come gli **smart contract di Ethereum** vengono pubblicati ed eseguiti da tutti i nodi, con due esempi in pseudo-codice (un contratto per un token e uno per un notaio) e il costo dell'esecuzione (il **gas**). Si chiude sul perché qui la sicurezza del software conta ancora di più: gli smart contract sono codice ordinario che maneggia direttamente denaro, come ha mostrato l'attacco a The DAO. Le slide sono 28.

## Il problema della notarizzazione (pagine 1-8)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Smart Contracts - Crash Course

### Slide 2 · The Notarization Problem

> - Alice wants to buy a house.
> - With the aid of some entity (e.g. real estate company) produces a contract
> - The contract C must be *notarized* and *deposited* somewhere.
> - What do we need to conclude the procedure?
>   - A **notary**, whose aim is to validate the contract
>   - A secure **archive** where the contract can be deposited
>
> The **notary** must be trusted: he must sign *only* correct contracts
>
> The **archive** must be *publicly* accessible and should be *untamperable*

**Approfondimento.** L'esempio che accompagna la lezione. Comprare una casa richiede due servizi fidati: un **notaio**, che controlla che il contratto sia corretto (le parti sono chi dicono di essere, le clausole sono legali) e lo certifica, e un **archivio** (un registro pubblico) che conserva il contratto certificato. I due requisiti della slide sono proprietà di sicurezza nel vocabolario della Lezione 1: il notaio deve essere affidabile, firmando *solo* contratti corretti (**integrità** della certificazione), e l'archivio deve essere **accessibile pubblicamente** (**disponibilità**, e verificabilità da parte di chiunque) e **non manomettibile** (**integrità** dei registri). Tutta la lezione si chiede come ottenere queste proprietà senza doversi fidare di una sola persona o di un solo server.

### Slide 3 · Notarization example - Basic interaction (l'interazione di base)

> The certificate is a document signed by the notary

![Lezione 16, pagina 3](L16_p03.webp "50% 1400x930")

**Figura.** Due omini, **A** (**Alice**) a sinistra e **B** (il **Notary**) a destra. Alice manda a B un documento insieme a "**+ 10 EUR**" (freccia verso destra). B pensa (nuvoletta): "**Generate certificate For**" il documento. B rimanda ad Alice un documento certificato (un documento con un sigillo) e, con una freccia verso l'alto, deposita un'altra copia certificata in un archivio.

**Approfondimento.** La procedura tradizionale: Alice paga il notaio, il notaio controlla il documento e restituisce un **certificato**, una copia del documento con la firma e il sigillo del notaio, e ne deposita una copia nell'archivio. Chiunque può verificare in seguito il contratto chiedendo all'archivio. La fiducia è riposta in due parti: il notaio (che potrebbe certificare un contratto falso, se disonesto o corrotto) e l'archivio (che potrebbe perdere o alterare i registri).

### Slide 4 · Digital Interaction with the notary

![Lezione 16, pagina 4](L16_p04.webp "50% 1400x911")

**Figura.** Lo stesso scambio via Internet. **A** manda a B un documento "**+ payment**" su una connessione segnata da un lucchetto rosso, e riceve indietro un documento certificato. La nuvoletta di A dice "**B gets 10 euros If he certifies my document**". **B** sta dentro un riquadro, con un documento certificato e una chiave rossa (la chiave di firma di B); dal riquadro una freccia porta il documento certificato in basso verso una **PKI** (un database con un server e un archivio). La legenda in fondo: lucchetto "**= Secure connection (e.g. HTTPs)**".

**Approfondimento.** La versione digitale sostituisce la carta con la crittografia. La connessione è protetta da **TLS** (HTTPS), che dà riservatezza e integrità in transito e autentica il server. Il notaio firma con la sua **chiave privata**, e chiunque può verificare la firma con la chiave pubblica del notaio, la cui autenticità è garantita da una **PKI** (infrastruttura a chiave pubblica: autorità di certificazione che legano le chiavi pubbliche alle identità); la PKI conserva anche i documenti certificati. La fiducia non è sparita, si è spostata: Alice deve ancora fidarsi che B certifichi solo documenti corretti, e tutti devono fidarsi della PKI.

### Slide 5 · Automatic Notarization - First attempt (primo tentativo)

![Lezione 16, pagina 5](L16_p05.webp "50% 1400x922")

**Figura.** Il notaio umano è sostituito da un **Notary Service**: un riquadro con un server, una finestra di codice ("</>") che produce documenti certificati, e la chiave di firma rossa. **A** scambia documenti con il proprio server, collegato alla **A's bank**; il server di A manda il documento "**+ payment**" al servizio notarile su una connessione sicura (lucchetto rosso) e riceve indietro un documento certificato. Il servizio notarile è collegato alla **B's bank** e manda il documento certificato alla **PKI**. Una nuvoletta del servizio dice "**Code that Validates and Signs**".

**Approfondimento.** Primo tentativo di automazione: il notaio diventa un programma che gira su un server, che valida il documento, incassa il pagamento attraverso le banche e firma in automatico. È più veloce ed economico, ma ora ogni componente è software, e la slide successiva elenca che cosa può andare storto.

### Slide 6 · Automatic Notarization issues (i problemi)

> - Other than common software vulnerabilities issues in:
>   - Server's code
>   - Notarization program code
>
> We have that an untrusted server might be compromised!
>
> ➔ Integrity issues: Corrupted notary server will notarize invalid contracts
>
> ➔ Availability issues: Compromised database might be violated, and records *deleted,* DoS attacks
>
> ➔ *Extra*: we need to trust banks and banks' servers

**Approfondimento.** L'automazione eredita tutti i problemi di questo corso. Il codice del server e il programma di notarizzazione possono contenere le solite vulnerabilità (buffer overflow, injection, Lezioni 3-9), e anche con un codice perfetto il **server stesso** è un unico punto di fiducia che può essere compromesso (da un attaccante esterno o da un insider):

- **Integrità**: un server notarile corrotto firma contratti non validi, e poiché possiede la chiave di firma i suoi certificati falsi sembrano perfettamente validi.
- **Disponibilità**: il database può essere violato e i registri cancellati, e un attacco di denial of service può fermare il servizio.
- E i pagamenti dipendono ancora dalle **banche** e dai loro server: altre parti di cui fidarsi.

La radice comune è la **centralizzazione**: un server, una chiave, un database. Le slide successive la eliminano.

### Slide 7 · Second attempt - Decentralize everything! (secondo tentativo)

![Lezione 16, pagina 7](L16_p07.webp "50% 1400x888")

**Figura.** Un omino manda un documento "**+ payment**" all'icona di una rete (un cubo al centro collegato a otto nodi) e riceve indietro un documento certificato; la rete pensa (nuvoletta) "**Validates**" il documento.

**Approfondimento.** L'idea: sostituire l'unico server notarile con una **rete di molti nodi indipendenti** che insieme validano, eseguono e registrano la notarizzazione. Non bisogna fidarsi di nessun singolo nodo, perché il risultato viene accettato solo se la rete nel suo insieme è d'accordo (slide 10).

### Slide 8 · Second attempt - Decentralize everything! (secondo tentativo)

> This system should be
>
> - Programmable
> - Publicly accessible
> - Publicly verifiable
> - Immutable
> - Manages money!
>
> - ➔ Solution: Blockchains!
>   - ➔ introduced by for the first time by Satoshi Nakamoto in 2008 had revolutionized the idea of currencies (decentralized currency)
>     - ➔ https://bitcoin.org/bitcoin.pdf
>     - ➔ First notion of programmability (scripts)

![Lezione 16, pagina 8](L16_p08.webp "41% 745x744")

**Figura.** L'icona della rete della slide 7: un cubo al centro, collegato a otto nodi.

**Approfondimento.** I requisiti di un notaio decentralizzato sono i requisiti di una blockchain: **programmabile** (deve eseguire la logica della notarizzazione), **accessibile pubblicamente** e **verificabile pubblicamente** (chiunque può inviare e controllare), **immutabile** (i registri non si possono alterare: il cosiddetto "archivio non manomettibile" della slide 2) e capace di **gestire denaro** (per pagare il servizio senza banche). La risposta è la **blockchain**, introdotta dal misterioso Satoshi Nakamoto nel white paper di Bitcoin del 2008 (il PDF citato), che creò la prima moneta decentralizzata, senza banca centrale né intermediario dei pagamenti. Bitcoin aveva già una forma limitata di programmabilità, gli **script** che stabiliscono a quali condizioni si possono spendere le monete; Ethereum (slide 14) l'ha generalizzata a programmi arbitrari.

## Le blockchain (pagine 9-13)

### Slide 9 · What is a blockchain?

> - A **blockchain** is a decentralized list of blocks that can be extended.
> - In the Ethereum blockchain, accounts are represented by signature public keys (addresses), used to verify transactions.
> - Account Balances can be recomputed by looking at the transactions inside the blocks
> - A block contains:
>   - Set of *valid* signed transactions justifying balance updates
>   - Other informations needed to verify block *validity* (e.g., hash the previous block, …)
>
> Tx is included in a block if
>
> - the signature σ verifies under A's public key
> - A has enough balance

![Lezione 16, pagina 9](L16_p09.webp "50% 1400x362")

**Figura.** Tre blocchi in fila, ciascuno con una freccia che punta al precedente (verso sinistra). Sopra ogni blocco, i saldi dopo di esso: primo blocco ("…"): A.Balance = 3, B.balance = 3; secondo blocco ("…", "**Tx=(pay,A,B,1,σ)**"): A.Balance = 3, B.balance = 4 (il 4 in rosso); terzo blocco, disegnato sbiadito ("… Txs…", con una freccia sbiadita tratteggiata che arriva da destra): A.Balance = 3, B.balance = 4 (il 4 in rosso).

**Approfondimento.** Una blockchain è un **elenco di blocchi a cui si può solo aggiungere**, replicato su ogni nodo. Ogni blocco contiene transazioni e l'**hash del blocco precedente**, che incatena i blocchi: cambiare un blocco vecchio ne cambierebbe l'hash e romperebbe tutti i collegamenti successivi, quindi la storia non si può riscrivere senza rifare tutti i blocchi successivi (slide 12-13). I conti sono identificati da **chiavi pubbliche** (in Ethereum l'indirizzo è derivato dall'hash della chiave pubblica), e una transazione come **Tx=(pay,A,B,1,σ)**, "A paga 1 a B", porta la **firma digitale σ** di A. Nessuno conserva i saldi in una tabella centrale: vengono **ricalcolati** ripercorrendo tutte le transazioni dall'inizio. Una transazione viene accettata solo se la **firma è valida** con la chiave pubblica di A (solo A può spendere i soldi di A) e **A ha un saldo sufficiente** (niente scoperto, niente double spending). Nella figura, dopo il pagamento il saldo di A dovrebbe passare da 3 a 2 (come nella slide 13), mentre la slide lo lascia a 3.

### Slide 10 · Blockchain properties

> - **Persistence**: Blocks are always available and cannot ever be modified.
> - **Liveness**: If a valid transaction is issued to the blockchain, it will eventually appear in a block.
> - **Public Verifiability**: Anyone can download and verify the validity of the blockchain.
>
> Such properties are guaranteed if less than 1/3 (or 1/2 depending on the consensus) of nodes is corrupted.
>
> A good blockchain has **thousands** of nodes keeping it alive.
>
> *Who proposes new blocks? Where such currency comes from?*

![Lezione 16, pagina 10](L16_p10.webp "50% 1181x578")

**Figura.** Una nuvoletta che contiene un riquadro tratteggiato ("…", "**Tx=(pay,A,B,1,σ)**") con una freccia tratteggiata che ne esce verso sinistra, collegata da piccoli cerchi all'icona di quattro persone attorno a un riquadro con un segno di spunta, con l'etichetta "**Consensus mechanism**".

**Approfondimento.** Le tre proprietà sono le garanzie di sicurezza di una blockchain, le stesse richieste all'archivio del notaio:

- **Persistenza** (integrità e disponibilità della storia): una volta consolidato, un blocco resta disponibile e immutato.
- **Liveness** (disponibilità del servizio, resistenza alla censura): nessuno può impedire che una transazione valida venga inclusa, prima o poi.
- **Verificabilità pubblica**: non serve fidarsi di alcun nodo, perché chiunque può scaricare la catena e controllare ogni firma, ogni saldo e ogni collegamento.

Valgono solo sotto un'**ipotesi di maggioranza onesta**: i protocolli di consenso tolleranti ai guasti bizantini tollerano meno di **1/3** di nodi corrotti, mentre il consenso a proof-of-work di Bitcoin richiede che l'attaccante controlli meno di **1/2** della potenza di calcolo (altrimenti un "attacco del 51%" può riscrivere la storia recente). Ecco perché contano migliaia di nodi indipendenti: corromperne un terzo o la metà è impraticabile. Il **meccanismo di consenso** della figura è il protocollo con cui i nodi si accordano su quale blocco viene dopo; le ultime domande introducono la slide successiva.

### Slide 11 · Block proposal and currency minting: Proof-of-work (BTC)

> - Who mints currency?
>   - As for gold, smth physical must correspond to smth «logical»
>   - Consensus nodes can verify that some work has been done to mint and assign some currency
>   - **Coinbase transaction:** special *transaction assigning coins to the winning proposer based on the proof that some computational work has been done.*
>   - ***HOW??***
>
> SHA-256 hash function outputs are random-like strings
>
> `Sha256(ab00)` = 3a1eef43a87fff51d535b1025e31d8c8fed3109eec247ca6beb252333d2f4fac
>
> `Sha256(ab01)` = a61df51f631f44da66aeaeb67cceec39d04812efe5c8246aacb70c780198bb2b
>
> Given 3a1eef43a87fff51d535b1025e31d8c8fed3109eec247ca6beb252333d2f4fac
>
> - The input `ab00` can be guessed only with brute force
> - Hash outputs are unrelated

**Approfondimento.** Le nuove monete devono essere create da qualcuno, e l'analogia è l'oro: l'oro ha valore perché estrarlo costa lavoro vero. Nella **proof-of-work** (Bitcoin) un nodo si guadagna il diritto di proporre il blocco successivo, e di pagarsi nuove monete con la speciale **transazione coinbase**, dimostrando di aver speso una grande quantità di calcolo. La dimostrazione si basa su due proprietà di una funzione hash crittografica come **SHA-256**:

- Le sue uscite sembrano **casuali**: input che differiscono per un solo carattere (`ab00`, `ab01`) danno uscite completamente **scorrelate** (l'effetto valanga), quindi dall'uscita di un input non si può imparare nulla sull'uscita di un input simile.
- È **unidirezionale** (resistente alla preimmagine): data un'uscita, l'unico modo di trovare un input che la produca è la **forza bruta**, provare un input dopo l'altro.

La proof-of-work trasforma questo in una lotteria in cui ogni biglietto è un calcolo di hash (slide successiva).

### Slide 12 · Proof-of-work

> - Brute forcing on long inputs needs a lot of computational power
> - A node, to earn currency, must propose a new block B incorporating the hash of the previous block pB concatenated with a *nonce*.
>   - *Hash(pB ||nonce) = H*
>   - The new block is valid if *H < T*, for a threshold T
> - *In other words*, *Hash(pB ||nonce)* shall contain at least a certain number of 0s at the beginning.
> - After finding (x=(pB,nonce),Hash(x)=0000…), the proposed block contains the hash pair (x,Hash(x)), the txs (taken from a pool of received transactions) and *the coinbase transaction*. Consensus nodes, upon block validation, will append the new block to the chain.

![Lezione 16, pagina 12](L16_p12.webp "50% 1400x400")

**Figura.** Il blocco precedente **pB**, un riquadro con un campo "**Prev. Hash**" e diverse transazioni ("**Tx**, **Tx**, …, **Tx**"), e un riquadro "**Nonce**" sono l'**input** di una "**Hash Function**"; il suo **output** è "**000…000XXXXXXXXXXXXXX**", e una graffa sotto gli zeri iniziali ha l'etichetta "**PoW Threshold**".

**Approfondimento.** Il rompicapo: trovare un **nonce** (un numero usato una volta) tale che l'hash del blocco precedente concatenato con il nonce sia **sotto una soglia T**, il che equivale a dire che l'hash comincia con un certo numero di zeri. Poiché l'uscita dell'hash è imprevedibile, l'unica strategia è provare i nonce uno per uno; ogni tentativo riesce con probabilità circa T/2²⁵⁶, quindi il lavoro atteso è fissato da T. La soluzione è **difficile da trovare ma banale da verificare**: qualunque nodo la controlla con un solo calcolo di hash. Il vincitore pubblica il blocco con la coppia (x, Hash(x)), le transazioni prese dall'insieme di quelle in attesa e la sua transazione coinbase; gli altri nodi lo verificano e lo aggiungono. Bitcoin regola la soglia ogni 2016 blocchi in modo che si trovi un blocco circa ogni 10 minuti, qualunque sia la potenza di calcolo totale. Lo stesso meccanismo protegge la storia: riscrivere un blocco vecchio significa rifare la proof-of-work di quel blocco e di tutti i successivi, più in fretta del resto della rete, il che è impossibile senza la maggioranza della potenza di calcolo (slide 10).

### Slide 13 · Proof-of-work

![Lezione 16, pagina 13](L16_p13.webp "50% 1400x865")

**Figura.** Un **Block proposer** (icona di persona) manda un riquadro tratteggiato con "**prevHash**=0000010101…, …, CB-tx=(mint, **10ETH**, A, σ)" (10ETH in rosso) all'icona del consenso, sopra la quale c'è scritto "**check if** *prevHash = Hash(pB||nonce)*". Una freccia va dall'icona del consenso in basso fino al nuovo blocco in testa alla catena. La catena, con frecce verso sinistra: un blocco "…" (A.Balance = 3, B.balance = 3); il **Block pB**, con "… Tx1=(pay,A,B,1,σ)" (A.Balance = 2, B.balance = 4); il nuovo blocco, con "**prevHash**=0000010101…, …, CB-Tx=(mint, **10ETH**, A, σ)" (A.Balance = **12** in rosso, B.balance = 4).

**Approfondimento.** L'intero ciclo in un'immagine. Il proponente A ha trovato un nonce per cui l'hash del blocco pB comincia con degli zeri, e propone un nuovo blocco che contiene quel **prevHash** e la sua **transazione coinbase** "conia 10 per A", firmata da A. I nodi **controllano** che prevHash sia davvero uguale a *Hash(pB||nonce)* (un solo calcolo di hash) e che le transazioni del blocco siano valide; poi aggiungono il blocco, e le monete coniate compaiono nel saldo di A (da 2 a 12). La slide usa ETH per la ricompensa, ma il meccanismo è quello di Bitcoin (e di Ethereum fino al 2022, slide 27).

## Gli smart contract di Ethereum (pagine 14-26)

### Slide 14 · Ethereum Smart Contracts - Programmable Money (denaro programmabile)

> - Any user with an account can deploy a turing-complete program (*contract*) through a blockchain transaction.
>   - The *Contract C* is an account of his own (it has an address)
>   - Users interact with the contract by sending contract transactions, including currency
>   - Blockchain and contract states are calculated by the nodes within the *Ethereum Virtual Machine*
> - Smart Contract functions provide an interface to
>   - exchange ETH under certain conditions
>   - Manage an *immutable database*
> - They enable a lot of interesting applications:
>   - *Alternative currencies:* **Alternative tokens** with some ETH value.
>   - Decentralized Finance (DeFi)
>   - Decentralized Autonomous Organizations (DAO)
>   - *NFT*: A unique ID assigned to the token guarantees its non-fungibility.
>     - Include data such as images: Decentralized Art.
>   - Decentralized Notaries
>   - …

**Figura.** Il logo di Ethereum sulla destra della slide.

**Approfondimento.** **Ethereum** (proposto da Vitalik Buterin nel 2013, attivo dal 2015) ha generalizzato gli script di Bitcoin negli **smart contract**: programmi in un linguaggio Turing-completo, di solito **Solidity**, compilati in bytecode per l'**Ethereum Virtual Machine (EVM)**. I fatti chiave:

- Un contratto viene pubblicato con una transazione e da quel momento vive al proprio **indirizzo**, con il proprio **saldo** in ether e il proprio **storage**: è un conto controllato dal codice invece che da una chiave privata.
- Gli utenti chiamano le sue funzioni mandando **transazioni** a quell'indirizzo, eventualmente con ether allegati; **ogni nodo** esegue la chiamata nella propria EVM, quindi tutti i nodi calcolano lo stesso nuovo stato (slide 17-26).
- Una volta pubblicato, il codice è **immutabile** (non si può correggere) e **pubblico** (chiunque può leggerlo e chiamarlo).

Le applicazioni: i **token**, monete alternative gestite da un contratto (lo standard ERC-20); la **DeFi**, exchange decentralizzati, prestiti e stablecoin gestiti interamente da contratti; le **DAO**, organizzazioni le cui regole e la cui cassa sono contratti (The DAO della Lezione 17); gli **NFT**, token con un identificatore unico, usati per rappresentare la proprietà di un oggetto unico come un'opera d'arte digitale; e i notai decentralizzati, l'esempio di questa lezione (slide 21). Il punto in comune è che **il codice controlla direttamente il denaro**: un bug non è un crash ma un furto (Lezione 1, slide 16-17 e 29-31).

### Slide 15 · Basic Token Smart Contract

```
Contract Token {
    int tknvalue;
    map balance (address=>int)
    …
    void deploy(int v) { tkn = v; }
    //Function to exchange ETH with Tokens
    void exchange (int quantity) payable {
    //sender.sent internal variable outputting the number of ETH sent together with the function input
        If (sender.sent >= quantity*tknvalue) balance[sender] += quantity*tknvalue
        }
    //Auxiliary function to retrieve the current user balance
    int getBalance() { return balance[sender]; }
}
```

**Analisi del codice.** Pseudo-codice (simile a Java, non vero Solidity) di un contratto minimo per un token, usato nell'esempio di esecuzione delle slide 16-20.

- *Che cosa fa.* Lo stato è il **prezzo** di un token in ETH (`tknvalue`) e una **mappa dagli indirizzi ai saldi in token**. `deploy(v)` viene eseguita una volta, quando il contratto viene creato, e fissa il prezzo (fa la parte di un costruttore). `exchange(quantity)` è **payable**, quindi riceve ETH con la chiamata: se gli ETH inviati (`sender.sent`, `msg.value` in Solidity) coprono `quantity*tknvalue`, il saldo in token di chi chiama viene aumentato. `getBalance()` restituisce il saldo di chi chiama.
- *Problemi da individuare* (la lettura del codice in stile d'esame):
  1. `deploy` assegna `tkn = v`, ma la variabile di stato si chiama `tknvalue`: così com'è scritto, il prezzo non viene mai impostato. Se il prezzo restasse 0, chiunque potrebbe comprare qualunque quantità di token gratis, perché `sender.sent >= quantity*0` è sempre vera.
  2. Il saldo viene aumentato di `quantity*tknvalue`, il **valore in ETH**, non di `quantity`, il numero di token: nell'esempio di esecuzione (slide 18-19), `exchange(2)` con un prezzo di 10 dà `balance[A]: 2`, il che corrisponde a `+= quantity`.
  3. `quantity*tknvalue` può andare in **overflow**: con una `quantity` enorme il prodotto si riavvolge in un numero piccolo, il controllo del pagamento passa e all'attaccante viene accreditato un numero enorme di token. È esattamente il bug BatchOverflow del 2018 (Lezione 1, slide 16-17; i problemi aritmetici della Lezione 8, slide 30-33). Con un `int` con segno viene accettata anche una `quantity` negativa.
  4. Se il controllo fallisce non succede nulla, ma gli ETH inviati restano nel contratto; e con `>=` viene trattenuto anche qualunque pagamento in eccesso. In Solidity un controllo fallito dovrebbe **annullare** (revert) la transazione, il che restituisce anche gli ETH.
- *In Solidity*, una versione corretta (da Solidity 0.8 l'overflow aritmetico annulla la transazione in automatico):

```solidity
contract Token {
    uint public tknvalue;                         // price of one token, in wei
    mapping(address => uint) public balance;

    constructor(uint v) { tknvalue = v; }

    function exchange(uint quantity) external payable {
        require(msg.value == quantity * tknvalue, "wrong payment");   // otherwise revert and refund
        balance[msg.sender] += quantity;
    }

    function getBalance() external view returns (uint) {
        return balance[msg.sender];
    }
}
```

### Slide 16 · Contract deployment

> - Bob deploys a new contract to the Blockchain through containing:
>   - The code
>   - The value of the contract (currency)
>   - The issuer signature

![Lezione 16, pagina 16](L16_p16.webp "50% 1400x621")

**Figura.** Un omino, il "**Contract issuer**", manda "**(deploy,T,code,10,σ)**" con una freccia all'icona del consenso, con l'etichetta "**Blokchain nodes**", che pensa (nuvoletta) "**T is valid**".

**Approfondimento.** Pubblicare un contratto è a sua volta una **transazione**: (deploy, T, code, 10, σ) porta il codice del contratto, un valore (10) e la firma σ dell'emittente, le tre voci dell'elenco puntato. I nodi la controllano come qualunque transazione (firma valida, saldo sufficiente) e il contratto riceve il proprio indirizzo. In Ethereum la transazione di pubblicazione porta il bytecode compilato e gli argomenti del costruttore, può trasferire ether al nuovo contratto, e chi lo crea paga in gas il costo della pubblicazione (slide 26). Nell'esempio, una volta pubblicato, lo stato del contratto contiene il prezzo del token `tknvalue: 10` (slide 17).

### Slide 17 · Contract execution

> The block proposer will include the new contract to the block

![Lezione 16, pagina 17](L16_p17.webp "50% 1400x759")

**Figura.** Il **Block proposer** (icona di persona) manda un riquadro tratteggiato con "TxA=…, TxB=…, …, (deploy,code,*T*,10,σ), (T,code)" all'icona del consenso; una freccia scende fino al nuovo blocco in testa alla catena ("…" ← "…" ← nuovo blocco). Il nuovo blocco contiene "TxA=…, TxB=…, …, (deploy,code, *T* ,10,σ), (C,code)", e sotto di esso lo stato risultante: "A.Balance: 20ETH", "B.Balance: …", "T.state = {*tknvalue*: 10}".

**Approfondimento.** Come qualunque transazione, la pubblicazione entra nella catena quando un proponente di blocchi la include in un blocco. Da quel momento il contratto **esiste sulla catena**: il suo codice e il suo **stato** fanno parte dello stato della blockchain che ogni nodo conserva, qui il prezzo del token `tknvalue: 10` fissato da `deploy`. (Il blocco contiene la coppia (contratto, codice); la slide la scrive una volta come (T,code) e una volta come (C,code).)

### Slide 18 · Contract execution

> All the nodes will run `exchange(2)` triggered by A to agree on the function output

![Lezione 16, pagina 18](L16_p18.webp "50% 1400x697")

**Figura.** **A** (un omino) manda "**(T,exchange,2,σ)**" all'icona del consenso, che pensa: "`T.state: { balance[A]: 2} T.balance: 20ETH; A.balance: 0`".

**Approfondimento.** Anche chiamare un contratto è una transazione: A manda (T, exchange, 2, σ), "chiama `exchange(2)` sul contratto T", con 20 ETH allegati (2 token a 10 ETH l'uno). Non c'è un server che esegue il contratto: **ogni nodo esegue la funzione** nella propria EVM sullo stesso input e sullo stesso stato, e poiché l'esecuzione è **deterministica** tutti ottengono lo stesso risultato: A ora possiede 2 token, il contratto custodisce i 20 ETH e il saldo in ether di A è 0. Questa replica è ciò che rende affidabile il risultato senza fidarsi di alcun singolo nodo, ed è anche il motivo per cui il codice dei contratti deve essere deterministico (niente casualità, niente orologio, niente dati esterni senza un oracolo).

### Slide 19 · Contract execution

> The block proposer will include the new state. To ensure validity, nodes re-run the code w.r.t the chain state

![Lezione 16, pagina 19](L16_p19.webp "50% 1400x724")

**Figura.** Il **Block proposer** manda un riquadro tratteggiato "… **(T,exchange,2,σ)**" all'icona del consenso. Sopra il blocco centrale, in rosso, "A.Balance: 20ETH", poi "B.Balance: …". La catena: "…" ← blocco "TxA=…, TxB=…, …, (T, code), …" ← nuovo blocco "… **(T,exchange,2,σ)**". Sotto il nuovo blocco, in rosso, "A.balance: 0", "T.balance: 20ETH", e in grassetto "**T.*state:* {…,balance[A]: 2}**".

**Approfondimento.** Il proponente include la chiamata in un nuovo blocco insieme allo stato risultante. Gli altri nodi non si fidano della parola del proponente: ciascuno **riesegue** la transazione sullo stato precedente della catena e accetta il blocco solo se ottiene lo stesso nuovo stato. Un proponente disonesto che avesse scritto, per esempio, `balance[A]: 2000` verrebbe respinto. È la verificabilità pubblica (slide 10) applicata al calcolo.

### Slide 20 · Contract execution

> Nodes will reject the transaction if Alice does not have enough ETHs to exchange 2 tokens (10 ETHs)

![Lezione 16, pagina 20](L16_p20.webp "50% 1400x791")

**Figura.** Il **Block proposer** manda "… **(T,exchange,2,σ)**" all'icona del consenso, che risponde con una nuvoletta "**REJECT**" (in rosso). La catena: un blocco "… Tx1=(pay,A,B,10,σ) …" ← un blocco "…"; accanto alla catena, "A.Balance: 10ETH" (in rosso), "B.Balance: …", "T.*state* = {*tknvalue*: 10}".

**Approfondimento.** L'altro caso: Alice ha già pagato 10 ETH a B, quindi le restano solo 10 ETH, meno dei 20 ETH necessari per 2 token a 10 ETH l'uno. La transazione non è valida e ogni nodo la respinge. In un contratto vero questo controllo è scritto nel codice (`require(msg.value == ...)`), e un controllo che fallisce **annulla** l'intera chiamata: non resta nessuno dei suoi effetti, anche se il gas speso viene comunque pagato (slide 26).

### Slide 21 · Simple Notary Smart Contract

```
Contract Notary {
    \\ Variables containing parameters for notarization
    string document;
    boolean notarized;
    …
    \\ deployment info, taking as inputs notarization parameters
    void deploy( … ) {
    notarized=false; … }
    \\Function to be triggered by the user
    void notarize ( string D, … ) {
        if (checkValidity(document,…)) {
        document = D;
        notarized = true }}
    \\ Checks that wether contract can be notarized, i.e. document is well written, involved parties signed the document, etc.
    boolean checkValidity(string s, …) { if (…) return true }
}
```

**Analisi del codice.** Pseudo-codice del notaio decentralizzato che risolve il problema della slide 2 (i commenti sono scritti con `\\` invece di `//`).

- *Che cosa fa.* Lo stato è il `document` notarizzato e un flag `notarized`. `deploy` crea il contratto con i parametri della notarizzazione (chi sono le parti, ...) e `notarized = false`. `notarize(D, …)`, chiamata da un utente, salva `D` e imposta `notarized = true` se `checkValidity` ha successo; `checkValidity` sta per i controlli che fa un notaio (il documento è ben formato, le parti l'hanno firmato, ...).
- *Problemi da individuare:*
  1. **Valida il documento sbagliato.** `notarize` chiama `checkValidity(document, …)`, il documento già salvato (all'inizio vuoto), non il nuovo argomento `D`, e poi salva `D`: ciò che viene controllato non è ciò che viene usato, quindi un `D` non valido viene notarizzato ogni volta che il controllo sul valore vecchio passa. Va sempre validato esattamente il dato che si userà (Lezione 5; la discrepanza fra controllo e uso è lo stesso schema dei bug TOCTOU della Lezione 11).
  2. **Nessuna protezione contro una nuova notarizzazione.** Chiunque può chiamare di nuovo `notarize` più tardi e **sovrascrivere** un documento notarizzato: non c'è un `require(!notarized)` e nessun controllo degli accessi su chi può chiamarla, il che rompe il requisito di un "archivio non manomettibile".
  3. `checkValidity` restituisce `true` quando la condizione vale ma non ha un percorso `return false`.
  4. **Tutto ciò che sta sulla catena è pubblico**: il testo completo di un contratto privato sarebbe visibile a tutti; i veri contratti di notarizzazione conservano solo un **hash** del documento (Lezione 17, slide 11).
- *In Solidity*, il nucleo di una `notarize` corretta:

```solidity
function notarize(string calldata D) external {
    require(!notarized, "already notarized");
    require(checkValidity(D), "invalid document");   // validate what you store
    document = D;
    notarized = true;
}
```

### Slide 22 · Contract deployment

> All the nodes will check the contract validity

![Lezione 16, pagina 22](L16_p22.webp "50% 1400x699")

**Figura.** **B** (un omino) manda "**(deploy,code,*N*, σ)**" all'icona del consenso, che pensa (nuvoletta) "**N is valid**".

**Approfondimento.** Il contratto notarile N viene pubblicato esattamente come il contratto del token (slide 16): B manda una transazione di pubblicazione, firmata da B, e i nodi la controllano.

### Slide 23 · Contract execution

> The block proposer will include the new contract

![Lezione 16, pagina 23](L16_p23.webp "50% 1400x694")

**Figura.** Il **Block proposer** manda un riquadro tratteggiato "TxA=…, TxB=…, …, (deploy,code,*N*, σ), (N,code)" all'icona del consenso; una freccia scende fino al nuovo blocco in testa alla catena ("…" ← "…" ← "TxA=…, TxB=…, …, (deploy,code,*N*, σ), **(N,code)**").

**Approfondimento.** Come nella slide 17: la pubblicazione viene inclusa in un blocco, e da quel momento il contratto N, il suo codice e il suo stato fanno parte della catena.

### Slide 24 · Contract execution

> All the nodes will run `notarize(D, …)` and agree on the new state of the contract N.

![Lezione 16, pagina 24](L16_p24.webp "50% 1400x675")

**Figura.** **A** (un omino) manda "**(N,notarize,D,…,σ)**" all'icona del consenso, che pensa: "`N.state = (document: D notarized: true)`".

**Approfondimento.** Alice chiede la notarizzazione del suo documento D chiamando `notarize(D, …)` sul contratto N. Tutti i nodi eseguono la funzione e concordano sul nuovo stato: documento D, notarizzato. I ruoli della slide 2 sono ora svolti da codice e consenso: il **notaio** è la logica di validazione del contratto, che nessuno può corrompere (ma che può avere bug, slide 21), e l'**archivio** è la blockchain, pubblica e non manomettibile finché regge l'ipotesi di maggioranza onesta.

### Slide 25 · Contract execution

![Lezione 16, pagina 25](L16_p25.webp "50% 1400x751")

**Figura.** Il **Block proposer** manda "TxA=…, TxB=…, …, (N,notarize,D,…,σ)" all'icona del consenso; la catena: "…" ← "… TxA=…, TxB=…, …, (N,code)" ← nuovo blocco "… TxA=…, TxB=…, …, **(N,notarize,D,…,σ)**". Sotto il nuovo blocco, in grassetto: "**N.*state* = { document: D, notarized: true }**".

**Approfondimento.** La notarizzazione viene registrata in un nuovo blocco insieme al nuovo stato di N; da quel momento chiunque può controllare, leggendo la catena, che il documento D è stato notarizzato e in quale blocco, cioè quando.

### Slide 26 · Contract execution: GAS

> In reality, triggering transaction has a cost (GAS) based on the number of instructions the nodes have to run

![Lezione 16, pagina 26](L16_p26.webp "50% 1400x691")

**Figura.** Come nella slide 25, con i saldi. Sotto il blocco con "(N,code)": "A.Balance: 3", "B.Balance: …". Sotto il nuovo blocco con "**(N,notarize,D,…,σ)**": "A.Balance: **2.9**" (2.9 in rosso), "B.Balance: …", "N.*state* = { document: D, notarized: true }".

**Approfondimento.** Ogni nodo esegue ogni chiamata, quindi il calcolo sulla catena è costoso, e si paga con il **gas**: ogni istruzione dell'EVM ha un costo fisso in gas (le scritture nello storage sono fra le più care), e chi chiama paga il gas usato per un prezzo del gas, in ether (qui il saldo di A scende da 3 a 2.9). Il gas ha anche un ruolo di sicurezza: poiché il linguaggio è Turing-completo, una chiamata potrebbe ciclare all'infinito, e il **limite di gas** fissato da chi chiama garantisce che ogni esecuzione si fermi; se il gas finisce, la chiamata viene annullata ma il gas viene pagato lo stesso. Questo rende anche costosi gli attacchi di denial of service alla rete, e crea una classe di bug dei contratti a sé: un ciclo su un elenco che cresce con il numero degli utenti può finire per superare il limite di gas del blocco e diventare impossibile da eseguire.

## Proof of stake e conclusioni (pagine 27-28)

### Slide 27 · Alternative Consensus Mechanism - Proof of Stake

> Stake is an amount of crypto-commodities invested into the system
>
> - Locked via a special transaction, or sent to a specific address
> - Cannot be spent
>
> Rationale
>
> - The more is left at stake by users, the less likely they would want to subvert the blockchain
> - Validators place their "bet" on the chain(s) they deem true
> - If the block is appended, validators get a reward proportional to the bet
>
> No block mining (puzzle solving) reward
>
> - But also nothing to lose! (No expenses due to hardware and energy consumption)
>
> Block proposers' election probability depends on their stake value

**Approfondimento.** La **proof-of-stake** sostituisce la potenza di calcolo con **denaro bloccato**. I validatori bloccano uno **stake** (in Ethereum 32 ETH per validatore) che non possono spendere finché resta bloccato; i proponenti dei blocchi vengono scelti a caso con probabilità proporzionale al loro stake, e gli altri attestano (votano) i blocchi che considerano validi, guadagnando ricompense. La logica: chi ha molto in gioco ha più da perdere se la blockchain viene sovvertita. Rispetto alla proof-of-work non c'è un rompicapo energivoro (il passaggio di Ethereum alla proof-of-stake, "the Merge" del settembre 2022, ne ha ridotto il consumo di energia di oltre il 99%), ma il "nothing to lose" della slide è la debolezza classica, il **nothing-at-stake problem**: votare non costa nulla, quindi un validatore potrebbe votare per più catene concorrenti insieme. I protocolli moderni lo contrastano con lo **slashing**: un validatore sorpreso a firmare blocchi in conflitto perde parte del suo stake. L'ipotesi di sicurezza cambia di conseguenza, da una maggioranza onesta della potenza di calcolo a una maggioranza onesta (o due terzi) dello stake (slide 10).

### Slide 28 · Takeaways

> - Smart contracts are written by developers:
>   - It can be prone to most of the known software vulnerability!
>   - Software security is even more critical when dealing with currencies
>   - New attacks related to the new contexts can come out
>   - In practice, a smart contract is nothing more than a piece of code running on top of a Virtual Machine.
>     - With the knowledge of the underlying architecture (e.g., Ethereum Blockchain) and the (E)VM environment, symbolic analysis and fuzz testers can be implemented as well by adapting the standard techniques to this new environment.
> - Software vulnerabilities led to destructive attacks:
>   - DAO Attack: $150 million worth of ethers stolen due to a smart contract bug
>     - By carefully exploiting smart contract callbacks, the attacker could change smart contract ownership to any account of his choice.
>     - https://www.coindesk.com/consensus-magazine/2023/05/09/coindesk-turns-10-how-the-dao-hack-changed-ethereum-and-crypto/

**Approfondimento.** Il legame con il resto del corso. Gli smart contract sono **programmi ordinari scritti da sviluppatori ordinari**, quindi soffrono delle solite classi di vulnerabilità: integer overflow (slide 15; Lezione 8), validazione dell'input e controllo degli accessi mancanti (slide 21; Lezioni 5 e 10), intrecci simili a race (Lezione 11). Tre caratteristiche li rendono più critici: il codice **maneggia direttamente denaro**, è **pubblico**, quindi gli attaccanti possono studiarlo con calma, ed è **immutabile**, quindi un bug non si può semplicemente correggere. Il contesto crea anche **nuove classi di attacco**, la più nota delle quali è la **re-entrancy** (Lezione 17). Le difese sono quelle delle Lezioni 6 e 7, adattate all'EVM: analizzatori statici e strumenti di esecuzione simbolica per Solidity e per il bytecode EVM (per esempio Slither e Mythril), fuzzer per contratti (Echidna) e verifica formale dei contratti di alto valore. L'**attacco a The DAO** (giugno 2016) è il racconto ammonitore: The DAO, un fondo d'investimento decentralizzato, aveva raccolto circa 150 milioni di dollari in ether, e un attaccante ne prosciugò circa un terzo (3,6 milioni di ether) sfruttando le sue callback per rientrare nella funzione di prelievo ("split") prima che il saldo venisse aggiornato; la storia completa è l'argomento della Lezione 17.
