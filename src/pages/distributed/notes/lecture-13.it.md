## Read-Impose Write-Majority: l'atomic register (1,N) nel modello fail-silent

### Qual è la struttura di un atomic register $(1,N)$ nel modello fail-silent?

- Un atomic register $(1,N)$ offre letture e scritture atomiche (linearizzabili) in un sistema asincrono fail-silent di $N$ processi ($\Pi = \{p_1, p_2, \dots, p_N\}$), con uno scrittore designato $p_w$ e molti lettori, senza alcun failure detector.
- L'algoritmo lavora sotto l'ipotesi di una **maggioranza di processi corretti** ($f < N/2$), e usa quorum di maggioranza ($Q_1 \cap Q_2 \neq \emptyset$) per garantire che letture e scritture si sovrappongano.
- L'algoritmo Read-Impose Write-Majority è una variazione del regular register Majority Voting. La scrittura è la stessa. La lettura ha due fasi: una **fase di query**, che trova il valore più recente come in Majority Voting, seguita da una **fase di impose**, che riscrive quel valore su una maggioranza prima di ritornare allo strato superiore. Nella fase di impose il lettore fa esattamente ciò che fa uno scrittore.

### Qual è lo pseudo-codice dell'algoritmo Read-Impose Write-Majority?

``` Read-Impose Write-Majority: atomic register (1, N)
Implements:
  (1, N)-AtomicRegister, instance onar.
Uses:
  BestEffortBroadcast, instance beb;
  PerfectPointToPointLinks, instance pl.

upon event < onar, Init > do
  (ts, val) := (0, ⊥);
  wts := 0;
  acks := 0;
  rid := 0;
  readlist := [⊥]^N;
  readval := ⊥;
  reading := FALSE;

upon event < onar, Read > do
  rid := rid + 1;
  acks := 0;
  readlist := [⊥]^N;
  reading := TRUE;
  trigger < beb, Broadcast | [READ, rid] >;

upon event < beb, Deliver | p, [READ, r] > do
  trigger < pl, Send | p, [VALUE, r, ts, val] >;

upon event < pl, Deliver | q, [VALUE, r, ts', v'] > such that r = rid do
  readlist[q] := (ts', v');
  if #(readlist) > N/2 then
    (maxts, readval) := highest(readlist);
    readlist := [⊥]^N;
    trigger < beb, Broadcast | [WRITE, rid, maxts, readval] >;

upon event < onar, Write | v > do
  rid := rid + 1;
  wts := wts + 1;
  acks := 0;
  trigger < beb, Broadcast | [WRITE, rid, wts, v] >;

upon event < beb, Deliver | p, [WRITE, r, ts', v'] > do
  if ts' > ts then
    (ts, val) := (ts', v');
  trigger < pl, Send | p, [ACK, r] >;

upon event < pl, Deliver | q, [ACK, r] > such that r = rid do
  acks := acks + 1;
  if acks > N/2 then
    acks := 0;
    if reading = TRUE then
      reading := FALSE;
      trigger < onar, ReadReturn | readval >;
    else
      trigger < onar, WriteReturn >;
```

### Che cosa fanno le variabili e gli handler di Read-Impose Write-Majority?

- `(ts, val)`: la coppia memorizzata da ogni processo $p_i$, con il timestamp `ts` più alto che ha visto e il valore `val` corrispondente.
- `wts`: un contatore intero tenuto solo dallo scrittore $p_w$, che genera i timestamp crescenti delle scritture.
- `acks`: il contatore delle conferme ricevute per la scrittura o l'imposizione in corso.
- `rid`: un contatore intero che identifica le operazioni di un processo. È usato sia dalle letture sia dalle scritture, e permette a un processo di scartare le risposte in ritardo alle sue operazioni precedenti.
- `readlist`: un array di $N$ posizioni, all'inizio tutte $\bot$, che memorizza le coppie raccolte dai membri del quorum durante la fase di query.
- `readval`: il valore con il timestamp più alto scelto nella fase di query, che viene riscritto nella fase di impose e poi restituito.
- `reading`: un flag che dice se le conferme in arrivo appartengono alla fase di impose di una lettura (vero) oppure a una scrittura (falso).
- `upon event < onar, Write | v >`: eseguito dallo scrittore $p_w$. Incrementa `rid` e `wts`, azzera `acks`, e invia `[WRITE, rid, wts, v]` con il best-effort broadcast.
- `upon event < beb, Deliver | p, [WRITE, r, ts', v'] >`: eseguito da un qualunque processo $p_i$ che consegna un messaggio `WRITE`, che venga dallo scrittore o da un lettore che sta imponendo. Se il timestamp `ts'` è maggiore del `ts` locale, $p_i$ aggiorna la sua coppia, `(ts, val) := (ts', v')`. Che abbia aggiornato la coppia o no, $p_i$ rimanda al mittente $p$ la conferma `[ACK, r]`, con l'identificatore dell'operazione.
- `upon event < pl, Deliver | q, [ACK, r] >`: eseguito quando arriva una conferma. Contano solo le conferme dell'operazione in corso (`r = rid`). Quando `acks > N/2` (una maggioranza ha confermato), `acks` viene azzerato. Se `reading` è vero, la fase di impose è completa: il processo pone `reading := FALSE` e restituisce `< onar, ReadReturn | readval >`. Altrimenti il processo è lo scrittore, che ha completato la sua scrittura e restituisce `< onar, WriteReturn >`.
- `upon event < onar, Read >`: eseguito da un lettore. Incrementa `rid`, azzera `acks` e `readlist`, pone `reading := TRUE`, e invia `[READ, rid]` in broadcast per cominciare la fase di query.
- `upon event < beb, Deliver | p, [READ, r] >`: eseguito da un processo che consegna una query. Il processo risponde sul link punto-punto con `[VALUE, r, ts, val]`, che porta la sua coppia corrente.
- `upon event < pl, Deliver | q, [VALUE, r, ts', v'] >`: eseguito quando arriva una risposta. Contano solo le risposte alla lettura in corso (`r = rid`). Il lettore memorizza la coppia, `readlist[q] := (ts', v')`. Una volta raccolte le risposte di una maggioranza (`#(readlist) > N/2`), il lettore prende da `readlist` la coppia `(maxts, readval)` con il timestamp più alto, azzera `readlist`, e invia `[WRITE, rid, maxts, readval]` in broadcast per cominciare la fase di impose.

Come in Read-Impose Write-All, la lettura restituisce il valore `readval` che ha imposto, e non la `val` locale, che nel frattempo una scrittura concorrente può aver cambiato.

### Perché la fase di impose è necessaria per garantire l'atomicità?

- Senza la fase di impose (cioè se un lettore restituisse il valore con il timestamp più alto subito dopo la fase di query, come nel regular register), **un valore nuovo potrebbe essere letto prima di uno vecchio**.
- Si supponga che lo scrittore $p_w$ cominci una scrittura $W(v_1)$ con timestamp $\mathit{ts}_1 = 1$, e che il messaggio `WRITE` abbia raggiunto un solo processo $p_a$: la scrittura è ancora in corso.
- Il lettore $p_{r1}$ esegue una query, e la maggioranza che risponde comprende $p_a$: vede $(1, v_1)$ e restituisce $v_1$.
- Il lettore $p_{r2}$ esegue una lettura che comincia **dopo** che la lettura di $p_{r1}$ si è completata. Se la maggioranza che risponde a $p_{r2}$ non comprende $p_a$, e se $p_{r1}$ non ha imposto $(1, v_1)$ a una maggioranza durante la sua lettura, tutte le risposte contengono la vecchia coppia $(0, v_0)$, e $p_{r2}$ restituisce $v_0$.
- Restituire $v_0$ dopo che $p_{r1}$ ha restituito $v_1$ viola l'atomicità (la proprietà di ordering). La fase di impose obbliga $p_{r1}$ a scrivere $(1, v_1)$ su una maggioranza $Q_C$ prima di completare la sua lettura: qualunque maggioranza che risponda in seguito a $p_{r2}$ interseca $Q_C$, e $p_{r2}$ vede un timestamp maggiore o uguale a $1$.

Una conseguenza della fase di impose è che non tutti i messaggi `WRITE` dello scrittore vengono accettati dal processo che li riceve. Se un messaggio di una scrittura raggiunge in fretta un processo, e quel processo poi legge e impone il valore, l'imposizione può arrivare agli altri processi prima dei messaggi dello scrittore, che vengono allora scartati (e confermati lo stesso). Fino a $N - 1$ degli $N$ messaggi di una scrittura possono finire così; il primo che arriva viene sempre accettato, perché non esiste ancora un valore più recente.

### Quali sono la complessità in messaggi e in passi dell'algoritmo Read-Impose Write-Majority?

- **Operazione di scrittura:**
  - Complessità in messaggi: al più $2N$ messaggi per scrittura ($1$ best-effort broadcast di $N$ messaggi, più $N$ conferme, di cui una maggioranza basta per completare).
  - Complessità in passi: $2$ passi di comunicazione ($1$ per il broadcast e $1$ per le conferme).
- **Operazione di lettura:**
  - Complessità in messaggi: al più $4N$ messaggi per lettura ($N$ messaggi per la query, $N$ risposte con i valori, $N$ messaggi per l'imposizione e $N$ conferme).
  - Complessità in passi: $4$ passi di comunicazione (query, risposte, imposizione, conferme).
- **Resilienza:**
  - $f < N/2$. L'algoritmo tollera fino a $\lfloor (N-1)/2 \rfloor$ crash senza bloccarsi.

## Confronto fra gli algoritmi per i registri

### Come si confrontano gli algoritmi per i registri rispetto a modelli di guasto, condizioni di consistenza e costi?

La tabella confronta i quattro algoritmi a scambio di messaggi per i registri $(1,N)$, nel modello fail-stop (con un perfect failure detector $\mathcal{P}$) e nel modello fail-silent (con i quorum, $f < N/2$):

| Registro | Modello di guasto | Lettura, messaggi | Lettura, passi | Scrittura, messaggi | Scrittura, passi | Resilienza |
|---|---|---|---|---|---|---|
| $(1,N)$ regolare | Fail-stop ($\mathcal{P}$) | $0$ (locale) | $0$ (locale) | $2N$ | $2$ | $f < N$ |
| $(1,N)$ regolare | Fail-silent (quorum) | $2N$ | $2$ | $2N$ | $2$ | $f < N/2$ |
| $(1,N)$ atomico | Fail-stop ($\mathcal{P}$) | $2N$ | $2$ | $2N$ | $2$ | $f < N$ |
| $(1,N)$ atomico | Fail-silent (quorum) | $4N$ | $4$ | $2N$ | $2$ | $f < N/2$ |

Che cosa mostra la tabella:

- **Il costo dell'atomicità:** il passaggio dalla semantica regolare a quella atomica si paga nelle letture, non nelle scritture, perché una lettura deve aiutare lo scrittore. Nel modello fail-silent una lettura passa da $2N$ messaggi e $2$ passi a $4N$ messaggi e $4$ passi, per via della fase di impose.
- **Il costo di fare a meno del failure detector:** sostituire il perfect failure detector $\mathcal{P}$ con i quorum di maggioranza ($f < N/2$) trasforma le letture del regular register da accessi locali, senza messaggi, in andate e ritorni sulla rete, con $O(N)$ messaggi, e abbassa la resilienza da $f < N$ a $f < N/2$.

In generale, un'astrazione più forte, o la stessa astrazione in un sistema più debole, si paga in messaggi.

### Che cosa cambia per i registri con molti scrittori?

L'atomic register $(N,N)$, in cui ogni processo può scrivere, nel corso non viene sviluppato. L'unica cosa da sapere è la sua specifica, che non può più usare la proprietà di ordering e torna ai punti di linearizzazione:

- **Termination:** come per l'atomic register $(1,N)$.
- **Atomicity:** ogni lettura restituisce il valore scritto più di recente in un'esecuzione ipotetica, in cui ogni operazione fallita sembra completa oppure sembra non essere stata invocata affatto, e ogni operazione completa sembra essere stata eseguita in un qualche istante fra la sua invocazione e il suo completamento.

L'istante di cui parla la proprietà è il punto di linearizzazione dell'operazione.

## Introduzione al consenso

### Che cos'è il problema del consenso, e quali sono le sue tappe?

- Il consenso è l'astrazione fondamentale del calcolo distribuito tollerante ai guasti: un insieme di processi deve mettersi d'accordo su un unico valore, scelto fra i valori proposti dai processi stessi.
- L'esempio dell'articolo originale è quello di alcuni generali che comunicano su canali inaffidabili e devono decidere se attaccare o ritirarsi: qualunque decisione va bene, purché sia la stessa per tutti. Una versione pacifica è il commit di una transazione su un database replicato: o tutte le repliche fanno commit, o tutte fanno abort.
- Le tappe del consenso:
  - **1982 - Lamport, Shostak e Pease (il problema dei generali bizantini):** il problema viene formalizzato, con guasti di tipo crash e con guasti arbitrari (bizantini).
  - **1985 - Fischer, Lynch e Paterson (il risultato di impossibilità FLP):** in un sistema asincrono nessun algoritmo deterministico risolve il consenso se anche un solo processo può andare in crash ($f = 1$), qualunque sia la dimensione del sistema. A differenza di tutti i problemi visti finora, qui una maggioranza di processi corretti e i quorum non bastano.
  - **1998 - Lamport (Paxos):** l'algoritmo Paxos viene presentato in "The Part-Time Parliament", e spiegato di nuovo in "Paxos Made Simple" (2001). Paxos risolve il consenso nei sistemi sincroni prima o poi, con guasti di tipo crash e una maggioranza di processi corretti ($f < N/2$).
  - **1999 - Castro e Liskov (PBFT, Practical Byzantine Fault Tolerance):** il primo algoritmo pratico per il consenso con guasti bizantini, che richiede un numero polinomiale, non esponenziale, di messaggi.
  - **Sistemi in uso:**
    - **Google Chubby:** un servizio di lock distribuiti che usa Paxos.
    - **Apache ZooKeeper:** un servizio di coordinamento basato su Zab, un protocollo della famiglia di Paxos.
    - **Blockchain permissioned:** piattaforme come Hyperledger Fabric, in cui i partecipanti sono autenticati, usano Paxos, PBFT o loro varianti.

## La specifica del consenso

### Quali sono gli eventi e le proprietà dell'astrazione di consenso (regolare)?

- **Eventi:**
  - Richiesta: `< c, Propose | v >`, con cui un processo propone il valore $v$. Ogni processo propone al più una volta.
  - Indicazione: `< c, Decide | v >`, con cui il modulo di consenso restituisce il valore deciso $v$.
- **Proprietà:**
  - **C1, termination (liveness):** ogni processo corretto prima o poi decide un qualche valore.
  - **C2, validity, detta anche non-triviality (safety):** se un processo decide $v$, allora $v$ è stato proposto da qualche processo.
  - **C3, integrity (safety):** nessun processo decide due volte (una decisione è irrevocabile).
  - **C4, agreement (safety):** non ci sono due processi corretti che decidono in modo diverso.

Il consenso è un problema one-shot: ogni processo propone una volta e decide una volta. Per decidere una sequenza di valori serve una nuova istanza di consenso per ognuno.

### Quali esecuzioni soddisfano le proprietà del consenso, e quali le violano?

- **Esecuzione 1 (corretta):**
  - I processi $p_1, p_2, p_3, p_4$ propongono rispettivamente i valori $v_1, v_1, v_2, v_3$.
  - Tutti i processi decidono $v_1$.
  - Analisi: sono soddisfatte termination (tutti i processi corretti decidono), validity ($v_1$ è stato proposto), integrity (ogni processo decide una volta) e agreement (tutti decidono lo stesso valore). Il valore deciso non deve essere quello proposto dalla maggior parte dei processi: anche decidere $v_3$ sarebbe corretto.
- **Esecuzione 2 (validity violata):**
  - I processi $p_1, p_2, p_3$ propongono tutti il valore $0$.
  - I processi decidono il valore $1$.
  - Analisi: è violata la **validity**, perché nessuno ha proposto $1$. Quando tutti i processi propongono lo stesso valore, quel valore è l'unica decisione possibile. È questa proprietà a escludere l'algoritmo banale che decide sempre un valore fisso senza scambiare alcun messaggio.
- **Esecuzione 3 (agreement violata):**
  - Il processo $p_1$ decide $2$; i processi $p_2, p_3, p_4$ decidono $1$. Tutti i processi sono corretti.
  - Analisi: è violata l'**agreement**, perché due processi corretti decidono valori diversi ($2 \neq 1$).
- **Esecuzione 4 (integrity violata):**
  - Il processo $p_1$ decide $2$, e più tardi genera una seconda decisione, `< c, Decide | 1 >`.
  - Analisi: è violata l'**integrity**. Una decisione è irrevocabile: nessun processo può decidere due volte.
- **Esecuzione 5 (termination violata):**
  - I processi $p_1, p_2, p_3$ propongono i loro valori, e un processo corretto va avanti per sempre senza mai generare `< c, Decide | v >`.
  - Analisi: è violata la **termination** (liveness): un processo corretto non può aspettare per sempre.
- **Esecuzione 6 (un processo guasto decide in modo diverso):**
  - Il processo $p_1$ propone $v_1$, decide $v_1$, e va subito in crash.
  - I processi $p_2, p_3, p_4$ sono corretti, propongono $v_2$, e decidono $v_2$.
  - Analisi: per il **consenso regolare** l'esecuzione è **corretta**. L'agreement richiede solo che non ci siano due processi **corretti** che decidono in modo diverso, e $p_1$ è guasto. (Per l'**uniform consensus** questa esecuzione violerebbe l'uniform agreement, che vieta a **due processi qualunque**, corretti o guasti, di decidere in modo diverso.)
- **Esecuzione 7 (un processo guasto decide un valore che nessuno ha proposto):**
  - Un processo decide $0$, un valore che nessun processo ha proposto, e poi va in crash.
  - Analisi: è violata la **validity**. A differenza dell'agreement, la validity parla di qualunque processo che decide, non solo di quelli corretti.

## Il consenso nel modello fail-stop: Hierarchical Consensus

### Qual è l'idea di un algoritmo di consenso basato sui leader?

Senza guasti il consenso è facile e non ha bisogno di votazioni: il processo con il rank più basso fa da leader, decide la propria proposta, e dice a tutti di decidere lo stesso valore. Il valore è uno che è stato proposto, ogni processo decide una volta, e il leader invia a tutti lo stesso valore.

Con i guasti, il leader può andare in crash mentre sta inviando il suo messaggio. Con un perfect failure detector $\mathcal{P}$ gli altri rilevano il crash, e il processo con il rank successivo diventa il leader. Ma compare un pericolo. Si supponga che il messaggio del leader in crash $p_1$, con il valore $1$, raggiunga solo $p_3$, e che $p_3$ decida $1$ appena lo riceve. Il nuovo leader $p_2$, che non ha ricevuto nulla, decide il proprio valore $2$ e lo invia a tutti: $p_3$ non può più cambiare la sua decisione, e due processi corretti hanno deciso in modo diverso.

L'errore è decidere quando si riceve il messaggio del leader. In **Hierarchical Consensus** un processo che riceve il valore di un leader non decide: cambia soltanto la propria proposta in quel valore. Un processo decide solo quando diventa lui stesso il leader.

L'algoritmo procede in $N$ round, e il leader del round $r$ è il processo con rank $r$:

- Il leader di un round decide la sua proposta corrente, e la invia in broadcast in un messaggio `DECIDED`.
- Un processo passa dal round $r$ al round $r + 1$ in due soli casi: quando ha ricevuto il messaggio del leader del round $r$ (e ne ha adottato il valore), oppure quando ha rilevato il crash di quel leader.

I round sono logici: appartengono all'algoritmo, non al sistema, e cominciano in momenti diversi su processi diversi.

L'osservazione chiave riguarda il primo leader corretto, cioè il processo corretto con il rank più basso. Poiché è corretto, non viene mai rilevato come in crash, e il suo broadcast raggiunge tutti i processi corretti: ogni processo corretto con un rank più alto può lasciare il suo round solo ricevendo il suo messaggio e adottando il suo valore. Quando quei processi diventano leader a loro volta, possono decidere solo quel valore. Un leader guasto di un round precedente può aver deciso qualcos'altro prima di andare in crash, e il consenso regolare lo permette.

### Qual è lo pseudo-codice di Hierarchical Consensus?

``` Hierarchical Consensus
Implements:
  Consensus, instance c.
Uses:
  BestEffortBroadcast, instance beb;
  PerfectFailureDetector, instance P.

upon event < c, Init > do
  detectedranks := ∅;
  round := 1;
  proposal := ⊥;
  proposer := 0;
  delivered := [FALSE]^N;
  broadcast := FALSE;

upon event < P, Crash | p > do
  detectedranks := detectedranks ∪ {rank(p)};

upon event < c, Propose | v > such that proposal = ⊥ do
  proposal := v;

upon round = rank(self) ∧ proposal ≠ ⊥ ∧ broadcast = FALSE do
  broadcast := TRUE;
  trigger < beb, Broadcast | [DECIDED, proposal] >;
  trigger < c, Decide | proposal >;

upon round ∈ detectedranks ∨ delivered[round] = TRUE do
  round := round + 1;

upon event < beb, Deliver | p, [DECIDED, v] > do
  r := rank(p);
  if r < rank(self) ∧ r > proposer then
    proposal := v;
    proposer := r;
  delivered[r] := TRUE;
```

- `detectedranks`: i rank dei processi rilevati come in crash. Quando arriva il round di uno di loro, viene saltato subito.
- `round`: il round corrente, che parte da $1$ e cresce di uno alla volta, senza mai saltare un valore.
- `proposal`: il valore che il processo propone in questo momento; all'inizio $\bot$, poi il valore proposto dallo strato superiore, poi eventualmente il valore di un leader.
- `proposer`: il rank dell'ultimo leader che ha fatto cambiare proposta al processo.
- `delivered`: un array di $N$ flag; `delivered[r]` è vero se il messaggio del leader del round `r` è stato ricevuto.
- `broadcast`: un flag che fa agire un processo da leader una volta sola.

### Come procede Hierarchical Consensus?

1. **Proposta:** quando lo strato superiore propone $v$, il processo lo memorizza in `proposal`. Succede una volta per processo. Il valore $\bot$ non si può proporre: l'algoritmo aspetterebbe per sempre una proposta vera.
2. **Diventare il leader:** la condizione `round = rank(self) ∧ proposal ≠ ⊥ ∧ broadcast = FALSE` è vera per primo sul processo $p_1$, appena ha una proposta. Il leader pone `broadcast := TRUE`, invia `[DECIDED, proposal]` a tutti e decide `proposal`. Se è corretto, farà adottare a tutti il suo valore; se è guasto, può decidere e andare in crash.
3. **Ricevere il messaggio di un leader:** un processo che consegna `[DECIDED, v]` dal processo di rank `r` adotta `v` solo se `r < rank(self)`, perché gli interessano solo i leader di rank più basso, e solo se `r > proposer`, così un messaggio lento di un vecchio leader non può sovrascrivere il valore di uno più recente. In ogni caso pone `delivered[r] := TRUE`.
4. **Cambiare round:** un processo lascia il round corrente quando il rank del round è in `detectedranks` (il leader è andato in crash) oppure quando `delivered[round]` è vero (il messaggio del leader è arrivato).

Un processo può cambiare la propria proposta al più $N - 1$ volte, e solo il processo con il rank più alto può cambiarla così spesso.

### Quanto costa Hierarchical Consensus?

- **Messaggi:** ogni leader invia un broadcast di $N$ messaggi, e ci sono al più $N$ leader: $N^2$ messaggi nel caso peggiore.
- **Passi:** $N$ passi di comunicazione nel caso peggiore, dalla prima proposta all'ultima decisione: il processo con il rank più alto deve aspettare che tutti gli altri siano stati leader.

### Perché Hierarchical Consensus è corretto?

- **Integrity:** un processo decide solo nell'handler protetto da `broadcast = FALSE`, che pone `broadcast := TRUE`: l'handler viene eseguito al più una volta.
- **Validity:** un processo decide la sua `proposal`, che è diversa da $\bot$. Una proposta è il valore dato dallo strato superiore oppure il valore ricevuto da un leader, che a sua volta ha deciso la propria proposta. Risalendo la catena, il primo valore è stato proposto dallo strato superiore di qualche processo.
- **Termination:** ogni round finisce su ogni processo corretto. Se il leader del round è corretto, il suo messaggio arriva; se va in crash, il perfect failure detector prima o poi lo rileva. Quindi ogni processo corretto prima o poi arriva al round del proprio rank, diventa il leader e decide.
- **Agreement:** sia $p_i$ il processo corretto con il rank più basso. Per la termination diventa il leader del round $i$ e decide la sua proposta $v$. Ogni altro processo corretto ha un rank più alto di $i$, e può lasciare il round $i$ solo dopo aver ricevuto il messaggio di $p_i$, perché $p_i$ non viene mai rilevato: quando lascia quel round, la sua proposta è $v$. Da quel momento fra i processi corretti circola solo $v$, e ognuno di loro, quando arriva il suo round, decide $v$.

Non è vero che solo il primo leader corretto può imporre il suo valore: un leader guasto può essere abbastanza veloce da raggiungere tutti prima di andare in crash. Alla dimostrazione serve soltanto che il primo leader corretto ci riesca di sicuro.

## Uniform consensus

### Che cos'è l'uniform consensus, e perché Hierarchical Consensus non è uniforme?

L'**uniform consensus** ha le stesse proprietà del consenso regolare, salvo che l'agreement è sostituita da:

- **Uniform agreement:** non ci sono due processi che decidono in modo diverso, che siano corretti o guasti.

È ciò che serve alle applicazioni quando una decisione ha effetti fuori dal sistema: un processo che decide di fare commit di una transazione, paga, e poi va in crash, non deve aver deciso in modo diverso dagli altri.

Hierarchical Consensus non soddisfa l'uniform agreement, perché un leader decide troppo presto. Un leader guasto $p_1$ può decidere il suo valore e andare in crash prima che il suo messaggio raggiunga qualcuno; il leader successivo $p_2$ decide allora il proprio valore, diverso.

### Come funziona Hierarchical Uniform Consensus?

Un leader non deve decidere appena arriva il suo round: deve decidere solo quando il suo valore è l'unico rimasto nel sistema.

1. Il leader del round invia a tutti il suo valore in un messaggio `PROPOSAL`: "cambiate idea".
2. Ogni processo che lo riceve memorizza il valore e risponde con una conferma.
3. Quando il leader ha le conferme di tutti i processi che non ha rilevato come in crash, ogni processo vivo ha il suo valore. Solo allora il leader invia un messaggio `DECIDED`, con il reliable broadcast.
4. Ogni processo, leader compreso, decide quando consegna il messaggio `DECIDED`.
5. Se il leader va in crash prima di questo punto, subentra il leader successivo. Se aveva ricevuto la proposta del leader in crash, la adotta prima di proporre.

Qui un processo cambia round solo quando il leader del round corrente viene rilevato come in crash: con un leader corretto, tutti restano nel suo round e decidono il suo valore.

### Qual è lo pseudo-codice di Hierarchical Uniform Consensus?

``` Hierarchical Uniform Consensus
Implements:
  UniformConsensus, instance uc.
Uses:
  PerfectPointToPointLinks, instance pl;
  BestEffortBroadcast, instance beb;
  ReliableBroadcast, instance rb;
  PerfectFailureDetector, instance P.

upon event < uc, Init > do
  detectedranks := ∅;
  ackranks := ∅;
  round := 1;
  proposal := ⊥;
  decision := ⊥;
  proposed := [⊥]^N;

upon event < P, Crash | p > do
  detectedranks := detectedranks ∪ {rank(p)};

upon event < uc, Propose | v > such that proposal = ⊥ do
  proposal := v;

upon round = rank(self) ∧ proposal ≠ ⊥ ∧ decision = ⊥ do
  trigger < beb, Broadcast | [PROPOSAL, proposal] >;

upon event < beb, Deliver | p, [PROPOSAL, v] > do
  proposed[rank(p)] := v;
  if rank(p) ≥ round then
    trigger < pl, Send | p, [ACK] >;

upon round ∈ detectedranks do
  if proposed[round] ≠ ⊥ then
    proposal := proposed[round];
  round := round + 1;

upon event < pl, Deliver | q, [ACK] > do
  ackranks := ackranks ∪ {rank(q)};

upon detectedranks ∪ ackranks = {1, ..., N} do
  trigger < rb, Broadcast | [DECIDED, proposal] >;

upon event < rb, Deliver | p, [DECIDED, v] > such that decision = ⊥ do
  decision := v;
  trigger < uc, Decide | decision >;
```

- `ackranks`: i rank dei processi che hanno confermato la proposta di questo processo.
- `proposed`: un array di $N$ posizioni, in cui un processo memorizza i valori proposti dai leader.
- `decision`: il valore deciso, all'inizio $\bot$; garantisce che un processo decida una volta sola.
- `detectedranks ∪ ackranks = {1, ..., N}`: ogni processo ha confermato oppure è andato in crash. È la stessa condizione `correct ⊆ acks` degli algoritmi visti finora, scritta in un altro modo.

Così com'è scritta, la condizione dell'handler che invia la proposta resta vera finché il leader non decide, quindi nulla impedisce che la proposta venga inviata più di una volta. Un flag come `broadcast` dell'algoritmo regolare la fa inviare al leader una volta sola.

### Quanto costa Hierarchical Uniform Consensus, e perché la decisione viene inviata con il reliable broadcast?

- **Caso migliore:** se il primo leader è corretto, bastano $3N$ messaggi: $N$ per la proposta, $N$ conferme e $N$ per la decisione. È il messaggio `DECIDED` a risparmiare agli altri leader i loro round: senza, il costo sarebbe di nuovo $N^2$.
- **Caso peggiore:** ogni leader che va in crash prima di decidere costa al più $2N$ messaggi (la sua proposta e le conferme). Con $f$ guasti, al più tardi il leader di rank $f + 1$ è corretto, quindi il totale è al più $2N \cdot f + 3N$ messaggi, cioè $O(f \cdot N)$. Poiché in pratica i guasti sono pochi, è molto meglio di $N^2$.

La decisione viene inviata con il **reliable broadcast** perché un best-effort broadcast metterebbe in pericolo la termination. Si supponga che il leader $p_1$ vada in crash mentre sta inviando `DECIDED`, e che il messaggio raggiunga solo $p_2$. Il processo $p_2$ decide; poiché la sua `decision` non è più $\bot$, quando arriva il suo round non invia alcuna proposta. Ma $p_2$ è corretto e non viene mai rilevato come in crash, quindi gli altri processi corretti aspettano nel suo round per sempre, senza mai decidere. Con il reliable broadcast, se il processo corretto $p_2$ consegna `DECIDED`, lo consegna anche ogni processo corretto. Le altre proprietà non sono in pericolo: quando `DECIDED` viene inviato, il valore del leader è l'unico rimasto nel sistema.
