## Collegamenti di comunicazione punto-punto FIFO

### Qual è la definizione formale di FIFO point-to-point link?

Un FIFO (First-In, First-Out) point-to-point link è un'astrazione di comunicazione affidabile costruita direttamente sopra un perfect point-to-point link (PL). Garantisce che i messaggi inviati da un processo $p$ a un processo $q$ siano consegnati su $q$ esattamente nell'ordine in cui $p$ li ha inviati.

L'astrazione di FIFO link espone i due eventi consueti:

- **Evento di richiesta:** $\langle \text{fifo}, \text{Send} \mid q, m \rangle$ - chiede la trasmissione del messaggio $m$ al processo di destinazione $q$.
- **Evento di indicazione:** $\langle \text{fifo}, \text{Deliver} \mid p, m \rangle$ - indica la consegna del messaggio $m$ inviato dal processo sorgente $p$.

La specifica di un FIFO point-to-point link è fatta delle tre proprietà del perfect link più una proprietà di ordinamento:

- **Reliable delivery (PL1):** se un processo corretto $p$ invia un messaggio $m$ a un processo corretto $q$, allora $q$ prima o poi consegna $m$.
- **No duplication (PL2):** nessun messaggio $m$ è consegnato al processo $q$ più di una volta.
- **No creation (PL3):** se un processo $q$ consegna un messaggio $m$ con mittente $p$, allora $m$ è stato inviato in precedenza a $q$ dal processo $p$.
- **FIFO delivery order (FIFO):** se un processo $p$ invia un messaggio $m$ al processo $q$ prima di inviare a $q$ un messaggio $m'$, allora $q$ consegna $m$ prima di consegnare $m'$. Formalmente: $$\forall p, q \in \Pi, \forall m, m': \left( \text{Send}_p(q, m) \to \text{Send}_p(q, m') \right) \implies \left( \text{Deliver}_q(p, m) \to \text{Deliver}_q(p, m') \right)$$

### Che relazione c'è fra l'ordinamento FIFO a coppie e l'ordinamento di una sequenza di messaggi?

Anche se la proprietà FIFO è enunciata per due messaggi qualunque $m$ e $m'$, per induzione si estende a qualunque sequenza di messaggi. Se il mittente $p$ invia al destinatario $q$ la sequenza $\langle m_1, m_2, m_3, \dots, m_k \rangle$, allora $q$ può consegnare i messaggi solo nell'ordine esatto $\langle m_1, m_2, m_3, \dots, m_k \rangle$. Se $q$ consegnasse $\langle m_1, m_3, m_2, \dots \rangle$, la coppia $(m_2, m_3)$ violerebbe direttamente la proprietà FIFO. Si noti che un FIFO link lavora fra un mittente e un destinatario: non impone alcun ordine fra mittenti diversi.

### Qual è lo pseudo-codice di un FIFO link sopra un perfect link?

``` FIFO link sopra un perfect link
Module:
    Name: FifoPointToPointLink, instance fifo

Events:
    Request: < fifo, Send | q, m >
    Indication: < fifo, Deliver | p, m >

Uses:
    PerfectPointToPointLink, instance pl

Upon Event < fifo, Init > do:
    pending := ∅
    seq := 0
    next_deliv_seq := 0

Upon Event < fifo, Send | q, m > do:
    trigger < pl, Send | q, (m, seq) >
    seq := seq + 1

Upon Event < pl, Deliver | p, (m, sn) > do:
    pending := pending ∪ {(m, sn, p)}

Upon Event ∃ (m, sn, p) ∈ pending : sn = next_deliv_seq do:
    trigger < fifo, Deliver | p, m >
    pending := pending \ {(m, sn, p)}
    next_deliv_seq := next_deliv_seq + 1
```

I due contatori appartengono a un collegamento, cioè a una coppia mittente-destinatario: `seq` numera i messaggi inviati a $q$, e `next_deliv_seq` conta i messaggi consegnati da $p$. Un processo che parla con più interlocutori tiene una coppia di contatori per ciascuno.

### Come funziona l'algoritmo FIFO riga per riga?

- `Upon Event < fifo, Init > do`: inizializza lo stato locale.
  - `pending := ∅`: un insieme che tiene da parte i messaggi ricevuti fuori ordine dal perfect link sottostante. Ogni elemento di `pending` è una tupla $(m, \mathit{sn}, p)$ fatta del contenuto $m$, del numero di sequenza $\mathit{sn}$ e dell'identificatore della sorgente $p$.
  - `seq := 0`: un contatore intero locale, tenuto dal mittente per assegnare ai messaggi in uscita numeri di sequenza strettamente crescenti.
  - `next_deliv_seq := 0`: un contatore intero locale, tenuto dal destinatario: il numero di sequenza del prossimo messaggio da consegnare allo strato superiore.
- `Upon Event < fifo, Send | q, m > do`: invocato quando lo strato superiore chiede di inviare il contenuto $m$ alla destinazione $q$.
  - `trigger < pl, Send | q, (m, seq) >`: impacchetta il contenuto $m$ con il numero di sequenza corrente `seq` in una tupla $(m, \mathit{seq})$ e la passa al perfect link sottostante `pl`.
  - `seq := seq + 1`: incrementa il contatore di sequenza locale per il prossimo messaggio in uscita.
- `Upon Event < pl, Deliver | p, (m, sn) > do`: invocato quando il perfect link sottostante consegna una tupla $(m, \mathit{sn})$ inviata dal processo $p$.
  - `pending := pending ∪ {(m, sn, p)}`: inserisce la tupla ricevuta $(m, \mathit{sn}, p)$ nell'insieme `pending`, senza ancora consegnarla allo strato superiore.
- `Upon Event ∃ (m, sn, p) ∈ pending : sn = next_deliv_seq do`: un handler protetto da una condizione, che scatta ogni volta che un messaggio in `pending` ha il numero di sequenza atteso `next_deliv_seq`.
  - `trigger < fifo, Deliver | p, m >`: consegna il contenuto $m$ allo strato superiore, in ordine FIFO.
  - `pending := pending \ {(m, sn, p)}`: toglie dall'insieme `pending` la tupla consegnata.
  - `next_deliv_seq := next_deliv_seq + 1`: incrementa di 1 il numero di sequenza atteso.

### Perché nell'algoritmo FIFO l'atomicità degli handler è indispensabile?

L'atomicità garantisce che un handler sia eseguito fino in fondo senza intrecciarsi con altri handler locali. Se l'handler di invio `upon event < fifo, Send | q, m >` non fosse atomico, due richieste concorrenti di inviare i messaggi $m_A$ e $m_B$ potrebbero leggere entrambe lo stesso valore di `seq` (per esempio $\mathit{seq} = 0$) prima che una delle due lo incrementi. Così $m_A$ e $m_B$ verrebbero inviati con lo stesso numero di sequenza, come $(m_A, 0)$ e $(m_B, 0)$, provocando una collisione sul destinatario e rompendo l'ordine di consegna.

### Per quanto tempo un messaggio può aspettare nell'insieme pending?

Un messaggio $(m, \mathit{sn}, p)$ può restare nell'insieme `pending` per un tempo illimitato (ma finito). Se il messaggio $m_1$ con numero di sequenza $\mathit{sn} = 1$ arriva al processo $q$ prima del messaggio $m_0$ con numero di sequenza $\mathit{sn} = 0$ (il perfect link non conserva l'ordine), $m_1$ viene messo da parte in `pending`. La condizione $\mathit{sn} = \mathit{next\_deliv\_seq}$ resta falsa per $m_1$ finché non arriva $m_0$. Appena $m_0$ è consegnato e `next_deliv_seq` passa da 0 a 1, la condizione sblocca subito la consegna di $m_1$.

### Qual è la dimostrazione formale di correttezza della proprietà FIFO delivery order?

Le tre proprietà del perfect link valgono direttamente, perché l'algoritmo usa un perfect link. La proprietà FIFO si dimostra per assurdo. Si supponga che l'algoritmo la violi: allora esiste un'esecuzione in cui un processo di destinazione $q$ consegna un messaggio $m'$ con numero di sequenza $\mathit{sn}'$ prima di consegnare un messaggio $m$ con numero di sequenza $\mathit{sn}$, anche se il mittente $p$ ha inviato $m$ prima di $m'$.

1. Poiché il mittente $p$ ha inviato $m$ prima di $m'$, e i numeri di sequenza sono incrementati da $\mathit{seq} := \mathit{seq} + 1$ dentro un handler atomico, segue che: $$\mathit{sn} < \mathit{sn}'$$
2. Sia $t$ l'istante in cui il processo $q$ consegna $m'$, e $t'$ l'istante in cui $q$ consegna $m$. Per l'ipotesi assurda: $$t < t'$$
3. Per la condizione dell'handler di consegna, un messaggio con numero di sequenza $\mathit{sn}'$ può essere consegnato solo quando: $$\mathit{next\_deliv\_seq} = \mathit{sn}'$$
4. Inoltre `next_deliv_seq` è inizializzato a $0$ ed è modificato solo dall'istruzione `next_deliv_seq := next_deliv_seq + 1`, dentro un handler atomico. Quindi `next_deliv_seq` è un contatore che cresce esattamente di un'unità a ogni consegna.
5. Perché `next_deliv_seq` arrivi a $\mathit{sn}'$ all'istante $t$, deve aver assunto prima ogni valore intero da $0$ fino a $\mathit{sn}' - 1$.
6. Poiché $\mathit{sn} < \mathit{sn}'$, c'è stato un istante precedente $t_{\mathit{prev}} < t$ in cui: $$\mathit{next\_deliv\_seq} = \mathit{sn}$$
7. Il contatore ha superato il valore $\mathit{sn}$ solo eseguendo l'handler di consegna, e l'unico messaggio di $p$ con numero di sequenza $\mathit{sn}$ è $m$. Quindi il processo $q$ ha consegnato $m$ all'istante $t_{\mathit{prev}}$ e poi ha incrementato `next_deliv_seq`.
8. Questo significa che $q$ ha consegnato $m$ all'istante $t_{\mathit{prev}} < t$, contro l'ipotesi iniziale che $m$ sia stato consegnato all'istante $t' > t$, dopo $m'$. Quindi la proprietà FIFO delivery order vale. $\blacksquare$

## Causalità e relazione happened-before di Lamport

### Perché gli orologi fisici non bastano a ordinare gli eventi?

Gli algoritmi di sincronizzazione degli orologi fisici cercano di far concordare orologi distribuiti su un valore comune, ma poggiano su una stima del ritardo di trasmissione, che in molti sistemi è difficile ottenere con buona precisione e che in un sistema asincrono non è disponibile affatto. Per molte applicazioni, poi, non conta *quando* le cose sono successe ma *in che ordine* sono successe. L'obiettivo è quindi un modo di dare un timestamp agli eventi che segua la nozione intuitiva di causalità, senza usare il tempo fisico.

### Perché l'ordinamento FIFO non basta a evitare fraintendimenti causali nelle applicazioni distribuite?

L'ordinamento FIFO conserva l'ordine solo lungo un singolo collegamento punto-punto fra un mittente e un destinatario. Non dà alcuna garanzia fra più mittenti, né lungo una conversazione che coinvolge più di due processi.

Si consideri l'esempio di una chat distribuita, usata in un ambiente di lavoro critico da quattro processi: Alice ($p_A$), Mike ($p_M$), il supervisore di Bob ($p_S$) e Bob ($p_B$). La chat è distribuita per non avere un punto centrale di guasto, e il modello è asincrono perché la chat deve funzionare anche quando la rete perde la sincronia.

1. Alice ($p_A$) chiede al gruppo: **"What should we do if the price of Apple drops?"** (messaggio $m_1$).
2. Mike ($p_M$) riceve $m_1$ e risponde: **"If Apple drops, sell Apple stock and buy Amazon stock."** (messaggio $m_2$).
3. Alice ($p_A$) fa poi un'altra domanda: **"Who will do it?"** (messaggio $m_3$).
4. Il supervisore di Bob ($p_S$) riceve $m_3$ e scrive: **"Bob will do it."** (messaggio $m_4$).

Poiché il sistema è asincrono e i messaggi viaggiano su collegamenti indipendenti, i ritardi di rete rimescolano le consegne sul nodo di Bob ($p_B$). Si supponga che Bob riceva $m_2$ ("sell Apple, buy Amazon") seguito subito da $m_4$ ("Bob will do it"), mentre i messaggi di Alice, a partire dalla domanda $m_1$ ("What should we do if..."), sono in ritardo.

Dalla vista locale di Bob la conversazione sembra un ordine incondizionato del suo supervisore di fare subito l'operazione. Bob la fa, subendo una perdita finanziaria, prima che arrivi finalmente il messaggio $m_1$ di Alice, quello che dà il contesto. Succede anche se tutti i canali sono FIFO link: l'ordine FIFO è pienamente rispettato su ciascuno dei collegamenti $p_A \to p_B$, $p_M \to p_B$ e $p_S \to p_B$. I FIFO link non possono evitare questa anomalia, perché $m_2$ e $m_4$ vengono da mittenti diversi. Quando Bob riceve il messaggio di Mike dovrebbe sapere che c'è qualcosa che lo ha generato causalmente. Per evitare disastri del genere serve un'astrazione di ordinamento basata sulla precedenza causale.

### Come si definisce formalmente la relazione happened-before di Lamport?

Leslie Lamport (1978) ha formalizzato la precedenza causale nei sistemi distribuiti con la relazione happened-before, indicata con $\to$. Dato l'insieme $E$ degli eventi del sistema, la relazione $\to \subseteq E \times E$ è la più piccola relazione che soddisfa tre regole:

- **Ordinamento locale (regola 1):** se gli eventi $e_i$ ed $e_j$ avvengono nello stesso processo $p_k$, ed $e_i$ avviene prima di $e_j$ nell'esecuzione sequenziale di $p_k$, allora: $$e_i \to e_j \quad \left(\text{or } e_i \to_k e_j\right)$$
- **Ordinamento invio-ricezione (regola 2):** se l'evento $e_i$ è l'invio ($\text{Send}$) di un messaggio $m$ da parte del processo $p_a$, e l'evento $e_j$ è la ricezione ($\text{Deliver}$) dello stesso messaggio $m$ da parte del processo $p_b$, allora: $$e_i \to e_j$$
- **Transitività (regola 3):** se $e_i \to e_j$ ed $e_j \to e_k$, allora: $$e_i \to e_k$$

La relazione così ottenuta è un ordine parziale stretto sugli eventi (l'insieme degli eventi è un poset).

### Che cos'è la concorrenza rispetto alla relazione happened-before?

Due eventi distinti $e_i$ ed $e_j$ sono concorrenti, e si scrive $e_i \parallel e_j$, se nessuno dei due precede causalmente l'altro: $$e_i \parallel e_j \iff \neg(e_i \to e_j) \land \neg(e_j \to e_i)$$ Quindi, per due eventi distinti qualunque di un'esecuzione, vale esattamente una di queste: $e_i \to e_j$, $e_j \to e_i$ oppure $e_i \parallel e_j$. Gli eventi concorrenti sono azioni indipendenti: nessuna informazione disponibile in $e_i$ è arrivata a $e_j$, e viceversa. In un'esecuzione asincrona gli eventi concorrenti possono avvenire in qualunque ordine relativo nel tempo fisico senza cambiare l'esito del calcolo.

## Orologi logici scalari di Lamport

### Che cosa sono gli orologi logici scalari di Lamport e quali sono le loro regole?

Un orologio logico scalare di Lamport è una funzione $L: E \to \mathbb{N}$ che assegna un timestamp intero a ogni evento del sistema. È un contatore software monotono crescente, slegato dall'orologio fisico, e soddisfa la condizione di coerenza dell'orologio: $$\forall e, e' \in E : e \to e' \implies L(e) < L(e')$$

Ogni processo $p_i$ mantiene un contatore intero locale $L_i$, inizialmente $0$. L'algoritmo ha due regole semplici:

- **Regola dell'evento locale o di invio:** prima di eseguire un evento locale o di inviare un messaggio, il processo $p_i$ incrementa il proprio orologio locale: $$L_i := L_i + 1$$ Quando invia un messaggio $m$, il processo $p_i$ gli attacca il proprio timestamp aggiornato $L_i$: $(m, L_i)$.
- **Regola dell'evento di ricezione:** quando riceve un messaggio $m$ con timestamp $L_m$, il processo $p_i$ porta il proprio orologio locale al massimo fra il suo valore corrente e $L_m$, e poi incrementa il risultato di $1$ prima di dare il timestamp all'evento di ricezione: $$L_i := \max(L_i, L_m) + 1$$

La prima regola fa crescere il timestamp di uno rispetto all'evento precedente dello stesso processo; la seconda fa crescere il timestamp di un evento di ricezione di almeno uno rispetto al corrispondente evento di invio. Insieme garantiscono la condizione di coerenza dell'orologio lungo ogni cammino causale.

### $L(e) < L(e')$ implica che $e \to e'$?

No. Gli orologi scalari di Lamport danno un'implicazione in una sola direzione: $$e \to e' \implies L(e) < L(e')$$ L'inverso, $L(e) < L(e') \implies e \to e'$, **non** vale. Se $L(e) < L(e')$, gli eventi $e$ ed $e'$ possono essere legati causalmente ($e \to e'$) oppure concorrenti ($e \parallel e'$); due eventi concorrenti possono persino avere lo stesso timestamp. Gli orologi scalari schiacciano l'intera esecuzione su una sola scala numerica e perdono l'informazione sulla concorrenza: guardando solo i timestamp scalari non si può dire se due eventi sono concorrenti o legati da happened-before. Per avere la doppia implicazione che caratterizza del tutto la causalità servono i vector clock.

## Vector clock di Mattern e Fidge

### Che cosa sono i vector clock di Mattern e Fidge e come catturano tutta la causalità?

I vector clock, proposti in modo indipendente da Friedemann Mattern e Colin Fidge alla fine degli anni Ottanta, estendono gli orologi scalari a un array di $n$ contatori logici, dove $n = |\Pi|$ è il numero fisso di processi del sistema.

Ogni processo $p_i$ mantiene un vector clock locale $V_i[1 \dots n]$, in cui la componente $V_i[j]$ è ciò che $p_i$ sa del numero di eventi avvenuti sul processo $p_j$.

### In che senso un vector clock è una struttura che contiene l'intera storia degli eventi?

Per capire perché i vector clock funzionano, si consideri una struttura dati astratta intermedia, in cui ogni processo $p_i$ mantiene un array di storie di eventi $\text{Hist}_i[1 \dots n]$. L'idea è che il timestamp di un evento non sia più un solo numero, ma la storia degli eventi avvenuti prima di lui, l'evento stesso compreso.

- $\text{Hist}_i[i]$ contiene la sequenza di tutti gli eventi locali generati da $p_i$.
- $\text{Hist}_i[j]$ (per $j \ne i$) contiene gli eventi generati dal processo $p_j$ che sono arrivati causalmente a $p_i$ attraverso scambi di messaggi.

Quando $p_i$ genera un evento locale $e$, aggiunge $e$ in coda a $\text{Hist}_i[i]$. Quando $p_i$ invia un messaggio, gli attacca l'intero array di storie $\text{Hist}_i$. Quando riceve $\text{Hist}_m$, il processo $p_i$ aggiorna ciò che sa prendendo, per ogni componente, la più recente delle due storie, cioè la loro unione: $$\text{Hist}_i[j] := \text{Hist}_i[j] \cup \text{Hist}_m[j] \quad \forall j \in \{1 \dots n\}$$

Con questi timestamp un evento $e'$ segue causalmente un evento $e$ esattamente quando le storie di $e'$ contengono le storie di $e$: se il timestamp di $e'$ contiene $e$, c'è un cammino causale da $e$ a $e'$.

### Perché le storie complete degli eventi si possono ridurre a un semplice array di interi $V_i[1 \dots n]$?

In qualunque esecuzione il processo $p_j$ genera i propri eventi locali in una catena sequenziale stretta: $\langle e_j^1, e_j^2, e_j^3, \dots \rangle$. Il processo $p_j$ è l'unico processo del sistema che può aggiungere nuovi eventi alla propria storia. Di conseguenza, la storia di $p_j$ nota a un qualunque processo $p_i$ è sempre un prefisso della catena locale di eventi di $p_j$: $\{e_j^1, e_j^2, \dots, e_j^k\}$. Poiché un prefisso di una catena sequenziale è identificato in modo unico dalla sua lunghezza $k$, memorizzare tutto l'insieme di eventi $\{e_j^1, \dots, e_j^k\}$ è ridondante. Memorizzare il solo intero $V_i[j] = k$ conserva tutta l'informazione causale: una storia è un prefisso proprio di un'altra esattamente quando è più corta.

### Quali sono le regole dei vector clock di Mattern e Fidge?

1. **Inizializzazione:** all'avvio del sistema ogni processo $p_i$ pone a zero tutte le componenti del proprio vector clock: $$V_i[j] := 0 \quad \forall j \in \{1 \dots n\}$$
2. **Regola dell'evento locale o di invio:** prima di eseguire un evento locale o di inviare un messaggio, il processo $p_i$ incrementa la propria componente del vettore locale: $$V_i[i] := V_i[i] + 1$$ Quando invia un messaggio $m$, $p_i$ gli attacca una copia del proprio vettore aggiornato $V_i$: $(m, V_i)$.
3. **Regola dell'evento di ricezione:** quando riceve un messaggio $m$ che porta il timestamp vettoriale $V_m$, il processo $p_i$ aggiorna il proprio vector clock locale prendendo il massimo componente per componente, e poi incrementa la propria componente: $$V_i[j] := \max(V_i[j], V_m[j]) \quad \forall j \in \{1 \dots n\}$$ $$V_i[i] := V_i[i] + 1$$

Quindi $V_i[i]$ è il numero di eventi prodotti da $p_i$, e $V_i[j]$, con $j \ne i$, è il numero di eventi generati da $p_j$ di cui $p_i$ è a conoscenza.

### Come si confrontano formalmente i timestamp vettoriali per stabilire causalità o concorrenza?

Dati due timestamp vettoriali $V$ e $V'$ di dimensione $n$:

- **Uguaglianza di vettori** ($V = V'$): $$V = V' \iff \forall j \in \{1 \dots n\} : V[j] = V'[j]$$
- **Minore o uguale fra vettori** ($V \le V'$): $$V \le V' \iff \forall j \in \{1 \dots n\} : V[j] \le V'[j]$$
- **Precedenza stretta fra vettori** ($V < V'$): $$V < V' \iff (V \le V') \land (V \ne V')$$
- **Concorrenza** ($V \parallel V'$): $$V \parallel V' \iff \neg(V \le V') \land \neg(V' \le V)$$

Con questi operatori di confronto i vector clock ottengono la doppia implicazione che caratterizza esattamente la precedenza causale: $$e \to e' \iff V(e) < V(e')$$ $$e \parallel e' \iff V(e) \parallel V(e')$$

I due meccanismi di tempo logico servono a risolvere problemi diversi: i timestamp scalari sono lo strumento dell'algoritmo di mutua esclusione di Lamport, quelli vettoriali del causal broadcast.

## Esercizi e analisi della concorrenza

### Come si analizzano i vector clock e si individuano gli eventi concorrenti in un'esecuzione?

Si consideri un'esecuzione asincrona con quattro processi $\Pi = \{p_1, p_2, p_3, p_4\}$. Valutiamo alcune coppie di eventi usando i loro timestamp vettoriali $V(e) = [V[1], V[2], V[3], V[4]]$:

- **Esempio 1:** si confrontino l'evento $e_A$ su $p_1$, con timestamp $V(e_A) = [1, 2, 0, 0]$, e l'evento $e_B$ su $p_3$, con timestamp $V(e_B) = [3, 4, 4, 1]$.
  - Si verifica $V(e_A) \le V(e_B)$ componente per componente: $1 \le 3$, $2 \le 4$, $0 \le 4$ e $0 \le 1$ sono tutte vere.
  - Poiché $V(e_A) \le V(e_B)$ e $V(e_A) \ne V(e_B)$, si conclude $V(e_A) < V(e_B)$, che dimostra $e_A \to e_B$.
- **Esempio 2:** si confrontino l'evento $e_C$ su $p_2$, con timestamp $V(e_C) = [2, 1, 0, 0]$, e l'evento $e_D$ su $p_3$, con timestamp $V(e_D) = [0, 0, 2, 0]$.
  - Componente 1: $2 > 0$ (è maggiore $V(e_C)$).
  - Componente 3: $0 < 2$ (è maggiore $V(e_D)$).
  - Poiché nessuno dei due vettori domina l'altro su tutte le componenti ($\neg(V(e_C) \le V(e_D))$ e $\neg(V(e_D) \le V(e_C))$), vale $V(e_C) \parallel V(e_D)$, che dimostra che gli eventi $e_C$ ed $e_D$ sono concorrenti.

### Come si svolge nel dettaglio l'esercizio d'esame sullo sniffing dei vector clock?

**Testo del problema:** si consideri un sistema asincrono a scambio di messaggi con quattro processi $\Pi = \{p_1, p_2, p_3, p_4\}$, che comunicano su collegamenti punto-punto e usano vector clock $V[1 \dots 4]$, incrementati prima di ogni invio. Si collega uno sniffer alla scheda di rete del processo $p_1$ e si osservano i seguenti messaggi in uscita e in entrata:

1. Al tempo $t_0$ un pacchetto **esce** dalla scheda di rete di $p_1$ con il timestamp vettoriale $V_{\mathit{out}} = [1, 0, 0, 0]$.
2. Al tempo $t_5$ un pacchetto **entra** nella scheda di rete di $p_1$ con il timestamp vettoriale $V_{\mathit{in}} = [1, 2, 3, 1]$.

**Domanda 1:** disegnare un'esecuzione che giustifichi i vector clock osservati. Questa esecuzione è unica?

**Analisi e costruzione passo per passo:**

- **Pacchetto in uscita** ($V_{\mathit{out}} = [1, 0, 0, 0]$): il processo $p_1$ parte da $[0,0,0,0]$. Prima di inviare il suo primo messaggio $p_1$ incrementa la propria componente, $V_1[1] := 1$. Attacca $[1,0,0,0]$ al pacchetto in uscita e lo invia.
- **Pacchetto in entrata** ($V_{\mathit{in}} = [1, 2, 3, 1]$): il timestamp $[1,2,3,1]$ letto sul cavo è il vector clock del processo mittente nel momento in cui il messaggio è stato inviato. Le sue componenti dicono che:
  - $V[1] = 1$: il mittente sa del primo evento di $p_1$ (il messaggio in uscita con $V_{\mathit{out}} = [1,0,0,0]$).
  - $V[2] = 2$: il processo $p_2$ ha eseguito 2 eventi nel passato causale di questo messaggio.
  - $V[3] = 3$: il processo $p_3$ ha eseguito 3 eventi nel passato causale di questo messaggio.
  - $V[4] = 1$: il processo $p_4$ ha eseguito 1 evento nel passato causale di questo messaggio.

**Costruzione di un flusso causale valido:**

- $p_1$ invia $m_1$, con timestamp $[1,0,0,0]$, a $p_2$.
- $p_2$ riceve $m_1$, portando il proprio orologio a $[1,1,0,0]$, poi invia un messaggio a $p_3$ incrementando $V_2[2]$: il messaggio porta $[1,2,0,0]$.
- $p_4$ invia un messaggio $m_2$ a $p_3$: è il suo unico evento, quindi il messaggio porta $[0,0,0,1]$.
- $p_3$ riceve il messaggio di $p_2$, portando il proprio orologio a $[1,2,1,0]$, e poi il messaggio di $p_4$, arrivando a $[1,2,2,1]$. Infine $p_3$ invia a $p_1$ il messaggio $m_3$, incrementando $V_3[3]$ a $3$: il timestamp sul cavo è $V_{\mathit{in}} = [1, 2, 3, 1]$.

### Questa esecuzione è unica?

No, l'esecuzione **non** è unica. Intrecci diversi dei messaggi possono produrre timestamp vettoriali identici. Per esempio, scambiando l'ordine in cui $p_3$ riceve i due messaggi concorrenti $p_2 \to p_3$ e $p_4 \to p_3$ si ottiene un diagramma di esecuzione diverso, che produce esattamente lo stesso timestamp vettoriale $[1, 2, 3, 1]$ sul cavo.

**Domanda 2:** esiste un'esecuzione valida che giustifica $V_{\mathit{in}} = [1, 2, 3, 1]$ e in cui almeno un processo **non** invia alcun messaggio?

No, un'esecuzione del genere **non può** esistere.

**Dimostrazione:** si supponga per assurdo che esista un'esecuzione valida che dà $V_{\mathit{in}} = [1, 2, 3, 1]$ su $p_1$ e in cui un processo $p_k$ non invia alcun messaggio.

1. Si guardino le componenti di $V_{\mathit{in}} = [1, 2, 3, 1]$. Tutte e quattro sono strettamente positive ($V_{\mathit{in}}[j] > 0$ per ogni $j \in \{1, 2, 3, 4\}$).
2. Il processo $p_1$ un messaggio l'ha inviato, quello osservato con $V_{\mathit{out}}$, quindi $k \ne 1$. Perché $p_1$ riceva un timestamp vettoriale con $V_{\mathit{in}}[k] > 0$, l'informazione sugli eventi locali di $p_k$ deve essere arrivata causalmente a $p_1$ attraverso dei messaggi ($p_k \to \dots \to p_1$).
3. Se $p_k$ non invia alcun messaggio, nessuna informazione può uscire da $p_k$: nessun processo $p_j \ne p_k$ può mai portare la propria componente $V_j[k]$ sopra 0.
4. Quindi qualunque messaggio che arriva a $p_1$ porterebbe $V[k] = 0$, in contraddizione con il timestamp osservato, in cui $V_{\mathit{in}}[k] > 0$. Perciò ogni processo la cui componente è diversa da zero **deve** aver inviato almeno un messaggio. $\blacksquare$
