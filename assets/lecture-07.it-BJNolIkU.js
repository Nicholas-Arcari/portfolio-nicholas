const e=`La Lezione 7 apre la scatola degli strumenti di analisi statica passati in rassegna nella Lezione 6: che cos'è l'analisi dei programmi e a che cosa serve (ricerca di bug, sicurezza, verifica, ottimizzazione), perché un'analisi statica che risponde a domande su *tutte* le esecuzioni deve rinunciare a qualcosa (la domanda è indecidibile), e come l'**interpretazione astratta** costruisce analisi **corrette per costruzione**: un dominio astratto, funzioni di astrazione e di concretizzazione, trasformatori astratti e un calcolo di punto fisso sul grafo del flusso di controllo, il tutto svolto su un'analisi dei segni di un piccolo ciclo. Le slide sono 105. Il mazzo è una presentazione esterna adattata, **"A Gentle Introduction to Program Analysis" di Işıl Dillig (University of Texas at Austin)**, tenuta al Programming Languages Mentoring Workshop il 21 gennaio 2014.

**Nota sulla numerazione delle pagine.** Il mazzo è costruito per gradi: ogni fotogramma (numerato "n / 24" a piè di pagina) si estende su diverse pagine consecutive del PDF, ognuna delle quali aggiunge un punto o un passo di un'immagine. Le 105 pagine contengono 22 fotogrammi (il piè di pagina ne conta 24, ma il PDF si ferma al fotogramma 22). Gli appunti raggruppano le pagine di un fotogramma sotto un solo titolo ("Slide 2-4", ...) e citano il testo della pagina finale e completa del fotogramma. Dove un'immagine cambia da una pagina all'altra, viene mostrato ogni stato distinto; in particolare tutti i passi del calcolo di punto fisso delle pagine 80-94.

## Che cos'è l'analisi dei programmi (pagine 1-13)

### Slide 1 · Frontespizio

> **A Gentle Introduction to Program Analysis**
>
> Işıl Dillig · University of Texas, Austin
>
> January 21, 2014 · Programming Languages Mentoring Workshop

**Approfondimento.** Il Programming Languages Mentoring Workshop (PLMW) si tiene accanto alle principali conferenze sui linguaggi di programmazione per introdurre gli studenti al settore, ed è per questo che il talk è un giro completo che non presuppone conoscenze. Il corso lo usa come teoria dietro gli analizzatori statici della Lezione 6: perché danno falsi positivi, perché mancano dei bug, e come si costruisce un analizzatore *corretto*.

### Slide 2-4 · What is Program Analysis?

> - Very broad topic, but generally speaking, **automated** analysis of program behavior
> - Program analysis is about developing algorithms and tools that can analyze **other programs**

![Lezione 7, pagina 4](L07_p04.webp "50% 1337x592")

**Figura (pagina 4).** Un file di programma, **prog.c** (freccia verde), e una nuvoletta **Query** (freccia arancione) entrano entrambi in un riquadro verde, **Program Analysis Tool** (disegnato con degli ingranaggi). Una freccia nera va dallo strumento a una cartellina con un elenco spuntato e una matita: il rapporto con la risposta.

**Approfondimento.** L'analisi dei programmi sono "programmi che ragionano su programmi". L'immagine è la forma di ogni strumento di analisi del corso:

- **Ingresso 1, il programma**: codice sorgente (come qui), bytecode o un binario (la Lezione 6, slide 8, ha confrontato sorgente ed eseguibili).
- **Ingresso 2, la domanda**: la proprietà che interessa, per esempio "questa \`strcpy\` può traboccare?", "un input contaminato può arrivare a \`exec\`?" (Lezione 6, slide 17-18), "\`x\` è sempre non negativo?" (l'esempio che accompagna questa lezione, slide 77-78).
- **Uscita**: un rapporto, o "la proprietà vale" (una dimostrazione) o un elenco di avvisi, magari con dei controesempi.
- La parola chiave è **automatico**: lo strumento deve funzionare senza aiuto umano su programmi di dimensioni realistiche. È questo che rende pesante il limite teorico delle slide 14-20 (l'indecidibilità).

### Slide 5-9 · Applications of Program Analysis

> - **Bug finding.** e.g., expose as many assertion failures as possible
> - **Security.** e.g., does an app leak private user data?
> - **Verification.** e.g., does the program always behave according to its specification?
> - **Compiler optimizations.** e.g., which variables should be kept in registers for fastest memory access?
> - **Automatic parallelization.** e.g., is it safe to execute different loop iterations in parallel?

**Approfondimento.** La stessa tecnologia serve obiettivi molto diversi, con una diversa tolleranza agli errori:

- La **ricerca di bug** cerca difetti concreti (asserzioni fallite, dereferenziazioni di null, buffer overflow). Mancare qualche bug è accettabile, ma i falsi allarmi costano, perché gli sviluppatori smettono di leggere i rapporti rumorosi (Lezione 6, slide 4).
- La **sicurezza** pone domande sul flusso dell'informazione: dati segreti (contatti, posizione, password) possono arrivare a un pozzo non fidato come la rete, o un input non fidato può arrivare a un'operazione sensibile come una query o un comando? È la taint analysis (Lezione 6, slide 17-18), usata per esempio per vagliare le app mobili (FlowDroid per Android) e per trovare le injection delle Lezioni 4, 5 e 9.
- La **verifica** dimostra che *ogni* esecuzione rispetta la specifica: la "forma più estrema di analisi statica" della Lezione 3, slide 51. Qui nessun bug può sfuggire.
- Le **ottimizzazioni del compilatore** sono il primo cliente dell'analisi dei programmi dagli anni '70: l'allocazione dei registri richiede l'analisi di *liveness* (quali variabili servono ancora), la propagazione delle costanti deve sapere quali valori sono costanti, l'eliminazione del codice morto richiede la raggiungibilità. Un'ottimizzazione viene applicata solo quando l'analisi *dimostra* che non può cambiare il comportamento del programma.
- La **parallelizzazione automatica** richiede l'analisi delle *dipendenze*: due iterazioni di un ciclo possono girare in parallelo solo se nessuna delle due scrive memoria che l'altra legge o scrive.

### Slide 10-13 · Dynamic vs. Static Program Analysis

> - Two flavors of program analysis:
>   - **Dynamic analysis:** Analyzes program while it is running
>   - **Static analysis:** Analyzes source code of the program

![Lezione 7, pagina 13](L07_p13.webp "50% 1400x496")

**Figura (pagina 13).** Una bilancia fra i due approcci. A sinistra, **Static**: "+ reasons about all executions", "- less precise". A destra, **Dynamic**: "+ more precise", "- results limited to observed executions".

**Approfondimento.** È la divisione fra statico e dinamico della Lezione 6, slide 3, con il compromesso reso esplicito:

- L'**analisi dinamica** osserva esecuzioni reali: test, fuzzing, sanitizer come AddressSanitizer o Valgrind, monitor a runtime. Ogni problema che segnala è accaduto davvero, quindi è *precisa* (praticamente senza falsi positivi). Ma vede solo le esecuzioni effettivamente fatte, e lo spazio degli input è astronomicamente grande (Lezione 6, slide 22: 2^128 input solo per sommare due interi a 64 bit), quindi l'assenza di bug segnalati non dimostra nulla sugli input non provati.
- L'**analisi statica** ragiona sul codice senza eseguirlo, quindi copre **tutte** le esecuzioni in un colpo, comprese quelle che nessun test attiverebbe mai. Il prezzo è la precisione: per coprire infinite esecuzioni in un tempo finito deve approssimare (il resto della lezione), e l'approssimazione produce falsi allarmi.
- Le due sono complementari: tecniche ibride come il testing concolico le combinano (Lezione 6, slide 30-31), e il ciclo di vita dello sviluppo sicuro le applica entrambe (Lezione 13).

## Analisi statica e astrazione (pagine 14-31)

### Slide 14-20 · Static Analysis

> - **Typical static analysis question:** "Given source code of program P and desired property Q, does P exhibit Q in **all possible executions**?"
> - But this question is **undecidable**!
> - This means static analyses are either:
>   - **Unsound:** May say program is safe even though it is unsafe
>   - **Sound, but incomplete:** May say program is unsafe even though it is safe
>   - **Non-terminating:** Always gives correct answer when it terminates, but may run forever
> - Many static analysis techniques are sound but incomplete.

**Approfondimento.** Questa slide è il cuore teorico della lezione, e spiega i falsi positivi e i falsi negativi di ogni strumento della Lezione 6.

- **Perché la domanda è indecidibile.** Per il **teorema di Rice** (1953), ogni domanda non banale sul *comportamento* dei programmi (e non sul loro testo) è indecidibile: nessun algoritmo risponde correttamente per ogni programma. La dimostrazione si riduce al **problema della fermata**: se potessimo decidere "il programma P può mai raggiungere \`error()\`?", potremmo decidere se un qualunque programma Q termina, ponendo la domanda su "esegui Q, poi chiama \`error()\`". Quindi un analizzatore perfetto, che termina sempre e ha sempre ragione, non può esistere.
- **Le tre vie di fuga.** Un analizzatore non può avere insieme *correttezza* (soundness: non manca mai un problema reale), *completezza* (non segnala mai un problema falso) e *terminazione*, quindi rinuncia a una delle tre:
  - *Non corretto*: può rispondere "sicuro" per un programma insicuro, cioè **falsi negativi**. La maggior parte dei bug finder pratici, e gli scanner testuali della Lezione 6, slide 15, sono volutamente non corretti, per tenere bassi i falsi allarmi.
  - *Corretto ma incompleto*: ogni risposta "sicuro" è una garanzia, ma può dare **falsi positivi**. Verificatori e interpreti astratti sono di questo tipo; per esempio Astrée ha dimostrato l'assenza di errori a tempo di esecuzione nel software di controllo di volo di Airbus.
  - *Non terminante*: ha sempre ragione quando risponde, ma può girare per sempre, come un'esplorazione esaustiva di uno spazio degli stati infinito.
- Nel vocabolario della Lezione 6, slide 4: la correttezza significa nessun falso negativo (TPR = 100%), la completezza nessun falso positivo. Il resto della lezione mostra come costruire in modo sistematico il secondo tipo, **corretto ma incompleto**.

### Slide 21-26 · How to design sound static analyses?

> **Key idea:** Overapproximate (i.e., abstract) program behavior
>
> - Bad states outside over-approximation ⇒ Program safe
> - Bad states inside over-approximation, but outside *P* ⇒ false alarm
>
> ⇒ **Goal:** Construct abstractions that are **precise** enough (i.e., few false alarms) and that **scale** to real programs

![Lezione 7, pagina 22](L07_p22.webp "19% 660x487") ![Lezione 7, pagina 23](L07_p23.webp "19% 660x487") ![Lezione 7, pagina 24](L07_p24.webp "19% 660x487") ![Lezione 7, pagina 25](L07_p25.webp "19% 660x487") ![Lezione 7, pagina 26](L07_p26.webp "19% 660x487")

**Figura (pagine 22-26).** Un'immagine costruita passo per passo. Pagina 22: una macchia gialla irregolare con l'etichetta ***P***, l'insieme degli stati che il programma può davvero raggiungere (il suo comportamento esatto). Pagina 23: una regione verde dai contorni morbidi disegnata attorno a *P* e che la contiene: la sovra-approssimazione calcolata dall'analisi. Pagina 24: una regione rossa di **bad states** (gli stati che violano la proprietà) che sta tutta fuori dalla regione verde. Pagine 25-26: la regione rossa ora si sovrappone alla sovra-approssimazione verde, ma continua a non toccare *P*.

**Approfondimento.** La sovra-approssimazione è il modo in cui si ottiene la correttezza:

- L'insieme esatto degli stati raggiungibili *P* non si può calcolare (slide 14-20). L'analisi calcola invece un suo **soprainsieme**: una forma più semplice da rappresentare e da calcolare, ma che contiene di sicuro ogni comportamento reale.
- **Caso 1 (pagina 24): nessuno stato cattivo nella sovra-approssimazione.** I comportamenti reali stanno dentro la regione verde, e la regione verde non contiene stati cattivi, quindi nessuna esecuzione reale può essere cattiva: il programma è **dimostrato sicuro**. Questa è la correttezza.
- **Caso 2 (pagine 25-26): stati cattivi dentro la sovra-approssimazione ma fuori da *P*.** L'analisi non sa dire se quegli stati sono reali (dentro *P*) o artefatti dell'approssimazione, quindi deve segnalare un possibile errore: un **falso allarme** (un falso positivo nei termini della Lezione 6). Il programma in realtà è sicuro, ma l'astrazione era troppo grossolana per dimostrarlo.
- (Nel terzo caso, uno stato cattivo dentro *P* stesso, il bug è reale, e un'analisi corretta lo segnala sempre.)
- **L'obiettivo ingegneristico**: un'astrazione **abbastanza precisa** da evitare la maggior parte dei falsi allarmi, ma **abbastanza semplice da scalare** a programmi reali di milioni di righe. Più precisione costa più tempo e più memoria, quindi ogni strumento di analisi si colloca da qualche parte su questo compromesso: il compromesso ROC della Lezione 6, slide 5, visto dal lato di chi costruisce lo strumento.

### Slide 27-31 · Examples of Abstractions

> **There is no "one size fits all" abstraction**
>
> - **What information is useful depends on what you want to prove about the program!**

![Lezione 7, pagina 29](L07_p29.webp "50% 1400x302")

![Lezione 7, pagina 30](L07_p30.webp "50% 1400x302")

![Lezione 7, pagina 31](L07_p31.webp "50% 1400x302")

**Figura (pagine 29-31).** Una tabella a due colonne, riempita una riga per pagina:

| Applicazione | Astrazione utile |
| --- | --- |
| Nessuna divisione per zero | zero e non zero |
| Verifica delle strutture dati | lista, albero, grafo, ... |
| Nessun accesso agli array fuori dai limiti | intervalli delle variabili intere |

**Approfondimento.** Un'*astrazione* conserva solo i fatti rilevanti per la domanda e dimentica tutto il resto, e quali fatti sono rilevanti dipende dalla proprietà:

- Per dimostrare che **non ci sono divisioni per zero** basta sapere, per ogni variabile, se è zero o non zero; il suo valore esatto non conta.
- Per verificare la **manipolazione delle strutture dati** (per esempio che l'inversione di una lista non perda elementi né crei un ciclo), l'analisi ha bisogno della *forma* dello heap: questa struttura di puntatori è una lista, un albero, un grafo? È la *shape analysis*.
- Per dimostrare che **non ci sono accessi agli array fuori dai limiti**, che è proprio l'assenza di buffer overflow (Lezioni 3 e 8), l'analisi ha bisogno degli **intervalli** numerici delle variabili indice, per esempio il *dominio degli intervalli*: \`i ∈ [0, 9]\` per un array di 10 elementi. I controllori dei limiti basati sull'interpretazione astratta (Astrée, Frama-C, Polyspace) usano domini simili agli intervalli per dimostrare che ogni \`buf[i]\` resta nei limiti.
- Un'astrazione più ricca dimostra di più ma costa di più; uno strumento sceglie quella più economica che riesce ancora a decidere la sua domanda (il compromesso fra precisione e scalabilità delle slide 21-26).

## Interpretazione astratta (pagine 32-67)

### Slide 32-36 · How to Create Sound Abstractions?

> - Useful theory for understanding how to design sound static analyses is **abstract interpretation**
>   - Seminal '77 paper by Patrick & Radhia Cousot
> - Not a specific analysis, but rather a framework for designing sound-by-construction static analyses
> - Let's look at an example: A static analysis that tracks the sign of each integer variable (e.g., positive, non-negative, zero etc.)

**Figura (pagine 34-36).** Fotografie di Patrick Cousot e Radhia Cousot.

**Approfondimento.** L'**interpretazione astratta** fu introdotta da Patrick e Radhia Cousot in *"Abstract interpretation: a unified lattice model for static analysis of programs by construction or approximation of fixpoints"* (POPL 1977). L'idea: eseguire il programma non su valori concreti ma su valori *astratti* (segni, intervalli, forme dello heap), sostituendo ogni operazione con una controparte astratta, in modo che il risultato astratto sia *garantito* come sovra-approssimazione di ogni risultato concreto. È un **framework**: chi progetta l'analisi sceglie un dominio astratto, e la teoria dice esattamente che cosa va dimostrato (le condizioni delle slide 42-65) perché l'analisi che ne risulta sia corretta *per costruzione*. Fra gli analizzatori industriali costruiti su di essa ci sono Astrée (assenza di errori a tempo di esecuzione nel software di controllo di volo dell'Airbus A340 e A380), Polyspace e Frama-C, e le stesse idee sono alla base delle analisi del flusso dei dati di ogni compilatore che ottimizza. Le slide che restano costruiscono passo per passo un esempio completo, l'**analisi dei segni**.

### Slide 37-41 · First Step: Design An Abstract Domain

> - An **abstract domain** is just a set of **abstract values** we want to track in our analysis
> - For our example, let's fix the following abstract domain:
>   - pos: {x | x ∈ ℤ ∧ x > 0}
>   - zero: {0}
>   - neg: {x | x ∈ ℤ ∧ x < 0}
>   - non-neg: {x | x ∈ ℤ ∧ x ≥ 0}
> - In addition, every abstract domain contains:
>   - ⊤ (top): "Don't know", represents any value
>   - ⊥ (bottom): Represents empty-set

**Approfondimento.**

- Ogni valore astratto **sta per un insieme di valori concreti**: \`pos\` per tutti gli interi positivi, \`zero\` per {0}, e così via. Per ogni variabile in ogni punto del programma, l'analisi tiene un solo valore astratto invece dell'insieme (forse infinito) dei valori che la variabile può assumere.
- **⊤ (top)** è il valore meno informativo, "potrebbe essere qualunque cosa" (tutto ℤ). L'analisi ripiega su di esso quando non sa dire niente di meglio, per esempio dopo aver sommato un numero positivo e uno negativo (slide 64-65).
- **⊥ (bottom)** è l'insieme vuoto di valori, "nessun valore", che in pratica significa "questo punto del programma non è (ancora) stato raggiunto". È il valore di partenza del calcolo di punto fisso (slide 71-76).
- Il dominio è tagliato sulla domanda a cui rispondere: avendo \`non-neg\`, l'analisi può dimostrare "x non è mai negativo" (la domanda delle slide 77-78). È anche volutamente grossolano: non c'è un valore "non positivo" o "non zero", quindi un insieme come {-3, 2} si può descrivere solo con ⊤ (slide 42-50).

### Slide 42-50 · Second step: Abstraction and concretization functions

> - **Abstraction function (α)** maps sets of concrete elements to the most precise value in the abstract domain
>   - α({2, 10, 0}) = non-neg
>   - α({3, 99}) = pos
>   - α({-3, 2}) = ⊤
> - **Concretization function (γ)** maps each abstract value to sets of concrete elements
>   - γ(pos) = {x | x ∈ ℤ ∧ x > 0}

**Approfondimento.** α e γ collegano il mondo concreto e quello astratto:

- **α (astrazione)** va dal concreto all'astratto: dato un insieme di valori concreti, restituisce il valore astratto *più piccolo* (il più preciso) il cui significato li contiene tutti. {2, 10, 0} contiene lo 0 oltre a numeri positivi, quindi \`pos\` è troppo piccolo e \`non-neg\` è quello più preciso che va bene; {3, 99} sono tutti positivi, quindi \`pos\`; {-3, 2} mescola i segni, e l'unico valore del dominio che contiene sia un numero negativo sia uno positivo è ⊤.
- **γ (concretizzazione)** va dall'astratto al concreto: dà il *significato* di un valore astratto, l'insieme dei valori concreti che rappresenta: \`γ(pos) = {x | x ∈ ℤ ∧ x > 0}\`, \`γ(⊤) = ℤ\`, \`γ(⊥) = ∅\`.
- α deve sempre restituire un valore che **contiene** l'insieme concreto, mai uno che perde un valore possibile: è la sovra-approssimazione delle slide 21-26, applicata a una sola variabile.

### Slide 51-54 · Lattices and Abstract Domains

> - Concretization function defines **partial order** on abstract values: **A₁ ≤ A₂ iff γ(A₁) ⊆ γ(A₂)**
> - Furthermore, in an abstract domain, every pair of elements has a lub and glb ⇒ **mathematical lattice**
> - Least upper bound of two elements is called their **join** - useful for reasoning about control flow in programs

![Lezione 7, pagina 54](L07_p54.webp "29% 518x507")

**Figura (pagine 53-54).** Il diagramma del reticolo dei segni: **⊤** in cima; sotto **non-neg** e **neg**; sotto **non-neg**, i valori **pos** e **zero**; in fondo **⊥**, collegato a **pos**, **zero** e **neg**. Una linea da un elemento più basso a uno più alto significa "sta sotto", cioè è più preciso di.

**Approfondimento.**

- **L'ordine.** A₁ ≤ A₂ significa che A₁ è *più preciso* di A₂ (descrive meno valori concreti): \`pos ≤ non-neg\` perché ogni numero positivo è non negativo, \`zero ≤ non-neg\`, ogni valore è ≤ ⊤ e ≥ ⊥. \`pos\` e \`neg\` sono *incomparabili*: nessuno dei due insiemi contiene l'altro, ed è per questo che l'ordine è solo *parziale*.
- **lub e glb.** Il *minimo maggiorante* (lub, o **join**, scritto ⊔) di due valori è il valore più preciso che sta sopra entrambi; il *massimo minorante* (glb, o meet, scritto ⊓) è il valore meno preciso che sta sotto entrambi. Dal diagramma: \`pos ⊔ zero = non-neg\`, \`pos ⊔ neg = ⊤\`, \`non-neg ⊔ neg = ⊤\`, \`pos ⊓ zero = ⊥\`, \`pos ⊓ non-neg = pos\`. Un ordine parziale in cui ogni coppia di elementi ha un lub e un glb è un **reticolo**.
- **Perché il join conta.** Dove due percorsi del flusso di controllo si incontrano (dopo un \`if\`/\`else\`, o in testa a un ciclo, dove il primo ingresso incontra l'arco all'indietro), l'analisi non sa quale percorso è stato preso, quindi deve tenere entrambe le possibilità: lo stato nel punto di incontro è il **join** degli stati in arrivo. Se un ramo dà \`x = zero\` e l'altro \`x = pos\`, dopo l'incontro \`x = zero ⊔ pos = non-neg\`, esattamente ciò che succede in testa al ciclo nell'esempio svolto (pagina 89).

### Slide 55-58 · Almost-Inverses

> - Important property of the abstraction and concretization function is that they are **almost inverses**:
> - This is called a **Galois insertion** and captures the soundness of the abstraction

![Lezione 7, pagina 56](L07_p56.webp "50% 1022x529")

![Lezione 7, pagina 58](L07_p58.webp "50% 1022x529")

**Figura (pagine 56-58).** Due formule, ciascuna con un diagramma a frecce. In alto (pagina 56): **α(γ(A)) = A**, con una freccia γ da un valore astratto *A* a un insieme concreto *C*, e una freccia α da *C* di nuovo allo stesso *A*. In basso (pagina 57): **C ⊆ γ(α(C))**, con una freccia α da un insieme concreto *C* ad *A*, e una freccia γ da *A* di nuovo a un insieme più grande *C′* disegnato attorno a *C*.

**Approfondimento.**

- **α(γ(A)) = A**: se si prende il significato di un valore astratto e lo si astrae di nuovo, si riottiene esattamente lo stesso valore, quindi nessun valore astratto è ridondante. Esempio: γ(pos) = {1, 2, 3, ...}, e α di quell'insieme è di nuovo \`pos\`.
- **C ⊆ γ(α(C))**: se si astrae un insieme concreto e si prende il significato del risultato, si ottiene un insieme che **contiene** quello originale, di solito un insieme strettamente più grande. Si perde informazione, ma mai un valore possibile. Esempio: C = {2, 10, 0}, α(C) = non-neg, γ(non-neg) = {0, 1, 2, ...} ⊇ C. Questa inclusione è proprio la sovra-approssimazione che rende l'analisi **corretta**.
- Quindi α e γ non sono vere inverse (il secondo giro perde precisione), da cui "quasi". In matematica la coppia forma una **connessione di Galois** (α(C) ≤ A se e solo se C ⊆ γ(A)); quando in più vale α(γ(A)) = A si chiama **inserzione di Galois**. È la condizione formale sotto cui qualunque cosa l'analisi concluda sui valori astratti vale per tutte le esecuzioni concrete che rappresentano.

### Slide 59-63 · Step 3: Abstract Semantics

> - Given abstract domain, α, γ, need to define **abstract transformers (i.e., semantics)** for each statement
>   - Describes how statements affect our abstraction
>   - Abstract counter-part of operational semantics rules

![Lezione 7, pagina 62](L07_p62.webp "50% 1400x460")

![Lezione 7, pagina 63](L07_p63.webp "50% 1400x460")

**Figura (pagine 62-63).** Due diagrammi affiancati dello stesso riquadro di istruzione, **x = y op z**. A sinistra, *Operational Semantics*: una freccia in ingresso con l'etichetta **S: Var → Concrete value** e una in uscita con l'etichetta **S′: Var → Concrete value**. A destra (pagina 63), *Abstract Semantics*: in ingresso **A: Var → Abstract value**, in uscita **A′: Var → Abstract value**.

**Approfondimento.**

- La **semantica concreta (operazionale)** di un'istruzione trasforma uno stato concreto *S*, una funzione che dà a ogni variabile il suo valore concreto, nello stato *S′* dopo l'istruzione: se \`y = 3\` e \`z = 4\`, dopo \`x = y + z\` si ha \`x = 7\`.
- La **semantica astratta**, o *trasformatore astratto*, fa lo stesso sugli stati astratti: *A* dà a ogni variabile un valore astratto, e il trasformatore calcola *A′*: se \`y = pos\` e \`z = pos\`, dopo \`x = y + z\` si ha \`x = pos\`. L'analisi esegue il programma con questi trasformatori al posto delle operazioni vere.
- Deve esserci un trasformatore per ogni tipo di istruzione (assegnamenti con ciascun operatore, condizioni, chiamate di funzione, ...), e ciascuno deve essere **corretto**: deve sovra-approssimare la semantica concreta, come dice la slide successiva.

### Slide 64-65 · Back to Our Example

> - For our sign analysis, we can define abstract transformer for x = y + z as follows:
> - To ensure soundness of static analysis, must prove that abstract semantics faithfully models concrete semantics

![Lezione 7, pagina 65](L07_p65.webp "50% 1376x619")

**Figura (pagine 64-65).** La tabella dell'addizione astratta: la riga dà il valore astratto di \`y\`, la colonna quello di \`z\`, e la cella il valore astratto di \`x = y + z\`:

| y \\ z | pos | neg | zero | non-neg | ⊤ | ⊥ |
| --- | --- | --- | --- | --- | --- | --- |
| **pos** | pos | ⊤ | pos | pos | ⊤ | ⊥ |
| **neg** | ⊤ | neg | neg | ⊤ | ⊤ | ⊥ |
| **zero** | pos | neg | zero | non-neg | ⊤ | ⊥ |
| **non-neg** | pos | ⊤ | non-neg | non-neg | ⊤ | ⊥ |
| **⊤** | ⊤ | ⊤ | ⊤ | ⊤ | ⊤ | ⊥ |
| **⊥** | ⊥ | ⊥ | ⊥ | ⊥ | ⊥ | ⊥ |

**Approfondimento.** Come leggere e verificare la tabella:

- Ogni cella risponde alla domanda: "se \`y\` è un valore qualunque di γ(riga) e \`z\` un valore qualunque di γ(colonna), quale valore astratto contiene di sicuro \`y + z\`?" pos + pos è sempre positivo, quindi \`pos\`; zero + non-neg è non negativo, quindi \`non-neg\`; pos + neg può essere positivo, zero o negativo, e il dominio non ha niente di più piccolo di ⊤ che li contenga tutti e tre; qualunque cosa + ⊤ dà ⊤; qualunque cosa + ⊥ dà ⊥ (se un operando non ha alcun valore possibile, il punto del programma è irraggiungibile, quindi anche il risultato è vuoto).
- La **correttezza** del trasformatore significa: per ogni \`y ∈ γ(Ay)\` e \`z ∈ γ(Az)\` concreti, la somma concreta \`y + z\` appartiene a γ(table[Ay][Az]). Per esempio \`non-neg + pos = pos\` è corretta perché 0 + 1 = 1 > 0 e valori più grandi danno solo somme più grandi. Dimostrarlo per ogni cella, e per ogni operatore, è il "must prove" della slide; una volta fatto, l'intera analisi è corretta per costruzione.
- La tabella è anche **precisa** quanto il dominio permette. Un trasformatore che rispondesse ⊤ ovunque sarebbe corretto ma inutile, perché ogni controllo finirebbe in un falso allarme.
- La tabella è simmetrica perché l'addizione è commutativa; si noti in particolare che neg + non-neg dà ⊤ (-5 + 7 > 0 ma -5 + 0 < 0).

### Slide 66-67 · Putting It All Together

![Lezione 7, pagina 66](L07_p66.webp "50% 1400x496")

![Lezione 7, pagina 67](L07_p67.webp "50% 1400x496")

**Figura (pagine 66-67).** Chi progetta l'analisi (un personaggio a fumetti con il pollice alzato) fornisce due ingressi a un riquadro con la scritta **Fixed-point engine** (disegnato con degli ingranaggi): l'**Abstract domain α, γ** e l'**Abstract semantics**. Il programma **P** (l'icona di un file) entra nel motore dall'alto. Il motore produce una regione verde che contiene la macchia gialla *P*: la sovra-approssimazione del comportamento del programma. A pagina 67 il riquadro del motore è evidenziato in giallo, e introduce l'argomento successivo.

**Approfondimento.** È l'architettura di un interprete astratto:

- Chi **progetta** fornisce, una volta per tutte, il dominio con α e γ (slide 37-58) e un trasformatore corretto per ogni istruzione (slide 59-65).
- Il **motore di punto fisso** è generico: prende qualunque programma e calcola lo stato astratto in ogni punto del programma iterando i trasformatori finché nulla cambia (slide 68-98).
- L'**uscita** è una sovra-approssimazione corretta di tutte le esecuzioni, la regione verde delle slide 21-26, da cui si leggono le risposte: se non contiene stati cattivi, la proprietà è dimostrata.
- Separare il dominio dal motore è ciò che fa dell'interpretazione astratta un *framework*: cambiando il dominio (segni, intervalli, forme dello heap) si ottiene un'analisi diversa con lo stesso motore.

## Calcolo di punto fisso (pagine 68-98)

### Slide 68-70 · Fixed-point Computations

> - **Fixed-point computation:** Repeated symbolic execution of the program using abstract semantics until our approximation of the program reaches an equilibrium
> - **Least fixed-point:** Start with underapproximation and grow the approximation until it stops growing
> - **Assuming correctness of your abstract semantics, the least fixed point is an overapproximation of the program!**

![Lezione 7, pagina 70](L07_p70.webp "24% 440x354")

**Figura (pagine 69-70).** Il comportamento reale del programma *P* (giallo) dentro la sovra-approssimazione verde, con anelli rossi concentrici che crescono verso l'esterno dal centro di *P* (una freccia punta verso l'esterno): le approssimazioni successive, ciascuna più grande della precedente, finché non smettono di crescere.

**Approfondimento.**

- Un programma con dei cicli può raggiungere un punto del programma infinite volte, con valori diversi ogni volta. L'analisi lo gestisce **iterando**: esegue i trasformatori astratti sul programma ancora e ancora, ogni volta unendo (con il join) le nuove informazioni allo stato astratto di ogni punto, finché un ulteriore giro non cambia più nulla. Quello stato stabile è un **punto fisso**: applicare un altro giro di analisi restituisce lo stesso stato (F(X) = X).
- **Minimo punto fisso.** Partendo dallo stato più piccolo possibile (⊥ ovunque, "niente ancora raggiunto": una sotto-approssimazione) e crescendo soltanto, l'iterazione si ferma allo stato stabile *più piccolo*, che è il risultato più preciso che il dominio e i trasformatori possono dare. (Anche partire da ⊤ ovunque sarebbe stabile e corretto, ma inutile.)
- **Perché il risultato è corretto.** Ogni esecuzione reale è un percorso finito nel programma. L'iterazione segue ogni percorso passo per passo, i trasformatori sovra-approssimano ogni passo, e i join conservano il contributo di ogni percorso, quindi ogni stato concreto raggiungibile è coperto: il minimo punto fisso è una **sovra-approssimazione** del programma, purché ogni trasformatore sia corretto (slide 64-65).

### Slide 71-76 · Performing Least Fixed Point Computation

> - Represent program as a **control-flow graph**
> - Want to compute abstract values at every program point
> - Initialize all abstract states to ⊥
> - Repeat until no abstract state changes at any program point:
>   - Compute abstract state on entry to a basic block B by taking the **join** of B's predecessors
>   - Symbolically execute each basic block using abstract semantics

![Lezione 7, pagina 71](L07_p71.webp "32% 644x988") ![Lezione 7, pagina 72](L07_p72.webp "32% 644x988") ![Lezione 7, pagina 76](L07_p76.webp "32% 644x988")

**Figura (pagine 71-76).** Il grafo del flusso di controllo del programma d'esempio delle slide 77-78, disegnato come riquadri: un blocco d'ingresso \`x = 0; y = 1\`; una **loop head**; da essa un **exit block** e, sull'arco \`y <= n\`, un blocco **branch**; dal branch, il blocco \`x = x+1\` (arco \`z = 0\`) e il blocco \`x = x+y\` (arco \`z != 0\`); entrambi portano al blocco **loop end** \`y = y+1\`, il cui arco all'indietro torna alla loop head. Da pagina 72 piccole frecce rosse segnano i **punti del programma** dove si conservano gli stati astratti (prima e dopo ogni istruzione). Le pagine 75-76 aggiungono punti rossi con il simbolo del join ⊔ nei due punti di incontro: la loop head (primo ingresso e arco all'indietro) e la loop end (i due rami).

**Approfondimento.** L'algoritmo, passo per passo:

1. **Grafo del flusso di controllo (CFG).** I nodi sono i *blocchi di base* (codice in linea retta con un solo ingresso e una sola uscita), gli archi sono i salti possibili (rami, cicli). I punti del programma sono le posizioni prima e dopo ogni istruzione.
2. **Inizializzazione.** Ogni punto del programma parte da ⊥, "non ancora raggiunto".
3. **Join nei punti di incontro.** Lo stato all'ingresso di un blocco è il join (⊔, slide 51-54) degli stati alla fine di tutti i suoi predecessori. Qui serve in due punti: la loop head (che unisce il primo ingresso all'arco all'indietro dalla loop end) e la loop end (che unisce i rami \`then\` ed \`else\`).
4. **Trasferimento.** Dentro un blocco si applica in ordine il trasformatore astratto di ogni istruzione (slide 64-65).
5. **Ripetere** finché un giro intero non cambia alcuno stato: quello è il minimo punto fisso (slide 68-70). Le implementazioni reali usano una *worklist* che rivisita solo i blocchi il cui ingresso è cambiato.

È la stessa struttura delle analisi del flusso dei dati dentro ogni compilatore che ottimizza (reaching definitions, liveness, propagazione delle costanti), ed è il modo in cui un'analisi statica della contaminazione propaga "contaminato" attraverso un programma (Lezione 6, slide 17-18).

### Slide 77-78 · An Example

![Lezione 7, pagina 78 (2)](L07_p78_2.webp "36% 644x986")

**Figura (pagine 77-78).** A sinistra il programma (pagina 78 aggiunge una nuvoletta: ***"Is x always non-negative inside the loop?"***); a destra il suo grafo del flusso di controllo, lo stesso delle slide 71-76. Il codice della slide:

\`\`\`c
x = 0;
y =0;

while(y <= n)
{
  if (z == 0) {
    x = x+1;
  }
  else {
    x = x + y;
  }
  y = y+1
}
\`\`\`

(Nella slide l'ultima istruzione non ha il punto e virgola, \`y = y+1;\`. Si noti anche che il codice inizializza \`y = 0\`, mentre il grafo del flusso di controllo, e tutto il calcolo delle slide successive, parte da \`y = 1\`; la risposta alla domanda è la stessa nei due casi, come mostrato più sotto.)

**Analisi del codice.**

- *Che cosa fa il codice.* \`x\` e \`y\` partono da 0 (\`y\` da 1 nel grafo). Il ciclo gira finché \`y <= n\`, dove \`n\` e \`z\` sono input mai assegnati, quindi l'analisi deve considerarne ogni valore possibile. A ogni iterazione \`x\` viene incrementato di 1 se \`z == 0\`, altrimenti gli viene sommato \`y\`; poi \`y\` viene incrementato.
- *La domanda.* "\`x\` è sempre non negativo dentro il ciclo?" Un test può provare solo alcuni valori di \`n\` e \`z\`; l'analisi dei segni risponde per **tutti** in un colpo. Poiché \`y\` parte non negativo e cresce soltanto, e a \`x\` si sommano solo quantità non negative, la risposta è sì, e le slide successive mostrano l'analisi che lo dimostra meccanicamente.
- *Perché domande del genere contano per la sicurezza.* Se si sostituisce "\`x\` è non negativo" con "l'indice \`i\` resta in \`[0, len)\`", è esattamente il ragionamento che serve a un analizzatore statico per dimostrare che un accesso \`buf[i]\` non può traboccare (Lezione 3), o che una lunghezza passata a \`malloc\` o \`memcpy\` non può essere negativa (i bug sulle lunghezze della Lezione 3, slide 22-25, e i problemi aritmetici della Lezione 8, slide 30-33).

### Slide 79-94 · Fixed-Point Computation

**Figura (pagine 79-94).** Il grafo del flusso di controllo delle slide 71-76, ingrandito (pagina 79). Da pagina 80, accanto a ogni punto del programma (le frecce rosse) è scritto lo stato astratto corrente di \`x\` e \`y\`, con **Z** per zero, **P** per pos e **NN** per non-neg; in ogni pagina i valori appena calcolati sono evidenziati in giallo. Il blocco d'ingresso ha tre punti del programma (prima di \`x = 0\`, fra i due assegnamenti, dopo \`y = 1\`); la loop head ha due stati in arrivo, dall'ingresso (a sinistra) e dall'arco all'indietro (a destra); i due blocchi dei rami e la loop end hanno ciascuno uno stato prima e uno dopo la propria istruzione. Le pagine mostrano il calcolo un passo alla volta:

![Lezione 7, pagina 79](L07_p79.webp "50% 1277x1195")

*Pagina 79.* Solo il grafo del flusso di controllo, prima che venga scritto qualunque stato astratto.

![Lezione 7, pagina 80](L07_p80.webp "50% 1277x1195")

*Pagina 80, inizializzazione.* Ogni punto del programma contiene \`x = ⊥, y = ⊥\`.

![Lezione 7, pagina 81](L07_p81.webp "50% 1277x1195")

*Pagina 81.* L'istruzione \`x = 0\` viene eseguita in astratto: dopo di essa, \`x = Z, y = ⊥\`.

![Lezione 7, pagina 82](L07_p82.webp "50% 1277x1195")

*Pagina 82.* L'istruzione \`y = 1\`: dopo di essa, \`x = Z, y = P\`.

![Lezione 7, pagina 83](L07_p83.webp "50% 1277x1195")

*Pagina 83, primo join alla loop head.* Lo stato che arriva dall'ingresso (\`x = Z, y = P\`) viene unito (⊔) con lo stato sull'arco all'indietro, ancora \`x = ⊥, y = ⊥\`: poiché ⊥ è l'elemento neutro del join, la loop head riceve \`x = Z, y = P\`.

![Lezione 7, pagina 84](L07_p84.webp "50% 1277x1195")

*Pagina 84.* Lo stato della loop head scorre invariato verso l'exit block, il blocco branch e gli ingressi delle due istruzioni dei rami: tutti ricevono \`x = Z, y = P\`. (Le condizioni \`y <= n\` e \`z = 0\` / \`z != 0\` non dicono nulla sui segni, quindi non raffinano lo stato.)

![Lezione 7, pagina 85](L07_p85.webp "50% 1277x1195")

*Pagina 85.* \`x = x+1\` con \`x = Z\`: per la tabella delle slide 64-65, zero + pos = pos, quindi dopo di essa \`x = P, y = P\`.

![Lezione 7, pagina 86](L07_p86.webp "50% 1277x1195")

*Pagina 86.* \`x = x+y\` con \`x = Z, y = P\`: zero + pos = pos, quindi dopo di essa \`x = P, y = P\`.

![Lezione 7, pagina 87](L07_p87.webp "50% 1277x1195")

*Pagina 87, join alla loop end.* \`x = P, y = P\` ⊔ \`x = P, y = P\` = \`x = P, y = P\` all'ingresso della loop end.

![Lezione 7, pagina 88](L07_p88.webp "50% 1277x1195")

*Pagina 88.* \`y = y+1\` con \`y = P\`: pos + pos = pos, quindi dopo di essa \`x = P, y = P\`; questo stato percorre l'arco all'indietro.

![Lezione 7, pagina 89](L07_p89.webp "50% 1277x1195")

*Pagina 89, secondo join alla loop head.* Lo stato d'ingresso \`x = Z, y = P\` ⊔ lo stato dell'arco all'indietro \`x = P, y = P\`: per \`x\`, zero ⊔ pos = non-neg, quindi ora la loop head contiene \`x = NN, y = P\`. Lo stato è cambiato, quindi l'iterazione deve fare un altro giro.

![Lezione 7, pagina 90](L07_p90.webp "50% 1277x1195")

*Pagina 90.* Il nuovo stato della loop head \`x = NN, y = P\` viene propagato all'exit block, al blocco branch e agli ingressi delle due istruzioni dei rami.

![Lezione 7, pagina 91](L07_p91.webp "50% 1277x1195")

*Pagina 91.* \`x = x+1\` con \`x = NN\`: non-neg + pos = pos, quindi dopo di essa \`x = P, y = P\`, come prima.

![Lezione 7, pagina 92](L07_p92.webp "50% 1277x1195")

*Pagina 92.* \`x = x+y\` con \`x = NN, y = P\`: non-neg + pos = pos, quindi dopo di essa \`x = P, y = P\`, come prima.

![Lezione 7, pagina 93](L07_p93.webp "50% 1277x1195")

*Pagina 93.* Alla loop end il join e \`y = y+1\` danno di nuovo \`x = P, y = P\`.

![Lezione 7, pagina 94](L07_p94.webp "50% 1277x1195")

*Pagina 94.* Alla loop head, \`x = Z, y = P\` ⊔ \`x = P, y = P\` = \`x = NN, y = P\`, esattamente il valore che aveva già. In un intero giro nessuno stato è cambiato: una nuvoletta annuncia ***"Fixed point!"***

**Approfondimento.** Come leggere il risultato:

- **La risposta alla domanda.** Dentro il ciclo \`x\` vale \`NN\` (alla loop head, nel branch e agli ingressi dei due assegnamenti) oppure \`P\` (dopo gli assegnamenti e alla loop end), mai ⊤ o \`neg\`. Poiché l'analisi è corretta, questa è una dimostrazione, per **ogni** valore di \`n\` e \`z\`, che \`x\` è sempre non negativo dentro il ciclo.
- **Due giri e una verifica.** Il primo giro è arrivato alla loop head con \`x = Z\`; l'arco all'indietro ha portato \`x = P\`, e il join l'ha generalizzato in \`NN\`. Il secondo giro, fatto con \`NN\`, ha prodotto lo stesso stato sull'arco all'indietro, quindi la terza visita della loop head non ha cambiato nulla: si è raggiunto il minimo punto fisso.
- **La precisione persa per strada.** L'analisi sa che \`y\` è positivo, ma non che \`y ≥ 1\` cresce di uno ogni volta, né niente di \`n\`; inoltre ha unito i due rami alla loop end. Niente di questo contava per questa domanda, ma una domanda come "\`x <= 10\`?" richiederebbe un dominio più ricco (intervalli o relazioni fra variabili) e con i segni potrebbe dare falsi allarmi.
- **Con lo \`y = 0\` del codice.** Partendo da \`y = Z\`, la loop head riceverebbe \`y = Z ⊔ P = NN\` e \`x = x+y\` darebbe non-neg + non-neg = non-neg; il punto fisso avrebbe comunque \`x\` in {NN, P} dentro il ciclo, quindi la risposta non cambia.

### Slide 95-98 · Termination of Fixed Point Computation

> - In this example, we quickly reached least fixed point - but does this computation always terminate?
>   - Yes, assuming abstract domain forms **complete lattice**
>   - This means every subset of elements (including infinite subsets) has a LUB
> - Unfortunately, many interesting domains do not have this property, so we need **widening** operators for convergence.

**Approfondimento.**

- **Perché l'analisi dei segni termina.** Lo stato di ogni punto del programma può solo crescere, perché l'iterazione unisce soltanto nuove informazioni, e nel reticolo dei segni un valore può crescere al massimo poche volte (⊥ → zero → non-neg → ⊤ è la catena più lunga). Con un numero finito di punti del programma e di variabili, l'iterazione deve fermarsi dopo un numero limitato di giri.
- **La condizione precisa.** La completezza (ogni sottoinsieme ha un lub) garantisce che il minimo punto fisso *esista* (il teorema di Knaster-Tarski); ciò che garantisce che l'iterazione lo *raggiunga* in un numero finito di passi è che il reticolo **non abbia catene strettamente crescenti infinite** (per esempio, che abbia altezza finita). La slide fonde le due condizioni; un reticolo finito come il dominio dei segni le ha entrambe.
- **I domini infiniti richiedono il widening.** Il **dominio degli intervalli**, quello che serve per i limiti degli array (slide 27-31), ha catene crescenti infinite: per \`i = 0; while (...) i++;\` l'iterazione produrrebbe [0, 0], [0, 1], [0, 2], ... per sempre. Un **operatore di widening** (∇, introdotto anch'esso dai Cousot) forza la convergenza estrapolando: appena un limite continua a crescere salta direttamente all'infinito, dando [0, +∞) dopo un paio di giri. Il widening perde precisione (che un successivo passaggio di *narrowing* può in parte recuperare), ma il risultato è ancora una sovra-approssimazione corretta, ora raggiunta in un tempo finito.

## Lezioni da portare a casa (pagine 99-105)

### Slide 99-105 · Lessons To Take Away

> - Considered only one static analysis approach, but illustrates two key ideas underlying program analysis:
>   - **Abstraction:** Only reason about certain properties of interest
>   - **Fixed-point computation:** Allows us to obtain sound overapproximation of the program
> - But many static analyses also differ in several ways:
>   - **Flow (in)sensitivity:** Some analyses only compute facts for the whole program, not for every program point
>   - **Path sensitivity:** More precise analyses compute different facts for different program paths
>   - **Analysis direction:** Forwards vs. backwards

**Approfondimento.**

- **Le due idee chiave.** L'*astrazione* rende finito il problema dimenticando i dettagli irrilevanti; il *calcolo di punto fisso* gestisce cicli e ricorsione iterando fino alla stabilità. Insieme danno analisi corrette per costruzione, e quindi incomplete (slide 14-20).
- **Sensibilità al flusso.** L'analisi dei segni era *flow-sensitive*: teneva uno stato separato in ogni punto del programma (\`x\` è Z prima del ciclo, NN alla loop head). Un'analisi *flow-insensitive* tiene un solo fatto per variabile per tutto il programma (come fanno molte analisi dei puntatori: "\`p\` può puntare ad \`a\` o a \`b\`"); è molto più economica e scala a milioni di righe, ma è meno precisa.
- **Sensibilità al percorso.** L'analisi dei segni ha unito i due rami alla loop end, dimenticando quale percorso era stato preso. Un'analisi *path-sensitive* tiene fatti separati per ogni percorso (o per ogni condizione di ramo), il che evita falsi allarmi come "\`p\` qui può essere NULL" quando il caso NULL era stato escluso da un controllo precedente sullo stesso percorso, a un costo che può crescere in modo esponenziale con il numero di rami. L'esecuzione simbolica e il testing concolico (Lezione 6, slide 30-31) sono per natura path-sensitive.
- **La direzione.** Le analisi *in avanti* propagano i fatti dall'ingresso seguendo l'esecuzione (segni, contaminazione, reaching definitions); quelle *all'indietro* li propagano dall'uscita contro il flusso (liveness: "questa variabile viene usata più avanti?"; oppure "quali input possono raggiungere questa chiamata pericolosa?").
- **Ritorno alla sicurezza.** Queste scelte distinguono gli scanner della Lezione 6: uno scanner testuale alla grep è l'estremo dell'imprecisione (nessuna semantica); una taint analysis è un'analisi del flusso in avanti su un dominio "contaminato / non contaminato"; un controllore dei limiti corretto è un interprete astratto sugli intervalli. La teoria spiega sia i loro falsi positivi (sovra-approssimazione, slide 21-26) sia i loro falsi negativi (scorciatoie volutamente non corrette, slide 14-20).
`;export{e as default};
