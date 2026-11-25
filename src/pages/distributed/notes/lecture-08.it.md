## L'astrazione di uniform reliable broadcast (URB)

### Qual è la differenza fondamentale fra agreement regolare e uniform agreement nelle primitive di broadcast?

La distinzione fra reliable broadcast regolare (RB) e uniform reliable broadcast (URB) sta tutta nella portata delle loro proprietà di agreement:

- **Agreement regolare:** garantisce che se un processo **corretto** consegna un messaggio $m$, allora ogni processo **corretto** prima o poi consegna $m$. Non pone alcun vincolo su ciò che i processi guasti fanno prima di andare in crash. Di conseguenza un processo guasto $p_f$ può consegnare un messaggio $m$ e andare in crash subito dopo, mentre nessun processo corretto consegna mai $m$.
- **Uniform agreement:** garantisce che se **un qualunque** processo $p$ (corretto o guasto) consegna un messaggio $m$, allora ogni processo **corretto** prima o poi consegna $m$. Questo impedisce ai processi guasti di agire su uno stato che i processi corretti sopravvissuti non osservano mai.

### Perché l'uniform agreement è essenziale in applicazioni reali come le macchine a stati replicate?

Si consideri uno scenario dalla lavagna in cui un client aggiorna un insieme di repliche di un database distribuito. Se la primitiva di broadcast dà solo l'agreement regolare, un messaggio $m$ del client (per esempio una transazione finanziaria o una scrittura sul database) potrebbe essere consegnato da una replica $p_1$ che va in crash subito dopo. Se nessuna replica corretta consegna mai $m$, $p_1$ ha eseguito una transizione di stato di cui il resto del sistema non sa nulla. Se $p_1$ ha comunicato questo stato a un attore esterno prima di andare in crash, il sistema è in uno stato incoerente da cui non può riprendersi. L'uniform reliable broadcast impedisce questo tipo di guasto: prima che un qualunque processo (anche uno che sta per andare in crash) consegni $m$, il sistema deve assicurarsi che tutti i processi corretti consegneranno $m$.

### Che relazione insiemistica c'è fra i messaggi consegnati dai processi guasti e da quelli corretti nell'uniform reliable broadcast?

L'uniform agreement implica direttamente che l'insieme dei messaggi consegnati da un qualunque processo guasto $p_f$ (indicato con $M_{p_f}$) è un sottoinsieme dell'insieme dei messaggi consegnati da un qualunque processo corretto $p_c$ (indicato con $M_{p_c}$): $$M_{p_f} \subseteq M_{p_c}$$ Con il reliable broadcast regolare, invece, $M_{p_f}$ e $M_{p_c}$ possono non essere confrontabili: $M_{p_f}$ può contenere messaggi del tutto assenti da $M_{p_c}$.

### Quali proprietà specificano l'astrazione di uniform reliable broadcast (URB)?

L'astrazione di uniform reliable broadcast ha due eventi, la richiesta `urbBroadcast(m)` e l'indicazione `urbDeliver(src, m)`, e quattro proprietà:

- **URB1 (validity):** se un processo corretto $p$ invia in broadcast un messaggio $m$, allora $p$ prima o poi consegna $m$.
- **URB2 (no duplication):** nessun messaggio $m$ è consegnato più di una volta da alcun processo.
- **URB3 (no creation):** se un processo consegna un messaggio $m$ con mittente $s$, allora $m$ è stato inviato in broadcast in precedenza dal processo $s$.
- **URB4 (uniform agreement):** se un messaggio $m$ è consegnato da **un qualunque** processo $p$ (corretto o guasto), allora $m$ prima o poi è consegnato da ogni processo corretto.

### Come si classificano le esecuzioni fra best-effort broadcast (BEB), reliable broadcast regolare (RB) e uniform reliable broadcast (URB)?

Si consideri un sistema di tre processi $\Pi = \{p_1, p_2, p_3\}$ in cui $p_1$ è guasto (va in crash) e $p_2, p_3$ sono corretti:

- **Esecuzione 1:** $p_1$ consegna i messaggi $\{m_{\text{orange}}, m_{\text{blue}}, m_{\text{purple}}\}$ e va in crash. I processi corretti $p_2$ e $p_3$ consegnano entrambi $\{m_{\text{orange}}, m_{\text{blue}}, m_{\text{purple}}\}$.
  - **Classificazione: uniform reliable broadcast (URB).** Qui $M_{p_1} \subseteq M_{p_2} = M_{p_3}$. Poiché l'insieme dei messaggi consegnati dal processo guasto è un sottoinsieme di quelli consegnati dai processi corretti, l'uniform agreement vale.
- **Esecuzione 2:** $p_1$ (guasto) consegna $\{m_{\text{purple}}, m_{\text{orange}}, m_{\text{blue}}, m_{\text{yellow}}\}$ e va in crash. Il processo corretto $p_2$ consegna $\{m_{\text{purple}}, m_{\text{orange}}, m_{\text{blue}}\}$. Il processo corretto $p_3$ consegna $\{m_{\text{purple}}, m_{\text{blue}}, m_{\text{orange}}, m_{\text{yellow}}\}$.
  - **Classificazione: solo best-effort broadcast (BEB)**, e solo se $m_{\text{yellow}}$ è stato inviato in broadcast dal processo guasto $p_1$. L'esecuzione viola l'agreement regolare, perché il processo corretto $p_3$ consegna $m_{\text{yellow}}$ ma il processo corretto $p_2$ non lo consegna mai. Se $m_{\text{yellow}}$ fosse stato inviato da un processo corretto, sarebbe violata anche la validity di BEB, e l'esecuzione non sarebbe corretta per nessuna delle tre astrazioni.
- **Esecuzione 3:** $p_1$ (guasto) consegna $\{m_{\text{purple}}, m_{\text{orange}}, m_{\text{blue}}\}$ e va in crash. Il processo corretto $p_2$ consegna $\{m_{\text{purple}}, m_{\text{yellow}}, m_{\text{orange}}, m_{\text{blue}}\}$. Il processo corretto $p_3$ consegna $\{m_{\text{purple}}, m_{\text{blue}}, m_{\text{orange}}, m_{\text{yellow}}\}$.
  - **Classificazione: uniform reliable broadcast (URB).** Il processo guasto $p_1$ ha consegnato un sottoinsieme dei messaggi consegnati dai processi corretti ($M_{p_1} \subseteq M_{p_2}$ e $M_{p_1} \subseteq M_{p_3}$), ed entrambi i processi corretti hanno consegnato esattamente lo stesso insieme di messaggi $\{m_{\text{purple}}, m_{\text{orange}}, m_{\text{blue}}, m_{\text{yellow}}\}$.
- **Esecuzione 4:** $p_1$ (guasto) consegna $\{m_{\text{orange}}, m_{\text{blue}}, m_{\text{purple}}, m_{\text{yellow}}\}$ e va in crash. I processi corretti $p_2$ e $p_3$ consegnano entrambi $\{m_{\text{purple}}, m_{\text{orange}}, m_{\text{blue}}\}$.
  - **Classificazione: reliable broadcast regolare (RB), ma non URB**, e solo se $m_{\text{yellow}}$ è stato inviato in broadcast dal processo guasto $p_1$. I due processi corretti consegnano lo stesso insieme, quindi l'agreement regolare vale, ma il processo guasto ha consegnato un messaggio che nessun processo corretto consegna, quindi l'uniform agreement è violato. Anche qui, se $m_{\text{yellow}}$ fosse stato inviato da un processo corretto, sarebbe violata la validity.

## All-Ack uniform reliable broadcast (modello fail-stop, con un perfect failure detector)

### Perché nell'uniform reliable broadcast un processo non può consegnare un messaggio appena lo riceve?

Nel best-effort broadcast o nel reliable broadcast regolare un processo può consegnare un messaggio $m$ all'applicazione appena lo riceve dalla rete. Nell'uniform reliable broadcast questo non è permesso. Se un processo $p$ consegna $m$ subito e va in crash un attimo dopo, $p$ ha consegnato $m$ mentre nessun altro processo può averlo ricevuto: è una violazione diretta dell'uniform agreement. Perciò URB separa il momento in cui un messaggio è ricevuto e ripetuto dal momento in cui è consegnato all'applicazione. Un processo deve tenere $m$ in un insieme `pending` e aspettare di avere le conferme (acknowledgment) che dimostrano che anche tutti i processi corretti hanno ricevuto e ripetuto $m$.

### Com'è strutturato l'algoritmo All-Ack di uniform reliable broadcast nel modello fail-stop?

L'algoritmo All-Ack URB funziona nel modello fail-stop, usando un modulo di best-effort broadcast (`beb`) e un perfect failure detector (`P`). Mantiene quattro variabili locali:

1. `delivered`: l'insieme dei messaggi già consegnati allo strato superiore.
2. `pending`: l'insieme delle coppie $(s, m)$ dei messaggi ricevuti o inviati in broadcast che aspettano abbastanza conferme per essere consegnati in sicurezza.
3. `correct`: l'insieme dei processi non rilevati come in crash, inizializzato a $\Pi$.
4. `ack`: un array che associa a ogni messaggio $m$ l'insieme degli identificatori dei processi che hanno confermato (ripetuto) $m$.

``` All-Ack Uniform Reliable Broadcast (fail-stop)
Module: AllAckURB (All-Ack Uniform Reliable Broadcast)
Uses:
  BestEffortBroadcast (beb)
  PerfectFailureDetector (P)

upon event < urb, Init > do
  delivered := ∅
  pending := ∅
  correct := Π
  forall m do
    ack[m] := ∅

upon event < urb, Broadcast | m > do
  pending := pending ∪ {(self, m)}
  trigger < beb, Broadcast | [DATA, self, m] >

upon event < beb, Deliver | p, [DATA, s, m] > do
  ack[m] := ack[m] ∪ {p}
  if (s, m) ∉ pending then
    pending := pending ∪ {(s, m)}
    trigger < beb, Broadcast | [DATA, s, m] >

upon event < P, Crash | p > do
  correct := correct \ {p}

upon event exists (s, m) ∈ pending do
  if correct ⊆ ack[m] and m ∉ delivered then
    delivered := delivered ∪ {m}
    trigger < urb, Deliver | s, m >
```

**Spiegazione riga per riga dell'algoritmo:**

- `upon event < urb, Init > do`: inizializza lo stato. `delivered` e `pending` sono vuoti. `correct` è inizializzato all'intero insieme dei processi $\Pi$. Per ogni possibile messaggio $m$, il suo insieme di conferme `ack[m]` è inizializzato a $\emptyset$.
- `upon event < urb, Broadcast | m > do`: scatta quando lo strato superiore chiede di inviare in broadcast il messaggio $m$. La coppia `(self, m)` viene aggiunta a `pending`, e si genera un best-effort broadcast di `[DATA, self, m]`.
- `upon event < beb, Deliver | p, [DATA, s, m] > do`: scatta quando il best-effort broadcast consegna un messaggio inviato dal processo $p$ con sorgente originale $s$ e contenuto $m$.
  - `ack[m] := ack[m] ∪ {p}`: aggiunge il processo $p$ ad `ack[m]`. In questo protocollo ripetere un messaggio vale come conferma implicita (ACK) che il processo $p$ ha visto $m$.
  - `if (s, m) ∉ pending then`: controlla se è la prima volta che il processo vede il messaggio $m$.
  - `pending := pending ∪ {(s, m)}`: aggiunge la coppia `(s, m)` a `pending`.
  - `trigger < beb, Broadcast | [DATA, s, m] >`: ripete il messaggio a tutti i processi con un best-effort broadcast. La ripetizione garantisce che, anche se il mittente originale $s$ è andato in crash, tutti i processi sopravvissuti ricevano $m$.
- `upon event < P, Crash | p > do`: scatta per opera del perfect failure detector $\mathcal{P}$ quando il processo $p$ va in crash.
  - `correct := correct \ {p}`: toglie da `correct` il processo in crash $p$. Così la condizione di consegna non resta ad aspettare per sempre l'ACK di un processo morto.
- `upon event exists (s, m) ∈ pending do`: una guardia valutata di continuo su tutti i messaggi in `pending`.
  - `if correct ⊆ ack[m] and m ∉ delivered then`: controlla che tutti i processi non rilevati come in crash (`correct`) abbiano confermato $m$ (`correct ⊆ ack[m]`), e che $m$ non sia già stato consegnato.
  - `delivered := delivered ∪ {m}`: segna $m$ come consegnato.
  - `trigger < urb, Deliver | s, m >`: consegna $m$, con sorgente originale $s$, allo strato superiore.

### Come si dimostra la correttezza dell'algoritmo All-Ack URB?

- **Validity (URB1):** se un processo corretto $p$ invia $m$ in broadcast, genera `< beb, Broadcast | [DATA, p, m] >`. Per la validity di BEB tutti i processi corretti consegnano il messaggio BEB, aggiungono $p$ ad `ack[m]` e generano la propria ripetizione BEB di $m$. Per la validity di BEB, $p$ riceve le ripetizioni di tutti i processi corretti. Per la strong completeness di $\mathcal{P}$, $p$ prima o poi rileva tutti i processi in crash, quindi non aspetta per sempre l'ACK di un processo in crash. Perciò `correct ⊆ ack[m]` prima o poi vale su $p$, e $p$ consegna $m$. Lo stesso argomento mostra, più in generale, che un processo corretto che vede un messaggio prima o poi lo consegna.
- **No duplication (URB2):** un messaggio $m$ è consegnato solo se $m \notin \mathit{delivered}$. Alla consegna $m$ viene subito aggiunto a `delivered`, e questo impedisce una seconda esecuzione di `urbDeliver`.
- **No creation (URB3):** un messaggio $m$ è messo in `pending` e consegnato solo se è stato ricevuto con `bebDeliver` come `[DATA, s, m]`. Per la proprietà di no creation di BEB, $m$ deve essere stato inviato in broadcast da $s$.
- **Uniform agreement (URB4):** per assurdo. Si supponga che un processo $p$ (corretto o guasto) consegni $m$, ma che un processo corretto $p_c$ non consegni mai $m$. Poiché $p$ consegna $m$, la guardia `correct ⊆ ack[m]` era vera sul processo $p$ al momento della consegna. Poiché $p_c$ è un processo corretto, $p_c \in \mathit{correct}$ in ogni istante (per la strong accuracy, un perfect failure detector non rileva mai un processo corretto). Quindi $p_c \in \mathit{ack}[m]$ sul processo $p$. Questo implica che $p_c$ ha eseguito in precedenza `< beb, Broadcast | [DATA, s, m] >`, cioè che $p_c$ ha visto $m$. Ma un processo corretto che vede un messaggio prima o poi lo consegna, come mostrato per la validity: $p_c$ consegna $m$, contro l'ipotesi.

### Qual è la complessità dell'algoritmo All-Ack URB in messaggi e in ritardi?

- **Complessità in messaggi:**
  - **Caso migliore (nessun crash):** $O(n^2)$ messaggi. Il mittente invia $m$ in broadcast ($n$ messaggi), e ogni processo che lo riceve ripete $m$ ($n \cdot n = n^2$ messaggi).
  - **Caso peggiore (con crash):** $O(n^2)$ messaggi.
- **Complessità in tempo (ritardi):**
  - **Caso migliore (nessun crash):** $2$ ritardi di messaggio. Un ritardo per il BEB iniziale dal mittente a tutti i processi, e uno perché tutti i processi ripetano $m$ a tutti.
  - **Caso peggiore (una catena di crash):** $O(n)$ ritardi di messaggio. È la catena di $n-1$ crash in cui ogni processo riceve $m$, ripete $m$ a un solo successore e va in crash prima di completare il broadcast.

## Majority-Ack uniform reliable broadcast (modello fail-silent, con $f < n/2$)

### Come si ottiene l'uniform reliable broadcast in un sistema asincrono senza failure detector?

In un modello asincrono e fail-silent un perfect failure detector $\mathcal{P}$ non si può costruire. Se l'algoritmo All-Ack venisse eseguito senza $\mathcal{P}$, dopo un solo crash `correct` resterebbe uguale a $\Pi$: i processi sopravvissuti aspetterebbero per sempre l'ACK del processo morto, `correct ⊆ ack[m]` non diventerebbe mai vero e la validity sarebbe violata. Per superare il problema senza failure detector si lavora sotto due ipotesi:

1. **Modello asincrono e fail-silent:** i ritardi di comunicazione sono illimitati, e i crash non si possono rilevare.
2. **Una maggioranza di processi corretti ($f < n/2$):** il numero $f$ di processi che vanno in crash è strettamente minore della metà della dimensione $n$ del sistema: $$f < \frac{n}{2}$$ È un'ipotesi ragionevole: è un evento raro che vada in crash più di metà del sistema.

### Che cos'è un quorum, e che cos'è la proprietà di intersezione dei quorum?

Un **quorum** $Q$ in un sistema di $n$ processi è un qualunque sottoinsieme di processi che contiene una maggioranza stretta: $$|Q| \ge \left\lfloor \frac{n}{2} \right\rfloor + 1$$

- **Proprietà di intersezione dei quorum:** due quorum qualunque $Q_1, Q_2 \subseteq \Pi$ si intersecano in almeno un processo: $$Q_1 \cap Q_2 \neq \emptyset$$
- **Dimostrazione:** sia $n$ il numero totale di processi. Ogni quorum contiene almeno $\lfloor n/2 \rfloor + 1$ processi. La somma delle dimensioni di due quorum è $|Q_1| + |Q_2| \ge 2(\lfloor n/2 \rfloor + 1) > n$. Se i due quorum non si intersecassero, conterrebbero più di $n$ processi distinti: per il principio dei cassetti, $Q_1$ e $Q_2$ devono avere almeno un processo in comune.
- **Conseguenza per la tolleranza ai guasti:** sotto l'ipotesi $f < n/2$, l'insieme dei processi corretti di qualunque esecuzione è esso stesso un quorum $Q_{\text{correct}}$. Quindi qualunque quorum $Q_{\text{ack}}$ di conferme raccolto da un processo interseca $Q_{\text{correct}}$ in almeno un processo $p_{\text{intersect}} \in Q_{\text{ack}} \cap Q_{\text{correct}}$. Questo garantisce che qualunque maggioranza di ACK contiene almeno un processo corretto, anche se nessuno sa quali processi sono corretti.

Ne seguono le due idee dell'algoritmo. Prima: se so che un processo corretto ha visto un messaggio, posso consegnarlo in sicurezza. Seconda: se un quorum di processi ha visto un messaggio, almeno uno di loro è corretto, quindi il messaggio si può consegnare in sicurezza.

### Come si realizza l'algoritmo Majority-Ack URB?

``` Majority-Ack Uniform Reliable Broadcast (fail-silent, f < n/2)
Module: MajorityAckURB (Majority-Ack Uniform Reliable Broadcast)
Uses:
  BestEffortBroadcast (beb)

upon event < urb, Init > do
  delivered := ∅
  pending := ∅
  forall m do
    ack[m] := ∅

upon event < urb, Broadcast | m > do
  pending := pending ∪ {(self, m)}
  trigger < beb, Broadcast | [DATA, self, m] >

upon event < beb, Deliver | p, [DATA, s, m] > do
  ack[m] := ack[m] ∪ {p}
  if (s, m) ∉ pending then
    pending := pending ∪ {(s, m)}
    trigger < beb, Broadcast | [DATA, s, m] >

upon event exists (s, m) ∈ pending do
  if |ack[m]| > n / 2 and m ∉ delivered then
    delivered := delivered ∪ {m}
    trigger < urb, Deliver | s, m >
```

**Spiegazione riga per riga dell'algoritmo:**

- `upon event < urb, Init > do`: inizializza lo stato. `delivered` e `pending` sono posti a $\emptyset$. `ack[m]` è inizializzato a $\emptyset$ per ogni $m$. Si noti che non ci sono né la variabile `correct` né il modulo di failure detector: a parte questo e la condizione di consegna, l'algoritmo è lo stesso di All-Ack.
- `upon event < urb, Broadcast | m > do`: aggiunge `(self, m)` a `pending` e invia `[DATA, self, m]` con il best-effort broadcast.
- `upon event < beb, Deliver | p, [DATA, s, m] > do`: aggiunge il mittente $p$ ad `ack[m]`. Se `(s, m)` non è in `pending`, memorizza `(s, m)` in `pending` e ripete `[DATA, s, m]` a tutti i processi con BEB.
- `upon event exists (s, m) ∈ pending do`:
  - `if |ack[m]| > n / 2 and m ∉ delivered then`: la soglia cruciale. Invece di controllare `correct ⊆ ack[m]`, controlla se il numero di processi in $\mathit{ack}[m]$ supera la metà del totale ($|\mathit{ack}[m]| > n/2$, cioè $|\mathit{ack}[m]| \ge \lfloor n/2 \rfloor + 1$).
  - `delivered := delivered ∪ {m}`: segna $m$ come consegnato.
  - `trigger < urb, Deliver | s, m >`: consegna $m$ allo strato superiore.

### Perché aspettare $|\mathit{ack}[m]| > n/2$ garantisce l'uniform agreement, e perché una soglia più alta bloccherebbe l'algoritmo?

1. **Perché $|\mathit{ack}[m]| > n/2$ garantisce l'uniform agreement:** se un qualunque processo $p$ (corretto o guasto) consegna $m$, allora $p$ ha raccolto un quorum $Q_{\text{ack}} = \mathit{ack}[m]$ di ACK con $|Q_{\text{ack}}| > n/2$. Per la proprietà di intersezione dei quorum, $Q_{\text{ack}}$ interseca l'insieme dei processi corretti $Q_{\text{correct}}$ in almeno un processo $p_{\text{intersect}} \in Q_{\text{ack}} \cap Q_{\text{correct}}$. Il processo $p_{\text{intersect}}$ è corretto e ha ripetuto $m$ con BEB a tutti i processi. Per la validity di BEB tutti i processi corretti ricevono $m$, registrano i mittenti in `ack[m]` e ripetono $m$. Prima o poi ogni processo corretto raccoglie gli ACK di tutti i processi corretti ($|Q_{\text{correct}}| > n/2$), per cui $|\mathit{ack}[m]| > n/2$ diventa vero su tutti i processi corretti, che allora consegnano $m$.
2. **Perché aspettare $|\mathit{ack}[m]| \ge n/2 + 2$ blocca l'algoritmo:** si supponga $n = 10$ e che $f = 4$ processi vadano in crash al tempo $t = 0$. I processi sopravvissuti sono $n - f = 10 - 4 = 6$, e la soglia $n/2 + 1$ vale $6$. Se l'algoritmo usasse la soglia $n/2 + 2 = 7$, anche se tutti i 6 processi corretti sopravvissuti ricevono, ripetono e confermano il messaggio $m$, il massimo numero di ACK che un processo può raccogliere è $6$. Poiché $6 < 7$, la condizione $|\mathit{ack}[m]| \ge 7$ non è mai soddisfatta: tutti i processi corretti tengono $m$ in `pending` per sempre, violando la validity.

Lo stesso ragionamento risponde alla domanda su che cosa succede senza una maggioranza di processi corretti, per esempio quando i processi guasti sono $n/2 + 1$: per essere sicuri che un ACK venga da un processo corretto bisognerebbe aspettare più ACK di quanti sono i processi guasti, ma una volta che tutti i guasti sono andati in crash quegli ACK non arrivano mai, e la validity è violata.

### Qual è il risultato di impossibilità sull'uniform reliable broadcast nei sistemi asincroni fail-silent?

In un sistema asincrono e fail-silent, se il numero di crash può essere $f \ge n/2$, **l'uniform reliable broadcast è impossibile**. L'intuizione è un argomento di partizione. Si dividano i processi in due metà. Poiché un'intera metà può andare in crash, i processi della prima metà devono poter consegnare un messaggio senza aver ricevuto nulla dalla seconda metà, i cui messaggi potrebbero essere solo molto lenti. Ma una volta che hanno consegnato, i processi della prima metà possono andare tutti in crash, e i messaggi che hanno inviato non hanno la garanzia di arrivare (un perfect link garantisce la consegna solo se il mittente è corretto): la seconda metà non consegna mai il messaggio, e l'uniform agreement è violato. La prossima lezione sviluppa questo argomento.

Riassumendo: l'uniform reliable broadcast si può realizzare in un sistema sincrono con un perfect failure detector, e in un sistema asincrono assumendo una maggioranza di processi corretti.

## Eager reliable broadcast e indipendenza dai failure detector

### Serve un failure detector per ottenere il reliable broadcast regolare (non uniforme)?

No. Il reliable broadcast regolare (RB) si può realizzare in un sistema asincrono e fail-silent senza alcun failure detector e senza alcuna ipotesi sul numero di guasti ($f < n$). È ciò che fa l'algoritmo **Eager Reliable Broadcast**.

### Come funziona l'algoritmo Eager Reliable Broadcast?

``` Eager Reliable Broadcast (il mittente consegna subito)
Module: EagerRB (Eager Regular Reliable Broadcast)
Uses:
  BestEffortBroadcast (beb)

upon event < rb, Init > do
  delivered := ∅

upon event < rb, Broadcast | m > do
  delivered := delivered ∪ {m}
  trigger < rb, Deliver | self, m >
  trigger < beb, Broadcast | [DATA, self, m] >

upon event < beb, Deliver | p, [DATA, s, m] > do
  if m ∉ delivered then
    delivered := delivered ∪ {m}
    trigger < rb, Deliver | s, m >
    trigger < beb, Broadcast | [DATA, s, m] >
```

**Spiegazione riga per riga dell'algoritmo:**

- `upon event < rb, Init > do`: pone `delivered` a $\emptyset$.
- `upon event < rb, Broadcast | m > do`: scatta quando il mittente invia $m$ in broadcast.
  - `delivered := delivered ∪ {m}`: aggiunge subito $m$ a `delivered`.
  - `trigger < rb, Deliver | self, m >`: consegna subito $m$ in locale allo strato superiore. È una piccola variante dell'algoritmo della lezione precedente, in cui il mittente consegna $m$ quando riceve la propria copia da BEB: la copia che torna indietro più tardi viene semplicemente filtrata da `delivered`.
  - `trigger < beb, Broadcast | [DATA, self, m] >`: invia $m$ con BEB a tutti i processi.
- `upon event < beb, Deliver | p, [DATA, s, m] > do`: scatta quando BEB consegna `[DATA, s, m]` dal processo $p$.
  - `if m ∉ delivered then`: controlla se $m$ è visto per la prima volta.
  - `delivered := delivered ∪ {m}`: segna $m$ come consegnato.
  - `trigger < rb, Deliver | s, m >`: consegna $m$, con sorgente originale $s$, allo strato superiore.
  - `trigger < beb, Broadcast | [DATA, s, m] >`: ripete subito $m$ a tutti i processi. Questa inondazione garantisce che, se un processo corretto consegna $m$, tutti gli altri processi corretti ricevano $m$ attraverso BEB e lo consegnino.

### Qual è il compromesso fra gli algoritmi di reliable broadcast in messaggi e in ritardi?

| Protocollo | Modello e ipotesi | Messaggi, caso migliore | Messaggi, caso peggiore | Ritardi, caso migliore | Ritardi, caso peggiore |
|---|---|---|---|---|---|
| Lazy RB | Fail-stop ($\mathcal{P}$) | $O(n)$ | $O(n^2)$ | $1$ | $O(n)$ |
| Eager RB | Fail-silent ($f < n$) | $O(n^2)$ | $O(n^2)$ | $1$ | $O(n)$ |
| All-Ack URB | Fail-stop ($\mathcal{P}$) | $O(n^2)$ | $O(n^2)$ | $2$ | $O(n)$ |
| Majority-Ack URB | Fail-silent ($f < n/2$) | $O(n^2)$ | $O(n^2)$ | $2$ | $O(n)$ |

## Cenni al broadcast su spanning tree

### Come riducono i sistemi reali la complessità $O(n^2)$ in messaggi dell'inondazione?

In una rete reale ripetere ogni messaggio a tutti gli $n$ processi genera $O(n^2)$ messaggi: un **broadcast storm** che satura interfacce di rete e router, e che nei sistemi grandi va evitato. Per impedirlo, i sistemi reali costruiscono uno **spanning tree** sul grafo della rete, cioè un albero che copre l'intero grafo (qualunque spanning tree ha $n-1$ archi). I messaggi in broadcast viaggiano solo lungo gli archi dello spanning tree: un nodo che riceve un messaggio lo inoltra solo al padre e ai figli nell'albero. Questo riduce la complessità in messaggi da $O(n^2)$ a $O(n)$ ($n-1$ messaggi), e allo stesso modo le conferme si possono raccogliere lungo l'albero, uno strato alla volta, con un numero lineare di messaggi. Se un nodo dell'albero va in crash, dei meccanismi di riparazione riconfigurano lo spanning tree in modo dinamico.

## Esercizi

Gli esercizi sulla media degli orologi dei vicini, sui vector clock con un numero sconosciuto di processi, sull'incremento dopo l'invio, sul collegamento che perde al più $k$ messaggi e sul FIFO link con consegna immediata sono nella Lezione 7. Qui ci sono i rimanenti.

### Come si verificano delle affermazioni sugli eventi con i vector clock?

Si consideri un'esecuzione con 4 processi $\Pi = \{p_1, p_2, p_3, p_4\}$. Applicate all'esecuzione le regole dei vector clock, gli eventi $e_1, e_2, e_3$ hanno i timestamp:

- $V(e_1) = [2, 0, 0, 0]$
- $V(e_2) = [1, 1, 0, 0]$
- $V(e_3) = [4, 4, 4, 3]$

Quali delle seguenti affermazioni sono vere?

- **Affermazione A:** $e_1 \to e_2$ ($e_1$ è avvenuto prima di $e_2$).
  - **Falsa.** Perché valga $e_1 \to e_2$ servirebbe $V(e_1) \le V(e_2)$ su ogni componente. Confrontando $V(e_1)[1] = 2$ e $V(e_2)[1] = 1$ si vede che $2 > 1$. Confrontando $V(e_1)[2] = 0$ e $V(e_2)[2] = 1$ si vede che $0 < 1$. Poiché nessuno dei due vettori è minore o uguale all'altro su tutte le componenti, $e_1$ ed $e_2$ sono **concorrenti** ($e_1 \parallel e_2$).
- **Affermazione B:** $e_1 \to e_3$ ($e_1$ è avvenuto prima di $e_3$).
  - **Vera.** Confrontando $V(e_1) = [2, 0, 0, 0]$ con $V(e_3) = [4, 4, 4, 3]$ componente per componente: $2 \le 4$, $0 \le 4$, $0 \le 4$, $0 \le 3$, e almeno una componente è strettamente minore ($2 < 4$). Quindi $V(e_1) < V(e_3)$, che dimostra $e_1 \to e_3$.
- **Affermazione C:** $e_2 \to e_3$ ($e_2$ è avvenuto prima di $e_3$).
  - **Vera.** Confrontando $V(e_2) = [1, 1, 0, 0]$ con $V(e_3) = [4, 4, 4, 3]$ componente per componente: $1 \le 4$, $1 \le 4$, $0 \le 4$, $0 \le 3$, con disuguaglianza stretta su tutte le componenti. Quindi $V(e_2) < V(e_3)$, che dimostra $e_2 \to e_3$.

### Che cosa succede se il Lazy Reliable Broadcast registra un messaggio solo quando la sua sorgente è andata in crash? (esercizio d'esame)

È un tipico esercizio d'esame: viene dato il codice di un algoritmo visto a lezione insieme a una versione modificata, e per ogni proprietà dell'astrazione bisogna dire se vale ancora, giustificando la risposta, oppure mostrare un'esecuzione che la viola.

Si consideri l'algoritmo Lazy Reliable Broadcast della lezione precedente, modificato spostando l'istruzione `from[s] := from[s] ∪ {m}` dentro il blocco `if s ∉ correct then`, in modo che `from[s]` venga aggiornato **solo** se la sorgente $s$ è già stata rilevata come in crash:

``` Lazy Reliable Broadcast: l'handler di consegna modificato
Upon event < beb, Deliver | p_j, [DATA, s, m] > do:
    if m ∉ from[s] then:
        trigger < rb, Deliver | s, m >;
        if s ∉ correct then:
            from[s] := from[s] ∪ {m};
            trigger < beb, Broadcast | [DATA, s, m] >;
```

Il sistema è asincrono ma dotato di un perfect failure detector, e ha quattro processi, di cui al più tre possono guastarsi. Il metodo è guardare che cosa faceva la riga modificata nell'algoritmo originale: `from[s]` aveva due scopi, filtrare i duplicati e ricordare i messaggi di una sorgente per ripeterli quando va in crash.

- **Validity: vale.** Se un processo corretto $p$ invia $m$ in broadcast, esegue il BEB e riceve la propria copia. In quel momento $m \notin \mathit{from}[p]$, quindi il test riesce e $p$ consegna $m$.
- **Agreement: violata.** Controesempio:
  - Il processo $p_2$ invia $m$ in broadcast con BEB e va in crash a metà del broadcast, dopo aver inviato $m$ solo al processo $p_0$.
  - $p_0$ riceve $m$ da BEB. Poiché $p_2$ non è ancora stato rilevato dal failure detector di $p_0$ ($p_2 \in \mathit{correct}$), $p_0$ consegna $m$, ma per via della modifica **non** aggiunge $m$ a $\mathit{from}[p_2]$.
  - Un attimo dopo il failure detector di $p_0$ rileva il crash di $p_2$ (`< P, Crash | p_2 >`).
  - $p_0$ esegue l'handler del crash: `forall m ∈ from[p_2] do trigger < beb, Broadcast | [DATA, p_2, m] >`.
  - Poiché $m$ non è mai stato aggiunto a $\mathit{from}[p_2]$, l'insieme è **vuoto**: $p_0$ **non ripete** $m$.
  - Il processo corretto $p_1$ non riceve mai $m$, né da $p_2$ né da $p_0$, e non lo consegna mai.
  - Il processo corretto $p_0$ ha consegnato $m$, mentre il processo corretto $p_1$ non lo consegna mai: l'agreement è violata.
- **No duplication: violata.** Il controesempio parte dalla stessa situazione, in cui un processo consegna $m$ senza registrarlo:
  - Il processo $p_1$ invia $m$ in broadcast e poi va in crash. La copia per $p_0$ arriva in fretta, quella per $p_2$ è lenta.
  - $p_0$ riceve $m$ mentre $p_1 \in \mathit{correct}$: consegna $m$ e non lo aggiunge a $\mathit{from}[p_1]$.
  - $p_2$ prima rileva il crash di $p_1$ e solo dopo riceve $m$. Ora la sorgente non è in `correct`: $p_2$ consegna $m$, lo registra e ripete `[DATA, p_1, m]` con BEB.
  - La ripetizione di $p_2$ arriva a $p_0$. Poiché su $p_0$ vale $m \notin \mathit{from}[p_1]$, il test riesce di nuovo e $p_0$ consegna $m$ **una seconda volta**.

### Che cosa succede ad All-Ack URB se il failure detector non è perfetto?

Si consideri l'algoritmo All-Ack Uniform Reliable Broadcast, e si supponga che una delle due proprietà del perfect failure detector sia violata.

- **È violata la strong accuracy** (un processo può essere rilevato anche se è vivo): si viola l'uniform agreement. In un sistema con due processi, $p_0$ invia $m$ in broadcast e riceve la propria copia. Il failure detector segnala a torto che $p_1$ è andato in crash, quindi $p_1$ viene tolto da `correct`, e $p_0$ consegna $m$ senza aspettare l'ACK di $p_1$. Poi $p_0$ va in crash, e i messaggi che ha inviato muoiono con lui. Il processo corretto $p_1$ non vede mai $m$: un processo ha consegnato un messaggio che un processo corretto non consegna mai.
- **È violata la strong completeness** (un processo può andare in crash senza essere mai rilevato): si viola la validity. In un sistema con due processi, $p_1$ va subito in crash e $p_0$ invia $m$ in broadcast. Poiché il crash di $p_1$ non viene mai segnalato, $p_1$ resta in `correct`, e $p_0$ aspetta per sempre un ACK che non arriverà mai: il processo corretto $p_0$ non consegna mai il proprio messaggio.
