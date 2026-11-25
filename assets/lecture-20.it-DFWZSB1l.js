const i=`La Lezione 20 riguarda il **flusso dell'informazione**: requisiti di sicurezza che non riguardano chi può *accedere* ai dati, come nel controllo degli accessi, ma dove i dati possono *andare* una volta che vi si è acceduto. Introduce riservatezza e integrità come proprietà di flusso con i classici esempi \`hi\`/\`lo\`, la differenza fra flussi **espliciti** (assegnamenti, output) e flussi **impliciti** (attraverso i condizionali), i **canali nascosti** (terminazione, tempi, eccezioni), un **sistema di tipi** per il flusso dell'informazione basato su un reticolo di livelli di sicurezza (regole di tipizzazione per espressioni e comandi nello stile di Volpano e Smith, con il sottotipaggio), la definizione semantica di sicurezza come **non interferenza** (insensibile e sensibile alla terminazione, possibilistica e probabilistica), il confronto con Bell-LaPadula, il bisogno di **declassificazione**, e come il flusso dell'informazione viene controllato in pratica (Jif, taint analysis, la taint mode di Perl). Le slide sono 36.

## Le proprietà del flusso dell'informazione (pagine 1-10)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Information flow

### Slide 2 · Motivating example

> - Imagine using your mobile phone to
>   1. locate nearest hotel using google
>   2. book a room with your credit card
> - Sensitive information
>   - location information
>   - credit card no
> - (Un)wanted information flow
>   - location may be leaked to google *only*
>   - credit card info may be leaked to hotel *only*

**Approfondimento.** L'esempio mostra perché il controllo degli accessi non basta. Per trovare un hotel l'app deve mandare la posizione dell'utente a Google, e per prenotarlo deve mandare il numero della carta all'hotel: a entrambe le informazioni sensibili l'app accede *legittimamente*. Il requisito di sicurezza riguarda **dove può fluire ciascuna informazione**: la posizione solo a Google, il numero della carta solo all'hotel. Un'app che manda la posizione a una rete pubblicitaria, o il numero della carta a Google, viola la policy anche se non ha mai acceduto a nulla che non potesse leggere. È esattamente il problema delle app per smartphone che lasciano trapelare dati attraverso librerie di terze parti, per scoprire il quale sono stati costruiti strumenti di taint tracking come TaintDroid (2010).

### Slide 3 · Information Flow

> - An interesting category of security requirements is about information flow
>   - no confidential information should leak over network
>   - no untrusted input from network should leak into database
> - Information flow properties can be about confidentiality or integrity
> - Note the difference with access control:
>   - access control is about *access only*
>   - information flow is *also* about *what you do with data once you accessed it*

**Approfondimento.** I requisiti sul flusso dell'informazione sono di due tipi, duali:

- **Riservatezza**: i dati segreti non devono fluire verso output pubblici ("no confidential information should leak over the network").
- **Integrità**: i dati non fidati non devono fluire in posti fidati ("no untrusted input from the network should flow into the database" senza validazione). È esattamente la struttura degli attacchi di injection delle Lezioni 4, 5 e 9, in cui un input non fidato fluisce in una query o in un comando.

Il controllo degli accessi decide *se* un programma può leggere un file; il controllo del flusso dell'informazione limita anche *che cosa fa il programma* con i dati dopo. Un programma autorizzato a leggere i contatti e a usare la rete rispetta il controllo degli accessi anche se carica i contatti in rete; il controllo del flusso dell'informazione vieterebbe il flusso dai contatti alla rete.

### Slide 4 · Example Information Flow - Confidentiality

> \`String hi; // security label secret\`
>
> \`String lo; // security label public\`
>
> Which program fragments (may) cause problems if **hi** has to be kept confidential?
>
> \`1. hi = lo;\` · \`2. lo = hi;\` · \`3. lo = "1234";\` · \`4. hi = "1234";\`
>
> \`5. println(lo);\` · \`6. println(hi);\` · \`7. readln(lo);\` · \`8. readln(hi);\`

### Slide 5 · Example Information Flow - Confidentiality

> \`String hi; // security label secret\`
>
> \`String lo; // security label public\`
>
> Which program fragments (may) cause problems if **hi** has to be kept confidential?
>
> ✓ \`1. hi = lo;\` · ✗ \`2. lo = hi;\` · ✓ \`3. lo = "1234";\` · ? \`4. hi = "1234";\`
>
> ✓ \`5. println(lo)\` · ✗ \`6. println(hi);\` · ✓ \`7. readln(lo);\` · ? \`8. readln(hi);\`

**Approfondimento.** La slide 4 pone la domanda e la slide 5 dà le risposte: ✓ (verde) significa nessun problema, ✗ (rosso) significa una fuga di informazioni, ? significa "dipende". \`hi\` contiene un segreto e \`lo\` è pubblica, il che significa che il suo valore può essere osservato da un attaccante.

- **2. \`lo = hi;\`** ✗: il segreto viene copiato in una variabile pubblica, un **flusso esplicito** dall'alto verso il basso.
- **6. \`println(hi);\`** ✗: il segreto viene stampato su un output pubblico.
- 1, 3, 5, 7 ✓: copiare dati pubblici nella variabile segreta, assegnare costanti alle variabili pubbliche, stampare o leggere dati pubblici non rivela nulla su \`hi\`.
- **4. \`hi = "1234";\`** e **8. \`readln(hi);\`** ?: non lasciano trapelare \`hi\`, ma lo *sovrascrivono* con una costante o con un input. Per la riservatezza va bene; se sia accettabile dipende dall'integrità di \`hi\` (slide successive) e dal fatto che il mondo esterno possa capire che \`hi\` è stato sovrascritto.

### Slide 6 · Example Information Flow - Integrity

> \`String hi;\` **\`// high integrity (trusted) data\`**
>
> \`String lo;\` **\`// low integrity (untrusted) data\`**
>
> Which program fragments (may) cause problems if integrity of hi is important ?
>
> \`1. hi = lo;\` · \`2. lo = hi;\` · \`3. lo = "1234";\` · \`4. hi = "1234";\`
>
> \`5. println(lo);\` · \`6. println(hi);\` · \`7. readln(lo);\` · \`8. readln(hi);\`

### Slide 7 · Example Information Flow - Integrity

> \`String hi;\` **\`// high integrity (trusted) data\`**
>
> \`String lo;\` **\`// low integrity (untrusted) data\`**
>
> Which program fragments (may) cause problems if integrity of hi is important ?
>
> ✗ \`1. hi = lo;\` · ✓ \`2. lo = hi;\` · ✓ \`3. lo = "1234";\` · ✓ \`4. hi = "1234";\`
>
> ✓ \`5. println(lo);\` · ✓ \`6. println(hi);\` · ✓ \`7. readln(lo);\` · ✗ \`8. readln(hi);\`

**Approfondimento.** Gli stessi otto frammenti, ora con \`hi\` come dato **fidato** (ad alta integrità) e \`lo\` come dato non fidato. Le risposte si capovolgono rispetto alla riservatezza:

- **1. \`hi = lo;\`** ✗: dati non fidati fluiscono in una variabile fidata, per esempio un input dell'utente salvato senza validazione in un campo di cui il programma poi si fida. È la violazione di integrità dietro ogni attacco di injection.
- **8. \`readln(hi);\`** ✗: l'input dal mondo esterno, non fidato per definizione, viene scritto direttamente in dati fidati.
- Tutti gli altri ✓: leggere dati fidati in una variabile non fidata (2), stampare (5, 6) o assegnare costanti (3, 4: una costante scelta dal programmatore è fidata) non danneggiano l'integrità di \`hi\`.

La riservatezza vieta i flussi dall'alto verso il basso; l'integrità vieta i flussi dal basso (non fidato) verso l'alto (fidato). Le due sono duali (slide successiva).

### Slide 8 · Some points to note

> - Beware: \`readln(confidential)\` and \`println(high_integrity)\` are *not* a problem
> - Integrity and confidentiality are similarly modelled
>   - Traditionally, most work on information flow looks at confidentiality; if we "flip" everything, we get a corresponding result for integrity
> - Information flow properties are about ruling out unwanted influences/dependencies/interference/observations
> - Note the difference between data flow properties and visibility modifiers (eg public, private) or, more generally, access control
>   - it is not (just) about accessing data, but also about what you do with it

**Approfondimento.** I punti da ricordare:

- Leggere un input *dentro* una variabile riservata non la fa trapelare, e stampare un valore ad alta integrità non lo corrompe; le direzioni pericolose sono riservato → output e input → fidato.
- La teoria viene sviluppata per la riservatezza e trasferita all'integrità per **dualità**: scambiando "alto" e "basso" (segreto ↔ fidato) le stesse regole danno l'integrità (la base formale di questa dualità è il modello di integrità di Biba, l'immagine speculare di Bell-LaPadula, slide 30).
- La nozione generale è la **non interferenza**: gli input segreti non devono influenzare gli output pubblici (slide 26-28).
- I modificatori di visibilità (\`private\`) sono controllo degli accessi dentro il programma: un campo \`private\` può comunque essere restituito da un getter \`public\` e stampato. Il flusso dell'informazione è una proprietà di ciò che l'intero programma fa con i dati.

### Slide 9 · Questions

> - how can we specify information flow policies?
> - how can we enforce or check them?
>   - dynamically or statically
> - what is the semantics of information flow?
>   - i.e. when can we say there is information flow? how can we characterize it?

**Approfondimento.** Le tre domande a cui risponde il resto della lezione: la **specifica** (etichette di sicurezza sulle variabili e un reticolo di livelli, slide 18-19), l'**applicazione** (enforcement), dinamica (monitoraggio o tainting a run time, slide 35) o statica (un sistema di tipi, slide 18-23), e la **semantica**, una definizione precisa di che cosa significhi "nessuna informazione fluisce", così che si possa dimostrare la correttezza del meccanismo di controllo (non interferenza, slide 26-32).

### Slide 10 · Type-based information flow

> - Type systems have been proposed as way to restrict information flow.
> - Practical problem: often very (too) restrictive, because of trickier examples (next slides).
> - The most mature realisation of a type system for information flow is probably in the Jflow/Jif system for Java by Andrew Myers & co.

**Approfondimento.** L'idea, dovuta a Denning e Denning (1977) e formalizzata come sistema di tipi da Volpano, Smith e Irvine (1996), è dare a ogni variabile un **livello** di sicurezza come parte del suo tipo, e lasciare che il type checker rifiuti i programmi in cui l'informazione fluisce da un livello più alto a uno più basso. È statica, quindi non costa nulla a run time e intercetta le fughe prima che il programma giri, ma è **conservativa**: per escludere i flussi impliciti (slide successive) deve rifiutare molti programmi innocui. **Jif** (Java + Information Flow, in origine JFlow, di Andrew Myers alla Cornell, 1999) è l'implementazione più sviluppata: Java esteso con etichette che specificano, per ogni valore, i suoi proprietari e i lettori che essi ammettono (il decentralized label model), più una declassificazione controllata (slide 34).

## Flussi impliciti e canali nascosti (pagine 11-17)

### Slide 11 · Trickier examples for confidentiality

> \`int hi; // security label secret\`
>
> \`int lo; // security label public\`
>
> Which program fragments (may) cause problems for confidentiality?
>
> 1. \`if (hi > 0) { lo = 99; }\`
> 2. \`if (lo > 0) { hi = 66; }\`
> 3. \`if (hi > 0) { print(lo);}\`
> 4. \`if (lo > 0) { print(hi);}\`

### Slide 12 · Trickier examples for confidentiality

> \`int hi; // security label secret\`
>
> \`int lo; // security label public\`
>
> Which program fragments (may) cause problems for confidentiality?
>
> ✗ \`1. if (hi > 0) { lo = 99; }\`
>
> ✓ \`2. if (lo > 0) { hi = 66; }\`
>
> ✗ \`3. if (hi > 0) { print(lo);}\`
>
> ✗ \`4. if (lo > 0) { print(hi);}\`
>
> implicit aka indirect flows

**Approfondimento.** In 1 e in 3 non viene copiato alcun valore segreto, eppure entrambi lasciano trapelare informazioni:

- **1.** Dopo \`if (hi > 0) { lo = 99; }\`, se \`lo\` vale 99 l'attaccante sa che \`hi > 0\`; se ha mantenuto il suo vecchio valore, che \`hi <= 0\`. Un bit su \`hi\` è fluito in \`lo\` attraverso il **flusso di controllo**: un flusso **implicito** (o indiretto).
- **3.** Il fatto che qualcosa venga stampato rivela se \`hi > 0\`, anche se viene stampata solo la variabile pubblica \`lo\`.
- **4.** Un flusso esplicito: il segreto viene stampato (solo quando \`lo > 0\`, ma non importa).
- **2.** ✓ La condizione dipende solo da dati pubblici, e l'assegnamento scrive una variabile segreta: nulla di segreto raggiunge un posto pubblico.

Un bit può sembrare innocuo, ma in un ciclo lo stesso schema fa trapelare un intero segreto un bit alla volta (per esempio un ciclo che controlla ogni bit di \`hi\` e imposta il bit corrispondente di \`lo\`). Escludere i flussi impliciti è ciò che rende restrittivi i sistemi di tipi per il flusso dell'informazione (slide 21: la regola per \`if\`).

### Slide 13 · indirect vs direct flows

> - Direct a.k.a. explicit flows happen by a "direct" assignment/leaking, e.g. as in **\`lo=hi;\`** or **\`println(hi);\`**
>
> More subtle forms of information flows:
>
> 1) indirect/implicit flows, e.g. by **\`if (hi > 0} { lo = 99; }\`**
>
> 2) information flow via (non)termination or exceptions, or other hidden or covert channels

**Approfondimento.** La classificazione: i flussi **espliciti** copiano il segreto (assegnamenti, output); i flussi **impliciti** passano attraverso la struttura di controllo (diramarsi su un segreto e poi scrivere o stampare); e i **canali nascosti** usano effetti che non fanno parte dei normali output del programma: se il programma termina, quanto tempo impiega, se lancia un'eccezione (slide 14-16). (L'esempio della slide ha una parentesi sbagliata, \`(hi > 0}\`, al posto di \`(hi > 0)\`.) I flussi espliciti sono facili da individuare, quelli impliciti richiedono di tenere traccia del livello del program counter, e i canali nascosti sono i più difficili, perché dipendono da ciò che l'attaccante può osservare.

### Slide 14 · Trickier examples for confidentiality

> Example
>
> \`int hi; // security label secret\`
>
> \`int lo; // security label public\`
>
> Which program fragments (may) cause problems for confidentiality?
>
> - \`while (hi>99) do {....};\`
> - \`while (lo>99) do {....};\`
> - \`a[hi] = 23; // where a is high/secret\`
> - \`a[hi] = 23; // where a is low/public\`
> - \`a[lo] = 23; // where a is high/secret\`
> - \`a[lo] = 23; // where a is low/public\`

### Slide 15 · Trickier examples for confidentiality

> \`int hi; // security label secret\`
>
> \`int lo; // security label public\`
>
> ✗ \`1. while (hi>99) do {....};\`
> \`// timing or termination may reveal if hi > 99\`
>
> ✓ \`2. while (lo>99) do {....};\` // no problem
>
> ✗ \`3. a[hi] = 23; // where a is high/secret\`
> \`// exception may reveal if hi is negative\`
>
> ✗ \`4. a[hi] = 23; // where a is low/public\`
> \`// contents of a may reveal value of hi and, again,\`
> \`// exception may reveal if hi is negative\`
>
> ✗ \`5. a[lo] = 23; // where a is high/secret\`
> \`// exception may reveal the length of a, which may be secret\`
>
> ✓ \`6. a[lo] = 23; // where a is low/public\`

**Approfondimento.** Le risposte (slide 15) introducono i canali nascosti:

1. **\`while (hi>99)\`**: se il ciclo gira, e per quanto tempo, dipende da \`hi\`. Un attaccante che vede il programma bloccarsi, o che misura quanto tempo impiega, scopre se \`hi > 99\`: un canale di **terminazione** o di **tempo**.
2. Un ciclo su dati pubblici non rivela nulla di segreto.
3. Scrivere una costante pubblica in un array segreto a un indice segreto non fa trapelare dati in \`a\`, ma se \`hi\` è negativo o fuori dai limiti il programma lancia un'**eccezione**, che rivela qualcosa su \`hi\`.
4. Scrivere a un indice segreto in un array **pubblico** è una fuga esplicita (l'elemento che cambia dice il valore di \`hi\`), più lo stesso canale delle eccezioni.
5. Un indice pubblico in un array segreto: i dati restano segreti, ma un'eccezione per un indice fuori dai limiti rivela la **lunghezza** di \`a\`, che può essere essa stessa segreta.
6. Indice pubblico, array pubblico: nessun segreto coinvolto.

### Slide 16 · Hidden channels

> More subtle forms of indirect information flows can arise via hidden or covert channels, eg
>
> - (non)termination
>
>   eg **\`while (hi>99) do {....};\`**
>
>   or **\`if (hi=99) then {"loop"} else {"terminate"}\`**
> - execution time
>
>   eg **\`for (i=0; i<hi; i++) {...};\`**
>
>   or **\`if (hi=1234) then {...} else {...}\`**
> - exceptions
>
>   eg **\`a[i] = 23\`** may reveal length of a (if i is known), or leak info about **\`i\`** (if length of a is known), or reveal if a is null..

**Approfondimento.** I **canali nascosti** trasportano informazione attraverso proprietà dell'esecuzione che il programma non intende fornire come output:

- **Terminazione**: un programma che cicla all'infinito quando un segreto ha un certo valore comunica il valore all'attaccante proprio non terminando.
- **Tempo di esecuzione**: un ciclo che gira \`hi\` volte, o due rami di lunghezza diversa, fanno dipendere dal segreto il tempo di esecuzione. I canali di tempo sono molto concreti: confronti di password che si fermano al primo carattere sbagliato, e codice crittografico i cui tempi dipendono dai bit della chiave (gli attacchi a tempo di Kocher, 1996; gli attacchi alla cache dietro Spectre), hanno fatto trapelare segreti nella realtà. La difesa standard è il codice a **tempo costante** per le operazioni che dipendono da segreti.
- **Eccezioni**: il fatto che si verifichi un'eccezione rivela proprietà dell'indice, dell'array o del riferimento coinvolto.

Altri canali: il consumo di energia, l'uso della memoria e della cache, la dimensione del traffico di rete. Un sistema di tipi può controllare solo i canali che modella; le slide 28-29 mostrano come si gestisce la terminazione.

### Slide 17 · Questions

> - how can we specify information flow policies?
> - how can we enforce or check them?
>   - dynamically or statically
>     - a type system for information flow
> - what do these policies really mean?
>   - and is our enforcement sound?

**Approfondimento.** Le domande della slide 9, ora con l'approccio scelto: le policy si specificano con livelli di sicurezza, si fanno rispettare staticamente con un sistema di tipi (slide 18-23), e ricevono un significato con la non interferenza, rispetto alla quale si dimostra la correttezza del sistema di tipi (slide 24-29).

## Un sistema di tipi per il flusso dell'informazione (pagine 18-25)

### Slide 18 · Types for information flow (confidentiality)

> - We consider a lattice of different security levels
> - For simplicity, just two levels
>   - H(igh) or confidential, secret or
>   - L(ow) public
> - Typing judgements *γ ⊢ e : t* meaning e has type *t* in context *γ*
> - Context *γ = x₁ : t₁, … xₙ : tn* gives levels of program variables

![Lezione 20, pagina 18](L20_p18.webp "4% 71x399")

**Figura.** Il reticolo a due livelli: **H** sopra **L**, uniti da una linea verticale.

**Approfondimento.** I livelli di sicurezza formano un **reticolo**: un ordine parziale (≤, "può fluire verso") in cui ogni coppia di livelli ha un minimo maggiorante (il livello dei dati che li combinano entrambi). Il reticolo più semplice ha due livelli, **L** (basso, pubblico) ≤ **H** (alto, segreto): l'informazione può fluire da L a H ma non da H a L. I programmi si tipizzano con dei **giudizi**: *γ ⊢ e : t* dice che, nel **contesto** γ, che assegna un livello a ogni variabile (\`hi : H\`, \`lo : L\`), l'espressione *e* ha livello *t*, cioè contiene informazione di livello *t* o inferiore (slide 20).

### Slide 19 · More complex lattices

![Lezione 20, pagina 19](L20_p19.webp "50% 1400x778")

**Figura.** Due reticoli. A sinistra, una catena: **Top Secret** - **Secret** - **Classified** - **Unclassified**. A destra, un reticolo con livelli e compartimenti: **Top Secret** in cima è collegato a "**Top Secret Syria**", "**Top Secret Lybia**" e "**Secret**"; "Top Secret Syria" è collegato sotto a "**Secret Syria**", e "Top Secret Lybia" a "**Secret Lybia**"; "Secret" è collegato sotto sia a "Secret Syria" sia a "Secret Lybia"; questi due sono collegati a **Unclassified** in fondo.

**Approfondimento.** Le policy reali usano reticoli più ricchi. Quello **militare** è una catena di livelli di classificazione (Unclassified < Classified < Secret < Top Secret). Con i **compartimenti** (categorie need-to-know, qui per paese) l'ordine diventa parziale: "Secret Syria" e "Secret Lybia" sono incomparabili, quindi i dati di un compartimento non possono fluire nell'altro, mentre entrambi possono fluire verso un livello più alto abilitato per tutti e due. Combinare due dati dà il loro minimo maggiorante, il livello più basso che può vederli entrambi. La stessa struttura a reticolo si usa per l'integrità (fidato/non fidato) e nelle etichette decentralizzate di Jif (slide 10).

### Slide 20 · Rules for expressions

> *γ ⊢ e : t* meaning e contains information of level t or lower
>
> - variable: *γ ⊢ x : t* if *γ(x) = t*
> - operations, for binary operation +, similar for n-ary:
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ e' : t
> ───────────────────────
>    γ ⊢ e + e' : t
> \`\`\`
>
> - subtyping:
>
> \`\`\`text
> γ ⊢ e : t    t ≤ t'
> ───────────────────
>     γ ⊢ e : t'
> \`\`\`
>
> where *L ≤ H*

**Approfondimento.** Le regole di tipizzazione per le espressioni, da leggere dall'alto in basso ("se valgono le premesse sopra la linea, vale la conclusione sotto"):

- **Variabile**: una variabile ha il livello dato dal contesto.
- **Operazioni**: se entrambi gli operandi hanno livello *t*, il risultato ha livello *t*: combinare dati non ne abbassa il livello. Per combinare un valore basso e uno alto, quello basso viene prima alzato con il sottotipaggio, quindi \`lo + hi\` riceve il livello H.
- **Sottotipaggio** (subsumption): un'espressione di livello *t* si può considerare anche di qualunque livello più alto *t'*, perché un valore che contiene informazione di livello *t* o inferiore contiene di certo informazione di livello *t'* o inferiore. In particolare ogni espressione L è anche un'espressione H (i dati bassi si possono usare dove sono ammessi dati alti), ma non viceversa.

### Slide 21 · Rules for commands

> *γ ⊢ s : cmd t* meaning s only writes to level t or higher
>
> - assignment:
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ x : t
> ──────────────────────
>  γ ⊢ x := e  : cmd t
> \`\`\`
>
> - if-then-else:
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ c1 : cmd t    γ ⊢ c2 : cmd t
> ─────────────────────────────────────────────
>     γ ⊢ if e then c1 else c2 : cmd t
> \`\`\`
>
> - subtyping:
>
> \`\`\`text
> γ ⊢ c : cmd t    cmd t ≤ cmd t'
> ───────────────────────────────
>        γ ⊢ c : cmd t'
> \`\`\`
>
> where *cmd t ≤ cmd t'* iff *t ≥ t'* (anti-monotonicity)

Nella slide la conclusione della regola di sottotipaggio è scritta *γ ⊢ c : c: cmd t'*, e il lato sinistro *cmd t ≤ cmd t'* dell'ultima riga appare barrato.

**Approfondimento.** Per i comandi, il tipo registra **dove scrive il comando**: *cmd t* significa che il comando assegna solo variabili di livello *t* o superiore.

- **Assegnamento** \`x := e\`: l'espressione e la variabile devono avere lo stesso livello *t* (con il sottotipaggio, l'espressione può essere più bassa). Quindi \`hi := lo\` è permesso (dati L alzati a H), mentre \`lo := hi\` viene rifiutato: non c'è modo di tipizzare \`hi\` come L. Questo esclude i flussi **espliciti**.
- **If-then-else**: i rami devono scrivere solo a livello *t* o superiore, dove *t* è il livello della **condizione**. Se la condizione è H, entrambi i rami possono scrivere solo variabili H, quindi \`if (hi > 0) { lo = 99; }\` viene rifiutato. Questo esclude i flussi **impliciti**: tutto ciò che viene scritto sotto una condizione segreta rivela la condizione, quindi deve essere segreto anch'esso.
- Il **sottotipaggio per i comandi** è **anti-monotono**: un comando che scrive solo a livello H o superiore scrive anche solo a livello L o superiore, quindi *cmd H ≤ cmd L*. La direzione "rovesciata" rispetto alle espressioni è il punto della slide successiva.

### Slide 22 · Rules for commands

> **Note: commands subtyping backwards from expression subtyping rule!**
>
> - In expressions, can replace H with L without causing an insecure read up
> - In commands, can replace cmd L with cmd H without causing an insecure write down

La nota compare in un riquadro rosso sopra il contenuto della slide 21.

**Approfondimento.** Perché le due regole di sottotipaggio vanno in direzioni opposte. Il tipo di un'**espressione** è un limite superiore a ciò che l'espressione *legge*: dichiarare alta un'espressione bassa è sempre sicuro (è come classificare troppo in alto dei dati pubblici). Il tipo di un **comando** è un limite inferiore a ciò che il comando *scrive*: dichiarare che un comando che scrive solo variabili alte scrive "a livello basso o superiore" è sicuro, perché l'affermazione è più debole. Sbagliare una delle due direzioni permetterebbe di trattare un valore alto come basso (una lettura insicura) o di usare un comando che scrive variabili basse dove sono ammesse solo scritture alte (una scrittura insicura verso il basso).

### Slide 23 · Rules for commands

> *γ ⊢ s : cmd t* meaning s only writes to level t or higher
>
> - composition:
>
> \`\`\`text
> γ ⊢ c1 : cmd t    γ ⊢ c2 : cmd t
> ────────────────────────────────
>       γ ⊢ c1; c2 : cmd t
> \`\`\`
>
> - while:
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ c : cmd t
> ──────────────────────────
>  γ ⊢ while e do c : cmd t
> \`\`\`

**Approfondimento.** Le regole rimanenti. **Composizione**: se entrambi i comandi scrivono solo a livello *t* o superiore, lo stesso vale per la loro sequenza. **While**: come per \`if\`, il corpo può scrivere solo variabili alte almeno quanto la guardia, quindi un ciclo su una condizione segreta può modificare solo variabili segrete, il che esclude i flussi impliciti attraverso i cicli. Come mostra la slide 29, questa regola lascia comunque aperto il canale di terminazione: \`while (hi > 99) do {...}\` è tipizzabile se il suo corpo scrive solo variabili alte, eppure il fatto che termini dipende da \`hi\`.

### Slide 24 · Soundness and Completeness

> - *Soundness* of the type system: programs that are well-typed do not leak
> - *Completeness* of the type system: programs that do not leak can be typed
>
> *Is the type system on preceding slides*
>
> - *sound?*
> - *complete?*
>
> *How can we determine this?*

**Approfondimento.** Le due proprietà che collegano un sistema di tipi alla proprietà di sicurezza che impone. La **correttezza** (soundness) è quella essenziale: se il type checker accetta un programma, il programma davvero non lascia trapelare nulla; un checker non corretto dà una falsa garanzia. La **completezza** significherebbe che ogni programma senza fughe viene accettato; nessun sistema di tipi pratico è completo, perché stabilire se un programma lascia trapelare informazioni è in generale indecidibile (lo stesso limite delle analisi statiche della Lezione 7). Il sistema di tipi delle slide precedenti è corretto (con le riserve sulla terminazione, slide 28) ma non completo (slide successiva). Per dimostrare la correttezza bisogna prima definire con precisione "non lascia trapelare nulla": è la non interferenza (slide 26-27).

### Slide 25 · Counterexamples for completeness

> It is easy to give examples that are not typable but do not leak, eg
>
> - **\`if (false) then { lo = hi; }\`**
> - **\`lo = hi + 1 - hi;\`**
> - **\`lo = hi; lo = 12;\`**

**Approfondimento.** Tre programmi innocui che il sistema di tipi rifiuta:

- \`if (false) then { lo = hi; }\`: l'assegnamento non viene mai eseguito, ma il type checker non valuta le condizioni, vede solo un assegnamento da H a L.
- \`lo = hi + 1 - hi;\`: il risultato è sempre 1, indipendentemente da \`hi\`, ma l'espressione contiene \`hi\`, quindi ha livello H.
- \`lo = hi; lo = 12;\`: il valore trapelato viene subito sovrascritto, quindi il valore finale di \`lo\` è sempre 12; ma il primo assegnamento viene rifiutato (e un attaccante che può osservare i valori *intermedi* di \`lo\`, per esempio in un contesto concorrente, vedrebbe davvero \`hi\`).

Il sistema di tipi ragiona in modo sintattico e conservativo: rifiuta questi programmi per essere sicuro di rifiutare tutti quelli che lasciano trapelare informazioni.

## Non interferenza (pagine 26-32)

### Slide 26 · Counterexamples for completeness

> - Is this type system sound?
>   - i.e. does it prevent the information flows that we want to prevent
> - How do we define what we want to prevent?
> - This is commonly done by *non-interference* properties, which try to capture the notion of what can be observed
>
> In other words, non-interference gives a precise semantics for what "information flow" means

**Approfondimento.** Per dimostrare la correttezza serve una definizione di "nessuna fuga" che non faccia riferimento al sistema di tipi stesso. La **non interferenza** (Goguen e Meseguer, 1982) è quella definizione: gli input alti non devono *interferire* con gli output bassi, cioè un osservatore che vede solo la parte bassa dello stato non può scoprire nulla sulla parte alta, perché gli output bassi sono gli stessi qualunque siano gli input alti.

### Slide 27 · Soundness wrt non-interference

> Definition For memories (or program states) **μ** and **ν**, we write **μ ~L ν** iff **μ** and **ν** agree on low variables.
>
> Definition (Non-interference)
>
> A program C does not leak information if, for all **μ ~L ν**:
>
> if executing C in **μ** terminates and results in **μ'**,
>
> and executing C in **ν** terminates and results in **ν'**,
>
> then **μ' ~L ν'**
>
> Theorem (Soundness)
>
> if *γ ⊢ C : cmd t* then C does not leak information

**Approfondimento.** Due memorie sono **equivalenti in basso** (μ ~L ν) quando hanno gli stessi valori in tutte le variabili basse, così un attaccante che vede solo le variabili basse non può distinguerle. La **non interferenza** dice: si esegua il programma su due memorie qualsiasi equivalenti in basso, che possono differire nei loro valori *segreti*; se entrambe le esecuzioni terminano, le memorie finali sono ancora equivalenti in basso. In altre parole, cambiare i segreti non cambia mai ciò che vede l'attaccante. \`lo = hi\` la viola (due memorie che differiscono solo in \`hi\` danno valori finali di \`lo\` diversi), e così \`if (hi > 0) { lo = 99; }\`. Il **teorema di correttezza** afferma che ogni programma accettato dal sistema di tipi soddisfa la non interferenza; la dimostrazione è per induzione sulle regole di tipizzazione, la stessa tecnica del teorema di type safety della Lezione 19 parte 2.

### Slide 28 · Termination as covert channel?

> Definition (Non-interference) **termination-*in*sensitive**
>
> A program C does not leak information if, for all **μ ~L ν**:
>
> if executing C in **μ** terminates and results in **μ'**, and executing C in **ν** terminates and results in **ν'**, then **μ' ~L ν'**
>
> Does this rule out (non) termination as hidden channel (as observation to distinguish two runs)?
>
> Definition (Termination-sensitive non-interference)
>
> A program C does not leak information if, for all **μ ~L ν**:
>
> if executing C in **μ** terminates in **μ'**, then executing C in **ν** also terminates, and results in some **ν'** with **μ' ~L ν'**
>
> It means that
>
> - **either both terminate or both diverge**, and
> - if they terminate, the low parts match

**Approfondimento.** La definizione della slide 27 non dice nulla quando una delle esecuzioni non termina, quindi è **insensibile alla terminazione** (termination-insensitive): \`while (hi > 99) do {}\` la soddisfa (ogni volta che entrambe le esecuzioni terminano, lasciano \`lo\` invariata), anche se un attaccante che vede se il programma si blocca scopre se \`hi > 99\`. La versione **sensibile alla terminazione** (termination-sensitive) aggiunge il requisito che la terminazione stessa non dipenda dai segreti: su memorie equivalenti in basso o entrambe le esecuzioni terminano (con risultati equivalenti in basso) o entrambe divergono. La non interferenza insensibile alla terminazione è la scelta comune in pratica perché è molto meno restrittiva; il prezzo è che un programma può lasciare trapelare informazioni attraverso la terminazione, il che in una sola esecuzione vale circa un bit ma, se l'attaccante può eseguire il programma molte volte con input pubblici diversi, può rivelare l'intero segreto.

### Slide 29 · While-rule for termination-sensitive non- interference

> The while-rule
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ c : cmd t
> ──────────────────────────
>  γ ⊢ while e do c : cmd t
> \`\`\`
>
> does *not* rule out non-termination as covert channel
>
> A more restrictive rule
>
> \`\`\`text
> γ ⊢ e : L    γ ⊢ c : cmd L
> ──────────────────────────
>  γ ⊢ while e do c : cmd L
> \`\`\`
>
> does rule this out.
>
> *(How? NB this is very restrictive!)*
>
> - A similar change needed for if-then-else rule.

**Approfondimento.** Per imporre la non interferenza sensibile alla terminazione, i cicli non devono dipendere dai segreti: la regola restrittiva richiede che la **guardia sia bassa** (la \`L\` è in rosso nella slide). Allora se e quando il ciclo termina dipende solo da dati pubblici, e il canale di terminazione scompare. È **molto restrittiva**: nessun ciclo può mai controllare un valore segreto, il che vieta anche algoritmi semplici come scorrere i caratteri di una password. Una modifica simile serve per \`if\`, perché un ramo su un segreto potrebbe contenere un ciclo (o, più in generale, i due rami potrebbero differire nel fatto di terminare o no).

### Slide 30 · Bell-LaPadula

> - The type system is similar to classic Bell-LaPadula system which combines
>   - Mandatory Access control (MAC)
>   - Multi-Level Security (MLS)
>
>   and protects information flow between files by rules
>   - no read up
>   - no write down
>     - *nb similarity with our typing rules*
> - But for program accessing variables, instead of a process accessing files
> - Moreover: type system checks program statically, whereas Bell-LaPadula monitors process at runtime

**Approfondimento.** **Bell-LaPadula** (1973) è il modello classico della sicurezza multilivello militare: soggetti e oggetti hanno livelli, l'accesso è **obbligatorio** (mandatory: stabilito dal sistema, non dal proprietario, a differenza del controllo degli accessi discrezionale), e due regole proteggono la riservatezza: **no read up** (un soggetto non può leggere oggetti sopra il suo livello) e **no write down** (un soggetto non può scrivere oggetti sotto il suo livello, quindi non può copiare dati segreti in un file pubblico). Sono esattamente le due direzioni delle regole di tipizzazione: le espressioni non possono essere lette a un livello più basso del loro contenuto, i comandi non possono scrivere sotto il loro livello. Le differenze: Bell-LaPadula controlla **processi che accedono a file** ed è imposto da un monitor **a run time**, mentre il sistema di tipi controlla **istruzioni che accedono a variabili** e verifica il programma **staticamente**, il che copre anche i flussi impliciti dentro il programma, che Bell-LaPadula non può vedere.

### Slide 31 · Other notions of secure information flow

> Other definitions of what it means to be secure (in the sense of non-leaking) are needed if
>
> - if programs can throw exceptions
>   - exceptions are another covert channel, just like non-termination
> - if programs are multi-threaded or non-deterministic
>   - because execution of a program can then result in several outcomes
>     - multi-threaded programs are non-deterministic, because results can depend on scheduling

**Approfondimento.** La definizione di non interferenza presuppone un programma deterministico senza eccezioni. Con le **eccezioni**, va inclusa l'osservazione "il programma si è fermato con un'eccezione", come per la terminazione. Con il **non determinismo** (per esempio il multi-threading, in cui i risultati dipendono dallo scheduler) un programma ha più esiti possibili per lo stesso input, e "lo stato basso finale è lo stesso" va sostituito da un confronto fra gli *insiemi* (o le distribuzioni di probabilità) degli esiti possibili (slide successiva).

### Slide 32 · Information flow for non-deterministic programs

> Definition (Possibilistic NI)
>
> A non-deterministic program **C** does not leak information if for all μ ~L ν
>
> if executing C in μ terminates in μ', then executing C in ν *can* terminate in some ν' with μ' ~L ν'
>
> This still ignores *probabilistic* information flows, for which one would take the chance that C does terminate in some ν' with μ' ~L ν' into account
>
> - Running the program multiple times, you might be able to observe something, for example:
>
> **\`If hi == 0: low = 0 w.p. 0.9 and 1 w.p 0.1\`**
>
> **\`If hi == 1: low = 1 w.p. 0.1 and 1 w.p 0.9\`**
>
> - Observation of low does not leak information in a single execution since 0 and 1 are both possible outputs of low
> - In multiple executions the adversary can inspect the distribution of low

**Approfondimento.** La non interferenza **possibilistica** richiede che ogni esito basso possibile per un segreto sia *possibile* anche per l'altro: l'insieme delle osservazioni possibili non dipende dal segreto. È troppo debole contro un attaccante che può ripetere l'esperimento. Nell'esempio (w.p. = with probability, con probabilità; la seconda riga voluta è presumibilmente "low = 0 w.p. 0.1 and 1 w.p. 0.9"), entrambi i valori 0 e 1 sono possibili qualunque sia \`hi\`, quindi la non interferenza possibilistica vale, ma la **distribuzione** di \`low\` dipende da \`hi\`: dopo molte esecuzioni, un attaccante che vede \`low = 0\` la maggior parte delle volte sa che \`hi == 0\`. La non interferenza **probabilistica** richiede che la distribuzione di probabilità degli output bassi sia indipendente dai segreti, ed è la nozione rilevante per i programmi concorrenti e per gli algoritmi randomizzati.

## Declassificazione e pratica (pagine 33-36)

### Slide 33 · The problem with secure information flow

> - *Practical* problem with secure information flow: the extreme restrictions it imposes, esp. when it come to ruling out implicit flows
>   - eg no while loop with a high guard
>   - note that login program leaks information about the password
> - More generally, some way of allowing forms of declassification is needed in practice

**Approfondimento.** La non interferenza stretta è troppo forte per i programmi reali. L'esempio del login lo chiarisce: un programma di login confronta l'input con la password segreta e dice all'utente se coincidono, quindi lascia necessariamente **trapelare** informazioni sulla password (se il tentativo è giusto, un bit per tentativo). Secondo la non interferenza è insicuro; in pratica è il comportamento voluto. I sistemi reali hanno quindi bisogno della **declassificazione**: modi controllati ed espliciti di rilasciare alcune informazioni sui segreti, e policy che limitano quante (per esempio un numero limitato di tentativi di login).

### Slide 34 · Declassification

> More *permissive* forms of information flow can allow de-classification, eg
>
> - for *confidentiality*:
>   - output of encryption operation is labelled as public, even though it depends on secret data.
> - for *integrity*:
>   - output of input validation routine may be trusted, even though it depends on untrusted data
>   - output of routine that checks digital signature may be trusted, even though it depends on untrusted data

**Approfondimento.** Punti tipici di declassificazione:

- **Riservatezza**: l'output di una funzione di cifratura dipende dal testo in chiaro e dalla chiave, entrambi segreti, eppure il testo cifrato viene mandato su una rete pubblica. La funzione di cifratura è un punto fidato in cui i dati segreti vengono declassificati a pubblici.
- **Integrità** (dove l'operazione duale si chiama **endorsement**): l'output di una routine di **validazione dell'input** (Lezione 5) è considerato fidato anche se deriva da un input non fidato, e lo stesso vale per i dati la cui **firma digitale** è stata verificata.

La declassificazione è il punto in cui la sicurezza dipende dalla correttezza di poche funzioni fidate, quindi i sistemi per il flusso dell'informazione come Jif la rendono esplicita nel codice (un'operazione \`declassify\` che solo il proprietario dei dati può eseguire), dove la si può verificare.

### Slide 35 · Information Flow in "practice"

> - Static enforcement
>   - JFlow/Jif is a type system for expressing & enforcing information flow properties for Java
>     - using it requires serious effort
>   - Many code analysis tools perform some data flow analysis
>     - Eg to spot SQL injection problems
>     - Recall PREfast did this, but only intra-procedural
>     - NB typically for integrity, not confidentiality
>     - Often unsound/incomplete, as concession to practicality
> - Dynamic enforcement
>   - Perl has an *runtime monitoring* of information flow properties (again for integrity properties) using tainting
>
>   Pragmatic approaches typically worry less - if at all - about implicit flows.
>   - Indeed, are implicit flows an issue for integrity?

**Approfondimento.** Come si usa in pratica il flusso dell'informazione:

- **Controllo statico**: esistono sistemi di tipi completi come Jif, ma richiedono di etichettare l'intero programma, quindi si usano soprattutto nella ricerca e nei sistemi ad alta affidabilità. Molto più comuni sono le **taint analysis** negli strumenti di analisi statica (Lezione 6, slide 17-18): seguono i flussi da sorgenti non fidate (i parametri delle richieste) a destinazioni sensibili (query SQL, comandi di shell) per trovare le injection (Lezioni 4, 5, 9), una proprietà di **integrità**. PREfast, l'analizzatore statico di Microsoft per C/C++, analizzava una funzione alla volta (in modo intra-procedurale), il che limita quanto lontano può seguire un flusso. Questi strumenti di solito sacrificano la correttezza alla praticità, accettando alcuni falsi negativi e falsi positivi.
- **Controllo dinamico**: il **taint tracking** a run time. La **taint mode** di Perl (\`perl -T\`) marca come contaminato (tainted) tutto l'input esterno, propaga il marchio attraverso i calcoli, e ferma il programma se dati contaminati raggiungono un'operazione pericolosa (un comando di shell, l'apertura di un file) senza essere stati prima validati con un'espressione regolare, che è il modo di Perl per decontaminarli (la declassificazione per l'integrità).

L'ultima osservazione: gli strumenti pratici di solito seguono solo i flussi espliciti. Per l'integrità è un compromesso ragionevole, perché un attaccante che può solo influenzare *quale* ramo viene preso controlla molto meno di uno che inietta dati direttamente; per la riservatezza, ignorare i flussi impliciti lascia non rilevate fughe reali.

### Slide 36 · Summary

> - What is information flow?
>   - explicit flows
>   - implicit flows
>   - covert channels
> - How can we *syntactically* control information flow, using type systems? (at compile time, ie. statically)
> - How can we *semantically* define information flow?
>   - non-interference
> - Termination sensitive vs termination insensitive

**Approfondimento.** La lezione in quattro punti: l'informazione può fluire in modo **esplicito** (copiando), **implicito** (attraverso il flusso di controllo) e attraverso **canali nascosti** (terminazione, tempo, eccezioni); un **sistema di tipi** con livelli di sicurezza controlla staticamente i flussi, rifiutando i flussi espliciti e impliciti dall'alto verso il basso; la **non interferenza** definisce semanticamente che cosa significa "nessun flusso", e il sistema di tipi è corretto rispetto a essa; e il canale di terminazione viene escluso solo dalla definizione più forte, **sensibile alla terminazione**, al prezzo di regole di tipizzazione molto restrittive.
`;export{i as default};
