## Impossibilità dell'uniform reliable broadcast senza una maggioranza di processi corretti

### Che cosa separa il reliable broadcast regolare dall'uniform reliable broadcast nei sistemi asincroni e parzialmente sincroni?

In un sistema asincrono o sincrono prima o poi, senza un perfect failure detector $\mathcal{P}$, il reliable broadcast regolare si può realizzare con l'algoritmo Eager Reliable Broadcast, senza alcuna ipotesi sul numero $f$ di processi guasti. L'uniform reliable broadcast, al contrario, non si può risolvere a meno che una maggioranza stretta dei processi sia corretta, cioè a meno che $f < n/2$. Se $f \ge n/2$, nessun algoritmo deterministico può garantire l'uniform agreement in tutte le esecuzioni.

### Come si dimostra l'impossibilità dell'uniform reliable broadcast quando $f \ge n/2$?

L'impossibilità si dimostra per assurdo per un sistema di $n = 2$ processi ($p_1, p_2$) in cui $f = 1$ processo può guastarsi (per cui $f = n/2$).

Si supponga per assurdo che esista un algoritmo deterministico $\mathcal{A}$ che risolve l'uniform reliable broadcast in un sistema asincrono o sincrono prima o poi di $n = 2$ processi con al più $f = 1$ crash, senza un perfect failure detector.

- **Esecuzione $E_1$ (un crash a $t = 0$):**
  - Il processo $p_2$ va in crash al tempo $t = 0$, prima di inviare o ricevere alcun messaggio.
  - Il processo $p_1$ è corretto e invia in broadcast un messaggio $m$ al tempo $t = 0$.
  - Per la proprietà di **validity** dell'uniform reliable broadcast, un processo corretto che invia un messaggio in broadcast prima o poi lo consegna. Poiché $p_1$ è corretto in $E_1$, $p_1$ deve consegnare $m$ in un tempo finito $t_{\mathit{del}} > 0$.
  - Durante l'intervallo $[0, t_{\mathit{del}}]$ il processo $p_1$ non riceve alcun messaggio da $p_2$ (che è morto). Quindi la decisione di $p_1$ di consegnare $m$ a $t_{\mathit{del}}$ si basa solo sulla sua esecuzione locale e sull'assenza di messaggi di $p_2$ durante $[0, t_{\mathit{del}}]$.
- **Esecuzione $E_2$ (messaggi lenti e un crash successivo):**
  - Si consideri una seconda esecuzione $E_2$ in cui sia $p_1$ sia $p_2$ sono vivi a $t = 0$, e $p_1$ invia in broadcast il messaggio $m$ a $t = 0$.
  - La rete asincrona (o un sistema sincrono prima o poi, quando non si è ancora stabilizzato) ritarda tutti i messaggi fra $p_1$ e $p_2$ oltre il tempo $t_{\mathit{del}}$. Un eventually perfect failure detector non aiuta: prima della stabilizzazione può sospettare $p_2$ per tutto l'intervallo, proprio come fa a ragione in $E_1$.
  - Dal punto di vista locale del processo $p_1$, l'esecuzione $E_2$ è **indistinguibile** da $E_1$ durante l'intervallo $[0, t_{\mathit{del}}]$. In entrambi i casi $p_1$ invia $m$ in broadcast a $t = 0$ e non riceve alcun messaggio da $p_2$ durante $[0, t_{\mathit{del}}]$.
  - Poiché $p_1$ è una macchina a stati deterministica e osserva la stessa storia locale in $E_1$ e in $E_2$ fino a $t_{\mathit{del}}$, $p_1$ deve compiere **in $E_2$ esattamente gli stessi passi che in $E_1$**. Di conseguenza $p_1$ consegna il messaggio $m$ al tempo $t_{\mathit{del}}$ in $E_2$.
  - Subito dopo aver consegnato $m$, $p_1$ va in crash: in $E_2$ è un **processo guasto**.
  - Inoltre tutti i messaggi che $p_1$ ha inviato prima di andare in crash, ancora in transito, vanno persi: un perfect link garantisce la consegna di un messaggio solo se il suo mittente è corretto.
  - Il processo $p_2$, che è corretto in tutta l'esecuzione $E_2$, non riceve mai alcun messaggio su $m$, e non sa nulla dell'esistenza di $m$.
  - Di conseguenza $p_2$ non consegna mai $m$.
- **Contraddizione con l'uniform agreement:**
  - Nell'esecuzione $E_2$ il processo $p_1$ (che è guasto, perché è andato in crash subito dopo $t_{\mathit{del}}$) ha consegnato il messaggio $m$.
  - Il processo $p_2$ (che è corretto in $E_2$) non consegna mai il messaggio $m$.
  - Questo viola direttamente la proprietà di **uniform agreement**, che richiede che se **un qualunque** processo (corretto o guasto) consegna un messaggio $m$, allora **ogni** processo corretto prima o poi consegni $m$.
  - Quindi l'ipotetico algoritmo $\mathcal{A}$ fallisce: nessun algoritmo deterministico può risolvere l'uniform reliable broadcast per $n = 2, f = 1$ senza una maggioranza di processi corretti o un perfect failure detector $\mathcal{P}$.

Lo stesso argomento funziona per qualunque $n$ con $f \ge n/2$: basta dividere i processi in due gruppi di al più $f$ processi ciascuno, che fanno la parte di $p_1$ e di $p_2$, e rallentare tutti i messaggi fra i due gruppi.

### Perché il requisito del quorum ($f < n/2$) aggira questo risultato di impossibilità?

Quando $f < n/2$, l'insieme dei processi corretti è una maggioranza stretta $Q_C \subseteq \Pi$, con $|Q_C| \ge \lfloor n/2 \rfloor + 1$. In un protocollo basato su quorum un processo $p_i$ può consegnare un messaggio $m$ solo dopo aver raccolto le conferme di un quorum di maggioranza $Q_1$.

Per le proprietà dei quorum su un insieme finito di $n$ processi: $$\forall Q_1, Q_2 \subseteq \Pi \text{ such that } |Q_1| \ge \left\lfloor \frac{n}{2} \right\rfloor + 1 \text{ and } |Q_2| \ge \left\lfloor \frac{n}{2} \right\rfloor + 1 \implies Q_1 \cap Q_2 \neq \emptyset$$

Poiché due quorum qualunque si sovrappongono in almeno un processo, e il numero di processi guasti è limitato da $f < n/2$, qualunque quorum $Q_1$ che conferma $m$ a $p_1$ contiene almeno un processo corretto $p_{\mathit{survivor}} \in Q_1 \cap Q_C$. Anche se $p_1$ va in crash subito dopo aver consegnato $m$, il processo $p_{\mathit{survivor}}$ resta vivo e ripete $m$ a tutti gli altri processi, garantendo che ogni processo corretto di $Q_C$ prima o poi consegni $m$.

## FIFO-order reliable broadcast

### Che cosa sono le comunicazioni ordinate?

Il reliable broadcast non dice nulla sull'ordine in cui i messaggi vengono consegnati, e questo può causare anomalie in molte applicazioni: un server che consegna "cancel my reservation" prima di "reserve a seat" cancella una prenotazione che non è mai stata fatta. Le comunicazioni ordinate definiscono garanzie sull'ordine delle consegne dentro un gruppo di processi. Ci sono tre tipi di ordinamento: le consegne possono rispettare l'ordine FIFO dei broadcast corrispondenti, il loro ordine causale, oppure un ordine totale (quest'ultimo si tratta dopo il consenso). L'ordinamento è ortogonale all'affidabilità: una comunicazione ordinata e affidabile si ottiene aggiungendo una o più proprietà di ordinamento a un reliable broadcast.

### Quali sono la definizione e l'interfaccia del FIFO-order reliable broadcast?

Il FIFO-order reliable broadcast (FRB) aggiunge alle garanzie del reliable broadcast l'ordinamento dei messaggi di una singola sorgente. Garantisce che i messaggi inviati in broadcast dallo stesso mittente $p_i$ siano consegnati da tutti i processi nell'ordine esatto in cui $p_i$ li ha inviati.

L'astrazione di FIFO broadcast espone due eventi:

- **Evento di richiesta:** $\text{frbBroadcast}(m)$ - invocato da un processo per inviare in broadcast il messaggio $m$ con garanzie di ordinamento FIFO.
- **Evento di indicazione:** $\text{frbDeliver}(p_i, m)$ - generato dall'astrazione per consegnare il messaggio $m$ inviato in broadcast dal processo sorgente $p_i$.

### Quali proprietà specificano il FIFO-order reliable broadcast?

Una primitiva di FIFO-order reliable broadcast su un insieme di processi $\Pi = \{p_1, p_2, \dots, p_n\}$ soddisfa cinque proprietà, le quattro del reliable broadcast più una sull'ordine:

- **FRB1 (validity):** se un processo corretto $p_i$ invia in broadcast un messaggio $m$, allora $p_i$ prima o poi consegna $m$.
- **FRB2 (no duplication):** nessun messaggio $m$ è consegnato più di una volta da alcun processo.
- **FRB3 (no creation):** se un processo consegna un messaggio $m$ con mittente $p_i$, allora $m$ è stato inviato in broadcast in precedenza da $p_i$.
- **FRB4 (agreement):** se un messaggio $m$ è consegnato da un processo corretto $p_i$, allora $m$ prima o poi è consegnato da ogni processo corretto $p_j$. (Nel FIFO broadcast uniforme questa diventa l'uniform agreement.)
- **FRB5 (FIFO delivery):** se un processo $p_i$ invia in broadcast un messaggio $m_1$ prima di inviare un messaggio $m_2$, allora nessun processo corretto $p_j$ consegna $m_2$ senza aver già consegnato $m_1$.

La proprietà FIFO è ortogonale alle garanzie di affidabilità: il broadcast può essere regolare o uniforme, e un'esecuzione può essere FIFO senza essere né regolare né uniforme.

### Come si realizza il FIFO-order reliable broadcast con i numeri di sequenza?

Il FIFO-order reliable broadcast si costruisce sopra un reliable broadcast regolare (`rb`) o un uniform reliable broadcast (`urb`), attaccando a ogni messaggio inviato in broadcast un numero di sequenza locale $\mathit{lsn}$ monotono crescente, e tenendo i messaggi consegnati fuori ordine in un insieme `pending` finché non sono stati consegnati tutti i messaggi di quel mittente con numero di sequenza minore.

``` Broadcast with Sequence Number: FIFO-order reliable broadcast
# Algorithm: FIFO-Order Reliable Broadcast (FRB)
# Implemented on process p_i using an underlying Reliable Broadcast (rb) module

Upon Event: frbInit:
    lsn := 0
    pending := ∅
    for all p_j ∈ Π do:
        next[p_j] := 1

Upon Event: frbBroadcast(m):
    lsn := lsn + 1
    trigger rbBroadcast([DATA, p_i, m, lsn])

Upon Event: rbDeliver(p_j, [DATA, p_s, m, seq]):
    pending := pending ∪ {[p_s, m, seq]}
    while ∃ [p_s, m', seq'] ∈ pending such that seq' = next[p_s] do:
        pending := pending \ {[p_s, m', seq']}
        next[p_s] := next[p_s] + 1
        trigger frbDeliver(p_s, m')
```

**Spiegazione riga per riga dello pseudo-codice:**

- `Upon Event: frbInit`:
  - `lsn := 0`: inizializza a zero il contatore di sequenza locale dei messaggi inviati in broadcast dal processo $p_i$.
  - `pending := ∅`: inizializza un insieme vuoto, usato per tenere i messaggi in arrivo che sono fuori ordine.
  - `for all p_j ∈ Π do: next[p_j] := 1`: inizializza un array $\mathit{next}[1 \dots n]$ di dimensione $n$, dove $\mathit{next}[p_j]$ è il prossimo numero di sequenza atteso dal mittente $p_j$.
- `Upon Event: frbBroadcast(m)`:
  - `lsn := lsn + 1`: incrementa il contatore di sequenza locale prima di inviare il messaggio.
  - `trigger rbBroadcast([DATA, p_i, m, lsn])`: impacchetta in una tupla il contenuto $m$, l'identità del mittente originale $p_i$ e il numero di sequenza $\mathit{lsn}$, e la passa al reliable broadcast sottostante.
- `Upon Event: rbDeliver(p_j, [DATA, p_s, m, seq])`:
  - `pending := pending ∪ {[p_s, m, seq]}`: quando riceve una tupla dal reliable broadcast, $p_i$ aggiunge il contenuto $m$, il mittente $p_s$ e il numero di sequenza $\mathit{seq}$ al suo insieme $\mathit{pending}$.
  - `while ∃ [p_s, m', seq'] ∈ pending such that seq' = next[p_s] do`: controlla ripetutamente se l'insieme $\mathit{pending}$ contiene un messaggio del mittente $p_s$ il cui numero di sequenza $\mathit{seq}'$ è esattamente quello atteso, $\mathit{next}[p_s]$.
  - `pending := pending \ {[p_s, m', seq']}`: toglie quel messaggio dall'insieme $\mathit{pending}$.
  - `next[p_s] := next[p_s] + 1`: incrementa il numero di sequenza atteso dal mittente $p_s$.
  - `trigger frbDeliver(p_s, m')`: genera l'evento di indicazione per lo strato superiore, consegnando il messaggio $m'$ della sorgente $p_s$ in ordine FIFO.

### Come gestisce l'algoritmo FIFO i messaggi che arrivano fuori ordine?

Si supponga che il processo $p_0$ invii in broadcast $m_1$ (con $\mathit{seq}=1$) seguito subito da $m_2$ (con $\mathit{seq}=2$). Poiché la rete è asincrona, il processo $p_2$ riceve $m_2$ ($\mathit{seq}=2$) da `rbDeliver` prima di ricevere $m_1$ ($\mathit{seq}=1$).

1. Quando $p_2$ riceve $m_2$ ($\mathit{seq}=2$), inserisce $[p_0, m_2, 2]$ in $\mathit{pending}$.
2. La condizione del `while` controlla se $\mathit{seq}' = \mathit{next}[p_0]$. Poiché $\mathit{next}[p_0] = 1$ e il messaggio nell'insieme ha $\mathit{seq}'=2$, la condizione è falsa. Il messaggio $m_2$ resta in $\mathit{pending}$, e questo impedisce una consegna fuori ordine.
3. Prima o poi $m_1$ ($\mathit{seq}=1$) arriva a $p_2$ da `rbDeliver` e viene aggiunto a $\mathit{pending}$.
4. La condizione del `while` è vera per $[p_0, m_1, 1]$, perché $\mathit{seq}' = \mathit{next}[p_0] = 1$.
5. $p_2$ toglie $m_1$ da $\mathit{pending}$, incrementa $\mathit{next}[p_0]$ a $2$ e genera `frbDeliver(p_0, m_1)`.
6. Nell'iterazione successiva del ciclo `while` la condizione è vera per $[p_0, m_2, 2]$, perché $\mathit{seq}'=2$ è ora uguale a $\mathit{next}[p_0]=2$.
7. $p_2$ toglie $m_2$ da $\mathit{pending}$, incrementa $\mathit{next}[p_0]$ a $3$ e genera `frbDeliver(p_0, m_2)`.
8. Entrambi i messaggi sono consegnati in ordine FIFO ($m_1$ seguito da $m_2$).

## Causal-order reliable broadcast

### Perché l'ordinamento FIFO non basta a mantenere la coerenza in applicazioni con molti partecipanti?

L'ordinamento FIFO vincola solo i messaggi dello **stesso** mittente. Non pone alcun vincolo sui messaggi inviati in broadcast da processi **diversi**, nemmeno quando quei messaggi dipendono causalmente l'uno dall'altro.

Si consideri l'esempio alla lavagna di un **registro distribuito di conti bancari**. Una transazione $T(q, s, d)$ sposta la quantità di denaro $q$ dal conto sorgente $s$ al conto di destinazione $d$, ed è valida solo se il saldo della sorgente non diventa negativo. All'inizio tutti conoscono il saldo degli altri: il processo $p_0$ ha $3$, il processo $p_1$ ha $10$, i processi $p_2$ e $p_3$ hanno $0$. Ogni transazione viene inviata in broadcast, e ogni processo aggiorna la propria vista dei saldi secondo le transazioni che consegna.

1. **Transazione $T_1 = T(3, p_0, p_1)$:** $p_0$ invia in broadcast un trasferimento di $3$ da $p_0$ a $p_1$.
2. Il processo $p_1$ consegna $T_1$: il suo saldo sale a $13$, mentre il saldo di $p_0$ scende a $0$.
3. **Transazione $T_2 = T(5, p_1, p_2)$:** dopo aver consegnato $T_1$, il processo $p_1$ invia in broadcast un trasferimento di $5$ da $p_1$ a $p_2$.
4. **Transazione $T_3 = T(6, p_1, p_0)$:** il processo $p_1$ invia poi in broadcast un trasferimento di $6$ da $p_1$ a $p_0$.
5. Il processo $p_0$ consegna $T_3$: il suo saldo sale a $6$.
6. **Transazione $T_4 = T(3, p_0, p_3)$:** dopo aver consegnato $T_3$, il processo $p_0$ invia in broadcast un trasferimento di $3$ da $p_0$ a $p_3$.
7. Si supponga che la primitiva di comunicazione sottostante garantisca il FIFO broadcast, ma **non** il causal broadcast.
8. Il processo $p_3$ consegna $T_1$ ($3$ da $p_0$ a $p_1$). Nel registro locale di $p_3$ il saldo di $p_0$ è ora $0$.
9. Per via dei ritardi di rete la transazione $T_3$ ($6$ da $p_1$ a $p_0$) è lenta.
10. Il processo $p_3$ consegna la transazione $T_4$ ($3$ da $p_0$ a $p_3$) prima di $T_3$.
11. Il processo $p_3$ guarda il suo registro locale: in questo momento $p_0$ ha $0$. $p_3$ rifiuta la transazione $T_4$ **come non valida**, perché il saldo di $p_0$ diventerebbe negativo.
12. L'anomalia nasce dal fatto che $T_4$ è stata generata causalmente da $T_3$ ($T_3 \to T_4$), ma $p_3$ ha consegnato $T_4$ prima di $T_3$. Il FIFO broadcast non può impedirlo, perché $T_3$ è stata inviata da $p_1$ mentre $T_4$ è stata inviata da $p_0$. Serve una primitiva di **causal order broadcast**, che conservi la causalità fra mittenti diversi.

### Qual è la definizione di causal delivery?

L'ordine causale è un'estensione della relazione happened-before di Lamport ai messaggi inviati in broadcast. Un messaggio $m_1$ può aver potenzialmente causato un messaggio $m_2$, e si scrive $m_1 \to m_2$, se vale una delle seguenti:

1. Un processo $p_i$ ha inviato in broadcast $m_1$ prima di inviare $m_2$.
2. Un processo $p_j$ ha consegnato $m_1$ e in seguito ha inviato in broadcast $m_2$.
3. Esiste un messaggio $m'$ tale che $m_1 \to m'$ e $m' \to m_2$ (transitività).

Il causal-order reliable broadcast ha le proprietà CRB1-CRB4, che sono le quattro proprietà del reliable broadcast, più:

- **CRB5 (causal delivery):** per ogni messaggio $m_1$ che ha potenzialmente causato un messaggio $m_2$, cioè $m_1 \to m_2$, nessun processo consegna $m_2$ senza aver già consegnato $m_1$.

Come il FIFO broadcast, il causal broadcast può essere regolare o uniforme. La causal delivery implica la FIFO delivery, per via della prima regola.

### Come si realizza il No-Waiting Causal Reliable Broadcast usando l'intera storia dei messaggi?

L'algoritmo **No-Waiting Causal Reliable Broadcast** non ritarda mai una consegna sul destinatario: attacca a ogni messaggio in uscita l'intera storia causale ($\mathit{past}$) del mittente. Quando un processo riceve una tupla con un contenuto $m$ e una lista di storia $\mathit{past}$, scorre $\mathit{past}$, consegna in ordine causale tutti i messaggi precedenti che non ha ancora consegnato, e poi consegna subito $m$, senza mai tenerlo in un buffer.

``` No-Waiting Causal Reliable Broadcast
# Algorithm 1: No-Wait Causal Reliable Broadcast (Full History / Past Vector)
# Implemented on process p_i using an underlying Reliable Broadcast (rb) module

Upon Event: crbInit:
    delivered := ∅
    past := []

Upon Event: crbBroadcast(m):
    trigger rbBroadcast([DATA, past, m])
    past := past || [(p_i, m)]

Upon Event: rbDeliver(p_j, [DATA, m_past, m]):
    if m ∉ delivered then:
        for all (p_s, m') ∈ m_past do:
            if m' ∉ delivered then:
                delivered := delivered ∪ {m'}
                if (p_s, m') ∉ past then:
                    past := past || [(p_s, m')]
                trigger crbDeliver(p_s, m')
        delivered := delivered ∪ {m}
        if (p_j, m) ∉ past then:
            past := past || [(p_j, m)]
        trigger crbDeliver(p_j, m)
```

**Spiegazione riga per riga dello pseudo-codice:**

- `Upon Event: crbInit`:
  - `delivered := ∅`: l'insieme di tutti i messaggi che $p_i$ ha consegnato allo strato superiore.
  - `past := []`: una lista ordinata (una sequenza) che registra tutti i messaggi che precedono causalmente i futuri broadcast di $p_i$.
- `Upon Event: crbBroadcast(m)`:
  - `trigger rbBroadcast([DATA, past, m])`: invia con il reliable broadcast una tupla che contiene l'etichetta `DATA`, l'intera storia causale `past` del mittente e il contenuto $m$.
  - `past := past || [(p_i, m)]`: aggiunge il messaggio appena inviato, $(p_i, m)$, in coda alla lista di storia locale $\mathit{past}$ di $p_i$.
- `Upon Event: rbDeliver(p_j, [DATA, m_past, m])`:
  - `if m ∉ delivered then`: controlla se il contenuto $m$ è già stato consegnato, per non elaborarlo due volte.
  - `for all (p_s, m') ∈ m_past do`: scorre la lista di storia causale `m_past` attaccata dal mittente, nell'ordine della lista, dal più vecchio al più recente.
  - `if m' ∉ delivered then`: se un messaggio $m'$ che precede causalmente non è ancora stato consegnato in locale da $p_i$:
    - `delivered := delivered ∪ {m'}`: segna $m'$ come consegnato.
    - `if (p_s, m') ∉ past then: past := past || [(p_s, m')]`: aggiunge $(p_s, m')$ in coda alla lista locale $\mathit{past}$ di $p_i$, se non c'è già, così la causalità è conservata per i processi che riceveranno i futuri broadcast di $p_i$.
    - `trigger crbDeliver(p_s, m')`: consegna subito $m'$ allo strato superiore.
  - `delivered := delivered ∪ {m}`: segna come consegnato il messaggio $m$ stesso.
  - `if (p_j, m) ∉ past then: past := past || [(p_j, m)]`: aggiunge $(p_j, m)$ in coda alla lista locale $\mathit{past}$ di $p_i$. Il test conta per il mittente, che ha già aggiunto il proprio messaggio quando l'ha inviato.
  - `trigger crbDeliver(p_j, m)`: consegna il messaggio $m$ allo strato superiore.

### Quali sono i limiti di spazio del No-Waiting Causal Broadcast, e come li risolve la garbage collection?

Nell'algoritmo No-Waiting Causal Broadcast la lista $\mathit{past}$ cresce senza limite nel tempo (una complessità in spazio $O(|E|)$, dove $|E|$ è il numero totale di broadcast nella storia del sistema): ogni messaggio viaggia insieme a tutta la sua storia causale, il che richiede memoria infinita. In un sistema che resta in funzione a lungo, attaccare $\mathit{past}$ a ogni messaggio rende i messaggi enormi.

Non c'è però bisogno di tenere i vecchi messaggi per sempre: un messaggio si può scartare una volta che è stato consegnato da tutti i processi corretti. Un meccanismo di **garbage collection (GC)** tiene traccia di "chi ha consegnato che cosa", usando un perfect failure detector $\mathcal{P}$ e gli insiemi di conferme $\mathit{ack}[m]$. Quando un messaggio $m$ è stato consegnato da tutti i processi non rilevati come in crash ($\text{correct} \subseteq \mathit{ack}[m]$), il messaggio $m$ è stabile e si può togliere in sicurezza dalla lista $\mathit{past}$. Il meccanismo funziona solo con $\mathcal{P}$, cioè nel modello fail-stop.

``` No-Waiting Causal Reliable Broadcast con garbage collection del passato
# Algorithm 2: Improved No-Wait Causal Reliable Broadcast with Garbage Collection
# Implemented on process p_i using Perfect Failure Detector P and Reliable Broadcast (rb)

Upon Event: ecrbInit:
    delivered := ∅
    past := []
    correct := Π
    for all m do: ack[m] := ∅

Upon Event: ecrbBroadcast(m):
    trigger rbBroadcast([DATA, past, m])
    past := past || [(p_i, m)]

Upon Event: rbDeliver(p_j, [DATA, m_past, m]):
    if m ∉ delivered then:
        for all (p_s, m') ∈ m_past do:
            if m' ∉ delivered then:
                delivered := delivered ∪ {m'}
                if (p_s, m') ∉ past then:
                    past := past || [(p_s, m')]
                trigger ecrbDeliver(p_s, m')
                trigger rbBroadcast([ACK, m'])
        delivered := delivered ∪ {m}
        if (p_j, m) ∉ past then:
            past := past || [(p_j, m)]
        trigger ecrbDeliver(p_j, m)
        trigger rbBroadcast([ACK, m])

Upon Event: rbDeliver(p_j, [ACK, m]):
    ack[m] := ack[m] ∪ {p_j}
    if correct ⊆ ack[m] then:
        past := past \ {(p_s, m)}

Upon Event: P_Crash(p_f):
    correct := correct \ {p_f}
    for all m ∈ delivered do:
        if correct ⊆ ack[m] then:
            past := past \ {(p_s, m)}
```

I primi tre handler sono quelli dell'algoritmo precedente, con un'aggiunta: un processo che consegna un messaggio invia anche in broadcast un `ACK` per quel messaggio. Gli ultimi due handler fanno la garbage collection: quando per un messaggio $m$ sono arrivati gli `ACK` di tutti i processi in `correct`, la coppia $(p_s, m)$ viene tolta da `past`; lo stesso controllo si ripete quando viene rilevato un crash, perché l'insieme `correct` è diventato più piccolo.

La garbage collection, però, non pone un limite alla dimensione di $\mathit{past}$. Un messaggio viene tolto due ritardi di messaggio dopo il suo broadcast (uno perché il messaggio raggiunga tutti, uno perché tornino le conferme), ma in un sistema asincrono due ritardi di messaggio possono essere un tempo fisico arbitrariamente lungo, e nel frattempo ogni nuovo broadcast allunga $\mathit{past}$.

### Come usa i vector clock il Waiting Causal Reliable Broadcast per tenere piccoli i messaggi?

Invece di inviare l'intera storia dei messaggi ($\mathit{past}$), il **Waiting Causal Reliable Broadcast** sostituisce le liste di storia con compatti **vector clock** $V[1 \dots N]$ di dimensione $n$. Ogni processo $p_i$ mantiene un vector clock $V_i[1 \dots N]$, dove $V_i[j]$ è il numero di messaggi inviati in broadcast dal processo $p_j$ che $p_i$ ha consegnato. L'algoritmo non ha bisogno di un failure detector: funziona nel modello fail-silent.

``` Waiting Causal Reliable Broadcast
# Algorithm 3: Waiting Causal Reliable Broadcast (Vector Clock Approach)
# Implemented on process p_i using Reliable Broadcast (rb)

Upon Event: wcrbInit:
    V := [0, 0, ..., 0]  # Vector of size N
    lsn := 0
    pending := ∅

Upon Event: wcrbBroadcast(m):
    W := V
    W[p_i] := lsn
    lsn := lsn + 1
    trigger rbBroadcast([DATA, p_i, W, m])

Upon Event: rbDeliver(p_j, [DATA, p_s, W, m]):
    pending := pending ∪ {[p_s, W, m]}
    while ∃ [p_s, W', m'] ∈ pending such that W' ≤ V do:
        pending := pending \ {[p_s, W', m']}
        V[p_s] := V[p_s] + 1
        trigger wcrbDeliver(p_s, m')
```

**Spiegazione riga per riga dello pseudo-codice:**

1. `Upon Event: wcrbInit`:
  - `V := [0, 0, ..., 0]`: inizializza a tutti zeri il vector clock locale $V_i$ del processo $p_i$, di lunghezza $n$.
  - `lsn := 0`: inizializza a zero il contatore di sequenza locale dei broadcast.
  - `pending := ∅`: inizializza un insieme vuoto, usato per tenere i messaggi che non si possono ancora consegnare.
2. `Upon Event: wcrbBroadcast(m)`:
  - `W := V`: copia il vector clock corrente nel timestamp $W$.
  - `W[p_i] := lsn`: pone la propria componente $W[p_i]$ al numero di sequenza locale $\mathit{lsn}$, cioè al numero di messaggi che $p_i$ ha inviato in broadcast prima di questo.
  - `lsn := lsn + 1`: incrementa il contatore di sequenza locale $\mathit{lsn}$.
  - `trigger rbBroadcast([DATA, p_i, W, m])`: invia con il reliable broadcast il contenuto $m$, l'identità del mittente originale $p_i$ e il timestamp vettoriale $W$.
3. `Upon Event: rbDeliver(p_j, [DATA, p_s, W, m])`:
  - `pending := pending ∪ {[p_s, W, m]}`: mette in $\mathit{pending}$ il messaggio in arrivo $m$, con il suo mittente $p_s$ e il suo timestamp $W$.
  - `while ∃ [p_s, W', m'] ∈ pending such that W' ≤ V do`: valuta la **condizione di consegna causale** $W' \le V$, cioè $W'[k] \le V[k]$ per ogni componente $k$:
    - $W'[p_s] \le V[p_s]$: tutti i messaggi che il mittente $p_s$ ha inviato in broadcast prima di $m'$ sono già stati consegnati qui. Poiché $W'[p_s]$ è esattamente il numero di quei messaggi, $m'$ è il **prossimo** messaggio atteso da $p_s$.
    - $W'[k] \le V[k]$ per $k \neq p_s$: il processo $p_i$ ha già consegnato **tutti i messaggi** di ogni altro processo $p_k$ che $p_s$ aveva consegnato quando ha inviato $m'$, cioè i messaggi che precedono causalmente $m'$.
  - `pending := pending \ {[p_s, W', m']}`: toglie da $\mathit{pending}$ il messaggio $m'$, che ora è pronto.
  - `V[p_s] := V[p_s] + 1`: aggiorna il vector clock di $p_i$ per registrare la consegna del messaggio $m'$ del mittente $p_s$.
  - `trigger wcrbDeliver(p_s, m')`: consegna il messaggio $m'$ allo strato superiore.

Quando arriva un messaggio il cui timestamp non è ancora coperto da $V$, il processo ne ritarda la consegna: il messaggio aspetta in $\mathit{pending}$ finché i messaggi che lo precedono non sono stati consegnati. Lo mostra l'esecuzione vista a lezione, con tre processi che partono tutti da $[0, 0, 0]$:

1. Il processo $p_1$ invia in broadcast $m_1$. Il suo $\mathit{lsn}$ è $0$, quindi $m_1$ viaggia con il timestamp $[0, 0, 0]$.
2. Il processo $p_3$ riceve $m_1$: poiché $[0, 0, 0] \le [0, 0, 0]$, consegna $m_1$ e incrementa la componente del mittente, così il suo vettore diventa $[1, 0, 0]$.
3. Il processo $p_3$ invia in broadcast $m_2$, che viaggia con il timestamp $[1, 0, 0]$: il timestamp dice che il mittente aveva già consegnato un messaggio di $p_1$.
4. Il messaggio $m_2$ è più veloce di $m_1$ e raggiunge per primo il processo $p_2$. Il vettore di $p_2$ è ancora $[0, 0, 0]$, e $[1, 0, 0] \le [0, 0, 0]$ è falso: $m_2$ aspetta in $\mathit{pending}$.
5. Prima o poi $m_1$ raggiunge $p_2$: $[0, 0, 0] \le [0, 0, 0]$, quindi $p_2$ consegna $m_1$ e il suo vettore diventa $[1, 0, 0]$.
6. Ora la condizione vale anche per $m_2$: $p_2$ consegna $m_2$ e incrementa la componente di $p_3$, così il suo vettore diventa $[1, 0, 1]$.

I vettori di questo algoritmo sono simili ai vector clock della Lezione 4, ma non si aggiornano allo stesso modo: un processo incrementa una componente quando **consegna** un messaggio, non quando ne invia uno, e incrementa la propria componente solo quando consegna un proprio messaggio. Per questo serve il contatore separato $\mathit{lsn}$. Un processo può inviare in broadcast due messaggi uno subito dopo l'altro, prima di aver consegnato lui stesso il primo: con $\mathit{lsn}$ il primo messaggio porta $0$ e il secondo porta $1$ nella componente del mittente, mentre una semplice copia di $V$ darebbe a entrambi lo stesso timestamp, e l'ordine fra i due andrebbe perso.

### Quali sono i compromessi fra No-Waiting e Waiting Causal Broadcast?

| Aspetto | No-Waiting Causal Broadcast (storia completa) | Waiting Causal Broadcast (vector clock) |
|---|---|---|
| Dimensione di ciò che si attacca a un messaggio | Illimitata: $O(\lvert E \rvert)$, l'intera storia causale | $O(n)$: un vettore di $n$ interi |
| Ritardo di consegna | **Nessuna attesa** sul destinatario: i messaggi precedenti mancanti arrivano dentro il messaggio stesso | I messaggi aspettano in $\mathit{pending}$ finché la condizione $W' \le V$ non diventa vera |
| Failure detector | Serve $\mathcal{P}$ per la garbage collection di $\mathit{past}$ | **Nessuno**: funziona in un sistema puramente asincrono |
| Carico sulla rete | Uso pesante della banda | Minimo |
