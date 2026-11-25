const e=`## Formalizzazione dei collegamenti di comunicazione e delle interfacce

### Qual è la descrizione informale di un collegamento di comunicazione fisico?

Nelle reti fisiche i collegamenti di comunicazione hanno comportamenti non deterministici, dovuti al rumore fisico, all'attenuazione della linea, ai crash dei router e alle ritrasmissioni di rete. Una descrizione informale di un canale di comunicazione reale poggia su tre osservazioni empiriche:

- **Perdita di messaggi con probabilità $P_R$:** ogni collegamento fisico ha una probabilità intrinseca $P_R \\in (0, 1)$ che un messaggio trasmesso venga perso, corrotto oltre le possibilità di recupero del checksum, o scartato da una coda di instradamento intermedia.
- **Duplicazione finita dei messaggi:** un canale fisico, o il meccanismo di trasporto sottostante (per esempio i timer di ritrasmissione), può duplicare i messaggi a causa di conferme in ritardo o di cambi di instradamento, consegnando più volte un messaggio trasmesso, ma solo un numero finito di volte.
- **Nessuna creazione dal nulla:** un canale di comunicazione non può fabbricare messaggi spuri. Se un processo riceve un messaggio con identificatore di sorgente $p$, allora il processo $p$ ha davvero trasmesso quel messaggio sul collegamento.

### Qual è l'interfaccia a eventi del blocco che rappresenta un collegamento?

Per modellare con rigore un collegamento di comunicazione nella pila software di un sistema distribuito, il collegamento è rappresentato come un blocco di astrazione esplicito, che interagisce con gli strati software adiacenti attraverso eventi. L'interfaccia definisce l'insieme minimo di eventi necessari:

- **Evento di richiesta (ingresso del collegamento):** $\\text{send}(q, m)$ - generato dallo strato superiore per chiedere la trasmissione del messaggio $m$ al processo di destinazione $q$.
- **Evento di indicazione (uscita del collegamento):** $\\text{deliver}(p, m)$ - generato dall'astrazione del collegamento per avvisare lo strato superiore che il messaggio $m$ è stato ricevuto dal processo sorgente $p$.

### Perché si eliminano le probabilità dai modelli formali di sistema?

Nella pratica ingegneristica i guasti di un collegamento si descrivono con un tasso di perdita probabilistico $P_R$. Inserire distribuzioni di probabilità esplicite nelle dimostrazioni di correttezza richiede però strumenti matematici pesanti (come i limiti di Chernoff o l'analisi delle catene di Markov), che complicano il ragionamento deterministico. Nella teoria del calcolo distribuito le probabilità vengono eliminate e sostituite con proprietà che parlano di sequenze infinite. Se un messaggio è ritrasmesso infinite volte su un canale con probabilità di perdita $P_R < 1$, la probabilità che tutte le copie vadano perse, $(P_R)^k$, tende a $0$ quando il numero di ritrasmissioni $k \\to \\infty$. Scambiare i limiti probabilistici con un'affermazione sulle ritrasmissioni infinite fa valere le dimostrazioni per qualunque collegamento fisico, purché $P_R < 1$.

## L'astrazione di fair-lossy link (FL)

### Come si specifica formalmente il fair-lossy link?

Il fair-lossy link ($\\mathrm{FL}$) è l'astrazione di comunicazione più debole usata in questo corso. Racchiude i canali fisici con perdite senza fare ipotesi sui tempi, sulla topologia della rete o sul ritardo di transito. Un fair-lossy link espone l'evento di richiesta $\\text{FL.send}(q, m)$ e l'evento di indicazione $\\text{FL.deliver}(p, m)$, ed è definito da tre proprietà:

- **FL1 - Fair loss (liveness):** se un processo corretto $p$ invia un messaggio $m$ infinite volte a un processo $q$, allora $q$ consegna $m$ un numero infinito di volte. $$\\forall p, q \\in \\Pi \\text{ s.t. } p \\in \\text{Correct}, \\quad \\left( \\text{count}(\\text{FL.send}(q, m)) = \\infty \\implies \\text{count}(\\text{FL.deliver}(p, m)) = \\infty \\right)$$
- **FL2 - Finite duplication (liveness):** se un processo corretto $p$ invia un messaggio $m$ un numero finito di volte al processo $q$, allora $q$ non può consegnare $m$ un numero infinito di volte. $$\\forall p, q \\in \\Pi \\text{ s.t. } p \\in \\text{Correct}, \\quad \\left( \\text{count}(\\text{FL.send}(q, m)) < \\infty \\implies \\text{count}(\\text{FL.deliver}(p, m)) < \\infty \\right)$$
- **FL3 - No creation (safety):** se un processo $q$ consegna un messaggio $m$ con mittente $p$, allora $m$ è stato inviato in precedenza da $p$ a $q$. $$\\forall p, q \\in \\Pi, \\quad \\left( \\text{FL.deliver}(p, m) \\text{ at } q \\implies \\text{FL.send}(q, m) \\text{ was previously executed at } p \\right)$$

### Quanti messaggi può perdere un fair-lossy link?

Un fair-lossy link può perdere un numero **infinito** di messaggi pur soddisfacendo le proprietà $\\mathrm{FL}1$, $\\mathrm{FL}2$ e $\\mathrm{FL}3$.

**Dimostrazione (dalla lavagna):** si consideri un'esecuzione in cui un processo corretto $p$ invia al processo $q$, su un fair-lossy link, la sequenza di tutti i numeri naturali $\\mathbb{N} = \\{0, 1, 2, 3, 4, 5, \\dots\\}$. Si supponga che un "diavolo" dentro il canale scarti ogni numero pari $\\{0, 2, 4, 6, 8, \\dots\\}$ e consegni ogni numero dispari $\\{1, 3, 5, 7, 9, \\dots\\}$.

- L'insieme dei numeri pari scartati è infinito numerabile ($|\\{2k \\mid k \\in \\mathbb{N}\\}| = \\aleph_0$).
- Anche l'insieme dei numeri dispari consegnati è infinito numerabile ($|\\{2k + 1 \\mid k \\in \\mathbb{N}\\}| = \\aleph_0$).
- Infiniti messaggi arrivano al processo $q$ e, allo stesso tempo, infiniti messaggi vanno persi, eppure nessuna proprietà del collegamento è violata. Quindi un fair-lossy link ammette una quantità infinita di messaggi persi.

Un'osservazione sull'esempio: qui ogni numero è un messaggio distinto inviato una sola volta, quindi $\\mathrm{FL}1$, che parla di un messaggio inviato infinite volte, vale in modo banale. La stessa conclusione vale per un solo messaggio $m$: se $p$ invia $m$ infinite volte e il canale ne scarta una copia sì e una no, infinite copie vanno perse e infinite vengono consegnate, proprio come richiede $\\mathrm{FL}1$.

## Proprietà di safety e di liveness

### Che cos'è una proprietà di safety?

Una **proprietà di safety** afferma che **"qualcosa di male non accade"** durante l'esecuzione del sistema.

- **Definizione formale:** una proprietà $S$ è di safety se, ogni volta che $S$ è violata in un'esecuzione $E$, esiste un prefisso finito $E' \\sqsubset E$ (l'esecuzione fino all'evento cattivo compreso) tale che ogni possibile estensione $E''$ di $E'$ viola anch'essa $S$.
- **Caratteristica chiave:** una violazione di safety avviene in un istante preciso e finito $t$. Una volta violata una proprietà di safety, nessuna azione futura può più riparare la violazione.

### Che cos'è una proprietà di liveness?

Una **proprietà di liveness** afferma che **"qualcosa di buono prima o poi accadrà"** durante l'esecuzione del sistema.

- **Definizione formale:** una proprietà $L$ è di liveness se non può essere violata in un'esecuzione finita: per ogni esecuzione finita $E'$ che non soddisfa $L$ esiste sempre un'estensione $E''$ di $E'$ che soddisfa $L$.
- **Caratteristica chiave:** una violazione di liveness non si può attribuire a un prefisso finito, perché c'è sempre la speranza che l'"evento buono" richiesto avvenga in futuro. La liveness garantisce che il sistema avanzi.

### Come cambia la classificazione di una proprietà se le si mette un limite finito?

Inserire un limite finito esplicito in una proprietà di liveness la trasforma in una proprietà di safety.

**Dimostrazione con la duplicazione di un collegamento:**

- **Duplicazione finita senza limite ($\\mathrm{FL}2$):** "se $p$ invia $m$ un numero finito di volte, $q$ non può consegnare $m$ un numero infinito di volte". È una proprietà di **liveness**, perché nessuna sequenza finita di consegne può dimostrare che ci saranno infinite consegne: ogni esecuzione finita si può estendere con eventi nessuno dei quali è una consegna di $m$.
- **Duplicazione limitata:** "se $p$ invia $m$ un numero finito di volte, $q$ non può consegnare $m$ più di 7 volte". È una proprietà di **safety**, perché un prefisso di esecuzione che contiene un'$8^{\\text{th}}$ consegna viola il limite in tempo finito, e nessuna estensione può cancellare il fatto che le consegne sono state 8.

### Perché safety e liveness non vanno mai mescolate in una sola specifica?

Unire un requisito di safety e uno di liveness in una sola proprietà produce una specifica ambigua, che complica sia il progetto sia le dimostrazioni. Una tipica proprietà scritta male è "se il processo $p$ invia un messaggio $m$ a $q$, allora $q$ prima o poi lo consegna e questa consegna è unica": mescola una parte di liveness ($q$ prima o poi consegna $m$) e una parte di safety ($m$ è consegnato al più una volta), e va scomposta in due proprietà. Una violazione di safety è un fallimento irrecuperabile del sistema, mentre una liveness non ancora soddisfatta indica solo che finora non c'è stato avanzamento: tenerle separate permette di ragionare sulle due cose una alla volta.

**Classificazione degli esempi del corso:**

1. **Proprietà $\\mathrm{FL}1$ (fair loss):** liveness (per violarla servirebbero infiniti invii).
2. **Proprietà $\\mathrm{FL}2$ (finite duplication):** liveness (non si può violare in tempo finito).
3. **Proprietà $\\mathrm{FL}3$ (no creation):** safety (ricevere un messaggio che nessuno ha inviato la viola all'istante e per sempre).
4. **Mutua esclusione:** "due processi non tengono mai la risorsa critica $R$ nello stesso momento" $\\rightarrow$ safety.
5. **Assenza di deadlock:** "se la risorsa $R$ è libera, prima o poi qualche processo ottiene $R$" $\\rightarrow$ liveness.
6. **Assenza di starvation:** "se il processo $p$ richiede la risorsa $R$, prima o poi $p$ ottiene $R$" $\\rightarrow$ liveness.
7. **Fairness dell'esecuzione:** "ogni processo è eseguito infinite volte e ogni messaggio prima o poi è consegnato" $\\rightarrow$ liveness.
8. **Guasti limitati:** "un'esecuzione contiene al più $f$ guasti" $\\rightarrow$ safety (l'$(f+1)^{\\text{th}}$ guasto la viola per sempre).
9. **Recupero prima o poi (eventual recovery):** "se il processo $p$ va in crash, prima o poi $p$ si riprende" $\\rightarrow$ liveness.
10. **Recupero in tempo limitato (time-bounded recovery):** "se il processo $p$ va in crash, $p$ si riprende entro al più $K$ eventi" $\\rightarrow$ safety (il $(K+1)^{\\text{th}}$ evento senza recupero la viola). Si noti che il recupero in tempo limitato implica il recupero prima o poi.
11. **Output di insiemi:** "se il processo $p$ dà in output un insieme $O_p$, ogni processo $q$ dà in output un insieme $O_q$, e per ogni $p, q$ vale $O_p \\subseteq O_q \\lor O_q \\subseteq O_p$" $\\rightarrow$ proprietà mista. Va divisa in:
  - **Output prima o poi (liveness):** se $p$ produce un output, ogni processo corretto prima o poi produce un output.
  - **Contenimento (safety):** due insiemi di output qualunque sono confrontabili per inclusione ($O_p \\subseteq O_q \\lor O_q \\subseteq O_p$).

## Il modello di calcolo reattivo

### Come si specificano i protocolli distribuiti nel modello di calcolo reattivo?

In questo corso i protocolli distribuiti sono macchine a stati scritte in uno pseudo-codice a eventi, secondo un **modello di calcolo reattivo**: i componenti di uno stesso processo comunicano scambiandosi eventi, e un algoritmo è descritto come un insieme di gestori di eventi (handler) che reagiscono agli eventi in arrivo ed eventualmente ne generano di nuovi: $$\\mathbf{upon\\ event}\\ \\langle \\text{Interface}, \\text{EventName} \\mid \\text{parameters} \\rangle\\ \\mathbf{do}\\ \\dots$$

### Qual è la garanzia di atomicità degli handler?

Gli handler locali sono **atomici**. Quando un handler scatta sul processo $p$, viene eseguito fino in fondo senza intrecciarsi con gli altri handler di $p$. Concettualmente il processo acquisisce un lock globale prima di eseguire un handler e lo rilascia alla fine. Un handler non può essere interrotto da un altro handler locale: può essere interrotto solo da un crash del processo.

## Stubborn point-to-point link (SL)

### Come si toglie agli strati superiori l'obbligo di inviare i messaggi infinite volte?

Il fair-lossy link costringe lo strato superiore a ciclare per sempre per garantire la consegna di un messaggio. Per nascondere questa complessità si introduce lo **stubborn point-to-point link ($\\mathrm{SL}$)**. Lo stubborn link permette all'applicazione di inviare un messaggio **una volta sola**, mentre il protocollo del collegamento si occupa al suo interno della ritrasmissione periodica che fa consegnare il messaggio al destinatario infinite volte.

### Quali sono le proprietà formali di uno stubborn link?

Uno stubborn link fornisce l'evento di richiesta $\\text{SL.send}(q, m)$ e l'evento di indicazione $\\text{SL.deliver}(p, m)$, ed è definito da due proprietà:

- **SL1 - Stubborn delivery (liveness):** se un processo corretto $p$ invia un messaggio $m$ a un processo $q$, allora $q$ consegna $m$ un numero infinito di volte. $$\\forall p, q \\in \\Pi \\text{ s.t. } p \\in \\text{Correct}, \\quad \\left( \\text{SL.send}(q, m) \\text{ executed at } p \\implies \\text{count}(\\text{SL.deliver}(p, m)) = \\infty \\text{ at } q \\right)$$
- **SL2 - No creation (safety):** se un processo $q$ consegna un messaggio $m$ con mittente $p$, allora $m$ è stato inviato in precedenza da $p$ a $q$. $$\\forall p, q \\in \\Pi, \\quad \\left( \\text{SL.deliver}(p, m) \\text{ at } q \\implies \\text{SL.send}(q, m) \\text{ was previously executed at } p \\right)$$

### Come funziona l'algoritmo dello stubborn link sopra un fair-lossy link?

\`\`\` Retransmit Forever: uno stubborn link sopra un fair-lossy link
Module: StubbornPointToPointLink, instance sl
Uses:   FairLossyLink, instance fl

 1  upon event < sl, Init > do
 2      sent := ∅;
 3      startTimer(Δ);

 4  upon event < sl, Send | q, m > do
 5      sent := sent ∪ {(q, m)};
 6      trigger < fl, Send | q, m >;

 7  upon event < fl, Deliver | p, m > do
 8      trigger < sl, Deliver | p, m >;

 9  upon event < Timeout > do
10      for all (q, m) ∈ sent do
11          trigger < fl, Send | q, m >;
12      startTimer(Δ);
\`\`\`

**Spiegazione riga per riga:**

- **Dichiarazione del modulo:** definisce \`StubbornPointToPointLink\` (istanza \`sl\`), costruito direttamente sopra un \`FairLossyLink\` sottostante (istanza \`fl\`).
- **Handler di inizializzazione** (\`upon event < sl, Init >\`, righe 1-3):
  - \`sent := ∅\`: inizializza a vuoto l'insieme interno \`sent\`. L'insieme contiene le coppie $(q, m)$ di processo di destinazione e messaggio di cui è stata chiesta la trasmissione.
  - \`startTimer(Δ)\`: arma un timer di ritrasmissione di periodo $\\Delta$.
- **Handler di invio** (\`upon event < sl, Send | q, m >\`, righe 4-6):
  - \`sent := sent ∪ {(q, m)}\`: aggiunge la coppia $(q, m)$ all'insieme locale \`sent\`.
  - \`trigger < fl, Send | q, m >\`: passa subito il messaggio $m$ al fair-lossy link sottostante, per una prima trasmissione verso $q$.
- **Handler di consegna** (\`upon event < fl, Deliver | p, m >\`, righe 7-8):
  - \`trigger < sl, Deliver | p, m >\`: a un'indicazione di consegna del fair-lossy link, lo stubborn link inoltra l'indicazione $\\text{SL.deliver}$ allo strato superiore.
- **Handler del timeout** (\`upon event < Timeout >\`, righe 9-12):
  - \`for all (q, m) ∈ sent do trigger < fl, Send | q, m >\`: ogni volta che il timer scade, l'handler scorre tutte le coppie $(q, m)$ conservate in \`sent\` e invia una nuova copia di $m$ sul fair-lossy link.
  - \`startTimer(Δ)\`: riarma il timer, così la ritrasmissione si ripete ogni $\\Delta$ unità di tempo, per sempre.

### Come si dimostra formalmente la correttezza dell'algoritmo dello stubborn link?

**Dimostrazione 1: no creation ($\\mathrm{SL}2$), per assurdo.**

1. Si supponga per assurdo che $\\mathrm{SL}2$ sia violata: il processo $q$ genera $\\text{SL.deliver}(p, m)$, ma $p$ non ha mai eseguito $\\text{SL.send}(q, m)$.
2. Guardando lo pseudo-codice, $\\text{SL.deliver}(p, m)$ è generato se e solo se viene eseguita la riga 8: $\\text{trigger } \\langle \\text{sl, Deliver} \\mid p, m \\rangle$.
3. La riga 8 sta dentro l'handler $\\text{upon event } \\langle \\text{fl, Deliver} \\mid p, m \\rangle$. Quindi, se la riga 8 viene eseguita, il collegamento sottostante ha generato $\\text{FL.deliver}(p, m)$.
4. Per ipotesi il collegamento sottostante soddisfa $\\mathrm{FL}3$ (no creation). Perciò $\\text{FL.deliver}(p, m)$ su $q$ implica che il processo $p$ ha eseguito in precedenza $\\text{FL.send}(q, m)$.
5. Guardando il codice del processo $p$, $\\text{FL.send}(q, m)$ è eseguito solo alla riga 6 (dentro l'handler di $\\text{SL.send}$) o alla riga 11 (dentro l'handler di $\\text{Timeout}$). In entrambi i casi $(q, m) \\in \\mathit{sent}$.
6. La coppia $(q, m)$ è aggiunta all'insieme \`sent\` solo alla riga 5, che richiede un'esecuzione esplicita di $\\text{SL.send}(q, m)$ su $p$.
7. Quindi $p$ deve aver eseguito $\\text{SL.send}(q, m)$, contro l'ipotesi iniziale. $\\mathrm{SL}2$ vale. $\\blacksquare$

**Dimostrazione 2: stubborn delivery ($\\mathrm{SL}1$), per assurdo.**

1. Si supponga per assurdo che $\\mathrm{SL}1$ sia violata: un processo corretto $p$ esegue $\\text{SL.send}(q, m)$, ma il processo $q$ consegna $m$ solo un numero finito di volte ($\\text{count}(\\text{SL.deliver}(p, m)) = k < \\infty$).
2. Quando $p$ esegue $\\text{SL.send}(q, m)$, viene eseguita la riga 5, che inserisce $(q, m)$ nell'insieme \`sent\`.
3. Poiché l'insieme \`sent\` può solo crescere (gli elementi non vengono mai tolti), $(q, m)$ resta in \`sent\` per sempre.
4. La riga 12 riarma il timer senza fine. Poiché $p$ è corretto, l'handler di $\\text{Timeout}$ viene eseguito infinite volte.
5. A ogni esecuzione dell'handler del timeout, la riga 11 esegue $\\text{FL.send}(q, m)$. Quindi il processo $p$ esegue $\\text{FL.send}(q, m)$ un numero infinito di volte.
6. Per ipotesi il collegamento sottostante soddisfa $\\mathrm{FL}1$ (fair loss). Poiché il processo corretto $p$ esegue $\\text{FL.send}(q, m)$ infinite volte, il collegamento sottostante deve generare $\\text{FL.deliver}(p, m)$ su $q$ un numero infinito di volte.
7. Ogni evento $\\text{FL.deliver}(p, m)$ su $q$ fa eseguire la riga 8, che genera $\\text{SL.deliver}(p, m)$. Quindi $q$ genera $\\text{SL.deliver}(p, m)$ infinite volte, contro l'ipotesi che la consegna sia avvenuta solo $k < \\infty$ volte. $\\mathrm{SL}1$ vale. $\\blacksquare$

## Perfect point-to-point link (PL)

### Come si eliminano le consegne duplicate per ottenere una consegna esattamente una volta?

Lo stubborn link garantisce la consegna di un messaggio senza cicli infiniti nell'applicazione, ma consegna al destinatario infinite copie di ogni messaggio. Per avere una semantica di comunicazione pulita, sopra lo stubborn link si costruisce il **perfect point-to-point link ($\\mathrm{PL}$)**. Il perfect link filtra i duplicati e consegna ogni messaggio allo strato superiore **esattamente una volta**.

### Quali sono le proprietà formali di un perfect point-to-point link?

Un perfect link fornisce l'evento di richiesta $\\text{PL.send}(q, m)$ e l'evento di indicazione $\\text{PL.deliver}(p, m)$, ed è definito da tre proprietà:

- **PL1 - Reliable delivery (liveness):** se un processo corretto $p$ invia un messaggio $m$ a un processo corretto $q$, allora $q$ prima o poi consegna $m$. $$\\forall p, q \\in \\text{Correct}, \\quad \\left( \\text{PL.send}(q, m) \\text{ at } p \\implies \\diamond\\, \\text{PL.deliver}(p, m) \\text{ at } q \\right)$$
- **PL2 - No duplication (safety):** nessun messaggio è consegnato più di una volta a un processo $q$. $$\\forall p, q \\in \\Pi, \\quad \\text{count}(\\text{PL.deliver}(p, m) \\text{ at } q) \\le 1$$
- **PL3 - No creation (safety):** se un processo $q$ consegna un messaggio $m$ con mittente $p$, allora $m$ è stato inviato in precedenza da $p$ a $q$. $$\\forall p, q \\in \\Pi, \\quad \\left( \\text{PL.deliver}(p, m) \\text{ at } q \\implies \\text{PL.send}(q, m) \\text{ was previously executed at } p \\right)$$

In $\\mathrm{PL}1$ anche il destinatario deve essere corretto: se $q$ va in crash prima di consegnare $m$, nessun algoritmo può farglielo consegnare. In $\\mathrm{PL}2$ i messaggi si assumono unici: se l'applicazione invia due volte lo stesso messaggio, la seconda copia è trattata come un duplicato e non viene consegnata.

### Come funziona l'algoritmo del perfect link sopra uno stubborn link?

\`\`\` Eliminate Duplicates: un perfect link sopra uno stubborn link
Module: PerfectPointToPointLink, instance pl
Uses:   StubbornPointToPointLink, instance sl

1  upon event < pl, Init > do
2      delivered := ∅;

3  upon event < pl, Send | q, m > do
4      trigger < sl, Send | q, m >;

5  upon event < sl, Deliver | p, m > do
6      if m ∉ delivered then
7          delivered := delivered ∪ {m};
8          trigger < pl, Deliver | p, m >;
\`\`\`

**Spiegazione riga per riga:**

- **Dichiarazione del modulo:** definisce \`PerfectPointToPointLink\` (istanza \`pl\`), costruito sopra uno \`StubbornPointToPointLink\` sottostante (istanza \`sl\`).
- **Handler di inizializzazione** (\`upon event < pl, Init >\`, righe 1-2):
  - \`delivered := ∅\`: inizializza a vuoto l'insieme interno \`delivered\`. L'insieme è il filtro che elimina i duplicati: contiene ogni messaggio $m$ già consegnato allo strato superiore.
- **Handler di invio** (\`upon event < pl, Send | q, m >\`, righe 3-4):
  - \`trigger < sl, Send | q, m >\`: quando l'applicazione chiede la trasmissione del messaggio $m$ alla destinazione $q$, il perfect link si limita a passare la richiesta allo stubborn link sottostante.
- **Handler di consegna** (\`upon event < sl, Deliver | p, m >\`, righe 5-8):
  - \`if m ∉ delivered then\`: a un'indicazione di consegna dello stubborn link, l'handler controlla l'insieme locale \`delivered\`.
  - \`delivered := delivered ∪ {m}\`: se il messaggio $m$ non è mai stato consegnato, $m$ viene subito aggiunto a \`delivered\`.
  - \`trigger < pl, Deliver | p, m >\`: l'handler consegna $m$ allo strato superiore. Ogni copia successiva di $m$ che arriva dallo stubborn link non supera il test \`m ∉ delivered\` e viene scartata in silenzio.

### Come si dimostra formalmente la correttezza dell'algoritmo del perfect link?

**Dimostrazione 1: no creation ($\\mathrm{PL}3$), per assurdo.**

1. Si supponga per assurdo che $\\mathrm{PL}3$ sia violata: il processo $q$ genera $\\text{PL.deliver}(p, m)$, ma $p$ non ha mai eseguito $\\text{PL.send}(q, m)$.
2. La riga 8 ($\\text{trigger } \\langle \\text{pl, Deliver} \\mid p, m \\rangle$) viene eseguita solo se l'handler della riga 5 riceve l'evento $\\text{SL.deliver}(p, m)$ dallo stubborn link sottostante.
3. Per ipotesi lo stubborn link soddisfa la proprietà $\\mathrm{SL}2$ (no creation). Quindi $\\text{SL.deliver}(p, m)$ su $q$ implica che il processo $p$ ha eseguito in precedenza $\\text{SL.send}(q, m)$.
4. La riga 4 mostra che $p$ esegue $\\text{SL.send}(q, m)$ se e solo se l'applicazione ha invocato $\\text{PL.send}(q, m)$.
5. Perciò $p$ deve aver eseguito $\\text{PL.send}(q, m)$, contro l'ipotesi. $\\mathrm{PL}3$ vale. $\\blacksquare$

**Dimostrazione 2: no duplication ($\\mathrm{PL}2$), per assurdo.**

1. Si supponga per assurdo che $\\mathrm{PL}2$ sia violata: il processo $q$ consegna due volte il messaggio $m$ di $p$, al passo $t_1$ e a un passo successivo $t_2 > t_1$.
2. Consegnare $m$ a $t_1$ richiede l'esecuzione della riga 8 ($\\text{trigger } \\langle \\text{pl, Deliver} \\mid p, m \\rangle$).
3. Poiché gli handler sono eseguiti in modo atomico, eseguire la riga 8 al passo $t_1$ significa che la riga 7 ($\\mathit{delivered} := \\mathit{delivered} \\cup \\{m\\}$) è stata eseguita nello stesso blocco atomico. Quindi $m \\in \\mathit{delivered}$ subito dopo il passo $t_1$.
4. Al passo $t_2$ il processo $q$ riceve un altro evento $\\text{SL.deliver}(p, m)$ e valuta la riga 6 ($\\text{if } m \\notin \\mathit{delivered}$).
5. Poiché $m$ resta in $\\mathit{delivered}$ per sempre, il test della riga 6 è falso. La riga 8 non può essere eseguita al passo $t_2$.
6. Questo contraddice l'ipotesi che $m$ sia stato consegnato una seconda volta. $\\mathrm{PL}2$ vale. $\\blacksquare$

**Dimostrazione 3: reliable delivery ($\\mathrm{PL}1$), per assurdo.**

1. Si supponga per assurdo che $\\mathrm{PL}1$ sia violata: un processo corretto $p$ esegue $\\text{PL.send}(q, m)$ verso un processo corretto $q$, ma $q$ non esegue mai $\\text{PL.deliver}(p, m)$.
2. Quando $p$ esegue $\\text{PL.send}(q, m)$, la riga 4 esegue $\\text{SL.send}(q, m)$ sullo stubborn link sottostante.
3. Per ipotesi lo stubborn link soddisfa la proprietà $\\mathrm{SL}1$ (stubborn delivery). Poiché $p$ è corretto, lo stubborn link genera $\\text{SL.deliver}(p, m)$ su $q$ un numero infinito di volte.
4. Quando $q$ riceve il primo evento $\\text{SL.deliver}(p, m)$, al passo $t$, vale $m \\notin \\mathit{delivered}$ (perché $m$ non è mai stato consegnato prima di $t$).
5. Quindi al passo $t$ il test della riga 6 è vero, e la riga 8 genera $\\text{PL.deliver}(p, m)$ su $q$.
6. Questo contraddice l'ipotesi che $q$ non consegni mai $m$. $\\mathrm{PL}1$ vale. $\\blacksquare$

## Risultati di impossibilità e modelli con vincoli

### Si può realizzare uno stubborn link senza richiedere la correttezza del processo nella proprietà di consegna?

Si consideri una proprietà di stubborn delivery modificata, $\\mathrm{SL}1'$, che toglie il requisito che il mittente $p$ sia corretto: $$\\mathrm{SL}1': \\quad \\forall p, q \\in \\Pi, \\quad \\left( \\text{SL.send}(q, m) \\text{ executed at } p \\implies \\text{count}(\\text{SL.deliver}(p, m)) = \\infty \\text{ at } q \\right)$$

**Dimostrazione di impossibilità sui fair-lossy link:** è **impossibile** realizzare la proprietà $\\mathrm{SL}1'$ sopra un fair-lossy link.

1. Si supponga che il processo $p$ invochi $\\text{SL.send}(q, m)$ e poi vada in crash al tempo $t_{\\mathit{crash}}$.
2. Prima di $t_{\\mathit{crash}}$ il processo $p$ può eseguire solo un numero finito di passi, e quindi può inviare il messaggio $m$ sul fair-lossy link sottostante solo un numero finito di volte $k < \\infty$.
3. La proprietà di fair loss $\\mathrm{FL}1$ garantisce consegne solo per un messaggio inviato infinite volte: se $m$ è inviato un numero finito di volte, il collegamento può perderne tutte le $k$ copie.
4. Di conseguenza il processo $q$ può consegnare $m$ zero volte, violando $\\mathrm{SL}1'$. Quindi la stubborn delivery non si può garantire se il mittente può andare in crash: $\\mathrm{SL}1'$ è una proprietà che si può scrivere ma non realizzare, perché nessun algoritmo può inviare infiniti messaggi in un tempo finito.

### Si può realizzare un perfect link sopra un fair-lossy link con memoria finita?

Si supponga che il processo $p$ abbia una memoria limitata, capace di contenere al più $K$ messaggi.

**Dimostrazione di impossibilità:** è **impossibile** realizzare un perfect point-to-point link sopra un fair-lossy link usando memoria finita.

1. Per garantire la reliable delivery ($\\mathrm{PL}1$) su un fair-lossy link, ogni messaggio $m$ da inviare va tenuto nella memoria locale e ritrasmesso infinite volte.
2. Si supponga che lo strato superiore chieda la trasmissione verso $q$ di $K+1$ messaggi distinti $\\{m_1, m_2, \\dots, m_K, m_{K+1}\\}$.
3. Poiché la memoria contiene al più $K$ messaggi, memorizzare il $(K+1)^{\\text{th}}$ messaggio costringe il protocollo a sovrascriverne almeno uno già memorizzato (diciamo $m_x$).
4. Una volta tolto $m_x$ dalla memoria locale, il processo $p$ smette di ritrasmetterlo. Quindi $m_x$ è stato inviato sul fair-lossy link solo un numero finito di volte.
5. Un canale fair-lossy può perdere tutte le copie di un messaggio inviato un numero finito di volte. Poiché $m_x$ non è più in memoria, $p$ non lo ritrasmetterà mai.
6. Il processo $q$ non riceve mai $m_x$, e la reliable delivery ($\\mathrm{PL}1$) è violata. Quindi un perfect link su canali fair-lossy richiede memoria illimitata. $\\blacksquare$
`;export{e as default};
