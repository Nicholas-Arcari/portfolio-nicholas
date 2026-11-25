La Lezione 17 presenta la vulnerabilità più nota specifica degli smart contract, la **re-entrancy**: un contratto che invia ether a un altro contratto *prima* di aggiornare il proprio stato può essere richiamato dal destinatario, la cui funzione di fallback rientra nella funzione che invia mentre il vecchio stato è ancora al suo posto, e prosciuga il contratto. È il bug dietro l'attacco a The DAO del 2016 (Lezione 16, slide 28). La lezione segue un contratto Solidity vulnerabile (`DepositFunds`), il contratto dell'attaccante, l'attacco passo per passo, le due difese (aggiornare lo stato prima di qualunque chiamata esterna; un modificatore di protezione dalla re-entrancy) e le conseguenze pratiche, dall'hard fork di Ethereum agli attacchi di re-entrancy del 2020-2021. Le slide sono 11, basate sull'articolo di HackerNoon citato nel frontespizio.

## L'attacco (pagine 1-6)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Re-entrancy attack
>
> Based on https://hackernoon.com/hack-solidity-reentrancy-attack

### Slide 2 · Scenario

![Lezione 17, pagina 2](L17_p02.webp "50% 1400x971")

**Figura.** Due riquadri, **Contract A** a sinistra e **Contract B** a destra, uniti da due frecce blu curve. La freccia in basso, da A a B, ha l'etichetta "**Send Funds**"; quella in alto, da B di nuovo verso A, ha l'etichetta "**B calls back into A before it done updating balances**". Il Contract A elenca le funzioni `checkBalance()`, `sendFunds()`, `updateBalance()`; il Contract B contiene `fallback_function()`.

**Analisi del codice.** Lo pseudo-codice nei due riquadri:

```
Contract A {
    checkBalance()
    sendFunds()
    updateBalance()
}

Contract B {
    fallback_function()
}
```

- *Che cosa mostra.* La logica di prelievo di A in tre passi, in quest'ordine: **controllare** il saldo di chi chiama, **inviare** i fondi, **aggiornare** il saldo. B è il destinatario, un contratto con una **funzione di fallback**, la funzione che Solidity esegue in automatico quando un contratto riceve ether.
- *La vulnerabilità.* Inviare ether a un contratto **esegue il codice del destinatario**. Quando A esegue `sendFunds()`, il controllo passa alla funzione di fallback di B *prima* che A abbia eseguito `updateBalance()`; se la fallback richiama il prelievo di A, `checkBalance()` vede ancora il saldo vecchio e approva un secondo pagamento, e così via. Nel contratto A si **rientra** mentre si trova in uno stato incoerente, a metà di una delle sue stesse funzioni.
- *Correzione.* Cambiare l'ordine: controllare, **aggiornare**, poi inviare (slide 7-9).

### Slide 3 · Contract example

```solidity
contract DepositFunds {
  mapping(address => uint) public balances;
  function deposit() public payable {
      balances[msg.sender] += msg.value;
  }
  function withdraw() public {
      uint bal = balances[msg.sender];
      require(bal > 0);

      (bool sent, ) = msg.sender.call{value: bal}("");
      require(sent, "Failed to send Ether");

      balances[msg.sender] = 0;
  }
}
```

**Analisi del codice.** Il contratto vulnerabile, una semplice banca in cui gli utenti depositano e prelevano ether.

- *Che cosa fa.* `balances` associa a ogni indirizzo gli ether che ha depositato. `deposit()` è `payable`: gli ether inviati con la chiamata (`msg.value`, in wei) vengono accreditati a chi chiama (`msg.sender`). `withdraw()` legge il saldo di chi chiama, richiede che sia positivo, rimanda indietro l'intero importo con una `call` di basso livello (con dati vuoti, `("")`), richiede che il trasferimento sia riuscito e infine imposta il saldo a 0.
- *La vulnerabilità.* L'ordine è **controllo → interazione → effetto**: la chiamata esterna che invia gli ether avviene **prima** dell'aggiornamento dello stato `balances[msg.sender] = 0`. Se `msg.sender` è un contratto, ricevere gli ether esegue la sua funzione `receive`/`fallback`, e `call` le inoltra tutto il gas rimasto, abbastanza per chiamare di nuovo `withdraw()`. In quella chiamata annidata `balances[msg.sender]` contiene ancora il valore vecchio, quindi il controllo passa e lo stesso importo viene inviato di nuovo, e ancora, finché il contratto non è vuoto. Solo quando la ricorsione si ferma le chiamate annidate ritornano, e ciascuna imposta a 0 il saldo (ormai irrilevante). È un problema time-of-check-to-time-of-use dentro una sola transazione (Lezione 11): il saldo controllato non è il saldo al momento dell'uso.
- *Exploit.* Slide 4-6, con il contratto dell'attaccante della slide 5.
- *Correzione.* Seguire lo schema **checks-effects-interactions**, aggiornando lo stato prima della chiamata esterna:

```solidity
function withdraw() public {
    uint bal = balances[msg.sender];
    require(bal > 0);                                  // checks
    balances[msg.sender] = 0;                          // effects
    (bool sent, ) = msg.sender.call{value: bal}("");   // interactions
    require(sent, "Failed to send Ether");
}
```

  Ora una chiamata rientrante trova un saldo di 0 e fallisce su `require(bal > 0)`. Una protezione dalla re-entrancy (slide 7-9) aggiunge un secondo livello. Il codice vecchio a volte si affidava a `transfer()` e `send()`, che inoltrano solo 2300 unità di gas, troppo poche per rientrare; oggi non è più raccomandato, perché i costi del gas cambiano nel tempo (l'aggiornamento Istanbul del 2019 ha rotto i contratti che dipendevano da quella quantità fissa).

### Slide 4 · The Attack

> 1. Vulnerable Smart Contract has 10 ETH
> 2. Attacker stores 1 ETH using `deposit()`
> 3. An attacker calls the `withdraw()` function and points to a malicious contract as a recipient.
> 4. Now withdraw function will verify if it can be executed:
>    - Does the attacker have 1 eth on their balance?
>      - *Yes* - because of their deposit.
>    - Transfer 1 ETH to a malicious contract. (Note: attacker balance has **NOT** been updated yet)
>    - Fallback function on received eth calls withdraw function again
>
> - Now withdraw function will verify if it can be executed:
>   - Does the attacker have 1 ETH on their balance?
>     - Yes - because the balance has not been updated.
>   - Transfer 1 ETH to a malicious contract.
>   - and again until the attacker will drain all the funds stored on the contract

**Approfondimento.** L'attacco, passo per passo, con numeri concreti. `DepositFunds` custodisce 10 ETH depositati da utenti onesti. L'attaccante deposita 1 ETH dal suo contratto malevolo, quindi la vittima custodisce 11 ETH e il saldo registrato dell'attaccante è 1. L'attaccante poi chiama `withdraw()` da quel contratto:

1. `withdraw` controlla il saldo (1 ETH: sì) e manda 1 ETH al contratto dell'attaccante.
2. Ricevere gli ether esegue la funzione di fallback dell'attaccante, che chiama di nuovo `withdraw()`, mentre la prima chiamata sta ancora aspettando che `call` ritorni e il saldo vale ancora 1.
3. Il controllo passa di nuovo (il saldo non è mai stato aggiornato), viene inviato un altro ETH, la fallback rientra di nuovo, e così via.

La ricorsione si ferma solo quando alla vittima resta meno di 1 ETH, una condizione controllata dalla fallback stessa dell'attaccante (slide 5). Poi le chiamate annidate ritornano una per una e ciascuna imposta il saldo a 0. Risultato: l'attaccante ha preso 11 ETH (il suo 1 e i 10 degli altri utenti) con una sola transazione e un investimento di 1 ETH.

### Slide 5 · The Attack contract

```solidity
contract Attack {
  DepositFunds public depositFunds;
  constructor(address _depositFundsAddress) {
      depositFunds = DepositFunds(_depositFundsAddress);
  }
  // Fallback is called when DepositFunds sends Ether to this contract.
  fallback() external payable {
      if (address(depositFunds).balance >= 1 ether) {
            depositFunds.withdraw();
      }
   }
  function attack() external payable {
      require(msg.value >= 1 ether);
      depositFunds.deposit{value: 1 ether}();
      depositFunds.withdraw();
} }
```

**Analisi del codice.** Il contratto dell'attaccante.

- *Che cosa fa.* Il costruttore conserva un riferimento alla vittima, `DepositFunds`, a un certo indirizzo. `attack()` viene chiamata dall'attaccante con almeno 1 ether: **deposita 1 ether** nella vittima, così che lì il suo saldo sia 1, e chiama subito **`withdraw()`**. La funzione **`fallback()`**, `external payable`, viene eseguita in automatico ogni volta che la vittima manda ether a questo contratto (con dati di chiamata vuoti e senza una funzione `receive()`, viene chiamata la fallback payable); finché la vittima custodisce ancora almeno 1 ether, chiama di nuovo `withdraw()`.
- *Perché funziona.* Ogni pagamento della vittima attiva la fallback, che rientra in `withdraw()` prima che la vittima arrivi a `balances[msg.sender] = 0`, quindi ogni chiamata annidata supera il controllo `require(bal > 0)` con il saldo superato di 1 ether. La condizione `address(depositFunds).balance >= 1 ether` è ciò che rende pulito l'attacco: ferma la ricorsione quando la vittima è vuota, così nessuna `call` fallisce, nessun `require(sent)` annulla la transazione, e tutti i trasferimenti rubati restano validi quando le chiamate si srotolano. La profondità della ricorsione è limitata solo dal gas della transazione e dal limite di profondità delle chiamate dell'EVM (1024), più che sufficiente qui.
- *Correzione.* Niente da correggere nel codice dell'attaccante: il bug è nella vittima (slide 3). Con la correzione checks-effects-interactions, la `withdraw()` rientrante viene annullata, la fallback fallisce, la `call` della vittima restituisce `false` e l'intero prelievo viene annullato, quindi l'attaccante non guadagna nulla.

### Slide 6 · The Attack contract

> - The attack function calls the withdraw function in the victim's contract.
> - When the token is received, the fallback function calls back the withdraw function.
> - Since the check is passed, the contract sends the token to the attacker, which triggers the fallback function, and so on and so forth.

**Approfondimento.** Il ciclo in tre righe, con "token" al posto degli ether inviati: `attack()` → `withdraw()` → arrivano gli ether → `fallback()` → `withdraw()` → arrivano gli ether → ... Ogni giro supera il controllo perché la vittima aggiorna il saldo solo dopo il ritorno della chiamata esterna. L'ingrediente essenziale è che **inviare denaro esegue il codice del destinatario**: in uno smart contract ogni chiamata esterna, compreso un pagamento, cede il controllo a codice scritto da qualcun altro, forse dall'attaccante, che può richiamare il contratto.

## Prevenzione (pagine 7-9)

### Slide 7-8 · How to prevent a re-entrancy attack

> - To prevent a reentrancy attack in a Solidity smart contract:
>   - Ensure all state changes happen before calling external contracts, i.e., update balances or code internally before calling external code
> - Use function modifiers that prevent reentrancy

```solidity
contract ReEntrancyGuard {
  bool internal locked;
  modifier noReentrant() {
       require(!locked, "No re-entrancy");
       locked = true;
       _;
       locked = false;
  }
   function withdraw() public noReentrancy {
   // withdraw logic goes here…
  }
}
```

La pagina 8 ripete i due punti senza il codice.

**Analisi del codice.** Le due difese.

- *Checks-effects-interactions.* Il primo punto è lo schema applicato a `withdraw` nell'analisi del codice della slide 3: prima i **controlli** (`require`), poi gli **effetti** sullo stato del contratto stesso (impostare il saldo a 0), e solo alla fine le **interazioni** con altri contratti (il trasferimento). Una chiamata rientrante vede allora lo stato aggiornato e non ottiene nulla.
- *La protezione dalla re-entrancy.* Un **modificatore** Solidity è codice avvolto attorno al corpo di una funzione: `_;` indica dove viene eseguito il corpo. `noReentrant` controlla che il contratto non sia `locked`, imposta `locked = true`, esegue il corpo e poi rimette `locked = false`. Se, mentre il corpo è in esecuzione, una chiamata esterna rientra in `withdraw()` (o in qualunque altra funzione con lo stesso modificatore), `require(!locked, ...)` fallisce e la chiamata rientrante viene annullata. Così com'è scritta la slide, il modificatore è dichiarato come `noReentrant` ma usato come `noReentrancy`: i due nomi devono coincidere, altrimenti il contratto non compila. L'implementazione standard è il `ReentrancyGuard` di OpenZeppelin, con il modificatore `nonReentrant`.
- *I limiti.* La protezione va applicata a **ogni** funzione che condivide lo stato: se `withdraw` è protetta ma una funzione `transfer` che sposta i saldi no, l'attaccante rientra attraverso `transfer` (re-entrancy fra funzioni diverse). Le due difese sono complementari, e l'ordine checks-effects-interactions è la più fondamentale.

### Slide 9 · Re-Entrancy Guard

```solidity
contract ReEntrancyGuard {
   bool internal locked;
   modifier noReentrant() {
       require(!locked, "No re-entrancy");
       locked = true;
       _;
       locked = false;
   }
   function withdraw() public noReentrancy {
   // withdraw logic goes here…
   }
}
```

> - The modifier wraps the code in a semaphore so that the function cannot be called if `locked` is `true`

**Analisi del codice.** Lo stesso codice della slide 7. Il flag `locked` funziona come un **semaforo** (un mutex, un lock binario): il corpo della funzione è una sezione critica, e un secondo ingresso mentre il primo è ancora in corso viene rifiutato. È la stessa idea dei lock usati contro le race condition nella Lezione 11 (slide 7-9), applicata alla "concorrenza" creata dalle callback dentro una sola transazione (slide 11). A differenza di un lock fra thread non aspetta mai: una chiamata rientrante viene semplicemente annullata.

## Conseguenze e conclusioni (pagine 10-11)

### Slide 10 · Practical consequences

> - DAO attack: $150 mln worth of dollars stolen
> - Ethereum hard-fork: after re-entrancy issues have been fixed, a new chain has been forked to restore the lost funds
>   - Ethereum classic is the «old» chain with the DAO attack.
> - Re-entrancy is still a problem:
>   - Uniswap/Lendf.Me hacks (April 2020) - $25 mln, attacked by a hacker using a reentrancy.
>   - The BurgerSwap hack (May 2021) - $7.2 mln, because of a fake token contract and a reentrancy exploit.
>   - The SURGEBNB hack (August 2021) - $4 mln, seems to be a reentrancy-based price manipulation attack.
>   - CREAM FINANCE hack (August 2021) - $18.8 mln, reentrancy vulnerability allowed the exploiter for the second borrow.
>   - Siren protocol hack (September 2021) - $3.5 mln, AMM pools were exploited through reentrancy attack…
>   - … and more.

**Approfondimento.** **The DAO** (2016) era un fondo d'investimento decentralizzato il cui contratto aveva raccolto ether per circa 150 milioni di dollari; nel giugno 2016 un attaccante usò la re-entrancy nella sua funzione di prelievo ("split") per prosciugarne circa un terzo, 3,6 milioni di ether. Poiché gli ether rubati erano temporaneamente bloccati dalle regole stesse di The DAO, la comunità di Ethereum ebbe il tempo di reagire, e scelse un **hard fork**: una modifica delle regole del protocollo che spostò i fondi rubati in un contratto di recupero da cui gli investitori potevano prelevarli. Il fork fu controverso, perché contraddice l'idea che la catena sia immutabile ("code is law"), e una parte della comunità continuò a far girare la catena originale, che esiste ancora come **Ethereum Classic**. L'elenco mostra che la re-entrancy non è sparita: diversi attacchi successivi (per esempio a Lendf.Me e CREAM Finance) rientravano attraverso **token i cui trasferimenti richiamano il destinatario**, quindi anche un "semplice" trasferimento di token può essere una chiamata esterna a codice dell'attaccante. Ogni trasferimento di valore verso un altro contratto va trattato come esecuzione di codice non fidato.

### Slide 11 · Takeaways

> - The nature of the re-entrancy attacks is not something new
>   - Callbacks and fallbacks allows for multi-threading inside smart contracts
>     - Race conditions can be exploited
> - Solidity is a language running on top of an EVM. Hence, testing and verification of both contracts and the EVM code are necessary to avoid tampering of data and currency being stolen
> - What about confidentiality? Code and data are public!
>   - Novel techniques can allow the EVM running inside the nodes to produce zero-knowledge proofs coupled with encrypted data
>     - Bugs in the contract/EVM code can break confidentiality

**Approfondimento.** Tre punti finali:

- **La re-entrancy è una race condition.** L'EVM esegue una transazione alla volta, ma le callback intrecciano l'esecuzione di contratti diversi come farebbero dei thread, quindi ritornano i problemi della Lezione 11: uno stato condiviso (il saldo) viene controllato, poi il controllo passa a qualcun altro, poi lo stato viene usato, e nel mezzo può essere cambiato o riusato. Anche le cure sono le stesse: rendere atomici controllo e aggiornamento, oppure tenere un lock.
- **Verificare entrambi i livelli.** I contratti vanno testati e verificati (l'analisi statica, l'esecuzione simbolica e il fuzzing delle Lezioni 6-7 adattati a Solidity, Lezione 16, slide 28), e così l'**EVM e il software dei client** che li eseguono: un bug nella macchina virtuale o nel compilatore colpirebbe ogni contratto.
- **Riservatezza.** Tutto ciò che sta su una blockchain pubblica è visibile: il codice, ogni transazione e tutto lo storage (il `private` di Solidity limita solo l'accesso da altri contratti, mentre chiunque può leggere lo storage grezzo). Tenere segreti i dati richiede la crittografia, come conservare solo degli hash, o le **prove zero-knowledge** citate nella slide (uno dei temi di ricerca del docente, Lezione 1, slide 2): i nodi possono verificare che un calcolo su dati cifrati o nascosti sia stato fatto correttamente senza vedere i dati. Anche questi sistemi sono codice, quindi un bug al loro interno può rompere la riservatezza che promettono.
