## Ripasso: l'algoritmo di mutua esclusione di Lamport

### Che cos'è il problema della mutua esclusione in un sistema distribuito, e come si specifica la sua astrazione?

Il problema della mutua esclusione è la sfida fondamentale di coordinare l'accesso a una risorsa non condivisibile (storicamente detta **sezione critica**) fra un insieme di $n$ processi distribuiti, senza poggiare su una memoria condivisa o su lock hardware. Questa sezione ripercorre l'algoritmo della lezione precedente, con uno pseudo-codice più compatto, e ne completa la dimostrazione di safety.

L'astrazione di mutua esclusione è un modulo che espone tre eventi per interagire con lo strato superiore:

- **Request** (`request`): un evento di ingresso (richiesta) generato dallo strato superiore per chiedere il permesso di entrare nella sezione critica.
- **Grant** (`grant`): un evento di uscita (indicazione) generato dal modulo di mutua esclusione per avvisare lo strato superiore che ha l'accesso esclusivo alla sezione critica.
- **Release** (`release`): un evento di ingresso (richiesta) generato dallo strato superiore per avvisare il modulo che ha finito il suo lavoro nella sezione critica e che la risorsa può essere riassegnata.

### Quali proprietà formali definiscono l'astrazione di mutua esclusione?

Una primitiva distribuita di mutua esclusione deve soddisfare tre proprietà:

- **Mutual exclusion (safety):** in ogni istante di tempo reale $t$, al più un processo è dentro la sezione critica (CS). Formalmente, se $p_i$ e $p_j$ sono nella sezione critica al tempo $t$, allora $p_i = p_j$.
- **No starvation (liveness):** se un processo $p_i$ chiede l'accesso alla sezione critica, allora $p_i$ prima o poi riceve la concessione ed entra nella sezione critica (assumendo che ogni processo che entra nella sezione critica prima o poi la rilasci).
- **Fairness (safety):** se la richiesta del processo $p_i$ precede causalmente (happens before) la richiesta del processo $p_j$ ($\mathit{req}_i \to \mathit{req}_j$), allora il processo $p_j$ non può entrare nella sezione critica prima del processo $p_i$.

### Quale modello di sistema e quali ipotesi richiede l'algoritmo di mutua esclusione di Lamport?

Il protocollo di mutua esclusione di Lamport funziona sotto ipotesi strette:

- **Insieme statico di processi:** il sistema è fatto di un insieme fisso e noto di $n$ processi $\Pi = \{p_1, p_2, \dots, p_n\}$ con identificatori unici e totalmente ordinati ($1, 2, \dots, n$).
- **Grafo completo:** la comunicazione avviene su collegamenti punto-punto che formano un grafo completo, in cui ogni coppia di processi può comunicare.
- **FIFO perfect point-to-point link ($\mathcal{PPL}$):** i canali sono FIFO (First-In, First-Out) e perfetti (nessuna perdita, nessuna duplicazione, nessuna creazione di messaggi). L'ordinamento FIFO è necessario per la correttezza del protocollo e per la dimostrazione della fairness.
- **Nessun crash ($f = 0$):** l'algoritmo di base assume che nessun processo si guasti. Ogni processo è corretto e non va mai in crash. Se anche un solo processo si guasta, il protocollo di base si blocca per sempre.
- **Strato superiore ben educato:** un processo che è nella sezione critica prima o poi genera un rilascio.

### Come funziona, a livello di idea, l'algoritmo di mutua esclusione di Lamport?

L'algoritmo è basato su permessi ed è guidato dagli orologi logici. Invece di eleggere un coordinatore centrale o di far girare un token, ogni processo mantiene un orologio scalare di Lamport locale `clock`, un insieme locale `requests` di richieste pendenti e un insieme locale `acks` di conferme.

Quando un processo vuole entrare nella sezione critica:

- Incrementa il proprio orologio scalare, registra la propria richiesta nel suo insieme locale `requests` e invia a tutti i processi (sé stesso compreso) un messaggio `REQUEST` con timestamp $(\mathit{clock}, p_i)$.
- Ogni destinatario aggiunge la richiesta in arrivo al suo insieme locale `requests`, aggiorna il proprio orologio di Lamport locale e risponde subito con una conferma `ACK` dotata di timestamp.
- Un processo entra nella sezione critica se e solo se valgono insieme due condizioni:
  - La sua richiesta è la più piccola del suo insieme locale `requests` secondo l'ordine totale sui timestamp: $(c_i, p_i) < (c_j, p_j) \iff (c_i < c_j) \lor (c_i = c_j \land p_i < p_j)$.
  - Ha ricevuto da ogni processo del sistema un messaggio `ACK` con un timestamp maggiore di quello della propria richiesta.
- Quando esce dalla sezione critica, il processo toglie la propria richiesta dal suo insieme locale, incrementa l'orologio e invia a tutti un messaggio `RELEASE`. I destinatari tolgono la richiesta di quel processo dai loro insiemi locali `requests`, permettendo alla richiesta con il timestamp successivo di procedere.

### Qual è lo pseudo-codice dell'algoritmo di mutua esclusione di Lamport?

``` Algoritmo di mutua esclusione di Lamport (versione compatta)
Module:
  Name: LamportMutualExclusion (lme)

Events:
  Requests:
    lme, Request                       // Triggered by upper layer to request CS access
    lme, Release                       // Triggered by upper layer to exit CS
  Indications:
    lme, Grant                         // Delivered to upper layer granting CS access

Internal Events:
  ppl, Deliver | source, [REQUEST, ts]  // Incoming request message
  ppl, Deliver | source, [ACK, ts]      // Incoming acknowledgment message
  ppl, Deliver | source, [RELEASE, ts]  // Incoming release message

State Variables:
  requests := ∅                        // Set of pending requests (tuples: (timestamp, process_id))
  acks := ∅                            // Set of acknowledgments received (tuples: (source_id, timestamp))
  myreq := ⊥                           // Local active request tuple (ts, self_id) or ⊥
  clock := 0                           // Local scalar Lamport clock integer

Upon Event < lme, Init > do:
  requests := ∅
  acks := ∅
  myreq := ⊥
  clock := 0

Upon Event < lme, Request > do:
  clock := clock + 1
  myreq := (clock, self)
  requests := requests ∪ {myreq}
  acks := ∅
  forall p_j ∈ Π do:
    trigger < ppl, Send | p_j, [REQUEST, myreq] >

Upon Event < ppl, Deliver | p_j, [REQUEST, (ts_req, p_j)] > do:
  clock := max(clock, ts_req) + 1
  requests := requests ∪ {(ts_req, p_j)}
  clock := clock + 1
  trigger < ppl, Send | p_j, [ACK, (clock, self)] >

Upon Event < ppl, Deliver | p_j, [ACK, (ts_ack, p_j)] > do:
  clock := max(clock, ts_ack) + 1
  acks := acks ∪ {(p_j, ts_ack)}

Upon Event < ppl, Deliver | p_j, [RELEASE, (ts_rel, p_j)] > do:
  clock := max(clock, ts_rel) + 1
  requests := requests \ {(ts_req, p_j) ∈ requests | ts_req is matching}

Upon Event (myreq ≠ ⊥) ∧ (∀ (ts_q, p_q) ∈ requests : myreq ≤ (ts_q, p_q)) ∧ (∀ p_k ∈ Π : ∃ (p_k, ts_ack) ∈ acks : ts_ack > myreq.ts) do:
  myreq := ⊥
  trigger < lme, Grant >

Upon Event < lme, Release > do:
  clock := clock + 1
  ts_release := (clock, self)
  requests := requests \ {(ts_r, self) ∈ requests}
  forall p_j ∈ Π do:
    trigger < ppl, Send | p_j, [RELEASE, ts_release] >
```

### Come si leggono, riga per riga, variabili e handler?

- **Inizializzazione** (`lme, Init`): `requests` e `acks` sono inizializzati a insiemi vuoti, `myreq` è posto a nullo ($\bot$) e l'orologio scalare `clock` parte da $0$.
- **Handler di richiesta** (`lme, Request`): quando lo strato superiore chiede di accedere alla CS, `clock` viene incrementato di 1. Il processo costruisce la tupla `myreq = (clock, self)`, la registra in `requests`, svuota i vecchi `acks` e invia `[REQUEST, myreq]` a tutti i processi $p_j \in \Pi$ sui FIFO perfect link.
- **Ricezione di una richiesta** (`ppl, Deliver | REQUEST`): quando riceve `[REQUEST, (ts_req, p_j)]`, il destinatario aggiorna il proprio orologio scalare (`clock := max(clock, ts_req) + 1`), aggiunge `(ts_req, p_j)` al suo insieme locale `requests`, incrementa di nuovo `clock` e risponde a $p_j$ con `[ACK, (clock, self)]`.
- **Ricezione di una conferma** (`ppl, Deliver | ACK`): quando riceve `[ACK, (ts_ack, p_j)]`, il destinatario aggiorna l'orologio e memorizza `(p_j, ts_ack)` nel suo insieme locale `acks`.
- **Valutazione della condizione per entrare nella sezione critica:** il processo valuta una regola fatta di tre condizioni:
  - Ha una richiesta attiva in sospeso: `myreq ≠ ⊥`.
  - `myreq` è minore o uguale a ogni tupla in `requests`, secondo l'ordine totale $(c_i, p_i) < (c_j, p_j) \iff (c_i < c_j) \lor (c_i = c_j \land p_i < p_j)$.
  - Per ogni processo $p_k \in \Pi$ c'è una conferma $(p_k, \mathit{ts}_{\mathit{ack}}) \in \mathit{acks}$ tale che $\mathit{ts}_{\mathit{ack}} > \mathit{myreq}.\mathit{ts}$.
  - Quando valgono tutte e tre le condizioni, `myreq` torna a $\bot$ e `lme, Grant` viene dato allo strato superiore.
- **Handler di rilascio** (`lme, Release`): quando lo strato superiore finisce il suo lavoro nella CS, `clock` viene incrementato, la richiesta locale è tolta da `requests` e `[RELEASE, ts_release]` è inviato a tutti i processi. Ogni destinatario, alla consegna, toglie la richiesta del mittente dal suo insieme `requests`.

### Quale esecuzione illustra il protocollo e i suoi casi limite?

Si consideri un sistema con tre processi, $\Pi = \{p_1, p_2, p_3\}$. Per leggibilità si tralasciano i messaggi che un processo invia a sé stesso.

- $p_3$ fa una richiesta quando il suo orologio logico è $\mathit{clock} = 2$. Incrementa $\mathit{clock} \to 3$ e invia `[REQUEST, (3, p_3)]` a tutti.
- $p_1$ consegna `[REQUEST, (3, p_3)]` quando il suo orologio è $1$. Aggiorna $\mathit{clock} := \max(1, 3) + 1 = 4$, registra $(3, p_3)$ in `requests_1`, incrementa $\mathit{clock} \to 5$ e risponde a $p_3$ con `[ACK, (5, p_1)]`.
- $p_3$ consegna `[ACK, (5, p_1)]` e porta il proprio orologio a $\max(3, 5)+1 = 6$.
- $p_2$ consegna `[REQUEST, (3, p_3)]`, aggiorna $\mathit{clock} := \max(0, 3)+1 = 4$, incrementa $\mathit{clock} \to 5$ e risponde con `[ACK, (5, p_2)]`.
- $p_3$ riceve `[ACK, (5, p_2)]`, aggiornando $\mathit{clock} \to 7$.
- A questo punto $p_1$, il cui orologio è $5$, decide di richiedere la CS. Incrementa $\mathit{clock} \to 6$ e invia `[REQUEST, (6, p_1)]` a tutti.
- Poiché i canali sono FIFO, $p_3$ ha ricevuto l'ACK di $p_1$ prima della nuova REQUEST di $p_1$. Quando $p_3$ consegna `[REQUEST, (6, p_1)]`, il suo orologio va a $\max(7, 6) + 1 = 8$ e poi a $9$, e risponde con `[ACK, (9, p_3)]`. Ora `requests_3` contiene $(3, p_3)$ e $(6, p_1)$. Poiché $(3, p_3) < (6, p_1)$ e $p_3$ ha gli ACK di $p_1$ e $p_2$, entrambi con timestamp maggiore di $3$, $p_3$ entra nella CS (Grant).
- Nello stesso momento `requests_1` contiene $(3, p_3)$ e $(6, p_1)$. Poiché $(3, p_3) < (6, p_1)$, $p_1$ vede che la richiesta di $p_3$ è più piccola della sua: $p_1$ aspetta.
- Quando $p_3$ esce dalla CS, incrementa l'orologio a $10$ e invia `[RELEASE, (10, p_3)]` a tutti. Alla consegna del rilascio, $p_1$ toglie $(3, p_3)$ da `requests_1`. Ora $(6, p_1)$ è la richiesta più piccola in `requests_1`, e $p_1$ entra nella CS.

### Come si costruisce la dimostrazione di safety dell'algoritmo di mutua esclusione di Lamport?

**Teorema:** l'algoritmo di mutua esclusione di Lamport garantisce la mutua esclusione (safety).

**Dimostrazione per assurdo:**

1. Si supponga per assurdo che due processi distinti $p_i$ e $p_j$ ($p_i \neq p_j$) siano nella sezione critica nello stesso istante di tempo reale $t$.
2. Sia $(c_i, p_i)$ il timestamp della richiesta con cui $p_i$ è entrato, e $(c_j, p_j)$ il timestamp della richiesta di $p_j$.
3. Senza perdita di generalità, sia $(c_i, p_i) < (c_j, p_j)$ nell'ordine totale sui timestamp, per cui $c_i \le c_j$.
4. Poiché $p_j$ è entrato nella sezione critica, per la sua condizione di ingresso deve aver ricevuto da $p_i$ una conferma con timestamp $\mathit{ts}_i > c_j$.
5. L'orologio di $p_i$ non decresce mai, e $\mathit{ts}_i > c_j \ge c_i$: quindi $p_i$ ha inviato la sua richiesta $(c_i, p_i)$ prima di inviare la conferma con timestamp $\mathit{ts}_i$. Poiché i collegamenti sono FIFO, la richiesta $(c_i, p_i)$ è arrivata a $p_j$ prima di quella conferma.
6. La richiesta di $p_i$ viene tolta dall'insieme di $p_j$ solo quando $p_j$ consegna il RELEASE di $p_i$, che $p_i$ non ha inviato, perché è ancora nella sezione critica. Quindi, nel momento in cui $p_j$ ha valutato la sua condizione di ingresso, la richiesta $(c_i, p_i)$ era presente nell'insieme locale `requests` di $p_j$.
7. Poiché $(c_i, p_i) < (c_j, p_j)$, la richiesta di $p_j$ **non** era la più piccola del suo insieme `requests`.
8. Di conseguenza la condizione di ingresso di $p_j$ era falsa, contro l'ipotesi che $p_j$ sia entrato nella sezione critica. Quindi la mutua esclusione non è mai violata. $\blacksquare$

## Eventually perfect failure detector (◇P)

### Che cos'è l'eventually perfect failure detector ($\diamond\mathcal{P}$), e perché serve nei sistemi parzialmente sincroni?

In un sistema del tutto sincrono il perfect failure detector ($\mathcal{P}$) usa un timeout fisso, abbastanza grande da coprire il ritardo massimo di una richiesta e della sua risposta, per rilevare i crash con piena accuratezza e completezza. In un sistema asincrono, al contrario, un perfect failure detector non si può realizzare: un processo in crash è indistinguibile da uno molto lento.

Le reti reali come Internet sono **parzialmente sincrone** (o **sincrone prima o poi**):

- La rete può avere ritardi dei messaggi arbitrari e illimitati per un periodo sconosciuto.
- Dopo un Global Stabilization Time ($\mathrm{GST}$) sconosciuto il sistema diventa sincrono, e i ritardi di trasmissione dei messaggi sono limitati da un limite sconosciuto $B$.

Poiché il limite $B$ e $\mathrm{GST}$ sono sconosciuti, non si può scegliere in anticipo un timeout fisso $\Delta$. Se $\Delta$ è troppo piccolo, una congestione passeggera della rete provoca falsi sospetti. Per lavorare in un ambiente parzialmente sincrono si rinuncia all'accuratezza in ogni istante in cambio di un'**accuratezza prima o poi**, definendo l'**eventually perfect failure detector ($\diamond\mathcal{P}$)**. Prima che il sistema si stabilizzi il failure detector sbaglia, prendendo per guasti dei processi corretti: la nozione di *rilevazione* diventa quella di *sospetto*.

### Quali sono la specifica e l'interfaccia a eventi di $\diamond\mathcal{P}$?

Il modello di sistema è la sincronia parziale, con guasti di tipo crash e perfect point-to-point link. Il modulo $\diamond\mathcal{P}$ espone allo strato superiore due eventi di indicazione:

- **Suspect** (`suspect | p_i`): avvisa lo strato superiore che il processo $p_i$ è sospettato di essere andato in crash.
- **Restore** (`restore | p_i`): avvisa lo strato superiore che il processo $p_i$ non è più sospettato (un sospetto precedente era un falso allarme dovuto ai ritardi di rete).

È essenziale ricordare che nel nostro modello di guasto i processi sono **crash-stop** (dopo un crash non si riprendono mai). Un evento restore indica che il failure detector ha sbagliato durante una fase asincrona, **non** che un processo in crash è tornato in vita.

### Quali proprietà formali definiscono l'eventually perfect failure detector ($\diamond\mathcal{P}$)?

$\diamond\mathcal{P}$ è definito da due proprietà:

- **Strong completeness (liveness):** prima o poi ogni processo che va in crash è sospettato in modo permanente da ogni processo corretto. $$\exists t : \forall p \in \text{Crashed}, \forall q \in \text{Correct}, \forall t' \ge t, p \in \text{suspected}_q(t')$$
- **Eventual strong accuracy (liveness):** prima o poi nessun processo corretto è sospettato da alcun processo corretto. $$\exists t : \forall p, q \in \text{Correct}, \forall t' \ge t, p \notin \text{suspected}_q(t')$$

### Perché sia la strong completeness sia la eventual strong accuracy sono proprietà di liveness?

- **La strong completeness è liveness:** la completezza non si può violare in un prefisso finito di un'esecuzione, perché un processo in crash può sempre essere sospettato più tardi.
- **La eventual strong accuracy è liveness:** nemmeno l'accuratezza prima o poi si può violare in un prefisso finito. Se un processo corretto $p$ è sospettato a torto in un istante finito $t$, il failure detector può sempre generare un evento restore in un istante $t' > t$, una volta raggiunta la sincronia, soddisfacendo la proprietà.

### Che cos'è il lemma di stabilizzazione degli insiemi dei sospettati?

**Lemma:** con $\diamond\mathcal{P}$, per ogni coppia di processi corretti $p_i, p_j \in \text{Correct}$, gli insiemi locali dei processi sospettati si stabilizzano esattamente sullo stesso insieme, quello dei processi in crash, dopo un tempo finito $t_{\mathit{stab}}$. $$\exists t_{\mathit{stab}} : \forall t \ge t_{\mathit{stab}}, \text{suspected}_i(t) = \text{suspected}_j(t) = \text{Crashed}$$

**Dimostrazione:**

1. Per la strong completeness, ogni processo in crash $p_c \in \text{Crashed}$ prima o poi è incluso in modo permanente sia in $\text{suspected}_i$ sia in $\text{suspected}_j$.
2. Per la eventual strong accuracy, c'è un istante dopo il quale nessun processo corretto $p_k \in \text{Correct}$ è sospettato da $p_i$ o da $p_j$.
3. Quindi entrambi gli insiemi convergono a $\text{Crashed}$ e non cambiano più per ogni $t \ge t_{\mathit{stab}}$. $\blacksquare$

In modo equivalente, per assurdo: se dopo la stabilizzazione un processo $p$ fosse in un insieme e non nell'altro, allora o $p$ è corretto, e si viola la eventual strong accuracy, o $p$ è andato in crash, e si viola la strong completeness.

### Qual è la strategia dell'algoritmo e qual è lo pseudo-codice di $\diamond\mathcal{P}$?

La strategia è un meccanismo periodico di **heartbeat (ping-pong)** unito a un **timeout adattivo**:

- Ogni processo invia periodicamente un messaggio `PING` a tutti i processi.
- I processi rispondono con un `PONG`.
- Se un processo $p_j$ non risponde entro il timeout corrente, viene aggiunto a `suspected` e scatta un evento suspect.
- Se $p_j$ risponde più tardi (un `PONG` in ritardo arriva dopo il timeout), $p_j$ viene tolto da `suspected`, scatta un evento restore e il timeout locale viene aumentato (`delay := delay + Δ`).
- Dopo $\mathrm{GST}$, una volta che il timeout supera $2B$, nessun processo corretto risponde più in ritardo, i falsi sospetti finiscono e $\diamond\mathcal{P}$ si stabilizza in modo permanente. Succede dopo un numero finito di errori, perché a ogni errore il timeout cresce.

``` Increasing Timeout: un eventually perfect failure detector
Module:
  Name: EventuallyPerfectFailureDetector (epfd)

Events:
  Indications:
    epfd, Suspect | p_i                 // Process p_i suspected of crash
    epfd, Restore | p_i                 // Process p_i restored (not suspected)

Internal Events:
  ppl, Deliver | source, PING           // Incoming heartbeat ping
  ppl, Deliver | source, PONG           // Incoming heartbeat pong
  timer, Timeout                        // Periodic check timer

State Variables:
  alive := Π                           // Set of processes perceived as alive in current round
  suspected := ∅                       // Set of currently suspected processes
  delay := Δ                           // Adaptive timeout duration (initial default Δ)

Upon Event < epfd, Init > do:
  alive := Π
  suspected := ∅
  delay := Δ
  startTimer(delay)

Upon Event < timer, Timeout > do:
  if alive ∩ suspected ≠ ∅ then
    delay := delay + Δ                  // Increase timeout upon detecting false suspicion
  forall p_p ∈ Π do:
    if (p_p ∉ alive) ∧ (p_p ∉ suspected) then
      suspected := suspected ∪ {p_p}
      trigger < epfd, Suspect | p_p >
    else if (p_p ∈ alive) ∧ (p_p ∈ suspected) then
      suspected := suspected \ {p_p}
      trigger < epfd, Restore | p_p >
    trigger < ppl, Send | p_p, PING >
  alive := ∅
  startTimer(delay)

Upon Event < ppl, Deliver | p_s, PING > do:
  trigger < ppl, Send | p_s, PONG >

Upon Event < ppl, Deliver | p_s, PONG > do:
  alive := alive ∪ {p_s}
```

### Come si leggono, riga per riga, variabili e handler?

- **Inizializzazione** (`epfd, Init`): `alive` è posto a tutti i processi $\Pi$, `suspected` è inizializzato a $\emptyset$ e `delay` è posto alla stima iniziale $\Delta$. Si arma un timer di durata `delay`.
- **Handler del ping** (`ppl, Deliver | PING`): quando viene consegnato un `PING` di $p_s$, il destinatario risponde subito con un `PONG`.
- **Handler del pong** (`ppl, Deliver | PONG`): quando arriva un `PONG` di $p_s$, $p_s$ viene aggiunto all'insieme locale `alive`.
- **Handler del timeout** (`timer, Timeout`):
  - Per prima cosa controlla se `alive ∩ suspected ≠ ∅`. Se un processo è sia in `alive` (ha risposto) sia in `suspected` (era sospettato a torto), il timeout era troppo corto: `delay` viene aumentato di $\Delta$ (`delay := delay + Δ`).
  - Per ogni processo $p_p \in \Pi$:
    - Se $p_p \notin \mathit{alive}$ e $p_p \notin \mathit{suspected}$, allora $p_p$ non ha risposto e non era già sospettato: $p_p$ viene aggiunto a `suspected` e viene generato `< epfd, Suspect | p_p >`.
    - Se $p_p \in \mathit{alive}$ e $p_p \in \mathit{suspected}$, allora $p_p$ ha risposto ma era sospettato: $p_p$ viene tolto da `suspected` e viene generato `< epfd, Restore | p_p >`.
    - Viene inviato un nuovo `PING` a $p_p$.
  - Infine `alive := ∅` svuota l'insieme e il timer riparte con il `delay` aggiornato.

**Correttezza.** Strong completeness: un processo in crash smette di inviare messaggi, quindi ogni processo corretto prima o poi lo sospetta e non rivede più questo giudizio. Eventual strong accuracy: dopo che il sistema è diventato sincrono, un messaggio inviato da un processo corretto è consegnato entro un tempo limitato (a noi sconosciuto). Se $p$ è stato sospettato a torto da $q$, allora $q$ rivede il suo sospetto e aumenta il proprio delay; se il nuovo delay è ancora troppo corto, $q$ prima o poi sospetterà di nuovo $p$ e poi correggerà di nuovo il delay. Dopo un numero finito di errori il delay di $q$ è maggiore del doppio del ritardo massimo, e $q$ non sospetta più $p$.

### Che cosa succede con i "pong dal morto"?

**Domanda:** se un processo $p_2$ va in crash al tempo $t_1$, $p_1$ può generare un evento `restore | p_2` **dopo** $\mathrm{GST}$ ($t > \mathrm{GST}$)?

**Risposta:** sì, un numero finito di volte. Se $p_2$ ha inviato diversi messaggi `PONG` su un canale asincrono subito prima di andare in crash, quei vecchi `PONG` (i "pong dal morto") possono restare in ritardo nella rete a lungo. Poiché ping e pong non portano un numero di sequenza, un vecchio pong vale quanto uno nuovo: quando un `PONG` in ritardo arriva finalmente a $p_1$, $p_1$ aggiunge $p_2$ ad `alive` e fa scattare un falso restore. Però $p_2$, essendo morto, non genera nuovi `PONG`: in un tempo finito può averne inviati solo un numero finito. Quindi, dopo che tutti i messaggi vecchi in transito sono stati consegnati, $p_1$ sospetta $p_2$ in modo permanente.

Si potrebbe pensare di evitare il problema facendo ping solo ai processi in $\Pi \setminus \mathit{suspected}$ invece che a tutto $\Pi$. Non lo risolve: i pong dal morto sono stati generati prima del crash, quando il processo era vivo e vegeto, e sono già nel sistema.

## L'astrazione di leader election e i suoi algoritmi (Ω)

### Perché l'astrazione di leader election è importante nei sistemi distribuiti?

A volte non interessa sorvegliare i guasti, ma conoscere un processo che è vivo, per esempio perché serve un coordinatore. La leader election trasforma un sistema distribuito simmetrico in uno asimmetrico scegliendo un solo processo corretto come **leader (coordinatore)**. Questo rende possibili protocolli efficienti basati su un coordinatore (per esempio la replicazione primary-backup, la mutua esclusione con coordinatore, il consenso). È un oracolo diverso dal failure detector: invece di dire chi è andato in crash, indica un processo che è vivo.

### Quali sono la specifica e l'interfaccia dell'astrazione di leader election?

Il modulo di leader election espone un solo evento di indicazione:

- **Leader** (`leader | p_i`): avvisa lo strato superiore che il processo $p_i$ è eletto come leader corrente.

L'astrazione si considera solo per processi crash-stop.

### Quali proprietà formali specificano la leader election?

- **Eventual detection (liveness):** o non c'è alcun processo corretto, oppure prima o poi un processo corretto viene eletto leader.
- **Accuracy (safety):** se un processo $p_i$ è il leader, allora tutti i leader eletti in precedenza sono andati in crash. In particolare, non si può mai eleggere un nuovo leader mentre il precedente è ancora vivo.

### Come si realizza la leader election con un perfect failure detector ($\mathcal{P}$)?

In un sistema sincrono con un perfect failure detector $\mathcal{P}$, ogni processo mantiene un insieme locale `suspected` che contiene tutti i processi andati in crash. I processi eleggono il processo di rango massimo (l'identificatore più alto) in $\Pi \setminus \mathit{suspected}$. L'algoritmo si chiama monarchical leader election:

``` Monarchical leader election
Module:
  Name: PerfectLeaderElection (ple)

Events:
  Indications:
    ple, Leader | p_i                  // Elected leader indication

Internal Events:
  pfd, Crash | p_p                     // Crash detected by Perfect Failure Detector P

State Variables:
  suspected := ∅                       // Set of crashed processes
  leader := ⊥                          // Currently elected leader ID

Upon Event < ple, Init > do:
  suspected := ∅
  leader := ⊥
  leader := max_rank(Π \ suspected)
  trigger < ple, Leader | leader >

Upon Event < pfd, Crash | p_p > do:
  suspected := suspected ∪ {p_p}
  if max_rank(Π \ suspected) ≠ leader then
    leader := max_rank(Π \ suspected)
    trigger < ple, Leader | leader >
```

**Spiegazione riga per riga:**

1. All'inizializzazione `suspected` è vuoto. Il leader iniziale è $\mathit{max\_rank}(\Pi) = p_n$, e viene generato `< ple, Leader | p_n >`.
2. Quando $\mathcal{P}$ consegna `< pfd, Crash | p_p >`, $p_p$ viene aggiunto a `suspected`.
3. Se $p_p$ era il leader corrente, $\mathit{max\_rank}(\Pi \setminus \mathit{suspected})$ passa al processo sopravvissuto di rango più alto: `leader` viene aggiornato, e `< ple, Leader | leader >` è consegnato allo strato superiore.

**Correttezza.** La eventual detection segue dalla strong completeness di $\mathcal{P}$; l'accuracy segue dalla strong accuracy di $\mathcal{P}$ e dall'ordine totale sui ranghi (gli identificatori) dei processi.

### Che cos'è l'eventual leader detector ($\Omega$), e come si specifica?

Se il failure detector non è perfetto, l'accuracy della leader election non si può garantire: un processo che è solo sospettato può essere ancora vivo. Con un eventually perfect failure detector si ottiene un'astrazione più debole, l'**eventual leader detector** $\Omega$. Espone un solo evento di indicazione:

- **Trust** (`trust | p_i`): indica che il processo $p_i$ è ritenuto il leader.

Le sue proprietà sono:

- **Eventual accuracy:** c'è un istante dopo il quale ogni processo corretto ritiene leader un processo corretto.
- **Eventual agreement:** c'è un istante dopo il quale non ci sono due processi corretti che ritengono leader processi corretti diversi.

$\Omega$ garantisce che prima o poi tutti i processi corretti eleggano come leader lo stesso processo corretto. Prima di allora i leader possono cambiare in modo arbitrario e per un periodo arbitrario, e nello stesso periodo possono essere eletti più leader senza che nessuno sia andato in crash. Quando si è determinato un leader unico che non cambia più, si dice che il leader si è stabilizzato.

### Come si realizza l'eventual leader detector ($\Omega$) con un eventually perfect failure detector ($\diamond\mathcal{P}$)?

In un sistema parzialmente sincrono si usa $\diamond\mathcal{P}$, e si ottiene $\Omega$ direttamente con una regola deterministica sui processi che $\diamond\mathcal{P}$ non sospetta: ci si fida di quello con l'identificatore più alto. Poiché $\diamond\mathcal{P}$ può sospettare dei processi a torto e poi generare eventi restore, il modulo aggiorna il leader in modo dinamico usando $\mathit{max\_rank}(\Pi \setminus \mathit{suspected})$:

``` Monarchical eventual leader detection
Module:
  Name: EventualLeaderElection (ele / Ω)

Events:
  Indications:
    ele, Trust | p_i                   // Process p_i trusted to be leader

Internal Events:
  epfd, Suspect | p_p                  // Process p_p suspected by ◇P
  epfd, Restore | p_p                  // Process p_p restored by ◇P

State Variables:
  suspected := ∅                       // Currently suspected processes
  leader := ⊥                          // Currently trusted leader ID

Upon Event < ele, Init > do:
  suspected := ∅
  leader := ⊥
  leader := max_rank(Π \ suspected)
  trigger < ele, Trust | leader >

Upon Event < epfd, Suspect | p_p > do:
  suspected := suspected ∪ {p_p}
  if max_rank(Π \ suspected) ≠ leader then
    leader := max_rank(Π \ suspected)
    trigger < ele, Trust | leader >

Upon Event < epfd, Restore | p_p > do:
  suspected := suspected \ {p_p}
  if max_rank(Π \ suspected) ≠ leader then
    leader := max_rank(Π \ suspected)
    trigger < ele, Trust | leader >
```

**Spiegazione riga per riga:**

1. All'inizializzazione `leader` è posto a $\mathit{max\_rank}(\Pi)$.
2. Quando $\diamond\mathcal{P}$ genera `Suspect | p_p`, $p_p$ viene aggiunto a `suspected`. Se $p_p$ era il leader, `leader` passa al processo non sospettato di rango immediatamente inferiore, e viene generato `< ele, Trust | leader >`.
3. Quando $\diamond\mathcal{P}$ genera `Restore | p_p`, $p_p$ viene tolto da `suspected`. Se il rango di $p_p$ è più alto di quello del leader corrente, `leader` torna a $p_p$, e viene generato `< ele, Trust | leader >`.
4. **Eventual accuracy:** per la strong completeness di $\diamond\mathcal{P}$, prima o poi `suspected` contiene tutti i processi in crash, quindi $\Pi \setminus \mathit{suspected}$ contiene solo processi corretti (o è vuoto). **Eventual agreement:** per il lemma di stabilizzazione di $\diamond\mathcal{P}$, gli insiemi `suspected` di due processi corretti qualunque prima o poi hanno lo stesso contenuto, per cui $\Pi \setminus \mathit{suspected}$ converge a $\text{Correct}$ su tutti i processi corretti. Quindi tutti i processi corretti prima o poi si fidano, in modo permanente, dello stesso leader $\mathit{max\_rank}(\text{Correct})$.

### Quali sono i tre modelli: fail-stop, fail-noisy e fail-silent?

Le astrazioni viste finora danno tre modelli, che differiscono per la capacità di rilevare i guasti. Tutti assumono guasti di tipo crash e perfect link:

- **Fail-stop:** è disponibile un perfect failure detector $\mathcal{P}$, quindi i crash sono rilevati con accuratezza. $\mathcal{P}$ si può costruire solo in un sistema sincrono.
- **Fail-noisy:** è disponibile un eventually perfect failure detector $\diamond\mathcal{P}$ (o l'eventual leader detector $\Omega$): la rilevazione è "rumorosa", perché può sbagliare per un tempo finito prima di diventare accurata. $\diamond\mathcal{P}$ si può costruire in un sistema sincrono prima o poi.
- **Fail-silent:** non è disponibile alcun failure detector. Con i soli perfect link il sistema è asincrono, e i crash non si possono rilevare.

I modelli sono inclusi l'uno nell'altro, proprio come i modelli sincrono, sincrono prima o poi e asincrono: un sistema fail-stop è anche fail-noisy, e un sistema fail-noisy è anche fail-silent. L'inclusione fra gli insiemi dei problemi risolvibili va nel verso opposto: ogni problema risolvibile nel modello fail-silent è risolvibile nel modello fail-noisy, e ogni problema risolvibile nel modello fail-noisy è risolvibile nel modello fail-stop. Infine, un sistema sincrono è più forte di uno fail-stop: in un sistema sincrono si può costruire $\mathcal{P}$, ma ci sono problemi, come la sincronizzazione degli orologi, che richiedono la sincronia e non si risolvono con il solo perfect failure detector.
