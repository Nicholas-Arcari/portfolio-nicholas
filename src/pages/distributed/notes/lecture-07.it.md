## Mutua esclusione tollerante ai guasti (adattare l'algoritmo di Lamport)

### Qual è il limite principale del classico algoritmo di mutua esclusione di Lamport?

Il classico algoritmo di mutua esclusione di Lamport assume un modello di sistema del tutto privo di crash ($\Pi = \text{Correct}$). Se anche un solo processo $p_i \in \Pi$ va in crash durante l'esecuzione, l'algoritmo si blocca e non avanza più. Per adattare la mutua esclusione a un'infrastruttura distribuita reale bisogna riformulare sia le proprietà dell'astrazione sia la logica interna del protocollo, in modo che tollerino i crash, usando un failure detector.

### Come cambiano le proprietà dell'astrazione di mutua esclusione quando si considerano i guasti?

In un modello di sistema con guasti crash-stop l'interfaccia dell'astrazione di mutua esclusione resta la stessa: eventi di richiesta (`Request`), eventi di indicazione (`Grant`) ed eventi di rilascio (`Release`). Le proprietà, invece, vanno ridefinite per tenere conto dei crash:

- **Safety (mutua esclusione con crash):** in ogni istante $t$, al più un processo **non in crash** è dentro la sezione critica ($\mathrm{CS}$). $$|\{p_i \in \Pi \setminus \text{Crashed}(t) \mid p_i \text{ is in } \mathrm{CS}\}| \le 1$$ Esempio dalla lavagna: si consideri un processo $p_1$ che entra nella sezione critica alle 13:00. Se $p_1$ va in crash alle 14:00 mentre è dentro la sezione critica, smette di eseguire e non può più fare alcuna operazione sulla risorsa critica (per esempio scrivere su un disco condiviso o mandare comandi a un dispositivo fisico). Poiché $p_1$ è morto, non genererà mai un `Release`. Per non bloccare il sistema per sempre, la specifica permette a un processo sopravvissuto $p_2$ di entrare nella sezione critica. Alle 14:01 due processi ($p_1$ e $p_2$) sono concettualmente dentro $\mathrm{CS}$, ma poiché $p_1$ è morto, esattamente un processo **non in crash** ($p_2$) è attivo in $\mathrm{CS}$. Se a sua volta $p_2$ va in crash, può entrare un processo $p_3$: tre processi sono allora concettualmente dentro $\mathrm{CS}$, ma l'invariante di al più un processo non in crash vale ancora.
- **Liveness (assenza di starvation con crash):** se un processo **corretto** $p_i$ chiede l'accesso alla sezione critica, allora $p_i$ prima o poi entra nella sezione critica. La restrizione ai processi **corretti** ($p_i \in \text{Correct}$) è necessaria: se un processo guasto $p_j$ genera un `Request` e va subito in crash, prima che il suo messaggio di richiesta lasci il buffer di uscita ($\mathit{OutBuf}_j$), nessun protocollo può far entrare $p_j$ in $\mathrm{CS}$.
- **Fairness (con crash):** se la richiesta di un processo **corretto** $p_i$ precede causalmente la richiesta di un processo $p_j$ ($\mathit{Request}_i \to \mathit{Request}_j$), allora $p_j$ non può accedere alla sezione critica prima di $p_i$.

### Quali sono i punti pericolosi del classico algoritmo di Lamport quando i processi vanno in crash?

Guardando gli handler dell'algoritmo classico, un crash è pericoloso in due punti: un processo in crash non può confermare, e un processo in crash non può rilasciare.

1. **Blocco durante la raccolta degli ACK:** quando il processo $p_i$ vuole entrare in $\mathrm{CS}$, invia un messaggio di richiesta $\text{REQUEST}(\mathit{ts}_i, i)$ a tutti i processi e deve raccogliere una conferma ($\text{ACK}$) da ogni processo $p_j \in \Pi$. Se un processo $p_k$ va in crash, non invierà mai il suo $\text{ACK}$: il processo $p_i$ aspetta per sempre l'$\text{ACK}$ di $p_k$, violando la liveness.
2. **Blocco permanente da parte di chi è andato in crash tenendo la CS:** quando $p_i$ fa una richiesta, tutti i processi inseriscono $(\mathit{ts}_i, i)$ nel loro `requestSet` locale. Senza guasti, quando $p_i$ esce da $\mathrm{CS}$ invia un $\text{RELEASE}$, e i destinatari tolgono la richiesta di $p_i$ dal loro `requestSet`. Se $p_i$ va in crash dentro $\mathrm{CS}$ (o mentre la sua richiesta è la più piccola negli insiemi), non invierà mai il $\text{RELEASE}$: la richiesta $(\mathit{ts}_i, i)$ resta per sempre la più piccola nel `requestSet` di ogni processo sopravvissuto, bloccando tutte le richieste successive.

### Come si corregge il classico algoritmo di Lamport con un perfect failure detector ($\mathcal{P}$)?

Usando un perfect failure detector ($\mathcal{P}$), che soddisfa la strong completeness (prima o poi ogni processo in crash è rilevato in modo permanente) e la strong accuracy (nessun processo è rilevato prima di andare in crash), si costruiscono tre correzioni (patch):

- **Patch 1 (aspettare meno ACK):** invece di aspettare gli ACK di tutti i processi di $\Pi$, un processo $p_i$ che fa una richiesta aspetta solo gli ACK dei processi che non sono stati rilevati come in crash ($\Pi \setminus \mathit{crashes}$).
- **Patch 2 (eliminare le richieste dei processi in crash):** quando riceve da $\mathcal{P}$ l'indicazione $\text{Crash}(p_k)$, il processo $p_i$ aggiunge $p_k$ al suo insieme locale `crashes` e toglie dal suo `requestSet` locale ogni richiesta fatta da $p_k$.
- **Patch 3 (scartare le richieste in ritardo):** le prime due correzioni non bastano. Per via dei ritardi dei messaggi, una richiesta $\text{REQUEST}(\mathit{ts}_k, k)$ di un processo in crash $p_k$ può arrivare a $p_i$ **dopo** che $\mathcal{P}$ ha già generato $\text{Crash}(p_k)$. Se $p_i$ inserisse questa richiesta in ritardo nel suo `requestSet`, ci resterebbe per sempre, perché non arriverà nessun altro evento $\text{Crash}(p_k)$ a eliminarla, e bloccherebbe per sempre le richieste di $p_i$. Perciò, quando riceve un qualunque messaggio $m$ da una sorgente $p_k$, $p_i$ controlla se $p_k \in \mathit{crashes}$: in tal caso scarta $m$ in silenzio.

``` Mutua esclusione di Lamport con le correzioni per i guasti
Module: FaultTolerantLamportMutex (instance ft_mutex)
Uses: FIFOPerfectPointToPointLinks (instance pl), PerfectFailureDetector (instance p)

Upon event < ft_mutex, Init > do:
    requestSet := ∅;
    ackSet := ∅;
    crashes := ∅;
    scalar_clock := 0;
    my_request := ⊥;

Upon event < ft_mutex, Request > do:
    scalar_clock := scalar_clock + 1;
    my_request := (scalar_clock, self);
    requestSet := requestSet ∪ {my_request};
    ackSet := ∅;
    for all p_j ∈ Π do:
        trigger < pl, Send | p_j, [REQUEST, my_request] >;

Upon event < p, Crash | p_k > do:
    crashes := crashes ∪ {p_k};
    requestSet := { (ts, p_j) ∈ requestSet | p_j ≠ p_k };

Upon event < pl, Deliver | p_k, [REQUEST, (ts_k, p_k)] > do:
    if p_k ∉ crashes then:
        scalar_clock := max(scalar_clock, ts_k) + 1;
        requestSet := requestSet ∪ {(ts_k, p_k)};
        scalar_clock := scalar_clock + 1;
        trigger < pl, Send | p_k, [ACK, scalar_clock] >;

Upon event < pl, Deliver | p_k, [ACK, ts_ack] > do:
    if p_k ∉ crashes then:
        scalar_clock := max(scalar_clock, ts_ack) + 1;
        ackSet := ackSet ∪ {p_k};

Upon event < pl, Deliver | p_k, [RELEASE] > do:
    if p_k ∉ crashes then:
        requestSet := { (ts, p_j) ∈ requestSet | p_j ≠ p_k };

Upon event (my_request ≠ ⊥) ∧ (∀ (ts_r, p_r) ∈ requestSet : my_request ≤ (ts_r, p_r)) ∧ ( (Π \ crashes) ⊆ ackSet ) do:
    my_request := ⊥;
    trigger < ft_mutex, Grant >;

Upon event < ft_mutex, Release > do:
    requestSet := { (ts, p_j) ∈ requestSet | p_j ≠ self };
    scalar_clock := scalar_clock + 1;
    for all p_j ∈ Π do:
        trigger < pl, Send | p_j, [RELEASE] >;
```

**Spiegazione riga per riga dello pseudo-codice:**

1. **Init:** inizializza le strutture dati interne: `requestSet` contiene le richieste attive, `ackSet` registra gli identificatori dei processi da cui è arrivato un ACK, `crashes` registra i processi rilevati come guasti da $\mathcal{P}$, `scalar_clock` è l'orologio logico di Lamport e `my_request` è la richiesta in sospeso del processo.
2. **Handler di richiesta:** incrementa `scalar_clock`, costruisce la tupla di richiesta `(scalar_clock, self)`, la memorizza in locale, svuota `ackSet` e invia `REQUEST` a tutti i processi sui collegamenti. Come nell'algoritmo classico, i collegamenti devono essere FIFO e perfetti.
3. **Handler del crash:** scatta per opera di $\mathcal{P}$ quando il processo $p_k$ va in crash. $p_k$ viene aggiunto a `crashes`, e ogni richiesta pendente $(\mathit{ts}, p_k)$ in `requestSet` viene eliminata (patch 2).
4. **Consegna di REQUEST:** controlla che il mittente $p_k \notin \mathit{crashes}$. In tal caso aggiorna l'orologio logico, memorizza la richiesta in `requestSet`, incrementa l'orologio e rimanda un ACK a $p_k$. Le richieste in ritardo di processi già rilevati come in crash vengono ignorate (patch 3).
5. **Consegna di ACK:** controlla che il mittente $p_k \notin \mathit{crashes}$, aggiorna l'orologio logico e registra $p_k$ in `ackSet`.
6. **Consegna di RELEASE:** controlla che il mittente $p_k \notin \mathit{crashes}$ e toglie la richiesta di $p_k$ da `requestSet`.
7. **Regola di concessione (evento con guardia):** valutata quando `my_request` non è nullo. Il processo entra in $\mathrm{CS}$ (`Grant`) se e solo se valgono due condizioni: (a) `my_request` è l'elemento più piccolo di `requestSet` nell'ordine totale lessicografico $(\mathit{ts}_i, i) < (\mathit{ts}_j, j) \iff (\mathit{ts}_i < \mathit{ts}_j) \lor (\mathit{ts}_i = \mathit{ts}_j \land i < j)$, e (b) sono stati ricevuti gli ACK di tutti i processi non rilevati come in crash ($(\Pi \setminus \mathit{crashes}) \subseteq \mathit{ackSet}$, patch 1).
8. **Handler di rilascio:** toglie la propria richiesta da `requestSet`, incrementa l'orologio logico e invia `RELEASE` a tutti i processi.

Con le tre correzioni l'algoritmo tollera i guasti: un processo corretto che richiede la sezione critica non aspetta mai per sempre un ACK, e la richiesta di un processo in crash prima o poi viene eliminata dall'intero sistema, così i processi morti non possono influenzare gli altri.

## Mutua esclusione tollerante ai guasti basata su un leader

### Si può costruire un algoritmo di mutua esclusione tollerante ai guasti più semplice, usando la leader election e un failure detector?

Sì. Invece di far mantenere a tutti i processi insiemi distribuiti di richieste e far scambiare $O(N)$ messaggi per richiesta, si può usare l'astrazione di leader election ($\mathrm{LE}$) insieme a un perfect failure detector ($\mathcal{P}$) per centralizzare il controllo dell'accesso. In questo modello il leader eletto fa da coordinatore e mette in sequenza le richieste.

### Come funziona l'algoritmo di mutua esclusione basato su un leader, con e senza guasti?

L'algoritmo funziona così nei tre scenari principali:

1. **Funzionamento normale (senza guasti):**
  - Tutti i processi usano la leader election $\mathrm{LE}$, che designa un unico leader $L \in \Pi$.
  - Quando un processo $p_i$ vuole entrare in $\mathrm{CS}$, invia a $L$ un messaggio di richiesta $\text{REQUEST}$.
  - Il leader $L$ tiene una coda FIFO locale di richieste pendenti. Se $\mathrm{CS}$ è libera, $L$ invia subito $\text{GRANT}$ a $p_i$. Se $\mathrm{CS}$ è occupata, $L$ mette in coda la richiesta di $p_i$.
  - Quando esce da $\mathrm{CS}$, $p_i$ invia $\text{RELEASE}$ a $L$. $L$ concede allora l'accesso al processo successivo della sua coda.
2. **Scenario 1, va in crash un client (non leader):** se un client $p_c$ va in crash mentre tiene $\mathrm{CS}$ o mentre aspetta nella coda di $L$, $\mathcal{P}$ genera $\text{Crash}(p_c)$ sul leader $L$. Se $p_c$ non era in $\mathrm{CS}$, $L$ toglie dalla coda la sua richiesta pendente, se c'è. Se $p_c$ teneva $\mathrm{CS}$, $L$ si comporta come se $p_c$ l'avesse rilasciata, e concede subito $\mathrm{CS}$ al prossimo client in attesa.
3. **Scenario 2, va in crash il leader:** se il leader $L$ va in crash, $\mathrm{LE}$ prima o poi elegge un nuovo leader $L_{\mathit{new}}$. Il problema è che il vecchio leader era l'unico a sapere chi era in $\mathrm{CS}$: $L_{\mathit{new}}$ non può concedere subito $\mathrm{CS}$ a nuovi richiedenti, perché un client $p_k$ potrebbe aver ricevuto $\mathrm{CS}$ dal vecchio leader $L$ poco prima che $L$ morisse, ed essere ancora dentro $\mathrm{CS}$. Per evitare una violazione di safety (due processi in $\mathrm{CS}$ nello stesso momento), $L_{\mathit{new}}$ esegue una fase di interrogazione dello stato appena viene eletto:
  - $L_{\mathit{new}}$ invia un messaggio di interrogazione `INQUIRE_STATE` a tutti i processi in $\Pi \setminus \mathit{crashes}$, cioè a ogni processo non rilevato come guasto.
  - $L_{\mathit{new}}$ non concede $\mathrm{CS}$ finché non ha ricevuto le risposte di tutti i processi non in crash. Un processo che era in $\mathrm{CS}$ ed è andato in crash non è un problema; uno che è vivo risponderà.
  - Se un processo $p_k$ risponde che è dentro $\mathrm{CS}$, $L_{\mathit{new}}$ registra $p_k$ come attuale detentore di $\mathrm{CS}$ e aspetta il `Release` di $p_k$ (o il suo crash).
  - Quando viene eletto un nuovo leader, i processi gli rimandano le loro vecchie richieste non ancora soddisfatte. Finita la fase, $L_{\mathit{new}}$ riprende a servire le richieste in coda come prima.

### Qual è la complessità in messaggi dell'algoritmo basato su un leader rispetto a quello di Lamport?

Senza guasti la mutua esclusione basata su un leader richiede solo $3$ messaggi per ogni accesso alla sezione critica (1 $\text{REQUEST}$ dal client al leader, 1 $\text{GRANT}$ dal leader al client e 1 $\text{RELEASE}$ dal client al leader), cioè una complessità in messaggi $O(1)$. L'algoritmo di Lamport richiede invece $3(N-1)$ messaggi ($N-1$ richieste, $N-1$ ACK, $N-1$ rilasci), cioè $O(N)$. Con $F$ crash del leader ci sono al più $F$ nuove elezioni, ognuna seguita da una fase di interrogazione dello stato.

## Best-effort broadcast (BEB)

### Perché servono astrazioni di broadcast tolleranti ai guasti?

Finora l'attenzione è andata all'interazione fra due processi, come in un contesto client-server: i collegamenti punto-punto (`PL.Send`, `PL.Deliver`) collegano solo coppie di processi. Gli algoritmi di livello più alto (come il consenso, la group membership e le macchine a stati replicate) hanno bisogno di primitive per comunicare da un processo a molti. Un'implementazione ingenua del broadcast, come semplice ciclo su collegamenti punto-punto, non si comporta bene quando i processi vanno in crash.

Per tutte le astrazioni di broadcast valgono due convenzioni: un messaggio in broadcast è implicitamente indirizzato a tutti i processi, e i messaggi sono unici, cioè nessun processo invia mai due volte in broadcast lo stesso messaggio e due processi non inviano mai in broadcast lo stesso messaggio.

### Qual è il problema di un ciclo ingenuo quando il mittente va in crash?

Si consideri un processo $p_1$ che invia in broadcast ai processi $\{p_1, p_2, p_3, p_4, p_5, p_6\}$ con un ciclo:

``` Un broadcast ingenuo
for all p_j in Π do:
    PL.Send(p_j, message);
```

Se $p_1$ va in crash dopo aver inviato il messaggio a $p_2$ e $p_3$, ma prima di inviarlo a $p_4, p_5, p_6$, allora $p_2$ e $p_3$ ricevono e consegnano il messaggio, mentre $p_4$, $p_5$ e $p_6$ non lo ricevono mai. I processi corretti restano in uno stato incoerente: una parte del sistema vede il broadcast, e una parte no.

### Qual è la specifica del best-effort broadcast (BEB)?

Il best-effort broadcast è la primitiva di base per comunicare da uno a molti: la sua garanzia di consegna vale solo se il mittente resta corretto.

- **Eventi:**
  - Richiesta: `< beb, Broadcast | m >` - invia in broadcast un messaggio $m$ a tutti i processi.
  - Indicazione: `< beb, Deliver | p, m >` - consegna un messaggio $m$ inviato in broadcast dal processo $p$.
- **Proprietà:**
  - **BEB1 (validity):** se un processo **corretto** $p$ invia in broadcast un messaggio $m$, allora ogni processo **corretto** $q$ prima o poi consegna $m$.
  - **BEB2 (no duplication):** nessun messaggio è consegnato più di una volta.
  - **BEB3 (no creation):** se un processo consegna un messaggio $m$ con mittente $p$, allora $m$ è stato inviato in broadcast in precedenza da $p$.

### Come si realizza il best-effort broadcast con i perfect point-to-point link?

L'algoritmo, detto Basic Broadcast, funziona in un sistema asincrono con perfect link e guasti di tipo crash (il modello fail-silent):

``` Basic Broadcast: best-effort broadcast sopra i perfect link
Module: BasicBroadcast (instance beb)
Uses: PerfectPointToPointLinks (instance pl)

Upon event < beb, Broadcast | m > do:
    for all p_j ∈ Π do:
        trigger < pl, Send | p_j, [DATA, self, m] >;

Upon event < pl, Deliver | p_j, [DATA, s, m] > do:
    trigger < beb, Deliver | s, m >;
```

**Spiegazione riga per riga dello pseudo-codice:**

1. **Module e Uses:** definiscono il modulo `BasicBroadcast` (istanza `beb`), che usa i `PerfectPointToPointLinks` sottostanti (`pl`).
2. **Handler di broadcast:** scatta quando lo strato superiore chiede di inviare $m$ in broadcast. Il processo scorre tutti i $p_j \in \Pi$ e invia la tupla `[DATA, self, m]` con `PL.Send`. Si noti che un processo invia il messaggio anche a sé stesso (`self`), così tutti i processi si comportano allo stesso modo.
3. **Handler di consegna:** scatta quando `pl` consegna `[DATA, s, m]` da $p_j$. Il modulo estrae il mittente originale $s$ e il messaggio $m$, e genera `< beb, Deliver | s, m >` verso lo strato superiore.

**Dimostrazione di correttezza di Basic Broadcast:**

- **Validity:** se il mittente $p$ è corretto, completa il ciclo su tutti i $p_j \in \Pi$. Per la proprietà di reliable delivery di `pl`, ogni processo corretto $q$ prima o poi riceve `[DATA, p, m]` e genera `BEB.Deliver`.
- **No duplication:** segue direttamente dalla proprietà di no duplication di `pl`.
- **No creation:** segue direttamente dalla proprietà di no creation di `pl`.
- **Limite in presenza di guasti:** BEB garantisce la consegna di un messaggio solo finché il mittente non si guasta. Se il mittente $p$ va in crash a metà del ciclo, i processi possono non essere d'accordo sul consegnare o no il messaggio.

Questo è un male perché i processi non hanno una vista comune dei messaggi inviati dai processi guasti. In una chat distribuita, per esempio, un messaggio di un client che va in crash potrebbe arrivare solo a una parte dei processi. Si vorrebbe un accordo sull'insieme dei messaggi consegnati, almeno fra i processi corretti: tutti i corretti o nessuno.

## Reliable broadcast regolare (RB)

### Come si ottiene una consegna "tutti o nessuno" fra i processi corretti?

Il best-effort broadcast ammette un'esecuzione in cui alcuni processi corretti consegnano un messaggio mentre altri processi corretti no (quando il mittente va in crash a metà del broadcast). Per eliminare questa incoerenza si definisce il **reliable broadcast (RB)**, che garantisce una consegna "tutti o nessuno": o **tutti** i processi corretti consegnano il messaggio, o **nessun** processo corretto lo consegna.

### Qual è la specifica del reliable broadcast regolare (RB)?

Il reliable broadcast ha gli stessi eventi di BEB (`< rb, Broadcast | m >` e `< rb, Deliver | p, m >`) e quattro proprietà:

- **RB1 (validity):** se un processo **corretto** $p$ invia in broadcast un messaggio $m$, allora $p$ prima o poi consegna $m$.
- **RB2 (no duplication):** nessun messaggio è consegnato più di una volta.
- **RB3 (no creation):** se un processo consegna un messaggio $m$ con mittente $p$, allora $m$ è stato inviato in broadcast in precedenza da $p$.
- **RB4 (agreement, non uniforme):** se un messaggio $m$ è consegnato da **qualche** processo **corretto** $p$, allora $m$ prima o poi è consegnato da **ogni** processo **corretto** $q$.

RB2 e RB3 sono le stesse di BEB. RB1 parla solo del mittente, ma insieme a RB4 restituisce la validity di BEB: se un processo corretto invia $m$ in broadcast, consegna $m$, e allora ogni processo corretto consegna $m$. L'agreement è la proprietà nuova, ed è una proprietà di liveness.

### Come si realizza il Lazy Reliable Broadcast in un sistema fail-stop (con $\mathcal{P}$)?

L'algoritmo **Lazy Reliable Broadcast** funziona nel modello fail-stop, usando il best-effort broadcast (`beb`) e un perfect failure detector (`p`). Si chiama "lazy" (pigro) perché ritrasmette solo quando serve: un processo fa da ripetitore per un messaggio solo se rileva che il mittente originale è andato in crash.

``` Lazy Reliable Broadcast (fail-stop)
Module: LazyReliableBroadcast (instance rb)
Uses: BestEffortBroadcast (instance beb), PerfectFailureDetector (instance p)

Upon event < rb, Init > do:
    correct := Π;
    from[s] := ∅ for all s ∈ Π;

Upon event < rb, Broadcast | m > do:
    trigger < beb, Broadcast | [DATA, self, m] >;

Upon event < beb, Deliver | p_j, [DATA, s, m] > do:
    if m ∉ from[s] then:
        from[s] := from[s] ∪ {m};
        trigger < rb, Deliver | s, m >;
        if s ∉ correct then:
            trigger < beb, Broadcast | [DATA, s, m] >;

Upon event < p, Crash | p_k > do:
    correct := correct \ {p_k};
    for all m ∈ from[p_k] do:
        trigger < beb, Broadcast | [DATA, p_k, m] >;
```

**Spiegazione riga per riga dello pseudo-codice:**

1. **Init:** pone `correct` a tutti i processi $\Pi$ e inizializza l'array `from[s]`, che registra i messaggi consegnati con mittente originale $s$.
2. **Handler di broadcast:** avvolge il messaggio $m$ con la sua origine $s = \mathit{self}$ e genera `BEB.Broadcast`.
3. **Handler di consegna da BEB:** quando `beb` consegna `[DATA, s, m]` dal ripetitore $p_j$, controlla se $m \in \mathit{from}[s]$. Se $m$ è nuovo, aggiunge $m$ a $\mathit{from}[s]$, genera `< rb, Deliver | s, m >` e controlla se l'origine $s \notin \mathit{correct}$. Se $s$ è già stato rilevato come in crash, il processo che riceve fa da ripetitore e invia di nuovo `[DATA, s, m]` in broadcast con `beb`.
4. **Handler del crash:** quando $\mathcal{P}$ segnala $\text{Crash}(p_k)$, $p_k$ viene tolto da `correct`. Per ogni messaggio $m$ già consegnato da $p_k$ ($m \in \mathit{from}[p_k]$), il processo lo ripete con `BEB.Broadcast`, per essere sicuro che tutti gli altri processi ricevano $m$.

**Correttezza del Lazy Reliable Broadcast:**

- **Validity e no creation** sono garantite dalle proprietà di BEB; la **no duplication** dal test su `from[s]` nell'handler di consegna.
- **Agreement (per assurdo):** si supponga che un processo corretto $p$ consegni $m$ con origine $s$, mentre un altro processo corretto $q$ non consegna mai $m$.
  - Caso 1, $s$ non va in crash: $s$ è corretto. Per la validity di BEB, il broadcast iniziale di $s$ arriva al processo corretto $q$, quindi $q$ consegna $m$, assurdo.
  - Caso 2, $s$ va in crash e $p$ rileva il crash prima di consegnare $m$: quando $p$ consegna $m$ vale $s \notin \mathit{correct}$, quindi $p$ ripete $m$ nel suo handler di consegna. Poiché $p$ è corretto, per la validity di BEB il messaggio ripetuto arriva a $q$, che consegna $m$, assurdo.
  - Caso 3, $s$ va in crash e $p$ rileva il crash dopo aver consegnato $m$: per la strong completeness, $\mathcal{P}$ prima o poi segnala $\text{Crash}(s)$ su $p$. In quel momento $m \in \mathit{from}[s]$, quindi l'handler del crash di $p$ ripete $m$ con `BEB.Broadcast`. Per la validity di BEB il messaggio ripetuto arriva a $q$, che consegna $m$, assurdo. Quindi l'agreement vale.

**Che cosa garantisce il reliable broadcast e che cosa no.** Sia $\mathit{DELMSG}(p)$ l'insieme dei messaggi consegnati da $p$. Con il reliable broadcast due processi corretti qualunque $p$ e $p'$ hanno $\mathit{DELMSG}(p) = \mathit{DELMSG}(p')$. Non c'è invece alcuna relazione fra gli insiemi di due processi guasti, né fra l'insieme di un processo corretto e quello di uno guasto. E non c'è alcuna garanzia sull'ordine in cui i messaggi vengono consegnati.

**Complessità del Lazy Reliable Broadcast.** Il tempo si misura in ritardi di messaggio (passi di comunicazione): si fa finta che ogni messaggio impieghi un'unità di tempo per essere consegnato. Questa ipotesi serve solo a valutare le prestazioni, mai la correttezza.

- **Complessità in messaggi:**
  - **Caso migliore (nessun crash):** $O(N)$ messaggi. L'origine $s$ esegue 1 BEB ($N$ messaggi punto-punto) e nessuno ripete.
  - **Caso peggiore (l'origine va in crash):** $O(N^2)$ messaggi. L'origine $s$ va in crash: fino a $N-1$ processi corretti rilevano il crash e ciascuno ripete con un BEB ($N \times N = N^2$ messaggi).
- **Latenza (ritardi di messaggio):**
  - **Caso migliore:** 1 ritardo di messaggio.
  - **Caso peggiore:** $O(N)$ ritardi di messaggio. Succede con una catena di crash: $s = p_1$ invia $m$ solo a $p_2$ e va in crash; $p_2$ consegna $m$, invia $m$ solo a $p_3$ e va in crash; $p_3$ consegna $m$, invia $m$ solo a $p_4$ e va in crash, e così via, creando una catena di $N-1$ passaggi.

### Come si realizza l'Eager Reliable Broadcast in un sistema fail-silent (senza $\mathcal{P}$)?

In un sistema asincrono senza failure detector i crash non si possono rilevare, quindi le ripetizioni non si possono far scattare in modo pigro. Si usa invece l'**Eager Reliable Broadcast**, in cui ogni processo ripete un messaggio senza condizioni la prima volta che lo consegna.

``` Eager Reliable Broadcast (fail-silent)
Module: EagerReliableBroadcast (instance erb)
Uses: BestEffortBroadcast (instance beb)

Upon event < erb, Init > do:
    delivered := ∅;

Upon event < erb, Broadcast | m > do:
    trigger < beb, Broadcast | [DATA, self, m] >;

Upon event < beb, Deliver | p_j, [DATA, s, m] > do:
    if m ∉ delivered then:
        delivered := delivered ∪ {m};
        trigger < erb, Deliver | s, m >;
        trigger < beb, Broadcast | [DATA, s, m] >;
```

**Spiegazione riga per riga dello pseudo-codice:**

1. **Init:** inizializza l'insieme `delivered`.
2. **Handler di broadcast:** genera `BEB.Broadcast` per `[DATA, self, m]`.
3. **Handler di consegna da BEB:** quando riceve `[DATA, s, m]`, se $m \notin \mathit{delivered}$ aggiunge $m$ a `delivered`, consegna $m$ allo strato superiore e genera **subito** il `BEB.Broadcast` di `[DATA, s, m]`.

**Compromesso:** l'Eager Reliable Broadcast funziona in un sistema puramente asincrono e fail-silent, senza bisogno di $\mathcal{P}$. Però la sua complessità in messaggi è **sempre** $O(N^2)$, anche nelle esecuzioni senza guasti, perché tutti gli $N$ processi ripetono ogni messaggio che ricevono. La latenza è la stessa dell'algoritmo lazy: 1 ritardo di messaggio nel caso migliore, $O(N)$ con una catena di guasti.

## Uniform reliable broadcast (URB)

### Che cosa succede se un processo guasto consegna un messaggio prima di andare in crash?

Con l'agreement non uniforme (RB4), un processo **guasto** $p_f$ può consegnare un messaggio $m$ (per esempio un aggiornamento di stato o una transazione bancaria) e compiere un'azione irreversibile, con un effetto sul mondo esterno, prima di andare in crash. Se nessun processo **corretto** consegna mai $m$, lo stato del sistema resta per sempre incoerente con l'azione compiuta da $p_f$.

### Qual è la specifica dell'uniform reliable broadcast (URB)?

L'uniform reliable broadcast sostituisce l'agreement non uniforme con l'**uniform agreement**:

- **URB1 (validity):** uguale a RB1.
- **URB2 (no duplication):** uguale a RB2.
- **URB3 (no creation):** uguale a RB3.
- **URB4 (uniform agreement):** se un messaggio $m$ è consegnato da **qualche** processo $p$ (corretto o guasto), allora $m$ prima o poi è consegnato da **ogni** processo **corretto** $q$.

In altre parole, l'insieme dei messaggi consegnati da un processo corretto è un sovrainsieme dell'insieme consegnato da uno guasto.

**Sulla parola "uniform":** nei sistemi distribuiti, aggiungere il prefisso "uniform" a una proprietà ne estende il requisito a **tutti** i processi (compresi quelli guasti, che vanno in crash più tardi), impedendo che un processo compia un'azione non condivisa dagli altri poco prima di guastarsi.

## Esercizi e problemi avanzati

### Perché fare la media degli orologi dei vicini è un modo sbagliato di sincronizzare gli orologi?

**Testo del problema:** si deve fare la revisione di un algoritmo di sincronizzazione degli orologi per grafi arbitrari, in cui ogni nodo $p_i$ chiede gli orologi software di tutti i suoi vicini $\text{Nbr}(i)$, ne calcola la media aritmetica $C_{\text{avg}} = \frac{1}{|\text{Nbr}(i)|} \sum_{j \in \text{Nbr}(i)} C_j$ e imposta il proprio orologio locale $C_i := C_{\text{avg}}$.

**Il difetto:** questo algoritmo viola la proprietà obbligatoria di **monotonia** ($t_1 < t_2 \implies C(t_1) < C(t_2)$): un orologio può sempre saltare nel futuro, mai nel passato. Si supponga che l'orologio locale del processo $p_1$ segni le 13:00 ($C_1 = 13{:}00$), e che i suoi cinque vicini abbiano orologi indietro, alle 10:00 ($C_j = 10{:}00$). La media calcolata è: $$C_{\text{avg}} = \frac{10 + 10 + 10 + 10 + 10}{5} = 10{:}00 \text{ AM}$$ Porre $C_1 := 10{:}00 \text{ AM}$ fa saltare l'orologio locale di $p_1$ indietro nel tempo di 3 ore. Allo stesso modo, un nodo il cui orologio segna 3 e i cui vicini segnano 2, 2, 1 e 3 verrebbe riportato da 3 a 2. Portare indietro il tempo locale rompe l'ordinamento dei messaggi, crea timestamp duplicati e invalida i token di sicurezza. Il modo corretto di riportare a posto un orologio veloce è quello visto nella Lezione 3: rallentarlo, nascondendo alcuni tick finché il tempo reale non lo raggiunge, senza mai impostarlo a un valore precedente.

### Come si realizzano i vector clock quando all'inizio non si conoscono la dimensione del sistema e gli identificatori dei processi?

**Testo del problema:** i vector clock standard hanno bisogno di un array fisso di dimensione $N$, indicizzato dagli identificatori dei processi $1 \dots N$. Se all'avvio $N$ e gli identificatori degli altri processi sono sconosciuti (gli identificatori sono unici), come si rappresentano e si aggiornano i vector clock?

**Soluzione:** si sostituisce l'array di dimensione fissa con una **mappa (dizionario)** dinamica ($\text{VC}: \text{ProcessID} \to \mathbb{N}$).

- **Inizializzazione:** ogni processo parte con una mappa vuota $\text{VC} = \emptyset$. Una voce mancante $\text{VC}[p_k]$ vale implicitamente $0$: non sapere che un processo esiste è lo stesso che non aver visto nessuno dei suoi eventi.
- **Evento locale:** si incrementa la propria voce: $\text{VC}[\text{self}] := \text{VC}[\text{self}] + 1$.
- **Invio di un messaggio:** si attacca la mappa locale $\text{VC}$ al messaggio in uscita.
- **Ricezione di un messaggio:** quando si riceve la mappa $\text{VC}_m$ da un mittente $p_j$:
  - Per ogni chiave $p_k \in \text{Keys}(\text{VC}_m)$: $$\text{VC}[p_k] := \max(\text{VC}[p_k], \text{VC}_m[p_k])$$ In particolare, la voce di un processo finora sconosciuto viene semplicemente copiata.
  - Si incrementa la propria voce: $\text{VC}[\text{self}] := \text{VC}[\text{self}] + 1$.

**Confronto fra due mappe:** due mappe $\text{VC}_A$ e $\text{VC}_B$ si confrontano su tutte le chiavi in $\text{Keys}(\text{VC}_A) \cup \text{Keys}(\text{VC}_B)$, trattando come $0$ le chiavi mancanti. Se esistono $k_1, k_2$ tali che $\text{VC}_A[k_1] > \text{VC}_B[k_1]$ e $\text{VC}_A[k_2] < \text{VC}_B[k_2]$, gli eventi sono concorrenti. La particolarità di due eventi concorrenti è che la componente non confrontabile può essere una che esiste in una mappa e manca nell'altra.

### Incrementare il vector clock dopo l'invio di un messaggio conserva la causalità?

**Testo del problema:** nei vector clock standard un processo incrementa la propria componente **prima** di dare il timestamp al messaggio e di inviarlo. Che cosa succede se un processo dà al messaggio il timestamp del suo vector clock **corrente**, invia il messaggio e incrementa la propria componente solo **dopo** l'invio? La regola di ricezione non cambia.

**Analisi data a lezione:** il caso che si può temere è quello di due processi che inviano in modo concorrente il loro primo messaggio. Con la nuova regola entrambi i messaggi portano lo stesso vettore, $[0, 0, 0, 0]$, mentre con la regola standard porterebbero due vettori diversi e non confrontabili. Non è un problema: nemmeno due vettori uguali sono ordinati, quindi i due eventi sono ancora visti come concorrenti. In generale l'unico effetto della nuova regola è che la sequenza di vector clock inviata da un processo è quella originale con la propria componente diminuita di uno, e ogni processo applica lo stesso scarto: la modifica non rompe il meccanismo.

**Un'avvertenza:** con questa regola il timestamp di un evento di invio non conta l'evento stesso, quindi gli altri processi vengono a sapere di un invio solo dal messaggio successivo dello stesso mittente. La caratterizzazione $V(e) < V(f) \iff e \to f$ è perciò quella dell'algoritmo standard, e per quello modificato non vale alla lettera: il primo invio di $p_1$ ha timestamp $[0, 0, 0, 0]$, che è minore del timestamp $[0, 1, 0, 0]$ del secondo invio di un processo $p_2$ che non ha mai avuto notizie di $p_1$, anche se i due eventi sono concorrenti.

### Si può costruire un failure detector su un canale che perde al più $K$ messaggi?

**Testo del problema:** si supponga che un canale punto-punto sia sincrono (ritardo limitato da $\Delta$) ma con perdite, con la garanzia che perde al più $K$ messaggi: se si inviano $K+1$ messaggi, almeno uno arriva. Si può costruire un perfect failure detector ($\mathcal{P}$)? E se il numero di messaggi persi è illimitato?

**Analisi:**

1. **Perdita limitata ($\le K$ messaggi): sì.** Per essere sicuro che un heartbeat arrivi entro un tempo limitato, un processo invia $K+1$ copie di ogni ping. Poiché al più $K$ possono andare perse, almeno una copia arriva. Se inviare un messaggio richiede un tempo $\epsilon$, la copia che arriva viene ricevuta entro $\Delta + (K+1)\epsilon$: è ancora un limite noto, quindi basta scegliere di conseguenza il timeout del failure detector. Con un timeout del genere nessun processo viene rilevato per errore (strong accuracy), e i crash veri vengono rilevati (strong completeness).
2. **Perdita illimitata: no.** Se il canale può perdere un numero arbitrario e illimitato di messaggi, ogni ritrasmissione costa un tempo $\epsilon$ e può andare persa di nuovo: qualunque sia il timeout, il canale può perdere abbastanza messaggi da superarlo. Il ritardo di una consegna riuscita diventa illimitato, il collegamento è di fatto asincrono, e in un sistema asincrono un perfect failure detector non si può costruire.

### Si può realizzare un FIFO link con "consegna immediata", senza l'insieme pending?

**Testo del problema:** un algoritmo ha la proprietà di consegna immediata (immediate delivery) se ogni messaggio consegnato dallo strato inferiore viene subito consegnato allo strato superiore. Il FIFO link visto finora non ce l'ha: il destinatario tiene i messaggi fuori ordine nell'insieme `pending`, dove un messaggio può aspettare per un tempo imprevedibile, finché non arrivano tutti i messaggi con numero di sequenza minore. Si può progettare, sopra un perfect link, un FIFO link con consegna immediata?

**Soluzione e compromesso: sì**, trasportando ogni volta l'**intera storia**. L'osservazione chiave è che quando il mittente invia il terzo messaggio conosce i primi due, perché ne è la sorgente.

1. **Mittente:** il processo $p_i$ tiene un registro `history` di tutti i messaggi inviati finora. Quando invia un nuovo messaggio $m$, $p_i$ aggiunge $m$ in coda a `history` e invia sul collegamento l'intera sequenza `history`.
2. **Destinatario:** quando riceve una sequenza $S = \langle m_1, m_2, \dots, m_k \rangle$, il destinatario scorre $S$ in ordine, consegna subito ogni messaggio $m_j \in S$ che non ha ancora consegnato e aggiorna il suo insieme locale dei messaggi consegnati.
3. **Compromesso:** nessun messaggio aspetta mai sul destinatario (consegna immediata). Il prezzo è un forte costo aggiuntivo di **banda e memoria**, perché la dimensione di ciò che si invia cresce senza limite nel tempo (ogni trasmissione porta tutti i messaggi inviati finora).
