const e=`## Il consenso nei sistemi sincroni e il limite inferiore di f+1 round

### Qual è il modello a round dei sistemi sincroni?

In un sistema sincrono l'esecuzione si può organizzare come una sequenza di **round** ($\\text{Round}_1, \\text{Round}_2, \\dots, \\text{Round}_k$). In ogni round $\\text{Round}_k$:

- Ogni processo $p_i \\in \\Pi$ invia i suoi messaggi all'inizio del round, ad alcuni o a tutti i processi del sistema $\\Pi$.
- Poiché i ritardi dei messaggi sono limitati ($\\Delta$), tutti i messaggi inviati all'inizio di $\\text{Round}_k$ arrivano a destinazione prima che $\\text{Round}_k$ finisca e $\\text{Round}_{k+1}$ cominci.
- L'unico modo in cui un processo $p_j$ può non ricevere in $\\text{Round}_k$ il messaggio di un processo $p_i$ è che $p_i$ vada in crash durante quel round. Se $p_i$ va in crash mentre sta inviando, il suo messaggio può raggiungere un sottoinsieme arbitrario $Q \\subset \\Pi$ dei processi, e i processi rimanenti $\\Pi \\setminus Q$ non ricevono nulla da $p_i$ in quel round.

In questo modello il tempo si conta in round: il numero di round di un algoritmo è la sua complessità in passi.

### Che cos'è un full information protocol (FIP), e perché lo si usa per mostrare i limiti inferiori?

Un **full information protocol (FIP)** è un algoritmo in cui nulla viene mai buttato via o riassunto:

- A ogni round $\\text{Round}_k$, ogni processo $p_i$ invia a tutti i processi la sua intera memoria: il suo valore di ingresso e tutto ciò che ha ricevuto dagli altri processi nei round precedenti.
- Poiché gli algoritmi considerati sono deterministici, un processo che conosce l'ingresso e la memoria di un altro processo può simularlo, e ricavare che cosa farà. Un processo che esegue un FIP conosce quindi tutto ciò che si può conoscere in quell'esecuzione. Se un problema (come il consenso) non si può risolvere in $R$ round con un FIP, allora non si può risolvere in $R$ round con **alcun** algoritmo, perché qualunque altro algoritmo invia solo una parte di quell'informazione.

### Perché il consenso non si può risolvere in meno di $f+1$ round in un sistema sincrono con al più $f$ crash?

**In un sistema sincrono di $n$ processi in cui fino a $f$ processi possono andare in crash, ogni algoritmo deterministico di consenso ha un'esecuzione che richiede almeno $f+1$ round per terminare.**

L'idea della dimostrazione si vede su un full information protocol che decide con una funzione deterministica dei valori che conosce, come $\\min()$ oppure $\\max()$:

- **Nessun guasto ($f = 0$): 1 round.**
  - Se nessun processo va in crash, in $\\text{Round}_1$ ogni processo $p_i$ invia il suo valore di ingresso $v_i \\in \\{0, 1\\}$ a tutti gli altri.
  - Alla fine di $\\text{Round}_1$ nessun messaggio è andato perso, quindi ogni processo ha lo stesso vettore di valori di ingresso $V = \\langle v_1, v_2, \\dots, v_n \\rangle$.
  - Poiché ogni processo ha lo stesso $V$, una funzione deterministica come $v_{\\text{decide}} = \\min(V)$ fa decidere a tutti lo stesso valore. Un round è necessario e sufficiente.
- **Un guasto ($f = 1$): 2 round.**
  - Si supponga che al più un processo possa andare in crash, e si considerino gli ingressi $V = \\langle 1, 1, 0 \\rangle$ dei processi $\\{p_1, p_2, p_3\\}$: $p_3$ è l'unico con il valore $0$.
  - Si supponga che $p_3$ vada in crash durante $\\text{Round}_1$, dopo aver inviato il suo messaggio (con $0$) al solo $p_2$.
  - Alla fine di $\\text{Round}_1$:
    - Il processo $p_1$ ha ricevuto i messaggi dei soli $p_1$ e $p_2$ (entrambi con $1$), quindi la sua vista è $V_1 = \\{1\\}$. Se decidesse ora con $\\min()$, deciderebbe $\\min(\\{1\\}) = 1$.
    - Il processo $p_2$ ha ricevuto i messaggi di $p_1$, $p_2$ e $p_3$, quindi la sua vista è $V_2 = \\{1, 0\\}$. Se decidesse ora con $\\min()$, deciderebbe $\\min(\\{1, 0\\}) = 0$.
  - Se entrambi decidessero in $\\text{Round}_1$, $p_1$ deciderebbe $1$ e $p_2$ deciderebbe $0$, il che viola la proprietà di **agreement** del consenso.
  - Serve quindi un secondo round. In $\\text{Round}_2$ il processo corretto $p_2$ invia tutta la sua memoria, che comprende il valore $0$ di $p_3$, a $p_1$: ora anche $p_1$ conosce $0$ e decide $0$, come $p_2$. Con $f = 1$ servono $1 + 1 = 2$ round.
  - Decidere con $\\max()$ non aiuterebbe: qui i due processi sarebbero d'accordo, ma basta cambiare gli ingressi (il processo che va in crash ha l'unico $1$) per ottenere lo stesso disaccordo. Per ogni funzione deterministica c'è un ingresso che lo provoca.
- **Il caso generale ($f$ guasti): $f+1$ round.**
  - L'avversario costruisce una catena di guasti, mandando in crash esattamente un processo in ognuno di $f$ round consecutivi.
  - In $\\text{Round}_1$ un processo $p_{\\text{crash}, 1}$, l'unico ad avere un certo valore di ingresso, va in crash dopo aver inviato la sua memoria a un solo processo, $p_{\\text{crash}, 2}$.
  - In $\\text{Round}_2$, $p_{\\text{crash}, 2}$ va in crash dopo aver ripetuto quell'informazione a un solo processo, $p_{\\text{crash}, 3}$.
  - La catena prosegue fino a $\\text{Round}_f$, in cui $p_{\\text{crash}, f}$ va in crash dopo aver consegnato l'informazione a un unico processo $p_{\\text{survivor}}$.
  - Durante i round da $1$ a $f$, alla fine di ogni round un processo ne sa più degli altri: le viste dei processi sono diverse, e una decisione violerebbe l'agreement.
  - Solo in $\\text{Round}_{f+1}$, quando non sono più possibili crash (tutti gli $f$ guasti sono stati usati), $p_{\\text{survivor}}$ invia di sicuro ciò che sa a tutti gli altri processi corretti, e le viste diventano uguali.
  - Un crash per round è il caso peggiore. Due crash nello stesso round sprecherebbero un guasto: ne basta uno per rendere diverse le viste, e la catena finirebbe un round prima.

$$\\text{minimum number of rounds for consensus} = f + 1$$

Gli algoritmi delle lezioni precedenti hanno esecuzioni esattamente di questo tipo: negli algoritmi di consenso con i leader, $f$ leader possono andare in crash uno dopo l'altro, e solo il leader numero $f+1$ è di sicuro corretto.

Questa è l'intuizione, mostrata per gli algoritmi che decidono con il minimo o con il massimo. La dimostrazione completa, che vale per qualunque algoritmo, è più lunga: deve mostrare che la stessa costruzione funziona qualunque sia la funzione di decisione. Si trova nei libri di testo sul calcolo distribuito (Attiya e Welch; Lynch).

## Il risultato di impossibilità FLP nei sistemi asincroni

### Che cosa afferma il risultato di impossibilità di Fischer, Lynch e Paterson (FLP) sul consenso nei sistemi asincroni?

Dimostrato da Fischer, Lynch e Paterson nel 1985, il **risultato di impossibilità FLP** è uno dei risultati fondamentali del calcolo distribuito:

**In un sistema asincrono a scambio di messaggi nessun algoritmo deterministico risolve il consenso se anche un solo processo può andare in crash ($f = 1$): per qualunque algoritmo esiste un'esecuzione in cui è violata la safety (validity e agreement) oppure la liveness (termination).**

La dimostrazione non fa parte del corso. Ciò che conta è l'enunciato, e la sua conseguenza: un algoritmo che non viola mai la safety deve avere un'esecuzione in cui qualche processo aspetta per sempre senza decidere.

### Perché il consenso è irrisolvibile in un sistema asincrono anche se un solo processo ($f = 1$) può andare in crash?

In un sistema asincrono:

- I ritardi dei messaggi sono illimitati e imprevedibili.
- Non c'è un orologio globale, e non c'è modo di distinguere un processo molto lento, o i cui messaggi sono in ritardo, da un processo che è andato in crash.
- Se un processo $p_i$ non risponde, un algoritmo non può aspettarlo per sempre: se $p_i$ è andato in crash, l'algoritmo si bloccherebbe, violando la **termination** (liveness).
- D'altra parte, se l'algoritmo va avanti e decide senza aspettare $p_i$, può decidere un valore che contraddice ciò che $p_i$ sa o ha già deciso, violando l'**agreement** o la **validity** (safety), nel caso in cui $p_i$ fosse soltanto lento.
- La dimostrazione di FLP trasforma questo dilemma in un teorema: per qualunque algoritmo deterministico che rispetta la safety, l'ordine di consegna dei messaggi si può scegliere in modo che l'algoritmo resti per sempre in uno stato da cui entrambe le decisioni, $0$ e $1$, sono ancora possibili, e non decida mai.

Il consenso è quindi più difficile dei problemi visti finora. In un sistema asincrono l'uniform reliable broadcast e l'atomic register tollerano una minoranza di crash, e il reliable broadcast regolare ne tollera un numero qualunque; il consenso non ne tollera nemmeno uno.

### Come cambia la risolvibilità del consenso al variare del modello di sistema e delle ipotesi sui guasti?

| Modello di sistema | Failure detector e ipotesi | Crash tollerati ($f$) | Consenso |
|---|---|---|---|
| Sincrono | Perfect failure detector ($\\mathcal{P}$), ritardi limitati ($\\Delta$) | $f < n$ (qualunque $f$) | Risolvibile (servono $f+1$ round) |
| Asincrono | Fail-silent, nessun failure detector | solo $f = 0$ | Irrisolvibile per $f \\ge 1$ (FLP) |
| Asincrono | Fail-silent, maggioranza di processi corretti | $f < n/2$ | Irrisolvibile per il consenso; l'uniform reliable broadcast e gli atomic register $(1,N)$ sono risolvibili |
| Sincrono prima o poi | Eventually perfect failure detector ($\\diamond\\mathcal{P}$) oppure leader election ($\\Omega$) | $f < n/2$ (maggioranza di processi corretti) | Risolvibile (per esempio con Paxos) |

## Paxos: il consenso nei sistemi sincroni prima o poi

### Come fa Paxos ad aggirare l'impossibilità FLP nei sistemi sincroni prima o poi?

L'algoritmo **Paxos** fu ideato da Leslie Lamport nel 1989, mentre cercava di dimostrare che un file system tollerante ai guasti non poteva funzionare come sostenevano i suoi costruttori. Fu descritto in "The Part-Time Parliament" e, poiché quell'articolo risultava difficile da leggere, spiegato di nuovo in "Paxos Made Simple" (2001), il cui abstract è una sola frase: "The Paxos algorithm, when presented in plain English, is very simple". Paxos aggira FLP separando la safety dalla liveness, in un sistema sincrono prima o poi con guasti di tipo crash e una maggioranza di processi corretti:

1. **La safety è garantita sempre.** Paxos garantisce **validity**, **agreement** e **integrity** quali che siano i ritardi dei messaggi, anche nei periodi in cui il sistema si comporta in modo asincrono.
2. **La liveness è garantita solo prima o poi.** Paxos garantisce la **termination** solo quando la rete si comporta bene abbastanza a lungo: dopo il global stabilization time ($\\mathrm{GST}$), quando i ritardi restano sotto un limite $\\Delta$ per il tempo necessario a completare lo scambio di messaggi con una maggioranza dei processi.

È l'unica divisione possibile: in un sistema sincrono prima o poi le proprietà che dipendono dalla sincronia devono essere proprietà di liveness, perché una proprietà di safety violata durante un periodo di asincronia non si può riparare dopo. In accordo con FLP, Paxos ha esecuzioni che non decidono mai; è l'ipotesi di sincronia finale a escluderle.

### Che cosa deve garantire un algoritmo di consenso?

Il consenso ha due eventi:

- **Richiesta:** \`Propose(v)\`, con cui un processo propone un valore $v$.
- **Indicazione:** \`Decide(v)\`, con cui il modulo di consenso restituisce il valore deciso $v$.

Le sue proprietà sono:

- **Termination (liveness):** ogni processo corretto prima o poi decide un qualche valore.
- **Validity, o non-triviality (safety):** se un processo decide un valore $v$, allora $v$ è stato proposto da qualche processo. (Questo esclude gli algoritmi banali che decidono un valore fisso senza guardare le proposte.)
- **Integrity (safety):** nessun processo decide più di una volta. (Una decisione è irrevocabile.)
- **Uniform agreement (safety):** non ci sono due processi, corretti o guasti, che decidono in modo diverso: se $p_i$ decide $v$ e $p_j$ decide $v'$, allora $v = v'$.

Nei termini di Paxos, dove un valore viene "scelto" (chosen) e poi "appreso" (learned): solo un valore che è stato proposto può essere scelto; viene scelto un solo valore; e un processo non apprende mai che un valore è stato scelto se non lo è stato davvero.

### Quali sono i tre ruoli di Paxos, e come vengono assegnati?

Paxos divide i processi in tre ruoli (lo stesso processo fisico può ricoprirli tutti e tre):

1. **Proposer:** i processi che propongono i valori, e cercano di farne scegliere uno.
2. **Acceptor:** i processi che votano. Ricevono le richieste dei proposer, ricordano ciò che hanno promesso e ciò che hanno accettato, e accettano o rifiutano le proposte. Un valore è scelto quando lo ha accettato una maggioranza degli acceptor.
3. **Learner:** i processi che scoprono quale valore è stato scelto, e lo decidono.

L'ipotesi di una maggioranza di processi corretti serve solo per l'insieme degli acceptor.

### Come si rendono unici i numeri di round delle proposte senza comunicazione fra i proposer?

Ogni proposta ha un numero, detto numero di round (o ballot number). Per impedire che due proposer usino lo stesso numero, ogni numero $b$ si può costruire come una coppia $b = \\langle s, p_i \\rangle$, dove:

- $s \\in \\mathbb{N}_0$ è un contatore che può solo crescere;
- $p_i$ è l'identificatore intero unico del proposer.

Le coppie sono ordinate in modo lessicografico: $$b_1 < b_2 \\iff (s_1 < s_2) \\lor (s_1 = s_2 \\land p_1 < p_2)$$

In alternativa, se ci sono $n$ proposer con identificatori $p_i \\in \\{1, 2, \\dots, n\\}$, il proposer $p_i$ usa come suo $k$-esimo numero di round: $$b = k \\cdot n + p_i \\quad \\text{for } k \\in \\{0, 1, 2, \\dots\\}$$ Con due proposer, uno usa i numeri dispari e l'altro i pari; con tre, il primo usa $1, 4, 7, \\dots$, il secondo $2, 5, 8, \\dots$, e il terzo $3, 6, 9, \\dots$. In questo modo i numeri di proposer diversi sono tutti diversi, e totalmente ordinati. L'unicità è essenziale: se due proposer usassero lo stesso numero di round con due valori diversi, potrebbero essere scelti due valori diversi.

### Come si ricavano le proprietà P1, P2, P2a, P2b e P2c di "Paxos Made Simple"?

Lamport arriva all'algoritmo attraverso una catena di requisiti, ognuno dei quali rimedia a un problema del precedente.

La soluzione più semplice è un solo acceptor, che sceglie il primo valore che riceve; ma se quell'acceptor va in crash, tutto si ferma. Quindi gli acceptor devono essere più di uno, e un valore è **scelto** quando lo ha accettato una maggioranza di loro: poiché due maggioranze qualunque si intersecano, questo permette di garantire che venga scelto un solo valore.

1. **Proprietà P1:** un acceptor deve accettare la prima proposta che riceve.
  - Motivo: un valore deve essere scelto anche se un solo proposer propone un solo valore.
  - Problema: se più proposer propongono valori diversi nello stesso momento, ogni acceptor può accettarne uno diverso, e nessun valore raggiunge una maggioranza. Quindi a un acceptor si deve permettere di accettare più di una proposta. Per questo le proposte vengono numerate: una proposta è una coppia $\\langle \\text{number}, \\text{value} \\rangle$, e un valore è scelto quando una singola proposta con quel valore è stata accettata da una maggioranza. Più proposte possono essere scelte, purché abbiano tutte lo stesso valore.
2. **Proprietà P2:** se una proposta con valore $v$ è scelta, allora ogni proposta con numero più alto che viene scelta ha valore $v$.
  - Motivo: garantisce l'agreement. Una volta che un valore $v$ è stato scelto, nessun altro valore $v' \\neq v$ può essere scelto in seguito.
3. **Proprietà P2a:** se una proposta con valore $v$ è scelta, allora ogni proposta con numero più alto accettata da un qualunque acceptor ha valore $v$.
  - Motivo: P2a implica P2, perché per essere scelta una proposta deve essere accettata da almeno un acceptor.
  - Problema: una proposta può essere scelta mentre qualche acceptor $c$ non l'ha mai vista. Un nuovo proposer potrebbe allora inviare a $c$ una proposta con numero più alto e con un valore diverso $v'$, che $c$ dovrebbe accettare per via di P1, contro P2a.
4. **Proprietà P2b:** se una proposta con valore $v$ è scelta, allora ogni proposta con numero più alto emessa da un qualunque proposer ha valore $v$.
  - Motivo: P2b implica P2a. Se nessun proposer emette mai una proposta con numero più alto e con un valore diverso da $v$, nessun acceptor può accettarne una.
5. **Proprietà P2c:** per ogni valore $v$ e ogni numero $n$, se viene emessa una proposta con valore $v$ e numero $n$, allora esiste un insieme $S$ formato da una maggioranza degli acceptor tale che:
  - nessun acceptor in $S$ ha accettato alcuna proposta con numero minore di $n$, oppure
  - $v$ è il valore della proposta con il numero più alto fra tutte le proposte con numero minore di $n$ accettate dagli acceptor in $S$.

P2c implica P2b. Se una proposta di numero $m$ con valore $v$ è stata scelta, una maggioranza $Q$ degli acceptor l'ha accettata, e qualunque maggioranza $S$ contiene almeno un membro di $Q$: per induzione su $n$, ogni proposta di numero $n > m$ che rispetta P2c ha valore $v$.

La catena delle implicazioni è:

**P2c $\\implies$ P2b $\\implies$ P2a $\\implies$ P2**

Per mantenere P2c, un proposer che vuole emettere una proposta di numero $n$ deve conoscere la proposta con il numero più alto, minore di $n$, che è stata accettata, o che sarà accettata, da ogni acceptor di una maggioranza. Conoscere ciò che è già stato accettato è facile; prevedere il futuro no. Quindi, invece di prevedere, il proposer chiede agli acceptor di **promettere** che non accetteranno più proposte con numero minore di $n$. Questa richiesta è la prima fase dell'algoritmo.

### Come funzionano le due fasi di Paxos, passo per passo?

**Fase 1: prepare e promise**

- **Fase 1a, la richiesta di prepare del proposer:**
  - Un proposer $p_i$ sceglie un nuovo numero di round $b$, più alto di quelli che ha usato prima.
  - $p_i$ invia un messaggio \`PREPARE(b)\` agli acceptor (basta una maggioranza). Il messaggio chiede due cose: se $p_i$ può fare una proposta di numero $b$, e se l'acceptor suggerisce un valore per quella proposta.
- **Fase 1b, la promessa dell'acceptor:**
  - Un acceptor $a_j$ che riceve \`PREPARE(b)\` confronta $b$ con il numero di round più alto $b_{\\text{promised}}$ a cui ha già risposto.
  - Se $b > b_{\\text{promised}}$:
    - $a_j$ aggiorna $b_{\\text{promised}} \\leftarrow b$.
    - $a_j$ risponde con un messaggio \`PROMISE(b, b_a, v_a)\`, dove $b_a$ è il numero di round più alto di una proposta che $a_j$ ha **accettato** (oppure $\\bot$ se non ce n'è nessuna), e $v_a$ è il valore di quella proposta (oppure $\\bot$).
    - Con questa risposta $a_j$ promette di non accettare più proposte con numero minore di $b$.
  - Se $b \\le b_{\\text{promised}}$:
    - $a_j$ ignora la richiesta. Come ottimizzazione può rispondere con una conferma negativa \`NACK\`, che non fa parte dell'algoritmo ma permette al proposer di scoprire prima che il suo numero di round è troppo vecchio.

**Fase 2: accept**

- **Fase 2a, la richiesta di accept del proposer:**
  - Quando il proposer $p_i$ ha ricevuto i messaggi \`PROMISE\` di una maggioranza $S$ degli acceptor, guarda tutte le coppie $(b_a, v_a)$ che contengono.
  - Regola per la scelta del valore (proprietà P2c):
    - Se tutte le coppie sono vuote ($b_a = \\bot$: nessun acceptor in $S$ ha accettato nulla), $p_i$ è libero di proporre il proprio valore.
    - Altrimenti $p_i$ prende la coppia con il numero di round $b_a$ più alto, e deve proporre il valore $v_a$ corrispondente.
  - $p_i$ invia un messaggio \`ACCEPT(b, v)\` con il numero di round della sua richiesta di prepare e il valore scelto.
- **Fase 2b, l'accettazione dell'acceptor:**
  - Un acceptor $a_j$ che riceve \`ACCEPT(b, v)\` confronta $b$ con $b_{\\text{promised}}$.
  - Se $b \\ge b_{\\text{promised}}$:
    - $a_j$ accetta la proposta: $b_a \\leftarrow b$, $v_a \\leftarrow v$ e $b_{\\text{promised}} \\leftarrow b$. Si dice che l'acceptor ha **votato** per $v$ nel round $b$.
    - $a_j$ informa tutti i learner con un messaggio \`LEARN(b, v)\`.
  - Se $b < b_{\\text{promised}}$:
    - $a_j$ rifiuta la richiesta, perché ha promesso di non accettare proposte con numero minore di $b_{\\text{promised}}$.
- **Apprendere la decisione:**
  - Un learner che riceve \`LEARN(b, v)\` per lo stesso round $b$ da una maggioranza degli acceptor sa che $v$ è stato scelto: decide $v$, e invia \`DECIDE(v)\` agli altri learner, che decidono $v$ quando lo ricevono.

## Lo pseudo-codice di Paxos e la sua correttezza

### Qual è lo pseudo-codice del proposer, dell'acceptor e del learner?

Il codice è quello dell'articolo "A Simpler Proof for Paxos and Fast Paxos" (Marzullo, Mei e Meling), che il corso usa per la seconda presentazione dell'algoritmo.

\`\`\` Paxos: proposer p
Constants:
  A, n and f        // A is the set of acceptors, n = |A|, f = ⌊(n - 1)/2⌋

Init:
  crnd := -1        // current round number

on < Propose, val > do
  crnd := pickNextRound(crnd);
  cval := val;
  P := ∅;
  send < PREPARE, crnd > to A;

on < PROMISE, rnd, vrnd, vval > with rnd = crnd from acceptor a do
  P := P ∪ {(vrnd, vval)};

on event |P| ≥ n - f do
  j := max{vrnd : (vrnd, vval) ∈ P};
  if j ≥ 0 then
    V := {vval : (j, vval) ∈ P};
    cval := pick(V);      // the value voted in the largest round
  send < ACCEPT, crnd, cval > to A;
\`\`\`

\`\`\` Paxos: acceptor a
Constants:
  L                 // the set of learners

Init:
  rnd := -1;
  vrnd := -1;
  vval := -1;

on < PREPARE, prnd > with prnd > rnd from proposer p do
  rnd := prnd;
  send < PROMISE, rnd, vrnd, vval > to proposer p;

on < ACCEPT, i, v > with i ≥ rnd from proposer p do
  rnd := i;
  vrnd := i;
  vval := v;
  send < LEARN, i, v > to L;
\`\`\`

\`\`\` Paxos: learner l
Init:
  V := ∅;

on < LEARN, (i, v) > from acceptor a do
  V := V ⊎ {(i, v)};

on event ∃ i, v : |{(i, v) : (i, v) ∈ V}| ≥ n - f do
  v is chosen;
\`\`\`

- \`crnd\`, \`cval\`: il numero di round corrente del proposer, e il valore che sta proponendo in quel round.
- \`pickNextRound(crnd)\`: restituisce un numero di round maggiore di \`crnd\` e diverso da quelli di tutti gli altri proposer.
- \`P\`: le coppie \`(vrnd, vval)\` ricevute nelle promesse del round corrente, una per ogni acceptor che ha risposto. Il test \`rnd = crnd\` scarta le promesse dei round precedenti.
- \`n - f\`: poiché \`f = ⌊(n - 1)/2⌋\`, un insieme di \`n - f\` acceptor è una maggioranza.
- \`j\`, \`pick(V)\`: la regola della proprietà P2c. Se qualche acceptor della maggioranza ha già votato (\`j ≥ 0\`), il proposer rinuncia al proprio valore e prende il valore votato nel round più grande \`j\`. Se nessuno ha votato (\`j = -1\`), \`cval\` resta il valore del proposer.
- \`rnd\`: il round più grande a cui l'acceptor ha risposto; è la promessa dell'acceptor.
- \`vrnd\`, \`vval\`: l'ultimo round in cui l'acceptor ha votato e il valore per cui ha votato (\`-1\` se non ha mai votato).
- \`V\` del learner: un multiinsieme (\`⊎\` è l'unione di multiinsiemi), in cui la stessa coppia \`(i, v)\` è contata una volta per ogni acceptor che l'ha inviata. Quando \`n - f\` acceptor hanno inviato la stessa coppia, il valore \`v\` è scelto.

### Perché Paxos rispetta la safety?

Si dice che un acceptor ha **votato** per $v$ nel round $i$ se ha accettato la proposta $\\langle i, v \\rangle$. Vanno dimostrate tre proprietà:

1. Solo un valore che è stato proposto può essere scelto.
2. Viene scelto un solo valore.
3. Solo un valore scelto viene appreso dai learner.

La prima e la terza seguono direttamente dal codice: un proposer propone il proprio valore oppure un valore già votato, e un learner decide solo un valore votato da una maggioranza. La seconda segue da questa affermazione:

**Se un acceptor ha votato per il valore $v$ nel round $i$, allora nessun valore $v' \\neq v$ può essere scelto in un round precedente $j < i$.**

L'affermazione implica che viene scelto un solo valore. In ogni round viene proposto un solo valore, perché un numero di round appartiene a un solo proposer, che in quel round invia un solo \`ACCEPT\`. E se $v$ fosse scelto in un round e $v'$ in uno successivo, qualche acceptor avrebbe votato per $v'$ nel round successivo, quindi per l'affermazione nessun valore diverso da $v'$ potrebbe essere stato scelto prima: $v = v'$.

La dimostrazione dell'affermazione è per induzione sul round $i$. Se un acceptor ha votato per $v$ nel round $i$, allora un proposer ha raccolto, per il suo \`PREPARE\` del round $i$, le promesse di una maggioranza $Q$ degli acceptor.

- **Base:** per $i = 0$ non ci sono round precedenti, e l'affermazione vale.
- **Passo induttivo:** si assuma l'affermazione per tutti i round minori di $i$, e sia $j$ il round più grande fra i voti riportati nelle promesse di $Q$ (con $j < i$).
  - **Round fra $j + 1$ e $i - 1$:** gli acceptor in $Q$ non hanno riportato alcun voto in questi round, e hanno promesso di non votare più in round minori di $i$. Qualunque maggioranza interseca $Q$, quindi in questi round nessuna proposta può essere votata da una maggioranza: lì non può essere scelto alcun valore.
  - **Nessun voto riportato ($j = -1$):** il caso precedente copre tutti i round minori di $i$, e l'affermazione vale.
  - **Round $j$ e precedenti:** altrimenti il proposer ha proposto il valore votato nel round $j$, che è quindi $v$. Nel round $j$ può essere scelto solo $v$, perché in un round viene proposto un solo valore. E poiché qualche acceptor ha votato per $v$ nel round $j$, per l'ipotesi induttiva nessun valore diverso da $v$ può essere scelto nei round minori di $j$.

Quelle dimostrate sono solo proprietà di safety. Manca la termination, e non potrebbe essere altrimenti, per via di FLP.

### Un nuovo proposer può ignorare i valori che sono stati accettati ma non scelti?

Si supponga che, in un sistema di $n$ acceptor, un proposer $P_1$ faccia votare a $n/2 - 1$ acceptor il valore $3$ nel round $j$, un proposer $P_2$ faccia votare ad altri $n/2 - 1$ acceptor il valore $42$ nel round $j + 1$, e gli acceptor rimanenti non ricevano nulla. Nessun valore è stato scelto. Un terzo proposer può, in un round successivo $j + k$, far accettare il valore $7$?

Non può. Per inviare un \`ACCEPT\` con $7$, il proposer deve aver ricevuto, per il suo \`PREPARE\` del round $j + k$, le promesse di una maggioranza in cui nessuno riporta un voto. Ma una maggioranza deve contenere almeno uno degli acceptor che hanno votato, perché quelli che non hanno votato sono troppo pochi. E quell'acceptor non può aver promesso prima di votare: un acceptor che ha promesso il round $j + k$ rifiuta le proposte dei round $j$ e $j + 1$, quindi non avrebbe potuto votarle dopo. Le promesse riportano perciò almeno un voto, e il proposer deve proporre $42$ oppure $3$, il valore del round più grande che vede. Un valore che è stato accettato da qualcuno non si può ignorare, anche se non è stato scelto.

### Che cosa sono i dueling proposers, e perché la termination richiede la sincronia finale?

In un sistema asincrono Paxos può soffrire dei **dueling proposers** (un livelock): due o più proposer continuano a scavalcarsi, e nessuna proposta completa mai la seconda fase.

1. Il proposer $p_1$ invia \`PREPARE\` per il round $b_1 = 1$. Una maggioranza degli acceptor promette il round $1$.
2. Prima che $p_1$ possa inviare il suo \`ACCEPT\`, il proposer $p_2$ invia \`PREPARE\` per il round $b_2 = 2$. Gli stessi acceptor promettono il round $2$, e pongono $b_{\\text{promised}} \\leftarrow 2$.
3. Quando arriva l'\`ACCEPT\` di $p_1$ per il round $1$, gli acceptor lo rifiutano, perché $b_1 = 1 < b_{\\text{promised}} = 2$.
4. Vedendo rifiutata la sua richiesta (per un timeout, o per le conferme negative), $p_1$ prende un round più alto, $b_3 = 3$, e invia di nuovo \`PREPARE\`. Gli acceptor promettono il round $3$, e pongono $b_{\\text{promised}} \\leftarrow 3$.
5. Quando arriva l'\`ACCEPT\` di $p_2$ per il round $2$, viene rifiutato, perché $b_2 = 2 < b_{\\text{promised}} = 3$.
6. Il ciclo può proseguire per sempre ($p_1$ con $b_3$, $p_2$ con $b_4$, $p_1$ con $b_5$, $\\dots$): una sequenza senza fine di prime fasi, senza che alcuna proposta venga mai scelta.

Questa è l'esecuzione che secondo FLP deve esistere. Come scompare con la sincronia finale:

- Il livelock nasce solo perché i tempi di una rete asincrona permettono ai proposer di intrecciare le proprie richieste di prepare con le richieste di accept dei rivali. I messaggi persi o in ritardo, da soli, rallentano soltanto l'algoritmo, purché i proposer usino dei timeout.
- In pratica i proposer eseguono una eventual leader election ($\\Omega$), e fanno proposte solo i proposer che credono di essere il leader. Durante i periodi di asincronia possono esserci più leader, che duellano. Una volta che il sistema è diventato sincrono (dopo $\\mathrm{GST}$), $\\Omega$ indica un solo leader $p_{\\text{leader}}$, e solo $p_{\\text{leader}}$ invia richieste di prepare e di accept.
- Senza rivali a interromperlo, $p_{\\text{leader}}$ completa entrambe le fasi in un tempo limitato, fa votare la sua proposta da una maggioranza, e l'algoritmo **termina**.

### Che cosa serve per usare Paxos in un sistema reale?

L'articolo "Paxos Made Live" (Chandra, Griesemer e Redstone, 2007) racconta come Paxos sia stato trasformato nel log replicato su cui è costruito il servizio di lock Chubby di Google. La sua lezione principale è la distanza fra l'algoritmo e un sistema: Paxos sta in una pagina di pseudo-codice, la sua realizzazione occupa diverse migliaia di righe di codice. Un sistema reale decide una sequenza di valori, eseguendo un'istanza di Paxos per ogni voce del log (Multi-Paxos), e deve affrontare problemi di cui l'algoritmo non parla: dischi che si corrompono, per cui una replica può dimenticare le sue promesse; letture che non dovrebbero costare un'intera istanza di consenso, servite da un master che detiene un lease; cambiamenti nell'insieme delle repliche; log che crescono senza limite e vanno sostituiti da snapshot; e il collaudo di un sistema troppo grande per essere dimostrato corretto.
`;export{e as default};
