const i=`## Panoramica del corso e obiettivi formativi

### Che cosa si impara in questo corso?

L'obiettivo principale del corso è dare una base rigorosa e formale per progettare, modellare e analizzare protocolli distribuiti. Il calcolo distribuito richiede un cambio di paradigma rispetto al calcolo sequenziale o parallelo tradizionale, perché i componenti si guastano in modo indipendente e i ritardi di comunicazione sono imprevedibili.

Le competenze sviluppate durante il corso sono:

- **Modellare un sistema:** definire formalmente le ipotesi alla base di un ambiente distribuito: capacità di calcolo dei processi, topologia di comunicazione, ipotesi sui tempi e tipi di guasto.
- **Scomporre un problema:** dividere un obiettivo distribuito complesso in blocchi di base e in astrazioni (per esempio, distinguere l'atomic broadcast dal consenso o dai registri distribuiti).
- **Specificare le astrazioni:** definire proprietà formali e non ambigue (safety e liveness) che un componente distribuito astratto deve soddisfare.
- **Progettare protocolli tolleranti ai guasti:** costruire algoritmi che realizzano le astrazioni specificate nonostante crash dei processi, guasti arbitrari e ritardi della rete.
- **Coordinare entità di calcolo:** gestire insiemi di entità autonome che devono cooperare per portare a termine un compito comune senza un coordinatore centrale né una memoria globale.

## Definizioni e concetti di base dei sistemi distribuiti

### Che cos'è un sistema distribuito?

Per averne un quadro completo si esaminano tre definizioni complementari di sistema distribuito:

1. **Definizione funzionale classica:** un sistema distribuito è un insieme di entità separate nello spazio, ciascuna con una propria capacità di calcolo, che possono comunicare e coordinarsi fra loro per raggiungere un obiettivo comune.
2. **Definizione di Lamport, centrata sui guasti:** Leslie Lamport ha definito un sistema distribuito come "un sistema in cui il guasto di un computer di cui non conoscevi nemmeno l'esistenza può rendere inutilizzabile il tuo". La definizione mette in luce la dipendenza inevitabile da componenti remoti e la necessità della tolleranza ai guasti.
3. **Definizione per esempi tipici:** sistemi come il World Wide Web, i cluster di workstation, le reti di sistemi embedded (per esempio i computer ridondanti di un aereo), le reti peer-to-peer (P2P) per la condivisione di file, le blockchain e i registri distribuiti sono sistemi distribuiti per la loro separazione nello spazio, l'assenza di un controllo centrale e gli obiettivi operativi condivisi.

### Quali sono i punti comuni a tutte le definizioni di sistema distribuito?

Da tutte le definizioni, formali ed empiriche, emergono tre pilastri:

- **Insieme di entità:** il sistema è fatto di unità di calcolo distinte, che possono essere macchine fisiche, macchine virtuali o thread software isolati.
- **Separazione nello spazio:** le entità sono distribuite, cioè separate nello spazio e indipendenti, ognuna con i propri guasti. Il calcolo locale si considera gratuito, mentre ogni interazione avviene solo attraverso canali di comunicazione.
- **Obiettivo comune e assenza di coordinamento centrale:** le entità comunicano, si coordinano e condividono risorse per risolvere un problema comune (per esempio la replicazione dello stato, il consenso o l'allocazione di risorse) solo interagendo alla pari, senza un supervisore onnisciente né un orologio globale.

In questo corso l'attenzione va soprattutto alle **reti statiche di processi**, in cui l'insieme delle entità partecipanti è fisso e noto *a priori*, e che comunicano scambiandosi messaggi su collegamenti statici.

## Esempi di sistemi distribuiti

### Quali sono esempi pratici ed emergenti di sistemi distribuiti?

Oltre alle tradizionali infrastrutture client-server e cloud, i sistemi distribuiti comprendono hardware avanzato e astrazioni fisiche:

- **Reti overlay P2P:** sistemi come BitTorrent o Gnutella, in cui nodi autonomi condividono dati senza un'infrastruttura dedicata, con un ricambio continuo di nodi che se ne vanno senza avvisare.
- **Materia programmabile (M-Blocks del MIT):** sistemi fisici modulari fatti di cubi robotici autonomi (gli M-Blocks). Ogni blocco ha una propria capacità di calcolo, può muoversi e comunica solo con i vicini immediati nello spazio, per cambiare dinamicamente la forma geometrica dell'insieme.
- **Sciami di particelle su una griglia:** particelle autonome disposte su una griglia discreta, che comunicano solo con i nodi vicini per organizzarsi in formazioni globali complesse (per esempio un esagono regolare) senza una guida globale.

## Vista locale e informazione non aggiornata

### Che cosa si sa della rete all'inizio?

All'inizializzazione un singolo processo $p_i$ non ha alcuna conoscenza globale della topologia, dello stato o dell'avanzamento degli altri processi della rete. Conosce solo il proprio identificatore univoco $i$ e la propria interfaccia locale (per esempio i suoi buffer di rete).

### Che cos'è la vista locale?

La **vista locale** di un processo $p_i$ è l'insieme di tutte le informazioni che $p_i$ ha osservato direttamente o ricevuto con i messaggi in arrivo fino all'istante corrente. Poiché l'informazione si propaga solo con lo scambio di messaggi, la percezione che un processo ha dello stato globale è per sua natura locale e incompleta.

### Qual è il problema dell'attendere la comunicazione?

La trasmissione dei messaggi su reti fisiche subisce ritardi non nulli di propagazione, di accodamento e di elaborazione. Di conseguenza:

- La vista locale è per sua natura **non aggiornata** (*stale*): un messaggio ricevuto al tempo $t$ riflette lo stato del mittente in un istante passato $t_{\\mathit{send}} < t$.
- Un processo non può distinguere fra un processo remoto che esegue molto lentamente e uno che è andato in crash.
- Più la comunicazione di rete è lenta o imprevedibile, più la vista locale è vecchia, e questo pone limiti fondamentali ai problemi distribuiti che si possono risolvere.

## Tolleranza ai guasti e problemi fondamentali

### Che cos'è il problema del consenso?

Il **problema del consenso** è una primitiva fondamentale del calcolo distribuito. Dato un insieme di processi in cui ogni processo $p_i$ propone un valore iniziale $v_i \\in \\{0, 1\\}$ (per esempio $0 \\equiv \\text{abort}$, $1 \\equiv \\text{commit}$ per una transazione atomica su un database), tutti i processi corretti devono decidere in modo irrevocabile un unico valore comune $v \\in \\{0, 1\\}$ tale che:

1. **Agreement:** due processi corretti non decidono mai valori diversi.
2. **Validity:** il valore deciso $v$ deve essere stato proposto da almeno un processo.
3. **Termination:** ogni processo corretto prima o poi decide un valore.

### Perché un protocollo con un solo messaggio fallisce nel problema dei due generali?

Si considerino due generali, Alice ($p_0$) e Bob ($p_1$), su due colline separate che dominano un forte nemico. Devono accordarsi per attaccare insieme ($1$) o ritirarsi ($0$). Comunicano con un messaggero a piedi su un canale inaffidabile, in cui i messaggi possono essere intercettati o persi.

Se $p_0$ invia un solo messaggio $m = \\text{"Attack at 10:00"}$ a $p_1$:

- $p_0$ non può decidere di attaccare subito dopo aver inviato $m$, perché $m$ potrebbe essere intercettato, lasciando $p_1$ all'oscuro.
- Se $p_1$ riceve $m$, $p_1$ non può attaccare in sicurezza, perché sa che $p_0$ non è sicuro che $m$ sia arrivato. Se $p_1$ attacca da solo, viene sconfitto.

### Aggiungere una conferma (ACK) risolve il problema?

Per ridurre l'incertezza sul primo messaggio, $p_1$ rimanda a $p_0$ una conferma $m_{\\mathit{ack}} = \\text{"ACK"}$.

- Quando $p_1$ invia $m_{\\mathit{ack}}$, $p_1$ non sa se $m_{\\mathit{ack}}$ arriverà a $p_0$.
- Se $m_{\\mathit{ack}}$ si perde lungo il percorso, $p_0$ non attacca. Quindi, se $p_1$ attacca appena inviato $m_{\\mathit{ack}}$, rischia di attaccare da solo.
- Perciò $p_1$ resta indeciso finché non riceve da $p_0$ una conferma dell'ACK ($m_{\\mathit{ack2}}$).

### Una conferma della conferma risolve il problema?

Se $p_0$ invia $m_{\\mathit{ack2}} = \\text{"ACK of ACK"}$, $p_0$ si trova rispetto a $m_{\\mathit{ack2}}$ nella stessa identica incertezza in cui era $p_1$ rispetto a $m_{\\mathit{ack}}$: $p_0$ non può attaccare finché non riceve $m_{\\mathit{ack3}}$ da $p_1$.

Si arriva così a un regresso infinito di conferme necessarie ($\\text{ACK} \\to \\text{ACK}^2 \\to \\text{ACK}^3 \\to \\dots$). Per induzione sul numero di messaggi, **il problema dei due generali non si può risolvere in modo deterministico su un canale inaffidabile**, nemmeno in un'esecuzione in cui nessun messaggio va davvero perso, perché nessuno dei due processi può mai eliminare la propria incertezza sulla vista locale dell'altro.

### Il tempo può aiutare a risolvere il problema dei due generali?

Il tempo fisico non risolve questa impossibilità su una rete asincrona, perché gli orologi fisici sono per loro natura imprecisi e soggetti a deriva. Senza un orologio globale e senza un limite superiore ai ritardi di trasmissione dei messaggi, un timeout non può distinguere un messaggio perso da un messaggio che è solo molto lento.

## Evoluzione storica e tappe della dependability

### Qual è la storia della dependability nel calcolo distribuito?

La dependability è la capacità di un sistema distribuito di fornire un servizio di cui ci si può fidare a ragione, nonostante i guasti interni:

- **1978 (progetto SIFT della NASA):** Software Implemented Fault Tolerance (SIFT) studiava architetture di controllo per aerei con computer ridondanti che comunicano su un bus condiviso, e individuò nell'accordo tollerante ai guasti il requisito chiave per evitare un singolo punto di guasto.
- **1982 (problema dei generali bizantini):** Leslie Lamport, Robert Shostak e Marshall Pease definirono formalmente il problema dei generali bizantini e stabilirono i limiti della tolleranza ai guasti ($n \\ge 3f + 1$ processi con messaggi non autenticati).
- **1985 (teorema di impossibilità FLP):** Fischer, Lynch e Paterson pubblicarono il teorema FLP, che dimostra che **nessun algoritmo deterministico può garantire il consenso in un sistema asincrono in presenza anche di un solo crash** ($f \\ge 1$).
- **1996 (failure detector):** Tushar Deepak Chandra e Sam Toueg introdussero l'astrazione dei **failure detector inaffidabili** ($\\mathcal{P}$, $\\diamond\\mathcal{P}$), che separa le ipotesi sui tempi e sulla sincronia dal progetto degli algoritmi.
- **1999 (PBFT):** Miguel Castro e Barbara Liskov presentarono Practical Byzantine Fault Tolerance (PBFT), mostrando che la replicazione che tollera guasti bizantini può essere praticabile: un numero quadratico di messaggi ($O(n^2)$) per richiesta, con avanzamento garantito in condizioni di sincronia parziale.

## Metodologia: modelli, astrazioni e specifiche

### Che cos'è il calcolo distribuito?

Il calcolo distribuito è, in sostanza, una lotta contro l'incertezza, che ha due fonti:

1. **Asincronia:** ritardi di trasmissione dei messaggi e velocità di esecuzione dei processi imprevedibili.
2. **Guasti:** crash dei processi, perdite di messaggi o comportamenti malevoli imprevedibili.

L'unico strumento che un processo ha per contrastare queste forze è la sua **vista locale**, costruita un po' alla volta con lo scambio di messaggi.

### Perché servono modelli formali, astrazioni e specifiche?

Sviluppare algoritmi distribuiti a intuito, senza un quadro formale, porta a casi limite sottili e non gestiti e ad affermazioni di correttezza infondate. La metodologia rigorosa richiesta ha quattro passi:

1. **Definire un modello di sistema:** specificare regole esatte per processi, canali e tipi di guasto.
2. **Formalizzare un'astrazione:** definire un oggetto astratto, o l'interfaccia di un problema, con proprietà non ambigue (safety e liveness).
3. **Progettare un protocollo distribuito:** costruire la logica precisa delle transizioni di stato che realizza la specifica.
4. **Dare una dimostrazione formale:** dimostrare che il protocollo soddisfa tutte le proprietà della specifica in ogni esecuzione valida.

## Applicazioni reali e il caso di studio Tangaroa

### Perché non ci si può fidare di blockchain o protocolli che non poggiano su algoritmi formali?

Nella pratica industriale le implementazioni improvvisate falliscono spesso perché manca una verifica formale:

- **Il caso Tangaroa:** J.P. Morgan si proponeva di costruire una blockchain aziendale usando **Tangaroa**, un protocollo open source presentato come una variante di Raft tollerante ai guasti bizantini.
- **L'avvertimento sull'olio di serpente:** il crittografo Christian Cachin pubblicò un'analisi ("Blockchains and Consensus Protocols: Snake Oil Warning") che mostrava come Tangaroa non mantenesse la safety in semplici scenari bizantini: era nato come progetto studentesco e non era mai stato dimostrato corretto.
- **La lezione:** i sistemi distribuiti di livello industriale (per esempio Google Chubby, Apache ZooKeeper, Kafka e le blockchain aziendali) devono poggiare solo su primitive di consenso e di replicazione dimostrate formalmente.

## Modulo M1: modello di sistema e formalismo dei processi

### Che cos'è un modello di sistema?

Un **sistema** è fatto di un insieme statico $\\Pi$ di $n$ processi con identità uniche e distinte: $$\\Pi = \\{p_0, p_1, p_2, \\dots, p_{n-1}\\}$$ La dimensione $n = |\\Pi|$ è fissa e nota a tutti i processi fin dall'inizializzazione.

### Che cos'è un grafo di comunicazione?

I processi comunicano scambiandosi messaggi su un grafo di comunicazione orientato $G = (\\Pi, E)$, dove $\\Pi$ è l'insieme dei processi (i vertici) e $E \\subseteq \\Pi \\times \\Pi$ è l'insieme dei collegamenti punto-punto orientati (gli archi). Salvo diversa indicazione, il grafo di comunicazione $G$ si assume **completo** (una clique): ogni processo $p_i$ può inviare messaggi direttamente a qualunque processo $p_j$.

### Che cos'è un modello di processo?

Formalmente, un processo $p_j \\in \\Pi$ è modellato come un **automa di input/output (una macchina a stati)**, eventualmente infinito, caratterizzato da:

- Un insieme $Q_j$ di stati interni (la memoria locale e le variabili).
- Un insieme non vuoto $Q_j^{\\mathit{init}} \\subseteq Q_j$ di stati iniziali.
- Un buffer di ingresso $\\mathit{InBuf}_j$, modellato come un multiinsieme che contiene i messaggi consegnati a $p_j$ dalla rete ma non ancora elaborati.
- Un buffer di uscita $\\mathit{OutBuf}_j$, modellato come un multiinsieme che contiene i messaggi in viaggio generati da $p_j$, cioè inviati ma non ancora consegnati.

Lo stato di un processo è la sua memoria interna insieme al contenuto dei suoi due buffer.

### Che cos'è un messaggio?

Un **messaggio** $m \\in \\mathcal{M}$ è rappresentato come una tupla: $$m = \\langle \\text{sender}, \\text{receiver}, \\text{payload} \\rangle \\in \\Pi \\times \\Pi \\times \\mathcal{D}$$ dove $\\mathcal{D}$ indica l'universo dei contenuti validi.

### Che cosa succede quando un processo esegue un passo di calcolo locale?

Un passo di calcolo locale eseguito dal processo $p_j$ è definito da una funzione deterministica di transizione di stato $\\delta_j$. Il processo legge il proprio stato interno corrente $q_j \\in Q_j$ e un sottoinsieme dei messaggi consegnati in $\\mathit{InBuf}_j$, aggiorna il proprio stato interno a $q_j'$ e aggiunge i nuovi messaggi in uscita a $\\mathit{OutBuf}_j$: $$\\delta_j: Q_j \\times \\mathcal{P}(\\mathit{InBuf}_j) \\to Q_j \\times \\mathcal{P}(\\mathcal{M})$$

## Modello di esecuzione asincrona

### Che cos'è un'esecuzione asincrona?

Un'**esecuzione asincrona** è caratterizzata dall'assenza totale di limiti sui tempi: i ritardi di trasmissione dei messaggi e le velocità relative di esecuzione dei processi sono finiti, ma del tutto arbitrari e imprevedibili.

### Che cos'è una configurazione del sistema?

Una **configurazione** $C_t$ cattura lo stato globale istantaneo dell'intero sistema al passo $t$. È un vettore di $n$ componenti, una per processo: $$C_t = \\langle C_t[0], C_t[1], \\dots, C_t[n-1] \\rangle$$ dove ogni componente $C_t[j]$ è lo stato completo del processo $p_j$, cioè il suo stato interno insieme ai suoi buffer: $$C_t[j] = (q_j, \\mathit{InBuf}_j, \\mathit{OutBuf}_j)$$

### Quando un evento è abilitato in una configurazione?

In un modello asincrono le transizioni del sistema sono guidate da due tipi fondamentali di eventi:

1. **Passo di esecuzione locale** $\\mathit{Exec}(i)$: il processo $p_i$ esegue un passo della sua macchina a stati. $\\mathit{Exec}(i)$ è **sempre abilitato** in qualunque configurazione $C_t$.
2. **Consegna di un messaggio** $\\mathit{Del}(m, i, j)$: sposta il messaggio $m = \\langle i, j, \\text{payload} \\rangle$ da $\\mathit{OutBuf}_i$ a $\\mathit{InBuf}_j$. $\\mathit{Del}(m, i, j)$ è **abilitato** nella configurazione $C_t$ se e solo se $m \\in \\mathit{OutBuf}_i$ in $C_t[i]$.

### Che cos'è un'esecuzione?

Un'**esecuzione** $E$ è una sequenza infinita che alterna configurazioni ed eventi: $$E = (C_0, e_0, C_1, e_1, C_2, e_2, \\dots, C_t, e_t, C_{t+1}, \\dots)$$ tale che, per ogni $t \\ge 0$, l'evento $e_t$ è abilitato nella configurazione $C_t$ e $C_{t+1}$ è esattamente la configurazione che si ottiene applicando $e_t$ a $C_t$.

### Chi decide gli eventi di un'esecuzione?

La sequenza di eventi $(e_0, e_1, e_2, \\dots)$ è scelta da un **avversario (lo scheduler)** onnisciente, che gioca il caso peggiore. L'avversario conosce per intero gli stati interni di tutti i processi e l'algoritmo, e sceglie gli eventi abilitati cercando di costringere l'algoritmo a violare la sua specifica.

### Che cos'è un'esecuzione fair?

Un'esecuzione $E$ è **fair** (equa) se ogni processo $p_i$ esegue un numero infinito di passi locali (gli eventi $\\mathit{Exec}(i)$ non finiscono mai) e ogni messaggio prima o poi viene consegnato: nessun messaggio può essere trattenuto per sempre, quindi per ogni messaggio $m$ inviato da $p_x$ a $p_y$ l'esecuzione contiene l'evento $\\mathit{Del}(m, x, y)$.

In questo corso si considerano solo esecuzioni fair. In un'esecuzione non fair l'avversario potrebbe semplicemente non far mai eseguire un processo, o non consegnarne mai i messaggi: così cadrebbe qualunque algoritmo non banale.

### Che cos'è la vista locale in un'esecuzione asincrona?

La **vista locale** (o esecuzione locale) del processo $p_i$ in un'esecuzione $E$, indicata con $E|_{p_i}$, è la proiezione di $E$ su $p_i$: la sequenza degli eventi di $E$ che coinvolgono direttamente $p_i$ (cioè i suoi passi locali $\\mathit{Exec}(i)$, i messaggi inviati da $p_i$ e i messaggi consegnati a $p_i$).

### Perché due esecuzioni sono indistinguibili per un processo?

Se due esecuzioni globali distinte $E_A$ ed $E_B$ hanno la stessa proiezione sul processo $p_i$: $$E_A|_{p_i} = E_B|_{p_i}$$ allora il processo $p_i$ **non può distinguere** $E_A$ da $E_B$. Di conseguenza $p_i$ compie esattamente le stesse transizioni di stato locali e produce gli stessi output in entrambe le esecuzioni.

Una prima conseguenza è un teorema: nel modello asincrono nessun algoritmo distribuito è in grado di ricostruire l'esecuzione del sistema, cioè di stabilire in quale ordine, nel tempo reale, sono avvenuti gli eventi di processi diversi. Più in generale, gli argomenti di indistinguibilità sono la tecnica di dimostrazione fondamentale per i limiti inferiori e i risultati di impossibilità nei sistemi distribuiti.

## Modelli di guasto: crash-stop e bizantino

### Quali sono i due principali modelli di guasto?

I protocolli distribuiti si valutano rispetto a due classi principali di guasti dei processi:

- **Modello di guasto crash-stop:**
  - Evento formale $\\mathit{Crash}(j)$: quando avviene $\\mathit{Crash}(j)$, il processo $p_j$ smette per sempre ogni calcolo locale.
  - In tutte le configurazioni successive $C_t$, $\\mathit{Exec}(j)$ è **disabilitato**.
  - Il crash-stop non è malevolo: $p_j$ non devia mai dalla sua macchina a stati prima di $\\mathit{Crash}(j)$.
- **Modello di guasto bizantino:**
  - Evento formale $\\mathit{Byz}(j)$: dopo di esso il processo $p_j$ può deviare in modo arbitrario dall'algoritmo che gli è assegnato, perché i suoi passi $\\mathit{Exec}(j)$ non seguono più il suo automa.
  - Può inviare messaggi falsificati o in conflitto, corrompere il proprio stato locale, inviare valori diversi a processi diversi o accordarsi con altri processi bizantini.
  - Gli algoritmi bizantini assumono un avversario attivo che controlla fino a $f$ processi, e per raggiungere il consenso servono $n \\ge 3f + 1$ processi.

Un processo che in un'esecuzione non subisce guasti si dice **corretto**; altrimenti è **guasto** (*faulty*). Nessun processo sa in anticipo chi è corretto. Il numero massimo di processi che possono guastarsi in un'esecuzione si indica con $f$ e di solito è limitato (per esempio $f \\le n - 1$), mentre non si fa mai alcuna ipotesi su *quando* avviene un guasto.

## Formalizzazione della perdita di un messaggio come evento

### Come si modella la perdita di un messaggio come evento formale?

In una rete asincrona con perdite, la perdita di un messaggio è formalizzata come un evento di sistema distinto, $\\mathit{LossMsg}(m, i)$.

\`\`\` Evento LossMsg(m, i)
Event: LossMsg(m, i)
Precondition:
  m ∈ OutBuf_i

Action:
  OutBuf_i := OutBuf_i \\ {m}
  InBuf_j remains unchanged (message is NOT added to recipient's buffer)
\`\`\`

Spiegazione riga per riga di \`LossMsg(m, i)\`:

- \`Event: LossMsg(m, i)\`: definisce l'evento che rappresenta la distruzione del messaggio $m$ inviato dal processo $p_i$.
- \`Precondition: m ∈ OutBuf_i\`: l'evento è abilitato nella configurazione $C_t$ se e solo se il messaggio $m$ è presente in quel momento nel buffer di uscita del mittente, $\\mathit{OutBuf}_i$.
- \`Action: OutBuf_i := OutBuf_i \\ {m}\`: quando l'evento viene eseguito, il messaggio $m$ è rimosso per sempre da $\\mathit{OutBuf}_i$.
- \`InBuf_j remains unchanged\`: a differenza di $\\mathit{Del}(m, i, j)$, $\\mathit{LossMsg}(m, i)$ non mette $m$ in $\\mathit{InBuf}_j$, e così descrive la perdita senza rendere incoerente lo stato dei buffer.

### Perdere un messaggio ripetutamente rende un'esecuzione non fair?

Se l'avversario applica $\\mathit{LossMsg}$ a ogni messaggio che $p_i$ invia a $p_j$, per sempre, allora $p_i$ non può più comunicare con $p_j$. Equivale a partizionare la rete, o a ritardare un messaggio per sempre come in un'esecuzione non fair, e rende irrisolvibile qualunque problema di accordo non banale.

Perché i problemi restino risolvibili su canali con perdite, il modello di sistema vincola l'avversario con la proprietà **fair-loss** dei collegamenti (formalizzata nella prossima lezione): se un processo corretto $p_i$ invia un messaggio $m$ a $p_j$ infinite volte, allora $p_j$ consegna $m$ un numero infinito di volte.
`;export{i as default};
