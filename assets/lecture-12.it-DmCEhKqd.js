const e=`## Atomic register: astrazione e specifica

### Che cos'è un atomic register $(1,N)$?

Un atomic register $(1,N)$ è un'astrazione di memoria condivisa per un sistema di $N$ processi $\\Pi = \\{p_0, p_1, \\dots, p_{N-1}\\}$, in cui esattamente un processo designato $p_w \\in \\Pi$ è lo scrittore, mentre tutti gli $N$ processi (scrittore compreso) possono leggere. Il registro contiene un valore (per semplicità un intero positivo, inizializzato a un valore predefinito $v_0 = 0$ oppure $\\bot$) e offre due operazioni:

- \`write(v)\`: invocata solo dallo scrittore $p_w$, per cambiare il valore memorizzato in $v$.
- \`read()\`: invocata da un qualunque processo $p_i \\in \\Pi$, per ottenere il valore memorizzato in quel momento nel registro.

Come per il regular register, ogni operazione $O$ è delimitata da due eventi: un'invocazione $\\text{inv}(O)$ e un ritorno $\\text{ret}(O)$. Un'operazione è **in corso** (pending) fra i due; se il processo va in crash mentre l'operazione è in corso, l'operazione è **fallita**, e non ritorna mai.

### Quali proprietà specificano un atomic register $(1,N)$?

Un atomic register $(1,N)$ è un regular register con una proprietà in più:

- **Termination (liveness):** se un processo corretto invoca un'operazione, allora l'operazione prima o poi ritorna.
- **Validity (safety):** una lettura restituisce l'ultimo valore scritto, oppure il valore che viene scritto in concorrenza.
- **Ordering (safety):** se una lettura restituisce un valore $v_2$ dopo che una lettura che la precede (sullo stesso processo o su un altro) ha restituito un valore $v_1$, allora $v_1$ non è stato scritto dopo $v_2$.

### Che relazione c'è fra la proprietà di ordering e i punti di linearizzazione?

Con un solo scrittore, la proprietà di ordering è equivalente alla definizione di atomicità data con i **punti di linearizzazione**: ogni operazione completata $O$ (ed eventualmente alcune di quelle fallite) sembra avere effetto in modo istantaneo in un punto del tempo, il suo punto di linearizzazione $\\text{LP}(O)$, dentro l'intervallo $[\\text{inv}(O), \\text{ret}(O)]$.

Se un'operazione $O_1$ si completa prima che un'operazione $O_2$ cominci ($\\text{ret}(O_1) < \\text{inv}(O_2)$), i loro punti di linearizzazione sono nello stesso ordine: $\\text{LP}(O_1) < \\text{LP}(O_2)$. Ogni lettura restituisce il valore della scrittura più recente nell'ordine dei punti di linearizzazione.

La definizione con i punti di linearizzazione è la più generale: il libro usa la proprietà di ordering per i registri con un solo scrittore, e torna ai punti di linearizzazione per i registri con molti scrittori.

### Come distinguono le esecuzioni fra semantica regolare, sequenziale e atomica?

Si considerino alcune esecuzioni con lo scrittore $p_1$ e i lettori $p_2, p_3$:

- **Esecuzione A (regolare, non atomica):**
  - Lo scrittore $p_1$ esegue \`write(5)\` e poi \`write(6)\`.
  - In concorrenza con \`write(6)\`, il lettore $p_2$ esegue due letture una dopo l'altra: la prima restituisce $6$, la seconda restituisce $5$.
  - **Analisi:** entrambe le letture sono concorrenti con \`write(6)\`, quindi l'esecuzione è **regolare**. Poiché la prima lettura restituisce $6$, il punto di linearizzazione di \`write(6)\` viene prima della fine di quella lettura ($\\text{LP}(\\text{write}(6)) < \\text{LP}(\\text{read}_1) < \\text{LP}(\\text{read}_2)$), e la seconda lettura dovrebbe vedere $6$ o un valore più recente. La proprietà di ordering è violata: l'esecuzione **non è atomica**.
- **Esecuzione B (atomica):**
  - Lo scrittore $p_1$ esegue \`write(5)\` e poi \`write(6)\`.
  - Il lettore $p_2$ esegue tre letture in sequenza, che restituiscono $5$, $6$ e $6$.
  - **Analisi:** i valori restituiti non tornano mai indietro, e dentro ogni operazione si può scegliere un punto di linearizzazione. L'esecuzione è **atomica** (e quindi **regolare**).
- **Esecuzione C (una violazione fra due processi):**
  - Lo scrittore $p_1$ esegue \`write(5)\` e poi \`write(6)\`.
  - Il lettore $p_2$ esegue una lettura che restituisce $6$, e la completa.
  - Poi il lettore $p_3$ invoca una lettura, che restituisce $5$.
  - **Analisi:** la proprietà di ordering riguarda letture che si precedono, anche quando appartengono a processi diversi. Poiché la lettura di $p_2$ precede la lettura di $p_3$ e restituisce $6$, la lettura di $p_3$ non può restituire $5$: l'esecuzione **non è atomica**.
- **Esecuzione D (letture concorrenti):**
  - Lo scrittore $p_1$ invoca \`write(5)\`.
  - I lettori $p_2$ e $p_3$ eseguono due letture concorrenti durante \`write(5)\`: $p_2$ restituisce $5$, mentre $p_3$ restituisce $0$ (il valore iniziale).
  - **Analisi:** poiché le due letture sono concorrenti fra loro e con \`write(5)\`, il punto di linearizzazione della scrittura si può mettere fra quello della lettura di $p_3$ e quello della lettura di $p_2$. L'esecuzione è **atomica**.
- **Esecuzione E (una scrittura fallita):**
  - Lo scrittore $p_1$ invoca \`write(5)\` e va in crash prima che la scrittura ritorni.
  - Se in seguito un lettore legge e ottiene $0$, l'esecuzione è **atomica** e regolare: la scrittura fallita è concorrente con ogni lettura successiva, ed è come se non avesse ancora avuto effetto.
  - Se il lettore $p_2$ ottiene $5$ e dopo di lui il lettore $p_3$ ottiene $0$, l'esecuzione è **regolare** ma **non atomica**: la proprietà di ordering è violata.
  - **Analisi:** con una scrittura fallita, in un atomic register o nessuna lettura restituisce $5$, oppure, una volta che una lettura ha restituito $5$, tutte le letture che la seguono restituiscono $5$. Il punto di linearizzazione di un'operazione fallita può anche venire dopo il crash del processo che l'ha invocata.
- **Esecuzione F (solo sequenzialmente consistente):**
  - Lo scrittore $p_1$ esegue \`write(5)\`, e qualche tempo dopo \`write(6)\`.
  - Fra le due scritture, il lettore $p_2$ esegue una lettura che restituisce $6$.
  - **Analisi:** la lettura restituisce un valore che non è ancora stato scritto e che non viene scritto in quel momento, quindi l'esecuzione **non è regolare**, e perciò **non è atomica**. È **sequenzialmente consistente**, con la sequenza globale \`write(5)\`, \`write(6)\`, \`read() → 6\`.

## Fase 1: da un regular register a un atomic register (1,1)

### Quale esecuzione di un regular register viola l'atomicità quando c'è un solo lettore?

Gli atomic register si costruiscono prima usando solo regular register, senza scambiare messaggi: i processi comunicano soltanto leggendo e scrivendo i registri sottostanti. La costruzione ha due fasi; la prima produce un atomic register $(1,1)$, con uno scrittore $p_w$ e un lettore $p_r$.

Con un solo lettore, l'unica esecuzione che un regular register ammette e un atomic register vieta è quella in cui il lettore vede un valore nuovo e poi uno vecchio. Si supponga che $p_w$ scriva $v_1 = 5$ e poi $v_2 = 8$. Se il lettore $p_r$ esegue una lettura $R_1$ concorrente con \`write(8)\`, $R_1$ può restituire il valore nuovo $8$. Se poi $p_r$ esegue una seconda lettura $R_2$, ancora concorrente con \`write(8)\`, un regular register permette a $R_2$ di restituire il valore vecchio $5$ (l'ultimo valore scritto prima di \`write(8)\`). Restituire $8$ in $R_1$ e poi $5$ in $R_2$ viola la proprietà di ordering.

### Come fanno i timestamp a trasformare il regular register in un atomic register $(1,1)$?

I valori da soli non dicono quale sia il più recente: un numero è un numero. L'algoritmo, però, è libero di decidere che cosa scrivere nel registro sottostante. Lo scrittore attacca a ogni valore $v$ un timestamp intero crescente $\\mathit{ts}$, e scrive la coppia $(\\mathit{ts}, v)$ in un regular register $(1,N)$ sottostante $\\mathrm{RR}$.

Il lettore $p_r$ tiene in una variabile locale la coppia con il timestamp più alto che ha visto finora. Quando $p_r$ esegue una lettura atomica, legge il regular register sottostante e ottiene una coppia $(\\mathit{ts}', v')$. Se $\\mathit{ts}'$ è maggiore del timestamp memorizzato, $p_r$ sostituisce la coppia memorizzata con quella nuova e restituisce $v'$. Altrimenti (il regular register ha restituito un valore vecchio durante una scrittura concorrente), $p_r$ ignora la coppia e restituisce il valore che ha memorizzato.

### Qual è lo pseudo-codice dell'atomic register $(1,1)$?

\`\`\` Da un regular register (1, N) a un atomic register (1, 1)
Implements:
  (1, 1)-AtomicRegister, instance ooar.
Uses:
  (1, N)-RegularRegister, instance onrr.

upon event < ooar, Init > do
  (ts, val) := (0, ⊥);
  wts := 0;

upon event < ooar, Write | v > do
  wts := wts + 1;
  trigger < onrr, Write | (wts, v) >;

upon event < onrr, WriteReturn > do
  trigger < ooar, WriteReturn >;

upon event < ooar, Read > do
  trigger < onrr, Read >;

upon event < onrr, ReadReturn | (ts', v') > do
  if ts' > ts then
    (ts, val) := (ts', v');
  trigger < ooar, ReadReturn | val >;
\`\`\`

- \`wts\`: tenuto dallo scrittore $p_w$, inizializzato a $0$ e incrementato prima di ogni scrittura, così i timestamp sono strettamente crescenti.
- \`(ts, val)\`: tenuta dal lettore $p_r$, inizializzata a $(0, \\bot)$. Contiene la coppia con il timestamp più alto vista da $p_r$.
- \`< ooar, Write | v >\`: l'invocazione della scrittura atomica. Lo scrittore incrementa \`wts\` e scrive la coppia \`(wts, v)\` sul regular register.
- \`< onrr, WriteReturn >\`: il regular register segnala che la scrittura della coppia si è completata, e la scrittura atomica ritorna.
- \`< ooar, Read >\`: l'invocazione della lettura atomica, che diventa una lettura del regular register.
- \`< onrr, ReadReturn | (ts', v') >\`: il regular register restituisce una coppia. Se \`ts' > ts\`, la coppia memorizzata viene sostituita. In ogni caso il valore restituito allo strato superiore è la \`val\` memorizzata, che nasconde qualunque valore vecchio restituito dal regular register.

### Qual è il costo dell'atomic register $(1,1)$?

L'algoritmo non scambia messaggi propri: il suo costo si conta in operazioni sul regular register sottostante.

- **Scrittura:** esattamente $1$ scrittura sul regular register.
- **Lettura:** esattamente $1$ lettura sul regular register.

## Fase 2: da atomic register (1,1) a un atomic register (1,N)

### Perché non basta un atomic register $(1,1)$ per ogni lettore?

Per passare da $(1,1)$ a $(1,N)$ (uno scrittore $p_w$ e $N$ lettori), la prima idea è dare a ogni lettore un suo atomic register $(1,1)$, con tutti questi registri scritti da $p_w$. Questo non garantisce l'atomicità fra lettori diversi.

Una \`write(v)\` sul registro $(1,N)$ diventa $N$ scritture sui registri $\\mathrm{AR}_1, \\mathrm{AR}_2, \\dots, \\mathrm{AR}_N$, e queste scritture non sono istantanee: si completano in momenti diversi. Se il lettore $p_i$ legge $\\mathrm{AR}_i$ dopo che la scrittura su $\\mathrm{AR}_i$ si è completata, vede il valore nuovo $v$. Se poi il lettore $p_j$ legge $\\mathrm{AR}_j$ mentre la scrittura su $\\mathrm{AR}_j$ è ancora in corso, può vedere il valore vecchio. Ogni registro è atomico, ma la lettura di $p_i$ precede la lettura di $p_j$ e $p_j$ restituisce un valore più vecchio: la proprietà di ordering è violata. Far aspettare allo scrittore tutte le $N$ scritture prima di ritornare non serve, perché il problema nasce prima della fine della scrittura.

### Come fa un lettore che scrive a rendere il registro atomico per tutti i lettori?

Il rimedio sta dalla parte del lettore: quando una lettura ritorna, il valore che restituisce deve essere già visibile a tutti. Quindi ogni lettore **aiuta lo scrittore**, propagando il valore che ha letto prima di ritornare.

La costruzione usa una matrice $N \\times N$ di atomic register $(1,1)$ $\\mathrm{AR}_{r,w}$, in cui il processo $r$ è il lettore e il processo $w$ è lo scrittore. Ogni processo $p_i$ possiede quindi una **riga** di $N$ registri che scrive, $\\{\\mathrm{AR}_{k,i} \\mid k \\in \\Pi\\}$, uno per ogni lettore, e una **colonna** di $N$ registri che legge, $\\{\\mathrm{AR}_{i,k} \\mid k \\in \\Pi\\}$, uno per ogni scrittore. La riga dello scrittore $p_w$ porta i valori scritti sul registro $(1,N)$; le righe degli altri processi servono solo a ripetere i valori che hanno letto.

Quando un processo $p_i$ legge il registro $(1,N)$, procede in due fasi:

1. **Fase 1 (leggere la colonna):** $p_i$ legge tutti i registri della sua colonna, che contengono il valore scritto da $p_w$ e i valori ripetuti dagli altri lettori, e sceglie la coppia $(\\mathit{ts}_{\\max}, v_{\\max})$ con il timestamp più alto.
2. **Fase 2 (scrivere la riga):** prima di restituire $v_{\\max}$, $p_i$ scrive $(\\mathit{ts}_{\\max}, v_{\\max})$ in tutti i registri della sua riga, e aspetta che tutte queste scritture si completino.

Per via della seconda fase, qualunque lettura invocata da un qualunque processo $p_j$ dopo la fine della lettura di $p_i$ trova nella sua colonna, nel registro $\\mathrm{AR}_{j,i}$, un timestamp alto almeno quanto $\\mathit{ts}_{\\max}$.

### Qual è lo pseudo-codice dell'atomic register $(1,N)$ costruito sulla matrice di registri $(1,1)$?

\`\`\` Da atomic register (1, 1) a un atomic register (1, N)
Implements:
  (1, N)-AtomicRegister, instance onar.
Uses:
  (1, 1)-AtomicRegister (multiple instances).

upon event < onar, Init > do
  ts := 0;
  acks := 0;
  writing := FALSE;
  readval := ⊥;
  readlist := [⊥]^N;
  forall q ∈ Π, r ∈ Π do
    Initialize a new instance ooar.q.r of (1, 1)-AtomicRegister
      with writer r and reader q;

upon event < onar, Write | v > do
  ts := ts + 1;
  writing := TRUE;
  forall q ∈ Π do
    trigger < ooar.q.self, Write | (ts, v) >;

upon event < ooar.q.self, WriteReturn > do
  acks := acks + 1;
  if acks = N then
    acks := 0;
    if writing = TRUE then
      trigger < onar, WriteReturn >;
      writing := FALSE;
    else
      trigger < onar, ReadReturn | readval >;

upon event < onar, Read > do
  forall r ∈ Π do
    trigger < ooar.self.r, Read >;

upon event < ooar.self.r, ReadReturn | (ts', v') > do
  readlist[r] := (ts', v');
  if #(readlist) = N then
    (maxts, readval) := highest(readlist);
    readlist := [⊥]^N;
    forall q ∈ Π do
      trigger < ooar.q.self, Write | (maxts, readval) >;
\`\`\`

- \`ooar.q.r\`: il registro della matrice che ha il processo \`q\` come lettore e il processo \`r\` come scrittore. I registri \`ooar.q.self\` sono la riga di un processo, e i registri \`ooar.self.r\` sono la sua colonna. Ogni processo partecipa all'inizializzazione di tutti gli $N^2$ registri, anche di quelli che non legge né scrive, perché un registro è un oggetto distribuito e la sua realizzazione può aver bisogno dell'aiuto di tutti i processi.
- \`ts\`: il timestamp delle scritture, tenuto dall'unico scrittore.
- \`writing\`: un flag che è vero solo sullo scrittore, mentre sta scrivendo. Dice se le scritture che si completano su una riga appartengono a una scrittura oppure alla seconda fase di una lettura.
- \`acks\`: il contatore delle operazioni sui registri $(1,1)$ della riga che sono ritornate.
- \`readlist\`: l'array in cui un lettore memorizza le coppie restituite dagli $N$ registri della sua colonna; \`#(readlist)\` è il numero delle sue posizioni diverse da $\\bot$.
- \`highest(readlist)\`: la coppia di \`readlist\` che ha il timestamp più alto.

### Come procedono scritture e letture, passo per passo?

1. **Inizio di una scrittura:** quando lo scrittore riceve \`< onar, Write | v >\`, incrementa \`ts\`, pone \`writing := TRUE\`, e avvia in parallelo le scritture di \`(ts, v)\` sugli $N$ registri della sua riga.
2. **Fine di una scrittura:** ogni volta che una di queste scritture ritorna, \`acks\` viene incrementato. Quando \`acks = N\` (tutta la riga è stata scritta), lo scrittore azzera \`acks\`, genera \`< onar, WriteReturn >\` e pone \`writing := FALSE\`.
3. **Inizio di una lettura (fase 1):** quando un lettore riceve \`< onar, Read >\`, avvia in parallelo le letture degli $N$ registri della sua colonna.
4. **Fine della fase 1, inizio della fase 2:** le coppie restituite dai registri della colonna vengono memorizzate in \`readlist\`. Quando tutti gli $N$ registri hanno risposto (\`#(readlist) = N\`), il lettore sceglie la coppia \`(maxts, readval)\` con il timestamp più alto, svuota \`readlist\`, e avvia le scritture di \`(maxts, readval)\` sugli $N$ registri della sua riga.
5. **Fine di una lettura:** quando tutte le $N$ scritture sulla riga sono ritornate (\`acks = N\`), il lettore, per il quale \`writing\` è falso, genera \`< onar, ReadReturn | readval >\`.

La lettura è più complessa della scrittura: è uno schema che ritorna in tutti gli algoritmi per gli atomic register.

### Perché l'algoritmo è corretto, e dov'è il punto di linearizzazione di una scrittura?

- **La termination** segue dalla termination degli atomic register $(1,1)$: un'operazione finisce dopo al più $N$ letture e $N$ scritture su di loro.
- **La validity** segue dalla loro validity.
- **Ordering:** si supponga che una lettura restituisca un valore $v_2$ con timestamp $s_2$. Prima di ritornare, il lettore ha scritto $(s_2, v_2)$ in tutti i registri della sua riga. Per la proprietà di ordering dei registri $(1,1)$, ogni lettura che comincia dopo trova nella sua colonna un timestamp maggiore o uguale a $s_2$, quindi non può restituire un valore più vecchio $v_1$ con timestamp $s_1 < s_2$.

Il punto di linearizzazione di una scrittura è il primo fra la fine della scrittura e la fine della prima lettura che restituisce il suo valore: è il primo momento in cui un qualche processo (lo scrittore, o un lettore che ha visto il valore) ha finito di scrivere il valore su tutta la sua riga. Da quel momento ogni lettura che comincia trova il valore nella sua colonna. Si considerino una \`write(5)\` e una prima lettura che restituisce $5$ e finisce prima della scrittura. Una seconda lettura, che comincia prima della fine della prima, può ancora restituire $\\bot$, perché le due letture sono concorrenti; una terza lettura, che comincia dopo la fine della prima, deve restituire $5$. In questo senso una lettura aiuta la scrittura: un lettore veloce può completare la sua riga prima di uno scrittore lento.

### Quali sono il costo e la resilienza dell'algoritmo con la matrice?

- **Registri:** esattamente $N^2$ atomic register $(1,1)$ sottostanti. Il costo vero non è lo spazio ma i messaggi, perché ognuno di questi registri è a sua volta realizzato scambiando messaggi.
- **Scrittura:** $N$ scritture su registri $(1,1)$, eseguite in parallelo.
- **Lettura:** $N$ letture (fase 1) seguite da $N$ scritture (fase 2) su registri $(1,1)$, $2N$ operazioni in tutto.
- **Resilienza:** l'algoritmo comunica solo attraverso i registri, quindi dei guasti non si deve occupare: tollera tutto ciò che tollerano i registri sottostanti. Se questi sono costruiti su regular register che funzionano con un numero qualunque di crash, anche la costruzione funziona con un numero qualunque di crash.

## Fase 3: un atomic register (1,N) con scambio di messaggi (Read-Impose Write-All, fail-stop)

### Che cos'è l'algoritmo Read-Impose Write-All (RIWA) nel modello fail-stop?

In un sistema a scambio di messaggi, nel **modello fail-stop** (un perfect failure detector $\\mathcal{P}$, best-effort broadcast e perfect point-to-point link), l'idea della matrice diventa l'algoritmo **Read-Impose Write-All (RIWA)**. È una versione modificata del regular register Read-One Write-All, in cui "la lettura scrive".

Ogni processo $p_i \\in \\Pi$ tiene una copia locale \`val\` del valore del registro, insieme al suo timestamp \`ts\`.

- **Scrittura:** lo scrittore $p_w$ invia in broadcast il nuovo valore, con un timestamp maggiore di uno rispetto a quello corrente, e aspetta le conferme di tutti i processi che $\\mathcal{P}$ non ha rilevato come in crash.
- **Lettura:** il lettore $p_i$ prende la sua \`val\` locale (che i broadcast tengono aggiornata). Per garantire l'atomicità, però, prima di restituirla $p_i$ deve **imporla** a tutti i processi: invia il valore in broadcast come se fosse una scrittura, e aspetta le conferme, esattamente come fa uno scrittore.
- **Ogni processo** accetta un valore solo se il suo timestamp è più alto di quello locale, e invia la conferma in ogni caso.

Senza l'imposizione l'algoritmo sarebbe Read-One Write-All, che è solo regolare: durante una \`write(5)\` lenta, un processo che ha già ricevuto $5$ legge $5$ e ritorna, e dopo di lui un processo che non l'ha ancora ricevuto legge $\\bot$. Con l'imposizione, quando la prima lettura ritorna ogni processo che non è andato in crash contiene $5$ o un valore più recente, e la seconda lettura non può più restituire $\\bot$.

### Qual è lo pseudo-codice dell'algoritmo Read-Impose Write-All (RIWA)?

\`\`\` Read-Impose Write-All: atomic register (1, N)
Implements:
  (1, N)-AtomicRegister, instance onar.
Uses:
  BestEffortBroadcast, instance beb;
  PerfectPointToPointLinks, instance pl;
  PerfectFailureDetector, instance P.

upon event < onar, Init > do
  (ts, val) := (0, ⊥);
  correct := Π;
  writeset := ∅;
  readval := ⊥;
  reading := FALSE;

upon event < P, Crash | p > do
  correct := correct \\ {p};

upon event < onar, Read > do
  reading := TRUE;
  readval := val;
  trigger < beb, Broadcast | [WRITE, ts, val] >;

upon event < onar, Write | v > do
  trigger < beb, Broadcast | [WRITE, ts + 1, v] >;

upon event < beb, Deliver | p, [WRITE, ts', v'] > do
  if ts' > ts then
    (ts, val) := (ts', v');
  trigger < pl, Send | p, [ACK] >;

upon event < pl, Deliver | p, [ACK] > do
  writeset := writeset ∪ {p};

upon correct ⊆ writeset do
  writeset := ∅;
  if reading = TRUE then
    reading := FALSE;
    trigger < onar, ReadReturn | readval >;
  else
    trigger < onar, WriteReturn >;
\`\`\`

- \`(ts, val)\`: la copia locale del registro, con il suo timestamp, tenuta da ogni processo.
- \`correct\`: l'insieme dei processi che il perfect failure detector $\\mathcal{P}$ non ha rilevato come in crash.
- \`writeset\`: l'insieme dei processi che hanno confermato il broadcast in corso.
- \`readval\`, \`reading\`: il valore che una lettura sta imponendo, e il flag che distingue una lettura da una scrittura.
- \`[WRITE, ts', v']\`: il messaggio inviato in broadcast sia dalle scritture sia dalle imposizioni delle letture.
- \`[ACK]\`: la conferma rimandata sul link punto-punto da un processo che ha gestito un messaggio \`WRITE\`.

### Come gestisce RIWA i crash, le scritture e le letture?

1. **Crash (\`< P, Crash | p >\`):** il processo $p$ viene tolto da \`correct\`. Se un'operazione sta aspettando le conferme e i processi rimasti in \`correct\` sono tutti in \`writeset\`, la condizione \`correct ⊆ writeset\` diventa vera e l'operazione si completa, senza aspettare il processo in crash.
2. **Inizio di una scrittura (\`< onar, Write | v >\`):** lo scrittore $p_w$ invia in broadcast \`[WRITE, ts + 1, v]\`. In questo punto non incrementa il proprio \`ts\`: lo farà quando consegnerà il proprio messaggio, come ogni altro processo.
3. **Consegna di una scrittura o di un'imposizione (\`< beb, Deliver | p, [WRITE, ts', v'] >\`):** un processo che riceve il messaggio controlla se \`ts' > ts\`. In tal caso aggiorna la sua copia locale, \`(ts, val) := (ts', v')\`. In ogni caso rimanda \`[ACK]\` al mittente $p$: un processo che contiene ancora $\\bot$ e legge proverà a imporre $\\bot$, tutti lo rifiuteranno, ma senza le conferme quella lettura non finirebbe mai.
4. **Raccolta delle conferme (\`< pl, Deliver | p, [ACK] >\`):** il mittente raccoglie le conferme in \`writeset\`. Quando \`correct ⊆ writeset\` (tutti i processi che non sono andati in crash hanno confermato), la scrittura, o l'imposizione della lettura, è completa: \`writeset\` viene svuotato e l'operazione ritorna.
5. **Inizio di una lettura (\`< onar, Read >\`):** il lettore $p_i$ pone \`reading := TRUE\`, salva il suo valore locale in \`readval\`, e invia in broadcast \`[WRITE, ts, val]\` per imporre quel valore a tutti i processi prima di ritornare.

L'algoritmo è corretto per le stesse ragioni di Read-One Write-All, per quanto riguarda termination e validity. Per l'ordering, una lettura ritorna solo dopo che ogni processo che non è andato in crash contiene una coppia con un timestamp alto almeno quanto quello del valore letto, quindi una lettura che comincia dopo non può restituire un valore più vecchio. Il punto di linearizzazione di una scrittura è il momento in cui il suo valore (o uno più recente) ha sostituito quello vecchio sull'ultimo processo. Nessun processo sa quando arriva questo momento, ma esiste, ed è tutto ciò che conta.

### Perché una lettura restituisce la copia \`readval\` e non \`val\`?

Quando una lettura comincia, il lettore copia il suo valore locale in \`readval\`, ed è questa copia che impone. Fra il broadcast e l'arrivo delle conferme, il lettore può consegnare un messaggio \`WRITE\` dello scrittore con un valore più recente, che sovrascrive \`val\`. Se la lettura restituisse \`val\`, restituirebbe un valore che non ha imposto, e che forse nessun altro processo ha ancora ricevuto: una lettura avviata dopo da un altro processo potrebbe restituire il valore più vecchio, e la proprietà di ordering sarebbe violata.

### Quali sono la complessità e la resilienza dell'algoritmo RIWA?

- **Complessità in messaggi:**
  - **Scrittura:** $1$ best-effort broadcast ($N$ messaggi) più $N$ conferme, al più $2N$ messaggi.
  - **Lettura:** $1$ best-effort broadcast ($N$ messaggi) più $N$ conferme, al più $2N$ messaggi (per via dell'imposizione).
- **Complessità in tempo (ritardi di messaggio):**
  - **Scrittura:** $2$ ritardi di messaggio ($1$ per il broadcast e $1$ per le conferme).
  - **Lettura:** $2$ ritardi di messaggio ($1$ per l'imposizione e $1$ per le conferme).
- **Resilienza:** $f < N$. L'algoritmo tollera fino a $N - 1$ crash, perché il perfect failure detector $\\mathcal{P}$ toglie i processi in crash da \`correct\`, e un'operazione si completa appena tutti i processi sopravvissuti hanno confermato.

Letture e scritture hanno lo stesso schema di messaggi, e quindi lo stesso costo. Rispetto al regular register nello stesso modello, dove una lettura è locale e non costa nulla, i $2N$ messaggi di una lettura sono il prezzo dell'atomicità.

## Fase 4: l'atomic register (1,N) fail-silent (panoramica di Read-Impose Write-Majority)

### Perché Read-Impose Write-All non funziona in un sistema asincrono fail-silent, e come risolve il problema Read-Impose Write-Majority?

In un sistema asincrono fail-silent (senza alcun failure detector), un processo non può distinguere un processo in crash da un link lento. Aspettare le conferme di "tutti i processi corretti" può quindi bloccare un'operazione per sempre, appena un solo processo va in crash.

Per tollerare i crash senza un failure detector, l'algoritmo usa i **quorum**, sotto l'ipotesi di una **maggioranza di processi corretti**: $$f < \\frac{N}{2} \\quad \\text{or} \\quad N \\ge 2f + 1$$

Nell'algoritmo **Read-Impose Write-Majority (RIWM)**:

1. **Intersezione dei quorum:** due quorum qualunque (insiemi di almeno $\\lfloor N/2 \\rfloor + 1$ processi) hanno almeno un processo in comune ($Q_1 \\cap Q_2 \\neq \\emptyset$).
2. **Scrittura:** lo scrittore invia in broadcast un messaggio \`WRITE\` con il timestamp e il valore, e aspetta le conferme di una maggioranza ($|\\mathit{writeset}| \\ge \\lfloor N/2 \\rfloor + 1$).
3. **Lettura, in due fasi:**
  - **Fase 1 (interrogare una maggioranza):** il lettore invia in broadcast un messaggio \`READ\` e raccoglie le coppie (timestamp, valore) di una maggioranza di processi. Sceglie la coppia $(\\mathit{ts}_{\\max}, v_{\\max})$ con il timestamp più alto.
  - **Fase 2 (imporre a una maggioranza):** il lettore invia in broadcast un messaggio \`WRITE\` con $(\\mathit{ts}_{\\max}, v_{\\max})$, e aspetta le conferme di una maggioranza prima di restituire $v_{\\max}$.

Poiché qualunque quorum di una lettura interseca qualunque quorum di una scrittura, la fase 1 vede il timestamp più alto scritto da qualunque scrittura completata. La fase 2 garantisce che qualunque lettura successiva veda un timestamp maggiore o uguale a $\\mathit{ts}_{\\max}$, il che conserva l'atomicità nelle esecuzioni asincrone fail-silent. È lo schema di tutti gli algoritmi per gli atomic register: una prima fase raccoglie le informazioni, e una seconda fase scrive il valore prima che la lettura ritorni. I dettagli dell'algoritmo sono nella prossima lezione.
`;export{e as default};
