const e=`## Reliable broadcast su una topologia a linea

### Qual è il modello di sistema di una topologia a linea con un oracolo che notifica i nuovi vicini?

Una topologia a linea è fatta di $n$ processi $p_1, p_2, \\dots, p_n$ disposti in fila, in modo che ogni processo interno $p_i$ (per $1 < i < n$) sia collegato solo al suo vicino di sinistra $p_{i-1}$ e al suo vicino di destra $p_{i+1}$. Il processo $p_1$ è l'estremo sinistro, e il processo $p_n$ è l'estremo destro.

- **Variabili locali:** ogni processo $p_i$ ha due variabili, \`left\` e \`right\`, con gli identificatori dei suoi due vicini. Per $p_1$ \`left\` è null ($\\bot$), e per $p_n$ \`right\` è null ($\\bot$).
- **Oracolo dei vicini:** i processi possono andare in crash, e un oracolo perfetto avvisa un processo $p_i$ quando uno dei suoi vicini è andato in crash, generando uno di due eventi:
  - \`NewLeftNeighbor(p_x)\`: $p_x$ è il nuovo vicino di sinistra di $p_i$ (oppure $\\bot$, se $p_i$ è diventato l'estremo sinistro).
  - \`NewRightNeighbor(p_x)\`: $p_x$ è il nuovo vicino di destra di $p_i$ (oppure $\\bot$, se $p_i$ è diventato l'estremo destro).
- **Comunicazione:** fra vicini ci sono perfect point-to-point link, e un processo può comunicare solo con i suoi vicini. L'oracolo è l'unica fonte di informazione sui guasti: non sono disponibili né un perfect failure detector né una leader election.

Quando un processo va in crash, l'oracolo ricollega la linea: se va in crash $p_3$, $p_2$ prima o poi riceve \`NewRightNeighbor(p_4)\` e $p_4$ prima o poi riceve \`NewLeftNeighbor(p_2)\`, non necessariamente nello stesso momento.

### Come si progetta un regular reliable broadcast su una topologia a linea con l'oracolo dei vicini?

Il modo per risolvere un esercizio come questo è partire dal caso senza guasti, e poi aggiungere i guasti. Su una linea senza guasti, un processo $p_i$ che invia in broadcast un messaggio $m$ manda $m$ sul suo link di sinistra e su quello di destra; ogni processo che riceve $m$ per la prima volta lo consegna allo strato superiore e lo ripete. Con i guasti, un vicino in crash spezza la catena. L'oracolo rileva il crash e ricollega la linea, saltando il processo in crash. Ma un messaggio che era in transito verso il processo in crash va perso, e un processo non può sapere se il suo vecchio vicino ha fatto in tempo a ripeterlo. Quindi, ogni volta che l'oracolo notifica un nuovo vicino, un processo manda di nuovo al nuovo vicino tutti i messaggi che ha consegnato. Questo vale per la sorgente di un messaggio come per un processo che lo sta solo ripetendo.

\`\`\` Regular reliable broadcast su una linea
upon event init do
    delivered := ∅
    leftProcess := left
    rightProcess := right

upon event < rrb, Broadcast | m > do
    delivered := delivered ∪ {(p_i, m)}
    trigger < rrb, Deliver | p_i, m >
    sendLeft((p_i, m))
    sendRight((p_i, m))

upon event < pl, Deliver | relay, (p_s, m) > do
    if (p_s, m) ∉ delivered then
        delivered := delivered ∪ {(p_s, m)}
        trigger < rrb, Deliver | p_s, m >
        sendLeft((p_s, m))
        sendRight((p_s, m))

upon event < Oracle, NewLeftNeighbor | p_x > do
    leftProcess := p_x
    for all (p_s, m) ∈ delivered do
        sendLeft((p_s, m))

upon event < Oracle, NewRightNeighbor | p_x > do
    rightProcess := p_x
    for all (p_s, m) ∈ delivered do
        sendRight((p_s, m))

procedure sendLeft((p_s, m)) do
    if leftProcess ≠ null then
        trigger < pl, Send | leftProcess, (p_s, m) >

procedure sendRight((p_s, m)) do
    if rightProcess ≠ null then
        trigger < pl, Send | rightProcess, (p_s, m) >
\`\`\`

- \`upon event init\`: inizializza lo stato locale. L'insieme \`delivered\` memorizza le coppie $(p_s, m)$, con la sorgente originale $p_s$ e il messaggio $m$, per non consegnare due volte un messaggio. Le variabili \`leftProcess\` e \`rightProcess\` partono dai vicini iniziali del processo.
- \`upon event < rrb, Broadcast | m >\`: eseguito quando il processo $p_i$ invia in broadcast un messaggio $m$. Il processo registra $(p_i, m)$ in \`delivered\`, consegna $m$ al proprio strato superiore, e manda la coppia ai suoi vicini di sinistra e di destra. La coppia porta la sorgente originale, perché i processi che ricevono il messaggio da un ripetitore devono consegnarlo con il nome della sorgente.
- \`upon event < pl, Deliver | relay, (p_s, m) >\`: eseguito quando una coppia $(p_s, m)$ arriva su un perfect link da un vicino. Se la coppia non è ancora stata consegnata, viene aggiunta a \`delivered\`, il messaggio viene consegnato allo strato superiore con sorgente $p_s$, e la coppia viene ripetuta su entrambi i link. Ripetere in entrambe le direzioni è una semplificazione: il vicino da cui il messaggio è arrivato lo riceve di nuovo, lo trova in \`delivered\` e lo ignora.
- \`upon event < Oracle, NewLeftNeighbor | p_x >\`: eseguito quando il vicino di sinistra è andato in crash e $p_x$ è il nuovo vicino di sinistra. Il processo $p_i$ aggiorna \`leftProcess := p_x\`, e manda di nuovo a $p_x$ tutte le coppie in \`delivered\`. Se il vicino in crash si è guastato mentre stava ripetendo un messaggio, il flusso di quel messaggio lungo la linea ricollegata viene ripristinato.
- \`upon event < Oracle, NewRightNeighbor | p_x >\`: lo stesso sul lato destro: il processo aggiorna \`rightProcess := p_x\` e manda di nuovo tutte le coppie in \`delivered\`.
- \`sendLeft\` e \`sendRight\`: due procedure che controllano se \`leftProcess\` o \`rightProcess\` è diverso da null prima di inviare sul perfect link.

L'algoritmo è un best-effort broadcast, perché una sorgente corretta continua a spingere il suo messaggio ogni volta che un vicino cambia. È anche un regular reliable broadcast, per la stessa ragione: ogni processo corretto che ha consegnato un messaggio si comporta per quel messaggio come una sorgente, e continua a spingerlo verso i suoi vicini finché questi non sono processi corretti che lo hanno ricevuto. È l'algoritmo eager del grafo completo, adattato alla linea. Le prestazioni qui non interessano: lo scopo è l'algoritmo corretto più semplice.

### L'algoritmo per la linea si può adattare per realizzare l'uniform reliable broadcast?

L'algoritmo qui sopra non realizza l'uniform reliable broadcast. Se un processo $p_i$ invia $m$ in broadcast, lo consegna subito in locale, e va in crash prima che i suoi messaggi raggiungano i vicini, allora $p_i$ (un processo guasto) ha consegnato $m$ mentre nessun processo corretto lo consegna mai: l'uniform agreement è violata.

Nel grafo completo l'uniform broadcast si ottiene con le conferme: un messaggio viene tenuto in sospeso, e viene consegnato solo quando si sa che lo hanno tutti i processi vivi. Qui non c'è un failure detector globale, ma l'idea funziona lo stesso, perché un messaggio si propaga lungo la linea senza saltare nessuno: quando lo hanno ricevuto entrambi gli estremi, lo hanno tutti.

- **Un'onda di conferme dagli estremi:** un messaggio $m$ si propaga verso l'esterno lungo la linea finché raggiunge entrambi gli estremi (quelli attuali, se alcuni processi sono andati in crash).
- **Generazione delle conferme:** quando un estremo (un processo con \`leftProcess\` o \`rightProcess\` uguale a null) riceve $m$, genera una conferma (\`ACK_LEFT\` dall'estremo sinistro, \`ACK_RIGHT\` da quello destro) che si propaga all'indietro verso l'interno, ripetuta come ogni altro messaggio.
- **Consegna condizionata:** un processo $p_i$ che riceve $m$ lo memorizza in un insieme \`pending\` e lo ripete. Consegna $m$ al suo strato superiore **solo** quando ha ricevuto sia \`ACK_LEFT\` sia \`ACK_RIGHT\` per $m$: la prima dice che tutti quelli alla sua sinistra hanno $m$, la seconda che lo hanno tutti quelli alla sua destra.
- **Guasti nel mezzo e agli estremi:** quando il suo vicino cambia, un processo manda di nuovo al nuovo vicino sia i messaggi sia le conferme che ha. Se un estremo va in crash, l'oracolo notifica al suo vicino che è il nuovo estremo ($p_x = \\bot$): il nuovo estremo ne prende il ruolo, e genera la conferma per tutti i messaggi nel suo insieme \`pending\`, così nessun messaggio resta bloccato perché un estremo è andato in crash prima di inviare la sua conferma. Un processo rimasto solo è entrambi gli estremi insieme, e genera da sé tutte e due le conferme.

## Operazioni commutative e non commutative su un link sincrono

### Quale astrazione di link serve quando le operazioni di un client sono moltiplicazioni di numeri, e quale quando sono moltiplicazioni di matrici?

Un client comunica con un server su un link punto-punto che non perde messaggi ed è sincrono: un messaggio inviato al tempo $t$ viene ricevuto entro il tempo $t + \\Delta$. Il server memorizza una variabile $X$ (all'inizio $X = 1$). Il client invia una raffica di operazioni di moltiplicazione, aspetta $3\\Delta$ unità di tempo, e poi invia una richiesta \`get()\` per ottenere $X$. La domanda è quale algoritmo, se ne serve uno, vada costruito sopra il link perché il client ottenga il risultato giusto, con il minimo costo aggiuntivo.

- **Caso 1: moltiplicazione per un numero ($X \\leftarrow X \\cdot y$)**
  - Proprietà: la moltiplicazione fra numeri è commutativa e associativa ($X \\cdot y_1 \\cdot y_2 = X \\cdot y_2 \\cdot y_1$).
  - Astrazione necessaria: il link così com'è.
  - Analisi: l'unica garanzia che il link non dà è l'ordine dei messaggi. Ma poiché la moltiplicazione è commutativa, l'ordine in cui il server riceve e applica le operazioni non cambia il valore finale di $X$: anche se $y_2$ arriva prima di $y_1$, il risultato $X \\cdot y_1 \\cdot y_2$ è lo stesso. Inoltre il link non perde nulla ed è sincrono, quindi tutte le operazioni della raffica arrivano entro $\\Delta \\le 3\\Delta$, prima della \`get()\`. Non serve alcun algoritmo aggiuntivo.
- **Caso 2: moltiplicazione per una matrice ($X \\leftarrow X \\cdot Y$)**
  - Proprietà: la moltiplicazione fra matrici **non è commutativa** ($A \\cdot B \\neq B \\cdot A$).
  - Astrazione necessaria: un FIFO point-to-point link.
  - Analisi: il risultato dipende dall'ordine delle operazioni, quindi consegnarle fuori ordine cambia la matrice $X$. Perché il server applichi le operazioni nell'ordine in cui il client le ha inviate, sopra il link dato va costruito un FIFO link.

## Un failure detector che diminuisce il suo timeout

### Un eventually perfect failure detector ($\\diamond\\mathcal{P}$) è ancora corretto se un falso sospetto gli fa dimezzare il timeout invece di aumentarlo?

Si consideri una realizzazione di un eventually perfect failure detector ($\\diamond\\mathcal{P}$) in cui i processi si scambiano periodicamente degli heartbeat. Quando un processo $p_i$ scopre di aver sospettato a torto un processo corretto $p_j$, perché un heartbeat di $p_j$ arriva dopo il timeout, ripristina $p_j$ e cambia il suo timeout dimezzandolo, \`delay := delay / 2\`, invece di aumentarlo, \`delay := delay + Δ\`. L'esercizio chiede se l'algoritmo soddisfa ancora le due proprietà di $\\diamond\\mathcal{P}$.

- **Proprietà 1: strong completeness**
  - Definizione: prima o poi ogni processo che va in crash è sospettato in modo permanente da ogni processo corretto.
  - Valutazione: **vale.** Se il processo $p_j$ va in crash, smette per sempre di inviare heartbeat. Dopo il crash, al timeout successivo $p_i$ non trova $p_j$ fra i processi vivi, lo aggiunge al suo insieme dei processi sospettati, e genera \`Suspect(p_j)\`. Poiché $p_j$ è morto, non arriverà mai un heartbeat a far scattare \`Restore(p_j)\`: $p_j$ resta sospettato da $p_i$ per sempre.
- **Proprietà 2: eventual strong accuracy**
  - Definizione: prima o poi nessun processo corretto è sospettato da alcun processo corretto.
  - Valutazione: **non vale.** Se $p_i$ sospetta troppo presto il processo corretto $p_j$ e più tardi riceve il suo heartbeat, $p_i$ ripristina $p_j$ ed esegue \`delay := delay / 2\`. Dimezzare \`delay\` rende il timeout più breve del tempo che un messaggio impiega a viaggiare. Quindi nell'intervallo successivo $p_i$ va in timeout ancora prima, sospetta di nuovo $p_j$, lo ripristina di nuovo, e dimezza di nuovo \`delay\`. Quando \`delay\` è diventato trascurabile (diciamo un nanosecondo) mentre un messaggio impiega molto di più ad arrivare, $p_i$ continua per sempre a sospettare e ripristinare i processi corretti, senza mai stabilizzarsi.

Entrambe le proprietà sono proprietà di liveness, come deve essere in un sistema sincrono prima o poi. Il rimedio è quello dell'algoritmo originale: dopo un errore il timeout va aumentato, mai diminuito.

## Classificare le esecuzioni di un broadcast, e una proprietà impossibile

### Come si distinguono in un'esecuzione best-effort broadcast (BEB), regular reliable broadcast (RB) e uniform reliable broadcast (URB)?

Le tre astrazioni differiscono in ciò che garantiscono sull'agreement:

- **Best-effort broadcast (BEB):** garantisce solo la validity: se un processo corretto invia $m$ in broadcast, tutti i processi corretti consegnano $m$. Se il mittente va in crash mentre sta inviando, alcuni processi corretti possono consegnare $m$ e altri no.
- **Regular reliable broadcast (RB):** garantisce l'agreement fra i processi corretti: se un processo corretto consegna $m$, tutti i processi corretti consegnano $m$. Un processo guasto può consegnare un messaggio che nessun processo corretto consegna mai.
- **Uniform reliable broadcast (URB):** garantisce l'uniform agreement: se **un qualunque** processo (corretto o guasto) consegna $m$, tutti i processi corretti consegnano $m$. L'insieme dei messaggi consegnati da un processo guasto $p_f$ è un sottoinsieme dell'insieme dei messaggi consegnati dai processi corretti: $M(p_f) \\subseteq M(p_{\\text{correct}})$.

Negli esercizi d'esame viene data un'esecuzione, che va completata con il minor numero di eventi in modo che soddisfi una specifica e non la successiva. Aiutano due regole:

- Per ottenere un'esecuzione che è BEB ma non RB, il messaggio che fa la differenza deve avere una sorgente **guasta**: viene consegnato da un processo corretto e non da un altro. Con una sorgente corretta è impossibile, perché la validity obbliga tutti i processi corretti a consegnare.
- Per ottenere un'esecuzione che è RB ma non URB, un messaggio deve essere consegnato da un processo guasto e da nessun processo corretto. Anche qui la sorgente deve essere guasta: un messaggio inviato da un processo corretto deve essere consegnato da tutti i processi corretti, già per il best-effort broadcast.

### Perché è impossibile garantire la consegna a processi che non sono corretti?

Si consideri, in un sistema fail-stop con un perfect failure detector e perfect link, un broadcast con la proprietà: "se un qualunque processo invia un messaggio $m$, allora ogni altro processo consegna $m$".

1. La proprietà non si può realizzare in un sistema in cui i processi possono andare in crash.
2. **Il destinatario è già andato in crash:** si supponga che il processo $p_i$ invii $m$ in broadcast al tempo $t$, e che il processo $p_j$ sia andato in crash prima di $t$. Quando $p_j$ era vivo il messaggio non esisteva, e ora $p_j$ è morto: non potrà mai consegnare $m$.
3. **Lo stesso vale con un mittente corretto:** la proprietà "se un processo corretto consegna un messaggio $m$, allora ogni altro processo consegna $m$" è impossibile per la stessa ragione, perché il controesempio non dipende dal mittente.
4. **Conclusione:** le specifiche del broadcast devono condizionare le loro garanzie ai processi corretti ("se un processo corretto invia $m$ in broadcast, allora ogni processo corretto prima o poi consegna $m$", oppure "se un processo consegna $m$, allora ogni processo corretto prima o poi consegna $m$"). Un processo corretto ha tutto il tempo che serve; un processo a cui non si chiede di essere corretto può fermarsi prima ancora che il messaggio esista.

## Letture su un registro: valori ammessi e violazioni della sequential consistency

### Come si determinano i valori che le letture possono restituire, secondo la semantica regolare e quella atomica?

Si considerino le operazioni su un registro $(1,N)$, con scritture e letture che si sovrappongono nel tempo:

- **Consistenza regolare:**
  - Una lettura che non è concorrente con alcuna scrittura deve restituire il valore dell'ultima scrittura che la precede.
  - Una lettura concorrente con una o più scritture può restituire il valore dell'ultima scrittura che la precede oppure il valore di una qualunque delle scritture concorrenti.
- **Consistenza atomica (linearizability):**
  - Tutte le operazioni devono sembrare eseguite in modo istantaneo in un punto di linearizzazione $L(\\mathit{op})$, posto fra l'invocazione e il completamento di ogni operazione.
  - Se una lettura $R_1$ restituisce il valore $v_2$ di una scrittura $W_2$, e una lettura $R_2$ comincia dopo che $R_1$ si è completata ($R_1 \\to R_2$), allora $R_2$ **non può** restituire il valore più vecchio $v_1$ di una scrittura precedente $W_1$: violerebbe la proprietà di ordering.

Per il caso atomico conviene disegnare un albero. Le letture si prendono nell'ordine in cui cominciano; la radice è la prima lettura, e ogni ramo corrisponde a uno dei valori che può restituire. Sotto ogni ramo vengono i valori ammessi per la lettura successiva, date le scelte fatte sopra, e così via: un cammino dalla radice a una foglia è una possibile esecuzione atomica. Lo schema che pota l'albero è una scrittura concorrente con due letture che non sono concorrenti fra loro: se la prima lettura restituisce il valore di quella scrittura, la seconda non può restituire un valore più vecchio.

### Come si costruisce una sequenza di valori restituiti che viola la sequential consistency?

La sequential consistency richiede un'unica sequenza globale $S$ di tutte le operazioni di tutti i processi, tale che:

1. $S$ conserva l'ordine locale delle operazioni di ogni processo.
2. Ogni lettura in $S$ restituisce il valore scritto dalla scrittura più recente che la precede in $S$.

Un'esecuzione viola la sequential consistency se una tale sequenza $S$ non esiste. Poiché $S$ è libera di riordinare le operazioni di processi diversi, l'unico modo per renderla impossibile è rompere un ordine locale: si può usare solo un processo che esegue due o più operazioni.

- **Esempio:**
  - Il processo $p_1$ esegue $W(x)=1 \\to W(x)=2$.
  - Il processo $p_2$ esegue $R(x)=2 \\to R(x)=1$.
- **Analisi:**
  - Per giustificare $R(x)=2$, la scrittura $W(x)=2$ deve precedere $R(x)=2$ in $S$.
  - Per giustificare $R(x)=1$, la scrittura $W(x)=1$ deve precedere $R(x)=1$, e $W(x)=2$ deve seguire $R(x)=1$ in $S$ (altrimenti $W(x)=2$ sovrascriverebbe $1$, e la lettura restituirebbe $2$).
  - Questo impone l'ordine $W(x)=1 \\to R(x)=1 \\to W(x)=2 \\to R(x)=2$.
  - Ma sul processo $p_2$ l'ordine locale è $R(x)=2 \\to R(x)=1$, e la sequenza lo inverte.
  - Quindi non esiste alcuna sequenza $S$ valida, e la sequential consistency è violata.

Altri modi per violarla sono una lettura che restituisce il valore iniziale $\\bot$ su un processo che ha già completato una scrittura, e una lettura che restituisce un valore che nessuno ha scritto (soluzione che un testo d'esame di solito esclude, chiedendo valori che sono stati scritti).

## Atomic register: ottimizzazioni e ipotesi

### Un atomic register $(1,1)$ si può realizzare nel modello fail-silent in modo più efficiente che con Read-Impose Write-Majority?

Nell'algoritmo Read-Impose Write-Majority per l'atomic register $(1,N)$ (modello fail-silent, $f < N/2$), una lettura ha due fasi:

1. **Fase di query:** il lettore chiede le loro coppie a una maggioranza di processi ($\\lfloor N/2 \\rfloor + 1$), e trova la coppia $(\\mathit{ts}, v)$ con il timestamp più alto.
2. **Fase di impose:** il lettore riscrive $(\\mathit{ts}, v)$ su una maggioranza prima di ritornare al suo strato superiore. Questa fase serve in un registro $(1,N)$ per impedire che un valore nuovo sia letto prima di uno vecchio da due lettori diversi $p_{r1}$ e $p_{r2}$.

In un atomic register $(1,1)$ (uno scrittore e un lettore $p_r$):

- **Ottimizzazione:** la seconda fase (la fase di impose) della lettura si può **togliere** del tutto.
- **Giustificazione:** $p_r$ è l'**unico** lettore del sistema, e la fase di impose esiste per gli altri lettori. L'inversione fra un valore nuovo e uno vecchio avviene quando un lettore $p_{r1}$ ottiene un valore nuovo $v_2$ da un processo di una minoranza, e un lettore successivo $p_{r2}$ chiede a una maggioranza che non ha ancora ricevuto $v_2$ e legge il valore vecchio $v_1$. Con un solo lettore basta che $p_r$ tenga la coppia con il timestamp più alto $\\mathit{ts}_{\\max}$ che ha mai visto: a ogni lettura chiede a una maggioranza, confronta i timestamp che riceve con il proprio, e restituisce il valore con quello più alto. Poiché $p_r$ non dimentica mai ciò che ha visto, in una lettura successiva non restituisce mai un valore più vecchio.
- **Guadagno:** i messaggi di una lettura passano da $4N$ ($2N$ per la query e $2N$ per l'imposizione) a $2N$ (la sola query), e la sua durata da $4$ ritardi di messaggio a $2$.

Due idee ancora più semplici non funzionano. Se il lettore chiedesse solo allo scrittore, una lettura non terminerebbe mai dopo un crash dello scrittore, perché senza un failure detector il lettore aspetterebbe per sempre. In modo simmetrico, se lo scrittore inviasse il valore solo al lettore e ne aspettasse la conferma, una scrittura non terminerebbe mai dopo un crash del lettore. È aspettare una maggioranza a garantire la termination.

### Perché gli identificatori delle richieste si possono omettere nel modello fail-stop con $\\mathcal{P}$, mentre sono necessari nel modello fail-silent con i quorum?

- **Modello fail-stop con un perfect failure detector ($\\mathcal{P}$), Read-One Write-All:**
  - Le letture sono puramente locali, senza messaggi: non ci sono messaggi \`READ\` e \`VALUE\` che potrebbero portare un identificatore.
  - Una scrittura invia $v$ in broadcast a tutti i processi e aspetta le conferme di **tutti** i processi che non sono stati rilevati come in crash.
  - Poiché una scrittura si completa solo dopo che tutti i processi corretti l'hanno confermata, quando finisce nella rete non resta nulla di quella scrittura: nessun messaggio \`WRITE\` ancora da consegnare, nessuna conferma ancora da ricevere (tranne quelle di processi andati in crash, che non contano).
  - Quindi un'operazione non incontra mai le risposte in ritardo a una precedente, e gli identificatori non servono.
- **Modello fail-silent con i quorum ($f < N/2$), Majority Voting:**
  - Scritture e letture aspettano le risposte di una maggioranza ($\\lfloor N/2 \\rfloor + 1$ processi).
  - I messaggi da e verso i processi fuori da quella maggioranza possono essere ritardati in modo arbitrario in una rete asincrona.
  - Quando comincia una nuova operazione, le risposte in ritardo alle letture o alle scritture precedenti possono ancora arrivare.
  - Gli identificatori delle richieste sono necessari per scartare quelle risposte in ritardo, che altrimenti verrebbero contate per la nuova operazione.

### Che relazione c'è fra il modello fail-stop e il modello sincrono?

- **Modello fail-stop:** i processi vanno in crash, ed è disponibile un perfect failure detector $\\mathcal{P}$.
- **Modello sincrono:** c'è un limite noto al ritardo dei messaggi sui link.
- **Relazione:** il modello sincrono è il più forte. In un sistema sincrono un perfect failure detector si può realizzare, con i timeout. Con il solo perfect failure detector, invece, non si può dire nulla sul ritardo dei messaggi: un processo che invia un messaggio sa che verrà avvisato se il destinatario va in crash, ma non sa entro quando il messaggio arriverà.

### Perché l'atomic register costruito sui regular register non ha bisogno né di un failure detector né di una maggioranza di processi corretti?

Con lo scambio di messaggi, l'atomic register $(1,N)$ ha bisogno di un perfect failure detector (Read-Impose Write-All) oppure, nel modello fail-silent, di una maggioranza di processi corretti (Read-Impose Write-Majority). La costruzione che usa la matrice di registri costruiti su regular register $(1,N)$, invece, non nomina nessuna delle due cose.

Le ipotesi non sono sparite: sono nascoste dentro i regular register. Per realizzare un regular register con lo scambio di messaggi serve un perfect failure detector oppure una maggioranza di processi corretti, e la costruzione eredita tutto ciò che i registri sottostanti richiedono. Può fare a meno di nominare quelle ipotesi solo perché i registri le danno già garanzie sufficienti.
`;export{e as default};
