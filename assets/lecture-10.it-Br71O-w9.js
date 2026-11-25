const e=`## Complessità in spazio dei vector clock

### La dimensione dei messaggi del Waiting Causal Broadcast è costante rispetto al numero $m$ di messaggi inviati nel sistema?

Il Waiting Causal Broadcast della lezione precedente scambia la dimensione dei messaggi con l'attesa: invece di tutta la sua storia causale, un messaggio porta con sé un vettore. La dimensione di questo vettore, però, non è costante rispetto alla storia dell'esecuzione. Il numero di componenti è fisso, $N$ (il numero di processi del sistema, $|\\Pi| = N$), ma l'intero contenuto in ogni componente $V[i]$ cresce man mano che il processo $p_i$ invia messaggi in broadcast.

Per scrivere in binario un intero $k \\ge 1$ servono $\\lceil \\log_2(k + 1) \\rceil$ bit. Se il processo $p_i$ ha inviato $m_i$ messaggi, codificare il contatore $m_i$ richiede circa $\\log_2 m_i$ bit. Di conseguenza, per un vettore $V$ di $N$ componenti, la dimensione totale del vettore attaccato a ogni messaggio è:

$$S_{\\text{vector}} = \\sum_{i=1}^{N} \\lceil \\log_2(V[i] + 1) \\rceil = O\\left(N \\log m_{\\max}\\right)$$

dove $m_{\\max} = \\max_{i} V[i]$ è il numero massimo di messaggi inviati da un singolo processo fino a quel punto dell'esecuzione.

La dimensione del vettore non dipende affatto dal contenuto dei messaggi (nell'algoritmo No-Waiting, invece, dentro la storia viaggiano i messaggi stessi), ma dipende, in modo logaritmico, dal numero $m$ di messaggi dell'esecuzione. Quindi i vettori non possono occupare $O(1)$ bit per messaggio: una qualche dipendenza dall'esecuzione non si può evitare. Una crescita logaritmica, $O(\\log m)$, è comunque un limite molto buono, rispetto alla crescita illimitata degli algoritmi che inviano la storia (come il No-Waiting Causal Broadcast, dove a ogni messaggio è attaccata l'intera storia dei messaggi).

## Total order broadcast (atomic broadcast)

### Perché il causal order broadcast non basta a mantenere coerenti le repliche, e perché serve il total order broadcast?

Il causal order broadcast garantisce che i messaggi legati da una relazione causale siano consegnati nello stesso ordine relativo da tutti i processi. Non pone però alcun vincolo sull'ordine di consegna dei messaggi concorrenti ($m_1 \\parallel m_2$). Se due operazioni concorrenti non commutano, consegnarle in ordini diversi su repliche diverse fa divergere gli stati in modo definitivo.

Si consideri l'esempio alla lavagna di un'applicazione bancaria in cui il saldo di un conto è replicato su due server, $p_1$ e $p_2$. Il saldo iniziale su entrambe le repliche è $v_0 = 100$. Due client emettono due operazioni concorrenti, senza alcuna relazione causale fra loro:

- **Operazione A** (emessa dal client 1): deposito di 20 euro ($m_A = \\text{Deposit}(20)$).
- **Operazione B** (emessa dal client 2): aggiunta del 10% di interessi ($m_B = \\text{Interest}(10\\%)$).

Poiché $m_A$ e $m_B$ sono concorrenti ($m_A \\parallel m_B$), un causal order broadcast permette a $p_1$ di consegnare $m_A$ seguito da $m_B$, mentre $p_2$ consegna $m_B$ seguito da $m_A$.

- Sulla replica $p_1$:
  1. $v \\leftarrow 100 + 20 = 120$
  2. $v \\leftarrow 120 + (120 \\times 0.10) = 132$
- Sulla replica $p_2$:
  1. $v \\leftarrow 100 + (100 \\times 0.10) = 110$
  2. $v \\leftarrow 110 + 20 = 130$

Alla fine dell'esecuzione la replica $p_1$ ha un saldo di 132, mentre la replica $p_2$ ha un saldo di 130. Poiché aggiungere una somma e aggiungere una percentuale non commutano ($\\text{Interest}(10\\%) \\circ \\text{Deposit}(20) \\neq \\text{Deposit}(20) \\circ \\text{Interest}(10\\%)$), lo stato del sistema è incoerente, anche se il causal order broadcast è stato rispettato. Con operazioni commutative (due depositi, per esempio) le repliche arriverebbero allo stesso stato qualunque sia l'ordine di consegna; purtroppo la maggior parte delle operazioni reali non commuta.

Per mantenere coerenti le repliche di una macchina a stati che esegue operazioni non commutative, il sistema deve usare un total order broadcast, che mostra a ogni replica esattamente la stessa sequenza di messaggi. È noto anche come atomic broadcast: alcuni libri usano un nome e altri l'altro, per la stessa cosa.

### Quali sono la definizione e la specifica del total order broadcast?

Il total order broadcast (o atomic broadcast) è un'astrazione di comunicazione con gli eventi $\\text{to-Broadcast}(m)$ e $\\text{to-Deliver}(p_i, m)$. Aggiunge alle proprietà del reliable broadcast una proprietà di ordine totale: i processi sono d'accordo non solo sull'insieme dei messaggi che consegnano, ma anche sull'ordine in cui li consegnano.

Le proprietà che definiscono il total order broadcast (regolare) sono:

- **TOB1 (validity):** se un processo corretto $p_i$ invia in broadcast un messaggio $m$, allora $p_i$ prima o poi consegna $m$.
- **TOB2 (no duplication):** nessun messaggio $m$ è consegnato più di una volta.
- **TOB3 (no creation):** se un processo consegna un messaggio $m$ con mittente $p_j$, allora $m$ è stato inviato in broadcast in precedenza da $p_j$.
- **TOB4 (agreement):** se un messaggio $m$ è consegnato da un processo corretto, allora $m$ prima o poi è consegnato da ogni processo corretto.
- **TOB5 (total order):** siano $m_1$ e $m_2$ due messaggi qualunque, e siano $p_i$ e $p_j$ due processi corretti qualunque che li consegnano entrambi. Se $p_i$ consegna $m_1$ prima di $m_2$, allora $p_j$ consegna $m_1$ prima di $m_2$.

Realizzare questa astrazione richiede di risolvere il consenso, quindi l'algoritmo è rimandato a dopo lo studio del consenso.

### Che relazione c'è fra l'ordine totale, l'ordine FIFO e l'ordine causale?

L'ordine totale è ortogonale all'ordine FIFO e all'ordine causale:

- Reliable broadcast + ordine totale = atomic broadcast.
- FIFO broadcast + ordine totale = FIFO atomic broadcast.
- Causal broadcast + ordine totale = causal atomic broadcast.

L'ordine totale garantisce che tutti i processi siano d'accordo su un'unica sequenza di consegne per tutti i messaggi, ma questa sequenza può essere una qualunque: da solo, l'ordine totale non impone né l'ordine FIFO né l'ordine causale, a meno che non sia combinato esplicitamente con quelle proprietà. Per esempio, un atomic broadcast potrebbe consegnare due messaggi $m_1$ e $m_2$, inviati in quest'ordine dallo stesso processo, nell'ordine inverso ($m_2$ prima di $m_1$) su ogni processo del sistema: un'esecuzione così soddisfa l'ordine totale (perché ogni processo vede $m_2$ prima di $m_1$), ma viola l'ordine FIFO.

### Quali messaggi sono ordinati dal total order broadcast e non dal causal broadcast?

I **messaggi concorrenti** ($m_1 \\parallel m_2$). Per due messaggi legati da una relazione causale ($m_1 \\to m_2$), il causal order broadcast obbliga già a consegnare $m_1$ prima di $m_2$. I messaggi concorrenti non hanno alcuna dipendenza causale, quindi il causal broadcast lascia che processi diversi li consegnino in ordini diversi. In un causal atomic broadcast la proprietà di ordine totale toglie questa libertà, imponendo un'unica sequenza anche ai messaggi concorrenti. Allo stesso modo, rispetto al FIFO broadcast, ciò che l'ordine totale aggiunge è l'ordine relativo dei messaggi inviati da mittenti diversi: l'ordine dei messaggi dello stesso mittente è già fissato dal FIFO.

### Perché si chiama atomic, e che cos'è un taglio logico?

Il broadcast si chiama atomic perché, da un punto di vista logico, ogni messaggio è consegnato come da un'azione indivisibile che avviene nello stesso istante su ogni processo. Le consegne dello stesso messaggio possono avvenire in tempi fisici diversi su processi diversi, ma nel tempo logico, l'unico tempo che esiste in un sistema distribuito, coincidono: c'è l'istante del primo messaggio su ogni processo, poi l'istante del secondo messaggio su ogni processo, e così via. Ognuno di questi istanti si può disegnare come un **taglio logico** dell'esecuzione, una linea che attraversa le linee temporali di tutti i processi in corrispondenza della consegna dello stesso messaggio: prima di ogni taglio tutti i processi hanno consegnato esattamente gli stessi messaggi, nello stesso ordine.

In linea di principio un atomic broadcast si potrebbe costruire sulla mutua esclusione (si prende il lock, si invia in broadcast, si aspetta che tutti abbiano ricevuto il messaggio, si rilascia il lock), al prezzo di molti messaggi e di serie difficoltà quando il processo che tiene il lock va in crash. Il corso usa invece il consenso.

## Causal delivery: due esercizi del libro

### Come si confronta la proprietà di causal delivery con una formulazione più debole?

L'Esercizio 3.11 del libro chiede di confrontare la proprietà di causal delivery CRB5 del Module 3.9 con una proprietà alternativa, che qui si chiama $P_1$:

- **Causal delivery (CRB5):** per ogni messaggio $m_1$ che ha potenzialmente causato un messaggio $m_2$, cioè $m_1 \\to m_2$, nessun processo consegna $m_2$ senza aver già consegnato $m_1$.
- **Proprietà alternativa ($P_1$):** se un processo consegna entrambi i messaggi $m_1$ e $m_2$, e $m_1 \\to m_2$, allora il processo deve consegnare $m_1$ prima di $m_2$.

### CRB5 e $P_1$ sono equivalenti, oppure una implica l'altra?

Le due proprietà **non** sono equivalenti. CRB5 implica $P_1$, ma $P_1$ non implica CRB5.

Il motivo sta nella struttura di $P_1$, che va letta con attenzione: è un'implicazione la cui premessa ha due parti, "il processo consegna sia $m_1$ sia $m_2$" e "$m_1 \\to m_2$". Se un processo non consegna entrambi i messaggi, la premessa è falsa e la proprietà non chiede nulla.

Per vedere la differenza, si consideri un'esecuzione con tre messaggi tali che $m_0 \\to m_1 \\to m_2$. Il processo $p_0$ consegna $m_0$, $m_1$ e $m_2$, in quest'ordine. Il processo $p_1$ consegna $m_0$ e $m_2$, ma non consegna mai $m_1$.

- **Secondo $P_1$:** la premessa richiede che $p_1$ consegni **entrambi** i messaggi $m_1$ e $m_2$. Poiché $p_1$ non consegna mai $m_1$, la premessa è falsa per questa coppia di messaggi, e $P_1$ è soddisfatta a vuoto. I due messaggi che $p_1$ consegna sono nell'ordine giusto.
- **Secondo CRB5:** il processo $p_1$ ha consegnato $m_2$ senza aver consegnato $m_1$, benché $m_1 \\to m_2$. Questo viola CRB5.

Poiché $P_1$ permette a un processo di saltare il messaggio $m_1$ e di consegnare comunque $m_2$, ammette un insieme strettamente più grande di esecuzioni: è strettamente più debole di CRB5.

### Un best-effort broadcast può soddisfare la causal delivery senza soddisfare l'agreement del reliable broadcast?

È l'Esercizio 3.12 del libro. La domanda è se possa esistere un algoritmo che ha le tre proprietà del best-effort broadcast (validity, no duplication, no creation) e la causal delivery, ma non la proprietà di agreement del reliable broadcast. Detto al contrario: le tre proprietà del best-effort broadcast, insieme alla causal delivery, implicano l'agreement?

L'intuizione dietro la soluzione del libro è che la implichino. Si supponga che un processo corretto consegni un messaggio $m_1$ il cui mittente è guasto, e poi invii in broadcast un messaggio $m_2$. Per la validity del best-effort broadcast ogni processo corretto consegna $m_2$; poiché $m_1 \\to m_2$, per la causal delivery ogni processo corretto deve prima consegnare $m_1$. Quindi ogni processo corretto consegna $m_1$, e l'agreement vale.

A lezione questa conclusione è stata mostrata **non corretta**, perché nulla obbliga il processo corretto a inviare $m_2$: un algoritmo di broadcast non invia messaggi spontaneamente, è lo strato superiore a decidere se inviare. Il controesempio è un'esecuzione con quattro processi $p_0, p_1, p_2, p_3$:

1. Il processo $p_3$ invia in broadcast $m_1$ e va in crash mentre lo sta inviando: solo $p_2$ riceve il messaggio.
2. Il processo $p_2$, che è corretto, consegna $m_1$.
3. Il processo $p_2$ non invia mai alcun messaggio, e nel sistema non viene inviato nessun altro messaggio.
4. I processi $p_0$ e $p_1$, che sono corretti, non consegnano mai $m_1$.

Valutazione delle proprietà:

- **Validity del best-effort broadcast:** soddisfatta. Il mittente $p_3$ è guasto, e la validity vincola solo i messaggi inviati da processi corretti.
- **No duplication e no creation:** soddisfatte (nessun messaggio è consegnato due volte, e nessun messaggio è inventato).
- **Causal delivery:** soddisfatta. C'è un solo messaggio, quindi nessun ordine causale può essere violato.
- **Agreement del reliable broadcast:** **violata**. Il processo corretto $p_2$ ha consegnato $m_1$, mentre i processi corretti $p_0$ e $p_1$ non lo consegnano mai.

Quindi un algoritmo può soddisfare validity, no duplication e no creation del best-effort broadcast insieme alla causal delivery, e non soddisfare comunque l'agreement: best-effort broadcast più causal delivery non implica il reliable broadcast. L'argomento del libro funziona solo per le esecuzioni in cui il processo che ha consegnato $m_1$ in seguito invia qualcosa.

## L'astrazione di registro distribuito

### Che cos'è un registro distribuito, e come simula una memoria condivisa su una rete a scambio di messaggi?

Un registro distribuito è un'astrazione di memoria condivisa costruita sopra una rete a scambio di messaggi. Dà ai processi l'illusione di un'unica variabile condivisa, come la memoria condivisa dai processi di una singola macchina, a cui si accede con operazioni di lettura e di scrittura: ogni processo esegue un pezzo di codice che tiene una copia locale della variabile e scambia messaggi per tenere sincronizzate le copie.

I processi interagiscono con un registro distribuito attraverso due operazioni:

- **Operazione di scrittura $\\text{Write}(v)$:** invocata da un processo per memorizzare un valore $v$ nel registro.
- **Operazione di lettura $\\text{Read}()$:** invocata da un processo per ottenere il valore memorizzato in quel momento nel registro. Una lettura non modifica il contenuto del registro.

### Qual è la struttura delle operazioni di lettura e di scrittura?

Ogni operazione su un registro richiede tempo: non è istantanea. Un'operazione $O$ è delimitata da due eventi, ognuno dei quali avviene in un singolo punto indivisibile del tempo:

1. **Evento di invocazione $\\text{inv}(O)$:** il momento in cui un processo comincia l'operazione ($\\text{write}(v)$ oppure $\\text{read}()$).
2. **Evento di ritorno (conferma) $\\text{ret}(O)$:** il momento in cui l'operazione si completa e dà il suo risultato al processo che l'ha invocata (una semplice conferma per una scrittura, il valore letto per una lettura).

Un'operazione è **in corso** (pending) durante l'intervallo fra la sua invocazione e il suo ritorno, ed è **completa** quando entrambi gli eventi sono avvenuti. Se un processo va in crash mentre una sua operazione è in corso, l'operazione non ritorna mai: è un'operazione **fallita**, e il suo evento di ritorno si modella come se avvenisse a $t = \\infty$.

### Quali sono le ipotesi sui registri distribuiti?

- **Accesso sequenziale di ogni processo:** le operazioni invocate dallo stesso processo $p_i$ sono sequenziali. Un processo $p_i$ non invoca mai una nuova operazione $O_2$ mentre la sua operazione precedente $O_1$ è ancora in corso. Processi diversi, invece, possono invocare operazioni nello stesso momento.
- **Valori interi:** per semplicità un registro contiene interi positivi, ed è inizializzato a un valore predefinito $v_0 = 0$ (oppure $\\bot$). Non è una restrizione, perché con i numeri si può codificare qualunque cosa.
- **Valori scritti unici:** ogni scrittura scrive un valore diverso (in pratica lo si ottiene attaccando al valore scritto un numero di sequenza locale o un timestamp).

### Come sono definite la precedenza ($O_1 \\to O_2$) e la concorrenza ($O_1 \\parallel O_2$) per le operazioni su un registro?

La relazione fra due operazioni $O_1$ e $O_2$ dipende solo dai loro intervalli nel tempo fisico:

- **Precedenza ($O_1 \\to O_2$):** $O_1$ precede $O_2$ se e solo se il ritorno di $O_1$ avviene prima dell'invocazione di $O_2$: $$\\text{ret}(O_1) < \\text{inv}(O_2)$$
- **Concorrenza ($O_1 \\parallel O_2$):** $O_1$ e $O_2$ sono concorrenti se nessuna delle due precede l'altra, cioè se i loro intervalli si sovrappongono nel tempo: $$\\text{inv}(O_1) \\le \\text{ret}(O_2) \\quad \\text{and} \\quad \\text{inv}(O_2) \\le \\text{ret}(O_1)$$

### Qual è la relazione fra un'operazione fallita e le operazioni che la seguono?

Se un processo va in crash mentre esegue un'operazione $O_1$, l'operazione non produce mai il suo evento di ritorno ($\\text{ret}(O_1) = \\infty$). Quindi qualunque operazione $O_2$ invocata dopo l'invocazione di $O_1$ soddisfa $\\text{inv}(O_2) < \\text{ret}(O_1)$: un'operazione fallita $O_1$ è **concorrente** con tutte le operazioni invocate dopo di lei, per sempre.

### Perché un registro ha bisogno di una semantica, e quali semantiche considera il corso?

Prima di realizzare un registro bisogna dire che cosa deve restituire una lettura. Se gli accessi sono **strettamente serializzati**, come con un lock (nessun processo invoca un'operazione mentre l'operazione di un altro processo è ancora in corso), e non ci sono guasti, la risposta è facile: ogni operazione prima o poi termina (liveness), e ogni lettura restituisce l'ultimo valore scritto (safety).

La difficoltà nasce con la concorrenza e con i guasti. Se una lettura si sovrappone a una scrittura, deve restituire il valore vecchio o quello nuovo? E se lo scrittore va in crash nel mezzo di una scrittura, la scrittura resta concorrente con ogni lettura successiva: che cosa possono restituire quelle letture? Una **semantica** (una condizione di consistenza) risponde a queste domande, restringendo l'insieme delle esecuzioni ammesse. Il corso ne considera tre: regular consistency, sequential consistency e linearizability (detta anche atomic consistency). Questa lezione comincia da quella regolare.

### Come si classificano i registri?

I registri si classificano in base al numero di processi a cui è permesso scrivere ($X$) e leggere ($Y$), e si indicano come registri $(X,Y)$:

- **Registro $(1,1)$:** uno scrittore e un lettore. Esattamente un processo $p_w$, noto in anticipo, può scrivere, ed esattamente un processo $p_r$ può leggere.
- **Registro $(1,N)$:** uno scrittore e molti lettori. Esattamente un processo $p_w$, noto in anticipo, può scrivere, e tutti gli $N$ processi possono leggere.
- **Registro $(N,N)$:** molti scrittori e molti lettori. Tutti gli $N$ processi del sistema possono sia leggere sia scrivere.

È importante notare che la coppia $(X,Y)$ dice solo chi può invocare le operazioni, non quanti processi ha il sistema: un registro $(1,1)$ può vivere in un sistema di 100 processi. Tutti i processi partecipano al protocollo (tengono una copia del valore, ripetono e confermano i messaggi), ed è questo che permette al registro di tollerare i guasti: un lettore corretto può completare le sue letture anche se lo scrittore è andato in crash. Chi sia lo scrittore si decide prima che l'algoritmo cominci, come i rank dei processi; se lo scrittore va in crash, nessuno prende il suo posto.

## La semantica del regular register

### Quali sono la specifica e la semantica di un regular register $(1,N)$?

Un regular register $(1,N)$ è definito da due proprietà:

1. **Termination (liveness):** se un processo corretto invoca un'operazione, allora l'operazione prima o poi si completa.
2. **Validity (safety):** una lettura che non è concorrente con una scrittura restituisce l'ultimo valore scritto; una lettura che è concorrente con una scrittura restituisce l'ultimo valore scritto oppure il valore scritto in concorrenza. In altre parole, un'operazione di lettura $R$ restituisce:
  - il valore scritto dall'ultima scrittura $W$ che precede $R$ ($W \\to R$), oppure
  - il valore scritto da una scrittura $W_{\\text{conc}}$ che è concorrente con $R$ ($W_{\\text{conc}} \\parallel R$).

In un regular register $(1,N)$, se nessuna scrittura è concorrente con una lettura $R$, allora $R$ **deve** restituire il valore della scrittura più recente completata prima dell'inizio di $R$ (o il valore iniziale, se non è ancora stato scritto nulla). Se una o più scritture si sovrappongono a $R$, allora $R$ può restituire sia il valore della scrittura completata più recente sia uno qualunque dei valori che vengono scritti in concorrenza.

**Esecuzioni valutate secondo la semantica regolare:**

**Traccia 1:**

- $W(5)$ si completa.
- In seguito viene invocata $R()$, che restituisce $5$.
- **Valutazione:** valida. La lettura restituisce $5$, che è il valore dell'ultima scrittura che la precede ($W(5) \\to R()$). Se la lettura restituisse il valore iniziale $0$, l'esecuzione non sarebbe regolare.

**Traccia 2:**

- $W(5)$ si completa.
- In seguito viene invocata $W(8)$, che è ancora in corso.
- In concorrenza con $W(8)$ viene invocata una lettura $R()$, che restituisce $5$.
- **Valutazione:** valida, perché $R() \\parallel W(8)$. Per la validity regolare, $R()$ può restituire sia l'ultimo valore scritto prima di lei ($5$) sia il valore concorrente ($8$).

**Traccia 3:**

- $W(5)$ si completa.
- Viene invocata $W(8)$, che è concorrente con due letture in sequenza: $R_1()$ seguita da $R_2()$.
- $R_1()$ restituisce $8$.
- $R_2()$ restituisce $5$.
- **Valutazione:** valida secondo la semantica regolare. Sia $R_1()$ sia $R_2()$ si sovrappongono a $W(8)$, quindi ognuna delle due, indipendentemente dall'altra, può restituire $5$ oppure $8$. (Questa traccia è valida per un regular register, ma non per un atomic register, che non permette a una lettura di restituire un valore più vecchio di quello restituito da una lettura che la precede.)

**Traccia 4:**

- $W(5)$ si completa.
- Lo scrittore invoca $W(8)$ e va in crash prima che la scrittura ritorni.
- Da quel momento ogni lettura è concorrente con $W(8)$.
- **Valutazione:** ogni lettura può restituire $5$ oppure $8$, per sempre. Un processo può leggere sempre $5$ mentre un altro legge sempre $8$, oppure lo stesso processo può vedere i due valori alternarsi. Poiché c'è un solo scrittore, nessuna scrittura successiva fisserà mai il valore.

## Read-One Write-All: un regular register nel modello fail-stop

### Come realizza l'algoritmo Read-One Write-All (ROWA) un regular register $(1,N)$ nel modello fail-stop?

L'algoritmo ROWA lavora nel modello fail-stop: $N$ processi che possono andare in crash, perfect point-to-point link, best-effort broadcast e un perfect failure detector ($\\mathcal{P}$).

L'idea è che ogni processo tenga una copia locale del registro, e che l'unico scrittore debba tenere coerenti le copie:

- **Operazione di scrittura (write all):** lo scrittore $p_w$ invia in broadcast il nuovo valore a **tutti** i processi; ogni processo che lo riceve aggiorna la sua copia locale e rimanda indietro una conferma. La scrittura ritorna solo quando lo scrittore ha ricevuto una conferma da ogni processo che non considera in crash (cioè che $\\mathcal{P}$ non ha rilevato).
- **Operazione di lettura (read one):** un qualunque lettore $p_i$ legge semplicemente la sua variabile locale \`val\` e la restituisce subito, senza inviare alcun messaggio.

Il punto delicato è quando la scrittura può ritornare. Se ritornasse subito dopo il broadcast, o appena lo scrittore consegna il proprio messaggio, un processo che non ha ancora ricevuto il valore potrebbe leggere il valore vecchio **dopo** la fine della scrittura, e questo non è regolare. Aspettare le conferme di tutti i processi che non sono andati in crash spinge la fine della scrittura dopo il momento in cui tutte quelle copie sono state aggiornate. Il perfect failure detector è ciò che impedisce allo scrittore di aspettare per sempre un processo che è andato in crash.

\`\`\` Read-One Write-All: regular register (1, N)
Module:
  Name: ReadOneWriteAllRegularRegister (rowa)

Events:
  Request: < rowa, Write | v >
  Indication: < rowa, WriteReturn >
  Request: < rowa, Read >
  Indication: < rowa, ReadReturn | v >

upon event < rowa, Init > do
  val := ⊥;
  correct := Π;
  writeset := ∅;

upon event < P, Crash | p_j > do
  correct := correct \\ {p_j};

upon event < rowa, Write | v > do
  trigger < beb, Broadcast | [WRITE, v] >;

upon event < beb, Deliver | p_w, [WRITE, v] > do
  val := v;
  trigger < pl, Send | p_w, [ACK] >;

upon event < pl, Deliver | p_j, [ACK] > do
  writeset := writeset ∪ {p_j};

upon correct ⊆ writeset do
  writeset := ∅;
  trigger < rowa, WriteReturn >;

upon event < rowa, Read > do
  trigger < rowa, ReadReturn | val >;
\`\`\`

**Spiegazione riga per riga dello pseudo-codice:**

- \`Init\`: inizializza la copia locale \`val\` del registro al valore iniziale $\\bot$. L'insieme \`correct\` contiene tutti i processi $\\Pi$. L'insieme \`writeset\`, che raccoglie le conferme, è vuoto; lo usa solo lo scrittore.
- \`upon event < P, Crash | p_j >\`: scatta quando il perfect failure detector $\\mathcal{P}$ rileva che il processo $p_j$ è andato in crash. Il processo $p_j$ viene tolto definitivamente dall'insieme \`correct\`.
- \`upon event < rowa, Write | v >\`: eseguito solo dallo scrittore $p_w$, quando comincia una scrittura del valore $v$. Lo scrittore invia il messaggio \`[WRITE, v]\` a tutti i processi, sé stesso compreso, con il best-effort broadcast.
- \`upon event < beb, Deliver | p_w, [WRITE, v] >\`: eseguito da ogni processo quando riceve la richiesta di scrittura di $p_w$. Il processo aggiorna la sua copia locale, \`val := v\`, e rimanda subito un \`ACK\` a $p_w$ sul perfect link.
- \`upon event < pl, Deliver | p_j, [ACK] >\`: eseguito dallo scrittore $p_w$ quando riceve la conferma di $p_j$. Lo scrittore aggiunge $p_j$ a \`writeset\`.
- \`upon correct ⊆ writeset\`: quando ogni processo in \`correct\` ha confermato, la scrittura è completa: lo scrittore svuota \`writeset\` e genera \`< rowa, WriteReturn >\`. La condizione viene rivalutata ogni volta che uno dei due insiemi cambia, quindi la scrittura si completa anche quando l'ultimo processo mancante viene rilevato come in crash.
- \`upon event < rowa, Read >\`: eseguito da un qualunque processo che comincia una lettura. Il processo restituisce subito il suo valore locale \`val\` con \`< rowa, ReadReturn | val >\`, senza scambiare messaggi.

### Qual è la complessità dell'algoritmo ROWA per il regular register?

- **Operazione di scrittura:**
  - **Complessità in messaggi:** al più $2N$ messaggi per scrittura: $N$ messaggi \`WRITE\` per il broadcast e al più $N$ messaggi \`ACK\`.
  - **Complessità in tempo:** 2 ritardi di messaggio (uno perché il valore raggiunga tutti, uno perché tornino le conferme).
- **Operazione di lettura:**
  - **Complessità in messaggi:** $0$ messaggi (la lettura è puramente locale).
  - **Complessità in tempo:** $0$ ritardi di messaggio.
- **Resilienza:** l'algoritmo tollera il crash di un numero qualunque di processi. Finché un processo è vivo, si comporta correttamente: se è lo scrittore, non aspetta le conferme dei processi rilevati come in crash; se è un lettore, legge la sua copia locale.

### Che cosa succede se lo scrittore non svuota l'insieme delle conferme alla fine di una scrittura?

Se si toglie la riga \`writeset := ∅\`, quando comincia una nuova scrittura $W_2(v_2)$ l'insieme \`writeset\` contiene ancora i processi che hanno confermato la scrittura precedente $W_1(v_1)$. La condizione \`correct ⊆ writeset\` è quindi già vera, e lo scrittore ritorna da $W_2(v_2)$ immediatamente, prima che qualunque altro processo abbia ricevuto $v_2$. Una lettura $R()$ invocata da un lettore $p_i$ dopo il ritorno di $W_2(v_2)$ ($W_2 \\to R$) può allora trovare nella sua \`val\` locale il vecchio valore $v_1$, e restituire $v_1$ invece di $v_2$: questo viola la validity del regular register. Svuotare l'insieme a ogni scrittura è necessario per la correttezza dell'algoritmo, il cui trucco sta tutto nello spingere la fine di una scrittura dopo il momento in cui tutti hanno visto il valore.
`;export{e as default};
