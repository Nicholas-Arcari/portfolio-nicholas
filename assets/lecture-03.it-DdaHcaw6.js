const i=`## Modelli di sincronia: sistemi asincroni, sincroni e sincroni prima o poi

### Che cos'è un sistema asincrono?

Un **sistema distribuito asincrono** è un modello di sistema caratterizzato dall'assenza totale di un tempo globale e di limiti superiori ai ritardi di comunicazione o alle velocità di esecuzione dei processi. Formalmente, un sistema asincrono è definito dalle seguenti proprietà:

- **Ritardi dei messaggi illimitati:** se un processo $p_i$ invia un messaggio $m$ al processo $p_j$, il messaggio prima o poi viene consegnato, ma non c'è un limite superiore fisso $\\Delta$ al ritardo di trasmissione. Il ritardo può essere grande a piacere.
- **Velocità di esecuzione illimitate:** i processi eseguono i loro passi di calcolo locali in istanti imprevedibili, decisi da uno scheduler avversario. Non c'è alcuna garanzia sul tempo che passa fra due passi consecutivi di un processo.
- **Assenza di un orologio globale:** i processi hanno solo un orologio locale, che non si può assumere sincronizzato con l'orologio di nessun altro processo della rete. Un orologio locale serve solo a ordinare gli eventi che avvengono su quello specifico processo.
- **Ipotesi minima di fairness:** l'esecuzione si assume fair, cioè ogni processo corretto esegue passi infinite volte e ogni messaggio scambiato fra processi corretti prima o poi viene consegnato.

### Che cos'è un sistema sincrono?

Un **sistema distribuito sincrono** è l'estremo opposto dello spettro: impone limiti superiori noti ai ritardi di rete e ai tempi di elaborazione. Formalmente, un sistema sincrono soddisfa:

- **Ritardi dei messaggi limitati:** esiste una costante nota e fissa $\\Delta > 0$ tale che, se un processo corretto $p_i$ invia un messaggio $m$ al processo $p_j$ al tempo reale $t$, allora $m$ è consegnato da $p_j$ non più tardi del tempo $t + \\Delta$.
- **Orologi sincronizzati:** i processi hanno accesso a orologi fisici locali che si possono sincronizzare fino a una precisione nota, cioè entro uno scarto massimo noto $\\delta \\ge 0$.
- **Passi di durata limitata e struttura a round:** i passi di esecuzione locali avvengono a intervalli prestabiliti e durano un tempo limitato, quindi l'esecuzione si può organizzare in round sincronizzati. In ogni round $r$, ogni processo corretto riceve tutti i messaggi che gli sono stati inviati nel round $r-1$, esegue una transizione di stato locale e invia i suoi messaggi per il round $r$.

### Che cos'è un sistema sincrono prima o poi?

Un **sistema sincrono prima o poi** (*eventually synchronous*; in letteratura anche **sistema parzialmente sincrono**) è un modello intermedio pensato per descrivere il comportamento reale di reti come Internet. In un sistema sincrono prima o poi la rete si comporta in modo asincrono per periodi arbitrari e imprevedibili, durante i quali i ritardi dei messaggi possono superare qualunque soglia prefissata, ma prima o poi si stabilizza in un regime sincrono.

### Quali sono i compromessi fra il modello asincrono e quello sincrono?

La scelta del modello di sistema comporta un compromesso fondamentale fra potenza degli algoritmi e applicabilità al mondo reale:

- **Modello asincrono:**
  - **Aspetto negativo:** valgono forti risultati di impossibilità. Il più importante, il **teorema di impossibilità di Fischer, Lynch e Paterson (FLP)**, dimostra che il consenso deterministico (e in generale i problemi di accordo) non si può risolvere in un sistema asincrono se anche un solo processo può andare in crash.
  - **Aspetto positivo:** massima copertura e realismo. Un algoritmo progettato e dimostrato corretto sotto ipotesi asincrone funziona su praticamente qualunque infrastruttura reale, perché non poggia su nessuna ipotesi sui tempi.
- **Modello sincrono:**
  - **Aspetto positivo:** massima potenza di calcolo. Quasi tutti i problemi distribuiti non banali, fra cui il consenso, il total order broadcast e l'atomic commit, sono risolvibili.
  - **Aspetto negativo:** copertura limitata del mondo reale. Le reti davvero sincrone sono rare e costose da costruire: in pratica sono reti locali (LAN) costruite su misura e sotto controllo diretto. Le reti pubbliche come Internet non sono sincrone, e anche le reti aziendali dedicate possono avere periodi asincroni inattesi per crash di router, congestione o broadcast storm. Per sfuggire all'asincronia di Internet, i grandi fornitori di cloud come Google posano cavi transoceanici in fibra ottica privati e dedicati fra i loro data center (per esempio fra Stati Uniti, Regno Unito e Paesi Bassi), per avere una latenza prevedibile e limitata.

### In che modo Internet mostra in pratica la sincronia parziale?

In condizioni normali, uno strumento di rete come \`ping google.com\` mostra tempi di andata e ritorno (RTT) prevedibili e ben sotto una soglia tipica (per esempio $50\\text{ ms}$). Tuttavia, per una congestione passeggera, un cambio di instradamento o il bufferbloat, la latenza può salire di colpo a $700\\text{ ms}$ o più, 14 volte tanto. Un modello sincrono prima o poi formalizza questo comportamento "sincrono quasi sempre, ma ogni tanto asincrono".

### Perché non è ragionevole costruire un sistema in cui la safety dipende dalla sincronia?

Ogni astrazione distribuita è specificata da un insieme di **proprietà di safety** ("le cose cattive non accadono") e di **proprietà di liveness** ("le cose buone prima o poi accadono"). Si supponga che un algoritmo sia progettato in modo che una **proprietà di safety** dipenda dal fatto che i ritardi di rete restino sotto una soglia $\\Delta$ (per esempio assumendo un ritardo massimo di $50\\text{ ms}$):

- Durante un periodo asincrono in cui i ritardi dei messaggi superano $\\Delta$, la proprietà di safety è violata.
- Per esempio, in un'astrazione di mutua esclusione, se il processo $p_0$ assume che $p_1$ abbia rilasciato la sezione critica basandosi su un timeout di $50\\text{ ms}$, ma il messaggio di $p_1$ ritarda di $700\\text{ ms}$, sia $p_0$ sia $p_1$ si trovano nella sezione critica nello stesso momento.
- Poiché le violazioni di safety sono irreversibili (una volta avvenuto un evento cattivo, nessuna estensione dell'esecuzione può cancellarlo), l'intero sistema entra in uno stato non valido e irrecuperabile. Un progetto in cui la safety dipende da ipotesi di sincronia è quindi sbagliato alla radice in una rete parzialmente sincrona.

### Perché in un modello sincrono prima o poi la liveness può dipendere dalla sincronia?

A differenza della safety, le **proprietà di liveness** affermano che un risultato desiderabile si avrà **prima o poi**.

- Durante i periodi asincroni in cui i ritardi superano la soglia $\\Delta$, un algoritmo può smettere temporaneamente di avanzare (per esempio i processi restano in attesa).
- Tuttavia, poiché il sistema prima o poi entra in una fase sincrona in cui i ritardi scendono sotto $\\Delta$, l'algoritmo riprende e soddisfa la proprietà di liveness.
- Una mancanza temporanea di avanzamento durante le fasi asincrone non viola la liveness, perché la liveness non pone alcun limite finito al momento in cui l'avanzamento deve avvenire. Algoritmi come Paxos poggiano proprio su questa separazione: **la safety vale senza condizioni, anche in asincronia**, mentre **la liveness è garantita ogni volta che la rete resta sincrona per un tempo abbastanza lungo**.

### Qual è la definizione formale del Global Stabilization Time ($T$)?

Per modellare la sincronia parziale senza esporre nelle dimostrazioni limiti di tempo specifici, il modello introduce un tempo sconosciuto $T$, detto **Global Stabilization Time (GST)**:

- Il sistema è inizialmente asincrono: prima del tempo $T$ (nell'intervallo $[0, T)$) i ritardi dei messaggi sono illimitati e le velocità di esecuzione dei processi arbitrarie.
- Esistono un tempo $T < \\infty$, sconosciuto ai processi, e un limite sul ritardo $\\Delta > 0$ tali che, per ogni tempo reale $t \\ge T$, ogni messaggio inviato da un processo corretto al tempo $t$ è consegnato entro il tempo $t + \\Delta$: dopo $T$ il sistema è sincrono, e lo resta per sempre.
- Il tempo $T$ è solo un costrutto teorico per le dimostrazioni: poiché $T$ è finito, qualunque finestra di sincronia di cui un algoritmo ha bisogno per avanzare (per esempio $1\\text{ hour}$ o $10\\text{ hours}$ di ritardi stabili e limitati) esiste di sicuro dopo $T$.

### Che relazione c'è fra le esecuzioni dei tre modelli di sincronia?

Siano $E_{\\text{Sync}}$, $E_{\\text{EvSync}}$ ed $E_{\\text{Async}}$ gli insiemi di tutte le esecuzioni valide rispettivamente del modello sincrono, di quello sincrono prima o poi e di quello asincrono. Sono legati per inclusione: $$E_{\\text{Sync}} \\subset E_{\\text{EvSync}} \\subset E_{\\text{Async}}$$

- Ogni esecuzione sincrona è un caso particolare di esecuzione sincrona prima o poi, quello in cui $T = 0$.
- Ogni esecuzione sincrona prima o poi è un'esecuzione asincrona valida, in cui i ritardi dei messaggi si trovano a rispettare un limite dopo il tempo $T$.
- Un algoritmo corretto in tutte le esecuzioni di $E_{\\text{Async}}$ è automaticamente corretto in $E_{\\text{EvSync}}$ e in $E_{\\text{Sync}}$.

### Che relazione c'è fra i problemi risolvibili nei tre modelli di sincronia?

Siano $P_{\\text{Async}}$, $P_{\\text{EvSync}}$ e $P_{\\text{Sync}}$ gli insiemi dei problemi distribuiti risolvibili in ciascun modello. La relazione è rovesciata rispetto a quella fra gli insiemi delle esecuzioni: $$P_{\\text{Async}} \\subset P_{\\text{EvSync}} \\subset P_{\\text{Sync}}$$

- Nel modello asincrono l'avversario ha il più grande insieme di esecuzioni fra cui scegliere per mettere in difficoltà un algoritmo, e questo riduce i problemi risolvibili a un insieme piccolo ($P_{\\text{Async}}$).
- Nel modello sincrono l'insieme ristretto di esecuzioni permette di risolvere la classe più ampia di problemi ($P_{\\text{Sync}}$), compreso il consenso deterministico.
- Nel modello sincrono prima o poi ($P_{\\text{EvSync}}$) si possono risolvere praticamente tutti i problemi risolvibili nei sistemi sincroni, con la sola restrizione che non si può garantire alcun limite al tempo necessario per avanzare.

## Sincronizzazione degli orologi e orologi fisici

### Perché i sistemi distribuiti hanno bisogno del tempo e della sincronizzazione degli orologi?

I sistemi distribuiti hanno bisogno di orologi sincronizzati soprattutto per stabilire un **ordinamento degli eventi** coerente fra più processi separati nello spazio. Fra gli ambiti pratici che richiedono orologi sincronizzati:

- **Controllo del traffico aereo:** mettere in sequenza atterraggi e decolli per evitare collisioni.
- **Mercati finanziari:** dare un timestamp agli ordini di acquisto e di vendita per garantire un ordine di esecuzione equo.
- **Sicurezza di rete e autenticazione:** impedire gli attacchi di replay nei protocolli (per esempio Kerberos) verificando che i timestamp siano recenti.
- **Coerenza dei dati e sistemi di build:** evitare elaborazioni doppie (per esempio lo strumento \`make\` guarda i timestamp di modifica dei file per decidere se ricompilare il codice sorgente).
- **Reti di sensori e TDMA:** realizzare il Time Division Multiple Access (TDMA), che divide l'accesso al canale in intervalli di tempo che non si sovrappongono, per evitare interferenze.

Il modo ingenuo di ordinare gli eventi è il timestamping: ogni processo attacca a ogni evento un'etichetta letta dal proprio orologio fisico, così che i timestamp di tutti i processi si possano fondere in una storia globale del sistema. Il resto della lezione studia fino a che punto gli orologi fisici lo permettono.

### In che modo il tempo rende distinguibili le esecuzioni del sistema?

In un sistema asincrono senza orologio globale, due esecuzioni distinte possono produrre sequenze identiche di eventi locali, e questo le rende indistinguibili per i processi. In un sistema sincrono con orologi fisici sincronizzati, i processi attaccano ai messaggi in uscita dei timestamp locali $C_i(t)$. Un processo che riceve un messaggio e legge il timestamp $C_i(t) = 12{:}00$ invece di $C_i(t) = 14{:}00$ può capire subito in quale delle due esecuzioni si trova, e l'indistinguibilità cade.

### Come funziona un orologio hardware dentro un computer?

A livello hardware ogni dispositivo di calcolo contiene un orologio fisico basato su un **oscillatore a cristallo di quarzo**:

- Applicando una tensione a un cristallo di quarzo, questo oscilla a una frequenza stabile e caratteristica, per l'effetto piezoelettrico.
- Un registro contatore hardware, indicato con $\\mathrm{HT}_i(t)$ per il processo $p_i$, conta i tick generati dall'oscillatore dall'avvio del sistema.
- Se un cristallo oscilla a una frequenza nominale di $f$ oscillazioni al secondo, contare $f$ tick corrisponde al passare di 1 secondo di tempo reale: $$\\text{Measured interval} = \\frac{\\Delta \\mathrm{HT}_i}{f}$$

### Come si definisce un orologio software rispetto a un orologio hardware?

Per allineare il contatore hardware $\\mathrm{HT}_i(t)$ con UTC (Coordinated Universal Time), cioè con il tempo reale $t$, il sistema operativo realizza un **orologio software** $C_i(t)$ con una trasformazione lineare: $$C_i(t) = \\alpha \\cdot \\mathrm{HT}_i(t) + \\beta$$ dove:

- $\\mathrm{HT}_i(t)$ è la lettura dell'orologio hardware al tempo reale $t$.
- $\\alpha$ è un fattore di scala moltiplicativo, che serve ad accelerare ($\\alpha > 1$) o a rallentare ($\\alpha < 1$) la velocità dell'orologio software.
- $\\beta$ è uno scostamento additivo, che serve a spostare avanti o indietro la lettura dell'orologio. Gli algoritmi di sincronizzazione (come NTP) regolano $\\alpha$ e $\\beta$ nel tempo, quindi entrambi possono essere funzioni del tempo.

### Che cos'è lo skew di un orologio?

Lo **skew** (scarto) è la differenza assoluta fra le letture di due orologi software $C_i$ e $C_j$ nello stesso istante di tempo reale $t$: $$\\text{Skew}_{i,j}(t) = |C_i(t) - C_j(t)|$$ In una rete di $n$ processi, lo skew globale massimo $\\delta(t)$ al tempo reale $t$ è definito come: $$\\delta(t) = \\max_{i,j \\in \\Pi} |C_i(t) - C_j(t)|$$

### Che cos'è il drift rate di un orologio?

Il **drift** (deriva) è il progressivo disallineamento di un orologio dal tempo reale, dovuto al fatto che un oscillatore fisico al quarzo non batte mai esattamente alla sua frequenza nominale. La velocità con cui avanza un orologio hardware $\\mathrm{HT}_i(t)$ è la sua derivata prima rispetto al tempo reale $t$, e il suo **drift rate** $\\rho_i(t)$ è lo scostamento di questa velocità da 1: $$\\rho_i(t) = \\frac{d\\,\\mathrm{HT}_i(t)}{dt} - 1$$

- **Orologio perfetto:** $\\frac{d\\,\\mathrm{HT}_i(t)}{dt} = 1$, cioè deriva nulla. Un'unità di tempo dell'orologio hardware corrisponde esattamente a un'unità di tempo reale (una retta a $45^\\circ$ in un grafico del tempo dell'orologio rispetto al tempo reale).
- **Orologio veloce:** $\\frac{d\\,\\mathrm{HT}_i(t)}{dt} > 1$. L'orologio va più veloce del tempo reale (per esempio misura $2\\text{ hours}$ quando è passata solo $1\\text{ hour}$ di tempo reale).
- **Orologio lento:** $\\frac{d\\,\\mathrm{HT}_i(t)}{dt} < 1$. L'orologio va più lento del tempo reale (per esempio misura $30\\text{ minutes}$ quando è passata $1\\text{ hour}$ di tempo reale).

Per esempio, un drift rate di 2 microsecondi al secondo significa che l'orologio avanza di 1 secondo più 2 microsecondi per ogni secondo di tempo reale. A differenza dello skew, che si può misurare una volta e correggere, la deriva fa accumulare l'errore nel tempo: per questo gli orologi vanno sincronizzati di continuo.

### Che cosa fa variare nel tempo la deriva di un orologio fisico?

Il drift rate non è costante: cambia di continuo per fattori ambientali e fisici:

- **Variazioni di temperatura:** la frequenza di oscillazione di un cristallo di quarzo cambia con la temperatura di esercizio. Quando una CPU è sotto un forte carico di calcolo, la sua temperatura interna sale sopra i $40^\\circ\\text{C}$ e sposta la frequenza del cristallo. Quando la CPU si raffredda, la frequenza si sposta nel verso opposto.
- **Invecchiamento dei componenti:** i cristalli di quarzo si degradano fisicamente negli anni, e la frequenza di base deriva progressivamente.

### Qual è la definizione formale di orologio hardware corretto?

Poiché nessun orologio fisico è perfettamente accurato, il modello definisce un **orologio hardware corretto** ponendo un limite simmetrico $\\rho > 0$ al suo drift rate (il drift rate massimo dichiarato dal costruttore: circa $10^{-5}$ per gli ordinari orologi al quarzo, che sgarrano di quasi un secondo in 11-12 giorni, e da $10^{-7}$ a $10^{-8}$ per gli orologi al quarzo di alta precisione): $$1 - \\rho \\le \\frac{d\\,\\mathrm{HT}_i(t)}{dt} \\le 1 + \\rho \\quad \\forall t$$ Un orologio hardware è corretto se la sua velocità non esce mai dalla fascia $[1 - \\rho, 1 + \\rho]$. Con un orologio hardware corretto, qualunque intervallo di tempo reale si misura con un errore limitato.

### Come si accumula nel tempo lo skew fra due orologi corretti?

Anche se due orologi corretti $C_1$ e $C_2$ sono perfettamente sincronizzati al tempo reale $t_0 = 0$, cioè $|C_1(0) - C_2(0)| = 0$, la loro deriva fa accumulare lo skew nel tempo. Nel caso peggiore:

- L'orologio $C_1$ è sempre veloce, alla massima velocità ammessa: $\\frac{dC_1}{dt} = 1 + \\rho$.
- L'orologio $C_2$ è sempre lento, alla minima velocità ammessa: $\\frac{dC_2}{dt} = 1 - \\rho$.

Dopo un intervallo di tempo reale di lunghezza $\\Delta t = t_1 - t_0$, le letture dei due orologi sono: $$C_1(t_1) = (1 + \\rho) \\Delta t$$ $$C_2(t_1) = (1 - \\rho) \\Delta t$$ Sottraendo $C_2(t_1)$ da $C_1(t_1)$ si ottiene lo skew massimo accumulato: $$\\text{Skew}(t_1) = |C_1(t_1) - C_2(t_1)| = ((1 + \\rho) - (1 - \\rho)) \\Delta t = 2 \\rho \\Delta t$$ Per tenere lo skew sotto una soglia desiderata $\\delta_{\\max}$, i processi **devono** eseguire un protocollo di risincronizzazione degli orologi a intervalli $\\Delta t$ che soddisfano: $$\\Delta t \\le \\frac{\\delta_{\\max}}{2\\rho}$$

### Che cos'è la proprietà di monotonia degli orologi software?

Un orologio software $C_i(t)$ soddisfa la **monotonia** se è una funzione strettamente crescente del tempo reale $t$: $$t' > t \\implies C_i(t') > C_i(t)$$ In modo equivalente, $\\frac{dC_i(t)}{dt} > 0$ in ogni istante. La monotonia si può garantire scegliendo valori opportuni di $\\alpha$ e $\\beta$.

### Perché un orologio software non deve mai saltare indietro nel tempo?

Se un algoritmo di sincronizzazione scopre che l'orologio locale $C_1$ segna le $14{:}00$ mentre l'orologio di riferimento $C_2$ segna le $13{:}00$, porre $\\beta = -1\\text{ hour}$ riporta $C_1$ alle $13{:}00$. Questo salto all'indietro rompe il sistema:

- **Crollano causalità e ordinamento degli eventi:** gli eventi generati fra le $13{:}00$ e le $14{:}00$ hanno gli stessi timestamp dei nuovi eventi generati dopo il reset, e non si può più stabilire un ordine causale o cronologico.
- **Vulnerabilità di sicurezza:** le protezioni contro gli attacchi di replay non funzionano più quando i timestamp si sovrappongono a una finestra di tempo già registrata.
- **Build e log corrotti:** i sistemi di build (\`make\`) e i log delle transazioni dei database falliscono quando nuove operazioni compaiono con timestamp precedenti a quelli di operazioni passate.

### Come si corregge un orologio veloce senza violare la monotonia?

Per correggere un orologio veloce senza riportare indietro l'ora, il sistema operativo lo rallenta invece di reimpostarlo:

- Lo scostamento $\\beta$ resta costante, ma il moltiplicatore di velocità $\\alpha$ viene portato sotto 1 ($\\alpha < 1$).
- In pratica il kernel nasconde una parte degli interrupt dell'oscillatore hardware (per esempio scartando 1 tick ogni 2): finché gli interrupt sono nascosti l'orologio locale non viene aggiornato, quindi il numero di interrupt da nascondere è il tempo da perdere diviso per il periodo dell'interrupt.
- Questo rallenta la velocità con cui avanza $C_i(t)$ e permette al tempo reale $t$ (e agli orologi di riferimento più lenti) di "recuperare", mentre $C_i(t)$ continua ad avanzare in modo monotono.

### L'ora legale influisce sulla sincronizzazione degli orologi dei computer?

No. I kernel dei sistemi operativi tengono il tempo al loro interno come un conteggio continuo e monotono di secondi o millisecondi (per esempio il tempo Unix: i secondi trascorsi dal 1° gennaio 1970, 00:00:00 UTC). L'ora legale (DST) cambia solo il modo in cui l'ora viene mostrata alle persone: si applica al livello di presentazione e non altera l'orologio software monotono $C_i(t)$ che sta sotto.

## Algoritmi di sincronizzazione degli orologi

### Che cosa sono UTC e la sincronizzazione interna ed esterna?

**UTC** (Coordinated Universal Time) è lo standard internazionale alla base di ogni misura del tempo. Si basa sul Tempo Atomico Internazionale, in cui un secondo è il tempo che un atomo di cesio impiega per 9,192,631,770 transizioni di stato: gli orologi basati su oscillatori atomici sono i più accurati, con un drift rate di circa $10^{-13}$. I segnali UTC sono trasmessi da stazioni radio a onde corte (con un'accuratezza di circa 1 ms) e da satelliti (GPS, circa 1 microsecondo), e un computer dotato di un ricevitore può usarli per sincronizzare il proprio orologio locale con il tempo reale.

Sia $D > 0$ un limite di sincronizzazione. Ci sono due nozioni di sincronizzazione:

- **Sincronizzazione esterna:** i processi sincronizzano i loro orologi con una sorgente esterna autorevole $S$ (una sorgente di UTC). Gli orologi $C_i$ sono sincronizzati esternamente in un intervallo di tempo $I$ se $$|S(t) - C_i(t)| < D \\quad \\forall i \\in \\{1, 2, \\dots, N\\},\\ \\forall t \\in I$$ e si dice che gli orologi sono *accurati* entro il limite $D$.
- **Sincronizzazione interna:** i processi sincronizzano i loro orologi fra di loro. Gli orologi sono sincronizzati internamente in un intervallo di tempo $I$ se $$|C_i(t) - C_j(t)| < D \\quad \\forall i, j \\in \\{1, 2, \\dots, N\\},\\ \\forall t \\in I$$ e si dice che gli orologi *concordano* entro il limite $D$.

Orologi sincronizzati internamente non sono per forza sincronizzati esternamente: pur concordando fra loro, possono derivare tutti insieme rispetto alla sorgente esterna. Viceversa, un insieme di processi sincronizzati esternamente entro il limite $D$ è anche sincronizzato internamente entro il limite $2D$, e questo segue direttamente dalle due definizioni.

### Come funziona l'algoritmo di Cristian?

L'**algoritmo di Cristian** è un algoritmo di sincronizzazione esterna basato su un time server $S$ che riceve il segnale di una sorgente UTC. Si fonda sulla misura del tempo di andata e ritorno (RTT) dei messaggi:

- Un processo $p$ chiede l'ora corrente con un messaggio $m_r$ e riceve l'ora $t$ del server in un messaggio $m_t$.
- $p$ imposta il proprio orologio a $t + T_{\\mathit{round}}/2$, dove $T_{\\mathit{round}}$ è il tempo di andata e ritorno misurato da $p$: la stima assume che la risposta abbia viaggiato per metà dell'andata e ritorno.

**Accuratezza.** Sia $\\mathit{min}$ il tempo minimo di trasmissione di un messaggio. La risposta non può aver viaggiato per meno di $\\mathit{min}$, né per più di $T_{\\mathit{round}} - \\mathit{min}$ (la richiesta ha impiegato almeno $\\mathit{min}$). In entrambi i casi estremi l'errore della stima $T_{\\mathit{round}}/2$ ha la stessa ampiezza, quindi l'accuratezza dell'algoritmo è $$\\pm \\left( \\frac{T_{\\mathit{round}}}{2} - \\mathit{min} \\right)$$

L'algoritmo funziona, in senso probabilistico, anche in un sistema asincrono, ma la sincronizzazione si ottiene solo se i tempi di andata e ritorno sono piccoli rispetto all'accuratezza richiesta. Il time server è un singolo punto di guasto, per cui Cristian suggerisce di usare un gruppo di time server sincronizzati e di interrogarne più d'uno insieme. Poiché i server possono anche essere guasti o malevoli, servono ridondanza e autenticazione.

### Come funziona l'algoritmo di Berkeley?

L'**algoritmo di Berkeley** (Gusella e Zatti, 1989) è un algoritmo di sincronizzazione interna con una struttura master-slave. Procede per passi:

1. **Misura delle differenze:** il master $p_m$ invia un messaggio con il proprio timestamp $t_1$ a ogni processo del sistema, sé stesso compreso. Un processo $p_i$ che lo riceve risponde con il proprio timestamp $t_2$. Quando il master riceve la risposta legge il proprio orologio locale ($t_3$) e calcola la differenza $\\Delta p_i$ fra l'orologio di $p_i$ e il suo.
2. **Calcolo della media:** il master calcola la media $\\mathit{avg}$ di tutti i $\\Delta p_i$, senza considerare i processi guasti, cioè quelli il cui orologio differisce da quello del master più di una soglia data $\\gamma$.
3. **Calcolo delle correzioni:** per ogni processo, guasti compresi, il master calcola la correzione $\\mathit{adj}_{p_i} = \\mathit{avg} - \\Delta p_i$ e la invia.
4. **Applicazione della correzione:** ogni processo applica al proprio orologio locale la correzione che riceve. Se la correzione è negativa il processo rallenta il proprio orologio, perché un orologio non si può riportare indietro.

**Esempio.** Il master segna le 3:05, e gli altri orologi segnano le 2:55 ($p_1$), le 3:00 ($p_2$) e le 3:25 ($p_3$). Le differenze sono $\\Delta p_m = 0$, $\\Delta p_1 = -10$, $\\Delta p_2 = -5$ e $\\Delta p_3 = +20$ minuti: $p_3$ è troppo lontano dal master ed è considerato guasto. La media è $\\mathit{avg} = (0 - 10 - 5)/3 = -5$, e le correzioni sono $-5$ per il master, $+5$ per $p_1$, $0$ per $p_2$ e $-25$ per $p_3$: tutti gli orologi convergono alle 3:00.

L'accuratezza del protocollo dipende dal tempo massimo di andata e ritorno: il master ignora i valori di orologio il cui scambio ha richiesto più di un tempo massimo. Se il master va in crash se ne elegge un altro. Scartare i valori troppo diversi dagli altri rende inoltre l'algoritmo tollerante ai processi che inviano valori sbagliati.

### Che cos'è il Network Time Protocol (NTP)?

Il **Network Time Protocol (NTP)** è il servizio di tempo di Internet: sincronizza i client con UTC, ed è l'algoritmo di sincronizzazione esterna che usano i normali computer. Ottiene affidabilità con server e percorsi ridondanti, ed è scalabile grazie a una gerarchia: i server primari sono collegati direttamente a sorgenti UTC, i server secondari sono sincronizzati con i primari, e così via fino al livello più basso, i computer degli utenti.

### Che cosa cambia quando il grafo di comunicazione non è completo?

In un grafo arbitrario la sincronizzazione può seguire un albero, in cui un server impone il proprio orologio ai nodi sotto di lui, oppure essere del tutto distribuita, con ogni nodo che regola il proprio orologio in base ai vicini. Si distinguono due misure di qualità:

- **Skew globale:** il massimo skew possibile fra due nodi qualunque del grafo.
- **Skew locale:** il massimo skew possibile fra due vicini.

## Ripasso di un esercizio sui collegamenti

### Si può realizzare un perfect point-to-point link con memoria finita su un canale fair-lossy?

**Teorema:** è impossibile realizzare un perfect point-to-point link (che garantisce reliable delivery e no duplication) sopra un fair-lossy link se i processi hanno una memoria finita, limitata a $K$ messaggi.

**Traccia della dimostrazione:**

1. Si supponga che un processo $p_i$ abbia una memoria che contiene al più $K$ messaggi.
2. Lo strato superiore affida a $p_i$ $K$ messaggi distinti $m_1, m_2, \\dots, m_K$.
3. Per soddisfare la reliable delivery su un canale fair-lossy, $p_i$ deve tenere in memoria tutti i $K$ messaggi e ritrasmetterli infinite volte.
4. Si supponga ora che lo strato superiore gli affidi il messaggio $m_{K+1}$. Poiché la memoria è limitata a $K$, $p_i$ deve sovrascrivere almeno un messaggio già memorizzato (per esempio $m_1$).
5. Una volta tolto $m_1$ dalla memoria, $p_i$ smette di ritrasmettere $m_1$.
6. Poiché un fair-lossy link può perdere tutte le copie di un messaggio inviato solo un numero finito di volte, tutte le trasmissioni di $m_1$ fatte prima della sua rimozione possono andare perse.
7. Dato che $m_1$ non viene più ritrasmesso, il processo $p_j$ non consegnerà mai $m_1$, violando la reliable delivery. Quindi con memoria finita non si può garantire l'astrazione di perfect link su reti con perdite.
`;export{i as default};
