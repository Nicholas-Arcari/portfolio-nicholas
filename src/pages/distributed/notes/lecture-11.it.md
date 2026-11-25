## Riepilogo del regular register Read-One Write-All e dei suoi limiti

### Che cos'è l'algoritmo Read-One Write-All (ROWA), e come funziona?

L'algoritmo Read-One Write-All (ROWA) realizza un regular register $(1,N)$, con un solo scrittore e molti lettori, nel modello fail-stop, con un perfect failure detector $\mathcal{P}$. Il registro è una variabile condivisa inizializzata a $\bot$ (oppure $0$), scritta da un processo designato $p_0$ e letta da tutti gli $N$ processi.

Le due operazioni funzionano così:

- **Operazione di scrittura:** quando invoca `write(v)`, lo scrittore $p_0$ invia il messaggio `[WRITE, v]` a tutti i processi di $\Pi$ (sé stesso compreso) con il best-effort broadcast ($\text{BEB}$). Ogni processo che lo riceve aggiorna la sua variabile locale, $\mathit{val} := v$, e rimanda una conferma `ACK` a $p_0$ su un link punto-punto. Lo scrittore termina la scrittura (restituendo una conferma) solo dopo aver ricevuto le conferme di tutti i processi che il failure detector non ha rilevato come in crash (l'insieme `correct`).
- **Operazione di lettura:** quando invoca `read()`, un qualunque lettore $p_i$ restituisce semplicemente il valore contenuto nella sua variabile locale $\mathit{val}$, senza alcuna comunicazione.

### Qual è la complessità in messaggi e in passi dell'algoritmo ROWA?

- **Scrittura, messaggi:** una scrittura genera $2N$ messaggi punto-punto quando non ci sono guasti ($N$ messaggi per la diffusione con il best-effort broadcast, più $N$ conferme verso lo scrittore).
- **Scrittura, passi:** esattamente $2$ passi di comunicazione ($1$ passo per diffondere il valore e $1$ passo per raccogliere le conferme).
- **Lettura, messaggi:** $0$ messaggi. La lettura è strettamente locale.
- **Lettura, passi:** $0$ passi di comunicazione.

### Come gestisce ROWA i crash dei processi con un perfect failure detector $\mathcal{P}$?

L'algoritmo ROWA tollera un numero qualunque di crash: fino a $N - 1$, e formalmente le sue proprietà non sono violate nemmeno se tutti gli $N$ processi vanno in crash (se non resta nessuno, nessuno può osservare una violazione). Il motivo è che il sistema ha un perfect failure detector $\mathcal{P}$, che soddisfa la strong completeness (prima o poi ogni processo in crash è rilevato in modo permanente da ogni processo corretto) e la strong accuracy (nessun processo è rilevato prima che vada in crash): lo scrittore non aspetta mai per sempre la conferma di un processo in crash, e non smette mai di aspettare un processo che è vivo.

Quando un processo $p_k$ va in crash, $\mathcal{P}$ prima o poi genera su $p_0$ l'evento `Crash` per $p_k$, e $p_0$ toglie $p_k$ dall'insieme `correct`. Di conseguenza $p_0$ completa la sua scrittura appena ha le conferme di tutti i processi che sono ancora in `correct`. A un lettore i crash degli altri non interessano affatto, perché legge in locale.

### Che cosa succede in un'esecuzione in cui lo scrittore va in crash?

Si consideri un'esecuzione con lo scrittore $p_0$ e i lettori $p_1, p_2, p_3$:

1. $p_0$ invoca `write(5)` e comincia il best-effort broadcast.
2. Il messaggio `[WRITE, 5]` raggiunge $p_1$ e $p_2$, che aggiornano le loro copie locali a $5$ e inviano le loro conferme.
3. Prima che il messaggio per $p_3$ sia consegnato, lo scrittore $p_0$ va in crash. Poiché la sorgente del broadcast è guasta, quel messaggio può andare perso. La scrittura non viene mai completata: è un'operazione fallita.
4. Il lettore $p_3$, che non riceve mai l'aggiornamento, legge la sua copia locale e restituisce $\bot$, ora e per sempre.
5. Il lettore $p_1$, che ha aggiornato la sua copia locale, legge $5$.

Questo comportamento è ammesso dalla consistenza regolare. Poiché la scrittura è fallita nel mezzo della sua esecuzione, è concorrente con tutte le letture successive, e una lettura concorrente con una scrittura può restituire sia il valore vecchio ($\bot$) sia il valore che viene scritto ($5$).

### Perché ROWA fallisce con un eventually perfect failure detector ($\diamond\mathcal{P}$)?

L'algoritmo ROWA non è più corretto se il perfect failure detector $\mathcal{P}$ viene sostituito da un eventually perfect failure detector $\diamond\mathcal{P}$. In un sistema sincrono prima o poi, prima del global stabilization time ($\mathrm{GST}$), $\diamond\mathcal{P}$ può sospettare a torto dei processi corretti, per via di ritardi di rete arbitrari.

Si consideri lo scenario seguente in un sistema di due processi ($p_0$ è lo scrittore, $p_1$ è un lettore):

1. $p_0$ invoca `write(5)` e invia `[WRITE, 5]` a $p_1$ e a sé stesso. $p_0$ riceve la propria conferma.
2. Per via di un ritardo transitorio prima di $\mathrm{GST}$, $\diamond\mathcal{P}$ su $p_0$ sospetta a torto $p_1$.
3. Il processo $p_0$ aggiorna $\text{correct} := \{p_0\}$, vede di aver ricevuto le conferme di tutti i processi in `correct`, e termina `write(5)` troppo presto.
4. Dopo che `write(5)` è ritornata, $p_1$ (che è perfettamente vivo) invoca `read()`.
5. Poiché il messaggio `[WRITE, 5]` è ancora in transito, $p_1$ legge la sua copia locale e restituisce $\bot$.

Questo viola la validity del regular register: una lettura che segue una scrittura completata **deve** restituire il valore di quella scrittura (o di una successiva). Restituire $\bot$ dopo che `write(5)` è ritornata è una violazione di safety. Il problema è che l'insieme `correct` può essere sbagliato, quindi lo scrittore può ritornare da una scrittura prima di aver imposto il suo valore agli altri processi.

## Majority Voting: un regular register nel modello fail-silent

### Come si può realizzare un regular register in un sistema asincrono fail-silent, senza failure detector?

In un sistema fail-silent non c'è alcun failure detector (né $\mathcal{P}$ né $\diamond\mathcal{P}$): il sistema è asincrono, e i crash non si possono rilevare. Per realizzare un regular register $(1,N)$ senza ipotesi sui tempi, la rilevazione dei guasti viene sostituita da un'ipotesi sul numero dei guasti: una **maggioranza dei processi è corretta**, cioè $f < N/2$. L'algoritmo usa perfect point-to-point link e best-effort broadcast.

### Che cos'è un quorum, e perché l'ipotesi di una maggioranza di processi corretti ($f < N/2$) è decisiva?

In un sistema di $N$ processi, un **quorum** $Q$ è un qualunque sottoinsieme di processi di dimensione: $$|Q| \ge \left\lfloor \frac{N}{2} \right\rfloor + 1$$

Gli algoritmi basati su quorum si appoggiano alla **proprietà di intersezione dei quorum:** $$\forall Q_1, Q_2 \subseteq \Pi \text{ such that } |Q_1| \ge \left\lfloor \frac{N}{2} \right\rfloor + 1 \text{ and } |Q_2| \ge \left\lfloor \frac{N}{2} \right\rfloor + 1 \implies Q_1 \cap Q_2 \neq \emptyset$$

Due quorum qualunque si intersecano in almeno un processo. Quando il numero di crash è limitato da $f < N/2$, l'insieme di tutti i processi corretti è lui stesso un quorum $Q_{\text{correct}}$, di dimensione almeno $\lfloor N/2 \rfloor + 1$: un'operazione che aspetta le risposte di un quorum termina sempre. Inoltre un qualunque quorum contattato da una scrittura ($Q_{\text{write}}$) e un qualunque quorum contattato da una lettura ($Q_{\text{read}}$) hanno in comune almeno un processo: $$Q_{\text{write}} \cap Q_{\text{read}} \neq \emptyset$$

Questa intersezione garantisce che un lettore che contatta una maggioranza incontri sempre almeno un processo che ha visto, e memorizzato, il valore dell'ultima scrittura completata.

### Perché leggere la copia locale non basta più, e perché servono i timestamp?

La scrittura comincia come in ROWA: lo scrittore invia il valore in broadcast, e ogni processo che lo riceve lo memorizza e invia una conferma. Poiché i crash non si possono rilevare, però, lo scrittore non può aspettare tutti: ritorna appena ha le conferme di una maggioranza. Questo cambia due cose.

- **La lettura non può essere locale.** Quando la scrittura ritorna, i processi fuori dalla maggioranza che l'ha confermata possono non aver ancora ricevuto il valore, perché i loro messaggi sono lenti. Se uno di loro leggesse la sua copia locale, restituirebbe il valore vecchio dopo la fine della scrittura, e questo non è regolare. Quindi anche il lettore deve chiedere: invia una richiesta in broadcast, e aspetta i valori memorizzati da una maggioranza di processi. Per la proprietà di intersezione, almeno una delle risposte arriva da un processo che ha visto l'ultima scrittura completata.
- **Al lettore serve un modo per scegliere.** Si supponga che lo scrittore scriva $1$ e poi $2$, e che la seconda scrittura sia confermata da una maggioranza diversa. Un lettore può allora trovare fra le risposte tutti e due i valori, e deve poter dire quale dei due è il più recente. Per questo lo scrittore attacca un **timestamp** (un numero di sequenza) a ogni valore che scrive, e il lettore restituisce il valore con il timestamp più alto fra quelli che ha ricevuto.

La maggioranza che risponde si chiama insieme dei **testimoni** del valore, e può essere diversa per ogni operazione. L'algoritmo si chiama Majority Voting perché i processi di una maggioranza, per così dire, votano per il valore del registro.

### Qual è l'algoritmo Majority Voting per un regular register $(1,N)$?

L'algoritmo Majority Voting permette a un solo scrittore e a $N$ lettori di mantenere un regular register in un sistema asincrono fail-silent.

``` Majority Voting: regular register (1, N)
upon event < onrr, Init > do
  (ts, val) := (0, ⊥);
  wts := 0;
  acks := 0;
  rid := 0;
  readlist := [⊥]^N;

upon event < onrr, Write | v > do
  wts := wts + 1;
  acks := 0;
  trigger < beb, Broadcast | [WRITE, wts, v] >;

upon event < beb, Deliver | p, [WRITE, ts', v'] > do
  if ts' > ts then
    (ts, val) := (ts', v');
  trigger < pl, Send | p, [ACK, ts'] >;

upon event < pl, Deliver | q, [ACK, ts'] > such that ts' = wts do
  acks := acks + 1;
  if acks > N/2 then
    acks := 0;
    trigger < onrr, WriteReturn >;

upon event < onrr, Read > do
  rid := rid + 1;
  readlist := [⊥]^N;
  trigger < beb, Broadcast | [READ, rid] >;

upon event < beb, Deliver | p, [READ, r] > do
  trigger < pl, Send | p, [VALUE, r, ts, val] >;

upon event < pl, Deliver | q, [VALUE, r, ts', v'] > such that r = rid do
  readlist[q] := (ts', v');
  if #(readlist) > N/2 then
    v := highestval(readlist);
    readlist := [⊥]^N;
    trigger < onrr, ReadReturn | v >;
```

**Spiegazione delle variabili e degli handler:**

- **Inizializzazione:**
  - `(ts, val)`: la copia locale del registro su ogni processo, insieme al timestamp del valore; all'inizio è $(0, \bot)$.
  - `wts`: il timestamp delle scritture, usato solo dallo scrittore e incrementato a ogni scrittura.
  - `acks`: il contatore delle conferme ricevute per la scrittura in corso.
  - `rid`: un contatore che identifica le letture di un processo.
  - `readlist`: un array di $N$ posizioni, in cui un lettore memorizza le coppie (timestamp, valore) ricevute dai testimoni durante una lettura.
- **Inizio di una scrittura:** lo scrittore incrementa `wts`, riporta `acks` a $0$, e invia `[WRITE, wts, v]` a tutti con il best-effort broadcast.
- **Servire una scrittura:** un processo che riceve `[WRITE, ts', v']` confronta `ts'` con il suo `ts` locale. Se `ts' > ts`, adotta la coppia: `(ts, val) := (ts', v')`. In ogni caso rimanda `[ACK, ts']` allo scrittore. Un vecchio messaggio `WRITE`, che arriva dopo uno più recente, non sovrascrive lo stato locale, ma viene confermato lo stesso.
- **Fine di una scrittura:** lo scrittore conta solo le conferme che portano il timestamp della scrittura in corso (`ts' = wts`), così non viene confuso dalle conferme in ritardo delle scritture precedenti. Quando `acks > N/2`, cioè quando una maggioranza ha confermato, lo scrittore azzera `acks` e genera `WriteReturn`.
- **Inizio di una lettura:** il lettore incrementa `rid`, svuota `readlist`, e invia `[READ, rid]` a tutti con il best-effort broadcast.
- **Servire una lettura:** un processo che riceve `[READ, r]` risponde con `[VALUE, r, ts, val]`: il suo timestamp e il suo valore correnti, insieme all'identificatore della lettura.
- **Fine di una lettura:** il lettore accetta solo le risposte alla sua lettura in corso (`r = rid`), e memorizza ognuna in `readlist[q]`. Quando le posizioni di `readlist` diverse da $\bot$ sono una maggioranza (`#(readlist) > N/2`), il lettore prende il valore con il timestamp più alto (`highestval(readlist)`), svuota `readlist`, e restituisce quel valore.

L'identificatore `rid` fa per le letture ciò che `wts` fa per le scritture. Senza di lui, le risposte in ritardo a una vecchia lettura potrebbero essere contate fra le risposte a una lettura nuova, che potrebbe allora ritornare senza aver sentito una maggioranza fresca.

### Quali sono la complessità in messaggi, la complessità in passi e la resilienza dell'algoritmo Majority Voting?

- **Scrittura, messaggi:** al più $2N$ messaggi ($N$ per il broadcast più $N$ conferme).
- **Scrittura, passi:** $2$ passi di comunicazione (il broadcast, poi le conferme di un quorum).
- **Lettura, messaggi:** al più $2N$ messaggi ($N$ per la richiesta di lettura più $N$ risposte con i valori).
- **Lettura, passi:** $2$ passi di comunicazione (la richiesta, poi le risposte di un quorum).
- **Resilienza:** $f < N/2$. L'algoritmo tollera fino a $\lfloor (N-1)/2 \rfloor$ crash.

Rispetto a ROWA, fare a meno del failure detector si paga due volte: con un'ipotesi in più (la maggioranza di processi corretti), e con letture che non sono più gratuite ($2N$ messaggi e $2$ passi invece di $0$).

### Che cosa succede a safety e liveness se i crash non sono una minoranza ($f \ge N/2$)?

Se il numero di crash raggiunge la metà dei processi ($f \ge N/2$), non si riesce più a raccogliere un quorum di $\lfloor N/2 \rfloor + 1$ risposte.

- **Liveness:** si perde. Scrittori e lettori restano bloccati per sempre, in attesa di risposte che non arriveranno mai: in un sistema di $10$ processi con $5$ crash, il contatore delle conferme può arrivare al più a $5$, e la condizione `acks > N/2` non diventa mai vera.
- **Safety:** è **conservata**. Un'operazione bloccata non ritorna, quindi non può restituire un valore sbagliato. Un algoritmo basato sulle maggioranze, se è progettato bene, fallisce in questo modo: si ferma, ma non dà mai una risposta sbagliata.

## Condizioni di consistenza per i registri: regolare, sequenziale e atomica

### Quali sono le definizioni di regular consistency, sequential consistency e linearizability?

Un registro offre le operazioni `write(v)` e `read()`, ognuna delle quali occupa un intervallo di tempo fra la sua invocazione $\text{inv}(O)$ e il suo ritorno $\text{ret}(O)$. Come nella lezione precedente, $O_1$ precede $O_2$ se $\text{ret}(O_1) < \text{inv}(O_2)$, e due operazioni sono concorrenti se i loro intervalli si sovrappongono.

Le tre condizioni di consistenza del corso sono:

- **Regular consistency:**
  - **Termination:** ogni operazione invocata da un processo corretto prima o poi si completa.
  - **Validity:** una lettura che non è concorrente con alcuna scrittura restituisce il valore dell'ultima scrittura completata prima di lei. Una lettura concorrente con una o più scritture restituisce il valore dell'ultima scrittura completata oppure il valore di una delle scritture concorrenti.
- **Sequential consistency** (Lamport, 1979): "the result of any execution is the same as if the (read and write) operations by all processes on the data store were executed in some sequential order and the operations of each individual process appear in this sequence in the order specified by its program". In altre parole, un'esecuzione è sequenzialmente consistente se tutte le sue operazioni si possono disporre in un'unica sequenza globale $G$ tale che:
  - $G$ rispetta l'ordine locale delle operazioni di ogni processo;
  - ogni lettura restituisce il valore della scrittura più recente che la precede in $G$ (il valore iniziale, se non ce n'è nessuna).
- **Linearizability (atomic consistency):** un'esecuzione è linearizzabile (atomica) se ogni operazione $O$ sembra avere effetto in modo istantaneo in un qualche momento fra la sua invocazione e il suo ritorno, cioè dentro l'intervallo $[\text{inv}(O), \text{ret}(O)]$. Questo momento è il **punto di linearizzazione** dell'operazione. Le operazioni, prese nell'ordine dei loro punti di linearizzazione, devono formare un'esecuzione sequenziale corretta: ogni lettura restituisce il valore dell'ultima scrittura il cui punto di linearizzazione viene prima del suo.

La sequenza $G$ della sequential consistency è fittizia: non deve rispettare l'ordine in cui le operazioni di processi diversi avvengono nel tempo reale. Basta che esista. La sequential consistency dà a ogni processo l'illusione di usare una memoria unica, a cui si accede un'operazione alla volta: un processo che vede solo il registro non può distinguere un'esecuzione sequenzialmente consistente da una in cui gli accessi sono davvero serializzati con un lock, anche se nessuno prende alcun lock.

### Quali relazioni ci sono fra consistenza regolare, sequenziale e atomica?

- **Atomic consistency $\implies$ sequential consistency:** ogni esecuzione linearizzabile è sequenzialmente consistente, perché i punti di linearizzazione, presi in ordine, definiscono una sequenza globale $G$ che rispetta l'ordine locale di ogni processo.
- **Atomic consistency $\implies$ regular consistency:** ogni esecuzione linearizzabile è regolare. Il punto di linearizzazione di una scrittura cade dentro la scrittura, quindi una lettura che comincia dopo la fine della scrittura ha il suo punto di linearizzazione dopo quello della scrittura, e non può restituire un valore più vecchio. Una lettura concorrente con la scrittura restituisce il valore vecchio o quello nuovo, secondo la posizione del suo punto di linearizzazione, ed entrambi sono ammessi dalla semantica regolare.
- **Regular consistency e sequential consistency non sono confrontabili:**
  - Regular consistency $\nRightarrow$ sequential consistency.
  - Sequential consistency $\nRightarrow$ regular consistency.

Quindi la consistenza atomica è la più forte delle tre: implica entrambe le altre, mentre le altre due non si implicano a vicenda, e nessuna delle due implica quella atomica.

### Perché regular consistency e sequential consistency non sono confrontabili?

- **Un'esecuzione sequenzialmente consistente ma non regolare:** il processo $p_1$ scrive $5$. Dopo che la scrittura si è completata, il processo $p_2$ legge e ottiene $\bot$; un terzo processo $p_3$ legge $5$. L'esecuzione non è regolare, perché la lettura di $p_2$ non è concorrente con la scrittura e dovrebbe restituire $5$. È però sequenzialmente consistente: nella sequenza globale `read() → ⊥`, `write(5)`, `read() → 5` ogni lettura restituisce il valore giusto, e nessun ordine locale è violato, perché le tre operazioni appartengono a tre processi diversi. La sequenza è diversa da ciò che è avvenuto nel tempo reale, ma questo è ammesso.
- **Un'esecuzione regolare ma non sequenzialmente consistente:** il processo $p_0$ scrive $5$. Durante la scrittura il processo $p_1$ esegue due letture una dopo l'altra: la prima restituisce $5$, la seconda restituisce $\bot$. L'esecuzione è regolare, perché entrambe le letture sono concorrenti con la scrittura, e ognuna può restituire $\bot$ oppure $5$. Non è sequenzialmente consistente: $G$ deve tenere le due letture di $p_1$ nel loro ordine locale, quindi ci sono solo tre candidate, e falliscono tutte.
  - `write(5)`, `read() → 5`, `read() → ⊥`: la seconda lettura non può restituire $\bot$ dopo la scrittura.
  - `read() → 5`, `write(5)`, `read() → ⊥`: la prima lettura non può restituire $5$ prima della scrittura, e la seconda non può restituire $\bot$ dopo.
  - `read() → 5`, `read() → ⊥`, `write(5)`: la prima lettura non può restituire $5$ prima della scrittura.

### Perché la consistenza atomica è strettamente più forte delle altre due?

Ci sono esecuzioni che sono sia regolari sia sequenzialmente consistenti, e tuttavia non atomiche. Il processo $p_0$ scrive $5$. Il processo $p_1$ esegue tre letture in sequenza, che restituiscono $\bot$, $5$ e $5$; le prime due sono concorrenti con la scrittura. Il processo $p_2$ esegue una lettura, che comincia dopo la fine della seconda lettura di $p_1$, mentre la scrittura è ancora in corso, e che restituisce $\bot$.

- **Regolare:** sì. La lettura di $p_2$ è concorrente con la scrittura, quindi può restituire $\bot$.
- **Sequenzialmente consistente:** sì, con la sequenza globale in cui $p_2$ legge $\bot$, $p_1$ legge $\bot$, $p_0$ scrive $5$, e $p_1$ legge $5$ due volte.
- **Atomica:** no. La seconda lettura di $p_1$ ha restituito $5$, quindi il punto di linearizzazione della scrittura viene prima della fine di quella lettura. La lettura di $p_2$ comincia dopo: il suo punto di linearizzazione viene dopo quello della scrittura, e dovrebbe restituire $5$.

## Composizionalità delle condizioni di consistenza

### Che cosa vuol dire composizionalità per una condizione di consistenza?

Si supponga che un sistema abbia più registri $r_1, r_2, \dots, r_k$, ognuno realizzato in modo indipendente dagli altri (da algoritmi diversi, che scambiano messaggi diversi), e che ogni registro, preso da solo, soddisfi una condizione di consistenza $C$. La condizione $C$ è **composizionale** se questo basta a garantire che anche qualunque esecuzione che usa tutti i registri insieme soddisfi $C$.

In modo più formale, sia un'esecuzione $E$ la sequenza delle operazioni di lettura e di scrittura su un insieme di registri $R$, e sia $E|_{r_i}$ la sequenza delle operazioni di $E$ sul registro $r_i$. La condizione $C$ è composizionale se e solo se: $$\big(\forall r_i \in R: \ C(E|_{r_i}) = \text{True}\big) \iff C(E) = \text{True}$$

### La consistenza regolare e quella atomica sono composizionali?

- **La consistenza atomica (linearizability) è composizionale:** se ogni registro di un sistema è linearizzabile, allora l'intera esecuzione su tutti i registri è linearizzabile.
- **La consistenza regolare è composizionale:** un'esecuzione su un insieme di regular register indipendenti è regolare.

### Perché la sequential consistency non è composizionale?

La sequential consistency **non è composizionale**. Due registri indipendenti $X$ e $Y$ possono essere ognuno sequenzialmente consistente, mentre l'esecuzione che li usa entrambi non lo è.

Si consideri il controesempio classico con due registri ($X$, $Y$) e due processi ($p_0$, $p_1$):

- Il processo $p_0$ esegue `write_X(5)`, poi `write_X(8)`, poi `read_Y() → 8`.
- Il processo $p_1$ esegue `write_Y(8)`, poi `write_Y(5)`, poi `read_X() → 5`.

Prendendo i registri uno alla volta:

1. **Il registro $X$ da solo:** le operazioni sono `write_X(5)`, `write_X(8)` e `read_X() → 5`. Una sequenza valida è `write_X(5)`, `read_X() → 5`, `write_X(8)`, con la lettura messa fra le due scritture. Il registro è sequenzialmente consistente.
2. **Il registro $Y$ da solo:** le operazioni sono `write_Y(8)`, `write_Y(5)` e `read_Y() → 8`. Una sequenza valida è `write_Y(8)`, `read_Y() → 8`, `write_Y(5)`. Il registro è sequenzialmente consistente.

Prendendo i due registri insieme:

- Per restituire $8$, `read_Y() → 8` deve stare dopo `write_Y(8)` e prima di `write_Y(5)`.
- Per restituire $5$, `read_X() → 5` deve stare dopo `write_X(5)` e prima di `write_X(8)`.
- L'ordine locale di $p_0$ richiede `write_X(8)` prima di `read_Y() → 8`.
- L'ordine locale di $p_1$ richiede `write_Y(5)` prima di `read_X() → 5`.

Mettendo in fila i quattro vincoli si ottiene un ciclo: $$W_X(8) \xrightarrow{\text{ordine di } p_0} R_Y \xrightarrow{\text{valore}} W_Y(5) \xrightarrow{\text{ordine di } p_1} R_X \xrightarrow{\text{valore}} W_X(8)$$

Qui una freccia vuol dire "deve venire prima di", $R_Y$ è la lettura di $Y$ che restituisce $8$, e $R_X$ è la lettura di $X$ che restituisce $5$. Poiché una sequenza non può contenere un ciclo, non esiste alcuna sequenza globale $G$: l'esecuzione composta **non è sequenzialmente consistente**.

È questo il motivo pratico per preferire la consistenza atomica: su un singolo registro un processo non può distinguere un registro sequenzialmente consistente da uno atomico, ma appena si usano più registri insieme, la sequential consistency può andare persa.

## Esercizio: i valori restituiti dalle letture

### Quale esecuzione considera l'esercizio?

Un registro $(1,N)$, che all'inizio contiene $\bot$, è usato da quattro processi. Il processo $p_1$ è lo scrittore: esegue `write(1)`, `write(2)` e `write(3)`, e va in crash durante `write(3)`. Gli altri processi eseguono cinque letture, di cui non sono dati i valori restituiti:

``` L'esecuzione dell'esercizio
p1: ---------[write(1)]----------[  write(2)  ]--[write(3)--X
p2: --------------------------------------------------------------[ read5 ]----->
p3: ---------------[      read2      ]-------[  read3   ]----------------------->
p4: ----------------------[ read1 ]------------[        read4         ]--------->
```

Una parentesi quadra segna l'invocazione o il ritorno di un'operazione, e `X` segna il crash dello scrittore. In particolare:

- `read2` si sovrappone alla fine di `write(1)` e all'inizio di `write(2)`.
- `read1` comincia dopo la fine di `write(1)` e si sovrappone all'inizio di `write(2)`; sta tutta dentro `read2`.
- `read3` comincia prima della fine di `write(2)` e si sovrappone all'inizio di `write(3)`.
- `read4` comincia dopo la fine di `write(2)`, appena prima di `write(3)`, e finisce dopo il crash.
- `read5` comincia dopo il crash, prima della fine di `read4`.

L'esercizio chiede tutti i valori che ogni lettura può restituire, prima se il registro è regolare e poi se è atomico.

### Quali valori possono restituire le letture se il registro è regolare?

- `read1` può restituire $1$ oppure $2$. Comincia dopo la fine di `write(1)`, quindi non può più restituire $\bot$, ed è concorrente con `write(2)`.
- `read2` può restituire $\bot$, $1$ oppure $2$. È concorrente con due scritture, `write(1)` e `write(2)`, e prima della prima delle due il registro contiene $\bot$.
- `read3` può restituire $1$, $2$ oppure $3$. È concorrente con `write(2)` e con `write(3)`, e l'ultima scrittura completata prima di lei è `write(1)`.
- `read4` può restituire $2$ oppure $3$. L'ultima scrittura completata prima di lei è `write(2)`, ed è concorrente con `write(3)`.
- `read5` può restituire $2$ oppure $3$. Lo scrittore è andato in crash durante `write(3)`, quindi questa scrittura non ritorna mai, ed è concorrente con ogni operazione che segue.

### Quali valori possono restituire le letture se il registro è atomico?

In un atomic register i valori restituiti devono anche essere compatibili con una scelta dei punti di linearizzazione. Lo schema da cercare è una scrittura che si sovrappone a due letture che **non sono concorrenti** fra loro: la prima lettura influenza la seconda, perché se la prima restituisce il valore nuovo, il punto di linearizzazione della scrittura è già passato, e la seconda lettura non può restituire un valore più vecchio. Se invece le due letture sono concorrenti, non si influenzano: il punto di linearizzazione della scrittura si può sempre mettere fra i loro punti di linearizzazione, nell'uno o nell'altro ordine.

Applicato a questa esecuzione:

- `read1` e `read2` sono concorrenti: tutte le combinazioni dei loro valori regolari sono possibili.
- `read3` segue sia `read1` sia `read2`, quindi non può restituire un valore più vecchio di quelli che hanno restituito loro. Per esempio, se `read2` restituisce $2$, allora `read3` restituisce $2$ oppure $3$, non $1$.
- Anche `read4` segue `read1` e `read2`, ma i suoi valori regolari, $2$ e $3$, non sono mai più vecchi dei loro. È concorrente con `read3`, quindi le due non si influenzano: `read3` può restituire $3$ mentre `read4` restituisce $2$.
- `read5` segue `read3`: se `read3` restituisce $3$, allora `read5` restituisce $3$. È concorrente con `read4`, che non la vincola. La `write(3)` fallita può avere effetto anche dopo il crash dello scrittore, oppure mai.

Scrivendo i valori nell'ordine (`read1`, `read2`, `read3`, `read4`, `read5`):

- $(1, 2, 2, 3, 3)$ e $(1, 1, 3, 2, 3)$ sono atomiche.
- $(1, 2, 1, 2, 2)$ è regolare ma non atomica: `read3` restituisce $1$ dopo che `read2` ha restituito $2$.
- $(1, 1, 3, 3, 2)$ è regolare ma non atomica: `read5` restituisce $2$ dopo che `read3` ha restituito $3$.
