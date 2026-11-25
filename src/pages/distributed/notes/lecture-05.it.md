## L'astrazione di mutua esclusione

### Che cos'è la mutua esclusione in un sistema distribuito?

La mutua esclusione è un'astrazione distribuita fondamentale, che coordina l'accesso a una risorsa critica non condivisibile (storicamente detta **sezione critica**, $\mathrm{CS}$) fra un insieme di processi $\Pi = \{p_1, p_2, \dots, p_n\}$. L'astrazione garantisce che al più un processo acceda alla risorsa in ogni istante, evitando la starvation e rispettando l'ordine causale delle richieste.

### Quali eventi definiscono l'interfaccia dell'astrazione di mutua esclusione?

L'astrazione di mutua esclusione è uno strato software intermedio fra l'applicazione (strato superiore) e i collegamenti di comunicazione (strato inferiore). Espone tre eventi:

- `Request` **(evento di richiesta):** generato dallo strato superiore e passato al modulo di mutua esclusione per chiedere il permesso di accedere alla sezione critica.
- `Grant` **(evento di concessione):** generato dal modulo di mutua esclusione e passato allo strato superiore per segnalare che la sezione critica è ora assegnata in esclusiva al processo che l'ha richiesta.
- `Release` **(evento di rilascio):** generato dallo strato superiore e passato al modulo di mutua esclusione per indicare che il processo ha finito il suo lavoro nella sezione critica e che la risorsa può essere assegnata a un altro processo.

### Quali proprietà formali specificano l'astrazione di mutua esclusione?

L'astrazione di mutua esclusione è definita da tre proprietà:

- **Mutual exclusion (safety):** in ogni istante di tempo reale $t$, al più un processo $p_i \in \Pi$ è dentro la sezione critica $\mathrm{CS}$. Formalmente, se $p_i \in \mathrm{CS}$ al tempo $t$ e $p_j \in \mathrm{CS}$ al tempo $t$, allora $p_i = p_j$.
- **No starvation (liveness):** se un processo corretto $p_i \in \Pi$ richiede la sezione critica, allora $p_i$ prima o poi riceve la concessione.
- **Fairness (safety):** se la richiesta del processo $p_i$ precede causalmente la richiesta del processo $p_j$ nella relazione happened-before ($\mathit{request}_i \to \mathit{request}_j$), allora il processo $p_j$ non può ottenere la sezione critica prima del processo $p_i$.

### Quale modello di sistema assume l'algoritmo di mutua esclusione di Lamport?

Il classico algoritmo di mutua esclusione di Lamport funziona in un modello senza crash e con collegamenti punto-punto affidabili:

- **Processi senza crash ($f = 0$):** tutti i processi di $\Pi$ si assumono corretti. Se anche un solo processo va in crash, il protocollo di base si blocca per sempre.
- **Grafo di comunicazione completo:** ogni processo $p_i \in \Pi$ può comunicare direttamente con ogni altro processo $p_j \in \Pi$.
- **FIFO perfect point-to-point link:** i canali soddisfano le proprietà dei perfect point-to-point link (reliable delivery, no duplication, no creation) più l'**ordinamento FIFO** (se $p_i$ invia a $p_j$ il messaggio $m_1$ prima di $m_2$, allora $p_j$ consegna $m_1$ prima di $m_2$).

## L'algoritmo di mutua esclusione di Lamport

### Come coordina l'accesso l'algoritmo di mutua esclusione di Lamport?

L'algoritmo di Lamport è un protocollo di mutua esclusione basato su permessi e del tutto distribuito, senza coordinatore centrale. Per risolvere in modo equo le richieste in competizione, un processo attacca a ogni richiesta un timestamp del suo orologio logico scalare di Lamport. Ogni processo tiene un insieme locale di richieste pendenti, ordinate secondo i loro timestamp logici. Un processo entra nella sezione critica quando verifica che la propria richiesta è la più piccola del suo insieme locale e che ha ricevuto una conferma da ogni processo del sistema.

Ogni invio e ogni ricezione è un evento rilevante del calcolo: l'orologio viene incrementato per ciascuno.

### Come si stabilisce un ordine totale sui timestamp logici?

Un timestamp logico è una coppia $(c_i, i)$, dove $c_i \in \mathbb{N}$ è il valore dell'orologio scalare di Lamport del processo $p_i$, e $i \in \{1, \dots, n\}$ è l'identificatore unico del processo. L'ordine totale $<$ sui timestamp è quello lessicografico: $$(c_i, i) < (c_j, j) \iff (c_i < c_j) \lor (c_i = c_j \land i < j)$$ Così, anche quando due richieste hanno esattamente lo stesso valore di orologio ($c_i = c_j$), la parità è risolta in modo deterministico dagli identificatori unici dei processi ($i < j$).

### Qual è lo pseudo-codice dell'algoritmo di mutua esclusione di Lamport?

``` Algoritmo di mutua esclusione di Lamport sul processo p_i
Module: LamportMutualExclusion (LamportMutex)
Base Abstraction: FIFO-PerfectPointToPointLink (fifopl)

Initialization:
    requests := ∅
    acks := ∅
    clock := 0
    my_request := ⊥

Upon Event < mutex, Request > do:
    clock := clock + 1
    my_request := (clock, i)
    requests := requests ∪ { (REQUEST, my_request) }
    forall pj ∈ Π do:
        trigger < fifopl, Send | pj, (REQUEST, my_request) >

Upon Event < fifopl, Deliver | pj, (REQUEST, (c, j)) > do:
    clock := max(clock, c) + 1
    requests := requests ∪ { (REQUEST, (c, j)) }
    clock := clock + 1
    trigger < fifopl, Send | pj, (ACK, (clock, i)) >

Upon Event < fifopl, Deliver | pj, (ACK, (c, j)) > do:
    clock := max(clock, c) + 1
    acks := acks ∪ { (ACK, (c, j)) }

Upon Event < mutex, Release > do:
    requests := requests \ { (REQUEST, my_request) }
    my_request := ⊥
    clock := clock + 1
    forall pj ∈ Π do:
        trigger < fifopl, Send | pj, (RELEASE, (clock, i)) >

Upon Event < fifopl, Deliver | pj, (RELEASE, (c, j)) > do:
    clock := max(clock, c) + 1
    requests := requests \ { (REQUEST, (c_old, j)) }

Upon Condition (my_request ≠ ⊥) ∧ (∀ pj ∈ Π, ∃ (ACK, (c_j, j)) ∈ acks : (c_j, j) > my_request) ∧ (∄ (REQUEST, (c_k, k)) ∈ requests : (c_k, k) < my_request) do:
    trigger < mutex, Grant >
```

### Come si leggono, riga per riga, variabili, logica e ipotesi di atomicità di questo pseudo-codice?

- **Inizializzazione:**
  - `requests`: un insieme locale che contiene tutte le tuple di richiesta attive `(REQUEST, (c, j))` ricevute da qualunque processo di $\Pi$ (sé stesso compreso).
  - `acks`: un insieme locale che contiene tutte le tuple di conferma `(ACK, (c, j))` consegnate al processo.
  - `clock`: una variabile intera, l'orologio scalare di Lamport locale, inizializzata a $0$.
  - `my_request`: il timestamp $(c_i, i)$ della richiesta del processo attualmente attiva, inizializzato a $\bot$ (nessuna richiesta).
- **Upon Event** `< mutex, Request >`:
  - Scatta quando lo strato superiore locale chiede di accedere alla CS.
  - `clock := clock + 1`: incrementa l'orologio locale per dare il timestamp alla nuova richiesta.
  - `my_request := (clock, i)`: costruisce il timestamp unico della richiesta del processo $p_i$.
  - `requests := requests ∪ { (REQUEST, my_request) }`: aggiunge la propria richiesta all'insieme locale.
  - `trigger < fifopl, Send | pj, (REQUEST, my_request) >`: invia la richiesta sui FIFO link a tutti i processi $p_j \in \Pi$ ($p_i$ compreso).
- **Upon Event** `< fifopl, Deliver | pj, (REQUEST, (c, j)) >`:
  - Scatta quando viene consegnata una richiesta del processo $p_j$ con timestamp $(c, j)$.
  - `clock := max(clock, c) + 1`: aggiorna l'orologio di Lamport locale secondo la regola di ricezione degli orologi scalari.
  - `requests := requests ∪ { (REQUEST, (c, j)) }`: inserisce la richiesta in arrivo nell'insieme locale delle richieste.
  - `clock := clock + 1`: incrementa l'orologio locale prima di inviare la conferma.
  - `trigger < fifopl, Send | pj, (ACK, (clock, i)) >`: rimanda subito a $p_j$ un messaggio ACK con il timestamp dell'orologio aggiornato.
- **Upon Event** `< fifopl, Deliver | pj, (ACK, (c, j)) >`:
  - Scatta quando viene consegnata una conferma del processo $p_j$.
  - `clock := max(clock, c) + 1`: aggiorna l'orologio di Lamport locale.
  - `acks := acks ∪ { (ACK, (c, j)) }`: registra la conferma nell'insieme locale `acks`.
- **Upon Event** `< mutex, Release >`:
  - Scatta quando lo strato superiore ha finito il suo lavoro nella sezione critica e rilascia la risorsa.
  - `requests := requests \ { (REQUEST, my_request) }`: toglie la propria richiesta dall'insieme locale.
  - `my_request := ⊥`: azzera la richiesta locale.
  - `clock := clock + 1`: incrementa l'orologio locale per dare il timestamp al rilascio.
  - `trigger < fifopl, Send | pj, (RELEASE, (clock, i)) >`: invia un messaggio RELEASE a tutti i processi $p_j \in \Pi$.
- **Upon Event** `< fifopl, Deliver | pj, (RELEASE, (c, j)) >`:
  - Scatta quando viene consegnato un messaggio di rilascio di $p_j$.
  - `clock := max(clock, c) + 1`: aggiorna l'orologio di Lamport locale.
  - `requests := requests \ { (REQUEST, (c_old, j)) }`: toglie la richiesta del processo $p_j$ dall'insieme locale delle richieste.
- **Upon Condition** `... do`:
  - Una regola valutata in modo atomico ogni volta che lo stato locale cambia.
  - Condizione 1, `my_request ≠ ⊥`: il processo $p_i$ ha una richiesta in sospeso.
  - Condizione 2, `∀ pj ∈ Π, ∃ (ACK, (c_j, j)) ∈ acks : (c_j, j) > my_request`: il processo $p_i$ ha ricevuto da ogni processo $p_j \in \Pi$ un ACK il cui timestamp $(c_j, j)$ è maggiore di $\mathit{my\_request}$. Questo dimostra che $p_j$ sapeva della richiesta di $p_i$ quando ha generato la risposta: un ACK più vecchio della richiesta non conta, perché una nuova richiesta ha sempre un timestamp maggiore di quelli di tutti i vecchi ACK.
  - Condizione 3, `∄ (REQUEST, (c_k, k)) ∈ requests : (c_k, k) < my_request`: nessuna richiesta nell'insieme locale di $p_i$ ha un timestamp minore di $\mathit{my\_request}$.
  - Azione: genera `< mutex, Grant >`, concedendo l'accesso alla sezione critica.
- **Ipotesi di atomicità:** l'esecuzione di ogni handler è atomica. Gli handler non possono intrecciarsi né essere interrotti sul processo locale.

### Come si svolge l'algoritmo passo per passo in un caso concreto con tre processi?

Si consideri un sistema $\Pi = \{p_1, p_2, p_3\}$. Per leggibilità l'esempio tralascia i messaggi che un processo invia a sé stesso.

- **Fase di richiesta ($p_3$):**
  - Il processo $p_3$ (orologio iniziale $2$) riceve un evento di richiesta dal suo strato superiore.
  - $p_3$ incrementa il proprio orologio a $3$, pone $\mathit{my\_request}_3 = (3, 3)$, aggiunge `(REQUEST, (3, 3))` al suo insieme locale e invia `(REQUEST, (3, 3))` a tutti.
- **Fase di conferma ($p_1, p_2$):**
  - $p_1$ (orologio $1$) consegna `(REQUEST, (3, 3))`, porta l'orologio a $\max(1, 3) + 1 = 4$, inserisce `(REQUEST, (3, 3))` in $\mathit{requests}_1$, incrementa l'orologio a $5$ e invia `(ACK, (5, 1))` a $p_3$.
  - $p_2$ (orologio $0$) consegna `(REQUEST, (3, 3))`, porta l'orologio a $\max(0, 3) + 1 = 4$, inserisce `(REQUEST, (3, 3))` in $\mathit{requests}_2$, incrementa l'orologio a $5$ e invia `(ACK, (5, 2))` a $p_3$.
- **Richiesta concorrente ($p_1$):**
  - Il processo $p_1$ riceve poi un evento di richiesta, incrementa l'orologio a $6$, pone $\mathit{my\_request}_1 = (6, 1)$, aggiunge `(REQUEST, (6, 1))` a $\mathit{requests}_1$ e invia `(REQUEST, (6, 1))` a tutti.
  - $p_2$ la consegna, porta l'orologio a $\max(5, 6) + 1 = 7$ e poi a $8$, e risponde con `(ACK, (8, 2))`.
- **Concessione della CS ($p_3$):**
  - $p_3$ consegna `(ACK, (5, 1))` e `(ACK, (5, 2))`, portando l'orologio a $6$ e poi a $7$.
  - $p_3$ consegna poi `(REQUEST, (6, 1))`: il suo orologio diventa $\max(7, 6) + 1 = 8$ e poi $9$, e risponde con `(ACK, (9, 3))`. Il suo insieme locale contiene ora `(REQUEST, (3, 3))` e `(REQUEST, (6, 1))`.
  - Poiché $(3, 3) < (6, 1)$, la richiesta di $p_3$ è la più piccola in $\mathit{requests}_3$. Inoltre i timestamp degli ACK ricevuti, $(5, 1)$ e $(5, 2)$, sono maggiori di $(3, 3)$.
  - $p_3$ genera `< mutex, Grant >` ed entra nella sezione critica.
- **Fase di attesa ($p_1$):**
  - $p_1$ consegna gli ACK per la sua richiesta $(6, 1)$: `(ACK, (8, 2))` e `(ACK, (9, 3))`, entrambi con timestamp maggiore.
  - Tuttavia $\mathit{requests}_1$ contiene `(REQUEST, (3, 3))` insieme a `(REQUEST, (6, 1))`.
  - Poiché $(3, 3) < (6, 1)$, la condizione di concessione di $p_1$ è falsa: $p_1$ deve aspettare.
- **Fase di rilascio ($p_3$):**
  - $p_3$ finisce il suo lavoro nella CS e genera `< mutex, Release >`.
  - $p_3$ toglie `(REQUEST, (3, 3))` dal suo insieme locale, incrementa l'orologio a $10$ e invia `(RELEASE, (10, 3))` a tutti.
  - Quando consegna `(RELEASE, (10, 3))`, $p_1$ toglie `(REQUEST, (3, 3))` da $\mathit{requests}_1$.
  - Ora `(REQUEST, (6, 1))` è l'elemento più piccolo di $\mathit{requests}_1$: la condizione di concessione di $p_1$ diventa vera, e $p_1$ entra nella CS.

### Come si dimostra la correttezza dell'algoritmo di mutua esclusione di Lamport?

**Safety (mutua esclusione).** Al più un processo può trovarsi nella sezione critica in ogni istante.

Dimostrazione per assurdo. Si supponga che due processi distinti $p_i$ e $p_j$ siano nella sezione critica nello stesso momento, con richieste di timestamp $(c_i, i)$ e $(c_j, j)$. Senza perdita di generalità, sia $(c_i, i) < (c_j, j)$.

1. Per entrare nella sezione critica, $p_j$ deve aver consegnato un ACK di $p_i$ con timestamp maggiore di $(c_j, j)$. Il processo $p_i$ ha inviato questo ACK quando ha consegnato la richiesta di $p_j$.
2. Se $p_i$ avesse inviato questo ACK prima di fare la propria richiesta, in quel momento l'orologio di $p_i$ sarebbe già stato maggiore di $c_j$, e la sua richiesta successiva avrebbe un timestamp maggiore di $(c_j, j)$, contro $(c_i, i) < (c_j, j)$.
3. Quindi $p_i$ ha inviato l'ACK dopo aver fatto la propria richiesta, cioè dopo aver inviato a $p_j$ la richiesta $(c_i, i)$. Poiché i collegamenti sono FIFO, $p_j$ ha consegnato la richiesta di $p_i$ prima dell'ACK di $p_i$, e l'ha aggiunta a $\mathit{requests}_j$.
4. Una richiesta viene tolta da $\mathit{requests}_j$ solo quando viene consegnato il RELEASE di chi l'ha fatta, e $p_i$, che è ancora nella sezione critica, non l'ha inviato. Quindi $(c_i, i)$ è in $\mathit{requests}_j$ quando $p_j$ valuta la sua condizione di concessione.
5. Poiché $(c_i, i) < (c_j, j)$, la terza condizione, `∄ (REQUEST, (c_k, k)) ∈ requests : (c_k, k) < my_request`, è falsa: $p_j$ non può essere entrato nella sezione critica insieme a $p_i$. Assurdo. $\blacksquare$

**Liveness (assenza di starvation).**

- Ogni richiesta ha un timestamp finito $(c_i, i)$.
- Poiché tutti i processi sono corretti ($f = 0$), i messaggi prima o poi vengono consegnati dai perfect link.
- Ogni processo prima o poi risponde a un REQUEST con un ACK.
- Assumendo che ogni processo che entra nella CS prima o poi ne esca e generi un RELEASE, le richieste più vecchie vengono tolte una dopo l'altra da tutti gli insiemi locali.
- Poiché solo un numero finito di richieste può avere un timestamp minore di uno dato, ogni richiesta pendente prima o poi diventa la più piccola in tutti gli insiemi, e la sua condizione di concessione diventa vera.

**Fairness.** Le richieste sono soddisfatte nell'ordine in cui sono generate, dove l'ordine è la relazione happened-before.

Dimostrazione per assurdo. Si supponga che $p_i$ entri nella sezione critica prima di $p_j$ anche se la richiesta di $p_j$ è avvenuta prima della richiesta di $p_i$ ($\mathit{request}_j \to \mathit{request}_i$). Per la proprietà degli orologi scalari, il timestamp della richiesta di $p_j$ è minore di quello della richiesta di $p_i$. Il processo $p_i$ entra solo dopo aver ricevuto l'ACK di $p_j$ e, per la proprietà FIFO, consegna la richiesta di $p_j$ prima di quell'ACK. Quindi, quando $p_i$ valuta la sua condizione di concessione, la richiesta di $p_j$ è nel suo insieme e ha un timestamp minore: la richiesta di $p_i$ non è la più piccola, e $p_i$ non può entrare. Assurdo. $\blacksquare$

### Quanto costa l'algoritmo di Lamport?

Ogni esecuzione della sezione critica costa $3(N-1)$ messaggi, dove $N$ è il numero di processi: $N-1$ richieste, $N-1$ conferme e $N-1$ rilasci. Nel caso migliore (nessuno è nella sezione critica e un solo processo la chiede), il ritardo fra la richiesta e l'accesso è quello di 2 messaggi: la richiesta e la sua conferma.

## L'astrazione di failure detector

### Che cos'è un failure detector in un sistema distribuito?

Un failure detector è un'astrazione distribuita simile a un oracolo, che dà ai processi informazioni sullo stato (corretto o in crash) degli altri processi della rete. È un modulo software che si usa insieme alle astrazioni di processo e di collegamento, e il suo scopo è rilevare i processi andati in crash: i failure detector funzionano solo per i guasti di tipo crash.

I failure detector sono il ponte fra i sistemi sincroni e quelli asincroni. Maneggiare il tempo dentro un algoritmo è complicato, e rende le dimostrazioni di correttezza intricate e facili da sbagliare: un failure detector racchiude le ipotesi sui tempi di un sistema sincrono o parzialmente sincrono (ritardi, derive degli orologi) dietro una pulita interfaccia a eventi. Più forti sono le ipotesi sui tempi, più accurata è l'informazione che fornisce. Un failure detector è descritto da due tipi di proprietà:

- **Completeness:** in modo informale, la capacità di rilevare tutti i guasti.
- **Accuracy:** in modo informale, la capacità di non sbagliare nella rilevazione.

### Quali eventi e quali proprietà definiscono il perfect failure detector ($\mathcal{P}$)?

Il perfect failure detector (indicato con $\mathcal{P}$) modella un oracolo infallibile di rilevazione dei crash. Assume un sistema sincrono con guasti di tipo crash e perfect point-to-point link sincroni, cioè perfect link con consegna sincrona: un messaggio inviato al tempo $t$ è ricevuto al più tardi al tempo $t + \mathit{max\_delay}$. Usando il proprio orologio e i limiti del modello sincrono, un processo può dedurre se un altro processo è andato in crash.

- **Eventi:**
  - Indicazione `< P, Crash | p_j >`: generata dal modulo di failure detector del processo $p_i$ per avvisare lo strato superiore che il processo $p_j$ è andato in crash.
- **Proprietà:**
  - **Strong completeness:** prima o poi ogni processo che va in crash è rilevato in modo permanente da ogni processo corretto. $$\forall p_i, p_j \in \Pi : p_j \text{ crashes} \implies \diamond \text{ (eventually } p_i \text{ permanently detects } p_j \text{)}$$
  - **Strong accuracy:** se un processo è rilevato da un qualunque processo, allora è andato in crash (nessun falso positivo). $$\forall p_i, p_j \in \Pi : p_i \text{ detects } p_j \implies p_j \text{ has crashed}$$

## Algoritmi sincroni di rilevazione dei guasti

### Come si realizza un perfect failure detector con l'algoritmo Exclude on Timeout?

In un sistema sincrono con un ritardo di comunicazione limitato $\mathit{max\_delay}$, un perfect failure detector si può costruire con uno schema periodico di heartbeat detto Exclude on Timeout: a ogni periodo ciascun processo chiede a tutti gli altri se sono vivi, ed esclude quelli che non hanno risposto nel periodo precedente.

### Qual è lo pseudo-codice del failure detector Exclude on Timeout?

``` Exclude on Timeout: un perfect failure detector
Module: ExcludeOnTimeoutPerfectFailureDetector (P_timeout)
Base Abstraction: PerfectPointToPointLink (pl)

Initialization:
    alive := Π
    detected := ∅
    startTimer(Δ)

Upon Event < Timeout > do:
    forall pj ∈ Π \ alive do:
        if pj ∉ detected then:
            detected := detected ∪ { pj }
            trigger < P, Crash | pj >
    alive := ∅
    forall pj ∈ Π do:
        trigger < pl, Send | pj, HEARTBEAT_REQUEST >
    startTimer(Δ)

Upon Event < pl, Deliver | pj, HEARTBEAT_REQUEST > do:
    trigger < pl, Send | pj, HEARTBEAT_REPLY >

Upon Event < pl, Deliver | pj, HEARTBEAT_REPLY > do:
    alive := alive ∪ { pj }
```

### Come si legge riga per riga l'algoritmo Exclude on Timeout?

- **Inizializzazione:**
  - `alive := Π`: inizializza l'insieme `alive` assumendo che all'inizio tutti i processi siano in funzione.
  - `detected := ∅`: inizializza a vuoto l'insieme dei processi rilevati.
  - `startTimer(Δ)`: arma un timer periodico il cui periodo $\Delta$ è almeno il doppio del ritardo massimo ($\Delta \ge 2 \cdot \mathit{max\_delay}$), il tempo che serve a una richiesta e alla sua risposta.
- **Upon Event** `< Timeout >`:
  - `forall pj ∈ Π \ alive do`: scorre tutti i processi che non hanno risposto nel periodo precedente.
  - `detected := detected ∪ { pj }; trigger < P, Crash | pj >`: aggiunge il processo silenzioso $p_j$ a `detected` ed emette l'evento `Crash`, che è permanente.
  - `alive := ∅`: svuota l'insieme `alive` per il nuovo periodo.
  - `forall pj ∈ Π do: trigger < pl, Send | pj, HEARTBEAT_REQUEST >`: invia un `HEARTBEAT_REQUEST` a tutti i processi.
  - `startTimer(Δ)`: riarma il timer per un periodo $\Delta$.
- **Upon Event** `< pl, Deliver | pj, HEARTBEAT_REQUEST >`:
  - Quando riceve una richiesta di heartbeat da $p_j$, rimanda subito un `HEARTBEAT_REPLY`.
- **Upon Event** `< pl, Deliver | pj, HEARTBEAT_REPLY >`:
  - Quando riceve una risposta di heartbeat da $p_j$, aggiunge $p_j$ all'insieme locale `alive`.

### Perché l'algoritmo Exclude on Timeout è corretto?

- **Strong completeness:** se un processo $p_1$ va in crash al tempo $t$, un processo corretto $p_0$ gli invia una richiesta di heartbeat al più tardi al tempo $t + \Delta$, non riceve risposta, e lo rileva al più tardi al tempo $t + 2\Delta$. Poiché un processo in crash non risponde mai più, la rilevazione è permanente.
- **Strong accuracy:** per assurdo. Se $p$ viene rilevato mentre è vivo, allora o la richiesta di heartbeat non ha raggiunto $p$ prima del timeout, o la sua risposta non è tornata prima del timeout. Entrambi i casi contraddicono l'ipotesi che $\Delta$ copra il ritardo massimo di una richiesta e della sua risposta.

Si noti che la specifica dice solo "prima o poi": la latenza esatta della rilevazione (qui al più $2\Delta$) è una proprietà dell'algoritmo, non dell'astrazione.

### Se al tempo $t$ un processo non è nel mio insieme detected, posso concludere che al tempo $t$ è vivo?

No. Nessun algoritmo può dire che cosa sta succedendo nell'istante esatto $t$: un processo conosce il mondo solo attraverso i messaggi, che impiegano un certo ritardo $d$ ad arrivare, quindi conosce il mondo solo com'era al tempo $t - d$. Nessun failure detector può dire se un processo è vivo nell'istante corrente.

### Qual è la complessità in messaggi dell'algoritmo Exclude on Timeout?

In ogni periodo $\Delta$ ogni processo invia $n$ messaggi `HEARTBEAT_REQUEST` e riceve $n$ messaggi `HEARTBEAT_REPLY`. Con $n$ processi, il numero totale di messaggi per periodo è: $$\text{Requests} = n \times n = n^2, \quad \text{Replies} = n \times n = n^2 \implies \text{Total complexity} = 2n^2 \text{ messages per period}$$

### Come si dimezza la complessità in messaggi sfruttando il fatto che il silenzio è espressivo?

Come osserva Nicola Santoro, **"in synchronous networks, silences are expressive"** (nelle reti sincrone i silenzi sono espressivi). Poiché in un sistema sincrono i ritardi di trasmissione sono limitati, non c'è bisogno di interrogare i processi con richieste esplicite. Con orologi sincronizzati entro uno skew globale $\delta$, ogni processo può invece inviare di sua iniziativa un heartbeat "sono vivo" all'inizio di ogni round, in istanti noti a tutti: non ricevere entro il round l'heartbeat di un processo significa che quel processo è andato in crash.

### Qual è lo pseudo-codice del failure detector a round con heartbeat?

``` Perfect failure detector a round
Module: RoundBasedPerfectFailureDetector (P_round)
Base Abstraction: PerfectPointToPointLink (pl)

Initialization:
    detected := ∅
    round_alive := Π
    startTimer(T)

Upon Event < Timeout > do:
    forall pj ∈ Π \ round_alive do:
        if pj ∉ detected then:
            detected := detected ∪ { pj }
            trigger < P, Crash | pj >
    round_alive := ∅
    forall pj ∈ Π do:
        trigger < pl, Send | pj, I_AM_ALIVE >
    startTimer(T)

Upon Event < pl, Deliver | pj, I_AM_ALIVE > do:
    round_alive := round_alive ∪ { pj }
```

### Come si legge riga per riga l'algoritmo a round, e qual è la sua complessità?

- **Parametri:** la lunghezza $T$ di un round è scelta in modo che $T > 2 \cdot (\mathit{max\_delay} + \delta)$, dove $\delta$ è lo skew degli orologi sincronizzati.
- **Logica:**
  - I processi non inviano messaggi `HEARTBEAT_REQUEST`.
  - All'inizio di ogni round ogni processo invia senza condizioni un heartbeat `I_AM_ALIVE` a tutti i processi.
  - Alla fine del round, ogni processo $p_j$ da cui durante il round non è stato consegnato alcun messaggio `I_AM_ALIVE` viene aggiunto a `detected` e segnalato con `< P, Crash | pj >`.
- **Complessità in messaggi:** ogni processo invia $n$ messaggi per round. Il totale su $n$ processi è: $$\text{Total complexity} = n \times n = n^2 \text{ messages per round}$$ È esattamente la metà dei $2n^2$ messaggi dello schema a richiesta e risposta.
